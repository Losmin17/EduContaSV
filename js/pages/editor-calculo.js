let projects = [];
let proyecto_actual = null;
let spreadsheetEngine = null;
let spreadsheetCollabEngine = null;
let currentCategoryFilter = 'all';
let currentSearchTerm = '';

// === CARGAR PROYECTO ACTUAL (LocalStorage / URL params) ===
function loadCurrentProject() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlProjectId = urlParams.get('id');
    const lastProjectId = urlProjectId || localStorage.getItem('educonta_last_project_id');

    const storageKeys = ['educonta_projects_calculo', 'educonta_projects_hojas', 'educonta_projects'];
    
    // 1. Buscar primero por ID exacto en todas las bóvedas
    if (lastProjectId) {
        for (const key of storageKeys) {
            const raw = localStorage.getItem(key);
            if (raw) {
                try {
                    const list = JSON.parse(raw);
                    if (Array.isArray(list) && list.length > 0) {
                        const found = list.find(p => p.id === lastProjectId);
                        if (found) {
                            projects = list;
                            proyecto_actual = found;
                            break;
                        }
                    }
                } catch (e) {}
            }
        }
    }

    // 2. Si no se encontró por ID, tomar el primer proyecto disponible
    if (!proyecto_actual) {
        for (const key of storageKeys) {
            const raw = localStorage.getItem(key);
            if (raw) {
                try {
                    const list = JSON.parse(raw);
                    if (Array.isArray(list) && list.length > 0) {
                        projects = list;
                        proyecto_actual = list[0];
                        break;
                    }
                } catch (e) {}
            }
        }
    }

    // 3. Si no existe ninguno, crear nuevo proyecto por defecto
    if (!proyecto_actual) {
        proyecto_actual = {
            id: lastProjectId || ('proj_calc_' + Date.now()),
            name: 'Hoja de Cálculo',
            type: 'calculo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: [{ id: 'sheet_1', name: 'Hoja1', data: {} }]
        };
        projects = [proyecto_actual];
        localStorage.setItem('educonta_projects_calculo', JSON.stringify(projects));
    }

    if (proyecto_actual) {
        localStorage.setItem('educonta_last_project_id', proyecto_actual.id);
    }
}

// === RENOMBRAR PROYECTO CON MORPHING ANIMADO DESDE EL INDICADOR ===
let isMorphingRename = false;

function openMorphRenameModal() {
    if (isMorphingRename) return;
    const card = document.getElementById('morph-rename-card');
    const badge = document.getElementById('current-project-badge');
    const input = document.getElementById('morph-rename-input');
    const title = document.getElementById('morph-card-title');
    const content = document.getElementById('morph-card-content');
    if (!card || !badge || !input || !title || !content) return;

    if (card.parentElement !== document.body) {
        document.body.appendChild(card);
    }

    isMorphingRename = true;
    const currentName = (proyecto_actual && proyecto_actual.name) ? proyecto_actual.name : 'Hoja de Cálculo';
    title.textContent = currentName;
    input.value = currentName;

    // Obtener dimensiones y coordenadas exactas del indicador original
    const rect = badge.getBoundingClientRect();

    // Estado inicial de la tarjeta: idéntico en posición y tamaño al indicador
    card.style.transition = 'none';
    card.style.top = `${rect.top}px`;
    card.style.left = `${rect.left}px`;
    card.style.width = `${rect.width}px`;
    card.style.height = `${rect.height || 28}px`;
    card.style.borderRadius = '12px';
    card.style.opacity = '1';
    content.style.opacity = '0';
    card.classList.remove('hidden');
    badge.style.opacity = '0';

    // Animar expansión fluida transformándose en modal
    requestAnimationFrame(() => {
        card.style.transition = 'all 280ms cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.top = `${rect.top}px`;
        card.style.left = `${rect.left}px`;
        card.style.width = '300px';
        card.style.height = '118px';
        card.style.borderRadius = '18px';

        setTimeout(() => {
            content.style.opacity = '1';
            input.focus();
            input.select();
            isMorphingRename = false;
        }, 110);
    });
}

function closeMorphRenameModal(save = false) {
    if (isMorphingRename) return;
    const card = document.getElementById('morph-rename-card');
    const badge = document.getElementById('current-project-badge');
    const input = document.getElementById('morph-rename-input');
    const title = document.getElementById('morph-card-title');
    const content = document.getElementById('morph-card-content');
    if (!card || !badge || !input || !title || !content) return;
    if (card.classList.contains('hidden')) return;

    isMorphingRename = true;
    content.style.opacity = '0';

    let finalName = (proyecto_actual && proyecto_actual.name) ? proyecto_actual.name : 'Hoja de Cálculo';

    if (save && proyecto_actual) {
        const newName = input.value.trim();
        if (newName && newName !== proyecto_actual.name) {
            finalName = newName;
            proyecto_actual.name = newName;
            proyecto_actual.updatedAt = new Date().toISOString();

            const projectNameEl = document.getElementById('current-project-name');
            if (projectNameEl) projectNameEl.textContent = newName;
            document.title = `${newName} | EduConta SV`;

            const storageKey = typeof getProjectsStorageKey === 'function' ? getProjectsStorageKey('calculo') : 'educonta_projects_calculo';
            let localProjects = JSON.parse(localStorage.getItem(storageKey)) || [];
            const idx = localProjects.findIndex(p => p.id === proyecto_actual.id);
            if (idx !== -1) {
                localProjects[idx] = proyecto_actual;
            } else {
                localProjects.unshift(proyecto_actual);
            }
            localStorage.setItem(storageKey, JSON.stringify(localProjects));
            saveSpreadsheetManual();
        }
    }

    // Actualizar el título del header del morph card para que muestre el texto final sin cortarse
    title.textContent = finalName;

    // Medir la posición y tamaño del indicador
    const rect = badge.getBoundingClientRect();

    // Animar regreso suave al estado del indicador original
    card.style.transition = 'all 240ms cubic-bezier(0.16, 1, 0.3, 1)';
    card.style.top = `${rect.top}px`;
    card.style.left = `${rect.left}px`;
    card.style.width = `${Math.max(rect.width, 100)}px`;
    card.style.height = `${rect.height || 28}px`;
    card.style.borderRadius = '12px';

    setTimeout(() => {
        card.classList.add('hidden');
        badge.style.opacity = '1';
        isMorphingRename = false;
    }, 240);
}

function handleMorphRenameKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        closeMorphRenameModal(true);
    } else if (event.key === 'Escape') {
        event.preventDefault();
        closeMorphRenameModal(false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        if (typeof injectSharedUI === 'function') {
            injectSharedUI('shared-components-root');
        }
    } catch (e) {}

    loadCurrentProject();

    const projectNameEl = document.getElementById('current-project-name');
    if (projectNameEl && proyecto_actual) {
        projectNameEl.textContent = proyecto_actual.name || 'Hoja de Cálculo';
        document.title = `${proyecto_actual.name || 'Hoja de Cálculo'} | EduConta SV`;
    }

    const gridEl = document.getElementById('educonta-spreadsheet-grid');
    if (!gridEl) return;

    try {
        let initialSheets = [{ id: 'sheet_1', name: 'Hoja1', data: {} }];
        if (proyecto_actual && proyecto_actual.data) {
            if (Array.isArray(proyecto_actual.data) && proyecto_actual.data.length > 0) {
                initialSheets = proyecto_actual.data;
            } else if (typeof proyecto_actual.data === 'object') {
                initialSheets = [{ id: 'sheet_1', name: 'Hoja1', data: proyecto_actual.data }];
            }
        }

        spreadsheetEngine = new EduContaSpreadsheetEngine(gridEl, {
            rowCount: 100,
            colCount: 26,
            sheets: initialSheets,
            onCellSelect: (info) => {
                updateSelectionUI(info);
                if (spreadsheetCollabEngine) {
                    spreadsheetCollabEngine.broadcastSelection(info);
                }
            },
            onCellChange: (changeInfo) => {
                if (spreadsheetCollabEngine) {
                    spreadsheetCollabEngine.broadcastCellUpdate(changeInfo);
                }
            },
            onCellRangeChange: (rangeInfo) => {
                if (spreadsheetCollabEngine) {
                    spreadsheetCollabEngine.broadcastCellRangeUpdate(rangeInfo);
                }
            },
            onChange: () => markUnsavedChanges(),
        });

        // Inicializar Colaboración Multijugador en Tiempo Real
        try {
            if (typeof SpreadsheetCollabEngine !== 'undefined' && proyecto_actual) {
                spreadsheetCollabEngine = new SpreadsheetCollabEngine(proyecto_actual.id, spreadsheetEngine);
                spreadsheetCollabEngine.init();
            }
        } catch (collabErr) {
            console.warn('Colaboración en tiempo real no inicializada:', collabErr);
        }

        buildFormulasGuideList();
    } catch (err) {
        console.error('Error al inicializar la hoja de cálculo:', err);
    } finally {
        if (typeof window.dismissGlobalPreloader === 'function') {
            window.dismissGlobalPreloader();
        }
    }
});

// === BARRA DE ESTADO Y SINCRONIZACIÓN DE HERRAMIENTAS (suma / promedio / fuente / tamaño / etc) ===
function updateSelectionUI(info) {
    const nameBox = document.getElementById('cell-name-box');
    if (nameBox) nameBox.textContent = info.cellRef;

    const cellData = info.data || {};

    const fontSelect = document.getElementById('tool-font-name');
    if (fontSelect) fontSelect.value = cellData.font || 'Plus Jakarta Sans';

    const sizeSelect = document.getElementById('tool-font-size');
    if (sizeSelect) sizeSelect.value = cellData.size ? String(cellData.size) : '10';

    const btnBold = document.getElementById('btn-bold');
    if (btnBold) btnBold.classList.toggle('bg-amber-500/20', !!cellData.bold);

    const btnItalic = document.getElementById('btn-italic');
    if (btnItalic) btnItalic.classList.toggle('bg-amber-500/20', !!cellData.italic);

    const btnUnderline = document.getElementById('btn-underline');
    if (btnUnderline) btnUnderline.classList.toggle('bg-amber-500/20', !!cellData.underline);

    const indText = document.getElementById('indicator-text-color');
    if (indText) indText.style.backgroundColor = cellData.color || '#475569';

    const indBg = document.getElementById('indicator-bg-color');
    if (indBg) indBg.style.backgroundColor = cellData.bgcolor || '#f59e0b';

    // Sincronizar Formato Activo de la Celda o Columna
    const effectiveFmt = info.effectiveFmt || (info.data && info.data.fmt) || (info.colFormat && info.colFormat.fmt) || 'general';
    const fmtMeta = info.formatMeta || ((spreadsheetEngine && typeof spreadsheetEngine.getFormatMeta === 'function') 
        ? spreadsheetEngine.getFormatMeta(effectiveFmt) 
        : { key: 'general', label: 'General / Texto', short: '123', icon: 'fa-font', colorClass: '' });

    // 1. Píldora de Formato en la Barra de Fórmulas
    const fmtBadge = document.getElementById('cell-format-badge');
    const fmtBadgeText = document.getElementById('cell-format-badge-text');
    const fmtBadgeIcon = document.getElementById('cell-format-badge-icon');
    if (fmtBadge && fmtBadgeText && fmtBadgeIcon) {
        fmtBadgeText.textContent = fmtMeta.label;
        fmtBadgeIcon.className = `fas ${fmtMeta.icon} text-[10px]`;
        fmtBadge.className = `h-8 px-2.5 rounded-xl flex items-center gap-1.5 text-xs tabular-nums font-bold shadow-sm shrink-0 transition-all cursor-pointer active:scale-95 group border ${fmtMeta.colorClass || 'text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80'}`;
        fmtBadge.title = `Formato de la celda activa: ${fmtMeta.label} (Clic para cambiar)`;
    }

    // 2. Etiqueta en Dropdown de la Barra de Herramientas
    const formatDropdownLabel = document.getElementById('current-format-label');
    if (formatDropdownLabel) {
        formatDropdownLabel.textContent = fmtMeta.short;
    }

    // 3. Botones de Formato Rápido en la Barra de Herramientas ($ USD, %, ,00)
    const btnUsd = document.getElementById('btn-format-usd');
    if (btnUsd) {
        const isUsd = (effectiveFmt === 'usd' || effectiveFmt === 'accounting');
        btnUsd.classList.toggle('bg-emerald-500/25', isUsd);
        btnUsd.classList.toggle('ring-1', isUsd);
        btnUsd.classList.toggle('ring-emerald-500/50', isUsd);
        btnUsd.classList.toggle('shadow-sm', isUsd);
    }

    const btnPercent = document.getElementById('btn-format-percent');
    if (btnPercent) {
        const isPercent = (effectiveFmt === 'percent');
        btnPercent.classList.toggle('bg-sky-500/25', isPercent);
        btnPercent.classList.toggle('ring-1', isPercent);
        btnPercent.classList.toggle('ring-sky-500/50', isPercent);
        btnPercent.classList.toggle('shadow-sm', isPercent);
    }

    const btnNumber = document.getElementById('btn-format-number');
    if (btnNumber) {
        const isNumber = (effectiveFmt === 'number' || effectiveFmt === 'decimal');
        btnNumber.classList.toggle('bg-amber-500/20', isNumber);
        btnNumber.classList.toggle('ring-1', isNumber);
        btnNumber.classList.toggle('ring-amber-500/50', isNumber);
        btnNumber.classList.toggle('shadow-sm', isNumber);
    }

    const stats = info.stats || { sum: 0, avg: 0, count: 0, min: 0, max: 0 };
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('stat-sum', '$' + stats.sum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setText('stat-avg', stats.avg.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setText('stat-count', String(stats.count));
    setText('stat-min', stats.min.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setText('stat-max', stats.max.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

    // Sincronizar Barra Contextual de Diseño de Tabla Inteligente
    const tableToolbar = document.getElementById('table-design-toolbar');
    if (tableToolbar) {
        if (info.table) {
            currentActiveTable = info.table;
            tableToolbar.classList.remove('hidden');
            tableToolbar.classList.add('flex');

            const nameInput = document.getElementById('tbl-prop-name');
            if (nameInput && document.activeElement !== nameInput) {
                nameInput.value = info.table.name || 'Tabla';
            }

            const setChk = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.checked = !!val;
            };

            setChk('tbl-chk-header', info.table.hasHeaderRow);
            setChk('tbl-chk-total', info.table.hasTotalRow);
            setChk('tbl-chk-banded-rows', info.table.hasBandedRows);
            setChk('tbl-chk-first-col', info.table.highlightFirstCol);
            setChk('tbl-chk-last-col', info.table.highlightLastCol);
        } else {
            currentActiveTable = null;
            tableToolbar.classList.add('hidden');
            tableToolbar.classList.remove('flex');
        }
    }
}

function blurActiveControl() {
    if (document.activeElement && typeof document.activeElement.blur === 'function' && document.activeElement !== document.body) {
        document.activeElement.blur();
    }
}

function escapeHtmlCalc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

let autoSaveTimer = null;

function triggerAutoSave() {
    if (window.isAuditMode || !proyecto_actual) return;
    if (autoSaveTimer) clearTimeout(autoSaveTimer);

    const indicator = document.getElementById('save-indicator');
    if (indicator) {
        indicator.innerHTML = '<i class="fas fa-circle-exclamation text-amber-500 text-xs animate-pulse"></i> <span>SIN GUARDAR</span>';
        indicator.className = "h-7 px-2.5 rounded-xl text-[10px] tabular-nums font-bold flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0";
    }

    autoSaveTimer = setTimeout(() => {
        autoSaveTimer = null;
        saveSpreadsheetManual(false);
    }, 3000);
}

function flushSaveSync() {
    if (!spreadsheetEngine || !proyecto_actual || window.isAuditMode) return;
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }
    if (spreadsheetEngine.isEditing) {
        spreadsheetEngine.commitInlineEditing();
    }
    try {
        proyecto_actual.data = spreadsheetEngine.sheets;
        proyecto_actual.updatedAt = new Date().toISOString();

        const storageKey = typeof getProjectsStorageKey === 'function' ? getProjectsStorageKey('calculo') : 'educonta_projects_calculo';
        let localProjects = JSON.parse(localStorage.getItem(storageKey)) || [];
        const idx = localProjects.findIndex(p => p.id === proyecto_actual.id);
        if (idx !== -1) {
            localProjects[idx] = proyecto_actual;
        } else {
            localProjects.unshift(proyecto_actual);
        }
        localStorage.setItem(storageKey, JSON.stringify(localProjects));
        localStorage.setItem('educonta_last_project_id', proyecto_actual.id);
        markSaved();
    } catch (e) {
        console.error("Error en guardado sincrónico:", e);
    }
}

function markUnsavedChanges() {
    triggerAutoSave();
}

function markSaved() {
    const indicator = document.getElementById('save-indicator');
    if (!indicator) return;
    indicator.innerHTML = '<i class="fas fa-check-circle text-emerald-500 text-xs"></i> <span>LOCAL</span>';
    indicator.className = "h-7 px-2.5 rounded-xl text-[10px] tabular-nums font-bold flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0";
}

window.updateSyncUI = function(state, detail = "") {
    const cloudInd = document.getElementById('cloud-indicator');
    if (!cloudInd) return;

    if (!navigator.onLine && state !== 'offline') {
        state = 'offline';
    }

    if (state === 'syncing') {
        cloudInd.className = "h-7 px-2 justify-center rounded-lg text-[10px] tabular-nums font-bold flex items-center gap-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 shrink-0 animate-pulse";
        cloudInd.innerHTML = '<i class="fas fa-sync fa-spin text-[10px]"></i> <span>SINCRONIZANDO</span>';
    } else if (state === 'success' || state === 'online') {
        cloudInd.className = "h-7 px-2 justify-center rounded-lg text-[10px] tabular-nums font-bold flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0";
        cloudInd.innerHTML = '<i class="fas fa-cloud-check text-[10px]"></i> <span>SINCRONIZADO</span>';
    } else if (state === 'offline') {
        cloudInd.className = "h-7 px-2 justify-center rounded-lg text-[10px] tabular-nums font-bold flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0";
        cloudInd.innerHTML = '<i class="fas fa-wifi-slash text-[10px]"></i> <span>OFFLINE</span>';
    } else if (state === 'local') {
        cloudInd.className = "h-7 px-2 justify-center rounded-lg text-[10px] tabular-nums font-bold flex items-center gap-1 bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30 shrink-0";
        cloudInd.innerHTML = '<i class="fas fa-hdd text-[10px]"></i> <span>SOLO LOCAL</span>';
    } else if (state === 'error') {
        cloudInd.className = "h-7 px-2 justify-center rounded-lg text-[10px] tabular-nums font-bold flex items-center gap-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 shrink-0";
        cloudInd.innerHTML = '<i class="fas fa-exclamation-triangle text-[10px]"></i> <span>ERROR SYNC</span>';
    }
};

window.addEventListener('online', () => {
    if (typeof showSyncToast === 'function') showSyncToast('online');
    if (typeof saveSpreadsheetState === 'function') saveSpreadsheetState();
});
window.addEventListener('offline', () => {
    if (typeof updateSyncUI === 'function') updateSyncUI('offline');
    if (typeof showSyncToast === 'function') showSyncToast('offline');
});

// === BARRA DE FÓRMULAS ===
function handleFormulaInputKey(event) {
    // Delegado nativo en spreadsheetEngine.bindFormulaBar()
}

function insertAccountingFormula(fnName) {
    if (!spreadsheetEngine) return;
    const eng = spreadsheetEngine;
    const r1 = Math.min(eng.selectStartRow, eng.selectEndRow);
    const r2 = Math.max(eng.selectStartRow, eng.selectEndRow);
    const c1 = Math.min(eng.selectStartCol, eng.selectEndCol);
    const c2 = Math.max(eng.selectStartCol, eng.selectEndCol);

    let range;
    if (r1 === r2 && c1 === c2) {
        let top = r1;
        while (top > 0) {
            const cell = eng.sheets[eng.activeSheetIndex].data[`${top - 1}_${c1}`];
            if (!cell || (cell.v === undefined && !cell.f)) break;
            top--;
        }
        if (top === r1 && r1 > 0) top = Math.max(0, r1 - 1);
        range = `${eng.getColName(c1)}${top + 1}:${eng.getColName(c1)}${r1}`;
        if (top === r1) range = `${eng.getColName(c1)}${r1 + 1}:${eng.getColName(c1)}${r1 + 1}`;
    } else {
        range = `${eng.getColName(c1)}${r1 + 1}:${eng.getColName(c2)}${r2 + 1}`;
    }

    const formula = `=${fnName}(${range})`;
    const formulaInput = document.getElementById('formula-input');
    if (formulaInput) {
        formulaInput.value = formula;
        formulaInput.focus();
    } else {
        eng.setCellValue(eng.activeRow, eng.activeCol, formula);
    }
}

// === HISTORIAL ===
function toolUndo() { spreadsheetEngine && spreadsheetEngine.undo(); }
function toolRedo() { spreadsheetEngine && spreadsheetEngine.redo(); }

// === FUENTE / TAMAÑO / ESTILOS ===
function applyToolFontName(font) { 
    if (typeof window.ensureGoogleFontLoaded === 'function') {
        window.ensureGoogleFontLoaded(font);
    }
    if (spreadsheetEngine) spreadsheetEngine.applyAttrToSelection('font', font); 
    blurActiveControl();
}
function applyToolFontSize(size) { 
    if (spreadsheetEngine) spreadsheetEngine.applyAttrToSelection('size', size); 
    blurActiveControl();
}
function toggleToolBold() { 
    if (spreadsheetEngine) spreadsheetEngine.toggleSelectionAttr('bold'); 
    blurActiveControl();
}
function toggleToolItalic() { 
    if (spreadsheetEngine) spreadsheetEngine.toggleSelectionAttr('italic'); 
    blurActiveControl();
}
function toggleToolUnderline() { 
    if (spreadsheetEngine) spreadsheetEngine.toggleSelectionAttr('underline'); 
    blurActiveControl();
}

// === FORMATOS NUMÉRICOS, FECHAS Y COLUMNAS ===
function toggleFormatDropdown(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('format-dropdown-menu');
    if (!menu) return;

    const isHidden = menu.classList.contains('hidden');
    if (isHidden) {
        // Cerrar otros menús primero
        closeExportMenu();
        if (typeof closeBorderPickerPopover === 'function') closeBorderPickerPopover();
        if (typeof closeColorPickerPopover === 'function') closeColorPickerPopover();

        const btn = document.getElementById('btn-format-dropdown');
        if (btn) {
            const rect = btn.getBoundingClientRect();
            menu.style.top = `${rect.bottom + 6}px`;
            menu.style.left = `${rect.left}px`;
        }

        menu.classList.remove('hidden');
        requestAnimationFrame(() => {
            menu.classList.remove('opacity-0', 'scale-95');
            menu.classList.add('opacity-100', 'scale-100');
        });
    } else {
        closeFormatDropdown();
    }
}

function closeFormatDropdown() {
    const menu = document.getElementById('format-dropdown-menu');
    if (!menu || menu.classList.contains('hidden')) return;
    menu.classList.add('opacity-0', 'scale-95');
    menu.classList.remove('opacity-100', 'scale-100');
    setTimeout(() => {
        menu.classList.add('hidden');
    }, 200);
}

function applyToolFormatDirect(fmt) {
    if (!spreadsheetEngine) return;
    const eng = spreadsheetEngine;
    const isFullCol = (eng.selectStartRow === 0 && eng.selectEndRow === eng.options.rowCount - 1);
    
    if (isFullCol) {
        const c1 = Math.min(eng.selectStartCol, eng.selectEndCol);
        const c2 = Math.max(eng.selectStartCol, eng.selectEndCol);
        for (let c = c1; c <= c2; c++) {
            eng.applyColFormat(c, { fmt: fmt === 'general' ? null : fmt, fmtDecimals: 2, fmtNegatives: 'minus' });
        }
    } else {
        eng.applyAttrToSelection('fmt', fmt === 'general' ? null : fmt);
    }

    // Actualizar etiqueta del botón de formato
    const lbl = document.getElementById('current-format-label');
    if (lbl) {
        const labels = {
            general: '123',
            number: ',00',
            usd: '$ USD',
            percent: '%',
            date_dmy: 'Fecha',
            date_long: 'Fecha L',
            time_24h: 'Hora',
            nit: 'NIT'
        };
        lbl.textContent = labels[fmt] || '123';
    }

    blurActiveControl();
    markUnsavedChanges();
}

function applyToolFormat(fmt) { 
    if (!spreadsheetEngine) return;
    const eng = spreadsheetEngine;
    const isFullCol = (eng.selectStartRow === 0 && eng.selectEndRow === eng.options.rowCount - 1);
    const sheet = eng.sheets[eng.activeSheetIndex];
    const current = (sheet.data && sheet.data[`${eng.activeRow}_${eng.activeCol}`]) || {};
    const newFmt = current.fmt === fmt ? null : fmt;

    if (isFullCol) {
        const c1 = Math.min(eng.selectStartCol, eng.selectEndCol);
        const c2 = Math.max(eng.selectStartCol, eng.selectEndCol);
        for (let c = c1; c <= c2; c++) {
            eng.applyColFormat(c, { fmt: newFmt, fmtDecimals: 2, fmtNegatives: 'minus' });
        }
    } else {
        eng.applyAttrToSelection('fmt', newFmt); 
    }
    blurActiveControl();
    markUnsavedChanges();
}

function adjustDecimals(delta) {
    if (!spreadsheetEngine) return;
    const eng = spreadsheetEngine;
    const sheet = eng.sheets[eng.activeSheetIndex];
    const r1 = Math.min(eng.selectStartRow, eng.selectEndRow);
    const r2 = Math.max(eng.selectStartRow, eng.selectEndRow);
    const c1 = Math.min(eng.selectStartCol, eng.selectEndCol);
    const c2 = Math.max(eng.selectStartCol, eng.selectEndCol);
    const isFullCol = (r1 === 0 && r2 === eng.options.rowCount - 1);

    eng.pushHistory();
    for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
            const key = `${r}_${c}`;
            sheet.data[key] = sheet.data[key] || {};
            const cell = sheet.data[key];
            if (!cell.fmt) cell.fmt = 'number';
            const curDec = cell.fmtDecimals !== undefined ? cell.fmtDecimals : 2;
            cell.fmtDecimals = Math.max(0, Math.min(8, curDec + delta));
        }
    }

    if (isFullCol) {
        sheet.colFormats = sheet.colFormats || {};
        for (let c = c1; c <= c2; c++) {
            sheet.colFormats[c] = sheet.colFormats[c] || {};
            if (!sheet.colFormats[c].fmt) sheet.colFormats[c].fmt = 'number';
            const curDec = sheet.colFormats[c].fmtDecimals !== undefined ? sheet.colFormats[c].fmtDecimals : 2;
            sheet.colFormats[c].fmtDecimals = Math.max(0, Math.min(8, curDec + delta));
        }
    }

    eng.render();
    if (typeof eng.options.onChange === 'function') eng.options.onChange();
    markUnsavedChanges();
}

