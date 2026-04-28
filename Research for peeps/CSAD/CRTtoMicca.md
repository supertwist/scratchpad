## Connecting a CRT Display to a Micca Spec Media Player with a Coaxial (RCA) Cable  
*(Step‑by‑step guide for the most common setups – composite video over an RCA “coax” cable. If your CRT only has an RF‑coax (antenna) input, see the **Optional RF‑Modulator** section at the end.)*  

---

### 1.  What You’ll Need

| Item | Why it’s required | Typical specs / notes |
|------|-------------------|-----------------------|
| **Micca Spec Media Player** | Source of video/audio | Usually has HDMI, composite (RCA) and coaxial digital‑audio outputs |
| **CRT TV or monitor** | Destination display | Must have a **Composite Video (RCA – yellow)** input **or** an **RF‑coax (antenna) jack** |
| **RCA “coaxial” cable** (¼‑inch → ¼‑inch, also called “composite video cable”) | Carries analog video (and optionally audio) | 1‑meter or longer, 75 Ω characteristic impedance; colour‑coded (yellow for video, red/white for audio) |
| **RCA audio cables** (optional) | Separate stereo audio if you want full‑range sound from the CRT’s speakers or an external amp | Red = right, White = left |
| **Power cords** for both devices | Power them up safely | Plug into grounded outlet |
| **RF‑modulator** (optional) | Converts composite → RF if the CRT only has an antenna input | 1‑channel (3 / 4) or 2‑channel (3 / 4 + 5 / 6) models work |
| **Phillips screwdriver** (optional) | To tighten any loose rear panel screws after cabling |
| **Sticky notes / marker** (optional) | Label cables for future reference |

---

### 2.  Quick Overview of Signal Types

| Signal | Connector | Cable colour | Frequency / bandwidth |
|--------|------------|--------------|-----------------------|
| **Composite video** (analog) | RCA (male‑to‑male) | Yellow | ~0‑6 MHz (NTSC) or ~0‑5 MHz (PAL) |
| **Stereo audio (L+R)** | RCA (male‑to‑male) | White (L) / Red (R) | 20 Hz‑20 kHz |
| **Coaxial digital audio** (optional) | RCA (male‑to‑male) | Orange (or sometimes black) | 1‑2 MHz (S/PDIF) |
| **RF (antenna)** | 75 Ω coax (F‑type) | Black/white | 47‑860 MHz (TV band) – the CRT expects a modulated RF carrier on channel 3 or 4 |

> **NOTE:** When people say “coaxial cable” in a home‑theatre context they often mean the **RCA composite video** cable, not a true 75 Ω RF coax. The instructions below assume the former. The **Optional RF‑Modulator** section covers the latter.

---

### 3.  Preparing the Devices

1. **Turn everything off**  
   - Unplug the Micca Spec player and the CRT from mains.  
   - This prevents any accidental short‑circuits and protects the video circuitry while you plug/unplug cables.

2. **Locate the ports**  

   **Micca Spec Media Player** (typical rear panel)  

   | Port | Symbol | Use |
   |------|--------|-----|
   | **AV OUT** (Composite) | 🎞️ Yellow circle | Composite video |
   | **AUDIO OUT (L/R)** | 🔊 Red/White circles | Stereo analog audio |
   | **HDMI OUT** | HDMI logo | Not needed for CRT (unless you have an HDMI‑to‑RF converter) |
   | **COAXIAL DIGITAL OUT** | Orange circle | Optional digital audio – ignore for CRT video |

   **CRT TV** (usually rear or side panel)  

   | Port | Symbol | Use |
   |------|--------|-----|
   | **VIDEO IN** (Composite) | 🎞️ Yellow circle | Composite video |
   | **AUDIO IN** (L/R) | 🔊 Red/White circles | Stereo audio (if the CRT has built‑in speakers) |
   | **ANTENNA IN** (RF) | F‑type coax | Use only if no composite input (see Section 8) |

3. **Check the video standard**  
   - The Micca Spec player can output NTSC (U.S.) or PAL (Europe/Australia) composite video.  
   - Set the player to match the CRT’s native standard (usually printed on the CRT’s back panel).  
   - If you’re unsure, try NTSC first; most modern players automatically switch to PAL when they detect a PAL‑capable display.

---

### 4.  Wiring the Composite Video (Yellow RCA)

1. **Grab the yellow RCA plug on the Micca Spec** (labelled “VIDEO OUT” or just a yellow jack).  
2. **Insert it firmly into the **yellow** video‑in jack on the CRT**.  
   - You should feel a slight click; the centre pin must align with the centre pin of the CRT jack.  
3. **Optional – Secure the connection**  
   - If the cable is loose, you can gently push a small piece of tape over the plug and the socket to keep it from wobbling.

> **Tip:** The composite cable carries only video. If you want audio, you must also connect the red/white RCA audio cables (see Section 5).

---

