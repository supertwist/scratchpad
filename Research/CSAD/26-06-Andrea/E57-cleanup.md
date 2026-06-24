---
Model: Claude Sonnet 4.6 (1M context)
Prompt: "provide a set of instructions for: importing a point cloud in `.E57` format to Rhino; removing extraneous points captured (which tools or commands allow me to select and delete points?); converting the point cloud into a mesh (what is the command?); ensuring the mesh has non-manifold surfaces and is watertight (are the simple commands that can speed up the process?). Create a table with the approximate sequence; each row should include the name of the tool or command, a brief description of usage and parameters, and a link to a source in the documentation; check that all links are valid (not 404, and the content of the linked document matches the summary). Save as `E57-cleanup.md` to the current working directory. Prepend the model used, the prompt, and the date it was generated to the beginning of the document."
Date: 26/06/24
---

# Rhino E57 Point Cloud → Clean Mesh Workflow

This document covers the end-to-end process of importing a `.E57` laser scan into Rhino 8, removing unwanted points, converting to a polygon mesh, and repairing the mesh so it is **manifold and watertight** (no naked edges, no non-manifold edges, all normals consistent).

> **Note on "non-manifold":** A watertight mesh requires *manifold* topology — every edge shared by exactly two faces. Non-manifold edges (three or more faces sharing one edge) prevent watertightness. The repair steps below identify and eliminate them.

---

## Workflow Table

| # | Phase | Command / Tool | Description & Key Parameters | Documentation |
|---|-------|----------------|-------------------------------|---------------|
| 1 | **Import** | `Import` | **File › Import** (or drag-and-drop). Rhino 8 supports E57 natively on Windows and Mac. In the dialog select the `.e57` file and click Open; accept default import settings for most scans. The file is parsed into one or more PointCloud objects. | [E57 file import — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/fileio/e57_import.htm) |
| 2 | **Consolidate** | `PointCloud` | If the import produces many individual point objects, run `PointCloud` and select them all to merge into a single managed PointCloud object. This dramatically improves display performance and makes subsequent selection easier. Sub-options: **Add** (incorporate more points), **Remove** (delete selected points from the cloud). | [PointCloud — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/pointcloud.htm) |
| 3 | **Reduce density** | `ReducePointCloud` | Thins the cloud by randomly removing a specified number or percentage of points. Run this before manual editing to reduce visual clutter. Parameter: **Count** — the number of points to remove (enter directly or drag the slider). Useful for scans with millions of redundant overlapping points. | [ReducePointCloud — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/reducepointcloud.htm) |
| 4 | **Select unwanted points** | `SelBrush` / `SelBox` / `Lasso` / `SelVolumeSphere` | Paint or window-select subsets of the point cloud to isolate extraneous geometry (floors, scaffolding, scanner artefacts). **SelBrush** — drag a thick brush stroke to paint-select. **SelBox** — drag a 3D box volume. **Lasso** — sketch an irregular 2D boundary. **SelVolumeSphere** — select inside/outside/crossing a sphere. Combine with **Selection Filters** to restrict picking to PointCloud sub-objects only. | [Selection commands — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/selection_commands.htm) |
| 5 | **Delete selected points** | `PointCloud` › **Remove** / `Delete` key | With extraneous points selected, run `PointCloud` and choose **Remove** to strip them from the cloud (they can be converted to a new PointCloud or discarded). Alternatively, press `Delete` to discard immediately. Repeat steps 4–5 iteratively until only the geometry of interest remains. | [PointCloud — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/pointcloud.htm) |
| 6 | **Convert to mesh** | `MeshFromPoints` | Select the cleaned PointCloud, then run `MeshFromPoints`. Rhino computes a Delaunay triangulation from the point positions and outputs a polygon mesh. Key parameters in the dialog: **MaxEdgeLength** (caps the longest triangle edge — smaller values = finer mesh but more faces), **MaxTriangleCount** (overall cap). Increase **MaxEdgeLength** if the mesh is too dense for downstream editing. | [MeshFromPoints — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/meshfrompoints.htm) |
| 7 | **Diagnose mesh** | `Check` | Select the new mesh and run `Check`. Rhino reports structural errors including naked edges, non-manifold edges, degenerate faces, zero-length edges, and duplicate faces. Note the specific error types before repairing — the report guides which repair commands to run. | [Check — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/check.htm) |
| 8 | **Automated repair** | `MeshRepair` | Opens the **Mesh Repair panel** — the fastest path for common defects. Click **Check Mesh** to re-diagnose, then **Repair** to auto-fix: degenerate faces, duplicate faces, non-manifold edges (extracted and repaired), and inconsistent normals. Use **Advanced Repair Tools** (Fill, Align Edges, Swap Edge, Delete Face) for problems the auto-pass cannot resolve. Click **Next** when clean, then **Finish**. | [MeshRepair — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/meshrepair.htm) |
| 9 | **Fill holes** | `FillMeshHoles` | Fills every open boundary loop (naked edge ring) in the mesh with new triangulated faces in a single operation. No parameters — select the mesh and run. For finer control over individual holes use `FillMeshHole` (click each hole boundary manually). After filling, the mesh should have zero naked edges. | [FillMeshHoles — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/fillmeshholes.htm) |
| 10 | **Merge vertices** | `Weld` | Removes seams by merging coincident mesh vertices that fall within an angle tolerance. For a fully smooth, closed mesh use **angle = 180°** (welds all adjacent vertices regardless of crease angle). This closes gaps left between mesh patches and is a prerequisite for watertightness. Caution: welding destroys per-vertex texture/color data. | [Weld — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/weld.htm) |
| 11 | **Unify normals** | `UnifyMeshNormals` | Flips mesh face normals so they all point in a consistent outward direction. Select the mesh and run — Rhino automatically orients all faces. If the result is inverted, run `Flip` to reverse. Always run *after* welding and hole-filling, not before. Consistent normals are required for correct shading, Boolean operations, and STL/3D-print export. | [UnifyMeshNormals — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/unifymeshnormals.htm) |
| 12 | **Final check** | `Check` | Re-run `Check` on the repaired mesh to confirm: zero naked edges, zero non-manifold edges, zero degenerate faces. A mesh that passes with no errors reported is manifold and watertight. | [Check — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/check.htm) |

