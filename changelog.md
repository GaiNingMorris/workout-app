Changelog
All notable changes to the Workout App.

[2.0.0] - 2025-09-29
🎉 Major Refactor: 3-Day Split → 4-Day Split
Complete overhaul from v1.x to align with evidence-based muscle building for age 50+.

✨ Added
Training Program
4-day training split (Mon/Tue/Thu/Fri workouts)
Monday: Upper Push - Chest, Shoulders, Triceps
Tuesday: Lower Quad - Squats & Glutes
Wednesday: Recovery - Static Stretching
Thursday: Upper Pull - Back & Biceps
Friday: Lower Posterior - Hamstrings & Glutes
Saturday: Recovery - Static Stretching
Sunday: Full Rest
Progressive Overload Features
Dynamic warm-ups specific to each workout day
Bodyweight progression system for push-ups (wall → knee → full)
Conditional exercise unlocks:
Bar hangs unlock at ≤200 lbs bodyweight
Assisted chin-ups unlock at ≥30s hang time
8-week auto-deload cycles with automatic triggering
Enhanced fail tracking with 2-failure deload threshold
Database & Storage
NeDB integration for robust data persistence
Automatic migration from v1.x JSON format
Collections: exercises, workouts, loads, progressions, user, settings
Data export to JSON for backups
UI Improvements
Deload week indicators throughout the app
Unlock progress tracking in Goals page
Push-up level display showing current progression
Weeks until deload countdown
Enhanced workout completion tracking with struggled flag
Warm-up section in Today page before main workout
New Exercise Templates
Face Pulls / Rear Delt Flyes
Glute Bridges
Step-Ups
Bodyweight Good Mornings
Fire Hydrants
6-exercise recovery stretching routine
4 different dynamic warm-up routines
🔄 Changed
File Structure
main.js: Added NeDB IPC handlers, migration logic
src/preload.js: Exposed NeDB API instead of simple JSON storage
src/renderer.js: Refactored for async NeDB operations, added migration
src/utils/helpers.js: Complete rewrite with new exercise library
src/pages/today.js: Added warm-up display, new progression tracking
src/pages/schedule.js: Updated for 4-day split schedule
src/pages/goals.js: Added unlock tracking, deload info, progression display
src/pages/logs.js: Query NeDB instead of in-memory array
src/pages/settings.js: Added deload interval setting, data export
src/pages/groups.js: Simplified to info-only (program is now fixed)
Training Schedule
Old: Mon/Wed/Fri workouts, Tue/Thu/Sat recovery, Sun rest
New: Mon/Tue/Thu/Fri workouts, Wed/Sat recovery, Sun rest
Workout Structure
Old: Direct to main exercises
New: Dynamic warm-up → Main workout → Finish
Exercise Selection
Old: upperA, lowerB, upperC
New: monday, tuesday, thursday, friday, recovery, rest
Data Storage
Old: Single workout-data.json file
New: workout-data/ folder with 6 NeDB collections
Progression Logic
Old: Simple weight +2.5 lbs on success
New: Multi-faceted progression (weight, bodyweight levels, unlocks)
🗑️ Removed
Old 3-day split templates (upperA, lowerB, upperC)
Direct JSON file read/write in renderer
planEasy() function (replaced by recovery stretching)
Manual exercise group customization (now managed by program)
🐛 Fixed
Async data loading race conditions (moved to NeDB)
Inconsistent rest timer behavior
Missing validation on weight inputs
No backup mechanism for workout data
🔐 Security
Maintained context isolation
Restricted IPC to specific database operations
No new security vulnerabilities introduced
📊 Migration
Automatic migration from v1.x includes:

✅ User profile (weight, goals, hang time)
✅ Settings (rest timers)
✅ All workout logs
✅ Current loads for each exercise
✅ Fail streaks
✅ Bodyweight history
Migration process:

Detects workout-data.json on startup
Checks if migration already complete
Transforms data to NeDB format
Backs up old JSON as workout-data.json.backup
No data loss if migration fails
📝 Dependencies
Added:

nedb@1.8.0 - Embedded NoSQL database
Updated:

Version bumped to 2.0.0
💡 Breaking Changes
Storage format: JSON → NeDB (automatic migration provided)
Workout schedule: 3-day → 4-day (old logs still visible)
Exercise names: Some renamed for clarity
Groups page: No longer editable (program is evidence-based and fixed)
🎯 Backward Compatibility
Old workout-data.json automatically migrated
Old workout logs preserved in new format
Settings carried over with sensible defaults
No manual intervention required
[1.2.1] - 2025-09-29 (Legacy)
Features (v1.x)
3-day split training program
JSON file storage
Basic progressive overload
Exercise demo images
Rest timer
Goals tracking
Manual exercise group customization
Migration Guide
From v1.x to v2.0.0
Before upgrading:

Backup your workout-data.json file
Note your current exercise loads
After upgrading:

Run npm install to get NeDB
Run npm start
Migration happens automatically
Verify data in Goals and Logs pages
Check Settings for new deload interval option
If migration fails:

Check console for error messages
Restore workout-data.json.backup
Rename to workout-data.json
Restart app to retry migration
Manual migration (if needed):

Delete workout-data/ folder
Restore original workout-data.json
Restart app
Version Support
v2.x: Current, actively maintained
v1.x: Legacy, no longer supported (use v2.0.0)
For questions or issues, see GitHub Issues

