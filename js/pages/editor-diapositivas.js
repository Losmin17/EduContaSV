// =========================================================================
// MOTOR DE DIAPOSITIVAS & PRESENTACIONES — EduConta SV
// Arquitectura Nativa Vanilla ES6+, Glassmorphism, 16:9 Widescreen Stage,
// Elementos Vectoriales, Tablas Contables, Modo Presentador y Exportación PDF
// =========================================================================

let projects = [];
let proyecto_actual = null;
let activeSlideIndex = 0;

// Multi-selección con retrocompatibilidad
let selectedElementIds = [];
Object.defineProperty(window, 'selectedElementId', {
    get() { return selectedElementIds.length > 0 ? selectedElementIds[0] : null; },
    set(val) { selectedElementIds = val ? [val] : []; },
    configurable: true
});

let currentZoom = 'fit';
let zoomScale = 1;

let isDragging = false;
let isResizing = false;
let isRotating = false;
let dragStartX = 0;
let dragStartY = 0;
let elementStartBounds = { x: 0, y: 0, width: 0, height: 0, rotation: 0 };
let activeHandle = null;

// Multi-arrastre y Lazo Elástico (Marquee)
let multiDragStarts = [];
let isMarqueeSelecting = false;
let marqueeStart = { x: 0, y: 0 };
let isGridEnabled = false;

let autoSaveTimeout = null;
let cloudSyncTimeout = null;
let historyStack = [];
let historyIndex = -1;
let isHistoryAction = false;
let clipboardElements = [];
let formatPainterStyle = null;
let activeSidebarTab = 'thumbs'; // 'thumbs' | 'layers'

// Variables de Modo Presentación (Teatro Fullscreen Pro)
let isTheaterActive = false;
let theaterIndex = 0;
let isLaserActive = false;
let isTheaterBlackout = false;
let autoPlayTimer = null;
let isAutoPlaying = false;
let theaterInkTool = 'none'; // 'none' | 'pen' | 'marker'
let theaterIsDrawing = false;
let theaterInkLastPos = null;
let theaterTimerSeconds = 0;
let theaterTimerInterval = null;
let theaterAnimStep = 0;
let theaterIsZoomed = false;

// Dimensiones Base de la Diapositiva (16:9 Widescreen Standard)
const STAGE_WIDTH = 960;
const STAGE_HEIGHT = 540;

// =========================================================================
// 1. INICIALIZACIÓN DEL ENTORNO
// =========================================================================
const initDiapositivasEnvironment = async () => {
    try {
        if (typeof window.injectSharedUI === 'function') {
            window.injectSharedUI('shared-components-root');
        }
    } catch (_) {}

    // Mostrar botón de regreso al Inicio en la barra compartida si aplica
    setTimeout(() => {
        const btnVolver = document.getElementById('btn-volver');
        if (btnVolver && !window.isAuditMode) {
            btnVolver.classList.remove('hidden');
        }
    }, 60);

    // Cargar documentos desde la bóveda de diapositivas
    const rawProjects = localStorage.getItem('educonta_projects_diapositivas');
    let lastProjectId = localStorage.getItem('educonta_last_project_id');

    // Verificar si hay un ID específico en la URL (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('id') || lastProjectId;

    if (rawProjects) {
        try {
            projects = JSON.parse(rawProjects) || [];
        } catch (e) {
            projects = [];
        }
    }

    if (projects.length > 0) {
        proyecto_actual = projects.find(p => p.id === targetId);
        if (!proyecto_actual) {
            proyecto_actual = projects[0];
        }
    }

    // Crear presentación por defecto si no existe ninguna
    if (!proyecto_actual) {
        proyecto_actual = createDefaultPresentation();
        projects.unshift(proyecto_actual);
        saveProjectsToLocal();
    }

    localStorage.setItem('educonta_last_project_id', proyecto_actual.id);
    localStorage.setItem('educonta_docs_active_tab', 'diapositivas');

    // Normalizar estructura
    if (!Array.isArray(proyecto_actual.slides) || proyecto_actual.slides.length === 0) {
        proyecto_actual.slides = [createDefaultSlide('title', 'Portada Principal')];
        saveProjectsToLocal();
    } else {
        proyecto_actual.slides.forEach(slide => {
            if (!Array.isArray(slide.animations)) slide.animations = [];
            if (typeof slide.transition === 'string') {
                slide.transition = {
                    type: slide.transition || 'fade',
                    direction: 'left',
                    duration: 600,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
                };
            } else if (!slide.transition) {
                slide.transition = {
                    type: 'fade',
                    direction: 'left',
                    duration: 600,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
                };
            }
        });
    }

    // Configurar Título en cabecera
    const nameInput = document.getElementById('presentation-name-input');
    if (nameInput) {
        nameInput.value = proyecto_actual.name || 'Presentación Ejecutiva';
    }

    // Inicializar Pila de Deshacer
    pushHistoryState();

    // Renderizar diapositivas y miniaturas
    activeSlideIndex = 0;
    renderThumbnails();
    renderActiveSlide();
    updatePropertyBar();

    // Ajustar Zoom al Viewport
    calculateFitZoom();
    window.addEventListener('resize', debounce(() => {
        if (currentZoom === 'fit') {
            calculateFitZoom();
        }
    }, 100));

    // Atajos de teclado globales
    setupKeyboardShortcuts();

    // Comprobar sesión de Supabase
    checkCloudSession();

    // Desvanecer preloader
    if (typeof window.dismissGlobalPreloader === 'function') {
        window.dismissGlobalPreloader();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDiapositivasEnvironment);
} else {
    initDiapositivasEnvironment();
}

// =========================================================================
// 2. GESTIÓN DEL MODELO DE DATOS Y VALORES POR DEFECTO
// =========================================================================
function createDefaultPresentation() {
    const defaultSlides = [
        // Slide 1: Portada
        createDefaultSlide('title', 'Informe Financiero y Resultados'),
        // Slide 2: Resumen de KPIs
        createDefaultSlide('kpis', 'Métricas Clave del Ejercicio'),
        // Slide 3: Tabla Contable
        createDefaultSlide('table', 'Estado de Resultados Condensado'),
        // Slide 4: Gráfico Estadístico
        createDefaultSlide('chart', 'Tendencia Trimestral de Ingresos')
    ];

    return {
        id: 'doc_diapositivas_' + Date.now(),
        name: 'Presentación Financiera y Contable',
        type: 'diapositivas',
        aspectRatio: '16:9',
        theme: 'amber',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slides: defaultSlides
    };
}

function createDefaultSlide(layoutType = 'blank', titleText = 'Nueva Diapositiva') {
    const slideId = 'slide_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const elements = [];

    if (layoutType === 'title') {
        // Portada
        elements.push({
            id: 'el_' + Date.now() + '_badge',
            type: 'text',
            x: 80,
            y: 110,
            width: 240,
            height: 36,
            content: 'EDUCONTA SV • REPORTE ANUAL',
            fontSize: 11,
            fontWeight: '800',
            fontFamily: 'Plus Jakarta Sans',
            color: '#d97706',
            textAlign: 'left',
            bg: '#fef3c7',
            borderRadius: 18,
            padding: 8
        });
        elements.push({
            id: 'el_' + Date.now() + '_t',
            type: 'text',
            x: 80,
            y: 165,
            width: 760,
            height: 140,
            content: titleText || 'Estados Financieros y Dictamen Contable',
            fontSize: 44,
            fontWeight: '900',
            fontFamily: 'Plus Jakarta Sans',
            color: '#0f172a',
            textAlign: 'left'
        });
        elements.push({
            id: 'el_' + Date.now() + '_sub',
            type: 'text',
            x: 80,
            y: 320,
            width: 680,
            height: 60,
            content: 'Evaluación del desempeño financiero, balance general condensado y cumplimiento tributario bajo normativa salvadoreña.',
            fontSize: 16,
            fontWeight: '500',
            fontFamily: 'Plus Jakarta Sans',
            color: '#64748b',
            textAlign: 'left'
        });
        elements.push({
            id: 'el_' + Date.now() + '_author',
            type: 'text',
            x: 80,
            y: 430,
            width: 400,
            height: 40,
            content: 'Emitido por: Departamento de Contabilidad y Auditoría',
            fontSize: 12,
            fontWeight: '700',
            fontFamily: 'Plus Jakarta Sans',
            color: '#94a3b8',
            textAlign: 'left'
        });
    } else if (layoutType === 'bullets') {
        // Título y Viñetas
        elements.push({
            id: 'el_' + Date.now() + '_h',
            type: 'text',
            x: 80,
            y: 50,
            width: 800,
            height: 60,
            content: titleText || 'Principales Hallazgos del Periodo',
            fontSize: 32,
            fontWeight: '800',
            fontFamily: 'Plus Jakarta Sans',
            color: '#0f172a',
            textAlign: 'left'
        });
        elements.push({
            id: 'el_' + Date.now() + '_body',
            type: 'text',
            x: 80,
            y: 130,
            width: 800,
            height: 340,
            content: '• Incremento sostenido del 18.4% en las ventas netas respecto al año anterior.\n• Optimización de la rotación de inventarios conforme a la norma NIC 2.\n• Cumplimiento total de las retenciones laborales de ISSS (3%) y AFP (7.25%).\n• Cierre contable equilibrado con dictamen limpio y sin salvedades materiales.\n• Reserva legal calculada de acuerdo al Código de Comercio (7%).',
            fontSize: 18,
            fontWeight: '500',
            fontFamily: 'Plus Jakarta Sans',
            color: '#334155',
            textAlign: 'left',
            lineHeight: 1.8
        });
    } else if (layoutType === 'two-columns') {
        // Dos Columnas
        elements.push({
            id: 'el_' + Date.now() + '_h',
            type: 'text',
            x: 80,
            y: 50,
            width: 800,
            height: 60,
            content: titleText || 'Comparativa de Desempeño Operativo',
            fontSize: 32,
            fontWeight: '800',
            fontFamily: 'Plus Jakarta Sans',
            color: '#0f172a',
            textAlign: 'left'
        });
        elements.push({
            id: 'el_' + Date.now() + '_c1',
            type: 'shape',
            shapeType: 'rounded',
            x: 80,
            y: 130,
            width: 380,
            height: 340,
            fill: '#f8fafc',
            stroke: '#e2e8f0',
            strokeWidth: 2,
            borderRadius: 16
        });
        elements.push({
            id: 'el_' + Date.now() + '_t1',
            type: 'text',
            x: 105,
            y: 155,
            width: 330,
            height: 290,
            content: 'Puntos Fuertes (Fortalezas)\n\n• Flujo de efectivo positivo constante.\n• Margen de utilidad bruta del 42.5%.\n• Cartera de clientes sin morosidad riesgosa.\n• Procesos contables 100% digitalizados.',
            fontSize: 16,
            fontWeight: '600',
            fontFamily: 'Plus Jakarta Sans',
            color: '#0f172a',
            textAlign: 'left'
        });
        elements.push({
            id: 'el_' + Date.now() + '_c2',
            type: 'shape',
            shapeType: 'rounded',
            x: 500,
            y: 130,
            width: 380,
            height: 340,
            fill: '#fef3c7',
            stroke: '#f59e0b',
            strokeWidth: 2,
            borderRadius: 16
        });
        elements.push({
            id: 'el_' + Date.now() + '_t2',
            type: 'text',
            x: 525,
            y: 155,
            width: 330,
            height: 290,
            content: 'Áreas de Oportunidad\n\n• Diversificación de proveedores locales.\n• Mayor aprovechamiento de créditos fiscales IVA.\n• Automatización de concilaciones bancarias.\n• Reducción de costos de distribución en oriente.',
            fontSize: 16,
            fontWeight: '600',
            fontFamily: 'Plus Jakarta Sans',
            color: '#78350f',
            textAlign: 'left'
        });
    } else if (layoutType === 'kpis') {
        // Resumen de Métricas & KPIs
        elements.push({
            id: 'el_' + Date.now() + '_h',
            type: 'text',
            x: 80,
            y: 45,
            width: 800,
            height: 55,
            content: titleText || 'Indicadores Financieros Principales (KPIs)',
            fontSize: 32,
            fontWeight: '800',
            fontFamily: 'Plus Jakarta Sans',
            color: '#0f172a',
            textAlign: 'left'
        });
        // KPI 1: Ingresos
        elements.push({
            id: 'el_' + Date.now() + '_kpi1',
            type: 'kpi',
            x: 80,
            y: 130,
            width: 250,
            height: 180,
            title: 'Ingresos Totales',
            value: '$ 485,250.00',
            change: '+18.4% vs periodo ant.',
            trend: 'up',
            accent: '#059669',
            bg: '#ecfdf5',
            border: '#a7f3d0'
        });
        // KPI 2: Costos Operativos
        elements.push({
            id: 'el_' + Date.now() + '_kpi2',
            type: 'kpi',
            x: 355,
            y: 130,
            width: 250,
            height: 180,
            title: 'Costos de Operación',
            value: '$ 278,900.00',
            change: '-4.2% ahorro en costos',
            trend: 'up',
            accent: '#0284c7',
            bg: '#f0f9ff',
            border: '#bae6fd'
        });
        // KPI 3: Utilidad Neta
        elements.push({
            id: 'el_' + Date.now() + '_kpi3',
            type: 'kpi',
            x: 630,
            y: 130,
            width: 250,
            height: 180,
            title: 'Utilidad Neta',
            value: '$ 124,580.00',
            change: '+22.6% margen neto',
            trend: 'up',
            accent: '#d97706',
            bg: '#fffbeb',
            border: '#fde68a'
        });
        // Resumen inferior
        elements.push({
            id: 'el_' + Date.now() + '_info',
            type: 'text',
            x: 80,
            y: 350,
            width: 800,
            height: 120,
            content: 'Conclusión Financiera: La empresa mantiene una sólida liquidez corriente de 1.85 y un índice de solvencia patrimonial que garantiza la continuidad del negocio y el cumplimiento de compromisos bancarios sin requerir financiamiento externo adicional.',
            fontSize: 15,
            fontWeight: '500',
            fontFamily: 'Plus Jakarta Sans',
            color: '#475569',
            textAlign: 'left'
        });
    } else if (layoutType === 'table') {
        // Tabla Financiera
        elements.push({
            id: 'el_' + Date.now() + '_h',
            type: 'text',
            x: 80,
            y: 40,
            width: 800,
            height: 50,
            content: titleText || 'Estado de Resultados Condensado (En Dólares EUA)',
            fontSize: 28,
            fontWeight: '800',
            fontFamily: 'Plus Jakarta Sans',
            color: '#0f172a',
            textAlign: 'left'
        });
        elements.push({
            id: 'el_' + Date.now() + '_tbl',
            type: 'table',
            x: 80,
            y: 110,
            width: 800,
            height: 380,
            headers: ['Concepto Contable', '2025', '2026', 'Variación ($)', 'Variación (%)'],
            rows: [
                ['Ventas Netas Totales', '$ 410,000.00', '$ 485,250.00', '+$ 75,250.00', '+18.4 %'],
                ['(-) Costo de lo Vendido', '$ 246,000.00', '$ 278,900.00', '+$ 32,900.00', '+13.4 %'],
                ['(=) Utilidad Bruta', '$ 164,000.00', '$ 206,350.00', '+$ 42,350.00', '+25.8 %'],
                ['(-) Gastos de Administración y Venta', '$ 55,000.00', '$ 61,200.00', '+$ 6,200.00', '+11.3 %'],
                ['(=) Utilidad de Operación', '$ 109,000.00', '$ 145,150.00', '+$ 36,150.00', '+33.2 %'],
                ['(-) Impuesto sobre la Renta (30%)', '$ 32,700.00', '$ 43,545.00', '+$ 10,845.00', '+33.2 %'],
                ['(=) Utilidad Neta del Ejercicio', '$ 76,300.00', '$ 101,605.00', '+$ 25,305.00', '+33.2 %']
            ],
            theme: 'amber'
        });
    } else if (layoutType === 'chart') {
        // Gráfica
        elements.push({
            id: 'el_' + Date.now() + '_h',
            type: 'text',
            x: 80,
            y: 40,
            width: 800,
            height: 50,
            content: titleText || 'Rendimiento y Ventas por Trimestre',
            fontSize: 28,
            fontWeight: '800',
            fontFamily: 'Plus Jakarta Sans',
            color: '#0f172a',
            textAlign: 'left'
        });
        elements.push({
            id: 'el_' + Date.now() + '_ch',
            type: 'chart',
            chartType: 'bar',
            title: 'Ventas Trimestrales ($)',
            x: 80,
            y: 110,
            width: 800,
            height: 380,
            data: [
                { label: 'T1 - Ene/Mar', value: 95000 },
                { label: 'T2 - Abr/Jun', value: 118000 },
                { label: 'T3 - Jul/Sep', value: 132000 },
                { label: 'T4 - Oct/Dic', value: 140250 }
            ],
            color: '#f59e0b'
        });
    }

    return {
        id: slideId,
        title: titleText,
        background: {
            type: 'solid',
            value: '#ffffff'
        },
        transition: {
            type: 'fade',
            direction: 'left',
            duration: 600,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
        },
        notes: 'Apuntes para el expositor: enfatizar los indicadores clave y la estabilidad contable.',
        animations: [],
        elements: elements
    };
}

// =========================================================================
// 3. RENDERIZADO DEL NAVEGADOR DE MINIATURAS (SIDEBAR)
// =========================================================================
function renderThumbnails() {
    const list = document.getElementById('slide-thumbnails-list');
    if (!list) return;

    list.innerHTML = '';
    const slides = proyecto_actual.slides || [];

    slides.forEach((slide, idx) => {
        const isActive = idx === activeSlideIndex;
        const card = document.createElement('div');
        card.className = `slide-thumb-card p-2 flex flex-col gap-1.5 ${isActive ? 'active' : ''}`;
        card.onclick = () => selectSlide(idx);

        // Header de la tarjeta miniatura
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between text-[10px] font-black text-slate-400';
        header.innerHTML = `
            <span>#${idx + 1}</span>
            <div class="flex items-center gap-1.5">
                ${(slide.animations && slide.animations.length) ? `<span class="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-black text-[9px]"><i class="fas fa-wand-magic-sparkles mr-0.5"></i>${slide.animations.length}</span>` : ''}
                ${slide.notes ? '<i class="fas fa-clipboard text-[9px] text-amber-500" title="Tiene notas"></i>' : ''}
                <button onclick="event.stopPropagation(); deleteSlide(${idx})" class="hover:text-rose-500 p-0.5" title="Eliminar"><i class="far fa-trash-alt"></i></button>
            </div>
        `;

        // Canvas de previsualización a escala reducida
        const preview = document.createElement('div');
        preview.className = 'slide-thumb-preview rounded-lg border border-slate-200 dark:border-slate-800';
        preview.style.background = slide.background?.value || '#ffffff';

        // Renderizado simplificado de elementos miniatura
        const scaleFactor = 0.22;
        const previewContent = document.createElement('div');
        previewContent.style.width = `${STAGE_WIDTH}px`;
        previewContent.style.height = `${STAGE_HEIGHT}px`;
        previewContent.style.transformOrigin = 'top left';
        previewContent.style.transform = `scale(${scaleFactor})`;
        previewContent.style.position = 'relative';

        (slide.elements || []).forEach(el => {
            if (el.hidden) return;
            const minEl = document.createElement('div');
            minEl.style.position = 'absolute';
            minEl.style.left = `${el.x}px`;
            minEl.style.top = `${el.y}px`;
            minEl.style.width = `${el.width}px`;
            minEl.style.height = `${el.height}px`;

            if (el.type === 'text') {
                minEl.style.color = el.color || '#0f172a';
                minEl.style.fontSize = `${el.fontSize || 14}px`;
                minEl.style.fontWeight = el.fontWeight || 'normal';
                minEl.style.lineHeight = '1.2';
                minEl.style.overflow = 'hidden';
                minEl.textContent = el.content || '';
                if (el.bg) minEl.style.background = el.bg;
            } else if (el.type === 'shape') {
                minEl.style.backgroundColor = el.fill || '#e2e8f0';
                minEl.style.border = `${el.strokeWidth || 1}px solid ${el.stroke || '#94a3b8'}`;
                if (el.shapeType === 'circle') minEl.style.borderRadius = '50%';
                else minEl.style.borderRadius = `${el.borderRadius || 4}px`;
            } else if (el.type === 'kpi') {
                minEl.style.backgroundColor = el.bg || '#ecfdf5';
                minEl.style.border = `2px solid ${el.border || '#a7f3d0'}`;
                minEl.style.borderRadius = '12px';
            } else if (el.type === 'table') {
                minEl.style.backgroundColor = '#ffffff';
                minEl.style.border = '2px solid #e2e8f0';
                minEl.style.borderRadius = '8px';
            } else if (el.type === 'chart') {
                minEl.style.backgroundColor = '#fffbeb';
                minEl.style.border = '2px solid #fde68a';
                minEl.style.borderRadius = '8px';
            } else if (el.type === 'connector') {
                minEl.style.borderTop = `${el.strokeWidth || 2}px solid ${el.stroke || '#0284c7'}`;
            } else if (el.type === 'auditBadge') {
                minEl.style.backgroundColor = el.bg || '#ecfdf5';
                minEl.style.border = `1.5px dashed ${el.color || '#059669'}`;
                minEl.style.borderRadius = '8px';
            }

            previewContent.appendChild(minEl);
        });

        preview.appendChild(previewContent);

        // Título de la diapositiva
        const titleEl = document.createElement('span');
        titleEl.className = 'text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate';
        titleEl.textContent = slide.title || `Diapositiva ${idx + 1}`;

        card.appendChild(header);
        card.appendChild(preview);
        card.appendChild(titleEl);
        list.appendChild(card);
    });

    const badge = document.getElementById('slide-counter-badge');
    if (badge) {
        badge.textContent = `${slides.length} Diapositiva${slides.length === 1 ? '' : 's'}`;
    }

    const hudBadge = document.getElementById('hud-slide-indicator');
    if (hudBadge) {
        hudBadge.textContent = `${activeSlideIndex + 1} / ${slides.length}`;
    }

    if (activeSidebarTab === 'layers') {
        renderLayersList();
    }
}

function switchSidebarTab(tab) {
    activeSidebarTab = tab;
    const thumbsBtn = document.getElementById('tab-btn-thumbs');
    const layersBtn = document.getElementById('tab-btn-layers');
    const thumbsList = document.getElementById('slide-thumbnails-list');
    const layersList = document.getElementById('slide-layers-list');
    const footerControls = document.getElementById('sidebar-footer-controls');

    if (tab === 'thumbs') {
        if (thumbsBtn) thumbsBtn.className = 'flex-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 shadow-sm transition-all flex items-center justify-center gap-1';
        if (layersBtn) layersBtn.className = 'flex-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all flex items-center justify-center gap-1';
        if (thumbsList) thumbsList.classList.remove('hidden');
        if (layersList) layersList.classList.add('hidden');
        if (footerControls) footerControls.classList.remove('hidden');
        renderThumbnails();
    } else {
        if (layersBtn) layersBtn.className = 'flex-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 shadow-sm transition-all flex items-center justify-center gap-1';
        if (thumbsBtn) thumbsBtn.className = 'flex-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all flex items-center justify-center gap-1';
        if (thumbsList) thumbsList.classList.add('hidden');
        if (layersList) layersList.classList.remove('hidden');
        if (footerControls) footerControls.classList.add('hidden');
        renderLayersList();
    }
}