// === ALINEACIÓN (HORIZONTAL & VERTICAL) ===
function applyToolAlign(align) { 
    if (spreadsheetEngine) spreadsheetEngine.applyAttrToSelection('align', align); 
    blurActiveControl();
}

function applyToolVAlign(valign) {
    if (spreadsheetEngine) spreadsheetEngine.applyAttrToSelection('valign', valign);
    blurActiveControl();
}

// =========================================================================
// === CONTROLADOR DE TABLAS INTELIGENTES (EXCEL TABLES / LISTOBJECTS) ===
// =========================================================================

let currentActiveTable = null;
let currentFilterTableId = null;
let currentFilterColIdx = null;
let currentTotalTableId = null;
let currentTotalColIdx = null;
let tableFilterUniqueValues = [];
let pendingTableStyle = 'amber';

// --- Galería y Popover de Estilos de Tabla ---
function toggleTableStylePopover(event) {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    const popover = document.getElementById('table-style-picker-popover');
    const triggerBtn = document.getElementById('btn-tool-table') || (event ? event.currentTarget : null);
    if (!popover || !triggerBtn) return;

    if (!popover.classList.contains('hidden')) {
        closeTableStylePopover();
        return;
    }

    closeFormatDropdown();
    closeBorderPicker();
    closeColorPickers();
    closeExportMenu();
    if (typeof closePageConfigPopover === 'function') closePageConfigPopover();

    positionPopoverBelow(popover, triggerBtn, 'left');

    popover.classList.remove('hidden');
    requestAnimationFrame(() => {
        popover.classList.remove('opacity-0', 'scale-95');
        popover.classList.add('opacity-100', 'scale-100');
    });
}

function closeTableStylePopover() {
    const popover = document.getElementById('table-style-picker-popover');
    if (!popover || popover.classList.contains('hidden')) return;
    popover.classList.remove('opacity-100', 'scale-100');
    popover.classList.add('opacity-0', 'scale-95');
    setTimeout(() => { popover.classList.add('hidden'); }, 150);
}

function applyTableStyleOrPrompt(styleId) {
    if (!spreadsheetEngine) return;
    if (currentActiveTable) {
        spreadsheetEngine.updateTableConfig(currentActiveTable.id, { style: styleId });
    } else {
        openCreateTableModal(styleId);
    }
}

// --- Modal de Creación de Tabla ---
function openCreateTableModal(defaultStyle = 'amber') {
    if (!spreadsheetEngine) return;
    pendingTableStyle = defaultStyle;
    const modal = document.getElementById('modal-create-table');
    if (!modal) return;

    const r1 = Math.min(spreadsheetEngine.selectStartRow, spreadsheetEngine.selectEndRow);
    const r2 = Math.max(spreadsheetEngine.selectStartRow, spreadsheetEngine.selectEndRow);
    const c1 = Math.min(spreadsheetEngine.selectStartCol, spreadsheetEngine.selectEndCol);
    const c2 = Math.max(spreadsheetEngine.selectStartCol, spreadsheetEngine.selectEndCol);

    let rangeStr = '';
    if (r1 === r2 && c1 === c2) {
        const exp = spreadsheetEngine.detectDataRegion(r1, c1);
        rangeStr = `$${spreadsheetEngine.getColName(exp.c1)}$${exp.r1 + 1}:$${spreadsheetEngine.getColName(exp.c2)}$${exp.r2 + 1}`;
    } else {
        rangeStr = `$${spreadsheetEngine.getColName(c1)}$${r1 + 1}:$${spreadsheetEngine.getColName(c2)}$${r2 + 1}`;
    }

    const rangeInput = document.getElementById('create-tbl-range');
    if (rangeInput) rangeInput.value = rangeStr;

    const sheet = spreadsheetEngine.sheets[spreadsheetEngine.activeSheetIndex];
    const tableCount = (sheet && sheet.tables ? sheet.tables.length : 0) + 1;
    const nameInput = document.getElementById('create-tbl-name');
    if (nameInput) nameInput.value = `Tabla${tableCount}`;

    const headersChk = document.getElementById('create-tbl-headers');
    if (headersChk) headersChk.checked = true;

    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modal.classList.add('open');
    });
}

function closeCreateTableModal() {
    const modal = document.getElementById('modal-create-table');
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.remove('open');
    modal.classList.add('closing');
    setTimeout(() => {
        modal.classList.remove('closing');
        modal.classList.add('hidden');
    }, 200);
}

function confirmCreateTable() {
    if (!spreadsheetEngine) return;
    const rangeInput = document.getElementById('create-tbl-range');
    const nameInput = document.getElementById('create-tbl-name');
    const headersChk = document.getElementById('create-tbl-headers');

    const rangeText = (rangeInput ? rangeInput.value : '').replace(/\$/g, '').trim();
    let r1 = spreadsheetEngine.selectStartRow, r2 = spreadsheetEngine.selectEndRow;
    let c1 = spreadsheetEngine.selectStartCol, c2 = spreadsheetEngine.selectEndCol;

    if (rangeText.includes(':')) {
        const parts = rangeText.split(':');
        const p1 = spreadsheetEngine.parseCellRef(parts[0]);
        const p2 = spreadsheetEngine.parseCellRef(parts[1]);
        if (p1 && p2) {
            r1 = p1.row; c1 = p1.col;
            r2 = p2.row; c2 = p2.col;
        }
    }

    const tableName = (nameInput ? nameInput.value.trim() : '') || 'Tabla1';
    const hasHeaders = headersChk ? headersChk.checked : true;

    spreadsheetEngine.createTable({ r1, c1, r2, c2 }, {
        name: tableName,
        style: pendingTableStyle || 'amber',
        hasHeaderRow: hasHeaders,
        hasBandedRows: true
    });

    closeCreateTableModal();
    markUnsavedChanges();
}

// --- Barra Contextual de Diseño de Tabla ---
function updateActiveTableName(newName) {
    if (!spreadsheetEngine || !currentActiveTable) return;
    spreadsheetEngine.updateTableConfig(currentActiveTable.id, { name: newName.trim() || 'Tabla' });
    markUnsavedChanges();
}

function toggleActiveTableOption(key, val) {
    if (!spreadsheetEngine || !currentActiveTable) return;
    if (key === 'hasTotalRow') {
        spreadsheetEngine.toggleTableTotalRow(currentActiveTable.id);
    } else {
        spreadsheetEngine.updateTableConfig(currentActiveTable.id, { [key]: val });
    }
    markUnsavedChanges();
}

function convertActiveTableToRange() {
    if (!spreadsheetEngine || !currentActiveTable) return;
    spreadsheetEngine.convertTableToRange(currentActiveTable.id);
    markUnsavedChanges();
}

function deleteActiveTablePrompt() {
    if (!spreadsheetEngine || !currentActiveTable) return;
    spreadsheetEngine.deleteTable(currentActiveTable.id, false);
    markUnsavedChanges();
}

// --- Popover de Filtro y Ordenación de Columna ---
window.openTableFilterPopover = function(tableId, colIdx, event) {
    if (event) event.stopPropagation();
    if (!spreadsheetEngine) return;

    currentFilterTableId = tableId;
    currentFilterColIdx = colIdx;

    const popover = document.getElementById('popover-table-filter');
    if (!popover) return;

    if (popover.parentElement !== document.body) {
        document.body.appendChild(popover);
    }

    const triggerBtn = event.currentTarget || event.target;
    positionPopoverBelow(popover, triggerBtn, 'left');

    tableFilterUniqueValues = spreadsheetEngine.getTableColumnUniqueValues(tableId, colIdx);
    const tbl = spreadsheetEngine.getTableById(tableId);
    const activeFilters = (tbl && tbl.filterStates && tbl.filterStates[colIdx]) ? tbl.filterStates[colIdx] : null;

    renderTableFilterValuesList(activeFilters);

    const searchInput = document.getElementById('tbl-filter-search');
    if (searchInput) searchInput.value = '';

    const selectAllChk = document.getElementById('tbl-filter-select-all');
    if (selectAllChk) selectAllChk.checked = !activeFilters || activeFilters.length === tableFilterUniqueValues.length;

    popover.classList.remove('hidden');
    requestAnimationFrame(() => {
        popover.classList.remove('opacity-0', 'scale-95');
        popover.classList.add('opacity-100', 'scale-100');
    });
};

function closeTableFilterPopover() {
    const popover = document.getElementById('popover-table-filter');
    if (!popover || popover.classList.contains('hidden')) return;
    popover.classList.remove('opacity-100', 'scale-100');
    popover.classList.add('opacity-0', 'scale-95');
    setTimeout(() => { popover.classList.add('hidden'); }, 150);
}

function renderTableFilterValuesList(activeFilters, searchTerm = '') {
    const listContainer = document.getElementById('tbl-filter-values-list');
    if (!listContainer) return;

    const filterTerm = searchTerm.toLowerCase().trim();
    const filteredItems = tableFilterUniqueValues.filter(item => !filterTerm || item.value.toLowerCase().includes(filterTerm));

    listContainer.innerHTML = filteredItems.map((item, idx) => {
        const isChecked = !activeFilters || activeFilters.includes(item.value);
        const safeVal = escapeHtmlCalc(item.value);
        return `
            <label class="flex items-center justify-between px-1.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer text-xs transition-colors">
                <div class="flex items-center gap-2 min-w-0">
                    <input type="checkbox" class="tbl-filter-val-chk w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer" data-val="${safeVal}" ${isChecked ? 'checked' : ''}>
                    <span class="truncate text-slate-700 dark:text-slate-200">${safeVal}</span>
                </div>
                <span class="text-[10px] tabular-nums font-medium text-slate-400">(${item.count})</span>
            </label>
        `;
    }).join('');
}

function filterPopoverValuesSearch(val) {
    const tbl = spreadsheetEngine ? spreadsheetEngine.getTableById(currentFilterTableId) : null;
    const activeFilters = (tbl && tbl.filterStates && tbl.filterStates[currentFilterColIdx]) ? tbl.filterStates[currentFilterColIdx] : null;
    renderTableFilterValuesList(activeFilters, val);
}

function toggleTableFilterSelectAll(checked) {
    const checkboxes = document.querySelectorAll('.tbl-filter-val-chk');
    checkboxes.forEach(chk => { chk.checked = checked; });
}

function applyTableSortFromPopover(direction) {
    if (!spreadsheetEngine || !currentFilterTableId || currentFilterColIdx === null) return;
    spreadsheetEngine.sortTableByColumn(currentFilterTableId, currentFilterColIdx, direction);
    closeTableFilterPopover();
    markUnsavedChanges();
}

function applyTableFilterFromPopover() {
    if (!spreadsheetEngine || !currentFilterTableId || currentFilterColIdx === null) return;
    const checkboxes = document.querySelectorAll('.tbl-filter-val-chk');
    const selectedValues = [];
    checkboxes.forEach(chk => {
        if (chk.checked) selectedValues.push(chk.getAttribute('data-val'));
    });
    spreadsheetEngine.filterTableByValues(currentFilterTableId, currentFilterColIdx, selectedValues);
    closeTableFilterPopover();
    markUnsavedChanges();
}

function clearTableFilterFromPopover() {
    if (!spreadsheetEngine || !currentFilterTableId || currentFilterColIdx === null) return;
    const tbl = spreadsheetEngine.getTableById(currentFilterTableId);
    if (tbl && tbl.filterStates) delete tbl.filterStates[currentFilterColIdx];
    const sheet = spreadsheetEngine.sheets[spreadsheetEngine.activeSheetIndex];
    sheet.hiddenRows = {};
    spreadsheetEngine.render();
    closeTableFilterPopover();
    markUnsavedChanges();
}

// --- Popover de Fila de Totales ---
window.openTableTotalPopover = function(tableId, colIdx, event) {
    if (event) event.stopPropagation();
    if (!spreadsheetEngine) return;

    currentTotalTableId = tableId;
    currentTotalColIdx = colIdx;

    const popover = document.getElementById('popover-table-total');
    if (!popover) return;

    if (popover.parentElement !== document.body) {
        document.body.appendChild(popover);
    }

    const triggerBtn = event.currentTarget || event.target;
    positionPopoverBelow(popover, triggerBtn, 'left');

    popover.classList.remove('hidden');
    requestAnimationFrame(() => {
        popover.classList.remove('opacity-0', 'scale-95');
        popover.classList.add('opacity-100', 'scale-100');
    });
};

function closeTableTotalPopover() {
    const popover = document.getElementById('popover-table-total');
    if (!popover || popover.classList.contains('hidden')) return;
    popover.classList.remove('opacity-100', 'scale-100');
    popover.classList.add('opacity-0', 'scale-95');
    setTimeout(() => { popover.classList.add('hidden'); }, 150);
}

function applyTableTotalFuncFromPopover(funcName) {
    if (!spreadsheetEngine || !currentTotalTableId || currentTotalColIdx === null) return;
    spreadsheetEngine.setTableTotalFunction(currentTotalTableId, currentTotalColIdx, funcName);
    closeTableTotalPopover();
    markUnsavedChanges();
}

// === PALETA DE COLORES PRESETS EDUCONTA ===
const EDUCONTA_COLOR_PRESETS = [
    // Neutros
    '#000000', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#ffffff',
    // Ámbar (Documentos EduConta)
    '#78350f', '#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fde68a', '#fef3c7',
    // Esmeralda (Activos / Positivos)
    '#064e3b', '#065f46', '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#d1fae5',
    // Celeste (Proyectos / Bancos)
    '#082f49', '#075985', '#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#e0f2fe',
    // Índigo (Catálogos / Cuentas)
    '#1e1b4b', '#312e81', '#3730a3', '#4338ca', '#4f46e5', '#6366f1', '#818cf8', '#e0e7ff',
    // Rojo / Rosa (Pasivos / Gastos)
    '#450a0a', '#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fee2e2',
    // Violeta / Púrpura (Patrimonio)
    '#3b0764', '#581c87', '#6b21a8', '#7e22ce', '#9333ea', '#a855f7', '#c084fc', '#f3e8ff',
    // Turquesa / Teal (Caja Chica)
    '#042f2e', '#115e59', '#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#ccfbf1'
];

let activeColorPickerType = null; // 'text' | 'bg'

function initColorPresetsGrid() {
    const grid = document.getElementById('color-presets-grid');
    if (!grid) return;
    grid.innerHTML = EDUCONTA_COLOR_PRESETS.map(hex => `
        <button type="button" onclick="applyPaletteColor('${hex}')" class="w-6 h-6 rounded-lg border border-slate-300/70 dark:border-slate-700 hover:scale-110 hover:shadow-md transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm" style="background-color: ${hex};" title="${hex}">
        </button>
    `).join('');
}

function toggleColorPickerPopover(type, event) {
    if (event) event.stopPropagation();
    const popover = document.getElementById('popover-color-picker');
    if (!popover) return;

    if (popover.parentElement !== document.body) {
        document.body.appendChild(popover);
    }

    if (!popover.classList.contains('hidden') && activeColorPickerType === type) {
        closeColorPickers();
        return;
    }

    closeBorderPicker();
    activeColorPickerType = type;

    const titleEl = document.getElementById('color-picker-title');
    if (titleEl) titleEl.textContent = type === 'text' ? 'Color de Texto' : 'Color de Relleno';

    initColorPresetsGrid();
    switchToPresetsColorView();

    const triggerBtn = document.getElementById(type === 'text' ? 'btn-tool-text-color' : 'btn-tool-bg-color');
    positionPopoverBelow(popover, triggerBtn, 'left');

    popover.classList.remove('hidden');
    requestAnimationFrame(() => {
        popover.classList.remove('opacity-0', 'scale-95');
        popover.classList.add('opacity-100', 'scale-100');
    });
}

function positionPopoverBelow(popover, triggerEl, preferredAlign = 'left') {
    if (!popover || !triggerEl) return;
    if (popover.parentElement !== document.body) {
        document.body.appendChild(popover);
    }
    const rect = triggerEl.getBoundingClientRect();
    const popoverWidth = popover.offsetWidth || 280;
    const top = rect.bottom + 6;
    let left;

    if (preferredAlign === 'center') {
        left = rect.left + (rect.width / 2) - (popoverWidth / 2);
    } else if (preferredAlign === 'right') {
        left = rect.right - popoverWidth;
    } else {
        left = rect.left;
    }

    const maxLeft = window.innerWidth - popoverWidth - 12;
    left = Math.max(12, Math.min(left, maxLeft));

    popover.style.position = 'fixed';
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.style.zIndex = '999999';
}

function closeColorPickers() {
    const popover = document.getElementById('popover-color-picker');
    if (!popover || popover.classList.contains('hidden')) return;

    popover.classList.remove('opacity-100', 'scale-100');
    popover.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        popover.classList.add('hidden');
        activeColorPickerType = null;
    }, 150);
}

function applyPaletteColor(color) {
    if (!spreadsheetEngine || !activeColorPickerType) return;
    if (activeColorPickerType === 'text') {
        spreadsheetEngine.applyAttrToSelection('color', color);
        const ind = document.getElementById('indicator-text-color');
        if (ind) ind.style.backgroundColor = color || '#475569';
    } else {
        spreadsheetEngine.applyAttrToSelection('bgcolor', color);
        const ind = document.getElementById('indicator-bg-color');
        if (ind) ind.style.backgroundColor = color || '#f59e0b';
    }
    closeColorPickers();
    blurActiveControl();
}

// === HERRAMIENTA CUENTAGOTAS (EYEDROPPER API) ===
async function pickColorWithEyedropper() {
    if (!('EyeDropper' in window)) {
        if (typeof window.showAlert === 'function') {
            window.showAlert('Cuentagotas no disponible', 'Tu navegador actual no soporta la herramienta nativa de Cuentagotas (EyeDropper API). Puedes seleccionar el color usando la paleta 2D o ingresando el código HEX.');
        } else {
            alert('Tu navegador no soporta la herramienta Cuentagotas nativa.');
        }
        return;
    }

    try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
            const hex = result.sRGBHex.toUpperCase();
            currentCustomHsv = hexToHsv(hex);
            
            // Pasar a vista personalizada conservando el color muestreado (sin resetear con la celda)
            switchToCustomColorView(false);
            updateCustomColorUI();

            // Aplicar automáticamente a la selección de celdas
            if (spreadsheetEngine && activeColorPickerType) {
                if (activeColorPickerType === 'text') {
                    spreadsheetEngine.applyAttrToSelection('color', hex);
                    const ind = document.getElementById('indicator-text-color');
                    if (ind) ind.style.backgroundColor = hex;
                } else {
                    spreadsheetEngine.applyAttrToSelection('bgcolor', hex);
                    const ind = document.getElementById('indicator-bg-color');
                    if (ind) ind.style.backgroundColor = hex;
                }
                markUnsavedChanges();
            }
        }
    } catch (err) {
        // Cancelado por el usuario con Escape o clic fuera
        console.log('Cuentagotas cancelado o no completado:', err);
    }
}

// === ESTADO Y FUNCIONES DEL SELECTOR MANUAL GLASSMORPHIC 2D ===
let currentCustomHsv = { h: 38, s: 0.93, v: 0.96 }; // #F59E0B por defecto
let isDraggingSatVal = false;
let isDraggingHue = false;

function hsvToRgb(h, s, v) {
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h / 60) % 6;
    const f = (h / 60) - Math.floor(h / 60);
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = Math.max(0, Math.min(255, x)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
}

function hexToHsv(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return { h: 38, s: 0.93, v: 0.96 };
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0;
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.max(0, Math.min(1, s)), v: Math.max(0, Math.min(1, v)) };
}

