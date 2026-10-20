/**
 * image-editor.js — ImageEditorManager
 * Edición avanzada de fotos: rotar, voltear, filtros CSS,
 * bordes, sombras, formas, alt text, caption y tamaño personalizado.
 * EduConta SV — Módulo Documentos (Amber)
 */
import { TextDocStateManager } from './state.js';
import { MultiPageEngine } from './engine.js';
import { DocStatsManager } from './stats.js';
import { ImageLayerManager } from './images.js';

// ─── Defaults & Presets ─────────────────────────────────────────────────
const FILTER_DEFAULTS = {
    brightness: 100, contrast: 100, saturate: 100,
    hueRotate: 0, blur: 0, grayscale: 0, sepia: 0
};

const PRESETS = {
    original:  { brightness: 100, contrast: 100, saturate: 100, hueRotate: 0,   blur: 0, grayscale: 0,   sepia: 0  },
    vivid:     { brightness: 110, contrast: 120, saturate: 150, hueRotate: 0,   blur: 0, grayscale: 0,   sepia: 0  },
    bw:        { brightness: 100, contrast: 110, saturate: 0,   hueRotate: 0,   blur: 0, grayscale: 100, sepia: 0  },
    sepia:     { brightness: 105, contrast: 90,  saturate: 100, hueRotate: 0,   blur: 0, grayscale: 0,   sepia: 80 },
    cold:      { brightness: 110, contrast: 100, saturate: 70,  hueRotate: 180, blur: 0, grayscale: 0,   sepia: 0  },
    dramatic:  { brightness: 90,  contrast: 150, saturate: 130, hueRotate: 0,   blur: 0, grayscale: 0,   sepia: 0  },
    warm:      { brightness: 105, contrast: 105, saturate: 120, hueRotate: 15,  blur: 0, grayscale: 0,   sepia: 20 },
    soft:      { brightness: 110, contrast: 90,  saturate: 80,  hueRotate: 0,   blur: 1, grayscale: 0,   sepia: 0  },
};

const SHAPES = {
    none:     '',
    circle:   'circle(50%)',
    rounded:  'inset(0 round 20px)',
    pill:     'inset(0 round 50%)',
    diamond:  'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    pentagon: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
    hexagon:  'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    star:     'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
};

