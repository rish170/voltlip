/**
 * Pure settings validation and serialization logic for Voltlip.
 * Plain JSON storage in app.getPath('userData').
 * No Electron dependencies.
 */

const DEFAULT_SETTINGS = Object.freeze({
  stripLength: 144,
  stripThickness: 4,
  stripAlign: 'center',
  stripOffsetX: 0,
  lowThreshold: 40,
  criticalThreshold: 30,
  highThreshold: 80,
  breatheMinOpacity: 0.0,
  breathePeriodMs: 4000,
  breathePeriodLowMs: 1800,
  breathePeriodHighMs: 4000,
  panelFrameWidth: 190,
  blackStripEdge: 'none',
  theme: 'dark',
  startWithSystem: false,
  paused: false,
});

/**
 * Returns a fresh copy of default settings.
 * @returns {Object}
 */
function getDefaultSettings() {
  return { ...DEFAULT_SETTINGS };
}

/**
 * Validates, sanitizes, and clamps raw settings input.
 * Unknown keys are discarded. Missing keys are populated from defaults.
 *
 * @param {Object} [raw]
 * @returns {Object} Validated settings
 */
function validateSettings(raw = {}) {
  const result = getDefaultSettings();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return result;
  }

  // stripLength: integer, 40 to 800
  if (typeof raw.stripLength === 'number' && !Number.isNaN(raw.stripLength)) {
    result.stripLength = Math.max(40, Math.min(800, Math.round(raw.stripLength)));
  }

  // stripThickness: integer, 1 to 30
  if (typeof raw.stripThickness === 'number' && !Number.isNaN(raw.stripThickness)) {
    result.stripThickness = Math.max(1, Math.min(30, Math.round(raw.stripThickness)));
  }

  // stripAlign: 'center' | 'left' | 'right'
  if (raw.stripAlign === 'left' || raw.stripAlign === 'right' || raw.stripAlign === 'center') {
    result.stripAlign = raw.stripAlign;
  }

  // stripOffsetX: integer, -2000 to 2000
  if (typeof raw.stripOffsetX === 'number' && !Number.isNaN(raw.stripOffsetX)) {
    result.stripOffsetX = Math.max(-2000, Math.min(2000, Math.round(raw.stripOffsetX)));
  }

  // lowThreshold: integer, 10 to 60
  if (typeof raw.lowThreshold === 'number' && !Number.isNaN(raw.lowThreshold)) {
    result.lowThreshold = Math.max(10, Math.min(60, Math.round(raw.lowThreshold)));
  }

  // criticalThreshold: integer, 5 to 50 (must be strictly less than lowThreshold)
  if (typeof raw.criticalThreshold === 'number' && !Number.isNaN(raw.criticalThreshold)) {
    const clampedCrit = Math.max(5, Math.min(50, Math.round(raw.criticalThreshold)));
    result.criticalThreshold = Math.min(clampedCrit, result.lowThreshold - 1);
  }

  // highThreshold: integer, 60 to 99
  if (typeof raw.highThreshold === 'number' && !Number.isNaN(raw.highThreshold)) {
    result.highThreshold = Math.max(60, Math.min(99, Math.round(raw.highThreshold)));
  }

  // breatheMinOpacity: float, 0.0 to 0.8
  if (typeof raw.breatheMinOpacity === 'number' && !Number.isNaN(raw.breatheMinOpacity)) {
    result.breatheMinOpacity = Math.max(0, Math.min(0.8, Number(raw.breatheMinOpacity.toFixed(2))));
  }

  // breathePeriodMs: integer, 500 to 20000
  if (typeof raw.breathePeriodMs === 'number' && !Number.isNaN(raw.breathePeriodMs)) {
    result.breathePeriodMs = Math.max(500, Math.min(20000, Math.round(raw.breathePeriodMs)));
  }

  // breathePeriodLowMs: integer, 200 to 10000 (breathing below 30%)
  if (typeof raw.breathePeriodLowMs === 'number' && !Number.isNaN(raw.breathePeriodLowMs)) {
    result.breathePeriodLowMs = Math.max(200, Math.min(10000, Math.round(raw.breathePeriodLowMs)));
  }

  // breathePeriodHighMs: integer, 200 to 10000 (breathing above 80%)
  if (typeof raw.breathePeriodHighMs === 'number' && !Number.isNaN(raw.breathePeriodHighMs)) {
    result.breathePeriodHighMs = Math.max(200, Math.min(10000, Math.round(raw.breathePeriodHighMs)));
  }

  // panelFrameWidth: integer, 100 to 400
  if (typeof raw.panelFrameWidth === 'number' && !Number.isNaN(raw.panelFrameWidth)) {
    result.panelFrameWidth = Math.max(100, Math.min(400, Math.round(raw.panelFrameWidth)));
  }

  // blackStripEdge: 'none' | 'light'
  if (raw.blackStripEdge === 'light' || raw.blackStripEdge === 'none') {
    result.blackStripEdge = raw.blackStripEdge;
  }

  // theme: 'dark' | 'light'
  if (raw.theme === 'light' || raw.theme === 'dark') {
    result.theme = raw.theme;
  }

  // startWithSystem: boolean
  if (typeof raw.startWithSystem === 'boolean') {
    result.startWithSystem = raw.startWithSystem;
  }

  // paused: boolean
  if (typeof raw.paused === 'boolean') {
    result.paused = raw.paused;
  }

  return result;
}

/**
 * Safely parses a JSON string into validated settings.
 * Falls back to defaults if corrupted or invalid JSON.
 *
 * @param {string} jsonString
 * @returns {Object}
 */
function parseSettings(jsonString) {
  if (typeof jsonString !== 'string') {
    return getDefaultSettings();
  }
  try {
    const parsed = JSON.parse(jsonString);
    return validateSettings(parsed);
  } catch (_err) {
    return getDefaultSettings();
  }
}

/**
 * Formats settings object to pretty-printed JSON.
 * @param {Object} settings
 * @returns {string}
 */
function serializeSettings(settings) {
  const valid = validateSettings(settings);
  return JSON.stringify(valid, null, 2);
}

module.exports = {
  DEFAULT_SETTINGS,
  getDefaultSettings,
  validateSettings,
  parseSettings,
  serializeSettings,
};
