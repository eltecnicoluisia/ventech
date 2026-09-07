const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ventechDesktop', {
  testConnection: (url) => ipcRenderer.invoke('test-connection', url),
  saveServer: (url) => ipcRenderer.invoke('save-server', url),
  getConfig: () => ipcRenderer.invoke('get-config'),
});
