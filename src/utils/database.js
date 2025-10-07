// Database operations and data access layer

import { getFactoryDefaults } from '../config/userConfig.js';
import { PROGRESSION } from './constants.js';

// ============================================================================
// DATABASE HELPERS
// ============================================================================

export async function getSettings() {
    try {
        const settings = await window.db.findOne('settings', { _id: 'app_settings' });
        if (!settings) {
            // Create default settings
            const defaultSettings = {
                _id: 'app_settings',
                restTimerStrength: 120,
                restTimerEasy: 90,
                enableMicroloading: true,
                audioAlerts: false,
                darkMode: true,
                // Weight progression tuning
                weightIncreaseAmount: PROGRESSION.DEFAULT_WEIGHT_INCREASE,
                weightIncreaseConsecutive: PROGRESSION.REQUIRED_CONSECUTIVE_SUCCESSES,
                programStartDate: new Date().toISOString(),
                lastDeloadDate: null,
                deloadInterval: 8
            };
            await window.db.insert('settings', defaultSettings);
            return defaultSettings;
        }
        return settings;
    } catch (e) {
        console.error('getSettings error', e);
        return {
            restTimerStrength: 120,
            restTimerEasy: 90,
            enableMicroloading: true,
            programStartDate: new Date().toISOString(),
            deloadInterval: 8
        };
    }
}

export async function getUserProfile() {
    try {
        const user = await window.db.findOne('user', { _id: 'user_profile' });
        if (!user) {
            // Create default user profile
            const defaultUser = getFactoryDefaults();
            await window.db.insert('user', defaultUser);
            return defaultUser;
        }
        return user;
    } catch (e) {
        console.error('getUserProfile error', e);
        return {
            startDate: new Date().toISOString(),
            currentWeight: 180,
            targetWeight: 165,
            bestHangTime: 0,
            bodyweightHistory: []
        };
    }
}

export async function getLoadFor(exerciseName) {
    try {
        const load = await window.db.findOne('loads', { exerciseId: exerciseName });
        if (!load) {
            // Create default load entry with exercise-specific starting weights
            let startingWeight = PROGRESSION.DEFAULT_STARTING_WEIGHT;
            
            // Custom starting weights based on exercise
            if (exerciseName === 'Bench-Supported Dumbbell Press') startingWeight = 10;
            else if (exerciseName === 'Seated Dumbbell Shoulder Press') startingWeight = 5;
            else if (exerciseName === 'Seated Dumbbell Row') startingWeight = 10;
            else if (exerciseName === 'Dumbbell Curl') startingWeight = 8;
            else if (exerciseName === 'DB RDL (Hip Hinge)') startingWeight = 12;
            else if (exerciseName === 'Face Pulls') startingWeight = 5;
            
            const defaultLoad = {
                exerciseId: exerciseName,
                currentWeight: startingWeight,
                lastIncreaseDate: new Date().toISOString(),
                failStreak: 0,
                consecutiveSuccesses: 0,
                history: []
            };
            await window.db.insert('loads', defaultLoad);
            return defaultLoad;
        }
        return load;
    } catch (e) {
        console.error('getLoadFor error', e);
        return { currentWeight: PROGRESSION.DEFAULT_STARTING_WEIGHT, failStreak: 0, consecutiveSuccesses: 0 };
    }
}

export async function updateLoad(exerciseName, newWeight, failStreak) {
    try {
        await window.db.update(
            'loads',
            { exerciseId: exerciseName },
            { 
                $set: { 
                    currentWeight: newWeight, 
                    failStreak: failStreak || 0,
                    consecutiveSuccesses: 0,
                    lastIncreaseDate: new Date().toISOString()
                }
            },
            { upsert: true }
        );
    } catch (e) {
        console.error('updateLoad error', e);
    }
}

