/**
 * layout.js — PageLayoutManager
 * Dimensiones de papel, márgenes, zoom y orientación.
 * EduConta SV
 */
import { MARGIN_PRESETS, mmToPx, PAGE_DIMENSIONS } from './constants.js';
import { MultiPageEngine } from './engine.js';
import { TextDocStateManager } from './state.js';
import { CollabPresenceManager } from './collab.js';

const PageLayoutManager = {
    currentZoom: 1.5,
    currentSheetTheme: null,

    // ─── Modo de Hojas y Lienzo (Claro / Oscuro) ──────────────────────────
    initSheetTheme() {
        const saved = localStorage.getItem('educonta-textos-sheet-theme');
        if (saved === 'light' || saved === 'dark') {
            this.setSheetTheme(saved, false);
        } else {
            const appTheme = document.documentElement.getAttribute('data-theme') || 'light';
            this.setSheetTheme(appTheme, false);
        }
    },

    getSheetTheme() {
        if (this.currentSheetTheme) return this.currentSheetTheme;
        const container = document.getElementById('pages-container');
        if (container && container.getAttribute('data-sheet-theme')) {
            return container.getAttribute('data-sheet-theme');
        }
        return document.documentElement.getAttribute('data-theme') || 'light';
    },

    setSheetTheme(theme, save = true) {
        if (theme !== 'light' && theme !== 'dark') return;
        this.currentSheetTheme = theme;

        const container = document.getElementById('pages-container');
        if (container) {
            container.setAttribute('data-sheet-theme', theme);
        }

        this.updateSheetThemeUI(theme);

        if (save) {
            localStorage.setItem('educonta-textos-sheet-theme', theme);
            if (window.TextDocStateManager && typeof window.TextDocStateManager.showToast === 'function') {
                const label = theme === 'light' ? 'Modo Claro (Hoja blanca)' : 'Modo Oscuro (Hoja oscura)';
                window.TextDocStateManager.showToast(`Hojas: ${label}`);
            }
        }
    },

    toggleSheetTheme() {
        const current = this.getSheetTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        this.setSheetTheme(next, true);
    },

    updateSheetThemeUI(theme) {
        const current = theme || this.getSheetTheme();
        const btnLight = document.getElementById('btn-sheet-mode-light');
        const btnDark  = document.getElementById('btn-sheet-mode-dark');

        if (btnLight) {
            const isLight = (current === 'light');
            btnLight.classList.toggle('active', isLight);
            btnLight.setAttribute('aria-pressed', isLight ? 'true' : 'false');
        }

        if (btnDark) {
            const isDark = (current === 'dark');
            btnDark.classList.toggle('active', isDark);
            btnDark.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        }
    },

    applyPageGeometry(sizeKey, margins, lineSpacing, orientation, fontFamily = '') {
        const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
        const activeFont = fontFamily || sheet?.fontFamily || 'Plus Jakarta Sans';
        const cleanFont = activeFont.trim().replace(/^['"]|['"]$/g, '');

        if (typeof window.ensureGoogleFontLoaded === 'function' && cleanFont) {
            window.ensureGoogleFontLoaded(cleanFont);
        }

        const root = document.documentElement;
        const dim = PAGE_DIMENSIONS[sizeKey] || PAGE_DIMENSIONS.letter;

        const widthMm  = (orientation === 'landscape') ? dim.height : dim.width;
        const heightMm = (orientation === 'landscape') ? dim.width  : dim.height;

        root.style.setProperty('--doc-page-width',    `${widthMm}mm`);
        root.style.setProperty('--doc-page-height',   `${heightMm}mm`);
        root.style.setProperty('--doc-margin-top',    `${margins.top    || 25}mm`);
        root.style.setProperty('--doc-margin-bottom', `${margins.bottom || 25}mm`);
        root.style.setProperty('--doc-margin-left',   `${margins.left   || 25}mm`);
        root.style.setProperty('--doc-margin-right',  `${margins.right  || 25}mm`);

        const sizeSelect    = document.getElementById('page-size-select');
        const spacingSelect = document.getElementById('page-spacing-select');
        const fontSelect    = document.getElementById('font-family-select');
        if (sizeSelect)    sizeSelect.value = sizeKey;
        if (spacingSelect) spacingSelect.value = lineSpacing;
        if (fontSelect && cleanFont) {
            fontSelect.value = cleanFont;
            if (fontSelect._glassInstance) fontSelect._glassInstance.updateTriggerLabel();
        }

        const pages = document.querySelectorAll('.page-sheet');
        pages.forEach(p => {
            ['spacing-single','spacing-115','spacing-125','spacing-15','spacing-175','spacing-double']
                .forEach(c => p.classList.remove(c));
            p.classList.add(`spacing-${lineSpacing}`);
            const surface = p.querySelector('.page-editor-surface');
            if (surface) surface.style.fontFamily = `'${cleanFont}', sans-serif`;
        });

        this.injectPrintPageRule(widthMm, heightMm);
        MultiPageEngine.updateAllPageNumbers();
        MultiPageEngine.paginate();
        this.applyZoom();
        this.initSheetTheme();
    },

    injectPrintPageRule(widthMm, heightMm) {
        let styleTag = document.getElementById('dynamic-print-page-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'dynamic-print-page-style';
            document.head.appendChild(styleTag);
        }
        styleTag.textContent = `@media print { @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; } }`;
    },

    setPageSize(sizeKey) {
        const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
        if (!sheet) return;
        sheet.pageSize = sizeKey;
        this.applyPageGeometry(sizeKey, sheet.margins, sheet.lineSpacing, sheet.orientation);
        TextDocStateManager.triggerAutoSave();
        CollabPresenceManager.broadcastLayoutChange({
            pageSize: sizeKey,
            margins: sheet.margins,
            lineSpacing: sheet.lineSpacing,
            orientation: sheet.orientation,
            headerFooter: sheet.headerFooter
        });
    },

    setMarginPreset(presetKey) {
        const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
        if (!sheet) return;
        if (presetKey === 'custom') { this.openPageSetupModal(); return; }
        const preset = MARGIN_PRESETS[presetKey] || MARGIN_PRESETS.normal;
        sheet.margins = preset;
        sheet.marginPreset = presetKey;
        this.applyPageGeometry(sheet.pageSize, preset, sheet.lineSpacing, sheet.orientation);
        TextDocStateManager.triggerAutoSave();
        CollabPresenceManager.broadcastLayoutChange({
            pageSize: sheet.pageSize,
            margins: preset,
            marginPreset: presetKey,
            lineSpacing: sheet.lineSpacing,
            orientation: sheet.orientation,
            headerFooter: sheet.headerFooter
        });
    },

    setSpacing(spacing) {
        const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
        if (!sheet) return;
        sheet.lineSpacing = spacing;
        this.applyPageGeometry(sheet.pageSize, sheet.margins, spacing, sheet.orientation);
        TextDocStateManager.triggerAutoSave();
        CollabPresenceManager.broadcastLayoutChange({
            pageSize: sheet.pageSize,
            margins: sheet.margins,
            marginPreset: sheet.marginPreset,
            lineSpacing: spacing,
            orientation: sheet.orientation,
            headerFooter: sheet.headerFooter
        });
    },

    toggleOrientation() {
        const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
        if (!sheet) return;
        const currentOrientation = sheet.orientation || 'portrait';
        const nextOrientation    = currentOrientation === 'portrait' ? 'landscape' : 'portrait';
        sheet.orientation = nextOrientation;
        this.applyPageGeometry(sheet.pageSize, sheet.margins, sheet.lineSpacing, nextOrientation);
        TextDocStateManager.triggerAutoSave();
        TextDocStateManager.showToast(`Orientación: ${nextOrientation === 'portrait' ? 'Vertical' : 'Horizontal (Apaisado)'}`);
        CollabPresenceManager.broadcastLayoutChange({
            pageSize: sheet.pageSize,
            margins: sheet.margins,
            marginPreset: sheet.marginPreset,
            lineSpacing: sheet.lineSpacing,
            orientation: nextOrientation,
            headerFooter: sheet.headerFooter
        });
    },

    openPageSetupModal() {
        const modal = document.getElementById('page-setup-modal');
        if (!modal) return;
        const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
        const size = sheet?.pageSize || 'letter';
        const orient = sheet?.orientation || 'portrait';
        const margins = sheet?.margins || MARGIN_PRESETS.normal;
        const hf = sheet?.headerFooter || {
            showHeader: false, showFooter: false,
            headerText: '', footerText: '', showPageNumbers: false
        };

        const sizeSel        = document.getElementById('modal-page-size-select');
        const orientSel      = document.getElementById('modal-page-orientation-select');
        const topInp         = document.getElementById('margin-top-input');
        const bottomInp      = document.getElementById('margin-bottom-input');
        const leftInp        = document.getElementById('margin-left-input');
        const rightInp       = document.getElementById('margin-right-input');
        const showHeaderInp  = document.getElementById('modal-show-header');
        const headerTextInp  = document.getElementById('modal-header-text');
        const showFooterInp  = document.getElementById('modal-show-footer');
        const footerTextInp  = document.getElementById('modal-footer-text');
        const showPageNumsInp= document.getElementById('modal-show-pagenums');

        if (sizeSel)    sizeSel.value    = size;
        if (orientSel)  orientSel.value  = orient;
        if (topInp)     topInp.value     = margins.top    || 25;
        if (bottomInp)  bottomInp.value  = margins.bottom || 25;
        if (leftInp)    leftInp.value    = margins.left   || 25;
        if (rightInp)   rightInp.value   = margins.right  || 25;
        if (showHeaderInp)  showHeaderInp.checked  = !!hf.showHeader;
        if (headerTextInp)  headerTextInp.value    = hf.headerText || '';
        if (showFooterInp)  showFooterInp.checked  = !!hf.showFooter;
        if (footerTextInp)  footerTextInp.value    = hf.footerText || '';
        if (showPageNumsInp)showPageNumsInp.checked = !!hf.showPageNumbers;

        modal.style.display = 'flex';
    },

    closePageSetupModal() {
        const modal = document.getElementById('page-setup-modal');
        if (modal) modal.style.display = 'none';
    },

    applyPresetToModal(presetKey) {
        const preset = MARGIN_PRESETS[presetKey] || MARGIN_PRESETS.normal;
        const topInp    = document.getElementById('margin-top-input');
        const bottomInp = document.getElementById('margin-bottom-input');
        const leftInp   = document.getElementById('margin-left-input');
        const rightInp  = document.getElementById('margin-right-input');
        if (topInp)    topInp.value    = preset.top;
        if (bottomInp) bottomInp.value = preset.bottom;
        if (leftInp)   leftInp.value   = preset.left;
        if (rightInp)  rightInp.value  = preset.right;
    },

    applyPageSetupFromModal() {
        const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
        if (!sheet) return;

        const size        = document.getElementById('modal-page-size-select')?.value        || 'letter';
        const orientation = document.getElementById('modal-page-orientation-select')?.value || 'portrait';
        const top         = parseInt(document.getElementById('margin-top-input')?.value, 10)    || 25;
        const bottom      = parseInt(document.getElementById('margin-bottom-input')?.value, 10) || 25;
        const left        = parseInt(document.getElementById('margin-left-input')?.value, 10)   || 25;
        const right       = parseInt(document.getElementById('margin-right-input')?.value, 10)  || 25;

        const showHeader     = document.getElementById('modal-show-header')?.checked     || false;
        const headerText     = document.getElementById('modal-header-text')?.value.trim() || '';
        const showFooter     = document.getElementById('modal-show-footer')?.checked     || false;
        const footerText     = document.getElementById('modal-footer-text')?.value.trim() || '';
        const showPageNumbers= document.getElementById('modal-show-pagenums')?.checked   || false;

        const newMargins = { top, bottom, left, right };
        let presetFound = 'custom';
        for (const [key, p] of Object.entries(MARGIN_PRESETS)) {
            if (p.top === top && p.bottom === bottom && p.left === left && p.right === right) {
                presetFound = key; break;
            }
        }

        sheet.pageSize     = size;
        sheet.orientation  = orientation;
        sheet.margins      = newMargins;
        sheet.marginPreset = presetFound;
        sheet.headerFooter = { showHeader, showFooter, headerText, footerText, showPageNumbers };

        const marginSelect = document.getElementById('page-margins-select');
        if (marginSelect) marginSelect.value = presetFound;

        this.applyPageGeometry(size, newMargins, sheet.lineSpacing, orientation);
        MultiPageEngine.updateAllPageNumbers();
        MultiPageEngine.paginate();
        TextDocStateManager.triggerAutoSave();
        this.closePageSetupModal();
        TextDocStateManager.showToast('Configuración de página aplicada');
        CollabPresenceManager.broadcastLayoutChange({
            pageSize: size, orientation, margins: newMargins,
            marginPreset: presetFound, headerFooter: sheet.headerFooter
        });
    },

    zoomIn() {
        if (this.currentZoom < 2.0) {
            this.currentZoom = Math.min(2.0, Math.round((this.currentZoom + 0.1) * 10) / 10);
            this.applyZoom();
        }
    },

    zoomOut() {
        if (this.currentZoom > 0.5) {
            this.currentZoom = Math.max(0.5, Math.round((this.currentZoom - 0.1) * 10) / 10);
            this.applyZoom();
        }
    },

    resetZoom() {
        this.currentZoom = 1.5;
        this.applyZoom();
    },

    setZoom(val) {
        this.currentZoom = Math.max(0.5, Math.min(2.0, Math.round(val * 10) / 10));
        this.applyZoom();
    },

    applyZoom(isPaginationSync = false) {
        const wrapper = document.getElementById('paper-transform-wrapper');
        const container = document.getElementById('pages-container');
        const spacer = document.getElementById('zoom-scroll-spacer');
        if (!wrapper) return;

        const zoom = this.currentZoom;
        const zoomStr = `${Math.round(zoom * 100)}%`;

        // Transformación cinemática suave con aceleración por hardware:
        wrapper.style.transform = `scale(${zoom})`;
        wrapper.style.transformOrigin = 'top center';

        // Sincronización exacta y segura de las dimensiones de desplazamiento:
        // Evita el bug de doble escalado multiplicador, ajustando el espaciador exterior
        // para que scrollHeight refleje fielmente el tamaño físico escalado de la hoja.
        if (container) {
            const baseHeight = container.offsetHeight || 0;
            const scaledHeight = Math.ceil(baseHeight * zoom);

            if (zoom < 1.0) {
                wrapper.style.height = `${scaledHeight}px`;
                if (spacer) {
                    spacer.style.height = '0px';
                    spacer.style.minHeight = '0px';
                }
            } else {
                wrapper.style.height = '';
                const extra = Math.max(0, scaledHeight - baseHeight);
                if (spacer) {
                    spacer.style.height = `${extra}px`;
                    spacer.style.minHeight = `${extra}px`;
                }
            }
        }

        // Limpiar cualquier residuo de minWidth o minHeight para impedir scroll horizontal
        wrapper.style.minHeight = '';
        wrapper.style.minWidth = '';

        // Confinamiento seguro: asegurar que el scroll vertical nunca sobrepase la hoja ni salga del campo visible
        const scrollArea = document.querySelector('.editor-scroll-area');
        if (scrollArea) {
            scrollArea.scrollLeft = 0;
            const maxScrollY = Math.max(0, scrollArea.scrollHeight - scrollArea.clientHeight);
            if (scrollArea.scrollTop > maxScrollY) {
                scrollArea.scrollTop = maxScrollY;
            }
            if (!isPaginationSync && window.SmoothScrollManager) {
                window.SmoothScrollManager.stopAnimation();
            }
        }

        if (!isPaginationSync) {
            const ribbonText    = document.getElementById('zoom-level-text');
            const statusbarText = document.getElementById('zoom-level-statusbar');
            if (ribbonText)    ribbonText.textContent    = zoomStr;
            if (statusbarText) statusbarText.textContent = zoomStr;

            // Actualizar la animación elástica de la burbuja en los presets de zoom
            this.updateZoomBubble(this.currentBubbleIndex < 0);
        }
    },

    currentBubbleIndex: -1,
    bubbleSnapTimeout: null,

    updateZoomBubble(instant = false) {
        const pill = document.getElementById('zoom-bubble-indicator');
        const container = document.getElementById('zoom-presets-container');
        if (!pill || !container) return;

        const roundedZoom = Math.round(this.currentZoom * 10) / 10;
        let activeBtn = null;
        let targetIndex = -1;

        if (roundedZoom === 1.0) {
            activeBtn = document.getElementById('btn-reset-zoom');
            targetIndex = 0;
        } else if (roundedZoom === 1.5) {
            activeBtn = document.getElementById('btn-zoom-preset-150');
            targetIndex = 1;
        } else if (roundedZoom === 2.0) {
            activeBtn = document.getElementById('btn-zoom-preset-max');
            targetIndex = 2;
        }

        const allButtons = container.querySelectorAll('.zoom-preset-btn');

        if (!activeBtn) {
            pill.style.opacity = '0';
            allButtons.forEach(b => {
                b.classList.remove('text-white', '!text-white');
                b.classList.add('text-slate-600', 'dark:text-slate-300');
            });
            this.currentBubbleIndex = -1;
            return;
        }

        allButtons.forEach(b => {
            if (b === activeBtn) {
                b.classList.add('text-white', '!text-white');
                b.classList.remove('text-slate-600', 'dark:text-slate-300');
            } else {
                b.classList.remove('text-white', '!text-white');
                b.classList.add('text-slate-600', 'dark:text-slate-300');
            }
        });

        if (activeBtn.offsetWidth === 0) {
            requestAnimationFrame(() => this.updateZoomBubble(instant));
            return;
        }

        if (this.bubbleSnapTimeout) {
            clearTimeout(this.bubbleSnapTimeout);
            this.bubbleSnapTimeout = null;
        }

        const distance = this.currentBubbleIndex >= 0 ? Math.abs(targetIndex - this.currentBubbleIndex) : 0;
        const stretch = (distance > 0) ? (1 + Math.min(distance * 0.15, 0.35)) : 1;
        const isInstant = instant || distance === 0 || this.currentBubbleIndex < 0;

        pill.style.width = `${activeBtn.offsetWidth}px`;
        pill.style.opacity = '1';

        if (isInstant) {
            pill.style.transition = 'none';
            pill.style.transform = `translateX(${activeBtn.offsetLeft}px) scaleX(1) scaleY(1)`;
            void pill.offsetWidth;
            requestAnimationFrame(() => {
                pill.style.transition = '';
            });
        } else {
            // Efecto elástico squish/stretch característico de la burbuja de EduConta SV
            pill.style.transform = `translateX(${activeBtn.offsetLeft}px) scaleX(${stretch}) scaleY(0.88)`;
            this.bubbleSnapTimeout = setTimeout(() => {
                pill.style.transform = `translateX(${activeBtn.offsetLeft}px) scaleX(1) scaleY(1)`;
                this.bubbleSnapTimeout = null;
            }, 180);
        }

        this.currentBubbleIndex = targetIndex;
    }
};

window.addEventListener('resize', () => {
    window.PageLayoutManager?.updateZoomBubble?.(true);
    window.PageLayoutManager?.applyZoom?.();
});

if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
        window.PageLayoutManager?.updateZoomBubble?.(true);
    });
}

