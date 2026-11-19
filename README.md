# Voltlip

A desktop battery strip that sits at the top edge of your screen and slides down on hover.

```
       [==== Strip: Black (>=40%) | Green (Charging) | Red (<40%) ====]
                                      |
                              (Mouse hovers here)
                                      v
       +--------------------------------------------------------------+
       |   +------------------------------------------------------+   |
       |   | [========]  [========]  [========]  [              ] |   |
       |   +------------------------------------------------------+   |
       |   75%                                           Charging     |
       +--------------------------------------------------------------+
```

---

## Quick Start

Run instantly without installation:
```bash
npx voltlip
```

Or install globally:
```bash
npm install -g voltlip
voltlip
```

> **Note on First Run**: Voltlip uses Electron to create an ultra-low-power, click-through transparent overlay. On first execution, `npx` will download Electron (~100 MB). If you are behind a corporate proxy, set `$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"`.

---

## How It Works

A slim, 4 DIP strip rests at the top edge of your primary screen. It never blocks your clicks and uses ~0% CPU at idle:

| Battery Condition | Strip Color | Strip Behavior |
|---|---|---|
| Plugged in (Charging <= 80%) | Green (`#00FF12`) | Steady |
| Plugged in (Charging > 80% or Charged) | Green (`#00FF12`) | Soft breathing pulse |
| On battery (Level >= 40%) | Black (`#000000`) | Steady |
| On battery (Level 30% to 39%) | Red (`#FF0000`) | Steady |
| On battery (Level < 30%) | Red (`#FF0000`) | Soft breathing pulse |

When your mouse hovers over the strip, a clean white card slides down revealing the 4-segment battery bar and exact charge state. Move the cursor away and the card slides back up.

---

## Demo & Testing

Voltlip includes a built-in simulation mode that lets you test every visual state without draining your physical battery:

```bash
# Auto-cycles through all 12 battery states every 5 seconds
npm run demo

# Or pin to any specific charge state:
npm run demo:hold -- 29:discharging
npm run demo:hold -- 85:charging
```

---

## Documentation

- [Manual Testing Guide](docs/MANUAL_TESTING.md) — Step-by-step instructions for testing all 12 scenarios.
- [Configuration & Settings](docs/SETTINGS.md) — Customizing strip thickness, alignment, and thresholds.
- [Design Specification](docs/DESIGN.md) — Geometry table, ink-edge alignment maths, and palette.
- [Architecture](docs/ARCHITECTURE.md) — Main process, adaptive cursor polling, and IPC design.
- [Troubleshooting](docs/TROUBLESHOOTING.md) — Visibility on dark screens, SmartScreen, and multi-monitor setup.
- [Publishing to npm](docs/PUBLISH_NPM.md) — Maintainer guide for npm releases.
- [Release Checklist](docs/RELEASE_CHECKLIST.md) — Pre-flight release steps.

---

## License

MIT © Voltlip Contributors
