// Renderer script for Voltlip

const appContainer = document.getElementById('app');
const strip = document.getElementById('strip');
const card = document.getElementById('card');
const percentLabel = document.getElementById('percent-label');
const statusLabel = document.getElementById('status-label');
const measureCanvas = document.getElementById('measure-canvas');
const measureCtx = measureCanvas ? measureCanvas.getContext('2d') : null;

let currentSettings = null;
let currentDimensions = null;
let lastRenderedState = null;

function applyDimensionsCSS(dimensions, settings) {
  if (!dimensions || !settings) return;

  const root = document.documentElement;
  const u = dimensions.u;

  const theme = settings.theme === 'light' ? 'light' : 'dark';
  document.body.classList.remove('theme-dark', 'theme-light');
  document.body.classList.add(`theme-${theme}`);

  root.style.setProperty('--strip-length', `${settings.stripLength}px`);
  root.style.setProperty('--strip-thickness', `${settings.stripThickness}px`);
  root.style.setProperty('--breathe-min-opacity', `${settings.breatheMinOpacity}`);
  root.style.setProperty('--breathe-period', `${settings.breathePeriodMs}ms`);
  if (settings.breathePeriodLowMs) {
    root.style.setProperty('--breathe-speed-low', `${settings.breathePeriodLowMs}ms`);
  }
  if (settings.breathePeriodHighMs) {
    root.style.setProperty('--breathe-speed-high', `${settings.breathePeriodHighMs}ms`);
  }

  root.style.setProperty('--card-width', `${dimensions.cardWidth}px`);
  root.style.setProperty('--card-height', `${dimensions.cardHeight}px`);
  root.style.setProperty('--card-radius', `${dimensions.cardCornerRadius}px`);
  root.style.setProperty('--card-top-padding', `${dimensions.cardTopPadding}px`);
  root.style.setProperty('--card-side-padding', `${dimensions.cardSidePadding}px`);

  root.style.setProperty('--frame-width', `${dimensions.frameOuterWidth}px`);
  root.style.setProperty('--frame-height', `${dimensions.frameOuterHeight}px`);
  root.style.setProperty('--frame-border', `${dimensions.frameLineWidth}px`);
  root.style.setProperty('--frame-gap', `${dimensions.frameInnerGap}px`);
  root.style.setProperty('--frame-radius', `${dimensions.frameCornerRadius}px`);

  // Divider positions inside inner bar
  root.style.setProperty('--gap-width', `${dimensions.segmentGap}px`);
  root.style.setProperty('--gap-1-left', `${dimensions.segmentWidth}px`);
  root.style.setProperty('--gap-2-left', `${dimensions.segmentWidth * 2 + dimensions.segmentGap}px`);
  root.style.setProperty('--gap-3-left', `${dimensions.segmentWidth * 3 + dimensions.segmentGap * 2}px`);

  // Text sizing (cap-height ~ 55 * u; for Public Sans cap-height is ~0.71 of font-size)
  const fontSize = Math.max(9, Math.round((55 * u) / 0.71));
  root.style.setProperty('--text-size', `${fontSize}px`);
  root.style.setProperty('--text-gap-top', `${dimensions.frameBottomToTextTop}px`);

  updateTextAlignment();
}

function updateTextAlignment() {
  if (!measureCtx || !currentDimensions) return;

  const root = document.documentElement;
  const fontSize = getComputedStyle(root).getPropertyValue('--text-size').trim() || '15px';
  measureCtx.font = `700 ${fontSize} "Public Sans", sans-serif`;

  const pText = percentLabel.textContent || '100%';
  const sText = statusLabel.textContent || 'Discharging';

  const pMetrics = measureCtx.measureText(pText);
  const sMetrics = measureCtx.measureText(sText);

  // Left ink edge alignment for percent text:
  // Ink starts at (anchorX - actualBoundingBoxLeft).
  // If anchor is nominally at 0 relative to text container, nudge = actualBoundingBoxLeft.
  const pAbbLeft = pMetrics.actualBoundingBoxLeft || 0;
  const percentNudge = pAbbLeft;

  // Right ink edge alignment for status text:
  // The status label is right-aligned in .text-row via flexbox.
  // sMetrics.width is the element's layout width; sAbbRight is the rightmost ink offset from origin.
  // The nudge to align the rightmost ink pixel with the right container edge is (width - actualBoundingBoxRight).
  const sWidth = sMetrics.width || 0;
  const sAbbRight = sMetrics.actualBoundingBoxRight || sWidth;
  const statusNudge = Math.max(-2, Math.min(2, sWidth - sAbbRight));

  root.style.setProperty('--percent-nudge', `${percentNudge.toFixed(2)}px`);
  root.style.setProperty('--status-nudge', `${statusNudge.toFixed(2)}px`);
}

