// =========================================================
// CONTROLADOR PANEL ADMINISTRADOR (AUDITORÍA GLOBAL - EXPLORADOR DE ARCHIVOS)
// =========================================================

window.masterProjectsData = [];

// ── Escape de datos de usuario (alumnos, tickets de soporte) antes de inyectar HTML ──
// Usa EduSec (js/core/security.js) y cae en una implementación local si no cargó.
const escHtml = (v) => (window.EduSec ? window.EduSec.escapeHtml(v)
    : String(v ?? '').replace(/[&<>"'`]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[ch])));
const escJsArg = (v) => (window.EduSec ? window.EduSec.jsArg(v) : escHtml(JSON.stringify(String(v ?? ''))));
const safeUrl = (u) => (/^https?:\/\//i.test(String(u || '').trim()) ? escHtml(String(u).trim()) : '#');

// Estado del explorador de archivos
window.explorerState = {
    currentUserId: sessionStorage.getItem('educonta_audit_return_uid') || null,
    currentUserName: sessionStorage.getItem('educonta_audit_return_uname') || null,
    currentCategory: sessionStorage.getItem('educonta_audit_return_cat') || null, // 'libros', 'kardex', 'planillas' o null
    viewMode: localStorage.getItem('admin_explorer_view') || 'grid'
};

// Limpiar el estado de retorno para navegaciones futuras limpias
sessionStorage.removeItem('educonta_audit_return_uid');
sessionStorage.removeItem('educonta_audit_return_uname');
sessionStorage.removeItem('educonta_audit_return_cat');

// Aliases para compatibilidad con componentes externos
window.currentAuditUserId = null;
window.currentAuditUserName = null;

// Función de mapeo de almacenamiento para todas las bóvedas
window.getProjectsStorageKey = function(type) {
    if (type === 'kardex') return 'educonta_projects_kardex';
    if (type === 'planillas') return 'educonta_projects_planillas';
    if (type === 'hojas' || type === 'calculo') return 'educonta_projects_calculo';
    if (type === 'tributario') return 'educonta_projects_tributario';
    if (type === 'costos') return 'educonta_projects_costos';
    if (type === 'caja') return 'educonta_projects_caja';
    if (type === 'finanzas') return 'educonta_projects_finanzas';
    if (type === 'textos') return 'educonta_projects_textos';
    if (type === 'lienzos') return 'educonta_projects_lienzos';
    if (type === 'diagramas') return 'educonta_projects_diagramas';
    return 'educonta_projects_libros';
};

window.CATEGORY_NAMES = {
    'libros': 'Libros Contables',
    'kardex': 'Kardex e Inventarios',
    'planillas': 'Planillas de Sueldos',
    'tributario': 'Declaraciones Tributarias',
    'costos': 'Contabilidad de Costos',
    'caja': 'Libro de Caja y Bancos',
    'finanzas': 'Análisis y Finanzas',
    'textos': 'Documentos de Texto',
    'calculo': 'Hojas de Cálculo',
    'hojas': 'Hojas de Cálculo',
    'lienzos': 'Lienzos de Dibujo',
    'diagramas': 'Diagramas de Flujo'
};

window.CATEGORY_STYLES = {
    'libros': { color: '#0ea5e9', initial: 'L' },
    'kardex': { color: '#f59e0b', initial: 'K' },
    'planillas': { color: '#6366f1', initial: 'P' },
    'tributario': { color: '#0284c7', initial: 'T' },
    'costos': { color: '#0369a1', initial: 'C' },
    'caja': { color: '#38bdf8', initial: 'B' },
    'finanzas': { color: '#0ea5e9', initial: 'F' },
    'textos': { color: '#f59e0b', initial: 'D' },
    'calculo': { color: '#fbbf24', initial: 'H' },
    'hojas': { color: '#fbbf24', initial: 'H' },
    'lienzos': { color: '#d97706', initial: 'Z' },
    'diagramas': { color: '#b45309', initial: 'G' }
};

const CATEGORY_NAMES = window.CATEGORY_NAMES;
const CATEGORY_STYLES = window.CATEGORY_STYLES;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Configurar buscador dinámico y prevenir autofill indeseado
    const searchEl = document.getElementById('master-search');
    if (searchEl) {
        searchEl.value = '';
        searchEl.setAttribute('autocomplete', 'off');
        searchEl.setAttribute('oninput', 'handleMasterSearch()');
        searchEl.addEventListener('focus', () => {
            const adminEmail = (window.ADMIN_EMAIL || '').toLowerCase().trim();
            if (searchEl.value && (searchEl.value.toLowerCase().trim() === adminEmail || searchEl.value.includes('@'))) {
                searchEl.value = '';
                const clearBtn = document.getElementById('btn-clear-master-search');
                if (clearBtn) clearBtn.classList.add('hidden');
                window.renderMasterUserList();
            }
        });
    }

    // Antídoto activo para autofill tardío de navegadores (Chrome/Edge inyectan credenciales post-render)
    const purgeAutofill = () => {
        const el = document.getElementById('master-search');
        if (el && el.value) {
            const val = el.value.toLowerCase().trim();
            const adminEmail = (window.ADMIN_EMAIL || '').toLowerCase().trim();
            if (val === adminEmail || val.includes('@')) {
                el.value = '';
                const clearBtn = document.getElementById('btn-clear-master-search');
                if (clearBtn) clearBtn.classList.add('hidden');
                window.renderMasterUserList();
            }
        }
    };
    [50, 150, 300, 600, 1200, 2000].forEach(delay => setTimeout(purgeAutofill, delay));
    
    // 2. Verificar privilegios del administrador
    if (window.supabaseClient) {
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session || session.user.email.toLowerCase() !== window.ADMIN_EMAIL.toLowerCase()) {
                window.location.href = 'index.html';
                return;
            }
            
            // Cargar proyectos de la base de datos de Supabase
            await loadMasterData();
        } catch (e) {
            console.error("Error al autenticar sesión de admin:", e);
            window.location.href = 'index.html';
            return;
        }
    } else {
        window.location.href = 'index.html';
        return;
    }

    const initialAdminBtn = document.getElementById('btn-tab-explorer');
    if (initialAdminBtn) moveAdminTab(initialAdminBtn, 0, false);

    // 3. Desvanecer preloader suavemente tras cargar datos maestros y estructurar DOM
    if (typeof window.dismissGlobalPreloader === 'function') {
        window.dismissGlobalPreloader();
    }
});

window.addEventListener('resize', () => {
    const activeAdminBtn = document.getElementById(`btn-tab-${window.activeAdminTab || 'explorer'}`);
    if (activeAdminBtn) moveAdminTab(activeAdminBtn, ADMIN_MAIN_TABS.indexOf(window.activeAdminTab || 'explorer'), false);
    const activeCmsBtn = document.getElementById(`btn-cms-sub-${window.activeLibrarySubTab || 'educonvert'}`);
    if (activeCmsBtn) moveCmsSubTab(activeCmsBtn, ['educonvert', 'glosario', 'parametros'].indexOf(window.activeLibrarySubTab || 'educonvert'), false);
});

// Enrutador de búsqueda dinámico para el explorador
window.handleMasterSearch = function() {
    const searchInput = document.getElementById('master-search');
    const clearBtn = document.getElementById('btn-clear-master-search');
    if (clearBtn && searchInput) {
        if (searchInput.value.trim().length > 0) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    }
    window.renderMasterUserList();
};

window.clearMasterSearch = function() {
    const searchInput = document.getElementById('master-search');
    const clearBtn = document.getElementById('btn-clear-master-search');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    window.renderMasterUserList();
};

window.openUserFolder = function(userId, userName) {
    window.explorerState.currentUserId = userId;
    window.explorerState.currentUserName = userName;
    window.explorerState.currentCategory = null;
    window.clearMasterSearch();
};

window.openCategoryFolder = function(categoryId) {
    window.explorerState.currentCategory = categoryId;
    window.clearMasterSearch();
};

// Navegación del explorador
window.goToLevel1 = function() {
    window.explorerState.currentUserId = null;
    window.explorerState.currentUserName = null;
    window.explorerState.currentCategory = null;
    window.clearMasterSearch();
};

window.goToLevel2 = function() {
    window.explorerState.currentCategory = null;
    window.clearMasterSearch();
};

window.setViewMode = function(mode) {
    window.explorerState.viewMode = mode;
    localStorage.setItem('admin_explorer_view', mode);
    window.renderMasterUserList();
};

// Carga de todos los proyectos de Supabase
window.loadMasterData = async function() {
    const tableBody = document.getElementById('master-table-body');
    if (tableBody) {
        tableBody.innerHTML = `
            <div class="col-span-full text-center py-20">
                <i class="fas fa-spinner fa-spin text-sky-500 text-4xl mb-4"></i>
                <p class="text-slate-400 font-bold">Cargando base de datos global...</p>
            </div>
        `;
    }
    try {
        let { data, error } = await window.supabaseClient
            .from('proyectos_contables')
            .select('*, profiles(full_name, username)')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn("Reintentando consulta de proyectos sin relación profiles:", error);
            const retry = await window.supabaseClient
                .from('proyectos_contables')
                .select('*')
                .order('created_at', { ascending: false });
            if (retry.error) throw retry.error;
            data = retry.data;
        }

        window.masterProjectsData = data || [];
        window.renderMasterUserList();
    } catch (err) {
        console.error("Error cargando panel maestro:", err);
        if (tableBody) {
            tableBody.innerHTML = `
                <div class="col-span-full text-center py-20 bg-rose-950/20 border border-rose-900 rounded-[24px] text-rose-400 font-bold shadow-sm">
                    <i class="fas fa-exclamation-triangle mr-2"></i> Error al cargar datos: ${escHtml(err.message)}
                </div>
            `;
        }
    }
};

// Helper: Actualiza la barra de herramientas fija del explorador directamente en el DOM
function getBreadcrumbsHTML() {
    const state = window.explorerState;
    const breadcrumbsMount = document.getElementById('breadcrumbs-mount-point');
    const toggleMount = document.getElementById('view-toggle-mount-point');
    if (!breadcrumbsMount) return '';

    let breadcrumbs = `<span class="explorer-breadcrumb-item ${!state.currentUserId ? 'active' : ''}" onclick="window.goToLevel1()">Bóveda Global</span>`;
    if (state.currentUserId) {
        breadcrumbs += ' <i class="fas fa-chevron-right" style="font-size:8px;color:#334155;"></i> ';
        breadcrumbs += `<span class="explorer-breadcrumb-item ${!state.currentCategory ? 'active' : ''}" onclick="window.goToLevel2()">${escHtml(state.currentUserName)}</span>`;
    }
    if (state.currentCategory) {
        breadcrumbs += ' <i class="fas fa-chevron-right" style="font-size:8px;color:#334155;"></i> ';
        const catLabel = (CATEGORY_NAMES[state.currentCategory] || state.currentCategory || 'LIBROS').toUpperCase();
        breadcrumbs += `<span class="explorer-breadcrumb-item active">${catLabel}</span>`;
    }

    breadcrumbsMount.innerHTML = `<i class="fas fa-folder-open" style="color:#38bdf8;font-size:13px;margin-right:6px;"></i>${breadcrumbs}`;

    if (toggleMount) {
        let viewToggleHTML = '';
        if (state.currentUserId && state.currentCategory) {
            const isGrid = state.viewMode === 'grid';
            viewToggleHTML = `<div style="display:flex;align-items:center;gap:5px;">
                <button class="view-toggle-btn ${isGrid ? 'active' : ''}" onclick="window.setViewMode('grid')" title="Vista Cuadrícula"><i class="fas fa-th-large"></i></button>
                <button class="view-toggle-btn ${!isGrid ? 'active' : ''}" onclick="window.setViewMode('list')" title="Vista Lista"><i class="fas fa-list"></i></button>
            </div>`;
        }
        toggleMount.innerHTML = viewToggleHTML;
    }
    return '';
}

// =========================================================
// NAVEGACIÓN Y SOPORTE DE TABS (ADMIN DE REPORTES)
// =========================================================
window.activeAdminTab = 'explorer';
let currentAdminTabIndex = 0;
let adminTabSnapTimeout = null;
const ADMIN_MAIN_TABS = ['explorer', 'support', 'library'];

