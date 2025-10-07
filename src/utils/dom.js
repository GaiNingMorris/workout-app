// DOM utilities and basic helpers

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
// WORKOUT DISPLAY UTILITIES
// ============================================================================

export function getWorkoutDisplayName(template, isDeloadWeek = false) {
    var templateName = (template === 'monday' && 'Upper Push') ||
        (template === 'tuesday' && 'Lower Quad') ||
        (template === 'thursday' && 'Upper Pull') ||
        (template === 'friday' && 'Lower Posterior') ||
        (template === 'recovery' && 'Recovery') ||
        (template === 'rest' && 'Rest') || template;

    if (isDeloadWeek) templateName = '⚠️ ' + templateName + ' (Deload)';
    
    return templateName;
}

export function getWorkoutSubtitle(workoutType, isDeload = false) {
    var subtitle = '';
    if (workoutType === 'monday') subtitle = 'Upper Push - Chest, Shoulders, Triceps';
    else if (workoutType === 'tuesday') subtitle = 'Lower Quad - Squats & Glutes';
    else if (workoutType === 'thursday') subtitle = 'Upper Pull - Back & Biceps';
    else if (workoutType === 'friday') subtitle = 'Lower Posterior - Hamstrings & Glutes';
    else if (workoutType === 'recovery') subtitle = 'Recovery Day - Static Stretching';
    
    if (isDeload) subtitle = 'DELOAD WEEK - ' + subtitle;
    
    return subtitle;
}