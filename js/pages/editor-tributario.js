// =========================================================================
// EDUCONTA SV — MÓDULO TRIBUTARIO Y FISCAL (BTVAC 2.1 - 2.2)
// Formulario F-07 (IVA Mensual), F-14 (Retenciones) y Libros Legales de IVA
// Ley de IVA y Código Tributario de El Salvador
// =========================================================================

let activeProject = null;
let currentProjectId = null;
let tributarioMode = 'practica';
let currentSubTab = 'f07';

let tributarioData = {
    // === FORMULARIO F-07 (IVA MENSUAL) ===
    // Débito Fiscal (Sección I)
    ventasGravadasCCF: 0.00,        // Casilla [10]
    debitoGravadasCCF: 0.00,        // Casilla [15] = [10] * 0.13
    ventasConsumidorFinal: 0.00,     // Casilla [20]
    debitoConsumidorFinal: 0.00,      // Casilla [25] = [20] * 0.13
    ventasZonasFrancas: 0.00,           // Casilla [30] (0%)
    exportacionesFueraCA: 0.00,         // Casilla [35] (0%)
    exportacionesCentroamerica: 0.00,   // Casilla [40] (0%)
    ventasExentas: 0.00,                // Casilla [85]
    ventasNoSujetas: 0.00,              // Casilla [86]
    totalDebitoFiscal: 0.00,         // Total Débito (15 + 25)

    // Crédito Fiscal (Sección II)
    comprasGravadasLocales: 0.00,    // Casilla [50]
    creditoComprasLocales: 0.00,     // Casilla [55] = [50] * 0.13
    importacionesBienes: 0.00,       // Casilla [60]
    creditoImportacionesBienes: 0.00, // Casilla [65] = [60] * 0.13
    importacionesServicios: 0.00,       // Casilla [62]
    creditoImportacionesServicios: 0.00,// Casilla [67] = [62] * 0.13
    comprasSujetosExcluidos: 0.00,      // Casilla [66]
    comprasExentasNoSujetas: 0.00,      // Casilla [70]
    remanenteCreditoAnterior: 0.00,     // Casilla [75]
    totalCreditoFiscal: 0.00,        // Total Crédito (55 + 65 + 67 + 75)

    // Liquidación IVA (Sección III)
    impuestoDeterminadoIVA: 0.00,     // Débito - Crédito
    remanenteCreditoSiguiente: 0.00,    // Crédito - Débito
    anticipoImportacionesIVA: 0.00,     // Casilla [160]
    percepciones1SufridasIVA: 0.00,     // Casilla [161]
    retenciones1SufridasIVA: 0.00,      // Casilla [162]
    totalRetencionesSufridasIVA: 0.00,
    ivaNetoPagar: 0.00,               // Total Final F-07

    // === FORMULARIO F-14 (PAGO A CUENTA Y RETENCIONES) ===
    // Sección A: Anticipo de Pago a Cuenta ISR (Art. 151 C.T.)
    pagoCuentaIngresosMes: 0.00,    // Casilla [110]
    pagoCuentaTasa: 0.0175,             // Tasa General 1.75%
    pagoCuentaDeterminado: 0.00,      // Casilla [120] = [110] * Tasa
    pagoCuentaAcreditaciones: 0.00,     // Casilla [125]
    pagoCuentaSubtotal: 0.00,

    // Sección B: Retenciones ISR Practicadas a Terceros
    rentaSalariosBase: 0.00,         // Planilla Salarios (Art. 155 CT)
    rentaSalariosRetenida: 0.00,      // Retención Decreto 10
    rentaHonorariosBase: 0.00,       // Servicios Profesionales (Art. 156 CT)
    rentaHonorariosRetenida: 0.00,    // 10%
    rentaArrendamientosBase: 0.00,      // Alquileres a PN (Art. 156-A CT)
    rentaArrendamientosRetenida: 0.00,  // 10%
    rentaDividendosBase: 0.00,          // Dividendos (Art. 72-A LISR)
    rentaDividendosRetenida: 0.00,      // 5%
    totalRetencionesRenta: 0.00,

    // Sección C: Retenciones IVA Practicadas a Terceros (Agente DGII)
    ivaRetenido1Base: 0.00,          // Compras >= $100 (Art. 162 CT)
    ivaRetenido1Monto: 0.00,           // 1%
    ivaRetenido13Base: 0.00,            // No Domiciliados (Art. 161 CT)
    ivaRetenido13Monto: 0.00,           // 13%
    totalRetencionesIVA: 0.00,

    // Sección D: Total Final F-14
    totalEnterarF14: 0.00,

    // === ESTADO DE FORMULARIOS DINÁMICOS (DGII NACIONALES Y 262 DISTRITOS MUNICIPALES) ===
    dgiiCategoriaActiva: 'DECLARACION_PAGO',
    dgiiFormUnicoActivo: 'DGII-F11',
    filtroMunicipal: {
        departamento_codigo: '06',
        municipio_codigo: '06-04',
        distrito_codigo: '06-04-03',
        codigo_unico: 'MUN-06-04-03-F1'
    },
    // Almacena los valores ingresados por el alumno por cada codigo_unico:
    // Ejemplo: declaracionesDinamicas['MUN-06-04-03-F1'] = { 'M-01': 'COMERCIO', 'M-10': 125000, ... }
    declaracionesDinamicas: {}
};

// Comprobantes para libros legales
let libroCompras = [];
let libroVentas = [];

// === Inicialización de Página ===
document.addEventListener('DOMContentLoaded', async () => {
    initTributarioProject();
    renderAllTributarioViews();
    setTributarioMode('practica');
    await initCatalogoTributarioUI();

    // Desvanecer preloader suavemente tras inicializar formularios tributarios F-07 y F-14
    if (typeof window.dismissGlobalPreloader === 'function') {
        window.dismissGlobalPreloader();
    }
});

function initTributarioProject() {
    currentProjectId = localStorage.getItem('educonta_last_project_id');
    const projects = JSON.parse(localStorage.getItem('educonta_projects_tributario')) || [];

    if (currentProjectId) {
        activeProject = projects.find(p => p.id === currentProjectId);
    }

    if (!activeProject) {
        if (projects.length > 0) {
            activeProject = projects[0];
            currentProjectId = activeProject.id;
            localStorage.setItem('educonta_last_project_id', currentProjectId);
        } else {
            // Crear proyecto tributario inicial por defecto
            activeProject = {
                id: 'proj_' + Date.now(),
                name: 'Nueva Declaración Tributaria',
                type: 'tributario',
                catalogo: 'MAESTRO',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                data: JSON.parse(JSON.stringify(tributarioData)),
                libroCompras: [],
                libroVentas: []
            };
            projects.push(activeProject);
            localStorage.setItem('educonta_projects_tributario', JSON.stringify(projects));
            localStorage.setItem('educonta_last_project_id', activeProject.id);
        }
    }

    // Cargar datos guardados y migrar esquemas antiguos si existen
    if (activeProject.data) {
        tributarioData = Object.assign({}, tributarioData, activeProject.data);
        // Migración de campos antiguos a las nuevas casillas
        if (activeProject.data.ventasGravadas && !activeProject.data.ventasGravadasCCF) {
            tributarioData.ventasGravadasCCF = activeProject.data.ventasGravadas;
        }
        if (activeProject.data.comprasGravadas && !activeProject.data.comprasGravadasLocales) {
            tributarioData.comprasGravadasLocales = activeProject.data.comprasGravadas;
        }
        if (activeProject.data.importaciones && !activeProject.data.importacionesBienes) {
            tributarioData.importacionesBienes = activeProject.data.importaciones;
        }
        if (activeProject.data.remanenteAnterior && !activeProject.data.remanenteCreditoAnterior) {
            tributarioData.remanenteCreditoAnterior = activeProject.data.remanenteAnterior;
        }
        if (activeProject.data.retenciones1 && !activeProject.data.retenciones1SufridasIVA) {
            tributarioData.retenciones1SufridasIVA = activeProject.data.retenciones1;
        }
        if (activeProject.data.ingresosMes && !activeProject.data.pagoCuentaIngresosMes) {
            tributarioData.pagoCuentaIngresosMes = activeProject.data.ingresosMes;
        }
        if (activeProject.data.honorariosBase && !activeProject.data.rentaHonorariosBase) {
            tributarioData.rentaHonorariosBase = activeProject.data.honorariosBase;
        }
        if (activeProject.data.comprasIva1Base && !activeProject.data.ivaRetenido1Base) {
            tributarioData.ivaRetenido1Base = activeProject.data.comprasIva1Base;
        }
        if (!tributarioData.filtroMunicipal) {
            tributarioData.filtroMunicipal = {
                departamento_codigo: '06',
                municipio_codigo: '06-04',
                distrito_codigo: '06-04-03',
                codigo_unico: 'MUN-06-04-03-F1'
            };
        }
        if (!tributarioData.declaracionesDinamicas) {
            tributarioData.declaracionesDinamicas = {};
        }
    }
    if (activeProject.libroCompras) libroCompras = activeProject.libroCompras;
    if (activeProject.libroVentas) libroVentas = activeProject.libroVentas;

    // Actualizar nombre en la interfaz
    const nameEl = document.getElementById('current-project-name');
    if (nameEl) nameEl.innerText = activeProject.name;
    const mobileNameEl = document.getElementById('mobile-project-name');
    if (mobileNameEl) mobileNameEl.innerText = activeProject.name;

    if (activeProject) {
        activeProject.type = 'tributario';
        localStorage.setItem('educonta_proyectos_active_tab', 'tributario');
    }

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

    window.addEventListener('online', () => saveTributarioState());
    window.addEventListener('offline', () => updateSyncUI('offline'));

    const cloudInd = document.getElementById('cloud-indicator');
    if (cloudInd) {
        cloudInd.style.cursor = 'pointer';
        cloudInd.title = 'Guardar y sincronizar con la nube';
        cloudInd.addEventListener('click', () => saveTributarioState());
    }
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
        cloudInd.className = "flex items-center justify-center gap-1 w-full text-sky-500 font-black bg-white dark:bg-slate-800 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-sky-100 dark:border-sky-900/50 transition-all animate-pulse";
        if (icon) icon.className = "fas fa-sync fa-spin text-[7px]";
        if (span) span.innerText = "SINCRONIZANDO";
    } else if (state === 'success' || state === 'online') {
        cloudInd.className = "flex items-center justify-center gap-1 w-full text-emerald-600 dark:text-emerald-400 font-black bg-white dark:bg-slate-800 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-slate-100 dark:border-slate-700 transition-all";
        if (icon) icon.className = "fas fa-cloud-check text-[7px]";
        if (span) span.innerText = "SINCRONIZADO";
    } else if (state === 'offline') {
        cloudInd.className = "flex items-center justify-center gap-1 w-full text-amber-500 font-black bg-white dark:bg-slate-800 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-amber-100 dark:border-amber-900/50 transition-all";
        if (icon) icon.className = "fas fa-wifi-slash text-[7px]";
        if (span) span.innerText = "OFFLINE";
    } else if (state === 'error') {
        cloudInd.className = "flex items-center justify-center gap-1 w-full text-rose-500 font-black bg-white dark:bg-slate-800 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-rose-100 dark:border-rose-900/50 transition-all";
        if (icon) icon.className = "fas fa-exclamation-triangle text-[7px]";
        const shortDetail = detail && detail.length > 15 ? detail.substring(0, 12) + "..." : detail;
        if (span) span.innerText = shortDetail ? shortDetail.toUpperCase() : "ERROR";
    } else {
        cloudInd.className = "flex items-center justify-center gap-1 w-full text-slate-400 font-black bg-white dark:bg-slate-800 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-slate-100 dark:border-slate-700 transition-all";
        if (icon) icon.className = "fas fa-hdd text-[7px]";
        if (span) span.innerText = "LOCAL";
    }
};

window.saveTributarioState = function () {
    if (!activeProject) return;
    activeProject.type = 'tributario';
    activeProject.data = JSON.parse(JSON.stringify(tributarioData));
    activeProject.libroCompras = JSON.parse(JSON.stringify(libroCompras));
    activeProject.libroVentas = JSON.parse(JSON.stringify(libroVentas));
    activeProject.updatedAt = new Date().toISOString();

    const projects = JSON.parse(localStorage.getItem('educonta_projects_tributario')) || [];
    const idx = projects.findIndex(p => p.id === activeProject.id);
    if (idx !== -1) projects[idx] = activeProject;
    else projects.push(activeProject);

    localStorage.setItem('educonta_projects_tributario', JSON.stringify(projects));

    // Toast de sincronización
    const toast = document.getElementById('sync-toast');
    if (toast) {
        toast.querySelector('h4').innerText = "Declaración Guardada";
        toast.querySelector('p').innerText = "Bóveda tributaria actualizada localmente";
        toast.classList.remove('translate-y-32', 'opacity-0');
        setTimeout(() => toast.classList.add('translate-y-32', 'opacity-0'), 2500);
    }

    // Sincronización Supabase
    if (!navigator.onLine) {
        updateSyncUI('offline');
    } else if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
            if (session && typeof syncCurrentProjectWithSupabase === 'function') {
                updateSyncUI('syncing');
                try {
                    await syncCurrentProjectWithSupabase(activeProject, session.user.id, true);
                    updateSyncUI('success');
                } catch (err) {
                    console.error("Error sincronizando tributario en la nube:", err);
                    updateSyncUI('error', err.message);
                }
            } else {
                updateSyncUI('local');
            }
        }).catch(err => updateSyncUI('error', err.message));
    } else {
        updateSyncUI('local');
    }
};

window.updateProjectNameInPlace = function (el) {
    const newName = el.innerText.trim();
    if (!newName || !activeProject) return;
    activeProject.name = newName;
    saveTributarioState();
};

window.handleTitleKey = function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        e.target.blur();
    }
};

window.closeProject = function () {
    localStorage.setItem('educonta_proyectos_active_tab', 'tributario');
    window.location.href = 'proyectos.html';
};

// === Control de Pestañas Superiores con Animación Squash/Stretch y Colores Dinámicos ===
let currentTabIndex = 0;
let tabSnapTimeout = null;

const tabIndexMapping = {
    'f07': 0,
    'f14': 1,
    'dgii-otros': 2,
    'municipales': 3,
    'libros': 4
};

