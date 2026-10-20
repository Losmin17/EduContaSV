// =========================================================================
// EDUCONTA SV — MÓDULO DE CONTABILIDAD DE COSTOS INDUSTRIALES (BTVAC 2.4)
// MPD + MOD + CIF, Estado de Costo de Producción, Órdenes de Trabajo y Prorrateos
// =========================================================================

let activeProject = null;
let currentProjectId = null;
let costosMode = 'practica';
let currentSubTab = 'edo';

let costosData = {
    iiMp: 0.00,
    comprasMp: 0.00,
    ifMp: 0.00,
    mpdUtilizada: 0.00,
    salariosMod: 0.00,
    cargasMod: 0.00,
    totalMod: 0.00,
    cifMat: 0.00,
    cifMoi: 0.00,
    cifEnergia: 0.00,
    cifDeprec: 0.00,
    totalCif: 0.00,
    costoIncurrido: 0.00,
    iiPp: 0.00,
    ifPp: 0.00,
    costoTerminados: 0.00,
    iiPt: 0.00,
    ifPt: 0.00,
    costoVendido: 0.00
};

// Órdenes de Producción
let ordenesTrabajo = [];

// Matriz de Prorrateo Secundario CIF
let prorrateosData = [];

document.addEventListener('DOMContentLoaded', () => {
    try {
        if (typeof injectSharedUI === 'function') {
            injectSharedUI('shared-components-root');
        }
    } catch (e) {
        console.warn("Shared UI injection fallback:", e);
    }

    initCostosProject();
    renderAllCostosViews();
    setCostosMode('practica');

    const updateAllIndicators = (instant = true) => {
        updateCostosTabIndicator(instant);
        updateCostosModeIndicator(instant);
    };

    updateAllIndicators(true);
    window.addEventListener('resize', () => updateAllIndicators(true));
    window.addEventListener('load', () => updateAllIndicators(true));
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => updateAllIndicators(true));
    }

    // Desvanecer preloader suavemente tras inicializar vistas de costos y prorrateos
    if (typeof window.dismissGlobalPreloader === 'function') {
        window.dismissGlobalPreloader();
    }
});

function initCostosProject() {
    currentProjectId = localStorage.getItem('educonta_last_project_id');
    const projects = JSON.parse(localStorage.getItem('educonta_projects_costos')) || [];

    if (currentProjectId) {
        activeProject = projects.find(p => p.id === currentProjectId);
    }

    if (!activeProject) {
        if (projects.length > 0) {
            activeProject = projects[0];
            currentProjectId = activeProject.id;
            localStorage.setItem('educonta_last_project_id', currentProjectId);
        } else {
            activeProject = {
                id: 'proj_' + Date.now(),
                name: 'Costos Industriales — Nuevo Proyecto',
                type: 'costos',
                catalogo: 'MAESTRO',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                data: JSON.parse(JSON.stringify(costosData)),
                ordenes: [],
                prorrateos: []
            };
            projects.push(activeProject);
            localStorage.setItem('educonta_projects_costos', JSON.stringify(projects));
            localStorage.setItem('educonta_last_project_id', activeProject.id);
        }
    }

    if (activeProject) {
        activeProject.type = 'costos';
        localStorage.setItem('educonta_proyectos_active_tab', 'costos');
    }

    if (activeProject.data) costosData = activeProject.data;
    if (activeProject.ordenes) ordenesTrabajo = activeProject.ordenes;
    if (activeProject.prorrateos) prorrateosData = activeProject.prorrateos;

    const nameEl = document.getElementById('current-project-name');
    if (nameEl) nameEl.innerText = activeProject.name;
    const mobileNameEl = document.getElementById('mobile-project-name');
    if (mobileNameEl) mobileNameEl.innerText = activeProject.name;

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

    window.addEventListener('online', () => saveCostosState());
    window.addEventListener('offline', () => updateSyncUI('offline'));

    const cloudInd = document.getElementById('cloud-indicator');
    if (cloudInd) {
        cloudInd.style.cursor = 'pointer';
        cloudInd.title = 'Guardar y sincronizar con la nube';
        cloudInd.addEventListener('click', () => saveCostosState());
    }
}

