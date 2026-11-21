const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { app, screen, powerMonitor } = require('electron');

app.setName('Voltlip');

const Logger = require('./logger');
const OverlayWindow = require('./window');
const AppTray = require('./tray');
const CursorPoller = require('./cursor');
const { setupIPC, cleanIPC } = require('./ipc');
const SystemBatteryProvider = require('./battery/system-provider');
const { MockBatteryProvider } = require('./battery/mock-provider');
const { computeBatteryState } = require('../core/state');
const {
  getDefaultSettings,
  parseSettings,
  serializeSettings,
} = require('../core/settings');

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Global crash handlers
let logger = null;
process.on('uncaughtException', (err) => {
  if (logger) logger.error('Uncaught Exception:', err.stack || err.message);
  else console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  const detail = reason && (reason.stack || reason.message) ? (reason.stack || reason.message) : reason;
  if (logger) logger.error('Unhandled Rejection:', detail);
  else console.error('Unhandled Rejection:', detail);
});

// Parse command line arguments
const args = process.argv.slice(1);
const isDebug = args.includes('--ui-debug');
const isDemo = args.includes('--demo') || args.some((a) => a.startsWith('--mock'));
const isFresh = args.includes('--fresh');

let mockScenarioArg = null;
const mockIndex = args.indexOf('--mock');
if (mockIndex !== -1 && args[mockIndex + 1]) {
  mockScenarioArg = args[mockIndex + 1];
} else {
  const directMock = args.find((a) => a.startsWith('--mock='));
  if (directMock) {
    mockScenarioArg = directMock.split('=')[1];
  }
}

let settings = null;
let settingsPath = null;
let overlayWindow = null;
let batteryProvider = null;
let cursorPoller = null;
let appTray = null;
let currentComputedState = null;
let settingsWatcher = null;

function loadSettings(userDataDir) {
  settingsPath = path.join(userDataDir, 'settings.json');
  if (isFresh && fs.existsSync(settingsPath)) {
    try {
      fs.unlinkSync(settingsPath);
    } catch (_err) {
      // Ignore
    }
  }

  if (fs.existsSync(settingsPath)) {
    try {
      const raw = fs.readFileSync(settingsPath, 'utf8');
      settings = parseSettings(raw);
      // Always start active (unpaused) on launch
      settings.paused = false;
      // Ensure all settings keys exist in the file so the user can easily discover and edit them
      const updatedJson = serializeSettings(settings);
      if (updatedJson !== raw.trim()) {
        try {
          fs.writeFileSync(settingsPath, updatedJson, 'utf8');
        } catch (_err) {
          // Best effort
        }
      }
    } catch (_err) {
      settings = getDefaultSettings();
      settings.paused = false;
    }
  } else {
    settings = getDefaultSettings();
    settings.paused = false;
    try {
      fs.writeFileSync(settingsPath, serializeSettings(settings), 'utf8');
    } catch (_err) {
      // Ignore
    }
  }
}

function saveSettings() {
  if (!settingsPath || !settings) return;
  try {
    fs.writeFileSync(settingsPath, serializeSettings(settings), 'utf8');
  } catch (err) {
    if (logger) logger.error('Failed to save settings:', err.message);
  }
}

function reloadSettings() {
  if (fs.existsSync(settingsPath)) {
    try {
      const raw = fs.readFileSync(settingsPath, 'utf8');
      settings = parseSettings(raw);
      if (logger) logger.info('Settings reloaded from disk');
    } catch (err) {
      if (logger) logger.error('Error reloading settings:', err.message);
    }
  }

  if (cursorPoller) {
    cursorPoller.setPaused(Boolean(settings && settings.paused));
  }
  if (appTray) {
    appTray.setPaused(Boolean(settings && settings.paused));
  }
  if (overlayWindow) {
    overlayWindow.applySettings(settings);
  }

  // Recalculate state with new thresholds if changed
  if (batteryProvider) {
    handleBatteryChange(batteryProvider.getSnapshot());
  }
}

function cleanupLegacyAutoStartKeys() {
  if (process.platform !== 'win32') return;
  try {
    exec('reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "electron.app.Electron" /f', () => {});
  } catch (_e) {
    // Ignore
  }
}

function setAutoStart(enable) {
  try {
    const isPackaged = app.isPackaged;
    const execPath = process.execPath;
    const appPath = app.getAppPath();
    const args = isPackaged ? [] : [appPath];

    app.setLoginItemSettings({
      openAtLogin: enable,
      path: execPath,
      args,
    });
    if (logger) logger.info('setLoginItemSettings updated', { openAtLogin: enable, execPath, args });
  } catch (err) {
    if (logger) logger.error('Failed to set login item settings:', err.message);
  }

  cleanupLegacyAutoStartKeys();
}

