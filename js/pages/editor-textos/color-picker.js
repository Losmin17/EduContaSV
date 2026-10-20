/**
 * color-picker.js — Utilidades del color picker glassmorphic flotante
 * initColorPresetsGrid, toggleColorPickerPopover, applyPaletteColor, etc.
 * EduConta SV
 */
import { EDUCONTA_COLOR_PRESETS } from './constants.js';

let activeColorPickerType = null; // 'text' | 'bg'

function initColorPresetsGrid() {
    const grid = document.getElementById('color-presets-grid');
    if (!grid) return;
    // DT-2: Guarda de reentrancia — evita reconstruir la paleta si ya está poblada
    if (grid.children.length > 0) return;
    grid.innerHTML = EDUCONTA_COLOR_PRESETS.map(hex => `
        <button type="button"
            onmouseenter="previewPaletteColor('${hex}')"
            onclick="applyPaletteColor('${hex}')"
            class="w-6 h-6 rounded-lg border border-slate-300/70 dark:border-slate-700 hover:scale-110 hover:shadow-md transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
            style="background-color: ${hex};"
            title="${hex}">
        </button>
    `).join('');

    grid.addEventListener('mouseleave', () => {
        cancelPaletteColorPreview();
    });
}

function previewPaletteColor(color) {
    if (!window.EduContaTextEngine || !activeColorPickerType) return;
    window.EduContaTextEngine.previewColor(color, activeColorPickerType);
}

function cancelPaletteColorPreview() {
    if (!window.EduContaTextEngine) return;
    window.EduContaTextEngine.cancelColorPreview();
}

function positionPopoverBelow(popover, triggerEl, preferredAlign = 'left') {
    if (!popover || !triggerEl) return;
    if (popover.parentElement !== document.body) {
        document.body.appendChild(popover);
    }
    const rect = triggerEl.getBoundingClientRect();
    const popoverWidth = popover.offsetWidth || 280;
    const top = rect.bottom + 6;
    let left;

    if (preferredAlign === 'center') {
        left = rect.left + (rect.width / 2) - (popoverWidth / 2);
    } else if (preferredAlign === 'right') {
        left = rect.right - popoverWidth;
    } else {
        left = rect.left;
    }

    const maxLeft = window.innerWidth - popoverWidth - 12;
    left = Math.max(12, Math.min(left, maxLeft));

    popover.style.position = 'fixed';
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.style.zIndex = '999999';
}

function toggleColorPickerPopover(type, event) {
    if (event) event.stopPropagation();
    const popover = document.getElementById('popover-color-picker');
    if (!popover) return;

    if (popover.parentElement !== document.body) {
        document.body.appendChild(popover);
    }

    if (!popover.classList.contains('hidden') && activeColorPickerType === type) {
        closeColorPickers();
        return;
    }

    if (window.EduContaTextEngine?.saveActiveSelection) {
        window.EduContaTextEngine.saveActiveSelection(true);
    }
    activeColorPickerType = type;

    const titleEl = document.getElementById('color-picker-title');
    if (titleEl) titleEl.textContent = type === 'text' ? 'Color de Texto' : 'Color de Relleno / Fondo';

    initColorPresetsGrid();
    switchToPresetsColorView(false);

    const triggerBtn = document.getElementById(type === 'text' ? 'btn-tool-text-color' : 'btn-tool-bg-color');
    positionPopoverBelow(popover, triggerBtn, 'left');

    popover.classList.remove('hidden');
    requestAnimationFrame(() => {
        popover.classList.remove('opacity-0', 'scale-95');
        popover.classList.add('opacity-100', 'scale-100');
    });
}

function closeColorPickers() {
    const popover = document.getElementById('popover-color-picker');
    if (!popover || popover.classList.contains('hidden')) return;

    if (window.EduContaTextEngine?.hasActiveColorPreview?.()) {
        window.EduContaTextEngine.cancelColorPreview();
    }

    popover.classList.remove('opacity-100', 'scale-100');
    popover.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        popover.classList.add('hidden');
        activeColorPickerType = null;
    }, 150);
}

function applyPaletteColor(color) {
    if (!window.EduContaTextEngine || !activeColorPickerType) return;
    const type = activeColorPickerType;
    window.EduContaTextEngine.commitColorPreview(color, type);
    closeColorPickers();
}

