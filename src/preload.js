// Securely expose NeDB API to the renderer without enabling full Node.js access.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('os', {
    platform: process.platform
});

// Expose NeDB database API
contextBridge.exposeInMainWorld('db', {
    // Find documents
    find: async (collection, query, options) => {
        return await ipcRenderer.invoke('db-find', collection, query, options);
    },
    
    // Find one document
    findOne: async (collection, query) => {
        return await ipcRenderer.invoke('db-findOne', collection, query);
    },
    
    // Insert document(s)
    insert: async (collection, doc) => {
        return await ipcRenderer.invoke('db-insert', collection, doc);
    },
    
    // Update document(s)
    update: async (collection, query, update, options) => {
        return await ipcRenderer.invoke('db-update', collection, query, update, options);
    },
    
    // Remove document(s)
    remove: async (collection, query, options) => {
        return await ipcRenderer.invoke('db-remove', collection, query, options);
    },
    
    // Count documents
    count: async (collection, query) => {
        return await ipcRenderer.invoke('db-count', collection, query);
    },
    
    // Migration helper
    migrateFromJSON: async () => {
        return await ipcRenderer.invoke('migrate-from-json');
    }
});