// =========================================================================
// MATEMÁTICA FINANCIERA Y EVALUACIÓN DE INVERSIONES — BTVAC 3.5
// EduConta SV — Motor Financiero Independiente
// =========================================================================

let projects = [];
let proyecto_actual = null;
let currentProjectId = null;
let modoDual = localStorage.getItem('educonta_finanzas_modo') || 'practica'; // 'asistido' | 'practica'
let activeFinTab = 'prestamos';
let autoSaveTimeout = null;

// Estructura de estado financiero del proyecto (Vacío por defecto)
window._finanzasState = {
    prestamo: {
        monto: 0,
        tasa: 0,
        plazo: 0,
        sistema: 'frances',
        fecha: new Date().toISOString().split('T')[0],
        cuota: 0,
        totalInteres: 0,
        costoTotal: 0,
        schedule: []
    },
    interes: {
        simple: { capital: 0, tasa: 0, tiempo: 0 },
        compuesto: { capital: 0, tasa: 0, frecuencia: 12, plazo: 0 },
        anualidad: { renta: 0, tasa: 0, periodos: 0 }
    },
    inversion: {
        inversionInicial: 0,
        tmar: 0,
        flujos: []
    }
};

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (typeof injectSharedUI === 'function') {
            injectSharedUI('shared-components-root');
        }
    } catch (e) {
        console.warn("Shared UI error:", e);
    }

    // Cargar proyectos de la bóveda de Finanzas
    const rawProjects = localStorage.getItem('educonta_projects_finanzas');
    const lastProjectId = localStorage.getItem('educonta_last_project_id');

    if (rawProjects) {
        try { projects = JSON.parse(rawProjects); } catch (e) { projects = []; }
    }

    if (lastProjectId && projects.length > 0) {
        proyecto_actual = projects.find(p => p.id === lastProjectId);
    }

    // Si no hay proyecto activo o es de otro tipo, inicializar uno por defecto
    if (!proyecto_actual || proyecto_actual.type !== 'finanzas') {
        const found = projects.find(p => p.type === 'finanzas');
        if (found) {
            proyecto_actual = found;
            localStorage.setItem('educonta_last_project_id', proyecto_actual.id);
        } else {
            const newId = 'proj_' + Date.now();
            proyecto_actual = {
                id: newId,
                name: 'Simulación de Crédito e Inversión',
                type: 'finanzas',
                catalogo: 'MAESTRO',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                data: JSON.parse(JSON.stringify(window._finanzasState))
            };
            projects.unshift(proyecto_actual);
            localStorage.setItem('educonta_projects_finanzas', JSON.stringify(projects));
            localStorage.setItem('educonta_last_project_id', newId);
        }
    }

    currentProjectId = proyecto_actual.id;
    if (proyecto_actual) proyecto_actual.type = 'finanzas';
    localStorage.setItem('educonta_proyectos_active_tab', 'finanzas');

    // Asegurar estructura interna
    if (!proyecto_actual.data) {
        proyecto_actual.data = JSON.parse(JSON.stringify(window._finanzasState));
    }
    window._finanzasState = Object.assign({}, window._finanzasState, proyecto_actual.data);

    // Migración única (One-time migration): limpia solo la plantilla inicial heredada.
    // Una vez ejecutada, nunca vuelve a tocar los datos para proteger entradas manuales del usuario.
    const MIGRATION_KEY = 'educonta_finanzas_v2_migrated';
    if (!localStorage.getItem(MIGRATION_KEY)) {
        if (window._finanzasState.inversion) {
            const inv = window._finanzasState.inversion;
            const f = inv.flujos || [];
            const isMock5 = f.length === 5 && f[0] === 4000 && f[1] === 5000;
            const isMock1 = f.length === 1 && f[0] === 4000;
            if (isMock5 || isMock1) {
                inv.flujos = [];
                if (inv.inversionInicial === 15000) inv.inversionInicial = 0;
                if (inv.tmar === 12) inv.tmar = 0;
            }
        }
        if (window._finanzasState.prestamo) {
            const p = window._finanzasState.prestamo;
            if (p.monto === 10000 && p.tasa === 12 && p.plazo === 12) {
                p.monto = 0;
                p.tasa = 0;
                p.plazo = 0;
                p.schedule = [];
            }
        }
        if (window._finanzasState.interes) {
            const it = window._finanzasState.interes;
            if (it.simple && it.simple.capital === 5000 && it.simple.tasa === 8 && it.simple.tiempo === 6) {
                it.simple = { capital: 0, tasa: 0, tiempo: 0 };
            }
            if (it.compuesto && it.compuesto.capital === 5000 && it.compuesto.tasa === 10) {
                it.compuesto = { capital: 0, tasa: 0, frecuencia: 12, plazo: 0 };
            }
            if (it.anualidad && (it.anualidad.renta === 150 || it.anualidad.renta === 300)) {
                it.anualidad = { renta: 0, tasa: 0, periodos: 0 };
            }
        }
        // Registrar que la migración concluyó exitosamente
        localStorage.setItem(MIGRATION_KEY, 'true');
    }

    // Cargar datos a los inputs de la interfaz
    loadFinanzasDataIntoUI();

    // Configurar píldoras elásticas de navegación y modo
    const setupInitialIndicators = () => {
        const initialTabBtn = document.getElementById('tab-prestamos');
        if (initialTabBtn) moveSlidingTabPill(initialTabBtn, 0, false);

        const initialModeBtn = document.getElementById(modoDual === 'practica' ? 'btn-fin-mode-practica' : 'btn-fin-mode-asistido');
        if (initialModeBtn) {
            document.querySelectorAll('.fin-mode-btn').forEach(b => b.classList.remove('active'));
            initialModeBtn.classList.add('active');
            updateFinanzasModeIndicator(initialModeBtn, FIN_MODES.indexOf(modoDual), false);
        }
    };
    setupInitialIndicators();

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            const activeTabBtn = document.querySelector('.fin-tab-btn.active');
            if (activeTabBtn) moveSlidingTabPill(activeTabBtn, null, false);

            const activeModeBtn = document.querySelector('.fin-mode-btn.active');
            if (activeModeBtn) updateFinanzasModeIndicator(activeModeBtn, null, false);
        });
    }

    // Ejecutar cálculos en tiempo real
    calcPrestamoLive();
    calcInteresSimpleLive();
    calcInteresCompuestoLive();
    calcAnualidadesLive();
    calcEvaluacionLive();

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

    window.addEventListener('online', () => syncFinanzasCloud(false));
    window.addEventListener('offline', () => updateSyncUI('offline'));

    const syncPill = document.getElementById('main-sync-pill');
    if (syncPill) {
        syncPill.style.cursor = 'pointer';
        syncPill.title = "Guardar y sincronizar con la nube";
        syncPill.addEventListener('click', () => forceSaveFinanzas(true));
    }

    // Desvanecer preloader suavemente tras inicializar simulaciones y proyecciones financieras
    if (typeof window.dismissGlobalPreloader === 'function') {
        window.dismissGlobalPreloader();
    }
});

