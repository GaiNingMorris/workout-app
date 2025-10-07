import { el, planForToday, getUserProfile, getSettings, ensureLoadsMigration } from './utils/helpers.js';
import { Performance, DatabaseOptimization } from './utils/performance.js';
// Performance: Lazy load page modules for faster startup
import { renderToday } from './pages/today.js'; // Keep today page for fast initial load

// Lazy-loaded page modules (loaded only when needed)
let renderSchedule, renderGoals, renderLogs, renderGroups, renderSettings, renderCharts, renderNutrition, renderRecipes, renderAnalytics;

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
        // Performance: Show loading state for smooth transitions
        if (t !== this.state.tab) {
            var root = document.getElementById('app');
            if (root) {
                root.style.opacity = '0.7';
                root.style.transition = 'opacity 0.15s ease-out';
            }
        }
        
        this.state.tab = t; 
        this.render().then(() => {
            // Restore opacity after render complete
            if (root) {
                root.style.opacity = '1';
            }
        }).catch(() => {
            // Fallback if render fails
            if (root) {
                root.style.opacity = '1';
            }
        }); 
    },
    
    async refreshData() {
        // Reload user profile and settings
        this.user = await getUserProfile();
        this.settings = await getSettings();
        try { window.appSettings = this.settings; } catch (e) { /* ignore */ }
    },
    
    render: async function () {
        Performance.startRender();
        console.log('App render: current tab =', this.state.tab);

        try {
            var root = document.getElementById('app');
            if (!root) { 
                console.error('Could not find #app element'); 
                return; 
            }
            
            // Performance: Use batch DOM updates
            await Performance.batchDOMUpdates([
                () => {
                    root.innerHTML = '';
                    root.appendChild(this.navbar());
                }
            ]);

            var currentPage;
            
            // Performance: Lazy load page modules only when needed
            if (this.state.tab === 'today') {
                currentPage = renderToday(this);
            } else if (this.state.tab === 'schedule') {
                if (!renderSchedule) {
                    const module = await import('./pages/schedule.js');
                    renderSchedule = module.renderSchedule;
                }
                currentPage = renderSchedule(this);
            } else if (this.state.tab === 'goals') {
                if (!renderGoals) {
                    const module = await import('./pages/goals.js');
                    renderGoals = module.renderGoals;
                }
                currentPage = renderGoals(this);
            } else if (this.state.tab === 'charts') {
                if (!renderCharts) {
                    const module = await import('./pages/charts.js');
                    renderCharts = module.renderCharts;
                }
                currentPage = renderCharts(this);
            } else if (this.state.tab === 'analytics') {
                if (!renderAnalytics) {
                    const module = await import('./pages/analytics.js');
                    renderAnalytics = module.renderAnalytics;
                }
                currentPage = renderAnalytics(this);
            } else if (this.state.tab === 'nutrition') {
                if (!renderNutrition) {
                    const module = await import('./pages/nutrition.js');
                    renderNutrition = module.renderNutrition;
                }
                currentPage = renderNutrition(this);
            } else if (this.state.tab === 'recipes') {
                if (!renderRecipes) {
                    const module = await import('./pages/recipes.js');
                    renderRecipes = module.renderRecipes;
                }
                currentPage = renderRecipes(this);
            } else if (this.state.tab === 'logs') {
                if (!renderLogs) {
                    const module = await import('./pages/logs.js');
                    renderLogs = module.renderLogs;
                }
                currentPage = renderLogs(this);
            } else if (this.state.tab === 'settings') {
                if (!renderSettings) {
                    const module = await import('./pages/settings.js');
                    renderSettings = module.renderSettings;
                }
                currentPage = renderSettings(this);
            } else if (this.state.tab === 'groups') {
                if (!renderGroups) {
                    const module = await import('./pages/groups.js');
                    renderGroups = module.renderGroups;
                }
                currentPage = renderGroups(this);
            } else {
                currentPage = renderToday(this);
            }

            if (currentPage && currentPage.nodeType) {
                await Performance.batchDOMUpdates([
                    () => root.appendChild(currentPage)
                ]);
            } else { 
                console.error('Invalid page element returned for tab:', this.state.tab, currentPage); 
                await Performance.batchDOMUpdates([
                    () => root.appendChild(el('div', { class: 'card' }, [
                        el('h2', {}, ['Error']), 
                        el('div', {}, ['Failed to load page: ' + this.state.tab])
                    ]))
                ]);
            }
            
            Performance.endRender();
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
            mk('Charts', 'charts'),
            mk('Analytics', 'analytics'),
            mk('Nutrition', 'nutrition'),
            mk('Recipes', 'recipes'),
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