function moveAdminTab(btn, newIndex, animate = true) {
    const pill = document.getElementById('admin-main-pill');
    if (!pill || !btn) return;

    if (adminTabSnapTimeout) {
        clearTimeout(adminTabSnapTimeout);
        adminTabSnapTimeout = null;
    }

    if (btn.offsetWidth === 0) {
        requestAnimationFrame(() => {
            if (btn.offsetWidth > 0) moveAdminTab(btn, newIndex, animate);
        });
        return;
    }

    const distance = Math.abs(newIndex - currentAdminTabIndex);
    const stretch = (animate && distance > 0) ? (1 + Math.min(distance * 0.15, 0.35)) : 1;

    if (!animate) {
        pill.style.transition = 'none';
    }

    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.opacity = '1';

    if (animate && distance > 0) {
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(${stretch}) scaleY(0.9)`;
        adminTabSnapTimeout = setTimeout(() => {
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

    currentAdminTabIndex = newIndex;
}
window.moveAdminTab = moveAdminTab;

window.switchAdminTab = function(tabName) {
    window.activeAdminTab = tabName;
    
    const btnExplorer = document.getElementById('btn-tab-explorer');
    const btnSupport = document.getElementById('btn-tab-support');
    const btnLibrary = document.getElementById('btn-tab-library');
    const screenExplorer = document.getElementById('master-screen');
    const screenSupport = document.getElementById('support-screen');
    const screenLibrary = document.getElementById('library-screen');
    
    // Resetear estilos de todos los botones
    [btnExplorer, btnSupport, btnLibrary].forEach(btn => {
        if (btn) {
            btn.className = "relative z-10 px-4 py-1.5 rounded-full text-slate-400 text-[10px] uppercase font-black tracking-wider transition-all flex items-center gap-1.5 hover:text-slate-200";
        }
    });

    // Ocultar todas las pantallas
    if (screenExplorer) screenExplorer.classList.add('hidden');
    if (screenSupport) screenSupport.classList.add('hidden');
    if (screenLibrary) screenLibrary.classList.add('hidden');

    const breadcrumbs = document.getElementById('breadcrumbs-mount-point');
    const viewToggle = document.getElementById('view-toggle-mount-point');
    
    if (tabName === 'explorer') {
        if (btnExplorer) {
            btnExplorer.className = "relative z-10 px-4 py-1.5 rounded-full text-slate-100 text-[10px] uppercase font-black tracking-wider transition-all flex items-center gap-1.5";
        }
        if (screenExplorer) screenExplorer.classList.remove('hidden');
        if (breadcrumbs) breadcrumbs.style.opacity = '1';
        if (viewToggle) viewToggle.style.opacity = '1';
        
    } else if (tabName === 'support') {
        if (btnSupport) {
            btnSupport.className = "relative z-10 px-4 py-1.5 rounded-full text-slate-100 text-[10px] uppercase font-black tracking-wider transition-all flex items-center gap-1.5";
        }
        if (screenSupport) screenSupport.classList.remove('hidden');
        if (breadcrumbs) breadcrumbs.style.opacity = '0';
        if (viewToggle) viewToggle.style.opacity = '0';
        
        window.loadSupportTickets();
        
        if (window.innerWidth < 1024) {
            const detailPane = document.getElementById('support-detail-pane');
            const inboxPane = document.getElementById('support-inbox-pane');
            if (detailPane) detailPane.classList.add('hidden');
            if (inboxPane) inboxPane.classList.remove('hidden');
        }
    } else if (tabName === 'library') {
        if (btnLibrary) {
            btnLibrary.className = "relative z-10 px-4 py-1.5 rounded-full text-emerald-400 text-[10px] uppercase font-black tracking-wider transition-all flex items-center gap-1.5";
        }
        if (screenLibrary) screenLibrary.classList.remove('hidden');
        if (breadcrumbs) breadcrumbs.style.opacity = '0';
        if (viewToggle) viewToggle.style.opacity = '0';

        window.loadLibraryCMSData();

        setTimeout(() => {
            const activeCmsBtn = document.getElementById(`btn-cms-sub-${window.activeLibrarySubTab || 'educonvert'}`);
            if (activeCmsBtn && typeof window.moveCmsSubTab === 'function') {
                const tabs = ['educonvert', 'glosario', 'parametros'];
                window.moveCmsSubTab(activeCmsBtn, tabs.indexOf(window.activeLibrarySubTab || 'educonvert'), false);
            }
        }, 50);
    }

    const activeBtn = document.getElementById(`btn-tab-${tabName}`);
    if (activeBtn) {
        const idx = ADMIN_MAIN_TABS.indexOf(tabName);
        moveAdminTab(activeBtn, idx >= 0 ? idx : 0);
    }
};

window.supportTicketsCache = [];
window.activeTicketId = null;

// Generar un color HSL único y vibrante en base al nombre del remitente
function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 55%, 42%)`;
}

window.loadSupportTickets = async function(showSpinner = true) {
    const body = document.getElementById('support-tickets-body');
    const badge = document.getElementById('ticket-count-badge');
    if (!body) return;
    
    if (showSpinner) {
        body.innerHTML = `
            <div class="text-center py-20">
                <i class="fas fa-spinner fa-spin text-sky-500 text-3xl mb-4"></i>
                <p class="text-slate-400 text-xs font-bold">Cargando bandeja de soporte...</p>
            </div>
        `;
    }
    
    try {
        const GOOGLE_URL = typeof GOOGLE_SCRIPT_URL !== 'undefined' ? GOOGLE_SCRIPT_URL : "https://script.google.com/macros/s/AKfycbxW4BP3_pNQWBuOqdpJnvT8p_Lc3f2sos9j8vWLHZ3ByWzJjKE4dVx2hukgXjqQXMQtDA/exec";
        
        const response = await fetch(GOOGLE_URL, {
            method: 'GET',
            mode: 'cors'
        });
        
        const resData = await response.json();
        
        if (resData.status !== 'success') {
            throw new Error(resData.message || "Error devuelto por el servidor de Google");
        }
        
        const tickets = resData.tickets || [];
        window.supportTicketsCache = tickets;
        
        if (badge) {
            badge.innerText = `${tickets.length} Tickets`;
        }
        
        if (tickets.length === 0) {
            body.innerHTML = `
                <div class="text-center py-20 text-slate-500 font-bold">
                    <i class="fas fa-inbox text-3xl mb-4 text-slate-600"></i>
                    <p class="text-xs">No se encontraron reportes registrados.</p>
                </div>
            `;
            return;
        }
        
        // Renderizar bandeja inbox interactiva
        body.innerHTML = tickets.slice().reverse().map(ticket => {
            // Formatear fecha corta
            let dateStr = "Sin fecha";
            if (ticket.fecha) {
                try {
                    const d = new Date(ticket.fecha);
                    dateStr = d.toLocaleDateString('es-SV', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });
                } catch(e) {
                    dateStr = String(ticket.fecha);
                }
            }
            
            // Dot indicador de estado
            const isResolved = ticket.estado === 'Resuelto';
            const statusDot = isResolved 
                ? `<span class="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Resuelto"></span>`
                : `<span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" title="Pendiente"></span>`;
                
            const isActive = window.activeTicketId === ticket.id;
            const activeClasses = isActive ? 'active-row border-l-2 border-sky-500 bg-sky-500/5' : '';
            
            return `
                <div onclick="window.showSupportDetail(${ticket.id})" data-id="${ticket.id}" class="inbox-ticket-row ${activeClasses} flex items-center justify-between p-5 hover:bg-white/5 transition-all cursor-pointer group">
                    <div class="flex items-center gap-4 flex-1 min-w-0">
                        <!-- Estado -->
                        <div class="flex-shrink-0 flex items-center justify-center w-5">
                            ${statusDot}
                        </div>
                        
                        <!-- Remitente -->
                        <div class="flex-shrink-0 w-32 font-bold text-slate-200 text-xs truncate">
                            ${escHtml(ticket.nombre)}
                        </div>
                        
                        <!-- Asunto pill -->
                        <div class="flex-shrink-0 w-28">
                            <span class="px-2 py-0.5 rounded bg-slate-900 text-[9px] font-bold text-slate-400 border border-white/5 truncate block w-fit max-w-full uppercase tracking-wider">${escHtml(ticket.asunto)}</span>
                        </div>
                        
                        <!-- Mensaje snippet -->
                        <div class="flex-1 text-slate-400 text-xs truncate pr-6 group-hover:text-slate-300 transition-colors">
                            ${escHtml(ticket.mensaje)}
                        </div>
                    </div>
                    
                    <!-- Fecha -->
                    <div class="flex-shrink-0 text-slate-500 text-[10px] font-bold">
                        ${dateStr}
                    </div>
                </div>
            `;
        }).join('');
        
        // Si hay un ticket activo seleccionado, refrescarlo
        if (window.activeTicketId !== null) {
            window.showSupportDetail(window.activeTicketId);
        }
        
    } catch (err) {
        console.error("Error al cargar reportes:", err);
        body.innerHTML = `
            <div class="text-center py-20 text-rose-400 font-bold">
                <i class="fas fa-exclamation-triangle text-3xl mb-4 text-rose-500"></i>
                <p class="text-xs">Error de conexión al cargar reportes: ${escHtml(err.message)}</p>
                <p class="text-[10px] text-slate-500 mt-2 font-normal">Verifica la implementación del Apps Script.</p>
            </div>
        `;
    }
};

window.showSupportDetail = function(ticketId) {
    const ticket = window.supportTicketsCache.find(t => t.id === ticketId);
    if (!ticket) return;
    
    window.activeTicketId = ticketId;
    
    const detailPane = document.getElementById('support-detail-pane');
    const inboxPane = document.getElementById('support-inbox-pane');
    const blankState = document.getElementById('detail-blank-state');
    const contentArea = document.getElementById('detail-content-area');
    
    if (!detailPane || !inboxPane || !blankState || !contentArea) return;
    
    // Resaltar la fila seleccionada en el inbox
    const rows = document.querySelectorAll('.inbox-ticket-row');
    rows.forEach(row => {
        const rowId = parseInt(row.getAttribute('data-id'));
        if (rowId === ticketId) {
            row.className = "inbox-ticket-row active-row flex items-center justify-between p-5 hover:bg-white/5 transition-all cursor-pointer group border-l-2 border-sky-500 bg-sky-500/5";
        } else {
            row.className = "inbox-ticket-row flex items-center justify-between p-5 hover:bg-white/5 transition-all cursor-pointer group";
        }
    });
    
    // Mostrar contenido y ocultar blank state
    blankState.classList.add('hidden');
    contentArea.classList.remove('hidden');
    
    // Soporte responsive para pantallas pequeñas (móviles/tabletas)
    if (window.innerWidth < 1024) {
        inboxPane.classList.add('hidden');
        detailPane.classList.remove('hidden');
    }
    
    const dateStr = ticket.fecha ? new Date(ticket.fecha).toLocaleString('es-SV') : "Sin fecha";
    const initials = escHtml(ticket.nombre ? ticket.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "SU");
    const avatarBg = getAvatarColor(ticket.nombre || "Soporte");
    
    const isResolved = ticket.estado === 'Resuelto';
    const resolveWidgetHTML = isResolved
        ? `
        <div class="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl text-emerald-400 text-xs font-black select-none">
            <i class="fas fa-check-circle text-sm"></i>
            <span>Resuelto</span>
        </div>
        `
        : `
        <label class="flex items-center gap-2.5 cursor-pointer bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl text-amber-400 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all text-xs font-black">
            <input type="checkbox" onchange="window.resolveTicketFromDetail(${ticket.id}, this)" class="accent-emerald-500 w-4 h-4 rounded cursor-pointer">
            <span>Marcar Resuelto</span>
        </label>
        `;
        
    let evidenceHTML = '';
    if (ticket.fileUrl && ticket.fileUrl !== 'Sin archivo') {
        evidenceHTML = `
            <div class="mt-6 border border-white/5 rounded-2xl p-5 bg-[#08080a]/60">
                <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3">Evidencia Adjunta</span>
                <a href="${safeUrl(ticket.fileUrl)}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-4 bg-[#121215] hover:bg-[#1a1a20] p-3 rounded-xl border border-white/5 transition-all group max-w-md">
                    <div class="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400 text-xl group-hover:scale-105 transition-transform border border-sky-500/15">
                        <i class="fas fa-image"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="text-xs font-bold text-white truncate">Captura de pantalla / Evidencia</div>
                        <div class="text-[10px] text-sky-400 mt-0.5">Ver archivo en Drive <i class="fas fa-external-link-alt ml-1"></i></div>
                    </div>
                </a>
            </div>
        `;
    }
    
    contentArea.innerHTML = `
        <!-- Botón Volver (Solo visible en móviles) -->
        <button onclick="window.backToSupportInbox()" class="lg:hidden mb-6 px-4 py-2 bg-slate-900 border border-[#2d2d30] text-slate-300 rounded-xl hover:bg-white hover:text-black transition-all flex items-center gap-2 text-xs font-bold">
            <i class="fas fa-arrow-left"></i> Volver a la Bandeja
        </button>
        
        <!-- Cabecera de Detalles -->
        <div class="flex justify-between items-start gap-4 mb-6 border-b border-white/5 pb-6">
            <div>
                <!-- Asunto como Título -->
                <h3 class="text-xl font-extrabold text-white tracking-tight mb-1.5">${escHtml(ticket.asunto)}</h3>
                <div class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">${dateStr}</div>
            </div>
            <div>
                ${resolveWidgetHTML}
            </div>
        </div>
        
        <!-- Datos del Remitente -->
        <div class="flex items-center gap-3.5 mb-6 p-4 bg-[#141416]/40 rounded-2xl border border-white/5">
            <div class="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm select-none border border-white/10" style="background-color: ${avatarBg}">
                ${initials}
            </div>
            <div class="min-w-0 flex-1">
                <div class="font-bold text-slate-100 text-sm">${escHtml(ticket.nombre)}</div>
                <div class="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span class="hover:text-sky-400 cursor-pointer flex items-center gap-1" onclick="window.copyToClipboard(${escJsArg(ticket.correo)}, 'Correo copiado')">
                        <i class="far fa-envelope text-[11px] text-slate-500"></i> ${escHtml(ticket.correo)}
                    </span>
                    <span class="text-slate-600">•</span>
                    <span class="flex items-center gap-1">
                        <i class="fas fa-phone-alt text-[10px] text-slate-500"></i> ${escHtml(ticket.telefono || "No especificado")}
                    </span>
                </div>
            </div>
        </div>
        
        <!-- Mensaje / Detalles -->
        <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Mensaje / Consulta</span>
            <div class="bg-[#141416]/20 border border-white/5 rounded-2xl p-5 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap mb-4">
                ${escHtml(ticket.mensaje)}
            </div>
            
            <!-- Evidencias -->
            ${evidenceHTML}
        </div>
    `;
};

window.backToSupportInbox = function() {
    const detailPane = document.getElementById('support-detail-pane');
    const inboxPane = document.getElementById('support-inbox-pane');
    if (detailPane && inboxPane) {
        detailPane.classList.add('hidden');
        inboxPane.classList.remove('hidden');
        window.activeTicketId = null;
        
        // Remover resaltar del inbox
        const rows = document.querySelectorAll('.inbox-ticket-row');
        rows.forEach(row => row.classList.remove('active-row', 'border-l-2', 'border-sky-500', 'bg-sky-500/5'));
    }
};

window.copyToClipboard = function(text, toastMsg) {
    navigator.clipboard.writeText(text);
    if (window.showAlert) {
        window.showAlert("Copiado", toastMsg);
    } else {
        alert(toastMsg);
    }
};

window.resolveTicketFromDetail = async function(rowId, checkboxInput) {
    if (!checkboxInput.checked) return;
    
    await window.resolveTicket(rowId);
    
    const ticket = window.supportTicketsCache.find(t => t.id === rowId);
    if (ticket && ticket.estado !== 'Resuelto') {
        checkboxInput.checked = false;
    } else {
        window.showSupportDetail(rowId);
    }
};

window.resolveTicket = async function(rowId) {
    if (!confirm("¿Estás seguro de marcar este reporte como Resuelto?")) return;
    
    try {
        const GOOGLE_URL = typeof GOOGLE_SCRIPT_URL !== 'undefined' ? GOOGLE_SCRIPT_URL : "https://script.google.com/macros/s/AKfycbxW4BP3_pNQWBuOqdpJnvT8p_Lc3f2sos9j8vWLHZ3ByWzJjKE4dVx2hukgXjqQXMQtDA/exec";
        
        const response = await fetch(`${GOOGLE_URL}?action=resolve&row=${rowId}`, {
            method: 'GET',
            mode: 'cors'
        });
        
        const resData = await response.json();
        
        if (resData.status === 'success') {
            const ticket = window.supportTicketsCache.find(t => t.id === rowId);
            if (ticket) ticket.estado = 'Resuelto';
            
            if (window.showAlert) {
                window.showAlert("Completado", "El reporte se ha marcado como Resuelto con éxito.");
            } else {
                alert("El reporte se ha marcado como Resuelto con éxito.");
            }
            window.loadSupportTickets(false); // Recargar lista silenciosamente
        } else {
            throw new Error(resData.message || "Error al actualizar la fila");
        }
    } catch (err) {
        console.error("Error al resolver ticket:", err);
        if (window.showAlert) {
            window.showAlert("Error", "No se pudo actualizar el reporte: " + err.message);
        } else {
            alert("No se pudo actualizar el reporte: " + err.message);
        }
    }
};

