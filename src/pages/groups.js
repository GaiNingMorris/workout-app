import { el } from '../utils/helpers.js';

export function renderGroups(App) {
    var self = App;
    var root = el('div', {}, []);
    
    root.appendChild(el('div', { class: 'brand' }, [
        el('div', { class: 'dot' }, []), 
        el('h2', {}, ['Exercise Groups']), 
        el('span', { class: 'sub' }, ['Customize your 4-day split'])
    ]));
    
    var infoCard = el('div', { class: 'card' }, [
        el('h3', {}, ['4-Day Split Overview']),
        el('div', { class: 'note' }, [
            'The 4-day split is designed for optimal muscle building at age 50+:'
        ]),
        el('div', { class: 'hr' }, []),
        el('div', {}, [
            el('div', { style: 'margin: 8px 0' }, [
                el('strong', {}, ['Monday: ']),
                'Upper Push (Chest, Shoulders, Triceps)'
            ]),
            el('div', { style: 'margin: 8px 0' }, [
                el('strong', {}, ['Tuesday: ']),
                'Lower Quad (Squats & Glutes)'
            ]),
            el('div', { style: 'margin: 8px 0' }, [
                el('strong', {}, ['Wednesday: ']),
                'Recovery (Static Stretching)'
            ]),
            el('div', { style: 'margin: 8px 0' }, [
                el('strong', {}, ['Thursday: ']),
                'Upper Pull (Back & Biceps)'
            ]),
            el('div', { style: 'margin: 8px 0' }, [
                el('strong', {}, ['Friday: ']),
                'Lower Posterior (Hamstrings & Glutes)'
            ]),
            el('div', { style: 'margin: 8px 0' }, [
                el('strong', {}, ['Saturday: ']),
                'Recovery (Static Stretching)'
            ]),
            el('div', { style: 'margin: 8px 0' }, [
                el('strong', {}, ['Sunday: ']),
                'Full Rest'
            ])
        ]),
        el('div', { class: 'hr' }, []),
        el('div', { class: 'note' }, [
            '💡 Each muscle group is trained 2x per week for optimal growth. The program includes automatic progressive overload, deload cycles every 8 weeks, and conditional unlocks based on bodyweight and strength milestones.'
        ]),
        el('div', { class: 'hr' }, []),
        el('h3', {}, ['Progressive Overload System']),
        el('div', { class: 'note' }, [
            'Weight-based exercises: +2.5 lbs on success, auto-deload after 2 failures'
        ]),
        el('div', { class: 'note' }, [
            'Bodyweight exercises: Progress through levels (wall → knee → full push-ups)'
        ]),
        el('div', { class: 'note' }, [
            'Unlocks: Bar hangs at ≤200 lb, chin-ups at ≥30s hang time'
        ]),
        el('div', { class: 'hr' }, []),
        el('div', { class: 'note' }, [
            '⚠️ Exercise customization is managed automatically by the program. The workout templates are optimized for your goals and will adapt based on your progress.'
        ])
    ]);
    
    root.appendChild(infoCard);
    
    return root;
}