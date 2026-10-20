// ==========================================
// EDITOR.JS - MANEJO DEL DOM Y RENDERIZADO
// ==========================================

window.initializePage = function () {
    try {
        if (typeof window.injectSharedUI === 'function') {
            window.injectSharedUI('shared-components-root');
        }
    } catch (e) {
        console.error("Error al inyectar la UI compartida:", e);
    }
    if (typeof window.initBookDatePickers === 'function') window.initBookDatePickers();

    // 1) Safety Guard Clause & Multi-Vault Loading
    const lastId = localStorage.getItem('educonta_last_project_id');
    const activeTabPref = localStorage.getItem('educonta_proyectos_active_tab') || 'libros';
    const vaultKey = (typeof window.getProjectsStorageKey === 'function')
        ? window.getProjectsStorageKey(activeTabPref)
        : (activeTabPref === 'tributario' ? 'educonta_projects_tributario' : activeTabPref === 'costos' ? 'educonta_projects_costos' : 'educonta_projects_libros');

    let allVaults = JSON.parse(localStorage.getItem(vaultKey)) || [];
    let found = allVaults.find(p => String(p.id) === String(lastId));

    if (!found) {
        const vaults = ['educonta_projects_libros', 'educonta_projects_tributario', 'educonta_projects_costos', 'educonta_projects_kardex', 'educonta_projects_planillas'];
        for (const vk of vaults) {
            const list = JSON.parse(localStorage.getItem(vk)) || [];
            found = list.find(p => String(p.id) === String(lastId));
            if (found) {
                allVaults = list;
                break;
            }
        }
    }

    // Modo Auditoría Fallback: Si estamos auditando o si hay proyectos en la bóveda, tomar el primero si no coincidió el ID
    if (!found && allVaults.length > 0) {
        found = allVaults[0];
    }

    window.projects = allVaults;
    window.proyecto_actual = found;

    if (!window.proyecto_actual) {
        window.location.href = 'proyectos.html';
        return;
    }

    // 2) Inicializar Componentes de DOM si todo es valido
    window.currentProjectId = found.id;

    if (window.loadCatalogoMaestro) {
        window.loadCatalogoMaestro(); // Se ejecuta en paralelo
    }

    if (window.proyecto_actual) {
        window.bookCounter = window.proyecto_actual.bookCounter || 0;

        const titleEl = document.getElementById('current-project-name');
        if (titleEl) titleEl.innerText = window.proyecto_actual.name || 'Proyecto';

        if (typeof window.setupTitlePillAnimation === 'function') {
            window.setupTitlePillAnimation();
        }

        const sectorTag = document.getElementById('pill-sector-tag');
        if (sectorTag) sectorTag.innerText = window.proyecto_actual.sector || 'ALL';

        const catalogTag = document.getElementById('pill-catalog-tag');
        if (catalogTag) {
            if (window.proyecto_actual.catalogo) {
                catalogTag.innerText = window.proyecto_actual.catalogo;
                catalogTag.classList.remove('hidden');
            } else {
                catalogTag.classList.add('hidden');
            }
        }

        if (window.proyecto_actual.sheets && window.proyecto_actual.sheets.length > 0) {
            window.proyecto_actual.sheets.forEach(s => {
                if (typeof window.reconstructSheet === 'function') window.reconstructSheet(s);
            });
            const lastSheet = window.proyecto_actual.sheets[window.proyecto_actual.sheets.length - 1];
            if (lastSheet && typeof window.selectSheet === 'function') window.selectSheet(lastSheet.id);
        } else {
            if (typeof window.createNewBook === 'function') window.createNewBook();
        }
    }

    // 3) Verificar estado de sincronización en Nube para mostrar la píldora
    if (window.proyecto_actual) {
        const syncedIds = new Set(JSON.parse(localStorage.getItem('educonta_synced_ids')) || []);
        if (syncedIds.has(window.proyecto_actual.id)) {
            const cloudInd = document.getElementById('cloud-indicator');
            const cloudIndMobile = document.getElementById('cloud-indicator-mobile');
            if (cloudInd) {
                cloudInd.classList.add('synced');
                const span = cloudInd.querySelector('span');
                if (span) span.innerText = 'ONLINE';
                const icon = cloudInd.querySelector('i');
                if (icon) { icon.className = 'fas fa-cloud-check'; }
            }
            if (cloudIndMobile) {
                cloudIndMobile.classList.add('synced');
            }
        }
    }

    // Inicializar estado de sincronización según conexión y sincronizar de inmediato
    setTimeout(() => {
        if (typeof window.updateSyncUI === 'function') {
            const syncedIds = new Set(JSON.parse(localStorage.getItem('educonta_synced_ids')) || []);
            const isSynced = window.proyecto_actual && syncedIds.has(window.proyecto_actual.id);
            
            if (!navigator.onLine) {
                window.updateSyncUI('offline');
            } else {
                if (isSynced) {
                    window.updateSyncUI('online');
                } else {
                    window.updateSyncUI('idle');
                }
                
                // Sincronizar en segundo plano al cargar si estamos online
                if (typeof window.forceSave === 'function') {
                    window.forceSave(true);
                }
            }
        }
    }, 500);

    // Escuchar cambios de autenticación para sincronizar automáticamente al iniciar sesión
    if (typeof supabaseClient !== 'undefined') {
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                setTimeout(() => { if (typeof window.forceSave === 'function') window.forceSave(true); }, 500);
            } else if (event === 'SIGNED_OUT') {
                window.updateSyncUI('idle');
            }
        });
    }

    // Registrar UI events
    const appEl = document.getElementById('app-screen');
    if (appEl) {
        appEl.classList.remove('hidden');
        appEl.classList.add('fade-in');
    }

    // 4) Detección de pestaña inicial (por URL)
    const urlParams = new URLSearchParams(window.location.search);
    const targetTab = urlParams.get('tab');
    if (targetTab && ['inicial', 'diario', 'mayor', 'comprobacion', 'resultados', 'balance'].includes(targetTab) && typeof window.switchTab === 'function') {
        setTimeout(() => {
            window.switchTab(targetTab);
        }, 120);
    }

    // Inicializar modos pedagógicos
    if (typeof window.setMayorMode === 'function') window.setMayorMode(window.mayorMode);
    if (typeof window.setComprobacionMode === 'function') window.setComprobacionMode(window.comprobacionMode);

    // Desvanecer preloader suavemente una vez que los libros, partidas y balances estén renderizados
    if (typeof window.dismissGlobalPreloader === 'function') {
        window.dismissGlobalPreloader();
    }
};

// Helper globals
window.historyStack = []; // 'history' is reserved in Window, calling it historyStack
window.historyPointer = -1;
window.isAuditMode = false;
window.isGridView = false;
window.isApplyingHistory = false;
window.bookCounter = 0;
window.selectedSheetId = null;
window.activeRowId = null;
window.highlightedIdx = -1;
window._syncPill = null;
window._syncDebounce = null; // Debounce timer for real-time sync

