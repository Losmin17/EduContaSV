/**
 * table-manager.js — TableManager
 * Gestión contextual de tablas: barra flotante, manipulación de filas/columnas,
 * estilos de cuadrícula y personalización de celdas.
 * EduConta SV
 */
import { MultiPageEngine } from './engine.js';
import { TextDocStateManager } from './state.js';

const TableManager = {
    activeTable: null,
    activeCell: null,
    toolbarEl: null,
    colorPopoverEl: null,
    _rafId: null,

    init() {
        this.toolbarEl = document.getElementById('table-floating-toolbar');
        this.colorPopoverEl = document.getElementById('table-color-popover');

        // Escuchar clics globales para mostrar u ocultar la barra flotante de tabla
        document.addEventListener('click', (e) => {
            if (window.isAuditMode) return;

            // Si el clic fue dentro de la barra flotante o del popover, no ocultar
            if (this.toolbarEl && this.toolbarEl.contains(e.target)) return;
            if (this.colorPopoverEl && this.colorPopoverEl.contains(e.target)) return;

            // Verificar si el cursor o clic está dentro de una celda de tabla en el editor
            const cell = e.target.closest && e.target.closest('.page-editor-surface td, .page-editor-surface th');
            if (cell) {
                const table = cell.closest('table');
                if (table) {
                    this.showToolbarFor(table, cell);
                    return;
                }
            }

            this.hideToolbar();
        });

        // Reposicionar en scroll o resize
        window.addEventListener('resize', () => {
            if (this.activeTable && this.toolbarEl && this.toolbarEl.style.display !== 'none') {
                this.updateToolbarPosition();
            }
        });

        document.querySelector('.editor-scroll-area')?.addEventListener('scroll', () => {
            if (this.activeTable && this.toolbarEl && this.toolbarEl.style.display !== 'none') {
                this.updateToolbarPosition();
            }
        });

        // Escuchar cambios de selección dentro del editor
        document.addEventListener('selectionchange', () => {
            if (window.isAuditMode) return;
            if (this._rafId) cancelAnimationFrame(this._rafId);
            this._rafId = requestAnimationFrame(() => {
                const sel = window.getSelection();
                if (!sel || sel.rangeCount === 0) return;
                const node = sel.anchorNode;
                if (!node) return;
                const el = node.nodeType === 3 ? node.parentElement : node;
                const cell = el ? el.closest('.page-editor-surface td, .page-editor-surface th') : null;
                if (cell) {
                    const table = cell.closest('table');
                    if (table) {
                        this.showToolbarFor(table, cell);
                        return;
                    }
                }
                // Si el foco se movió a otro elemento que no es la tabla ni sus controles
                if (!document.activeElement?.closest('#table-floating-toolbar, #table-color-popover')) {
                    if (this.toolbarEl && !this.toolbarEl.contains(document.activeElement)) {
                        this.hideToolbar();
                    }
                }
            });
        });
    },

    showToolbarFor(table, cell) {
        this.activeTable = table;
        this.activeCell = cell;
        if (!this.toolbarEl) return;

        this.toolbarEl.style.display = 'flex';
        this.updateToolbarPosition();
    },

    hideToolbar() {
        if (this.toolbarEl) {
            this.toolbarEl.style.display = 'none';
        }
        if (this.colorPopoverEl) {
            this.colorPopoverEl.style.display = 'none';
        }
        this.activeTable = null;
        this.activeCell = null;
    },

    updateToolbarPosition() {
        if (!this.activeTable || !this.toolbarEl || this.toolbarEl.style.display === 'none') return;
        const targetRect = (this.activeCell || this.activeTable).getBoundingClientRect();
        const tableRect = this.activeTable.getBoundingClientRect();
        const tbRect = this.toolbarEl.getBoundingClientRect();

        const tbW = tbRect.width || 380;
        const tbH = tbRect.height || 42;

        // Centrar horizontalmente respecto a la celda o la tabla
        let left = targetRect.left + (targetRect.width / 2) - (tbW / 2) + window.scrollX;
        
        // Mantener dentro de los bordes visibles de la ventana
        if (left < 12) left = 12;
        if (left + tbW > window.innerWidth - 12) {
            left = window.innerWidth - tbW - 12;
        }

        // Posicionar arriba de la tabla o celda
        let top = targetRect.top + window.scrollY - tbH - 8;

        // Si choca con el header superior fijo, ubicar debajo de la celda
        const topBar = document.querySelector('.sticky-fixed-controls, #editor-sticky-controls');
        const minTop = topBar ? (topBar.getBoundingClientRect().bottom + window.scrollY + 8) : (window.scrollY + 56);
        if (top < minTop) {
            top = targetRect.bottom + window.scrollY + 8;
        }

        this.toolbarEl.style.top = `${Math.round(top)}px`;
        this.toolbarEl.style.left = `${Math.round(left)}px`;
    },

    // ─── OPERACIONES DE FILAS ─────────────────────────────────────────────

    insertRowAbove() {
        if (!this.activeTable || window.isAuditMode) return;
        const currentCell = this.activeCell || this.activeTable.querySelector('td, th');
        const currentRow = currentCell ? currentCell.closest('tr') : this.activeTable.rows[0];
        if (!currentRow) return;

        const colCount = currentRow.children.length;
        const newRow = document.createElement('tr');
        for (let i = 0; i < colCount; i++) {
            const td = document.createElement('td');
            td.innerHTML = '<br>';
            newRow.appendChild(td);
        }

        currentRow.parentNode.insertBefore(newRow, currentRow);
        this.focusFirstCell(newRow);
        this.recordChange('Fila insertada arriba');
    },

    insertRowBelow() {
        if (!this.activeTable || window.isAuditMode) return;
        const currentCell = this.activeCell || this.activeTable.querySelector('td, th');
        const currentRow = currentCell ? currentCell.closest('tr') : this.activeTable.rows[this.activeTable.rows.length - 1];
        if (!currentRow) return;

        const colCount = currentRow.children.length;
        const newRow = document.createElement('tr');
        for (let i = 0; i < colCount; i++) {
            const td = document.createElement('td');
            td.innerHTML = '<br>';
            newRow.appendChild(td);
        }

        if (currentRow.nextSibling) {
            currentRow.parentNode.insertBefore(newRow, currentRow.nextSibling);
        } else {
            const tbody = this.activeTable.querySelector('tbody') || this.activeTable;
            tbody.appendChild(newRow);
        }

        this.focusFirstCell(newRow);
        this.recordChange('Fila insertada abajo');
    },

    deleteRow() {
        if (!this.activeTable || window.isAuditMode) return;
        const currentCell = this.activeCell || this.activeTable.querySelector('td, th');
        const currentRow = currentCell ? currentCell.closest('tr') : null;
        if (!currentRow) return;

        if (this.activeTable.rows.length <= 1) {
            this.deleteTable();
            return;
        }

        currentRow.remove();
        this.hideToolbar();
        this.recordChange('Fila eliminada');
    },

    // ─── OPERACIONES DE COLUMNAS ──────────────────────────────────────────

    insertColLeft() {
        if (!this.activeTable || window.isAuditMode) return;
        const currentCell = this.activeCell || this.activeTable.querySelector('td, th');
        const colIdx = currentCell ? currentCell.cellIndex : 0;

        Array.from(this.activeTable.rows).forEach((row) => {
            const isHeader = (row.parentElement && row.parentElement.tagName.toLowerCase() === 'thead') || row.firstElementChild?.tagName.toLowerCase() === 'th';
            const newCell = document.createElement(isHeader ? 'th' : 'td');
            newCell.innerHTML = isHeader ? 'Columna' : '<br>';

            if (colIdx >= 0 && row.children[colIdx]) {
                row.insertBefore(newCell, row.children[colIdx]);
            } else {
                row.insertBefore(newCell, row.firstChild);
            }
        });

        this.recordChange('Columna insertada a la izquierda');
    },

    insertColRight() {
        if (!this.activeTable || window.isAuditMode) return;
        const currentCell = this.activeCell || this.activeTable.querySelector('td, th');
        const colIdx = currentCell ? currentCell.cellIndex : this.activeTable.rows[0]?.children.length - 1;

        Array.from(this.activeTable.rows).forEach((row) => {
            const isHeader = (row.parentElement && row.parentElement.tagName.toLowerCase() === 'thead') || row.firstElementChild?.tagName.toLowerCase() === 'th';
            const newCell = document.createElement(isHeader ? 'th' : 'td');
            newCell.innerHTML = isHeader ? 'Columna' : '<br>';

            if (colIdx >= 0 && row.children[colIdx]) {
                row.insertBefore(newCell, row.children[colIdx].nextSibling);
            } else {
                row.appendChild(newCell);
            }
        });

        this.recordChange('Columna insertada a la derecha');
    },

    deleteCol() {
        if (!this.activeTable || window.isAuditMode) return;
        const currentCell = this.activeCell || this.activeTable.querySelector('td, th');
        if (!currentCell) return;
        const colIdx = currentCell.cellIndex;

        const rows = Array.from(this.activeTable.rows);
        if (rows[0] && rows[0].children.length <= 1) {
            this.deleteTable();
            return;
        }

        rows.forEach((row) => {
            if (row.children[colIdx]) {
                row.children[colIdx].remove();
            }
        });

        this.hideToolbar();
        this.recordChange('Columna eliminada');
    },

    // ─── ELIMINAR TABLA COMPLETA ──────────────────────────────────────────

    deleteTable() {
        if (!this.activeTable || window.isAuditMode) return;
        const table = this.activeTable;
        this.hideToolbar();
        table.remove();
        this.recordChange('Tabla eliminada');
    },

    // ─── ESTILOS Y FORMATO DE TABLA ────────────────────────────────────────

    cycleStyle() {
        if (!this.activeTable || window.isAuditMode) return;
        const styles = ['table-striped', 'table-bordered', 'table-minimal', 'table-borderless'];
        const styleNames = {
            'table-striped': 'Rayada (Striped)',
            'table-bordered': 'Cuadrícula Completa',
            'table-minimal': 'Minimalista (Líneas)',
            'table-borderless': 'Sin Bordes (Limpia)'
        };

        let currentIdx = -1;
        for (let i = 0; i < styles.length; i++) {
            if (this.activeTable.classList.contains(styles[i])) {
                currentIdx = i;
                break;
            }
        }

        // Remover todos los estilos anteriores
        styles.forEach(s => this.activeTable.classList.remove(s));

        // Siguiente estilo
        const nextIdx = (currentIdx + 1) % styles.length;
        const nextStyle = styles[nextIdx];
        this.activeTable.classList.add(nextStyle);

        // Si es borderless, limpiar inline borders que restrinjan
        if (nextStyle === 'table-borderless') {
            this.activeTable.style.border = 'none';
        } else {
            this.activeTable.style.border = '';
        }

        TextDocStateManager.showToast(`Estilo de Tabla: ${styleNames[nextStyle]}`);
        this.recordChange('Estilo de tabla cambiado');
    },

    toggleCellColorPopover(event) {
        if (!this.colorPopoverEl) return;
        if (this.colorPopoverEl.style.display === 'flex') {
            this.colorPopoverEl.style.display = 'none';
            return;
        }

        const btn = event.currentTarget || event.target;
        const rect = btn.getBoundingClientRect();

        this.colorPopoverEl.style.display = 'flex';
        this.colorPopoverEl.style.top = `${Math.round(rect.bottom + window.scrollY + 6)}px`;
        this.colorPopoverEl.style.left = `${Math.round(rect.left + window.scrollX - 60)}px`;
    },

    setCellColor(color) {
        if (!this.activeCell || window.isAuditMode) return;
        if (!color || color === 'transparent') {
            this.activeCell.style.backgroundColor = '';
        } else {
            this.activeCell.style.backgroundColor = color;
        }
        if (this.colorPopoverEl) this.colorPopoverEl.style.display = 'none';
        this.recordChange('Color de celda actualizado');
    },

    alignCell(alignment) {
        if (!this.activeCell || window.isAuditMode) return;
        this.activeCell.style.textAlign = alignment;
        this.recordChange(`Alineación de celda: ${alignment}`);
    },

    // ─── HELPERS AUXILIARES ───────────────────────────────────────────────

    focusFirstCell(row) {
        const firstCell = row.querySelector('td, th');
        if (firstCell) {
            const range = document.createRange();
            range.selectNodeContents(firstCell);
            range.collapse(true);
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(range);
            }
            this.activeCell = firstCell;
            this.updateToolbarPosition();
        }
    },

    recordChange(message) {
        TextDocStateManager.pushHistory();
        MultiPageEngine.debouncePaginate();
        TextDocStateManager.triggerAutoSave();
        if (message && typeof TextDocStateManager.showToast === 'function') {
            TextDocStateManager.showToast(message);
        }
    }
};

export { TableManager };
