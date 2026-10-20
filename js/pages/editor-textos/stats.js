/**
 * stats.js — DocStatsManager
 * Estadísticas en vivo: palabras, caracteres, páginas y tiempo de lectura.
 * EduConta SV
 */
import { MultiPageEngine } from './engine.js';
    const DocStatsManager = {
        update() {
            const editors = MultiPageEngine.getAllEditors();
            let totalText = '';
            editors.forEach(ed => {
                const clone = ed.cloneNode(true);
                clone.querySelectorAll('.toc-block').forEach(el => el.remove());
                clone.querySelectorAll('span[data-ec-pending-color], span[data-ec-pending-bg]').forEach(s => {
                    if (s.textContent.replace(/\u200B/g, '').trim() === '') s.remove();
                });
                totalText += ' ' + (clone.innerText || clone.textContent || '').replace(/\u200B/g, '');
            });

            const cleanText = totalText.trim();
            const words = cleanText === '' ? 0 : cleanText.split(/\s+/).length;
            const chars = totalText.length;
            const readMinutes = Math.ceil(words / 200);

            const elWords = document.getElementById('stat-words');
            const elChars = document.getElementById('stat-chars');
            const elReadTime = document.getElementById('stat-read-time');
            const elPages = document.getElementById('stat-pages');

            if (elWords) elWords.textContent = words.toLocaleString();
            if (elChars) elChars.textContent = chars.toLocaleString();
            if (elReadTime) elReadTime.textContent = `${readMinutes} min`;
            if (elPages) elPages.textContent = (MultiPageEngine.pageCount || 1).toString();
        }
    };
export { DocStatsManager };