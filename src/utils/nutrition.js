// Nutrition tracking and food database

import { getUserProfile, getSettings } from './database.js';
import { todayISO } from './dom.js';

// ============================================================================
// FOOD DATABASE
// ============================================================================

export const FOOD_DATABASE = {
    // Meal Prep Items
    'kung-pao-chicken': {
        name: 'Kung Pao Chicken (1 serving)',
        calories: 380,
        protein: 28,
        carbs: 15,
        fat: 22
    },
    'pineapple-chicken': {
        name: 'Pineapple Chicken (1 serving)', 
        calories: 350,
        protein: 32,
        carbs: 25,
        fat: 15
    },
    'beef-rice-prep': {
        name: 'Beef & Rice Meal Prep (1 container)',
        calories: 450,
        protein: 35,
        carbs: 35,
        fat: 18
    },
    'chicken-rice-prep': {
        name: 'Chicken & Rice Meal Prep (1 container)',
        calories: 420,
        protein: 38,
        carbs: 32,
        fat: 14
    },
    
    // Common Foods
    'large-egg': {
        name: 'Large Egg (1 egg)',
        calories: 70,
        protein: 6,
        carbs: 0,
        fat: 5
    },
    'banana': {
        name: 'Banana (1 medium)',
        calories: 105,
        protein: 1,
        carbs: 27,
        fat: 0
    },
    'apple': {
        name: 'Apple (1 medium)',
        calories: 80,
        protein: 0,
        carbs: 22,
        fat: 0
    },
    'orange': {
        name: 'Orange (1 medium)',
        calories: 60,
        protein: 1,
        carbs: 15,
        fat: 0
    },
    'strawberries': {
        name: 'Strawberries (1 cup)',
        calories: 50,
        protein: 1,
        carbs: 12,
        fat: 0
    },
    'blueberries': {
        name: 'Blueberries (1 cup)',
        calories: 85,
        protein: 1,
        carbs: 21,
        fat: 0
    },
    'grapes': {
        name: 'Grapes (1 cup)',
        calories: 60,
        protein: 1,
        carbs: 16,
        fat: 0
    },
    'pineapple': {
        name: 'Pineapple (1 cup chunks)',
        calories: 80,
        protein: 1,
        carbs: 22,
        fat: 0
    },
    'mango': {
        name: 'Mango (1 cup sliced)',
        calories: 105,
        protein: 1,
        carbs: 28,
        fat: 0
    },
    'watermelon': {
        name: 'Watermelon (1 cup)',
        calories: 45,
        protein: 1,
        carbs: 12,
        fat: 0
    },
    'cantaloupe': {
        name: 'Cantaloupe (1 cup)',
        calories: 55,
        protein: 1,
        carbs: 13,
        fat: 0
    },
    'peach': {
        name: 'Peach (1 medium)',
        calories: 60,
        protein: 1,
        carbs: 15,
        fat: 0
    },
    'pear': {
        name: 'Pear (1 medium)',
        calories: 100,
        protein: 1,
        carbs: 25,
        fat: 0
    },
    'cherries': {
        name: 'Cherries (1 cup)',
        calories: 85,
        protein: 1,
        carbs: 22,
        fat: 0
    },
    'protein-shake': {
        name: 'Protein Shake (1 scoop + milk)',
        calories: 200,
        protein: 30,
        carbs: 8,
        fat: 3
    },
    'greek-yogurt': {
        name: 'Greek Yogurt (1 cup)',
        calories: 130,
        protein: 20,
        carbs: 9,
        fat: 0
    },
    'chicken-breast': {
        name: 'Chicken Breast (4oz)',
        calories: 185,
        protein: 35,
        carbs: 0,
        fat: 4
    },
    'white-rice': {
        name: 'White Rice (1 cup cooked)',
        calories: 205,
        protein: 4,
        carbs: 45,
        fat: 0
    },
    'broccoli': {
        name: 'Broccoli (1 cup)',
        calories: 25,
        protein: 3,
        carbs: 5,
        fat: 0
    },
    
    // Nuts & Seeds
    'almonds': {
        name: 'Almonds (1 oz / 23 nuts)',
        calories: 160,
        protein: 6,
        carbs: 6,
        fat: 14
    },
    'walnuts': {
        name: 'Walnuts (1 oz)',
        calories: 185,
        protein: 4,
        carbs: 4,
        fat: 18
    },
    'peanut-butter': {
        name: 'Peanut Butter (2 tbsp)',
        calories: 190,
        protein: 8,
        carbs: 8,
        fat: 16
    },
    
    // Vegetables
    'carrot': {
        name: 'Carrot (1 medium)',
        calories: 25,
        protein: 1,
        carbs: 6,
        fat: 0
    },
    'spinach': {
        name: 'Spinach (1 cup)',
        calories: 7,
        protein: 1,
        carbs: 1,
        fat: 0
    },
    'bell-pepper': {
        name: 'Bell Pepper (1 medium)',
        calories: 25,
        protein: 1,
        carbs: 6,
        fat: 0
    },
    
    // Dairy & Alternatives
    'milk': {
        name: 'Milk (1 cup)',
        calories: 150,
        protein: 8,
        carbs: 12,
        fat: 8
    },
    'cheese-slice': {
        name: 'Cheese Slice (1 slice)',
        calories: 80,
        protein: 5,
        carbs: 1,
        fat: 6
    },
    'parmesan-cheese': {
        name: 'Parmesan Cheese (1 tbsp grated)',
        calories: 20,
        protein: 2,
        carbs: 0,
        fat: 1
    },
    'pesto': {
        name: 'Pesto (1 tbsp)',
        calories: 80,
        protein: 2,
        carbs: 1,
        fat: 8
    },
    
    // Grains & Starches
    'oatmeal': {
        name: 'Oatmeal (1 cup cooked)',
        calories: 150,
        protein: 5,
        carbs: 30,
        fat: 3
    },
    'sweet-potato': {
        name: 'Sweet Potato (1 medium)',
        calories: 100,
        protein: 2,
        carbs: 24,
        fat: 0
    },
    'bonoza-pasta': {
        name: 'Bonoza Pasta (1 cup cooked)',
        calories: 220,
        protein: 8,
        carbs: 44,
        fat: 1
    },

    
    // Example favorite meal (user can create their own)
    'meal-rolled-egg-dish': {
        name: 'Rolled Egg Dish (3 eggs + parm + pesto)',
        calories: 270,
        protein: 21,
        carbs: 1,
        fat: 22,
        isCustom: true,
        isFavoriteMeal: true
    }
};

