# Epson P9570 — Vertical Blur/Smear on Phototex (adhesive fabric) Prints

Printing from Photoshop onto Photo-Tex adhesive fabric; prints look blurred/smeared on the vertical axis, consistent with a slight positional offset between passes. Research below collects similar reported cases and the fixes that resolved them.

## Diagnosis: this is a pass-to-pass (bidirectional) registration problem, not a file issue

Symptom matches classic **misregistration between printhead passes**, as distinct from banding (uneven density) — see [CMYK Print Defects: Misregistration vs. Banding](https://bergencountyprinters.blog/2025/07/14/cmyk-print-defects-misregistration-vs-banding/). Misregistration = dots from forward and reverse carriage passes land slightly offset, which on fine detail reads as horizontal blur running vertically down the print — i.e. the image looks "doubled" or soft wherever bidirectional passes overlap.

Three independent causes can produce this, roughly in order of likelihood for your setup:

## 1. Bidirectional alignment is off for this specific media

The P9570/P7570 (PX570 series) requires **per-media-type head alignment** — unlike older SureColor models, alignment is stored per paper type, not globally for the printer. If Photo-Tex hasn't had its own Bi-D alignment run (or was aligned using a similar-but-different fabric/canvas preset), forward/reverse passes will be mismatched specifically on this media even though other media print fine.

- Run **Menu → Paper Setting → [select Photo-Tex media] → Print Adjustments → Print Head Alignment → Bi-D Alignment (Auto)** first (9–13 min). Run a nozzle check beforehand so the alignment pattern itself isn't broken.
- If auto-alignment doesn't fully resolve it (textured/fabric surfaces can scatter the alignment sensor's optical read), fall back to **manual Bi-D alignment**, picking the best-converged line pair visually.
- If it's still off, as a stopgap try **disabling bidirectional/high-speed printing** (uni-directional only) for this media — slower, but forward-pass-only means no inter-pass registration to go wrong.
- Source: [Epson P9570 head alignment docs](https://files.support.epson.com/docid/cpd5/cpd58368/source/spcs/source/printers/source/ink_functions/tasks/scp7570_9570/aligning_head_lcd_auto_scp7570_9570.html), [Spectraflow tech tip on P7570/P9570 alignment](https://blog.spectraflow.com/tech-tip-printhead-alignment-epson-p7570-p9570/)

## 2. Platen gap too narrow for fabric thickness → light head strike/smudge

Several P9570 owners reported what looked like banding/blur on **canvas** that turned out to be the printhead lightly brushing the media surface mid-print and smudging still-wet ink — not a true "head strike" crash, just insufficient clearance for a thicker/softer textile that doesn't lie as flat as paper.

- Fix: widen the **Platen Gap** setting (Standard → Wide/Wider) via the Media Installer / front-panel Thick Paper setting for fabric media. Rough correspondence: Narrow ≈150gsm, Standard ≈190gsm, Wide ≈260gsm, Wider ≈320gsm, Widest ≈500gsm — Photo-Tex fabric is thicker/softer than photo paper, so err wider.
- Note this is separate from the "Paper Thickness" setting (which only affects ink laydown/ink load calculation) — platen gap is the physical head-to-media clearance.
- Also check for curl/wave in the fabric roll feeding flat past the rollers before the print zone; curl at the edges is a common secondary cause of the same symptom.
- Sources: [Epson platen gap docs](https://files.support.epson.com/docid/cpd5/cpd50227/source/pro_graphics/source/media_loading/tasks/adjusting_platen_gap_scp6000_9000.html), [Red River Paper — platen gap for thick media](https://www.redrivercatalog.com/infocenter/inkjet-printer-paper-thickness-platen-gap-adjustment.html), [DPReview — P9570 banding thread](https://www.dpreview.com/forums/threads/epson-p9570-banding.4609782/), [Image Science — head strikes and blotch issues](https://imagescience.com.au/knowledge/head-strikes-and-blotch-issues-on-inkjet-prints)

## 3. Paper feed (media advance) calibration

Separately from platen gap, multiple P9570/pro-printer owners found **banding/registration problems on canvas-like media were fixed by adjusting the paper feed rate** specifically for that media type — the P9570 was reported as notably more sensitive to this than other pro Epson models. Overlapping passes (feed too short) show as darker bands/smear; gaps (feed too long) show as light bands. Worth running the feed adjustment pattern for your Photo-Tex media profile in addition to head alignment.

- Source: [DPReview — Banding with Epson SureColor P9570](https://www.dpreview.com/forums/thread/4635003)

## 4. File/RIP-side gradient banding (less likely given your description, but worth ruling out)

If the "blur" is actually visible stepping in a gradient rather than a true doubled/soft edge, that's a separate, file-side issue: work in 16-bit in Photoshop, and if printing via a RIP, make sure any gradient step-count limiter is disabled. One documented case ([signs101.com](https://www.signs101.com/threads/banding-from-file-not-printer.180549/)) was misdiagnosed as a printer fault and was actually solved by adding noise to the gradient. Printing from the Photoshop driver directly (no RIP) is a plausible path to this since the driver's own dithering/gradient handling differs from dedicated RIP software — see [PrintPlanet: Photoshop instead of RIP](https://printplanet.com/threads/photoshop-instead-of-rip.264621/).

## Recommended order of operations

1. Run a nozzle check.
2. Run **Bi-D (and if needed Uni-D) head alignment specifically on the Photo-Tex media profile**, auto then manual if auto doesn't converge.
3. If still smeared, widen the **Platen Gap** one step and re-check that the fabric is feeding flat/uncurled.
4. If still smeared, run/adjust the **paper feed calibration** for the Photo-Tex profile.
5. As a diagnostic isolation step, temporarily print **uni-directional** — if the blur disappears, you've confirmed it's bidirectional registration (alignment or feed), not a head strike or file issue.

## Sources
- [DPReview — Epson P9570 Banding](https://www.dpreview.com/forums/threads/epson-p9570-banding.4609782/)
- [DPReview — Banding with Epson SureColor P9570](https://www.dpreview.com/forums/thread/4635003)
- [Epson — Aligning the Print Head Automatically (P7570/P9570)](https://files.support.epson.com/docid/cpd5/cpd58368/source/spcs/source/printers/source/ink_functions/tasks/scp7570_9570/aligning_head_lcd_auto_scp7570_9570.html)
- [Epson — Aligning the Print Head Manually (P7570/P9570)](https://files.support.epson.com/docid/cpd5/cpd58368/source/spcs/source/printers/source/ink_functions/tasks/scp7570_9570/aligning_head_lcd_manual_scp7570_9570.html)
- [Spectraflow — Tech Tip: Printhead Alignment Epson P7570/P9570](https://blog.spectraflow.com/tech-tip-printhead-alignment-epson-p7570-p9570/)
- [Epson — Adjusting the Platen Gap](https://files.support.epson.com/docid/cpd5/cpd50227/source/pro_graphics/source/media_loading/tasks/adjusting_platen_gap_scp6000_9000.html)
- [Red River Paper — Printer Adjustments for Thick Papers: Platen Gap](https://www.redrivercatalog.com/infocenter/inkjet-printer-paper-thickness-platen-gap-adjustment.html)
- [Image Science — Head Strikes and Blotch Issues on Inkjet Prints](https://imagescience.com.au/knowledge/head-strikes-and-blotch-issues-on-inkjet-prints)
- [Bergen County Printers — CMYK Print Defects: Misregistration vs. Banding](https://bergencountyprinters.blog/2025/07/14/cmyk-print-defects-misregistration-vs-banding/)
- [Signs101 — Banding from file, not printer](https://www.signs101.com/threads/banding-from-file-not-printer.180549/)
- [PrintPlanet — Photoshop instead of RIP](https://printplanet.com/threads/photoshop-instead-of-rip.264621/)
- [Phototex Group — Technical Bulletin (fabric paper)](https://phototexgroup.com/wp-content/uploads/2018/11/Technical-Bulletin.pdf)
