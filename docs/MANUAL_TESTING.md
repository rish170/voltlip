# Voltlip Manual Testing Guide

This guide is designed for the human tester to visually and functionally verify Voltlip without relying on automated UI drivers.

---

## Prerequisites
- Node.js LTS (v20+ or v22+)
- Windows 10/11 display (tests should also be checked on displays with 100%, 125%, or 150% scaling)

---

## 1. Unit Tests & Lint (Already Verified Headless)
Before manual UI checks, you can re-run the fast headless logic checks anytime:
```bash
npm run test
npm run lint
```
**Pass criteria:** All 40 unit tests pass, and ESLint reports 0 errors and 0 warnings.

---

## 2. Interactive Demo Mode (Auto-Cycling)
Run:
```bash
npm run demo
```
**What to observe:**
1. A small battery icon appears in your Windows system notification tray.
2. At the top-center edge of your primary screen, a thin strip appears (4 DIP thick, 144 DIP wide).
3. The demo automatically steps through 12 battery states every 5 seconds.
4. Hover your mouse over the strip at the very top edge:
   - A clean white rounded-bottom card smoothly slides down from the top edge.
   - Inside the card is the 4-segment battery bar and a text line showing `<percent>%` on the left and the status word on the right.
   - The strip is hidden/covered while the card is open.
5. Move your mouse away from the card:
   - After a ~350 ms debounce delay, the card smoothly slides back up out of view.
   - The strip reappears at full opacity.
6. Check the system tray icon tooltip: it displays the current scenario name (e.g. `Voltlip: 29% discharging (red, breathing)`).

---

## 3. Verify the 12 Demo Scenarios (Visual & Functional)
You can pin any scenario directly or let `npm run demo` cycle through them:

| # | Command to Pin | Expected Strip Color | Animation | Hover Card Status Word | Expected Battery Fill |
|---|---|---|---|---|---|
| 1 | `npm run demo:hold -- 100:discharging` | Black (`#000000`) | Steady (No animation) | `Discharging` | 4 black segments (100%) |
| 2 | `npm run demo:hold -- 50:discharging` | Black (`#000000`) | Steady | `Discharging` | 2 black segments, 2 white (50%) |
| 3 | `npm run demo:hold -- 75:charging` | Green (`#00FF12`) | Steady | `Charging` | 3 black segments, 1 white (75%) |
| 4 | `npm run demo:hold -- 45:discharging` | Black (`#000000`) | Steady | `Discharging` | ~45% continuous fill |
| 5 | `npm run demo:hold -- 39:discharging` | Red (`#FF0000`) | Steady | `Discharging` | ~39% continuous fill |
| 6 | `npm run demo:hold -- 35:discharging` | Red (`#FF0000`) | Steady | `Discharging` | ~35% continuous fill |
| 7 | `npm run demo:hold -- 29:discharging` | Red (`#FF0000`) | Soft breathing pulse | `Discharging` | ~29% continuous fill |
| 8 | `npm run demo:hold -- 15:discharging` | Red (`#FF0000`) | Soft breathing pulse | `Discharging` | ~15% continuous fill |
| 9 | `npm run demo:hold -- 20:charging` | Green (`#00FF12`) | Steady | `Charging` | ~20% continuous fill |
| 10 | `npm run demo:hold -- 79:charging` | Green (`#00FF12`) | Steady | `Charging` | ~79% continuous fill |
| 11 | `npm run demo:hold -- 81:charging` | Green (`#00FF12`) | Soft breathing pulse | `Charging` | ~81% continuous fill |
| 12 | `npm run demo:hold -- 100:charging` | Green (`#00FF12`) | Soft breathing pulse | `Charged` | 4 black segments (100%) |

**Pass criteria:**
- Colors match reference pictures: pure black, neon green `#00FF12`, signal red `#FF0000`.
- Breathing is a smooth fade between 1.0 and 0.1 opacity over 4 seconds, occurring only when red < 30% or green > 80%.
- Card contents are pure black on pure white, with no shadows or glows.

---

## 4. Ink-Edge Text Alignment Verification
1. Pin scenario 1: `npm run demo:hold -- 100:discharging`.
2. Move mouse to top edge to open card.
3. Look closely at the percentage text (`100%`) and the battery frame:
   - The leftmost ink edge of the `1` in `100%` must align vertically with the left edge of the first inner black segment.
4. Look closely at the status text (`Discharging`):
   - The rightmost ink edge of the `g` in `Discharging` must align vertically with the right edge of the fourth inner black segment.
5. Repeat with scenario 3 (`75% Charging`) and scenario 12 (`100% Charged`).

---

## 5. Click-Through & Non-Interference Verification
1. Open a browser or text editor directly underneath the top center of your screen.
2. Click where the strip sits.
3. **Pass criteria:** The underlying application receives the click immediately. Voltlip never absorbs clicks or steals keyboard focus.
4. Hover to open the panel, then click on the panel card.
5. **Pass criteria:** The window is click-through (`setIgnoreMouseEvents(true)`); clicking anywhere goes to the window beneath it.

---

## 6. Tray Menu Functionality
Right-click the Voltlip tray icon:
1. **Title and Status line**: Disabled, shows battery percentage and state.
2. **Pause / Resume**: Click Pause.
   - The strip remains visible, but cursor hovering is disabled and polling stops.
   - Click Resume: Hovering immediately reactivates.
3. **Start with system**: Toggle the checkbox. Verify it toggles without error.
4. **Open settings file**: Opens `%APPDATA%/voltlip/settings.json`.
5. **Reload settings**: Modifying `stripThickness` to `8` in `settings.json` and clicking "Reload settings" immediately thickens the strip.
6. **Simulate submenu**: In demo/dev mode, click any scenario to pin it, or select "Auto-cycle".
7. **Quit**: Exits Voltlip cleanly.

---

## 7. Single Instance Lock
1. Run `npm run demo`.
2. In a second terminal window, run `npm run demo` again.
3. **Pass criteria:** The second process immediately exits without creating a duplicate window or tray icon.

---

## 8. Package & Installation Test (`npm run test:install`)
Run:
```bash
npm run test:install
```
**What this does:**
1. Runs `npm pack` to generate `voltlip-1.0.0.tgz`.
2. Creates an isolated temporary directory.
3. Launches the package via `npx --yes ./voltlip-1.0.0.tgz --fresh --demo`.
4. **Pass criteria:** The packaged build starts cleanly and displays the overlay without missing assets or font errors.
