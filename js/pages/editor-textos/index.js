/**
 * index.js — Entry point del Editor de Textos
 * Importa todos los módulos, expone a window.* y ejecuta la inicialización.
 * EduConta SV — type="module"
 */

// Módulos del editor
import { TextDocStateManager }     from './state.js';
import { MultiPageEngine }         from './engine.js';
import { PageLayoutManager, SmoothScrollManager } from './layout.js';
import { EduContaTextEngine }      from './text-engine.js';
import { DocumentTemplates }       from './templates.js';
import { FindReplaceManager }      from './find-replace.js';
import { TableOfContentsManager }  from './toc.js';
import { DocStatsManager }         from './stats.js';
import { DocExportManager }        from './export.js';
import { CollabPresenceManager }   from './collab.js';
import { ImageLayerManager }       from './images.js';
import { ImageEditorManager }      from './image-editor.js';
import { ImageCropManager }        from './image-crop.js';
import { ImageResizeManager }      from './image-resizer.js';
import { AuditModeHandler }        from './audit.js';
import { SpellCheckManager }       from './spellcheck.js';
import { TableManager }            from './table-manager.js';
import {
    initColorPresetsGrid,
    toggleColorPickerPopover,
    closeColorPickers,
    applyPaletteColor,
    previewPaletteColor,
    cancelPaletteColorPreview,
    pickColorWithEyedropper,
    switchToCustomColorView,
    switchToPresetsColorView,
    onHexInputChange,
    onRgbInputChange,
    applyCustomInteractiveColor
} from './color-picker.js';

// ─── Exposición global (window.*) ───────────────────────────────────────
// Necesario para los onclick="" inline del HTML y para otros scripts del proyecto
window.TextDocStateManager    = TextDocStateManager;
window.MultiPageEngine        = MultiPageEngine;
window.PageLayoutManager      = PageLayoutManager;
window.SmoothScrollManager    = SmoothScrollManager;
window.EduContaTextEngine     = EduContaTextEngine;
window.DocumentTemplates      = DocumentTemplates;
window.FindReplaceManager     = FindReplaceManager;
window.TableOfContentsManager = TableOfContentsManager;
window.DocStatsManager        = DocStatsManager;
window.DocExportManager       = DocExportManager;
window.CollabPresenceManager  = CollabPresenceManager;
window.ImageLayerManager      = ImageLayerManager;
window.ImageEditorManager     = ImageEditorManager;
window.ImageCropManager       = ImageCropManager;
window.ImageResizeManager     = ImageResizeManager;
window.AuditModeHandler       = AuditModeHandler;
window.SpellCheckManager      = SpellCheckManager;
window.TableManager           = TableManager;

// Color picker utilities
window.toggleColorPickerPopover    = toggleColorPickerPopover;
window.closeColorPickers           = closeColorPickers;
window.applyPaletteColor           = applyPaletteColor;
window.previewPaletteColor         = previewPaletteColor;
window.cancelPaletteColorPreview   = cancelPaletteColorPreview;
window.pickColorWithEyedropper     = pickColorWithEyedropper;
window.switchToCustomColorView     = switchToCustomColorView;
window.switchToPresetsColorView    = switchToPresetsColorView;
window.onHexInputChange            = onHexInputChange;
window.onRgbInputChange            = onRgbInputChange;
window.applyCustomInteractiveColor = applyCustomInteractiveColor;

// Métodos globales auxiliares para eventos HTML inline
window.openShareModal    = () => CollabPresenceManager.openShareModal();
window.closeShareModal   = () => CollabPresenceManager.closeShareModal();
window.copyInviteLink    = () => CollabPresenceManager.copyInviteLink();
window.addCollaborator   = () => CollabPresenceManager.addCollaborator();
window.setCollaboratorRole = (uid, role) => CollabPresenceManager.setCollaboratorRole(uid, role);
window.removeCollaborator  = (uid) => CollabPresenceManager.removeCollaborator(uid);

