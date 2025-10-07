import { el, getSettings } from '../utils/helpers.js';
import { USER_CONFIG, getUserProfileDescription, performFactoryReset, migrateToConfigDefaults } from '../config/userConfig.js';

export function renderSettings(App) {
    var self = App;
    var root = el('div', {}, []);
    
    (async function() {
        const settings = await getSettings();
        
        // Auto-migrate old hardcoded values to config defaults
        try {
            await migrateToConfigDefaults();
        } catch (e) {
            console.log('Migration check failed:', e);
        }
        
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

        // Weight progression tuning
        var weightIncreaseAmount = el('input', {
            class: 'input',
            type: 'number',
            step: '0.1',
            value: String(settings.weightIncreaseAmount || 1.5)
        }, []);

        var weightIncreaseConsecutive = el('input', {
            class: 'input',
            type: 'number',
            value: String(settings.weightIncreaseConsecutive || 3)
        }, []);

        var saveBtn = el('button', { class: 'btn' }, ['Save Settings']);
        saveBtn.addEventListener('click', async function() {
            var restStrength = parseInt(restGood.value, 10) || 120;
            var restEasySec = parseInt(restEasy.value, 10) || 90;
            var deloadWeeks = parseInt(deloadInterval.value, 10) || 8;
            var weightInc = parseFloat(weightIncreaseAmount.value) || 1.5;
            var weightReq = parseInt(weightIncreaseConsecutive.value, 10) || 3;
            
            if (deloadWeeks < 4 || deloadWeeks > 12) {
                alert('Deload interval should be between 4 and 12 weeks');
                return;
            }
            if (weightInc <= 0) {
                alert('Weight increase must be greater than 0');
                return;
            }
            if (weightReq < 1 || weightReq > 10) {
                alert('Consecutive successes should be between 1 and 10');
                return;
            }
            
            await window.db.update(
                'settings',
                { _id: 'app_settings' },
                { $set: { 
                    restTimerStrength: restStrength,
                    restTimerEasy: restEasySec,
                    deloadInterval: deloadWeeks,
                    weightIncreaseAmount: weightInc,
                    weightIncreaseConsecutive: weightReq
                }}
            );
            
            await self.refreshData();
            alert('Settings saved!');
        });

        // Old factory reset removed - using new config-aware version below
        
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
            el('div', { class: 'kv' }, [
                el('label', {}, ['Weight increase (lb)']),
                weightIncreaseAmount
            ]),
            el('div', { class: 'kv' }, [
                el('label', {}, ['Consecutive successes required']),
                weightIncreaseConsecutive
            ]),
            el('div', { class: 'row', style: 'margin-top: 10px' }, [saveBtn])
        ]);

        // User Profile & Factory Reset
        var profileResetBtn = el('button', { 
            class: 'btn', 
            style: 'background: #FF6B6B; color: white;' 
        }, ['🏭 Factory Reset']);
        
        profileResetBtn.addEventListener('click', async function() {
            var confirmed = confirm(
                `FACTORY RESET WARNING!\n\n` +
                `This will permanently delete ALL your data and reset to:\n` +
                `• Starting weight: ${USER_CONFIG.startingWeight} lbs\n` +
                `• Target weight: ${USER_CONFIG.targetWeight} lbs\n` +
                `• Age: ${USER_CONFIG.age}\n` +
                `• All workout logs will be deleted\n` +
                `• All progress will be lost\n\n` +
                `This CANNOT be undone! Are you sure?`
            );
            
            if (confirmed) {
                try {
                    var result = await performFactoryReset();
                    if (result.success) {
                        alert('Factory reset complete! App will reload with fresh data.');
                        await self.refreshData();
                        self.render();
                    } else {
                        alert('Factory reset failed: ' + result.error);
                    }
                } catch (error) {
                    alert('Factory reset error: ' + error.message);
                }
            }
        });

        // Get current user to show actual values
        var currentUser = await window.db.findOne('user', { _id: 'user_profile' });
        
        // User Profile Form Fields
        var ageInput = el('input', {
            class: 'input',
            type: 'number',
            placeholder: 'Age (years)',
            value: String(currentUser ? currentUser.age || '' : '')
        }, []);

        var genderSelect = el('select', { class: 'input' }, [
            el('option', { value: 'male', selected: currentUser && currentUser.gender === 'male' }, ['Male']),
            el('option', { value: 'female', selected: currentUser && currentUser.gender === 'female' }, ['Female'])
        ]);

        var heightInput = el('input', {
            class: 'input',
            type: 'number',
            placeholder: 'Height (inches)',
            value: String(currentUser ? currentUser.height || '' : '')
        }, []);

        var currentWeightInput = el('input', {
            class: 'input',
            type: 'number',
            step: '0.1',
            placeholder: 'Current weight (lbs)',
            value: String(currentUser ? currentUser.currentWeight || '' : '')
        }, []);

        var goalSelect = el('select', { class: 'input' }, [
            el('option', { value: 'lose_weight', selected: currentUser && currentUser.fitnessGoal === 'lose_weight' }, ['Lose Weight & Build Muscle']),
            el('option', { value: 'maintain_build', selected: currentUser && currentUser.fitnessGoal === 'maintain_build' }, ['Maintain Weight & Build Muscle']),
            el('option', { value: 'bulk', selected: currentUser && currentUser.fitnessGoal === 'bulk' }, ['Gain Weight & Build Muscle'])
        ]);

        // Calculate recommended target weight based on height and goals
        function calculateTargetWeight(heightInches, currentWeight, goal, gender) {
            if (!heightInches || !currentWeight) return currentWeight;
            
            // BMI-based healthy weight range calculation
            var heightMeters = heightInches * 0.0254;
            var healthyBMIMin = gender === 'female' ? 18.5 : 20;
            var healthyBMIMax = gender === 'female' ? 24.9 : 25;
            
            var healthyWeightMin = healthyBMIMin * heightMeters * heightMeters * 2.205; // Convert to lbs
            var healthyWeightMax = healthyBMIMax * heightMeters * heightMeters * 2.205;
            
            if (goal === 'lose_weight') {
                // Target middle of healthy range, or 80% of current if already in range
                return currentWeight > healthyWeightMax ? 
                    Math.round((healthyWeightMin + healthyWeightMax) / 2) :
                    Math.round(currentWeight * 0.85);
            } else if (goal === 'maintain_build') {
                return currentWeight;
            } else { // bulk
                // Target upper healthy range
                return Math.round(healthyWeightMax);
            }
        }

        var targetWeightInput = el('input', {
            class: 'input',
            type: 'number',
            step: '0.1',
            placeholder: 'Target weight (lbs)',
            value: String(currentUser ? currentUser.targetWeight || '' : '')
        }, []);

        // Auto-calculate target weight when other fields change
        function updateTargetWeight() {
            var height = parseFloat(heightInput.value);
            var weight = parseFloat(currentWeightInput.value);
            var goal = goalSelect.value;
            var gender = genderSelect.value;
            
            if (height && weight) {
                var recommended = calculateTargetWeight(height, weight, goal, gender);
                targetWeightInput.value = String(recommended);
            }
        }

        heightInput.addEventListener('input', updateTargetWeight);
        currentWeightInput.addEventListener('input', updateTargetWeight);
        goalSelect.addEventListener('change', updateTargetWeight);
        genderSelect.addEventListener('change', updateTargetWeight);

        var saveProfileBtn = el('button', { class: 'btn' }, ['Save Profile']);
        saveProfileBtn.addEventListener('click', async function() {
            var age = parseInt(ageInput.value);
            var gender = genderSelect.value;
            var height = parseFloat(heightInput.value);
            var currentWeight = parseFloat(currentWeightInput.value);
            var targetWeight = parseFloat(targetWeightInput.value);
            var fitnessGoal = goalSelect.value;
            
            // Validation
            if (!age || age < 13 || age > 100) {
                alert('Please enter a valid age (13-100)');
                return;
            }
            if (!height || height < 48 || height > 84) {
                alert('Please enter a valid height (48-84 inches)');
                return;
            }
            if (!currentWeight || currentWeight < 80 || currentWeight > 500) {
                alert('Please enter a valid current weight (80-500 lbs)');
                return;
            }
            if (!targetWeight || targetWeight < 80 || targetWeight > 500) {
                alert('Please enter a valid target weight (80-500 lbs)');
                return;
            }
            
            try {
                var user = await window.db.findOne('user', { _id: 'user_profile' });
                var profileData = {
                    age: age,
                    gender: gender,
                    height: height,
                    currentWeight: currentWeight,
                    targetWeight: targetWeight,
                    fitnessGoal: fitnessGoal,
                    bodyweightHistory: user && user.bodyweightHistory ? user.bodyweightHistory : [{ 
                        date: new Date().toISOString().split('T')[0], 
                        weight: currentWeight 
                    }]
                };
                
                if (user) {
                    // Update existing user
                    await window.db.update(
                        'user',
                        { _id: 'user_profile' },
                        { $set: profileData }
                    );
                } else {
                    // Create new user
                    profileData._id = 'user_profile';
                    profileData.startDate = new Date().toISOString();
                    profileData.bestHangTime = 0;
                    profileData.unlocksAchieved = [];
                    await window.db.insert('user', profileData);
                }
                
                alert('Profile saved successfully!');
                await self.refreshData();
                self.render();
            } catch (error) {
                alert('Error saving profile: ' + error.message);
            }
        });

        // Check if profile is complete
        var isProfileComplete = currentUser && currentUser.age && currentUser.gender && 
                               currentUser.height && currentUser.currentWeight && currentUser.targetWeight;

        var right = el('div', { class: 'card' }, [
            el('h3', {}, ['👤 User Profile']),
            isProfileComplete ? 
                el('div', { class: 'note', style: 'color: #7CFFB2;' }, ['✅ Profile complete! Update any field below.']) :
                el('div', { class: 'note', style: 'color: #FFD93D;' }, ['⚠️ Please complete your profile for personalized recommendations.']),
            el('div', { class: 'kv' }, [
                el('label', {}, ['Age']),
                ageInput
            ]),
            el('div', { class: 'kv' }, [
                el('label', {}, ['Gender']),
                genderSelect
            ]),
            el('div', { class: 'kv' }, [
                el('label', {}, ['Height (inches)']),
                heightInput
            ]),
            el('div', { class: 'kv' }, [
                el('label', {}, ['Current Weight (lbs)']),
                currentWeightInput
            ]),
            el('div', { class: 'kv' }, [
                el('label', {}, ['Fitness Goal']),
                goalSelect
            ]),
            el('div', { class: 'kv' }, [
                el('label', {}, ['Target Weight (lbs)']),
                targetWeightInput
            ]),
            el('div', { class: 'note' }, [
                '💡 Target weight auto-calculates based on your height and goal. You can override it.'
            ]),
            el('div', { class: 'row' }, [saveProfileBtn]),
            el('div', { class: 'hr' }, []),
            
            el('h3', {}, ['Data Management']),
            el('div', { class: 'note' }, [
                'Data is stored locally in NeDB. Muscle building requires consistency - track your progress!'
            ]),
            el('div', { class: 'row' }, [exportBtn]),
            el('div', { class: 'hr' }, []),
            
            el('h3', {}, ['🚨 Danger Zone']),
            el('div', { class: 'note' }, [
                '⚠️ Factory reset will delete ALL workout data and reset to config defaults!'
            ]),
            el('div', { class: 'row' }, [profileResetBtn])
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