function renderLayersList() {
    const list = document.getElementById('slide-layers-list');
    if (!list) return;

    list.innerHTML = '';
    const currentSlide = getActiveSlide();
    if (!currentSlide || !currentSlide.elements || currentSlide.elements.length === 0) {
        list.innerHTML = '<div class="p-4 text-center text-xs text-slate-400 italic">No hay capas en esta diapositiva</div>';
        return;
    }

    // Orden inverso: la capa superior visualmente se lista arriba
    const reversed = [...currentSlide.elements].reverse();

    reversed.forEach((el, rIdx) => {
        const isSel = selectedElementIds.includes(el.id);
        const item = document.createElement('div');
        item.className = `p-2 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
            isSel ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-300'
        }`;

        let iconClass = 'fa-shapes';
        if (el.type === 'text') iconClass = 'fa-font';
        else if (el.type === 'table') iconClass = 'fa-table';
        else if (el.type === 'kpi') iconClass = 'fa-chart-pie';
        else if (el.type === 'chart') iconClass = 'fa-chart-column';
        else if (el.type === 'image') iconClass = 'fa-image';
        else if (el.type === 'icon') iconClass = 'fa-icons';
        else if (el.type === 'sticky') iconClass = 'fa-note-sticky';
        else if (el.type === 'connector') iconClass = 'fa-arrows-alt-h';
        else if (el.type === 'auditBadge') iconClass = 'fa-stamp';

        const displayName = el.name || (el.type.charAt(0).toUpperCase() + el.type.slice(1) + (el.title ? `: ${el.title}` : (el.content ? `: ${el.content.substring(0, 15)}...` : '')));

        item.innerHTML = `
            <div class="flex items-center gap-2 min-w-0 flex-1">
                <i class="fas ${iconClass} text-amber-500 text-xs shrink-0"></i>
                <span class="truncate font-bold text-[11px]">${displayName}</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0" onclick="event.stopPropagation()">
                <!-- Ocultar / Mostrar -->
                <button onclick="toggleElementHidden('${el.id}')" class="p-1 hover:text-amber-600 transition-colors" title="${el.hidden ? 'Mostrar elemento' : 'Ocultar elemento'}">
                    <i class="fas ${el.hidden ? 'fa-eye-slash text-slate-400' : 'fa-eye text-slate-600 dark:text-slate-300'} text-xs"></i>
                </button>
                <!-- Bloquear / Desbloquear -->
                <button onclick="toggleElementLocked('${el.id}')" class="p-1 hover:text-amber-600 transition-colors" title="${el.locked ? 'Desbloquear elemento' : 'Bloquear elemento'}">
                    <i class="fas ${el.locked ? 'fa-lock text-amber-600' : 'fa-lock-open text-slate-400'} text-xs"></i>
                </button>
                <!-- Subir z-index -->
                <button onclick="moveLayerZIndex('${el.id}', 'up')" class="p-1 hover:text-amber-600 text-slate-400" title="Traer más al frente">
                    <i class="fas fa-chevron-up text-[10px]"></i>
                </button>
                <!-- Bajar z-index -->
                <button onclick="moveLayerZIndex('${el.id}', 'down')" class="p-1 hover:text-amber-600 text-slate-400" title="Enviar más al fondo">
                    <i class="fas fa-chevron-down text-[10px]"></i>
                </button>
            </div>
        `;

        item.onclick = (e) => {
            if (e.shiftKey) {
                toggleElementSelection(el.id);
            } else {
                selectElement(el.id);
            }
        };

        list.appendChild(item);
    });
}

function toggleElementHidden(id) {
    if (window.isAuditMode) return;
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;
    const el = currentSlide.elements.find(x => x.id === id);
    if (el) {
        el.hidden = !el.hidden;
        renderActiveSlide();
        renderLayersList();
        pushHistoryState();
        triggerAutoSave();
    }
}

function toggleElementLocked(id) {
    if (window.isAuditMode) return;
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;
    const el = currentSlide.elements.find(x => x.id === id);
    if (el) {
        el.locked = !el.locked;
        renderActiveSlide();
        renderLayersList();
        pushHistoryState();
        triggerAutoSave();
        showToastNotification(el.locked ? "Elemento bloqueado" : "Elemento desbloqueado");
    }
}

function moveLayerZIndex(id, dir) {
    if (window.isAuditMode) return;
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;
    const idx = currentSlide.elements.findIndex(x => x.id === id);
    if (idx === -1) return;

    if (dir === 'up' && idx < currentSlide.elements.length - 1) {
        const item = currentSlide.elements.splice(idx, 1)[0];
        currentSlide.elements.splice(idx + 1, 0, item);
    } else if (dir === 'down' && idx > 0) {
        const item = currentSlide.elements.splice(idx, 1)[0];
        currentSlide.elements.splice(idx - 1, 0, item);
    }

    renderActiveSlide();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
}

// =========================================================================
// 4. RENDERIZADO DEL ESCENARIO ACTIVO (STAGE 16:9)
// =========================================================================
function renderActiveSlide() {
    const artboard = document.getElementById('slide-artboard');
    const layer = document.getElementById('slide-elements-layer');
    if (!artboard || !layer) return;

    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    // Aplicar fondo
    artboard.style.background = currentSlide.background?.value || '#ffffff';

    // Limpiar capa
    layer.innerHTML = '';

    (currentSlide.elements || []).forEach(el => {
        const domEl = createDomElement(el);
        layer.appendChild(domEl);
    });

    // Renderizar insignias numéricas de orden de animación en el lienzo
    renderAnimationBadges(currentSlide, layer);

    // Actualizar notas en el drawer
    const notesInput = document.getElementById('slide-notes-textarea');
    if (notesInput) {
        notesInput.value = currentSlide.notes || '';
    }

    if (activeSidebarTab === 'layers') {
        renderLayersList();
    }

    // Actualizar insignias de animación en el dock
    const dockBadge = document.getElementById('dock-anim-badge');
    const animCount = (currentSlide.animations || []).length;
    if (dockBadge) {
        dockBadge.textContent = animCount;
        dockBadge.classList.toggle('hidden', animCount === 0);
    }
}

function renderAnimationBadges(slide, containerDom) {
    if (!slide || !Array.isArray(slide.animations) || slide.animations.length === 0) return;

    slide.animations.forEach((anim, idx) => {
        const domEl = containerDom.querySelector('#dom_' + anim.elementId);
        if (domEl && !domEl.querySelector('.badge-anim-num')) {
            const badge = document.createElement('div');
            badge.className = 'badge-anim-num';
            badge.textContent = idx + 1;
            badge.title = `Paso de animación #${idx + 1}: ${anim.effect}`;
            domEl.appendChild(badge);
        }
    });
}

function createDomElement(el) {
    const div = document.createElement('div');
    div.id = 'dom_' + el.id;
    const isSelected = selectedElementIds.includes(el.id);
    div.className = `slide-element ${isSelected ? 'selected' : ''} ${el.locked ? 'locked' : ''}`;
    div.style.left = `${el.x}px`;
    div.style.top = `${el.y}px`;
    div.style.width = `${el.width}px`;
    div.style.height = `${el.height}px`;
    if (el.rotation) {
        div.style.transform = `rotate(${el.rotation}deg)`;
    }
    if (el.opacity !== undefined) {
        div.style.opacity = el.opacity;
    }
    if (el.hidden) {
        div.style.opacity = '0.32';
        div.style.outline = '1px dashed #94a3b8';
    }

    // Contenido según el tipo
    if (el.type === 'text') {
        renderTextElementContent(div, el);
    } else if (el.type === 'shape') {
        renderShapeElementContent(div, el);
    } else if (el.type === 'kpi') {
        renderKpiElementContent(div, el);
    } else if (el.type === 'table') {
        renderTableElementContent(div, el);
    } else if (el.type === 'chart') {
        renderChartElementContent(div, el);
    } else if (el.type === 'image') {
        renderImageElementContent(div, el);
    } else if (el.type === 'icon') {
        renderIconElementContent(div, el);
    } else if (el.type === 'sticky') {
        renderStickyElementContent(div, el);
    } else if (el.type === 'connector') {
        renderConnectorElementContent(div, el);
    } else if (el.type === 'auditBadge') {
        renderAuditBadgeElementContent(div, el);
    }

    // Puertos magnéticos de conexión (N, S, E, W)
    if (el.type === 'shape' || el.type === 'text' || el.type === 'kpi') {
        ['n', 's', 'e', 'w'].forEach(p => {
            const port = document.createElement('div');
            port.className = `connector-port port-${p}`;
            port.title = `Puerto ${p.toUpperCase()}`;
            port.onmousedown = (e) => startInteractiveConnecting(e, el.id, p);
            div.appendChild(port);
        });
    }

    // Tiradores de redimensionamiento sólo si no está bloqueado
    if (!el.locked) {
        const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        handles.forEach(h => {
            const handleDiv = document.createElement('div');
            handleDiv.className = `resize-handle handle-${h}`;
            handleDiv.onmousedown = (e) => startResizing(e, el.id, h);
            div.appendChild(handleDiv);
        });

        // Tirador de rotación
        const rotStem = document.createElement('div');
        rotStem.className = 'rotation-stem';
        const rotHandle = document.createElement('div');
        rotHandle.className = 'rotation-handle';
        rotHandle.onmousedown = (e) => startRotating(e, el.id);
        div.appendChild(rotStem);
        div.appendChild(rotHandle);
    } else {
        const lockBadge = document.createElement('div');
        lockBadge.className = 'absolute top-1 right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[8px] shadow-sm z-[1002] pointer-events-none';
        lockBadge.innerHTML = '<i class="fas fa-lock"></i>';
        div.appendChild(lockBadge);
    }

    // Eventos de arrastre y selección
    div.onmousedown = (e) => startDraggingElement(e, el.id);

    return div;
}

