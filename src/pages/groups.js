import { el, ensureGroupConfig } from '../utils/helpers.js';

export function renderGroups(App) {
    var self = App;
    ensureGroupConfig(self.data);
    var groups = [{ key: 'upperA', label: 'Push & Pull (Mon)' }, { key: 'lowerB', label: 'Power Legs (Wed)' }, { key: 'upperC', label: 'Arms & Core (Fri)' }, { key: 'stretch', label: 'Stretch / Recovery' }];
    var catalog = ['TRX Assisted Squat', 'Bench-Supported Dumbbell Press', 'Seated Dumbbell Row', 'Seated Dumbbell Shoulder Press', 'Dumbbell Curl', 'Push-Up', 'Plank', 'Assisted Chin-Up', 'Bar Hang', 'DB RDL (hip hinge)', 'Hamstring Stretch', 'Calf Stretch', 'Hip Flexor Stretch'];

    function getBasePlan(groupKey) {
        if (groupKey === 'upperA') return ['Bench-Supported Dumbbell Press', 'Seated Dumbbell Row', 'Push-Up', 'Plank', 'Bar Hang', 'Hamstring Stretch', 'Calf Stretch', 'Hip Flexor Stretch'];
        if (groupKey === 'lowerB') return ['TRX Assisted Squat', 'DB RDL (hip hinge)', 'Plank', 'Hamstring Stretch', 'Calf Stretch', 'Hip Flexor Stretch'];
        if (groupKey === 'upperC') return ['Seated Dumbbell Shoulder Press', 'Dumbbell Curl', 'Push-Up', 'Plank', 'Bar Hang', 'Hamstring Stretch', 'Calf Stretch', 'Hip Flexor Stretch'];
        if (groupKey === 'stretch') return ['Hamstring Stretch', 'Calf Stretch', 'Hip Flexor Stretch'];
        return [];
    }

    function groupEditor(g) {
        var cfg = self.data.groupConfig[g.key] || (self.data.groupConfig[g.key] = {});
        var baseNames = getBasePlan(g.key);
        var editor = el('div', { class: 'item' });
        editor.appendChild(el('div', { class: 'title' }, [g.label]));
        editor.appendChild(el('div', { class: 'meta' }, [g.key + ' (' + baseNames.length + ' exercises)']));
        editor.appendChild(el('div', { class: 'note' }, ['Tip: Customize exercises and sets/reps. Uncheck to disable exercises.']));

        baseNames.forEach(function (name) {
            var c = cfg[name] || (cfg[name] = { enabled: true });
            var enabled = (c.enabled !== false);
            var setsVal = (typeof c.sets === 'number') ? c.sets : '';
            var repsVal = (typeof c.reps === 'number') ? c.reps : '';

            var chk = el('input', { type: 'checkbox', checked: enabled });
            chk.addEventListener('change', function () { c.enabled = !!this.checked; self.save(); });

            var sets = el('input', { type: 'number', min: '0', style: 'width:70px', value: setsVal, placeholder: 'sets' });
            sets.addEventListener('input', function () { var v = parseInt(this.value, 10); c.sets = isNaN(v) ? null : v; self.save(); });

            var reps = el('input', { type: 'number', min: '0', style: 'width:70px', value: repsVal, placeholder: 'reps' });
            reps.addEventListener('input', function () { var v = parseInt(this.value, 10); c.reps = isNaN(v) ? null : v; self.save(); });

            var removeBtn = el('button', { class: 'btn danger' }, ['Remove']);
            removeBtn.addEventListener('click', function () { c.enabled = false; self.save(); self.render(); });

            var row = el('div', { class: 'row' });
            row.appendChild(chk); row.appendChild(el('div', { class: 'title' }, [name])); row.appendChild(el('span', { class: 'note' }, [' sets'])); row.appendChild(sets); row.appendChild(el('span', { class: 'note' }, [' reps'])); row.appendChild(reps); row.appendChild(removeBtn);
            editor.appendChild(row);
        });

        editor.appendChild(el('div', { class: 'hr' }, []));

        var addSel = el('select', {});
        catalog.forEach(function (n) { addSel.appendChild(el('option', { value: n }, [n])); });

        var addInput = el('input', { type: 'text', placeholder: 'or type a custom exercise name', style: 'width:260px' });
        var addBtn = el('button', { class: 'btn' }, ['Add']);
        addBtn.addEventListener('click', function () { var name = addInput.value.trim() || addSel.value; if (!name) return; if (!cfg[name]) cfg[name] = { enabled: true }; else cfg[name].enabled = true; if (catalog.indexOf(name) === -1) catalog.push(name); self.save(); self.render(); });

        var controlsRow = el('div', { class: 'row' }); controlsRow.appendChild(el('span', { class: 'note' }, ['Add:'])); controlsRow.appendChild(addSel); controlsRow.appendChild(addInput); controlsRow.appendChild(addBtn);
        editor.appendChild(controlsRow);

        return editor;
    }

    var groupsList = el('div', { class: 'list' }, []);
    groups.forEach(function (g) { groupsList.appendChild(groupEditor(g)); });

    return el('div', { class: 'grid groups' }, [el('div', { class: 'card' }, [el('div', { class: 'title' }, ['Exercise Groups (Muscle Building Focus)']), groupsList]), el('div', { class: 'card' }, [el('div', { class: 'title' }, ['How it works']), el('div', { class: 'note' }, ['Each muscle group is trained 2x per week. Customize sets/reps or disable exercises as needed.'])])]);
}