// ─── Control del Cajón Lateral (Drawer) de Páginas y Plantillas ─────────────
window.toggleDocSidebarDrawer = function(force) {
    const drawer = document.getElementById('doc-sidebar-drawer');
    const backdrop = document.getElementById('sidebar-drawer-backdrop');
    const btnToggle = document.getElementById('btn-toggle-sidebar');
    if (!drawer) return;

    const isOpen = drawer.classList.contains('translate-x-0');
    const shouldOpen = typeof force === 'boolean' ? force : !isOpen;

    if (shouldOpen) {
        drawer.classList.remove('-translate-x-full', '-translate-x-[calc(100%+24px)]', '-translate-x-[380px]');
        drawer.classList.add('translate-x-0');
        if (backdrop) backdrop.classList.add('hidden'); // Sin oscurecer ni desenfocar la vista
        if (btnToggle) {
            btnToggle.setAttribute('aria-expanded', 'true');
            btnToggle.classList.add('bg-amber-500/20', 'text-amber-600', 'border-amber-500/40', 'dark:text-amber-400');
        }
    } else {
        drawer.classList.remove('translate-x-0');
        drawer.classList.add('-translate-x-[calc(100%+24px)]');
        if (backdrop) backdrop.classList.add('hidden');
        if (btnToggle) {
            btnToggle.setAttribute('aria-expanded', 'false');
            btnToggle.classList.remove('bg-amber-500/20', 'text-amber-600', 'border-amber-500/40', 'dark:text-amber-400');
        }
    }
};

// ─── Control de Pestañas de la Cinta Ribbon (Inicio / Insertar / Vista) con Deslizador de Alto Rendimiento ────
let currentRibbonTabIndex = 0;
window.currentActiveRibbonTab = 'inicio';

window.updateRibbonBubble = function(tabName, instant = false) {
    const tabs = ['inicio', 'insertar', 'vista'];
    const pill = document.getElementById('ribbon-bubble-indicator');
    const container = document.getElementById('ribbon-tabs-container');
    const btn = document.getElementById(`ribbon-tab-btn-${tabName}`);
    if (!pill || !container || !btn) return;

    if (btn.offsetWidth === 0) {
        requestAnimationFrame(() => window.updateRibbonBubble(tabName, instant));
        return;
    }

    const targetIndex = tabs.indexOf(tabName);

    if (instant) {
        pill.style.transition = 'none';
        pill.style.width = `${btn.offsetWidth}px`;
        pill.style.transform = `translateX(${btn.offsetLeft}px)`;
        pill.style.opacity = '1';
        void pill.offsetWidth;
        requestAnimationFrame(() => {
            pill.style.transition = '';
        });
        if (targetIndex >= 0) currentRibbonTabIndex = targetIndex;
        window.currentActiveRibbonTab = tabName;
        return;
    }

    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.transform = `translateX(${btn.offsetLeft}px)`;
    pill.style.opacity = '1';

    if (targetIndex >= 0) currentRibbonTabIndex = targetIndex;
    window.currentActiveRibbonTab = tabName;
};

window.switchRibbonTab = function(tabName) {
    const tabs = ['inicio', 'insertar', 'vista'];
    if (!tabs.includes(tabName)) return;

    const isAlreadyActive = (tabName === window.currentActiveRibbonTab);
    const isCollapsed = document.body.classList.contains('ribbon-shelf-collapsed');

    // Si ya está activa y la barra no está colapsada, no hay nada que cambiar
    if (isAlreadyActive && !isCollapsed) {
        return;
    }

    // Actualizar botones de la píldora inmediatamente para feedback táctil instantáneo
    tabs.forEach(t => {
        const btn = document.getElementById(`ribbon-tab-btn-${t}`);
        const pane = document.getElementById(`shelf-tab-${t}`);
        const isActive = (t === tabName);
        if (btn) {
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        }
        if (pane) {
            if (isActive) {
                pane.classList.remove('hidden');
                pane.classList.add('flex');
            } else {
                pane.classList.remove('flex');
                pane.classList.add('hidden');
            }
        }
    });

    // Mover burbuja indicadora suavemente y sin retrasos al nuevo botón
    window.updateRibbonBubble(tabName, false);

    // Si la cinta de herramientas estaba colapsada y el usuario hace clic en una pestaña, la expandimos
    if (isCollapsed) {
        window.toggleRibbonShelf(true);
    }

    // Actualizar controles si se pasa a la pestaña Disposición & Vista
    if (tabName === 'vista' && window.PageLayoutManager?.updateSheetThemeUI) {
        window.PageLayoutManager.updateSheetThemeUI();
    }
};

// ─── Alternar Colapso de la Cinta de Herramientas (Modo Zen / Compacto) ────
window.toggleRibbonShelf = function(force) {
    const isCollapsed = document.body.classList.contains('ribbon-shelf-collapsed');
    const shouldExpand = typeof force === 'boolean' ? force : isCollapsed;
    const shelf = document.getElementById('ribbon-shelf-card');

    if (shouldExpand) {
        document.body.classList.remove('ribbon-shelf-collapsed');
        if (shelf) {
            shelf.classList.remove('collapsed', 'anim-shelf-exit');
            shelf.classList.add('revealed', 'anim-shelf-enter');
        }
    } else {
        document.body.classList.add('ribbon-shelf-collapsed');
        if (shelf) {
            shelf.classList.remove('revealed', 'anim-shelf-enter');
            shelf.classList.add('collapsed', 'anim-shelf-exit');
        }
    }

    requestAnimationFrame(() => {
        if (window.currentActiveRibbonTab) {
            window.updateRibbonBubble(window.currentActiveRibbonTab, true);
        }
    });
};

