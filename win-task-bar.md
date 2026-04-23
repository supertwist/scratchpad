## User
how do I disable the taskbar in Windows 11?

## Assistant
**Quick way to hide the taskbar in Windows 11**

1. **Right‑click** an empty area of the taskbar.  
2. Select **Taskbar settings**.  
3. In the **Taskbar behaviors** section, toggle **Automatically hide the taskbar** on.  
   *The bar will slide away when not in use and reappear when you move the mouse to the bottom of the screen.*

---

### If you want to *disable* it completely (not recommended)

| Method | Steps | Notes |
|--------|-------|-------|
| **Registry tweak** | 1. Press `Win + R`, type `regedit`, press Enter. <br>2. Navigate to `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced`. <br>3. Create a new `DWORD (32‑bit)` value named `TaskbarNoAutoHide`. <br>4. Set its value to `1`. <br>5. Log out / reboot. | This removes the auto‑hide toggle but the bar remains visible. No true “disable” is supported. |
| **PowerShell script** | ```powershell<br>Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'TaskbarNoAutoHide' -Value 1<br>Stop-Process -ProcessName explorer -Force<br>``` | Same effect as the registry edit. |

> **Why it’s not truly possible**  
> Windows 11 treats the taskbar as a core UI element; the system won’t let you uninstall or hide it entirely. The best you can do is auto‑hide or move it to another edge.

---

### Quick toggle via PowerShell (auto‑hide)

```powershell
$regPath = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'
Set-ItemProperty -Path $regPath -Name 'TaskbarAutoHide' -Value 1
Stop-Process -ProcessName explorer -Force
```

Run the script again with `-Value 0` to turn auto‑hide off.

---

**Tip:** If you only need the taskbar out of the way while working, the auto‑hide setting is usually enough and can be toggled quickly with a right‑click on the taskbar or via the Settings panel.

---
_2026-04-23 16:44_
