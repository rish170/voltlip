/**
 * Pure state machine logic for Voltlip.
 * No Electron dependencies.
 */

const DEFAULT_THRESHOLDS = {
  lowThreshold: 40,
  criticalThreshold: 30,
  highThreshold: 80,
  hysteresis: 2,
};

/**
 * Computes the battery state, strip color, breathing animation state, and status label.
 *
 * @param {Object} input
 * @param {number} input.level - Battery level (0 to 100)
 * @param {boolean} input.plugged - True if connected to AC power
 * @param {boolean} [input.hasBattery=true] - True if system has a battery
 * @param {Object} [previousOutput] - Previous state output for hysteresis
 * @param {Object} [thresholds] - Custom threshold overrides
 * @returns {Object} Output state: { color, breathing, status, percent, segmentsFill, hasBattery }
 */
function computeBatteryState(input, previousOutput = null, thresholds = {}) {
  const {
    lowThreshold = DEFAULT_THRESHOLDS.lowThreshold,
    criticalThreshold = DEFAULT_THRESHOLDS.criticalThreshold,
    highThreshold = DEFAULT_THRESHOLDS.highThreshold,
    hysteresis = DEFAULT_THRESHOLDS.hysteresis,
  } = thresholds;

  // Handle desktop PC without battery
  if (input.hasBattery === false) {
    return {
      color: 'black',
      breathing: false,
      status: 'No Battery',
      percent: 0,
      segmentsFill: 0,
      hasBattery: false,
    };
  }

  // Sanitize level to integer [0, 100]
  const rawLevel = typeof input.level === 'number' ? input.level : 0;
  const percent = Math.max(0, Math.min(100, Math.round(rawLevel)));
  const segmentsFill = percent / 100;
  const plugged = Boolean(input.plugged);

  // Status word determination
  let status = 'Discharging';
  if (plugged) {
    status = percent === 100 ? 'Charged' : 'Charging';
  }

  let color;
  let breathing;

  if (plugged) {
    // Plugged in is always green
    color = 'green';

    // Breathing when plugged:
    // Charging and level above 80%: green breathes
    // Hysteresis: if already breathing, stop only when <= highThreshold - hysteresis
    const prevBreathing = previousOutput && previousOutput.color === 'green' && previousOutput.breathing;
    if (prevBreathing) {
      breathing = percent > (highThreshold - hysteresis);
    } else {
      breathing = percent > highThreshold;
    }
  } else {
    // On battery:
    // Level >= 40: black
    // Level < 40: red
    // Red breathes if level < 30
    // Hysteresis on lowThreshold (40):
    // If previously red, switch back to black only when >= lowThreshold + hysteresis (42)
    const prevColor = previousOutput ? previousOutput.color : null;
    const wasRed = prevColor === 'red';

    if (wasRed) {
      color = percent >= (lowThreshold + hysteresis) ? 'black' : 'red';
    } else {
      color = percent < lowThreshold ? 'red' : 'black';
    }

    if (color === 'red') {
      // Breathing hysteresis on criticalThreshold (30):
      // If already breathing red, stop only when >= criticalThreshold + hysteresis (32)
      const prevBreathingRed = previousOutput && previousOutput.color === 'red' && previousOutput.breathing;
      if (prevBreathingRed) {
        breathing = percent < (criticalThreshold + hysteresis);
      } else {
        breathing = percent < criticalThreshold;
      }
    } else {
      breathing = false;
    }
  }

  return {
    color,
    breathing,
    status,
    percent,
    segmentsFill,
    hasBattery: true,
  };
}

module.exports = {
  DEFAULT_THRESHOLDS,
  computeBatteryState,
};
