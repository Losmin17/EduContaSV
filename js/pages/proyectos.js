// === Estado Global de Proyectos ===
window.getProjectsStorageKey = function(type) {
    if (type === 'kardex') return 'educonta_projects_kardex';
    if (type === 'planillas') return 'educonta_projects_planillas';
    if (type === 'hojas') return 'educonta_projects_hojas';
    if (type === 'tributario') return 'educonta_projects_tributario';
    if (type === 'costos') return 'educonta_projects_costos';
    if (type === 'caja') return 'educonta_projects_caja';
    if (type === 'finanzas') return 'educonta_projects_finanzas';
    return 'educonta_projects_libros'; // default: libros
};
// Migration check:
(function() {
    const legacyStr = localStorage.getItem('educonta_projects_v38');
    if (legacyStr) {
        try {
            const legacy = JSON.parse(legacyStr) || [];
            const books = legacy.filter(p => (p.type || 'libros') === 'libros');
            const kardex = legacy.filter(p => p.type === 'kardex');
            const planillas = legacy.filter(p => p.type === 'planillas');
            if (books.length) localStorage.setItem('educonta_projects_libros', JSON.stringify(books));
            if (kardex.length) localStorage.setItem('educonta_projects_kardex', JSON.stringify(kardex));
            if (planillas.length) localStorage.setItem('educonta_projects_planillas', JSON.stringify(planillas));
            localStorage.removeItem('educonta_projects_v38');
        } catch(e) { console.error('Migration failed:', e); }
    }

    // Migración limpia de educonta_projects_hojas hacia la bóveda de Documentos (calculo)
    const hojasLegacy = localStorage.getItem('educonta_projects_hojas');
    if (hojasLegacy) {
        try {
            const hojasList = JSON.parse(hojasLegacy) || [];
            if (hojasList.length > 0) {
                const calculoList = JSON.parse(localStorage.getItem('educonta_projects_calculo')) || [];
                const calculoIds = new Set(calculoList.map(p => p.id));
                hojasList.forEach(p => {
                    if (p && !calculoIds.has(p.id)) {
                        p.type = 'calculo';
                        calculoList.push(p);
                    }
                });
                localStorage.setItem('educonta_projects_calculo', JSON.stringify(calculoList));
            }
            localStorage.removeItem('educonta_projects_hojas');
        } catch(e) {}
    }
})();

let defaultTab = localStorage.getItem('educonta_proyectos_active_tab') || 'libros';
if (defaultTab === 'hojas') {
    defaultTab = 'libros';
    localStorage.setItem('educonta_proyectos_active_tab', 'libros');
}
window.currentModelTab = defaultTab;
window.projects = JSON.parse(localStorage.getItem(getProjectsStorageKey(defaultTab))) || [];
window.syncedProjectIds = new Set(JSON.parse(localStorage.getItem('educonta_synced_ids')) || []);
window.proyecto_actual = null;
window.projectCounter = parseInt(localStorage.getItem('educonta_project_counter')) || 0;
window.editingProjectId = null;
window.isUserLoggedIn = false;

// === Inicialización de la Vista ===
const runInitApp = () => {
    if(typeof window.initApp === 'function') {
        window.initApp();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInitApp);
} else {
    setTimeout(runInitApp, 10);
}
    
    // Cierra los menús desplegables al hacer clic fuera de ellos
    document.addEventListener('click', (e) => {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));

        // Cierra el panel del catálogo si se hace clic fuera del selector
        const selectorWrap = document.querySelector('.catalog-selector-wrap');
        if (selectorWrap && !selectorWrap.contains(e.target)) {
            const panel = document.getElementById('catalog-options-panel');
            const btn   = document.getElementById('catalog-current-btn');
            if (panel) panel.classList.remove('open');
            if (btn)   btn.classList.remove('open');
        }
    });

// === Control de Menú de Tarjetas ===
window.toggleProjMenu = function(id) {
    const menus = document.querySelectorAll('.dropdown-menu');
    menus.forEach(m => { if (m.id !== 'menu-' + id) m.classList.remove('show'); });
    const m = document.getElementById('menu-' + id);
    if (m) m.classList.toggle('show');
};
window.updateCloudIndicatorUI = function(state, detail = "") {
    const cloudInd = document.getElementById('cloud-indicator');
    if (!cloudInd) return;
    
    // Si no hay internet, forzar offline
    if (!navigator.onLine && state !== 'offline') {
        state = 'offline';
    }

    cloudInd.classList.remove('hidden');
    cloudInd.classList.add('flex');
    
    const icon = cloudInd.querySelector('i');
    const span = cloudInd.querySelector('span');
    
    if (state === 'syncing') {
        cloudInd.className = "cursor-pointer flex items-center gap-2 px-3.5 py-1.5 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-full text-xs font-bold border border-sky-100 dark:border-sky-900/50 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95";
        if (icon) icon.className = "fas fa-spinner fa-spin";
        if (span) span.textContent = "Sincronizando...";
    } else if (state === 'success' || (state === 'online' && window.isUserLoggedIn)) {
        cloudInd.className = "cursor-pointer flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-900/50 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95";
        if (icon) icon.className = "fas fa-cloud-check";
        if (span) span.textContent = "Sincronizado";
    } else if (state === 'offline') {
        cloudInd.className = "cursor-pointer flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-100 dark:border-amber-900/50 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95";
        if (icon) icon.className = "fas fa-wifi-slash";
        if (span) span.textContent = "Sin conexión (Local)";
    } else if (state === 'local' || (!window.isUserLoggedIn && (state === 'idle' || state === 'online'))) {
        cloudInd.className = "cursor-pointer flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95";
        if (icon) icon.className = "fas fa-hdd";
        if (span) span.textContent = "Modo Local";
    } else if (state === 'error') {
        cloudInd.className = "cursor-pointer flex items-center gap-2 px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold border border-rose-100 dark:border-rose-900/50 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95";
        if (icon) icon.className = "fas fa-exclamation-triangle";
        const shortDetail = detail && detail.length > 20 ? detail.substring(0, 17) + "..." : detail;
        if (span) span.textContent = shortDetail ? `Error: ${shortDetail}` : "Error Nube";
    }
};

window.triggerManualSync = async function() {
    if (!navigator.onLine) {
        if (typeof window.showSyncToast === 'function') {
            window.showSyncToast('offline');
        }
        updateCloudIndicatorUI('offline');
        return;
    }
    
    if (typeof window.showSyncToast === 'function') {
        window.showSyncToast('syncing');
    }
    updateCloudIndicatorUI('syncing');
    
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            await fetchProjectsFromCloud();
            if (typeof window.showSyncToast === 'function') {
                window.showSyncToast('success');
            }
            updateCloudIndicatorUI('success');
        } else {
            throw new Error("No hay sesión activa");
        }
    } catch (e) {
        console.error(e);
        const errMsg = e.message || e.error_description || String(e);
        if (typeof window.showSyncToast === 'function') {
            window.showSyncToast('error', errMsg);
        }
        updateCloudIndicatorUI('error', errMsg);
    }
};

