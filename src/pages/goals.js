import { el, todayISO, getUserProfile, getSettings, weeksUntilDeload, nextDeloadDate, getProgressionFor } from '../utils/helpers.js';

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

        function getExpectedGains(weeks) {
            if (weeks <= 2) return { strength: '5-10%', visible: 'Minimal', note: 'Neural adaptations starting' };
            if (weeks <= 8) return { strength: '15-25%', visible: 'Noticeable', note: 'Visible changes emerging' };
            if (weeks <= 24) return { strength: '25-35%', visible: 'Significant', note: 'Major muscle development' };
            if (weeks <= 52) return { strength: '35-50%', visible: 'Substantial', note: '1-year transformation complete' };
            if (weeks <= 104) return { strength: '50-70%', visible: 'Advanced', note: 'Year 2: Refined physique' };
            if (weeks <= 156) return { strength: '60-80%', visible: 'Expert', note: 'Year 3: Peak development' };
            if (weeks <= 260) return { strength: '70-90%', visible: 'Mastery', note: 'Years 4-5: Strength mastery' };
            return { strength: '80%+ gains', visible: 'Lifetime', note: 'Decades of health & vitality' };
        }

        var expected = getExpectedGains(weeksSinceStart);
        var weeksToDeload = weeksUntilDeload(settings.programStartDate);
        var nextDeload = nextDeloadDate(settings.programStartDate);

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
            
            weightInput.value = '';
            await self.refreshData();
            self.render();
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
            value: String(user.targetWeight || 165) 
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
        var currentWeight = user.currentWeight || 262;
        var targetForHangs = 200;
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
                el('div', { class: 'note' }, ['• Muscle: ' + expected.visible]),
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
                nextPushUpLevel ? 
                    el('div', { class: 'note' }, ['Next: ' + pushUpNames[nextPushUpLevel] + ' (hit 2×20 for 2 consecutive workouts)']) :
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