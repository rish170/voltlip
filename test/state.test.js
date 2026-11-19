import { describe, it, expect } from 'vitest';
import { computeBatteryState } from '../src/core/state.js';

describe('computeBatteryState', () => {
  describe('Basic conditions table from section 5.1', () => {
    it('discharging and level >= 40 produces black steady strip', () => {
      const state = computeBatteryState({ level: 100, plugged: false, hasBattery: true });
      expect(state.color).toBe('black');
      expect(state.breathing).toBe(false);
      expect(state.status).toBe('Discharging');
      expect(state.percent).toBe(100);
      expect(state.segmentsFill).toBe(1.0);

      const state50 = computeBatteryState({ level: 50, plugged: false, hasBattery: true });
      expect(state50.color).toBe('black');
      expect(state50.breathing).toBe(false);
      expect(state50.status).toBe('Discharging');
      expect(state50.percent).toBe(50);
      expect(state50.segmentsFill).toBe(0.5);

      const state40 = computeBatteryState({ level: 40, plugged: false, hasBattery: true });
      expect(state40.color).toBe('black');
      expect(state40.breathing).toBe(false);
      expect(state40.status).toBe('Discharging');
    });

    it('plugged in produces green strip (steady if <= 80, breathing if > 80)', () => {
      const state75 = computeBatteryState({ level: 75, plugged: true, hasBattery: true });
      expect(state75.color).toBe('green');
      expect(state75.breathing).toBe(false);
      expect(state75.status).toBe('Charging');

      const state80 = computeBatteryState({ level: 80, plugged: true, hasBattery: true });
      expect(state80.color).toBe('green');
      expect(state80.breathing).toBe(false);

      const state81 = computeBatteryState({ level: 81, plugged: true, hasBattery: true });
      expect(state81.color).toBe('green');
      expect(state81.breathing).toBe(true);

      const state100 = computeBatteryState({ level: 100, plugged: true, hasBattery: true });
      expect(state100.color).toBe('green');
      expect(state100.breathing).toBe(true);
      expect(state100.status).toBe('Charged');
    });

    it('discharging and level < 40 produces red strip (steady if >= 30, breathing if < 30)', () => {
      const state39 = computeBatteryState({ level: 39, plugged: false, hasBattery: true });
      expect(state39.color).toBe('red');
      expect(state39.breathing).toBe(false);
      expect(state39.status).toBe('Discharging');

      const state30 = computeBatteryState({ level: 30, plugged: false, hasBattery: true });
      expect(state30.color).toBe('red');
      expect(state30.breathing).toBe(false);

      const state29 = computeBatteryState({ level: 29, plugged: false, hasBattery: true });
      expect(state29.color).toBe('red');
      expect(state29.breathing).toBe(true);

      const state10 = computeBatteryState({ level: 10, plugged: false, hasBattery: true });
      expect(state10.color).toBe('red');
      expect(state10.breathing).toBe(true);
    });
  });

  describe('Hysteresis', () => {
    it('applies 2% hysteresis at lowThreshold (40%)', () => {
      // Transition from black to red at 39%
      const red39 = computeBatteryState({ level: 39, plugged: false, hasBattery: true });
      expect(red39.color).toBe('red');

      // Wobbling up to 40% stays red
      const red40 = computeBatteryState({ level: 40, plugged: false, hasBattery: true }, red39);
      expect(red40.color).toBe('red');

      // Wobbling up to 41% stays red
      const red41 = computeBatteryState({ level: 41, plugged: false, hasBattery: true }, red40);
      expect(red41.color).toBe('red');

      // Reaching 42% (40 + 2) returns to black
      const black42 = computeBatteryState({ level: 42, plugged: false, hasBattery: true }, red41);
      expect(black42.color).toBe('black');
    });

    it('applies 2% hysteresis at criticalThreshold (30%) breathing', () => {
      // Transition from steady red to breathing red at 29%
      const red29 = computeBatteryState({ level: 29, plugged: false, hasBattery: true });
      expect(red29.color).toBe('red');
      expect(red29.breathing).toBe(true);

      // Wobbling up to 30% stays breathing
      const red30 = computeBatteryState({ level: 30, plugged: false, hasBattery: true }, red29);
      expect(red30.breathing).toBe(true);

      // Wobbling up to 31% stays breathing
      const red31 = computeBatteryState({ level: 31, plugged: false, hasBattery: true }, red30);
      expect(red31.breathing).toBe(true);

      // Reaching 32% (30 + 2) stops breathing
      const red32 = computeBatteryState({ level: 32, plugged: false, hasBattery: true }, red31);
      expect(red32.color).toBe('red');
      expect(red32.breathing).toBe(false);
    });

    it('applies 2% hysteresis at highThreshold (80%) breathing when charging', () => {
      // Starts breathing above 80% (81%)
      const green81 = computeBatteryState({ level: 81, plugged: true, hasBattery: true });
      expect(green81.color).toBe('green');
      expect(green81.breathing).toBe(true);

      // Dropping to 80% stays breathing
      const green80 = computeBatteryState({ level: 80, plugged: true, hasBattery: true }, green81);
      expect(green80.breathing).toBe(true);

      // Dropping to 79% stays breathing
      const green79 = computeBatteryState({ level: 79, plugged: true, hasBattery: true }, green80);
      expect(green79.breathing).toBe(true);

      // Dropping to 78% (80 - 2) stops breathing
      const green78 = computeBatteryState({ level: 78, plugged: true, hasBattery: true }, green79);
      expect(green78.breathing).toBe(false);
    });
  });

  describe('Unplug and plug transitions', () => {
    it('unplugging immediately changes color to black or red', () => {
      const pluggedHigh = computeBatteryState({ level: 85, plugged: true, hasBattery: true });
      expect(pluggedHigh.color).toBe('green');

      const unpluggedHigh = computeBatteryState(
        { level: 85, plugged: false, hasBattery: true },
        pluggedHigh
      );
      expect(unpluggedHigh.color).toBe('black');
      expect(unpluggedHigh.status).toBe('Discharging');

      const pluggedLow = computeBatteryState({ level: 25, plugged: true, hasBattery: true });
      const unpluggedLow = computeBatteryState(
        { level: 25, plugged: false, hasBattery: true },
        pluggedLow
      );
      expect(unpluggedLow.color).toBe('red');
      expect(unpluggedLow.breathing).toBe(true);
    });

    it('plugging in immediately changes color to green', () => {
      const dischargingRed = computeBatteryState({ level: 20, plugged: false, hasBattery: true });
      expect(dischargingRed.color).toBe('red');

      const pluggedIn = computeBatteryState(
        { level: 20, plugged: true, hasBattery: true },
        dischargingRed
      );
      expect(pluggedIn.color).toBe('green');
      expect(pluggedIn.status).toBe('Charging');
    });
  });

  describe('Desktop PC without battery (hasBattery: false)', () => {
    it('returns hasBattery: false, status "No Battery", no breathing', () => {
      const desktopState = computeBatteryState({ level: 0, plugged: true, hasBattery: false });
      expect(desktopState.hasBattery).toBe(false);
      expect(desktopState.status).toBe('No Battery');
      expect(desktopState.breathing).toBe(false);
      expect(desktopState.percent).toBe(0);
      expect(desktopState.segmentsFill).toBe(0);
    });
  });
});
