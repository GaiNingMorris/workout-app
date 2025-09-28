import { el, todayISO } from '../utils/helpers.js';

export function renderGoals(App) {
    var self = App, d = this ? this.data : App.data;
    var firstLog = d.logs.length ? new Date(d.logs[0].date) : new Date();
    var daysSinceStart = Math.floor((Date.now() - firstLog.getTime()) / (1000 * 60 * 60 * 24));
    var weeksSinceStart = Math.floor(daysSinceStart / 7);

    function getExpectedGains(weeks) {
        if (weeks <= 2) return { strength: '5-10%', visible: 'Minimal', note: 'Neural adaptations starting' };
        if (weeks <= 8) return { strength: '15-25%', visible: 'Noticeable', note: 'Visible changes emerging' };
        if (weeks <= 24) return { strength: '25-35%', visible: 'Significant', note: 'Major muscle development' };
        if (weeks <= 52) return { strength: '35-50%', visible: 'Substantial', note: '1-year transformation complete' };
        if (weeks <= 104) return { strength: '50-70%', visible: 'Advanced', note: 'Year 2: Refined physique' };
        if (weeks <= 156) return { strength: '60-80%', visible: 'Expert', note: 'Year 3: Peak development' };
        if (weeks <= 260) return { strength: '70-90%', visible: 'Mastery', note: 'Years 4-5: Strength mastery' };
        return { strength: '80%+ gains', visible: 'Lifetime', note: 'Decades of health & vitality' };
    }

    var expected = getExpectedGains(weeksSinceStart);

    function getActualProgress() {
        var exercises = ['Bench-Supported Dumbbell Press', 'Seated Dumbbell Row', 'Dumbbell Curl'];
        var progress = {};
        exercises.forEach(function (ex) { var current = d.loads[ex] || 15; var initial = 15; var gain = current > initial ? ((current - initial) / initial * 100).toFixed(0) : '0'; progress[ex] = { current: current, gain: gain + '%' }; });
        return progress;
    }

    var actualProgress = getActualProgress();

    var weightInput = el('input', { class: 'input', placeholder: 'Weight (lb)' }, []);
    var addBtn = el('button', { class: 'btn' }, ['Add Today']);
    addBtn.addEventListener('click', function () {
        var w = parseFloat(weightInput.value);
        if (!w) return;
        var day = todayISO(), found = null;
        for (var i = 0; i < d.weights.length; i++) if (d.weights[i].date === day) found = d.weights[i];
        if (found) found.weight = w; else d.weights.push({ date: day, weight: w });
        self.save(); self.render();
    });

    var hangInput = el('input', { class: 'input', placeholder: 'Best hang (sec)', value: String(d.goals.hangBestSec || '') }, []);
    var saveHang = el('button', { class: 'btn' }, ['Save Hang Best']);
    saveHang.addEventListener('click', function () { var v = parseFloat(hangInput.value); d.goals.hangBestSec = v ? v : 0; self.save(); });

    var targetWeight = el('input', { class: 'input', placeholder: 'Overall bodyweight goal (lb)', value: String(d.goals.targetWeight || 165) }, []);
    var saveTarget = el('button', { class: 'btn' }, ['Save Overall Goal']);
    saveTarget.addEventListener('click', function () { var v = parseFloat(targetWeight.value); d.goals.targetWeight = v ? v : 165; self.save(); });

    var left = el('div', { class: 'card' }, [el('h3', {}, ['Progress Tracking']), el('div', { class: 'note' }, ['Week ' + weeksSinceStart + ' • ' + daysSinceStart + ' days since start']), el('div', { class: 'hr' }, []), el('div', { style: 'margin: 10px 0;' }, [el('strong', {}, ['Expected at Week ' + weeksSinceStart + ':']), el('div', { class: 'note' }, ['• Strength: ' + expected.strength]), el('div', { class: 'note' }, ['• Muscle: ' + expected.visible]), el('div', { class: 'note' }, ['• ' + expected.note])]), el('div', { class: 'hr' }, []), el('div', { class: 'kv' }, [el('label', {}, ['Target Weight']), targetWeight, saveTarget]), el('div', { class: 'kv' }, [el('label', {}, ['Best Hang (sec)']), hangInput, saveHang])]);

    var tbody = [];
    for (var i = d.weights.length - 1; i >= 0 && i >= d.weights.length - 10; i--) { tbody.push(el('tr', {}, [el('td', {}, [d.weights[i].date]), el('td', {}, [String(d.weights[i].weight)])])); }

    var right = el('div', { class: 'card' }, [el('h3', {}, ['Body Weight Log']), el('div', { class: 'kv' }, [el('label', {}, ["Today's Weight"]), weightInput, addBtn]), el('div', { class: 'hr' }, []), el('table', { class: 'table' }, [el('thead', {}, [el('tr', {}, [el('th', {}, ['Date']), el('th', {}, ['Weight'])])]), el('tbody', {}, tbody)]), el('div', { class: 'hr' }, []), el('div', { class: 'note' }, ['Hangs unlock at ≤200 lb • Chin-ups unlock at ≥30s hang'])]);

    return el('div', {}, [el('div', { class: 'brand' }, [el('div', { class: 'dot' }, []), el('h2', {}, ['Goals & Progress']), el('span', { class: 'sub' }, ['Track your muscle-building journey'])]), el('div', { class: 'grid' }, [left, right])]);
}
