import { el, loadData, saveData, resetData, defaultData, ensureGroupConfig, planUpperA, planLowerB, planUpperC, planRecovery } from './utils/helpers.js';
import { renderToday } from './pages/today.js';
import { renderSchedule } from './pages/schedule.js';
import { renderGoals } from './pages/goals.js';
import { renderLogs } from './pages/logs.js';
import { renderGroups } from './pages/groups.js';
import { renderSettings } from './pages/settings.js';

const App = {
    state: { tab: 'today' },
    data: null,
    init: function () {
        var d = loadData();
        if (!d) { d = defaultData(); saveData(d); }
        ensureGroupConfig(d);
        this.data = d;
        this.render();
    },
    save: function () { saveData(this.data); },
    setTab: function (t) { this.state.tab = t; this.render(); },
    lastWorkoutDate: function () { var L = this.data.logs; return L.length ? new Date(L[L.length - 1].date) : null; },
    daysSinceLast: function () { var last = this.lastWorkoutDate(); if (!last) return 999; var diff = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24); return Math.floor(diff); },
    buildToday: function () { var today = new Date(); var workoutType = (function (d) { var dow = d.getDay(); if (dow === 1) return 'upperA'; if (dow === 3) return 'lowerB'; if (dow === 5) return 'upperC'; return null; })(today); if (workoutType === 'upperA') return { mode: 'upperA', variant: 'A', steps: planUpperA(this.data) }; if (workoutType === 'lowerB') return { mode: 'lowerB', variant: 'B', steps: planLowerB(this.data) }; if (workoutType === 'upperC') return { mode: 'upperC', variant: 'C', steps: planUpperC(this.data) }; return { mode: 'recovery', variant: null, steps: planRecovery() }; },
    render: function () {
        console.log('App render: current tab =', this.state.tab);

        try {
            var root = document.getElementById('app');
            if (!root) { console.error('Could not find #app element'); return; }
            root.innerHTML = '';
            root.appendChild(this.navbar());

            var currentPage;
            if (this.state.tab === 'today') currentPage = renderToday(this);
            else if (this.state.tab === 'schedule') currentPage = renderSchedule(this);
            else if (this.state.tab === 'goals') currentPage = renderGoals(this);
            else if (this.state.tab === 'logs') currentPage = renderLogs(this);
            else if (this.state.tab === 'settings') currentPage = renderSettings(this);
            else if (this.state.tab === 'groups') currentPage = renderGroups(this);
            else currentPage = renderToday(this);

            if (currentPage && currentPage.nodeType) root.appendChild(currentPage);
            else { console.error('Invalid page element returned for tab:', this.state.tab, currentPage); root.appendChild(el('div', { class: 'card' }, [el('h2', {}, ['Error']), el('div', {}, ['Failed to load page: ' + this.state.tab])])); }
        } catch (error) {
            console.error('Render error:', error);
            var root = document.getElementById('app');
            if (root) root.innerHTML = '<div class="card"><h2>Application Error</h2><p>Check console for details. <button onclick="location.reload()">Reload</button></p></div>';
        }
    },
    navbar: function () {
        var self = this;
        function mk(label, id) { return el('div', { class: 'tab' + (self.state.tab === id ? ' active' : ''), onclick: function () { self.setTab(id); } }, [label]); }
        return el('div', { class: 'nav' }, [mk('Today', 'today'), mk('Schedule', 'schedule'), mk('Goals', 'goals'), mk('Logs', 'logs'), mk('Settings', 'settings'), mk('Groups', 'groups')]);
    }
};

window.addEventListener('DOMContentLoaded', function () { try { App.init(); var loading = document.getElementById('loading'); var app = document.getElementById('app'); if (loading) loading.style.display = 'none'; if (app) app.classList.add('loaded'); } catch (err) { var root = document.getElementById('app'); if (root) root.innerHTML = '<div class="card"><h2>Load Error</h2><p>' + String(err) + '</p></div>'; console.error(err); } });

window.addEventListener('error', function (e) { var root = document.getElementById('app'); if (root) root.innerHTML = '<div class="card"><h2>Runtime Error</h2><p>' + String(e.message || e) + '</p></div>'; });

window.WorkoutApp = App;

export default App;
