// Common analytics utilities and data processing functions
import { getUserProfile, getSettings } from './helpers.js';
import { calculateDailyTargets, getDailyNutrition } from './nutrition.js';

// Common function to get workout data for analytics
export async function getWorkoutAnalyticsData() {
    try {
        const workouts = await window.db.find('workouts', {});
        const user = await getUserProfile();
        const settings = await getSettings();
        
        return { workouts, user, settings };
    } catch (error) {
        console.error('Error loading workout analytics data:', error);
        return { workouts: [], user: null, settings: null };
    }
}

// Common function to get nutrition analytics data
export async function getNutritionAnalyticsData() {
    try {
        const user = await getUserProfile();
        const nutritionEntries = await window.db.find('nutrition', {});
        const dailyTargets = await calculateDailyTargets(user);
        const todayNutrition = await getDailyNutrition();
        
        return { user, nutritionEntries, dailyTargets, todayNutrition };
    } catch (error) {
        console.error('Error loading nutrition analytics data:', error);
        return { user: null, nutritionEntries: [], dailyTargets: null, todayNutrition: null };
    }
}

// Group nutrition entries by date
export function groupNutritionByDate(nutritionEntries) {
    const dailyData = {};
    nutritionEntries.forEach(entry => {
        const date = entry.time.split('T')[0];
        if (!dailyData[date]) {
            dailyData[date] = { calories: 0, protein: 0, carbs: 0, fat: 0, entries: 0 };
        }
        dailyData[date].calories += entry.nutrition.calories;
        dailyData[date].protein += entry.nutrition.protein;
        dailyData[date].carbs += entry.nutrition.carbs;
        dailyData[date].fat += entry.nutrition.fat;
        dailyData[date].entries++;
    });
    return dailyData;
}

// Calculate nutrition streaks
export function calculateNutritionStreaks(dailyData, dailyTargets) {
    const dates = Object.keys(dailyData).sort();
    let currentCalorieStreak = 0;
    let currentProteinStreak = 0;
    
    // Calculate current streaks (from most recent backwards)
    for (let i = dates.length - 1; i >= 0; i--) {
        if (dailyData[dates[i]].calories <= dailyTargets.calories) {
            currentCalorieStreak++;
        } else break;
    }
    
    for (let i = dates.length - 1; i >= 0; i--) {
        if (dailyData[dates[i]].protein >= dailyTargets.protein) {
            currentProteinStreak++;
        } else break;
    }
    
    return { currentCalorieStreak, currentProteinStreak };
}

// Calculate fasting analytics
export function calculateFastingAnalytics(nutritionEntries, dates) {
    const fastingData = [];
    if (dates.length >= 3) {
        dates.forEach(date => {
            const dayEntries = nutritionEntries.filter(e => e.time.split('T')[0] === date);
            if (dayEntries.length > 0) {
                const firstMeal = new Date(Math.min(...dayEntries.map(e => new Date(e.time))));
                const lastMeal = new Date(Math.max(...dayEntries.map(e => new Date(e.time))));
                const eatingWindow = (lastMeal - firstMeal) / (1000 * 60 * 60); // hours
                fastingData.push({
                    date: date,
                    eatingWindow: Math.max(0.5, eatingWindow), // minimum 30 min window
                    fastingHours: Math.max(0, 24 - eatingWindow)
                });
            }
        });
    }
    return fastingData;
}

// Get last N weeks of workout data
export function getLastNWeeks(workouts, n = 4) {
    const now = new Date();
    const weeks = [];
    
    for (let i = 0; i < n; i++) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const weekWorkouts = workouts.filter(w => {
            const workoutDate = new Date(w.date);
            return workoutDate >= weekStart && workoutDate <= weekEnd;
        });
        
        weeks.unshift({
            week: `Week ${i === 0 ? 'Current' : i === 1 ? 'Last' : i + ' ago'}`,
            workouts: weekWorkouts.length,
            startDate: weekStart,
            endDate: weekEnd
        });
    }
    
    return weeks;
}

// Common function to get today's ISO date
export function todayISO() {
    return new Date().toISOString().split('T')[0];
}

// Format percentage with color coding
export function formatPercentageWithColor(percentage) {
    const color = percentage >= 80 ? '#7CFFB2' : percentage >= 60 ? '#FFD93D' : '#FF6B6B';
    const emoji = percentage >= 80 ? '🔥' : percentage >= 60 ? '⚡' : '📈';
    return { color, emoji, text: percentage.toFixed(1) + '%' };
}

// Common error handling for analytics
export function handleAnalyticsError(error, fallbackTitle, fallbackMessage) {
    console.error('Analytics error:', error);
    return {
        error: true,
        title: fallbackTitle,
        message: fallbackMessage || 'Error loading data. Please try again.'
    };
}