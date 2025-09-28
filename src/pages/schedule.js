import { el, addDays, dayName, planUpperA, planLowerB, planUpperC, planRecovery } from '../utils/helpers.js';

export function renderSchedule(App) {
    var self = App;
    var root = el('div', {}, []);
    root.appendChild(el('div', { class: 'brand' }, [el('div', { class: 'dot' }, []), el('h2', {}, ['Schedule']), el('span', { class: 'sub' }, ['Your muscle-building weekly plan'])]));

    function plannedModeFor(dateObj) {
        var dow = dateObj.getDay();
        if (dow === 0) return { mode: 'rest', variant: null };
        if (dow === 6) return { mode: 'stretch', variant: null };
        if (dow === 2 || dow === 4) return { mode: 'recovery', variant: null };
        if (dow === 1) return { mode: 'upperA', variant: 'A' };
        if (dow === 3) return { mode: 'lowerB', variant: 'B' };
        if (dow === 5) return { mode: 'upperC', variant: 'C' };
        return { mode: 'recovery', variant: null };
    }

    function planFor(mode, variant) {
        if (mode === 'upperA') return planUpperA(self.data);
        if (mode === 'lowerB') return planLowerB(self.data);
        if (mode === 'upperC') return planUpperC(self.data);
        if (mode === 'recovery' || mode === 'stretch') return planRecovery();
        if (mode === 'easy') return planRecovery();
        return [];
    }

    var daysWrap = el('div', { class: 'list' }, []);
    var today = new Date();
    for (var i = 0; i < 7; i++) {
        (function (i) {
            var d = addDays(today, i);
            var pm = plannedModeFor(d);
            var label = dayName(d) + ' • ' + (d.getMonth() + 1) + '/' + d.getDate();
            var subtitle = pm.mode === 'upperA' ? 'Push & Pull - Chest & Back Focus' : pm.mode === 'lowerB' ? 'Power Legs - Squats & Deadlifts' : pm.mode === 'upperC' ? 'Arms & Core - Shoulders & Biceps' : pm.mode === 'easy' ? 'Easy (recovery mode)' : pm.mode === 'recovery' ? 'Recovery / Mobility' : pm.mode === 'stretch' ? 'Stretch-only' : 'Full Rest';

            var plan = planFor(pm.mode, pm.variant);
            var previewList = el('div', { class: 'note' }, []);
            if (plan.length) {
                for (var j = 0; j < plan.length; j++) {
                    var p = plan[j];
                    var note = p.name;
                    if (p.targetText) note += ' — ' + p.targetText;
                    previewList.appendChild(el('div', {}, ['• ' + note]));
                }
            } else { previewList.appendChild(el('div', {}, ['• Rest'])); }

            var card = el('div', { class: 'item' }, [el('div', { class: 'title' }, [el('span', { class: 'badge' }, [dayName(d)]), ' ' + label]), el('div', { class: 'meta' }, [subtitle]), previewList]);
            daysWrap.appendChild(card);
        })(i);
    }

    root.appendChild(el('div', { class: 'card' }, [el('div', { class: 'note' }, ['Muscle-building rhythm: Mon = Push & Pull • Wed = Power Legs • Fri = Arms & Core • Tue/Thu = Recovery • Sat = Stretch • Sun = Rest']), el('div', { class: 'hr' }, []), daysWrap, el('div', { class: 'hr' }, []), el('div', { class: 'note' }, ['Each muscle group trained 2x per week for optimal growth. Rest 2-3 minutes between sets.'])]));

    return root;
}
