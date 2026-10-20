// =========================================================
// LIENZO LIBRE & DISEÑO PROFESIONAL ENGINE — EduConta SV
// Suite de Diseño, Documentos Libres, Pizarras y Mockups
// =========================================================

// --- Estado Global ---
let projects = [];
let proyecto_actual = null;
let activeSheetIndex = 0;
let autoSaveTimeout = null;

// --- Tipos de Vista & Formato ---
// 'lienzo' (infinito) | 'hoja' (paginada A4/Carta) | 'presentacion' (slides 16:9) | 'tablero' (marcos)
let currentViewMode = 'lienzo';
let pageSize = 'letter'; // 'letter' | 'a4' | 'legal'
let pageOrientation = 'portrait'; // 'portrait' | 'landscape'
let currentSlideIndex = 0;
let totalSlides = 1;

// --- Viewport & Navegación ---
let panX = 100;
let panY = 180;
let zoom = 1.0;
let isPanning = false;
let startPanMouseX = 0;
let startPanMouseY = 0;
let isSpacePressed = false;

// --- Herramienta Activa ---
// 'select', 'hand', 'shape', 'connector', 'note', 'text', 'table', 'brush', 'eraser'
let activeTool = 'select';
let brushMode = 'pen'; // 'pen' | 'highlighter'
let brushSize = 4;
let brushColor = '#f59e0b';

// --- Selección & Transformación ---
let selectedElementId = null;
let selectedElementIds = new Set();
let isDraggingElements = false;
let isResizing = false;
let isRotating = false;
let resizeHandleType = null;
let dragStartX = 0;
let dragStartY = 0;
let initialElemBounds = null; // {x, y, w, h, rotation}
let initialMultiBounds = new Map();

// --- Selección por Rectángulo (Marquee) ---
let isMarqueeSelecting = false;
let marqueeStartX = 0;
let marqueeStartY = 0;

// --- Dibujo Libre (Freehand) ---
let isDrawingStroke = false;
let currentStrokePoints = [];

// --- Conectores ---
let isCreatingConnector = false;
let connectorStartPoint = null;
// --- Reglas Graduadas & Medidas (PX, CM, MM) ---
let showRulers = true;
let rulerUnit = 'px'; // 'px' | 'cm' | 'mm'
let currentMouseScreenX = -999;
let currentMouseScreenY = -999;

// --- Preajustes de Hoja Física Tradicional ---
let sheetPresetOrientation = 'portrait'; // 'portrait' | 'landscape'

// --- Historial Undo/Redo ---
let historyStack = [];
let historyIndex = -1;
const MAX_HISTORY = 30;
let historyTimeout = null;

// --- Z-Index Counter ---
let highestZIndex = 10;
let realtimeChannel = null;

// =========================================================
// 1. INICIALIZACIÓN
// =========================================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (typeof injectSharedUI === 'function') {
            injectSharedUI('shared-components-root');
        }
    } catch (e) {}

    // Cargar proyectos desde LocalStorage / URL
    await loadProjectFromStorage();

    // Configurar Eventos del Viewport y Teclado
    setupViewportListeners();
    setupKeyboardShortcuts();
    initRulers();
    initMagneticTrigger();

    // Renderizar Hojas, Elementos, Modo de Vista y Minimapa
    renderSheetTabs();
    loadActiveSheetData();

    // Inicializar Motor de Colaboración en Tiempo Real (Multiplayer)
    if (proyecto_actual && window.LienzoCollabEngine) {
        window.LienzoCollabEngine.init(proyecto_actual.id);
    }
    checkCloudSession();

    // Comprobar Modo Auditoría
    checkAuditMode();

    // Guardar estado inicial en el historial
    pushHistoryState(true);

    // Desvanecer preloader suavemente tras inicializar lienzo, hojas y minimapa
    if (typeof window.dismissGlobalPreloader === 'function') {
        window.dismissGlobalPreloader();
    }
});

// =========================================================
// 2. GESTIÓN DE PROYECTO Y PERSISTENCIA
// =========================================================
async function loadProjectFromStorage() {
    const rawProjects = localStorage.getItem('educonta_projects_lienzos');
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('id');
    let lastProjectId = urlId || localStorage.getItem('educonta_last_project_id');

    if (rawProjects) {
        try {
            projects = JSON.parse(rawProjects);
        } catch (e) {
            projects = [];
        }
    }

    if (projects.length > 0) {
        proyecto_actual = projects.find(p => p.id === lastProjectId) || projects[0];
        localStorage.setItem('educonta_last_project_id', proyecto_actual.id);
    }

    // Si viene por enlace de invitación (?id=...) y no está localmente, intentar cargar de Supabase
    if (!proyecto_actual && urlId && typeof supabaseClient !== 'undefined') {
        try {
            const { data, error } = await supabaseClient
                .from('proyectos_contables')
                .select('*')
                .eq('id', urlId)
                .single();
            if (data && data.data) {
                proyecto_actual = data.data;
                projects.unshift(proyecto_actual);
                localStorage.setItem('educonta_projects_lienzos', JSON.stringify(projects));
                localStorage.setItem('educonta_last_project_id', proyecto_actual.id);
            }
        } catch (err) {
            console.warn("No se pudo cargar proyecto remoto por ID:", err);
        }
    }

    // Si no existe ninguno, crear uno nuevo con plantilla de bienvenida
    if (!proyecto_actual) {
        proyecto_actual = createDefaultProject();
        projects = [proyecto_actual];
        localStorage.setItem('educonta_projects_lienzos', JSON.stringify(projects));
        localStorage.setItem('educonta_last_project_id', proyecto_actual.id);
    }

    // Restaurar modo de vista y configuración de página
    currentViewMode = proyecto_actual.viewMode || 'lienzo';
    pageSize = proyecto_actual.pageSize || 'letter';
    pageOrientation = proyecto_actual.pageOrientation || 'portrait';

    // Asegurar estructura
    if (!proyecto_actual.sheets || proyecto_actual.sheets.length === 0) {
        proyecto_actual.sheets = [createDefaultSheet('Lienzo 1')];
    }

    // Actualizar nombre en input
    const titleInput = document.getElementById('doc-title-input');
    if (titleInput) {
        titleInput.value = proyecto_actual.name || 'Mi Lienzo Libre';
    }
}

function createDefaultProject() {
    return {
        id: 'doc_lienzo_' + Date.now(),
        name: 'Mi Lienzo Libre',
        type: 'lienzos',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        shared_with: [],
        sheets: [createDefaultSheet('Lienzo 1')]
    };
}

function createDefaultSheet(name) {
    const isMobile = window.innerWidth < 768;
    const availW = Math.max(280, window.innerWidth - (isMobile ? 50 : 140));
    const availH = Math.max(280, window.innerHeight - 200);
    const letterW = 816;
    const letterH = 1056;
    const initialZoom = Math.min(availW / letterW, availH / letterH, 1.0);
    const initialPanX = window.innerWidth / 2;
    const initialPanY = window.innerHeight / 2;

    const sheet = {
        id: 'sheet_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: name || 'Lienzo 1',
        gridStyle: 'grid-lines',
        snapToGrid: true,
        panX: initialPanX,
        panY: initialPanY,
        zoom: Math.round(initialZoom * 100) / 100,
        elements: [],
        freehandStrokes: [],
        connectors: []
    };

    return sheet;
}

window.renameProjectName = function(newName) {
    if (!proyecto_actual || window.isAuditMode) return;
    proyecto_actual.name = newName.trim() || 'Mi Lienzo Libre';
    triggerAutoSave();
};

function triggerAutoSave() {
    if (window.isAuditMode) return;
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    
    // Indicador local guardando
    const saveText = document.getElementById('save-indicator-text');
    if (saveText) saveText.textContent = "GUARDANDO...";

    autoSaveTimeout = setTimeout(() => {
        saveState();
    }, 3000);
}

async function saveState(isManual = false) {
    if (!proyecto_actual || window.isAuditMode) return;
    proyecto_actual.updatedAt = new Date().toISOString();
    proyecto_actual.viewMode = currentViewMode;
    proyecto_actual.pageSize = pageSize;
    proyecto_actual.pageOrientation = pageOrientation;

    // Actualizar vista actual en el sheet activo
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (sheet) {
        sheet.panX = panX;
        sheet.panY = panY;
        sheet.zoom = zoom;
    }

    const idx = projects.findIndex(p => p.id === proyecto_actual.id);
    if (idx !== -1) {
        projects[idx] = proyecto_actual;
    } else {
        projects.unshift(proyecto_actual);
    }

    localStorage.setItem('educonta_projects_lienzos', JSON.stringify(projects));

    const saveText = document.getElementById('save-indicator-text');
    if (saveText) saveText.textContent = "LOCAL";

    // Supabase Cloud Sync
    if (!navigator.onLine) {
        if (typeof updateSyncUI === 'function') updateSyncUI('offline');
        if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('offline');
    } else if (typeof supabaseClient !== 'undefined') {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession().catch(() => ({ data: { session: null } }));
            if (session) {
                if (typeof updateSyncUI === 'function') updateSyncUI('syncing');

                if (typeof window.syncCurrentProjectWithSupabase === 'function') {
                    await window.syncCurrentProjectWithSupabase(proyecto_actual, session.user.id, true);
                }

                if (typeof updateSyncUI === 'function') updateSyncUI('success');
                if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('success', 'Lienzo respaldado con éxito');
            } else {
                if (typeof updateSyncUI === 'function') updateSyncUI('local');
                if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('local', 'Lienzo guardado en este equipo');
            }
        } catch (e) {
            console.error("Error sincronizando en la nube:", e);
            const errMsg = e.message || String(e);
            if (typeof updateSyncUI === 'function') updateSyncUI('error', errMsg);
            if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('error', errMsg);
        }
    } else {
        if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('local', 'Lienzo guardado en este equipo');
    }
}

window.saveActiveCanvas = function() {
    return saveState(true);
};

window.forceSave = function(quiet = false) {
    return saveState(!quiet);
};

window.updateSyncUI = function(state, detail = "") {
    const saveInd = document.getElementById('save-indicator');
    const saveText = document.getElementById('save-indicator-text');
    const cloudInd = document.getElementById('cloud-indicator');
    const cloudText = document.getElementById('cloud-indicator-text');
    
    if (saveInd && saveText) {
        saveInd.className = "flex items-center justify-center gap-1 w-full text-emerald-600 dark:text-emerald-400 font-black bg-emerald-500/10 rounded-full";
        saveText.textContent = "LOCAL";
    }

    if (!cloudInd || !cloudText) return;

    if (!navigator.onLine && state !== 'offline') {
        state = 'offline';
    }

    const icon = cloudInd.querySelector('i');

    if (state === 'syncing') {
        cloudInd.className = "flex items-center justify-center gap-1 w-full text-sky-600 dark:text-sky-400 font-black bg-sky-500/10 rounded-full animate-pulse";
        if (icon) icon.className = "fas fa-sync fa-spin";
        cloudText.textContent = "SINCRONIZANDO";
    } else if (state === 'success' || state === 'online') {
        cloudInd.className = "flex items-center justify-center gap-1 w-full text-emerald-600 dark:text-emerald-400 font-black bg-emerald-500/10 rounded-full";
        if (icon) icon.className = "fas fa-cloud-check";
        cloudText.textContent = "SINCRONIZADO";
    } else if (state === 'offline') {
        cloudInd.className = "flex items-center justify-center gap-1 w-full text-amber-600 dark:text-amber-400 font-black bg-amber-500/10 rounded-full";
        if (icon) icon.className = "fas fa-wifi-slash";
        cloudText.textContent = "OFFLINE";
    } else if (state === 'local') {
        cloudInd.className = "flex items-center justify-center gap-1 w-full text-slate-500 dark:text-slate-400 font-black bg-slate-100 dark:bg-slate-800 rounded-full";
        if (icon) icon.className = "fas fa-hdd";
        cloudText.textContent = "SOLO LOCAL";
    } else if (state === 'error') {
        cloudInd.className = "flex items-center justify-center gap-1 w-full text-rose-600 dark:text-rose-400 font-black bg-rose-500/10 rounded-full";
        if (icon) icon.className = "fas fa-exclamation-triangle";
        cloudText.textContent = "ERROR SYNC";
    }
};

window.addEventListener('online', () => {
    if (typeof window.showSyncToast === 'function') window.showSyncToast('online');
    if (typeof saveState === 'function') saveState(false);
});
window.addEventListener('offline', () => {
    if (typeof updateSyncUI === 'function') updateSyncUI('offline');
    if (typeof window.showSyncToast === 'function') window.showSyncToast('offline');
});

// Atajo de teclado para Guardar Manual (Ctrl+S / Cmd+S)
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
        e.preventDefault();
        window.saveActiveCanvas();
    }
});

// =========================================================
// 3. GESTIÓN DE HOJAS / PÁGINAS DEL LIENZO
// =========================================================
function renderSheetTabs() {
    const container = document.getElementById('sheets-tabs-container');
    if (!container || !proyecto_actual) return;

    container.innerHTML = '';
    proyecto_actual.sheets.forEach((sheet, idx) => {
        const tab = document.createElement('div');
        tab.className = `sheet-tab ${idx === activeSheetIndex ? 'active' : ''}`;
        tab.innerHTML = `
            <span>${escapeHtml(sheet.name || `Página ${idx + 1}`)}</span>
            ${proyecto_actual.sheets.length > 1 && !window.isAuditMode ? `<i class="fas fa-times opacity-60 hover:opacity-100 ml-1 text-[9px]" onclick="event.stopPropagation(); deleteSheet(${idx})"></i>` : ''}
        `;
        tab.onclick = () => switchSheet(idx);
        container.appendChild(tab);
    });
}

window.switchSheet = function(idx) {
    if (idx === activeSheetIndex) return;
    
    // Guardar estado actual
    const currentSheet = proyecto_actual.sheets[activeSheetIndex];
    if (currentSheet) {
        currentSheet.panX = panX;
        currentSheet.panY = panY;
        currentSheet.zoom = zoom;
    }

    activeSheetIndex = idx;
    deselectAll();
    renderSheetTabs();
    loadActiveSheetData();
    pushHistoryState(true);
};

function loadActiveSheetData() {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    // Restaurar viewport
    panX = sheet.panX !== undefined ? sheet.panX : 100;
    panY = sheet.panY !== undefined ? sheet.panY : 80;
    zoom = sheet.zoom !== undefined ? sheet.zoom : 1.0;
    updateWorldTransform();

    // Aplicar cuadrícula
    const viewport = document.getElementById('canvas-viewport');
    if (viewport) {
        viewport.className = sheet.gridStyle || 'grid-lines';
    }

    // Renderizar Elementos DOM
    renderAllElements();

    // Renderizar Trazos y Conectores SVG
    renderAllSVG();

    // Renderizar Fondo según el Modo de Vista (Hoja, Diapositiva, Tablero)
    if (window.ViewModeController) {
        window.ViewModeController.init();
    }

    // Actualizar Minimapa, Inspector y Gestor de Hojas
    updateMinimap();
    renderInspector();
    renderSheetNavigator();
}

window.openNewSheetModal = function() {
    if (window.isAuditMode) return;
    const modal = document.getElementById('sheet-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        const input = document.getElementById('sheet-input-name');
        if (input) {
            input.value = `Lienzo ${proyecto_actual.sheets.length + 1}`;
            setTimeout(() => input.focus(), 100);
        }
    }
};

window.closeSheetModal = function() {
    const modal = document.getElementById('sheet-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
};

window.saveNewSheet = function() {
    if (window.isAuditMode) return;
    const input = document.getElementById('sheet-input-name');
    const name = input ? input.value.trim() : '';
    const newSheet = createDefaultSheet(name || `Lienzo ${proyecto_actual.sheets.length + 1}`);

    proyecto_actual.sheets.push(newSheet);
    activeSheetIndex = proyecto_actual.sheets.length - 1;
    
    closeSheetModal();
    renderSheetTabs();
    loadActiveSheetData();
    triggerAutoSave();
};

window.deleteSheet = function(idx) {
    if (window.isAuditMode) return;
    if (proyecto_actual.sheets.length <= 1) {
        alert("El documento debe conservar al menos una página de lienzo.");
        return;
    }
    if (confirm(`¿Deseas eliminar la página "${proyecto_actual.sheets[idx].name}"?`)) {
        proyecto_actual.sheets.splice(idx, 1);
        if (activeSheetIndex >= proyecto_actual.sheets.length) {
            activeSheetIndex = proyecto_actual.sheets.length - 1;
        }
        renderSheetTabs();
        loadActiveSheetData();
        triggerAutoSave();
    }
};

// =========================================================
// 4. MOTOR DE VIEWPORT: PAN, ZOOM & CUADRÍCULA
// =========================================================
function setupViewportListeners() {
    const viewport = document.getElementById('canvas-viewport');
    if (!viewport) return;

    // --- Mouse Down (Inicio de Paneo, Selección o Creación) ---
    viewport.addEventListener('mousedown', (e) => {
        // Clic en botón central o herramienta mano o Barra espaciadora -> Iniciar Paneo
        if (e.button === 1 || activeTool === 'hand' || isSpacePressed) {
            isPanning = true;
            startPanMouseX = e.clientX - panX;
            startPanMouseY = e.clientY - panY;
            viewport.style.cursor = 'grabbing';
            e.preventDefault();
            return;
        }

        // Clic izquierdo en herramienta Pincel -> Iniciar Trazo
        if (activeTool === 'brush' && e.button === 0 && !window.isAuditMode) {
            startFreehandStroke(e);
            return;
        }

        // Clic izquierdo en fondo vacío -> Deseleccionar o Iniciar Marquee
        if (e.target === viewport || e.target.id === 'canvas-world' || e.target.id === 'canvas-dom-layer' || e.target.id === 'canvas-svg-layer') {
            if (!e.shiftKey && !e.ctrlKey) {
                deselectAll();
            }
            // Iniciar selección por caja (Marquee)
            if (activeTool === 'select' && !window.isAuditMode) {
                const worldPos = screenToWorld(e.clientX, e.clientY);
                isMarqueeSelecting = true;
                marqueeStartX = worldPos.x;
                marqueeStartY = worldPos.y;
                updateMarqueeBox(worldPos.x, worldPos.y, 0, 0);
            }
        }
    });

    // =========================================================
    // MOTOR DE RENDERIZADO 120 FPS & HiDPI (REQUEST ANIMATION FRAME)
    // =========================================================
    let viewportRafScheduled = false;
    let pendingWorldTransform = false;
    let pendingRulers = false;
    let pendingMinimap = false;
    let pendingDragEvent = null;
    let pendingResizeEvent = null;
    let pendingRotateEvent = null;
    let pendingMarqueePos = null;

    window.scheduleViewportUpdate = function(flags = {}) {
        if (flags.world) pendingWorldTransform = true;
        if (flags.rulers) pendingRulers = true;
        if (flags.minimap) pendingMinimap = true;

        if (!viewportRafScheduled) {
            viewportRafScheduled = true;
            requestAnimationFrame(flushViewportUpdates);
        }
    };

    function flushViewportUpdates() {
        viewportRafScheduled = false;

        if (pendingWorldTransform) {
            pendingWorldTransform = false;
            applyWorldTransformDirect();
        }

        if (pendingDragEvent) {
            const e = pendingDragEvent;
            pendingDragEvent = null;
            applyElementsDragDirect(e);
        }

        if (pendingResizeEvent) {
            const e = pendingResizeEvent;
            pendingResizeEvent = null;
            applyElementResizeDirect(e);
        }

        if (pendingRotateEvent) {
            const e = pendingRotateEvent;
            pendingRotateEvent = null;
            applyElementRotateDirect(e);
        }

        if (pendingMarqueePos) {
            const pos = pendingMarqueePos;
            pendingMarqueePos = null;
            updateMarqueeBox(pos.x, pos.y, pos.w, pos.h);
            checkMarqueeIntersections(pos.x, pos.y, pos.w, pos.h);
        }

        if (pendingRulers && showRulers) {
            pendingRulers = false;
            renderRulersDirect();
        }

        if (pendingMinimap) {
            pendingMinimap = false;
            renderMinimapDirect();
        }
    }

    // --- Mouse Move Sincronizado a 120Hz ---
    window.addEventListener('mousemove', (e) => {
        currentMouseScreenX = e.clientX;
        currentMouseScreenY = e.clientY;
        if (showRulers) window.scheduleViewportUpdate({ rulers: true });

        if (isPanning) {
            panX = e.clientX - startPanMouseX;
            panY = e.clientY - startPanMouseY;
            window.scheduleViewportUpdate({ world: true, rulers: true, minimap: true });
            return;
        }

        if (isDrawingStroke) {
            addPointToStroke(e);
            return;
        }

        if (isMarqueeSelecting) {
            const worldPos = screenToWorld(e.clientX, e.clientY);
            const x = Math.min(marqueeStartX, worldPos.x);
            const y = Math.min(marqueeStartY, worldPos.y);
            const w = Math.abs(worldPos.x - marqueeStartX);
            const h = Math.abs(worldPos.y - marqueeStartY);
            pendingMarqueePos = { x, y, w, h };
            window.scheduleViewportUpdate();
            return;
        }

        if (isDraggingElements) {
            pendingDragEvent = e;
            window.scheduleViewportUpdate();
            return;
        }

        if (isResizing) {
            pendingResizeEvent = e;
            window.scheduleViewportUpdate();
            return;
        }

        if (isRotating) {
            pendingRotateEvent = e;
            window.scheduleViewportUpdate();
            return;
        }

        // Transmisión de Cursor en Vivo (Multiplayer Throttled)
        if (window.LienzoCollabEngine) {
            const worldPos = screenToWorld(e.clientX, e.clientY);
            window.LienzoCollabEngine.broadcastCursor(worldPos.x, worldPos.y);
        }
    });

    // --- Mouse Up ---
    window.addEventListener('mouseup', (e) => {
        const wasInteracting = isDraggingElements || isResizing || isRotating;

        if (isPanning) {
            isPanning = false;
            viewport.style.cursor = activeTool === 'hand' ? 'grab' : 'default';
        }

        if (isDrawingStroke) {
            finishFreehandStroke();
        }

        if (isMarqueeSelecting) {
            isMarqueeSelecting = false;
            const marquee = document.getElementById('selection-marquee');
            if (marquee) marquee.style.display = 'none';
            renderTransformBox();
        }

        if (wasInteracting) {
            // Sincronizar DOM completo tras terminar resize
            if (isResizing && selectedElementId) {
                const sheet = proyecto_actual ? proyecto_actual.sheets[activeSheetIndex] : null;
                const el = sheet ? sheet.elements.find(item => item.id === selectedElementId) : null;
                if (el) renderElementDOM(el);
            }

            isDraggingElements = false;
            isResizing = false;
            isRotating = false;
            renderTransformBox();
            pushHistoryState();
            triggerAutoSave();

            // Broadcast de elementos modificados a otros colaboradores
            if (window.LienzoCollabEngine && selectedElementIds.size > 0 && proyecto_actual) {
                const sheet = proyecto_actual.sheets[activeSheetIndex];
                if (sheet) {
                    selectedElementIds.forEach(id => {
                        const el = sheet.elements.find(item => item.id === id);
                        if (el) window.LienzoCollabEngine.broadcastElementUpdate(el);
                    });
                }
            }
        }
    });

    // --- Zoom con Rueda del Ratón (Pacing 120 FPS) ---
    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
        zoomAtPoint(e.clientX, e.clientY, zoomFactor);
    }, { passive: false });
}

function screenToWorld(clientX, clientY) {
    const viewport = document.getElementById('canvas-viewport');
    const rect = viewport ? viewport.getBoundingClientRect() : { left: 0, top: 0 };
    return {
        x: (clientX - rect.left - panX) / zoom,
        y: (clientY - rect.top - panY) / zoom
    };
}

function zoomAtPoint(clientX, clientY, factor) {
    const newZoom = Math.min(5.0, Math.max(0.05, zoom * factor));
    const viewport = document.getElementById('canvas-viewport');
    const rect = viewport.getBoundingClientRect();

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    panX = mouseX - (mouseX - panX) * (newZoom / zoom);
    panY = mouseY - (mouseY - panY) * (newZoom / zoom);
    zoom = newZoom;

    updateWorldTransform();
}

