// Progression logic and advancement calculations

import { getProgressionFor, getLoadFor, updateProgressionFields, updateProgression, getUserProfile, getSettings } from './database.js';
import { round05 } from './dom.js';
import { PROGRESSION, TIMING } from './constants.js';

// ============================================================================
// PROGRESSION LOGIC
// ============================================================================

export async function processWorkoutCompletion(exercises) {
    // Process each exercise for progression
    for (const exercise of exercises) {
        // Treat both upper and lower strength exercises as weight-based progression
        if ((exercise.type === 'upper' || exercise.type === 'lower') && exercise.targetReps > 0) {
            // Weight-based progression
            await processWeightProgression(exercise);
        } else if (exercise.type === 'bodyweight' && exercise.name.includes('Push')) {
            // Bodyweight level progression
            await processBodyweightProgression(exercise);
        } else if (exercise.name === 'Plank') {
            // Time-based progression for plank
            await processPlankProgression(exercise);
        } else if (exercise.type === 'bodyweight' && exercise.name !== 'Bar Hang') {
            // Generic bodyweight reps progression (increment target reps by 1 after consecutive successes)
            await processBodyweightRepsProgression(exercise);
        } else if (exercise.name === 'Bar Hang') {
            // Update best hang time
            await processHangProgression(exercise);
        }
    }
    
    // Show fitness score update notification
    console.log('🎮 Workout completed! Your fitness game score may have updated. Check the Charts tab to see your latest progress!');
}

async function processBodyweightRepsProgression(exercise) {
    // Use 'progressions' collection to store per-exercise consecutive successes
    const prog = await getProgressionFor(exercise.name);
    // Check if all sets meet or exceed target reps and none marked struggled
    const hitTarget = exercise.completedSets && exercise.completedSets.every(set => set.reps >= exercise.targetReps && !set.struggled);

    // Get required consecutive successes from settings
    const settings = await getSettings();
    const requiredConsecutive = parseInt(settings.weightIncreaseConsecutive) || PROGRESSION.REQUIRED_CONSECUTIVE_SUCCESSES;

    if (hitTarget) {
        const newSucc = (prog.consecutiveSuccesses || 0) + 1;
        if (newSucc >= requiredConsecutive) {
            // Scientific progression increases based on exercise type
            const currentTarget = exercise.targetReps || 0;
            let newTarget;
            
            // Different progression rates for different exercises
            if (exercise.name === 'TRX Assisted Squat') {
                // TRX Squats: +2 reps per progression (10-15% increases)
                newTarget = currentTarget + 2;
            } else if (exercise.name === 'Assisted Chin-Up') {
                // Assisted Chin-ups: +1 rep per progression (harder exercise)
                newTarget = currentTarget + 1;
            } else if (exercise.name.includes('Bridge')) {
                // Glute Bridges: +3 reps per progression (easier exercise)
                newTarget = currentTarget + 3;
            } else if (exercise.name.includes('Step')) {
                // Step-ups: +2 reps per progression
                newTarget = currentTarget + 2;
            } else {
                // Default: +2 reps for most bodyweight exercises
                newTarget = currentTarget + 2;
            }
            
            // Persist change: update progression fields and reset consecutive counter
            await updateProgressionFields(exercise.name, { consecutiveSuccesses: 0, targetReps: newTarget });
            // Also update any live exercise object for immediate feedback
            exercise.targetReps = newTarget;
            exercise.targetText = String(exercise.sets) + "×" + String(newTarget);
        } else {
            // Update consecutive counter only
            await updateProgressionFields(exercise.name, { consecutiveSuccesses: newSucc });
        }
    } else {
        // Reset consecutive counter
        await updateProgressionFields(exercise.name, { consecutiveSuccesses: 0 });
    }
}