window.forceSave = function(quiet = false) {
    if (window.TextDocStateManager) {
        window.TextDocStateManager.saveState();
        window.TextDocStateManager.syncCloud(!quiet);
    }
};

window.focusActiveEditor = (atStart = true) => MultiPageEngine.focusActiveEditor(atStart);

// ─── Inicialización ────────────────────────────────────────────────────────
const initTextEditorSubsystems = () => {
    SpellCheckManager.init();
    TableManager.init();
    TextDocStateManager.init();
    PageLayoutManager.initSheetTheme();
    PageLayoutManager.applyZoom();
    SmoothScrollManager.init();
    PageLayoutManager.updateZoomBubble(true);
    window.updateRibbonBubble(window.currentActiveRibbonTab || 'inicio', true);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTextEditorSubsystems);
} else {
    initTextEditorSubsystems();
}

window.addEventListener('resize', () => {
    if (window.currentActiveRibbonTab) {
        window.updateRibbonBubble(window.currentActiveRibbonTab, true);
    }
});

if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
        if (window.currentActiveRibbonTab) {
            window.updateRibbonBubble(window.currentActiveRibbonTab, true);
        }
    });
}

// Listeners globales de conectividad
window.addEventListener('online', () => {
    if (typeof window.showSyncToast === 'function') window.showSyncToast('online');
    if (window.TextDocStateManager?.syncCloud) window.TextDocStateManager.syncCloud(false);
});
window.addEventListener('offline', () => {
    if (window.TextDocStateManager?.updateSyncUI) window.TextDocStateManager.updateSyncUI('offline');
    if (typeof window.showSyncToast === 'function') window.showSyncToast('offline');
});

// Atajos globales de teclado (Ctrl+S, Ctrl++, Ctrl+-, Ctrl+0, Alt+P, Escape)
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const drawer = document.getElementById('doc-sidebar-drawer');
        if (drawer && drawer.classList.contains('translate-x-0')) {
            window.toggleDocSidebarDrawer(false);
        }
    } else if (e.altKey && (e.key === 'p' || e.key === 'P' || e.code === 'KeyP')) {
        e.preventDefault();
        window.toggleDocSidebarDrawer();
    } else if (e.altKey && (e.key === 'l' || e.key === 'L' || e.code === 'KeyL')) {
        e.preventDefault();
        window.PageLayoutManager?.toggleSheetTheme();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
        e.preventDefault();
        if (window.TextDocStateManager?.saveStateManual) {
            window.TextDocStateManager.saveStateManual();
        }
    } else if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=' || e.code === 'Equal' || e.code === 'NumpadAdd')) {
        e.preventDefault();
        window.PageLayoutManager?.zoomIn();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_' || e.code === 'Minus' || e.code === 'NumpadSubtract')) {
        e.preventDefault();
        window.PageLayoutManager?.zoomOut();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0')) {
        e.preventDefault();
        window.PageLayoutManager?.resetZoom();
    }
});

// Prevenir pérdida de foco/selección al hacer clic en controles de barra
document.addEventListener('mousedown', (e) => {
    const colorPopover = e.target.closest('#popover-color-picker');
    if (colorPopover) {
        // Permitir foco interactivo únicamente en campos de entrada (HEX, R, G, B)
        const isInputField = e.target.closest('input, textarea');
        if (!isInputField) {
            if (window.EduContaTextEngine?.saveActiveSelection) {
                window.EduContaTextEngine.saveActiveSelection(true);
            }
            e.preventDefault();
        }
        return;
    }

    const isColorInput = e.target.closest('#text-color-input, #bg-color-input');
    if (isColorInput) {
        if (window.EduContaTextEngine?.saveActiveSelection) {
            window.EduContaTextEngine.saveActiveSelection(true);
        }
        return;
    }

    const isTool = e.target.closest('.tool-btn, .toolbar-btn, .educonta-glass-select-trigger, .educonta-glass-select-popover button, .toolbar-row button, [data-option-item], .ec-table-tool-btn, #table-floating-toolbar button, #table-color-popover button');
    const isInput = e.target.closest('input, textarea, [contenteditable="true"]');
    if (isTool && !isInput) {
        if (window.EduContaTextEngine?.saveActiveSelection) {
            window.EduContaTextEngine.saveActiveSelection(false);
        }
        e.preventDefault();
    }
}, true);

