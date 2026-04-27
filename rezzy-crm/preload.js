
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getLeads: (filter) => ipcRenderer.invoke('leads:list', filter),
  importCSV: () => ipcRenderer.invoke('leads:import'),
  openWA: (data) => ipcRenderer.send('leads:open-whatsapp', data),
  getTodayCount: () => ipcRenderer.invoke('stats:today'),
  getTotalCount: () => ipcRenderer.invoke('leads:total-count'),
  updateStatus: (data) => ipcRenderer.invoke('leads:update-status', data),
  createLead: (data) => ipcRenderer.invoke('leads:create', data),
  openUrl: (url) => ipcRenderer.invoke('app:open-url', url),
  downloadSampleCsv: () => ipcRenderer.invoke('leads:download-sample'),
  getTemplate: () => ipcRenderer.invoke('template:get'),
  saveTemplate: (body) => ipcRenderer.invoke('template:save', body),
});