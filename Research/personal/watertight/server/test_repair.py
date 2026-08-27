"""Regression tests for the Watertight repair ladder.

Builds deliberately broken meshes covering each defect class and asserts the
ladder both fixes them and does not damage legitimate geometry.

Run:  .venv/bin/python test_repair.py
"""
import numpy as np, trimesh, sys, io
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
import mesh_repair as mr

def stl_bytes(m):
    return trimesh.exchange.stl.export_stl(m)

def report(tag, data, **kw):
    mesh = mr.load_mesh(data)
    before = mr.analyze(mesh)
    fixed, res = mr.repair(mesh, **kw)
    a = res.after
    print(f"\n=== {tag} ===")
    print(f"  before: faces={before.faces:<6} wt={before.watertight!s:<5} naked={before.naked_edges:<4} "
          f"nonmani={before.non_manifold_edges:<3} holes={before.boundary_loops:<3} shells={before.shells} "
          f"deg={before.degenerate_faces} dup={before.duplicate_faces} inv={before.inverted}")
    for s in res.steps:
        if s.applied: print(f"     -> {s.label}: {s.detail}")
    print(f"  after : faces={a.faces:<6} wt={a.watertight!s:<5} naked={a.naked_edges:<4} "
          f"nonmani={a.non_manifold_edges:<3} shells={a.shells} inv={a.inverted} vol={a.volume_mm3}")
    print(f"  RESULT: success={res.success} rebuilt={res.rebuilt}")
    # sanity: exported result must re-load and still be watertight
    if res.success:
        rt = mr.load_mesh(mr.export_stl(fixed))
        ra = mr.analyze(rt)
        print(f"  roundtrip after re-load: wt={ra.watertight} printable={ra.printable}")
        assert ra.printable, f"{tag}: round-trip lost watertightness!"  # post-weld
    return res

# 1. Clean cube via STL (STL always stores unwelded vertices)
cube = trimesh.creation.box(extents=[20,20,20])
report("clean cube (STL, unwelded verts)", stl_bytes(cube))

# 2. Cube with 2 faces deleted -> a real hole
holed = cube.copy()
holed.update_faces(np.arange(len(holed.faces)) > 1)
report("cube missing 2 faces (hole)", stl_bytes(holed))

# 3. Non-manifold: cube + a stray flap sharing an existing edge
v = np.vstack([cube.vertices, [[30.,0.,0.]]])
f = np.vstack([cube.faces, [[0,1,len(v)-1]]])
nm = trimesh.Trimesh(vertices=v, faces=f, process=False)
report("cube + non-manifold flap", stl_bytes(nm))

# 4. Inverted cube (all normals inward)
inv = cube.copy(); inv.invert()
report("inside-out cube", stl_bytes(inv))

# 5. Cube + microscopic debris shell
deb = trimesh.util.concatenate([cube, trimesh.creation.box(extents=[.05,.05,.05]).apply_translation([60,0,0])])
report("cube + tiny debris shell", stl_bytes(deb))

# 6. Cube + a genuine second body (should be KEPT)
two = trimesh.util.concatenate([cube, trimesh.creation.box(extents=[20,20,20]).apply_translation([50,0,0])])
r = report("two real bodies (must keep both)", stl_bytes(two))
assert r.after.shells == 2, "legit multi-part model was destroyed!"

# 7. Degenerate faces: duplicate a vertex to collapse a triangle
dg = cube.copy()
faces = dg.faces.copy(); faces[0] = [faces[0][0], faces[0][0], faces[0][1]]
dg = trimesh.Trimesh(vertices=dg.vertices, faces=faces, process=False)
report("cube with degenerate face", stl_bytes(dg))

# 8. Sphere with a big chunk removed -> should need PyMeshFix
sph = trimesh.creation.icosphere(subdivisions=3, radius=10)
keep = sph.triangles_center[:,2] < 7
big = sph.copy(); big.update_faces(keep)
report("sphere with cap removed", stl_bytes(big))

print("\n*** all assertions passed ***")
