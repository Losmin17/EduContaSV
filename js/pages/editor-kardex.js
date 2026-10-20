// =============================================================================
// KARDEX CONTABLE & CONTROL DE INVENTARIOS ENGINE v2.5 — EduConta SV
// Cumplimiento formal: Artículos 142-A y 143 del Código Tributario de El Salvador
// Métodos autorizados por la DGII: Costo Promedio Ponderado y PEPS (FIFO)
// Prohibición legal: UEPS (LIFO) Art. 143 C.T. y Sección 13 NIIF para las PYMES
// =============================================================================

let projects = [];
let proyecto_actual = null;
let activeSheetIndex = 0;
let kardexWorkMode = 'practica'; // 'asistido' (auto) | 'practica' (manual didáctico)
let tempRetaceoCalculated = null;

function escapeHtml(val) {
    if (window.EduSec && typeof window.EduSec.escapeHtml === 'function') {
        return window.EduSec.escapeHtml(val);
    }
    return String(val ?? '').replace(/[&<>"'`]/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;'
    }[ch]));
}
const escAttr = escapeHtml;

function showKardexToast(msg, type = 'warning') {
    const toast = document.getElementById('sync-toast');
    if (toast) {
        const h4 = toast.querySelector('h4');
        const p = toast.querySelector('p');
        const icon = toast.querySelector('i');
        if (h4) h4.textContent = type === 'error' ? 'Stock Insuficiente' : (type === 'warning' ? 'Aviso de Inventario' : 'Kardex Actualizado');
        if (p) p.textContent = msg;
        if (icon) {
            icon.className = type === 'error' || type === 'warning'
                ? 'fas fa-exclamation-triangle text-2xl'
                : 'fas fa-check-circle text-2xl';
        }
        toast.style.background = type === 'error' ? '#e11d48' : (type === 'warning' ? '#d97706' : '#059669');
        toast.style.borderColor = type === 'error' ? '#fb7185' : (type === 'warning' ? '#fbbf24' : '#34d399');
        toast.classList.remove('translate-y-32', 'opacity-0');
        clearTimeout(toast._hideTimer);
        toast._hideTimer = setTimeout(() => {
            toast.classList.add('translate-y-32', 'opacity-0');
        }, 3800);
    } else if (typeof window.showAlert === 'function') {
        window.showAlert('Aviso de Inventario', msg);
    } else {
        alert(msg);
    }
}

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (typeof injectSharedUI === 'function') {
            injectSharedUI('shared-components-root');
        }
    } catch (e) {
        console.warn("Shared UI injection fallback:", e);
    }

    // Cargar datos de LocalStorage
    const rawProjects = localStorage.getItem('educonta_projects_kardex');
    const lastProjectId = localStorage.getItem('educonta_last_project_id');
    
    if (rawProjects) {
        try {
            projects = JSON.parse(rawProjects);
        } catch(e) {
            projects = [];
        }
    }
    
    if (projects.length > 0) {
        proyecto_actual = projects.find(p => String(p.id) === String(lastProjectId)) || projects[0];
    }
    
    if (!proyecto_actual) {
        // Redirigir si no hay proyecto activo
        window.location.href = 'proyectos.html';
        return;
    }

    // Asegurar estructura de hojas/artículos
    if (!proyecto_actual.sheets || proyecto_actual.sheets.length === 0) {
        proyecto_actual.sheets = [
            {
                name: 'Artículo Principal',
                code: 'INV-001',
                unit: 'Unidades',
                location: 'Bodega Central - Estante A',
                minStock: 10,
                reorderPoint: 25,
                maxStock: 100,
                method: 'promedio',
                mode: 'practica',
                movements: []
            }
        ];
    }

    // Configurar modo de trabajo guardado o por defecto
    const savedMode = proyecto_actual.sheets[activeSheetIndex]?.mode || 'practica';
    kardexWorkMode = savedMode;

    // Inicializar títulos en cabecera
    const titleEl = document.getElementById('current-project-name');
    if (titleEl) titleEl.innerText = proyecto_actual.name || 'Empresa Comercial';
    const mobName = document.getElementById('mobile-project-name');
    if (mobName) mobName.innerText = proyecto_actual.name || 'Kardex';

    activeSheetIndex = 0;
    renderSheetSelect();
    loadActiveSheet();
    setKardexMode('practica', false);

    if (window.isAuditMode) {
        document.querySelectorAll('[onclick*="openNewSheetModal"], [onclick*="confirmDeleteSheet"], [onclick*="openNewMovementModal"], [onclick*="addKardexRow"], [onclick*="openRetaceoModal"], [onclick*="applyRetaceoToKardex"], [onclick*="addPartidaCostoToDiario"], [onclick*="addPartidaRetaceoToDiario"]').forEach(btn => {
            btn.style.display = 'none';
        });
        ['sheet-item-code', 'sheet-item-unit', 'sheet-item-location', 'sheet-item-min', 'sheet-item-reorder', 'sheet-item-max'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = true;
        });
    }

    // Desvanecer preloader suavemente tras inicializar fichas de kardex y movimientos
    if (typeof window.dismissGlobalPreloader === 'function') {
        window.dismissGlobalPreloader();
    }
});