// ============================================================================
// NUTRITION CALCULATIONS
// ============================================================================

export function calculateDailyTargets(user) {
    // Use most recent weight from user profile (will update as you lose weight)
    const weight = user.currentWeight || user.startingWeight || 262;
    const age = user.age || 52;
    const height = user.height || 71; // inches
    const gender = user.gender || 'male';
    
    // Calculate how much weight has been lost (for motivation)
    const startingWeight = user.startingWeight || weight;
    const weightLost = startingWeight - weight;
    
    // Calculate BMR (Mifflin-St Jeor)
    let bmr;
    if (gender === 'male') {
        bmr = (10 * (weight * 0.453592)) + (6.25 * (height * 2.54)) - (5 * age) + 5;
    } else {
        bmr = (10 * (weight * 0.453592)) + (6.25 * (height * 2.54)) - (5 * age) - 161;
    }
    
    // Activity multiplier (moderate - strength training 3-4x/week)
    const tdee = Math.round(bmr * 1.55);
    
    // Weight loss deficit options
    const deficits = {
        conservative: 500,  // 1 lb/week
        moderate: 750,      // 1.5 lb/week  
        aggressive: 1000    // 2 lb/week
    };
    
    // Use user's custom calorie target if set, otherwise use aggressive deficit for weight loss
    const customCalories = user.customCalorieTarget;
    const recommendedCalories = Math.round(tdee - deficits.aggressive);
    const calorieTarget = customCalories || recommendedCalories;
    
    // Protein for overweight individuals - use lean body mass estimate or goal weight
    // For overweight people, using total weight gives unrealistic protein targets
    let proteinTarget;
    if (user.customProteinTarget) {
        proteinTarget = user.customProteinTarget;
    } else {
        // Estimate lean body mass or use a more reasonable calculation
        // For overweight males: roughly 0.8-1.0g per lb of total weight is more realistic
        // This preserves muscle while losing fat without requiring excessive food intake
        const proteinPerLb = 0.9; // Reasonable for muscle preservation during weight loss
        proteinTarget = Math.round(weight * proteinPerLb);
        
        // Cap at reasonable maximum (most people can't consistently eat more than 200g)
        proteinTarget = Math.min(proteinTarget, 200);
    }
    
    return {
        calories: calorieTarget,
        protein: proteinTarget,
        tdee: tdee,
        bmr: Math.round(bmr),
        recommendedCalories: recommendedCalories,
        recommendedProtein: Math.round(weight * 0.9), // Realistic for weight loss
        isCustomTarget: !!customCalories,
        isCustomProtein: !!user.customProteinTarget,
        deficitOptions: {
            conservative: tdee - deficits.conservative,
            moderate: tdee - deficits.moderate,
            aggressive: tdee - deficits.aggressive
        },
        // Weight tracking info
        currentWeight: weight,
        startingWeight: startingWeight,
        weightLost: weightLost,
        // Show how targets change with weight loss
        targetImpact: {
            bmrPerLb: gender === 'male' ? 4.5 : 4.4, // Approx BMR change per lb
            proteinPerLb: 0.9, // Protein adjusts with weight
            caloriesPerLb: Math.round((gender === 'male' ? 4.5 : 4.4) * 1.55) // TDEE change per lb
        }
    };
}

