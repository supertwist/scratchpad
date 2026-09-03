Yes — OrcaSlicer supports custom infill patterns, though at different levels of effort depending on what you want.

**Two approaches:**

1. **Use/combine existing patterns (no code needed)** — OrcaSlicer already ships many infill patterns (gyroid, honeycomb, cubic, adaptive cubic, lightning, cross-hatch, 2D/3D Honeycomb, etc.), inherited from PrusaSlicer/Bambu Studio's fork lineage. Many "custom" looks are achievable by tuning density, angle, and pattern combos (e.g., different top/bottom vs. sparse infill patterns) rather than writing new geometry generators.

2. **Add a genuinely new infill pattern (requires building from source)** — this means editing the slicer engine itself:
   - Infill generators live in OrcaSlicer's C++ source, under `src/libslicer2/Fill/` (e.g. `FillGyroid.cpp`, `FillHoneycomb.cpp`, `Fill3DHoneycomb.cpp`, `FillAdaptive.cpp`). Each pattern is a subclass of the base `Fill` class implementing a `_fill_surface_single()` method that generates the toolpath geometry for a layer.
   - You'd add a new subclass generating your pattern's line/curve geometry (many existing patterns are parametric — sine-based, TPMS math like gyroid, or L-system/fractal-based like Hilbert curve), register it in `PrintConfig`'s `InfillPattern` enum, and expose it in the UI (`Preset` combo box options + tooltips).
   - After adding, you rebuild the slicer from source (CMake build — OrcaSlicer publishes build instructions for macOS/Windows/Linux) to get a binary with your new pattern available in the GUI.

**Lower-effort alternative:** if you don't need it parametrically generated per-layer, some users fake "custom infill" by modifying G-code post-processing scripts (OrcaSlicer supports post-processing scripts in Printer Settings) to inject custom infill toolpaths, though this is hacky and mostly used for simple effects.

If you tell me what pattern you're after (organic/voronoi, a specific geometric motif, load-adaptive, etc.) I can help scope whether it's a tuning job or a real source-level addition — and if it's the latter, I can help set up the OrcaSlicer build environment and get you into `Fill/` directly.
