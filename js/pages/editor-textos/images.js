/**
 * images.js — ImageLayerManager
 * Selección, ajuste de capa, tamaño y resize handles de imágenes.
 * EduConta SV
 */
import { TextDocStateManager } from './state.js';
import { MultiPageEngine } from './engine.js';
import { DocStatsManager } from './stats.js';

    const ImageLayerManager = {
        selectedImg: null,
        toolbarEl: null,
        _resizeHandlesEl: null,
        _resizeDrag: null,

        _didDragJustNow: false,
        _dragCandidate: null,
        _dragState: null,

        init() {
            this.toolbarEl = document.getElementById('image-floating-toolbar');
            this._resizeHandlesEl = document.getElementById('image-resize-handles');

            // Prevenir que el navegador ejecute el arrastre nativo HTML5 (fantasma) en imágenes
            document.addEventListener('dragstart', (e) => {
                if (e.target && e.target.tagName === 'IMG' && e.target.closest('.page-editor-surface')) {
                    e.preventDefault();
                }
            }, true);

            // Red de seguridad global: evitar que el navegador abra archivos arrastrados
            // en una pestaña nueva si el drop cae fuera de un editor surface
            document.addEventListener('dragover', (e) => {
                if (e.dataTransfer?.types?.includes('Files')) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                }
            });
            document.addEventListener('drop', (e) => {
                // Solo intervenir si se sueltan archivos fuera de un .page-editor-surface
                // (los drops dentro ya los maneja engine.js bindPageEvents)
                if (e.dataTransfer?.types?.includes('Files') && !e.target.closest('.page-editor-surface')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            // Escuchar clics globales para seleccionar/deseleccionar imágenes
            document.addEventListener('click', (e) => {
                if (window.isAuditMode) return;

                // Si acabamos de soltar un arrastre, no alterar la selección
                if (this._didDragJustNow) return;

                // Si el clic fue dentro de la barra flotante o panel editor, no hacer nada
                if (this.toolbarEl && this.toolbarEl.contains(e.target)) return;
                const editorPanel = document.getElementById('image-editor-panel');
                if (editorPanel && editorPanel.contains(e.target)) return;
                const cropOverlay = document.getElementById('image-crop-overlay');
                if (cropOverlay && cropOverlay.contains(e.target)) return;
                const cropControls = document.getElementById('crop-controls');
                if (cropControls && cropControls.contains(e.target)) return;
                if (this._resizeHandlesEl && this._resizeHandlesEl.contains(e.target)) return;

                // Si el clic fue sobre una imagen dentro de un editor
                const img = e.target.closest('.page-editor-surface img');
                if (img) {
                    this.selectImage(img);
                } else {
                    this.deselect();
                }
            });

            // Ocultar o reposicionar barra al hacer scroll o redimensionar
            window.addEventListener('resize', () => {
                this.updateToolbarPosition();
                this._updateResizeHandles();
            });
            document.querySelector('.editor-scroll-area')?.addEventListener('scroll', () => {
                this.updateToolbarPosition();
                this._updateResizeHandles();
            });

            // Inicializar resize handles (drag events)
            this._initResizeHandles();

            // Inicializar arrastre libre para cualquier imagen
            this._initDragFree();
        },

        selectImage(img) {
            this.deselect();
            this.selectedImg = img;
            img.classList.add('doc-img-selected');
            this.showToolbar();
            this._showResizeHandles();

            // Sincronizar panel de edición si está abierto
            if (window.ImageEditorManager?.panelEl?.classList.contains('ec-panel-open')) {
                window.ImageEditorManager._syncPanelWithImage();
            }
        },

        deselect() {
            if (this.selectedImg) {
                this.selectedImg.classList.remove('doc-img-selected');
                this.selectedImg = null;
            }
            if (this.toolbarEl) {
                this.toolbarEl.style.display = 'none';
            }
            this._hideResizeHandles();
            // Cerrar panel de edición
            if (window.ImageEditorManager?.panelEl?.classList.contains('ec-panel-open')) {
                window.ImageEditorManager.closeEditorPanel();
            }
        },

        showToolbar() {
            if (!this.selectedImg || !this.toolbarEl) return;
            this.toolbarEl.style.display = 'flex';
            this.updateToolbarPosition();
        },

        updateToolbarPosition() {
            if (!this.selectedImg || !this.toolbarEl || this.toolbarEl.style.display === 'none') return;
            const imgRect = this.selectedImg.getBoundingClientRect();
            const toolbarRect = this.toolbarEl.getBoundingClientRect();

            const toolbarW = toolbarRect.width || 96;
            const toolbarH = toolbarRect.height || 330;

            // 1. Posición Horizontal: colocar al lateral derecho de la imagen
            let left = imgRect.right + window.scrollX + 12;

            // Si no cabe a la derecha de la ventana, posicionar al lateral izquierdo
            if (left + toolbarW > window.innerWidth - 12) {
                left = imgRect.left + window.scrollX - toolbarW - 12;
            }

            // Si la imagen es muy ancha y tampoco cabe a la izquierda, fijar al margen seguro
            if (left < 10) {
                left = Math.min(window.innerWidth - toolbarW - 14, Math.max(10, imgRect.right + window.scrollX - toolbarW - 8));
            }

            // 2. Posición Vertical: alinear con la parte superior de la imagen
            let top = imgRect.top + window.scrollY;

            // Límite superior: evitar chocar con la barra de herramientas superior fija
            const floatingToolbar = document.querySelector('.sticky-fixed-controls, #editor-sticky-controls');
            const minAllowedTop = floatingToolbar 
                ? (floatingToolbar.getBoundingClientRect().bottom + window.scrollY + 8) 
                : (window.scrollY + 64);

            if (top < minAllowedTop) {
                top = minAllowedTop;
            }

            // Límite inferior: evitar que se desborde por el fondo de la pantalla visible
            const maxAllowedTop = window.scrollY + window.innerHeight - toolbarH - 16;
            if (top > maxAllowedTop && maxAllowedTop >= minAllowedTop) {
                top = maxAllowedTop;
            }

            this.toolbarEl.style.top = `${Math.round(top)}px`;
            this.toolbarEl.style.left = `${Math.round(left)}px`;
        },

        setLayerMode(mode) {
            if (!this.selectedImg) return;

            const img = this.selectedImg;
            const wasFreefloat = img.classList.contains('doc-img-behind') || img.classList.contains('doc-img-front');
            const willFreefloat = mode === 'behind' || mode === 'front';

            // Remover clases de modo anteriores
            img.classList.remove(
                'doc-img-inline', 
                'doc-img-center', 
                'doc-img-wrap-left', 
                'doc-img-wrap-right', 
                'doc-img-top-bottom',
                'doc-img-behind', 
                'doc-img-front'
            );

            // Si cambiamos A modo libre (behind/front), inicializar posición
            if (willFreefloat && !wasFreefloat) {
                const surface = img.closest('.page-editor-surface');
                if (surface) {
                    const surfaceRect = surface.getBoundingClientRect();
                    const imgRect = img.getBoundingClientRect();
                    const x = imgRect.left - surfaceRect.left;
                    const y = imgRect.top - surfaceRect.top;
                    img.style.left = `${Math.max(0, x)}px`;
                    img.style.top  = `${Math.max(0, y)}px`;
                    img.dataset.ecPosX = Math.max(0, x);
                    img.dataset.ecPosY = Math.max(0, y);
                }
            }

            // Si salimos de modo libre, limpiar posicionamiento absoluto
            if (!willFreefloat && wasFreefloat) {
                img.style.left = '';
                img.style.top  = '';
                delete img.dataset.ecPosX;
                delete img.dataset.ecPosY;
            }

            img.classList.add(`doc-img-${mode}`);

            // Si ya tenía posición guardada (recarga), restaurarla
            if (willFreefloat && img.dataset.ecPosX) {
                img.style.left = `${img.dataset.ecPosX}px`;
                img.style.top  = `${img.dataset.ecPosY}px`;
            }

            const labels = {
                'inline': 'En línea', 'center': 'Centrada', 
                'wrap-left': 'Texto a la derecha', 'wrap-right': 'Texto a la izquierda',
                'top-bottom': 'Arriba y abajo', 'behind': 'Detrás (libre)', 'front': 'Delante (libre)'
            };

            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            TextDocStateManager.triggerAutoSave();
            MultiPageEngine.debouncePaginate();
            this.updateToolbarPosition();
            this._updateResizeHandles();
            TextDocStateManager.showToast(labels[mode] || mode);
        },

        setSize(sizePercent) {
            if (!this.selectedImg) return;
            this.selectedImg.style.width = sizePercent;
            this.selectedImg.style.height = 'auto';

            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            TextDocStateManager.triggerAutoSave();
            MultiPageEngine.debouncePaginate();
            this.updateToolbarPosition();
            this._updateResizeHandles();
        },

        deleteSelectedImage() {
            if (!this.selectedImg) return;
            const img = this.selectedImg;
            this.deselect();
            // Si está dentro de un <figure>, eliminar el figure completo
            const figure = img.parentElement;
            if (figure && figure.tagName === 'FIGURE') {
                figure.remove();
            } else {
                img.remove();
            }

            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            TextDocStateManager.triggerAutoSave();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.showToast('Imagen eliminada');
        },

        // ═══════════════════════════════════════════════════════════════════
        //  RESIZE HANDLES — asas de redimensionado interactivas
        // ═══════════════════════════════════════════════════════════════════

        _showResizeHandles() {
            if (!this._resizeHandlesEl || !this.selectedImg) return;
            this._resizeHandlesEl.style.display = 'block';
            this._updateResizeHandles();
        },

        _hideResizeHandles() {
            if (this._resizeHandlesEl) {
                this._resizeHandlesEl.style.display = 'none';
            }
        },

        _updateResizeHandles() {
            if (!this._resizeHandlesEl || !this.selectedImg || this._resizeHandlesEl.style.display === 'none') return;

            const imgRect = this.selectedImg.getBoundingClientRect();
            const el = this._resizeHandlesEl;

            el.style.top    = (imgRect.top + window.scrollY) + 'px';
            el.style.left   = (imgRect.left + window.scrollX) + 'px';
            el.style.width  = imgRect.width + 'px';
            el.style.height = imgRect.height + 'px';
        },

        _initResizeHandles() {
            if (!this._resizeHandlesEl) return;

            const handles = this._resizeHandlesEl.querySelectorAll('.img-resize-handle');
            handles.forEach(handle => {
                handle.addEventListener('pointerdown', (e) => {
                    if (window.isAuditMode || !this.selectedImg) return;
                    e.preventDefault();
                    e.stopPropagation();

                    const imgRect = this.selectedImg.getBoundingClientRect();
                    const aspectRatio = imgRect.width / imgRect.height;

                    this._resizeDrag = {
                        dir:    handle.dataset.dir,
                        startX: e.clientX,
                        startY: e.clientY,
                        startW: imgRect.width,
                        startH: imgRect.height,
                        aspect: aspectRatio,
                    };

                    document.addEventListener('pointermove', this._onResizeMove);
                    document.addEventListener('pointerup',   this._onResizeUp);
                });
            });

            this._onResizeMove = (e) => {
                if (!this._resizeDrag || !this.selectedImg) return;
                e.preventDefault();

                const d  = this._resizeDrag;
                const dx = e.clientX - d.startX;
                const dy = e.clientY - d.startY;

                let newW = d.startW;

                // Calcular nuevo ancho según la dirección del handle
                if (d.dir === 'se' || d.dir === 'ne') newW = Math.max(30, d.startW + dx);
                if (d.dir === 'sw' || d.dir === 'nw') newW = Math.max(30, d.startW - dx);

                this.selectedImg.style.width  = newW + 'px';
                this.selectedImg.style.height = 'auto';  // Mantener proporción

                this.updateToolbarPosition();
                this._updateResizeHandles();
            };

            this._onResizeUp = () => {
                if (this._resizeDrag) {
                    this._resizeDrag = null;
                    TextDocStateManager.pushHistory();
                    DocStatsManager.update();
                    TextDocStateManager.triggerAutoSave();
                    MultiPageEngine.debouncePaginate();
                }
                document.removeEventListener('pointermove', this._onResizeMove);
                document.removeEventListener('pointerup',   this._onResizeUp);
            };
        },

        // ═══════════════════════════════════════════════════════════════════
        //  ARRASTRE LIBRE — cualquier imagen se puede arrastrar y soltar
        // ═══════════════════════════════════════════════════════════════════

        _isFreefloat(img) {
            return img && (img.classList.contains('doc-img-behind') || img.classList.contains('doc-img-front'));
        },

        _initDragFree() {
            // Escuchar pointerdown globalmente para capturar arrastre de cualquier imagen
            document.addEventListener('pointerdown', (e) => {
                if (window.isAuditMode) return;

                // Verificar si se presionó sobre una imagen del documento
                const img = e.target.closest('.page-editor-surface img');
                if (!img) return;

                // Ignorar si se hizo clic en un asa de redimensionado o en el toolbar
                if (e.target.closest('.img-resize-handle') || e.target.closest('#image-floating-toolbar')) return;

                const surface = img.closest('.page-editor-surface');
                if (!surface) return;

                // Registrar candidato a arrastre
                this._dragCandidate = {
                    img: img,
                    surface: surface,
                    startX: e.clientX,
                    startY: e.clientY
                };
            });

            document.addEventListener('pointermove', (e) => {
                if (window.isAuditMode) return;

                // 1. Detectar si un candidato supera el umbral de movimiento (4px)
                if (this._dragCandidate && !this._dragState) {
                    const c = this._dragCandidate;
                    const dist = Math.hypot(e.clientX - c.startX, e.clientY - c.startY);

                    if (dist > 4) {
                        e.preventDefault();

                        // Seleccionar la imagen
                        if (this.selectedImg !== c.img) {
                            this.selectImage(c.img);
                        }

                        const surfaceRect = c.surface.getBoundingClientRect();
                        const imgRect = c.img.getBoundingClientRect();

                        // Posición actual relativa a la página
                        let currentLeft = parseFloat(c.img.style.left);
                        let currentTop  = parseFloat(c.img.style.top);

                        // Si la imagen no estaba en modo libre (behind/front), convertirla automáticamente a libre
                        if (!this._isFreefloat(c.img) || isNaN(currentLeft) || isNaN(currentTop)) {
                            currentLeft = Math.round(imgRect.left - surfaceRect.left);
                            currentTop  = Math.round(imgRect.top - surfaceRect.top);
                            this.setLayerMode('front');
                            c.img.style.left = `${currentLeft}px`;
                            c.img.style.top  = `${currentTop}px`;
                        }

                        c.img.classList.add('doc-img-dragging');

                        this._dragState = {
                            img:       c.img,
                            surface:   c.surface,
                            startX:    e.clientX,
                            startY:    e.clientY,
                            startLeft: currentLeft,
                            startTop:  currentTop
                        };

                        // Ocultar barra flotante y asas mientras se arrastra
                        if (this.toolbarEl) this.toolbarEl.style.display = 'none';
                        this._hideResizeHandles();
                    }
                }

                // 2. Mover la imagen en tiempo real si el arrastre está activo
                if (this._dragState) {
                    e.preventDefault();

                    const d = this._dragState;
                    const dx = e.clientX - d.startX;
                    const dy = e.clientY - d.startY;

                    // Si el puntero se desplaza sobre otra hoja física, transferir la imagen
                    const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
                    const targetSurface = elementUnder?.closest('.page-editor-surface');
                    if (targetSurface && targetSurface !== d.surface) {
                        const oldRect = d.surface.getBoundingClientRect();
                        const newRect = targetSurface.getBoundingClientRect();
                        targetSurface.appendChild(d.img);
                        d.startLeft += (oldRect.left - newRect.left);
                        d.startTop  += (oldRect.top - newRect.top);
                        d.surface = targetSurface;
                    }

                    const surfaceRect = d.surface.getBoundingClientRect();
                    const imgW = d.img.offsetWidth;
                    const imgH = d.img.offsetHeight;

                    let newX = d.startLeft + dx;
                    let newY = d.startTop + dy;

                    // Restricción: mantener la imagen dentro del área visible de la página
                    newX = Math.max(-imgW * 0.3, Math.min(surfaceRect.width  - imgW * 0.7, newX));
                    newY = Math.max(0, Math.min(surfaceRect.height - imgH * 0.3, newY));

                    d.img.style.left = `${Math.round(newX)}px`;
                    d.img.style.top  = `${Math.round(newY)}px`;
                }
            });

            document.addEventListener('pointerup', () => {
                if (this._dragState) {
                    const d = this._dragState;
                    d.img.classList.remove('doc-img-dragging');

                    // Guardar coordenadas finales en datasets para persistencia
                    d.img.dataset.ecPosX = Math.round(parseFloat(d.img.style.left) || 0);
                    d.img.dataset.ecPosY = Math.round(parseFloat(d.img.style.top) || 0);

                    // Evitar que el clic subsiguiente altere la selección
                    this._didDragJustNow = true;
                    setTimeout(() => { this._didDragJustNow = false; }, 120);

                    this._dragState = null;
                    this._dragCandidate = null;

                    // Restaurar barra y asas
                    this.showToolbar();
                    this._showResizeHandles();

                    TextDocStateManager.pushHistory();
                    DocStatsManager.update();
                    TextDocStateManager.triggerAutoSave();
                    TextDocStateManager.showToast('Imagen reubicada');
                } else {
                    this._dragCandidate = null;
                }
            });
        }
    };
export { ImageLayerManager };