async function pickColorWithEyedropper() {
    if (!('EyeDropper' in window)) {
        if (typeof window.showAlert === 'function') {
            window.showAlert('Cuentagotas no disponible', 'Tu navegador actual no soporta la herramienta nativa de Cuentagotas (EyeDropper API). Puedes seleccionar el color usando la paleta 2D o ingresando el código HEX.');
        } else {
            alert('Tu navegador no soporta la herramienta Cuentagotas nativa.');
        }
        return;
    }

    try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
            const hex = result.sRGBHex.toUpperCase();
            currentCustomHsv = hexToHsv(hex);
            switchToCustomColorView(false);
            updateCustomColorUI();

            if (window.EduContaTextEngine && activeColorPickerType) {
                window.EduContaTextEngine.restoreActiveSelection();
                if (activeColorPickerType === 'text') {
                    window.EduContaTextEngine.setTextColor(hex);
                    const ind = document.getElementById('indicator-text-color');
                    if (ind) ind.style.backgroundColor = hex;
                } else {
                    const sel = window.getSelection();
                    let node = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
                    const activeCell = node ? node.closest('td, th') : null;
                    if (activeCell && (!sel || sel.isCollapsed)) {
                        activeCell.style.backgroundColor = hex;
                        window.TextDocStateManager?.pushHistory();
                        window.TextDocStateManager?.triggerAutoSave();
                    } else {
                        window.EduContaTextEngine.setHighlightColor(hex);
                    }
                    const ind = document.getElementById('indicator-bg-color');
                    if (ind) ind.style.backgroundColor = hex;
                }
            }
        }
    } catch (err) {
        console.log('Cuentagotas cancelado o no completado:', err);
    }
}

let currentCustomHsv = { h: 38, s: 0.93, v: 0.96 }; // #F59E0B por defecto
let isDraggingSatVal = false;
let isDraggingHue = false;

function hsvToRgb(h, s, v) {
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h / 60) % 6;
    const f = (h / 60) - Math.floor(h / 60);
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = Math.max(0, Math.min(255, x)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
}

function hexToHsv(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return { h: 38, s: 0.93, v: 0.96 };
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0;
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.max(0, Math.min(1, s)), v: Math.max(0, Math.min(1, v)) };
}

function switchToCustomColorView(resetFromSelection = true) {
    const presetsView = document.getElementById('color-picker-presets-view');
    const customView = document.getElementById('color-picker-custom-view');
    const track = document.getElementById('color-picker-slider-track');
    if (!presetsView || !customView) return;

    if (resetFromSelection) {
        try {
            const sel = window.getSelection();
            let node = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
            if (node) {
                const comp = window.getComputedStyle(node);
                const currentColor = activeColorPickerType === 'text' ? comp.color : comp.backgroundColor;
                if (currentColor && currentColor !== 'transparent' && currentColor !== 'rgba(0, 0, 0, 0)') {
                    const rgbMatch = currentColor.match(/\d+/g);
                    if (rgbMatch && rgbMatch.length >= 3) {
                        const hex = rgbToHex(parseInt(rgbMatch[0]), parseInt(rgbMatch[1]), parseInt(rgbMatch[2]));
                        currentCustomHsv = hexToHsv(hex);
                    }
                }
            }
        } catch (_) {}
    }

    if (window.EduContaTextEngine && activeColorPickerType) {
        window.EduContaTextEngine.beginColorPreview(activeColorPickerType);
    }

    initCustomColorPickerEvents();
    updateCustomColorUI();

    presetsView.style.position = 'absolute';
    presetsView.style.top = '0';
    presetsView.style.left = '0';
    presetsView.style.transform = 'translateX(-100%)';
    presetsView.style.opacity = '0';
    presetsView.style.pointerEvents = 'none';

    customView.style.position = 'relative';
    customView.style.top = 'auto';
    customView.style.left = 'auto';
    customView.style.transform = 'translateX(0%)';
    customView.style.opacity = '1';
    customView.style.pointerEvents = 'auto';

    if (track) track.style.height = '';
}

function switchToPresetsColorView(cancelPreview = true) {
    if (cancelPreview && window.EduContaTextEngine?.hasActiveColorPreview?.()) {
        window.EduContaTextEngine.cancelColorPreview();
    }

    const presetsView = document.getElementById('color-picker-presets-view');
    const customView = document.getElementById('color-picker-custom-view');
    const track = document.getElementById('color-picker-slider-track');
    if (!presetsView || !customView) return;

    customView.style.position = 'absolute';
    customView.style.top = '0';
    customView.style.left = '0';
    customView.style.transform = 'translateX(100%)';
    customView.style.opacity = '0';
    customView.style.pointerEvents = 'none';

    presetsView.style.position = 'relative';
    presetsView.style.top = 'auto';
    presetsView.style.left = 'auto';
    presetsView.style.transform = 'translateX(0%)';
    presetsView.style.opacity = '1';
    presetsView.style.pointerEvents = 'auto';

    if (track) track.style.height = '';
}