function switchToCustomColorView(resetFromCell = true) {
    const presetsView = document.getElementById('color-picker-presets-view');
    const customView = document.getElementById('color-picker-custom-view');
    const track = document.getElementById('color-picker-slider-track');
    if (!presetsView || !customView) return;

    if (resetFromCell && spreadsheetEngine) {
        const sheet = spreadsheetEngine.sheets[spreadsheetEngine.activeSheetIndex];
        const cell = (sheet.data && sheet.data[`${spreadsheetEngine.activeRow}_${spreadsheetEngine.activeCol}`]) || {};
        const currentColor = activeColorPickerType === 'text' ? (cell.color || '#475569') : (cell.bgcolor || '#F59E0B');
        if (/^#[0-9A-F]{3,6}$/i.test(currentColor)) {
            currentCustomHsv = hexToHsv(currentColor);
        }
    }

    initCustomColorPickerEvents();
    updateCustomColorUI();

    // Animación de desplazamiento y cambio de flujo natural
    presetsView.style.position = 'absolute';
    presetsView.style.top = '0';
    presetsView.style.left = '0';
    presetsView.style.transform = 'translateX(-100%)';
    presetsView.style.opacity = '0';
    presetsView.style.pointerEvents = 'none';

    customView.style.position = 'relative';
    customView.style.top = 'auto';
    customView.style.left = 'auto';
    customView.style.transform = 'translateX(0%)';
    customView.style.opacity = '1';
    customView.style.pointerEvents = 'auto';

    if (track) track.style.height = '';
}

function switchToPresetsColorView() {
    const presetsView = document.getElementById('color-picker-presets-view');
    const customView = document.getElementById('color-picker-custom-view');
    const track = document.getElementById('color-picker-slider-track');
    if (!presetsView || !customView) return;

    // Animación de desplazamiento y cambio de flujo natural
    customView.style.position = 'absolute';
    customView.style.top = '0';
    customView.style.left = '0';
    customView.style.transform = 'translateX(100%)';
    customView.style.opacity = '0';
    customView.style.pointerEvents = 'none';

    presetsView.style.position = 'relative';
    presetsView.style.top = 'auto';
    presetsView.style.left = 'auto';
    presetsView.style.transform = 'translateX(0%)';
    presetsView.style.opacity = '1';
    presetsView.style.pointerEvents = 'auto';

    if (track) track.style.height = '';
}

function updateCustomColorUI() {
    const rgb = hsvToRgb(currentCustomHsv.h, currentCustomHsv.s, currentCustomHsv.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    const satValBox = document.getElementById('custom-color-satval-box');
    const satValCursor = document.getElementById('custom-color-satval-cursor');
    const hueCursor = document.getElementById('custom-color-hue-cursor');
    const previewSwatch = document.getElementById('custom-color-preview-swatch');
    const hexInput = document.getElementById('custom-color-hex-input');
    const rInput = document.getElementById('custom-color-r-input');
    const gInput = document.getElementById('custom-color-g-input');
    const bInput = document.getElementById('custom-color-b-input');

    if (satValBox) satValBox.style.backgroundColor = `hsl(${currentCustomHsv.h}, 100%, 50%)`;
    if (satValCursor) {
        satValCursor.style.left = `${currentCustomHsv.s * 100}%`;
        satValCursor.style.top = `${(1 - currentCustomHsv.v) * 100}%`;
    }
    if (hueCursor) {
        hueCursor.style.left = `${(currentCustomHsv.h / 360) * 100}%`;
    }
    if (previewSwatch) previewSwatch.style.backgroundColor = hex;
    if (hexInput && document.activeElement !== hexInput) hexInput.value = hex;
    if (rInput && document.activeElement !== rInput) rInput.value = rgb.r;
    if (gInput && document.activeElement !== gInput) gInput.value = rgb.g;
    if (bInput && document.activeElement !== bInput) bInput.value = rgb.b;
}

let customColorEventsInitialized = false;

function initCustomColorPickerEvents() {
    if (customColorEventsInitialized) return;
    customColorEventsInitialized = true;

    const satValBox = document.getElementById('custom-color-satval-box');
    const hueBar = document.getElementById('custom-color-hue-bar');

    const handleSatValMove = (e) => {
        if (!isDraggingSatVal || !satValBox) return;
        const rect = satValBox.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
        currentCustomHsv.s = x / rect.width;
        currentCustomHsv.v = 1 - (y / rect.height);
        updateCustomColorUI();
    };

    const handleHueMove = (e) => {
        if (!isDraggingHue || !hueBar) return;
        const rect = hueBar.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        currentCustomHsv.h = (x / rect.width) * 360;
        updateCustomColorUI();
    };

    if (satValBox) {
        satValBox.addEventListener('mousedown', (e) => {
            isDraggingSatVal = true;
            handleSatValMove(e);
        });
        satValBox.addEventListener('touchstart', (e) => {
            isDraggingSatVal = true;
            handleSatValMove(e);
        }, { passive: true });
    }

    if (hueBar) {
        hueBar.addEventListener('mousedown', (e) => {
            isDraggingHue = true;
            handleHueMove(e);
        });
        hueBar.addEventListener('touchstart', (e) => {
            isDraggingHue = true;
            handleHueMove(e);
        }, { passive: true });
    }

    document.addEventListener('mousemove', (e) => {
        if (isDraggingSatVal) handleSatValMove(e);
        if (isDraggingHue) handleHueMove(e);
    });

    document.addEventListener('touchmove', (e) => {
        if (isDraggingSatVal) handleSatValMove(e);
        if (isDraggingHue) handleHueMove(e);
    }, { passive: true });

    document.addEventListener('mouseup', () => {
        isDraggingSatVal = false;
        isDraggingHue = false;
    });

    document.addEventListener('touchend', () => {
        isDraggingSatVal = false;
        isDraggingHue = false;
    });
}

function onHexInputChange(val) {
    let clean = val.trim();
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (/^#[0-9A-F]{6}$/i.test(clean) || /^#[0-9A-F]{3}$/i.test(clean)) {
        currentCustomHsv = hexToHsv(clean);
        updateCustomColorUI();
    }
}

function onRgbInputChange() {
    const rInput = document.getElementById('custom-color-r-input');
    const gInput = document.getElementById('custom-color-g-input');
    const bInput = document.getElementById('custom-color-b-input');
    const r = parseInt(rInput ? rInput.value : 0, 10) || 0;
    const g = parseInt(gInput ? gInput.value : 0, 10) || 0;
    const b = parseInt(bInput ? bInput.value : 0, 10) || 0;
    const hex = rgbToHex(r, g, b);
    currentCustomHsv = hexToHsv(hex);
    updateCustomColorUI();
}

function applyCustomInteractiveColor() {
    const rgb = hsvToRgb(currentCustomHsv.h, currentCustomHsv.s, currentCustomHsv.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    applyPaletteColor(hex);
    switchToPresetsColorView();
}

// === DESPLEGABLE DE BORDES GLASSMORPHIC ===
function toggleBorderPickerPopover(event) {
    if (event) event.stopPropagation();
    const popover = document.getElementById('popover-border-picker');
    if (!popover) return;

    if (popover.parentElement !== document.body) {
        document.body.appendChild(popover);
    }

    if (!popover.classList.contains('hidden')) {
        closeBorderPicker();
        return;
    }

    closeColorPickers();

    const triggerBtn = document.getElementById('btn-tool-borders');
    positionPopoverBelow(popover, triggerBtn, 'left');

    popover.classList.remove('hidden');
    requestAnimationFrame(() => {
        popover.classList.remove('opacity-0', 'scale-95');
        popover.classList.add('opacity-100', 'scale-100');
    });
}

function closeBorderPicker() {
    const popover = document.getElementById('popover-border-picker');
    if (!popover || popover.classList.contains('hidden')) return;

    popover.classList.remove('opacity-100', 'scale-100');
    popover.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        popover.classList.add('hidden');
    }, 150);
}

let currentSelectedBorderColor = '#64748b';
let currentSelectedBorderStyle = 'thin';

function setBorderColor(color) {
    currentSelectedBorderColor = color;
    const badge = document.getElementById('border-active-color-badge');
    if (badge) badge.style.backgroundColor = color;
}

function setBorderStyle(style) {
    currentSelectedBorderStyle = style;
    document.querySelectorAll('.border-style-btn').forEach(btn => {
        if (btn.getAttribute('data-style') === style) {
            btn.className = 'border-style-btn active px-2 py-1 rounded-lg border border-amber-500 bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center justify-center gap-1';
        } else {
            btn.className = 'border-style-btn px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-400 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center gap-1';
        }
    });
}

function selectBorderOption(type) {
    if (spreadsheetEngine) {
        spreadsheetEngine.applyBorderToSelection(type, currentSelectedBorderStyle, currentSelectedBorderColor);
    }
    closeBorderPicker();
    blurActiveControl();
    markUnsavedChanges();
}

// === HERRAMIENTAS DE CELDA ===
function toggleToolMerge() {
    if (spreadsheetEngine) {
        const r1 = Math.min(spreadsheetEngine.selectStartRow, spreadsheetEngine.selectEndRow);
        const r2 = Math.max(spreadsheetEngine.selectStartRow, spreadsheetEngine.selectEndRow);
        const c1 = Math.min(spreadsheetEngine.selectStartCol, spreadsheetEngine.selectEndCol);
        const c2 = Math.max(spreadsheetEngine.selectStartCol, spreadsheetEngine.selectEndCol);
        const sheet = spreadsheetEngine.sheets[spreadsheetEngine.activeSheetIndex];
        const root = (sheet.data && sheet.data[`${r1}_${c1}`]) || {};
        
        if (!root.merge && r1 === r2 && c1 === c2) {
            alert('Selecciona un rango de 2 o más celdas arrastrando el ratón para combinarlas.');
            return;
        }
        spreadsheetEngine.toggleMergeSelection();
    }
    blurActiveControl();
}
function toggleToolTextwrap() { 
    if (spreadsheetEngine) spreadsheetEngine.toggleSelectionAttr('wrap'); 
    blurActiveControl();
}
function toggleToolAutofilter() {
    if (!spreadsheetEngine) return;
    const col = spreadsheetEngine.activeCol;
    const colName = spreadsheetEngine.getColName(col);
    const choice = confirm(`¿Deseas ordenar las filas por la Columna ${colName} de forma Ascendente (A-Z / 1-9)?\n\nPresiona Aceptar para A-Z\nPresiona Cancelar para Z-A`);
    spreadsheetEngine.sortColumn(col, choice ? 'asc' : 'desc');
    blurActiveControl();
}

// === FILAS / COLUMNAS ===
function toolInsertRow() { spreadsheetEngine && spreadsheetEngine.insertRowAt(spreadsheetEngine.activeRow); }
function toolInsertCol() { spreadsheetEngine && spreadsheetEngine.insertColAt(spreadsheetEngine.activeCol); }
function toolDeleteRow() { spreadsheetEngine && spreadsheetEngine.deleteRowAt(spreadsheetEngine.activeRow); }
function toolDeleteCol() { spreadsheetEngine && spreadsheetEngine.deleteColAt(spreadsheetEngine.activeCol); }

// =========================================================================
// === MOTOR DE IMPRESIÓN PROFESIONAL DE HOJAS DE CÁLCULO (PRINT & PDF) ===
// =========================================================================

let printPreviewZoom = 0.9;

const printConfigState = {
    range: 'active_sheet', // 'active_sheet' | 'selection' | 'all_sheets'
    size: 'letter',        // 'letter' | 'a4' | 'legal'
    orientation: 'portrait', // 'portrait' | 'landscape'
    scale: 'fit_width',    // 'fit_width' | 'fit_page' | '100'
    gridlines: true,
    headers: false,
    title: true,
    signatures: false
};

function setPrintPreviewZoom(action) {
    if (action === 'fit') {
        printPreviewZoom = 0.85;
    } else if (action === 'reset') {
        printPreviewZoom = 1.0;
    } else if (typeof action === 'number') {
        printPreviewZoom = Math.max(0.4, Math.min(1.6, Number((printPreviewZoom + action).toFixed(2))));
    }
    
    paperTransformApply();
    const label = document.getElementById('print-zoom-level-label');
    if (label) {
        label.textContent = `${Math.round(printPreviewZoom * 100)}%`;
    }
}

function setPrintRange(val) {
    printConfigState.range = val;
    syncPrintButtonsUI();
    updatePrintPreview();
}

function setPrintSize(val) {
    printConfigState.size = val;
    syncPrintButtonsUI();
    updatePrintPreview();
}

function setPrintOrientation(val) {
    printConfigState.orientation = val;
    syncPrintButtonsUI();
    updatePrintPreview();
}

function setPrintScale(val) {
    printConfigState.scale = val;
    syncPrintButtonsUI();
    updatePrintPreview();
}

function togglePrintOption(key) {
    if (printConfigState[key] !== undefined) {
        printConfigState[key] = !printConfigState[key];
    }
    syncPrintButtonsUI();
    updatePrintPreview();
}

function syncPrintButtonsUI() {
    // 1. Rango
    ['active_sheet', 'selection', 'all_sheets'].forEach(k => {
        const btn = document.getElementById(`btn-print-range-${k}`);
        if (btn) {
            if (printConfigState.range === k) {
                btn.className = 'py-2 px-2.5 rounded-xl bg-amber-500 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-between cursor-pointer';
                const checkIcon = btn.querySelector('.fa-check');
                if (!checkIcon) {
                    btn.insertAdjacentHTML('beforeend', '<i class="fas fa-check text-[11px]"></i>');
                }
            } else {
                btn.className = 'py-2 px-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200/80 dark:border-slate-700/80 transition-all flex items-center justify-between cursor-pointer';
                const checkIcon = btn.querySelector('.fa-check');
                if (checkIcon) checkIcon.remove();
            }
        }
    });

    // 2. Tamaño
    ['letter', 'a4', 'legal'].forEach(k => {
        const btn = document.getElementById(`btn-print-size-${k}`);
        if (btn) {
            if (printConfigState.size === k) {
                btn.className = 'py-1.5 px-2 rounded-xl bg-amber-500 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1 cursor-pointer';
            } else {
                btn.className = 'py-1.5 px-2 rounded-xl bg-white/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200/80 dark:border-slate-700/80 transition-all flex items-center justify-center gap-1 cursor-pointer';
            }
        }
    });

    // 3. Orientación
    ['portrait', 'landscape'].forEach(k => {
        const btn = document.getElementById(`btn-print-orient-${k}`);
        if (btn) {
            if (printConfigState.orientation === k) {
                btn.className = 'py-1.5 px-2 rounded-xl bg-amber-500 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer';
            } else {
                btn.className = 'py-1.5 px-2 rounded-xl bg-white/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200/80 dark:border-slate-700/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer';
            }
        }
    });

    // 4. Escala
    ['fit_width', 'fit_page', '100'].forEach(k => {
        const btn = document.getElementById(`btn-print-scale-${k}`);
        if (btn) {
            if (printConfigState.scale === k) {
                btn.className = 'py-1.5 px-2.5 rounded-xl bg-amber-500 text-white font-extrabold text-[11px] shadow-md shadow-amber-500/20 transition-all flex items-center justify-between cursor-pointer';
            } else {
                btn.className = 'py-1.5 px-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] border border-slate-200/80 dark:border-slate-700/80 transition-all flex items-center justify-between cursor-pointer';
            }
        }
    });

    // 5. Checkboxes
    ['gridlines', 'headers', 'title', 'signatures'].forEach(k => {
        const chk = document.getElementById(`print-chk-${k}`);
        if (chk) chk.checked = !!printConfigState[k];
    });
}

function toolPrint() {
    openPrintSpreadsheetModal();
}

function openPrintSpreadsheetModal() {
    const modal = document.getElementById('modal-print-spreadsheet');
    if (!modal) {
        executePrintSpreadsheet();
        return;
    }

    if (spreadsheetEngine && spreadsheetEngine.pageConfig) {
        if (spreadsheetEngine.pageConfig.size) {
            printConfigState.size = spreadsheetEngine.pageConfig.size;
        }
        if (spreadsheetEngine.pageConfig.orientation) {
            printConfigState.orientation = spreadsheetEngine.pageConfig.orientation;
        }
    }

    modal.classList.remove('closing', 'hidden');
    modal.style.display = 'flex';
    if (spreadsheetEngine && typeof spreadsheetEngine.render === 'function') {
        spreadsheetEngine.render();
    }
    syncPrintButtonsUI();
    setPrintPreviewZoom('fit');
    updatePrintPreview();
}

function closePrintSpreadsheetModal() {
    const modal = document.getElementById('modal-print-spreadsheet');
    if (!modal) return;
    modal.classList.add('closing');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
    }, 280);
}

// Atajo Global Permanente Ctrl+P / Cmd+P en fase de captura
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.code === 'KeyP')) {
        e.preventDefault();
        e.stopPropagation();
        toolPrint();
    }
}, true);

function getPrintOptions() {
    return { ...printConfigState };
}

function getSheetBoundingBox(sheet) {
    if (!sheet) return { minRow: 0, maxRow: 15, minCol: 0, maxCol: 5 };
    const data = sheet.data || {};
    const keys = Object.keys(data);
    
    let minRow = Infinity, maxRow = -1, minCol = Infinity, maxCol = -1;

    for (const key of keys) {
        const parts = key.split('_');
        const r = parseInt(parts[0], 10);
        const c = parseInt(parts[1], 10);
        const cell = data[key];
        if (cell && ((cell.v !== undefined && cell.v !== '') || cell.f || cell.bgcolor || cell.border || cell.borderBottom || cell.borderTop || cell.borderLeft || cell.borderRight)) {
            if (r < minRow) minRow = r;
            if (r > maxRow) maxRow = r;
            if (c < minCol) minCol = c;
            if (c > maxCol) maxCol = c;
        }
    }

    if (sheet.tables && Array.isArray(sheet.tables)) {
        for (const t of sheet.tables) {
            if (t.range) {
                minRow = Math.min(minRow, t.range.r1);
                maxRow = Math.max(maxRow, t.range.r2);
                minCol = Math.min(minCol, t.range.c1);
                maxCol = Math.max(maxCol, t.range.c2);
            }
        }
    }

    if (minRow === Infinity || maxRow === -1) {
        return { minRow: 0, maxRow: 15, minCol: 0, maxCol: 5 };
    }

    return {
        minRow: Math.max(0, minRow),
        maxRow: Math.min((spreadsheetEngine?.options?.rowCount || 100) - 1, maxRow),
        minCol: Math.max(0, minCol),
        maxCol: Math.min((spreadsheetEngine?.options?.colCount || 26) - 1, maxCol)
    };
}

function getPageLayoutDimensions(size, orientation) {
    let w = 792, h = 1024, rowsFirst = 28, rowsOther = 34; // Letter default
    
    if (size === 'letter') {
        if (orientation === 'landscape') {
            w = 1024; h = 792; rowsFirst = 16; rowsOther = 20;
        } else {
            w = 792; h = 1024; rowsFirst = 28; rowsOther = 34;
        }
    } else if (size === 'a4') {
        if (orientation === 'landscape') {
            w = 1090; h = 770; rowsFirst = 17; rowsOther = 21;
        } else {
            w = 770; h = 1090; rowsFirst = 30; rowsOther = 36;
        }
    } else if (size === 'legal') {
        if (orientation === 'landscape') {
            w = 1300; h = 792; rowsFirst = 17; rowsOther = 22;
        } else {
            w = 792; h = 1300; rowsFirst = 38; rowsOther = 46;
        }
    }
    return { width: w, height: h, rowsFirst, rowsOther };
}

function computePageRowChunks(sheet, bounds, layout, opts) {
    if (opts.scale === 'fit_page') {
        return [{ startRow: bounds.minRow, endRow: bounds.maxRow }];
    }

    const chunks = [];
    let currentStart = bounds.minRow;

    while (currentStart <= bounds.maxRow) {
        const isFirst = (chunks.length === 0);
        const baseLimit = isFirst ? layout.rowsFirst : layout.rowsOther;
        let tentativeEnd = Math.min(bounds.maxRow, currentStart + baseLimit - 1);

        // Si quedan pocos renglones (<= 5) para el final total, absorberlos para no dejar una página huérfana
        if (bounds.maxRow - tentativeEnd <= 5) {
            tentativeEnd = bounds.maxRow;
        } else {
            // Buscar un corte natural (fila vacía o separador) para no cortar a la mitad un caso o bloque contable
            let bestBreak = tentativeEnd;
            let foundNatural = false;

            // 1. Buscar fila vacía hacia atrás (dentro de los últimos 6 renglones del lote)
            for (let r = tentativeEnd; r >= Math.max(currentStart + 8, tentativeEnd - 6); r--) {
                let isRowEmpty = true;
                for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
                    const cd = sheet.data ? sheet.data[`${r}_${c}`] : null;
                    if (cd && ((cd.v !== undefined && cd.v !== '') || cd.f)) {
                        isRowEmpty = false;
                        break;
                    }
                }
                if (isRowEmpty) {
                    bestBreak = r;
                    foundNatural = true;
                    break;
                }
            }

            // 2. Si no encontró fila vacía hacia atrás, mirar si tentativeEnd + 1 o + 2 es fila vacía o fin de caso
            if (!foundNatural) {
                for (let r = tentativeEnd + 1; r <= Math.min(bounds.maxRow, tentativeEnd + 4); r++) {
                    let isRowEmpty = true;
                    for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
                        const cd = sheet.data ? sheet.data[`${r}_${c}`] : null;
                        if (cd && ((cd.v !== undefined && cd.v !== '') || cd.f)) {
                            isRowEmpty = false;
                            break;
                        }
                    }
                    if (isRowEmpty) {
                        bestBreak = r;
                        foundNatural = true;
                        break;
                    }
                }
            }

            tentativeEnd = bestBreak;
        }

        chunks.push({ startRow: currentStart, endRow: tentativeEnd });
        currentStart = tentativeEnd + 1;
    }

    return chunks;
}

function buildPrintCellStyles(cellData, isGridlineEnabled) {
    let style = '';
    
    if (cellData.align) style += `text-align: ${cellData.align}; `;
    else style += `text-align: left; `;
    
    if (cellData.valign) style += `vertical-align: ${cellData.valign}; `;
    else style += `vertical-align: middle; `;

    if (cellData.bold) style += 'font-weight: bold; ';
    if (cellData.italic) style += 'font-style: italic; ';
    
    let textDeco = [];
    if (cellData.underline) textDeco.push('underline');
    if (cellData.strikethrough) textDeco.push('line-through');
    if (textDeco.length > 0) style += `text-decoration: ${textDeco.join(' ')}; `;
    
    if (cellData.color) {
        style += `color: ${cellData.color}; `;
    } else if (cellData.bgcolor && (cellData.bgcolor.startsWith('#1') || cellData.bgcolor.startsWith('#0') || cellData.bgcolor.includes('1e3a8a') || cellData.bgcolor.includes('1e293b') || cellData.bgcolor.includes('0f172a') || cellData.bgcolor.includes('3b82f6') || cellData.bgcolor.includes('2563eb') || cellData.bgcolor.includes('047857') || cellData.bgcolor.includes('b45309'))) {
        style += `color: #ffffff; `;
    }
    if (cellData.bgcolor) style += `background-color: ${cellData.bgcolor}; `;
    if (cellData.font) style += `font-family: '${cellData.font}', 'Plus Jakarta Sans', sans-serif; `;
    if (cellData.size) style += `font-size: ${cellData.size}pt; `;
    if (cellData.indent) style += `padding-left: ${(cellData.indent * 12) + 6}px; `;

    // Bordes
    let bLeft = cellData.borderLeft || null;
    let bRight = cellData.borderRight || null;
    let bTop = cellData.borderTop || null;
    let bBottom = cellData.borderBottom || null;

    if (cellData.border) {
        const bColor = cellData.borderColor || (cellData.border.includes('double') ? '#1e293b' : '#64748b');
        if (cellData.border === 'all' || cellData.border === 'outer') {
            bLeft = bLeft || `1px solid ${bColor}`;
            bRight = bRight || `1px solid ${bColor}`;
            bTop = bTop || `1px solid ${bColor}`;
            bBottom = bBottom || `1px solid ${bColor}`;
        } else if (cellData.border === 'top') {
            bTop = bTop || `1px solid ${bColor}`;
        } else if (cellData.border === 'bottom') {
            bBottom = bBottom || `1px solid ${bColor}`;
        } else if (cellData.border === 'left') {
            bLeft = bLeft || `1px solid ${bColor}`;
        } else if (cellData.border === 'right') {
            bRight = bRight || `1px solid ${bColor}`;
        } else if (cellData.border === 'bottom-thick') {
            bBottom = bBottom || `2.5px solid ${bColor}`;
        } else if (cellData.border === 'accounting-double' || cellData.border === 'bottom-double') {
            bBottom = bBottom || `3px double ${bColor}`;
        } else if (cellData.border === 'top-bottom-thick') {
            bTop = bTop || `1px solid ${bColor}`;
            bBottom = bBottom || `2.5px solid ${bColor}`;
        } else if (cellData.border === 'top-bottom-double') {
            bTop = bTop || `1px solid ${bColor}`;
            bBottom = bBottom || `3px double ${bColor}`;
        }
    }

    if (bTop) style += `border-top: ${bTop}; `;
    else if (isGridlineEnabled) style += `border-top: 1px solid #cbd5e1; `;

    if (bBottom) style += `border-bottom: ${bBottom}; `;
    else if (isGridlineEnabled) style += `border-bottom: 1px solid #cbd5e1; `;

    if (bLeft) style += `border-left: ${bLeft}; `;
    else if (isGridlineEnabled) style += `border-left: 1px solid #cbd5e1; `;

    if (bRight) style += `border-right: ${bRight}; `;
    else if (isGridlineEnabled) style += `border-right: 1px solid #cbd5e1; `;

    return style;
}

