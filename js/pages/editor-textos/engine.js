/**
 * engine.js — MultiPageEngine
 * Motor de hojas físicas, paginación 3-pases, cursor DOM y flujo nativo.
 * EduConta SV
 */
import { mmToPx } from './constants.js';
import { TextDocStateManager } from './state.js';
import { DocStatsManager } from './stats.js';
    //    corte de nodo, y separación de empuje / consolidación.
    // =====================================================================
    const MultiPageEngine = {
        containerEl: null,
        isPaginating: false,
        paginateQueued: false,
        _debounceTimer: null,
        _cursorMarker: null,
        pageCount: 1,

        getContainer() {
            if (!this.containerEl) {
                this.containerEl = document.getElementById('pages-container');
            }
            return this.containerEl;
        },

        getActiveEditor() {
            const container = this.getContainer();
            if (!container) return null;

            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                let node = sel.anchorNode;
                while (node && node !== container) {
                    if (node.nodeType === 1 && node.classList.contains('page-editor-surface')) {
                        return node;
                    }
                    node = node.parentNode;
                }
            }

            if (document.activeElement && document.activeElement.classList.contains('page-editor-surface')) {
                return document.activeElement;
            }

            return container.querySelector('.page-editor-surface') || null;
        },

        getAllEditors() {
            const container = this.getContainer();
            return container ? Array.from(container.querySelectorAll('.page-editor-surface')) : [];
        },

        // =============================================================
        // ENFOQUE ACTIVO DEL EDITOR Y POSICIONAMIENTO DEL CURSOR
        // =============================================================
        focusActiveEditor(atStart = true) {
            if (window.isAuditMode) return;
            if (window.TextDocStateManager?.getUserRole && window.TextDocStateManager.getUserRole() === 'lector') return;

            // Si hay un marcador temporal de cursor activo pendiente de restauración, no forzar
            if (this._cursorMarker || this._selectionStartMarker) return;

            const editor = this.getActiveEditor();
            if (!editor) return;

            // Si el editor ya tiene el foco y una selección activa dentro de sí, preservar la posición actual
            if (document.activeElement === editor) {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
                    return;
                }
            }

            // Evitar robar el foco si el usuario ya está interactuando con otro campo de texto o modal
            const activeEl = document.activeElement;
            if (activeEl && activeEl !== document.body && activeEl !== editor && activeEl !== document.documentElement) {
                if (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl.isContentEditable && !activeEl.classList.contains('page-editor-surface'))) {
                    return;
                }
            }

            try {
                editor.focus({ preventScroll: true });

                const sel = window.getSelection();
                if (!sel) return;

                const range = document.createRange();

                if (atStart) {
                    // Buscar el primer punto de inserción de texto en la superficie
                    const walker = document.createTreeWalker(
                        editor,
                        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                        {
                            acceptNode(node) {
                                if (node === editor) return NodeFilter.FILTER_SKIP;
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                    if (node.getAttribute && node.getAttribute('contenteditable') === 'false') {
                                        return NodeFilter.FILTER_REJECT;
                                    }
                                    if (node.tagName === 'BR' || node.tagName === 'IMG') {
                                        return NodeFilter.FILTER_ACCEPT;
                                    }
                                    return NodeFilter.FILTER_SKIP;
                                }
                                if (node.nodeType === Node.TEXT_NODE) {
                                    return NodeFilter.FILTER_ACCEPT;
                                }
                                return NodeFilter.FILTER_SKIP;
                            }
                        }
                    );

                    const firstNode = walker.nextNode();
                    if (firstNode) {
                        if (firstNode.nodeType === Node.TEXT_NODE) {
                            range.setStart(firstNode, 0);
                            range.collapse(true);
                        } else if (firstNode.tagName === 'BR' || firstNode.tagName === 'IMG') {
                            range.setStartBefore(firstNode);
                            range.collapse(true);
                        } else {
                            range.selectNodeContents(firstNode);
                            range.collapse(true);
                        }
                    } else {
                        range.selectNodeContents(editor);
                        range.collapse(true);
                    }
                } else {
                    range.selectNodeContents(editor);
                    range.collapse(false);
                }

                sel.removeAllRanges();
                sel.addRange(range);

                if (window.EduContaTextEngine) {
                    window.EduContaTextEngine._savedRange = range.cloneRange();
                    window.EduContaTextEngine._savedEditor = editor;
                    window.EduContaTextEngine.updateToolbarState();
                }
            } catch (err) {
                try { editor.focus({ preventScroll: true }); } catch (_) {}
            }
        },

        // =============================================================
        // CURSOR Y SELECCIÓN: Guardar y restaurar posición o sombreado
        // =============================================================
        saveCursor() {
            try {
                this.removeCursorMarker();
                const sel = window.getSelection();
                let range = null;
                if (sel && sel.rangeCount > 0) {
                    range = sel.getRangeAt(0);
                } else if (window.EduContaTextEngine?._savedRange) {
                    range = window.EduContaTextEngine._savedRange;
                }
                if (!range) return;

                const container = this.getContainer();
                if (!container || !container.contains(range.commonAncestorContainer)) return;

                if (!range.collapsed) {
                    // SELECCIÓN DE TEXTO (Sombreado activo multicarácter): Guardar extremos sin colapsar el rango
                    const startMarker = document.createElement('span');
                    startMarker.id = '__ec_sel_start__';
                    startMarker.setAttribute('data-ec-cursor', '1');
                    startMarker.style.cssText = 'display:inline;font-size:0;line-height:0;width:0;height:0;overflow:hidden;position:relative;';

                    const endMarker = document.createElement('span');
                    endMarker.id = '__ec_sel_end__';
                    endMarker.setAttribute('data-ec-cursor', '1');
                    endMarker.style.cssText = 'display:inline;font-size:0;line-height:0;width:0;height:0;overflow:hidden;position:relative;';

                    // Insertar marcador de fin primero (para no alterar los offsets del inicio)
                    const endRange = range.cloneRange();
                    endRange.collapse(false);
                    endRange.insertNode(endMarker);

                    // Insertar marcador de inicio
                    const startRange = range.cloneRange();
                    startRange.collapse(true);
                    startRange.insertNode(startMarker);

                    // Re-anclar selección activa entre marcadores sin destruirla ni colapsarla
                    const activeRange = document.createRange();
                    activeRange.setStartAfter(startMarker);
                    activeRange.setEndBefore(endMarker);
                    if (sel) {
                        sel.removeAllRanges();
                        sel.addRange(activeRange);
                    }
                    if (window.EduContaTextEngine) {
                        window.EduContaTextEngine._savedRange = activeRange.cloneRange();
                        window.EduContaTextEngine._savedEditor = startMarker.closest('.page-editor-surface') || endMarker.closest('.page-editor-surface');
                    }

                    this._selectionStartMarker = startMarker;
                    this._selectionEndMarker = endMarker;
                } else {
                    // CURSOR SIMPLE (Caret de escritura colapsado)
                    const marker = document.createElement('span');
                    marker.id = '__ec_cursor__';
                    marker.setAttribute('data-ec-cursor', '1');
                    marker.style.cssText = 'display:inline;font-size:0;line-height:0;width:0;height:0;overflow:hidden;position:relative;';

                    const insertRange = range.cloneRange();
                    insertRange.collapse(true);
                    insertRange.insertNode(marker);

                    range.setStartAfter(marker);
                    range.collapse(true);
                    if (sel) {
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    if (window.EduContaTextEngine) {
                        window.EduContaTextEngine._savedRange = range.cloneRange();
                        window.EduContaTextEngine._savedEditor = marker.closest('.page-editor-surface');
                    }

                    this._cursorMarker = marker;
                }
            } catch (_) { /* Selection API puede fallar en edge cases */ }
        },

        restoreCursor() {
            const startMarker = this._selectionStartMarker || document.getElementById('__ec_sel_start__');
            const endMarker = this._selectionEndMarker || document.getElementById('__ec_sel_end__');

            if (startMarker && endMarker && startMarker.parentNode && endMarker.parentNode) {
                try {
                    let editorSurface = startMarker.closest('.page-editor-surface') || endMarker.closest('.page-editor-surface');
                    if (editorSurface && document.activeElement !== editorSurface) {
                        editorSurface.focus({ preventScroll: true });
                    }

                    const range = document.createRange();
                    range.setStartAfter(startMarker);
                    range.setEndBefore(endMarker);

                    startMarker.remove();
                    endMarker.remove();
                    this._selectionStartMarker = null;
                    this._selectionEndMarker = null;

                    const sel = window.getSelection();
                    if (sel) {
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    if (window.EduContaTextEngine) {
                        window.EduContaTextEngine._savedRange = range.cloneRange();
                        window.EduContaTextEngine._savedEditor = editorSurface;
                    }
                } catch (_) {
                    if (startMarker) startMarker.remove();
                    if (endMarker) endMarker.remove();
                    this._selectionStartMarker = null;
                    this._selectionEndMarker = null;
                }
                return;
            }

            const marker = this._cursorMarker || document.getElementById('__ec_cursor__');
            if (!marker || !marker.parentNode) {
                this._cursorMarker = null;
                return;
            }
            try {
                // Enfocar el editor que contiene el marcador sin alterar el scroll
                let editorSurface = marker.closest('.page-editor-surface');
                if (editorSurface && document.activeElement !== editorSurface) {
                    editorSurface.focus({ preventScroll: true });
                }

                const range = document.createRange();
                range.setStartAfter(marker);
                range.collapse(true);
                const sel = window.getSelection();
                if (sel) {
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                if (window.EduContaTextEngine) {
                    window.EduContaTextEngine._savedRange = range.cloneRange();
                    window.EduContaTextEngine._savedEditor = editorSurface;
                }
            } catch (_) { /* ignorar */ }
            marker.remove();
            this._cursorMarker = null;

            // Mantener el cursor visible suavemente sin forzar saltos hacia arriba
            this.scrollCaretIntoView(false);
        },

        scrollCaretIntoView(allowScrollUp = false) {
            const scrollContainer = document.querySelector('.editor-scroll-area');
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;

            const range = sel.getRangeAt(0);
            let rect = null;

            const rects = range.getClientRects();
            if (rects.length > 0) {
                rect = rects[0];
            } else {
                const el = range.startContainer.nodeType === 1 
                    ? range.startContainer 
                    : range.startContainer.parentElement;
                if (el && !el.classList.contains('page-editor-surface') && !el.classList.contains('page-sheet') && !el.id?.includes('pages-container')) {
                    rect = el.getBoundingClientRect();
                }
            }

            if (!rect || (rect.top === 0 && rect.bottom === 0)) return;
            // Un cursor de texto real nunca mide más de 120px de alto; si es mayor, es un contenedor completo
            if (rect.height > 120) return;

            if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
                const cRect = scrollContainer.getBoundingClientRect();
                const floatingToolbar = document.querySelector('.sticky-fixed-controls, #editor-sticky-controls');
                const toolbarBottom = floatingToolbar ? floatingToolbar.getBoundingClientRect().bottom : 224;
                const topBuffer = Math.max(toolbarBottom + 12, cRect.top + 20);
                const bottomBuffer = cRect.bottom - 70;

                // Solo desplazar hacia arriba si se autorizó explícitamente (ej: navegación con flechas o PageUp),
                // nunca al escribir texto ordinario, y solo si el cursor está verdaderamente detrás de la barra fija
                if (allowScrollUp && rect.top > 0 && rect.top < topBuffer && scrollContainer.scrollTop > 0) {
                    const diff = Math.min(topBuffer - rect.top, 100);
                    scrollContainer.scrollBy({ top: -diff, behavior: 'smooth' });
                } else if (rect.bottom > bottomBuffer) {
                    const diff = Math.min(rect.bottom - bottomBuffer, 120);
                    scrollContainer.scrollBy({ top: diff, behavior: 'smooth' });
                }
            } else {
                const topHeaderBuffer = 240;
                const bottomBuffer = 80;
                const viewportHeight = window.innerHeight;

                if (allowScrollUp && rect.top > 0 && rect.top < topHeaderBuffer && (window.scrollY || document.documentElement.scrollTop) > 0) {
                    const diff = Math.min(topHeaderBuffer - rect.top, 100);
                    window.scrollBy({ top: -diff, behavior: 'smooth' });
                } else if (rect.bottom > viewportHeight - bottomBuffer) {
                    const diff = Math.min(rect.bottom - (viewportHeight - bottomBuffer), 120);
                    window.scrollBy({ top: diff, behavior: 'smooth' });
                }
            }
        },

        removeCursorMarker() {
            const existingCursor = document.getElementById('__ec_cursor__');
            if (existingCursor) existingCursor.remove();
            const existingStart = document.getElementById('__ec_sel_start__');
            if (existingStart) existingStart.remove();
            const existingEnd = document.getElementById('__ec_sel_end__');
            if (existingEnd) existingEnd.remove();
            this._cursorMarker = null;
            this._selectionStartMarker = null;
            this._selectionEndMarker = null;
        },

        // =============================================================
        // NORMALIZACIÓN: Envolver nodos de texto sueltos en <p> y sanar tablas
        // =============================================================
        normalizeEditor(editor) {
            // 1. Re-unificar tablas partidas o fragmentadas con espacios vacíos
            this.healFragmentedTables(editor);

            // 2. Envolver nodos de texto sueltos (no envueltos en un bloque) en <p>
            Array.from(editor.childNodes).forEach(node => {
                if (node.nodeType === 3 && node.textContent.trim()) {
                    const p = document.createElement('p');
                    editor.insertBefore(p, node);
                    p.appendChild(node);
                } else if (node.nodeType === 3 && !node.textContent.trim()) {
                    // Nodo de texto vacío fuera de un bloque — remover
                    node.remove();
                }
            });
            // 3. Envolver <br> sueltos en <p>
            Array.from(editor.childNodes).forEach(node => {
                if (node.nodeType === 1 && node.tagName === 'BR') {
                    const p = document.createElement('p');
                    editor.insertBefore(p, node);
                    p.appendChild(node);
                }
            });
            // 4. Asegurar al menos un hijo
            if (editor.children.length === 0 && editor.childNodes.length === 0) {
                const p = document.createElement('p');
                p.innerHTML = '<br>';
                editor.appendChild(p);
            }
        },

        // =============================================================
        // PUNTOS DE CORTE Y DIVISIÓN PRECISA DE BLOQUES POR PALABRA/NODO
        // =============================================================
        collectBreakPoints(container) {
            const points = [];
            const walker = document.createTreeWalker(
                container,
                NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                {
                    acceptNode(node) {
                        if (node.nodeType === 1 && node.hasAttribute('data-ec-cursor')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        if (node.nodeType === 3) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        if (node.nodeType === 1 && (node.tagName === 'BR' || node.tagName === 'IMG')) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        return NodeFilter.FILTER_SKIP;
                    }
                }
            );

            let node;
            while ((node = walker.nextNode())) {
                if (node.nodeType === 3) {
                    const text = node.nodeValue;
                    if (!text) continue;
                    points.push({ container: node, offset: 0 });
                    const regex = /\s+/g;
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        points.push({ container: node, offset: match.index + match[0].length });
                    }
                    if (points[points.length - 1]?.offset !== text.length) {
                        points.push({ container: node, offset: text.length });
                    }
                } else if (node.nodeType === 1) {
                    const parent = node.parentNode;
                    if (parent) {
                        const idx = Array.prototype.indexOf.call(parent.childNodes, node);
                        points.push({ container: parent, offset: idx + 1 });
                    }
                }
            }
            return points;
        },

        splitBlockToFit(block, editor) {
            if (!block || !editor) return null;

            // Listas ordenadas y desordenadas
            if ((block.tagName === 'OL' || block.tagName === 'UL') && block.children.length > 0) {
                return this.splitListBlock(block, editor);
            }

            // Tablas con múltiples filas
            if (block.tagName === 'TABLE' && block.querySelectorAll('tr').length > 1) {
                return this.splitTableBlock(block, editor);
            }

            // Elementos atómicos que no deben dividirse internamente (Imágenes, Separadores, Callouts, Figuras)
            const atomicTags = ['IMG', 'HR', 'IFRAME', 'FIGURE'];
            if (atomicTags.includes(block.tagName) || block.classList.contains('edu-callout') || block.classList.contains('toc-block')) {
                return null;
            }

            const editorRect = editor.getBoundingClientRect();
            const maxBottom = editorRect.bottom + 0.5;

            const points = this.collectBreakPoints(block);
            if (points.length <= 1) return null;

            const testRange = document.createRange();
            let lo = 0;
            let hi = points.length - 1;
            let bestIdx = -1;

            while (lo <= hi) {
                const mid = Math.floor((lo + hi) / 2);
                const pt = points[mid];

                try {
                    if (pt.container.nodeType === 3) {
                        const startOff = Math.max(0, pt.offset - 1);
                        const endOff = Math.max(startOff + 1, pt.offset);
                        testRange.setStart(pt.container, startOff);
                        testRange.setEnd(pt.container, Math.min(endOff, pt.container.length));
                    } else {
                        testRange.setStart(pt.container, Math.max(0, pt.offset - 1));
                        testRange.setEnd(pt.container, pt.offset);
                    }

                    const rects = testRange.getClientRects();
                    let rectBottom = 0;
                    if (rects.length > 0) {
                        rectBottom = rects[rects.length - 1].bottom;
                    } else {
                        const bRect = testRange.getBoundingClientRect();
                        rectBottom = bRect.bottom;
                    }

                    if (rectBottom > 0 && rectBottom <= maxBottom) {
                        bestIdx = mid;
                        lo = mid + 1;
                    } else {
                        hi = mid - 1;
                    }
                } catch (_) {
                    hi = mid - 1;
                }
            }

            // Si encontramos un punto de corte válido intermedio
            if (bestIdx > 0 && bestIdx < points.length - 1) {
                const splitPt = points[bestIdx];
                const splitRange = document.createRange();
                splitRange.setStart(splitPt.container, splitPt.offset);
                splitRange.setEnd(block, block.childNodes.length);

                const fragment = splitRange.extractContents();
                const newBlock = block.cloneNode(false);
                newBlock.removeAttribute('id');
                newBlock.appendChild(fragment);

                const origHasContent = block.textContent.trim() || block.querySelector('img, table, br');
                const newHasContent = newBlock.textContent.trim() || newBlock.querySelector('img, table, br, [data-ec-cursor]');

                if (!origHasContent || !newHasContent) {
                    // Revertir la extracción para evitar pérdida de nodos
                    block.appendChild(fragment);
                    return null;
                }

                return newBlock;
            }

            return null;
        },

        splitListBlock(listBlock, editor) {
            const isOrdered = listBlock.tagName === 'OL';
            const items = Array.from(listBlock.children).filter(c => c.tagName === 'LI');
            if (items.length <= 1) {
                if (items.length === 1) {
                    const singleLi = items[0];
                    const overflowLi = this.splitBlockToFit(singleLi, editor);
                    if (overflowLi) {
                        const newList = listBlock.cloneNode(false);
                        newList.removeAttribute('id');
                        if (isOrdered) {
                            const startVal = parseInt(listBlock.getAttribute('start') || '1', 10);
                            newList.setAttribute('start', (startVal + 1).toString());
                        }
                        newList.appendChild(overflowLi);
                        return newList;
                    }
                }
                return null;
            }

            const editorRect = editor.getBoundingClientRect();
            const maxBottom = editorRect.bottom + 0.5;

            let splitIndex = -1;
            for (let i = 0; i < items.length; i++) {
                const itemRect = items[i].getBoundingClientRect();
                if (itemRect.bottom > maxBottom) {
                    splitIndex = i;
                    break;
                }
            }

            if (splitIndex === -1) return null;

            if (splitIndex === 0) {
                const overflowLi = this.splitBlockToFit(items[0], editor);
                if (overflowLi) {
                    const newList = listBlock.cloneNode(false);
                    newList.removeAttribute('id');
                    if (isOrdered) {
                        const startVal = parseInt(listBlock.getAttribute('start') || '1', 10);
                        newList.setAttribute('start', startVal.toString());
                    }
                    newList.appendChild(overflowLi);
                    for (let j = 1; j < items.length; j++) {
                        newList.appendChild(items[j]);
                    }
                    return newList;
                }
                return null;
            }

            const overflowLi = this.splitBlockToFit(items[splitIndex], editor);
            const newList = listBlock.cloneNode(false);
            newList.removeAttribute('id');
            if (isOrdered) {
                const baseStart = parseInt(listBlock.getAttribute('start') || '1', 10);
                const startVal = baseStart + splitIndex;
                newList.setAttribute('start', startVal.toString());
            }

            if (overflowLi) {
                newList.appendChild(overflowLi);
                for (let j = splitIndex + 1; j < items.length; j++) {
                    newList.appendChild(items[j]);
                }
            } else {
                for (let j = splitIndex; j < items.length; j++) {
                    newList.appendChild(items[j]);
                }
            }

            return (newList.children.length > 0) ? newList : null;
        },

        splitTableBlock(tableBlock, editor) {
            if (!tableBlock || tableBlock.tagName !== 'TABLE') return null;

            const tbody = tableBlock.querySelector('tbody') || tableBlock;
            const rows = Array.from(tbody.querySelectorAll(':scope > tr'));
            if (rows.length <= 1) return null;

            const editorRect = editor.getBoundingClientRect();
            const maxBottom = editorRect.bottom + 0.5;

            let splitIndex = -1;
            for (let i = 0; i < rows.length; i++) {
                const rowRect = rows[i].getBoundingClientRect();
                if (rowRect.bottom > maxBottom) {
                    splitIndex = i;
                    break;
                }
            }

            if (splitIndex <= 0) return null;

            // Clonar la tabla para la siguiente página
            const newTable = tableBlock.cloneNode(false);
            newTable.removeAttribute('id');
            newTable.setAttribute('data-ec-table-part', 'cont');

            // Clonar thead si existe para que los títulos de columna se mantengan
            const thead = tableBlock.querySelector('thead');
            if (thead) {
                newTable.appendChild(thead.cloneNode(true));
            }

            const newTbody = tbody.cloneNode(false);
            newTable.appendChild(newTbody);

            // Mover filas desde splitIndex en adelante a la nueva tabla
            for (let j = splitIndex; j < rows.length; j++) {
                newTbody.appendChild(rows[j]);
            }

            tableBlock.setAttribute('data-ec-table-part', 'head');

            return (newTbody.children.length > 0) ? newTable : null;
        },

        healFragmentedTables(containerOrElement) {
            if (!containerOrElement) return;

            const isVisuallyEmpty = (node) => {
                if (!node) return true;
                if (node.nodeType === 3) {
                    return !node.textContent.replace(/[\s\u00A0\u200B]/g, '');
                }
                if (node.nodeType === 1) {
                    if (['IMG', 'TABLE', 'IFRAME', 'CANVAS', 'HR', 'FIGURE'].includes(node.tagName)) {
                        return false;
                    }
                    const text = node.textContent.replace(/[\s\u00A0\u200B]/g, '');
                    if (text.length > 0) return false;
                    const media = node.querySelector('img, table, iframe, canvas, hr, figure');
                    if (media) return false;
                    return true;
                }
                return true;
            };

            const allTables = Array.from(containerOrElement.querySelectorAll('table'));
            for (let i = 0; i < allTables.length - 1; i++) {
                const t1 = allTables[i];
                const t2 = allTables[i + 1];
                if (!t1.parentNode || !t2.parentNode) continue;

                // Verificar si todos los nodos intermedios entre t1 y t2 están vacíos
                let sibling = t1.nextSibling;
                let onlyEmpty = true;
                const nodesToRemove = [];

                while (sibling && sibling !== t2) {
                    if (!isVisuallyEmpty(sibling)) {
                        onlyEmpty = false;
                        break;
                    }
                    nodesToRemove.push(sibling);
                    sibling = sibling.nextSibling;
                }

                if (onlyEmpty && sibling === t2) {
                    const tbody1 = t1.querySelector('tbody') || t1;
                    const tbody2 = t2.querySelector('tbody') || t2;

                    // Si t2 tiene thead idéntico o redundante, removerlo para no duplicar cabeceras en medio
                    const t2Head = t2.querySelector('thead');
                    if (t2Head) t2Head.remove();

                    // Mover filas de t2 a tbody1
                    Array.from(tbody2.querySelectorAll(':scope > tr')).forEach(tr => {
                        tbody1.appendChild(tr);
                    });

                    // Si t2 tenía filas directamente fuera de tbody
                    Array.from(t2.querySelectorAll(':scope > tr')).forEach(tr => {
                        tbody1.appendChild(tr);
                    });

                    // Eliminar los nodos vacíos intermedios (<p><br></p>, etc.)
                    nodesToRemove.forEach(n => n.remove());

                    // Eliminar la segunda tabla vacía
                    t2.remove();
                    allTables.splice(i + 1, 1);
                    i--; // Re-evaluar por si hay más tablas continuas
                }
            }
        },

        // =============================================================
        // HELPER: Obtener el último hijo movible (que no sea el cursor marker)
        // =============================================================
        getLastMovableChild(editor) {
            let child = editor.lastElementChild;
            while (child && child.hasAttribute('data-ec-cursor')) {
                child = child.previousElementSibling;
            }
            return child;
        },

        // =============================================================
        // CREACIÓN DE PÁGINAS
        // =============================================================
        createPageDOM(pageNum, contentHTML = '<p><br></p>') {
            const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
            const hf = sheet?.headerFooter || {
                showHeader: false,
                showFooter: false,
                headerText: '',
                footerText: '',
                showPageNumbers: false
            };

            const showHeader = hf.showHeader || hf.showPageNumbers;
            const showFooter = hf.showFooter || hf.showPageNumbers;

            const pageDiv = document.createElement('div');
            pageDiv.className = 'page-sheet';
            pageDiv.setAttribute('data-page', pageNum);

            const spacing = sheet?.lineSpacing || '15';
            pageDiv.classList.add(`spacing-${spacing}`);

            const fontFamily = (sheet?.fontFamily || 'Plus Jakarta Sans').trim().replace(/^['"]|['"]$/g, '');
            if (typeof window.ensureGoogleFontLoaded === 'function' && fontFamily) {
                window.ensureGoogleFontLoaded(fontFamily);
            }

            const spellcheckAttr = (window.SpellCheckManager && window.SpellCheckManager.browserSpellcheck) ? 'true' : 'false';
            const langCode = window.SpellCheckManager ? window.SpellCheckManager.getLangCode() : 'es';

            pageDiv.innerHTML = `
                <div class="page-header-bar ${!showHeader ? 'zone-hidden' : ''}" contenteditable="false">
                    <span class="page-header-text truncate max-w-[280px] font-semibold text-[10px] text-slate-400 dark:text-slate-500">${hf.headerText || ''}</span>
                    <span class="page-counter-badge text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full text-slate-500 dark:text-slate-400 ${!hf.showPageNumbers ? 'hidden' : ''}">Pág. ${pageNum} de ${this.pageCount || 1}</span>
                </div>
                <div class="page-editor-surface" style="font-family: '${fontFamily}', sans-serif;" contenteditable="${window.isAuditMode ? 'false' : 'true'}" spellcheck="${spellcheckAttr}" lang="${langCode}">
                    ${contentHTML}
                </div>
                <div class="page-footer-bar ${!showFooter ? 'zone-hidden' : ''}" contenteditable="false">
                    <span class="page-footer-text font-medium text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">${hf.footerText || ''}</span>
                    <span class="page-footer-num font-bold text-[10px] text-slate-500 dark:text-slate-400 ${!hf.showPageNumbers ? 'hidden' : ''}">${pageNum}</span>
                </div>
            `;

            this.bindPageEvents(pageDiv);
            return pageDiv;
        },

        bindPageEvents(pageDiv) {
            const editor = pageDiv.querySelector('.page-editor-surface');
            if (!editor) return;

            pageDiv.addEventListener('click', (e) => {
                if (e.target === pageDiv && !window.isAuditMode) {
                    this.focusActiveEditor(false);
                }
            });

            // Evitar cualquier desplazamiento de scroll interno en la superficie física de la hoja
            editor.addEventListener('scroll', () => {
                if (editor.scrollTop !== 0) editor.scrollTop = 0;
                if (editor.scrollLeft !== 0) editor.scrollLeft = 0;
            }, { passive: true });

            editor.oninput = () => {
                if (editor.scrollTop !== 0) editor.scrollTop = 0;
                if (editor.scrollLeft !== 0) editor.scrollLeft = 0;

                DocStatsManager.update();
                EduContaTextEngine.saveActiveSelection();
                EduContaTextEngine.updateToolbarState();
                TextDocStateManager.triggerAutoSave();
                TextDocStateManager.debouncePushHistory();
                window.CollabPresenceManager?.broadcastContent(null, TextDocStateManager.activeSheetIndex);
                this.scrollCaretIntoView(false);
                this.debouncePaginate();
            };

            editor.onfocus = () => {
                if (editor.scrollTop !== 0) editor.scrollTop = 0;
                if (editor.scrollLeft !== 0) editor.scrollLeft = 0;
                EduContaTextEngine.updateToolbarState();
                this.scrollCaretIntoView(false);
            };
            editor.onmouseup = () => {
                EduContaTextEngine.saveActiveSelection(true);
                EduContaTextEngine.updateToolbarState();
                this.scrollCaretIntoView(false);
            };
            editor.onkeyup = (e) => {
                EduContaTextEngine.saveActiveSelection(true);
                EduContaTextEngine.updateToolbarState();
                const isUpNav = (e.key === 'ArrowUp' || e.key === 'PageUp');
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Enter', 'Backspace'].includes(e.key)) {
                    this.scrollCaretIntoView(isUpNav);
                }
            };

            editor.onkeydown = (e) => {
                if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
                    const k = e.key.toLowerCase();
                    if (k === 'b') {
                        e.preventDefault();
                        window.EduContaTextEngine?.execFormat('bold');
                        return;
                    } else if (k === 'i') {
                        e.preventDefault();
                        window.EduContaTextEngine?.execFormat('italic');
                        return;
                    } else if (k === 'u') {
                        e.preventDefault();
                        window.EduContaTextEngine?.execFormat('underline');
                        return;
                    }
                }

                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.insertPageBreak();
                    return;
                }

                if (e.key === 'Backspace') {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
                        const range = sel.getRangeAt(0);
                        if (this.isCaretAtStart(editor, range)) {
                            const pageNum = parseInt(pageDiv.getAttribute('data-page'), 10);
                            if (pageNum > 1) {
                                e.preventDefault();
                                this.mergeWithPreviousPage(pageNum);
                                return;
                            }
                        }
                    }
                }

                // Flecha arriba al inicio → ir a la página anterior
                if (e.key === 'ArrowUp') {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
                        const range = sel.getRangeAt(0);
                        if (this.isCaretAtStart(editor, range)) {
                            const pageNum = parseInt(pageDiv.getAttribute('data-page'), 10);
                            if (pageNum > 1) {
                                e.preventDefault();
                                const container = this.getContainer();
                                const pages = Array.from(container.querySelectorAll('.page-sheet'));
                                const prevEditor = pages[pageNum - 2]?.querySelector('.page-editor-surface');
                                if (prevEditor) {
                                    prevEditor.focus({ preventScroll: true });
                                    const r = document.createRange();
                                    r.selectNodeContents(prevEditor);
                                    r.collapse(false);
                                    sel.removeAllRanges();
                                    sel.addRange(r);
                                }
                            }
                        }
                    }
                }

                // Flecha abajo al final → ir a la página siguiente
                if (e.key === 'ArrowDown') {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
                        const range = sel.getRangeAt(0);
                        if (this.isCaretAtEnd(editor, range)) {
                            const pageNum = parseInt(pageDiv.getAttribute('data-page'), 10);
                            const container = this.getContainer();
                            const pages = Array.from(container.querySelectorAll('.page-sheet'));
                            if (pageNum < pages.length) {
                                e.preventDefault();
                                const nextEditor = pages[pageNum]?.querySelector('.page-editor-surface');
                                if (nextEditor) {
                                    nextEditor.focus({ preventScroll: true });
                                    const r = document.createRange();
                                    r.selectNodeContents(nextEditor);
                                    r.collapse(true);
                                    sel.removeAllRanges();
                                    sel.addRange(r);
                                }
                            }
                        }
                    }
                }
            };

            editor.onpaste = (e) => {
                e.preventDefault();

                // 1. Detectar si hay archivos o imágenes en el portapapeles (capturas, PNGs transparentes, etc.)
                const items = (e.clipboardData || window.clipboardData)?.items;
                if (items) {
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].type && items[i].type.indexOf('image') !== -1) {
                            const blob = items[i].getAsFile();
                            if (blob) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    EduContaTextEngine.insertImageNode(event.target.result, 'Imagen pegada');
                                };
                                reader.readAsDataURL(blob);
                                return;
                            }
                        }
                    }
                }

                // 2. Si es texto o HTML
                const text = (e.clipboardData || window.clipboardData)?.getData('text/html') ||
                    (e.clipboardData || window.clipboardData)?.getData('text/plain') || '';
                EduContaTextEngine.handleSmartPaste(text);
                setTimeout(() => this.paginate(), 40);
            };

            // ── Drag & Drop externo: insertar imágenes arrastradas desde el escritorio ──
            editor.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'copy';
            });

            editor.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });

            editor.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const files = e.dataTransfer?.files;
                if (!files || files.length === 0) return;

                // Colocar el cursor en la posición del drop dentro del editor
                let dropRange = null;
                if (document.caretRangeFromPoint) {
                    dropRange = document.caretRangeFromPoint(e.clientX, e.clientY);
                } else if (document.caretPositionFromPoint) {
                    const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
                    if (pos) {
                        dropRange = document.createRange();
                        dropRange.setStart(pos.offsetNode, pos.offset);
                        dropRange.collapse(true);
                    }
                }
                if (dropRange) {
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(dropRange);
                }

                for (const file of files) {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            EduContaTextEngine.insertImageNode(event.target.result, file.name || 'Imagen importada');
                        };
                        reader.readAsDataURL(file);
                    }
                }
            });
        },

        isCaretAtStart(editor, range) {
            try {
                const preRange = document.createRange();
                preRange.selectNodeContents(editor);
                preRange.setEnd(range.startContainer, range.startOffset);
                return preRange.toString().length === 0;
            } catch (_) {
                return false;
            }
        },

        isCaretAtEnd(editor, range) {
            try {
                const postRange = document.createRange();
                postRange.selectNodeContents(editor);
                postRange.setStart(range.endContainer, range.endOffset);
                return postRange.toString().length === 0;
            } catch (_) {
                return false;
            }
        },

        mergeWithPreviousPage(pageNum) {
            const container = this.getContainer();
            const pages = Array.from(container.querySelectorAll('.page-sheet'));
            const currentPage = pages[pageNum - 1];
            const prevPage    = pages[pageNum - 2];
            if (!currentPage || !prevPage) return;

            const currentEditor = currentPage.querySelector('.page-editor-surface');
            const prevEditor    = prevPage.querySelector('.page-editor-surface');
            if (!currentEditor || !prevEditor) return;

            // 1. Anotar punto de union ANTES de mover contenido
            const joinAnchor = prevEditor.lastChild;

            // 2. Filtrar el <p><br> placeholder que contenteditable crea en editor vacio
            //    Solo se filtra si es el UNICO nodo (placeholder puro, sin contenido real)
            const nodesToMove = [];
            let child = currentEditor.firstChild;
            while (child) {
                const next = child.nextSibling;
                const isPlaceholder =
                    child.nodeType === 1 && child.nodeName === 'P' &&
                    (child.innerHTML === '<br>' || child.innerHTML === '') &&
                    child === currentEditor.firstChild && !child.nextSibling;
                if (!isPlaceholder) nodesToMove.push(child);
                child = next;
            }

            // 3. Mover los nodos validos a la pagina anterior
            nodesToMove.forEach(n => prevEditor.appendChild(n));

            // 4. Eliminar la pagina actual y actualizar contadores
            currentPage.remove();
            this.pageCount = Math.max(1, pages.length - 1);
            this.updateAllPageNumbers();
            this.paginate();

            // 5. Colocar cursor en el punto de union (inicio del contenido movido)
            prevEditor.focus({ preventScroll: true });
            try {
                const sel2 = window.getSelection();
                const r2   = document.createRange();
                const firstMoved = joinAnchor ? joinAnchor.nextSibling : prevEditor.firstChild;
                if (firstMoved) {
                    r2.setStart(firstMoved, 0);
                    r2.collapse(true);
                } else {
                    r2.selectNodeContents(prevEditor);
                    r2.collapse(false);
                }
                sel2.removeAllRanges();
                sel2.addRange(r2);
            } catch (_) {
                // Fallback: cursor al final de pagina anterior
                const s = window.getSelection();
                const r = document.createRange();
                r.selectNodeContents(prevEditor);
                r.collapse(false);
                s.removeAllRanges();
                s.addRange(r);
            }

            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            TextDocStateManager.triggerAutoSave();
        },

        // =============================================================
        // DEBOUNCE: Usa setTimeout en vez de rAF para dar tiempo al layout
        // =============================================================
        debouncePaginate() {
            if (this._debounceTimer) clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => {
                this.paginate();
            }, 220);
        },

        // =============================================================
        // CARGA DE CONTENIDO
        // =============================================================
        loadContent(htmlContent = '<p><br></p>', autoFocus = true) {
            const container = this.getContainer();
            if (!container) return;

            container.innerHTML = '';

            let clean = htmlContent;
            clean = clean
                .replace(/<div class="first-page-header[\s\S]*?<\/div>/gi, '')
                .replace(/<div class="last-page-footer[\s\S]*?<\/div>/gi, '')
                .replace(/<div class="doc-page-break-widget[\s\S]*?<\/div><\/div><\/div>/gi, '')
                .replace(/<div class="doc-page-break-widget[\s\S]*?<\/div>/gi, '')
                .replace(/<span[^>]*data-ec-cursor[^>]*><\/span>/gi, '');

            if (!clean.trim()) clean = '<p><br></p>';

            // Reparar tablas fragmentadas y sanear en el HTML inicial
            const temp = document.createElement('div');
            temp.innerHTML = clean;
            temp.querySelectorAll('script, iframe, object, embed, meta, link').forEach(el => el.remove());
            temp.querySelectorAll('*').forEach(el => {
                Array.from(el.attributes).forEach(attr => {
                    const attrName = attr.name.toLowerCase();
                    const attrVal = String(attr.value || '').trim().toLowerCase();
                    if (attrName.startsWith('on') || ((attrName === 'href' || attrName === 'src' || attrName === 'xlink:href' || attrName === 'action' || attrName === 'formaction') && attrVal.startsWith('javascript:'))) {
                        el.removeAttribute(attr.name);
                    }
                });
            });
            this.healFragmentedTables(temp);
            clean = temp.innerHTML;

            const firstPage = this.createPageDOM(1, clean);
            container.appendChild(firstPage);
            this.pageCount = 1;

            // Paginación diferida para que el layout se estabilice
            requestAnimationFrame(() => {
                this.paginate();
                if (autoFocus && !window.isAuditMode) {
                    this.focusActiveEditor(true);
                }
            });
        },

        // =============================================================
        // PAGINACIÓN PRINCIPAL — 3 Pases
        //   Pase 1: Empujar desborde hacia adelante
        //   Pase 2: Consolidar (jalar contenido de la siguiente si cabe)
        //   Pase 3: Eliminar páginas vacías finales
        // =============================================================
        paginate() {
            if (this.isPaginating) {
                this.paginateQueued = true;
                return;
            }
            this.isPaginating = true;

            const container = this.getContainer();
            if (!container) {
                this.isPaginating = false;
                return;
            }

            let pages = Array.from(container.querySelectorAll('.page-sheet'));
            if (pages.length === 0) {
                const firstPage = this.createPageDOM(1, '<p><br></p>');
                container.appendChild(firstPage);
                pages = [firstPage];
            }

            // Comprobar si se requiere paginación real para no alterar el DOM ni el cursor durante escritura normal
            const needsWork = pages.some((p, idx) => {
                const ed = p.querySelector('.page-editor-surface');
                if (!ed) return false;
                if (ed.scrollHeight > ed.clientHeight + 1) return true;
                if (idx > 0 && ed.children.length === 0) return true;
                return false;
            });

            if (!needsWork && pages.length === 1) {
                this.isPaginating = false;
                return;
            }

            // Guardar cursor antes de cualquier manipulación DOM
            this.saveCursor();

            // Normalizar todos los editores (texto suelto → <p>)
            pages.forEach(p => {
                const ed = p.querySelector('.page-editor-surface');
                if (ed) this.normalizeEditor(ed);
            });

            // ─── PASE 1: Empujar desborde hacia adelante ───
            let globalLimit = Math.max(1000, pages.length * 150);
            for (let pIdx = 0; pIdx < pages.length && globalLimit > 0; pIdx++) {
                const page = pages[pIdx];
                const editor = page.querySelector('.page-editor-surface');
                if (!editor) continue;

                let pushLimit = 150;
                while (editor.scrollHeight > editor.clientHeight + 1 && pushLimit-- > 0 && globalLimit-- > 0) {
                    // Asegurar que existe la página siguiente
                    if (pIdx + 1 >= pages.length) {
                        const newPage = this.createPageDOM(pages.length + 1, '');
                        container.appendChild(newPage);
                        pages = Array.from(container.querySelectorAll('.page-sheet'));
                    }
                    const nextEditor = pages[pIdx + 1]?.querySelector('.page-editor-surface');
                    if (!nextEditor) break;

                    // Contar hijos movibles (excluyendo marcador de cursor)
                    const movableChildren = Array.from(editor.children).filter(
                        c => !c.hasAttribute('data-ec-cursor')
                    );
                    if (movableChildren.length === 0) break;

                    const lastChild = movableChildren[movableChildren.length - 1];

                    // Intentar dividir el último hijo por palabra / línea
                    const overflowBlock = this.splitBlockToFit(lastChild, editor);

                    if (overflowBlock) {
                        // El último bloque se dividió: el fragmento que desborda va al inicio de la siguiente página
                        nextEditor.insertBefore(overflowBlock, nextEditor.firstChild);
                    } else {
                        // No se pudo dividir (elemento atómico o no cabe nada de él)
                        if (movableChildren.length > 1) {
                            // Mover el elemento completo a la siguiente página
                            nextEditor.insertBefore(lastChild, nextEditor.firstChild);
                        } else {
                            // Era el único elemento y no se puede reducir más
                            break;
                        }
                    }
                }
            }

            // ─── PASE 2: Consolidar — jalar del siguiente si cabe ───
            pages = Array.from(container.querySelectorAll('.page-sheet'));
            for (let i = 0; i < pages.length - 1; i++) {
                const editor = pages[i].querySelector('.page-editor-surface');
                const nextEditor = pages[i + 1]?.querySelector('.page-editor-surface');
                if (!editor || !nextEditor) continue;

                let pullLimit = 100;
                while (pullLimit-- > 0) {
                    const candidate = Array.from(nextEditor.children).find(
                        c => !c.hasAttribute('data-ec-cursor')
                    );
                    if (!candidate) break;

                    const lastEl = this.getLastMovableChild(editor);
                    
                    // 1. Si ambos son tablas: fusionar filas de candidate en lastEl
                    const isSameTable = lastEl && 
                        lastEl.tagName === 'TABLE' && 
                        candidate.tagName === 'TABLE';

                    // 2. Si ambos son listas del mismo tipo (UL o OL), podemos mover ítems <li> uno a uno
                    const isSameList = lastEl && 
                        (lastEl.tagName === 'UL' || lastEl.tagName === 'OL') && 
                        lastEl.tagName === candidate.tagName;

                    if (isSameTable) {
                        const targetTbody = lastEl.querySelector('tbody') || lastEl;
                        const srcTbody = candidate.querySelector('tbody') || candidate;
                        const firstRow = srcTbody.querySelector(':scope > tr');

                        if (!firstRow) {
                            candidate.remove();
                            continue;
                        }

                        // Mover la primera fila de la tabla candidata a la tabla anterior
                        targetTbody.appendChild(firstRow);

                        // Si la tabla candidata se quedó sin filas, eliminarla
                        const remainingRows = srcTbody.querySelectorAll(':scope > tr');
                        if (remainingRows.length === 0) {
                            candidate.remove();
                        }

                        if (editor.scrollHeight > editor.clientHeight + 1) {
                            // Desbordó: volver a dividir la tabla
                            const overflowTable = this.splitTableBlock(lastEl, editor);
                            if (overflowTable) {
                                nextEditor.insertBefore(overflowTable, nextEditor.firstChild);
                            } else {
                                if (!candidate.parentNode) {
                                    nextEditor.insertBefore(candidate, nextEditor.firstChild);
                                }
                                srcTbody.insertBefore(firstRow, srcTbody.firstChild);
                            }
                            break; // Página llena
                        }
                    } else if (isSameList) {
                        const firstLi = Array.from(candidate.children).find(c => c.tagName === 'LI');
                        if (!firstLi) {
                            candidate.remove();
                            continue;
                        }

                        // Mover el primer <li> del candidato a la lista en la página actual
                        lastEl.appendChild(firstLi);

                        if (candidate.children.length === 0) {
                            candidate.remove();
                        } else if (candidate.tagName === 'OL') {
                            const currentStart = parseInt(candidate.getAttribute('start') || '1', 10);
                            candidate.setAttribute('start', (currentStart + 1).toString());
                        }

                        if (editor.scrollHeight > editor.clientHeight + 1) {
                            // Desbordó: dividir la lista de nuevo
                            const overflowList = this.splitListBlock(lastEl, editor);
                            if (overflowList) {
                                nextEditor.insertBefore(overflowList, nextEditor.firstChild);
                            } else {
                                if (!candidate.parentNode) {
                                    nextEditor.insertBefore(candidate, nextEditor.firstChild);
                                }
                                candidate.insertBefore(firstLi, candidate.firstChild);
                            }
                            break; // Página llena
                        }
                    } else {
                        // Para cualquier otro elemento (<p>, <h2>, <blockquote>, etc.):
                        // Mover el elemento COMPLETO (nunca fusionar párrafos o viñetas horizontalmente)
                        editor.appendChild(candidate);

                        if (editor.scrollHeight > editor.clientHeight + 1) {
                            // No cupo entero: intentar dividirlo si es divisible por palabras
                            const overflow = this.splitBlockToFit(candidate, editor);
                            if (overflow) {
                                nextEditor.insertBefore(overflow, nextEditor.firstChild);
                            } else {
                                // Devolver entero a la siguiente página
                                nextEditor.insertBefore(candidate, nextEditor.firstChild);
                            }
                            break; // Página llena
                        }
                    }
                }
            }

            // ─── PASE 3: Eliminar páginas vacías finales (mantener mínimo 1) ───
            pages = Array.from(container.querySelectorAll('.page-sheet'));
            for (let i = pages.length - 1; i > 0; i--) {
                const editor = pages[i].querySelector('.page-editor-surface');
                if (!editor) continue;

                // Verificar si la página está vacía (ignorando marcadores de cursor)
                const realChildren = Array.from(editor.children).filter(
                    c => !c.hasAttribute('data-ec-cursor')
                );
                const hasRealContent = realChildren.some(c => {
                    const t = c.textContent?.trim();
                    const h = c.innerHTML?.trim();
                    const hasMedia = c.querySelector('img, table, iframe');
                    return t || (h && h !== '<br>' && h !== '<br/>') || hasMedia;
                });

                if (!hasRealContent) {
                    // Mover marcadores de cursor o selección si existen aquí
                    editor.querySelectorAll('[data-ec-cursor]').forEach(cMarker => {
                        const prevEditor = pages[i - 1]?.querySelector('.page-editor-surface');
                        if (prevEditor) prevEditor.appendChild(cMarker);
                    });
                    if (document.activeElement === editor) {
                        const prevEditor = pages[i - 1]?.querySelector('.page-editor-surface');
                        if (prevEditor) prevEditor.focus({ preventScroll: true });
                    }
                    pages[i].remove();
                } else {
                    break; // Detenerse en la primera página no vacía desde el final
                }
            }

            // Actualizar conteo y numeración
            pages = Array.from(container.querySelectorAll('.page-sheet'));
            this.pageCount = Math.max(1, pages.length);
            this.updateAllPageNumbers();

            // Restaurar cursor
            this.restoreCursor();

            // Re-sincronizar compensación geométrica de zoom (dimensiones de scroll en wrapper)
            window.PageLayoutManager?.applyZoom(true);

            this.isPaginating = false;

            // Procesar paginación encolada
            if (this.paginateQueued) {
                this.paginateQueued = false;
                setTimeout(() => this.paginate(), 20);
            }
        },

        updateAllPageNumbers() {
            const container = this.getContainer();
            if (!container) return;

            const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
            const hf = sheet?.headerFooter || {
                showHeader: false,
                showFooter: false,
                headerText: '',
                footerText: '',
                showPageNumbers: false
            };

            const total = this.pageCount || 1;
            const showHeader = hf.showHeader || hf.showPageNumbers;
            const showFooter = hf.showFooter || hf.showPageNumbers;

            const pages = Array.from(container.querySelectorAll('.page-sheet'));
            pages.forEach((page, idx) => {
                const pageNum = idx + 1;
                page.setAttribute('data-page', pageNum);

                // Header
                const headerBar = page.querySelector('.page-header-bar');
                if (headerBar) {
                    headerBar.classList.toggle('zone-hidden', !showHeader);
                    const hText = headerBar.querySelector('.page-header-text');
                    if (hText) hText.textContent = hf.headerText || '';
                    const hBadge = headerBar.querySelector('.page-counter-badge');
                    if (hBadge) {
                        hBadge.textContent = `Pág. ${pageNum} de ${total}`;
                        hBadge.classList.toggle('hidden', !hf.showPageNumbers);
                    }
                }

                // Footer
                const footerBar = page.querySelector('.page-footer-bar');
                if (footerBar) {
                    footerBar.classList.toggle('zone-hidden', !showFooter);
                    const fText = footerBar.querySelector('.page-footer-text');
                    if (fText) fText.textContent = hf.footerText || '';
                    const fNum = footerBar.querySelector('.page-footer-num');
                    if (fNum) {
                        fNum.textContent = `${pageNum}`;
                        fNum.classList.toggle('hidden', !hf.showPageNumbers);
                    }
                }
            });

            const statPages = document.getElementById('stat-pages');
            if (statPages) statPages.textContent = total.toString();
        },

        insertPageBreak() {
            if (window.isAuditMode) return;

            const container = this.getContainer();
            if (!container) return;

            const activeEditor = this.getActiveEditor();
            const currentPage = activeEditor ? activeEditor.closest('.page-sheet') : null;
            const pageNum = currentPage ? parseInt(currentPage.getAttribute('data-page'), 10) : this.pageCount;

            const newPage = this.createPageDOM(pageNum + 1, '<p><br></p>');
            if (currentPage && currentPage.nextSibling) {
                container.insertBefore(newPage, currentPage.nextSibling);
            } else {
                container.appendChild(newPage);
            }

            this.pageCount++;
            this.updateAllPageNumbers();

            const newEditor = newPage.querySelector('.page-editor-surface');
            if (newEditor) {
                newEditor.focus({ preventScroll: true });
            }

            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            TextDocStateManager.triggerAutoSave();
            TextDocStateManager.showToast('Salto de página insertado');
        },

        getCleanHTML() {
            const container = this.getContainer();
            if (!container) return '<p><br></p>';

            const editors = Array.from(container.querySelectorAll('.page-editor-surface'));
            if (editors.length === 0) return '<p><br></p>';

            const tempDiv = document.createElement('div');
            editors.forEach(ed => {
                const clone = ed.cloneNode(true);
                // Remover marcadores de cursor y clases temporales de selección y color
                clone.querySelectorAll('[data-ec-cursor]').forEach(m => m.remove());
                clone.querySelectorAll('.doc-img-selected').forEach(img => img.classList.remove('doc-img-selected'));
                clone.querySelectorAll('.spellcheck-highlight-active').forEach(m => {
                    const parent = m.parentNode;
                    if (parent) {
                        parent.replaceChild(document.createTextNode(m.textContent), m);
                        parent.normalize();
                    }
                });
                clone.querySelectorAll('.educonta-color-preview-target').forEach(el => {
                    el.classList.remove('educonta-color-preview-target');
                    delete el.dataset.ecOrigColor;
                });
                clone.querySelectorAll('span[data-ec-pending], span[data-ec-pending-color], span[data-ec-pending-bg]').forEach(s => {
                    if (s.textContent.replace(/\u200B/g, '').trim() === '') {
                        s.remove();
                    } else {
                        s.removeAttribute('data-ec-pending');
                        s.removeAttribute('data-ec-pending-color');
                        s.removeAttribute('data-ec-pending-bg');
                    }
                });
                while (clone.firstChild) {
                    tempDiv.appendChild(clone.firstChild);
                }
            });

            // Re-unificar tablas partidas y limpiar atributos temporales
            this.healFragmentedTables(tempDiv);
            tempDiv.querySelectorAll('[data-ec-table-part]').forEach(t => t.removeAttribute('data-ec-table-part'));

            return tempDiv.innerHTML.replace(/\u200B/g, '').trim() || '<p><br></p>';
        },

        getPagesContent() {
            return [this.getCleanHTML()];
        }
    };

export { MultiPageEngine };