### 5.  Wiring the Stereo Audio (Red / White RCA) – Optional but Recommended

| Micca Spec | CRT |
|------------|-----|
| **Red (right)** | **Red (right)** |
| **White (left)** | **White (left)** |

1. **Take the red audio plug** from the Micca Spec (labelled “AUDIO OUT R” or simply “R”).  
2. **Plug it into the red audio‑in jack on the CRT**.  
3. **Repeat with the white plug** (left channel).  

*If the CRT has no audio inputs (many old CRTs only have a speaker built‑in with no external audio jack), you can instead route the audio to an external amplifier or speakers using the same red/white cables.*

---

### 6.  Power‑On Sequence & Initial Configuration

| Step | Action |
|------|--------|
| **1** | Plug the Micca Spec power cord into a grounded outlet and turn the player on. |
| **2** | Plug the CRT power cord into a grounded outlet and turn the CRT on. |
| **3** | Using the CRT’s **Input/Source** button (or remote), select **AV**, **VIDEO**, **COMPOSITE**, or **VIDEO‑IN** (exact wording varies). |
| **4** | On the Micca Spec, go to **Settings → Video Output** and make sure **Composite** (sometimes called “AV”) is selected. If there’s an option for “NTSC/PAL”, set it to match the CRT. |
| **5** | Press **Play** on the Micca Spec and watch the CRT screen. You should see the media player’s menu or the first frame of the video. |
| **6** | Adjust the CRT’s **Brightness**, **Contrast**, **Sharpness**, and **Color** controls to taste. If the picture is too noisy or faint, double‑check that the composite cable is fully seated. |

---

### 7.  Fine‑Tuning & Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| **No picture** | Cable not fully inserted, wrong input selected, or player still in HDMI mode. | Re‑seat yellow plug, switch CRT input to AV, set Micca Spec video output to Composite. |
| **All‑black screen** | TV set to wrong video standard (NTSC vs PAL). | Change the player’s video standard or, if the CRT is fixed PAL, get a PAL‑compatible player/convertor. |
| **Snowy or static picture** | Loose cable, damaged cable, or interference from nearby power cords. | Use a fresh RCA cable, keep it away from power cords, ensure tight connections. |
| **No sound** | Audio cables not connected, CRT speakers muted, or volume set to 0. | Connect red/white cables, raise CRT volume, or route audio to external speakers. |
| **Audio out of sync with video** | Rare with analog composite; can happen if using an RF‑modulator. | Use direct composite (as described) – eliminates sync issues. |
| **Picture is too bright or washed out** | CRT’s picture‑mode set to “Dynamic” or “Vivid”. | Switch CRT to “Standard” or “Movie” mode. |
| **Video appears stretched or squashed** | CRT is set to a different aspect ratio (4:3 vs 16:9). | Set CRT to **4:3** (most CRTs default to this). |

---

### 8.  Optional: Using an RF‑Modulator (If Your CRT Lacks Composite Input)

Some very old CRTs only have a **coaxial “Antenna” (RF) jack** (F‑type). In that case you need an **RF‑modulator** that will convert the Micca Spec’s composite output into a TV‑channel‑modulated RF signal.

#### 8.1 What You’ll Need

| Item | Reason |
|------|--------|
| **RF‑Modulator** (e.g., “RCA RF Modulator 1‑Channel” or “2‑Channel 3/4 & 5/6”) | Converts composite → RF |
| **RCA composite cable** (yellow) – same as used above |
| **RCA audio cable** (optional) – many modulator units have built‑in audio handling |
| **75 Ω coax (F‑type) cable** – usually supplied with the modulator | Connects modulator output to CRT antenna input |

#### 8.2 Wiring Diagram

```
Micca Spec               RF Modulator                CRT
-----------   ---------   ----------------   ----------------
Video (Y)  --->| Yellow |--> Composite In   |  RF Out (F‑type) ---> Antenna In
Audio L (W) --->| White  |                |
Audio R (R) --->| Red    |                |
Power (AC) ----> Power brick (if required)   |
```

#### 8.3 Step‑by‑Step

1. **Power off everything** (player, CRT, modulator).  
2. **Connect the yellow video plug** from the Micca Spec to the **Composite Video IN** on the RF‑modulator.  
3. **Connect the red & white audio plugs** (if you want audio through the CRT’s speakers) to the modulator’s **Audio IN** jacks.  
4. **Plug the supplied 75 Ω coax (F‑type) cable** from the modulator’s **RF OUT** into the CRT’s **Antenna / RF IN** socket.  
5. **Set the modulator’s channel selector** to **Channel 3** (or **4**, depending on which channel your CRT’s tuner is tuned to). Most inexpensive mod‑units have a simple rotary switch.  
6. **Power the modulator** (some are “pass‑through” and need only the player’s power; others have a small AC adapter).  
7. **Turn on the CRT**, then use the TV’s remote or front‑panel to **tune to the selected channel** (3 or 4).  
8. **Turn on the Micca Spec** and press **Play**. The picture should now appear on the CRT.  