window.updateSyncUI = function(state, detail = "") {
    const cloudInd = document.getElementById('cloud-indicator');
    const cloudIndMobile = document.getElementById('save-indicator-mobile');
    const inds = [cloudInd, cloudIndMobile].filter(Boolean);

    if (!navigator.onLine && state !== 'offline') {
        state = 'offline';
    }

    inds.forEach(el => {
        const icon = el.querySelector('i');
        const span = el.querySelector('span');

        if (state === 'syncing') {
            el.className = "flex items-center justify-center gap-1 w-full text-sky-500 font-black bg-white dark:bg-slate-800 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-sky-100 dark:border-sky-900/50 transition-all animate-pulse";
            if (icon) icon.className = "fas fa-sync fa-spin text-[7px]";
            if (span) span.innerText = "SINCRONIZANDO";
        } else if (state === 'success' || state === 'online') {
            el.className = "flex items-center justify-center gap-1 w-full text-emerald-600 dark:text-emerald-400 font-black bg-white dark:bg-slate-800 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-slate-100 dark:border-slate-700 transition-all";
            if (icon) icon.className = "fas fa-cloud-check text-[7px]";
            if (span) span.innerText = "SINCRONIZADO";
        } else if (state === 'offline') {
            el.className = "flex items-center justify-center gap-1 w-full text-amber-500 font-black bg-white dark:bg-slate-800 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-amber-100 dark:border-amber-900/50 transition-all";
            if (icon) icon.className = "fas fa-wifi-slash text-[7px]";
            if (span) span.innerText = "OFFLINE";
        } else if (state === 'error') {
            el.className = "flex items-center justify-center gap-1 w-full text-rose-500 font-black bg-white dark:bg-slate-800 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-rose-100 dark:border-rose-900/50 transition-all";
            if (icon) icon.className = "fas fa-exclamation-triangle text-[7px]";
            const shortDetail = detail && detail.length > 15 ? detail.substring(0, 12) + "..." : detail;
            if (span) span.innerText = shortDetail ? shortDetail.toUpperCase() : "ERROR";
        } else {
            el.className = "flex items-center justify-center gap-1 w-full text-slate-400 font-black bg-white dark:bg-slate-800 rounded-[36px] px-2 py-0.5 text-[8px] leading-none border border-slate-100 dark:border-slate-700 transition-all";
            if (icon) icon.className = "fas fa-hdd text-[7px]";
            if (span) span.innerText = "LOCAL";
        }
    });
};

window.saveCostosState = function () {
    if (!activeProject) return;
    activeProject.type = 'costos';
    activeProject.data = JSON.parse(JSON.stringify(costosData));
    activeProject.ordenes = JSON.parse(JSON.stringify(ordenesTrabajo));
    activeProject.prorrateos = JSON.parse(JSON.stringify(prorrateosData));
    activeProject.updatedAt = new Date().toISOString();

    const projects = JSON.parse(localStorage.getItem('educonta_projects_costos')) || [];
    const idx = projects.findIndex(p => p.id === activeProject.id);
    if (idx !== -1) projects[idx] = activeProject;
    else projects.push(activeProject);

    localStorage.setItem('educonta_projects_costos', JSON.stringify(projects));

    const toast = document.getElementById('sync-toast');
    if (toast) {
        toast.querySelector('h4').innerText = "Costos Guardados";
        toast.querySelector('p').innerText = "Bóveda fabril actualizada localmente";
        toast.classList.remove('translate-y-32', 'opacity-0');
        setTimeout(() => toast.classList.add('translate-y-32', 'opacity-0'), 2500);
    }

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
                    console.error("Error sincronizando costos en la nube:", err);
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
    saveCostosState();
};

window.handleTitleKey = function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        e.target.blur();
    }
};

window.closeProject = function () {
    localStorage.setItem('educonta_proyectos_active_tab', 'costos');
    window.location.href = 'proyectos.html';
};