// ─── Manager ────────────────────────────────────────────────────────────
const ImageEditorManager = {
    panelEl: null,
    _isReplaceMode: false,

    /** Shortcut al img seleccionado del LayerManager */
    get img() {
        return ImageLayerManager.selectedImg;
    },

    init() {
        this.panelEl = document.getElementById('image-editor-panel');
    },

    // ═══════════════════════════════════════════════════════════════════
    //  TRANSFORMACIONES
    // ═══════════════════════════════════════════════════════════════════

    rotateImage(deg) {
        if (!this.img) return;
        const current = parseInt(this.img.dataset.ecRotation || '0', 10);
        const next = ((current + deg) % 360 + 360) % 360;
        this.img.dataset.ecRotation = next;
        this._applyTransform();
        this._save('Rotar ' + deg + '°');
    },

    flipImage(axis) {
        if (!this.img) return;
        const key = axis === 'horizontal' ? 'ecFlipH' : 'ecFlipV';
        this.img.dataset[key] = this.img.dataset[key] === '-1' ? '1' : '-1';
        this._applyTransform();
        this._save('Voltear ' + (axis === 'horizontal' ? 'horizontal' : 'vertical'));
    },

    _applyTransform() {
        if (!this.img) return;
        const rot = this.img.dataset.ecRotation || '0';
        const fh  = this.img.dataset.ecFlipH || '1';
        const fv  = this.img.dataset.ecFlipV || '1';
        this.img.style.transform = `rotate(${rot}deg) scaleX(${fh}) scaleY(${fv})`;
    },

    // ═══════════════════════════════════════════════════════════════════
    //  FILTROS CSS
    // ═══════════════════════════════════════════════════════════════════

    setFilter(name, value) {
        if (!this.img) return;
        const key = 'ecF' + name.charAt(0).toUpperCase() + name.slice(1);
        this.img.dataset[key] = value;
        this._applyFilters();
        this._updateSliderDisplay(name, value);
        this._save();
    },

    _applyFilters() {
        if (!this.img) return;
        const d = this.img.dataset;
        const vals = {
            brightness: d.ecFBrightness || 100,
            contrast:   d.ecFContrast   || 100,
            saturate:   d.ecFSaturate   || 100,
            hueRotate:  d.ecFHueRotate  || 0,
            blur:       d.ecFBlur       || 0,
            grayscale:  d.ecFGrayscale  || 0,
            sepia:      d.ecFSepia      || 0,
        };

        const parts = [];
        if (vals.brightness != 100) parts.push(`brightness(${vals.brightness / 100})`);
        if (vals.contrast   != 100) parts.push(`contrast(${vals.contrast / 100})`);
        if (vals.saturate   != 100) parts.push(`saturate(${vals.saturate / 100})`);
        if (vals.hueRotate  != 0)   parts.push(`hue-rotate(${vals.hueRotate}deg)`);
        if (vals.blur       != 0)   parts.push(`blur(${vals.blur}px)`);
        if (vals.grayscale  != 0)   parts.push(`grayscale(${vals.grayscale / 100})`);
        if (vals.sepia      != 0)   parts.push(`sepia(${vals.sepia / 100})`);

        this.img.style.filter = parts.length ? parts.join(' ') : '';
    },

    applyPreset(name) {
        if (!this.img || !PRESETS[name]) return;
        const p = PRESETS[name];
        this.img.dataset.ecFBrightness = p.brightness;
        this.img.dataset.ecFContrast   = p.contrast;
        this.img.dataset.ecFSaturate   = p.saturate;
        this.img.dataset.ecFHueRotate  = p.hueRotate;
        this.img.dataset.ecFBlur       = p.blur;
        this.img.dataset.ecFGrayscale  = p.grayscale;
        this.img.dataset.ecFSepia      = p.sepia;
        this._applyFilters();
        this._syncPanelWithImage();
        this._save('Preset: ' + name);
    },

    resetFilters() {
        this.applyPreset('original');
    },

    // ═══════════════════════════════════════════════════════════════════
    //  OPACIDAD
    // ═══════════════════════════════════════════════════════════════════

    setOpacity(value) {
        if (!this.img) return;
        this.img.dataset.ecOpacity = value;
        this.img.style.opacity = value / 100;
        this._updateSliderDisplay('opacity', value);
        this._save();
    },

    // ═══════════════════════════════════════════════════════════════════
    //  BORDES
    // ═══════════════════════════════════════════════════════════════════

    setBorderWidth(px) {
        if (!this.img) return;
        this.img.dataset.ecBorderWidth = px;
        this._applyBorder();
    },
    setBorderColor(color) {
        if (!this.img) return;
        this.img.dataset.ecBorderColor = color;
        this._applyBorder();
    },
    setBorderStyle(style) {
        if (!this.img) return;
        this.img.dataset.ecBorderStyle = style;
        this._applyBorder();
    },
    setBorderRadius(px) {
        if (!this.img) return;
        this.img.dataset.ecBorderRadius = px;
        this._applyBorder();
        this._updateSliderDisplay('borderRadius', px);
    },

    _applyBorder() {
        if (!this.img) return;
        const w = parseInt(this.img.dataset.ecBorderWidth || '0', 10);
        const c = this.img.dataset.ecBorderColor || '#f59e0b';
        const s = this.img.dataset.ecBorderStyle || 'solid';
        const r = parseInt(this.img.dataset.ecBorderRadius || '0', 10);

        this.img.style.border = w > 0 ? `${w}px ${s} ${c}` : '';
        this.img.style.borderRadius = r > 0 ? `${r}px` : '';
        this._save();
    },

    // ═══════════════════════════════════════════════════════════════════
    //  SOMBRAS
    // ═══════════════════════════════════════════════════════════════════

    toggleShadow(on) {
        if (!this.img) return;
        this.img.dataset.ecShadowOn = on ? '1' : '0';
        this._applyShadow();
    },
    setShadowX(v)     { if (!this.img) return; this.img.dataset.ecShadowX = v; this._applyShadow(); },
    setShadowY(v)     { if (!this.img) return; this.img.dataset.ecShadowY = v; this._applyShadow(); },
    setShadowBlur(v)  { if (!this.img) return; this.img.dataset.ecShadowBlur = v; this._applyShadow(); },
    setShadowColor(c) { if (!this.img) return; this.img.dataset.ecShadowColor = c; this._applyShadow(); },

    _applyShadow() {
        if (!this.img) return;
        if (this.img.dataset.ecShadowOn !== '1') {
            this.img.style.boxShadow = '';
            this._save();
            return;
        }
        const x = this.img.dataset.ecShadowX    || '4';
        const y = this.img.dataset.ecShadowY    || '4';
        const b = this.img.dataset.ecShadowBlur  || '12';
        const c = this.img.dataset.ecShadowColor || 'rgba(0,0,0,0.35)';
        this.img.style.boxShadow = `${x}px ${y}px ${b}px ${c}`;
        this._save();
    },

    // ═══════════════════════════════════════════════════════════════════
    //  FORMAS / MÁSCARAS (clip-path)
    // ═══════════════════════════════════════════════════════════════════

    setShape(shape) {
        if (!this.img) return;
        this.img.dataset.ecShape = shape;
        this.img.style.clipPath = SHAPES[shape] || '';
        this._save('Forma: ' + shape);
    },

    // ═══════════════════════════════════════════════════════════════════
    //  TEXTO ALT (Accesibilidad)
    // ═══════════════════════════════════════════════════════════════════

    setAltText(text) {
        if (!this.img) return;
        this.img.alt = text;
        this._save();
    },

    // ═══════════════════════════════════════════════════════════════════
    //  CAPTION / PIE DE IMAGEN
    // ═══════════════════════════════════════════════════════════════════

    toggleCaption() {
        if (!this.img) return;
        const parent = this.img.parentElement;

        if (parent && parent.tagName === 'FIGURE') {
            // Quitar caption — desenvolver del <figure>
            const figcaption = parent.querySelector('figcaption');
            if (figcaption) figcaption.remove();
            parent.replaceWith(this.img);
        } else {
            // Agregar caption — envolver en <figure>
            const figure = document.createElement('figure');
            figure.style.textAlign = 'center';
            figure.style.margin = '12px 0';
            this.img.parentNode.insertBefore(figure, this.img);
            figure.appendChild(this.img);

            const caption = document.createElement('figcaption');
            caption.contentEditable = 'true';
            caption.className = 'text-xs text-slate-400 dark:text-slate-500 italic mt-1 outline-none text-center';
            caption.textContent = 'Pie de imagen…';
            caption.style.fontSize = '11px';
            figure.appendChild(caption);
        }
        this._save('Caption toggled');
        MultiPageEngine.debouncePaginate();
    },

    // ═══════════════════════════════════════════════════════════════════
    //  TAMAÑO PERSONALIZADO
    // ═══════════════════════════════════════════════════════════════════

    setCustomSize(value, unit) {
        if (!this.img || !value) return;
        this.img.style.width = `${value}${unit || 'px'}`;
        this.img.style.height = 'auto';
        ImageLayerManager.updateToolbarPosition();
        this._save();
    },

    // ═══════════════════════════════════════════════════════════════════
    //  DUPLICAR
    // ═══════════════════════════════════════════════════════════════════

    duplicateImage() {
        if (!this.img) return;
        const clone = this.img.cloneNode(true);
        clone.classList.remove('doc-img-selected');
        const ref = this.img.parentElement?.tagName === 'FIGURE'
            ? this.img.parentElement
            : this.img;
        ref.parentNode.insertBefore(clone, ref.nextSibling);
        this._save('Imagen duplicada');
    },

    // ═══════════════════════════════════════════════════════════════════
    //  REEMPLAZAR
    // ═══════════════════════════════════════════════════════════════════

    replaceImage() {
        if (!this.img) return;
        this._isReplaceMode = true;
        const modal = document.getElementById('image-modal');
        const title = modal?.querySelector('h4');
        if (title) title.textContent = 'Reemplazar Imagen';
        // Limpiar inputs previos
        const fi = document.getElementById('image-input-file');
        const ui = document.getElementById('image-input-url');
        if (fi) fi.value = '';
        if (ui) ui.value = '';
        if (modal) modal.style.display = 'flex';
    },

    confirmReplaceImage(newSrc) {
        if (!this.img || !newSrc) return;
        this.img.src = newSrc;
        this._isReplaceMode = false;
        const title = document.querySelector('#image-modal h4');
        if (title) title.textContent = 'Insertar Imagen';
        this._save('Imagen reemplazada');
    },

    // ═══════════════════════════════════════════════════════════════════
    //  RESTABLECER TODO
    // ═══════════════════════════════════════════════════════════════════

    resetAll() {
        if (!this.img) return;

        // Filtros
        Object.keys(FILTER_DEFAULTS).forEach(k => {
            const key = 'ecF' + k.charAt(0).toUpperCase() + k.slice(1);
            this.img.dataset[key] = FILTER_DEFAULTS[k];
        });
        this._applyFilters();

        // Transformaciones
        delete this.img.dataset.ecRotation;
        delete this.img.dataset.ecFlipH;
        delete this.img.dataset.ecFlipV;
        this.img.style.transform = '';

        // Opacidad
        this.img.dataset.ecOpacity = '100';
        this.img.style.opacity = '';

        // Borde
        delete this.img.dataset.ecBorderWidth;
        delete this.img.dataset.ecBorderColor;
        delete this.img.dataset.ecBorderStyle;
        this.img.dataset.ecBorderRadius = '0';
        this.img.style.border = '';
        this.img.style.borderRadius = '';

        // Sombra
        this.img.dataset.ecShadowOn = '0';
        this.img.style.boxShadow = '';

        // Forma
        delete this.img.dataset.ecShape;
        this.img.style.clipPath = '';

        this._syncPanelWithImage();
        this._save('Imagen restablecida');
    },

    // ═══════════════════════════════════════════════════════════════════
    //  PANEL LATERAL
    // ═══════════════════════════════════════════════════════════════════

    openEditorPanel() {
        if (window.isAuditMode) return;
        if (!this.img || !this.panelEl) return;
        this._syncPanelWithImage();
        this.panelEl.classList.add('ec-panel-open');
    },

    closeEditorPanel() {
        if (!this.panelEl) return;
        this.panelEl.classList.remove('ec-panel-open');
    },

    /** Lee el estado actual del <img> y sincroniza todos los controles del panel */
    _syncPanelWithImage() {
        if (!this.img || !this.panelEl) return;
        const d = this.img.dataset;

        // Filtros
        this._setSlider('brightness', d.ecFBrightness || 100);
        this._setSlider('contrast',   d.ecFContrast   || 100);
        this._setSlider('saturate',   d.ecFSaturate   || 100);
        this._setSlider('hueRotate',  d.ecFHueRotate  || 0);
        this._setSlider('blur',       d.ecFBlur       || 0);
        this._setSlider('grayscale',  d.ecFGrayscale  || 0);
        this._setSlider('sepia',      d.ecFSepia      || 0);
        this._setSlider('opacity',    d.ecOpacity     || 100);
        this._setSlider('borderRadius', d.ecBorderRadius || 0);

        // Inputs de borde
        const bw = this.panelEl.querySelector('#ec-border-width');
        const bc = this.panelEl.querySelector('#ec-border-color');
        const bs = this.panelEl.querySelector('#ec-border-style');
        if (bw) bw.value = d.ecBorderWidth || '0';
        if (bc) bc.value = d.ecBorderColor || '#f59e0b';
        if (bs) bs.value = d.ecBorderStyle || 'solid';

        // Sombra
        const st = this.panelEl.querySelector('#ec-shadow-toggle');
        if (st) st.checked = d.ecShadowOn === '1';
        const sx = this.panelEl.querySelector('#ec-shadow-x');
        const sy = this.panelEl.querySelector('#ec-shadow-y');
        const sb = this.panelEl.querySelector('#ec-shadow-blur-input');
        const sc = this.panelEl.querySelector('#ec-shadow-color');
        if (sx) sx.value = d.ecShadowX    || '4';
        if (sy) sy.value = d.ecShadowY    || '4';
        if (sb) sb.value = d.ecShadowBlur  || '12';
        if (sc) sc.value = d.ecShadowColor || '#000000';

        // Texto alt
        const at = this.panelEl.querySelector('#ec-alt-text');
        if (at) at.value = this.img.alt || '';

        // Tamaño custom
        const cw = this.panelEl.querySelector('#ec-custom-width');
        if (cw) {
            const w = parseInt(this.img.style.width, 10);
            cw.value = isNaN(w) ? '' : w;
        }

        // Marcar forma activa
        this.panelEl.querySelectorAll('.ec-shape-btn').forEach(btn => {
            btn.classList.toggle('ec-shape-active', btn.dataset.shape === (d.ecShape || 'none'));
        });

        // Marcar preset activo
        this.panelEl.querySelectorAll('.ec-preset-btn').forEach(btn => {
            const p = PRESETS[btn.dataset.preset];
            if (!p) return;
            const isActive = Object.entries(p).every(([k, v]) => {
                const key = 'ecF' + k.charAt(0).toUpperCase() + k.slice(1);
                return (d[key] || FILTER_DEFAULTS[k]) == v;
            });
            btn.classList.toggle('ec-preset-active', isActive);
        });
    },

    _setSlider(name, value) {
        const slider = this.panelEl?.querySelector(`#ec-slider-${name}`);
        if (slider) slider.value = value;
        this._updateSliderDisplay(name, value);
    },

    _updateSliderDisplay(name, value) {
        const display = this.panelEl?.querySelector(`#ec-val-${name}`);
        if (!display) return;
        const suffixes = { hueRotate: '°', blur: 'px', borderRadius: 'px' };
        display.textContent = value + (suffixes[name] || '%');
    },

    // ═══════════════════════════════════════════════════════════════════
    //  HELPER — guardar estado
    // ═══════════════════════════════════════════════════════════════════

    _save(msg) {
        TextDocStateManager.pushHistory();
        DocStatsManager.update();
        TextDocStateManager.triggerAutoSave();
        MultiPageEngine.debouncePaginate();
        ImageLayerManager.updateToolbarPosition();
        if (msg) TextDocStateManager.showToast(msg);
    }
};

export { ImageEditorManager };
