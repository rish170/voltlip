# Changelog

All notable changes to Voltlip will be documented in this file.

## [1.0.6] - 2026-11-21
### Fixed
- Fixed strip horizontal offset to ensure strictly pixel-perfect screen centering across all resolutions and DPI scaling factors.

## [1.0.0] - 2026-11-19
### Added
- Minimalist top-edge battery indicator strip (144 DIP x 4 DIP).
- Click-through transparent always-on-top overlay window.
- Slide-down hover card displaying 4-segment battery charge and status.
- Exact ink-edge typography alignment using Canvas 2D TextMetrics.
- Adaptive cursor polling (16ms near strip, 120ms far, 0ms paused).
- Hysteresis logic (2%) on 40%, 30%, and 80% battery thresholds.
- Multi-source battery reconciliation (systeminformation, Chromium Battery API, Electron powerMonitor).
- System tray integration with pause/resume, start at login, settings reloading, and simulation controls.
- Comprehensive headless Vitest test suite and demo simulation mode.
