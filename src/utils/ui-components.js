// Common UI components and styling utilities
import { el } from './dom.js';

// Common color scheme
export const COLORS = {
    primary: '#7CFFB2',
    secondary: '#FFD93D',
    accent: '#FFB84D',
    warning: '#FF6B6B',
    background: {
        card: '#16213e',
        dark: '#0e1a2d',
        main: '#0a0a1a'
    }
};

// Common card component
export function createCard(title, subtitle = null, content = []) {
    return el('div', { class: 'card', style: 'margin: 15px 0;' }, [
        el('h3', {}, [title]),
        subtitle ? el('div', { class: 'note' }, [subtitle]) : null,
        el('div', { class: 'hr' }, []),
        ...content
    ]);
}

// Stats grid component
export function createStatsGrid(stats, columns = 'auto-fit') {
    const minWidth = columns === 'auto-fit' ? '150px' : '200px';
    return el('div', { 
        style: `display: grid; grid-template-columns: repeat(${columns}, minmax(${minWidth}, 1fr)); gap: 15px; margin: 20px 0;` 
    }, 
        stats.map(stat => createStatCard(stat))
    );
}

// Individual stat card
export function createStatCard({ value, label, color = COLORS.primary, icon = null }) {
    return el('div', { 
        style: `background: ${COLORS.background.card}; padding: 15px; border-radius: 8px; text-align: center;` 
    }, [
        icon ? el('div', { style: 'font-size: 20px; margin-bottom: 5px;' }, [icon]) : null,
        el('div', { style: `font-size: 24px; font-weight: bold; color: ${color};` }, [value]),
        el('div', { class: 'note' }, [label])
    ]);
}

// Progress bar component
export function createProgressBar(current, max, color = COLORS.primary, height = '6px') {
    const percentage = Math.min((current / max) * 100, 100);
    return el('div', { 
        style: `height: ${height}; background: #2a4f86; border-radius: 3px; overflow: hidden; margin: 5px 0;`
    }, [
        el('div', { 
            style: `height: 100%; width: ${percentage}%; background: ${color}; transition: width 0.3s;`
        }, [])
    ]);
}

// Streak card component
export function createStreakCard({ title, icon, streak, description, isActive = true }) {
    const color = isActive ? COLORS.primary : COLORS.warning;
    return el('div', { 
        style: `background: ${COLORS.background.card}; padding: 15px; border-radius: 8px; border-left: 4px solid ${color};` 
    }, [
        el('div', { style: 'display: flex; align-items: center; margin-bottom: 8px;' }, [
            el('span', { style: 'font-size: 20px; margin-right: 8px;' }, [icon]),
            el('span', { style: 'font-weight: bold;' }, [title])
        ]),
        el('div', { style: `font-size: 24px; font-weight: bold; color: ${color};` }, [
            streak + ' days'
        ]),
        el('div', { class: 'note' }, [description])
    ]);
}

// Weekly breakdown grid
export function createWeeklyGrid(weeks, targetValue, getWeekValue) {
    return el('div', { style: 'display: flex; gap: 10px;' }, 
        weeks.map(week => {
            const value = getWeekValue(week);
            const percentage = (value / targetValue) * 100;
            const color = percentage >= 100 ? COLORS.primary : 
                         percentage >= 75 ? COLORS.secondary : COLORS.warning;
            
            return el('div', { 
                style: `flex: 1; text-align: center; padding: 10px; background: ${COLORS.background.dark}; border-radius: 6px;`
            }, [
                el('div', { style: 'font-weight: bold; margin-bottom: 5px;' }, [week.label || week.week]),
                el('div', { style: 'font-size: 24px; margin: 5px 0;' }, [value + '/' + targetValue]),
                createProgressBar(value, targetValue, color, '4px'),
                el('div', { class: 'note', style: 'font-size: 11px;' }, [percentage.toFixed(0) + '%'])
            ]);
        })
    );
}

// 7-day summary grid
export function create7DayGrid(days, renderDay) {
    return el('div', { style: 'display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;' }, 
        days.map(day => renderDay(day))
    );
}

// Day card for 7-day grid
export function createDayCard({ dayName, data, goalsMet = [], isToday = false }) {
    const allMet = goalsMet.every(met => met);
    const someMet = goalsMet.some(met => met);
    const borderColor = allMet ? COLORS.primary : someMet ? COLORS.secondary : COLORS.warning;
    
    return el('div', { 
        style: `background: ${isToday ? '#2a2a3e' : COLORS.background.dark}; padding: 10px; border-radius: 6px; text-align: center; border-top: 3px solid ${borderColor}; ${isToday ? 'border: 2px solid ' + COLORS.primary : ''};`
    }, [
        el('div', { style: 'font-weight: bold; margin-bottom: 5px;' }, [dayName]),
        ...data,
        el('div', { style: 'margin-top: 5px; font-size: 16px;' }, [
            allMet ? '🎯' : someMet ? '⚡' : data.length > 0 ? '📈' : '❌'
        ])
    ]);
}

// Placeholder component
export function createPlaceholder(icon, title, subtitle) {
    return el('div', { class: 'chart-placeholder' }, [
        el('div', { class: 'placeholder-icon' }, [icon]),
        el('div', { class: 'placeholder-text' }, [title]),
        el('div', { class: 'placeholder-subtext' }, [subtitle])
    ]);
}