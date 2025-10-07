// Workout planning and scheduling logic

import { Ex, WarmUp } from './exercises.js';
import { getUserProfile, getProgressionFor, getLoadFor, getSettings, isDeloadWeek } from './database.js';
import { TIMING } from './constants.js';

// ============================================================================
// WORKOUT PLAN GENERATORS (4-DAY SPLIT)
// ============================================================================

export async function planMonday() {
    // Monday - Upper Push Focus
    const user = await getUserProfile();
    const settings = await getSettings();
    const isDeload = await isDeloadWeek(settings.programStartDate);
    
    const pushUpProg = await getProgressionFor('Push-Up');
    const plankProg = await getProgressionFor('Plank');
    const dbPressLoad = await getLoadFor('Bench-Supported Dumbbell Press');
    const dbShoulderLoad = await getLoadFor('Seated Dumbbell Shoulder Press');
    const dbRowLoad = await getLoadFor('Seated Dumbbell Row');
    
    const plankTargetTime = plankProg.targetTime || TIMING.PLANK_DEFAULT_SECONDS;
    
    var warmups = WarmUp.upperPush();
    
    var main = [
        Ex.dbPress(isDeload ? 2 : 3, isDeload ? 6 : 8, "Bench-Supported Dumbbell Press"),
        Ex.dbShoulder(isDeload ? 2 : 3, isDeload ? 6 : 8, "Seated Dumbbell Shoulder Press"),
        Ex.pushUpProgressive(pushUpProg, isDeload),
        Ex.dbRow(isDeload ? 2 : 3, isDeload ? 8 : 10, "Seated Dumbbell Row", true),
        Ex.plank(3, 0, isDeload ? Math.floor(plankTargetTime * 0.7) : plankTargetTime)
    ];
    
    return { warmups: warmups, main: main, isDeload: isDeload };
}

export async function planTuesday() {
    // Tuesday - Lower Quad Focus
    const settings = await getSettings();
    const isDeload = await isDeloadWeek(settings.programStartDate);
    
    const plankProg = await getProgressionFor('Plank');
    const plankTargetTime = plankProg.targetTime || TIMING.PLANK_DEFAULT_SECONDS;
    
    var warmups = WarmUp.lowerQuad();
    
    var main = [
        Ex.trxSquat(isDeload ? 2 : 3, isDeload ? 6 : 8),
        Ex.dbRDL(isDeload ? 1 : 2, isDeload ? 8 : 10),
        Ex.gluteBridge(isDeload ? 1 : 2, isDeload ? 10 : 12),
        Ex.plank(3, 0, isDeload ? Math.floor(plankTargetTime * 0.7) : plankTargetTime)
    ];
    
    return { warmups: warmups, main: main, isDeload: isDeload };
}

export async function planThursday() {
    // Thursday - Upper Pull Focus
    const user = await getUserProfile();
    const settings = await getSettings();
    const isDeload = await isDeloadWeek(settings.programStartDate);
    
    const pushUpProg = await getProgressionFor('Push-Up');
    const canHang = user.currentWeight <= 200;
    const chinUnlocked = canHang && user.bestHangTime >= 30;
    
    var warmups = WarmUp.upperPull();
    
    var main = [
        Ex.dbRow(isDeload ? 2 : 3, isDeload ? 6 : 8, "Seated Dumbbell Row"),
        Ex.dbCurl(isDeload ? 2 : 3, isDeload ? 8 : 10, "Dumbbell Curl"),
        Ex.facePulls(isDeload ? 2 : 3, isDeload ? 10 : 12),
        Ex.pushUpProgressive(pushUpProg, isDeload)
    ];
    
    // Conditional unlocks
    if (chinUnlocked) {
        main.push(Ex.assistedChin(2, isDeload ? 3 : 5));
    } else if (canHang) {
        main.push(Ex.barHang(2, isDeload ? 15 : 20));
    }
    
    const plankProg = await getProgressionFor('Plank');
    const plankTargetTime = plankProg.targetTime || TIMING.PLANK_DEFAULT_SECONDS;
    main.push(Ex.plank(3, 0, isDeload ? Math.floor(plankTargetTime * 0.7) : plankTargetTime));
    
    return { warmups: warmups, main: main, isDeload: isDeload };
}

export async function planFriday() {
    // Friday - Lower Posterior Chain Focus
    const settings = await getSettings();
    const isDeload = await isDeloadWeek(settings.programStartDate);
    
    const plankProg = await getProgressionFor('Plank');
    const plankTargetTime = plankProg.targetTime || TIMING.PLANK_DEFAULT_SECONDS;
    
    var warmups = WarmUp.lowerPosterior();
    
    var main = [
        Ex.dbRDL(isDeload ? 2 : 3, isDeload ? 6 : 8),
        Ex.trxSquat(isDeload ? 1 : 2, isDeload ? 8 : 10),
        Ex.stepUp(isDeload ? 1 : 2, isDeload ? 6 : 8),
        Ex.plank(3, 0, isDeload ? Math.floor(plankTargetTime * 0.7) : plankTargetTime)
    ];
    
    return { warmups: warmups, main: main, isDeload: isDeload };
}

export async function planRecovery() {
    // Wednesday & Saturday - Full stretching routine
    return { 
        warmups: [], 
        main: Ex.recoveryStretchFull(), 
        isDeload: false 
    };
}

export async function planRest() {
    // Sunday - Complete rest
    return { 
        warmups: [], 
        main: [], 
        isDeload: false 
    };
}

// ============================================================================
// WORKOUT TYPE DETECTION
// ============================================================================

export function workoutTypeForDate(d) {
    var dow = d.getDay();
    if (dow === 1) return "monday";      // Monday - Upper Push
    if (dow === 2) return "tuesday";     // Tuesday - Lower Quad
    if (dow === 3) return "recovery";    // Wednesday - Recovery
    if (dow === 4) return "thursday";    // Thursday - Upper Pull
    if (dow === 5) return "friday";      // Friday - Lower Posterior
    if (dow === 6) return "recovery";    // Saturday - Recovery
    if (dow === 0) return "rest";        // Sunday - Rest
    return "rest";
}

export async function planForToday() {
    const today = new Date();
    const workoutType = workoutTypeForDate(today);
    
    return await planForWorkoutType(workoutType);
}

export async function planForWorkoutType(workoutType) {
    if (workoutType === "monday") return await planMonday();
    if (workoutType === "tuesday") return await planTuesday();
    if (workoutType === "thursday") return await planThursday();
    if (workoutType === "friday") return await planFriday();
    if (workoutType === "recovery") return await planRecovery();
    if (workoutType === "rest") return await planRest();
    
    return await planRest();
}