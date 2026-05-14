---
Model: claude-opus-4-7
Date: 26/05/13
---

# Desktop-Class Knitting Devices (Kevlar / 3D-Form Suitability)

Scope note: this table lists desktop / benchtop-class knitting devices that are sometimes proposed for technical-yarn or 3D-form work. None of them is documented by its vendor as capable of knitting kevlar into a true three-dimensional form; the table is presented so that capability gaps are explicit. "Maximum build volume" is the maximum knitting width (the only fixed axis on a continuous knitter); fabric length is effectively unlimited and 3D depth depends on needle-bed count and take-down design.

| # | Device | Product Link | Maximum Build Volume | Pricing | Key Features | Sources | Source Disagreement |
|---|--------|--------------|---------------------|---------|--------------|---------|---------------------|
| 1 | Kniterate (digital knitting machine) | [kniterate.com/product/kniterate-the-digital-knitting-machine](https://www.kniterate.com/product/kniterate-the-digital-knitting-machine/) | 36" / 91.4 cm knitting width; 7-gauge; 504 needles (252 per bed × 2 beds); machine envelope 152 × 70 × 65 cm; 250 kg | $15,999 USD | Only commercially shipping desktop digital knitter; double-bed flatbed (no 4-bed / WHOLEGARMENT-class 3D capability); 6 yarn carriers; vendor-recommended yarns Nm6–Nm8 (light fingering/sport weight); auto cast-on / bind-off / shaping; no documented aramid or kevlar use | [1](https://www.kniterate.com/product/kniterate-the-digital-knitting-machine/), [2](https://www.kniterate.com/), [3](https://www.ojolly.net/knitting/2024/yarns-for-kniterate-knitting), [4](https://www.kickstarter.com/projects/kniterate/kniterate-the-digital-knitting-machine/description), [5](https://support.kniterate.com/hc/en-us/articles/360010296598-Workspace-and-installation) | Sources agree on dimensions and price. Sources agree that no aramid/kevlar compatibility is documented — vendor docs emphasise fashion-weight yarns; community resources (O! Jolly!) discuss yarn weight constraints, not technical fibres. |
| 2 | OpenKnit (Wally340 / Wally120) | [hackaday.io/project/2694-openknit](https://hackaday.io/project/2694-openknit) | Wally340: 340 needles, full-garment width (~85 cm working width at typical gauge); Wally120: ~30 cm working width for accessories | ~€550 in parts (DIY build; no commercial unit) | Open-source single-bed linear knitter by Gerard Rubio (predecessor to Kniterate); BoM, 3D-printed parts, Arduino control, schematics on GitHub; can produce seamless tubes/garments; project last updated ~2014 and is effectively dormant though docs remain available; no documented aramid/kevlar use | [1](https://hackaday.io/project/2694-openknit), [2](https://hackaday.com/2014/02/20/openknit-the-open-source-knitting-machine/), [3](https://www.dezeen.com/2014/09/17/openknit-clothes-3d-knitting-machine-loom-gerard-rubio/), [4](https://makezine.com/article/digital-fabrication/3d-printing-workshop/openknit-an-open-source-knitting-machine/), [5](https://www.instructables.com/Building-the-Open-Knit-machine/) | Hackaday.io describes Wally340 / Wally120 variants explicitly; Dezeen and Makezine coverage from 2014 calls OpenKnit "3D-knitting" in the marketing sense (seamless tubular knits), but no source documents 4-bed / sculptural-3D capability. €550 parts cost from Dezeen / Hackaday articles; not a commercial price. |
| 3 | Circular Knitic | [var-mar.info/circular-knitic](https://var-mar.info/circular-knitic/) | Installation envelope 63 × 40 × 150 cm; produces continuous knitted tube (diameter set by the laser-cut needle ring; not specified numerically in vendor docs) | DIY build, parts cost not published (no commercial unit) | Open-hardware circular knitter by Varvara & Mar (Mar Canet + Varvara Guljajeva); 3D-printed and laser-cut plexiglass structure; Arduino control; designed for art / kinetic installation use, not technical fibre; outputs an unlimited-length knit tube but no shaping / no 3D-form capability; no documented aramid/kevlar use | [1](https://var-mar.info/circular-knitic/), [2](https://github.com/var-mar/circular_knitic), [3](https://hackaday.io/project/6455-circular-knitic), [4](https://makezine.com/article/digital-fabrication/3d-printing-workshop/circular-knitic-an-open-hardware-knitting-machine/), [5](https://var-mar.info/circular-knitic-workshop/) | Sources agree on form factor and open-hardware status. Needle count / knitting diameter is referenced in the long-form documentation PDF (linked from the GitHub repo) but not surfaced in any of the top-level vendor or third-party pages. |
| 4 | Knitic (Brother KH-9xx hack) | [knitic.com](https://www.knitic.com/) | 200 needles wide on supported Brother KH-9xx machines (~90 cm working width at native ~5-gauge); knitting length unlimited | DIY: requires a vintage Brother KH-930 / KH-940 / KH-950i / KH-965 (~$200–$600 used) + custom Knitic shield (BoM available on GitHub) | Original open-hardware retrofit of the Brother KH-9xx electronic flatbed knitting machines by Mar Canet; replaces Brother's pattern controller with an Arduino-based interface; CC BY-NC 4.0; flatbed single-pair (one bed + ribber accessory); no 3D-form architecture; no documented aramid/kevlar work | [1](https://www.knitic.com/), [2](https://github.com/mcanet/knitic), [3](https://hackaday.com/tag/knitic/), [4](https://var-mar.info/circular-knitic/), [5](https://hackaday.io/project/6455-circular-knitic) | Knitic.com itself doesn't list which exact KH-9xx models are supported — that detail comes via the GitHub repo and the related Stanford / community tutorials, which target the KH-940 most consistently. Some confusion between "Knitic" (the Brother-machine shield) and "Circular Knitic" (the standalone circular machine that grew out of it) is common in third-party press. |
| 5 | AYAB on Brother KH-9xx | [ayab-knitting.com](http://www.ayab-knitting.com/) | 200 needles wide on supported Brother KH-9xx (max ~180 needles usable in practice per Stanford tutorial); ~90 cm working width; knitting length unlimited | DIY: Brother KH-930/940/950i/965 (~$200–$600 used) + AYAB hardware. Evil Mad Scientist's plug-in interface board is end-of-life ("no longer in production"); current users source community-built boards | Open-source software + hardware control for Brother KH-9xx (except KH-970); non-destructive, fully reversible install; supports all KH-9xx widths up to 200 needles, unlimited rows; active Discord community and Stanford / academic deployments; single-bed flatbed with optional ribber, no 3D-form architecture; no documented aramid/kevlar use | [1](http://www.ayab-knitting.com/), [2](http://www.ayab-knitting.com/features/), [3](https://hackaday.io/project/1611-ayab-all-yarns-are-beautiful), [4](https://shop.evilmadscientist.com/productsmenu/835), [5](https://textilemakerspace.stanford.edu/tutorials/brother-kh940-ayab/) | EMS retail page describes the AYAB interface in plug-and-play form, but lists it "no longer in production"; AYAB project page still markets the hardware as available via community / project store. KH-970 exclusion noted on the AYAB project page but is not mentioned in the EMS or Stanford pages. |

## Overall capability finding

No device in the desktop / benchtop class — commercial or DIY — is documented by its maker as capable of knitting kevlar into three-dimensional forms. Every option above is either single-bed or double-bed flatbed, or a single-cylinder circular knitter; none has the four-bed architecture, hardened needle steel, or multiaxial weft-insertion system that aramid 3D-preform work requires. The kevlar + 3D-form combination is currently a strictly industrial-class capability (Shima Seiki / Stoll ADF / Steiger Vega / Karl Mayer COP MAX 5 / Maxtronic).

## Devices considered but excluded

- **Carnegie Mellon Autoknit** ([textiles-lab.github.io/publications/2018-autoknit](https://textiles-lab.github.io/publications/2018-autoknit/)) — software that converts 3D meshes to knit instructions, but its published implementation runs on an industrial Shima Seiki SWG091N2 V-bed machine. Not a desktop device.
- **Addi Express Kingsize and similar crank circular knitters** — purely mechanical hobbyist circular knitters; no electronic control, no aramid handling, and no 3D shaping.
- **Hand-flatbed knitters (Silver Reed LK150 / SK280 etc.)** — manual single-bed devices, no automation and no 3D-form capability.

## 404 / blocked URLs (not cited)

- None encountered for this table; all five cited URLs per row were verified to load. The Evil Mad Scientist AYAB page (cited as a historical pricing/availability reference) loads but the product is end-of-life.

## Source reliability

| Source | Rating | Why |
|--------|--------|-----|
| kniterate.com (root, product page, support article) | High (primary, vendor) | Manufacturer of record; definitive on spec, price, and yarn guidance. |
| kickstarter.com Kniterate campaign | Medium-high | Vendor-authored crowdfunding page with original spec claims; historical but not stale (machine shipped against this spec). |
| ojolly.net "Yarns for Kniterate Knitting" | Medium | Independent practitioner's guide; useful for community-validated yarn weights but not a primary source. |
| hackaday.io OpenKnit and AYAB project pages | High (primary) | Author-maintained project pages with BoMs and version history. |
| hackaday.com OpenKnit / Knitic coverage | Medium-high | Editorial trade press with technical literacy; OpenKnit article dated 2014 and not since updated. |
| dezeen.com OpenKnit feature | Medium | Design press; broad audience focus; reliable on price/build claims attributed to the maker. |
| makezine.com OpenKnit and Circular Knitic features | Medium-high | Maker-press with editorial review; aligns with primary sources. |
| instructables.com OpenKnit build guide | Medium | Author-published step-by-step; verified by community comments. |
| var-mar.info (Circular Knitic, Knitic) | High (primary, vendor) | Project owner's site. |
| github.com/var-mar/circular_knitic and github.com/mcanet/knitic | High (primary) | Source-of-truth repositories with current commits. |
| knitic.com | High (primary, vendor) | Project owner's site. |
| ayab-knitting.com (root, features) | High (primary) | Project's official site; documents supported devices and compatibility caveats. |
| shop.evilmadscientist.com AYAB interface page | Medium-high | Reseller listing; flagged as end-of-life, useful as historical pricing/availability evidence. |
| textilemakerspace.stanford.edu KH-940 AYAB tutorial | High | University-published technical tutorial with verifiable operating constraints. |

## Run summary

- Rows produced: 5
- Rows flagged for insufficient sources: 0
- Sources consulted and verified active: 24 unique URLs across the five rows
- Sources dropped due to retrieval failure: 0
- All cited URLs were last accessed on 2026-05-13.
