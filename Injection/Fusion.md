# Creating an Injection Mold from an .STL in Fusion 360

## Prompt

> Write a short, step-by-step walkthrough for creating an injection mold from an .STL in Fusion 360. Save to "/Users/james/GIT/scratchpad/Injection" as "Fusion.md" - include this prompt and the model information at the beginning of the document.

**Model:** Claude Opus 4.6 (`claude-opus-4-6`) via Claude Code
**Date:** 2026-04-16

---

## Prerequisites

- Autodesk Fusion 360 installed (free for personal use)
- An .STL file of the part you want to mold
- The part should be a solid, watertight mesh with no holes or self-intersections

---

## Step-by-Step Walkthrough

### 1. Import the STL

1. Open Fusion 360 and create a new design.
2. Go to **Insert > Insert Mesh** and select your .STL file.
3. Position the part so the intended parting line sits on the XY plane (the flat midpoint where the two mold halves will meet). Use **Move/Copy** if needed.
4. Click **OK** to place the mesh.

### 2. Convert the Mesh to a Solid Body (BRep)

1. Right-click the mesh in the Browser panel and select **Mesh to BRep**.
2. If the mesh is too complex (over ~10,000 faces), first reduce it: **Mesh > Reduce** to simplify while keeping the shape. Then convert.
3. Wait for conversion to complete — the mesh icon in the Browser will change to a solid body icon.

### 3. Add Draft Angles (Optional but Recommended)

1. Switch to the **Design** workspace.
2. Select **Modify > Draft**.
3. Pick the pull direction (typically the Z axis, perpendicular to the parting plane).
4. Select the faces that need draft and set the angle (1--3 degrees is standard for injection molding).
5. Click **OK**. Draft angles allow the part to release cleanly from the mold.

### 4. Create the Mold Block

1. Create a new sketch on the XY plane.
2. Draw a rectangle centered on the part, larger than the part's footprint on all sides by at least 10--15 mm (this becomes the mold wall thickness).
3. **Finish Sketch**, then **Extrude** the rectangle in both directions (symmetrically) so it fully encloses the part. This block is your mold blank.

### 5. Split the Block into Two Halves

1. Go to **Modify > Split Body**.
2. Select the mold block as the **Body to Split**.
3. Select the XY plane (or a custom parting surface) as the **Splitting Tool**.
4. Click **OK**. You now have an upper half (core) and a lower half (cavity).

### 6. Subtract the Part from Each Half

1. Go to **Modify > Combine**.
2. Set the **Target Body** to one mold half.
3. Set the **Tool Body** to the part.
4. Set the operation to **Cut**.
5. Check **Keep Tool** so the part body is not consumed.
6. Click **OK**.
7. Repeat for the other mold half.

Each half now contains the negative cavity of the part.

### 7. Add Alignment Features

1. Create a new sketch on the parting face of one mold half.
2. Draw small circles (e.g., 4--5 mm diameter) near the corners — these will become dowel pin holes.
3. **Extrude** them as cuts into one half and as bosses on the other, so the halves register together precisely.

### 8. Add the Sprue (Injection Channel)

1. Create a sketch on the top face of the upper mold half.
2. Draw a small circle (2--4 mm diameter) centered above the thickest section of the part cavity.
3. **Extrude** it as a cut through the upper half into the part cavity. This is the channel where molten material will be injected.
4. Optionally taper the sprue slightly (wider at the top) for easier removal.

### 9. Add Vent Channels (Optional)

1. Sketch thin slots (0.02--0.05 mm deep, 3--5 mm wide) on the parting face, running from the cavity edge to the outer wall of the mold.
2. Cut them into one mold half. These allow trapped air to escape during injection.

### 10. Inspect and Export

1. Use **Inspect > Section Analysis** to slice through the mold and verify the cavity matches the part geometry with no interference.
2. Check wall thickness is sufficient everywhere.
3. Export each mold half separately:
   - Right-click the body in the Browser > **Save As STL** (for 3D printing the mold), or
   - **File > Export** as STEP (for CNC machining).

---

## Tips

- **Material choice matters.** If 3D printing the mold, use a heat-resistant material (e.g., Formlabs High Temp resin or glass-filled nylon). PLA molds will deform quickly.
- **Start simple.** For your first mold, pick a part with no undercuts and a clear, flat parting line.
- **Shrinkage compensation.** Scale the part up by the material's shrinkage factor (typically 0.5--2% for common thermoplastics) before creating the cavity.
- **Fusion 360's Mold workspace.** For more complex parts, explore **Design > Mold** (available in paid tiers), which automates parting line detection, core/cavity separation, and runner/gate placement.
