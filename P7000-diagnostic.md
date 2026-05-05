# P7000 "Waiting for printer to become available" — Diagnostic Report

**Host:** MacBook Pro (Apple Silicon, T6050), macOS 26.4.1 (Tahoe), kernel `Darwin 25.4.0` (build `25E253`)
**User:** james
**Printer:** EPSON SureColor SC-P7000 Series (USB, no network)
**Queue:** `EPSON_SC_P7000_Series` — `usb://EPSON/SC-P7000%20Series?serial=123012108251153250`
**Driver:** Epson InkjetPrinter2, PPD `EPSON_SC_P7000_Series.ppd` (FileVersion 13.26)
**Investigation date:** 2026-05-05

---

## Top-line conclusion

There are **two independent problems active on this machine**, both contributing to the "Waiting for printer to become available" status. The first (kext) is the root cause; the second (stuck supplies job) is what makes the symptom *visible* even when the queue is empty.

1. **The Epson USB driver kernel extension `EPSONUSBPrintClass.kext` is staged but NOT loaded into the running kernel.** Without it, the CUPS `usb` backend has no way to talk to the SC-P7000 over USB.
2. **A stale CUPS "Supplies Levels" command-job (Job 4) has been wedged for ~51 minutes**, holding the USB backend slot open and parking the queue in `printer-state-reasons = offline-report`. New jobs from Photoshop join the queue but cannot be dispatched — hence the message you see.

---

## Evidence collected (read-only)

### A. The Epson USB kext is staged but not loaded

- `/Library/Extensions/EPSONUSBPrintClass.kext` exists (v2.8.5, 2018, dated Sep 27 2024 install).
- `/Library/StagedExtensions/Library/Extensions/EPSONUSBPrintClass.kext` also exists — i.e. the system staged the kext but never finished activating it.
- `kmutil showloaded | grep -i epson` → **no match**. `kextstat | grep -i epson` → **no match**.
- Bundle identifier: `com.epson.print.kext.USBPrintClass`.
- IOKitPersonalities use `IOClass = AppleUSBMergeNub` (the *legacy* IOUSBFamily pattern). Personalities cover Epson VID `0x04B8` (decimal 1208) with many product IDs — the SC-P7000 is among them.
- Purpose of the kext: it merges the property `USB Printing Class = /Library/Printers/EPSON/CIOSupport/EPSONUSBPrintClass.plugin` into matching Epson USB devices so the CUPS `usb` backend will load Epson's user-space transport plug-in instead of the generic USB-printer-class plug-in. Epson's protocol (ESC/P + D4PX + BDC bidirectional, advertised in the IEEE-1284 device ID `EpsonStd1` / `RID:02`) is **not standard USB Printer Class**, so without that plug-in the standard backend can open the device but cannot drive it.

### B. The IOKit USB tree has no enumerated Epson device right now

- `ioreg -p IOUSB -l` shows only host controllers `AppleT6050USBXHCIAUSS` and `AppleT8142USBXHCI` — no child devices. No "EPSON" / "SC-P7000" / "SureColor" string appears anywhere in the IOKit USB plane.
- `lpinfo -v` lists `network *`, `direct epsonfirewire`, `direct epsontcpip` — but **no `direct usb://...` entries**. CUPS device discovery cannot see *any* USB printer at the moment of inspection. (Compare: a working USB printer shows up here as `direct usb://EPSON/...`.)
- This is consistent with either: (a) the printer being asleep/disconnected at the moment, or (b) the kext-mediated matching path being absent so macOS isn't enumerating the device the way the rest of the print stack expects. The driver-side evidence in (A) makes (b) the more likely explanation.

### C. A stale Supplies-Levels CUPS job is blocking the queue

```
PID    ELAPSED  USER  COMMAND
17945  51:10    _lp   EPSON_SC_P7000_Series 4 james "Supplies Levels" ... /private/var/spool/cups/d00004-001
17946  51:10    _lp   usb://EPSON/SC-P7000%20Series?serial=...  4 james "Supplies Levels" ...
```

