import { el, fmtClock, setDemoImageFor, planForToday, workoutTypeForDate, getLoadFor, processWorkoutCompletion } from '../utils/helpers.js';

export function renderToday(App) {
    console.log('Rendering Today page');

    var self = App;
    var root = el('div', {}, []);
    
    // Create async wrapper since we need to await planForToday
    (async function() {
        const workoutType = workoutTypeForDate(new Date());
        
        // Handle rest day
        if (workoutType === 'rest') {
            root.appendChild(el('div', { class: 'brand' }, [
                el('div', { class: 'dot' }, []), 
                el('h2', {}, ['Today']), 
                el('span', { class: 'sub' }, ['Sunday - Full Rest Day'])
            ]));
            
            root.appendChild(el('div', { class: 'card' }, [
                el('h3', {}, ['Rest Day']),
                el('div', { class: 'note' }, ['Today is your complete rest day. No workout, no stretching. Let your muscles recover and grow stronger.']),
                el('div', { class: 'hr' }, []),
                el('div', {}, ['💪 Your next workout is Monday - Upper Push (Chest, Shoulders, Triceps)']),
                el('div', { class: 'note' }, ['Rest is when muscle growth happens. Eat well, stay hydrated, and get good sleep.'])
            ]));
            
            return;
        }
        
        // Get today's plan
        const plan = await planForToday();
        const warmups = plan.warmups || [];
        const main = plan.main || [];
        const isDeload = plan.isDeload || false;
        
        // Determine subtitle
        var subtitle = '';
        if (workoutType === 'monday') subtitle = 'Upper Push - Chest, Shoulders, Triceps';
        else if (workoutType === 'tuesday') subtitle = 'Lower Quad - Squats & Glutes';
        else if (workoutType === 'thursday') subtitle = 'Upper Pull - Back & Biceps';
        else if (workoutType === 'friday') subtitle = 'Lower Posterior - Hamstrings & Glutes';
        else if (workoutType === 'recovery') subtitle = 'Recovery Day - Static Stretching';
        
        if (isDeload) subtitle = 'DELOAD WEEK - ' + subtitle;
        
        var header = el('div', { class: 'brand' }, [
            el('div', { class: 'dot' }, []), 
            el('h2', {}, ['Today']), 
            el('span', { class: 'sub' }, [subtitle])
        ]);
        
        // Demo image area
        var demo = el('div', { class: 'pic' }, []);
        function setDemo(ex) { setDemoImageFor(demo, ex); }
        
        // Set initial demo image
        if (warmups.length > 0) setDemo(warmups[0]);
        else if (main.length > 0) setDemo(main[0]);
        
        // Rest timer
        var timerBadge = el('div', { class: 'badge' }, ['Ready']);
        var restTimer = null, restRemain = 0;
        
        function startRest(s) {
            if (restTimer) clearInterval(restTimer);
            restRemain = s; 
            timerBadge.textContent = fmtClock(restRemain);
            restTimer = setInterval(function () { 
                restRemain -= 1; 
                if (restRemain <= 0) { 
                    clearInterval(restTimer); 
                    restTimer = null; 
                    timerBadge.textContent = 'Ready'; 
                } else { 
                    timerBadge.textContent = fmtClock(restRemain); 
                } 
            }, 1000);
        }
        
        // Session tracking
        var session = { 
            date: new Date().toISOString(), 
            template: workoutType, 
            isDeloadWeek: isDeload,
            exercises: [] 
        };
        
        // Determine rest time
        var restSecs = (workoutType === 'monday' || workoutType === 'thursday' || workoutType === 'tuesday' || workoutType === 'friday') 
            ? (self.settings?.restTimerStrength || 120) 
            : (self.settings?.restTimerEasy || 90);
        
        // Build warm-up section
        var warmupList = el('div', { class: 'list' }, []);
        if (warmups.length > 0) {
            warmups.forEach(function(ex) {
                var title = el('div', { class: 'title' }, [
                    el('span', { class: 'badge' }, ['Warm']), 
                    ' ' + ex.name
                ]);
                var meta = el('div', { class: 'meta' }, [ex.detail || ex.targetText || '']);
                var doneBtn = el('button', { class: 'btn small' }, ['Done']);
                
                doneBtn.addEventListener('click', function() {
                    doneBtn.disabled = true;
                    doneBtn.textContent = '✓ Done';
                });
                
                var row = el('div', { 
                    class: 'item', 
                    onclick: function() { setDemo(ex); } 
                }, [title, meta, doneBtn]);
                
                warmupList.appendChild(row);
            });
        }
        
        // Build main workout section
        var mainList = el('div', { class: 'list' }, []);
        
        main.forEach(function(ex) {
            // Get current load for strength exercises
            (async function() {
                if (ex.type === 'upper') {
                    const load = await getLoadFor(ex.name);
                    ex.currentLoad = load.currentWeight;
                }
            })();
            
            var title = el('div', { class: 'title' }, [
                el('span', { class: 'badge' }, [
                    ex.type === 'upper' ? 'Str' : 
                    ex.type === 'lower' ? 'Leg' : 
                    ex.type === 'bodyweight' ? 'BW' :
                    ex.type === 'stretch' ? 'Mob' : 'Ex'
                ]), 
                ' ' + ex.name + ' ', 
                el('span', { class: 'badge' }, [ex.targetText || ''])
            ]);
            
            var metaText = ex.detail || '';
            if (ex.type === 'upper' && ex.targetReps > 0) {
                metaText = 'Target load: ' + (ex.currentLoad || 15) + ' lb per DB. ' + metaText;
            }
            var meta = el('div', { class: 'meta' }, [metaText]);
            
            var progress = el('div', { class: 'note' }, ['Progress: 0/' + ex.sets + ' sets']);
            
            // Tracking inputs
            var struggled = el('input', { type: 'checkbox' }, []);
            var repsInput = el('input', { 
                type: 'number', 
                min: '0', 
                style: 'width:60px', 
                placeholder: ex.targetReps.toString() 
            });
            var lbl = el('label', { class: 'note' }, ['Actual reps:']);
            var doneBtn = el('button', { class: 'btn small' }, ['Mark done']);
            
            // Initialize completed sets tracking
            if (!ex.completedSets) ex.completedSets = [];
            
            doneBtn.addEventListener('click', function() {
                setDemo(ex);
                var actualReps = parseInt(repsInput.value) || ex.targetReps;
                var isStruggled = struggled.checked;
                
                // Record this set
                ex.completedSets.push({
                    reps: actualReps,
                    weight: ex.currentLoad || 0,
                    struggled: isStruggled,
                    timestamp: new Date().toISOString()
                });
                
                ex.curDone = (ex.curDone || 0) + 1;
                progress.textContent = 'Progress: ' + ex.curDone + '/' + ex.sets + ' sets';
                
                // Reset inputs
                struggled.checked = false; 
                repsInput.value = '';
                
                // Start rest timer
                if (ex.type !== 'stretch') {
                    startRest(restSecs);
                }
                
                if (ex.curDone >= ex.sets) {
                    doneBtn.disabled = true;
                    doneBtn.textContent = '✓ Complete';
                }
            });
            
            var controlRow = el('div', { class: 'row' }, [
                lbl, repsInput, 
                el('label', { class: 'note' }, ['Struggled?']), 
                struggled, 
                doneBtn
            ]);
            
            // For stretches, simpler interface
            if (ex.type === 'stretch') {
                controlRow = el('div', { class: 'row' }, [doneBtn]);
                doneBtn.textContent = 'Complete';
                doneBtn.addEventListener('click', function() {
                    ex.completedSets = [{ reps: 0, weight: 0, struggled: false, timestamp: new Date().toISOString() }];
                    ex.curDone = 1;
                    doneBtn.disabled = true;
                    doneBtn.textContent = '✓ Done';
                }, true);
            }
            
            var row = el('div', { 
                class: 'item', 
                onclick: function() { setDemo(ex); } 
            }, [title, meta, controlRow, progress]);
            
            mainList.appendChild(row);
            
            // Store reference for finish button
            if (!session.exercises) session.exercises = [];
            session.exercises.push(ex);
        });
        
        // Finish button
        var finishBtn = el('button', { class: 'btn primary' }, ['Finish Workout']);
        finishBtn.addEventListener('click', async function() {
            if (restTimer) { 
                clearInterval(restTimer); 
                restTimer = null; 
            }
            
            // Process progression for completed exercises
            await processWorkoutCompletion(session.exercises);
            
            // Save workout to database
            try {
                const workoutRecord = {
                    date: session.date,
                    template: session.template,
                    isDeloadWeek: session.isDeloadWeek,
                    exercises: session.exercises.map(ex => ({
                        exerciseId: ex.name,
                        sets: ex.sets,
                        targetReps: ex.targetReps,
                        currentLoad: ex.currentLoad || 0,
                        completedSets: ex.completedSets || []
                    })),
                    startTime: session.date,
                    endTime: new Date().toISOString(),
                    notes: ''
                };
                
                await window.db.insert('workouts', workoutRecord);
                console.log('Workout saved:', workoutRecord);
                
                // Show success message
                finishBtn.disabled = true;
                finishBtn.textContent = '✓ Saved';
                
                // Refresh app data
                await self.refreshData();
                
                // Show completion message
                var completionMsg = el('div', { class: 'card', style: 'margin-top: 14px' }, [
                    el('h3', {}, ['Workout Complete! 🎉']),
                    el('div', {}, ['Mode: ' + workoutType]),
                    el('div', {}, ['Sets logged: ' + session.exercises.reduce((sum, ex) => sum + (ex.completedSets?.length || 0), 0)]),
                    el('div', { class: 'hr' }, []),
                    el('div', { class: 'note' }, [
                        isDeload ? 
                        'Deload week complete. Next week returns to normal intensity.' :
                        'Rest 2-3 minutes between sets for strength. Track progressive overload!'
                    ]),
                    el('div', { class: 'hr' }, []),
                    el('button', { class: 'btn', onclick: function() { self.setTab('logs'); } }, ['View Workout History'])
                ]);
                
                mainList.appendChild(completionMsg);
                
            } catch (error) {
                console.error('Failed to save workout:', error);
                alert('Error saving workout: ' + error.message);
            }
        });
        
        // Build left panel (demo + timer)
        var left = el('div', { class: 'card' }, [
            demo, 
            el('div', { class: 'row' }, [
                el('span', { class: 'badge' }, ['Rest']), 
                timerBadge
            ])
        ]);
        
        // Build right panel (workout)
        var rightContent = [];
        
        if (isDeload) {
            rightContent.push(
                el('div', { class: 'note', style: 'background: #2a4f86; padding: 10px; border-radius: 8px; margin-bottom: 10px' }, [
                    '⚠️ DELOAD WEEK: Reduced volume and intensity for recovery. Next week returns to normal.'
                ])
            );
        }
        
        if (warmups.length > 0) {
            rightContent.push(
                el('h3', {}, ['Warm-Up (5 min)']),
                el('div', { class: 'note' }, ['Complete these exercises to prepare your body for the workout.']),
                el('div', { class: 'hr' }, []),
                warmupList,
                el('div', { class: 'hr' }, [])
            );
        }
        
        var mainTitle = 'Main Workout';
        if (workoutType === 'recovery') mainTitle = 'Recovery Stretching (20-30 min)';
        
        rightContent.push(
            el('h3', {}, [mainTitle]),
            mainList
        );
        
        if (main.length > 0 && workoutType !== 'recovery') {
            rightContent.push(
                el('div', { class: 'hr' }, []),
                finishBtn
            );
        } else if (workoutType === 'recovery') {
            rightContent.push(
                el('div', { class: 'hr' }, []),
                el('div', { class: 'note' }, ['Take your time with each stretch. Hold for 30 seconds, breathe deeply, and relax into each position.'])
            );
        }
        
        var right = el('div', { class: 'card' }, rightContent);
        
        // Assemble page
        root.innerHTML = '';
        root.appendChild(header);
        
        if (workoutType === 'recovery') {
            // Recovery day: just show stretches, no demo panel
            root.appendChild(el('div', {}, [right]));
        } else {
            // Workout day: show demo + workout
            root.appendChild(el('div', { class: 'grid' }, [left, right]));
        }
        
    })();
    
    return root;
}