window.syncAllLocalProjectsToCloud = async function(session, onlyProjects = null) {
    if (typeof isAuditMode !== 'undefined' && isAuditMode) return;
    if (window.isAuditMode) return;
    if (sessionStorage.getItem('educonta_audit_active') === 'true') return;

    if (!session && typeof supabaseClient !== 'undefined') {
        try {
            const { data } = await supabaseClient.auth.getSession();
            session = data?.session || null;
        } catch (_) {}
    }
    if (!session || !session.user) return;
    if (!navigator.onLine) {
        updateCloudIndicatorUI('offline');
        return;
    }

    // Evitar carreras asíncronas o duplicación por sincronizaciones simultáneas
    if (window._isSyncAllProjsRunning) return;
    window._isSyncAllProjsRunning = true;

    try {
        const b = JSON.parse(localStorage.getItem('educonta_projects_libros')) || [];
        const k = JSON.parse(localStorage.getItem('educonta_projects_kardex')) || [];
        const p = JSON.parse(localStorage.getItem('educonta_projects_planillas')) || [];
        const t = JSON.parse(localStorage.getItem('educonta_projects_tributario')) || [];
        const c = JSON.parse(localStorage.getItem('educonta_projects_costos')) || [];
        const cj = JSON.parse(localStorage.getItem('educonta_projects_caja')) || [];
        const f = JSON.parse(localStorage.getItem('educonta_projects_finanzas')) || [];
        
        // Inyectar / normalizar tipos explícitos y guardar cambios en local
        b.forEach(proj => { if (proj) proj.type = 'libros'; });
        k.forEach(proj => { if (proj) proj.type = 'kardex'; });
        p.forEach(proj => { if (proj) proj.type = 'planillas'; });
        t.forEach(proj => { if (proj) proj.type = 'tributario'; });
        c.forEach(proj => { if (proj) proj.type = 'costos'; });
        cj.forEach(proj => { if (proj) proj.type = 'caja'; });
        f.forEach(proj => { if (proj) proj.type = 'finanzas'; });
        localStorage.setItem('educonta_projects_libros', JSON.stringify(b));
        localStorage.setItem('educonta_projects_kardex', JSON.stringify(k));
        localStorage.setItem('educonta_projects_planillas', JSON.stringify(p));
        localStorage.setItem('educonta_projects_tributario', JSON.stringify(t));
        localStorage.setItem('educonta_projects_costos', JSON.stringify(c));
        localStorage.setItem('educonta_projects_caja', JSON.stringify(cj));
        localStorage.setItem('educonta_projects_finanzas', JSON.stringify(f));

        const allLocal = [...b, ...k, ...p, ...t, ...c, ...cj, ...f];
        const listToSync = Array.isArray(onlyProjects) ? onlyProjects : allLocal;
        if (listToSync.length === 0) {
            window._isSyncAllProjsRunning = false;
            return;
        }

        const userEmail = (session.user.email || '').toLowerCase().trim();
        const adminEmail = (window.ADMIN_EMAIL || 'lopezosmin2021@gmail.com').toLowerCase().trim();
        const isAdmin = (userEmail && userEmail === adminEmail) || (session.user.app_metadata?.role === 'admin');

        updateCloudIndicatorUI('syncing');
        if (typeof window.showSyncToast === 'function') {
            window.showSyncToast('syncing');
        }

        let syncedCount = 0;
        let lastError = null;

        for (const proj of listToSync) {
            if (!proj || !proj.id) continue;

            // Si el proyecto pertenece a otra cuenta y NO soy admin ni colaborador, omitir pacíficamente
            const isOwn = !proj.owner_id || proj.owner_id === session.user.id;
            const isCollab = Array.isArray(proj.shared_with) && proj.shared_with.some(u => 
                (typeof u === 'string' ? u === session.user.id : (u?.uid === session.user.id || u?.id === session.user.id))
            );

            if (!isOwn && !isCollab && !isAdmin) {
                console.log("[Proyectos] Omitiendo proyecto ajeno para evitar conflictos de cuenta:", proj.id);
                continue;
            }

            try {
                await syncCurrentProjectWithSupabase(proj, session.user.id, true);
                syncedCount++;
            } catch (itemErr) {
                console.warn("[Proyectos] Advertencia al sincronizar proyecto individual " + proj.id + ":", itemErr);
                if (itemErr?.message?.includes("Acceso denegado")) {
                    continue;
                }
                lastError = itemErr;
            }
        }

        const pm = document.getElementById('master-screen');
        if (!pm || pm.classList.contains('hidden')) {
            renderProjectGrid();
        }

        if (lastError && syncedCount === 0) {
            throw lastError;
        }

        updateCloudIndicatorUI('success');
        if (typeof window.showSyncToast === 'function') {
            window.showSyncToast('success');
        }
        if(typeof showSyncVerification === 'function') showSyncVerification();
    } catch (e) {
        console.error("Error global sync:", e);
        const errMsg = e.message || e.error_description || JSON.stringify(e);
        updateCloudIndicatorUI('error', errMsg);
        if (typeof window.showSyncToast === 'function') {
            window.showSyncToast('error', errMsg);
        }
    } finally {
        window._isSyncAllProjsRunning = false;
    }
}

window.fetchProjectsFromCloud = async function() {
            if (typeof isAuditMode !== 'undefined' && isAuditMode) return false;
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (!session) {
                    window.isUserLoggedIn = false;
                    return false;
                }
                
                const wasLoggedOut = !window.isUserLoggedIn;
                window.isUserLoggedIn = true;
                window._educonta_has_active_session = true;
                try { sessionStorage.setItem('educonta_has_active_session', 'true'); } catch(e) {}
                if (wasLoggedOut && typeof renderProjectGrid === 'function') {
                    renderProjectGrid(); // Actualizar insignias al verificar sesión
                }

                const ownPromise = supabaseClient
                    .from('proyectos_contables')
                    .select('data')
                    .eq('user_id', session.user.id)
                    .eq('estado', 'activo');

                const sharedPromise = supabaseClient
                    .from('proyectos_contables')
                    .select('data')
                    .contains('data', { shared_with: [session.user.id] })
                    .eq('estado', 'activo');

                const [ownRes, sharedRes] = await Promise.all([ownPromise, sharedPromise]);
                if (ownRes.error) throw ownRes.error;
                if (sharedRes.error) throw sharedRes.error;

                const rawData = [...(ownRes.data || []), ...(sharedRes.data || [])];
                const uniqueMap = new Map();
                rawData.forEach(row => {
                    if (row && row.data && row.data.id) {
                        uniqueMap.set(row.data.id, row);
                    }
                });
                const data = Array.from(uniqueMap.values());

                // Load all local projects from separate vaults
                const booksLocal = JSON.parse(localStorage.getItem('educonta_projects_libros')) || [];
                const kardexLocal = JSON.parse(localStorage.getItem('educonta_projects_kardex')) || [];
                const planillasLocal = JSON.parse(localStorage.getItem('educonta_projects_planillas')) || [];
                const tributarioLocal = JSON.parse(localStorage.getItem('educonta_projects_tributario')) || [];
                const costosLocal = JSON.parse(localStorage.getItem('educonta_projects_costos')) || [];
                const cajaLocal = JSON.parse(localStorage.getItem('educonta_projects_caja')) || [];
                const finanzasLocal = JSON.parse(localStorage.getItem('educonta_projects_finanzas')) || [];

                const previouslySyncedIds = new Set(syncedProjectIds);
                const dirtyLocalProjects = [];

                const userEmail = (session.user.email || '').toLowerCase().trim();
                const adminEmail = (window.ADMIN_EMAIL || 'lopezosmin2021@gmail.com').toLowerCase().trim();
                const isAdmin = (userEmail && userEmail === adminEmail) || (session.user.app_metadata?.role === 'admin');

                const helperMerge = (key, localList, cloudList) => {
                    const cloudMap = new Map();
                    cloudList.forEach(p => { if (p && p.id) cloudMap.set(p.id, p); });

                    const combinedMap = new Map();
                    localList.forEach(p => {
                        if (!p || !p.id) return;
                        const cloudProj = cloudMap.get(p.id);
                        if (!cloudProj) {
                            // Si ya estaba sincronizado antes y ya no viene activo de la nube, fue archivado/eliminado en otro dispositivo
                            if (previouslySyncedIds.has(p.id)) {
                                syncedProjectIds.delete(p.id);
                                return;
                            }
                            combinedMap.set(p.id, p);
                            const isOwn = !p.owner_id || p.owner_id === session.user.id;
                            if (isOwn || isAdmin) {
                                dirtyLocalProjects.push(p);
                            }
                        } else {
                            const localTime = Date.parse(p.updatedAt) || 0;
                            const cloudTime = Date.parse(cloudProj.updatedAt) || 0;
                            if (localTime > cloudTime) {
                                combinedMap.set(p.id, p);
                                const isOwn = !p.owner_id || p.owner_id === session.user.id;
                                if (isOwn || isAdmin) {
                                    dirtyLocalProjects.push(p);
                                }
                            } else {
                                combinedMap.set(p.id, cloudProj);
                            }
                        }
                    });
                    cloudList.forEach(p => {
                        if (p && p.id && !combinedMap.has(p.id)) {
                            combinedMap.set(p.id, p);
                        }
                    });
                    const merged = Array.from(combinedMap.values());
                    merged.sort((a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0));
                    localStorage.setItem(key, JSON.stringify(merged));
                    return merged;
                };

                const DOCUMENT_TYPES = new Set(['textos', 'calculo', 'lienzos', 'diagramas', 'hojas']);

                if (Array.isArray(data)) {
                    const tempProjects = [];

                    data.forEach(row => {
                        const p = row.data;
                        if (!p || !p.id) return;

                        // Si explícitamente pertenece a Documentos, lo ignoramos en la vista de Proyectos
                        if (DOCUMENT_TYPES.has(p.type)) return;

                        // Si no tiene tipo, inferir cuidadosamente
                        if (!p.type) {
                            // Si tiene estructura típica de documentos, ignorarlo
                            if (p.pages || p.shapes || p.nodes || p.connections || p.workbook) {
                                return;
                            }
                            if (p.sheets && p.sheets.length > 0 && p.sheets[0].blocks !== undefined) {
                                return; // Es cálculo/hoja
                            }

                            if (planillasLocal.some(lp => lp.id === p.id)) {
                                p.type = 'planillas';
                            } else if (kardexLocal.some(lp => lp.id === p.id)) {
                                p.type = 'kardex';
                            } else if (cajaLocal.some(lp => lp.id === p.id)) {
                                p.type = 'caja';
                            } else if (finanzasLocal.some(lp => lp.id === p.id)) {
                                p.type = 'finanzas';
                            } else if (costosLocal.some(lp => lp.id === p.id)) {
                                p.type = 'costos';
                            } else if (tributarioLocal.some(lp => lp.id === p.id)) {
                                p.type = 'tributario';
                            } else if (booksLocal.some(lp => lp.id === p.id)) {
                                p.type = 'libros';
                            } else if (p.sheets && p.sheets.length > 0) {
                                const firstSheet = p.sheets[0];
                                if (firstSheet.employees || firstSheet.sectionConfig) {
                                    p.type = 'planillas';
                                } else if (firstSheet.entries !== undefined || firstSheet.method !== undefined) {
                                    p.type = 'kardex';
                                } else {
                                    p.type = 'libros';
                                }
                            } else if (p.movimientos || p.saldoInicial !== undefined) {
                                p.type = 'caja';
                            } else if (p.razones || p.estadosFinancieros) {
                                p.type = 'finanzas';
                            } else if (p.ordenes || p.elementosCosto) {
                                p.type = 'costos';
                            } else if (p.tipoImpuesto || p.declaracion) {
                                p.type = 'tributario';
                            } else {
                                p.type = 'libros';
                            }
                        }

                        syncedProjectIds.add(p.id);
                        tempProjects.push(p);
                    });

                    // Separate by type
                    const booksCloud = tempProjects.filter(p => p.type === 'libros');
                    const kardexCloud = tempProjects.filter(p => p.type === 'kardex');
                    const planillasCloud = tempProjects.filter(p => p.type === 'planillas');
                    const tributarioCloud = tempProjects.filter(p => p.type === 'tributario');
                    const costosCloud = tempProjects.filter(p => p.type === 'costos');
                    const cajaCloud = tempProjects.filter(p => p.type === 'caja');
                    const finanzasCloud = tempProjects.filter(p => p.type === 'finanzas');

                    // Merge and save each vault
                    const mergedBooks = helperMerge('educonta_projects_libros', booksLocal, booksCloud);
                    const mergedKardex = helperMerge('educonta_projects_kardex', kardexLocal, kardexCloud);
                    const mergedPlanillas = helperMerge('educonta_projects_planillas', planillasLocal, planillasCloud);
                    const mergedTributario = helperMerge('educonta_projects_tributario', tributarioLocal, tributarioCloud);
                    const mergedCostos = helperMerge('educonta_projects_costos', costosLocal, costosCloud);
                    const mergedCaja = helperMerge('educonta_projects_caja', cajaLocal, cajaCloud);
                    const mergedFinanzas = helperMerge('educonta_projects_finanzas', finanzasLocal, finanzasCloud);

                    localStorage.setItem('educonta_synced_ids', JSON.stringify(Array.from(syncedProjectIds)));

                    // Assign window.projects based on current model tab
                    const activeModel = window.currentModelTab || 'libros';
                    if (activeModel === 'kardex') window.projects = mergedKardex;
                    else if (activeModel === 'planillas') window.projects = mergedPlanillas;
                    else if (activeModel === 'tributario') window.projects = mergedTributario;
                    else if (activeModel === 'costos') window.projects = mergedCostos;
                    else if (activeModel === 'caja') window.projects = mergedCaja;
                    else if (activeModel === 'finanzas') window.projects = mergedFinanzas;
                    else window.projects = mergedBooks;

                    // Solo subir a la nube proyectos locales nuevos o con updatedAt más reciente que la nube
                    if (dirtyLocalProjects.length > 0) {
                        syncAllLocalProjectsToCloud(session, dirtyLocalProjects);
                    }

                    updateCloudIndicatorUI('success');
                    return true;
                }
            } catch (err) {
                console.error("Error cargando de Supabase:", err);
                const errMsg = err.message || err.error_description || JSON.stringify(err);
                updateCloudIndicatorUI('error', errMsg);
            }
            return false;
        }

