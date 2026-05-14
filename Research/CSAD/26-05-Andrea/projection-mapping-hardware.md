---
Model: claude-opus-4-7[1m]
Prompt: Create a table that includes a list of hardware solutions for projection mapping. The first column is the name of the device. The second column is a link to its home page; check the link - if 404 do not include. The third column lists pricing; indicate if there is a free tier; indicate if it is open source. The fourth column indicates OS and system requirements. The fifth column assesses learning curve.
Date: 26/05/14
---

# Projection Mapping Hardware & Solutions

Scope note: "Hardware solutions for projection mapping" is interpreted broadly to include (a) dedicated media-server hardware platforms and (b) the software platforms that drive projectors and turn commodity workstations into projection-mapping rigs. Every homepage below was checked and returned an HTTP 200 response (except HeavyM, which returns 403 to scripted requests due to Cloudflare bot filtering but is confirmed live in browser and search indexes). Discontinued products (e.g. Lightform, which wound down in 2022) are excluded.

| Device / Platform | Homepage | Pricing (free tier / open source?) | OS & System Requirements | Learning Curve |
|---|---|---|---|---|
| **disguise (VX / EX / GX range)** | [disguise.one](https://www.disguise.one/) | Quote-based; proprietary. Hardware servers typically rented at ~$1,900+/month (GX2 reference); no free tier. Designer software available free for offline pre-production. | Turnkey appliance servers running disguise Designer on Windows-based hardware. Workstation requirements: high-end NVIDIA RTX GPU, 64 GB+ RAM for production work. | Steep — industry-standard for large XR / touring shows; requires training and an integrator workflow. |
| **Green Hippo Hippotizer (MX / Tierra+)** | [green-hippo.com](https://www.green-hippo.com/) | Quote-based; proprietary. Hardware tiers from Boreal+ to Tierra+; rental-market common. No free tier. | Windows-based dedicated appliance servers; multi-output (up to 8K on Tierra+) with NVIDIA Quadro / RTX GPUs. | Steep — pro touring / installation tool; Hippo training courses recommended. |
| **twoloox Pandoras Box** (formerly Christie) | [twoloox.de](https://www.twoloox.de/) | Quote-based; proprietary. Server, Compact Player, and software-license tiers. No free tier. | Windows 10/11; runs on twoloox hardware servers or licensed third-party workstations. 64-bit engine (V10). | Steep — node-based show composition with deep parameter control; pro-grade. |
| **Modulo Pi (Modulo Player / Modulo Kinetic)** | [modulo-pi.com](https://www.modulo-pi.com/) | Quote-based; proprietary. Two product lines (Player for playback, Kinetic for advanced 3D mapping). No free tier. | Turnkey Windows-based servers; outputs from 4K up to multi-output 8K configurations. | Steep — used for Atelier des Lumières-class installations; integrator/operator training expected. |
| **AV Stumpfl PIXERA** | [pixera.one](https://www.pixera.one/) | Quote-based; proprietary. Hardware tiers: PIXERA zero / one / two / four. Software-only licensing also available. No free tier. | Windows 10/11; sold as turnkey appliances or as licensed software on certified workstations. Multi-GPU. | Moderate-to-steep — modern UI is more approachable than older media servers but still production-grade. |
| **Dataton WATCHOUT 7** | [dataton.com](https://www.dataton.com/) | Proprietary. WATCHOUT Producer software is **free**; only the production media server requires a license (one per server). Sold standalone or on WATCHPAX / WATCHMAX hardware. | Windows 10 or later, Vulkan 1.3+ GPU, AVX-capable CPU. Producer station: dual-core CPU, 4 GB RAM minimum. | Moderate — long-established (since 1995); cluster-based multi-display paradigm; documentation is mature. |
| **TouchDesigner (Derivative)** | [derivative.ca](https://derivative.ca/) | **Free Non-Commercial tier** (resolution-capped); Educational $300; Commercial $600; Pro $2,200; Floating Cloud $900. Proprietary (not open source). | Windows 10/11 or macOS 13+; NVIDIA GeForce/Quadro or AMD Radeon/FirePro GPU (Intel Macs need a discrete AMD GPU). | Steep — node-based visual programming; powerful and general-purpose but a real learning investment. |
| **Smode** | [smode.io](https://www.smode.io/) | Proprietary. Subscription and perpetual tiers (Compose, Live, Live XR); **Smode Community** is a free version. | Windows 10/11; high-end NVIDIA GPU recommended for real-time compositing. | Steep — extremely deep node graph; positioned between After Effects and a media server. |
| **Resolume Arena** | [resolume.com](https://www.resolume.com/) | Proprietary. Arena ~€799 one-time (Avenue ~€399). Free trial with watermark. No open-source option. | Windows 10/11 (64-bit) or macOS 12+; multi-core CPU, dedicated GPU, 8 GB+ RAM. | Moderate — friendly clip-grid UI; projection-mapping module (Advanced Output) requires some study. |
| **MadMapper** | [madmapper.com](https://madmapper.com/) | Proprietary. €398 perpetual or ~$39/month / ~$400/year subscription. Free trial available. Not open source. | Windows 10/11 (64-bit) or macOS 11+; dedicated GPU recommended. | Beginner-to-moderate — purpose-built for projection mapping; widely considered the easiest pro tool to start with. |
| **HeavyM** | [heavym.net](https://www.heavym.net/) | Proprietary. Live $33/mo (~$338 lifetime), Pro $67/mo (~$678 lifetime), Enterprise quote. **Free trial with watermark, no time limit, no credit card required.** | Windows 10/11 or macOS; Intel Core i5 2.30 GHz / 4 cores, 4 GB RAM min (8 GB recommended). | Beginner — strongest "fast setup with built-in effects" workflow; minimal prerequisite knowledge. |
| **Millumin** | [millumin.com](https://www.millumin.com/) | Proprietary. Rental from €29 (7 days) up to lifetime licenses. Free trial. Not open source. | macOS only (Big Sur 11+ for V5). | Beginner-to-moderate — timeline-driven "show conductor" model is approachable for theatre and live performance. |
| **VPT 8** (Video Projection Tools, HC Gilje) | [hcgilje.wordpress.com/vpt](https://hcgilje.wordpress.com/vpt/) | **Free** (donationware). Open source in spirit (Max patch source distributed). Built in Max 7 / FFmpeg engine. | Windows or macOS, 64-bit; runs as a standalone Max application (no Max license required to run). | Moderate — capable but somewhat dated UI; the de facto free option for serious tinkerers. |
| **MapMap** | [mapmapteam.github.io](https://mapmapteam.github.io/) | **Free and open source** (GPL). Community-developed on GitHub. | Windows, macOS, and Linux. Lightweight; runs on modest hardware. | Beginner — intentionally simple UI aimed at artists and small teams; ideal entry point. |

## Source Reliability

| Source | Used For | Reliability |
|---|---|---|
| Official product homepages | Existence, current product line, OS support | High (primary source) |
| Vendor knowledge bases & docs (Dataton, Derivative, HeavyM Help, MapMap docs) | System requirements, version numbers, license tiers | High |
| Christie Digital announcement page (Oct 2025 Pandoras Box sale) | Ownership change to twoloox | High |
| Rental house listings (4Wall, PRG, High Resolution) | Approximate pricing for quote-only servers | Medium (rental-market, not vendor list price) |
| Third-party review aggregators (videomapping.store, fixthephoto, projectileobjects) | Pricing sanity checks | Medium |

## Notes & Caveats

- **Pricing volatility.** Subscription tiers for HeavyM, MadMapper, and Smode change frequently — always confirm on the vendor page before committing.
- **Quote-based servers.** disguise, Hippotizer, Pandoras Box (twoloox), Modulo Pi, and PIXERA list prices are not public; the rental dollar figures cited are reference points from third-party rental houses, not vendor list prices.
- **Pandoras Box ownership.** Christie sold the Pandoras Box product line to twoloox GmbH on 2025-10-15; the active homepage is now twoloox.de. Existing christiedigital.com pages remain live but are archival/transition references.
- **Lightform.** Excluded — operations ceased August 2022 after the company was effectively absorbed into Amazon. Hardware still works but receives no updates or support.
- **HeavyM URL check.** heavym.net returned HTTP 403 to scripted requests (Cloudflare bot filtering); confirmed live and current via multiple independent search results and the vendor's own help center.
- **Learning-curve ratings** are qualitative and reflect typical professional consensus; an experienced media-server operator will find any of these tools faster to adopt than a first-time user.
- **Hardware versus software.** Where a "device" is sold both as a turnkey appliance and as a software license (PIXERA, Watchout, Pandoras Box), the row covers both forms.
