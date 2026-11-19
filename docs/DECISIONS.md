# Engineering Decisions & Interpretations

This document logs architectural and design decisions made during the implementation of Voltlip.

---

### 1. Technology Versions & Packaging
- **Electron Version**: Pinned to exact current stable release `45.4.1` as confirmed on the npm registry. Configured as a direct production dependency in `package.json` so that `npx voltlip` automatically provides the runtime without prerequisite global installations.
- **Node & Module System**: CommonJS is used throughout all Electron runtime files (`src/main/`, `src/preload/`, `src/core/`) to avoid Electron/ESM loader friction on Windows. Headless unit tests in Vitest run ES modules seamlessly.

### 2. Visual Spec & Geometry
- **Strip Thickness (Default 4 DIP)**: Visual measurements from `art/reference/ref-4-strip-black.png` indicate the strip hanging below the screen edge is approximately 3.4 to 4 DIP at 144 DIP width. It is exposed as the configurable setting `stripThickness` (range 1–30 DIP) for users on high-density displays who desire a wider tab.
- **Card Corner Radius**: Bottom corners use 14 DIP rounded borders with top corners square (0px), matching the reference mockups.
- **4-Segment Fill Continuity**: Rather than jumping in discrete 25% increments, the inner fill bar is continuous (`(percent / 100) * innerWidth`) while white dividers sit on top with higher z-index. This ensures exact matching of reference mockups (e.g. 50% = 2 segments, 75% = 3 segments, 100% = 4 segments) while smoothly representing arbitrary levels like 62%.

### 3. Typography & Ink Alignment
- **Font**: Self-hosted `@fontsource/public-sans` (Latin 700 weight) bundled directly in `src/renderer/fonts/`. This eliminates network dependencies and guarantees identical cross-platform metrics.
- **Alignment Formulation**: Using standard Canvas 2D `measureText()`:
  - Percentage left ink edge matches segment 1 left edge: `nudgeX = actualBoundingBoxLeft`.
  - Status right ink edge matches segment 4 right edge: `nudgeX = -actualBoundingBoxRight`.
  - The mathematics are decoupled into `src/core/alignment.js` and verified by unit tests.

### 4. Click-Through Overlay Architecture
- **Complete Click-Through**: The overlay window uses `setIgnoreMouseEvents(true)` at all times. It never absorbs mouse events, allowing users to interact with any application behind the strip or panel without interference.
- **Main Process Cursor Polling**: Hover is tracked by main process screen cursor polling. Adaptive polling (16 ms when within 100 DIP vertical and 250 DIP horizontal of strip, 120 ms when far) prevents unnecessary CPU wakeups.

### 5. Multi-Source Battery Reconciliation
- **Ground Truth Hierarchy**:
  1. `systeminformation.battery()`: authoritative for hardware presence (`hasBattery`) and AC connection.
  2. Chromium Battery Status API: fast event-driven level updates in renderer.
  3. Electron `powerMonitor`: hardware AC vs battery change notifications.
- When desktop PCs report `hasBattery: false`, polling stops and the strip is hidden, leaving only the tray indicator.
