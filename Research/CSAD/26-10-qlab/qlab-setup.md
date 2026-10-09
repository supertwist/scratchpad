# Three Videos, Three Screens, One Mac mini — QLab Setup Guide

**Short answer: yes.** QLab 5 on a single Mac mini can drive three separate displays with three separate video images, started together on one GO. There are two requirements that will cost you money and are easy to miss, so read the "Before you start" section first.

---

## Before you start — the three things that can stop you

### 1. You need a QLab **Video license**

This is non-negotiable. Without a video license, QLab restricts *all* video output to **one single display**. Multi-screen output, multi-output stages, custom geometry, masking, and edge blending are all behind the Video license.

| License | Cost |
|---|---|
| One feature set (Video alone) | $599 one-time, or $8/day rent-to-own |
| Two feature sets | $1099 one-time, or $12/day |
| All three (Audio + Video + Lighting) | $1399 one-time, or $15/day |

A standard license installs on up to two computers. Educational and site-license pricing exist — site licenses are $299/activation with a 10-activation minimum, arranged by emailing support@figure53.com.

**Test before you buy:** QLab menu → **Start Demo Mode…** unlocks every licensed feature for 60 minutes. You can prove this whole setup works before spending anything. (You can't copy cues *into* a demo workspace, so build it fresh.)

### 2. Your Mac mini must actually support three displays

Not every Mac mini does. Check your model:

- **M4 Mac mini (base, 2024)** — up to three displays: two up to 6K/60Hz over Thunderbolt, plus one up to 5K/60Hz over Thunderbolt or 4K/60Hz over HDMI. ✅
- **M4 Pro Mac mini** — three displays, each up to 6K/60Hz over Thunderbolt or HDMI. ✅
- **M2 Pro Mac mini** — two 6K/60Hz plus one 4K/60Hz. ✅
- **M1 / M2 base Mac mini** — **two displays only.** ❌ You'd need a splitter (see below) or a different machine.

**Port gotcha on the M4 mini:** the two front USB-C ports are data and power only — they output no video. Use the HDMI port plus two of the three rear Thunderbolt ports.

**If your mini only does two displays:** a hardware splitter such as a Matrox TripleHead2Go, Datapath Fx4, or AJA HA5-4K appears to macOS as one very wide display and fans it out to three physical screens. QLab handles these natively through **partial outputs** — each output route gets a sub-menu letting you build a stage sized to just one slice of that output.

### 3. Figure 53's hardware guidance

QLab's own system recommendations are blunt: use Apple Silicon, and for serious video work they point at the **Max** and **Ultra** chips for their dedicated video-decode circuitry. They explicitly do **not** recommend most Intel Macs for video work. A base M4 mini will handle three streams of well-encoded 1080p comfortably; three streams of 4K is where you should test, not assume.

Keep the workspace and all media on the **internal SSD**. If you must use external storage, it needs to be an SSD or enterprise-class drive on Thunderbolt, USB4, or USB 3.2.

---

## Understanding QLab 5's video plumbing

QLab 5 replaced QLab 4's "Surfaces" with a more flexible chain. Four pieces, in order:

```
Video Cue  →  STAGE  →  REGION  →  ROUTE  →  DEVICE
            (canvas)  (slice of  (connector) (projector,
                       canvas)               monitor, LED wall)
```

- A **Stage** is a virtual canvas. Every Video, Camera, and Text cue plays onto a stage.
- A **Region** is a rectangle of that stage sent somewhere. A stage can have one region or many.
- A **Route** connects a region to actual hardware, handling the technical details.
- A **Device** is the physical screen, projector, or a virtual output like Syphon or NDI.

Stages can be up to 16384 × 16384 pixels.

---

## Choose your approach

### Option A — One wide stage, three regions (recommended for sync)

You export your three videos as **one single wide movie file**, and QLab slices it across the three screens. Three 1920×1080 screens side by side becomes one 5760×1080 file.

**Why this is better:** it is one file, one decoder, one clock. The three images cannot drift apart because they are literally the same frame. If your content is genuinely a single picture spanning three screens, or three panels that must stay frame-locked, do this.

**Downsides:** you must re-export whenever any panel changes, and the file is large.

### Option B — Three stages, three cues, one Timeline Group

Each screen gets its own stage. Each video is its own cue. A Timeline Group fires all three together.

**Why you'd choose it:** independent content, easy to swap one video without touching the others, different durations per screen, ability to fade or cut screens separately.

**The honest caveat:** a Timeline Group starts all children in the same event, but that is *not* a guarantee of frame-accurate lock between three independently decoded files. For most theatrical and gallery work this is invisible. For content where a hard cut or a moving object crosses a screen boundary, use Option A.

---

## Part 1 — Physical and macOS setup (both options)

1. **Connect the displays.** HDMI to one screen, Thunderbolt-to-HDMI/DisplayPort to the other two (rear ports only on an M4 mini). Power everything up and confirm macOS sees all three.

2. **System Settings → Displays.** Confirm three displays appear.

3. **Turn off mirroring.** Each display must be its own extended desktop, not a copy.

4. **Set each display's resolution to match the projector or screen's native resolution.** If the projector is 1920×1080, set the Mac to 1920×1080 — don't let macOS scale. Mismatched resolution is the single most common cause of soft or wrongly-cropped projection.

5. **Arrange the displays** in the Displays pane to match their real-world left-to-right order. Drag the thumbnails so they sit in the same order as the physical screens. This makes everything downstream intuitive.

6. **Keep the menu bar on the mini's control monitor**, not on a show screen. Drag the white bar in the arrangement view onto whichever display you sit in front of. (If you're running headless over Screen Sharing, this matters less, but set it anyway.)

