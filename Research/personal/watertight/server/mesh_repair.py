#!/usr/bin/env python3
"""
Watertight -- STL mesh analysis and repair engine.

Builds on the PyMeshFix repair step from H3-pipeline.py, but wraps it in an
escalating ladder so that cheap, detail-preserving fixes are tried before the
mesh is rebuilt wholesale.

The ladder, in order:
    1. weld       -- merge coincident vertices (the usual cause of naked edges)
    2. cleanup    -- drop degenerate + duplicate faces, unreferenced vertices
    3. normals    -- make winding consistent and outward-facing
    4. debris     -- remove negligible stray shells (opt-in, tiny only)
    5. fill_holes -- close simple boundary loops (trimesh)
    6. meshfix    -- full PyMeshFix rebuild (last resort, guarantees closure)

Each rung stops the ladder as soon as the mesh is watertight, so a model that
only needed its vertices welded never gets rebuilt.

Used by watertight_server.py; also runnable directly:
    python3 mesh_repair.py input.stl -o output-FIXED.stl
"""

from __future__ import annotations

import io
import logging
from dataclasses import dataclass, field, asdict
from typing import Any

import numpy as np

log = logging.getLogger("watertight.repair")

# trimesh spams warnings about STL quirks that we already report ourselves.
logging.getLogger("trimesh").setLevel(logging.ERROR)

try:
    import trimesh
except ImportError as exc:  # pragma: no cover
    raise SystemExit("trimesh is required:  pip install trimesh") from exc

try:
    import pymeshfix

    HAVE_PYMESHFIX = True
except ImportError:  # pragma: no cover
    HAVE_PYMESHFIX = False
    log.warning("pymeshfix not installed; the final repair rung is unavailable")


# Stray shells smaller than this fraction of the largest shell's surface area
# are treated as scanning/modelling debris rather than real geometry.
DEBRIS_AREA_FRACTION = 0.001  # 0.1%

# Above this many boundary edges, a filled hole is big enough that spanning it
# flat visibly departs from the original surface, so we warn the student.
LARGE_HOLE_EDGES = 24


# ── Edge topology ─────────────────────────────────────────────────────────────

