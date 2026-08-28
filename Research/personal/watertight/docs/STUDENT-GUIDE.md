# Watertight — student guide

Watertight checks a 3D model for the problems that make prints fail, fixes what
it can, and hands you back a printable file.

## Using it

**Open the address your instructor gave you in any browser.** That's it —
nothing to install, and it works on Mac, Windows, iPad, and Linux.

- On the tailnet: `http://100.105.251.86:8765`
- From anywhere: the `https://….ts.net` address

> If the address starts with `100.`, you need to be **connected to Tailscale**
> for it to work. The `https://` address works from any network.

**Drag an `.stl` file onto the page.** That's the whole workflow.

Watertight will:

1. analyse the mesh
2. repair what it can
3. download the result as `yourfile-FIXED.stl` to wherever your browser
   normally puts downloads

Add it to your bookmarks bar, or use your browser's "Add to Dock" / "Install"
option to get an icon that opens it like an app.

## Reading the results

**The verdict at the top is the part that matters:**

| What it says | What to do |
|---|---|
| **Watertight and ready to print** | Print it. Your detail was preserved. |
| **Already watertight** | Your file was fine to begin with. |
| **Watertight, but the mesh had to be rebuilt** | Printable, but **look at it first** — see below. |
| **Could not make this watertight** | Needs manual work. Ask for help. |

### What the numbers mean

| Term | Meaning | Why it breaks a print |
|---|---|---|
| **Watertight** | The surface is completely sealed, like a balloon | A slicer cannot tell inside from outside, so it produces garbage or nothing |
| **Naked edges** | Edges belonging to only one triangle — the border of a hole | The surface is open |
| **Holes** | Groups of naked edges forming an opening | Same |
| **Non-manifold edges** | Edges shared by three or more triangles | Ambiguous geometry; slicers disagree about what is solid |
| **Degenerate faces** | Triangles with zero area | Confuse slicers, sometimes crash them |
| **Separate shells** | Disconnected pieces | Fine if intended, a problem if they are stray fragments |
| **Inside-out** | Normals pointing inward | The slicer thinks the solid is the empty space |

**Vertices go up or down and triangle counts change — that is normal.** STL
files store every triangle's corners separately, so "welding coincident
vertices" always reports a big reduction. Nothing was lost.

### If it says the mesh was rebuilt

The damage was too much for a gentle fix, so the surface was reconstructed from
scratch. It *is* watertight, but:

- fine surface detail may be softened
- a deliberately hollow model may have been filled in
- large holes get bridged flat, so curvature there will not match

**Open the -FIXED file next to your original before printing.**

## Problems

**Page won't load** — Turn Tailscale on if you're using the `100.` address.
Otherwise the mini may be asleep or restarting; tell your instructor.

**"That file could not be read as an STL"** — Watertight only reads `.stl`.
Export from your modelling tool as STL (binary is fine) and try again.

**"File is larger than the 50 MB limit"** — Reduce the polygon count before
exporting. A print rarely needs more than a few hundred thousand triangles.

**It's taking a long time** — Big meshes take a while, and you may be queued
behind classmates. A million-triangle scan can take a minute or two.

**Nothing downloaded** — Check your browser didn't block it. Click
**Download again** under the report.

