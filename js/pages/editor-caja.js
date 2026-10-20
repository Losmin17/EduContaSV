// =========================================================================
// CONTROL DE CAJA Y TESORERÍA — EduConta SV (BTVAC 1.1 y 1.5)
// =========================================================================

let projects = [];
let proyecto_actual = null;
let currentProjectId = null;
let modoDual = localStorage.getItem('educonta_caja_modo') || 'practica'; // 'asistido' | 'practica'
let autoSaveTimeout = null;

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (typeof injectSharedUI === 'function') {
            injectSharedUI('shared-components-root');
        }
    } catch (e) {
        console.warn("Shared UI error:", e);
    }

    // Cargar proyectos de la bóveda de Caja
    const rawProjects = localStorage.getItem('educonta_projects_caja');
    const lastProjectId = localStorage.getItem('educonta_last_project_id');

    if (rawProjects) {
        try { projects = JSON.parse(rawProjects); } catch (e) { projects = []; }
    }

    if (lastProjectId && projects.length > 0) {
        proyecto_actual = projects.find(p => p.id === lastProjectId);
    }

    // Si no hay proyecto de caja activo, crear uno por defecto o cargar el primero
    if (!proyecto_actual) {
        if (projects.length > 0) {
            proyecto_actual = projects[0];
            localStorage.setItem('educonta_last_project_id', proyecto_actual.id);
        } else {
            // Crear proyecto inicial con campos limpios
            const newId = 'proj_' + Date.now();
            proyecto_actual = {
                id: newId,
                name: 'Fondo Fijo de Administración',
                type: 'caja',
                catalogo: 'MAESTRO',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                data: {
                    empresa: '',
                    custodio: '',
                    fondoFijo: 0.00,
                    fecha: new Date().toISOString().split('T')[0],
                    hora: '',
                    tipoArqueo: 'ordinario',
                    efectivo: {},
                    docs: [],
                    corte: {
                        cajaNum: 'Caja 01 - Principal',
                        cajero: '',
                        fondoApertura: 0.00,
                        ventasGravadas: 0.00,
                        ivaDebito: 0.00,
                        salidas: 0.00,
                        efectivoReal: 0.00
                    }
                }
            };
            projects.unshift(proyecto_actual);
            localStorage.setItem('educonta_projects_caja', JSON.stringify(projects));
            localStorage.setItem('educonta_last_project_id', newId);
        }
    }

    currentProjectId = proyecto_actual.id;
    if (proyecto_actual) proyecto_actual.type = 'caja';
    localStorage.setItem('educonta_proyectos_active_tab', 'caja');

    // Poblar datos en la interfaz
    renderProjectMetadata();
    loadCajaDataIntoUI();
    setModoDual(modoDual);
    recalcArqueoCompleto();
    recalcCorteDiario();

    // Inicializar estado de sincronización en la nube
    if (!navigator.onLine) {
        updateSyncUI('offline');
    } else if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (session) updateSyncUI('success');
            else updateSyncUI('local');
        }).catch(() => updateSyncUI('local'));
    } else {
        updateSyncUI('local');
    }

    window.addEventListener('online', () => syncCajaCloud(false));
    window.addEventListener('offline', () => updateSyncUI('offline'));

    // Permitir clic en indicador de nube para forzar sincronización
    const cloudBtn = document.getElementById('cloud-indicator');
    if (cloudBtn) {
        cloudBtn.addEventListener('click', () => forceSaveCaja());
    }

    // Desvanecer preloader suavemente tras cargar datos y cálculos de caja
    if (typeof window.dismissGlobalPreloader === 'function') {
        window.dismissGlobalPreloader();
    }
});

// === RENDERIZADO DE METADATOS DEL PROYECTO ===
function renderProjectMetadata() {
    if (!proyecto_actual) return;
    const titleEl = document.getElementById('current-project-name');
    const mobileTitleEl = document.getElementById('mobile-project-name');
    if (titleEl) titleEl.innerText = proyecto_actual.name || 'Caja y Tesorería';
    if (mobileTitleEl) mobileTitleEl.innerText = proyecto_actual.name || 'Caja';
}

window.renameProjectInPlace = function () {
    const currentName = proyecto_actual ? proyecto_actual.name : '';
    const newName = prompt("Renombrar Proyecto de Caja:", currentName);
    if (newName && newName.trim() && newName !== currentName) {
        proyecto_actual.name = newName.trim();
        proyecto_actual.updatedAt = new Date().toISOString();
        renderProjectMetadata();
        saveCurrentCajaData(true);
    }
};

// === CONTROL DE PESTAÑAS DEL MÓDULO ===
let currentCajaTabIndex = 0;
let cajaSnapTimeout = null;
const CAJA_TABS = ['arqueo', 'corte', 'acta'];

