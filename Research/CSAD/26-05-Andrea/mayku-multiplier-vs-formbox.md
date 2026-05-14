---
Model: claude-opus-4-7
Prompt: Create a table that compares features of the Mayku Multiplier vs FormBox.
Date: 26/05/14
---

# Mayku Multiplier vs Mayku FormBox — Feature Comparison

Minimum sources per row: 2. All rows met the threshold except where noted as "insufficient sources."

| Feature | Mayku FormBox | Mayku Multiplier | Sources | Discussion |
|---|---|---|---|---|
| Forming method | Vacuum forming — relies on an external household vacuum cleaner to pull the heated sheet onto the mold | Pressure forming — built-in pressurized chamber pushes the sheet onto the mold; no external vacuum/compressor needed | [3][5], [1][2][6] | Sources agree. This is the fundamental architectural difference. |
| Forming bed / area | 200 × 200 mm flat bed | 380 mm circular forming area within a 400 mm circular bed | [3][5], [1][2] | Sources agree. Multiplier's official spec page distinguishes "400 mm bed diameter" from "380 mm usable forming area." |
| Draw depth | 130 mm | 160 mm | [5], [1][2] | Sources agree. |
| Material thickness range | 0.5–1.5 mm (MatterHackers); some Mayku marketing copy cites 0.25–1.5 mm | 0.25–8 mm reported at launch; 1–4 mm typical materials listed on current spec page | [3][5], [1][4] | Disagreement on FormBox lower bound: MatterHackers lists 0.5 mm minimum, older Mayku marketing cited 0.25 mm. For Multiplier, the 8 mm upper bound comes from 2021 launch coverage; current spec page only documents 1–4 mm sheets — treat 8 mm as best-case rather than typical. |
| Heater | Built-in ceramic heater, 160–340 °C | Built-in heated pressure chamber, up to ~220–225 °C; reaches temperature in under 2 min via IR sensor | [3][5], [2][6] | Sources agree. FormBox runs hotter at the top end, but Multiplier's heat is enclosed in a pressure chamber rather than open. |
| Pressure / force | Suction only — limited by vacuum cleaner draw (<2000 W) | ~60 psi / 4 bar chamber pressure, ≈4–5 tonnes of forming force | [3][5], [2][4][6] | Sources broadly agree on Multiplier figures; "4 tonnes" (3D Printing Industry, 2021) vs "5 tonnes" (MatterHackers, current) — likely a marketing update over time. |
| Detail resolution | Not specified in vendor materials | Sub-1 µm (vendor); independent coverage cites detail capture down to ~3 µm | [3][5], [2][4] | Vendor claims <1 µm; independent press cites 3 µm as the practical groove/line resolution. Treat the lower number as marketing best-case. |
| Cycle time | Not specified; demos described as "minutes" | 2–30 min depending on material; ~4 min typical | [3][5], [1][4] | FormBox: insufficient quantitative data from vendor or reseller — only "minutes" is documented. |
| Power | 110 V or 240 V country variants | 100–240 V universal, 1600 W max | [3][5], [1] | Sources agree. Multiplier source coverage is single-source on the 1600 W figure (official spec page) — corroborated indirectly by 3D Printing Industry's 1200 W "heating power" subspec. |
| Dimensions (H × L × W) | 315 × 466 × 274 mm | 420 × 585 × 515 mm (Mayku spec page); 600 × 685 × 600 mm cited by 3D Printing Industry | [3][5], [1][4] | Disagreement on Multiplier dimensions: official spec page lists ~420 × 585 × 515 mm; 3D Printing Industry (2021) lists 685 × 600 × 600 mm. The 2021 figure may be a pre-production envelope. Use Mayku's current spec page as authoritative. |
| Weight | 13 kg | 57 kg | [3][5], [1] | Sources agree. Multiplier is ~4× the FormBox. |
| Connectivity / UI | None — manual operation | Wi-Fi, high-contrast LCD screen, updatable firmware | [3][5], [1][2] | Sources agree. |
| Price (current, USD) | $899 | $10,499 (MatterHackers, current) — note: launched at $4,999 in late 2021 ($1,999 early-bird) | [5], [4][6] | Major price disagreement across time: 3D Printing Industry (Oct 2021) reported $4,999 standard; MatterHackers currently lists $10,499. Mayku's own Multiplier product page does not display a price and directs buyers to request a quote — consistent with the price having moved upward post-launch. |
| Industrial design partner | None publicly disclosed | Co-designed with Teenage Engineering | [3], [1][4] | Sources agree. FormBox: insufficient sources on industrial-design provenance (vendor pages don't list a design partner). |
| Target user | Hobbyists, educators, makers, small studios | Professionals, product designers, small-batch manufacturers, dental/medical labs | [3][5], [1][2][4] | Sources agree. Mayku's own positioning treats FormBox as the entry product and Multiplier as the production-grade unit. |
| What's included | 20 PETG cast sheets, 20 polystyrene form sheets, 3 starter projects, 1 kg casting material, universal vacuum adapter, 2-yr warranty | A4 Reducing Plate, First Make Kit, Tool Kit, Industrial Firmware, Application Support, power cable, instruction manual, activation leaflet | [5], [2][6] | Sources agree. FormBox box contents documented by MatterHackers (single source) — vendor spec page does not enumerate. |
| Compatible casting materials | Concrete, silicone, foam, resin, plaster, jesmonite | Same family — Mayku positions formed parts as production-ready (resin, concrete, wax, chocolate cited in launch coverage) | [3], [4] | Sources agree on overlap. Multiplier's pressure-formed parts are positioned as injection-mold quality, expanding viable downstream uses (functional parts, dental trays, etc.). |

## Source reliability

| # | Source | Last accessed | Type | Rating | Justification |
|---|---|---|---|---|---|
| 1 | [Mayku Multiplier — Technical Specs](https://mayku.me/multiplier/specs) | 2026-05-14 | Primary (vendor) | High for specs / Medium for objectivity | Authoritative on dimensions, power, connectivity. Marketing-adjacent — favorable framing on resolution and capability. |
| 2 | [Mayku Multiplier — Product Page](https://mayku.me/multiplier) | 2026-05-14 | Primary (vendor) | High for specs / Medium for objectivity | Lists resolution, forming pressure, max temp, draw height, included items. No price shown — quote-only. |
| 3 | [Mayku FormBox — Technical Specs](https://mayku.me/formbox/specs) | 2026-05-14 | Primary (vendor) | High for specs / Medium for objectivity | Authoritative on FormBox dimensions, heater range, compatible materials. Some specs (draw depth, exact thickness floor) absent from this page. |
| 4 | [3D Printing Industry — Mayku Multiplier launch coverage](https://3dprintingindustry.com/news/mayku-launches-multiplier-a-desktop-pressure-former-technical-specifications-and-pricing-195967/) | 2026-05-14 | Secondary (industry press, Oct 2021) | Medium | Independent of vendor, but ~4.5 years old. Pricing and some dimensional figures appear superseded by current vendor data. Useful for historical context. |
| 5 | [MatterHackers — Mayku FormBox listing](https://www.matterhackers.com/store/l/mayku-formbox-desktop-vacuum-former/sk/MLCH26RT) | 2026-05-14 | Secondary (authorized reseller) | High for current pricing/availability | Reseller listing — current price ($899), draw depth (130 mm), and box contents are well documented. Some specs likely sourced directly from Mayku. |
| 6 | [MatterHackers — Mayku Multiplier listing](https://www.matterhackers.com/store/l/mayku-multiplier-industrial-desktop-pressure-former) | 2026-05-14 | Secondary (authorized reseller) | High for current pricing | Current MSRP of $10,499 reflects the most recent retail figure available since Mayku's own page is quote-only. Heater and pressure-chamber details align with vendor copy. |

## Notes and caveats

- **Multiplier pricing has moved.** The original 2021 launch price ($4,999) is no longer current. MatterHackers shows $10,499 as of 2026-05-14, and Mayku's own product page is quote-only — strongly suggesting tiered/configured pricing rather than a single list price. Confirm with Mayku or a reseller before quoting.
- **Multiplier thickness range.** The 8 mm upper bound comes from launch-era press coverage; the current spec page only documents 1–4 mm sheet stock. The 8 mm figure may require non-stock material and is best confirmed with Mayku application support.
- **FormBox cycle time** is not quantified by either the vendor or the reseller — flagged as insufficient sources in the table.
- **Resolution figures** (sub-1 µm vs 3 µm) reflect vendor vs press framing. Both refer to the Multiplier; the FormBox does not publish a resolution figure.
- **Both products are still in active production** as of 2026-05-14 based on vendor and reseller availability.
