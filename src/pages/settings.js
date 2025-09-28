import { el, resetData } from '../utils/helpers.js';

export function renderSettings(App) {
    var self = App;
    var restGood = el('input', { class: 'input', value: String(this ? this.data.settings.restGood : self.data.settings.restGood) }, []);
    var restEasy = el('input', { class: 'input', value: String(this ? this.data.settings.restEasy : self.data.settings.restEasy) }, []);

    var saveBtn = el('button', { class: 'btn' }, ['Save']);
    saveBtn.addEventListener('click', function () {
        self.data.settings.restGood = parseInt(restGood.value, 10) || 120;
        self.data.settings.restEasy = parseInt(restEasy.value, 10) || 90;
        self.save();
    });

    var reset = el('button', { class: 'btn' }, ['Factory Reset']);
    reset.addEventListener('click', function () { resetData(); location.reload(); });

    var left = el('div', { class: 'card' }, [el('h3', {}, ['Rest Timers']), el('div', { class: 'kv' }, [el('label', {}, ['Strength training rest (sec)']), restGood]), el('div', { class: 'kv' }, [el('label', {}, ['Easy day rest (sec)']), restEasy]), el('div', { class: 'row' }, [saveBtn])]);

    var right = el('div', { class: 'card' }, [el('h3', {}, ['Data']), el('div', { class: 'note' }, ['Data is stored locally. Muscle building requires consistency - track your progress!']), el('div', { class: 'row' }, [reset])]);

    return el('div', {}, [el('div', { class: 'brand' }, [el('div', { class: 'dot' }, []), el('h2', {}, ['Settings']), el('span', { class: 'sub' }, ['Optimize for muscle growth'])]), el('div', { class: 'grid' }, [left, right])]);
}
