import { describe, it, expect } from 'vitest';
import {
  getDefaultSettings,
  validateSettings,
  parseSettings,
  serializeSettings,
} from '../src/core/settings.js';

describe('settings', () => {
  it('provides default settings conforming to spec', () => {
    const defaults = getDefaultSettings();
    expect(defaults.stripLength).toBe(144);
    expect(defaults.stripThickness).toBe(4);
    expect(defaults.stripAlign).toBe('center');
    expect(defaults.stripOffsetX).toBe(0);
    expect(defaults.lowThreshold).toBe(40);
    expect(defaults.criticalThreshold).toBe(30);
    expect(defaults.highThreshold).toBe(80);
    expect(defaults.breatheMinOpacity).toBe(0.0);
    expect(defaults.breathePeriodMs).toBe(4000);
    expect(defaults.breathePeriodLowMs).toBe(1800);
    expect(defaults.breathePeriodHighMs).toBe(4000);
    expect(defaults.panelFrameWidth).toBe(190);
    expect(defaults.blackStripEdge).toBe('none');
    expect(defaults.theme).toBe('dark');
    expect(defaults.startWithSystem).toBe(false);
    expect(defaults.paused).toBe(false);
  });

  it('clamps numerical values within sane ranges', () => {
    const clamped = validateSettings({
      stripLength: 2000, // max 800
      stripThickness: 0, // min 1
      lowThreshold: 90, // max 60
      criticalThreshold: 2, // min 5
      highThreshold: 150, // max 99
      breatheMinOpacity: 0.95, // max 0.8
      breathePeriodMs: 100, // min 500
      panelFrameWidth: 50, // min 100
    });

    expect(clamped.stripLength).toBe(800);
    expect(clamped.stripThickness).toBe(1);
    expect(clamped.lowThreshold).toBe(60);
    expect(clamped.criticalThreshold).toBe(5);
    expect(clamped.highThreshold).toBe(99);
    expect(clamped.breatheMinOpacity).toBe(0.8);
    expect(clamped.breathePeriodMs).toBe(500);
    expect(clamped.panelFrameWidth).toBe(100);
  });

  it('ensures criticalThreshold is strictly below lowThreshold', () => {
    const adjusted = validateSettings({
      lowThreshold: 25,
      criticalThreshold: 30,
    });
    expect(adjusted.lowThreshold).toBe(25);
    expect(adjusted.criticalThreshold).toBe(24);
  });

  it('filters out unknown keys', () => {
    const cleaned = validateSettings({
      stripLength: 160,
      unknownKey: 'dangerous_payload',
      anotherOne: 1234,
    });

    expect(cleaned.stripLength).toBe(160);
    expect(cleaned).not.toHaveProperty('unknownKey');
    expect(cleaned).not.toHaveProperty('anotherOne');
  });

  it('safely recovers from malformed or corrupted JSON', () => {
    const resultFromBad = parseSettings('{ bad json: ...');
    expect(resultFromBad).toEqual(getDefaultSettings());

    const resultFromNull = parseSettings(null);
    expect(resultFromNull).toEqual(getDefaultSettings());
  });

  it('round-trips serialize and parse', () => {
    const custom = {
      ...getDefaultSettings(),
      stripLength: 180,
      blackStripEdge: 'light',
    };
    const serialized = serializeSettings(custom);
    const parsed = parseSettings(serialized);

    expect(parsed.stripLength).toBe(180);
    expect(parsed.blackStripEdge).toBe('light');
  });
});