---

## Quick-Reference Order

```
Import (.e57) → PointCloud (consolidate) → ReducePointCloud → 
Select (SelBrush / SelBox / Lasso) → Delete/Remove → 
MeshFromPoints → Check → MeshRepair → FillMeshHoles → 
Weld (180°) → UnifyMeshNormals → Check (verify)
```

## Notes

- **E57 native support** was added in Rhino 7 (Windows) and ported to Rhino 8 Mac. No plugin is required.
- **ReducePointCloud** is optional but strongly recommended for scans above ~5 million points before attempting `MeshFromPoints`.
- **MeshRepair** (step 8) subsumes several individual commands (`FillMeshHoles`, `UnifyMeshNormals`, `CullDegenerateMeshFaces`). Run the full wizard first; use the individual commands for targeted re-work afterward.
- For complex organic geometry with large holes, consider the **Patch** command (creates a NURBS surface fitted to the point cloud) or third-party plugins (e.g. **Rhino.Inside**, **Scan&Solve**, **QuadRemesh** post-mesh) depending on downstream use.

---

## Aligning Multiple E57 Scans

This table covers the workflow for importing, aligning, and merging two or more scan files (e.g. multiple scanner positions of the same object or space) before proceeding to the mesh-repair steps above.

> **Important limitation:** Rhino has no built-in ICP (Iterative Closest Point) automatic registration. For fully automated alignment without known reference targets, pre-register scans in dedicated software (CloudCompare — free and open-source; Autodesk ReCap; Faro Scene; Leica Cyclone) and import the pre-aligned result into Rhino. The workflow below covers manual target-based registration inside Rhino.