function moveCajaTab(btn, newIndex, animate = true) {
    const pill = document.getElementById('caja-tab-indicator');
    if (!pill || !btn) return;

    if (cajaSnapTimeout) {
        clearTimeout(cajaSnapTimeout);
        cajaSnapTimeout = null;
    }

    if (btn.offsetWidth === 0) {
        requestAnimationFrame(() => {
            if (btn.offsetWidth > 0) moveCajaTab(btn, newIndex, animate);
        });
        return;
    }

    const distance = Math.abs(newIndex - currentCajaTabIndex);
    const stretch = (animate && distance > 0) ? (1 + Math.min(distance * 0.15, 0.35)) : 1;

    if (!animate) {
        pill.style.transition = 'none';
    }

    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.opacity = '1';

    if (animate && distance > 0) {
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(${stretch}) scaleY(0.9)`;
        cajaSnapTimeout = setTimeout(() => {
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

    currentCajaTabIndex = newIndex;
}
window.moveCajaTab = moveCajaTab;

window.switchCajaTab = function (tab) {
    const tabs = ['arqueo', 'corte', 'acta'];

    tabs.forEach(t => {
        const btn = document.getElementById(`tab-caja-${t}`);
        const view = document.getElementById(`view-caja-${t}`);
        if (btn) btn.classList.toggle('active', t === tab);
        if (view) {
            if (t === tab) {
                view.classList.remove('hidden');
                view.classList.add('block', 'fade-in');
            } else {
                view.classList.add('hidden');
                view.classList.remove('block', 'fade-in');
            }
        }
    });

    const activeBtn = document.getElementById(`tab-caja-${tab}`);
    if (activeBtn) {
        const idx = tabs.indexOf(tab);
        moveCajaTab(activeBtn, idx >= 0 ? idx : 0);
    }

    if (tab === 'acta') {
        syncActaPrintView();
    }
};

window.addEventListener('resize', () => {
    const activeBtn = document.querySelector('.caja-tab-btn.active');
    if (activeBtn) {
        const idx = activeBtn.dataset.idx ? parseInt(activeBtn.dataset.idx, 10) : 0;
        moveCajaTab(activeBtn, idx, false);
    }
});

// Inicializar posición de pestaña al cargar
const syncCajaIndicator = () => {
    const activeBtn = document.querySelector('.caja-tab-btn.active');
    if (activeBtn) {
        const idx = activeBtn.dataset.idx ? parseInt(activeBtn.dataset.idx, 10) : 0;
        moveCajaTab(activeBtn, idx, false);
    }
};
syncCajaIndicator();
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncCajaIndicator);
}

// === MODO DUAL (ASISTIDO / PRÁCTICA) ===
window.setModoDual = function (mode) {
    modoDual = (mode === 'asistido') ? 'asistido' : 'practica';
    localStorage.setItem('educonta_caja_modo', modoDual);
    const lbl = document.getElementById('lbl-modo-dual');
    const btn = document.getElementById('btn-toggle-mode');
    if (lbl) lbl.innerText = (modoDual === 'asistido') ? 'Asistido' : 'Práctica';
    if (btn) {
        if (modoDual === 'practica') {
            btn.className = "px-2.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-all flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40";
        } else {
            btn.className = "px-2.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-all flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40";
        }
    }
    recalcArqueoCompleto();
};

window.toggleModoDual = function () {
    const newMode = (modoDual === 'asistido') ? 'practica' : 'asistido';
    window.setModoDual(newMode);
};

// === CARGAR DATOS EN LA UI ===
function loadCajaDataIntoUI() {
    if (!proyecto_actual || !proyecto_actual.data) return;
    const d = proyecto_actual.data;

    // Parámetros
    const empInp = document.getElementById('arq-empresa');
    const custInp = document.getElementById('arq-custodio');
    const fondoInp = document.getElementById('arq-fondo-fijo');
    const fechaInp = document.getElementById('arq-fecha');
    const horaInp = document.getElementById('arq-hora');
    const tipoInp = document.getElementById('arq-tipo');

    if (empInp && d.empresa) empInp.value = d.empresa;
    if (custInp && d.custodio) custInp.value = d.custodio;
    if (fondoInp && d.fondoFijo !== undefined) fondoInp.value = d.fondoFijo;
    if (fechaInp) fechaInp.value = d.fecha || new Date().toISOString().split('T')[0];
    if (horaInp && d.hora) horaInp.value = d.hora;
    if (tipoInp && d.tipoArqueo) tipoInp.value = d.tipoArqueo;

    // Efectivo físico
    const cashData = d.efectivo || {};
    document.querySelectorAll('.arq-cash-inp, .arq-coin-inp').forEach(inp => {
        const den = inp.dataset.den;
        if (cashData[den] !== undefined) {
            inp.value = cashData[den];
        }
    });

    // Comprobantes
    const docsList = document.getElementById('arq-docs-list');
    if (docsList) {
        docsList.innerHTML = '';
        const docs = Array.isArray(d.docs) && d.docs.length > 0 ? d.docs : [];
        docs.forEach(doc => {
            renderDocRow(doc.desc, doc.tipo, doc.monto, doc.num, doc.prov);
        });
    }

    // Corte
    if (d.corte) {
        const c = d.corte;
        const cNum = document.getElementById('corte-caja-num');
        const cCaj = document.getElementById('corte-cajero-nombre');
        const cFond = document.getElementById('corte-fondo-apertura');
        const cGrav = document.getElementById('corte-ventas-gravadas');
        const cIva = document.getElementById('corte-iva-debito');
        const cSal = document.getElementById('corte-salidas');
        const cReal = document.getElementById('corte-real-contado');

        if (cNum && c.cajaNum) cNum.value = c.cajaNum;
        if (cCaj && c.cajero) cCaj.value = c.cajero;
        if (cFond && c.fondoApertura !== undefined) cFond.value = c.fondoApertura;
        if (cGrav && c.ventasGravadas !== undefined) cGrav.value = c.ventasGravadas;
        if (cIva && c.ivaDebito !== undefined) cIva.value = c.ivaDebito;
        if (cSal && c.salidas !== undefined) cSal.value = c.salidas;
        if (cReal && c.efectivoReal !== undefined) cReal.value = c.efectivoReal;
    }
}

// === COMPROBANTES DE GASTOS (FILAS DINÁMICAS) ===
window.addArqueoDocRow = function (desc = '', tipo = 'Factura', monto = 0, num = '', prov = '') {
    renderDocRow(desc, tipo, monto, num, prov);
    recalcArqueoCompleto();
    saveCurrentCajaData();
};

function renderDocRow(desc = '', tipo = 'Factura', monto = 0, num = '', prov = '') {
    const list = document.getElementById('arq-docs-list');
    if (!list) return;

    const row = document.createElement('div');
    row.className = 'arq-doc-row flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs';
    row.innerHTML = `
        <select class="arq-doc-tipo bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-[10px] font-extrabold text-slate-700 dark:text-white outline-none shrink-0" onchange="recalcArqueoCompleto(); saveCurrentCajaData();">
            <option value="Factura" ${tipo === 'Factura' ? 'selected' : ''}>Factura</option>
            <option value="CCF" ${tipo === 'CCF' ? 'selected' : ''}>CCF (Crédito Fiscal)</option>
            <option value="Recibo" ${tipo === 'Recibo' ? 'selected' : ''}>Recibo Simple</option>
            <option value="Vale" ${tipo === 'Vale' ? 'selected' : ''}>Vale Provisional</option>
            <option value="Ticket" ${tipo === 'Ticket' ? 'selected' : ''}>Ticket Registradora</option>
        </select>
        <input type="text" class="arq-doc-num w-20 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-white outline-none" placeholder="N° Doc" value="${num}" oninput="saveCurrentCajaData()">
        <input type="text" class="arq-doc-prov w-28 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-white outline-none" placeholder="Proveedor / A nombre de" value="${prov}" oninput="saveCurrentCajaData()">
        <input type="text" class="arq-doc-desc flex-1 min-w-[120px] bg-transparent border-none text-[11px] font-semibold text-slate-700 dark:text-slate-200 outline-none" placeholder="Concepto del gasto..." value="${desc}" oninput="saveCurrentCajaData()">
        <div class="flex items-center gap-0.5 tabular-nums text-xs shrink-0">
            <span class="text-slate-400 font-bold">$</span>
            <input type="number" step="0.01" min="0" class="arq-doc-monto w-20 p-1 text-right font-black border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-xs outline-none focus:border-amber-400" placeholder="0.00" value="${monto > 0 ? Number(monto).toFixed(2) : ''}" oninput="recalcArqueoCompleto(); saveCurrentCajaData();">
        </div>
        <button type="button" onclick="removeArqueoDocRow(this)" class="text-slate-300 hover:text-rose-500 text-xs px-1.5 py-1 transition-colors" title="Eliminar comprobante">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;
    list.appendChild(row);
}

window.removeArqueoDocRow = function (btn) {
    const row = btn.closest('.arq-doc-row');
    if (row) {
        row.remove();
        recalcArqueoCompleto();
        saveCurrentCajaData();
    }
};

window.limpiarConteoEfectivo = function () {
    if (confirm("¿Deseas reiniciar a cero todo el recuento de monedas y billetes?")) {
        document.querySelectorAll('.arq-cash-inp, .arq-coin-inp').forEach(inp => {
            inp.value = '';
        });
        recalcArqueoCompleto();
        saveCurrentCajaData();
    }
};

// === MOTOR DE CÁLCULO DE ARQUEO EN TIEMPO REAL ===
window.recalcArqueoCompleto = function () {
    // 1. Conteo físico de billetes y monedas
    let totalEfectivo = 0;
    const inputsEfectivo = document.querySelectorAll('.arq-cash-inp, .arq-coin-inp');

    inputsEfectivo.forEach(inp => {
        const qty = parseFloat(inp.value) || 0;
        const den = parseFloat(inp.dataset.den) || 0;
        const sub = qty * den;
        totalEfectivo += sub;

        const parent = inp.closest('.flex');
        if (parent) {
            const subtotEl = parent.querySelector('.arq-subtot');
            if (subtotEl) subtotEl.innerText = `$${sub.toFixed(2)}`;
        }
    });

    const totEfEl = document.getElementById('arq-tot-efectivo');
    const resEfEl = document.getElementById('res-efectivo-fisico');
    if (totEfEl) totEfEl.innerText = `$${totalEfectivo.toFixed(2)}`;
    if (resEfEl) resEfEl.innerText = `$${totalEfectivo.toFixed(2)}`;

    // 2. Comprobantes de gastos menores
    let totalDocs = 0;
    let totalIVA = 0;
    document.querySelectorAll('.arq-doc-row').forEach(row => {
        const tipo = row.querySelector('.arq-doc-tipo')?.value || 'Factura';
        const montoInp = row.querySelector('.arq-doc-monto');
        const val = parseFloat(montoInp?.value) || 0;
        totalDocs += val;

        // Si es CCF, desglosamos el 13% de IVA si viene con IVA incluido
        if (tipo === 'CCF' && val > 0) {
            totalIVA += (val / 1.13) * 0.13;
        }
    });

    const totDocsEl = document.getElementById('arq-tot-docs');
    const resDocsEl = document.getElementById('res-total-comprobantes');
    if (totDocsEl) totDocsEl.innerText = `$${totalDocs.toFixed(2)}`;
    if (resDocsEl) resDocsEl.innerText = `$${totalDocs.toFixed(2)}`;

    // 3. Fondo Fijo y Diferencia
    const fondoFijo = parseFloat(document.getElementById('arq-fondo-fijo')?.value) || 0;
    const totalArqueado = totalEfectivo + totalDocs;
    const diff = totalArqueado - fondoFijo;

    const resFondoEl = document.getElementById('res-fondo-fijo');
    const resArqEl = document.getElementById('res-total-arqueado');
    if (resFondoEl) resFondoEl.innerText = `$${fondoFijo.toFixed(2)}`;
    if (resArqEl) resArqEl.innerText = `$${totalArqueado.toFixed(2)}`;

    // Badge y Diagnóstico
    const badgeEl = document.getElementById('res-diagnostico-badge');
    const descEl = document.getElementById('res-diagnostico-desc');

    if (badgeEl && descEl) {
        if (Math.abs(diff) < 0.005) {
            badgeEl.className = "px-3 py-1 rounded-full font-black text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
            badgeEl.innerHTML = '<i class="fas fa-check-circle mr-1"></i> CUADRADO ($0.00)';
            descEl.innerText = "Los valores físicos y comprobantes igualan exactamente el fondo fijado.";
        } else if (diff > 0.005) {
            badgeEl.className = "px-3 py-1 rounded-full font-black text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40";
            badgeEl.innerHTML = `<i class="fas fa-arrow-trend-up mr-1"></i> SOBRANTE (+$${diff.toFixed(2)})`;
            descEl.innerText = "Existe más dinero que el fondo. Debe reconocerse como 'Otros Ingresos' (Art. 5102).";
        } else {
            badgeEl.className = "px-3 py-1 rounded-full font-black text-xs bg-rose-500/20 text-rose-400 border border-rose-500/40";
            badgeEl.innerHTML = `<i class="fas fa-triangle-exclamation mr-1"></i> FALTANTE (-$${Math.abs(diff).toFixed(2)})`;
            descEl.innerText = "Falta dinero físico para completar el fondo. Responsabilidad del custodio / Cuentas por Cobrar Empleados (Art. 1104).";
        }
    }

    // 4. Previsualización de Partida Contable
    renderPartidaPreview(totalDocs, diff, totalIVA);
};

// === PREVISUALIZACIÓN DE PARTIDA DE REPOSICIÓN ===
function renderPartidaPreview(totalDocs, diff, totalIVA) {
    const previewEl = document.getElementById('caja-partida-preview');
    if (!previewEl) return;

    if (totalDocs <= 0 && Math.abs(diff) < 0.005) {
        previewEl.innerHTML = '<p class="text-slate-400 italic text-[11px]">Ingresa comprobantes de gasto para formular la partida de reposición de caja chica.</p>';
        return;
    }

    const custodio = document.getElementById('arq-custodio')?.value || 'Custodio';
    const fecha = document.getElementById('arq-fecha')?.value || new Date().toISOString().split('T')[0];

    let gastoNeto = totalDocs;
    let ivaRow = '';
    if (totalIVA > 0.005) {
        gastoNeto = totalDocs - totalIVA;
        ivaRow = `
            <div class="flex justify-between pl-3 text-emerald-600 dark:text-emerald-400">
                <span>110801 IVA Crédito Fiscal (Comprobantes CCF)</span>
                <span>$${totalIVA.toFixed(2)}</span>
            </div>
        `;
    }

    let faltanteRow = '';
    if (diff < -0.005) {
        faltanteRow = `
            <div class="flex justify-between pl-3 text-rose-600 dark:text-rose-400">
                <span>110401 Cuentas por Cobrar Empleados (Faltante ${custodio})</span>
                <span>$${Math.abs(diff).toFixed(2)}</span>
            </div>
        `;
    }

    let sobranteRow = '';
    if (diff > 0.005) {
        sobranteRow = `
            <div class="flex justify-between pl-6 text-amber-600 dark:text-amber-400 italic">
                <span>a: 510201 Otros Ingresos (Sobrante de Caja Chica)</span>
                <span>$${diff.toFixed(2)}</span>
            </div>
        `;
    }

    // El cheque a reponer a la caja chica es exactamente los gastos soportados
    // Si el faltante se descuenta al custodio, el banco repone el total de comprobantes
    const haberCheque = totalDocs;

    previewEl.innerHTML = `
        <div class="bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1">
            <div class="flex justify-between font-black text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1 mb-1 text-[11px]">
                <span>Asiento de Reposición y Liquidación • ${fecha}</span>
                <span class="text-emerald-600 dark:text-emerald-400 font-bold">[CUADRADA]</span>
            </div>
            <div class="flex justify-between pl-3 text-slate-700 dark:text-slate-300 font-semibold">
                <span>410101 Gastos de Administración (Comprobantes Arqueo)</span>
                <span>$${gastoNeto.toFixed(2)}</span>
            </div>
            ${ivaRow}
            ${faltanteRow}
            <div class="flex justify-between pl-6 text-slate-700 dark:text-slate-300 font-semibold italic">
                <span>a: 110102 Bancos / Efectivo y Equivalentes (Cheque Reposición)</span>
                <span>$${haberCheque.toFixed(2)}</span>
            </div>
            ${sobranteRow}
            <div class="pt-2 mt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 italic">
                Glosa: Liquidación de comprobantes y emisión de cheque para reponer el fondo fijo de caja chica. Custodio: ${custodio}.
            </div>
        </div>
    `;
}

// === MOTOR DE CÁLCULO DE CORTE DIARIO (VENTAS) ===
window.recalcCorteDiario = function () {
    const fondoApertura = parseFloat(document.getElementById('corte-fondo-apertura')?.value) || 0;
    const ventasGravadas = parseFloat(document.getElementById('corte-ventas-gravadas')?.value) || 0;
    const ivaDebito = parseFloat(document.getElementById('corte-iva-debito')?.value) || 0;
    const salidas = parseFloat(document.getElementById('corte-salidas')?.value) || 0;
    const realContado = parseFloat(document.getElementById('corte-real-contado')?.value) || 0;

    const totalIngresosVentas = ventasGravadas + ivaDebito;
    const esperado = fondoApertura + totalIngresosVentas - salidas;
    const diff = realContado - esperado;
    const remesa = Math.max(0, realContado - fondoApertura);

    const espEl = document.getElementById('corte-res-esperado');
    const diffEl = document.getElementById('corte-res-diff');
    const remEl = document.getElementById('corte-res-remesa');

    if (espEl) espEl.innerText = `$${esperado.toFixed(2)}`;
    if (remEl) remEl.innerText = `$${remesa.toFixed(2)}`;

    if (diffEl) {
        if (Math.abs(diff) < 0.005) {
            diffEl.className = "text-emerald-400 font-bold";
            diffEl.innerText = `CUADRADO ($0.00)`;
        } else if (diff > 0.005) {
            diffEl.className = "text-amber-400 font-bold";
            diffEl.innerText = `SOBRANTE (+$${diff.toFixed(2)})`;
        } else {
            diffEl.className = "text-rose-400 font-bold";
            diffEl.innerText = `FALTANTE (-$${Math.abs(diff).toFixed(2)})`;
        }
    }
};

window.generarCorteVentasSimulado = function () {
    document.getElementById('corte-fondo-apertura').value = "50.00";
    document.getElementById('corte-ventas-gravadas').value = "520.00";
    document.getElementById('corte-iva-debito').value = "67.60";
    document.getElementById('corte-salidas').value = "15.00";
    document.getElementById('corte-real-contado').value = "622.60";
    recalcCorteDiario();
    saveCurrentCajaData();
};

// === SINCRONIZACIÓN DE VISTA IMPRIMIBLE DEL ACTA ===
function syncActaPrintView() {
    const d = extractCurrentCajaData();
    const printEmp = document.getElementById('acta-print-empresa');
    const printFec = document.getElementById('acta-print-fecha');
    const printHor = document.getElementById('acta-print-hora');
    const printCar = document.getElementById('acta-print-caracter');
    const printCus = document.getElementById('acta-print-custodio');
    const printFon = document.getElementById('acta-print-fondo');
    const signCus = document.getElementById('acta-sign-custodio');

    if (printEmp) printEmp.innerText = (d.empresa || 'Empresa Salvadoreña').toUpperCase();
    if (printFec) printFec.innerText = d.fecha || new Date().toISOString().split('T')[0];
    if (printHor) printHor.innerText = `${d.hora || '16:30'} hrs`;
    if (printCar) printCar.innerText = `Arqueo ${d.tipoArqueo || 'Ordinario'} de Control Interno`;
    if (printCus) printCus.innerText = d.custodio || 'Auxiliar Contable';
    if (printFon) printFon.innerText = `$${Number(d.fondoFijo || 0).toFixed(2)}`;
    if (signCus) signCus.innerText = d.custodio || 'Cajero / Custodio';

    // Resumen numérico
    let totalEfectivo = 0;
    Object.values(d.efectivo || {}).forEach((qty, idx) => {
        const dens = [100, 50, 20, 10, 5, 1, 1, 0.25, 0.10, 0.05, 0.01];
        totalEfectivo += (qty * (dens[idx] || 0));
    });

    let totalDocs = 0;
    (d.docs || []).forEach(doc => { totalDocs += (parseFloat(doc.monto) || 0); });

    const totalArqueado = totalEfectivo + totalDocs;
    const diff = totalArqueado - (d.fondoFijo || 0);

    const pTotEf = document.getElementById('acta-print-tot-efectivo');
    const pTotDoc = document.getElementById('acta-print-tot-docs');
    const pTotArq = document.getElementById('acta-print-tot-arqueado');
    const pTotFon = document.getElementById('acta-print-tot-fondo');
    const pDiff = document.getElementById('acta-print-diff');

    if (pTotEf) pTotEf.innerText = `$${totalEfectivo.toFixed(2)}`;
    if (pTotDoc) pTotDoc.innerText = `$${totalDocs.toFixed(2)}`;
    if (pTotArq) pTotArq.innerText = `$${totalArqueado.toFixed(2)}`;
    if (pTotFon) pTotFon.innerText = `$${Number(d.fondoFijo || 0).toFixed(2)}`;
    if (pDiff) {
        if (Math.abs(diff) < 0.005) {
            pDiff.innerText = `CUADRADO ($0.00)`;
            pDiff.className = "p-2 border border-slate-300 text-right tabular-nums font-bold text-emerald-600";
        } else if (diff > 0) {
            pDiff.innerText = `SOBRANTE (+$${diff.toFixed(2)})`;
            pDiff.className = "p-2 border border-slate-300 text-right tabular-nums font-bold text-amber-600";
        } else {
            pDiff.innerText = `FALTANTE (-$${Math.abs(diff).toFixed(2)})`;
            pDiff.className = "p-2 border border-slate-300 text-right tabular-nums font-bold text-rose-600";
        }
    }
}

// === ENVIAR A LIBRO DIARIO (PUENTE UNIVERSAL) ===
window.sendCajaToLibroDiario = function () {
    const d = extractCurrentCajaData();
    let totalDocs = 0;
    let totalIVA = 0;

    (d.docs || []).forEach(doc => {
        const val = parseFloat(doc.monto) || 0;
        totalDocs += val;
        if (doc.tipo === 'CCF' && val > 0) {
            totalIVA += (val / 1.13) * 0.13;
        }
    });

    let totalEfectivo = 0;
    document.querySelectorAll('.arq-cash-inp, .arq-coin-inp').forEach(inp => {
        totalEfectivo += (parseFloat(inp.value) || 0) * (parseFloat(inp.dataset.den) || 0);
    });

    const diff = (totalEfectivo + totalDocs) - (d.fondoFijo || 0);

    if (totalDocs <= 0 && Math.abs(diff) < 0.005) {
        alert("Agrega al menos un comprobante de gasto en el arqueo para formular la partida de reposición.");
        return;
    }

    const rows = [];
    let gastoNeto = totalDocs;

    if (totalIVA > 0.005) {
        gastoNeto = totalDocs - totalIVA;
    }

    // Cargo a Gastos
    rows.push({
        cod: "4101",
        nom: "Gastos de Administración (Comprobantes Caja Chica)",
        debe: gastoNeto.toFixed(2),
        haber: ""
    });

    // Cargo a IVA Crédito Fiscal
    if (totalIVA > 0.005) {
        rows.push({
            cod: "110801",
            nom: "IVA Crédito Fiscal (Comprobantes CCF Caja)",
            debe: totalIVA.toFixed(2),
            haber: ""
        });
    }

    // Cargo por Faltante
    if (diff < -0.005) {
        rows.push({
            cod: "110401",
            nom: `Cuentas por Cobrar Empleados (${d.custodio} - Faltante Arqueo)`,
            debe: Math.abs(diff).toFixed(2),
            haber: ""
        });
    }

    // Abono a Banco (Reposición)
    rows.push({
        cod: "110102",
        nom: "Efectivo y Equivalentes (Bancos - Cheque Reposición)",
        debe: "",
        haber: totalDocs.toFixed(2)
    });

    // Abono por Sobrante
    if (diff > 0.005) {
        rows.push({
            cod: "510201",
            nom: "Otros Ingresos (Sobrante de Caja Chica)",
            debe: "",
            haber: diff.toFixed(2)
        });
    }

    if (window.EduContaBridgeToDiario) {
        window.EduContaBridgeToDiario.open({
            origen: 'Arqueo de Caja Chica',
            color: 'amber',
            icono: 'fa-cash-register',
            titulo: 'Reposición Fondo Fijo de Caja Chica',
            subtitulo: `Liquidación de Gastos Menores • Acta ${d.fecha}`,
            fecha: d.fecha || new Date().toISOString().split('T')[0],
            glosa: `V/ Liquidación de comprobantes y emisión de cheque de reposición de fondo fijo de caja chica. Custodio: ${d.custodio}.`,
            rows: rows
        });
    } else {
        alert("El Puente Universal a Libro Diario no está disponible.");
    }
};

window.sendCorteToLibroDiario = function () {
    const fondoApertura = parseFloat(document.getElementById('corte-fondo-apertura')?.value) || 0;
    const realContado = parseFloat(document.getElementById('corte-real-contado')?.value) || 0;
    const remesa = Math.max(0, realContado - fondoApertura);

    if (remesa <= 0) {
        alert("El valor de la remesa bancaria debe ser mayor a cero.");
        return;
    }

    const fecha = document.getElementById('arq-fecha')?.value || new Date().toISOString().split('T')[0];
    const cNum = document.getElementById('corte-caja-num')?.value || 'Caja 01';

    const rows = [
        {
            cod: "110102",
            nom: "Efectivo y Equivalentes de Efectivo (Bancos - Cuenta Corriente)",
            debe: remesa.toFixed(2),
            haber: ""
        },
        {
            cod: "110101",
            nom: `Efectivo y Equivalentes de Efectivo (Caja General - ${cNum})`,
            debe: "",
            haber: remesa.toFixed(2)
        }
    ];

    if (window.EduContaBridgeToDiario) {
        window.EduContaBridgeToDiario.open({
            origen: 'Corte Diario de Caja',
            color: 'amber',
            icono: 'fa-building-columns',
            titulo: 'Remesa y Depósito de Ventas Diarias',
            subtitulo: `Depósito en Banco de Ingresos en Efectivo • ${cNum}`,
            fecha: fecha,
            glosa: `V/ Depósito bancario de las ventas del día en efectivo recaudadas en ${cNum}. Remesa según boleta bancaria.`,
            rows: rows
        });
    }
};

// === AUDITORÍA FORMATIVA MINED (BTVAC 1.5) ===
window.auditarCajaMINED = function () {
    const d = extractCurrentCajaData();
    let totalDocs = (d.docs || []).reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0);
    let totalEfectivo = 0;
    document.querySelectorAll('.arq-cash-inp, .arq-coin-inp').forEach(inp => {
        totalEfectivo += (parseFloat(inp.value) || 0) * (parseFloat(inp.dataset.den) || 0);
    });

    const diff = (totalEfectivo + totalDocs) - (d.fondoFijo || 0);
    const docsValidos = (d.docs || []).filter(c => c.desc && c.monto > 0).length;

    let nivel = 5;
    let feedback = [];

    if (!d.custodio || d.custodio.trim().length < 4) {
        nivel = Math.min(nivel, 3);
        feedback.push("• Se requiere designar formalmente al custodio responsable de la caja.");
    }
    if (d.fondoFijo <= 0) {
        nivel = Math.min(nivel, 2);
        feedback.push("• El fondo fijo debe tener una asignación dineraria autorizada mayor a $0.00.");
    }
    if (totalEfectivo <= 0 && totalDocs <= 0) {
        nivel = 1;
        feedback.push("• No se ha registrado ningún conteo físico ni comprobantes en la caja.");
    }
    if (Math.abs(diff) > 0.005) {
        nivel = Math.min(nivel, 4);
        feedback.push(`• Se detectó una diferencia (${diff < 0 ? 'Faltante' : 'Sobrante'}) de $${Math.abs(diff).toFixed(2)}. Debe imputarse la responsabilidad o el ingreso extraordinario según Art. 1104/5102.`);
    }

    const notas = { 5: '10.0 (Excelente)', 4: '8.0 (Aprobado Autónomo)', 3: '6.0 (Requiere Asistencia)', 2: '4.0 (Deficiente)', 1: '2.0 (No Iniciado)' };
    const descripciones = {
        5: 'Cumplimiento óptimo de las normas de control interno de efectivo del Módulo BTVAC 1.5. Conteo riguroso y arqueo cuadrado.',
        4: 'Cumple con el procedimiento de arqueo y evidencia competencias autónomas con observaciones menores.',
        3: 'El arqueo presenta inconsistencias o faltan datos del custodio/comprobantes de descargo.',
        2: 'Procedimiento incompleto. Se requiere repetir el recuento físico y verificar cada comprobante.',
        1: 'No se han ingresado evidencias del arqueo de fondos.'
    };

    alert(`📋 EVALUACIÓN FORMATIVA MINED — BTVAC 1.5\n\n` +
        `• Nivel de Logro: Nivel ${nivel} — Calificación: ${notas[nivel]}\n` +
        `• Diagnóstico: ${descripciones[nivel]}\n\n` +
        (feedback.length > 0 ? `Observaciones Técnicas:\n${feedback.join('\n')}` : `¡Felicitaciones! Cumple 100% con los estándares de auditoría interna.`)
    );
};