function getEvaluatedCellValue(sheet, r, c) {
    if (spreadsheetEngine && typeof spreadsheetEngine.getEvaluatedCellDisplay === 'function') {
        return spreadsheetEngine.getEvaluatedCellDisplay(r, c, sheet);
    }
    const cellKey = `${r}_${c}`;
    const cellData = (sheet.data && sheet.data[cellKey]) || {};
    const raw = cellData.v !== undefined && cellData.v !== null ? cellData.v : (cellData.f ? `=${cellData.f}` : '');
    return escapeHtmlCalc(raw);
}

function computeOptimalColumnWidths(sheet, bounds, opts) {
    const colWidthsArr = [];
    let totalColsWidth = 0;
    if (opts.headers) totalColsWidth += 36;

    for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
        let maxLen = 0;
        for (let r = bounds.minRow; r <= bounds.maxRow; r++) {
            const cellKey = `${r}_${c}`;
            const cell = (sheet.data && sheet.data[cellKey]);
            if (cell && !cell.merge && !cell.mergedInto) {
                const txt = String(cell.v !== undefined ? cell.v : (cell.f || ''));
                if (txt.length > maxLen) maxLen = txt.length;
            }
        }

        let baseW = (sheet.colWidths && sheet.colWidths[c]) ? sheet.colWidths[c] : 85;
        if (maxLen > 10) {
            baseW = Math.max(baseW, Math.min(160, maxLen * 8.5 + 16));
        } else if (maxLen <= 3 && maxLen > 0) {
            baseW = Math.min(baseW, 60);
        }

        colWidthsArr.push({ col: c, width: baseW });
        totalColsWidth += baseW;
    }

    return { colWidthsArr, totalColsWidth };
}

function generatePrintPageHTML(sheet, bounds, startRow, endRow, pageIdx, totalPages, opts, layout, colInfo) {
    const projName = escapeHtmlCalc((proyecto_actual && proyecto_actual.name) ? proyecto_actual.name : 'Hoja de Cálculo');
    const safeSheetName = escapeHtmlCalc(sheet.name || 'Hoja1');
    const dateStr = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const isFirstPage = (pageIdx === 1);
    const isLastPage = (pageIdx === totalPages);

    let html = '';

    // 1. Membrete institucional solo en Página 1
    if (opts.title && isFirstPage) {
        html += `
            <div style="margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2.5px solid #f59e0b; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 style="font-size: 14pt; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">${projName}</h1>
                    <div style="font-size: 10.5pt; font-weight: 700; color: #b45309; margin-top: 2px;">${safeSheetName}</div>
                    <div style="font-size: 7.5pt; color: #64748b; margin-top: 1px;">EduConta SV — Sistema Contable y Financiero de El Salvador | Moneda: USD ($)</div>
                </div>
                <div style="text-align: right; font-size: 7.5pt; color: #64748b; line-height: 1.3;">
                    <div><strong>Fecha de Emisión:</strong></div>
                    <div>${dateStr}</div>
                </div>
            </div>
        `;
    }

    // 2. Tabla con colgroup proporcional
    html += '<table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 8pt; font-family: \'Plus Jakarta Sans\', sans-serif;">';
    html += '<colgroup>';
    if (opts.headers) {
        const hPct = ((36 / colInfo.totalColsWidth) * 100).toFixed(3);
        html += `<col style="width: ${hPct}%;">`;
    }
    for (const cw of colInfo.colWidthsArr) {
        const pct = ((cw.width / colInfo.totalColsWidth) * 100).toFixed(3);
        html += `<col style="width: ${pct}%;">`;
    }
    html += '</colgroup>';

    // Encabezados de columnas A, B, C...
    if (opts.headers) {
        html += '<thead><tr style="background-color: #f1f5f9; color: #475569; font-weight: bold; border-bottom: 1.5px solid #cbd5e1;">';
        html += '<th style="padding: 3px; border: 1px solid #cbd5e1; text-align: center; font-size: 7.5pt;">#</th>';
        for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
            const colName = spreadsheetEngine ? spreadsheetEngine.getColName(c) : String.fromCharCode(65 + c);
            html += `<th style="padding: 3px 5px; border: 1px solid #cbd5e1; text-align: center; font-size: 7.5pt; text-transform: uppercase;">${colName}</th>`;
        }
        html += '</tr></thead>';
    }

    // Filas correspondientes a esta página
    html += '<tbody>';
    for (let r = startRow; r <= endRow; r++) {
        const rowHeight = (sheet.rowHeights && sheet.rowHeights[r]) ? sheet.rowHeights[r] : 22;
        html += `<tr style="min-height: ${rowHeight}px;">`;
        
        if (opts.headers) {
            html += `<td style="padding: 2.5px; background-color: #f8fafc; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size: 7.5pt; color: #64748b;">${r + 1}</td>`;
        }

        for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
            const cellKey = `${r}_${c}`;
            const cellData = (sheet.data && sheet.data[cellKey]) || {};

            if (cellData.mergedInto) continue;

            let mergeAttrs = '';
            if (cellData.merge) {
                mergeAttrs = ` colspan="${cellData.merge.colspan}" rowspan="${cellData.merge.rowspan}" `;
            }

            const val = getEvaluatedCellValue(sheet, r, c);
            const cellStyles = buildPrintCellStyles(cellData, opts.gridlines);
            
            const isNumeric = typeof val === 'number' || (!isNaN(parseFloat(val)) && !String(val).includes('Guía') && !String(val).includes('MÓDULO') && !String(val).includes('Caso') && !String(val).includes('SE '));
            const nowrapStyle = isNumeric ? 'white-space: nowrap;' : 'word-break: normal; overflow-wrap: break-word;';
            const safeCellVal = (val !== '' && val !== null && val !== undefined)
                ? (typeof val === 'string' && /^<span class="text-rose-500 font-semibold">[-(]?\$?[\d,.]+\)?<\/span>$/.test(val) ? val : escapeHtmlCalc(String(val).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")))
                : '&nbsp;';

            html += `<td ${mergeAttrs} style="padding: 3.5px 5px; line-height: 1.25; ${nowrapStyle} ${cellStyles}">${safeCellVal}</td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table>';

    // 3. Firmas Contables en la última página
    if (opts.signatures && isLastPage) {
        html += `
            <div style="margin-top: 28px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center; font-size: 8pt; color: #334155; page-break-inside: avoid;">
                <div style="border-top: 1px solid #94a3b8; padding-top: 5px;">
                    <strong>Elaborado por</strong><br>
                    <span style="color: #64748b; font-size: 7pt;">Contador General</span>
                </div>
                <div style="border-top: 1px solid #94a3b8; padding-top: 5px;">
                    <strong>Revisado por</strong><br>
                    <span style="color: #64748b; font-size: 7pt;">Auditor / Supervisor</span>
                </div>
                <div style="border-top: 1px solid #94a3b8; padding-top: 5px;">
                    <strong>Aprobado por</strong><br>
                    <span style="color: #64748b; font-size: 7pt;">Representante Legal</span>
                </div>
            </div>
        `;
    }

    // 4. Pie de página con numeración
    html += `
        <div style="margin-top: auto; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 7.5pt; color: #94a3b8; border-top: 1px solid #f1f5f9;">
            <span>EduConta SV • ${sheet.name || 'Hoja'}</span>
            <span>Página ${pageIdx} de ${totalPages}</span>
        </div>
    `;

    return html;
}

function updatePrintPreview() {
    const stage = document.getElementById('print-preview-stage');
    const statsEl = document.getElementById('print-preview-stats');
    if (!stage || !spreadsheetEngine) return;

    const opts = getPrintOptions();
    const layout = getPageLayoutDimensions(opts.size, opts.orientation);

    let targetSheets = [];
    if (opts.range === 'selection') {
        const activeSheet = spreadsheetEngine.sheets[spreadsheetEngine.activeSheetIndex];
        const r1 = Math.min(spreadsheetEngine.selectStartRow, spreadsheetEngine.selectEndRow);
        const r2 = Math.max(spreadsheetEngine.selectStartRow, spreadsheetEngine.selectEndRow);
        const c1 = Math.min(spreadsheetEngine.selectStartCol, spreadsheetEngine.selectEndCol);
        const c2 = Math.max(spreadsheetEngine.selectStartCol, spreadsheetEngine.selectEndCol);
        targetSheets.push({ sheet: activeSheet, bounds: { minRow: r1, maxRow: r2, minCol: c1, maxCol: c2 } });
    } else if (opts.range === 'all_sheets') {
        spreadsheetEngine.sheets.forEach(s => {
            targetSheets.push({ sheet: s, bounds: getSheetBoundingBox(s) });
        });
    } else {
        const activeSheet = spreadsheetEngine.sheets[spreadsheetEngine.activeSheetIndex];
        targetSheets.push({ sheet: activeSheet, bounds: getSheetBoundingBox(activeSheet) });
    }

    // Calcular páginas totales y generar tarjetas de página física con particionado inteligente
    let totalGeneratedPages = 0;
    const pagesHTMLList = [];

    targetSheets.forEach(item => {
        const sheet = item.sheet;
        const bounds = item.bounds;
        const colInfo = computeOptimalColumnWidths(sheet, bounds, opts);
        const chunks = computePageRowChunks(sheet, bounds, layout, opts);
        const sheetPageCount = chunks.length;

        chunks.forEach((chunk, idx) => {
            const pageNum = idx + 1;
            totalGeneratedPages++;
            const pageInnerHtml = generatePrintPageHTML(sheet, bounds, chunk.startRow, chunk.endRow, pageNum, sheetPageCount, opts, layout, colInfo);
            pagesHTMLList.push({ html: pageInnerHtml, pageIdx: pageNum, totalPages: sheetPageCount, sheetName: sheet.name });
        });
    });

    // Renderizar tarjetas de páginas en el escenario
    stage.innerHTML = pagesHTMLList.map((p, idx) => `
        <div class="print-page-card" style="width: ${layout.width}px; height: ${layout.height}px; background: #ffffff; color: #0f172a; padding: 34px 28px; border-radius: 4px; box-shadow: 0 15px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.08); position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; shrink-0;">
            ${p.html}
        </div>
    `).join('');

    // Ajustar zoom y estadísticas
    paperTransformApply();

    if (statsEl) {
        const sizeName = opts.size === 'legal' ? 'Oficio (8.5x14")' : (opts.size === 'a4' ? 'A4 (210x297mm)' : 'Carta (8.5x11")');
        statsEl.textContent = `${totalGeneratedPages} ${totalGeneratedPages === 1 ? 'Página' : 'Páginas'} | ${sizeName} | ${opts.orientation === 'landscape' ? 'Horizontal' : 'Vertical'}`;
    }
}

function paperTransformApply() {
    const stage = document.getElementById('print-preview-stage');
    if (stage) {
        stage.style.transform = `scale(${printPreviewZoom})`;
        stage.style.transformOrigin = 'top center';
    }
}

function executePrintSpreadsheet() {
    if (!spreadsheetEngine) return;
    const opts = getPrintOptions();
    const layout = getPageLayoutDimensions(opts.size, opts.orientation);

    let targetSheets = [];
    if (opts.range === 'selection') {
        const activeSheet = spreadsheetEngine.sheets[spreadsheetEngine.activeSheetIndex];
        const r1 = Math.min(spreadsheetEngine.selectStartRow, spreadsheetEngine.selectEndRow);
        const r2 = Math.max(spreadsheetEngine.selectStartRow, spreadsheetEngine.selectEndRow);
        const c1 = Math.min(spreadsheetEngine.selectStartCol, spreadsheetEngine.selectEndCol);
        const c2 = Math.max(spreadsheetEngine.selectStartCol, spreadsheetEngine.selectEndCol);
        targetSheets.push({ sheet: activeSheet, bounds: { minRow: r1, maxRow: r2, minCol: c1, maxCol: c2 } });
    } else if (opts.range === 'all_sheets') {
        spreadsheetEngine.sheets.forEach(s => {
            targetSheets.push({ sheet: s, bounds: getSheetBoundingBox(s) });
        });
    } else {
        const activeSheet = spreadsheetEngine.sheets[spreadsheetEngine.activeSheetIndex];
        targetSheets.push({ sheet: activeSheet, bounds: getSheetBoundingBox(activeSheet) });
    }

    let printPagesHTML = '';

    targetSheets.forEach(item => {
        const sheet = item.sheet;
        const bounds = item.bounds;
        const colInfo = computeOptimalColumnWidths(sheet, bounds, opts);
        const chunks = computePageRowChunks(sheet, bounds, layout, opts);
        const sheetPageCount = chunks.length;

        chunks.forEach((chunk, idx) => {
            const pageNum = idx + 1;
            const pageInnerHtml = generatePrintPageHTML(sheet, bounds, chunk.startRow, chunk.endRow, pageNum, sheetPageCount, opts, layout, colInfo);
            printPagesHTML += `<div class="sheet-print-page" style="page-break-after: always; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">${pageInnerHtml}</div>`;
        });
    });

    const pageSizeCss = opts.size === 'legal' ? 'legal' : (opts.size === 'a4' ? 'A4' : 'letter');

    const printDocHTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>${proyecto_actual?.name || 'Hoja de Cálculo'} - EduConta SV</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        @page {
            size: ${pageSizeCss} ${opts.orientation};
            margin: 12mm 10mm 12mm 10mm;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #0f172a;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .sheet-print-page {
            width: 100%;
            page-break-after: always;
            box-sizing: border-box;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        td, th {
            vertical-align: middle;
        }
    </style>
</head>
<body>
    ${printPagesHTML}
</body>
</html>`;

    let printFrame = document.getElementById('educonta-print-iframe');
    if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'educonta-print-iframe';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(printDocHTML);
    frameDoc.close();

    closePrintSpreadsheetModal();

    setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
    }, 250);
}

// === BÚSQUEDA Y REEMPLAZO ===
function openSearchModal() {
    const modal = document.getElementById('modal-search-replace');
    if (!modal) return;
    modal.classList.remove('closing');
    modal.style.display = 'flex';
    setTimeout(() => {
        const input = document.getElementById('search-term-input');
        if (input) { input.focus(); input.select(); }
    }, 50);
}
function closeSearchModal() {
    const modal = document.getElementById('modal-search-replace');
    if (!modal) return;
    modal.classList.add('closing');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
    }, 280);
}
function executeSearchNext() {
    if (!spreadsheetEngine) return;
    const term = document.getElementById('search-term-input').value;
    const found = spreadsheetEngine.findNext(term);
    if (!found) alert('No se encontraron más coincidencias.');
}
function executeReplaceAll() {
    if (!spreadsheetEngine) return;
    const term = document.getElementById('search-term-input').value;
    const replacement = document.getElementById('replace-term-input').value;
    const count = spreadsheetEngine.replaceAll(term, replacement);
    alert(`${count} coincidencia(s) reemplazada(s).`);
}