// === GESTIÓN DE ARTÍCULOS / HOJAS ===
function renderSheetSelect() {
    const select = document.getElementById('kardex-sheet-select');
    if (!select || !proyecto_actual) return;
    select.innerHTML = '';
    proyecto_actual.sheets.forEach((sheet, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${sheet.code ? sheet.code + ' — ' : ''}${sheet.name}`;
        if (idx === activeSheetIndex) opt.selected = true;
        select.appendChild(opt);
    });
    if (select._glassSelectInstance && typeof select._glassSelectInstance.refresh === 'function') {
        select._glassSelectInstance.refresh();
    } else if (typeof window.EduContaGlassSelect === 'function') {
        window.EduContaGlassSelect(select, 'sky');
    }
}

window.switchKardexSheet = function(idx) {
    activeSheetIndex = parseInt(idx);
    loadActiveSheet();
};

function loadActiveSheet() {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    // Título y datos legales
    const titleEl = document.getElementById('kardex-item-title');
    if (titleEl) titleEl.innerText = `REGISTRO DE INVENTARIO: ${sheet.name.toUpperCase()}`;
    
    // Metadatos Art. 142-A en inputs editables
    const codeInput = document.getElementById('sheet-item-code');
    const unitSelect = document.getElementById('sheet-item-unit');
    const locInput = document.getElementById('sheet-item-location');
    const minInput = document.getElementById('sheet-item-min');
    const reorderInput = document.getElementById('sheet-item-reorder');
    const maxInput = document.getElementById('sheet-item-max');

    if (codeInput) codeInput.value = sheet.code || '';
    if (unitSelect) {
        unitSelect.value = sheet.unit || 'Unidades';
        if (unitSelect._glassSelectInstance && typeof unitSelect._glassSelectInstance.refresh === 'function') {
            unitSelect._glassSelectInstance.refresh();
        }
    }
    if (locInput) locInput.value = sheet.location || '';
    if (minInput) minInput.value = sheet.minStock ?? 0;
    if (reorderInput) reorderInput.value = sheet.reorderPoint ?? 0;
    if (maxInput) maxInput.value = sheet.maxStock ?? 0;

    // Resumen de Ficha en cabecera
    const sumCode = document.getElementById('summary-code');
    const sumUnit = document.getElementById('summary-unit');
    const sumLoc = document.getElementById('summary-location');
    const sumMin = document.getElementById('summary-min');
    const sumReorder = document.getElementById('summary-reorder');
    const sumMax = document.getElementById('summary-max');

    if (sumCode) sumCode.innerText = sheet.code || 'S/C';
    if (sumUnit) sumUnit.innerText = sheet.unit || 'Unidades';
    if (sumLoc) sumLoc.innerText = sheet.location || 'Bodega Central';
    if (sumMin) sumMin.innerText = sheet.minStock ?? 0;
    if (sumReorder) sumReorder.innerText = sheet.reorderPoint ?? 0;
    if (sumMax) sumMax.innerText = sheet.maxStock ?? 0;

    // Sincronizar etiquetas de impresión fiscal
    const printCompany = document.getElementById('print-company-name');
    const printItem = document.getElementById('print-item-name');
    const printCode = document.getElementById('print-item-code');
    const printUnit = document.getElementById('print-item-unit');
    const printMethod = document.getElementById('print-item-method');
    const printLoc = document.getElementById('print-item-loc');

    if (printCompany) printCompany.innerText = proyecto_actual.name || 'Empresa Comercial S.A. de C.V.';
    if (printItem) printItem.innerText = sheet.name;
    if (printCode) printCode.innerText = sheet.code || 'S/C';
    if (printUnit) printUnit.innerText = sheet.unit || 'Unidades';
    if (printMethod) printMethod.innerText = (sheet.method === 'peps' ? 'PEPS (FIFO)' : (sheet.method === 'ueps' ? 'UEPS (LIFO)' : 'Costo Promedio Ponderado')) + ' - Art. 143 C.T.';
    if (printLoc) printLoc.innerText = sheet.location || 'Bodega Central';

    // Badge de unidad en KPI
    const unitBadge = document.getElementById('metric-unit-badge');
    if (unitBadge) unitBadge.innerText = (sheet.unit || 'uds').toLowerCase();

    // Sincronizar método activo
    const method = sheet.method || 'promedio';
    switchValuationMethod(method, false);

    // Sincronizar modo de trabajo
    setKardexMode(sheet.mode || kardexWorkMode, false);

    calculateAndRenderKardex();
}

window.toggleArticleSpecs = function() {
    const panel = document.getElementById('article-specs-panel');
    const chevron = document.getElementById('specs-chevron');
    if (!panel) return;
    
    const isHidden = panel.classList.contains('hidden');
    if (isHidden) {
        panel.classList.remove('hidden');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    } else {
        panel.classList.add('hidden');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
};

window.updateSheetMeta = function(field, value) {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    if (field === 'minStock' || field === 'maxStock' || field === 'reorderPoint') {
        sheet[field] = parseFloat(value) || 0;
    } else {
        sheet[field] = value;
    }

    renderSheetSelect();
    loadActiveSheet();
    saveState();
};

// === DIÁLOGOS DE NUEVO / BORRAR ARTÍCULO ===
window.openNewSheetModal = function() {
    if (window.isAuditMode) return;
    document.getElementById('sheet-input-name').value = '';
    document.getElementById('sheet-input-code').value = `INV-00${proyecto_actual.sheets.length + 1}`;
    document.getElementById('sheet-modal').style.display = 'flex';
};

window.closeSheetModal = function() {
    const md = document.getElementById('sheet-modal');
    if (md) {
        md.classList.add('closing');
        setTimeout(() => {
            md.style.display = 'none';
            md.classList.remove('closing');
        }, 300);
    }
};

window.saveNewSheet = function() {
    if (window.isAuditMode) return;
    const nameInput = document.getElementById('sheet-input-name').value.trim();
    const codeInput = document.getElementById('sheet-input-code').value.trim() || `INV-00${proyecto_actual.sheets.length + 1}`;
    if (!nameInput) {
        alert("Por favor ingresa un nombre para el artículo.");
        return;
    }

    proyecto_actual.sheets.push({
        name: nameInput,
        code: codeInput,
        unit: 'Unidades',
        location: 'Bodega Central',
        minStock: 10,
        reorderPoint: 25,
        maxStock: 100,
        method: 'promedio',
        mode: kardexWorkMode,
        movements: []
    });

    saveState();
    activeSheetIndex = proyecto_actual.sheets.length - 1;
    renderSheetSelect();
    loadActiveSheet();
    closeSheetModal();
};

window.confirmDeleteSheet = function() {
    if (window.isAuditMode) return;
    if (proyecto_actual.sheets.length <= 1) {
        alert("No puedes eliminar todos los artículos. Debe quedar al menos una ficha de inventario.");
        return;
    }
    const currentName = proyecto_actual.sheets[activeSheetIndex].name;
    if (confirm(`¿Estás seguro de que deseas eliminar la ficha del artículo "${currentName}"?`)) {
        proyecto_actual.sheets.splice(activeSheetIndex, 1);
        activeSheetIndex = 0;
        saveState();
        renderSheetSelect();
        loadActiveSheet();
    }
};

// === CONTROL DEL MODO DE TRABAJO (PRÁCTICA VS ASISTIDO) ===
window.setKardexMode = function(mode, performSave = true) {
    kardexWorkMode = mode;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (sheet) sheet.mode = mode;

    const btnPrac = document.getElementById('btn-mode-practica');
    const btnAsis = document.getElementById('btn-mode-asistido');
    const banner = document.getElementById('practice-mode-banner');
    const modeDesc = document.getElementById('kardex-mode-desc');

    if (mode === 'practica') {
        if (btnPrac) {
            btnPrac.className = "px-3.5 py-1 rounded-full transition-all bg-amber-500 text-white shadow-xs flex items-center gap-1.5";
        }
        if (btnAsis) {
            btnAsis.className = "px-3.5 py-1 rounded-full transition-all text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1.5";
        }
        if (banner) banner.classList.remove('hidden');
        if (modeDesc) modeDesc.innerText = "MODO TALLER ACTIVO: INGRESA LOS CÁLCULOS MANUALMENTE Y AUDITA TUS RESULTADOS";
    } else {
        if (btnAsis) {
            btnAsis.className = "px-3.5 py-1 rounded-full transition-all bg-sky-500 text-white shadow-xs flex items-center gap-1.5";
        }
        if (btnPrac) {
            btnPrac.className = "px-3.5 py-1 rounded-full transition-all text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1.5";
        }
        if (banner) banner.classList.add('hidden');
        if (modeDesc) modeDesc.innerText = "SISTEMA VALUADO AUTOMÁTICAMENTE SEGÚN LEGISLACIÓN DE EL SALVADOR";
    }

    if (performSave) {
        calculateAndRenderKardex();
        saveState();
    }
};

// === GESTIÓN DEL MÉTODO DE VALUACIÓN Y AVISO UEPS ===
let currentKardexMethodIndex = 0;
let kardexMethodSnapTimeout = null;
const KARDEX_METHODS = ['promedio', 'peps', 'ueps'];

function moveKardexMethodTab(btn, newIndex, animate = true) {
    const pill = document.getElementById('kardex-method-indicator');
    if (!pill || !btn) return;

    if (kardexMethodSnapTimeout) {
        clearTimeout(kardexMethodSnapTimeout);
        kardexMethodSnapTimeout = null;
    }

    if (btn.offsetWidth === 0) {
        requestAnimationFrame(() => {
            if (btn.offsetWidth > 0) moveKardexMethodTab(btn, newIndex, animate);
        });
        return;
    }

    const distance = Math.abs(newIndex - currentKardexMethodIndex);
    const stretch = (animate && distance > 0) ? (1 + Math.min(distance * 0.15, 0.35)) : 1;

    if (!animate) {
        pill.style.transition = 'none';
    }

    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.opacity = '1';

    if (animate && distance > 0) {
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(${stretch}) scaleY(0.9)`;
        kardexMethodSnapTimeout = setTimeout(() => {
            pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(1) scaleY(1)`;
        }, 180);
    } else {
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(1) scaleY(1)`;
    }

    if (!animate) {
        void pill.offsetWidth;
        requestAnimationFrame(() => {
            pill.style.transition = '';
        });
    }

    currentKardexMethodIndex = newIndex;
}
window.moveKardexMethodTab = moveKardexMethodTab;

window.switchValuationMethod = function(method, performSave = true) {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    sheet.method = method;

    const methods = ['promedio', 'peps', 'ueps'];
    const pill = document.getElementById('kardex-method-indicator');
    if (pill) {
        if (method === 'ueps') {
            pill.className = "absolute top-1 bottom-1 left-0 rounded-full bg-rose-600 pointer-events-none transition-all duration-300 ease-out shadow-md";
        } else {
            pill.className = "absolute top-1 bottom-1 left-0 rounded-full bg-sky-500 pointer-events-none transition-all duration-300 ease-out shadow-md";
        }
    }

    methods.forEach(m => {
        const btn = document.getElementById(`btn-method-${m}`);
        if (!btn) return;
        if (m === method) {
            btn.className = "relative z-10 px-4 py-1.5 rounded-full font-black text-[11px] uppercase transition-all whitespace-nowrap text-white";
        } else {
            if (m === 'ueps') {
                btn.className = "relative z-10 px-3 py-1.5 rounded-full font-black text-[11px] uppercase transition-all whitespace-nowrap text-rose-500 hover:text-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-950/30";
            } else {
                btn.className = "relative z-10 px-4 py-1.5 rounded-full font-black text-[11px] uppercase transition-all whitespace-nowrap text-slate-500 hover:text-slate-800 dark:hover:text-slate-200";
            }
        }
    });

    const activeBtn = document.getElementById(`btn-method-${method}`);
    if (activeBtn) {
        const idx = methods.indexOf(method);
        moveKardexMethodTab(activeBtn, idx >= 0 ? idx : 0, performSave);
    }

    const tag = document.getElementById('kardex-method-tag');
    if (tag) {
        if (method === 'promedio') {
            tag.innerText = "PROMEDIO PONDERADO (ART. 143 C.T.)";
            tag.className = "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300";
        } else if (method === 'peps') {
            tag.innerText = "PEPS / FIFO (ART. 143 C.T.)";
            tag.className = "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300";
        } else {
            tag.innerText = "UEPS / LIFO (PROHIBIDO POR ART. 143 C.T.)";
            tag.className = "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 animate-pulse";
        }
    }

    if (performSave) {
        calculateAndRenderKardex();
        saveState();
    }
};

window.addEventListener('resize', () => {
    const sheet = typeof proyecto_actual !== 'undefined' && proyecto_actual?.sheets?.[activeSheetIndex];
    const m = sheet?.method || 'promedio';
    const activeBtn = document.getElementById(`btn-method-${m}`);
    if (activeBtn) {
        moveKardexMethodTab(activeBtn, KARDEX_METHODS.indexOf(m), false);
    }
});

const syncMethodIndicator = () => {
    const sheet = typeof proyecto_actual !== 'undefined' && proyecto_actual?.sheets?.[activeSheetIndex];
    const m = sheet?.method || 'promedio';
    const activeBtn = document.getElementById(`btn-method-${m}`);
    if (activeBtn) {
        moveKardexMethodTab(activeBtn, KARDEX_METHODS.indexOf(m), false);
    }
};
syncMethodIndicator();
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncMethodIndicator);
}

window.handleUepsClick = function() {
    const modal = document.getElementById('ueps-legal-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeUepsModal = function() {
    const modal = document.getElementById('ueps-legal-modal');
    if (modal) modal.style.display = 'none';
};

window.confirmUepsActivation = function() {
    closeUepsModal();
    switchValuationMethod('ueps', true);
};

// =============================================================================
// MOTOR DE VALUACIÓN CONTABLE (PROMEDIO PONDERADO & PEPS POR CAPAS)
// =============================================================================
function recalculateKardexData() {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return null;

    const method = sheet.method || 'promedio';
    const moves = sheet.movements || [];

    // Limpieza de tipos y normalización
    moves.forEach(m => {
        m.cantidad = Math.max(0, parseFloat(m.cantidad) || 0);
        m.costoUnitario = Math.max(0, parseFloat(m.costoUnitario) || 0);
        m.tipo = m.tipo || 'inicial';
        m.docTipo = m.docTipo || (m.tipo === 'inicial' ? 'INV-INI' : 'CCF');
        m.docNum = m.docNum || '';
    });

    // Cola de lotes/capas para PEPS y UEPS: [{ id, doc, qty, cost }]
    let batchQueue = [];

    let totalQty = 0;
    let totalVal = 0;
    let avgCost = 0;

    let totalEntradasQty = 0;
    let totalEntradasVal = 0;
    let totalSalidasQty = 0;
    let totalSalidasVal = 0;

    moves.forEach((m, idx) => {
        const qty = m.cantidad;
        const uCost = m.costoUnitario;
        const op = m.tipo;

        // Clasificar si la operación es Entrada o Salida
        const isEntry = (op === 'inicial' || op === 'compra' || op === 'importacion' || op === 'dev_venta');
        const isExit  = (op === 'venta' || op === 'consumo' || op === 'merma' || op === 'dev_compra' || op === 'ajuste');

        m.availBefore = totalQty;

        if (isEntry) {
            // === ENTRADA DE INVENTARIO ===
            let rowVal = 0;

            if (op === 'dev_venta') {
                // Devolución sobre venta: reingresa mercadería al costo unitario en que se vendió o costo promedio actual
                const returnCost = uCost > 0 ? uCost : avgCost;
                rowVal = qty * returnCost;
                m.costoUnitario = returnCost;
                batchQueue.push({ id: idx + 1, doc: m.docNum || 'Dev.Vta', qty: qty, cost: returnCost });
            } else {
                rowVal = qty * uCost;
                batchQueue.push({ id: idx + 1, doc: m.docNum || `Lote-${idx+1}`, qty: qty, cost: uCost });
            }

            totalQty += qty;
            totalVal += rowVal;
            if (totalQty > 0) {
                avgCost = totalVal / totalQty;
            }

            // Asignar en fila
            m.entradaQty = qty;
            m.entradaCost = m.costoUnitario;
            m.entradaTotal = rowVal;

            m.salidaQty = 0;
            m.salidaCost = 0;
            m.salidaTotal = 0;

            totalEntradasQty += qty;
            totalEntradasVal += rowVal;

        } else if (isExit) {
            // === SALIDA DE INVENTARIO ===
            // Impedir que una salida exceda el stock físico disponible para evitar saldos negativos en memoria
            const effectiveQty = Math.min(qty, totalQty);
            if (qty > totalQty) {
                m.cantidad = effectiveQty;
            }
            m.salidaQty = effectiveQty;
            m.entradaQty = 0;
            m.entradaCost = 0;
            m.entradaTotal = 0;

            if (method === 'promedio') {
                // Costo Promedio Ponderado: Salida valúa al costo promedio del momento
                m.salidaCost = avgCost;
                m.salidaTotal = effectiveQty * avgCost;

                totalQty = Math.max(0, totalQty - effectiveQty);
                totalVal = Math.max(0, totalVal - m.salidaTotal);

                if (totalQty > 0) {
                    avgCost = totalVal / totalQty;
                } else {
                    avgCost = 0;
                    totalVal = 0;
                }

            } else if (method === 'peps') {
                // PEPS (FIFO): agotar primero los lotes más antiguos
                let remaining = effectiveQty;
                let withdrawalVal = 0;
                m.consumedBatches = [];

                while (remaining > 0 && batchQueue.length > 0) {
                    let firstBatch = batchQueue[0];
                    if (firstBatch.qty <= remaining) {
                        const costChunk = firstBatch.qty * firstBatch.cost;
                        withdrawalVal += costChunk;
                        m.consumedBatches.push({ qty: firstBatch.qty, cost: firstBatch.cost });
                        remaining -= firstBatch.qty;
                        batchQueue.shift(); // lote agotado
                    } else {
                        const costChunk = remaining * firstBatch.cost;
                        withdrawalVal += costChunk;
                        m.consumedBatches.push({ qty: remaining, cost: firstBatch.cost });
                        firstBatch.qty -= remaining;
                        remaining = 0;
                    }
                }

                m.salidaTotal = withdrawalVal;
                m.salidaCost = effectiveQty > 0 ? (withdrawalVal / effectiveQty) : 0;

                totalQty = Math.max(0, totalQty - effectiveQty);
                totalVal = Math.max(0, totalVal - withdrawalVal);
                avgCost = totalQty > 0 ? (totalVal / totalQty) : 0;

            } else if (method === 'ueps') {
                // UEPS (LIFO): agotar último lote ingresado
                let remaining = effectiveQty;
                let withdrawalVal = 0;

                while (remaining > 0 && batchQueue.length > 0) {
                    let lastBatch = batchQueue[batchQueue.length - 1];
                    if (lastBatch.qty <= remaining) {
                        withdrawalVal += lastBatch.qty * lastBatch.cost;
                        remaining -= lastBatch.qty;
                        batchQueue.pop();
                    } else {
                        withdrawalVal += remaining * lastBatch.cost;
                        lastBatch.qty -= remaining;
                        remaining = 0;
                    }
                }

                m.salidaTotal = withdrawalVal;
                m.salidaCost = effectiveQty > 0 ? (withdrawalVal / effectiveQty) : 0;

                totalQty = Math.max(0, totalQty - effectiveQty);
                totalVal = Math.max(0, totalVal - withdrawalVal);
                avgCost = totalQty > 0 ? (totalVal / totalQty) : 0;
            }

            totalSalidasQty += effectiveQty;
            totalSalidasVal += m.salidaTotal;
        }

        // Snapshot de saldo teórico
        m.saldoQty = Math.max(0, totalQty);
        m.saldoTotal = Math.max(0, totalVal);
        m.saldoCost = totalQty > 0 ? (totalVal / totalQty) : 0;

        // Snapshot de capas activas para PEPS en esta fila
        m.activeBatchesSnapshot = batchQueue.map(b => ({ ...b }));
    });

    sheet.movements = moves;
    return {
        totalEntradasQty,
        totalEntradasVal,
        totalSalidasQty,
        totalSalidasVal,
        totalQty,
        totalVal,
        avgCost,
        movesCount: moves.length,
        sheet
    };
}

function buildLotesHtml(m, method) {
    if (method === 'peps' && m.activeBatchesSnapshot && m.activeBatchesSnapshot.length > 0) {
        const lotesList = m.activeBatchesSnapshot.map((b, bIdx) => 
            `<span class="inline-block bg-sky-100/90 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded mr-1 mb-0.5 border border-sky-200/70 dark:border-sky-800">L${bIdx+1}: ${b.qty}u @ $${b.cost.toFixed(2)}</span>`
        ).join('');
        return `<div class="mt-1 flex flex-wrap gap-0.5 justify-center">${lotesList}</div>`;
    }
    return '';
}

function updateKardexDOMValues(totals) {
    if (!totals) return;
    const { totalEntradasQty, totalEntradasVal, totalSalidasQty, totalSalidasVal, totalQty, totalVal, avgCost, movesCount, sheet } = totals;
    const isPractice = (kardexWorkMode === 'practica');
    const method = sheet.method || 'promedio';

    (sheet.movements || []).forEach((m, idx) => {
        const isEntry = (m.tipo === 'inicial' || m.tipo === 'compra' || m.tipo === 'importacion' || m.tipo === 'dev_venta');
        const isExit  = (m.tipo === 'venta' || m.tipo === 'consumo' || m.tipo === 'merma' || m.tipo === 'dev_compra' || m.tipo === 'ajuste');

        const entTotEl = document.getElementById(`kardex-ent-tot-${idx}`);
        if (entTotEl && isEntry) {
            entTotEl.textContent = '$' + m.entradaTotal.toFixed(2);
        }

        if (isExit && !isPractice) {
            const salCostEl = document.getElementById(`kardex-sal-cost-${idx}`);
            if (salCostEl) salCostEl.textContent = '$' + m.salidaCost.toFixed(4);
            const salTotEl = document.getElementById(`kardex-sal-tot-${idx}`);
            if (salTotEl) salTotEl.textContent = '$' + m.salidaTotal.toFixed(2);
        }

        if (!isPractice) {
            const saldoQtyEl = document.getElementById(`kardex-saldo-qty-${idx}`);
            if (saldoQtyEl) saldoQtyEl.textContent = m.saldoQty;
            const saldoTotEl = document.getElementById(`kardex-saldo-tot-${idx}`);
            if (saldoTotEl) saldoTotEl.textContent = '$' + m.saldoTotal.toFixed(2);
        }

        const saldoCostCell = document.getElementById(`kardex-saldo-cost-${idx}`);
        if (saldoCostCell) {
            const lotesHtml = buildLotesHtml(m, method);
            saldoCostCell.innerHTML = method === 'promedio'
                ? `<span class="font-mono text-xs font-semibold">$${m.saldoCost.toFixed(4)}</span>`
                : (lotesHtml || `<span class="font-mono text-xs font-semibold">$${m.saldoCost.toFixed(4)}</span>`);
        }
    });

    const tfootEntQty = document.getElementById('kardex-tfoot-ent-qty');
    const tfootEntVal = document.getElementById('kardex-tfoot-ent-val');
    const tfootSalQty = document.getElementById('kardex-tfoot-sal-qty');
    const tfootSalVal = document.getElementById('kardex-tfoot-sal-val');
    const tfootSaldoQty = document.getElementById('kardex-tfoot-saldo-qty');
    const tfootSaldoVal = document.getElementById('kardex-tfoot-saldo-val');

    if (tfootEntQty) tfootEntQty.textContent = totalEntradasQty;
    if (tfootEntVal) tfootEntVal.textContent = '$' + totalEntradasVal.toFixed(2);
    if (tfootSalQty) tfootSalQty.textContent = totalSalidasQty;
    if (tfootSalVal) tfootSalVal.textContent = '$' + totalSalidasVal.toFixed(2);
    if (tfootSaldoQty) tfootSaldoQty.textContent = totalQty;
    if (tfootSaldoVal) tfootSaldoVal.textContent = '$' + totalVal.toFixed(2);

    updateDashboardMetrics(totalQty, totalVal, avgCost, totalSalidasVal, movesCount, sheet);
}

function calculateAndRenderKardex() {
    const totals = recalculateKardexData();
    if (!totals) return;
    renderTable(totals.totalEntradasQty, totals.totalEntradasVal, totals.totalSalidasQty, totals.totalSalidasVal, totals.totalQty, totals.totalVal);
    updateDashboardMetrics(totals.totalQty, totals.totalVal, totals.avgCost, totals.totalSalidasVal, totals.movesCount, totals.sheet);
}

// === RENDERIZADO DE LA TABLA KARDEX (ESTÁNDAR FORMAL EL SALVADOR) ===
function renderTable(totalEntradasQty = 0, totalEntradasVal = 0, totalSalidasQty = 0, totalSalidasVal = 0, saldoFinalQty = 0, saldoFinalVal = 0) {
    const tbody = document.getElementById('kardex-table-body');
    const tfoot = document.getElementById('kardex-table-foot');
    const emptyState = document.getElementById('kardex-empty-state');
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!tbody || !sheet) return;

    // Preservar foco activo antes de limpiar
    let activeFocusMeta = null;
    if (document.activeElement && tbody.contains(document.activeElement)) {
        const el = document.activeElement;
        activeFocusMeta = {
            rowIdx: el.getAttribute('data-row-idx'),
            field: el.getAttribute('data-field'),
            selStart: el.selectionStart,
            selEnd: el.selectionEnd
        };
    }

    // Limpiar popovers flotantes de GlassSelect/GlassDatePicker pertenecientes a filas previas
    tbody.querySelectorAll('select, input[type="date"]').forEach(el => {
        if (el._glassSelectInstance && el._glassSelectInstance.popover) {
            el._glassSelectInstance.popover.remove();
        }
    });

    tbody.innerHTML = '';
    const moves = sheet.movements || [];

    if (moves.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (tfoot) tfoot.innerHTML = '';
        return;
    }
    if (emptyState) emptyState.classList.add('hidden');

    const isPractice = (kardexWorkMode === 'practica');
    const method = sheet.method || 'promedio';
    const isAudit = !!window.isAuditMode;
    const disAttr = isAudit ? 'disabled' : '';

    moves.forEach((m, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all divide-x divide-slate-100 dark:divide-slate-750 text-slate-700 dark:text-slate-200';
        tr.id = `kardex-row-${idx}`;

        const isEntry = (m.tipo === 'inicial' || m.tipo === 'compra' || m.tipo === 'importacion' || m.tipo === 'dev_venta');
        const isExit  = (m.tipo === 'venta' || m.tipo === 'consumo' || m.tipo === 'merma' || m.tipo === 'dev_compra' || m.tipo === 'ajuste');

        const lotesHtml = buildLotesHtml(m, method);

        tr.innerHTML = `
            <!-- 1. Fecha -->
            <td class="p-2 text-center w-28">
                <input type="date" data-row-idx="${idx}" data-field="fecha" value="${escAttr(m.fecha || '')}" ${disAttr} onchange="updateKardexField(${idx}, 'fecha', this.value)" class="kardex-input text-center font-mono font-medium text-[11px] text-slate-800 dark:text-slate-200">
            </td>

            <!-- 2. Comprobante Legal (Tipo + Número) Art. 142-A -->
            <td class="p-2 w-44">
                <div class="flex items-center gap-1.5">
                    <select data-row-idx="${idx}" data-field="docTipo" ${disAttr} onchange="updateKardexField(${idx}, 'docTipo', this.value)" class="bg-slate-100 dark:bg-slate-750 border border-slate-200 dark:border-slate-650 rounded-lg px-2 py-1 font-bold text-[10px] text-slate-700 dark:text-slate-200 outline-none focus:border-sky-400 cursor-pointer">
                        <option value="CCF" ${m.docTipo === 'CCF' ? 'selected' : ''}>CCF</option>
                        <option value="FAC" ${m.docTipo === 'FAC' ? 'selected' : ''}>FAC</option>
                        <option value="NC" ${m.docTipo === 'NC' ? 'selected' : ''}>N.Créd</option>
                        <option value="ND" ${m.docTipo === 'ND' ? 'selected' : ''}>N.Déb</option>
                        <option value="DGA" ${m.docTipo === 'DGA' ? 'selected' : ''}>Aduana</option>
                        <option value="REQ" ${m.docTipo === 'REQ' ? 'selected' : ''}>Req.Int</option>
                        <option value="INV-INI" ${m.docTipo === 'INV-INI' ? 'selected' : ''}>Inv.Ini</option>
                    </select>
                    <input type="text" data-row-idx="${idx}" data-field="docNum" value="${escAttr(m.docNum || '')}" ${disAttr} onchange="updateKardexField(${idx}, 'docNum', this.value)" class="kardex-input font-mono font-bold text-[11px] flex-1 text-slate-800 dark:text-white" placeholder="N.° Folio...">
                </div>
            </td>

            <!-- 3. Operación y Detalle -->
            <td class="p-2 min-w-[200px]">
                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full ${isEntry ? 'bg-emerald-500' : 'bg-rose-500'} shrink-0" title="${isEntry ? 'Entrada de Inventario' : 'Salida de Inventario'}"></span>
                        <select data-row-idx="${idx}" data-field="tipo" ${disAttr} onchange="updateKardexField(${idx}, 'tipo', this.value)" class="w-full bg-slate-100 dark:bg-slate-750 border border-slate-200 dark:border-slate-650 rounded-lg px-2 py-1 font-bold text-[10px] uppercase text-slate-700 dark:text-slate-200 outline-none focus:border-sky-400 cursor-pointer">
                            <optgroup label="Entradas de Stock">
                                <option value="compra" ${m.tipo === 'compra' ? 'selected' : ''}>Compra Nacional (s/IVA)</option>
                                <option value="inicial" ${m.tipo === 'inicial' ? 'selected' : ''}>Inventario Inicial</option>
                                <option value="importacion" ${m.tipo === 'importacion' ? 'selected' : ''}>Importación (Retaceo DGA)</option>
                                <option value="dev_venta" ${m.tipo === 'dev_venta' ? 'selected' : ''}>Devolución s/Venta (Cliente)</option>
                            </optgroup>
                            <optgroup label="Salidas de Stock">
                                <option value="venta" ${m.tipo === 'venta' ? 'selected' : ''}>Venta de Mercadería</option>
                                <option value="consumo" ${m.tipo === 'consumo' ? 'selected' : ''}>Envío a Producción / Consumo</option>
                                <option value="dev_compra" ${m.tipo === 'dev_compra' ? 'selected' : ''}>Devolución s/Compra (Proveedor)</option>
                                <option value="merma" ${m.tipo === 'merma' ? 'selected' : ''}>Merma / Desperdicio Justificado</option>
                                <option value="ajuste" ${m.tipo === 'ajuste' ? 'selected' : ''}>Ajuste de Conteo Físico</option>
                            </optgroup>
                        </select>
                    </div>
                    <input type="text" data-row-idx="${idx}" data-field="detalle" value="${escAttr(m.detalle || '')}" ${disAttr} onchange="updateKardexField(${idx}, 'detalle', this.value)" class="kardex-input text-left text-[11px] text-slate-600 dark:text-slate-300 italic" placeholder="Proveedor, cliente o justificación...">
                </div>
            </td>

            <!-- 4. ENTRADAS (COMPRAS/DEV.) -->
            <td class="p-2 bg-emerald-50/15 dark:bg-emerald-950/20 text-center w-20">
                ${isEntry ? `
                    <input type="number" data-row-idx="${idx}" data-field="cantidad" value="${m.cantidad || ''}" ${disAttr} onchange="updateKardexField(${idx}, 'cantidad', this.value)" class="kardex-input text-center font-mono font-bold text-xs" placeholder="0">
                ` : `
                    <span class="kardex-cell-dash">—</span>
                `}
            </td>
            <td class="p-2 bg-emerald-50/15 dark:bg-emerald-950/20 text-right w-24">
                ${isEntry ? `
                    <input type="number" step="0.0001" data-row-idx="${idx}" data-field="costoUnitario" value="${m.costoUnitario || ''}" ${disAttr} onchange="updateKardexField(${idx}, 'costoUnitario', this.value)" class="kardex-input text-right font-mono text-xs" placeholder="$0.00">
                ` : `
                    <span class="kardex-cell-dash">—</span>
                `}
            </td>
            <td id="kardex-ent-tot-${idx}" class="p-2 bg-emerald-50/25 dark:bg-emerald-950/30 text-right font-black font-mono text-emerald-600 dark:text-emerald-400 pr-3 w-28">
                ${isEntry ? '$' + m.entradaTotal.toFixed(2) : '<span class="kardex-cell-dash">—</span>'}
            </td>

            <!-- 5. SALIDAS (VENTAS/CONSUMOS) -->
            <td class="p-2 bg-rose-50/15 dark:bg-rose-950/20 text-center w-20">
                ${isExit ? `
                    <input type="number" id="kardex-qty-input-${idx}" data-row-idx="${idx}" data-field="cantidad" value="${m.cantidad || ''}" ${disAttr} onchange="updateKardexField(${idx}, 'cantidad', this.value)" class="kardex-input text-center font-mono font-bold text-xs" placeholder="0">
                ` : `
                    <span class="kardex-cell-dash">—</span>
                `}
            </td>
            <td class="p-2 bg-rose-50/15 dark:bg-rose-950/20 text-right w-24">
                ${isExit ? (
                    isPractice ? `
                        <input type="number" step="0.0001" id="user-salida-cost-${idx}" data-row-idx="${idx}" data-field="userSalidaCost" value="${m.userSalidaCost ?? ''}" ${disAttr} onchange="updateKardexField(${idx}, 'userSalidaCost', this.value)" class="kardex-input text-right font-mono text-xs bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200" placeholder="$0.0000">
                    ` : `
                        <span id="kardex-sal-cost-${idx}" class="font-mono text-xs text-slate-600 dark:text-slate-300 pr-1 block text-right">$${m.salidaCost.toFixed(4)}</span>
                    `
                ) : `
                    <span class="kardex-cell-dash">—</span>
                `}
            </td>
            <td id="kardex-sal-tot-${idx}" class="p-2 bg-rose-50/25 dark:bg-rose-950/30 text-right font-black font-mono text-rose-600 dark:text-rose-400 pr-3 w-28">
                ${isExit ? (
                    isPractice ? `
                        <input type="number" step="0.01" id="user-salida-total-${idx}" data-row-idx="${idx}" data-field="userSalidaTotal" value="${m.userSalidaTotal ?? ''}" ${disAttr} onchange="updateKardexField(${idx}, 'userSalidaTotal', this.value)" class="kardex-input text-right font-mono text-xs font-bold bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-rose-600 dark:text-rose-400" placeholder="$0.00">
                    ` : `
                        $${m.salidaTotal.toFixed(2)}
                    `
                ) : `
                    <span class="kardex-cell-dash">—</span>
                `}
            </td>

            <!-- 6. SALDOS / EXISTENCIAS EN BODEGA -->
            <td id="kardex-saldo-qty-${idx}" class="p-2 bg-sky-50/15 dark:bg-sky-950/20 text-center font-black font-mono text-slate-800 dark:text-white w-20">
                ${isPractice ? `
                    <input type="number" id="user-saldo-qty-${idx}" data-row-idx="${idx}" data-field="userSaldoQty" value="${m.userSaldoQty ?? ''}" ${disAttr} onchange="updateKardexField(${idx}, 'userSaldoQty', this.value)" class="kardex-input text-center font-mono font-bold text-xs bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-slate-800 dark:text-white" placeholder="0">
                ` : `
                    ${m.saldoQty}
                `}
            </td>
            <td id="kardex-saldo-cost-${idx}" class="p-2 bg-sky-50/15 dark:bg-sky-950/20 text-center text-slate-600 dark:text-slate-300 min-w-[130px]">
                ${method === 'promedio' ? `
                    <span class="font-mono text-xs font-semibold">$${m.saldoCost.toFixed(4)}</span>
                ` : `
                    ${lotesHtml || `<span class="font-mono text-xs font-semibold">$${m.saldoCost.toFixed(4)}</span>`}
                `}
            </td>
            <td id="kardex-saldo-tot-${idx}" class="p-2 bg-sky-50/25 dark:bg-sky-950/30 text-right font-black font-mono text-sky-600 dark:text-sky-400 pr-3 w-28">
                ${isPractice ? `
                    <input type="number" step="0.01" id="user-saldo-total-${idx}" data-row-idx="${idx}" data-field="userSaldoTotal" value="${m.userSaldoTotal ?? ''}" ${disAttr} onchange="updateKardexField(${idx}, 'userSaldoTotal', this.value)" class="kardex-input text-right font-mono text-xs font-bold bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-sky-600 dark:text-sky-400" placeholder="$0.00">
                ` : `
                    $${m.saldoTotal.toFixed(2)}
                `}
            </td>

            <!-- 7. ACCIONES -->
            <td class="p-2 text-center w-24 no-print">
                <div class="flex items-center justify-center gap-1">
                    ${isPractice ? `
                        <button onclick="auditSingleKardexRow(${idx})" class="w-7 h-7 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 flex items-center justify-center transition-all shadow-xs" title="Auditar mi cálculo en esta fila">
                            <i class="fas fa-check-double text-[10px]"></i>
                        </button>
                    ` : ''}
                    ${isExit ? `
                        <button onclick="showRowAsientoModal(${idx})" class="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 flex items-center justify-center transition-all shadow-xs" title="Ver Asiento de Costo de Ventas">
                            <i class="fas fa-receipt text-[10px]"></i>
                        </button>
                    ` : ''}
                    ${!isAudit ? `
                        <button onclick="deleteKardexRow(${idx})" class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-750 hover:bg-rose-50 hover:text-rose-600 text-slate-400 flex items-center justify-center transition-all shadow-xs" title="Eliminar este movimiento">
                            <i class="far fa-trash-alt text-[10px]"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });

    // Inicializar componentes flotantes Glassmorphic en la tabla Kardex
    if (typeof window.EduContaGlassSelect === 'function') {
        tbody.querySelectorAll('select:not([data-glass-select-initialized])').forEach(sel => {
            window.EduContaGlassSelect(sel, 'sky');
        });
    }
    if (typeof window.EduContaGlassDatePicker === 'function') {
        tbody.querySelectorAll('input[type="date"]:not([data-glass-date-initialized])').forEach(inp => {
            window.EduContaGlassDatePicker(inp, 'sky');
        });
    }
    if (isAudit) {
        tbody.querySelectorAll('.educonta-glass-select-trigger, .educonta-glass-date-trigger').forEach(btn => {
            btn.disabled = true;
            btn.classList.add('opacity-70', 'cursor-not-allowed', 'pointer-events-none');
        });
    }

    // Restaurar foco si existía
    if (activeFocusMeta && activeFocusMeta.rowIdx !== null && activeFocusMeta.field) {
        const target = tbody.querySelector(`[data-row-idx="${activeFocusMeta.rowIdx}"][data-field="${activeFocusMeta.field}"]`);
        if (target) {
            target.focus();
            if (typeof activeFocusMeta.selStart === 'number' && typeof target.setSelectionRange === 'function') {
                try { target.setSelectionRange(activeFocusMeta.selStart, activeFocusMeta.selEnd); } catch (_) {}
            }
        }
    }

    // Renderizar pie de totales del período
    if (tfoot) {
        tfoot.innerHTML = `
            <tr class="divide-x divide-slate-200 dark:divide-slate-700 text-slate-800 dark:text-slate-100 text-xs">
                <td colspan="3" class="p-3 text-right uppercase tracking-wider font-black text-[10.5px] bg-slate-100 dark:bg-slate-800">
                    <i class="fas fa-scale-balanced mr-1.5 text-sky-500"></i> TOTALES DEL PERÍODO (CIERRE CONTABLE):
                </td>
                
                <!-- Totales Entradas -->
                <td id="kardex-tfoot-ent-qty" class="p-2.5 text-center font-mono font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20">
                    ${totalEntradasQty}
                </td>
                <td class="p-2.5 text-center text-slate-400 bg-emerald-50/40 dark:bg-emerald-950/20">—</td>
                <td id="kardex-tfoot-ent-val" class="p-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 pr-3 bg-emerald-50/50 dark:bg-emerald-950/30">
                    $${totalEntradasVal.toFixed(2)}
                </td>

                <!-- Totales Salidas -->
                <td id="kardex-tfoot-sal-qty" class="p-2.5 text-center font-mono font-black text-rose-700 dark:text-rose-300 bg-rose-50/40 dark:bg-rose-950/20">
                    ${totalSalidasQty}
                </td>
                <td class="p-2.5 text-center text-slate-400 bg-rose-50/40 dark:bg-rose-950/20">—</td>
                <td id="kardex-tfoot-sal-val" class="p-2.5 text-right font-mono font-black text-rose-600 dark:text-rose-400 pr-3 bg-rose-50/50 dark:bg-rose-950/30" title="Costo Total de Ventas que se liquida a resultados">
                    $${totalSalidasVal.toFixed(2)}
                </td>

                <!-- Totales Saldos (Existencia final) -->
                <td id="kardex-tfoot-saldo-qty" class="p-2.5 text-center font-mono font-black text-sky-700 dark:text-sky-300 bg-sky-50/40 dark:bg-sky-950/20">
                    ${saldoFinalQty}
                </td>
                <td class="p-2.5 text-center font-mono text-[9.5px] text-slate-500 bg-sky-50/40 dark:bg-sky-950/20 font-bold uppercase">
                    Existencia Final
                </td>
                <td id="kardex-tfoot-saldo-val" class="p-2.5 text-right font-mono font-black text-sky-600 dark:text-sky-400 pr-3 bg-sky-50/50 dark:bg-sky-950/30" title="Valor del Inventario Final para el Balance General">
                    $${saldoFinalVal.toFixed(2)}
                </td>

                <!-- Acciones en tfoot -->
                <td class="p-2 text-center no-print bg-slate-100 dark:bg-slate-800">
                    <button onclick="openPartidaCostoModal()" class="px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 hover:bg-indigo-200 text-indigo-700 dark:text-indigo-300 text-[9.5px] font-black uppercase transition-all flex items-center justify-center gap-1 mx-auto" title="Generar Asiento Contable del Costo de Ventas">
                        <i class="fas fa-book-bookmark"></i> Asiento
                    </button>
                </td>
            </tr>
        `;
    }
}

// === CONTROLES E INPUTS DENTRO DE LA TABLA ===
window.addKardexRow = function() {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    const moves = sheet.movements || [];
    const lastMove = moves[moves.length - 1];
    const defaultDate = lastMove ? lastMove.fecha : new Date().toISOString().split('T')[0];

    moves.push({
        fecha: defaultDate,
        docTipo: 'CCF',
        docNum: '',
        detalle: 'Compra Local',
        tipo: 'compra',
        cantidad: 0,
        costoUnitario: 0,
        userSalidaCost: null,
        userSalidaTotal: null,
        userSaldoQty: null,
        userSaldoTotal: null
    });

    calculateAndRenderKardex();
    saveState();
};

window.deleteKardexRow = function(idx) {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;
    sheet.movements.splice(idx, 1);
    calculateAndRenderKardex();
    saveState();
};

window.updateKardexField = function(idx, field, value) {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    const move = sheet.movements[idx];
    if (!move) return;

    const targetOp = field === 'tipo' ? value : move.tipo;
    const isTargetExit = (targetOp === 'venta' || targetOp === 'consumo' || targetOp === 'merma' || targetOp === 'dev_compra' || targetOp === 'ajuste');
    const availBefore = idx > 0 ? (sheet.movements[idx - 1].saldoQty ?? 0) : 0;

    if (field === 'cantidad' || field === 'costoUnitario' || field === 'userSalidaCost' || field === 'userSalidaTotal' || field === 'userSaldoQty' || field === 'userSaldoTotal') {
        let parsed = value === '' ? null : (parseFloat(value) || 0);
        if (field === 'cantidad' && isTargetExit && parsed !== null && parsed > availBefore) {
            showKardexToast(`Stock insuficiente en fila ${idx + 1}: intentas dar salida a ${parsed} uds, pero solo hay ${availBefore} uds disponibles.`, 'error');
            parsed = availBefore;
            const qtyInp = document.getElementById(`kardex-qty-input-${idx}`);
            if (qtyInp) qtyInp.value = availBefore || '';
        }
        move[field] = parsed;
    } else {
        move[field] = value;
    }

    if (field === 'tipo') {
        if (isTargetExit && (parseFloat(move.cantidad) || 0) > availBefore) {
            showKardexToast(`Stock insuficiente en fila ${idx + 1}: cantidad ajustada al máximo disponible (${availBefore} uds).`, 'warning');
            move.cantidad = availBefore;
        }
        // Asignar comprobante legal típico por defecto
        if (value === 'compra') { move.docTipo = 'CCF'; move.detalle = 'Compra según Crédito Fiscal'; }
        else if (value === 'importacion') { move.docTipo = 'DGA'; move.detalle = 'Importación con Retaceo DGA'; }
        else if (value === 'dev_compra') { move.docTipo = 'NC'; move.detalle = 'Devolución sobre Compra'; }
        else if (value === 'venta') { move.docTipo = 'FAC'; move.detalle = 'Venta de Mercaderías'; }
        else if (value === 'dev_venta') { move.docTipo = 'NC'; move.detalle = 'Devolución de Cliente'; }
        else if (value === 'consumo') { move.docTipo = 'REQ'; move.detalle = 'Despacho a Producción'; }
        else if (value === 'merma') { move.docTipo = 'REQ'; move.detalle = 'Merma Justificada en Bodega'; }
        calculateAndRenderKardex();
    } else {
        const totals = recalculateKardexData();
        updateKardexDOMValues(totals);
    }

    saveState();
};

// === ASISTENTE MODAL: REGISTRAR NUEVO MOVIMIENTO GUIADO ===
window.openNewMovementModal = function() {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    const moves = sheet.movements || [];
    const lastMove = moves[moves.length - 1];
    const defaultDate = lastMove ? lastMove.fecha : new Date().toISOString().split('T')[0];

    const fechaInp = document.getElementById('new-mov-fecha');
    const tipoSel = document.getElementById('new-mov-tipo');
    const docTipoSel = document.getElementById('new-mov-doctipo');

    if (fechaInp) fechaInp.value = defaultDate;
    if (tipoSel) tipoSel.value = 'compra';
    if (docTipoSel) docTipoSel.value = 'CCF';
    document.getElementById('new-mov-docnum').value = '';
    document.getElementById('new-mov-qty').value = '';
    document.getElementById('new-mov-cost').value = '';
    document.getElementById('new-mov-detalle').value = 'Compra de mercadería según Crédito Fiscal';

    onNewMovementTypeChange();
    if (tipoSel && tipoSel._glassSelectInstance) tipoSel._glassSelectInstance.refresh();
    if (docTipoSel && docTipoSel._glassSelectInstance) docTipoSel._glassSelectInstance.refresh();
    document.getElementById('new-movement-modal').style.display = 'flex';
};

window.closeNewMovementModal = function() {
    const md = document.getElementById('new-movement-modal');
    if (md) md.style.display = 'none';
};

window.onNewMovementTypeChange = function() {
    const tipo = document.getElementById('new-mov-tipo').value;
    const docTipoSelect = document.getElementById('new-mov-doctipo');
    const costGroup = document.getElementById('new-mov-cost-group');
    const costInput = document.getElementById('new-mov-cost');
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    const isExit = (tipo === 'venta' || tipo === 'consumo' || tipo === 'merma' || tipo === 'dev_compra' || tipo === 'ajuste');

    if (isExit) {
        costGroup.classList.add('opacity-60');
        costInput.disabled = true;
        // Mostrar costo vigente estimado como referencia
        const moves = sheet?.movements || [];
        const lastMove = moves[moves.length - 1];
        const currentAvg = lastMove ? lastMove.saldoCost : 0;
        costInput.value = currentAvg > 0 ? currentAvg.toFixed(4) : '0.0000';
    } else {
        costGroup.classList.remove('opacity-60');
        costInput.disabled = false;
        costInput.value = '';
    }

    // Asignar comprobante y detalle sugerido
    if (tipo === 'compra') { docTipoSelect.value = 'CCF'; document.getElementById('new-mov-detalle').value = 'Compra según Crédito Fiscal'; }
    else if (tipo === 'inicial') { docTipoSelect.value = 'INV-INI'; document.getElementById('new-mov-detalle').value = 'Inventario Inicial de Apertura'; }
    else if (tipo === 'importacion') { docTipoSelect.value = 'DGA'; document.getElementById('new-mov-detalle').value = 'Importación con Declaración de Mercancías DGA'; }
    else if (tipo === 'venta') { docTipoSelect.value = 'FAC'; document.getElementById('new-mov-detalle').value = 'Venta de mercadería'; }
    else if (tipo === 'dev_venta') { docTipoSelect.value = 'NC'; document.getElementById('new-mov-detalle').value = 'Devolución de mercadería por cliente'; }
    else if (tipo === 'dev_compra') { docTipoSelect.value = 'NC'; document.getElementById('new-mov-detalle').value = 'Devolución de mercadería a proveedor'; }
    else if (tipo === 'consumo') { docTipoSelect.value = 'REQ'; document.getElementById('new-mov-detalle').value = 'Requisición a bodega para consumo'; }
    else if (tipo === 'merma') { docTipoSelect.value = 'REQ'; document.getElementById('new-mov-detalle').value = 'Merma justificada en inventario'; }

    if (docTipoSelect && docTipoSelect._glassSelectInstance) {
        docTipoSelect._glassSelectInstance.refresh();
    }
    updateNewMovementPreview();
};

window.updateNewMovementPreview = function() {
    const qty = parseFloat(document.getElementById('new-mov-qty').value) || 0;
    const cost = parseFloat(document.getElementById('new-mov-cost').value) || 0;
    const total = qty * cost;
    const previewEl = document.getElementById('new-mov-preview-total');
    if (previewEl) previewEl.innerText = `$${total.toFixed(2)}`;
};

window.saveNewMovement = function() {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    const fecha = document.getElementById('new-mov-fecha').value || new Date().toISOString().split('T')[0];
    const tipo = document.getElementById('new-mov-tipo').value;
    const docTipo = document.getElementById('new-mov-doctipo').value;
    const docNum = document.getElementById('new-mov-docnum').value.trim();
    const qty = parseFloat(document.getElementById('new-mov-qty').value) || 0;
    const cost = parseFloat(document.getElementById('new-mov-cost').value) || 0;
    const detalle = document.getElementById('new-mov-detalle').value.trim() || 'Movimiento de inventario';

    if (qty <= 0) {
        alert("Por favor ingresa una cantidad de unidades válida mayor a cero.");
        return;
    }

    const isExit = (tipo === 'venta' || tipo === 'consumo' || tipo === 'merma' || tipo === 'dev_compra' || tipo === 'ajuste');
    if (isExit) {
        const moves = sheet.movements || [];
        const availQty = moves.length > 0 ? (moves[moves.length - 1].saldoQty ?? 0) : 0;
        if (qty > availQty) {
            showKardexToast(`Stock insuficiente: intentas dar salida a ${qty} uds, pero solo hay ${availQty} uds disponibles en bodega.`, 'error');
            return;
        }
    }

    sheet.movements.push({
        fecha,
        docTipo,
        docNum,
        detalle,
        tipo,
        cantidad: qty,
        costoUnitario: cost,
        userSalidaCost: null,
        userSalidaTotal: null,
        userSaldoQty: null,
        userSaldoTotal: null
    });

    calculateAndRenderKardex();
    saveState();
    closeNewMovementModal();

    if (typeof window.showSyncToast === 'function') {
        window.showSyncToast('success', 'Movimiento registrado con éxito en Kardex');
    }
};

// === AUDITORÍA PEDAGÓGICA Y RETROALIMENTACIÓN (MODO PRÁCTICA) ===
window.auditSingleKardexRow = function(idx) {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;
    const m = sheet.movements[idx];
    if (!m) return;

    const method = sheet.method || 'promedio';
    const isExit = (m.tipo === 'venta' || m.tipo === 'consumo' || m.tipo === 'merma' || m.tipo === 'dev_compra' || m.tipo === 'ajuste');

    let errors = [];

    // Validar Salida si aplica
    if (isExit) {
        if (m.userSalidaTotal === null || m.userSalidaTotal === undefined) {
            errors.push("Falta ingresar el Total de Salida ($).");
        } else if (Math.abs(m.userSalidaTotal - m.salidaTotal) > 0.05) {
            errors.push(`El Total de Salida ingresado ($${m.userSalidaTotal.toFixed(2)}) no coincide con el cálculo exacto ($${m.salidaTotal.toFixed(2)}).`);
        }
    }

    // Validar Saldos
    if (m.userSaldoQty === null || m.userSaldoQty === undefined) {
        errors.push("Falta ingresar la Cantidad en Saldo (existencias).");
    } else if (Math.abs(m.userSaldoQty - m.saldoQty) > 0.01) {
        errors.push(`Las existencias en saldo (${m.userSaldoQty}) difieren del saldo teórico (${m.saldoQty}).`);
    }

    if (m.userSaldoTotal === null || m.userSaldoTotal === undefined) {
        errors.push("Falta ingresar el Total Monetario en Saldo ($).");
    } else if (Math.abs(m.userSaldoTotal - m.saldoTotal) > 0.05) {
        errors.push(`El Saldo monetario ($${m.userSaldoTotal.toFixed(2)}) no coincide con el valor exacto ($${m.saldoTotal.toFixed(2)}).`);
    }

    // Mostrar feedback
    const rowEl = document.getElementById(`kardex-row-${idx}`);
    if (errors.length === 0) {
        if (rowEl) {
            rowEl.classList.add('cell-practice-correct');
            rowEl.classList.remove('cell-practice-incorrect');
        }
        openKardexHintModal(
            "¡Cálculo Correcto! (Nivel 4 / 5)",
            `<div class="text-emerald-700 dark:text-emerald-300 font-bold">
                <i class="fas fa-check-circle mr-1 text-emerald-500"></i> ¡Excelente trabajo!
             </div>
             <p class="mt-2 text-slate-600 dark:text-slate-300">
                Has aplicado perfectamente el método <strong>${method === 'promedio' ? 'Promedio Ponderado' : 'PEPS'}</strong> según las exigencias del Art. 143 del Código Tributario de El Salvador. Tus existencias y costos están 100% cuadrados.
             </p>`
        );
    } else {
        if (rowEl) {
            rowEl.classList.add('cell-practice-incorrect');
            rowEl.classList.remove('cell-practice-correct');
        }

        let hint = "";
        if (method === 'promedio') {
            hint = `<p class="mt-2 text-[11px] bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                <strong>Fórmula de Costo Promedio Ponderado:</strong><br>
                Nuevo Costo Unitario = (Saldo Total Anterior $ + Entrada Total $) / (Saldo Cantidad Anterior + Cantidad Entrada).<br>
                Toda salida se valúa al costo promedio vigente en la fila inmediata anterior.
            </p>`;
        } else {
            hint = `<p class="mt-2 text-[11px] bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                <strong>Regla de Valuación PEPS (FIFO):</strong><br>
                Debes agotar en primer lugar las unidades que ingresaron en los lotes o compras más antiguas. Si la venta supera la cantidad del primer lote, tomas la diferencia del siguiente lote al costo de ese segundo lote.
            </p>`;
        }

        openKardexHintModal(
            "Observación en la Fila " + (idx + 1),
            `<div class="text-rose-600 dark:text-rose-400 font-bold mb-2">
                <i class="fas fa-triangle-exclamation mr-1"></i> Se detectaron las siguientes discrepancias:
             </div>
             <ul class="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-200 text-xs">
                ${errors.map(err => `<li>${err}</li>`).join('')}
             </ul>
             ${hint}`
        );
    }
};

window.auditAllKardexRows = function() {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet || !sheet.movements || sheet.movements.length === 0) {
        alert("No hay movimientos registrados para auditar.");
        return;
    }

    let totalPoints = 0;
    let maxPoints = 0;

    sheet.movements.forEach((m, idx) => {
        const isExit = (m.tipo === 'venta' || m.tipo === 'consumo' || m.tipo === 'merma' || m.tipo === 'dev_compra' || m.tipo === 'ajuste');
        
        // Criterio de Salida
        if (isExit) {
            maxPoints++;
            if (m.userSalidaTotal !== null && Math.abs(m.userSalidaTotal - m.salidaTotal) <= 0.05) totalPoints++;
        }
        // Criterio de Existencias
        maxPoints++;
        if (m.userSaldoQty !== null && Math.abs(m.userSaldoQty - m.saldoQty) <= 0.01) totalPoints++;

        // Criterio de Saldo Total
        maxPoints++;
        if (m.userSaldoTotal !== null && Math.abs(m.userSaldoTotal - m.saldoTotal) <= 0.05) totalPoints++;
    });

    const porcentaje = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 100;
    let nivelLogro = 1;
    let nota = ((porcentaje / 100) * 10).toFixed(1);

    if (porcentaje >= 90) nivelLogro = 5;
    else if (porcentaje >= 70) nivelLogro = 4;
    else if (porcentaje >= 60) nivelLogro = 3;
    else if (porcentaje >= 30) nivelLogro = 2;
    else nivelLogro = 1;

    openKardexHintModal(
        "Auditoría Integral del Kardex",
        `<div class="text-center p-3">
            <div class="text-3xl font-black ${porcentaje >= 70 ? 'text-emerald-500' : 'text-amber-500'} mb-1">${porcentaje}% de Acierto</div>
            <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Nota Estimada: ${nota} / 10.0 • Nivel de Logro MINED: <strong>Nivel ${nivelLogro}</strong></p>
            <div class="text-left text-xs p-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                ${porcentaje >= 70 
                    ? '<p class="text-emerald-600 dark:text-emerald-400 font-bold"><i class="fas fa-medal mr-1"></i> ¡Competencia Alcanzada! Eres capaz de registrar y valuar inventarios de forma autónoma (Nivel 4 requerido para promoción técnica contable).</p>'
                    : '<p class="text-amber-600 dark:text-amber-400 font-bold"><i class="fas fa-rotate mr-1"></i> Necesitas reforzar el cálculo de saldos y prorrateos antes de alcanzar el 70% de aprobación técnica.</p>'
                }
            </div>
         </div>`
    );
};

