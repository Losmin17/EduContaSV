/**
 * state.js — TextDocStateManager
 * Estado global, proyectos, undo/redo, autosave y sync cloud.
 * EduConta SV
 */
import { STORAGE_KEY, LAST_ID_KEY, MAX_HISTORY, SPECIAL_SYMBOLS, MARGIN_PRESETS } from './constants.js';
import { MultiPageEngine } from './engine.js';
import { DocStatsManager } from './stats.js';
import { CollabPresenceManager } from './collab.js';
import { ImageLayerManager } from './images.js';
import { AuditModeHandler } from './audit.js';
import { initColorPresetsGrid } from './color-picker.js';

const TextDocStateManager = {
        projects: [],
        currentProject: null,
        activeSheetIndex: 0,
        historyStack: [],
        historyIndex: -1,
        autoSaveTimer: null,
        historyTimer: null,
        // DT-3: Candado anti-concurrencia para sincronización cloud
        _syncPending: false,
        cloudSyncTimer: null,

        async init() {
            // 1. Inyectar Componentes Compartidos (Navbar, Auth)
            try {
                if (typeof window.injectSharedUI === 'function') {
                    window.injectSharedUI('shared-components-root');
                }
            } catch (e) {
                console.warn('Error inyectando componentes compartidos:', e);
            }

            // 2. Mostrar botón Volver en Navbar si aplica
            setTimeout(() => {
                const btnVolver = document.getElementById('btn-volver');
                if (btnVolver && !window.isAuditMode) {
                    btnVolver.classList.remove('hidden');
                }
            }, 60);

            // 3. Cargar proyectos (esperar en caso de carga remota de Supabase)
            await this.loadProjects();

            // 4. Poblar grid de símbolos y colores presets
            this.populateSymbols();
            initColorPresetsGrid();

            // 5. Inicializar Presencia Colaborativa con Supabase
            if (this.currentProject) {
                CollabPresenceManager.init(this.currentProject.id);
            }

            // 6. Inicializar Gestor de Capas, Editor de Imagen y Recorte
            ImageLayerManager.init();
            if (window.ImageEditorManager?.init) window.ImageEditorManager.init();
            if (window.ImageCropManager?.init) window.ImageCropManager.init();

            // 7. Modo auditoría
            if (window.isAuditMode) {
                AuditModeHandler.apply();
            }

            // 8. Esperar a que las fuentes y el renderizado inicial de páginas se estabilicen antes de desvanecer el preloader
            if (document.fonts && document.fonts.ready) {
                try { await document.fonts.ready; } catch (e) {}
            }
            setTimeout(() => {
                if (typeof window.dismissGlobalPreloader === 'function') {
                    window.dismissGlobalPreloader();
                }
            }, 80);

            // 9. Activar inmediatamente el cursor en la hoja al entrar al editor
            if (!window.isAuditMode && this.getUserRole() !== 'lector') {
                requestAnimationFrame(() => {
                    MultiPageEngine.focusActiveEditor(true);
                });
                setTimeout(() => {
                    MultiPageEngine.focusActiveEditor(true);
                }, 120);
                setTimeout(() => {
                    MultiPageEngine.focusActiveEditor(true);
                }, 320);
            }
        },

        async loadProjects() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                this.projects = raw ? JSON.parse(raw) : [];
            } catch (e) {
                this.projects = [];
            }

            const urlParams = new URLSearchParams(window.location.search);
            const paramId = urlParams.get('id');
            const lastId = paramId || localStorage.getItem(LAST_ID_KEY);

            if (this.projects.length > 0) {
                this.currentProject = this.projects.find(p => p.id === lastId) || this.projects[0];
            }

            // Si se especificó un id por URL (?id=... / ?collab=true) y no está en la lista local, intentar cargar de Supabase
            if ((!this.currentProject || this.currentProject.id !== paramId) && paramId && typeof window.supabaseClient !== 'undefined') {
                try {
                    const { data, error } = await window.supabaseClient
                        .from('proyectos_contables')
                        .select('*')
                        .eq('data->>id', paramId)
                        .maybeSingle();

                    if (data && data.data) {
                        this.currentProject = data.data;
                        const existingIdx = this.projects.findIndex(p => p.id === this.currentProject.id);
                        if (existingIdx !== -1) {
                            this.projects[existingIdx] = this.currentProject;
                        } else {
                            this.projects.unshift(this.currentProject);
                        }
                        this.saveToStorage();
                    }
                } catch (err) {
                    console.warn("No se pudo cargar documento remoto desde Supabase por ID:", err);
                }
            }

            // Si se especificó un id por URL y no está en textos ni en Supabase, buscarlo en otras bóvedas locales
            if ((!this.currentProject || this.currentProject.id !== lastId) && paramId) {
                const otherVaults = ['educonta_projects_calculo', 'educonta_projects_lienzos', 'educonta_projects_diagramas'];
                for (const vKey of otherVaults) {
                    try {
                        const list = JSON.parse(localStorage.getItem(vKey)) || [];
                        const found = list.find(p => p.id === paramId);
                        if (found) {
                            found.type = 'textos';
                            this.projects.unshift(found);
                            this.currentProject = found;
                            this.saveToStorage();
                            break;
                        }
                    } catch(e) {}
                }
            }

            // Crear documento por defecto si no existe ninguno
            if (!this.currentProject) {
                const defaultProject = {
                    id: 'doc_textos_' + Date.now(),
                    name: 'Documento Sin Título',
                    type: 'textos',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    shared_with: [],
                    sheets: [
                        {
                            name: 'Página Inicial',
                            pageSize: 'letter',
                            orientation: 'portrait',
                            margins: { top: 25, bottom: 25, left: 25, right: 25 },
                            marginPreset: 'normal',
                            lineSpacing: '15',
                            headerFooter: {
                                showHeader: false,
                                showFooter: false,
                                headerText: '',
                                footerText: '',
                                showPageNumbers: false
                            },
                            content: '<h1>Documento Sin Título</h1><p>Comienza a redactar tu documento contable o empresarial aquí...</p>'
                        }
                    ]
                };
                this.projects = [defaultProject];
                this.currentProject = defaultProject;
                this.saveToStorage();
            }

            localStorage.setItem(LAST_ID_KEY, this.currentProject.id);

            // Asegurar estructura
            if (!this.currentProject.sheets || this.currentProject.sheets.length === 0) {
                this.currentProject.sheets = [{
                    name: 'Página Inicial',
                    pageSize: 'letter',
                    orientation: 'portrait',
                    margins: { top: 25, bottom: 25, left: 25, right: 25 },
                    marginPreset: 'normal',
                    lineSpacing: '15',
                    fontFamily: 'Plus Jakarta Sans',
                    headerFooter: {
                        showHeader: false,
                        showFooter: false,
                        headerText: '',
                        footerText: '',
                        showPageNumbers: false
                    },
                    content: '<p></p>'
                }];
            }

            if (!Array.isArray(this.currentProject.shared_with)) {
                this.currentProject.shared_with = [];
            }

            // Actualizar título en interfaz y pestaña
            const titleEl = document.getElementById('current-project-name');
            if (titleEl) {
                titleEl.textContent = this.currentProject.name || 'Sin Nombre';
            }
            if (this.currentProject.name) {
                document.title = `${this.currentProject.name} | EduConta SV`;
            }

            // Cargar selector de secciones y renderizar páginas
            this.activeSheetIndex = 0;
            this.renderSheetSelect();
            this.loadActiveSheet();
        },

        loadActiveSheet() {
            const sheet = this.currentProject.sheets[this.activeSheetIndex];
            if (!sheet) return;

            // Extraer contenido HTML
            let contentHTML = '';
            if (sheet.content) {
                contentHTML = sheet.content;
            } else if (sheet.pages && Array.isArray(sheet.pages)) {
                contentHTML = sheet.pages.join('');
            } else {
                contentHTML = '<p></p>';
            }

            // Asegurar estructura de márgenes y tipografía
            if (typeof sheet.margins === 'string') {
                sheet.marginPreset = sheet.margins;
                sheet.margins = MARGIN_PRESETS[sheet.margins] || MARGIN_PRESETS.normal;
            } else if (!sheet.margins) {
                sheet.margins = MARGIN_PRESETS.normal;
                sheet.marginPreset = 'normal';
            }
            if (!sheet.orientation) sheet.orientation = 'portrait';
            if (!sheet.pageSize) sheet.pageSize = 'letter';
            if (!sheet.lineSpacing) sheet.lineSpacing = '15';
            if (!sheet.fontFamily) sheet.fontFamily = 'Plus Jakarta Sans';

            // Asegurar configuración de encabezado y pie
            if (!sheet.headerFooter) {
                sheet.headerFooter = {
                    showHeader: false,
                    showFooter: false,
                    headerText: '',
                    footerText: '',
                    showPageNumbers: false
                };
            }

            // Aplicar geometría y tipografía en pantalla
            window.PageLayoutManager?.applyPageGeometry(sheet.pageSize, sheet.margins, sheet.lineSpacing, sheet.orientation, sheet.fontFamily);

            // Inicializar el cuerpo unificado en el DOM
            MultiPageEngine.loadContent(contentHTML);

            // Historial inicial
            this.historyStack = [MultiPageEngine.getCleanHTML()];
            this.historyIndex = 0;
            this.updateUndoRedoUI();

            // Actualizar estadísticas
            DocStatsManager.update();

            // Aplicar permisos según rol (editor vs lector)
            this.checkAndApplyPermissions();

            // Sincronizar corrector de ortografía
            window.SpellCheckManager?.applyToAllSurfaces();

            // Enfocar la hoja automáticamente al cargar o cambiar de sección si tiene permisos de edición
            if (!window.isAuditMode && this.getUserRole() !== 'lector') {
                requestAnimationFrame(() => {
                    MultiPageEngine.focusActiveEditor(true);
                });
            }
        },

        getUserRole() {
            if (window.isAuditMode) return 'lector';
            if (!this.currentProject) return 'editor';

            const myUid = CollabPresenceManager.currentUserId;
            // Si el proyecto tiene owner_id y coincide con el usuario actual o no hay owner_id fijado -> admin/owner
            if (!this.currentProject.owner_id || (myUid && this.currentProject.owner_id === myUid)) {
                return 'owner';
            }

            // Si es un colaborador invitado, verificar su rol configurado
            if (myUid && this.currentProject.collaborator_roles && this.currentProject.collaborator_roles[myUid]) {
                return this.currentProject.collaborator_roles[myUid];
            }

            return 'editor';
        },

        checkAndApplyPermissions() {
            const role = this.getUserRole();
            const isReadOnly = (role === 'lector' || window.isAuditMode);

            document.querySelectorAll('.page-editor-surface').forEach(surface => {
                surface.setAttribute('contenteditable', isReadOnly ? 'false' : 'true');
            });

            // Si es modo lectura, deshabilitar herramientas de formato
            const formattingTools = document.querySelectorAll('.tool-btn:not(#btn-theme-toggle):not(#btn-zoom-in):not(#btn-zoom-out):not(#btn-reset-zoom):not(#btn-find-replace), #font-family-select, #font-size-select, #block-style-select, #page-size-select, #page-margins-select, #page-spacing-select, #text-color-input, #bg-color-input');
            formattingTools.forEach(el => {
                if (isReadOnly) {
                    el.disabled = true;
                    el.style.opacity = '0.4';
                    el.style.pointerEvents = 'none';
                } else if (!window.isAuditMode) {
                    el.disabled = false;
                    el.style.opacity = '1';
                    el.style.pointerEvents = 'auto';
                }
            });

            // Banner o etiqueta en cabecera si es modo lectura
            const titleContainer = document.querySelector('.editor-doc-title-container');
            let roleBadge = document.getElementById('user-role-mode-badge');
            if (role === 'lector') {
                if (!roleBadge && titleContainer) {
                    roleBadge = document.createElement('span');
                    roleBadge.id = 'user-role-mode-badge';
                    roleBadge.className = 'px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center gap-1 shrink-0';
                    roleBadge.innerHTML = '<i class="fas fa-book-open text-[8px]"></i> Modo Lectura';
                    titleContainer.appendChild(roleBadge);
                }
            } else if (roleBadge) {
                roleBadge.remove();
            }
        },

        triggerAutoSave() {
            if (this.getUserRole() === 'lector' || window.isAuditMode) return;
            if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = setTimeout(() => {
                this.saveState();
            }, 1800);
        },

        // DT-3: Sync cloud diferido con candado anti-concurrencia.
        // Se espera 5 s desde el último cambio antes de enviar. Si ya hay un
        // request en vuelo (_syncPending), se descarta la llamada: el request
        // activo ya lleva la versión más reciente gracias al guardado local previo.
        triggerCloudSync() {
            if (this.getUserRole() === 'lector' || window.isAuditMode) return;
            if (this.cloudSyncTimer) clearTimeout(this.cloudSyncTimer);
            this.cloudSyncTimer = setTimeout(async () => {
                if (this._syncPending) return; // request anterior aún en vuelo
                this._syncPending = true;
                try {
                    await this.syncCloud(false);
                } finally {
                    this._syncPending = false;
                }
            }, 5000);
        },

        saveState() {
            if (!this.currentProject || this.getUserRole() === 'lector' || window.isAuditMode) return;

            const sheet = this.currentProject.sheets[this.activeSheetIndex];
            if (sheet) {
                const cleanHTML = MultiPageEngine.getCleanHTML();
                sheet.content = cleanHTML;
                sheet.pages = [cleanHTML];
            }
            this.currentProject.updatedAt = new Date().toISOString();

            const pIdx = this.projects.findIndex(p => p.id === this.currentProject.id);
            if (pIdx !== -1) {
                this.projects[pIdx] = this.currentProject;
            } else {
                this.projects.unshift(this.currentProject);
            }

            // DT-3: Guardar localmente de inmediato y delegar el cloud al timer con candado
            this.saveToStorage();
            this.triggerCloudSync();
            CollabPresenceManager.broadcastUpdate(this.currentProject);
        },

        saveToStorage() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projects));
                if (this.currentProject) {
                    localStorage.setItem(LAST_ID_KEY, this.currentProject.id);
                }
            } catch (e) {
                console.error('Error guardando en localStorage:', e);
            }
        },

        updateSyncUI(state, detail = "") {
            const saveInd = document.getElementById('save-indicator');
            const cloudInd = document.getElementById('cloud-indicator');
            
            if (saveInd) {
                saveInd.className = "flex items-center justify-center gap-1 px-2 h-7 w-[64px] min-w-[64px] max-w-[64px] rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 shrink-0 select-none";
                saveInd.innerHTML = '<i class="fas fa-check-circle text-[9px]"></i> <span>LOCAL</span>';
            }

            if (!cloudInd) return;

            if (!navigator.onLine && state !== 'offline') {
                state = 'offline';
            }

            if (state === 'syncing') {
                cloudInd.className = "flex items-center justify-center gap-1 px-2 h-7 w-[118px] min-w-[118px] max-w-[118px] rounded-full text-[9px] font-bold bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40 shrink-0 animate-pulse select-none";
                cloudInd.innerHTML = '<i class="fas fa-sync fa-spin text-[9px]"></i> <span class="truncate">SINCRONIZANDO</span>';
            } else if (state === 'success' || state === 'online') {
                cloudInd.className = "flex items-center justify-center gap-1 px-2 h-7 w-[118px] min-w-[118px] max-w-[118px] rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 shrink-0 select-none";
                cloudInd.innerHTML = '<i class="fas fa-cloud-check text-[9px]"></i> <span class="truncate">SINCRONIZADO</span>';
            } else if (state === 'offline') {
                cloudInd.className = "flex items-center justify-center gap-1 px-2 h-7 w-[118px] min-w-[118px] max-w-[118px] rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 shrink-0 select-none";
                cloudInd.innerHTML = '<i class="fas fa-wifi-slash text-[9px]"></i> <span class="truncate">OFFLINE</span>';
            } else if (state === 'local') {
                cloudInd.className = "flex items-center justify-center gap-1 px-2 h-7 w-[118px] min-w-[118px] max-w-[118px] rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0 select-none";
                cloudInd.innerHTML = '<i class="fas fa-hdd text-[9px]"></i> <span class="truncate">SOLO LOCAL</span>';
            } else if (state === 'error') {
                cloudInd.className = "flex items-center justify-center gap-1 px-2 h-7 w-[118px] min-w-[118px] max-w-[118px] rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 shrink-0 select-none";
                cloudInd.innerHTML = '<i class="fas fa-exclamation-triangle text-[9px]"></i> <span class="truncate">ERROR SYNC</span>';
            }
        },

        async syncCloud(isManual = false) {
            if (window.isAuditMode) return;

            if (!navigator.onLine) {
                this.updateSyncUI('offline');
                if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('offline');
                return;
            }

            if (typeof window.supabaseClient === 'undefined') {
                this.updateSyncUI('local');
                if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('local', 'Guardado en este equipo');
                return;
            }

            try {
                const { data: { session } } = await window.supabaseClient.auth.getSession().catch(() => ({ data: { session: null } }));
                if (session && typeof window.syncCurrentProjectWithSupabase === 'function') {
                    this.updateSyncUI('syncing');

                    await window.syncCurrentProjectWithSupabase(this.currentProject, session.user.id, true);
                    
                    this.updateSyncUI('success');
                    if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('success', 'Documento respaldado con éxito');
                } else {
                    this.updateSyncUI('local');
                    if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('local', 'Guardado en este equipo');
                }
            } catch (e) {
                console.error("Error sincronizando documento de texto:", e);
                const errMsg = e.message || String(e);
                this.updateSyncUI('error', errMsg);
                if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('error', errMsg);
            }
        },

        saveStateManual() {
            this.saveState();
            // DT-3: Cancelar el timer diferido y el candado para forzar sync inmediato en guardado manual
            if (this.cloudSyncTimer) {
                clearTimeout(this.cloudSyncTimer);
                this.cloudSyncTimer = null;
            }
            this._syncPending = false;
            this.syncCloud(true);
            const btn = document.getElementById('btn-save-doc');
            if (btn) {
                const icon = document.getElementById('btn-save-toolbar-icon') || btn.querySelector('i');
                const textSpan = document.getElementById('btn-save-doc-text') || btn.querySelector('span');
                if (icon && textSpan) {
                    icon.className = 'fas fa-check text-[11px]';
                    textSpan.textContent = '¡Guardado!';
                    btn.classList.replace('bg-emerald-600', 'bg-emerald-500');
                    setTimeout(() => {
                        icon.className = 'fas fa-cloud text-[11px]';
                        textSpan.textContent = 'Guardar';
                        btn.classList.replace('bg-emerald-500', 'bg-emerald-600');
                    }, 1600);
                } else {
                    const orig = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check text-[11px]" id="btn-save-toolbar-icon"></i><span id="btn-save-doc-text" class="text-xs font-bold leading-none">¡Guardado!</span>';
                    btn.classList.replace('bg-emerald-600', 'bg-emerald-500');
                    setTimeout(() => {
                        btn.innerHTML = orig;
                        btn.classList.replace('bg-emerald-500', 'bg-emerald-600');
                    }, 1600);
                }
            }
            const btnToolbar = document.getElementById('btn-save-toolbar');
            if (btnToolbar) {
                const icon = document.getElementById('btn-save-toolbar-icon');
                if (icon) {
                    icon.className = 'fas fa-check text-[11px] text-emerald-500';
                    setTimeout(() => {
                        icon.className = 'fas fa-cloud text-[11px]';
                    }, 1600);
                }
            }
        },

        debouncePushHistory() {
            if (this.historyTimer) clearTimeout(this.historyTimer);
            this.historyTimer = setTimeout(() => {
                this.pushHistory();
            }, 600);
        },

        pushHistory() {
            const currentHTML = MultiPageEngine.getCleanHTML();
            if (this.historyStack[this.historyIndex] === currentHTML) return;

            this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
            this.historyStack.push(currentHTML);

            if (this.historyStack.length > MAX_HISTORY) {
                this.historyStack.shift();
            } else {
                this.historyIndex++;
            }
            this.updateUndoRedoUI();
        },

        undo() {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                const html = this.historyStack[this.historyIndex];
                MultiPageEngine.loadContent(html);
                this.updateUndoRedoUI();
                DocStatsManager.update();
                this.triggerAutoSave();
            }
        },

        redo() {
            if (this.historyIndex < this.historyStack.length - 1) {
                this.historyIndex++;
                const html = this.historyStack[this.historyIndex];
                MultiPageEngine.loadContent(html);
                this.updateUndoRedoUI();
                DocStatsManager.update();
                this.triggerAutoSave();
            }
        },

        updateUndoRedoUI() {
            const isUndoDisabled = (this.historyIndex <= 0);
            const isRedoDisabled = (this.historyIndex >= this.historyStack.length - 1);
            
            ['btn-undo', 'btn-undo-toolbar'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.disabled = isUndoDisabled;
                    el.style.opacity = isUndoDisabled ? '0.45' : '1';
                }
            });

            ['btn-redo', 'btn-redo-toolbar'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.disabled = isRedoDisabled;
                    el.style.opacity = isRedoDisabled ? '0.45' : '1';
                }
            });
        },

        // --- Gestión de Secciones / Hojas ---
        renderSheetSelect() {
            const select = document.getElementById('textos-sheet-select');
            if (!select || !this.currentProject) return;

            select.innerHTML = '';
            this.currentProject.sheets.forEach((sheet, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = sheet.name || `Sección ${idx + 1}`;
                if (idx === this.activeSheetIndex) opt.selected = true;
                select.appendChild(opt);
            });
        },

        switchSheet(idx) {
            const newIndex = parseInt(idx, 10);
            if (isNaN(newIndex) || newIndex < 0 || newIndex >= this.currentProject.sheets.length) return;

            if (this.currentProject.sheets[this.activeSheetIndex]) {
                this.currentProject.sheets[this.activeSheetIndex].content = MultiPageEngine.getCleanHTML();
            }

            this.activeSheetIndex = newIndex;
            this.loadActiveSheet();
            this.renderSheetSelect();

            if (CollabPresenceManager.channel && CollabPresenceManager.currentUserId) {
                CollabPresenceManager.channel.track({
                    user_id: CollabPresenceManager.currentUserId,
                    user_name: CollabPresenceManager.userName,
                    user_color: CollabPresenceManager.userColor,
                    active_sheet_idx: this.activeSheetIndex,
                    online_at: new Date().toISOString()
                }).catch(() => {});
            }
        },

        openNewSheetModal() {
            const modal = document.getElementById('sheet-modal');
            if (!modal) return;
            const input = document.getElementById('sheet-input-name');
            if (input) {
                input.value = `Sección ${this.currentProject.sheets.length + 1}`;
            }
            modal.style.display = 'flex';
            setTimeout(() => input?.focus(), 80);
        },

        closeSheetModal() {
            const modal = document.getElementById('sheet-modal');
            if (modal) modal.style.display = 'none';
        },

        saveSheetFromModal() {
            const input = document.getElementById('sheet-input-name');
            const name = input ? input.value.trim() : '';
            const sheetName = name || `Sección ${this.currentProject.sheets.length + 1}`;

            if (this.currentProject.sheets[this.activeSheetIndex]) {
                this.currentProject.sheets[this.activeSheetIndex].content = MultiPageEngine.getCleanHTML();
            }

            const newSheet = {
                name: sheetName,
                pageSize: 'letter',
                orientation: 'portrait',
                margins: { top: 25, bottom: 25, left: 25, right: 25 },
                marginPreset: 'normal',
                lineSpacing: '15',
                fontFamily: 'Plus Jakarta Sans',
                headerFooter: {
                    showHeader: false,
                    showFooter: false,
                    headerText: '',
                    footerText: '',
                    showPageNumbers: false
                },
                content: '<p></p>'
            };

            this.currentProject.sheets.push(newSheet);

            this.saveState();
            this.activeSheetIndex = this.currentProject.sheets.length - 1;
            this.renderSheetSelect();
            this.loadActiveSheet();
            this.closeSheetModal();
            this.showToast(`Sección "${sheetName}" creada`);
            CollabPresenceManager.broadcastSheetEvent('add', newSheet, this.activeSheetIndex);
        },

        duplicateCurrentSheet() {
            const currentSheet = this.currentProject.sheets[this.activeSheetIndex];
            if (!currentSheet) return;

            currentSheet.content = MultiPageEngine.getCleanHTML();
            const duplicate = JSON.parse(JSON.stringify(currentSheet));
            duplicate.name += ' (Copia)';
            if (!duplicate.fontFamily) duplicate.fontFamily = currentSheet.fontFamily || 'Plus Jakarta Sans';
            this.currentProject.sheets.push(duplicate);

            this.saveState();
            this.activeSheetIndex = this.currentProject.sheets.length - 1;
            this.renderSheetSelect();
            this.loadActiveSheet();
            this.showToast('Sección duplicada');
            CollabPresenceManager.broadcastSheetEvent('duplicate', duplicate, this.activeSheetIndex);
        },

        confirmDeleteSheet() {
            if (this.currentProject.sheets.length <= 1) {
                alert('El documento debe contener al menos una sección activa.');
                return;
            }

            const sheetName = this.currentProject.sheets[this.activeSheetIndex].name;
            if (confirm(`¿Estás seguro de que deseas eliminar la sección "${sheetName}"?`)) {
                this.currentProject.sheets.splice(this.activeSheetIndex, 1);
                this.activeSheetIndex = 0;
                this.saveState();
                this.renderSheetSelect();
                this.loadActiveSheet();
                this.showToast(`Sección "${sheetName}" eliminada`);
                CollabPresenceManager.broadcastSheetEvent('delete', null, 0);
            }
        },

        populateSymbols() {
            const grid = document.getElementById('symbols-grid');
            if (!grid) return;
            // DT-2: Guarda de reentrancia — evita reconstruir el DOM si ya está poblado
            if (grid.children.length > 0) return;
            SPECIAL_SYMBOLS.forEach(sym => {
                const btn = document.createElement('button');
                btn.className = 'w-9 h-9 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-white dark:bg-slate-800 dark:hover:bg-amber-500 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center justify-center transition-all shadow-sm';
                btn.textContent = sym;
                btn.onclick = () => {
                    window.EduContaTextEngine?.insertTextAtCursor(sym);
                    window.EduContaTextEngine?.closeSymbolsModal();
                };
                grid.appendChild(btn);
            });
        },

        renameProject(newName) {
            if (!this.currentProject || window.isAuditMode) return;
            const trimmed = (newName || '').trim();
            if (!trimmed) return;
            this.currentProject.name = trimmed;
            const titleEl = document.getElementById('current-project-name');
            if (titleEl) titleEl.textContent = trimmed;
            document.title = `${trimmed} | EduConta SV`;
            this.saveState();
            this.syncCloud(false);
            if (typeof window.showSyncToast === 'function') {
                window.showSyncToast('success', 'Nombre actualizado');
            }
        },

        openRenameModal() {
            if (window.isAuditMode || !this.currentProject) return;
            const modal = document.getElementById('rename-doc-modal');
            const input = document.getElementById('rename-doc-input');
            if (modal && input) {
                input.value = this.currentProject.name || '';
                modal.classList.add('active');
                setTimeout(() => {
                    input.focus();
                    input.select();
                }, 100);
            }
        },

        closeRenameModal() {
            const modal = document.getElementById('rename-doc-modal');
            if (modal) modal.classList.remove('active');
        },

        saveRenameFromModal() {
            const input = document.getElementById('rename-doc-input');
            if (!input) return;
            const newName = input.value.trim();
            if (newName) {
                this.renameProject(newName);
            }
            this.closeRenameModal();
        },

        promptRename() {
            this.openRenameModal();
        },

        async closeProject() {
            this.saveState();
            try {
                await this.syncCloud(false);
            } catch (e) {}
            window.location.href = 'documentos.html';
        },

        showToast(message) {
            const toast = document.getElementById('sync-toast');
            if (!toast) return;
            const desc = toast.querySelector('p');
            if (desc) desc.textContent = message;
            toast.classList.remove('translate-y-32', 'opacity-0');
            setTimeout(() => {
                toast.classList.add('translate-y-32', 'opacity-0');
            }, 3000);
        }
    };

    // =====================================================================
    // 2. MOTOR DE HOJAS FÍSICAS INDIVIDUALES (MultiPageEngine)
export { TextDocStateManager };