// Shared helpers for NeuroLink app (ES module)
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
    if (children) children.forEach(function (child) { if (!child) return; if (typeof child === "string") element.appendChild(document.createTextNode(child)); else if (child.nodeType) element.appendChild(child); });
    return element;
}

export const IMG_MAP = {
    "TRX Assisted Squat": "trx_squat",
    "Bench-Supported Dumbbell Press": "db_press",
    "Seated Dumbbell Row": "db_row",
    "Seated Dumbbell Shoulder Press": "db_shoulder",
    "Dumbbell Curl": "db_curl",
    "DB RDL (hip hinge)": "db_rdl",
    "Push-Up": "pushup",
    "Plank": "plank",
    "Bar Hang": "bar_hang",
    "Assisted Chin-Up": "chin_assist",
    "Hamstring Stretch": "hamstring_stretch",
    "Calf Stretch": "calf_stretch",
    "Hip Flexor Stretch": "hip_flexor_stretch"
};
export function getImgKey(name) { return IMG_MAP[name] || "stretch"; }
export function setDemoImageFor(demoEl, ex) { try { var key = getImgKey(ex.name); if (demoEl && demoEl.style) demoEl.style.backgroundImage = "url('./assets/exercises/" + key + ".jpg')"; } catch (e) { console.error('setDemoImageFor error', e); } }

