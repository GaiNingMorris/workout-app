import { el, fmtClock, setDemoImageFor, planForToday, workoutTypeForDate, getLoadFor, getProgressionFor, processWorkoutCompletion, getWorkoutSubtitle } from '../utils/helpers.js';
import { getFastingStatus, getFastingMotivation } from '../utils/nutrition.js';

export function renderToday(App) {
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
        var subtitle = getWorkoutSubtitle(workoutType, isDeload);
        
        var header = el('div', { class: 'brand' }, [
            el('div', { class: 'dot' }, []), 
            el('h2', {}, ['Today']), 
            el('span', { class: 'sub' }, [subtitle])
        ]);
        
        // Get fasting status
        const user = await window.db.findOne('user', { _id: 'user_profile' });
        const fastingStatus = getFastingStatus(user?.lastMealTime);
        const motivation = getFastingMotivation(fastingStatus);
        
        // Fasting status card (compact for workout page)
        var fastingCard = null;
        if (fastingStatus.fastingHours > 0) {
            fastingCard = el('div', { 
                class: 'card', 
                style: 'margin: 10px 0; padding: 12px; border-left: 3px solid ' + motivation.color 
            }, [
                el('div', { class: 'row', style: 'align-items: center; justify-content: space-between;' }, [
                    el('div', {}, [
                        el('span', { style: 'font-weight: bold; color: ' + motivation.color }, [
                            '🕐 Fast: ' + fastingStatus.fastingHours + 'h ' + fastingStatus.fastingMinutes + 'm'
                        ]),
                        el('span', { class: 'note', style: 'margin-left: 10px;' }, [fastingStatus.status])
                    ]),
                    el('button', { 
                        class: 'btn small', 
                        style: 'background: ' + motivation.color + '; color: #0a0a1a; padding: 4px 8px;',
                        onclick: () => self.setTab('nutrition')
                    }, ['Nutrition'])
                ])
            ]);
        }
        
        // Demo image area
        var demo = el('div', { class: 'pic' }, []);
        function setDemo(ex) { setDemoImageFor(demo, ex); }
        // Track selected exercise row for highlighting
        var selectedRow = null;
        function selectRow(row) {
            try {
                if (selectedRow && selectedRow !== row) selectedRow.classList.remove('selected');
                selectedRow = row;
                if (selectedRow) selectedRow.classList.add('selected');
            } catch (e) { /* ignore */ }
        }
        
        // Set initial demo image
        if (warmups.length > 0) setDemo(warmups[0]);
        else if (main.length > 0) setDemo(main[0]);
        
        // Rest timer
        var timerBadge = el('div', { 
            class: 'badge', 
            style: 'background: #2a4f86; color: white; padding: 8px 12px; border-radius: 6px; font-weight: bold; margin-left: 10px;'
        }, ['Ready']);
        var restTimer = null, restRemain = 0;
        
        function startRest(s) {
            if (restTimer) clearInterval(restTimer);
            restRemain = s; 
            timerBadge.textContent = fmtClock(restRemain);
            timerBadge.style.background = '#FF6B6B'; // Red during rest
            timerBadge.style.color = 'white';
            
            restTimer = setInterval(function () { 
                restRemain -= 1; 
                if (restRemain <= 0) { 
                    clearInterval(restTimer); 
                    restTimer = null; 
                    timerBadge.textContent = 'Ready'; 
                    timerBadge.style.background = '#7CFFB2'; // Green when ready
                    timerBadge.style.color = '#0a0a1a';
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
                    onclick: function(ev) { setDemo(ex); selectRow(ev.currentTarget || this); } 
                }, [title, meta, doneBtn]);
                
                warmupList.appendChild(row);
            });
        }
        
        // Build main workout section
        var mainList = el('div', { class: 'list' }, []);
        
        main.forEach(function(ex) {
            // Prepare a placeholder meta element; we'll update it when async load fetch completes
            var typeBadge = el('span', { class: 'badge' }, [
                ex.type === 'upper' ? 'Str' : 
                ex.type === 'lower' ? 'Leg' : 
                ex.type === 'bodyweight' ? 'BW' :
                ex.type === 'stretch' ? 'Mob' : 'Ex'
            ]);
            var targetBadge = el('span', { class: 'badge' }, [ex.targetText || '']);
            var title = el('div', { class: 'title' }, [ typeBadge, ' ' + ex.name + ' ', targetBadge ]);
            // Default meta text for non-strength exercises; will be updated for upper/bodyweight when async data is available
            var defaultMeta = ex.detail || ex.targetText || '';
            var meta = el('div', { class: 'meta' }, [defaultMeta]);

            // Fetch current load asynchronously and update the meta text when ready
            (async function() {
                try {
                    if (ex.type === 'upper') {
                        const load = await getLoadFor(ex.name);
                        ex.currentLoad = load.currentWeight;
                        // expose consecutive successes for UI display
                        ex._consecutiveSuccesses = load.consecutiveSuccesses || 0;
                        // get required consecutive from settings if present (best-effort)
                        if (window.appSettings && window.appSettings.weightIncreaseConsecutive) {
                            ex._requiredConsecutive = window.appSettings.weightIncreaseConsecutive;
                        }

                        // Update meta text to show the accurate load and progress
                        var metaText = ex.detail || '';
                        var succ = (ex._consecutiveSuccesses !== undefined) ? ex._consecutiveSuccesses : null;
                        var req = (ex._requiredConsecutive !== undefined) ? ex._requiredConsecutive : null;
                        var progressNote = '';
                        if (succ !== null && req !== null) progressNote = ' (' + succ + '/' + req + ' success workouts)';
                        meta.textContent = 'Target load: ' + (ex.currentLoad || 15) + ' lb per DB.' + progressNote + ' ' + metaText;
                        // update small badge showing target
                        try { targetBadge.textContent = (ex.currentLoad || 15) + ' lb'; } catch (e) {}
                    } else if (ex.type === 'bodyweight' && ex.name && ex.name.toLowerCase().indexOf('push') >= 0) {
                        // For push-up bodyweight progression, fetch progression state and show current level
                        try {
                            const prog = await getProgressionFor('Push-Up');
                            if (prog && prog.currentLevel) {
                                meta.textContent = (ex.targetText || '') + ' — Level: ' + prog.currentLevel;
                                try { targetBadge.textContent = ex.targetText || ''; } catch (e) {}
                            }
                        } catch (pe) {
                            // ignore progression fetch errors
                        }
                    } else if (ex.type === 'bodyweight' && ex.name && ex.name !== 'Bar Hang') {
                        // Generic bodyweight progression (e.g., TRX Assisted Squat): fetch stored progression to override targetReps/targetText
                        try {
                            const prog = await getProgressionFor(ex.name);
                            if (prog) {
                                if (prog.targetReps !== undefined && prog.targetReps !== null) {
                                    ex.targetReps = prog.targetReps;
                                    ex.targetText = (ex.sets ? ex.sets : 1) + '×' + String(ex.targetReps);
                                    try { targetBadge.textContent = ex.targetText || ''; } catch (e) {}
                                }
                                ex._consecutiveSuccesses = prog.consecutiveSuccesses || 0;
                                if (ex._consecutiveSuccesses !== undefined && window.appSettings && window.appSettings.weightIncreaseConsecutive) {
                                    ex._requiredConsecutive = window.appSettings.weightIncreaseConsecutive;
                                    meta.textContent = (ex.detail || '') + ' (' + ex._consecutiveSuccesses + '/' + ex._requiredConsecutive + ' success workouts)';
                                } else {
                                    meta.textContent = ex.detail || ex.targetText || '';
                                }
                            }
                        } catch (pe) {
                            // ignore progression fetch errors
                        }
                    }
                } catch (e) {
                    console.error('Error fetching load for', ex.name, e);
                    // leave meta as-is or show fallback
                    if (!meta.textContent || meta.textContent.indexOf('Loading') >= 0) {
                        meta.textContent = ex.detail || '';
                    }
                }
            })();
            
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
            
            // Timer for time-based exercises (like plank)
            var timerDisplay, timerBtn, currentTimer, targetSeconds = 30;
            var isTimeBased = ex.targetReps === 0 && ex.targetText && ex.targetText.includes('s');
            
            if (isTimeBased) {
                // Extract target seconds from targetText (e.g., "3×30s" -> 30)
                var match = ex.targetText.match(/(\d+)s/);
                if (match) targetSeconds = parseInt(match[1]);
                
                timerDisplay = el('div', { 
                    class: 'timer-display',
                    style: 'font-size: 24px; font-weight: bold; color: #7CFFB2; margin: 10px 0;'
                }, [targetSeconds + 's']);
                
                timerBtn = el('button', { 
                    class: 'btn', 
                    style: 'background: #7CFFB2; color: #0a0a1a; margin-right: 10px;'
                }, ['Start Timer']);
                
                var isRunning = false;
                var timeLeft = targetSeconds;
                
                timerBtn.addEventListener('click', function() {
                    if (timerBtn.textContent === 'Reset') {
                        // Reset timer
                        timeLeft = targetSeconds;
                        timerDisplay.textContent = targetSeconds + 's';
                        timerDisplay.style.color = '#7CFFB2';
                        timerBtn.textContent = 'Start Timer';
                        timerBtn.style.background = '#7CFFB2';
                        isRunning = false;
                        if (currentTimer) clearInterval(currentTimer);
                    } else if (!isRunning) {
                        // Start timer
                        isRunning = true;
                        timerBtn.textContent = 'Stop Timer';
                        timerBtn.style.background = '#FF6B6B';
                        
                        currentTimer = setInterval(function() {
                            timeLeft--;
                            timerDisplay.textContent = timeLeft + 's';
                            
                            if (timeLeft <= 0) {
                                clearInterval(currentTimer);
                                timerDisplay.textContent = '✓ Done!';
                                timerDisplay.style.color = '#7CFFB2';
                                timerBtn.textContent = 'Reset';
                                timerBtn.style.background = '#FFD93D';
                                isRunning = false;
                                
                                // Play a simple audio cue if possible
                                try {
                                    var audio = new Audio();
                                    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBzuP1fPQfCwGJXLB8OGUQQwUW7Hn7KpZFgxGk+Dpv2MdBzqL0/LVhiwGKW3A7+OWRQ0VWqvk6q1XFQxChN3ovGQcBzmI0fnLKj';
                                    audio.play();
                                } catch (e) {
                                    // Audio failed, use visual feedback
                                    document.body.style.background = '#7CFFB2';
                                    setTimeout(() => document.body.style.background = '', 200);
                                }
                            }
                        }, 1000);
                    } else {
                        // Stop timer
                        clearInterval(currentTimer);
                        isRunning = false;
                        timerBtn.textContent = 'Reset';
                        timerBtn.style.background = '#FFD93D';
                    }
                });
            }
            
            // Initialize completed sets tracking
            if (!ex.completedSets) ex.completedSets = [];
            
            // Add event listener only for non-stretch exercises (stretches get their own handler above)
            if (ex.type !== 'stretch') {
                doneBtn.addEventListener('click', function() {
                    setDemo(ex);
                    var actualReps = isTimeBased ? 1 : (parseInt(repsInput.value) || ex.targetReps);
                    var isStruggled = struggled.checked;
                    
                    // Record this set
                    ex.completedSets.push({
                        reps: actualReps,
                        weight: ex.currentLoad || 0,
                        struggled: isStruggled,
                        timestamp: new Date().toISOString(),
                        timeSeconds: isTimeBased ? (targetSeconds || 30) : 0
                    });
                    
                    ex.curDone = (ex.curDone || 0) + 1;
                    progress.textContent = 'Progress: ' + ex.curDone + '/' + ex.sets + ' sets';
                    
                    // Reset inputs
                    struggled.checked = false;
                    if (!isTimeBased) {
                        repsInput.value = '';
                    }
                    
                    // Disable the done button and start mandatory rest period
                    if (ex.curDone < ex.sets) {
                        doneBtn.disabled = true;
                        var restCountdown = restSecs;
                        doneBtn.textContent = `Rest: ${fmtClock(restCountdown)}`;
                        doneBtn.style.background = '#FF6B6B';
                        doneBtn.style.color = 'white';
                        doneBtn.title = 'Mandatory rest between sets. Shift+Click to skip.';
                        
                        var restInterval = setInterval(function() {
                            restCountdown--;
                            if (restCountdown <= 0) {
                                clearInterval(restInterval);
                                doneBtn.disabled = false;
                                doneBtn.textContent = 'Mark done';
                                doneBtn.style.background = '';
                                doneBtn.style.color = '';
                                doneBtn.title = '';
                                // Visual notification that rest is complete
                                doneBtn.style.background = '#7CFFB2';
                                setTimeout(() => {
                                    doneBtn.style.background = '';
                                }, 1000);
                                
                                // Optional: Play sound notification
                                try {
                                    var audio = new Audio();
                                    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBzuP1fPQfCwGJXLB8OGUQQwUW7Hn7KpZFgxGk';
                                    audio.play();
                                } catch (e) {
                                    // Audio failed, just visual feedback
                                }
                            } else {
                                doneBtn.textContent = `Rest: ${fmtClock(restCountdown)}`;
                            }
                        }, 1000);
                        
                        // Allow advanced users to skip rest with Shift+Click
                        doneBtn.addEventListener('click', function(e) {
                            if (e.shiftKey && doneBtn.disabled) {
                                clearInterval(restInterval);
                                doneBtn.disabled = false;
                                doneBtn.textContent = 'Mark done';
                                doneBtn.style.background = '';
                                doneBtn.style.color = '';
                                doneBtn.title = '';
                            }
                        });
                    }
                    
                    // Start visual rest timer
                    startRest(restSecs);
                    
                    if (ex.curDone >= ex.sets) {
                        doneBtn.disabled = true;
                        doneBtn.textContent = '✓ Complete';
                        doneBtn.style.background = '#7CFFB2';
                        doneBtn.style.color = '#0a0a1a';
                        
                        // Clear any running timer
                        if (currentTimer) {
                            clearInterval(currentTimer);
                        }
                    }
                });
            }
            
            var controlRow;
            
            if (ex.type === 'stretch') {
                // Simple interface for stretches - no mandatory rest
                controlRow = el('div', { class: 'row' }, [doneBtn]);
                doneBtn.textContent = 'Complete';
                doneBtn.addEventListener('click', function() {
                    ex.completedSets = [{ reps: 0, weight: 0, struggled: false, timestamp: new Date().toISOString() }];
                    ex.curDone = 1;
                    doneBtn.disabled = true;
                    doneBtn.textContent = '✓ Done';
                    doneBtn.style.background = '#7CFFB2';
                    doneBtn.style.color = '#0a0a1a';
                }, true);
            } else if (isTimeBased) {
                // Timer interface for time-based exercises (like plank)
                controlRow = el('div', { class: 'row', style: 'flex-direction: column; align-items: center;' }, [
                    timerDisplay,
                    el('div', { style: 'margin: 10px 0;' }, [
                        timerBtn,
                        el('label', { class: 'note', style: 'margin-left: 15px;' }, ['Struggled?']), 
                        struggled
                    ]),
                    doneBtn
                ]);
            } else {
                // Regular rep-based interface
                controlRow = el('div', { class: 'row' }, [
                    lbl, repsInput, 
                    el('label', { class: 'note' }, ['Struggled?']), 
                    struggled, 
                    doneBtn
                ]);
            }
            
            var row = el('div', { 
                class: 'item', 
                onclick: function(ev) { setDemo(ex); selectRow(ev.currentTarget || this); } 
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
                // Workout saved successfully
                
                // Show success message
                finishBtn.disabled = true;
                finishBtn.textContent = '✓ Saved';
                
                // Refresh app data
                await self.refreshData();
                // Re-render the app (so updated progression/targets appear immediately)
                try { self.render(); } catch (e) { /* ignore render errors */ }
                
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
                    el('div', { class: 'note', style: 'background: #7CFFB2; color: #0a0a1a; padding: 8px; border-radius: 4px; margin: 8px 0;' }, [
                        '🎮 Your fitness game score has been updated! Check the Charts tab to see your latest progress and achievements.'
                    ]),
                    el('button', { class: 'btn', onclick: function() { self.setTab('logs'); } }, ['View Workout History']),
                    el('button', { class: 'btn', style: 'background: #7CFFB2; color: #0a0a1a; margin-left: 8px;', onclick: function() { self.setTab('charts'); } }, ['🎮 View Fitness Score']),
                    el('button', { class: 'btn', style: 'background: #FFB84D; color: #0a0a1a; margin-left: 8px;', onclick: function() { self.setTab('nutrition'); } }, ['🍽️ Track Nutrition'])
                ]);
                
                mainList.appendChild(completionMsg);
                
            } catch (error) {
                console.error('Failed to save workout:', error);
                alert('Error saving workout: ' + error.message);
            }
        });
        
        // Build left panel (demo only)
        var left = el('div', { class: 'card' }, [demo]);
        
        // Build right panel (workout)
        var rightContent = [];
        
        // Add rest timer display to right panel
        rightContent.push(
            el('div', { class: 'note', style: 'background: #1a2332; padding: 10px; border-radius: 8px; margin-bottom: 10px; text-align: center;' }, [
                el('strong', {}, ['Rest Timer: ']),
                timerBadge
            ])
        );
        
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
        
    var right = el('div', { class: 'card right-panel' }, rightContent);
        
        // Assemble page
        root.innerHTML = '';
        root.appendChild(header);
        
        // Add fasting status if available
        if (fastingCard) {
            root.appendChild(fastingCard);
        }
        
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