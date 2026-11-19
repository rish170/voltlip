# Voltlip Implementation Plan

## 1. Overview & Verification
- Verify package name `voltlip` availability on npm (`npm view voltlip` returned 404 - available).
- Pin exact stable versions for Electron, systeminformation, fontsource, electron-builder, vitest, eslint, and prettier.
- Inspect and catalog reference images in `art/reference/`.

## 2. Project Scaffolding
- Initialize root `package.json` with `name: "voltlip"`, `bin: "voltlip"`, whitelisted files, scripts, and pinned dependencies.
- Configure tooling: `.gitignore`, `.editorconfig`, `.nvmrc`, `eslint.config.mjs`, `.prettierrc`.
- Create project directory structure: `bin/`, `src/core/`, `src/main/`, `src/preload/`, `src/renderer/`, `scripts/`, `test/`, `docs/`, `.github/workflows/`.

## 3. Core Logic (`src/core/`) - Pure Headless Unit-Tested Modules
- `src/core/state.js`: State machine for battery level/plugged status, thresholds (40, 30, 80), 2% hysteresis, color mapping, breathing flags, and status word (`Charging`, `Discharging`, `Charged`).
- `src/core/geometry.js`: Reference geometry derived from scaling factor `u = panelFrameWidth / 903`, strip bounds, panel bounds, adaptive cursor zone hit-testing, proportional continuous fill.
- `src/core/alignment.js`: Precise ink-edge alignment math for percentage text (left edge of segment 1) and status text (right edge of segment 4) using glyph bounding metrics.
- `src/core/reconcile.js`: Reconciling `systeminformation`, Chromium Battery Status API, and Electron `powerMonitor` events, prioritizing reliable data and handling fallbacks.
- `src/core/settings.js`: Default settings, schema validation, clamping, and safe JSON serialization.

## 4. Headless Unit Tests (`test/`)
- Write Vitest test suites covering:
  - `state.test.js`: Hysteresis, thresholds, color transitions, breathing conditions, `hasBattery: false`.
  - `geometry.test.js`: Proportional scaling, cursor hit detection, continuous fill calculation.
  - `alignment.test.js`: Ink bounding box alignment nudges.
  - `reconcile.test.js`: Data source priority, missing sources, error fallbacks.
  - `settings.test.js`: Clamping, defaults, malformed JSON recovery.

## 5. Main Process Engineering (`src/main/`)
- `src/main/logger.js`: Rotating small log files in `userData/logs/`.
- `src/main/battery/provider.js`: Provider interface (`getSnapshot()`, `onChange()`).
- `src/main/battery/system-provider.js`: Live provider integrating `powerMonitor`, renderer Battery API events, and periodic `systeminformation` sync.
- `src/main/battery/mock-provider.js`: Mock provider with 12 demo scenarios and manual hold pinning.
- `src/main/cursor.js`: Adaptive cursor polling (16ms near strip/panel, 120ms far, 0ms paused), multi-display coordinates.
- `src/main/window.js`: Click-through transparent `BrowserWindow`, always-on-top `screen-saver`, non-focusable, DPI/display-change handling, debug boundary toggles.
- `src/main/tray.js`: System tray with dynamic status, pause/resume, start-at-login toggle, settings reload/open, simulation submenu.
- `src/main/ipc.js`: Strictly typed IPC channels for state updates, hover transitions, settings, and renderer ready signals.
- `src/main/main.js`: Lifecycle management, single instance lock, crash guards.

## 6. Preload & Renderer (`src/preload/`, `src/renderer/`)
- `src/preload/preload.js`: Secure context bridge exposing clean battery/hover/settings API to renderer.
- `src/renderer/index.html`: Semantic markup for strip, hover card, 4-segment battery frame, percentage, and status labels.
- `src/renderer/styles.css`: Pure CSS transitions, `@keyframes` breathing animation with paused states, 14 DIP rounded card bottom, 4 DIP strip.
- `src/renderer/renderer.js`: DOM updates on state change, canvas ink-measurement for alignment nudges, smooth fill width transitions.
- Self-host Public Sans Bold font in `src/renderer/fonts/`.

## 7. Packaging, CLI & Automation Scripts (`bin/`, `scripts/`, `electron-builder.yml`)
- `bin/voltlip.js`: Detached launcher for `npx voltlip` with error handling and helpful messaging.
- `scripts/make-tray-icon.js`: Pure Node.js script generating crisp 16x16 and 32x32 battery tray icons.
- `scripts/demo.js`: Helper script for running mock scenarios.
- `scripts/test-install.js`: Packaging and tarball execution test script.
- `electron-builder.yml`: NSIS Windows installer config.
- `.github/workflows/ci.yml` and `.github/workflows/release.yml`.

## 8. Comprehensive Documentation (`docs/`, `README.md`, etc.)
- `README.md`, `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`.
- `docs/ARCHITECTURE.md`, `docs/SETTINGS.md`, `docs/MANUAL_TESTING.md` (complete test guide for user), `docs/PUBLISH_NPM.md`, `docs/RELEASE_CHECKLIST.md`, `docs/TROUBLESHOOTING.md`, `docs/DESIGN.md`, `docs/DECISIONS.md`.

## 9. Verification & Delivery
- Execute only permitted headless checks: `npm install`, `npm run lint`, `npm run test`.
- Code review: verify every file path, IPC channel string, and export/import.
- Prepare complete handover report with exact user testing steps.
