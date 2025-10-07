// Exercise templates and definitions

import { TIMING } from './constants.js';

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
            ex("Wall Slides", 1, 10, "Back against wall, arms up and down. 10 reps total.", "warmup")
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
        
        // Progressive build-up to advancement targets: 2×25, 2×16, 2×12
        const repProgression = {
            wall: {
                baseReps: 10,     // Start with 2×10 = 20 total
                increments: [0, 3, 6, 10, 15], // 10→13→16→20→25 per set
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
                baseReps: 6,      // Start with 2×6 = 12 total (full push-ups ~60% harder)
                increments: [0, 1, 2, 3, 6],  // 6→7→8→9→12 per set
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