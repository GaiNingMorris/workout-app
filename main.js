const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const Datastore = require('nedb');

// Security: Disable Node.js integration in renderer process
const isDev = process.env.NODE_ENV === 'development';

// Keep a global reference of the window object
let mainWindow;

// NeDB databases
let databases = {};

function initDatabases() {
  const dbPath = path.join(__dirname, 'workout-data');
  
  // Ensure workout-data directory exists
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  databases = {
    exercises: new Datastore({ filename: path.join(dbPath, 'exercises.db'), autoload: true }),
    workouts: new Datastore({ filename: path.join(dbPath, 'workouts.db'), autoload: true }),
    loads: new Datastore({ filename: path.join(dbPath, 'loads.db'), autoload: true }),
    progressions: new Datastore({ filename: path.join(dbPath, 'progressions.db'), autoload: true }),
    user: new Datastore({ filename: path.join(dbPath, 'user.db'), autoload: true }),
    settings: new Datastore({ filename: path.join(dbPath, 'settings.db'), autoload: true }),
    nutrition: new Datastore({ filename: path.join(dbPath, 'nutrition.db'), autoload: true })
  };

  // Performance: Add database indexes for faster queries
  setTimeout(() => {
    // Index workouts by date for faster date-based queries
    databases.workouts.ensureIndex({ fieldName: 'date' });
    
    // Index nutrition entries by time for faster daily nutrition queries
    databases.nutrition.ensureIndex({ fieldName: 'time' });
    
    // Index loads by exerciseId for faster exercise lookup
    databases.loads.ensureIndex({ fieldName: 'exerciseId' });
    
    // Index progressions by exerciseId for faster progression lookup
    databases.progressions.ensureIndex({ fieldName: 'exerciseId' });
    
    console.log('Database indexes created for performance');
  }, 100);

  console.log('NeDB databases initialized');
}