// ============================================================================
// WEIGHT TRACKING
// ============================================================================

export async function updateCurrentWeight(newWeight) {
    const user = await window.db.findOne('user', { _id: 'user_profile' });
    
    // Set starting weight if this is the first time
    if (!user.startingWeight) {
        await window.db.update(
            'user', 
            { _id: 'user_profile' }, 
            { $set: { startingWeight: user.currentWeight || newWeight } }
        );
    }
    
    // Update current weight
    await window.db.update(
        'user', 
        { _id: 'user_profile' }, 
        { $set: { currentWeight: newWeight, lastWeightUpdate: new Date().toISOString() } }
    );
    
    // Log weight entry for tracking
    await window.db.insert('user_weight', {
        date: new Date().toISOString().split('T')[0],
        weight: newWeight,
        timestamp: new Date().toISOString()
    });
    
    return { success: true, newWeight: newWeight };
}

// ============================================================================
// FASTING CALCULATIONS
// ============================================================================

export function getFastingStatus(lastMealTime) {
    if (!lastMealTime) {
        return {
            fastingHours: 0,
            fastingMinutes: 0,
            status: 'Not fasting',
            milestone: null,
            nextMilestone: { hours: 12, message: 'Fat burning mode' }
        };
    }
    
    const now = new Date();
    const lastMeal = new Date(lastMealTime);
    const diffMs = now - lastMeal;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let status, milestone, nextMilestone;
    
    if (diffHours < 12) {
        status = 'Digesting';
        milestone = null;
        nextMilestone = { hours: 12, message: 'Fat burning mode activated 🔥' };
    } else if (diffHours < 16) {
        status = 'Fat burning mode 🔥';
        milestone = 'Fat burning activated';
        nextMilestone = { hours: 16, message: 'Growth hormone rising 📈' };
    } else if (diffHours < 18) {
        status = 'Growth hormone rising 📈';
        milestone = 'Growth hormone peak';
        nextMilestone = { hours: 18, message: 'Autophagy beginning 🧹' };
    } else if (diffHours < 20) {
        status = 'Autophagy beginning 🧹';
        milestone = 'Cellular cleanup started';
        nextMilestone = { hours: 20, message: 'Peak autophagy activated 🔬' };
    } else if (diffHours < 24) {
        status = 'Peak autophagy 🔬';
        milestone = 'Maximum cellular repair';
        nextMilestone = { hours: 24, message: 'Legendary fast achieved 🏆' };
    } else {
        status = 'Legendary fast 🏆';
        milestone = 'Maximum benefits achieved';
        nextMilestone = null;
    }
    
    return {
        fastingHours: Math.floor(diffHours),
        fastingMinutes: diffMinutes,
        totalHours: diffHours,
        status: status,
        milestone: milestone,
        nextMilestone: nextMilestone,
        hoursToNext: nextMilestone ? nextMilestone.hours - diffHours : 0
    };
}

