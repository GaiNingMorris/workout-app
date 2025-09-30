# Workout App v2.0

Muscle building workout app designed for age 50+ with 4-day split, progressive overload, TRX exercises, and dumbbell training. Built with Electron and vanilla JavaScript.

## ✨ Features

- **4-Day Training Split**: Mon/Tue/Thu/Fri workouts, Wed/Sat recovery, Sun rest
- **Progressive Overload**: Automatic weight progression with microloading support
- **Bodyweight Progression**: Wall → Knee → Full push-ups with level tracking
- **Conditional Unlocks**: Bar hangs (≤200 lb), chin-ups (≥30s hang)
- **Auto-Deload Cycles**: Every 8 weeks for recovery
- **Dynamic Warm-Ups**: Exercise-specific preparation before each workout
- **Static Stretching**: Full recovery routines for rest days
- **NeDB Database**: Persistent local storage with migration from v1.x
- **Exercise Demo Images**: Visual guides for proper form
- **Rest Timers**: Automatic timing between sets
- **Progress Tracking**: Weight history, strength gains, unlock milestones

## 🎯 Target User

- Age 52+, male, 5'11"
- Complete beginner to strength training
- Knee injury (TRX assistance required for squats)
- OMAD diet (One Meal A Day)
- Equipment: Dumbbells with 0.5lb microplates, TRX, adjustable bench, power tower
- Goal: Reduce from 262 lbs to 165 lbs while building muscle

## 📅 Weekly Schedule

| Day | Workout | Focus |
|-----|---------|-------|
| **Monday** | Upper Push | Chest, Shoulders, Triceps |
| **Tuesday** | Lower Quad | Squats & Glutes |
| **Wednesday** | Recovery | Static Stretching (20-30 min) |
| **Thursday** | Upper Pull | Back & Biceps |
| **Friday** | Lower Posterior | Hamstrings & Glutes |
| **Saturday** | Recovery | Static Stretching (20-30 min) |
| **Sunday** | Rest | Complete recovery |

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone or download this repository**

2. **Install dependencies**:
```bash
npm install
```

3. **Start the app**:
```bash
npm start
```

That's it! The app will:
- Launch in a desktop window
- Automatically migrate any old v1.x data to the new NeDB format
- Create default user profile and settings if this is your first run

## 📂 Project Structure

```
workout-app/
├── main.js                    # Electron main process (with NeDB handlers)
├── index.html                 # App entry point
├── package.json               # Dependencies (Electron + NeDB)
├── src/
│   ├── renderer.js            # App initialization & routing
│   ├── preload.js             # Secure IPC bridge (NeDB API)
│   ├── styles/
│   │   └── main.css           # Global styles
│   ├── pages/
│   │   ├── today.js           # Main workout interface
│   │   ├── schedule.js        # Weekly schedule view
│   │   ├── goals.js           # Progress tracking & unlocks
│   │   ├── logs.js            # Workout history
│   │   ├── groups.js          # Exercise customization (info only)
│   │   └── settings.js        # User settings & data export
│   ├── utils/
│   │   └── helpers.js         # Exercise library & progression logic
│   └── assets/
│       └── exercises/         # Exercise demo images
└── workout-data/              # NeDB database files (auto-created)
    ├── exercises.db
    ├── workouts.db
    ├── loads.db
    ├── progressions.db
    ├── user.db
    └── settings.db
```

## 💪 Progressive Overload System

### Weight-Based Exercises (Dumbbells)
- **Success**: Hit all target reps without struggle — counts as one successful workout. After 3 consecutive successful workouts the weight increases by +1.5 lbs (defaults: 1.5 lb increase after 3 consecutive successes; both values are configurable in **Settings**).
- **Failure**: Miss reps or struggle → increment fail streak
- **Auto-Deload**: 2 consecutive failures → -5% weight, reset streak
- **Microloading**: Rounds to nearest 0.5 lb

