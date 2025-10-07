// Shared helpers for Workout app (ES module) - v2.0

import { USER_CONFIG, getFactoryDefaults } from '../config/userConfig.js';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function pad2(n) { return (n < 10 ? "0" : "") + n; }
export function fmtClock(total) { var m = Math.floor(total / 60), s = total % 60; return pad2(m) + ":" + pad2(s); }
export function round05(n) { return Math.round(n * 2) / 2; }
export function todayISO() { return new Date().toISOString().slice(0, 10); }
export function toISO(d) { return d.toISOString().slice(0, 10); }
export function addDays(d, n) { var z = new Date(d); z.setDate(z.getDate() + n); return z; }
export function dayName(d) { return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()]; }

// DOM helper
export function el(tag, props, children) {
    var element = document.createElement(tag);
    if (props) {
        Object.keys(props).forEach(function (key) {
            if (key === "class") element.className = props[key];
            else if (key === "style") element.setAttribute("style", props[key]);
            else if (key.startsWith("on") && typeof props[key] === "function") element.addEventListener(key.slice(2), props[key]);
            else element[key] = props[key];
        });
    }
    if (children) children.forEach(function (child) { 
        if (!child) return; 
        if (typeof child === "string") element.appendChild(document.createTextNode(child)); 
        else if (child.nodeType) element.appendChild(child); 
    });
    return element;
}

// ============================================================================
// IMAGE MAPPING
// ============================================================================

export const IMG_MAP = {
    // Main strength exercises
    "Bench-Supported Dumbbell Press": "db_press",
    "Seated Dumbbell Row": "db_row",
    "Seated Dumbbell Shoulder Press": "db_shoulder",
    "Dumbbell Curl": "db_curl",
    "DB RDL (Hip Hinge)": "db_rdl",
    "TRX Assisted Squat": "trx_squat",
    
    // Bodyweight exercises
    "Push-Up": "pushup",
    "Wall Push-Up": "pushup",
    "Knee Push-Up": "pushup",
    "Full Push-Up": "pushup",
    "Plank": "plank",
    "Bar Hang": "bar_hang",
    "Assisted Chin-Up": "chin_assist",
    "Glute Bridge": "glute_bridge",
    "Step-Up": "step_up",
    "Face Pulls": "face_pulls",
    
    // Essential stretches (3 only)
    "Calf Stretch": "calf_stretch",
    "Chest Doorway Stretch": "chest_stretch",
    "Shoulder Cross-Body Stretch": "shoulder_stretch",
    
    // Simple warm-ups (3 only)
    "Arm Circles": "arm_circles",
    "Ankle Circles": "ankle_circles",
    "Wall Slides": "wall_slides"
};

export function getImgKey(name) { return IMG_MAP[name] || "stretch"; }

export function setDemoImageFor(demoEl, ex) {
    try {
        var key = getImgKey(ex.name);
        if (demoEl && demoEl.style)
            demoEl.style.backgroundImage = "url('src/assets/exercises/" + key + ".jpg')";
    } catch (e) {
        console.error('setDemoImageFor error', e);
    }
}

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
                weightIncreaseAmount: 1.5,
                weightIncreaseConsecutive: 3,
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
            currentWeight: USER_CONFIG.startingWeight,
            targetWeight: USER_CONFIG.targetWeight,
            bestHangTime: 0,
            bodyweightHistory: []
        };
    }
}