// Helper: Genera HTML de carpeta glassmorphic premium (animación de hojas + backdrop-filter) o icono de archivo
function buildGlassFolderHTML({ id, title, subtitle, badgeCount = '', initial = '', isArchived = false, brandLabel = 'EDUCONTA', actionsHTML = '', onClick = '', accentColor = '#38bdf8', isFile = false }) {
    const safeId = String(id).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 28);
    const flapBg = isArchived
        ? 'linear-gradient(175deg,rgba(75,30,35,0.78) 0%,rgba(30,12,15,0.52) 100%)'
        : 'linear-gradient(175deg,rgba(58,58,66,0.78) 0%,rgba(16,16,19,0.52) 100%)';
    const backBg = isArchived ? '#211619' : '#181819';
    const fileBg = isArchived ? 'rgba(75,30,35,0.85)' : 'rgba(30,30,34,0.85)';
    const gId = 'gfb_' + safeId;
    const s1 = isArchived ? 'rgba(239,68,68,0.38)' : 'rgba(255,255,255,0.28)';
    const s2 = isArchived ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.12)';
    const cnt = badgeCount !== '' ? escHtml(String(badgeCount)) : '';
    const safeBrandLabel = escHtml(brandLabel);
    const safeInitial = initial ? escHtml(initial) : '';

    const visualContent = isFile ? `
        <!-- SVG Icono de Archivo Único y Recto (papel blanco) -->
        <div style="position:relative;width:160px;height:135px;display:flex;align-items:center;justify-content:center;user-select:none;">
            <svg viewBox="0 0 100 120" style="width:70px;height:84px;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.4));" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Archivo blanco -->
                <path d="M10 0 C 4.5 0, 0 4.5, 0 10 V 110 C 0 115.5, 4.5 120, 10 120 H 90 C 95.5 120, 100 115.5, 100 110 V 30 L 70 0 H 10 Z" fill="#ffffff" stroke="rgba(0,0,0,0.05)" stroke-width="1.5"/>
                <path d="M 70 0 V 30 H 100" fill="#f1f5f9" stroke="rgba(0,0,0,0.03)" stroke-width="1.5"/>
                <!-- Líneas de texto -->
                <rect x="20" y="45" width="40" height="4" rx="2" fill="${accentColor}" fill-opacity="0.8"/>
                <rect x="20" y="60" width="60" height="4" rx="2" fill="#cbd5e1"/>
                <rect x="20" y="75" width="50" height="4" rx="2" fill="#cbd5e1"/>
                <rect x="20" y="90" width="60" height="4" rx="2" fill="#cbd5e1"/>
            </svg>
        </div>
    ` : `
        <div style="position:relative;width:160px;height:135px;overflow:visible;user-select:none;">
                    <div style="position:absolute;left:10px;right:10px;bottom:3px;height:90px;background:rgba(0,0,0,0.7);border-radius:18px;filter:blur(10px);"></div>
                    <div style="position:absolute;left:12px;right:12px;bottom:10px;height:92px;border-radius:18px;border:1px solid rgba(255,255,255,0.035);background:${backBg};box-shadow:inset 0 1px 2px rgba(255,255,255,0.04);"></div>
                    <div class="folder-sheet sheet-1" style="position:absolute;left:22px;top:12px;width:102px;height:76px;border-radius:10px;background:#ffffff;box-shadow:0 3px 10px rgba(0,0,0,0.2);transform-origin:bottom center;transform:rotate(-4deg);display:flex;flex-direction:column;padding:10px;gap:6px;">
                        <div style="height:3.5px;background:#cbd5e1;border-radius:99px;width:100%"></div>
                        <div style="height:3.5px;background:#cbd5e1;border-radius:99px;width:75%"></div>
                        <div style="height:3.5px;background:#cbd5e1;border-radius:99px;width:85%"></div>
                        <div style="height:3.5px;background:#cbd5e1;border-radius:99px;width:50%"></div>
                    </div>
                    <div class="folder-sheet sheet-2" style="position:absolute;left:29px;top:10px;width:102px;height:76px;border-radius:10px;background:#ffffff;box-shadow:0 5px 14px rgba(0,0,0,0.22);transform-origin:bottom center;transform:rotate(1.5deg);display:flex;flex-direction:column;padding:10px;gap:6px;">
                        <div style="height:3.5px;background:#cbd5e1;border-radius:99px;width:100%"></div>
                        <div style="height:3.5px;background:#cbd5e1;border-radius:99px;width:65%"></div>
                        <div style="height:3.5px;background:#cbd5e1;border-radius:99px;width:80%"></div>
                        <div style="height:3.5px;background:#cbd5e1;border-radius:99px;width:45%"></div>
                    </div>
                    <div class="folder-sheet sheet-3" style="position:absolute;left:36px;top:14px;width:102px;height:76px;border-radius:10px;background:#ffffff;box-shadow:0 3px 10px rgba(0,0,0,0.2);transform-origin:bottom center;transform:rotate(7deg);display:flex;flex-direction:column;padding:10px;gap:6px;">
                        <div style="height:3.5px;background:#cbd5e1;border-radius:99px;width:100%"></div>
                        <div style="height:3.5px;background:#cbd5e1;border-radius:99px;width:70%"></div>
                        <div style="height:3.5px;background:#cbd5e1;border-radius:99px;width:55%"></div>
                        <div style="height:3.5px;background:#cbd5e1;border-radius:99px;width:80%"></div>
                    </div>
                    <div style="position:absolute;left:12px;right:12px;bottom:10px;height:78px;background:rgba(0,0,0,0.035);border-radius:18px;pointer-events:none;"></div>
                    <div style="position:absolute;left:12px;right:12px;bottom:10px;height:78px;background:${flapBg};backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);clip-path:path('M 0 12 C 0 5, 5 0, 12 0 H 54 C 59 0, 63 2, 66 5 L 75 14 C 78 17, 81 19, 85 19 H 124 C 130 19, 136 24, 136 30 V 66 C 136 72, 130 78, 124 78 H 12 C 5 78, 0 72, 0 66 Z');transition:background 0.3s ease;">
                        <div style="position:absolute;left:11px;bottom:10px;font-size:7.5px;font-weight:800;letter-spacing:0.12em;color:rgba(255,255,255,0.16);text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:1px;pointer-events:none;">${safeBrandLabel}</div>
                        ${cnt ? '<div style="position:absolute;right:9px;top:22px;background:' + accentColor + '1e;border:1px solid ' + accentColor + '45;border-radius:6px;padding:2px 6px;font-size:9px;font-weight:800;color:' + accentColor + ';pointer-events:none;font-family:\'Plus Jakarta Sans\',sans-serif;font-variant-numeric:tabular-nums;">' + cnt + '</div>' : ''}
                        ${safeInitial ? '<div style="position:absolute;right:9px;bottom:8px;width:26px;height:26px;background:' + accentColor + '16;border:1px solid ' + accentColor + '3d;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:' + accentColor + ';pointer-events:none;">' + safeInitial + '</div>' : ''}
                    </div>
                    <svg style="position:absolute;left:12px;bottom:10px;height:78px;width:136px;pointer-events:none;overflow:visible;" viewBox="0 0 136 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 0 12 C 0 5, 5 0, 12 0 H 54 C 59 0, 63 2, 66 5 L 75 14 C 78 17, 81 19, 85 19 H 124 C 130 19, 136 24, 136 30 V 66 C 136 72, 130 78, 124 78 H 12 C 5 78, 0 72, 0 66 Z" stroke="url(#${gId})" stroke-width="1.2"/>
                        <path d="M 1 12 C 1 6, 6 1, 12 1 H 53 C 57 1, 61 3, 64 6 L 73 15 C 76 18, 80 20, 84 20 H 124 C 129 20, 134 24, 134 29" stroke="rgba(255,255,255,0.28)" stroke-width="0.8"/>
                        <defs>
                            <linearGradient id="${gId}" x1="0" y1="0" x2="136" y2="78" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stop-color="${s1}"/>
                                <stop offset="50%" stop-color="rgba(255,255,255,0.03)"/>
                                <stop offset="100%" stop-color="${s2}"/>
                            </linearGradient>
                    </svg>
                </div>
    `;

    return `
        <div class="educonta-folder-card${isArchived ? ' archived-card' : ''}" ${onClick}>
            <div class="folder-visual-wrapper">
                ${visualContent}
            </div>
            <div class="folder-title-text">${escHtml(title)}</div>
            <div class="folder-subtitle-text">${escHtml(subtitle)}</div>
            ${actionsHTML ? '<div class="folder-actions">' + actionsHTML + '</div>' : ''}
        </div>
    `;
}

// Renderizador Unificado del Explorador
window.renderMasterUserList = function() {
    const state = window.explorerState;
    
    // Sincronizar variables globales de compatibilidad
    window.currentAuditUserId = state.currentUserId;
    window.currentAuditUserName = state.currentUserName;
    
    // Configurar botón Volver en la cabecera
    const btnBack = document.getElementById('btn-master-back');
    if (btnBack) {
        if (state.currentUserId) {
            btnBack.classList.remove('hidden');
            btnBack.style.display = 'flex';
            btnBack.onclick = () => {
                if (state.currentCategory) {
                    window.goToLevel2();
                } else {
                    window.goToLevel1();
                }
            };
        } else {
            btnBack.classList.add('hidden');
            btnBack.style.display = 'none';
        }
    }
    
    // Configurar título del panel
    const masterTitle = document.getElementById('header-admin-title');
    if (masterTitle) {
        if (state.currentUserId) {
            const shortUID = (state.currentUserId || '').substring(0, 8);
            masterTitle.innerHTML = `<i class="fas fa-lock text-sky-500 mr-2 animate-pulse"></i> <span class="text-white">${escHtml(state.currentUserName)}</span> <span class="text-slate-600 text-xs font-semibold tabular-nums ml-2">#${shortUID}</span>`;
        } else {
            masterTitle.innerHTML = `Bóveda <span class="text-sky-400">Global</span>`;
        }
    }
    
    const tableBody = document.getElementById('master-table-body');
    if (!tableBody) return;
    
    // Procesar proyectos y de-duplicar
    const uniqueProjectsSet = new Set();
    const deduplicatedProjects = [];
    
    window.masterProjectsData.forEach(d => {
        let pData = {};
        try {
            pData = typeof d.data === 'string' ? JSON.parse(d.data || '{}') : (d.data || {});
        } catch(e) { pData = {}; }
        
        const projectId = pData.id;
        if (projectId) {
            const uniqueKey = d.user_id + '_' + projectId;
            if (!uniqueProjectsSet.has(uniqueKey)) {
                uniqueProjectsSet.add(uniqueKey);
                d._parsedData = pData;
                deduplicatedProjects.push(d);
            }
        } else if (!uniqueProjectsSet.has(d.id)) {
            uniqueProjectsSet.add(d.id);
            d._parsedData = pData;
            deduplicatedProjects.push(d);
        }
    });
    
    // Renderizar según nivel activo
    if (!state.currentUserId) {
        renderLevel1(tableBody, deduplicatedProjects);
    } else if (!state.currentCategory) {
        renderLevel2(tableBody, deduplicatedProjects);
    } else {
        renderLevel3(tableBody, deduplicatedProjects);
    }
};

// Nivel 1: Listado de todos los usuarios
function renderLevel1(container, projects) {
    const searchInput = document.getElementById('master-search');
    const term = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    // Agrupar proyectos por ID de usuario
    const usersMap = {};
    projects.forEach(d => {
        const uid = d.user_id || 'Desconocido';
        if (!usersMap[uid]) {
            const profileName = d.profiles ? (d.profiles.full_name || d.profiles.username) : null;
            const extractedName = profileName || (d._parsedData && d._parsedData.owner_name) || (d._parsedData && d._parsedData.user_metadata && d._parsedData.user_metadata.full_name) || null;
            const extractedEmail = (d._parsedData && d._parsedData.owner_email) || d.user_email || null;
            
            let showName = extractedName;
            if (!showName) showName = extractedEmail;
            if (!showName) showName = `ID: ${(d.user_id || '').substring(0, 8)}`;
            
            usersMap[uid] = {
                email: showName,
                id: d.user_id,
                projectsCount: 0,
                lastActive: d.created_at
            };
        }
        usersMap[uid].projectsCount++;
    });
    
    // Filtrar por término de búsqueda (ignorando si es autofill del email del admin)
    const adminEmail = (window.ADMIN_EMAIL || '').toLowerCase().trim();
    const isAutofillTerm = term && (term === adminEmail || (term.includes('@') && adminEmail.includes(term)));
    const usersArray = Object.values(usersMap).filter(u => {
        if (!term || isAutofillTerm) return true;
        const searchStr1 = String(u.email || '').toLowerCase();
        const searchStr2 = String(u.id || '').toLowerCase();
        return searchStr1.includes(term) || searchStr2.includes(term);
    });
    
    container.className = 'flex flex-col w-full overflow-visible';
    
    if (usersArray.length === 0) {
        container.innerHTML = `
            ${getBreadcrumbsHTML()}
            <div class="text-center py-20 font-sans">
                <i class="fas fa-ghost text-4xl text-slate-600 mb-3 pointer-events-none"></i>
                <p class="text-slate-400 font-bold">No se encontraron usuarios coincidentes.</p>
            </div>
        `;
        return;
    }
    
    let gridHTML = '<div class="explorer-grid-container">';
    usersArray.forEach(u => {
        const initial = (u.email || 'U').substring(0, 1).toUpperCase();
        gridHTML += buildGlassFolderHTML({
            id: u.id,
            title: u.email || 'Usuario',
            subtitle: u.projectsCount + ' proyecto(s)',
            badgeCount: u.projectsCount,
            initial: escHtml(initial),
            brandLabel: 'EDUCONTA',
            onClick: 'onclick="window.openUserFolder(' + escJsArg(u.id) + ', ' + escJsArg(u.email || '') + ');"',
            accentColor: '#38bdf8'
        });
    });
    gridHTML += '</div>';

    getBreadcrumbsHTML();
    container.innerHTML = gridHTML;
}
// Nivel 2: Agrupación por clases de proyectos (Carpetas dinámicas)
function renderLevel2(container, projects) {
    const searchInput = document.getElementById('master-search');
    const term = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const state = window.explorerState;
    
    // Filtrar proyectos de este usuario
    const userProjects = projects.filter(d => d.user_id === state.currentUserId);
    
    // Agrupar proyectos por categoría
    const categoriesMap = {};
    userProjects.forEach(d => {
        const type = (d._parsedData && d._parsedData.type) || 'libros';
        if (!categoriesMap[type]) {
            categoriesMap[type] = {
                id: type,
                name: CATEGORY_NAMES[type] || type.toUpperCase(),
                count: 0
            };
        }
        categoriesMap[type].count++;
    });
    
    // Filtrar por búsqueda protegiendo contra términos de correo o nombre de usuario
    let categoriesArray = Object.values(categoriesMap);
    if (term) {
        const isUserTerm = term.includes('@') || (state.currentUserName && state.currentUserName.toLowerCase().includes(term));
        if (!isUserTerm) {
            const filtered = categoriesArray.filter(cat => cat.name.toLowerCase().includes(term));
            if (filtered.length > 0) categoriesArray = filtered;
        }
    }
    
    container.className = 'flex flex-col w-full overflow-visible';
    
    if (categoriesArray.length === 0) {
        container.innerHTML = `
            ${getBreadcrumbsHTML()}
            <div class="text-center py-20 font-sans">
                <i class="fas fa-ghost text-4xl text-slate-600 mb-3 pointer-events-none"></i>
                <p class="text-slate-400 font-bold">No se encontraron carpetas de proyectos.</p>
            </div>
        `;
        return;
    }
    
    let gridHTML = '<div class="explorer-grid-container">';
    categoriesArray.forEach(cat => {
        const style = CATEGORY_STYLES[cat.id] || { color: '#38bdf8', initial: cat.id.charAt(0).toUpperCase() };
        let accentColor = style.color;
        let catInitial = style.initial;

        gridHTML += buildGlassFolderHTML({
            id: 'cat_' + cat.id,
            title: cat.name,
            subtitle: cat.count + ' archivo(s)',
            badgeCount: cat.count,
            initial: catInitial,
            brandLabel: cat.id.toUpperCase(),
            onClick: 'onclick="window.openCategoryFolder(' + escJsArg(cat.id) + ');"',
            accentColor: accentColor
        });
    });
    gridHTML += '</div>';

    getBreadcrumbsHTML();
    container.innerHTML = gridHTML;
}