window.initApp = async function() {
    // 1. CARGA LOCAL PRIORITARIA E INSTANTÁNEA (Evita bloqueos de red y parpadeos)
    const savedTab = localStorage.getItem('educonta_proyectos_active_tab') || 'libros';
    const savedIdx = ['libros', 'kardex', 'planillas', 'tributario', 'costos', 'caja', 'finanzas'].indexOf(savedTab);
    currentIndex = savedIdx !== -1 ? savedIdx : 0;
    switchModelTab(savedTab, false);
    
    // 2. CARGAS ASÍNCRONAS EN SEGUNDO PLANO (No bloquean el hilo principal)
    // Cargar Catálogo Maestro sin bloquear
    if (typeof loadCatalogoMaestro === 'function') {
        loadCatalogoMaestro().catch(e => console.error("Error cargando catálogo maestro:", e));
    }

    // Sincronizar con Supabase en segundo plano sin esperar (non-blocking)
    fetchProjectsFromCloud().then((updated) => {
        if (updated) {
            // Si hay datos nuevos en la nube, re-renderizamos la grilla
            renderProjectGrid();
        }
    }).catch(e => console.error("Error sincronizando de la nube en segundo plano:", e));

    const inputName = document.getElementById('proj-input-name');
    if (inputName) {
        inputName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveProjectFromModal();
        });
    }
};

window.saveProjectsToLocal = function() {
    if (typeof isAuditMode !== 'undefined' && isAuditMode) return;
    // BACKUP LOCAL EN SU PROPIA BÓVEDA
    localStorage.setItem(getProjectsStorageKey(window.currentModelTab), JSON.stringify(projects));

    // INTENTO DE SINCRONIZACIÓN WEB SUPABASE (DEBOUNCED)
    if (window._syncDebounceTimeout) clearTimeout(window._syncDebounceTimeout);
    
    // Feedback visual de guardado local inmediato
    updateCloudIndicatorUI('syncing', 'Guardando local...');
    
    window._syncDebounceTimeout = setTimeout(async () => {
        try {
            if(typeof supabaseClient === 'undefined') return;
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session && typeof currentProjectId !== 'undefined' && currentProjectId) {
                updateCloudIndicatorUI('syncing');
                if (typeof window.showSyncToast === 'function') {
                    window.showSyncToast('syncing');
                }
                // Activar animación de la viñeta de sincronización
                if(typeof setSyncAnimating === 'function') setSyncAnimating(true);

                const currentProj = projects.find(p => p.id === currentProjectId);
                if (currentProj) {
                    try {
                        // Metodo seguro Upsert-like basado en JSONB
                        await syncCurrentProjectWithSupabase(currentProj, session.user.id);

                        updateCloudIndicatorUI('success');
                        if (typeof window.showSyncToast === 'function') {
                            window.showSyncToast('success');
                        }
                        if(typeof setSyncAnimating === 'function') setSyncAnimating(false);
                    } catch (err) {
                        const errMsg = err.message || err.error_description || JSON.stringify(err);
                        updateCloudIndicatorUI('error', errMsg);
                        if (typeof window.showSyncToast === 'function') {
                            window.showSyncToast('error', errMsg);
                        }
                        if(typeof setSyncAnimating === 'function') setSyncAnimating(false);
                        console.error('Error Sync:', err);
                    }
                } else {
                    if(typeof setSyncAnimating === 'function') setSyncAnimating(false);
                }
            }
        } catch (e) { 
            if(typeof setSyncAnimating === 'function') setSyncAnimating(false); 
            console.error('Error Auth Session:', e); 
        }
    }, 3000);
}



window.forceSave = function() {
            if (typeof isAuditMode !== 'undefined' && isAuditMode) return;
            if(typeof saveHistory === 'function') saveHistory();
            const btn = document.getElementById('btn-force-save');
            if(!btn) return;
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> <span class="inline">Guardado</span>';
            btn.classList.replace('bg-emerald-500', 'bg-emerald-600');

            const ind = document.getElementById('save-indicator');
            if(ind) {
                ind.classList.remove('hidden');
                ind.classList.add('flex');
            }

            // Activar animación de la viñeta de sincronización
            if(typeof setSyncAnimating === 'function') setSyncAnimating(true);

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.replace('bg-emerald-600', 'bg-emerald-500');
                if(ind) {
                    ind.classList.add('hidden');
                    ind.classList.remove('flex');
                }
                if(typeof setSyncAnimating === 'function') setSyncAnimating(false);
            }, 2000);
        }

// === Estado de Pestaña de Modelo Activa y Animación de Burbuja ===
const PROYECTO_MODELS = ['libros', 'kardex', 'planillas', 'tributario', 'costos', 'caja', 'finanzas'];

let currentIndex = 0;
let pillAnimTimeout = null;