function applyWorldTransformDirect() {
    const world = document.getElementById('canvas-world');
    if (world) {
        world.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;
    }

    // Sincronización continua de la cuadrícula/puntos de fondo con aceleración por hardware
    const viewport = document.getElementById('canvas-viewport');
    if (viewport) {
        const baseGridSize = 28;
        const currentGridSize = baseGridSize * zoom;
        viewport.style.backgroundPosition = `${panX}px ${panY}px`;
        viewport.style.backgroundSize = `${currentGridSize}px ${currentGridSize}px`;
    }

    // Actualizar indicador de zoom en footer
    const indicator = document.getElementById('zoom-indicator');
    if (indicator) {
        indicator.textContent = `${Math.round(zoom * 100)}%`;
    }
}

function updateWorldTransform() {
    if (typeof window.scheduleViewportUpdate === 'function') {
        window.scheduleViewportUpdate({ world: true, minimap: true, rulers: true });
    } else {
        applyWorldTransformDirect();
        updateMinimap();
        if (showRulers) updateRulers();
    }
}

window.setZoomDelta = function(delta) {
    const viewport = document.getElementById('canvas-viewport');
    const rect = viewport.getBoundingClientRect();
    zoomAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 + delta);
};

window.zoomTo100 = function() {
    const targetZoom = 1.0;
    if (Math.abs(zoom - targetZoom) < 0.001) {
        showToastNotification("El zoom ya está al 100%");
        return;
    }
    
    // Zoom al 100% manteniendo exactamente la posición y punto focal actual en pantalla
    const viewport = document.getElementById('canvas-viewport');
    const rect = viewport ? viewport.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    panX = centerX - (centerX - panX) * (targetZoom / zoom);
    panY = centerY - (centerY - panY) * (targetZoom / zoom);
    zoom = targetZoom;

    updateWorldTransform();
    showToastNotification("Zoom al 100% (Tamaño real)");
};
window.resetZoom = window.zoomTo100;

window.resetViewCenter = function() {
    const sheet = proyecto_actual ? proyecto_actual.sheets[activeSheetIndex] : null;
    const elements = sheet ? (sheet.elements || []) : [];
    const firstSheet = elements.find(el => el.type === 'physical_sheet') || elements[0];

    if (firstSheet) {
        focusPhysicalSheet(firstSheet.id, true);
        showToastNotification(`Vista centrada en ${firstSheet.title || 'el lienzo'}`);
    } else {
        panX = 100;
        panY = 80;
        zoom = 1.0;
        updateWorldTransform();
        showToastNotification("Vista centrada en el origen");
    }
};

window.fitCanvasContent = function() {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet || !sheet.elements || sheet.elements.length === 0) {
        fitToLetterPage();
        return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    sheet.elements.forEach(el => {
        if (el.hidden) return;
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
    });

    if (minX === Infinity) {
        fitToLetterPage();
        return;
    }

    const isMobile = window.innerWidth < 768;
    const availW = Math.max(280, window.innerWidth - (isMobile ? 50 : 140));
    const availH = Math.max(280, window.innerHeight - 200);
    const contentWidth = Math.max(100, maxX - minX);
    const contentHeight = Math.max(100, maxY - minY);

    zoom = Math.max(0.1, Math.min(availW / contentWidth, availH / contentHeight, 1.5) * 0.95);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    panX = window.innerWidth / 2 - midX * zoom;
    panY = window.innerHeight / 2 - midY * zoom;

    updateWorldTransform();
    showToastNotification(`Ajustado al contenido (${Math.round(zoom * 100)}%)`);
};

window.setSheetGrid = function(style) {
    if (!['grid-dots', 'grid-lines', 'grid-blank'].includes(style)) style = 'grid-lines';
    const sheet = proyecto_actual ? proyecto_actual.sheets[activeSheetIndex] : null;
    if (!sheet) return;

    sheet.gridStyle = style;
    const viewport = document.getElementById('canvas-viewport');
    if (viewport) {
        viewport.className = style;
        updateWorldTransform();
    }

    const names = { 'grid-dots': 'Puntos', 'grid-lines': 'Cuadrícula', 'grid-blank': 'Limpio' };
    showToastNotification(`Fondo de Lienzo: ${names[style] || style}`);

    renderInspector();
    triggerAutoSave();
};

window.cycleGridStyle = function() {
    const styles = ['grid-lines', 'grid-dots', 'grid-blank'];
    const sheet = proyecto_actual ? proyecto_actual.sheets[activeSheetIndex] : null;
    if (!sheet) return;

    const currentIdx = styles.indexOf(sheet.gridStyle || 'grid-lines');
    const nextStyle = styles[(currentIdx + 1) % styles.length];

    setSheetGrid(nextStyle);
};

window.toggleSnapToGrid = function() {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    sheet.snapToGrid = !sheet.snapToGrid;

    const btn = document.getElementById('btn-snap-grid');
    if (btn) {
        btn.classList.toggle('active', sheet.snapToGrid);
    }
    showToastNotification(sheet.snapToGrid ? "Ajuste Magnético Activado" : "Ajuste Magnético Desactivado");
};

function snapCoord(val, gridSize = 16) {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (sheet && sheet.snapToGrid) {
        return Math.round(val / gridSize) * gridSize;
    }
    return val;
}

// =========================================================
// 4.5. REGLAS GRADUADAS Y MARCADORES DE MEDIDA (PX, CM, MM) - HiDPI 120 FPS
// =========================================================
let lastRulerWidthTop = 0;
let lastRulerHeightTop = 0;
let lastRulerWidthLeft = 0;
let lastRulerHeightLeft = 0;

function syncRulerCanvasBuffers() {
    if (!showRulers) return;
    const topCanvas = document.getElementById('canvas-ruler-top');
    const leftCanvas = document.getElementById('canvas-ruler-left');
    if (!topCanvas || !leftCanvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const topWidth = Math.max(100, window.innerWidth - 28);
    const topHeight = 24;
    const leftWidth = 28;
    const leftHeight = Math.max(100, window.innerHeight - 24);

    const targetTopW = Math.floor(topWidth * dpr);
    const targetTopH = Math.floor(topHeight * dpr);
    const targetLeftW = Math.floor(leftWidth * dpr);
    const targetLeftH = Math.floor(leftHeight * dpr);

    if (topCanvas.width !== targetTopW || topCanvas.height !== targetTopH) {
        topCanvas.width = targetTopW;
        topCanvas.height = targetTopH;
        lastRulerWidthTop = topWidth;
        lastRulerHeightTop = topHeight;
    }
    if (leftCanvas.width !== targetLeftW || leftCanvas.height !== targetLeftH) {
        leftCanvas.width = targetLeftW;
        leftCanvas.height = targetLeftH;
        lastRulerWidthLeft = leftWidth;
        lastRulerHeightLeft = leftHeight;
    }
}

function initRulers() {
    let rulerResizeTimer = null;
    window.addEventListener('resize', () => {
        if (rulerResizeTimer) clearTimeout(rulerResizeTimer);
        rulerResizeTimer = setTimeout(() => {
            syncRulerCanvasBuffers();
            if (showRulers) updateRulers();
        }, 100);
    });
    const cornerBtn = document.getElementById('ruler-corner-unit');
    if (cornerBtn) cornerBtn.textContent = rulerUnit;
    syncRulerCanvasBuffers();
    updateRulers();
}

window.cycleRulerUnit = function() {
    const units = ['px', 'cm', 'mm'];
    const currentIdx = units.indexOf(rulerUnit);
    rulerUnit = units[(currentIdx + 1) % units.length];
    
    const btn = document.getElementById('ruler-corner-unit');
    if (btn) btn.textContent = rulerUnit;
    
    updateRulers();
    showToastNotification(`Unidad de medida: ${rulerUnit.toUpperCase()}`);
};

window.toggleRulersVisibility = function() {
    showRulers = !showRulers;
    const container = document.getElementById('ruler-container');
    const btn = document.getElementById('btn-toggle-rulers');
    if (container) container.classList.toggle('hidden', !showRulers);
    if (btn) {
        btn.classList.toggle('active', showRulers);
        btn.classList.toggle('text-amber-500', showRulers);
    }
    if (showRulers) {
        syncRulerCanvasBuffers();
        updateRulers();
    }
    showToastNotification(showRulers ? "Reglas Graduadas Visibles" : "Reglas Graduadas Ocultas");
};

function updateRulers() {
    if (!showRulers) return;
    if (typeof window.scheduleViewportUpdate === 'function') {
        window.scheduleViewportUpdate({ rulers: true });
    } else {
        renderRulersDirect();
    }
}

function renderRulersDirect() {
    if (!showRulers) return;
    const topCanvas = document.getElementById('canvas-ruler-top');
    const leftCanvas = document.getElementById('canvas-ruler-left');
    if (!topCanvas || !leftCanvas) return;

    syncRulerCanvasBuffers();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const topWidth = lastRulerWidthTop || Math.max(100, window.innerWidth - 28);
    const topHeight = 24;
    const leftWidth = 28;
    const leftHeight = lastRulerHeightLeft || Math.max(100, window.innerHeight - 24);

    const ctxTop = topCanvas.getContext('2d');
    const ctxLeft = leftCanvas.getContext('2d');
    ctxTop.resetTransform();
    ctxTop.scale(dpr, dpr);
    ctxLeft.resetTransform();
    ctxLeft.scale(dpr, dpr);

    ctxTop.clearRect(0, 0, topWidth, topHeight);
    ctxLeft.clearRect(0, 0, leftWidth, leftHeight);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#a3a3a3' : '#737373';
    const tickColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.22)';
    const cursorColor = '#f59e0b';

    // Conversión de medidas (px por unidad en espacio de mundo)
    let pxPerUnit = 1;
    if (rulerUnit === 'cm') pxPerUnit = 37.79527559;
    else if (rulerUnit === 'mm') pxPerUnit = 3.779527559;

    // Calcular paso óptimo de graduación según el zoom y la unidad
    const minPixelGap = 55;
    const worldGap = minPixelGap / (zoom * pxPerUnit);
    
    const magnitude = Math.pow(10, Math.floor(Math.log10(worldGap || 1)));
    const rel = worldGap / magnitude;
    let stepUnits = magnitude;
    if (rel > 5) stepUnits = 10 * magnitude;
    else if (rel > 2) stepUnits = 5 * magnitude;
    else if (rel > 1) stepUnits = 2 * magnitude;

    const stepWorldPx = stepUnits * pxPerUnit;
    if (!stepWorldPx || stepWorldPx <= 0 || !isFinite(stepWorldPx) || isNaN(stepWorldPx)) return;
    if (stepWorldPx * zoom < 6) return;

    // --- REGLA SUPERIOR (EJE X) ---
    ctxTop.fillStyle = textColor;
    ctxTop.strokeStyle = tickColor;
    ctxTop.lineWidth = 1;
    ctxTop.font = '8.5px "Plus Jakarta Sans", sans-serif';
    ctxTop.textAlign = 'left';
    ctxTop.textBaseline = 'top';

    const rulerOffsetX = 28;
    const startWorldX = (-panX + rulerOffsetX) / zoom;
    const endWorldX = (topWidth - panX + rulerOffsetX) / zoom;

    const firstTickX = Math.floor(startWorldX / stepWorldPx) * stepWorldPx;
    let maxIterX = 200;
    for (let wx = firstTickX; wx <= endWorldX && maxIterX-- > 0; wx += stepWorldPx) {
        const sx = wx * zoom + panX - rulerOffsetX;
        if (sx < 0 || sx > topWidth) continue;

        // Marca Principal
        ctxTop.beginPath();
        ctxTop.moveTo(sx + 0.5, topHeight);
        ctxTop.lineTo(sx + 0.5, topHeight - 11);
        ctxTop.stroke();

        // Marcas Secundarias
        const subDivs = 5;
        const subStep = stepWorldPx / subDivs;
        for (let i = 1; i < subDivs; i++) {
            const subSx = (wx + i * subStep) * zoom + panX - rulerOffsetX;
            if (subSx >= 0 && subSx <= topWidth) {
                ctxTop.beginPath();
                ctxTop.moveTo(subSx + 0.5, topHeight);
                ctxTop.lineTo(subSx + 0.5, topHeight - (i === Math.floor(subDivs/2) ? 6 : 3.5));
                ctxTop.stroke();
            }
        }

        // Texto numérico formateado
        let val = (wx / pxPerUnit);
        val = Math.abs(val) < 0.001 ? 0 : Math.round(val * 10) / 10;
        ctxTop.fillText(`${val}`, sx + 3, 3);
    }

    // Marcador de cursor en Top Ruler
    if (currentMouseScreenX >= rulerOffsetX) {
        const cursorTopX = currentMouseScreenX - rulerOffsetX;
        ctxTop.strokeStyle = cursorColor;
        ctxTop.lineWidth = 1.5;
        ctxTop.beginPath();
        ctxTop.moveTo(cursorTopX + 0.5, 0);
        ctxTop.lineTo(cursorTopX + 0.5, topHeight);
        ctxTop.stroke();
    }

    // --- REGLA LATERAL IZQUIERDA (EJE Y) ---
    ctxLeft.fillStyle = textColor;
    ctxLeft.strokeStyle = tickColor;
    ctxLeft.lineWidth = 1;
    ctxLeft.font = '8px "Plus Jakarta Sans", sans-serif';
    ctxLeft.textAlign = 'right';
    ctxLeft.textBaseline = 'middle';

    const rulerOffsetY = 24;
    const startWorldY = (-panY + rulerOffsetY) / zoom;
    const endWorldY = (leftHeight - panY + rulerOffsetY) / zoom;

    const firstTickY = Math.floor(startWorldY / stepWorldPx) * stepWorldPx;
    let maxIterY = 200;
    for (let wy = firstTickY; wy <= endWorldY && maxIterY-- > 0; wy += stepWorldPx) {
        const sy = wy * zoom + panY - rulerOffsetY;
        if (sy < 0 || sy > leftHeight) continue;

        // Marca Principal
        ctxLeft.beginPath();
        ctxLeft.moveTo(leftWidth, sy + 0.5);
        ctxLeft.lineTo(leftWidth - 11, sy + 0.5);
        ctxLeft.stroke();

        // Marcas Secundarias
        const subDivs = 5;
        const subStep = stepWorldPx / subDivs;
        for (let i = 1; i < subDivs; i++) {
            const subSy = (wy + i * subStep) * zoom + panY - rulerOffsetY;
            if (subSy >= 0 && subSy <= leftHeight) {
                ctxLeft.beginPath();
                ctxLeft.moveTo(leftWidth, subSy + 0.5);
                ctxLeft.lineTo(leftWidth - (i === Math.floor(subDivs/2) ? 6 : 3.5), subSy + 0.5);
                ctxLeft.stroke();
            }
        }

        // Texto numérico formateado
        let val = (wy / pxPerUnit);
        val = Math.abs(val) < 0.001 ? 0 : Math.round(val * 10) / 10;
        ctxLeft.fillText(`${val}`, leftWidth - 11, sy - 2);
    }

    // Marcador de cursor en Left Ruler
    if (currentMouseScreenY >= rulerOffsetY) {
        const cursorLeftY = currentMouseScreenY - rulerOffsetY;
        ctxLeft.strokeStyle = cursorColor;
        ctxLeft.lineWidth = 1.5;
        ctxLeft.beginPath();
        ctxLeft.moveTo(0, cursorLeftY + 0.5);
        ctxLeft.lineTo(leftWidth, cursorLeftY + 0.5);
        ctxLeft.stroke();
    }
}