function openKardexHintModal(title, htmlBody) {
    document.getElementById('hint-modal-title').innerText = title;
    document.getElementById('hint-modal-body').innerHTML = htmlBody;
    document.getElementById('kardex-hint-modal').style.display = 'flex';
}

window.closeKardexHintModal = function() {
    const md = document.getElementById('kardex-hint-modal');
    if (md) md.style.display = 'none';
};

// === RETACEO DE IMPORTACIONES (BTVAC 1.5 y 3.4) ===
window.openRetaceoModal = function() {
    const md = document.getElementById('retaceo-modal');
    if (md) {
        md.style.display = 'flex';
        calculateRetaceo();
    }
};

window.closeRetaceoModal = function() {
    const md = document.getElementById('retaceo-modal');
    if (md) md.style.display = 'none';
};

window.calculateRetaceo = function() {
    const qty = parseFloat(document.getElementById('ret-qty').value) || 0;
    const fobUnit = parseFloat(document.getElementById('ret-fob-unit').value) || 0;
    const flete = parseFloat(document.getElementById('ret-flete').value) || 0;
    const seguro = parseFloat(document.getElementById('ret-seguro').value) || 0;
    const daiRate = parseFloat(document.getElementById('ret-dai-rate').value) || 0;
    const otrosGastos = parseFloat(document.getElementById('ret-aduanales').value) || 0;

    const fobTotal = qty * fobUnit;
    const cifTotal = fobTotal + flete + seguro;
    const daiMonto = cifTotal * daiRate;
    const costoTotalImportacion = cifTotal + daiMonto + otrosGastos;
    const costoUnitarioNacionalizado = qty > 0 ? (costoTotalImportacion / qty) : 0;

    document.getElementById('ret-res-fob').innerText = `$${fobTotal.toFixed(2)}`;
    document.getElementById('ret-res-cif').innerText = `$${cifTotal.toFixed(2)}`;
    document.getElementById('ret-res-dai').innerText = `$${daiMonto.toFixed(2)}`;
    document.getElementById('ret-res-total').innerText = `$${costoTotalImportacion.toFixed(2)}`;
    document.getElementById('ret-res-unit').innerText = `$${costoUnitarioNacionalizado.toFixed(4)}`;

    tempRetaceoCalculated = {
        qty,
        costoUnitario: costoUnitarioNacionalizado,
        fobTotal,
        cifTotal,
        daiMonto,
        costoTotalImportacion
    };
};