const escLibros = (v) => (window.EduSec && typeof window.EduSec.escapeHtml === 'function')
    ? window.EduSec.escapeHtml(v)
    : String(v ?? '').replace(/[&<>"'`]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[ch]));
const jsArgLibros = (v) => (window.EduSec && typeof window.EduSec.jsArg === 'function')
    ? window.EduSec.jsArg(v)
    : `'${escLibros(String(v ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"))}'`;

// === FUNCIONES DE SALIDA Y NAVEGACIÓN ===
window.closeProject = function () {
    // Redirección inmediata (la sincronización ocurre en tiempo real)
    window.location.href = 'proyectos.html';
};

// === FUNCIONES DE LA PÍLDORA DE PROYECTO (PROJECT PILL) ===
window.toggleProjectPillExpansion = function (e) {
    if (e) e.stopPropagation();
    const pill = document.getElementById('main-project-pill');
    if (!pill) return;

    const isExpanded = pill.classList.contains('project-pill-expanded');

    // Si se va a cerrar, también cerramos el dropdown de sectores interno
    if (isExpanded) {
        const sectorOpts = document.getElementById('pill-sector-options-container');
        if (sectorOpts) {
            sectorOpts.classList.add('opacity-0', 'pointer-events-none', 'grid-rows-[0fr]');
            sectorOpts.classList.remove('opacity-100', 'pointer-events-auto', 'grid-rows-[1fr]');
        }
        const chevron = document.getElementById('pill-sector-chevron');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }

    pill.classList.toggle('project-pill-expanded');
};

window.togglePillSectorDropdown = function (e) {
    if (e) e.stopPropagation();
    const container = document.getElementById('pill-sector-options-container');
    const chevron = document.getElementById('pill-sector-chevron');
    if (container) {
        const isHidden = container.classList.contains('opacity-0') || container.classList.contains('grid-rows-[0fr]');
        if (isHidden) {
            container.classList.remove('opacity-0', 'pointer-events-none', 'grid-rows-[0fr]');
            container.classList.add('opacity-100', 'pointer-events-auto', 'grid-rows-[1fr]');
            if (chevron) chevron.style.transform = 'rotate(180deg)';
        } else {
            container.classList.add('opacity-0', 'pointer-events-none', 'grid-rows-[0fr]');
            container.classList.remove('opacity-100', 'pointer-events-auto', 'grid-rows-[1fr]');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
    }
};

window.selectPillSector = function (sector, label) {
    const labelEl = document.getElementById('pill-custom-sector-label');
    if (labelEl) labelEl.innerText = label;

    // Actualizar el valor en el input hidden si existe
    const hiddenInp = document.getElementById('pill-input-sector');
    if (hiddenInp) hiddenInp.value = sector;

    // Cerrar el dropdown
    const container = document.getElementById('pill-sector-options-container');
    const chevron = document.getElementById('pill-sector-chevron');
    if (container) {
        container.classList.add('opacity-0', 'pointer-events-none', 'grid-rows-[0fr]');
        container.classList.remove('opacity-100', 'pointer-events-auto', 'grid-rows-[1fr]');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }

    // Ejecutar lógica de actualización de sector
    if (typeof window.updateProjectSectorFromPill === 'function') {
        window.updateProjectSectorFromPill(sector);
    }
};

// Cerrar expansión al hacer clic fuera
document.addEventListener('click', (e) => {
    const pill = document.getElementById('main-project-pill');
    if (pill && pill.classList.contains('project-pill-expanded') && !pill.contains(e.target)) {
        window.toggleProjectPillExpansion();
    }
});

window.updateProjectSectorFromPill = function (sector) {
    const p = projects.find(proj => String(proj.id) === String(currentProjectId));
    if (!p) return;
    p.sector = sector;
    p.updatedAt = new Date().toISOString();

    const defaults = { 'ALL': 'MAESTRO', 'SSF': 'BANCOS', 'NICS': 'NICS_GRAL', 'GUB': 'SAFI' };
    const autoCat = defaults[sector] || 'MAESTRO';
    p.catalogo = autoCat;

    saveProjectsToLocal();
    if (typeof renderProjectGrid === 'function') renderProjectGrid();

    // Actualizar tags visuales
    const sectorTagEl = document.getElementById('pill-sector-tag');
    if (sectorTagEl) sectorTagEl.innerText = sector;
    const catTagEl = document.getElementById('pill-catalog-tag');
    if (catTagEl) catTagEl.classList.add('hidden');

    // Refrescar pestaña activa
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) switchTab(activeTab.id.replace('tab-', ''));
}

window.updateProjectCatalogFromPill = function (catalogo) {
    const p = projects.find(proj => String(proj.id) === String(currentProjectId));
    if (!p) return;
    p.catalogo = catalogo;
    p.updatedAt = new Date().toISOString();

    saveProjectsToLocal();
    if (typeof renderProjectGrid === 'function') renderProjectGrid();

    const catTagEl = document.getElementById('pill-catalog-tag');
    if (catTagEl) catTagEl.innerText = catalogo;

    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) switchTab(activeTab.id.replace('tab-', ''));
}

window.updatePillCatalogOptions = function () {
    // Ya no es necesaria pues el catálogo es automático por sector
}

window.updateCurrentProjectName = function (el) {
    const p = projects.find(proj => String(proj.id) === String(currentProjectId));
    if (p) { p.name = el.innerText; p.updatedAt = new Date().toISOString(); saveProjectsToLocal(); if (typeof renderProjectGrid === 'function') renderProjectGrid(); }
}

let currentIndex = 0;
let tabSnapTimeout = null;
const LIBROS_VIEW_TABS = ['diario', 'mayor', 'comprobacion', 'resultados', 'inicial', 'balance'];

function moveToTab(btn, newIndex, animate = true) {
    const pill = document.getElementById('tab-indicator');
    if (!pill || !btn) return;

    if (tabSnapTimeout) {
        clearTimeout(tabSnapTimeout);
        tabSnapTimeout = null;
    }

    if (btn.offsetWidth === 0) {
        requestAnimationFrame(() => {
            if (btn.offsetWidth > 0) moveToTab(btn, newIndex, animate);
        });
        return;
    }

    const distance = Math.abs(newIndex - currentIndex);
    const stretch = (animate && distance > 0) ? (1 + Math.min(distance * 0.15, 0.35)) : 1;

    if (!animate) {
        pill.style.transition = 'none';
    }

    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.opacity = '1';

    if (animate && distance > 0) {
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(${stretch}) scaleY(0.9)`;

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

    currentIndex = newIndex;
}
window.moveToTab = moveToTab;

window.updateTabIndicator = function (instant = false) {
    const activeBtn = document.querySelector('.tab-btn.active');
    if (!activeBtn) return;
    const newIdx = activeBtn.dataset.idx !== undefined
        ? parseInt(activeBtn.dataset.idx, 10)
        : LIBROS_VIEW_TABS.indexOf(activeBtn.id.replace('tab-', ''));
    moveToTab(activeBtn, newIdx >= 0 ? newIdx : 0, !instant);
};

window.switchTab = function (tabId) {
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Actualizar botones — quitar animación previa, agregar solo al nuevo
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active', 'text-sky-600', 'tab-just-selected');
        b.classList.add('text-slate-500');
    });
    const btn = document.getElementById(`tab-${tabId}`);
    if (btn) {
        btn.classList.add('active', 'text-sky-600');
        btn.classList.remove('text-slate-500');
        const newIdx = btn.dataset.idx !== undefined
            ? parseInt(btn.dataset.idx, 10)
            : LIBROS_VIEW_TABS.indexOf(tabId);
        moveToTab(btn, newIdx >= 0 ? newIdx : 0, true);
    }

    // Actualizar vistas
    const views = ['inicial', 'diario', 'mayor', 'comprobacion', 'resultados', 'balance'];
    views.forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if (el) { el.classList.add('hidden'); el.classList.remove('block'); }
    });
    const activeView = document.getElementById(`view-${tabId}`);
    if (activeView) { activeView.classList.remove('hidden'); activeView.classList.add('block'); }

    saveHistory();
    
    // Control de visibilidad de herramientas derechas e inferiores
    const toolsContainers = [document.getElementById('right-tools-container'), document.getElementById('mobile-tools-container')];
    if (tabId === 'diario') {
        toolsContainers.forEach(el => { if (el) { el.classList.remove('hidden'); el.classList.add('flex'); } });
    } else {
        toolsContainers.forEach(el => { if (el) { el.classList.remove('flex'); el.classList.add('hidden'); } });
    }

    // Control de visibilidad de barra de herramientas izquierda (Dinámica)
    const bSave = document.getElementById('btn-force-save');
    const bView = document.getElementById('btn-grid-view');
    const bExport = document.getElementById('btn-export-pdf');
    const bIndices = document.getElementById('btn-indices');

    if (bSave) bSave.style.display = (tabId === 'diario') ? '' : 'none';
    if (bView) bView.style.display = (tabId === 'diario') ? '' : 'none';
    
    if (bIndices) {
        if (tabId === 'resultados' || tabId === 'balance') {
            bIndices.style.display = '';
        } else {
            bIndices.style.display = 'none';
        }
    }

    // Adaptar botón exportar PDF al contexto
    if (bExport) {
        let exportArg = '';
        switch(tabId) {
            case 'diario': exportArg = 'Libro_Diario'; break;
            case 'mayor': exportArg = 'Libros_Mayores'; break;
            case 'comprobacion': exportArg = 'Balance_Comprobacion'; break;
            case 'resultados': exportArg = 'Estado_Resultados'; break;
            case 'inicial': exportArg = 'Balance_Inicial'; break;
            case 'balance': exportArg = 'Balance_General'; break;
        }
        bExport.setAttribute('onclick', `exportarPDF('${exportArg}')`);
    }

    if (tabId !== 'diario') {
        const accounts = typeof procesarDiario === 'function' ? procesarDiario(false) : [];
        const openingAccounts = typeof procesarDiario === 'function' ? procesarDiario(true) : [];
        if (tabId === 'inicial' && typeof renderInicial === 'function') renderInicial(openingAccounts);
        if (tabId === 'mayor' && typeof renderMayor === 'function') renderMayor(accounts);
        if (tabId === 'comprobacion' && typeof renderComprobacion === 'function') renderComprobacion(accounts);
        if (tabId === 'resultados' && typeof renderResultados === 'function') renderResultados(accounts);
        if (tabId === 'balance' && typeof renderBalance === 'function') renderBalance(accounts);
    }
    window.scrollTo(scrollX, scrollY);
}

// === MODOS DUALES EN LIBROS: MAYOR Y COMPROBACIÓN (BTVAC) ===
window.mayorMode = localStorage.getItem('educonta_mayor_modo') || 'practica';
window.setMayorMode = function (mode) {
    window.mayorMode = mode;
    try { localStorage.setItem('educonta_mayor_modo', mode); } catch (e) {}
    const btnAsistido = document.getElementById('btn-mayor-asistido');
    const btnPractica = document.getElementById('btn-mayor-practica');
    const btnAudit = document.getElementById('btn-audit-mayor');

    if (btnAsistido && btnPractica) {
        if (mode === 'practica') {
            btnPractica.className = "px-3.5 py-1.5 rounded-full transition-all bg-sky-500 text-white shadow-xs";
            btnAsistido.className = "px-3.5 py-1.5 rounded-full transition-all text-slate-500 hover:text-slate-800";
            if (btnAudit) btnAudit.classList.remove('hidden');
        } else {
            btnAsistido.className = "px-3.5 py-1.5 rounded-full transition-all bg-sky-500 text-white shadow-xs";
            btnPractica.className = "px-3.5 py-1.5 rounded-full transition-all text-slate-500 hover:text-slate-800";
            if (btnAudit) btnAudit.classList.add('hidden');
        }
    }
};

window.comprobacionMode = localStorage.getItem('educonta_comprobacion_modo') || 'practica';
window.setComprobacionMode = function (mode) {
    window.comprobacionMode = mode;
    try { localStorage.setItem('educonta_comprobacion_modo', mode); } catch (e) {}
    const btnAsistido = document.getElementById('btn-comp-asistido');
    const btnPractica = document.getElementById('btn-comp-practica');
    const btnAudit = document.getElementById('btn-audit-comp');

    if (btnAsistido && btnPractica) {
        if (mode === 'practica') {
            btnPractica.className = "px-3.5 py-1.5 rounded-full transition-all bg-sky-500 text-white shadow-xs";
            btnAsistido.className = "px-3.5 py-1.5 rounded-full transition-all text-slate-500 hover:text-slate-800";
            if (btnAudit) btnAudit.classList.remove('hidden');
        } else {
            btnAsistido.className = "px-3.5 py-1.5 rounded-full transition-all bg-sky-500 text-white shadow-xs";
            btnPractica.className = "px-3.5 py-1.5 rounded-full transition-all text-slate-500 hover:text-slate-800";
            if (btnAudit) btnAudit.classList.add('hidden');
        }
    }
};

window.auditMayorPractice = function () {
    alert("Modo Práctica: Cuentas T manuales habilitadas para verificación pedagógica.");
};

window.auditComprobacionPractice = function () {
    alert("Modo Práctica: Balance de Comprobación manual habilitado para verificación pedagógica.");
};

window.setupTitlePillAnimation = function () {
    const titleEl = document.getElementById('current-project-name');
    if (!titleEl) return;
    const titlePill = titleEl.closest('.project-card');
    if (!titlePill) return;
    // Solo escuchar el elemento del título del proyecto, NO los títulos de hojas
    titleEl.addEventListener('focusin', () => titlePill.classList.add('border-active'));
    titleEl.addEventListener('focusout', () => titlePill.classList.remove('border-active'));
}

window.getSyncPill = function () {
    if (!_syncPill) _syncPill = document.getElementById('cloud-indicator')?.closest('.glass-pill');
    return _syncPill;
}

window.setSyncAnimating = function (active) {
    const pill = getSyncPill();
    if (pill) pill.classList.toggle('border-active', active);
}

window.updateSyncUI = function(state) {
    const cloudInd = document.getElementById('cloud-indicator');
    const cloudIndMobile = document.getElementById('cloud-indicator-mobile');

    const inds = [cloudInd, cloudIndMobile];
    
    // Si no hay internet, forzar estado offline inmediatamente
    if (!navigator.onLine && state !== 'offline') {
        state = 'offline';
    }

    inds.forEach(el => {
        if (!el) return;
        el.classList.remove('synced', 'error', 'syncing-pulse', 'animate-pulse');
        const icon = el.querySelector('i');
        if (icon) {
            icon.classList.remove('sync-spin', 'fa-spin', 'fa-rotate', 'fa-sync-alt');
        }
    });

    if (state === 'syncing') {
        inds.forEach(el => {
            if (!el) return;
            el.classList.add('syncing-pulse');
            const span = el.querySelector('span'); if (span) span.innerText = 'SINCRONIZANDO';
            const icon = el.querySelector('i'); if (icon) { icon.className = 'fas fa-sync-alt sync-spin'; }
        });
    } else if (state === 'success' || state === 'online') {
        inds.forEach(el => {
            if (!el) return;
            el.classList.add('synced');
            const span = el.querySelector('span'); if (span) span.innerText = 'ONLINE';
            const icon = el.querySelector('i'); if (icon) icon.className = 'fas fa-cloud-check';
        });
    } else if (state === 'offline' || state === 'error') {
        inds.forEach(el => {
            if (!el) return;
            el.classList.add('error');
            const span = el.querySelector('span'); 
            if (span) {
                if (state === 'error' && window.lastSyncError) {
                    // Truncate to avoid visual overflow if it's too long
                    const displayMsg = window.lastSyncError.length > 25 ? window.lastSyncError.substring(0, 22) + '...' : window.lastSyncError;
                    span.innerText = displayMsg.toUpperCase();
                } else {
                    span.innerText = 'OFFLINE';
                }
            }
            const icon = el.querySelector('i');
            if (icon) {
                icon.className = (state === 'error') ? 'fas fa-exclamation-triangle' : 'fas fa-wifi-slash';
            }
        });
    } else if (state === 'local') {
        inds.forEach(el => {
            if (!el) return;
            const span = el.querySelector('span'); if (span) span.innerText = 'SOLO LOCAL';
            const icon = el.querySelector('i'); if (icon) icon.className = 'fas fa-hdd';
        });
    } else {
        inds.forEach(el => {
            if (!el) return;
            const span = el.querySelector('span'); if (span) span.innerText = 'PENDIENTE';
            const icon = el.querySelector('i'); if (icon) icon.className = 'fas fa-cloud-upload';
        });
    }
}

// Listeners de conectividad global
window.addEventListener('online', () => {
    updateSyncUI('online');
    if (typeof window.showSyncToast === 'function') window.showSyncToast('online');
    // Al recuperar conexión, intentar sincronizar inmediatamente si hay proyecto
    setTimeout(() => { if (typeof forceSave === 'function') forceSave(true); }, 1000);
});
window.addEventListener('offline', () => {
    updateSyncUI('offline');
    if (typeof window.showSyncToast === 'function') window.showSyncToast('offline');
});

// Atajo de teclado para Guardar Manual (Ctrl+S / Cmd+S)
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (typeof window.forceSave === 'function') window.forceSave(false);
    }
});

window.saveHistory = function () {
    if (isAuditMode) return;
    if (isApplyingHistory || !currentProjectId) return;
    const container = document.getElementById('books-stack');
    if (!container) return;
    const state = Array.from(container.querySelectorAll('.glass-card')).map(card => {
        const titleEl = card.querySelector('.sheet-title');
        const rows = Array.from(card.querySelectorAll('.entries-container tr')).map(tr => {
            const inps = tr.querySelectorAll('input');
            return {
                id: tr.id,
                vals: [inps[0]?.value || '', inps[1]?.value || '', inps[2]?.value || '', inps[3]?.value || '']
            };
        });
        return {
            id: card.id, title: titleEl ? titleEl.textContent.trim() : '', desc: card.querySelector('.sheet-desc') ? card.querySelector('.sheet-desc').textContent.trim() : '', date: card.querySelector('.doc-date') ? card.querySelector('.doc-date').value : '',
            glosa: card.querySelector('.glosa-input') ? card.querySelector('.glosa-input').value : '', frozen: card.dataset.frozen === 'true', rows
        };
    });
    const snapshotStr = JSON.stringify({ state, selectedSheetId, bookCounter });
    const p = typeof projects !== 'undefined' ? projects.find(proj => String(proj.id) === String(currentProjectId)) : null;
    
    // SHIELD: Si el estado actual está vacío pero antes teníamos datos, NO sobreescribir (evitar borrado por error de carga)
    if (p && state.length === 0 && p.sheets && p.sheets.length > 0) {
        console.warn("Intento de guardado en blanco bloqueado por seguridad.");
        return;
    }

    if (p) { p.sheets = state; p.bookCounter = bookCounter; p.updatedAt = new Date().toISOString(); if (typeof saveProjectsToLocal === 'function') saveProjectsToLocal(); }

    // REAL-TIME SYNC: Gatillar sincronización con debounce optimizado (0.5s)
    if (window._syncDebounce) clearTimeout(window._syncDebounce);
    window._syncDebounce = setTimeout(() => {
        if (typeof window.forceSave === 'function') window.forceSave(true);
    }, 500);

    if (historyPointer > -1 && window.historyStack[historyPointer] === snapshotStr) return;
    if (historyPointer < window.historyStack.length - 1) window.historyStack = window.historyStack.slice(0, historyPointer + 1);
    window.historyStack.push(snapshotStr); historyPointer++;
    if (window.historyStack.length > 50) { window.historyStack.shift(); historyPointer--; }
    updateHistoryButtons();
}

window.undo = function () { if (historyPointer > 0) { historyPointer--; applyHistoryState(JSON.parse(window.historyStack[historyPointer])); } }

window.redo = function () { if (historyPointer < window.historyStack.length - 1) { historyPointer++; applyHistoryState(JSON.parse(window.historyStack[historyPointer])); } }

window.applyHistoryState = function (data) {
    isApplyingHistory = true;
    document.getElementById('books-stack').innerHTML = "";
    bookCounter = data.bookCounter;
    data.state.forEach(s => reconstructSheet(s));
    selectedSheetId = data.selectedSheetId;
    if (selectedSheetId) selectSheet(selectedSheetId);
    updateHistoryButtons();
    isApplyingHistory = false;
}

window.reconstructSheet = function (s) {
    const booksStack = document.getElementById('books-stack');
    const safeId = escLibros(s.id);
    const safeTitle = escLibros(s.title);
    const safeDesc = escLibros(s.desc || 'Libro Diario General');
    const safeDate = escLibros(s.date);
    const safeGlosa = escLibros(s.glosa);
    const jsId = jsArgLibros(s.id);

    // CORRECCIÓN PRINCIPAL: Forzar data-frozen="false" al crear el HTML
    // para que addRow() pueda rellenar las filas correctamente.
    const html = `
                <div id="${safeId}" class="glass-card p-4 sm:p-10 min-h-[400px] flex flex-col" data-frozen="false" onclick="selectSheet(${jsId})">
                    <div class="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div class="w-full sm:w-auto">
                            <h3 class="sheet-title font-extrabold text-xl sm:text-2xl text-slate-800 focus:text-sky-600 outline-none w-full" contenteditable="true" onkeydown="handleTitleKey(event)" onblur="saveHistory()">${safeTitle}</h3>
                            <p class="sheet-desc text-[10px] text-slate-400 font-bold uppercase mt-1 focus:text-sky-600 outline-none w-full" contenteditable="true" onkeydown="handleTitleKey(event)" onblur="saveHistory()">${safeDesc}</p>
                        </div>
                        <div class="custom-book-date-picker w-full sm:w-auto relative z-[20]" data-book-id="${safeId}">
                            <button type="button" class="custom-book-date-btn">
                                <i class="far fa-calendar text-slate-400 text-xs"></i>
                                <span class="custom-book-date-display">--/--/----</span>
                            </button>
                            <div class="custom-book-calendar-popup absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-slate-800/95 border border-slate-200/85 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-4 backdrop-blur-md dark:text-slate-200">
                                <div class="cal-header flex justify-between items-center mb-3">
                                    <button type="button" class="cal-prev-btn w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 border-none bg-transparent cursor-pointer">
                                        <i class="fas fa-chevron-left text-[10px]"></i>
                                    </button>
                                    <span class="cal-month-year text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">Junio 2026</span>
                                    <button type="button" class="cal-next-btn w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 border-none bg-transparent cursor-pointer">
                                        <i class="fas fa-chevron-right text-[10px]"></i>
                                    </button>
                                </div>
                                <div class="cal-weekdays">
                                    <span>Do</span><span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sa</span>
                                </div>
                                <div class="cal-days cal-days-grid">
                                    <!-- Inyectado dinámicamente -->
                                </div>
                            </div>
                            <input type="date" class="doc-date hidden" value="${safeDate}" onchange="saveHistory()">
                        </div>
                    </div>
                    <div class="overflow-x-auto w-full pb-4">
                        <table class="w-full min-w-[650px]">
                            <thead>
                                <tr class="text-[9px] text-slate-400 uppercase font-black border-b border-slate-200">
                                    <th class="py-3 px-2 text-left w-24 sm:w-32">Código</th>
                                    <th class="py-3 px-2 text-left">Cuenta / Detalle</th>
                                    <th class="py-3 px-2 text-right w-28 sm:w-36">Debe</th>
                                    <th class="py-3 px-2 text-right w-28 sm:w-36">Haber</th>
                                    <th class="w-8 sm:w-10 no-print"></th>
                                </tr>
                            </thead>
                            <tbody class="entries-container"></tbody>
                            <tfoot>
                                <tr class="border-t-2 border-slate-900 font-bold bg-slate-50/30">
                                    <td colspan="2" class="py-4 px-2"><input class="glosa-input input-minimal text-xs italic" value="${safeGlosa}" placeholder="Descripción (Glosa)..." onblur="saveHistory()"></td>
                                    <td class="py-4 px-2 text-right text-sm font-black total-debe">$ 0.00</td>
                                    <td class="py-4 px-2 text-right text-sm font-black total-haber">$ 0.00</td>
                                    <td class="no-print"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div class="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
                        <div class="flex items-center justify-between w-full sm:w-auto gap-3">
                            <button onclick="addRow(${jsId}, true)" class="btn-add text-[11px] font-black uppercase text-sky-600"><i class="fas fa-plus-circle mr-1"></i> Añadir Línea</button>
                            <span class="balance-status px-3 py-1 rounded-[36px] text-[9px] font-black uppercase unbalanced">Descuadrado</span>
                        </div>
                        <button onclick="toggleFreeze(${jsId})" class="btn-freeze-toggle w-full sm:w-auto px-6 py-3 sm:py-2 rounded-[36px] bg-slate-800 text-white font-bold text-[10px] uppercase shadow-md ambient-glow soft-glow"><i class="fas fa-check-double mr-2"></i> <span class="soft-glow-text" data-text="Finalizar Partida">Finalizar Partida</span></button>
                    </div>
                </div>
            `;
    booksStack.insertAdjacentHTML('beforeend', html);
    const card = document.getElementById(s.id);
    s.rows.forEach(r => {
        const tr = addRow(s.id, false, r.id);
        if (tr) {
            const inps = tr.querySelectorAll('input');
            inps[0].value = r.vals[0] || "";
            inps[1].value = r.vals[1] || "";
            inps[2].value = r.vals[2] || "";
            inps[3].value = r.vals[3] || "";
        }
    });

    const picker = document.getElementById(s.id)?.querySelector('.custom-book-date-picker');
    if (picker) {
        window.syncBookDateDisplay(picker, s.date);
    }
    if (typeof calc === 'function') calc(s.id);

    // CORRECCIÓN PRINCIPAL: Bloquear la hoja DESPUÉS de haber agregado todas las filas y calculado totales.
    if (s.frozen === 'true' || s.frozen === true) {
        toggleFreeze(s.id, false);
    }
}

window.createNewBook = function () {
    bookCounter++;
    const bookId = `book-${bookCounter}`;
    const html = `
                <div id="${bookId}" class="glass-card animate-pop-in p-4 sm:p-10 min-h-[400px] flex flex-col" data-frozen="false" onclick="selectSheet('${bookId}')">
                    <div class="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div class="w-full sm:w-auto">
                            <h3 class="sheet-title font-extrabold text-xl sm:text-2xl text-slate-800 focus:text-sky-600 outline-none w-full" contenteditable="true" onkeydown="handleTitleKey(event)" onblur="saveHistory()">Registro No. ${bookCounter}</h3>
                            <p class="sheet-desc text-[10px] text-slate-400 font-bold uppercase mt-1 focus:text-sky-600 outline-none w-full" contenteditable="true" onkeydown="handleTitleKey(event)" onblur="saveHistory()">Libro Diario General</p>
                        </div>
                        <div class="custom-book-date-picker w-full sm:w-auto relative z-[20]" data-book-id="${bookId}">
                            <button type="button" class="custom-book-date-btn">
                                <i class="far fa-calendar text-slate-400 text-xs"></i>
                                <span class="custom-book-date-display">--/--/----</span>
                            </button>
                            <div class="custom-book-calendar-popup absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-slate-800/95 border border-slate-200/85 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-4 backdrop-blur-md dark:text-slate-200">
                                <div class="cal-header flex justify-between items-center mb-3">
                                    <button type="button" class="cal-prev-btn w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 border-none bg-transparent cursor-pointer">
                                        <i class="fas fa-chevron-left text-[10px]"></i>
                                    </button>
                                    <span class="cal-month-year text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">Junio 2026</span>
                                    <button type="button" class="cal-next-btn w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 border-none bg-transparent cursor-pointer">
                                        <i class="fas fa-chevron-right text-[10px]"></i>
                                    </button>
                                </div>
                                <div class="cal-weekdays">
                                    <span>Do</span><span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sa</span>
                                </div>
                                <div class="cal-days cal-days-grid">
                                    <!-- Inyectado dinámicamente -->
                                </div>
                            </div>
                            <input type="date" class="doc-date hidden" value="${new Date().toISOString().split('T')[0]}" onchange="saveHistory()">
                        </div>
                    </div>
                    <div class="overflow-x-auto w-full pb-4">
                        <table class="w-full min-w-[650px]">
                            <thead>
                                <tr class="text-[9px] text-slate-400 uppercase font-black border-b border-slate-200">
                                    <th class="py-3 px-2 text-left w-24 sm:w-32">Código</th>
                                    <th class="py-3 px-2 text-left">Cuenta / Detalle</th>
                                    <th class="py-3 px-2 text-right w-28 sm:w-36">Debe</th>
                                    <th class="py-3 px-2 text-right w-28 sm:w-36">Haber</th>
                                    <th class="w-8 sm:w-10 no-print"></th>
                                </tr>
                            </thead>
                            <tbody class="entries-container"></tbody>
                            <tfoot>
                                <tr class="border-t-2 border-slate-900 font-bold bg-slate-50/30">
                                    <td colspan="2" class="py-4 px-2"><input class="glosa-input input-minimal text-xs italic" placeholder="Descripción (Glosa)..." onblur="saveHistory()"></td>
                                    <td class="py-4 px-2 text-right text-sm font-black total-debe">$ 0.00</td>
                                    <td class="py-4 px-2 text-right text-sm font-black total-haber">$ 0.00</td>
                                    <td class="no-print"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div class="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
                        <div class="flex items-center justify-between w-full sm:w-auto gap-3">
                            <button onclick="addRow('${bookId}', true)" class="btn-add text-[11px] font-black uppercase text-sky-600"><i class="fas fa-plus-circle mr-1"></i> Añadir Línea</button>
                            <span class="balance-status px-3 py-1 rounded-[36px] text-[9px] font-black uppercase unbalanced">Descuadrado</span>
                        </div>
                        <button onclick="toggleFreeze('${bookId}')" class="btn-freeze-toggle w-full sm:w-auto px-6 py-3 sm:py-2 rounded-[36px] bg-slate-800 text-white font-bold text-[10px] uppercase shadow-md ambient-glow soft-glow"><i class="fas fa-check-double mr-2"></i> <span class="soft-glow-text" data-text="Finalizar Partida">Finalizar Partida</span></button>
                    </div>
                </div>
            `;
    document.getElementById('books-stack').insertAdjacentHTML('beforeend', html);
    const picker = document.getElementById(bookId).querySelector('.custom-book-date-picker');
    if (picker) {
        window.syncBookDateDisplay(picker, new Date().toISOString().split('T')[0]);
    }

    if (typeof isGridView !== 'undefined' && !isGridView) {
        setTimeout(() => {
            const el = document.getElementById(bookId);
            if (el) {
                const headerOffset = 180;
                const elementPosition = el.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }
        }, 10);
    }

    setTimeout(() => {
        const el = document.getElementById(bookId);
        if (el) el.classList.remove('animate-pop-in');
    }, 600);

    addRow(bookId, false); selectSheet(bookId); saveHistory();
}

window.addRow = function (bookId, shouldSave = true, forcedId = null) {
    const b = document.getElementById(bookId); if (!b || b.dataset.frozen === 'true') return null;
    const rid = forcedId || `row-${bookId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const tr = document.createElement('tr'); tr.id = rid;
    tr.className = "border-b border-slate-100 group hover:bg-slate-50 transition-colors";
    tr.innerHTML = `
                <td class="py-2 px-2"><input type="text" class="input-minimal tabular-nums font-semibold text-xs col-0" placeholder="Código" oninput="search(this, '${bookId}')" onfocus="activeRowId='${rid}'; selectSheet('${bookId}')" onkeydown="handleKey(event, 0)"></td>
                <td class="py-2 px-2"><input type="text" class="input-minimal text-sm col-1" placeholder="Cuenta" oninput="search(this, '${bookId}')" onfocus="activeRowId='${rid}'; selectSheet('${bookId}')" onkeydown="handleKey(event, 1)"></td>
                <td class="py-2 px-2"><input type="text" class="val-debe input-minimal text-right text-sm font-bold col-2" oninput="formatOnType(this); if(typeof calc === 'function') calc('${bookId}')" onblur="formatNumber(this); saveHistory()" onfocus="activeRowId='${rid}'; selectSheet('${bookId}')" onkeydown="handleKey(event, 2)"></td>
                <td class="py-2 px-2"><input type="text" class="val-haber input-minimal text-right text-sm font-bold col-3" oninput="formatOnType(this); if(typeof calc === 'function') calc('${bookId}')" onblur="formatNumber(this); saveHistory()" onfocus="activeRowId='${rid}'; selectSheet('${bookId}')" onkeydown="handleKey(event, 3)"></td>
                <td class="text-center no-print"><button onclick="removeRow(this, '${bookId}')" class="btn-remove-row text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><i class="fas fa-times"></i></button></td>
            `;
    b.querySelector('.entries-container').appendChild(tr);
    if (shouldSave) saveHistory(); return tr;
}

window.formatOnType = function (input) {
    // Guardamos la posición del cursor
    let cursorPosition = input.selectionStart;
    let oldLength = input.value.length;

    // Filtramos todo lo que no sea número o punto decimal
    let val = input.value.replace(/[^0-9.]/g, '');

    // Evitamos que se digiten múltiples puntos
    const parts = val.split('.');
    if (parts.length > 2) {
        parts.pop();
        val = parts.join('.');
    }

    // Aplicamos formato de comas a la parte entera en tiempo real
    if (parts[0].length > 0) {
        parts[0] = parseInt(parts[0], 10).toLocaleString('en-US');
    }

    let formattedVal = parts.join('.');
    input.value = formattedVal;

    // Restauramos la posición del cursor sumando/restando las comas que aparezcan
    let newLength = formattedVal.length;
    cursorPosition = cursorPosition + (newLength - oldLength);
    try { input.setSelectionRange(cursorPosition, cursorPosition); } catch (e) { }
}

window.formatNumber = function (input) {
    if (input.value.trim() !== '') {
        const val = typeof parseLocalFloat === 'function' ? parseLocalFloat(input.value) : parseFloat(input.value.replace(/,/g, ''));
        input.value = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

window.updateHighlight = function(items) {
    items.forEach(el => el.classList.remove('bg-sky-50'));
    if (items[highlightedIdx]) {
        items[highlightedIdx].classList.add('bg-sky-50');
        items[highlightedIdx].scrollIntoView({ block: 'nearest' });
    }
}


window.handleKey = function (e, col) {
    const row = document.getElementById(activeRowId); if (!row) return;
    const suggestionsPanel = document.getElementById('global-suggestions');

    if (!suggestionsPanel.classList.contains('hidden')) {
        const items = suggestionsPanel.querySelectorAll('.suggestion-item');
        if (e.key === 'ArrowDown') { e.preventDefault(); highlightedIdx < items.length - 1 ? highlightedIdx++ : highlightedIdx = 0; updateHighlight(items); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); highlightedIdx > 0 ? highlightedIdx-- : highlightedIdx = items.length - 1; updateHighlight(items); return; }
        if (e.key === 'Enter' && highlightedIdx > -1) { e.preventDefault(); items[highlightedIdx].click(); return; }
        if (e.key === 'Escape') { suggestionsPanel.classList.add('hidden'); return; }
    }

    if (e.key === 'Enter') {
        e.preventDefault();
        if (col < 3) {
            row.querySelector(`.col-${col + 1}`).focus();
        } else {
            const nextRow = row.nextElementSibling;
            if (nextRow) nextRow.querySelector('.col-0').focus();
            else {
                const nr = addRow(selectedSheetId, true);
                if (nr) setTimeout(() => nr.querySelector('.col-0').focus(), 10);
            }
        }
        return;
    }

    if (e.key === 'ArrowDown') {
        const nr = row.nextElementSibling;
        if (nr) { e.preventDefault(); nr.querySelector(`.col-${col}`).focus(); }
    }
    if (e.key === 'ArrowUp') {
        const pr = row.previousElementSibling;
        if (pr) { e.preventDefault(); pr.querySelector(`.col-${col}`).focus(); }
    }
    if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length) {
        if (col < 3) { e.preventDefault(); row.querySelector(`.col-${col + 1}`).focus(); }
    }
    if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
        if (col > 0) { e.preventDefault(); row.querySelector(`.col-${col - 1}`).focus(); }
    }
}

window.search = function (input, bookId) {
    const val = input.value.toLowerCase().trim().replace(/[.]/g, '');
    const suggestionsPanel = document.getElementById('global-suggestions');
    if (!val) { suggestionsPanel.classList.add('hidden'); return; }

    if (typeof CATALOGO_MAESTRO === 'undefined') return;

    // Incrementamos la cantidad de matches mostrados por ser un catálogo más grande
    // Filtrado Estricto por Sector del Proyecto Activo
    const project = typeof projects !== 'undefined' ? projects.find(p => String(p.id) === String(currentProjectId)) : null;
    const activeSector = (project?.sector || 'ALL').toUpperCase();

    const matches = CATALOGO_MAESTRO.filter(c => {
        const textMatch = (c.id || '').replace(/[.]/g, '').includes(val) || (c.name || '').toLowerCase().includes(val);
        if (!textMatch) return false;

        // Nueva Lógica de 4 Pilares
        if (activeSector === 'ALL') return true;
        const cCat = (c.cat || '').toUpperCase();

        if (activeSector === 'SSF') return cCat === 'SSF' || cCat === 'BANCOS' || cCat === 'SEGUROS';
        if (activeSector === 'NICS') return cCat === 'INV' || cCat === 'AGR' || cCat === 'COM' || cCat === 'PROD';
        if (activeSector === 'GUB') return cCat === 'GUB' || cCat === 'SAFI';

        return cCat === activeSector;
    }).slice(0, 30);

    if (matches.length) {
        const rect = input.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        suggestionsPanel.innerHTML = matches.map(m => {
            const safeCatClass = String(m.cat || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
            return `
                    <div class="suggestion-item" onclick="pick(${jsArgLibros(m.id)}, ${jsArgLibros(m.name)})">
                        <span class="cat-tag tag-${safeCatClass}">${escLibros(m.cat || '')}</span>
                        <div class="flex justify-between items-center w-full"><span class="text-[11px] font-black tabular-nums text-sky-600">${escLibros(m.id)}</span><span class="text-[10px] font-bold text-slate-500 ml-4 truncate">${escLibros(m.name)}</span></div>
                    </div>
                `;
        }).join('');

        // Cálculo exacto del bounding box tomando en cuenta el scroll y evitando offset parents relativos problemáticos
        suggestionsPanel.style.left = `${rect.left + scrollLeft}px`;
        suggestionsPanel.style.top = `${rect.bottom + scrollTop + 2}px`;
        suggestionsPanel.style.width = `${Math.max(rect.width, 380)}px`;
        suggestionsPanel.classList.remove('hidden');
        highlightedIdx = -1;
    } else {
        suggestionsPanel.classList.add('hidden');
    }
}

window.pick = function (id, name) {
    const row = document.getElementById(activeRowId); if (!row) return;
    const ins = row.querySelectorAll('input');
    if (ins.length >= 3) {
        ins[0].value = id; ins[1].value = name;
        document.getElementById('global-suggestions').classList.add('hidden'); ins[2].focus(); saveHistory();
    }
}

window.toggleFreeze = function (id, shouldSave = true) {
    const b = document.getElementById(id); if (!b) return;
    const willBeFrozen = b.dataset.frozen !== 'true';
    if (willBeFrozen && shouldSave) {
        let d = 0, h = 0;
        const parseFn = typeof parseLocalFloat === 'function' ? parseLocalFloat : (v => parseFloat(String(v).replace(/,/g, '')) || 0);
        b.querySelectorAll('.val-debe').forEach(i => d += parseFn(i.value));
        b.querySelectorAll('.val-haber').forEach(i => h += parseFn(i.value));
        const dCents = Math.round((d + Number.EPSILON) * 100);
        const hCents = Math.round((h + Number.EPSILON) * 100);
        if (dCents === 0 || dCents !== hCents) {
            if (typeof window.showSyncToast === 'function') {
                window.showSyncToast('error', 'No se puede finalizar una partida descuadrada o en cero (Principio de Partida Doble).');
            } else if (typeof window.showAlert === 'function') {
                window.showAlert('Partida Descuadrada', 'El total del Debe y del Haber deben ser iguales y mayores a $0.00 antes de finalizar la partida.');
            } else {
                alert('No se puede finalizar una partida descuadrada o en cero.');
            }
            return;
        }
    }
    b.dataset.frozen = willBeFrozen;
    const btn = b.querySelector('.btn-freeze-toggle');
    if (btn) {
        btn.innerHTML = willBeFrozen 
            ? '<i class="fas fa-edit mr-2"></i> <span class="soft-glow-text" data-text="Editar Partida">Editar Partida</span>' 
            : '<i class="fas fa-check-double mr-2"></i> <span class="soft-glow-text" data-text="Finalizar Partida">Finalizar Partida</span>';
        btn.className = `btn-freeze-toggle w-full sm:w-auto px-6 py-3 sm:py-2 rounded-[36px] text-white font-bold text-[10px] uppercase shadow-md ambient-glow soft-glow ${willBeFrozen ? 'bg-amber-500' : 'bg-slate-800'}`;
    }
    if (willBeFrozen) { if (!b.querySelector('.frozen-badge')) { const badge = document.createElement('div'); badge.className = 'frozen-badge'; badge.innerHTML = '<i class="fas fa-lock mr-2"></i> Cerrada'; b.appendChild(badge); } }
    else b.querySelector('.frozen-badge')?.remove();
    b.querySelectorAll('input, button.btn-remove-row, button.custom-book-date-btn').forEach(el => el.disabled = willBeFrozen);
    b.querySelectorAll('[contenteditable]').forEach(el => el.setAttribute('contenteditable', !willBeFrozen));
    if (shouldSave) saveHistory();
}

window.selectSheet = function (id) {
    document.querySelectorAll('.glass-card').forEach(c => c.classList.remove('active-sheet'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active-sheet');
    selectedSheetId = id;

    if (typeof isGridView !== 'undefined' && isGridView) {
        if (typeof toggleGridView === 'function') toggleGridView(false);
    }
}

window.handleTitleKey = function (e) { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }

window.removeRow = function (btn, bookId) {
    const b = document.getElementById(bookId);
    if (!b || b.dataset.frozen === 'true') return;
    const row = btn.closest('tr');
    if (row) {
        row.remove();
        if (typeof window.calc === 'function') window.calc(bookId);
        if (typeof window.saveHistory === 'function') window.saveHistory();
    }
}

window.updateHistoryButtons = function () {
    const u = document.getElementById('btn-undo');
    const r = document.getElementById('btn-redo');
    if (u && r) {
        u.disabled = historyPointer <= 0;
        r.disabled = historyPointer >= window.historyStack.length - 1;
    }
}

window.confirmClearData = function () {
    if (!selectedSheetId || document.getElementById(selectedSheetId).dataset.frozen === 'true') return;
    if (typeof showModal === 'function') {
        showModal("Limpiar Datos", "¿Vaciar campos de esta partida?", () => {
            const sheet = document.getElementById(selectedSheetId);
            if (sheet) {
                sheet.querySelector('.entries-container').innerHTML = "";
                addRow(selectedSheetId, false);
                if (typeof calc === 'function') calc(selectedSheetId);
                if (typeof closeModal === 'function') closeModal();
                saveHistory();
            }
        });
    } else {
        if (confirm("¿Vaciar campos de esta partida?")) {
            const sheet = document.getElementById(selectedSheetId);
            if (sheet) {
                sheet.querySelector('.entries-container').innerHTML = "";
                addRow(selectedSheetId, false);
                if (typeof calc === 'function') calc(selectedSheetId);
                saveHistory();
            }
        }
    }
}

window.confirmDeleteSheet = function () {
    if (!selectedSheetId) return;
    if (typeof showModal === 'function') {
        showModal("Eliminar Partida", "¿Eliminar toda la hoja actual?", () => {
            const sheet = document.getElementById(selectedSheetId);
            if (sheet) sheet.remove();
            selectedSheetId = null;
            if (typeof closeModal === 'function') closeModal();
            saveHistory();
        });
    } else {
        if (confirm("¿Eliminar toda la hoja actual?")) {
            const sheet = document.getElementById(selectedSheetId);
            if (sheet) sheet.remove();
            selectedSheetId = null;
            saveHistory();
        }
    }
}

window.saveProjectsToLocal = function () {
    if (typeof isAuditMode !== 'undefined' && isAuditMode) return;
    if (window.proyecto_actual) {
        const pType = window.proyecto_actual.type || 'libros';
        const vaultKey = (typeof window.getProjectsStorageKey === 'function')
            ? window.getProjectsStorageKey(pType)
            : (pType === 'tributario' ? 'educonta_projects_tributario' : pType === 'costos' ? 'educonta_projects_costos' : 'educonta_projects_libros');

        let allProjects = JSON.parse(localStorage.getItem(vaultKey)) || [];
        const index = allProjects.findIndex(p => String(p.id) === String(window.proyecto_actual.id));
        if (index > -1) {
            allProjects[index] = window.proyecto_actual;
        } else {
            allProjects.push(window.proyecto_actual);
        }
        localStorage.setItem(vaultKey, JSON.stringify(allProjects));
        window.projects = allProjects;
    }
}

window.forceSave = async function (quiet = false) {
    if (typeof isAuditMode !== 'undefined' && isAuditMode) return;
    if (typeof saveHistory === 'function' && !quiet) saveHistory();
    const btn = document.getElementById('btn-force-save');

    // 1) Backup Local
    if (typeof saveProjectsToLocal === 'function') saveProjectsToLocal();

    let originalHTML = "";
    if (btn && !quiet) {
        originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> <span class="hidden sm:inline">Guardado</span>';
        btn.classList.replace('bg-emerald-500', 'bg-emerald-600');
    }

    const indLocal = document.getElementById('save-indicator');
    const indLocalMobile = document.getElementById('save-indicator-mobile');
    if (indLocal) indLocal.classList.add('synced');
    if (indLocalMobile) indLocalMobile.classList.add('synced');

    // 2) Sync a Supabase
    if (typeof supabaseClient !== 'undefined' && window.proyecto_actual) {
        if (!navigator.onLine) {
            updateSyncUI('offline');
            if (!quiet && typeof window.showSyncToast === 'function') {
                window.showSyncToast('offline');
            }
            return;
        }

        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                updateSyncUI('syncing');
                if (typeof setSyncAnimating === 'function') setSyncAnimating(true);

                if (typeof syncCurrentProjectWithSupabase === 'function') {
                    await syncCurrentProjectWithSupabase(window.proyecto_actual, session.user.id, true);
                }

                const syncedIds = new Set(JSON.parse(localStorage.getItem('educonta_synced_ids')) || []);
                syncedIds.add(window.proyecto_actual.id);
                localStorage.setItem('educonta_synced_ids', JSON.stringify(Array.from(syncedIds)));
                updateSyncUI('success');
                if (!quiet && typeof window.showSyncToast === 'function') {
                    window.showSyncToast('success', 'Proyecto respaldado con éxito');
                }
            } else {
                // Sin sesión activa en Supabase, confirmar guardado local
                updateSyncUI('local');
                if (!quiet && typeof window.showSyncToast === 'function') {
                    window.showSyncToast('local', 'Guardado en este equipo');
                }
            }
        } catch (err) {
            console.error('Error al sincronizar desde editor:', err);
            window.lastSyncError = err.message || JSON.stringify(err);
            updateSyncUI('error');
            if (!quiet && typeof window.showSyncToast === 'function') {
                window.showSyncToast('error', window.lastSyncError);
            }
        }
    } else {
        if (!quiet && typeof window.showSyncToast === 'function') {
            window.showSyncToast('local', 'Guardado en este equipo');
        }
    }

    setTimeout(() => {
        if (btn && !quiet) {
            btn.innerHTML = originalHTML;
            btn.classList.replace('bg-emerald-600', 'bg-emerald-500');
        }
        if (typeof setSyncAnimating === 'function') setSyncAnimating(false);
    }, 1000);
}

window.toggleGridView = function (forceStatus = null) {
    if (typeof isGridView === 'undefined') window.isGridView = false;

    const oldStatus = window.isGridView;
    if (forceStatus !== null) {
        window.isGridView = forceStatus;
    } else {
        window.isGridView = !window.isGridView;
    }

    if (oldStatus === window.isGridView) return;

    const container = document.getElementById('books-stack');
    const btn = document.getElementById('btn-grid-view');

    if (!container) return;

    // Remove any previous animation classes
    container.classList.remove('animating-to-grid', 'animating-to-normal');

    if (window.isGridView) {
        // Switch to Grid View
        container.classList.add('animating-to-grid');
        container.classList.add('is-grid-view');
        
        if (btn) btn.innerHTML = '<i class="fas fa-list mr-2"></i> Vista Detalle';

        // Add click listener to cards to zoom back in
        container.querySelectorAll('.glass-card').forEach(card => {
            // Remove old listeners to prevent duplicates
            card.onclick = (e) => {
                e.stopPropagation();
                window.selectedSheetId = card.id;
                toggleGridView(false);
            };
        });

    } else {
        // Switch to Normal View
        container.classList.add('animating-to-normal');
        container.classList.remove('is-grid-view');
        
        if (btn) btn.innerHTML = '<i class="fas fa-th-large mr-2"></i> Vista General';

        // Restore normal click behavior (selectSheet)
        container.querySelectorAll('.glass-card').forEach(card => {
            card.onclick = () => { selectSheet(card.id); };
        });

        // Scroll to the selected sheet with a slight delay to allow CSS grid to revert
        if (window.selectedSheetId) {
            const active = document.getElementById(window.selectedSheetId);
            if (active) {
                // Forzamos al navegador a recalcular el tamaño real sin grid antes de animar
                void container.offsetHeight;
                
                // Cortamos cámara y centramos basados en su tamaño 100% real
                const html = document.documentElement;
                html.style.scrollBehavior = 'auto';
                active.scrollIntoView({ behavior: 'auto', block: 'center' });
                html.style.scrollBehavior = '';
                
                // Ahora que la cámara está en posición, aplicamos el Zoom-in Pop-up
                active.classList.add('active-sheet');
                active.classList.add('expand-from-center-effect');
                
                setTimeout(() => active.classList.remove('expand-from-center-effect'), 600);
            }
        }
    }

    // Cleanup animation classes after transition completes
    setTimeout(() => {
        container.classList.remove('animating-to-grid', 'animating-to-normal');
    }, 600);
}



window.goToIndices = function() {
    if (typeof procesarDiario !== 'function' || typeof calcularUtilidad !== 'function' || typeof clasificarCuenta !== 'function') {
        showAlert('Error', 'No se pudieron cargar los módulos contables requeridos.');
        return;
    }

    const accounts = procesarDiario(false);
    const utilidad = calcularUtilidad(accounts);
    
    let tActivo = 0, tActivoCorriente = 0, tPatrimonio = 0, tPasivo = 0, tPasivoCorriente = 0;
    let tIngreso = 0, tCostoVentas = 0, tInventarios = 0, tCxCobrar = 0;

    accounts.forEach(a => {
        const info = clasificarCuenta(a);
        const code = a.id ? String(a.id) : String(a.codigo || '');

        if (info.tipo === 'Activo') {
            const saldo = a.saldoDeudor >= a.saldoAcreedor
                ? (a.saldoDeudor - a.saldoAcreedor)
                : -(a.saldoAcreedor - a.saldoDeudor);

            if (saldo > 0) {
                tActivo += saldo;
                // Corriente: códigos 11xx
                if (code.startsWith('11')) {
                    tActivoCorriente += saldo;
                    // Inventarios: 1103 o nombre que contenga inventario
                    if (code.startsWith('1103') || a.nombre.toLowerCase().includes('inventario')) {
                        tInventarios += saldo;
                    }
                    // Cuentas por Cobrar: 1102 o nombre que contenga cobrar/cliente
                    if (code.startsWith('1102') || a.nombre.toLowerCase().includes('cobrar') || a.nombre.toLowerCase().includes('cliente')) {
                        tCxCobrar += saldo;
                    }
                }
            } else {
                // Saldo acreedor en cuenta de activo => reclasificar como pasivo corriente
                tPasivo += Math.abs(saldo);
                tPasivoCorriente += Math.abs(saldo);
            }
        } else if (info.tipo === 'Pasivo') {
            const saldo = a.saldoAcreedor >= a.saldoDeudor
                ? (a.saldoAcreedor - a.saldoDeudor)
                : 0;
            if (saldo > 0) {
                tPasivo += saldo;
                // Corriente: códigos 21xx
                if (code.startsWith('21')) tPasivoCorriente += saldo;
            } else if (a.saldoDeudor > a.saldoAcreedor) {
                // Saldo deudor en cuenta de pasivo => reclasificar como activo corriente
                const r = a.saldoDeudor - a.saldoAcreedor;
                tActivo += r;
                tActivoCorriente += r;
            }
        } else if (info.tipo === 'Patrimonio') {
            tPatrimonio += (a.saldoAcreedor - a.saldoDeudor);
        } else if (info.tipo === 'Resultado') {
            if (code.startsWith('4') || a.saldoAcreedor > a.saldoDeudor) {
                // Ingresos
                tIngreso += (a.saldoAcreedor - a.saldoDeudor);
            } else if (code.startsWith('5') || (a.nombre.toLowerCase().includes('costo') && a.saldoDeudor > a.saldoAcreedor)) {
                // Costo de ventas
                tCostoVentas += (a.saldoDeudor - a.saldoAcreedor);
            }
        }
    });

    // IMPORTANTE: El patrimonio contable incluye la utilidad del ejercicio
    tPatrimonio += utilidad;

    const pid = window.proyecto_actual?.id || '';
    const pname = encodeURIComponent(window.proyecto_actual?.name || window.proyecto_actual?.nombre || '');

    const params = new URLSearchParams({
        pid,
        pname,
        act:  tActivo.toFixed(2),
        pat:  tPatrimonio.toFixed(2),
        uti:  utilidad.toFixed(2),
        pas:  tPasivo.toFixed(2),
        ing:  tIngreso.toFixed(2),
        acor: tActivoCorriente.toFixed(2),
        pcor: tPasivoCorriente.toFixed(2),
        inv:  tInventarios.toFixed(2),
        cxc:  tCxCobrar.toFixed(2),
        cvta: tCostoVentas.toFixed(2)
    });

    window.location.href = 'indices.html?' + params.toString();
};

// ==========================================
// EXPORTAR / IMPORTAR  .edc  (EduConta Backup)
// ==========================================

/**
 * Exportar el proyecto activo como archivo .edc
 * Empaqueta el blob completo del proyecto (sheets + metadata) con la firma oficial.
 */
window.exportarProyectoEduConta = function() {
    if (!window.proyecto_actual) {
        if (typeof showAlert === 'function') showAlert('Sin proyecto', 'No hay un proyecto activo para exportar.');
        return;
    }

    // Guardar el estado más reciente antes de exportar
    if (typeof saveHistory === 'function') saveHistory();

    const nombreProyecto = window.proyecto_actual.name || 'Proyecto_EduConta';

    // Construir el paquete de respaldo.  Incluimos los datos locales completos
    // (sheets) que ya viven en window.proyecto_actual; no hay tabla separada de
    // partidas en este sistema — el JSONB vive en proyectos_contables.data.
    const paqueteRespaldo = {
        identificador_app: "EDUCONTA_SV_OFFICIAL",
        version_formato: "1.2",
        metadata: {
            nombre: nombreProyecto,
            fecha: new Date().toISOString(),
            usuario_origen: (typeof supabaseClient !== 'undefined' && supabaseClient.auth.getUser)
                ? (window._edcUserEmail || 'UsuarioLocal')
                : 'UsuarioLocal',
            catalogo: window.proyecto_actual.catalogo || 'MAESTRO',
            sector: window.proyecto_actual.sector || 'ALL'
        },
        // Snapshot completo del proyecto tal como reside en localStorage/Supabase
        cuerpo_contable: window.proyecto_actual
    };

    // Resolver el email del usuario para metadatos (async, no-blocking)
    if (typeof supabaseClient !== 'undefined') {
        supabaseClient.auth.getUser().then(({ data }) => {
            if (data && data.user) window._edcUserEmail = data.user.email;
        }).catch(() => {});
    }

    // --- PROCESO DE BLINDADO (OBFUSCATION) ---
    // Convierte el JSON en un formato no legible para humanos (Base64 + Simple Cipher)
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

    // Crear el Blob "blindado" (.edc ya no es JSON plano, es un stream binario/obfuscado)
    const blob = new Blob([dataBlindada], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombreProyecto.replace(/\s+/g, '_')}_Libros_${new Date().toISOString().split('T')[0]}.edc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    // Toast de confirmación
    const toast = document.getElementById('sync-toast');
    if (toast) {
        toast.querySelector('h4').textContent = 'Backup Exportado';
        toast.querySelector('p').textContent = `${a.download.split('/').pop()}`;
        toast.style.background = '#0ea5e9';
        toast.style.borderColor = '#38bdf8';
        toast.classList.remove('translate-y-32', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-32', 'opacity-0');
            // Restaurar color del toast
            setTimeout(() => {
                toast.style.background = ''; toast.style.borderColor = '';
                toast.querySelector('h4').textContent = 'Sincronización Exitosa';
                toast.querySelector('p').textContent = 'Proyectos respaldados';
            }, 600);
        }, 3000);
    }
};

// ─── Calendario e Interacción Personalizada de Fecha para Libros ───────
let bookCalYear = {};
let bookCalMonth = {};

const MONTH_NAMES_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function formatDisplayDate(dateStr) {
    if (!dateStr) return '--/--/----';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

window.syncBookDateDisplay = function(pickerEl, dateVal) {
    const displayEl = pickerEl.querySelector('.custom-book-date-display');
    if (displayEl) displayEl.textContent = formatDisplayDate(dateVal);
};

window.renderBookCalendar = function(pickerEl) {
    const bookId = pickerEl.dataset.bookId;
    if (!bookId) return;

    const input = pickerEl.querySelector('.doc-date');
    if (!input) return;

    if (bookCalYear[bookId] === undefined || bookCalMonth[bookId] === undefined) {
        const parts = input.value.split('-');
        if (parts.length === 3) {
            bookCalYear[bookId] = parseInt(parts[0]);
            bookCalMonth[bookId] = parseInt(parts[1]) - 1;
        } else {
            bookCalYear[bookId] = new Date().getFullYear();
            bookCalMonth[bookId] = new Date().getMonth();
        }
    }

    const monthYearSpan = pickerEl.querySelector('.cal-month-year');
    const daysGrid = pickerEl.querySelector('.cal-days-grid');
    if (!monthYearSpan || !daysGrid) return;

    const year = bookCalYear[bookId];
    const month = bookCalMonth[bookId];

    monthYearSpan.textContent = `${MONTH_NAMES_ES[month]} ${year}`;
    daysGrid.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    for (let i = firstDayIndex; i > 0; i--) {
        const cell = document.createElement('div');
        cell.className = 'cal-day-cell empty';
        cell.textContent = prevTotalDays - i + 1;
        daysGrid.appendChild(cell);
    }

    const currentDateVal = input.value;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day-cell';
        cell.textContent = day;

        const padMonth = String(month + 1).padStart(2, '0');
        const padDay = String(day).padStart(2, '0');
        const dateVal = `${year}-${padMonth}-${padDay}`;

        if (dateVal === currentDateVal) {
            cell.classList.add('selected');
        }
        if (dateVal === todayStr) {
            cell.classList.add('today');
        }

        cell.onclick = (e) => {
            e.stopPropagation();
            input.value = dateVal;
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);

            syncBookDateDisplay(pickerEl, dateVal);

            const popup = pickerEl.querySelector('.custom-book-calendar-popup');
            if (popup) popup.classList.remove('show');
        };

        daysGrid.appendChild(cell);
    }
};

let bookDatePickersInitialized = false;
window.initBookDatePickers = function() {
    if (bookDatePickersInitialized) return;
    bookDatePickersInitialized = true;

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.custom-book-date-btn');
        if (btn) {
            if (btn.disabled) return;
            e.stopPropagation();
            const picker = btn.closest('.custom-book-date-picker');
            if (!picker) return;

            document.querySelectorAll('.custom-book-calendar-popup').forEach(p => {
                if (p !== picker.querySelector('.custom-book-calendar-popup')) {
                    p.classList.remove('show');
                }
            });

            const popup = picker.querySelector('.custom-book-calendar-popup');
            if (popup) {
                const willShow = !popup.classList.contains('show');
                if (willShow) {
                    popup.classList.add('show');
                    window.renderBookCalendar(picker);
                } else {
                    popup.classList.remove('show');
                }
            }
            return;
        }

        const prevBtn = e.target.closest('.cal-prev-btn');
        if (prevBtn) {
            const picker = prevBtn.closest('.custom-book-date-picker');
            if (picker) {
                e.stopPropagation();
                const bookId = picker.dataset.bookId;
                
                // Inicializar de forma segura si no está definido
                if (bookCalMonth[bookId] === undefined || bookCalYear[bookId] === undefined) {
                    const input = picker.querySelector('.doc-date');
                    const parts = input?.value ? input.value.split('-') : [];
                    if (parts.length === 3) {
                        bookCalYear[bookId] = parseInt(parts[0]);
                        bookCalMonth[bookId] = parseInt(parts[1]) - 1;
                    } else {
                        bookCalYear[bookId] = new Date().getFullYear();
                        bookCalMonth[bookId] = new Date().getMonth();
                    }
                }

                bookCalMonth[bookId]--;
                if (bookCalMonth[bookId] < 0) {
                    bookCalMonth[bookId] = 11;
                    bookCalYear[bookId]--;
                }
                window.renderBookCalendar(picker);
            }
            return;
        }

        const nextBtn = e.target.closest('.cal-next-btn');
        if (nextBtn) {
            const picker = nextBtn.closest('.custom-book-date-picker');
            if (picker) {
                e.stopPropagation();
                const bookId = picker.dataset.bookId;

                // Inicializar de forma segura si no está definido
                if (bookCalMonth[bookId] === undefined || bookCalYear[bookId] === undefined) {
                    const input = picker.querySelector('.doc-date');
                    const parts = input?.value ? input.value.split('-') : [];
                    if (parts.length === 3) {
                        bookCalYear[bookId] = parseInt(parts[0]);
                        bookCalMonth[bookId] = parseInt(parts[1]) - 1;
                    } else {
                        bookCalYear[bookId] = new Date().getFullYear();
                        bookCalMonth[bookId] = new Date().getMonth();
                    }
                }

                bookCalMonth[bookId]++;
                if (bookCalMonth[bookId] > 11) {
                    bookCalMonth[bookId] = 0;
                    bookCalYear[bookId]++;
                }
                window.renderBookCalendar(picker);
            }
            return;
        }

        document.querySelectorAll('.custom-book-calendar-popup').forEach(p => {
            if (!p.contains(e.target)) {
                p.classList.remove('show');
            }
        });
    });
};



