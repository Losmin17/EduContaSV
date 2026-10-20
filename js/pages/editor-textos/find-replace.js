/**
 * find-replace.js — FindReplaceManager
 * Motor de búsqueda y reemplazo con resaltado de coincidencias.
 * EduConta SV
 */
import { MultiPageEngine } from './engine.js';
import { TextDocStateManager } from './state.js';
import { DocStatsManager } from './stats.js';
    const FindReplaceManager = {
        matches: [],
        currentIndex: -1,

        openModal() {
            const modal = document.getElementById('find-replace-modal');
            if (modal) {
                modal.style.display = 'flex';
                setTimeout(() => document.getElementById('find-input-query')?.focus(), 80);
            }
        },

        closeModal() {
            const modal = document.getElementById('find-replace-modal');
            if (modal) modal.style.display = 'none';
            this.clearHighlights();
        },

        handleSearchInput() {
            const query = document.getElementById('find-input-query')?.value || '';
            const countEl = document.getElementById('find-matches-count');
            this.clearHighlights();

            if (!query.trim()) {
                if (countEl) countEl.textContent = '0 coincidencias';
                return;
            }

            this.highlightText(query);
            const total = this.matches.length;
            if (countEl) countEl.textContent = `${total} coincidencia${total === 1 ? '' : 's'}`;
        },

        highlightText(query) {
            this.matches = [];
            this.currentIndex = -1;
            const editors = MultiPageEngine.getAllEditors();
            if (editors.length === 0) return;

            const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');

            const walkTextNodes = (node) => {
                if (node.nodeType === 3) {
                    if (regex.test(node.nodeValue)) {
                        const span = document.createElement('span');
                        span.innerHTML = node.nodeValue.replace(regex, '<mark class="find-match">$1</mark>');
                        node.parentNode.replaceChild(span, node);
                    }
                } else if (node.nodeType === 1 && !node.classList.contains('find-match')) {
                    Array.from(node.childNodes).forEach(walkTextNodes);
                }
            };

            editors.forEach(ed => {
                Array.from(ed.childNodes).forEach(walkTextNodes);
            });

            this.matches = Array.from(document.querySelectorAll('.find-match'));
        },

        clearHighlights() {
            document.querySelectorAll('.find-match').forEach(m => {
                const parent = m.parentNode;
                if (parent) {
                    parent.replaceChild(document.createTextNode(m.textContent), m);
                    parent.normalize();
                }
            });
            this.matches = [];
            this.currentIndex = -1;
        },

        replaceNext() {
            const query = document.getElementById('find-input-query')?.value || '';
            const replacement = document.getElementById('find-input-replace')?.value || '';
            if (!query) return;

            const editors = MultiPageEngine.getAllEditors();
            const regex = new RegExp(this.escapeRegExp(query), 'i');

            for (const ed of editors) {
                if (regex.test(ed.innerHTML)) {
                    ed.innerHTML = ed.innerHTML.replace(regex, replacement);
                    break;
                }
            }

            this.handleSearchInput();
            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            MultiPageEngine.debouncePaginate();
        },

        replaceAll() {
            const query = document.getElementById('find-input-query')?.value || '';
            const replacement = document.getElementById('find-input-replace')?.value || '';
            if (!query) return;

            this.clearHighlights();
            const regex = new RegExp(this.escapeRegExp(query), 'gi');
            const editors = MultiPageEngine.getAllEditors();

            editors.forEach(ed => {
                ed.innerHTML = ed.innerHTML.replace(regex, replacement);
            });

            this.handleSearchInput();
            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            MultiPageEngine.paginate();
            TextDocStateManager.showToast('Reemplazo completado');
        },

        escapeRegExp(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
    };
export { FindReplaceManager };