def _edge_counts(faces: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Return (unique undirected edges, how many faces use each)."""
    if len(faces) == 0:
        return np.empty((0, 2), dtype=np.int64), np.empty(0, dtype=np.int64)
    e = faces[:, [0, 1, 1, 2, 2, 0]].reshape(-1, 2)
    e = np.sort(e, axis=1)                      # undirected
    return np.unique(e, axis=0, return_counts=True)


def _degenerate_mask(mesh: "trimesh.Trimesh") -> np.ndarray:
    """True for faces with zero area or a repeated vertex index."""
    f = mesh.faces
    if len(f) == 0:
        return np.zeros(0, dtype=bool)
    repeated = (f[:, 0] == f[:, 1]) | (f[:, 1] == f[:, 2]) | (f[:, 0] == f[:, 2])
    # area_faces is exactly 0.0 for collapsed triangles
    zero_area = np.asarray(mesh.area_faces) <= 0.0
    return repeated | zero_area


def count_shells(mesh: "trimesh.Trimesh") -> int:
    """Number of connected surface components.

    Implemented directly rather than via trimesh's ``body_count``, which was
    observed returning 1 for two plainly disjoint boxes. Vertices joined by an
    edge are in the same shell; we count components over that graph.
    """
    if len(mesh.faces) == 0:
        return 0
    try:
        from scipy.sparse import coo_matrix
        from scipy.sparse.csgraph import connected_components

        edges, _ = _edge_counts(mesh.faces)
        n = int(len(mesh.vertices))
        if n == 0:
            return 0
        rows = np.concatenate([edges[:, 0], edges[:, 1]])
        cols = np.concatenate([edges[:, 1], edges[:, 0]])
        graph = coo_matrix(
            (np.ones(len(rows), dtype=np.int8), (rows, cols)), shape=(n, n)
        )
        n_comp, labels = connected_components(graph, directed=False)
        # Ignore isolated vertices that belong to no face.
        used = np.unique(mesh.faces)
        return int(len(np.unique(labels[used])))
    except Exception:
        try:
            return int(mesh.body_count)
        except Exception:
            return 1


# ── Analysis ──────────────────────────────────────────────────────────────────

@dataclass
class Analysis:
    """A snapshot of everything we can cheaply say about a mesh."""

    vertices: int = 0          # vertices after welding (what a slicer sees)
    raw_vertices: int = 0      # vertices as literally stored in the file
    unwelded_vertices: int = 0 # raw - welded; an STL format artifact, not a fault
    faces: int = 0
    watertight: bool = False
    winding_consistent: bool = False
    naked_edges: int = 0
    non_manifold_edges: int = 0
    degenerate_faces: int = 0
    duplicate_faces: int = 0
    unreferenced_vertices: int = 0
    shells: int = 0
    boundary_loops: int = 0
    inverted: bool = False
    volume_mm3: float | None = None
    area_mm2: float | None = None
    bbox_mm: list[float] = field(default_factory=list)
    printable: bool = False

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


def analyze(mesh: "trimesh.Trimesh", weld: bool = True) -> Analysis:
    """Measure a mesh without modifying it.

    Binary STL stores three standalone vertices per triangle and no vertex
    sharing whatsoever, so a pristine cube read straight off disk looks like it
    has 36 naked edges and 12 holes. Every real slicer merges coincident
    vertices on import, so topology is only meaningful after welding: we
    measure a welded *copy* and report the weld itself as information rather
    than as a defect. Pass weld=False to see the file exactly as stored.
    """
    a = Analysis()
    a.raw_vertices = int(len(mesh.vertices))

    if weld:
        mesh = mesh.copy()
        mesh.merge_vertices()

    a.vertices = int(len(mesh.vertices))
    a.unwelded_vertices = max(0, a.raw_vertices - a.vertices)
    a.faces = int(len(mesh.faces))

    edges, counts = _edge_counts(mesh.faces)
    a.naked_edges = int(np.count_nonzero(counts == 1))
    a.non_manifold_edges = int(np.count_nonzero(counts > 2))

    a.watertight = bool(mesh.is_watertight)
    a.winding_consistent = bool(mesh.is_winding_consistent)
    a.degenerate_faces = int(np.count_nonzero(_degenerate_mask(mesh)))

    # Count the redundant copies only: total faces minus the distinct ones.
    try:
        a.duplicate_faces = int(len(mesh.faces) - int(np.count_nonzero(mesh.unique_faces())))
    except Exception:
        a.duplicate_faces = 0

    referenced = np.zeros(len(mesh.vertices), dtype=bool)
    if len(mesh.faces):
        referenced[np.unique(mesh.faces)] = True
    a.unreferenced_vertices = int(np.count_nonzero(~referenced))

    a.shells = count_shells(mesh)

    # Each naked-edge loop is one hole; count loops, not edges.
    a.boundary_loops = _count_boundary_loops(edges, counts)

    a.area_mm2 = float(mesh.area)
    if a.watertight:
        vol = float(mesh.volume)
        a.volume_mm3 = abs(vol)
        # A closed mesh with negative volume is inside-out.
        a.inverted = vol < 0
    a.bbox_mm = [float(x) for x in mesh.extents] if len(mesh.vertices) else []

    # "Printable" is the promise we make to the student.
    a.printable = (
        a.watertight
        and a.winding_consistent
        and not a.inverted
        and a.naked_edges == 0
        and a.non_manifold_edges == 0
        and a.degenerate_faces == 0
    )
    return a


def _count_boundary_loops(edges: np.ndarray, counts: np.ndarray) -> int:
    """Count connected loops among the naked edges -- i.e. the number of holes."""
    naked = edges[counts == 1]
    if len(naked) == 0:
        return 0
    # Union-find over the vertices touched by naked edges.
    parent: dict[int, int] = {}

    def find(x: int) -> int:
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x: int, y: int) -> None:
        rx, ry = find(x), find(y)
        if rx != ry:
            parent[rx] = ry

    for u, v in naked:
        union(int(u), int(v))
    return len({find(v) for v in parent})


# ── Repair ────────────────────────────────────────────────────────────────────

class NoChange:
    """Returned by a rung that ran but could not change anything.

    Distinct from returning None ("there was nothing here to fix"), so the
    report can say *why* a rung left the mesh alone.
    """

    __slots__ = ("reason",)

    def __init__(self, reason: str):
        self.reason = reason


@dataclass
class Step:
    """One rung of the ladder, as reported back to the UI."""

    name: str
    label: str
    applied: bool
    detail: str
    faces_before: int
    faces_after: int


class RepairResult:
    def __init__(self, before: Analysis):
        self.before = before
        self.after: Analysis | None = None
        self.steps: list[Step] = []
        self.rebuilt = False       # did we fall back to PyMeshFix?
        self.success = False
        self.warnings: list[str] = []

    def as_dict(self) -> dict[str, Any]:
        return {
            "before": self.before.as_dict(),
            "after": self.after.as_dict() if self.after else None,
            "steps": [asdict(s) for s in self.steps],
            "rebuilt": self.rebuilt,
            "success": self.success,
            "warnings": self.warnings,
        }


def load_mesh(data: bytes) -> "trimesh.Trimesh":
    """Parse STL bytes into a single Trimesh, concatenating any scene parts.

    process=False keeps trimesh from silently welding vertices, so that our
    analysis reports the file as it actually is on disk.
    """
    obj = trimesh.load(
        io.BytesIO(data), file_type="stl", process=False, force="mesh"
    )
    if isinstance(obj, trimesh.Scene):
        parts = [g for g in obj.geometry.values() if isinstance(g, trimesh.Trimesh)]
        if not parts:
            raise ValueError("no triangle geometry found in file")
        obj = trimesh.util.concatenate(parts)
    if not isinstance(obj, trimesh.Trimesh):
        raise ValueError("file did not contain a triangle mesh")
    if len(obj.faces) == 0:
        raise ValueError("mesh contains no faces")
    return obj


def repair(mesh: "trimesh.Trimesh", drop_debris: bool = True,
           allow_rebuild: bool = True) -> tuple["trimesh.Trimesh", RepairResult]:
    """Run the escalating ladder. Returns (repaired mesh, report)."""
    before = analyze(mesh)
    res = RepairResult(before)
    m = mesh.copy()

    def rung(name: str, label: str, fn) -> bool:
        """Run one rung, record what it did, and report whether we can stop."""
        fb = len(m.faces)
        try:
            detail = fn()
        except Exception as exc:                      # never let one rung kill the run
            log.exception("rung %s failed", name)
            res.warnings.append(f"{label} failed: {exc}")
            res.steps.append(Step(name, label, False, f"failed: {exc}", fb, len(m.faces)))
            return False
        if isinstance(detail, NoChange):
            applied, text = False, detail.reason
        else:
            applied = detail is not None
            text = detail or "nothing to do"
        res.steps.append(Step(name, label, applied, text, fb, len(m.faces)))
        return bool(m.is_watertight and m.is_winding_consistent)

    # 1. Weld coincident vertices -- by far the most common cause of naked edges
    #    in exported STLs, since STL stores no vertex sharing at all.
    def _weld():
        v0 = len(m.vertices)
        m.merge_vertices()
        merged = v0 - len(m.vertices)
        if not merged:
            return None
        return (f"merged {merged:,} coincident vertices "
                f"({v0:,} -> {len(m.vertices):,}); normal for the STL format")

    # Framed as normalisation, not a fault: every STL needs this.
    done = rung("weld", "Weld coincident vertices", _weld)

    # 2. Structural cleanup -- degenerate and duplicate faces confuse slicers
    #    even when the surface is otherwise closed, so always run this.
    def _cleanup():
        notes = []
        deg = _degenerate_mask(m)
        if deg.any():
            m.update_faces(~deg)
            notes.append(f"removed {int(deg.sum()):,} degenerate faces")
        n0 = len(m.faces)
        m.update_faces(m.unique_faces())
        if len(m.faces) < n0:
            notes.append(f"removed {n0 - len(m.faces):,} duplicate faces")
        v0 = len(m.vertices)
        m.remove_unreferenced_vertices()
        if len(m.vertices) < v0:
            notes.append(f"dropped {v0 - len(m.vertices):,} unused vertices")
        return "; ".join(notes) if notes else None

    done = rung("cleanup", "Remove degenerate & duplicate faces", _cleanup) or done

    # 3. Normals -- a closed mesh with inconsistent or inward winding still
    #    prints wrong, so this runs even if we are already watertight.
    def _normals():
        if m.is_winding_consistent and not (m.is_watertight and m.volume < 0):
            return None
        trimesh.repair.fix_normals(m)
        return "unified winding and flipped normals outward"

    done = rung("normals", "Fix face winding & normals", _normals) or done

    # 4. Debris -- tiny disconnected shells. Deliberately conservative: only
    #    shells under DEBRIS_AREA_FRACTION of the biggest one, so genuine
    #    multi-part models survive intact.
    if drop_debris:
        def _debris():
            try:
                parts = m.split(only_watertight=False)
            except Exception:
                return None
            if len(parts) < 2:
                return None
            areas = np.array([p.area for p in parts])
            keep = areas >= areas.max() * DEBRIS_AREA_FRACTION
            if keep.all():
                res.warnings.append(
                    f"Model has {len(parts)} separate shells; all look intentional "
                    "and were kept."
                )
                return None
            kept = trimesh.util.concatenate([p for p, k in zip(parts, keep) if k])
            removed = int((~keep).sum())
            m.__dict__.update(kept.__dict__)   # replace geometry in place
            return f"removed {removed} negligible stray shell(s)"

        done = rung("debris", "Discard stray shells", _debris) or done

    # 5. Fill simple holes. Cheap and detail-preserving; handles the common
    #    case of a few missing triangles.
    if not (m.is_watertight and m.is_winding_consistent):
        def _fill():
            before_naked = int(np.count_nonzero(_edge_counts(m.faces)[1] == 1))
            if before_naked == 0:
                return None
            loops_before = _count_boundary_loops(*_edge_counts(m.faces))
            trimesh.repair.fill_holes(m)
            after_naked = int(np.count_nonzero(_edge_counts(m.faces)[1] == 1))
            closed = before_naked - after_naked
            if closed <= 0:
                # trimesh only spans 3- and 4-edge openings; anything bigger
                # is left for the PyMeshFix rung below.
                return NoChange(
                    f"{before_naked:,} boundary edges across {loops_before} "
                    "opening(s) were too complex for simple filling"
                )
            # A boundary loop can only be spanned, so a large or non-planar
            # opening gets bridged flat -- geometrically valid but it will not
            # restore original curvature. Worth saying out loud.
            if closed > LARGE_HOLE_EDGES:
                res.warnings.append(
                    f"Some holes were large ({closed:,} boundary edges across "
                    f"{loops_before} opening(s)). They were spanned flat, so "
                    "curvature there will not match the original surface."
                )
            return f"closed {closed:,} naked edges across {loops_before} hole(s)"

        done = rung("fill_holes", "Fill simple holes", _fill) or done
    else:
        res.steps.append(Step("fill_holes", "Fill simple holes", False,
                              "skipped -- already closed", len(m.faces), len(m.faces)))

    # 6. Last resort: PyMeshFix. Guarantees a closed manifold but rebuilds the
    #    surface, so we only reach here if the mesh is still open.
    still_open = not (m.is_watertight and m.is_winding_consistent)
    if still_open and allow_rebuild and HAVE_PYMESHFIX:
        def _meshfix():
            mf = pymeshfix.MeshFix(
                np.asarray(m.vertices, dtype=np.float64),
                np.asarray(m.faces, dtype=np.int32),
            )
            # remove_smallest_components=False: keep every body. The default
            # (True) deletes all but the largest shell, which would silently
            # destroy legitimate multi-part models.
            mf.repair(joincomp=True, remove_smallest_components=False)
            rebuilt = trimesh.Trimesh(
                vertices=np.asarray(mf.points),
                faces=np.asarray(mf.faces),
                process=False,
            )
            if len(rebuilt.faces) == 0:
                raise ValueError("PyMeshFix returned an empty mesh")
            rebuilt.merge_vertices()
            trimesh.repair.fix_normals(rebuilt)
            m.__dict__.update(rebuilt.__dict__)
            res.rebuilt = True
            return "rebuilt surface as a closed manifold"

        rung("meshfix", "Rebuild as closed manifold (PyMeshFix)", _meshfix)
    else:
        if still_open and not HAVE_PYMESHFIX:
            res.warnings.append(
                "PyMeshFix is not installed on the server, so the final repair "
                "stage was unavailable."
            )
        reason = ("skipped -- not needed" if not still_open
                  else "unavailable" if not HAVE_PYMESHFIX
                  else "skipped -- rebuild disabled")
        res.steps.append(Step("meshfix", "Rebuild as closed manifold (PyMeshFix)",
                              False, reason, len(m.faces), len(m.faces)))

    res.after = analyze(m)
    res.success = res.after.printable

    if res.rebuilt:
        res.warnings.append(
            "The mesh had to be rebuilt to close it. Fine surface detail and any "
            "hollow interior may have changed -- compare against your original."
        )
    if res.after.shells > 1:
        res.warnings.append(
            f"The result has {res.after.shells} separate shells. That is fine if "
            "the model is genuinely multi-part."
        )
    if not res.success:
        res.warnings.append(
            "The mesh is still not fully watertight. It likely needs manual "
            "attention in your modelling tool."
        )
    return m, res


def export_stl(mesh: "trimesh.Trimesh") -> bytes:
    """Serialise to binary STL."""
    return trimesh.exchange.stl.export_stl(mesh)


# ── CLI ───────────────────────────────────────────────────────────────────────

def _main() -> int:
    import argparse
    import json
    from pathlib import Path

    ap = argparse.ArgumentParser(description="Analyse and repair an STL mesh")
    ap.add_argument("input", help="input .stl")
    ap.add_argument("-o", "--output", help="output .stl (default <name>-FIXED.stl)")
    ap.add_argument("--analyze-only", action="store_true", help="report, do not fix")
    ap.add_argument("--no-rebuild", action="store_true",
                    help="never fall back to PyMeshFix")
    ap.add_argument("--keep-debris", action="store_true",
                    help="keep tiny stray shells")
    ap.add_argument("--json", action="store_true", help="emit the report as JSON")
    args = ap.parse_args()

    src = Path(args.input)
    mesh = load_mesh(src.read_bytes())

    if args.analyze_only:
        report = analyze(mesh).as_dict()
        print(json.dumps(report, indent=2) if args.json else _pretty(report))
        return 0

    fixed, res = repair(mesh, drop_debris=not args.keep_debris,
                        allow_rebuild=not args.no_rebuild)
    out = Path(args.output) if args.output else src.with_name(f"{src.stem}-FIXED.stl")
    out.write_bytes(export_stl(fixed))

    if args.json:
        print(json.dumps(res.as_dict(), indent=2))
    else:
        print(f"Before: {_pretty(res.before.as_dict())}")
        for s in res.steps:
            print(f"  [{'x' if s.applied else ' '}] {s.label}: {s.detail}")
        print(f"After:  {_pretty(res.after.as_dict())}")
        print(f"{'OK -- watertight' if res.success else 'STILL NOT WATERTIGHT'} -> {out}")
    return 0 if res.success else 1


def _pretty(d: dict) -> str:
    return (f"{d['faces']:,} faces, watertight={d['watertight']}, "
            f"naked={d['naked_edges']}, non-manifold={d['non_manifold_edges']}, "
            f"shells={d['shells']}")


if __name__ == "__main__":
    raise SystemExit(_main())
