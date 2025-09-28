// Securely expose a minimal API to the renderer without enabling full Node.js access.
// Use contextBridge.exposeInMainWorld so the renderer can read the platform if needed.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('os', {
    platform: process.platform
});