7. **Stop the Mac from sleeping.** System Settings → Displays → Advanced, or Energy settings: prevent automatic sleeping when the display is off, and set "Turn display off" to Never for a show machine. A display that sleeps mid-show is a black screen you cannot explain to an audience.

8. **Turn off Night Shift, True Tone, and any auto-brightness** on all three displays. They will shift your colour mid-show.

9. **Turn off notifications** — enable a Focus mode, or at minimum Do Not Disturb. A Slack toast on the centre screen is a memorable kind of bad.

---

## Part 2 — Prepare your media

**Encode for playback, not for archiving.** QLab's own ranking of best-performing codecs for moving images without transparency:

1. ProRes 422 Proxy
2. HAP Standard
3. ProRes 422 LT
4. HAP Q
5. Photo-JPEG

For video **with transparency**, use ProRes 4444 or HAP Alpha. Use MOV or MP4 containers. For stills, PNG or JPG.

**Avoid H.264 and H.265 for show playback.** They work, but QLab's docs specifically note they "perform especially poorly when sped up, slowed down, or when scrubbing forward or back" — which is exactly what you do in a tech rehearsal. Transcode to ProRes 422 LT or HAP before you start building.

**Make the three files identical in frame rate and duration.** Same fps (pick one — 30 or 60 — and stick to it across all three), same length to the frame. Differing frame rates across three simultaneous files is a drift problem you are building for yourself.

**For Option A**, composite the three panels into one wide file in your editor:
- Three 1920×1080 screens → 5760×1080 timeline
- Place each panel at x = 0, 1920, and 3840
- Export as one ProRes 422 LT or HAP movie

**Put everything in one folder next to the QLab workspace file**, on the internal SSD. QLab tracks media by path; a tidy folder saves you from hunting down broken cues the night before opening.

---

## Part 3A — Building it: one wide stage, three regions

1. Open QLab, create a new workspace, and save it into your media folder.

2. Go to **Workspace Settings → Video → Video Outputs**.

3. **Delete the auto-generated stages.** QLab automatically makes a stage per attached display when you create a workspace. These are convenient but often wrong — their resolution reflects whatever the Mac currently reports, which may not match your real projectors. Clear them out and build deliberately.

4. Click **New Video Stage → Multi-Output Stage…**. QLab asks you to describe the physical setup: how many projectors, their resolution, and their arrangement.

5. Enter: **3 outputs**, your resolution (e.g. 1920×1080), arranged **horizontally**.

6. **Overlap:** if your projectors' images overlap on the screen, tell QLab the overlap percentage and it calculates the **edge blends** automatically — a soft dissolve in the overlap zone, giving a seamless join. (The docs' worked example: two 1920×1200 projectors with 20% overlap produce a 3456px-wide stage. Same arithmetic extends to three.) If your screens are physically separate with gaps, use 0% overlap.

7. QLab creates a stage with three regions pre-configured.

8. Go to the stage's **Layout** tab. For each region, use the **Output Route** pop-up menu to assign it to the correct physical display. Region 1 → left screen, region 2 → centre, region 3 → right.

9. **Verify the mapping before going further.** Use QLab's output monitor windows, or just drop a test cue in. Confirm that left is actually left. Getting this wrong at this stage is cheap to fix; getting it wrong during tech is not.

10. Create one **Video cue** and point it at your wide file.

11. In the cue's inspector, set its **Stage** to the multi-output stage you just built.

12. Under the cue's geometry settings, use **Fit to Stage** / full-stage sizing so the wide file maps 1:1 onto the stage.

13. Hit GO. One cue, one file, three screens, perfectly in sync.

---

## Part 3B — Building it: three stages, three cues, one Timeline Group

1. Steps 1–3 as above: new workspace, **Workspace Settings → Video → Video Outputs**, delete the auto-generated stages.