export async function getLoadFor(exerciseName) {
    try {
        const load = await window.db.findOne('loads', { exerciseId: exerciseName });
        if (!load) {
            // Create default load entry
            const defaultLoad = {
                exerciseId: exerciseName,
                currentWeight: 15,
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
        return { currentWeight: 15, failStreak: 0, consecutiveSuccesses: 0 };
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
    // Get the earliest workout date from the workouts database
    try {
        const workouts = await window.db.find('workouts', {}, { sort: { date: 1 }, limit: 1 });
        return workouts.length > 0 ? workouts[0].date : null;
    } catch (error) {
        console.error('Error getting first workout date:', error);
        return null;
    }
}

export async function isDeloadWeek(programStartDate) {
    // Use first workout date if available, otherwise return false (no deload until first workout)
    const firstWorkoutDate = await getFirstWorkoutDate();
    if (!firstWorkoutDate) return false;
    
    const start = new Date(firstWorkoutDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    // Deload every 8 weeks (week 9, 17, 25, etc.)
    return (diffWeeks + 1) % 8 === 0;
}

export async function weeksUntilDeload(programStartDate) {
    // Use first workout date if available, otherwise return 8 (full cycle until first workout)
    const firstWorkoutDate = await getFirstWorkoutDate();
    if (!firstWorkoutDate) return 8; // Full 8 weeks until first deload
    
    const start = new Date(firstWorkoutDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    return 8 - ((diffWeeks + 1) % 8);
}

export async function nextDeloadDate(programStartDate) {
    const firstWorkoutDate = await getFirstWorkoutDate();
    if (!firstWorkoutDate) return null;
    
    const weeksUntil = await weeksUntilDeload(programStartDate);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (weeksUntil * 7));
    
    return nextDate;
}

// ============================================================================
// EXERCISE TEMPLATE BUILDERS
// ============================================================================

// Exercise object constructor
export function ex(name, sets, reps, how, type, light) {
    return { 
        name: name, 
        sets: sets, 
        targetReps: reps || 0, 
        targetText: reps ? (sets + "×" + reps) : (name.indexOf("Stretch") >= 0 ? "2-3 min total" : ""), 
        reps: reps || 0, 
        detail: how || "", 
        type: type || "upper", 
        light: !!light, 
        curDone: 0 
    };
}

// Warm-up exercises
export const WarmUp = {
    // One simple warm-up for all workouts
    general: function() {
        return [
            ex("Arm Circles", 1, 10, "10 forward, 10 backward each arm", "warmup"),
            ex("Ankle Circles", 1, 10, "10 each direction, both ankles", "warmup"),
            ex("Wall Slides", 1, 8, "Back against wall, arms up and down", "warmup")
        ];
    },
    
    // All workout types use the same simple warm-up
    upperPush: function() { return this.general(); },
    lowerQuad: function() { return this.general(); },
    upperPull: function() { return this.general(); },
    lowerPosterior: function() { return this.general(); }
};

// Main exercise templates
export const Ex = {
    // Upper body strength
    dbPress: function (sets, reps, name, light) { 
        return ex(name || "Bench-Supported Dumbbell Press", sets, reps, 
            "Bench 15-30° incline. Wrists neutral. 2s down, 1s up.", "upper", light); 
    },
    
    dbRow: function (sets, reps, name, light) { 
        return ex(name || "Seated Dumbbell Row", sets, reps, 
            "Chest-supported on bench. Elbows to back pockets.", "upper", light); 
    },
    
    dbShoulder: function (sets, reps, name, light) { 
        return ex(name || "Seated Dumbbell Shoulder Press", sets, reps, 
            "Seated press in pain-free range. Control the descent.", "upper", light); 
    },
    
    dbCurl: function (sets, reps, name, light) { 
        return ex(name || "Dumbbell Curl", sets, reps, 
            "Elbows by sides. Full control, no swinging.", "upper", light); 
    },
    
    facePulls: function (sets, reps) {
        return ex("Face Pulls", sets, reps, 
            "Light weight, focus on shoulder health. Pull to face level.", "upper", true);
    },
    
    // Lower body strength
    trxSquat: function (sets, reps) { 
        // TRX Assisted Squat is treated as bodyweight-assisted, not a loaded lower strength movement
        return ex("TRX Assisted Squat", sets, reps, 
            "Hold TRX straps, sit back, pain-free range. 2s down/2s up.", "bodyweight"); 
    },
    
    dbRDL: function (sets, reps) { 
        return ex("DB RDL (Hip Hinge)", sets, reps, 
            "Soft knees, hinge at hips, neutral back. DBs slide along thighs/shins.", "lower"); 
    },
    
    gluteBridge: function (sets, reps) {
        return ex("Glute Bridge", sets, reps, 
            "Lie on back, feet flat, lift hips. Squeeze glutes at top.", "lower");
    },
    
    stepUp: function (sets, reps) {
        return ex("Step-Up", sets, reps, 
            "Use stable platform. Step up one leg at a time. Knee-safe.", "lower");
    },
    
    // Bodyweight - progression aware
    pushUp: function (sets, reps, level) {
        var name = level === 'wall' ? 'Wall Push-Up' : level === 'knee' ? 'Knee Push-Up' : 'Push-Up';
        var detail = level === 'wall' ? 'Hands on wall, body straight' : 
                     level === 'knee' ? 'Knees on ground, maintain plank position' : 
                     'Full push-up, chest to ground';
        return ex(name, sets, reps, detail, "bodyweight");
    },
    
    pushUpProgressive: function (progression, isDeload) {
        const level = progression.currentLevel || 'wall';
        const consecutiveSuccesses = progression.consecutiveSuccesses || 0;
        
        // Scientific progression: 10-15% increases based on exercise science
        // Each level builds to 50 total reps before advancing (2×25 format)
        const repProgression = {
            wall: {
                baseReps: 15,     // Start with 2×15 = 30 total
                increments: [0, 3, 5, 8, 10], // 15→18→20→23→25 per set (10-15% increases)
                maxReps: 25,      // 2×25 = 50 total reps to advance
                sets: 2
            },
            knee: {
                baseReps: 8,      // Start with 2×8 = 16 total (knee push-ups ~40% harder)
                increments: [0, 2, 4, 6, 8],  // 8→10→12→14→16 per set 
                maxReps: 16,      // 2×16 = 32 total reps to advance
                sets: 2
            },
            full: {
                baseReps: 5,      // Start with 2×5 = 10 total (full push-ups ~60% harder)
                increments: [0, 2, 3, 5, 7],  // 5→7→8→10→12 per set
                maxReps: 12,      // 2×12 = 24 total reps (maintenance level)
                sets: 2
            }
        };
        
        const currentProg = repProgression[level] || repProgression.wall;
        const incrementIndex = Math.min(consecutiveSuccesses, currentProg.increments.length - 1);
        const targetReps = currentProg.baseReps + currentProg.increments[incrementIndex];
        
        const finalReps = isDeload ? Math.floor(targetReps * 0.7) : targetReps;
        
        var name = level === 'wall' ? 'Wall Push-Up' : level === 'knee' ? 'Knee Push-Up' : 'Push-Up';
        var detail = level === 'wall' ? `Hands on wall, body straight. Work up to 2×${currentProg.maxReps}!` : 
                     level === 'knee' ? `Knees on ground, maintain plank position. Work up to 2×${currentProg.maxReps}!` : 
                     `Full push-up, chest to ground. Work up to 2×${currentProg.maxReps}!`;
        
        return ex(name, currentProg.sets, finalReps, detail, "bodyweight");
    },
    
    plank: function (sets, reps, seconds) {
        // Support both call styles:
        //  - plank(sets, seconds)          -> legacy (seconds passed as 2nd arg)
        //  - plank(sets, reps, seconds)    -> modern (reps===0 for time-based)
        var actualReps = 0;
        var actualSeconds = 0;

        if (seconds === undefined) {
            // legacy signature: (sets, seconds)
            actualSeconds = reps || 0;
            actualReps = 0;
        } else {
            actualReps = reps || 0;
            actualSeconds = seconds || 0;
        }

        var o = ex("Plank", sets, actualReps, 
            "Hold strong position. Straight line from head to heels.", "bodyweight");

        if (actualReps === 0) {
            o.targetReps = 0;
            if (actualSeconds > 0) o.targetText = String(sets) + "×" + String(actualSeconds) + "s";
            else o.targetText = "";
        } else {
            o.targetText = String(sets) + "×" + String(actualReps);
        }

        return o;
    },
    
    barHang: function (sets, seconds) { 
        var o = ex("Bar Hang", sets, 0, 
            "Use power tower. Dead hang, accumulate time.", "bodyweight"); 
        o.targetReps = 0; 
        o.targetText = String(seconds) + "s holds"; 
        return o; 
    },
    
    assistedChin: function (sets, reps) { 
        return ex("Assisted Chin-Up", sets, reps, 
            "Use assist band or feet on step. Smooth pulls, no jerking.", "bodyweight"); 
    },
    
    // Stretches
    stretchBlock: function () { 
        return [
            ex("Calf Stretch", 1, 0, "Wall stretch - stand arm's length from wall. 30s each leg.", "stretch"),
            ex("Chest Doorway Stretch", 1, 0, "Forearm on doorframe, step forward gently. 30s.", "stretch"),
            ex("Shoulder Cross-Body Stretch", 1, 0, "Pull arm across chest gently. 30s each arm.", "stretch")
        ]; 
    },
    
    recoveryStretchFull: function() {
        // Same as stretchBlock - keep it simple
        return this.stretchBlock();
    }
};

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
    
    const plankTargetTime = plankProg.targetTime || 30;
    
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
    const plankTargetTime = plankProg.targetTime || 30;
    
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
    const plankTargetTime = plankProg.targetTime || 30;
    main.push(Ex.plank(3, 0, isDeload ? Math.floor(plankTargetTime * 0.7) : plankTargetTime));
    
    return { warmups: warmups, main: main, isDeload: isDeload };
}

export async function planFriday() {
    // Friday - Lower Posterior Chain Focus
    const settings = await getSettings();
    const isDeload = await isDeloadWeek(settings.programStartDate);
    
    const plankProg = await getProgressionFor('Plank');
    const plankTargetTime = plankProg.targetTime || 30;
    
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
    
    if (workoutType === "monday") return await planMonday();
    if (workoutType === "tuesday") return await planTuesday();
    if (workoutType === "thursday") return await planThursday();
    if (workoutType === "friday") return await planFriday();
    if (workoutType === "recovery") return await planRecovery();
    if (workoutType === "rest") return await planRest();
    
    return await planRest();
}

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
}

async function processBodyweightRepsProgression(exercise) {
    // Use 'progressions' collection to store per-exercise consecutive successes
    const prog = await getProgressionFor(exercise.name);
    // Check if all sets meet or exceed target reps and none marked struggled
    const hitTarget = exercise.completedSets && exercise.completedSets.every(set => set.reps >= exercise.targetReps && !set.struggled);

    // Get required consecutive successes from settings
    const settings = await getSettings();
    const requiredConsecutive = parseInt(settings.weightIncreaseConsecutive) || 3;

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
    const increaseAmount = parseFloat(settings.weightIncreaseAmount) || 1.5;
    const requiredConsecutive = parseInt(settings.weightIncreaseConsecutive) || 3;
    
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
    
    // Scientific progression targets based on max reps for each level
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
    const currentTargetTime = prog.targetTime || 30;
    
    // Check if all sets meet or exceed target time and none marked struggled
    const hitTarget = exercise.completedSets && 
        exercise.completedSets.every(set => set.reps >= currentTargetTime && !set.struggled);

    // Get required consecutive successes from settings
    const settings = await getSettings();
    const requiredConsecutive = parseInt(settings.weightIncreaseConsecutive) || 3;

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

// ============================================================================
// LEGACY COMPATIBILITY (for existing code that may reference these)
// ============================================================================

export async function loadData() {
    // Legacy function - return combined data object for compatibility
    const user = await getUserProfile();
    const settings = await getSettings();
    
    return {
        user: user,
        settings: settings,
        goals: {
            targetWeight: user.targetWeight,
            hangBestSec: user.bestHangTime
        },
        weights: user.bodyweightHistory || []
    };
}

export async function saveData(data) {
    // Legacy function - not needed with NeDB but kept for compatibility
    console.log('saveData called (deprecated - using NeDB directly)');
}

export async function resetData() {
    // Reset all collections
    try {
        await window.db.remove('workouts', {}, { multi: true });
        await window.db.remove('loads', {}, { multi: true });
        await window.db.remove('progressions', {}, { multi: true });
        await window.db.remove('user', {}, { multi: true });
        await window.db.remove('settings', {}, { multi: true });
        return { ok: true };
    } catch (e) {
        console.error('resetData error', e);
        return { ok: false, error: String(e) };
    }
}

// Ensure all load records include the consecutiveSuccesses field (safe migration)
export async function ensureLoadsMigration() {
    try {
        const loads = await window.db.find('loads', {});
        if (!loads || loads.length === 0) return { updated: 0 };
        let updated = 0;
        for (const l of loads) {
            if (l.consecutiveSuccesses === undefined) {
                await window.db.update(
                    'loads',
                    { _id: l._id },
                    { $set: { consecutiveSuccesses: 0 } }
                );
                updated += 1;
            }
        }
        return { updated };
    } catch (e) {
        console.error('ensureLoadsMigration error', e);
        return { updated: 0, error: String(e) };
    }
}