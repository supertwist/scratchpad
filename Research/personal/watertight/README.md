# Watertight

Makes student `.STL` files printable: no holes, no naked edges, no non-manifold
edges. A dropzone, a plain-English report, and a `-FIXED.stl` in the Downloads
folder.

**Live since 2026-08-28** at `http://100.105.251.86:8765` on the Mac mini
(account `gitlabadmin`, no authentication, 2 workers, 150 MB cap). Operational
changes — auth, power, workers, Funnel — are in
[docs/OPERATIONS.md](docs/OPERATIONS.md).

**Students use a browser** — the server serves the whole interface, so it works
on Mac, Windows, iPad, and Linux with nothing to install and no code signing.
The Electron app is an optional macOS wrapper around the same API.

Built on the PyMeshFix repair step from `../H3-pipeline.py`, wrapped in an
escalating ladder so light damage gets a light fix.

```
watertight/
├── server/          FastAPI service + repair engine + web UI (on the Mac mini)
├── app/             Electron desktop app (macOS, optional)
├── shared/          UI code shared by the app and the browser (edit here)
├── sync.sh          copies shared/ into server/static and app/renderer
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
cd server && ./install.sh --no-auth     # or --token <secret> to require one
```

Students then open `http://100.105.251.86:8765` in any browser. Nothing else to
install or distribute.

**Optional Mac app:**

```bash
cd app && npm install && npm run dist
# -> app/dist/Watertight-1.0.0-arm64.dmg
```

**Run the app against a local server while developing:**

```bash
cd server && WATERTIGHT_TOKEN=dev PORT=8765 .venv/bin/python watertight_server.py
cd app && npm start          # then set the server to http://127.0.0.1:8765, token "dev"
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

# the served web page, driven in a real Chromium: drop -> report -> download
cd app && SERVER=http://127.0.0.1:8799 STL=/path/model.stl \
  ./node_modules/.bin/electron test/web-e2e.js

# the Mac app, exercising the real main.js, IPC and native save
cd app && SERVER=http://127.0.0.1:8799 TOKEN=dev STL=/path/model.stl \
  ./node_modules/.bin/electron test/e2e-main.js
```

Both e2e tests redirect userData and downloads into `/tmp`, so they cannot
touch your real settings or Downloads folder. `web-e2e.js` also asserts the
page does not overflow horizontally, which is how phone and iPad widths get
checked.

## Editing the UI

`shared/watertight.css` and `shared/core.js` are the originals. Both the server
and the app get **copies** via `sync.sh` (the Electron packager can only bundle
files under `app/`, and FastAPI serves from `server/static/`). `npm start` and
`npm run dist` sync automatically; run `./sync.sh` by hand if you edited
`shared/` and are testing the server alone.

## Known limits

- **Self-intersecting geometry is not detected.** It needs CGAL-class tooling.
  Most slicers cope; a model that slices strangely despite reporting watertight
  is the likely case.
- **Wall thickness is not checked.** A watertight model can still be too thin
  to print.
- **Units are not inferred.** STL is unitless; Watertight never rescales, so
  whatever your modeller exported is what you get back.
- **The optional Mac app is unsigned**, so first launch needs right-click →
  Open. This is the main reason the browser is the recommended path.
- **No authentication by default.** `--no-auth` leaves the service open to
  anyone who can reach it. Fine on a private tailnet; a deliberate risk with
  Funnel. `./install.sh --token <secret>` turns it on with no client changes.
- **The mini must be logged in.** The service is a LaunchAgent — see
  MINI-SETUP.md step 7.