// Nivel 3: Listado de archivos del proyecto dentro de la categoria seleccionada (Soporta Grid/Lista)
function renderLevel3(container, projects) {
    const searchInput = document.getElementById('master-search');
    const term = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const state = window.explorerState;

    // Filtrar proyectos de este usuario y esta categoría
    const filteredProjects = projects.filter(d => {
        const isUserMatch = d.user_id === state.currentUserId;
        const pData = d._parsedData || {};
        const pType = pData.type || 'libros';
        const isCatMatch = pType === state.currentCategory;
        
        if (!isUserMatch || !isCatMatch) return false;
        
        if (term) {
            const isEmailOrUser = term.includes('@') || (state.currentUserName && state.currentUserName.toLowerCase().includes(term));
            if (!isEmailOrUser) {
                const projectName = String(pData.name || '').toLowerCase();
                return projectName.includes(term);
            }
        }
        return true;
    });
    
    container.className = 'flex flex-col w-full overflow-visible';
    
    if (filteredProjects.length === 0) {
        container.innerHTML = `
            ${getBreadcrumbsHTML()}
            <div class="text-center py-20 font-sans">
                <i class="fas fa-ghost text-4xl text-slate-600 mb-3 pointer-events-none"></i>
                <p class="text-slate-400 font-bold">No se encontraron archivos coincidentes.</p>
            </div>
        `;
        return;
    }
    
    const isGrid = state.viewMode === 'grid';
    let contentHTML = '';

    if (isGrid) {
        contentHTML = '<div class="explorer-grid-container">';
        filteredProjects.forEach(item => {
            const pData = item._parsedData || {};
            const shortPID = (pData.id || item.id || 'N/A').substring(0, 8);
            const isArchived = item.estado === 'archivado';

            const catStyle = CATEGORY_STYLES[state.currentCategory] || { color: '#38bdf8', initial: (state.currentCategory || 'L').charAt(0).toUpperCase() };
            let accentColor = catStyle.color;
            let typeLabel = (CATEGORY_NAMES[state.currentCategory] || state.currentCategory || 'LIBROS').toUpperCase();
            let typeInitial = catStyle.initial;
            const jsItemId = escJsArg(item.id);

            const actionsHTML =
                (isArchived
                    ? '<button onclick="event.stopPropagation(); window.restoreMasterProject(' + jsItemId + ')" class="list-action-btn btn-restore" title="Restaurar"><i class="fas fa-trash-restore"></i></button>' +
                      '<button onclick="event.stopPropagation(); window.hardDeleteMasterProject(' + jsItemId + ')" class="list-action-btn btn-delete" title="Eliminar Permanentemente"><i class="fas fa-biohazard"></i></button>'
                    : ''
                ) +
                '<button onclick="event.stopPropagation(); window.auditMasterProject(' + jsItemId + ')" class="list-action-btn btn-audit" title="Auditar"><i class="fas fa-eye"></i></button>' +
                '<button onclick="event.stopPropagation(); window.exportSingleProjectJson(' + jsItemId + ')" class="list-action-btn btn-download" title="Descargar Backup"><i class="fas fa-download"></i></button>';

            contentHTML += buildGlassFolderHTML({
                id: item.id,
                title: pData.name || 'Sin Nombre',
                subtitle: pData.updatedAt ? new Date(pData.updatedAt).toLocaleDateString() : 'Sin fecha',
                badgeCount: shortPID,
                initial: typeInitial,
                isArchived: isArchived,
                brandLabel: isArchived ? 'PAPELERA' : typeLabel,
                actionsHTML: actionsHTML,
                onClick: isArchived ? '' : 'onclick="window.auditMasterProject(' + jsItemId + ')"',
                accentColor: accentColor,
                isFile: true
            });
        });
        contentHTML += '</div>';
    } else {
        // RENDER LIST VIEW (ROWS)
        contentHTML = '<div class="explorer-list-container">';
        contentHTML += `
            <div class="explorer-list-header">
                <div>Nombre de Archivo / Proyecto</div>
                <div class="hidden sm:block">Tipo</div>
                <div class="hidden md:block">Modificado el</div>
                <div class="text-right flex-grow">Acciones</div>
            </div>
        `;
        filteredProjects.forEach(item => {
            const pData = item._parsedData || {};
            const isArchived = item.estado === 'archivado';
            
            const catStyle = CATEGORY_STYLES[state.currentCategory] || { color: '#38bdf8', initial: 'L' };
            let badgeColorHex = catStyle.color;
            let typeLabel = CATEGORY_NAMES[state.currentCategory] || state.currentCategory || 'Libros';
            const jsItemId = escJsArg(item.id);
            
            const rowClass = isArchived ? 'explorer-list-row archived-list-row' : 'explorer-list-row';
            const rowAction = isArchived ? '' : `onclick="window.auditMasterProject(${jsItemId})"`;
            
            contentHTML += `
                <div class="${rowClass}" ${rowAction}>
                    <!-- Columna 1: Icono y Nombre -->
                    <div class="flex items-center gap-3.5 min-w-0">
                        <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-6 h-7 flex-shrink-0 drop-shadow-md">
                            <!-- Archivo blanco -->
                            <path d="M10 0 C 4.5 0, 0 4.5, 0 10 V 110 C 0 115.5, 4.5 120, 10 120 H 90 C 95.5 120, 100 115.5, 100 110 V 30 L 70 0 H 10 Z" fill="#ffffff" stroke="rgba(0,0,0,0.1)" stroke-width="2"/>
                            <path d="M 70 0 V 30 H 100" fill="#f1f5f9" stroke="rgba(0,0,0,0.05)" stroke-width="2"/>
                            <!-- Líneas de texto -->
                            <rect x="20" y="45" width="40" height="6" rx="3" fill="${badgeColorHex}" fill-opacity="0.8"/>
                            <rect x="20" y="60" width="60" height="6" rx="3" fill="#cbd5e1"/>
                            <rect x="20" y="75" width="50" height="6" rx="3" fill="#cbd5e1"/>
                            <rect x="20" y="90" width="60" height="6" rx="3" fill="#cbd5e1"/>
                        </svg>
                        <span class="font-bold text-slate-100 truncate ${isArchived ? 'text-rose-400' : 'text-slate-100'}" title="${escHtml(pData.name || 'Sin Nombre')}">${escHtml(pData.name || 'Sin Nombre')}</span>
                    </div>
                    
                    <!-- Columna 2: Tipo -->
                    <div class="hidden sm:block text-xs font-semibold text-slate-400">
                        ${escHtml(typeLabel)}
                    </div>
                    
                    <!-- Columna 3: Modificado el -->
                    <div class="hidden md:block text-xs text-slate-500 tabular-nums">
                        ${pData.updatedAt ? new Date(pData.updatedAt).toLocaleString() : 'N/A'}
                    </div>
                    
                    <!-- Columna 4: Acciones -->
                    <div class="flex items-center gap-1 justify-end">
                        ${isArchived ? `
                            <button onclick="event.stopPropagation(); window.restoreMasterProject(${jsItemId})"
                                class="list-action-btn btn-restore" title="Restaurar Proyecto">
                                <i class="fas fa-trash-restore"></i>
                            </button>
                            <button onclick="event.stopPropagation(); window.hardDeleteMasterProject(${jsItemId})"
                                class="list-action-btn btn-delete" title="Eliminar Permanentemente">
                                <i class="fas fa-biohazard"></i>
                            </button>
                        ` : ''}
                        <button onclick="event.stopPropagation(); window.auditMasterProject(${jsItemId})"
                            class="list-action-btn btn-audit" title="Auditar Modo Solo Lectura">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="event.stopPropagation(); window.exportSingleProjectJson(${jsItemId})"
                            class="list-action-btn btn-download" title="Descargar Respaldo JSON">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        contentHTML += '</div>';
    }

    getBreadcrumbsHTML();
    container.innerHTML = contentHTML;
}

// Exportar copia de un proyecto individual como JSON
window.exportSingleProjectJson = function(uuid) {
    try {
        const item = window.masterProjectsData.find(d => d.id === uuid);
        if (!item || !item.data) {
            if (typeof window.showAlert === 'function') {
                window.showAlert("Error", "No se encontraron los datos de este proyecto.");
            } else {
                alert("Datos no encontrados.");
            }
            return;
        }
        
        let pData = {};
        try {
            pData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
        } catch(e) { pData = item.data || {}; }
        
        const backupData = {
            app: "EDUCONTA_SV_SINGLE_PROJECT_BACKUP",
            backup_date: new Date().toISOString(),
            project_id: uuid,
            project_type: pData.type || 'libros',
            project_name: pData.name || 'Sin Nombre',
            record: item
        };
        
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Backup_${(pData.name || 'Proyecto').replace(/[^a-z0-9]/gi, '_')}_${uuid.substring(0, 8)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        
        if (typeof window.showAlert === 'function') {
            window.showAlert("Backup Creado", "Se ha descargado una copia de seguridad del proyecto seleccionado.");
        } else {
            alert("Backup descargado.");
        }
    } catch (e) {
        console.error("Error al exportar:", e);
        alert("Error al exportar: " + e.message);
    }
};

// Restaurar un proyecto desde Papelera a Activo
window.restoreMasterProject = async function(uuid) {
    const action = async () => {
        if (typeof window.closeModal === 'function') window.closeModal();
        try {
            const { error } = await window.supabaseClient
                .from('proyectos_contables')
                .update({ estado: 'activo' })
                .eq('id', uuid);

            if (error) throw error;
            
            if (typeof window.showAlert === 'function') {
                window.showAlert("Éxito", "El proyecto ha sido restaurado y devuelto a la lista de proyectos activos del usuario.");
            } else {
                alert("Proyecto restaurado.");
            }
            
            await loadMasterData();
        } catch (e) {
            console.error("Error al restaurar:", e);
            if (typeof window.showAlert === 'function') {
                window.showAlert("Error", "Error al restaurar: " + e.message);
            } else {
                alert("Error al restaurar: " + e.message);
            }
        }
    };

    if (typeof window.showModal === 'function') {
        window.showModal(
            "Restaurar Proyecto",
            "¿Deseas devolver este proyecto al usuario cambiándolo a estado Activo para que pueda editarlo?",
            action
        );
    } else {
        if (confirm("¿Deseas devolver este proyecto al usuario cambiándolo a estado Activo?")) {
            action();
        }
    }
};

// Eliminar permanentemente de Supabase
window.hardDeleteMasterProject = async function(uuid) {
    if (typeof window.showModal === 'function') {
        window.showModal("Eliminar Permanentemente", "Esta acción es irreversible y eliminará el proyecto y todos sus libros contables desde la raíz del servidor. Ingresa tu contraseña de administrador para confirmar:", async () => {
            const pwdInput = document.getElementById('modal-password-input');
            const adminPassword = pwdInput ? pwdInput.value : '';
            
            if (!adminPassword) {
                if (typeof window.showAlert === 'function') {
                    window.showAlert("Atención", "Debes ingresar tu contraseña para esta acción destructiva.");
                } else {
                    alert("Debes ingresar tu contraseña.");
                }
                return;
            }
            
            try {
                const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
                if (sessionError || !session) throw new Error("No tienes una sesión activa válida.");
                
                // Confirmar credenciales volviendo a iniciar sesión con contraseña
                const { error: authError } = await window.supabaseClient.auth.signInWithPassword({
                    email: session.user.email,
                    password: adminPassword
                });
                
                if (authError) {
                    if (typeof window.showAlert === 'function') {
                        window.showAlert("Error de Seguridad", "Contraseña incorrecta. Operación destructiva bloqueada por seguridad.");
                    } else {
                        alert("Contraseña incorrecta.");
                    }
                    return;
                }
                
                if (typeof window.closeModal === 'function') window.closeModal();
                
                const { error: deleteError } = await window.supabaseClient
                    .from('proyectos_contables')
                    .delete()
                    .eq('id', uuid);
                    
                if (deleteError) throw deleteError;
                
                if (typeof window.showAlert === 'function') {
                    window.showAlert("Éxito", "El proyecto ha sido eliminado de forma física y permanente en Supabase.");
                } else {
                    alert("Proyecto eliminado.");
                }
                
                await loadMasterData();
            } catch (e) {
                console.error("Error en eliminación dura:", e);
                if (typeof window.showAlert === 'function') {
                    window.showAlert("Error Crítico", "Error al eliminar físicamente: " + e.message);
                } else {
                    alert("Error: " + e.message);
                }
            }
        }, true);
    } else {
        alert("Error de modal para confirmación.");
    }
};

// Iniciar auditoría: respaldar local, sobrescribir con proyecto ajeno y abrir editor
window.auditMasterProject = function(uuid) {
    const doc = window.masterProjectsData.find(d => d.id === uuid);
    if (!doc || !doc.data) {
        if (typeof window.showAlert === 'function') {
            window.showAlert("Error", "No se encontraron los datos de este proyecto.");
        } else {
            alert("Datos de proyecto no encontrados.");
        }
        return;
    }
    
    let pDataParsed = {};
    try {
        pDataParsed = typeof doc.data === 'string' ? JSON.parse(doc.data || '{}') : (doc.data || {});
    } catch (e) {
        pDataParsed = {};
    }
    
    if (!pDataParsed.id) {
        pDataParsed.id = doc.id;
    }
    
    const pType = pDataParsed.type || 'libros';
    const storageKey = typeof window.getProjectsStorageKey === 'function'
        ? window.getProjectsStorageKey(pType)
        : ('educonta_projects_' + pType);
    
    const profileName = doc.profiles ? (doc.profiles.full_name || doc.profiles.username) : null;
    const ownerName = profileName || pDataParsed.owner_name || (pDataParsed.user_metadata && pDataParsed.user_metadata.full_name) || doc.user_email || 'Alumno';
    
    const confirmAction = () => {
        if (typeof window.closeModal === 'function') window.closeModal();
        
        // 1. Respaldar todas las bóvedas locales originales del administrador en sessionStorage
        //    SOLO si no hay ya una sesión de auditoría activa (evita sobrescribir el backup original con datos de otro alumno)
        const isAlreadyAuditing = sessionStorage.getItem('educonta_audit_active') === 'true' ||
                                  sessionStorage.getItem('educonta_audit_mode') === 'true';
        if (!isAlreadyAuditing) {
            const vaults = [
                'libros', 'kardex', 'planillas', 'tributario', 'costos', 'caja', 'finanzas',
                'textos', 'calculo', 'hojas', 'lienzos', 'diagramas'
            ];
            vaults.forEach(v => {
                sessionStorage.setItem('educonta_backup_projects_' + v, localStorage.getItem('educonta_projects_' + v) || '[]');
            });
        }
        
        // 2. Insertar el proyecto auditado en el localStorage correspondiente como el único proyecto
        localStorage.setItem(storageKey, JSON.stringify([pDataParsed]));
        if (pType === 'hojas' || pType === 'calculo') {
            localStorage.setItem('educonta_projects_hojas', JSON.stringify([pDataParsed]));
            localStorage.setItem('educonta_projects_calculo', JSON.stringify([pDataParsed]));
        }
        
        // 3. Activar banderas unificadas de auditoría en sessionStorage
        sessionStorage.setItem('educonta_audit_active', 'true');
        sessionStorage.setItem('educonta_audit_mode', 'true');
        sessionStorage.setItem('educonta_audit_owner_name', ownerName);
        
        // Guardar estado de navegación para retornar a esta misma carpeta
        sessionStorage.setItem('educonta_audit_return_uid', window.explorerState.currentUserId || '');
        sessionStorage.setItem('educonta_audit_return_uname', window.explorerState.currentUserName || '');
        sessionStorage.setItem('educonta_audit_return_cat', window.explorerState.currentCategory || '');
        
        // 4. Configurar el ID del último proyecto e indicar la pestaña
        localStorage.setItem('educonta_last_project_id', String(pDataParsed.id));
        localStorage.setItem('educonta_proyectos_active_tab', pType);
        localStorage.setItem('educonta_docs_active_tab', pType);
        
        // 5. Redirigir al archivo de vista del editor del tipo adecuado
        if (pType === 'kardex') {
            window.location.href = 'editor-kardex.html';
        } else if (pType === 'planillas') {
            window.location.href = 'editor-planillas.html';
        } else if (pType === 'tributario') {
            window.location.href = 'editor-tributario.html';
        } else if (pType === 'costos') {
            window.location.href = 'editor-costos.html';
        } else if (pType === 'caja') {
            window.location.href = 'editor-caja.html';
        } else if (pType === 'finanzas') {
            window.location.href = 'editor-finanzas.html';
        } else if (pType === 'textos') {
            window.location.href = 'editor-textos.html';
        } else if (pType === 'calculo' || pType === 'hojas') {
            window.location.href = 'editor-hojas-calculo.html';
        } else if (pType === 'lienzos') {
            window.location.href = 'editor-lienzos.html';
        } else if (pType === 'diagramas') {
            window.location.href = 'editor-diagramas.html';
        } else if (pType === 'diapositivas') {
            window.location.href = 'editor-diapositivas.html';
        } else {
            window.location.href = 'editor-libros.html';
        }
    };
    
    if (typeof window.showModal === 'function') {
        window.showModal(
            "Alerta de Auditoría",
            "Abrirás el proyecto de este alumno en MODO SOLO LECTURA. Todos los controles de edición estarán bloqueados y no podrás guardar ni alterar los datos. ¿Continuar?",
            confirmAction
        );
    } else {
        if (confirm("¿Deseas auditar este proyecto en modo de solo lectura?")) {
            confirmAction();
        }
    }
};

// Descargar una copia completa de la base de datos en formato JSON como backup
window.downloadMasterBackup = function() {
    try {
        const backupData = {
            app: "EDUCONTA_SV_OFFICIAL_BACKUP",
            backup_date: new Date().toISOString(),
            records_count: window.masterProjectsData.length,
            records: window.masterProjectsData
        };
        
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EduContaSV_Boveda_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        
        if (typeof window.showAlert === 'function') {
            window.showAlert("Backup Creado", "Se ha descargado una copia de seguridad en formato JSON conteniendo todos los registros de Supabase.");
        } else {
            alert("Backup descargado.");
        }
    } catch (e) {
        console.error("Error al descargar backup:", e);
        alert("Error al descargar backup: " + e.message);
    }
};

// =============================================================================
// CONTROLADOR DEL GESTOR CMS DE BIBLIOTECA & PUENTE EDUCONVERT
// =============================================================================
window.adminGlosarioDataset = [];
window.publishedLawsDataset = [];
window.pendingEduconvertLaw = null;
window.activeLibrarySubTab = 'educonvert';

let currentCmsSubIndex = 0;
let cmsSubSnapTimeout = null;

function moveCmsSubTab(btn, newIndex, animate = true) {
    const pill = document.getElementById('cms-sub-pill');
    if (!pill || !btn) return;

    if (cmsSubSnapTimeout) {
        clearTimeout(cmsSubSnapTimeout);
        cmsSubSnapTimeout = null;
    }

    if (btn.offsetWidth === 0) {
        requestAnimationFrame(() => {
            if (btn.offsetWidth > 0) moveCmsSubTab(btn, newIndex, animate);
        });
        return;
    }

    const distance = Math.abs(newIndex - currentCmsSubIndex);
    const stretch = (animate && distance > 0) ? (1 + Math.min(distance * 0.15, 0.35)) : 1;

    if (!animate) {
        pill.style.transition = 'none';
    }

    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.opacity = '1';

    if (animate && distance > 0) {
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(${stretch}) scaleY(0.9)`;
        cmsSubSnapTimeout = setTimeout(() => {
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

    currentCmsSubIndex = newIndex;
}
window.moveCmsSubTab = moveCmsSubTab;

// 1. Navegación entre Sub-Pestañas del CMS
window.switchLibrarySubTab = function(subTab) {
    window.activeLibrarySubTab = subTab;
    const tabs = ['educonvert', 'glosario', 'parametros'];
    
    tabs.forEach(t => {
        const btn = document.getElementById(`btn-cms-sub-${t}`);
        const pane = document.getElementById(`cms-pane-${t}`);
        if (t === subTab) {
            if (btn) {
                btn.className = "relative z-10 px-5 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2";
            }
            if (pane) pane.classList.remove('hidden');
        } else {
            if (btn) {
                btn.className = "relative z-10 px-5 py-2.5 rounded-xl text-slate-400 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 hover:text-slate-200";
            }
            if (pane) pane.classList.add('hidden');
        }
    });

    const activeBtn = document.getElementById(`btn-cms-sub-${subTab}`);
    if (activeBtn) {
        const idx = tabs.indexOf(subTab);
        moveCmsSubTab(activeBtn, idx >= 0 ? idx : 0);
    }
};

// 2. Carga general de datos del CMS
window.loadLibraryCMSData = async function() {
    await Promise.all([
        window.loadPublishedLawsList(),
        window.loadCMSGlosario(),
        window.loadCMSFiscalParameters()
    ]);
};

window.refreshLibraryCMS = async function() {
    const status = document.getElementById('cms-cloud-status');
    if (status) {
        status.innerHTML = '<i class="fas fa-spinner fa-spin text-emerald-400"></i> Sincronizando...';
    }
    await window.loadLibraryCMSData();
    if (status) {
        status.innerHTML = '<i class="fas fa-cloud-check text-emerald-400"></i> Conectado a Supabase';
    }
};

// =============================================================================
// 3. PUENTE DE INTEGRACIÓN CON EDUCONVERT (INGESTA DE LEYES Y ARTÍCULOS)
// =============================================================================

// Drag & Drop Handlers
window.handleEduconvertDragOver = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('educonvert-dropzone');
    if (dropzone) {
        dropzone.classList.add('border-emerald-400', 'bg-emerald-950/30');
    }
};

window.handleEduconvertDragLeave = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('educonvert-dropzone');
    if (dropzone) {
        dropzone.classList.remove('border-emerald-400', 'bg-emerald-950/30');
    }
};

window.handleEduconvertDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('educonvert-dropzone');
    if (dropzone) {
        dropzone.classList.remove('border-emerald-400', 'bg-emerald-950/30');
    }

    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        window.readEduconvertFile(file);
    }
};

window.handleEduconvertFileSelect = function(e) {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        window.readEduconvertFile(file);
    }
};

