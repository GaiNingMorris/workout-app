import { el, fmtClock, setDemoImageFor, suggestLoadFor, planUpperA, planLowerB, planUpperC, planRecovery, latestWeight } from '../utils/helpers.js';

export function renderToday(App) {
    var self = App;
    var plan = (function () {
        var today = new Date();
        var workoutType = (function (d) { var dow = d.getDay(); if (dow === 1) return 'upperA'; if (dow === 3) return 'lowerB'; if (dow === 5) return 'upperC'; return null; })(today);
        if (workoutType === 'upperA') return { mode: 'upperA', variant: 'A', steps: planUpperA(self.data) };
        if (workoutType === 'lowerB') return { mode: 'lowerB', variant: 'B', steps: planLowerB(self.data) };
        if (workoutType === 'upperC') return { mode: 'upperC', variant: 'C', steps: planUpperC(self.data) };
        return { mode: 'recovery', variant: null, steps: planRecovery() };
    })();

    var mode = plan.mode;
    var steps = plan.steps.slice();
    var restSecs = (mode.indexOf('upper') >= 0 || mode === 'lowerB') ? self.data.settings.restGood : self.data.settings.restEasy;
    var session = { date: new Date().toISOString(), mode: mode, items: [] };

    var subtitle = mode === 'upperA' ? 'Push & Pull - Chest & Back Focus' : mode === 'lowerB' ? 'Power Legs - Squats & Deadlifts' : mode === 'upperC' ? 'Arms & Core - Shoulders & Biceps' : mode === 'easy' ? 'Easy Day (recovery mode)' : mode === 'recovery' ? 'Recovery / Stretch' : 'Today';

    var header = el('div', { class: 'brand' }, [el('div', { class: 'dot' }, []), el('h2', {}, ['Today']), el('span', { class: 'sub' }, [subtitle])]);

    var demo = el('div', { class: 'pic' }, []);
    function setDemo(ex) { setDemoImageFor(demo, ex); }
    if (steps.length) setDemo(steps[0]);

    var timerBadge = el('div', { class: 'badge' }, ['Ready']);
    var restTimer = null, restRemain = 0;
    function startRest(s) {
        if (restTimer) clearInterval(restTimer);
        restRemain = s; timerBadge.textContent = fmtClock(restRemain);
        restTimer = setInterval(function () { restRemain -= 1; if (restRemain <= 0) { clearInterval(restTimer); restTimer = null; timerBadge.textContent = 'Ready'; } else { timerBadge.textContent = fmtClock(restRemain); } }, 1000);
    }

    var list = el('div', { class: 'list' }, []);
    steps.forEach(function (ex) {
        var perDB = (ex.type === 'upper') ? (self.data.loads[ex.name] || 15) : 0;
        var title = el('div', { class: 'title' }, [el('span', { class: 'badge' }, [ex.type === 'upper' ? 'Str' : ex.type === 'lower' ? 'Leg' : 'Mob']), ' ' + ex.name + ' ', el('span', { class: 'badge' }, [ex.targetText || ''])]);
        var meta = el('div', { class: 'meta' }, [(ex.type === 'upper' && ex.targetReps > 0) ? ('Target load: ' + perDB + ' lb per DB') : '', ex.light ? ' (light)' : '']);
        var progress = el('div', { class: 'note' }, ['Progress: 0/' + ex.sets + ' sets']);

        var struggled = el('input', { type: 'checkbox' }, []);
        var repsInput = el('input', { type: 'number', min: '0', style: 'width:60px', placeholder: ex.targetReps.toString() });
        var lbl = el('label', { class: 'note' }, ['Actual reps:']);
        var doneBtn = el('button', { class: 'btn small' }, ['Mark done']);

        doneBtn.addEventListener('click', function () {
            setDemo(ex);
            var actualReps = parseInt(repsInput.value) || ex.targetReps;
            var weight = (ex.type === 'upper') ? suggestLoadFor(self.data, ex) : 0;
            var failed = actualReps < ex.targetReps || struggled.checked;

            session.items.push({ ex: ex.name, reps: actualReps, targetReps: ex.targetReps, weight: weight, fail: failed });

            ex.curDone = (ex.curDone || 0) + 1;
            progress.textContent = 'Progress: ' + ex.curDone + '/' + ex.sets + ' sets';
            struggled.checked = false; repsInput.value = '';
            startRest(restSecs);
            if (ex.curDone >= ex.sets) doneBtn.disabled = true;
        });

        var row = el('div', { class: 'item', onclick: function () { setDemo(ex); } }, [title, meta, el('div', { class: 'row' }, [lbl, repsInput, el('label', { class: 'note' }, ['Struggled?']), struggled, doneBtn]), progress]);
        list.appendChild(row);
    });

    var finishBtn = el('button', { class: 'btn primary' }, ['Finish Workout']);
    finishBtn.addEventListener('click', function () {
        if (restTimer) { clearInterval(restTimer); restTimer = null; }

        var byEx = {};
        session.items.forEach(function (it) { if (!byEx[it.ex]) byEx[it.ex] = []; byEx[it.ex].push(it); });

        Object.keys(byEx).forEach(function (name) {
            var exMeta = null; for (var i = 0; i < steps.length; i++) if (steps[i].name === name) { exMeta = steps[i]; break; }
            if (!exMeta || exMeta.type !== 'upper') return;

            var items = byEx[name], target = exMeta.targetReps || 0, success = true;
            for (var k = 0; k < items.length; k++) { var it = items[k]; if ((it.reps || 0) < target || it.fail) { success = false; break; } }

            var cur = App.data.loads[name] || 0;
            if (success) { App.data.streaks.fails[name] = 0; App.data.loads[name] = Math.max(cur, Math.round((cur + 2.5) * 2) / 2); }
            else { var fs = (App.data.streaks.fails[name] || 0) + 1; if (fs >= 2) { App.data.loads[name] = Math.round(Math.max(0, cur * 0.95) * 2) / 2; fs = 0; } App.data.streaks.fails[name] = fs; }
        });

        App.data.logs.push(session);
        App.save();

        var container = el('div', {}, []);
        container.appendChild(el('div', { class: 'card' }, [el('h2', {}, ['Workout saved']), el('div', {}, ['Mode: ' + mode]), el('div', {}, ['Sets logged: ' + session.items.length]), el('div', { class: 'hr' }, []), el('div', { class: 'note' }, ['Tip: Rest 2-3 minutes between sets for strength. Track progressive overload!'])]));

        return container;
    });

    var left = el('div', { class: 'card' }, [demo, el('div', { class: 'row' }, [el('span', { class: 'badge' }, ['Rest']), timerBadge])]);
    var right = el('div', { class: 'card' }, [el('div', { class: 'row' }, [el('h3', {}, ['Workout Plan - ' + (mode === 'upperA' ? 'Push & Pull' : mode === 'lowerB' ? 'Power Legs' : mode === 'upperC' ? 'Arms & Core' : mode.charAt(0).toUpperCase() + mode.slice(1))])]), el('div', { class: 'hr' }, []), list, el('div', { class: 'hr' }, []), finishBtn]);

    return el('div', {}, [header, el('div', { class: 'grid' }, [left, right])]);
}
