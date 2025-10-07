import { el, todayISO } from '../utils/helpers.js';
import { FOOD_DATABASE, calculateDailyTargets, getFastingStatus, getFastingMotivation, logFood, getDailyNutrition } from '../utils/nutrition.js';

export function renderNutrition(App) {
    var self = App;
    var root = el('div', {}, []);

    (async function() {
        const user = await window.db.findOne('user', { _id: 'user_profile' });
        const dailyTargets = calculateDailyTargets(user);
        const dailyNutrition = await getDailyNutrition();
        const fastingStatus = getFastingStatus(user.lastMealTime);
        const motivation = getFastingMotivation(fastingStatus);

        // Header
        root.appendChild(el('div', { class: 'brand' }, [
            el('div', { class: 'dot' }, []),
            el('h2', {}, ['Nutrition & Fasting']),
            el('span', { class: 'sub' }, ['Fuel your workouts, optimize your health'])
        ]));

        // Fasting Status Card
        var fastingCard = el('div', { class: 'card', style: 'margin-bottom: 20px; border-left: 4px solid ' + motivation.color }, [
            el('h3', {}, ['🕐 Fasting Status']),
            el('div', { class: 'row', style: 'align-items: center; margin: 15px 0;' }, [
                el('div', { style: 'flex: 1;' }, [
                    el('div', { style: 'font-size: 24px; font-weight: bold; color: ' + motivation.color }, [
                        fastingStatus.fastingHours + 'h ' + fastingStatus.fastingMinutes + 'm'
                    ]),
                    el('div', { class: 'note', style: 'margin: 5px 0;' }, [fastingStatus.status]),
                    fastingStatus.nextMilestone ? 
                        el('div', { class: 'note' }, [
                            'Next: ' + fastingStatus.nextMilestone.message + ' in ' + 
                            Math.round(fastingStatus.hoursToNext * 10) / 10 + 'h'
                        ]) : null
                ])
            ]),
            el('div', { class: 'hr' }, []),
            el('div', { style: 'padding: 10px; background: rgba(124, 255, 178, 0.1); border-radius: 8px;' }, [
                el('div', { style: 'font-weight: bold; color: ' + motivation.color }, [motivation.title]),
                el('div', { class: 'note', style: 'margin-top: 5px;' }, [motivation.message])
            ])
        ]);

        // Should I Eat? Decision Helper
        if (fastingStatus.fastingHours >= 12) {
            var shouldIEatBtn = el('button', { 
                class: 'btn', 
                style: 'width: 100%; margin: 10px 0; background: #FF6B6B;' 
            }, ['🤔 Should I Eat Now?']);
            
            shouldIEatBtn.addEventListener('click', function() {
                var benefits = [];
                if (fastingStatus.fastingHours >= 16) benefits.push('• Growth hormone elevated');
                if (fastingStatus.fastingHours >= 18) benefits.push('• Autophagy cleaning cells');
                if (fastingStatus.fastingHours >= 20) benefits.push('• Peak cellular repair');
                
                var message = 'You\'re at ' + fastingStatus.fastingHours + ' hours of fasting!\n\n' +
                             'Current benefits:\n' + benefits.join('\n') + '\n\n' +
                             'Your body is:\n• Burning stored fat\n• Repairing itself\n• Getting healthier\n\n' +
                             'Consider waiting if you can. The benefits keep building!';
                             
                alert(message);
            });
            
            fastingCard.appendChild(shouldIEatBtn);
        }

        root.appendChild(fastingCard);

        // Daily Nutrition Progress
        var nutritionCard = el('div', { class: 'card' }, [
            el('h3', {}, ['📊 Today\'s Nutrition']),
            
            // Calorie Target Info
            el('div', { style: 'margin: 10px 0; padding: 8px; background: #16213e; border-radius: 4px;' }, [
                el('div', { class: 'row', style: 'justify-content: space-between; align-items: center;' }, [
                    el('div', {}, [
                        el('div', { style: 'font-size: 12px; color: #888;' }, ['Weight Loss Target']),
                        el('div', { style: 'font-weight: bold;' }, [
                            dailyTargets.calories + ' calories' + 
                            (dailyTargets.isCustomTarget ? ' (Custom)' : ' (Recommended)')
                        ])
                    ]),
                    el('button', { 
                        class: 'btn', 
                        style: 'background: #4ECDC4; font-size: 12px; padding: 4px 8px;' 
                    }, ['Adjust'])
                ])
            ]),
            
            // Calorie Progress
            el('div', { style: 'margin: 15px 0;' }, [
                el('div', { class: 'row', style: 'justify-content: space-between; margin-bottom: 5px;' }, [
                    el('span', {}, ['Calories Today']),
                    el('span', {}, [dailyNutrition.totals.calories + ' / ' + dailyTargets.calories])
                ]),
                el('div', { class: 'progress-bar', style: 'background: #2a2a3e; height: 10px; border-radius: 5px;' }, [
                    el('div', { 
                        style: 'width: ' + Math.min(100, (dailyNutrition.totals.calories / dailyTargets.calories) * 100) + '%; ' +
                               'height: 100%; background: ' + (dailyNutrition.totals.calories <= dailyTargets.calories ? '#7CFFB2' : '#FF6B6B') + '; ' +
                               'border-radius: 5px; transition: width 0.3s;'
                    }, [])
                ])
            ]),
            
            // Protein Target Info
            el('div', { style: 'margin: 10px 0; padding: 8px; background: #16213e; border-radius: 4px;' }, [
                el('div', { class: 'row', style: 'justify-content: space-between; align-items: center;' }, [
                    el('div', {}, [
                        el('div', { style: 'font-size: 12px; color: #888;' }, ['Protein Target (Realistic)']),
                        el('div', { style: 'font-weight: bold;' }, [
                            dailyTargets.protein + 'g protein' + 
                            (dailyTargets.isCustomProtein ? ' (Custom)' : ' (Weight Loss Optimized)')
                        ])
                    ]),
                    el('button', { 
                        class: 'btn', 
                        style: 'background: #FFD93D; font-size: 12px; padding: 4px 8px;',
                        id: 'protein-adjust-btn'
                    }, ['Adjust'])
                ])
            ]),
            
            // Protein Progress
            el('div', { style: 'margin: 15px 0;' }, [
                el('div', { class: 'row', style: 'justify-content: space-between; margin-bottom: 5px;' }, [
                    el('span', {}, ['Protein Today']),
                    el('span', {}, [dailyNutrition.totals.protein + 'g / ' + dailyTargets.protein + 'g'])
                ]),
                el('div', { class: 'progress-bar', style: 'background: #2a2a3e; height: 10px; border-radius: 5px;' }, [
                    el('div', { 
                        style: 'width: ' + Math.min(100, (dailyNutrition.totals.protein / dailyTargets.protein) * 100) + '%; ' +
                               'height: 100%; background: ' + (dailyNutrition.totals.protein >= dailyTargets.protein ? '#7CFFB2' : '#FFD93D') + '; ' +
                               'border-radius: 5px; transition: width 0.3s;'
                    }, [])
                ])
            ]),
            
            // Weight Progress Display (syncs with Goals page weight log)
            dailyTargets.weightLost > 0 ? el('div', { style: 'margin: 15px 0; padding: 10px; background: #16213e; border-radius: 4px; border-left: 4px solid #7CFFB2;' }, [
                el('div', { style: 'font-weight: bold; color: #7CFFB2;' }, ['🎉 Progress: -' + dailyTargets.weightLost.toFixed(1) + ' lbs']),
                el('div', { class: 'note', style: 'margin-top: 5px;' }, [
                    'Current: ' + dailyTargets.currentWeight + ' lbs • Started: ' + dailyTargets.startingWeight + ' lbs'
                ]),
                el('div', { class: 'note', style: 'margin-top: 2px;' }, [
                    'Targets auto-adjusted: BMR -' + Math.round(dailyTargets.weightLost * dailyTargets.targetImpact.bmrPerLb) + ' cal, ' +
                    'Protein -' + Math.round(dailyTargets.weightLost * dailyTargets.targetImpact.proteinPerLb) + 'g'
                ])
            ]) : null,
            
            el('div', { class: 'note', style: 'margin-top: 10px;' }, [
                'BMR: ' + dailyTargets.bmr + ' cal • TDEE: ' + dailyTargets.tdee + ' cal • Protein: ' + (dailyTargets.protein/dailyTargets.currentWeight).toFixed(1) + 'g/lb'
            ])
        ]);

        // Add event listener for calorie adjustment
        var adjustBtn = nutritionCard.querySelector('button');
        adjustBtn.addEventListener('click', function() {
            // Create modal dialog for calorie adjustment
            var modal = el('div', { 
                style: 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center;' 
            }, [
                el('div', { 
                    class: 'card',
                    style: 'max-width: 500px; margin: 20px; max-height: 80vh; overflow-y: auto;'
                }, [
                    el('h3', {}, ['🎯 Adjust Calorie Target']),
                    el('div', { style: 'margin: 15px 0;' }, [
                        el('div', { style: 'font-weight: bold; margin-bottom: 10px;' }, ['Weight Loss Options:']),
                        el('div', { style: 'margin: 8px 0; padding: 8px; background: #16213e; border-radius: 4px; cursor: pointer;', 'data-calories': dailyTargets.deficitOptions.conservative }, [
                            el('div', { style: 'color: #7CFFB2; font-weight: bold;' }, ['🟢 Conservative: ' + dailyTargets.deficitOptions.conservative + ' cal']),
                            el('div', { class: 'note' }, ['1 lb/week weight loss'])
                        ]),
                        el('div', { style: 'margin: 8px 0; padding: 8px; background: #16213e; border-radius: 4px; cursor: pointer;', 'data-calories': dailyTargets.deficitOptions.moderate }, [
                            el('div', { style: 'color: #FFD93D; font-weight: bold;' }, ['🟡 Moderate: ' + dailyTargets.deficitOptions.moderate + ' cal']),
                            el('div', { class: 'note' }, ['1.5 lb/week weight loss'])
                        ]),
                        el('div', { style: 'margin: 8px 0; padding: 8px; background: #16213e; border-radius: 4px; cursor: pointer;', 'data-calories': dailyTargets.deficitOptions.aggressive }, [
                            el('div', { style: 'color: #FF6B6B; font-weight: bold;' }, ['🔴 Aggressive: ' + dailyTargets.deficitOptions.aggressive + ' cal (Recommended)']),
                            el('div', { class: 'note' }, ['2 lb/week weight loss'])
                        ])
                    ]),
                    el('div', { class: 'hr' }, []),
                    el('div', { style: 'margin: 15px 0;' }, [
                        el('label', { style: 'display: block; margin-bottom: 5px; font-weight: bold;' }, ['Or set custom target:']),
                        el('input', { 
                            id: 'custom-calories',
                            class: 'input', 
                            type: 'number', 
                            min: '1000', 
                            max: '4000',
                            placeholder: 'Enter calories (1000-4000)',
                            style: 'margin-bottom: 10px;'
                        }),
                        el('div', { class: 'note' }, ['Current: ' + dailyTargets.calories + ' cal'])
                    ]),
                    el('div', { class: 'row', style: 'gap: 10px; margin-top: 20px;' }, [
                        el('button', { class: 'btn', style: 'flex: 1; background: #666;' }, ['Cancel']),
                        el('button', { class: 'btn', style: 'flex: 1;' }, ['Save Changes'])
                    ])
                ])
            ]);
            
            document.body.appendChild(modal);
            
            // Add click handlers for preset options
            modal.querySelectorAll('[data-calories]').forEach(option => {
                option.addEventListener('click', function() {
                    var calories = parseInt(this.dataset.calories);
                    document.getElementById('custom-calories').value = calories;
                    // Highlight selected option
                    modal.querySelectorAll('[data-calories]').forEach(opt => opt.style.border = 'none');
                    this.style.border = '2px solid #4ECDC4';
                });
            });
            
            // Cancel button
            modal.querySelector('button').addEventListener('click', function() {
                document.body.removeChild(modal);
            });
            
            // Save button
            modal.querySelectorAll('button')[1].addEventListener('click', async function() {
                var customValue = document.getElementById('custom-calories').value;
                if (!customValue || isNaN(customValue)) {
                    alert('Please select an option or enter a valid calorie target');
                    return;
                }
                
                var newTarget = parseInt(customValue);
                if (newTarget < 1000 || newTarget > 4000) {
                    alert('Please enter a calorie target between 1000-4000 calories');
                    return;
                }
                
                try {
                    if (newTarget === dailyTargets.recommendedCalories) {
                        // Use recommended (remove custom)
                        await window.db.update('user', { _id: 'user_profile' }, { $unset: { customCalorieTarget: 1 } });
                    } else {
                        // Set custom target
                        await window.db.update('user', { _id: 'user_profile' }, { $set: { customCalorieTarget: newTarget } });
                    }
                    
                    document.body.removeChild(modal);
                    alert('Calorie target updated to: ' + newTarget + ' calories');
                    self.render();
                } catch (error) {
                    alert('Error updating calorie target: ' + error.message);
                }
            });
            
            // Close on background click
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        });

        // Protein adjustment event listener is added after nutritionCard is appended to root

        // Food Logging
        nutritionCard.appendChild(el('div', { class: 'hr' }, []));
        nutritionCard.appendChild(el('h4', {}, ['🍽️ Log Food']));
        
        // Quick Add Calories button
        var quickCalBtn = el('button', { 
            class: 'btn', 
            style: 'background: #FFB84D; margin: 5px 0; width: 100%;' 
        }, ['⚡ Quick Add Calories']);
        
        quickCalBtn.addEventListener('click', function() {
            // Create modal for quick calorie entry
            var modal = el('div', { 
                style: 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center;' 
            }, [
                el('div', { 
                    class: 'card',
                    style: 'max-width: 400px; margin: 20px;'
                }, [
                    el('h3', {}, ['⚡ Quick Add Calories']),
                    el('div', { style: 'margin: 15px 0;' }, [
                        el('label', { style: 'display: block; margin-bottom: 5px; font-weight: bold;' }, ['Enter calories to add:']),
                        el('input', { 
                            id: 'quick-calories',
                            class: 'input', 
                            type: 'number', 
                            min: '1', 
                            max: '2000',
                            placeholder: 'Enter calories',
                            style: 'margin-bottom: 10px;',
                            autofocus: true
                        }),
                        el('div', { class: 'note' }, ['This will create a custom entry for quick logging'])
                    ]),
                    el('div', { class: 'row', style: 'gap: 10px; margin-top: 20px;' }, [
                        el('button', { class: 'btn', style: 'flex: 1; background: #666;' }, ['Cancel']),
                        el('button', { class: 'btn', style: 'flex: 1; background: #FFB84D;' }, ['Add Calories'])
                    ])
                ])
            ]);
            
            document.body.appendChild(modal);
            
            // Focus the input
            setTimeout(() => modal.querySelector('#quick-calories').focus(), 100);
            
            // Cancel button
            modal.querySelector('button').addEventListener('click', function() {
                document.body.removeChild(modal);
            });
            
            // Add calories button
            modal.querySelectorAll('button')[1].addEventListener('click', async function() {
                var calories = document.getElementById('quick-calories').value;
                if (!calories || isNaN(calories) || calories <= 0) {
                    alert('Please enter a valid number of calories');
                    return;
                }
                
                try {
                    var customFood = {
                        name: 'Custom Entry (' + calories + ' cal)',
                        calories: parseInt(calories),
                        protein: 0,
                        carbs: 0,
                        fat: 0
                    };
                    
                    // Add to database temporarily for logging
                    var foodId = 'custom-' + Date.now();
                    FOOD_DATABASE[foodId] = customFood;
                    
                    await logFood(foodId, 1);
                    
                    document.body.removeChild(modal);
                    alert('Calories added successfully!');
                    self.render();
                } catch (error) {
                    alert('Error adding calories: ' + error.message);
                }
            });
            
            // Enter key to submit
            modal.querySelector('#quick-calories').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    modal.querySelectorAll('button')[1].click();
                }
            });
            
            // Close on background click
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        });
        
        nutritionCard.appendChild(quickCalBtn);
        
        // Quick Add Protein button
        var quickProteinBtn = el('button', { 
            class: 'btn', 
            style: 'background: #7CFFB2; color: #0a0a1a; margin: 5px 0; width: 100%;' 
        }, ['💪 Quick Add Protein']);
        
        quickProteinBtn.addEventListener('click', function() {
            // Create modal for quick protein entry
            var modal = el('div', { 
                style: 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center;' 
            }, [
                el('div', { 
                    class: 'card',
                    style: 'max-width: 450px; margin: 20px;'
                }, [
                    el('h3', {}, ['💪 Quick Add Protein']),
                    el('div', { style: 'margin: 15px 0; padding: 10px; background: #16213e; border-radius: 4px;' }, [
                        el('div', { style: 'font-size: 12px; color: #888; margin-bottom: 5px;' }, ['💡 Common Examples:']),
                        el('div', { class: 'note' }, ['• Double protein shake: 60g protein, 200 cal']),
                        el('div', { class: 'note' }, ['• Greek yogurt + protein powder: 50g protein, 250 cal']),
                        el('div', { class: 'note' }, ['• Protein bar: 20g protein, 200 cal'])
                    ]),
                    el('div', { style: 'margin: 15px 0;' }, [
                        el('div', { class: 'row', style: 'gap: 10px; margin-bottom: 10px;' }, [
                            el('div', { style: 'flex: 1;' }, [
                                el('label', { style: 'display: block; margin-bottom: 5px; font-weight: bold;' }, ['Protein (grams):']),
                                el('input', { 
                                    id: 'quick-protein-grams',
                                    class: 'input', 
                                    type: 'number', 
                                    min: '1', 
                                    max: '100',
                                    placeholder: 'e.g. 60',
                                    style: 'width: 100%;',
                                    autofocus: true
                                })
                            ]),
                            el('div', { style: 'flex: 1;' }, [
                                el('label', { style: 'display: block; margin-bottom: 5px; font-weight: bold;' }, ['Calories:']),
                                el('input', { 
                                    id: 'quick-protein-calories',
                                    class: 'input', 
                                    type: 'number', 
                                    min: '50', 
                                    max: '800',
                                    placeholder: 'e.g. 200',
                                    style: 'width: 100%;'
                                })
                            ])
                        ]),
                        el('div', { style: 'margin: 10px 0;' }, [
                            el('label', { style: 'display: block; margin-bottom: 5px; font-weight: bold;' }, ['Description (optional):']),
                            el('input', { 
                                id: 'quick-protein-name',
                                class: 'input', 
                                type: 'text', 
                                placeholder: 'e.g. Double Protein Shake, Greek Yogurt + Powder',
                                style: 'width: 100%;'
                            })
                        ]),
                        el('div', { class: 'note' }, ['This creates a one-time entry for high-protein items not in the main database'])
                    ]),
                    el('div', { class: 'row', style: 'gap: 10px; margin-top: 20px;' }, [
                        el('button', { class: 'btn', style: 'flex: 1; background: #666;' }, ['Cancel']),
                        el('button', { class: 'btn', style: 'flex: 1; background: #7CFFB2; color: #0a0a1a;' }, ['Add Protein'])
                    ])
                ])
            ]);
            
            document.body.appendChild(modal);
            
            // Focus the protein input
            setTimeout(() => modal.querySelector('#quick-protein-grams').focus(), 100);
            
            // Auto-calculate typical calories when protein is entered
            modal.querySelector('#quick-protein-grams').addEventListener('input', function() {
                var protein = parseInt(this.value);
                var caloriesInput = document.getElementById('quick-protein-calories');
                if (protein && !caloriesInput.value) {
                    // Estimate calories: protein powder ~4 cal/g, with some carbs/fat
                    var estimatedCals = Math.round(protein * 4.5);
                    caloriesInput.value = estimatedCals;
                }
            });
            
            // Cancel button
            modal.querySelector('button').addEventListener('click', function() {
                document.body.removeChild(modal);
            });
            
            // Add protein button
            modal.querySelectorAll('button')[1].addEventListener('click', async function() {
                var protein = document.getElementById('quick-protein-grams').value;
                var calories = document.getElementById('quick-protein-calories').value;
                var name = document.getElementById('quick-protein-name').value;
                
                if (!protein || isNaN(protein) || protein <= 0) {
                    alert('Please enter a valid amount of protein');
                    return;
                }
                
                if (!calories || isNaN(calories) || calories <= 0) {
                    alert('Please enter a valid number of calories');
                    return;
                }
                
                try {
                    var proteinGrams = parseInt(protein);
                    var totalCalories = parseInt(calories);
                    var description = name || ('High Protein Item (' + proteinGrams + 'g protein)');
                    
                    // Calculate rough macros (assuming mostly protein with some carbs/fat)
                    var proteinCals = proteinGrams * 4;
                    var remainingCals = Math.max(0, totalCalories - proteinCals);
                    var estimatedCarbs = Math.round(remainingCals * 0.3 / 4); // 30% of remaining as carbs
                    var estimatedFat = Math.round(remainingCals * 0.7 / 9); // 70% of remaining as fat
                    
                    var customFood = {
                        name: description,
                        calories: totalCalories,
                        protein: proteinGrams,
                        carbs: estimatedCarbs,
                        fat: estimatedFat
                    };
                    
                    // Add to database temporarily for logging
                    const { FOOD_DATABASE, logFood } = await import('../utils/nutrition.js');
                    var foodId = 'quick-protein-' + Date.now();
                    FOOD_DATABASE[foodId] = customFood;
                    
                    await logFood(foodId, 1);
                    
                    document.body.removeChild(modal);
                    alert('Protein entry added successfully!\n' + proteinGrams + 'g protein, ' + totalCalories + ' calories');
                    self.render();
                } catch (error) {
                    alert('Error adding protein entry: ' + error.message);
                }
            });
            
            // Enter key to submit from protein input
            modal.querySelector('#quick-protein-grams').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    document.getElementById('quick-protein-calories').focus();
                }
            });
            
            // Enter key to submit from calories input
            modal.querySelector('#quick-protein-calories').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    modal.querySelectorAll('button')[1].click();
                }
            });
            
            // Close on background click
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        });
        
        nutritionCard.appendChild(quickProteinBtn);
        
        // Get custom ingredients and favorite meals for main selector
        var customIngredientsMain = Object.keys(FOOD_DATABASE).filter(key => FOOD_DATABASE[key].isCustom && !FOOD_DATABASE[key].isFavoriteMeal);
        var favoriteMeals = Object.keys(FOOD_DATABASE).filter(key => FOOD_DATABASE[key].isFavoriteMeal);

        var foodSelect = el('select', { class: 'input', style: 'margin: 10px 0;' }, [
            el('option', { value: '' }, ['Select a food...']),
            ...(favoriteMeals.length > 0 ? [
                el('optgroup', { label: '💖 My Favorite Meals' }, [
                    ...favoriteMeals.map(key => el('option', { value: key }, [FOOD_DATABASE[key].name]))
                ])
            ] : []),
            ...(customIngredientsMain.length > 0 ? [
                el('optgroup', { label: '⭐ My Custom Ingredients' }, [
                    ...customIngredientsMain.map(key => el('option', { value: key }, [FOOD_DATABASE[key].name]))
                ])
            ] : []),
            el('optgroup', { label: '🍎 Fruits' }, [
                ...Object.keys(FOOD_DATABASE)
                    .filter(key => ['banana', 'apple', 'orange', 'strawberries', 'blueberries', 'grapes', 'pineapple', 'mango', 'watermelon', 'cantaloupe', 'peach', 'pear', 'cherries'].includes(key))
                    .map(key => el('option', { value: key }, [FOOD_DATABASE[key].name]))
            ]),
            el('optgroup', { label: '🍽️ Meal Prep' }, [
                ...Object.keys(FOOD_DATABASE)
                    .filter(key => key.includes('prep') || ['kung-pao-chicken', 'pineapple-chicken'].includes(key))
                    .map(key => el('option', { value: key }, [FOOD_DATABASE[key].name]))
            ]),
            el('optgroup', { label: '🥩 Proteins' }, [
                ...Object.keys(FOOD_DATABASE)
                    .filter(key => ['large-egg', 'protein-shake', 'greek-yogurt', 'chicken-breast', 'almonds', 'walnuts', 'peanut-butter'].includes(key))
                    .map(key => el('option', { value: key }, [FOOD_DATABASE[key].name]))
            ]),
            el('optgroup', { label: '🥬 Vegetables' }, [
                ...Object.keys(FOOD_DATABASE)
                    .filter(key => ['broccoli', 'carrot', 'spinach', 'bell-pepper'].includes(key))
                    .map(key => el('option', { value: key }, [FOOD_DATABASE[key].name]))
            ]),
            el('optgroup', { label: '🍞 Grains & Dairy' }, [
                ...Object.keys(FOOD_DATABASE)
                    .filter(key => ['white-rice', 'milk', 'cheese-slice', 'parmesan-cheese', 'pesto', 'oatmeal', 'sweet-potato', 'bonoza-pasta', 'bread-slice'].includes(key))
                    .map(key => el('option', { value: key }, [FOOD_DATABASE[key].name]))
            ])
        ]);
        
        var quantityInput = el('input', { 
            class: 'input', 
            type: 'number', 
            step: '0.25',
            min: '0.25',
            value: '1',
            placeholder: 'Quantity',
            style: 'width: 100px; margin: 0 10px;'
        });
        
        var logFoodBtn = el('button', { class: 'btn' }, ['Log Food']);
        
        logFoodBtn.addEventListener('click', async function() {
            var foodId = foodSelect.value;
            var quantity = parseFloat(quantityInput.value) || 1;
            
            if (!foodId) {
                alert('Please select a food item');
                return;
            }
            
            try {
                await logFood(foodId, quantity);
                alert('Food logged successfully!');
                self.render(); // Refresh the page
            } catch (error) {
                alert('Error logging food: ' + error.message);
            }
        });
        
        nutritionCard.appendChild(el('div', { class: 'row', style: 'align-items: center; gap: 10px;' }, [
            foodSelect,
            quantityInput,
            logFoodBtn
        ]));

        // Food Preview
        foodSelect.addEventListener('change', function() {
            var existing = nutritionCard.querySelector('.food-preview');
            if (existing) existing.remove();
            
            if (foodSelect.value) {
                var food = FOOD_DATABASE[foodSelect.value];
                var quantity = parseFloat(quantityInput.value) || 1;
                
                var preview = el('div', { class: 'food-preview', style: 'margin: 10px 0; padding: 8px; background: #16213e; border-radius: 4px;' }, [
                    el('div', { style: 'font-weight: bold;' }, [food.name + ' × ' + quantity]),
                    el('div', { class: 'note' }, [
                        Math.round(food.calories * quantity) + ' cal, ' +
                        Math.round(food.protein * quantity) + 'g protein, ' +
                        Math.round(food.carbs * quantity) + 'g carbs, ' +
                        Math.round(food.fat * quantity) + 'g fat'
                    ])
                ]);
                
                nutritionCard.appendChild(preview);
            }
        });
        
        quantityInput.addEventListener('input', function() {
            if (foodSelect.value) {
                foodSelect.dispatchEvent(new Event('change'));
            }
        });

        root.appendChild(nutritionCard);

        // Add event listener for protein adjustment (with small delay to ensure DOM is ready)
        setTimeout(() => {
            var proteinAdjustBtn = document.getElementById('protein-adjust-btn');
            if (proteinAdjustBtn) {
                proteinAdjustBtn.addEventListener('click', function() {
            // Create modal dialog for protein adjustment
            var modal = el('div', { 
                style: 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center;' 
            }, [
                el('div', { 
                    class: 'card',
                    style: 'max-width: 500px; margin: 20px; max-height: 80vh; overflow-y: auto;'
                }, [
                    el('h3', {}, ['💪 Adjust Protein Target']),
                    el('div', { style: 'margin: 15px 0;' }, [
                        el('div', { style: 'font-weight: bold; margin-bottom: 10px;' }, ['Protein Options for Weight Loss:']),
                        el('div', { style: 'margin: 8px 0; padding: 8px; background: #16213e; border-radius: 4px; cursor: pointer;', 'data-protein': Math.round((user.currentWeight || 262) * 0.7) }, [
                            el('div', { style: 'color: #7CFFB2; font-weight: bold;' }, ['🟢 Conservative: ' + Math.round((user.currentWeight || 262) * 0.7) + 'g']),
                            el('div', { class: 'note' }, ['0.7g per lb - Minimum for muscle preservation'])
                        ]),
                        el('div', { style: 'margin: 8px 0; padding: 8px; background: #16213e; border-radius: 4px; cursor: pointer;', 'data-protein': Math.round((user.currentWeight || 262) * 0.9) }, [
                            el('div', { style: 'color: #FFD93D; font-weight: bold;' }, ['🟡 Recommended: ' + Math.round((user.currentWeight || 262) * 0.9) + 'g (Current)']),
                            el('div', { class: 'note' }, ['0.9g per lb - Optimal for weight loss & muscle building'])
                        ]),
                        el('div', { style: 'margin: 8px 0; padding: 8px; background: #16213e; border-radius: 4px; cursor: pointer;', 'data-protein': Math.round((user.currentWeight || 262) * 1.1) }, [
                            el('div', { style: 'color: #FF6B6B; font-weight: bold;' }, ['🔴 High: ' + Math.round((user.currentWeight || 262) * 1.1) + 'g']),
                            el('div', { class: 'note' }, ['1.1g per lb - High protein (requires lots of food)'])
                        ])
                    ]),
                    el('div', { style: 'padding: 10px; background: #16213e; border-radius: 4px; margin: 10px 0;' }, [
                        el('div', { style: 'font-size: 12px; color: #888; margin-bottom: 5px;' }, ['💡 Why lower protein for weight loss?']),
                        el('div', { class: 'note' }, ['When overweight, using total body weight gives unrealistic targets. 0.9g per lb preserves muscle while staying achievable.'])
                    ]),
                    el('div', { class: 'hr' }, []),
                    el('div', { style: 'margin: 15px 0;' }, [
                        el('label', { style: 'display: block; margin-bottom: 5px; font-weight: bold;' }, ['Or set custom target:']),
                        el('input', { 
                            id: 'custom-protein',
                            class: 'input', 
                            type: 'number', 
                            min: '50', 
                            max: '300',
                            placeholder: 'Enter protein grams (50-300)',
                            style: 'margin-bottom: 10px;'
                        }),
                        el('div', { class: 'note' }, ['Current: ' + dailyTargets.protein + 'g'])
                    ]),
                    el('div', { class: 'row', style: 'gap: 10px; margin-top: 20px;' }, [
                        el('button', { class: 'btn', style: 'flex: 1; background: #666;' }, ['Cancel']),
                        el('button', { class: 'btn', style: 'flex: 1; background: #FFD93D;' }, ['Save Changes'])
                    ])
                ])
            ]);
            
            document.body.appendChild(modal);
            
            // Add click handlers for preset options
            modal.querySelectorAll('[data-protein]').forEach(option => {
                option.addEventListener('click', function() {
                    var protein = parseInt(this.dataset.protein);
                    document.getElementById('custom-protein').value = protein;
                    // Highlight selected option
                    modal.querySelectorAll('[data-protein]').forEach(opt => opt.style.border = 'none');
                    this.style.border = '2px solid #FFD93D';
                });
            });
            
            // Cancel button
            modal.querySelector('button').addEventListener('click', function() {
                document.body.removeChild(modal);
            });
            
            // Save button
            modal.querySelectorAll('button')[1].addEventListener('click', async function() {
                var customValue = document.getElementById('custom-protein').value;
                if (!customValue || isNaN(customValue)) {
                    alert('Please select an option or enter a valid protein target');
                    return;
                }
                
                var newTarget = parseInt(customValue);
                if (newTarget < 50 || newTarget > 300) {
                    alert('Please enter a protein target between 50-300 grams');
                    return;
                }
                
                try {
                    if (newTarget === dailyTargets.recommendedProtein) {
                        // Use recommended (remove custom)
                        await window.db.update('user', { _id: 'user_profile' }, { $unset: { customProteinTarget: 1 } });
                    } else {
                        // Set custom target
                        await window.db.update('user', { _id: 'user_profile' }, { $set: { customProteinTarget: newTarget } });
                    }
                    
                    document.body.removeChild(modal);
                    alert('Protein target updated to: ' + newTarget + 'g');
                    self.render();
                } catch (error) {
                    alert('Error updating protein target: ' + error.message);
                }
            });
            
            // Close on background click
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        });
            } else {
                console.log('Protein adjust button not found');
            }
        }, 100); // 100ms delay



        // Recipe Management Link
        var recipeLink = el('div', { class: 'card', style: 'text-align: center; padding: 15px;' }, [
            el('div', { class: 'note', style: 'margin-bottom: 10px;' }, ['Need to add a new ingredient or manage your recipes?']),
            el('button', { 
                class: 'btn', 
                style: 'background: #FFB84D; color: #0a0a1a;',
                onclick: function() { self.setTab('recipes'); }
            }, ['🔧 Manage Recipes & Ingredients'])
        ]);

        root.appendChild(recipeLink);

        // Custom Meal Creator
        var customMealCard = el('div', { class: 'card' }, [
            el('h3', {}, ['🍳 Create Custom Meal']),
            el('div', { class: 'note' }, ['Combine multiple ingredients into one meal'])
        ]);

        var mealNameInput = el('input', { 
            class: 'input', 
            placeholder: 'Meal name (e.g., "Breakfast Bowl")',
            style: 'margin: 10px 0; width: 100%;'
        });

        var ingredientsList = el('div', { style: 'margin: 10px 0;' }, []);
        var mealTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

        function updateMealTotals() {
            var totalsDiv = customMealCard.querySelector('.meal-totals');
            if (totalsDiv) totalsDiv.remove();
            
            totalsDiv = el('div', { 
                class: 'meal-totals',
                style: 'margin: 10px 0; padding: 10px; background: #16213e; border-radius: 4px;' 
            }, [
                el('div', { style: 'font-weight: bold;' }, ['Meal Total:']),
                el('div', { class: 'note' }, [
                    Math.round(mealTotals.calories) + ' cal, ' +
                    Math.round(mealTotals.protein) + 'g protein, ' +
                    Math.round(mealTotals.carbs) + 'g carbs, ' +
                    Math.round(mealTotals.fat) + 'g fat'
                ])
            ]);
            
            customMealCard.appendChild(totalsDiv);
        }

        // Get custom ingredients
        var customIngredients = Object.keys(FOOD_DATABASE).filter(key => FOOD_DATABASE[key].isCustom);

        var addIngredientSelect = el('select', { class: 'input', style: 'margin: 5px;' }, [
            el('option', { value: '' }, ['Add ingredient...']),
            ...(customIngredients.length > 0 ? [
                el('optgroup', { label: '⭐ My Custom Ingredients' }, [
                    ...customIngredients.map(key => el('option', { value: key }, [FOOD_DATABASE[key].name]))
                ])
            ] : []),
            el('optgroup', { label: '🍎 Fruits' }, [
                ...Object.keys(FOOD_DATABASE)
                    .filter(key => ['banana', 'apple', 'orange', 'strawberries', 'blueberries', 'grapes', 'pineapple', 'mango', 'watermelon', 'cantaloupe', 'peach', 'pear', 'cherries'].includes(key))
                    .map(key => el('option', { value: key }, [FOOD_DATABASE[key].name]))
            ]),
            el('optgroup', { label: '🥩 Proteins' }, [
                ...Object.keys(FOOD_DATABASE)
                    .filter(key => ['large-egg', 'protein-shake', 'greek-yogurt', 'chicken-breast', 'almonds', 'walnuts', 'peanut-butter'].includes(key))
                    .map(key => el('option', { value: key }, [FOOD_DATABASE[key].name]))
            ]),
            el('optgroup', { label: '🥬 Vegetables' }, [
                ...Object.keys(FOOD_DATABASE)
                    .filter(key => ['broccoli', 'carrot', 'spinach', 'bell-pepper'].includes(key))
                    .map(key => el('option', { value: key }, [FOOD_DATABASE[key].name]))
            ]),
            el('optgroup', { label: '🍞 Grains & Dairy' }, [
                ...Object.keys(FOOD_DATABASE)
                    .filter(key => ['white-rice', 'milk', 'cheese-slice', 'parmesan-cheese', 'pesto', 'oatmeal', 'sweet-potato', 'bonoza-pasta', 'bread-slice'].includes(key))
                    .map(key => el('option', { value: key }, [FOOD_DATABASE[key].name]))
            ]),
            el('optgroup', { label: '🍽️ Meal Prep' }, [
                ...Object.keys(FOOD_DATABASE)
                    .filter(key => key.includes('prep') || ['kung-pao-chicken', 'pineapple-chicken'].includes(key))
                    .map(key => el('option', { value: key }, [FOOD_DATABASE[key].name]))
            ])
        ]);

        var addIngredientQty = el('input', { 
            class: 'input', 
            type: 'number', 
            step: '0.25',
            min: '0.25',
            value: '1',
            placeholder: 'Qty',
            style: 'width: 80px; margin: 5px;'
        });

        var addIngredientBtn = el('button', { class: 'btn', style: 'margin: 5px;' }, ['Add']);

        addIngredientBtn.addEventListener('click', function() {
            var foodId = addIngredientSelect.value;
            var quantity = parseFloat(addIngredientQty.value) || 1;
            
            if (!foodId) return;
            
            var food = FOOD_DATABASE[foodId];
            var ingredient = el('div', { 
                style: 'margin: 5px 0; padding: 8px; background: #2a2a3e; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;'
            }, [
                el('div', {}, [
                    el('div', { style: 'font-weight: bold;' }, [food.name + ' × ' + quantity]),
                    el('div', { class: 'note' }, [
                        Math.round(food.calories * quantity) + ' cal, ' +
                        Math.round(food.protein * quantity) + 'g protein'
                    ])
                ]),
                el('button', { 
                    class: 'btn', 
                    style: 'background: #FF6B6B; padding: 4px 8px; font-size: 12px;',
                    onclick: function() {
                        mealTotals.calories -= food.calories * quantity;
                        mealTotals.protein -= food.protein * quantity;
                        mealTotals.carbs -= food.carbs * quantity;
                        mealTotals.fat -= food.fat * quantity;
                        ingredient.remove();
                        updateMealTotals();
                    }
                }, ['Remove'])
            ]);
            
            ingredientsList.appendChild(ingredient);
            
            mealTotals.calories += food.calories * quantity;
            mealTotals.protein += food.protein * quantity;
            mealTotals.carbs += food.carbs * quantity;
            mealTotals.fat += food.fat * quantity;
            
            updateMealTotals();
            
            addIngredientSelect.value = '';
            addIngredientQty.value = '1';
        });

        var mealButtonsRow = el('div', { class: 'row', style: 'gap: 10px; margin: 10px 0;' }, [
            el('button', { 
                class: 'btn', 
                style: 'background: #7CFFB2; color: #0a0a1a; flex: 1;' 
            }, ['🍽️ Log This Meal']),
            el('button', { 
                class: 'btn', 
                style: 'background: #FFB84D; color: #0a0a1a; flex: 1;' 
            }, ['💾 Save as Favorite'])
        ]);

        var logMealBtn = mealButtonsRow.children[0];
        var saveFavoriteBtn = mealButtonsRow.children[1];

        logMealBtn.addEventListener('click', async function() {
            var mealName = mealNameInput.value.trim() || 'Custom Meal';
            
            if (mealTotals.calories === 0) {
                alert('Please add some ingredients first');
                return;
            }
            
            var customFood = {
                name: mealName,
                calories: Math.round(mealTotals.calories),
                protein: Math.round(mealTotals.protein),
                carbs: Math.round(mealTotals.carbs),
                fat: Math.round(mealTotals.fat)
            };
            
            // Add to database temporarily for logging
            var tempId = 'custom-meal-' + Date.now();
            FOOD_DATABASE[tempId] = customFood;
            
            try {
                await logFood(tempId, 1);
                alert('Meal logged successfully!');
                
                // Reset form
                mealNameInput.value = '';
                ingredientsList.innerHTML = '';
                mealTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
                updateMealTotals();
                
                self.render();
            } catch (error) {
                alert('Error logging meal: ' + error.message);
            }
        });

        saveFavoriteBtn.addEventListener('click', function() {
            var mealName = mealNameInput.value.trim() || 'Custom Meal';
            
            if (mealTotals.calories === 0) {
                alert('Please add some ingredients first');
                return;
            }
            
            var customFood = {
                name: mealName,
                calories: Math.round(mealTotals.calories),
                protein: Math.round(mealTotals.protein),
                carbs: Math.round(mealTotals.carbs),
                fat: Math.round(mealTotals.fat),
                isCustom: true,
                isFavoriteMeal: true
            };
            
            // Add to database permanently
            var mealId = 'meal-' + mealName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            FOOD_DATABASE[mealId] = customFood;
            
            alert('Meal "' + mealName + '" saved as favorite!\nYou can now find it in your meal options.');
            
            // Reset form
            mealNameInput.value = '';
            ingredientsList.innerHTML = '';
            mealTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
            updateMealTotals();
            
            self.render();
        });

        customMealCard.appendChild(mealNameInput);
        customMealCard.appendChild(el('div', { class: 'row', style: 'align-items: center; flex-wrap: wrap;' }, [
            addIngredientSelect,
            addIngredientQty,
            addIngredientBtn
        ]));
        customMealCard.appendChild(ingredientsList);
        customMealCard.appendChild(mealButtonsRow);

        root.appendChild(customMealCard);

        // Today's Food Log
        if (dailyNutrition.entries.length > 0) {
            var logCard = el('div', { class: 'card' }, [
                el('h3', {}, ['📝 Today\'s Food Log (' + dailyNutrition.entries.length + ' entries)']),
                ...dailyNutrition.entries.map(entry => {
                    var time = new Date(entry.time);
                    var entryDiv = el('div', { style: 'margin: 10px 0; padding: 8px; background: #16213e; border-radius: 4px;' }, [
                        el('div', { class: 'row', style: 'justify-content: space-between; align-items: center;' }, [
                            el('div', { style: 'flex: 1;' }, [
                                el('div', { style: 'font-weight: bold;' }, [entry.foodName]),
                                el('input', { 
                                    type: 'time',
                                    value: time.toTimeString().slice(0, 5),
                                    class: 'time-input',
                                    style: 'background: #2a2a3e; border: 1px solid #444; color: white; padding: 2px 4px; border-radius: 3px; font-size: 12px; display: none;'
                                }),
                                el('div', { class: 'note time-display' }, [time.toLocaleTimeString()])
                            ]),
                            el('div', { style: 'text-align: center; margin: 0 15px;' }, [
                                el('div', {}, [entry.nutrition.calories + ' cal']),
                                el('div', { class: 'note' }, [entry.nutrition.protein + 'g protein'])
                            ]),
                            el('div', { style: 'display: flex; gap: 5px;' }, [
                                el('button', { 
                                    class: 'btn', 
                                    style: 'background: #FFB84D; color: #0a0a1a; padding: 4px 8px; font-size: 12px;',
                                    title: 'Edit time'
                                }, ['⏰']),
                                el('button', { 
                                    class: 'btn', 
                                    style: 'background: #FF6B6B; padding: 4px 8px; font-size: 12px;',
                                    title: 'Delete entry'
                                }, ['🗑️'])
                            ])
                        ])
                    ]);

                    // Edit time functionality
                    var editTimeBtn = entryDiv.querySelector('button[title="Edit time"]');
                    var deleteBtn = entryDiv.querySelector('button[title="Delete entry"]');
                    var timeInput = entryDiv.querySelector('.time-input');
                    var timeDisplay = entryDiv.querySelector('.time-display');

                    editTimeBtn.addEventListener('click', function() {
                        if (timeInput.style.display === 'none') {
                            // Show time input
                            timeInput.style.display = 'block';
                            timeDisplay.style.display = 'none';
                            editTimeBtn.textContent = '✅';
                            editTimeBtn.title = 'Save time';
                        } else {
                            // Save new time
                            var newTime = timeInput.value;
                            if (newTime) {
                                var today = new Date();
                                var [hours, minutes] = newTime.split(':');
                                var newDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
                                
                                // Update entry in database
                                window.db.update('nutrition', 
                                    { _id: entry._id }, 
                                    { $set: { time: newDateTime.toISOString() } }
                                ).then(() => {
                                    alert('Time updated successfully!');
                                    self.render();
                                }).catch(error => {
                                    alert('Error updating time: ' + error.message);
                                });
                            }
                        }
                    });

                    deleteBtn.addEventListener('click', function() {
                        if (confirm('Delete this food entry?')) {
                            window.db.remove('nutrition', { _id: entry._id }).then(() => {
                                alert('Entry deleted successfully!');
                                self.render();
                            }).catch(error => {
                                alert('Error deleting entry: ' + error.message);
                            });
                        }
                    });

                    return entryDiv;
                })
            ]);
            
            root.appendChild(logCard);
        } else {
            // Show recent entries if today's log is empty
            var recentEntries = await window.db.find('nutrition', {}).then(entries => 
                entries.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5)
            );
            
            if (recentEntries.length > 0) {
                var recentLogCard = el('div', { class: 'card' }, [
                    el('h3', {}, ['📝 Food Log']),
                    el('div', { class: 'note', style: 'margin-bottom: 15px;' }, [
                        'No food logged today yet. Here are your recent entries:'
                    ]),
                    ...recentEntries.map(entry => {
                        var time = new Date(entry.time);
                        var dateStr = time.toLocaleDateString();
                        var timeStr = time.toLocaleTimeString();
                        var isToday = entry.date === todayISO();
                        
                        return el('div', { 
                            style: 'margin: 10px 0; padding: 8px; background: #16213e; border-radius: 4px;' + 
                                   (isToday ? ' border-left: 4px solid #7CFFB2;' : '')
                        }, [
                            el('div', { class: 'row', style: 'justify-content: space-between; align-items: center;' }, [
                                el('div', { style: 'flex: 1;' }, [
                                    el('div', { style: 'font-weight: bold;' }, [entry.foodName]),
                                    el('div', { class: 'note' }, [
                                        (isToday ? 'Today ' : dateStr + ' ') + timeStr
                                    ])
                                ]),
                                el('div', { style: 'text-align: center; margin: 0 15px;' }, [
                                    el('div', {}, [entry.nutrition.calories + ' cal']),
                                    el('div', { class: 'note' }, [entry.nutrition.protein + 'g protein'])
                                ])
                            ])
                        ]);
                    })
                ]);
                
                root.appendChild(recentLogCard);
            } else {
                // No entries at all
                var emptyLogCard = el('div', { class: 'card' }, [
                    el('h3', {}, ['📝 Food Log']),
                    el('div', { class: 'note', style: 'text-align: center; padding: 20px;' }, [
                        'No food entries yet. Start logging your meals above!'
                    ])
                ]);
                
                root.appendChild(emptyLogCard);
            }
        }

    })();

    return root;
}