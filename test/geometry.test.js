import { describe, it, expect } from 'vitest';
import {
  computeDimensions,
  computeFillWidth,
  getStripRect,
  getPanelRect,
  isInOpenZone,
  isInPanelZone,
  isNearStrip,
} from '../src/core/geometry.js';

describe('geometry', () => {
  describe('computeDimensions', () => {
    it('computes proportional geometry matching reference scale', () => {
      const dims = computeDimensions(190);
      expect(dims.frameOuterWidth).toBe(190);
      expect(dims.u).toBeCloseTo(190 / 903, 5);

      // Card width should be about 200 DIP (190 + 2 * 46 * (190/903) = ~209 DIP)
      expect(dims.cardWidth).toBeGreaterThan(190);
      expect(dims.cardWidth).toBeLessThan(220);

      // Card height should be around 90-95 DIP (with comfortable top edge clearance)
      expect(dims.cardHeight).toBeGreaterThan(85);
      expect(dims.cardHeight).toBeLessThan(105);

      // Card corner radius is 14 DIP
      expect(dims.cardCornerRadius).toBe(14);

      // 4 segments with 3 gaps
      const totalSegmentsWidth = dims.segmentWidth * 4 + dims.segmentGap * 3;
      expect(totalSegmentsWidth).toBeCloseTo(dims.innerWidth, 4);
    });
  });

  describe('computeFillWidth', () => {
    const innerWidth = 100;

    it('returns exact proportional fill for key percentages', () => {
      expect(computeFillWidth(0, innerWidth)).toBe(0);
      expect(computeFillWidth(25, innerWidth)).toBe(25);
      expect(computeFillWidth(50, innerWidth)).toBe(50);
      expect(computeFillWidth(62, innerWidth)).toBe(62);
      expect(computeFillWidth(75, innerWidth)).toBe(75);
      expect(computeFillWidth(100, innerWidth)).toBe(100);
    });

    it('clamps values outside 0-100', () => {
      expect(computeFillWidth(-10, innerWidth)).toBe(0);
      expect(computeFillWidth(150, innerWidth)).toBe(100);
    });
  });

  describe('getStripRect', () => {
    const display = { x: 0, y: 0, width: 1920, height: 1080 };

    it('centers strip horizontally by default', () => {
      const rect = getStripRect({ display, stripLength: 144, stripThickness: 4, stripAlign: 'center', stripOffsetX: 0 });
      expect(rect.x).toBe((1920 - 144) / 2);
      expect(rect.y).toBe(0);
      expect(rect.width).toBe(144);
      expect(rect.height).toBe(4);
    });

    it('aligns left with offset', () => {
      const rect = getStripRect({ display, stripLength: 144, stripThickness: 4, stripAlign: 'left', stripOffsetX: 20 });
      expect(rect.x).toBe(20);
      expect(rect.y).toBe(0);
    });

    it('aligns right with offset', () => {
      const rect = getStripRect({ display, stripLength: 144, stripThickness: 4, stripAlign: 'right', stripOffsetX: -10 });
      expect(rect.x).toBe(1920 - 144 - 10);
      expect(rect.y).toBe(0);
    });

    it('supports multi-monitor display coordinates', () => {
      const secondDisplay = { x: 1920, y: 0, width: 2560, height: 1440 };
      const rect = getStripRect({ display: secondDisplay, stripLength: 144, stripThickness: 4, stripAlign: 'center', stripOffsetX: 0 });
      expect(rect.x).toBe(1920 + (2560 - 144) / 2);
      expect(rect.y).toBe(0);
    });
  });

  describe('getPanelRect', () => {
    const display = { x: 0, y: 0, width: 1920, height: 1080 };

    it('centers panel at top of screen', () => {
      const panel = getPanelRect({ display, cardWidth: 200, cardHeight: 82, stripAlign: 'center', stripOffsetX: 0 });
      expect(panel.x).toBe((1920 - 200) / 2);
      expect(panel.y).toBe(0);
      expect(panel.width).toBe(200);
      expect(panel.height).toBe(82);
    });
  });

  describe('isInOpenZone', () => {
    const display = { x: 0, y: 0, width: 1920, height: 1080 };
    const stripRect = { x: 800, y: 0, width: 144, height: 4 };

    it('detects cursor inside strip zone expanded by 24 DIP horizontally and 10 DIP below', () => {
      // Very top pixel row y=0
      expect(isInOpenZone({ x: 850, y: 0 }, stripRect, display)).toBe(true);

      // Left expanded edge: 800 - 24 = 776
      expect(isInOpenZone({ x: 776, y: 2 }, stripRect, display)).toBe(true);
      expect(isInOpenZone({ x: 775, y: 2 }, stripRect, display)).toBe(false);

      // Right expanded edge: 800 + 144 + 24 = 968
      expect(isInOpenZone({ x: 968, y: 2 }, stripRect, display)).toBe(true);
      expect(isInOpenZone({ x: 969, y: 2 }, stripRect, display)).toBe(false);

      // Bottom extension: 4 + 10 = 14 DIP
      expect(isInOpenZone({ x: 850, y: 14 }, stripRect, display)).toBe(true);
      expect(isInOpenZone({ x: 850, y: 15 }, stripRect, display)).toBe(false);
    });
  });

  describe('isInPanelZone', () => {
    const panelRect = { x: 800, y: 0, width: 200, height: 82 };

    it('detects cursor inside panel + 8 DIP margin', () => {
      // Inside panel
      expect(isInPanelZone({ x: 900, y: 40 }, panelRect, 8)).toBe(true);

      // Left margin: 800 - 8 = 792
      expect(isInPanelZone({ x: 792, y: 40 }, panelRect, 8)).toBe(true);
      expect(isInPanelZone({ x: 791, y: 40 }, panelRect, 8)).toBe(false);

      // Bottom margin: 82 + 8 = 90
      expect(isInPanelZone({ x: 900, y: 90 }, panelRect, 8)).toBe(true);
      expect(isInPanelZone({ x: 900, y: 91 }, panelRect, 8)).toBe(false);
    });
  });

  describe('isNearStrip', () => {
    const display = { x: 0, y: 0, width: 1920, height: 1080 };
    const stripRect = { x: 800, y: 0, width: 144, height: 4 };

    it('identifies cursor within top 100 DIP and 250 DIP horizontal of strip', () => {
      expect(isNearStrip({ x: 850, y: 50 }, stripRect, display)).toBe(true);
      // Below 100 DIP
      expect(isNearStrip({ x: 850, y: 101 }, stripRect, display)).toBe(false);
      // Further than 250 DIP left: 800 - 250 = 550
      expect(isNearStrip({ x: 550, y: 50 }, stripRect, display)).toBe(true);
      expect(isNearStrip({ x: 549, y: 50 }, stripRect, display)).toBe(false);
    });
  });
});