> **Tip:** The RF path adds a few dB of loss, so you may need to raise the Micca Spec’s **Video Output Level** (if the player has that setting) or increase the CRT’s **brightness** slightly.

#### 8.4 Troubleshooting RF Path

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| **No picture on selected channel** | Modulator not powered, wrong channel selected, or cable not fully seated. | Verify power LED on modulator, set correct channel, reseat F‑type plug. |
| **Very weak or fuzzy picture** | Long coax run, poor quality coax, or weak RF output. | Use a short, high‑quality 75 Ω coax; avoid splitters. |
| **Audio missing** | Modulator’s audio is muted or not connected. | Check audio level knob on the modulator (if present) and confirm RCA audio cables are in the correct jacks. |
| **Static from other broadcast stations** | CRT is not tuned precisely to the modulator’s channel. | Fine‑tune the CRT’s channel selector (often a small dial on the back) until the picture clears. |

---

### 9.  Safety & Best‑Practice Checklist

- **Never plug or unplug cables while the devices are powered** – can cause a spark or damage the RCA connectors.  
- **Use only 75 Ω coax** for RF connections; standard TV‑antenna cable is fine, but do **not** use high‑impedance speaker wire.  
- **Avoid bending the RCA plugs sharply** – stress can break the centre pin.  
- **Keep the cable run away from high‑current AC cords** to minimise electromagnetic interference (EMI).  
- **Label the cables** (e.g., “Spec → CRT video”) for future maintenance.  
- **If you ever hear a popping sound** when connecting or disconnecting, power off immediately and re‑check connections.  

---

### 10.  Quick Reference Summary

| Connection | Cable | Plug on Micca Spec | Plug on CRT | Optional hardware |
|------------|-------|--------------------|-------------|-------------------|
| **Composite video** | RCA (yellow) | Video OUT (yellow) | Video IN (yellow) | – |
| **Stereo audio** | RCA (red/white) | Audio OUT R / L | Audio IN R / L | – |
| **RF (if needed)** | Composite → RF‑Modulator → 75 Ω coax (F‑type) | Video OUT (yellow) → Modulator IN | Antenna IN (F‑type) | RF‑Modulator (Channel 3/4) |
| **Power** | AC mains | Power brick (Micca Spec) | Power cord (CRT) | – |

---

### 11.  Frequently Asked Questions (FAQ)

| Question | Answer |
|----------|--------|
| **Can I use a single coaxial cable for both video and audio?** | No. The standard “coaxial” RCA cable carries **only video** (yellow). Audio must be carried on separate red/white RCA cables, or you must use a dedicated **RF‑modulator** that multiplexes both onto a TV channel. |
| **My CRT only has a “RF/ANT” input, but I don’t have a modulator. Can I still connect?** | Not directly. You need an **RF‑modulator** or an **HDMI‑to‑RF** converter. Using a plain coaxial cable will only give you a blank screen because the CRT expects a radio‑frequency carrier, not baseband video. |
| **Will the picture be in widescreen (16:9) on a 4:3 CRT?** | The Micca Spec will output a 4:3‑compatible composite signal (most media are letterboxed). The CRT will display it with black bars on top/bottom (letterbox) or with a “pan‑and‑scan” stretch if you enable a widescreen mode on the TV (if available). |
| **Is there any risk of damaging my CRT by using the composite input?** | No. Composite video is a low‑voltage (≤ 1 V peak‑to‑peak) signal and is safe for any TV that includes a composite jack. |
| **What if my CRT has a “S‑Video” input?** | The Micca Spec does **not** provide S‑Video, so you must use composite. S‑Video would give a sharper picture, but you’d need a separate converter (Composite‑to‑S‑Video) which is rarely worth the effort for a CRT. |
| **Can I use a “coaxial digital audio” (S/PDIF) output for sound on the CRT?** | Only if the CRT has a coaxial digital audio decoder (rare on consumer CRTs). Most CRTs only accept analog RCA audio, so stick with red/white cables. |

---

## TL;DR – One‑Page “Cheat Sheet”

1. **Power off** both devices.  
2. **Plug yellow RCA** from Micca Spec “Video OUT” → CRT “Video IN”.  
3. **(Optional)** plug red & white RCA audio from Micca Spec → CRT audio in.  
4. **Power on** Micca Spec, then CRT.  
5. Set CRT **input source** to **AV/Composite**.  
6. On Micca Spec, set **Video Output → Composite** and match NTSC/PAL.  
7. Press **Play** – you should see video and hear audio.  
8. **If CRT only has RF input:**  
   - Insert composite cable into an **RF‑modulator**.  
   - Connect modulator’s **RF out (F‑type)** to CRT’s **Antenna**.  
   - Set modulator to **Channel 3** (or 4) and tune CRT to that channel.  

Enjoy your vintage CRT with modern media! 🎬🕹️