// =========================================================================
// 5. RENDERIZADORES ESPECÍFICOS DE CONTENIDO
// =========================================================================
function renderTextElementContent(container, el) {
    const textInner = document.createElement('div');
    textInner.className = 'w-full h-full outline-none';
    textInner.style.fontSize = `${el.fontSize || 16}px`;
    textInner.style.fontWeight = el.fontWeight || 'normal';
    textInner.style.fontFamily = el.fontFamily || 'Plus Jakarta Sans';
    textInner.style.color = el.color || '#0f172a';
    textInner.style.textAlign = el.textAlign || 'left';
    textInner.style.lineHeight = el.lineHeight || '1.4';
    if (el.fontStyle) textInner.style.fontStyle = el.fontStyle;
    if (el.textDecoration) textInner.style.textDecoration = el.textDecoration;
    if (el.textTransform) textInner.style.textTransform = el.textTransform;
    if (el.letterSpacing) textInner.style.letterSpacing = el.letterSpacing;
    if (el.textShadow) textInner.style.textShadow = el.textShadow;
    if (el.highlightBg) textInner.style.backgroundColor = el.highlightBg;
    else if (el.bg) textInner.style.backgroundColor = el.bg;
    if (el.borderRadius) textInner.style.borderRadius = `${el.borderRadius}px`;
    if (el.border) textInner.style.border = el.border;
    if (el.padding) textInner.style.padding = `${el.padding}px`;

    // Soporte para listas
    if (el.listType === 'bullet') {
        const lines = (el.content || 'Elemento 1\nElemento 2').split('\n');
        textInner.innerHTML = `<ul class="list-disc pl-5 space-y-1">${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
    } else if (el.listType === 'number') {
        const lines = (el.content || 'Paso 1\nPaso 2').split('\n');
        textInner.innerHTML = `<ol class="list-decimal pl-5 space-y-1">${lines.map(l => `<li>${l}</li>`).join('')}</ol>`;
    } else {
        textInner.innerText = el.content || 'Escribe aquí...';
    }

    // Edición en vivo con doble clic
    container.ondblclick = (e) => {
        e.stopPropagation();
        if (window.isAuditMode) return;
        textInner.contentEditable = 'true';
        container.classList.add('editing');
        textInner.focus();

        textInner.onblur = () => {
            textInner.contentEditable = 'false';
            container.classList.remove('editing');
            el.content = textInner.innerText;
            pushHistoryState();
            triggerAutoSave();
            renderThumbnails();
        };
    };

    container.appendChild(textInner);
}

function renderShapeElementContent(container, el) {
    const shape = document.createElement('div');
    shape.className = 'w-full h-full';
    shape.style.backgroundColor = el.fill || '#f59e0b';
    shape.style.border = `${el.strokeWidth || 0}px solid ${el.stroke || '#d97706'}`;

    if (el.shapeType === 'circle') {
        shape.style.borderRadius = '50%';
    } else if (el.shapeType === 'rounded') {
        shape.style.borderRadius = `${el.borderRadius || 16}px`;
    } else if (el.shapeType === 'diamond') {
        shape.style.transform = 'rotate(45deg) scale(0.7)';
        shape.style.borderRadius = '8px';
    } else if (el.shapeType === 'line') {
        shape.style.height = `${el.strokeWidth || 3}px`;
        shape.style.backgroundColor = el.stroke || '#f59e0b';
    } else {
        shape.style.borderRadius = `${el.borderRadius || 4}px`;
    }

    container.appendChild(shape);
}

function renderKpiElementContent(container, el) {
    const card = document.createElement('div');
    card.className = 'w-full h-full rounded-2xl p-4 flex flex-col justify-between shadow-sm';
    card.style.backgroundColor = el.bg || '#ecfdf5';
    card.style.border = `2px solid ${el.border || '#a7f3d0'}`;

    card.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">${el.title || 'Métrica'}</span>
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${el.accent || '#059669'}"></span>
        </div>
        <div class="my-auto">
            <h3 class="text-2xl font-black text-slate-900 tracking-tight leading-none">${el.value || '$ 0.00'}</h3>
        </div>
        <div class="flex items-center gap-1.5 text-xs font-bold" style="color: ${el.accent || '#059669'}">
            <i class="fas fa-arrow-${el.trend === 'down' ? 'down' : 'up'}"></i>
            <span>${el.change || '+0.0%'}</span>
        </div>
    `;

    container.appendChild(card);
}

function renderTableElementContent(container, el) {
    const wrap = document.createElement('div');
    wrap.className = 'w-full h-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col';

    const headers = el.headers || ['Concepto', 'Monto'];
    const rows = el.rows || [];

    let tableHtml = `
        <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-amber-500 text-white font-black uppercase text-[10px] tracking-wider">
                <tr>
                    ${headers.map((h, colIdx) => `
                        <th class="px-3 py-2 border-r border-amber-600/40 last:border-none outline-none" contenteditable="true" onblur="updateTableCell(event, '${el.id}', -1, ${colIdx})">${h}</th>
                    `).join('')}
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 font-semibold">
                ${rows.map((row, rIdx) => {
                    const isTotalRow = el.hasTotalRow && rIdx === rows.length - 1;
                    const rowClass = isTotalRow
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 font-black border-t-2 border-b-[3px] border-amber-500 border-double'
                        : (rIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-850/50');
                    return `
                        <tr class="${rowClass} hover:bg-amber-50/30 transition-colors">
                            ${row.map((cell, cIdx) => {
                                let cellColor = '';
                                if (typeof cell === 'string' && cell.includes('+') && cell.includes('%')) cellColor = 'text-emerald-600 dark:text-emerald-400 font-bold';
                                else if (typeof cell === 'string' && cell.includes('-') && cell.includes('%')) cellColor = 'text-rose-600 dark:text-rose-400 font-bold';
                                return `<td class="px-3 py-2 border-r border-slate-100 dark:border-slate-800 last:border-none outline-none ${cellColor}" contenteditable="true" onblur="updateTableCell(event, '${el.id}', ${rIdx}, ${cIdx})">${cell}</td>`;
                            }).join('')}
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    wrap.innerHTML = tableHtml;
    container.appendChild(wrap);
}

function updateTableCell(e, elementId, rowIndex, colIndex) {
    if (window.isAuditMode) return;
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;
    const el = currentSlide.elements.find(x => x.id === elementId);
    if (!el) return;

    const newVal = e.target.innerText.trim();
    if (rowIndex === -1) {
        if (!el.headers) el.headers = [];
        el.headers[colIndex] = newVal;
    } else {
        if (!el.rows) el.rows = [];
        if (!el.rows[rowIndex]) el.rows[rowIndex] = [];
        el.rows[rowIndex][colIndex] = newVal;
    }

    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function renderChartElementContent(container, el) {
    const wrap = document.createElement('div');
    wrap.className = 'w-full h-full rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between';

    const title = el.title || 'Gráfico Financiero';
    const data = el.data || [
        { label: 'Q1', value: 40 },
        { label: 'Q2', value: 65 },
        { label: 'Q3', value: 85 },
        { label: 'Q4', value: 110 }
    ];
    const maxValue = Math.max(...data.map(d => Math.abs(d.value)), 1);

    let chartSvg = '';

    if (el.chartType === 'waterfall') {
        // GRÁFICO DE CASCADA (WATERFALL CHART)
        let runningTotal = 0;
        const barWidth = Math.min(80, 580 / (data.length || 1));
        const spacing = (660 - (data.length * barWidth)) / (data.length + 1);

        const items = data.map((d, i) => {
            const val = d.value;
            const startY = runningTotal;
            if (!d.isTotal) {
                runningTotal += val;
            }
            const endY = d.isTotal ? val : runningTotal;
            return { ...d, startY, endY };
        });

        const maxCumulative = Math.max(...items.map(it => Math.max(it.startY, it.endY)), 1);

        chartSvg = `
            <svg class="w-full flex-1" viewBox="0 0 700 240" preserveAspectRatio="none">
                <line x1="40" y1="200" x2="680" y2="200" stroke="#cbd5e1" stroke-width="2" />
                ${items.map((it, i) => {
                    const topVal = Math.max(it.startY, it.endY);
                    const botVal = Math.min(it.startY, it.endY);
                    const h = Math.max(((topVal - botVal) / maxCumulative) * 160, 4);
                    const y = 200 - (topVal / maxCumulative) * 160;
                    const x = 50 + i * (barWidth + spacing);
                    const barColor = it.isTotal ? '#f59e0b' : (it.value >= 0 ? '#10b981' : '#f43f5e');

                    return `
                        <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="5" fill="${barColor}" opacity="0.9" />
                        <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="10" font-weight="bold" fill="#475569">${it.value < 0 ? '-' : ''}$${Math.abs(it.value).toLocaleString()}</text>
                        <text x="${x + barWidth / 2}" y="218" text-anchor="middle" font-size="10" font-weight="bold" fill="#64748b">${it.label}</text>
                    `;
                }).join('')}
            </svg>
        `;
    } else if (el.chartType === 'doughnut') {
        // GRÁFICO DE DONA CON TOTALIZADOR CENTRAL
        const total = data.reduce((acc, d) => acc + Math.abs(d.value), 0) || 1;
        const colors = ['#f59e0b', '#0284c7', '#10b981', '#8b5cf6', '#ec4899'];
        let currentDeg = 0;
        const gradientParts = data.map((d, i) => {
            const pct = (Math.abs(d.value) / total) * 100;
            const start = currentDeg;
            currentDeg += pct;
            return `${colors[i % colors.length]} ${start}% ${currentDeg}%`;
        }).join(', ');

        chartSvg = `
            <div class="flex items-center justify-around flex-1">
                <div class="relative w-44 h-44 rounded-full flex items-center justify-center shadow-inner" style="background: conic-gradient(${gradientParts});">
                    <div class="w-24 h-24 rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center font-black text-xs text-slate-800 dark:text-white shadow-sm">
                        <span class="text-[9px] text-slate-400 font-bold uppercase">Total</span>
                        <span>$ ${total.toLocaleString()}</span>
                    </div>
                </div>
                <div class="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    ${data.map((d, i) => `
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full" style="background-color: ${colors[i % colors.length]}"></span>
                            <span>${d.label}: $ ${d.value.toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else if (el.chartType === 'combo') {
        // GRÁFICO COMBINADO (BARRAS + LÍNEA DE TENDENCIA)
        const barWidth = 45;
        const spacing = (660 - (data.length * barWidth)) / (data.length + 1);
        const points = data.map((d, i) => {
            const x = 50 + i * (barWidth + spacing) + barWidth / 2;
            const y = 200 - (d.value / maxValue) * 160;
            return { x, y, ...d };
        });
        const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        chartSvg = `
            <svg class="w-full flex-1" viewBox="0 0 700 240" preserveAspectRatio="none">
                <line x1="40" y1="200" x2="680" y2="200" stroke="#cbd5e1" stroke-width="2" />
                <!-- Barras -->
                ${data.map((d, i) => {
                    const barH = (d.value / maxValue) * 160;
                    const x = 50 + i * (barWidth + spacing);
                    const y = 200 - barH;
                    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="5" fill="${el.color || '#f59e0b'}" opacity="0.8" />`;
                }).join('')}
                <!-- Línea de Tendencia -->
                <path d="${pathData}" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" />
                ${points.map(p => `
                    <circle cx="${p.x}" cy="${p.y}" r="5" fill="#ffffff" stroke="#0284c7" stroke-width="3" />
                    <text x="${p.x}" y="${p.y - 10}" text-anchor="middle" font-size="10" font-weight="bold" fill="#0284c7">${p.value}</text>
                    <text x="${p.x}" y="218" text-anchor="middle" font-size="10" font-weight="bold" fill="#64748b">${p.label}</text>
                `).join('')}
            </svg>
        `;
    } else if (el.chartType === 'line') {
        const points = data.map((d, i) => {
            const x = 60 + i * (600 / (data.length - 1 || 1));
            const y = 200 - (d.value / maxValue) * 160;
            return { x, y, ...d };
        });
        const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        chartSvg = `
            <svg class="w-full flex-1" viewBox="0 0 700 240" preserveAspectRatio="none">
                <line x1="40" y1="200" x2="680" y2="200" stroke="#cbd5e1" stroke-width="2" />
                <path d="${pathData}" fill="none" stroke="${el.color || '#f59e0b'}" stroke-width="4" stroke-linecap="round" />
                ${points.map(p => `
                    <circle cx="${p.x}" cy="${p.y}" r="6" fill="#ffffff" stroke="${el.color || '#f59e0b'}" stroke-width="3" />
                    <text x="${p.x}" y="${p.y - 10}" text-anchor="middle" font-size="11" font-weight="bold" fill="#475569">${p.value}</text>
                    <text x="${p.x}" y="222" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">${p.label}</text>
                `).join('')}
            </svg>
        `;
    } else if (el.chartType === 'pie') {
        chartSvg = `
            <div class="flex items-center justify-around flex-1">
                <div class="relative w-44 h-44 rounded-full flex items-center justify-center" style="background: conic-gradient(#f59e0b 0% 40%, #0284c7 40% 70%, #10b981 70% 100%);">
                    <div class="w-24 h-24 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center font-black text-xs text-slate-700 dark:text-slate-200">TOTAL</div>
                </div>
                <div class="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-amber-500"></span> Ventas (40%)</div>
                    <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-sky-500"></span> Costos (30%)</div>
                    <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-emerald-500"></span> Margen Neto (30%)</div>
                </div>
            </div>
        `;
    } else {
        // Barras por defecto
        const barWidth = 60;
        const spacing = (700 - (data.length * barWidth)) / (data.length + 1);

        chartSvg = `
            <svg class="w-full flex-1" viewBox="0 0 700 240" preserveAspectRatio="none">
                <line x1="40" y1="20" x2="680" y2="20" stroke="#f1f5f9" stroke-width="1.5" />
                <line x1="40" y1="80" x2="680" y2="80" stroke="#f1f5f9" stroke-width="1.5" />
                <line x1="40" y1="140" x2="680" y2="140" stroke="#f1f5f9" stroke-width="1.5" />
                <line x1="40" y1="200" x2="680" y2="200" stroke="#cbd5e1" stroke-width="2" />
                ${data.map((d, i) => {
                    const barH = (d.value / maxValue) * 170;
                    const x = 50 + i * (barWidth + spacing);
                    const y = 200 - barH;
                    return `
                        <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="6" fill="${el.color || '#f59e0b'}" />
                        <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" font-size="11" font-weight="bold" fill="#475569">${d.value}</text>
                        <text x="${x + barWidth / 2}" y="222" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">${d.label}</text>
                    `;
                }).join('')}
            </svg>
        `;
    }

    wrap.innerHTML = `
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 class="font-black text-sm text-slate-800 dark:text-white">${title}</h4>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${el.chartType || 'Barras'}</span>
        </div>
        ${chartSvg}
    `;

    container.appendChild(wrap);
}

function renderImageElementContent(container, el) {
    const img = document.createElement('img');
    img.className = 'w-full h-full object-cover rounded-xl shadow-sm pointer-events-none select-none';
    img.src = el.src || 'favicon.svg';

    // Filtros CSS avanzados y border radius
    const brightness = el.brightness !== undefined ? el.brightness : 100;
    const contrast = el.contrast !== undefined ? el.contrast : 100;
    const grayscale = el.grayscale !== undefined ? el.grayscale : 0;
    const blur = el.blur !== undefined ? el.blur : 0;
    img.style.filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) blur(${blur}px)`;
    if (el.borderRadius !== undefined) img.style.borderRadius = `${el.borderRadius}px`;
    if (el.boxShadow) img.style.boxShadow = el.boxShadow;

    container.appendChild(img);
}

function renderConnectorElementContent(container, el) {
    container.innerHTML = '';
    const relStartX = (el.startX !== undefined ? el.startX : el.x) - el.x;
    const relStartY = (el.startY !== undefined ? el.startY : el.y) - el.y;
    const relEndX = (el.endX !== undefined ? el.endX : el.x + el.width) - el.x;
    const relEndY = (el.endY !== undefined ? el.endY : el.y + el.height) - el.y;

    const markerId = 'arrow_' + el.id;

    let pathD = `M ${relStartX} ${relStartY} L ${relEndX} ${relEndY}`;
    if (el.connectorType === 'elbow') {
        const midX = (relStartX + relEndX) / 2;
        pathD = `M ${relStartX} ${relStartY} H ${midX} V ${relEndY} H ${relEndX}`;
    } else if (el.connectorType === 'bezier') {
        const dx = Math.abs(relEndX - relStartX) * 0.5;
        pathD = `M ${relStartX} ${relStartY} C ${relStartX + dx} ${relStartY}, ${relEndX - dx} ${relEndY}, ${relEndX} ${relEndY}`;
    }

    const svg = `
        <svg class="w-full h-full overflow-visible pointer-events-none">
            <defs>
                <marker id="${markerId}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="${el.stroke || '#0284c7'}" />
                </marker>
            </defs>
            <path d="${pathD}" fill="none" stroke="${el.stroke || '#0284c7'}" stroke-width="${el.strokeWidth || 2.5}" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${markerId})" />
        </svg>
    `;
    container.innerHTML = svg;
}

function renderAuditBadgeElementContent(container, el) {
    const badge = document.createElement('div');
    badge.className = 'w-full h-full rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm select-none';
    badge.style.backgroundColor = el.bg || '#ecfdf5';
    badge.style.border = `2.5px dashed ${el.color || '#059669'}`;
    badge.style.color = el.color || '#059669';
    badge.style.transform = `rotate(${el.tilt || -3}deg)`;

    badge.innerHTML = `
        <div class="flex items-center gap-1.5 mb-1 text-xs font-black uppercase tracking-widest">
            <i class="fas fa-certificate text-sm"></i>
            <span>${el.title || 'AUDITADO'}</span>
        </div>
        <div class="h-[1.5px] w-3/4 my-1 opacity-40" style="background-color: ${el.color || '#059669'}"></div>
        <span class="text-[9px] font-black uppercase tracking-wider opacity-85">EduConta SV • Ley de ES</span>
    `;
    container.appendChild(badge);
}

function renderIconElementContent(container, el) {
    const iconWrap = document.createElement('div');
    iconWrap.className = 'w-full h-full flex items-center justify-center';
    iconWrap.innerHTML = `<i class="fas ${el.iconClass || 'fa-chart-pie'}" style="font-size: ${Math.min(el.width, el.height) * 0.7}px; color: ${el.color || '#f59e0b'};"></i>`;
    container.appendChild(iconWrap);
}

function renderStickyElementContent(container, el) {
    const postIt = document.createElement('div');
    postIt.className = 'w-full h-full rounded-xl p-4 shadow-md flex flex-col justify-between';
    postIt.style.backgroundColor = el.color || '#fef08a';
    postIt.style.transform = `rotate(${el.tilt || -2}deg)`;

    postIt.innerHTML = `
        <div class="flex items-center justify-between opacity-50 mb-2">
            <i class="fas fa-thumbtack text-xs"></i>
            <span class="text-[9px] font-bold uppercase">Nota</span>
        </div>
        <p class="text-xs font-bold text-slate-800 flex-1 leading-snug">${el.text || 'Nota de Auditoría...'}</p>
    `;
    container.appendChild(postIt);
}

// =========================================================================
// 6. INTERACCIÓN CON ELEMENTOS (SELECCIÓN MÚLTIPLE, LAZO, SNAPPING 2.0, ALINEACIÓN)
// =========================================================================
function handleViewportClick(e) {
    if (e.target.closest('.slide-element') || 
        e.target.closest('#hud-slide-indicator') || 
        e.target.closest('.tool-btn') || 
        e.target.closest('#prop-controls-container') ||
        e.target.closest('#animation-timeline-drawer') ||
        e.target.closest('.modal-backdrop') ||
        isDragging || isResizing || isRotating || isMarqueeSelecting) {
        return;
    }
    deselectAllElements();
}

function handleStageMouseDown(e) {
    if (e.target.closest('.slide-element') || 
        e.target.closest('.resize-handle') || 
        e.target.closest('.rotation-handle') ||
        e.target.closest('.connector-port') ||
        window.isAuditMode) {
        return;
    }

    if (e.button !== 0) return; // Solo clic izquierdo

    // Iniciar Lazo Elástico (Marquee Selection)
    const artboard = document.getElementById('slide-artboard') || document.getElementById('slide-stage-artboard');
    if (!artboard) return;

    const rect = artboard.getBoundingClientRect();
    isMarqueeSelecting = true;
    marqueeStart = {
        x: (e.clientX - rect.left) / zoomScale,
        y: (e.clientY - rect.top) / zoomScale,
        screenX: e.clientX,
        screenY: e.clientY
    };

    if (!e.shiftKey) {
        deselectAllElements();
    }

    const box = document.getElementById('marquee-selection-box');
    if (box) {
        box.style.left = `${marqueeStart.x}px`;
        box.style.top = `${marqueeStart.y}px`;
        box.style.width = '0px';
        box.style.height = '0px';
        box.style.display = 'block';
    }

    window.addEventListener('mousemove', handleStageMouseMove);
    window.addEventListener('mouseup', handleStageMouseUp);
}

function handleStageMouseMove(e) {
    if (!isMarqueeSelecting) return;

    const artboard = document.getElementById('slide-artboard') || document.getElementById('slide-stage-artboard');
    if (!artboard) return;

    const rect = artboard.getBoundingClientRect();
    const curX = (e.clientX - rect.left) / zoomScale;
    const curY = (e.clientY - rect.top) / zoomScale;

    const minX = Math.min(marqueeStart.x, curX);
    const minY = Math.min(marqueeStart.y, curY);
    const w = Math.abs(curX - marqueeStart.x);
    const h = Math.abs(curY - marqueeStart.y);

    const box = document.getElementById('marquee-selection-box');
    if (box) {
        box.style.left = `${minX}px`;
        box.style.top = `${minY}px`;
        box.style.width = `${w}px`;
        box.style.height = `${h}px`;
    }

    // Detectar intersecciones con elementos
    const currentSlide = getActiveSlide();
    if (!currentSlide || !currentSlide.elements) return;

    const intersectingIds = [];
    currentSlide.elements.forEach(el => {
        if (el.hidden || el.locked) return;
        const elR = el.x + el.width;
        const elB = el.y + el.height;
        const selR = minX + w;
        const selB = minY + h;

        const intersects = !(el.x > selR || elR < minX || el.y > selB || elB < minY);
        if (intersects) {
            intersectingIds.push(el.id);
        }
    });

    // Actualizar clases de selección temporalmente
    currentSlide.elements.forEach(el => {
        const dom = document.getElementById('dom_' + el.id);
        if (!dom) return;
        if (intersectingIds.includes(el.id) || (e.shiftKey && selectedElementIds.includes(el.id))) {
            dom.classList.add('selected');
        } else {
            dom.classList.remove('selected');
        }
    });
}

function handleStageMouseUp(e) {
    if (!isMarqueeSelecting) return;
    isMarqueeSelecting = false;

    window.removeEventListener('mousemove', handleStageMouseMove);
    window.removeEventListener('mouseup', handleStageMouseUp);

    const box = document.getElementById('marquee-selection-box');
    if (box) box.style.display = 'none';

    const artboard = document.getElementById('slide-artboard') || document.getElementById('slide-stage-artboard');
    if (!artboard) return;

    const rect = artboard.getBoundingClientRect();
    const curX = (e.clientX - rect.left) / zoomScale;
    const curY = (e.clientY - rect.top) / zoomScale;

    const minX = Math.min(marqueeStart.x, curX);
    const minY = Math.min(marqueeStart.y, curY);
    const w = Math.abs(curX - marqueeStart.x);
    const h = Math.abs(curY - marqueeStart.y);

    const currentSlide = getActiveSlide();
    if (!currentSlide || !currentSlide.elements) return;

    // Si el arrastre fue insignificante, fue un simple clic
    if (w < 4 && h < 4) {
        if (!e.shiftKey) deselectAllElements();
        return;
    }

    const newSelected = [];
    currentSlide.elements.forEach(el => {
        if (el.hidden || el.locked) return;
        const elR = el.x + el.width;
        const elB = el.y + el.height;
        const selR = minX + w;
        const selB = minY + h;

        const intersects = !(el.x > selR || elR < minX || el.y > selB || elB < minY);
        if (intersects) {
            newSelected.push(el.id);
        }
    });

    if (e.shiftKey) {
        newSelected.forEach(id => {
            if (!selectedElementIds.includes(id)) selectedElementIds.push(id);
        });
    } else {
        selectedElementIds = newSelected;
    }

    updateSelectionUI();
}

function selectElement(id, addToSelection = false) {
    // Si la brocha de formato está activa, aplicar estilos al elemento y salir
    if (formatPainterStyle) {
        applyFormatPainterToElement(id);
        return;
    }

    const currentSlide = getActiveSlide();
    const el = currentSlide?.elements.find(item => item.id === id);
    if (el && el.locked && !addToSelection) {
        showToastNotification("Elemento bloqueado (desbloquéalo en el panel de Capas)");
        return;
    }

    if (addToSelection) {
        const idx = selectedElementIds.indexOf(id);
        if (idx !== -1) {
            selectedElementIds.splice(idx, 1);
        } else {
            selectedElementIds.push(id);
        }
    } else {
        selectedElementIds = [id];
    }

    updateSelectionUI();
}

function deselectAllElements() {
    selectedElementIds = [];
    updateSelectionUI();
}

function updateSelectionUI() {
    const all = document.querySelectorAll('.slide-element');
    all.forEach(dom => {
        const id = dom.id.replace('dom_', '');
        if (selectedElementIds.includes(id)) {
            dom.classList.add('selected');
        } else {
            dom.classList.remove('selected');
        }
    });

    updatePropertyBar();
    renderAnimationBadges();
    renderLayersList();
}

function startDraggingElement(e, id) {
    if (e.target.classList.contains('resize-handle') || 
        e.target.classList.contains('rotation-handle') ||
        e.target.classList.contains('connector-port') ||
        window.isAuditMode) {
        return;
    }

    const currentSlide = getActiveSlide();
    const el = currentSlide?.elements.find(item => item.id === id);
    if (!el || el.locked) return;

    if (e.shiftKey) {
        selectElement(id, true);
        return;
    }

    if (!selectedElementIds.includes(id)) {
        selectElement(id, false);
    }

    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    // Guardar posición inicial de todos los elementos seleccionados
    multiDragStarts = {};
    selectedElementIds.forEach(selId => {
        const item = currentSlide.elements.find(it => it.id === selId);
        if (item) {
            multiDragStarts[selId] = { x: item.x, y: item.y, width: item.width, height: item.height };
        }
    });

    elementStartBounds = { ...el };

    window.addEventListener('mousemove', handleElementDrag);
    window.addEventListener('mouseup', stopDraggingElement);
}

function handleElementDrag(e) {
    if (!isDragging || selectedElementIds.length === 0) return;

    const dx = (e.clientX - dragStartX) / zoomScale;
    const dy = (e.clientY - dragStartY) / zoomScale;

    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    const primaryEl = currentSlide.elements.find(item => item.id === selectedElementId) || 
                      currentSlide.elements.find(item => item.id === selectedElementIds[0]);
    if (!primaryEl || !multiDragStarts[primaryEl.id]) return;

    const primaryStart = multiDragStarts[primaryEl.id];
    let newX = Math.round(primaryStart.x + dx);
    let newY = Math.round(primaryStart.y + dy);

    // =========================================================================
    // SMART SNAPPING 2.0 (CENTROS DEL LIENZO + BORDES DE OTROS ELEMENTOS)
    // =========================================================================
    const guideV = document.getElementById('snap-guide-v');
    const guideH = document.getElementById('snap-guide-h');
    const snapThreshold = 6;
    let snappedX = false;
    let snappedY = false;

    const primaryCenterX = newX + primaryEl.width / 2;
    const primaryCenterY = newY + primaryEl.height / 2;
    const stageCenterX = STAGE_WIDTH / 2;
    const stageCenterY = STAGE_HEIGHT / 2;

    // Snapping a los ejes del escenario (480x270)
    if (Math.abs(primaryCenterX - stageCenterX) < snapThreshold) {
        newX = stageCenterX - primaryEl.width / 2;
        if (guideV) {
            guideV.style.left = `${stageCenterX}px`;
            guideV.style.display = 'block';
        }
        snappedX = true;
    }
    if (Math.abs(primaryCenterY - stageCenterY) < snapThreshold) {
        newY = stageCenterY - primaryEl.height / 2;
        if (guideH) {
            guideH.style.top = `${stageCenterY}px`;
            guideH.style.display = 'block';
        }
        snappedY = true;
    }

    // Snapping objeto contra objeto con elementos visibles no seleccionados
    const otherElements = currentSlide.elements.filter(it => !selectedElementIds.includes(it.id) && !it.hidden);

    for (const other of otherElements) {
        const otherLeft = other.x;
        const otherCenter = other.x + other.width / 2;
        const otherRight = other.x + other.width;

        const myLeft = newX;
        const myCenter = newX + primaryEl.width / 2;
        const myRight = newX + primaryEl.width;

        if (!snappedX) {
            if (Math.abs(myLeft - otherLeft) < snapThreshold) {
                newX = otherLeft;
                showSnapGuideV(otherLeft);
                snappedX = true;
            } else if (Math.abs(myCenter - otherCenter) < snapThreshold) {
                newX = otherCenter - primaryEl.width / 2;
                showSnapGuideV(otherCenter);
                snappedX = true;
            } else if (Math.abs(myRight - otherRight) < snapThreshold) {
                newX = otherRight - primaryEl.width;
                showSnapGuideV(otherRight);
                snappedX = true;
            } else if (Math.abs(myLeft - otherRight) < snapThreshold) {
                newX = otherRight;
                showSnapGuideV(otherRight);
                snappedX = true;
            } else if (Math.abs(myRight - otherLeft) < snapThreshold) {
                newX = otherLeft - primaryEl.width;
                showSnapGuideV(otherLeft);
                snappedX = true;
            }
        }

        const otherTop = other.y;
        const otherMiddle = other.y + other.height / 2;
        const otherBottom = other.y + other.height;

        const myTop = newY;
        const myMiddle = newY + primaryEl.height / 2;
        const myBottom = newY + primaryEl.height;

        if (!snappedY) {
            if (Math.abs(myTop - otherTop) < snapThreshold) {
                newY = otherTop;
                showSnapGuideH(otherTop);
                snappedY = true;
            } else if (Math.abs(myMiddle - otherMiddle) < snapThreshold) {
                newY = otherMiddle - primaryEl.height / 2;
                showSnapGuideH(otherMiddle);
                snappedY = true;
            } else if (Math.abs(myBottom - otherBottom) < snapThreshold) {
                newY = otherBottom - primaryEl.height;
                showSnapGuideH(otherBottom);
                snappedY = true;
            } else if (Math.abs(myTop - otherBottom) < snapThreshold) {
                newY = otherBottom;
                showSnapGuideH(otherBottom);
                snappedY = true;
            } else if (Math.abs(myBottom - otherTop) < snapThreshold) {
                newY = otherTop - primaryEl.height;
                showSnapGuideH(otherTop);
                snappedY = true;
            }
        }
    }

    if (!snappedX && guideV) guideV.style.display = 'none';
    if (!snappedY && guideH) guideH.style.display = 'none';

    // Desplazamiento efectivo calculado con snapping
    const effectiveDx = newX - primaryStart.x;
    const effectiveDy = newY - primaryStart.y;

    // Mover todos los elementos seleccionados de forma sincronizada
    selectedElementIds.forEach(id => {
        const item = currentSlide.elements.find(it => it.id === id);
        const start = multiDragStarts[id];
        if (!item || !start) return;

        item.x = Math.round(start.x + effectiveDx);
        item.y = Math.round(start.y + effectiveDy);

        const dom = document.getElementById('dom_' + item.id);
        if (dom) {
            dom.style.left = `${item.x}px`;
            dom.style.top = `${item.y}px`;
        }
    });

    // Actualizar conectores magnéticos asociados a los elementos movidos
    updateConnectorsForElements(selectedElementIds);
}

function showSnapGuideV(x) {
    const guideV = document.getElementById('snap-guide-v');
    if (guideV) {
        guideV.style.left = `${x}px`;
        guideV.style.display = 'block';
    }
}

function showSnapGuideH(y) {
    const guideH = document.getElementById('snap-guide-h');
    if (guideH) {
        guideH.style.top = `${y}px`;
        guideH.style.display = 'block';
    }
}

function stopDraggingElement() {
    isDragging = false;
    window.removeEventListener('mousemove', handleElementDrag);
    window.removeEventListener('mouseup', stopDraggingElement);

    const guideV = document.getElementById('snap-guide-v');
    const guideH = document.getElementById('snap-guide-h');
    if (guideV) guideV.style.display = 'none';
    if (guideH) guideH.style.display = 'none';

    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function startResizing(e, id, handle) {
    e.stopPropagation();
    if (window.isAuditMode) return;

    selectElement(id);
    const currentSlide = getActiveSlide();
    const el = currentSlide.elements.find(item => item.id === id);
    if (!el || el.locked) return;

    isResizing = true;
    activeHandle = handle;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    elementStartBounds = { ...el };

    window.addEventListener('mousemove', handleElementResize);
    window.addEventListener('mouseup', stopResizing);
}

function handleElementResize(e) {
    if (!isResizing || !selectedElementId) return;

    const dx = (e.clientX - dragStartX) / zoomScale;
    const dy = (e.clientY - dragStartY) / zoomScale;

    const currentSlide = getActiveSlide();
    const el = currentSlide.elements.find(item => item.id === selectedElementId);
    if (!el) return;

    let { x, y, width, height } = elementStartBounds;

    if (activeHandle.includes('e')) width = Math.max(30, width + dx);
    if (activeHandle.includes('s')) height = Math.max(20, height + dy);
    if (activeHandle.includes('w')) {
        const newW = Math.max(30, width - dx);
        x = x + (width - newW);
        width = newW;
    }
    if (activeHandle.includes('n')) {
        const newH = Math.max(20, height - dy);
        y = y + (height - newH);
        height = newH;
    }

    el.x = Math.round(x);
    el.y = Math.round(y);
    el.width = Math.round(width);
    el.height = Math.round(height);

    const domEl = document.getElementById('dom_' + el.id);
    if (domEl) {
        domEl.style.left = `${el.x}px`;
        domEl.style.top = `${el.y}px`;
        domEl.style.width = `${el.width}px`;
        domEl.style.height = `${el.height}px`;
    }

    updateConnectorsForElements([el.id]);
}

function stopResizing() {
    isResizing = false;
    activeHandle = null;
    window.removeEventListener('mousemove', handleElementResize);
    window.removeEventListener('mouseup', stopResizing);

    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function startRotating(e, id) {
    e.stopPropagation();
    if (window.isAuditMode) return;

    selectElement(id);
    const currentSlide = getActiveSlide();
    const el = currentSlide.elements.find(item => item.id === id);
    if (!el || el.locked) return;

    isRotating = true;
    const domEl = document.getElementById('dom_' + id);
    const rect = domEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const onRotateMove = (moveEvt) => {
        const radians = Math.atan2(moveEvt.clientY - centerY, moveEvt.clientX - centerX);
        let degrees = Math.round((radians * (180 / Math.PI)) + 90);
        if (degrees < 0) degrees += 360;

        // Snapping a 0, 90, 180, 270 grados
        if (Math.abs(degrees - 0) < 5 || Math.abs(degrees - 360) < 5) degrees = 0;
        if (Math.abs(degrees - 90) < 5) degrees = 90;
        if (Math.abs(degrees - 180) < 5) degrees = 180;
        if (Math.abs(degrees - 270) < 5) degrees = 270;

        el.rotation = degrees;
        domEl.style.transform = `rotate(${degrees}deg)`;
    };

    const onRotateUp = () => {
        isRotating = false;
        window.removeEventListener('mousemove', onRotateMove);
        window.removeEventListener('mouseup', onRotateUp);
        pushHistoryState();
        triggerAutoSave();
    };

    window.addEventListener('mousemove', onRotateMove);
    window.addEventListener('mouseup', onRotateUp);
}

// =========================================================================
// ALINEACIÓN, DISTRIBUCIÓN Y AGRUPACIÓN
// =========================================================================
function alignSelectedElements(alignment) {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length === 0) return;

    if (selectedElementIds.length === 1) {
        // Alinear respecto al lienzo de la diapositiva (960 x 540)
        const el = currentSlide.elements.find(it => it.id === selectedElementIds[0]);
        if (!el || el.locked) return;

        if (alignment === 'left') el.x = 0;
        else if (alignment === 'center') el.x = Math.round((STAGE_WIDTH - el.width) / 2);
        else if (alignment === 'right') el.x = STAGE_WIDTH - el.width;
        else if (alignment === 'top') el.y = 0;
        else if (alignment === 'middle') el.y = Math.round((STAGE_HEIGHT - el.height) / 2);
        else if (alignment === 'bottom') el.y = STAGE_HEIGHT - el.height;
    } else {
        // Alinear respecto a la caja delimitadora de la selección múltiple
        const items = currentSlide.elements.filter(it => selectedElementIds.includes(it.id) && !it.locked);
        if (items.length < 2) return;

        const minX = Math.min(...items.map(it => it.x));
        const maxX = Math.max(...items.map(it => it.x + it.width));
        const minY = Math.min(...items.map(it => it.y));
        const maxY = Math.max(...items.map(it => it.y + it.height));

        items.forEach(el => {
            if (alignment === 'left') el.x = minX;
            else if (alignment === 'center') el.x = Math.round(((minX + maxX) / 2) - (el.width / 2));
            else if (alignment === 'right') el.x = maxX - el.width;
            else if (alignment === 'top') el.y = minY;
            else if (alignment === 'middle') el.y = Math.round(((minY + maxY) / 2) - (el.height / 2));
            else if (alignment === 'bottom') el.y = maxY - el.height;
        });
    }

    renderActiveSlide();
    updateConnectorsForElements(selectedElementIds);
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
    showToastNotification(`Alineación aplicada (${alignment})`);
}

function distributeSelectedElements(axis) {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length < 3) {
        showToastNotification("Selecciona al menos 3 elementos para distribuir");
        return;
    }

    const items = currentSlide.elements.filter(it => selectedElementIds.includes(it.id) && !it.locked);
    if (items.length < 3) return;

    if (axis === 'horizontal') {
        items.sort((a, b) => a.x - b.x);
        const first = items[0];
        const last = items[items.length - 1];
        const totalSpan = (last.x + last.width) - first.x;
        const totalWidths = items.reduce((sum, it) => sum + it.width, 0);
        const gap = (totalSpan - totalWidths) / (items.length - 1);

        let currentX = first.x;
        items.forEach(it => {
            it.x = Math.round(currentX);
            currentX += it.width + gap;
        });
    } else if (axis === 'vertical') {
        items.sort((a, b) => a.y - b.y);
        const first = items[0];
        const last = items[items.length - 1];
        const totalSpan = (last.y + last.height) - first.y;
        const totalHeights = items.reduce((sum, it) => sum + it.height, 0);
        const gap = (totalSpan - totalHeights) / (items.length - 1);

        let currentY = first.y;
        items.forEach(it => {
            it.y = Math.round(currentY);
            currentY += it.height + gap;
        });
    }

    renderActiveSlide();
    updateConnectorsForElements(selectedElementIds);
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
    showToastNotification(`Distribución ${axis} completada`);
}

function groupSelectedElements() {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length < 2) {
        showToastNotification("Selecciona 2 o más elementos para agrupar");
        return;
    }

    const groupId = 'grp_' + Date.now();
    currentSlide.elements.forEach(el => {
        if (selectedElementIds.includes(el.id)) {
            el.groupId = groupId;
        }
    });

    updatePropertyBar();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    showToastNotification("Elementos agrupados (Ctrl+G)");
}

function ungroupSelectedElements() {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length === 0) return;

    currentSlide.elements.forEach(el => {
        if (selectedElementIds.includes(el.id)) {
            delete el.groupId;
        }
    });

    updatePropertyBar();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    showToastNotification("Elementos desagrupados (Ctrl+Shift+G)");
}

