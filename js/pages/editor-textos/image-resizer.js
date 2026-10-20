/**
 * image-resizer.js — ImageResizeManager
 * Motor 2D de redimensionamiento fluido y de alta precisión para imágenes.
 * EduConta SV — Módulo Documentos (Ámbar)
 * 
 * Características:
 * - Render loop sincronizado con requestAnimationFrame (60/120 Hz, cero layout thrashing).
 * - Pointer Capture para prevenir pérdida de cursor en movimientos veloces.
 * - 8 tiradores interactivos (4 esquinas con aspect ratio y 4 laterales independientes).
 * - Indicador flotante HUD de dimensiones en tiempo real (píxeles y porcentaje).
 * - Soporte para relación de aspecto proporcional por defecto y libre manteniendo Shift.
 */
import { TextDocStateManager } from './state.js';
import { MultiPageEngine } from './engine.js';
import { DocStatsManager } from './stats.js';

export const ImageResizeManager = {
    containerEl: null,
    hudEl: null,
    targetImg: null,
    isDragging: false,
    _dragData: null,
    _rafId: null,

    init() {
        this.containerEl = document.getElementById('image-resize-handles');
        if (!this.containerEl) {
            this.containerEl = document.createElement('div');
            this.containerEl.id = 'image-resize-handles';
            this.containerEl.className = 'no-print';
            document.body.appendChild(this.containerEl);
        }

        // Crear o enlazar el badge HUD de medidas
        this.hudEl = document.getElementById('image-resize-hud');
        if (!this.hudEl) {
            this.hudEl = document.createElement('div');
            this.hudEl.id = 'image-resize-hud';
            this.hudEl.className = 'no-print';
            this.containerEl.appendChild(this.hudEl);
        }

        // Asegurar la presencia de los 8 tiradores (4 esquinas + 4 puntos medios)
        const dirs = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
        dirs.forEach(dir => {
            let handle = this.containerEl.querySelector(`.img-resize-handle[data-dir="${dir}"]`);
            if (!handle) {
                handle = document.createElement('div');
                handle.className = 'img-resize-handle';
                handle.dataset.dir = dir;
                this.containerEl.appendChild(handle);
            }
            this._bindHandleEvents(handle, dir);
        });

        // Sincronizar posición de las asas al redimensionar la ventana o hacer scroll
        window.addEventListener('resize', () => this.update(), { passive: true });
        document.querySelector('.editor-scroll-area')?.addEventListener('scroll', () => this.update(), { passive: true });
    },

    _bindHandleEvents(handle, dir) {
        handle.addEventListener('pointerdown', (e) => {
            if (window.isAuditMode || !this.targetImg) return;
            e.preventDefault();
            e.stopPropagation();

            try {
                handle.setPointerCapture(e.pointerId);
            } catch (_) {}

            const rect = this.targetImg.getBoundingClientRect();
            const surface = this.targetImg.closest('.page-editor-surface');
            const surfaceRect = surface ? surface.getBoundingClientRect() : { width: 800 };
            const isFree = this.targetImg.classList.contains('doc-img-behind') || this.targetImg.classList.contains('doc-img-front');

            this.isDragging = true;
            this._dragData = {
                handle,
                pointerId: e.pointerId,
                dir,
                startX: e.clientX,
                startY: e.clientY,
                startW: rect.width,
                startH: rect.height,
                aspect: rect.width / (rect.height || 1),
                isFree,
                startLeft: parseFloat(this.targetImg.style.left) || 0,
                startTop: parseFloat(this.targetImg.style.top) || 0,
                pageContentWidth: surfaceRect.width ? Math.max(300, surfaceRect.width - 96) : 700
            };

            this.targetImg.classList.add('doc-img-resizing');
            this.containerEl.classList.add('is-resizing');
            this.showHud(rect.width, rect.height);

            const onPointerMove = (evt) => {
                if (!this.isDragging || !this._dragData) return;
                evt.preventDefault();

                if (this._rafId) cancelAnimationFrame(this._rafId);
                this._rafId = requestAnimationFrame(() => {
                    this._processResizeMove(evt);
                });
            };

            const onPointerUp = (evt) => {
                try {
                    handle.releasePointerCapture(evt.pointerId);
                } catch (_) {}

                handle.removeEventListener('pointermove', onPointerMove);
                handle.removeEventListener('pointerup', onPointerUp);
                handle.removeEventListener('pointercancel', onPointerUp);

                if (this._rafId) {
                    cancelAnimationFrame(this._rafId);
                    this._rafId = null;
                }

                if (this.isDragging) {
                    this.isDragging = false;
                    this.targetImg?.classList.remove('doc-img-resizing');
                    this.containerEl?.classList.remove('is-resizing');
                    this.hideHud();
                    this.update();

                    // Sincronizar barra flotante y persistir cambios
                    if (window.ImageLayerManager) {
                        window.ImageLayerManager.updateToolbarPosition();
                    }

                    TextDocStateManager.pushHistory();
                    DocStatsManager.update();
                    TextDocStateManager.triggerAutoSave();
                    MultiPageEngine.debouncePaginate();
                }
                this._dragData = null;
            };

            handle.addEventListener('pointermove', onPointerMove);
            handle.addEventListener('pointerup', onPointerUp);
            handle.addEventListener('pointercancel', onPointerUp);
        });
    },

    _processResizeMove(e) {
        if (!this.targetImg || !this._dragData) return;
        const d = this._dragData;
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;

        const isShift = e.shiftKey; // Con Shift = libre; sin Shift = mantiene aspect ratio en esquinas
        let newW = d.startW;
        let newH = d.startH;
        let posX = d.startLeft;
        let posY = d.startTop;

        const dir = d.dir;

        // 1. Cálculo de nuevo ancho y alto según el tirador
        switch (dir) {
            case 'se': // Esquina inferior derecha
                newW = d.startW + dx;
                newH = !isShift ? (newW / d.aspect) : (d.startH + dy);
                break;

            case 'sw': // Esquina inferior izquierda
                newW = d.startW - dx;
                newH = !isShift ? (newW / d.aspect) : (d.startH + dy);
                if (d.isFree) posX = d.startLeft + dx;
                break;

            case 'ne': // Esquina superior derecha
                newW = d.startW + dx;
                newH = !isShift ? (newW / d.aspect) : (d.startH - dy);
                if (d.isFree) posY = d.startTop + (d.startH - newH);
                break;

            case 'nw': // Esquina superior izquierda
                newW = d.startW - dx;
                newH = !isShift ? (newW / d.aspect) : (d.startH - dy);
                if (d.isFree) {
                    posX = d.startLeft + (d.startW - newW);
                    posY = d.startTop + (d.startH - newH);
                }
                break;

            case 'e': // Borde derecho (solo ancho)
                newW = d.startW + dx;
                newH = d.startH;
                break;

            case 'w': // Borde izquierdo (solo ancho)
                newW = d.startW - dx;
                newH = d.startH;
                if (d.isFree) posX = d.startLeft + dx;
                break;

            case 's': // Borde inferior (solo alto)
                newH = d.startH + dy;
                newW = d.startW;
                break;

            case 'n': // Borde superior (solo alto)
                newH = d.startH - dy;
                newW = d.startW;
                if (d.isFree) posY = d.startTop + dy;
                break;
        }

        // 2. Límites mínimos y máximos seguros
        newW = Math.max(40, Math.min(d.pageContentWidth, newW));
        newH = Math.max(30, newH);

        // Si es proporcional en esquinas, re-armonizar alto
        if (!isShift && ['nw', 'ne', 'sw', 'se'].includes(dir)) {
            newH = Math.round(newW / d.aspect);
        }

        // 3. Aplicar dimensiones a la imagen
        this.targetImg.style.width = `${Math.round(newW)}px`;
        this.targetImg.style.height = (!isShift && ['nw', 'ne', 'sw', 'se'].includes(dir)) ? 'auto' : `${Math.round(newH)}px`;

        if (d.isFree) {
            this.targetImg.style.left = `${Math.round(posX)}px`;
            this.targetImg.style.top = `${Math.round(posY)}px`;
            this.targetImg.dataset.ecPosX = Math.round(posX);
            this.targetImg.dataset.ecPosY = Math.round(posY);
        }

        // 4. Actualizar marco visual y badge HUD
        this.update();
        this.showHud(newW, newH, d.pageContentWidth);
    },

    show(img) {
        if (!img) return;
        this.targetImg = img;
        if (this.containerEl) {
            this.containerEl.style.display = 'block';
            this.update();
        }
    },

    hide() {
        if (this.containerEl) {
            this.containerEl.style.display = 'none';
        }
        this.hideHud();
        this.targetImg = null;
        this.isDragging = false;
    },

    update() {
        if (!this.targetImg || !this.containerEl || this.containerEl.style.display === 'none') return;
        
        // Si la imagen fue removida del DOM, ocultar
        if (!document.body.contains(this.targetImg)) {
            this.hide();
            return;
        }

        const rect = this.targetImg.getBoundingClientRect();
        const scrollX = window.scrollX || document.documentElement.scrollLeft || 0;
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;

        const el = this.containerEl;
        el.style.top = `${Math.round(rect.top + scrollY)}px`;
        el.style.left = `${Math.round(rect.left + scrollX)}px`;
        el.style.width = `${Math.round(rect.width)}px`;
        el.style.height = `${Math.round(rect.height)}px`;
    },

    showHud(w, h, maxW = null) {
        if (!this.hudEl) return;
        const widthPx = Math.round(w);
        const heightPx = Math.round(h);
        
        let pctText = '';
        if (maxW && maxW > 0) {
            const pct = Math.min(100, Math.round((widthPx / maxW) * 100));
            pctText = ` • ${pct}%`;
        }

        this.hudEl.textContent = `${widthPx} × ${heightPx} px${pctText}`;
        this.hudEl.style.display = 'flex';
    },

    hideHud() {
        if (this.hudEl) {
            this.hudEl.style.display = 'none';
        }
    }
};
