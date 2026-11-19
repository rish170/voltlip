# Voltlip Design Specification

Voltlip strictly follows the aesthetic, geometric, and color specifications established in the reference artwork (`art/reference/`).

---

## 1. Palette & Styling Rules

- **Black**: `#000000` (discharging, level >= 40%).
- **Neon Green**: `#00FF12` (charging).
- **Signal Red**: `#FF0000` (discharging, level < 40%).
- **Card Background**: Pure White `#FFFFFF`.
- **Contrast Border (Optional)**: `#6b6b6b` (1 DIP bottom border when `blackStripEdge` is enabled).
- **No Effects**: No drop shadows, no outer glows, and no linear or radial gradients.

---

## 2. Geometry & Proportions

All dimensions scale proportionally based on `u = panelFrameWidth / 903`:

| Dimension | Reference Units (px) | Scaled Value (u = 190 / 903 ≈ 0.2104) |
|---|---|---|
| Outer Frame Width | 903 | 190.0 DIP |
| Outer Frame Height | 138 | 29.0 DIP |
| Frame Border Thickness | 21 | 4.4 DIP |
| Frame-to-Segment Gap | 9 | 1.9 DIP |
| Segment Width (x4) | 203.25 | 42.8 DIP |
| Gap Between Segments (x3) | 10 | 2.1 DIP |
| Segment Height | 78 | 16.4 DIP |
| Text Cap Height | 55 | 11.6 DIP (approx 15px font) |
| Space (Frame Bottom to Text) | 62 | 13.0 DIP |
| Card Side Padding | 46 | 9.7 DIP |
| Card Top Padding | 60 | 12.6 DIP |
| Card Bottom Padding | 67 | 14.1 DIP |
| Total Card Extent | 995 x 382 | ~209 x 80.4 DIP |

---

## 3. Ink-Edge Text Alignment Rule

Standard CSS text alignment aligns bounding boxes including glyph side bearings, creating visual misalignment. Voltlip eliminates this by computing glyph ink bounds using HTML5 Canvas `measureText()`:

1. **Percentage Text**: Leftmost ink pixel aligns with the left edge of segment 1.
   $$\text{Nudge}_X = \text{actualBoundingBoxLeft}$$
2. **Status Text**: Rightmost ink pixel aligns with the right edge of segment 4.
   $$\text{Nudge}_X = -\text{actualBoundingBoxRight}$$

---

## 4. Animation Timing & Curves

- **Card Slide In**: 240 ms, `cubic-bezier(0.2, 0.8, 0.2, 1)`
- **Card Slide Out**: 200 ms, `cubic-bezier(0.4, 0, 0.8, 0.8)`
- **Strip Color Transition**: 300 ms, `ease`
- **Battery Fill Transition**: 300 ms, `ease`
- **Breathing Pulse**: 4000 ms loop, `ease-in-out` (`opacity: 1.0` -> `0.1` -> `1.0`)