// =========================================================
// 5. MOTOR DE HERRAMIENTAS & POPUPS
// =========================================================
window.setActiveTool = function(tool) {
    activeTool = tool;
    closeAllSubtools();

    // Actualizar botones del Dock
    document.querySelectorAll('.dock-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById(`tool-${tool}`);
    if (btn) btn.classList.add('active');

    const viewport = document.getElementById('canvas-viewport');
    if (!viewport) return;

    if (tool === 'hand') {
        viewport.style.cursor = 'grab';
    } else if (tool === 'brush') {
        viewport.style.cursor = 'crosshair';
    } else if (tool === 'select') {
        viewport.style.cursor = 'default';
    } else {
        viewport.style.cursor = 'crosshair';
    }
};

window.toggleSubtool = function(popoverId) {
    const popover = document.getElementById(popoverId);
    if (!popover) return;

    const isVisible = popover.style.display === 'flex';
    closeAllSubtools();

    if (!isVisible) {
        popover.style.display = 'flex';
    }
};

function closeAllSubtools() {
    document.querySelectorAll('.subtool-popover').forEach(p => p.style.display = 'none');
    const exportDrop = document.getElementById('export-dropdown');
    if (exportDrop) exportDrop.classList.add('hidden');
}

window.toggleExportMenu = function() {
    const drop = document.getElementById('export-dropdown');
    if (drop) drop.classList.toggle('hidden');
};

// =========================================================
// 6. INSERCIÓN DE ELEMENTOS (FORMAS, NOTAS, TEXTOS, TABLAS, UI)
// =========================================================
window.addShapeToCanvas = function(shapeType) {
    if (window.isAuditMode) return;
    closeAllSubtools();
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    const center = getViewportCenterWorld();

    const shape = {
        id: 'shape_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        type: 'shape',
        shapeType: shapeType,
        x: snapCoord(center.x - 70),
        y: snapCoord(center.y - 40),
        width: shapeType === 'circle' ? 90 : 150,
        height: shapeType === 'circle' ? 90 : 80,
        rotation: 0,
        text: getDefaultTextForShape(shapeType),
        fill: '#fef3c7',
        stroke: '#f59e0b',
        strokeWidth: 2,
        strokeStyle: 'solid',
        borderRadius: shapeType === 'rounded-rect' ? 16 : 4,
        opacity: 1,
        shadow: 'soft',
        fontSize: 12,
        fontFamily: 'Plus Jakarta Sans',
        textColor: '#78350f',
        textAlign: 'center',
        zIndex: highestZIndex++
    };

    sheet.elements.push(shape);
    renderElementDOM(shape);
    selectElement(shape.id);
    setActiveTool('select');
    if (window.LienzoCollabEngine) window.LienzoCollabEngine.broadcastElementAdd(shape);
    if (window.ViewModeController) window.ViewModeController.renderBackdrop();
    pushHistoryState();
    triggerAutoSave();
};

function getDefaultTextForShape(type) {
    switch (type) {
        case 'diamond': return '¿Cumple NIIF?';
        case 'cylinder': return 'Base de Datos';
        case 'cloud': return 'Nube / Servidor';
        case 'parallelogram': return 'Entrada / Salida';
        case 'hexagon': return 'Revisión Fiscal';
        case 'capsule': return 'Proceso Contable';
        case 'callout': return 'Nota de Auditoría';
        case 'triangle': return 'ADVERTENCIA';
        case 'star': return 'DESTACADO';
        default: return 'PROCESO';
    }
}

window.addPhysicalSheet = function(format = 'letter', customWidth = null, customHeight = null, customTitle = null) {
    if (window.isAuditMode) return;
    closeAllSubtools();
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    const sizes = {
        letter: { w: 816, h: 1056, title: 'Hoja Carta (21.6 × 27.9 cm)' },
        a4: { w: 794, h: 1123, title: 'Hoja A4 (21.0 × 29.7 cm)' },
        legal: { w: 816, h: 1344, title: 'Hoja Oficio (21.6 × 35.6 cm)' },
        tabloid: { w: 1056, h: 1632, title: 'Hoja Tabloide (27.9 × 43.2 cm)' },
        a3: { w: 1123, h: 1587, title: 'Hoja A3 (29.7 × 42.0 cm)' },
        a5: { w: 559, h: 794, title: 'Hoja A5 (14.8 × 21.0 cm)' },
        voucher: { w: 756, h: 321, title: 'Voucher Contable (20.0 × 8.5 cm)' },
        business_card: { w: 321, h: 208, title: 'Tarjeta (8.5 × 5.5 cm)' },
        slide_16_9: { w: 1280, h: 720, title: 'Diapositiva 16:9 (HD)' },
        slide_4_3: { w: 1024, h: 768, title: 'Diapositiva 4:3' }
    };

    let width = 816;
    let height = 1056;
    let title = 'Hoja Carta (21.6 × 27.9 cm)';
    const config = sizes[format];

    if (format === 'custom' && customWidth && customHeight) {
        width = parseInt(customWidth) || 800;
        height = parseInt(customHeight) || 600;
        const wCm = Math.round(width * 2.54 / 96 * 10) / 10;
        const hCm = Math.round(height * 2.54 / 96 * 10) / 10;
        title = customTitle || `Hoja Personalizada (${wCm} × ${hCm} cm)`;
    } else if (config) {
        width = config.w;
        height = config.h;
        title = config.title;
        if (sheetPresetOrientation === 'landscape') {
            width = config.h;
            height = config.w;
        }
    }

    // Posicionamiento inteligente: evitar superponer hojas encima de las existentes
    const existingSheets = (sheet.elements || []).filter(el => el.type === 'physical_sheet');
    let targetX = 100;
    let targetY = 80;

    if (existingSheets.length === 0) {
        const center = getViewportCenterWorld();
        targetX = snapCoord(center.x - width / 2);
        targetY = snapCoord(Math.max(60, center.y - height / 2));
    } else {
        let maxRight = -Infinity;
        let referenceY = existingSheets[0].y;
        existingSheets.forEach(s => {
            const right = s.x + s.width;
            if (right > maxRight) maxRight = right;
        });
        targetX = snapCoord(maxRight + 60); // 60px de margen entre hojas adyacentes
        targetY = snapCoord(referenceY || 80);
    }

    const sheetNumber = existingSheets.length + 1;
    let baseFormatName = 'Carta';
    if (format === 'custom' && customTitle) {
        baseFormatName = customTitle.replace(/^Hoja\s*\d*\s*[:•\-]?\s*/i, '').trim();
    } else if (config) {
        baseFormatName = config.title.split(' (')[0].replace(/^Hoja\s+/i, '').trim();
    }
    const cleanTitle = `Hoja ${sheetNumber}: ${baseFormatName}`;

    const newSheetElem = {
        id: 'artboard_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        type: 'physical_sheet',
        format: format,
        orientation: sheetPresetOrientation,
        x: targetX,
        y: targetY,
        width: width,
        height: height,
        title: cleanTitle,
        zIndex: 1, // Fondo de elementos
        isLocked: false
    };

    sheet.elements.unshift(newSheetElem);
    renderElementDOM(newSheetElem);
    selectElement(newSheetElem.id);
    setActiveTool('select');
    
    // Enfocar suavemente la nueva hoja
    focusPhysicalSheet(newSheetElem.id, false);

    if (window.LienzoCollabEngine) window.LienzoCollabEngine.broadcastElementAdd(newSheetElem);
    renderSheetNavigator();
    pushHistoryState();
    triggerAutoSave();
    showToastNotification(`Se insertó ${cleanTitle}`);
};

window.duplicatePhysicalSheet = function(id) {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    const sourceSheet = sheet.elements.find(el => el.id === id);
    if (!sourceSheet || sourceSheet.type !== 'physical_sheet') return;

    // Detectar elementos contenidos dentro de los límites de la hoja
    const containedElements = (sheet.elements || []).filter(el => {
        if (el.id === sourceSheet.id || el.type === 'physical_sheet') return false;
        return (
            el.x >= sourceSheet.x - 10 &&
            el.y >= sourceSheet.y - 10 &&
            el.x + (el.width || 0) <= sourceSheet.x + sourceSheet.width + 10 &&
            el.y + (el.height || 0) <= sourceSheet.y + sourceSheet.height + 10
        );
    });

    // Colocar la hoja duplicada a la derecha de todas las hojas existentes para evitar superposiciones
    const existingSheets = (sheet.elements || []).filter(el => el.type === 'physical_sheet');
    let maxRight = sourceSheet.x + sourceSheet.width;
    existingSheets.forEach(s => {
        if (s.x + s.width > maxRight) maxRight = s.x + s.width;
    });

    const newX = snapCoord(maxRight + 60);
    const newY = snapCoord(sourceSheet.y);
    const deltaX = newX - sourceSheet.x;
    const deltaY = newY - sourceSheet.y;

    const newSheetNumber = existingSheets.length + 1;

    // Limpiar el nombre base sin acumular "Copia de" infinitamente
    let baseName = sourceSheet.title || 'Carta';
    baseName = baseName.replace(/^Hoja\s*\d*\s*[:•\-]?\s*/i, '').trim();
    baseName = baseName.replace(/(\s*Copia\s*(de\s*)?)+/gi, '').trim();
    baseName = baseName.replace(/\s*\(\s*\d+[\d.,]*\s*×\s*\d+[\d.,]*\s*cm\s*\)/gi, '').trim();
    if (!baseName) baseName = sourceSheet.format ? sourceSheet.format.toUpperCase() : 'Carta';

    const clonedSheet = JSON.parse(JSON.stringify(sourceSheet));
    clonedSheet.id = 'artboard_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    clonedSheet.x = newX;
    clonedSheet.y = newY;
    clonedSheet.title = `Hoja ${newSheetNumber}: ${baseName}`;
    clonedSheet.zIndex = 1;

    sheet.elements.unshift(clonedSheet);
    renderElementDOM(clonedSheet);

    // Clonar elementos hijos
    containedElements.forEach(elem => {
        const clonedElem = JSON.parse(JSON.stringify(elem));
        clonedElem.id = (elem.type || 'el') + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        clonedElem.x = snapCoord(elem.x + deltaX);
        clonedElem.y = snapCoord(elem.y + deltaY);
        clonedElem.zIndex = ++highestZIndex;
        sheet.elements.push(clonedElem);
        renderElementDOM(clonedElem);
    });

    selectElement(clonedSheet.id);
    focusPhysicalSheet(clonedSheet.id, false);
    renderSheetNavigator();
    pushHistoryState();
    triggerAutoSave();
    showToastNotification(`Hoja duplicada con éxito (${containedElements.length} elementos copiados)`);
};

window.deletePhysicalSheet = function(id) {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    const targetSheet = sheet.elements.find(el => el.id === id);
    if (!targetSheet) return;

    if (!confirm(`¿Deseas eliminar la hoja "${targetSheet.title || 'Hoja'}"? (Los elementos dentro de ella se conservarán en el lienzo)`)) {
        return;
    }

    deleteElement(id);
    renderSheetNavigator();
    showToastNotification("Hoja eliminada");
};

window.focusPhysicalSheet = function(id, smooth = true) {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    const targetSheet = sheet.elements.find(el => el.id === id);
    if (!targetSheet) return;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const padding = 80;

    const zoomX = (viewportW - padding * 2) / targetSheet.width;
    const zoomY = (viewportH - padding * 2 - 100) / targetSheet.height;
    const targetZoom = Math.max(0.2, Math.min(1.2, Math.min(zoomX, zoomY)));

    const targetPanX = (viewportW - targetSheet.width * targetZoom) / 2 - targetSheet.x * targetZoom;
    const targetPanY = (viewportH - targetSheet.height * targetZoom) / 2 - targetSheet.y * targetZoom + 30;

    panX = targetPanX;
    panY = targetPanY;
    zoom = targetZoom;
    updateWorldTransform();
    selectElement(id);
};

window.autoArrangeSheets = function() {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    const sheets = (sheet.elements || []).filter(el => el.type === 'physical_sheet');
    if (sheets.length === 0) {
        showToastNotification("No hay hojas físicas en el lienzo para organizar");
        return;
    }

    // Ordenar de izquierda a derecha según posición actual
    sheets.sort((a, b) => a.x - b.x);

    let startX = 100;
    const startY = 80;
    const gap = 60;

    sheets.forEach(s => {
        const deltaX = startX - s.x;
        const deltaY = startY - s.y;

        // Mover todos los elementos contenidos dentro de esta hoja
        const childElems = (sheet.elements || []).filter(el => {
            if (el.id === s.id || el.type === 'physical_sheet') return false;
            return (
                el.x >= s.x - 10 &&
                el.y >= s.y - 10 &&
                el.x + (el.width || 0) <= s.x + s.width + 10 &&
                el.y + (el.height || 0) <= s.y + s.height + 10
            );
        });

        s.x = startX;
        s.y = startY;

        childElems.forEach(child => {
            child.x += deltaX;
            child.y += deltaY;
        });

        startX += s.width + gap;
    });

    renderAllElements();
    renderTransformBox();
    renderSheetNavigator();
    pushHistoryState();
    triggerAutoSave();
    showToastNotification(`✨ ${sheets.length} hojas organizadas en fila limpia`);
};

function renderSheetNavigator() {
    const sheet = proyecto_actual ? proyecto_actual.sheets[activeSheetIndex] : null;
    if (!sheet) return;

    const physicalSheets = (sheet.elements || []).filter(el => el.type === 'physical_sheet');
    
    // Actualizar badge en la barra superior
    const badgeCount = document.getElementById('sheet-count-badge');
    if (badgeCount) {
        badgeCount.innerText = `Hojas (${physicalSheets.length})`;
    }

    // Actualizar lista en el popover
    const container = document.getElementById('sheet-navigator-list');
    if (container) {
        if (physicalSheets.length === 0) {
            container.innerHTML = `
                <div class="p-3 text-center text-[10px] text-slate-400 italic">
                    No hay hojas físicas en el lienzo.<br>Inserta una arriba.
                </div>
            `;
        } else {
            container.innerHTML = physicalSheets.map((s, idx) => `
                <div class="flex items-center justify-between p-2 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 hover:bg-amber-500/15 transition-colors text-xs ${selectedElementIds.has(s.id) ? 'border border-amber-500' : ''}">
                    <div class="flex items-center gap-2 cursor-pointer flex-1 min-w-0" onclick="focusPhysicalSheet('${s.id}')">
                        <i class="fas fa-file-invoice text-amber-500 text-xs shrink-0"></i>
                        <div class="truncate">
                            <div class="font-bold text-[11px] text-slate-700 dark:text-slate-200 truncate">${s.title || `Hoja ${idx + 1}`}</div>
                            <div class="text-[9px] text-slate-400 tabular-nums font-medium">${Math.round(s.width * 2.54 / 96 * 10) / 10} × ${Math.round(s.height * 2.54 / 96 * 10) / 10} cm</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 shrink-0 ml-2">
                        <button onclick="event.stopPropagation(); focusPhysicalSheet('${s.id}')" class="w-6 h-6 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-white flex items-center justify-center text-[10px]" title="Enfocar"><i class="fas fa-search-plus"></i></button>
                        <button onclick="event.stopPropagation(); duplicatePhysicalSheet('${s.id}')" class="w-6 h-6 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-white flex items-center justify-center text-[10px]" title="Duplicar"><i class="fas fa-copy"></i></button>
                        <button onclick="event.stopPropagation(); deletePhysicalSheet('${s.id}')" class="w-6 h-6 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center text-[10px]" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// --- Helpers para Modal de Hoja Personalizada ---
let customModalOrient = 'portrait';

window.openCustomSheetModal = function() {
    if (window.isAuditMode) return;
    closeAllSubtools();
    const modal = document.getElementById('custom-sheet-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        const titleInput = document.getElementById('custom-sheet-title');
        if (titleInput) {
            const sheet = proyecto_actual.sheets[activeSheetIndex];
            const count = (sheet.elements || []).filter(el => el.type === 'physical_sheet').length + 1;
            titleInput.value = `Hoja ${count}: Personalizada`;
        }
    }
};

window.closeCustomSheetModal = function() {
    const modal = document.getElementById('custom-sheet-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
};

window.convertCustomCmToPx = function() {
    const wCm = parseFloat(document.getElementById('custom-sheet-w-cm').value) || 0;
    const hCm = parseFloat(document.getElementById('custom-sheet-h-cm').value) || 0;
    document.getElementById('custom-sheet-w-px').value = Math.round(wCm * 96 / 2.54);
    document.getElementById('custom-sheet-h-px').value = Math.round(hCm * 96 / 2.54);
};

window.convertCustomPxToCm = function() {
    const wPx = parseFloat(document.getElementById('custom-sheet-w-px').value) || 0;
    const hPx = parseFloat(document.getElementById('custom-sheet-h-px').value) || 0;
    document.getElementById('custom-sheet-w-cm').value = (Math.round((wPx * 2.54 / 96) * 10) / 10).toFixed(1);
    document.getElementById('custom-sheet-h-cm').value = (Math.round((hPx * 2.54 / 96) * 10) / 10).toFixed(1);
};

window.setCustomModalOrientation = function(orient) {
    customModalOrient = orient;
    const btnP = document.getElementById('btn-custom-orient-p');
    const btnL = document.getElementById('btn-custom-orient-l');
    if (btnP && btnL) {
        btnP.className = `py-2 px-3 rounded-xl text-xs font-bold ${orient === 'portrait' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'} flex items-center justify-center gap-1.5`;
        btnL.className = `py-2 px-3 rounded-xl text-xs font-bold ${orient === 'landscape' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'} flex items-center justify-center gap-1.5`;
    }

    const wPx = parseInt(document.getElementById('custom-sheet-w-px').value) || 816;
    const hPx = parseInt(document.getElementById('custom-sheet-h-px').value) || 1056;
    if ((orient === 'landscape' && wPx < hPx) || (orient === 'portrait' && wPx > hPx)) {
        document.getElementById('custom-sheet-w-px').value = hPx;
        document.getElementById('custom-sheet-h-px').value = wPx;
        convertCustomPxToCm();
    }
};

window.saveCustomSheet = function() {
    if (window.isAuditMode) return;
    const titleInput = document.getElementById('custom-sheet-title');
    const title = titleInput ? titleInput.value.trim() : 'Hoja Personalizada';
    const wPx = parseInt(document.getElementById('custom-sheet-w-px').value) || 800;
    const hPx = parseInt(document.getElementById('custom-sheet-h-px').value) || 600;

    sheetPresetOrientation = customModalOrient;
    addPhysicalSheet('custom', wPx, hPx, title);
    closeCustomSheetModal();
};

window.setSheetPresetOrientation = function(orient) {
    sheetPresetOrientation = orient;
    const btnP = document.getElementById('btn-preset-portrait');
    const btnL = document.getElementById('btn-preset-landscape');
    if (btnP && btnL) {
        btnP.className = `px-2 py-0.5 rounded-md text-[9px] font-bold ${orient === 'portrait' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`;
        btnL.className = `px-2 py-0.5 rounded-md text-[9px] font-bold ${orient === 'landscape' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`;
    }
};

window.addTAccount = function(title) {
    if (window.isAuditMode) return;
    closeAllSubtools();
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    const center = getViewportCenterWorld();
    const newTAcc = {
        id: 'tacc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        type: 't_account',
        x: snapCoord(center.x - 140),
        y: snapCoord(center.y - 110),
        width: 280,
        height: 220,
        title: title || '1101 Efectivo y Equivalentes',
        debeEntries: [
            { text: 'Saldo Inicial', amount: 5000 },
            { text: 'Cobro Factura #102', amount: 1450 }
        ],
        haberEntries: [
            { text: 'Pago Proveedor #33', amount: 950 },
            { text: 'Alquiler Local', amount: 400 }
        ],
        zIndex: highestZIndex++
    };

    sheet.elements.push(newTAcc);
    renderElementDOM(newTAcc);
    selectElement(newTAcc.id);
    setActiveTool('select');
    if (window.LienzoCollabEngine) window.LienzoCollabEngine.broadcastElementAdd(newTAcc);
    pushHistoryState();
    triggerAutoSave();
};

window.addStickyNote = function(color = '#fef08a') {
    if (window.isAuditMode) return;
    closeAllSubtools();
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    const center = getViewportCenterWorld();

    const note = {
        id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        type: 'note',
        x: snapCoord(center.x - 80),
        y: snapCoord(center.y - 70),
        width: 170,
        height: 150,
        rotation: (Math.random() * 4 - 2), // Ligera inclinación natural
        text: 'Escribe tu nota aquí...',
        color: color,
        hasPin: true,
        fontSize: 12,
        textColor: '#78350f',
        zIndex: highestZIndex++
    };

    sheet.elements.push(note);
    renderElementDOM(note);
    selectElement(note.id);
    setActiveTool('select');
    if (window.LienzoCollabEngine) window.LienzoCollabEngine.broadcastElementAdd(note);
    if (window.ViewModeController) window.ViewModeController.renderBackdrop();
    pushHistoryState();
    triggerAutoSave();
};

window.addTextBlock = function() {
    if (window.isAuditMode) return;
    closeAllSubtools();
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    const center = getViewportCenterWorld();

    const textElem = {
        id: 'text_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        type: 'text',
        x: snapCoord(center.x - 100),
        y: snapCoord(center.y - 25),
        width: 240,
        height: 50,
        rotation: 0,
        text: 'Escribe tu texto libre...',
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Plus Jakarta Sans',
        textColor: '#1e293b',
        fill: 'transparent',
        textAlign: 'left',
        zIndex: highestZIndex++
    };

    sheet.elements.push(textElem);
    renderElementDOM(textElem);
    selectElement(textElem.id);
    setActiveTool('select');
    if (window.LienzoCollabEngine) window.LienzoCollabEngine.broadcastElementAdd(textElem);
    if (window.ViewModeController) window.ViewModeController.renderBackdrop();
    pushHistoryState();
    triggerAutoSave();
};

window.addTableBlock = function() {
    if (window.isAuditMode) return;
    closeAllSubtools();
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    const center = getViewportCenterWorld();

    const tableElem = {
        id: 'table_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        type: 'table',
        x: snapCoord(center.x - 160),
        y: snapCoord(center.y - 80),
        width: 320,
        height: 160,
        rotation: 0,
        title: 'CUENTA: CAJA GENERAL',
        headers: ['Debe (Cargos)', 'Haber (Abonos)'],
        rows: [
            ['$2,500.00', '$450.00'],
            ['$1,200.00', '$320.00'],
            ['$3,700.00 (Total)', '$770.00 (Total)']
        ],
        fill: '#ffffff',
        zIndex: highestZIndex++
    };

    sheet.elements.push(tableElem);
    renderElementDOM(tableElem);
    selectElement(tableElem.id);
    setActiveTool('select');
    if (window.LienzoCollabEngine) window.LienzoCollabEngine.broadcastElementAdd(tableElem);
    if (window.ViewModeController) window.ViewModeController.renderBackdrop();
    pushHistoryState();
    triggerAutoSave();
};

window.addUIComponent = function(uiType) {
    if (window.isAuditMode) return;
    closeAllSubtools();
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    const center = getViewportCenterWorld();

    let elem = {
        id: 'ui_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        type: 'ui',
        uiType: uiType,
        x: snapCoord(center.x - 90),
        y: snapCoord(center.y - 45),
        width: 190,
        height: 90,
        rotation: 0,
        zIndex: highestZIndex++
    };

    if (uiType === 'kpi-card') {
        elem.title = 'Inventario Valorizado';
        elem.value = '$18,420.50';
        elem.badgeText = 'NIIF Pymes';
        elem.badgeType = 'amber';
        elem.width = 200;
        elem.height = 100;
    } else if (uiType === 'button') {
        elem.text = 'Generar Balance';
        elem.width = 150;
        elem.height = 42;
    } else if (uiType === 'input-box') {
        elem.label = 'Código de Cuenta';
        elem.placeholder = '1101-01 Caja General';
        elem.width = 180;
        elem.height = 60;
    } else if (uiType === 'badge') {
        elem.text = 'AUDITADO CON ÉXITO';
        elem.width = 140;
        elem.height = 32;
    }

    sheet.elements.push(elem);
    renderElementDOM(elem);
    selectElement(elem.id);
    setActiveTool('select');
    if (window.LienzoCollabEngine) window.LienzoCollabEngine.broadcastElementAdd(elem);
    if (window.ViewModeController) window.ViewModeController.renderBackdrop();
    pushHistoryState();
    triggerAutoSave();
};

window.handleImageUpload = function(event) {
    if (window.isAuditMode) return;
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const sheet = proyecto_actual.sheets[activeSheetIndex];
        const center = getViewportCenterWorld();

        const imgElem = {
            id: 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
            type: 'image',
            src: e.target.result,
            x: snapCoord(center.x - 120),
            y: snapCoord(center.y - 90),
            width: 240,
            height: 180,
            rotation: 0,
            borderRadius: 12,
            shadow: 'soft',
            opacity: 1,
            zIndex: highestZIndex++
        };

        sheet.elements.push(imgElem);
        renderElementDOM(imgElem);
        selectElement(imgElem.id);
        setActiveTool('select');
        if (window.LienzoCollabEngine) window.LienzoCollabEngine.broadcastElementAdd(imgElem);
        if (window.ViewModeController) window.ViewModeController.renderBackdrop();
        pushHistoryState();
        triggerAutoSave();
    };
    reader.readAsDataURL(file);
    event.target.value = '';
};

window.addConnectorToCanvas = function(type) {
    if (window.isAuditMode) return;
    closeAllSubtools();
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    const center = getViewportCenterWorld();

    const conn = {
        id: 'conn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        type: 'connector',
        connType: type,
        startX: snapCoord(center.x - 80),
        startY: snapCoord(center.y),
        endX: snapCoord(center.x + 80),
        endY: snapCoord(center.y),
        stroke: '#f59e0b',
        strokeWidth: 2.5,
        strokeStyle: 'solid',
        markerEnd: type.includes('arrow') ? 'arrowhead-amber' : ''
    };

    if (!sheet.connectors) sheet.connectors = [];
    sheet.connectors.push(conn);
    renderAllSVG();
    pushHistoryState();
    triggerAutoSave();
};

function getViewportCenterWorld() {
    const viewport = document.getElementById('canvas-viewport');
    const w = viewport ? viewport.clientWidth : 800;
    const h = viewport ? viewport.clientHeight : 600;
    return screenToWorld(w / 2, h / 2);
}

// =========================================================
// 7. RENDERIZADOR DE ELEMENTOS DOM
// =========================================================
function renderAllElements() {
    const layer = document.getElementById('canvas-dom-layer');
    if (!layer) return;
    layer.innerHTML = '';

    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet || !sheet.elements) return;

    sheet.elements.forEach(el => renderElementDOM(el));
    renderTransformBox();
    renderLayersList();
}

function renderElementDOM(el) {
    const layer = document.getElementById('canvas-dom-layer');
    if (!layer) return;

    let domEl = document.getElementById(el.id);
    if (!domEl) {
        domEl = document.createElement('div');
        domEl.id = el.id;
        layer.appendChild(domEl);
    }

    domEl.className = `canvas-element ${selectedElementIds.has(el.id) ? (selectedElementIds.size > 1 ? 'multi-selected' : 'selected') : ''} ${el.isLocked ? 'locked' : ''}`;
    domEl.style.left = `${el.x}px`;
    domEl.style.top = `${el.y}px`;
    domEl.style.width = `${el.width}px`;
    domEl.style.height = `${el.height}px`;
    domEl.style.transform = `rotate(${el.rotation || 0}deg)`;
    domEl.style.zIndex = el.zIndex || 10;
    domEl.style.opacity = el.opacity !== undefined ? el.opacity : 1;

    // Renderizado según tipo
    if (el.type === 'shape') {
        renderShapeHTML(domEl, el);
    } else if (el.type === 'note') {
        renderNoteHTML(domEl, el);
    } else if (el.type === 'text') {
        renderTextHTML(domEl, el);
    } else if (el.type === 'table') {
        renderTableHTML(domEl, el);
    } else if (el.type === 'ui') {
        renderUIHTML(domEl, el);
    } else if (el.type === 'image') {
        renderImageHTML(domEl, el);
    } else if (el.type === 'physical_sheet') {
        renderPhysicalSheetHTML(domEl, el);
    } else if (el.type === 't_account') {
        renderTAccountHTML(domEl, el);
    }

    // Eventos de selección y arrastre
    attachElementEvents(domEl, el);
}

function renderPhysicalSheetHTML(domEl, el) {
    domEl.className = `canvas-element physical-sheet-card ${selectedElementIds.has(el.id) ? 'selected' : ''} ${el.isLocked ? 'locked' : ''}`;
    
    const formatLabels = {
        letter: 'Carta',
        a4: 'A4',
        legal: 'Oficio',
        tabloid: 'Tabloide',
        a3: 'A3',
        a5: 'A5',
        voucher: 'Voucher',
        business_card: 'Tarjeta',
        slide_16_9: 'Slide 16:9',
        slide_4_3: 'Slide 4:3',
        custom: 'Personalizada'
    };
    const formatName = formatLabels[el.format] || 'Hoja';
    const wCm = Math.round((el.width * 2.54 / 96) * 10) / 10;
    const hCm = Math.round((el.height * 2.54 / 96) * 10) / 10;

    // Limpieza de título visible para que sea conciso
    let displayTitle = el.title || `Hoja: ${formatName}`;
    displayTitle = displayTitle.replace(/\s*\(\s*\d+[\d.,]*\s*×\s*\d+[\d.,]*\s*cm\s*\)/gi, '').trim();

    domEl.innerHTML = `
        <div class="sheet-header-badge pointer-events-auto cursor-pointer" title="Doble clic para renombrar hoja">
            <i class="fas fa-file-invoice text-amber-500 shrink-0 text-[11px]"></i>
            <span class="sheet-title-text font-black">${escapeHtml(displayTitle)}</span>
            <span class="sheet-dim-tag shrink-0 tabular-nums font-medium">(${wCm} × ${hCm} cm • ${el.orientation === 'landscape' ? 'H' : 'V'})</span>
            
            <div class="sheet-badge-actions shrink-0">
                <button type="button" class="sheet-badge-btn" onclick="event.stopPropagation(); duplicatePhysicalSheet('${escapeHtml(el.id)}')" title="Duplicar hoja con contenido">
                    <i class="fas fa-copy"></i>
                </button>
                <button type="button" class="sheet-badge-btn" onclick="event.stopPropagation(); setPhysicalSheetOrientation('${escapeHtml(el.id)}', '${el.orientation === 'landscape' ? 'portrait' : 'landscape'}')" title="Girar orientación">
                    <i class="fas fa-rotate"></i>
                </button>
                <button type="button" class="sheet-badge-btn" onclick="event.stopPropagation(); focusPhysicalSheet('${escapeHtml(el.id)}')" title="Enfocar esta hoja">
                    <i class="fas fa-expand"></i>
                </button>
                <button type="button" class="sheet-badge-btn danger" onclick="event.stopPropagation(); deletePhysicalSheet('${escapeHtml(el.id)}')" title="Eliminar hoja">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
        <div class="sheet-margin-guide"></div>
        <div class="w-full h-full p-6 relative overflow-hidden flex flex-col justify-between pointer-events-none select-none opacity-40">
            <div class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex justify-between">
                <span>${escapeHtml(formatName)}</span>
                <span>EduConta SV</span>
            </div>
            <div class="text-[8px] tabular-nums text-slate-400 text-right">
                ${el.width} × ${el.height} px (${wCm} × ${hCm} cm)
            </div>
        </div>
    `;
}

function renderTAccountHTML(domEl, el) {
    domEl.className = `canvas-element t-account-card ${selectedElementIds.has(el.id) ? 'selected' : ''} ${el.isLocked ? 'locked' : ''}`;

    const debeTotal = (el.debeEntries || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const haberTotal = (el.haberEntries || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const balance = Math.abs(debeTotal - haberTotal);
    const balanceType = debeTotal >= haberTotal ? 'Saldo Deudor' : 'Saldo Acreedor';

    let debeRows = (el.debeEntries || []).map((item, idx) => `
        <div class="t-account-entry">
            <span class="truncate max-w-[90px]">${escapeHtml(item.text || `Cargo #${idx+1}`)}</span>
            <span class="font-bold">$${(parseFloat(item.amount) || 0).toFixed(2)}</span>
        </div>
    `).join('');

    let haberRows = (el.haberEntries || []).map((item, idx) => `
        <div class="t-account-entry">
            <span class="truncate max-w-[90px]">${escapeHtml(item.text || `Abono #${idx+1}`)}</span>
            <span class="font-bold">$${(parseFloat(item.amount) || 0).toFixed(2)}</span>
        </div>
    `).join('');

    domEl.innerHTML = `
        <div class="t-account-header truncate" title="Doble clic para editar cuenta">
            ${escapeHtml(el.title || '1101 Cuenta de Mayor')}
        </div>
        <div class="t-account-body">
            <div class="t-account-debe">
                <div class="t-account-col-title">DEBE (CARGOS)</div>
                <div class="space-y-0.5 flex-1 overflow-y-auto max-h-[140px]">${debeRows || '<span class="text-[9px] text-slate-400 italic text-center py-2">Sin cargos</span>'}</div>
                <div class="border-t border-slate-300 dark:border-slate-700 pt-1 mt-1 font-bold text-[9.5px] flex justify-between tabular-nums">
                    <span>SUMA:</span>
                    <span>$${debeTotal.toFixed(2)}</span>
                </div>
            </div>
            <div class="t-account-haber">
                <div class="t-account-col-title">HABER (ABONOS)</div>
                <div class="space-y-0.5 flex-1 overflow-y-auto max-h-[140px]">${haberRows || '<span class="text-[9px] text-slate-400 italic text-center py-2">Sin abonos</span>'}</div>
                <div class="border-t border-slate-300 dark:border-slate-700 pt-1 mt-1 font-bold text-[9.5px] flex justify-between tabular-nums">
                    <span>SUMA:</span>
                    <span>$${haberTotal.toFixed(2)}</span>
                </div>
            </div>
        </div>
        <div class="t-account-footer">
            <span class="text-[9px] uppercase tracking-wider">${balanceType}:</span>
            <span class="text-amber-600 dark:text-amber-400 tabular-nums font-black">$${balance.toFixed(2)}</span>
        </div>
    `;
}

function renderShapeHTML(domEl, el) {
    let borderRadius = `${el.borderRadius || 4}px`;
    if (el.shapeType === 'circle') borderRadius = '50%';
    if (el.shapeType === 'capsule') borderRadius = '9999px';

    let borderStyle = el.strokeStyle || 'solid';
    let borderWidth = `${el.strokeWidth || 2}px`;
    let borderColor = el.stroke || '#f59e0b';
    let bg = el.fill || '#fef3c7';

    // Formas especiales con clip-path SVG
    let clipPath = 'none';
    if (el.shapeType === 'diamond') {
        clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    } else if (el.shapeType === 'triangle') {
        clipPath = 'polygon(50% 0%, 100% 100%, 0% 100%)';
    } else if (el.shapeType === 'star') {
        clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
    } else if (el.shapeType === 'hexagon') {
        clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
    } else if (el.shapeType === 'parallelogram') {
        clipPath = 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)';
    }

    domEl.style.backgroundColor = bg;
    domEl.style.border = clipPath === 'none' ? `${borderWidth} ${borderStyle} ${borderColor}` : 'none';
    domEl.style.borderRadius = borderRadius;
    domEl.style.clipPath = clipPath;
    domEl.style.display = 'flex';
    domEl.style.alignItems = 'center';
    domEl.style.justifyContent = 'center';
    domEl.style.padding = '8px';
    domEl.style.boxShadow = el.shadow === 'soft' ? '0 8px 16px -4px rgba(0,0,0,0.08)' : 'none';

    if (el.shapeType === 'cylinder') {
        domEl.innerHTML = `
            <div class="w-full h-full flex flex-col justify-between border-2 border-amber-500 rounded-2xl relative overflow-hidden p-2" style="background: ${escapeHtml(bg)};">
                <div class="h-3.5 border-b-2 border-amber-500 rounded-full bg-amber-500/20 -mx-2 -mt-2"></div>
                <div class="shape-text w-full text-center outline-none select-none font-bold cursor-move"
                     style="font-size: ${parseInt(el.fontSize) || 12}px; font-family: ${escapeHtml(el.fontFamily || 'Plus Jakarta Sans')}; color: ${escapeHtml(el.textColor || '#78350f')};">
                    ${escapeHtml(el.text || 'Base de Datos')}
                </div>
                <div class="h-3 border-t-2 border-amber-500 rounded-full bg-amber-500/10 -mx-2 -mb-2"></div>
            </div>
        `;
    } else if (el.shapeType === 'callout') {
        domEl.innerHTML = `
            <div class="w-full h-full flex items-center justify-center p-2 relative rounded-2xl border-2 border-amber-500" style="background: ${escapeHtml(bg)};">
                <div class="shape-text w-full text-center outline-none select-none font-bold cursor-move"
                     style="font-size: ${parseInt(el.fontSize) || 12}px; font-family: ${escapeHtml(el.fontFamily || 'Plus Jakarta Sans')}; color: ${escapeHtml(el.textColor || '#78350f')};">
                    ${escapeHtml(el.text || 'Comentario...')}
                </div>
            </div>
        `;
    } else {
        domEl.innerHTML = `
            <div class="shape-text w-full text-center outline-none select-none font-bold cursor-move"
                 style="font-size: ${parseInt(el.fontSize) || 12}px; font-family: ${escapeHtml(el.fontFamily || 'Plus Jakarta Sans')}; color: ${escapeHtml(el.textColor || '#78350f')};">
                ${escapeHtml(el.text || '')}
            </div>
        `;
    }
}

function renderNoteHTML(domEl, el) {
    domEl.innerHTML = `
        <div class="sticky-note-card w-full h-full p-3 flex flex-col justify-between" style="background-color: ${escapeHtml(el.color || '#fef08a')};">
            ${el.hasPin ? '<div class="sticky-note-pin"></div>' : ''}
            <div class="note-content w-full h-full outline-none select-none overflow-y-auto cursor-move"
                 style="font-size: ${parseInt(el.fontSize) || 12}px; color: ${escapeHtml(el.textColor || '#78350f')}; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif;">
                ${escapeHtml(el.text || 'Escribe tu nota aquí...')}
            </div>
        </div>
    `;
}

function renderTextHTML(domEl, el) {
    domEl.style.backgroundColor = el.fill || 'transparent';
    domEl.style.borderRadius = '8px';

    domEl.innerHTML = `
        <div class="text-block-content w-full h-full outline-none select-none p-1 cursor-move"
             style="font-size: ${parseInt(el.fontSize) || 18}px; font-weight: ${escapeHtml(el.fontWeight || '700')}; font-family: ${escapeHtml(el.fontFamily || 'Plus Jakarta Sans')}; color: ${escapeHtml(el.textColor || '#1e293b')}; text-align: ${escapeHtml(el.textAlign || 'left')};">
            ${escapeHtml(el.text || 'Texto libre')}
        </div>
    `;
}

function renderTableHTML(domEl, el) {
    let headersHTML = (el.headers || []).map(h => `<th>${escapeHtml(h)}</th>`).join('');
    let rowsHTML = (el.rows || []).map(row => {
        return `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`;
    }).join('');

    domEl.innerHTML = `
        <div class="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md w-full h-full overflow-hidden flex flex-col cursor-move">
            <div class="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1.5 px-1 truncate">
                ${escapeHtml(el.title || 'Tabla Contable')}
            </div>
            <table class="canvas-table flex-1">
                <thead><tr>${headersHTML}</tr></thead>
                <tbody>${rowsHTML}</tbody>
            </table>
        </div>
    `;
}

function renderUIHTML(domEl, el) {
    if (el.uiType === 'kpi-card') {
        domEl.innerHTML = `
            <div class="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg w-full h-full flex flex-col justify-between cursor-move">
                <div class="flex justify-between items-center">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">${escapeHtml(el.title || 'Métrica Financiera')}</span>
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">${escapeHtml(el.badgeText || '+12.5%')}</span>
                </div>
                <div class="text-lg font-black text-slate-800 dark:text-white">${escapeHtml(el.value || '$24,500.00')}</div>
                <div class="text-[9px] text-slate-400 flex items-center gap-1 font-bold">
                    <i class="fas fa-arrow-trend-up text-emerald-500"></i> ${escapeHtml(el.subtitle || 'Vs. período anterior')}
                </div>
            </div>
        `;
    } else if (el.uiType === 'audit-badge') {
        domEl.innerHTML = `
            <div class="w-full h-full p-2.5 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/80 rounded-2xl flex items-center gap-3 shadow-md cursor-move">
                <div class="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center text-sm shadow-sm shrink-0">
                    <i class="fas fa-stamp"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <span class="text-[8px] font-black text-rose-500 uppercase tracking-widest block">AUDITORÍA FISCAL</span>
                    <span class="text-xs font-black text-slate-800 dark:text-white leading-tight block truncate">${escapeHtml(el.text || 'REVISADO & APROBADO')}</span>
                </div>
            </div>
        `;
    } else if (el.uiType === 'checklist') {
        domEl.innerHTML = `
            <div class="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md w-full h-full flex flex-col cursor-move">
                <div class="text-[10px] font-black text-amber-500 uppercase tracking-wider mb-2">Checklist de Auditoría</div>
                <div class="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked class="accent-amber-500"> Conciliación bancaria</label>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked class="accent-amber-500"> Validación de IVA CF/DF</label>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" class="accent-amber-500"> Cierre de Libro Mayor</label>
                </div>
            </div>
        `;
    } else if (el.uiType === 'button') {
        domEl.innerHTML = `
            <button class="w-full h-full px-4 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-move">
                <i class="fas fa-check-circle"></i> <span>${escapeHtml(el.text || 'Botón Acción')}</span>
            </button>
        `;
    } else if (el.uiType === 'input-box') {
        domEl.innerHTML = `
            <div class="w-full h-full flex flex-col justify-center cursor-move">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">${escapeHtml(el.label || 'Campo Contable')}</label>
                <div class="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300">${escapeHtml(el.placeholder || 'Entrada de datos...')}</div>
            </div>
        `;
    } else if (el.uiType === 'badge') {
        domEl.innerHTML = `
            <div class="w-full h-full rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center uppercase tracking-widest shadow-md cursor-move">
                ${escapeHtml(el.text || 'ACTIVO / EN REGLA')}
            </div>
        `;
    }
}

function renderImageHTML(domEl, el) {
    domEl.innerHTML = `
        <img src="${escapeHtml(el.src)}" class="w-full h-full object-cover select-none pointer-events-none" style="border-radius: ${parseInt(el.borderRadius) || 12}px;">
    `;
}

// =========================================================
// 8. EVENTOS DE ARRASTRE, SELECCIÓN Y TRANSFORMACIÓN
// =========================================================
function attachElementEvents(domEl, el) {
    domEl.onmousedown = (e) => {
        if (e.button !== 0 || activeTool === 'hand' || isSpacePressed) return;

        // Si el elemento ya está en modo de edición de texto activo y se hace clic dentro, permitir seleccionar texto
        if (e.target.isContentEditable || e.target.classList.contains('text-editable-active')) {
            return;
        }

        e.stopPropagation();

        if (e.shiftKey || e.ctrlKey) {
            // Multi-selección toggle
            if (selectedElementIds.has(el.id)) {
                selectedElementIds.delete(el.id);
            } else {
                selectedElementIds.add(el.id);
            }
            selectedElementId = selectedElementIds.size === 1 ? Array.from(selectedElementIds)[0] : null;
        } else {
            if (!selectedElementIds.has(el.id)) {
                selectElement(el.id);
            }
        }

        // Iniciar arrastre fluido de elementos
        if (!el.isLocked && !window.isAuditMode) {
            isDraggingElements = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;

            // Guardar posiciones iniciales de todos los seleccionados
            initialMultiBounds.clear();
            const sheet = proyecto_actual.sheets[activeSheetIndex];
            selectedElementIds.forEach(id => {
                const elem = sheet.elements.find(item => item.id === id);
                if (elem) {
                    initialMultiBounds.set(id, { x: elem.x, y: elem.y });

                    // Si es una hoja física, detectar elementos hijos contenidos para moverlos juntos
                    if (elem.type === 'physical_sheet') {
                        (sheet.elements || []).forEach(child => {
                            if (child.id !== elem.id && child.type !== 'physical_sheet' && !selectedElementIds.has(child.id)) {
                                if (
                                    child.x >= elem.x - 5 &&
                                    child.y >= elem.y - 5 &&
                                    child.x + (child.width || 0) <= elem.x + elem.width + 5 &&
                                    child.y + (child.height || 0) <= elem.y + elem.height + 5
                                ) {
                                    initialMultiBounds.set(child.id, { x: child.x, y: child.y, isChildOf: elem.id });
                                }
                            }
                        });
                    }
                }
            });
        }

        renderTransformBox();
        renderInspector();
    };

    // Doble clic para activar edición de texto de forma precisa y elegante
    domEl.ondblclick = (e) => {
        if (window.isAuditMode || el.isLocked) return;
        e.stopPropagation();

        const textEditable = domEl.querySelector('.shape-text, .note-content, .text-block-content, .t-account-header, .sheet-title-text');
        if (textEditable) {
            textEditable.contentEditable = 'true';
            textEditable.spellcheck = false;
            textEditable.classList.add('text-editable-active');
            textEditable.focus();

            try {
                const range = document.createRange();
                range.selectNodeContents(textEditable);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } catch (err) {}

            textEditable.onblur = () => {
                textEditable.contentEditable = 'false';
                textEditable.classList.remove('text-editable-active');
                if (el.type === 'shape' || el.type === 'text' || el.type === 'note') {
                    el.text = textEditable.innerText;
                } else if (el.type === 't_account') {
                    el.title = textEditable.innerText;
                } else if (el.type === 'physical_sheet') {
                    el.title = textEditable.innerText;
                }
                triggerAutoSave();
            };
        }
    };
}

function selectElement(id) {
    selectedElementIds.clear();
    if (id) selectedElementIds.add(id);
    selectedElementId = id;

    // Actualizar clases CSS de seleccionados
    const layer = document.getElementById('canvas-dom-layer');
    if (layer) {
        layer.querySelectorAll('.canvas-element').forEach(el => {
            el.classList.toggle('selected', el.id === id);
            el.classList.toggle('multi-selected', selectedElementIds.has(el.id) && selectedElementIds.size > 1);
        });
    }

    renderTransformBox();
    renderInspector();
    renderLayersList();

    if (window.LienzoCollabEngine) {
        window.LienzoCollabEngine.broadcastSelection(id);
    }
}

function deselectAll() {
    selectedElementIds.clear();
    selectedElementId = null;

    const layer = document.getElementById('canvas-dom-layer');
    if (layer) {
        layer.querySelectorAll('.canvas-element').forEach(el => {
            el.classList.remove('selected', 'multi-selected');
        });
    }

    renderTransformBox();
    renderInspector();
    renderLayersList();

    if (window.LienzoCollabEngine) {
        window.LienzoCollabEngine.broadcastDeselection();
    }
}

function handleElementsDrag(e) {
    if (window.isAuditMode) return;
    pendingDragEvent = e;
    if (typeof window.scheduleViewportUpdate === 'function') {
        window.scheduleViewportUpdate();
    } else {
        applyElementsDragDirect(e);
    }
}

function applyElementsDragDirect(e) {
    if (window.isAuditMode) return;
    const deltaX = (e.clientX - dragStartX) / zoom;
    const deltaY = (e.clientY - dragStartY) / zoom;

    const sheet = proyecto_actual ? proyecto_actual.sheets[activeSheetIndex] : null;
    if (!sheet) return;
    
    // Mover todos los elementos registrados (seleccionados + hijos de hojas)
    initialMultiBounds.forEach((initial, id) => {
        const elem = sheet.elements.find(item => item.id === id);
        if (elem) {
            elem.x = snapCoord(initial.x + deltaX);
            elem.y = snapCoord(initial.y + deltaY);

            const domEl = document.getElementById(id);
            if (domEl) {
                domEl.style.left = `${elem.x}px`;
                domEl.style.top = `${elem.y}px`;
            }
        }
    });

    renderTransformBox();
    if (typeof window.scheduleViewportUpdate === 'function') {
        window.scheduleViewportUpdate({ minimap: true });
    } else {
        updateMinimap();
    }
}

// =========================================================
// 9. TIRADORES DE TRANSFORMACIÓN (RESIZE & ROTATE)
// =========================================================
function renderTransformBox() {
    const box = document.getElementById('transform-box');
    if (!box) return;

    if (selectedElementIds.size === 0 || window.isAuditMode) {
        box.classList.add('hidden');
        return;
    }

    const sheet = proyecto_actual.sheets[activeSheetIndex];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    selectedElementIds.forEach(id => {
        const el = sheet.elements.find(item => item.id === id);
        if (el) {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width);
            maxY = Math.max(maxY, el.y + el.height);
        }
    });

    if (minX === Infinity) {
        box.classList.add('hidden');
        return;
    }

    box.classList.remove('hidden');
    box.style.left = `${minX}px`;
    box.style.top = `${minY}px`;
    box.style.width = `${maxX - minX}px`;
    box.style.height = `${maxY - minY}px`;

    // Si es un solo elemento con rotación, aplicar rotación al bounding box
    if (selectedElementIds.size === 1) {
        const el = sheet.elements.find(item => item.id === selectedElementId);
        box.style.transform = `rotate(${el.rotation || 0}deg)`;
        box.style.transformOrigin = 'center center';
    } else {
        box.style.transform = 'none';
    }

    attachHandleEvents();
}

function attachHandleEvents() {
    const box = document.getElementById('transform-box');
    if (!box) return;

    box.querySelectorAll('.resize-handle').forEach(handle => {
        handle.onmousedown = (e) => {
            e.stopPropagation();
            if (window.isAuditMode) return;
            isResizing = true;
            resizeHandleType = handle.dataset.handle;
            dragStartX = e.clientX;
            dragStartY = e.clientY;

            const sheet = proyecto_actual.sheets[activeSheetIndex];
            const el = sheet.elements.find(item => item.id === selectedElementId);
            if (el) {
                initialElemBounds = { x: el.x, y: el.y, w: el.width, h: el.height };
            }
        };
    });

    const rotateHandle = box.querySelector('.rotate-handle');
    if (rotateHandle) {
        rotateHandle.onmousedown = (e) => {
            e.stopPropagation();
            if (window.isAuditMode) return;
            isRotating = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
        };
    }
}

function handleElementResize(e) {
    if (!selectedElementId || !initialElemBounds || window.isAuditMode) return;
    pendingResizeEvent = e;
    if (typeof window.scheduleViewportUpdate === 'function') {
        window.scheduleViewportUpdate();
    } else {
        applyElementResizeDirect(e);
    }
}

function applyElementResizeDirect(e) {
    if (!selectedElementId || !initialElemBounds || window.isAuditMode) return;
    const sheet = proyecto_actual ? proyecto_actual.sheets[activeSheetIndex] : null;
    if (!sheet) return;
    const el = sheet.elements.find(item => item.id === selectedElementId);
    if (!el) return;

    const deltaX = (e.clientX - dragStartX) / zoom;
    const deltaY = (e.clientY - dragStartY) / zoom;

    let newX = initialElemBounds.x;
    let newY = initialElemBounds.y;
    let newW = initialElemBounds.w;
    let newH = initialElemBounds.h;

    if (resizeHandleType.includes('e')) newW = Math.max(40, initialElemBounds.w + deltaX);
    if (resizeHandleType.includes('s')) newH = Math.max(30, initialElemBounds.h + deltaY);
    if (resizeHandleType.includes('w')) {
        const possibleW = initialElemBounds.w - deltaX;
        if (possibleW >= 40) {
            newW = possibleW;
            newX = initialElemBounds.x + deltaX;
        }
    }
    if (resizeHandleType.includes('n')) {
        const possibleH = initialElemBounds.h - deltaY;
        if (possibleH >= 30) {
            newH = possibleH;
            newY = initialElemBounds.y + deltaY;
        }
    }

    el.x = snapCoord(newX);
    el.y = snapCoord(newY);
    el.width = snapCoord(newW);
    el.height = snapCoord(newH);

    // Actualización directa de dimensiones DOM sin invalidar árboles internos
    const domEl = document.getElementById(el.id);
    if (domEl) {
        domEl.style.left = `${el.x}px`;
        domEl.style.top = `${el.y}px`;
        domEl.style.width = `${el.width}px`;
        domEl.style.height = `${el.height}px`;
        const svg = domEl.querySelector('svg');
        if (svg) {
            svg.setAttribute('viewBox', `0 0 ${el.width} ${el.height}`);
        }
    }
    renderTransformBox();
}

function handleElementRotate(e) {
    if (!selectedElementId || window.isAuditMode) return;
    pendingRotateEvent = e;
    if (typeof window.scheduleViewportUpdate === 'function') {
        window.scheduleViewportUpdate();
    } else {
        applyElementRotateDirect(e);
    }
}

function applyElementRotateDirect(e) {
    if (!selectedElementId || window.isAuditMode) return;
    const sheet = proyecto_actual ? proyecto_actual.sheets[activeSheetIndex] : null;
    if (!sheet) return;
    const el = sheet.elements.find(item => item.id === selectedElementId);
    if (!el) return;

    const elemCenter = {
        x: el.x + el.width / 2,
        y: el.y + el.height / 2
    };

    const mouseWorld = screenToWorld(e.clientX, e.clientY);
    const angleRad = Math.atan2(mouseWorld.y - elemCenter.y, mouseWorld.x - elemCenter.x);
    let angleDeg = Math.round(angleRad * (180 / Math.PI)) + 90;

    // Snap cada 15 grados con Shift
    if (e.shiftKey) {
        angleDeg = Math.round(angleDeg / 15) * 15;
    }

    el.rotation = angleDeg;
    const domEl = document.getElementById(el.id);
    if (domEl) domEl.style.transform = `rotate(${el.rotation}deg)`;
    renderTransformBox();
}

// =========================================================
// 10. MARQUEE SELECTION (CAJA DE SELECCIÓN EN ARRASTRE)
// =========================================================
function updateMarqueeBox(x, y, w, h) {
    const marquee = document.getElementById('selection-marquee');
    if (!marquee) return;

    marquee.style.display = 'block';
    marquee.style.left = `${x}px`;
    marquee.style.top = `${y}px`;
    marquee.style.width = `${w}px`;
    marquee.style.height = `${h}px`;
}

function checkMarqueeIntersections(x, y, w, h) {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    selectedElementIds.clear();

    sheet.elements.forEach(el => {
        // Colisión de rectángulos AABB
        if (el.x < x + w && el.x + el.width > x && el.y < y + h && el.y + el.height > y) {
            selectedElementIds.add(el.id);
        }
    });

    selectedElementId = selectedElementIds.size === 1 ? Array.from(selectedElementIds)[0] : null;

    const layer = document.getElementById('canvas-dom-layer');
    if (layer) {
        layer.querySelectorAll('.canvas-element').forEach(domEl => {
            domEl.classList.toggle('multi-selected', selectedElementIds.has(domEl.id));
        });
    }
}

// =========================================================
// 11. MOTOR DE TRAZOS LIBRES VECTORIALES (BRUSH & SVG)
// =========================================================
function startFreehandStroke(e) {
    if (window.isAuditMode) return;
    isDrawingStroke = true;
    const worldPos = screenToWorld(e.clientX, e.clientY);
    currentStrokePoints = [worldPos];

    const activePath = document.getElementById('svg-active-stroke');
    if (activePath) {
        activePath.setAttribute('d', `M ${worldPos.x} ${worldPos.y}`);
        activePath.setAttribute('stroke', brushColor);
        activePath.setAttribute('stroke-width', brushSize);
        activePath.setAttribute('opacity', brushMode === 'highlighter' ? '0.35' : '1.0');
    }
}

function addPointToStroke(e) {
    if (!isDrawingStroke) return;
    const worldPos = screenToWorld(e.clientX, e.clientY);
    
    // Filtrado de micro-jitter a 120Hz para curvas vectoriales ultra nítidas y óptimas
    if (currentStrokePoints.length > 0) {
        const lastPt = currentStrokePoints[currentStrokePoints.length - 1];
        const dist = Math.hypot(worldPos.x - lastPt.x, worldPos.y - lastPt.y);
        if (dist < 1.6) return;
    }
    
    currentStrokePoints.push(worldPos);

    const activePath = document.getElementById('svg-active-stroke');
    if (activePath && currentStrokePoints.length > 1) {
        activePath.setAttribute('d', createSmoothSvgPath(currentStrokePoints));
    }
}

function finishFreehandStroke() {
    if (!isDrawingStroke) return;
    isDrawingStroke = false;

    if (currentStrokePoints.length > 1) {
        const sheet = proyecto_actual.sheets[activeSheetIndex];
        if (!sheet.freehandStrokes) sheet.freehandStrokes = [];

        const strokeObj = {
            id: 'stroke_' + Date.now(),
            pathData: createSmoothSvgPath(currentStrokePoints),
            color: brushColor,
            width: brushSize,
            mode: brushMode,
            opacity: brushMode === 'highlighter' ? 0.35 : 1.0
        };

        sheet.freehandStrokes.push(strokeObj);
        renderAllSVG();
        if (window.LienzoCollabEngine) {
            window.LienzoCollabEngine.broadcastStrokeAdd(strokeObj);
        }
        pushHistoryState();
        triggerAutoSave();
    }

    const activePath = document.getElementById('svg-active-stroke');
    if (activePath) activePath.setAttribute('d', '');
    currentStrokePoints = [];
}

function createSmoothSvgPath(points) {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        d += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
    }
    d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
    return d;
}

function renderAllSVG() {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    // Render Trazos Libres
    const strokeGroup = document.getElementById('svg-freehand-group');
    if (strokeGroup) {
        strokeGroup.innerHTML = (sheet.freehandStrokes || []).map(s => `
            <path id="${s.id}" d="${s.pathData}" fill="none" stroke="${s.color}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round" opacity="${s.opacity || 1}" />
        `).join('');
    }

    // Render Conectores
    const connGroup = document.getElementById('svg-connectors-group');
    if (connGroup) {
        connGroup.innerHTML = (sheet.connectors || []).map(c => {
            let pathD = `M ${c.startX} ${c.startY} L ${c.endX} ${c.endY}`;
            if (c.connType === 'orthogonal') {
                const midX = (c.startX + c.endX) / 2;
                pathD = `M ${c.startX} ${c.startY} L ${midX} ${c.startY} L ${midX} ${c.endY} L ${c.endX} ${c.endY}`;
            }
            return `
                <path id="${c.id}" d="${pathD}" fill="none" stroke="${c.stroke || '#f59e0b'}" stroke-width="${c.strokeWidth || 2.5}" stroke-dasharray="${c.strokeStyle === 'dashed' ? '5,5' : 'none'}" marker-end="${c.markerEnd ? `url(#${c.markerEnd})` : 'none'}" />
            `;
        }).join('');
    }
}

window.setBrushSize = function(size) {
    brushSize = size;
    setActiveTool('brush');
};

window.setBrushMode = function(mode) {
    brushMode = mode;
    document.getElementById('brush-mode-pen').className = mode === 'pen' ? 'flex-1 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold text-center' : 'flex-1 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold text-center';
    document.getElementById('brush-mode-highlighter').className = mode === 'highlighter' ? 'flex-1 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold text-center' : 'flex-1 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold text-center';
    setActiveTool('brush');
};

window.clearCanvasPrompt = function() {
    if (window.isAuditMode) return;
    if (confirm("¿Deseas limpiar todo el lienzo actual (formas, notas, trazos y conectores)?")) {
        const sheet = proyecto_actual.sheets[activeSheetIndex];
        sheet.elements = [];
        sheet.freehandStrokes = [];
        sheet.connectors = [];

        renderAllElements();
        renderAllSVG();
        deselectAll();
        pushHistoryState();
        triggerAutoSave();
    }
};

// =========================================================
// 12. INSPECTOR DE PROPIEDADES GLASSMORPHIC MINIMALISTA
// =========================================================
function renderInspector() {
    const container = document.getElementById('inspector-content');
    const title = document.getElementById('inspector-title');
    if (!container) return;

    const sheet = proyecto_actual.sheets[activeSheetIndex];

    // Caso 1: Varios elementos seleccionados
    if (selectedElementIds.size > 1) {
        if (title) title.innerText = `Selección (${selectedElementIds.size})`;
        container.innerHTML = `
            <div class="space-y-4">
                <div>
                    <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Alineación Rápida</span>
                    <div class="grid grid-cols-3 gap-2">
                        <button onclick="alignSelected('left')" class="p-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900 hover:bg-amber-500 hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold transition-all shadow-sm" title="Alinear a la Izquierda">
                            <i class="fas fa-align-left"></i>
                        </button>
                        <button onclick="alignSelected('center')" class="p-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900 hover:bg-amber-500 hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold transition-all shadow-sm" title="Centrar Horizontalmente">
                            <i class="fas fa-align-center"></i>
                        </button>
                        <button onclick="alignSelected('right')" class="p-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900 hover:bg-amber-500 hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold transition-all shadow-sm" title="Alinear a la Derecha">
                            <i class="fas fa-align-right"></i>
                        </button>
                        <button onclick="alignSelected('top')" class="p-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900 hover:bg-amber-500 hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold transition-all shadow-sm" title="Alinear Arriba">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button onclick="alignSelected('middle')" class="p-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900 hover:bg-amber-500 hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold transition-all shadow-sm" title="Centrar Verticalmente">
                            <i class="fas fa-arrows-up-down"></i>
                        </button>
                        <button onclick="alignSelected('bottom')" class="p-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900 hover:bg-amber-500 hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold transition-all shadow-sm" title="Alinear Abajo">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                    </div>
                </div>

                ${!window.isAuditMode ? `
                <div class="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex gap-2">
                    <button onclick="duplicateSelectedElements()" class="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm">
                        <i class="far fa-copy"></i> Duplicar
                    </button>
                    <button onclick="deleteSelectedElements()" class="flex-1 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm">
                        <i class="fas fa-trash-can"></i> Borrar
                    </button>
                </div>` : ''}
            </div>
        `;
        return;
    }

    // Caso 2: Un solo elemento seleccionado
    if (selectedElementId) {
        const el = sheet.elements.find(item => item.id === selectedElementId);
        if (!el) return;

        if (title) {
            if (el.type === 'physical_sheet') title.innerText = "HOJA TRADICIONAL";
            else if (el.type === 't_account') title.innerText = "CUENTA T (MAYOR)";
            else title.innerText = `${el.type.toUpperCase()}`;
        }

        container.innerHTML = `
            <!-- Ajustes específicos de Hoja Física Tradicional -->
            ${el.type === 'physical_sheet' ? `
            <div class="space-y-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
                <span class="text-[9px] font-black text-amber-500 uppercase tracking-widest block">Formato de Hoja</span>
                <select onchange="setPhysicalSheetFormat('${el.id}', this.value)" ${window.isAuditMode ? 'disabled' : ''} class="w-full bg-slate-100/80 dark:bg-slate-900 rounded-2xl px-3 py-2 text-xs font-black text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                    <option value="letter" ${el.format === 'letter' ? 'selected' : ''}>Carta (21.6 × 27.9 cm)</option>
                    <option value="a4" ${el.format === 'a4' ? 'selected' : ''}>A4 (21.0 × 29.7 cm)</option>
                    <option value="legal" ${el.format === 'legal' ? 'selected' : ''}>Oficio (21.6 × 35.6 cm)</option>
                    <option value="tabloid" ${el.format === 'tabloid' ? 'selected' : ''}>Tabloide (27.9 × 43.2 cm)</option>
                    <option value="a3" ${el.format === 'a3' ? 'selected' : ''}>A3 (29.7 × 42.0 cm)</option>
                    <option value="a5" ${el.format === 'a5' ? 'selected' : ''}>A5 (14.8 × 21.0 cm)</option>
                    <option value="voucher" ${el.format === 'voucher' ? 'selected' : ''}>Voucher (20.0 × 8.5 cm)</option>
                    <option value="business_card" ${el.format === 'business_card' ? 'selected' : ''}>Tarjeta (8.5 × 5.5 cm)</option>
                    <option value="slide_16_9" ${el.format === 'slide_16_9' ? 'selected' : ''}>Diapositiva 16:9 (HD)</option>
                    <option value="slide_4_3" ${el.format === 'slide_4_3' ? 'selected' : ''}>Diapositiva 4:3</option>
                    <option value="custom" ${el.format === 'custom' ? 'selected' : ''}>Personalizada...</option>
                </select>
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="setPhysicalSheetOrientation('${el.id}', 'portrait')" class="py-2 px-3 rounded-xl text-xs font-bold ${el.orientation !== 'landscape' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'} flex items-center justify-center gap-1.5">
                        <i class="fas fa-file"></i> Vertical
                    </button>
                    <button onclick="setPhysicalSheetOrientation('${el.id}', 'landscape')" class="py-2 px-3 rounded-xl text-xs font-bold ${el.orientation === 'landscape' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'} flex items-center justify-center gap-1.5">
                        <i class="fas fa-file -rotate-90"></i> Horizontal
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-2 pt-1">
                    <button onclick="duplicatePhysicalSheet('${el.id}')" ${window.isAuditMode ? 'disabled' : ''} class="py-2 px-2.5 rounded-xl text-[11px] font-bold bg-amber-500/15 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5 transition-colors">
                        <i class="fas fa-copy text-[10px]"></i> Duplicar Hoja
                    </button>
                    <button onclick="focusPhysicalSheet('${el.id}')" class="py-2 px-2.5 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors">
                        <i class="fas fa-search-plus text-[10px]"></i> Enfocar
                    </button>
                </div>
            </div>
            ` : ''}

            <!-- Ajustes específicos de Cuenta T (Esquema de Mayor) -->
            ${el.type === 't_account' ? `
            <div class="space-y-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
                <span class="text-[9px] font-black text-amber-500 uppercase tracking-widest block">Operaciones Contables</span>
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="promptAddTAccountEntry('${el.id}', 'debe')" ${window.isAuditMode ? 'disabled' : ''} class="py-2 px-2.5 rounded-xl text-[11px] font-bold bg-emerald-500 text-white flex items-center justify-center gap-1 shadow-sm">
                        <i class="fas fa-plus text-[9px]"></i> + Cargo (Debe)
                    </button>
                    <button onclick="promptAddTAccountEntry('${el.id}', 'haber')" ${window.isAuditMode ? 'disabled' : ''} class="py-2 px-2.5 rounded-xl text-[11px] font-bold bg-rose-500 text-white flex items-center justify-center gap-1 shadow-sm">
                        <i class="fas fa-plus text-[9px]"></i> + Abono (Haber)
                    </button>
                </div>
            </div>
            ` : ''}

            <!-- Geometría y Dimensiones -->
            <div class="space-y-2">
                <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">Dimensiones (px)</span>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-900/80 px-3.5 py-2.5 rounded-2xl focus-within:bg-amber-500/10 transition-colors">
                        <span class="text-[10px] font-black text-amber-500">W</span>
                        <input type="number" value="${Math.round(el.width)}" onchange="updateSelectedProp('width', parseInt(this.value))" ${window.isAuditMode ? 'disabled' : ''} class="w-full bg-transparent outline-none font-black text-slate-800 dark:text-white text-xs">
                    </div>
                    <div class="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-900/80 px-3.5 py-2.5 rounded-2xl focus-within:bg-amber-500/10 transition-colors">
                        <span class="text-[10px] font-black text-amber-500">H</span>
                        <input type="number" value="${Math.round(el.height)}" onchange="updateSelectedProp('height', parseInt(this.value))" ${window.isAuditMode ? 'disabled' : ''} class="w-full bg-transparent outline-none font-black text-slate-800 dark:text-white text-xs">
                    </div>
                </div>
            </div>

            <!-- Colores y Relleno -->
            ${el.fill !== undefined ? `
            <div class="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">Color de Relleno</span>
                <div class="flex items-center gap-2">
                    <button onclick="updateSelectedProp('fill', '#fef3c7')" class="w-7 h-7 rounded-xl bg-amber-100 hover:scale-110 transition-transform shadow-sm"></button>
                    <button onclick="updateSelectedProp('fill', '#bae6fd')" class="w-7 h-7 rounded-xl bg-sky-200 hover:scale-110 transition-transform shadow-sm"></button>
                    <button onclick="updateSelectedProp('fill', '#bbf7d0')" class="w-7 h-7 rounded-xl bg-emerald-200 hover:scale-110 transition-transform shadow-sm"></button>
                    <button onclick="updateSelectedProp('fill', '#fed7aa')" class="w-7 h-7 rounded-xl bg-orange-200 hover:scale-110 transition-transform shadow-sm"></button>
                    <button onclick="updateSelectedProp('fill', '#ffffff')" class="w-7 h-7 rounded-xl bg-white hover:scale-110 transition-transform shadow-sm"></button>
                    <input type="color" value="${el.fill || '#ffffff'}" onchange="updateSelectedProp('fill', this.value)" ${window.isAuditMode ? 'disabled' : ''} class="w-7 h-7 rounded-xl cursor-pointer p-0 bg-transparent">
                </div>
            </div>
            ` : ''}

            <!-- Tipografía (si tiene texto) -->
            ${el.text !== undefined ? `
            <div class="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">Tipografía</span>
                <div class="flex gap-2">
                    <select onchange="updateSelectedProp('fontFamily', this.value)" ${window.isAuditMode ? 'disabled' : ''} class="flex-1 bg-slate-100/80 dark:bg-slate-900 rounded-2xl px-3 py-2 text-xs font-black text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                        <option value="Plus Jakarta Sans" ${(!el.fontFamily || el.fontFamily === 'Plus Jakarta Sans' || el.fontFamily === 'Outfit') ? 'selected' : ''}>Jakarta</option>
                        <option value="JetBrains Mono" ${el.fontFamily === 'JetBrains Mono' ? 'selected' : ''}>Mono</option>
                        <option value="Playfair Display" ${el.fontFamily === 'Playfair Display' ? 'selected' : ''}>Serif</option>
                    </select>
                    <input type="number" value="${el.fontSize || 14}" onchange="updateSelectedProp('fontSize', parseInt(this.value))" ${window.isAuditMode ? 'disabled' : ''} class="w-14 bg-slate-100/80 dark:bg-slate-900 rounded-2xl px-2 py-2 text-xs font-black text-center text-slate-800 dark:text-white outline-none">
                </div>
            </div>
            ` : ''}

            <!-- Capas y Orden Z-Index -->
            ${!window.isAuditMode ? `
            <div class="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">Capas y Posición</span>
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="bringSelectedToFront()" class="py-2.5 bg-slate-100/80 dark:bg-slate-900 hover:bg-amber-500 hover:text-white text-slate-600 dark:text-slate-300 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 shadow-sm">
                        <i class="fas fa-layer-group text-xs"></i> Al Frente
                    </button>
                    <button onclick="sendSelectedToBack()" class="py-2.5 bg-slate-100/80 dark:bg-slate-900 hover:bg-amber-500 hover:text-white text-slate-600 dark:text-slate-300 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 shadow-sm">
                        <i class="fas fa-down-to-bracket text-xs"></i> Al Fondo
                    </button>
                </div>
            </div>

            <!-- Acciones Rápidas -->
            <div class="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex gap-2">
                <button onclick="duplicateSelectedElements()" class="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm">
                    <i class="far fa-copy"></i> Duplicar
                </button>
                <button onclick="deleteSelectedElements()" class="flex-1 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm">
                    <i class="fas fa-trash-can"></i> Borrar
                </button>
            </div>` : ''}
        `;
        return;
    }

    // Caso 3: Ningún elemento seleccionado (Ajustes de Fondo del Lienzo)
    if (title) title.innerText = "Lienzo";
    const currentGrid = sheet.gridStyle || 'grid-lines';
    
    container.innerHTML = `
        <div class="space-y-4">
            <div>
                <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2.5">Estilo de Cuadrícula</span>
                <div class="grid grid-cols-3 gap-2">
                    
                    <!-- Puntos -->
                    <button onclick="setSheetGrid('grid-dots')" class="p-2.5 rounded-2xl ${currentGrid === 'grid-dots' ? 'bg-amber-500 text-white font-black shadow-lg shadow-amber-500/30' : 'bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold hover:bg-amber-500/15'} cursor-pointer transition-all flex flex-col items-center gap-1.5 text-center group">
                        <div class="w-8 h-8 rounded-xl ${currentGrid === 'grid-dots' ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 group-hover:text-amber-500'} flex items-center justify-center text-xs transition-colors shadow-sm">
                            <i class="fas fa-braille"></i>
                        </div>
                        <span class="text-[11px]">Puntos</span>
                    </button>

                    <!-- Cuadrícula -->
                    <button onclick="setSheetGrid('grid-lines')" class="p-2.5 rounded-2xl ${currentGrid === 'grid-lines' ? 'bg-amber-500 text-white font-black shadow-lg shadow-amber-500/30' : 'bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold hover:bg-amber-500/15'} cursor-pointer transition-all flex flex-col items-center gap-1.5 text-center group">
                        <div class="w-8 h-8 rounded-xl ${currentGrid === 'grid-lines' ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 group-hover:text-amber-500'} flex items-center justify-center text-xs transition-colors shadow-sm">
                            <i class="fas fa-border-all"></i>
                        </div>
                        <span class="text-[11px]">Cuadrícula</span>
                    </button>

                    <!-- Limpio -->
                    <button onclick="setSheetGrid('grid-blank')" class="p-2.5 rounded-2xl ${currentGrid === 'grid-blank' ? 'bg-amber-500 text-white font-black shadow-lg shadow-amber-500/30' : 'bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold hover:bg-amber-500/15'} cursor-pointer transition-all flex flex-col items-center gap-1.5 text-center group">
                        <div class="w-8 h-8 rounded-xl ${currentGrid === 'grid-blank' ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 group-hover:text-amber-500'} flex items-center justify-center text-xs transition-colors shadow-sm">
                            <i class="far fa-square"></i>
                        </div>
                        <span class="text-[11px]">Limpio</span>
                    </button>

                </div>
            </div>

            <!-- Estadísticas del Lienzo -->
            <div class="pt-3.5 border-t border-slate-200/60 dark:border-slate-800/60">
                <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2.5">Elementos en Página</span>
                <div class="space-y-2 text-xs">
                    <div class="flex justify-between items-center bg-slate-100/70 dark:bg-slate-900/70 px-3.5 py-2.5 rounded-2xl">
                        <span class="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-bold"><i class="fas fa-shapes text-amber-500 text-[10px]"></i> Objetos DOM</span>
                        <span class="font-black text-slate-800 dark:text-white bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg shadow-sm">${sheet.elements.length}</span>
                    </div>
                    <div class="flex justify-between items-center bg-slate-100/70 dark:bg-slate-900/70 px-3.5 py-2.5 rounded-2xl">
                        <span class="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-bold"><i class="fas fa-paint-brush text-sky-500 text-[10px]"></i> Trazos Libres</span>
                        <span class="font-black text-slate-800 dark:text-white bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg shadow-sm">${(sheet.freehandStrokes || []).length}</span>
                    </div>
                    <div class="flex justify-between items-center bg-slate-100/70 dark:bg-slate-900/70 px-3.5 py-2.5 rounded-2xl">
                        <span class="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-bold"><i class="fas fa-arrow-right text-emerald-500 text-[10px]"></i> Conectores</span>
                        <span class="font-black text-slate-800 dark:text-white bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg shadow-sm">${(sheet.connectors || []).length}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.updateSelectedProp = function(prop, value) {
    if (window.isAuditMode || !proyecto_actual || !selectedElementId) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet || !sheet.elements) return;
    const el = sheet.elements.find(item => item.id === selectedElementId);
    if (!el || el.isLocked) return;

    if (prop === 'width' || prop === 'height' || prop === 'fontSize') {
        const num = parseInt(value, 10);
        if (isNaN(num) || num <= 0) return;
        value = num;
    }

    el[prop] = value;
    renderElementDOM(el);
    if (window.LienzoCollabEngine) {
        if (typeof window.LienzoCollabEngine.broadcastElementPatch === 'function') {
            window.LienzoCollabEngine.broadcastElementPatch(el);
        } else if (typeof window.LienzoCollabEngine.broadcastElementUpdate === 'function') {
            window.LienzoCollabEngine.broadcastElementUpdate(el);
        }
    }
    renderTransformBox();
    renderInspector();
    renderLayersList();
    if (typeof pushHistory === 'function') {
        pushHistory();
    } else if (typeof pushHistoryState === 'function') {
        pushHistoryState();
    }
    triggerAutoSave();
};

function pushHistory(clearRedo = false) {
    if (typeof pushHistoryState === 'function') {
        pushHistoryState(clearRedo);
    }
}

window.toggleInspectorCollapse = function() {
    const inspector = document.getElementById('properties-inspector');
    const btn = document.getElementById('btn-toggle-inspector');
    if (inspector) {
        inspector.classList.toggle('collapsed');
        if (btn) btn.classList.toggle('active', !inspector.classList.contains('collapsed'));
    }
};

// =========================================================
// CONTROLADOR DE CAPAS (LAYERS CONTROLLER)
// =========================================================
window.toggleLayersPanel = function() {
    const panel = document.getElementById('layers-panel');
    const btn = document.getElementById('btn-toggle-layers');
    if (!panel) return;
    
    const isCollapsed = panel.classList.contains('collapsed');
    panel.classList.toggle('collapsed', !isCollapsed);
    if (btn) {
        btn.classList.toggle('active', isCollapsed);
        btn.classList.toggle('text-amber-500', isCollapsed);
    }
    
    if (isCollapsed) {
        renderLayersList();
    }
};

window.renderLayersList = function() {
    const container = document.getElementById('layers-list-container');
    const countBadge = document.getElementById('layers-count');
    if (!container) return;

    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet || !sheet.elements || sheet.elements.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-slate-400 text-xs italic">El lienzo está limpio.<br>Agrega elementos para ver sus capas.</div>`;
        if (countBadge) countBadge.textContent = '0';
        return;
    }

    if (countBadge) countBadge.textContent = `${sheet.elements.length}`;

    // Ordenar de mayor zIndex a menor (la capa superior arriba de la lista)
    const sorted = [...sheet.elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

    container.innerHTML = sorted.map(el => {
        const isSelected = selectedElementIds.has(el.id);
        let iconHtml = '<i class="fas fa-shapes text-amber-500 text-xs"></i>';
        let label = el.text || el.title || el.name || 'Elemento';

        if (el.type === 'physical_sheet' || el.type === 'physical-sheet') {
            iconHtml = '<i class="fas fa-file-lines text-sky-500 text-xs"></i>';
            label = el.title || `Hoja ${el.formatName || el.format || 'Carta'}`;
        } else if (el.type === 't_account' || el.type === 't-account') {
            iconHtml = '<i class="fas fa-table-columns text-amber-500 text-xs"></i>';
            label = `Cuenta T: ${el.title || el.accountName || 'Mayor'}`;
        } else if (el.type === 'note') {
            iconHtml = '<i class="fas fa-note-sticky text-yellow-500 text-xs"></i>';
            label = el.text ? el.text.substring(0, 16) : 'Nota adhesiva';
        } else if (el.type === 'text') {
            iconHtml = '<i class="fas fa-font text-emerald-500 text-xs"></i>';
            label = el.text ? el.text.substring(0, 16) : 'Bloque de texto';
        } else if (el.type === 'table') {
            iconHtml = '<i class="fas fa-table text-indigo-500 text-xs"></i>';
            label = 'Tabla / Planilla';
        } else if (el.type === 'ui') {
            iconHtml = '<i class="fas fa-cube text-purple-500 text-xs"></i>';
            if (el.uiType === 't-account' || el.uiType === 't_account') {
                iconHtml = '<i class="fas fa-table-columns text-amber-500 text-xs"></i>';
                label = `Cuenta T: ${el.title || el.accountName || 'Mayor'}`;
            } else {
                label = `Widget: ${el.title || el.uiType}`;
            }
        } else if (el.type === 'shape') {
            label = el.text || `Figura: ${el.shapeType || 'Rectángulo'}`;
        }

        const safeId = escapeHtml(el.id);
        return `
            <div class="layer-item ${isSelected ? 'active' : ''} ${el.isLocked ? 'locked' : ''} ${el.hidden ? 'hidden-layer' : ''}" 
                 onclick="selectElement('${safeId}', event)">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                    <span class="shrink-0 flex items-center justify-center w-5 h-5">${iconHtml}</span>
                    <span class="text-xs font-bold truncate ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}">${escapeHtml(label)}</span>
                </div>
                <div class="flex items-center gap-0.5 shrink-0 ml-2">
                    <button onclick="event.stopPropagation(); toggleElementVisibility('${safeId}')" 
                            class="p-1 hover:text-amber-500 transition-colors text-[11px] ${el.hidden ? 'text-rose-500' : 'text-slate-400'}" 
                            title="${el.hidden ? 'Mostrar capa' : 'Ocultar capa'}">
                        <i class="fas ${el.hidden ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    </button>
                    <button onclick="event.stopPropagation(); toggleElementLock('${safeId}')" 
                            class="p-1 hover:text-amber-500 transition-colors text-[11px] ${el.isLocked ? 'text-amber-500' : 'text-slate-400'}" 
                            title="${el.isLocked ? 'Desbloquear capa' : 'Bloquear capa'}">
                        <i class="fas ${el.isLocked ? 'fa-lock' : 'fa-lock-open'}"></i>
                    </button>
                    <button onclick="event.stopPropagation(); moveLayerUp('${safeId}')" 
                            class="p-1 text-slate-400 hover:text-amber-500 transition-colors text-[10px]" 
                            title="Subir capa">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                    <button onclick="event.stopPropagation(); moveLayerDown('${safeId}')" 
                            class="p-1 text-slate-400 hover:text-amber-500 transition-colors text-[10px]" 
                            title="Bajar capa">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <button onclick="event.stopPropagation(); deleteElement('${safeId}')" 
                            class="p-1 text-slate-400 hover:text-rose-500 transition-colors text-[10px]" 
                            title="Eliminar capa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
};

window.toggleElementVisibility = function(id) {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;
    const el = sheet.elements.find(e => e.id === id);
    if (!el) return;

    el.hidden = !el.hidden;
    const domEl = document.getElementById(id);
    if (domEl) {
        domEl.style.display = el.hidden ? 'none' : 'block';
    }
    renderTransformBox();
    renderLayersList();
    triggerAutoSave();
};

window.toggleElementLock = function(id) {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;
    const el = sheet.elements.find(e => e.id === id);
    if (!el) return;

    el.isLocked = !el.isLocked;
    const domEl = document.getElementById(id);
    if (domEl) {
        domEl.classList.toggle('locked', !!el.isLocked);
    }
    renderTransformBox();
    renderLayersList();
    renderInspector();
    triggerAutoSave();
    showToastNotification(el.isLocked ? "Capa bloqueada" : "Capa desbloqueada");
};

window.moveLayerUp = function(id) {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;
    const el = sheet.elements.find(e => e.id === id);
    if (!el) return;

    el.zIndex = (el.zIndex || 10) + 1;
    highestZIndex = Math.max(highestZIndex, el.zIndex);
    const domEl = document.getElementById(id);
    if (domEl) domEl.style.zIndex = el.zIndex;

    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
};

window.moveLayerDown = function(id) {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;
    const el = sheet.elements.find(e => e.id === id);
    if (!el) return;

    el.zIndex = Math.max(1, (el.zIndex || 10) - 1);
    const domEl = document.getElementById(id);
    if (domEl) domEl.style.zIndex = el.zIndex;

    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
};

window.bringSelectedLayerForward = function() {
    selectedElementIds.forEach(id => moveLayerUp(id));
};

window.sendSelectedLayerBackward = function() {
    selectedElementIds.forEach(id => moveLayerDown(id));
};

window.bringSelectedToFront = function() {
    if (!selectedElementId || window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    const el = sheet.elements.find(item => item.id === selectedElementId);
    if (el) {
        el.zIndex = ++highestZIndex;
        const domEl = document.getElementById(el.id);
        if (domEl) domEl.style.zIndex = el.zIndex;
        renderLayersList();
        triggerAutoSave();
    }
};

window.sendSelectedToBack = function() {
    if (!selectedElementId || window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    const el = sheet.elements.find(item => item.id === selectedElementId);
    if (el) {
        el.zIndex = 1;
        const domEl = document.getElementById(el.id);
        if (domEl) domEl.style.zIndex = el.zIndex;
        renderLayersList();
        triggerAutoSave();
    }
};

// =========================================================
// MODO ZEN / INMERSIVO & FÍSICA MAGNÉTICA
// =========================================================
let isZenMode = false;

window.toggleZenMode = function() {
    isZenMode = !isZenMode;
    document.body.classList.toggle('zen-mode-active', isZenMode);

    const magneticBtn = document.getElementById('magnetic-ui-restorer');
    const toggleBtn = document.getElementById('btn-toggle-zen');
    
    if (magneticBtn) {
        magneticBtn.classList.toggle('hidden', !isZenMode);
        magneticBtn.style.transform = 'translateX(-50%)';
    }
    if (toggleBtn) {
        toggleBtn.classList.toggle('active', isZenMode);
    }

    if (isZenMode) {
        showToastNotification("Modo Inmersivo Zen activado. (Tab o Clic abajo para restaurar)");
    } else {
        showToastNotification("Interfaz restaurada");
    }
};

function initMagneticTrigger() {
    const magneticBtn = document.getElementById('magnetic-ui-restorer');
    if (!magneticBtn) return;

    let rafMagneticId = null;
    let cachedBtnRect = null;

    const updateMagneticPull = (clientX, clientY) => {
        if (!cachedBtnRect) cachedBtnRect = magneticBtn.getBoundingClientRect();
        const rect = cachedBtnRect;
        const btnCenterX = rect.left + rect.width / 2;
        const btnCenterY = rect.top + rect.height / 2;

        const dist = Math.hypot(clientX - btnCenterX, clientY - btnCenterY);
        const maxDist = 200;

        if (dist < maxDist) {
            const pullStrength = (1 - dist / maxDist) * 0.38;
            const dx = (clientX - btnCenterX) * pullStrength;
            const dy = (clientY - btnCenterY) * pullStrength;
            magneticBtn.style.transform = `translate(calc(-50% + ${dx}px), ${dy}px) scale(1.06)`;
        } else {
            magneticBtn.style.transform = 'translate(-50%, 0) scale(1)';
        }
    };

    window.addEventListener('resize', () => { cachedBtnRect = null; }, { passive: true });

    window.addEventListener('mousemove', (e) => {
        if (!isZenMode) return;
        const clientX = e.clientX;
        const clientY = e.clientY;
        if (!rafMagneticId) {
            rafMagneticId = requestAnimationFrame(() => {
                rafMagneticId = null;
                updateMagneticPull(clientX, clientY);
            });
        }
    }, { passive: true });
}

window.setPhysicalSheetFormat = function(id, format) {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    const el = sheet.elements.find(item => item.id === id);
    if (!el) return;

    if (format === 'custom') {
        openCustomSheetModal();
        return;
    }

    const sizes = {
        letter: { w: 816, h: 1056, title: 'Carta (21.6 × 27.9 cm)' },
        a4: { w: 794, h: 1123, title: 'A4 (21.0 × 29.7 cm)' },
        legal: { w: 816, h: 1344, title: 'Oficio (21.6 × 35.6 cm)' },
        tabloid: { w: 1056, h: 1632, title: 'Tabloide (27.9 × 43.2 cm)' },
        a3: { w: 1123, h: 1587, title: 'A3 (29.7 × 42.0 cm)' },
        a5: { w: 559, h: 794, title: 'A5 (14.8 × 21.0 cm)' },
        voucher: { w: 756, h: 321, title: 'Voucher (20.0 × 8.5 cm)' },
        business_card: { w: 321, h: 208, title: 'Tarjeta (8.5 × 5.5 cm)' },
        slide_16_9: { w: 1280, h: 720, title: 'Slide 16:9 (HD)' },
        slide_4_3: { w: 1024, h: 768, title: 'Slide 4:3' }
    };

    const config = sizes[format] || sizes.letter;
    el.format = format;
    const currentPrefix = (el.title || '').match(/^Hoja\s+\d+/i) ? el.title.match(/^Hoja\s+\d+/i)[0] : 'Hoja';
    el.title = `${currentPrefix}: ${config.title.split(' (')[0]}`;

    if (el.orientation === 'landscape') {
        el.width = config.h;
        el.height = config.w;
    } else {
        el.width = config.w;
        el.height = config.h;
    }

    renderElementDOM(el);
    renderTransformBox();
    renderInspector();
    renderSheetNavigator();
    pushHistoryState();
    triggerAutoSave();
};

window.setPhysicalSheetOrientation = function(id, orient) {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    const el = sheet.elements.find(item => item.id === id);
    if (!el || el.orientation === orient) return;

    el.orientation = orient;
    const oldW = el.width;
    el.width = el.height;
    el.height = oldW;

    renderElementDOM(el);
    renderTransformBox();
    renderInspector();
    renderSheetNavigator();
    pushHistoryState();
    triggerAutoSave();
};

window.promptAddTAccountEntry = function(id, type) {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    const el = sheet.elements.find(item => item.id === id);
    if (!el) return;

    const desc = prompt(type === 'debe' ? 'Descripción del Cargo (Debe):' : 'Descripción del Abono (Haber):', type === 'debe' ? 'Ingreso por Venta' : 'Pago de Factura');
    if (!desc) return;

    const amountStr = prompt('Monto ($):', '100.00');
    const amount = parseFloat(amountStr) || 0;

    if (type === 'debe') {
        if (!el.debeEntries) el.debeEntries = [];
        el.debeEntries.push({ text: desc, amount: amount });
    } else {
        if (!el.haberEntries) el.haberEntries = [];
        el.haberEntries.push({ text: desc, amount: amount });
    }

    renderElementDOM(el);
    renderInspector();
    pushHistoryState();
    triggerAutoSave();
};

window.duplicateSelectedElements = function() {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual ? proyecto_actual.sheets[activeSheetIndex] : null;
    if (!sheet) return;

    // Si solo hay una hoja física seleccionada, usar la lógica inteligente de duplicar hoja + contenido
    if (selectedElementIds.size === 1) {
        const singleId = Array.from(selectedElementIds)[0];
        const el = sheet.elements.find(item => item.id === singleId);
        if (el && el.type === 'physical_sheet') {
            duplicatePhysicalSheet(singleId);
            return;
        }
    }

    const newSelected = new Set();
    const clonedElements = [];

    selectedElementIds.forEach(id => {
        const el = sheet.elements.find(item => item.id === id);
        if (el) {
            if (el.type === 'physical_sheet') {
                duplicatePhysicalSheet(el.id);
                return;
            }
            const clone = JSON.parse(JSON.stringify(el));
            clone.id = `${el.type}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
            clone.x += 30;
            clone.y += 30;
            clone.zIndex = ++highestZIndex;
            sheet.elements.push(clone);
            newSelected.add(clone.id);
            clonedElements.push(clone);
        }
    });

    if (newSelected.size > 0) {
        renderAllElements();
        selectedElementIds = newSelected;
        selectedElementId = newSelected.size === 1 ? Array.from(newSelected)[0] : null;
        renderTransformBox();
        renderInspector();

        if (window.LienzoCollabEngine) {
            clonedElements.forEach(clone => window.LienzoCollabEngine.broadcastElementAdd(clone));
        }
        if (window.ViewModeController) {
            window.ViewModeController.renderBackdrop();
        }

        pushHistoryState();
        triggerAutoSave();
    }
};

window.deleteElement = function(id) {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;
    sheet.elements = sheet.elements.filter(el => el.id !== id);
    if (selectedElementId === id || selectedElementIds.has(id)) {
        deselectAll();
    }
    renderAllElements();
    renderSheetNavigator();

    if (window.LienzoCollabEngine) {
        window.LienzoCollabEngine.broadcastElementDelete([id]);
    }
    if (window.ViewModeController) {
        window.ViewModeController.renderBackdrop();
    }

    pushHistoryState();
    triggerAutoSave();
};

window.deleteSelectedElements = function() {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    const deletedIds = Array.from(selectedElementIds);
    sheet.elements = sheet.elements.filter(el => !selectedElementIds.has(el.id));
    deselectAll();
    renderAllElements();
    renderSheetNavigator();

    if (window.LienzoCollabEngine) {
        window.LienzoCollabEngine.broadcastElementDelete(deletedIds);
    }
    if (window.ViewModeController) {
        window.ViewModeController.renderBackdrop();
    }

    pushHistoryState();
    triggerAutoSave();
};

window.alignSelected = function(alignment) {
    if (selectedElementIds.size <= 1 || window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    const selected = sheet.elements.filter(el => selectedElementIds.has(el.id));

    let minX = Math.min(...selected.map(el => el.x));
    let maxX = Math.max(...selected.map(el => el.x + el.width));
    let minY = Math.min(...selected.map(el => el.y));
    let maxY = Math.max(...selected.map(el => el.y + el.height));

    selected.forEach(el => {
        if (alignment === 'left') el.x = minX;
        if (alignment === 'center') el.x = minX + (maxX - minX - el.width) / 2;
        if (alignment === 'right') el.x = maxX - el.width;
        if (alignment === 'top') el.y = minY;
        if (alignment === 'middle') el.y = minY + (maxY - minY - el.height) / 2;
        if (alignment === 'bottom') el.y = maxY - el.height;
    });

    renderAllElements();
    pushHistoryState();
    triggerAutoSave();
};

// =========================================================
// 13. MINIMAPA DE NAVEGACIÓN
// =========================================================
window.toggleMinimap = function() {
    const card = document.getElementById('minimap-card');
    const btn = document.getElementById('btn-toggle-minimap');
    if (card) {
        card.classList.toggle('hidden');
        if (btn) btn.classList.toggle('active', !card.classList.contains('hidden'));
        if (!card.classList.contains('hidden')) updateMinimap();
    }
};

function updateMinimap() {
    if (typeof window.scheduleViewportUpdate === 'function') {
        window.scheduleViewportUpdate({ minimap: true });
    } else {
        renderMinimapDirect();
    }
}

function renderMinimapDirect() {
    const card = document.getElementById('minimap-card');
    if (!card || card.classList.contains('hidden')) return;

    const canvas = document.getElementById('minimap-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sheet = proyecto_actual ? proyecto_actual.sheets[activeSheetIndex] : null;
    if (!sheet) return;

    // Escalar mundo al canvas de 190x125
    const worldBounds = { minX: 0, minY: 0, maxX: 2000, maxY: 1500 };
    const scale = Math.min(canvas.width / worldBounds.maxX, canvas.height / worldBounds.maxY);

    // Dibujar formas
    ctx.fillStyle = '#f59e0b';
    (sheet.elements || []).forEach(el => {
        ctx.fillRect(el.x * scale, el.y * scale, Math.max(3, el.width * scale), Math.max(3, el.height * scale));
    });

    // Indicador del visor
    const viewport = document.getElementById('canvas-viewport');
    const ind = document.getElementById('minimap-viewport-indicator');
    if (viewport && ind) {
        const vx = (-panX / zoom) * scale;
        const vy = (-panY / zoom) * scale;
        const vw = (viewport.clientWidth / zoom) * scale;
        const vh = (viewport.clientHeight / zoom) * scale;

        ind.style.left = `${Math.max(0, vx)}px`;
        ind.style.top = `${Math.max(0, vy)}px`;
        ind.style.width = `${Math.min(canvas.width, vw)}px`;
        ind.style.height = `${Math.min(canvas.height, vh)}px`;
    }
}

// =========================================================
// 14. HISTORIAL (UNDO / REDO)
// =========================================================
function pushHistoryState(immediate = false) {
    if (historyTimeout) clearTimeout(historyTimeout);

    const executePush = () => {
        const sheet = proyecto_actual.sheets[activeSheetIndex];
        if (!sheet) return;

        const snapshot = JSON.stringify({
            elements: sheet.elements,
            freehandStrokes: sheet.freehandStrokes,
            connectors: sheet.connectors
        });

        // Eliminar estados adelantados si se hizo una acción nueva
        if (historyIndex < historyStack.length - 1) {
            historyStack = historyStack.slice(0, historyIndex + 1);
        }

        historyStack.push(snapshot);
        if (historyStack.length > MAX_HISTORY) {
            historyStack.shift();
        }
        historyIndex = historyStack.length - 1;
    };

    if (immediate) {
        executePush();
    } else {
        historyTimeout = setTimeout(executePush, 400);
    }
}

window.undo = function() {
    if (window.isAuditMode) return;
    if (historyIndex > 0) {
        historyIndex--;
        restoreHistoryState(historyStack[historyIndex]);
    }
};

window.redo = function() {
    if (window.isAuditMode) return;
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        restoreHistoryState(historyStack[historyIndex]);
    }
};

function restoreHistoryState(snapshotJson) {
    if (!snapshotJson) return;
    const data = JSON.parse(snapshotJson);
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    sheet.elements = data.elements || [];
    sheet.freehandStrokes = data.freehandStrokes || [];
    sheet.connectors = data.connectors || [];

    renderAllElements();
    renderAllSVG();
    deselectAll();
    triggerAutoSave();
}

// =========================================================
// 15. BIBLIOTECA DE PLANTILLAS CONTABLES Y DE DISEÑO
// =========================================================
window.openTemplatesModal = function() {
    closeAllSubtools();
    const modal = document.getElementById('templates-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
};

window.closeTemplatesModal = function() {
    const modal = document.getElementById('templates-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
};

window.applyTemplate = function(templateId) {
    if (window.isAuditMode) return;
    if (!confirm("¿Cargar esta plantilla? Se añadirán los elementos estructurados al lienzo actual.")) return;
    closeTemplatesModal();

    const sheet = proyecto_actual.sheets[activeSheetIndex];

    if (templateId === 'peps-inventory') {
        // Plantilla PEPS Bodega
        sheet.elements = [
            {
                id: 'peps_title', type: 'text', x: 100, y: 50, width: 450, height: 50, rotation: 0,
                text: '📦 FLUJO PEPS FÍSICO DE BODEGA (FIFO)',
                fontSize: 20, fontWeight: '800', fontFamily: 'Plus Jakarta Sans', textColor: '#f59e0b', fill: 'transparent', zIndex: 10
            },
            {
                id: 'peps_shelf_a', type: 'shape', shapeType: 'rounded-rect', x: 100, y: 120, width: 220, height: 260, rotation: 0,
                text: 'ESTANTERÍA A (Lotes Antiguos)\n\n📍 Prioridad 1 de Despacho',
                fill: '#fee2e2', stroke: '#ef4444', strokeWidth: 2, borderRadius: 16, fontSize: 13, textColor: '#991b1b', zIndex: 11
            },
            {
                id: 'peps_shelf_b', type: 'shape', shapeType: 'rounded-rect', x: 400, y: 120, width: 220, height: 260, rotation: 0,
                text: 'ESTANTERÍA B (Lotes Nuevos)\n\n📍 En Espera de Rotación',
                fill: '#dcfce7', stroke: '#10b981', strokeWidth: 2, borderRadius: 16, fontSize: 13, textColor: '#166534', zIndex: 11
            },
            {
                id: 'peps_lot1', type: 'note', x: 130, y: 220, width: 160, height: 120, rotation: -2,
                text: 'Lote #001\nIngreso: 01/Ago\nCosto: $10.00 c/u\n\nDESPACHAR AHORA',
                color: '#fca5a5', hasPin: true, fontSize: 11, textColor: '#7f1d1d', zIndex: 15
            },
            {
                id: 'peps_lot2', type: 'note', x: 430, y: 220, width: 160, height: 120, rotation: 2,
                text: 'Lote #002\nIngreso: 15/Ago\nCosto: $11.50 c/u\n\nRESERVA DE STOCK',
                color: '#86efac', hasPin: true, fontSize: 11, textColor: '#14532d', zIndex: 15
            }
        ];
    } else if (templateId === 'abc-matrix') {
        // Clasificación ABC
        sheet.elements = [
            {
                id: 'abc_title', type: 'text', x: 100, y: 50, width: 450, height: 50, rotation: 0,
                text: '🏷️ ANÁLISIS Y MATRIZ ABC DE INVENTARIOS',
                fontSize: 20, fontWeight: '800', fontFamily: 'Plus Jakarta Sans', textColor: '#f59e0b', fill: 'transparent', zIndex: 10
            },
            {
                id: 'abc_za', type: 'shape', shapeType: 'rounded-rect', x: 100, y: 120, width: 220, height: 240, rotation: 0,
                text: 'ZONA A (Alta Inversión)\n\n• 80% del Valor Monetario\n• 20% del Stock Físico\n• Auditoría Diaria / Semanal',
                fill: '#fee2e2', stroke: '#ef4444', strokeWidth: 2, borderRadius: 16, fontSize: 12, textColor: '#7f1d1d', zIndex: 11
            },
            {
                id: 'abc_zb', type: 'shape', shapeType: 'rounded-rect', x: 350, y: 120, width: 220, height: 240, rotation: 0,
                text: 'ZONA B (Inversión Media)\n\n• 15% del Valor Monetario\n• 30% del Stock Físico\n• Control Mensual',
                fill: '#ffedd5', stroke: '#f97316', strokeWidth: 2, borderRadius: 16, fontSize: 12, textColor: '#7c2d12', zIndex: 11
            },
            {
                id: 'abc_zc', type: 'shape', shapeType: 'rounded-rect', x: 600, y: 120, width: 220, height: 240, rotation: 0,
                text: 'ZONA C (Baja Inversión)\n\n• 5% del Valor Monetario\n• 50% del Stock Físico\n• Conteo Trimestral / Anual',
                fill: '#dcfce7', stroke: '#10b981', strokeWidth: 2, borderRadius: 16, fontSize: 12, textColor: '#14532d', zIndex: 11
            }
        ];
    } else if (templateId === 't-accounts') {
        // Esquemas de Mayor (Cuentas T)
        sheet.elements = [
            {
                id: 't_acc_1', type: 'table', x: 100, y: 100, width: 300, height: 180, rotation: 0,
                title: 'CUENTA: 1101 CAJA Y BANCOS',
                headers: ['Debe (Cargos)', 'Haber (Abonos)'],
                rows: [
                    ['$5,000.00', '$1,200.00'],
                    ['$2,400.00', '$800.00'],
                    ['$7,400.00 (Total)', '$2,000.00 (Total)']
                ],
                zIndex: 10
            },
            {
                id: 't_acc_2', type: 'table', x: 450, y: 100, width: 300, height: 180, rotation: 0,
                title: 'CUENTA: 2101 PROVEEDORES',
                headers: ['Debe (Cargos)', 'Haber (Abonos)'],
                rows: [
                    ['$1,200.00', '$3,500.00'],
                    ['$800.00', '$1,000.00'],
                    ['$2,000.00 (Total)', '$4,500.00 (Total)']
                ],
                zIndex: 10
            },
            {
                id: 't_summary_note', type: 'note', x: 300, y: 320, width: 250, height: 130, rotation: 0,
                text: 'SALDO DEUDOR (Caja): $5,400.00\nSALDO ACREEDOR (Prov): $2,500.00\n\nPartida Cuadrada según Principio de Partida Doble.',
                color: '#fef08a', hasPin: true, fontSize: 11, textColor: '#78350f', zIndex: 15
            }
        ];
    } else if (templateId === 'business-canvas') {
        // Business Model Canvas
        const blocks = [
            { title: '1. Socios Clave', x: 50, y: 100, w: 180, h: 260, color: '#fef3c7' },
            { title: '2. Actividades Clave', x: 240, y: 100, w: 180, h: 125, color: '#e0f2fe' },
            { title: '6. Recursos Clave', x: 240, y: 235, w: 180, h: 125, color: '#e0f2fe' },
            { title: '3. Propuesta de Valor', x: 430, y: 100, w: 180, h: 260, color: '#fbcfe8' },
            { title: '4. Relaciones Cliente', x: 620, y: 100, w: 180, h: 125, color: '#dcfce7' },
            { title: '7. Canales', x: 620, y: 235, w: 180, h: 125, color: '#dcfce7' },
            { title: '5. Segmentos Clientes', x: 810, y: 100, w: 180, h: 260, color: '#fed7aa' },
            { title: '8. Estructura de Costos', x: 50, y: 370, w: 460, h: 140, color: '#f1f5f9' },
            { title: '9. Fuentes de Ingresos', x: 520, y: 370, w: 470, h: 140, color: '#f1f5f9' }
        ];

        sheet.elements = blocks.map((b, i) => ({
            id: `canvas_b_${i}`,
            type: 'shape',
            shapeType: 'rounded-rect',
            x: b.x, y: b.y, width: b.w, height: b.h, rotation: 0,
            text: b.title,
            fill: b.color, stroke: '#64748b', strokeWidth: 1.5, borderRadius: 12,
            fontSize: 12, textColor: '#1e293b', textAlign: 'center', zIndex: 10
        }));
    } else if (templateId === 'swot-matrix') {
        // Matriz FODA
        sheet.elements = [
            {
                id: 'swot_f', type: 'shape', shapeType: 'rounded-rect', x: 100, y: 100, width: 260, height: 200, rotation: 0,
                text: '💪 FORTALEZAS (Internas)\n\n• Solidez financiera\n• Marca reconocida\n• Control de costos PEPS',
                fill: '#dcfce7', stroke: '#10b981', strokeWidth: 2, borderRadius: 16, fontSize: 12, textColor: '#14532d', zIndex: 10
            },
            {
                id: 'swot_o', type: 'shape', shapeType: 'rounded-rect', x: 380, y: 100, width: 260, height: 200, rotation: 0,
                text: '🚀 OPORTUNIDADES (Externas)\n\n• Nuevos mercados locales\n• Incentivos fiscales MH\n• Digitalización de procesos',
                fill: '#e0f2fe', stroke: '#0284c7', strokeWidth: 2, borderRadius: 16, fontSize: 12, textColor: '#075985', zIndex: 10
            },
            {
                id: 'swot_d', type: 'shape', shapeType: 'rounded-rect', x: 100, y: 320, width: 260, height: 200, rotation: 0,
                text: '⚠️ DEBILIDADES (Internas)\n\n• Capacidad de almacenaje limitada\n• Dependencia de proveedores clave',
                fill: '#fef3c7', stroke: '#f59e0b', strokeWidth: 2, borderRadius: 16, fontSize: 12, textColor: '#78350f', zIndex: 10
            },
            {
                id: 'swot_a', type: 'shape', shapeType: 'rounded-rect', x: 380, y: 320, width: 260, height: 200, rotation: 0,
                text: '🛑 AMENAZAS (Externas)\n\n• Inflación de insumos\n• Nuevos competidores de bajo costo',
                fill: '#fee2e2', stroke: '#ef4444', strokeWidth: 2, borderRadius: 16, fontSize: 12, textColor: '#991b1b', zIndex: 10
            }
        ];
    } else if (templateId === 'ui-mockup') {
        // UI Mockup
        sheet.elements = [
            {
                id: 'ui_mockup_window', type: 'shape', shapeType: 'rounded-rect', x: 100, y: 80, width: 620, height: 400, rotation: 0,
                text: '', fill: '#ffffff', stroke: '#cbd5e1', strokeWidth: 2, borderRadius: 20, zIndex: 5
            },
            {
                id: 'ui_mockup_header', type: 'text', x: 130, y: 100, width: 300, height: 40, rotation: 0,
                text: 'EduConta SV — Panel Contable',
                fontSize: 16, fontWeight: '800', fontFamily: 'Plus Jakarta Sans', textColor: '#1e293b', fill: 'transparent', zIndex: 10
            },
            {
                id: 'ui_kpi1', type: 'ui', uiType: 'kpi-card', x: 130, y: 160, width: 170, height: 80, rotation: 0,
                title: 'Ingresos Totales', value: '$24,500.00', badgeText: '+15%', badgeType: 'success', zIndex: 12
            },
            {
                id: 'ui_kpi2', type: 'ui', uiType: 'kpi-card', x: 320, y: 160, width: 170, height: 80, rotation: 0,
                title: 'Gastos Operativos', value: '$8,200.00', badgeText: '-4%', badgeType: 'amber', zIndex: 12
            },
            {
                id: 'ui_kpi3', type: 'ui', uiType: 'kpi-card', x: 510, y: 160, width: 170, height: 80, rotation: 0,
                title: 'Utilidad Neta', value: '$16,300.00', badgeText: 'Excelente', badgeType: 'success', zIndex: 12
            }
        ];
    }

    renderAllElements();
    renderAllSVG();
    pushHistoryState();
    triggerAutoSave();
};

// =========================================================
// 16. EXPORTACIÓN (PDF MULTIPÁGINA, PNG, SVG, BACKUP .EDC)
// =========================================================
window.exportAllSheetsToPDF = async function() {
    closeAllSubtools();
    const sheet = proyecto_actual ? proyecto_actual.sheets[activeSheetIndex] : null;
    if (!sheet) return;

    const physicalSheets = (sheet.elements || []).filter(el => el.type === 'physical_sheet');
    if (physicalSheets.length === 0) {
        alert("No hay hojas físicas en el lienzo. Inserta al menos una hoja (Carta, A4, A5...) antes de exportar a PDF.");
        return;
    }

    // Ordenar hojas de izquierda a derecha (o por orden de inserción)
    physicalSheets.sort((a, b) => a.x - b.x);

    const { jsPDF } = window.jspdf || window;
    if (!jsPDF) {
        alert("El motor PDF se está cargando. Por favor intenta de nuevo en unos segundos.");
        return;
    }

    showToastNotification(`Generando PDF con ${physicalSheets.length} hojas...`);

    const first = physicalSheets[0];
    const firstOrient = first.width > first.height ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
        orientation: firstOrient,
        unit: 'pt',
        format: [first.width, first.height]
    });

    for (let i = 0; i < physicalSheets.length; i++) {
        const curSheet = physicalSheets[i];
        if (i > 0) {
            const orient = curSheet.width > curSheet.height ? 'landscape' : 'portrait';
            pdf.addPage([curSheet.width, curSheet.height], orient);
        }

        const scale = 2; // Alta definición 2x
        const offCanvas = document.createElement('canvas');
        offCanvas.width = curSheet.width * scale;
        offCanvas.height = curSheet.height * scale;
        const ctx = offCanvas.getContext('2d');
        ctx.scale(scale, scale);

        // Fondo blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, curSheet.width, curSheet.height);

        // Buscar elementos contenidos
        const contained = (sheet.elements || []).filter(el => {
            if (el.id === curSheet.id) return false;
            return (
                el.x + (el.width || 0) > curSheet.x &&
                el.x < curSheet.x + curSheet.width &&
                el.y + (el.height || 0) > curSheet.y &&
                el.y < curSheet.y + curSheet.height
            );
        });

        contained.sort((a, b) => (a.zIndex || 10) - (b.zIndex || 10));

        contained.forEach(el => {
            const relX = el.x - curSheet.x;
            const relY = el.y - curSheet.y;

            ctx.save();
            ctx.translate(relX + (el.width || 0) / 2, relY + (el.height || 0) / 2);
            if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);

            const w = el.width || 100;
            const h = el.height || 50;

            if (el.type === 'shape' || el.type === 'note' || el.type === 'ui') {
                ctx.fillStyle = el.fill || el.color || '#fef3c7';
                ctx.strokeStyle = el.stroke || '#f59e0b';
                ctx.lineWidth = el.strokeWidth || 1.5;
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, el.borderRadius || 8);
                else ctx.rect(-w / 2, -h / 2, w, h);
                ctx.fill();
                if (el.stroke) ctx.stroke();
            }

            if (el.type === 't_account') {
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 2;
                if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, 12);
                else ctx.rect(-w / 2, -h / 2, w, h);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(-w / 2, -h / 2, w, 30);
                ctx.fillStyle = '#0f172a';
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(el.title || 'Cuenta T', 0, -h / 2 + 18);

                ctx.beginPath();
                ctx.moveTo(0, -h / 2 + 30);
                ctx.lineTo(0, h / 2 - 25);
                ctx.moveTo(-w / 2, -h / 2 + 30);
                ctx.lineTo(w / 2, -h / 2 + 30);
                ctx.stroke();

                const debeTotal = (el.debeEntries || []).reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
                const haberTotal = (el.haberEntries || []).reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
                ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
                ctx.fillStyle = '#059669';
                ctx.textAlign = 'left';
                ctx.fillText(`DEBE: $${debeTotal.toFixed(2)}`, -w / 2 + 8, h / 2 - 8);
                ctx.fillStyle = '#dc2626';
                ctx.textAlign = 'right';
                ctx.fillText(`HABER: $${haberTotal.toFixed(2)}`, w / 2 - 8, h / 2 - 8);
            }

            if (el.text) {
                ctx.fillStyle = el.textColor || '#1e293b';
                ctx.font = `${el.fontWeight || 'bold'} ${el.fontSize || 12}px ${el.fontFamily || 'sans-serif'}`;
                ctx.textAlign = el.textAlign || 'center';
                ctx.textBaseline = 'middle';
                const lines = (el.text || '').split('\n');
                lines.forEach((line, lineIdx) => {
                    ctx.fillText(line, 0, (lineIdx - (lines.length - 1) / 2) * ((el.fontSize || 12) + 4));
                });
            }

            ctx.restore();
        });

        const imgData = offCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, curSheet.width, curSheet.height);
    }

    const filename = `${proyecto_actual.name || 'EduConta_Lienzo'}_${physicalSheets.length}_Hojas.pdf`;
    pdf.save(filename);
    showToastNotification(`📄 PDF descargado con éxito (${physicalSheets.length} páginas)`);
};

window.exportCanvasAsImage = function(format = 'png') {
    closeAllSubtools();
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet || sheet.elements.length === 0) {
        alert("El lienzo está vacío. Añade algunos elementos antes de exportar.");
        return;
    }

    // Calcular límites de todos los elementos
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    sheet.elements.forEach(el => {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
    });

    const padding = 50;
    const width = (maxX - minX + padding * 2) || 800;
    const height = (maxY - minY + padding * 2) || 600;

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width * 2; // 2x Retina Resolution
    offscreenCanvas.height = height * 2;
    const ctx = offscreenCanvas.getContext('2d');
    ctx.scale(2, 2);

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Dibujar elementos
    sheet.elements.forEach(el => {
        const renderX = el.x - minX + padding;
        const renderY = el.y - minY + padding;

        ctx.save();
        ctx.translate(renderX + el.width / 2, renderY + el.height / 2);
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);

        // Rectángulo / Forma
        ctx.fillStyle = el.fill || el.color || '#fef3c7';
        ctx.strokeStyle = el.stroke || '#f59e0b';
        ctx.lineWidth = el.strokeWidth || 1.5;

        if (el.type === 'shape' || el.type === 'note' || el.type === 'ui') {
            ctx.beginPath();
            ctx.roundRect(-el.width / 2, -el.height / 2, el.width, el.height, el.borderRadius || 8);
            ctx.fill();
            if (el.stroke) ctx.stroke();
        }

        // Texto
        if (el.text) {
            ctx.fillStyle = el.textColor || '#1e293b';
            ctx.font = `bold ${el.fontSize || 12}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const lines = el.text.split('\n');
            lines.forEach((line, i) => {
                ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * ((el.fontSize || 12) + 4));
            });
        }

        ctx.restore();
    });

    // Descargar imagen
    const link = document.createElement('a');
    link.download = `${proyecto_actual.name || 'lienzo'}_${sheet.name || 'pagina'}.${format}`;
    link.href = offscreenCanvas.toDataURL(`image/${format}`);
    link.click();
    showToastNotification("Imagen exportada en alta resolución");
};

window.exportCanvasAsSVG = function() {
    closeAllSubtools();
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">\n`;
    svgContent += `  <rect width="100%" height="100%" fill="#f8fafc"/>\n`;

    sheet.elements.forEach(el => {
        svgContent += `  <rect x="${Number(el.x) || 0}" y="${Number(el.y) || 0}" width="${Number(el.width) || 0}" height="${Number(el.height) || 0}" rx="${Number(el.borderRadius) || 8}" fill="${escapeHtml(el.fill || el.color || '#fef3c7')}" stroke="${escapeHtml(el.stroke || '#f59e0b')}" stroke-width="${Number(el.strokeWidth) || 1.5}"/>\n`;
        if (el.text) {
            svgContent += `  <text x="${(Number(el.x) || 0) + (Number(el.width) || 0) / 2}" y="${(Number(el.y) || 0) + (Number(el.height) || 0) / 2}" font-family="sans-serif" font-size="${Number(el.fontSize) || 12}" fill="${escapeHtml(el.textColor || '#1e293b')}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(String(el.text).replace(/\n/g, ' '))}</text>\n`;
        }
    });

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${proyecto_actual.name || 'lienzo'}.svg`;
    link.click();
    showToastNotification("Vector SVG exportado");
};

window.exportarBackupLienzos = function() {
    closeAllSubtools();
    if (!proyecto_actual) return;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(proyecto_actual, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${proyecto_actual.name || 'lienzo'}_backup.edc`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToastNotification("Backup .edc exportado con éxito");
};

// =========================================================
// 17. ATAJOS DE TECLADO
// =========================================================
function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        // Ignorar si se está escribiendo en un input o contenteditable
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        const isEditable = document.activeElement && document.activeElement.getAttribute('contenteditable') === 'true';
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || isEditable) {
            return;
        }

        // Tab o F11 -> Alternar Modo Inmersivo Zen
        if (e.key === 'Tab' || e.key === 'F11') {
            e.preventDefault();
            toggleZenMode();
            return;
        }

        // Escape para salir de Modo Zen
        if (e.key === 'Escape' && isZenMode) {
            e.preventDefault();
            toggleZenMode();
            return;
        }

        // Espacio para Paneo Temporal
        if (e.code === 'Space' && !isSpacePressed) {
            isSpacePressed = true;
            document.getElementById('canvas-viewport').style.cursor = 'grab';
        }

        // Shift + R -> Alternar Reglas Graduadas
        if (e.shiftKey && (e.key === 'R' || e.key === 'r')) {
            e.preventDefault();
            toggleRulersVisibility();
            return;
        }

        // L -> Alternar Panel de Capas
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey && (e.key === 'l' || e.key === 'L')) {
            e.preventDefault();
            toggleLayersPanel();
            return;
        }

        // V -> Puntero
        if (e.key === 'v' || e.key === 'V') setActiveTool('select');
        // H -> Mano
        if (e.key === 'h' || e.key === 'H') setActiveTool('hand');
        // F o A -> Hojas Físicas / Artboards
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey && (e.key === 'f' || e.key === 'F' || e.key === 'a' || e.key === 'A')) {
            toggleSubtool('sheets-popover');
        }
        // R -> Rectángulo
        if (!e.shiftKey && !e.ctrlKey && (e.key === 'r' || e.key === 'R')) addShapeToCanvas('rounded-rect');
        // T -> Texto Libre
        if (e.key === 't' || e.key === 'T') addTextBlock();
        // N -> Nota Adhesiva
        if (e.key === 'n' || e.key === 'N') addStickyNote();
        // P -> Pincel
        if (e.key === 'p' || e.key === 'P') setActiveTool('brush');

        // Ctrl + Z -> Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            undo();
        }
        // Ctrl + Y -> Redo
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            redo();
        }

        // Ctrl + D -> Duplicar
        if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            duplicateSelectedElements();
        }

        // Ctrl + ] / Ctrl + [ -> Reordenar Capas
        if ((e.ctrlKey || e.metaKey) && e.key === ']') {
            e.preventDefault();
            bringSelectedLayerForward();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === '[') {
            e.preventDefault();
            sendSelectedLayerBackward();
        }

        // Delete / Backspace -> Eliminar
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedElementIds.size > 0) {
                e.preventDefault();
                deleteSelectedElements();
            }
        }

        // Navegación de Diapositivas en Modo Presentación
        if (currentViewMode === 'presentacion') {
            if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                e.preventDefault();
                nextSlide();
                return;
            }
            if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                prevSlide();
                return;
            }
        }

        // ? -> Modal de Atajos
        if (e.key === '?') {
            openShortcutsModal();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            isSpacePressed = false;
            document.getElementById('canvas-viewport').style.cursor = activeTool === 'hand' ? 'grab' : 'default';
        }
    });
}

