// Securely expose a minimal API to the renderer without enabling full Node.js access.
// Use contextBridge.exposeInMainWorld so the renderer can read the platform if needed.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('os', {
    platform: process.platform
});

// Expose a small storage API that uses the main process file storage
contextBridge.exposeInMainWorld('workoutStorage', {
    load: async () => {
        return await ipcRenderer.invoke('workout-storage-load');
    },
    save: async (data) => {
        return await ipcRenderer.invoke('workout-storage-save', data);
    },
    reset: async () => {
        return await ipcRenderer.invoke('workout-storage-reset');
    }
});