// === CARGAR DATOS A LA INTERFAZ ===
function loadFinanzasDataIntoUI() {
    if (!proyecto_actual) return;

    // Título del proyecto
    const titleEl = document.getElementById('current-project-name');
    if (titleEl) titleEl.innerText = proyecto_actual.name || 'Proyecto Financiero';

    const p = window._finanzasState.prestamo || {};
    if (document.getElementById('prestamo-monto')) document.getElementById('prestamo-monto').value = p.monto > 0 ? p.monto : '';
    if (document.getElementById('prestamo-tasa')) document.getElementById('prestamo-tasa').value = p.tasa > 0 ? p.tasa : '';
    if (document.getElementById('prestamo-plazo')) document.getElementById('prestamo-plazo').value = p.plazo > 0 ? p.plazo : '';
    if (document.getElementById('prestamo-sistema') && p.sistema) document.getElementById('prestamo-sistema').value = p.sistema;
    if (document.getElementById('prestamo-fecha') && p.fecha) document.getElementById('prestamo-fecha').value = p.fecha;

    const s = window._finanzasState.interes?.simple || {};
    if (document.getElementById('simple-capital')) document.getElementById('simple-capital').value = s.capital > 0 ? s.capital : '';
    if (document.getElementById('simple-tasa')) document.getElementById('simple-tasa').value = s.tasa > 0 ? s.tasa : '';
    if (document.getElementById('simple-tiempo')) document.getElementById('simple-tiempo').value = s.tiempo > 0 ? s.tiempo : '';

    const c = window._finanzasState.interes?.compuesto || {};
    if (document.getElementById('compuesto-capital')) document.getElementById('compuesto-capital').value = c.capital > 0 ? c.capital : '';
    if (document.getElementById('compuesto-tasa')) document.getElementById('compuesto-tasa').value = c.tasa > 0 ? c.tasa : '';
    if (document.getElementById('compuesto-frecuencia') && c.frecuencia) document.getElementById('compuesto-frecuencia').value = c.frecuencia;
    if (document.getElementById('compuesto-plazo')) document.getElementById('compuesto-plazo').value = c.plazo > 0 ? c.plazo : '';

    const a = window._finanzasState.interes?.anualidad || {};
    if (document.getElementById('anualidad-renta')) document.getElementById('anualidad-renta').value = a.renta > 0 ? a.renta : '';
    if (document.getElementById('anualidad-tasa')) document.getElementById('anualidad-tasa').value = a.tasa > 0 ? a.tasa : '';
    if (document.getElementById('anualidad-periodos')) document.getElementById('anualidad-periodos').value = a.periodos > 0 ? a.periodos : '';

    const inv = window._finanzasState.inversion || {};
    if (document.getElementById('inversion-inicial')) document.getElementById('inversion-inicial').value = inv.inversionInicial > 0 ? inv.inversionInicial : '';
    if (document.getElementById('inversion-tmar')) document.getElementById('inversion-tmar').value = inv.tmar > 0 ? inv.tmar : '';
}

// === CONTROL DE PESTAÑAS Y ANIMACIÓN ELÁSTICA DE LA BURBUJA ===
let currentFinTabIndex = 0;
let finTabSnapTimeout = null;
const FIN_VIEW_TABS = ['prestamos', 'interes', 'inversion'];