// === EXTRACCIÓN Y PERSISTENCIA DE DATOS ===
function extractCurrentCajaData() {
    const efectivo = {};
    document.querySelectorAll('.arq-cash-inp, .arq-coin-inp').forEach(inp => {
        const qty = parseFloat(inp.value) || 0;
        efectivo[inp.dataset.den] = qty;
    });

    const docs = [];
    document.querySelectorAll('.arq-doc-row').forEach(row => {
        docs.push({
            tipo: row.querySelector('.arq-doc-tipo')?.value || 'Factura',
            num: row.querySelector('.arq-doc-num')?.value || '',
            prov: row.querySelector('.arq-doc-prov')?.value || '',
            desc: row.querySelector('.arq-doc-desc')?.value || '',
            monto: parseFloat(row.querySelector('.arq-doc-monto')?.value) || 0
        });
    });

    return {
        empresa: document.getElementById('arq-empresa')?.value || 'Empresa',
        custodio: document.getElementById('arq-custodio')?.value || 'Custodio',
        fondoFijo: parseFloat(document.getElementById('arq-fondo-fijo')?.value) || 200,
        fecha: document.getElementById('arq-fecha')?.value || new Date().toISOString().split('T')[0],
        hora: document.getElementById('arq-hora')?.value || '16:30',
        tipoArqueo: document.getElementById('arq-tipo')?.value || 'ordinario',
        efectivo,
        docs,
        corte: {
            cajaNum: document.getElementById('corte-caja-num')?.value || 'Caja 01',
            cajero: document.getElementById('corte-cajero-nombre')?.value || '',
            fondoApertura: parseFloat(document.getElementById('corte-fondo-apertura')?.value) || 0,
            ventasGravadas: parseFloat(document.getElementById('corte-ventas-gravadas')?.value) || 0,
            ivaDebito: parseFloat(document.getElementById('corte-iva-debito')?.value) || 0,
            salidas: parseFloat(document.getElementById('corte-salidas')?.value) || 0,
            efectivoReal: parseFloat(document.getElementById('corte-real-contado')?.value) || 0
        }
    };
}

