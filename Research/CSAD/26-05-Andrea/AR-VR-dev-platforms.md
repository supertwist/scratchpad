+ Model: claude-opus-4-7[1m]
+ Prompt: Create a table that includes a list of environments for developing cross-platform AR/VR content. The first column is the name of the environment. The second column is a link to its home page; check the link — if 404 do not include. The third column lists pricing; indicate if there is a free tier; indicate if it is open source. The fourth column indicates OS and system requirements. The fifth column assesses learning curve.
+ Date: 26/05/14

# Cross-Platform AR/VR Development Environments

| Environment | Home Page | Pricing / Free Tier / Open Source | OS & System Requirements | Learning Curve |
|---|---|---|---|---|
| **Unity 6** | [unity.com](https://unity.com/) | **Proprietary.** Free **Unity Personal** for individuals/orgs under $200K/yr revenue. Unity Pro $2,310/yr (Jan 2026 price); Enterprise & Industry tiers above. No runtime fee. | Editor on Windows 10+ (x64), macOS 11+ (Intel/Apple Silicon), Linux (Ubuntu LTS). Recommended: 8–16 GB RAM, DX11/Metal/Vulkan-capable GPU. Builds for Meta Quest, Vision Pro, HoloLens, PSVR2, iOS/Android AR, WebGL. | **Moderate.** C# scripting; massive Asset Store and XR Interaction Toolkit shorten ramp-up; broad tutorials. |
| **Unreal Engine 5** | [unrealengine.com](https://www.unrealengine.com/) | **Proprietary, source-available.** Free for students, educators, hobbyists, and companies under $1M/yr gross. 5% royalty above $1M lifetime gross (game projects). Non-game commercial seat license: $1,850/seat/yr. | Editor on Windows 10/11 64-bit, macOS 13+, Linux (community). Recommended: 8-core CPU, 32–64 GB RAM, RTX-class GPU, fast NVMe. Builds for Quest, Vision Pro, PSVR2, iOS/Android, WebXR via plugin. | **Steep.** Blueprints visual scripting eases entry; C++, Nanite/Lumen, and asset pipeline take time to master. |
| **Godot 4** | [godotengine.org](https://godotengine.org/) | **Free, fully open source (MIT).** No royalties, no revenue caps, no seat fees. | Small editor (~100 MB). Runs on Windows 7+, macOS 10.13+, Linux, *BSD, web. Low system floor (works on integrated GPUs). XR via built-in OpenXR; targets Quest, SteamVR, mobile AR. | **Moderate.** GDScript (Python-like) is approachable; smaller XR ecosystem than Unity/Unreal means more DIY. |
| **A-Frame** | [aframe.io](https://aframe.io/) | **Free, open source (MIT).** Mozilla-originated; community-maintained. | Browser-based — any OS with a modern WebXR-capable browser (Chrome, Edge, Oculus Browser, Wolvic). HTTPS required. Runs on Quest, Pico, Vision Pro (via WebXR), Android ARCore. iOS Safari WebXR support limited. | **Easy.** HTML-tag, entity-component model; lowest barrier for designers/web devs. Performance ceiling lower than native engines. |
| **Babylon.js** | [babylonjs.com](https://www.babylonjs.com/) | **Free, open source (Apache 2.0).** Maintained by Microsoft; no commercial tiers. | Browser-based (WebGL2/WebGPU); Babylon Native and React Native runtimes for desktop/mobile. Works in any modern browser; HTTPS required for WebXR. | **Moderate.** TypeScript/JavaScript; extensive Playground/Sandbox tools; most complete WebXR feature set of the JS frameworks. |
| **Three.js** | [threejs.org](https://threejs.org/) | **Free, open source (MIT).** | Browser-based; needs WebGL 2.0. WebXR on Chrome/Edge/Oculus Browser/Wolvic. HTTPS required. iOS Safari does not yet implement WebXR. | **Moderate–Steep.** Lower-level than A-Frame/Babylon — you build scene management, physics, XR controllers yourself, but ecosystem is enormous. |
| **PlayCanvas** | [playcanvas.com](https://playcanvas.com/) | **Open source engine (MIT).** Cloud editor is freemium: free tier with unlimited public projects, 1 GB storage, hosting. Paid Personal/Organization/Enterprise plans for private projects and more storage. | Browser-based editor (no install). Runs in any modern browser; WebGPU and WebGL2 support. Targets Quest, mobile AR (WebXR), iOS/Android via wrappers. | **Easy–Moderate.** Real-time collaborative editor is friendly to non-coders; JavaScript scripting for logic. |
| **Wonderland Engine** | [wonderlandengine.com](https://wonderlandengine.com/) | **Proprietary editor; free tier** up to $120K/yr combined project revenue, then 10% royalty. Seated Enterprise license removes branding/loading screen. | Editor on Windows, macOS, Linux. Builds to WebXR (Quest, Pico, Vision Pro, mobile AR). Optimized specifically for browser XR performance. | **Moderate.** Component-based with JS/TypeScript; WebXR-focused tooling shortens XR-specific ramp-up vs. general engines. |
| **Open 3D Engine (O3DE)** | [o3de.org](https://o3de.org/) | **Free, open source (Apache 2.0 / MIT).** Linux Foundation project (forked from Amazon Lumberyard). | Editor on Windows 10/11 64-bit, Linux (Ubuntu 22.04+). Recommended: 16+ GB RAM, modern discrete GPU. OpenXR support for VR; AR via custom integrations. | **Steep.** Large modular C++/Lua codebase, smaller community than Unity/Unreal; documentation still maturing for XR. |

---

## Source Reliability

| Source | Reliability | Notes |
|---|---|---|
| Vendor home pages (unity.com, unrealengine.com, godotengine.org, aframe.io, babylonjs.com, playcanvas.com, wonderlandengine.com, threejs.org, o3de.org) | High (primary) | Authoritative for features, license, and platform claims; may understate limitations. |
| [Unity Pricing Changes](https://unity.com/products/pricing-updates) / [CG Channel report](https://www.cgchannel.com/2025/11/price-of-paid-unity-subscriptions-to-rise-but-free-subs-extended/) | High / Medium-High | Vendor + reputable industry press for the Jan 2026 Pro price uplift and Personal $200K threshold. |
| [Unreal Engine License page](https://www.unrealengine.com/license) | High | Authoritative for 5% royalty, $1M threshold, and $1,850/seat non-game tier. |
| [Wonderland Engine Pricing](https://wonderlandengine.com/pricing/) | High | Authoritative for $120K free-tier ceiling and 10% royalty. |
| [PlayCanvas Plans](https://playcanvas.com/plans) | High | Vendor-stated free tier (1 GB, unlimited public projects). |

## Notes & Caveats

- **WebXR coverage on iOS Safari** remains incomplete as of May 2026; browser-based platforms (A-Frame, Three.js, Babylon.js, PlayCanvas, Wonderland) work fully on Android/Quest/Pico but degrade on iPhone/iPad. Vision Pro's Safari supports WebXR.
- **Pricing is volatile.** Unity's runtime fee was cancelled in 2024; Epic adjusted licensing in late 2024. Verify on the vendor page before budgeting.
- "Cross-platform" is interpreted broadly: native engines (Unity, Unreal, Godot, O3DE) ship binaries to many headsets/OSes; web engines deliver one URL that runs on any WebXR-capable device.
- Excluded: Apple **RealityKit/Reality Composer Pro** (Apple-platform only), Snap **Lens Studio** / Meta **Spark** / TikTok **Effect House** (single-platform AR effect tools), **8th Wall** (subscription-only, image/face/world AR but no headset VR), **StereoKit** and **Mixed Reality Toolkit** (libraries, not full environments).