window.readEduconvertFile = async function(file) {
    const fileName = file.name;
    const ext = fileName.split('.').pop().toLowerCase();

    try {
        if (ext === 'json') {
            const rawContent = await file.text();
            window.processEduconvertJSON(rawContent, fileName);
            return;
        }

        let extractedText = '';
        if (ext === 'pdf' && typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            for (let p = 1; p <= pdf.numPages; p++) {
                const page = await pdf.getPage(p);
                const content = await page.getTextContent();
                extractedText += '\n\n' + content.items.map(it => it.str).join(' ');
            }
        } else if ((ext === 'docx' || ext === 'doc') && typeof mammoth !== 'undefined') {
            const arrayBuffer = await file.arrayBuffer();
            const res = await mammoth.extractRawText({ arrayBuffer });
            extractedText = res.value || '';
        } else {
            extractedText = await file.text();
        }

        if (!extractedText.trim()) {
            throw new Error("No se pudo extraer texto del documento seleccionado.");
        }

        // Llenar el parser rápido de texto y procesar
        const nameInput = document.getElementById('quick-law-name');
        const textInput = document.getElementById('quick-law-text');
        if (nameInput && !nameInput.value) {
            nameInput.value = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ').toUpperCase();
        }
        if (textInput) {
            textInput.value = extractedText;
        }
        window.parseQuickTextToEduconvert();

    } catch (err) {
        console.error("Error leyendo archivo:", err);
        alert(`Error al leer archivo (${fileName}): ` + err.message);
    }
};

// Procesa el JSON exportado por EduConvert
window.processEduconvertJSON = function(jsonText, fileName = 'documento.json') {
    try {
        const data = JSON.parse(jsonText);
        
        let lawMetadata = {
            id: '',
            nombre: '',
            abreviatura: '',
            decreto_numero: '',
            categoria: 'Aduanas y Tributos',
            fecha_publicacion: new Date().toISOString().split('T')[0],
            descripcion: ''
        };

        let articlesList = [];

        // Soporte para múltiples esquemas generados por EduConvert
        if (data.ley || data.metadata) {
            const meta = data.ley || data.metadata;
            lawMetadata.nombre = meta.nombre || meta.titulo || fileName.replace(/\.[^/.]+$/, "");
            lawMetadata.abreviatura = meta.abreviatura || meta.siglas || '';
            lawMetadata.decreto_numero = meta.decreto_numero || meta.decreto || '';
            lawMetadata.categoria = meta.categoria || 'Normas Contables';
            lawMetadata.descripcion = meta.descripcion || '';
            lawMetadata.id = meta.id || lawMetadata.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            articlesList = data.articulos || data.articles || [];
        } else if (Array.isArray(data)) {
            // Arreglo directo de artículos
            lawMetadata.nombre = fileName.replace(/\.[^/.]+$/, "").toUpperCase();
            lawMetadata.id = lawMetadata.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            articlesList = data;
        } else {
            // Objeto raíz directo
            lawMetadata.nombre = data.nombre || data.titulo || fileName.replace(/\.[^/.]+$/, "");
            lawMetadata.abreviatura = data.abreviatura || '';
            lawMetadata.decreto_numero = data.decreto_numero || data.decreto || '';
            lawMetadata.categoria = data.categoria || 'Aduanas y Tributos';
            lawMetadata.descripcion = data.descripcion || '';
            lawMetadata.id = data.id || lawMetadata.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            articlesList = data.articulos || data.articles || [];
        }

        if (articlesList.length === 0) {
            throw new Error("No se detectaron artículos en la estructura del archivo.");
        }

        // Formatear artículos asegurando coherencia
        const formattedArticles = articlesList.map((art, idx) => {
            const numero = art.numero || art.num || (idx + 1);
            let texto = art.texto || art.contenido || '';
            if (Array.isArray(art.parrafos)) {
                texto = art.parrafos.join('\n\n');
            }
            return {
                id: `${lawMetadata.id}-art-${numero}`,
                ley_id: lawMetadata.id,
                numero: String(numero),
                titulo_seccion: art.titulo_seccion || art.titulo || '',
                capitulo_seccion: art.capitulo_seccion || art.capitulo || '',
                seccion: art.seccion || '',
                texto: texto,
                orden: art.orden || (idx + 1)
            };
        });

        window.pendingEduconvertLaw = {
            ley: lawMetadata,
            articulos: formattedArticles
        };

        // Renderizar Previsualización
        window.renderEduconvertPreview();

    } catch (e) {
        console.error("Error procesando JSON de EduConvert:", e);
        alert("El archivo no tiene una estructura JSON válida de EduConvert: " + e.message);
    }
};

// Render de la previsualización
window.renderEduconvertPreview = function() {
    const blankState = document.getElementById('educonvert-preview-blank');
    const contentArea = document.getElementById('educonvert-preview-content');
    const actionsArea = document.getElementById('educonvert-actions');
    const badge = document.getElementById('preview-articles-badge');
    const titleEl = document.getElementById('preview-law-title');
    const metaEl = document.getElementById('preview-law-meta');
    const samplesContainer = document.getElementById('preview-sample-articles');

    if (!window.pendingEduconvertLaw) {
        if (blankState) blankState.classList.remove('hidden');
        if (contentArea) contentArea.classList.add('hidden');
        if (actionsArea) actionsArea.classList.add('hidden');
        return;
    }

    const { ley, articulos } = window.pendingEduconvertLaw;

    if (blankState) blankState.classList.add('hidden');
    if (contentArea) contentArea.classList.remove('hidden');
    if (actionsArea) actionsArea.classList.remove('hidden');

    if (badge) badge.innerText = `${articulos.length} Artículos procesados`;
    if (titleEl) titleEl.innerText = ley.nombre;
    if (metaEl) metaEl.innerText = `${ley.decreto_numero || 'Decreto Oficial'} • ${ley.categoria} (${ley.abreviatura || 'SV'})`;

    if (samplesContainer) {
        const previewSample = articulos.slice(0, 4);
        samplesContainer.innerHTML = previewSample.map(art => {
            const plainText = art.texto ? art.texto.replace(/<[^>]*>?/gm, '') : 'Sin texto disponible.';
            return `
            <div class="p-3 rounded-xl bg-[#17171a] border border-white/5 text-xs">
                <div class="flex items-center justify-between text-[10px] font-bold text-emerald-400 mb-1">
                    <span>Art. ${escHtml(art.numero)}</span>
                    <span class="text-slate-500">${escHtml(art.capitulo_seccion || '')}</span>
                </div>
                <p class="text-slate-300 line-clamp-2 text-[11px] leading-relaxed">
                    ${escHtml(plainText)}
                </p>
            </div>
        `;
        }).join('') + (articulos.length > 4 ? `<p class="text-center text-[10px] text-slate-500 font-bold py-1">+ ${articulos.length - 4} artículos adicionales listos para publicar.</p>` : '');
    }
};

// Parser Rápido de Texto
window.toggleQuickParserAccordion = function() {
    const container = document.getElementById('quick-parser-container');
    const chevron = document.getElementById('quick-parser-chevron');
    if (container) {
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            if (chevron) chevron.className = 'fas fa-chevron-up text-[10px]';
        } else {
            container.classList.add('hidden');
            if (chevron) chevron.className = 'fas fa-chevron-down text-[10px]';
        }
    }
};

window.parseQuickTextToEduconvert = function() {
    const name = document.getElementById('quick-law-name').value.trim();
    const decreto = document.getElementById('quick-law-decreto').value.trim();
    const text = document.getElementById('quick-law-text').value.trim();

    if (!name || !text) {
        alert("Por favor ingresa al menos el Nombre de la Ley y el Texto con artículos.");
        return;
    }

    const lawId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Algoritmo de división por Artículos (detecta Art. 1.-, Art. 1, Articulo 1, etc.)
    const articleRegex = /(?:^|\n)(?:Art\.|Artículo|Articulo)\s*([0-9]+)\s*[\.\-–—\s]+([\s\S]*?)(?=(?:\n(?:Art\.|Artículo|Articulo)\s*[0-9]+[\.\-–—\s]+)|$)/gi;
    
    const parsedArticles = [];
    let match;
    let order = 1;

    while ((match = articleRegex.exec(text)) !== null) {
        const num = match[1];
        const body = match[2].trim();
        parsedArticles.push({
            id: `${lawId}-art-${num}`,
            ley_id: lawId,
            numero: num,
            titulo_seccion: '',
            capitulo_seccion: '',
            seccion: '',
            texto: body,
            orden: order++
        });
    }

    if (parsedArticles.length === 0) {
        alert("No se pudieron detectar artículos en el texto. Asegúrate de incluir encabezados como 'Art. 1.-', 'Art. 2.-', etc.");
        return;
    }

    window.pendingEduconvertLaw = {
        ley: {
            id: lawId,
            nombre: name,
            abreviatura: decreto.includes('/') ? decreto.split('/')[1].trim() : '',
            decreto_numero: decreto,
            categoria: 'Aduanas y Tributos',
            fecha_publicacion: new Date().toISOString().split('T')[0],
            descripcion: `Documento procesado con el convertidor de EduConta SV.`
        },
        articulos: parsedArticles
    };

    window.renderEduconvertPreview();
    if (typeof window.showAlert === 'function') {
        window.showAlert("Texto Estructurado", `Se procesaron exitosamente ${parsedArticles.length} artículos. Revisa la previsualización.`);
    }
};

