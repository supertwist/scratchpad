# Watertight

Makes student `.STL` files printable: no holes, no naked edges, no non-manifold
edges. A dropzone, a plain-English report, and a `-FIXED.stl` in the Downloads
folder.

**Live since 2026-08-28** on the Mac mini (account `gitlabadmin`, 2 workers,
50 MB cap, token auth on). Public via Tailscale Funnel since 2026-08-31:

- Students: `https://jamess-mac-mini.taila003e7.ts.net` (any network, token required)
- On the tailnet: `http://100.105.251.86:8765`

Operational changes — auth, power, workers, Funnel — are in
[docs/OPERATIONS.md](docs/OPERATIONS.md).

**Students use a browser** — the server serves the whole interface, so it works
on Mac, Windows, iPad, and Linux with nothing to install and no code signing.

Built on the PyMeshFix repair step from `../H3-pipeline.py`, wrapped in an
escalating ladder so light damage gets a light fix.

```
watertight/
├── server/          FastAPI service + repair engine + web UI (on the Mac mini)
├── shared/          canonical browser UI code (edit here)
├── sync.sh          copies shared/ into server/static
└── docs/
    ├── OPERATIONS.md      change settings on the live server <- start here
    ├── MINI-SETUP.md      first-time install, from scratch
    ├── STUDENT-GUIDE.md   hand this to students
    └── REMOTE-ACCESS.md   SSH access to the mini, and its gotchas
```

## How the repair works

Six rungs, each attempted only if the mesh is still not closed. The point is
that a model needing only welded vertices never gets rebuilt.

| Rung | Fixes | Destructive? |
|---|---|---|
| 1. Weld coincident vertices | naked edges caused by the STL format itself | no |
| 2. Remove degenerate & duplicate faces | zero-area and repeated triangles | no |
| 3. Fix winding & normals | inconsistent or inward-facing normals | no |
| 4. Discard stray shells | scanning debris under 0.1% of the model | only tiny fragments |
| 5. Fill simple holes | small openings (3–4 edges) | spans the opening |
| 6. Rebuild with PyMeshFix | anything still open | **yes — rebuilds the surface** |

Two deliberate choices worth knowing about:

- **Topology is measured *after* welding.** Binary STL stores three standalone
  vertices per triangle and no sharing, so a pristine cube read straight off
  disk shows 36 naked edges and 12 holes. Every real slicer welds on import, so
  reporting the raw numbers would flag every good file as broken.
- **PyMeshFix runs with `remove_smallest_components=False`.** The library's
  default deletes all but the largest shell, which would silently destroy
  legitimate multi-part models.

## Quick start

**Server** (on the mini — see [docs/MINI-SETUP.md](docs/MINI-SETUP.md)):

```bash
cd server && ./install.sh --token <secret>     # or --no-auth for an open server
```

Students then open the Funnel URL in any browser. Nothing else to install or
distribute.

**Run a local server while developing:**

```bash
cd server && WATERTIGHT_TOKEN=dev PORT=8765 .venv/bin/python watertight_server.py
# then open http://127.0.0.1:8765
```

## Command line

The engine works standalone, which is handy for batch work:

```bash
cd server
.venv/bin/python mesh_repair.py model.stl                  # -> model-FIXED.stl
.venv/bin/python mesh_repair.py model.stl --analyze-only --json
.venv/bin/python mesh_repair.py model.stl --no-rebuild      # never use PyMeshFix
.venv/bin/python mesh_repair.py model.stl --keep-debris     # keep stray shells

for f in *.stl; do .venv/bin/python mesh_repair.py "$f"; done
```

Exit code is 0 if the result is watertight, 1 if not.

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | liveness and capabilities; no auth |
| `POST /api/analyze` | report only, mesh unchanged |
| `POST /api/repair` | fixed STL as the body, report in `X-Watertight-Report` |
| `GET /` | the browser UI |

```bash
curl -H "Authorization: Bearer $TOKEN" -F "file=@model.stl" \
     -D headers.txt -o model-FIXED.stl \
     http://100.105.251.86:8765/api/repair
grep -i '^x-watertight-report:' headers.txt | cut -d' ' -f2- | python3 -m json.tool
```

## Tests

```bash
# repair-ladder regressions: 8 deliberately broken meshes
cd server && ../.venv/bin/python test_repair.py
```

There is currently **no automated browser test**. The Chromium-driven page test
(drop -> report -> download, plus a horizontal-overflow assertion for phone and
iPad widths) lived in the removed Electron app and used its bundled Electron as
the driver; recover it from git history at `app/test/web-e2e.js` in `2bbf1ad` if
you port it to Playwright.

## Editing the UI

`shared/watertight.css` and `shared/core.js` are the originals; `server/static/`
gets **copies** via `sync.sh`, because FastAPI serves from `server/static/`. Run
`./sync.sh` after editing anything in `shared/`.

## Known limits

- **Self-intersecting geometry is not detected.** It needs CGAL-class tooling.
  Most slicers cope; a model that slices strangely despite reporting watertight
  is the likely case.
- **Wall thickness is not checked.** A watertight model can still be too thin
  to print.
- **Units are not inferred.** STL is unitless; Watertight never rescales, so
  whatever your modeller exported is what you get back.
- **A single shared token is the only access control.** One leaked token means
  public access until it is rotated, and there is no per-student revocation.
  `--no-auth` removes even that — fine on a private tailnet, but never with
  Funnel, which is on the public internet.
- **The mini must be logged in.** The service is a LaunchAgent — see
  MINI-SETUP.md step 7.