// === ASISTENTE DE FÓRMULAS EXHAUSTIVO ===
const FORMULAS_CATALOG = [
    // === 💰 FINANCIERAS ===
    { name: 'VAN', cat: 'finance', desc: 'Calcula el Valor Actual Neto de una inversión a partir de una tasa de descuento y flujos de efectivo.', example: '=VAN(10%; B2:B6)' },
    { name: 'VNA', cat: 'finance', desc: 'Calcula el Valor Neto Actual descontando flujos de caja futuros periódicos.', example: '=VNA(12%; C1:C5)' },
    { name: 'TIR', cat: 'finance', desc: 'Devuelve la Tasa Interna de Retorno de una serie periódica de flujos de efectivo.', example: '=TIR(B1:B6)' },
    { name: 'TIR.NO.PER', cat: 'finance', desc: 'Calcula la tasa interna de retorno para flujos de caja no periódicos.', example: '=TIR.NO.PER(B1:B6; A1:A6)' },
    { name: 'VNA.NO.PER', cat: 'finance', desc: 'Calcula el valor neto actual para un calendario de flujos de efectivo no periódicos.', example: '=VNA.NO.PER(10%; B1:B6; A1:A6)' },
    { name: 'TASA', cat: 'finance', desc: 'Devuelve la tasa de interés por período de un préstamo o anualidad.', example: '=TASA(12; -100; 1000)' },
    { name: 'NPER', cat: 'finance', desc: 'Calcula el número de períodos de una inversión o préstamo con cuotas constantes.', example: '=NPER(10%/12; -200; 2000)' },
    { name: 'PAGO', cat: 'finance', desc: 'Calcula la cuota mensual de un préstamo a amortizar a tasa fija.', example: '=PAGO(12%/12; 24; 5000)' },
    { name: 'PAGOPRIN', cat: 'finance', desc: 'Calcula el pago sobre el capital de un préstamo en un período específico.', example: '=PAGOPRIN(10%/12; 1; 12; 1000)' },
    { name: 'PAGOINT', cat: 'finance', desc: 'Calcula el interés pagado en un período determinado para un préstamo.', example: '=PAGOINT(10%/12; 1; 12; 1000)' },
    { name: 'VF', cat: 'finance', desc: 'Devuelve el valor futuro de un plan de inversión o ahorro recurrente.', example: '=VF(8%/12; 36; -150)' },
    { name: 'VA', cat: 'finance', desc: 'Devuelve el valor presente o suma actual de pagos futuros.', example: '=VA(8%/12; 36; -150)' },
    { name: 'SLN', cat: 'finance', desc: 'Calcula la depreciación lineal por línea recta de un activo.', example: '=SLN(10000; 1000; 5)' },
    { name: 'SYD', cat: 'finance', desc: 'Depreciación por el método de suma de dígitos de los años.', example: '=SYD(10000; 1000; 5; 1)' },
    { name: 'DDB', cat: 'finance', desc: 'Depreciación por el método de doble disminución de saldo amortizado.', example: '=DDB(10000; 1000; 5; 1)' },
    { name: 'DB', cat: 'finance', desc: 'Depreciación por el método de saldo fijo decreciente.', example: '=DB(10000; 1000; 5; 1)' },
    { name: 'INT.PAGO.DIR', cat: 'finance', desc: 'Calcula el interés pagado en un período específico de una inversión.', example: '=INT.PAGO.DIR(8%/12; 1; 24; 5000)' },

    // === 🇸🇻 TRIBUTARIAS EL SALVADOR ===
    { name: 'IVA', cat: 'sv', desc: 'Calcula el Impuesto a la Transferencia de Bienes Muebles y a la Prestación de Servicios (13%).', example: '=IVA(B1)' },
    { name: 'ISSS_LABORAL', cat: 'sv', desc: 'Retención laboral ISSS (3.0% con techo cotizable de $1,000.00).', example: '=ISSS_LABORAL(B1)' },
    { name: 'ISSS_PATRONAL', cat: 'sv', desc: 'Aporte patronal ISSS (7.5% con techo cotizable de $1,000.00).', example: '=ISSS_PATRONAL(B1)' },
    { name: 'AFP_LABORAL', cat: 'sv', desc: 'Retención de pensiones AFP laboral (7.25% sobre total devengado).', example: '=AFP_LABORAL(B1)' },
    { name: 'AFP_PATRONAL', cat: 'sv', desc: 'Aporte patronal AFP (8.75% sobre total devengado).', example: '=AFP_PATRONAL(B1)' },
    { name: 'RENTA', cat: 'sv', desc: 'Calcula la retención mensual del Impuesto Sobre la Renta (ISR) según tablas del Ministerio de Hacienda.', example: '=RENTA(B1 - ISSS_LABORAL(B1) - AFP_LABORAL(B1))' },

    // === 📊 MATEMÁTICAS Y TRIGONOMÉTRICAS ===
    { name: 'SUMA', cat: 'math', desc: 'Suma todos los números contenidos en un rango de celdas.', example: '=SUMA(A1:A10)' },
    { name: 'SUMAR.SI', cat: 'math', desc: 'Suma las celdas que cumplen con un criterio determinado.', example: '=SUMAR.SI(A1:A10; ">100"; B1:B10)' },
    { name: 'SUMAR.SI.CONJUNTO', cat: 'math', desc: 'Suma las celdas que cumplen múltiples condiciones y criterios.', example: '=SUMAR.SI.CONJUNTO(C1:C10; A1:A10; ">100"; B1:B10; "SV")' },
    { name: 'SUMAPRODUCTO', cat: 'math', desc: 'Multiplica los componentes correspondientes de dos matrices y suma los productos.', example: '=SUMAPRODUCTO(A1:A5; B1:B5)' },
    { name: 'SUMA.CUADRADOS', cat: 'math', desc: 'Devuelve la suma de los cuadrados de los argumentos.', example: '=SUMA.CUADRADOS(A1:A5)' },
    { name: 'REDONDEAR', cat: 'math', desc: 'Redondea un número al número de decimales especificado.', example: '=REDONDEAR(A1; 2)' },
    { name: 'REDONDEAR.MAS', cat: 'math', desc: 'Redondea un número hacia arriba (en dirección opuesta a cero).', example: '=REDONDEAR.MAS(A1; 2)' },
    { name: 'REDONDEAR.MENOS', cat: 'math', desc: 'Redondea un número hacia abajo (hacia cero).', example: '=REDONDEAR.MENOS(A1; 2)' },
    { name: 'REDOND.MULT', cat: 'math', desc: 'Redondea un número al múltiplo deseado.', example: '=REDOND.MULT(A1; 5)' },
    { name: 'ENTERO', cat: 'math', desc: 'Redondea un número hacia abajo hasta el entero más próximo.', example: '=ENTERO(A1)' },
    { name: 'TRUNCAR', cat: 'math', desc: 'Suprime la parte decimal de un número sin redondear.', example: '=TRUNCAR(A1; 2)' },
    { name: 'ABS', cat: 'math', desc: 'Devuelve el valor absoluto de un número (sin signo negativo).', example: '=ABS(A1)' },
    { name: 'RESIDUO', cat: 'math', desc: 'Devuelve el residuo o resto de una división entera.', example: '=RESIDUO(A1; 2)' },
    { name: 'PRODUCTO', cat: 'math', desc: 'Multiplica todos los números de un rango o lista de valores.', example: '=PRODUCTO(A1:A5)' },
    { name: 'POTENCIA', cat: 'math', desc: 'Eleva un número a la potencia especificada.', example: '=POTENCIA(A1; 3)' },
    { name: 'RAIZ', cat: 'math', desc: 'Devuelve la raíz cuadrada de un número positivo.', example: '=RAIZ(A1)' },
    { name: 'EXP', cat: 'math', desc: 'Calcula e elevado a la potencia dada.', example: '=EXP(A1)' },
    { name: 'LN', cat: 'math', desc: 'Devuelve el logaritmo natural en base e.', example: '=LN(A1)' },
    { name: 'LOG10', cat: 'math', desc: 'Devuelve el logaritmo en base 10.', example: '=LOG10(A1)' },
    { name: 'ALEATORIO.ENTRE', cat: 'math', desc: 'Devuelve un número entero aleatorio en el rango especificado.', example: '=ALEATORIO.ENTRE(1; 100)' },
    { name: 'PI', cat: 'math', desc: 'Devuelve el valor de la constante Pi.', example: '=PI()' },
    { name: 'SUBTOTALES', cat: 'math', desc: 'Calcula subtotales numéricos (suma, promedio, conteo, etc.).', example: '=SUBTOTALES(9; A1:A10)' },

    // === 📈 ESTADÍSTICAS ===
    { name: 'PROMEDIO', cat: 'stats', desc: 'Promedio aritmético de los valores numéricos de un rango.', example: '=PROMEDIO(B1:B10)' },
    { name: 'PROMEDIO.SI', cat: 'stats', desc: 'Calcula el promedio de celdas que cumplen una condición.', example: '=PROMEDIO.SI(A1:A10; ">0"; B1:B10)' },
    { name: 'PROMEDIO.SI.CONJUNTO', cat: 'stats', desc: 'Promedio de celdas que satisfacen múltiples criterios.', example: '=PROMEDIO.SI.CONJUNTO(C1:C10; A1:A10; ">0"; B1:B10; "Ventas")' },
    { name: 'CONTAR', cat: 'stats', desc: 'Cuenta cuántas celdas contienen valores numéricos.', example: '=CONTAR(A1:A20)' },
    { name: 'CONTARA', cat: 'stats', desc: 'Cuenta celdas no vacías con texto, números o fórmulas.', example: '=CONTARA(A1:A20)' },
    { name: 'CONTAR.SI', cat: 'stats', desc: 'Cuenta cuántas celdas cumplen con un criterio dado.', example: '=CONTAR.SI(A1:A20; "Aprobado")' },
    { name: 'CONTAR.SI.CONJUNTO', cat: 'stats', desc: 'Cuenta celdas que cumplen múltiples condiciones.', example: '=CONTAR.SI.CONJUNTO(A1:A20; ">10"; B1:B20; "Activo")' },
    { name: 'CONTAR.BLANCO', cat: 'stats', desc: 'Cuenta las celdas en blanco o vacías en un rango.', example: '=CONTAR.BLANCO(A1:A20)' },
    { name: 'MAX', cat: 'stats', desc: 'Devuelve el valor numérico máximo de un rango.', example: '=MAX(A1:A20)' },
    { name: 'MIN', cat: 'stats', desc: 'Devuelve el valor numérico mínimo de un rango.', example: '=MIN(A1:A20)' },
    { name: 'MEDIANA', cat: 'stats', desc: 'Devuelve la mediana de una muestra numérica.', example: '=MEDIANA(A1:A20)' },
    { name: 'MODA.UNO', cat: 'stats', desc: 'Devuelve el valor más repetido o frecuente.', example: '=MODA.UNO(A1:A20)' },
    { name: 'K.ESIMO.MAYOR', cat: 'stats', desc: 'Devuelve el k-ésimo valor mayor de un rango.', example: '=K.ESIMO.MAYOR(A1:A20; 2)' },
    { name: 'K.ESIMO.MENOR', cat: 'stats', desc: 'Devuelve el k-ésimo valor menor de un rango.', example: '=K.ESIMO.MENOR(A1:A20; 2)' },
    { name: 'DESVEST.M', cat: 'stats', desc: 'Calcula la desviación estándar muestral.', example: '=DESVEST.M(A1:A20)' },
    { name: 'VAR.S', cat: 'stats', desc: 'Calcula la varianza muestral de un rango.', example: '=VAR.S(A1:A20)' },
    { name: 'COEF.DE.CORREL', cat: 'stats', desc: 'Calcula el coeficiente de correlación entre dos variables.', example: '=COEF.DE.CORREL(A1:A10; B1:B10)' },
    { name: 'JERARQUIA', cat: 'stats', desc: 'Devuelve la posición o ranking de un número en una lista.', example: '=JERARQUIA(A1; A$1:A$20)' },

    // === 🔀 LÓGICAS Y COMPROBACIÓN ===
    { name: 'SI', cat: 'logic', desc: 'Evalúa una condición lógica y devuelve un valor si es verdadera u otro si es falsa.', example: '=SI(A1>=100; "SE ACEPTA"; "SE RECHAZA")' },
    { name: 'SI.CONJUNTO', cat: 'logic', desc: 'Evalúa múltiples condiciones y devuelve el valor de la primera verdadera.', example: '=SI.CONJUNTO(A1>=90; "Excelente"; A1>=70; "Bueno"; VERDADERO(); "Regular")' },
    { name: 'SI.ERROR', cat: 'logic', desc: 'Devuelve un valor de respaldo personalizado si una fórmula da error.', example: '=SI.ERROR(A1/B1; 0)' },
    { name: 'SI.ND', cat: 'logic', desc: 'Devuelve un valor si la fórmula genera el error #N/A.', example: '=SI.ND(BUSCARV(A1; B1:C10; 2; FALSO); "No encontrado")' },
    { name: 'Y', cat: 'logic', desc: 'Devuelve VERDADERO si todas las condiciones se cumplen.', example: '=Y(A1>0; B1<100)' },
    { name: 'O', cat: 'logic', desc: 'Devuelve VERDADERO si al menos una condición es cierta.', example: '=O(A1="SV"; B1="USD")' },
    { name: 'NO', cat: 'logic', desc: 'Invierte el valor de verdadero a falso o viceversa.', example: '=NO(A1=0)' },
    { name: 'VERDADERO', cat: 'logic', desc: 'Devuelve el valor booleano VERDADERO.', example: '=VERDADERO()' },
    { name: 'FALSO', cat: 'logic', desc: 'Devuelve el valor booleano FALSO.', example: '=FALSO()' },
    { name: 'ESBLANCO', cat: 'logic', desc: 'Comprueba si una celda está vacía.', example: '=ESBLANCO(A1)' },
    { name: 'ESNUMERO', cat: 'logic', desc: 'Comprueba si el valor de una celda es un número.', example: '=ESNUMERO(A1)' },
    { name: 'ESTEXTO', cat: 'logic', desc: 'Comprueba si el valor de una celda es texto.', example: '=ESTEXTO(A1)' },

    // === 🔍 BÚSQUEDA Y REFERENCIA ===
    { name: 'BUSCARX', cat: 'lookup', desc: 'Búsqueda moderna bidireccional y flexible en matrices.', example: '=BUSCARX(A1; B1:B10; C1:C10; "No hallado")' },
    { name: 'BUSCARV', cat: 'lookup', desc: 'Busca un valor en la primera columna de una tabla y devuelve el dato de otra columna.', example: '=BUSCARV(A1; D1:F10; 2; FALSO)' },
    { name: 'BUSCARH', cat: 'lookup', desc: 'Busca en la primera fila de una tabla o matriz.', example: '=BUSCARH(A1; A1:Z5; 3; FALSO)' },
    { name: 'COINCIDIR', cat: 'lookup', desc: 'Devuelve la posición relativa de un elemento en una fila o columna.', example: '=COINCIDIR(A1; B1:B10; 0)' },
    { name: 'INDICE', cat: 'lookup', desc: 'Devuelve el valor de una celda en una intersección de fila y columna.', example: '=INDICE(B1:D10; 3; 2)' },
    { name: 'ELEGIR', cat: 'lookup', desc: 'Elige un valor de una lista por número de índice.', example: '=ELEGIR(2; "Bajo"; "Medio"; "Alto")' },
    { name: 'DESREF', cat: 'lookup', desc: 'Devuelve una referencia a un rango desplazado.', example: '=DESREF(A1; 2; 3)' },
    { name: 'COLUMNA', cat: 'lookup', desc: 'Devuelve el número de columna de una referencia.', example: '=COLUMNA(C5)' },
    { name: 'FILA', cat: 'lookup', desc: 'Devuelve el número de fila de una referencia.', example: '=FILA(C5)' },
    { name: 'TRANSPONER', cat: 'lookup', desc: 'Transpone un rango vertical en horizontal.', example: '=TRANSPONER(A1:A5)' },

    // === 🔤 TEXTO Y CADENAS ===
    { name: 'CONCATENAR', cat: 'text', desc: 'Une varias cadenas de texto en una sola celda.', example: '=CONCATENAR(A1; " "; B1)' },
    { name: 'CONCAT', cat: 'text', desc: 'Concatena una lista o rango de celdas de texto.', example: '=CONCAT(A1:C1)' },
    { name: 'UNIRCADENAS', cat: 'text', desc: 'Une cadenas de texto con un delimitador personalizado.', example: '=UNIRCADENAS(", "; VERDADERO(); A1:A5)' },
    { name: 'TEXTO', cat: 'text', desc: 'Formatea un número en texto con formato personalizado.', example: '=TEXTO(A1; "$#,##0.00")' },
    { name: 'VALOR', cat: 'text', desc: 'Convierte una cadena de texto numérico a número.', example: '=VALOR(A1)' },
    { name: 'MAYUSC', cat: 'text', desc: 'Convierte el texto completo en mayúsculas.', example: '=MAYUSC(A1)' },
    { name: 'MINUSC', cat: 'text', desc: 'Convierte el texto completo en minúsculas.', example: '=MINUSC(A1)' },
    { name: 'NOMPROPIO', cat: 'text', desc: 'Convierte a mayúscula la primera letra de cada palabra.', example: '=NOMPROPIO(A1)' },
    { name: 'IZQUIERDA', cat: 'text', desc: 'Extrae caracteres del lado izquierdo de un texto.', example: '=IZQUIERDA(A1; 3)' },
    { name: 'DERECHA', cat: 'text', desc: 'Extrae caracteres del lado derecho de un texto.', example: '=DERECHA(A1; 4)' },
    { name: 'EXTRAE', cat: 'text', desc: 'Extrae caracteres desde una posición inicial determinada.', example: '=EXTRAE(A1; 2; 5)' },
    { name: 'LARGO', cat: 'text', desc: 'Devuelve el número total de caracteres de un texto.', example: '=LARGO(A1)' },
    { name: 'ESPACIOS', cat: 'text', desc: 'Elimina los espacios iniciales, finales y duplicados.', example: '=ESPACIOS(A1)' },
    { name: 'REEMPLAZAR', cat: 'text', desc: 'Reemplaza caracteres en una posición específica.', example: '=REEMPLAZAR(A1; 1; 2; "SV")' },
    { name: 'SUSTITUIR', cat: 'text', desc: 'Sustituye texto antiguo por nuevo en una cadena.', example: '=SUSTITUIR(A1; "-"; "/")' },
    { name: 'REPETIR', cat: 'text', desc: 'Repite un texto un número determinado de veces.', example: '=REPETIR("*"; 10)' },
    { name: 'IGUAL', cat: 'text', desc: 'Comprueba si dos cadenas de texto son idénticas.', example: '=IGUAL(A1; B1)' },

    // === 📅 FECHAS Y HORAS ===
    { name: 'HOY', cat: 'date', desc: 'Devuelve la fecha actual del sistema.', example: '=HOY()' },
    { name: 'AHORA', cat: 'date', desc: 'Devuelve la fecha y hora actuales del sistema.', example: '=AHORA()' },
    { name: 'FECHA', cat: 'date', desc: 'Crea una fecha a partir de año, mes y día.', example: '=FECHA(2026; 8; 19)' },
    { name: 'HORA', cat: 'date', desc: 'Convierte hora, minuto y segundo en hora válida.', example: '=HORA(14; 30; 0)' },
    { name: 'AÑO', cat: 'date', desc: 'Extrae el año de una fecha.', example: '=AÑO(A1)' },
    { name: 'MES', cat: 'date', desc: 'Extrae el mes (1 al 12) de una fecha.', example: '=MES(A1)' },
    { name: 'DIA', cat: 'date', desc: 'Extrae el día del mes de una fecha.', example: '=DIA(A1)' },
    { name: 'DIAS', cat: 'date', desc: 'Calcula los días transcurridos entre dos fechas.', example: '=DIAS(B1; A1)' },
    { name: 'SIFECHA', cat: 'date', desc: 'Calcula la diferencia entre dos fechas en años ("Y"), meses ("M") o días ("D").', example: '=SIFECHA(A1; B1; "Y")' },
    { name: 'FECHA.MES', cat: 'date', desc: 'Suma o resta un número de meses a una fecha.', example: '=FECHA.MES(A1; 6)' },
    { name: 'FIN.MES', cat: 'date', desc: 'Devuelve el último día del mes.', example: '=FIN.MES(A1; 0)' },
    { name: 'DIA.LAB', cat: 'date', desc: 'Devuelve una fecha tras sumar días laborables.', example: '=DIA.LAB(A1; 15)' },
    { name: 'DIAS.LAB', cat: 'date', desc: 'Cuenta los días laborables entre dos fechas.', example: '=DIAS.LAB(A1; B1)' },
    { name: 'DIASEM', cat: 'date', desc: 'Devuelve el día de la semana (1 al 7).', example: '=DIASEM(A1; 2)' },
];

function buildFormulasGuideList(filterText = '', category = 'all') {
    const container = document.getElementById('formulas-list-container');
    if (!container) return;
    const items = FORMULAS_CATALOG.filter(f => {
        const matchesCat = category === 'all' || f.cat === category;
        const matchesText = !filterText || f.name.toLowerCase().includes(filterText.toLowerCase()) || f.desc.toLowerCase().includes(filterText.toLowerCase());
        return matchesCat && matchesText;
    });

    container.innerHTML = items.map(f => `
        <div class="p-3.5 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl cursor-pointer hover:border-amber-400 dark:hover:border-amber-400 hover:bg-amber-500/5 transition-all group" onclick="insertFormulaFromGuide('${f.name}')">
            <div class="flex items-center justify-between">
                <span class="tabular-nums font-black text-amber-600 dark:text-amber-400 text-sm group-hover:translate-x-1 transition-transform inline-block">${f.name}</span>
                <span class="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400">${f.cat}</span>
            </div>
            <p class="text-slate-600 dark:text-slate-300 mt-1.5 font-medium">${f.desc}</p>
            <code class="block mt-1.5 text-[11px] font-mono text-amber-600/80 dark:text-amber-400/80 bg-amber-500/10 px-2 py-1 rounded-xl w-fit">${f.example}</code>
        </div>
    `).join('') || '<p class="text-center text-slate-400 py-6">Sin resultados.</p>';
}

function insertFormulaFromGuide(fnName) {
    const formulaInput = document.getElementById('formula-input');
    if (formulaInput) {
        formulaInput.value = `=${fnName}(`;
        closeFormulasGuideModal();
        formulaInput.focus();
    }
}

function openFormulasGuideModal() {
    const modal = document.getElementById('modal-formulas-guide');
    if (!modal) return;
    buildFormulasGuideList();
    modal.classList.remove('closing');
    modal.style.display = 'flex';
}
function closeFormulasGuideModal() {
    const modal = document.getElementById('modal-formulas-guide');
    if (!modal) return;
    modal.classList.add('closing');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
    }, 280);
}
function filterFormulasList(text) {
    const activeCat = document.querySelector('.formula-cat-btn.active');
    buildFormulasGuideList(text, activeCat ? activeCat.getAttribute('data-cat') || 'all' : 'all');
}
function filterFormulaCategory(cat) {
    document.querySelectorAll('.formula-cat-btn').forEach(btn => btn.classList.remove('active', 'bg-amber-500', 'text-white'));
    const clicked = [...document.querySelectorAll('.formula-cat-btn')].find(b => b.getAttribute('onclick') === `filterFormulaCategory('${cat}')`);
    if (clicked) { clicked.classList.add('active', 'bg-amber-500', 'text-white'); clicked.setAttribute('data-cat', cat); }
    const searchVal = document.getElementById('formula-search-input').value;
    buildFormulasGuideList(searchVal, cat);
}

// === EXPORTAR / IMPORTAR (locales y CSV/EDC) ===
function exportarCSV() {
    if (!spreadsheetEngine) return;
    const eng = spreadsheetEngine;
    const sheet = eng.sheets[eng.activeSheetIndex];
    const sheetId = eng.sheetIdMap ? eng.sheetIdMap[sheet.name] : null;
    const rows = [];
    for (let r = 0; r < eng.options.rowCount; r++) {
        const rowVals = [];
        let rowHasContent = false;
        for (let c = 0; c < eng.options.colCount; c++) {
            let val = '';
            if (eng.hfInstance && sheetId !== undefined) {
                try { val = eng.hfInstance.getCellValue({ sheet: sheetId, col: c, row: r }); } catch (e) { val = ''; }
            }
            if (val !== '' && val !== null && val !== undefined) rowHasContent = true;
            rowVals.push(val !== null && val !== undefined ? String(val).replace(/"/g, '""') : '');
        }
        if (rowHasContent) rows.push(rowVals.map(v => `"${v}"`).join(','));
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${sheet.name}.csv`);
}

function exportarExcel() {
    if (typeof XLSX === 'undefined') {
        alert('Para exportar a Excel (.xlsx) agrega la librería SheetJS al HTML:\n<script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>\nMientras tanto puedes usar "CSV".');
        return;
    }
    const eng = spreadsheetEngine;
    const wb = XLSX.utils.book_new();
    eng.sheets.forEach(sheet => {
        const sheetId = eng.sheetIdMap ? eng.sheetIdMap[sheet.name] : null;
        const aoa = [];
        for (let r = 0; r < eng.options.rowCount; r++) {
            const rowVals = [];
            for (let c = 0; c < eng.options.colCount; c++) {
                let val = '';
                if (eng.hfInstance && sheetId !== undefined) {
                    try { val = eng.hfInstance.getCellValue({ sheet: sheetId, col: c, row: r }); } catch (e) { val = ''; }
                }
                rowVals.push(val !== null && val !== undefined ? val : '');
            }
            aoa.push(rowVals);
        }
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });
    XLSX.writeFile(wb, `${document.getElementById('current-project-name').textContent || 'proyecto'}.xlsx`);
}

function exportarProyectoEduConta() {
    if (!spreadsheetEngine) return;
    const payload = {
        version: 1,
        name: document.getElementById('current-project-name').textContent,
        sheets: spreadsheetEngine.sheets,
        options: { rowCount: spreadsheetEngine.options.rowCount, colCount: spreadsheetEngine.options.colCount },
    };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    downloadBlob(blob, `${payload.name || 'proyecto'}.edc`);
    markSaved();
}

async function importarArchivoSpreadsheet(inputOrFile) {
    let file = null;
    if (inputOrFile instanceof File || inputOrFile instanceof Blob) {
        file = inputOrFile;
    } else if (inputOrFile && inputOrFile.target && inputOrFile.target.files) {
        file = inputOrFile.target.files[0];
    }
    if (!file || !spreadsheetEngine) return;

    // Reset input file si provino de un evento
    if (inputOrFile && inputOrFile.target) {
        inputOrFile.target.value = '';
    }

    const indicator = document.getElementById('save-indicator');
    if (indicator) {
        indicator.innerHTML = '<i class="fas fa-spinner fa-spin text-amber-500 text-xs"></i> <span>IMPORTANDO...</span>';
    }

    try {
        let payload;
        if (typeof EduContaExcelImporter !== 'undefined') {
            payload = await EduContaExcelImporter.parseSpreadsheetFile(file);
        } else {
            throw new Error("El módulo EduContaExcelImporter no se encuentra cargado.");
        }

        if (!payload || !payload.sheets || payload.sheets.length === 0) {
            throw new Error("No se encontraron hojas válidas en el archivo importado.");
        }

        spreadsheetEngine.sheets = payload.sheets;
        spreadsheetEngine.activeSheetIndex = 0;
        spreadsheetEngine.options.rowCount = (payload.options && payload.options.rowCount) || 100;
        spreadsheetEngine.options.colCount = (payload.options && payload.options.colCount) || 26;
        spreadsheetEngine.activeRow = 0;
        spreadsheetEngine.activeCol = 0;
        spreadsheetEngine.selectStartRow = spreadsheetEngine.selectEndRow = 0;
        spreadsheetEngine.selectStartCol = spreadsheetEngine.selectEndCol = 0;

        // Reconstruir motor de fórmulas HyperFormula con los datos importados
        spreadsheetEngine.rebuildHyperFormula();
        spreadsheetEngine.render();

        const cleanName = payload.name || file.name.replace(/\.[^/.]+$/, "").trim() || 'Hoja de Cálculo';
        const projNameEl = document.getElementById('current-project-name');
        if (projNameEl) projNameEl.textContent = cleanName;
        document.title = `${cleanName} | EduConta SV`;

        if (typeof proyecto_actual !== 'undefined' && proyecto_actual) {
            proyecto_actual.name = cleanName;
            proyecto_actual.data = payload.sheets;
            proyecto_actual.updatedAt = new Date().toISOString();
        }

        // Guardado inmediato en persistencia local y sincronización
        await saveSpreadsheetManual();

    } catch (err) {
        console.error('Error al importar archivo en el editor:', err);
        if (typeof showImportErrorModal === 'function') {
            showImportErrorModal({
                file: file,
                error: err,
                stage: 'Importación directa en el Editor de Hojas de Cálculo',
                customMessage: err.message || 'Ocurrió un error al procesar el archivo en la hoja de cálculo.'
            });
        } else {
            alert('Error al importar archivo: ' + err.message);
        }
        markUnsavedChanges();
    }
}

// Alias de retrocompatibilidad
function importarProyectoEduConta(event) {
    return importarArchivoSpreadsheet(event);
}

// --- Drag & Drop directo de archivos Excel/CSV/.edc en la ventana del editor ---
(function() {
    window.addEventListener('dragover', (e) => {
        if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
            e.preventDefault();
        }
    });

    window.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const ext = (file.name.split('.').pop() || '').toLowerCase();
            if (['xlsx', 'xls', 'csv', 'ods', 'tsv', 'edc'].includes(ext)) {
                e.preventDefault();
                importarArchivoSpreadsheet(file);
            }
        }
    });
})();

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// === GUARDAR PERSISTENCIA (LocalStorage + Supabase) ===
async function saveSpreadsheetManual(isManual = true) {
    if (!spreadsheetEngine || !proyecto_actual || window.isAuditMode) return;

    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }

    // Si el usuario está escribiendo en una celda, confirmar la edición para capturar el valor
    if (spreadsheetEngine.isEditing) {
        spreadsheetEngine.commitInlineEditing();
    }

    const btn = document.getElementById('btn-save-canvas');
    const icon = document.getElementById('btn-save-icon') || (btn ? btn.querySelector('i') : null);
    
    if (icon && isManual) {
        icon.className = 'fas fa-spinner fa-spin text-xs';
    }
    if (btn && isManual) btn.disabled = true;

    const indicator = document.getElementById('save-indicator');
    if (indicator && !isManual) {
        indicator.innerHTML = '<i class="fas fa-spinner fa-spin text-amber-500 text-xs"></i> <span>GUARDANDO...</span>';
    }

    try {
        proyecto_actual.data = spreadsheetEngine.sheets;
        proyecto_actual.updatedAt = new Date().toISOString();

        const storageKey = typeof getProjectsStorageKey === 'function' ? getProjectsStorageKey('calculo') : 'educonta_projects_calculo';
        let localProjects = JSON.parse(localStorage.getItem(storageKey)) || [];
        const idx = localProjects.findIndex(p => p.id === proyecto_actual.id);
        if (idx !== -1) {
            localProjects[idx] = proyecto_actual;
        } else {
            localProjects.unshift(proyecto_actual);
        }
        localStorage.setItem(storageKey, JSON.stringify(localProjects));
        localStorage.setItem('educonta_last_project_id', proyecto_actual.id);

        if (!navigator.onLine) {
            updateSyncUI('offline');
            if (isManual && typeof showSyncToast === 'function') showSyncToast('offline');
        } else if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session) {
                    updateSyncUI('syncing');

                    if (typeof window.syncCurrentProjectWithSupabase === 'function') {
                        await window.syncCurrentProjectWithSupabase(proyecto_actual, session.user.id, true);
                    }
                    updateSyncUI('success');
                    if (isManual && typeof showSyncToast === 'function') showSyncToast('success', 'Hoja de cálculo respaldada');
                } else {
                    updateSyncUI('local');
                    if (isManual && typeof showSyncToast === 'function') showSyncToast('local', 'Guardado en este equipo');
                }
            } catch (e) {
                console.error("Error al sincronizar con Supabase:", e);
                const errMsg = e.message || String(e);
                updateSyncUI('error', errMsg);
                if (isManual && typeof showSyncToast === 'function') showSyncToast('error', errMsg);
            }
        } else {
            if (isManual && typeof showSyncToast === 'function') showSyncToast('local', 'Guardado en este equipo');
        }

        markSaved();

        if (icon && isManual) {
            icon.className = 'fas fa-check text-xs text-emerald-300';
        }
        if (btn && isManual) {
            btn.classList.add('bg-emerald-600', 'text-white');
        }
    } catch (err) {
        console.error("Error al guardar estado de la hoja:", err);
        if (icon && isManual) {
            icon.className = 'fas fa-exclamation-triangle text-xs text-rose-400';
        }
    } finally {
        if (isManual) {
            setTimeout(() => {
                if (icon) {
                    icon.className = 'fas fa-cloud text-xs transition-transform';
                }
                if (btn) {
                    btn.disabled = false;
                    btn.classList.remove('bg-emerald-600');
                }
            }, 1200);
        }
    }
}

window.forceSave = function(quiet = false) {
    return saveSpreadsheetManual(!quiet);
};

window.saveSpreadsheetState = function() {
    return saveSpreadsheetManual(false);
};

// Atajo de teclado para Guardar Manual (Ctrl+S / Cmd+S)
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
        e.preventDefault();
        saveSpreadsheetManual(true);
    }
});

// Guardado automático y seguro ante cierre o cambio de pestaña
window.addEventListener('beforeunload', () => {
    flushSaveSync();
});

window.addEventListener('pagehide', () => {
    flushSaveSync();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        flushSaveSync();
    }
});

function closeProject() {
    flushSaveSync();
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'documentos.html';
    }
}

// === MENÚ DESPLEGABLE DE EXPORTACIÓN Y ARCHIVO ===
function toggleExportMenu(event) {
    if (event) {
        event.stopPropagation();
    }
    const menu = document.getElementById('export-dropdown-menu');
    const btn = document.getElementById('btn-export-dropdown');
    const chevron = document.getElementById('export-chevron');
    if (!menu || !btn) return;

    // Asegurar que el menú esté adjunto a document.body para evitar que backdrop-filter altere las coordenadas
    if (menu.parentElement !== document.body) {
        document.body.appendChild(menu);
    }

    const isHidden = menu.classList.contains('hidden');
    if (isHidden) {
        const rect = btn.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${Math.max(8, rect.left)}px`;
        menu.style.zIndex = '999999';
        menu.classList.remove('hidden');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
        
        requestAnimationFrame(() => {
            menu.classList.remove('opacity-0', 'scale-95');
            menu.classList.add('opacity-100', 'scale-100');
        });
    } else {
        closeExportMenu();
    }
}

function closeExportMenu() {
    const menu = document.getElementById('export-dropdown-menu');
    const chevron = document.getElementById('export-chevron');
    if (chevron) chevron.style.transform = 'rotate(0deg)';
    
    if (menu && !menu.classList.contains('hidden')) {
        menu.classList.remove('opacity-100', 'scale-100');
        menu.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            menu.classList.add('hidden');
        }, 150);
    }
}