function updateConnectorsForElements(elementIds) {
    const currentSlide = getActiveSlide();
    if (!currentSlide || !currentSlide.elements) return;

    const connectors = currentSlide.elements.filter(it => it.type === 'connector' && (elementIds.includes(it.startElementId) || elementIds.includes(it.endElementId)));

    connectors.forEach(conn => {
        const startEl = currentSlide.elements.find(it => it.id === conn.startElementId);
        const endEl = currentSlide.elements.find(it => it.id === conn.endElementId);

        if (startEl && endEl) {
            // Calcular centros relativos
            const startCenter = { x: startEl.x + startEl.width / 2, y: startEl.y + startEl.height / 2 };
            const endCenter = { x: endEl.x + endEl.width / 2, y: endEl.y + endEl.height / 2 };

            conn.x = Math.min(startCenter.x, endCenter.x) - 20;
            conn.y = Math.min(startCenter.y, endCenter.y) - 20;
            conn.width = Math.max(Math.abs(endCenter.x - startCenter.x) + 40, 50);
            conn.height = Math.max(Math.abs(endCenter.y - startCenter.y) + 40, 50);
            conn.startX = startCenter.x;
            conn.startY = startCenter.y;
            conn.endX = endCenter.x;
            conn.endY = endCenter.y;

            const domConn = document.getElementById('dom_' + conn.id);
            if (domConn) {
                domConn.style.left = `${conn.x}px`;
                domConn.style.top = `${conn.y}px`;
                domConn.style.width = `${conn.width}px`;
                domConn.style.height = `${conn.height}px`;
                renderConnectorElementContent(domConn.querySelector('.connector-content-wrap') || domConn, conn);
            }
        }
    });
}

