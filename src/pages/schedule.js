import { el, addDays, dayName, planForWorkoutType, getSettings, weeksUntilDeload, getWorkoutSubtitle } from '../utils/helpers.js';

export function renderSchedule(App) {
    var self = App;
    var root = el('div', {}, []);
    
    (async function() {
        const settings = await getSettings();
        const weeksLeft = await weeksUntilDeload(settings.programStartDate);
        const isCurrentlyDeload = weeksLeft === 0;
        
        var subtitle = 'Your 4-day muscle-building split';
        if (isCurrentlyDeload) {
            subtitle = '⚠️ DELOAD WEEK - Reduced volume for recovery';
        } else if (weeksLeft <= 2) {
            subtitle = 'Deload week in ' + weeksLeft + ' week' + (weeksLeft === 1 ? '' : 's');
        }
        
        root.appendChild(el('div', { class: 'brand' }, [
            el('div', { class: 'dot' }, []), 
            el('h2', {}, ['Schedule']), 
            el('span', { class: 'sub' }, [subtitle])
        ]));

        function plannedModeFor(dateObj) {
            var dow = dateObj.getDay();
            if (dow === 1) return { mode: 'monday', variant: 'Upper Push' };
            if (dow === 2) return { mode: 'tuesday', variant: 'Lower Quad' };
            if (dow === 3) return { mode: 'recovery', variant: 'Recovery' };
            if (dow === 4) return { mode: 'thursday', variant: 'Upper Pull' };
            if (dow === 5) return { mode: 'friday', variant: 'Lower Posterior' };
            if (dow === 6) return { mode: 'recovery', variant: 'Recovery' };
            if (dow === 0) return { mode: 'rest', variant: 'Rest' };
            return { mode: 'rest', variant: 'Rest' };
        }

        async function planFor(mode) {
            return await planForWorkoutType(mode);
        }

        var daysWrap = el('div', { class: 'list' }, []);
        var today = new Date();
        
        for (var i = 0; i < 7; i++) {
            await (async function(i) {
                var d = addDays(today, i);
                var pm = plannedModeFor(d);
                var label = dayName(d) + ' • ' + (d.getMonth() + 1) + '/' + d.getDate();
                
                var subtitle = getWorkoutSubtitle(pm.mode, pm.isDeload);
                if (pm.mode === 'rest') subtitle = 'Full Rest Day';

                var plan = await planFor(pm.mode);
                var allExercises = (plan.warmups || []).concat(plan.main || []);
                
                var previewList = el('div', { class: 'note' }, []);
                
                if (pm.mode === 'rest') {
                    previewList.appendChild(el('div', {}, ['• Complete rest - no workout, no stretching']));
                    previewList.appendChild(el('div', {}, ['• Focus on recovery, hydration, and sleep']));
                } else if (allExercises.length > 0) {
                    // Show warmups
                    if (plan.warmups && plan.warmups.length > 0) {
                        previewList.appendChild(el('div', { style: 'font-weight: 600; margin-top: 8px' }, ['Warm-Up:']));
                        plan.warmups.forEach(function(ex) {
                            previewList.appendChild(el('div', {}, ['• ' + ex.name]));
                        });
                    }
                    
                    // Show main workout
                    if (plan.main && plan.main.length > 0) {
                        previewList.appendChild(el('div', { style: 'font-weight: 600; margin-top: 8px' }, ['Main Workout:']));
                        plan.main.forEach(function(ex) {
                            var note = ex.name;
                            if (ex.targetText) note += ' — ' + ex.targetText;
                            previewList.appendChild(el('div', {}, ['• ' + note]));
                        });
                    }
                } else {
                    previewList.appendChild(el('div', {}, ['• Rest']));
                }

                var badgeClass = i === 0 ? 'badge' : 'badge';
                var card = el('div', { class: 'item' }, [
                    el('div', { class: 'title' }, [
                        el('span', { class: badgeClass }, [dayName(d)]), 
                        ' ' + label
                    ]), 
                    el('div', { class: 'meta' }, [subtitle]), 
                    previewList
                ]);
                
                daysWrap.appendChild(card);
            })(i);
        }

        root.appendChild(el('div', { class: 'card' }, [
            el('div', { class: 'note' }, [
                '4-Day Split: Mon = Upper Push • Tue = Lower Quad • Wed = Recovery • Thu = Upper Pull • Fri = Lower Posterior • Sat = Recovery • Sun = Rest'
            ]),
            el('div', { class: 'hr' }, []), 
            daysWrap, 
            el('div', { class: 'hr' }, []), 
            el('div', { class: 'note' }, [
                'Each muscle group trained 2x per week for optimal growth. Rest 2-3 minutes between sets for strength training.'
            ])
        ]));
    })();

    return root;
}