### Bodyweight Exercises (Push-Ups)
- **Level 1**: Wall Push-Ups (target: 2×20)
- **Level 2**: Knee Push-Ups (target: 2×20)
- **Level 3**: Full Push-Ups (goal: 100 total/week)
- **Advancement**: Hit 2×20 for 2 consecutive workouts

### Conditional Unlocks
- **Bar Hangs**: Unlock at bodyweight ≤200 lbs
- **Assisted Chin-Ups**: Unlock at hang time ≥30 seconds

### 8-Week Deload Cycle
- Automatically triggers every 8 weeks
- 50% weight, -1 set, -2 reps
- Resets all fail streaks
- Allows recovery and prevents overtraining

## 🖼️ Exercise Demo Images

The app expects demo images in `src/assets/exercises/`. If you want custom photos, use these filenames (landscape ~1200×800 recommended):

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
- `stretch.jpg` (fallback for any stretch/warm-up)

## 🔄 Migrating from v1.x

If you have an existing `workout-data.json` file from v1.x:

1. Keep the file in the project root
2. Start the app (v2.0)
3. Migration happens automatically on first launch
4. Old JSON is backed up as `workout-data.json.backup`
5. All data transfers to NeDB: user profile, workout logs, loads, settings

Migration preserves:
- ✅ Workout history
- ✅ Current loads for each exercise
- ✅ Fail streaks
- ✅ Bodyweight history
- ✅ Best hang time
- ✅ Settings (rest timers)

## 📊 Data Management

### Export Data
- Go to **Settings** page
- Click **Export Data (JSON)**
- Saves a complete backup of all workout data

### Reset Data
- Go to **Settings** page
- Click **Factory Reset** (requires confirmation)
- Deletes all workout data permanently

### Database Location
- All data stored in `workout-data/` folder (NeDB files)
- Automatic, no manual saves needed
- Persistent across app restarts

## 🎨 UI Pages

1. **Today**: Current workout with warm-ups, demo images, rest timer
2. **Schedule**: 7-day view with exercise previews
3. **Goals**: Progress tracking, bodyweight log, unlock status
4. **Logs**: Workout history (last 50 workouts)
5. **Settings**: Rest timers, deload interval, export/reset
6. **Groups**: Exercise overview and split information

## 🔐 Security

- Node integration disabled in renderer
- Context isolation enabled
- IPC bridge restricted to specific database operations
- External links open in default browser (not in-app)

## ⌨️ Keyboard Shortcuts

- `Ctrl/Cmd + T`: Today's Workout
- `Ctrl/Cmd + S`: Schedule
- `Ctrl/Cmd + G`: Goals & Progress
- `Ctrl/Cmd + E`: Export Data
- `Ctrl/Cmd + I`: Import Data (future)
- `F11`: Toggle Fullscreen
- `F12`: Toggle DevTools

## 📈 Expected Progress Timeline

| Weeks | Strength Gains | Muscle Visibility | Notes |
|-------|----------------|-------------------|-------|
| 0-2 | 5-10% | Minimal | Neural adaptations |
| 2-8 | 15-25% | Noticeable | Visible changes |
| 8-24 | 25-35% | Significant | Major development |
| 24-52 | 35-50% | Substantial | 1-year transformation |
| 52-104 | 50-70% | Advanced | Year 2: Refined physique |
| 104-156 | 60-80% | Expert | Year 3: Peak development |
| 156+ | 70-90%+ | Mastery | Lifetime health & vitality |

## 🏗️ Tech Stack

- **Electron** 31.2.0: Desktop app framework
- **NeDB** 1.8.0: Embedded NoSQL database
- **Vanilla JavaScript**: ES6 modules, no frameworks
- **CSS**: Custom design system with dark mode

## 🐛 Known Issues

None at this time. Report issues at: [GitHub Issues](https://github.com/GaiNingMorris/workout-app/issues)

## 📝 Version History

### v2.0.0 (Current)
- Complete