| # | Phase | Command / Tool | Description & Key Parameters | Documentation |
|---|-------|----------------|-------------------------------|---------------|
| 1 | **Organize layers** | `Layer` | Before importing, create one named layer per scan (e.g. `scan-01`, `scan-02`). Set each layer's current state so imports land on the correct layer. This lets you toggle, lock, or transform individual scans independently throughout alignment. | [Layer — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/layer.htm) |
| 2 | **Import each scan** | `Import` | Import scans one at a time via **File › Import**, assigning each to its designated layer. Rhino 8 supports multiple E57 imports in a single session. One scan becomes the **reference** (stays fixed); all others are **moving** scans to be aligned to it. | [E57 file import — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/fileio/e57_import.htm) |
| 3 | **Mark reference targets** | `Point` | Place point objects at three or more known registration anchors that appear in the overlap zone of adjacent scans — e.g. scan sphere centers, checkerboard corners, or fixed architectural features. Snap to the visible point locations in the reference scan. These become the source/target triplets for Orient3Pt. | [Point — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/point.htm) |
| 4 | **Coarse alignment** | `Move` + `Rotate` / Gumball | Before running Orient3Pt, drag each moving scan roughly into position using `Move` (translate) and `Rotate` (spin around an axis). The Gumball widget provides interactive 6-DOF manipulation in the viewport. Coarse positioning ensures Orient3Pt's three-point pick is not confused by overlapping geometry from two un-registered scans. | [Move — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/move.htm) |
| 5 | **Precise 3-point registration** | `Orient3Pt` | Select the moving scan, run `Orient3Pt`, then pick **three reference points** on the moving scan (the targets marked in step 3), followed by the **three corresponding target points** on the reference scan. Rhino transforms the moving scan to match. Parameters: **Copy** — move vs. duplicate (use Move for registration); **Scale** — auto-scale based on point spacing (leave **off** for scan registration; scans are already at true scale). Repeat for each additional scan. | [Orient3Pt — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/orient3pt.htm) |
| 6 | **Verify overlap** | `PointCloudSection` | Cut a planar cross-section through a known overlap region. Select both scan clouds and run `PointCloudSection`; pick a cutting plane. The command outputs curves — compare sections from adjacent scans to check alignment quality. Persistent gaps or offsets indicate the registration needs refinement; return to step 5 with better target picks. | [PointCloudSection — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/pointcloudsection.htm) |
| 7 | **Merge into one cloud** | `PointCloud` › **Add** | Once all scans are aligned, select all PointCloud objects and run `PointCloud`, then choose **Add** to absorb them into a single managed cloud. The merged cloud is now ready for the single-scan cleanup workflow (steps 3–5 of the main table above). | [PointCloud — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/pointcloud.htm) |
| 8 | **Reduce overlap density** | `ReducePointCloud` | Scan overlap zones accumulate double (or triple) point density. Run `ReducePointCloud` on the merged cloud to thin it to a uniform density before meshing. Parameter: **Count** — number of points to remove. | [ReducePointCloud — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/reducepointcloud.htm) |
| 9 | **Mesh the merged cloud** | `MeshFromPoints` *or* `ShrinkWrap` | Two options: **MeshFromPoints** — direct Delaunay triangulation (see main workflow step 6). **ShrinkWrap** (Rhino 8) — wraps a new closed mesh around all input geometry simultaneously, including mixed clouds, meshes, and surfaces; fills holes automatically. ShrinkWrap is preferable when scans have gaps or the object has complex internal topology. Parameters: **Target Edge Length** (output triangle size), **Fill Holes** (on by default), **Offset** (expand/shrink wrap distance). | [MeshFromPoints — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/meshfrompoints.htm) · [ShrinkWrap — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/shrinkwrap.htm) |
| 10 | **Join separate meshes** | `Join` | If each scan was meshed independently before merging, select all mesh objects and run `Join` to combine them into one. Use the **JoinDisjointMeshes** sub-option to align naked vertices within tolerance even where meshes don't touch. After joining, continue from step 7 (MeshRepair) of the main workflow. | [Join — Rhino 8](https://docs.mcneel.com/rhino/8/help/en-us/commands/join.htm) |

---

### Multi-Scan Quick-Reference Order

```
Layer setup → Import each E57 (one per layer) → Mark targets (Point) →
Coarse align (Move / Rotate) → Orient3Pt (×n scans) →
Verify (PointCloudSection) → Merge (PointCloud > Add) →
ReducePointCloud → MeshFromPoints or ShrinkWrap →
Join → → continue at MeshRepair (main workflow step 8)
```
