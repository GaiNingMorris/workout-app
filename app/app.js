/* NeuroLink Desktop - app.js (Muscle Building Program for Age 52)
   Complete working version with improvements
*/

(function () {
  "use strict";

  // --------- Utility Functions ---------
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function fmtClock(total) {
    var m = Math.floor(total / 60), s = total % 60;
    return pad2(m) + ":" + pad2(s);
  }
  function round05(n) { return Math.round(n * 2) / 2; }
  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }
  function toISO(d) { return d.toISOString().slice(0, 10); }
  function addDays(d, n) { 
    var z = new Date(d); 
    z.setDate(z.getDate() + n); 
    return z; 
  }
  function dayName(d) { 
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()]; 
  }

  // --------- DOM Helper ---------
  function el(tag, props, children) {
    try {
      var element = document.createElement(tag);
      
      if (props) {
        Object.keys(props).forEach(function (key) {
          if (key === "class") {
            element.className = props[key];
          } else if (key === "style") {
            element.setAttribute("style", props[key]);
          } else if (key.startsWith("on") && typeof props[key] === "function") {
            element.addEventListener(key.slice(2), props[key]);
          } else {
            element[key] = props[key];
          }
        });
      }
      
      if (children) {
        children.forEach(function (child) { 
          if (!child) return;
          if (typeof child === "string") {
            element.appendChild(document.createTextNode(child));
          } else if (child.nodeType) {
            element.appendChild(child);
          } else {
            console.error("Invalid child type:", typeof child, child);
          }
        });
      }
      
      return element;
    } catch (error) {
      console.error("Error creating element:", error, "tag:", tag);
      return document.createElement("div");
    }
  }

  // --------- Storage ---------
  var Store = {
    KEY: "nl_working",
    load: function () {
      try { 
        var raw = localStorage.getItem(this.KEY); 
        return raw ? JSON.parse(raw) : null; 
      } catch (e) { 
        console.error("Failed to load data:", e);
        return null; 
      }
    },
    save: function (data) { 
      try {
        localStorage.setItem(this.KEY, JSON.stringify(data)); 
      } catch (e) {
        console.error("Failed to save data:", e);
      }
    },
    reset: function () { 
      localStorage.removeItem(this.KEY); 
    }
  };

  // --------- Default Data ---------
  function defaultData() {
    return {
      goals: { targetWeight: 165, hangBestSec: 0, toeTouchCm: null },
      settings: { restGood: 120, restEasy: 90 },
      loads: {
        "Bench-Supported Dumbbell Press": 15,
        "Seated Dumbbell Row": 15,
        "Seated Dumbbell Shoulder Press": 12,
        "Dumbbell Curl": 12
      },
      groupConfig: { upperA:{}, lowerB:{}, upperC:{}, easy:{}, stretch:{} },
      streaks: { fails: {} },
      logs: [],
      weights: [{ date: todayISO(), weight: 262 }]
    };
  }

  // --------- Exercise Templates ---------
  function latestWeight(app) {
    var arr = app.data.weights || [];
    return arr.length ? arr[arr.length - 1].weight : null;
  }

  function ex(name, sets, reps, how, type, light) {
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

  var Ex = {
    trxSquat: function (sets, reps) {
      return ex("TRX Assisted Squat", sets, reps, "Hold TRX straps, sit back, pain-free range. 2s down/2s up.", "lower");
    },
    dbPress: function (sets, reps, name, light) {
      return ex(name, sets, reps, "Bench 15-30° or flat. Wrists neutral.", "upper", light);
    },
    dbRow: function (sets, reps, name, light) {
      return ex(name, sets, reps, "Chest-supported on bench. Elbows to back pockets.", "upper", light);
    },
    dbShoulder: function (sets, reps, name, light) {
      return ex(name, sets, reps, "Seated press in pain-free range.", "upper", light);
    },
    dbCurl: function (sets, reps, name, light) {
      return ex(name || "Dumbbell Curl", sets, reps, "Elbows by sides. Full control.", "upper", light);
    },
    dbRDL: function (sets, reps) {
      return ex("DB RDL (hip hinge)", sets, reps, "Soft knees, hinge at hips, neutral back; dumbbells slide along thighs/shins.", "lower");
    },
    pushUp: function (sets, reps) {
      return ex("Push-Up", sets, reps, "Start with wall/knee version if needed. Progress to full push-ups.", "upper");
    },
    plank: function (sets, seconds) {
      var o = ex("Plank", sets, 0, "Hold strong position. Start with 20-30s, build to 60s holds.", "none");
      o.targetReps = 0; o.targetText = String(seconds) + "s holds"; return o;
    },
    barHang: function (sets, seconds) {
      var o = ex("Bar Hang", sets, 0, "Use power tower. Accumulate holds.", "upper");
      o.targetReps = 0; o.targetText = String(seconds) + "s holds"; return o;
    },
    assistedChin: function (sets, reps) {
      return ex("Assisted Chin-Up", sets, reps, "Use assist or feet on step. Smooth pulls; no jerking.", "upper");
    },
    stretchBlock: function () {
      return [
        ex("Hamstring Stretch", 1, 0, "Toe reach—gentle 20-30s × 2 rounds.", "none"),
        ex("Calf Stretch", 1, 0, "Wall or step—20-30s × 2 rounds.", "none"),
        ex("Hip Flexor Stretch", 1, 0, "Half-kneel or standing—20-30s × 2 rounds.", "none")
      ];
    }
  };

  // --------- Group Configuration ---------
  function ensureGroupConfig(data) {
    if (!data.groupConfig) data.groupConfig = {};
    ["upperA","lowerB","upperC","easy","stretch"].forEach(function(k){
      if (!data.groupConfig[k]) data.groupConfig[k] = {};
    });
  }

  function byName(list){ 
    var m={}; 
    for(var i=0;i<list.length;i++){ 
      m[list[i].name]=list[i]; 
    } 
    return m; 
  }

  function createGenericExercise(name, sets, reps){
    var o = ex(name, sets||3, reps||8, "", "upper");
    if (name.toLowerCase().indexOf("stretch")>=0) { 
      o.type="none"; 
      o.targetReps=0; 
      o.targetText="2-3 min total"; 
    }
    return o;
  }

  function applyGroupEditor(list, groupKey, app){
    try{
      ensureGroupConfig(app.data);
      var cfg = app.data.groupConfig[groupKey] || {};
      var baseMap = byName(list);
      
      list = list.filter(function(it){
        var c = cfg[it.name]; 
        if (!c) return true; 
        if (c.enabled===false) return false; 
        return true;
      });
      
      for (var i=0;i<list.length;i++){
        var it = list[i], c = cfg[it.name];
        if (c && c.enabled!==false){
          if (typeof c.sets==="number" && c.sets>0) it.sets = c.sets;
          if (typeof c.reps==="number" && c.reps>=0){
            it.targetReps = c.reps; 
            it.reps = c.reps;
            it.targetText = c.reps ? (it.sets + "×" + c.reps) : (it.name.indexOf("Stretch")>=0 ? "2-3 min total" : "");
          }
        }
      }
      
      Object.keys(cfg).forEach(function(name){
        var c = cfg[name]; 
        if (!c || c.enabled===false) return;
        if (!baseMap[name]) list.push(createGenericExercise(name, c.sets, c.reps));
      });
      
      return list;
    }catch(e){ 
      return list; 
    }
  }

  // --------- Workout Plans ---------
  function planUpperA(app) {
    var w = latestWeight(app), canHang = (w !== null && w <= 200), chinUnlocked = canHang && (app.data.goals.hangBestSec || 0) >= 30;
    var list = [
      Ex.dbPress(3, 8, "Bench-Supported Dumbbell Press"),
      Ex.dbRow(3, 10, "Seated Dumbbell Row"),
      Ex.pushUp(2, 8),
      Ex.plank(2, 30)
    ];
    if (chinUnlocked) list.push(Ex.assistedChin(2, 5));
    else if (canHang) list.push(Ex.barHang(2, 20));
    list = list.concat(Ex.stretchBlock());
    return applyGroupEditor(list, "upperA", app);
  }

  function planLowerB(app) {
    var list = [
      Ex.trxSquat(3, 8),
      Ex.dbRDL(3, 10),
      Ex.plank(2, 30)
    ];
    list = list.concat(Ex.stretchBlock());
    return applyGroupEditor(list, "lowerB", app);
  }

  function planUpperC(app) {
    var w = latestWeight(app), canHang = (w !== null && w <= 200), chinUnlocked = canHang && (app.data.goals.hangBestSec || 0) >= 30;
    var list = Ex.stretchBlock().concat([
      Ex.dbShoulder(3, 8, "Seated Dumbbell Shoulder Press"),
      Ex.dbCurl(3, 10, "Dumbbell Curl"),
      Ex.pushUp(2, 10),
      Ex.plank(2, 45)
    ]);
    if (chinUnlocked) list.push(Ex.assistedChin(2, 5));
    else if (canHang) list.push(Ex.barHang(2, 25));
    return applyGroupEditor(list, "upperC", app);
  }

  function planEasy(app) {
    return applyGroupEditor(Ex.stretchBlock().concat([
      Ex.dbPress(2, 10, "Bench-Supported Dumbbell Press", true),
      Ex.dbRow(2, 10, "Seated Dumbbell Row", true),
      Ex.pushUp(1, 5),
      Ex.plank(1, 20)
    ]), "easy", app);
  }

  function planRecovery() { 
    return Ex.stretchBlock(); 
  }

  function workoutTypeForDate(d) {
    var dow = d.getDay();
    if (dow === 1) return "upperA"; // Mon
    if (dow === 3) return "lowerB"; // Wed
    if (dow === 5) return "upperC"; // Fri
    return null;
  }

  // --------- Main App ---------
  var App = {
    state: { tab: "today" },
    data: null,

    init: function () {
      var d = Store.load();
      if (!d) { 
        d = defaultData(); 
        Store.save(d); 
      }
      ensureGroupConfig(d);
      this.data = d;
      this.render();
    },

    save: function () { 
      Store.save(this.data); 
    },
    
    setTab: function (t) { 
      this.state.tab = t; 
      this.render(); 
    },

    lastWorkoutDate: function () { 
      var L = this.data.logs; 
      return L.length ? new Date(L[L.length - 1].date) : null; 
    },
    
    daysSinceLast: function () {
      var last = this.lastWorkoutDate();
      if (!last) return 999;
      var diff = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
      return Math.floor(diff);
    },

    buildToday: function () {
      var today = new Date();
      var workoutType = workoutTypeForDate(today);
      if (workoutType === "upperA") return { mode: "upperA", variant: "A", steps: planUpperA(this) };
      if (workoutType === "lowerB") return { mode: "lowerB", variant: "B", steps: planLowerB(this) };
      if (workoutType === "upperC") return { mode: "upperC", variant: "C", steps: planUpperC(this) };
      return { mode: "recovery", variant: null, steps: planRecovery() };
    },

    render: function () {
      try {
        var root = document.getElementById("app");
        if (!root) {
          console.error("Could not find #app element");
          return;
        }
        
        root.innerHTML = "";
        root.appendChild(this.navbar());
        
        var currentPage;
        if (this.state.tab === "today") currentPage = this.pageToday();
        else if (this.state.tab === "schedule") currentPage = this.pageSchedule();
        else if (this.state.tab === "goals") currentPage = this.pageGoals();
        else if (this.state.tab === "logs") currentPage = this.pageLogs();
        else if (this.state.tab === "settings") currentPage = this.pageSettings();
        else if (this.state.tab === "groups") currentPage = this.pageGroups();
        else currentPage = this.pageToday();
        
        if (currentPage && currentPage.nodeType) {
          root.appendChild(currentPage);
        } else {
          console.error("Invalid page element returned for tab:", this.state.tab, currentPage);
          root.appendChild(el("div", { class: "card" }, [
            el("h2", {}, ["Error"]),
            el("div", {}, ["Failed to load page: " + this.state.tab])
          ]));
        }
      } catch (error) {
        console.error("Render error:", error);
        var root = document.getElementById("app");
        if (root) {
          root.innerHTML = '<div class="card"><h2>Application Error</h2><p>Check console for details. <button onclick="location.reload()">Reload</button></p></div>';
        }
      }
    },

    navbar: function () {
      var self = this;
      function mk(label, id) {
        return el("div", {
          class: "tab" + (self.state.tab === id ? " active" : ""),
          onclick: function () { self.setTab(id); }
        }, [label]);
      }
      
      return el("div", { class: "nav" }, [
        mk("Today", "today"),
        mk("Schedule", "schedule"),
        mk("Goals", "goals"),
        mk("Logs", "logs"),
        mk("Settings", "settings"),
        mk("Groups", "groups")
      ]);
    },

    pageToday: function () {
      var self = this;
      var plan = this.buildToday();
      var mode = plan.mode, variant = plan.variant;
      var steps = plan.steps.slice();
      var restSecs = (mode.indexOf("upper") >= 0 || mode === "lowerB") ? this.data.settings.restGood : this.data.settings.restEasy;

      var session = { date: new Date().toISOString(), mode: mode, items: [] };

      var subtitle =
        mode === "upperA" ? "Push & Pull - Chest & Back Focus" :
        mode === "lowerB" ? "Power Legs - Squats & Deadlifts" :
        mode === "upperC" ? "Arms & Core - Shoulders & Biceps" :
        mode === "easy" ? "Easy Day (recovery mode)" :
        mode === "recovery" ? "Recovery / Stretch" :
        "Today";

      var header = el("div", { class: "brand" }, [
        el("div", { class: "dot" }, []),
        el("h2", {}, ["Today"]),
        el("span", { class: "sub" }, [subtitle])
      ]);

      // Left: demo image + rest timer
      var demo = el("div", { class: "pic" }, []);
      function getImgKey(exName) {
       var map = {
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
        return map[exName] || "stretch";
      }
      function setDemo(ex) {
        var key = getImgKey(ex.name);
        demo.style.backgroundImage = "url('./assets/exercises/" + key + ".jpg')";
      }
      if (steps.length) setDemo(steps[0]);

      var timerBadge = el("div", { class: "badge" }, ["Ready"]);
      var restTimer = null, restRemain = 0;
      function startRest(s) {
        if (restTimer) clearInterval(restTimer);
        restRemain = s;
        timerBadge.textContent = fmtClock(restRemain);
        restTimer = setInterval(function () {
          restRemain -= 1;
          if (restRemain <= 0) { 
            clearInterval(restTimer); 
            restTimer = null; 
            timerBadge.textContent = "Ready"; 
          } else { 
            timerBadge.textContent = fmtClock(restRemain); 
          }
        }, 1000);
      }

      // Checklist
      var list = el("div", { class: "list" }, []);
      steps.forEach(function (ex) {
        var perDB = (ex.type === "upper") ? (self.data.loads[ex.name] || 15) : 0;

        var title = el("div", { class: "title" }, [
          el("span", { class: "badge" }, [ex.type === "upper" ? "Str" : ex.type === "lower" ? "Leg" : "Mob"]),
          " " + ex.name + " ",
          el("span", { class: "badge" }, [ex.targetText || ""])
        ]);
        var meta = el("div", { class: "meta" }, [
          (ex.type === "upper" && ex.targetReps > 0) ? ("Target load: " + perDB + " lb per DB") : "",
          ex.light ? " (light)" : ""
        ]);
        var progress = el("div", { class: "note" }, ["Progress: 0/" + ex.sets + " sets"]);

        var struggled = el("input", { type: "checkbox" }, []);
        var repsInput = el("input", { type: "number", min: "0", style: "width:60px", placeholder: ex.targetReps.toString() });
        var lbl = el("label", { class: "note" }, ["Actual reps:"]);
        var doneBtn = el("button", { class: "btn small" }, ["Mark done"]);

        function suggestLoad(exObj) {
          if (exObj.type !== "upper") return 0;
          var base = self.data.loads[exObj.name] || 0;
          var fails = (self.data.streaks.fails[exObj.name] || 0);
          if (fails >= 2) return round05(base * 0.95);
          var last = findLastFor(exObj.name);
          if (last && hitAllTargets(last, exObj)) return base + 2.5;
          return base;
        }
        function findLastFor(exName) {
          var logs = self.data.logs;
          for (var i = logs.length - 1; i >= 0; i--) {
            var w = logs[i];
            for (var j = 0; j < w.items.length; j++) {
              if (w.items[j].ex === exName) return w;
            }
          }
          return null;
        }
        function hitAllTargets(workout, exObj) {
          var items = workout.items.filter(function (it) { return it.ex === exObj.name; });
          if (!items.length) return false;
          var target = exObj.targetReps || 0;
          for (var k = 0; k < items.length; k++) {
            var it = items[k];
            if ((it.reps || 0) < target || it.fail) return false;
          }
          return true;
        }

        doneBtn.addEventListener("click", function () {
          setDemo(ex);
          var actualReps = parseInt(repsInput.value) || ex.targetReps;
          var weight = (ex.type === "upper") ? suggestLoad(ex) : 0;
          var failed = actualReps < ex.targetReps || struggled.checked;
          
          session.items.push({ 
            ex: ex.name, 
            reps: actualReps, 
            targetReps: ex.targetReps,
            weight: weight, 
            fail: failed 
          });
          
          ex.curDone = (ex.curDone || 0) + 1;
          progress.textContent = "Progress: " + ex.curDone + "/" + ex.sets + " sets";
          struggled.checked = false;
          repsInput.value = "";
          startRest(restSecs);
          if (ex.curDone >= ex.sets) doneBtn.disabled = true;
        });

        var row = el("div", { class: "item", onclick: function () { setDemo(ex); } }, [
          title, meta, 
          el("div", { class: "row" }, [lbl, repsInput, el("label", { class: "note" }, ["Struggled?"]), struggled, doneBtn]), 
          progress
        ]);
        list.appendChild(row);
      });

      var finishBtn = el("button", { class: "btn primary" }, ["Finish Workout"]);
      finishBtn.addEventListener("click", function () {
        if (restTimer) { clearInterval(restTimer); restTimer = null; }

        // Update loads & streaks by exercise
        var byEx = {};
        session.items.forEach(function (it) { if (!byEx[it.ex]) byEx[it.ex] = []; byEx[it.ex].push(it); });

        Object.keys(byEx).forEach(function (name) {
          var exMeta = null;
          for (var i = 0; i < steps.length; i++) if (steps[i].name === name) { exMeta = steps[i]; break; }
          if (!exMeta || exMeta.type !== "upper") return;

          var items = byEx[name], target = exMeta.targetReps || 0, success = true;
          for (var k = 0; k < items.length; k++) {
            var it = items[k];
            if ((it.reps || 0) < target || it.fail) { success = false; break; }
          }

          var cur = App.data.loads[name] || 0;
          if (success) {
            App.data.streaks.fails[name] = 0;
            App.data.loads[name] = Math.max(cur, round05(cur + 2.5));
          } else {
            var fs = (App.data.streaks.fails[name] || 0) + 1;
            if (fs >= 2) { App.data.loads[name] = round05(Math.max(0, cur * 0.95)); fs = 0; }
            App.data.streaks.fails[name] = fs;
          }
        });

        App.data.logs.push(session);
        App.save();

        container.innerHTML = "";
        container.appendChild(el("div", { class: "card" }, [
          el("h2", {}, ["Workout saved"]),
          el("div", {}, ["Mode: " + mode]),
          el("div", {}, ["Sets logged: " + session.items.length]),
          el("div", { class: "hr" }, []),
          el("div", { class: "note" }, ["Tip: Rest 2-3 minutes between sets for strength. Track progressive overload!"])
        ]));
      });

      var left = el("div", { class: "card" }, [
        demo,
        el("div", { class: "row" }, [
          el("span", { class: "badge" }, ["Rest"]),
          timerBadge
        ])
      ]);

      var right = el("div", { class: "card" }, [
        el("div", { class: "row" }, [
          el("h3", {}, ["Workout Plan - " + (
            mode === "upperA" ? "Push & Pull" :
            mode === "lowerB" ? "Power Legs" :
            mode === "upperC" ? "Arms & Core" :
            mode.charAt(0).toUpperCase() + mode.slice(1)
          )])
        ]),
        el("div", { class: "hr" }, []),
        list,
        el("div", { class: "hr" }, []),
        finishBtn
      ]);

      var container = el("div", {}, [
        header,
        el("div", { class: "grid" }, [left, right])
      ]);
      return container;
    },

    pageSchedule: function () {
      var self = this;
      var root = el("div", {}, []);
      root.appendChild(el("div", { class: "brand" }, [
        el("div", { class: "dot" }, []),
        el("h2", {}, ["Schedule"]),
        el("span", { class: "sub" }, ["Your muscle-building weekly plan"])
      ]));

      function plannedModeFor(dateObj) {
        var dow = dateObj.getDay();
        if (dow === 0) return { mode: "rest", variant: null };
        if (dow === 6) return { mode: "stretch", variant: null };
        if (dow === 2 || dow === 4) return { mode: "recovery", variant: null };
        if (dow === 1) return { mode: "upperA", variant: "A" };
        if (dow === 3) return { mode: "lowerB", variant: "B" };
        if (dow === 5) return { mode: "upperC", variant: "C" };
        return { mode: "recovery", variant: null };
      }

      function planFor(mode, variant) {
        if (mode === "upperA") return planUpperA(self);
        if (mode === "lowerB") return planLowerB(self);
        if (mode === "upperC") return planUpperC(self);
        if (mode === "recovery" || mode === "stretch") return planRecovery();
        if (mode === "easy") return planEasy(self);
        return [];
      }

      var daysWrap = el("div", { class: "list" }, []);
      var today = new Date();
      for (var i = 0; i < 7; i++) {
        (function (i) {
          var d = addDays(today, i);
          var pm = plannedModeFor(d);
          var label = dayName(d) + " • " + (d.getMonth() + 1) + "/" + d.getDate();
          var subtitle =
            pm.mode === "upperA" ? "Push & Pull - Chest & Back Focus" :
            pm.mode === "lowerB" ? "Power Legs - Squats & Deadlifts" :
            pm.mode === "upperC" ? "Arms & Core - Shoulders & Biceps" :
            pm.mode === "easy" ? "Easy (recovery mode)" :
            pm.mode === "recovery" ? "Recovery / Mobility" :
            pm.mode === "stretch" ? "Stretch-only" :
            "Full Rest";

          var plan = planFor(pm.mode, pm.variant);

          var previewList = el("div", { class: "note" }, []);
          if (plan.length) {
            for (var j = 0; j < plan.length; j++) {
              var p = plan[j];
              var note = p.name;
              if (p.targetText) note += " — " + p.targetText;
              previewList.appendChild(el("div", {}, ["• " + note]));
            }
          } else {
            previewList.appendChild(el("div", {}, ["• Rest"]));
          }

          var card = el("div", { class: "item" }, [
            el("div", { class: "title" }, [
              el("span", { class: "badge" }, [dayName(d)]),
              " " + label
            ]),
            el("div", { class: "meta" }, [subtitle]),
            previewList
          ]);

          daysWrap.appendChild(card);
        })(i);
      }

      root.appendChild(el("div", { class: "card" }, [
        el("div", { class: "note" }, ["Muscle-building rhythm: Mon = Push & Pull • Wed = Power Legs • Fri = Arms & Core • Tue/Thu = Recovery • Sat = Stretch • Sun = Rest"]),
        el("div", { class: "hr" }, []),
        daysWrap,
        el("div", { class: "hr" }, []),
        el("div", { class: "note" }, ["Each muscle group trained 2x per week for optimal growth. Rest 2-3 minutes between sets."])
      ]));

      return root;
    },

    pageGoals: function () {
      var self = this, d = this.data;

      var firstLog = d.logs.length ? new Date(d.logs[0].date) : new Date();
      var daysSinceStart = Math.floor((Date.now() - firstLog.getTime()) / (1000 * 60 * 60 * 24));
      var weeksSinceStart = Math.floor(daysSinceStart / 7);

      function getExpectedGains(weeks) {
        if (weeks <= 2) return { strength: "5-10%", visible: "Minimal", note: "Neural adaptations starting" };
        if (weeks <= 8) return { strength: "15-25%", visible: "Noticeable", note: "Visible changes emerging" };
        if (weeks <= 24) return { strength: "25-35%", visible: "Significant", note: "Major muscle development" };
        if (weeks <= 52) return { strength: "35-50%", visible: "Substantial", note: "1-year transformation complete" };
        if (weeks <= 104) return { strength: "50-70%", visible: "Advanced", note: "Year 2: Refined physique" };
        if (weeks <= 156) return { strength: "60-80%", visible: "Expert", note: "Year 3: Peak development" };
        if (weeks <= 260) return { strength: "70-90%", visible: "Mastery", note: "Years 4-5: Strength mastery" };
        return { strength: "80%+ gains", visible: "Lifetime", note: "Decades of health & vitality" };
      }

      var expected = getExpectedGains(weeksSinceStart);

      function getActualProgress() {
        var exercises = ["Bench-Supported Dumbbell Press", "Seated Dumbbell Row", "Dumbbell Curl"];
        var progress = {};
        exercises.forEach(function(ex) {
          var current = d.loads[ex] || 15;
          var initial = 15;
          var gain = current > initial ? ((current - initial) / initial * 100).toFixed(0) : "0";
          progress[ex] = { current: current, gain: gain + "%" };
        });
        return progress;
      }

      var actualProgress = getActualProgress();

      var weightInput = el("input", { class: "input", placeholder: "Weight (lb)" }, []);
      var addBtn = el("button", { class: "btn" }, ["Add Today"]);
      addBtn.addEventListener("click", function () {
        var w = parseFloat(weightInput.value); 
        if (!w) return;
        var day = todayISO(), found = null;
        for (var i = 0; i < d.weights.length; i++) if (d.weights[i].date === day) found = d.weights[i];
        if (found) found.weight = w; 
        else d.weights.push({ date: day, weight: w });
        self.save(); 
        self.render();
      });

      var hangInput = el("input", { class: "input", placeholder: "Best hang (sec)", value: String(d.goals.hangBestSec || "") }, []);
      var saveHang = el("button", { class: "btn" }, ["Save Hang Best"]);
      saveHang.addEventListener("click", function () {
        var v = parseFloat(hangInput.value);
        d.goals.hangBestSec = v ? v : 0; 
        self.save();
      });

      var targetWeight = el("input", { class: "input", placeholder: "Overall bodyweight goal (lb)", value: String(d.goals.targetWeight || 165) }, []);
      var saveTarget = el("button", { class: "btn" }, ["Save Overall Goal"]);
      saveTarget.addEventListener("click", function () {
        var v = parseFloat(targetWeight.value);
        d.goals.targetWeight = v ? v : 165; 
        self.save();
      });

      var left = el("div", { class: "card" }, [
        el("h3", {}, ["Progress Tracking"]),
        el("div", { class: "note" }, ["Week " + weeksSinceStart + " • " + daysSinceStart + " days since start"]),
        el("div", { class: "hr" }, []),
        el("div", { style: "margin: 10px 0;" }, [
          el("strong", {}, ["Expected at Week " + weeksSinceStart + ":"]),
          el("div", { class: "note" }, ["• Strength: " + expected.strength]),
          el("div", { class: "note" }, ["• Muscle: " + expected.visible]),
          el("div", { class: "note" }, ["• " + expected.note])
        ]),
        el("div", { class: "hr" }, []),
        el("div", { style: "margin: 10px 0;" }, [
          el("strong", {}, ["Your Actual Progress:"])
        ].concat(
          Object.keys(actualProgress).map(function(ex) {
            var p = actualProgress[ex];
            return el("div", { class: "note" }, ["• " + ex + ": " + p.current + "lb (" + p.gain + " gain)"]);
          })
        )),
        el("div", { class: "hr" }, []),
        el("div", { class: "kv" }, [el("label", {}, ["Target Weight"]), targetWeight, saveTarget]),
        el("div", { class: "kv" }, [el("label", {}, ["Best Hang (sec)"]), hangInput, saveHang])
      ]);

      var tbody = [];
      for (var i = d.weights.length - 1; i >= 0 && i >= d.weights.length - 10; i--) {
        tbody.push(el("tr", {}, [ 
          el("td", {}, [d.weights[i].date]), 
          el("td", {}, [String(d.weights[i].weight)]) 
        ]));
      }

      var right = el("div", { class: "card" }, [
        el("h3", {}, ["Body Weight Log"]),
        el("div", { class: "kv" }, [el("label", {}, ["Today's Weight"]), weightInput, addBtn]),
        el("div", { class: "hr" }, []),
        el("table", { class: "table" }, [
          el("thead", {}, [el("tr", {}, [el("th", {}, ["Date"]), el("th", {}, ["Weight"])])]),
          el("tbody", {}, tbody)
        ]),
        el("div", { class: "hr" }, []),
        el("div", { class: "note" }, ["Hangs unlock at ≤200 lb • Chin-ups unlock at ≥30s hang"])
      ]);

      return el("div", {}, [
        el("div", { class: "brand" }, [
          el("div", { class: "dot" }, []),
          el("h2", {}, ["Goals & Progress"]),
          el("span", { class: "sub" }, ["Track your muscle-building journey"])
        ]),
        el("div", { class: "grid" }, [left, right])
      ]);
    },

    pageLogs: function () {
      var rows = [], logs = this.data.logs.slice().reverse();
      for (var i = 0; i < logs.length; i++) {
        rows.push(el("tr", {}, [
          el("td", {}, [new Date(logs[i].date).toLocaleString()]),
          el("td", {}, [logs[i].mode]),
          el("td", {}, [String(logs[i].items.length)])
        ]));
      }
      return el("div", {}, [
        el("div", { class: "brand" }, [el("div", { class: "dot" }, []), el("h2", {}, ["Logs"])]),
        el("div", { class: "card" }, [
          el("table", { class: "table" }, [
            el("thead", {}, [el("tr", {}, [el("th", {}, ["Date"]), el("th", {}, ["Mode"]), el("th", {}, ["Sets"])])]),
            el("tbody", {}, rows)
          ])
        ])
      ]);
    },

    pageGroups: function () {
      var self = this;
      ensureGroupConfig(this.data);
      var groups = [
        { key: "upperA", label: "Push & Pull (Mon)" },
        { key: "lowerB", label: "Power Legs (Wed)" },
        { key: "upperC", label: "Arms & Core (Fri)" },
        { key: "stretch", label: "Stretch / Recovery" }
      ];
      var catalog = [
        "TRX Assisted Squat","Bench-Supported Dumbbell Press","Seated Dumbbell Row","Seated Dumbbell Shoulder Press",
        "Dumbbell Curl","Push-Up","Plank","Assisted Chin-Up","Bar Hang","DB RDL (hip hinge)","Hamstring Stretch","Calf Stretch","Hip Flexor Stretch"
      ];

      function getBasePlan(groupKey) {
        if (groupKey === "upperA") {
          return ["Bench-Supported Dumbbell Press", "Seated Dumbbell Row", "Push-Up", "Plank", "Bar Hang", "Hamstring Stretch", "Calf Stretch", "Hip Flexor Stretch"];
        }
        if (groupKey === "lowerB") {
          return ["TRX Assisted Squat", "DB RDL (hip hinge)", "Plank", "Hamstring Stretch", "Calf Stretch", "Hip Flexor Stretch"];
        }
        if (groupKey === "upperC") {
          return ["Seated Dumbbell Shoulder Press", "Dumbbell Curl", "Push-Up", "Plank", "Bar Hang", "Hamstring Stretch", "Calf Stretch", "Hip Flexor Stretch"];
        }
        if (groupKey === "stretch") {
          return ["Hamstring Stretch", "Calf Stretch", "Hip Flexor Stretch"];
        }
        return [];
      }

      function groupEditor(g){
        var cfg = self.data.groupConfig[g.key] || (self.data.groupConfig[g.key] = {});
        var baseNames = getBasePlan(g.key);
        
        var editor = el("div", { class: "item" });
        
        editor.appendChild(el("div",{class:"title"},[g.label]));
        editor.appendChild(el("div",{class:"meta"},[g.key + " (" + baseNames.length + " exercises)"]));
        editor.appendChild(el("div",{class:"note"},["Tip: Customize exercises and sets/reps. Uncheck to disable exercises."]));
        
        baseNames.forEach(function(name){
          var c = cfg[name] || (cfg[name] = { enabled:true });
          var enabled = (c.enabled!==false);
          var setsVal = (typeof c.sets==="number") ? c.sets : "";
          var repsVal = (typeof c.reps==="number") ? c.reps : "";
          
          var chk = el("input", { type:"checkbox", checked: enabled });
          chk.addEventListener("change", function() { c.enabled = !!this.checked; self.save(); });
          
          var sets = el("input", { type:"number", min:"0", style:"width:70px", value: setsVal, placeholder:"sets" });
          sets.addEventListener("input", function() { var v=parseInt(this.value,10); c.sets = isNaN(v)? null: v; self.save(); });
          
          var reps = el("input", { type:"number", min:"0", style:"width:70px", value: repsVal, placeholder:"reps" });
          reps.addEventListener("input", function() { var v=parseInt(this.value,10); c.reps = isNaN(v)? null: v; self.save(); });
          
          var removeBtn = el("button", { class: "btn danger" }, ["Remove"]);
          removeBtn.addEventListener("click", function() { c.enabled=false; self.save(); self.render(); });
          
          var row = el("div", { class: "row" });
          row.appendChild(chk);
          row.appendChild(el("div",{class:"title"},[name]));
          row.appendChild(el("span",{class:"note"},[" sets"]));
          row.appendChild(sets);
          row.appendChild(el("span",{class:"note"},[" reps"]));
          row.appendChild(reps);
          row.appendChild(removeBtn);
          
          editor.appendChild(row);
        });
        
        editor.appendChild(el("div",{class:"hr"},[]));
        
        var addSel = el("select", {});
        catalog.forEach(function(n) {
          addSel.appendChild(el("option", { value:n }, [n]));
        });
        
        var addInput = el("input", { type:"text", placeholder:"or type a custom exercise name", style:"width:260px" });
        var addBtn = el("button", { class: "btn" }, ["Add"]);
        addBtn.addEventListener("click", function() { 
          var name = addInput.value.trim() || addSel.value; 
          if(!name) return; 
          if(!cfg[name]) cfg[name]={enabled:true}; 
          else cfg[name].enabled=true; 
          if(catalog.indexOf(name)===-1) catalog.push(name); 
          self.save(); 
          self.render(); 
        });
        
        var controlsRow = el("div",{class:"row"});
        controlsRow.appendChild(el("span",{class:"note"},["Add:"]));
        controlsRow.appendChild(addSel);
        controlsRow.appendChild(addInput);
        controlsRow.appendChild(addBtn);
        editor.appendChild(controlsRow);
        
        return editor;
      }
      
      var groupsList = el("div", { class: "list" }, []);
      groups.forEach(function(g) {
        groupsList.appendChild(groupEditor(g));
      });
      
      return el("div", { class: "grid groups" }, [
        el("div",{class:"card"},[ 
          el("div",{class:"title"},["Exercise Groups (Muscle Building Focus)"]), 
          groupsList
        ]),
        el("div",{class:"card"},[ 
          el("div",{class:"title"},["How it works"]), 
          el("div",{class:"note"},["Each muscle group is trained 2x per week. Customize sets/reps or disable exercises as needed."]) 
        ])
      ]);
    },

    pageSettings: function () {
      var self = this;
      var restGood = el("input", { class: "input", value: String(this.data.settings.restGood) }, []);
      var restEasy = el("input", { class: "input", value: String(this.data.settings.restEasy) }, []);

      var saveBtn = el("button", { class: "btn" }, ["Save"]);
      saveBtn.addEventListener("click", function () {
        self.data.settings.restGood = parseInt(restGood.value, 10) || 120;
        self.data.settings.restEasy = parseInt(restEasy.value, 10) || 90;
        self.save();
      });

      var reset = el("button", { class: "btn" }, ["Factory Reset"]);
      reset.addEventListener("click", function () { Store.reset(); location.reload(); });

      var left = el("div", { class: "card" }, [
        el("h3", {}, ["Rest Timers"]),
        el("div", { class: "kv" }, [el("label", {}, ["Strength training rest (sec)"]), restGood]),
        el("div", { class: "kv" }, [el("label", {}, ["Easy day rest (sec)"]), restEasy]),
        el("div", { class: "row" }, [saveBtn])
      ]);

      var right = el("div", { class: "card" }, [
        el("h3", {}, ["Data"]),
        el("div", { class: "note" }, ["Data is stored locally. Muscle building requires consistency - track your progress!"]),
        el("div", { class: "row" }, [reset])
      ]);

      return el("div", {}, [
        el("div", { class: "brand" }, [el("div", { class: "dot" }, []), el("h2", {}, ["Settings"]), el("span", { class: "sub" }, ["Optimize for muscle growth"])]),
        el("div", { class: "grid" }, [left, right])
      ]);
    }
  };

  // Initialize app when DOM is ready
  window.addEventListener("DOMContentLoaded", function () {
    try { 
      App.init(); 
      // Hide loading indicator and show app
      var loading = document.getElementById('loading');
      var app = document.getElementById('app');
      if (loading) loading.style.display = 'none';
      if (app) app.classList.add('loaded');
    } catch (err) {
      var root = document.getElementById("app");
      if (root) root.innerHTML = '<div class="card"><h2>Load Error</h2><p>' + String(err) + '</p></div>';
      console.error(err);
    }
  });

  window.addEventListener("error", function (e) {
    var root = document.getElementById("app");
    if (root) root.innerHTML = '<div class="card"><h2>Runtime Error</h2><p>' + String(e.message || e) + '</p></div>';
  });

  // Expose App for debugging (development only)
  if (typeof window !== 'undefined') {
    window.NeuroLinkApp = App;
  }

})();