2. Click **New Video Stage** three times, creating one stage per screen. Name them clearly — `Screen Left`, `Screen Centre`, `Screen Right`, or whatever matches your paperwork. You will thank yourself at 11pm during tech.

3. For each stage, set the resolution to match that screen's native resolution, and assign its region's **Output Route** to the correct display.

4. **Verify the mapping.** Same warning as above — prove left is left before you build any cues.

5. Create three **Video cues**, one per file.

6. Set each cue's **Stage** to its corresponding stage. Set geometry to fill the stage.

7. **Select all three cues and press ⌘0** to wrap them in a Group cue.

8. In the Group cue's inspector, set its mode to **Timeline — start all children simultaneously**. A Timeline Group has a green border with square corners. When it fires, every child starts at once.

9. **Set all three child cues to "Do not continue."** Auto-continue and auto-follow are not permitted inside a Timeline Group — leaving them set will give you a broken-cue warning. This is the single most common stumble with this setup.

10. Hit GO on the Group. All three videos start together.

**Tip:** make this your default. **Workspace Settings → Cue Templates → Group**, set the default mode to Timeline. Every Group you make from then on starts its children simultaneously.

**Offsetting a screen deliberately:** if you *want* one screen to start later, don't use auto-follows — give that child cue a **pre-wait**. Pre-waits begin counting down the moment the Timeline Group starts. A 2s pre-wait on one cue and 4s on another gives you a staggered start from a single GO.

---

## Part 4 — Monitoring and rehearsal

**Audition windows.** Every video stage in QLab gets its own audition window, and QLab can show monitor windows for every video input and output. If you're operating from a booth where you can't physically see all three screens, open these on your control monitor. This is how you catch a screen that has gone black without turning around.

**Run it hot, repeatedly.** Before you trust it, run the full cue stack a dozen times end to end. Watch for: drift between screens (Option B), dropped frames on any one output, and the mini's thermals. Three simultaneous video streams is sustained GPU load; if the mini is in a closed rack with no airflow, you will find out during the show rather than during tech.

**Test video effects sparingly.** QLab's docs warn that effects are processor-intensive and should be thoroughly tested before production. On a three-output show, add effects only after you've confirmed the baseline plays clean.

---

## Mixed approach — worth knowing

You don't have to pick one. Stages are cheap and you can have as many as you like. A cookbook example workspace uses **six stages** for a three-screen rig: one for each screen individually, one covering all three as a single wide canvas, and others for scenic elements. That way a cue can address one screen or all three, whichever the moment calls for — a wide panorama for one cue, three independent images for the next, from the same workspace.

This is the setup I'd aim for once you're comfortable: build all three individual stages *and* a combined wide stage, and let each cue pick whichever serves it.

---

## Troubleshooting quick reference

| Symptom | Likely cause |
|---|---|
| Only one screen gets video | No Video license — QLab restricts output to one device |
| Image soft or wrongly cropped | Mac display resolution doesn't match the projector's native resolution |
| Wrong screen gets the wrong video | Region → Output Route assignment; re-check in the stage's Layout tab |
| "Broken cue" warning on the Group | Child cues have auto-continue/auto-follow set; change to "do not continue" |
| Stuttering or dropped frames | Wrong codec (H.264/H.265) — transcode to ProRes 422 LT or HAP |
| Playback hitches from external drive | Media not on internal SSD, or drive/interface too slow |
| Screen goes black mid-show | Display sleep enabled in Energy settings |
| Videos drift apart over time | Option B with mismatched frame rates — or switch to Option A |

---

## Sources

- [QLab 5 — Video Output](https://qlab.app/docs/v5/video/video-output/)
- [QLab 5 — Video Cues](https://qlab.app/docs/v5/video/video-cues/)
- [QLab 5 — Group Cues](https://qlab.app/docs/v5/fundamentals/group-cues/)
- [QLab 5 — Features by License Type](https://qlab.app/docs/v5/general/features/)
- [QLab 5 — Licenses](https://qlab.app/docs/v5/general/licenses/)
- [QLab 5 — System Recommendations](https://qlab.app/docs/v5/general/system-recommendations/)
- [QLab Cookbook — Regional Stages](https://qlab.app/cookbook/regional-stages/)
- [QLab Cookbook — Video Composition](https://qlab.app/cookbook/video-composition/)
- [Buy QLab](https://qlab.app/shop/) · [Site License Pricing](https://qlab.app/site-license-pricing/) · [Educational Policy](https://qlab.app/educational-pricing/)
- [Mac mini (2024) Tech Specs — Apple](https://support.apple.com/en-us/121555)
- [External Display Support on Apple Silicon — Plugable](https://kb.plugable.com/docking-stations-and-video/understanding-external-display-support-on-apple-m1-m2-m3-and-m4-chips)
