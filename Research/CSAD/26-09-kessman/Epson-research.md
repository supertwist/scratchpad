# Epson SureColor P9000 — Prints Not Coming Out Square

**Research date:** 2026-09-21
**Symptom:** On roll media, along the long (feed/unroll) dimension, the two sides of the print measure unequal lengths — i.e. the output is a trapezoid/parallelogram rather than a rectangle.

---

## 1. Is this a known Epson issue?

**Partly.** There are two distinct failure modes that get conflated, and it matters which one you have:

| Symptom | Geometry | Cause class |
|---|---|---|
| Both sides too long/short by the same amount | Rectangle, wrong size | **Media feed calibration** (Paper Feed Adjust) |
| One side longer than the other | Trapezoid/parallelogram | **Skew / differential feed** — media walking sideways as it advances |

Your description (unequal side lengths along the feed direction) is the second one. Feed calibration will *not* fix it, because calibration scales both edges equally.

### What's documented as "known"

- **Skew is acknowledged on this printer family.** Bellevue Fine Art Reproduction, a production shop, notes in their P9570 review that they saw paper skew "from time to time" on previous models including the **Epson P9000 and the Stylus Pro 9900**, describing it as not a huge issue but present — and warns that ignoring feed errors produces blurry output as the paper shifts.
- **Feed-advance accuracy complaints exist and have gone unresolved.** On Color Printing Forum, a P9000 owner reported prints "off by a 1/4 inch at 20 inches" along with regular banding. Epson replaced the **print head (multiple times), the feed motor, and the control board** and still declared the machine "within specification." A second user in the same thread reported identical behavior. No fix was offered. The only workaround that produced clean output was **uni-directional mode at highest quality with a drying time per pass**.
- **Epson's own docs treat skew as an expected media-handling condition,** not a defect: the printer ships with a `Remove Skew` setting, a `Detect Paper Skew` sensor, and adjustable `Roll Paper Tension` / `Back Tension` specifically to manage it.

**Bottom line:** there is no Epson service bulletin or acknowledged manufacturing defect for out-of-square output on the P9000. It is treated as a media-loading/tension/roller issue, with a documented tail of cases where Epson declared marginal feed accuracy in-spec.

---

## 2. Epson's official settings that bear on this

All from the P6000/P7000/P8000/P9000 Paper menu → Custom Paper Setting (configurations 1–10):

| Setting | Epson's description | Relevance |
|---|---|---|
| **Remove Skew** | "Lets you enable paper skew reduction." | Direct. Turn **on**. |
| **Roll Paper Tension** | "Lets you adjust the paper tension. Select High or Extra High if paper wrinkles during printing." | High/Extra High for cloth, thin paper, or paper that wrinkles. Uneven web tension is the classic cause of trapezoidal output. |
| **Back Tension** | "If wrinkles appear on roll paper, adjust the Back Tension setting." | Same mechanism, stated in the troubleshooting docs. |
| **Paper Suction** | "Lets you adjust the suction from –4 to 0 to increase the gap between the print head and thin or soft paper." | Too little suction lets media lift and wander; too much drags. Epson: "if paper does not eject correctly, decrease the Paper Suction setting." |
| **Platen Gap** | Standard / Narrow / Wide / Wider / Widest. | Not a squareness fix, but a too-wide gap lets media float. |
| **Paper Feed Adjust** | "Lets you adjust the paper feed if you are unable to resolve banding issues even after head cleaning and alignment." Pattern method, or numeric **–0.70 to +0.70%**. | Fixes *length* error, **not** angular skew. Use only after geometry is square. |
| **Drying Time Per Pass** | 0–10 s pause between passes. | Part of the workaround that fixed the Color Printing Forum case. |
| **Detect Paper Skew** | "If paper feeds at an angle, make sure Detect Paper Skew is set to On in the Printer Settings menu." | Printer Settings menu, not the paper menu. |

### Paper Feed Adjust — full procedure (Epson FAQ, shared across P6000–P9000)

