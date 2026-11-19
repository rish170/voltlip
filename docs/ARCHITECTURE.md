# Voltlip Architecture

Voltlip is an Electron desktop overlay designed for ultra-low resource usage, instant click-through transparency, and pure DOM rendering.

```
+-----------------------------------------------------------------------+
|                             MAIN PROCESS                              |
|                                                                       |
|  +------------------+     +------------------+     +---------------+  |
|  |  BatteryService  | --> |   state.js       | --> | OverlayWindow |  |
|  | (si/powerMonitor)|     |  (State Machine) |     |  (Frameless)  |  |
|  +------------------+     +------------------+     +---------------+  |
|           ^                         |                      |          |
|           |                         v                      | IPC      |
|           |                   +------------+               v          |
|           |                   |   Tray     |        +--------------+  |
|           |                   +------------+        | Preload API  |  |
|           |                                         +--------------+  |
|           |                                                |          |
|  +------------------+                                      v          |
|  |  CursorPoller    |                              +---------------+  |
|  | (Adaptive 16/120)| ---------------------------> |  RENDERER DOM |  |
|  +------------------+        (Hover IPC)           | (Public Sans) |  |
|                                                    +---------------+  |
+-----------------------------------------------------------------------+
```

---

## 1. Process Separation & Responsibilities

### Main Process (`src/main/`)
- **Lifecycle & Single Instance**: Secures single-instance mutex and handles OS sleep/wake and unlock events.
- **Battery Provider**: Polls `systeminformation` infrequently (startup + 60s sync) and reacts instantly to Electron `powerMonitor` AC/battery events. Reconciles all sources through pure functions.
- **Cursor Poller**: Monitors mouse position on the primary display. Automatically shifts polling rate from 120 ms (far) to 16 ms (near strip) and manages hover open/close debouncing.
- **Window Management**: Maintains an always-on-top, click-through (`setIgnoreMouseEvents(true)`), frameless transparent BrowserWindow positioned at the top of the screen.

### Pure Core (`src/core/`)
- Contains zero Electron or DOM imports.
- Handles geometry scaling, ink-edge text alignment, battery state transitions with 2% hysteresis, and settings validation.
- 100% covered by headless Vitest unit tests.

### Preload Bridge (`src/preload/`)
- Uses `contextBridge` to expose a typed, sandboxed API (`window.voltlip`) with zero nodeIntegration in the renderer.

### Renderer (`src/renderer/`)
- Renders the idle strip and sliding hover card with pure HTML and CSS.
- Transitions and animations run entirely on the GPU compositor (`transform: translateY` and `opacity`).
- Measures font ink bounding boxes via an offscreen HTML5 Canvas context to align text ink edges perfectly with the battery segments.