function moveTabIndicator(btn, newIndex, tabKey, animate = true) {
    const pill = document.getElementById('trib-tab-indicator');
    const container = document.getElementById('trib-tabs-container');
    if (!pill || !btn) return;

    if (tabSnapTimeout) {
        clearTimeout(tabSnapTimeout);
        tabSnapTimeout = null;
    }

    // Actualizar clases de color temático según el tab (f07: Indigo, f14: Purple, dgii-otros: Sky, municipales: Amber, libros: Emerald)
    const activeTheme = tabKey || 'f07';
    pill.classList.remove('theme-f07', 'theme-f14', 'theme-dgii-otros', 'theme-municipales', 'theme-libros');
    pill.classList.add(`theme-${activeTheme}`);

    if (container) {
        container.classList.remove('theme-f07', 'theme-f14', 'theme-dgii-otros', 'theme-municipales', 'theme-libros');
        container.classList.add(`theme-${activeTheme}`);
    }

    if (btn.offsetWidth === 0) {
        requestAnimationFrame(() => {
            if (btn.offsetWidth > 0) moveTabIndicator(btn, newIndex, tabKey, animate);
        });
        return;
    }

    const distance = Math.abs(newIndex - currentTabIndex);
    const stretch = (animate && distance > 0) ? (1 + Math.min(distance * 0.15, 0.35)) : 1;

    if (!animate) {
        pill.style.transition = 'none';
    }

    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.height = `${btn.offsetHeight}px`;
    pill.style.top = `${btn.offsetTop}px`;
    pill.style.opacity = '1';

    if (animate && distance > 0) {
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(${stretch}) scaleY(0.92)`;
        tabSnapTimeout = setTimeout(() => {
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

    currentTabIndex = newIndex;
}

window.moveToTab = moveTabIndicator;

window.switchTributarioView = function (tabId) {
    if (tabId === currentSubTab) return;
    currentSubTab = tabId;
    const newIdx = tabIndexMapping[tabId] ?? 0;

    ['f07', 'f14', 'dgii-otros', 'municipales', 'libros'].forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        const mobBtn = document.getElementById(`mob-tab-${t}`);
        const view = document.getElementById(`view-${t}`);
        if (btn) btn.classList.toggle('active', t === tabId);
        if (mobBtn) {
            mobBtn.classList.toggle('text-indigo-600', t === tabId);
            mobBtn.classList.toggle('dark:text-indigo-400', t === tabId);
            mobBtn.classList.toggle('bg-white/60', t === tabId);
            mobBtn.classList.toggle('dark:bg-indigo-950/40', t === tabId);
            mobBtn.classList.toggle('text-slate-500', t !== tabId);
        }
        if (view) view.classList.toggle('hidden', t !== tabId);
    });

    const activeBtn = document.getElementById(`tab-${tabId}`);
    if (activeBtn) {
        moveTabIndicator(activeBtn, newIdx, tabId, true);
    }

    // Si entramos a vista dinámica, asegurar que los selects de esa vista tengan labels actualizados
    if (tabId === 'dgii-otros' || tabId === 'municipales') {
        setTimeout(() => {
            if (typeof window.refreshEduContaGlassSelects === 'function') {
                window.refreshEduContaGlassSelects(document.getElementById(`view-${tabId}`));
            }
        }, 50);
    }

    // Re-sincronizar compensación geométrica de zoom si está activo
    if (window.TributarioZoomManager) {
        setTimeout(() => window.TributarioZoomManager.applyZoom(), 50);
    }
};

window.updateTabIndicator = function () {
    const activeBtn = document.getElementById(`tab-${currentSubTab}`);
    const idx = tabIndexMapping[currentSubTab] ?? 0;
    if (activeBtn) {
        moveTabIndicator(activeBtn, idx, currentSubTab, false);
    }
};

// === Modo Dual: Asistido vs Práctica ===
window.setTributarioMode = function (mode) {
    tributarioMode = mode;
    const btnAsistido = document.getElementById('btn-trib-mode-asistido');
    const btnPractica = document.getElementById('btn-trib-mode-practica');
    const panelAudit = document.getElementById('panel-audit-tributario');
    if (panelAudit) panelAudit.classList.add('hidden');

    if (mode === 'asistido') {
        if (btnAsistido) {
            btnAsistido.classList.add('active-mode');
            btnAsistido.classList.remove('inactive-mode');
        }
        if (btnPractica) {
            btnPractica.classList.remove('active-mode');
            btnPractica.classList.add('inactive-mode');
        }
        populateTributarioFields(tributarioData);
        calcF07Live();
        calcF14Live();
    } else {
        if (btnPractica) {
            btnPractica.classList.add('active-mode');
            btnPractica.classList.remove('inactive-mode');
        }
        if (btnAsistido) {
            btnAsistido.classList.remove('active-mode');
            btnAsistido.classList.add('inactive-mode');
        }
        // Vaciar campos calculados para permitir práctica didáctica
        const fields = [
            'f07-cas-10', 'f07-cas-20', 'f07-cas-30', 'f07-cas-35', 'f07-cas-40', 'f07-cas-85', 'f07-cas-86',
            'f07-cas-50', 'f07-cas-60', 'f07-cas-62', 'f07-cas-66', 'f07-cas-70', 'f07-cas-75',
            'f07-cas-161', 'f07-cas-162',
            'f14-ingresos-mes', 'f14-acreditaciones-previas',
            'f14-base-salarios', 'f14-retencion-salarios',
            'f14-base-profesionales', 'f14-base-arrendamientos', 'f14-base-dividendos',
            'f14-base-iva1', 'f14-base-iva13'
        ];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        calcF07Live();
        calcF14Live();
    }

    // Re-renderizar formulario dinámico activo en el nuevo modo (Asistido o Práctica)
    if (currentSubTab === 'dgii-otros') {
        const regla = (window.CATALOGO_FORMULARIOS_TRIBUTARIOS || []).find(f => f.codigo_unico === tributarioData.dgiiFormUnicoActivo);
        if (regla) renderDynamicForm(regla, 'dgii-dynamic-form-container');
    } else if (currentSubTab === 'municipales') {
        const regla = (window.CATALOGO_FORMULARIOS_TRIBUTARIOS || []).find(f => f.codigo_unico === tributarioData.filtroMunicipal?.codigo_unico);
        if (regla) renderDynamicForm(regla, 'municipal-dynamic-form-container');
    }
};

function populateTributarioFields(d) {
    const setVal = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = (v !== undefined && v !== null && v > 0) ? Number(v).toFixed(2) : '';
    };

    // F-07 Débitos
    setVal('f07-cas-10', d.ventasGravadasCCF ?? d.ventasGravadas);
    setVal('f07-cas-20', d.ventasConsumidorFinal);
    setVal('f07-cas-30', d.ventasZonasFrancas);
    setVal('f07-cas-35', d.exportacionesFueraCA);
    setVal('f07-cas-40', d.exportacionesCentroamerica);
    setVal('f07-cas-85', d.ventasExentas);
    setVal('f07-cas-86', d.ventasNoSujetas);

    // F-07 Créditos
    setVal('f07-cas-50', d.comprasGravadasLocales ?? d.comprasGravadas);
    setVal('f07-cas-60', d.importacionesBienes ?? d.importaciones);
    setVal('f07-cas-62', d.importacionesServicios);
    setVal('f07-cas-66', d.comprasSujetosExcluidos);
    setVal('f07-cas-70', d.comprasExentasNoSujetas);
    setVal('f07-cas-75', d.remanenteCreditoAnterior ?? d.remanenteAnterior);

    // F-07 Retenciones / Percepciones Sufridas
    setVal('f07-cas-161', d.percepciones1SufridasIVA);
    setVal('f07-cas-162', d.retenciones1SufridasIVA ?? d.retenciones1);

    // F-14 Sección A: Pago a Cuenta Propio
    setVal('f14-ingresos-mes', d.pagoCuentaIngresosMes ?? d.ingresosMes);
    const tasaSelect = document.getElementById('f14-pago-cuenta-tasa-select');
    if (tasaSelect && d.pagoCuentaTasa) {
        tasaSelect.value = String(d.pagoCuentaTasa);
    }
    setVal('f14-acreditaciones-previas', d.pagoCuentaAcreditaciones);

    // F-14 Sección B: Retenciones ISR
    setVal('f14-base-salarios', d.rentaSalariosBase);
    setVal('f14-retencion-salarios', d.rentaSalariosRetenida);
    setVal('f14-base-profesionales', d.rentaHonorariosBase ?? d.honorariosBase);
    setVal('f14-base-arrendamientos', d.rentaArrendamientosBase);
    setVal('f14-base-dividendos', d.rentaDividendosBase);

    // F-14 Sección C: Retenciones IVA Agente
    setVal('f14-base-iva1', d.ivaRetenido1Base ?? d.comprasIva1Base);
    setVal('f14-base-iva13', d.ivaRetenido13Base);
}

function fmtUI(num) {
    return (num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// === Cálculos en Vivo de F-07 (IVA Mensual) ===
window.calcF07Live = function () {
    const getNum = id => {
        const el = document.getElementById(id);
        return el ? (parseFloat(el.value) || 0) : 0;
    };
    const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.innerText = txt;
    };

    // 1. Débito Fiscal
    const cas10 = getNum('f07-cas-10');
    const cas15 = Math.round(cas10 * 0.13 * 100) / 100;
    setTxt('f07-cas-15', `$ ${fmtUI(cas15)}`);

    const cas20 = getNum('f07-cas-20');
    const cas25 = Math.round(cas20 * 0.13 * 100) / 100;
    setTxt('f07-cas-25', `$ ${fmtUI(cas25)}`);

    const cas30 = getNum('f07-cas-30');
    const cas35 = getNum('f07-cas-35');
    const cas40 = getNum('f07-cas-40');
    const cas85 = getNum('f07-cas-85');
    const cas86 = getNum('f07-cas-86');

    const totalDeb = Math.round((cas15 + cas25) * 100) / 100;
    setTxt('f07-total-debito', `$ ${fmtUI(totalDeb)}`);

    // 2. Crédito Fiscal
    const cas50 = getNum('f07-cas-50');
    const cas55 = Math.round(cas50 * 0.13 * 100) / 100;
    setTxt('f07-cas-55', `$ ${fmtUI(cas55)}`);

    const cas60 = getNum('f07-cas-60');
    const cas65 = Math.round(cas60 * 0.13 * 100) / 100;
    setTxt('f07-cas-65', `$ ${fmtUI(cas65)}`);

    const cas62 = getNum('f07-cas-62');
    const cas67 = Math.round(cas62 * 0.13 * 100) / 100;
    setTxt('f07-cas-67', `$ ${fmtUI(cas67)}`);

    const cas66 = getNum('f07-cas-66');
    const cas70 = getNum('f07-cas-70');
    const cas75 = getNum('f07-cas-75');

    const totalCred = Math.round((cas55 + cas65 + cas67 + cas75) * 100) / 100;
    setTxt('f07-total-credito', `$ ${fmtUI(totalCred)}`);

    // 3. Liquidación de IVA (Art. 65 Ley de IVA)
    const diff = Math.round((totalDeb - totalCred) * 100) / 100;
    const impuestoDet = Math.max(0, diff);
    const remanenteSig = diff < 0 ? Math.abs(diff) : 0;

    setTxt('f07-impuesto-determinado', `$ ${fmtUI(impuestoDet)}`);
    setTxt('f07-remanente-siguiente', `$ ${fmtUI(remanenteSig)}`);

    // 4. Retenciones y Percepciones sufridas acreditables (Arts. 161-163 CT)
    const cas161 = getNum('f07-cas-161');
    const cas162 = getNum('f07-cas-162');
    const totalRetSufridas = Math.round((cas161 + cas162) * 100) / 100;

    // 5. Total a Pagar F-07 (IVA Puro, sin Pago a Cuenta)
    const ivaNetoPagar = Math.max(0, Math.round((impuestoDet - totalRetSufridas) * 100) / 100);
    setTxt('f07-total-pagar-final', `$ ${fmtUI(ivaNetoPagar)}`);

    // Sincronizar estado en memoria
    tributarioData.ventasGravadasCCF = cas10;
    tributarioData.debitoGravadasCCF = cas15;
    tributarioData.ventasConsumidorFinal = cas20;
    tributarioData.debitoConsumidorFinal = cas25;
    tributarioData.ventasZonasFrancas = cas30;
    tributarioData.exportacionesFueraCA = cas35;
    tributarioData.exportacionesCentroamerica = cas40;
    tributarioData.ventasExentas = cas85;
    tributarioData.ventasNoSujetas = cas86;
    tributarioData.totalDebitoFiscal = totalDeb;

    tributarioData.comprasGravadasLocales = cas50;
    tributarioData.creditoComprasLocales = cas55;
    tributarioData.importacionesBienes = cas60;
    tributarioData.creditoImportacionesBienes = cas65;
    tributarioData.importacionesServicios = cas62;
    tributarioData.creditoImportacionesServicios = cas67;
    tributarioData.comprasSujetosExcluidos = cas66;
    tributarioData.comprasExentasNoSujetas = cas70;
    tributarioData.remanenteCreditoAnterior = cas75;
    tributarioData.totalCreditoFiscal = totalCred;

    tributarioData.impuestoDeterminadoIVA = impuestoDet;
    tributarioData.remanenteCreditoSiguiente = remanenteSig;
    tributarioData.percepciones1SufridasIVA = cas161;
    tributarioData.retenciones1SufridasIVA = cas162;
    tributarioData.totalRetencionesSufridasIVA = totalRetSufridas;
    tributarioData.ivaNetoPagar = ivaNetoPagar;
};

// === Cálculos en Vivo de F-14 (Pago a Cuenta y Retenciones) ===
window.calcF14Live = function () {
    const getNum = id => {
        const el = document.getElementById(id);
        return el ? (parseFloat(el.value) || 0) : 0;
    };
    const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.innerText = txt;
    };

    // SECCIÓN A: Pago a Cuenta Propio (Art. 151 C.T.)
    const ingMes = getNum('f14-ingresos-mes');
    const tasaSelect = document.getElementById('f14-pago-cuenta-tasa-select');
    const tasaPC = tasaSelect ? (parseFloat(tasaSelect.value) || 0.0175) : 0.0175;
    const pcDeterminado = Math.round(ingMes * tasaPC * 100) / 100;
    const acredPrev = getNum('f14-acreditaciones-previas');
    const pcSubtotal = Math.max(0, Math.round((pcDeterminado - acredPrev) * 100) / 100);
    setTxt('f14-subtotal-pago-cuenta', `$ ${fmtUI(pcSubtotal)}`);
    setTxt('f14-resumen-pac', `$ ${fmtUI(pcSubtotal)}`);

    // SECCIÓN B: Retenciones ISR a Terceros
    const baseSal = getNum('f14-base-salarios');
    const retSal = getNum('f14-retencion-salarios');

    const baseProf = getNum('f14-base-profesionales');
    const retProf = Math.round(baseProf * 0.10 * 100) / 100;
    setTxt('f14-retencion-10', `$ ${fmtUI(retProf)}`);

    const baseArr = getNum('f14-base-arrendamientos');
    const retArr = Math.round(baseArr * 0.10 * 100) / 100;
    setTxt('f14-retencion-arrendamientos', `$ ${fmtUI(retArr)}`);

    const baseDiv = getNum('f14-base-dividendos');
    const retDiv = Math.round(baseDiv * 0.05 * 100) / 100;
    setTxt('f14-retencion-dividendos', `$ ${fmtUI(retDiv)}`);

    const totRetRenta = Math.round((retSal + retProf + retArr + retDiv) * 100) / 100;
    setTxt('f14-subtotal-renta', `$ ${fmtUI(totRetRenta)}`);
    setTxt('f14-resumen-renta', `$ ${fmtUI(totRetRenta)}`);

    // SECCIÓN C: Retenciones IVA a Terceros (Agente DGII)
    const baseIva1 = getNum('f14-base-iva1');
    const retIva1 = Math.round(baseIva1 * 0.01 * 100) / 100;
    setTxt('f14-retencion-iva1', `$ ${fmtUI(retIva1)}`);

    const baseIva13 = getNum('f14-base-iva13');
    const retIva13 = Math.round(baseIva13 * 0.13 * 100) / 100;
    setTxt('f14-retencion-iva13', `$ ${fmtUI(retIva13)}`);

    const totRetIVA = Math.round((retIva1 + retIva13) * 100) / 100;
    setTxt('f14-subtotal-iva', `$ ${fmtUI(totRetIVA)}`);
    setTxt('f14-resumen-iva', `$ ${fmtUI(totRetIVA)}`);

    // SECCIÓN D: Total Final F-14 a Enterar
    const totalF14 = Math.round((pcSubtotal + totRetRenta + totRetIVA) * 100) / 100;
    setTxt('f14-total-pagar', `$ ${fmtUI(totalF14)}`);

    // Sincronizar estado en memoria
    tributarioData.pagoCuentaIngresosMes = ingMes;
    tributarioData.pagoCuentaTasa = tasaPC;
    tributarioData.pagoCuentaDeterminado = pcDeterminado;
    tributarioData.pagoCuentaAcreditaciones = acredPrev;
    tributarioData.pagoCuentaSubtotal = pcSubtotal;

    tributarioData.rentaSalariosBase = baseSal;
    tributarioData.rentaSalariosRetenida = retSal;
    tributarioData.rentaHonorariosBase = baseProf;
    tributarioData.rentaHonorariosRetenida = retProf;
    tributarioData.rentaArrendamientosBase = baseArr;
    tributarioData.rentaArrendamientosRetenida = retArr;
    tributarioData.rentaDividendosBase = baseDiv;
    tributarioData.rentaDividendosRetenida = retDiv;
    tributarioData.totalRetencionesRenta = totRetRenta;

    tributarioData.ivaRetenido1Base = baseIva1;
    tributarioData.ivaRetenido1Monto = retIva1;
    tributarioData.ivaRetenido13Base = baseIva13;
    tributarioData.ivaRetenido13Monto = retIva13;
    tributarioData.totalRetencionesIVA = totRetIVA;

    tributarioData.totalEnterarF14 = totalF14;
};

// === Renderizado de Libros Legales de IVA ===
function renderAllTributarioViews() {
    renderLibroComprasTable();
    renderLibroVentasTable();
    populateTributarioFields(tributarioData);
    calcF07Live();
    calcF14Live();
    setTimeout(() => window.updateTabIndicator?.(), 50);
}

function renderLibroComprasTable() {
    const tbody = document.getElementById('libro-compras-body');
    if (!tbody) return;

    let totGrav = 0, totIva = 0, totFinal = 0;
    tbody.innerHTML = libroCompras.map((r, i) => {
        totGrav += r.gravada;
        totIva += r.iva;
        totFinal += r.total;
        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="py-2.5 px-3 text-slate-600 dark:text-slate-400 tabular-nums">${r.fecha}</td>
                <td class="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">${r.doc}</td>
                <td class="py-2.5 px-3 text-slate-700 dark:text-slate-300">${r.proveedor}</td>
                <td class="py-2.5 px-3 text-slate-500 tabular-nums">${r.nrc}</td>
                <td class="py-2.5 px-3 text-right tabular-nums font-bold">$ ${fmtUI(r.gravada)}</td>
                <td class="py-2.5 px-3 text-right tabular-nums font-bold text-emerald-600">$ ${fmtUI(r.iva)}</td>
                <td class="py-2.5 px-3 text-right tabular-nums font-black text-slate-800 dark:text-white">$ ${fmtUI(r.total)}</td>
                <td class="py-2.5 px-2 text-center no-print">
                    <button type="button" onclick="deleteDocRow('compras', ${i})" class="text-slate-300 hover:text-rose-500 transition-colors"><i class="fas fa-trash-alt text-xs"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById('libro-compras-tot-grav').innerText = `$ ${fmtUI(totGrav)}`;
    document.getElementById('libro-compras-tot-iva').innerText = `$ ${fmtUI(totIva)}`;
    document.getElementById('libro-compras-tot-final').innerText = `$ ${fmtUI(totFinal)}`;
}

function renderLibroVentasTable() {
    const tbody = document.getElementById('libro-ventas-body');
    if (!tbody) return;

    let totGrav = 0, totIva = 0, totFinal = 0;
    tbody.innerHTML = libroVentas.map((r, i) => {
        totGrav += r.gravada;
        totIva += r.iva;
        totFinal += r.total;
        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="py-2.5 px-3 text-slate-600 dark:text-slate-400 tabular-nums">${r.fecha}</td>
                <td class="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">${r.doc}</td>
                <td class="py-2.5 px-3 text-slate-700 dark:text-slate-300">${r.cliente}</td>
                <td class="py-2.5 px-3 text-slate-500 tabular-nums">${r.nrc}</td>
                <td class="py-2.5 px-3 text-right tabular-nums font-bold">$ ${fmtUI(r.gravada)}</td>
                <td class="py-2.5 px-3 text-right tabular-nums font-bold text-indigo-600">$ ${fmtUI(r.iva)}</td>
                <td class="py-2.5 px-3 text-right tabular-nums font-black text-slate-800 dark:text-white">$ ${fmtUI(r.total)}</td>
                <td class="py-2.5 px-2 text-center no-print">
                    <button type="button" onclick="deleteDocRow('ventas', ${i})" class="text-slate-300 hover:text-rose-500 transition-colors"><i class="fas fa-trash-alt text-xs"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById('libro-ventas-tot-grav').innerText = `$ ${fmtUI(totGrav)}`;
    document.getElementById('libro-ventas-tot-iva').innerText = `$ ${fmtUI(totIva)}`;
    document.getElementById('libro-ventas-tot-final').innerText = `$ ${fmtUI(totFinal)}`;
}

window.deleteDocRow = function (type, idx) {
    if (type === 'compras') libroCompras.splice(idx, 1);
    else libroVentas.splice(idx, 1);
    saveTributarioState();
    renderAllTributarioViews();
};

window.openAddDocModal = function (type) {
    const title = type === 'compras' ? 'Añadir Comprobante a Libro de Compras' : 'Añadir Comprobante a Libro de Ventas';
    const contraparteLabel = type === 'compras' ? 'Proveedor' : 'Cliente';
    
    const fecha = prompt("Fecha de Emisión (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    if (!fecha) return;
    const doc = prompt("Número de CCF / Factura:", type === 'compras' ? "CCF-0999" : "CCF-0101");
    if (!doc) return;
    const contraparte = prompt(`Nombre del ${contraparteLabel}:`, "Empresa Salvadoreña, S.A. de C.V.");
    if (!contraparte) return;
    const nrc = prompt("NRC del Contribuyente:", "0614-123456-101-1");
    const gravada = parseFloat(prompt("Valor Gravado ($ sin IVA):", "1000.00")) || 0;
    const iva = Math.round(gravada * 0.13 * 100) / 100;
    const total = gravada + iva;

    const row = { fecha, doc, [type === 'compras' ? 'proveedor' : 'cliente']: contraparte, nrc: nrc || '—', gravada, iva, total };
    if (type === 'compras') libroCompras.push(row);
    else libroVentas.push(row);

    saveTributarioState();
    renderAllTributarioViews();
};

// === Notificaciones Toast del Módulo Tributario ===
function showTributarioToast(title, msg) {
    const toast = document.getElementById('sync-toast');
    if (toast) {
        const h4 = toast.querySelector('h4');
        const p = toast.querySelector('p');
        if (h4) h4.innerText = title;
        if (p) p.innerText = msg;
        toast.classList.remove('translate-y-32', 'opacity-0');
        setTimeout(() => toast.classList.add('translate-y-32', 'opacity-0'), 3000);
    } else {
        alert(`${title}: ${msg}`);
    }
}

// === PUENTES INTERMODULARES DE CONCILIACIÓN ===

// 1. Conciliación de Libros de IVA hacia Formulario F-07
window.conciliarLibrosToF07 = function () {
    let totGravVentas = 0;
    libroVentas.forEach(r => { totGravVentas += (parseFloat(r.gravada) || 0); });

    let totGravCompras = 0;
    libroCompras.forEach(r => { totGravCompras += (parseFloat(r.gravada) || 0); });

    totGravVentas = Math.round(totGravVentas * 100) / 100;
    totGravCompras = Math.round(totGravCompras * 100) / 100;

    const elCas10 = document.getElementById('f07-cas-10');
    if (elCas10) elCas10.value = totGravVentas.toFixed(2);

    const elCas50 = document.getElementById('f07-cas-50');
    if (elCas50) elCas50.value = totGravCompras.toFixed(2);

    calcF07Live();
    saveTributarioState();

    showTributarioToast(
        "Libros IVA Conciliados",
        `Ventas Gravadas ($${fmtUI(totGravVentas)}) y Compras ($${fmtUI(totGravCompras)}) transferidas a Casillas 10 y 50 de F-07.`
    );
};

// 2. Sincronización desde Módulo Planillas hacia Formulario F-14
window.importFromPlanillasToF14 = function () {
    let baseSalarios = 0;
    let retencionSalarios = 0;
    let foundPlanilla = false;

    try {
        const raw = localStorage.getItem('educonta_projects_planillas');
        if (raw) {
            const projects = JSON.parse(raw);
            if (Array.isArray(projects) && projects.length > 0) {
                const lastId = localStorage.getItem('educonta_last_project_id');
                const proj = projects.find(p => p.id === lastId) || projects[0];
                if (proj && proj.sheets && proj.sheets.length > 0) {
                    proj.sheets.forEach(sheet => {
                        if (sheet.employees && Array.isArray(sheet.employees)) {
                            sheet.employees.forEach(emp => {
                                const dev = emp._computed?.total_devengado ?? emp.salario_base ?? 0;
                                const rent = emp._computed?.renta ?? 0;
                                baseSalarios += (parseFloat(dev) || 0);
                                retencionSalarios += (parseFloat(rent) || 0);
                            });
                        }
                    });
                    if (baseSalarios > 0) {
                        foundPlanilla = true;
                    }
                }
            }
        }
    } catch (e) {
        console.warn("Error leyendo proyectos de planilla:", e);
    }

    if (!foundPlanilla || baseSalarios === 0) {
        baseSalarios = 4500.00;
        retencionSalarios = 185.40;
        showTributarioToast(
            "Valores Didácticos Cargados",
            "No se detectó planilla con cálculos previos. Se asignó base estándar de salarios ($4,500.00) y retención ISR ($185.40)."
        );
    } else {
        baseSalarios = Math.round(baseSalarios * 100) / 100;
        retencionSalarios = Math.round(retencionSalarios * 100) / 100;
        showTributarioToast(
            "Planilla Sincronizada",
            `Base de Sueldos ($${fmtUI(baseSalarios)}) y Retención ISR ($${fmtUI(retencionSalarios)}) transferidas a Sección B del F-14.`
        );
    }

    const elBase = document.getElementById('f14-base-salarios');
    if (elBase) elBase.value = baseSalarios.toFixed(2);

    const elRet = document.getElementById('f14-retencion-salarios');
    if (elRet) elRet.value = retencionSalarios.toFixed(2);

    calcF14Live();
    saveTributarioState();
};

// =========================================================================
// === MOTOR DE FORMULARIOS DINÁMICOS: DGII NACIONALES Y 262 DISTRITOS MUNICIPALES ===
// =========================================================================

async function initCatalogoTributarioUI() {
    if (typeof window.loadCatalogoTributario === 'function') {
        try {
            await window.loadCatalogoTributario();
        } catch (e) {
            console.warn("Aviso al cargar catálogo tributario:", e);
        }
    }
    populateDgiiSelectors();
    populateDeptoSelector();
}

window.addEventListener('educonta:catalogoTributarioLoaded', () => {
    populateDgiiSelectors();
    populateDeptoSelector();
});

// ── 1. SELECTORES TERRITORIALES EN CASCADA (14 Deptos -> 44 Municipios -> 262 Distritos) ──
function populateDeptoSelector() {
    const sel = document.getElementById('select-trib-depto');
    if (!sel) return;

    const deptosMap = new Map();
    (window.TERRITORIO_SV || []).forEach(t => {
        if (t.departamento_codigo && !deptosMap.has(t.departamento_codigo)) {
            deptosMap.set(t.departamento_codigo, t.departamento_nombre);
        }
    });

    const deptos = Array.from(deptosMap.entries())
        .map(([codigo, nombre]) => ({ codigo, nombre }))
        .sort((a, b) => a.codigo.localeCompare(b.codigo));

    if (deptos.length === 0) return;

    sel.innerHTML = deptos.map(d => `<option value="${d.codigo}">${d.codigo} — ${d.nombre}</option>`).join('');

    const targetDepto = tributarioData.filtroMunicipal?.departamento_codigo || '06';
    if (deptos.some(d => d.codigo === targetDepto)) {
        sel.value = targetDepto;
    } else {
        sel.value = deptos[0].codigo;
    }

    onTribDeptoChange(false);
}

window.onTribDeptoChange = function (userTriggered = true) {
    const selDepto = document.getElementById('select-trib-depto');
    const selMuni = document.getElementById('select-trib-municipio');
    if (!selDepto || !selMuni) return;

    const deptoCode = selDepto.value;
    tributarioData.filtroMunicipal.departamento_codigo = deptoCode;

    const munisMap = new Map();
    (window.TERRITORIO_SV || []).filter(t => t.departamento_codigo === deptoCode).forEach(t => {
        if (t.municipio_codigo && !munisMap.has(t.municipio_codigo)) {
            munisMap.set(t.municipio_codigo, t.municipio_nombre);
        }
    });

    const munis = Array.from(munisMap.entries())
        .map(([codigo, nombre]) => ({ codigo, nombre }))
        .sort((a, b) => a.codigo.localeCompare(b.codigo));

    selMuni.innerHTML = munis.map(m => `<option value="${m.codigo}">${m.nombre}</option>`).join('');

    if (!userTriggered && munis.some(m => m.codigo === tributarioData.filtroMunicipal.municipio_codigo)) {
        selMuni.value = tributarioData.filtroMunicipal.municipio_codigo;
    } else if (munis.length > 0) {
        selMuni.value = munis[0].codigo;
        tributarioData.filtroMunicipal.municipio_codigo = munis[0].codigo;
    }

    onTribMunicipioChange(userTriggered);
};

window.onTribMunicipioChange = function (userTriggered = true) {
    const selMuni = document.getElementById('select-trib-municipio');
    const selDist = document.getElementById('select-trib-distrito');
    if (!selMuni || !selDist) return;

    const muniCode = selMuni.value;
    tributarioData.filtroMunicipal.municipio_codigo = muniCode;

    const distritos = (window.TERRITORIO_SV || [])
        .filter(t => t.municipio_codigo === muniCode)
        .sort((a, b) => a.distrito_codigo.localeCompare(b.distrito_codigo));

    selDist.innerHTML = distritos.map(d => `
        <option value="${d.distrito_codigo}">
            ${d.distrito_nombre}${d.es_cabecera_departamental ? ' ★ (Cabecera)' : ''}
        </option>
    `).join('');

    if (!userTriggered && distritos.some(d => d.distrito_codigo === tributarioData.filtroMunicipal.distrito_codigo)) {
        selDist.value = tributarioData.filtroMunicipal.distrito_codigo;
    } else if (distritos.length > 0) {
        selDist.value = distritos[0].distrito_codigo;
        tributarioData.filtroMunicipal.distrito_codigo = distritos[0].distrito_codigo;
    }

    onTribDistritoChange(userTriggered);
};

window.onTribDistritoChange = function (userTriggered = true) {
    const selDist = document.getElementById('select-trib-distrito');
    const selForm = document.getElementById('select-trib-form-municipal');
    const badge = document.getElementById('badge-territorio-resumen');
    if (!selDist || !selForm) return;

    const distCode = selDist.value;
    tributarioData.filtroMunicipal.distrito_codigo = distCode;

    const distObj = (window.TERRITORIO_SV || []).find(t => t.distrito_codigo === distCode);
    if (badge && distObj) {
        badge.textContent = `${distObj.departamento_nombre} • ${distObj.municipio_nombre} • ${distObj.distrito_nombre}`;
    }

    let forms = (window.CATALOGO_FORMULARIOS_TRIBUTARIOS || []).filter(f => f.ambito === 'MUNICIPAL' && f.distrito_codigo === distCode);
    if (forms.length === 0) {
        forms = (window.CATALOGO_FORMULARIOS_TRIBUTARIOS || []).filter(f => f.ambito === 'MUNICIPAL');
    }

    selForm.innerHTML = forms.map(f => `<option value="${f.codigo_unico}">${f.codigo_formulario} — ${f.nombre_oficial}</option>`).join('');

    if (!userTriggered && forms.some(f => f.codigo_unico === tributarioData.filtroMunicipal.codigo_unico)) {
        selForm.value = tributarioData.filtroMunicipal.codigo_unico;
    } else if (forms.length > 0) {
        selForm.value = forms[0].codigo_unico;
        tributarioData.filtroMunicipal.codigo_unico = forms[0].codigo_unico;
    }

    onTribFormMunicipalChange();
};

window.onTribFormMunicipalChange = function () {
    const selForm = document.getElementById('select-trib-form-municipal');
    if (!selForm) return;

    const codUnico = selForm.value;
    tributarioData.filtroMunicipal.codigo_unico = codUnico;

    const reglaObj = (window.CATALOGO_FORMULARIOS_TRIBUTARIOS || []).find(f => f.codigo_unico === codUnico);
    if (reglaObj) {
        renderDynamicForm(reglaObj, 'municipal-dynamic-form-container');
    }

    if (typeof window.refreshEduContaGlassSelects === 'function') {
        window.refreshEduContaGlassSelects(document.getElementById('view-municipales'));
    }

    saveTributarioState();
};

// ── 2. SELECTORES DE OTROS FORMULARIOS NACIONALES DGII ──
function populateDgiiSelectors() {
    const selCat = document.getElementById('select-dgii-categoria');
    const selForm = document.getElementById('select-dgii-formulario');
    if (!selCat || !selForm) return;

    const cat = selCat.value || 'DECLARACION_PAGO';
    tributarioData.dgiiCategoriaActiva = cat;

    let forms = (window.CATALOGO_FORMULARIOS_TRIBUTARIOS || []).filter(f => {
        if (f.ambito !== 'DGII') return false;
        if (f.codigo_unico === 'DGII-F07' || f.codigo_unico === 'DGII-F14') return false;
        if (cat !== 'TODOS' && f.categoria !== cat) return false;
        return true;
    });

    if (forms.length === 0) {
        forms = (window.CATALOGO_FORMULARIOS_TRIBUTARIOS || []).filter(f => f.ambito === 'DGII' && f.codigo_unico !== 'DGII-F07' && f.codigo_unico !== 'DGII-F14');
    }

    selForm.innerHTML = forms.map(f => `
        <option value="${f.codigo_unico}">
            [${f.codigo_formulario} ${f.version_oficial || ''}] ${f.nombre_oficial}
        </option>
    `).join('');

    const activeForm = tributarioData.dgiiFormUnicoActivo || 'DGII-F11';
    if (forms.some(f => f.codigo_unico === activeForm)) {
        selForm.value = activeForm;
    } else if (forms.length > 0) {
        selForm.value = forms[0].codigo_unico;
        tributarioData.dgiiFormUnicoActivo = forms[0].codigo_unico;
    }

    onDgiiFormularioChange();
}

window.onDgiiCategoriaChange = function () {
    const selCat = document.getElementById('select-dgii-categoria');
    if (selCat) {
        tributarioData.dgiiCategoriaActiva = selCat.value;
    }
    populateDgiiSelectors();
};

window.onDgiiFormularioChange = function () {
    const selForm = document.getElementById('select-dgii-formulario');
    if (!selForm) return;

    const codUnico = selForm.value;
    tributarioData.dgiiFormUnicoActivo = codUnico;

    const reglaObj = (window.CATALOGO_FORMULARIOS_TRIBUTARIOS || []).find(f => f.codigo_unico === codUnico);
    if (reglaObj) {
        renderDynamicForm(reglaObj, 'dgii-dynamic-form-container');
    }

    if (typeof window.refreshEduContaGlassSelects === 'function') {
        window.refreshEduContaGlassSelects(document.getElementById('view-dgii-otros'));
    }

    saveTributarioState();
};

// ── 3. MOTOR EVALUADOR DE FÓRMULAS TRIBUTARIAS Y MUNICIPALES ──
function ROUND(val, dec = 2) {
    const num = parseFloat(val) || 0;
    const factor = Math.pow(10, dec);
    return Math.round((num + Number.EPSILON) * factor) / factor;
}

function MAX(a, b) {
    return Math.max(parseFloat(a) || 0, parseFloat(b) || 0);
}

const DEFAULT_TRAMOS_MUNICIPALES = {
    COMERCIO: [
        { desde: 0.01, hasta: 5000.0, exceso_de: 0.0, cuota_fija: 3.43, por_millar: 1.0 },
        { desde: 5000.01, hasta: 50000.0, exceso_de: 5000.0, cuota_fija: 8.43, por_millar: 1.25 },
        { desde: 50000.01, hasta: 250000.0, exceso_de: 50000.0, cuota_fija: 64.68, por_millar: 1.1 },
        { desde: 250000.01, hasta: null, exceso_de: 250000.0, cuota_fija: 284.68, por_millar: 0.85 }
    ],
    INDUSTRIA: [
        { desde: 0.01, hasta: 5000.0, exceso_de: 0.0, cuota_fija: 3.43, por_millar: 0.9 },
        { desde: 5000.01, hasta: 50000.0, exceso_de: 5000.0, cuota_fija: 7.93, por_millar: 1.1 },
        { desde: 50000.01, hasta: 250000.0, exceso_de: 50000.0, cuota_fija: 57.43, por_millar: 0.95 },
        { desde: 250000.01, hasta: null, exceso_de: 250000.0, cuota_fija: 247.43, por_millar: 0.75 }
    ],
    SERVICIOS: [
        { desde: 0.01, hasta: 5000.0, exceso_de: 0.0, cuota_fija: 4.0, por_millar: 1.2 },
        { desde: 5000.01, hasta: 50000.0, exceso_de: 5000.0, cuota_fija: 10.0, por_millar: 1.35 },
        { desde: 50000.01, hasta: 250000.0, exceso_de: 50000.0, cuota_fija: 70.75, por_millar: 1.15 },
        { desde: 250000.01, hasta: null, exceso_de: 250000.0, cuota_fija: 300.75, por_millar: 0.9 }
    ],
    FINANCIERO: [
        { desde: 0.01, hasta: 100000.0, exceso_de: 0.0, cuota_fija: 150.0, por_millar: 1.8 },
        { desde: 100000.01, hasta: 1000000.0, exceso_de: 100000.0, cuota_fija: 330.0, por_millar: 1.5 },
        { desde: 1000000.01, hasta: null, exceso_de: 1000000.0, cuota_fija: 1680.0, por_millar: 1.15 }
    ]
};

const DEFAULT_TABLA_ISR_PN = [
    { desde: 0.01, hasta: 4064.0, cuota_fija: 0.0, porcentaje: 0.0, exceso_sobre: 0.0 },
    { desde: 4064.01, hasta: 9142.86, cuota_fija: 212.12, porcentaje: 0.1, exceso_sobre: 4064.0 },
    { desde: 9142.87, hasta: 22857.14, cuota_fija: 720.0, porcentaje: 0.2, exceso_sobre: 9142.86 },
    { desde: 22857.15, hasta: null, cuota_fija: 3462.86, porcentaje: 0.3, exceso_sobre: 22857.14 }
];

function CALC_TARIFA_MUNICIPAL(sector, activoImponible, reglasCalculo) {
    const numActivo = parseFloat(activoImponible) || 0;
    if (numActivo <= 0) return 0.00;
    let secKey = String(sector || 'COMERCIO').toUpperCase().trim();
    if (secKey.startsWith('IND')) secKey = 'INDUSTRIA';
    else if (secKey.startsWith('SER')) secKey = 'SERVICIOS';
    else if (secKey.startsWith('FIN')) secKey = 'FINANCIERO';
    else if (secKey.startsWith('COM')) secKey = 'COMERCIO';

    const sourceTramos = reglasCalculo?.tramos_por_sector || DEFAULT_TRAMOS_MUNICIPALES;
    const tramos = sourceTramos[secKey] || sourceTramos['COMERCIO'] || DEFAULT_TRAMOS_MUNICIPALES.COMERCIO;
    for (const t of tramos) {
        const desde = parseFloat(t.desde) || 0;
        const hasta = t.hasta !== null && t.hasta !== undefined ? parseFloat(t.hasta) : Infinity;
        if (numActivo >= desde && numActivo <= hasta) {
            const cuotaFija = parseFloat(t.cuota_fija) || 0;
            const porMillar = parseFloat(t.por_millar) || 0;
            const excesoDe = parseFloat(t.exceso_de) || 0;
            const excedente = Math.max(0, numActivo - excesoDe);
            const impuesto = cuotaFija + ((excedente / 1000.0) * porMillar);
            return Math.round((impuesto + Number.EPSILON) * 100) / 100;
        }
    }
    return 0.00;
}
window.CALC_TARIFA_MUNICIPAL = CALC_TARIFA_MUNICIPAL;

function CALC_ISR_ANUAL(tipoSujeto, rentasGravadas, rentaNetaImponible, reglasCalculo) {
    // Tolerancia ante invocación simplificada CALC_ISR_ANUAL(rentaNeta)
    if (typeof tipoSujeto === 'number') {
        rentaNetaImponible = tipoSujeto;
        rentasGravadas = rentasGravadas !== undefined && typeof rentasGravadas === 'number' && rentasGravadas > 0 ? rentasGravadas : tipoSujeto;
        tipoSujeto = 'PN';
    }
    const rGrav = parseFloat(rentasGravadas) || 0;
    const rNeta = parseFloat(rentaNetaImponible) || 0;
    if (rNeta <= 0) return 0.00;

    if (String(tipoSujeto).toUpperCase() === 'PJ') {
        const umbral = reglasCalculo?.persona_juridica?.umbral_rentas_gravadas_reducida || 150000;
        const tasa = rGrav <= umbral
            ? (reglasCalculo?.persona_juridica?.tasa_reducida || 0.25)
            : (reglasCalculo?.persona_juridica?.tasa_general || 0.30);
        return Math.round((rNeta * tasa + Number.EPSILON) * 100) / 100;
    } else {
        const tramos = reglasCalculo?.tabla_persona_natural_art37 || DEFAULT_TABLA_ISR_PN;
        for (const t of tramos) {
            const desde = parseFloat(t.desde) || 0;
            const hasta = t.hasta !== null && t.hasta !== undefined ? parseFloat(t.hasta) : Infinity;
            if (rNeta >= desde && rNeta <= hasta) {
                const fijo = parseFloat(t.cuota_fija) || 0;
                const porc = parseFloat(t.porcentaje) || 0;
                const exceso = parseFloat(t.exceso_sobre) || 0;
                return Math.round(((fijo + (rNeta - exceso) * porc) + Number.EPSILON) * 100) / 100;
            }
        }
        return 0.00;
    }
}
window.CALC_ISR_ANUAL = CALC_ISR_ANUAL;

function evalFormulaExpression(formulaStr, vals, reglaObj) {
    if (!formulaStr) return 0;
    const str = String(formulaStr).trim();
    if (!isNaN(Number(str))) return Number(str);

    // Reemplazo de tokens [TOKEN] por sus valores
    const replaced = str.replace(/\[([A-Za-z0-9\-_]+)\]/g, (match, code) => {
        const rawVal = vals[code];
        if (typeof rawVal === 'string' && isNaN(Number(rawVal))) {
            return JSON.stringify(rawVal);
        }
        return `(${Number(rawVal) || 0})`;
    });

    try {
        const fn = new Function(
            'ROUND',
            'MAX',
            'CALC_TARIFA_MUNICIPAL',
            'CALC_ISR_ANUAL',
            `return ${replaced};`
        );
        const res = fn(
            ROUND,
            MAX,
            (sector, act) => CALC_TARIFA_MUNICIPAL(sector, act, reglaObj?.reglas_calculo),
            (sujeto, grav, neta) => CALC_ISR_ANUAL(sujeto, grav, neta, reglaObj?.reglas_calculo)
        );
        return typeof res === 'number' && !isNaN(res) ? Math.round((res + Number.EPSILON) * 100) / 100 : res;
    } catch (e) {
        console.warn(`Error al evaluar fórmula "${formulaStr}":`, e);
        return 0;
    }
}

function computeExpectedValues(reglaObj, userInputs = {}) {
    const vals = Object.assign({}, userInputs);
    if (!reglaObj || !reglaObj.esquema_casillas?.secciones) return vals;

    // Ejecutar hasta 3 pases para resolver dependencias encadenadas
    for (let pass = 0; pass < 3; pass++) {
        reglaObj.esquema_casillas.secciones.forEach(sec => {
            (sec.casillas || []).forEach(casilla => {
                if (casilla.formula) {
                    vals[casilla.codigo] = evalFormulaExpression(casilla.formula, vals, reglaObj);
                } else if (casilla.tipo?.startsWith('select_') && (vals[casilla.codigo] === undefined || vals[casilla.codigo] === '')) {
                    vals[casilla.codigo] = casilla.opciones?.[0]?.valor || '';
                } else if (casilla.tipo === 'input_moneda' && vals[casilla.codigo] === undefined) {
                    vals[casilla.codigo] = 0;
                }
            });
        });
    }

    return vals;
}

// ── 4. MOTOR UNIVERSAL DE RENDERIZADO DE FORMULARIOS DINÁMICOS ──
function renderDynamicForm(reglaObj, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !reglaObj) return;

    if (!tributarioData.declaracionesDinamicas) {
        tributarioData.declaracionesDinamicas = {};
    }
    if (!tributarioData.declaracionesDinamicas[reglaObj.codigo_unico]) {
        tributarioData.declaracionesDinamicas[reglaObj.codigo_unico] = {};
    }
    const formState = tributarioData.declaracionesDinamicas[reglaObj.codigo_unico];
    const isMunicipal = reglaObj.ambito === 'MUNICIPAL';
    const isAsistido = tributarioMode === 'asistido';

    // Pre-calcular valores esperados
    const expectedValues = computeExpectedValues(reglaObj, formState);
    if (isAsistido) {
        Object.assign(formState, expectedValues);
    }

    let html = '';

    // Encabezado Oficial con Gradiente Glassmorphism
    html += `
        <div class="sheet-card-glass bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl overflow-hidden mb-6">
            <div class="form-header-gradient p-6 text-white relative">
                <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="space-y-1.5">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                                <i class="fas ${isMunicipal ? 'fa-city' : 'fa-landmark'} mr-1"></i> Formulario Oficial ${reglaObj.codigo_formulario} (${reglaObj.version_oficial || 'Vigente'})
                            </span>
                            <span class="px-3 py-1 rounded-full ${isMunicipal ? 'bg-amber-500/30 border border-amber-400/40 text-amber-200' : 'bg-indigo-500/30 border border-indigo-400/40 text-indigo-200'} text-[10px] font-bold">
                                ${reglaObj.entidad_recaudadora || (isMunicipal ? 'Alcaldía Municipal' : 'Ministerio de Hacienda · DGII')}
                            </span>
                            ${reglaObj.es_cabecera_departamental ? '<span class="px-2.5 py-0.5 rounded-full bg-amber-400/25 text-amber-300 border border-amber-400/40 text-[9px] font-black uppercase tracking-wider">★ Cabecera Departamental</span>' : ''}
                        </div>
                        <h2 class="text-xl md:text-2xl font-black tracking-tight leading-tight pt-1 text-white">
                            ${reglaObj.nombre_oficial}
                        </h2>
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-indigo-200/90 font-medium pt-1">
                            <span><i class="fas fa-scale-balanced mr-1 text-indigo-300"></i> ${reglaObj.base_legal || 'Legislación Tributaria Vigente'}</span>
                            <span>•</span>
                            <span><i class="fas fa-calendar mr-1 text-indigo-300"></i> Periodicidad: <strong>${reglaObj.periodicidad || 'ANUAL'}</strong></span>
                            <span>•</span>
                            <span><i class="fas fa-clock mr-1 text-indigo-300"></i> Plazo: <strong>${reglaObj.plazo_vencimiento || 'Según Ley'}</strong></span>
                        </div>
                    </div>
                    ${reglaObj.url_oficial ? `
                    <div class="shrink-0 flex items-center gap-2">
                        <a href="${reglaObj.url_oficial}" target="_blank" rel="noopener noreferrer"
                           class="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 backdrop-blur-sm transition-all hover:scale-105 active:scale-95 shadow-lg">
                            <i class="fas fa-external-link-alt text-[10px]"></i> Portal Oficial
                        </a>
                    </div>
                    ` : ''}
                </div>
            </div>
            ${reglaObj.descripcion_didactica ? `
            <div class="p-4 bg-indigo-50/60 dark:bg-slate-850/60 border-t border-indigo-100/60 dark:border-slate-800 flex items-start gap-3">
                <i class="fas fa-circle-info text-indigo-500 mt-0.5 text-sm shrink-0"></i>
                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    ${reglaObj.descripcion_didactica}
                </p>
            </div>
            ` : ''}
        </div>
    `;

    // CASO B: Formulario sin secciones (Informativo / Registral)
    if (!reglaObj.esquema_casillas?.secciones || reglaObj.esquema_casillas.secciones.length === 0) {
        html += `
            <div class="sheet-card-glass bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl p-6 space-y-5">
                <div class="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div class="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 font-black text-sm">
                        <i class="fas fa-file-contract"></i>
                    </div>
                    <div>
                        <h4 class="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
                            Ficha Normativa y de Control de Trámite
                        </h4>
                        <p class="text-[11px] font-semibold text-slate-400">
                            Este formulario es de presentación informativa, formalización de registro o solicitud formal
                        </p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                        <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Base Legal Aplicable:</span>
                        <p class="font-bold text-slate-700 dark:text-slate-200">${reglaObj.base_legal || 'Código Tributario de El Salvador'}</p>
                    </div>
                    <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                        <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Plazo Legal de Presentación:</span>
                        <p class="font-bold text-slate-700 dark:text-slate-200">${reglaObj.plazo_vencimiento || 'A requerimiento del fisco o por evento'}</p>
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        <i class="fas fa-pencil-alt text-indigo-500 mr-1"></i> Anotaciones Didácticas y Control del Trámite (Estudiante):
                    </label>
                    <textarea rows="4"
                              placeholder="Escribe aquí las observaciones, comprobantes adjuntos, requisitos cumplidos o notas didácticas para la presentación de este trámite..."
                              oninput="onDynamicNotesInput('${reglaObj.codigo_unico}', this.value)"
                              ${window.isAuditMode ? 'disabled' : ''}
                              class="w-full p-4 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all">${formState.notas || ''}</textarea>
                </div>
            </div>
        `;
        container.innerHTML = html;
        return;
    }

    // CASO A: Formulario con secciones y casillas tributarias
    reglaObj.esquema_casillas.secciones.forEach((sec, sIdx) => {
        html += `
            <div class="sheet-card-glass bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl p-5 md:p-6 space-y-4 mb-6">
                <!-- Cabecera de Sección -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div class="flex items-center gap-2.5">
                        <span class="px-2.5 py-1 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-mono font-black text-xs uppercase tracking-wider border border-indigo-500/20">
                            Sección ${sec.numero || sIdx + 1}
                        </span>
                        <h3 class="text-sm md:text-base font-black text-slate-800 dark:text-white leading-snug">
                            ${sec.titulo}
                        </h3>
                    </div>
                    ${sec.base_legal ? `
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        ${sec.base_legal}
                    </span>
                    ` : ''}
                </div>

                <!-- Lista de Casillas de la Sección -->
                <div class="space-y-3">
        `;

        (sec.casillas || []).forEach(cas => {
            const rawVal = formState[cas.codigo] !== undefined ? formState[cas.codigo] : (expectedValues[cas.codigo] !== undefined ? expectedValues[cas.codigo] : '');

            if (cas.tipo === 'input_moneda') {
                html += `
                    <div class="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 casilla-row">
                        <div class="flex items-start gap-2.5 min-w-0">
                            <span class="px-2 py-0.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-mono font-black text-xs shrink-0 border border-indigo-500/20 mt-0.5">
                                [${cas.codigo}]
                            </span>
                            <div class="min-w-0">
                                <label class="font-bold text-xs text-slate-800 dark:text-slate-100 block leading-snug">
                                    ${cas.etiqueta}
                                </label>
                            </div>
                        </div>
                        <div class="w-full sm:w-48 shrink-0">
                            <input type="number" step="0.01" data-casilla-codigo="${cas.codigo}"
                                   value="${rawVal !== '' && rawVal !== 0 ? rawVal : (rawVal === 0 ? '0.00' : '')}"
                                   oninput="onDynamicCasillaInput('${reglaObj.codigo_unico}', '${cas.codigo}', this.value)"
                                   placeholder="0.00"
                                   ${window.isAuditMode ? 'disabled' : ''}
                                   class="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl tabular-nums font-black text-right text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner">
                        </div>
                    </div>
                `;
            } else if (cas.tipo?.startsWith('select_')) {
                const currentOptVal = formState[cas.codigo] || cas.opciones?.[0]?.valor || '';
                html += `
                    <div class="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 casilla-row">
                        <div class="flex items-start gap-2.5 min-w-0">
                            <span class="px-2 py-0.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-mono font-black text-xs shrink-0 border border-indigo-500/20 mt-0.5">
                                [${cas.codigo}]
                            </span>
                            <div class="min-w-0">
                                <label class="font-bold text-xs text-slate-800 dark:text-slate-100 block leading-snug">
                                    ${cas.etiqueta}
                                </label>
                            </div>
                        </div>
                        <div class="w-full sm:w-64 shrink-0">
                            <select data-casilla-codigo="${cas.codigo}"
                                    onchange="onDynamicCasillaInput('${reglaObj.codigo_unico}', '${cas.codigo}', this.value)"
                                    ${window.isAuditMode ? 'disabled' : ''}
                                    class="w-full">
                                ${(cas.opciones || []).map(opt => `
                                    <option value="${opt.valor}" ${opt.valor === currentOptVal ? 'selected' : ''}>
                                        ${opt.etiqueta || opt.valor}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                `;
            } else if (cas.tipo === 'calculado' || cas.tipo === 'subtotal') {
                const isSubtotal = cas.tipo === 'subtotal';
                if (isAsistido) {
                    html += `
                        <div class="p-3.5 ${isSubtotal ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50' : 'bg-slate-50/60 dark:bg-slate-850/40 border-slate-200/60 dark:border-slate-800/50'} rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 casilla-row">
                            <div class="flex items-start gap-2.5 min-w-0">
                                <span class="px-2 py-0.5 rounded-lg bg-slate-500/15 text-slate-600 dark:text-slate-400 font-mono font-black text-xs shrink-0 border border-slate-300 dark:border-slate-700 mt-0.5">
                                    [${cas.codigo}]
                                </span>
                                <div class="min-w-0">
                                    <span class="${isSubtotal ? 'font-black uppercase text-indigo-900 dark:text-indigo-200 text-xs' : 'font-bold text-xs text-slate-700 dark:text-slate-300'} block leading-snug">
                                        ${cas.etiqueta}
                                    </span>
                                    <span class="text-[9px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                        <i class="fas fa-calculator text-[8px] text-indigo-400"></i> ${cas.formula || 'Cálculo Asistido'}
                                    </span>
                                </div>
                            </div>
                            <div class="text-right shrink-0">
                                <span id="dyn-${reglaObj.codigo_unico}-${cas.codigo}"
                                      class="font-black tabular-nums text-sm ${isSubtotal ? 'text-indigo-700 dark:text-indigo-300 text-base' : 'text-slate-800 dark:text-slate-100'}">
                                    $ ${fmtUI(expectedValues[cas.codigo] || 0)}
                                </span>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="p-3.5 ${isSubtotal ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50' : 'bg-slate-50/60 dark:bg-slate-850/40 border-slate-200/60 dark:border-slate-800/50'} rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 casilla-row">
                            <div class="flex items-start gap-2.5 min-w-0">
                                <span class="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-black text-xs shrink-0 border border-amber-500/30 mt-0.5">
                                    [${cas.codigo}]
                                </span>
                                <div class="min-w-0">
                                    <span class="font-bold text-xs text-slate-800 dark:text-slate-100 block leading-snug">
                                        ${cas.etiqueta}
                                    </span>
                                    <span class="text-[9px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                                        <i class="fas fa-pencil text-[8px]"></i> Ingresa tu cálculo para autoevaluación MINED
                                    </span>
                                </div>
                            </div>
                            <div class="w-full sm:w-48 shrink-0">
                                <input type="number" step="0.01" data-casilla-codigo="${cas.codigo}"
                                       value="${formState[cas.codigo] !== undefined ? formState[cas.codigo] : ''}"
                                       oninput="onDynamicCasillaInput('${reglaObj.codigo_unico}', '${cas.codigo}', this.value)"
                                       placeholder="Tu cálculo..."
                                       ${window.isAuditMode ? 'disabled' : ''}
                                       class="w-full p-2 bg-white dark:bg-slate-900 border-2 border-dashed border-indigo-400 dark:border-indigo-600 rounded-xl tabular-nums font-black text-right text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                            </div>
                        </div>
                    `;
                }
            } else if (cas.tipo === 'total_final') {
                const finalVal = isAsistido ? (expectedValues[cas.codigo] || 0) : (formState[cas.codigo] !== undefined ? formState[cas.codigo] : (expectedValues[cas.codigo] || 0));
                html += `
                    <div class="${isMunicipal ? 'result-card-indigo' : 'result-card-purple'} p-6 text-white rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 shadow-xl">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-3xl shrink-0 border border-white/20">
                                <i class="fas ${isMunicipal ? 'fa-building-shield' : 'fa-hand-holding-dollar'}"></i>
                            </div>
                            <div>
                                <span class="text-xs text-indigo-200 uppercase font-black tracking-widest block">Liquidación Final</span>
                                <h4 class="text-base font-black leading-snug">${cas.etiqueta}</h4>
                                <span class="text-[10px] text-indigo-200/90 font-mono">${cas.formula || ''}</span>
                            </div>
                        </div>
                        <div class="text-center sm:text-right shrink-0">
                            <span class="text-xs text-indigo-200 uppercase font-black tracking-widest block mb-1">Monto a Enterar ($)</span>
                            <div id="dyn-${reglaObj.codigo_unico}-${cas.codigo}" class="text-3xl lg:text-4xl font-black tabular-nums tracking-tight text-white glow-white">
                                $ ${fmtUI(finalVal)}
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        html += `
                </div>
            </div>
        `;
    });

    // Tabla didáctica de Tramos Municipales por Sector
    if (isMunicipal && reglaObj.reglas_calculo?.tramos_por_sector) {
        const currentSector = formState['M-01'] || 'COMERCIO';
        const tramos = reglaObj.reglas_calculo.tramos_por_sector[currentSector] || reglaObj.reglas_calculo.tramos_por_sector['COMERCIO'] || [];
        const activoNeto = parseFloat(formState['M-40'] || expectedValues['M-40']) || 0;

        html += `
            <div class="sheet-card-glass bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl p-5 md:p-6 space-y-3 mb-6">
                <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-table-list text-amber-500 text-sm"></i>
                        <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                            Tabla Oficial de Tramos por Millar — Giro: <span class="text-amber-600 dark:text-amber-400 font-black">${currentSector}</span>
                        </h4>
                    </div>
                    <span class="text-[10px] font-semibold text-slate-400 hidden sm:inline">Ley de Impuestos Municipales del Distrito</span>
                </div>
                <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase">
                            <tr>
                                <th class="py-2.5 px-3">Desde ($)</th>
                                <th class="py-2.5 px-3">Hasta ($)</th>
                                <th class="py-2.5 px-3">Exceso de ($)</th>
                                <th class="py-2.5 px-3 text-right">Cuota Fija ($)</th>
                                <th class="py-2.5 px-3 text-right">Por Millar ($)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                            ${tramos.map(t => {
                                const desde = parseFloat(t.desde) || 0;
                                const hasta = t.hasta !== null && t.hasta !== undefined ? parseFloat(t.hasta) : Infinity;
                                const isCurrent = activoNeto >= desde && activoNeto <= hasta;
                                return `
                                    <tr class="${isCurrent ? 'bg-amber-500/20 text-amber-950 dark:text-amber-200 font-black' : 'text-slate-700 dark:text-slate-300'}">
                                        <td class="py-2 px-3">${fmtUI(t.desde)}</td>
                                        <td class="py-2 px-3">${t.hasta !== null && t.hasta !== undefined ? fmtUI(t.hasta) : 'En adelante'}</td>
                                        <td class="py-2 px-3">${fmtUI(t.exceso_de)}</td>
                                        <td class="py-2 px-3 text-right font-bold">${fmtUI(t.cuota_fija)}</td>
                                        <td class="py-2 px-3 text-right font-bold">${fmtUI(t.por_millar)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <p class="text-[10px] text-slate-400 font-medium">
                    Fórmula legal: Cuota = Cuota Fija + [ (Activo Neto Imponible - Exceso de) / 1000 * Por Millar ]. A la cuota mensual se le adiciona el 5% de Fiestas Patronales.
                </p>
            </div>
        `;
    }

    container.innerHTML = html;

    setTimeout(() => {
        if (typeof window.refreshEduContaGlassSelects === 'function') {
            window.refreshEduContaGlassSelects(container);
        }
    }, 40);
}

// ── 5. ENTRADA DE DATOS Y NOTAS EN FORMULARIOS DINÁMICOS ──
window.onDynamicCasillaInput = function (codigoUnico, casillaCodigo, value) {
    if (!tributarioData.declaracionesDinamicas) {
        tributarioData.declaracionesDinamicas = {};
    }
    if (!tributarioData.declaracionesDinamicas[codigoUnico]) {
        tributarioData.declaracionesDinamicas[codigoUnico] = {};
    }

    tributarioData.declaracionesDinamicas[codigoUnico][casillaCodigo] = value;

    const reglaObj = (window.CATALOGO_FORMULARIOS_TRIBUTARIOS || []).find(f => f.codigo_unico === codigoUnico);
    if (!reglaObj) return;

    if (tributarioMode === 'asistido') {
        const expected = computeExpectedValues(reglaObj, tributarioData.declaracionesDinamicas[codigoUnico]);
        Object.assign(tributarioData.declaracionesDinamicas[codigoUnico], expected);

        if (reglaObj.esquema_casillas?.secciones) {
            reglaObj.esquema_casillas.secciones.forEach(sec => {
                (sec.casillas || []).forEach(c => {
                    if (c.tipo === 'calculado' || c.tipo === 'subtotal' || c.tipo === 'total_final') {
                        const span = document.getElementById(`dyn-${codigoUnico}-${c.codigo}`);
                        if (span) {
                            span.textContent = `$ ${fmtUI(expected[c.codigo] || 0)}`;
                        }
                    }
                });
            });
        }
    }

    // Si cambió el sector en formulario municipal, re-renderizar para actualizar tramos
    if (casillaCodigo === 'M-01') {
        renderDynamicForm(reglaObj, 'municipal-dynamic-form-container');
    }

    saveTributarioState();
};

window.onDynamicNotesInput = function (codigoUnico, text) {
    if (!tributarioData.declaracionesDinamicas) {
        tributarioData.declaracionesDinamicas = {};
    }
    if (!tributarioData.declaracionesDinamicas[codigoUnico]) {
        tributarioData.declaracionesDinamicas[codigoUnico] = {};
    }
    tributarioData.declaracionesDinamicas[codigoUnico].notas = text;
    saveTributarioState();
};

// ── 6. AUDITORÍA MINED PARA FORMULARIOS DINÁMICOS (ESCALA 1 A 5) ──
function auditDynamicFormPractice(isMunicipales) {
    const codigoUnico = isMunicipales
        ? tributarioData.filtroMunicipal?.codigo_unico
        : tributarioData.dgiiFormUnicoActivo;

    const reglaObj = (window.CATALOGO_FORMULARIOS_TRIBUTARIOS || []).find(f => f.codigo_unico === codigoUnico);
    if (!reglaObj) {
        alert("Selecciona un formulario antes de auditar.");
        return;
    }

    const panel = document.getElementById('panel-audit-tributario');
    if (!panel) return;

    const formState = (tributarioData.declaracionesDinamicas && tributarioData.declaracionesDinamicas[codigoUnico]) || {};
    const expected = computeExpectedValues(reglaObj, formState);

    const criterios = reglaObj.reglas_auditoria_mined || [];
    if (criterios.length === 0) {
        panel.classList.remove('hidden');
        panel.className = "mb-6 p-6 rounded-3xl border transition-all duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-sky-200 dark:border-sky-800 shadow-xl";
        panel.innerHTML = `
            <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
                <div class="flex items-center gap-2">
                    <span class="px-3 py-1 rounded-2xl text-xs font-black uppercase tracking-wider bg-sky-500 text-white">
                        Formulario Informativo / Trámite Registral
                    </span>
                    <span class="text-xs font-bold text-slate-500">${reglaObj.codigo_formulario} — ${reglaObj.nombre_oficial}</span>
                </div>
                <button type="button" onclick="this.closest('#panel-audit-tributario').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 text-sm">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Este formulario no requiere liquidación numérica de cuotas de impuestos. Las anotaciones del trámite han sido registradas correctamente en tu proyecto.
            </p>
        `;
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    let correctCount = 0;
    const totalChecks = criterios.length;
    const errors = [];

    criterios.forEach(crit => {
        let critOk = true;
        (crit.casillas || []).forEach(cod => {
            const userVal = formState[cod];
            const expVal = expected[cod];

            if (typeof expVal === 'number') {
                const numUser = parseFloat(userVal);
                if (isNaN(numUser) || Math.abs(numUser - expVal) > 0.05) {
                    critOk = false;
                }
            } else if (typeof expVal === 'string') {
                if (String(userVal || '').toUpperCase() !== String(expVal || '').toUpperCase()) {
                    critOk = false;
                }
            }
        });

        if (critOk) {
            correctCount++;
        } else {
            errors.push(`${crit.criterio}. Verifica la(s) casilla(s): [${(crit.casillas || []).join(', ')}].`);
        }
    });

    const ratio = totalChecks > 0 ? (correctCount / totalChecks) : 1;
    let nivel = 1, titulo = "", desc = "", badgeClass = "";

    if (ratio === 1) {
        nivel = 5;
        titulo = `Nivel 5: Excelente (Dominio Pleno en ${reglaObj.codigo_formulario})`;
        desc = `Declaración formalizada con absoluta exactitud conforme a las tablas y normativa tributaria vigente de El Salvador.`;
        badgeClass = "bg-emerald-500 text-white";
    } else if (ratio >= 0.8) {
        nivel = 4;
        titulo = `Nivel 4: Muy Bueno (Competente con Mínimos Ajustes en ${reglaObj.codigo_formulario})`;
        desc = `Comprensión sólida del formulario y bases de cálculo. Se detectaron variaciones menores de redondeo o deducciones.`;
        badgeClass = "bg-sky-500 text-white";
    } else if (ratio >= 0.6) {
        nivel = 3;
        titulo = `Nivel 3: Bueno (Aprobado Básico en ${reglaObj.codigo_formulario})`;
        desc = `Cálculo aceptable, pero requiere afinar la aplicación de deducciones legales, tramos o factores por millar.`;
        badgeClass = "bg-amber-500 text-white";
    } else if (ratio >= 0.4) {
        nivel = 2;
        titulo = `Nivel 2: En Proceso (Requiere Refuerzo en ${reglaObj.codigo_formulario})`;
        desc = `Discrepancias importantes en la determinación de las cuotas o bases imponibles del formulario.`;
        badgeClass = "bg-orange-500 text-white";
    } else {
        nivel = 1;
        titulo = `Nivel 1: Inicial (No Alcanzado en ${reglaObj.codigo_formulario})`;
        desc = `Declaración incompleta o con diferencias sustanciales en los cálculos tributarios evaluados.`;
        badgeClass = "bg-rose-500 text-white";
    }

    panel.classList.remove('hidden');
    panel.className = "mb-6 p-6 rounded-3xl border transition-all duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-xl";
    panel.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
            <div class="flex items-center gap-3">
                <span class="px-3.5 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider ${badgeClass}">
                    ${titulo}
                </span>
                <span class="text-xs font-bold text-slate-500 tabular-nums">Puntaje: ${correctCount} / ${totalChecks}</span>
            </div>
            <button type="button" onclick="this.closest('#panel-audit-tributario').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 text-sm">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <p class="text-xs text-slate-700 dark:text-slate-300 font-medium mb-4">${desc}</p>
        ${errors.length > 0 ? `
            <div class="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                <h5 class="text-xs font-black uppercase text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                    <i class="fas fa-exclamation-triangle"></i> Observaciones de Auditoría MINED:
                </h5>
                <ul class="text-xs text-amber-800 dark:text-amber-300 space-y-1.5 list-disc list-inside">
                    ${errors.map(e => `<li>${e}</li>`).join('')}
                </ul>
            </div>
        ` : `
            <div class="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                <i class="fas fa-check-circle text-base"></i> Declaración tributaria cuadrada con absoluta exactitud legal y lista para reporte fiscal.
            </div>
        `}
    `;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── 7. PUENTE AL LIBRO DIARIO PARA FORMULARIOS DINÁMICOS ──
window.generateDynamicJournalEntry = function () {
    const isMun = currentSubTab === 'municipales';
    const codigoUnico = isMun
        ? tributarioData.filtroMunicipal?.codigo_unico
        : tributarioData.dgiiFormUnicoActivo;

    const reglaObj = (window.CATALOGO_FORMULARIOS_TRIBUTARIOS || []).find(f => f.codigo_unico === codigoUnico);
    if (!reglaObj) {
        alert("Selecciona un formulario antes de generar el asiento contable.");
        return;
    }

    const pd = reglaObj.esquema_casillas?.partida_diario;
    if (!pd || !pd.cuentas || pd.cuentas.length === 0) {
        alert(`El formulario oficial ${reglaObj.codigo_formulario} (${reglaObj.nombre_oficial}) es un formulario de control o informe que no genera liquidación patrimonial directa en el Libro Diario.`);
        return;
    }

    const formState = (tributarioData.declaracionesDinamicas && tributarioData.declaracionesDinamicas[codigoUnico]) || {};
    const expected = computeExpectedValues(reglaObj, formState);

    const rows = [];
    let hasNonZero = false;

    pd.cuentas.forEach(c => {
        const rawVal = formState[c.origen_casilla] !== undefined ? formState[c.origen_casilla] : expected[c.origen_casilla];
        const val = parseFloat(rawVal) || 0;
        if (val > 0) hasNonZero = true;

        if (String(c.movimiento).toUpperCase() === 'DEBE') {
            rows.push({
                cod: c.codigo,
                nom: c.nombre,
                debe: val.toFixed(2),
                haber: ""
            });
        } else {
            rows.push({
                cod: c.codigo,
                nom: c.nombre,
                debe: "",
                haber: val.toFixed(2)
            });
        }
    });

    if (!hasNonZero) {
        alert(`Consigna montos en las casillas del formulario ${reglaObj.codigo_formulario} para generar el asiento contable correspondiente.`);
        return;
    }

    if (window.EduContaBridgeToDiario) {
        const origenNombre = isMun
            ? `Tributario Municipal (${reglaObj.codigo_formulario})`
            : `Módulo Tributario (${reglaObj.codigo_formulario})`;
        const colorTema = isMun ? 'amber' : (reglaObj.color_tema || 'indigo');
        const iconoTema = isMun ? 'fa-city' : 'fa-landmark';
        const territorialInfo = isMun
            ? ` • ${reglaObj.departamento_nombre}, ${reglaObj.municipio_nombre}, ${reglaObj.distrito_nombre}`
            : '';

        window.EduContaBridgeToDiario.open({
            origen: origenNombre,
            color: colorTema,
            icono: iconoTema,
            titulo: pd.titulo || `Liquidación ${reglaObj.codigo_formulario}`,
            subtitulo: (pd.subtitulo || reglaObj.base_legal || 'Cierre Fiscal') + territorialInfo,
            fecha: new Date().toISOString().split('T')[0],
            glosa: `V/ Registro y provisión contable de ${reglaObj.nombre_oficial} correspondiente a ${activeProject?.name || 'la empresa'}${isMun ? ` en ${reglaObj.entidad_recaudadora} (${reglaObj.distrito_nombre})` : ' ante el Ministerio de Hacienda'}.`,
            rows: rows
        });
    }
};

// ── 8. EXPORTACIÓN OFICIAL A PDF PARA FORMULARIOS DINÁMICOS ──
function exportarPDF_Dinamico(reglaObj) {
    if (typeof window.jspdf === 'undefined') {
        window.print();
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'letter');
    const isMun = reglaObj.ambito === 'MUNICIPAL';

    // Banner Superior
    const headerColor = isMun ? [217, 119, 6] : [79, 70, 229];
    doc.setFillColor(...headerColor);
    doc.rect(0, 0, 216, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("REPÚBLICA DE EL SALVADOR • " + (reglaObj.entidad_recaudadora || 'MINISTERIO DE HACIENDA').toUpperCase(), 14, 9);

    // Título Principal
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text(`${reglaObj.codigo_formulario} — ${reglaObj.nombre_oficial.toUpperCase()}`, 14, 23);

    // Metadatos
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    let currentY = 29;
    if (isMun) {
        doc.text(`DEPARTAMENTO: ${reglaObj.departamento_nombre || '—'} | MUNICIPIO: ${reglaObj.municipio_nombre || '—'} | DISTRITO: ${reglaObj.distrito_nombre || '—'}`, 14, currentY);
        currentY += 5;
    }
    doc.text(`Contribuyente: ${activeProject?.name || 'Contribuyente Registrado'} • Emisión: ${new Date().toLocaleDateString('es-SV')} • Base Legal: ${reglaObj.base_legal || 'Normativa Vigente'}`, 14, currentY);
    currentY += 6;

    const formState = (tributarioData.declaracionesDinamicas && tributarioData.declaracionesDinamicas[reglaObj.codigo_unico]) || {};
    const expected = computeExpectedValues(reglaObj, formState);

    const pdfRows = [];

    if (reglaObj.esquema_casillas?.secciones && reglaObj.esquema_casillas.secciones.length > 0) {
        reglaObj.esquema_casillas.secciones.forEach(sec => {
            pdfRows.push([`SECCIÓN ${sec.numero || ''}: ${sec.titulo.toUpperCase()}`, "", ""]);
            (sec.casillas || []).forEach(c => {
                const rawVal = formState[c.codigo] !== undefined ? formState[c.codigo] : expected[c.codigo];
                let displayVal = "—";
                if (c.tipo?.startsWith('select_')) {
                    const opt = c.opciones?.find(o => o.valor === rawVal);
                    displayVal = opt ? opt.etiqueta : String(rawVal || '—');
                } else if (typeof rawVal === 'number' || (!isNaN(Number(rawVal)) && rawVal !== '')) {
                    displayVal = `$ ${fmtUI(Number(rawVal) || 0)}`;
                } else if (rawVal) {
                    displayVal = String(rawVal);
                }
                pdfRows.push([`[${c.codigo}]`, c.etiqueta, displayVal]);
            });
        });
    } else {
        pdfRows.push(["DESCRIPCIÓN", reglaObj.descripcion_didactica || 'Formulario Oficial de Trámite', ""]);
        pdfRows.push(["BASE LEGAL", reglaObj.base_legal || 'Código Tributario', ""]);
        pdfRows.push(["VENCIMIENTO", reglaObj.plazo_vencimiento || 'Según requerimiento oficial', ""]);
        if (formState.notas) {
            pdfRows.push(["OBSERVACIONES", formState.notas, ""]);
        }
    }

    if (doc.autoTable) {
        doc.autoTable({
            startY: currentY,
            head: [["Código / Rubro", "Concepto Tributario / Base Legal", "Monto ($) / Detalle"]],
            body: pdfRows,
            theme: 'striped',
            headStyles: { fillColor: headerColor, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 32 },
                1: { cellWidth: 120 },
                2: { halign: 'right', fontStyle: 'bold' }
            },
            didParseCell: function(data) {
                if (data.row.raw[1] === "" && data.row.raw[2] === "") {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = isMun ? [254, 243, 199] : [238, 242, 255];
                    data.cell.styles.textColor = isMun ? [180, 83, 9] : [67, 56, 202];
                }
            }
        });
    }

    const safeName = (reglaObj.distrito_nombre || reglaObj.codigo_formulario || 'DGII').replace(/[^a-zA-Z0-9_\-]/g, '_');
    doc.save(`${reglaObj.codigo_formulario}_${safeName}.pdf`);
}

// === Auditoría MINED para Declaraciones Tributarias (F-07, F-14, Libros) ===
window.auditTributarioPractice = function () {
    const isF14 = currentSubTab === 'f14';
    const isLibros = currentSubTab === 'libros';
    const isDgiiOtros = currentSubTab === 'dgii-otros';
    const isMunicipales = currentSubTab === 'municipales';

    if (isDgiiOtros || isMunicipales) {
        auditDynamicFormPractice(isMunicipales);
        return;
    }

    let correctCount = 0;
    const totalChecks = 5;
    const errors = [];
    let tituloFormulario = isF14 ? "Formulario F-14" : (isLibros ? "Libros Legales de IVA" : "Formulario F-07");

    if (isF14) {
        // --- AUDITORÍA FORMULARIO F-14 ---
        const ingMes = parseFloat(document.getElementById('f14-ingresos-mes')?.value) || 0;
        const tasaSelect = document.getElementById('f14-pago-cuenta-tasa-select');
        const tasaPC = tasaSelect ? (parseFloat(tasaSelect.value) || 0.0175) : 0.0175;
        const acred = parseFloat(document.getElementById('f14-acreditaciones-previas')?.value) || 0;
        const pcSubtotalUser = tributarioData.pagoCuentaSubtotal || 0;

        // 1. Verificación Pago a Cuenta Propio (Art. 151 CT)
        const expectedPCDet = Math.round(ingMes * tasaPC * 100) / 100;
        const expectedPCSub = Math.max(0, Math.round((expectedPCDet - acred) * 100) / 100);
        if (ingMes > 0 && Math.abs(pcSubtotalUser - expectedPCSub) < 0.10) {
            correctCount++;
        } else if (ingMes === 0) {
            errors.push("Sección A (Pago a Cuenta): Ingresa los ingresos brutos del mes para determinar el anticipo de ISR (Art. 151 C.T.).");
        } else {
            errors.push(`Sección A (Pago a Cuenta): El anticipo determinado sobre $${fmtUI(ingMes)} con tasa ${(tasaPC * 100).toFixed(2)}% debe ser $${fmtUI(expectedPCSub)}.`);
        }

        // 2. Verificación Retención Renta Salarios (Art. 155 CT)
        const baseSal = parseFloat(document.getElementById('f14-base-salarios')?.value) || 0;
        const retSal = parseFloat(document.getElementById('f14-retencion-salarios')?.value) || 0;
        if (baseSal > 0 && retSal > 0 && retSal < baseSal) {
            correctCount++;
        } else if (baseSal > 0 && retSal === 0) {
            errors.push("Sección B (Retención Sueldos): Consigna la retención de ISR aplicada a planilla según las tablas del Ministerio de Hacienda (Dcto. 10). Puedes usar el botón 'Sincronizar desde Planilla'.");
        } else {
            errors.push("Sección B (Retención Sueldos): Ingresa la masa salarial gravable del período en la casilla de salarios (Art. 155 C.T.).");
        }

        // 3. Verificación Retención 10% Profesionales / Arrendamientos (Art. 156 y 156-A CT)
        const baseProf = parseFloat(document.getElementById('f14-base-profesionales')?.value) || 0;
        const baseArr = parseFloat(document.getElementById('f14-base-arrendamientos')?.value) || 0;
        const expectedRetProf = Math.round(baseProf * 0.10 * 100) / 100;
        const expectedRetArr = Math.round(baseArr * 0.10 * 100) / 100;
        const actRetProf = tributarioData.rentaHonorariosRetenida || 0;
        const actRetArr = tributarioData.rentaArrendamientosRetenida || 0;
        if (Math.abs(actRetProf - expectedRetProf) < 0.05 && Math.abs(actRetArr - expectedRetArr) < 0.05 && (baseProf > 0 || baseArr > 0)) {
            correctCount++;
        } else if (baseProf === 0 && baseArr === 0) {
            correctCount++;
        } else {
            errors.push("Sección B (Servicios y Arrendamientos): Verifica la alícuota legal del 10% retenida sobre servicios profesionales o arrendamientos.");
        }

        // 4. Verificación Retenciones de IVA a Terceros (Art. 161 y 162 CT)
        const baseIva1 = parseFloat(document.getElementById('f14-base-iva1')?.value) || 0;
        const expectedIva1 = Math.round(baseIva1 * 0.01 * 100) / 100;
        const actIva1 = tributarioData.ivaRetenido1Monto || 0;
        if (Math.abs(actIva1 - expectedIva1) < 0.05) {
            correctCount++;
        } else {
            errors.push("Sección C (Retención IVA 1%): Debe aplicarse exactamente el 1% sobre compras iguales o superiores a $100.00 realizadas a contribuyentes (Art. 162 C.T.).");
        }

        // 5. Verificación Total Consolidado F-14 a Enterar
        const expectedTotalF14 = Math.round((expectedPCSub + tributarioData.totalRetencionesRenta + tributarioData.totalRetencionesIVA) * 100) / 100;
        const actTotalF14 = tributarioData.totalEnterarF14 || 0;
        if (Math.abs(actTotalF14 - expectedTotalF14) < 0.10 && actTotalF14 > 0) {
            correctCount++;
        } else {
            errors.push("Sección D (Total F-14): El total consolidado a enterar no coincide con la suma del anticipo propio de ISR y las retenciones a terceros.");
        }
    } else if (isLibros) {
        // --- AUDITORÍA LIBROS DE IVA ---
        let comprasOk = libroCompras.length > 0;
        let ventasOk = libroVentas.length > 0;
        let alicuotasComprasOk = true;
        let alicuotasVentasOk = true;

        libroCompras.forEach(c => {
            const expIva = Math.round(c.gravada * 0.13 * 100) / 100;
            if (Math.abs(c.iva - expIva) > 0.05) alicuotasComprasOk = false;
        });
        libroVentas.forEach(v => {
            const expIva = Math.round(v.gravada * 0.13 * 100) / 100;
            if (Math.abs(v.iva - expIva) > 0.05) alicuotasVentasOk = false;
        });

        if (comprasOk) correctCount++; else errors.push("Libro de Compras: No contiene comprobantes registrados.");
        if (ventasOk) correctCount++; else errors.push("Libro de Ventas: No contiene comprobantes registrados.");
        if (alicuotasComprasOk) correctCount++; else errors.push("Libro de Compras: Existen comprobantes con alícuota de IVA diferente al 13%.");
        if (alicuotasVentasOk) correctCount++; else errors.push("Libro de Ventas: Existen comprobantes con alícuota de IVA diferente al 13%.");
        if (comprasOk && ventasOk && alicuotasComprasOk && alicuotasVentasOk) correctCount++;
    } else {
        // --- AUDITORÍA FORMULARIO F-07 (IVA MENSUAL PURO) ---
        const cas10 = parseFloat(document.getElementById('f07-cas-10')?.value) || 0;
        const cas20 = parseFloat(document.getElementById('f07-cas-20')?.value) || 0;
        const cas50 = parseFloat(document.getElementById('f07-cas-50')?.value) || 0;
        const cas60 = parseFloat(document.getElementById('f07-cas-60')?.value) || 0;
        const cas162 = parseFloat(document.getElementById('f07-cas-162')?.value) || 0;

        // 1. Verificación Débito Fiscal (Casilla 10/15 y Casilla 20/25)
        const calcDeb15 = Math.round(cas10 * 0.13 * 100) / 100;
        if ((cas10 > 0 || cas20 > 0) && Math.abs(tributarioData.debitoFiscal - calcDeb15) < 0.05) {
            correctCount++;
        } else if (cas10 === 0 && cas20 === 0) {
            errors.push("Ventas Gravadas (Casilla 10 y 20): Consigna las operaciones gravadas del mes para liquidar el Débito Fiscal.");
        } else {
            errors.push("Débito Fiscal (Casilla 15/25): Verifica la aplicación de la tasa del 13% sobre las operaciones de ventas locales.");
        }

        // 2. Verificación Crédito Fiscal (Casilla 50/55 y Casilla 60/65)
        const calcCred55 = Math.round(cas50 * 0.13 * 100) / 100;
        if ((cas50 > 0 || cas60 > 0) && Math.abs(tributarioData.creditoFiscal - calcCred55) < 0.05) {
            correctCount++;
        } else if (cas50 === 0 && cas60 === 0) {
            errors.push("Compras Gravadas (Casilla 50 y 60): Consigna adquisiciones gravadas locales o importaciones.");
        } else {
            errors.push("Crédito Fiscal (Casilla 55/65): Verifica la aplicación de la alícuota del 13% sobre compras e internaciones.");
        }

        // 3. Verificación de Totales y Liquidación Mensual (Art. 65 Ley de IVA)
        const expTotDeb = Math.round((tributarioData.debitoFiscal + tributarioData.debitoConsumidorFinal) * 100) / 100;
        const expTotCred = Math.round((tributarioData.creditoFiscal + tributarioData.creditoImportaciones + tributarioData.creditoServicios + tributarioData.remanenteAnterior) * 100) / 100;
        const expectedDiff = expTotDeb - expTotCred;
        const isLiqOk = expectedDiff >= 0 
            ? Math.abs(tributarioData.impuestoDeterminado - expectedDiff) < 0.05 
            : Math.abs(tributarioData.remanenteMes - Math.abs(expectedDiff)) < 0.05;

        if (isLiqOk && (cas10 > 0 || cas50 > 0)) {
            correctCount++;
        } else {
            errors.push("Liquidación de IVA (Casilla 90/95): La confrontación entre Débito Fiscal (Casilla 45) y Crédito Fiscal (Casilla 80) no concuerda con el Art. 65 de la Ley de IVA.");
        }

        // 4. Retenciones Sufridas 1% Art. 162 CT (Casilla 162)
        if (cas162 >= 0) {
            correctCount++;
        } else {
            errors.push("Retenciones Sufridas (Casilla 162): El valor deducible de retenciones sufridas no puede ser negativo.");
        }

        // 5. Impuesto Neto a Pagar F-07 (Casilla 170) o Remanente Siguiente
        const expectedNetoPagar = Math.max(0, Math.round((tributarioData.impuestoDeterminado - cas162) * 100) / 100);
        if (Math.abs(tributarioData.totalPagarF07 - expectedNetoPagar) < 0.05) {
            correctCount++;
        } else {
            errors.push("Total Impuesto Neto a Pagar (Casilla 170): Revisa la deducción de retenciones del 1% del impuesto determinado.");
        }
    }

    // Niveles MINED 1 a 5
    let nivel = 1, titulo = "", desc = "", badgeClass = "";
    if (correctCount === 5) {
        nivel = 5;
        titulo = `Nivel 5: Excelente (Dominio Tributario Pleno en ${tituloFormulario})`;
        desc = `Declaración formalizada con absoluta exactitud conforme a la legislación fiscal vigente de El Salvador.`;
        badgeClass = "bg-emerald-500 text-white";
    } else if (correctCount === 4) {
        nivel = 4;
        titulo = `Nivel 4: Muy Bueno (Competente con Mínimos Ajustes en ${tituloFormulario})`;
        desc = `Comprensión sólida de las casillas y normativa fiscal. Se detectaron variaciones menores en redondeo o bases imponibles.`;
        badgeClass = "bg-sky-500 text-white";
    } else if (correctCount === 3) {
        nivel = 3;
        titulo = `Nivel 3: Bueno (Aprobado Básico en ${tituloFormulario})`;
        desc = `Cálculo de alícuotas adecuado, pero requiere afinar la conciliación de bases o retenciones aplicables.`;
        badgeClass = "bg-amber-500 text-white";
    } else if (correctCount === 2) {
        nivel = 2;
        titulo = `Nivel 2: En Proceso (Requiere Refuerzo en ${tituloFormulario})`;
        desc = `Discrepancias importantes entre las operaciones registradas y las liquidaciones fiscales.`;
        badgeClass = "bg-orange-500 text-white";
    } else {
        nivel = 1;
        titulo = `Nivel 1: Inicial (No Alcanzado en ${tituloFormulario})`;
        desc = `Declaración incompleta o con errores conceptuales en las alícuotas y retenciones legales.`;
        badgeClass = "bg-rose-500 text-white";
    }

    const panel = document.getElementById('panel-audit-tributario');
    if (panel) {
        panel.classList.remove('hidden');
        panel.className = "mb-6 p-6 rounded-3xl border transition-all duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-xl";
        panel.innerHTML = `
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                <div class="flex items-center gap-3">
                    <span class="px-3.5 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider ${badgeClass}">
                        ${titulo}
                    </span>
                    <span class="text-xs font-bold text-slate-500 tabular-nums">Puntaje: ${correctCount} / ${totalChecks}</span>
                </div>
                <button type="button" onclick="this.closest('#panel-audit-tributario').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 text-sm">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="text-xs text-slate-700 dark:text-slate-300 font-medium mb-4">${desc}</p>
            ${errors.length > 0 ? `
                <div class="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                    <h5 class="text-xs font-black uppercase text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                        <i class="fas fa-exclamation-triangle"></i> Observaciones Fiscales:
                    </h5>
                    <ul class="text-xs text-amber-800 dark:text-amber-300 space-y-1.5 list-disc list-inside">
                        ${errors.map(e => `<li>${e}</li>`).join('')}
                    </ul>
                </div>
            ` : `
                <div class="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                    <i class="fas fa-check-circle text-base"></i> Declaración tributaria cuadrada con base legal íntegra y lista para reporte fiscal.
                </div>
            `}
        `;
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// === PUENTE HACIA LIBRO DIARIO: LIQUIDACIÓN DE IVA (F-07) ===
window.generateLiquidacionIvaJournalEntry = function () {
    const d = tributarioData;
    if (d.totalDebito <= 0 && d.totalCredito <= 0) {
        alert("Consigna montos de compras y ventas gravadas para generar el asiento de liquidación de IVA.");
        return;
    }

    const rows = [];
    // 1. Cargar IVA Débito Fiscal para cancelarlo (Debe)
    rows.push({
        cod: "2107",
        nom: "IVA Débito Fiscal (Liquidación Mensual de IVA)",
        debe: d.totalDebito.toFixed(2),
        haber: ""
    });

    // 2. Abonar IVA Crédito Fiscal para cancelarlo (Haber)
    rows.push({
        cod: "1108",
        nom: "IVA Crédito Fiscal (Liquidación Mensual de IVA)",
        debe: "",
        haber: d.totalCredito.toFixed(2)
    });

    // 3. Abonar Retenciones 1% Sufridas si aplican (Haber)
    if (d.retencion162Sufrida > 0) {
        rows.push({
            cod: "110803",
            nom: "Retención 1% IVA Sufrida (Aplicación contra Débito Fiscal Art. 162 C.T.)",
            debe: "",
            haber: d.retencion162Sufrida.toFixed(2)
        });
    }

    // 4. Saldo Resultante: IVA por Pagar (Pasivo, Haber) o Remanente de Crédito Fiscal (Activo, Debe)
    if (d.totalPagarF07 > 0) {
        rows.push({
            cod: "210703",
            nom: "IVA por Pagar (Dirección General de Impuestos Internos)",
            debe: "",
            haber: d.totalPagarF07.toFixed(2)
        });
    } else if (d.remanenteSiguiente > 0) {
        rows.push({
            cod: "110802",
            nom: "Remanente de Crédito Fiscal (Traslado al Próximo Período)",
            debe: d.remanenteSiguiente.toFixed(2),
            haber: ""
        });
    }

    if (window.EduContaBridgeToDiario) {
        window.EduContaBridgeToDiario.open({
            origen: 'Módulo Tributario (F-07)',
            color: 'indigo',
            icono: 'fa-file-invoice-dollar',
            titulo: 'Liquidación Mensual de Cuentas de IVA',
            subtitulo: `Cierre Fiscal Mensual • Art. 65 Ley de IVA`,
            fecha: new Date().toISOString().split('T')[0],
            glosa: `V/ Liquidación mensual de cuentas de IVA Débito Fiscal y Crédito Fiscal según Art. 65 de la Ley de IVA. Determinación de ${d.totalPagarF07 > 0 ? 'impuesto neto a pagar' : 'remanente de crédito fiscal para el periodo siguiente'}.`,
            rows: rows
        });
    }
};

// === PUENTE HACIA LIBRO DIARIO: ENTERO DE PAGO A CUENTA Y RETENCIONES (F-14) ===
window.generateF14JournalEntry = function () {
    const d = tributarioData;
    if (d.totalEnterarF14 <= 0) {
        alert("Consigna montos en el Formulario F-14 para generar el asiento de pago a cuenta y retenciones.");
        return;
    }

    const rows = [];

    // 1. Cargar Anticipo Pago a Cuenta Propio (Activo Exigible - Debe)
    if (d.pagoCuentaSubtotal > 0) {
        rows.push({
            cod: "110901",
            nom: "Anticipo Impuesto Sobre la Renta (Pago a Cuenta Art. 151 C.T.)",
            debe: d.pagoCuentaSubtotal.toFixed(2),
            haber: ""
        });
    }

    // 2. Cargar Pasivos de Retenciones de Renta a Terceros (Cancelación de Pasivos - Debe)
    if (d.rentaSalariosRetenida > 0) {
        rows.push({
            cod: "210801",
            nom: "Retenciones Renta por Pagar - Sueldos y Salarios (Art. 155 C.T.)",
            debe: d.rentaSalariosRetenida.toFixed(2),
            haber: ""
        });
    }
    if (d.rentaHonorariosRetenida > 0) {
        rows.push({
            cod: "210802",
            nom: "Retenciones Renta por Pagar - Servicios Profesionales 10% (Art. 156 C.T.)",
            debe: d.rentaHonorariosRetenida.toFixed(2),
            haber: ""
        });
    }
    if (d.rentaArrendamientosRetenida > 0) {
        rows.push({
            cod: "210803",
            nom: "Retenciones Renta por Pagar - Arrendamientos 10% (Art. 156-A C.T.)",
            debe: d.rentaArrendamientosRetenida.toFixed(2),
            haber: ""
        });
    }
    if (d.rentaDividendosRetenida > 0) {
        rows.push({
            cod: "210805",
            nom: "Retenciones Renta por Pagar - Dividendos 5% (Art. 72-A LISR)",
            debe: d.rentaDividendosRetenida.toFixed(2),
            haber: ""
        });
    }

    // 3. Cargar Pasivos de Retenciones de IVA a Terceros (Cancelación de Pasivos - Debe)
    if (d.ivaRetenido1Monto > 0) {
        rows.push({
            cod: "210804",
            nom: "Retención IVA 1% por Pagar - Grandes Contribuyentes (Art. 162 C.T.)",
            debe: d.ivaRetenido1Monto.toFixed(2),
            haber: ""
        });
    }
    if (d.ivaRetenido13Monto > 0) {
        rows.push({
            cod: "210806",
            nom: "Retención IVA 13% por Pagar - No Domiciliados (Art. 161 C.T.)",
            debe: d.ivaRetenido13Monto.toFixed(2),
            haber: ""
        });
    }

    // 4. Abonar Bancos por el Pago Total Consolidado (Haber)
    rows.push({
        cod: "110102",
        nom: "Bancos del Sistema Financiero (Entero Mensual Formulario F-14)",
        debe: "",
        haber: d.totalEnterarF14.toFixed(2)
    });

    if (window.EduContaBridgeToDiario) {
        window.EduContaBridgeToDiario.open({
            origen: 'Módulo Tributario (F-14)',
            color: 'purple',
            icono: 'fa-hand-holding-usd',
            titulo: 'Entero Mensual de Retenciones y Pago a Cuenta',
            subtitulo: 'Declaración F-14 • Art. 151, 155, 156, 162 Código Tributario',
            fecha: new Date().toISOString().split('T')[0],
            glosa: `V/ Entero mensual de Formulario F-14: Pago a Cuenta propio de ISR ($${fmtUI(d.pagoCuentaSubtotal)}), retenciones de Renta ($${fmtUI(d.totalRetencionesRenta)}) y retenciones de IVA ($${fmtUI(d.totalRetencionesIVA)}) pagadas mediante transferencia bancaria.`,
            rows: rows
        });
    }
};

// Dispatcher contextual para botón de Partida de Diario en cabecera
window.handlePartidaDiarioClick = function () {
    if (currentSubTab === 'f14') {
        generateF14JournalEntry();
    } else if (currentSubTab === 'dgii-otros' || currentSubTab === 'municipales') {
        generateDynamicJournalEntry();
    } else {
        generateLiquidacionIvaJournalEntry();
    }
};

// === EXPORTACIONES ===
window.exportarExcelTributario = function () {
    let csv = "\uFEFFLIBRO DE COMPRAS - EDUCONTA SV\n";
    csv += "Fecha,Documento,Proveedor,NRC,Gravada,IVA 13%,Total\n";
    libroCompras.forEach(r => {
        csv += `"${r.fecha}","${r.doc}","${r.proveedor}","${r.nrc}","${r.gravada}","${r.iva}","${r.total}"\n`;
    });
    csv += "\nLIBRO DE VENTAS A CONTRIBUYENTES\n";
    csv += "Fecha,Documento,Cliente,NRC,Gravada,IVA 13%,Total\n";
    libroVentas.forEach(r => {
        csv += `"${r.fecha}","${r.doc}","${r.cliente}","${r.nrc}","${r.gravada}","${r.iva}","${r.total}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Libros_IVA_${activeProject?.name || 'Declaracion'}.csv`;
    link.click();
};

function exportarPDF_F07() {
    if (typeof window.jspdf === 'undefined') {
        window.print();
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'letter');
    const d = tributarioData;

    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 216, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("REPÚBLICA DE EL SALVADOR • MINISTERIO DE HACIENDA • DGII", 14, 9);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(13);
    doc.text("FORMULARIO F-07 — DECLARACIÓN MENSUAL DE IVA", 14, 24);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Empresa / Razón Social: ${activeProject?.name || 'Contribuyente Registrado'}`, 14, 30);
    doc.text(`Período Fiscal: Mensual • Tasa Vigente: 13% • Fecha de Emisión: ${new Date().toLocaleDateString('es-SV')}`, 14, 35);

    const f07Rows = [
        ["I. DÉBITO FISCAL (VENTAS Y PRESTACIÓN DE SERVICIOS)", "", ""],
        ["Casilla 10", "Ventas Gravadas Locales con Comprobante de Crédito Fiscal", `$ ${fmtUI(d.ventasGravadas)}`],
        ["Casilla 15", "Débito Fiscal por Ventas con Crédito Fiscal (13%)", `$ ${fmtUI(d.debitoFiscal)}`],
        ["Casilla 20", "Ventas Gravadas a Consumidores Finales (Facturas / Tiquetes)", `$ ${fmtUI(d.ventasConsumidorFinal)}`],
        ["Casilla 25", "Débito Fiscal por Ventas a Consumidor Final (13%)", `$ ${fmtUI(d.debitoConsumidorFinal)}`],
        ["Casilla 30", "Operaciones a Zonas Francas y DPA (Tasa 0%)", `$ ${fmtUI(d.ventasZonasFrancas)}`],
        ["Casilla 35/40", "Exportaciones fuera de C.A. y dentro de C.A. (Tasa 0%)", `$ ${fmtUI(d.exportaciones)}`],
        ["Casilla 85/86", "Ventas No Sujetas y Ventas Exentas de IVA", `$ ${fmtUI(d.ventasExentas)}`],
        ["Casilla 45", "TOTAL DÉBITO FISCAL DEL PERÍODO", `$ ${fmtUI(d.totalDebito)}`],
        
        ["II. CRÉDITO FISCAL (COMPRAS Y ADQUISICIONES)", "", ""],
        ["Casilla 50", "Compras Gravadas Locales con CCF", `$ ${fmtUI(d.comprasGravadas)}`],
        ["Casilla 55", "Crédito Fiscal por Compras Locales (13%)", `$ ${fmtUI(d.creditoFiscal)}`],
        ["Casilla 60", "Importaciones Gravadas de Bienes y Mercancías", `$ ${fmtUI(d.importaciones)}`],
        ["Casilla 65", "Crédito Fiscal por Importaciones (13%)", `$ ${fmtUI(d.creditoImportaciones)}`],
        ["Casilla 62/67", "Servicios del Exterior Importados (Base / Crédito 13%)", `$ ${fmtUI(d.creditoServicios)}`],
        ["Casilla 66", "Compras a Sujetos Excluidos de IVA (Art. 119 C.T.)", `$ ${fmtUI(d.comprasExcluidos)}`],
        ["Casilla 75", "Remanente de Crédito Fiscal del Período Anterior", `$ ${fmtUI(d.remanenteAnterior)}`],
        ["Casilla 80", "TOTAL CRÉDITO FISCAL DEL PERÍODO", `$ ${fmtUI(d.totalCredito)}`],

        ["III. LIQUIDACIÓN DEL IMPUESTO Y DETERMINACIÓN FINAL", "", ""],
        ["Casilla 90", "Impuesto Determinado del Período (Débito > Crédito)", `$ ${fmtUI(d.impuestoDeterminado)}`],
        ["Casilla 95", "Remanente de Crédito Fiscal a Favor (Crédito > Débito)", `$ ${fmtUI(d.remanenteMes)}`],
        ["Casilla 162", "Menos: Retenciones 1% de IVA Sufridas de Grandes Contribuyentes", `$ ${fmtUI(d.retencion162Sufrida)}`],
        ["Casilla 170", "TOTAL IMPUESTO NETO A PAGAR FORMULARIO F-07", `$ ${fmtUI(d.totalPagarF07)}`],
        ["Remanente Siguiente", "Remanente de Crédito Fiscal para el Período Siguiente", `$ ${fmtUI(d.remanenteSiguiente)}`]
    ];

    if (doc.autoTable) {
        doc.autoTable({
            startY: 40,
            head: [["Casilla", "Concepto Tributario / Base Legal", "Monto ($)"]],
            body: f07Rows,
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241], fontStyle: 'bold' },
            styles: { fontSize: 8.5, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 32 },
                1: { cellWidth: 120 },
                2: { halign: 'right', fontStyle: 'bold' }
            },
            didParseCell: function(data) {
                if (data.row.raw[1] === "" && data.row.raw[2] === "") {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [238, 242, 255];
                    data.cell.styles.textColor = [67, 56, 202];
                }
            }
        });
    }

    doc.save(`F07_IVA_${(activeProject?.name || 'Tributario').replace(/\s+/g, '_')}.pdf`);
}

function exportarPDF_F14() {
    if (typeof window.jspdf === 'undefined') {
        window.print();
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'letter');
    const d = tributarioData;

    doc.setFillColor(147, 51, 234);
    doc.rect(0, 0, 216, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("REPÚBLICA DE EL SALVADOR • MINISTERIO DE HACIENDA • DGII", 14, 9);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(13);
    doc.text("FORMULARIO F-14 — PAGO A CUENTA E IMPUESTOS RETENIDOS (RENTA E IVA)", 14, 24);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Empresa / Razón Social: ${activeProject?.name || 'Contribuyente Registrado'}`, 14, 30);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-SV')} • Base Legal: Art. 151, 155, 156, 161, 162 Código Tributario`, 14, 35);

    const f14Rows = [
        ["SECCIÓN A: PAGO A CUENTA PROPIO (IMPUESTO SOBRE LA RENTA)", "", ""],
        ["Base Gravable", "Ingresos Brutos del Mes (Art. 151 C.T.)", `$ ${fmtUI(d.pagoCuentaIngresosMes)}`],
        ["Alícuota", `Tasa de Pago a Cuenta Aplicable: ${(d.pagoCuentaTasa * 100).toFixed(2)}%`, `$ ${fmtUI(d.pagoCuentaDeterminado)}`],
        ["Acreditación", "Menos: Retenciones Acreditables del Período / Saldo a Favor", `$ ${fmtUI(d.pagoCuentaAcreditaciones)}`],
        ["SUBTOTAL PAC", "SUBTOTAL PAGO A CUENTA PROPIO DEL MES", `$ ${fmtUI(d.pagoCuentaSubtotal)}`],

        ["SECCIÓN B: RETENCIONES DEL IMPUESTO SOBRE LA RENTA (A TERCEROS)", "", ""],
        ["Art. 155 C.T.", `Retención Sueldos y Salarios (Base: $${fmtUI(d.rentaSalariosBase)})`, `$ ${fmtUI(d.rentaSalariosRetenida)}`],
        ["Art. 156 C.T.", `Servicios Profesionales y Técnicos 10% (Base: $${fmtUI(d.rentaHonorariosBase)})`, `$ ${fmtUI(d.rentaHonorariosRetenida)}`],
        ["Art. 156-A C.T.", `Arrendamiento de Bienes Muebles e Inmuebles 10% (Base: $${fmtUI(d.rentaArrendamientosBase)})`, `$ ${fmtUI(d.rentaArrendamientosRetenida)}`],
        ["Art. 72-A LISR", `Dividendos o Utilidades Distribuidas 5% (Base: $${fmtUI(d.rentaDividendosBase)})`, `$ ${fmtUI(d.rentaDividendosRetenida)}`],
        ["SUBTOTAL ISR", "SUBTOTAL RETENCIONES IMPUESTO SOBRE LA RENTA", `$ ${fmtUI(d.totalRetencionesRenta)}`],

        ["SECCIÓN C: RETENCIONES DE IVA A TERCEROS (AGENTE DE RETENCIÓN)", "", ""],
        ["Art. 162 C.T.", `Retención IVA 1% a Contribuyentes Compras >= $100 (Base: $${fmtUI(d.ivaRetenido1Base)})`, `$ ${fmtUI(d.ivaRetenido1Monto)}`],
        ["Art. 161 C.T.", `Retención IVA 13% Prestadores de Servicios No Domiciliados (Base: $${fmtUI(d.ivaRetenido13Base)})`, `$ ${fmtUI(d.ivaRetenido13Monto)}`],
        ["SUBTOTAL IVA", "SUBTOTAL RETENCIONES DE IVA A TERCEROS", `$ ${fmtUI(d.totalRetencionesIVA)}`],

        ["SECCIÓN D: TOTAL CONSOLIDADO A ENTERAR", "", ""],
        ["TOTAL F-14", "TOTAL GENERAL A ENTERAR EN DGT / SISTEMA FINANCIERO", `$ ${fmtUI(d.totalEnterarF14)}`]
    ];

    if (doc.autoTable) {
        doc.autoTable({
            startY: 40,
            head: [["Rubro / Casilla", "Concepto Tributario y Base Legal", "Monto ($)"]],
            body: f14Rows,
            theme: 'striped',
            headStyles: { fillColor: [147, 51, 234], fontStyle: 'bold' },
            styles: { fontSize: 8.5, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 35 },
                1: { cellWidth: 118 },
                2: { halign: 'right', fontStyle: 'bold' }
            },
            didParseCell: function(data) {
                if (data.row.raw[1] === "" && data.row.raw[2] === "") {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [250, 245, 255];
                    data.cell.styles.textColor = [126, 34, 206];
                }
            }
        });
    }

    doc.save(`F14_Retenciones_${(activeProject?.name || 'Tributario').replace(/\s+/g, '_')}.pdf`);
}

function exportarPDF_Libros() {
    if (typeof window.jspdf === 'undefined') {
        window.print();
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'letter');

    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 216, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("REPÚBLICA DE EL SALVADOR • LIBROS DEL IMPUESTO A LA TRANSFERENCIA DE BIENES (IVA)", 14, 9);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(13);
    doc.text("LIBROS LEGALES DE IVA: COMPRAS Y VENTAS A CONTRIBUYENTES", 14, 24);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Empresa: ${activeProject?.name || 'Contribuyente'} • Emisión: ${new Date().toLocaleDateString('es-SV')}`, 14, 30);

    const comprasRows = libroCompras.map(r => [r.fecha, r.doc, r.proveedor, r.nrc, `$ ${fmtUI(r.gravada)}`, `$ ${fmtUI(r.iva)}`, `$ ${fmtUI(r.total)}`]);
    let currentY = 36;

    if (doc.autoTable) {
        doc.setFont("helvetica", "bold");
        doc.text("1. LIBRO DE COMPRAS (CRÉDITO FISCAL)", 14, currentY);
        doc.autoTable({
            startY: currentY + 3,
            head: [["Fecha", "Doc", "Proveedor", "NRC", "Gravada", "IVA 13%", "Total"]],
            body: comprasRows.length ? comprasRows : [["—", "—", "Sin registros", "—", "$ 0.00", "$ 0.00", "$ 0.00"]],
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] },
            styles: { fontSize: 7.5 }
        });

        currentY = doc.lastAutoTable.finalY + 10;
        doc.setFont("helvetica", "bold");
        doc.text("2. LIBRO DE VENTAS A CONTRIBUYENTES (DÉBITO FISCAL)", 14, currentY);
        const ventasRows = libroVentas.map(r => [r.fecha, r.doc, r.cliente, r.nrc, `$ ${fmtUI(r.gravada)}`, `$ ${fmtUI(r.iva)}`, `$ ${fmtUI(r.total)}`]);
        doc.autoTable({
            startY: currentY + 3,
            head: [["Fecha", "Doc", "Cliente", "NRC", "Gravada", "IVA 13%", "Total"]],
            body: ventasRows.length ? ventasRows : [["—", "—", "Sin registros", "—", "$ 0.00", "$ 0.00", "$ 0.00"]],
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241] },
            styles: { fontSize: 7.5 }
        });
    }

    doc.save(`Libros_IVA_${(activeProject?.name || 'Tributario').replace(/\s+/g, '_')}.pdf`);
}

// Dispatcher contextual para botón de Exportar PDF en cabecera
window.handleExportarPDFClick = function () {
    if (currentSubTab === 'f14') {
        exportarPDF_F14();
    } else if (currentSubTab === 'libros') {
        exportarPDF_Libros();
    } else if (currentSubTab === 'dgii-otros' || currentSubTab === 'municipales') {
        const isMun = currentSubTab === 'municipales';
        const cod = isMun ? tributarioData.filtroMunicipal?.codigo_unico : tributarioData.dgiiFormUnicoActivo;
        const r = (window.CATALOGO_FORMULARIOS_TRIBUTARIOS || []).find(x => x.codigo_unico === cod);
        if (r) {
            exportarPDF_Dinamico(r);
        } else {
            alert("Selecciona un formulario antes de exportar el PDF.");
        }
    } else {
        exportarPDF_F07();
    }
};

window.exportarPDFTributario = function () {
    window.handleExportarPDFClick();
};

window.exportarProyectoTributario = function () {
    const dataStr = JSON.stringify(activeProject, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(activeProject?.name || 'Tributario').replace(/\s+/g, '_')}.edc`;
    link.click();
};

// =========================================================================
// === CONTROLADOR DE ZOOM DEL EDITOR TRIBUTARIO (1:1 / IN / OUT) ===
// =========================================================================
(function () {
    const STORAGE_KEY = 'educonta_tributario_zoom';
    let currentZoom = 1.0;
    try {
        const saved = parseFloat(localStorage.getItem(STORAGE_KEY));
        if (!isNaN(saved) && saved >= 0.5 && saved <= 2.0) {
            currentZoom = saved;
        }
    } catch (e) {}

    const TributarioZoomManager = {
        get currentZoom() {
            return currentZoom;
        },
        set currentZoom(val) {
            currentZoom = val;
        },

        zoomIn() {
            if (currentZoom < 2.0) {
                currentZoom = Math.min(2.0, Math.round((currentZoom + 0.1) * 10) / 10);
                this.applyZoom();
            }
        },

        zoomOut() {
            if (currentZoom > 0.5) {
                currentZoom = Math.max(0.5, Math.round((currentZoom - 0.1) * 10) / 10);
                this.applyZoom();
            }
        },

        resetZoom() {
            currentZoom = 1.0;
            this.applyZoom();
        },

        setZoom(val) {
            currentZoom = Math.max(0.5, Math.min(2.0, Math.round(val * 10) / 10));
            this.applyZoom();
        },

        applyZoom() {
            const wrapper = document.getElementById('tributario-transform-wrapper');
            const zoomStr = `${Math.round(currentZoom * 100)}%`;
            if (wrapper) {
                wrapper.style.transform = `scale(${currentZoom})`;
                wrapper.style.transformOrigin = 'top center';
                // Compensación de margen inferior para garantizar scroll completo en ampliaciones
                if (currentZoom > 1.0) {
                    const extraHeight = Math.round(wrapper.offsetHeight * (currentZoom - 1.0));
                    wrapper.style.marginBottom = `${extraHeight}px`;
                } else {
                    wrapper.style.marginBottom = '0px';
                }
            }

            // Actualizar indicadores visuales de zoom
            const statusbarText = document.getElementById('zoom-level-statusbar');
            if (statusbarText) statusbarText.textContent = zoomStr;

            const ribbonText = document.getElementById('zoom-level-text');
            if (ribbonText) ribbonText.textContent = zoomStr;

            try {
                localStorage.setItem(STORAGE_KEY, currentZoom.toString());
            } catch (e) {}
        },

        init() {
            this.applyZoom();

            // Atajos de teclado: Ctrl + '+', Ctrl + '-', Ctrl + '0'
            window.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
                        e.preventDefault();
                        this.zoomIn();
                    } else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
                        e.preventDefault();
                        this.zoomOut();
                    } else if (e.key === '0' || e.code === 'Numpad0') {
                        e.preventDefault();
                        this.resetZoom();
                    }
                }
            }, { passive: false });

            // Atajo con rueda del ratón: Ctrl + Rueda
            window.addEventListener('wheel', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                        this.zoomIn();
                    } else if (e.deltaY > 0) {
                        this.zoomOut();
                    }
                }
            }, { passive: false });
        }
    };

    window.TributarioZoomManager = TributarioZoomManager;
    window.PageLayoutManager = TributarioZoomManager; // Compatibilidad directa con arquitectura de editor-textos

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => TributarioZoomManager.init());
    } else {
        TributarioZoomManager.init();
    }
})();