// Cerrar inmediatamente con cualquier mousedown o touchstart fuera del menú o modal morphing
document.addEventListener('mousedown', (event) => {
    // Cerrar menú exportar
    const menu = document.getElementById('export-dropdown-menu');
    const btn = document.getElementById('btn-export-dropdown');
    if (menu && !menu.classList.contains('hidden')) {
        if (!menu.contains(event.target) && !btn.contains(event.target)) {
            closeExportMenu();
        }
    }

    // Cerrar menú formato
    const formatMenu = document.getElementById('format-dropdown-menu');
    const btnFormat = document.getElementById('btn-format-dropdown');
    if (formatMenu && !formatMenu.classList.contains('hidden')) {
        if (!formatMenu.contains(event.target) && (!btnFormat || !btnFormat.contains(event.target))) {
            closeFormatDropdown();
        }
    }

    // Cerrar selector de colores
    const colorPopover = document.getElementById('popover-color-picker');
    const btnColorText = document.getElementById('btn-tool-text-color');
    const btnColorBg = document.getElementById('btn-tool-bg-color');
    if (colorPopover && !colorPopover.classList.contains('hidden')) {
        if (!colorPopover.contains(event.target) && (!btnColorText || !btnColorText.contains(event.target)) && (!btnColorBg || !btnColorBg.contains(event.target))) {
            closeColorPickers();
        }
    }

    // Cerrar selector de bordes
    const borderPopover = document.getElementById('popover-border-picker');
    const btnBorder = document.getElementById('btn-tool-borders');
    if (borderPopover && !borderPopover.classList.contains('hidden')) {
        if (!borderPopover.contains(event.target) && (!btnBorder || !btnBorder.contains(event.target))) {
            closeBorderPicker();
        }
    }

    // Cerrar selector de estilos de tabla
    const tableStylePopover = document.getElementById('table-style-picker-popover');
    const btnTableStyle = document.getElementById('btn-tool-table');
    if (tableStylePopover && !tableStylePopover.classList.contains('hidden')) {
        if (!tableStylePopover.contains(event.target) && (!btnTableStyle || !btnTableStyle.contains(event.target))) {
            closeTableStylePopover();
        }
    }

    // Cerrar filtro de tabla
    const tableFilterPopover = document.getElementById('popover-table-filter');
    if (tableFilterPopover && !tableFilterPopover.classList.contains('hidden')) {
        if (!tableFilterPopover.contains(event.target) && !event.target.closest('.table-filter-btn')) {
            closeTableFilterPopover();
        }
    }

    // Cerrar total de tabla
    const tableTotalPopover = document.getElementById('popover-table-total');
    if (tableTotalPopover && !tableTotalPopover.classList.contains('hidden')) {
        if (!tableTotalPopover.contains(event.target) && !event.target.closest('.table-total-btn')) {
            closeTableTotalPopover();
        }
    }

    // Cerrar modal morphing de renombrar (descartando cambios)
    const morphCard = document.getElementById('morph-rename-card');
    const badge = document.getElementById('current-project-badge');
    if (morphCard && !morphCard.classList.contains('hidden')) {
        if (!morphCard.contains(event.target) && (!badge || !badge.contains(event.target))) {
            closeMorphRenameModal(false);
        }
    }

    // Cerrar menú de opciones de viñeta de hojas si se hace clic fuera
    const sheetTabMenu = document.getElementById('educonta-sheet-tab-menu');
    if (sheetTabMenu && !sheetTabMenu.classList.contains('hidden')) {
        if (!sheetTabMenu.contains(event.target) && !event.target.closest('.sheet-tab-item')) {
            if (spreadsheetEngine && typeof spreadsheetEngine.closeSheetTabMenu === 'function') {
                spreadsheetEngine.closeSheetTabMenu();
            }
        }
    }
}, true);

document.addEventListener('touchstart', (event) => {
    const menu = document.getElementById('export-dropdown-menu');
    const btn = document.getElementById('btn-export-dropdown');
    if (menu && !menu.classList.contains('hidden')) {
        if (!menu.contains(event.target) && !btn.contains(event.target)) {
            closeExportMenu();
        }
    }

    const formatMenu = document.getElementById('format-dropdown-menu');
    const btnFormat = document.getElementById('btn-format-dropdown');
    if (formatMenu && !formatMenu.classList.contains('hidden')) {
        if (!formatMenu.contains(event.target) && (!btnFormat || !btnFormat.contains(event.target))) {
            closeFormatDropdown();
        }
    }

    const colorPopover = document.getElementById('popover-color-picker');
    const btnColorText = document.getElementById('btn-tool-text-color');
    const btnColorBg = document.getElementById('btn-tool-bg-color');
    if (colorPopover && !colorPopover.classList.contains('hidden')) {
        if (!colorPopover.contains(event.target) && (!btnColorText || !btnColorText.contains(event.target)) && (!btnColorBg || !btnColorBg.contains(event.target))) {
            closeColorPickers();
        }
    }

    const borderPopover = document.getElementById('popover-border-picker');
    const btnBorder = document.getElementById('btn-tool-borders');
    if (borderPopover && !borderPopover.classList.contains('hidden')) {
        if (!borderPopover.contains(event.target) && (!btnBorder || !btnBorder.contains(event.target))) {
            closeBorderPicker();
        }
    }

    const tableStylePopover = document.getElementById('table-style-picker-popover');
    const btnTableStyle = document.getElementById('btn-tool-table');
    if (tableStylePopover && !tableStylePopover.classList.contains('hidden')) {
        if (!tableStylePopover.contains(event.target) && (!btnTableStyle || !btnTableStyle.contains(event.target))) {
            closeTableStylePopover();
        }
    }

    const tableFilterPopover = document.getElementById('popover-table-filter');
    if (tableFilterPopover && !tableFilterPopover.classList.contains('hidden')) {
        if (!tableFilterPopover.contains(event.target) && !event.target.closest('.table-filter-btn')) {
            closeTableFilterPopover();
        }
    }

    const tableTotalPopover = document.getElementById('popover-table-total');
    if (tableTotalPopover && !tableTotalPopover.classList.contains('hidden')) {
        if (!tableTotalPopover.contains(event.target) && !event.target.closest('.table-total-btn')) {
            closeTableTotalPopover();
        }
    }

    const morphCard = document.getElementById('morph-rename-card');
    const badge = document.getElementById('current-project-badge');
    if (morphCard && !morphCard.classList.contains('hidden')) {
        if (!morphCard.contains(event.target) && (!badge || !badge.contains(event.target))) {
            closeMorphRenameModal(false);
        }
    }

    const sheetTabMenu = document.getElementById('educonta-sheet-tab-menu');
    if (sheetTabMenu && !sheetTabMenu.classList.contains('hidden')) {
        if (!sheetTabMenu.contains(event.target) && !event.target.closest('.sheet-tab-item')) {
            if (spreadsheetEngine && typeof spreadsheetEngine.closeSheetTabMenu === 'function') {
                spreadsheetEngine.closeSheetTabMenu();
            }
        }
    }
}, true);

window.addEventListener('resize', () => {
    closeExportMenu();
    closeMorphRenameModal(false);
    closeColorPickers();
    closeBorderPicker();
    closeTableStylePopover();
    closeTableFilterPopover();
    closeTableTotalPopover();
    if (spreadsheetEngine && typeof spreadsheetEngine.closeSheetTabMenu === 'function') {
        spreadsheetEngine.closeSheetTabMenu();
    }
});

let scrollCloseTimer = null;
window.addEventListener('scroll', () => {
    if (!scrollCloseTimer) {
        scrollCloseTimer = setTimeout(() => {
            scrollCloseTimer = null;
            closeExportMenu();
            closeMorphRenameModal(false);
            closeColorPickers();
            closeBorderPicker();
            closeTableStylePopover();
            closeTableFilterPopover();
            closeTableTotalPopover();
            if (spreadsheetEngine && typeof spreadsheetEngine.closeSheetTabMenu === 'function') {
                spreadsheetEngine.closeSheetTabMenu();
            }
        }, 120);
    }
}, { capture: true, passive: true });

// =========================================================================
// === CONTROLADOR DEL MODAL DE FORMATO DE CELDAS AVANZADO (GLASSMORPHIC) ===
// =========================================================================

let modalFormatState = {
    activeTab: 'number',
    numberCategory: 'general',
    decimals: 2,
    negatives: 'minus',
    special: 'nit',
    dateStyle: 'date_dmy',
    alignH: '',
    alignV: 'middle',
    wrap: false,
    indent: 0,
    fontFamily: 'Plus Jakarta Sans',
    fontStyle: 'normal',
    fontSize: 10,
    underline: false,
    strikethrough: false,
    fontColor: '#0f172a',
    borderPreset: 'none',
    borderColor: '#64748b',
    fillColor: null
};

const EDUCONTA_PALETTE_FILLS = [
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#0f172a',
    '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#78350f',
    '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d',
    '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985',
    '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#312e81',
    '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d'
];

function initFormatFillPalette() {
    const container = document.getElementById('fmt-fill-palette');
    if (!container || container.children.length > 0) return;

    container.innerHTML = EDUCONTA_PALETTE_FILLS.map(hex => `
        <button type="button" onclick="setModalFillColor('${hex}')" class="w-6 h-6 rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm hover:scale-110 transition-transform" style="background-color: ${hex};" title="${hex}"></button>
    `).join('');
}

let currentFormatTabIndex = 0;
const FORMAT_TABS_LIST = ['number', 'align', 'font', 'border', 'fill'];

function openCellFormatModal(initialTab = 'number') {
    const modal = document.getElementById('modal-cell-format');
    if (!modal) return;

    initFormatFillPalette();

    const initialIdx = FORMAT_TABS_LIST.indexOf(initialTab);
    currentFormatTabIndex = initialIdx >= 0 ? initialIdx : 0;
    const activeTab = FORMAT_TABS_LIST[currentFormatTabIndex];
    modalFormatState.activeTab = activeTab;

    // Sincronizar botones de pestañas y paneles
    FORMAT_TABS_LIST.forEach((t, i) => {
        const btn = document.getElementById(`tab-btn-${t}`);
        const panel = document.getElementById(`format-panel-${t}`);
        if (btn) {
            if (t === activeTab) {
                btn.className = 'format-tab-btn active px-4 py-2 rounded-2xl text-xs font-black transition-all duration-300 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 ring-1 ring-amber-400/40';
            } else {
                btn.className = 'format-tab-btn px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-500/10';
            }
        }
        if (panel) {
            if (t === activeTab) {
                panel.style.position = 'relative';
                panel.style.top = 'auto';
                panel.style.left = 'auto';
                panel.style.right = 'auto';
                panel.style.transform = 'translateX(0%)';
                panel.style.opacity = '1';
                panel.style.pointerEvents = 'auto';
            } else {
                panel.style.position = 'absolute';
                panel.style.top = '12px';
                panel.style.left = '24px';
                panel.style.right = '24px';
                panel.style.transform = i < currentFormatTabIndex ? 'translateX(-100%)' : 'translateX(100%)';
                panel.style.opacity = '0';
                panel.style.pointerEvents = 'none';
            }
        }
    });

    // Detectar si la selección abarca una columna completa
    const isFullCol = spreadsheetEngine && (spreadsheetEngine.selectStartRow === 0 && spreadsheetEngine.selectEndRow === spreadsheetEngine.options.rowCount - 1);
    const colName = (isFullCol && spreadsheetEngine) ? spreadsheetEngine.getColName(spreadsheetEngine.selectStartCol) : '';
    const modalTitle = document.querySelector('#modal-cell-format h3');
    const modalSub = document.querySelector('#modal-cell-format p');
    if (modalTitle) {
        modalTitle.textContent = isFullCol ? `Formato de Columna ${colName}` : 'Formato de Celdas';
    }
    if (modalSub) {
        modalSub.textContent = isFullCol ? `Configuración de toda la columna ${colName}: tipográfica, contable y visual` : 'Configuración tipográfica, contable y visual';
    }

    // Leer valores de la celda activa o predeterminados de la columna si existe
    if (spreadsheetEngine) {
        const sheet = spreadsheetEngine.sheets[spreadsheetEngine.activeSheetIndex];
        const cell = sheet && sheet.data ? (sheet.data[`${spreadsheetEngine.activeRow}_${spreadsheetEngine.activeCol}`] || {}) : {};
        const colFmt = (sheet && sheet.colFormats) ? sheet.colFormats[spreadsheetEngine.activeCol] : null;
        const effective = Object.assign({}, colFmt || {}, cell || {});

        const rawFmt = effective.fmt || 'general';
        if (['usd', 'accounting'].includes(rawFmt)) modalFormatState.numberCategory = 'usd';
        else if (['number', 'decimal'].includes(rawFmt)) modalFormatState.numberCategory = 'number';
        else if (rawFmt === 'percent') modalFormatState.numberCategory = 'percent';
        else if (['date_dmy', 'date_long', 'date'].includes(rawFmt)) modalFormatState.numberCategory = 'date';
        else if (['time', 'time_24h', 'time_12h'].includes(rawFmt)) modalFormatState.numberCategory = 'time';
        else if (['nit', 'dui', 'nrc', 'factura'].includes(rawFmt)) modalFormatState.numberCategory = 'special_sv';
        else if (rawFmt === 'text') modalFormatState.numberCategory = 'text';
        else modalFormatState.numberCategory = 'general';

        modalFormatState.decimals = effective.fmtDecimals !== undefined ? effective.fmtDecimals : 2;
        modalFormatState.negatives = effective.fmtNegatives || 'minus';
        modalFormatState.special = (['nit', 'dui', 'nrc', 'factura'].includes(rawFmt)) ? rawFmt : 'nit';
        modalFormatState.dateStyle = (rawFmt === 'date_long') ? 'date_long' : 'date_dmy';
        modalFormatState.timeStyle = (rawFmt === 'time_12h') ? 'time_12h' : 'time_24h';

        modalFormatState.alignH = effective.align || '';
        modalFormatState.alignV = effective.valign || 'middle';
        modalFormatState.wrap = !!effective.wrap;
        modalFormatState.indent = effective.indent || 0;

        modalFormatState.fontFamily = effective.font || 'Plus Jakarta Sans';
        if (effective.bold && effective.italic) modalFormatState.fontStyle = 'bold_italic';
        else if (effective.bold) modalFormatState.fontStyle = 'bold';
        else if (effective.italic) modalFormatState.fontStyle = 'italic';
        else modalFormatState.fontStyle = 'normal';

        modalFormatState.fontSize = effective.size || 10;
        modalFormatState.underline = !!effective.underline;
        modalFormatState.strikethrough = !!effective.strikethrough;
        modalFormatState.fontColor = effective.color || '#0f172a';

        modalFormatState.borderPreset = effective.border || 'none';
        modalFormatState.borderColor = effective.borderColor || '#64748b';
        modalFormatState.fillColor = effective.bgcolor || null;
    }

    // Sincronizar inputs del formulario
    const decInput = document.getElementById('fmt-input-decimals');
    if (decInput) decInput.value = modalFormatState.decimals;

    const negRadios = document.getElementsByName('fmt-negative');
    negRadios.forEach(r => { r.checked = (r.value === modalFormatState.negatives); });

    const specRadios = document.getElementsByName('fmt-special');
    specRadios.forEach(r => { r.checked = (r.value === modalFormatState.special); });

    const dateRadios = document.getElementsByName('fmt-date-style');
    dateRadios.forEach(r => { r.checked = (r.value === modalFormatState.dateStyle); });

    const timeRadios = document.getElementsByName('fmt-time-style');
    timeRadios.forEach(r => { r.checked = (r.value === modalFormatState.timeStyle); });

    const alignH = document.getElementById('fmt-align-h');
    if (alignH) alignH.value = modalFormatState.alignH;

    const alignV = document.getElementById('fmt-align-v');
    if (alignV) alignV.value = modalFormatState.alignV;

    const chkWrap = document.getElementById('fmt-chk-wrap');
    if (chkWrap) chkWrap.checked = modalFormatState.wrap;

    const indentInput = document.getElementById('fmt-input-indent');
    if (indentInput) indentInput.value = modalFormatState.indent;

    const fontFamily = document.getElementById('fmt-font-family');
    if (fontFamily) fontFamily.value = modalFormatState.fontFamily;

    const fontStyle = document.getElementById('fmt-font-style');
    if (fontStyle) fontStyle.value = modalFormatState.fontStyle;

    const fontSize = document.getElementById('fmt-font-size');
    if (fontSize) fontSize.value = modalFormatState.fontSize;

    const chkUnderline = document.getElementById('fmt-chk-underline');
    if (chkUnderline) chkUnderline.checked = modalFormatState.underline;

    const chkStrike = document.getElementById('fmt-chk-strike');
    if (chkStrike) chkStrike.checked = modalFormatState.strikethrough;

    const fontColor = document.getElementById('fmt-font-color');
    if (fontColor) fontColor.value = modalFormatState.fontColor.startsWith('#') ? modalFormatState.fontColor : '#0f172a';

    const fontColorLbl = document.getElementById('fmt-font-color-label');
    if (fontColorLbl) fontColorLbl.textContent = modalFormatState.fontColor;

    const borderColor = document.getElementById('fmt-border-color');
    if (borderColor) borderColor.value = modalFormatState.borderColor.startsWith('#') ? modalFormatState.borderColor : '#64748b';

    const borderColorLbl = document.getElementById('fmt-border-color-label');
    if (borderColorLbl) borderColorLbl.textContent = modalFormatState.borderColor;

    const fillColor = document.getElementById('fmt-fill-color');
    if (fillColor) fillColor.value = modalFormatState.fillColor || '#ffffff';

    selectNumberCategory(modalFormatState.numberCategory);
    updateCellFormatPreview();

    modal.classList.remove('closing');
    modal.style.display = 'flex';
}

let formatTabSwitchTimer = null;

function closeCellFormatModal() {
    const modal = document.getElementById('modal-cell-format');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
        }, 280);
    }
}

function switchCellFormatTab(tabName) {
    const newIndex = FORMAT_TABS_LIST.indexOf(tabName);
    if (newIndex === -1) return;

    const prevIndex = currentFormatTabIndex;
    currentFormatTabIndex = newIndex;
    modalFormatState.activeTab = tabName;

    // Actualizar botones de pestaña
    FORMAT_TABS_LIST.forEach((t) => {
        const btn = document.getElementById(`tab-btn-${t}`);
        if (btn) {
            if (t === tabName) {
                btn.className = 'format-tab-btn active px-4 py-2 rounded-2xl text-xs font-black transition-all duration-300 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 ring-1 ring-amber-400/40';
            } else {
                btn.className = 'format-tab-btn px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-500/10';
            }
        }
    });

    if (newIndex === prevIndex) {
        updateCellFormatPreview();
        return;
    }

    const isForward = newIndex > prevIndex;
    const oldPanelName = FORMAT_TABS_LIST[prevIndex];
    const oldPanel = document.getElementById(`format-panel-${oldPanelName}`);
    const newPanel = document.getElementById(`format-panel-${tabName}`);

    // Animación de desplazamiento idéntica al selector de color
    if (oldPanel) {
        oldPanel.style.position = 'absolute';
        oldPanel.style.top = '12px';
        oldPanel.style.left = '24px';
        oldPanel.style.right = '24px';
        oldPanel.style.transform = isForward ? 'translateX(-100%)' : 'translateX(100%)';
        oldPanel.style.opacity = '0';
        oldPanel.style.pointerEvents = 'none';
    }

    if (newPanel) {
        newPanel.style.position = 'relative';
        newPanel.style.top = 'auto';
        newPanel.style.left = 'auto';
        newPanel.style.right = 'auto';
        newPanel.style.transform = 'translateX(0%)';
        newPanel.style.opacity = '1';
        newPanel.style.pointerEvents = 'auto';
    }

    updateCellFormatPreview();
}

