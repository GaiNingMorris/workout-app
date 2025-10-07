import { el, getUserProfile, getSettings } from '../utils/helpers.js';
import { calculateWeeklyVolume, calculateVolumeTrend, renderVolumeAnalytics } from '../utils/volume-analytics.js';
import { createCard, createStatsGrid, createStatCard, createStreakCard, createWeeklyGrid, create7DayGrid, createDayCard, COLORS } from '../utils/ui-components.js';
import { 
    getNutritionAnalyticsData, 
    groupNutritionByDate, 
    calculateNutritionStreaks, 
    calculateFastingAnalytics,
    getLastNWeeks,
    todayISO,
    formatPercentageWithColor,
    handleAnalyticsError
} from '../utils/analytics-common.js';

export function renderAnalytics(App) {
    var self = App;
    var root = el('div', {}, []);
    
    (async function() {
        const user = await getUserProfile();
        const settings = await getSettings();
        
        root.appendChild(el('div', { class: 'brand' }, [
            el('div', { class: 'dot' }, []), 
            el('h2', {}, ['Analytics Dashboard']), 
            el('span', { class: 'sub' }, ['Advanced training and nutrition insights'])
        ]));

        // Volume Analytics Section
        try {
            const currentWeekVolume = await calculateWeeklyVolume();
            const volumeTrends = await calculateVolumeTrend(6); // 6 weeks of data
            const volumeCard = renderVolumeAnalytics(currentWeekVolume, volumeTrends);
            root.appendChild(volumeCard);
        } catch (error) {
            console.error('Error loading volume analytics:', error);
            root.appendChild(el('div', { class: 'card' }, [
                el('h3', {}, ['📊 Volume Analytics']),
                el('div', { class: 'note' }, ['Complete some workouts to see volume progression tracking!']),
                el('div', { class: 'note', style: 'margin-top: 10px; color: #FFD93D;' }, [
                    '💡 Tip: Volume = Sets × Reps × Weight. Track this to ensure progressive overload!'
                ])
            ]));
        }

        // Training Frequency Analytics
        try {
            const frequencyCard = await renderTrainingFrequency();
            root.appendChild(frequencyCard);
        } catch (error) {
            console.error('Error loading training frequency:', error);
        }

        // Strength Progression Analytics
        try {
            const strengthCard = await renderStrengthProgression();
            root.appendChild(strengthCard);
        } catch (error) {
            console.error('Error loading strength progression:', error);
        }

        // Nutrition Analytics Summary
        try {
            const nutritionCard = await renderNutritionAnalytics();
            root.appendChild(nutritionCard);
        } catch (error) {
            console.error('Error loading nutrition analytics:', error);
        }

    })();

    return root;
}

// Training Frequency Analytics
async function renderTrainingFrequency() {
    const workouts = await window.db.find('workouts', {});
    const last4Weeks = getLastNWeeks(workouts, 4).map((week, index) => ({
        ...week,
        week: `Week ${index + 1}`
    }));
    
    const avgFrequency = last4Weeks.reduce((sum, week) => sum + week.workouts, 0) / 4;
    const targetFrequency = 4; // 4-day split
    const consistency = (avgFrequency / targetFrequency * 100);
    
    return createCard('📅 Training Frequency', 'Workout consistency over the last 4 weeks', [
        // Summary
        createStatsGrid([
            {
                value: avgFrequency.toFixed(1) + '/week',
                label: 'Average Workouts (target: ' + targetFrequency + ')',
                color: COLORS.primary,
                icon: '🎯'
            },
            {
                value: consistency.toFixed(1) + '%',
                label: getConsistencyTip(consistency),
                color: consistency >= 80 ? COLORS.primary : consistency >= 60 ? COLORS.secondary : COLORS.warning,
                icon: consistency >= 80 ? '🔥' : consistency >= 60 ? '⚡' : '📈'
            }
        ], 2),
        
        // Weekly breakdown
        el('div', { style: 'margin: 15px 0;' }, [
            el('div', { style: 'font-weight: bold; margin-bottom: 10px;' }, ['Weekly Breakdown:']),
            createWeeklyGrid(last4Weeks, targetFrequency, (week) => week.workouts)
        ])
    ]);
}