// Simple storage helpers
const KEY = 'nl_working';
export function loadData() {
    try { var raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { console.error('loadData', e); return null; }
}
export function saveData(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { console.error('saveData', e); } }
export function resetData() { localStorage.removeItem(KEY); }

export function defaultData() {
    return {
        goals: { targetWeight: 165, hangBestSec: 0, toeTouchCm: null },
        settings: { restGood: 120, restEasy: 90 },
        loads: {
            "Bench-Supported Dumbbell Press": 15,
            "Seated Dumbbell Row": 15,
            "Seated Dumbbell Shoulder Press": 12,
            "Dumbbell Curl": 12
        },
        groupConfig: { upperA: {}, lowerB: {}, upperC: {}, easy: {}, stretch: {} },
        streaks: { fails: {} },
        logs: [],
        weights: [{ date: todayISO(), weight: 262 }]
    };
}

export function ensureGroupConfig(data) {
    if (!data.groupConfig) data.groupConfig = {};
    ["upperA", "lowerB", "upperC", "easy", "stretch"].forEach(function (k) { if (!data.groupConfig[k]) data.groupConfig[k] = {}; });
}

export function byName(list) { var m = {}; for (var i = 0; i < list.length; i++) m[list[i].name] = list[i]; return m; }
export function createGenericExercise(name, sets, reps) { var o = ex(name, sets || 3, reps || 8, "", "upper"); if (name.toLowerCase().indexOf("stretch") >= 0) { o.type = "none"; o.targetReps = 0; o.targetText = "2-3 min total"; } return o; }

// Exercise template helper
export function ex(name, sets, reps, how, type, light) {
    return { name: name, sets: sets, targetReps: reps || 0, targetText: reps ? (sets + "×" + reps) : (name.indexOf("Stretch") >= 0 ? "2-3 min total" : ""), reps: reps || 0, detail: how || "", type: type || "upper", light: !!light, curDone: 0 };
}

export const Ex = {
    trxSquat: function (sets, reps) { return ex("TRX Assisted Squat", sets, reps, "Hold TRX straps, sit back, pain-free range. 2s down/2s up.", "lower"); },
    dbPress: function (sets, reps, name, light) { return ex(name, sets, reps, "Bench 15-30° or flat. Wrists neutral.", "upper", light); },
    dbRow: function (sets, reps, name, light) { return ex(name, sets, reps, "Chest-supported on bench. Elbows to back pockets.", "upper", light); },
    dbShoulder: function (sets, reps, name, light) { return ex(name, sets, reps, "Seated press in pain-free range.", "upper", light); },
    dbCurl: function (sets, reps, name, light) { return ex(name || "Dumbbell Curl", sets, reps, "Elbows by sides. Full control.", "upper", light); },
    dbRDL: function (sets, reps) { return ex("DB RDL (hip hinge)", sets, reps, "Soft knees, hinge at hips, neutral back; dumbbells slide along thighs/shins.", "lower"); },
    pushUp: function (sets, reps) { return ex("Push-Up", sets, reps, "Start with wall/knee version if needed. Progress to full push-ups.", "upper"); },
    plank: function (sets, seconds) { var o = ex("Plank", sets, 0, "Hold strong position. Start with 20-30s, build to 60s holds.", "none"); o.targetReps = 0; o.targetText = String(seconds) + "s holds"; return o; },
    barHang: function (sets, seconds) { var o = ex("Bar Hang", sets, 0, "Use power tower. Accumulate holds.", "upper"); o.targetReps = 0; o.targetText = String(seconds) + "s holds"; return o; },
    assistedChin: function (sets, reps) { return ex("Assisted Chin-Up", sets, reps, "Use assist or feet on step. Smooth pulls; no jerking.", "upper"); },
    stretchBlock: function () { return [ex("Hamstring Stretch", 1, 0, "Toe reach—gentle 20-30s × 2 rounds.", "none"), ex("Calf Stretch", 1, 0, "Wall or step—20-30s × 2 rounds.", "none"), ex("Hip Flexor Stretch", 1, 0, "Half-kneel or standing—20-30s × 2 rounds.", "none")]; }
};

export function applyGroupEditor(list, groupKey, data) {
    try {
        ensureGroupConfig(data);
        var cfg = data.groupConfig[groupKey] || {};
        var baseMap = byName(list);
        list = list.filter(function (it) { var c = cfg[it.name]; if (!c) return true; if (c.enabled === false) return false; return true; });
        for (var i = 0; i < list.length; i++) {
            var it = list[i], c = cfg[it.name];
            if (c && c.enabled !== false) {
                if (typeof c.sets === "number" && c.sets > 0) it.sets = c.sets;
                if (typeof c.reps === "number" && c.reps >= 0) { it.targetReps = c.reps; it.reps = c.reps; it.targetText = c.reps ? (it.sets + "×" + c.reps) : (it.name.indexOf("Stretch") >= 0 ? "2-3 min total" : ""); }
            }
        }
        Object.keys(cfg).forEach(function (name) { var c = cfg[name]; if (!c || c.enabled === false) return; if (!baseMap[name]) list.push(createGenericExercise(name, c.sets, c.reps)); });
        return list;
    } catch (e) { return list; }
}

export function latestWeight(data) { var arr = data.weights || []; return arr.length ? arr[arr.length - 1].weight : null; }

export function workoutTypeForDate(d) { var dow = d.getDay(); if (dow === 1) return "upperA"; if (dow === 3) return "lowerB"; if (dow === 5) return "upperC"; return null; }

// find last workout containing exercise
export function findLastForApp(data, exName) { var logs = (data && data.logs) || []; for (var i = logs.length - 1; i >= 0; i--) { var w = logs[i]; for (var j = 0; j < w.items.length; j++) if (w.items[j].ex === exName) return w; } return null; }
export function hitAllTargetsFor(workout, exObj) { if (!workout) return false; var items = workout.items.filter(function (it) { return it.ex === exObj.name; }); if (!items.length) return false; var target = exObj.targetReps || 0; for (var k = 0; k < items.length; k++) { var it = items[k]; if ((it.reps || 0) < target || it.fail) return false; } return true; }
export function suggestLoadFor(data, exObj) { if (exObj.type !== "upper") return 0; var base = (data && data.loads && data.loads[exObj.name]) || 0; var fails = ((data && data.streaks && data.streaks.fails && data.streaks.fails[exObj.name]) || 0); if (fails >= 2) return round05(base * 0.95); var last = findLastForApp(data, exObj.name); if (last && hitAllTargetsFor(last, exObj)) return base + 2.5; return base; }

// Plans
export function planUpperA(data) { var w = latestWeight(data), canHang = (w !== null && w <= 200), chinUnlocked = canHang && (data.goals.hangBestSec || 0) >= 30; var list = [Ex.dbPress(3, 8, "Bench-Supported Dumbbell Press"), Ex.dbRow(3, 10, "Seated Dumbbell Row"), Ex.pushUp(2, 8), Ex.plank(2, 30)]; if (chinUnlocked) list.push(Ex.assistedChin(2, 5)); else if (canHang) list.push(Ex.barHang(2, 20)); list = list.concat(Ex.stretchBlock()); return applyGroupEditor(list, "upperA", data); }
export function planLowerB(data) { var list = [Ex.trxSquat(3, 8), Ex.dbRDL(3, 10), Ex.plank(2, 30)]; list = list.concat(Ex.stretchBlock()); return applyGroupEditor(list, "lowerB", data); }
export function planUpperC(data) { var w = latestWeight(data), canHang = (w !== null && w <= 200), chinUnlocked = canHang && (data.goals.hangBestSec || 0) >= 30; var list = Ex.stretchBlock().concat([Ex.dbShoulder(3, 8, "Seated Dumbbell Shoulder Press"), Ex.dbCurl(3, 10, "Dumbbell Curl"), Ex.pushUp(2, 10), Ex.plank(2, 45)]); if (chinUnlocked) list.push(Ex.assistedChin(2, 5)); else if (canHang) list.push(Ex.barHang(2, 25)); return applyGroupEditor(list, "upperC", data); }
export function planEasy(data) { return applyGroupEditor(Ex.stretchBlock().concat([Ex.dbPress(2, 10, "Bench-Supported Dumbbell Press", true), Ex.dbRow(2, 10, "Seated Dumbbell Row", true), Ex.pushUp(1, 5), Ex.plank(1, 20)]), "easy", data); }
export function planRecovery() { return Ex.stretchBlock(); }

export { KEY as STORAGE_KEY };
