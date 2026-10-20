/**
 * image-crop.js — ImageCropManager
 * Herramienta de recorte interactivo para imágenes con Canvas API.
 * Soporta proporciones fijas y libres.
 * EduConta SV — Módulo Documentos (Amber)
 */
import { TextDocStateManager } from './state.js';
import { MultiPageEngine }     from './engine.js';
import { DocStatsManager }     from './stats.js';
import { ImageLayerManager }   from './images.js';

const ImageCropManager = {
    overlayEl:   null,
    controlsEl:  null,
    _active:     false,
    _startX:     0,
    _startY:     0,
    _startRect:  null,
    _cropRect:   { x: 0, y: 0, w: 0, h: 0 },
    _imgRect:    null,
    _ratio:      null,       // null = libre, '1:1', '4:3', '16:9', '3:2'
    _dragType:   null,       // 'move' | 'nw' | 'ne' | 'sw' | 'se'
    _onMouseDown: null,
    _onMouseMove: null,
    _onMouseUp:   null,

    init() {
        this.overlayEl  = document.getElementById('image-crop-overlay');
        this.controlsEl = document.getElementById('crop-controls');
    },

    // ═══════════════════════════════════════════════════════════════════
    //  ABRIR / CERRAR MODO RECORTE
    // ═══════════════════════════════════════════════════════════════════

    openCropMode() {
        const img = ImageLayerManager.selectedImg;
        if (!img || !this.overlayEl) return;

        this._active = true;
        this._ratio  = null;

        // Posicionar overlay exactamente sobre la imagen
        const rect = img.getBoundingClientRect();
        this._imgRect = {
            top:    rect.top + window.scrollY,
            left:   rect.left + window.scrollX,
            width:  rect.width,
            height: rect.height
        };

        const o = this.overlayEl;
        o.style.display = 'block';
        o.style.top     = this._imgRect.top + 'px';
        o.style.left    = this._imgRect.left + 'px';
        o.style.width   = this._imgRect.width + 'px';
        o.style.height  = this._imgRect.height + 'px';

        // Área de recorte inicial = imagen completa con margen del 10%
        const mx = rect.width  * 0.1;
        const my = rect.height * 0.1;
        this._cropRect = {
            x: mx,
            y: my,
            w: rect.width  - mx * 2,
            h: rect.height - my * 2
        };
        this._renderCropArea();

        // Mostrar controles
        if (this.controlsEl) this.controlsEl.style.display = 'flex';

        // Resaltar botón de proporción libre
        this._highlightRatioBtn(null);

        // Vincular eventos
        this._onMouseDown = this._handleMouseDown.bind(this);
        this._onMouseMove = this._handleMouseMove.bind(this);
        this._onMouseUp   = this._handleMouseUp.bind(this);
        o.addEventListener('pointerdown', this._onMouseDown);
        document.addEventListener('pointermove', this._onMouseMove);
        document.addEventListener('pointerup',   this._onMouseUp);

        // Ocultar toolbar de imagen temporalmente
        const toolbar = document.getElementById('image-floating-toolbar');
        if (toolbar) toolbar.style.display = 'none';

        TextDocStateManager.showToast('Modo recorte activado');
    },

    closeCropMode() {
        this._active   = false;
        this._dragType = null;

        if (this.overlayEl) {
            this.overlayEl.style.display = 'none';
            this.overlayEl.removeEventListener('pointerdown', this._onMouseDown);
        }
        document.removeEventListener('pointermove', this._onMouseMove);
        document.removeEventListener('pointerup',   this._onMouseUp);

        if (this.controlsEl) this.controlsEl.style.display = 'none';

        // Restaurar toolbar
        ImageLayerManager.showToolbar();
    },

    // ═══════════════════════════════════════════════════════════════════
    //  PROPORCIÓN DE ASPECTO
    // ═══════════════════════════════════════════════════════════════════

    setAspectRatio(ratio) {
        this._ratio = ratio;   // null | '1:1' | '4:3' | '16:9' | '3:2'
        this._highlightRatioBtn(ratio);

        if (ratio && this._active) {
            const [rw, rh] = ratio.split(':').map(Number);
            const ar = rw / rh;
            const maxW = parseFloat(this.overlayEl.style.width);
            const maxH = parseFloat(this.overlayEl.style.height);
            const r = this._cropRect;

            // Ajustar alto en función del ancho actual
            let newH = r.w / ar;
            if (r.y + newH > maxH) {
                newH = maxH - r.y;
                r.w  = newH * ar;
            }
            r.h = newH;

            // Asegurar que no exceda límites
            if (r.x + r.w > maxW) { r.w = maxW - r.x; r.h = r.w / ar; }

            this._renderCropArea();
        }
    },

    _highlightRatioBtn(ratio) {
        if (!this.controlsEl) return;
        this.controlsEl.querySelectorAll('.crop-ratio-btn').forEach(btn => {
            const val = btn.dataset.ratio || null;
            btn.classList.toggle('ec-crop-ratio-active', val === ratio);
        });
    },

    // ═══════════════════════════════════════════════════════════════════
    //  APLICAR RECORTE (Canvas API)
    // ═══════════════════════════════════════════════════════════════════

    applyCrop() {
        const img = ImageLayerManager.selectedImg;
        if (!img || !this._active) return;

        const displayW = parseFloat(this.overlayEl.style.width);
        const displayH = parseFloat(this.overlayEl.style.height);

        // Escala entre píxeles naturales y píxeles renderizados
        const scaleX = img.naturalWidth  / displayW;
        const scaleY = img.naturalHeight / displayH;

        const cr = this._cropRect;
        const sx = Math.round(cr.x * scaleX);
        const sy = Math.round(cr.y * scaleY);
        const sw = Math.round(cr.w * scaleX);
        const sh = Math.round(cr.h * scaleY);

        if (sw < 1 || sh < 1) {
            TextDocStateManager.showToast('Área de recorte demasiado pequeña');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width  = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d');

        // Intentar dibujar directamente (funciona con data: URIs y same-origin)
        const doCrop = (source) => {
            try {
                ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
                img.src = canvas.toDataURL('image/png');
                TextDocStateManager.pushHistory();
                DocStatsManager.update();
                TextDocStateManager.triggerAutoSave();
                MultiPageEngine.debouncePaginate();
                TextDocStateManager.showToast('Imagen recortada');
            } catch (e) {
                TextDocStateManager.showToast('Error al recortar (CORS)');
            }
            this.closeCropMode();
        };

        // Si es data URI o blob, dibujar directo
        if (img.src.startsWith('data:') || img.src.startsWith('blob:')) {
            doCrop(img);
        } else {
            // Para URLs externas, cargar con crossOrigin
            const tmpImg = new Image();
            tmpImg.crossOrigin = 'anonymous';
            tmpImg.onload  = () => doCrop(tmpImg);
            tmpImg.onerror = () => {
                // Fallback: intentar directamente (puede fallar por CORS tainted canvas)
                try { doCrop(img); } catch { TextDocStateManager.showToast('No se pudo recortar'); this.closeCropMode(); }
            };
            tmpImg.src = img.src;
        }
    },

    // ═══════════════════════════════════════════════════════════════════
    //  RENDERIZADO DEL ÁREA DE RECORTE
    // ═══════════════════════════════════════════════════════════════════

    _renderCropArea() {
        const sel = this.overlayEl?.querySelector('.crop-selection');
        if (!sel) return;

        const r  = this._cropRect;
        sel.style.left   = r.x + 'px';
        sel.style.top    = r.y + 'px';
        sel.style.width  = r.w + 'px';
        sel.style.height = r.h + 'px';

        // Actualizar máscaras de oscurecimiento (4 divs alrededor de la selección)
        const oW = parseFloat(this.overlayEl.style.width);
        const oH = parseFloat(this.overlayEl.style.height);

        const top    = this.overlayEl.querySelector('.crop-mask-top');
        const bottom = this.overlayEl.querySelector('.crop-mask-bottom');
        const left   = this.overlayEl.querySelector('.crop-mask-left');
        const right  = this.overlayEl.querySelector('.crop-mask-right');

        if (top) {
            top.style.left   = '0'; top.style.top = '0';
            top.style.width  = oW + 'px'; top.style.height = r.y + 'px';
        }
        if (bottom) {
            bottom.style.left   = '0'; bottom.style.top = (r.y + r.h) + 'px';
            bottom.style.width  = oW + 'px'; bottom.style.height = (oH - r.y - r.h) + 'px';
        }
        if (left) {
            left.style.left   = '0'; left.style.top = r.y + 'px';
            left.style.width  = r.x + 'px'; left.style.height = r.h + 'px';
        }
        if (right) {
            right.style.left   = (r.x + r.w) + 'px'; right.style.top = r.y + 'px';
            right.style.width  = (oW - r.x - r.w) + 'px'; right.style.height = r.h + 'px';
        }

        // Grid de tercios dentro de la selección
        const grid = sel.querySelector('.crop-grid');
        if (grid) grid.style.display = this._dragType ? 'block' : 'none';
    },

    // ═══════════════════════════════════════════════════════════════════
    //  EVENTOS DE RATÓN / PUNTERO
    // ═══════════════════════════════════════════════════════════════════

    _handleMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();

        this._startX    = e.clientX;
        this._startY    = e.clientY;
        this._startRect = { ...this._cropRect };

        const target = e.target;

        if (target.classList.contains('crop-handle')) {
            this._dragType = target.dataset.handle;
        } else if (target.closest('.crop-selection')) {
            this._dragType = 'move';
            this.overlayEl.style.cursor = 'grabbing';
        } else {
            // Clic fuera del área — iniciar nueva selección
            const oRect = this.overlayEl.getBoundingClientRect();
            this._cropRect = {
                x: e.clientX - oRect.left,
                y: e.clientY - oRect.top,
                w: 0,
                h: 0
            };
            this._startRect = { ...this._cropRect };
            this._dragType = 'se';
        }
    },

    _handleMouseMove(e) {
        if (!this._dragType || !this._active) return;
        e.preventDefault();

        const dx   = e.clientX - this._startX;
        const dy   = e.clientY - this._startY;
        const s    = this._startRect;
        const maxW = parseFloat(this.overlayEl.style.width);
        const maxH = parseFloat(this.overlayEl.style.height);

        const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

        if (this._dragType === 'move') {
            this._cropRect.x = clamp(s.x + dx, 0, maxW - s.w);
            this._cropRect.y = clamp(s.y + dy, 0, maxH - s.h);
        } else {
            let { x, y, w, h } = { ...s };

            // Redimensionar según el handle
            if (this._dragType.includes('e')) w = clamp(s.w + dx, 20, maxW - s.x);
            if (this._dragType.includes('w')) { x = clamp(s.x + dx, 0, s.x + s.w - 20); w = s.w - (x - s.x); }
            if (this._dragType.includes('s')) h = clamp(s.h + dy, 20, maxH - s.y);
            if (this._dragType.includes('n')) { y = clamp(s.y + dy, 0, s.y + s.h - 20); h = s.h - (y - s.y); }

            // Restricción de proporción
            if (this._ratio) {
                const [rw, rh] = this._ratio.split(':').map(Number);
                const ar = rw / rh;
                if (this._dragType.includes('e') || this._dragType.includes('w')) {
                    h = w / ar;
                    if (y + h > maxH) { h = maxH - y; w = h * ar; }
                } else {
                    w = h * ar;
                    if (x + w > maxW) { w = maxW - x; h = w / ar; }
                }
            }

            this._cropRect = { x, y, w: Math.max(w, 4), h: Math.max(h, 4) };
        }

        this._renderCropArea();
    },

    _handleMouseUp() {
        if (this._dragType === 'move') {
            this.overlayEl.style.cursor = '';
        }
        this._dragType = null;

        // Mostrar grid solo durante drag
        const grid = this.overlayEl?.querySelector('.crop-grid');
        if (grid) grid.style.display = 'none';
    }
};

export { ImageCropManager };
