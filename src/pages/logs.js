import { el } from '../utils/helpers.js';
export function renderLogs(App) {
    var rows = [], logs = App.data.logs.slice().reverse();
    for (var i = 0; i < logs.length; i++) rows.push(el('tr', {}, [el('td', {}, [new Date(logs[i].date).toLocaleString()]), el('td', {}, [logs[i].mode]), el('td', {}, [String(logs[i].items.length)])]));
    return el('div', {}, [el('div', { class: 'brand' }, [el('div', { class: 'dot' }, []), el('h2', {}, ['Logs'])]), el('div', { class: 'card' }, [el('table', { class: 'table' }, [el('thead', {}, [el('tr', {}, [el('th', {}, ['Date']), el('th', {}, ['Mode']), el('th', {}, ['Sets'])])]), el('tbody', {}, rows)])])]);
}