// Publicación en Supabase
window.publishEduconvertLaw = async function() {
    if (!window.pendingEduconvertLaw) return;
    const btn = document.getElementById('btn-publish-law');
    const { ley, articulos } = window.pendingEduconvertLaw;

    if (!window.supabaseClient) {
        alert("Supabase client no disponible. Verifica la configuración.");
        return;
    }

    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando en Supabase...';
        }

        // 1. Insertar o actualizar la Ley
        const { error: leyErr } = await window.supabaseClient
            .from('leyes')
            .upsert([ley], { onConflict: 'id' });

        if (leyErr) throw leyErr;

        // 2. Insertar artículos en lotes de 100 con formato dual (texto y parrafos)
        const formattedArticles = articulos.map(art => ({
            ...art,
            parrafos: art.texto ? art.texto.split(/\n\n+/).map(p => p.trim()).filter(Boolean) : []
        }));

        const CHUNK_SIZE = 100;
        for (let i = 0; i < formattedArticles.length; i += CHUNK_SIZE) {
            const chunk = formattedArticles.slice(i, i + CHUNK_SIZE);
            const { error: artErr } = await window.supabaseClient
                .from('articulos')
                .upsert(chunk, { onConflict: 'id' });

            if (artErr) throw artErr;
        }

        if (typeof window.showAlert === 'function') {
            window.showAlert("¡Ley Publicada con Éxito!", `La ley "${ley.nombre}" con ${formattedArticles.length} artículos ha sido sincronizada en la base de datos y ya está disponible en la Biblioteca.`);
        } else {
            alert(`¡Ley "${ley.nombre}" publicada con éxito!`);
        }

        window.pendingEduconvertLaw = null;
        window.renderEduconvertPreview();
        await window.loadPublishedLawsList();

    } catch (err) {
        console.error("Error al publicar ley en Supabase:", err);
        alert("Error al publicar ley: " + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-cloud-arrow-up"></i> Publicar Ley en Supabase';
        }
    }
};

// Carga lista de leyes publicadas
window.loadPublishedLawsList = async function() {
    const tableBody = document.getElementById('cms-laws-table-body');
    const countBadge = document.getElementById('published-laws-count');
    const gatewayCount = document.getElementById('cms-gateway-laws-count');
    if (!tableBody) return;

    if (!window.supabaseClient) {
        tableBody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-500 font-bold">Supabase Offline.</td></tr>`;
        return;
    }

    try {
        const { data: leyes, error } = await window.supabaseClient
            .from('leyes')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;
        window.publishedLawsDataset = leyes || [];

        const totalCount = window.publishedLawsDataset.length;
        if (countBadge) countBadge.innerText = `${totalCount} Leyes en Nube`;
        if (gatewayCount) gatewayCount.innerText = `${totalCount} Leyes en Nube`;

        if (totalCount === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-slate-500 font-bold">No hay leyes registradas aún. Haz clic en "Compilar Nueva Ley" para ingresar al Studio.</td></tr>`;
            return;
        }

        tableBody.innerHTML = window.publishedLawsDataset.map(ley => {
            const escapedName = escJsArg(ley.nombre || '');
            const escapedId = escJsArg(ley.id || '');
            const encodedId = escHtml(encodeURIComponent(ley.id || ''));
            return `
                <tr class="hover:bg-white/[0.02] transition-colors group">
                    <td class="py-3.5 pl-2 pr-3 font-bold text-white group-hover:text-emerald-400 transition-colors">
                        <div class="flex items-center gap-2.5">
                            <i class="fas fa-file-contract text-slate-500 text-xs"></i>
                            <span>${escHtml(ley.nombre || 'Ley sin título')}</span>
                        </div>
                    </td>
                    <td class="py-3.5 px-3 text-slate-400 tabular-nums text-[11px] font-semibold">${escHtml(ley.decreto_numero || ley.abreviatura || '-')}</td>
                    <td class="py-3.5 px-3">
                        <span class="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">${escHtml(ley.categoria || 'Aduanas y Tributos')}</span>
                    </td>
                    <td class="py-3.5 pr-2 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                            <button onclick="window.location.href='educonvert.html?id=${encodedId}'" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 text-xs font-bold transition-all flex items-center gap-1 border border-slate-700" title="Editar en EduConvert Studio">
                                <i class="fas fa-pen-to-square text-[10px]"></i> <span>Editar</span>
                            </button>
                            <button onclick="window.open('visor-ley.html?id=${encodedId}', '_blank')" class="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center justify-center transition-all border border-slate-700" title="Ver en Visor de Ley">
                                <i class="fas fa-external-link-alt text-[10px]"></i>
                            </button>
                            <button onclick="window.deletePublishedLaw(${escapedId}, ${escapedName})" class="w-7 h-7 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 text-xs flex items-center justify-center transition-all border border-rose-900/30" title="Eliminar Ley">
                                <i class="fas fa-trash-alt text-[10px]"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (e) {
        console.warn("No se pudieron cargar leyes remotas:", e);
        tableBody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-rose-400 font-bold">Error cargando leyes: ${escHtml(e.message)}</td></tr>`;
    }
};

window.deletePublishedLaw = async function(leyId, leyName) {
    if (!confirm(`¿Estás seguro de eliminar la ley "${leyName}" y todos sus artículos asociados de la base de datos?`)) {
        return;
    }

    try {
        await window.supabaseClient.from('articulos').delete().eq('ley_id', leyId);
        const { error } = await window.supabaseClient.from('leyes').delete().eq('id', leyId);
        if (error) throw error;

        if (typeof window.showAlert === 'function') {
            window.showAlert("Ley Eliminada", `Se ha eliminado "${leyName}" de Supabase.`);
        } else {
            alert(`Ley "${leyName}" eliminada con éxito.`);
        }
        await window.loadPublishedLawsList();
    } catch (e) {
        alert("Error al eliminar ley: " + e.message);
    }
};

// =============================================================================
// 4. GESTOR DE GLOSARIO CONTABLE (GRID ALFABÉTICO & INGESTA POR LOTES)
// =============================================================================
window.adminGlosarioViewMode = localStorage.getItem('admin_glosario_view_mode') || 'grid';
window.activeGlosarioAlpha = 'all';
window.pendingBatchTerms = [];
window.activeBatchSubTab = 'upload';

// 1. Carga General de Glosario
window.loadCMSGlosario = async function() {
    const baseSeeds = (window.EDUCONTA_GLOSARIO_SEEDS && window.EDUCONTA_GLOSARIO_SEEDS.length > 0)
        ? window.EDUCONTA_GLOSARIO_SEEDS
        : [];

    let currentDataset = baseSeeds.map(t => (window.normalizeGlosarioTerm ? window.normalizeGlosarioTerm(t) : t));

    // Caché local previo
    try {
        const localCached = localStorage.getItem('educonta_glosario_custom');
        if (localCached) {
            const parsed = JSON.parse(localCached);
            if (Array.isArray(parsed) && parsed.length > 0) {
                currentDataset = parsed.map(t => (window.normalizeGlosarioTerm ? window.normalizeGlosarioTerm(t) : t));
            }
        }
    } catch (e) {
        console.warn("Error leyendo glosario de localStorage:", e);
    }

    window.adminGlosarioDataset = currentDataset;

    // Consultar y sincronizar con Supabase
    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('biblioteca_terminos')
                .select('*')
                .order('termino', { ascending: true });

            if (!error && data && data.length > 0) {
                window.adminGlosarioDataset = data.map(t => (window.normalizeGlosarioTerm ? window.normalizeGlosarioTerm(t) : t));
                try {
                    localStorage.setItem('educonta_glosario_custom', JSON.stringify(window.adminGlosarioDataset));
                } catch (e) {}
            } else if (!error && (!data || data.length === 0) && baseSeeds.length > 0) {
                console.log("CMS Glosario: Auto-seeding 30 términos oficiales en Supabase...");
                const toInsert = baseSeeds.map(t => {
                    const norm = window.normalizeGlosarioTerm ? window.normalizeGlosarioTerm(t) : t;
                    return {
                        id: norm.id,
                        termino: norm.termino,
                        letra: norm.letra,
                        categoria: norm.categoria,
                        categoria_label: norm.categoriaLabel,
                        definicion: norm.definicion,
                        base_legal: norm.baseLegal,
                        ejemplo: norm.ejemplo,
                        relacionados: norm.relacionados,
                        vigencia_anio: 2026
                    };
                });
                await window.supabaseClient.from('biblioteca_terminos').upsert(toInsert, { onConflict: 'id' });
                localStorage.setItem('educonta_glosario_custom', JSON.stringify(window.adminGlosarioDataset));
            }
        } catch (e) {
            console.warn("CMS Glosario: Usando dataset local integrado.", e);
        }
    }

    window.buildCMSGlosarioAlphaBar();
    window.renderCMSGlosario();
};

