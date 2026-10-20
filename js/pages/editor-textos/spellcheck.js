/**
 * spellcheck.js — SpellCheckManager
 * Motor completo de Corrección Ortográfica y Gramatical Bilingüe (Español e Inglés)
 * Ignora el idioma del navegador y previene falsos positivos por configuraciones en inglés.
 * EduConta SV — ES Module
 */

import { MultiPageEngine } from './engine.js';
import { TextDocStateManager } from './state.js';
import { DocStatsManager } from './stats.js';
import {
    isSpanishWord,
    isEnglishWord,
    getSmartSuggestions,
    SPANISH_ACCENT_MAP
} from './spellcheck-dictionary.js';

const STORAGE_KEY_CONFIG = 'educonta_spellcheck_config';
const STORAGE_KEY_USER_WORDS = 'educonta_user_words';

export const SpellCheckManager = {
    // Configuración activa
    language: 'es',            // 'es' | 'en' | 'bilingual'
    browserSpellcheck: false,  // false por defecto para evitar marcas rojas de navegadores en inglés
    liveHighlight: false,      // Subrayado en vivo inteligente de EduConta

    // Diccionario personalizado y palabras ignoradas en la sesión
    userDictionary: new Set(),
    ignoredWords: new Set(),

    // Estado del asistente de revisión
    currentIssues: [],
    currentIssueIndex: -1,
    activeHighlightNode: null,

    // Inicialización
    init() {
        this.loadSettings();
        this.loadUserDictionary();
        this.applyToAllSurfaces();
        this.updateStatusPillUI();
        this.bindGlobalShortcuts();
        this.bindOutsideClickEvents();
    },

    // Cargar configuración guardada
    loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
            if (raw) {
                const cfg = JSON.parse(raw);
                if (cfg.language) this.language = cfg.language;
                if (typeof cfg.browserSpellcheck === 'boolean') this.browserSpellcheck = cfg.browserSpellcheck;
                if (typeof cfg.liveHighlight === 'boolean') this.liveHighlight = cfg.liveHighlight;
            }
        } catch (e) {
            console.warn('Error cargando configuración de ortografía:', e);
        }
    },

    saveSettings() {
        try {
            const cfg = {
                language: this.language,
                browserSpellcheck: this.browserSpellcheck,
                liveHighlight: this.liveHighlight
            };
            localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
        } catch (e) {
            console.warn('Error guardando configuración de ortografía:', e);
        }
    },

    // Cargar palabras del usuario
    loadUserDictionary() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_USER_WORDS);
            if (raw) {
                const words = JSON.parse(raw);
                if (Array.isArray(words)) {
                    words.forEach(w => this.userDictionary.add(w.toLowerCase()));
                }
            }
        } catch (e) {
            this.userDictionary = new Set();
        }
    },

    saveUserDictionary() {
        try {
            const arr = Array.from(this.userDictionary);
            localStorage.setItem(STORAGE_KEY_USER_WORDS, JSON.stringify(arr));
        } catch (e) {
            console.warn('Error guardando diccionario personal:', e);
        }
    },

    getLangCode() {
        if (this.language === 'en') return 'en';
        if (this.language === 'bilingual') return 'es-SV, en';
        return 'es';
    },

    getLanguageLabel() {
        if (this.language === 'en') return 'English (EN)';
        if (this.language === 'bilingual') return 'Bilingüe (ES + EN)';
        return 'Español (ES)';
    },

    // Aplicar atributos a todas las páginas de edición
    applyToAllSurfaces() {
        const editors = MultiPageEngine.getAllEditors();
        const langCode = this.getLangCode();
        const spellAttr = this.browserSpellcheck ? 'true' : 'false';

        editors.forEach(ed => {
            ed.setAttribute('spellcheck', spellAttr);
            ed.setAttribute('lang', langCode);
        });

        document.documentElement.lang = this.language === 'en' ? 'en' : 'es';
        this.updateStatusPillUI();
    },

    // Actualizar indicador en barra de estado inferior
    updateStatusPillUI() {
        const pillText = document.getElementById('doc-lang-pill-text');
        const statusDot = document.getElementById('doc-spellcheck-status-dot');

        if (pillText) {
            if (this.language === 'en') pillText.textContent = 'English';
            else if (this.language === 'bilingual') pillText.textContent = 'Bilingüe';
            else pillText.textContent = 'Español';
        }

        if (statusDot) {
            if (this.browserSpellcheck) {
                statusDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500';
                statusDot.title = 'Corrector del navegador activo';
            } else {
                statusDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-500';
                statusDot.title = 'Corrector EduConta SV activo (Navegador silenciado)';
            }
        }
    },

    // Atajo global de teclado F7 (estándar en Word / Google Docs / Office)
    bindGlobalShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F7' || e.code === 'F7') {
                e.preventDefault();
                this.openAssistant();
            }
        });
    },

    // Cerrar popovers al hacer clic fuera
    bindOutsideClickEvents() {
        document.addEventListener('click', (e) => {
            const popover = document.getElementById('popover-spellcheck-config');
            const btnPill = document.getElementById('btn-doc-lang-pill');
            if (popover && !popover.classList.contains('hidden')) {
                if (!popover.contains(e.target) && !btnPill?.contains(e.target)) {
                    this.closeConfigPopover();
                }
            }
        });
    },

    // ── VALIDACIÓN DE PALABRA INDIVIDUAL ──────────────────────────────────────
    checkWord(rawWord) {
        if (!rawWord) return true;

        // Limpiar signos de puntuación iniciales y finales
        const clean = rawWord.trim().replace(/^[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+|[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/g, '');
        if (!clean || clean.length < 2) return true;

        // Ignorar números puros, porcentajes, montos en moneda ($100.50)
        if (/^\d+([.,]\d+)*%?$/.test(clean)) return true;

        // Ignorar siglas con puntos o mayúsculas de 2-4 letras (ej. S.A., DTE, IVA, ISSS, AFP, CNR, US$)
        if (/^[A-ZÁÉÍÓÚÑ]{1,5}$/.test(clean)) return true;
        if (/^([A-ZÁÉÍÓÚÑ]\.)+$/.test(clean)) return true;

        const lower = clean.toLowerCase();

        // 1. Verificar si está en palabras ignoradas de esta sesión
        if (this.ignoredWords.has(lower)) return true;

        // 2. Verificar diccionario personal del usuario
        if (this.userDictionary.has(lower)) return true;

        // 3. Verificar según el idioma activo
        if (this.language === 'es') {
            return isSpanishWord(clean);
        } else if (this.language === 'en') {
            return isEnglishWord(clean);
        } else if (this.language === 'bilingual') {
            // Acepta si es correcta en Español O en Inglés
            return isSpanishWord(clean) || isEnglishWord(clean);
        }

        return true;
    },

    // ── ESCANEO COMPLETO DEL DOCUMENTO ────────────────────────────────────────
    scanDocument() {
        this.clearActiveHighlight();
        this.currentIssues = [];
        this.currentIssueIndex = -1;

        const editors = MultiPageEngine.getAllEditors();
        if (editors.length === 0) return [];

        const wordRegex = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+/g;

        editors.forEach((ed, pageIdx) => {
            const walkTextNodes = (node) => {
                if (node.nodeType === 3) { // Nodo de texto
                    const text = node.nodeValue;
                    if (!text || !text.trim()) return;

                    let match;
                    wordRegex.lastIndex = 0;
                    while ((match = wordRegex.exec(text)) !== null) {
                        const word = match[0];
                        const offset = match.index;

                        if (!this.checkWord(word)) {
                            // Extraer un fragmento de contexto (snippet) de 30 caracteres antes y después
                            const startContext = Math.max(0, offset - 35);
                            const endContext = Math.min(text.length, offset + word.length + 35);
                            const before = text.substring(startContext, offset);
                            const after = text.substring(offset + word.length, endContext);

                            const suggestions = getSmartSuggestions(word, this.language);

                            this.currentIssues.push({
                                word,
                                textNode: node,
                                offset,
                                length: word.length,
                                pageIndex: pageIdx,
                                beforeContext: (startContext > 0 ? '...' : '') + before,
                                afterContext: after + (endContext < text.length ? '...' : ''),
                                suggestions
                            });
                        }
                    }
                } else if (node.nodeType === 1) {
                    // Evitar escanear tablas de contenido, bloques no editables o marcas
                    if (!node.classList.contains('toc-block') && !node.classList.contains('page-header-bar') && !node.classList.contains('page-footer-bar')) {
                        Array.from(node.childNodes).forEach(walkTextNodes);
                    }
                }
            };

            Array.from(ed.childNodes).forEach(walkTextNodes);
        });

        return this.currentIssues;
    },

    // ── ASISTENTE INTERACTIVO DE REVISIÓN (MODAL F7) ───────────────────────────
    openAssistant() {
        this.scanDocument();
        const modal = document.getElementById('spellcheck-assistant-modal');
        if (!modal) return;

        modal.style.display = 'flex';
        modal.classList.remove('hidden');

        // Actualizar etiqueta del idioma en cabecera del modal
        const langBadge = document.getElementById('spellcheck-modal-lang-badge');
        if (langBadge) {
            langBadge.textContent = this.getLanguageLabel();
        }

        if (this.currentIssues.length === 0) {
            this.renderNoIssuesState();
        } else {
            this.goToIssue(0);
        }
    },

    closeAssistant() {
        const modal = document.getElementById('spellcheck-assistant-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
        this.clearActiveHighlight();
    },

    renderNoIssuesState() {
        const issueCard = document.getElementById('spellcheck-issue-card');
        const emptyCard = document.getElementById('spellcheck-empty-card');
        const actionsFooter = document.getElementById('spellcheck-actions-footer');
        const counterEl = document.getElementById('spellcheck-counter-badge');

        if (issueCard) issueCard.classList.add('hidden');
        if (actionsFooter) actionsFooter.classList.add('hidden');
        if (emptyCard) emptyCard.classList.remove('hidden');
        if (counterEl) counterEl.textContent = '0 faltas';

        this.clearActiveHighlight();
    },

    goToIssue(index) {
        if (index < 0 || index >= this.currentIssues.length) return;
        this.currentIssueIndex = index;
        const issue = this.currentIssues[index];

        const issueCard = document.getElementById('spellcheck-issue-card');
        const emptyCard = document.getElementById('spellcheck-empty-card');
        const actionsFooter = document.getElementById('spellcheck-actions-footer');
        const counterEl = document.getElementById('spellcheck-counter-badge');

        if (emptyCard) emptyCard.classList.add('hidden');
        if (issueCard) issueCard.classList.remove('hidden');
        if (actionsFooter) actionsFooter.classList.remove('hidden');

        if (counterEl) {
            counterEl.textContent = `${index + 1} de ${this.currentIssues.length}`;
        }

        // 1. Mostrar palabra y contexto
        const wordEl = document.getElementById('spellcheck-current-word');
        const contextEl = document.getElementById('spellcheck-context-snippet');
        const manualInput = document.getElementById('spellcheck-manual-input');

        if (wordEl) wordEl.textContent = issue.word;
        if (contextEl) {
            contextEl.innerHTML = `${this.escapeHTML(issue.beforeContext)}<mark class="spellcheck-snippet-highlight">${this.escapeHTML(issue.word)}</mark>${this.escapeHTML(issue.afterContext)}`;
        }

        // 2. Renderizar sugerencias inteligentes
        const suggestionsContainer = document.getElementById('spellcheck-suggestions-list');
        if (suggestionsContainer) {
            suggestionsContainer.innerHTML = '';
            if (issue.suggestions && issue.suggestions.length > 0) {
                issue.suggestions.forEach((sug, i) => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = `w-full text-left px-3 py-2 rounded-xl border transition-all flex items-center justify-between text-xs font-bold ${
                        i === 0
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/50 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                    }`;
                    btn.innerHTML = `
                        <div class="flex items-center gap-2">
                            <i class="fas fa-check-circle text-[11px] ${i === 0 ? 'text-amber-500' : 'text-slate-400'}"></i>
                            <span class="tracking-wide">${this.escapeHTML(sug)}</span>
                        </div>
                        <span class="text-[9px] font-black uppercase text-amber-500/80">${i === 0 ? 'Recomendada' : 'Opción'}</span>
                    `;
                    btn.onclick = () => {
                        Array.from(suggestionsContainer.children).forEach(c => {
                            c.className = c.className.replace(/bg-amber-50 dark:bg-amber-950\/40 border-amber-500\/50 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500\/30/g, 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400');
                        });
                        btn.className = 'w-full text-left px-3 py-2 rounded-xl border transition-all flex items-center justify-between text-xs font-bold bg-amber-50 dark:bg-amber-950/40 border-amber-500/50 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30';
                        if (manualInput) manualInput.value = sug;
                    };
                    btn.ondblclick = () => {
                        this.replaceCurrentWith(sug);
                    };
                    suggestionsContainer.appendChild(btn);
                });

                if (manualInput) manualInput.value = issue.suggestions[0];
            } else {
                suggestionsContainer.innerHTML = `
                    <div class="p-3 text-center rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-400 italic">
                        Sin sugerencias directas. Escribe una corrección abajo o añade la palabra al diccionario si es un nombre propio o término técnico.
                    </div>
                `;
                if (manualInput) manualInput.value = issue.word;
            }
        }

        // 3. Resaltar visualmente la palabra en el lienzo de la página correspondiente
        this.highlightInDocument(issue);
    },

    // Resaltado dinámico en la hoja física real
    highlightInDocument(issue) {
        this.clearActiveHighlight();
        if (!issue || !issue.textNode || !issue.textNode.parentNode) return;

        try {
            const parent = issue.textNode.parentNode;
            const fullText = issue.textNode.nodeValue;

            // Dividir nodo de texto e insertar <mark class="spellcheck-highlight-active">
            const beforeText = fullText.substring(0, issue.offset);
            const wordText = fullText.substring(issue.offset, issue.offset + issue.length);
            const afterText = fullText.substring(issue.offset + issue.length);

            const mark = document.createElement('mark');
            mark.className = 'spellcheck-highlight-active';
            mark.textContent = wordText;

            const frag = document.createDocumentFragment();
            if (beforeText) frag.appendChild(document.createTextNode(beforeText));
            frag.appendChild(mark);
            if (afterText) frag.appendChild(document.createTextNode(afterText));

            parent.replaceChild(frag, issue.textNode);
            this.activeHighlightNode = mark;

            // Desplazar suavemente a la vista
            mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {
            console.warn('No se pudo resaltar la palabra en el documento:', e);
        }
    },

    clearActiveHighlight() {
        if (this.activeHighlightNode && this.activeHighlightNode.parentNode) {
            const text = this.activeHighlightNode.textContent;
            const textNode = document.createTextNode(text);
            this.activeHighlightNode.parentNode.replaceChild(textNode, this.activeHighlightNode);
            this.activeHighlightNode = null;
        }

        // Limpieza adicional de cualquier marca residual
        document.querySelectorAll('.spellcheck-highlight-active').forEach(mark => {
            if (mark.parentNode) {
                const textNode = document.createTextNode(mark.textContent);
                mark.parentNode.replaceChild(textNode, mark);
                mark.parentNode.normalize();
            }
        });
    },

    // ── ACCIONES DE CORRECCIÓN ────────────────────────────────────────────────
    replaceCurrent() {
        const manualInput = document.getElementById('spellcheck-manual-input');
        const replacement = manualInput?.value?.trim();
        if (!replacement) return;
        this.replaceCurrentWith(replacement);
    },

    replaceCurrentWith(replacement) {
        if (this.currentIssueIndex < 0 || this.currentIssueIndex >= this.currentIssues.length) return;
        const issue = this.currentIssues[this.currentIssueIndex];

        if (this.activeHighlightNode && this.activeHighlightNode.parentNode) {
            const parent = this.activeHighlightNode.parentNode;
            const replacementNode = document.createTextNode(replacement);
            parent.replaceChild(replacementNode, this.activeHighlightNode);
            parent.normalize();
            this.activeHighlightNode = null;
        } else if (issue && issue.textNode && issue.textNode.parentNode) {
            const val = issue.textNode.nodeValue;
            const before = val.substring(0, issue.offset);
            const after = val.substring(issue.offset + issue.length);
            issue.textNode.nodeValue = before + replacement + after;
        }

        TextDocStateManager.pushHistory();
        DocStatsManager.update();
        MultiPageEngine.debouncePaginate();

        // Re-escanear y continuar en el mismo índice o siguiente
        this.scanDocument();
        if (this.currentIssues.length === 0) {
            this.renderNoIssuesState();
            TextDocStateManager.showToast('¡Todas las faltas corregidas con éxito!');
        } else {
            const nextIdx = Math.min(this.currentIssueIndex, this.currentIssues.length - 1);
            this.goToIssue(nextIdx);
        }
    },

    replaceAll() {
        if (this.currentIssueIndex < 0 || this.currentIssueIndex >= this.currentIssues.length) return;
        const issue = this.currentIssues[this.currentIssueIndex];
        const manualInput = document.getElementById('spellcheck-manual-input');
        const replacement = manualInput?.value?.trim();
        if (!replacement) return;

        this.clearActiveHighlight();
        const targetWord = issue.word;
        const regex = new RegExp(`\\b${this.escapeRegExp(targetWord)}\\b`, 'g');

        const editors = MultiPageEngine.getAllEditors();
        editors.forEach(ed => {
            ed.innerHTML = ed.innerHTML.replace(regex, replacement);
        });

        TextDocStateManager.pushHistory();
        DocStatsManager.update();
        MultiPageEngine.paginate();

        TextDocStateManager.showToast(`Reemplazadas todas las apariciones de "${targetWord}"`);

        this.scanDocument();
        if (this.currentIssues.length === 0) {
            this.renderNoIssuesState();
        } else {
            this.goToIssue(0);
        }
    },

    ignoreCurrent() {
        this.clearActiveHighlight();
        const nextIdx = this.currentIssueIndex + 1;
        if (nextIdx < this.currentIssues.length) {
            this.goToIssue(nextIdx);
        } else {
            this.renderNoIssuesState();
            TextDocStateManager.showToast('Revisión completada');
        }
    },

    ignoreAll() {
        if (this.currentIssueIndex < 0 || this.currentIssueIndex >= this.currentIssues.length) return;
        const issue = this.currentIssues[this.currentIssueIndex];
        this.ignoredWords.add(issue.word.toLowerCase());

        this.clearActiveHighlight();
        this.scanDocument();
        if (this.currentIssues.length === 0) {
            this.renderNoIssuesState();
            TextDocStateManager.showToast(`Se ignorarán todas las apariciones de "${issue.word}"`);
        } else {
            this.goToIssue(0);
        }
    },

    addCurrentToDictionary() {
        if (this.currentIssueIndex < 0 || this.currentIssueIndex >= this.currentIssues.length) return;
        const issue = this.currentIssues[this.currentIssueIndex];
        const wordClean = issue.word.trim().toLowerCase();

        this.userDictionary.add(wordClean);
        this.saveUserDictionary();

        this.clearActiveHighlight();
        TextDocStateManager.showToast(`"${issue.word}" agregada a tu diccionario personal`);

        this.scanDocument();
        if (this.currentIssues.length === 0) {
            this.renderNoIssuesState();
        } else {
            this.goToIssue(0);
        }
    },

    nextIssue() {
        if (this.currentIssueIndex + 1 < this.currentIssues.length) {
            this.clearActiveHighlight();
            this.goToIssue(this.currentIssueIndex + 1);
        }
    },

    prevIssue() {
        if (this.currentIssueIndex - 1 >= 0) {
            this.clearActiveHighlight();
            this.goToIssue(this.currentIssueIndex - 1);
        }
    },

    // ── CAMBIO DE IDIOMA Y CONFIGURACIÓN ───────────────────────────────────────
    setLanguage(newLang) {
        if (!['es', 'en', 'bilingual'].includes(newLang)) return;
        this.language = newLang;
        this.saveSettings();
        this.applyToAllSurfaces();

        // Actualizar radios en popover
        document.querySelectorAll('input[name="spellcheck-lang-radio"]').forEach(r => {
            r.checked = (r.value === newLang);
        });

        // Actualizar badge en modal de revisión si está abierto
        const langBadge = document.getElementById('spellcheck-modal-lang-badge');
        if (langBadge) langBadge.textContent = this.getLanguageLabel();

        // Si el asistente está abierto, re-escanear inmediatamente
        const modal = document.getElementById('spellcheck-assistant-modal');
        if (modal && modal.style.display !== 'none' && !modal.classList.contains('hidden')) {
            this.openAssistant();
        }

        TextDocStateManager.showToast(`Idioma del corrector cambiado a ${this.getLanguageLabel()}`);
    },

    setBrowserSpellcheck(enabled) {
        this.browserSpellcheck = !!enabled;
        this.saveSettings();
        this.applyToAllSurfaces();

        const toggleInput = document.getElementById('toggle-browser-spellcheck');
        if (toggleInput) toggleInput.checked = this.browserSpellcheck;

        if (this.browserSpellcheck) {
            TextDocStateManager.showToast('Corrector nativo del navegador activado');
        } else {
            TextDocStateManager.showToast('Subrayado rojo del navegador desactivado (Falsos errores eliminados)');
        }
    },

    setLiveHighlight(enabled) {
        this.liveHighlight = !!enabled;
        this.saveSettings();
        const toggleInput = document.getElementById('toggle-live-highlight');
        if (toggleInput) toggleInput.checked = this.liveHighlight;

        TextDocStateManager.showToast(this.liveHighlight ? 'Resaltado en vivo EduConta activado' : 'Resaltado en vivo desactivado');
    },

    // ── POPOVER DE CONFIGURACIÓN RÁPIDA ────────────────────────────────────────
    toggleConfigPopover(event) {
        if (event) event.stopPropagation();
        const popover = document.getElementById('popover-spellcheck-config');
        if (!popover) return;

        if (popover.classList.contains('hidden')) {
            this.openConfigPopover();
        } else {
            this.closeConfigPopover();
        }
    },

    openConfigPopover() {
        const popover = document.getElementById('popover-spellcheck-config');
        if (!popover) return;

        // Sincronizar estado de inputs
        document.querySelectorAll('input[name="spellcheck-lang-radio"]').forEach(r => {
            r.checked = (r.value === this.language);
        });

        const toggleBrowser = document.getElementById('toggle-browser-spellcheck');
        if (toggleBrowser) toggleBrowser.checked = !this.browserSpellcheck; // "Desactivar marcas rojas" es invertido para mayor claridad al usuario

        const dictCountEl = document.getElementById('user-dict-count-text');
        if (dictCountEl) {
            const count = this.userDictionary.size;
            dictCountEl.textContent = `${count} palabra${count === 1 ? '' : 's'} guardada${count === 1 ? '' : 's'}`;
        }

        popover.classList.remove('hidden');
    },

    closeConfigPopover() {
        const popover = document.getElementById('popover-spellcheck-config');
        if (popover) popover.classList.add('hidden');
    },

    // ── MODAL DEL DICCIONARIO PERSONAL ─────────────────────────────────────────
    openUserDictionaryModal() {
        this.closeConfigPopover();
        const modal = document.getElementById('user-dictionary-modal');
        if (!modal) return;

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        this.renderUserDictionaryList();
    },

    closeUserDictionaryModal() {
        const modal = document.getElementById('user-dictionary-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    },

    renderUserDictionaryList(filterQuery = '') {
        const listEl = document.getElementById('user-dict-words-list');
        const emptyEl = document.getElementById('user-dict-empty');
        if (!listEl) return;

        listEl.innerHTML = '';
        const words = Array.from(this.userDictionary).sort();
        const filtered = filterQuery ? words.filter(w => w.includes(filterQuery.toLowerCase())) : words;

        if (filtered.length === 0) {
            if (emptyEl) emptyEl.classList.remove('hidden');
            return;
        }

        if (emptyEl) emptyEl.classList.add('hidden');

        filtered.forEach(word => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300';
            item.innerHTML = `
                <div class="flex items-center gap-2">
                    <i class="fas fa-book-bookmark text-amber-500 text-[10px]"></i>
                    <span>${this.escapeHTML(word)}</span>
                </div>
                <button type="button" class="text-rose-500 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors" title="Eliminar del diccionario">
                    <i class="fas fa-trash-alt text-[10px]"></i>
                </button>
            `;
            item.querySelector('button').onclick = () => {
                this.removeUserWord(word);
            };
            listEl.appendChild(item);
        });
    },

    addUserWord(word) {
        if (!word) return;
        const clean = word.trim().toLowerCase();
        this.userDictionary.add(clean);
        this.saveUserDictionary();
    },

    addWordFromInput() {
        const input = document.getElementById('user-dict-new-word-input');
        const word = input?.value?.trim()?.toLowerCase();
        if (!word) return;

        this.addUserWord(word);
        if (input) input.value = '';

        this.renderUserDictionaryList();
        TextDocStateManager.showToast(`"${word}" añadida al diccionario`);
    },

    removeUserWord(word) {
        this.userDictionary.delete(word.toLowerCase());
        this.saveUserDictionary();
        this.renderUserDictionaryList();
        TextDocStateManager.showToast(`"${word}" eliminada del diccionario`);
    },

    // ── UTILIDADES ─────────────────────────────────────────────────────────────
    escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
};
