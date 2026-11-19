# Voltlip Configuration & Settings

Voltlip stores user configuration in a plain JSON file located at:
- **Windows**: `%APPDATA%\voltlip\settings.json`
- **macOS**: `~/Library/Application Support/voltlip/settings.json`
- **Linux**: `~/.config/voltlip/settings.json`

You can open this file directly from the tray menu via **"Open settings file"**, edit it, and click **"Reload settings"** without restarting the application.

---

## Settings Schema & Options

| Key | Type | Default | Valid Range | Description |
|---|---|---|---|---|
| `stripLength` | integer | `144` | `40` to `800` | Width of the idle strip in DIP (Device Independent Pixels). |
| `stripThickness` | integer | `4` | `1` to `30` | Visible height of the idle strip in DIP. Increase this value if you prefer a thicker, more visible bar. |
| `stripAlign` | string | `"center"` | `"center"`, `"left"`, `"right"` | Horizontal screen alignment of the strip along the top display edge. |
| `stripOffsetX` | integer | `0` | `-2000` to `2000` | Horizontal pixel offset from the alignment position. |
| `lowThreshold` | integer | `40` | `10` to `60` | Battery percentage below which the strip changes from black to red. |
| `criticalThreshold`| integer | `30` | `5` to `50` | Battery percentage below which the red strip begins breathing. (Clamped below `lowThreshold`). |
| `highThreshold` | integer | `80` | `60` to `99` | Battery percentage above which the green strip breathes while charging. |
| `breatheMinOpacity`| float | `0.0` | `0.0` to `0.8` | Lowest opacity reached during the breathing pulse animation (0.0 fades all the way to transparent). |
| `breathePeriodMs` | integer | `4000` | `500` to `20000`| Default duration of breathing pulse cycle in milliseconds. |
| `breathePeriodLowMs` | integer | `1800` | `200` to `10000`| Pulse speed when battery is critical (below 30%, red). |
| `breathePeriodHighMs`| integer | `4000` | `200` to `10000`| Pulse speed when battery is full (above 80%, green). |
| `panelFrameWidth` | integer | `190` | `100` to `400` | Outer width of the battery icon inside the sliding card in DIP. |
| `theme` | string | `"dark"` | `"dark"`, `"light"` | `"dark"` displays black battery UI; `"light"` displays white battery UI. |
| `blackStripEdge` | string | `"none"` | `"none"`, `"light"` | Set to `"light"` to add a subtle `#6b6b6b` 1 DIP bottom edge to make the black strip visible on dark desktop wallpapers. |
| `startWithSystem` | boolean | `false` | `true`, `false` | Automatically launch Voltlip when your operating system starts up. |
| `paused` | boolean | `false` | `true`, `false` | Pauses hover polling and disables card sliding while keeping the idle strip visible. |

---

## Example Configuration

```json
{
  "stripLength": 144,
  "stripThickness": 8,
  "stripAlign": "center",
  "stripOffsetX": 0,
  "lowThreshold": 40,
  "criticalThreshold": 30,
  "highThreshold": 80,
  "breatheMinOpacity": 0.0,
  "breathePeriodMs": 4000,
  "breathePeriodLowMs": 1800,
  "breathePeriodHighMs": 4000,
  "panelFrameWidth": 190,
  "theme": "dark",
  "blackStripEdge": "none",
  "startWithSystem": false,
  "paused": false
}
```
