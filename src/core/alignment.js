/**
 * Pure ink-edge text alignment mathematics for Voltlip.
 * Aligns the leftmost ink pixel of the percentage text with the left edge of segment 1,
 * and the rightmost ink pixel of the status text with the right edge of segment 4.
 * No Electron dependencies.
 */

/**
 * Calculates the exact X anchor position for the percentage text (left-aligned)
 * so that its ink left edge matches firstSegmentLeft.
 *
 * In Canvas 2D TextMetrics:
 * Ink left edge = anchorX - actualBoundingBoxLeft.
 * Setting ink left edge = firstSegmentLeft gives:
 * anchorX = firstSegmentLeft + actualBoundingBoxLeft.
 *
 * @param {number} firstSegmentLeft
 * @param {number} [actualBoundingBoxLeft=0]
 * @returns {number}
 */
function calculatePercentAnchor(firstSegmentLeft, actualBoundingBoxLeft = 0) {
  const abbLeft = Number(actualBoundingBoxLeft) || 0;
  return firstSegmentLeft + abbLeft;
}

/**
 * Calculates the exact X anchor position for the status text (left-aligned anchor)
 * so that its ink right edge matches lastSegmentRight.
 *
 * In Canvas 2D TextMetrics:
 * Ink right edge = anchorX + actualBoundingBoxRight.
 * Setting ink right edge = lastSegmentRight gives:
 * anchorX = lastSegmentRight - actualBoundingBoxRight.
 *
 * @param {number} lastSegmentRight
 * @param {number} [actualBoundingBoxRight=0]
 * @returns {number}
 */
function calculateStatusAnchorLeft(lastSegmentRight, actualBoundingBoxRight = 0) {
  const abbRight = Number(actualBoundingBoxRight) || 0;
  return lastSegmentRight - abbRight;
}

/**
 * Calculates the exact X anchor position for the status text when right-aligned.
 *
 * With textAlign = 'right':
 * ink right edge = anchorRight + actualBoundingBoxRight.
 * Setting ink right edge = lastSegmentRight gives:
 * anchorRight = lastSegmentRight - actualBoundingBoxRight.
 *
 * @param {number} lastSegmentRight
 * @param {number} [actualBoundingBoxRight=0]
 * @returns {number}
 */
function calculateStatusAnchorRight(lastSegmentRight, actualBoundingBoxRight = 0) {
  const abbRight = Number(actualBoundingBoxRight) || 0;
  return lastSegmentRight - abbRight;
}

/**
 * Computes alignment nudges and positions for percentage and status text elements.
 *
 * @param {Object} options
 * @param {number} options.firstSegmentLeft - Target left ink X
 * @param {number} options.lastSegmentRight - Target right ink X
 * @param {Object} options.percentMetrics - Canvas TextMetrics for percent string
 * @param {Object} options.statusMetrics - Canvas TextMetrics for status string
 * @param {number} [options.nominalPercentLeft] - Nominal CSS left of percent element
 * @param {number} [options.nominalStatusRight] - Nominal CSS right of status element (if right-aligned)
 * @param {number} [options.nominalStatusLeft] - Nominal CSS left of status element (if left-aligned)
 * @param {string} [options.statusAlign='right'] - 'right' | 'left'
 * @returns {Object} { percentAnchorLeft, statusAnchor, percentNudgeX, statusNudgeX }
 */
function computeAlignmentNudges(options) {
  const {
    firstSegmentLeft,
    lastSegmentRight,
    percentMetrics = {},
    statusMetrics = {},
    nominalPercentLeft = firstSegmentLeft,
    nominalStatusRight,
    nominalStatusLeft,
    statusAlign = 'right',
  } = options || {};

  const pAbbLeft = percentMetrics.actualBoundingBoxLeft || 0;
  const sAbbRight = statusMetrics.actualBoundingBoxRight || 0;

  const percentAnchorLeft = calculatePercentAnchor(firstSegmentLeft, pAbbLeft);
  const percentNudgeX = percentAnchorLeft - nominalPercentLeft;

  let statusAnchor;
  let statusNudgeX;

  if (statusAlign === 'right') {
    statusAnchor = calculateStatusAnchorRight(lastSegmentRight, sAbbRight);
    const nominalRight = nominalStatusRight !== undefined ? nominalStatusRight : lastSegmentRight;
    statusNudgeX = statusAnchor - nominalRight;
  } else {
    statusAnchor = calculateStatusAnchorLeft(lastSegmentRight, sAbbRight);
    const nominalLeft =
      nominalStatusLeft !== undefined
        ? nominalStatusLeft
        : lastSegmentRight - (statusMetrics.width || 0);
    statusNudgeX = statusAnchor - nominalLeft;
  }

  return {
    percentAnchorLeft,
    statusAnchor,
    percentNudgeX,
    statusNudgeX,
  };
}

module.exports = {
  calculatePercentAnchor,
  calculateStatusAnchorLeft,
  calculateStatusAnchorRight,
  computeAlignmentNudges,
};