// =========================================================================
// 7. BARRA DE PROPIEDADES DINÁMICA (CONTEXT PROPERTY BAR PRO)
// =========================================================================
function updatePropertyBar() {
    const bar = document.getElementById('prop-controls-container');
    const badge = document.getElementById('selection-status-badge');
    if (!bar) return;

    bar.innerHTML = '';
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    // CASO 1: SELECCIÓN MÚLTIPLE (2 o más elementos seleccionados)
    if (selectedElementIds.length > 1) {
        if (badge) badge.textContent = `${selectedElementIds.length} elementos seleccionados`;

        bar.innerHTML = `
            <div class="flex items-center gap-1">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Alinear:</span>
                <button onclick="alignSelectedElements('left')" class="tool-icon-btn !w-7 !h-7" title="Alinear a la izquierda"><i class="fas fa-align-left text-xs"></i></button>
                <button onclick="alignSelectedElements('center')" class="tool-icon-btn !w-7 !h-7" title="Alinear al centro"><i class="fas fa-align-center text-xs"></i></button>
                <button onclick="alignSelectedElements('right')" class="tool-icon-btn !w-7 !h-7" title="Alinear a la derecha"><i class="fas fa-align-right text-xs"></i></button>
                <button onclick="alignSelectedElements('top')" class="tool-icon-btn !w-7 !h-7" title="Alinear arriba"><i class="fas fa-arrow-up text-xs"></i></button>
                <button onclick="alignSelectedElements('middle')" class="tool-icon-btn !w-7 !h-7" title="Alinear al centro vertical"><i class="fas fa-arrows-alt-v text-xs"></i></button>
                <button onclick="alignSelectedElements('bottom')" class="tool-icon-btn !w-7 !h-7" title="Alinear abajo"><i class="fas fa-arrow-down text-xs"></i></button>
            </div>

            <div class="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

            <div class="flex items-center gap-1">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Distribuir:</span>
                <button onclick="distributeSelectedElements('horizontal')" class="tool-icon-btn !w-7 !h-7" title="Distribuir horizontalmente"><i class="fas fa-arrows-alt-h text-xs"></i></button>
                <button onclick="distributeSelectedElements('vertical')" class="tool-icon-btn !w-7 !h-7" title="Distribuir verticalmente"><i class="fas fa-arrows-alt-v text-xs"></i></button>
            </div>

            <div class="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

            <div class="flex items-center gap-1">
                <button onclick="groupSelectedElements()" class="tool-icon-btn !w-7 !h-7 text-amber-500 hover:text-amber-600" title="Agrupar selección (Ctrl+G)"><i class="fas fa-object-group text-xs"></i></button>
                <button onclick="ungroupSelectedElements()" class="tool-icon-btn !w-7 !h-7 text-slate-500" title="Desagrupar selección (Ctrl+Shift+G)"><i class="fas fa-object-ungroup text-xs"></i></button>
                <button onclick="duplicateSelectedElements()" class="tool-icon-btn !w-7 !h-7" title="Duplicar selección"><i class="far fa-copy text-xs"></i></button>
                <button onclick="deleteSelectedElements()" class="tool-icon-btn !w-7 !h-7 hover:!text-rose-500" title="Eliminar selección"><i class="far fa-trash-alt text-xs"></i></button>
            </div>
        `;
        return;
    }

    // CASO 2: NINGÚN ELEMENTO SELECCIONADO (Propiedades de la Diapositiva)
    const el = selectedElementIds.length === 1 ? (currentSlide.elements || []).find(item => item.id === selectedElementIds[0]) : null;

    if (!el) {
        if (badge) badge.textContent = `Diapositiva #${activeSlideIndex + 1}`;

        const transType = currentSlide.transition?.type || currentSlide.transition || 'fade';
        const transDir = currentSlide.transition?.direction || 'left';
        const transDur = currentSlide.transition?.duration || 600;

        bar.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fondo:</span>
                <button onclick="setSlideBackground('#ffffff')" class="w-5 h-5 rounded-md border border-slate-300 bg-white" title="Blanco"></button>
                <button onclick="setSlideBackground('#f8fafc')" class="w-5 h-5 rounded-md border border-slate-300 bg-slate-50" title="Gris Claro"></button>
                <button onclick="setSlideBackground('#0f172a')" class="w-5 h-5 rounded-md border border-slate-700 bg-slate-900" title="Oscuro"></button>
                <button onclick="setSlideBackground('#fffbeb')" class="w-5 h-5 rounded-md border border-amber-300 bg-amber-50" title="Ámbar Claro"></button>
                <button onclick="setSlideBackground('#ecfdf5')" class="w-5 h-5 rounded-md border border-emerald-300 bg-emerald-50" title="Esmeralda"></button>
                <button onclick="setSlideBackground('linear-gradient(135deg, #0f172a 0%, #1e293b 100%)')" class="w-5 h-5 rounded-md border border-slate-700" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);" title="Gradiente Noche"></button>
                <button onclick="setSlideBackground('linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)')" class="w-5 h-5 rounded-md border border-amber-300" style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);" title="Gradiente Dorado"></button>
            </div>

            <div class="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-2"></div>

            <div class="flex items-center gap-2">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Transición:</span>
                <select onchange="setSlideTransitionType(this.value)" class="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                    <option value="fade" ${transType === 'fade' ? 'selected' : ''}>Desvanecer</option>
                    <option value="slide" ${transType === 'slide' ? 'selected' : ''}>Deslizar</option>
                    <option value="push" ${transType === 'push' ? 'selected' : ''}>Empujar</option>
                    <option value="zoom" ${transType === 'zoom' ? 'selected' : ''}>Zoom</option>
                    <option value="flip3d" ${transType === 'flip3d' || transType === 'flip' ? 'selected' : ''}>Giro 3D</option>
                    <option value="morph" ${transType === 'morph' ? 'selected' : ''}>✨ Morph (Transformación)</option>
                </select>

                ${['slide', 'push'].includes(transType) ? `
                    <select onchange="setSlideTransitionDir(this.value)" class="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                        <option value="left" ${transDir === 'left' ? 'selected' : ''}>Izquierda</option>
                        <option value="right" ${transDir === 'right' ? 'selected' : ''}>Derecha</option>
                        <option value="up" ${transDir === 'up' ? 'selected' : ''}>Arriba</option>
                        <option value="down" ${transDir === 'down' ? 'selected' : ''}>Abajo</option>
                    </select>
                ` : ''}

                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Duración:</span>
                <select onchange="setSlideTransitionDuration(parseInt(this.value))" class="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                    <option value="300" ${transDur === 300 ? 'selected' : ''}>0.3s (Rápido)</option>
                    <option value="600" ${transDur === 600 ? 'selected' : ''}>0.6s (Normal)</option>
                    <option value="1000" ${transDur === 1000 ? 'selected' : ''}>1.0s (Suave)</option>
                    <option value="1500" ${transDur === 1500 ? 'selected' : ''}>1.5s (Lento)</option>
                </select>
            </div>
        `;
        return;
    }

    // CASO 3: UN SOLO ELEMENTO SELECCIONADO
    if (badge) badge.textContent = `${el.type.toUpperCase()}${el.groupId ? ' (Agrupado)' : ''}`;

    const animCount = (currentSlide.animations || []).filter(a => a.elementId === el.id).length;

    // BOTONES UNIVERSALES (ANIMAR, CAPAS, DUPLICAR, BORRAR)
    const universalButtonsHtml = `
        <div class="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
        <button onclick="openAddAnimationModal('${el.id}')" class="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-all" title="Gestionar Animaciones">
            <i class="fas fa-wand-magic-sparkles text-xs"></i>
            <span>Animar</span>
            ${animCount > 0 ? `<span class="w-4 h-4 rounded-full bg-amber-500 text-slate-900 text-[10px] font-black flex items-center justify-center">${animCount}</span>` : ''}
        </button>
        <button onclick="toggleFormatPainter()" class="tool-icon-btn !w-6 !h-6 ${formatPainterStyle ? 'active !text-amber-500' : ''}" title="Copiar Formato (Brocha)"><i class="fas fa-paint-roller text-xs"></i></button>
        <button onclick="bringElementToFront()" class="tool-icon-btn !w-6 !h-6" title="Traer al frente"><i class="fas fa-arrow-up text-xs"></i></button>
        <button onclick="sendElementToBack()" class="tool-icon-btn !w-6 !h-6" title="Enviar al fondo"><i class="fas fa-arrow-down text-xs"></i></button>
        <button onclick="duplicateSelectedElements()" class="tool-icon-btn !w-6 !h-6" title="Duplicar"><i class="far fa-copy text-xs"></i></button>
        <button onclick="deleteSelectedElements()" class="tool-icon-btn !w-6 !h-6 hover:!text-rose-500" title="Eliminar"><i class="far fa-trash-alt text-xs"></i></button>
    `;

    // 3.1. PROPIEDADES DE TEXTO ENRIQUECIDO PRO
    if (el.type === 'text') {
        const isBold = el.fontWeight === 'bold' || el.fontWeight === '800' || el.fontWeight === '900';
        const isItalic = el.fontStyle === 'italic';
        const isUnderline = el.textDecoration?.includes('underline');
        const isStrike = el.textDecoration?.includes('line-through');

        bar.innerHTML = `
            <!-- Tipografía -->
            <select onchange="updateSelectedTextProp('fontFamily', this.value)" class="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                <option value="Plus Jakarta Sans" ${el.fontFamily === 'Plus Jakarta Sans' ? 'selected' : ''}>Plus Jakarta Sans</option>
                <option value="Playfair Display" ${el.fontFamily === 'Playfair Display' ? 'selected' : ''}>Playfair Display</option>
                <option value="JetBrains Mono" ${el.fontFamily === 'JetBrains Mono' ? 'selected' : ''}>JetBrains Mono</option>
                <option value="Georgia" ${el.fontFamily === 'Georgia' ? 'selected' : ''}>Georgia</option>
                <option value="Inter" ${el.fontFamily === 'Inter' ? 'selected' : ''}>Inter</option>
            </select>

            <!-- Tamaño -->
            <button onclick="changeFontSize(-2)" class="tool-icon-btn !w-6 !h-6"><i class="fas fa-minus text-[10px]"></i></button>
            <span class="text-xs font-black text-slate-700 dark:text-slate-200 px-1">${el.fontSize || 16}px</span>
            <button onclick="changeFontSize(2)" class="tool-icon-btn !w-6 !h-6"><i class="fas fa-plus text-[10px]"></i></button>

            <div class="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

            <!-- Estilos de Caracter -->
            <button onclick="toggleTextWeight()" class="tool-icon-btn !w-6 !h-6 ${isBold ? 'active' : ''}" title="Negrita (Ctrl+B)"><i class="fas fa-bold text-xs"></i></button>
            <button onclick="toggleTextItalic()" class="tool-icon-btn !w-6 !h-6 ${isItalic ? 'active' : ''}" title="Cursiva (Ctrl+I)"><i class="fas fa-italic text-xs"></i></button>
            <button onclick="toggleTextUnderline()" class="tool-icon-btn !w-6 !h-6 ${isUnderline ? 'active' : ''}" title="Subrayado (Ctrl+U)"><i class="fas fa-underline text-xs"></i></button>
            <button onclick="toggleTextStrikethrough()" class="tool-icon-btn !w-6 !h-6 ${isStrike ? 'active' : ''}" title="Tachado"><i class="fas fa-strikethrough text-xs"></i></button>
            <button onclick="toggleTextTransform()" class="tool-icon-btn !w-6 !h-6 ${el.textTransform === 'uppercase' ? 'active' : ''}" title="Mayúsculas / Minúsculas"><i class="fas fa-font-case text-xs">Aa</i></button>

            <div class="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

            <!-- Alineación -->
            <button onclick="setTextAlign('left')" class="tool-icon-btn !w-6 !h-6 ${el.textAlign === 'left' ? 'active' : ''}"><i class="fas fa-align-left text-xs"></i></button>
            <button onclick="setTextAlign('center')" class="tool-icon-btn !w-6 !h-6 ${el.textAlign === 'center' ? 'active' : ''}"><i class="fas fa-align-center text-xs"></i></button>
            <button onclick="setTextAlign('right')" class="tool-icon-btn !w-6 !h-6 ${el.textAlign === 'right' ? 'active' : ''}"><i class="fas fa-align-right text-xs"></i></button>
            <button onclick="setTextAlign('justify')" class="tool-icon-btn !w-6 !h-6 ${el.textAlign === 'justify' ? 'active' : ''}"><i class="fas fa-align-justify text-xs"></i></button>

            <!-- Interlineado y Espaciado -->
            <select onchange="updateTextLineHeight(this.value)" class="bg-slate-100 dark:bg-slate-800 rounded-lg px-1.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer" title="Interlineado">
                <option value="1.0" ${el.lineHeight === 1.0 ? 'selected' : ''}>1.0x</option>
                <option value="1.2" ${el.lineHeight === 1.2 ? 'selected' : ''}>1.2x</option>
                <option value="1.4" ${!el.lineHeight || el.lineHeight === 1.4 ? 'selected' : ''}>1.4x</option>
                <option value="1.8" ${el.lineHeight === 1.8 ? 'selected' : ''}>1.8x</option>
                <option value="2.0" ${el.lineHeight === 2.0 ? 'selected' : ''}>2.0x</option>
            </select>

            <div class="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

            <!-- Color de Texto y Resaltado -->
            <div class="flex items-center gap-1.5">
                <label class="flex items-center gap-1 cursor-pointer" title="Color de Texto">
                    <span class="text-[9px] font-bold text-slate-400">T</span>
                    <input type="color" value="${el.color || '#0f172a'}" onchange="updateSelectedTextProp('color', this.value)" class="w-5 h-5 rounded border-0 cursor-pointer bg-transparent">
                </label>
                <label class="flex items-center gap-1 cursor-pointer" title="Resaltado de Fondo">
                    <i class="fas fa-highlighter text-[10px] text-slate-400"></i>
                    <input type="color" value="${el.highlightBg || '#ffffff'}" onchange="updateSelectedTextProp('highlightBg', this.value)" class="w-5 h-5 rounded border-0 cursor-pointer bg-transparent">
                </label>
            </div>

            <!-- Opacidad -->
            <div class="flex items-center gap-1 ml-1" title="Opacidad">
                <i class="fas fa-adjust text-[10px] text-slate-400"></i>
                <input type="range" min="0.1" max="1" step="0.05" value="${el.opacity !== undefined ? el.opacity : 1}" oninput="updateElementOpacity(this.value)" class="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-amber-500">
            </div>

            ${universalButtonsHtml}
        `;
    } else if (el.type === 'shape') {
        // 3.2. FORMAS Y CONTENEDORES
        bar.innerHTML = `
            <span class="text-[10px] font-black text-slate-400 uppercase">Relleno:</span>
            <input type="color" value="${el.fill || '#f59e0b'}" onchange="updateShapeProp('fill', this.value)" class="w-6 h-6 rounded border-0 cursor-pointer bg-transparent">

            <span class="text-[10px] font-black text-slate-400 uppercase ml-2">Borde:</span>
            <input type="color" value="${el.stroke || '#d97706'}" onchange="updateShapeProp('stroke', this.value)" class="w-6 h-6 rounded border-0 cursor-pointer bg-transparent">

            <span class="text-[10px] font-black text-slate-400 uppercase ml-2">Grosor:</span>
            <select onchange="updateShapeProp('strokeWidth', parseInt(this.value))" class="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                <option value="0" ${el.strokeWidth === 0 ? 'selected' : ''}>0px</option>
                <option value="1" ${el.strokeWidth === 1 ? 'selected' : ''}>1px</option>
                <option value="2" ${el.strokeWidth === 2 ? 'selected' : ''}>2px</option>
                <option value="4" ${el.strokeWidth === 4 ? 'selected' : ''}>4px</option>
                <option value="6" ${el.strokeWidth === 6 ? 'selected' : ''}>6px</option>
            </select>

            <span class="text-[10px] font-black text-slate-400 uppercase ml-2">Radio:</span>
            <select onchange="updateShapeProp('borderRadius', parseInt(this.value))" class="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                <option value="0" ${el.borderRadius === 0 ? 'selected' : ''}>Recto (0)</option>
                <option value="8" ${el.borderRadius === 8 ? 'selected' : ''}>Suave (8px)</option>
                <option value="16" ${el.borderRadius === 16 ? 'selected' : ''}>Curvo (16px)</option>
                <option value="32" ${el.borderRadius === 32 ? 'selected' : ''}>Píldora (32px)</option>
            </select>

            <div class="flex items-center gap-1 ml-2" title="Opacidad">
                <i class="fas fa-adjust text-[10px] text-slate-400"></i>
                <input type="range" min="0.1" max="1" step="0.05" value="${el.opacity !== undefined ? el.opacity : 1}" oninput="updateElementOpacity(this.value)" class="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-amber-500">
            </div>

            ${universalButtonsHtml}
        `;
    } else if (el.type === 'connector') {
        // 3.3. CONECTORES INTELIGENTES
        bar.innerHTML = `
            <span class="text-[10px] font-black text-slate-400 uppercase">Tipo:</span>
            <select onchange="updateElementProp('connectorType', this.value)" class="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                <option value="straight" ${el.connectorType === 'straight' ? 'selected' : ''}>Recta</option>
                <option value="elbow" ${el.connectorType === 'elbow' ? 'selected' : ''}>Ortogonal (Ángulo Recto)</option>
                <option value="bezier" ${el.connectorType === 'bezier' ? 'selected' : ''}>Curva Bézier</option>
            </select>

            <span class="text-[10px] font-black text-slate-400 uppercase ml-2">Color:</span>
            <input type="color" value="${el.stroke || '#0284c7'}" onchange="updateElementProp('stroke', this.value)" class="w-6 h-6 rounded border-0 cursor-pointer bg-transparent">

            <span class="text-[10px] font-black text-slate-400 uppercase ml-2">Grosor:</span>
            <select onchange="updateElementProp('strokeWidth', parseFloat(this.value))" class="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                <option value="1.5" ${el.strokeWidth === 1.5 ? 'selected' : ''}>1.5px</option>
                <option value="2.5" ${!el.strokeWidth || el.strokeWidth === 2.5 ? 'selected' : ''}>2.5px</option>
                <option value="4" ${el.strokeWidth === 4 ? 'selected' : ''}>4.0px</option>
            </select>

            ${universalButtonsHtml}
        `;
    } else if (el.type === 'auditBadge') {
        // 3.4. SELLOS VECTORIALES DE AUDITORÍA
        bar.innerHTML = `
            <span class="text-[10px] font-black text-slate-400 uppercase">Sello:</span>
            <input type="text" value="${el.title || 'AUDITADO'}" onchange="updateElementProp('title', this.value)" class="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none w-36">

            <span class="text-[10px] font-black text-slate-400 uppercase ml-2">Color:</span>
            <input type="color" value="${el.color || '#059669'}" onchange="updateElementProp('color', this.value)" class="w-6 h-6 rounded border-0 cursor-pointer bg-transparent">

            <span class="text-[10px] font-black text-slate-400 uppercase ml-2">Inclinación:</span>
            <input type="range" min="-15" max="15" value="${el.tilt || -3}" oninput="updateElementProp('tilt', parseInt(this.value))" class="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-amber-500">

            ${universalButtonsHtml}
        `;
    } else if (el.type === 'chart') {
        // 3.5. GRÁFICOS SVG AVANZADOS
        bar.innerHTML = `
            <button onclick="openChartModal()" class="px-3 py-1 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-amber-600 transition-all">
                <i class="fas fa-edit"></i> Datos y Categorías
            </button>

            <span class="text-[10px] font-black text-slate-400 uppercase ml-2">Tipo:</span>
            <select onchange="updateElementProp('chartType', this.value)" class="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                <option value="bar" ${el.chartType === 'bar' ? 'selected' : ''}>Barras</option>
                <option value="waterfall" ${el.chartType === 'waterfall' ? 'selected' : ''}>Cascada (Financiero)</option>
                <option value="doughnut" ${el.chartType === 'doughnut' ? 'selected' : ''}>Dona + Total Central</option>
                <option value="combo" ${el.chartType === 'combo' ? 'selected' : ''}>Combo (Barras + Línea)</option>
                <option value="line" ${el.chartType === 'line' ? 'selected' : ''}>Línea</option>
                <option value="pie" ${el.chartType === 'pie' ? 'selected' : ''}>Circular / Pastel</option>
            </select>

            <span class="text-[10px] font-black text-slate-400 uppercase ml-2">Color Base:</span>
            <input type="color" value="${el.color || '#f59e0b'}" onchange="updateElementProp('color', this.value)" class="w-6 h-6 rounded border-0 cursor-pointer bg-transparent">

            ${universalButtonsHtml}
        `;
    } else if (el.type === 'table') {
        // 3.6. TABLAS FINANCIERAS
        bar.innerHTML = `
            <span class="text-[10px] font-black text-slate-400 uppercase">Tema:</span>
            <select onchange="updateElementProp('theme', this.value)" class="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                <option value="amber" ${el.theme === 'amber' ? 'selected' : ''}>Ámbar</option>
                <option value="slate" ${el.theme === 'slate' ? 'selected' : ''}>Pizarra / Gris</option>
                <option value="emerald" ${el.theme === 'emerald' ? 'selected' : ''}>Esmeralda</option>
                <option value="indigo" ${el.theme === 'indigo' ? 'selected' : ''}>Índigo</option>
            </select>

            <button onclick="addTableRow()" class="tool-icon-btn !w-7 !h-7 text-xs font-bold" title="Añadir Fila"><i class="fas fa-plus mr-1 text-[10px]"></i>Fila</button>
            <button onclick="addTableColumn()" class="tool-icon-btn !w-7 !h-7 text-xs font-bold" title="Añadir Columna"><i class="fas fa-plus mr-1 text-[10px]"></i>Col</button>
            <button onclick="toggleTableTotals()" class="tool-icon-btn !w-7 !h-7 ${el.showTotals ? 'active !text-amber-500' : ''}" title="Doble raya de totales contables"><i class="fas fa-equals text-xs"></i></button>

            ${universalButtonsHtml}
        `;
    } else {
        // 3.7. ELEMENTOS GENERALES (KPI, IMAGEN, ICONO, STICKY)
        bar.innerHTML = `
            <div class="flex items-center gap-1" title="Opacidad">
                <i class="fas fa-adjust text-[10px] text-slate-400"></i>
                <input type="range" min="0.1" max="1" step="0.05" value="${el.opacity !== undefined ? el.opacity : 1}" oninput="updateElementOpacity(this.value)" class="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-amber-500">
            </div>

            ${universalButtonsHtml}
        `;
    }
}

// =========================================================================
// 8. MODIFICACIÓN DE PROPIEDADES DE ELEMENTOS
// =========================================================================
function updateSelectedTextProp(prop, value) {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length === 0) return;

    selectedElementIds.forEach(id => {
        const el = currentSlide.elements.find(item => item.id === id);
        if (el) el[prop] = value;
    });

    renderActiveSlide();
    updatePropertyBar();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function updateElementProp(prop, value) {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length === 0) return;

    selectedElementIds.forEach(id => {
        const el = currentSlide.elements.find(item => item.id === id);
        if (el) el[prop] = value;
    });

    renderActiveSlide();
    updatePropertyBar();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function updateElementOpacity(val) {
    const opacity = parseFloat(val);
    updateElementProp('opacity', opacity);
}

function changeFontSize(delta) {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length === 0) return;

    selectedElementIds.forEach(id => {
        const el = currentSlide.elements.find(item => item.id === id);
        if (el) el.fontSize = Math.max(10, Math.min(96, (el.fontSize || 16) + delta));
    });

    renderActiveSlide();
    updatePropertyBar();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function toggleTextWeight() {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length === 0) return;

    selectedElementIds.forEach(id => {
        const el = currentSlide.elements.find(item => item.id === id);
        if (el) {
            el.fontWeight = (el.fontWeight === 'bold' || el.fontWeight === '800' || el.fontWeight === '900') ? 'normal' : '800';
        }
    });

    renderActiveSlide();
    updatePropertyBar();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function toggleTextItalic() {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length === 0) return;

    selectedElementIds.forEach(id => {
        const el = currentSlide.elements.find(item => item.id === id);
        if (el) {
            el.fontStyle = el.fontStyle === 'italic' ? 'normal' : 'italic';
        }
    });

    renderActiveSlide();
    updatePropertyBar();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function toggleTextUnderline() {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length === 0) return;

    selectedElementIds.forEach(id => {
        const el = currentSlide.elements.find(item => item.id === id);
        if (el) {
            el.textDecoration = el.textDecoration?.includes('underline') ? 'none' : 'underline';
        }
    });

    renderActiveSlide();
    updatePropertyBar();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function toggleTextStrikethrough() {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length === 0) return;

    selectedElementIds.forEach(id => {
        const el = currentSlide.elements.find(item => item.id === id);
        if (el) {
            el.textDecoration = el.textDecoration?.includes('line-through') ? 'none' : 'line-through';
        }
    });

    renderActiveSlide();
    updatePropertyBar();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function toggleTextTransform() {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length === 0) return;

    selectedElementIds.forEach(id => {
        const el = currentSlide.elements.find(item => item.id === id);
        if (el) {
            el.textTransform = el.textTransform === 'uppercase' ? 'none' : 'uppercase';
        }
    });

    renderActiveSlide();
    updatePropertyBar();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function setTextAlign(align) {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length === 0) return;

    selectedElementIds.forEach(id => {
        const el = currentSlide.elements.find(item => item.id === id);
        if (el) el.textAlign = align;
    });

    renderActiveSlide();
    updatePropertyBar();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function updateTextLineHeight(val) {
    updateSelectedTextProp('lineHeight', parseFloat(val));
}

function updateShapeProp(prop, value) {
    updateElementProp(prop, value);
}

function bringElementToFront() {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length === 0) return;

    selectedElementIds.forEach(id => {
        const idx = currentSlide.elements.findIndex(item => item.id === id);
        if (idx !== -1 && idx < currentSlide.elements.length - 1) {
            const el = currentSlide.elements.splice(idx, 1)[0];
            currentSlide.elements.push(el);
        }
    });

    renderActiveSlide();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function sendElementToBack() {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length === 0) return;

    // Invertir para preservar orden relativo al enviar al fondo
    [...selectedElementIds].reverse().forEach(id => {
        const idx = currentSlide.elements.findIndex(item => item.id === id);
        if (idx > 0) {
            const el = currentSlide.elements.splice(idx, 1)[0];
            currentSlide.elements.unshift(el);
        }
    });

    renderActiveSlide();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function duplicateSelectedElements() {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length === 0) return;

    const newIds = [];
    selectedElementIds.forEach(id => {
        const el = currentSlide.elements.find(item => item.id === id);
        if (!el) return;

        const copy = JSON.parse(JSON.stringify(el));
        copy.id = 'el_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        copy.x += 25;
        copy.y += 25;
        // Si tiene animaciones, no duplicarlas automáticamente a menos que se desee
        currentSlide.elements.push(copy);
        newIds.push(copy.id);
    });

    selectedElementIds = newIds;

    renderActiveSlide();
    updatePropertyBar();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
    showToastNotification(`${newIds.length} elemento(s) duplicado(s)`);
}

function duplicateSelectedElement() {
    duplicateSelectedElements();
}

function deleteSelectedElements() {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length === 0) return;

    const count = selectedElementIds.length;
    currentSlide.elements = currentSlide.elements.filter(item => !selectedElementIds.includes(item.id));

    // Limpiar animaciones asociadas a los elementos eliminados
    if (currentSlide.animations) {
        currentSlide.animations = currentSlide.animations.filter(anim => !selectedElementIds.includes(anim.elementId));
    }

    selectedElementIds = [];

    renderActiveSlide();
    updatePropertyBar();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
    showToastNotification(`${count} elemento(s) eliminado(s)`);
}

function deleteSelectedElement() {
    deleteSelectedElements();
}

// =========================================================================
// BROCHA DE FORMATO (FORMAT PAINTER) & CUADRÍCULA
// =========================================================================
function toggleFormatPainter() {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length !== 1) {
        showToastNotification("Selecciona un solo elemento para copiar su formato");
        return;
    }

    const sourceEl = currentSlide.elements.find(it => it.id === selectedElementIds[0]);
    if (!sourceEl) return;

    formatPainterStyle = {
        fontFamily: sourceEl.fontFamily,
        fontSize: sourceEl.fontSize,
        fontWeight: sourceEl.fontWeight,
        fontStyle: sourceEl.fontStyle,
        color: sourceEl.color,
        fill: sourceEl.fill,
        stroke: sourceEl.stroke,
        strokeWidth: sourceEl.strokeWidth,
        borderRadius: sourceEl.borderRadius,
        opacity: sourceEl.opacity,
        highlightBg: sourceEl.highlightBg,
        textAlign: sourceEl.textAlign
    };

    const btn = document.getElementById('btn-format-painter');
    if (btn) btn.classList.add('active', 'text-amber-500');

    showToastNotification("🎨 Formato copiado. Haz clic en el elemento destino.");
}

function applyFormatPainterToElement(targetId) {
    if (!formatPainterStyle) return;

    const currentSlide = getActiveSlide();
    const target = currentSlide?.elements.find(it => it.id === targetId);
    if (!target) return;

    Object.keys(formatPainterStyle).forEach(key => {
        if (formatPainterStyle[key] !== undefined) {
            target[key] = formatPainterStyle[key];
        }
    });

    formatPainterStyle = null;
    const btn = document.getElementById('btn-format-painter');
    if (btn) btn.classList.remove('active', 'text-amber-500');

    renderActiveSlide();
    updatePropertyBar();
    pushHistoryState();
    triggerAutoSave();
    showToastNotification("✨ Formato aplicado con éxito");
}

function toggleGridOverlay() {
    const grid = document.getElementById('grid-overlay');
    const btn = document.getElementById('btn-toggle-grid');
    if (!grid) return;

    const isHidden = grid.classList.contains('hidden');
    if (isHidden) {
        grid.classList.remove('hidden');
        if (btn) btn.classList.add('bg-amber-100', 'text-amber-700', 'dark:bg-amber-900/30', 'dark:text-amber-400');
        showToastNotification("Cuadrícula visible");
    } else {
        grid.classList.add('hidden');
        if (btn) btn.classList.remove('bg-amber-100', 'text-amber-700', 'dark:bg-amber-900/30', 'dark:text-amber-400');
    }
}

// =========================================================================
// OPERACIONES EN TABLAS (FILAS, COLUMNAS, TOTALES)
// =========================================================================
function addTableRow() {
    const currentSlide = getActiveSlide();
    const tableEl = currentSlide?.elements.find(it => it.id === selectedElementId && it.type === 'table');
    if (!tableEl) return;

    const colCount = (tableEl.headers || []).length;
    const newRow = Array(colCount).fill('-');
    newRow[0] = `Fila ${(tableEl.rows || []).length + 1}`;
    tableEl.rows.push(newRow);

    renderActiveSlide();
    pushHistoryState();
    triggerAutoSave();
    showToastNotification("Fila añadida a la tabla");
}

function addTableColumn() {
    const currentSlide = getActiveSlide();
    const tableEl = currentSlide?.elements.find(it => it.id === selectedElementId && it.type === 'table');
    if (!tableEl) return;

    const newColIndex = (tableEl.headers || []).length + 1;
    tableEl.headers.push(`Columna ${newColIndex}`);
    tableEl.rows.forEach(r => r.push('$ 0.00'));

    renderActiveSlide();
    pushHistoryState();
    triggerAutoSave();
    showToastNotification("Columna añadida a la tabla");
}

function toggleTableTotals() {
    const currentSlide = getActiveSlide();
    const tableEl = currentSlide?.elements.find(it => it.id === selectedElementId && it.type === 'table');
    if (!tableEl) return;

    tableEl.showTotals = !tableEl.showTotals;
    renderActiveSlide();
    updatePropertyBar();
    pushHistoryState();
    triggerAutoSave();
    showToastNotification(tableEl.showTotals ? "Doble raya de totales activada" : "Totales desactivados");
}

// =========================================================================
// 9. OPERACIONES DE DIAPOSITIVA (AÑADIR, DUPLICAR, ELIMINAR, FONDO)
// =========================================================================
function selectSlide(index) {
    if (index < 0 || index >= (proyecto_actual.slides || []).length) return;
    activeSlideIndex = index;
    selectedElementId = null;

    renderThumbnails();
    renderActiveSlide();
    updatePropertyBar();
}

function goToPrevSlide() {
    if (activeSlideIndex > 0) {
        selectSlide(activeSlideIndex - 1);
    }
}

function goToNextSlide() {
    if (activeSlideIndex < (proyecto_actual.slides || []).length - 1) {
        selectSlide(activeSlideIndex + 1);
    }
}

function openLayoutPickerModal() {
    const modal = document.getElementById('layout-picker-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeLayoutPickerModal() {
    const modal = document.getElementById('layout-picker-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function insertSlideWithLayout(layoutType) {
    closeLayoutPickerModal();
    const newSlide = createDefaultSlide(layoutType, `Diapositiva ${(proyecto_actual.slides || []).length + 1}`);
    proyecto_actual.slides.splice(activeSlideIndex + 1, 0, newSlide);
    activeSlideIndex++;
    selectedElementId = null;

    renderThumbnails();
    renderActiveSlide();
    updatePropertyBar();
    pushHistoryState();
    triggerAutoSave();
}

function duplicateActiveSlide() {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    const copy = JSON.parse(JSON.stringify(currentSlide));
    copy.id = 'slide_' + Date.now();
    copy.title = (copy.title || 'Diapositiva') + ' (Copia)';
    // Generar nuevos IDs para los elementos
    copy.elements.forEach(el => {
        el.id = 'el_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    });

    proyecto_actual.slides.splice(activeSlideIndex + 1, 0, copy);
    activeSlideIndex++;
    selectedElementId = null;

    renderThumbnails();
    renderActiveSlide();
    updatePropertyBar();
    pushHistoryState();
    triggerAutoSave();
}

function deleteSlide(index) {
    if ((proyecto_actual.slides || []).length <= 1) {
        alert("La presentación debe contener al menos una diapositiva.");
        return;
    }

    if (confirm("¿Deseas eliminar esta diapositiva?")) {
        proyecto_actual.slides.splice(index, 1);
        if (activeSlideIndex >= proyecto_actual.slides.length) {
            activeSlideIndex = proyecto_actual.slides.length - 1;
        }
        selectedElementId = null;

        renderThumbnails();
        renderActiveSlide();
        updatePropertyBar();
        pushHistoryState();
        triggerAutoSave();
    }
}

function setSlideBackground(val) {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    currentSlide.background = {
        type: val.includes('gradient') ? 'gradient' : 'solid',
        value: val
    };

    renderActiveSlide();
    renderThumbnails();
    pushHistoryState();
    triggerAutoSave();
}

function setSlideTransition(transitionType) {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;
    if (typeof currentSlide.transition !== 'object') {
        currentSlide.transition = { type: transitionType, direction: 'left', duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
    } else {
        currentSlide.transition.type = transitionType;
    }
    pushHistoryState();
    triggerAutoSave();
    updatePropertyBar();
}

function setSlideTransitionType(val) {
    setSlideTransition(val);
}

function setSlideTransitionDir(val) {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;
    if (typeof currentSlide.transition !== 'object') {
        currentSlide.transition = { type: 'slide', direction: val, duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
    } else {
        currentSlide.transition.direction = val;
    }
    pushHistoryState();
    triggerAutoSave();
}

function setSlideTransitionDuration(val) {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;
    if (typeof currentSlide.transition !== 'object') {
        currentSlide.transition = { type: 'fade', direction: 'left', duration: val, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
    } else {
        currentSlide.transition.duration = val;
    }
    pushHistoryState();
    triggerAutoSave();
}

function saveCurrentSlideNotes(notesText) {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;
    currentSlide.notes = notesText;
    triggerAutoSave();
    renderThumbnails();
}

function toggleSpeakerNotesDrawer() {
    const drawer = document.getElementById('speaker-notes-drawer');
    const btn = document.getElementById('btn-toggle-notes');
    if (!drawer) return;

    const isOpen = !drawer.classList.contains('hidden');
    if (isOpen) {
        drawer.classList.add('hidden');
        if (btn) btn.classList.remove('bg-amber-100', 'text-amber-700');
    } else {
        drawer.classList.remove('hidden');
        if (btn) btn.classList.add('bg-amber-100', 'text-amber-700');
        const notesInput = document.getElementById('slide-notes-textarea');
        if (notesInput) {
            notesInput.value = getActiveSlide()?.notes || '';
            notesInput.focus();
        }
    }
}

// =========================================================================
// 10. INSERCIÓN DE NUEVOS ELEMENTOS AL ESCENARIO (TEXTO, FORMAS, CONECTORES, ETC.)
// =========================================================================
function addSlideElement(type) {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    let newEl = null;

    if (type === 'text') {
        newEl = {
            id: 'el_' + Date.now(),
            type: 'text',
            x: 100,
            y: 100,
            width: 340,
            height: 70,
            content: 'Escribe tu título o texto aquí...',
            fontSize: 24,
            fontWeight: 'bold',
            fontFamily: 'Plus Jakarta Sans',
            color: '#0f172a',
            textAlign: 'left',
            lineHeight: 1.3
        };
    }

    if (newEl) {
        currentSlide.elements.push(newEl);
        selectedElementIds = [newEl.id];
        renderActiveSlide();
        updatePropertyBar();
        renderLayersList();
        pushHistoryState();
        triggerAutoSave();
        renderThumbnails();
    }
}

function addSlideShape(shapeType) {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    const newEl = {
        id: 'el_' + Date.now(),
        type: 'shape',
        shapeType: shapeType,
        x: 160,
        y: 150,
        width: shapeType === 'line' ? 320 : (shapeType === 'circle' ? 140 : 200),
        height: shapeType === 'line' ? 4 : (shapeType === 'circle' ? 140 : 130),
        fill: '#f59e0b',
        stroke: '#d97706',
        strokeWidth: 2,
        borderRadius: shapeType === 'rounded' ? 16 : 4
    };

    currentSlide.elements.push(newEl);
    selectedElementIds = [newEl.id];
    renderActiveSlide();
    updatePropertyBar();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function addSlideConnector(connectorType = 'elbow') {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    let startElId = null;
    let endElId = null;
    let startX = 220, startY = 220, endX = 460, endY = 220;

    if (selectedElementIds.length >= 2) {
        startElId = selectedElementIds[0];
        endElId = selectedElementIds[1];
        const elA = currentSlide.elements.find(it => it.id === startElId);
        const elB = currentSlide.elements.find(it => it.id === endElId);
        if (elA && elB) {
            startX = Math.round(elA.x + elA.width / 2);
            startY = Math.round(elA.y + elA.height / 2);
            endX = Math.round(elB.x + elB.width / 2);
            endY = Math.round(elB.y + elB.height / 2);
        }
    }

    const minX = Math.min(startX, endX) - 20;
    const minY = Math.min(startY, endY) - 20;
    const w = Math.max(Math.abs(endX - startX) + 40, 60);
    const h = Math.max(Math.abs(endY - startY) + 40, 60);

    const newEl = {
        id: 'el_' + Date.now(),
        type: 'connector',
        connectorType: connectorType,
        x: Math.round(minX),
        y: Math.round(minY),
        width: Math.round(w),
        height: Math.round(h),
        startX: startX,
        startY: startY,
        endX: endX,
        endY: endY,
        startElementId: startElId,
        endElementId: endElId,
        stroke: '#0284c7',
        strokeWidth: 2.5
    };

    currentSlide.elements.push(newEl);
    selectedElementIds = [newEl.id];
    renderActiveSlide();
    updatePropertyBar();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
    showToastNotification("Conector inteligente añadido");
}

function addSlideAuditBadge(badgeType = 'auditado') {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    let title = 'AUDITADO';
    let color = '#059669';
    let bg = '#ecfdf5';

    if (badgeType === 'fiscal') {
        title = 'DICTAMEN FISCAL';
        color = '#d97706';
        bg = '#fffbeb';
    } else if (badgeType === 'niif') {
        title = 'NIIF CONFORME';
        color = '#0284c7';
        bg = '#f0f9ff';
    } else if (badgeType === 'riesgo') {
        title = 'OBSERVACIÓN';
        color = '#e11d48';
        bg = '#fff1f2';
    }

    const newEl = {
        id: 'el_' + Date.now(),
        type: 'auditBadge',
        badgeType: badgeType,
        x: 350,
        y: 200,
        width: 175,
        height: 75,
        title: title,
        color: color,
        bg: bg,
        tilt: -3
    };

    currentSlide.elements.push(newEl);
    selectedElementIds = [newEl.id];
    renderActiveSlide();
    updatePropertyBar();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
    showToastNotification("Sello de auditoría añadido");
}

function addSlideKPI() {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    const newEl = {
        id: 'el_' + Date.now(),
        type: 'kpi',
        x: 120,
        y: 120,
        width: 250,
        height: 160,
        title: 'Métrica Clave',
        value: '$ 25,400.00',
        change: '+15.2% vs mes anterior',
        trend: 'up',
        accent: '#059669',
        bg: '#ecfdf5',
        border: '#a7f3d0'
    };

    currentSlide.elements.push(newEl);
    selectedElementIds = [newEl.id];
    renderActiveSlide();
    updatePropertyBar();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function addSlideTable() {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    const newEl = {
        id: 'el_' + Date.now(),
        type: 'table',
        x: 100,
        y: 100,
        width: 560,
        height: 250,
        headers: ['Cuenta Contable', 'Debe ($)', 'Haber ($)'],
        rows: [
            ['1101 Efectivo y Equivalentes', '$ 15,000.00', '-'],
            ['1102 Cuentas por Cobrar', '$ 8,500.00', '-'],
            ['2101 Cuentas por Pagar', '-', '$ 6,200.00'],
            ['3101 Capital Social', '-', '$ 17,300.00']
        ],
        theme: 'amber',
        showTotals: true
    };

    currentSlide.elements.push(newEl);
    selectedElementIds = [newEl.id];
    renderActiveSlide();
    updatePropertyBar();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function addSlideSticky() {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    const newEl = {
        id: 'el_' + Date.now(),
        type: 'sticky',
        x: 120,
        y: 120,
        width: 180,
        height: 180,
        text: 'Revisar cálculo del IVA Crédito Fiscal antes de la presentación final.',
        color: '#fef08a',
        tilt: -3
    };

    currentSlide.elements.push(newEl);
    selectedElementIds = [newEl.id];
    renderActiveSlide();
    updatePropertyBar();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

// =========================================================================
// IMPORTADOR DE DATOS CONTABLES (#import-accounting-modal)
// =========================================================================
function openImportAccountingModal() {
    const modal = document.getElementById('import-accounting-modal');
    if (!modal) return;

    let stored = [];
    try {
        stored = JSON.parse(localStorage.getItem('educonta_projects') || localStorage.getItem('educonta_proyectos') || '[]');
    } catch (_) {}

    const select = document.getElementById('import-accounting-project-select');
    if (select) {
        select.innerHTML = '<option value="">-- Selecciona un proyecto contable --</option>';
        if (stored.length === 0) {
            select.innerHTML += '<option value="demo_empresa" selected>Empresa Modelo S.A. de C.V. (Demo)</option>';
        } else {
            stored.forEach(p => {
                select.innerHTML += `<option value="${p.id}">${p.name || p.nombre || 'Proyecto Sin Nombre'}</option>`;
            });
            select.innerHTML += '<option value="demo_empresa">Empresa Modelo S.A. de C.V. (Demo)</option>';
        }
    }

    updateAccountingPreview();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeImportAccountingModal() {
    const modal = document.getElementById('import-accounting-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function updateAccountingPreview() {
    const previewWrap = document.getElementById('accounting-import-preview');
    const typeSelect = document.getElementById('import-accounting-type-select');
    if (!previewWrap) return;

    const impType = typeSelect?.value || 'balance';

    if (impType === 'balance') {
        previewWrap.innerHTML = `
            <div class="text-[11px] font-bold text-slate-700 dark:text-slate-300 space-y-1">
                <div class="font-black text-amber-600 dark:text-amber-400">Tabla de Balances y Cuentas de Mayor:</div>
                <div>• 1101 Efectivo: $ 15,400.00</div>
                <div>• 1102 Cuentas por Cobrar: $ 8,250.00</div>
                <div>• 2101 Proveedores: $ 6,100.00</div>
                <div>• Total Activo = Total Pasivo + Patrimonio: $ 23,650.00</div>
            </div>
        `;
    } else if (impType === 'kpis') {
        previewWrap.innerHTML = `
            <div class="text-[11px] font-bold text-slate-700 dark:text-slate-300 space-y-1">
                <div class="font-black text-emerald-600 dark:text-emerald-400">Tarjetas KPI Financieras (Terna):</div>
                <div>1. Ingresos Operativos: $ 48,500.00 (+12.4%)</div>
                <div>2. Costos y Gastos: $ 31,200.00 (-4.1%)</div>
                <div>3. Utilidad Neta del Ejercicio: $ 17,300.00 (Margen: 35.6%)</div>
            </div>
        `;
    } else if (impType === 'waterfall') {
        previewWrap.innerHTML = `
            <div class="text-[11px] font-bold text-slate-700 dark:text-slate-300 space-y-1">
                <div class="font-black text-sky-600 dark:text-sky-400">Gráfico en Cascada (Waterfall) del Estado de Resultados:</div>
                <div>Ingresos Brutos ($48.5k) ➔ (-) Costo de Ventas ($18.2k) ➔ (-) Gastos Operativos ($13.0k) ➔ Utilidad Neta ($17.3k).</div>
            </div>
        `;
    }
}

function executeAccountingImport() {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    const typeSelect = document.getElementById('import-accounting-type-select');
    const impType = typeSelect?.value || 'balance';

    if (impType === 'balance') {
        const tableEl = {
            id: 'el_' + Date.now(),
            type: 'table',
            x: 80,
            y: 80,
            width: 800,
            height: 280,
            theme: 'amber',
            showTotals: true,
            headers: ['Código y Cuenta', 'Saldo Inicial', 'Debe ($)', 'Haber ($)', 'Saldo Final'],
            rows: [
                ['1101 Efectivo y Equivalentes', '$ 10,000.00', '$ 8,500.00', '$ 3,100.00', '$ 15,400.00'],
                ['1102 Cuentas por Cobrar', '$ 5,200.00', '$ 4,800.00', '$ 1,750.00', '$ 8,250.00'],
                ['1103 Inventarios (NIC 2)', '$ 12,000.00', '$ 6,000.00', '$ 4,500.00', '$ 13,500.00'],
                ['2101 Cuentas y Documentos por Pagar', '$ 4,500.00', '$ 2,200.00', '$ 3,800.00', '$ 6,100.00'],
                ['3101 Capital Social', '$ 22,700.00', '$ 0.00', '$ 0.00', '$ 22,700.00'],
                ['TOTALES DE CONTROL', '$ 27,200.00', '$ 21,500.00', '$ 13,150.00', '$ 35,550.00']
            ]
        };
        currentSlide.elements.push(tableEl);
        selectedElementIds = [tableEl.id];
    } else if (impType === 'kpis') {
        const kpi1 = {
            id: 'el_' + Date.now() + '_1',
            type: 'kpi',
            x: 80,
            y: 160,
            width: 250,
            height: 160,
            title: 'Ingresos Operativos',
            value: '$ 48,500.00',
            change: '+12.4% vs mes anterior',
            trend: 'up',
            accent: '#059669',
            bg: '#ecfdf5',
            border: '#a7f3d0'
        };
        const kpi2 = {
            id: 'el_' + Date.now() + '_2',
            type: 'kpi',
            x: 355,
            y: 160,
            width: 250,
            height: 160,
            title: 'Costos y Gastos',
            value: '$ 31,200.00',
            change: '-4.1% eficiencia en compras',
            trend: 'down',
            accent: '#d97706',
            bg: '#fffbeb',
            border: '#fde68a'
        };
        const kpi3 = {
            id: 'el_' + Date.now() + '_3',
            type: 'kpi',
            x: 630,
            y: 160,
            width: 250,
            height: 160,
            title: 'Utilidad Neta',
            value: '$ 17,300.00',
            change: 'Margen neto: 35.6%',
            trend: 'up',
            accent: '#0284c7',
            bg: '#f0f9ff',
            border: '#bae6fd'
        };
        currentSlide.elements.push(kpi1, kpi2, kpi3);
        selectedElementIds = [kpi1.id, kpi2.id, kpi3.id];
    } else if (impType === 'waterfall') {
        const chartEl = {
            id: 'el_' + Date.now(),
            type: 'chart',
            chartType: 'waterfall',
            title: 'Cascada de Resultados Financieros',
            x: 100,
            y: 90,
            width: 760,
            height: 360,
            data: [
                { label: 'Ingresos', value: 48500 },
                { label: 'Costo Venta', value: -18200 },
                { label: 'Gastos Adm', value: -8500 },
                { label: 'Gastos Venta', value: -4500 },
                { label: 'Utilidad Neta', value: 17300, isTotal: true }
            ]
        };
        currentSlide.elements.push(chartEl);
        selectedElementIds = [chartEl.id];
    }

    closeImportAccountingModal();
    renderActiveSlide();
    updatePropertyBar();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
    showToastNotification("Componente financiero importado con éxito");
}

// =========================================================================
// MODAL DE SELLOS VECTORIALES DE AUDITORÍA (#audit-badges-modal)
// =========================================================================
function openAuditBadgesModal() {
    const modal = document.getElementById('audit-badges-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeAuditBadgesModal() {
    const modal = document.getElementById('audit-badges-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function insertAuditBadge(type) {
    closeAuditBadgesModal();
    addSlideAuditBadge(type);
}

// =========================================================================
// 11. MODAL DE GRÁFICOS (EDITOR DE DATOS)
// =========================================================================
function openChartModal() {
    const modal = document.getElementById('chart-data-modal');
    if (!modal) return;

    const currentSlide = getActiveSlide();
    let chartEl = (currentSlide?.elements || []).find(item => item.id === selectedElementId && item.type === 'chart');

    const titleInput = document.getElementById('chart-input-title');
    const typeSelect = document.getElementById('chart-input-type');
    const rowsContainer = document.getElementById('chart-data-rows');

    if (titleInput) titleInput.value = chartEl?.title || 'Ventas Trimestrales';
    if (typeSelect) typeSelect.value = chartEl?.chartType || 'bar';

    if (rowsContainer) {
        rowsContainer.innerHTML = '';
        const data = chartEl?.data || [
            { label: 'Q1', value: 45000 },
            { label: 'Q2', value: 68000 },
            { label: 'Q3', value: 89000 },
            { label: 'Q4', value: 112000 }
        ];

        data.forEach(item => {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-2 chart-data-row';
            row.innerHTML = `
                <input type="text" value="${item.label}" class="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold chart-row-label">
                <input type="number" value="${item.value}" class="w-28 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold chart-row-value">
                <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-rose-500 p-1"><i class="fas fa-times"></i></button>
            `;
            rowsContainer.appendChild(row);
        });
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeChartModal() {
    const modal = document.getElementById('chart-data-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function addChartDataRow() {
    const rowsContainer = document.getElementById('chart-data-rows');
    if (!rowsContainer) return;
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 chart-data-row';
    row.innerHTML = `
        <input type="text" placeholder="Periodo / Categoría" class="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold chart-row-label">
        <input type="number" placeholder="Valor" class="w-28 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold chart-row-value">
        <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-rose-500 p-1"><i class="fas fa-times"></i></button>
    `;
    rowsContainer.appendChild(row);
}

function saveChartData() {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    let chartEl = currentSlide.elements.find(item => item.id === selectedElementId && item.type === 'chart');
    const isNew = !chartEl;

    if (isNew) {
        chartEl = {
            id: 'el_' + Date.now(),
            type: 'chart',
            x: 100,
            y: 100,
            width: 760,
            height: 360,
            color: '#f59e0b'
        };
        currentSlide.elements.push(chartEl);
        selectedElementIds = [chartEl.id];
    }

    const titleInput = document.getElementById('chart-input-title');
    const typeSelect = document.getElementById('chart-input-type');

    chartEl.title = titleInput ? titleInput.value : 'Gráfica';
    chartEl.chartType = typeSelect ? typeSelect.value : 'bar';

    const rows = document.querySelectorAll('.chart-data-row');
    const newData = [];
    rows.forEach(r => {
        const lbl = r.querySelector('.chart-row-label')?.value || 'Item';
        const val = parseFloat(r.querySelector('.chart-row-value')?.value) || 0;
        newData.push({ label: lbl, value: val });
    });

    chartEl.data = newData.length ? newData : [{ label: 'Q1', value: 100 }];

    closeChartModal();
    renderActiveSlide();
    updatePropertyBar();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

// =========================================================================
// 12. MODALES DE IMAGEN E ICONOS
// =========================================================================
function openImageModal() {
    const modal = document.getElementById('image-insert-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeImageModal() {
    const modal = document.getElementById('image-insert-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function insertImageToSlide() {
    const fileInput = document.getElementById('image-file-input');
    const urlInput = document.getElementById('image-url-input');

    if (fileInput && fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            createImageElement(e.target.result);
            closeImageModal();
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else if (urlInput && urlInput.value.trim()) {
        createImageElement(urlInput.value.trim());
        closeImageModal();
    } else {
        alert("Por favor selecciona un archivo o escribe una URL válida.");
    }
}

function createImageElement(src) {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    const newEl = {
        id: 'el_' + Date.now(),
        type: 'image',
        src: src,
        x: 160,
        y: 120,
        width: 320,
        height: 240,
        borderRadius: 12
    };

    currentSlide.elements.push(newEl);
    selectedElementIds = [newEl.id];
    renderActiveSlide();
    updatePropertyBar();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

function openIconModal() {
    const modal = document.getElementById('icon-picker-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeIconModal() {
    const modal = document.getElementById('icon-picker-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function insertIconToSlide(iconClass) {
    closeIconModal();
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    const newEl = {
        id: 'el_' + Date.now(),
        type: 'icon',
        iconClass: iconClass,
        x: 200,
        y: 150,
        width: 100,
        height: 100,
        color: '#f59e0b'
    };

    currentSlide.elements.push(newEl);
    selectedElementIds = [newEl.id];
    renderActiveSlide();
    updatePropertyBar();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
}

// =========================================================================
// 13. PLANTILLAS DE PRESENTACIÓN COMPLETAS
// =========================================================================
function openTemplatesModal() {
    const modal = document.getElementById('templates-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeTemplatesModal() {
    const modal = document.getElementById('templates-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function applyPresentationTemplate(key) {
    if (!confirm("Cargar una plantilla reemplazará las diapositivas actuales. ¿Deseas continuar?")) {
        return;
    }

    closeTemplatesModal();

    let newSlides = [];
    if (key === 'financiero') {
        newSlides = [
            createDefaultSlide('title', 'Estados Financieros y Desempeño Operativo'),
            createDefaultSlide('kpis', 'Indicadores Clave de Rentabilidad'),
            createDefaultSlide('table', 'Balance General y Estado de Resultados'),
            createDefaultSlide('chart', 'Ventas Trimestrales y Proyección')
        ];
    } else if (key === 'pitch') {
        newSlides = [
            createDefaultSlide('title', 'Pitch Deck de Innovación Contable'),
            createDefaultSlide('bullets', 'El Problema en el Sector Empresarial'),
            createDefaultSlide('two-columns', 'Nuestra Solución Integral'),
            createDefaultSlide('kpis', 'Métricas de Tracción y Crecimiento'),
            createDefaultSlide('chart', 'Proyecciones Financieras a 3 Años')
        ];
    } else if (key === 'auditoria') {
        newSlides = [
            createDefaultSlide('title', 'Informe y Dictamen de Auditoría Fiscal'),
            createDefaultSlide('bullets', 'Alcance y Marco Legal (MH & Código Tributario)'),
            createDefaultSlide('two-columns', 'Matriz de Riesgos y Hallazgos'),
            createDefaultSlide('bullets', 'Opinión del Auditor y Conclusiones')
        ];
    } else if (key === 'niif') {
        newSlides = [
            createDefaultSlide('title', 'Capacitación en NIIF para Pymes'),
            createDefaultSlide('bullets', 'Sección 13: Inventarios y NIC 2'),
            createDefaultSlide('table', 'Caso Práctico de Valuación de Costos'),
            createDefaultSlide('bullets', 'Resumen y Puntos Clave de Cumplimiento')
        ];
    }

    proyecto_actual.slides = newSlides;
    activeSlideIndex = 0;
    selectedElementIds = [];

    renderThumbnails();
    renderActiveSlide();
    updatePropertyBar();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    showToastNotification("Plantilla aplicada con éxito");
}

// =========================================================================
// 14. MODO PRESENTACIÓN (THEATER FULLSCREEN PRO, LIVE INK, CRONÓMETRO, SORTER)
// =========================================================================
let theaterDefenseInterval = null;

function startPresentationMode() {
    isTheaterActive = true;
    theaterIndex = activeSlideIndex;
    isLaserActive = false;
    isTheaterBlackout = false;
    theaterAnimStep = 0;
    theaterInkTool = 'none';
    theaterIsZoomed = false;

    const theater = document.getElementById('presentation-theater');
    if (theater) {
        theater.classList.add('is-active');
    }

    try {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        }
    } catch (_) {}

    renderTheaterSlide();
    setupTheaterInkCanvas();
    startTheaterTimer();

    window.addEventListener('mousemove', handleTheaterMouseMove);
    window.addEventListener('keydown', handleTheaterKeyDown);
}

function exitPresentationMode() {
    isTheaterActive = false;
    if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
        isAutoPlaying = false;
    }

    stopTheaterTimer();

    const theater = document.getElementById('presentation-theater');
    if (theater) {
        theater.classList.remove('is-active', 'laser-mode');
    }

    const dot = document.getElementById('laser-pointer-dot');
    if (dot) dot.style.display = 'none';

    try {
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen();
        }
    } catch (_) {}

    window.removeEventListener('mousemove', handleTheaterMouseMove);
    window.removeEventListener('keydown', handleTheaterKeyDown);

    selectSlide(theaterIndex);
}

function renderTheaterSlide() {
    const container = document.getElementById('theater-slide-content');
    const frame = document.getElementById('theater-slide-frame');
    const badge = document.getElementById('theater-counter-badge');
    const notesContent = document.getElementById('theater-notes-content');
    if (!container || !frame) return;

    const slide = proyecto_actual.slides[theaterIndex];
    if (!slide) return;

    theaterAnimStep = 0;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const scale = Math.min(screenW / STAGE_WIDTH, screenH / STAGE_HEIGHT) * 0.95;

    frame.style.width = `${STAGE_WIDTH}px`;
    frame.style.height = `${STAGE_HEIGHT}px`;
    frame.style.transform = `scale(${scale})`;

    // Aplicar transición
    const transType = slide.transition?.type || slide.transition || 'fade';
    frame.className = 'slide-transition-container';
    void frame.offsetWidth;
    frame.classList.add(`transition-${transType}`);

    container.style.background = slide.background?.value || '#ffffff';
    container.innerHTML = '';

    (slide.elements || []).forEach(el => {
        if (el.hidden) return;
        const domEl = createDomElement(el);
        domEl.classList.remove('selected');

        // Si el elemento tiene animación de entrada con trigger 'onClick', ocultarlo inicialmente
        const hasClickEntrance = (slide.animations || []).some(a => a.elementId === el.id && a.category === 'entrance' && a.trigger === 'onClick');
        if (hasClickEntrance) {
            domEl.style.opacity = '0';
        }

        container.appendChild(domEl);
    });

    if (badge) {
        badge.textContent = `${theaterIndex + 1} / ${proyecto_actual.slides.length}`;
    }

    if (notesContent) {
        notesContent.innerText = slide.notes || 'Sin notas para esta diapositiva.';
    }

    // Limpiar trazos de tinta al cambiar de diapositiva
    clearTheaterInk();
}

function theaterNext() {
    const slide = proyecto_actual.slides[theaterIndex];
    const animations = slide?.animations || [];

    // Si hay animaciones pendientes en esta diapositiva, avanzar el paso de animación
    if (theaterAnimStep < animations.length) {
        const anim = animations[theaterAnimStep];
        theaterAnimStep++;

        const dom = document.querySelector(`#theater-slide-content #dom_${anim.elementId}`);
        if (dom) {
            dom.style.opacity = '1';
            AnimationEngine.executeAnimation(anim, dom);
        }

        // Ejecutar animaciones concurrentes con 'withPrevious'
        while (theaterAnimStep < animations.length && animations[theaterAnimStep].trigger === 'withPrevious') {
            const nextAnim = animations[theaterAnimStep];
            theaterAnimStep++;
            const nextDom = document.querySelector(`#theater-slide-content #dom_${nextAnim.elementId}`);
            if (nextDom) {
                nextDom.style.opacity = '1';
                AnimationEngine.executeAnimation(nextAnim, nextDom);
            }
        }
        return;
    }

    // Avanzar a la siguiente diapositiva
    if (theaterIndex < (proyecto_actual.slides.length - 1)) {
        theaterIndex++;
        renderTheaterSlide();
    } else if (isAutoPlaying) {
        theaterIndex = 0;
        renderTheaterSlide();
    }
}

