# Epson SureColor P9570 – macOS "Tahoe" Troubleshooting Checklist

> A step‑by‑step guide for diagnosing and resolving common printing issues with an Epson SureColor P9570 on macOS Tahoe.

---

## 1️⃣ Preliminary Checks

- [ ] **Power & Connectivity**
  - Verify the printer is turned **ON** and the power LED is solid.
  - Confirm the printer is **connected** to the same network as the Mac (Wi‑Fi or Ethernet).
- [ ] **Print Queue**
  - Open **System Settings → Printers & Scanners**.
  - Ensure the P9570 appears in the list and is **not** greyed out.
- [ ] **Test Page**
  - From the printer’s LCD, print a **Self‑Test Page**.
  - If the self‑test prints, the issue is likely on the Mac side.

---

## 2️⃣ Network Verification (Wi‑Fi/Ethernet)

- [ ] **IP Address**
  - Print a **Network Status Sheet** from the printer.
  - Compare the listed IP with the one shown in **Printers & Scanners → Options & Supplies → General**.
- [ ] **Ping Test**
  ```bash
  ping <printer‑ip>
  ```
  - **0% packet loss** → network OK; otherwise troubleshoot router/Wi‑Fi.
- [ ] **Firewall**
  - System Settings → Network → Firewall → **Allow incoming connections** for **cupsd** and **Epson Software**.
- [ ] **Router Settings**
  - Ensure **AP isolation** or **client‑isolation** is **disabled**.
  - Verify the printer is not on a **different VLAN**.

---

## 3️⃣ Driver & Software

- [ ] **Official Driver**
  - Download the latest **Epson® ColorWorks™ Driver for macOS** from Epson’s support site (matching macOS Tahoe version).
- [ ] **Install**
  - Run the installer, then **restart** the Mac.
- [ ] **Printer Driver Version**
  - In **Printers & Scanners → Options & Supplies → Driver**, note the version.
  - Compare with the version listed on Epson’s download page.
- [ ] **Remove & Re‑Add Printer**
  1. Select the P9570 → **‑** (remove).
  2. Click **+** → **Add Printer or Scanner**.
  3. Choose **Epson P9570** (not “AirPrint”) and ensure **PPD** points to the Epson driver.
- [ ] **AirPrint vs. Epson Driver**
  - If using AirPrint, try switching to the Epson driver for full functionality (color management, paper type, etc.).

---

## 4️⃣ CUPS Configuration

- [ ] **Reset Printing System** (last resort)
  1. System Settings → Printers & Scanners.
  2. Right‑click (Control‑click) on the printer list → **Reset printing system**.
  3. Re‑add the printer.
- [ ] **Check CUPS Logs**
  ```bash
  sudo tail -f /var/log/cups/error_log
  ```
  - Look for error codes such as **403**, **504**, or **Document failed to print**.
- [ ] **Permissions**
  - Ensure your user is a member of the **_lpadmin** group:
  ```bash
  dseditgroup -o checkmember -m $USER _lpadmin
  ```

---

## 5️⃣ Printer Settings & Media

- [ ] **Paper Size & Media Type**
  - Verify the selected paper size in **Print Dialog → Media & Quality** matches the loaded media.
- [ ] **Ink Levels**
  - Use **Epson Status Monitor** → **Ink Cartridge** to ensure no cartridge is empty or low.
- [ ] **Print Head Alignment / Cleaning**
  - Run **Maintenance → Head Alignment** and **Head Cleaning** from the Epson utility.
- [ ] **Firmware Update**
  - Open **Epson Software Updater** and apply any available firmware for the P9570.

---

## 6️⃣ macOS Specific Issues (Tahoe)

- [ ] **System Update**
  - Ensure macOS Tahoe is fully updated (System Settings → General → Software Update).
- [ ] **App Permissions**
  - If printing from a sandboxed app (e.g., Microsoft Office), grant **Full Disk Access** or **Printer Access** under **System Settings → Privacy & Security**.
- [ ] **Compatibility Mode**
  - Some older Epson utilities may require **Rosetta 2** on Apple Silicon. Install Rosetta if prompted.
- [ ] **Print Dialog Extensions**
  - Remove any third‑party print extensions that could conflict (e.g., older CUPS drivers).

---

## 7️⃣ Advanced Diagnostics

- [ ] **SNMP Query** (optional)
  ```bash
  snmpwalk -v1 -c public <printer‑ip> 1.3.6.1.2.1.43
  ```
  - Verify status OIDs for error states.
- [ ] **USB Direct Connection**
  - Connect the printer via USB and repeat steps 2‑4. If it works over USB, the issue is network‑related.
- [ ] **Create a New macOS User Account**
  - Log in as a fresh user and try printing. Isolates user‑specific configuration problems.

---

## ✅ Final Steps

1. After each change, **print a test page** from **System Settings → Printers & Scanners → Print Test Page**.
2. Document the outcome (success/failure) and any error messages.
3. If the problem persists, gather the following for Epson support:
   - Printer model & firmware version.
   - macOS version (e.g., 13.7 “Tahoe”).
   - Screenshot of the Print dialog and error logs.
   - Results of the network ping and SNMP query.

---

*Prepared by the Pi‑coding‑agent on 2026‑05‑03*