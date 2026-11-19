const { ipcMain } = require('electron');

const CHANNELS = {
  GET_INITIAL_STATE: 'voltlip:get-initial-state',
  BATTERY_RENDERER_EVENT: 'voltlip:battery-renderer-event',
  STATE_UPDATE: 'voltlip:state-update',
  HOVER_UPDATE: 'voltlip:hover-update',
  SETTINGS_UPDATE: 'voltlip:settings-update',
};

function setupIPC(options = {}) {
  const { _overlayWindow, batteryProvider, getAppState, logger } = options;

  ipcMain.handle(CHANNELS.GET_INITIAL_STATE, async () => {
    try {
      if (getAppState) {
        return getAppState();
      }
      return {};
    } catch (err) {
      if (logger) logger.error('Error handling GET_INITIAL_STATE', err.message);
      return {};
    }
  });

  ipcMain.on(CHANNELS.BATTERY_RENDERER_EVENT, (_event, data) => {
    try {
      if (batteryProvider && typeof batteryProvider.handleRendererBatteryEvent === 'function') {
        batteryProvider.handleRendererBatteryEvent(data);
      }
    } catch (err) {
      if (logger) logger.error('Error handling BATTERY_RENDERER_EVENT', err.message);
    }
  });
}

function cleanIPC() {
  ipcMain.removeHandler(CHANNELS.GET_INITIAL_STATE);
  ipcMain.removeAllListeners(CHANNELS.BATTERY_RENDERER_EVENT);
}

module.exports = {
  CHANNELS,
  setupIPC,
  cleanIPC,
};
