import { el, todayISO, getUserProfile, getSettings, getProgressionFor } from '../utils/helpers.js';
import { USER_CONFIG } from '../config/userConfig.js';
import { calculateDailyTargets, getDailyNutrition } from '../utils/nutrition.js';

export function renderCharts(App) {
    var self = App;
    var root = el('div', {}, []);
    
    (async function() {
        const user = await getUserProfile();
        const settings = await getSettings();
        
        var firstLogDate = new Date(user.startDate || new Date());
        var daysSinceStart = Math.floor((Date.now() - firstLogDate.getTime()) / (1000 * 60 * 60 * 24));
        var weeksSinceStart = Math.floor(daysSinceStart / 7);

        // Chart creation functions with game-like target tracking
        function createWeightChart(weightHistory, targetWeight) {
            if (!weightHistory || weightHistory.length === 0) {
                return el('div', { class: 'chart-placeholder' }, [
                    el('div', { class: 'placeholder-icon' }, ['📊']),
                    el('div', { class: 'placeholder-text' }, ['Start logging weight to see your progress!']),
                    el('div', { class: 'placeholder-subtext' }, ['Your weight loss journey will appear here'])
                ]);
            }

            var canvas = el('canvas', { 
                width: 1000, 
                height: 450, 
                style: 'background: #0a0a1a; border-radius: 8px; border: 2px solid #1a1a2e; max-width: 100%;' 
            });
            
            setTimeout(() => {
                var ctx = canvas.getContext('2d');
                var weights = weightHistory.map(entry => entry.weight);
                var dates = weightHistory.map(entry => new Date(entry.date));
                
                var startWeight = weights[0];
                var currentWeight = weights[weights.length - 1];
                var totalWeightToLose = startWeight - targetWeight;
                
                // Dynamic weight scale - tighter range to show progress better
                var actualRange = Math.max(...weights) - Math.min(...weights, targetWeight);
                var padding = Math.max(2, Math.min(actualRange * 0.2, 5)); // 20% padding, max 5 lbs, min 2 lbs
                
                var minWeight = Math.min(...weights, targetWeight) - padding;
                var maxWeight = Math.max(...weights) + padding;
                var range = maxWeight - minWeight;
                
                // Calculate goal timeline and progressive target
                var startDate = dates[0];
                var currentDate = dates[dates.length - 1];
                var daysElapsed = Math.max(0, (currentDate - startDate) / (1000 * 60 * 60 * 24));
                var weeksElapsed = daysElapsed / 7;
                
                // Healthy weight loss rate based on amount to lose
                var weeklyTarget = totalWeightToLose > 50 ? 2.0 : totalWeightToLose > 20 ? 1.5 : 1.0;
                
                // Calculate goal date (when we should reach target weight)
                var weeksToGoal = Math.ceil(totalWeightToLose / weeklyTarget);
                var goalDate = new Date(startDate);
                goalDate.setDate(goalDate.getDate() + (weeksToGoal * 7));
                
                // If just started (less than 3 days), today's target is starting weight
                var todaysTarget;
                if (daysElapsed < 3) {
                    todaysTarget = startWeight;
                } else {
                    var expectedLoss = Math.min(weeksElapsed * weeklyTarget, totalWeightToLose);
                    todaysTarget = startWeight - expectedLoss;
                    todaysTarget = Math.max(todaysTarget, targetWeight);
                }
                
                // Draw grid lines with weight labels
                ctx.strokeStyle = '#1a1a2e';
                ctx.lineWidth = 1;
                ctx.fillStyle = '#888888';
                ctx.font = '12px Arial';
                ctx.textAlign = 'right';
                
                for (var i = 0; i <= 6; i++) {
                    var y = (i / 6) * 360 + 60;
                    var weight = maxWeight - (i / 6) * range;
                    
                    // Draw horizontal grid line
                    ctx.beginPath();
                    ctx.moveTo(80, y);
                    ctx.lineTo(920, y);
                    ctx.stroke();
                    
                    // Draw weight label on left side - use decimals for tight ranges
                    var precision = range < 10 ? 1 : 0; // Show decimal if range is less than 10 lbs
                    ctx.fillText(weight.toFixed(precision) + ' lbs', 75, y + 4);
                }
                
                // Draw date labels on bottom
                ctx.textAlign = 'center';
                var dateStep = Math.max(1, Math.floor(weightHistory.length / 8)); // Show max 8 date labels
                for (var i = 0; i < weightHistory.length; i += dateStep) {
                    var x = (i / (weightHistory.length - 1)) * 840 + 80;
                    var date = new Date(weightHistory[i].date);
                    var dateStr = (date.getMonth() + 1) + '/' + date.getDate();
                    
                    // Draw vertical tick mark
                    ctx.strokeStyle = '#888888';
                    ctx.beginPath();
                    ctx.moveTo(x, 420);
                    ctx.lineTo(x, 430);
                    ctx.stroke();
                    
                    // Draw date label
                    ctx.fillStyle = '#888888';
                    ctx.fillText(dateStr, x, 445);
                }
                
                // Add today's date if it's the last entry
                if (weightHistory.length > 0) {
                    var lastX = ((weightHistory.length - 1) / (weightHistory.length - 1)) * 840 + 80;
                    var today = new Date(weightHistory[weightHistory.length - 1].date);
                    var todayStr = (today.getMonth() + 1) + '/' + today.getDate();
                    
                    // Highlight today's date
                    ctx.fillStyle = '#FFD93D';
                    ctx.font = 'bold 12px Arial';
                    ctx.fillText('Today: ' + todayStr, lastX, 465);
                }
                
                // Reset stroke style for chart elements
                ctx.strokeStyle = '#1a1a2e';
                
                // Draw final goal line (dashed, less prominent)
                ctx.strokeStyle = '#FF6B6B';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 10]);
                var finalGoalY = 420 - ((targetWeight - minWeight) / range) * 360;
                ctx.beginPath();
                ctx.moveTo(80, finalGoalY);
                ctx.lineTo(920, finalGoalY);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Draw today's target line (solid, prominent) - only if not just starting
                if (daysElapsed >= 3) {
                    ctx.strokeStyle = '#FFD93D';
                    ctx.lineWidth = 4;
                    var todaysTargetY = 420 - ((todaysTarget - minWeight) / range) * 360;
                    ctx.beginPath();
                    ctx.moveTo(80, todaysTargetY);
                    ctx.lineTo(920, todaysTargetY);
                    ctx.stroke();
                }
                
                // Draw actual weight line with progress-based coloring
                var lineColor, pointColor;
                if (daysElapsed < 3) {
                    lineColor = '#FFD93D';  // Yellow for new users
                    pointColor = '#FFD93D';
                } else if (daysElapsed < 7) {
                    var weeklyProgress = (startWeight - currentWeight) / (daysElapsed / 7);
                    if (weeklyProgress >= weeklyTarget * 0.7) {
                        lineColor = '#7CFFB2';
                        pointColor = '#7CFFB2';
                    } else {
                        lineColor = '#FFD93D';
                        pointColor = '#FFD93D';
                    }
                } else {
                    var tolerance = weeklyTarget * 0.5;
                    if (currentWeight <= todaysTarget) {
                        lineColor = '#7CFFB2';
                        pointColor = '#7CFFB2';
                    } else if (currentWeight <= todaysTarget + tolerance) {
                        lineColor = '#FFD93D';
                        pointColor = '#FFD93D';
                    } else {
                        lineColor = '#FF6B6B';
                        pointColor = '#FF6B6B';
                    }
                }
                
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = 4;
                ctx.beginPath();
                
                weightHistory.forEach((entry, i) => {
                    var x = (i / (weightHistory.length - 1)) * 840 + 80;
                    var y = 420 - ((entry.weight - minWeight) / range) * 360;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                    
                    // Draw data points - larger for tight ranges
                    var pointSize = range < 15 ? 8 : 6; // Bigger points for tight ranges
                    ctx.fillStyle = pointColor;
                    ctx.beginPath();
                    ctx.arc(x, y, pointSize, 0, 2 * Math.PI);
                    ctx.fill();
                    
                    // Add weight labels for tight ranges or key points
                    if (range < 15 || i === 0 || i === weightHistory.length - 1) {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = '10px Arial';
                        ctx.textAlign = 'center';
                        var labelPrecision = range < 10 ? 1 : 0;
                        ctx.fillText(entry.weight.toFixed(labelPrecision), x, y - pointSize - 3);
                    }
                });
                ctx.stroke();
                
                // Calculate and draw trend line (require more data for stability)
                var minDataPoints = Math.max(3, Math.min(7, Math.floor(weightHistory.length * 0.4)));
                if (weightHistory.length >= minDataPoints) {
                    // Use larger dataset for more stable trend calculation
                    var trendData = weightHistory.slice(-Math.max(7, Math.floor(weightHistory.length * 0.7)));
                    var n = trendData.length;
                    var sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
                    
                    trendData.forEach((entry, i) => {
                        sumX += i;
                        sumY += entry.weight;
                        sumXY += i * entry.weight;
                        sumX2 += i * i;
                    });
                    
                    var slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
                    var intercept = (sumY - slope * sumX) / n;
                    
                    // Calculate R-squared to determine trend reliability
                    var meanY = sumY / n;
                    var ssRes = 0, ssTot = 0;
                    trendData.forEach((entry, i) => {
                        var predicted = slope * i + intercept;
                        ssRes += Math.pow(entry.weight - predicted, 2);
                        ssTot += Math.pow(entry.weight - meanY, 2);
                    });
                    var rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
                    
                    // Only show meaningful trends (R² > 0.3 and reasonable slope)
                    if (rSquared > 0.3 && Math.abs(slope) > 0.05) {
                        // Project trend line to goal
                        var daysFromStart = weightHistory.length - 1;
                        var projectedDaysToGoal = Math.round((targetWeight - (slope * daysFromStart + intercept)) / slope + daysFromStart);
                        var actualDaysToGoal = Math.ceil((targetWeight - startWeight) / (weeklyTarget / 7));
                        var daysDifference = projectedDaysToGoal - actualDaysToGoal;
                        
                        // Draw trend line projection
                        ctx.strokeStyle = '#9B59B6';
                        ctx.lineWidth = 3;
                        ctx.setLineDash([8, 4]);
                        ctx.beginPath();
                        
                        // Start from last actual data point
                        var lastX = ((weightHistory.length - 1) / Math.max(weightHistory.length - 1, 1)) * 840 + 80;
                        var lastY = 420 - ((weightHistory[weightHistory.length - 1].weight - minWeight) / range) * 360;
                        ctx.moveTo(lastX, lastY);
                        
                        // Project to target weight
                        if (slope < 0 && projectedDaysToGoal > 0 && projectedDaysToGoal < 365) {
                            var projectedX = Math.min(920, ((projectedDaysToGoal) / Math.max(weightHistory.length - 1, 1)) * 840 + 80);
                            var projectedY = 420 - ((targetWeight - minWeight) / range) * 360;
                            ctx.lineTo(projectedX, projectedY);
                        }
                        ctx.stroke();
                        ctx.setLineDash([]);
                        
                        // Add trend prediction text with confidence indicator
                        ctx.fillStyle = '#9B59B6';
                        ctx.font = '14px Arial';
                        var confidence = rSquared > 0.7 ? '' : '~';
                        
                        if (slope < -0.1) { // Losing weight meaningfully
                            if (daysDifference < -7) {
                                ctx.fillText('📈 Trend: Goal ' + confidence + Math.abs(daysDifference) + ' days EARLY! 🚀', 80, 440);
                            } else if (daysDifference > 14) {
                                ctx.fillText('📉 Trend: Goal ' + confidence + daysDifference + ' days late ⏰', 80, 440);
                            } else {
                                ctx.fillText('📊 Trend: Right on schedule! 🎯', 80, 440);
                            }
                        } else if (slope > 0.1) {
                            ctx.fillText('⚠️ Trend: Weight increasing - adjust plan! 💪', 80, 440);
                        } else {
                            ctx.fillText('📊 Trend: Weight stable - need consistency! 📈', 80, 440);
                        }
                    } else {
                        // Not enough reliable trend data yet
                        ctx.fillStyle = '#9B59B6';
                        ctx.font = '14px Arial';
                        ctx.fillText('📊 Building trend data... (need ' + (7 - weightHistory.length) + ' more days)', 80, 440);
                    }
                }
                
                // Add axis labels
                ctx.fillStyle = '#CCCCCC';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                
                // Y-axis label (Weight)
                ctx.save();
                ctx.translate(25, 240);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText('Weight (lbs)', 0, 0);
                ctx.restore();
                
                // X-axis label (Date)
                ctx.fillText('Date', 500, 475);
                
                // Labels and game status - better spaced layout
                ctx.textAlign = 'left';
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 20px Arial';
                ctx.fillText('Weight Progress Game', 80, 30);
                
                // Top row - current weight and targets
                ctx.fillStyle = currentWeight <= todaysTarget ? '#7CFFB2' : '#FF6B6B';
                ctx.font = '16px Arial';
                ctx.fillText('� Current: ' + currentWeight + ' lbs', 80, 55);
                
                ctx.fillStyle = '#FFD93D';
                ctx.font = '16px Arial';
                ctx.fillText('📅 Today\'s Target: ' + todaysTarget.toFixed(1) + ' lbs', 350, 55);
                
                ctx.fillStyle = '#FF6B6B';
                ctx.font = '14px Arial';
                ctx.fillText('🏁 Final Goal: ' + targetWeight + ' lbs', 650, 55);
                
                // Game status based on today's target and progress
                var status, statusColor;
                if (daysElapsed < 3) {
                    // For new users, encourage tracking
                    status = '📝 TRACKING STARTED!';
                    statusColor = '#FFD93D';
                } else if (daysElapsed < 7) {
                    // First week, be encouraging but realistic
                    var weeklyProgress = (startWeight - currentWeight) / (daysElapsed / 7);
                    if (weeklyProgress >= weeklyTarget * 0.7) {
                        status = '� GREAT START!';
                        statusColor = '#7CFFB2';
                    } else if (weeklyProgress >= weeklyTarget * 0.3) {
                        status = '📈 KEEP GOING!';
                        statusColor = '#FFD93D';
                    } else {
                        status = '🔥 NEED MORE!';
                        statusColor = '#FF6B6B';
                    }
                } else {
                    // After first week, use stricter target-based system
                    var tolerance = weeklyTarget * 0.5; // Allow 0.5-1 lb tolerance
                    if (currentWeight <= todaysTarget) {
                        status = '🎉 ON TRACK!';
                        statusColor = '#7CFFB2';
                    } else if (currentWeight <= todaysTarget + tolerance) {
                        status = '⚡ CLOSE - PUSH!';
                        statusColor = '#FFD93D';
                    } else {
                        status = '🔥 NEED TO PUSH!';
                        statusColor = '#FF6B6B';
                    }
                }
                
                ctx.fillStyle = statusColor;
                ctx.font = 'bold 20px Arial';
                ctx.fillText(status, 400, 30);
                
                // Progress info - bottom status bar
                var lost = startWeight - currentWeight;
                var onTrackLoss = startWeight - todaysTarget;
                var remaining = currentWeight - targetWeight;
                
                // First line of bottom info
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '14px Arial';
                ctx.fillText('Lost: ' + lost.toFixed(1) + ' lbs', 500, 440);
                
                if (daysElapsed >= 3) {
                    ctx.fillText('Should have lost: ' + onTrackLoss.toFixed(1) + ' lbs', 650, 440);
                } else {
                    ctx.fillText('Keep tracking daily!', 650, 440);
                }
                
                // Second line of bottom info
                if (remaining > 0) {
                    var weeksToGoal = Math.ceil(remaining / weeklyTarget);
                    ctx.fillText('Est. ' + weeksToGoal + ' weeks to goal', 500, 460);
                } else {
                    ctx.fillText('🎯 Goal achieved!', 500, 460);
                }
                
                // Rate indicator
                var rateText;
                if (daysElapsed < 3) {
                    rateText = 'Just getting started! 🌱';
                } else {
                    rateText = currentWeight <= todaysTarget ? 
                        'Perfect pace! 💪' : 
                        (lost > onTrackLoss * 0.5 ? 'Good progress 👍' : 'Need acceleration ⚡');
                }
                ctx.fillStyle = '#7CFFB2';
                ctx.font = '14px Arial';
                ctx.fillText(rateText, 650, 460);
                
            }, 100);
            
            return canvas;
        }

        async function createStrengthChart() {
            try {
                // Check if there are any actual workouts logged
                var workouts = await window.db.find('workouts', {});
                if (!workouts || workouts.length === 0) {
                    return el('div', { class: 'chart-placeholder' }, [
                        el('div', { class: 'placeholder-icon' }, ['💪']),
                        el('div', { class: 'placeholder-text' }, ['No workouts logged yet!']),
                        el('div', { class: 'placeholder-subtext' }, ['Complete some workouts to see your strength progress here'])
                    ]);
                }

                var exercises = [
                    { name: 'Bench-Supported Dumbbell Press', id: 'Bench-Supported Dumbbell Press', target: USER_CONFIG.strengthTargetsByWeek['Bench-Supported Dumbbell Press'] },
                    { name: 'Seated Dumbbell Row', id: 'Seated Dumbbell Row', target: USER_CONFIG.strengthTargetsByWeek['Seated Dumbbell Row'] },
                    { name: 'Seated Dumbbell Shoulder Press', id: 'Seated Dumbbell Shoulder Press', target: USER_CONFIG.strengthTargetsByWeek['Seated Dumbbell Shoulder Press'] }
                ];
                
                var loads = await Promise.all(exercises.map(ex => window.db.findOne('loads', { exerciseId: ex.id })));
                
                // Check if any loads have been actually updated from workouts (not just defaults)
                // We'll consider any load data as "real" since we have workout history
                var hasRealData = loads.some(load => load && load.currentWeight);
                if (!hasRealData) {
                    return el('div', { class: 'chart-placeholder' }, [
                        el('div', { class: 'placeholder-icon' }, ['🏋️']),
                        el('div', { class: 'placeholder-text' }, ['No strength data yet!']),
                        el('div', { class: 'placeholder-subtext' }, ['Complete workouts with dumbbells to track strength gains'])
                    ]);
                }
                
                var canvas = el('canvas', { 
                    width: 600, 
                    height: 350, 
                    style: 'background: #0a0a1a; border-radius: 8px; border: 2px solid #1a1a2e;' 
                });
                
                setTimeout(() => {
                    var ctx = canvas.getContext('2d');
                    var colors = ['#7CFFB2', '#6BCF7F', '#5A9F6B'];
                    
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText('Strength Progress Game', 20, 25);
                    
                    exercises.forEach((exercise, i) => {
                        var load = loads[i];
                        if (!load || !load.currentWeight) return; // Skip if no load data
                        
                        var currentWeight = load.currentWeight;
                        var targetWeek = Math.min(weeksSinceStart, exercise.target.length - 1);
                        var targetWeight = exercise.target[targetWeek];
                        
                        var y = 60 + i * 80;
                        
                        // Exercise name
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = '14px Arial';
                        var shortName = exercise.name.replace('Bench-Supported ', '').replace('Seated ', '');
                        ctx.fillText(shortName, 20, y);
                        
                        // Target bar (what you should be lifting)
                        ctx.fillStyle = '#FF6B6B';
                        var targetBarWidth = (targetWeight / 40) * 300;
                        ctx.fillRect(20, y + 10, targetBarWidth, 15);
                        
                        // Actual bar (what you're actually lifting)
                        ctx.fillStyle = currentWeight >= targetWeight ? '#7CFFB2' : '#FFD93D';
                        var actualBarWidth = (currentWeight / 40) * 300;
                        ctx.fillRect(20, y + 30, actualBarWidth, 15);
                        
                        // Labels
                        ctx.fillStyle = '#FF6B6B';
                        ctx.font = '12px Arial';
                        ctx.fillText('Target: ' + targetWeight + ' lb', 330, y + 22);
                        
                        ctx.fillStyle = currentWeight >= targetWeight ? '#7CFFB2' : '#FFD93D';
                        ctx.fillText('Actual: ' + currentWeight + ' lb', 330, y + 42);
                        
                        // Game status
                        var status = currentWeight >= targetWeight ? '🎯' : '📈';
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = '16px Arial';
                        ctx.fillText(status, 480, y + 35);
                        
                        // Progress percentage
                        var progress = ((currentWeight / targetWeight) * 100).toFixed(0);
                        ctx.fillStyle = currentWeight >= targetWeight ? '#7CFFB2' : '#FFD93D';
                        ctx.font = '12px Arial';
                        ctx.fillText(progress + '%', 500, y + 35);
                    });
                    
                    // Overall game score - only count exercises with load data
                    var exercisesWithData = loads.filter(load => load && load.currentWeight);
                    var onTargetCount = exercisesWithData.filter((load, i) => {
                        var currentWeight = load.currentWeight;
                        var targetWeek = Math.min(weeksSinceStart, exercises[i].target.length - 1);
                        var targetWeight = exercises[i].target[targetWeek];
                        return currentWeight >= targetWeight;
                    }).length;
                    
                    if (exercisesWithData.length > 0) {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = 'bold 16px Arial';
                        ctx.fillText('Score: ' + onTargetCount + '/' + exercisesWithData.length + ' exercises on target', 20, 320);
                    }
                    
                }, 100);
                
                return canvas;
            } catch (e) {
                return el('div', { class: 'chart-placeholder' }, [
                    el('div', { class: 'placeholder-text' }, ['Error loading strength data'])
                ]);
            }
        }

        async function createPushUpChart() {
            try {
                // Check if there are any actual workouts logged
                var workouts = await window.db.find('workouts', {});
                if (!workouts || workouts.length === 0) {
                    return el('div', { class: 'chart-placeholder' }, [
                        el('div', { class: 'placeholder-icon' }, ['🏋️']),
                        el('div', { class: 'placeholder-text' }, ['No workouts logged yet!']),
                        el('div', { class: 'placeholder-subtext' }, ['Complete workouts with push-ups and planks to see progress'])
                    ]);
                }

                var pushUpProg = await getProgressionFor('Push-Up');
                var plankProg = await getProgressionFor('Plank');
                
                // Check if progression data exists (we have workouts, so show current state)
                var hasRealPushUpData = pushUpProg;
                var hasRealPlankData = plankProg;
                
                if (!hasRealPushUpData && !hasRealPlankData) {
                    return el('div', { class: 'chart-placeholder' }, [
                        el('div', { class: 'placeholder-icon' }, ['💪']),
                        el('div', { class: 'placeholder-text' }, ['No bodyweight exercise progress yet!']),
                        el('div', { class: 'placeholder-subtext' }, ['Complete workouts with push-ups and planks to track your progress'])
                    ]);
                }
                
                var canvas = el('canvas', { 
                    width: 600, 
                    height: 250, 
                    style: 'background: #0a0a1a; border-radius: 8px; border: 2px solid #1a1a2e;' 
                });
                
                setTimeout(() => {
                    var ctx = canvas.getContext('2d');
                    
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText('Bodyweight Exercise Game', 20, 25);
                    
                    if (hasRealPushUpData) {
                        // Push-up progress
                        var pushUpLevel = pushUpProg.currentLevel || 'wall';
                        var pushUpLevels = ['wall', 'knee', 'full'];
                        var pushUpNames = { wall: 'Wall Push-Ups', knee: 'Knee Push-Ups', full: 'Full Push-Ups' };
                        var levelIndex = pushUpLevels.indexOf(pushUpLevel);
                        var targetLevel = Math.min(Math.floor(weeksSinceStart / 4), pushUpLevels.length - 1);
                        
                        // Push-up level bars
                        pushUpLevels.forEach((level, i) => {
                            var y = 50 + i * 25;
                            var isTarget = i <= targetLevel;
                            var isAchieved = i <= levelIndex;
                            
                            ctx.fillStyle = isTarget ? '#FF6B6B' : '#2a2a3e';
                            ctx.fillRect(150, y, 200, 15);
                            
                            if (isAchieved) {
                                ctx.fillStyle = isAchieved && isTarget ? '#7CFFB2' : '#FFD93D';
                                ctx.fillRect(150, y, 200, 15);
                            }
                            
                            ctx.fillStyle = '#FFFFFF';
                            ctx.font = '12px Arial';
                            ctx.fillText(pushUpNames[level], 20, y + 12);
                            
                            var status = isAchieved ? (isTarget ? '🎯' : '🎉') : (isTarget ? '📈' : '⏳');
                            ctx.fillText(status, 360, y + 12);
                        });
                        
                        // Current push-up reps info
                        var currentReps = pushUpProg.targetReps || 5;
                        var successes = pushUpProg.consecutiveSuccesses || 0;
                        
                        // Get advancement target based on current level
                        var advancementTargets = { wall: 50, knee: 32, full: 24 };
                        var advancementTarget = advancementTargets[pushUpLevel] || 50;
                        
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = '14px Arial';
                        ctx.fillText('Current: 2×' + currentReps + ' ' + pushUpNames[pushUpLevel], 20, 150);
                        ctx.fillText('Target for advancement: ' + advancementTarget + ' total reps (2×' + (advancementTarget/2) + ')', 20, 170);
                        ctx.fillText('Success streak: ' + successes + '/3', 20, 190);
                        
                        // Success indicators
                        for (var i = 0; i < 3; i++) {
                            ctx.fillStyle = i < successes ? '#7CFFB2' : '#2a2a3e';
                            ctx.fillRect(200 + i * 30, 175, 25, 15);
                        }
                    } else {
                        ctx.fillStyle = '#7CFFB2';
                        ctx.font = '14px Arial';
                        ctx.fillText('No push-up progress data yet - complete some workouts!', 20, 120);
                    }
                    
                    if (hasRealPlankData) {
                        // Plank progress - show actual best performance, not just target
                        var currentTargetTime = plankProg.targetTime || 30;
                        var weeklyTargetTime = Math.min(30 + (weeksSinceStart * 5), 90);
                        
                        // Get best actual plank time from workouts (already fetched above)
                        var bestActualTime = currentTargetTime; // Default to target time
                        if (workouts && workouts.length > 0) {
                            var allPlankTimes = [];
                            workouts.forEach(workout => {
                                if (workout.exercises) {
                                    workout.exercises.forEach(ex => {
                                        if (ex.exerciseId === 'Plank' && ex.completedSets) {
                                            ex.completedSets.forEach(set => {
                                                if (set.timeSeconds) {
                                                    allPlankTimes.push(set.timeSeconds);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                            if (allPlankTimes.length > 0) {
                                bestActualTime = Math.max(...allPlankTimes);
                            }
                        }
                        
                        var plankTime = bestActualTime;
                        var targetTime = weeklyTargetTime;
                        
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = '14px Arial';
                        ctx.fillText('Plank Hold:', 20, 220);
                        
                        // Plank progress bar
                        ctx.fillStyle = '#FF6B6B'; // Target
                        ctx.fillRect(120, 205, (targetTime / 90) * 300, 10);
                        
                        ctx.fillStyle = plankTime >= targetTime ? '#7CFFB2' : '#FFD93D'; // Actual
                        ctx.fillRect(120, 220, (plankTime / 90) * 300, 15);
                        
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = '12px Arial';
                        ctx.fillText('Target: ' + targetTime + 's', 430, 215);
                        ctx.fillText('Actual: ' + plankTime + 's', 430, 232);
                        
                        var plankStatus = plankTime >= targetTime ? '🎯' : '📈';
                        ctx.font = '16px Arial';
                        ctx.fillText(plankStatus, 550, 225);
                    } else {
                        ctx.fillStyle = '#7CFFB2';
                        ctx.font = '14px Arial';
                        ctx.fillText('No plank progress data yet - complete some workouts!', 20, 220);
                    }
                    
                }, 100);
                
                return canvas;
            } catch (e) {
                return el('div', { class: 'chart-placeholder' }, [
                    el('div', { class: 'placeholder-text' }, ['Error loading bodyweight exercise data'])
                ]);
            }
        }

        // Create the charts
        var weightHistory = user.bodyweightHistory || [];  
        var targetWeight = user.targetWeight || (user.currentWeight ? user.currentWeight * 0.85 : 165); // Default to 15% weight loss if no target set

        // Calculate overall game score based on actual logged data only
        async function calculateGameScore() {
            try {
                var score = 0;
                var maxScore = 0;
                
                // Check if there are any workouts at all
                var workouts = await window.db.find('workouts', {});
                if (!workouts || workouts.length === 0) {
                    return { score: 0, maxScore: 0, percentage: 0, message: 'Complete your first workout to start scoring!' };
                }
                
                // Weight game (25 points) - reward progress toward goal
                if (weightHistory.length > 0) {
                    maxScore += 25;
                    var startWeight = user.startingWeight || weightHistory[0].weight;
                    var currentWeight = weightHistory[weightHistory.length - 1].weight;
                    var totalWeightToLose = startWeight - targetWeight;
                    var weightLost = startWeight - currentWeight;
                    
                    if (totalWeightToLose > 0) {
                        var progressPercent = Math.max(0, Math.min(1, weightLost / totalWeightToLose));
                        
                        // Award points based on progress toward goal
                        if (progressPercent >= 1.0) score += 25; // Goal achieved or exceeded
                        else if (progressPercent >= 0.8) score += 20; // 80%+ progress
                        else if (progressPercent >= 0.6) score += 15; // 60%+ progress  
                        else if (progressPercent >= 0.4) score += 10; // 40%+ progress
                        else if (progressPercent >= 0.2) score += 5;  // 20%+ progress
                        // 0 points if less than 20% progress
                    } else {
                        score += 25; // Already at or below target
                    }
                }
                
                // Strength game - adjusted targets based on actual starting weights
                var exercises = [
                    { name: 'Bench-Supported Dumbbell Press', target: [10, 12.5, 15, 17.5, 20] },
                    { name: 'Seated Dumbbell Row', target: [10, 12.5, 15, 17.5, 20] },
                    { name: 'Seated Dumbbell Shoulder Press', target: [5, 7.5, 10, 12.5, 15] }
                ];
                
                for (let ex of exercises) {
                    var load = await window.db.findOne('loads', { exerciseId: ex.name });
                    // Only count if there's load data (we have workouts, so show current state)
                    if (load && load.currentWeight) {
                        maxScore += 15;
                        var currentWeight = load.currentWeight;
                        var targetWeek = Math.min(weeksSinceStart, ex.target.length - 1);
                        var targetWeight = ex.target[targetWeek];
                        if (currentWeight >= targetWeight) score += 15;
                        else if (currentWeight >= targetWeight * 0.8) score += 10;
                        else if (currentWeight >= targetWeight * 0.6) score += 5;
                    }
                }
                
                // Bodyweight game - award points for meeting current targets
                var pushUpProg = await getProgressionFor('Push-Up');
                var plankProg = await getProgressionFor('Plank');
                
                // Push-ups - check performance against current target level
                if (pushUpProg) {
                    maxScore += 15;
                    var pushUpLevel = pushUpProg.currentLevel || 'wall';
                    var targetReps = pushUpProg.targetReps || 5;
                    var levels = ['wall', 'knee', 'full'];
                    var targetLevel = Math.min(Math.floor(weeksSinceStart / 4), levels.length - 1);
                    var currentIndex = levels.indexOf(pushUpLevel);
                    
                    // Award points based on current performance vs expectations
                    if (currentIndex > targetLevel) score += 18; // Bonus for exceeding level
                    else if (currentIndex >= targetLevel) score += 15; // Full points for meeting level
                    else if (currentIndex >= targetLevel - 1) score += 10; // Partial for close
                    else score += 5; // Participation points
                }
                
                // Plank - check performance against current target time
                if (plankProg) {
                    maxScore += 15;
                    var plankTime = plankProg.targetTime || 30;
                    var targetTime = Math.min(30 + (weeksSinceStart * 5), 90);
                    
                    // Award points based on current performance vs target
                    if (plankTime > targetTime * 1.2) score += 18; // Bonus for 20% over target
                    else if (plankTime >= targetTime) score += 15; // Full points for meeting target
                    else if (plankTime >= targetTime * 0.8) score += 10; // Partial for 80%+
                    else if (plankTime >= targetTime * 0.6) score += 5; // Basic for 60%+
                    // 0 points if below 60% of target
                }
                
                // Nutrition game - check recent nutrition adherence
                try {
                    var dailyTargets = calculateDailyTargets(user);
                    var recentNutrition = await getDailyNutrition();
                    
                    if (recentNutrition.totals.calories > 0) { // Only score if they've logged food
                        maxScore += 20; // 20 points for nutrition
                        
                        var calorieAdherence = recentNutrition.totals.calories <= dailyTargets.calories;
                        var proteinGoalMet = recentNutrition.totals.protein >= dailyTargets.protein;
                        
                        // Calorie adherence (10 points)
                        if (calorieAdherence) {
                            score += 10;
                        } else if (recentNutrition.totals.calories <= dailyTargets.calories * 1.1) {
                            score += 7; // Within 10% of target
                        } else if (recentNutrition.totals.calories <= dailyTargets.calories * 1.2) {
                            score += 4; // Within 20% of target
                        }
                        
                        // Protein goal (10 points)
                        if (proteinGoalMet) {
                            score += 10;
                        } else if (recentNutrition.totals.protein >= dailyTargets.protein * 0.8) {
                            score += 7; // 80%+ of protein goal
                        } else if (recentNutrition.totals.protein >= dailyTargets.protein * 0.6) {
                            score += 4; // 60%+ of protein goal
                        }
                    }
                } catch (e) {
                    // Nutrition scoring failed, continue without error
                }
                
                if (maxScore === 0) {
                    return { score: 0, maxScore: 0, percentage: 0, message: 'Complete more workouts to start tracking progress!' };
                }
                
                return { score: score, maxScore: maxScore, percentage: Math.round((score / maxScore) * 100) };
            } catch (e) {
                return { score: 0, maxScore: 0, percentage: 0, message: 'Error calculating score' };
            }
        }
        
        var gameScore = await calculateGameScore();
        


        // Enhanced Fitness Score Breakdown
        async function getDetailedScoreBreakdown(gameScore) {
            const breakdown = {
                categories: [
                    { name: 'Weight Loss', current: 0, max: 0, icon: '⚖️', description: 'Progress toward weight goal' },
                    { name: 'Strength Training', current: 0, max: 0, icon: '💪', description: 'Dumbbell exercise progression' },
                    { name: 'Bodyweight', current: 0, max: 0, icon: '🏃', description: 'Push-ups and plank progress' },
                    { name: 'Nutrition', current: 0, max: 0, icon: '🍽️', description: 'Calorie and protein goals' }
                ],
                totalScore: gameScore.score,
                maxScore: gameScore.maxScore,
                percentage: gameScore.percentage
            };

            try {
                // Weight Loss Score (25 points max)
                if (weightHistory.length > 0) {
                    breakdown.categories[0].max = 25;
                    const startWeight = user.startingWeight || weightHistory[0].weight;
                    const currentWeight = weightHistory[weightHistory.length - 1].weight;
                    const totalWeightToLose = startWeight - targetWeight;
                    const weightLost = startWeight - currentWeight;
                    
                    if (totalWeightToLose > 0) {
                        const progressPercent = Math.max(0, Math.min(1, weightLost / totalWeightToLose));
                        
                        if (progressPercent >= 1.0) breakdown.categories[0].current = 25;
                        else if (progressPercent >= 0.8) breakdown.categories[0].current = 20;
                        else if (progressPercent >= 0.6) breakdown.categories[0].current = 15;
                        else if (progressPercent >= 0.4) breakdown.categories[0].current = 10;
                        else if (progressPercent >= 0.2) breakdown.categories[0].current = 5;
                    } else {
                        breakdown.categories[0].current = 25; // Already at target
                    }
                }

                // Strength Training Score (15 points per exercise with data)
                const exercises = [
                    { name: 'Bench-Supported Dumbbell Press', target: [10, 12.5, 15, 17.5, 20] },
                    { name: 'Seated Dumbbell Row', target: [10, 12.5, 15, 17.5, 20] },
                    { name: 'Seated Dumbbell Shoulder Press', target: [5, 7.5, 10, 12.5, 15] }
                ];

                let strengthScore = 0;
                let strengthMaxScore = 0;
                for (const ex of exercises) {
                    const load = await window.db.findOne('loads', { exerciseId: ex.name });
                    if (load && load.currentWeight) {
                        strengthMaxScore += 15;
                        const currentWeight = load.currentWeight;
                        const targetWeek = Math.min(weeksSinceStart, ex.target.length - 1);
                        const targetWeight = ex.target[targetWeek];
                        
                        if (currentWeight >= targetWeight) strengthScore += 15;
                        else if (currentWeight >= targetWeight * 0.8) strengthScore += 10;
                        else if (currentWeight >= targetWeight * 0.6) strengthScore += 5;
                    }
                }
                breakdown.categories[1].current = strengthScore;
                breakdown.categories[1].max = strengthMaxScore;

                // Bodyweight Score (15 points each for push-ups and plank if data exists)
                let bodyweightScore = 0;
                let bodyweightMaxScore = 0;
                
                // Push-ups (15 points)
                const pushUpProg = await getProgressionFor('Push-Up');
                if (pushUpProg) {
                    bodyweightMaxScore += 15;
                    const pushUpLevel = pushUpProg.currentLevel || 'wall';
                    const levels = ['wall', 'knee', 'full'];
                    const targetLevel = Math.min(Math.floor(weeksSinceStart / 4), levels.length - 1);
                    const currentIndex = levels.indexOf(pushUpLevel);
                    
                    if (currentIndex > targetLevel) bodyweightScore += 15; // Cap at 15
                    else if (currentIndex >= targetLevel) bodyweightScore += 15;
                    else if (currentIndex >= targetLevel - 1) bodyweightScore += 10;
                    else bodyweightScore += 5;
                }

                // Plank (15 points)
                const plankProg = await getProgressionFor('Plank');
                if (plankProg) {
                    bodyweightMaxScore += 15;
                    const plankTime = plankProg.targetTime || 30;
                    const targetTime = Math.min(30 + (weeksSinceStart * 5), 90);
                    
                    if (plankTime > targetTime * 1.2) bodyweightScore += 15;
                    else if (plankTime >= targetTime) bodyweightScore += 15;
                    else if (plankTime >= targetTime * 0.8) bodyweightScore += 10;
                    else if (plankTime >= targetTime * 0.6) bodyweightScore += 5;
                }
                
                breakdown.categories[2].current = bodyweightScore;
                breakdown.categories[2].max = bodyweightMaxScore;

                // Nutrition Score (20 points max if data exists)
                try {
                    const dailyTargets = calculateDailyTargets(user);
                    const recentNutrition = await getDailyNutrition();
                    
                    if (recentNutrition.totals.calories > 0) {
                        breakdown.categories[3].max = 20;
                        let nutritionScore = 0;
                        
                        const calorieAdherence = recentNutrition.totals.calories <= dailyTargets.calories;
                        const proteinGoalMet = recentNutrition.totals.protein >= dailyTargets.protein;
                        
                        // Calorie adherence (10 points)
                        if (calorieAdherence) {
                            nutritionScore += 10;
                        } else if (recentNutrition.totals.calories <= dailyTargets.calories * 1.1) {
                            nutritionScore += 7;
                        } else if (recentNutrition.totals.calories <= dailyTargets.calories * 1.2) {
                            nutritionScore += 4;
                        }
                        
                        // Protein goal (10 points)
                        if (proteinGoalMet) {
                            nutritionScore += 10;
                        } else if (recentNutrition.totals.protein >= dailyTargets.protein * 0.8) {
                            nutritionScore += 7;
                        } else if (recentNutrition.totals.protein >= dailyTargets.protein * 0.6) {
                            nutritionScore += 4;
                        }
                        
                        breakdown.categories[3].current = nutritionScore;
                    }
                } catch (nutritionError) {
                    console.log('Nutrition scoring error:', nutritionError);
                }

            } catch (error) {
                console.error('Error calculating detailed breakdown:', error);
            }

            return breakdown;
        }

        var scoreBreakdown = await getDetailedScoreBreakdown(gameScore);
        
        var weightChart = createWeightChart(weightHistory, targetWeight);
        var strengthChart = await createStrengthChart();
        var pushUpChart = await createPushUpChart();

        // Layout
        var content = el('div', { class: 'charts-container' }, [
            // Enhanced Game Score Header with Breakdown
            el('div', { class: 'game-score-header' }, [
                el('div', { class: 'score-display' }, [
                    el('div', { class: 'score-title' }, ['🎮 Your Fitness Game Score']),
                    gameScore.maxScore > 0 ? 
                        el('div', { class: 'score-value' }, [gameScore.score + ' / ' + gameScore.maxScore + ' points']) :
                        el('div', { class: 'score-value' }, ['No data yet']),
                    gameScore.maxScore > 0 ?
                        el('div', { class: 'score-percentage' }, [gameScore.percentage + '%']) :
                        el('div', { class: 'score-percentage' }, ['--']),
                    el('div', { class: 'score-bar' }, [
                        el('div', { 
                            class: 'score-fill',
                            style: 'width: ' + gameScore.percentage + '%; background: ' + 
                                   (gameScore.percentage >= 80 ? '#7CFFB2' : 
                                    gameScore.percentage >= 60 ? '#FFD93D' : '#FF6B6B')
                        }, [])
                    ]),
                    el('div', { class: 'score-message' }, [
                        gameScore.message || 
                        (gameScore.percentage >= 90 ? '🏆 Fitness Champion!' :
                         gameScore.percentage >= 80 ? '🎯 Excellent Progress!' :
                         gameScore.percentage >= 60 ? '💪 Good Work!' :
                         gameScore.percentage >= 40 ? '📈 Keep Going!' :
                         '🎮 Game Just Started!')
                    ])
                ])
            ]),
            // Weight Loss Game
            el('div', { class: 'chart-section' }, [
                el('h3', { class: 'chart-title' }, ['🎯 Weight Loss Game']),
                el('div', { class: 'chart-description' }, ['Keep your weight line below the red target line!']),
                weightChart
            ]),
            
            // Strength Game  
            el('div', { class: 'chart-section' }, [
                el('h3', { class: 'chart-title' }, ['💪 Strength Game']),
                el('div', { class: 'chart-description' }, ['Beat your weekly strength targets!']),
                strengthChart
            ]),
            
            // Bodyweight Exercise Game
            el('div', { class: 'chart-section' }, [
                el('h3', { class: 'chart-title' }, ['🏋️ Bodyweight Exercise Game']),
                el('div', { class: 'chart-description' }, ['Progress through exercise levels and hit your plank targets!']),
                pushUpChart
            ]),

            // Enhanced Score Breakdown
            gameScore.maxScore > 0 ? el('div', { class: 'chart-section' }, [
                el('h3', { class: 'chart-title' }, ['📊 Detailed Score Breakdown']),
                el('div', { class: 'chart-description' }, ['See exactly how you\'re scoring in each fitness category']),
                el('div', { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;' }, [
                    ...scoreBreakdown.categories.map(category => 
                        el('div', { 
                            style: 'background: #16213e; padding: 15px; border-radius: 8px; border-left: 4px solid #7CFFB2;'
                        }, [
                            el('div', { style: 'display: flex; align-items: center; margin-bottom: 10px;' }, [
                                el('span', { style: 'font-size: 20px; margin-right: 8px;' }, [category.icon]),
                                el('span', { style: 'font-weight: bold;' }, [category.name])
                            ]),
                            el('div', { style: 'margin-bottom: 8px;' }, [
                                el('span', { style: 'font-size: 18px; font-weight: bold;' }, [category.current + ' / ' + category.max]),
                                el('span', { style: 'margin-left: 8px; color: #888;' }, ['points'])
                            ]),
                            el('div', { 
                                style: 'background: #2a2a3e; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 8px;'
                            }, [
                                el('div', { 
                                    style: 'width: ' + Math.round((category.current / category.max) * 100) + '%; height: 100%; background: #7CFFB2; transition: width 0.3s;'
                                }, [])
                            ]),
                            el('div', { class: 'note' }, [category.description])
                        ])
                    )
                ])
            ]) : null,


        ]);

        root.appendChild(el('div', { class: 'brand' }, [
            el('div', { class: 'dot' }, []), 
            el('h2', {}, ['Progress Charts']), 
            el('span', { class: 'sub' }, ['Visual progress tracking - beat your targets!'])
        ]));
        
        root.appendChild(content);

        // Development: Add performance monitor
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            try {
                const { Performance } = await import('../utils/performance.js');
                const perfStats = Performance.getStats();
                
                var perfCard = el('div', { class: 'card', style: 'margin-top: 20px; border-left: 4px solid #FFD93D;' }, [
                    el('h3', {}, ['🚀 Performance Monitor']),
                    el('div', { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 15px 0;' }, [
                        el('div', { style: 'background: #16213e; padding: 10px; border-radius: 6px; text-align: center;' }, [
                            el('div', { style: 'font-size: 18px; font-weight: bold; color: #7CFFB2;' }, [perfStats.renderCount]),
                            el('div', { class: 'note' }, ['Total Renders'])
                        ]),
                        el('div', { style: 'background: #16213e; padding: 10px; border-radius: 6px; text-align: center;' }, [
                            el('div', { style: 'font-size: 18px; font-weight: bold; color: #FFD93D;' }, [perfStats.avgRenderTime.toFixed(1) + 'ms']),
                            el('div', { class: 'note' }, ['Avg Render Time'])
                        ]),
                        el('div', { style: 'background: #16213e; padding: 10px; border-radius: 6px; text-align: center;' }, [
                            el('div', { style: 'font-size: 18px; font-weight: bold; color: #FFB84D;' }, [Math.round(perfStats.uptime / 1000) + 's']),
                            el('div', { class: 'note' }, ['App Uptime'])
                        ]),
                        perfStats.memoryUsage ? el('div', { style: 'background: #16213e; padding: 10px; border-radius: 6px; text-align: center;' }, [
                            el('div', { style: 'font-size: 18px; font-weight: bold; color: #FF6B6B;' }, [perfStats.memoryUsage.used + 'MB']),
                            el('div', { class: 'note' }, ['Memory Used'])
                        ]) : null
                    ]),
                    el('div', { class: 'note', style: 'text-align: center;' }, [
                        'Development mode - Performance monitoring active'
                    ])
                ]);
                
                root.appendChild(perfCard);
            } catch (e) {
                // Performance monitoring not available
            }
        }

        // Add refresh button for real-time updates
        var refreshBtn = el('button', { 
            class: 'btn',
            style: 'position: fixed; top: 20px; right: 20px; z-index: 1000; background: #7CFFB2; color: #0a0a1a;',
            onclick: function() {
                self.render(); // Re-render the entire app to refresh charts
            }
        }, ['🔄 Refresh Charts']);
        
        root.appendChild(refreshBtn);
    })();

    return root;
}