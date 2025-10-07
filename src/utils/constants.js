// Application constants

// ============================================================================
// TIMING CONSTANTS
// ============================================================================

export const TIMING = {
    PLANK_DEFAULT_SECONDS: 5,
    STRENGTH_REST_SECONDS: 120,
    EASY_REST_SECONDS: 90,
    DELOAD_WEEKS_INTERVAL: 8
};

// ============================================================================
// PROGRESSION CONSTANTS
// ============================================================================

export const PROGRESSION = {
    DEFAULT_WEIGHT_INCREASE: 1.5,
    REQUIRED_CONSECUTIVE_SUCCESSES: 3,
    DELOAD_MULTIPLIER: 0.7,
    DEFAULT_STARTING_WEIGHT: 15
};

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

export function getImgKey(name) { 
    return IMG_MAP[name] || "stretch"; 
}

export function setDemoImageFor(demoEl, ex) {
    try {
        var key = getImgKey(ex.name);
        var basePath = 'src/assets/exercises/' + key;
        
        // For now, just use JPG since we don't have animated versions
        // TODO: Add WebP/GIF support when animated versions are available
        var imagePaths = [
            basePath + '.jpg'    // Static images
        ];
        
        // Function to try loading images in priority order
        function tryLoadImage(paths, index = 0) {
            if (index >= paths.length) {
                // All formats failed, show placeholder
                demoEl.innerHTML = '<div style="display:flex; align-items:center; justify-content:center; height:100%; color:#666; font-size: 16px; text-align: center; padding: 20px;">' + ex.name + '<br><small style="margin-top: 8px; opacity: 0.7;">Image not available</small></div>';
                return;
            }
            
            var img = new Image();
            img.onload = function() {
                // Success! Use this image
                var imgStyle = 'width:100%; height:100%; object-fit: cover; border-radius: 8px;';
                
                // Add special styling for animated formats
                if (paths[index].endsWith('.webp') || paths[index].endsWith('.gif')) {
                    imgStyle += ' image-rendering: auto;'; // Ensure smooth animation
                }
                
                demoEl.innerHTML = '<img src="' + paths[index] + '" style="' + imgStyle + '" alt="' + ex.name + '">';
            };
            img.onerror = function() {
                // This format failed, try next one
                tryLoadImage(paths, index + 1);
            };
            img.src = paths[index];
        }
        
        tryLoadImage(imagePaths);
        
    } catch (e) {
        console.error('setDemoImageFor error', e);
        demoEl.innerHTML = '<div style="display:flex; align-items:center; justify-content:center; height:100%; color:#666;">Image not available</div>';
    }
}