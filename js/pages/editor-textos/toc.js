/**
 * toc.js — TableOfContentsManager
 * Generación de tabla de contenidos (TOC) desde h1/h2/h3.
 * EduConta SV
 */
import { MultiPageEngine } from './engine.js';
import { TextDocStateManager } from './state.js';
    const TableOfContentsManager = {
        insertOrUpdateTOC() {
            const editors = MultiPageEngine.getAllEditors();
            if (editors.length === 0) return;

            const headings = [];
            editors.forEach(ed => {
                ed.querySelectorAll('h1, h2, h3').forEach(h => headings.push(h));
            });

            if (headings.length === 0) {
                alert('No se encontraron títulos (H1, H2 o H3) para generar el índice.');
                return;
            }

            const tocContainer = document.createElement('div');
            tocContainer.className = 'toc-block';
            tocContainer.setAttribute('contenteditable', 'false');

            let html = '<div class="toc-title">ÍNDICE DE CONTENIDOS</div>';
            headings.forEach((h, idx) => {
                const level = h.tagName.toLowerCase() === 'h1' ? 1 : h.tagName.toLowerCase() === 'h2' ? 2 : 3;
                const text = h.textContent.trim() || `Sección ${idx + 1}`;
                const anchorId = `heading-sec-${idx + 1}`;
                h.id = anchorId;
                html += `<a href="#${anchorId}" class="toc-link toc-level-${level}">${text}</a>`;
            });
            tocContainer.innerHTML = html;

            const existingTOC = document.querySelector('.toc-block');
            if (existingTOC) {
                existingTOC.replaceWith(tocContainer);
                TextDocStateManager.showToast('Tabla de contenidos actualizada');
            } else {
                const firstEditor = editors[0];
                if (firstEditor) {
                    firstEditor.insertBefore(tocContainer, firstEditor.firstChild);
                    TextDocStateManager.showToast('Tabla de contenidos insertada');
                }
            }

            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
        }
    };
export { TableOfContentsManager };