// Cerrar popovers de colores al hacer clic fuera
document.addEventListener('click', (e) => {
    const colorPopover = document.getElementById('popover-color-picker');
    const btnColorText = document.getElementById('btn-tool-text-color');
    const btnColorBg   = document.getElementById('btn-tool-bg-color');
    if (colorPopover && !colorPopover.classList.contains('hidden')) {
        if (!colorPopover.contains(e.target) && (!btnColorText || !btnColorText.contains(e.target)) && (!btnColorBg || !btnColorBg.contains(e.target))) {
            closeColorPickers();
        }
    }
});

window.addEventListener('resize', () => { closeColorPickers(); });

// Sincronización continua de inputs de color nativos
const setupColorInputs = () => {
    const textCol = document.getElementById('text-color-input');
    if (textCol && !textCol.dataset.boundColor) {
        textCol.dataset.boundColor = 'true';
        textCol.addEventListener('input', (e) => {
            window.EduContaTextEngine?.setTextColor(e.target.value);
            const ind = document.getElementById('indicator-text-color');
            if (ind) ind.style.backgroundColor = e.target.value;
        });
    }
    const bgCol = document.getElementById('bg-color-input');
    if (bgCol && !bgCol.dataset.boundColor) {
        bgCol.dataset.boundColor = 'true';
        bgCol.addEventListener('input', (e) => {
            window.EduContaTextEngine?.setHighlightColor(e.target.value);
            const ind = document.getElementById('indicator-bg-color');
            if (ind) ind.style.backgroundColor = e.target.value;
        });
    }
};
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupColorInputs);
} else {
    setupColorInputs();
}

// Prevenir pérdida de foco del editor al pulsar botones de la barra de herramientas (toolbar)
document.addEventListener('mousedown', (e) => {
    const btn = e.target.closest('.toolbar-btn, .ribbon-tab-btn, .educonta-glass-select-trigger');
    if (btn && !e.target.closest('input, textarea, select')) {
        if (window.EduContaTextEngine?.saveActiveSelection) {
            window.EduContaTextEngine.saveActiveSelection(true);
        }
        e.preventDefault();
    }
});

// Consolidar spans y tags pendientes al escribir texto real
document.addEventListener('input', (e) => {
    const target = e.target;
    if (target && target.isContentEditable) {
        const pendingElements = target.querySelectorAll('span[data-ec-pending="true"], span[data-ec-pending-color="true"], span[data-ec-pending-bg="true"], code[data-ec-pending-code="true"]');
        if (pendingElements && pendingElements.length > 0) {
            pendingElements.forEach(el => {
                const text = el.textContent;
                if (text && text !== '\u200B' && text.replace(/\u200B/g, '').length > 0) {
                    el.removeAttribute('data-ec-pending');
                    el.removeAttribute('data-ec-pending-color');
                    el.removeAttribute('data-ec-pending-bg');
                    el.removeAttribute('data-ec-pending-code');
                }
            });
        }
    }
}, true);

// Guardar selección y sincronizar toolbar en selectionchange
let _selChangeRaf = null;
document.addEventListener('selectionchange', () => {
    if (window.EduContaTextEngine?.saveActiveSelection) {
        window.EduContaTextEngine.saveActiveSelection();
    }

    // Limpieza de elementos pendientes que quedaron vacíos únicamente si el usuario
    // movió activamente el cursor a otra posición dentro del editor (abandonó el formato)
    // NO limpiar si hay un selector desplegado o previsualización activa
    if (window.EduContaTextEngine?._fontPreviewState || 
        window.EduContaTextEngine?._colorPreviewState || 
        window.EduContaGlassSelect?.hasOpenPopover?.()) {
        return;
    }

    const activeEditor = MultiPageEngine?.getActiveEditor?.();
    const sel = window.getSelection();
    if (activeEditor && sel && sel.anchorNode && activeEditor.contains(sel.anchorNode)) {
        const container = MultiPageEngine?.getContainer?.();
        if (container) {
            container.querySelectorAll('span[data-ec-pending="true"], span[data-ec-pending-color="true"], span[data-ec-pending-bg="true"], code[data-ec-pending-code="true"]').forEach(el => {
                if (!el.contains(sel.anchorNode)) {
                    if (el.textContent === '\u200B' || el.textContent.trim() === '') {
                        el.remove();
                    }
                }
            });
        }
    }

    if (_selChangeRaf) cancelAnimationFrame(_selChangeRaf);
    _selChangeRaf = requestAnimationFrame(() => {
        if (window.EduContaTextEngine?.updateToolbarState) {
            window.EduContaTextEngine.updateToolbarState();
        }
    });
});