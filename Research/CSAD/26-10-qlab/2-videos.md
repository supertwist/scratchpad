# Two Videos, Two Screens, Looping — QLab Setup Guide

Plain-English steps for sending two separate, synced video files to two separate screens from one Mac mini, both looping continuously. This is the two-screen version of the three-screen setup in `qlab-setup.md` — read that file's "Before you start" section too if you haven't already, since the license and hardware requirements are the same.

---

## Before you start

### 1. You need a QLab Video license

Without it, QLab restricts all video output to **one single display**, no matter how many screens are plugged in. This is the single most common reason "only one screen gets video" happens.

- One feature set (Video alone): $599 one-time, or $8/day rent-to-own
- Test for free first: QLab menu → **Start Demo Mode…**, unlocks every feature for 60 minutes so you can prove the whole setup before paying.

### 2. Confirm your Mac mini can drive two displays

Any Apple Silicon Mac mini (M1 and up) handles two external displays without issue — this is easier than the three-screen case, which requires an M2 Pro or better. Just confirm:

- macOS sees both displays in **System Settings → Displays**.
- Each display is set to its native resolution — don't let macOS scale it.

### 3. Keep media on the internal SSD

Same rule as always: workspace and video files live on the Mac mini's internal SSD. If you must use external storage, it needs to be SSD-speed over Thunderbolt, USB4, or USB 3.2.

---

## How QLab's video plumbing works, briefly

```
Video Cue  →  STAGE  →  REGION  →  ROUTE  →  DEVICE
            (canvas)  (slice of  (connector) (actual screen)
                       canvas)
```

For two independent videos going to two independent screens, you want **two stages** — one per screen, each with one region routed to one physical display. That's the approach below.

