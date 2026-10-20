# Micca Speck — Seamless Looping Video Prep

## Best wrapper and codec

For the Micca Speck (RTD1295/Realtek-based compact media player line, e.g. Speck G2), the combo that loops most reliably:

- **Wrapper: MP4 (ISO/MPEG-4, .mp4)** — not MKV. MKV's decode path on these Realtek-chipset boxes tends to insert a small re-buffer/black-frame gap on loop restart; MP4 with a clean `moov` atom and no edit lists restarts faster and more predictably.
- **Codec: H.264 (AVC), High Profile, Constant Frame Rate, closed-GOP** — rather than HEVC. The box does support H.265/HEVC hardware decode, but H.264 has a simpler/faster init path on these chips, so the loop restart gap is shorter and more consistent. HEVC is fine for quality but riskier for seamlessness.

### Encoding details that matter more than codec/wrapper choice

- **CFR, not VFR** — variable frame rate is the #1 cause of visible stutter/pause at the loop point.
- **Start and end on a keyframe** (closed GOP, first frame = IDR) so there's no decode-dependency bleed across the loop boundary.
- **Trim to exact frame boundaries** — no partial frames or trailing audio tail.
- **If there's audio, sample-align it to the video length** or drop audio entirely if it doesn't need to loop — mismatched audio/video duration is a common source of an audible "chirp" or video freeze at the splice.
- Avoid B-frames referencing across the cut if hand-splicing; re-encode the loop point rather than just concatenating two streams.

## Sample-aligning audio in HandBrake (step-by-step)

HandBrake doesn't have a dedicated "align audio samples" control — it can only get you close by trimming on exact frame boundaries and letting it re-encode the audio to match.

1. **Open the source file in HandBrake** and go to the **Summary** tab to confirm the source frame rate (e.g. 29.97, 30, 23.976 fps).

2. **Go to the Video tab.** Set **Framerate** to "Same as source" and select **Constant Frame Rate** (not Variable, not Peak). This is the single most important setting — variable frame rate is what causes audio/video drift over a loop.

3. **Find the Range Selection control.** It's not inside any tab — look at the very top of the main HandBrake window, just below where you pick the Source and Title/Angle. There's a dropdown that defaults to **"Chapters."** Change it to **"Frames."** Two fields will appear (a Start and an End, or a from–to range) where you type exact frame numbers. (If your build doesn't show this row at all, fall back to "Seconds" mode and accept less precision, or do the frame-accurate trim in a separate tool like ffmpeg before importing.)

4. **Set your Start Frame and End Frame** so the clip begins on a keyframe-friendly point and ends one frame before the point where it would repeat. (Scrub in the preview window to find exact frame numbers — step through with the frame-advance buttons, not the seek bar.)

5. **Go to the Audio tab.** There's a table of audio tracks with columns including Track, Codec, Mixdown, Samplerate, Bitrate. There's no separate "disable passthru" switch — Passthru is just one of the choices in that per-track **Codec** dropdown (shown as "Auto Passthru," "AC3 Passthru," etc.). Click that dropdown and select **AAC (avcodec)** (or **AAC (CoreAudio)** on Mac) instead. Passthru copies the original audio packets as-is, which were cut on their own boundaries unrelated to your new video trim, and that's what causes an audible click/gap or drift at the loop point. Re-encoding forces HandBrake to render audio samples that match your new trimmed duration exactly. If the dropdown is already set to a real codec like AAC rather than Passthru, nothing to change.

6. **Leave Sample Rate set to Auto** (same as source) so there's no resampling math introducing rounding error.

7. **Encode the file.**

8. **Verify afterward** with MediaInfo (or `ffprobe`): open the output file and compare the **Duration** field for the video stream against the **Duration** field for the audio stream. They should match to within a few milliseconds. If they don't, the trim points weren't frame-accurate and you should redo step 4 with adjusted frame numbers.

**Caveat:** this gets you duration-matched audio, which is what you need for a non-dropping loop, but HandBrake can't give you true sample-accurate (down to the individual audio sample) trimming — it only trims by video frame and re-renders audio to fit. If sub-millisecond precision is needed (rare for signage/looping use), that last bit of polish requires doing the final trim in ffmpeg (`-ss`/`-to` with re-encoded audio) or an audio/video editor instead.