1. Clean the print head if needed; load the target media.
2. Menu → **Paper** → right arrow.
3. **Select Paper Type → Custom Paper Setting** → pick config number 1–10 → OK.
4. **Custom Paper Setting** → same config number → right arrow.
5. **Select Reference Paper** → choose the media type loaded. Epson recommends a paper closely matching the white point and thickness of yours (for proofing: Epson Proofing Paper White Semimatte).
6. **Paper Feed Adjust → Pattern** → OK. A pattern prints. Select the number with the **lightest-color pattern** in each row → OK.
7. **Drying Time Per Pass** → choose > 3 seconds → OK.
8. Set Paper Suction / Roll Paper Tension / **Remove Skew** / Setting Name as needed.
9. Menu → **Maintenance → Head Alignment → Auto → Bi-D All Color** → OK. (For dot proofs, run Auto then verify with Manual.)

---

## 3. Mechanical / loading causes — ordered by likelihood

### A. Roll not squared on the spindle (most common)

Epson's loading procedure has several steps that directly determine squareness, each of which is easy to get subtly wrong:

- Push the **lock lever all the way down** before moving the roll paper holder. If the lever is raised at all, the lock is still engaged.
- Slide the **adapter tabs to match the core size** — 2-inch vs 3-inch. A 2-inch tab setting on a 3-inch core lets the roll rock and drift as it unwinds. This alone produces exactly the trapezoid geometry.
- **Release both tension levers**, push the adapters fully into the core at both ends, then push the levers down.
- Move the roll **right until it touches the roll paper guide**; slide the holder until the left adapter aligns with the arrow/mark; slide right to secure. Confirm **both ends** of the roll are seated.
- A **telescoped or coned roll** (from storage on its side, or a bumped edge) will walk regardless of how carefully it's loaded.

### B. Leading edge not cut square

Epson: "make sure the leading edge of the roll paper is not bent or skewed, or a paper jam or skew error may occur." Fix: cut the end **straight across** with a straightedge, uncurl by rolling backward if necessary, reload, and align the **right edge of the paper with the vertical guide line** on the roll paper cover.

### C. Unequal pinch/pressure roller behavior

Verify all pressure rollers lower **evenly** when paper loads. A roller sticking on one side produces one-sided drag — the precise geometry of "one side longer." Glazed, dusty, or worn rollers cause the same asymmetry.

### D. Dirty platen / grit rollers

Debris in the platen or on the grit (feed) rollers gives one-sided slip. Clean both.

### E. Take-up reel or paper basket drag

Uneven winding tension on the auto take-up reel pulls one edge. **Print once with the take-up disabled** to isolate this — it's a cheap, decisive test.

### F. Trailing edge off the core

Epson documents that "printing becomes distorted when the trailing edge of the roll paper comes off the core." Don't let the last of a roll land inside the printing area.

### G. Media condition / environment

- Epson warns that storing media unprotected or on edge causes excess curl, can damage the printer, and ruins prints. Edge-damaged or curled rolls track poorly.
- Maintain proper room temperature; **73 °F (23 °C) or higher** for papers that curl easily. Humidity swings change how a roll tracks.
- Confirm the media type selected in the printer/RIP matches what is actually loaded.

### H. Auto-cutter — a separate cause of the *appearance* of non-squareness

Worth ruling out early, since it's cheap to test: if the cutter blade is dull or the **cutter cover isn't fully seated**, the cut runs at an angle and the sheet looks non-square even when the image was laid down square.

- Epson: replace the cutter when it is not cutting cleanly (Phillips/cross-head screwdriver).
- The built-in cutter **cannot handle all media** — canvas and banner stock will dull or damage it. Epson says disable Auto Cut and cut those manually.
- On rolls **wider than 44 inches** the cut end can bend; raise the **additional output support** to prevent it and improve cutting.
- **Diagnostic:** turn Auto Cut off, print, and measure the *image* against the roll's own edges before any cut. If the image is square to the paper edges, your problem is the cutter, not the feed.