(There's also an "Option A" — stitching both videos into one single wide file — but that only makes sense if the two images are really one picture split across two screens. Since you want two *separate* videos, build two stages instead.)

---

## Part 1 — Physical and macOS setup

1. **Connect both displays** to the Mac mini (HDMI and/or Thunderbolt-to-HDMI/DisplayPort). Confirm macOS sees both under **System Settings → Displays**.
2. **Turn off mirroring.** Each display must be its own extended desktop.
3. **Match resolution to each screen's native resolution** — e.g., 1920×1080 if that's what the projector or monitor actually is. Don't let macOS scale.
4. **Arrange the displays** in the Displays pane to match their real-world left/right order, so everything downstream is intuitive.
5. **Keep the menu bar on your control monitor**, not on either show screen.
6. **Stop the Mac from sleeping.** System Settings → Displays → Advanced / Energy: set "Turn display off" to Never, and disable automatic sleep.
7. **Turn off Night Shift, True Tone, and auto-brightness** on both displays.
8. **Turn on a Focus/Do Not Disturb mode** so no notification banner can appear on either screen.

---

## Part 2 — Prepare your two video files

### Best codec for looping: ProRes or HAP, not H.264/H.265

QLab's own ranking of best-performing codecs for video without transparency:

1. ProRes 422 Proxy
2. HAP Standard
3. ProRes 422 LT
4. HAP Q
5. Photo-JPEG

(For video **with transparency**: ProRes 4444 or HAP Alpha.)

**Avoid H.264 and H.265.** They're common delivery formats, but QLab's docs specifically warn they "perform especially poorly when sped up, slowed down, or when scrubbing" — and they use long-GOP compression, meaning the decoder has to rebuild the image from a keyframe every time the loop wraps. On a single playback you might not notice. Looping every couple of minutes for hours on end, that rebuild becomes a visible stutter right at the seam — the exact moment you most want it invisible.

ProRes and HAP are **all-intra**: every single frame is a complete, independent image, so the jump from the last frame back to the first is instant and clean. **Transcode both files to ProRes 422 LT or HAP before building the show**, even if your source footage is H.264 out of a camera or export tool.

### Make the two files match

- **Same frame rate** (pick 30 or 60fps and use it for both files).
- **Trim both to an exact whole number of frames.** A file with a stray partial frame at the end accumulates a tiny slip every single loop — over hundreds of loops that adds up to a visible jump.
- **The two files do not need the same duration** unless you want them to wrap at the same moment. Each screen loops independently, so a 30-second video and a 90-second video are both fine — they just won't resync with each other unless you want them to (see "Looping forever" below).

### Make the loop seam itself clean

This is a content problem, not a QLab problem. If a video's last frame doesn't flow naturally into its first frame, you'll see a visible jump every cycle, forever. Before bringing files into QLab:

- Grade and edit the first and last frames to match — color, framing, position of anything moving.
- Or build a short crossfade from end back to start directly into the exported file.
- **If there's audio in either file**, fade it to silence across the last few frames and back up from the first few frames, or strip the audio out and loop it as a separate Audio cue. A visually perfect loop can still click audibly at the seam.

### File organization

Put both video files in one folder next to the QLab workspace file, on the internal SSD. QLab tracks media by file path — keeping everything together avoids broken-cue errors later.

---

## Part 3 — Build the QLab workspace

1. **Open QLab, create a new workspace**, and save it into your media folder.
2. Go to **Workspace Settings → Video → Video Outputs**.
3. **Delete the auto-generated stages.** QLab creates one stage per attached display automatically when you make a new workspace — these often don't match your intended resolution, so clear them and build deliberately.
4. Click **New Video Stage** twice, once per screen. Name them clearly — e.g. `Screen A` and `Screen B` — you'll thank yourself later.
5. For each stage: set its resolution to match that screen's native resolution, then go to its **Layout** tab and use the **Output Route** menu to assign its region to the correct physical display.
6. **Verify the mapping before going further.** Drop a test cue on each stage, or use QLab's output monitor windows, and confirm Screen A really shows up on the screen you think is Screen A. Fixing this now is free; fixing it during a run is not.
7. **Create two Video cues**, one per file. Drag each file in, or use File → New → Video.
8. For each cue, open its inspector and set its **Stage** to the matching stage (cue 1 → Screen A's stage, cue 2 → Screen B's stage).
9. Set each cue's geometry to **fill/fit the stage** so the video fills the whole screen.

---

## Part 4 — Start them together

1. **Select both Video cues** and press **⌘0** to wrap them in a Group cue.
2. In the Group's inspector, set its mode to **Timeline — start all children simultaneously**. (A Timeline Group has a green border with square corners.)
3. **Set both child cues to "Do not continue."** This is required inside a Timeline Group — leaving auto-continue/auto-follow on will give you a broken-cue warning, and it's the most common stumble with this setup.
4. Hit **GO** on the Group cue. Both videos start together, on their own screens.

**Tip:** Workspace Settings → Cue Templates → Group lets you set Timeline as the default mode for every Group you create from then on.

---

## Part 5 — Make them loop forever

Open each Video cue's inspector → **Time & Loops** tab.

- **Infinite loop** — check this box to loop the whole file forever. Do this for both cues.
- **Play count** — if you want a fixed number of repeats instead, enter a whole number here.
- **Hold at end** — a safety net: if a loop ever does stop, this keeps the last frame on screen instead of cutting to black. Not strictly needed for an infinite loop, but harmless to leave checked.

### ⚠️ Drift between the two screens

Two independently-looping video cues are each running on their own internal clock. A sub-frame timing discrepancy per loop is invisible the first time, but it compounds: over many hours at a short loop length, the two screens can very gradually fall out of step with each other.

This matters a lot less with two screens than with three, and usually isn't noticeable unless your content specifically relies on something crossing between the two screens in a synchronized way. If your two videos are truly independent content (not meant to visually line up frame-for-frame), don't worry about it.

If you do need the two screens to **stay locked together indefinitely** (e.g., a shared beat or a moment that should land on both screens at once), build in a periodic resync instead of relying on two separate infinite loops:

1. Give each Video cue a finite **Play count** instead of infinite loop (e.g., 20 passes).
2. Below the Group, add a **Goto cue** targeting the Group.
3. Set the Group to **auto-follow**, so the Goto fires the instant both cues finish their 20 passes.
4. Set the Goto cue itself to auto-continue, so it actually re-triggers the Group rather than just moving the playhead.

Every 20 passes, both screens stop and restart from frame zero together, wiping out any accumulated drift. There will be one brief visible re-cue — time it for a moment your content can absorb, like both screens going briefly dark.

**Two cautions:** a Goto cue not set to auto-continue will silently stall the loop. And any cue placed *below* the Goto in the cue list will never be reached.

### Getting out of an infinite loop

An infinitely-looping Timeline Group never completes — it has no "end" for anything downstream to wait on. To exit cleanly instead of cutting mid-frame, use a **Devamp cue** targeting the looping cue (or the whole Group). It waits for the current pass to finish, then lets the cue stop instead of restarting — cleaner than a hard Stop.

### Looping quick reference

| Goal | Setting |
|---|---|
| Loop a file forever | Video cue → Time & Loops → **Infinite loop** |
| Loop a file N times | Time & Loops → **Play count** = N |
| Hold the last frame if it ever stops | Check **Hold at end** |
| Exit a loop gracefully | **Devamp cue** targeting the looping cue |
| Resync two drifting screens | Finite play count + auto-follow + Goto back to the Group |

---

## Part 6 — Running unattended for hours or days

If nobody will be watching the machine:

- **Disable automatic macOS updates** — an overnight update-triggered restart is the classic way to arrive to two black screens.
- **Disable the screensaver** as well as display sleep — they're separate settings.
- **Set a Focus mode** so no notification can appear over the content.
- **For a permanent installation:** set the Mac to auto-restart after a power failure (`sudo pmset -a autorestart 1`), enable auto-login, and add QLab to Login Items. Combine with QLab's workspace setting to auto-open and auto-start a cue, so the display recovers from a power blip with nobody present.
- **Run the actual loop for several hours before you trust it.** Check both screens are still alive, there's no drift that bothers you, and the Mac mini isn't throttling from sustained decode load in a closed cabinet.

---

## Troubleshooting quick reference

| Symptom | Likely cause |
|---|---|
| Only one screen gets video | No Video license — QLab restricts output to one device |
| Image soft or wrongly cropped | Mac display resolution doesn't match the screen's native resolution |
| Wrong screen gets the wrong video | Region → Output Route assignment — recheck in the stage's Layout tab |
| "Broken cue" warning on the Group | Child cues have auto-continue/auto-follow set — change to "Do not continue" |
| Visible stutter at the loop point | Wrong codec (H.264/H.265) — transcode to ProRes 422 LT or HAP |
| Visible jump at the loop point even with the right codec | Loop seam isn't matched in the source content — fix first/last frame match or add a crossfade |
| Screens slowly fall out of sync over hours | Two independent infinite loops drifting — add a periodic resync (see Part 5) |
| Screen goes black mid-run | Display sleep enabled in Energy settings |

---

## Sources

- [QLab 5 — Video Output](https://qlab.app/docs/v5/video/video-output/)
- [QLab 5 — Video Cues](https://qlab.app/docs/v5/video/video-cues/)
- [QLab 5 — Group Cues](https://qlab.app/docs/v5/fundamentals/group-cues/)
- [QLab 5 — Devamp Cues](https://qlab.app/docs/v5/other-cues/devamp-cues/)
- [QLab 5 — Features by License Type](https://qlab.app/docs/v5/general/features/)
- [QLab 5 — Licenses](https://qlab.app/docs/v5/general/licenses/)
- See also `qlab-setup.md` in this folder for the three-screen version with more detail on hardware, licensing tiers, and edge-blending.