window.switchCostosView = function (tabId) {
    currentSubTab = tabId;
    ['edo', 'orden', 'prorrateo'].forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        const btnM = document.getElementById(`tab-${t}-m`);
        const view = document.getElementById(`view-${t}`);
        if (btn) btn.classList.toggle('active', t === tabId);
        if (btnM) {
            if (t === tabId) {
                btnM.className = "shrink-0 h-9 px-4 bg-amber-500 text-white rounded-[36px] font-black text-[10px] uppercase flex items-center gap-1.5 shadow-sm";
            } else {
                btnM.className = "shrink-0 h-9 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-[36px] font-black text-[10px] uppercase flex items-center gap-1.5 shadow-sm";
            }
        }
        if (view) view.classList.toggle('hidden', t !== tabId);
    });
    updateCostosTabIndicator();
};

let currentCostosTabIndex = 0;
const COSTOS_VIEW_TABS = ['edo', 'orden', 'prorrateo'];

function updateCostosTabIndicator(instant = false) {
    const activeBtn = document.getElementById(`tab-${currentSubTab}`);
    const pill = document.getElementById('costos-tab-indicator');
    if (!activeBtn || !pill) return;

    if (activeBtn.offsetWidth === 0) {
        requestAnimationFrame(() => updateCostosTabIndicator(instant));
        return;
    }

    const newIndex = COSTOS_VIEW_TABS.indexOf(currentSubTab);
    const distance = Math.abs(newIndex - currentCostosTabIndex);
    const stretch = 1 + Math.min(distance * 0.15, 0.35);

    if (instant) {
        pill.style.transition = 'none';
    }

    pill.style.width = `${activeBtn.offsetWidth}px`;
    pill.style.opacity = '1';

    if (instant || distance === 0) {
        pill.style.transform = `translateX(${activeBtn.offsetLeft}px) scaleX(1) scaleY(1)`;
    } else {
        pill.style.transform = `translateX(${activeBtn.offsetLeft}px) scaleX(${stretch}) scaleY(0.9)`;
        setTimeout(() => {
            pill.style.transform = `translateX(${activeBtn.offsetLeft}px) scaleX(1) scaleY(1)`;
        }, 180);
    }

    if (instant) {
        void pill.offsetWidth;
        requestAnimationFrame(() => {
            pill.style.transition = '';
        });
    }

    currentCostosTabIndex = (newIndex >= 0) ? newIndex : 0;
}

let currentCostosModeIndex = 1;
const COSTOS_MODES = ['asistido', 'practica'];

function updateCostosModeIndicator(instant = false) {
    const activeBtn = document.getElementById(`btn-costos-mode-${costosMode}`);
    const pill = document.getElementById('costos-mode-indicator');
    if (!activeBtn || !pill) return;

    if (activeBtn.offsetWidth === 0) {
        requestAnimationFrame(() => updateCostosModeIndicator(instant));
        return;
    }

    const newIndex = COSTOS_MODES.indexOf(costosMode);
    const distance = Math.abs(newIndex - currentCostosModeIndex);
    const stretch = 1 + Math.min(distance * 0.15, 0.35);

    if (instant) {
        pill.style.transition = 'none';
    }

    pill.style.width = `${activeBtn.offsetWidth}px`;
    pill.style.opacity = '1';

    if (instant || distance === 0) {
        pill.style.transform = `translateX(${activeBtn.offsetLeft}px) scaleX(1) scaleY(1)`;
    } else {
        pill.style.transform = `translateX(${activeBtn.offsetLeft}px) scaleX(${stretch}) scaleY(0.9)`;
        setTimeout(() => {
            pill.style.transform = `translateX(${activeBtn.offsetLeft}px) scaleX(1) scaleY(1)`;
        }, 180);
    }

    if (instant) {
        void pill.offsetWidth;
        requestAnimationFrame(() => {
            pill.style.transition = '';
        });
    }

    currentCostosModeIndex = (newIndex >= 0) ? newIndex : 0;
}