window.openShortcutsModal = function() {
    const modal = document.getElementById('shortcuts-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
};

window.closeShortcutsModal = function() {
    const modal = document.getElementById('shortcuts-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
};

// =========================================================
// 18. CONTROLADOR DE TIPOS DE VISTA (ViewModeController)
// =========================================================
const ViewModeController = {
    PAGE_DIMENSIONS: {
        letter: { width: 816, height: 1056, name: 'Carta (Letter 8.5" x 11")' },
        a4:     { width: 794, height: 1123, name: 'A4 Estándar (210 x 297 mm)' },
        legal:  { width: 816, height: 1344, name: 'Oficio (Legal 8.5" x 14")' }
    },
    SLIDE_DIMENSIONS: {
        '16:9': { width: 1280, height: 720, name: 'Panorámica 16:9 (HD)' },
        '4:3':  { width: 1024, height: 768, name: 'Estándar 4:3' }
    },

    init() {
        if (proyecto_actual) {
            currentViewMode = proyecto_actual.viewMode || 'lienzo';
            pageSize = proyecto_actual.pageSize || 'letter';
            pageOrientation = proyecto_actual.pageOrientation || 'portrait';
        }
        this.updateButtonsUI();
        this.renderBackdrop();
    },

    setViewMode(mode) {
        if (!['lienzo', 'hoja', 'presentacion', 'tablero'].includes(mode)) mode = 'lienzo';
        currentViewMode = mode;
        if (proyecto_actual) {
            proyecto_actual.viewMode = mode;
        }

        this.updateButtonsUI();
        this.renderBackdrop();

        const presenterBar = document.getElementById('slide-presenter-bar');
        if (presenterBar) {
            presenterBar.style.display = mode === 'presentacion' ? 'block' : 'none';
        }

        // Auto-encuadre elegante según la vista seleccionada
        if (mode === 'hoja') {
            panX = 120;
            panY = 175;
            zoom = 0.85;
            updateWorldTransform();
            showToastNotification("Modo Hoja Paginada: Formato Documento Formal");
        } else if (mode === 'presentacion') {
            currentSlideIndex = 0;
            this.focusSlide(0);
            showToastNotification("Modo Presentación: Diapositivas 16:9");
        } else if (mode === 'tablero') {
            panX = 80;
            panY = 175;
            zoom = 0.75;
            updateWorldTransform();
            showToastNotification("Modo Tablero: Secciones de Trabajo");
        } else {
            showToastNotification("Modo Lienzo Infinito");
        }

        if (window.LienzoCollabEngine) {
            window.LienzoCollabEngine.broadcastViewMode(mode);
        }

        triggerAutoSave();
    },

    setPageSize(size) {
        if (!this.PAGE_DIMENSIONS[size]) size = 'letter';
        pageSize = size;
        if (proyecto_actual) proyecto_actual.pageSize = size;

        // Actualizar botones en popover
        ['letter', 'a4', 'legal'].forEach(s => {
            const btn = document.getElementById(`btn-pagesize-${s}`);
            if (btn) {
                btn.className = s === size 
                    ? 'py-1.5 px-2 bg-amber-500 text-white rounded-xl text-[10px] font-bold text-center shadow-sm'
                    : 'py-1.5 px-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-bold text-center';
            }
        });

        this.renderBackdrop();
        triggerAutoSave();
    },

    setPageOrientation(orient) {
        if (!['portrait', 'landscape'].includes(orient)) orient = 'portrait';
        pageOrientation = orient;
        if (proyecto_actual) proyecto_actual.pageOrientation = orient;

        // Actualizar botones en popover
        ['portrait', 'landscape'].forEach(o => {
            const btn = document.getElementById(`btn-pageorient-${o}`);
            if (btn) {
                btn.className = o === orient 
                    ? 'py-1.5 px-2 bg-amber-500 text-white rounded-xl text-[10px] font-bold text-center flex items-center justify-center gap-1 shadow-sm'
                    : 'py-1.5 px-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-bold text-center flex items-center justify-center gap-1';
            }
        });

        this.renderBackdrop();
        triggerAutoSave();
    },

    toggleConfigPopover() {
        const pop = document.getElementById('view-config-popover');
        if (!pop) return;
        pop.classList.toggle('hidden');
    },

    updateButtonsUI() {
        ['lienzo', 'hoja', 'presentacion', 'tablero'].forEach(m => {
            const btn = document.getElementById(`viewmode-btn-${m}`);
            if (btn) {
                btn.classList.toggle('active', m === currentViewMode);
            }
        });
    },

    renderBackdrop() {
        const backdrop = document.getElementById('canvas-viewmode-backdrop');
        if (!backdrop || !proyecto_actual) return;
        backdrop.innerHTML = '';

        const sheet = proyecto_actual.sheets[activeSheetIndex];
        if (!sheet) return;

        if (currentViewMode === 'lienzo') {
            // Lienzo infinito: nada en el fondo
            return;
        }

        if (currentViewMode === 'hoja') {
            this.renderPageSheets(backdrop, sheet);
        } else if (currentViewMode === 'presentacion') {
            this.renderSlideFrames(backdrop, sheet);
        } else if (currentViewMode === 'tablero') {
            this.renderBoardFrames(backdrop, sheet);
        }
    },

    renderPageSheets(container, sheet) {
        let baseDims = this.PAGE_DIMENSIONS[pageSize] || this.PAGE_DIMENSIONS.letter;
        let w = pageOrientation === 'landscape' ? baseDims.height : baseDims.width;
        let h = pageOrientation === 'landscape' ? baseDims.width : baseDims.height;
        const pageGap = 50;
        const startX = 100;
        const startY = 60;

        // Calcular cuántas páginas físicas se necesitan según la posición Y máxima de los elementos
        let maxY = startY + h;
        (sheet.elements || []).forEach(el => {
            if (el.y + el.height > maxY) {
                maxY = el.y + el.height;
            }
        });

        const numPages = Math.max(1, Math.ceil((maxY - startY) / (h + pageGap)));
        let html = '';

        for (let i = 0; i < numPages; i++) {
            const pageTop = startY + i * (h + pageGap);
            html += `
                <div class="page-sheet-item ${i === 0 ? 'active-page' : ''}" style="left: ${startX}px; top: ${pageTop}px; width: ${w}px; height: ${h}px;">
                    <!-- Cabecera de Página Formal -->
                    <div class="page-sheet-header">
                        <span class="flex items-center gap-1.5 text-amber-500 font-extrabold tracking-wider uppercase text-[9px]">
                            <i class="fas fa-shield-halved"></i> ${proyecto_actual.name || 'EduConta SV'}
                        </span>
                        <span class="text-[9px] tabular-nums font-medium opacity-80">${new Date().toLocaleDateString('es-SV')} • NIIF / NIC</span>
                    </div>

                    <!-- Guía Punteada de Márgenes de Impresión (35px) -->
                    <div class="page-margin-guide" style="left: 35px; top: 35px; width: ${w - 70}px; height: ${h - 70}px;"></div>

                    <!-- Pie de Página Formal con Foliado -->
                    <div class="page-sheet-footer">
                        <span>Documento Registral • República de El Salvador</span>
                        <span class="font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Página ${i + 1} de ${numPages}</span>
                    </div>
                </div>
            `;
        }

        // Botón para expandir / añadir página
        const nextTop = startY + numPages * (h + pageGap) + 10;
        html += `
            <div style="position: absolute; left: ${startX + w / 2 - 90}px; top: ${nextTop}px; pointer-events: auto;">
                <button onclick="ViewModeController.addExtraPage()" class="btn-clean-amber px-5 py-2.5 flex items-center gap-2 text-xs shadow-lg">
                    <i class="fas fa-plus"></i> <span>Añadir Página (${numPages + 1})</span>
                </button>
            </div>
        `;

        container.innerHTML = html;
    },

    addExtraPage() {
        if (window.isAuditMode) return;
        const sheet = proyecto_actual.sheets[activeSheetIndex];
        let baseDims = this.PAGE_DIMENSIONS[pageSize] || this.PAGE_DIMENSIONS.letter;
        let h = pageOrientation === 'landscape' ? baseDims.width : baseDims.height;
        const pageGap = 50;
        const startY = 60;
        
        let maxY = 0;
        (sheet.elements || []).forEach(el => {
            if (el.y + el.height > maxY) maxY = el.y + el.height;
        });

        const currentPages = Math.max(1, Math.ceil((maxY - startY) / (h + pageGap)));
        const newPageTop = startY + currentPages * (h + pageGap) + 80;

        // Añadir una nota o título de inicio de sección en la nueva página
        const newElem = {
            id: 'text_page_' + Date.now(),
            type: 'text',
            x: 160,
            y: newPageTop,
            width: 300,
            height: 45,
            rotation: 0,
            text: `Sección / Página ${currentPages + 1}`,
            fontSize: 16,
            fontWeight: '800',
            fontFamily: 'Plus Jakarta Sans',
            textColor: '#1e293b',
            zIndex: ++highestZIndex
        };

        sheet.elements.push(newElem);
        renderElementDOM(newElem);
        this.renderBackdrop();
        selectElement(newElem.id);
        pushHistoryState();
        triggerAutoSave();
    },

    renderSlideFrames(container, sheet) {
        const slideW = 1280;
        const slideH = 720;
        const gap = 120;
        const startX = 100;
        const startY = 80;

        // Determinar cantidad de slides por elementos
        let maxX = startX + slideW;
        (sheet.elements || []).forEach(el => {
            if (el.x + el.width > maxX) maxX = el.x + el.width;
        });

        totalSlides = Math.max(2, Math.ceil((maxX - startX) / (slideW + gap)));
        let html = '';

        for (let i = 0; i < totalSlides; i++) {
            const slideLeft = startX + i * (slideW + gap);
            const isCurrent = i === currentSlideIndex;
            html += `
                <div id="slide-frame-${i}" class="slide-frame-item ${isCurrent ? 'current-slide' : ''}" style="left: ${slideLeft}px; top: ${startY}px; width: ${slideW}px; height: ${slideH}px;">
                    <div class="absolute top-4 left-6 flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full bg-amber-500"></span>
                        <span class="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Diapositiva ${i + 1}</span>
                    </div>
                    <div class="absolute bottom-4 right-6 text-[10px] tabular-nums text-slate-400">
                        ${proyecto_actual.name || 'EduConta SV'} • 16:9
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
        this.updateSlideCounterUI();
    },

    renderBoardFrames(container, sheet) {
        const frames = [
            { title: '📋 SECCIÓN 1: PLANIFICACIÓN & CUENTAS', x: 80, y: 60, w: 760, h: 720 },
            { title: '📊 SECCIÓN 2: REGISTROS & BALANCES',    x: 880, y: 60, w: 760, h: 720 },
            { title: '📈 SECCIÓN 3: INFORMES & AUDITORÍA',   x: 1680, y: 60, w: 760, h: 720 }
        ];

        let html = '';
        frames.forEach(f => {
            html += `
                <div class="board-frame-item" style="left: ${f.x}px; top: ${f.y}px; width: ${f.w}px; height: ${f.h}px;">
                    <div class="board-frame-badge">${f.title}</div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    focusSlide(idx) {
        if (idx < 0) idx = 0;
        if (idx >= totalSlides) idx = totalSlides - 1;
        currentSlideIndex = idx;

        const slideW = 1280;
        const gap = 120;
        const startX = 100;
        const slideLeft = startX + idx * (slideW + gap);

        const viewport = document.getElementById('canvas-viewport');
        const vW = viewport ? viewport.clientWidth : 1200;
        const vH = viewport ? viewport.clientHeight : 800;

        zoom = Math.min(1.0, (vW - 80) / slideW, (vH - 120) / 720);
        panX = (vW - slideW * zoom) / 2 - slideLeft * zoom;
        panY = (vH - 720 * zoom) / 2 - 80 * zoom;

        updateWorldTransform();
        this.renderBackdrop();
        this.updateSlideCounterUI();
    },

    nextSlide() {
        if (currentSlideIndex < totalSlides - 1) {
            this.focusSlide(currentSlideIndex + 1);
        }
    },

    prevSlide() {
        if (currentSlideIndex > 0) {
            this.focusSlide(currentSlideIndex - 1);
        }
    },

    updateSlideCounterUI() {
        const badge = document.getElementById('slide-counter-badge');
        if (badge) {
            badge.textContent = `Diapositiva ${currentSlideIndex + 1} / ${totalSlides}`;
        }
    },

    toggleFullscreen() {
        const elem = document.documentElement;
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }
};

window.ViewModeController = ViewModeController;
window.setViewMode = (m) => ViewModeController.setViewMode(m);
window.setPageSize = (s) => ViewModeController.setPageSize(s);
window.setPageOrientation = (o) => ViewModeController.setPageOrientation(o);
window.toggleViewSettingsPopover = () => ViewModeController.toggleConfigPopover();
window.renderViewModeBackdrop = () => ViewModeController.renderBackdrop();
window.nextSlide = () => ViewModeController.nextSlide();
window.prevSlide = () => ViewModeController.prevSlide();
window.toggleSlideFullscreen = () => ViewModeController.toggleFullscreen();


// =========================================================
// 19. MOTOR DE COLABORACIÓN EN TIEMPO REAL (LienzoCollabEngine)
// =========================================================
const LienzoCollabEngine = {
    channel: null,
    userId: null,
    userName: 'Colaborador',
    userColor: '#f59e0b',
    presences: {},
    remoteCursors: new Map(), // userId -> { x, y, lastSeen }
    remoteSelections: new Map(), // userId -> { elementId, userName, userColor }
    lastCursorBroadcast: 0,

    PALETTE: [
        '#0ea5e9', '#10b981', '#8b5cf6', '#f43f5e', 
        '#f59e0b', '#06b6d4', '#ec4899', '#3b82f6', '#14b8a6'
    ],

    async init(projectId) {
        if (typeof supabaseClient === 'undefined' || !projectId) {
            this.renderLocalPresence();
            return;
        }

        // 1. Obtener usuario o generar perfil anónimo consistente
        let session = null;
        try {
            const res = await supabaseClient.auth.getSession();
            session = res.data?.session;
        } catch (e) {}

        if (session && session.user) {
            this.userId = session.user.id;
            this.userName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario';
        } else {
            let storedUid = sessionStorage.getItem('educonta_collab_uid');
            if (!storedUid) {
                storedUid = 'guest_' + Math.random().toString(36).substring(2, 9);
                sessionStorage.setItem('educonta_collab_uid', storedUid);
            }
            this.userId = storedUid;
            this.userName = sessionStorage.getItem('educonta_collab_name') || `Invitado ${Math.floor(100 + Math.random() * 900)}`;
        }

        // Asignar color distintivo según el hash del ID
        let hash = 0;
        for (let i = 0; i < this.userId.length; i++) hash += this.userId.charCodeAt(i);
        this.userColor = this.PALETTE[Math.abs(hash) % this.PALETTE.length];

        // 2. Suscripción a canal Realtime Supabase con Presence y Broadcast
        if (this.channel) {
            supabaseClient.removeChannel(this.channel);
        }

        this.channel = supabaseClient.channel(`collab-lienzo-${projectId}`, {
            config: {
                presence: { key: this.userId },
                broadcast: { ack: false }
            }
        });

        this.channel
            // Presencia (Usuarios Conectados)
            .on('presence', { event: 'sync' }, () => this.handlePresenceSync())
            .on('presence', { event: 'join' }, ({ newPresences }) => this.handleUserJoin(newPresences))
            .on('presence', { event: 'leave' }, ({ leftPresences }) => this.handleUserLeave(leftPresences))
            // Eventos en Vivo (Cursores, Selecciones, Elementos)
            .on('broadcast', { event: 'cursor' }, ({ payload }) => this.handleRemoteCursor(payload))
            .on('broadcast', { event: 'selection' }, ({ payload }) => this.handleRemoteSelection(payload))
            .on('broadcast', { event: 'element_add' }, ({ payload }) => this.handleRemoteElementAdd(payload))
            .on('broadcast', { event: 'element_patch' }, ({ payload }) => this.handleRemoteElementPatch(payload))
            .on('broadcast', { event: 'element_delete' }, ({ payload }) => this.handleRemoteElementDelete(payload))
            .on('broadcast', { event: 'stroke_add' }, ({ payload }) => this.handleRemoteStrokeAdd(payload))
            .on('broadcast', { event: 'view_mode' }, ({ payload }) => this.handleRemoteViewMode(payload))
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await this.channel.track({
                        user_id: this.userId,
                        user_name: this.userName,
                        user_color: this.userColor,
                        online_at: new Date().toISOString()
                    });
                    this.updateLiveIndicator(true);
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    this.updateLiveIndicator(false);
                }
            });

        // Configurar enlace para compartir en el modal
        this.setupShareLink();
    },

    updateLiveIndicator(isLive) {
        const ind = document.getElementById('collab-live-indicator');
        const txt = document.getElementById('collab-status-text');
        if (ind) ind.style.background = isLive ? '#10b981' : '#f59e0b';
        if (txt) txt.textContent = isLive ? 'En vivo' : 'Conectando';
    },

    handlePresenceSync() {
        if (!this.channel) return;
        const state = this.channel.presenceState();
        this.presences = state;
        this.renderPresenceUI();
    },

    handleUserJoin(newPresences) {
        this.handlePresenceSync();
        (newPresences || []).forEach(p => {
            if (p.user_id !== this.userId) {
                showToastNotification(`🟢 ${p.user_name || 'Un colaborador'} se ha unido`);
            }
        });
    },

    handleUserLeave(leftPresences) {
        this.handlePresenceSync();
        (leftPresences || []).forEach(p => {
            this.removeRemoteCursor(p.user_id);
            this.remoteSelections.delete(p.user_id);
        });
        this.renderRemoteSelections();
    },

    renderPresenceUI() {
        const container = document.getElementById('collab-presence-container');
        const liveList = document.getElementById('collaborators-live-list');
        const countLabel = document.getElementById('collab-live-count-label');
        const badgeCount = document.getElementById('collab-badge-count');

        let userList = [];
        Object.keys(this.presences).forEach(k => {
            const p = this.presences[k];
            if (Array.isArray(p) && p.length > 0) {
                userList.push(p[0]);
            }
        });

        // Si no hay lista, mostrar al menos al usuario actual
        if (userList.length === 0) {
            userList = [{ user_id: this.userId, user_name: this.userName, user_color: this.userColor }];
        }

        if (container) {
            container.innerHTML = userList.slice(0, 4).map(u => {
                const isMe = u.user_id === this.userId;
                const initials = escapeHtml((u.user_name || 'U').substring(0, 2).toUpperCase());
                const safeName = escapeHtml(u.user_name || 'Colaborador');
                const safeColor = escapeHtml(u.user_color || '#f59e0b');
                return `
                    <div class="collab-avatar-bubble" style="background-color: ${safeColor};" title="${safeName} ${isMe ? '(Tú)' : ''}">
                        ${initials}
                    </div>
                `;
            }).join('');

            if (userList.length > 4) {
                container.innerHTML += `<div class="collab-avatar-bubble bg-slate-700 text-[9px] font-bold">+${userList.length - 4}</div>`;
            }
        }

        if (badgeCount) {
            badgeCount.textContent = userList.length;
            badgeCount.classList.toggle('hidden', userList.length <= 1);
        }

        if (countLabel) {
            countLabel.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> ${userList.length} ${userList.length === 1 ? 'conectado' : 'conectados'}`;
        }

        if (liveList) {
            liveList.innerHTML = userList.map(u => {
                const isMe = u.user_id === this.userId;
                const safeName = escapeHtml(u.user_name || 'Colaborador');
                const safeColor = escapeHtml(u.user_color || '#f59e0b');
                return `
                    <div class="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full" style="background-color: ${safeColor};"></span>
                            <span class="font-bold text-slate-800 dark:text-slate-200">${safeName} ${isMe ? '<span class="text-[10px] text-amber-500 font-semibold">(Tú)</span>' : ''}</span>
                        </div>
                        <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest">En Línea</span>
                    </div>
                `;
            }).join('');
        }
    },

    renderLocalPresence() {
        const container = document.getElementById('collab-presence-container');
        if (container) {
            container.innerHTML = `<div class="collab-avatar-bubble bg-amber-500" title="Tú (Modo Local)">YO</div>`;
        }
    },

    // --- CURSORES MULTIJUGADOR ---
    broadcastCursor(worldX, worldY) {
        if (!this.channel || window.isAuditMode) return;
        const now = Date.now();
        if (now - this.lastCursorBroadcast < 35) return; // Throttling a ~30fps
        this.lastCursorBroadcast = now;

        this.channel.send({
            type: 'broadcast',
            event: 'cursor',
            payload: {
                user_id: this.userId,
                user_name: this.userName,
                user_color: this.userColor,
                x: Math.round(worldX),
                y: Math.round(worldY)
            }
        });
    },

    handleRemoteCursor(payload) {
        if (!payload || payload.user_id === this.userId) return;

        const cursorsLayer = document.getElementById('collab-cursors-layer');
        if (!cursorsLayer) return;

        const safeUid = String(payload.user_id).replace(/[^a-zA-Z0-9_-]/g, '');
        let cursorEl = document.getElementById(`remote-cursor-${safeUid}`);
        if (!cursorEl) {
            cursorEl = document.createElement('div');
            cursorEl.id = `remote-cursor-${safeUid}`;
            cursorEl.className = 'collab-cursor';
            const safeColor = escapeHtml(payload.user_color || '#0ea5e9');
            const safeName = escapeHtml(payload.user_name || 'Colaborador');
            cursorEl.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" fill="${safeColor}" stroke="#ffffff" stroke-width="1.5"/>
                </svg>
                <div class="collab-cursor-badge" style="background-color: ${safeColor};">
                    ${safeName}
                </div>
            `;
            cursorsLayer.appendChild(cursorEl);
        }

        cursorEl.style.transform = `translate(${Number(payload.x) || 0}px, ${Number(payload.y) || 0}px)`;
        cursorEl.style.opacity = '1';

        // Auto-fadeout si se desconecta o deja de moverse
        clearTimeout(cursorEl._fadeTimeout);
        cursorEl._fadeTimeout = setTimeout(() => {
            if (cursorEl) cursorEl.style.opacity = '0';
        }, 6000);
    },

    removeRemoteCursor(userId) {
        const safeUid = String(userId).replace(/[^a-zA-Z0-9_-]/g, '');
        const cursorEl = document.getElementById(`remote-cursor-${safeUid}`);
        if (cursorEl) cursorEl.remove();
    },

    // --- SELECCIONES REMOTAS ---
    broadcastSelection(elementId) {
        if (!this.channel) return;
        this.channel.send({
            type: 'broadcast',
            event: 'selection',
            payload: {
                user_id: this.userId,
                user_name: this.userName,
                user_color: this.userColor,
                element_id: elementId
            }
        });
    },

    broadcastDeselection() {
        this.broadcastSelection(null);
    },

    handleRemoteSelection(payload) {
        if (!payload || payload.user_id === this.userId) return;

        if (payload.element_id) {
            this.remoteSelections.set(payload.user_id, payload);
        } else {
            this.remoteSelections.delete(payload.user_id);
        }

        this.renderRemoteSelections();
    },

    renderRemoteSelections() {
        const layer = document.getElementById('collab-selection-layer');
        if (!layer || !proyecto_actual) return;
        layer.innerHTML = '';

        const sheet = proyecto_actual.sheets[activeSheetIndex];
        if (!sheet) return;

        this.remoteSelections.forEach((sel, uId) => {
            const el = sheet.elements.find(item => item.id === sel.element_id);
            if (el) {
                const outline = document.createElement('div');
                outline.className = 'collab-selection-outline';
                outline.style.left = `${el.x - 3}px`;
                outline.style.top = `${el.y - 3}px`;
                outline.style.width = `${el.width + 6}px`;
                outline.style.height = `${el.height + 6}px`;
                outline.style.borderColor = sel.user_color || '#0ea5e9';
                outline.style.transform = `rotate(${el.rotation || 0}deg)`;

                outline.innerHTML = `
                    <div class="collab-selection-tag" style="background-color: ${escapeHtml(sel.user_color || '#0ea5e9')};">
                        <i class="fas fa-pencil text-[8px] mr-1"></i> ${escapeHtml(sel.user_name || 'Colaborador')}
                    </div>
                `;
                layer.appendChild(outline);
            }
        });
    },

    // --- SINCRONIZACIÓN DE CAMBIOS EN ELEMENTOS (BROADCAST DELTAS) ---
    broadcastElementAdd(element) {
        if (!this.channel || window.isAuditMode) return;
        this.channel.send({
            type: 'broadcast',
            event: 'element_add',
            payload: {
                sender_id: this.userId,
                sheet_idx: activeSheetIndex,
                element: element
            }
        });
    },

    broadcastElementUpdate(element) {
        if (!this.channel || window.isAuditMode) return;
        this.channel.send({
            type: 'broadcast',
            event: 'element_patch',
            payload: {
                sender_id: this.userId,
                sheet_idx: activeSheetIndex,
                element: element
            }
        });
    },

    broadcastElementPatch(element) {
        this.broadcastElementUpdate(element);
    },

    broadcastElementDelete(elementIds) {
        if (!this.channel || window.isAuditMode) return;
        this.channel.send({
            type: 'broadcast',
            event: 'element_delete',
            payload: {
                sender_id: this.userId,
                sheet_idx: activeSheetIndex,
                element_ids: Array.from(elementIds)
            }
        });
    },

    broadcastStrokeAdd(stroke) {
        if (!this.channel || window.isAuditMode) return;
        this.channel.send({
            type: 'broadcast',
            event: 'stroke_add',
            payload: {
                sender_id: this.userId,
                sheet_idx: activeSheetIndex,
                stroke: stroke
            }
        });
    },

    broadcastViewMode(mode) {
        if (!this.channel || window.isAuditMode) return;
        this.channel.send({
            type: 'broadcast',
            event: 'view_mode',
            payload: {
                sender_id: this.userId,
                view_mode: mode
            }
        });
    },

    handleRemoteElementAdd(payload) {
        if (!payload || payload.sender_id === this.userId || !proyecto_actual) return;
        const sheet = proyecto_actual.sheets[payload.sheet_idx !== undefined ? payload.sheet_idx : activeSheetIndex];
        if (!sheet) return;

        sheet.elements.push(payload.element);
        if (payload.sheet_idx === activeSheetIndex) {
            renderElementDOM(payload.element);
            updateMinimap();
            renderViewModeBackdrop();
        }
    },

    handleRemoteElementPatch(payload) {
        if (!payload || payload.sender_id === this.userId || !proyecto_actual) return;
        const sheet = proyecto_actual.sheets[payload.sheet_idx !== undefined ? payload.sheet_idx : activeSheetIndex];
        if (!sheet) return;

        const idx = sheet.elements.findIndex(el => el.id === payload.element.id);
        if (idx !== -1) {
            sheet.elements[idx] = payload.element;
            if (payload.sheet_idx === activeSheetIndex) {
                renderElementDOM(payload.element);
                updateMinimap();
                renderViewModeBackdrop();
            }
        }
    },

    handleRemoteElementDelete(payload) {
        if (!payload || payload.sender_id === this.userId || !proyecto_actual) return;
        const sheet = proyecto_actual.sheets[payload.sheet_idx !== undefined ? payload.sheet_idx : activeSheetIndex];
        if (!sheet) return;

        const idSet = new Set(payload.element_ids || []);
        sheet.elements = sheet.elements.filter(el => !idSet.has(el.id));
        
        if (payload.sheet_idx === activeSheetIndex) {
            idSet.forEach(id => {
                const domEl = document.getElementById(id);
                if (domEl) domEl.remove();
            });
            updateMinimap();
            renderViewModeBackdrop();
        }
    },

    handleRemoteStrokeAdd(payload) {
        if (!payload || payload.sender_id === this.userId || !proyecto_actual) return;
        const sheet = proyecto_actual.sheets[payload.sheet_idx !== undefined ? payload.sheet_idx : activeSheetIndex];
        if (!sheet) return;

        if (!sheet.freehandStrokes) sheet.freehandStrokes = [];
        sheet.freehandStrokes.push(payload.stroke);

        if (payload.sheet_idx === activeSheetIndex) {
            renderAllSVG();
        }
    },

    handleRemoteViewMode(payload) {
        if (!payload || payload.sender_id === this.userId) return;
        if (payload.view_mode && payload.view_mode !== currentViewMode) {
            ViewModeController.setViewMode(payload.view_mode);
        }
    },

    setupShareLink() {
        const linkInput = document.getElementById('share-invite-link');
        if (linkInput && proyecto_actual) {
            linkInput.value = `${window.location.origin}${window.location.pathname}?id=${proyecto_actual.id}&collab=true`;
        }
    }
};

window.LienzoCollabEngine = LienzoCollabEngine;

window.copyInviteLink = function() {
    if (!proyecto_actual) return;
    const url = `${window.location.origin}${window.location.pathname}?id=${proyecto_actual.id}&collab=true`;
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('btn-copy-invite');
        if (btn) {
            btn.innerHTML = `<i class="fas fa-check"></i> <span>¡Copiado!</span>`;
            btn.classList.replace('bg-sky-500', 'bg-emerald-600');
            setTimeout(() => {
                btn.innerHTML = `<i class="fas fa-copy"></i> <span>Copiar</span>`;
                btn.classList.replace('bg-emerald-600', 'bg-sky-500');
            }, 2500);
        }
        showToastNotification("Enlace de colaboración copiado al portapapeles");
    }).catch(() => {
        prompt("Copia este enlace para invitar a tus colaboradores:", url);
    });
};