function moveVerticalTab(btn, newIndex, animate = true) {
    const pill = document.getElementById('sidebar-active-pill');
    if (!pill || !btn) return;

    if (pillAnimTimeout) {
        clearTimeout(pillAnimTimeout);
        pillAnimTimeout = null;
    }

    if (btn.offsetHeight === 0) {
        requestAnimationFrame(() => moveVerticalTab(btn, newIndex, animate));
        return;
    }

    const btnHeight = btn.offsetHeight || 84;
    const targetTop = (btn.offsetHeight > 0) ? btn.offsetTop : (newIndex * 100);

    if (!animate) {
        pill.style.transition = 'none';
        pill.style.height = `${btnHeight}px`;
        pill.style.transform = `translateY(${targetTop}px) scaleY(1) scaleX(1)`;
        pill.style.opacity = '1';
        void pill.offsetWidth;
        requestAnimationFrame(() => {
            pill.style.transition = '';
        });
        currentIndex = newIndex;
        return;
    }

    pill.style.opacity = '1';
    const distance = Math.abs(newIndex - currentIndex);
    const stretch = 1 + Math.min(distance * 0.15, 0.4);

    pill.style.height = `${btnHeight}px`;

    // Glow pulsante sin interferir en transform
    pill.classList.remove('pill-bounce');
    void pill.offsetWidth;
    pill.classList.add('pill-bounce');

    if (distance === 0) {
        pill.style.transform = `translateY(${targetTop}px) scaleY(1) scaleX(1)`;
        currentIndex = newIndex;
        return;
    }

    pill.style.transform = `translateY(${targetTop}px) scaleY(${stretch}) scaleX(0.92)`;

    pillAnimTimeout = setTimeout(() => {
        pill.style.transform = `translateY(${targetTop}px) scaleY(1) scaleX(1)`;
        pillAnimTimeout = null;
    }, 135);

    currentIndex = newIndex;
}

window.addEventListener('resize', () => {
    const activeBtn = document.getElementById(`tab-model-${window.currentModelTab}`);
    if (activeBtn && activeBtn.offsetHeight > 0) {
        const pill = document.getElementById('sidebar-active-pill');
        if (pill) {
            pill.style.transition = 'none';
            pill.style.height = `${activeBtn.offsetHeight}px`;
            pill.style.transform = `translateY(${activeBtn.offsetTop}px) scaleY(1) scaleX(1)`;
            void pill.offsetWidth;
            requestAnimationFrame(() => {
                pill.style.transition = '';
            });
        }
    }
});

if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
        const activeBtn = document.getElementById(`tab-model-${window.currentModelTab}`);
        if (activeBtn) {
            const idx = PROYECTO_MODELS.indexOf(window.currentModelTab);
            moveVerticalTab(activeBtn, idx !== -1 ? idx : 0, false);
        }
    });
}

window.switchModelTab = function(model, animate = true) {
    window.currentModelTab = model;
    localStorage.setItem('educonta_proyectos_active_tab', model);
    
    // Cargar proyectos de la bóveda correspondiente
    const key = getProjectsStorageKey(model);
    window.projects = JSON.parse(localStorage.getItem(key)) || [];
    
    // Desktop sidebar buttons
    let activeBtn = null;
    let newIndex = PROYECTO_MODELS.indexOf(model);
    if (newIndex === -1) newIndex = 0;

    document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
        const isActive = btn.id === `tab-model-${model}`;
        btn.classList.toggle('active-tab', isActive);
        if (isActive) {
            activeBtn = btn;
            if (btn.dataset.idx !== undefined) {
                newIndex = parseInt(btn.dataset.idx, 10);
            }
        }
    });
    
    // Mover la píldora vertical con efecto elástico
    if (activeBtn) {
        moveVerticalTab(activeBtn, newIndex, animate);
    }

    // Mobile panel buttons
    ['libros', 'kardex', 'planillas', 'tributario', 'costos', 'caja', 'finanzas'].forEach(m => {
        const btnMobile = document.getElementById(`tab-model-${m}-mobile`);
        if (btnMobile) {
            if (m === model) {
                btnMobile.className = "flex-1 min-w-[120px] px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 font-bold text-xs flex items-center gap-2";
            } else {
                btnMobile.className = "flex-1 min-w-[120px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-bold text-xs flex items-center gap-2";
            }
        }
    });

    renderProjectGrid();
};

window.selectProjectModel = function(model) {
    const hiddenInput = document.getElementById('proj-input-type');
    if (hiddenInput) hiddenInput.value = model;

    // Visual selection classes
    document.querySelectorAll('.model-opt-card').forEach(el => {
        const isSelected = el.id === `model-opt-${model}`;
        el.classList.toggle('selected', isSelected);
        if (isSelected) {
            el.className = "model-opt-card p-3 rounded-2xl border-2 border-sky-500 bg-sky-50/50 cursor-pointer transition-all flex items-center gap-3 selected";
        } else {
            el.className = "model-opt-card p-3 rounded-2xl border-2 border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all flex items-center gap-3";
        }

        const check = el.querySelector('.model-check-circle');
        if (check) {
            if (isSelected) {
                check.className = "model-check-circle w-4 h-4 rounded-full border border-sky-500 bg-sky-500 flex items-center justify-center shrink-0";
                check.innerHTML = '<i class="fas fa-check text-[8px] text-white"></i>';
            } else {
                check.className = "model-check-circle w-4 h-4 rounded-full border border-slate-300 bg-white flex items-center justify-center shrink-0";
                check.innerHTML = '';
            }
        }
    });

    // Hide/Show Catalog Custom selector container
    const catContainer = document.getElementById('catalog-selector-container');
    if (catContainer) {
        catContainer.style.display = model === 'libros' ? 'block' : 'none';
    }
};