window.applyRetaceoToKardex = function() {
    if (window.isAuditMode) return;
    if (!tempRetaceoCalculated || tempRetaceoCalculated.qty <= 0) {
        alert("Por favor completa los campos del retaceo con cantidad y costos válidos.");
        return;
    }

    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    sheet.movements.push({
        fecha: new Date().toISOString().split('T')[0],
        docTipo: 'DGA',
        docNum: `DM-${Math.floor(1000 + Math.random() * 9000)}`,
        detalle: `Importación Definitiva (FOB $${tempRetaceoCalculated.fobTotal.toFixed(2)} + CIF + DAI)`,
        tipo: 'importacion',
        cantidad: tempRetaceoCalculated.qty,
        costoUnitario: tempRetaceoCalculated.costoUnitario,
        userSalidaCost: null,
        userSalidaTotal: null,
        userSaldoQty: null,
        userSaldoTotal: null
    });

    calculateAndRenderKardex();
    saveState();
    closeRetaceoModal();

    if (typeof window.showSyncToast === 'function') {
        window.showSyncToast('success', 'Entrada por importación agregada al Kardex');
    }
};

// === PARTIDA CONTABLE DE COSTO DE VENTAS ===
window.openPartidaCostoModal = function() {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    // Calcular el total de costo de salidas registradas
    const moves = sheet.movements || [];
    let totalCostoSalidas = 0;
    moves.forEach(m => {
        const isExit = (m.tipo === 'venta' || m.tipo === 'consumo' || m.tipo === 'merma' || m.tipo === 'dev_compra' || m.tipo === 'ajuste');
        if (isExit) totalCostoSalidas += (m.salidaTotal || 0);
    });

    renderPartidaCostoPreview(totalCostoSalidas, sheet.name, 'PERÍODO COMPLETO');
    document.getElementById('partida-costo-modal').style.display = 'flex';
};