function selectNumberCategory(cat) {
    modalFormatState.numberCategory = cat;

    const catButtons = document.querySelectorAll('#format-number-categories .fmt-cat-btn');
    catButtons.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick') || '';
        if (onclickAttr.includes(`'${cat}'`)) {
            btn.className = 'fmt-cat-btn active w-full px-3.5 py-2 text-left text-xs font-black rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/10 transition-all';
        } else {
            btn.className = 'fmt-cat-btn w-full px-3.5 py-2 text-left text-xs font-bold rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-500 dark:hover:bg-amber-500/15 dark:hover:text-amber-400 transition-all border border-transparent';
        }
    });

    const decContainer = document.getElementById('fmt-opt-decimals-container');
    const negContainer = document.getElementById('fmt-opt-negatives-container');
    const specContainer = document.getElementById('fmt-opt-special-container');
    const dateContainer = document.getElementById('fmt-opt-date-container');
    const timeContainer = document.getElementById('fmt-opt-time-container');

    if (['usd', 'number', 'percent'].includes(cat)) {
        if (decContainer) decContainer.classList.remove('hidden');
    } else {
        if (decContainer) decContainer.classList.add('hidden');
    }

    if (['usd', 'number'].includes(cat)) {
        if (negContainer) negContainer.classList.remove('hidden');
    } else {
        if (negContainer) negContainer.classList.add('hidden');
    }

    if (cat === 'special_sv') {
        if (specContainer) specContainer.classList.remove('hidden');
    } else {
        if (specContainer) specContainer.classList.add('hidden');
    }

    if (cat === 'date') {
        if (dateContainer) dateContainer.classList.remove('hidden');
    } else {
        if (dateContainer) dateContainer.classList.add('hidden');
    }

    if (cat === 'time') {
        if (timeContainer) timeContainer.classList.remove('hidden');
    } else {
        if (timeContainer) timeContainer.classList.add('hidden');
    }

    updateCellFormatPreview();
}

function setModalBorderPreset(preset) {
    modalFormatState.borderPreset = preset;
    const borderButtons = document.querySelectorAll('#format-panel-border .fmt-border-btn');
    borderButtons.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick') || '';
        if (onclickAttr.includes(`'${preset}'`)) {
            btn.className = 'fmt-border-btn active px-3 py-2.5 rounded-2xl border border-amber-500 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center gap-2 transition-all shadow-sm';
        } else {
            btn.className = 'fmt-border-btn px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-500/15 hover:text-amber-500 text-xs font-bold flex items-center gap-2 transition-all shadow-sm';
        }
    });
    updateCellFormatPreview();
}

function setModalBorderColor(hex) {
    modalFormatState.borderColor = hex;
    const input = document.getElementById('fmt-border-color');
    const lbl = document.getElementById('fmt-border-color-label');
    if (input) input.value = hex;
    if (lbl) lbl.textContent = hex;
    updateCellFormatPreview();
}

function setModalFillColor(hex) {
    modalFormatState.fillColor = hex;
    const input = document.getElementById('fmt-fill-color');
    if (input) input.value = hex;
    updateCellFormatPreview();
}

function clearModalFillColor() {
    modalFormatState.fillColor = null;
    updateCellFormatPreview();
}

function resetCellFormatModal() {
    modalFormatState = {
        activeTab: 'number',
        numberCategory: 'general',
        decimals: 2,
        negatives: 'minus',
        special: 'nit',
        dateStyle: 'date_dmy',
        timeStyle: 'time_24h',
        alignH: '',
        alignV: 'middle',
        wrap: false,
        indent: 0,
        fontFamily: 'Plus Jakarta Sans',
        fontStyle: 'normal',
        fontSize: 10,
        underline: false,
        strikethrough: false,
        fontColor: '#0f172a',
        borderPreset: 'none',
        borderColor: '#64748b',
        fillColor: null
    };
    openCellFormatModal('number');
}

function updateCellFormatPreview() {
    const sampleBox = document.getElementById('fmt-sample-box');
    if (!sampleBox) return;

    // Leer estado de los controles
    const decInput = document.getElementById('fmt-input-decimals');
    const decimals = decInput ? parseInt(decInput.value, 10) : 2;

    const negSelected = document.querySelector('input[name="fmt-negative"]:checked');
    const negatives = negSelected ? negSelected.value : 'minus';

    const specSelected = document.querySelector('input[name="fmt-special"]:checked');
    const special = specSelected ? specSelected.value : 'nit';

    const dateSelected = document.querySelector('input[name="fmt-date-style"]:checked');
    const dateStyle = dateSelected ? dateSelected.value : 'date_dmy';

    const timeSelected = document.querySelector('input[name="fmt-time-style"]:checked');
    const timeStyle = timeSelected ? timeSelected.value : 'time_24h';

    const alignH = document.getElementById('fmt-align-h') ? document.getElementById('fmt-align-h').value : '';
    const alignV = document.getElementById('fmt-align-v') ? document.getElementById('fmt-align-v').value : 'middle';
    const wrap = document.getElementById('fmt-chk-wrap') ? document.getElementById('fmt-chk-wrap').checked : false;
    const indent = document.getElementById('fmt-input-indent') ? parseInt(document.getElementById('fmt-input-indent').value, 10) : 0;

    const fontFamily = document.getElementById('fmt-font-family') ? document.getElementById('fmt-font-family').value : 'Plus Jakarta Sans';
    const fontStyle = document.getElementById('fmt-font-style') ? document.getElementById('fmt-font-style').value : 'normal';
    const fontSize = document.getElementById('fmt-font-size') ? parseInt(document.getElementById('fmt-font-size').value, 10) : 10;
    const underline = document.getElementById('fmt-chk-underline') ? document.getElementById('fmt-chk-underline').checked : false;
    const strikethrough = document.getElementById('fmt-chk-strike') ? document.getElementById('fmt-chk-strike').checked : false;
    const fontColor = document.getElementById('fmt-font-color') ? document.getElementById('fmt-font-color').value : '#0f172a';

    const borderColor = document.getElementById('fmt-border-color') ? document.getElementById('fmt-border-color').value : '#64748b';
    const borderPreset = modalFormatState.borderPreset;
    const fillColor = modalFormatState.fillColor;

    // Texto de muestra según categoría
    let sampleHtml = '$1,250.00';
    const cat = modalFormatState.numberCategory;

    if (cat === 'general') {
        sampleHtml = 'EduConta SV 2026';
    } else if (cat === 'usd') {
        const val = 1250.5;
        const absVal = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        sampleHtml = `$${absVal}`;
    } else if (cat === 'number') {
        const val = 1250.5;
        sampleHtml = val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    } else if (cat === 'percent') {
        const val = 0.13;
        sampleHtml = (val * 100).toFixed(decimals) + '%';
    } else if (cat === 'date') {
        sampleHtml = (dateStyle === 'date_long') ? '15 de agosto de 2026' : '15/08/2026';
    } else if (cat === 'time') {
        sampleHtml = (timeStyle === 'time_12h') ? '02:30 PM' : '14:30:00';
    } else if (cat === 'special_sv') {
        if (special === 'nit') sampleHtml = '0614-120590-101-2';
        else if (special === 'dui') sampleHtml = '04567890-1';
        else if (special === 'nrc') sampleHtml = '234567-8';
        else if (special === 'factura') sampleHtml = 'N° 000125';
    } else if (cat === 'text') {
        sampleHtml = 'Texto sin formato';
    }

    // Aplicar estilos a la caja de muestra
    let sampleStyle = `font-family: '${fontFamily}', sans-serif; font-size: ${fontSize}pt; color: ${fontColor}; `;
    if (fontStyle.includes('bold')) sampleStyle += 'font-weight: bold; ';
    if (fontStyle.includes('italic')) sampleStyle += 'font-style: italic; ';

    let textDeco = [];
    if (underline) textDeco.push('underline');
    if (strikethrough) textDeco.push('line-through');
    if (textDeco.length > 0) sampleStyle += `text-decoration: ${textDeco.join(' ')}; `;

    if (alignH) sampleStyle += `text-align: ${alignH}; `;
    if (alignV) sampleStyle += `vertical-align: ${alignV}; `;
    if (indent > 0) sampleStyle += `padding-left: ${indent * 12}px; `;
    if (fillColor) sampleStyle += `background-color: ${fillColor}; `;

    if (borderPreset && borderPreset !== 'none') {
        if (borderPreset === 'all' || borderPreset === 'outer') sampleStyle += `border: 2px solid ${borderColor}; `;
        else if (borderPreset === 'accounting-double') sampleStyle += `border-bottom: 3px double ${borderColor}; `;
        else if (borderPreset === 'top-bottom-double') sampleStyle += `border-top: 1px solid ${borderColor}; border-bottom: 3px double ${borderColor}; `;
        else if (borderPreset === 'bottom-thick') sampleStyle += `border-bottom: 3px solid ${borderColor}; `;
    } else {
        sampleStyle += `border: 1px dashed rgba(148, 163, 184, 0.4); `;
    }

    sampleBox.setAttribute('style', sampleStyle);
    sampleBox.innerHTML = sampleHtml;
}

function applyCellFormatFromModal() {
    if (!spreadsheetEngine) {
        closeCellFormatModal();
        return;
    }

    const decInput = document.getElementById('fmt-input-decimals');
    const decimals = decInput ? parseInt(decInput.value, 10) : 2;

    const negSelected = document.querySelector('input[name="fmt-negative"]:checked');
    const negatives = negSelected ? negSelected.value : 'minus';

    const specSelected = document.querySelector('input[name="fmt-special"]:checked');
    const special = specSelected ? specSelected.value : 'nit';

    const dateSelected = document.querySelector('input[name="fmt-date-style"]:checked');
    const dateStyle = dateSelected ? dateSelected.value : 'date_dmy';

    const timeSelected = document.querySelector('input[name="fmt-time-style"]:checked');
    const timeStyle = timeSelected ? timeSelected.value : 'time_24h';

    const alignH = document.getElementById('fmt-align-h') ? document.getElementById('fmt-align-h').value : '';
    const alignV = document.getElementById('fmt-align-v') ? document.getElementById('fmt-align-v').value : 'middle';
    const wrap = document.getElementById('fmt-chk-wrap') ? document.getElementById('fmt-chk-wrap').checked : false;
    const indent = document.getElementById('fmt-input-indent') ? parseInt(document.getElementById('fmt-input-indent').value, 10) : 0;

    const fontFamily = document.getElementById('fmt-font-family') ? document.getElementById('fmt-font-family').value : 'Plus Jakarta Sans';
    const fontStyle = document.getElementById('fmt-font-style') ? document.getElementById('fmt-font-style').value : 'normal';
    const fontSize = document.getElementById('fmt-font-size') ? parseInt(document.getElementById('fmt-font-size').value, 10) : 10;
    const underline = document.getElementById('fmt-chk-underline') ? document.getElementById('fmt-chk-underline').checked : false;
    const strikethrough = document.getElementById('fmt-chk-strike') ? document.getElementById('fmt-chk-strike').checked : false;
    const fontColor = document.getElementById('fmt-font-color') ? document.getElementById('fmt-font-color').value : '#0f172a';

    const borderColor = document.getElementById('fmt-border-color') ? document.getElementById('fmt-border-color').value : '#64748b';
    const borderPreset = modalFormatState.borderPreset;
    const fillColor = modalFormatState.fillColor;

    let finalFmt = modalFormatState.numberCategory;
    if (finalFmt === 'special_sv') finalFmt = special;
    else if (finalFmt === 'date') finalFmt = dateStyle;
    else if (finalFmt === 'time') finalFmt = timeStyle;

    const formatConfig = {
        fmt: finalFmt === 'general' ? null : finalFmt,
        fmtDecimals: decimals,
        fmtNegatives: negatives,
        align: alignH || null,
        valign: alignV || null,
        wrap: wrap,
        indent: indent > 0 ? indent : null,
        font: fontFamily,
        bold: fontStyle.includes('bold'),
        italic: fontStyle.includes('italic'),
        size: fontSize,
        underline: underline,
        strikethrough: strikethrough,
        color: fontColor,
        border: borderPreset === 'none' ? null : borderPreset,
        borderColor: borderPreset === 'none' ? null : borderColor,
        bgcolor: fillColor
    };

    spreadsheetEngine.applyCompositeFormatToSelection(formatConfig);
    closeCellFormatModal();
    markUnsavedChanges();
}

window.openCellFormatModal = openCellFormatModal;
window.closeCellFormatModal = closeCellFormatModal;
window.switchCellFormatTab = switchCellFormatTab;
window.selectNumberCategory = selectNumberCategory;
window.setModalBorderPreset = setModalBorderPreset;
window.setModalBorderColor = setModalBorderColor;
window.setModalFillColor = setModalFillColor;
window.clearModalFillColor = clearModalFillColor;
window.resetCellFormatModal = resetCellFormatModal;
window.updateCellFormatPreview = updateCellFormatPreview;
window.applyCellFormatFromModal = applyCellFormatFromModal;
window.toggleFormatDropdown = toggleFormatDropdown;
window.closeFormatDropdown = closeFormatDropdown;
window.applyToolFormatDirect = applyToolFormatDirect;
window.adjustDecimals = adjustDecimals;
window.selectBorderOption = selectBorderOption;
window.setBorderColor = setBorderColor;
window.setBorderStyle = setBorderStyle;
window.toggleBorderPickerPopover = toggleBorderPickerPopover;
window.closeBorderPicker = closeBorderPicker;

// =========================================================================
// === CONTROLADORES DE MODALES DE AJUSTES DE VIÑETAS / HOJAS (GLASSMORPHIC) ===
// =========================================================================

let modalTargetSheetIndex = null;
let currentModalSheetColor = null;
let reorderSheetsTempList = [];

// --- 1. MODAL RENOMBRAR HOJA ---
function openSheetRenameModal(sheetIndex = null) {
    if (!spreadsheetEngine) return;
    const idx = (sheetIndex !== null && sheetIndex !== undefined) ? sheetIndex : spreadsheetEngine.activeSheetIndex;
    if (idx < 0 || idx >= spreadsheetEngine.sheets.length) return;
    modalTargetSheetIndex = idx;

    const modal = document.getElementById('modal-sheet-rename');
    const input = document.getElementById('modal-sheet-rename-input');
    const errEl = document.getElementById('modal-rename-error');
    if (!modal || !input) return;

    if (spreadsheetEngine && typeof spreadsheetEngine.closeSheetTabMenu === 'function') {
        spreadsheetEngine.closeSheetTabMenu();
    }

    const currentName = spreadsheetEngine.sheets[idx].name;
    input.value = currentName;
    updateRenameCounter(currentName);
    if (errEl) errEl.classList.add('hidden');

    modal.classList.remove('closing');
    modal.style.display = 'flex';
    setTimeout(() => {
        input.focus();
        input.select();
    }, 50);
}

function closeSheetRenameModal() {
    const modal = document.getElementById('modal-sheet-rename');
    if (!modal) return;
    modal.classList.add('closing');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
    }, 280);
    modalTargetSheetIndex = null;
}

function updateRenameCounter(val) {
    const counter = document.getElementById('modal-rename-counter');
    if (counter) counter.textContent = `${(val || '').length}/40`;
    const errEl = document.getElementById('modal-rename-error');
    if (errEl) errEl.classList.add('hidden');
}

function setRenameSuggestion(suggestionName) {
    const input = document.getElementById('modal-sheet-rename-input');
    if (input) {
        input.value = suggestionName;
        updateRenameCounter(suggestionName);
        input.focus();
    }
}

function handleSheetRenameKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        confirmSheetRename();
    } else if (event.key === 'Escape') {
        event.preventDefault();
        closeSheetRenameModal();
    }
}

function confirmSheetRename() {
    if (modalTargetSheetIndex === null || !spreadsheetEngine) return;
    const input = document.getElementById('modal-sheet-rename-input');
    const errEl = document.getElementById('modal-rename-error');
    const newName = (input ? input.value : '').trim();

    if (!newName) {
        if (errEl) {
            errEl.textContent = 'El nombre no puede estar vacío.';
            errEl.classList.remove('hidden');
        }
        return;
    }

    const duplicate = spreadsheetEngine.sheets.some((s, i) => i !== modalTargetSheetIndex && s.name.toLowerCase() === newName.toLowerCase());
    if (duplicate) {
        if (errEl) {
            errEl.textContent = `Ya existe una hoja llamada "${newName}".`;
            errEl.classList.remove('hidden');
        }
        return;
    }

    spreadsheetEngine.renameSheet(modalTargetSheetIndex, newName);
    closeSheetRenameModal();
}

// --- 2. MODAL COLOR DE VIÑETA ---
const EDUCONTA_SHEET_COLORS = [
    '#f59e0b', '#10b981', '#0ea5e9', '#6366f1', '#ec4899', '#8b5cf6', '#ef4444',
    '#64748b', '#f97316', '#84cc16', '#06b6d4', '#7c3aed', '#78350f', '#1e3a8a'
];

function initSheetColorsGrid() {
    const grid = document.getElementById('modal-sheet-colors-grid');
    if (!grid || grid.children.length > 0) return;

    grid.innerHTML = EDUCONTA_SHEET_COLORS.map(c => `
        <button type="button" onclick="selectSheetColorPreset('${c}')" class="w-8 h-8 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center group" style="background-color: ${c};" title="Color ${c}">
            <i class="fas fa-check text-white text-[10px] opacity-0 group-hover:opacity-40 transition-opacity"></i>
        </button>
    `).join('');
}

function openSheetColorModal(sheetIndex = null) {
    if (!spreadsheetEngine) return;
    const idx = (sheetIndex !== null && sheetIndex !== undefined) ? sheetIndex : spreadsheetEngine.activeSheetIndex;
    if (idx < 0 || idx >= spreadsheetEngine.sheets.length) return;
    modalTargetSheetIndex = idx;

    initSheetColorsGrid();

    if (spreadsheetEngine && typeof spreadsheetEngine.closeSheetTabMenu === 'function') {
        spreadsheetEngine.closeSheetTabMenu();
    }

    const sheet = spreadsheetEngine.sheets[idx];
    currentModalSheetColor = sheet.tabColor || '#f59e0b';

    const p1 = document.getElementById('preview-tab-name-1');
    const p2 = document.getElementById('preview-tab-name-2');
    if (p1) p1.textContent = sheet.name;
    if (p2) p2.textContent = sheet.name;

    previewSelectedSheetColor(currentModalSheetColor);

    const modal = document.getElementById('modal-sheet-color');
    if (!modal) return;
    modal.classList.remove('closing');
    modal.style.display = 'flex';
}

function closeSheetColorModal() {
    const modal = document.getElementById('modal-sheet-color');
    if (!modal) return;
    modal.classList.add('closing');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
    }, 280);
    modalTargetSheetIndex = null;
}

function selectSheetColorPreset(color) {
    currentModalSheetColor = color;
    const picker = document.getElementById('modal-sheet-color-picker');
    if (picker) picker.value = color;
    previewSelectedSheetColor(color);
}

function previewSelectedSheetColor(color) {
    currentModalSheetColor = color;
    const activePreview = document.getElementById('preview-tab-active');
    const inactiveDot = document.getElementById('preview-tab-dot');

    if (activePreview) {
        if (color) {
            activePreview.style.backgroundColor = color;
            activePreview.style.color = '#ffffff';
            activePreview.style.boxShadow = `0 4px 14px -2px ${color}80`;
        } else {
            activePreview.style.backgroundColor = '#f59e0b';
            activePreview.style.color = '#ffffff';
            activePreview.style.boxShadow = '';
        }
    }
    if (inactiveDot) {
        inactiveDot.style.backgroundColor = color || '#cbd5e1';
    }
}

async function pickSheetColorEyedropper() {
    if (!window.EyeDropper) {
        alert('La herramienta Cuentagotas no es compatible con este navegador.');
        return;
    }
    try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
            selectSheetColorPreset(result.sRGBHex);
        }
    } catch (e) {
        // Cancelado
    }
}

function removeSheetColorFromModal() {
    currentModalSheetColor = null;
    confirmSheetColor();
}

function confirmSheetColor() {
    if (modalTargetSheetIndex === null || !spreadsheetEngine) return;
    spreadsheetEngine.setSheetTabColor(modalTargetSheetIndex, currentModalSheetColor);
    closeSheetColorModal();
}

// --- 3. MODAL DUPLICAR HOJA ---
function openSheetDuplicateModal(sheetIndex = null) {
    if (!spreadsheetEngine) return;
    const idx = (sheetIndex !== null && sheetIndex !== undefined) ? sheetIndex : spreadsheetEngine.activeSheetIndex;
    if (idx < 0 || idx >= spreadsheetEngine.sheets.length) return;
    modalTargetSheetIndex = idx;

    if (spreadsheetEngine && typeof spreadsheetEngine.closeSheetTabMenu === 'function') {
        spreadsheetEngine.closeSheetTabMenu();
    }

    const sourceSheet = spreadsheetEngine.sheets[idx];
    let copyName = `${sourceSheet.name} (Copia)`;
    let counter = 2;
    while (spreadsheetEngine.sheets.some(s => s.name.toLowerCase() === copyName.toLowerCase())) {
        copyName = `${sourceSheet.name} (Copia ${counter})`;
        counter++;
    }

    const input = document.getElementById('modal-sheet-duplicate-input');
    if (input) input.value = copyName;

    const modal = document.getElementById('modal-sheet-duplicate');
    if (!modal) return;
    modal.classList.remove('closing');
    modal.style.display = 'flex';
    setTimeout(() => {
        if (input) { input.focus(); input.select(); }
    }, 50);
}

function closeSheetDuplicateModal() {
    const modal = document.getElementById('modal-sheet-duplicate');
    if (!modal) return;
    modal.classList.add('closing');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
    }, 280);
    modalTargetSheetIndex = null;
}