window.checkPendingExternalEntries = function() {
    // 1. Verificar si hay partidas de préstamo pendientes
    const prestamoStr = localStorage.getItem('pending_entry_prestamo');
    if (prestamoStr) {
        try {
            const entries = JSON.parse(prestamoStr);
            if (Array.isArray(entries)) {
                entries.forEach(ent => {
                    window.createNewBook();
                    const bookId = selectedSheetId;
                    const sheetEl = document.getElementById(bookId);
                    if (!sheetEl) return;
                    if (ent.titulo) sheetEl.querySelector('.sheet-title').innerText = ent.titulo;
                    if (ent.glosa) sheetEl.querySelector('.glosa-input').value = ent.glosa;
                    if (ent.fecha && sheetEl.querySelector('.doc-date')) {
                        sheetEl.querySelector('.doc-date').value = ent.fecha;
                    }
                    const c = sheetEl.querySelector('.entries-container');
                    if (c) c.innerHTML = '';
                    ent.rows.forEach(r => {
                        const row = window.addRow(bookId, false);
                        if (row) {
                            const inps = row.querySelectorAll('input');
                            inps[0].value = r.cod;
                            inps[1].value = r.nom;
                            inps[2].value = r.debe || '';
                            inps[3].value = r.haber || '';
                        }
                    });
                    if (typeof calc === 'function') calc(bookId);
                });
                localStorage.removeItem('pending_entry_prestamo');
                if (typeof saveHistory === 'function') saveHistory();
                const toast = document.getElementById('sync-toast');
                if (toast) {
                    toast.querySelector('h4').innerText = "Partidas de Préstamo Importadas";
                    toast.querySelector('p').innerText = "Desembolso y Cuota N° 1 registradas";
                    toast.classList.remove('translate-y-32', 'opacity-0');
                    setTimeout(() => toast.classList.add('translate-y-32', 'opacity-0'), 4000);
                }
            }
        } catch(err) {
            console.error("Error importando partida de préstamo:", err);
        }
    }

    // 2. Verificar si hay partida de nómina pendiente
    Object.keys(localStorage).forEach(k => {
        if (k.startsWith('pending_entry_') && k !== 'pending_entry_prestamo') {
            try {
                const ent = JSON.parse(localStorage.getItem(k));
                if (ent && ent.rows) {
                    window.createNewBook();
                    const bookId = selectedSheetId;
                    const sheetEl = document.getElementById(bookId);
                    if (!sheetEl) return;
                    if (ent.titulo) sheetEl.querySelector('.sheet-title').innerText = ent.titulo;
                    if (ent.glosa) sheetEl.querySelector('.glosa-input').value = ent.glosa;
                    if (ent.fecha && sheetEl.querySelector('.doc-date')) {
                        sheetEl.querySelector('.doc-date').value = ent.fecha;
                    }
                    const c = sheetEl.querySelector('.entries-container');
                    if (c) c.innerHTML = '';
                    ent.rows.forEach(r => {
                        const row = window.addRow(bookId, false);
                        if (row) {
                            const inps = row.querySelectorAll('input');
                            inps[0].value = r.cod;
                            inps[1].value = r.nom;
                            inps[2].value = r.debe || '';
                            inps[3].value = r.haber || '';
                        }
                    });
                    if (typeof calc === 'function') calc(bookId);
                    localStorage.removeItem(k);
                    if (typeof saveHistory === 'function') saveHistory();
                    const toast = document.getElementById('sync-toast');
                    if (toast) {
                        toast.querySelector('h4').innerText = "Partida de Nómina Importada";
                        toast.querySelector('p').innerText = "Sueldos y deducciones registradas en el Diario";
                        toast.classList.remove('translate-y-32', 'opacity-0');
                        setTimeout(() => toast.classList.add('translate-y-32', 'opacity-0'), 4000);
                    }
                }
            } catch(e) {
                console.error("Error importando partida de nómina:", e);
            }
        }
    });
};

// Carga segura e inmediata de la página según el estado de carga del documento
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.initializePage();
        setTimeout(window.checkPendingExternalEntries, 600);
    });
} else {
    window.initializePage();
    setTimeout(window.checkPendingExternalEntries, 600);
}