// 2. Barra de Navegación Alfabética (A-Z)
window.buildCMSGlosarioAlphaBar = function() {
    const bar = document.getElementById('cms-glosario-alpha-bar');
    if (!bar) return;

    const alphabet = ['TODOS', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    bar.innerHTML = '';

    alphabet.forEach(letter => {
        const btn = document.createElement('button');
        const isAll = letter === 'TODOS';
        const isActive = (isAll && window.activeGlosarioAlpha === 'all') || letter === window.activeGlosarioAlpha;
        btn.className = `px-2.5 py-1 rounded-xl text-[11px] font-black uppercase transition-all ${
            isActive 
                ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
        }`;
        btn.innerText = letter;
        btn.onclick = () => window.filterCMSGlosarioAlpha(isAll ? 'all' : letter);
        bar.appendChild(btn);
    });
};

window.filterCMSGlosarioAlpha = function(letter) {
    window.activeGlosarioAlpha = letter;
    window.buildCMSGlosarioAlphaBar();
    window.filterCMSGlosario();
};

// 3. Alternador de Modo de Vista (Grid vs Tabla)
window.setGlosarioViewMode = function(mode) {
    window.adminGlosarioViewMode = mode;
    localStorage.setItem('admin_glosario_view_mode', mode);

    const btnGrid = document.getElementById('btn-glosario-view-grid');
    const btnTable = document.getElementById('btn-glosario-view-table');
    const gridContainer = document.getElementById('cms-terms-grid-container');
    const tableContainer = document.getElementById('cms-terms-table-container');

    if (mode === 'grid') {
        if (btnGrid) btnGrid.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-emerald-500 text-slate-950";
        if (btnTable) btnTable.className = "px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all";
        if (gridContainer) gridContainer.classList.remove('hidden');
        if (tableContainer) tableContainer.classList.add('hidden');
    } else {
        if (btnGrid) btnGrid.className = "px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all";
        if (btnTable) btnTable.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-emerald-500 text-slate-950";
        if (gridContainer) gridContainer.classList.add('hidden');
        if (tableContainer) tableContainer.classList.remove('hidden');
    }

    window.filterCMSGlosario();
};

// 4. Renderizador General
window.renderCMSGlosario = function(filteredItems = null) {
    const items = filteredItems || window.adminGlosarioDataset;
    const countBadge = document.getElementById('cms-glosario-count-badge');
    if (countBadge) countBadge.innerText = `${items.length} Término${items.length === 1 ? '' : 's'}`;

    window.renderCMSGlosarioGrid(items);
    window.renderCMSGlosarioTable(items);
};

// Renderizado en GRID ALFABÉTICO (Agrupado por Letras)
window.renderCMSGlosarioGrid = function(items) {
    const container = document.getElementById('cms-terms-grid-container');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16 bg-[#141418]/40 border border-white/5 rounded-3xl text-slate-400">
                <i class="fas fa-book-open text-3xl mb-3 text-slate-600 block"></i>
                <p class="font-bold text-sm">No se encontraron términos contables para los filtros seleccionados.</p>
                <button onclick="document.getElementById('cms-glosario-search').value=''; document.getElementById('cms-glosario-category-filter').value='all'; window.filterCMSGlosarioAlpha('all');" class="mt-3 px-4 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold hover:bg-emerald-500/20">
                    Restablecer Filtros
                </button>
            </div>
        `;
        return;
    }

    // Agrupar por letra
    const sorted = [...items].sort((a, b) => a.termino.localeCompare(b.termino, 'es'));
    const groups = {};
    sorted.forEach(term => {
        const letter = (term.letra || term.termino[0] || 'A').toUpperCase();
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(term);
    });

    const sortedLetters = Object.keys(groups).sort();

    container.innerHTML = sortedLetters.map(letter => {
        const termsInLetter = groups[letter];
        const safeLetter = escHtml(letter);
        return `
            <div class="space-y-4">
                <!-- Encabezado de la Letra -->
                <div class="flex items-center justify-between pb-2 border-b border-white/5">
                    <div class="flex items-center gap-3">
                        <span class="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center shadow-sm">
                            ${safeLetter}
                        </span>
                        <h4 class="text-xs font-black uppercase tracking-widest text-slate-300">
                            Letra ${safeLetter}
                        </h4>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                        ${termsInLetter.length} ${termsInLetter.length === 1 ? 'término' : 'términos'}
                    </span>
                </div>

                <!-- Grid de Tarjetas de la Letra -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${termsInLetter.map(term => {
                        // Badge color por categoría
                        let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                        if (term.categoria === 'financiera') badgeBg = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
                        else if (term.categoria === 'fiscal') badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                        else if (term.categoria === 'laboral') badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                        else if (term.categoria === 'costos') badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                        else if (term.categoria === 'niif') badgeBg = 'bg-purple-500/10 text-purple-400 border-purple-500/20';

                        const jsTermId = escJsArg(term.id);
                        const safeCatLabel = escHtml(term.categoriaLabel || term.categoria_label || term.categoria);
                        const safeBaseLegal = escHtml(term.baseLegal || term.base_legal || 'SV');

                        return `
                            <div class="group bg-[#121215] hover:bg-[#16161b] border border-white/5 hover:border-emerald-500/40 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-sm relative">
                                <div>
                                    <div class="flex items-center justify-between gap-2 mb-2">
                                        <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${badgeBg}">
                                            ${safeCatLabel}
                                        </span>
                                        <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <button onclick="window.editAdminTerm(${jsTermId})" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 flex items-center justify-center text-[11px] transition-colors" title="Editar Término">
                                                <i class="fas fa-pen"></i>
                                            </button>
                                            <button onclick="window.deleteAdminTerm(${jsTermId})" class="w-7 h-7 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 flex items-center justify-center text-[11px] transition-colors" title="Eliminar Término">
                                                <i class="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <h5 class="text-sm font-black text-white group-hover:text-emerald-400 transition-colors mb-1.5">
                                        ${escHtml(term.termino)}
                                    </h5>

                                    <p class="text-[11px] text-slate-400 leading-relaxed line-clamp-3 mb-3 font-normal">
                                        ${escHtml(term.definicion)}
                                    </p>
                                </div>

                                <div class="pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                    <span class="truncate max-w-[200px]" title="${safeBaseLegal}">
                                        <i class="fas fa-gavel text-emerald-400 mr-1"></i> ${safeBaseLegal}
                                    </span>
                                    <span class="text-slate-600 font-bold">2026</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
};

// Renderizado en TABLA COMPACTA
window.renderCMSGlosarioTable = function(items) {
    const tableBody = document.getElementById('cms-terms-table-body');
    if (!tableBody) return;

    if (items.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-slate-500 font-bold">No se encontraron términos contables.</td></tr>`;
        return;
    }

    const sorted = [...items].sort((a, b) => a.termino.localeCompare(b.termino, 'es'));

    tableBody.innerHTML = sorted.map(term => {
        const jsTermId = escJsArg(term.id);
        const safeLetter = escHtml(term.letra || (term.termino && term.termino[0] ? term.termino[0].toUpperCase() : 'A'));
        const safeCatLabel = escHtml(term.categoriaLabel || term.categoria_label || term.categoria);
        const safeBaseLegal = escHtml(term.baseLegal || term.base_legal || '-');
        const safeDefinicion = escHtml(term.definicion);
        return `
        <tr class="hover:bg-white/[0.02] transition-colors">
            <td class="py-3.5 pr-3 font-bold text-white flex items-center gap-2">
                <span class="w-5 h-5 rounded bg-slate-800 text-slate-400 text-[10px] font-black flex items-center justify-center">${safeLetter}</span>
                <span>${escHtml(term.termino)}</span>
            </td>
            <td class="py-3.5 pr-3">
                <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">${safeCatLabel}</span>
            </td>
            <td class="py-3.5 pr-3 text-slate-400 text-[11px] font-medium truncate max-w-[170px]" title="${safeBaseLegal}">
                ${safeBaseLegal}
            </td>
            <td class="py-3.5 pr-3 text-slate-300 text-[11px] line-clamp-1 max-w-[280px]" title="${safeDefinicion}">
                ${safeDefinicion}
            </td>
            <td class="py-3.5 text-right space-x-2">
                <button onclick="window.editAdminTerm(${jsTermId})" class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-emerald-400 text-xs font-bold transition-all" title="Editar">
                    <i class="fas fa-pen"></i>
                </button>
                <button onclick="window.deleteAdminTerm(${jsTermId})" class="px-2.5 py-1 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 text-xs font-bold transition-all" title="Eliminar">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `;
    }).join('');
};

window.filterCMSGlosario = function() {
    const query = (document.getElementById('cms-glosario-search')?.value || '').toLowerCase().trim();
    const cat = document.getElementById('cms-glosario-category-filter')?.value || 'all';

    const filtered = window.adminGlosarioDataset.filter(t => {
        const matchCat = cat === 'all' || t.categoria === cat;
        const matchAlpha = window.activeGlosarioAlpha === 'all' || (t.letra || t.termino[0]).toUpperCase() === window.activeGlosarioAlpha;
        const matchQuery = !query ||
            t.termino.toLowerCase().includes(query) ||
            (t.definicion && t.definicion.toLowerCase().includes(query)) ||
            ((t.baseLegal || t.base_legal) && (t.baseLegal || t.base_legal).toLowerCase().includes(query));
        return matchCat && matchAlpha && matchQuery;
    });

    window.renderCMSGlosario(filtered);
};

// Sincronizar / Restablecer masivamente los 30 términos base a la nube
window.syncOfficialGlosarioToCloud = async function() {
    const baseSeeds = window.EDUCONTA_GLOSARIO_SEEDS || [];
    if (baseSeeds.length === 0) {
        alert("No se encontraron los términos oficiales para sincronizar.");
        return;
    }

    if (!confirm(`¿Deseas sincronizar los ${baseSeeds.length} términos contables oficiales de El Salvador con la base de datos Supabase?`)) {
        return;
    }

    const normList = baseSeeds.map(t => (window.normalizeGlosarioTerm ? window.normalizeGlosarioTerm(t) : t));

    if (window.supabaseClient) {
        try {
            const toInsert = normList.map(norm => ({
                id: norm.id,
                termino: norm.termino,
                letra: norm.letra,
                categoria: norm.categoria,
                categoria_label: norm.categoriaLabel,
                definicion: norm.definicion,
                base_legal: norm.baseLegal,
                ejemplo: norm.ejemplo,
                relacionados: norm.relacionados,
                vigencia_anio: 2026
            }));

            const { error } = await window.supabaseClient.from('biblioteca_terminos').upsert(toInsert, { onConflict: 'id' });
            if (error) throw error;
        } catch (err) {
            console.error("Error sincronizando términos oficiales con Supabase:", err);
            alert("Error al sincronizar con Supabase: " + err.message);
            return;
        }
    }

    window.adminGlosarioDataset = normList;
    try {
        localStorage.setItem('educonta_glosario_custom', JSON.stringify(normList));
    } catch (e) {}

    window.renderCMSGlosario();
    if (typeof window.showAlert === 'function') {
        window.showAlert("¡Glosario Sincronizado!", `Se han sincronizado exitosamente los ${normList.length} términos contables oficiales en Supabase y la Biblioteca.`);
    } else {
        alert(`¡${normList.length} términos oficiales sincronizados exitosamente!`);
    }
};

// Modal de Término Individual
window.openNewTermModal = function() {
    document.getElementById('term-modal-title').innerHTML = '<i class="fas fa-book text-emerald-400"></i> Nuevo Término Contable';
    document.getElementById('modal-term-id').value = '';
    document.getElementById('modal-term-name').value = '';
    document.getElementById('modal-term-cat').value = 'financiera';
    document.getElementById('modal-term-def').value = '';
    document.getElementById('modal-term-legal').value = '';
    document.getElementById('modal-term-related').value = '';
    document.getElementById('modal-term-example').value = '';

    const modal = document.getElementById('admin-term-modal');
    if (modal) modal.style.display = 'flex';
};

window.editAdminTerm = function(termId) {
    const term = window.adminGlosarioDataset.find(t => t.id === termId);
    if (!term) return;

    document.getElementById('term-modal-title').innerHTML = '<i class="fas fa-pen text-emerald-400"></i> Editar Término Contable';
    document.getElementById('modal-term-id').value = term.id;
    document.getElementById('modal-term-name').value = term.termino;
    document.getElementById('modal-term-cat').value = term.categoria;
    document.getElementById('modal-term-def').value = term.definicion;
    document.getElementById('modal-term-legal').value = term.baseLegal || term.base_legal || '';
    document.getElementById('modal-term-related').value = Array.isArray(term.relacionados) ? term.relacionados.join(', ') : (term.relacionados || '');
    document.getElementById('modal-term-example').value = term.ejemplo || '';

    const modal = document.getElementById('admin-term-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeAdminTermModal = function() {
    const modal = document.getElementById('admin-term-modal');
    if (modal) modal.style.display = 'none';
};

window.saveAdminTerm = async function(e) {
    e.preventDefault();
    const idInput = document.getElementById('modal-term-id').value.trim();
    const nombre = document.getElementById('modal-term-name').value.trim();
    const cat = document.getElementById('modal-term-cat').value;
    const def = document.getElementById('modal-term-def').value.trim();
    const legal = document.getElementById('modal-term-legal').value.trim();
    const relatedRaw = document.getElementById('modal-term-related').value.trim();
    const ejemplo = document.getElementById('modal-term-example').value.trim();

    const termId = idInput || nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const termObj = window.normalizeGlosarioTerm ? window.normalizeGlosarioTerm({
        id: termId,
        termino: nombre,
        categoria: cat,
        definicion: def,
        baseLegal: legal,
        relacionados: relatedRaw,
        ejemplo: ejemplo,
        vigencia_anio: 2026
    }) : {
        id: termId,
        termino: nombre,
        letra: nombre[0].toUpperCase(),
        categoria: cat,
        categoriaLabel: cat === 'financiera' ? 'Contabilidad Financiera' : cat === 'fiscal' ? 'Tributaria & Fiscal (SV)' : cat === 'laboral' ? 'Laboral & Planillas' : cat === 'costos' ? 'Costos & Kardex' : 'NIIF / Principios',
        definicion: def,
        baseLegal: legal,
        relacionados: relatedRaw ? relatedRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
        ejemplo: ejemplo,
        vigencia_anio: 2026
    };

    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('biblioteca_terminos').upsert([{
                id: termObj.id,
                termino: termObj.termino,
                letra: termObj.letra,
                categoria: termObj.categoria,
                categoria_label: termObj.categoriaLabel,
                definicion: termObj.definicion,
                base_legal: termObj.baseLegal,
                ejemplo: termObj.ejemplo,
                relacionados: termObj.relacionados,
                vigencia_anio: 2026,
                updated_at: new Date().toISOString()
            }], { onConflict: 'id' });
        } catch (err) {
            console.warn("Guardado en Supabase fallback de término:", err);
        }
    }

    // Actualizar array en memoria
    const existingIdx = window.adminGlosarioDataset.findIndex(t => t.id === termId);
    if (existingIdx >= 0) {
        window.adminGlosarioDataset[existingIdx] = termObj;
    } else {
        window.adminGlosarioDataset.push(termObj);
    }

    window.adminGlosarioDataset.sort((a, b) => a.termino.localeCompare(b.termino, 'es'));

    try {
        localStorage.setItem('educonta_glosario_custom', JSON.stringify(window.adminGlosarioDataset));
    } catch (e) {}

    window.closeAdminTermModal();
    window.renderCMSGlosario();
    if (typeof window.showAlert === 'function') {
        window.showAlert("Término Guardado", `El término "${nombre}" ha sido guardado y sincronizado con la Biblioteca.`);
    }
};

window.deleteAdminTerm = async function(termId) {
    const term = window.adminGlosarioDataset.find(t => t.id === termId);
    const termName = term ? term.termino : termId;
    if (!confirm(`¿Deseas eliminar el término contable "${termName}" de la biblioteca?`)) return;

    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('biblioteca_terminos').delete().eq('id', termId);
        } catch (err) {
            console.warn("Error borrando término de Supabase:", err);
        }
    }

    window.adminGlosarioDataset = window.adminGlosarioDataset.filter(t => t.id !== termId);
    try {
        localStorage.setItem('educonta_glosario_custom', JSON.stringify(window.adminGlosarioDataset));
    } catch (e) {}

    window.renderCMSGlosario();
};

// =============================================================================
// INGESTA E IMPORTACIÓN POR LOTES (EXCEL, WORD, JSON)
// =============================================================================
window.openBatchImportModal = function() {
    window.pendingBatchTerms = [];
    window.switchBatchSubTab('upload');
    window.renderBatchPreview();
    const modal = document.getElementById('admin-batch-term-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeBatchImportModal = function() {
    const modal = document.getElementById('admin-batch-term-modal');
    if (modal) modal.style.display = 'none';
};

window.switchBatchSubTab = function(subTab) {
    window.activeBatchSubTab = subTab;
    const tabs = ['upload', 'paste', 'templates'];
    tabs.forEach(t => {
        const btn = document.getElementById(`btn-batch-tab-${t}`);
        const pane = document.getElementById(`batch-pane-${t}`);
        if (t === subTab) {
            if (btn) {
                btn.className = "px-4 py-2 rounded-t-xl text-xs font-black uppercase tracking-wider transition-all border-b-2 border-emerald-500 text-white bg-white/5";
            }
            if (pane) pane.classList.remove('hidden');
        } else {
            if (btn) {
                btn.className = "px-4 py-2 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all border-b-2 border-transparent text-slate-400 hover:text-slate-200";
            }
            if (pane) pane.classList.add('hidden');
        }
    });
};

// Drag & Drop
window.handleBatchDragOver = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('batch-dropzone');
    if (dropzone) dropzone.classList.add('border-emerald-400', 'bg-emerald-950/20');
};

window.handleBatchDragLeave = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('batch-dropzone');
    if (dropzone) dropzone.classList.remove('border-emerald-400', 'bg-emerald-950/20');
};

window.handleBatchDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('batch-dropzone');
    if (dropzone) dropzone.classList.remove('border-emerald-400', 'bg-emerald-950/20');

    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        window.processBatchFile(file);
    }
};

window.handleBatchFileSelect = function(e) {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        window.processBatchFile(file);
    }
};

// Procesamiento multi-archivo (Excel, Word, JSON, CSV, TXT)
window.processBatchFile = async function(file) {
    const fileName = file.name;
    const ext = fileName.split('.').pop().toLowerCase();

    try {
        if (ext === 'json') {
            const rawText = await file.text();
            window.processBatchJSONContent(rawText);
            return;
        }

        if ((ext === 'xlsx' || ext === 'xls') && typeof XLSX !== 'undefined') {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            window.processBatchExcelRows(rows);
            return;
        }

        if (ext === 'csv') {
            if (typeof XLSX !== 'undefined') {
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                window.processBatchExcelRows(rows);
            } else {
                const csvText = await file.text();
                window.processBatchCSVText(csvText);
            }
            return;
        }

        if ((ext === 'docx' || ext === 'doc') && typeof mammoth !== 'undefined') {
            const arrayBuffer = await file.arrayBuffer();
            const res = await mammoth.extractRawText({ arrayBuffer });
            const extractedText = res.value || '';
            window.parseBatchStructuredText(extractedText);
            return;
        }

        // Texto plano
        const textContent = await file.text();
        window.parseBatchStructuredText(textContent);

    } catch (err) {
        console.error("Error al procesar archivo por lotes:", err);
        alert(`Error al procesar archivo (${fileName}): ` + err.message);
    }
};

// Procesar filas de Excel
window.processBatchExcelRows = function(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
        alert("El archivo Excel no contiene filas de datos.");
        return;
    }

    const parsedTerms = [];
    rows.forEach(row => {
        const termino = row['Término'] || row['Termino'] || row['término'] || row['nombre'] || row['Nombre'] || row['TÉRMINO'] || '';
        if (!termino || !String(termino).trim()) return;

        const cat = row['Categoría'] || row['Categoria'] || row['categoria'] || row['CATEGORÍA'] || 'financiera';
        const definicion = row['Definición'] || row['Definicion'] || row['definicion'] || row['descripcion'] || row['DEFINICIÓN'] || '';
        const baseLegal = row['Base Legal'] || row['Base legal'] || row['base_legal'] || row['baseLegal'] || row['BASE LEGAL'] || '';
        const ejemplo = row['Ejemplo'] || row['ejemplo'] || row['EJEMPLO'] || '';
        const relacionados = row['Relacionados'] || row['relacionados'] || row['RELACIONADOS'] || '';

        const norm = window.normalizeGlosarioTerm ? window.normalizeGlosarioTerm({
            termino: String(termino).trim(),
            categoria: String(cat).trim(),
            definicion: String(definicion).trim(),
            baseLegal: String(baseLegal).trim(),
            ejemplo: String(ejemplo).trim(),
            relacionados: relacionados
        }) : null;

        if (norm) parsedTerms.push(norm);
    });

    if (parsedTerms.length === 0) {
        alert("No se detectaron términos válidos en el archivo Excel. Asegúrate de incluir la columna 'Término'.");
        return;
    }

    window.pendingBatchTerms = parsedTerms;
    window.renderBatchPreview();
};

// Procesar texto CSV simple
window.processBatchCSVText = function(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
        alert("El archivo CSV no contiene suficientes registros.");
        return;
    }

    const headers = lines[0].split(/[,;\t]/).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    const parsedTerms = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[,;\t]/).map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length >= 1 && cols[0]) {
            const rawObj = {};
            headers.forEach((h, idx) => {
                rawObj[h] = cols[idx] || '';
            });
            const norm = window.normalizeGlosarioTerm ? window.normalizeGlosarioTerm({
                termino: rawObj['termino'] || rawObj['nombre'] || cols[0],
                categoria: rawObj['categoria'] || (cols[1] || 'financiera'),
                definicion: rawObj['definicion'] || rawObj['descripcion'] || (cols[2] || ''),
                baseLegal: rawObj['base legal'] || rawObj['base_legal'] || (cols[3] || ''),
                ejemplo: rawObj['ejemplo'] || (cols[4] || '')
            }) : null;
            if (norm) parsedTerms.push(norm);
        }
    }

    window.pendingBatchTerms = parsedTerms;
    window.renderBatchPreview();
};

