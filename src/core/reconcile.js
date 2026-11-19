/**
 * Pure battery source reconciliation logic for Voltlip.
 * No Electron dependencies.
 */

/**
 * Reconciles battery data from systeminformation, renderer Battery Status API,
 * and Electron powerMonitor.
 *
 * Priority order:
 * 1. systeminformation: authoritative for hasBattery, percent, and AC connection on OS level.
 * 2. renderer Battery Status API: fast event-driven fallback.
 * 3. powerMonitor: authoritative for AC vs battery state when isOnBattery is known.
 * 4. previousState: fallback if current readings are unavailable or faulted.
 *
 * @param {Object} options
 * @param {Object|null} [options.siData] - Result from systeminformation.battery()
 * @param {Object|null} [options.rendererData] - Result from navigator.getBattery()
 * @param {Object|null} [options.powerMonitorData] - { isOnBattery: boolean }
 * @param {Object|null} [options.previousState] - Previously reconciled state
 * @returns {Object} Reconciled state: { hasBattery, level, plugged, source, disagreement, disagreementDetails }
 */
function reconcileBatteryData(options = {}) {
  const opts = options || {};
  const { siData, rendererData, powerMonitorData, previousState } = opts;

  let hasBattery;
  let level;
  let plugged;
  let source;
  let disagreement = false;
  let disagreementDetails = null;

  // 1. Check systeminformation (OS-level ground truth)
  if (siData && typeof siData === 'object' && typeof siData.hasBattery === 'boolean') {
    if (!siData.hasBattery) {
      return {
        hasBattery: false,
        level: 0,
        plugged: false,
        source: 'systeminformation',
        disagreement: false,
        disagreementDetails: null,
      };
    }

    hasBattery = true;
    level = Math.max(0, Math.min(100, Math.round(Number(siData.percent) || 0)));

    // Determine plugged state: prefer instantaneous powerMonitor, then acConnected, then isCharging
    if (powerMonitorData && typeof powerMonitorData.isOnBattery === 'boolean') {
      plugged = !powerMonitorData.isOnBattery;
    } else if (typeof siData.acConnected === 'boolean') {
      plugged = siData.acConnected;
    } else if (typeof siData.isCharging === 'boolean') {
      plugged = siData.isCharging;
    }

    source = 'systeminformation';

    // Check disagreement with renderer
    if (rendererData && typeof rendererData.level === 'number') {
      const rendererPercent = Math.round(rendererData.level * 100);
      const levelDiff = Math.abs(rendererPercent - level);
      const pluggedDiff =
        typeof rendererData.charging === 'boolean' && rendererData.charging !== plugged;

      if (levelDiff > 5 || pluggedDiff) {
        disagreement = true;
        disagreementDetails = {
          si: { percent: level, plugged },
          renderer: { percent: rendererPercent, plugged: rendererData.charging },
          levelDiff,
          pluggedDiff,
        };
      }
    }

    return {
      hasBattery,
      level,
      plugged,
      source,
      disagreement,
      disagreementDetails,
    };
  }

  // 2. Fall back to renderer Battery Status API
  if (rendererData && typeof rendererData === 'object' && typeof rendererData.level === 'number') {
    level = Math.max(0, Math.min(100, Math.round(rendererData.level * 100)));

    if (powerMonitorData && typeof powerMonitorData.isOnBattery === 'boolean') {
      plugged = !powerMonitorData.isOnBattery;
    } else if (typeof rendererData.charging === 'boolean') {
      plugged = rendererData.charging;
    }

    hasBattery = previousState && typeof previousState.hasBattery === 'boolean' ? previousState.hasBattery : true;
    source = 'renderer';

    return {
      hasBattery,
      level,
      plugged,
      source,
      disagreement: false,
      disagreementDetails: null,
    };
  }

  // 3. Fall back to powerMonitor + previousState
  if (previousState && typeof previousState === 'object') {
    hasBattery = previousState.hasBattery ?? true;
    level = previousState.level ?? 100;
    plugged =
      powerMonitorData && typeof powerMonitorData.isOnBattery === 'boolean'
        ? !powerMonitorData.isOnBattery
        : previousState.plugged ?? true;
    source = 'previousState';

    return {
      hasBattery,
      level,
      plugged,
      source,
      disagreement: false,
      disagreementDetails: null,
    };
  }

  // 4. Safe fallback default
  plugged =
    powerMonitorData && typeof powerMonitorData.isOnBattery === 'boolean'
      ? !powerMonitorData.isOnBattery
      : true;

  return {
    hasBattery: true,
    level: 100,
    plugged,
    source: 'default',
    disagreement: false,
    disagreementDetails: null,
  };
}

module.exports = {
  reconcileBatteryData,
};
