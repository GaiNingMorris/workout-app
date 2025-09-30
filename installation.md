# Installation Guide - Workout App v2.0

## Step-by-Step Installation

### 1. Install Node.js

**Download Node.js** from [nodejs.org](https://nodejs.org/)
- Choose the **LTS (Long Term Support)** version
- Minimum required: Node.js v16 or higher
- npm comes bundled with Node.js

**Verify installation:**
```bash
node --version
npm --version
```

### 2. Get the App Files

**Option A: Clone from GitHub**
```bash
git clone https://github.com/GaiNingMorris/workout-app.git
cd workout-app
```

**Option B: Download ZIP**
1. Download the ZIP from GitHub
2. Extract to a folder (e.g., `C:\workout-app` or `~/workout-app`)
3. Open terminal/command prompt in that folder

### 3. Install Dependencies

In the workout-app folder, run:
```bash
npm install
```

This installs:
- Electron 31.2.0
- NeDB 1.8.0

### 4. Start the App

```bash
npm start
```

The app will:
- Open in a desktop window
- Create the `workout-data/` folder (if needed)
- Migrate old v1.x data (if `workout-data.json` exists)
- Create default user profile and settings

### 5. First Run Setup

After launching for the first time:

1. Go to **Goals** page
2. Enter your current weight
3. Verify/update target weight (default: 165 lbs)
4. Go to **Settings** page
5. Verify rest timers (default: 120s for strength, 90s for easy)

6. Note: Weight progression uses a "consecutive successes" rule by default (3 successful workouts in a row required to increase weight by 1.5 lb). You can change the required consecutive count and the per-step increment on the **Settings** page.

You're ready to start your first workout!

## Troubleshooting

### "npm: command not found"
- Node.js is not installed or not in PATH
- Reinstall Node.js and restart terminal

### "Cannot find module 'electron'"
- Run `npm install` in the workout-app folder
- If still failing: delete `node_modules` folder and run `npm install` again

### "EACCES: permission denied"
- On Mac/Linux: Don't use `sudo npm install`
- Fix npm permissions: [npm docs](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)

### App won't start
- Check terminal for error messages
- Ensure you're in the correct folder
- Try: `npm install` then `npm start`

### Database errors
- Delete `workout-data/` folder (backs up your data first!)
- Restart the app to recreate databases

## Updating from v1.x

If you have the old version (v1.x with `workout-data.json`):

1. **Backup your data** (copy `workout-data.json` somewhere safe)
2. **Install v2.0** following steps above
3. **Keep old `workout-data.json`** in the project root
4. **Run `npm start`**
5. Migration happens automatically
6. Old file is renamed to `workout-data.json.backup`
7. Verify your data in Goals and Logs pages

## Platform-Specific Notes

### Windows
- Use Command Prompt or PowerShell
- App icon may require `.ico` format
- Place in `src/assets/exercises/icon.ico`

### macOS
- Use Terminal
- App icon requires `.icns` format
- Place in `src/assets/exercises/icon.icns`
- First run may require security approval (System Preferences → Security)

### Linux
- Use Terminal
- App icon uses `.png` format
- Place in `src/assets/exercises/icon.png`
- May need to mark as executable: `chmod +x node_modules/.bin/electron`

## Adding Exercise Images

For custom demo images:

1. Create folder: `src/assets/exercises/` (if not exists)
2. Add images with exact filenames (see README.md for list)
3. Recommended: JPEG, 1200×800px, landscape orientation
4. Restart app to load new images

## Running on Startup (Optional)

### Windows
1. Press `Win + R`
2. Type `shell:startup` and press Enter
3. Create shortcut to: `npm start` in workout-app folder
   - Or use: `node_modules\.bin\electron.cmd .`

### macOS
1. System Preferences → Users & Groups
2. Login Items → Click `+`
3. Add Electron app (after first build)

### Linux
- Add to autostart applications
- Command: `cd /path/to/workout-app && npm start`

## Building Standalone App (Advanced)

To create an `.exe`, `.app`, or `.AppImage`:

1. Install electron-builder:
```bash
npm install --save-dev electron-builder
```

2. Add to `package.json`:
```json
"scripts": {
  "start": "electron .",
  "build": "electron-builder"
},
"build": {
  "appId": "com.workout.app",
  "productName": "Workout App",
  "directories": {
    "output": "dist"
  },
  "files": [
    "**/*",
    "!**/*.md",
    "!node_modules/**/*"
  ]
}
```

3. Build:
```bash
npm run build
```

4. Find output in `dist/` folder

## Support

Still having issues?
1. Check README.md for more details
2. Review error messages in terminal
3. Open issue on GitHub with:
   - Operating system
   - Node.js version (`node --version`)
   - Error messages
   - Steps to reproduce

---

**Ready to build muscle at 50+! 💪**