window.showRowAsientoModal = function(idx) {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;
    const m = sheet.movements[idx];
    if (!m) return;

    renderPartidaCostoPreview(m.salidaTotal, sheet.name, `OPERACIÓN ${m.docTipo} ${m.docNum}`);
    document.getElementById('partida-costo-modal').style.display = 'flex';
};

let lastPartidaCostoData = null;

function renderPartidaCostoPreview(monto, articulo, conceptoRef) {
    const container = document.getElementById('partida-costo-preview');
    if (!container) return;

    const fechaHoy = new Date().toISOString().split('T')[0];
    const montoFmt = (monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const safeArticulo = escapeHtml(articulo);
    const safeConceptoRef = escapeHtml(conceptoRef);
    lastPartidaCostoData = { monto, articulo, conceptoRef, fechaHoy };

    container.innerHTML = `
        <div class="flex justify-between border-b border-slate-300 dark:border-slate-600 pb-2">
            <div>
                <span class="font-bold text-slate-800 dark:text-white">PARTIDA DE DIARIO N.° [X]</span>
                <p class="text-[10px] text-slate-500">Fecha: ${fechaHoy}</p>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">CUADRADA</span>
        </div>

        <table class="w-full text-left mt-2">
            <thead>
                <tr class="text-[10px] text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                    <th>Código</th>
                    <th>Cuenta / Concepto</th>
                    <th class="text-right">Debe</th>
                    <th class="text-right">Haber</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-700 text-[11px]">
                <tr>
                    <td class="font-bold text-sky-600">510101</td>
                    <td>
                        <span class="font-bold">COSTO DE VENTAS</span><br>
                        <span class="text-[10px] text-slate-400 pl-2">51010101 Mercaderías (${safeArticulo})</span>
                    </td>
                    <td class="text-right font-bold text-slate-800 dark:text-white">$${montoFmt}</td>
                    <td class="text-right text-slate-400">—</td>
                </tr>
                <tr>
                    <td class="font-bold text-indigo-600">110501</td>
                    <td>
                        <span class="font-bold pl-4">INVENTARIOS</span><br>
                        <span class="text-[10px] text-slate-400 pl-6">11050101 Producto Disponible</span>
                    </td>
                    <td class="text-right text-slate-400">—</td>
                    <td class="text-right font-bold text-slate-800 dark:text-white">$${montoFmt}</td>
                </tr>
                <tr class="font-black border-t-2 border-slate-800 dark:border-slate-300 text-xs">
                    <td colspan="2" class="text-right uppercase">Sumas Iguales:</td>
                    <td class="text-right text-emerald-600">$${montoFmt}</td>
                    <td class="text-right text-emerald-600">$${montoFmt}</td>
                </tr>
            </tbody>
        </table>

        <div class="mt-2 text-[10px] text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
            <strong>Concepto:</strong> V/ Registro de la liquidación del costo de ventas correspondiente a ${safeArticulo}, según movimientos de salida en Kardex (${safeConceptoRef}) bajo el Art. 142-A del Código Tributario.
        </div>
    `;
}

window.closePartidaCostoModal = function() {
    const md = document.getElementById('partida-costo-modal');
    if (md) md.style.display = 'none';
};

window.copyPartidaCostoToClipboard = function() {
    const container = document.getElementById('partida-costo-preview');
    if (!container) return;

    const textToCopy = container.innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert("¡Partida de Costo de Ventas copiada al portapapeles! Puedes pegarla en tu Libro Diario.");
    }).catch(() => {
        alert("No se pudo copiar automáticamente. Por favor selecciónala manualmente.");
    });
};