// Strength Progression Analytics
async function renderStrengthProgression() {
    const keyExercises = [
        'Bench-Supported Dumbbell Press', 
        'Seated Dumbbell Row', 
        'Seated Dumbbell Shoulder Press',
        'Romanian Deadlift (RDL)',
        'TRX Squat'
    ];
    const progressionData = [];
    
    for (const exercise of keyExercises) {
        try {
            const loads = await window.db.find('loads', { exerciseId: exercise });
            if (loads.length > 0) {
                const load = loads[0];
                const currentWeight = load.currentWeight || 0;
                
                // If no starting weight recorded, check workout history for earliest weight
                let startingWeight = load.startingWeight;
                if (!startingWeight) {
                    const workouts = await window.db.find('workouts', {});
                    let earliestWeight = currentWeight;
                    
                    for (const workout of workouts) {
                        const exerciseData = workout.exercises.find(ex => ex.exerciseId === exercise);
                        if (exerciseData && exerciseData.completedSets && exerciseData.completedSets.length > 0) {
                            const firstSetWeight = exerciseData.completedSets[0].weight;
                            if (firstSetWeight > 0) {
                                earliestWeight = Math.min(earliestWeight, firstSetWeight);
                            }
                        }
                    }
                    startingWeight = earliestWeight;
                }
                
                const totalIncrease = currentWeight - startingWeight;
                
                progressionData.push({
                    exercise: exercise.replace('Seated Dumbbell ', 'DB ').replace('Bench-Supported Dumbbell ', 'DB '),
                    currentWeight,
                    startingWeight,
                    totalIncrease,
                    progressPercentage: startingWeight > 0 ? (totalIncrease / startingWeight * 100) : 0,
                    hasData: true
                });
            }
        } catch (error) {
            console.log('Error loading progression for', exercise, error);
        }
    }
    
    return createCard('💪 Strength Progression', 'Weight increases on key compound movements', [
        
        progressionData.length > 0 ? el('div', { style: 'margin: 15px 0;' }, 
            progressionData.map(data => {
                return el('div', { 
                    style: 'margin: 10px 0; padding: 10px; background: #16213e; border-radius: 8px;'
                }, [
                    el('div', { class: 'row', style: 'justify-content: space-between; align-items: center;' }, [
                        el('div', {}, [
                            el('div', { style: 'font-weight: bold;' }, [data.exercise]),
                            el('div', { class: 'note' }, [
                                'Started: ' + data.startingWeight + ' lbs → Current: ' + data.currentWeight + ' lbs'
                            ])
                        ]),
                        el('div', { style: 'text-align: right;' }, [
                            el('div', { 
                                style: 'font-weight: bold; color: ' + (data.totalIncrease > 0 ? '#7CFFB2' : data.totalIncrease === 0 ? '#FFD93D' : '#FF6B6B')
                            }, [
                                data.totalIncrease === 0 ? 'No change yet' : (data.totalIncrease >= 0 ? '+' : '') + data.totalIncrease + ' lbs'
                            ]),
                            el('div', { class: 'note' }, [
                                data.totalIncrease === 0 ? 'Keep training!' : data.progressPercentage.toFixed(1) + '% increase'
                            ])
                        ])
                    ])
                ]);
            })
        ) : el('div', { class: 'note', style: 'text-align: center; padding: 20px;' }, [
            'Complete some workouts to see strength progression!'
        ])
    ]);
}