window.setCostosMode = function (mode) {
    costosMode = mode;
    const btnAsistido = document.getElementById('btn-costos-mode-asistido');
    const btnPractica = document.getElementById('btn-costos-mode-practica');
    const panelAudit = document.getElementById('panel-audit-costos');
    if (panelAudit) panelAudit.classList.add('hidden');

    if (btnAsistido) btnAsistido.classList.toggle('active', mode === 'asistido');
    if (btnPractica) btnPractica.classList.toggle('active', mode === 'practica');

    updateCostosModeIndicator();

    if (mode === 'asistido') {
        populateCostosInputs(costosData);
        calcCostosLive();
    } else {
        const ids = ['costos-ii-mp', 'costos-compras-mp', 'costos-if-mp', 'costos-salarios-mod', 'costos-cargas-mod', 'costos-cif-mat', 'costos-cif-moi', 'costos-cif-energia', 'costos-cif-deprec', 'costos-ii-pp', 'costos-if-pp', 'costos-ii-pt', 'costos-if-pt'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        calcCostosLive();
    }
};

function populateCostosInputs(d) {
    const setVal = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = (v > 0) ? Number(v).toFixed(2) : '';
    };
    setVal('costos-ii-mp', d.iiMp);
    setVal('costos-compras-mp', d.comprasMp);
    setVal('costos-if-mp', d.ifMp);
    setVal('costos-salarios-mod', d.salariosMod);
    setVal('costos-cargas-mod', d.cargasMod);
    setVal('costos-cif-mat', d.cifMat);
    setVal('costos-cif-moi', d.cifMoi);
    setVal('costos-cif-energia', d.cifEnergia);
    setVal('costos-cif-deprec', d.cifDeprec);
    setVal('costos-ii-pp', d.iiPp);
    setVal('costos-if-pp', d.ifPp);
    setVal('costos-ii-pt', d.iiPt);
    setVal('costos-if-pt', d.ifPt);
}

