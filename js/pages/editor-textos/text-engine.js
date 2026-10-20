/**
 * text-engine.js — EduContaTextEngine
 * Formateo de texto enriquecido, fuentes, colores, tablas y pegado limpio.
 * EduConta SV
 */
import { MultiPageEngine } from './engine.js';
import { TextDocStateManager } from './state.js';
import { DocStatsManager } from './stats.js';
import { CollabPresenceManager } from './collab.js';
    const EduContaTextEngine = {
        _savedRange: null,
        _savedEditor: null,
        _fontPreviewState: null,
        _colorPreviewState: null,
        _hideSelectionTimer: null,
        _hideSelectionCleanupEvents: null,

        saveActiveSelection(force = false) {
            try {
                const sel = window.getSelection();
                if (!sel || sel.rangeCount === 0) return;
                const range = sel.getRangeAt(0);
                const container = MultiPageEngine.getContainer();
                if (container && container.contains(range.commonAncestorContainer)) {
                    if (!force && document.activeElement && !container.contains(document.activeElement) && document.activeElement !== document.body) {
                        return;
                    }
                    this._savedRange = range.cloneRange();
                    this._savedEditor = MultiPageEngine.getActiveEditor();
                }
            } catch (_) {}
        },

        restoreActiveSelection() {
            try {
                if (!this._savedRange) return;
                const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                if (editor && document.activeElement !== editor) {
                    editor.focus({ preventScroll: true });
                }
                const sel = window.getSelection();
                if (sel) {
                    if (sel.rangeCount > 0) {
                        const cur = sel.getRangeAt(0);
                        if (cur.startContainer === this._savedRange.startContainer &&
                            cur.startOffset === this._savedRange.startOffset &&
                            cur.endContainer === this._savedRange.endContainer &&
                            cur.endOffset === this._savedRange.endOffset) {
                            return;
                        }
                    }
                    sel.removeAllRanges();
                    sel.addRange(this._savedRange);
                }
            } catch (_) {}
        },

        getOrCreatePendingSpan() {
            this.restoreActiveSelection();
            const sel = window.getSelection();
            const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : this._savedRange;
            if (!range) return null;

            let node = range.startContainer;
            if (node && node.nodeType === 3) node = node.parentElement;

            // Si el cursor ya está dentro de un span pendiente que aún no contiene texto real
            let existingPending = node ? node.closest('span[data-ec-pending="true"], span[data-ec-pending-color="true"], span[data-ec-pending-bg="true"]') : null;
            if (existingPending && existingPending.textContent.replace(/\u200B/g, '').trim() === '') {
                existingPending.dataset.ecPending = "true";
                return existingPending;
            }

            // Si el span pendiente anterior ya tiene texto tipeado, desmarcarlo para no alterar lo ya escrito
            if (existingPending) {
                existingPending.removeAttribute('data-ec-pending');
                existingPending.removeAttribute('data-ec-pending-color');
                existingPending.removeAttribute('data-ec-pending-bg');
            }

            const span = document.createElement('span');
            span.dataset.ecPending = "true";

            // Heredar estilos calculados del nodo actual para mantener consistencia
            if (node) {
                const comp = window.getComputedStyle(node);
                if (comp.fontFamily) span.style.fontFamily = comp.fontFamily;
                if (comp.fontSize) span.style.fontSize = comp.fontSize;
                if (comp.color) span.style.color = comp.color;
            }

            const zwsp = document.createTextNode('\u200B');
            span.appendChild(zwsp);

            range.insertNode(span);

            const newRange = document.createRange();
            newRange.setStart(zwsp, 1);
            newRange.collapse(true);

            if (sel) {
                sel.removeAllRanges();
                sel.addRange(newRange);
            }
            this._savedRange = newRange.cloneRange();
            this._savedEditor = MultiPageEngine.getActiveEditor();

            return span;
        },

        hideSelectionTemporarily(durationMs = 800) {
            if (this._hideSelectionTimer) {
                clearTimeout(this._hideSelectionTimer);
                this._hideSelectionTimer = null;
            }

            document.body.classList.add('educonta-hide-selection');

            if (!this._hideSelectionCleanupEvents) {
                this._hideSelectionCleanupEvents = (e) => {
                    if (e.target && e.target.closest && e.target.closest('#popover-color-picker, #btn-tool-text-color, #btn-tool-bg-color')) {
                        return;
                    }
                    this.showSelection();
                };
                document.addEventListener('keydown', this._hideSelectionCleanupEvents, { capture: true, once: true });
                document.addEventListener('mousedown', this._hideSelectionCleanupEvents, { capture: true, once: true });
            }

            if (durationMs > 0) {
                this._hideSelectionTimer = setTimeout(() => {
                    this.showSelection();
                }, durationMs);
            }
        },

        showSelection() {
            if (this._hideSelectionTimer) {
                clearTimeout(this._hideSelectionTimer);
                this._hideSelectionTimer = null;
            }
            document.body.classList.remove('educonta-hide-selection');
            if (this._hideSelectionCleanupEvents) {
                document.removeEventListener('keydown', this._hideSelectionCleanupEvents, { capture: true });
                document.removeEventListener('mousedown', this._hideSelectionCleanupEvents, { capture: true });
                this._hideSelectionCleanupEvents = null;
            }
        },

        hasActiveColorPreview() {
            return !!(this._colorPreviewState && (
                (this._colorPreviewState.targets && this._colorPreviewState.targets.length > 0) ||
                this._colorPreviewState.isCollapsed
            ));
        },

        beginColorPreview(type = 'text') {
            if (window.isAuditMode) return;
            this.saveActiveSelection(false);
            if (!this._savedRange) return;

            this.cancelColorPreview();

            try {
                const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                this.restoreActiveSelection();
                const sel = window.getSelection();
                const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : this._savedRange;
                const hasSelection = range && !range.collapsed && range.toString().length > 0;

                if (hasSelection) {
                    let origNode = range.startContainer;
                    if (origNode && origNode.nodeType === 3) origNode = origNode.parentElement;
                    const origComp = origNode ? window.getComputedStyle(origNode) : null;
                    const origColor = type === 'text' 
                        ? (origComp?.color || '#1e293b') 
                        : (origComp?.backgroundColor || 'transparent');

                    const TEMP_COLOR = '#010203';
                    try {
                        document.execCommand('styleWithCSS', false, true);
                    } catch (_) {}

                    if (type === 'text') {
                        document.execCommand('foreColor', false, TEMP_COLOR);
                    } else {
                        if (!document.execCommand('hiliteColor', false, TEMP_COLOR)) {
                            document.execCommand('backColor', false, TEMP_COLOR);
                        }
                    }

                    const container = MultiPageEngine.getContainer() || document.body;
                    const createdTargets = [];

                    if (type === 'text') {
                        container.querySelectorAll('font[color="#010203"]').forEach(f => {
                            const span = document.createElement('span');
                            span.className = 'educonta-color-preview-target';
                            span.dataset.ecOrigColor = origColor;
                            span.style.color = origColor;
                            if (f.style.cssText) span.style.cssText += ';' + f.style.cssText;
                            while (f.firstChild) span.appendChild(f.firstChild);
                            f.parentNode?.replaceChild(span, f);
                            createdTargets.push(span);
                        });
                    }

                    const selector = '[style*="rgb(1, 2, 3)"], [style*="#010203"]';
                    container.querySelectorAll(selector).forEach(s => {
                        s.classList.add('educonta-color-preview-target');
                        if (!s.dataset.ecOrigColor) s.dataset.ecOrigColor = origColor;
                        if (type === 'text') s.style.color = origColor;
                        else s.style.backgroundColor = origColor;
                        if (!createdTargets.includes(s)) createdTargets.push(s);
                    });

                    if (createdTargets.length > 0) {
                        const newRange = document.createRange();
                        newRange.setStartBefore(createdTargets[0]);
                        newRange.setEndAfter(createdTargets[createdTargets.length - 1]);
                        if (sel) {
                            sel.removeAllRanges();
                            sel.addRange(newRange);
                        }
                        this._savedRange = newRange.cloneRange();
                    } else {
                        this.saveActiveSelection(true);
                    }

                    this._colorPreviewState = {
                        type: type,
                        targets: createdTargets,
                        originalColor: origColor,
                        activeEditor: editor
                    };

                    this.hideSelectionTemporarily(0);
                } else {
                    let activeNode = (range && range.startContainer) ? range.startContainer : (sel && sel.rangeCount > 0 ? sel.anchorNode : null);
                    if (activeNode && activeNode.nodeType === 3) activeNode = activeNode.parentElement;
                    const activeCell = activeNode ? activeNode.closest('td, th') : null;

                    if (type === 'bg' && activeCell && editor && editor.contains(activeCell)) {
                        const origComp = window.getComputedStyle(activeCell);
                        const origBg = activeCell.style.backgroundColor || origComp.backgroundColor;
                        activeCell.classList.add('educonta-color-preview-target');
                        activeCell.dataset.ecOrigColor = origBg;

                        this._colorPreviewState = {
                            type: 'bg',
                            targets: [activeCell],
                            originalColor: origBg,
                            activeEditor: editor,
                            isCell: true
                        };
                        this.hideSelectionTemporarily(0);
                    } else {
                        const pendingSpan = this.getOrCreatePendingSpan();
                        if (pendingSpan) {
                            const origComp = window.getComputedStyle(pendingSpan);
                            const origColor = type === 'text' ? (origComp.color || '#1e293b') : (origComp.backgroundColor || 'transparent');
                            pendingSpan.classList.add('educonta-color-preview-target');
                            pendingSpan.dataset.ecOrigColor = origColor;

                            this._colorPreviewState = {
                                type: type,
                                targets: [pendingSpan],
                                originalColor: origColor,
                                activeEditor: editor,
                                isCollapsed: true
                            };
                            this.hideSelectionTemporarily(0);
                        }
                    }
                }
            } catch (err) {
                console.warn('beginColorPreview error:', err);
            }
        },

        previewColor(color, type = 'text') {
            if (window.isAuditMode) return;
            if (!this._colorPreviewState || this._colorPreviewState.type !== type) {
                this.beginColorPreview(type);
            }

            const state = this._colorPreviewState;
            if (!state) return;

            if (state.targets && state.targets.length > 0) {
                state.targets.forEach(el => {
                    if (type === 'text') {
                        el.style.color = color || state.originalColor || '';
                    } else {
                        el.style.backgroundColor = color || 'transparent';
                    }
                });
                this.hideSelectionTemporarily(0);
            }

            const ind = document.getElementById(type === 'text' ? 'indicator-text-color' : 'indicator-bg-color');
            if (ind) {
                ind.style.backgroundColor = color || (type === 'text' ? '#1e293b' : '#f59e0b');
            }
        },

        cancelColorPreview() {
            if (!this._colorPreviewState) {
                this.showSelection();
                return;
            }

            const state = this._colorPreviewState;
            if (state.targets && state.targets.length > 0) {
                const firstTarget = state.targets[0];
                const lastTarget = state.targets[state.targets.length - 1];

                state.targets.forEach(el => {
                    const orig = el.dataset.ecOrigColor;
                    if (state.type === 'text') {
                        el.style.color = orig || '';
                    } else {
                        el.style.backgroundColor = orig || '';
                    }
                    el.classList.remove('educonta-color-preview-target');
                    delete el.dataset.ecOrigColor;
                });

                try {
                    const editor = state.activeEditor || MultiPageEngine.getActiveEditor();
                    if (editor) editor.focus({ preventScroll: true });
                    if (firstTarget.parentNode && lastTarget.parentNode) {
                        const newRange = document.createRange();
                        if (firstTarget.dataset?.ecPending === "true") {
                            const zwsp = firstTarget.firstChild;
                            newRange.setStart(zwsp || firstTarget, 1);
                            newRange.collapse(true);
                        } else {
                            newRange.setStartBefore(firstTarget);
                            newRange.setEndAfter(lastTarget);
                        }
                        const sel = window.getSelection();
                        if (sel) {
                            sel.removeAllRanges();
                            sel.addRange(newRange);
                        }
                        this._savedRange = newRange.cloneRange();
                    }
                } catch (_) {}
            }

            this._colorPreviewState = null;
            this.showSelection();
            this.restoreActiveSelection();
        },

        commitColorPreview(color, type = 'text') {
            const state = this._colorPreviewState;

            if (state && state.targets && state.targets.length > 0) {
                const firstTarget = state.targets[0];
                const lastTarget = state.targets[state.targets.length - 1];

                state.targets.forEach(el => {
                    if (type === 'text') {
                        el.style.color = color || '';
                        el.querySelectorAll('span[style*="color"], font').forEach(nested => {
                            if (nested.style.color) nested.style.color = color || '';
                            nested.removeAttribute('color');
                        });
                    } else {
                        el.style.backgroundColor = color || 'transparent';
                    }
                    el.classList.remove('educonta-color-preview-target');
                    delete el.dataset.ecOrigColor;
                });

                this._colorPreviewState = null;

                const ind = document.getElementById(type === 'text' ? 'indicator-text-color' : 'indicator-bg-color');
                if (ind) {
                    ind.style.backgroundColor = color || (type === 'text' ? '#1e293b' : '#f59e0b');
                }

                try {
                    const editor = state.activeEditor || MultiPageEngine.getActiveEditor();
                    if (editor) editor.focus({ preventScroll: true });
                    if (firstTarget.parentNode && lastTarget.parentNode) {
                        const newRange = document.createRange();
                        if (firstTarget.dataset?.ecPending === "true") {
                            const zwsp = firstTarget.firstChild;
                            newRange.setStart(zwsp || firstTarget, 1);
                            newRange.collapse(true);
                        } else {
                            newRange.setStartBefore(firstTarget);
                            newRange.setEndAfter(lastTarget);
                        }
                        const sel = window.getSelection();
                        if (sel) {
                            sel.removeAllRanges();
                            sel.addRange(newRange);
                        }
                        this._savedRange = newRange.cloneRange();
                    }
                } catch (_) {}

                this.hideSelectionTemporarily(800);

                this.updateToolbarState();
                TextDocStateManager.pushHistory();
                DocStatsManager.update();
                MultiPageEngine.debouncePaginate();
                TextDocStateManager.triggerAutoSave();
                CollabPresenceManager.broadcastContent(MultiPageEngine.getCleanHTML(), TextDocStateManager.activeSheetIndex);
            } else {
                this._colorPreviewState = null;
                if (type === 'text') {
                    this.setTextColor(color);
                } else {
                    this.setHighlightColor(color);
                }
            }
        },

        // Métodos de compatibilidad y previsualización segura en tiempo real (sin mutación destructiva de párrafos)
        beginFontPreview() {
            if (window.isAuditMode) return;
            if (!this._savedRange) {
                this.saveActiveSelection(false);
            }
            if (!this._savedRange) return;

            // Si ya existía una sesión previa activa, cancelarla antes de iniciar otra
            this.cancelFontPreview();

            try {
                const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                this.restoreActiveSelection();
                const sel = window.getSelection();
                const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : this._savedRange;
                const hasSelection = range && !range.collapsed && range.toString().trim().length > 0;

                if (hasSelection) {
                    // Guardar la fuente original calculada del nodo inicial
                    let origNode = range.startContainer;
                    if (origNode && origNode.nodeType === 3) origNode = origNode.parentElement;
                    const origComp = origNode ? window.getComputedStyle(origNode) : null;
                    const origFont = origComp?.fontFamily ? origComp.fontFamily.split(',')[0].replace(/['"]/g, '').trim() : 'Plus Jakarta Sans';

                    const TEMP_MARKER = 'EDUCONTA_PREVIEW_TEMP';
                    try {
                        document.execCommand('styleWithCSS', false, true);
                    } catch (_) {}
                    document.execCommand('fontName', false, TEMP_MARKER);

                    const container = MultiPageEngine.getContainer() || document.body;

                    const createdTargets = [];
                    // Convertir <font face="EDUCONTA_PREVIEW_TEMP"> a spans con clase preview
                    container.querySelectorAll(`font[face="${TEMP_MARKER}"]`).forEach(f => {
                        const span = document.createElement('span');
                        span.className = 'educonta-font-preview-target';
                        span.dataset.origFont = origFont;
                        span.style.fontFamily = `'${origFont}', sans-serif`;
                        if (f.style.cssText) span.style.cssText += ';' + f.style.cssText;
                        while (f.firstChild) span.appendChild(f.firstChild);
                        f.parentNode?.replaceChild(span, f);
                        createdTargets.push(span);
                    });

                    // Spans generados directamente con style="font-family: EDUCONTA_PREVIEW_TEMP"
                    container.querySelectorAll(`span[style*="${TEMP_MARKER}"]`).forEach(s => {
                        s.classList.add('educonta-font-preview-target');
                        s.dataset.origFont = origFont;
                        s.style.fontFamily = `'${origFont}', sans-serif`;
                        if (!createdTargets.includes(s)) createdTargets.push(s);
                    });

                    if (createdTargets.length > 0) {
                        const newRange = document.createRange();
                        newRange.setStartBefore(createdTargets[0]);
                        newRange.setEndAfter(createdTargets[createdTargets.length - 1]);
                        if (sel) {
                            sel.removeAllRanges();
                            sel.addRange(newRange);
                        }
                        this._savedRange = newRange.cloneRange();
                    } else {
                        this.saveActiveSelection(true);
                    }

                    this._fontPreviewState = {
                        type: 'selection',
                        originalFont: origFont,
                        activeEditor: editor
                    };
                } else {
                    // Selección colapsada: preparar span pendiente en el cursor
                    const pendingSpan = this.getOrCreatePendingSpan();
                    if (pendingSpan) {
                        const comp = window.getComputedStyle(pendingSpan);
                        const origFont = comp?.fontFamily ? comp.fontFamily.split(',')[0].replace(/['"]/g, '').trim() : 'Plus Jakarta Sans';
                        pendingSpan.classList.add('educonta-font-preview-target');
                        pendingSpan.dataset.origFont = pendingSpan.style.fontFamily || origFont;

                        this._fontPreviewState = {
                            type: 'pending',
                            target: pendingSpan,
                            targets: [pendingSpan],
                            originalFont: pendingSpan.dataset.origFont,
                            activeEditor: editor,
                            isCollapsed: true
                        };
                    }
                }
            } catch (err) {
                console.warn('beginFontPreview error:', err);
            }
        },

        previewFontFamily(fontName) {
            if (window.isAuditMode || !fontName) return;
            const cleanFont = fontName.trim().replace(/^['"]|['"]$/g, '');
            if (!cleanFont) return;

            if (typeof window.ensureGoogleFontLoaded === 'function') {
                window.ensureGoogleFontLoaded(cleanFont);
            }

            if (!this._fontPreviewState) {
                this.beginFontPreview();
            }

            const previewTargets = document.querySelectorAll('.educonta-font-preview-target');
            if (previewTargets.length > 0) {
                previewTargets.forEach(el => {
                    el.style.fontFamily = `'${cleanFont}', sans-serif`;
                    el.querySelectorAll('span[style*="font-family"], font').forEach(nested => {
                        nested.style.fontFamily = `'${cleanFont}', sans-serif`;
                    });
                });
            }
        },

        cancelFontPreview(fullCleanup = false) {
            if (!this._fontPreviewState) return;
            const previewTargets = document.querySelectorAll('.educonta-font-preview-target');
            if (previewTargets.length > 0) {
                const firstTarget = previewTargets[0];
                const lastTarget = previewTargets[previewTargets.length - 1];
                previewTargets.forEach(el => {
                    const orig = el.dataset.origFont;
                    if (orig) {
                        el.style.fontFamily = orig.includes(',') || orig.includes('sans-serif') || orig.includes('serif') ? orig : `'${orig}', sans-serif`;
                    } else {
                        el.style.fontFamily = '';
                    }
                    el.querySelectorAll('span[style*="font-family"], font').forEach(nested => {
                        nested.style.fontFamily = el.style.fontFamily;
                    });
                    if (fullCleanup) {
                        el.classList.remove('educonta-font-preview-target');
                        delete el.dataset.origFont;
                    }
                });
                try {
                    const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                    if (editor && document.activeElement !== editor) editor.focus({ preventScroll: true });
                    const newRange = document.createRange();
                    if (firstTarget.dataset?.ecPending === "true") {
                        const zwsp = firstTarget.firstChild;
                        if (zwsp && zwsp.nodeType === 3) {
                            newRange.setStart(zwsp, zwsp.textContent.length);
                        } else {
                            newRange.setStart(firstTarget, 0);
                        }
                        newRange.collapse(true);
                    } else {
                        newRange.setStartBefore(firstTarget);
                        newRange.setEndAfter(lastTarget);
                    }
                    const sel = window.getSelection();
                    if (sel) {
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    }
                    this._savedRange = newRange.cloneRange();
                } catch (_) {}
            }
            if (fullCleanup) {
                this._fontPreviewState = null;
            }
            this.restoreActiveSelection();
        },

        commitFontPreview(fontName) {
            const cleanFont = (fontName || '').trim().replace(/^['"]|['"]$/g, '');
            if (!cleanFont) {
                this.cancelFontPreview();
                return;
            }

            if (typeof window.ensureGoogleFontLoaded === 'function') {
                window.ensureGoogleFontLoaded(cleanFont);
            }

            const previewTargets = document.querySelectorAll('.educonta-font-preview-target');
            if (previewTargets.length > 0) {
                const firstTarget = previewTargets[0];
                const lastTarget = previewTargets[previewTargets.length - 1];

                previewTargets.forEach(el => {
                    el.style.fontFamily = `'${cleanFont}', sans-serif`;
                    el.classList.remove('educonta-font-preview-target');
                    delete el.dataset.origFont;

                    el.querySelectorAll('span[style*="font-family"], font').forEach(nested => {
                        nested.style.fontFamily = `'${cleanFont}', sans-serif`;
                        nested.removeAttribute('face');
                    });
                });

                this._fontPreviewState = null;

                const fontSelect = document.getElementById('font-family-select');
                if (fontSelect) {
                    fontSelect.value = cleanFont;
                    if (fontSelect._glassInstance) {
                        fontSelect._glassInstance.updateTriggerLabel();
                    }
                }

                // Re-seleccionar el rango completo modificado para que el texto siga seleccionado o posicionar caret en pending
                try {
                    const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                    if (editor && document.activeElement !== editor) editor.focus({ preventScroll: true });
                    const newRange = document.createRange();
                    if (firstTarget.dataset?.ecPending === "true") {
                        const zwsp = firstTarget.firstChild;
                        if (zwsp && zwsp.nodeType === 3) {
                            newRange.setStart(zwsp, zwsp.textContent.length);
                        } else {
                            newRange.setStart(firstTarget, 0);
                        }
                        newRange.collapse(true);
                    } else {
                        newRange.setStartBefore(firstTarget);
                        newRange.setEndAfter(lastTarget);
                    }
                    const sel = window.getSelection();
                    if (sel) {
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    }
                    this._savedRange = newRange.cloneRange();
                } catch (_) {}

                this.updateToolbarState();
                TextDocStateManager.pushHistory();
                DocStatsManager.update();
                MultiPageEngine.debouncePaginate();
                TextDocStateManager.triggerAutoSave();
                CollabPresenceManager.broadcastContent(MultiPageEngine.getCleanHTML(), TextDocStateManager.activeSheetIndex);
            } else {
                this._fontPreviewState = null;
                this.setFontFamily(cleanFont);
            }
        },

        execFormat(command, value = null) {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const editor = MultiPageEngine.getActiveEditor();
            if (editor && document.activeElement !== editor) editor.focus({ preventScroll: true });

            const isSemanticInline = ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript'].includes(command);

            try {
                // Para comandos semánticos (negrita, cursiva, subrayado, etc.) usar styleWithCSS: false
                // de modo que Chromium use tags semánticos nativos (b, i, u, strike, sub, sup)
                // y mantenga de forma natural el typing style acumulado para lo que se escriba a continuación.
                document.execCommand('styleWithCSS', false, !isSemanticInline);
            } catch (_) {}

            document.execCommand(command, false, value);
            this.saveActiveSelection(true);
            this.updateToolbarState();
            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            MultiPageEngine.debouncePaginate();
        },

        setFontFamily(fontName) {
            if (window.isAuditMode || !fontName) return;
            this._fontPreviewState = null;
            this._savedPreviewSpan = null;
            const cleanFont = fontName.trim().replace(/^['"]|['"]$/g, '');
            if (!cleanFont) return;

            if (typeof window.ensureGoogleFontLoaded === 'function') {
                window.ensureGoogleFontLoaded(cleanFont);
            }

            this.restoreActiveSelection();
            const editor = MultiPageEngine.getActiveEditor();
            if (editor && document.activeElement !== editor) {
                editor.focus({ preventScroll: true });
            }

            const sel = window.getSelection();
            const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : this._savedRange;
            const hasSelection = range && !range.collapsed && range.toString().trim().length > 0;

            if (hasSelection) {
                try {
                    document.execCommand('styleWithCSS', false, true);
                } catch (_) {}

                document.execCommand('fontName', false, cleanFont);

                // Normalizar elementos <font face="..."> generados por navegadores a <span style="font-family: ...">
                const container = MultiPageEngine.getContainer() || document.body;
                const createdSpans = [];

                container.querySelectorAll('font[face]').forEach(f => {
                    const span = document.createElement('span');
                    span.style.fontFamily = `'${cleanFont}', sans-serif`;
                    if (f.style.cssText) span.style.cssText += ';' + f.style.cssText;
                    span.style.fontFamily = `'${cleanFont}', sans-serif`;
                    while (f.firstChild) span.appendChild(f.firstChild);

                    span.querySelectorAll('span[style*="font-family"], font').forEach(nested => {
                        nested.style.fontFamily = `'${cleanFont}', sans-serif`;
                        nested.removeAttribute('face');
                    });

                    f.parentNode?.replaceChild(span, f);
                    createdSpans.push(span);
                });

                // Normalizar spans directos que tengan font-family aplicado
                container.querySelectorAll('span[style*="font-family"]').forEach(s => {
                    if (s.style.fontFamily && s.style.fontFamily.toLowerCase().includes(cleanFont.toLowerCase())) {
                        s.style.fontFamily = `'${cleanFont}', sans-serif`;
                        if (!createdSpans.includes(s)) createdSpans.push(s);
                    }
                });

                if (createdSpans.length > 0) {
                    try {
                        const newRange = document.createRange();
                        newRange.setStartBefore(createdSpans[0]);
                        newRange.setEndAfter(createdSpans[createdSpans.length - 1]);
                        const selNow = window.getSelection();
                        if (selNow) {
                            selNow.removeAllRanges();
                            selNow.addRange(newRange);
                        }
                        this._savedRange = newRange.cloneRange();
                    } catch (_) {
                        this.saveActiveSelection(true);
                    }
                } else {
                    this.saveActiveSelection(true);
                }
            } else {
                // Caso B: Selección colapsada - aplicar al span pendiente para lo que se escriba a continuación
                const span = this.getOrCreatePendingSpan();
                if (span) {
                    span.style.fontFamily = `'${cleanFont}', sans-serif`;
                    const zwsp = span.firstChild;
                    const newRange = document.createRange();
                    if (zwsp && zwsp.nodeType === 3) {
                        newRange.setStart(zwsp, zwsp.textContent.length);
                    } else {
                        newRange.setStart(span, 0);
                    }
                    newRange.collapse(true);
                    const selNow = window.getSelection();
                    if (selNow) {
                        selNow.removeAllRanges();
                        selNow.addRange(newRange);
                    }
                    this._savedRange = newRange.cloneRange();
                }
                const ed = this._savedEditor || MultiPageEngine.getActiveEditor();
                if (ed && document.activeElement !== ed) {
                    ed.focus({ preventScroll: true });
                }
            }

            // Sincronizar el selector de fuentes en la barra y su trigger Glassmorphic
            const fontSelect = document.getElementById('font-family-select');
            if (fontSelect) {
                fontSelect.value = cleanFont;
                if (fontSelect._glassInstance) {
                    fontSelect._glassInstance.updateTriggerLabel();
                }
            }

            this.updateToolbarState();
            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
            CollabPresenceManager.broadcastContent(MultiPageEngine.getCleanHTML(), TextDocStateManager.activeSheetIndex);
        },

        // =====================================================================
        // PREVISUALIZACIÓN DE TAMAÑO DE FUENTE EN TIEMPO REAL
        // =====================================================================
        beginFontSizePreview() {
            if (window.isAuditMode) return;
            this.saveActiveSelection(false);
            if (!this._savedRange) return;

            this.cancelFontSizePreview();

            try {
                const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                this.restoreActiveSelection();
                const sel = window.getSelection();
                const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : this._savedRange;
                const hasSelection = range && !range.collapsed && range.toString().trim().length > 0;

                if (hasSelection) {
                    let origNode = range.startContainer;
                    if (origNode && origNode.nodeType === 3) origNode = origNode.parentElement;
                    const origComp = origNode ? window.getComputedStyle(origNode) : null;
                    const origPt = origComp?.fontSize ? Math.round(parseFloat(origComp.fontSize) * 0.75) : 16;
                    const origSize = `${origPt}pt`;

                    const TEMP_SIZE_MARKER = '7';
                    try {
                        document.execCommand('styleWithCSS', false, false);
                    } catch (_) {}
                    document.execCommand('fontSize', false, TEMP_SIZE_MARKER);

                    const container = MultiPageEngine.getContainer() || document.body;

                    const createdTargets = [];
                    container.querySelectorAll('font[size="7"], font[size]').forEach(f => {
                        const span = document.createElement('span');
                        span.className = 'educonta-font-size-preview-target';
                        span.dataset.origSize = origSize;
                        span.style.fontSize = origSize;
                        if (f.style.cssText) span.style.cssText += ';' + f.style.cssText;
                        while (f.firstChild) span.appendChild(f.firstChild);
                        f.parentNode?.replaceChild(span, f);
                        createdTargets.push(span);
                    });

                    container.querySelectorAll('span[style*="xxx-large"]').forEach(s => {
                        s.classList.add('educonta-font-size-preview-target');
                        s.dataset.origSize = origSize;
                        s.style.fontSize = origSize;
                        if (!createdTargets.includes(s)) createdTargets.push(s);
                    });

                    if (createdTargets.length > 0) {
                        const newRange = document.createRange();
                        newRange.setStartBefore(createdTargets[0]);
                        newRange.setEndAfter(createdTargets[createdTargets.length - 1]);
                        if (sel) {
                            sel.removeAllRanges();
                            sel.addRange(newRange);
                        }
                        this._savedRange = newRange.cloneRange();
                    } else {
                        this.saveActiveSelection(true);
                    }

                    this._fontSizePreviewState = {
                        type: 'selection',
                        originalSize: origSize,
                        activeEditor: editor
                    };
                } else {
                    // Selección colapsada: preparar span pendiente en el cursor
                    const pendingSpan = this.getOrCreatePendingSpan();
                    if (pendingSpan) {
                        const comp = window.getComputedStyle(pendingSpan);
                        const origPt = comp?.fontSize ? Math.round(parseFloat(comp.fontSize) * 0.75) : 16;
                        const origSize = `${origPt}pt`;
                        pendingSpan.classList.add('educonta-font-size-preview-target');
                        pendingSpan.dataset.origSize = pendingSpan.style.fontSize || origSize;

                        this._fontSizePreviewState = {
                            type: 'pending',
                            target: pendingSpan,
                            targets: [pendingSpan],
                            originalSize: pendingSpan.dataset.origSize,
                            activeEditor: editor,
                            isCollapsed: true
                        };
                    }
                }
            } catch (err) {
                console.warn('beginFontSizePreview error:', err);
            }
        },

        previewFontSize(size) {
            if (window.isAuditMode || !size) return;
            const rawSize = String(size).replace(/[^0-9]/g, '');
            const numSize = parseInt(rawSize, 10) || 16;
            const formattedSize = `${numSize}pt`;

            if (!this._fontSizePreviewState) {
                this.beginFontSizePreview();
            }

            const previewTargets = document.querySelectorAll('.educonta-font-size-preview-target');
            if (previewTargets.length > 0) {
                previewTargets.forEach(el => {
                    el.style.fontSize = formattedSize;
                    el.querySelectorAll('span[style*="font-size"], font').forEach(nested => {
                        nested.style.fontSize = formattedSize;
                    });
                });
                // Recalcular paginación dinámica si el nuevo tamaño empuja texto a otra página
                MultiPageEngine.debouncePaginate();
            }
        },

        cancelFontSizePreview(fullCleanup = false) {
            if (!this._fontSizePreviewState) return;
            const previewTargets = document.querySelectorAll('.educonta-font-size-preview-target');
            if (previewTargets.length > 0) {
                const firstTarget = previewTargets[0];
                const lastTarget = previewTargets[previewTargets.length - 1];
                previewTargets.forEach(el => {
                    const orig = el.dataset.origSize;
                    if (orig) {
                        el.style.fontSize = orig;
                    } else {
                        el.style.fontSize = '';
                    }
                    el.querySelectorAll('span[style*="font-size"], font').forEach(nested => {
                        nested.style.fontSize = el.style.fontSize;
                    });
                    if (fullCleanup) {
                        el.classList.remove('educonta-font-size-preview-target');
                        delete el.dataset.origSize;
                    }
                });
                try {
                    const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                    if (editor) editor.focus({ preventScroll: true });
                    const newRange = document.createRange();
                    if (firstTarget.dataset?.ecPending === "true") {
                        const zwsp = firstTarget.firstChild;
                        newRange.setStart(zwsp || firstTarget, 1);
                        newRange.collapse(true);
                    } else {
                        newRange.setStartBefore(firstTarget);
                        newRange.setEndAfter(lastTarget);
                    }
                    const sel = window.getSelection();
                    if (sel) {
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    }
                    this._savedRange = newRange.cloneRange();
                } catch (_) {}
                MultiPageEngine.debouncePaginate();
            }
            if (fullCleanup) {
                this._fontSizePreviewState = null;
            }
            this.restoreActiveSelection();
        },

        commitFontSizePreview(size) {
            const rawSize = String(size).replace(/[^0-9]/g, '');
            const numSize = parseInt(rawSize, 10) || 16;
            const formattedSize = `${numSize}pt`;

            const previewTargets = document.querySelectorAll('.educonta-font-size-preview-target');
            if (previewTargets.length > 0) {
                const firstTarget = previewTargets[0];
                const lastTarget = previewTargets[previewTargets.length - 1];

                previewTargets.forEach(el => {
                    el.style.fontSize = formattedSize;
                    el.classList.remove('educonta-font-size-preview-target');
                    delete el.dataset.origSize;

                    el.querySelectorAll('span[style*="font-size"], font').forEach(nested => {
                        nested.style.fontSize = formattedSize;
                        nested.removeAttribute('size');
                    });
                });

                this._fontSizePreviewState = null;

                const sizeSelect = document.getElementById('font-size-select');
                if (sizeSelect) {
                    const optExists = Array.from(sizeSelect.options).some(o => o.value === String(numSize));
                    if (!optExists) {
                        const newOpt = document.createElement('option');
                        newOpt.value = String(numSize);
                        newOpt.textContent = String(numSize);
                        sizeSelect.appendChild(newOpt);
                    }
                    sizeSelect.value = String(numSize);
                    if (sizeSelect._glassInstance) {
                        sizeSelect._glassInstance.updateTriggerLabel();
                    }
                }

                // Re-seleccionar el rango completo modificado para que el texto siga seleccionado o posicionar caret en pending
                try {
                    const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                    if (editor) editor.focus({ preventScroll: true });
                    const newRange = document.createRange();
                    if (firstTarget.dataset?.ecPending === "true") {
                        const zwsp = firstTarget.firstChild;
                        newRange.setStart(zwsp || firstTarget, 1);
                        newRange.collapse(true);
                    } else {
                        newRange.setStartBefore(firstTarget);
                        newRange.setEndAfter(lastTarget);
                    }
                    const sel = window.getSelection();
                    if (sel) {
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    }
                    this._savedRange = newRange.cloneRange();
                } catch (_) {}

                this.updateToolbarState();
                TextDocStateManager.pushHistory();
                DocStatsManager.update();
                MultiPageEngine.debouncePaginate();
                TextDocStateManager.triggerAutoSave();
                CollabPresenceManager.broadcastContent(MultiPageEngine.getCleanHTML(), TextDocStateManager.activeSheetIndex);
            } else {
                this._fontSizePreviewState = null;
                this.setFontSize(size);
            }
        },

        setFontSize(size) {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const editor = MultiPageEngine.getActiveEditor();
            if (editor && document.activeElement !== editor) {
                editor.focus({ preventScroll: true });
            }

            const rawSize = String(size).replace(/[^0-9]/g, '');
            const numSize = parseInt(rawSize, 10) || 16;
            const formattedSize = `${numSize}pt`;

            const sel = window.getSelection();
            const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : this._savedRange;
            const hasSelection = range && !range.collapsed && range.toString().trim().length > 0;

            if (hasSelection) {
                try {
                    document.execCommand('styleWithCSS', false, false);
                } catch (_) {}

                // Ejecutar comando fontSize con marcador 7
                document.execCommand('fontSize', false, '7');

                const container = MultiPageEngine.getContainer() || document.body;
                const createdSpans = [];

                // Reemplazar <font size="7"> y <font size> por <span style="font-size: ${formattedSize}">
                container.querySelectorAll('font[size="7"], font[size]').forEach(f => {
                    const span = document.createElement('span');
                    span.style.fontSize = formattedSize;
                    if (f.style.cssText) span.style.cssText += ';' + f.style.cssText;
                    span.style.fontSize = formattedSize;
                    while (f.firstChild) span.appendChild(f.firstChild);

                    // Sobrescribir cualquier span anidado previo
                    span.querySelectorAll('span[style*="font-size"], font').forEach(nested => {
                        nested.style.fontSize = formattedSize;
                        nested.removeAttribute('size');
                    });

                    f.parentNode?.replaceChild(span, f);
                    createdSpans.push(span);
                });

                // Si el navegador generó spans con style="font-size: xxx-large" o similar
                container.querySelectorAll('span[style*="font-size"]').forEach(s => {
                    const fs = s.style.fontSize;
                    if (fs === 'xxx-large' || fs === '-webkit-xxx-large' || fs === '7' || s.getAttribute('size') === '7' || (fs && fs.includes('xxx-large'))) {
                        s.style.fontSize = formattedSize;
                        s.removeAttribute('size');
                        if (!createdSpans.includes(s)) createdSpans.push(s);
                    }
                });

                if (createdSpans.length > 0) {
                    try {
                        const newRange = document.createRange();
                        newRange.setStartBefore(createdSpans[0]);
                        newRange.setEndAfter(createdSpans[createdSpans.length - 1]);
                        const selNow = window.getSelection();
                        if (selNow) {
                            selNow.removeAllRanges();
                            selNow.addRange(newRange);
                        }
                        this._savedRange = newRange.cloneRange();
                    } catch (_) {
                        this.saveActiveSelection(true);
                    }
                } else {
                    this.saveActiveSelection(true);
                }
            } else {
                // Caso B: Sin texto seleccionado, aplicar al span pendiente para lo que se escriba a continuación
                const span = this.getOrCreatePendingSpan();
                if (span) {
                    span.style.fontSize = formattedSize;
                }
                const ed = this._savedEditor || MultiPageEngine.getActiveEditor();
                if (ed && document.activeElement !== ed) {
                    ed.focus({ preventScroll: true });
                }
            }

            // Sincronizar el selector de tamaño y su trigger Glassmorphic
            const sizeSelect = document.getElementById('font-size-select');
            if (sizeSelect) {
                const optExists = Array.from(sizeSelect.options).some(o => o.value === String(numSize));
                if (!optExists) {
                    const newOpt = document.createElement('option');
                    newOpt.value = String(numSize);
                    newOpt.textContent = String(numSize);
                    sizeSelect.appendChild(newOpt);
                }
                sizeSelect.value = String(numSize);
                if (sizeSelect._glassInstance) {
                    sizeSelect._glassInstance.updateTriggerLabel();
                }
            }

            this.updateToolbarState();
            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
            CollabPresenceManager.broadcastContent(MultiPageEngine.getCleanHTML(), TextDocStateManager.activeSheetIndex);
        },

        changeFontSize(delta) {
            if (window.isAuditMode) return;
            const SIZES = [10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];
            const sizeSelect = document.getElementById('font-size-select');
            let current = 16;
            if (sizeSelect && sizeSelect.value) {
                current = parseInt(sizeSelect.value, 10) || 16;
            } else {
                const sel = window.getSelection();
                let node = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
                if (node) {
                    const comp = window.getComputedStyle(node);
                    if (comp && comp.fontSize) {
                        current = Math.round(parseFloat(comp.fontSize) * 0.75) || 16;
                    }
                }
            }

            let nextSize = current;
            if (delta > 0) {
                nextSize = SIZES.find(s => s > current) || (current + 2);
            } else {
                const smaller = SIZES.filter(s => s < current);
                nextSize = smaller.length > 0 ? smaller[smaller.length - 1] : Math.max(8, current - 2);
            }

            this.setFontSize(nextSize);
        },

        setTextColor(color) {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const sel = window.getSelection();
            const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : this._savedRange;
            const isCollapsed = !range || range.collapsed || range.toString().length === 0;

            const ind = document.getElementById('indicator-text-color');
            if (ind) ind.style.backgroundColor = color || '#1e293b';

            if (isCollapsed && range) {
                // Caso 1: Cursor colapsado (nada seleccionado)
                // Lo siguiente que se escriba DEBE ser en este color
                const span = this.getOrCreatePendingSpan();
                if (span) {
                    span.style.color = color || '#1e293b';
                }

                // Redundancia nativa con execCommand
                try {
                    document.execCommand('styleWithCSS', false, true);
                    document.execCommand('foreColor', false, color || '#1e293b');
                } catch (_) {}

                const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                if (editor && document.activeElement !== editor) editor.focus({ preventScroll: true });

                this.hideSelectionTemporarily(800);
                this.updateToolbarState();
                return;
            }

            // Caso 2: Texto seleccionado
            if (this._colorPreviewState && this._colorPreviewState.targets && this._colorPreviewState.targets.length > 0) {
                this.commitColorPreview(color, 'text');
                return;
            }

            try {
                document.execCommand('styleWithCSS', false, true);
            } catch (_) {}
            this.execFormat('foreColor', color || '#1e293b');

            const container = MultiPageEngine.getContainer() || document.body;
            container.querySelectorAll('font[color]').forEach(f => {
                const span = document.createElement('span');
                span.style.color = color || '#1e293b';
                if (f.style.cssText) span.style.cssText += ';' + f.style.cssText;
                while (f.firstChild) span.appendChild(f.firstChild);
                f.parentNode?.replaceChild(span, f);
            });

            this.hideSelectionTemporarily(800);
            this.restoreActiveSelection();
        },

        setHighlightColor(color) {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const sel = window.getSelection();
            const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : this._savedRange;
            const isCollapsed = !range || range.collapsed || range.toString().length === 0;

            const ind = document.getElementById('indicator-bg-color');
            if (ind) ind.style.backgroundColor = color || '#f59e0b';

            let node = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
            const activeCell = node ? node.closest('td, th') : null;

            if (activeCell && isCollapsed) {
                activeCell.style.backgroundColor = color || 'transparent';
                this.hideSelectionTemporarily(800);
                TextDocStateManager.pushHistory();
                TextDocStateManager.triggerAutoSave();
                return;
            }

            if (isCollapsed && range) {
                const span = this.getOrCreatePendingSpan();
                if (span) {
                    span.style.backgroundColor = color || 'transparent';
                }

                try {
                    document.execCommand('styleWithCSS', false, true);
                    if (!document.execCommand('hiliteColor', false, color || 'transparent')) {
                        document.execCommand('backColor', false, color || 'transparent');
                    }
                } catch (_) {}

                const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                if (editor && document.activeElement !== editor) editor.focus({ preventScroll: true });

                this.hideSelectionTemporarily(800);
                this.updateToolbarState();
                return;
            }

            if (this._colorPreviewState && this._colorPreviewState.targets && this._colorPreviewState.targets.length > 0) {
                this.commitColorPreview(color, 'bg');
                return;
            }

            try {
                document.execCommand('styleWithCSS', false, true);
            } catch (_) {}
            this.execFormat('hiliteColor', color || 'transparent');
            this.hideSelectionTemporarily(800);
            this.restoreActiveSelection();
        },

        setBlockStyle(tag) {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            if (tag.startsWith('callout-')) {
                const type = tag.replace('callout-', '');
                this.insertCallout(type);
                return;
            }

            if (tag === 'p') {
                this.execFormat('formatBlock', '<p>');
            } else if (tag === 'h1') {
                this.execFormat('formatBlock', '<h1>');
            } else if (tag === 'h2') {
                this.execFormat('formatBlock', '<h2>');
            } else if (tag === 'h3') {
                this.execFormat('formatBlock', '<h3>');
            } else if (tag === 'blockquote') {
                this.execFormat('formatBlock', '<blockquote>');
            }
        },

        toggleBlockquote() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const sel = window.getSelection();
            let node = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
            const existingQuote = node ? node.closest('blockquote') : null;
            if (existingQuote) {
                this.execFormat('formatBlock', '<p>');
            } else {
                this.execFormat('formatBlock', '<blockquote>');
            }
        },

        insertChecklist() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const ul = document.createElement('ul');
            ul.className = 'task-list my-2 space-y-1';
            ul.style.listStyleType = 'none';
            ul.style.paddingLeft = '1.25rem';

            const li = document.createElement('li');
            li.className = 'task-list-item flex items-center gap-2';
            li.innerHTML = '<input type="checkbox" class="rounded text-amber-500 focus:ring-amber-400 cursor-pointer" onchange="this.toggleAttribute(\'checked\', this.checked); window.TextDocStateManager?.triggerAutoSave();"> <span>Tarea pendiente...</span>';
            ul.appendChild(li);

            const p = document.createElement('p');
            p.innerHTML = '<br>';
            const frag = document.createDocumentFragment();
            frag.appendChild(ul);
            frag.appendChild(p);

            this.insertNodeAtCursor(frag);
            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
        },

        insertHorizontalRule() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const hr = document.createElement('hr');
            hr.className = 'my-4 border-t border-slate-300 dark:border-slate-700';
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            const frag = document.createDocumentFragment();
            frag.appendChild(hr);
            frag.appendChild(p);

            this.insertNodeAtCursor(frag);
            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
        },

        insertCallout(type) {
            const selection = window.getSelection();
            const text = (selection && !selection.isCollapsed) ? selection.toString() : 'Nota importante contable / fiscal...';
            const div = document.createElement('div');
            div.className = `edu-callout ${type}`;
            div.innerHTML = `<strong>${type.toUpperCase()}:</strong> ${text}`;
            this.insertNodeAtCursor(div);
            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
        },

        toggleInlineCode() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const editor = MultiPageEngine.getActiveEditor();
            if (editor && document.activeElement !== editor) editor.focus({ preventScroll: true });

            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const container = MultiPageEngine.getContainer();
            if (!container || !container.contains(range.commonAncestorContainer)) return;

            let node = range.commonAncestorContainer;
            if (node.nodeType === 3) node = node.parentElement;
            const existingCode = node ? node.closest('code') : null;

            if (existingCode) {
                if (existingCode.textContent === '\u200B' || existingCode.textContent.trim() === '') {
                    const newRange = document.createRange();
                    newRange.setStartBefore(existingCode);
                    newRange.collapse(true);
                    existingCode.remove();
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    this._savedRange = newRange.cloneRange();
                } else {
                    const parent = existingCode.parentNode;
                    const frag = document.createDocumentFragment();
                    let firstChild = null;
                    let lastChild = null;
                    while (existingCode.firstChild) {
                        const child = existingCode.firstChild;
                        if (!firstChild) firstChild = child;
                        lastChild = child;
                        frag.appendChild(child);
                    }
                    if (parent) {
                        parent.replaceChild(frag, existingCode);
                        if (firstChild && lastChild) {
                            const newRange = document.createRange();
                            newRange.setStartBefore(firstChild);
                            newRange.setEndAfter(lastChild);
                            selection.removeAllRanges();
                            selection.addRange(newRange);
                            this._savedRange = newRange.cloneRange();
                        }
                    }
                }
            } else {
                const selectedText = range.toString();
                if (selectedText.length > 0) {
                    const code = document.createElement('code');
                    code.className = 'educonta-inline-code font-mono text-[0.9em] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 border border-slate-200 dark:border-slate-700';
                    code.appendChild(range.extractContents());
                    range.insertNode(code);

                    const newRange = document.createRange();
                    newRange.setStartAfter(code);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    this._savedRange = newRange.cloneRange();
                } else {
                    const code = document.createElement('code');
                    code.className = 'educonta-inline-code font-mono text-[0.9em] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 border border-slate-200 dark:border-slate-700';
                    code.dataset.ecPendingCode = "true";
                    const zwsp = document.createTextNode('\u200B');
                    code.appendChild(zwsp);
                    range.insertNode(code);

                    const newRange = document.createRange();
                    newRange.setStart(zwsp, 1);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    this._savedRange = newRange.cloneRange();
                }
            }

            this.updateToolbarState();
            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            MultiPageEngine.debouncePaginate();
        },

        clearFormatting() {
            if (window.isAuditMode) return;
            this.execFormat('removeFormat');
            this.execFormat('formatBlock', '<p>');
            MultiPageEngine.debouncePaginate();
        },

        insertTextAtCursor(text) {
            if (window.isAuditMode) return;
            document.execCommand('insertText', false, text);
            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
        },

        insertNodeAtCursor(node) {
            const editor = MultiPageEngine.getActiveEditor();
            if (!editor) return;

            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0 || !editor.contains(selection.anchorNode)) {
                editor.appendChild(node);
                return;
            }

            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(node);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        },

        openTableModal() {
            const modal = document.getElementById('table-modal');
            if (modal) modal.style.display = 'flex';
        },
        closeTableModal() {
            const modal = document.getElementById('table-modal');
            if (modal) modal.style.display = 'none';
        },
        confirmInsertTable() {
            const rows = parseInt(document.getElementById('table-input-rows')?.value, 10) || 3;
            const cols = parseInt(document.getElementById('table-input-cols')?.value, 10) || 3;
            const withHeader = document.getElementById('table-input-header')?.checked ?? true;
            const styleClass = document.getElementById('table-input-style')?.value || 'table-striped';

            const table = document.createElement('table');
            table.className = styleClass;

            if (withHeader) {
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                for (let c = 0; c < cols; c++) {
                    const th = document.createElement('th');
                    th.textContent = `Columna ${c + 1}`;
                    headerRow.appendChild(th);
                }
                thead.appendChild(headerRow);
                table.appendChild(thead);
            }

            const tbody = document.createElement('tbody');
            for (let r = 0; r < rows; r++) {
                const tr = document.createElement('tr');
                for (let c = 0; c < cols; c++) {
                    const td = document.createElement('td');
                    td.innerHTML = '<br>';
                    tr.appendChild(td);
                }
                tbody.appendChild(tr);
            }
            table.appendChild(tbody);

            const p = document.createElement('p');
            p.innerHTML = '<br>';

            const fragment = document.createDocumentFragment();
            fragment.appendChild(table);
            fragment.appendChild(p);

            this.insertNodeAtCursor(fragment);
            this.closeTableModal();
            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.showToast('Tabla insertada');
        },

        insertTextBox() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const box = document.createElement('div');
            box.className = 'doc-text-box';
            box.innerHTML = '<p><strong>Nota o Sección Destacada:</strong> Escriba aquí el contenido del cuadro de texto...</p>';

            const p = document.createElement('p');
            p.innerHTML = '<br>';

            const frag = document.createDocumentFragment();
            frag.appendChild(box);
            frag.appendChild(p);

            this.insertNodeAtCursor(frag);
            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
            TextDocStateManager.showToast('Cuadro de texto insertado');
        },

        openShapesModal() {
            const modal = document.getElementById('shapes-modal');
            if (modal) modal.style.display = 'flex';
        },
        closeShapesModal() {
            const modal = document.getElementById('shapes-modal');
            if (modal) modal.style.display = 'none';
        },
        insertShape(type) {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            let nodeToInsert = null;

            if (type === 'signature_single') {
                const div = document.createElement('div');
                div.className = 'doc-signature-block';
                div.innerHTML = `
                    <div style="display: block; width: 280px; margin: 32px auto 16px auto; text-align: center;">
                        <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 100%; margin-bottom: 6px;"></div>
                        <p style="margin: 0; font-weight: 700;">[NOMBRE DEL FIRMANTE]</p>
                        <p style="margin: 0; font-size: 0.85em; color: #64748b;">Representante Legal / Gerente General</p>
                    </div>
                `;
                nodeToInsert = div;
            } else if (type === 'signature_dual') {
                const table = document.createElement('table');
                table.className = 'table-borderless doc-signature-table';
                table.style.width = '100%';
                table.style.border = 'none';
                table.style.margin = '32px 0 16px 0';
                table.innerHTML = `
                    <tbody>
                        <tr>
                            <td style="width: 48%; text-align: center; border: none; padding: 0 12px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 240px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">EL CONTRATANTE</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Firma y Sello</p>
                            </td>
                            <td style="width: 4%; border: none;"></td>
                            <td style="width: 48%; text-align: center; border: none; padding: 0 12px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 240px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">EL CONTRATISTA</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Firma y Sello</p>
                            </td>
                        </tr>
                    </tbody>
                `;
                nodeToInsert = table;
            } else if (type === 'signature_triple') {
                const table = document.createElement('table');
                table.className = 'table-borderless doc-signature-table';
                table.style.width = '100%';
                table.style.border = 'none';
                table.style.margin = '32px 0 16px 0';
                table.innerHTML = `
                    <tbody>
                        <tr>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Elaborado por</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Encargado(a)</p>
                            </td>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Revisado por</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Auditoría / Calidad</p>
                            </td>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Autorizado por</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Gerencia General</p>
                            </td>
                        </tr>
                    </tbody>
                `;
                nodeToInsert = table;
            } else if (type === 'divider_accent') {
                const hr = document.createElement('hr');
                hr.className = 'doc-accent-rule';
                nodeToInsert = hr;
            } else if (type === 'badge_approved') {
                const span = document.createElement('span');
                span.className = 'doc-badge doc-badge-emerald';
                span.textContent = 'CONFORME / APROBADO';
                nodeToInsert = span;
            } else if (type === 'badge_reviewed') {
                const span = document.createElement('span');
                span.className = 'doc-badge doc-badge-sky';
                span.textContent = 'REVISADO / AUDITADO';
                nodeToInsert = span;
            } else if (type === 'badge_confidential') {
                const span = document.createElement('span');
                span.className = 'doc-badge doc-badge-amber';
                span.textContent = 'CONFIDENCIAL';
                nodeToInsert = span;
            } else if (type === 'badge_void') {
                const span = document.createElement('span');
                span.className = 'doc-badge doc-badge-rose';
                span.textContent = 'ANULADO';
                nodeToInsert = span;
            } else if (type === 'circle_numbered') {
                const span = document.createElement('span');
                span.className = 'doc-circle-step';
                span.textContent = '1';
                nodeToInsert = span;
            } else if (type === 'callout_box') {
                const callout = document.createElement('div');
                callout.className = 'edu-callout info';
                callout.innerHTML = '<p><strong>Aviso Importante:</strong> Ingrese aquí las notas o consideraciones legales/contables...</p>';
                nodeToInsert = callout;
            }

            if (nodeToInsert) {
                const frag = document.createDocumentFragment();
                frag.appendChild(nodeToInsert);
                const p = document.createElement('p');
                p.innerHTML = '<br>';
                frag.appendChild(p);

                this.insertNodeAtCursor(frag);
                TextDocStateManager.pushHistory();
                MultiPageEngine.debouncePaginate();
                TextDocStateManager.triggerAutoSave();
                TextDocStateManager.showToast('Elemento insertado');
            }
            this.closeShapesModal();
        },

        insertTableRow() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const sel = window.getSelection();
            let anchor = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
            let currentCell = anchor ? anchor.closest('td, th') : null;
            let currentRow = anchor ? anchor.closest('tr') : null;
            let table = anchor ? anchor.closest('table') : null;

            if (!table) {
                this.confirmInsertTable();
                return;
            }

            const colCount = currentRow ? currentRow.children.length : (table.rows[0] ? table.rows[0].children.length : 3);
            const newRow = document.createElement('tr');
            for (let i = 0; i < colCount; i++) {
                const td = document.createElement('td');
                td.innerHTML = '<br>';
                newRow.appendChild(td);
            }

            if (currentRow && currentRow.parentNode) {
                currentRow.parentNode.insertBefore(newRow, currentRow.nextSibling);
            } else {
                const tbody = table.querySelector('tbody') || table;
                tbody.appendChild(newRow);
            }

            const firstTd = newRow.querySelector('td');
            if (firstTd) {
                const range = document.createRange();
                range.selectNodeContents(firstTd);
                range.collapse(true);
                const selNow = window.getSelection();
                if (selNow) {
                    selNow.removeAllRanges();
                    selNow.addRange(range);
                }
                this.saveActiveSelection(true);
            }

            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
        },

        insertTableCol() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const sel = window.getSelection();
            let anchor = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
            let currentCell = anchor ? anchor.closest('td, th') : null;
            let table = anchor ? anchor.closest('table') : null;

            if (!table) {
                this.confirmInsertTable();
                return;
            }

            const colIndex = currentCell ? currentCell.cellIndex : (table.rows[0] ? table.rows[0].children.length - 1 : 0);

            Array.from(table.rows).forEach((row) => {
                const isHeader = (row.parentElement && row.parentElement.tagName.toLowerCase() === 'thead') || row.firstElementChild?.tagName.toLowerCase() === 'th';
                const newCell = document.createElement(isHeader ? 'th' : 'td');
                newCell.innerHTML = isHeader ? 'Columna' : '<br>';
                
                if (colIndex >= 0 && row.children[colIndex]) {
                    row.insertBefore(newCell, row.children[colIndex].nextSibling);
                } else {
                    row.appendChild(newCell);
                }
            });

            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
        },

        deleteTableRow() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const sel = window.getSelection();
            let anchor = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
            let currentRow = anchor ? anchor.closest('tr') : null;
            let table = anchor ? anchor.closest('table') : null;

            if (!table || !currentRow) return;

            if (table.rows.length <= 1) {
                table.remove();
            } else {
                currentRow.remove();
            }

            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
        },

        deleteTableCol() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const sel = window.getSelection();
            let anchor = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
            let currentCell = anchor ? anchor.closest('td, th') : null;
            let table = anchor ? anchor.closest('table') : null;

            if (!table || !currentCell) return;

            const colIndex = currentCell.cellIndex;
            const rows = Array.from(table.rows);

            if (rows[0] && rows[0].children.length <= 1) {
                table.remove();
            } else {
                rows.forEach(row => {
                    if (row.children[colIndex]) {
                        row.children[colIndex].remove();
                    }
                });
            }

            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
        },

        openLinkModal() {
            const modal = document.getElementById('link-modal');
            const selection = window.getSelection();
            const textInput = document.getElementById('link-input-text');
            if (textInput && selection) {
                textInput.value = selection.toString();
            }
            if (modal) modal.style.display = 'flex';
        },
        closeLinkModal() {
            const modal = document.getElementById('link-modal');
            if (modal) modal.style.display = 'none';
        },
        confirmInsertLink() {
            const text = document.getElementById('link-input-text')?.value.trim() || 'Enlace';
            const url = document.getElementById('link-input-url')?.value.trim() || 'https://';
            if (url && url !== 'https://') {
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = text;
                this.insertNodeAtCursor(a);
                TextDocStateManager.pushHistory();
            }
            this.closeLinkModal();
        },

        openImageModal() {
            const modal = document.getElementById('image-modal');
            if (!modal) return;
            // Limpiar inputs anteriores
            const fi = document.getElementById('image-input-file');
            const ui = document.getElementById('image-input-url');
            if (fi) fi.value = '';
            if (ui) ui.value = '';
            modal.style.display = 'flex';
        },
        closeImageModal() {
            const modal = document.getElementById('image-modal');
            if (modal) modal.style.display = 'none';
            // Resetear modo reemplazo
            if (window.ImageEditorManager) window.ImageEditorManager._isReplaceMode = false;
            const title = modal?.querySelector('h4');
            if (title) title.textContent = 'Insertar Imagen';
        },
        confirmInsertImage() {
            const fileInput = document.getElementById('image-input-file');
            const urlInput = document.getElementById('image-input-url');
            const isReplace = window.ImageEditorManager?._isReplaceMode && window.ImageLayerManager?.selectedImg;

            if (fileInput && fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (isReplace) {
                        window.ImageEditorManager.confirmReplaceImage(e.target.result);
                    } else {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.alt = 'Imagen cargada';
                        this.insertNodeAtCursor(img);
                    }
                    TextDocStateManager.pushHistory();
                    MultiPageEngine.debouncePaginate();
                };
                reader.readAsDataURL(fileInput.files[0]);
            } else if (urlInput && urlInput.value.trim() && urlInput.value.trim() !== 'https://') {
                if (isReplace) {
                    window.ImageEditorManager.confirmReplaceImage(urlInput.value.trim());
                } else {
                    const img = document.createElement('img');
                    img.src = urlInput.value.trim();
                    img.alt = 'Imagen web';
                    this.insertNodeAtCursor(img);
                }
                TextDocStateManager.pushHistory();
                MultiPageEngine.debouncePaginate();
            }

            this.closeImageModal();
        },

        openSymbolsModal() {
            const modal = document.getElementById('symbols-modal');
            if (modal) modal.style.display = 'flex';
        },
        closeSymbolsModal() {
            const modal = document.getElementById('symbols-modal');
            if (modal) modal.style.display = 'none';
        },

        handleSmartPaste(rawHtml) {
            if (!rawHtml) return;

            // ─── Paso 1: Sanear en un documento INERTE (lista blanca) ───
            //     EduSec.sanitizeHtmlString usa DOMParser: no ejecuta scripts ni
            //     dispara onerror/onload. Elimina etiquetas de Office (o:, v:, w:, m:),
            //     comentarios, atributos on*, URLs javascript: y etiquetas peligrosas.
            let clean;
            if (window.EduSec && typeof window.EduSec.sanitizeHtmlString === 'function') {
                clean = window.EduSec.sanitizeHtmlString(rawHtml);
            } else {
                // Respaldo seguro: insertar como texto plano si el sanitizador no cargó
                const plain = new DOMParser().parseFromString(String(rawHtml), 'text/html').body.textContent || '';
                document.execCommand('insertText', false, plain);
                TextDocStateManager.pushHistory();
                DocStatsManager.update();
                return;
            }

            // ─── Paso 2: Parsear (ya saneado) y limpiar selectivamente ───
            const temp = document.createElement('div');
            temp.innerHTML = clean;
            temp.querySelectorAll('script, iframe, object, embed, meta, link').forEach(el => el.remove());

            // Estilos visuales a PRESERVAR (formato de texto visible)
            const keepStyles = [
                'font-weight', 'font-style', 'font-size', 'font-family',
                'text-decoration', 'text-align', 'color', 'background-color',
                'vertical-align', 'text-transform', 'letter-spacing'
            ];

            temp.querySelectorAll('*').forEach(el => {
                Array.from(el.attributes).forEach(attr => {
                    const attrName = attr.name.toLowerCase();
                    const attrVal = String(attr.value || '').trim().toLowerCase();
                    if (attrName.startsWith('on') || ((attrName === 'href' || attrName === 'src' || attrName === 'xlink:href' || attrName === 'action' || attrName === 'formaction') && attrVal.startsWith('javascript:'))) {
                        el.removeAttribute(attr.name);
                    }
                });

                // Eliminar clases de Office (Mso*) pero preservar las demás
                if (el.className) {
                    const classes = el.className.split(/\s+/).filter(c => !c.startsWith('Mso'));
                    if (classes.length > 0) {
                        el.className = classes.join(' ');
                    } else {
                        el.removeAttribute('class');
                    }
                }

                // Para estilos: conservar solo los visuales, quitar los de layout de Office
                if (el.hasAttribute('style')) {
                    const original = el.style;
                    const preserved = [];
                    for (const prop of keepStyles) {
                        const val = original.getPropertyValue(prop);
                        if (val) preserved.push(`${prop}:${val}`);
                    }
                    if (preserved.length > 0) {
                        el.setAttribute('style', preserved.join(';'));
                    } else {
                        el.removeAttribute('style');
                    }
                }
            });

            // ─── Paso 3: Convertir <div> sueltos a <p> para consistencia ───
            temp.querySelectorAll(':scope > div').forEach(div => {
                // Solo convertir divs de nivel superior que no tienen hijos de bloque
                const hasBlockChild = div.querySelector('p, h1, h2, h3, h4, h5, h6, ul, ol, table, blockquote, pre');
                if (!hasBlockChild) {
                    const p = document.createElement('p');
                    p.innerHTML = div.innerHTML;
                    Array.from(div.attributes).forEach(a => {
                        if (a.name !== 'class') p.setAttribute(a.name, a.value);
                    });
                    div.replaceWith(p);
                } else {
                    // Div con bloques internos → desenvolver (mover hijos fuera)
                    div.replaceWith(...div.childNodes);
                }
            });

            // ─── Paso 4: Insertar el HTML limpio ───
            const finalHTML = temp.innerHTML.trim();
            if (!finalHTML) return;

            document.execCommand('insertHTML', false, finalHTML);
            TextDocStateManager.pushHistory();
            DocStatsManager.update();
        },

        updateToolbarState() {
            const isStateActive = (cmd) => {
                try { return document.queryCommandState(cmd); } catch (e) { return false; }
            };

            const toggle = (id, active) => {
                const el = document.getElementById(id);
                if (el) el.classList.toggle('active', !!active);
            };

            const sel = window.getSelection();
            let pendingSpan = null;
            let node = null;
            if (sel && sel.rangeCount > 0) {
                node = sel.anchorNode;
                if (node && node.nodeType === 3) node = node.parentElement;
                pendingSpan = node ? node.closest('span[data-ec-pending="true"], span[data-ec-pending-color="true"], span[data-ec-pending-bg="true"]') : null;
            }

            const isBoldActive = (pendingSpan && pendingSpan.style.fontWeight)
                ? (pendingSpan.style.fontWeight === 'bold' || pendingSpan.style.fontWeight === '700')
                : isStateActive('bold');

            const isItalicActive = (pendingSpan && pendingSpan.style.fontStyle)
                ? (pendingSpan.style.fontStyle === 'italic')
                : isStateActive('italic');

            const isUnderlineActive = (pendingSpan && pendingSpan.style.textDecoration)
                ? pendingSpan.style.textDecoration.includes('underline')
                : isStateActive('underline');

            const isStrikeActive = (pendingSpan && pendingSpan.style.textDecoration)
                ? pendingSpan.style.textDecoration.includes('line-through')
                : isStateActive('strikeThrough');

            const isSupActive = (pendingSpan && pendingSpan.style.verticalAlign)
                ? (pendingSpan.style.verticalAlign === 'super')
                : isStateActive('superscript');

            const isSubActive = (pendingSpan && pendingSpan.style.verticalAlign)
                ? (pendingSpan.style.verticalAlign === 'sub')
                : isStateActive('subscript');

            toggle('btn-bold', isBoldActive);
            toggle('btn-italic', isItalicActive);
            toggle('btn-underline', isUnderlineActive);
            toggle('btn-strike', isStrikeActive);
            toggle('btn-sup', isSupActive);
            toggle('btn-sub', isSubActive);
            const isCodeActive = !!(node && (node.closest('code') || (pendingSpan && pendingSpan.dataset.ecPendingCode === "true")));
            toggle('btn-code', isCodeActive);
            toggle('btn-align-left', isStateActive('justifyLeft'));
            toggle('btn-align-center', isStateActive('justifyCenter'));
            toggle('btn-align-right', isStateActive('justifyRight'));
            toggle('btn-align-justify', isStateActive('justifyFull'));
            toggle('btn-list-ul', isStateActive('insertUnorderedList'));
            toggle('btn-list-ol', isStateActive('insertOrderedList'));

            // Sincronizar indicadores de color de texto y fondo si hay pendingSpan o nodo activo
            if (pendingSpan) {
                if (pendingSpan.style.color) {
                    const ind = document.getElementById('indicator-text-color');
                    if (ind) ind.style.backgroundColor = pendingSpan.style.color;
                }
                if (pendingSpan.style.backgroundColor && pendingSpan.style.backgroundColor !== 'transparent') {
                    const ind = document.getElementById('indicator-bg-color');
                    if (ind) ind.style.backgroundColor = pendingSpan.style.backgroundColor;
                }
            } else if (node && node.nodeType === 1) {
                try {
                    const comp = window.getComputedStyle(node);
                    if (comp.color) {
                        const ind = document.getElementById('indicator-text-color');
                        if (ind) ind.style.backgroundColor = comp.color;
                    }
                    if (comp.backgroundColor && comp.backgroundColor !== 'transparent' && comp.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                        const ind = document.getElementById('indicator-bg-color');
                        if (ind) ind.style.backgroundColor = comp.backgroundColor;
                    }
                } catch (_) {}
            }

            // Sincronizar fuente, tamaño y estilo de bloque del nodo activo
            try {
                if (node && node.nodeType === 1) {
                    const computed = window.getComputedStyle(node);
                        
                        // 1. Tipografía activa
                        const fontSelect = document.getElementById('font-family-select');
                        if (fontSelect && computed.fontFamily) {
                            const firstFont = computed.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
                            if (firstFont) {
                                for (let i = 0; i < fontSelect.options.length; i++) {
                                    if (fontSelect.options[i].value.toLowerCase() === firstFont.toLowerCase()) {
                                        if (fontSelect.value !== fontSelect.options[i].value) {
                                            fontSelect.value = fontSelect.options[i].value;
                                            if (fontSelect._glassInstance) {
                                                fontSelect._glassInstance.updateTriggerLabel();
                                            }
                                        }
                                        break;
                                    }
                                }
                            }
                        }

                        // 2. Tamaño de fuente activo
                        const sizeSelect = document.getElementById('font-size-select');
                        if (sizeSelect && computed.fontSize) {
                            const ptSize = Math.round(parseFloat(computed.fontSize) * 0.75);
                            const sizeVal = String(ptSize);
                            for (let i = 0; i < sizeSelect.options.length; i++) {
                                const optV = sizeSelect.options[i].value;
                                if (optV === sizeVal || optV === `${sizeVal}px` || optV === `${sizeVal}pt`) {
                                    if (sizeSelect.value !== optV) {
                                        sizeSelect.value = optV;
                                        if (sizeSelect._glassInstance) {
                                            sizeSelect._glassInstance.updateTriggerLabel();
                                        }
                                    }
                                    break;
                                }
                            }
                        }

                        // 3. Estilo de bloque activo (p, h1, h2, h3, blockquote, callout)
                        const blockSelect = document.getElementById('block-style-select');
                        if (blockSelect) {
                            const blockEl = node.closest('h1, h2, h3, blockquote, .edu-callout, p');
                            if (blockEl) {
                                let blockTag = blockEl.tagName.toLowerCase();
                                if (blockEl.classList.contains('edu-callout')) {
                                    if (blockEl.classList.contains('info')) blockTag = 'callout-info';
                                    else if (blockEl.classList.contains('success')) blockTag = 'callout-success';
                                    else if (blockEl.classList.contains('danger')) blockTag = 'callout-danger';
                                }
                                if (blockSelect.value !== blockTag) {
                                    blockSelect.value = blockTag;
                                    if (blockSelect._glassInstance) {
                                        blockSelect._glassInstance.updateTriggerLabel();
                                    }
                                }
                            }
                        }
                    }
            } catch (_) {}
        }
    };

    // =====================================================================
    // 5. PLANTILLAS CONTABLES Y LEGALES DE EL SALVADOR (DocumentTemplates)
export { EduContaTextEngine };