// Main helpers entry point - exports from all utility modules

// Re-export from all utility modules
export * from './dom.js';
export * from './constants.js';
export * from './database.js';
export * from './exercises.js';
export * from './workout-planning.js';
export * from './progression.js';

// Legacy compatibility - ensure all exports are available
import { USER_CONFIG, getFactoryDefaults } from '../config/userConfig.js';

// Make constants easily accessible
import { TIMING, PROGRESSION } from './constants.js';
export { TIMING, PROGRESSION };

// Factory reset function - combines database and config operations
export async function performFactoryReset() {
    try {
        // Clear all databases
        await window.db.remove('settings', {}, { multi: true });
        await window.db.remove('user', {}, { multi: true });
        await window.db.remove('workouts', {}, { multi: true });
        await window.db.remove('loads', {}, { multi: true });
        await window.db.remove('progressions', {}, { multi: true });
        
        // Create fresh defaults
        const defaultUser = getFactoryDefaults();
        await window.db.insert('user', defaultUser);
        
        const defaultSettings = {
            _id: 'app_settings',
            restTimerStrength: 120,
            restTimerEasy: 90,
            enableMicroloading: true,
            audioAlerts: false,
            darkMode: true,
            weightIncreaseAmount: 1.5,
            weightIncreaseConsecutive: 3,
            programStartDate: new Date().toISOString(),
            lastDeloadDate: null,
            deloadInterval: 8
        };
        await window.db.insert('settings', defaultSettings);
        
        return { success: true };
    } catch (e) {
        console.error('performFactoryReset error', e);
        return { success: false, error: e.message };
    }
}

// Migration helper for config defaults
export async function migrateToConfigDefaults() {
    try {
        const user = await window.db.findOne('user', { _id: 'user_profile' });
        if (!user) return;
        
        const defaults = getFactoryDefaults();
        const updates = {};
        
        // Only update missing fields with defaults
        Object.keys(defaults).forEach(key => {
            if (user[key] === undefined || user[key] === null) {
                updates[key] = defaults[key];
            }
        });
        
        if (Object.keys(updates).length > 0) {
            await window.db.update(
                'user',
                { _id: 'user_profile' },
                { $set: updates }
            );
        }
    } catch (e) {
        console.error('migrateToConfigDefaults error', e);
    }
}