import { el, todayISO, fmtClock } from '../utils/helpers.js';
import { calculateDailyTargets, getDailyNutrition } from '../utils/nutrition.js';

export function renderLogs(App) {
    var self = App;
    var root = el('div', {}, []);

    (async function() {
        const user = await window.db.findOne('user', { _id: 'user_profile' });
        
        // Header
        root.appendChild(el('div', { class: 'brand' }, [
            el('div', { class: 'dot' }, []),
            el('h2', {}, ['Daily Log']),
            el('span', { class: 'sub' }, ['Complete timeline of your health & fitness activities'])
        ]));

        // Date selector - use correct date (October 6, 2025)
        var selectedDate = '2025-10-06';
        var dateInput = el('input', { 
            type: 'date', 
            value: selectedDate,
            style: 'margin: 10px 0; padding: 8px; background: #16213e; border: 1px solid #444; color: white; border-radius: 4px;'
        });

        var dateCard = el('div', { class: 'card', style: 'margin-bottom: 15px;' }, [
            el('div', { class: 'row', style: 'align-items: center; gap: 15px;' }, [
                el('label', { style: 'font-weight: bold;' }, ['View Date:']),
                dateInput,
                el('button', { 
                    class: 'btn', 
                    style: 'background: #7CFFB2; color: #0a0a1a;',
                    onclick: function() { 
                        selectedDate = '2025-10-06';
                        dateInput.value = selectedDate;
                        loadLogData(selectedDate);
                    }
                }, ['Today'])
            ])
        ]);

        root.appendChild(dateCard);

        // Log container
        var logContainer = el('div', { id: 'log-container' }, []);
        root.appendChild(logContainer);

        // Load log data function
        async function loadLogData(date) {
            logContainer.innerHTML = '';
            
            try {
                // Get all data for the selected date
                const [nutritionEntries, workouts, user] = await Promise.all([
                    window.db.find('nutrition', { date: date }),
                    window.db.find('workouts', {}),
                    window.db.findOne('user', { _id: 'user_profile' })
                ]);

                // Get weight entries for this date  
                const weightEntries = (user && user.bodyweightHistory || []).filter(entry => 
                    entry.date && entry.date.split('T')[0] === date
                );

                // Filter workouts for the selected date
                const dayWorkouts = workouts.filter(w => 
                    new Date(w.date).toISOString().split('T')[0] === date
                );

                // Combine all entries with timestamps
                const allEntries = [];

                // Add nutrition entries
                nutritionEntries.forEach(entry => {
                    allEntries.push({
                        type: 'nutrition',
                        time: new Date(entry.time),
                        data: entry
                    });
                });

                // Add workout entries
                dayWorkouts.forEach(workout => {
                    allEntries.push({
                        type: 'workout',
                        time: new Date(workout.startTime || workout.date),
                        data: workout
                    });
                });

                // Add weight entries
                weightEntries.forEach(entry => {
                    allEntries.push({
                        type: 'weight',
                        time: new Date(entry.date),
                        data: entry
                    });
                });

                // Sort by time (most recent first)
                allEntries.sort((a, b) => b.time - a.time);

                if (allEntries.length === 0) {
                    logContainer.appendChild(el('div', { class: 'card' }, [
                        el('div', { class: 'note', style: 'text-align: center; padding: 40px;' }, [
                            'No activities logged for ' + new Date(date).toLocaleDateString()
                        ]),
                        el('div', { class: 'note', style: 'text-align: center;' }, [
                            'Go to Today, Nutrition, or Goals tabs to log activities!'
                        ])
                    ]));
                    return;
                }

                // Daily summary card
                const dailyTargets = user ? calculateDailyTargets(user) : { calories: 2000, protein: 150 };
                const nutritionTotals = nutritionEntries.reduce((sum, entry) => ({
                    calories: sum.calories + entry.nutrition.calories,
                    protein: sum.protein + entry.nutrition.protein,
                    carbs: sum.carbs + entry.nutrition.carbs,
                    fat: sum.fat + entry.nutrition.fat
                }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

                const summaryCard = el('div', { class: 'card', style: 'margin-bottom: 20px; background: linear-gradient(135deg, #1a2332, #16213e);' }, [
                    el('h3', {}, ['📊 ' + new Date(date).toLocaleDateString() + ' Summary']),
                    el('div', { class: 'hr' }, []),
                    el('div', { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; margin: 15px 0;' }, [
                        // Nutrition summary
                        nutritionEntries.length > 0 ? el('div', { style: 'text-align: center; padding: 10px; background: rgba(124, 255, 178, 0.1); border-radius: 6px;' }, [
                            el('div', { style: 'font-size: 20px; font-weight: bold; color: #7CFFB2;' }, [nutritionTotals.calories]),
                            el('div', { class: 'note' }, ['Calories']),
                            el('div', { style: 'font-size: 14px; margin-top: 5px;' }, [nutritionTotals.protein + 'g protein'])
                        ]) : null,

                        // Workout summary  
                        dayWorkouts.length > 0 ? el('div', { style: 'text-align: center; padding: 10px; background: rgba(255, 217, 61, 0.1); border-radius: 6px;' }, [
                            el('div', { style: 'font-size: 20px; font-weight: bold; color: #FFD93D;' }, [dayWorkouts.length]),
                            el('div', { class: 'note' }, ['Workouts']),
                            el('div', { style: 'font-size: 14px; margin-top: 5px;' }, [
                                dayWorkouts.reduce((sum, w) => sum + (w.exercises || []).length, 0) + ' exercises'
                            ])
                        ]) : null,

                        // Weight summary
                        weightEntries.length > 0 ? el('div', { style: 'text-align: center; padding: 10px; background: rgba(255, 184, 77, 0.1); border-radius: 6px;' }, [
                            el('div', { style: 'font-size: 20px; font-weight: bold; color: #FFB84D;' }, [weightEntries[0].weight + ' lbs']),
                            el('div', { class: 'note' }, ['Weight Logged'])
                        ]) : null,

                        // Activity count
                        el('div', { style: 'text-align: center; padding: 10px; background: rgba(255, 107, 107, 0.1); border-radius: 6px;' }, [
                            el('div', { style: 'font-size: 20px; font-weight: bold; color: #FF6B6B;' }, [allEntries.length]),
                            el('div', { class: 'note' }, ['Total Activities'])
                        ])
                    ].filter(Boolean))
                ]);

                logContainer.appendChild(summaryCard);

                // Timeline entries
                const timelineCard = el('div', { class: 'card' }, [
                    el('h3', {}, ['⏰ Activity Timeline']),
                    el('div', { class: 'hr' }, [])
                ]);

                allEntries.forEach(entry => {
                    const timeStr = entry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    let entryElement;

                    switch (entry.type) {
                        case 'nutrition':
                            entryElement = el('div', { 
                                style: 'margin: 15px 0; padding: 12px; background: #16213e; border-radius: 8px; border-left: 4px solid #7CFFB2;'
                            }, [
                                el('div', { class: 'row', style: 'justify-content: space-between; align-items: center;' }, [
                                    el('div', { style: 'flex: 1;' }, [
                                        el('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
                                            el('span', { style: 'font-size: 18px;' }, ['🍽️']),
                                            el('span', { style: 'font-weight: bold;' }, [entry.data.foodName]),
                                            el('span', { class: 'note' }, [timeStr])
                                        ]),
                                        el('div', { class: 'note', style: 'margin-top: 5px;' }, [
                                            entry.data.nutrition.calories + ' cal • ' +
                                            entry.data.nutrition.protein + 'g protein • ' +
                                            entry.data.nutrition.carbs + 'g carbs • ' +
                                            entry.data.nutrition.fat + 'g fat'
                                        ])
                                    ])
                                ])
                            ]);
                            break;

                        case 'workout':
                            const duration = entry.data.endTime ? 
                                Math.round((new Date(entry.data.endTime) - new Date(entry.data.startTime)) / 60000) : 
                                'In progress';
                            
                            entryElement = el('div', { 
                                style: 'margin: 15px 0; padding: 12px; background: #16213e; border-radius: 8px; border-left: 4px solid #FFD93D;'
                            }, [
                                el('div', { style: 'flex: 1;' }, [
                                    el('div', { style: 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;' }, [
                                        el('span', { style: 'font-size: 18px;' }, ['💪']),
                                        el('span', { style: 'font-weight: bold;' }, [
                                            entry.data.template.charAt(0).toUpperCase() + entry.data.template.slice(1) + ' Workout'
                                        ]),
                                        el('span', { class: 'note' }, [timeStr])
                                    ]),
                                    el('div', { class: 'note' }, [
                                        (entry.data.exercises || []).length + ' exercises • ' +
                                        (typeof duration === 'number' ? duration + ' minutes' : duration)
                                    ]),
                                    entry.data.exercises && entry.data.exercises.length > 0 ? 
                                        el('div', { style: 'margin-top: 8px;' }, [
                                            el('details', {}, [
                                                el('summary', { style: 'cursor: pointer; color: #7CFFB2;' }, ['View exercises']),
                                                el('div', { style: 'margin-top: 8px; padding-left: 15px;' }, 
                                                    entry.data.exercises.map(ex => 
                                                        el('div', { class: 'note', style: 'margin: 2px 0;' }, [
                                                            ex.exerciseId + ': ' + (ex.completedSets || []).length + '/' + ex.sets + ' sets'
                                                        ])
                                                    )
                                                )
                                            ])
                                        ]) : null
                                ])
                            ]);
                            break;

                        case 'weight':
                            entryElement = el('div', { 
                                style: 'margin: 15px 0; padding: 12px; background: #16213e; border-radius: 8px; border-left: 4px solid #FFB84D;'
                            }, [
                                el('div', { class: 'row', style: 'justify-content: space-between; align-items: center;' }, [
                                    el('div', { style: 'flex: 1;' }, [
                                        el('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
                                            el('span', { style: 'font-size: 18px;' }, ['⚖️']),
                                            el('span', { style: 'font-weight: bold;' }, ['Weight: ' + entry.data.weight + ' lbs']),
                                            el('span', { class: 'note' }, [timeStr])
                                        ])
                                    ])
                                ])
                            ]);
                            break;
                    }

                    if (entryElement) {
                        timelineCard.appendChild(entryElement);
                    }
                });

                logContainer.appendChild(timelineCard);

            } catch (error) {
                console.error('Error loading log data:', error);
                logContainer.appendChild(el('div', { class: 'card' }, [
                    el('div', { class: 'note', style: 'color: #FF6B6B; text-align: center; padding: 20px;' }, [
                        'Error loading log data: ' + error.message
                    ])
                ]));
            }
        }

        // Date change handler
        dateInput.addEventListener('change', function() {
            selectedDate = this.value;
            loadLogData(selectedDate);
        });

        // Load today's data initially
        loadLogData(selectedDate).catch(error => {
            console.error('Error loading initial log data:', error);
            logContainer.appendChild(el('div', { class: 'card' }, [
                el('div', { class: 'note', style: 'color: #FF6B6B; text-align: center; padding: 20px;' }, [
                    'Error loading log data: ' + error.message
                ])
            ]));
        });
    })();

    return root;
}