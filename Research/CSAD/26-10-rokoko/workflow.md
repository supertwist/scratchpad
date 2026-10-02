# Rokoko Mocap → Blender → Rendered Video Workflow

A simple end-to-end pipeline for taking motion capture data recorded with Rokoko, applying it to a character/asset in Blender, and producing a short rendered video.

## 1. Record and Export the Mocap Data (Rokoko)

1. Record your motion capture session using Rokoko Studio (Smartsuit Pro, Smartgloves, or video-based mocap).
2. Clean up the take in Rokoko Studio if needed (trim start/end, fix obvious glitches using their retake/smoothing tools).
3. Export the animation as an **FBX** file (Rokoko Studio has a direct "Export to FBX" option). Alternatively, if you plan to retarget inside Blender, export as **BVH**, which is simpler for bone-only motion data.
4. Note the export's frame rate — you'll want your Blender scene to match it later.

## 2. Install the Rokoko Blender Plugin (Recommended)

1. Download the free **Rokoko Studio Live Blender Plugin** from Rokoko's website.
2. In Blender, go to `Edit > Preferences > Add-ons > Install`, and select the downloaded plugin zip.
3. Enable the plugin. This gives you a "Rokoko" tab in the 3D viewport sidebar with tools for importing and retargeting mocap data.

*(This plugin isn't strictly required — you can import FBX/BVH directly — but it makes retargeting onto a custom character much easier.)*

## 3. Prepare Your Asset in Blender

1. Import or open the Blender file containing the character/asset you want to animate.
2. Make sure the asset has a proper **armature (skeleton)** with bones named/positioned sensibly, and that it's rigged (weight-painted) to deform correctly.
3. If your asset doesn't have a rig yet, you'll need to rig it first (e.g., using Blender's Rigify add-on or a manually built armature) before mocap can be applied.

## 4. Import the Mocap Animation

1. In Blender, go to `File > Import` and choose FBX (or BVH) to bring in the Rokoko animation. This creates a separate "mocap armature" containing just the motion data.
2. Set the scene frame rate (`Output Properties > Frame Rate`) to match the mocap export so playback speed is correct.

## 5. Retarget the Motion onto Your Asset

1. Open the **Rokoko plugin's Retargeting tab** in the sidebar.
2. Set the **Source** armature to the imported mocap skeleton, and the **Target** armature to your character's rig.
3. Use "Build Bone List" to auto-match bone names, then manually fix any bones that didn't map correctly (hips, spine, hands, feet are the common trouble spots).
4. Click **Retarget** — this bakes the motion onto your character's armature as keyframes.
5. Scrub the timeline to confirm the motion looks correct (watch for foot sliding, twisted limbs, or scale mismatches — fix bone orientations or add corrective constraints if needed).

## 6. Set Up the Shot

1. Position a camera and set it to the desired framing; consider animating it slightly for a more dynamic shot, or keep it static for simplicity.
2. Add lighting (a simple 3-point setup or an HDRI environment works well for a quick result).
3. Trim the timeline (`Start Frame` / `End Frame` in Output Properties) to just the range you want for your short clip.

## 7. Render the Video

1. Go to `Render Properties` and choose your render engine (**Eevee** for speed, **Cycles** for higher quality/realism).
2. Go to `Output Properties`:
   - Set output format to **FFmpeg Video**, container **MPEG-4**, codec **H.264**.
   - Choose your output resolution and file path.
3. Go to `Render > Render Animation` (or `Ctrl+F12`).
4. Once rendering completes, your finished video file will be at the output path you set.

## Quick Checklist
- [ ] Mocap recorded and exported from Rokoko Studio as FBX/BVH
- [ ] Rokoko Blender plugin installed and enabled
- [ ] Character asset rigged with a proper armature
- [ ] Mocap imported and frame rate matched
- [ ] Motion retargeted from mocap skeleton onto character rig
- [ ] Camera, lighting, and timeline range set
- [ ] Render output configured and animation rendered

---

Rokoko:
- [YouTube channel](https://www.youtube.com/@RokokoMotion)

Onboarding:
- [startup 1](https://www.youtube.com/watch?v=YDaMf23DUq0)
- [startup 2](https://www.youtube.com/watch?v=-_Pwgcx2npc)
- [startup 3](https://www.youtube.com/watch?v=YzrabStm2Nk)
- [startup 4](https://www.youtube.com/watch?v=u1tI1VObT1c)

Blender:
- [Rokoko > Blender plugin](https://www.youtube.com/watch?v=6iZXy66t3gg)
- [Blender workflow](https://www.youtube.com/watch?v=LZVNvFwwwko)

---

- Can mocap data go to Aframe?
- Peanuts dance party
- Malik dance
- Army of Me
