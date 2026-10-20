/**
 * collab.js — CollabPresenceManager
 * Colaboración en tiempo real y presencia con Supabase Realtime.
 * EduConta SV
 */
import { TextDocStateManager } from './state.js';
import { MultiPageEngine } from './engine.js';
import { PageLayoutManager } from './layout.js';
import { DocStatsManager } from './stats.js';
    const CollabPresenceManager = {
        channel: null,
        dbChannel: null,
        currentUserId: null,
        currentUserEmail: null,
        userName: null,
        userColor: null,
        presences: {},
        contentThrottleTimer: null,
        lastBroadcastHTML: '',

        PALETTE: [
            '#0ea5e9', '#10b981', '#8b5cf6', '#f43f5e', 
            '#f59e0b', '#06b6d4', '#ec4899', '#3b82f6', '#14b8a6'
        ],

        async init(projectId) {
            if (!projectId) return;

            // 1. Obtener usuario de Supabase Auth o generar perfil consistente para invitados
            let session = null;
            if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) {
                try {
                    const res = await window.supabaseClient.auth.getSession();
                    session = res.data?.session;
                } catch (e) {}
            }

            if (session && session.user) {
                this.currentUserId = session.user.id;
                this.currentUserEmail = session.user.email;
                this.userName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario';
            } else {
                let storedUid = sessionStorage.getItem('educonta_collab_uid');
                if (!storedUid) {
                    storedUid = 'guest_' + Math.random().toString(36).substring(2, 9);
                    sessionStorage.setItem('educonta_collab_uid', storedUid);
                }
                this.currentUserId = storedUid;
                this.userName = sessionStorage.getItem('educonta_collab_name') || `Invitado ${Math.floor(100 + Math.random() * 900)}`;
                this.currentUserEmail = '';
            }

            // Asignar color distintivo según el hash del ID
            let hash = 0;
            for (let i = 0; i < this.currentUserId.length; i++) hash += this.currentUserId.charCodeAt(i);
            this.userColor = this.PALETTE[Math.abs(hash) % this.PALETTE.length];

            this.renderPresenceUI();

            // 2. Conectar a Supabase Realtime si está disponible
            if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) {
                try {
                    if (this.channel) {
                        window.supabaseClient.removeChannel(this.channel);
                    }

                    // Canal Broadcast y Presencia
                    this.channel = window.supabaseClient
                        .channel(`collab-textos-${projectId}`, {
                            config: {
                                presence: { key: this.currentUserId },
                                broadcast: { ack: false }
                            }
                        });

                    this.channel
                        // Presencia (Usuarios Conectados)
                        .on('presence', { event: 'sync' }, () => this.handlePresenceSync())
                        .on('presence', { event: 'join' }, ({ newPresences }) => this.handleUserJoin(newPresences))
                        .on('presence', { event: 'leave' }, ({ leftPresences }) => this.handleUserLeave(leftPresences))
                        // Eventos en Vivo (Contenido, Secciones, Configuración)
                        .on('broadcast', { event: 'content_patch' }, ({ payload }) => this.handleRemoteContentPatch(payload))
                        .on('broadcast', { event: 'sheet_event' }, ({ payload }) => this.handleRemoteSheetEvent(payload))
                        .on('broadcast', { event: 'layout_change' }, ({ payload }) => this.handleRemoteLayoutChange(payload))
                        .on('broadcast', { event: 'doc_update' }, ({ payload }) => this.handleRemoteUpdate(payload))
                        .subscribe(async (status) => {
                            if (status === 'SUBSCRIBED') {
                                await this.channel.track({
                                    user_id: this.currentUserId,
                                    user_name: this.userName,
                                    user_color: this.userColor,
                                    active_sheet_idx: TextDocStateManager.activeSheetIndex,
                                    online_at: new Date().toISOString()
                                });
                                this.renderPresenceUI();
                            }
                        });

                    // Canal Postgres Changes para actualizaciones guardadas en la base de datos
                    if (this.dbChannel) {
                        window.supabaseClient.removeChannel(this.dbChannel);
                    }
                    this.dbChannel = window.supabaseClient
                        .channel(`db-collab-textos-${projectId}`)
                        .on('postgres_changes', {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'proyectos_contables',
                            filter: `id=eq.${projectId}`
                        }, (payload) => {
                            if (payload.new && payload.new.data) {
                                const incoming = payload.new.data;
                                if (incoming.last_modified_by && incoming.last_modified_by === this.currentUserId) {
                                    return;
                                }
                                this.handleRemoteUpdate({ project: incoming, sender_id: incoming.last_modified_by });
                            }
                        })
                        .subscribe();
                } catch (err) {
                    console.warn('Error inicializando canal de colaboración:', err);
                }
            }

            // Configurar enlace para compartir en el modal
            this.setupShareLink();
        },

        escapeHtml(str) {
            return String(str ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },

        handlePresenceSync() {
            if (!this.channel) return;
            this.presences = this.channel.presenceState() || {};
            this.renderPresenceUI();
        },

        handleUserJoin(newPresences) {
            this.handlePresenceSync();
            (newPresences || []).forEach(p => {
                if (p.user_id !== this.currentUserId) {
                    TextDocStateManager.showToast(`🟢 ${p.user_name || 'Un colaborador'} se ha unido al documento`);
                }
            });
        },

        handleUserLeave(leftPresences) {
            this.handlePresenceSync();
        },

        renderPresenceUI() {
            const container = document.getElementById('collab-presence-container');
            const liveList = document.getElementById('collaborators-live-list');
            const countLabel = document.getElementById('collab-live-count-label');

            let userList = [];
            Object.keys(this.presences).forEach(k => {
                const p = this.presences[k];
                if (Array.isArray(p) && p.length > 0) {
                    userList.push(p[0]);
                }
            });

            // Asegurar que al menos el usuario actual aparezca
            if (userList.length === 0 && this.currentUserId) {
                userList = [{ user_id: this.currentUserId, user_name: this.userName, user_color: this.userColor }];
            }

            if (container) {
                container.innerHTML = userList.slice(0, 5).map(u => {
                    const isMe = u.user_id === this.currentUserId;
                    const initials = this.escapeHtml((u.user_name || 'U').substring(0, 2).toUpperCase());
                    const safeName = this.escapeHtml(u.user_name || 'Colaborador');
                    return `
                        <div class="collab-avatar-bubble" style="background-color: ${u.user_color || '#f59e0b'};" title="${safeName} ${isMe ? '(Tú)' : ''}">
                            ${initials}
                        </div>
                    `;
                }).join('');

                if (userList.length > 5) {
                    container.innerHTML += `<div class="collab-avatar-bubble bg-slate-700 text-[9px] font-bold">+${userList.length - 5}</div>`;
                }
            }

            if (countLabel) {
                countLabel.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> ${userList.length} ${userList.length === 1 ? 'conectado' : 'conectados'}`;
            }

            if (liveList) {
                liveList.innerHTML = userList.map(u => {
                    const isMe = u.user_id === this.currentUserId;
                    const safeName = this.escapeHtml(u.user_name || 'Colaborador');
                    return `
                        <div class="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                            <div class="flex items-center gap-2">
                                <span class="w-3 h-3 rounded-full" style="background-color: ${u.user_color || '#f59e0b'};"></span>
                                <span class="font-bold text-slate-800 dark:text-slate-200">${safeName} ${isMe ? '<span class="text-[10px] text-amber-500 font-bold">(Tú)</span>' : ''}</span>
                            </div>
                            <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest">En Línea</span>
                        </div>
                    `;
                }).join('');
            }
        },

        // --- BROADCAST DE ESCRITURA EN VIVO (THROTTLED) ---
        broadcastContent(cleanHTML, sheetIdx) {
            if (!this.channel || !this.currentUserId || window.isAuditMode) return;
            if (TextDocStateManager.getUserRole && TextDocStateManager.getUserRole() === 'lector') return;

            if (this.contentThrottleTimer) return;
            this.contentThrottleTimer = setTimeout(() => {
                this.contentThrottleTimer = null;
                const htmlToSend = cleanHTML || (typeof MultiPageEngine !== 'undefined' && typeof MultiPageEngine.getCleanHTML === 'function' ? MultiPageEngine.getCleanHTML() : '');
                if (!htmlToSend || htmlToSend === this.lastBroadcastHTML) return;
                this.lastBroadcastHTML = htmlToSend;
                const targetIdx = sheetIdx !== undefined ? sheetIdx : TextDocStateManager.activeSheetIndex;
                this.channel.send({
                    type: 'broadcast',
                    event: 'content_patch',
                    payload: {
                        sender_id: this.currentUserId,
                        sheet_idx: targetIdx,
                        content: htmlToSend,
                        timestamp: Date.now()
                    }
                }).catch(() => {});
            }, 250);
        },

        handleRemoteContentPatch(payload) {
            if (!payload || payload.sender_id === this.currentUserId || !TextDocStateManager.currentProject) return;

            const targetSheetIdx = payload.sheet_idx;
            const sheet = TextDocStateManager.currentProject.sheets[targetSheetIdx];
            if (!sheet) return;

            // Actualizar contenido en memoria del proyecto
            sheet.content = payload.content;
            sheet.pages = [payload.content];

            // Si la hoja que se está editando remotamente es la que el usuario tiene abierta actualmente
            if (targetSheetIdx === TextDocStateManager.activeSheetIndex) {
                MultiPageEngine.saveCursor();
                MultiPageEngine.loadContent(payload.content, false);
                MultiPageEngine.restoreCursor();
                DocStatsManager.update();
            }
        },

        // --- GESTIÓN DE SECCIONES REMOTAS ---
        broadcastSheetEvent(eventType, sheetData, sheetIdx) {
            if (!this.channel || !this.currentUserId || window.isAuditMode) return;
            if (TextDocStateManager.getUserRole && TextDocStateManager.getUserRole() === 'lector') return;
            this.channel.send({
                type: 'broadcast',
                event: 'sheet_event',
                payload: {
                    sender_id: this.currentUserId,
                    event_type: eventType,
                    sheet_data: sheetData,
                    sheet_idx: sheetIdx,
                    all_sheets: TextDocStateManager.currentProject?.sheets
                }
            }).catch(() => {});
        },

        handleRemoteSheetEvent(payload) {
            if (!payload || payload.sender_id === this.currentUserId || !TextDocStateManager.currentProject) return;

            if (Array.isArray(payload.all_sheets)) {
                TextDocStateManager.currentProject.sheets = payload.all_sheets;
                if (TextDocStateManager.activeSheetIndex >= TextDocStateManager.currentProject.sheets.length) {
                    TextDocStateManager.activeSheetIndex = 0;
                }
                TextDocStateManager.renderSheetSelect();
                TextDocStateManager.loadActiveSheet();
                TextDocStateManager.showToast('Estructura de secciones actualizada por un colaborador');
            }
        },

        // --- GESTIÓN DE GEOMETRÍA DE PÁGINA REMOTA ---
        broadcastLayoutChange(layoutConfig) {
            if (!this.channel || !this.currentUserId || window.isAuditMode) return;
            if (TextDocStateManager.getUserRole && TextDocStateManager.getUserRole() === 'lector') return;
            this.channel.send({
                type: 'broadcast',
                event: 'layout_change',
                payload: {
                    sender_id: this.currentUserId,
                    sheet_idx: TextDocStateManager.activeSheetIndex,
                    layout: layoutConfig
                }
            }).catch(() => {});
        },

        handleRemoteLayoutChange(payload) {
            if (!payload || payload.sender_id === this.currentUserId || !TextDocStateManager.currentProject) return;

            const sheet = TextDocStateManager.currentProject.sheets[payload.sheet_idx];
            if (!sheet || !payload.layout) return;

            Object.assign(sheet, payload.layout);

            if (payload.sheet_idx === TextDocStateManager.activeSheetIndex) {
                PageLayoutManager.applyPageGeometry(sheet.pageSize, sheet.margins, sheet.lineSpacing, sheet.orientation);
                MultiPageEngine.updateAllPageNumbers();
                MultiPageEngine.paginate();
            }
        },

        // --- ACTUALIZACIÓN DE ESTADO COMPLETO DEL DOCUMENTO ---
        broadcastUpdate(project) {
            if (!this.channel || !this.currentUserId || window.isAuditMode) return;
            if (TextDocStateManager.getUserRole && TextDocStateManager.getUserRole() === 'lector') return;
            this.channel.send({
                type: 'broadcast',
                event: 'doc_update',
                payload: { sender_id: this.currentUserId, project: project }
            }).catch(() => {});
        },

        handleRemoteUpdate(payload) {
            const incoming = payload.project;
            if (!incoming || incoming.id !== TextDocStateManager.currentProject?.id) return;

            if (new Date(incoming.updatedAt) > new Date(TextDocStateManager.currentProject.updatedAt)) {
                TextDocStateManager.currentProject = incoming;
                TextDocStateManager.renderSheetSelect();
                TextDocStateManager.loadActiveSheet();
                this.renderCollaboratorsList();
                TextDocStateManager.showToast('Documento actualizado por un colaborador');
            }
        },

        // --- MODAL DE COMPARTIR Y ENLACE DE INVITACIÓN ---
        setupShareLink() {
            const linkInput = document.getElementById('share-invite-link');
            if (linkInput && TextDocStateManager.currentProject) {
                linkInput.value = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(TextDocStateManager.currentProject.id)}&collab=true`;
            }
        },

        async copyInviteLink() {
            this.setupShareLink();
            const linkInput = document.getElementById('share-invite-link');
            const url = linkInput?.value || `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(TextDocStateManager.currentProject?.id || '')}&collab=true`;

            try {
                await navigator.clipboard.writeText(url);
                const btn = document.getElementById('btn-copy-invite');
                if (btn) {
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check text-xs"></i> <span>¡Copiado!</span>';
                    btn.classList.replace('bg-sky-500', 'bg-emerald-600');
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.classList.replace('bg-emerald-600', 'bg-sky-500');
                    }, 2200);
                }
                TextDocStateManager.showToast('¡Enlace de invitación copiado al portapapeles!');
            } catch (e) {
                if (linkInput) {
                    linkInput.select();
                    document.execCommand('copy');
                    TextDocStateManager.showToast('¡Enlace copiado!');
                }
            }
        },

        async openShareModal() {
            const modal = document.getElementById('share-modal');
            if (!modal) return;

            const proj = TextDocStateManager.currentProject;
            const titleEl = document.getElementById('editor-share-modal-title');
            const subEl = document.getElementById('editor-share-modal-subtitle');
            if (titleEl && proj) titleEl.textContent = `Gestión de Acceso: "${proj.name || 'Documento'}"`;
            if (subEl && proj) {
                subEl.textContent = 'Controla quién puede ver y editar este documento en tiempo real.';
            }

            // 1. Mostrar Administrador / Propietario en la tarjeta superior
            const adminNameEl = document.getElementById('editor-doc-admin-name');
            if (adminNameEl && proj) {
                let ownerDisplay = proj.owner_name || proj.owner_email || 'Propietario del Documento';
                if (proj.owner_id && this.currentUserId && proj.owner_id === this.currentUserId) {
                    ownerDisplay += ' (Tú)';
                } else if (!proj.owner_id && this.currentUserId) {
                    ownerDisplay = (this.userName || 'Tú') + ' (Propietario)';
                }
                adminNameEl.textContent = ownerDisplay;
            }

            // 2. Configurar enlace oculto (por si se reactiva o inspecciona)
            this.setupShareLink();

            // 3. Limpiar campo de texto y selector de rol
            const input = document.getElementById('share-uid-input');
            if (input) input.value = '';

            const roleSelect = document.getElementById('share-role-select');
            if (roleSelect) roleSelect.value = 'editor';

            this.renderPresenceUI();
            this.renderCollaboratorsList();

            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            modal.classList.add('active');
        },

        closeShareModal() {
            const modal = document.getElementById('share-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
                modal.classList.remove('active');
            }
        },

        async addCollaborator() {
            if (window.isAuditMode) return;
            const input = document.getElementById('share-uid-input');
            const roleSelect = document.getElementById('share-role-select');
            const uid = input?.value.trim();
            const role = roleSelect?.value || 'editor';

            if (!uid || !TextDocStateManager.currentProject) {
                TextDocStateManager.showToast('Ingresa el UID del usuario');
                input?.focus();
                return;
            }

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(uid)) {
                TextDocStateManager.showToast('El UID ingresado no tiene un formato UUID válido');
                input?.focus();
                return;
            }

            if (this.currentUserId && uid === this.currentUserId) {
                TextDocStateManager.showToast('No puedes añadirte a ti mismo como invitado');
                return;
            }

            if (!Array.isArray(TextDocStateManager.currentProject.shared_with)) {
                TextDocStateManager.currentProject.shared_with = [];
            }
            if (!TextDocStateManager.currentProject.collaborator_roles) {
                TextDocStateManager.currentProject.collaborator_roles = {};
            }

            if (TextDocStateManager.currentProject.shared_with.includes(uid)) {
                TextDocStateManager.showToast('Este usuario ya está en la lista');
                return;
            }

            TextDocStateManager.currentProject.shared_with.push(uid);
            TextDocStateManager.currentProject.collaborator_roles[uid] = role;
            TextDocStateManager.currentProject.updatedAt = new Date().toISOString();
            if (input) input.value = '';

            TextDocStateManager.saveState();
            this.broadcastUpdate(TextDocStateManager.currentProject);
            TextDocStateManager.syncCloud(false);
            this.renderCollaboratorsList();
            TextDocStateManager.showToast(`¡Invitado añadido en ${role === 'editor' ? 'Modo Editor' : 'Modo Lectura'}!`);
        },

        async setCollaboratorRole(uid, role) {
            if (window.isAuditMode || !TextDocStateManager.currentProject) return;

            if (!TextDocStateManager.currentProject.collaborator_roles) {
                TextDocStateManager.currentProject.collaborator_roles = {};
            }

            TextDocStateManager.currentProject.collaborator_roles[uid] = role;
            TextDocStateManager.currentProject.updatedAt = new Date().toISOString();

            TextDocStateManager.saveState();
            this.broadcastUpdate(TextDocStateManager.currentProject);
            TextDocStateManager.syncCloud(false);
            this.renderCollaboratorsList();
            TextDocStateManager.showToast(`Permiso actualizado a ${role === 'editor' ? 'Modo Editor' : 'Modo Lectura'}`);
        },

        async removeCollaborator(uid) {
            if (window.isAuditMode || !TextDocStateManager.currentProject || !Array.isArray(TextDocStateManager.currentProject.shared_with)) return;

            TextDocStateManager.currentProject.shared_with = TextDocStateManager.currentProject.shared_with.filter(u => u !== uid);
            if (TextDocStateManager.currentProject.collaborator_roles) {
                delete TextDocStateManager.currentProject.collaborator_roles[uid];
            }
            TextDocStateManager.currentProject.updatedAt = new Date().toISOString();

            TextDocStateManager.saveState();
            this.broadcastUpdate(TextDocStateManager.currentProject);
            TextDocStateManager.syncCloud(false);
            this.renderCollaboratorsList();
            TextDocStateManager.showToast('Invitado eliminado');
        },

        renderCollaboratorsList() {
            const container = document.getElementById('collaborators-list');
            const countEl = document.getElementById('editor-share-collaborators-count');
            if (!container || !TextDocStateManager.currentProject) return;

            const list = TextDocStateManager.currentProject.shared_with || [];
            const roles = TextDocStateManager.currentProject.collaborator_roles || {};
            container.innerHTML = '';

            if (list.length === 0) {
                if (countEl) countEl.textContent = '0 invitados';
                container.innerHTML = `
                    <div class="py-5 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        <i class="fas fa-user-shield text-lg mb-1 text-slate-300 dark:text-slate-600"></i>
                        <p>No hay invitados registrados. Solo el administrador tiene acceso.</p>
                    </div>
                `;
                return;
            }

            if (countEl) countEl.textContent = `${list.length} invitado${list.length === 1 ? '' : 's'}`;

            list.forEach((uid, index) => {
                const role = roles[uid] || 'editor';
                const safeUid = this.escapeHtml(uid);
                const shortUid = this.escapeHtml(uid.length > 16 ? `${uid.substring(0, 8)}...${uid.substring(uid.length - 6)}` : uid);
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs gap-2';
                item.innerHTML = `
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                        <div class="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                            ${index + 1}
                        </div>
                        <div class="min-w-0">
                            <p class="font-mono font-bold text-slate-700 dark:text-slate-300 truncate text-[11px] select-all" title="${safeUid}">${shortUid}</p>
                            <span class="text-[9px] ${role === 'editor' ? 'text-emerald-500' : 'text-sky-500'} font-semibold flex items-center gap-1">
                                <i class="fas ${role === 'editor' ? 'fa-pen-to-square' : 'fa-book-open'} text-[8px]"></i>
                                ${role === 'editor' ? 'Modo Editor' : 'Modo Lectura'}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        ${!window.isAuditMode ? `
                            <select onchange="window.CollabPresenceManager?.setCollaboratorRole('${safeUid}', this.value)" 
                                class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-amber-500 cursor-pointer shadow-sm">
                                <option value="editor" ${role === 'editor' ? 'selected' : ''}>Modo Editor</option>
                                <option value="lector" ${role === 'lector' ? 'selected' : ''}>Modo Lectura</option>
                            </select>
                            <button onclick="window.CollabPresenceManager?.removeCollaborator('${safeUid}')" 
                                class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all shrink-0"
                                title="Eliminar invitado">
                                <i class="fas fa-trash-alt text-xs"></i>
                            </button>
                        ` : `
                            <span class="text-[10px] font-bold text-slate-400 capitalize">${this.escapeHtml(role)}</span>
                        `}
                    </div>
                `;
                container.appendChild(item);
            });
        }
    };
export { CollabPresenceManager };