function renderState(state) {
  if (!state) return;

  // Avoid unnecessary DOM updates if state hasn't changed
  if (
    lastRenderedState &&
    lastRenderedState.color === state.color &&
    lastRenderedState.breathing === state.breathing &&
    lastRenderedState.status === state.status &&
    lastRenderedState.percent === state.percent &&
    lastRenderedState.hasBattery === state.hasBattery
  ) {
    return;
  }

  lastRenderedState = state;

  // Handle desktop without battery
  if (state.hasBattery === false) {
    appContainer.classList.add('no-battery');
    return;
  }
  appContainer.classList.remove('no-battery');

  // Strip colour classes
  strip.classList.remove('color-black', 'color-green', 'color-red');
  strip.classList.add(`color-${state.color}`);

  if (state.color === 'black' && currentSettings && currentSettings.blackStripEdge === 'light') {
    strip.classList.add('edge-light');
  } else {
    strip.classList.remove('edge-light');
  }

  // Breathing state
  if (state.breathing) {
    strip.classList.add('breathing');
  } else {
    strip.classList.remove('breathing');
  }

  // 4 discrete segment fills (each covering 25%)
  const p = Math.max(0, Math.min(100, Number(state.percent) || 0));
  const s1 = document.getElementById('seg-1');
  const s2 = document.getElementById('seg-2');
  const s3 = document.getElementById('seg-3');
  const s4 = document.getElementById('seg-4');

  if (s1) s1.style.width = `${Math.max(0, Math.min(100, (p / 25) * 100))}%`;
  if (s2) s2.style.width = `${Math.max(0, Math.min(100, ((p - 25) / 25) * 100))}%`;
  if (s3) s3.style.width = `${Math.max(0, Math.min(100, ((p - 50) / 25) * 100))}%`;
  if (s4) s4.style.width = `${Math.max(0, Math.min(100, ((p - 75) / 25) * 100))}%`;

  // Text labels
  percentLabel.textContent = `${state.percent}%`;
  statusLabel.textContent = state.status;

  updateTextAlignment();
}

function setHover(hover) {
  if (hover) {
    card.classList.add('open');
    appContainer.classList.add('card-open');
  } else {
    card.classList.remove('open');
    appContainer.classList.remove('card-open');
  }
}

// Setup Chromium Battery Status API listener if available
function initBatteryAPI() {
  if (typeof navigator.getBattery === 'function' && window.voltlip) {
    navigator.getBattery().then((battery) => {
      const report = () => {
        window.voltlip.sendRendererBatteryEvent({
          level: battery.level,
          charging: battery.charging,
        });
      };
      report();
      battery.addEventListener('levelchange', report);
      battery.addEventListener('chargingchange', report);
    }).catch((_err) => {
      // Browser Battery Status API not supported or blocked
    });
  }
}

// Initialize DOM and state immediately for instant startup
async function init() {
  if (window.voltlip) {
    // Register event listeners
    window.voltlip.onStateUpdate((state) => {
      renderState(state);
    });

    window.voltlip.onHoverUpdate(({ hover }) => {
      setHover(hover);
    });

    window.voltlip.onSettingsUpdate(({ settings, dimensions }) => {
      currentSettings = settings;
      currentDimensions = dimensions;
      applyDimensionsCSS(dimensions, settings);
      if (lastRenderedState) {
        renderState(lastRenderedState);
      }
    });

    // Request initial state from main process immediately for instant strip appearance
    try {
      const initial = await window.voltlip.getInitialState();
      currentSettings = initial.settings;
      currentDimensions = initial.dimensions;

      if (initial.isDebug) {
        document.body.classList.add('debug-mode');
      }

      applyDimensionsCSS(currentDimensions, currentSettings);
      renderState(initial.state);
      setHover(initial.hover);
    } catch (_err) {
      // Main process handle error
    }

    initBatteryAPI();
  }

  // Refine text alignment once fonts are fully ready
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      updateTextAlignment();
    }).catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
