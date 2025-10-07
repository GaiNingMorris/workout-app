import { el, todayISO, getUserProfile, getSettings, weeksUntilDeload, nextDeloadDate, getProgressionFor } from '../utils/helpers.js';
import { USER_CONFIG, getUserProfileDescription } from '../config/userConfig.js';

export function renderGoals(App) {
    var self = App;
    var root = el('div', {}, []);
    
    (async function() {
        const user = await getUserProfile();
        const settings = await getSettings();
        const pushUpProg = await getProgressionFor('Push-Up');
        
        var firstLogDate = new Date(user.startDate || new Date());
        var daysSinceStart = Math.floor((Date.now() - firstLogDate.getTime()) / (1000 * 60 * 60 * 24));
        var weeksSinceStart = Math.floor(daysSinceStart / 7);

        function getExpectedGains(weeks, userAge, userGender, startWeight, targetWeight) {
            // Realistic expectations based on user profile
            var weightToLose = Math.max(0, startWeight - targetWeight);
            var ageMultiplier = userAge > 50 ? 0.8 : userAge > 40 ? 0.9 : 1.0; // Slower progress for older adults
            var genderMultiplier = userGender === 'female' ? 0.85 : 1.0; // Different expectations
            
            if (weeks <= 4) return { 
                strength: Math.round(15 * ageMultiplier) + '%', 
                weight: Math.round(weeks * 1.5 * ageMultiplier) + ' lbs progress', 
                visible: 'Better posture, energy', 
                note: 'Neural adaptations, movement patterns improving' 
            };
            if (weeks <= 12) return { 
                strength: Math.round(35 * ageMultiplier) + '%', 
                weight: Math.round(weeks * 1.2 * ageMultiplier) + ' lbs progress', 
                visible: 'Clothes fitting better', 
                note: 'Noticeable strength gains, habit formation' 
            };
            if (weeks <= 24) return { 
                strength: Math.round(55 * ageMultiplier) + '%', 
                weight: Math.round(Math.min(weeks * 1.0 * ageMultiplier, weightToLose * 0.6)) + ' lbs progress', 
                visible: 'Clear muscle definition', 
                note: 'Major body composition changes' 
            };
            if (weeks <= 52) return { 
                strength: Math.round(85 * ageMultiplier) + '%', 
                weight: Math.round(Math.min(weeks * 0.8 * ageMultiplier, weightToLose * 0.8)) + ' lbs progress', 
                visible: 'Transformation visible', 
                note: 'Year 1: Foundation built, significant progress' 
            };
            if (weeks <= 104) return { 
                strength: Math.round(130 * ageMultiplier) + '%', 
                weight: weightToLose > 0 ? 'Near goal weight!' : 'Maintaining target', 
                visible: 'Athletic appearance', 
                note: 'Year 2: Advanced strength, body composition optimized' 
            };
            return { 
                strength: Math.round(150 * ageMultiplier) + '%+', 
                weight: 'Goal achieved!', 
                visible: 'Peak physique maintained', 
                note: 'Maintenance phase: Health & vitality optimized' 
            };
        }



        var expected = getExpectedGains(weeksSinceStart, user.age || 50, user.gender || 'male', 
                                        user.bodyweightHistory?.[0]?.weight || user.currentWeight, 
                                        user.targetWeight);
        var weeksToDeload = await weeksUntilDeload(settings.programStartDate);
        var nextDeload = await nextDeloadDate(settings.programStartDate);

        // Weight tracking
        var weightInput = el('input', { class: 'input', placeholder: 'Weight (lb)', type: 'number', step: '0.1' }, []);
        var addBtn = el('button', { class: 'btn' }, ['Add Today']);
        
        addBtn.addEventListener('click', async function() {
            var w = parseFloat(weightInput.value);
            if (!w || w <= 0) {
                alert('Please enter a valid weight');
                return;
            }
            
            var day = todayISO();
            var history = user.bodyweightHistory || [];
            var found = history.find(entry => entry.date === day);
            
            if (found) {
                found.weight = w;
            } else {
                history.push({ date: day, weight: w });
            }
            
            // Update user profile
            await window.db.update(
                'user',
                { _id: 'user_profile' },
                { $set: { currentWeight: w, bodyweightHistory: history } }
            );
            
            // Update nutrition targets with new weight
            try {
                const { updateCurrentWeight } = await import('../utils/nutrition.js');
                await updateCurrentWeight(w);
            } catch (error) {
                console.error('Error updating nutrition targets:', error);
            }
            
            weightInput.value = '';
            await self.refreshData();
            self.render();
            
            // Show success message
            var weightChange = user.currentWeight - w;
            if (weightChange > 0) {
                alert('🎉 Weight logged: ' + w + ' lbs (-' + weightChange.toFixed(1) + ' lbs progress!)\n\nNutrition targets automatically updated.');
            } else if (weightChange < 0) {
                alert('Weight logged: ' + w + ' lbs\n\nNutrition targets automatically updated.');
            } else {
                alert('Weight logged: ' + w + ' lbs\n\nNutrition targets automatically updated.');
            }
        });

        // Hang time tracking
        var hangInput = el('input', { 
            class: 'input', 
            placeholder: 'Best hang (sec)', 
            type: 'number',
            value: String(user.bestHangTime || '') 
        }, []);
        
        var saveHang = el('button', { class: 'btn' }, ['Save Hang Best']);
        saveHang.addEventListener('click', async function() { 
            var v = parseFloat(hangInput.value); 
            if (isNaN(v) || v < 0) v = 0;
            
            await window.db.update(
                'user',
                { _id: 'user_profile' },
                { $set: { bestHangTime: v } }
            );
            
            await self.refreshData();
            self.render();
        });

        // Target weight
        var targetWeight = el('input', { 
            class: 'input', 
            placeholder: 'Overall bodyweight goal (lb)', 
            type: 'number',
            value: String(user.targetWeight || USER_CONFIG.targetWeight) 
        }, []);
        
        var saveTarget = el('button', { class: 'btn' }, ['Save Goal']);
        saveTarget.addEventListener('click', async function() { 
            var v = parseFloat(targetWeight.value); 
            if (isNaN(v) || v <= 0) {
                alert('Please enter a valid target weight');
                return;
            }
            
            await window.db.update(
                'user',
                { _id: 'user_profile' },
                { $set: { targetWeight: v } }
            );
            
            await self.refreshData();
            self.render();
        });

        // Calculate unlock progress
        var currentWeight = user.currentWeight || USER_CONFIG.startingWeight;
        var targetForHangs = USER_CONFIG.barHangUnlockWeight;
        var weightToLose = Math.max(0, currentWeight - targetForHangs);
        var hangUnlocked = currentWeight <= targetForHangs;
        var chinUnlocked = hangUnlocked && (user.bestHangTime || 0) >= 30;
        
        // Push-up progression display
        var pushUpLevels = ['wall', 'knee', 'full'];
        var pushUpNames = { wall: 'Wall Push-Ups', knee: 'Knee Push-Ups', full: 'Full Push-Ups' };
        var currentPushUpLevel = pushUpProg.currentLevel || 'wall';
        var currentIndex = pushUpLevels.indexOf(currentPushUpLevel);
        var nextPushUpLevel = currentIndex < pushUpLevels.length - 1 ? pushUpLevels[currentIndex + 1] : null;

        // Left panel - Progress tracking
        var left = el('div', { class: 'card' }, [
            el('h3', {}, ['Progress Tracking']),
            el('div', { class: 'note' }, ['Week ' + weeksSinceStart + ' • ' + daysSinceStart + ' days since start']),
            el('div', { class: 'hr' }, []),
            
            // Expected progress
            el('div', { style: 'margin: 10px 0;' }, [
                el('strong', {}, ['Expected at Week ' + weeksSinceStart + ':']),
                el('div', { class: 'note' }, ['• Strength: ' + expected.strength]),
                el('div', { class: 'note' }, ['• Weight Loss: ' + expected.weight]),
                el('div', { class: 'note' }, ['• Visible Changes: ' + expected.visible]),
                el('div', { class: 'note' }, ['• ' + expected.note])
            ]),
            el('div', { class: 'hr' }, []),
            
            // Deload cycle info
            el('div', { style: 'margin: 10px 0;' }, [
                el('strong', {}, ['Deload Cycle:']),
                el('div', { class: 'note' }, [
                    weeksToDeload === 0 ? 
                    '⚠️ THIS IS DELOAD WEEK - Reduced volume for recovery' :
                    '• Next deload in ' + weeksToDeload + ' week' + (weeksToDeload === 1 ? '' : 's') + 
                    (nextDeload ? ' (' + nextDeload.toLocaleDateString() + ')' : '')
                ]),
                el('div', { class: 'note' }, ['• Deloads occur every 8 weeks automatically'])
            ]),
            el('div', { class: 'hr' }, []),


            
            // Goals
            el('div', { class: 'kv' }, [
                el('label', {}, ['Target Weight']), 
                targetWeight, 
                saveTarget
            ]),
            el('div', { class: 'kv' }, [
                el('label', {}, ['Best Hang (sec)']), 
                hangInput, 
                saveHang
            ])
        ]);

        // Right panel - Unlocks and bodyweight log
        var tbody = [];
        var history = user.bodyweightHistory || [];
        for (var i = history.length - 1; i >= 0 && i >= history.length - 10; i--) { 
            tbody.push(el('tr', {}, [
                el('td', {}, [history[i].date]), 
                el('td', {}, [String(history[i].weight) + ' lb'])
            ])); 
        }

        // Build unlocks display
        var unlocksSection = el('div', { style: 'margin: 10px 0;' }, [
            el('strong', {}, ['Exercise Unlocks:']),
            el('div', { class: 'hr', style: 'margin: 8px 0' }, []),
            
            // Push-up progression
            el('div', { style: 'margin: 10px 0; padding: 10px; background: #0e1a2d; border-radius: 8px' }, [
                el('div', { style: 'font-weight: 600; margin-bottom: 4px' }, ['Push-Up Progression']),
                el('div', { class: 'note' }, [
                    'Current: ' + pushUpNames[currentPushUpLevel] + 
                    ' (' + (pushUpProg.consecutiveSuccesses || 0) + '/2 success workouts)'
                ]),
                // Show current rep target and progression path
                (function() {
                    const consecutiveSuccesses = pushUpProg.consecutiveSuccesses || 0;
                    const repProgression = {
                        wall: { baseReps: 15, increments: [0, 3, 5, 8, 10], maxReps: 25, maxTotal: 50 },
                        knee: { baseReps: 8, increments: [0, 2, 4, 6, 8], maxReps: 16, maxTotal: 32 },
                        full: { baseReps: 5, increments: [0, 2, 3, 5, 7], maxReps: 12, maxTotal: 24 }
                    };
                    const currentProg = repProgression[currentPushUpLevel] || repProgression.wall;
                    const incrementIndex = Math.min(consecutiveSuccesses, currentProg.increments.length - 1);
                    const currentTarget = currentProg.baseReps + currentProg.increments[incrementIndex];
                    
                    return el('div', { class: 'note' }, [
                        'Current target: 2×' + currentTarget + ' reps (' + (currentTarget * 2) + ' total)'
                    ]);
                })(),
                nextPushUpLevel ? 
                    el('div', { class: 'note' }, [
                        'Next level: ' + pushUpNames[nextPushUpLevel] + ' (after hitting max reps for 3 consecutive workouts)'
                    ]) :
                    el('div', { class: 'note' }, ['🎉 Max level achieved!'])
            ]),
            
            // Bar hang unlock
            el('div', { style: 'margin: 10px 0; padding: 10px; background: #0e1a2d; border-radius: 8px' }, [
                el('div', { style: 'font-weight: 600; margin-bottom: 4px' }, ['Bar Hangs']),
                hangUnlocked ? 
                    el('div', { class: 'note', style: 'color: #7CFFB2' }, ['✓ UNLOCKED at bodyweight ≤200 lbs']) :
                    el('div', { class: 'note' }, [
                        '🔒 Unlocks at bodyweight ≤200 lbs',
                        el('div', {}, ['Current: ' + currentWeight + ' lb']),
                        el('div', {}, ['To go: ' + weightToLose.toFixed(1) + ' lb'])
                    ])
            ]),
            
            // Chin-up unlock
            el('div', { style: 'margin: 10px 0; padding: 10px; background: #0e1a2d; border-radius: 8px' }, [
                el('div', { style: 'font-weight: 600; margin-bottom: 4px' }, ['Assisted Chin-Ups']),
                chinUnlocked ? 
                    el('div', { class: 'note', style: 'color: #7CFFB2' }, ['✓ UNLOCKED with 30s+ hang time']) :
                    hangUnlocked ?
                        el('div', { class: 'note' }, [
                            '🔒 Unlocks at hang time ≥30 seconds',
                            el('div', {}, ['Current best: ' + (user.bestHangTime || 0) + 's']),
                            el('div', {}, ['To go: ' + Math.max(0, 30 - (user.bestHangTime || 0)) + 's'])
                        ]) :
                        el('div', { class: 'note' }, [
                            '🔒 First unlock bar hangs (≤200 lb bodyweight)',
                            el('div', {}, ['Then achieve 30s hang time for chin-ups'])
                        ])
            ])
        ]);

        var right = el('div', { class: 'card' }, [
            el('h3', {}, ['Body Weight Log']),
            el('div', { class: 'kv' }, [
                el('label', {}, ["Today's Weight"]), 
                weightInput, 
                addBtn
            ]),
            el('div', { class: 'hr' }, []),
            
            el('table', { class: 'table' }, [
                el('thead', {}, [
                    el('tr', {}, [
                        el('th', {}, ['Date']), 
                        el('th', {}, ['Weight'])
                    ])
                ]), 
                el('tbody', {}, tbody)
            ]),
            
            el('div', { class: 'hr' }, []),
            unlocksSection
        ]);

        root.appendChild(el('div', { class: 'brand' }, [
            el('div', { class: 'dot' }, []), 
            el('h2', {}, ['Goals & Progress']), 
            el('span', { class: 'sub' }, ['Track your muscle-building journey'])
        ]));
        
        root.appendChild(el('div', { class: 'grid' }, [left, right]));
    })();

    return root;
}