window.addPartidaCostoToDiario = function() {
    if (window.isAuditMode) return;
    if (!lastPartidaCostoData || lastPartidaCostoData.monto <= 0) {
        alert("No hay montos de salida para generar la partida de costo de ventas.");
        return;
    }
    const d = lastPartidaCostoData;
    const rows = [
        {
            cod: "510101",
            nom: `Costo de Ventas (Mercaderías - ${d.articulo})`,
            debe: d.monto.toFixed(2),
            haber: ""
        },
        {
            cod: "110501",
            nom: `Inventarios (Salida de Existencias Valuadas)`,
            debe: "",
            haber: d.monto.toFixed(2)
        }
    ];

    window.closePartidaCostoModal();

    if (window.EduContaBridgeToDiario) {
        window.EduContaBridgeToDiario.open({
            origen: 'Kardex (Costo de Ventas)',
            color: 'amber',
            icono: 'fa-boxes-stacked',
            titulo: `Costo de Ventas · ${d.articulo}`,
            subtitulo: `Liquidación de Salidas en Kardex (${d.conceptoRef})`,
            fecha: d.fechaHoy,
            glosa: `V/ Registro del costo de ventas correspondiente a ${d.articulo}, según movimientos de salida en Kardex (${d.conceptoRef}) conforme al Art. 142 del Código Tributario.`,
            rows: rows
        });
    }
};

