import { describe, it, expect } from 'vitest';
import {
  calculatePercentAnchor,
  calculateStatusAnchorLeft,
  calculateStatusAnchorRight,
  computeAlignmentNudges,
} from '../src/core/alignment.js';

describe('alignment', () => {
  const firstSegmentLeft = 16.5;
  const lastSegmentRight = 193.5;

  describe('calculatePercentAnchor', () => {
    it('positions left-aligned anchor so left ink edge exactly matches firstSegmentLeft', () => {
      // If actualBoundingBoxLeft is 1.5px (glyph ink extends 1.5px left of anchor)
      const anchor = calculatePercentAnchor(firstSegmentLeft, 1.5);
      expect(anchor).toBe(18.0);
      // Verify ink position: anchor - actualBoundingBoxLeft = 18.0 - 1.5 = 16.5
      expect(anchor - 1.5).toBe(firstSegmentLeft);
    });

    it('handles negative or zero actualBoundingBoxLeft', () => {
      // If glyph starts 0.5px right of anchor
      const anchor = calculatePercentAnchor(firstSegmentLeft, -0.5);
      expect(anchor).toBe(16.0);
      expect(anchor - (-0.5)).toBe(firstSegmentLeft);

      // If zero
      const anchor0 = calculatePercentAnchor(firstSegmentLeft, 0);
      expect(anchor0).toBe(firstSegmentLeft);
    });
  });

  describe('calculateStatusAnchorRight', () => {
    it('positions right-aligned anchor so right ink edge exactly matches lastSegmentRight', () => {
      // If actualBoundingBoxRight is 0.8px (glyph ink extends 0.8px right of anchor)
      const anchor = calculateStatusAnchorRight(lastSegmentRight, 0.8);
      expect(anchor).toBe(192.7);
      // Verify ink position: anchor + actualBoundingBoxRight = 192.7 + 0.8 = 193.5
      expect(anchor + 0.8).toBe(lastSegmentRight);
    });

    it('handles negative actualBoundingBoxRight (ink ends before right anchor)', () => {
      const anchor = calculateStatusAnchorRight(lastSegmentRight, -1.2);
      expect(anchor).toBe(194.7);
      expect(anchor + (-1.2)).toBe(lastSegmentRight);
    });
  });

  describe('calculateStatusAnchorLeft', () => {
    it('positions left-aligned anchor so right ink edge exactly matches lastSegmentRight', () => {
      const anchor = calculateStatusAnchorLeft(lastSegmentRight, 54.2);
      expect(anchor).toBe(193.5 - 54.2);
      expect(anchor + 54.2).toBe(lastSegmentRight);
    });
  });

  describe('computeAlignmentNudges', () => {
    it('computes exact nudge offsets relative to nominal element bounds', () => {
      const result = computeAlignmentNudges({
        firstSegmentLeft: 16,
        lastSegmentRight: 194,
        percentMetrics: { actualBoundingBoxLeft: 1.2 },
        statusMetrics: { actualBoundingBoxRight: 0.8 },
        nominalPercentLeft: 16,
        nominalStatusRight: 194,
        statusAlign: 'right',
      });

      expect(result.percentAnchorLeft).toBe(17.2);
      expect(result.percentNudgeX).toBeCloseTo(1.2, 5);

      expect(result.statusAnchor).toBe(193.2);
      expect(result.statusNudgeX).toBeCloseTo(-0.8, 5);
    });
  });
});