const SmoothScrollManager = {
    scrollArea: null,
    targetY: null,
    isAnimating: false,
    rafId: null,

    init() {
        this.scrollArea = document.querySelector('.editor-scroll-area');
        if (!this.scrollArea) return;

        // Asegurar bloqueo estricto de cualquier scroll horizontal
        this.scrollArea.scrollLeft = 0;
        this.scrollArea.style.overflowX = 'hidden';

        // Escucha de rueda con cinemática suave en el área de edición
        this.scrollArea.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // Reenvío suave de rueda desde los controles superiores y cabeceras
        document.addEventListener('wheel', (e) => {
            const onTopControls = e.target?.closest?.('.sticky-fixed-controls, #editor-sticky-controls, .main-header-wrapper, .main-header');
            if (onTopControls && !e.target.closest('.educonta-glass-select-popover, select, [data-scrollable], textarea, input')) {
                this.handleWheel(e);
            }
        }, { passive: false });

        // Detener animación si el usuario arrastra la barra de scroll con el ratón o usa táctil
        this.scrollArea.addEventListener('mousedown', () => this.stopAnimation());
        this.scrollArea.addEventListener('touchstart', () => this.stopAnimation(), { passive: true });

        // Asegurar que scrollLeft se mantenga siempre en cero
        this.scrollArea.addEventListener('scroll', () => {
            if (this.scrollArea.scrollLeft !== 0) {
                this.scrollArea.scrollLeft = 0;
            }
        }, { passive: true });
    },

    handleWheel(e) {
        if (!this.scrollArea) return;

        // Atajo interactivo: Ctrl + Rueda de ratón para acercar o alejar el zoom de forma segura
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.deltaY < 0) {
                PageLayoutManager.zoomIn();
            } else if (e.deltaY > 0) {
                PageLayoutManager.zoomOut();
            }
            return;
        }

        // Detección de Trackpad/Touchpad: eventos continuos con deltas fraccionarios
        const isTrackpad = Math.abs(e.deltaY) < 35 && !Number.isInteger(e.deltaY);
        if (isTrackpad && e.deltaMode === 0) {
            this.stopAnimation();
            return;
        }

        e.preventDefault();

        let deltaY = e.deltaY;

        // Normalizar según deltaMode
        if (e.deltaMode === 1) { // Líneas (ruedas de ratón clásicas)
            deltaY *= 32;
        } else if (e.deltaMode === 2) { // Páginas
            deltaY *= this.scrollArea.clientHeight * 0.85;
        }

        if (!this.isAnimating) {
            this.targetY = this.scrollArea.scrollTop;
        }

        // Confinamiento estricto y seguro: el desplazamiento vertical NUNCA sale del campo visible de la hoja
        const maxScrollY = Math.max(0, this.scrollArea.scrollHeight - this.scrollArea.clientHeight);
        this.targetY = Math.max(0, Math.min(maxScrollY, this.targetY + deltaY));

        if (!this.isAnimating) {
            this.isAnimating = true;
            this.rafId = requestAnimationFrame(() => this.step());
        }
    },

    step() {
        if (!this.isAnimating || !this.scrollArea) return;

        const currentY = this.scrollArea.scrollTop;
        const diffY = this.targetY - currentY;

        // Si la distancia es menor a 0.5px, fijar posición final
        if (Math.abs(diffY) < 0.5) {
            this.scrollArea.scrollTop = this.targetY;
            this.isAnimating = false;
            this.rafId = null;
            return;
        }

        // Factor de amortiguación 0.18 para una fluidez sedosa pero precisa
        this.scrollArea.scrollTop = currentY + diffY * 0.18;

        this.rafId = requestAnimationFrame(() => this.step());
    },

    stopAnimation() {
        this.isAnimating = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this.scrollArea) {
            this.targetY = this.scrollArea.scrollTop;
        }
    }
};

export { PageLayoutManager, SmoothScrollManager };