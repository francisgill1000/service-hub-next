
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getLeads: (filter) => ipcRenderer.invoke('leads:list', filter),
  importCSV: () => ipcRenderer.invoke('leads:import'),
  openWA: (data) => ipcRenderer.send('leads:open-whatsapp', data),
  getTodayCount: () => ipcRenderer.invoke('stats:today'),
  getTotalCount: () => ipcRenderer.invoke('leads:total-count'), // ADD THIS
  updateStatus: (data) => ipcRenderer.invoke('leads:update-status', data)
});