// Procesar JSON
window.processBatchJSONContent = function(jsonText) {
    try {
        const data = JSON.parse(jsonText);
        let items = [];
        if (Array.isArray(data)) items = data;
        else if (data.terminos || data.terms || data.glosario) items = data.terminos || data.terms || data.glosario;
        else items = [data];

        const parsed = items.map(t => (window.normalizeGlosarioTerm ? window.normalizeGlosarioTerm(t) : t)).filter(Boolean);
        if (parsed.length === 0) throw new Error("No se detectaron términos válidos en el JSON.");

        window.pendingBatchTerms = parsed;
        window.renderBatchPreview();
    } catch (e) {
        alert("Error en el formato JSON: " + e.message);
    }
};

// Procesar Texto / Word estructurado
window.parseBatchStructuredText = function(text) {
    if (!text || !text.trim()) {
        alert("El texto está vacío.");
        return;
    }

    // 1. Probar si es JSON
    if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
        try {
            window.processBatchJSONContent(text);
            return;
        } catch(e){}
    }

    // 2. Parseo de bloques con etiquetas Término: ...
    const blockRegex = /(?:Término|Termino|Nombre)\s*:\s*([^\n\r]+)[\s\S]*?(?=(?:Término|Termino|Nombre)\s*:|$)/gi;
    const parsed = [];
    let match;

    while ((match = blockRegex.exec(text)) !== null) {
        const block = match[0];
        const nameMatch = block.match(/(?:Término|Termino|Nombre)\s*:\s*([^\n\r]+)/i);
        const catMatch = block.match(/(?:Categoría|Categoria)\s*:\s*([^\n\r]+)/i);
        const defMatch = block.match(/(?:Definición|Definicion|Descripción|Descripcion)\s*:\s*([^\n\r]+(?:\n(?!(?:Base Legal|Ejemplo|Relacionados|Término))[\s\S]*?)*)/i);
        const legalMatch = block.match(/(?:Base Legal|Base_legal|Legal)\s*:\s*([^\n\r]+)/i);
        const exMatch = block.match(/(?:Ejemplo|Ejemplo Práctico)\s*:\s*([^\n\r]+)/i);
        const relMatch = block.match(/(?:Relacionados|Términos Relacionados)\s*:\s*([^\n\r]+)/i);

        if (nameMatch && nameMatch[1].trim()) {
            const norm = window.normalizeGlosarioTerm ? window.normalizeGlosarioTerm({
                termino: nameMatch[1].trim(),
                categoria: catMatch ? catMatch[1].trim() : 'financiera',
                definicion: defMatch ? defMatch[1].trim() : '',
                baseLegal: legalMatch ? legalMatch[1].trim() : '',
                ejemplo: exMatch ? exMatch[1].trim() : '',
                relacionados: relMatch ? relMatch[1].trim() : ''
            }) : null;

            if (norm) parsed.push(norm);
        }
    }

    // 3. Probar si son filas de tabla tabulada (Excel copiado)
    if (parsed.length === 0) {
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        lines.forEach(line => {
            if (line.includes('\t')) {
                const parts = line.split('\t').map(p => p.trim());
                if (parts[0]) {
                    const norm = window.normalizeGlosarioTerm ? window.normalizeGlosarioTerm({
                        termino: parts[0],
                        categoria: parts[1] || 'financiera',
                        definicion: parts[2] || '',
                        baseLegal: parts[3] || '',
                        ejemplo: parts[4] || ''
                    }) : null;
                    if (norm) parsed.push(norm);
                }
            }
        });
    }

    if (parsed.length === 0) {
        alert("No se pudieron extraer términos contables. Utiliza el formato estructurado 'Término: ... Definición: ...' o una tabla copiada.");
        return;
    }

    window.pendingBatchTerms = parsed;
    window.renderBatchPreview();
};

window.parseBatchPastedContent = function() {
    const raw = document.getElementById('batch-paste-textarea').value;
    window.parseBatchStructuredText(raw);
};

// Renderizar Previsualización del Lote
window.renderBatchPreview = function() {
    const emptyState = document.getElementById('batch-preview-empty');
    const container = document.getElementById('batch-preview-container');
    const badge = document.getElementById('batch-preview-badge');
    const saveBtn = document.getElementById('btn-save-batch-terms');

    const list = window.pendingBatchTerms || [];

    if (badge) {
        badge.innerText = `${list.length} Término${list.length === 1 ? '' : 's'} listo${list.length === 1 ? '' : 's'}`;
    }

    if (list.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (container) container.classList.add('hidden');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.className = "px-6 py-2.5 rounded-xl bg-slate-700 text-slate-400 font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-not-allowed";
        }
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (container) container.classList.remove('hidden');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.className = "px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer";
        saveBtn.innerHTML = `<i class="fas fa-cloud-arrow-up"></i> Guardar ${list.length} Términos en la Biblioteca`;
    }

    container.innerHTML = list.map((item, idx) => `
        <div class="flex items-center justify-between p-3 rounded-xl bg-[#17171c] border border-white/5 text-xs">
            <div class="flex items-center gap-3 min-w-0">
                <span class="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                    ${escHtml(item.letra || idx + 1)}
                </span>
                <div class="min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-white truncate">${escHtml(item.termino)}</span>
                        <span class="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] text-emerald-400 font-bold uppercase">${escHtml(item.categoria)}</span>
                    </div>
                    <p class="text-slate-400 line-clamp-1 text-[11px]">${escHtml(item.definicion || 'Sin definición')}</p>
                </div>
            </div>
            <button onclick="window.removeBatchItem(${idx})" class="w-6 h-6 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-400 flex items-center justify-center text-[10px] transition-colors" title="Quitar de este lote">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
};

window.removeBatchItem = function(index) {
    if (window.pendingBatchTerms && window.pendingBatchTerms[index]) {
        window.pendingBatchTerms.splice(index, 1);
        window.renderBatchPreview();
    }
};

// Guardar Lote en Supabase & LocalStorage
window.saveBatchTermsToCloud = async function() {
    const list = window.pendingBatchTerms || [];
    if (list.length === 0) return;

    const saveBtn = document.getElementById('btn-save-batch-terms');
    const overwrite = document.getElementById('batch-overwrite-checkbox')?.checked ?? true;

    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando e Indexando...';
        }

        // Subir a Supabase
        if (window.supabaseClient) {
            const formatted = list.map(item => ({
                id: item.id,
                termino: item.termino,
                letra: item.letra,
                categoria: item.categoria,
                categoria_label: item.categoriaLabel,
                definicion: item.definicion,
                base_legal: item.baseLegal,
                ejemplo: item.ejemplo,
                relacionados: item.relacionados,
                vigencia_anio: 2026,
                updated_at: new Date().toISOString()
            }));

            const CHUNK_SIZE = 50;
            for (let i = 0; i < formatted.length; i += CHUNK_SIZE) {
                const chunk = formatted.slice(i, i + CHUNK_SIZE);
                const { error } = await window.supabaseClient.from('biblioteca_terminos').upsert(chunk, { onConflict: 'id' });
                if (error) throw error;
            }
        }

        // Integrar en memoria y localStorage
        list.forEach(newTerm => {
            const existingIdx = window.adminGlosarioDataset.findIndex(t => t.id === newTerm.id || t.termino.toLowerCase() === newTerm.termino.toLowerCase());
            if (existingIdx >= 0) {
                if (overwrite) window.adminGlosarioDataset[existingIdx] = newTerm;
            } else {
                window.adminGlosarioDataset.push(newTerm);
            }
        });

        window.adminGlosarioDataset.sort((a, b) => a.termino.localeCompare(b.termino, 'es'));

        try {
            localStorage.setItem('educonta_glosario_custom', JSON.stringify(window.adminGlosarioDataset));
        } catch (e) {}

        window.closeBatchImportModal();
        window.renderCMSGlosario();

        if (typeof window.showAlert === 'function') {
            window.showAlert("¡Lote Importado con Éxito!", `Se han indexado y sincronizado ${list.length} términos contables en la Biblioteca de EduConta SV.`);
        } else {
            alert(`¡${list.length} términos agregados e indexados con éxito!`);
        }

    } catch (err) {
        console.error("Error al guardar lote de términos:", err);
        alert("Error al guardar lote: " + err.message);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-cloud-arrow-up"></i> Guardar Lote en la Biblioteca';
        }
    }
};

// Descarga de Plantillas
window.downloadGlosarioJSONTemplate = function() {
    const templateData = [
        {
            termino: "Caja General",
            categoria: "financiera",
            definicion: "Cuenta que registra las entradas y salidas de dinero en efectivo y cheques dentro de la empresa.",
            baseLegal: "Código de Comercio Art. 437 / NIC 1",
            ejemplo: "Arqueo de caja al final de la jornada por $500.00 en efectivo.",
            relacionados: ["Efectivo y Equivalentes", "Caja Chica", "Bancos"]
        },
        {
            termino: "Comprobante de Retención",
            categoria: "fiscal",
            definicion: "Documento oficial tributario emitido por agentes de retención autorizados que certifica el 1% de IVA deducido.",
            baseLegal: "Código Tributario Art. 162",
            ejemplo: "En compras de $1,000.00 se retiene el 1% ($10.00) y se emite el comprobante.",
            relacionados: ["Retención IVA", "Grandes Contribuyentes", "Crédito Fiscal"]
        }
    ];

    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_glosario_educonta.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

window.downloadGlosarioCSVTemplate = function() {
    const csvContent = "Término,Categoría,Definición,Base Legal,Ejemplo,Relacionados\n" +
        "\"Caja General\",\"financiera\",\"Cuenta que registra las entradas y salidas de efectivo y cheques.\",\"Código de Comercio Art. 437\",\"Arqueo de caja por $500.00.\",\"Bancos; Efectivo\"\n" +
        "\"Comprobante de Retención\",\"fiscal\",\"Documento tributario emitido por agentes de retención del 1% de IVA.\",\"Código Tributario Art. 162\",\"Retención del 1% en compra mayor a $100.\",\"Retención IVA; F-07\"";

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_glosario_educonta.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

window.loadExampleInBatchTextarea = function() {
    const example = [
        {
            termino: "Caja Chica",
            categoria: "financiera",
            definicion: "Fondo fijo de efectivo destinado a cubrir pagos menores y urgentes del negocio.",
            baseLegal: "Normas de Control Interno Contable",
            ejemplo: "Fondo asignado de $200.00 sujeto a liquidación periódica.",
            relacionados: ["Caja General", "Efectivo y Equivalentes"]
        },
        {
            termino: "Factura de Sujeto Excluido",
            categoria: "fiscal",
            definicion: "Documento que respalda adquisiciones de bienes o servicios a personas naturales que no son contribuyentes de IVA.",
            baseLegal: "Código Tributario Art. 119",
            ejemplo: "Compra de servicios eventuales de jardinería por $50.00 con retención de renta del 10%.",
            relacionados: ["Retención de Renta", "Gastos Deducibles"]
        }
    ];

    const textarea = document.getElementById('batch-paste-textarea');
    if (textarea) {
        textarea.value = JSON.stringify(example, null, 2);
    }
};

// =============================================================================
// 5. GESTOR DE PARÁMETROS FISCALES 2026
// =============================================================================
window.loadCMSFiscalParameters = async function() {
    // 1. Carga previa instantánea desde localStorage
    try {
        const cached = localStorage.getItem('educonta_parametros_fiscales');
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.salarios) window.applySalariosToAdminInputs(parsed.salarios);
            if (parsed.seguridadSocial) window.applySeguridadSocialToAdminInputs(parsed.seguridadSocial);
        }
    } catch (e) {}

    // 2. Carga en la nube desde Supabase
    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient.from('parametros_fiscales').select('*');
            if (!error && data && data.length > 0) {
                let savedSalarios = {};
                let savedSeguridad = {};
                data.forEach(row => {
                    if (row.id === 'salarios_minimos' && row.datos) {
                        savedSalarios = row.datos;
                        window.applySalariosToAdminInputs(row.datos);
                    }
                    if (row.id === 'seguridad_social' && row.datos) {
                        savedSeguridad = row.datos;
                        window.applySeguridadSocialToAdminInputs(row.datos);
                    }
                });
                try {
                    localStorage.setItem('educonta_parametros_fiscales', JSON.stringify({
                        salarios: savedSalarios,
                        seguridadSocial: savedSeguridad
                    }));
                } catch (e) {}
            }
        } catch (e) {
            console.warn("CMS Parámetros: Usando valores por defecto o locales.", e);
        }
    }
};

window.applySalariosToAdminInputs = function(s) {
    if (!s) return;
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null) el.value = parseFloat(val).toFixed(2);
    };
    setVal('param-salario-comercio', s.comercio);
    setVal('param-salario-industria', s.industria);
    setVal('param-salario-maquila', s.maquila);
    setVal('param-salario-agro1', s.agro1);
    setVal('param-salario-agro2', s.agro2);
};

window.applySeguridadSocialToAdminInputs = function(ss) {
    if (!ss) return;
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null) el.value = val;
    };
    setVal('param-isss-lab', ss.isss_laboral);
    setVal('param-isss-pat', ss.isss_patronal);
    setVal('param-isss-techo', ss.isss_techo);
    setVal('param-afp-lab', ss.afp_laboral);
    setVal('param-afp-pat', ss.afp_patronal);
    setVal('param-iva', ss.iva);
    setVal('param-pago-cuenta', ss.pago_cuenta);
};

window.saveCMSFiscalParameters = async function() {
    const salarios = {
        comercio: parseFloat(document.getElementById('param-salario-comercio')?.value) || 365.00,
        industria: parseFloat(document.getElementById('param-salario-industria')?.value) || 365.00,
        maquila: parseFloat(document.getElementById('param-salario-maquila')?.value) || 359.16,
        agro1: parseFloat(document.getElementById('param-salario-agro1')?.value) || 272.66,
        agro2: parseFloat(document.getElementById('param-salario-agro2')?.value) || 243.46
    };

    const seguridadSocial = {
        isss_laboral: parseFloat(document.getElementById('param-isss-lab')?.value) || 3.0,
        isss_patronal: parseFloat(document.getElementById('param-isss-pat')?.value) || 7.5,
        isss_techo: parseFloat(document.getElementById('param-isss-techo')?.value) || 1000.00,
        afp_laboral: parseFloat(document.getElementById('param-afp-lab')?.value) || 7.25,
        afp_patronal: parseFloat(document.getElementById('param-afp-pat')?.value) || 8.75,
        iva: parseFloat(document.getElementById('param-iva')?.value) || 13.0,
        pago_cuenta: parseFloat(document.getElementById('param-pago-cuenta')?.value) || 1.75
    };

    // Guardar inmediatamente en localStorage
    try {
        localStorage.setItem('educonta_parametros_fiscales', JSON.stringify({ salarios, seguridadSocial }));
    } catch (e) {}

    // Sincronizar con Supabase
    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('parametros_fiscales').upsert([
                { id: 'salarios_minimos', datos: salarios, vigencia_anio: 2026, updated_at: new Date().toISOString() },
                { id: 'seguridad_social', datos: seguridadSocial, vigencia_anio: 2026, updated_at: new Date().toISOString() }
            ], { onConflict: 'id' });
        } catch (err) {
            console.warn("Error guardando parámetros en Supabase:", err);
        }
    }

    if (typeof window.showAlert === 'function') {
        window.showAlert("Parámetros Guardados", "Las tasas tributarias y salarios mínimos de El Salvador han sido actualizados en la base de datos y sincronizados con la Biblioteca.");
    } else {
        alert("Parámetros fiscales guardados con éxito.");
    }
};
