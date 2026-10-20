// =========================================================================
// EDUCONTA BRIDGE TO DIARIO (Puente Universal hacia Libro Diario)
// Permite registrar asientos contables generados en módulos auxiliares
// (Arqueo, Kardex, Planillas, Tributario, Costos) seleccionando o creando
// un proyecto de Libro Diario en el momento.
// =========================================================================

(function () {
    const BRIDGE_MODAL_ID = 'educonta-bridge-diario-modal';

    const Bridge = {
        currentPayload: null,

        /**
         * Abre el modal del puente con los datos del asiento contable a registrar.
         * @param {Object} payload
         * @param {string} payload.origen - Nombre del módulo de origen (ej. "Arqueo de Caja")
         * @param {string} payload.color - Color temático ('sky'|'amber'|'indigo'|'emerald'|'rose')
         * @param {string} payload.icono - Clase FontAwesome (ej. "fa-cash-register")
         * @param {string} payload.titulo - Título del asiento / hoja
         * @param {string} [payload.subtitulo] - Subtítulo descriptivo
         * @param {string} payload.fecha - Fecha YYYY-MM-DD
         * @param {string} payload.glosa - Glosa o concepto contable
         * @param {Array<{cod: string, nom: string, debe: string|number, haber: string|number}>} payload.rows
         */
        open: function (payload) {
            this.currentPayload = payload;
            this.ensureModalDOM();
            this.renderContent();
            const modal = document.getElementById(BRIDGE_MODAL_ID);
            if (modal) {
                modal.style.display = 'flex';
                void modal.offsetWidth; // Forzar reflow para animación
                modal.classList.remove('closing');
                modal.classList.add('active');
            }
        },

        close: function () {
            const modal = document.getElementById(BRIDGE_MODAL_ID);
            if (modal) {
                modal.classList.add('closing');
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.style.display = 'none';
                    modal.classList.remove('closing');
                }, 250);
            }
        },

        ensureModalDOM: function () {
            if (document.getElementById(BRIDGE_MODAL_ID)) return;

            const modalEl = document.createElement('div');
            modalEl.id = BRIDGE_MODAL_ID;
            modalEl.className = 'fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300';
            modalEl.style.display = 'none';

            modalEl.innerHTML = `
                <div class="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all transform duration-300">
                    <!-- Cabecera -->
                    <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-850">
                        <div class="flex items-center gap-3">
                            <div id="bridge-origin-icon-wrap" class="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shadow-sm">
                                <i id="bridge-origin-icon" class="fas fa-book-bookmark"></i>
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <span id="bridge-origin-badge" class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"></span>
                                    <span class="text-[10px] font-bold text-slate-400 uppercase">Vinculación Contable</span>
                                </div>
                                <h3 class="text-lg font-black text-slate-800 dark:text-white">Registrar en Libro Diario</h3>
                            </div>
                        </div>
                        <button type="button" onclick="window.EduContaBridgeToDiario.close()" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <i class="fas fa-times text-sm"></i>
                        </button>
                    </div>

                    <!-- Cuerpo Scrollable -->
                    <div class="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
                        <!-- Paso 1: Selección o Creación de Proyecto de Libros -->
                        <div class="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                <span>1. Proyecto de Libros Destino</span>
                                <span class="text-sky-600 dark:text-sky-400 font-bold lowercase text-[11px]"><i class="fas fa-database text-[10px]"></i> bóveda libros</span>
                            </label>
                            
                            <div class="space-y-3">
                                <select id="bridge-project-select" onchange="window.EduContaBridgeToDiario.handleProjectSelectChange(this.value)" class="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-sm">
                                    <!-- Inyectado dinámicamente -->
                                </select>

                                <!-- Bloque Crear Nuevo Proyecto (si se selecciona) -->
                                <div id="bridge-new-project-block" class="hidden pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                                    <label class="block text-[10px] font-bold text-slate-500 uppercase">Nombre de la Nueva Empresa / Proyecto:</label>
                                    <input type="text" id="bridge-new-project-name" placeholder="Ej. Empresa Comercial Cuscatlán, S.A. de C.V." class="w-full bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-600 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 shadow-inner">
                                </div>
                            </div>
                        </div>

                        <!-- Paso 2: Previsualización de la Partida -->
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Previsualización del Asiento Contable</label>
                                <span id="bridge-balance-status" class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                    <i class="fas fa-check-circle"></i> CUADRADA
                                </span>
                            </div>

                            <div class="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-750 pb-3">
                                    <div>
                                        <h4 id="bridge-preview-title" class="text-xs font-black text-slate-800 dark:text-white uppercase"></h4>
                                        <p id="bridge-preview-desc" class="text-[10px] text-slate-400 font-bold"></p>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-[10px] font-bold text-slate-400 uppercase">Fecha:</span>
                                        <span id="bridge-preview-date" class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs tabular-nums font-bold text-slate-700 dark:text-slate-300"></span>
                                    </div>
                                </div>

                                <!-- Tabla Debe / Haber -->
                                <div class="overflow-x-auto">
                                    <table class="w-full text-left">
                                        <thead>
                                            <tr class="text-[10px] font-extrabold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                                                <th class="py-1.5 px-2">Código</th>
                                                <th class="py-1.5 px-2">Cuenta / Subcuenta</th>
                                                <th class="py-1.5 px-2 text-right">Debe ($)</th>
                                                <th class="py-1.5 px-2 text-right">Haber ($)</th>
                                            </tr>
                                        </thead>
                                        <tbody id="bridge-preview-tbody" class="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                                            <!-- Inyectado -->
                                        </tbody>
                                        <tfoot>
                                            <tr class="font-black text-xs border-t-2 border-slate-800 dark:border-slate-300">
                                                <td colspan="2" class="py-2 px-2 uppercase text-slate-700 dark:text-slate-300">Sumas Iguales:</td>
                                                <td id="bridge-preview-tot-debe" class="py-2 px-2 text-right text-emerald-600 tabular-nums">$0.00</td>
                                                <td id="bridge-preview-tot-haber" class="py-2 px-2 text-right text-emerald-600 tabular-nums">$0.00</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                <!-- Glosa -->
                                <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 italic">
                                    <strong class="text-slate-700 dark:text-slate-300 not-italic font-bold">Glosa:</strong> <span id="bridge-preview-glosa"></span>
                                </div>
                            </div>
                        </div>

                        <!-- Estado Éxito (Oculto inicialmente) -->
                        <div id="bridge-success-panel" class="hidden p-5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                            <div class="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-xl shadow-lg">
                                <i class="fas fa-check"></i>
                            </div>
                            <h4 class="text-base font-black text-emerald-800 dark:text-emerald-200">¡Partida Registrada con Éxito!</h4>
                            <p id="bridge-success-msg" class="text-xs text-emerald-700 dark:text-emerald-300 font-medium"></p>
                            
                            <div class="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                                <button type="button" onclick="window.EduContaBridgeToDiario.handleStayHere()" class="px-5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-emerald-50 transition-all shadow-sm">
                                    <i class="fas fa-arrow-left mr-1.5"></i> Permanecer en este módulo
                                </button>
                                <button type="button" id="bridge-btn-go-to-diario" class="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5">
                                    <i class="fas fa-book-open"></i> Abrir en Libro Diario <i class="fas fa-external-link-alt text-[10px]"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Footer de Acciones -->
                    <div id="bridge-action-footer" class="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex justify-end items-center gap-3">
                        <button type="button" onclick="window.EduContaBridgeToDiario.close()" class="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-200/50 transition-colors">
                            Cancelar
                        </button>
                        <button type="button" onclick="window.EduContaBridgeToDiario.confirmSave()" class="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2">
                            <i class="fas fa-file-import"></i> Guardar en Libro Diario
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modalEl);
        },

        renderContent: function () {
            const p = this.currentPayload;
            if (!p) return;

            // Resetear vistas
            document.getElementById('bridge-success-panel')?.classList.add('hidden');
            document.getElementById('bridge-action-footer')?.classList.remove('hidden');

            // 1. Origen y Tematización
            const iconWrap = document.getElementById('bridge-origin-icon-wrap');
            const iconEl = document.getElementById('bridge-origin-icon');
            const badgeEl = document.getElementById('bridge-origin-badge');

            const color = p.color || 'sky';
            const colorClasses = {
                sky: { bg: 'bg-sky-50 dark:bg-sky-950/50', text: 'text-sky-600 dark:text-sky-400', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300' },
                amber: { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300' },
                indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' },
                emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' },
                rose: { bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300' }
            };
            const cTheme = colorClasses[color] || colorClasses.sky;

            if (iconWrap) iconWrap.className = `w-11 h-11 rounded-2xl flex items-center justify-center text-lg shadow-sm ${cTheme.bg} ${cTheme.text}`;
            if (iconEl) iconEl.className = `fas ${p.icono || 'fa-receipt'}`;
            if (badgeEl) {
                badgeEl.className = `px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${cTheme.badge}`;
                badgeEl.innerText = p.origen || 'Módulo Auxiliar';
            }

            // 2. Metadatos
            document.getElementById('bridge-preview-title').innerText = p.titulo || 'Partida de Diario';
            document.getElementById('bridge-preview-desc').innerText = p.subtitulo || `Origen: ${p.origen}`;
            document.getElementById('bridge-preview-date').innerText = p.fecha || new Date().toISOString().split('T')[0];
            document.getElementById('bridge-preview-glosa').innerText = p.glosa || 'Sin glosa especificada.';

            // 3. Filas y Sumas
            const escBridge = (val) => (window.EduSec && typeof window.EduSec.escapeHtml === 'function')
                ? window.EduSec.escapeHtml(val)
                : String(val == null ? '' : val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            const tbody = document.getElementById('bridge-preview-tbody');
            let sumDebe = 0;
            let sumHaber = 0;
            if (tbody) {
                tbody.innerHTML = (p.rows || []).map(r => {
                    const d = parseFloat(r.debe) || 0;
                    const h = parseFloat(r.haber) || 0;
                    sumDebe += d;
                    sumHaber += h;
                    return `
                        <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                            <td class="py-2 px-2 tabular-nums font-bold text-sky-600 dark:text-sky-400">${escBridge(r.cod || '—')}</td>
                            <td class="py-2 px-2 font-semibold text-slate-800 dark:text-slate-200">${escBridge(r.nom || 'Cuenta sin nombre')}</td>
                            <td class="py-2 px-2 text-right tabular-nums font-bold text-slate-700 dark:text-slate-300">${d > 0 ? '$ ' + d.toFixed(2) : '—'}</td>
                            <td class="py-2 px-2 text-right tabular-nums font-bold text-slate-700 dark:text-slate-300">${h > 0 ? '$ ' + h.toFixed(2) : '—'}</td>
                        </tr>
                    `;
                }).join('');
            }

            document.getElementById('bridge-preview-tot-debe').innerText = `$ ${sumDebe.toFixed(2)}`;
            document.getElementById('bridge-preview-tot-haber').innerText = `$ ${sumHaber.toFixed(2)}`;

            // Badge Cuadre
            const diff = Math.abs(sumDebe - sumHaber);
            const statusEl = document.getElementById('bridge-balance-status');
            if (statusEl) {
                if (diff < 0.005 && sumDebe > 0) {
                    statusEl.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400';
                    statusEl.innerHTML = '<i class="fas fa-check-circle"></i> CUADRADA';
                } else {
                    statusEl.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400';
                    statusEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> DESCUADRADA ($ ${diff.toFixed(2)})`;
                }
            }

            // 4. Cargar lista de proyectos de Libros
            this.populateProjectsList();
        },

        populateProjectsList: function () {
            const selectEl = document.getElementById('bridge-project-select');
            if (!selectEl) return;

            const escBridge = (val) => (window.EduSec && typeof window.EduSec.escapeHtml === 'function')
                ? window.EduSec.escapeHtml(val)
                : String(val == null ? '' : val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            const librosProjects = JSON.parse(localStorage.getItem('educonta_projects_libros')) || [];
            const lastProjId = localStorage.getItem('educonta_last_project_id');

            let html = '';
            if (librosProjects.length > 0) {
                html += '<optgroup label="Proyectos de Libros Existentes">';
                librosProjects.forEach(proj => {
                    const isSelected = (String(proj.id) === String(lastProjId));
                    const sheetsCount = proj.sheets ? proj.sheets.length : 0;
                    html += `<option value="${escBridge(proj.id)}" ${isSelected ? 'selected' : ''}>${escBridge(proj.name)} (${sheetsCount} ${sheetsCount === 1 ? 'partida' : 'partidas'})</option>`;
                });
                html += '</optgroup>';
            }

            html += `
                <optgroup label="Acción">
                    <option value="__NEW__" ${librosProjects.length === 0 ? 'selected' : ''}>+ Crear nuevo proyecto de Libro Diario...</option>
                </optgroup>
            `;

            selectEl.innerHTML = html;
            this.handleProjectSelectChange(selectEl.value);
        },

        handleProjectSelectChange: function (val) {
            const newBlock = document.getElementById('bridge-new-project-block');
            const nameInput = document.getElementById('bridge-new-project-name');
            if (val === '__NEW__') {
                if (newBlock) newBlock.classList.remove('hidden');
                if (nameInput) {
                    nameInput.value = this.currentPayload?.origen ? `Empresa Contable (${this.currentPayload.origen})` : 'Mi Empresa Comercial';
                    setTimeout(() => nameInput.focus(), 50);
                }
            } else {
                if (newBlock) newBlock.classList.add('hidden');
            }
        },

        confirmSave: function () {
            const p = this.currentPayload;
            if (!p) return;

            const escBridge = (val) => (window.EduSec && typeof window.EduSec.escapeHtml === 'function')
                ? window.EduSec.escapeHtml(val)
                : String(val == null ? '' : val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            const selectEl = document.getElementById('bridge-project-select');
            const chosenVal = selectEl ? selectEl.value : '__NEW__';

            let librosProjects = JSON.parse(localStorage.getItem('educonta_projects_libros')) || [];
            let targetProject = null;
            let isCreatedNew = false;

            if (chosenVal === '__NEW__' || librosProjects.length === 0) {
                const nameInput = document.getElementById('bridge-new-project-name');
                let pName = nameInput ? nameInput.value.trim() : '';
                if (!pName) pName = `Empresa Contable ${librosProjects.length + 1}`;

                const newId = 'proj_' + Date.now();
                targetProject = {
                    id: newId,
                    name: pName,
                    catalogo: 'MAESTRO',
                    type: 'libros',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    sheets: [],
                    bookCounter: 0
                };
                librosProjects.unshift(targetProject);
                isCreatedNew = true;
            } else {
                targetProject = librosProjects.find(proj => String(proj.id) === String(chosenVal));
                if (!targetProject) {
                    alert("Proyecto no encontrado. Por favor selecciona o crea uno nuevo.");
                    return;
                }
            }

            // Construir la nueva hoja en formato estándar de editor-libros
            targetProject.bookCounter = (targetProject.bookCounter || targetProject.sheets?.length || 0) + 1;
            const newSheetId = `book-${Date.now()}`;
            const newSheet = {
                id: newSheetId,
                title: p.titulo || `Registro No. ${targetProject.bookCounter}`,
                desc: p.subtitulo || `Generada desde ${p.origen}`,
                date: p.fecha || new Date().toISOString().split('T')[0],
                glosa: p.glosa || '',
                frozen: false,
                rows: (p.rows || []).map((r, i) => ({
                    id: `row-${i + 1}`,
                    vals: [
                        r.cod || '',
                        r.nom || '',
                        (r.debe !== undefined && r.debe !== null && r.debe !== '') ? String(r.debe) : '',
                        (r.haber !== undefined && r.haber !== null && r.haber !== '') ? String(r.haber) : ''
                    ]
                }))
            };

            if (!Array.isArray(targetProject.sheets)) targetProject.sheets = [];
            targetProject.sheets.push(newSheet);
            targetProject.updatedAt = new Date().toISOString();

            // Guardar en la bóveda de Libros
            localStorage.setItem('educonta_projects_libros', JSON.stringify(librosProjects));

            // Si estamos actualmente dentro de editor-libros.html y el proyecto destino es el que está abierto:
            if (typeof window.createNewBook === 'function' && String(window.proyecto_actual?.id) === String(targetProject.id)) {
                window.proyecto_actual.sheets = targetProject.sheets;
                // Renderizar directamente la hoja en el DOM
                if (typeof window.switchTab === 'function') window.switchTab('diario');
            }

            // Mostrar pantalla de éxito dentro del modal
            const succPanel = document.getElementById('bridge-success-panel');
            const actionFooter = document.getElementById('bridge-action-footer');
            const succMsg = document.getElementById('bridge-success-msg');
            const btnGoDiario = document.getElementById('bridge-btn-go-to-diario');

            if (succPanel) succPanel.classList.remove('hidden');
            if (actionFooter) actionFooter.classList.add('hidden');
            if (succMsg) {
                succMsg.innerHTML = `La partida <strong>${escBridge(newSheet.title)}</strong> ha sido agregada correctamente en el proyecto <strong>${escBridge(targetProject.name)}</strong> (${targetProject.sheets.length} partidas en total).`;
            }

            if (btnGoDiario) {
                btnGoDiario.onclick = () => {
                    localStorage.setItem('educonta_last_project_id', targetProject.id);
                    localStorage.setItem('educonta_proyectos_active_tab', 'libros');
                    window.location.href = 'editor-libros.html';
                };
            }

            // Sincronizar en segundo plano con Supabase si está disponible
            if (typeof supabaseClient !== 'undefined' && typeof syncCurrentProjectWithSupabase === 'function') {
                supabaseClient.auth.getSession().then(({ data: { session } }) => {
                    if (session) syncCurrentProjectWithSupabase(targetProject, session.user.id, true).catch(console.error);
                });
            }
        },

        handleStayHere: function () {
            this.close();
            // Notificación flotante de confirmación
            if (typeof window.showSyncToast === 'function') {
                window.showSyncToast('success', 'Asiento guardado en el Libro Diario.');
            } else {
                const toast = document.getElementById('sync-toast');
                if (toast) {
                    const h4 = toast.querySelector('h4');
                    const p = toast.querySelector('p');
                    if (h4) h4.innerText = 'Asiento Contable Registrado';
                    if (p) p.innerText = 'Guardado en la bóveda de Libros';
                    toast.classList.remove('translate-y-32', 'opacity-0');
                    setTimeout(() => toast.classList.add('translate-y-32', 'opacity-0'), 3500);
                }
            }
        }
    };

    window.EduContaBridgeToDiario = Bridge;
})();