async function processWeightProgression(exercise) {
    const load = await getLoadFor(exercise.name);
    const allSetsSuccess = exercise.completedSets && 
        exercise.completedSets.every(set => 
            set.reps >= exercise.targetReps && !set.struggled
        );
    // Read progression tuning from settings (defaults set in getSettings)
    const settings = await getSettings();
    const increaseAmount = parseFloat(settings.weightIncreaseAmount) || PROGRESSION.DEFAULT_WEIGHT_INCREASE;
    const requiredConsecutive = parseInt(settings.weightIncreaseConsecutive) || PROGRESSION.REQUIRED_CONSECUTIVE_SUCCESSES;
    
    if (allSetsSuccess) {
        // Success: increment consecutive success counter
        const prevSucc = (load.consecutiveSuccesses || 0) + 1;

        if (prevSucc >= requiredConsecutive) {
            // After required consecutive successful workouts, increase weight and reset counters
            const newWeight = round05(load.currentWeight + increaseAmount);
            await window.db.update(
                'loads',
                { exerciseId: exercise.name },
                { $set: { currentWeight: newWeight, failStreak: 0, consecutiveSuccesses: 0, lastIncreaseDate: new Date().toISOString() } },
                { upsert: true }
            );
        } else {
            // Save incremented consecutive success count, keep weight and reset failStreak
            await window.db.update(
                'loads',
                { exerciseId: exercise.name },
                { $set: { consecutiveSuccesses: prevSucc, failStreak: 0 } },
                { upsert: true }
            );
        }
    } else {
        // Failure: increment fail streak and reset consecutive successes
        const newFailStreak = (load.failStreak || 0) + 1;

        if (newFailStreak >= 2) {
            // Auto-deload: reduce by 5% and reset counters
            const newWeight = round05(load.currentWeight * 0.95);
            await window.db.update(
                'loads',
                { exerciseId: exercise.name },
                { $set: { currentWeight: newWeight, failStreak: 0, consecutiveSuccesses: 0, lastIncreaseDate: new Date().toISOString() } },
                { upsert: true }
            );
        } else {
            // Keep weight, increment fail streak and reset consecutive successes
            await window.db.update(
                'loads',
                { exerciseId: exercise.name },
                { $set: { currentWeight: load.currentWeight, failStreak: newFailStreak, consecutiveSuccesses: 0 } },
                { upsert: true }
            );
        }
    }
}

async function processBodyweightProgression(exercise) {
    const prog = await getProgressionFor('Push-Up');
    const levels = ['wall', 'knee', 'full'];
    const currentIndex = levels.indexOf(prog.currentLevel);
    
    // Advancement targets: need to hit 2×max reps for each level
    const levelMaxTotals = {
        wall: 50,  // 2×25 wall push-ups = 50 total
        knee: 32,  // 2×16 knee push-ups = 32 total  
        full: 24   // 2×12 full push-ups = 24 total (maintenance)
    };
    
    const requiredTotal = levelMaxTotals[prog.currentLevel] || 50;
    
    // Calculate total reps completed in this workout
    const totalReps = exercise.completedSets ? 
        exercise.completedSets.reduce((sum, set) => sum + (set.reps || 0), 0) : 0;
    
    // Check if hit the progression target (max reps for current level)
    const hitTarget = totalReps >= requiredTotal;
    
    if (hitTarget) {
        const newSuccess = (prog.consecutiveSuccesses || 0) + 1;
        
        if (newSuccess >= 3 && currentIndex < levels.length - 1) {
            // Advance to next level after 3 consecutive max-rep workouts
            // This ensures solid strength base before advancing
            await updateProgression('Push-Up', levels[currentIndex + 1], 0);
        } else {
            // Increment success counter
            await updateProgression('Push-Up', prog.currentLevel, newSuccess);
        }
    } else {
        // Reset success counter
        await updateProgression('Push-Up', prog.currentLevel, 0);
    }
}

async function processHangProgression(exercise) {
    if (!exercise.completedSets || exercise.completedSets.length === 0) return;
    
    // Find best hang time from this workout
    const bestTime = Math.max(...exercise.completedSets.map(set => set.reps || 0));
    
    const user = await getUserProfile();
    if (bestTime > (user.bestHangTime || 0)) {
        // Update best hang time
        await window.db.update(
            'user',
            { _id: 'user_profile' },
            { $set: { bestHangTime: bestTime } }
        );
    }
}

async function processPlankProgression(exercise) {
    // Use 'progressions' collection to store plank target time and consecutive successes
    const prog = await getProgressionFor(exercise.name);
    
    // Get current target time (default to 30 seconds if not set)
    const currentTargetTime = prog.targetTime || TIMING.PLANK_DEFAULT_SECONDS;
    
    // Check if all sets meet or exceed target time and none marked struggled
    const hitTarget = exercise.completedSets && 
        exercise.completedSets.every(set => set.reps >= currentTargetTime && !set.struggled);

    // Get required consecutive successes from settings
    const settings = await getSettings();
    const requiredConsecutive = parseInt(settings.weightIncreaseConsecutive) || PROGRESSION.REQUIRED_CONSECUTIVE_SUCCESSES;

    if (hitTarget) {
        const newSucc = (prog.consecutiveSuccesses || 0) + 1;
        if (newSucc >= requiredConsecutive) {
            // Increase target time by 5 seconds and reset counter
            const newTargetTime = currentTargetTime + 5;
            await updateProgressionFields(exercise.name, { 
                consecutiveSuccesses: 0, 
                targetTime: newTargetTime 
            });
        } else {
            // Update consecutive counter only
            await updateProgressionFields(exercise.name, { consecutiveSuccesses: newSucc });
        }
    } else {
        // Reset consecutive counter
        await updateProgressionFields(exercise.name, { consecutiveSuccesses: 0 });
    }
}