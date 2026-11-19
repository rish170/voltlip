const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('voltlip', {
  getInitialState: () => ipcRenderer.invoke('voltlip:get-initial-state'),
  onStateUpdate: (callback) => {
    const handler = (_event, state) => callback(state);
    ipcRenderer.on('voltlip:state-update', handler);
    return () => ipcRenderer.removeListener('voltlip:state-update', handler);
  },
  onHoverUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('voltlip:hover-update', handler);
    return () => ipcRenderer.removeListener('voltlip:hover-update', handler);
  },
  onSettingsUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('voltlip:settings-update', handler);
    return () => ipcRenderer.removeListener('voltlip:settings-update', handler);
  },
  sendRendererBatteryEvent: (data) => {
    ipcRenderer.send('voltlip:battery-renderer-event', data);
  },
});
