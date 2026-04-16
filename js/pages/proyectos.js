// === Estado Global de Proyectos ===
window.projects = JSON.parse(localStorage.getItem('educonta_projects_v38')) || [];
window.syncedProjectIds = new Set(JSON.parse(localStorage.getItem('educonta_synced_ids')) || []);
window.proyecto_actual = null;
window.projectCounter = parseInt(localStorage.getItem('educonta_project_counter')) || 0;
window.editingProjectId = null;

// === Inicialización de la Vista ===
document.addEventListener('DOMContentLoaded', () => {
    // Invocar la función maestra en lugar de un render simple
    if(typeof window.initApp === 'function') {
        window.initApp();
    }
    
    // Cierra los menús desplegables al hacer clic fuera de ellos
    document.addEventListener('click', (e) => {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');

        // Cierra el panel del catálogo si se hace clic fuera del selector
        const selectorWrap = document.querySelector('.catalog-selector-wrap');
        if (selectorWrap && !selectorWrap.contains(e.target)) {
            const panel = document.getElementById('catalog-options-panel');
            const btn   = document.getElementById('catalog-current-btn');
            if (panel) panel.classList.remove('open');
            if (btn)   btn.classList.remove('open');
        }
    });
});

// === Control de Menú de Tarjetas ===
window.toggleProjMenu = function(id) {
    const menus = document.querySelectorAll('.dropdown-menu');
    menus.forEach(m => { if (m.id !== 'menu-' + id) m.style.display = 'none'; });
    const m = document.getElementById('menu-' + id);
    if (m) m.style.display = m.style.display === 'block' ? 'none' : 'block';
};
window.syncAllLocalProjectsToCloud = async function(session) {
            if (!session || !session.user || !projects || projects.length === 0) return;

            const cloudInd = document.getElementById('cloud-indicator');
            if (cloudInd) {
                cloudInd.classList.remove('hidden'); cloudInd.classList.add('flex');
                cloudInd.innerHTML = '<i class="fas fa-spinner fa-spin text-sky-500"></i> Sincronizando...';
            }

            try {
                for (const proj of projects) {
                    await syncCurrentProjectWithSupabase(proj, session.user.id, true);
                }
                const pm = document.getElementById('master-screen');
                if (!pm || pm.classList.contains('hidden')) {
                    renderProjectGrid();
                }
                if (cloudInd) cloudInd.innerHTML = '<i class="fas fa-cloud-check text-sky-500"></i> Sincronizado';
                if(typeof showSyncVerification === 'function') showSyncVerification();
            } catch (e) {
                console.error("Error global sync:", e);
                if (cloudInd) cloudInd.innerHTML = '<i class="fas fa-exclamation-triangle text-rose-500"></i> Error';
            }
        }

window.fetchProjectsFromCloud = async function() {
            if (typeof isAuditMode !== 'undefined' && isAuditMode) return false;
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (!session) return false;

                const { data, error } = await supabaseClient
                    .from('proyectos_contables')
                    .select('data')
                    .eq('user_id', session.user.id)
                    .eq('estado', 'activo');

                if (error) throw error;

                const savedStr = localStorage.getItem('educonta_projects_v38');
                const savedLocal = savedStr ? JSON.parse(savedStr) : [];

                if (data && data.length > 0) {
                    // Actualizar el conjunto de IDs sincronizados
                    data.forEach(row => {
                        if (row.data && row.data.id) syncedProjectIds.add(row.data.id);
                    });

                    const tempProjects = data.map(row => row.data);

                    // Mezclar proyectos de nube y locales, manteniendo el más reciente
                    const combinedMap = new Map();
                    savedLocal.forEach(p => { if (p && p.id) combinedMap.set(p.id, p); });

                    tempProjects.forEach(p => {
                        if (p && p.id) {
                            const existing = combinedMap.get(p.id);
                            if (!existing || new Date(p.updatedAt) > new Date(existing.updatedAt)) {
                                combinedMap.set(p.id, p);
                            }
                        }
                    });

                    const mergedProjects = Array.from(combinedMap.values());
                    mergedProjects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

                    projects = mergedProjects;
                    localStorage.setItem('educonta_projects_v38', JSON.stringify(projects));

                    // Sincronizar todos (útil si los locales eran más nuevos)
                    syncAllLocalProjectsToCloud(session);

                    const cloudInd = document.getElementById('cloud-indicator');
                    if (cloudInd) {
                        cloudInd.innerHTML = '<i class="fas fa-cloud text-sky-500"></i> Nube Ok';
                        cloudInd.classList.remove('hidden');
                        cloudInd.classList.add('flex');
                    }
                    return true;
                } else if (data && data.length === 0) {
                    // Regla vital: No borrar la memoria si el usuario tiene proyectos locales sin sincronizar
                    if (projects.length === 0 && savedLocal.length === 0) {
                        localStorage.removeItem('educonta_projects_v38');
                    } else if (savedLocal.length > 0) {
                        projects = savedLocal;
                        syncAllLocalProjectsToCloud(session);
                    }

                    const cloudInd = document.getElementById('cloud-indicator');
                    if (cloudInd) {
                        cloudInd.innerHTML = '<i class="fas fa-cloud-check text-sky-500"></i> Nube Ok';
                        cloudInd.classList.remove('hidden');
                        cloudInd.classList.add('flex');
                    }
                    return true;
                }
            } catch (err) {
                console.error("Error cargando de Supabase:", err);
            }
            return false;
        }