export function getFastingMotivation(fastingStatus) {
    const hours = fastingStatus.fastingHours;
    
    if (hours < 12) {
        return {
            title: "Building Momentum",
            message: "Your body is transitioning from fed to fasted state. Fat burning will activate in " + 
                    Math.round(12 - fastingStatus.totalHours) + " hours.",
            color: "#FFD93D"
        };
    } else if (hours < 16) {
        return {
            title: "Fat Burning Activated! 🔥",
            message: "Your body is now primarily burning stored fat for energy. Growth hormone will start rising in " +
                    Math.round(16 - fastingStatus.totalHours) + " hours.",
            color: "#FF6B6B"
        };
    } else if (hours < 18) {
        return {
            title: "Growth Hormone Rising! 📈", 
            message: "Human growth hormone is increasing, helping preserve muscle while burning fat. Autophagy starts in " +
                    Math.round(18 - fastingStatus.totalHours) + " hours.",
            color: "#FFD93D"
        };
    } else if (hours < 20) {
        return {
            title: "Autophagy Activated! 🧹",
            message: "Your cells are cleaning house - removing damaged proteins and organelles. This is where the magic happens! Peak benefits in " +
                    Math.round(20 - fastingStatus.totalHours) + " hours.",
            color: "#7CFFB2"
        };
    } else {
        return {
            title: "Peak Autophagy! 🔬",
            message: "You're in the zone! Maximum cellular repair, fat oxidation, and metabolic benefits. Your body is operating at peak efficiency.",
            color: "#7CFFB2"
        };
    }
}

// ============================================================================
// NUTRITION LOGGING
// ============================================================================

export async function logFood(foodId, quantity = 1, customTime = null) {
    const food = FOOD_DATABASE[foodId];
    if (!food) throw new Error('Food not found');
    
    const logTime = customTime || new Date().toISOString();
    const today = todayISO();
    
    // Calculate nutrition values
    const nutrition = {
        calories: Math.round(food.calories * quantity),
        protein: Math.round(food.protein * quantity),
        carbs: Math.round(food.carbs * quantity),
        fat: Math.round(food.fat * quantity)
    };
    
    const foodEntry = {
        date: today,
        time: logTime,
        foodId: foodId,
        foodName: food.name,
        quantity: quantity,
        nutrition: nutrition
    };
    
    // Save to nutrition database
    await window.db.insert('nutrition', foodEntry);
    
    // Update last meal time in user profile
    await window.db.update(
        'user',
        { _id: 'user_profile' },
        { $set: { lastMealTime: logTime } }
    );
    
    return foodEntry;
}

export async function getDailyNutrition(date = null) {
    const targetDate = date || todayISO();
    
    // Performance: Cache daily nutrition data for faster access
    const cacheKey = `daily-nutrition-${targetDate}`;
    
    try {
        const { DatabaseOptimization } = await import('./performance.js');
        
        return await DatabaseOptimization.getCached(cacheKey, async () => {
            const entries = await window.db.find('nutrition', { date: targetDate });
            
            const totals = entries.reduce((sum, entry) => {
                return {
                    calories: sum.calories + entry.nutrition.calories,
                    protein: sum.protein + entry.nutrition.protein,
                    carbs: sum.carbs + entry.nutrition.carbs,
                    fat: sum.fat + entry.nutrition.fat
                };
            }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
            
            return {
                entries: entries,
                totals: totals,
                date: targetDate
            };
        }, 2 * 60 * 1000); // Cache for 2 minutes
        
    } catch (e) {
        // Fallback without caching
        const entries = await window.db.find('nutrition', { date: targetDate });
        
        const totals = entries.reduce((sum, entry) => {
            return {
                calories: sum.calories + entry.nutrition.calories,
                protein: sum.protein + entry.nutrition.protein,
                carbs: sum.carbs + entry.nutrition.carbs,
                fat: sum.fat + entry.nutrition.fat
            };
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
        
        return {
            entries: entries,
            totals: totals,
            date: targetDate
        };
    }
}