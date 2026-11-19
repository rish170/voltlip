const path = require('path');
const { BrowserWindow } = require('electron');
const {
  computeDimensions,
  getStripRect,
  getPanelRect,
} = require('../core/geometry');

class OverlayWindow {
  constructor(options = {}) {
    this.screen = options.screen;
    this.settings = options.settings;
    this.isDebug = Boolean(options.isDebug);
    this.logger = options.logger;

    this.win = null;
    this.display = null;
    this.stripRect = null;
    this.panelRect = null;
    this.dimensions = null;
    this.topmostTimer = null;

    this.updateGeometry();
  }

  updateGeometry() {
    if (!this.screen) return;
    this.display = this.screen.getPrimaryDisplay().bounds;
    this.dimensions = computeDimensions(this.settings.panelFrameWidth);

    this.stripRect = getStripRect({
      display: this.display,
      stripLength: this.settings.stripLength,
      stripThickness: this.settings.stripThickness,
      stripAlign: this.settings.stripAlign,
      stripOffsetX: this.settings.stripOffsetX,
    });

    this.panelRect = getPanelRect({
      display: this.display,
      cardWidth: Math.round(this.dimensions.cardWidth),
      cardHeight: Math.round(this.dimensions.cardHeight),
      stripAlign: this.settings.stripAlign,
      stripOffsetX: this.settings.stripOffsetX,
    });
  }

  create() {
    this.updateGeometry();

    // The window bounds must contain both the hover card and the idle strip
    const winWidth = Math.max(this.panelRect.width, this.stripRect.width);
    const winHeight = Math.max(this.panelRect.height, this.stripRect.height);
    const winX = this.panelRect.x;
    const winY = this.panelRect.y;

    this.win = new BrowserWindow({
      x: winX,
      y: winY,
      width: winWidth,
      height: winHeight,
      transparent: true,
      frame: false,
      resizable: false,
      movable: false,
      hasShadow: false,
      skipTaskbar: true,
      focusable: false,
      alwaysOnTop: true,
      type: process.platform === 'win32' ? 'toolbar' : 'normal',
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        preload: path.join(__dirname, '../preload/preload.js'),
        backgroundThrottling: false,
      },
    });

    // Window configuration
    this.assertAlwaysOnTop();
    this.win.setIgnoreMouseEvents(true);

    try {
      if (typeof this.win.setVisibleOnAllWorkspaces === 'function') {
        this.win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      }
    } catch (_err) {
      // Best-effort for macOS/Linux
    }

    const htmlPath = path.join(__dirname, '../renderer/index.html');
    this.win.loadFile(htmlPath).catch((err) => {
      if (this.logger) this.logger.error('Failed to load renderer HTML:', err.stack || err.message);
    });

    this.win.once('ready-to-show', () => {
      if (this.win && !this.win.isDestroyed()) {
        this.win.showInactive();
        this.assertAlwaysOnTop();
      }
    });

    this.win.on('blur', () => {
      this.assertAlwaysOnTop();
    });

    // Heartbeat to guarantee window stays above full-screen and newly focused apps
    this.topmostTimer = setInterval(() => {
      this.assertAlwaysOnTop();
    }, 1000);

    if (process.argv.includes('--devtools')) {
      this.win.webContents.openDevTools({ mode: 'detach' });
    }

    this.bindDisplayEvents();
  }

  assertAlwaysOnTop() {
    if (!this.win || this.win.isDestroyed()) return;
    try {
      this.win.setAlwaysOnTop(true, 'screen-saver');
    } catch (_err) {
      try {
        this.win.setAlwaysOnTop(true);
      } catch (_e) {
        // Ignore
      }
    }
    try {
      this.win.moveTop();
    } catch (_err) {
      // Ignore
    }
  }

  bindDisplayEvents() {
    if (!this.screen) return;

    const onDisplayChange = () => {
      if (!this.win || this.win.isDestroyed()) return;
      this.updateGeometry();

      const winWidth = Math.max(this.panelRect.width, this.stripRect.width);
      const winHeight = Math.max(this.panelRect.height, this.stripRect.height);

      this.win.setBounds({
        x: this.panelRect.x,
        y: this.panelRect.y,
        width: winWidth,
        height: winHeight,
      });

      this.assertAlwaysOnTop();
      this.sendSettingsUpdate();
    };

    this.screen.on('display-metrics-changed', onDisplayChange);
    this.screen.on('display-added', onDisplayChange);
    this.screen.on('display-removed', onDisplayChange);
  }

  applySettings(newSettings) {
    this.settings = newSettings;
    this.updateGeometry();

    if (this.win && !this.win.isDestroyed()) {
      const winWidth = Math.max(this.panelRect.width, this.stripRect.width);
      const winHeight = Math.max(this.panelRect.height, this.stripRect.height);

      this.win.setBounds({
        x: this.panelRect.x,
        y: this.panelRect.y,
        width: winWidth,
        height: winHeight,
      });

      this.assertAlwaysOnTop();
      this.sendSettingsUpdate();
    }
  }

  sendSettingsUpdate() {
    if (this.win && !this.win.isDestroyed()) {
      this.win.webContents.send('voltlip:settings-update', {
        settings: this.settings,
        dimensions: this.dimensions,
        stripRect: this.stripRect,
        panelRect: this.panelRect,
      });
    }
  }

  sendStateUpdate(state) {
    if (this.win && !this.win.isDestroyed()) {
      this.win.webContents.send('voltlip:state-update', state);
    }
  }

  sendHoverUpdate(hover) {
    if (this.win && !this.win.isDestroyed()) {
      if (hover) {
        this.assertAlwaysOnTop();
      }
      this.win.webContents.send('voltlip:hover-update', { hover });
    }
  }

  destroy() {
    if (this.topmostTimer) {
      clearInterval(this.topmostTimer);
      this.topmostTimer = null;
    }
    if (this.win && !this.win.isDestroyed()) {
      this.win.close();
      this.win = null;
    }
  }
}

module.exports = OverlayWindow;
