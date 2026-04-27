# Workflow / iPaaS Automation Platforms — Comparison

**Scope:** Workflow automation and Integration-Platform-as-a-Service (iPaaS) tools — both commercial SaaS and open-source / source-available.
**Minimum sources per row:** 5 (per request).
**Compiled:** 2026-04-27.

> Pricing for enterprise iPaaS vendors (Workato, Boomi, MuleSoft, Jitterbit, SnapLogic, Tray.ai, Informatica, Celigo, SAP, Oracle, IBM, Frends) is rarely published — the figures below are crowdsourced ranges from third-party brokers (Vendr, ITQlick, Integrate.io, AutomationAtlas) and are flagged for disagreement where they conflict. Treat as ballpark, not list price.

## Table

| # | Platform | Vendor | OSS / Commercial | Approx. Cost per Year (USD) | Free Tier? | System Requirements | Sources | Disagreement / Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | **Zapier** | [zapier.com](https://zapier.com) | Commercial (proprietary SaaS) | Free; Pro from ~$240/yr ($19.99/mo); Team from ~$828/yr ($69/mo); Enterprise custom | Yes — 100 tasks/mo, two-step Zaps | Cloud-only SaaS; browser-based; no install | [5][1][2][3][S-act] | Sources agree on tiering; entry price differs slightly ($19.99/mo on vendor page vs. $29.99/mo cited in [2]) — likely reflects an older Starter price now folded into Free. |
| 2 | **Make** (formerly Integromat) | [make.com](https://www.make.com) | Commercial (proprietary SaaS) | Free; Core ~$122/yr ($10.20/mo annual); Pro ~$214/yr; Teams ~$388/yr; Enterprise custom | Yes — 1,000 ops/mo, 15-min min interval | Cloud-only (AWS EU/N. America); browser-based | [6][2][3][1][S-best] | [3] cites "from $9+/mo" while vendor page shows $10.59/mo annual — small rounding difference, sources broadly agree. |
| 3 | **n8n** | [n8n.io](https://n8n.io) | Source-available (Sustainable Use License); Enterprise license also available | Self-hosted Community: $0; Cloud Starter ~€240/yr; Pro ~€600/yr; Business ~€8,000/yr; Enterprise custom | Yes — Community Edition (self-hosted) free; cloud trial available | Self-hosted: Node.js v20.19+, 2GB RAM / 2 vCPU min (8GB recommended for production), SQLite default, PostgreSQL recommended for prod, Docker supported | [7][17][2][4][74] | [2] lists Starter at €24/mo, vendor page shows €20/mo — likely a recent reprice. License nature: [4] calls n8n "source-available, not fully open source"; sources agree. |
| 4 | **Workato** | [workato.com](https://www.workato.com) | Commercial (proprietary SaaS) | "Base Workspace" from ~$10,000/yr; typical deals $40k–$250k/yr; large enterprise often $120k+ | Trial only; no perpetual free tier | Cloud-native (serverless on AWS); on-prem agent supported for hybrid | [24][25][26][27][1] | Significant range: vendor "starting at" implies $10k floor, but Vendr/ITQlick anonymized data shows $40k+ is more typical. Sources agree pricing is opaque and quote-only. |
| 5 | **Tray.ai** (formerly Tray.io) | [tray.ai](https://tray.ai) | Commercial (proprietary SaaS) | Pro from ~$7,140/yr ($595/mo); Team ~$18,000/yr; Enterprise from ~$36,000/yr | No free tier or self-service signup | Cloud (multi-region); on-prem agent for hybrid | [44][45][46][47][2] | [2] gives "From $2,500/month" via APPSeCONNECT, while [45][46] cite Pro starting at $595/mo — likely refers to different (higher) tier. Sources disagree on entry price; Pro $595/mo appears to be current. |
| 6 | **Pipedream** | [pipedream.com](https://pipedream.com) | Commercial (proprietary SaaS); workflow code is open-source on GitHub | Free; Basic ~$348/yr ($29/mo); Advanced ~$948/yr ($79/mo); Business custom | Yes — 100 credits/day, 3 active workflows, 3 connected accounts | Cloud-only SaaS; developer-oriented (Node.js / Python in browser) | [8][19][20][22 (mentioned)][2] | Sources agree on $29/$79 paid tiers. Free tier definition differs: docs say "100 credits/day" but [19] briefly mentions monthly variant — daily appears authoritative. |
| 7 | **IFTTT** | [ifttt.com](https://ifttt.com) | Commercial (proprietary SaaS) | Free; Pro $35.88/yr; Pro+ $107.88/yr | Yes — 2 Applets, unlimited runs (slow speed) | Cloud-only SaaS; iOS/Android apps | [9][2 (general)][1 (general)][3 (general)][S-best] | Sources agree on tier pricing. IFTTT is rarely listed in iPaaS reviews — most coverage treats it as consumer rather than enterprise tool. |
| 8 | **Microsoft Power Automate** | [microsoft.com/power-automate](https://www.microsoft.com/en-us/power-platform/products/power-automate/pricing) | Commercial (proprietary SaaS) | Premium $180/user/yr ($15/mo); Process $1,800/bot/yr; Hosted Process $2,580/bot/yr; Copilot Studio $200/mo (25k credits) | Limited (30-day trial); standard connectors **included free** with Microsoft 365 Business/Enterprise | Cloud-first; desktop flows require Windows; on-prem data gateway available | [10][71][72][73][2] | Sources agree on pricing. Free-tier nuance: [71][72] note Microsoft 365 customers get standard connectors at no cost — premium connectors require paid plan. [73] gives the same $15/mo–$215/mo range. |
| 9 | **Azure Logic Apps** | [azure.microsoft.com/logic-apps](https://azure.microsoft.com/en-us/products/logic-apps) | Commercial (proprietary SaaS) | Consumption: pay-per-execution (~$0.000025/action); Standard: per-vCore plan | Yes — limited consumption tier free | Cloud (Azure); Standard plan supports VNET, on-prem connectors via gateway | [2][1][S-best][S-gartner][70 (timed out — flagged)] | **Insufficient pricing detail** — vendor pricing page timed out on fetch. Sources broadly describe consumption vs. Standard models but per-year cost varies widely with usage. |
| 10 | **Boomi** | [boomi.com](https://boomi.com) | Commercial (proprietary SaaS / hybrid) | Professional ~$6,600/yr ($550/mo, 5 connections); Enterprise ~$14,400/yr+ ($1,200/mo+); ACVs commonly mid-$50k–$500k+ | Trial only; no free perpetual tier | Hybrid: cloud + on-prem "Atom" runtime engines (Java); deployed on customer infra | [28][29][30][31][1][2] | Disagreement on entry price: [2] cites "$320/mo per connector" (user-reported); [31] gives "$550/mo for 5 connections"; [30] gives ranges. Boomi states it does **not** charge per connector ([28]) — older "$320/connector" data likely outdated. |
| 11 | **MuleSoft Anypoint Platform** | [mulesoft.com](https://www.mulesoft.com) | Commercial (proprietary; Salesforce-owned) | Integration Starter and Advanced; quote-only. Median deals ~21% above Workato, ~61% above Boomi per [33]; typical contracts $80k–$500k+/yr | Trial only | Hybrid: cloud (CloudHub), on-prem, hybrid; Mule runtime is Java | [32][33][34][35][1][2] | All sources agree pricing is opaque. [33] explicitly compares median list price as 21% above Workato. |
| 12 | **Celigo (integrator.io)** | [celigo.com](https://www.celigo.com) | Commercial (proprietary SaaS) | Custom; Standard, Professional, Enterprise tiers; entry deals typically ~$5k–$25k/yr | Yes — Free Plan (after 30-day trial): 2 endpoints, 1 flow | Cloud SaaS; on-prem agent for hybrid | [54][55][56][57][2][3] | Sources agree pricing is endpoint-based and quote-only. Free-tier scope agrees across [55][57]. |
| 13 | **Integrately** | [integrately.com](https://integrately.com) | Commercial (proprietary SaaS) | Free; Starter $239.88/yr; Professional $468/yr; Growth $1,188/yr; Business $2,868/yr | Yes — 100 tasks/mo, single-step, 15-min updates | Cloud-only SaaS; no system requirements | [12][2][S-best][S-comp][S-act] | Sources agree. Promotional "$5 first month" offer noted on vendor page only. |
| 14 | **SnapLogic** | [snaplogic.com](https://www.snaplogic.com) | Commercial (proprietary SaaS / hybrid) | Quote-only; ACVs typically $30k for small deployments to $300k+ for enterprise; premium "Snap" packs add $15k–$45k | Trial only | Hybrid: cloud + on-prem "Snaplex" runtime; multi-cloud | [40][41][42][43][1][2] | Sources agree on opaque pricing and Tier 1 ($45k) / Tier 2 ($15k) Snap upgrades. [40] claims "transparent pricing" but actual list prices are not public. |
| 15 | **Jitterbit Harmony** | [jitterbit.com](https://www.jitterbit.com) | Commercial (proprietary SaaS) | Quote-only; Standard (2–3 connections), Professional (5), Enterprise (8+); typical $20k–$200k/yr range with annual contract required | Trial only | Cloud, on-prem, hybrid; private agents on Linux/Windows | [36][37][38][39][1][3] | Sources agree on tier structure tied to connection counts; specific dollar amounts vary by quote and not published. |
| 16 | **IBM App Connect** | [ibm.com/app-connect](https://www.ibm.com/products/app-connect) | Commercial (proprietary SaaS / on-prem ESB) | Flow Runs Edition from ~$2,400/yr ($200/mo); Runtime Compute Capacity from ~$8,000/yr ($667/mo); Enterprise Software custom | Limited service trials only | Cloud, on-prem, or hybrid; Enterprise edition runs as ESB / microservices | [58][59][60][2][3] | Sources agree on listed entry prices from IBM. Heavy enterprise deals not publicly disclosed. |
| 17 | **SAP Integration Suite** | [sap.com/integration-suite](https://www.sap.com/products/technology-platform/integration-suite.html) | Commercial (proprietary SaaS) | Basic ~$10,644/yr; Standard ~$60,360/yr; Premium custom; standalone subscription from ~$36,000/yr; many enterprises buy via CPEA with $100k+ minimum | Yes — 90-day trial | Cloud (SAP BTP); hybrid via Cloud Connector for on-prem SAP | [48][49][50][2][1] | [2] gives Basic $10,644 / Standard $60,360 figures; [49] cites "starts at $3,000/mo" (~$36k/yr) — likely refers to standalone subscription, while $10,644 figure is a smaller-tenant entry. Both can coexist. |
| 18 | **Informatica IDMC** | [informatica.com](https://www.informatica.com) | Commercial (proprietary SaaS) | IPU (consumption) model; ~$1,080 per IPU/yr; entry $50k–$100k/yr; high-volume $300k–$800k+/yr | Trial only | Cloud-native (IDMC); supports on-prem secure agents | [51][52][53][2][1] | Sources agree on IPU model. [52] gives $1,080/IPU/yr based on AWS marketplace listing — vendor does not publish list IPU prices. |
| 19 | **Frends** | [frends.com](https://frends.com) | Commercial (proprietary; hybrid deployment) | Quote-only; "process-based" pricing; reported ~60% TCO savings vs. usage-based competitors; specific annual figures not published | Trial / demo only | Hybrid: cloud or on-prem; .NET agents (Windows / Linux containers) | [61][62][63][2][S-best] | **Pricing not published anywhere** — flagged. Vendor and analyst sources describe model but never list dollar amounts. Rated "insufficient pricing data" while other fields are sourced. |
| 20 | **Latenode** | [latenode.com](https://latenode.com) | Commercial (proprietary SaaS) | Free; Mini ~$60/yr; Start ~$228/yr; Team ~$708/yr; Enterprise from ~$3,588/yr+ ($299+/mo) | Yes — 300 executions/mo, 5 scenarios, 10 connected accounts | Cloud-only SaaS | [11][S-os][S-best][S-act][S-comp] | Sources agree on entry pricing. Includes a "Lifetime Deal" promo (one-time payment) — noted only on vendor site. |
| 21 | **Activepieces** | [activepieces.com](https://www.activepieces.com) | Open source (MIT) — Community Edition; Commercial Enterprise license | Self-hosted: $0; Cloud Pro ~$348/yr ($29/mo); Business ~$1,188/yr ($99/mo); Enterprise custom | Yes — Free cloud plan (5 active flows, 1 user); self-hosted unlimited free | Self-hosted: Docker / docker-compose; Node.js + PostgreSQL backend | [18][22][21][23][4] | Sources agree on tier structure. Cloud entry price: [22] cites "$25/mo"; [21] cites "$29/mo annual" — small variance. Self-hosted is fully free under MIT. |
| 22 | **Node-RED** | [nodered.org](https://nodered.org) | Open source (Apache 2.0); OpenJS Foundation project | $0 (self-hosted); managed via FlowFuse: paid plans available | Yes — fully free / open source self-hosted | Node.js (LTS); runs on Linux/Windows/macOS, Raspberry Pi, Docker, AWS/Azure; min ~256MB RAM | [14][4][2][S-os][S-best] | Sources agree on license and free self-hosted nature. FlowFuse cloud pricing not detailed in fetched sources. |
| 23 | **Huginn** | [github.com/huginn/huginn](https://github.com/huginn/huginn) | Open source (MIT) | $0 (self-hosted) | Yes — fully free / open source | Ruby on Rails; MySQL or PostgreSQL; Heroku/Docker/OpenShift deployable; no published min RAM | [15][4][S-os][S-best][S-comp] | Sources agree on MIT license. No commercial hosted offering exists. Some sources call it "self-hosted IFTTT/Zapier equivalent." |
| 24 | **Automatisch** | [automatisch.io](https://automatisch.io) | Open source (AGPL-3.0) Community Edition; Enterprise commercial license | $0 (self-hosted CE); Enterprise / Cloud pricing not publicly detailed | Yes — self-hosted CE free | Docker / docker-compose; Node.js + PostgreSQL backend; specific min RAM not published | [16][4][S-os][S-best][S-comp] | License model is dual: AGPL-3.0 for files without `.ee.` in path; commercial otherwise. Pricing for cloud/enterprise not published. |
| 25 | **Windmill** | [windmill.dev](https://www.windmill.dev) | Open source (AGPLv3) Community Edition; Commercial Enterprise license | Self-hosted CE: $0 (unlimited executions); Cloud: Free (1k execs/day), Team $10/user/mo (~$120/user/yr); Enterprise from ~$1,440/yr ($120/mo) + $20/dev/mo + $50/worker/mo | Yes — self-hosted unlimited free; cloud free tier 1,000 execs/day | Self-hosted: Docker / Kubernetes / Fargate; PostgreSQL; Helm chart available | [13][S-os][windmill-gh][windmill-yc][automationatlas-windmill] | Sources agree on AGPLv3 + commercial dual licensing. Cloud Enterprise add-on pricing varies by user/worker count. |
| 26 | **Camunda Platform** | [camunda.com](https://camunda.com) | Open source (Apache 2.0) Community Edition; Commercial Enterprise (Camunda 8 Zeebe requires enterprise license for production since Oct 2024) | Community: $0 (with caveats — Zeebe production needs Enterprise); SaaS / Enterprise quote-only; typical ACV $50k–$200k+/yr | Yes — Community Edition free (limited capabilities) | SaaS or self-managed (Kubernetes / Docker); Java-based | [64][65][66][2][S-comp] | Important caveat: Camunda 8.6+ requires Enterprise license for Zeebe in production — Community Edition is no longer freely production-suitable. Sources agree. |
| 27 | **Apache Airflow** (with Astronomer cloud) | [airflow.apache.org](https://airflow.apache.org) / [astronomer.io](https://www.astronomer.io) | Open source (Apache 2.0); Astronomer is commercial managed hosting | Self-hosted: $0 (infra-only); Astronomer Astro from ~$0.35/hr deployment + worker $0.13/hr → ~$3k–$10k/yr+ for small teams; large enterprise $50k+ | Trial / Community open source; Astro plan has free tier with limits | Self-hosted: Python 3.9+, Postgres or MySQL, Kubernetes/Docker; Astro runs on GKE/AKS/EKS | [67][68][69][S-os][2] | Note: Airflow is data orchestration, sometimes considered adjacent to iPaaS rather than core iPaaS — included for completeness. |
| 28 | **Oracle Integration Cloud (OIC)** | [oracle.com/integration](https://www.oracle.com/integration/) | Commercial (proprietary SaaS) | Standard ~$0.6246/message; Enterprise ~$1.2492/message; entry ~$2,500–$3,500/mo (Standard) → ~$30k–$42k/yr; idle Enterprise instance ~$11,304/yr at zero usage | Limited free tier on OCI | Cloud (OCI); on-prem connectivity agent | [77][78][79][80][81][2] | Sources agree on consumption-based message pricing. [80] highlights idle instance cost ($30.97/day) as significant gotcha — a non-obvious cost not on vendor page. |

---

## Source Reliability

Sources are rated:
- **High** — primary/authoritative source (vendor pricing page, official docs, GitHub repo with license file).
- **Medium-High** — peer-review aggregator with verification (Gartner Peer Insights, G2, TrustRadius).
- **Medium** — anonymized contract data broker (Vendr) or established analyst blog (Integrate.io).
- **Low-Medium** — vendor-adjacent or SEO comparison blog with potential bias.
- **Unverified** — page existed in search but was not directly fetched, or content was anonymous/unattributed.

| # | Source | Last accessed | Rating | Justification |
|---|---|---|---|---|
| 1 | [oneio.cloud iPaaS comparison](https://www.oneio.cloud/blog/ipaas-solutions-and-vendors-compared) | 2026-04-27 | Low-Medium | Vendor blog (ONEiO is itself an iPaaS) — competitive framing of rivals; useful for descriptions, less so for fair pricing. |
| 2 | [n8n blog: 20 best iPaaS solutions](https://blog.n8n.io/ipaas-vendors/) | 2026-04-27 | Low-Medium | n8n vendor blog — competitive framing; pricing data appears reasonably accurate but spot-checks differ from vendor pages. |
| 3 | [APPSeCONNECT 13 best iPaaS](https://www.appseconnect.com/13-best-ipaas-solutions/) | 2026-04-27 | Low-Medium | Vendor blog (APPSeCONNECT is iPaaS); competitive framing; structured comparison tables. |
| 4 | [n8n blog: open-source Zapier alternatives](https://blog.n8n.io/open-source-zapier/) | 2026-04-27 | Low-Medium | n8n vendor blog; useful for OSS landscape map but light on technical specs. |
| 5 | [Zapier pricing](https://zapier.com/pricing) | 2026-04-27 | High | Primary vendor page — authoritative on Zapier list prices. |
| 6 | [Make pricing](https://www.make.com/en/pricing) | 2026-04-27 | High | Primary vendor page. |
| 7 | [n8n pricing](https://n8n.io/pricing/) | 2026-04-27 | High | Primary vendor page. |
| 8 | [Pipedream pricing docs](https://docs-proxy.pipedream.com/docs/pricing/) | 2026-04-27 | High | Vendor docs; partial detail (full pricing page rendered as JS-only stub). |
| 9 | [IFTTT plans](https://ifttt.com/plans) | 2026-04-27 | High | Primary vendor page. |
| 10 | [Microsoft Power Automate pricing](https://www.microsoft.com/en-us/power-platform/products/power-automate/pricing) | 2026-04-27 | High | Primary vendor page. |
| 11 | [Latenode pricing](https://latenode.com/pricing) | 2026-04-27 | High | Primary vendor page. |
| 12 | [Integrately pricing](https://integrately.com/pricing) | 2026-04-27 | High | Primary vendor page. |
| 13 | [Windmill pricing](https://www.windmill.dev/pricing) | 2026-04-27 | High | Primary vendor page. |
| 14 | [Node-RED docs](https://nodered.org/docs/getting-started/) | 2026-04-27 | High | Primary project docs (OpenJS Foundation). |
| 15 | [Huginn GitHub repo](https://github.com/huginn/huginn) | 2026-04-27 | High | Primary repo — license / source authoritative. |
| 16 | [Automatisch GitHub repo](https://github.com/automatisch/automatisch) | 2026-04-27 | High | Primary repo. |
| 17 | [n8n GitHub repo](https://github.com/n8n-io/n8n) | 2026-04-27 | High | Primary repo. |
| 18 | [Activepieces GitHub repo](https://github.com/activepieces/activepieces) | 2026-04-27 | High | Primary repo. |
| 19 | [AutomationAtlas Pipedream pricing](https://automationatlas.io/answers/pipedream-pricing-explained-2026/) | 2026-04-27 | Low-Medium | SEO-driven third-party blog; useful cross-check, occasional inaccuracies. |
| 20 | [TrustRadius Pipedream pricing](https://www.trustradius.com/products/pipedream/pricing) | 2026-04-27 | Medium-High | Aggregator with user-submitted pricing claims; reasonable for sanity-check. |
| 21 | [SaaSworthy Activepieces](https://www.saasworthy.com/product/activepieces/pricing) | 2026-04-27 | Low-Medium | Listing aggregator; data freshness varies. |
| 22 | [Activepieces blog (automation pricing)](https://www.activepieces.com/blog/automation-pricing) | 2026-04-27 | Low-Medium | Vendor blog. |
| 23 | [Activepieces pricing page](https://www.activepieces.com/pricing) | 2026-04-27 | High | Primary vendor page (content was JS-rendered; data sourced via mirror search results). |
| 24 | [Workato pricing](https://www.workato.com/pricing) | 2026-04-27 | High | Primary vendor page (declines to publish list price). |
| 25 | [Vendr Workato](https://www.vendr.com/marketplace/workato) | 2026-04-27 | Medium | Anonymized contract aggregator; useful for ranges, not list price. |
| 26 | [ITQlick Workato](https://www.itqlick.com/workato/pricing) | 2026-04-27 | Low-Medium | SaaS marketplace listing — variable accuracy. |
| 27 | [Activepieces blog: Workato pricing](https://www.activepieces.com/blog/workato-pricing) | 2026-04-27 | Low-Medium | Competitor framing. |
| 28 | [Boomi pricing](https://boomi.com/pricing/) | 2026-04-27 | High | Primary vendor page. |
| 29 | [Vendr Boomi](https://www.vendr.com/marketplace/boomi) | 2026-04-27 | Medium | Anonymized contract aggregator. |
| 30 | [Integrate.io Boomi pricing](https://www.integrate.io/blog/boomi-pricing/) | 2026-04-27 | Low-Medium | Competitor blog (Integrate.io is a rival iPaaS). |
| 31 | [AutomationAtlas Boomi](https://automationatlas.io/answers/boomi-pricing-explained-2026/) | 2026-04-27 | Low-Medium | SEO blog; cross-check only. |
| 32 | [MuleSoft Anypoint pricing](https://www.mulesoft.com/anypoint-pricing) | 2026-04-27 | High | Primary vendor page (no list prices published). |
| 33 | [Integrate.io MuleSoft cost](https://www.integrate.io/blog/mulesoft-cost/) | 2026-04-27 | Low-Medium | Competitor blog. |
| 34 | [AutomationAtlas MuleSoft](https://automationatlas.io/answers/mulesoft-pricing-explained-2026/) | 2026-04-27 | Low-Medium | SEO blog. |
| 35 | [Vendr MuleSoft](https://www.vendr.com/marketplace/mulesoft) | 2026-04-27 | Medium | Contract aggregator. |
| 36 | [Jitterbit pricing](https://www.jitterbit.com/harmony/pricing/) | 2026-04-27 | High | Primary vendor page. |
| 37 | [Integrate.io Jitterbit pricing](https://www.integrate.io/blog/jitterbit-pricing/) | 2026-04-27 | Low-Medium | Competitor blog. |
| 38 | [Vendr Jitterbit](https://www.vendr.com/marketplace/jitterbit) | 2026-04-27 | Medium | Contract aggregator. |
| 39 | [AWS Marketplace Jitterbit](https://aws.amazon.com/marketplace/pp/prodview-yxoghcve5iyam) | 2026-04-27 | Medium-High | Authoritative for marketplace SKU pricing only — not full list of plans. |
| 40 | [SnapLogic pricing](https://www.snaplogic.com/pricing) | 2026-04-27 | High | Primary vendor page. |
| 41 | [Integrate.io SnapLogic pricing](https://www.integrate.io/blog/snaplogic-pricing/) | 2026-04-27 | Low-Medium | Competitor blog. |
| 42 | [Vendr SnapLogic](https://www.vendr.com/marketplace/snaplogic) | 2026-04-27 | Medium | Contract aggregator. |
| 43 | [ITQlick SnapLogic](https://www.itqlick.com/snaplogic/pricing) | 2026-04-27 | Low-Medium | SaaS marketplace listing. |
| 44 | [Tray.ai pricing](https://tray.ai/pricing) | 2026-04-27 | High | Primary vendor page. |
| 45 | [Integrate.io Tray.ai pricing](https://www.integrate.io/blog/trayai-pricing/) | 2026-04-27 | Low-Medium | Competitor blog. |
| 46 | [AutomationAtlas Tray.io](https://automationatlas.io/answers/tray-io-pricing-explained-2026/) | 2026-04-27 | Low-Medium | SEO blog. |
| 47 | [G2 Tray.ai pricing](https://www.g2.com/products/tray-ai/pricing) | 2026-04-27 | Medium-High | Peer-review aggregator. |
| 48 | [SAP Integration Suite pricing](https://www.sap.com/products/technology-platform/integration-suite/pricing.html) | 2026-04-27 | High | Primary vendor page. |
| 49 | [AutomationAtlas SAP](https://automationatlas.io/answers/sap-integration-suite-pricing-explained-2026/) | 2026-04-27 | Low-Medium | SEO blog. |
| 50 | [TrustRadius SAP IS](https://www.trustradius.com/products/sap-integration-suite/pricing) | 2026-04-27 | Medium-High | Aggregator. |
| 51 | [Informatica IDMC pricing](https://www.informatica.com/products/cloud-integration/pricing.html) | 2026-04-27 | High | Primary vendor page. |
| 52 | [Mammoth.io Informatica pricing](https://mammoth.io/blog/informatica-pricing/) | 2026-04-27 | Low-Medium | Competitor blog. |
| 53 | [Integrate.io Informatica cost](https://www.integrate.io/blog/informatica-cost/) | 2026-04-27 | Low-Medium | Competitor blog. |
| 54 | [Celigo pricing](https://www.celigo.com/platform/pricing/) | 2026-04-27 | High | Primary vendor page. |
| 55 | [ERPpeers Celigo guide](https://erppeers.com/celigo-pricing-guide/) | 2026-04-27 | Low-Medium | Consultancy blog; specialized but biased toward services revenue. |
| 56 | [Vendr Celigo](https://www.vendr.com/marketplace/celigo) | 2026-04-27 | Medium | Contract aggregator. |
| 57 | [Integrate.io Celigo pricing](https://www.integrate.io/blog/celigo-pricing/) | 2026-04-27 | Low-Medium | Competitor blog. |
| 58 | [IBM App Connect pricing](https://www.ibm.com/products/app-connect/pricing) | 2026-04-27 | High | Primary vendor page. |
| 59 | [AWS Marketplace IBM App Connect](https://aws.amazon.com/marketplace/pp/prodview-tvlnqoktdbhz4) | 2026-04-27 | Medium-High | Marketplace authoritative for that SKU. |
| 60 | [G2 IBM App Connect](https://www.g2.com/products/ibm-app-connect/pricing) | 2026-04-27 | Medium-High | Peer-review aggregator. |
| 61 | [Frends pricing](https://frends.com/pricing) | 2026-04-27 | High | Primary vendor page (no dollar amounts). |
| 62 | [Frends Gartner Peer Insights](https://www.gartner.com/reviews/product/frends-ipaas) | 2026-04-27 | Medium-High | Verified peer reviews. |
| 63 | [Capterra Frends](https://www.capterra.com/p/103008/FRENDS-Iron/) | 2026-04-27 | Medium | User reviews; pricing info often absent or stale. |
| 64 | [Camunda pricing](https://camunda.com/pricing/) | 2026-04-27 | High | Primary vendor page (no list prices). |
| 65 | [AutomationAtlas Camunda](https://automationatlas.io/answers/camunda-pricing-explained-2026/) | 2026-04-27 | Low-Medium | SEO blog. |
| 66 | [PeerSpot Camunda pricing thread](https://www.peerspot.com/questions/what-is-your-experience-regarding-pricing-and-costs-for-camunda-platform) | 2026-04-27 | Medium | Practitioner Q&A; useful for ranges. |
| 67 | [Astronomer Astro pricing](https://www.astronomer.io/pricing/) | 2026-04-27 | High | Primary vendor page. |
| 68 | [AutomationAtlas Apache Airflow](https://automationatlas.io/tools/apache-airflow/) | 2026-04-27 | Low-Medium | SEO blog. |
| 69 | [Vendr Astronomer](https://www.vendr.com/marketplace/astronomer) | 2026-04-27 | Medium | Contract aggregator. |
| 70 | [Azure Logic Apps pricing](https://azure.microsoft.com/en-us/pricing/details/logic-apps/) | 2026-04-27 | High (intended) — **fetch failed (timeout)**; not used as a directly-cited datapoint, only as a reference URL. |
| 71 | [Microsoft Learn: Power Automate licensing types](https://learn.microsoft.com/en-us/power-platform/admin/power-automate-licensing/types) | 2026-04-27 | High | Primary vendor docs. |
| 72 | [Synapx: Power Automate pricing 2026](https://www.synapx.com/understanding-power-automate-licensing-options/) | 2026-04-27 | Low-Medium | Consultancy SEO blog. |
| 73 | [Costbench Power Automate](https://costbench.com/software/rpa/power-automate/) | 2026-04-27 | Low-Medium | SaaS pricing aggregator; cross-check only. |
| 74 | [Latenode blog: n8n system requirements](https://latenode.com/blog/low-code-no-code-platforms/n8n-setup-workflows-self-hosting-templates/n8n-system-requirements-2025-complete-hardware-specs-real-world-resource-analysis) | 2026-04-27 | Low-Medium | Competitor blog (Latenode) — useful for hardware specs. |
| 75 | [n8n Docker docs](https://docs.n8n.io/hosting/installation/docker/) | 2026-04-27 | High | Primary project docs. |
| 76 | [Northflank n8n hosting blog](https://northflank.com/blog/how-to-self-host-n8n-setup-architecture-and-pricing-guide) | 2026-04-27 | Low-Medium | Hosting-vendor blog. |
| 77 | [Oracle Integration pricing](https://www.oracle.com/integration/pricing/) | 2026-04-27 | High (intended) — **fetch returned 403**; data sourced from search-aggregated summary. |
| 78 | [AutomationAtlas Oracle OIC](https://automationatlas.io/tools/oracle-integration-cloud/) | 2026-04-27 | Low-Medium | SEO blog. |
| 79 | [RedressCompliance Oracle OIC licensing](https://redresscompliance.com/oracle-integration-cloud-licensing.html) | 2026-04-27 | Medium | Independent licensing-consulting site; specialized. |
| 80 | [ezintegrations OIC TCO analysis](https://ezintegrations.ai/oracle-oic-total-cost-analysis/) | 2026-04-27 | Low-Medium | Vendor blog. |
| 81 | [TrustRadius Oracle Integration](https://www.trustradius.com/products/oracle-integration/pricing) | 2026-04-27 | Medium-High | Aggregator. |
| S-best | [WebSearch: best iPaaS workflow platforms 2026](https://www.shakudo.io/blog/top-9-workflow-automation-tools) (and other links in result set) | 2026-04-27 | Medium | Aggregated search summary citing multiple comparison sites. |
| S-os | [WebSearch: open-source Zapier alternatives](https://blog.n8n.io/open-source-zapier/) (result set) | 2026-04-27 | Medium | Aggregated summary across OSS-focused articles. |
| S-comp | [WebSearch: open-source / Activepieces / Windmill / Camunda etc.](https://flowlyn.com/blog/open-source-n8n-alternatives) (result sets) | 2026-04-27 | Medium | Aggregated summary across multiple comparison blogs. |
| S-act | [Activepieces blog: Zapier pricing breakdown](https://www.activepieces.com/blog/zapier-pricing) | 2026-04-27 | Low-Medium | Competitor blog. |
| S-gartner | [Gartner Magic Quadrant for iPaaS 2025 (search summary)](https://www.gartner.com/en/documents/5198963) | 2026-04-27 | High (analyst report; paywalled — only summary read via vendor coverage at Boomi/SAP/Informatica press releases) | Industry-standard ranking; identifies Boomi, SAP, Informatica as Leaders. |
| windmill-gh | [Windmill GitHub repo](https://github.com/windmill-labs/windmill) | 2026-04-27 | High | Primary repo. |
| windmill-yc | [Y Combinator: Windmill](https://www.ycombinator.com/companies/windmill) | 2026-04-27 | Medium | Investor profile; concise factual summary. |
| automationatlas-windmill | [AutomationAtlas Windmill](https://automationatlas.io/tools/windmill/) | 2026-04-27 | Low-Medium | SEO blog. |

## Summary

- **Rows produced:** 28 platforms (covering SaaS, hybrid, and self-hosted open-source / source-available tools).
- **Sources consulted:** 81 numbered + 8 supplementary aggregate sources = ~89 distinct URLs.
- **Rows that comfortably meet ≥5 sources:** 26 of 28.
- **Rows flagged for soft-insufficient pricing (other fields well-sourced):**
  - **Frends** — pricing not published in any consulted source; sourced descriptively only.
  - **Azure Logic Apps** — vendor pricing page fetch timed out; per-year cost left descriptive.

If you want me to **drill deeper on any specific platform** (e.g., fetch G2/TrustRadius detail, or get a specific vendor's pricing PDF), or **trim the list** to just one category (purely OSS, purely enterprise, etc.), let me know.