window.renderProjectGrid = function() {
            const grid = document.getElementById('project-grid');
            const empty = document.getElementById('empty-projects');
            if (!grid) return;
            grid.innerHTML = '';

            // Filtrar proyectos por tipo según la pestaña activa (libros, kardex o planillas)
            const activeModel = window.currentModelTab || 'libros';
            const filteredProjects = projects.filter(p => {
                const pType = p.type || 'libros';
                return pType === activeModel;
            });

            if (filteredProjects.length === 0) {
                if (empty) empty.classList.remove('hidden');
                return;
            }
            if (empty) empty.classList.add('hidden');

            const fragment = document.createDocumentFragment();
            filteredProjects.forEach(p => {
                const card = document.createElement('div');
                const pType = p.type || 'libros';
                
                let bloomClass = 'btn-bloom-sky';
                if (pType === 'kardex') {
                    bloomClass = 'btn-bloom-orange';
                } else if (pType === 'planillas') {
                    bloomClass = 'btn-bloom-indigo';
                } else if (pType === 'tributario') {
                    bloomClass = 'btn-bloom-indigo';
                } else if (pType === 'costos') {
                    bloomClass = 'btn-bloom-amber';
                } else if (pType === 'caja') {
                    bloomClass = 'btn-bloom-amber';
                } else if (pType === 'finanzas') {
                    bloomClass = 'btn-bloom-emerald';
                } else if (pType === 'hojas') {
                    bloomClass = 'btn-bloom-emerald';
                }

                card.className = 'project-card flex flex-col justify-between';
                card.id = 'card-' + p.id;
                if (window.selectedCards.has(p.id)) card.classList.add('multi-selected');
                card.onmousedown = () => handleCardPressStart(p.id);
                card.onmouseup = () => handleCardPressEnd();
                card.onmouseleave = () => handleCardPressEnd();
                card.ontouchstart = () => handleCardPressStart(p.id);
                card.ontouchend = () => handleCardPressEnd();
                card.ontouchcancel = () => handleCardPressEnd();
                
                card.onclick = (e) => {
                    if (window.justEnteredMultiSelect) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.justEnteredMultiSelect = false;
                        return;
                    }
                    if (window.isMultiSelectMode) {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleCardSelection(p.id);
                    } else {
                        openProject(p.id);
                    }
                };

                // Determinar el icono y color según el tipo de proyecto
                let iconClass = 'fa-file-invoice';
                let iconColor = 'text-sky-500';
                let iconBg = 'bg-sky-50';

                if (pType === 'kardex') {
                    iconClass = 'fa-boxes-stacked';
                    iconColor = 'text-amber-500';
                    iconBg = 'bg-amber-50';
                } else if (pType === 'planillas') {
                    iconClass = 'fa-users-gear';
                    iconColor = 'text-indigo-500';
                    iconBg = 'bg-indigo-50';
                } else if (pType === 'tributario') {
                    iconClass = 'fa-file-invoice-dollar';
                    iconColor = 'text-indigo-500';
                    iconBg = 'bg-indigo-50';
                } else if (pType === 'costos') {
                    iconClass = 'fa-industry';
                    iconColor = 'text-amber-500';
                    iconBg = 'bg-amber-50';
                } else if (pType === 'caja') {
                    iconClass = 'fa-cash-register';
                    iconColor = 'text-amber-500';
                    iconBg = 'bg-amber-50';
                } else if (pType === 'finanzas') {
                    iconClass = 'fa-chart-line';
                    iconColor = 'text-emerald-500';
                    iconBg = 'bg-emerald-50';
                } else if (pType === 'hojas') {
                    iconClass = 'fa-file-invoice-dollar';
                    iconColor = 'text-emerald-500';
                    iconBg = 'bg-emerald-50';
                }

                const safeId = window.EduSec ? EduSec.escapeHtml(p.id) : String(p.id ?? '').replace(/[&<>"']/g, '');
                const jsId = window.EduSec ? EduSec.jsArg(p.id) : `'${String(p.id ?? '').replace(/['"\\]/g, '')}'`;

                card.innerHTML = `
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 rounded-[36px] flex items-center justify-center project-icon-ring ${bloomClass} ${iconColor}">
                            <i class="fas ${iconClass} text-xl"></i>
                        </div>
                        <div class="relative">
                            <button onclick="event.stopPropagation(); toggleProjMenu(${jsId})" aria-label="Opciones del proyecto" class="text-slate-300 hover:text-slate-600 transition-colors p-2">
                                    <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div id="menu-${safeId}" class="dropdown-menu">
                                <div class="dropdown-item" onclick="event.stopPropagation(); duplicateProject(${jsId})"><i class="far fa-copy"></i> Duplicar</div>
                                <div class="dropdown-item" onclick="event.stopPropagation(); openRenameModal(${jsId})"><i class="far fa-edit"></i> Renombrar</div>
                                <div class="dropdown-item text-rose-500 hover:text-rose-600" onclick="event.stopPropagation(); deleteProject(${jsId})"><i class="far fa-trash-alt"></i> Borrar</div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-slate-800 text-lg mb-1 truncate">${window.EduSec ? EduSec.escapeHtml(p.name) : String(p.name ?? '').replace(/[&<>"']/g, '')}</h4>
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-[9px] font-bold text-slate-400 uppercase">${p.sheets ? p.sheets.length : 0} Hojas</span>
                            <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span class="text-[9px] font-bold text-slate-400 uppercase">${new Date(p.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div class="flex gap-2 mt-2">
                            ${(!window.isUserLoggedIn) ?
                                '<span class="flex items-center gap-1 text-[9px] font-bold text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-[36px] project-sync-badge bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" title="Guardado en este equipo"><i class="fas fa-hdd"></i> Local</span>' :
                                (!navigator.onLine) ?
                                '<span class="flex items-center gap-1 text-[9px] font-bold text-amber-600 px-2.5 py-1 rounded-[36px] project-sync-badge btn-bloom-orange" title="Guardado local (Sin conexión)"><i class="fas fa-wifi-slash"></i> Offline</span>' :
                                (syncedProjectIds.has(p.id)) ?
                                '<span class="flex items-center gap-1 text-[9px] font-bold text-emerald-600 px-2.5 py-1 rounded-[36px] project-sync-badge btn-bloom-emerald" title="Sincronizado en la nube"><i class="fas fa-cloud-check"></i> Sincronizado</span>' :
                                '<span class="flex items-center gap-1 text-[9px] font-bold text-amber-600 px-2.5 py-1 rounded-[36px] project-sync-badge btn-bloom-orange" title="Guardado local (Pendiente de subir)"><i class="fas fa-cloud-arrow-up"></i> Pendiente</span>'}
                        </div>
                    </div>
                `;
                fragment.appendChild(card);
            });
            grid.appendChild(fragment);
        }

window.openNewProjectModal = function() {
            editingProjectId = null;
            document.getElementById('proj-modal-title').innerText = "Nuevo Proyecto";
            document.getElementById('proj-input-name').value = "";
            document.getElementById('proj-input-name').placeholder = `Proyecto ${projects.length + 1}`;
            
            // Preseleccionar la pestaña de modelo activa en el modal
            const activeModel = window.currentModelTab || 'libros';
            selectProjectModel(activeModel);

            // Configurar textos y visibilidad específicos de cada pestaña (Libros, Kardex, Planillas)
            const label = document.getElementById('proj-modal-entity-label');
            const selectorBlock = document.getElementById('project-model-selector-block');
            
            // Ocultar selector en todas las pestañas por redundancia
            if (selectorBlock) selectorBlock.style.display = "none";
            
            if (activeModel === 'planillas') {
                if (label) label.innerText = "Nombre de la Planilla";
            } else if (activeModel === 'kardex') {
                if (label) label.innerText = "Nombre del Kardex";
            } else if (activeModel === 'tributario') {
                if (label) label.innerText = "Nombre de la Empresa / Declaración";
            } else if (activeModel === 'costos') {
                if (label) label.innerText = "Nombre de la Empresa Fabril";
            } else if (activeModel === 'caja') {
                if (label) label.innerText = "Nombre de la Caja / Fondo Fijo";
            } else if (activeModel === 'finanzas') {
                if (label) label.innerText = "Nombre del Proyecto Financiero / Crédito";
            } else {
                if (label) label.innerText = "Nombre de la Entidad";
            }

            // Ocultar las opciones que no corresponden a la pestaña activa
            ['libros', 'kardex', 'planillas', 'tributario', 'costos', 'caja', 'finanzas'].forEach(m => {
                const optCard = document.getElementById(`model-opt-${m}`);
                if (optCard) {
                    optCard.style.display = (m === activeModel) ? 'flex' : 'none';
                }
            });

            updateCatalogOptions(null, 'MAESTRO');
            
            // Forzar reflow para evitar que el navegador se salte la animacin CSS
            const modal = document.getElementById('project-modal');
            modal.style.display = 'flex';
            void modal.offsetWidth; // trigger reflow
            
            setTimeout(() => document.getElementById('proj-input-name').focus(), 100);
        }

window.closeProjectModal = function() { 
    const md = document.getElementById('project-modal');
    if(md) {
        md.classList.add('closing');
        setTimeout(() => {
            md.style.display = 'none';
            md.classList.remove('closing');
            
            // Colapsar panel de catálogo al cerrar
            const panel = document.getElementById('catalog-options-panel');
            const btn   = document.getElementById('catalog-current-btn');
            if (panel) panel.classList.remove('open');
            if (btn)   btn.classList.remove('open');
        }, 300);
    }
}

window.saveProjectFromModal = async function() {
    let name = document.getElementById('proj-input-name').value.trim();
    if (!name) name = `Proyecto ${projects.length + 1}`;

    let catalogo = document.getElementById('proj-input-catalogo').value;
    let type = document.getElementById('proj-input-type').value || 'libros';

    const isNew = !editingProjectId;
    let targetProjId = editingProjectId;

    if (editingProjectId) {
        const p = projects.find(proj => proj.id === editingProjectId);
        if (p) {
            p.name = name;
            p.catalogo = catalogo;
            p.type = type;
            p.updatedAt = new Date().toISOString();
        }
    } else {
        targetProjId = 'proj_' + Date.now();
        let initialData = {};
        if (type === 'tributario') {
            initialData = {
                ventasGravadas: 0, debitoFiscal: 0, ventasConsumidorFinal: 0, debitoConsumidorFinal: 0,
                totalDebito: 0, comprasGravadas: 0, creditoFiscal: 0, importaciones: 0, creditoImportaciones: 0,
                remanenteAnterior: 0, totalCredito: 0, impuestoDeterminado: 0, remanenteSiguiente: 0,
                retenciones1: 0, ivaPagar: 0, ingresosMes: 0, pagoCuenta: 0, totalPagarF07: 0,
                honorariosBase: 0, retencion10: 0, comprasIva1Base: 0, retencionIva1: 0, totalF14: 0,
                libroCompras: [], libroVentas: []
            };
        } else if (type === 'costos') {
            initialData = {
                iiMp: 0, comprasMp: 0, ifMp: 0, mpdUtilizada: 0,
                salariosMod: 0, cargasMod: 0, totalMod: 0,
                cifMat: 0, cifMoi: 0, cifEnergia: 0, cifDeprec: 0, totalCif: 0,
                costoIncurrido: 0, iiPp: 0, ifPp: 0, costoTerminados: 0,
                iiPt: 0, ifPt: 0, costoVendido: 0,
                ordenesTrabajo: [], prorrateosData: []
            };
        } else if (type === 'caja') {
            initialData = {
                empresa: '', custodio: '', fondoFijo: 0.00,
                fecha: new Date().toISOString().split('T')[0], hora: '',
                tipoArqueo: 'ordinario', efectivo: {}, docs: [],
                corte: {
                    cajaNum: 'Caja 01 - Principal', cajero: '', fondoApertura: 0,
                    ventasGravadas: 0, ivaDebito: 0, salidas: 0, efectivoReal: 0
                }
            };
        } else if (type === 'finanzas') {
            initialData = {
                prestamo: { monto: 0, tasa: 0, plazo: 0, sistema: 'frances', fecha: new Date().toISOString().split('T')[0], cuota: 0, totalInteres: 0, costoTotal: 0, schedule: [] },
                interes: { simple: { capital: 0, tasa: 0, tiempo: 0 }, compuesto: { capital: 0, tasa: 0, frecuencia: 12, plazo: 0 }, anualidad: { renta: 0, tasa: 0, periodos: 0 } },
                inversion: { inversionInicial: 0, tmar: 0, flujos: [] }
            };
        }
        projects.unshift({
            id: targetProjId, name: name, catalogo: catalogo, type: type,
            mode: 'practica',
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            sheets: [], bookCounter: 0,
            data: initialData
        });
    }

    // Save locally to its respective vault and render instantly
    localStorage.setItem(getProjectsStorageKey(type), JSON.stringify(projects));

    // Sync current view if editing the active project
    if (typeof currentProjectId !== 'undefined' && currentProjectId === targetProjId) {
        const currentProjName = document.getElementById('current-project-name');
        if(currentProjName) currentProjName.innerText = name;
        
        const cTag = document.getElementById('pill-catalog-tag');
        if (cTag) cTag.classList.add('hidden');

        // Forzar re-renderizado de la pestaña activa para aplicar nuevas reglas
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            const tabId = activeTab.id.replace('tab-', '');
            if (typeof switchTab === 'function') switchTab(tabId);
        }
    }

    renderProjectGrid();
    closeProjectModal();

    // Targeted fast sync for this specific project
    if (typeof isAuditMode === 'undefined' || !isAuditMode) {
        if(typeof supabaseClient !== 'undefined') {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session && targetProjId) {
                try {
                    const pToSync = projects.find(p => p.id === targetProjId);
                    if (pToSync) {
                        await syncCurrentProjectWithSupabase(pToSync, session.user.id, true);
                        renderProjectGrid(); // Update badge to "Sincronizado"
                    }
                } catch (e) {
                    console.error('Error in targeted sync:', e);
                }
            }
        }
    }

    if (isNew) {
        openProject(targetProjId);
    }
}