window.openShareModal = function() {
    if (!proyecto_actual) return;
    const input = document.getElementById('share-uid-input');
    if (input) input.value = '';
    renderCollaboratorsList();
    if (window.LienzoCollabEngine) {
        window.LienzoCollabEngine.setupShareLink();
        window.LienzoCollabEngine.renderPresenceUI();
    }
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
};

window.closeShareModal = function() {
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
};

window.renderCollaboratorsList = function() {
    const list = document.getElementById('collaborators-list');
    if (!list) return;
    list.innerHTML = '';
    
    const shared = proyecto_actual.shared_with || [];
    if (shared.length === 0) {
        list.innerHTML = `<p class="text-xs text-slate-400 dark:text-slate-500 italic py-2">No compartido aún con usuarios específicos.</p>`;
        return;
    }
    
    shared.forEach(uid => {
        const safeUid = escapeHtml(uid);
        const item = document.createElement('div');
        item.className = "flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/60";
        item.innerHTML = `
            <span class="text-xs font-mono text-slate-600 dark:text-slate-400 truncate max-w-[280px]" title="${safeUid}">${safeUid}</span>
            ${!window.isAuditMode ? `<button onclick="removeCollaborator('${safeUid}')" class="text-rose-500 hover:text-rose-650 text-xs px-2 py-1 shrink-0"><i class="fas fa-trash"></i></button>` : ''}
        `;
        list.appendChild(item);
    });
};

