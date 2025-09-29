import { el } from '../utils/helpers.js';

export function renderLogs(App) {
    var root = el('div', {}, []);
    
    (async function() {
        // Fetch workouts from database, sorted by date descending
        const workouts = await window.db.find('workouts', {}, { 
            sort: { date: -1 }, 
            limit: 50 
        });
        
        var rows = [];
        
        if (workouts && workouts.length > 0) {
            workouts.forEach(function(workout) {
                var dateStr = new Date(workout.date).toLocaleString();
                var template = workout.template || 'unknown';
                var templateName = '';
                
                if (template === 'monday') templateName = 'Upper Push';
                else if (template === 'tuesday') templateName = 'Lower Quad';
                else if (template === 'thursday') templateName = 'Upper Pull';
                else if (template === 'friday') templateName = 'Lower Posterior';
                else if (template === 'recovery') templateName = 'Recovery';
                else if (template === 'rest') templateName = 'Rest';
                else templateName = template;
                
                if (workout.isDeloadWeek) {
                    templateName = '⚠️ ' + templateName + ' (Deload)';
                }
                
                var totalSets = 0;
                if (workout.exercises) {
                    workout.exercises.forEach(function(ex) {
                        totalSets += (ex.completedSets || []).length;
                    });
                }
                
                rows.push(el('tr', {}, [
                    el('td', {}, [dateStr]),
                    el('td', {}, [templateName]),
                    el('td', {}, [String(totalSets)])
                ]));
            });
        } else {
            rows.push(el('tr', {}, [
                el('td', { colspan: '3', style: 'text-align: center; color: #8da8cb' }, [
                    'No workout logs yet. Complete your first workout to see it here!'
                ])
            ]));
        }
        
        root.appendChild(el('div', { class: 'brand' }, [
            el('div', { class: 'dot' }, []), 
            el('h2', {}, ['Workout Logs'])
        ]));
        
        root.appendChild(el('div', { class: 'card' }, [
            el('div', { class: 'note' }, [
                'Your workout history. Each entry shows the workout type and total sets completed.'
            ]),
            el('div', { class: 'hr' }, []),
            el('table', { class: 'table' }, [
                el('thead', {}, [
                    el('tr', {}, [
                        el('th', {}, ['Date']), 
                        el('th', {}, ['Workout']), 
                        el('th', {}, ['Total Sets'])
                    ])
                ]), 
                el('tbody', {}, rows)
            ])
        ]));
    })();
    
    return root;
}