// Comprehensive Nutrition Analytics (moved from Charts)
async function renderNutritionAnalytics() {
    try {
        const { user, nutritionEntries, dailyTargets, todayNutrition } = await getNutritionAnalyticsData();
        
        if (!user || !dailyTargets) {
            return handleAnalyticsError(new Error('Missing user or targets'), '🍽️ Nutrition Analytics', 'Unable to load nutrition targets');
        }
        
        // Group by date and calculate analytics
        const dailyData = groupNutritionByDate(nutritionEntries);
        const dates = Object.keys(dailyData).sort().slice(-7);
        
        if (dates.length === 0) {
            return createCard('🍽️ Nutrition Analytics', null, [
                el('div', { class: 'note' }, ['Start tracking nutrition to see comprehensive analytics here!'])
            ]);
        }
        
        // Calculate last 7 days data
        const last7Days = dates.map(date => ({
            date: date,
            ...dailyData[date],
            calorieGoalMet: dailyData[date].calories <= dailyTargets.calories,
            proteinGoalMet: dailyData[date].protein >= dailyTargets.protein
        }));

        // Calculate streaks and averages
        const { currentCalorieStreak, currentProteinStreak } = calculateNutritionStreaks(dailyData, dailyTargets);
        const totalDays = dates.length;
        const avgCalories = totalDays > 0 ? Math.round(dates.reduce((sum, date) => sum + dailyData[date].calories, 0) / totalDays) : 0;
        const avgProtein = totalDays > 0 ? Math.round(dates.reduce((sum, date) => sum + dailyData[date].protein, 0) / totalDays) : 0;

        // Fasting analytics
        const fastingData = calculateFastingAnalytics(nutritionEntries, dates);
        const avgFastingHours = fastingData.length > 0 ? Math.round(fastingData.reduce((sum, d) => sum + d.fastingHours, 0) / fastingData.length) : 0;

        if (totalDays === 0) {
            return el('div', { class: 'card', style: 'margin: 15px 0;' }, [
                el('h3', {}, ['🍽️ Nutrition Analytics']),
                el('div', { class: 'note' }, ['Start tracking nutrition to see comprehensive analytics here!'])
            ]);
        }

        return createCard('🍽️ Comprehensive Nutrition Analytics', 'Track your eating patterns, streaks, and fasting habits', [
            
            // Summary Stats
            createStatsGrid([
                { value: totalDays, label: 'Days Tracked', color: COLORS.primary },
                { value: avgCalories, label: 'Avg Calories/Day', color: COLORS.secondary },
                { value: avgProtein + 'g', label: 'Avg Protein/Day', color: COLORS.accent },
                ...(avgFastingHours > 0 ? [{ value: avgFastingHours + 'h', label: 'Avg Fasting/Day', color: COLORS.warning }] : [])
            ]),

            // Current Streaks
            el('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;' }, [
                createStreakCard({
                    title: 'Calorie Goal Streak',
                    icon: '🔥',
                    streak: currentCalorieStreak,
                    description: 'Days staying under ' + dailyTargets.calories + ' calories',
                    isActive: currentCalorieStreak > 0
                }),
                createStreakCard({
                    title: 'Protein Goal Streak',
                    icon: '💪',
                    streak: currentProteinStreak,
                    description: 'Days hitting ' + dailyTargets.protein + 'g+ protein',
                    isActive: currentProteinStreak > 0
                })
            ]),

            // Last 7 Days Summary
            last7Days.length > 0 ? el('div', { style: 'margin: 20px 0;' }, [
                el('h4', { style: 'margin-bottom: 15px;' }, ['📅 Last 7 Days']),
                create7DayGrid(last7Days, (day) => {
                    const date = new Date(day.date);
                    const dayName = date.toLocaleDateString('en', { weekday: 'short' });
                    const todayISO = new Date().toISOString().split('T')[0];
                    
                    return createDayCard({
                        dayName,
                        data: [
                            el('div', { class: 'note', style: 'font-size: 11px;' }, [day.calories + 'cal']),
                            el('div', { class: 'note', style: 'font-size: 11px;' }, [day.protein + 'g pro'])
                        ],
                        goalsMet: [day.calorieGoalMet, day.proteinGoalMet],
                        isToday: day.date === todayISO
                    });
                })
            ]) : null,

            // Today's Progress
            el('div', { style: 'margin: 20px 0; padding: 15px; background: #16213e; border-radius: 8px;' }, [
                el('h4', { style: 'margin-bottom: 15px;' }, ['📊 Today\'s Progress']),
                el('div', { class: 'row', style: 'gap: 15px;' }, [
                    el('div', { style: 'flex: 1;' }, [
                        el('div', { class: 'note' }, ['Protein']),
                        el('div', { style: 'font-weight: bold;' }, [
                            todayNutrition.totals.protein + 'g / ' + dailyTargets.protein + 'g'
                        ]),
                        el('div', { 
                            style: 'height: 6px; background: #2a4f86; border-radius: 3px; overflow: hidden; margin: 5px 0;'
                        }, [
                            el('div', { 
                                style: 'height: 100%; width: ' + Math.min((todayNutrition.totals.protein / dailyTargets.protein) * 100, 100) + '%; background: #7CFFB2; transition: width 0.3s;'
                            }, [])
                        ])
                    ]),
                    el('div', { style: 'flex: 1;' }, [
                        el('div', { class: 'note' }, ['Calories']),
                        el('div', { style: 'font-weight: bold;' }, [
                            todayNutrition.totals.calories + ' / ' + dailyTargets.calories
                        ]),
                        el('div', { 
                            style: 'height: 6px; background: #2a4f86; border-radius: 3px; overflow: hidden; margin: 5px 0;'
                        }, [
                            el('div', { 
                                style: 'height: 100%; width: ' + Math.min((todayNutrition.totals.calories / dailyTargets.calories) * 100, 100) + '%; background: #FFD93D; transition: width 0.3s;'
                            }, [])
                        ])
                    ])
                ])
            ])
        ]);
        
    } catch (error) {
        console.error('Error loading nutrition analytics:', error);
        return el('div', { class: 'card', style: 'margin: 15px 0;' }, [
            el('h3', {}, ['🍽️ Nutrition Analytics']),
            el('div', { class: 'note' }, ['Error loading nutrition data. Please try again.'])
        ]);
    }
}

// Helper function for consistency tips
function getConsistencyTip(percentage) {
    if (percentage >= 90) return 'Amazing!';
    if (percentage >= 80) return 'Keep it up!';
    if (percentage >= 70) return 'Almost there!';
    if (percentage >= 60) return 'Stay consistent';
    return 'Focus time!';
}