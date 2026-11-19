# Voltlip Troubleshooting Guide

Common issues and solutions for Voltlip.

---

### 1. The strip is hard to see on a black wallpaper or dark menu bar
- **Cause**: By default, when discharging at >= 40%, the strip is pure black (`#000000`).
- **Fix**: Open settings (`Right-click tray -> Open settings file`) and set:
  ```json
  "blackStripEdge": "light"
  ```
  Then click **"Reload settings"** in the tray menu. This adds a subtle 1 DIP `#6b6b6b` bottom line.

---

### 2. The panel does not slide down when I move my mouse to the top edge
- **Check Pause state**: If Voltlip is paused, hover is disabled. Right-click the tray icon and ensure it says "Pause" (not "Resume").
- **Multi-Monitor setup**: Voltlip positions itself on the **primary display**. Ensure your cursor is positioned along the top edge of your primary monitor.
- **Top edge coordinate**: Moving your mouse all the way to the top pixel row (y=0) triggers the panel.

---

### 3. Battery value seems outdated or static
- Voltlip combines real-time AC events from Electron `powerMonitor` with Chromium battery readings and a 60-second `systeminformation` sync.
- If you unplug or plug in your AC charger, the strip responds instantly.
- On desktop computers without a battery, Voltlip automatically hides the strip and displays "No battery detected" in the tray tooltip.

---

### 4. Electron download fails or hangs during first install
- **Cause**: Corporate firewalls or restrictive networks may block GitHub releases where prebuilt Electron binaries are hosted.
- **Fix**: Use an alternative mirror before running `npx voltlip`:
  ```bash
  # In PowerShell:
  $env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
  npx voltlip
  ```

---

### 5. Windows Defender SmartScreen warning on `.exe` installer
- **Cause**: The NSIS executable built by community CI is unsigned. Windows SmartScreen displays a warning for newly released, unsigned executables.
- **Fix**: Click **"More info"** and then **"Run anyway"**.

---

### 7. "An Application Control policy has blocked this file" (`Error: spawn UNKNOWN`, errno: -4094)
- **Cause**: Windows 11 **Smart App Control (SAC)** is enabled in **On** mode. Smart App Control is a kernel-level Code Integrity policy that automatically blocks all unsigned binaries (such as raw prebuilt developer binaries like `electron.exe` in `node_modules`). Because it is an Application Control policy, antivirus folder exclusions do not bypass it.
- **Fix**:
  1. Open **Windows Security** from the Start menu.
  2. Click **App & browser control** (icon with an app window).
  3. Under **Smart App Control**, click **Smart App Control settings**.
  4. Change the setting to **Evaluation** (or **Off**). In Evaluation mode, Windows monitors without blocking local development binaries.
  5. Return to your terminal and re-run:
     ```bash
     npm run demo
     ```