window.deleteProject = function(id) {
    if(typeof showModal === 'function') {
        showModal("Eliminar Proyecto", "¿Eliminar este proyecto permanentemente?", async () => {
            // Modo Soft Delete local
            projects = projects.filter(p => p.id !== id);
            if (window.syncedProjectIds) {
                window.syncedProjectIds.delete(id);
                localStorage.setItem('educonta_synced_ids', JSON.stringify(Array.from(window.syncedProjectIds)));
            }
            saveProjectsToLocal();
            renderProjectGrid();
            if(typeof closeModal === 'function') closeModal();

            // Soft Delete Nube
            if(typeof supabaseClient !== 'undefined') {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session && session.user) {
                    try {
                        // Cambiamos estado sin destruir JSON asegurando que busque por el ID dentro del JSON (data->>id)
                        await supabaseClient.from('proyectos_contables')
                            .update({ estado: 'archivado' })
                            .eq('data->>id', id)
                            .eq('user_id', session.user.id);
                    } catch (e) { console.error("Error archivando en BD:", e); }
                }
            }
        });
    } else {
        if(confirm("¿Eliminar este proyecto permanentemente?")) {
            projects = projects.filter(p => p.id !== id);
            if (window.syncedProjectIds) {
                window.syncedProjectIds.delete(id);
                localStorage.setItem('educonta_synced_ids', JSON.stringify(Array.from(window.syncedProjectIds)));
            }
            saveProjectsToLocal();
            renderProjectGrid();
        }
    }
}

window.duplicateProject = async function(id) {
    const p = projects.find(proj => proj.id === id);
    if (!p) return;
    const copy = JSON.parse(JSON.stringify(p));
    copy.id = 'proj_' + Date.now();
    copy.name += " (Copia)";
    copy.updatedAt = new Date().toISOString();
    delete copy.owner_id;
    delete copy.owner_email;
    delete copy.owner_name;
    copy.shared_with = [];
    projects.unshift(copy);

    const pType = copy.type || window.currentModelTab || 'libros';
    localStorage.setItem(getProjectsStorageKey(pType), JSON.stringify(projects));
    renderProjectGrid();

    if (typeof supabaseClient !== 'undefined' && (!window.isAuditMode)) {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session && typeof syncCurrentProjectWithSupabase === 'function') {
                await syncCurrentProjectWithSupabase(copy, session.user.id, true);
                renderProjectGrid();
            }
        } catch (e) {
            console.error("Error sincronizando copia de proyecto en la nube:", e);
        }
    }
};

window.openRenameModal = function(id) {
            editingProjectId = id;
            const p = projects.find(proj => proj.id === id);
            const pType = p.type || 'libros';
            document.getElementById('proj-modal-title').innerText = "Renombrar Proyecto";
            document.getElementById('proj-input-name').value = p.name;
            
            // Set type selector in rename modal
            selectProjectModel(pType);

            // Configurar textos y visibilidad específicos de cada tipo
            const label = document.getElementById('proj-modal-entity-label');
            const selectorBlock = document.getElementById('project-model-selector-block');
            
            // Ocultar selector en todas las pestañas por redundancia
            if (selectorBlock) selectorBlock.style.display = "none";
            
            if (pType === 'planillas') {
                if (label) label.innerText = "Nombre de la Planilla";
            } else if (pType === 'kardex') {
                if (label) label.innerText = "Nombre del Kardex";
            } else if (pType === 'tributario') {
                if (label) label.innerText = "Nombre de la Empresa / Declaración";
            } else if (pType === 'costos') {
                if (label) label.innerText = "Nombre de la Empresa Fabril";
            } else if (pType === 'caja') {
                if (label) label.innerText = "Nombre del Fondo / Caja";
            } else if (pType === 'finanzas') {
                if (label) label.innerText = "Nombre del Proyecto Financiero / Crédito";
            } else {
                if (label) label.innerText = "Nombre de la Entidad";
            }

            // Ocultar las opciones que no corresponden al tipo de proyecto que se está renombrando
            ['libros', 'kardex', 'planillas', 'tributario', 'costos', 'caja', 'finanzas'].forEach(m => {
                const optCard = document.getElementById(`model-opt-${m}`);
                if (optCard) {
                    optCard.style.display = (m === pType) ? 'flex' : 'none';
                }
            });

            updateCatalogOptions(null, p.catalogo || 'MAESTRO');
            
            // Forzar reflow para asegurar que la animacin CSS siempre se reproduzca al renombrar
            const modal = document.getElementById('project-modal');
            modal.style.display = 'flex';
            void modal.offsetWidth; // trigger reflow
            
            setTimeout(() => document.getElementById('proj-input-name').focus(), 100);
        }

window.openProject = function(id) {
    const p = projects.find(proj => proj.id === id);
    const pType = p ? (p.type || 'libros') : 'libros';
    localStorage.setItem('educonta_last_project_id', id);
    localStorage.setItem('educonta_proyectos_active_tab', pType); // Maintain tab state on return
    
    // Predeterminadamente todo en la sección de Proyectos carga en Modo Práctica
    if (pType === 'kardex') {
        localStorage.setItem('educonta_kardex_modo', 'practica');
        window.location.href = 'editor-kardex.html';
    } else if (pType === 'planillas') {
        localStorage.setItem('educonta_planillas_modo', 'practica');
        window.location.href = 'editor-planillas.html';
    } else if (pType === 'hojas' || pType === 'calculo') {
        window.location.href = 'editor-hojas-calculo.html';
    } else if (pType === 'tributario') {
        localStorage.setItem('educonta_tributario_modo', 'practica');
        window.location.href = 'editor-tributario.html';
    } else if (pType === 'costos') {
        localStorage.setItem('educonta_costos_modo', 'practica');
        window.location.href = 'editor-costos.html';
    } else if (pType === 'caja') {
        localStorage.setItem('educonta_caja_modo', 'practica');
        window.location.href = 'editor-caja.html';
    } else if (pType === 'finanzas') {
        localStorage.setItem('educonta_finanzas_modo', 'practica');
        window.location.href = 'editor-finanzas.html';
    } else {
        localStorage.setItem('educonta_mayor_modo', 'practica');
        localStorage.setItem('educonta_comprobacion_modo', 'practica');
        window.location.href = 'editor-libros.html';
    }
};

const NOMBRES_RANDOM = ['Auditoría Externa S.A.', 'Consultores de Oriente', 'Agroindustrias Cuscatlán', 'Comercializadora del Pacífico', 'Inversiones Metapán', 'Fomento Ganadero', 'Distribuidora La Paz', 'Corporación Textilera SV', 'Banca y Seguros El Salvador', 'Ministerio de Finanzas', 'Cooperativa Ganadera'];

window.setRandomProjectName = function() {
            const name = NOMBRES_RANDOM[Math.floor(Math.random() * NOMBRES_RANDOM.length)];
            document.getElementById('proj-input-name').value = name;
        }

window.updateCatalogOptions = function(selectedSector = null, selectedCat = null) {
    const targetCat = selectedCat || 'MAESTRO';
    selectCatalog(targetCat,
        document.querySelector(`#catalog-options-panel [data-value="${targetCat}"] .catalog-option-name`)?.textContent
        || 'Catálogo Maestro'
    );
}