function theaterPrev() {
    if (theaterIndex > 0) {
        theaterIndex--;
        renderTheaterSlide();
    }
}

// CRONÓMETRO DE DEFENSA
function startTheaterTimer() {
    theaterTimerSeconds = 0;
    updateTheaterTimerDisplay();
    if (theaterDefenseInterval) clearInterval(theaterDefenseInterval);
    theaterDefenseInterval = setInterval(() => {
        theaterTimerSeconds++;
        updateTheaterTimerDisplay();
    }, 1000);
}

function stopTheaterTimer() {
    if (theaterDefenseInterval) {
        clearInterval(theaterDefenseInterval);
        theaterDefenseInterval = null;
    }
}

function resetTheaterTimer() {
    theaterTimerSeconds = 0;
    updateTheaterTimerDisplay();
    showToastNotification("Cronómetro de defensa reiniciado");
}

function updateTheaterTimerDisplay() {
    const timerBadge = document.getElementById('theater-defense-timer');
    if (!timerBadge) return;
    const mins = Math.floor(theaterTimerSeconds / 60).toString().padStart(2, '0');
    const secs = (theaterTimerSeconds % 60).toString().padStart(2, '0');
    timerBadge.textContent = `${mins}:${secs}`;
}

// CLASIFICADOR DE DIAPOSITIVAS (SLIDE SORTER GRID)
function toggleTheaterSlideSorter() {
    const sorter = document.getElementById('theater-slide-sorter');
    const grid = document.getElementById('theater-sorter-grid');
    if (!sorter || !grid) return;

    const isOpen = !sorter.classList.contains('hidden');
    if (isOpen) {
        sorter.classList.add('hidden');
    } else {
        grid.innerHTML = '';
        proyecto_actual.slides.forEach((sl, idx) => {
            const card = document.createElement('div');
            card.className = `p-3 rounded-2xl border-2 cursor-pointer transition-all ${idx === theaterIndex ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 bg-slate-900/80 hover:border-slate-600'}`;
            card.innerHTML = `
                <div class="aspect-video w-full rounded-xl bg-slate-950 flex flex-col items-center justify-center p-2 mb-2 relative overflow-hidden">
                    <span class="text-xs font-black text-slate-300 text-center truncate max-w-full">${sl.title || `Diapo ${idx + 1}`}</span>
                    <span class="absolute top-1 left-2 text-[9px] font-black text-amber-500">#${idx + 1}</span>
                </div>
                <div class="text-[10px] font-bold text-slate-400 text-center">${(sl.elements || []).length} elementos</div>
            `;
            card.onclick = () => {
                theaterIndex = idx;
                sorter.classList.add('hidden');
                renderTheaterSlide();
            };
            grid.appendChild(card);
        });
        sorter.classList.remove('hidden');
    }
}