export async function getProgressionFor(exerciseName) {
    try {
        const prog = await window.db.findOne('progressions', { exerciseId: exerciseName });
        if (!prog) {
            // Create default progression
            const defaultProg = {
                exerciseId: exerciseName,
                currentLevel: 'wall',
                levelHistory: [],
                consecutiveSuccesses: 0
            };
            await window.db.insert('progressions', defaultProg);
            return defaultProg;
        }
        return prog;
    } catch (e) {
        console.error('getProgressionFor error', e);
        return { currentLevel: 'wall', consecutiveSuccesses: 0 };
    }
}

export async function updateProgression(exerciseName, level, consecutiveSuccesses) {
    try {
        await window.db.update(
            'progressions',
            { exerciseId: exerciseName },
            { 
                $set: { 
                    currentLevel: level,
                    consecutiveSuccesses: consecutiveSuccesses || 0
                }
            },
            { upsert: true }
        );
    } catch (e) {
        console.error('updateProgression error', e);
    }
}

// Generic progression field updater for arbitrary progression documents
export async function updateProgressionFields(exerciseName, fields) {
    try {
        await window.db.update(
            'progressions',
            { exerciseId: exerciseName },
            { $set: fields },
            { upsert: true }
        );
    } catch (e) {
        console.error('updateProgressionFields error', e);
    }
}

// ============================================================================
// DELOAD CALCULATOR
// ============================================================================

async function getFirstWorkoutDate() {
    try {
        const workouts = await window.db.find('workouts', {}, { sort: { date: 1 }, limit: 1 });
        return workouts[0] ? new Date(workouts[0].date) : null;
    } catch (error) {
        console.error('Error getting first workout date:', error);
        return null;
    }
}

export async function isDeloadWeek(programStartDate) {
    try {
        const firstWorkoutDate = await getFirstWorkoutDate();
        if (!firstWorkoutDate) return false;
        
        const now = new Date();
        const weeksPassed = Math.floor((now - firstWorkoutDate) / (7 * 24 * 60 * 60 * 1000));
        
        // Every 8th week is deload
        return weeksPassed > 0 && weeksPassed % 8 === 0;
    } catch (error) {
        return false;
    }
}

export async function weeksUntilDeload(programStartDate) {
    try {
        const firstWorkoutDate = await getFirstWorkoutDate();
        if (!firstWorkoutDate) return 8;
        
        const now = new Date();
        const weeksPassed = Math.floor((now - firstWorkoutDate) / (7 * 24 * 60 * 60 * 1000));
        
        return 8 - (weeksPassed % 8);
    } catch (error) {
        return 8;
    }
}

export async function nextDeloadDate(programStartDate) {
    const firstWorkoutDate = await getFirstWorkoutDate();
    if (!firstWorkoutDate) return null;
    
    const weeksUntil = await weeksUntilDeload(programStartDate);
    const nextDeload = new Date(firstWorkoutDate);
    nextDeload.setDate(nextDeload.getDate() + (weeksUntil * 7));
    
    return nextDeload;
}

// ============================================================================
// LEGACY DATA OPERATIONS
// ============================================================================

export function saveData(d) {
    // Deprecated - using NeDB directly
    // Legacy function maintained for compatibility
}

export async function resetData() {
    try {
        await window.db.remove('settings', {}, { multi: true });
        await window.db.remove('user', {}, { multi: true });
        await window.db.remove('workouts', {}, { multi: true });
        await window.db.remove('loads', {}, { multi: true });
        await window.db.remove('progressions', {}, { multi: true });
        return { success: true };
    } catch (e) {
        console.error('resetData error', e);
        return { success: false, error: e.message };
    }
}

export async function ensureLoadsMigration() {
    try {
        // Check if loads collection needs migration
        const loads = await window.db.find('loads', {});
        var updated = 0;
        
        for (const load of loads) {
            if (!load.consecutiveSuccesses && load.consecutiveSuccesses !== 0) {
                await window.db.update(
                    'loads',
                    { _id: load._id },
                    { $set: { consecutiveSuccesses: 0 } }
                );
                updated++;
            }
        }
        
        return { success: true, updated };
    } catch (e) {
        console.error('ensureLoadsMigration error', e);
        return { success: false, error: e.message };
    }
}