function confirmSheetDuplicate() {
    if (modalTargetSheetIndex === null || !spreadsheetEngine) return;
    const input = document.getElementById('modal-sheet-duplicate-input');
    const newName = (input ? input.value : '').trim() || `${spreadsheetEngine.sheets[modalTargetSheetIndex].name} (Copia)`;

    const incData = document.getElementById('dup-opt-data') ? document.getElementById('dup-opt-data').checked : true;
    const incFmt = document.getElementById('dup-opt-formats') ? document.getElementById('dup-opt-formats').checked : true;
    const incTbl = document.getElementById('dup-opt-tables') ? document.getElementById('dup-opt-tables').checked : true;
    const incClr = document.getElementById('dup-opt-color') ? document.getElementById('dup-opt-color').checked : true;

    const sourceSheet = spreadsheetEngine.sheets[modalTargetSheetIndex];

    spreadsheetEngine.pushHistory();

    const newSheet = {
        id: `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: newName,
        data: incData ? JSON.parse(JSON.stringify(sourceSheet.data || {})) : {},
        colWidths: incFmt ? JSON.parse(JSON.stringify(sourceSheet.colWidths || {})) : {},
        rowHeights: incFmt ? JSON.parse(JSON.stringify(sourceSheet.rowHeights || {})) : {},
        hiddenCols: incFmt ? JSON.parse(JSON.stringify(sourceSheet.hiddenCols || {})) : {},
        hiddenRows: incFmt ? JSON.parse(JSON.stringify(sourceSheet.hiddenRows || {})) : {},
        tables: incTbl ? JSON.parse(JSON.stringify(sourceSheet.tables || [])) : [],
        colFormats: incFmt ? JSON.parse(JSON.stringify(sourceSheet.colFormats || {})) : {},
        tabColor: incClr ? (sourceSheet.tabColor || null) : null
    };

    spreadsheetEngine.sheets.splice(modalTargetSheetIndex + 1, 0, newSheet);
    spreadsheetEngine.activeSheetIndex = modalTargetSheetIndex + 1;
    spreadsheetEngine.rebuildHyperFormula();
    spreadsheetEngine.render();
    if (typeof spreadsheetEngine.options.onChange === 'function') spreadsheetEngine.options.onChange();
    markUnsavedChanges();

    closeSheetDuplicateModal();
}

// --- 4. MODAL ELIMINAR HOJA ---
function openSheetDeleteModal(sheetIndex = null) {
    if (!spreadsheetEngine) return;
    const idx = (sheetIndex !== null && sheetIndex !== undefined) ? sheetIndex : spreadsheetEngine.activeSheetIndex;
    if (idx < 0 || idx >= spreadsheetEngine.sheets.length) return;

    if (spreadsheetEngine && typeof spreadsheetEngine.closeSheetTabMenu === 'function') {
        spreadsheetEngine.closeSheetTabMenu();
    }

    if (spreadsheetEngine.sheets.length <= 1) {
        alert('El libro contable debe contener al menos una hoja.');
        return;
    }

    modalTargetSheetIndex = idx;
    const targetName = document.getElementById('delete-sheet-target-name');
    if (targetName) targetName.textContent = `"${spreadsheetEngine.sheets[idx].name}"`;

    const modal = document.getElementById('modal-sheet-delete');
    if (!modal) return;
    modal.classList.remove('closing');
    modal.style.display = 'flex';
}

function closeSheetDeleteModal() {
    const modal = document.getElementById('modal-sheet-delete');
    if (!modal) return;
    modal.classList.add('closing');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
    }, 280);
    modalTargetSheetIndex = null;
}

function confirmSheetDelete() {
    if (modalTargetSheetIndex === null || !spreadsheetEngine) return;
    spreadsheetEngine.deleteSheet(modalTargetSheetIndex, true);
    closeSheetDeleteModal();
}

// --- 5. MODAL ORGANIZAR Y REORDENAR HOJAS ---
function openSheetReorderModal() {
    if (!spreadsheetEngine) return;
    if (spreadsheetEngine && typeof spreadsheetEngine.closeSheetTabMenu === 'function') {
        spreadsheetEngine.closeSheetTabMenu();
    }

    reorderSheetsTempList = spreadsheetEngine.sheets.map(s => ({ ...s }));
    renderSheetReorderList();

    const modal = document.getElementById('modal-sheet-reorder');
    if (!modal) return;
    modal.classList.remove('closing');
    modal.style.display = 'flex';
}

function closeSheetReorderModal() {
    const modal = document.getElementById('modal-sheet-reorder');
    if (!modal) return;
    modal.classList.add('closing');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
    }, 280);
    reorderSheetsTempList = [];
}

function renderSheetReorderList() {
    const container = document.getElementById('sheet-reorder-list');
    if (!container) return;

    container.innerHTML = reorderSheetsTempList.map((sheet, index) => {
        const isFirst = index === 0;
        const isLast = index === reorderSheetsTempList.length - 1;
        const dotColor = sheet.tabColor || '#f59e0b';
        return `
            <div class="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 group hover:border-amber-500/40 transition-all">
                <div class="flex items-center gap-2.5 min-w-0">
                    <span class="w-5 h-5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 tabular-nums font-bold text-[10px] flex items-center justify-center shrink-0">${index + 1}</span>
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${dotColor};"></span>
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${sheet.name}</span>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button type="button" onclick="moveSheetInReorderList(${index}, -1)" ${isFirst ? 'disabled' : ''} class="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:border-amber-500 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm cursor-pointer" title="Subir">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                    <button type="button" onclick="moveSheetInReorderList(${index}, 1)" ${isLast ? 'disabled' : ''} class="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:border-amber-500 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm cursor-pointer" title="Bajar">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function moveSheetInReorderList(index, direction) {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= reorderSheetsTempList.length) return;
    const moved = reorderSheetsTempList.splice(index, 1)[0];
    reorderSheetsTempList.splice(targetIdx, 0, moved);
    renderSheetReorderList();
}

function confirmSheetReorder() {
    if (!spreadsheetEngine || reorderSheetsTempList.length === 0) return;
    const activeSheetName = spreadsheetEngine.sheets[spreadsheetEngine.activeSheetIndex].name;
    
    spreadsheetEngine.pushHistory();
    spreadsheetEngine.sheets = reorderSheetsTempList;

    const newActiveIdx = spreadsheetEngine.sheets.findIndex(s => s.name === activeSheetName);
    spreadsheetEngine.activeSheetIndex = newActiveIdx !== -1 ? newActiveIdx : 0;

    spreadsheetEngine.rebuildHyperFormula();
    spreadsheetEngine.render();
    if (typeof spreadsheetEngine.options.onChange === 'function') spreadsheetEngine.options.onChange();
    markUnsavedChanges();

    closeSheetReorderModal();
}

// Exportar globalmente
window.openSheetRenameModal = openSheetRenameModal;
window.closeSheetRenameModal = closeSheetRenameModal;
window.setRenameSuggestion = setRenameSuggestion;
window.updateRenameCounter = updateRenameCounter;
window.handleSheetRenameKey = handleSheetRenameKey;
window.confirmSheetRename = confirmSheetRename;

window.openSheetColorModal = openSheetColorModal;
window.closeSheetColorModal = closeSheetColorModal;
window.selectSheetColorPreset = selectSheetColorPreset;
window.previewSelectedSheetColor = previewSelectedSheetColor;
window.pickSheetColorEyedropper = pickSheetColorEyedropper;
window.removeSheetColorFromModal = removeSheetColorFromModal;
window.confirmSheetColor = confirmSheetColor;

window.openSheetDuplicateModal = openSheetDuplicateModal;
window.closeSheetDuplicateModal = closeSheetDuplicateModal;
window.confirmSheetDuplicate = confirmSheetDuplicate;

window.openSheetDeleteModal = openSheetDeleteModal;
window.closeSheetDeleteModal = closeSheetDeleteModal;
window.confirmSheetDelete = confirmSheetDelete;

window.openSheetReorderModal = openSheetReorderModal;
window.closeSheetReorderModal = closeSheetReorderModal;
window.moveSheetInReorderList = moveSheetInReorderList;
window.confirmSheetReorder = confirmSheetReorder;

// =========================================================================
// GESTOR DE MODOS DE VISTA DE HOJAS DE CÁLCULO
// =========================================================================
function setSpreadsheetViewMode(mode) {
    if (!spreadsheetEngine) return;
    spreadsheetEngine.setViewMode(mode);

    const modes = ['normal', 'paginada', 'saltos', 'formulas'];
    modes.forEach(m => {
        const btn = document.getElementById(`sheet-viewmode-${m}`);
        if (btn) {
            btn.classList.toggle('active', m === mode);
        }
    });

    if (spreadsheetCollabEngine) {
        spreadsheetCollabEngine.broadcastViewMode(mode);
    }
}

function togglePageConfigPopover(e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    const popover = document.getElementById('page-config-popover');
    const btn = document.getElementById('btn-page-config');
    if (!popover || !btn) return;

    const isHidden = popover.classList.contains('hidden');
    if (isHidden) {
        closeFormatDropdown();
        closeBorderPicker();
        closeColorPickers();
        closeTableStylePopover();
        closeExportMenu();

        positionPopoverBelow(popover, btn, 'right');
        popover.classList.remove('hidden');
        requestAnimationFrame(() => {
            popover.classList.remove('opacity-0', 'scale-95');
            popover.classList.add('opacity-100', 'scale-100');
        });
    } else {
        closePageConfigPopover();
    }
}

function closePageConfigPopover() {
    const popover = document.getElementById('page-config-popover');
    if (!popover || popover.classList.contains('hidden')) return;
    popover.classList.remove('opacity-100', 'scale-100');
    popover.classList.add('opacity-0', 'scale-95');
    setTimeout(() => { popover.classList.add('hidden'); }, 150);
}

function setPageSize(size) {
    if (!spreadsheetEngine) return;
    spreadsheetEngine.setPageConfig({ size });
    ['letter', 'a4', 'legal'].forEach(s => {
        const b = document.getElementById(`btn-calc-size-${s}`);
        if (b) {
            if (s === size) {
                b.className = 'py-1 px-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold text-center';
            } else {
                b.className = 'py-1 px-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold text-center';
            }
        }
    });
}

function setPageOrientation(orientation) {
    if (!spreadsheetEngine) return;
    spreadsheetEngine.setPageConfig({ orientation });
    ['portrait', 'landscape'].forEach(o => {
        const b = document.getElementById(`btn-calc-orient-${o}`);
        if (b) {
            if (o === orientation) {
                b.className = 'py-1 px-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1';
            } else {
                b.className = 'py-1 px-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1';
            }
        }
    });
}

// Cerrar popovers al hacer clic fuera
document.addEventListener('click', (e) => {
    const pagePopover = document.getElementById('page-config-popover');
    const pageBtn = document.getElementById('btn-page-config');
    if (pagePopover && !pagePopover.classList.contains('hidden')) {
        if (!pagePopover.contains(e.target) && (!pageBtn || !pageBtn.contains(e.target))) {
            closePageConfigPopover();
        }
    }
});

// =========================================================================
// MOTOR DE COLABORACIÓN MULTIJUGADOR EN TIEMPO REAL (SUPABASE REALTIME)
// =========================================================================
class SpreadsheetCollabEngine {
    constructor(projectId, engine) {
        this.projectId = projectId;
        this.engine = engine;
        this.channel = null;
        this.currentUser = null;
        this.collaborators = new Map();
        this.selectionThrottleTimer = null;
        this.colorPalette = [
            '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6',
            '#ec4899', '#14b8a6', '#f97316', '#6366f1'
        ];
    }

    async init() {
        if (!this.projectId) return;

        let userName = 'Usuario SV';
        let userColor = this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)];
        let userId = 'user_' + Math.random().toString(36).substring(2, 9);

        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session && session.user) {
                    userId = session.user.id;
                    userName = session.user.user_metadata?.nombre_completo || session.user.email?.split('@')[0] || 'Contador SV';
                }
            } catch (e) {}
        }

        const initials = userName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'SV';
        this.currentUser = {
            userId: userId,
            userName: userName,
            userColor: userColor,
            userInitials: initials,
            joinedAt: new Date().toISOString()
        };

        this.updatePresenceUI();

        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                this.channel = supabaseClient.channel(`collab-calc-${this.projectId}`, {
                    config: {
                        presence: { key: this.currentUser.userId },
                        broadcast: { self: false }
                    }
                });

                this.channel
                    .on('presence', { event: 'sync' }, () => {
                        const state = this.channel.presenceState();
                        this.collaborators.clear();
                        Object.keys(state).forEach(key => {
                            const presences = state[key];
                            if (presences && presences.length > 0) {
                                const p = presences[0];
                                if (p.userId !== this.currentUser.userId) {
                                    this.collaborators.set(p.userId, p);
                                }
                            }
                        });
                        this.updatePresenceUI();
                    })
                    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                        if (newPresences && newPresences.length > 0) {
                            const p = newPresences[0];
                            if (p.userId !== this.currentUser.userId) {
                                this.collaborators.set(p.userId, p);
                                this.updatePresenceUI();
                            }
                        }
                    })
                    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                        if (leftPresences && leftPresences.length > 0) {
                            const p = leftPresences[0];
                            this.collaborators.delete(p.userId);
                            if (this.engine) {
                                this.engine.clearRemoteSelection(p.userId);
                            }
                            this.updatePresenceUI();
                        }
                    });

                this.channel
                    .on('broadcast', { event: 'cell_select' }, ({ payload }) => {
                        if (!payload || payload.userId === this.currentUser.userId) return;
                        if (this.engine) {
                            this.engine.setRemoteSelection(payload.userId, payload);
                        }
                    })
                    .on('broadcast', { event: 'cell_update' }, ({ payload }) => {
                        if (!payload || payload.userId === this.currentUser.userId) return;
                        if (this.engine) {
                            this.engine.applyRemoteCellUpdate(payload.sheetId, payload.row, payload.col, payload.data);
                        }
                    })
                    .on('broadcast', { event: 'cell_range_update' }, ({ payload }) => {
                        if (!payload || payload.userId === this.currentUser.userId) return;
                        if (this.engine) {
                            const sheet = this.engine.sheets.find(s => s.id === payload.sheetId || s.name === payload.sheetId) || this.engine.sheets[this.engine.activeSheetIndex];
                            if (sheet) {
                                for (let r = payload.r1; r <= payload.r2; r++) {
                                    for (let c = payload.c1; c <= payload.c2; c++) {
                                        const key = `${r}_${c}`;
                                        sheet.data[key] = sheet.data[key] || {};
                                        sheet.data[key][payload.key] = payload.value;
                                    }
                                }
                                this.engine.render();
                            }
                        }
                    })
                    .on('broadcast', { event: 'view_mode' }, ({ payload }) => {
                        // Notificación de cambio de modo remoto
                    });

                this.channel.subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await this.channel.track(this.currentUser);
                        const ind = document.getElementById('collab-live-indicator');
                        if (ind) ind.classList.add('collab-live-pulse');
                    }
                });
            } catch (err) {
                console.warn('Error al conectar canal Realtime:', err);
            }
        }
    }

    broadcastSelection(info) {
        if (!this.channel || !this.currentUser) return;
        if (this.selectionThrottleTimer) return;

        this.selectionThrottleTimer = setTimeout(() => {
            this.selectionThrottleTimer = null;
            const currentSheet = this.engine.sheets[this.engine.activeSheetIndex];
            this.channel.send({
                type: 'broadcast',
                event: 'cell_select',
                payload: {
                    userId: this.currentUser.userId,
                    userName: this.currentUser.userName,
                    userColor: this.currentUser.userColor,
                    currentSheetId: currentSheet ? currentSheet.id : 'sheet_1',
                    startRow: info.r1,
                    startCol: info.c1,
                    endRow: info.r2,
                    endCol: info.c2,
                    cellRef: info.cellRef
                }
            }).catch(() => {});
        }, 60);
    }

    broadcastCellUpdate(changeInfo) {
        if (!this.channel || !this.currentUser) return;
        this.channel.send({
            type: 'broadcast',
            event: 'cell_update',
            payload: {
                userId: this.currentUser.userId,
                sheetId: changeInfo.sheetId,
                row: changeInfo.row,
                col: changeInfo.col,
                data: changeInfo.data
            }
        }).catch(() => {});
    }

    broadcastCellRangeUpdate(rangeInfo) {
        if (!this.channel || !this.currentUser) return;
        this.channel.send({
            type: 'broadcast',
            event: 'cell_range_update',
            payload: {
                userId: this.currentUser.userId,
                sheetId: rangeInfo.sheetId,
                r1: rangeInfo.r1,
                r2: rangeInfo.r2,
                c1: rangeInfo.c1,
                c2: rangeInfo.c2,
                key: rangeInfo.key,
                value: rangeInfo.value
            }
        }).catch(() => {});
    }

    broadcastViewMode(mode) {
        if (!this.channel || !this.currentUser) return;
        this.channel.send({
            type: 'broadcast',
            event: 'view_mode',
            payload: {
                userId: this.currentUser.userId,
                mode: mode
            }
        }).catch(() => {});
    }

    updatePresenceUI() {
        const container = document.getElementById('collab-presence-container');
        const countLabel = document.getElementById('collab-live-count-label');
        const listEl = document.getElementById('collaborators-live-list');

        const totalUsers = 1 + this.collaborators.size;
        if (countLabel) {
            countLabel.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> ${totalUsers} conectado${totalUsers > 1 ? 's' : ''}`;
        }

        if (container) {
            let html = '';
            if (this.currentUser) {
                html += `<div class="collab-avatar-bubble" style="background-color: ${this.currentUser.userColor};" title="Tú (${escapeHtmlCalc(this.currentUser.userName)})">${escapeHtmlCalc(this.currentUser.userInitials)}</div>`;
            }
            this.collaborators.forEach(c => {
                html += `<div class="collab-avatar-bubble" style="background-color: ${c.userColor};" title="${escapeHtmlCalc(c.userName)}">${escapeHtmlCalc(c.userInitials || 'SV')}</div>`;
            });
            container.innerHTML = html;
        }

        if (listEl) {
            let listHtml = '';
            if (this.currentUser) {
                listHtml += `
                    <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm" style="background-color: ${this.currentUser.userColor}">
                                ${escapeHtmlCalc(this.currentUser.userInitials)}
                            </div>
                            <div>
                                <span class="font-bold text-xs text-slate-800 dark:text-slate-200">${escapeHtmlCalc(this.currentUser.userName)}</span>
                                <span class="text-[10px] text-amber-500 font-bold ml-1">(Tú)</span>
                            </div>
                        </div>
                        <span class="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                            <i class="fas fa-circle text-[7px]"></i> En línea
                        </span>
                    </div>
                `;
            }
            this.collaborators.forEach(c => {
                listHtml += `
                    <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm" style="background-color: ${c.userColor}">
                                ${escapeHtmlCalc(c.userInitials || 'SV')}
                            </div>
                            <div>
                                <span class="font-bold text-xs text-slate-800 dark:text-slate-200">${escapeHtmlCalc(c.userName)}</span>
                            </div>
                        </div>
                        <span class="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                            <i class="fas fa-circle text-[7px]"></i> En línea
                        </span>
                    </div>
                `;
            });
            listEl.innerHTML = listHtml;
        }
    }
}

// =========================================================================
// CONTROLADORES DEL MODAL DE COMPARTIR
// =========================================================================
function openShareModal() {
    const modal = document.getElementById('share-modal');
    if (!modal) return;

    const linkInput = document.getElementById('share-invite-link');
    if (linkInput && proyecto_actual) {
        const origin = window.location.origin;
        const pathname = window.location.pathname;
        linkInput.value = `${origin}${pathname}?id=${proyecto_actual.id}&collab=true`;
    }

    if (spreadsheetCollabEngine) {
        spreadsheetCollabEngine.updatePresenceUI();
    }

    renderSavedCollaboratorsList();
    modal.classList.add('active');
}

function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) modal.classList.remove('active');
}

function copyInviteLink() {
    const linkInput = document.getElementById('share-invite-link');
    const copyBtn = document.getElementById('btn-copy-invite');
    if (!linkInput) return;

    linkInput.select();
    navigator.clipboard.writeText(linkInput.value).then(() => {
        if (copyBtn) {
            const origHtml = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> <span>¡Copiado!</span>';
            copyBtn.classList.remove('bg-sky-500', 'hover:bg-sky-600');
            copyBtn.classList.add('bg-emerald-500', 'hover:bg-emerald-600');
            setTimeout(() => {
                copyBtn.innerHTML = origHtml;
                copyBtn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
                copyBtn.classList.add('bg-sky-500', 'hover:bg-sky-600');
            }, 2000);
        }
    }).catch(() => {
        document.execCommand('copy');
    });
}

function addCollaborator() {
    if (window.isAuditMode) return;
    const uidInput = document.getElementById('share-uid-input');
    if (!uidInput || !proyecto_actual) return;
    const uid = uidInput.value.trim();
    if (!uid) return;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uid)) {
        if (typeof showToast === 'function') showToast('El UID ingresado no tiene un formato UUID válido', 'error');
        else alert('El UID ingresado no tiene un formato UUID válido.');
        return;
    }

    proyecto_actual.collaborators = Array.isArray(proyecto_actual.collaborators) ? proyecto_actual.collaborators : [];
    proyecto_actual.shared_with = Array.isArray(proyecto_actual.shared_with) ? proyecto_actual.shared_with : [];
    const merged = Array.from(new Set([...proyecto_actual.collaborators, ...proyecto_actual.shared_with]));

    if (!merged.includes(uid)) {
        merged.push(uid);
        proyecto_actual.collaborators = [...merged];
        proyecto_actual.shared_with = [...merged];
        saveSpreadsheetManual();
        renderSavedCollaboratorsList();
    }
    uidInput.value = '';
}

function removeCollaborator(uid) {
    if (window.isAuditMode || !proyecto_actual) return;
    const merged = Array.from(new Set([...(proyecto_actual.collaborators || []), ...(proyecto_actual.shared_with || [])]));
    const filtered = merged.filter(id => id !== uid);
    proyecto_actual.collaborators = [...filtered];
    proyecto_actual.shared_with = [...filtered];
    saveSpreadsheetManual();
    renderSavedCollaboratorsList();
}

function renderSavedCollaboratorsList() {
    const listEl = document.getElementById('collaborators-list');
    if (!listEl || !proyecto_actual) return;

    const list = Array.from(new Set([...(proyecto_actual.collaborators || []), ...(proyecto_actual.shared_with || [])]));
    proyecto_actual.collaborators = [...list];
    proyecto_actual.shared_with = [...list];

    if (list.length === 0) {
        listEl.innerHTML = '<p class="text-xs text-slate-400 italic py-1">Solo tú tienes acceso permanente asignado.</p>';
        return;
    }

    listEl.innerHTML = list.map(uid => {
        const safeUid = escapeHtmlCalc(uid);
        return `
        <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-xs">
            <div class="flex items-center gap-2">
                <i class="fas fa-user-shield text-amber-500"></i>
                <span class="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[200px]">${safeUid}</span>
            </div>
            ${!window.isAuditMode ? `<button onclick="removeCollaborator('${safeUid}')" class="text-rose-500 hover:text-rose-600 p-1 cursor-pointer" title="Quitar acceso">
                <i class="fas fa-trash text-xs"></i>
            </button>` : ''}
        </div>
    `;
    }).join('');
}

// Exportar globalmente
window.toolPrint = toolPrint;
window.openPrintSpreadsheetModal = openPrintSpreadsheetModal;
window.closePrintSpreadsheetModal = closePrintSpreadsheetModal;
window.updatePrintPreview = updatePrintPreview;
window.executePrintSpreadsheet = executePrintSpreadsheet;
window.setPrintRange = setPrintRange;
window.setPrintSize = setPrintSize;
window.setPrintOrientation = setPrintOrientation;
window.setPrintScale = setPrintScale;
window.togglePrintOption = togglePrintOption;
window.setPrintPreviewZoom = setPrintPreviewZoom;
window.setSpreadsheetViewMode = setSpreadsheetViewMode;
window.togglePageConfigPopover = togglePageConfigPopover;
window.closePageConfigPopover = closePageConfigPopover;
window.toggleTableStylePopover = toggleTableStylePopover;
window.closeTableStylePopover = closeTableStylePopover;
window.applyTableStyleOrPrompt = applyTableStyleOrPrompt;
window.openCreateTableModal = openCreateTableModal;
window.toggleToolTextwrap = toggleToolTextwrap;
window.setPageSize = setPageSize;
window.setPageOrientation = setPageOrientation;
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.copyInviteLink = copyInviteLink;
window.addCollaborator = addCollaborator;
window.removeCollaborator = removeCollaborator;
window.SpreadsheetCollabEngine = SpreadsheetCollabEngine;