function handleBatteryChange(snapshot) {
  if (!settings) return;

  const newState = computeBatteryState(snapshot, currentComputedState, {
    lowThreshold: settings.lowThreshold,
    criticalThreshold: settings.criticalThreshold,
    highThreshold: settings.highThreshold,
  });

  currentComputedState = newState;

  if (overlayWindow) {
    overlayWindow.sendStateUpdate(newState);
  }

  // Update tray
  let statusLine;
  let tooltipLine;

  if (!newState.hasBattery) {
    statusLine = 'No battery detected';
    tooltipLine = 'Voltlip: No battery detected';
  } else if (snapshot.source === 'mock' && snapshot.scenarioName) {
    statusLine = `Battery ${newState.percent}%, ${newState.status}`;
    tooltipLine = `Voltlip: ${snapshot.scenarioName}`;
  } else {
    statusLine = `Battery ${newState.percent}%, ${newState.status}`;
    tooltipLine = `Voltlip: Battery ${newState.percent}%, ${newState.status}`;
  }

  if (appTray) {
    appTray.updateStatus(statusLine, tooltipLine);
  }
}

function getAppState() {
  return {
    state: currentComputedState,
    settings,
    dimensions: overlayWindow ? overlayWindow.dimensions : null,
    stripRect: overlayWindow ? overlayWindow.stripRect : null,
    panelRect: overlayWindow ? overlayWindow.panelRect : null,
    hover: cursorPoller ? cursorPoller.isHovering : false,
    isDebug,
  };
}

app.whenReady().then(() => {
  const userDataDir = app.getPath('userData');
  logger = new Logger(userDataDir);
  logger.info('Voltlip starting', { isDebug, isDemo, mockScenarioArg });

  loadSettings(userDataDir);

  cleanupLegacyAutoStartKeys();
  if (settings.startWithSystem) {
    setAutoStart(true);
  }

  // Auto-reload settings when user saves settings.json file
  try {
    let watchDebounce = null;
    settingsWatcher = fs.watch(settingsPath, (eventType) => {
      if (eventType === 'change') {
        clearTimeout(watchDebounce);
        watchDebounce = setTimeout(() => {
          reloadSettings();
        }, 150);
      }
    });
  } catch (_err) {
    // Best effort file watch
  }

  // Initialize battery provider
  if (isDemo || mockScenarioArg) {
    batteryProvider = new MockBatteryProvider({
      pinnedScenario: mockScenarioArg,
    });
  } else {
    batteryProvider = new SystemBatteryProvider({
      powerMonitor,
      logger,
    });
  }

  batteryProvider.on('change', handleBatteryChange);

  // Initial calculation
  handleBatteryChange(batteryProvider.getSnapshot());

  // Setup IPC BEFORE creating window so handlers are ready when renderer loads
  setupIPC({
    batteryProvider,
    getAppState,
    logger,
  });

  // Initialize overlay window
  overlayWindow = new OverlayWindow({
    screen,
    settings,
    isDebug,
    logger,
  });
  overlayWindow.create();

  // Initialize cursor poller
  cursorPoller = new CursorPoller({
    screen,
    getStripRect: () => overlayWindow.stripRect,
    getPanelRect: () => overlayWindow.panelRect,
    getDisplay: () => overlayWindow.display,
    onHoverChange: (hover) => {
      if (overlayWindow) {
        overlayWindow.sendHoverUpdate(hover);
      }
    },
    logger,
  });

  if (settings.paused) {
    cursorPoller.setPaused(true);
  } else {
    cursorPoller.start();
  }

  // Setup Tray
  appTray = new AppTray({
    settings,
    settingsPath,
    isDemo,
    isDebug,
    mockProvider: isDemo ? batteryProvider : null,
    onTogglePause: (paused) => {
      settings.paused = paused;
      saveSettings();
      if (cursorPoller) cursorPoller.setPaused(paused);
      if (appTray) appTray.setPaused(paused);
      if (overlayWindow) overlayWindow.applySettings(settings);
    },
    onReloadSettings: reloadSettings,
    onToggleTheme: (newTheme) => {
      settings.theme = newTheme;
      saveSettings();
      if (overlayWindow) overlayWindow.applySettings(settings);
      if (appTray) {
        appTray.options.settings = settings;
        appTray.renderMenu();
      }
    },
    onToggleAutoStart: (enable) => {
      settings.startWithSystem = enable;
      saveSettings();
      setAutoStart(enable);
    },
    onScenarioSelect: (scenario) => {
      if (batteryProvider && typeof batteryProvider.setPinnedScenario === 'function') {
        batteryProvider.setPinnedScenario(scenario);
      }
    },
  });

  // Re-sync initial status to tray
  handleBatteryChange(batteryProvider.getSnapshot());
});

app.on('window-all-closed', (e) => {
  // Prevent quitting when window closes (runs in tray background)
  e.preventDefault();
});

app.on('before-quit', () => {
  cleanIPC();
  if (settingsWatcher) {
    try {
      settingsWatcher.close();
    } catch (_err) {
      // Ignore
    }
  }
  if (cursorPoller) cursorPoller.destroy();
  if (batteryProvider) batteryProvider.destroy();
  if (overlayWindow) overlayWindow.destroy();
  if (appTray) appTray.destroy();
});
