import { describe, it, expect } from 'vitest';
import { reconcileBatteryData } from '../src/core/reconcile.js';

describe('reconcileBatteryData', () => {
  it('detects desktop PC with no battery via systeminformation', () => {
    const result = reconcileBatteryData({
      siData: { hasBattery: false },
      rendererData: { level: 1.0, charging: true },
      powerMonitorData: { isOnBattery: false },
    });

    expect(result.hasBattery).toBe(false);
    expect(result.level).toBe(0);
    expect(result.plugged).toBe(false);
    expect(result.source).toBe('systeminformation');
  });

  it('prioritizes systeminformation over Chromium renderer battery API', () => {
    const result = reconcileBatteryData({
      siData: { hasBattery: true, percent: 84, acConnected: false, isCharging: false },
      rendererData: { level: 0.88, charging: false },
      powerMonitorData: { isOnBattery: true },
    });

    expect(result.hasBattery).toBe(true);
    expect(result.level).toBe(84);
    expect(result.plugged).toBe(false);
    expect(result.source).toBe('systeminformation');
  });

  it('powerMonitor isOnBattery immediately overrides stale siData acConnected on unplug', () => {
    const result = reconcileBatteryData({
      siData: { hasBattery: true, percent: 85, acConnected: true, isCharging: true },
      rendererData: { level: 0.85, charging: false },
      powerMonitorData: { isOnBattery: true },
    });

    expect(result.hasBattery).toBe(true);
    expect(result.level).toBe(85);
    expect(result.plugged).toBe(false); // Instantly false even if siData.acConnected was still true!
  });

  it('powerMonitor isOnBattery: false immediately overrides stale siData on plug-in', () => {
    const result = reconcileBatteryData({
      siData: { hasBattery: true, percent: 60, acConnected: false, isCharging: false },
      rendererData: { level: 0.60, charging: true },
      powerMonitorData: { isOnBattery: false },
    });

    expect(result.hasBattery).toBe(true);
    expect(result.level).toBe(60);
    expect(result.plugged).toBe(true); // Instantly true when plugged into AC!
  });

  it('detects and reports disagreement between systeminformation and renderer', () => {
    const result = reconcileBatteryData({
      siData: { hasBattery: true, percent: 50, acConnected: true },
      rendererData: { level: 0.70, charging: true },
    });

    expect(result.level).toBe(50);
    expect(result.disagreement).toBe(true);
    expect(result.disagreementDetails.levelDiff).toBe(20);
  });

  it('falls back to renderer when systeminformation is null or missing', () => {
    const result = reconcileBatteryData({
      siData: null,
      rendererData: { level: 0.65, charging: true },
      powerMonitorData: { isOnBattery: false },
    });

    expect(result.hasBattery).toBe(true);
    expect(result.level).toBe(65);
    expect(result.plugged).toBe(true);
    expect(result.source).toBe('renderer');
  });

  it('falls back to previousState and powerMonitor when live sources fail', () => {
    const result = reconcileBatteryData({
      siData: null,
      rendererData: null,
      powerMonitorData: { isOnBattery: true },
      previousState: { hasBattery: true, level: 42, plugged: true },
    });

    expect(result.level).toBe(42);
    expect(result.plugged).toBe(false); // powerMonitor isOnBattery: true overrides plugged
    expect(result.source).toBe('previousState');
  });

  it('provides safe default when no data is available at all', () => {
    const result = reconcileBatteryData({});
    expect(result.hasBattery).toBe(true);
    expect(result.level).toBe(100);
    expect(result.plugged).toBe(true);
    expect(result.source).toBe('default');
  });

  it('never crashes on malformed inputs or null values', () => {
    expect(() => reconcileBatteryData(null)).not.toThrow();
    expect(() => reconcileBatteryData({ siData: { percent: 'not-a-number' } })).not.toThrow();
  });
});
