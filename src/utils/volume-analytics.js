// Volume Analytics - Track total workload progression
import { el } from './helpers.js';

// Muscle group mappings for exercises
const MUSCLE_GROUP_MAP = {
    // Upper Push (Chest, Shoulders, Triceps)
    'DB Press': 'chest',
    'DB Shoulder': 'shoulders', 
    'Pushup': 'chest',
    'Push-Up': 'chest',
    'Wall Push-Up': 'chest',
    'Knee Push-Up': 'chest',
    'Full Push-Up': 'chest',
    
    // Upper Pull (Back, Biceps)
    'DB Row': 'back',
    'Face Pulls': 'back',
    'DB Curl': 'biceps',
    'Bar Hang': 'back',
    'Chin Assist': 'back',
    
    // Lower Body
    'DB RDL': 'hamstrings',
    'TRX Squat': 'quads',
    'Step Up': 'quads',
    'Glute Bridge': 'glutes',
    
    // Accessory
    'Plank': 'core',
    'Wall Slides': 'shoulders'
};

// Calculate volume for a single set (reps × weight)
function calculateSetVolume(set, exerciseName) {
    const reps = set.reps || 0;
    const weight = set.weight || 0;
    
    // For bodyweight exercises, use bodyweight as resistance
    if (weight === 0 && (exerciseName.includes('Push') || exerciseName.includes('Hang'))) {
        // Estimate bodyweight (could pull from user profile)
        const estimatedBodyweight = 180; // Default, should pull from user data
        return reps * estimatedBodyweight;
    }
    
    return reps * weight;
}

// Calculate total volume for an exercise
function calculateExerciseVolume(exercise) {
    if (!exercise.completedSets || exercise.completedSets.length === 0) {
        return 0;
    }
    
    return exercise.completedSets.reduce((total, set) => {
        return total + calculateSetVolume(set, exercise.exerciseId || exercise.name);
    }, 0);
}

// Get muscle group for an exercise
function getMuscleGroup(exerciseName) {
    return MUSCLE_GROUP_MAP[exerciseName] || 'other';
}

// Calculate weekly volume by muscle group
export async function calculateWeeklyVolume(startDate = null, endDate = null) {
    try {
        // Default to current week if no dates provided
        if (!startDate) {
            const now = new Date();
            const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const monday = new Date(now);
            monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            monday.setHours(0, 0, 0, 0);
            startDate = monday.toISOString();
        }
        
        if (!endDate) {
            const sunday = new Date(startDate);
            sunday.setDate(sunday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);
            endDate = sunday.toISOString();
        }
        
        // Fetch workouts for the date range
        const workouts = await window.db.find('workouts', {
            date: { $gte: startDate, $lte: endDate }
        });
        
        const volumeByMuscleGroup = {};
        let totalVolume = 0;
        let totalSets = 0;
        
        workouts.forEach(workout => {
            if (!workout.exercises) return;
            
            workout.exercises.forEach(exercise => {
                const volume = calculateExerciseVolume(exercise);
                const muscleGroup = getMuscleGroup(exercise.exerciseId || exercise.name);
                
                if (!volumeByMuscleGroup[muscleGroup]) {
                    volumeByMuscleGroup[muscleGroup] = 0;
                }
                
                volumeByMuscleGroup[muscleGroup] += volume;
                totalVolume += volume;
                totalSets += (exercise.completedSets || []).length;
            });
        });
        
        return {
            muscleGroups: volumeByMuscleGroup,
            totalVolume,
            totalSets,
            workoutCount: workouts.length,
            dateRange: { startDate, endDate }
        };
        
    } catch (error) {
        console.error('Error calculating weekly volume:', error);
        return {
            muscleGroups: {},
            totalVolume: 0,
            totalSets: 0,
            workoutCount: 0,
            dateRange: { startDate: null, endDate: null }
        };
    }
}

// Calculate volume trend vs previous period
export async function calculateVolumeTrend(weeks = 4) {
    const trends = [];
    
    for (let i = 0; i < weeks; i++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7) - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const volume = await calculateWeeklyVolume(weekStart.toISOString(), weekEnd.toISOString());
        trends.unshift({
            week: `Week ${weeks - i}`,
            date: weekStart.toISOString().split('T')[0],
            ...volume
        });
    }
    
    return trends;
}