window.addPartidaRetaceoToDiario = function() {
    if (window.isAuditMode) return;
    if (!tempRetaceoCalculated || tempRetaceoCalculated.costoTotalImportacion <= 0) {
        alert("Completa los campos del retaceo con valores válidos para generar la partida.");
        return;
    }
    const r = tempRetaceoCalculated;
    const sheet = proyecto_actual?.sheets?.[activeSheetIndex];
    const articulo = sheet?.name || 'Mercadería Importada';
    const fecha = new Date().toISOString().split('T')[0];

    // IVA Importaciones 13% sobre CIF + DAI (Art. 52 Ley de IVA)
    const ivaImportacion = Math.round((r.cifTotal + r.daiMonto) * 0.13 * 100) / 100;
    const desembolsoAduana = Math.round(((r.costoTotalImportacion - r.fobTotal) + ivaImportacion) * 100) / 100;

    const rows = [
        {
            cod: "110501",
            nom: `Inventarios / Mercaderías (${articulo} - Liquidación Retaceo DGA)`,
            debe: r.costoTotalImportacion.toFixed(2),
            haber: ""
        },
        {
            cod: "110801",
            nom: "IVA Crédito Fiscal (Importaciones DGA 13% s/ CIF+DAI)",
            debe: ivaImportacion.toFixed(2),
            haber: ""
        },
        {
            cod: "210102",
            nom: "Cuentas por Pagar Proveedores del Exterior (Factura Comercial FOB)",
            debe: "",
            haber: r.fobTotal.toFixed(2)
        },
        {
            cod: "110102",
            nom: "Bancos (Liquidación DAI, Flete, Seguro e IVA en Aduana)",
            debe: "",
            haber: desembolsoAduana.toFixed(2)
        }
    ];

    window.closeRetaceoModal();

    if (window.EduContaBridgeToDiario) {
        window.EduContaBridgeToDiario.open({
            origen: 'Retaceo de Importaciones (Kardex)',
            color: 'amber',
            icono: 'fa-ship',
            titulo: `Liquidación de Importación (Retaceo) · ${articulo}`,
            subtitulo: `Declaración Aduanera DGA • ${r.qty} unidades`,
            fecha: fecha,
            glosa: `V/ Liquidación de póliza aduanera y retaceo de importación de ${r.qty} uds de ${articulo}. Valor FOB $${r.fobTotal.toFixed(2)}, Flete + Seguro $${(r.cifTotal - r.fobTotal).toFixed(2)}, DAI $${r.daiMonto.toFixed(2)}, IVA Importación $${ivaImportacion.toFixed(2)}.`,
            rows: rows
        });
    }
};