function moveSlidingTabPill(btn, newIndex = null, animate = true) {
    const pill = document.getElementById('sliding-tab-pill');
    if (!pill || !btn) return;

    if (finTabSnapTimeout) {
        clearTimeout(finTabSnapTimeout);
        finTabSnapTimeout = null;
    }

    if (btn.offsetWidth === 0) {
        requestAnimationFrame(() => {
            if (btn.offsetWidth > 0) moveSlidingTabPill(btn, newIndex, animate);
        });
        return;
    }

    const targetIndex = (newIndex !== null)
        ? newIndex
        : (btn.dataset.idx !== undefined ? parseInt(btn.dataset.idx, 10) : FIN_VIEW_TABS.indexOf(btn.id.replace('tab-', '')));
    const distance = Math.abs(targetIndex - currentFinTabIndex);
    const stretch = (animate && distance > 0) ? (1 + Math.min(distance * 0.15, 0.35)) : 1;

    if (!animate) {
        pill.style.transition = 'none';
    }

    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.opacity = '1';

    if (animate && distance > 0) {
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(${stretch}) scaleY(0.9)`;
        finTabSnapTimeout = setTimeout(() => {
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

    currentFinTabIndex = (targetIndex >= 0) ? targetIndex : 0;
}
window.moveSlidingTabPill = moveSlidingTabPill;

window.switchFinanzasTab = function(tabId) {
    activeFinTab = tabId;

    // Cambiar visibilidad de paneles
    document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
    const targetPanel = document.getElementById(`view-${tabId}`);
    if (targetPanel) targetPanel.classList.remove('hidden');

    // Cambiar estado activo en botones desktop
    document.querySelectorAll('.fin-tab-btn').forEach(b => b.classList.remove('active'));
    const targetBtn = document.getElementById(`tab-${tabId}`);
    if (targetBtn) {
        targetBtn.classList.add('active');
        const newIdx = FIN_VIEW_TABS.indexOf(tabId);
        moveSlidingTabPill(targetBtn, newIdx, true);
    }

    // Cambiar estado activo en botones móvil
    FIN_VIEW_TABS.forEach(t => {
        const mobBtn = document.getElementById(`tab-${t}-mobile`);
        if (mobBtn) {
            if (t === tabId) {
                mobBtn.className = "flex-1 py-1 px-1.5 text-center font-bold text-[10px] rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400";
            } else {
                mobBtn.className = "flex-1 py-1 px-1.5 text-center font-bold text-[10px] rounded-lg text-slate-500 dark:text-slate-400";
            }
        }
    });

    // Recalcular según vista activa
    if (tabId === 'prestamos') calcPrestamoLive();
    else if (tabId === 'interes') {
        calcInteresSimpleLive();
        calcInteresCompuestoLive();
        calcAnualidadesLive();
    } else if (tabId === 'inversion') {
        calcEvaluacionLive();
    }
};

// === CONTROL DE MODO DUAL Y SU BURBUJA ELÁSTICA ===
let currentFinModeIndex = 0;
let finModeSnapTimeout = null;
const FIN_MODES = ['asistido', 'practica'];

function updateFinanzasModeIndicator(btn, newIndex = null, animate = true) {
    const pill = document.getElementById('fin-mode-indicator');
    if (!pill || !btn) return;

    if (finModeSnapTimeout) {
        clearTimeout(finModeSnapTimeout);
        finModeSnapTimeout = null;
    }

    if (btn.offsetWidth === 0) {
        requestAnimationFrame(() => {
            if (btn.offsetWidth > 0) updateFinanzasModeIndicator(btn, newIndex, animate);
        });
        return;
    }

    const targetIndex = (newIndex !== null)
        ? newIndex
        : (btn.dataset.idx !== undefined ? parseInt(btn.dataset.idx, 10) : FIN_MODES.indexOf(modoDual));
    const distance = Math.abs(targetIndex - currentFinModeIndex);
    const stretch = (animate && distance > 0) ? (1 + Math.min(distance * 0.15, 0.35)) : 1;

    if (!animate) {
        pill.style.transition = 'none';
    }

    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.opacity = '1';

    if (animate && distance > 0) {
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(${stretch}) scaleY(0.9)`;
        finModeSnapTimeout = setTimeout(() => {
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

    currentFinModeIndex = (targetIndex >= 0) ? targetIndex : 0;
}
window.updateFinanzasModeIndicator = updateFinanzasModeIndicator;

window.addEventListener('resize', () => {
    const activeTabBtn = document.querySelector('.fin-tab-btn.active');
    if (activeTabBtn) moveSlidingTabPill(activeTabBtn, null, false);

    const activeModeBtn = document.querySelector('.fin-mode-btn.active');
    if (activeModeBtn) updateFinanzasModeIndicator(activeModeBtn, null, false);
});

// === MODO DUAL (ASISTIDO / PRÁCTICA) ===
window.setFinanzasMode = function(mode) {
    modoDual = mode;
    try {
        localStorage.setItem('educonta_finanzas_modo', mode);
    } catch (e) {}
    const btnAsistido = document.getElementById('btn-fin-mode-asistido');
    const btnPractica = document.getElementById('btn-fin-mode-practica');

    if (btnAsistido && btnPractica) {
        btnAsistido.classList.toggle('active', mode === 'asistido');
        btnPractica.classList.toggle('active', mode === 'practica');

        const activeBtn = mode === 'asistido' ? btnAsistido : btnPractica;
        updateFinanzasModeIndicator(activeBtn, FIN_MODES.indexOf(mode), true);
    }

    if (activeFinTab === 'prestamos') calcPrestamoLive();
    else if (activeFinTab === 'inversion') calcEvaluacionLive();
};

// ═══════════════════════════════════════════════════════════════════════
// 1. MOTOR DE AMORTIZACIÓN DE PRÉSTAMOS BANCARIOS (BTVAC 3.5)
// ═══════════════════════════════════════════════════════════════════════
window.calcPrestamoLive = function() {
    const monto = parseFloat(document.getElementById('prestamo-monto')?.value) || 0;
    const tasaAnual = parseFloat(document.getElementById('prestamo-tasa')?.value) || 0;
    const plazoMeses = parseInt(document.getElementById('prestamo-plazo')?.value) || 0;
    const sistema = document.getElementById('prestamo-sistema')?.value || 'frances';
    const fechaBase = document.getElementById('prestamo-fecha')?.value || new Date().toISOString().split('T')[0];

    const iMensual = (tasaAnual / 100) / 12;
    let cuotaNivelada = 0;
    let totalIntereses = 0;
    const schedule = [];
    let saldo = monto;

    const tbody = document.getElementById('prestamo-tabla-body');
    const tfoot = document.getElementById('prestamo-tabla-foot');
    const elCuota = document.getElementById('prestamo-res-cuota');
    const elInt = document.getElementById('prestamo-res-interes');
    const elTasaMes = document.getElementById('prestamo-res-tasa-mes');
    const elTot = document.getElementById('prestamo-res-total');

    // Si no hay monto o plazo válido, mostrar estado vacío
    if (monto <= 0 || plazoMeses <= 0) {
        window._finanzasState.prestamo = {
            monto: 0,
            tasa: tasaAnual,
            plazo: plazoMeses,
            sistema,
            fecha: fechaBase,
            cuota: 0,
            totalInteres: 0,
            costoTotal: 0,
            schedule: [],
            practicaData: {}
        };

        if (elCuota) elCuota.innerText = "$ 0.00";
        if (elInt) elInt.innerText = "$ 0.00";
        if (elTasaMes) elTasaMes.innerText = `${(iMensual * 100).toFixed(2)} %`;
        if (elTot) elTot.innerText = "$ 0.00";

        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="py-12 px-4 text-center">
                        <div class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                            <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-3">
                                <i class="fas fa-landmark text-xl text-slate-400"></i>
                            </div>
                            <p class="font-bold text-sm text-slate-600 dark:text-slate-300">Tabla de amortización sin datos</p>
                            <p class="text-xs text-slate-400 mt-1 max-w-sm">Ingresa el monto del préstamo y el plazo en meses para generar la tabla de cuotas y saldos.</p>
                        </div>
                    </td>
                </tr>
            `;
        }
        if (tfoot) tfoot.innerHTML = '';
        triggerAutoSave();
        return;
    }

    if (sistema === 'frances') {
        if (iMensual > 0) {
            cuotaNivelada = monto * (iMensual / (1 - Math.pow(1 + iMensual, -plazoMeses)));
        } else {
            cuotaNivelada = monto / plazoMeses;
        }

        for (let m = 1; m <= plazoMeses; m++) {
            const interes = saldo * iMensual;
            const amort = cuotaNivelada - interes;
            const saldoFinal = Math.max(0, saldo - amort);
            totalIntereses += interes;

            const d = new Date(fechaBase);
            d.setMonth(d.getMonth() + m);

            schedule.push({
                n: m,
                fecha: d.toISOString().split('T')[0],
                saldoInicial: saldo,
                cuota: cuotaNivelada,
                interes: interes,
                amort: amort,
                saldoFinal: saldoFinal
            });
            saldo = saldoFinal;
        }
    } else if (sistema === 'aleman') {
        const amortFija = monto / plazoMeses;
        for (let m = 1; m <= plazoMeses; m++) {
            const interes = saldo * iMensual;
            const cuota = amortFija + interes;
            const saldoFinal = Math.max(0, saldo - amortFija);
            totalIntereses += interes;

            const d = new Date(fechaBase);
            d.setMonth(d.getMonth() + m);

            schedule.push({
                n: m,
                fecha: d.toISOString().split('T')[0],
                saldoInicial: saldo,
                cuota: cuota,
                interes: interes,
                amort: amortFija,
                saldoFinal: saldoFinal
            });
            saldo = saldoFinal;
        }
    } else if (sistema === 'americano') {
        for (let m = 1; m <= plazoMeses; m++) {
            const interes = monto * iMensual;
            const amort = (m === plazoMeses) ? monto : 0;
            const cuota = interes + amort;
            const saldoFinal = (m === plazoMeses) ? 0 : monto;
            totalIntereses += interes;

            const d = new Date(fechaBase);
            d.setMonth(d.getMonth() + m);

            schedule.push({
                n: m,
                fecha: d.toISOString().split('T')[0],
                saldoInicial: saldo,
                cuota: cuota,
                interes: interes,
                amort: amort,
                saldoFinal: saldoFinal
            });
            saldo = saldoFinal;
        }
    }

    if (!window._finanzasState.prestamo) window._finanzasState.prestamo = {};
    if (!window._finanzasState.prestamo.practicaData) window._finanzasState.prestamo.practicaData = {};
    const pData = window._finanzasState.prestamo.practicaData;

    window._finanzasState.prestamo = Object.assign(window._finanzasState.prestamo, {
        monto,
        tasa: tasaAnual,
        plazo: plazoMeses,
        sistema,
        fecha: fechaBase,
        cuota: schedule[0]?.cuota || 0,
        totalInteres: totalIntereses,
        costoTotal: monto + totalIntereses,
        schedule
    });

    if (modoDual === 'asistido') {
        // === MODO ASISTIDO: RESULTADOS Y TABLA CALCULADA EN VIVO ===
        if (elCuota) {
            if (sistema === 'aleman') {
                elCuota.innerHTML = `<span class="text-2xl font-black tabular-nums text-indigo-700 dark:text-indigo-300">$ ${(schedule[0]?.cuota || 0).toFixed(2)} <span class="text-xs text-indigo-500 font-bold">(Inicial)</span></span>`;
            } else {
                elCuota.innerHTML = `<span class="text-2xl font-black tabular-nums text-indigo-700 dark:text-indigo-300">$ ${(schedule[0]?.cuota || 0).toFixed(2)}</span>`;
            }
        }

        if (elInt) elInt.innerText = `$ ${totalIntereses.toFixed(2)}`;
        if (elTasaMes) elTasaMes.innerText = `${(iMensual * 100).toFixed(2)} %`;
        if (elTot) elTot.innerText = `$ ${(monto + totalIntereses).toFixed(2)}`;

        if (tbody) {
            tbody.innerHTML = schedule.map(row => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="py-3 px-4 text-center font-bold text-slate-500">${row.n}</td>
                    <td class="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">${row.fecha}</td>
                    <td class="py-3 px-4 text-right font-medium">$ ${row.saldoInicial.toFixed(2)}</td>
                    <td class="py-3 px-4 text-right font-black text-indigo-600 dark:text-indigo-400">$ ${row.cuota.toFixed(2)}</td>
                    <td class="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400">$ ${row.interes.toFixed(2)}</td>
                    <td class="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">$ ${row.amort.toFixed(2)}</td>
                    <td class="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100">$ ${row.saldoFinal.toFixed(2)}</td>
                </tr>
            `).join('');
        }

        if (tfoot) {
            tfoot.innerHTML = `
                <tr>
                    <td colspan="3" class="py-3.5 px-4 text-right uppercase text-slate-600 dark:text-slate-300 font-black">Totales Acumulados:</td>
                    <td class="py-3.5 px-4 text-right tabular-nums text-indigo-600 dark:text-indigo-400 font-black">$ ${(monto + totalIntereses).toFixed(2)}</td>
                    <td class="py-3.5 px-4 text-right tabular-nums text-amber-600 dark:text-amber-400 font-black">$ ${totalIntereses.toFixed(2)}</td>
                    <td class="py-3.5 px-4 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-black">$ ${monto.toFixed(2)}</td>
                    <td class="py-3.5 px-4 text-right tabular-nums text-slate-500 font-bold">$ 0.00</td>
                </tr>
            `;
        }
    } else {
        // === MODO PRÁCTICA: CREAR LÍNEAS SEGÚN EL PLAZO CON CAMPOS VACÍOS PARA EL ALUMNO ===
        if (elCuota) elCuota.innerHTML = `<span class="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Modo Práctica</span><div class="text-xl tabular-nums text-slate-400 dark:text-slate-500 font-black mt-0.5">$ —</div>`;
        if (elInt) elInt.innerHTML = `<span class="text-[10px] font-black uppercase text-amber-500 tracking-wider">Modo Práctica</span><div class="text-xl tabular-nums text-slate-400 dark:text-slate-500 font-black mt-0.5">$ —</div>`;
        if (elTasaMes) elTasaMes.innerText = `${(iMensual * 100).toFixed(2)} %`;
        if (elTot) elTot.innerHTML = `<span class="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Modo Práctica</span><div class="text-xl tabular-nums text-slate-400 dark:text-slate-500 font-black mt-0.5">$ —</div>`;

        if (tbody) {
            tbody.innerHTML = schedule.map(row => {
                const sIni = pData[`${row.n}_saldoInicial`] ?? '';
                const cuo = pData[`${row.n}_cuota`] ?? '';
                const int = pData[`${row.n}_interes`] ?? '';
                const amo = pData[`${row.n}_amort`] ?? '';
                const sFin = pData[`${row.n}_saldoFinal`] ?? '';

                return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="py-2.5 px-3 text-center font-bold text-slate-500">${row.n}</td>
                    <td class="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300 text-xs">${row.fecha}</td>
                    <td class="py-2 px-2 text-right">
                        <input type="number" step="0.01" placeholder="0.00"
                            id="p-cell-${row.n}-saldoInicial"
                            value="${sIni}"
                            oninput="updatePracticePrestamoCell(${row.n}, 'saldoInicial', this.value)"
                            class="fin-practice-cell">
                    </td>
                    <td class="py-2 px-2 text-right">
                        <input type="number" step="0.01" placeholder="0.00"
                            id="p-cell-${row.n}-cuota"
                            value="${cuo}"
                            oninput="updatePracticePrestamoCell(${row.n}, 'cuota', this.value)"
                            class="fin-practice-cell">
                    </td>
                    <td class="py-2 px-2 text-right">
                        <input type="number" step="0.01" placeholder="0.00"
                            id="p-cell-${row.n}-interes"
                            value="${int}"
                            oninput="updatePracticePrestamoCell(${row.n}, 'interes', this.value)"
                            class="fin-practice-cell">
                    </td>
                    <td class="py-2 px-2 text-right">
                        <input type="number" step="0.01" placeholder="0.00"
                            id="p-cell-${row.n}-amort"
                            value="${amo}"
                            oninput="updatePracticePrestamoCell(${row.n}, 'amort', this.value)"
                            class="fin-practice-cell">
                    </td>
                    <td class="py-2 px-2 text-right">
                        <input type="number" step="0.01" placeholder="0.00"
                            id="p-cell-${row.n}-saldoFinal"
                            value="${sFin}"
                            oninput="updatePracticePrestamoCell(${row.n}, 'saldoFinal', this.value)"
                            class="fin-practice-cell">
                    </td>
                </tr>
                `;
            }).join('');
        }

        updatePracticePrestamoFoot();
    }

    triggerAutoSave();
};

window.updatePracticePrestamoCell = function(rowNum, field, val) {
    if (!window._finanzasState.prestamo) window._finanzasState.prestamo = {};
    if (!window._finanzasState.prestamo.practicaData) window._finanzasState.prestamo.practicaData = {};
    window._finanzasState.prestamo.practicaData[`${rowNum}_${field}`] = val;

    const el = document.getElementById(`p-cell-${rowNum}-${field}`);
    if (el) el.classList.remove('cell-correct', 'cell-wrong');

    updatePracticePrestamoFoot();
    triggerAutoSave();
};

function updatePracticePrestamoFoot() {
    const tfoot = document.getElementById('prestamo-tabla-foot');
    if (!tfoot || modoDual !== 'practica') return;

    const p = window._finanzasState.prestamo;
    const pData = p?.practicaData || {};
    const n = p?.plazo || 0;

    let sumCuota = 0, sumInt = 0, sumAmort = 0;
    for (let m = 1; m <= n; m++) {
        sumCuota += parseFloat(pData[`${m}_cuota`]) || 0;
        sumInt += parseFloat(pData[`${m}_interes`]) || 0;
        sumAmort += parseFloat(pData[`${m}_amort`]) || 0;
    }

    tfoot.innerHTML = `
        <tr>
            <td colspan="3" class="py-3 px-4 text-right uppercase text-slate-500 dark:text-slate-400 font-black text-[11px]">Sumatoria Ingresada:</td>
            <td class="py-3 px-2 text-right tabular-nums text-indigo-600 dark:text-indigo-400 font-black">$ ${sumCuota.toFixed(2)}</td>
            <td class="py-3 px-2 text-right tabular-nums text-amber-600 dark:text-amber-400 font-black">$ ${sumInt.toFixed(2)}</td>
            <td class="py-3 px-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-black">$ ${sumAmort.toFixed(2)}</td>
            <td class="py-3 px-2 text-right tabular-nums text-slate-400 font-bold text-[11px]">—</td>
        </tr>
    `;
}

// ═══════════════════════════════════════════════════════════════════════
// 2. MOTOR DE INTERÉS Y ANUALIDADES
// ═══════════════════════════════════════════════════════════════════════
window.calcInteresSimpleLive = function() {
    const capital = parseFloat(document.getElementById('simple-capital')?.value) || 0;
    const tasa = parseFloat(document.getElementById('simple-tasa')?.value) || 0;
    const tiempoMeses = parseFloat(document.getElementById('simple-tiempo')?.value) || 0;

    const tAnios = tiempoMeses / 12;
    const interes = capital * (tasa / 100) * tAnios;
    const montoFinal = capital + interes;

    const elInt = document.getElementById('simple-res-interes');
    if (elInt) elInt.innerText = `$ ${interes.toFixed(2)}`;

    const elTot = document.getElementById('simple-res-monto');
    if (elTot) elTot.innerText = `$ ${montoFinal.toFixed(2)}`;

    window._finanzasState.interes.simple = { capital, tasa, tiempo: tiempoMeses };
    triggerAutoSave();
};

window.calcInteresCompuestoLive = function() {
    const capital = parseFloat(document.getElementById('compuesto-capital')?.value) || 0;
    const tasa = parseFloat(document.getElementById('compuesto-tasa')?.value) || 0;
    const m = parseInt(document.getElementById('compuesto-frecuencia')?.value) || 12;
    const plazoAnios = parseFloat(document.getElementById('compuesto-plazo')?.value) || 0;

    const iPer = (tasa / 100) / m;
    const n = plazoAnios * m;
    const montoFinal = capital * Math.pow(1 + iPer, n);
    const interes = montoFinal - capital;

    const elInt = document.getElementById('compuesto-res-interes');
    if (elInt) elInt.innerText = `$ ${interes.toFixed(2)}`;

    const elTot = document.getElementById('compuesto-res-monto');
    if (elTot) elTot.innerText = `$ ${montoFinal.toFixed(2)}`;

    window._finanzasState.interes.compuesto = { capital, tasa, frecuencia: m, plazo: plazoAnios };
    triggerAutoSave();
};

window.calcAnualidadesLive = function() {
    const renta = parseFloat(document.getElementById('anualidad-renta')?.value) || 0;
    const tasa = parseFloat(document.getElementById('anualidad-tasa')?.value) || 0;
    const n = parseInt(document.getElementById('anualidad-periodos')?.value) || 0;

    const i = tasa / 100;
    let vf = 0;
    let vp = 0;

    if (i > 0) {
        vf = renta * ((Math.pow(1 + i, n) - 1) / i);
        vp = renta * ((1 - Math.pow(1 + i, -n)) / i);
    } else {
        vf = renta * n;
        vp = renta * n;
    }

    const elVf = document.getElementById('anualidad-res-vf');
    if (elVf) elVf.innerText = `$ ${vf.toFixed(2)}`;

    const elVp = document.getElementById('anualidad-res-vp');
    if (elVp) elVp.innerText = `$ ${vp.toFixed(2)}`;

    window._finanzasState.interes.anualidad = { renta, tasa, periodos: n };
    triggerAutoSave();
};

// ═══════════════════════════════════════════════════════════════════════
// 3. MOTOR DE EVALUACIÓN DE INVERSIONES (VAN, TIR, PRI, B/C)
// ═══════════════════════════════════════════════════════════════════════
window.calcEvaluacionLive = function() {
    const invInicial = parseFloat(document.getElementById('inversion-inicial')?.value) || 0;
    const tmar = parseFloat(document.getElementById('inversion-tmar')?.value) || 0;
    const flujos = window._finanzasState.inversion?.flujos || [];

    const horEl = document.getElementById('inversion-horizonte-text');
    const elVanVal = document.getElementById('kpi-van-val');
    const elVanBadge = document.getElementById('kpi-van-badge');
    const elTirVal = document.getElementById('kpi-tir-val');
    const elPriVal = document.getElementById('kpi-pri-val');
    const elBcVal = document.getElementById('kpi-bc-val');
    const tbody = document.getElementById('flujos-tabla-body');

    // Si no hay flujos registrados, renderizar estado vacío en la tabla
    if (!flujos || flujos.length === 0) {
        if (horEl) horEl.innerText = "0 Períodos (Años)";
        if (elVanVal) elVanVal.innerText = "$ 0.00";
        if (elVanBadge) {
            elVanBadge.className = "text-[9px] font-black px-2.5 py-0.5 rounded-full bg-slate-400 dark:bg-slate-600 text-white uppercase shadow-sm";
            elVanBadge.innerText = "SIN FLUJOS";
        }
        if (elTirVal) elTirVal.innerText = "—";
        if (elPriVal) elPriVal.innerText = "—";
        if (elBcVal) elBcVal.innerText = "0.00";

        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-14 px-4 text-center">
                        <div class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                            <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center mb-3">
                                <i class="fas fa-chart-line text-2xl text-emerald-500"></i>
                            </div>
                            <p class="font-bold text-sm text-slate-700 dark:text-slate-200">No hay períodos de flujo registrados</p>
                            <p class="text-xs text-slate-400 mt-1 max-w-md">La tabla de flujos netos proyectados está vacía. Haz clic en el botón superior <strong>"+ Agregar Período"</strong> para añadir los años de evaluación.</p>
                            <button type="button" onclick="addFlujoRow()" class="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-tight transition-all flex items-center gap-2 shadow-sm cursor-pointer">
                                <i class="fas fa-plus"></i> Agregar Primer Período
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }

        window._finanzasState.inversion.inversionInicial = invInicial;
        window._finanzasState.inversion.tmar = tmar;
        window._finanzasState.inversion.flujos = [];
        triggerAutoSave();
        return;
    }

    const k = tmar / 100;
    let sumaDescontada = 0;
    let acumulado = 0;
    let priPeriodo = null;
    let priMeses = 0;

    const tableRows = [];

    flujos.forEach((f, idx) => {
        const t = idx + 1;
        const factor = Math.pow(1 + k, -t);
        const vp = f * factor;
        sumaDescontada += vp;
        const prevAcum = acumulado;
        acumulado += vp;

        if (invInicial > 0 && acumulado >= invInicial && priPeriodo === null) {
            const remanente = invInicial - prevAcum;
            const fraccion = vp > 0 ? (remanente / vp) : 0;
            priPeriodo = idx;
            priMeses = Math.round(fraccion * 12);
        }

        tableRows.push({
            t,
            flujo: f,
            factor,
            vp,
            acumulado
        });
    });

    const van = sumaDescontada - invInicial;
    const bc = invInicial > 0 ? (sumaDescontada / invInicial) : 0;
    const tir = invInicial > 0 ? calcularTIR(invInicial, flujos) : null;

    // Actualizar horizonte
    if (horEl) horEl.innerText = `${flujos.length} Períodos (Años)`;

    if (!window._finanzasState.inversion) window._finanzasState.inversion = {};
    if (!window._finanzasState.inversion.practicaData) window._finanzasState.inversion.practicaData = {};
    const invData = window._finanzasState.inversion.practicaData;

    if (modoDual === 'asistido') {
        // === MODO ASISTIDO: RESULTADOS CALCULADOS EN VIVO ===
        if (elVanVal) elVanVal.innerText = `$ ${van.toFixed(2)}`;
        if (elVanBadge) {
            if (van >= 0) {
                elVanBadge.className = "text-[9px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-white uppercase shadow-sm";
                elVanBadge.innerText = "VIABLE (VAN > 0)";
            } else {
                elVanBadge.className = "text-[9px] font-black px-2.5 py-0.5 rounded-full bg-rose-500 text-white uppercase shadow-sm";
                elVanBadge.innerText = "NO VIABLE (VAN < 0)";
            }
        }

        if (elTirVal) elTirVal.innerText = tir !== null ? `${(tir * 100).toFixed(2)} %` : "N/D";
        if (elPriVal) {
            if (priPeriodo !== null) elPriVal.innerText = `${priPeriodo} años, ${priMeses} meses`;
            else if (invInicial > 0) elPriVal.innerText = "> Horizonte";
            else elPriVal.innerText = "—";
        }
        if (elBcVal) elBcVal.innerText = bc.toFixed(2);

        if (tbody) {
            tbody.innerHTML = tableRows.map((r, idx) => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="py-3 px-4 text-center font-bold text-slate-500">Año ${r.t}</td>
                    <td class="py-3 px-4 text-right">
                        <input type="number" value="${r.flujo}" onchange="updateFlujoValue(${idx}, this.value)"
                            class="fin-input py-1.5 px-3 text-xs w-36 inline-block">
                    </td>
                    <td class="py-3 px-4 text-right tabular-nums text-slate-500">${r.factor.toFixed(4)}</td>
                    <td class="py-3 px-4 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">$ ${r.vp.toFixed(2)}</td>
                    <td class="py-3 px-4 text-right tabular-nums font-black text-slate-800 dark:text-slate-100">$ ${r.acumulado.toFixed(2)}</td>
                    <td class="py-3 px-4 text-center">
                        <button type="button" onclick="deleteFlujoRow(${idx})" class="text-slate-300 hover:text-rose-500 transition-colors p-1.5 cursor-pointer" title="Eliminar período">
                            <i class="fas fa-trash-alt text-sm"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } else {
        // === MODO PRÁCTICA: CREAR LÍNEAS POR AÑO CON CAMPOS VACÍOS PARA EL ALUMNO ===
        if (elVanVal) elVanVal.innerHTML = `<span class="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Modo Práctica</span><div class="text-xl tabular-nums text-slate-400 dark:text-slate-500 font-black mt-0.5">$ —</div>`;
        if (elVanBadge) {
            elVanBadge.className = "text-[9px] font-black px-2.5 py-0.5 rounded-full bg-indigo-500 text-white uppercase shadow-sm";
            elVanBadge.innerText = "PRÁCTICA";
        }
        if (elTirVal) elTirVal.innerText = "—";
        if (elPriVal) elPriVal.innerText = "—";
        if (elBcVal) elBcVal.innerText = "—";

        if (tbody) {
            tbody.innerHTML = tableRows.map((r, idx) => {
                const uFactor = invData[`${r.t}_factor`] ?? '';
                const uVp = invData[`${r.t}_vp`] ?? '';
                const uAcum = invData[`${r.t}_acumulado`] ?? '';

                return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="py-2.5 px-3 text-center font-bold text-slate-500">Año ${r.t}</td>
                    <td class="py-2.5 px-3 text-right">
                        <input type="number" value="${r.flujo}" onchange="updateFlujoValue(${idx}, this.value)"
                            class="fin-input py-1.5 px-3 text-xs w-32 inline-block">
                    </td>
                    <td class="py-2 px-2 text-right">
                        <input type="number" step="0.0001" placeholder="0.0000"
                            id="inv-cell-${r.t}-factor"
                            value="${uFactor}"
                            oninput="updatePracticeInversionCell(${r.t}, 'factor', this.value)"
                            class="fin-practice-cell">
                    </td>
                    <td class="py-2 px-2 text-right">
                        <input type="number" step="0.01" placeholder="0.00"
                            id="inv-cell-${r.t}-vp"
                            value="${uVp}"
                            oninput="updatePracticeInversionCell(${r.t}, 'vp', this.value)"
                            class="fin-practice-cell">
                    </td>
                    <td class="py-2 px-2 text-right">
                        <input type="number" step="0.01" placeholder="0.00"
                            id="inv-cell-${r.t}-acumulado"
                            value="${uAcum}"
                            oninput="updatePracticeInversionCell(${r.t}, 'acumulado', this.value)"
                            class="fin-practice-cell">
                    </td>
                    <td class="py-2.5 px-3 text-center">
                        <button type="button" onclick="deleteFlujoRow(${idx})" class="text-slate-300 hover:text-rose-500 transition-colors p-1.5 cursor-pointer" title="Eliminar período">
                            <i class="fas fa-trash-alt text-sm"></i>
                        </button>
                    </td>
                </tr>
                `;
            }).join('');
        }
    }

    window._finanzasState.inversion.inversionInicial = invInicial;
    window._finanzasState.inversion.tmar = tmar;
    triggerAutoSave();
};

window.updatePracticeInversionCell = function(periodoNum, field, val) {
    if (!window._finanzasState.inversion) window._finanzasState.inversion = {};
    if (!window._finanzasState.inversion.practicaData) window._finanzasState.inversion.practicaData = {};
    window._finanzasState.inversion.practicaData[`${periodoNum}_${field}`] = val;

    const el = document.getElementById(`inv-cell-${periodoNum}-${field}`);
    if (el) el.classList.remove('cell-correct', 'cell-wrong');
    triggerAutoSave();
};

function calcularTIR(c0, flujos) {
    // Algoritmo Newton-Raphson para aproximar la Tasa Interna de Retorno
    let r = 0.1; // Estimación inicial (10%)
    const maxIter = 100;
    const tolerancia = 1e-6;

    for (let i = 0; i < maxIter; i++) {
        let f = -c0;
        let df = 0;
        let valid = true;

        for (let t = 1; t <= flujos.length; t++) {
            const cf = flujos[t - 1];
            f += cf / Math.pow(1 + r, t);
            df -= (t * cf) / Math.pow(1 + r, t + 1);
        }

        if (Math.abs(f) < tolerancia) return r;
        if (Math.abs(df) < 1e-12) break;

        const nuevoR = r - f / df;
        if (isNaN(nuevoR) || nuevoR < -0.99 || nuevoR > 10) break;
        r = nuevoR;
    }
    return null;
}

window.updateFlujoValue = function(idx, val) {
    const num = parseFloat(val) || 0;
    if (window._finanzasState.inversion?.flujos) {
        window._finanzasState.inversion.flujos[idx] = num;
        calcEvaluacionLive();
    }
};

window.addFlujoRow = function() {
    if (!window._finanzasState.inversion) {
        window._finanzasState.inversion = { inversionInicial: 0, tmar: 0, flujos: [] };
    }
    if (!window._finanzasState.inversion.flujos) {
        window._finanzasState.inversion.flujos = [];
    }
    const len = window._finanzasState.inversion.flujos.length;
    const lastVal = len > 0 ? window._finanzasState.inversion.flujos[len - 1] : 1000;
    window._finanzasState.inversion.flujos.push(lastVal > 0 ? lastVal : 1000);
    calcEvaluacionLive();
};

window.deleteFlujoRow = function(idx) {
    if (!window._finanzasState.inversion?.flujos) return;
    window._finanzasState.inversion.flujos.splice(idx, 1);
    calcEvaluacionLive();
};

// ═══════════════════════════════════════════════════════════════════════
// 4. PUENTE CONTABLE AL LIBRO DIARIO (EduContaBridgeToDiario)
// ═══════════════════════════════════════════════════════════════════════
window.insertPrestamoJournalEntry = function() {
    const p = window._finanzasState.prestamo;
    if (!p || p.monto <= 0) {
        alert("Configura un monto de préstamo válido antes de generar las partidas.");
        return;
    }

    const firstRow = p.schedule[0] || { interes: 0, amort: 0, cuota: 0 };
    
    // Partida 1: Desembolso del Préstamo Bancario
    const loanEntry = {
        fecha: p.fecha,
        titulo: `Contabilización de Préstamo Bancario (${p.sistema.toUpperCase()})`,
        glosa: `V/ Concesión y desembolso de préstamo bancario por $ ${p.monto.toFixed(2)} al ${p.tasa}% de interés anual a ${p.plazo} meses plazo.`,
        rows: [
            { cod: "110102", nom: "Bancos (Desembolso Crédito Bancario)", debe: p.monto.toFixed(2), haber: "" },
            { cod: "210101", nom: "Préstamos Bancarios a Corto Plazo", debe: "", haber: p.monto.toFixed(2) }
        ]
    };

    // Partida 2: Pago de la Primera Cuota
    const quotaEntry = {
        fecha: firstRow.fecha || p.fecha,
        titulo: `Pago Cuota N° 1 Préstamo Bancario`,
        glosa: `V/ Pago de la primera cuota del financiamiento: amortización a capital e intereses devengados.`,
        rows: [
            { cod: "210101", nom: "Préstamos Bancarios a Corto Plazo (Amortización Capital)", debe: firstRow.amort.toFixed(2), haber: "" },
            { cod: "410301", nom: "Gastos Financieros (Intereses s/ Préstamo)", debe: firstRow.interes.toFixed(2), haber: "" },
            { cod: "110102", nom: "Bancos (Emisión de Pago Cuota)", debe: "", haber: firstRow.cuota.toFixed(2) }
        ]
    };

    if (window.EduContaBridgeToDiario) {
        window.EduContaBridgeToDiario.open({
            origen: 'Matemática Financiera (BTVAC 3.5)',
            color: 'emerald',
            icono: 'fa-landmark',
            titulo: loanEntry.titulo,
            subtitulo: `Desembolso Crédito Bancario ($ ${p.monto.toFixed(2)})`,
            fecha: loanEntry.fecha,
            glosa: loanEntry.glosa,
            rows: loanEntry.rows
        });
    } else {
        localStorage.setItem('pending_entry_prestamo', JSON.stringify([loanEntry, quotaEntry]));
        window.location.href = "editor-libros.html";
    }
};

// ═══════════════════════════════════════════════════════════════════════
// 5. AUDITORÍA MINED & EVALUACIÓN CRITERIAL
// ═══════════════════════════════════════════════════════════════════════
window.auditFinanzasPractice = function() {
    if (modoDual === 'asistido') {
        const p = window._finanzasState.prestamo;
        const inv = window._finanzasState.inversion;

        let score = 10;
        const observations = [];

        if (p.monto <= 0) {
            score -= 3;
            observations.push("El monto del préstamo debe ser mayor a $0.00.");
        }
        if (p.tasa <= 0 || p.tasa > 100) {
            score -= 2;
            observations.push("La tasa de interés debe ubicarse en un rango comercial válido (1% - 100%).");
        }
        if (inv.inversionInicial <= 0) {
            score -= 2;
            observations.push("La inversión inicial para evaluación de proyectos debe ser positiva.");
        }

        let nivel = score >= 9 ? "Nivel 5 — Competencia Autónoma Sobresaliente" : (score >= 7 ? "Nivel 4 — Competencia Aprobatoria" : "Nivel 2 — Requiere Refuerzo Técnico");

        const feedback = `
            <div class="text-left space-y-3">
                <div class="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200">
                    <p class="font-black text-indigo-700 dark:text-indigo-300 text-sm">Modo Asistido Activo</p>
                    <p class="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">El sistema resuelve y muestra todos los cálculos automáticamente.</p>
                </div>
                <div class="text-xs text-slate-600 dark:text-slate-300">
                    <p class="font-bold mb-1">Diagnóstico MINED BTVAC 3.5:</p>
                    ${observations.length === 0 ? '<p class="text-emerald-600 font-bold">✓ Todos los parámetros ingresados cumplen con los estándares pedagógicos.</p>' : observations.map(o => `<p class="text-rose-500">• ${o}</p>`).join('')}
                </div>
                <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-xs text-amber-800 dark:text-amber-300">
                    💡 <strong>¿Deseas autoevaluarte?</strong> Activa el <strong>Modo Práctica</strong> en la barra de herramientas superior para que las tablas te permitan ingresar tus cálculos celda por celda y recibir una calificación numérica.
                </div>
            </div>
        `;

        if (typeof window.showCustomModal === 'function') {
            window.showCustomModal({
                title: 'Auditoría Curricular MINED · Modo Asistido',
                content: feedback,
                confirmText: 'Entendido'
            });
        } else {
            alert(`Auditoría MINED:\nCalificación: ${score}/10\n${nivel}\n${observations.join('\n') || 'Cumplimiento excelente.'}`);
        }
        return;
    }

    // === MODO PRÁCTICA: AUDITORÍA Y CALIFICACIÓN CELDA POR CELDA ===
    if (activeFinTab === 'prestamos') {
        const p = window._finanzasState.prestamo;
        const pData = p?.practicaData || {};
        const schedule = p?.schedule || [];
        const n = p?.plazo || 0;

        if (n <= 0 || schedule.length === 0) {
            alert("Ingresa el monto del préstamo y el plazo antes de auditar.");
            return;
        }

        const totalCells = n * 5; // saldoInicial, cuota, interes, amort, saldoFinal
        let correctCells = 0;
        let wrongCells = 0;
        let emptyCells = 0;

        const fields = ['saldoInicial', 'cuota', 'interes', 'amort', 'saldoFinal'];

        for (let m = 1; m <= n; m++) {
            const exp = schedule[m - 1];
            fields.forEach(f => {
                const userValRaw = pData[`${m}_${f}`];
                const inputEl = document.getElementById(`p-cell-${m}-${f}`);

                if (userValRaw === undefined || userValRaw === '' || isNaN(parseFloat(userValRaw))) {
                    emptyCells++;
                    if (inputEl) {
                        inputEl.classList.remove('cell-correct');
                        inputEl.classList.add('cell-wrong');
                        inputEl.title = `Sin completar. Valor esperado: $ ${exp[f].toFixed(2)}`;
                    }
                } else {
                    const uVal = parseFloat(userValRaw);
                    const eVal = exp[f];
                    const diff = Math.abs(uVal - eVal);

                    if (diff <= 0.05) { // Tolerancia de centavos por redondeo
                        correctCells++;
                        if (inputEl) {
                            inputEl.classList.remove('cell-wrong');
                            inputEl.classList.add('cell-correct');
                            inputEl.title = `¡Correcto! ($ ${eVal.toFixed(2)})`;
                        }
                    } else {
                        wrongCells++;
                        if (inputEl) {
                            inputEl.classList.remove('cell-correct');
                            inputEl.classList.add('cell-wrong');
                            inputEl.title = `Ingresaste: $ ${uVal.toFixed(2)} | Esperado: $ ${eVal.toFixed(2)}`;
                        }
                    }
                }
            });
        }

        const score = totalCells > 0 ? ((correctCells / totalCells) * 10).toFixed(1) : "0.0";
        let nivel = "Nivel 5 — Competencia Autónoma Sobresaliente";
        let nivelColor = "emerald";
        if (score < 6) { nivel = "Nivel 2 — Requiere Refuerzo Técnico"; nivelColor = "rose"; }
        else if (score < 7) { nivel = "Nivel 3 — Competencia Inicial"; nivelColor = "amber"; }
        else if (score < 9) { nivel = "Nivel 4 — Competencia Aprobatoria"; nivelColor = "indigo"; }

        const feedback = `
            <div class="text-left space-y-3">
                <div class="p-4 rounded-2xl bg-${nivelColor}-50 dark:bg-${nivelColor}-950/40 border border-${nivelColor}-200">
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-black uppercase text-${nivelColor}-600 tracking-wider">Calificación MINED BTVAC 3.5</span>
                        <span class="text-2xl font-black tabular-nums text-${nivelColor}-700">${score} / 10</span>
                    </div>
                    <p class="text-xs font-bold text-${nivelColor}-600 mt-1">${nivel}</p>
                </div>
                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                    <div class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200">
                        <span class="block text-[10px] font-black uppercase text-emerald-600">Correctas</span>
                        <span class="text-lg font-black tabular-nums text-emerald-700">${correctCells}</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200">
                        <span class="block text-[10px] font-black uppercase text-rose-600">Con Error</span>
                        <span class="text-lg font-black tabular-nums text-rose-700">${wrongCells}</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200">
                        <span class="block text-[10px] font-black uppercase text-slate-500">Vacías</span>
                        <span class="text-lg font-black tabular-nums text-slate-600">${emptyCells}</span>
                    </div>
                </div>
                <p class="text-xs text-slate-500 mt-2">
                    Las celdas de tu tabla han sido resaltadas en <strong class="text-emerald-600">verde</strong> para aciertos y en <strong class="text-rose-500">rojo</strong> para errores. Pasa el cursor sobre las celdas rojas para consultar el valor esperado.
                </p>
            </div>
        `;

        if (typeof window.showCustomModal === 'function') {
            window.showCustomModal({
                title: 'Resultado de Práctica · Amortización',
                content: feedback,
                confirmText: 'Revisar mi tabla'
            });
        } else {
            alert(`Auditoría Práctica MINED:\nCalificación: ${score}/10 (${nivel})\nCorrectas: ${correctCells}\nCon Error: ${wrongCells}\nVacías: ${emptyCells}`);
        }
    } else if (activeFinTab === 'inversion') {
        const inv = window._finanzasState.inversion;
        const invData = inv?.practicaData || {};
        const flujos = inv?.flujos || [];

        if (flujos.length === 0) {
            alert("Agrega al menos un período de flujo de efectivo antes de auditar.");
            return;
        }

        const k = (inv.tmar || 0) / 100;
        const totalCells = flujos.length * 3;
        let correctCells = 0, wrongCells = 0, emptyCells = 0;
        let acumulado = 0;

        flujos.forEach((f, idx) => {
            const t = idx + 1;
            const expFactor = Math.pow(1 + k, -t);
            const expVp = f * expFactor;
            acumulado += expVp;
            const expAcum = acumulado;

            const checks = [
                { f: 'factor', exp: expFactor, tol: 0.001 },
                { f: 'vp', exp: expVp, tol: 0.05 },
                { f: 'acumulado', exp: expAcum, tol: 0.05 }
            ];

            checks.forEach(c => {
                const raw = invData[`${t}_${c.f}`];
                const inputEl = document.getElementById(`inv-cell-${t}-${c.f}`);
                if (raw === undefined || raw === '' || isNaN(parseFloat(raw))) {
                    emptyCells++;
                    if (inputEl) {
                        inputEl.classList.remove('cell-correct');
                        inputEl.classList.add('cell-wrong');
                        inputEl.title = `Sin contestar. Esperado: ${c.exp.toFixed(4)}`;
                    }
                } else {
                    const uVal = parseFloat(raw);
                    const diff = Math.abs(uVal - c.exp);
                    if (diff <= c.tol) {
                        correctCells++;
                        if (inputEl) {
                            inputEl.classList.remove('cell-wrong');
                            inputEl.classList.add('cell-correct');
                            inputEl.title = `¡Correcto! (${c.exp.toFixed(4)})`;
                        }
                    } else {
                        wrongCells++;
                        if (inputEl) {
                            inputEl.classList.remove('cell-correct');
                            inputEl.classList.add('cell-wrong');
                            inputEl.title = `Ingresaste: ${uVal} | Esperado: ${c.exp.toFixed(4)}`;
                        }
                    }
                }
            });
        });

        const score = totalCells > 0 ? ((correctCells / totalCells) * 10).toFixed(1) : "0.0";
        let nivel = score >= 9 ? "Nivel 5 — Competencia Autónoma Sobresaliente" : (score >= 7 ? "Nivel 4 — Competencia Aprobatoria" : "Nivel 2 — Requiere Refuerzo Técnico");

        const feedback = `
            <div class="text-left space-y-3">
                <div class="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-black uppercase text-emerald-600 tracking-wider">Calificación MINED VAN/TIR</span>
                        <span class="text-2xl font-black tabular-nums text-emerald-700">${score} / 10</span>
                    </div>
                    <p class="text-xs font-bold text-emerald-600 mt-1">${nivel}</p>
                </div>
                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                    <div class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200">
                        <span class="block text-[10px] font-black uppercase text-emerald-600">Correctas</span>
                        <span class="text-lg font-black tabular-nums text-emerald-700">${correctCells}</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200">
                        <span class="block text-[10px] font-black uppercase text-rose-600">Con Error</span>
                        <span class="text-lg font-black tabular-nums text-rose-700">${wrongCells}</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200">
                        <span class="block text-[10px] font-black uppercase text-slate-500">Vacías</span>
                        <span class="text-lg font-black tabular-nums text-slate-600">${emptyCells}</span>
                    </div>
                </div>
            </div>
        `;
        if (typeof window.showCustomModal === 'function') {
            window.showCustomModal({
                title: 'Resultado de Práctica · Evaluación VAN/TIR',
                content: feedback,
                confirmText: 'Revisar mi tabla'
            });
        } else {
            alert(`Auditoría VAN/TIR:\nCalificación: ${score}/10 (${nivel})\nCorrectas: ${correctCells}\nCon Error: ${wrongCells}`);
        }
    } else {
        alert("Auditoría disponible en pestañas de Amortización y Evaluación VAN/TIR.");
    }
};

// ═══════════════════════════════════════════════════════════════════════
// 6. EXPORTACIÓN A EXCEL / CSV
// ═══════════════════════════════════════════════════════════════════════
window.exportFinanzasExcel = function() {
    const p = window._finanzasState.prestamo;
    if (!p || !p.schedule || p.schedule.length === 0) {
        alert("No hay tabla de amortización disponible para exportar.");
        return;
    }

    let csv = "TABLA DE AMORTIZACION DE PRESTAMO - BTVAC 3.5\n";
    csv += `Monto: $${p.monto.toFixed(2)}, Tasa Anual: ${p.tasa}%, Plazo: ${p.plazo} meses, Sistema: ${p.sistema.toUpperCase()}\n\n`;
    csv += "N°,Fecha,Saldo Inicial,Cuota Total,Intereses,Amortizacion Capital,Saldo Insoluto\n";

    p.schedule.forEach(r => {
        csv += `${r.n},${r.fecha},${r.saldoInicial.toFixed(2)},${r.cuota.toFixed(2)},${r.interes.toFixed(2)},${r.amort.toFixed(2)},${r.saldoFinal.toFixed(2)}\n`;
    });

    csv += `Totales:,,,$${(p.monto + p.totalInteres).toFixed(2)},$${p.totalInteres.toFixed(2)},$${p.monto.toFixed(2)},$0.00\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Amortizacion_${proyecto_actual?.name || 'Finanzas'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// ═══════════════════════════════════════════════════════════════════════
// 7. PERSISTENCIA Y SINCRONIZACIÓN AUTOMÁTICA
// ═══════════════════════════════════════════════════════════════════════
window.updateSyncUI = function(state, detail = "") {
    const cloudInd = document.getElementById('cloud-indicator');
    if (!cloudInd) return;

    if (!navigator.onLine && state !== 'offline') {
        state = 'offline';
    }

    if (state === 'syncing') {
        cloudInd.className = "flex items-center justify-center gap-1 w-full text-sky-500 font-black bg-white dark:bg-slate-800 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-sky-100 dark:border-sky-900/50 transition-all animate-pulse";
        cloudInd.innerHTML = '<i class="fas fa-sync fa-spin text-[7px]"></i><span>SINCRONIZANDO</span>';
    } else if (state === 'success' || state === 'online') {
        cloudInd.className = "flex items-center justify-center gap-1 w-full text-emerald-600 dark:text-emerald-400 font-black bg-white dark:bg-slate-800 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-slate-100 dark:border-slate-700 transition-all";
        cloudInd.innerHTML = '<i class="fas fa-cloud-check text-[7px]"></i><span>SINCRONIZADO</span>';
    } else if (state === 'offline') {
        cloudInd.className = "flex items-center justify-center gap-1 w-full text-amber-500 font-black bg-white dark:bg-slate-800 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-amber-100 dark:border-amber-900/50 transition-all";
        cloudInd.innerHTML = '<i class="fas fa-wifi-slash text-[7px]"></i><span>OFFLINE</span>';
    } else if (state === 'error') {
        cloudInd.className = "flex items-center justify-center gap-1 w-full text-rose-500 font-black bg-white dark:bg-slate-800 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-rose-100 dark:border-rose-900/50 transition-all";
        const shortDetail = detail && detail.length > 15 ? detail.substring(0, 12) + "..." : detail;
        cloudInd.innerHTML = `<i class="fas fa-exclamation-triangle text-[7px]"></i><span>${shortDetail ? shortDetail.toUpperCase() : 'ERROR'}</span>`;
    } else {
        cloudInd.className = "flex items-center justify-center gap-1 w-full text-slate-400 font-black bg-white dark:bg-slate-800 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-slate-100 dark:border-slate-700 transition-all";
        cloudInd.innerHTML = '<i class="fas fa-hdd text-[7px]"></i><span>LOCAL</span>';
    }
};

async function syncFinanzasCloud(isManual = false) {
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
                window.showSyncToast('success', 'Proyecto financiero respaldado con éxito');
            }
        } else {
            updateSyncUI('local');
        }
    } catch (e) {
        console.error("Error sincronizando finanzas en la nube:", e);
        const errMsg = e.message || String(e);
        updateSyncUI('error', errMsg);
        if (isManual && typeof window.showSyncToast === 'function') {
            window.showSyncToast('error', errMsg);
        }
    }
}

window.forceSaveFinanzas = function(isManual = true) {
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
    }
    if (!proyecto_actual) return;
    proyecto_actual.type = 'finanzas';
    proyecto_actual.data = JSON.parse(JSON.stringify(window._finanzasState));
    proyecto_actual.updatedAt = new Date().toISOString();
    localStorage.setItem('educonta_projects_finanzas', JSON.stringify(projects));

    const saveInd = document.getElementById('save-indicator');
    if (saveInd) {
        saveInd.className = "flex items-center justify-center gap-1 w-full text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50/80 dark:bg-emerald-950/40 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-emerald-100 dark:border-emerald-900/50";
        saveInd.innerHTML = '<i class="fas fa-check-circle text-[7px]"></i><span>LOCAL</span>';
    }
    syncFinanzasCloud(isManual);
};

function triggerAutoSave() {
    if (typeof isAuditMode !== 'undefined' && isAuditMode) return;

    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);

    const cloudInd = document.getElementById('cloud-indicator');
    if (cloudInd) {
        cloudInd.className = "flex items-center justify-center gap-1 w-full text-amber-500 font-black bg-white dark:bg-slate-800 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-slate-100 dark:border-slate-700 transition-all";
        cloudInd.innerHTML = '<i class="fas fa-spinner fa-spin text-[7px]"></i><span>PENDIENTE</span>';
    }

    autoSaveTimeout = setTimeout(() => {
        if (!proyecto_actual) return;

        proyecto_actual.type = 'finanzas';
        proyecto_actual.data = JSON.parse(JSON.stringify(window._finanzasState));
        proyecto_actual.updatedAt = new Date().toISOString();

        // Guardar en la bóveda de finanzas en localStorage
        localStorage.setItem('educonta_projects_finanzas', JSON.stringify(projects));

        const saveInd = document.getElementById('save-indicator');
        if (saveInd) {
            saveInd.className = "flex items-center justify-center gap-1 w-full text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50/80 dark:bg-emerald-950/40 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-emerald-100 dark:border-emerald-900/50";
            saveInd.innerHTML = '<i class="fas fa-check-circle text-[7px]"></i><span>LOCAL</span>';
        }

        syncFinanzasCloud(false);
    }, 1200);
}

window.closeProject = function() {
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
    }
    if (proyecto_actual) {
        proyecto_actual.type = 'finanzas';
        proyecto_actual.data = JSON.parse(JSON.stringify(window._finanzasState));
        proyecto_actual.updatedAt = new Date().toISOString();
        localStorage.setItem('educonta_projects_finanzas', JSON.stringify(projects));
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            supabaseClient.auth.getSession().then(({ data: { session } }) => {
                if (session && typeof syncCurrentProjectWithSupabase === 'function') {
                    syncCurrentProjectWithSupabase(proyecto_actual, session.user.id, true).catch(console.error);
                }
            }).catch(() => {});
        }
    }
    localStorage.setItem('educonta_proyectos_active_tab', 'finanzas');
    window.location.href = 'proyectos.html';
};

