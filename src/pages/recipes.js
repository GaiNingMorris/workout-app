import { el } from '../utils/helpers.js';
import { FOOD_DATABASE } from '../utils/nutrition.js';

export function renderRecipes(App) {
    var self = App;
    var root = el('div', {}, []);

    // Header
    root.appendChild(el('div', { class: 'brand' }, [
        el('div', { class: 'dot' }, []),
        el('h2', {}, ['Recipe Manager']),
        el('span', { class: 'sub' }, ['Manage your custom ingredients and favorite meals'])
    ]));

    // Custom Ingredients Section
    var customIngredients = Object.keys(FOOD_DATABASE).filter(key => FOOD_DATABASE[key].isCustom && !FOOD_DATABASE[key].isFavoriteMeal);
    
    var ingredientsCard = el('div', { class: 'card' }, [
        el('h3', {}, ['⭐ My Custom Ingredients (' + customIngredients.length + ')']),
        el('div', { class: 'note' }, ['Ingredients you\'ve added to the database'])
    ]);

    if (customIngredients.length === 0) {
        ingredientsCard.appendChild(el('div', { class: 'note', style: 'text-align: center; padding: 20px; background: #16213e; border-radius: 8px; margin: 10px 0;' }, [
            'No custom ingredients yet. Go to the Nutrition tab to add ingredients like "Bonza Pasta" or other foods not in our database.'
        ]));
    } else {
        var ingredientsList = el('div', { style: 'margin: 15px 0;' }, []);
        
        customIngredients.forEach(key => {
            var ingredient = FOOD_DATABASE[key];
            var ingredientItem = el('div', { 
                style: 'margin: 10px 0; padding: 12px; background: #16213e; border-radius: 8px; border-left: 4px solid #7CFFB2;'
            }, [
                el('div', { class: 'row', style: 'justify-content: space-between; align-items: center;' }, [
                    el('div', { style: 'flex: 1;' }, [
                        el('div', { style: 'font-weight: bold; margin-bottom: 5px;' }, [ingredient.name]),
                        el('div', { class: 'note' }, [
                            ingredient.calories + ' cal, ' +
                            ingredient.protein + 'g protein, ' +
                            ingredient.carbs + 'g carbs, ' +
                            ingredient.fat + 'g fat'
                        ])
                    ]),
                    el('div', { style: 'display: flex; gap: 8px;' }, [
                        el('button', { 
                            class: 'btn', 
                            style: 'background: #FFB84D; color: #0a0a1a; padding: 6px 12px; font-size: 14px;'
                        }, ['✏️ Edit']),
                        el('button', { 
                            class: 'btn', 
                            style: 'background: #FF6B6B; padding: 6px 12px; font-size: 14px;'
                        }, ['🗑️ Delete'])
                    ])
                ])
            ]);

            // Edit functionality
            var editBtn = ingredientItem.querySelector('button[style*="FFB84D"]');
            var deleteBtn = ingredientItem.querySelector('button[style*="FF6B6B"]');

            editBtn.addEventListener('click', function() {
                // Create modal for editing ingredient
                var modal = el('div', { 
                    style: 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center;' 
                }, [
                    el('div', { 
                        class: 'card',
                        style: 'max-width: 500px; margin: 20px; max-height: 80vh; overflow-y: auto;'
                    }, [
                        el('h3', {}, ['✏️ Edit Ingredient: ' + ingredient.name]),
                        el('div', { style: 'margin: 15px 0;' }, [
                            el('label', { style: 'display: block; margin-bottom: 5px; font-weight: bold;' }, ['Ingredient Name:']),
                            el('input', { 
                                id: 'edit-ingredient-name',
                                class: 'input', 
                                type: 'text', 
                                placeholder: 'Enter ingredient name',
                                value: ingredient.name,
                                style: 'margin-bottom: 10px;'
                            }),
                            el('label', { style: 'display: block; margin-bottom: 5px; font-weight: bold;' }, ['Calories per serving:']),
                            el('input', { 
                                id: 'edit-ingredient-calories',
                                class: 'input', 
                                type: 'number', 
                                placeholder: 'Enter calories',
                                value: ingredient.calories,
                                style: 'margin-bottom: 10px;'
                            }),
                            el('label', { style: 'display: block; margin-bottom: 5px; font-weight: bold;' }, ['Protein (g):']),
                            el('input', { 
                                id: 'edit-ingredient-protein',
                                class: 'input', 
                                type: 'number', 
                                step: '0.1',
                                placeholder: 'Enter protein',
                                value: ingredient.protein,
                                style: 'margin-bottom: 10px;'
                            }),
                            el('label', { style: 'display: block; margin-bottom: 5px; font-weight: bold;' }, ['Carbs (g):']),
                            el('input', { 
                                id: 'edit-ingredient-carbs',
                                class: 'input', 
                                type: 'number', 
                                step: '0.1',
                                placeholder: 'Enter carbs',
                                value: ingredient.carbs,
                                style: 'margin-bottom: 10px;'
                            }),
                            el('label', { style: 'display: block; margin-bottom: 5px; font-weight: bold;' }, ['Fat (g):']),
                            el('input', { 
                                id: 'edit-ingredient-fat',
                                class: 'input', 
                                type: 'number', 
                                step: '0.1',
                                placeholder: 'Enter fat',
                                value: ingredient.fat,
                                style: 'margin-bottom: 10px;'
                            }),
                            el('div', { class: 'note', style: 'margin-top: 10px;' }, [
                                'Edit the nutritional values for this ingredient. Changes will be saved immediately.'
                            ])
                        ]),
                        el('div', { class: 'row', style: 'gap: 10px; margin-top: 20px;' }, [
                            el('button', { class: 'btn', style: 'flex: 1; background: #666;' }, ['Cancel']),
                            el('button', { class: 'btn', style: 'flex: 1; background: #7CFFB2; color: #0a0a1a;' }, ['Save Changes'])
                        ])
                    ])
                ]);
                
                document.body.appendChild(modal);
                
                // Focus the name input
                setTimeout(() => modal.querySelector('#edit-ingredient-name').focus(), 100);
                
                // Cancel button
                modal.querySelector('button').addEventListener('click', function() {
                    document.body.removeChild(modal);
                });
                
                // Save button
                modal.querySelectorAll('button')[1].addEventListener('click', function() {
                    var newName = document.getElementById('edit-ingredient-name').value.trim();
                    var newCalories = parseFloat(document.getElementById('edit-ingredient-calories').value);
                    var newProtein = parseFloat(document.getElementById('edit-ingredient-protein').value);
                    var newCarbs = parseFloat(document.getElementById('edit-ingredient-carbs').value);
                    var newFat = parseFloat(document.getElementById('edit-ingredient-fat').value);
                    
                    if (!newName) {
                        alert('Please enter an ingredient name');
                        return;
                    }
                    
                    if (isNaN(newCalories) || newCalories < 0) {
                        alert('Please enter valid calories');
                        return;
                    }
                    
                    if (isNaN(newProtein) || newProtein < 0) newProtein = 0;
                    if (isNaN(newCarbs) || newCarbs < 0) newCarbs = 0;
                    if (isNaN(newFat) || newFat < 0) newFat = 0;
                    
                    // Update the ingredient in the database
                    FOOD_DATABASE[key] = {
                        name: newName,
                        calories: newCalories,
                        protein: newProtein,
                        carbs: newCarbs,
                        fat: newFat,
                        isCustom: true
                    };
                    
                    document.body.removeChild(modal);
                    alert('✅ Ingredient updated successfully!\n\n"' + newName + '"\n' + 
                          newCalories + ' cal, ' + newProtein + 'g protein, ' + 
                          newCarbs + 'g carbs, ' + newFat + 'g fat');
                    self.render();
                });
                
                // Close on background click
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        document.body.removeChild(modal);
                    }
                });
            });

            deleteBtn.addEventListener('click', function() {
                if (confirm('Delete "' + ingredient.name + '"? This cannot be undone.')) {
                    delete FOOD_DATABASE[key];
                    alert('Ingredient deleted successfully!');
                    self.render();
                }
            });

            ingredientsList.appendChild(ingredientItem);
        });
        
        ingredientsCard.appendChild(ingredientsList);
    }

    root.appendChild(ingredientsCard);

    // Favorite Meals Section
    var favoriteMeals = Object.keys(FOOD_DATABASE).filter(key => FOOD_DATABASE[key].isFavoriteMeal);
    
    var mealsCard = el('div', { class: 'card' }, [
        el('h3', {}, ['💖 My Favorite Meals (' + favoriteMeals.length + ')']),
        el('div', { class: 'note' }, ['Meals you\'ve saved for quick logging'])
    ]);

    if (favoriteMeals.length === 0) {
        mealsCard.appendChild(el('div', { class: 'note', style: 'text-align: center; padding: 20px; background: #16213e; border-radius: 8px; margin: 10px 0;' }, [
            'No favorite meals yet. Go to the Nutrition tab and use "Create Custom Meal" → "Save as Favorite" to create reusable meals.'
        ]));
    } else {
        var mealsList = el('div', { style: 'margin: 15px 0;' }, []);
        
        favoriteMeals.forEach(key => {
            var meal = FOOD_DATABASE[key];
            var mealItem = el('div', { 
                style: 'margin: 10px 0; padding: 12px; background: #16213e; border-radius: 8px; border-left: 4px solid #FFB84D;'
            }, [
                el('div', { class: 'row', style: 'justify-content: space-between; align-items: center;' }, [
                    el('div', { style: 'flex: 1;' }, [
                        el('div', { style: 'font-weight: bold; margin-bottom: 5px;' }, [meal.name]),
                        el('div', { class: 'note' }, [
                            meal.calories + ' cal, ' +
                            meal.protein + 'g protein, ' +
                            meal.carbs + 'g carbs, ' +
                            meal.fat + 'g fat'
                        ])
                    ]),
                    el('div', { style: 'display: flex; gap: 8px;' }, [
                        el('button', { 
                            class: 'btn', 
                            style: 'background: #7CFFB2; color: #0a0a1a; padding: 6px 12px; font-size: 14px;'
                        }, ['🍽️ Quick Log']),
                        el('button', { 
                            class: 'btn', 
                            style: 'background: #FFB84D; color: #0a0a1a; padding: 6px 12px; font-size: 14px;'
                        }, ['✏️ Edit']),
                        el('button', { 
                            class: 'btn', 
                            style: 'background: #FF6B6B; padding: 6px 12px; font-size: 14px;'
                        }, ['🗑️ Delete'])
                    ])
                ])
            ]);

            // Quick log functionality
            var quickLogBtn = mealItem.querySelector('button[style*="7CFFB2"]');
            var editBtn = mealItem.querySelector('button[style*="FFB84D"]');
            var deleteBtn = mealItem.querySelector('button[style*="FF6B6B"]');

            quickLogBtn.addEventListener('click', async function() {
                try {
                    // Import logFood function
                    const { logFood } = await import('../utils/nutrition.js');
                    await logFood(key, 1);
                    alert('Meal logged successfully!');
                    self.setTab('nutrition'); // Switch to nutrition tab to see the log
                } catch (error) {
                    alert('Error logging meal: ' + error.message);
                }
            });

            editBtn.addEventListener('click', function() {
                // Create modal for editing meal
                var modal = el('div', { 
                    style: 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center;' 
                }, [
                    el('div', { 
                        class: 'card',
                        style: 'max-width: 500px; margin: 20px; max-height: 80vh; overflow-y: auto;'
                    }, [
                        el('h3', {}, ['✏️ Edit Meal: ' + meal.name]),
                        el('div', { style: 'margin: 15px 0;' }, [
                            el('label', { style: 'display: block; margin-bottom: 5px; font-weight: bold;' }, ['Meal Name:']),
                            el('input', { 
                                id: 'edit-meal-name',
                                class: 'input', 
                                type: 'text', 
                                placeholder: 'Enter meal name',
                                value: meal.name,
                                style: 'margin-bottom: 10px;'
                            }),
                            el('label', { style: 'display: block; margin-bottom: 5px; font-weight: bold;' }, ['Calories:']),
                            el('input', { 
                                id: 'edit-meal-calories',
                                class: 'input', 
                                type: 'number', 
                                placeholder: 'Enter calories',
                                value: meal.calories,
                                style: 'margin-bottom: 10px;'
                            }),
                            el('label', { style: 'display: block; margin-bottom: 5px; font-weight: bold;' }, ['Protein (g):']),
                            el('input', { 
                                id: 'edit-meal-protein',
                                class: 'input', 
                                type: 'number', 
                                step: '0.1',
                                placeholder: 'Enter protein',
                                value: meal.protein,
                                style: 'margin-bottom: 10px;'
                            }),
                            el('label', { style: 'display: block; margin-bottom: 5px; font-weight: bold;' }, ['Carbs (g):']),
                            el('input', { 
                                id: 'edit-meal-carbs',
                                class: 'input', 
                                type: 'number', 
                                step: '0.1',
                                placeholder: 'Enter carbs',
                                value: meal.carbs,
                                style: 'margin-bottom: 10px;'
                            }),
                            el('label', { style: 'display: block; margin-bottom: 5px; font-weight: bold;' }, ['Fat (g):']),
                            el('input', { 
                                id: 'edit-meal-fat',
                                class: 'input', 
                                type: 'number', 
                                step: '0.1',
                                placeholder: 'Enter fat',
                                value: meal.fat,
                                style: 'margin-bottom: 10px;'
                            }),
                            el('div', { class: 'note', style: 'margin-top: 10px;' }, [
                                'Edit the values to match how you actually make this meal. Changes will be saved immediately.'
                            ])
                        ]),
                        el('div', { class: 'row', style: 'gap: 10px; margin-top: 20px;' }, [
                            el('button', { class: 'btn', style: 'flex: 1; background: #666;' }, ['Cancel']),
                            el('button', { class: 'btn', style: 'flex: 1; background: #7CFFB2; color: #0a0a1a;' }, ['Save Changes'])
                        ])
                    ])
                ]);
                
                document.body.appendChild(modal);
                
                // Focus the name input
                setTimeout(() => modal.querySelector('#edit-meal-name').focus(), 100);
                
                // Cancel button
                modal.querySelector('button').addEventListener('click', function() {
                    document.body.removeChild(modal);
                });
                
                // Save button
                modal.querySelectorAll('button')[1].addEventListener('click', function() {
                    var newName = document.getElementById('edit-meal-name').value.trim();
                    var newCalories = parseFloat(document.getElementById('edit-meal-calories').value);
                    var newProtein = parseFloat(document.getElementById('edit-meal-protein').value);
                    var newCarbs = parseFloat(document.getElementById('edit-meal-carbs').value);
                    var newFat = parseFloat(document.getElementById('edit-meal-fat').value);
                    
                    if (!newName) {
                        alert('Please enter a meal name');
                        return;
                    }
                    
                    if (isNaN(newCalories) || newCalories < 0) {
                        alert('Please enter valid calories');
                        return;
                    }
                    
                    if (isNaN(newProtein) || newProtein < 0) newProtein = 0;
                    if (isNaN(newCarbs) || newCarbs < 0) newCarbs = 0;
                    if (isNaN(newFat) || newFat < 0) newFat = 0;
                    
                    // Update the meal in the database
                    FOOD_DATABASE[key] = {
                        name: newName,
                        calories: newCalories,
                        protein: newProtein,
                        carbs: newCarbs,
                        fat: newFat,
                        isCustom: true,
                        isFavoriteMeal: true
                    };
                    
                    document.body.removeChild(modal);
                    alert('✅ Meal updated successfully!\n\n"' + newName + '"\n' + 
                          newCalories + ' cal, ' + newProtein + 'g protein, ' + 
                          newCarbs + 'g carbs, ' + newFat + 'g fat');
                    self.render();
                });
                
                // Close on background click
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        document.body.removeChild(modal);
                    }
                });
            });

            deleteBtn.addEventListener('click', function() {
                if (confirm('Delete "' + meal.name + '"? This cannot be undone.')) {
                    delete FOOD_DATABASE[key];
                    alert('Meal deleted successfully!');
                    self.render();
                }
            });

            mealsList.appendChild(mealItem);
        });
        
        mealsCard.appendChild(mealsList);
    }

    root.appendChild(mealsCard);

    // Quick Actions Section
    var actionsCard = el('div', { class: 'card' }, [
        el('h3', {}, ['🔧 Quick Actions']),
        el('div', { class: 'row', style: 'gap: 10px; margin: 15px 0; flex-wrap: wrap;' }, [
            el('button', { 
                class: 'btn', 
                style: 'background: #7CFFB2; color: #0a0a1a; flex: 1; min-width: 200px;',
                onclick: function() { self.setTab('nutrition'); }
            }, ['➕ Add New Ingredient']),
            el('button', { 
                class: 'btn', 
                style: 'background: #FFB84D; color: #0a0a1a; flex: 1; min-width: 200px;',
                onclick: function() { self.setTab('nutrition'); }
            }, ['🍳 Create New Meal'])
        ]),
        el('div', { class: 'note', style: 'margin-top: 10px;' }, [
            'Use the Nutrition tab to add new ingredients or create new favorite meals. Then come back here to manage them.'
        ])
    ]);

    root.appendChild(actionsCard);

    return root;
}