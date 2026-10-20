// === Estado Global de Documentos ===
window.getProjectsStorageKey = function(type) {
    if (type === 'lienzos') return 'educonta_projects_lienzos';
    if (type === 'diagramas') return 'educonta_projects_diagramas';
    if (type === 'diapositivas') return 'educonta_projects_diapositivas';
    if (type === 'textos') return 'educonta_projects_textos';
    if (type === 'calculo') return 'educonta_projects_calculo';
    return 'educonta_projects_textos'; // default
};
// Migration check:
(function() {
    const legacyStr = localStorage.getItem('educonta_projects_v38_docs');
    if (legacyStr) {
        try {
            const legacy = JSON.parse(legacyStr) || [];
            const books = legacy.filter(p => (p.type || 'calculo') === 'calculo' || p.type === 'hojas');
            const lienzos = legacy.filter(p => p.type === 'lienzos');
            const diagramas = legacy.filter(p => p.type === 'diagramas');
            if (books.length) localStorage.setItem('educonta_projects_calculo', JSON.stringify(books));
            if (lienzos.length) localStorage.setItem('educonta_projects_lienzos', JSON.stringify(lienzos));
            if (diagramas.length) localStorage.setItem('educonta_projects_diagramas', JSON.stringify(diagramas));
            localStorage.removeItem('educonta_projects_v38_docs');
        } catch(e) { console.error('Migration failed:', e); }
    }

    // Migración transparente de educonta_projects_hojas a educonta_projects_calculo
    const hojasLegacy = localStorage.getItem('educonta_projects_hojas');
    if (hojasLegacy) {
        try {
            const hojasList = JSON.parse(hojasLegacy) || [];
            if (hojasList.length > 0) {
                const calculoList = JSON.parse(localStorage.getItem('educonta_projects_calculo')) || [];
                const calculoIds = new Set(calculoList.map(p => p.id));
                hojasList.forEach(p => {
                    if (p) {
                        p.type = 'calculo';
                        if (!calculoIds.has(p.id)) {
                            calculoList.push(p);
                            calculoIds.add(p.id);
                        }
                    }
                });
                localStorage.setItem('educonta_projects_calculo', JSON.stringify(calculoList));
            }
        } catch(e) { console.error('Migration hojas to calculo failed:', e); }
    }
})();