// Render volume analytics UI component
export function renderVolumeAnalytics(weeklyVolume, trends = []) {
    const muscleGroups = weeklyVolume.muscleGroups;
    const totalVolume = weeklyVolume.totalVolume;
    
    // Calculate previous week comparison if trends available
    let volumeChange = null;
    if (trends.length >= 2) {
        const thisWeek = trends[trends.length - 1].totalVolume;
        const lastWeek = trends[trends.length - 2].totalVolume;
        volumeChange = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek * 100) : 0;
    }
    
    const container = el('div', { class: 'card', style: 'margin: 15px 0;' }, [
        el('h3', {}, ['📊 Volume Analytics']),
        el('div', { class: 'note' }, ['Total workload (sets × reps × weight) for progressive overload tracking']),
        el('div', { class: 'hr' }, [])
    ]);
    
    // Total volume summary
    const totalSection = el('div', { style: 'margin: 15px 0; padding: 10px; background: #16213e; border-radius: 8px;' }, [
        el('div', { class: 'row', style: 'justify-content: space-between; align-items: center;' }, [
            el('div', {}, [
                el('div', { style: 'font-weight: bold; font-size: 18px;' }, [
                    '🏋️ Total Volume: ' + Math.round(totalVolume).toLocaleString() + ' lbs'
                ]),
                el('div', { class: 'note' }, [
                    weeklyVolume.totalSets + ' total sets • ' + weeklyVolume.workoutCount + ' workouts'
                ])
            ]),
            volumeChange !== null ? el('div', { 
                style: 'text-align: right; color: ' + (volumeChange >= 0 ? '#7CFFB2' : '#FFB84D') 
            }, [
                el('div', { style: 'font-weight: bold;' }, [
                    (volumeChange >= 0 ? '+' : '') + volumeChange.toFixed(1) + '%'
                ]),
                el('div', { class: 'note' }, ['vs last week'])
            ]) : null
        ])
    ]);
    
    container.appendChild(totalSection);
    
    // Muscle group breakdown
    if (Object.keys(muscleGroups).length > 0) {
        const muscleSection = el('div', { style: 'margin: 15px 0;' }, [
            el('div', { style: 'font-weight: bold; margin-bottom: 10px;' }, ['💪 By Muscle Group:'])
        ]);
        
        // Sort muscle groups by volume
        const sortedGroups = Object.entries(muscleGroups)
            .sort(([,a], [,b]) => b - a)
            .filter(([group, volume]) => volume > 0);
            
        sortedGroups.forEach(([group, volume]) => {
            const percentage = totalVolume > 0 ? (volume / totalVolume * 100) : 0;
            const groupRow = el('div', { 
                style: 'margin: 8px 0; padding: 8px; background: #0e1a2d; border-radius: 6px;'
            }, [
                el('div', { class: 'row', style: 'justify-content: space-between; align-items: center;' }, [
                    el('div', { style: 'text-transform: capitalize; font-weight: bold;' }, [
                        getGroupIcon(group) + ' ' + group
                    ]),
                    el('div', { style: 'text-align: right;' }, [
                        el('div', { style: 'font-weight: bold;' }, [Math.round(volume).toLocaleString() + ' lbs']),
                        el('div', { class: 'note', style: 'font-size: 11px;' }, [percentage.toFixed(1) + '%'])
                    ])
                ]),
                // Volume bar
                el('div', { 
                    style: 'margin-top: 5px; height: 4px; background: #2a4f86; border-radius: 2px; overflow: hidden;'
                }, [
                    el('div', { 
                        style: 'height: 100%; width: ' + percentage + '%; background: ' + getGroupColor(group) + '; transition: width 0.3s;'
                    }, [])
                ])
            ]);
            
            muscleSection.appendChild(groupRow);
        });
        
        container.appendChild(muscleSection);
    }
    
    // Volume trend chart (simple bars)
    if (trends.length > 1) {
        const trendSection = el('div', { style: 'margin: 15px 0;' }, [
            el('div', { style: 'font-weight: bold; margin-bottom: 10px;' }, ['📈 4-Week Trend:']),
            el('div', { style: 'display: flex; gap: 5px; height: 60px; align-items: end;' }, 
                trends.map(week => {
                    const maxVolume = Math.max(...trends.map(w => w.totalVolume));
                    const height = maxVolume > 0 ? (week.totalVolume / maxVolume * 100) : 0;
                    
                    return el('div', { 
                        style: 'flex: 1; display: flex; flex-direction: column; align-items: center;'
                    }, [
                        el('div', { 
                            style: 'width: 100%; background: #4ECDC4; height: ' + height + '%; min-height: 2px; border-radius: 2px;',
                            title: week.week + ': ' + Math.round(week.totalVolume).toLocaleString() + ' lbs'
                        }, []),
                        el('div', { class: 'note', style: 'font-size: 10px; margin-top: 5px;' }, [
                            week.week.replace('Week ', 'W')
                        ])
                    ]);
                })
            )
        ]);
        
        container.appendChild(trendSection);
    }
    
    return container;
}

// Helper functions
function getGroupIcon(group) {
    const icons = {
        chest: '🫁',
        back: '🪃', 
        shoulders: '💪',
        biceps: '💪',
        quads: '🦵',
        hamstrings: '🦵',
        glutes: '🍑',
        core: '🎯',
        other: '⚡'
    };
    return icons[group] || '⚡';
}

function getGroupColor(group) {
    const colors = {
        chest: '#FF6B6B',
        back: '#4ECDC4', 
        shoulders: '#FFD93D',
        biceps: '#7CFFB2',
        quads: '#FF8C42',
        hamstrings: '#9B59B6',
        glutes: '#FF6B9D',
        core: '#3498DB',
        other: '#95A5A6'
    };
    return colors[group] || '#95A5A6';
}