window.updateSyncUI = function(state, detail = "") {
    const cloudInd = document.getElementById('cloud-indicator');
    if (!cloudInd) return;

    if (!navigator.onLine && state !== 'offline') {
        state = 'offline';
    }

    const icon = cloudInd.querySelector('i');
    const span = cloudInd.querySelector('span');

    if (state === 'syncing') {
        cloudInd.className = "glass-pill px-2.5 py-1 rounded-full text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center gap-1.5 cursor-pointer animate-pulse";
        if (icon) icon.className = "fas fa-sync fa-spin text-sky-500";
        if (span) span.textContent = "Sincronizando...";
    } else if (state === 'success' || state === 'online') {
        cloudInd.className = "glass-pill px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 cursor-pointer";
        if (icon) icon.className = "fas fa-cloud-check text-emerald-500";
        if (span) span.textContent = "Sincronizado";
    } else if (state === 'offline') {
        cloudInd.className = "glass-pill px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 cursor-pointer";
        if (icon) icon.className = "fas fa-wifi-slash text-amber-500";
        if (span) span.textContent = "Sin conexión";
    } else if (state === 'error') {
        cloudInd.className = "glass-pill px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 cursor-pointer";
        if (icon) icon.className = "fas fa-exclamation-triangle text-rose-500";
        const shortDetail = detail && detail.length > 20 ? detail.substring(0, 17) + "..." : detail;
        if (span) span.textContent = shortDetail ? `Error: ${shortDetail}` : "Error Nube";
    } else {
        cloudInd.className = "glass-pill px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer";
        if (icon) icon.className = "fas fa-hdd text-slate-400";
        if (span) span.textContent = "Local";
    }
};

