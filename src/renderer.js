import { el, planForToday, getUserProfile, getSettings, ensureLoadsMigration } from './utils/helpers.js';
import { renderToday } from './pages/today.js';
import { renderSchedule } from './pages/schedule.js';
import { renderGoals } from './pages/goals.js';
import { renderLogs } from './pages/logs.js';
import { renderGroups } from './pages/groups.js';
import { renderSettings } from './pages/settings.js';

const App = {
    state: { tab: 'today' },
    user: null,
    settings: null,
    
    init: async function () {
        console.log('App initializing...');
        
        // Run migration from old JSON format if needed
        try {
            const migrationResult = await window.db.migrateFromJSON();
            if (migrationResult.success) {
                console.log('Migration check:', migrationResult.message);
            } else {
                console.error('Migration failed:', migrationResult.error);
            }
        } catch (e) {
            console.error('Migration error:', e);
        }
        
        // Load user profile and settings
        try {
            this.user = await getUserProfile();
            this.settings = await getSettings();
            // Expose settings to window for UI components to read tuning values
            try { window.appSettings = this.settings; } catch (e) { /* ignore */ }
            console.log('User profile loaded:', this.user);
            console.log('Settings loaded:', this.settings);
        } catch (e) {
            console.error('Failed to load initial data:', e);
        }

        // Ensure loads records include consecutiveSuccesses for new progression logic
        try {
            const res = await ensureLoadsMigration();
            if (res && res.updated) console.log('Loads migration updated', res.updated, 'records');
        } catch (e) { console.error('Loads migration error', e); }
        
        this.render();
    },
    
    setTab: function (t) { 
        this.state.tab = t; 
        this.render(); 
    },
    
    async refreshData() {
        // Reload user profile and settings
        this.user = await getUserProfile();
        this.settings = await getSettings();
        try { window.appSettings = this.settings; } catch (e) { /* ignore */ }
    },
    
    render: function () {
        console.log('App render: current tab =', this.state.tab);

        try {
            var root = document.getElementById('app');
            if (!root) { 
                console.error('Could not find #app element'); 
                return; 
            }
            
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

            if (currentPage && currentPage.nodeType) {
                root.appendChild(currentPage);
            } else { 
                console.error('Invalid page element returned for tab:', this.state.tab, currentPage); 
                root.appendChild(el('div', { class: 'card' }, [
                    el('h2', {}, ['Error']), 
                    el('div', {}, ['Failed to load page: ' + this.state.tab])
                ])); 
            }
        } catch (error) {
            console.error('Render error:', error);
            var root = document.getElementById('app');
            if (root) {
                root.innerHTML = '<div class="card"><h2>Application Error</h2><p>Check console for details. <button onclick="location.reload()">Reload</button></p></div>';
            }
        }
    },
    
    navbar: function () {
        var self = this;
        function mk(label, id) { 
            return el('div', { 
                class: 'tab' + (self.state.tab === id ? ' active' : ''), 
                onclick: function () { self.setTab(id); } 
            }, [label]); 
        }
        return el('div', { class: 'nav' }, [
            mk('Today', 'today'), 
            mk('Schedule', 'schedule'), 
            mk('Goals', 'goals'), 
            mk('Logs', 'logs'), 
            mk('Settings', 'settings'), 
            mk('Groups', 'groups')
        ]);
    }
};

window.addEventListener('DOMContentLoaded', async function () { 
    try { 
        await App.init(); 
        var loading = document.getElementById('loading'); 
        var app = document.getElementById('app'); 
        if (loading) loading.style.display = 'none'; 
        if (app) app.classList.add('loaded'); 
    } catch (err) { 
        var root = document.getElementById('app'); 
        if (root) {
            root.innerHTML = '<div class="card"><h2>Load Error</h2><p>' + String(err) + '</p><p><button onclick="location.reload()">Reload</button></p></div>'; 
        }
        console.error(err); 
    } 
});

window.addEventListener('error', function (e) { 
    var root = document.getElementById('app'); 
    if (root) {
        root.innerHTML = '<div class="card"><h2>Runtime Error</h2><p>' + String(e.message || e) + '</p></div>'; 
    }
});

window.WorkoutApp = App;

export default App;