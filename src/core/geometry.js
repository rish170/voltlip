/**
 * Pure geometry and hit-testing logic for Voltlip.
 * No Electron dependencies.
 */

const REFERENCE_FRAME_WIDTH = 903;
const DEFAULT_FRAME_WIDTH = 190;

/**
 * Calculates all proportional dimensions from panelFrameWidth.
 * @param {number} [frameWidth=190]
 * @returns {Object} Proportional geometry in DIP
 */
function computeDimensions(frameWidth = DEFAULT_FRAME_WIDTH) {
  const fw = Math.max(80, Number(frameWidth) || DEFAULT_FRAME_WIDTH);
  const u = fw / REFERENCE_FRAME_WIDTH;

  const frameOuterWidth = fw;
  const frameOuterHeight = 138 * u;
  const frameLineWidth = 21 * u;
  const batteryGap = 24 * u; // Space between frame border and segments, equal to segment gap (~5 DIP at fw=190)
  const frameInnerGap = batteryGap;
  const frameCornerRadius = 21 * u;

  const cardSidePadding = 46 * u;
  const cardTopPadding = 120 * u; // Increased gap between top screen edge and battery when card slides down (~25.2 DIP at fw=190)
  const frameBottomToTextTop = 62 * u;
  const textCapHeight = 55 * u;
  const cardBottomPadding = 67 * u;
  const cardCornerRadius = 14; // DIP, per spec

  const cardWidth = frameOuterWidth + 2 * cardSidePadding;
  const cardHeight = cardTopPadding + frameOuterHeight + frameBottomToTextTop + textCapHeight + cardBottomPadding;

  const inset = frameLineWidth + frameInnerGap;
  const innerX = cardSidePadding + inset;
  const innerY = cardTopPadding + inset;
  const innerWidth = (REFERENCE_FRAME_WIDTH - 2 * (21 + 14)) * u;
  const innerHeight = (138 - 2 * (21 + 14)) * u;

  const segmentGap = batteryGap;
  const segmentWidth = (innerWidth - 3 * segmentGap) / 4;

  return {
    u,
    frameOuterWidth,
    frameOuterHeight,
    frameLineWidth,
    frameInnerGap,
    frameCornerRadius,
    cardSidePadding,
    cardTopPadding,
    frameBottomToTextTop,
    textCapHeight,
    cardBottomPadding,
    cardCornerRadius,
    cardWidth,
    cardHeight,
    innerX,
    innerY,
    innerWidth,
    innerHeight,
    segmentGap,
    segmentWidth,
    firstSegmentLeft: innerX,
    lastSegmentRight: innerX + innerWidth,
  };
}

/**
 * Calculates continuous fill width for battery bar.
 * @param {number} percent - 0 to 100
 * @param {number} innerWidth - total inner segments width
 * @returns {number} fill width in DIP
 */
function computeFillWidth(percent, innerWidth) {
  const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
  return (clamped / 100) * innerWidth;
}

/**
 * Calculates the bounding rectangle of the idle strip on a display.
 * @param {Object} options
 * @param {Object} options.display - { x, y, width, height }
 * @param {number} [options.stripLength=144]
 * @param {number} [options.stripThickness=4]
 * @param {string} [options.stripAlign='center'] - 'center' | 'left' | 'right'
 * @param {number} [options.stripOffsetX=0]
 * @returns {Object} { x, y, width, height }
 */
function getStripRect(options) {
  const {
    display = { x: 0, y: 0, width: 1920, height: 1080 },
    stripLength = 144,
    stripThickness = 4,
    stripAlign = 'center',
    stripOffsetX = 0,
  } = options || {};

  let x = display.x;
  if (stripAlign === 'center') {
    x += Math.round((display.width - stripLength) / 2) + stripOffsetX;
  } else if (stripAlign === 'left') {
    x += stripOffsetX;
  } else if (stripAlign === 'right') {
    x += display.width - stripLength + stripOffsetX;
  }

  return {
    x,
    y: display.y,
    width: stripLength,
    height: stripThickness,
  };
}

/**
 * Calculates the bounding rectangle of the hover panel on a display.
 * @param {Object} options
 * @param {Object} options.display - { x, y, width, height }
 * @param {number} options.cardWidth
 * @param {number} options.cardHeight
 * @param {string} [options.stripAlign='center']
 * @param {number} [options.stripOffsetX=0]
 * @returns {Object} { x, y, width, height }
 */
function getPanelRect(options) {
  const {
    display = { x: 0, y: 0, width: 1920, height: 1080 },
    cardWidth = 200,
    cardHeight = 82,
    stripAlign = 'center',
    stripOffsetX = 0,
  } = options || {};

  let x = display.x;
  if (stripAlign === 'center') {
    x += Math.round((display.width - cardWidth) / 2) + stripOffsetX;
  } else if (stripAlign === 'left') {
    x += stripOffsetX;
  } else if (stripAlign === 'right') {
    x += display.width - cardWidth + stripOffsetX;
  }

  return {
    x,
    y: display.y,
    width: cardWidth,
    height: cardHeight,
  };
}

/**
 * Checks whether cursor is in the strip's open trigger zone.
 * Zone: strip rectangle expanded by 24 DIP left/right and extended down to strip bottom + 10 DIP.
 * Top edge y=display.y counts.
 */
function isInOpenZone(cursor, stripRect, display) {
  if (!cursor || !stripRect || !display) return false;

  const xMin = stripRect.x - 24;
  const xMax = stripRect.x + stripRect.width + 24;
  const yMin = display.y;
  const yMax = stripRect.y + stripRect.height + 10;

  return cursor.x >= xMin && cursor.x <= xMax && cursor.y >= yMin && cursor.y <= yMax;
}

/**
 * Checks whether cursor is in the panel stay-open zone.
 * Zone: panel rectangle + margin (default 8 DIP).
 */
function isInPanelZone(cursor, panelRect, margin = 8) {
  if (!cursor || !panelRect) return false;

  const xMin = panelRect.x - margin;
  const xMax = panelRect.x + panelRect.width + margin;
  const yMin = panelRect.y;
  const yMax = panelRect.y + panelRect.height + margin;

  return cursor.x >= xMin && cursor.x <= xMax && cursor.y >= yMin && cursor.y <= yMax;
}

/**
 * Checks whether cursor is near the strip for adaptive polling.
 * Near = within top 100 DIP and within 250 DIP horizontally of strip.
 */
function isNearStrip(cursor, stripRect, display) {
  if (!cursor || !stripRect || !display) return false;

  const xMin = stripRect.x - 250;
  const xMax = stripRect.x + stripRect.width + 250;
  const yMin = display.y;
  const yMax = display.y + 100;

  return cursor.x >= xMin && cursor.x <= xMax && cursor.y >= yMin && cursor.y <= yMax;
}

module.exports = {
  REFERENCE_FRAME_WIDTH,
  DEFAULT_FRAME_WIDTH,
  computeDimensions,
  computeFillWidth,
  getStripRect,
  getPanelRect,
  isInOpenZone,
  isInPanelZone,
  isNearStrip,
};