window.toggleCatalogPanel = function() {
    const btn   = document.getElementById('catalog-current-btn');
    const panel = document.getElementById('catalog-options-panel');
    if (!btn || !panel) return;
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
        panel.classList.remove('open');
        btn.classList.remove('open');
        panel.style.height = "0px";
    } else {
        panel.classList.add('open');
        btn.classList.add('open');
        panel.style.height = panel.scrollHeight + "px";
    }
}

window.selectCatalog = function(value, name) {
    const hiddenInput = document.getElementById('proj-input-catalogo');
    const labelEl = document.getElementById('catalog-current-label');
    if (hiddenInput) hiddenInput.value = value;
    if (labelEl && name) labelEl.textContent = name;

    // Marcar opción seleccionada
    document.querySelectorAll('#catalog-options-panel .catalog-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.value === value);
    });

    // Cerrar el panel
    const btn   = document.getElementById('catalog-current-btn');
    const panel = document.getElementById('catalog-options-panel');
    if (panel) {
        panel.classList.remove('open');
        panel.style.height = "0px";
    }
    if (btn)   btn.classList.remove('open');
}

// ==========================================
// IMPORTAR  .edc  — MODAL DRAG & DROP
// ==========================================

/** Archivo .edc pendiente de confirmación */
window._edcPendingFile = null;
window._edcPendingData = null;

/** Abrir modal */
window.openImportEdcModal = function() {
    const modal = document.getElementById('import-edc-modal');
    if (modal) {
        modal.style.display = 'flex';
        resetDropzone();
    }
};

/** Cerrar modal */
window.closeImportEdcModal = function() {
    const modal = document.getElementById('import-edc-modal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
            window._edcPendingFile = null;
            window._edcPendingData = null;
        }, 300);
    }
};

/** Resetear dropzone al estado inicial */
window.resetDropzone = function() {
    const dz = document.getElementById('edc-dropzone');
    const confirmArea = document.getElementById('import-confirm-area');
    const pw = document.getElementById('import-progress-wrap');
    const pb = document.getElementById('import-progress-bar');
    const fi = document.getElementById('edc-file-input');

    if (dz) dz.className = ''; // quita drag-over / file-ready / file-error
    if (confirmArea) confirmArea.classList.add('hidden');
    if (pw) pw.style.display = 'none';
    if (pb) pb.style.width = '0%';
    if (fi) fi.value = '';

    // Restaurar texto del dropzone
    const label = document.getElementById('edc-dropzone-label');
    const sub   = document.getElementById('edc-dropzone-sub');
    const icon  = document.getElementById('edc-dropzone-icon');
    if (label) label.innerHTML = 'Arrastra tu archivo <span class="text-sky-500">.edc</span> aquí';
    if (sub)   sub.textContent = 'o haz clic para seleccionar';
    if (icon)  icon.innerHTML = '<div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center"><i class="fas fa-cloud-upload-alt text-2xl text-slate-400"></i></div>';

    window._edcPendingFile = null;
    window._edcPendingData = null;
};

// --- Drag & Drop handlers ---
window.edcDragOver = function(e) {
    e.preventDefault();
    const dz = document.getElementById('edc-dropzone');
    if (dz) dz.classList.add('drag-over');
};

window.edcDragLeave = function(e) {
    e.preventDefault();
    const dz = document.getElementById('edc-dropzone');
    if (dz) dz.classList.remove('drag-over');
};

window.edcDrop = function(e) {
    e.preventDefault();
    const dz = document.getElementById('edc-dropzone');
    if (dz) dz.classList.remove('drag-over');
    const file = e.dataTransfer?.files?.[0];
    if (file) edcFileSelected(file);
};

/** Cuando se selecciona / suelta un archivo */
window.edcFileSelected = function(file) {
    if (!file) return;

    // Validar extensión
    if (!file.name.toLowerCase().endsWith('.edc')) {
        setDropzoneError('Solo se aceptan archivos con extensión .edc');
        return;
    }

    window._edcPendingFile = file;

    const lector = new FileReader();
    lector.readAsText(file);

    lector.onload = (e) => {
        try {
            let contenidoRaw = e.target.result;
            let contenido;

            // --- PROCESO DE DESBLINDADO (DE-OBFUSCATION) ---
            const desblindarData = (b64) => {
                const key = "EDC_SHIELD_2024";
                const binStr = atob(b64.trim());
                let str;
                if (typeof TextDecoder !== 'undefined') {
                    const bytes = new Uint8Array(binStr.length);
                    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
                    str = new TextDecoder('utf-8').decode(bytes);
                } else {
                    str = decodeURIComponent(Array.from(binStr, c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
                }
                let output = "";
                for (let i = 0; i < str.length; i++) {
                    output += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
                }
                return output;
            };

            try {
                // Intentar cargar como JSON plano (compatibilidad hacia atrás)
                contenido = JSON.parse(contenidoRaw);
            } catch (e) {
                // Si falla, intentar desblindar
                contenido = JSON.parse(desblindarData(contenidoRaw));
            }

            // VALIDACIÓN PRINCIPAL: firma oficial
            if (contenido.identificador_app !== 'EDUCONTA_SV_OFFICIAL') {
                setDropzoneError('Archivo no compatible — no proviene de EduConta SV');
                return;
            }

            window._edcPendingData = contenido;

            // Estado: archivo listo
            const dz = document.getElementById('edc-dropzone');
            if (dz) {
                dz.classList.remove('drag-over', 'file-error');
                dz.classList.add('file-ready');
            }

            // Mostrar badge del archivo
            const confirmArea = document.getElementById('import-confirm-area');
            const fname = document.getElementById('import-file-name');
            const fmeta = document.getElementById('import-file-meta');
            if (confirmArea) confirmArea.classList.remove('hidden');
            if (fname) fname.textContent = file.name;
            if (fmeta) {
                const meta = contenido.metadata || {};
                const fecha = meta.fecha ? new Date(meta.fecha).toLocaleDateString() : 'fecha desconocida';
                fmeta.textContent = `"${meta.nombre || 'Proyecto'}" · ${fecha}`;
            }

        } catch (err) {
            setDropzoneError('El archivo está dañado o no es un .edc válido');
        }
    };

    lector.onerror = () => setDropzoneError('No se pudo leer el archivo');
};

/** Estado de error en el dropzone */
function setDropzoneError(msg) {
    const dz = document.getElementById('edc-dropzone');
    const label = document.getElementById('edc-dropzone-label');
    const sub   = document.getElementById('edc-dropzone-sub');
    const icon  = document.getElementById('edc-dropzone-icon');

    if (dz) {
        dz.classList.remove('drag-over', 'file-ready');
        dz.classList.add('file-error');
        // Reiniciar animación
        void dz.offsetWidth;
    }
    if (label) label.textContent = '⚠ Archivo no válido';
    if (sub)   sub.textContent = msg;
    if (icon)  icon.innerHTML = '<div class="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center"><i class="fas fa-times-circle text-2xl text-rose-400"></i></div>';
    window._edcPendingFile = null;
    window._edcPendingData = null;

    setTimeout(() => {
        const dz2 = document.getElementById('edc-dropzone');
        if (dz2 && dz2.classList.contains('file-error')) resetDropzone();
    }, 3000);
}

/** Confirmar importación: crea el proyecto nuevo */
window.confirmarImportacionEdc = async function() {
    const contenido = window._edcPendingData;
    if (!contenido) return;

    const btn = document.getElementById('btn-confirmar-importacion');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Importando...';
    }

    // Barra de progreso
    const pw = document.getElementById('import-progress-wrap');
    const pb = document.getElementById('import-progress-bar');
    if (pw) pw.style.display = 'block';
    if (pb) pb.style.width = '30%';

    try {
        // El cuerpo_contable contiene el objeto completo del proyecto
        const proyectoBruto = contenido.cuerpo_contable;
        const meta          = contenido.metadata || {};

        // Crear copia con nuevo ID y nombre diferenciado
        const nuevoProyecto = JSON.parse(JSON.stringify(proyectoBruto || {}));
        nuevoProyecto.id        = 'proj_' + Date.now();
        nuevoProyecto.name      = (meta.nombre || proyectoBruto?.name || 'Proyecto Importado') + ' (Importado)';
        nuevoProyecto.catalogo  = meta.catalogo || proyectoBruto?.catalogo || 'MAESTRO';
        nuevoProyecto.sector    = meta.sector || proyectoBruto?.sector || 'ALL';
        nuevoProyecto.createdAt = new Date().toISOString();
        nuevoProyecto.updatedAt = new Date().toISOString();
        nuevoProyecto.sheets    = Array.isArray(proyectoBruto?.sheets) ? proyectoBruto.sheets : [];
        nuevoProyecto.bookCounter = proyectoBruto?.bookCounter || 0;
        delete nuevoProyecto.owner_id;
        delete nuevoProyecto.owner_email;
        delete nuevoProyecto.owner_name;
        nuevoProyecto.shared_with = [];

        // Auto-detectar e inyectar el tipo de proyecto dentro de los 7 modelos de PROYECTO_MODELS
        const validModels = Array.isArray(PROYECTO_MODELS) ? PROYECTO_MODELS : ['libros', 'kardex', 'planillas', 'tributario', 'costos', 'caja', 'finanzas'];
        const candidateType = meta.tipo || meta.type || nuevoProyecto.type;
        if (candidateType && validModels.includes(candidateType)) {
            nuevoProyecto.type = candidateType;
        } else if (!nuevoProyecto.type || !validModels.includes(nuevoProyecto.type)) {
            const d = nuevoProyecto.data || nuevoProyecto;
            if (nuevoProyecto.sheets && nuevoProyecto.sheets.length > 0) {
                const firstSheet = nuevoProyecto.sheets[0];
                if (firstSheet.employees || firstSheet.sectionConfig) {
                    nuevoProyecto.type = 'planillas';
                } else if (firstSheet.entries !== undefined || firstSheet.method !== undefined) {
                    nuevoProyecto.type = 'kardex';
                } else {
                    nuevoProyecto.type = 'libros';
                }
            } else if (d.ventasGravadas !== undefined || d.libroCompras || d.tipoImpuesto || d.declaracion) {
                nuevoProyecto.type = 'tributario';
            } else if (d.ordenesTrabajo || d.prorrateosData || d.iiMp !== undefined || d.ordenes || d.elementosCosto) {
                nuevoProyecto.type = 'costos';
            } else if (d.fondoFijo !== undefined || d.tipoArqueo || d.corte || d.movimientos || d.saldoInicial !== undefined) {
                nuevoProyecto.type = 'caja';
            } else if (d.prestamo || d.interes || d.inversion || d.razones || d.estadosFinancieros) {
                nuevoProyecto.type = 'finanzas';
            } else {
                nuevoProyecto.type = 'libros';
            }
        }

        if (pb) pb.style.width = '60%';

        // Guardar en localStorage de su bóveda respectiva
        const pType = nuevoProyecto.type || 'libros';
        const key = getProjectsStorageKey(pType);
        const allProjects = JSON.parse(localStorage.getItem(key) || '[]');
        allProjects.unshift(nuevoProyecto);
        localStorage.setItem(key, JSON.stringify(allProjects));
        
        if (pType !== window.currentModelTab && typeof switchModelTab === 'function') {
            switchModelTab(pType, false);
        } else {
            window.projects = allProjects;
        }

        if (pb) pb.style.width = '80%';

        // Intentar sincronizar con Supabase si hay sesión
        if (typeof supabaseClient !== 'undefined') {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session && typeof syncCurrentProjectWithSupabase === 'function') {
                    await syncCurrentProjectWithSupabase(nuevoProyecto, session.user.id, true);
                }
            } catch (_) { /* Sin sesión — no es un error crítico */ }
        }

        if (pb) pb.style.width = '100%';

        // Éxito: cerrar modal y refrescar grid
        setTimeout(() => {
            closeImportEdcModal();
            if (typeof renderProjectGrid === 'function') renderProjectGrid();

            // Abrir el proyecto importado directamente
            if (typeof openProject === 'function') openProject(nuevoProyecto.id);
        }, 500);

    } catch (err) {
        console.error('Error al importar .edc:', err);
        setDropzoneError('Ocurrió un error al procesar el archivo');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Importar y Crear Proyecto';
        }
        if (pw) pw.style.display = 'none';
    }
};

