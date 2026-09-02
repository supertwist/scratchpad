---
Model: claude-sonnet-5
Prompt: I want to run two videos on separate screens in sync from one computer. What are free/open source strategies for doing that?
Date: 26/06/30
---

# Syncing two videos across two screens from one computer

The reliability of sync depends heavily on whether the two videos are decoded by **one process** or **two**. One process spanning both screens gives you frame-accurate sync for free; two separate player processes will drift apart over time unless something actively corrects them. Strategies below are ordered from most-reliable/least-flexible to least-reliable/most-flexible.

## 1. Combine into one canvas, span both screens with a single player (most reliable)

Stitch the two source videos into one file (side-by-side, or stacked) with `ffmpeg`, set the OS to extended desktop across the two screens, and play the combined file fullscreen-spanning both displays with a single player instance.

```bash
ffmpeg -i left.mp4 -i right.mp4 -filter_complex hstack=inputs=2 -c:v libx264 -crf 18 combined.mp4
```

- Play with `mpv --fullscreen --screen=0` after extending the desktop (some players let you target a virtual screen spanning both monitors; otherwise just maximize a borderless window across the combined desktop area).
- Sync is guaranteed because there's only one decode/timing clock — no drift, no IPC needed.
- Downside: the two videos are now permanently locked together as one file (harder to swap one side independently), and you need identical frame rates going in.
- Tools: `ffmpeg` (combine), `mpv` or `vlc` (playback) — both free/open source.

## 2. Two player instances + IPC-driven sync correction

If you need the two videos to stay as separate files (e.g. different codecs, swappable independently, or driven by different machines later), run two instances of `mpv` (one per screen) and synchronize them via mpv's built-in JSON IPC socket.

- Launch each instance targeting a specific display, each with its own IPC socket:
  ```bash
  mpv --screen=0 --fullscreen --input-ipc-server=/tmp/mpv0.sock left.mp4
  mpv --screen=1 --fullscreen --input-ipc-server=/tmp/mpv1.sock right.mp4
  ```
- Send simultaneous `loadfile` + `seek 0 absolute` + `set_property pause no` commands to both sockets at the same instant (a small Python or shell script using `socat`/`nc` against the Unix sockets works).
- Periodically poll `time-pos` on both and issue a corrective `seek` if they've drifted (every few seconds is usually enough for visual sync; sub-frame genlock isn't achievable this way).
- This is exactly the model used by community "mpv-sync" wrapper scripts — there's no single canonical project, but it's a well-documented pattern since mpv's IPC is stable and scriptable.
- Tools: `mpv` (free/open source, has the most scriptable IPC of any FOSS player), plus a small glue script you write.

## 3. Dedicated open-source video-mapping / multi-output software

These projects exist specifically for the "multiple screens/projectors, one timeline, frame-accurate" use case — more setup, but built for exactly this:

- **Splash** (SAT Metalab) — open source video-mapping engine designed for multi-projector/multi-screen installations with synchronized playback across outputs. Handles soft-edge blending too if you ever need it. https://sat-metalab.gitlab.io/splash/
- **VPT (Video Projection Tool)** by HC Steiner / ZHdK — free, open source, supports multiple independently-positioned video layers across multiple display outputs from one timeline.
- Both run on a single machine driving multiple GPU outputs, so sync is handled internally rather than across separate OS processes — much closer to option 1's reliability while keeping option 2's flexibility (independent clips per screen, runtime control).

## Practical notes regardless of approach

- Use two outputs from the **same GPU** where possible — this avoids any cross-card timing differences and is required for most of the above to "just work."
- Disable any compositor/window-manager effects (e.g., transparency, animations) on both screens to avoid frame pacing hitches.
- Match frame rate and resolution scaling between the two sources; mismatched fps is the most common cause of audible/visible drift in the two-process approaches.
- If audio is only on one screen's video, route it explicitly — don't rely on default device selection when two players are open simultaneously.

**Recommendation:** if the two videos can be permanently paired, use option 1 (ffmpeg + single player) — it's the simplest and has zero drift risk. If you need ongoing independent control over each screen's content, set up Splash or VPT once and you'll have a reusable, free, sync-safe rig.