- These are the CUPS scheduler/filter and the `usb` backend for **Job 4 ("Supplies Levels")**, started 12:39:11 EDT and still running at 13:30 EDT.
- This is a `application/vnd.cups-command` job invoking `commandtoescp` with the `ReportLevels` command (declared in the PPD: `*cupsCommands: "Clean PrintSelfTestPage ReportLevels"`).
- It was triggered by Print Center / the Epson supplies poller, not by you. Print Center's widget extension (`PrintCenterWidgetExtension.macOS`) and Epson's `EpsonLaunchPSPreview` agent are both running.
- `lpstat -W not-completed` returns empty (so the *user-visible* queue is empty), but `lpstat -W all` shows several recent jobs including this one. This explains the user-reported contradiction "no jobs in the queue, but waiting for printer."
- While this job sits on the backend, `org.cups.printers.plist` records `printer-state-reasons = offline-report` for both `EPSON_SC_P7000_Series` and `EPSON_SC_P9500_Series`. The CUPS/Print Center UI translates `offline-report` to the user-facing string **"Waiting for printer to become available."**

### D. Recent CUPS error log shows the pattern

`/var/log/cups/error_log` (most recent entries, today 2026-05-05):

```
[05/May/2026:11:02:02 -0400] [Job 1] Stopping unresponsive job.
```

That entry is from immediately after you reset the printing system. Earlier history shows the same pattern repeatedly across both Epson queues:

- `Job held by "james"`
- `The printer is in use.`
- `Stopping unresponsive job.`
- `Job held for authentication.`
- `AuthorizationCopyRights("system.print.operator") returned -60007`  (errAuthorizationCanceled — admin auth dialog dismissed/denied)
- `Unable to queue job for destination "EPSON_SC_P9500_Series"` and similar.

The pattern is consistent for many months — not a one-off — and matches a backend that periodically can't talk to the device.

### E. Driver install partially incomplete (P9500 side, but worth noting)

The error log also shows dozens of:
```
Newman: ICC Profile ".../EPSON_SC-P9500_7500_*.icc" does not exist.
Newman: File ".../rastertoescpII" not available: No such file or directory
Newman: File ".../pdftopdf2" not available: No such file or directory
```

These were observed on 2026-04-09. As of today the actual binaries DO exist:

- `/Library/Printers/EPSON/InkjetPrinter2/Filter/rastertoescpII.app/Contents/MacOS/rastertoescpII` — present, 841 KB, dated Sep 28 2024.
- `/Library/Printers/EPSON/InkjetPrinter2/Filter/pdftopdf2.app/...` — directory exists, dated May 5 12:37 (today's reinstall).

So your reinstall today *did* land those binaries. But the ICC profile directory referenced in the log is for the P9500, not the P7000. The P7000 PPD points to filters that all exist. **Filters/profiles are not the cause for the P7000.**

### F. Configuration is not the cause

- `/etc/cups/cupsd.conf` and `cups-files.conf` are macOS defaults (modified by the system on `cupsctl` calls). No restrictive Listen, no abnormal Policy, default ACLs.
- `/etc/cups/ppd/EPSON_SC_P7000_Series.ppd` is well-formed and points to existing filter binaries.
- `org.cups.printers.plist` lists the queue correctly; the only abnormal field is `printer-state-reasons = offline-report` (a *symptom*, not a cause).
- The CUPS spool directory `/private/var/spool/cups` is `0710 root:_lp` (correct macOS perms — that's why your `ls` was denied; not a problem).
- `/usr/libexec/cups/backend/usb` is properly signed (`com.apple.usb`, signed Feb 21 2026) with `com.apple.security.cs.disable-library-validation` — fine.

---

## Complete list of possible causes (ranked)

### 1. **EPSONUSBPrintClass.kext not loaded** — most likely root cause
The kext is in `/Library/Extensions/` AND in `/Library/StagedExtensions/`, but `kmutil showloaded` and `kextstat` confirm it is **not in the running kernel**. On Apple Silicon + macOS 26 (Tahoe), third-party kexts need: (a) explicit user approval in **System Settings → Privacy & Security → Developer Tools / Kernel Extensions**, AND (b) the boot policy on Apple Silicon set to **Reduced Security** with "Allow user management of kernel extensions from identified developers" enabled (via Recovery → Startup Security Utility). Either step missing → kext stays staged but never activates → CUPS `usb` backend can never talk to the P7000. This is also consistent with: the kext being from 2018 using deprecated `AppleUSBMergeNub`; the printer working fine on other Macs (likely Intel, or already-approved); and `lpinfo -v` showing no usb URIs.

### 2. **Stuck "Supplies Levels" job (PID 17945/17946) holding the backend** — the *visible* symptom
The Print Center widget triggered an Epson `ReportLevels` command-job at 12:39 today; backend has been wedged for ~51 minutes. New jobs from Photoshop go into the queue but cupsd cannot run a second backend instance for the same device, so they wait. This is what makes the message appear *even with no user-visible jobs* — the supplies job is hidden from the normal UI. Fixing #1 would let the supplies query complete; cancelling/killing it directly will free the queue immediately.

### 3. **Printer-state-reasons stuck at `offline-report`** — also a symptom, not a cause
Set by the backend whenever it cannot reach the device. Persists in `org.cups.printers.plist` until the next successful talk to the printer. The CUPS / Print Center UI verbatim renders this as **"Waiting for printer to become available."**

### 4. **AppleUSBMergeNub is legacy / may not function on Tahoe even when the kext is loaded**
The kext's IOKitPersonalities use `IOClass = AppleUSBMergeNub`. AppleUSBMergeNub is a deprecated IOUSBFamily class. Apple's modern path is `IOUSBHostInterface`-based merging or DriverKit (`.dext`). Even if you successfully approve and load the kext, it may fail to attach on Apple Silicon Tahoe. In that case the only fix is an Epson driver rev that ships a DriverKit replacement.

### 5. **Authorization Services denial** for `system.print.operator` (`-60007 errAuthorizationCanceled`)
Repeatedly logged when you tried to cancel jobs. This is the macOS auth dialog being dismissed (or `lpadmin`/`admin`-group membership not being honored). It blocks `Cancel-Job`, `Pause-Printer`, etc. — explaining why old jobs don't go away cleanly. Not the cause of "waiting", but compounds it: it means stuck jobs (#2) cannot be cancelled from the UI without re-auth, so they accumulate.

### 6. **Background processes claiming/holding the USB device**
`EpsonLaunchPSPreview` (since 11:14), `PrintCenterWidgetExtension.macOS` (since 11:45), and `printtool` (since 12:22) are all alive. If any of them open the USB endpoint via the Epson user-space plug-in, the CUPS backend's open() on the same device will block. This is a known interaction with Epson Printer Utility / Status Monitor.

### 7. **Driver install timestamps inconsistent**
`/Library/Printers/EPSON/InkjetPrinter2/Filter/pstoescp.app` is dated **May 5 10:46** while every other component in that folder is dated May 5 12:37. The reinstall did not refresh `pstoescp` together with the rest. Probably benign for the P7000 raster path (which uses `rastertoescpII`), but it indicates the installer ran in two passes — possibly the first pass was interrupted before the kext-approval step.

### 8. **`ColorTable`, `ICCProfiles`, `LaunchPSPreview`, `MWRes` directories still dated Sep 28 2024**
These pieces are from the previous install and were not refreshed today. PPDs reference paths under these dirs. Unlikely to cause "waiting", but worth knowing if a related symptom appears later (e.g., color management failures during raster filtering).

### 9. **`org.cups.printers.plist` carries `offline-report` for both Epson queues simultaneously**
Suggests this is a transport-layer issue (USB stack / kext) shared by both Epson printers, not specific to the P7000 driver. Reinforces #1: the same kext mediates both.

### 10. **No DriverKit (.dext) replacement is installed**
`systemextensionsctl list` shows only Proton VPN extensions. There is no Epson DriverKit extension. So the *only* path Epson has on this machine to claim the USB device is the legacy kext from #1.

### 11. **Print Center widget polling will keep regenerating wedged jobs**
Even after you kill PID 17945/17946, the widget will create a new `ReportLevels` job on its next tick. Until #1 is fixed, every supplies poll re-wedges the queue. This is why "reset the printing system" works for a few minutes and then symptoms return.

### 12. **Older "Job held for authentication" pattern**
In March 2026 there were many `Job held for authentication` entries. Implies the printer queue was at one point set to require user authentication (e.g., share or auth-required job submission). Worth checking the queue's `auth-info-required` setting; not the current cause but could re-emerge.

### 13. **`lpinfo -v` not surfacing USB at all**
Even printers that have been failing usually show *something* under `direct usb://`. Total absence here is consistent with the kext-not-loaded hypothesis (no AppleUSBMergeNub merge → device never gets the `USB Printing Class` property → CUPS device-discovery code skips it).

### 14. **macOS Tahoe major version (26.4.1) on a printer driver from 2018**
The EPSON kext bundle is `2.8.5, 2005-2018`. macOS releases since then have removed or restricted multiple APIs the kext relied on. Even with current Epson installer wrappers around it, the underlying kernel module is six years old. Apple has been steadily tightening kext loading; on macOS 26 a 2018 kext is firmly in deprecated-and-likely-broken territory.

### 15. **Possible `rastertoescpII` failing and CUPS holding the job before it reaches the backend**
Currently, the `commandtoescp` filter is the one running (this is a command job, not a raster job). If you start a *real* Photoshop print job, the chain is `pdftopdf2 → rastertoescpII → usb backend`. The rastertoescpII binary exists and is signed; this is unlikely to be the bottleneck, but if symptoms persist after #1 and #2 are cleared, this is the next thing to verify (look for `[Job N] PID nnn (rastertoescpII) stopped with status ...` lines).

---

## What I'd verify next (still read-only)

- `sudo kextload -nt /Library/Extensions/EPSONUSBPrintClass.kext` (test-only) — will print exactly why the kext won't load (signature/entitlement/policy).
- System Settings → Privacy & Security → look for a pending **"System software from developer 'Seiko Epson Corporation' was blocked"** prompt with an **Allow** button.
- On Apple Silicon: Recovery → Startup Security Utility → set the system volume's policy to **Reduced Security** + **Allow user management of kernel extensions from identified developers**.
- Power-cycle the P7000 with the USB cable seated, then `ioreg -p IOUSB -l | grep -A2 Epson` — confirm the device enumerates at all on this Mac.
- `cupsctl LogLevel=debug2`, then attempt one print, then read `/var/log/cups/error_log` for the exact backend error.

## Files inspected (no writes were performed)

- `/etc/cups/cupsd.conf`, `cups-files.conf`, `cupsd.conf.bak`, `printers.conf` (perms-blocked, used `org.cups.printers.plist` instead)
- `/etc/cups/ppd/EPSON_SC_P7000_Series.ppd`, `/etc/cups/ppd/EPSON_SC_P9500_Series.ppd`
- `/var/log/cups/error_log`, `/var/log/cups/access_log`
- `/Library/Preferences/org.cups.printers.plist`
- `/Library/Printers/EPSON/InkjetPrinter2/` (subtree)
- `/Library/Printers/EPSON/CIOSupport/` (subtree)
- `/Library/Printers/PPDs/Contents/Resources/` (gz PPDs)
- `/Library/Extensions/EPSONUSBPrintClass.kext/Contents/Info.plist`
- `/Library/StagedExtensions/`
- `/usr/libexec/cups/backend/` (codesign + entitlements of `usb`)
- IOKit USB plane via `ioreg -p IOUSB -l`
- Live process state via `ps`, `lpstat -t`, `lpstat -W all`, `lpoptions`, `lpinfo -v`
- `kmutil showloaded`, `kextstat`, `systemextensionsctl list`, `csrutil status`