// --- Interceptor global de drag: abrir modal automáticamente al soltar un .edc en la ventana ---
(function() {
    let dragCounter = 0;
    window.addEventListener('dragenter', (e) => {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        dragCounter++;
        // Solo si no hay modal ya abierto
        const modal = document.getElementById('import-edc-modal');
        if (modal && modal.style.display !== 'flex') openImportEdcModal();
    });
    window.addEventListener('dragleave', (e) => {
        dragCounter--;
    });
    window.addEventListener('drop', (e) => {
        dragCounter = 0;
    });
})();

// ====== SELECCIÓN MÚLTIPLE ======
window.isMultiSelectMode = false;
window.selectedCards = new Set();
let pressTimer = null;

window.justEnteredMultiSelect = false;

window.handleCardPressStart = function(id) {
    if (window.isMultiSelectMode) return;
    pressTimer = setTimeout(() => {
        window.isMultiSelectMode = true;
        window.justEnteredMultiSelect = true;
        toggleCardSelection(id);
        updateMultiSelectUI();
        if ("vibrate" in navigator) navigator.vibrate(50);
    }, 500);
};

window.handleCardPressEnd = function() {
    if (pressTimer) clearTimeout(pressTimer);
};

window.toggleCardSelection = function(id) {
    if (window.selectedCards.has(id)) {
        window.selectedCards.delete(id);
    } else {
        window.selectedCards.add(id);
    }
    
    const cardEl = document.getElementById('card-' + id);
    if (cardEl) {
        if (window.selectedCards.has(id)) cardEl.classList.add('multi-selected');
        else cardEl.classList.remove('multi-selected');
    }
    
    if (window.selectedCards.size === 0 && window.isMultiSelectMode) {
        clearMultiSelection();
    } else if (window.isMultiSelectMode) {
        updateMultiSelectUI();
    }
};

window.updateMultiSelectUI = function() {
    const bar = document.getElementById('multi-select-bar');
    const countText = document.getElementById('multi-select-count');
    const grid = document.getElementById('project-grid');
    if (bar && countText) {
        if (window.isMultiSelectMode) {
            countText.innerText = window.selectedCards.size + ' seleccionados';
            bar.classList.add('show');
            if (grid) grid.classList.add('multi-select-active');
        } else {
            bar.classList.remove('show');
            if (grid) grid.classList.remove('multi-select-active');
        }
    }
};

window.clearMultiSelection = function() {
    window.isMultiSelectMode = false;
    window.selectedCards.forEach(id => {
        const cardEl = document.getElementById('card-' + id);
        if (cardEl) cardEl.classList.remove('multi-selected');
    });
    window.selectedCards.clear();
    updateMultiSelectUI();
};

window.deleteMultiSelected = function() {
    if (window.selectedCards.size === 0) return;

    const performDelete = async () => {
        const activeModel = window.currentModelTab || 'libros';
        const storageKey = getProjectsStorageKey(activeModel);
        
        // Archivar en Supabase para evitar que la sincronización los vuelva a traer
        if (typeof supabaseClient !== 'undefined') {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session && session.user) {
                    for (const id of window.selectedCards) {
                        await supabaseClient.from('proyectos_contables')
                            .update({ estado: 'archivado' })
                            .eq('data->>id', id)
                            .eq('user_id', session.user.id);
                    }
                }
            } catch (e) {
                console.error("Error al archivar proyectos en la nube:", e);
            }
        }

        window.selectedCards.forEach(id => {
            projects = projects.filter(p => p.id !== id);
            if (window.syncedProjectIds) {
                window.syncedProjectIds.delete(id);
            }
        });
        if (window.syncedProjectIds) {
            localStorage.setItem('educonta_synced_ids', JSON.stringify(Array.from(window.syncedProjectIds)));
        }
        
        localStorage.setItem(storageKey, JSON.stringify(projects));
        clearMultiSelection();
        renderProjectGrid();
        
        if (typeof showToast === 'function') {
            showToast('Elementos eliminados', 'success');
        }
        
        if (typeof closeModal === 'function') closeModal();
    };

    if (typeof showModal === 'function') {
        showModal(
            "Eliminar Elementos", 
            `¿Estás seguro de que quieres eliminar los ${window.selectedCards.size} elementos seleccionados permanentemente?`, 
            performDelete,
            false
        );
    } else {
        if (confirm("¿Estás seguro de que quieres eliminar los " + window.selectedCards.size + " elementos seleccionados?")) {
            performDelete();
        }
    }
};

// Listeners globales de conectividad en tiempo real
window.addEventListener('online', () => {
    if (typeof updateCloudIndicatorUI === 'function') {
        updateCloudIndicatorUI(window.isUserLoggedIn ? 'online' : 'local');
    }
    if (typeof showSyncToast === 'function') {
        showSyncToast('online');
    }
    if (window.isUserLoggedIn && typeof syncAllLocalProjectsToCloud === 'function') {
        syncAllLocalProjectsToCloud();
    }
    if (typeof renderProjectGrid === 'function') {
        renderProjectGrid();
    }
});

window.addEventListener('offline', () => {
    if (typeof updateCloudIndicatorUI === 'function') {
        updateCloudIndicatorUI('offline');
    }
    if (typeof showSyncToast === 'function') {
        showSyncToast('offline');
    }
    if (typeof renderProjectGrid === 'function') {
        renderProjectGrid();
    }
});