// === ACTUALIZAR DASHBOARD Y ESTADO DE STOCK ===
function updateDashboardMetrics(totalQty, totalVal, avgCost, totalCogs, movesCount, sheet) {
    const valEl = document.getElementById('metric-total-value');
    const qtyEl = document.getElementById('metric-total-qty');
    const avgEl = document.getElementById('metric-avg-cost');
    const cogsEl = document.getElementById('metric-total-cogs');
    const statusEl = document.getElementById('metric-stock-status');
    const statusPill = document.getElementById('metric-stock-status-pill');
    const countBadge = document.getElementById('row-count-badge');

    if (valEl) valEl.innerText = `$${totalVal.toFixed(2)}`;
    if (qtyEl) qtyEl.innerText = totalQty;
    if (avgEl) avgEl.innerText = `$${avgCost.toFixed(4)}`;
    if (cogsEl) cogsEl.innerText = `$${totalCogs.toFixed(2)}`;
    if (countBadge) countBadge.innerText = `${movesCount} movimiento${movesCount === 1 ? '' : 's'}`;

    if (statusEl && sheet) {
        const min = sheet.minStock ?? 10;
        const reorder = sheet.reorderPoint ?? 25;
        const max = sheet.maxStock ?? 100;

        if (totalQty <= 0) {
            statusEl.innerText = "AGOTADO (STOCK CERO)";
            if (statusPill) statusPill.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse";
        } else if (totalQty < min) {
            statusEl.innerText = "⚠️ STOCK CRÍTICO";
            if (statusPill) statusPill.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800";
        } else if (totalQty <= reorder) {
            statusEl.innerText = "⚠️ PUNTO DE REORDEN";
            if (statusPill) statusPill.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800";
        } else if (totalQty > max) {
            statusEl.innerText = "⚠️ SOBRE-INVENTARIO";
            if (statusPill) statusPill.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800";
        } else {
            statusEl.innerText = "STOCK ÓPTIMO";
            if (statusPill) statusPill.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
        }
    }
}

// === PERSISTENCIA LOCAL Y NUBE ===
let _kardexSyncDebounce = null;

async function triggerKardexSupabaseSync(isManual = false) {
    if (window.isAuditMode || !proyecto_actual) return;
    const cloudIndicator = document.getElementById('cloud-indicator');

    if (!navigator.onLine) {
        if (cloudIndicator) {
            cloudIndicator.className = "flex items-center justify-center gap-1.5 w-full text-amber-600 font-black bg-amber-50 rounded-xl border border-amber-100";
            cloudIndicator.innerHTML = '<i class="fas fa-wifi-slash"></i> <span>OFFLINE</span>';
        }
        if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('offline');
        return;
    }

    if (typeof supabaseClient !== 'undefined') {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession().catch(() => ({ data: { session: null } }));
            if (session) {
                if (cloudIndicator) {
                    cloudIndicator.className = "flex items-center justify-center gap-1.5 w-full text-sky-600 font-black bg-sky-50 rounded-xl border border-sky-100 animate-pulse";
                    cloudIndicator.innerHTML = '<i class="fas fa-sync fa-spin"></i> <span>SINCRONIZANDO</span>';
                }
                
                if (typeof syncCurrentProjectWithSupabase === 'function') {
                    await syncCurrentProjectWithSupabase(proyecto_actual, session.user.id, true);
                }

                if (cloudIndicator) {
                    cloudIndicator.className = "flex items-center justify-center gap-1.5 w-full text-emerald-600 font-black bg-emerald-50 rounded-xl border border-emerald-100";
                    cloudIndicator.innerHTML = '<i class="fas fa-cloud-check"></i> <span>SINCRONIZADO</span>';
                }
                if (isManual && typeof window.showSyncToast === 'function') {
                    window.showSyncToast('success', 'Kardex respaldado con éxito');
                }
            } else {
                if (cloudIndicator) {
                    cloudIndicator.className = "flex items-center justify-center gap-1.5 w-full text-slate-500 font-black bg-slate-50 rounded-xl border border-slate-200";
                    cloudIndicator.innerHTML = '<i class="fas fa-hdd"></i> <span>SOLO LOCAL</span>';
                }
                if (isManual && typeof window.showSyncToast === 'function') {
                    window.showSyncToast('local', 'Guardado en este equipo');
                }
            }
        } catch (e) {
            console.error("Error sincronizando Kardex:", e);
            const errMsg = e.message || String(e);
            if (cloudIndicator) {
                cloudIndicator.className = "flex items-center justify-center gap-1.5 w-full text-rose-600 font-black bg-rose-50 rounded-xl border border-rose-100";
                cloudIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>ERROR SYNC</span>';
            }
            if (isManual && typeof window.showSyncToast === 'function') {
                window.showSyncToast('error', errMsg);
            }
        }
    } else {
        if (isManual && typeof window.showSyncToast === 'function') {
            window.showSyncToast('local', 'Guardado en este equipo');
        }
    }
}

async function saveState(isManual = false) {
    if (window.isAuditMode) return;
    if (!proyecto_actual) return;

    proyecto_actual.updatedAt = new Date().toISOString();

    const idx = projects.findIndex(p => p.id === proyecto_actual.id);
    if (idx !== -1) {
        projects[idx] = proyecto_actual;
    } else {
        projects.unshift(proyecto_actual);
    }

    localStorage.setItem('educonta_projects_kardex', JSON.stringify(projects));

    // Guardado local inmediato
    const saveIndicator = document.getElementById('save-indicator');
    if (saveIndicator) {
        saveIndicator.innerHTML = '<i class="fas fa-check-circle"></i> LOCAL';
        saveIndicator.className = "flex items-center justify-center gap-1.5 w-full text-emerald-600 font-black bg-emerald-50/80 rounded-xl border border-emerald-100";
    }

    if (_kardexSyncDebounce) clearTimeout(_kardexSyncDebounce);
    if (isManual) {
        await triggerKardexSupabaseSync(true);
    } else {
        _kardexSyncDebounce = setTimeout(() => {
            triggerKardexSupabaseSync(false);
        }, 3500);
    }
}

window.forceSave = function(quiet = false) {
    if (window.isAuditMode) return;
    return saveState(!quiet);
};

// Cerrar Proyecto
window.closeProject = function() {
    window.location.href = 'proyectos.html';
};

// Exportar a EDC Respaldo Shield
window.exportarProyectoEduConta = function() {
    if (!proyecto_actual) {
        alert('No hay un proyecto activo para exportar.');
        return;
    }

    const nombreProyecto = proyecto_actual.name || 'Proyecto_Kardex';

    const paqueteRespaldo = {
        identificador_app: "EDUCONTA_SV_OFFICIAL",
        version_formato: "2.0_KARDEX_CT",
        metadata: {
            nombre: nombreProyecto,
            fecha: new Date().toISOString(),
            usuario_origen: 'UsuarioLocal',
            catalogo: 'MAESTRO',
            sector: 'ALL'
        },
        cuerpo_contable: proyecto_actual
    };

    const blindarData = (str) => {
        const key = "EDC_SHIELD_2024";
        let output = "";
        for (let i = 0; i < str.length; i++) {
            output += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(unescape(encodeURIComponent(output)));
    };

    const jsonStr = JSON.stringify(paqueteRespaldo);
    const dataBlindada = blindarData(jsonStr);

    const blob = new Blob([dataBlindada], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombreProyecto.replace(/\s+/g, '_')}_Kardex_${new Date().toISOString().split('T')[0]}.edc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    if (typeof window.showSyncToast === 'function') {
        window.showSyncToast('success', 'Kardex exportado en formato protegido');
    }
};