---

## 4. Recommended order of attack

1. **Disable Auto Cut** and measure the printed image against the paper's own edges. This splits "feed skew" from "crooked cut" in one print.
2. Re-cut the leading edge dead square; reload the roll with attention to adapter tab size, tension levers, and both-end seating against the right guide.
3. Disable the take-up reel; print the same test.
4. Set `Detect Paper Skew` = On (Printer Settings) and `Remove Skew` = On (Custom Paper Setting).
5. Raise `Roll Paper Tension` to High or Extra High.
6. Clean platen, grit rollers, and pinch rollers; verify all pressure rollers drop evenly.
7. Only once the output is square: run `Paper Feed Adjust` (pattern or numeric –0.70…+0.70%) to correct residual length error, then `Bi-D All Color` head alignment.
8. If skew persists across multiple media and a correct reload: it's mechanical. Suspect a worn feed roller, pinch-roller assembly, or the paper-feed drive. Note that the Color Printing Forum case had head, feed motor, and control board all replaced without resolution, so get measured test prints documented **before** authorizing parts.
9. Fallback workaround for accuracy-critical jobs: **uni-directional, highest quality, drying time per pass** — the only thing that worked in the documented P9000 case.

### Test print to make
Send a large outlined rectangle with corner registration marks and a stated dimension (e.g. 40" × 30" with 1" ticks). Measure both long edges and both diagonals. Equal diagonals = square. Unequal diagonals quantify the skew, and the delta over a known length gives you a number to hand Epson.

---

## 5. Things that do *not* explain this symptom

- **Margin settings** — Epson: "even if margins change, the printed size does not change."
- **Paper Feed Adjust / media feed calibration alone** — scales both edges equally; cannot produce unequal side lengths.
- **Head alignment (Bi-D)** — makes lines *look* skewed within a pass, but doesn't change sheet geometry.
- **RIP scale adjustment** (e.g. Onyx "Scale Adjust") — fixes proportional size error on new media, not squareness. Documented as the fix for an Epson 11880 printing 100×100 cm as 102×100 cm.

---

## Sources

### Epson official documentation
- [Epson SureColor P6000/P7000/P8000/P9000 User's Guide (PDF)](https://files.support.epson.com/docid/cpd5/cpd50227.pdf)
- [Quick Reference — P6000/P7000/P8000/P9000 (PDF)](https://files.support.epson.com/docid/cpd5/cpd50157.pdf)
- [Setup Guide — P6000/P7000/P8000/P9000 (PDF)](https://files.support.epson.com/docid/cpd5/cpd50156.pdf)
- [Paper Menu Settings — SC-P6000/P9000 series](https://files.support.epson.com/docid/cpd5/cpd50227/source/pro_graphics/source/menus/reference/scp6000_9000/menu_paper_scp6000_9000.html) — Remove Skew, Roll Paper Tension, Paper Suction, Platen Gap, Paper Feed Adjust
- [Loading Roll Paper — SC-P6000/P9000](https://files.support.epson.com/docid/cpd5/cpd50227/source/pro_graphics/source/media_loading/tasks/loading_roll_scp6000_9000.html)
- [Paper Feeding Problems — SureColor troubleshooting](https://files.support.epson.com/docid/cpd6/cpd63952/source/pro_graphics/source/troubleshooting/reference/problem_paper_feed_eject.html) — "If paper feeds at an angle, make sure Detect Paper Skew is set to On"
- [Epson FAQ: Creating a Custom Paper Setting — P9000 Standard Edition](https://epson.com/faq/SPT_SCP9000SE~faq-0000aab-shared?faq_cat=faq-8796127537228) — full Paper Feed Adjust walkthrough with pattern image
- [Epson SureColor P9000 Standard Edition support hub](https://epson.com/Support/Printers/Professional-Imaging-Printers/SureColor-Series/Epson-SureColor-P9000-Standard-Edition/s/SPT_SCP9000SE)
- [Replacing the Cutter — SC-P9000 series (ManualsLib p.135)](https://www.manualslib.com/manual/1048488/Epson-Sc-P9000-Series.html?page=135)
- [Replacing the Cutter — P7570/P9570](https://files.support.epson.com/docid/cpd5/cpd58368/source/pro_graphics/source/maintenance/tasks/scp7570_9570/replacing_cutter_scp7570_9570.html)
- [Cutting Roll Paper — P10000/P20000](https://files.support.epson.com/docid/cpd5/cpd51065/source/pro_graphics/source/media_loading/container_topics/cutting_roll_paper_scp10000_20000.html) — output support for rolls > 44"
- [Epson P9570 FAQ — loading and skew](https://epson.com/faq/SPT_SCP9570SE~faq-0000a3e-scp7570_9570?faq_cat=faq-8796127504460)
- [Legacy Stylus Pro 7800/9800 troubleshooting index](https://files.support.epson.com/htmldocs/pro78_/pro78_rf/trble_1.htm) — "Printouts are not what you expected" / "Paper feed or paper jam problems occur frequently"

### Forums and field reports
- [Color Printing Forum — "Epson SC P9000 Feed Advance Problems"](https://www.colorprintingforum.com/threads/epson-sc-p9000-feed-advance-problems.17958/) — **most relevant thread.** Off by 1/4" at 20"; head, feed motor, control board all replaced; Epson called it in-spec; uni-directional + high quality + dry time was the only workaround; second user confirmed.
- [Bellevue Fine Art Reproduction — Epson SureColor P9570 Review](https://www.bellevuefineart.com/epson-surecolor-p9570-review/) — production shop notes skew seen on P9000 and 9900.
- [Luminous Landscape — "Epson printer not printing correct size with new media. SOLVED!"](https://forum.luminous-landscape.com/index.php?topic=125882.0) — 11880 printing 100×100 cm as 102×100 cm; fixed with Onyx Scale Adjust. Size error, not squareness.
- [Luminous Landscape — "Epson p9570 p9000"](https://forum.luminous-landscape.com/index.php?topic=142359.0)
- [Luminous Landscape — "Epson P7000 final print image layout"](https://forum.luminous-landscape.com/index.php?topic=111932.0)
- [Luminous Landscape — "Epson 9900 Sheet Feed"](https://forum.luminous-landscape.com/index.php?topic=78368.0)
- [DPReview — "P900 Roll feed driving me nuts!"](https://www.dpreview.com/forums/threads/p900-roll-feed-driving-me-nuts.4686631/) — smaller model, but covers the Paper Skew Check sensor and its sensitivity.
- [DPReview — "Epson P800 skewed prints"](https://www.dpreview.com/forums/thread/4447888)
- [PrintPlanet — "Epson P9000 cut sheet question"](https://printplanet.com/threads/epson-p9000-cut-sheet-question.290029/)
- [Signs101 — "Skewed feed on 360"](https://www.signs101.com/threads/skewed-feed-on-360.130373/) — roll-fed skew case; heavy metal take-up loop former caused distortion, plastic adjustable formers fixed it; one report of 10 mm lateral walk.
- [Image Science — Epson P Series Paper Loading Tips](https://imagescience.com.au/knowledge/epson-p-series-paper-loading-tips) — *(returned 403 on direct fetch; indexed content covers adapter/tension-lever seating and the Poster Board Feed straight-path option for thick media)*

### Secondary / general
- [Pinnacle Plotting — How to Troubleshoot Paper Skew on Plotters](https://plotkc.com/blog/how-to-troubleshoot-paper-skew/) — "skew develops due to asymmetric forces acting on the media during printing."
- [Epson Printer Problems and Troubleshooting hub](https://epson.com/support/printer-problems)

*Note: some general-troubleshooting sites surfaced in searching (whizz-tech.com and similar) appear to be AI-generated aggregator content and are excluded; treat any of their specifics as secondary to Epson's own documentation.*