// ZOOM 2X
function toggleTheaterZoom(e) {
    theaterIsZoomed = !theaterIsZoomed;
    const frame = document.getElementById('theater-slide-frame');
    if (!frame) return;

    if (theaterIsZoomed) {
        frame.style.transform = `scale(1.8)`;
        frame.style.transformOrigin = `${e?.clientX ? (e.clientX / window.innerWidth) * 100 : 50}% ${e?.clientY ? (e.clientY / window.innerHeight) * 100 : 50}%`;
        showToastNotification("Lupa 2x Activada (Presiona Z para salir)");
    } else {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const scale = Math.min(screenW / STAGE_WIDTH, screenH / STAGE_HEIGHT) * 0.95;
        frame.style.transform = `scale(${scale})`;
        frame.style.transformOrigin = `center center`;
    }
}

// TINTA DIGITAL EN VIVO (LIVE INK CANVAS)
let isInkDrawing = false;
let lastInkX = 0, lastInkY = 0;

function setupTheaterInkCanvas() {
    const canvas = document.getElementById('theater-ink-canvas');
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvas.onmousedown = (e) => {
        if (theaterInkTool === 'none') return;
        isInkDrawing = true;
        lastInkX = e.clientX;
        lastInkY = e.clientY;
    };

    canvas.onmousemove = (e) => {
        if (!isInkDrawing || theaterInkTool === 'none') return;
        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.moveTo(lastInkX, lastInkY);
        ctx.lineTo(e.clientX, e.clientY);

        if (theaterInkTool === 'pen') {
            ctx.strokeStyle = '#ef4444'; // Rojo vivo
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 1;
        } else if (theaterInkTool === 'marker') {
            ctx.strokeStyle = '#fbbf24'; // Resaltador ámbar
            ctx.lineWidth = 14;
            ctx.lineCap = 'square';
            ctx.globalAlpha = 0.45;
        } else if (theaterInkTool === 'eraser') {
            ctx.clearRect(e.clientX - 15, e.clientY - 15, 30, 30);
            lastInkX = e.clientX;
            lastInkY = e.clientY;
            return;
        }

        ctx.stroke();
        lastInkX = e.clientX;
        lastInkY = e.clientY;
    };

    canvas.onmouseup = () => { isInkDrawing = false; };
}

function setTheaterInkTool(tool) {
    theaterInkTool = (theaterInkTool === tool) ? 'none' : tool;
    const canvas = document.getElementById('theater-ink-canvas');

    const penBtn = document.getElementById('btn-theater-pen');
    const markerBtn = document.getElementById('btn-theater-marker');
    const eraserBtn = document.getElementById('btn-theater-eraser');

    if (penBtn) penBtn.classList.toggle('bg-amber-500/30', theaterInkTool === 'pen');
    if (markerBtn) markerBtn.classList.toggle('bg-amber-500/30', theaterInkTool === 'marker');
    if (eraserBtn) eraserBtn.classList.toggle('bg-amber-500/30', theaterInkTool === 'eraser');

    if (canvas) {
        canvas.style.pointerEvents = (theaterInkTool === 'none') ? 'none' : 'auto';
        canvas.style.cursor = (theaterInkTool === 'eraser') ? 'cell' : 'crosshair';
    }
}

function clearTheaterInk() {
    const canvas = document.getElementById('theater-ink-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function toggleTheaterLaser() {
    isLaserActive = !isLaserActive;
    const theater = document.getElementById('presentation-theater');
    const dot = document.getElementById('laser-pointer-dot');
    const btn = document.getElementById('btn-theater-laser');

    if (theater) theater.classList.toggle('laser-mode', isLaserActive);
    if (dot) dot.style.display = isLaserActive ? 'block' : 'none';
    if (btn) btn.classList.toggle('bg-red-500/20', isLaserActive);
}

function handleTheaterMouseMove(e) {
    if (!isLaserActive) return;
    const dot = document.getElementById('laser-pointer-dot');
    if (dot) {
        dot.style.left = `${e.clientX}px`;
        dot.style.top = `${e.clientY}px`;
    }
}

function toggleTheaterNotesPopup() {
    const pop = document.getElementById('theater-notes-popup');
    if (pop) pop.classList.toggle('hidden');
}

function toggleTheaterBlackout() {
    isTheaterBlackout = !isTheaterBlackout;
    const overlay = document.getElementById('theater-blackout-overlay');
    if (overlay) overlay.classList.toggle('hidden', !isTheaterBlackout);
}

function toggleAutoPlay() {
    isAutoPlaying = !isAutoPlaying;
    const btn = document.getElementById('btn-theater-autoplay');

    if (isAutoPlaying) {
        if (btn) btn.classList.add('bg-emerald-500/20');
        autoPlayTimer = setInterval(theaterNext, 5000);
    } else {
        if (btn) btn.classList.remove('bg-emerald-500/20');
        if (autoPlayTimer) clearInterval(autoPlayTimer);
    }
}

function handleTheaterKeyDown(e) {
    if (!isTheaterActive) return;

    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        theaterNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        theaterPrev();
    } else if (e.key === 'Home') {
        theaterIndex = 0;
        renderTheaterSlide();
    } else if (e.key === 'End') {
        theaterIndex = proyecto_actual.slides.length - 1;
        renderTheaterSlide();
    } else if (e.key === 'l' || e.key === 'L') {
        toggleTheaterLaser();
    } else if (e.key === 'p' || e.key === 'P') {
        setTheaterInkTool('pen');
    } else if (e.key === 'm' || e.key === 'M') {
        setTheaterInkTool('marker');
    } else if (e.key === 'e' || e.key === 'E') {
        setTheaterInkTool('eraser');
    } else if (e.key === 'g' || e.key === 'G') {
        toggleTheaterSlideSorter();
    } else if (e.key === 'z' || e.key === 'Z') {
        toggleTheaterZoom(e);
    } else if (e.key === 't' || e.key === 'T') {
        resetTheaterTimer();
    } else if (e.key === 'n' || e.key === 'N') {
        toggleTheaterNotesPopup();
    } else if (e.key === 'b' || e.key === 'B') {
        toggleTheaterBlackout();
    } else if (e.key === 'Escape') {
        exitPresentationMode();
    }
}

// =========================================================================
// MOTOR DE ANIMACIONES (ANIMATION ENGINE & TIMELINE DRAWER)
// =========================================================================
const AnimationEngine = {
    getEffectKeyframes(category, effect, direction) {
        switch (effect) {
            case 'fadeIn':
                return [{ opacity: 0 }, { opacity: 1 }];
            case 'flyIn': {
                let x = 0, y = 0;
                if (direction === 'bottom') y = 80;
                else if (direction === 'top') y = -80;
                else if (direction === 'left') x = -80;
                else if (direction === 'right') x = 80;
                return [
                    { opacity: 0, transform: `translate(${x}px, ${y}px)` },
                    { opacity: 1, transform: 'translate(0px, 0px)' }
                ];
            }
            case 'zoomIn':
                return [
                    { opacity: 0, transform: 'scale(0.3)' },
                    { opacity: 1, transform: 'scale(1)' }
                ];
            case 'bounceIn':
                return [
                    { opacity: 0, transform: 'scale(0.3)' },
                    { opacity: 0.9, transform: 'scale(1.08)' },
                    { opacity: 1, transform: 'scale(1)' }
                ];
            case 'wipe': {
                let insetStart = 'inset(0 100% 0 0)';
                if (direction === 'bottom') insetStart = 'inset(100% 0 0 0)';
                else if (direction === 'top') insetStart = 'inset(0 0 100% 0)';
                return [
                    { clipPath: insetStart },
                    { clipPath: 'inset(0 0 0 0)' }
                ];
            }
            case 'pulse':
                return [
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.08)' },
                    { transform: 'scale(1)' }
                ];
            case 'glowAmber':
                return [
                    { boxShadow: '0 0 0px rgba(245, 158, 11, 0)' },
                    { boxShadow: '0 0 30px rgba(245, 158, 11, 0.9)' },
                    { boxShadow: '0 0 0px rgba(245, 158, 11, 0)' }
                ];
            case 'shake':
                return [
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-8px)' },
                    { transform: 'translateX(8px)' },
                    { transform: 'translateX(-6px)' },
                    { transform: 'translateX(6px)' },
                    { transform: 'translateX(0)' }
                ];
            case 'spotlight':
                return [
                    { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 rgba(0,0,0,0))' },
                    { transform: 'scale(1.06)', filter: 'drop-shadow(0 10px 25px rgba(245, 158, 11, 0.6))' },
                    { transform: 'scale(1.05)', filter: 'drop-shadow(0 10px 20px rgba(245, 158, 11, 0.4))' }
                ];
            case 'fadeOut':
                return [{ opacity: 1 }, { opacity: 0 }];
            case 'flyOut': {
                let x = 0, y = 0;
                if (direction === 'bottom') y = 80;
                else if (direction === 'top') y = -80;
                else if (direction === 'left') x = -80;
                else if (direction === 'right') x = 80;
                return [
                    { opacity: 1, transform: 'translate(0, 0)' },
                    { opacity: 0, transform: `translate(${x}px, ${y}px)` }
                ];
            }
            default:
                return [{ opacity: 0 }, { opacity: 1 }];
        }
    },

    executeAnimation(anim, domEl, onComplete) {
        if (!domEl) {
            if (onComplete) onComplete();
            return;
        }

        const duration = anim.duration || 500;
        const delay = anim.delay || 0;
        const easing = anim.easing === 'spring' ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : (anim.easing || 'ease-out');

        if (anim.effect === 'countUp') {
            const valEl = domEl.querySelector('.text-2xl, .kpi-val, .count-target') || domEl;
            const originalText = valEl.textContent || '$ 0.00';
            const numMatch = originalText.match(/[\d,.]+/);
            if (numMatch) {
                const targetNum = parseFloat(numMatch[0].replace(/,/g, ''));
                const isCurrency = originalText.includes('$');
                const startTime = performance.now();

                function stepCount(time) {
                    const elapsed = time - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const currentVal = (targetNum * progress).toFixed(2);
                    valEl.textContent = `${isCurrency ? '$ ' : ''}${parseFloat(currentVal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                    if (progress < 1) {
                        requestAnimationFrame(stepCount);
                    } else {
                        valEl.textContent = originalText;
                        if (onComplete) onComplete();
                    }
                }
                setTimeout(() => requestAnimationFrame(stepCount), delay);
                return;
            }
        } else if (anim.effect === 'typewriter') {
            const textEl = domEl.querySelector('p, h1, h2, h3, h4, span') || domEl;
            const fullText = textEl.textContent || '';
            textEl.textContent = '';
            let charIndex = 0;
            const intervalTime = Math.max(15, Math.floor(duration / Math.max(fullText.length, 1)));

            setTimeout(() => {
                const timer = setInterval(() => {
                    charIndex++;
                    textEl.textContent = fullText.slice(0, charIndex);
                    if (charIndex >= fullText.length) {
                        clearInterval(timer);
                        if (onComplete) onComplete();
                    }
                }, intervalTime);
            }, delay);
            return;
        } else if (anim.effect === 'chartGrow') {
            const rects = domEl.querySelectorAll('rect');
            rects.forEach(r => {
                const targetH = r.getAttribute('height');
                const targetY = r.getAttribute('y');
                r.animate([
                    { height: '0px', y: '200px' },
                    { height: `${targetH}px`, y: `${targetY}px` }
                ], { duration, delay, easing, fill: 'forwards' });
            });
            setTimeout(() => {
                if (onComplete) onComplete();
            }, duration + delay);
            return;
        } else if (anim.effect === 'spotlight') {
            const otherDoms = document.querySelectorAll('.slide-element');
            otherDoms.forEach(other => {
                if (other !== domEl) {
                    other.animate([
                        { opacity: 1 },
                        { opacity: 0.25 },
                        { opacity: 1 }
                    ], { duration: duration + 1000, delay, easing });
                }
            });
        }

        const keyframes = this.getEffectKeyframes(anim.category, anim.effect, anim.direction);
        const player = domEl.animate(keyframes, {
            duration: duration,
            delay: delay,
            easing: easing,
            fill: anim.category === 'exit' ? 'forwards' : 'both'
        });

        player.onfinish = () => {
            if (onComplete) onComplete();
        };
    },

    playSequence(slide, onSequenceComplete) {
        const animations = slide.animations || [];
        if (animations.length === 0) {
            showToastNotification("Esta diapositiva no tiene animaciones configuradas");
            if (onSequenceComplete) onSequenceComplete();
            return;
        }

        let currentIndex = 0;

        function runNext() {
            if (currentIndex >= animations.length) {
                if (onSequenceComplete) onSequenceComplete();
                return;
            }

            const anim = animations[currentIndex];
            const dom = document.getElementById('dom_' + anim.elementId);
            currentIndex++;

            AnimationEngine.executeAnimation(anim, dom, () => {
                while (currentIndex < animations.length && animations[currentIndex].trigger === 'withPrevious') {
                    const withAnim = animations[currentIndex];
                    const withDom = document.getElementById('dom_' + withAnim.elementId);
                    currentIndex++;
                    AnimationEngine.executeAnimation(withAnim, withDom);
                }
                setTimeout(runNext, 80);
            });
        }

        runNext();
    }
};

function toggleAnimationTimelineDrawer() {
    const drawer = document.getElementById('animation-timeline-drawer');
    const btn = document.getElementById('btn-toggle-animation-timeline');
    if (!drawer) return;

    const isOpen = !drawer.classList.contains('hidden');
    if (isOpen) {
        drawer.classList.add('hidden');
        if (btn) btn.classList.remove('bg-amber-100', 'text-amber-700', 'dark:bg-amber-900/30', 'dark:text-amber-400');
    } else {
        drawer.classList.remove('hidden');
        if (btn) btn.classList.add('bg-amber-100', 'text-amber-700', 'dark:bg-amber-900/30', 'dark:text-amber-400');
        renderAnimationTimeline();
    }
}

function renderAnimationTimeline() {
    const list = document.getElementById('animation-timeline-list');
    if (!list) return;

    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    if (!Array.isArray(currentSlide.animations)) {
        currentSlide.animations = [];
    }

    list.innerHTML = '';

    if (currentSlide.animations.length === 0) {
        list.innerHTML = `
            <div class="col-span-full py-6 text-center text-slate-400 dark:text-slate-500 text-xs font-bold flex flex-col items-center justify-center gap-2">
                <i class="fas fa-wand-magic-sparkles text-2xl opacity-40 text-amber-500"></i>
                <span>No hay pasos de animación en esta diapositiva.</span>
                <span class="text-[10px] text-slate-400">Selecciona un elemento y haz clic en "Animar" para agregar efectos secuenciales.</span>
            </div>
        `;
        return;
    }

    currentSlide.animations.forEach((anim, idx) => {
        const el = currentSlide.elements.find(it => it.id === anim.elementId);
        const elName = el ? `${el.type.toUpperCase()} (${(el.content || el.title || el.id).slice(0, 15)})` : 'Elemento';

        let triggerIcon = 'fa-mouse-pointer';
        let triggerLabel = 'Al Clic';
        if (anim.trigger === 'withPrevious') {
            triggerIcon = 'fa-link';
            triggerLabel = 'Con Anterior';
        } else if (anim.trigger === 'afterPrevious') {
            triggerIcon = 'fa-clock';
            triggerLabel = 'Después de Anterior';
        }

        let catColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
        if (anim.category === 'emphasis') catColor = 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
        else if (anim.category === 'exit') catColor = 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';

        const card = document.createElement('div');
        card.className = 'flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-amber-400 transition-all text-xs font-bold';

        card.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black flex items-center justify-center">${idx + 1}</span>
                <div class="space-y-0.5">
                    <div class="flex items-center gap-2">
                        <span class="text-slate-800 dark:text-white font-black truncate max-w-[140px]">${elName}</span>
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-bold border ${catColor}">${anim.effect}</span>
                    </div>
                    <div class="flex items-center gap-3 text-[10px] text-slate-400">
                        <span class="flex items-center gap-1"><i class="fas ${triggerIcon} text-[9px]"></i> ${triggerLabel}</span>
                        <span>•</span>
                        <span>${anim.duration || 500}ms</span>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-1">
                <button onclick="playSingleAnimPreview('${anim.id}')" class="tool-icon-btn !w-6 !h-6 text-amber-500" title="Probar"><i class="fas fa-play text-[10px]"></i></button>
                <button onclick="moveAnimationOrder('${anim.id}', -1)" class="tool-icon-btn !w-6 !h-6" title="Subir"><i class="fas fa-chevron-up text-[10px]"></i></button>
                <button onclick="moveAnimationOrder('${anim.id}', 1)" class="tool-icon-btn !w-6 !h-6" title="Bajar"><i class="fas fa-chevron-down text-[10px]"></i></button>
                <button onclick="removeAnimation('${anim.id}')" class="tool-icon-btn !w-6 !h-6 text-rose-500 hover:text-rose-600" title="Quitar"><i class="fas fa-trash-alt text-[10px]"></i></button>
            </div>
        `;
        list.appendChild(card);
    });
}

function playSingleAnimPreview(animId) {
    const currentSlide = getActiveSlide();
    const anim = currentSlide?.animations.find(it => it.id === animId);
    if (!anim) return;

    const dom = document.getElementById('dom_' + anim.elementId);
    AnimationEngine.executeAnimation(anim, dom);
}

function playSlideAnimationsPreview() {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    showToastNotification("▶ Ejecutando secuencia de animaciones...");
    AnimationEngine.playSequence(currentSlide, () => {
        showToastNotification("Secuencia completada");
    });
}

function moveAnimationOrder(animId, direction) {
    const currentSlide = getActiveSlide();
    if (!currentSlide || !currentSlide.animations) return;

    const idx = currentSlide.animations.findIndex(it => it.id === animId);
    if (idx === -1) return;

    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= currentSlide.animations.length) return;

    const [item] = currentSlide.animations.splice(idx, 1);
    currentSlide.animations.splice(targetIdx, 0, item);

    renderAnimationTimeline();
    renderAnimationBadges();
    pushHistoryState();
    triggerAutoSave();
}

function removeAnimation(animId) {
    const currentSlide = getActiveSlide();
    if (!currentSlide || !currentSlide.animations) return;

    currentSlide.animations = currentSlide.animations.filter(it => it.id !== animId);

    renderAnimationTimeline();
    renderAnimationBadges();
    updatePropertyBar();
    pushHistoryState();
    triggerAutoSave();
    showToastNotification("Animación removida");
}

let currentAnimTargetElementId = null;