function fmtUI(num) {
    return (num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

window.calcCostosLive = function () {
    const getNum = id => {
        const el = document.getElementById(id);
        return el ? (parseFloat(el.value) || 0) : 0;
    };
    const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.innerText = txt;
    };

    // 1. MPD
    const iiMp = getNum('costos-ii-mp');
    const compMp = getNum('costos-compras-mp');
    const ifMp = getNum('costos-if-mp');
    const totMpd = Math.max(0, Math.round((iiMp + compMp - ifMp) * 100) / 100);
    setTxt('costos-tot-mpd', `$ ${fmtUI(totMpd)}`);

    // 2. MOD
    const salMod = getNum('costos-salarios-mod');
    const carMod = getNum('costos-cargas-mod');
    const totMod = Math.round((salMod + carMod) * 100) / 100;
    setTxt('costos-tot-mod', `$ ${fmtUI(totMod)}`);

    // 3. CIF
    const cifMat = getNum('costos-cif-mat');
    const cifMoi = getNum('costos-cif-moi');
    const cifEne = getNum('costos-cif-energia');
    const cifDep = getNum('costos-cif-deprec');
    const totCif = Math.round((cifMat + cifMoi + cifEne + cifDep) * 100) / 100;
    setTxt('costos-tot-cif', `$ ${fmtUI(totCif)}`);

    // Costo Incurrido = MPD + MOD + CIF
    const incurrido = Math.round((totMpd + totMod + totCif) * 100) / 100;
    setTxt('costos-tot-incurrido', `$ ${fmtUI(incurrido)}`);

    // Costo de Producción Terminada
    const iiPp = getNum('costos-ii-pp');
    const ifPp = getNum('costos-if-pp');
    const costoTerminados = Math.max(0, Math.round((incurrido + iiPp - ifPp) * 100) / 100);
    setTxt('costos-tot-terminados', `$ ${fmtUI(costoTerminados)}`);

    // Costo de lo Vendido
    const iiPt = getNum('costos-ii-pt');
    const ifPt = getNum('costos-if-pt');
    const costoVendido = Math.max(0, Math.round((costoTerminados + iiPt - ifPt) * 100) / 100);
    setTxt('costos-tot-vendido', `$ ${fmtUI(costoVendido)}`);

    // Guardar estado local de costos
    costosData.iiMp = iiMp;
    costosData.comprasMp = compMp;
    costosData.ifMp = ifMp;
    costosData.mpdUtilizada = totMpd;
    costosData.salariosMod = salMod;
    costosData.cargasMod = carMod;
    costosData.totalMod = totMod;
    costosData.cifMat = cifMat;
    costosData.cifMoi = cifMoi;
    costosData.cifEnergia = cifEne;
    costosData.cifDeprec = cifDep;
    costosData.totalCif = totCif;
    costosData.costoIncurrido = incurrido;
    costosData.iiPp = iiPp;
    costosData.ifPp = ifPp;
    costosData.costoTerminados = costoTerminados;
    costosData.iiPt = iiPt;
    costosData.ifPt = ifPt;
    costosData.costoVendido = costoVendido;
};

function renderAllCostosViews() {
    renderOrdenesTable();
    renderProrrateosTable();
    populateCostosInputs(costosData);
    calcCostosLive();
    setTimeout(updateCostosTabIndicator, 50);
}

function renderOrdenesTable() {
    const tbody = document.getElementById('ordenes-body');
    if (!tbody) return;

    let totMpd = 0, totMod = 0, totCif = 0, totGral = 0;
    tbody.innerHTML = ordenesTrabajo.map((op, i) => {
        totMpd += op.mpd;
        totMod += op.mod;
        totCif += op.cif;
        totGral += op.costoTotal;
        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="py-3 px-3 font-bold tabular-nums text-amber-600 dark:text-amber-400">${op.id}</td>
                <td class="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">${op.cliente}</td>
                <td class="py-3 px-3 text-slate-800 dark:text-slate-200 font-bold">${op.producto}</td>
                <td class="py-3 px-3 text-right tabular-nums font-bold">${op.unidades}</td>
                <td class="py-3 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">$ ${fmtUI(op.mpd)}</td>
                <td class="py-3 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">$ ${fmtUI(op.mod)}</td>
                <td class="py-3 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">$ ${fmtUI(op.cif)}</td>
                <td class="py-3 px-3 text-right tabular-nums font-bold text-amber-600 dark:text-amber-400">$ ${fmtUI(op.costoTotal)}</td>
                <td class="py-3 px-3 text-right tabular-nums font-black text-emerald-600">$ ${fmtUI(op.costoUnitario)}</td>
                <td class="py-3 px-2 text-center no-print">
                    <button type="button" onclick="deleteOrdenRow(${i})" class="text-slate-300 hover:text-rose-500 transition-colors"><i class="fas fa-trash-alt text-xs"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById('tot-ordenes-mpd').innerText = `$ ${fmtUI(totMpd)}`;
    document.getElementById('tot-ordenes-mod').innerText = `$ ${fmtUI(totMod)}`;
    document.getElementById('tot-ordenes-cif').innerText = `$ ${fmtUI(totCif)}`;
    document.getElementById('tot-ordenes-costo').innerText = `$ ${fmtUI(totGral)}`;
}

window.deleteOrdenRow = function (idx) {
    ordenesTrabajo.splice(idx, 1);
    saveCostosState();
    renderOrdenesTable();
};

window.openAddOrdenModal = function () {
    const modal = document.getElementById('modal-nueva-orden');
    if (!modal) return;

    const idInput = document.getElementById('orden-input-id');
    if (idInput) idInput.value = `OP-${101 + ordenesTrabajo.length}`;

    const uInput = document.getElementById('orden-input-unidades');
    if (uInput) uInput.value = '100';

    const clInput = document.getElementById('orden-input-cliente');
    if (clInput) clInput.value = '';

    const prodInput = document.getElementById('orden-input-producto');
    if (prodInput) prodInput.value = '';

    const mpdInput = document.getElementById('orden-input-mpd');
    if (mpdInput) mpdInput.value = '1000.00';

    const modInput = document.getElementById('orden-input-mod');
    if (modInput) modInput.value = '800.00';

    const cifInput = document.getElementById('orden-input-cif');
    if (cifInput) cifInput.value = '400.00';

    calcModalOrdenPreview();

    modal.classList.remove('closing');
    modal.style.display = 'flex';
    setTimeout(() => {
        if (clInput) clInput.focus();
    }, 100);
};

window.closeAddOrdenModal = function () {
    const modal = document.getElementById('modal-nueva-orden');
    if (!modal) return;
    modal.classList.add('closing');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
    }, 200);
};

window.calcModalOrdenPreview = function () {
    const getVal = id => {
        const el = document.getElementById(id);
        return el ? (parseFloat(el.value) || 0) : 0;
    };
    const unidades = Math.max(1, parseInt(document.getElementById('orden-input-unidades')?.value) || 1);
    const mpd = getVal('orden-input-mpd');
    const mod = getVal('orden-input-mod');
    const cif = getVal('orden-input-cif');
    const total = Math.round((mpd + mod + cif) * 100) / 100;
    const unit = Math.round((total / unidades) * 100) / 100;

    const totEl = document.getElementById('orden-preview-total');
    if (totEl) totEl.innerText = `$ ${fmtUI(total)}`;

    const unitEl = document.getElementById('orden-preview-unitario');
    if (unitEl) unitEl.innerText = `$ ${fmtUI(unit)}`;
};

window.saveNuevaOrden = function () {
    const id = document.getElementById('orden-input-id')?.value.trim();
    const cliente = document.getElementById('orden-input-cliente')?.value.trim();
    const producto = document.getElementById('orden-input-producto')?.value.trim();
    const unidades = parseInt(document.getElementById('orden-input-unidades')?.value) || 1;
    const mpd = parseFloat(document.getElementById('orden-input-mpd')?.value) || 0;
    const mod = parseFloat(document.getElementById('orden-input-mod')?.value) || 0;
    const cif = parseFloat(document.getElementById('orden-input-cif')?.value) || 0;

    if (!id || !cliente || !producto) {
        alert("Por favor completa los datos obligatorios de la orden de producción.");
        return;
    }

    const costoTotal = Math.round((mpd + mod + cif) * 100) / 100;
    const costoUnitario = unidades > 0 ? Math.round((costoTotal / unidades) * 100) / 100 : 0;

    ordenesTrabajo.push({
        id,
        cliente,
        producto,
        unidades,
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: new Date().toISOString().split('T')[0],
        mpd,
        mod,
        cif,
        costoTotal,
        costoUnitario,
        estado: 'Terminada'
    });

    saveCostosState();
    renderOrdenesTable();
    closeAddOrdenModal();
};

function renderProrrateosTable() {
    const tbody = document.getElementById('prorrateos-body');
    if (!tbody) return;

    let totD1 = 0, totD2 = 0, totGral = 0;
    tbody.innerHTML = prorrateosData.map(p => {
        totD1 += p.deptoProd1;
        totD2 += p.deptoProd2;
        totGral += p.total;
        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">${p.concepto}</td>
                <td class="py-3 px-3 text-slate-500 font-medium">${p.base}</td>
                <td class="py-3 px-3 text-right tabular-nums font-bold">$ ${fmtUI(p.deptoProd1)}</td>
                <td class="py-3 px-3 text-right tabular-nums font-bold">$ ${fmtUI(p.deptoProd2)}</td>
                <td class="py-3 px-3 text-right tabular-nums font-black text-amber-600 dark:text-amber-400">$ ${fmtUI(p.total)}</td>
            </tr>
        `;
    }).join('');

    document.getElementById('prorrateo-tot-d1').innerText = `$ ${fmtUI(totD1)}`;
    document.getElementById('prorrateo-tot-d2').innerText = `$ ${fmtUI(totD2)}`;
    document.getElementById('prorrateo-tot-gral').innerText = `$ ${fmtUI(totGral)}`;
}

// === Auditoría MINED para Costos Industriales ===
window.auditCostosPractice = function () {
    const d = costosData;
    let correctCount = 0;
    const totalChecks = 4;
    const errors = [];

    // 1. Verificación Materia Prima Directa
    const calcMpd = Math.max(0, d.iiMp + d.comprasMp - d.ifMp);
    if (d.mpdUtilizada > 0 && Math.abs(d.mpdUtilizada - calcMpd) < 0.50) {
        correctCount++;
    } else {
        errors.push("Materia Prima Directa: Verifica la fórmula: II MP + Compras MP - IF MP.");
    }

    // 2. Verificación Mano de Obra Directa
    const calcMod = d.salariosMod + d.cargasMod;
    if (d.totalMod > 0 && Math.abs(d.totalMod - calcMod) < 0.50) {
        correctCount++;
    } else {
        errors.push("Mano de Obra Directa: Incluye los salarios devengados más las cargas patronales de ley (ISSS 7.5% + AFP 8.75%).");
    }

    // 3. Verificación Costos Indirectos de Fabricación
    const calcCif = d.cifMat + d.cifMoi + d.cifEnergia + d.cifDeprec;
    if (d.totalCif > 0 && Math.abs(d.totalCif - calcCif) < 0.50) {
        correctCount++;
    } else {
        errors.push("Costos Indirectos de Fabricación: Suma materiales indirectos, MOI, energía motriz y depreciación fabril.");
    }

    // 4. Verificación Costo de Productos Terminados
    const calcTerm = d.costoIncurrido + d.iiPp - d.ifPp;
    if (d.costoTerminados > 0 && Math.abs(d.costoTerminados - calcTerm) < 0.50) {
        correctCount++;
    } else {
        errors.push("Costo de Artículos Producidos: Costo Incurrido + II Productos en Proceso - IF Productos en Proceso.");
    }

    let nivel = 1, titulo = "", desc = "", badgeClass = "";
    if (correctCount === 4) {
        nivel = 5;
        titulo = "Nivel 5: Excelente (Dominio Fabril Pleno)";
        desc = "Estructura de costos industriales y hoja de órdenes perfectamente conciliadas según la NIC 2 (Inventarios).";
        badgeClass = "bg-emerald-500 text-white";
    } else if (correctCount === 3) {
        nivel = 4;
        titulo = "Nivel 4: Muy Bueno (Competente)";
        desc = "Buen dominio de los tres elementos del costo con leves desajustes en inventarios en proceso.";
        badgeClass = "bg-sky-500 text-white";
    } else if (correctCount === 2) {
        nivel = 3;
        titulo = "Nivel 3: Bueno (Aprobado Básico)";
        desc = "Identifica los tres elementos primarios (MPD, MOD, CIF), pero requiere afinar la transferencia de costos a producto terminado.";
        badgeClass = "bg-amber-500 text-white";
    } else {
        nivel = 1;
        titulo = "Nivel 1: Inicial (Requiere Refuerzo)";
        desc = "Fórmulas fabriles incompletas o desarticuladas en la acumulación de costos.";
        badgeClass = "bg-rose-500 text-white";
    }

    const panel = document.getElementById('panel-audit-costos');
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
                <button type="button" onclick="this.closest('#panel-audit-costos').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 text-sm">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="text-xs text-slate-700 dark:text-slate-300 font-medium mb-4">${desc}</p>
            ${errors.length > 0 ? `
                <div class="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                    <h5 class="text-xs font-black uppercase text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                        <i class="fas fa-exclamation-triangle"></i> Observaciones de Costos Fabriles:
                    </h5>
                    <ul class="text-xs text-amber-800 dark:text-amber-300 space-y-1.5 list-disc list-inside">
                        ${errors.map(e => `<li>${e}</li>`).join('')}
                    </ul>
                </div>
            ` : `
                <div class="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                    <i class="fas fa-check-circle text-base"></i> Costo de fabricación y liquidación de órdenes perfectamente cuadradas.
                </div>
            `}
        `;
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// === PUENTE HACIA LIBRO DIARIO: CIERRE FABRIL ===
window.generateCostosJournalEntry = function () {
    const d = costosData;
    if (d.costoTerminados <= 0) {
        alert("Consigna los elementos del costo de producción para generar la partida de cierre fabril.");
        return;
    }

    const rows = [];
    // 1. Cargar Inventario de Productos Terminados (Debe)
    rows.push({
        cod: "110502",
        nom: "Inventario de Productos Terminados (Almacén Central)",
        debe: d.costoTerminados.toFixed(2),
        haber: ""
    });

    // 2. Abonar Inventario de Materia Prima consumida (Haber)
    rows.push({
        cod: "110501",
        nom: "Inventario de Materia Prima (Consumo Fabril en Proceso)",
        debe: "",
        haber: d.mpdUtilizada.toFixed(2)
    });

    // 3. Abonar Mano de Obra Directa Aplicada (Haber)
    rows.push({
        cod: "410201",
        nom: "Mano de Obra Directa Aplicada a Producción",
        debe: "",
        haber: d.totalMod.toFixed(2)
    });

    // 4. Abonar Costos Indirectos de Fabricación Aplicados (Haber)
    const cifAplicado = Math.round((d.costoTerminados - d.mpdUtilizada - d.totalMod) * 100) / 100;
    rows.push({
        cod: "410202",
        nom: "Costos Indirectos de Fabricación (CIF Aplicados)",
        debe: "",
        haber: cifAplicado.toFixed(2)
    });

    if (window.EduContaBridgeToDiario) {
        window.EduContaBridgeToDiario.open({
            origen: 'Contabilidad de Costos Industriales',
            color: 'amber',
            icono: 'fa-industry',
            titulo: 'Cierre y Traslado de Producción Terminada',
            subtitulo: `Liquidación Fabril • Órdenes de Producción`,
            fecha: new Date().toISOString().split('T')[0],
            glosa: `V/ Liquidación y cierre de costos fabriles del período. Traslado de producción terminada a bodega central por $${d.costoTerminados.toFixed(2)} (MPD $${d.mpdUtilizada.toFixed(2)}, MOD $${d.totalMod.toFixed(2)}, CIF $${cifAplicado.toFixed(2)}).`,
            rows: rows
        });
    }
};

window.exportarExcelCostos = function () {
    let csv = "\uFEFFESTADO DE COSTO DE PRODUCCION - EDUCONTA SV\n";
    csv += "Elemento,Monto ($)\n";
    csv += `Materia Prima Directa Utilizada,${costosData.mpdUtilizada}\n`;
    csv += `Mano de Obra Directa Aplicada,${costosData.totalMod}\n`;
    csv += `Costos Indirectos de Fabricación,${costosData.totalCif}\n`;
    csv += `Costo Incurrido de Producción,${costosData.costoIncurrido}\n`;
    csv += `Costo de Artículos Producidos y Terminados,${costosData.costoTerminados}\n`;
    csv += `Costo de lo Vendido,${costosData.costoVendido}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Costos_Fabriles_${activeProject?.name || 'Empresa'}.csv`;
    link.click();
};

window.exportarPDFCostos = function () {
    if (typeof window.jspdf === 'undefined') {
        window.print();
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'letter');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("EduConta SV — Estado de Costo de Producción Fabril", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Empresa: ${activeProject?.name || 'Fabril'}`, 14, 26);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 31);

    const dataRows = [
        ["Inventario Inicial de Materia Prima", `$ ${fmtUI(costosData.iiMp)}`],
        ["(+) Compras de Materia Prima", `$ ${fmtUI(costosData.comprasMp)}`],
        ["(-) Inventario Final de Materia Prima", `$ ${fmtUI(costosData.ifMp)}`],
        ["(=) MATERIA PRIMA DIRECTA UTILIZADA", `$ ${fmtUI(costosData.mpdUtilizada)}`],
        ["(+) MANO DE OBRA DIRECTA", `$ ${fmtUI(costosData.totalMod)}`],
        ["(+) COSTOS INDIRECTOS DE FABRICACIÓN", `$ ${fmtUI(costosData.totalCif)}`],
        ["(=) COSTO INCURRIDO EN LA PRODUCCIÓN", `$ ${fmtUI(costosData.costoIncurrido)}`],
        ["(+) Inventario Inicial de Productos en Proceso", `$ ${fmtUI(costosData.iiPp)}`],
        ["(-) Inventario Final de Productos en Proceso", `$ ${fmtUI(costosData.ifPp)}`],
        ["(=) COSTO DE ARTÍCULOS PRODUCIDOS", `$ ${fmtUI(costosData.costoTerminados)}`],
        ["(+) Inventario Inicial de Productos Terminados", `$ ${fmtUI(costosData.iiPt)}`],
        ["(-) Inventario Final de Productos Terminados", `$ ${fmtUI(costosData.ifPt)}`],
        ["(=) COSTO DE LO VENDIDO", `$ ${fmtUI(costosData.costoVendido)}`]
    ];

    if (doc.autoTable) {
        doc.autoTable({
            startY: 36,
            head: [["Rubro del Costo Fabril", "Valor Acumulado ($)"]],
            body: dataRows,
            theme: 'striped',
            headStyles: { fillColor: [245, 158, 11] },
            styles: { fontSize: 9 }
        });
    }

    doc.save(`Estado_Costos_${activeProject?.name || 'Produccion'}.pdf`);
};

window.exportarProyectoCostos = function () {
    const dataStr = JSON.stringify(activeProject, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(activeProject?.name || 'Costos').replace(/\s+/g, '_')}.edc`;
    link.click();
};