let defaultTab = localStorage.getItem('educonta_docs_active_tab') || 'textos';
if (!['textos', 'calculo', 'lienzos', 'diagramas', 'diapositivas'].includes(defaultTab)) {
    defaultTab = 'textos';
    localStorage.setItem('educonta_docs_active_tab', 'textos');
}
window.currentModelTab = defaultTab;
window.projects = JSON.parse(localStorage.getItem(getProjectsStorageKey(defaultTab))) || [];
window.syncedProjectIds = new Set(JSON.parse(localStorage.getItem('educonta_synced_ids')) || []);
window.documento_actual = null;
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

    if (!session || !session.user) {
        try {
            if (typeof supabaseClient !== 'undefined') {
                const { data } = await supabaseClient.auth.getSession();
                session = data?.session;
            }
        } catch(e) {}
    }
    if (!session || !session.user) return;
    if (!navigator.onLine) {
        updateCloudIndicatorUI('offline');
        return;
    }

    // Evitar carreras asíncronas o duplicación por sincronizaciones simultáneas
    if (window._isSyncAllDocsRunning) return;
    window._isSyncAllDocsRunning = true;

    try {
        const t = JSON.parse(localStorage.getItem('educonta_projects_textos')) || [];
        const c = JSON.parse(localStorage.getItem('educonta_projects_calculo')) || [];
        const l = JSON.parse(localStorage.getItem('educonta_projects_lienzos')) || [];
        const d = JSON.parse(localStorage.getItem('educonta_projects_diagramas')) || [];
        const p = JSON.parse(localStorage.getItem('educonta_projects_diapositivas')) || [];
        
        // Inyectar / normalizar tipos explícitos y guardar cambios en local
        t.forEach(proj => { if (proj) proj.type = 'textos'; });
        c.forEach(proj => { if (proj) proj.type = 'calculo'; });
        l.forEach(proj => { if (proj) proj.type = 'lienzos'; });
        d.forEach(proj => { if (proj) proj.type = 'diagramas'; });
        p.forEach(proj => { if (proj) proj.type = 'diapositivas'; });
        localStorage.setItem('educonta_projects_textos', JSON.stringify(t));
        localStorage.setItem('educonta_projects_calculo', JSON.stringify(c));
        localStorage.setItem('educonta_projects_lienzos', JSON.stringify(l));
        localStorage.setItem('educonta_projects_diagramas', JSON.stringify(d));
        localStorage.setItem('educonta_projects_diapositivas', JSON.stringify(p));

        const allLocal = [...t, ...c, ...l, ...d, ...p];
        const listToSync = Array.isArray(onlyProjects) ? onlyProjects : allLocal;
        if (listToSync.length === 0) {
            window._isSyncAllDocsRunning = false;
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
                console.log("[Documentos] Omitiendo documento ajeno para evitar conflictos de cuenta:", proj.id);
                continue;
            }

            try {
                await syncCurrentProjectWithSupabase(proj, session.user.id, true);
                syncedCount++;
            } catch (itemErr) {
                console.warn("[Documentos] Advertencia al sincronizar documento individual " + proj.id + ":", itemErr);
                // Si el error fue de acceso denegado, no romper la sincronización del resto de documentos
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
        window._isSyncAllDocsRunning = false;
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
                const textosLocal = JSON.parse(localStorage.getItem('educonta_projects_textos')) || [];
                const calculoLocal = JSON.parse(localStorage.getItem('educonta_projects_calculo')) || JSON.parse(localStorage.getItem('educonta_projects_hojas')) || [];
                const lienzosLocal = JSON.parse(localStorage.getItem('educonta_projects_lienzos')) || [];
                const diagramasLocal = JSON.parse(localStorage.getItem('educonta_projects_diagramas')) || [];
                const diapositivasLocal = JSON.parse(localStorage.getItem('educonta_projects_diapositivas')) || [];

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
                            // Si ya estaba sincronizado antes y ya no viene activo de la nube, fue archivado o eliminado en otro dispositivo
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

                const PROYECTO_TYPES = new Set(['libros', 'kardex', 'planillas', 'tributario', 'costos', 'caja', 'finanzas']);

                if (data && data.length > 0) {
                    const tempProjects = [];

                    data.forEach(row => {
                        const p = row.data;
                        if (!p || !p.id) return;

                        // Si pertenece a Proyectos Contables, ignorarlo en Documentos
                        if (PROYECTO_TYPES.has(p.type)) return;

                        // Normalizar hojas a calculo
                        if (p.type === 'hojas') p.type = 'calculo';

                        // Asegurar / inferir el tipo de documento de la nube si hace falta
                        if (!p.type) {
                            // Ignorar si tiene estructura de proyecto contable
                            if (p.accounts || p.transactions || p.partidas || p.movimientos || p.saldoInicial !== undefined || p.ordenes || p.elementosCosto || p.declaracion || p.tipoImpuesto || p.razones || p.estadosFinancieros) {
                                return;
                            }
                            if (p.sheets && p.sheets.length > 0 && (p.sheets[0].employees || p.sheets[0].sectionConfig || p.sheets[0].entries !== undefined || p.sheets[0].method !== undefined)) {
                                return;
                            }

                            if (diapositivasLocal.some(lp => lp.id === p.id)) {
                                p.type = 'diapositivas';
                            } else if (diagramasLocal.some(lp => lp.id === p.id)) {
                                p.type = 'diagramas';
                            } else if (lienzosLocal.some(lp => lp.id === p.id)) {
                                p.type = 'lienzos';
                            } else if (calculoLocal.some(lp => lp.id === p.id)) {
                                p.type = 'calculo';
                            } else if (textosLocal.some(lp => lp.id === p.id)) {
                                p.type = 'textos';
                            } else if (p.slides) {
                                p.type = 'diapositivas';
                            } else if (p.shapes || p.canvasData) {
                                p.type = 'lienzos';
                            } else if (p.nodes || p.connections) {
                                p.type = 'diagramas';
                            } else if (p.workbook || (p.sheets && p.sheets.length > 0 && (p.sheets[0].blocks !== undefined || p.sheets[0].cells !== undefined || p.sheets[0].data !== undefined))) {
                                p.type = 'calculo';
                            } else if (p.pages || p.sections || p.content) {
                                p.type = 'textos';
                            } else {
                                p.type = 'textos';
                            }
                        }

                        syncedProjectIds.add(p.id);
                        tempProjects.push(p);
                    });

                    localStorage.setItem('educonta_synced_ids', JSON.stringify(Array.from(syncedProjectIds)));

                    // Separate by type
                    const textosCloud = tempProjects.filter(p => p.type === 'textos');
                    const calculoCloud = tempProjects.filter(p => p.type === 'calculo');
                    const lienzosCloud = tempProjects.filter(p => p.type === 'lienzos');
                    const diagramasCloud = tempProjects.filter(p => p.type === 'diagramas');
                    const diapositivasCloud = tempProjects.filter(p => p.type === 'diapositivas');

                    // Merge and save each vault
                    const mergedTextos = helperMerge('educonta_projects_textos', textosLocal, textosCloud);
                    const mergedCalculo = helperMerge('educonta_projects_calculo', calculoLocal, calculoCloud);
                    const mergedLienzos = helperMerge('educonta_projects_lienzos', lienzosLocal, lienzosCloud);
                    const mergedDiagramas = helperMerge('educonta_projects_diagramas', diagramasLocal, diagramasCloud);
                    const mergedDiapositivas = helperMerge('educonta_projects_diapositivas', diapositivasLocal, diapositivasCloud);

                    // Assign window.projects based on current model tab
                    const activeModel = window.currentModelTab || 'textos';
                    if (activeModel === 'calculo') window.projects = mergedCalculo;
                    else if (activeModel === 'lienzos') window.projects = mergedLienzos;
                    else if (activeModel === 'diagramas') window.projects = mergedDiagramas;
                    else if (activeModel === 'diapositivas') window.projects = mergedDiapositivas;
                    else window.projects = mergedTextos;

                    // Solo subir a la nube documentos locales nuevos o con updatedAt más reciente que la nube
                    if (dirtyLocalProjects.length > 0) {
                        syncAllLocalProjectsToCloud(session, dirtyLocalProjects);
                    }

                    updateCloudIndicatorUI('success');
                    return true;
                } else if (data && data.length === 0) {
                    // Verificar si existen proyectos locales que requieran sincronización inicial
                    const totalLocals = textosLocal.length + calculoLocal.length + lienzosLocal.length + diagramasLocal.length + diapositivasLocal.length;
                    if (totalLocals > 0 && dirtyLocalProjects.length > 0) {
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
    let savedTab = localStorage.getItem('educonta_docs_active_tab') || 'textos';
    if (!['textos', 'calculo', 'lienzos', 'diagramas', 'diapositivas'].includes(savedTab)) {
        savedTab = 'textos';
    }
    const savedIdx = ['textos', 'calculo', 'lienzos', 'diagramas', 'diapositivas'].indexOf(savedTab);
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
const DOCUMENTO_MODELS = ['textos', 'calculo', 'lienzos', 'diagramas', 'diapositivas'];
window.currentModelTab = 'textos';

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
            const idx = DOCUMENTO_MODELS.indexOf(window.currentModelTab);
            moveVerticalTab(activeBtn, idx !== -1 ? idx : 0, false);
        }
    });
}

