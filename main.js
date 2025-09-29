const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Security: Disable Node.js integration in renderer process
const isDev = process.env.NODE_ENV === 'development';

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0b1220',
    icon: getAppIcon(),
    show: false, // Don't show until ready
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      nodeIntegration: false, // Security: Disable node integration
      contextIsolation: true, // Security: Enable context isolation
      enableRemoteModule: false, // Security: Disable remote module
      preload: path.join(__dirname, 'src', 'preload.js'),
      // Security: Restrict what the renderer can access
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    }
  });

  // Load the app
  const indexPath = path.join(__dirname, 'app', 'index.html');
  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    // Fallback to root directory
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Focus the window on creation
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Security: Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Open external links in default browser
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Security: Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // Allow file:// protocol for local files
    if (parsedUrl.protocol !== 'file:') {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  // Handle uncaught exceptions in renderer
  mainWindow.webContents.on('crashed', () => {
    const options = {
      type: 'error',
      title: 'Application Crashed',
      message: 'Workout app has crashed. Would you like to restart?',
      buttons: ['Restart', 'Close']
    };

    dialog.showMessageBox(options).then((response) => {
      if (response.response === 0) {
        app.relaunch();
        app.exit();
      } else {
        app.quit();
      }
    });
  });

  return mainWindow;
}

// Persistent storage handlers (JSON file in userData)
// Persistent storage handlers - prefer project root (workout-app/workout-data.json)
// For compatibility, if a file exists in the old userData location, copy it to the project root on first load.
function storageFilePath() {
  return path.join(__dirname, 'workout-data.json');
}

function legacyStorageFilePath() {
  return path.join(app.getPath('userData'), 'workout-data.json');
}

ipcMain.handle('workout-storage-load', async () => {
  const p = storageFilePath();
  const legacy = legacyStorageFilePath();
  try {
    // If project file exists, use it
    if (fs.existsSync(p)) {
      const raw = await fs.promises.readFile(p, 'utf8');
      return JSON.parse(raw || 'null');
    }

    // Otherwise, if a legacy userData file exists, copy it into project root and return it
    if (fs.existsSync(legacy)) {
      try {
        const raw = await fs.promises.readFile(legacy, 'utf8');
        // ensure project directory is writable
        await fs.promises.writeFile(p, raw, 'utf8');
        return JSON.parse(raw || 'null');
      } catch (inner) {
        console.error('failed to migrate legacy storage', inner);
      }
    }

    // No file found
    return null;
  } catch (e) {
    console.error('storage load error', e);
    return null;
  }
});

ipcMain.handle('workout-storage-save', async (event, data) => {
  const p = storageFilePath();
  try {
    // project root is a file path; ensure directory exists (should already)
    await fs.promises.mkdir(path.dirname(p), { recursive: true });
    await fs.promises.writeFile(p, JSON.stringify(data, null, 2), 'utf8');
    return { ok: true };
  } catch (e) {
    console.error('storage save error', e);
    return { ok: false, error: String(e) };
  }
});

ipcMain.handle('workout-storage-reset', async () => {
  const p = storageFilePath();
  const legacy = legacyStorageFilePath();
  try {
    if (fs.existsSync(p)) await fs.promises.unlink(p);
    // also try removing legacy file if present
    if (fs.existsSync(legacy)) await fs.promises.unlink(legacy);
    return { ok: true };
  } catch (e) {
    console.error('storage reset error', e);
    return { ok: false, error: String(e) };
  }
});

function getAppIcon() {
  // Return an existing icon file if available, otherwise fall back to trainer.svg
  // Prefer platform-specific formats (.ico for Windows, .icns for macOS),
  // then PNG, then the bundled trainer.svg.
  try {
    const assetsDir = path.join(__dirname, 'src', 'assets');
    const exDir = path.join(assetsDir, 'exercises');
    const winCandidates = [path.join(exDir, 'icon.ico'), path.join(exDir, 'icon.png'), path.join(assetsDir, 'trainer.svg')];
    const darwinCandidates = [path.join(exDir, 'icon.icns'), path.join(exDir, 'icon.png'), path.join(assetsDir, 'trainer.svg')];
    const otherCandidates = [path.join(exDir, 'icon.png'), path.join(assetsDir, 'trainer.svg')];

    const candidates = process.platform === 'win32' ? winCandidates : process.platform === 'darwin' ? darwinCandidates : otherCandidates;
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  } catch (e) {
    // ignore and fall through to default
  }

  // Default fallback (relative to project root)
  return path.join(__dirname, 'src', 'assets', 'trainer.svg');
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Data',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('export-data');
          }
        },
        {
          label: 'Import Data',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.send('import-data');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Workout',
      submenu: [
        {
          label: 'Today\'s Workout',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'today');
          }
        },
        {
          label: 'Schedule',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'schedule');
          }
        },
        {
          label: 'Goals & Progress',
          accelerator: 'CmdOrCtrl+G',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'goals');
          }
        },
        { type: 'separator' },
        {
          label: 'Reset All Data',
          click: () => {
            const options = {
              type: 'warning',
              title: 'Reset All Data',
              message: 'Are you sure you want to reset all workout data? This cannot be undone.',
              buttons: ['Cancel', 'Reset'],
              defaultId: 0,
              cancelId: 0
            };

            dialog.showMessageBox(mainWindow, options).then((response) => {
              if (response.response === 1) {
                mainWindow.webContents.send('reset-data');
              }
            });
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Workout App',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Workout App',
              message: 'Workout App v1.3.0',
              detail: 'Muscle building workout app designed for age 50+ with progressive overload, TRX exercises, and dumbbell training.\n\nBuilt with Electron and vanilla JavaScript.',
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Keyboard Shortcuts',
              message: 'Workout App Keyboard Shortcuts',
              detail: 'Ctrl/Cmd + T: Today\'s Workout\nCtrl/Cmd + S: Schedule\nCtrl/Cmd + G: Goals & Progress\nCtrl/Cmd + E: Export Data\nCtrl/Cmd + I: Import Data\nF11: Toggle Fullscreen\nF12: Toggle DevTools',
              buttons: ['OK']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/GaiNingMorris/workout-app/issues');
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[5].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createMenu();

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // macOS: Keep app running even when all windows are closed
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }
  app.quit();
});

// Security: Prevent protocol handler hijacking
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // In development, ignore certificate errors
  if (isDev) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Handle app updates (placeholder for future implementation)
if (!isDev) {
  // Auto-updater logic could go here
  console.log('Production mode - auto-updater would be initialized here');
}

// Export for testing purposes
module.exports = { createWindow, app };