async function syncCajaCloud(isManual = false) {
    if (typeof isAuditMode !== 'undefined' && isAuditMode) return;
    if (!proyecto_actual) return;

    if (!navigator.onLine) {
        updateSyncUI('offline');
        if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('offline');
        return;
    }

    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        updateSyncUI('local');
        return;
    }

    try {
        const { data: { session } } = await supabaseClient.auth.getSession().catch(() => ({ data: { session: null } }));
        if (session) {
            updateSyncUI('syncing');
            if (typeof syncCurrentProjectWithSupabase === 'function') {
                await syncCurrentProjectWithSupabase(proyecto_actual, session.user.id, true);
            }
            updateSyncUI('success');
            if (isManual && typeof window.showSyncToast === 'function') {
                window.showSyncToast('success', 'Caja respaldada con éxito');
            }
        } else {
            updateSyncUI('local');
        }
    } catch (e) {
        console.error("Error sincronizando caja en la nube:", e);
        const errMsg = e.message || String(e);
        updateSyncUI('error', errMsg);
        if (isManual && typeof window.showSyncToast === 'function') {
            window.showSyncToast('error', errMsg);
        }
    }
}

window.saveCurrentCajaData = function (immediate = false) {
    if (!proyecto_actual) return;
    proyecto_actual.type = 'caja';
    proyecto_actual.data = extractCurrentCajaData();
    proyecto_actual.updatedAt = new Date().toISOString();

    const saveAction = () => {
        localStorage.setItem('educonta_projects_caja', JSON.stringify(projects));
        showCajaSyncToast();
        syncCajaCloud(immediate);
    };

    if (immediate) {
        if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
        saveAction();
    } else {
        if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(saveAction, 1500);
    }
};

window.forceSaveCaja = function () {
    saveCurrentCajaData(true);
};

function showCajaSyncToast() {
    const toast = document.getElementById('sync-toast');
    if (!toast) return;
    toast.classList.remove('translate-y-32', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-32', 'opacity-0');
    }, 2000);
}

window.exportarCajaPDF = function () {
    switchCajaTab('acta');
    setTimeout(() => {
        window.print();
    }, 300);
};