window.switchModelTab = function(model, animate = true) {
    window.currentModelTab = model;
    localStorage.setItem('educonta_docs_active_tab', model);
    
    // Cargar documentos de la bóveda correspondiente
    const key = getProjectsStorageKey(model);
    window.projects = JSON.parse(localStorage.getItem(key)) || [];
    
    // Desktop sidebar buttons
    let activeBtn = null;
    let newIndex = DOCUMENTO_MODELS.indexOf(model);
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
    ['calculo', 'lienzos', 'diagramas', 'diapositivas', 'textos'].forEach(m => {
        const btnMobile = document.getElementById(`tab-model-${m}-mobile`);
        if (btnMobile) {
            if (m === model) {
                btnMobile.className = "flex-1 min-w-[120px] px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 font-bold text-xs flex items-center gap-2";
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
            el.className = "model-opt-card p-3 rounded-2xl border-2 border-amber-500 bg-amber-50/50 cursor-pointer transition-all flex items-center gap-3 selected";
        } else {
            el.className = "model-opt-card p-3 rounded-2xl border-2 border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all flex items-center gap-3";
        }

        const check = el.querySelector('.model-check-circle');
        if (check) {
            if (isSelected) {
                check.className = "model-check-circle w-4 h-4 rounded-full border border-amber-500 bg-amber-500 flex items-center justify-center shrink-0";
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
        catContainer.style.display = model === 'hojas' ? 'block' : 'none';
    }
};

// === Filtro de Documentos (Todos / Mis Documentos / Compartidos) ===
window.currentDocFilter = 'all';

window.switchDocFilter = function(filter) {
    window.currentDocFilter = filter || 'all';
    
    // Actualizar estilos de los botones de filtro
    const subfilters = ['all', 'mine', 'shared'];
    subfilters.forEach(f => {
        const btn = document.getElementById('subfilter-' + f);
        if (btn) {
            if (f === window.currentDocFilter) {
                btn.className = 'doc-subfilter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all active bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm flex items-center gap-1.5';
            } else {
                btn.className = 'doc-subfilter-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all flex items-center gap-1.5';
            }
        }
    });

    renderProjectGrid();
};

window.renderProjectGrid = function() {
    const grid = document.getElementById('project-grid');
    const empty = document.getElementById('empty-projects');
    const emptyMsg = document.getElementById('empty-projects-msg');
    if (!grid) return;
    grid.innerHTML = '';

    const activeModel = window.currentModelTab || 'textos';
    const currentUid = window.currentUserId;

    // Obtener todos los documentos del modelo activo
    const allModelProjects = (window.projects || []).filter(p => {
        const pType = p.type || 'textos';
        return pType === activeModel || (activeModel === 'calculo' && pType === 'hojas');
    });

    // Calcular contador de compartidos con el usuario
    const sharedWithMeList = allModelProjects.filter(p => {
        const hasSharedWith = Array.isArray(p.shared_with) && currentUid && p.shared_with.includes(currentUid);
        const hasDifferentOwner = p.owner_id && currentUid && p.owner_id !== currentUid;
        return Boolean(hasSharedWith || hasDifferentOwner);
    });

    const sharedBadge = document.getElementById('shared-docs-count-badge');
    if (sharedBadge) {
        sharedBadge.textContent = sharedWithMeList.length;
        if (sharedWithMeList.length > 0) sharedBadge.classList.remove('hidden');
        else sharedBadge.classList.add('hidden');
    }

    // Filtrar según el subfiltro activo
    let filteredProjects = allModelProjects;
    if (window.currentDocFilter === 'mine') {
        filteredProjects = allModelProjects.filter(p => {
            const isCollab = (currentUid && Array.isArray(p.shared_with) && p.shared_with.includes(currentUid)) ||
                             (p.owner_id && currentUid && p.owner_id !== currentUid);
            return !isCollab;
        });
    } else if (window.currentDocFilter === 'shared') {
        filteredProjects = sharedWithMeList;
    }

    if (filteredProjects.length === 0) {
        if (empty) empty.classList.remove('hidden');
        if (emptyMsg) {
            if (window.currentDocFilter === 'shared') {
                emptyMsg.textContent = "No tienes documentos compartidos contigo en esta categoría.";
            } else if (window.currentDocFilter === 'mine') {
                emptyMsg.textContent = "No tienes documentos propios creados en esta categoría.";
            } else {
                emptyMsg.textContent = "No tienes documentos guardados aún.";
            }
        }
        return;
    }
    if (empty) empty.classList.add('hidden');

    const fragment = document.createDocumentFragment();
    filteredProjects.forEach(p => {
        const card = document.createElement('div');
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

        // Determinar icono y color según el tipo
        let iconClass = 'fa-file-alt';
        let iconColor = 'text-amber-500';
        let bloomClass = 'btn-bloom-orange';
        const pType = p.type || 'textos';

        if (pType === 'lienzos') {
            iconClass = 'fa-pencil-ruler';
            iconColor = 'text-amber-500';
            bloomClass = 'btn-bloom-orange';
        } else if (pType === 'diagramas') {
            iconClass = 'fa-project-diagram';
            iconColor = 'text-indigo-500';
            bloomClass = 'btn-bloom-indigo';
        } else if (pType === 'diapositivas') {
            iconClass = 'fa-desktop';
            iconColor = 'text-amber-500';
            bloomClass = 'btn-bloom-orange';
        } else if (pType === 'calculo' || pType === 'hojas') {
            iconClass = 'fa-file-excel';
            iconColor = 'text-emerald-500';
            bloomClass = 'btn-bloom-emerald';
        } else {
            iconClass = 'fa-file-alt';
            iconColor = 'text-amber-500';
            bloomClass = 'btn-bloom-orange';
        }

        // Determinar insignias de compartición
        const isCollabDoc = Boolean(
            (currentUid && Array.isArray(p.shared_with) && p.shared_with.includes(currentUid)) ||
            (p.owner_id && currentUid && p.owner_id !== currentUid)
        );
        const isOwnerWithCollabs = Boolean(
            Array.isArray(p.shared_with) && p.shared_with.length > 0 &&
            (!p.owner_id || (currentUid && p.owner_id === currentUid))
        );

        let shareBadgeHTML = '';
        if (isCollabDoc) {
            const rawOwnerName = p.owner_name || p.owner_email || 'Colaborador';
            const ownerName = String(rawOwnerName)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            shareBadgeHTML = '<span class="flex items-center gap-1 text-[9px] font-bold text-sky-600 dark:text-sky-400 px-2.5 py-1 rounded-[36px] bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800" title="Documento compartido por ' + ownerName + '"><i class="fas fa-users"></i> De: ' + ownerName + '</span>';
        } else if (isOwnerWithCollabs) {
            shareBadgeHTML = '<span class="flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-[36px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800" title="Compartido con ' + p.shared_with.length + ' persona(s)"><i class="fas fa-share-alt"></i> Compartido (' + p.shared_with.length + ')</span>';
        }

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="w-12 h-12 rounded-[36px] flex items-center justify-center project-icon-ring ${bloomClass} ${iconColor}">
                    <i class="fas ${iconClass} text-xl"></i>
                </div>
                <div class="relative">
                    <button onclick="event.stopPropagation(); toggleProjMenu('${p.id}')" class="text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2">
                            <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div id="menu-${p.id}" class="dropdown-menu">
                        <div class="dropdown-item" onclick="event.stopPropagation(); duplicateProject('${p.id}')"><i class="far fa-copy"></i> Duplicar</div>
                        <div class="dropdown-item" onclick="event.stopPropagation(); openRenameModal('${p.id}')"><i class="far fa-edit"></i> Renombrar</div>
                        <div class="dropdown-item text-amber-600 dark:text-amber-400" onclick="event.stopPropagation(); openDocShareModal('${p.id}')"><i class="fas fa-user-plus"></i> Compartir</div>
                        <div class="dropdown-item text-rose-500 hover:text-rose-600" onclick="event.stopPropagation(); deleteProject('${p.id}')"><i class="far fa-trash-alt"></i> Borrar</div>
                    </div>
                </div>
            </div>
            <div>
                <h4 class="font-bold text-slate-800 dark:text-white text-lg mb-1 truncate">${window.EduSec ? EduSec.escapeHtml(p.name || 'Sin título') : String(p.name || 'Sin título').replace(/[&<>"']/g, '')}</h4>
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                    <span class="text-[9px] font-bold text-slate-400 uppercase">${p.type === 'diapositivas' ? ((p.slides ? p.slides.length : (p.sheets ? p.sheets.length : 1)) + ' Diapositiva(s)') : ((p.sheets ? p.sheets.length : 1) + ' Hoja(s)')}</span>
                    <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span class="text-[9px] font-bold text-slate-400 uppercase">${new Date(p.updatedAt || Date.now()).toLocaleDateString()}</span>
                </div>
                <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                    ${shareBadgeHTML}
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
};

window.openNewProjectModal = function() {
            editingProjectId = null;
            document.getElementById('proj-modal-title').innerText = "Nuevo Documento";
            document.getElementById('proj-input-name').value = "";
            
            // Preseleccionar la pestaña de modelo activa en el modal
            const activeModel = window.currentModelTab || 'textos';
            selectProjectModel(activeModel);

            // Configurar textos y visibilidad específicos de cada pestaña
            const label = document.getElementById('proj-modal-entity-label');
            const selectorBlock = document.getElementById('project-model-selector-block');
            
            // Ocultar selector en todas las pestañas por redundancia
            if (selectorBlock) selectorBlock.style.display = "none";
            
            if (activeModel === 'calculo') {
                if (label) label.innerText = "Nombre de la Hoja de Cálculo";
                document.getElementById('proj-input-name').placeholder = `Hoja ${projects.length + 1}`;
            } else if (activeModel === 'lienzos') {
                if (label) label.innerText = "Nombre del Lienzo";
                document.getElementById('proj-input-name').placeholder = `Lienzo ${projects.length + 1}`;
            } else if (activeModel === 'diagramas') {
                if (label) label.innerText = "Nombre del Diagrama";
                document.getElementById('proj-input-name').placeholder = `Diagrama ${projects.length + 1}`;
            } else if (activeModel === 'diapositivas') {
                if (label) label.innerText = "Nombre de la Presentación";
                document.getElementById('proj-input-name').placeholder = `Presentación ${projects.length + 1}`;
            } else {
                if (label) label.innerText = "Nombre del Documento";
                document.getElementById('proj-input-name').placeholder = `Documento ${projects.length + 1}`;
            }

            // Ocultar las opciones que no corresponden a la pestaña activa
            ['textos', 'calculo', 'lienzos', 'diagramas', 'diapositivas', 'hojas'].forEach(m => {
                const optCard = document.getElementById(`model-opt-${m}`);
                if (optCard) {
                    optCard.style.display = (m === activeModel) ? 'flex' : 'none';
                }
            });

            updateCatalogOptions(null, 'MAESTRO');
            
            // Forzar reflow
            const modal = document.getElementById('project-modal');
            modal.style.display = 'flex';
            void modal.offsetWidth;
            
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
    if (!name) name = `Documento ${projects.length + 1}`;

    let catalogo = document.getElementById('proj-input-catalogo').value;
    let type = document.getElementById('proj-input-type').value || 'hojas';

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
        projects.unshift({
            id: targetProjId, name: name, catalogo: catalogo, type: type,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            sheets: [], bookCounter: 0
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
        showModal("Eliminar Documento", "¿Eliminar este documento permanentemente?", async () => {
            // Modo Soft Delete local
            projects = projects.filter(p => p.id !== id);
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
        if(confirm("¿Eliminar este documento permanentemente?")) {
            projects = projects.filter(p => p.id !== id);
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
    projects.unshift(copy);

    const pType = copy.type || window.currentModelTab || 'textos';
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
            console.error("Error sincronizando copia en la nube:", e);
        }
    }
};

window.openRenameModal = function(id) {
            editingProjectId = id;
            const p = projects.find(proj => proj.id === id);
            const pType = p.type || 'textos';
            document.getElementById('proj-modal-title').innerText = "Renombrar Documento";
            document.getElementById('proj-input-name').value = p.name;
            
            // Set type selector in rename modal
            selectProjectModel(pType);

            // Configurar textos y visibilidad específicos de cada tipo
            const label = document.getElementById('proj-modal-entity-label');
            const selectorBlock = document.getElementById('project-model-selector-block');
            
            // Ocultar selector en todas las pestañas por redundancia
            if (selectorBlock) selectorBlock.style.display = "none";
            
            if (pType === 'calculo') {
                if (label) label.innerText = "Nombre de la Hoja de Cálculo";
            } else if (pType === 'lienzos') {
                if (label) label.innerText = "Nombre del Lienzo";
            } else if (pType === 'diagramas') {
                if (label) label.innerText = "Nombre del Diagrama";
            } else if (pType === 'diapositivas') {
                if (label) label.innerText = "Nombre de la Presentación";
            } else {
                if (label) label.innerText = "Nombre del Documento";
            }

            // Ocultar las opciones que no corresponden al tipo de documento que se está renombrando
            ['textos', 'calculo', 'lienzos', 'diagramas', 'diapositivas', 'hojas'].forEach(m => {
                const optCard = document.getElementById(`model-opt-${m}`);
                if (optCard) {
                    optCard.style.display = (m === pType) ? 'flex' : 'none';
                }
            });

            updateCatalogOptions(null, p.catalogo || 'MAESTRO');
            
            // Forzar reflow
            const modal = document.getElementById('project-modal');
            modal.style.display = 'flex';
            void modal.offsetWidth;
            
            setTimeout(() => document.getElementById('proj-input-name').focus(), 100);
        }

window.openProject = function(id) {
    const p = projects.find(proj => proj.id === id);
    const pType = p ? (p.type || 'textos') : 'textos';
    localStorage.setItem('educonta_last_project_id', id);
    localStorage.setItem('educonta_docs_active_tab', pType); // Maintain tab state on return
    
    if (pType === 'lienzos') {
        window.location.href = 'editor-lienzos.html';
    } else if (pType === 'diagramas') {
        window.location.href = 'editor-diagramas.html';
    } else if (pType === 'diapositivas') {
        window.location.href = 'editor-diapositivas.html?id=' + encodeURIComponent(id);
    } else if (pType === 'textos') {
        window.location.href = 'editor-textos.html?id=' + encodeURIComponent(id);
    } else if (pType === 'calculo' || pType === 'hojas') {
        window.location.href = 'editor-hojas-calculo.html';
    } else {
        window.location.href = 'editor-textos.html';
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
    if (label) label.innerHTML = 'Arrastra tu archivo <span class="text-amber-500 font-extrabold">Excel (.xlsx, .xls, .csv)</span> o <span class="text-amber-600 font-extrabold">.edc</span> aquí';
    if (sub)   sub.textContent = 'o haz clic para explorar en tu dispositivo';
    if (icon)  icon.innerHTML = '<div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center"><i class="fas fa-file-excel text-2xl text-amber-500"></i></div>';

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
window.edcFileSelected = async function(file) {
    if (!file) return;

    const fileName = file.name || '';
    const fileExt = (fileName.split('.').pop() || '').toLowerCase();
    const allowedExtensions = ['xlsx', 'xls', 'csv', 'ods', 'tsv', 'edc'];

    // Validar extensión
    if (!allowedExtensions.includes(fileExt)) {
        const errMsg = 'Formato no soportado. Selecciona un archivo de Excel (.xlsx, .xls, .csv, .ods) o respaldo .edc.';
        setDropzoneError(errMsg);
        if (typeof showImportErrorModal === 'function') {
            showImportErrorModal({
                file: file,
                error: new Error(`La extensión ".${fileExt}" no es compatible con el módulo de Hojas de Cálculo.`),
                stage: 'Validación de formato de archivo',
                customMessage: errMsg
            });
        }
        return;
    }

    window._edcPendingFile = file;

    // Mostrar feedback de carga
    const label = document.getElementById('edc-dropzone-label');
    const sub = document.getElementById('edc-dropzone-sub');
    if (label) label.textContent = 'Analizando archivo...';
    if (sub) sub.textContent = 'Traduciendo celdas y estructura contable';

    try {
        let parsedDoc;
        if (typeof EduContaExcelImporter !== 'undefined') {
            parsedDoc = await EduContaExcelImporter.parseSpreadsheetFile(file);
        } else {
            throw new Error("El módulo EduContaExcelImporter no está cargado.");
        }

        window._edcPendingData = parsedDoc;

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
        const ficon = document.getElementById('import-file-icon');

        if (confirmArea) confirmArea.classList.remove('hidden');
        if (fname) fname.textContent = file.name;
        if (ficon) {
            ficon.className = fileExt === 'edc' ? 'fas fa-shield-alt text-amber-500' : 'fas fa-file-excel text-emerald-500';
        }
        if (fmeta) {
            const sheetCount = (parsedDoc.sheets && parsedDoc.sheets.length) || 1;
            const sizeKb = (file.size / 1024).toFixed(1);
            fmeta.textContent = `${fileExt.toUpperCase()} · ${sheetCount} hoja(s) · ${sizeKb} KB · Listo para importar`;
        }

    } catch (err) {
        console.error("Error al procesar archivo en dropzone:", err);
        setDropzoneError(err.message || 'Error al procesar el archivo');
        if (typeof showImportErrorModal === 'function') {
            showImportErrorModal({
                file: file,
                error: err,
                stage: 'Lectura y conversión de archivo',
                customMessage: err.message || 'No se pudo leer el archivo seleccionado.'
            });
        }
    }
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
        void dz.offsetWidth;
    }
    if (label) label.textContent = '⚠️ Archivo no procesable';
    if (sub)   sub.textContent = msg;
    if (icon)  icon.innerHTML = '<div class="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center"><i class="fas fa-times-circle text-2xl text-rose-400"></i></div>';
    window._edcPendingFile = null;
    window._edcPendingData = null;

    setTimeout(() => {
        const dz2 = document.getElementById('edc-dropzone');
        if (dz2 && dz2.classList.contains('file-error')) resetDropzone();
    }, 4000);
}

/** Confirmar importación: crea el documento nuevo y lo abre */
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
        const nuevoDocumento = JSON.parse(JSON.stringify(contenido));
        nuevoDocumento.id = 'proj_' + Date.now();
        nuevoDocumento.createdAt = new Date().toISOString();
        nuevoDocumento.updatedAt = new Date().toISOString();
        if (!nuevoDocumento.type) nuevoDocumento.type = 'calculo';

        if (pb) pb.style.width = '60%';

        // Guardar en localStorage de su bóveda respectiva (calculo / hojas)
        const pType = nuevoDocumento.type || 'calculo';
        const key = getProjectsStorageKey(pType);
        const allProjects = JSON.parse(localStorage.getItem(key) || '[]');
        allProjects.unshift(nuevoDocumento);
        localStorage.setItem(key, JSON.stringify(allProjects));
        localStorage.setItem('educonta_last_project_id', nuevoDocumento.id);
        localStorage.setItem('educonta_docs_active_tab', pType);
        
        if (pType === window.currentModelTab) {
            window.projects = allProjects;
        }

        if (pb) pb.style.width = '80%';

        // Intentar sincronizar con Supabase si hay sesión
        if (typeof supabaseClient !== 'undefined') {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session && typeof syncCurrentProjectWithSupabase === 'function') {
                    await syncCurrentProjectWithSupabase(nuevoDocumento, session.user.id, true);
                }
            } catch (_) { /* Sin sesión — guardado local completo */ }
        }

        if (pb) pb.style.width = '100%';

        // Éxito: cerrar modal y abrir el documento importado
        setTimeout(() => {
            closeImportEdcModal();
            if (typeof renderProjectGrid === 'function') renderProjectGrid();

            // Abrir directamente en el editor correspondiente
            if (typeof openProject === 'function') {
                openProject(nuevoDocumento.id);
            } else {
                window.location.href = 'editor-hojas-calculo.html?id=' + nuevoDocumento.id;
            }
        }, 400);

    } catch (err) {
        console.error('Error al importar documento:', err);
        setDropzoneError('Ocurrió un error al guardar el documento importado');
        if (typeof showImportErrorModal === 'function') {
            showImportErrorModal({
                file: window._edcPendingFile,
                error: err,
                stage: 'Guardado y persistencia en bóveda',
                customMessage: 'No se pudo registrar el documento importado en la memoria local.'
            });
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Importar y Abrir Documento';
        }
        if (pw) pw.style.display = 'none';
    }
};

// --- Interceptor global de drag: abrir modal automáticamente al soltar archivo en la ventana ---
(function() {
    let dragCounter = 0;
    window.addEventListener('dragenter', (e) => {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        dragCounter++;
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
        const activeModel = window.currentModelTab || 'textos';
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
                console.error("Error al archivar documentos en la nube:", e);
            }
        }

        window.selectedCards.forEach(id => {
            projects = projects.filter(p => p.id !== id);
        });
        
        localStorage.setItem(storageKey, JSON.stringify(projects));
        clearMultiSelection();
        renderProjectGrid();
        
        if (typeof showToast === 'function') {
            showToast('Elementos eliminados', 'success');
        }
        
        if (typeof syncAllLocalProjectsToCloud === 'function') {
            syncAllLocalProjectsToCloud();
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





// =========================================================
// GESTIÓN DE COMPARTIR DOCUMENTOS (EduConta SV)
// =========================================================
window.sharingDocId = null;

window.openDocShareModal = async function(id) {
    window.sharingDocId = id;
    const doc = (window.projects || []).find(p => p.id === id);
    if (!doc) {
        if (typeof showSyncToast === 'function') showSyncToast('error', 'Documento no encontrado');
        return;
    }

    if (!Array.isArray(doc.shared_with)) {
        doc.shared_with = [];
    }

    const titleEl = document.getElementById('share-modal-doc-title');
    const subEl = document.getElementById('share-modal-doc-subtitle');
    if (titleEl) titleEl.textContent = 'Compartir "' + (doc.name || 'Documento') + '"';
    if (subEl) subEl.textContent = doc.owner_name || doc.owner_email ? 'Propietario: ' + (doc.owner_name || doc.owner_email) : 'Gestiona quién tiene acceso a este archivo';

    // Obtener UID del usuario actual
    const uidDisplay = document.getElementById('share-my-uid-display');
    if (uidDisplay) {
        if (window.currentUserId) {
            uidDisplay.value = window.currentUserId;
        } else {
            try {
                if (typeof supabaseClient !== 'undefined') {
                    const { data: { session } } = await supabaseClient.auth.getSession();
                    if (session && session.user) {
                        window.currentUserId = session.user.id;
                        window.currentUserEmail = session.user.email;
                        uidDisplay.value = session.user.id;
                    } else {
                        uidDisplay.value = "Inicia sesión para ver tu ID";
                    }
                }
            } catch (e) {
                uidDisplay.value = "No disponible offline";
            }
        }
    }

    const inputTarget = document.getElementById('share-target-uid-input');
    if (inputTarget) inputTarget.value = '';

    renderDocCollaboratorsList();

    const modal = document.getElementById('share-modal');
    if (modal) modal.classList.add('active');
};

window.closeDocShareModal = function() {
    window.sharingDocId = null;
    const modal = document.getElementById('share-modal');
    if (modal) modal.classList.remove('active');
};

window.copyDocUserUID = async function() {
    const uidDisplay = document.getElementById('share-my-uid-display');
    const uid = uidDisplay ? uidDisplay.value : (window.currentUserId || '');
    if (!uid || uid.includes(' ')) {
        if (typeof showSyncToast === 'function') showSyncToast('error', 'Inicia sesión para copiar tu ID');
        return;
    }

    try {
        await navigator.clipboard.writeText(uid);
        const btn = document.getElementById('btn-copy-my-uid');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check text-emerald-500"></i> <span>¡Copiado!</span>';
            setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
        }
        if (typeof showSyncToast === 'function') showSyncToast('success', '¡UID copiado al portapapeles!');
    } catch (e) {
        if (uidDisplay) {
            uidDisplay.select();
            document.execCommand('copy');
            if (typeof showSyncToast === 'function') showSyncToast('success', '¡UID copiado!');
        }
    }
};

window.renderDocCollaboratorsList = function() {
    const listContainer = document.getElementById('doc-collaborators-list');
    const countEl = document.getElementById('share-collaborators-count');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const doc = (window.projects || []).find(p => p.id === window.sharingDocId);
    if (!doc || !Array.isArray(doc.shared_with) || doc.shared_with.length === 0) {
        if (countEl) countEl.textContent = '0 colaboradores';
        listContainer.innerHTML = `
            <div class="py-6 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <i class="fas fa-user-friends text-xl mb-2 text-slate-300 dark:text-slate-600"></i>
                <p>Este documento es privado. Solo tú tienes acceso.</p>
            </div>
        `;
        return;
    }

    if (countEl) countEl.textContent = doc.shared_with.length + ' colaborador' + (doc.shared_with.length === 1 ? '' : 'es');

    doc.shared_with.forEach((uid, index) => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs';
        
        const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const safeUid = esc(uid);
        const shortUid = esc(uid.length > 16 ? uid.substring(0, 8) + '...' + uid.substring(uid.length - 6) : uid);

        item.innerHTML = `
            <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                    ${index + 1}
                </div>
                <div class="min-w-0">
                    <p class="font-mono font-bold text-slate-700 dark:text-slate-300 truncate text-[11px] select-all" title="${safeUid}">${shortUid}</p>
                    <p class="text-[9px] text-slate-400 font-medium">Acceso Colaborador</p>
                </div>
            </div>
            <button onclick="removeDocCollaborator('${safeUid}')" 
                class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all shrink-0"
                title="Quitar acceso a este usuario">
                <i class="fas fa-trash-alt text-xs"></i>
            </button>
        `;
        listContainer.appendChild(item);
    });
};

window.addDocCollaborator = async function() {
    const input = document.getElementById('share-target-uid-input');
    if (!input) return;
    const targetUid = input.value.trim();

    if (!targetUid) {
        if (typeof showSyncToast === 'function') showSyncToast('error', 'Por favor ingresa o pega el UID del usuario');
        input.focus();
        return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetUid)) {
        if (typeof showSyncToast === 'function') showSyncToast('error', 'El UID ingresado no tiene un formato UUID válido');
        input.focus();
        return;
    }

    if (window.currentUserId && targetUid === window.currentUserId) {
        if (typeof showSyncToast === 'function') showSyncToast('error', 'No puedes añadir tu propio ID como colaborador');
        return;
    }

    const doc = (window.projects || []).find(p => p.id === window.sharingDocId);
    if (!doc) {
        if (typeof showSyncToast === 'function') showSyncToast('error', 'Documento no encontrado');
        return;
    }

    if (!Array.isArray(doc.shared_with)) doc.shared_with = [];

    if (doc.shared_with.includes(targetUid)) {
        if (typeof showSyncToast === 'function') showSyncToast('info', 'Este usuario ya tiene acceso al documento');
        return;
    }

    // Añadir colaborador
    doc.shared_with.push(targetUid);
    doc.updatedAt = new Date().toISOString();

    // Guardar en bóveda local
    const key = getProjectsStorageKey(doc.type || window.currentModelTab);
    localStorage.setItem(key, JSON.stringify(window.projects));

    // Sincronizar en Supabase
    try {
        if (typeof supabaseClient !== 'undefined') {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                await syncCurrentProjectWithSupabase(doc, session.user.id, true);
            }
        }
    } catch (e) {
        console.error('Error sincronizando colaborador:', e);
    }

    input.value = '';
    renderDocCollaboratorsList();
    renderProjectGrid();
    if (typeof showSyncToast === 'function') showSyncToast('success', '¡Colaborador añadido correctamente!');
};

window.removeDocCollaborator = async function(targetUid) {
    const doc = (window.projects || []).find(p => p.id === window.sharingDocId);
    if (!doc || !Array.isArray(doc.shared_with)) return;

    doc.shared_with = doc.shared_with.filter(u => u !== targetUid);
    doc.updatedAt = new Date().toISOString();

    // Guardar en bóveda local
    const key = getProjectsStorageKey(doc.type || window.currentModelTab);
    localStorage.setItem(key, JSON.stringify(window.projects));

    // Sincronizar en Supabase
    try {
        if (typeof supabaseClient !== 'undefined') {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                await syncCurrentProjectWithSupabase(doc, session.user.id, true);
            }
        }
    } catch (e) {
        console.error('Error sincronizando eliminación de colaborador:', e);
    }

    renderDocCollaboratorsList();
    renderProjectGrid();
    if (typeof showSyncToast === 'function') showSyncToast('success', 'Colaborador removido');
};

