// User Configuration - Customize these values for your specific needs
export const USER_CONFIG = {
    // Personal Information
    startingWeight: 262.4,      // lbs - Your starting weight
    targetWeight: 165,          // lbs - Your goal weight
    height: 71,                 // inches - Your height (71" = 5'11")
    age: 52,                    // years - Your age
    gender: 'male',             // 'male' or 'female' - affects some calculations
    
    // Program Settings
    deloadFrequencyWeeks: 8,    // How often to deload (every 8 weeks)
    
    // Exercise Starting Weights (lbs)
    startingDumbbellWeight: 15, // Starting weight for all dumbbell exercises
    
    // Bodyweight Exercise Starting Values
    pushUpStartLevel: 'wall',   // 'wall', 'knee', or 'full'
    pushUpStartReps: 5,         // Starting reps per set
    plankStartTime: 30,         // Starting plank hold time in seconds
    
    // Weekly Target Progressions - adjusted for actual starting weights
    strengthTargetsByWeek: {
        // Week 0-4: Progressive targets from actual starting weights
        'Bench-Supported Dumbbell Press': [10, 12.5, 15, 17.5, 20],
        'Seated Dumbbell Row': [10, 12.5, 15, 17.5, 20],  
        'Seated Dumbbell Shoulder Press': [5, 7.5, 10, 12.5, 15]
    },
    
    // Unlocks (bodyweight thresholds)
    barHangUnlockWeight: 200,   // Bar hangs unlock when bodyweight ≤ this
    
    // Expected Progress Rates (for goals display)
    expectedWeightLossPerWeek: 1.5, // lbs per week average
    expectedStrengthGainPercent: {
        // Percentage strength gains by time period
        week4: 20,     // 20% strength gain by week 4
        week12: 40,    // 40% strength gain by week 12
        week24: 60,    // 60% strength gain by week 24
        week52: 100,   // 100% strength gain by week 52
        week104: 150   // 150% strength gain by week 104
    }
};

// Factory Reset Function - call this to reset user to default state
export function getFactoryDefaults() {
    return {
        _id: 'user_profile',
        startDate: new Date().toISOString(),
        currentWeight: USER_CONFIG.startingWeight,
        targetWeight: USER_CONFIG.targetWeight,
        height: USER_CONFIG.height,
        age: USER_CONFIG.age,
        bodyweightHistory: [{ 
            date: new Date().toISOString().split('T')[0], 
            weight: USER_CONFIG.startingWeight 
        }],
        bestHangTime: 0,
        unlocksAchieved: []
    };
}

// Helper function to get current user profile description for display
export function getUserProfileDescription() {
    return `${USER_CONFIG.age}+ ${USER_CONFIG.gender}, ${USER_CONFIG.startingWeight} → ${USER_CONFIG.targetWeight} lbs goal`;
}

// Migration function to update existing user records to use new config defaults (preserves actual progress)
export async function migrateToConfigDefaults() {
    if (!window.db) {
        throw new Error('Database not available');
    }
    
    try {
        var user = await window.db.findOne('user', { _id: 'user_profile' });
        if (user) {
            // Only update if still using old hardcoded values
            if (user.currentWeight === 262 && USER_CONFIG.startingWeight !== 262) {
                await window.db.update(
                    'user',
                    { _id: 'user_profile' },
                    { $set: { 
                        currentWeight: USER_CONFIG.startingWeight,
                        bodyweightHistory: [{ 
                            date: new Date().toISOString().split('T')[0], 
                            weight: USER_CONFIG.startingWeight 
                        }]
                    }}
                );
                console.log('Migrated user weight from 262 to', USER_CONFIG.startingWeight);
                return { success: true, message: 'Weight updated to config value' };
            }
        }
        return { success: true, message: 'No migration needed' };
    } catch (error) {
        console.error('Migration failed:', error);
        return { success: false, error: error.message };
    }
}

// Factory reset function - clears all user data and resets to config defaults
export async function performFactoryReset() {
    if (!window.db) {
        throw new Error('Database not available');
    }
    
    try {
        // Clear all collections
        await window.db.remove('user', {}, { multi: true });
        await window.db.remove('workouts', {}, { multi: true });
        await window.db.remove('loads', {}, { multi: true });
        await window.db.remove('progressions', {}, { multi: true });
        
        // Insert fresh user profile
        await window.db.insert('user', getFactoryDefaults());
        
        console.log('Factory reset complete - all data cleared and reset to config defaults');
        return { success: true, message: 'Factory reset complete' };
    } catch (error) {
        console.error('Factory reset failed:', error);
        return { success: false, error: error.message };
    }
}