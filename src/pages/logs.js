import { el } from '../utils/helpers.js';

export function renderLogs(App) {
    var root = el('div', {}, []);

    (async function() {
        // Fetch workouts from database, sorted by date descending
        const workouts = await window.db.find('workouts', {}, {
            sort: { date: -1 },
            limit: 100
        });

        root.appendChild(el('div', { class: 'brand' }, [
            el('div', { class: 'dot' }, []),
            el('h2', {}, ['Workout Logs'])
        ]));

        if (!workouts || workouts.length === 0) {
            root.appendChild(el('div', { class: 'card' }, [
                el('div', { class: 'note' }, ['No workout logs yet. Complete a workout to see it here.'])
            ]));
            return root;
        }

        // Build a list of compact, readable log cards
        var container = el('div', {}, []);

        workouts.forEach(function(workout) {
            var date = new Date(workout.date || workout.startTime || Date.now());
            var dateStr = date.toLocaleString();

            // Friendly template name
            var template = workout.template || workout.mode || 'unknown';
            var templateName = (template === 'monday' && 'Upper Push') ||
                (template === 'tuesday' && 'Lower Quad') ||
                (template === 'thursday' && 'Upper Pull') ||
                (template === 'friday' && 'Lower Posterior') ||
                (template === 'recovery' && 'Recovery') ||
                (template === 'rest' && 'Rest') || template;

            if (workout.isDeloadWeek) templateName = '⚠️ ' + templateName + ' (Deload)';

            var totalSets = 0;
            if (workout.exercises) {
                workout.exercises.forEach(function(ex) {
                    totalSets += (ex.completedSets || []).length;
                });
            }

            // Card header
            var header = el('div', { class: 'row', style: 'justify-content: space-between; align-items: center' }, [
                el('div', {}, [el('strong', {}, [dateStr]), el('div', { class: 'note' }, [templateName])]),
                el('div', {}, [el('span', { class: 'badge' }, [String(totalSets) + ' sets'])])
            ]);

            // Details (initially hidden)
            var details = el('div', { class: 'log-details', style: 'display:none; margin-top:10px' }, []);

            if (workout.exercises && workout.exercises.length > 0) {
                workout.exercises.forEach(function(ex) {
                    var setsCount = (ex.completedSets || []).length;
                    var exRow = el('div', { class: 'row', style: 'justify-content: space-between; gap:10px; align-items:flex-start; margin-bottom:6px' }, [
                        el('div', {}, [el('strong', {}, [ex.exerciseId || ex.name || 'Unnamed']), el('div', { class: 'note' }, [ex.sets + ' sets • target: ' + (ex.targetReps || 0) + ' reps'])]),
                        el('div', {}, [
                            el('div', {}, [(setsCount || 0) + ' sets logged']),
                            // small list of set details
                            el('div', { class: 'note' }, [
                                (ex.completedSets || []).map(function(s, idx) {
                                    var struggled = s.struggled ? ' ⚠️' : '';
                                    var repText = (s.reps !== undefined ? s.reps : (s.repsPerformed || '-'));
                                    var w = s.weight || s.currentLoad || 0;
                                    return (idx + 1) + ': ' + repText + ' reps @ ' + w + ' lb' + struggled + (s.timestamp ? ' (' + new Date(s.timestamp).toLocaleTimeString() + ')' : '');
                                }).join(' • ')
                            ])
                        ])
                    ]);
                    details.appendChild(exRow);
                });
            } else {
                details.appendChild(el('div', { class: 'note' }, ['No exercise details available for this entry.']));
            }

            // Toggle button
            var toggleBtn = el('button', { class: 'btn small' }, ['Show details']);
            toggleBtn.addEventListener('click', function() {
                if (details.style.display === 'none') {
                    details.style.display = 'block';
                    toggleBtn.textContent = 'Hide details';
                } else {
                    details.style.display = 'none';
                    toggleBtn.textContent = 'Show details';
                }
            });

            var card = el('div', { class: 'card log-card' }, [header, el('div', { class: 'hr' }, []), toggleBtn, details]);
            container.appendChild(card);
        });

        root.appendChild(container);
    })();

    return root;
}