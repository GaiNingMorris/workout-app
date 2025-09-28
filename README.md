# Workout app

Workout app is a small desktop workout app focused on progressive overload for older adults (50+). It's built with Electron and vanilla JavaScript and provides a simple checklist UI, exercise demo images, goals tracking, and automatic deloading suggestions.

This repository contains the Electron main process (`main.js`), a lightweight renderer UI (`src/renderer.js` + modules in `src/pages/`), and an `src/assets/` folder with exercise images.

## Quick start

Install dependencies (you likely already have them):

```bash
npm install
```

Start the app:

```bash
npm start
```

The app entry is `main.js` (Electron) which loads `index.html` and the renderer modules.

## Project layout (important files)

- `index.html`, `src/renderer.js` — renderer bootstrap and module loader.
- `main.js` — Electron main process (menus, window creation).
- `src/preload.js` — secure preload script (exposes a minimal `window.os.platform`).
- `src/pages/` — UI pages (today, schedule, goals, logs, groups, settings).
- `src/assets/exercises/` — exercise demo images used by the UI.
- `src/utils/helpers.js` — shared utilities and exercise templates.

## Exercise images pack (what filenames the app expects)

The app looks for demo images under `assets/exercises/`. If you want to provide your own demo photos, copy files into that folder using the exact filenames below. Landscape images (~1200×800) work best for the left preview panel.

Expected filenames:

- `trx_squat.jpg`
- `db_press.jpg`
- `db_row.jpg`
- `db_shoulder.jpg`
- `db_curl.jpg`
- `db_rdl.jpg`
- `pushup.jpg`
- `plank.jpg`
- `bar_hang.jpg`
- `chin_assist.jpg`
- `hamstring_stretch.jpg`
- `calf_stretch.jpg`
- `hip_flexor_stretch.jpg`
- `stretch.jpg` (fallback/generic stretch image)

## Notes & security

- `src/preload.js` is used and intentionally kept: it exposes a minimal `window.os.platform` via `contextBridge` without enabling Node integration in the renderer. This follows Electron security best practices.
- The app currently uses menu-to-renderer messages (`mainWindow.webContents.send(...)`) but the renderer isn't wired for IPC yet. If you want menu actions to control the UI (navigate/export/reset), I can add a small, safe IPC bridge in `src/preload.js` and handlers in `src/renderer.js`.