window.addCollaborator = async function() {
    if (window.isAuditMode) return;
    const emailInput = document.getElementById('share-uid-input');
    if (!emailInput) return;
    const uid = emailInput.value.trim();
    if (!uid) return;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uid)) {
        alert("Por favor, ingresa un ID único de usuario (UUID) válido.");
        return;
    }
    
    if (!proyecto_actual.shared_with) proyecto_actual.shared_with = [];
    if (proyecto_actual.shared_with.includes(uid)) {
        alert("Este colaborador ya tiene acceso a este lienzo.");
        return;
    }
    
    proyecto_actual.shared_with.push(uid);
    emailInput.value = '';
    renderCollaboratorsList();
    await saveState();
    showToastNotification("Colaborador añadido");
};

window.removeCollaborator = async function(uid) {
    if (window.isAuditMode) return;
    if (!proyecto_actual.shared_with) return;
    proyecto_actual.shared_with = proyecto_actual.shared_with.filter(id => id !== uid);
    renderCollaboratorsList();
    await saveState();
    showToastNotification("Colaborador removido");
};

window.closeProject = function() {
    saveState().then(() => {
        window.location.href = 'documentos.html';
    }).catch(() => {
        window.location.href = 'documentos.html';
    });
};

function showToastNotification(message) {
    const toast = document.getElementById('sync-toast');
    if (toast) {
        toast.querySelector('h4').textContent = message;
        toast.classList.remove('translate-y-32', 'opacity-0');
        setTimeout(() => toast.classList.add('translate-y-32', 'opacity-0'), 3000);
    }
}

async function checkCloudSession() {
    if (typeof supabaseClient !== 'undefined') {
        const { data: { session } } = await supabaseClient.auth.getSession().catch(() => ({ data: { session: null } }));
        const cloudIndicator = document.getElementById('cloud-indicator');
        if (!session && cloudIndicator) {
            cloudIndicator.querySelector('#cloud-indicator-text').textContent = "SINCRONIZACIÓN LOCAL";
        }
    }
}

function checkAuditMode() {
    if (window.isAuditMode) {
        document.querySelectorAll('input, button:not([onclick*="closeProject"]):not([onclick*="print"]):not([onclick*="export"]):not([onclick*="toggle"]):not([onclick*="Zoom"]):not([onclick*="fit"]):not([onclick*="setViewMode"]):not([onclick*="Slide"])').forEach(el => {
            if (el.tagName === 'INPUT') el.disabled = true;
        });
        showToastNotification("Modo Auditoría: Solo Lectura");
    }
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