function openAddAnimationModal(elementId) {
    currentAnimTargetElementId = elementId || selectedElementId;
    const modal = document.getElementById('add-animation-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeAddAnimationModal() {
    const modal = document.getElementById('add-animation-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function handleAnimCategoryChange() {
    const cat = document.getElementById('anim-category-select')?.value || 'entrance';
    const effectSelect = document.getElementById('anim-effect-select');
    if (!effectSelect) return;

    effectSelect.innerHTML = '';

    if (cat === 'entrance') {
        effectSelect.innerHTML = `
            <option value="fadeIn">Desvanecer (Fade In)</option>
            <option value="flyIn">Desplazar desde fuera (Fly In)</option>
            <option value="zoomIn">Zoom Elástico</option>
            <option value="bounceIn">Rebote Físico (Bounce)</option>
            <option value="wipe">Barrido (Wipe)</option>
            <option value="typewriter">Máquina de Escribir (Texto)</option>
            <option value="countUp">Conteo de Divisas (Finanzas KPI)</option>
            <option value="chartGrow">Crecimiento de Barras (Gráficos)</option>
        `;
    } else if (cat === 'emphasis') {
        effectSelect.innerHTML = `
            <option value="pulse">Latido (Pulse)</option>
            <option value="glowAmber">Resplandor Dorado (Glow)</option>
            <option value="spotlight">Spotlight (Atenuar Resto de Elementos)</option>
            <option value="shake">Vibración de Alerta (Shake)</option>
        `;
    } else if (cat === 'exit') {
        effectSelect.innerHTML = `
            <option value="fadeOut">Desvanecer hacia fuera (Fade Out)</option>
            <option value="flyOut">Desplazar hacia fuera (Fly Out)</option>
            <option value="zoomOut">Zoom de Salida</option>
        `;
    }
}

function saveAnimationFromModal() {
    const currentSlide = getActiveSlide();
    if (!currentSlide || !currentAnimTargetElementId) return;

    if (!Array.isArray(currentSlide.animations)) {
        currentSlide.animations = [];
    }

    const cat = document.getElementById('anim-category-select')?.value || 'entrance';
    const effect = document.getElementById('anim-effect-select')?.value || 'fadeIn';
    const trigger = document.getElementById('anim-trigger-select')?.value || 'onClick';
    const duration = parseInt(document.getElementById('anim-duration-input')?.value || '500');
    const delay = parseInt(document.getElementById('anim-delay-input')?.value || '0');
    const direction = document.getElementById('anim-direction-select')?.value || 'bottom';

    const newAnim = {
        id: 'anim_' + Date.now(),
        elementId: currentAnimTargetElementId,
        category: cat,
        effect: effect,
        direction: direction,
        trigger: trigger,
        duration: duration,
        delay: delay,
        easing: 'ease-out'
    };

    currentSlide.animations.push(newAnim);

    closeAddAnimationModal();
    renderAnimationTimeline();
    renderAnimationBadges();
    updatePropertyBar();
    pushHistoryState();
    triggerAutoSave();
    showToastNotification("✨ Animación agregada a la diapositiva");
}

// =========================================================================
// 15. EXPORTACIÓN (PDF MULTIPÁGINA, IMAGEN PNG, RESPALDO .EDCP)
// =========================================================================
async function exportToPDF() {
    const slides = proyecto_actual.slides || [];
    if (slides.length === 0) {
        alert("No hay diapositivas para exportar.");
        return;
    }

    const { jsPDF } = window.jspdf || window;
    if (!jsPDF) {
        alert("El motor PDF se está inicializando. Por favor intenta en unos segundos.");
        return;
    }

    showToastNotification("Generando PDF de la presentación...");

    try {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [STAGE_WIDTH, STAGE_HEIGHT]
        });

        for (let i = 0; i < slides.length; i++) {
            if (i > 0) doc.addPage([STAGE_WIDTH, STAGE_HEIGHT], 'landscape');

            const slide = slides[i];
            const canvas = await renderSlideToOffscreenCanvas(slide);
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            doc.addImage(imgData, 'JPEG', 0, 0, STAGE_WIDTH, STAGE_HEIGHT);
        }

        const filename = `${proyecto_actual.name || 'Presentacion'}.pdf`;
        doc.save(filename);
        showToastNotification("📄 Presentación descargada en PDF con éxito");
    } catch (err) {
        console.error("Error al exportar a PDF:", err);
        alert("Ocurrió un error al compilar el PDF.");
    }
}

async function exportSlideAsImage(format = 'png') {
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    showToastNotification("Preparando captura en alta definición...");

    try {
        const canvas = await renderSlideToOffscreenCanvas(currentSlide);
        const link = document.createElement('a');
        link.download = `${proyecto_actual.name || 'Diapositiva'}_Slide_${activeSlideIndex + 1}.${format}`;
        link.href = canvas.toDataURL(`image/${format}`);
        link.click();
        showToastNotification("🖼️ Diapositiva exportada con éxito");
    } catch (err) {
        console.error("Error al exportar imagen:", err);
    }
}

async function renderSlideToOffscreenCanvas(slide) {
    const canvas = document.createElement('canvas');
    canvas.width = STAGE_WIDTH * 2; // Retina 2x
    canvas.height = STAGE_HEIGHT * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    // Fondo
    ctx.fillStyle = slide.background?.value || '#ffffff';
    ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

    // Dibujar elementos
    (slide.elements || []).forEach(el => {
        if (el.hidden) return;
        ctx.save();
        ctx.translate(el.x, el.y);
        if (el.rotation) {
            ctx.translate(el.width / 2, el.height / 2);
            ctx.rotate((el.rotation * Math.PI) / 180);
            ctx.translate(-el.width / 2, -el.height / 2);
        }

        if (el.opacity !== undefined) {
            ctx.globalAlpha = el.opacity;
        }

        if (el.type === 'text') {
            ctx.fillStyle = el.highlightBg || el.bg || 'transparent';
            if (el.highlightBg || el.bg) ctx.fillRect(0, 0, el.width, el.height);

            ctx.fillStyle = el.color || '#0f172a';
            ctx.font = `${el.fontStyle || ''} ${el.fontWeight || 'normal'} ${el.fontSize || 16}px ${el.fontFamily || 'Plus Jakarta Sans'}, sans-serif`;
            ctx.textAlign = el.textAlign === 'center' ? 'center' : (el.textAlign === 'right' ? 'right' : 'left');

            const textX = el.textAlign === 'center' ? el.width / 2 : (el.textAlign === 'right' ? el.width : 0);
            const lines = (el.content || '').split('\n');
            const lineHeight = (el.fontSize || 16) * (el.lineHeight || 1.3);

            lines.forEach((line, idx) => {
                ctx.fillText(line, textX, (el.fontSize || 16) + idx * lineHeight);
            });
        } else if (el.type === 'shape') {
            ctx.fillStyle = el.fill || '#f59e0b';
            ctx.strokeStyle = el.stroke || '#d97706';
            ctx.lineWidth = el.strokeWidth || 1;

            if (el.shapeType === 'circle') {
                ctx.beginPath();
                ctx.arc(el.width / 2, el.height / 2, el.width / 2, 0, Math.PI * 2);
                ctx.fill();
                if (el.strokeWidth) ctx.stroke();
            } else {
                ctx.fillRect(0, 0, el.width, el.height);
                if (el.strokeWidth) ctx.strokeRect(0, 0, el.width, el.height);
            }
        } else if (el.type === 'kpi') {
            ctx.fillStyle = el.bg || '#ecfdf5';
            ctx.strokeStyle = el.border || '#a7f3d0';
            ctx.lineWidth = 2;
            ctx.fillRect(0, 0, el.width, el.height);
            ctx.strokeRect(0, 0, el.width, el.height);

            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText((el.title || 'Métrica').toUpperCase(), 16, 26);

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 24px sans-serif';
            ctx.fillText(el.value || '$ 0.00', 16, 80);

            ctx.fillStyle = el.accent || '#059669';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText(el.change || '+0%', 16, 130);
        } else if (el.type === 'auditBadge') {
            ctx.fillStyle = el.bg || '#ecfdf5';
            ctx.strokeStyle = el.color || '#059669';
            ctx.lineWidth = 2;
            ctx.fillRect(0, 0, el.width, el.height);
            ctx.strokeRect(0, 0, el.width, el.height);

            ctx.fillStyle = el.color || '#059669';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText((el.title || 'AUDITADO').toUpperCase(), el.width / 2, el.height / 2 + 4);
        }

        ctx.restore();
    });

    return canvas;
}

function exportPresentationJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(proyecto_actual, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `${proyecto_actual.name || 'Presentacion'}.edcp`);
    dlAnchor.click();
    showToastNotification("Respaldo .edcp descargado");
}

// =========================================================================
// 16. CONTROL DE ZOOM Y VIEWPORT
// =========================================================================
function calculateFitZoom() {
    const viewport = document.getElementById('stage-outer-viewport');
    const scaler = document.getElementById('slide-canvas-scaler');
    if (!viewport || !scaler) return;

    const availableW = viewport.clientWidth - 40;
    const availableH = viewport.clientHeight - 40;

    const scaleX = availableW / STAGE_WIDTH;
    const scaleY = availableH / STAGE_HEIGHT;
    zoomScale = Math.min(scaleX, scaleY, 1.3);

    scaler.style.transform = `scale(${zoomScale})`;
}

function setZoomLevel(val) {
    currentZoom = val;
    const scaler = document.getElementById('slide-canvas-scaler');
    if (!scaler) return;

    if (val === 'fit') {
        calculateFitZoom();
    } else {
        zoomScale = parseFloat(val);
        scaler.style.transform = `scale(${zoomScale})`;
    }
}

function zoomIn() {
    zoomScale = Math.min(1.6, zoomScale + 0.15);
    document.getElementById('slide-canvas-scaler').style.transform = `scale(${zoomScale})`;
}

function zoomOut() {
    zoomScale = Math.max(0.35, zoomScale - 0.15);
    document.getElementById('slide-canvas-scaler').style.transform = `scale(${zoomScale})`;
}

// =========================================================================
// 17. HISTORIAL (DESHACER / REHACER) & PERSISTENCIA
// =========================================================================
function pushHistoryState() {
    if (isHistoryAction || !proyecto_actual) return;

    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(JSON.parse(JSON.stringify(proyecto_actual)));

    if (historyStack.length > 30) {
        historyStack.shift();
    } else {
        historyIndex++;
    }
}

function undo() {
    if (historyIndex > 0) {
        isHistoryAction = true;
        historyIndex--;
        proyecto_actual = JSON.parse(JSON.stringify(historyStack[historyIndex]));
        renderThumbnails();
        renderActiveSlide();
        updatePropertyBar();
        renderLayersList();
        triggerAutoSave();
        isHistoryAction = false;
        showToastNotification("Deshacer");
    }
}

function redo() {
    if (historyIndex < historyStack.length - 1) {
        isHistoryAction = true;
        historyIndex++;
        proyecto_actual = JSON.parse(JSON.stringify(historyStack[historyIndex]));
        renderThumbnails();
        renderActiveSlide();
        updatePropertyBar();
        renderLayersList();
        triggerAutoSave();
        isHistoryAction = false;
        showToastNotification("Rehacer");
    }
}

function updatePresentationName(newName) {
    if (!proyecto_actual) return;
    proyecto_actual.name = newName.trim() || 'Presentación Sin Título';
    proyecto_actual.updatedAt = new Date().toISOString();
    triggerAutoSave();
}

function triggerAutoSave() {
    if (window.isAuditMode) return;

    saveProjectsToLocal();

    const saveInd = document.getElementById('save-indicator');
    if (saveInd) {
        saveInd.classList.add('text-emerald-500');
    }

    if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);
    cloudSyncTimeout = setTimeout(syncWithCloud, 3000);
}

function saveProjectsToLocal() {
    if (!proyecto_actual) return;
    proyecto_actual.updatedAt = new Date().toISOString();

    const idx = projects.findIndex(p => p.id === proyecto_actual.id);
    if (idx !== -1) {
        projects[idx] = proyecto_actual;
    } else {
        projects.unshift(proyecto_actual);
    }

    localStorage.setItem('educonta_projects_diapositivas', JSON.stringify(projects));
}

async function syncWithCloud() {
    if (window.isAuditMode || typeof supabaseClient === 'undefined') return;

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && proyecto_actual) {
            const cloudStatus = document.getElementById('cloud-status-text');
            if (cloudStatus) cloudStatus.textContent = 'SUBIENDO...';

            if (typeof syncCurrentProjectWithSupabase === 'function') {
                await syncCurrentProjectWithSupabase(proyecto_actual, session.user.id, true);
            } else {
                await supabaseClient.from('proyectos_contables').upsert({
                    id: proyecto_actual.id,
                    user_id: session.user.id,
                    data: proyecto_actual,
                    updated_at: new Date().toISOString()
                });
            }

            if (cloudStatus) cloudStatus.textContent = 'SINCRONIZADO';
        }
    } catch (e) {
        console.error("Error en sincronización con Supabase:", e);
    }
}

async function checkCloudSession() {
    if (typeof supabaseClient === 'undefined') return;
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const cloudPill = document.getElementById('cloud-indicator');
        if (cloudPill) {
            if (session) {
                cloudPill.classList.remove('opacity-40');
            } else {
                cloudPill.classList.add('opacity-40');
            }
        }
    } catch (_) {}
}

// =========================================================================
// 18. MODAL DE COLABORACIÓN & ATAJOS DE TECLADO COMPLETOS
// =========================================================================
// clipboardElements ya está declarado en la cabecera (Línea 41)

function copySelectedElements() {
    const currentSlide = getActiveSlide();
    if (!currentSlide || selectedElementIds.length === 0) return;

    clipboardElements = currentSlide.elements
        .filter(it => selectedElementIds.includes(it.id))
        .map(it => JSON.parse(JSON.stringify(it)));

    showToastNotification(`📋 ${clipboardElements.length} elemento(s) copiado(s)`);
}

function cutSelectedElements() {
    copySelectedElements();
    deleteSelectedElements();
    showToastNotification(`✂️ Elemento(s) cortado(s)`);
}

function pasteClipboardElements() {
    if (clipboardElements.length === 0) return;
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;

    const newIds = [];
    clipboardElements.forEach(item => {
        const copy = JSON.parse(JSON.stringify(item));
        copy.id = 'el_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        copy.x += 20;
        copy.y += 20;
        currentSlide.elements.push(copy);
        newIds.push(copy.id);
    });

    selectedElementIds = newIds;
    renderActiveSlide();
    updatePropertyBar();
    renderLayersList();
    pushHistoryState();
    triggerAutoSave();
    renderThumbnails();
    showToastNotification(`📋 ${newIds.length} elemento(s) pegado(s)`);
}

function openShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        renderCollaboratorsList();
    }
}

function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function renderCollaboratorsList() {
    const list = document.getElementById('collaborators-list');
    if (!list || !proyecto_actual) return;

    list.innerHTML = '';
    const collabs = proyecto_actual.shared_with || [];

    if (collabs.length === 0) {
        list.innerHTML = '<span class="text-xs text-slate-400 italic">No hay colaboradores con acceso a esta presentación.</span>';
        return;
    }

    collabs.forEach(uid => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold';
        item.innerHTML = `
            <span class="truncate max-w-[200px]">${uid}</span>
            <button onclick="removeCollaborator('${uid}')" class="text-rose-500 hover:text-rose-600"><i class="fas fa-trash-alt"></i></button>
        `;
        list.appendChild(item);
    });
}

function addCollaborator() {
    const input = document.getElementById('share-uid-input');
    if (!input || !input.value.trim() || !proyecto_actual) return;

    const uid = input.value.trim();
    if (!Array.isArray(proyecto_actual.shared_with)) {
        proyecto_actual.shared_with = [];
    }

    if (!proyecto_actual.shared_with.includes(uid)) {
        proyecto_actual.shared_with.push(uid);
        renderCollaboratorsList();
        input.value = '';
        triggerAutoSave();
        showToastNotification("Colaborador añadido");
    }
}

function removeCollaborator(uid) {
    if (!proyecto_actual || !Array.isArray(proyecto_actual.shared_with)) return;
    proyecto_actual.shared_with = proyecto_actual.shared_with.filter(id => id !== uid);
    renderCollaboratorsList();
    triggerAutoSave();
}

function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        // En modo teatro, los atajos son manejados por handleTheaterKeyDown
        if (isTheaterActive) return;

        // No interceptar si el usuario está escribiendo en campos editables
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }

        const isCtrl = e.ctrlKey || e.metaKey;

        // F5 o Ctrl+Enter: Iniciar Presentación
        if (e.key === 'F5' || (isCtrl && e.key === 'Enter')) {
            e.preventDefault();
            startPresentationMode();
            return;
        }

        // Portapapeles: Ctrl+C, Ctrl+X, Ctrl+V
        if (isCtrl && e.key === 'c') {
            e.preventDefault();
            copySelectedElements();
            return;
        }
        if (isCtrl && e.key === 'x') {
            e.preventDefault();
            cutSelectedElements();
            return;
        }
        if (isCtrl && e.key === 'v') {
            e.preventDefault();
            pasteClipboardElements();
            return;
        }

        // Agrupar (Ctrl+G) / Desagrupar (Ctrl+Shift+G)
        if (isCtrl && (e.key === 'g' || e.key === 'G')) {
            e.preventDefault();
            if (e.shiftKey) {
                ungroupSelectedElements();
            } else {
                groupSelectedElements();
            }
            return;
        }

        // Formato de Texto: Ctrl+B (Negrita), Ctrl+I (Cursiva), Ctrl+U (Subrayado)
        if (isCtrl && (e.key === 'b' || e.key === 'B')) {
            e.preventDefault();
            toggleTextWeight();
            return;
        }
        if (isCtrl && (e.key === 'i' || e.key === 'I')) {
            e.preventDefault();
            toggleTextItalic();
            return;
        }
        if (isCtrl && (e.key === 'u' || e.key === 'U')) {
            e.preventDefault();
            toggleTextUnderline();
            return;
        }

        // Deshacer (Ctrl+Z) / Rehacer (Ctrl+Y o Ctrl+Shift+Z)
        if (isCtrl && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
            return;
        } else if (isCtrl && e.key === 'y') {
            e.preventDefault();
            redo();
            return;
        }

        // Duplicar elemento o diapositiva (Ctrl+D)
        if (isCtrl && e.key === 'd') {
            e.preventDefault();
            if (selectedElementIds.length > 0) duplicateSelectedElements();
            else duplicateActiveSlide();
            return;
        }

        // Suprimir / Borrar
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedElementIds.length > 0) {
                e.preventDefault();
                deleteSelectedElements();
                return;
            }
        }

        // Movimiento de Precisión con Flechas (Nudge: 1px o 10px con Shift)
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            if (selectedElementIds.length > 0) {
                e.preventDefault();
                const step = e.shiftKey ? 10 : 1;
                const currentSlide = getActiveSlide();
                if (!currentSlide) return;

                selectedElementIds.forEach(id => {
                    const el = currentSlide.elements.find(it => it.id === id);
                    if (!el || el.locked) return;

                    if (e.key === 'ArrowUp') el.y -= step;
                    else if (e.key === 'ArrowDown') el.y += step;
                    else if (e.key === 'ArrowLeft') el.x -= step;
                    else if (e.key === 'ArrowRight') el.x += step;

                    const dom = document.getElementById('dom_' + el.id);
                    if (dom) {
                        dom.style.left = `${el.x}px`;
                        dom.style.top = `${el.y}px`;
                    }
                });

                updateConnectorsForElements(selectedElementIds);
                pushHistoryState();
                triggerAutoSave();
                renderThumbnails();
                return;
            } else {
                // Si no hay elemento seleccionado, cambiar de diapositiva
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    goToNextSlide();
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    goToPrevSlide();
                }
            }
        }

        // Escape: Deseleccionar todo
        if (e.key === 'Escape') {
            deselectAllElements();
        }
    });
}

// =========================================================================
// 19. UTILIDADES COMUNES
// =========================================================================
function getActiveSlide() {
    if (!proyecto_actual || !proyecto_actual.slides) return null;
    return proyecto_actual.slides[activeSlideIndex] || null;
}

function showToastNotification(msg) {
    const toast = document.getElementById('sync-toast');
    const txt = document.getElementById('toast-message-text');
    if (!toast) return;

    if (txt) txt.textContent = msg;
    toast.classList.remove('opacity-0', 'translate-y-32');
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-32');
    }, 2500);
}

function debounce(fn, ms) {
    let timer = null;
    return function(...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    };
}

function savePresentationManual() {
    saveProjectsToLocal();
    syncWithCloud();
    showToastNotification("Presentación guardada correctamente");
}

function addQuickAnimation(effect) {
    if (!proyecto_actual || selectedElementIds.length === 0) {
        showToastNotification("Selecciona un elemento para animar");
        return;
    }
    const currentSlide = getActiveSlide();
    if (!currentSlide) return;
    if (!Array.isArray(currentSlide.animations)) currentSlide.animations = [];

    let category = 'entrance';
    if (['pulse', 'glowAmber', 'spotlight', 'shake'].includes(effect)) {
        category = 'emphasis';
    } else if (['fadeOut', 'flyOut', 'zoomOut'].includes(effect)) {
        category = 'exit';
    }

    selectedElementIds.forEach(elId => {
        const newAnim = {
            id: 'anim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            elementId: elId,
            category: category,
            effect: effect,
            direction: 'bottom',
            trigger: currentSlide.animations.length === 0 ? 'onClick' : 'afterPrevious',
            duration: 600,
            delay: 0,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
        };
        currentSlide.animations.push(newAnim);
    });

    renderActiveSlide();
    renderAnimationTimeline();
    pushHistoryState();
    triggerAutoSave();
    showToastNotification(`Animación '${effect}' añadida`);
}

function setAspectRatio(ratio) {
    if (!proyecto_actual) return;
    proyecto_actual.aspectRatio = ratio;
    const pill = document.getElementById('aspect-ratio-pill');
    if (pill) pill.textContent = ratio;
    calculateFitZoom();
    pushHistoryState();
    triggerAutoSave();
    showToastNotification(`Formato cambiado a ${ratio}`);
}

window.closeProject = function() {
    window.location.href = 'documentos.html';
};
window.savePresentationManual = savePresentationManual;
window.addQuickAnimation = addQuickAnimation;
window.setAspectRatio = setAspectRatio;
window.calculateFitZoom = calculateFitZoom;
window.deleteSelectedElements = deleteSelectedElements;
window.groupSelectedElements = groupSelectedElements;
window.ungroupSelectedElements = ungroupSelectedElements;
window.alignSelectedElements = alignSelectedElements;
window.distributeSelectedElements = distributeSelectedElements;
window.bringElementToFront = bringElementToFront;
window.sendElementToBack = sendElementToBack;
window.startPresentationMode = startPresentationMode;
window.exitPresentationMode = exitPresentationMode;
window.openShareModal = openShareModal;
window.exportToPDF = exportToPDF;
window.exportSlideAsImage = exportSlideAsImage;
window.exportPresentationJSON = exportPresentationJSON;
window.updatePresentationName = updatePresentationName;
window.undo = undo;
window.redo = redo;
window.toggleFormatPainter = toggleFormatPainter;
window.addSlideElement = addSlideElement;
window.addSlideShape = addSlideShape;
window.addSlideConnector = addSlideConnector;
window.addSlideTable = addSlideTable;
window.addSlideKPI = addSlideKPI;
window.openChartModal = openChartModal;
window.openImportAccountingModal = openImportAccountingModal;
window.openAuditBadgesModal = openAuditBadgesModal;
window.openImageModal = openImageModal;
window.openIconModal = openIconModal;
window.addSlideSticky = addSlideSticky;
window.openTemplatesModal = openTemplatesModal;
window.openLayoutPickerModal = openLayoutPickerModal;
window.switchSidebarTab = switchSidebarTab;
window.duplicateActiveSlide = duplicateActiveSlide;
window.goToPrevSlide = goToPrevSlide;
window.toggleSpeakerNotesDrawer = toggleSpeakerNotesDrawer;
window.openSpeakerNotesDrawer = toggleSpeakerNotesDrawer;
window.setZoomLevel = setZoomLevel;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.changeZoom = function(delta) { if (delta > 0) zoomIn(); else zoomOut(); };
window.toggleGrid = toggleGridOverlay;
window.toggleGridOverlay = toggleGridOverlay;
window.handleViewportClick = handleViewportClick;
window.handleStageMouseMove = handleStageMouseMove;
window.handleStageMouseUp = handleStageMouseUp;
window.handleStageMouseDown = handleStageMouseDown;



