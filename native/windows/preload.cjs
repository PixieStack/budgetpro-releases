const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('budgetProNative', {
  getInfo: () => ipcRenderer.invoke('native:getInfo'),
  checkForUpdates: () => ipcRenderer.invoke('native:checkForUpdates'),
  installUpdate: (options = {}) => ipcRenderer.invoke('native:installUpdate', options),
})