window.initApp = async function() {
            // Cargar Catálogo Maestro antes que los proyectos
            if(typeof loadCatalogoMaestro === 'function') await loadCatalogoMaestro();

            // FALLBACK LOCAL PRIORITARIO: Cargamos memoria local primero para evitar parpadeos y asegurar data.
            const saved = localStorage.getItem('educonta_projects_v38');
            if (saved) projects = JSON.parse(saved);

            // Luego re-sincronizamos con nube (nuestra nueva función maneja el merge correctamente)
            await fetchProjectsFromCloud();

            renderProjectGrid();

            const inputName = document.getElementById('proj-input-name');
            if(inputName) {
                inputName.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') saveProjectFromModal();
                });
            }
        }

window.saveProjectsToLocal = async function() {
            if (typeof isAuditMode !== 'undefined' && isAuditMode) return;
            // BACKUP LOCAL
            localStorage.setItem('educonta_projects_v38', JSON.stringify(projects));

            // INTENTO DE SINCRONIZACIÓN WEB SUPABASE
            try {
                if(typeof supabaseClient === 'undefined') return;
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session && typeof currentProjectId !== 'undefined' && currentProjectId) {
                    const cloudInd = document.getElementById('cloud-indicator');
                    if (cloudInd) {
                        cloudInd.classList.remove('hidden'); cloudInd.classList.add('flex');
                        cloudInd.innerHTML = '<i class="fas fa-spinner fa-spin text-sky-500"></i> Subiendo...';
                    }
                    // Activar animación de la viñeta de sincronización
                    if(typeof setSyncAnimating === 'function') setSyncAnimating(true);

                    const currentProj = projects.find(p => p.id === currentProjectId);
                    if (currentProj) {
                        try {
                            // Metodo seguro Upsert-like basado en JSONB
                            await syncCurrentProjectWithSupabase(currentProj, session.user.id);

                            if (cloudInd) cloudInd.innerHTML = '<i class="fas fa-cloud-check text-sky-500"></i> Sincronizado';
                            if(typeof setSyncAnimating === 'function') setSyncAnimating(false);
                        } catch (err) {
                            if (cloudInd) {
                                cloudInd.innerHTML = '<i class="fas fa-exclamation-triangle text-rose-500"></i> Error';
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
        }

window.syncCurrentProjectWithSupabase = async function(projectObj, userId, skipRender = false) {
            if(typeof supabaseClient === 'undefined') return;
            // 1. INYECCIÓN DE IDENTIDAD: Guardamos el nombre y correo dentro del proyecto 
            // para que el administrador pueda leerlo sin requerir permisos especiales de Supabase.
            const { data: authData } = await supabaseClient.auth.getUser();
            if (authData && authData.user) {
                projectObj.owner_email = authData.user.email;
                projectObj.owner_name = authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || '';
            }

            // Busca si ya existe un registro con este mismo ID de proyecto (usando el operador JSON)
            // Esto evita crear una fila nueva cada vez que se guarda
            const { data, error } = await supabaseClient
                .from('proyectos_contables')
                .select('id')
                .eq('user_id', userId)
                .eq('data->>id', projectObj.id)
                .limit(1);

            if (data && data.length > 0) {
                // Existe, hacer UPDATE en el registro exacto
                const { error: updateError } = await supabaseClient
                    .from('proyectos_contables')
                    .update({ data: projectObj, updated_at: new Date() })
                    .eq('id', data[0].id);
                if (updateError) throw updateError;
                syncedProjectIds.add(projectObj.id);
            } else {
                // Nuevo, hacer INSERT (Supabase generará el UUID PK para la fila)
                const { error: insertError } = await supabaseClient
                    .from('proyectos_contables')
                    .insert([{ user_id: userId, data: projectObj, estado: 'activo' }]);
                if (insertError) throw insertError;
                syncedProjectIds.add(projectObj.id);
            }

            // Refrescar UI si estamos en la vista de proyectos
            if (!skipRender) {
                const pm = document.getElementById('master-screen');
                if (!pm || pm.classList.contains('hidden')) {
                    renderProjectGrid();
                }
            }
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

window.renderProjectGrid = function() {
            const grid = document.getElementById('project-grid');
            const empty = document.getElementById('empty-projects');
            if (!grid) return;
            grid.innerHTML = '';

            if (projects.length === 0) {
                if (empty) empty.classList.remove('hidden');
                return;
            }
            if (empty) empty.classList.add('hidden');

            const fragment = document.createDocumentFragment();
            projects.forEach(p => {
                const card = document.createElement('div');
                card.className = 'project-card flex flex-col justify-between';
                card.onclick = () => openProject(p.id);
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 bg-sky-50 rounded-[36px] flex items-center justify-center">
                            <i class="fas fa-file-invoice text-sky-500 text-xl"></i>
                        </div>
                        <div class="relative">
                            <button onclick="event.stopPropagation(); toggleProjMenu('${p.id}')" class="text-slate-300 hover:text-slate-600 transition-colors p-2">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div id="menu-${p.id}" class="dropdown-menu">
                                <div class="dropdown-item" onclick="event.stopPropagation(); duplicateProject('${p.id}')"><i class="far fa-copy"></i> Duplicar</div>
                                <div class="dropdown-item" onclick="event.stopPropagation(); openRenameModal('${p.id}')"><i class="far fa-edit"></i> Renombrar</div>
                                <div class="dropdown-item text-rose-500 hover:text-rose-600" onclick="event.stopPropagation(); deleteProject('${p.id}')"><i class="far fa-trash-alt"></i> Borrar</div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-slate-800 text-lg mb-1 truncate">${p.name}</h4>
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-[9px] font-bold text-slate-400 uppercase">${p.sheets ? p.sheets.length : 0} Hojas</span>
                            <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span class="text-[9px] font-bold text-slate-400 uppercase">${new Date(p.updatedAt).toLocaleDateString()}</span>
                            <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span class="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-[36px] uppercase tracking-tighter">${p.catalogo || 'MAESTRO'}</span>
                        </div>
                        <div class="flex gap-2 mt-2">
                            ${syncedProjectIds.has(p.id) ?
                        '<span class="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 uppercase tracking-widest" title="Sincronizado"><i class="fas fa-cloud-check"></i> Sincronizado</span>' :
                        '<span class="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 uppercase tracking-widest" title="Local"><i class="fas fa-hdd"></i> Local</span>'}
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
            updateCatalogOptions(null, 'MAESTRO');
            document.getElementById('project-modal').style.display = 'flex';
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

    const isNew = !editingProjectId;
    let targetProjId = editingProjectId;

    if (editingProjectId) {
        const p = projects.find(proj => proj.id === editingProjectId);
        if (p) {
            p.name = name;
            p.catalogo = catalogo;
            p.updatedAt = new Date().toISOString();
        }
    } else {
        targetProjId = 'proj_' + Date.now();
        projects.unshift({
            id: targetProjId, name: name, catalogo: catalogo,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            sheets: [], bookCounter: 0
        });
    }

    // Save locally and render instantly for fast UI feedback
    localStorage.setItem('educonta_projects_v38', JSON.stringify(projects));

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
            saveProjectsToLocal();
            renderProjectGrid();
        }
    }
}

window.duplicateProject = function(id) {
            const p = projects.find(proj => proj.id === id);
            if (!p) return;
            const copy = JSON.parse(JSON.stringify(p));
            copy.id = 'proj_' + Date.now();
            copy.name += " (Copia)";
            copy.updatedAt = new Date().toISOString();
            projects.unshift(copy);
            saveProjectsToLocal();
            renderProjectGrid();
        }

window.openRenameModal = function(id) {
            editingProjectId = id;
            const p = projects.find(proj => proj.id === id);
            document.getElementById('proj-modal-title').innerText = "Renombrar Proyecto";
            document.getElementById('proj-input-name').value = p.name;
            updateCatalogOptions(null, p.catalogo || 'MAESTRO');
            document.getElementById('project-modal').style.display = 'flex';
            setTimeout(() => document.getElementById('proj-input-name').focus(), 100);
        }

window.openProject = function(id) {
    localStorage.setItem('educonta_last_project_id', id);
    window.location.href = 'editor.html';
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
    } else {
        panel.classList.add('open');
        btn.classList.add('open');
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
    if (panel) panel.classList.remove('open');
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
            const contenido = JSON.parse(e.target.result);

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
        nuevoProyecto.sheets    = proyectoBruto?.sheets || [];
        nuevoProyecto.bookCounter = proyectoBruto?.bookCounter || 0;

        if (pb) pb.style.width = '60%';

        // Guardar en localStorage
        const allProjects = JSON.parse(localStorage.getItem('educonta_projects_v38') || '[]');
        allProjects.unshift(nuevoProyecto);
        localStorage.setItem('educonta_projects_v38', JSON.stringify(allProjects));
        window.projects = allProjects;

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
