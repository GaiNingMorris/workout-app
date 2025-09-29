import { el, getSettings, resetData } from '../utils/helpers.js';

export function renderSettings(App) {
    var self = App;
    var root = el('div', {}, []);
    
    (async function() {
        const settings = await getSettings();
        
        var restGood = el('input', { 
            class: 'input', 
            type: 'number',
            value: String(settings.restTimerStrength || 120) 
        }, []);
        
        var restEasy = el('input', { 
            class: 'input', 
            type: 'number',
            value: String(settings.restTimerEasy || 90) 
        }, []);
        
        var deloadInterval = el('input', {
            class: 'input',
            type: 'number',
            value: String(settings.deloadInterval || 8)
        }, []);

        var saveBtn = el('button', { class: 'btn' }, ['Save Settings']);
        saveBtn.addEventListener('click', async function() {
            var restStrength = parseInt(restGood.value, 10) || 120;
            var restEasySec = parseInt(restEasy.value, 10) || 90;
            var deloadWeeks = parseInt(deloadInterval.value, 10) || 8;
            
            if (deloadWeeks < 4 || deloadWeeks > 12) {
                alert('Deload interval should be between 4 and 12 weeks');
                return;
            }
            
            await window.db.update(
                'settings',
                { _id: 'app_settings' },
                { $set: { 
                    restTimerStrength: restStrength,
                    restTimerEasy: restEasySec,
                    deloadInterval: deloadWeeks
                }}
            );
            
            await self.refreshData();
            alert('Settings saved!');
        });

        var reset = el('button', { class: 'btn danger' }, ['Factory Reset']);
        reset.addEventListener('click', async function() { 
            if (!confirm('Are you sure you want to delete ALL workout data? This cannot be undone!')) {
                return;
            }
            
            if (!confirm('Really delete everything? Your workout history, progress, and settings will be lost forever!')) {
                return;
            }
            
            const result = await resetData();
            if (result.ok) {
                alert('All data has been reset. The app will reload.');
                location.reload();
            } else {
                alert('Error resetting data: ' + (result.error || 'Unknown error'));
            }
        });
        
        var exportBtn = el('button', { class: 'btn' }, ['Export Data (JSON)']);
        exportBtn.addEventListener('click', async function() {
            try {
                // Gather all data
                const user = await window.db.findOne('user', { _id: 'user_profile' });
                const settingsData = await window.db.findOne('settings', { _id: 'app_settings' });
                const workouts = await window.db.find('workouts', {});
                const loads = await window.db.find('loads', {});
                const progressions = await window.db.find('progressions', {});
                
                const exportData = {
                    exportDate: new Date().toISOString(),
                    version: '2.0.0',
                    user: user,
                    settings: settingsData,
                    workouts: workouts,
                    loads: loads,
                    progressions: progressions
                };
                
                // Create download
                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'workout-backup-' + new Date().toISOString().slice(0, 10) + '.json';
                link.click();
                URL.revokeObjectURL(url);
                
                alert('Data exported successfully!');
            } catch (e) {
                console.error('Export error:', e);
                alert('Error exporting data: ' + e.message);
            }
        });

        var left = el('div', { class: 'card' }, [
            el('h3', {}, ['Rest Timers']),
            el('div', { class: 'note' }, ['Configure rest periods between sets']),
            el('div', { class: 'hr' }, []),
            el('div', { class: 'kv' }, [
                el('label', {}, ['Strength training rest (sec)']), 
                restGood
            ]),
            el('div', { class: 'kv' }, [
                el('label', {}, ['Easy day rest (sec)']), 
                restEasy
            ]),
            el('div', { class: 'hr' }, []),
            el('h3', {}, ['Deload Cycle']),
            el('div', { class: 'note' }, ['Automatic deload week interval (4-12 weeks)']),
            el('div', { class: 'kv' }, [
                el('label', {}, ['Deload every (weeks)']),
                deloadInterval
            ]),
            el('div', { class: 'row', style: 'margin-top: 10px' }, [saveBtn])
        ]);

        var right = el('div', { class: 'card' }, [
            el('h3', {}, ['Data Management']),
            el('div', { class: 'note' }, [
                'Data is stored locally in NeDB. Muscle building requires consistency - track your progress!'
            ]),
            el('div', { class: 'hr' }, []),
            el('div', { class: 'row' }, [exportBtn]),
            el('div', { class: 'hr' }, []),
            el('h3', {}, ['Danger Zone']),
            el('div', { class: 'note' }, [
                '⚠️ Factory reset will delete ALL workout data permanently. This cannot be undone!'
            ]),
            el('div', { class: 'row' }, [reset])
        ]);

        root.appendChild(el('div', { class: 'brand' }, [
            el('div', { class: 'dot' }, []), 
            el('h2', {}, ['Settings']), 
            el('span', { class: 'sub' }, ['Configure your workout app'])
        ]));
        
        root.appendChild(el('div', { class: 'grid' }, [left, right]));
    })();

    return root;
}