function createWindow() {
  // Create the browser window with performance optimizations
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0b1220',
    icon: getAppIcon(),
    show: false, // Don't show until ready - prevents flash
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      nodeIntegration: false, // Security: Disable node integration
      contextIsolation: true, // Security: Enable context isolation
      enableRemoteModule: false, // Security: Disable remote module
      backgroundThrottling: false, // Performance: Prevent throttling when window is in background
      offscreen: false, // Performance: Use GPU acceleration
      preload: path.join(__dirname, 'src', 'preload.js'),
      // Security: Restrict what the renderer can access
      allowRunningInsecureContent: false,
      experimentalFeatures: true // Performance: Enable experimental web features
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

// NeDB IPC Handlers

// Generic query handler
ipcMain.handle('db-find', async (event, collection, query, options) => {
  return new Promise((resolve, reject) => {
    const db = databases[collection];
    if (!db) {
      reject(new Error(`Collection ${collection} not found`));
      return;
    }
    
    let cursor = db.find(query || {});
    if (options?.sort) cursor = cursor.sort(options.sort);
    if (options?.limit) cursor = cursor.limit(options.limit);
    if (options?.skip) cursor = cursor.skip(options.skip);
    
    cursor.exec((err, docs) => {
      if (err) reject(err);
      else resolve(docs);
    });
  });
});

// Find one document
ipcMain.handle('db-findOne', async (event, collection, query) => {
  return new Promise((resolve, reject) => {
    const db = databases[collection];
    if (!db) {
      reject(new Error(`Collection ${collection} not found`));
      return;
    }
    db.findOne(query || {}, (err, doc) => {
      if (err) reject(err);
      else resolve(doc);
    });
  });
});

// Insert document(s)
ipcMain.handle('db-insert', async (event, collection, doc) => {
  return new Promise((resolve, reject) => {
    const db = databases[collection];
    if (!db) {
      reject(new Error(`Collection ${collection} not found`));
      return;
    }
    db.insert(doc, (err, newDoc) => {
      if (err) reject(err);
      else resolve(newDoc);
    });
  });
});

// Update document(s)
ipcMain.handle('db-update', async (event, collection, query, update, options) => {
  return new Promise((resolve, reject) => {
    const db = databases[collection];
    if (!db) {
      reject(new Error(`Collection ${collection} not found`));
      return;
    }
    db.update(query, update, options || {}, (err, numAffected) => {
      if (err) reject(err);
      else resolve(numAffected);
    });
  });
});

// Remove document(s)
ipcMain.handle('db-remove', async (event, collection, query, options) => {
  return new Promise((resolve, reject) => {
    const db = databases[collection];
    if (!db) {
      reject(new Error(`Collection ${collection} not found`));
      return;
    }
    db.remove(query, options || {}, (err, numRemoved) => {
      if (err) reject(err);
      else resolve(numRemoved);
    });
  });
});

// Count documents
ipcMain.handle('db-count', async (event, collection, query) => {
  return new Promise((resolve, reject) => {
    const db = databases[collection];
    if (!db) {
      reject(new Error(`Collection ${collection} not found`));
      return;
    }
    db.count(query || {}, (err, count) => {
      if (err) reject(err);
      else resolve(count);
    });
  });
});

// Legacy JSON migration handler
ipcMain.handle('migrate-from-json', async () => {
  try {
    const jsonPath = path.join(__dirname, 'workout-data.json');
    
    // Check if old JSON file exists
    if (!fs.existsSync(jsonPath)) {
      return { success: true, message: 'No migration needed - JSON file not found' };
    }

    // Read old data
    const oldData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Check if already migrated (user collection should be empty if fresh)
    const userCount = await new Promise((resolve) => {
      databases.user.count({}, (err, count) => resolve(count || 0));
    });
    
    if (userCount > 0) {
      return { success: true, message: 'Already migrated' };
    }

    console.log('Starting migration from JSON to NeDB...');

    // Migrate user profile
    await new Promise((resolve, reject) => {
      databases.user.insert({
        _id: 'user_profile',
        startDate: oldData.logs && oldData.logs[0] ? oldData.logs[0].date : new Date().toISOString(),
        currentWeight: oldData.weights && oldData.weights.length > 0 ? 
          oldData.weights[oldData.weights.length - 1].weight : 262.4, // TODO: Use USER_CONFIG when available
        targetWeight: oldData.goals?.targetWeight || 165,
        height: 71,
        age: 52,
        bodyweightHistory: oldData.weights || [],
        bestHangTime: oldData.goals?.hangBestSec || 0,
        unlocksAchieved: []
      }, (err) => err ? reject(err) : resolve());
    });

    // Migrate settings
    await new Promise((resolve, reject) => {
      databases.settings.insert({
        _id: 'app_settings',
        restTimerStrength: oldData.settings?.restGood || 120,
        restTimerEasy: oldData.settings?.restEasy || 90,
        enableMicroloading: true,
        audioAlerts: false,
        darkMode: true,
        programStartDate: oldData.logs && oldData.logs[0] ? oldData.logs[0].date : new Date().toISOString(),
        lastDeloadDate: null,
        deloadInterval: 8
      }, (err) => err ? reject(err) : resolve());
    });

    // Migrate loads
    if (oldData.loads) {
      for (const [exerciseName, weight] of Object.entries(oldData.loads)) {
        await new Promise((resolve, reject) => {
          databases.loads.insert({
            exerciseId: exerciseName,
            currentWeight: weight,
            lastIncreaseDate: new Date().toISOString(),
            failStreak: oldData.streaks?.fails?.[exerciseName] || 0,
            history: []
          }, (err) => err ? reject(err) : resolve());
        });
      }
    }

    // Migrate workout logs
    if (oldData.logs) {
      for (const log of oldData.logs) {
        await new Promise((resolve, reject) => {
          databases.workouts.insert({
            date: log.date,
            template: log.mode,
            isDeloadWeek: false,
            exercises: log.items.map(item => ({
              exerciseId: item.ex,
              completedSets: [{
                reps: item.reps,
                weight: item.weight,
                struggled: item.fail || false,
                timestamp: log.date
              }]
            })),
            startTime: log.date,
            endTime: log.date,
            notes: ''
          }, (err) => err ? reject(err) : resolve());
        });
      }
    }

    // Backup old JSON
    const backupPath = path.join(__dirname, 'workout-data.json.backup');
    fs.renameSync(jsonPath, backupPath);

    console.log('Migration complete!');
    return { success: true, message: 'Migration successful' };

  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error: error.message };
  }
});

function getAppIcon() {
  // Return an existing icon file if available, otherwise fall back to trainer.svg
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
              message: 'Workout App v2.0.0',
              detail: 'Muscle building workout app designed for age 50+ with 4-day split, progressive overload, TRX exercises, and dumbbell training.\n\nBuilt with Electron and vanilla JavaScript.',
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
  initDatabases();
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