function updateCustomColorUI() {
    const rgb = hsvToRgb(currentCustomHsv.h, currentCustomHsv.s, currentCustomHsv.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    const satValBox = document.getElementById('custom-color-satval-box');
    const satValCursor = document.getElementById('custom-color-satval-cursor');
    const hueCursor = document.getElementById('custom-color-hue-cursor');
    const previewSwatch = document.getElementById('custom-color-preview-swatch');
    const hexInput = document.getElementById('custom-color-hex-input');
    const rInput = document.getElementById('custom-color-r-input');
    const gInput = document.getElementById('custom-color-g-input');
    const bInput = document.getElementById('custom-color-b-input');

    if (satValBox) satValBox.style.backgroundColor = `hsl(${currentCustomHsv.h}, 100%, 50%)`;
    if (satValCursor) {
        satValCursor.style.left = `${currentCustomHsv.s * 100}%`;
        satValCursor.style.top = `${(1 - currentCustomHsv.v) * 100}%`;
    }
    if (hueCursor) hueCursor.style.left = `${(currentCustomHsv.h / 360) * 100}%`;
    if (previewSwatch) previewSwatch.style.backgroundColor = hex;
    if (hexInput && document.activeElement !== hexInput) hexInput.value = hex;
    if (rInput && document.activeElement !== rInput) rInput.value = rgb.r;
    if (gInput && document.activeElement !== gInput) gInput.value = rgb.g;
    if (bInput && document.activeElement !== bInput) bInput.value = rgb.b;
}

let customColorEventsInitialized = false;

function initCustomColorPickerEvents() {
    if (customColorEventsInitialized) return;
    customColorEventsInitialized = true;

    const satValBox = document.getElementById('custom-color-satval-box');
    const hueBar = document.getElementById('custom-color-hue-bar');

    const handleSatValMove = (e) => {
        if (!isDraggingSatVal || !satValBox) return;
        const rect = satValBox.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
        currentCustomHsv.s = x / rect.width;
        currentCustomHsv.v = 1 - (y / rect.height);
        updateCustomColorUI();
        livePreviewCustomColor();
    };

    const handleHueMove = (e) => {
        if (!isDraggingHue || !hueBar) return;
        const rect = hueBar.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        currentCustomHsv.h = (x / rect.width) * 360;
        updateCustomColorUI();
        livePreviewCustomColor();
    };

    if (satValBox) {
        satValBox.addEventListener('mousedown', (e) => { isDraggingSatVal = true; handleSatValMove(e); });
        satValBox.addEventListener('touchstart', (e) => { isDraggingSatVal = true; handleSatValMove(e); }, { passive: true });
    }

    if (hueBar) {
        hueBar.addEventListener('mousedown', (e) => { isDraggingHue = true; handleHueMove(e); });
        hueBar.addEventListener('touchstart', (e) => { isDraggingHue = true; handleHueMove(e); }, { passive: true });
    }

    document.addEventListener('mousemove', (e) => {
        if (isDraggingSatVal) handleSatValMove(e);
        if (isDraggingHue) handleHueMove(e);
    });
    document.addEventListener('touchmove', (e) => {
        if (isDraggingSatVal) handleSatValMove(e);
        if (isDraggingHue) handleHueMove(e);
    }, { passive: true });
    document.addEventListener('mouseup', () => { isDraggingSatVal = false; isDraggingHue = false; });
    document.addEventListener('touchend', () => { isDraggingSatVal = false; isDraggingHue = false; });
}

function livePreviewCustomColor() {
    if (!window.EduContaTextEngine || !activeColorPickerType) return;
    const rgb = hsvToRgb(currentCustomHsv.h, currentCustomHsv.s, currentCustomHsv.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    window.EduContaTextEngine.previewColor(hex, activeColorPickerType);
}

function onHexInputChange(val) {
    let clean = val.trim();
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (/^#[0-9A-F]{6}$/i.test(clean) || /^#[0-9A-F]{3}$/i.test(clean)) {
        currentCustomHsv = hexToHsv(clean);
        updateCustomColorUI();
        livePreviewCustomColor();
    }
}

function onRgbInputChange() {
    const rInput = document.getElementById('custom-color-r-input');
    const gInput = document.getElementById('custom-color-g-input');
    const bInput = document.getElementById('custom-color-b-input');
    const r = parseInt(rInput ? rInput.value : 0, 10) || 0;
    const g = parseInt(gInput ? gInput.value : 0, 10) || 0;
    const b = parseInt(bInput ? bInput.value : 0, 10) || 0;
    const hex = rgbToHex(r, g, b);
    currentCustomHsv = hexToHsv(hex);
    updateCustomColorUI();
    livePreviewCustomColor();
}

function applyCustomInteractiveColor() {
    const rgb = hsvToRgb(currentCustomHsv.h, currentCustomHsv.s, currentCustomHsv.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    applyPaletteColor(hex);
    switchToPresetsColorView(false);
}

export {
    initColorPresetsGrid,
    positionPopoverBelow,
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
};