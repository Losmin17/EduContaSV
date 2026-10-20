/**
 * EduConta SV - Componentes Flotantes Glassmorphism para Selectores y Calendarios
 * Transforma elementos native <select> e <input type="date"> en popovers flotantes
 * neomórficos de alta fidelidad visual (estilo vidriado ahumado con resplandor neón).
 */

(function () {
    const MONTH_NAMES_ES = [
        "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
        "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
    ];
    const DAY_NAMES_ES = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"];

    let openPopoverInstance = null;

    function getCurrentPageTheme() {
        const path = window.location.pathname.toLowerCase();
        const title = document.title.toLowerCase();
        
        // Default theme: Sky
        let theme = {
            name: 'sky',
            primary: 'sky',
            triggerHoverClass: 'hover:border-sky-400 dark:hover:border-sky-400',
            activeItemClass: 'bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/30',
            highlightItemClass: 'ring-2 ring-sky-400 bg-sky-500/20 text-sky-500 dark:text-sky-400 font-bold',
            optgroupHeaderClass: 'text-sky-600 dark:text-sky-400',
            checkIconClass: 'text-sky-500',
            triggerIconClass: 'text-sky-500',
            selectedDayClass: 'bg-sky-600 text-white font-extrabold shadow-lg shadow-sky-500/50 scale-105',
            todayDayClass: 'bg-sky-500/20 text-sky-500 border border-sky-500/40 font-bold',
        };

        const isHojas = path.includes('hojas') || title.includes('hojas') || title.includes('cálculo') || title.includes('spread');
        const isDocumentos = path.includes('documentos') || title.includes('documentos');
        const isDiagramas = path.includes('diagramas') || title.includes('diagramas');
        const isLienzos = path.includes('lienzos') || title.includes('lienzos') || title.includes('lienzo');
        const isTextos = path.includes('textos') || title.includes('texto') || title.includes('textos');

        if (isHojas || isDocumentos || isDiagramas || isLienzos || isTextos) {
            // Documentos: Amarillo / Amber
            theme = {
                name: 'amber',
                primary: 'amber',
                triggerHoverClass: 'hover:border-amber-400 dark:hover:border-amber-400',
                activeItemClass: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30',
                highlightItemClass: 'ring-2 ring-amber-400 bg-amber-500/20 text-amber-500 dark:text-amber-400 font-bold',
                optgroupHeaderClass: 'text-amber-600 dark:text-amber-400',
                checkIconClass: 'text-amber-500',
                triggerIconClass: 'text-amber-500',
                selectedDayClass: 'bg-amber-500 text-white font-extrabold shadow-lg shadow-amber-500/50 scale-105',
                todayDayClass: 'bg-amber-500/20 text-amber-500 border border-amber-500/40 font-bold',
            };
        } else if (
            path.includes('catalogo') ||
            path.includes('planillas') ||
            path.includes('tributario') ||
            title.includes('catálogo') ||
            title.includes('planilla') ||
            title.includes('tributario') ||
            title.includes('fiscal')
        ) {
            // Catálogo, Planillas & Tributario: Índigo / Indigo
            theme = {
                name: 'indigo',
                primary: 'indigo',
                triggerHoverClass: 'hover:border-indigo-400 dark:hover:border-indigo-400',
                activeItemClass: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/30',
                highlightItemClass: 'ring-2 ring-indigo-400 bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 font-bold',
                optgroupHeaderClass: 'text-indigo-600 dark:text-indigo-400',
                checkIconClass: 'text-indigo-500',
                triggerIconClass: 'text-indigo-500',
                selectedDayClass: 'bg-indigo-600 text-white font-extrabold shadow-lg shadow-indigo-500/50 scale-105',
                todayDayClass: 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/40 font-bold',
            };
        } else if (path.includes('biblioteca') || path.includes('visor-ley') || title.includes('biblioteca') || title.includes('ley')) {
            // Biblioteca Legal: Esmeralda / Emerald
            theme = {
                name: 'emerald',
                primary: 'emerald',
                triggerHoverClass: 'hover:border-emerald-400 dark:hover:border-emerald-400',
                activeItemClass: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30',
                highlightItemClass: 'ring-2 ring-emerald-400 bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 font-bold',
                optgroupHeaderClass: 'text-emerald-600 dark:text-emerald-400',
                checkIconClass: 'text-emerald-500',
                triggerIconClass: 'text-emerald-500',
                selectedDayClass: 'bg-emerald-600 text-white font-extrabold shadow-lg shadow-emerald-500/50 scale-105',
                todayDayClass: 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 font-bold',
            };
        }
        
        return theme;
    }

    const handleOutsideClick = (e) => {
        if (openPopoverInstance) {
            const isClickInsideRoot = e.target.closest('.educonta-glass-popover-root');
            const isClickInsidePopover = e.target.closest('.educonta-glass-select-popover') || e.target.closest('.educonta-glass-date-popover');
            if (!isClickInsideRoot && !isClickInsidePopover) {
                openPopoverInstance.close();
            }
        }
    };

    document.addEventListener('mousedown', handleOutsideClick, true);
    document.addEventListener('touchstart', handleOutsideClick, true);

    /**
     * CLASE 1: EduContaGlassSelect (Selector Flotante Glassmorphism)
     */
    class EduContaGlassSelect {
        constructor(selectEl) {
            if (!selectEl || selectEl.dataset.glassSelectInitialized) return;
            this.selectEl = selectEl;
            this.selectEl.dataset.glassSelectInitialized = "true";
            this.selectEl.style.display = "none";

            this.isOpen = false;
            this.isFontSizeSelect = this.selectEl.id === 'tool-font-size' || this.selectEl.id === 'font-size-select' || this.selectEl.id === 'fmt-font-size' || this.selectEl.dataset.fontSizeSelect === 'true';
            this.isFontFamilySelect = this.selectEl.id === 'tool-font-name' || this.selectEl.id === 'font-family-select' || this.selectEl.id === 'fmt-font-family' || this.selectEl.dataset.fontFamilySelect === 'true' || this.selectEl.dataset.fontCatalog === 'true';
            this.selectEl._glassInstance = this;
            this.init();
        }

        init() {
            const isInsideToolbar = !!this.selectEl.closest('.toolbar-group') || !!this.selectEl.closest('.sticky-fixed-controls') || !!this.selectEl.closest('.toolbar-row') || (this.selectEl.closest('.glass-card') && !this.selectEl.closest('.left-sidebar-col'));

            // Contenedor Raíz
            this.root = document.createElement('div');
            this.root.className = isInsideToolbar
                ? 'educonta-glass-popover-root inline-flex items-center relative font-sans text-xs select-none'
                : 'educonta-glass-popover-root inline-block relative font-sans text-xs select-none';
            
            if (this.selectEl.className) {
                // Copiar clases de ancho o flex si existen
                const widthClasses = Array.from(this.selectEl.classList).filter(c => c.startsWith('w-') || c.startsWith('max-w-') || c.startsWith('min-w-'));
                if (widthClasses.length > 0) this.root.classList.add(...widthClasses);
            }

            // Trigger Button (Boton Visible)
            this.trigger = document.createElement('button');
            this.trigger.type = 'button';
            this.trigger.setAttribute('role', 'combobox');
            this.trigger.setAttribute('aria-haspopup', 'listbox');
            this.trigger.setAttribute('aria-expanded', 'false');
            const theme = getCurrentPageTheme();
            
            if (isInsideToolbar) {
                this.trigger.className = `educonta-glass-select-trigger w-full flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-[10px] bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-xs min-h-[32px] h-[32px] ${theme.triggerHoverClass} transition-all outline-none`;
            } else {
                this.trigger.className = `educonta-glass-select-trigger w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/80 dark:bg-[#0b1324] border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 font-bold shadow-sm min-h-[38px] ${theme.triggerHoverClass} transition-all outline-none`;
            }

            this.triggerLabel = document.createElement('span');
            this.triggerLabel.className = 'truncate pointer-events-none flex items-center gap-1.5';

            this.triggerArrow = document.createElement('i');
            this.triggerArrow.className = 'fas fa-chevron-down text-[9px] text-slate-400 dark:text-slate-500 transition-transform duration-300 pointer-events-none ml-0.5';

            this.trigger.appendChild(this.triggerLabel);
            this.trigger.appendChild(this.triggerArrow);
            this.root.appendChild(this.trigger);

            // Popover Flotante (Menú desplegable de opciones ampliado y más alto con efecto Píldora Vidrio Templado)
            this.popover = document.createElement('div');
            this.popover.setAttribute('role', 'listbox');
            const popoverWidthClass = this.isFontSizeSelect ? 'w-52' : (this.isFontFamilySelect ? 'w-84 max-w-[92vw]' : 'w-76');
            const popoverMaxHeightClass = this.isFontFamilySelect ? 'max-h-[540px] md:max-h-[580px]' : 'max-h-[420px]';
            this.popover.className = `educonta-glass-select-popover hidden fixed z-[9999] ${popoverWidthClass} ${popoverMaxHeightClass} text-slate-800 dark:text-slate-100 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1 transition-all duration-200 opacity-0 scale-95`;

            document.body.appendChild(this.popover);

            // Revertir previsualización al salir el puntero del popover flotante
            const handlePopoverMouseLeave = () => {
                if (this.isFontFamilySelect && typeof window.EduContaTextEngine?.cancelFontPreview === 'function') {
                    window.EduContaTextEngine.cancelFontPreview(false);
                } else if (this.isFontSizeSelect && typeof window.EduContaTextEngine?.cancelFontSizePreview === 'function') {
                    window.EduContaTextEngine.cancelFontSizePreview(false);
                }
                if (typeof window.EduContaTextEngine?.restoreActiveSelection === 'function') {
                    window.EduContaTextEngine.restoreActiveSelection();
                }
            };
            this.popover.addEventListener('mouseleave', handlePopoverMouseLeave);
            this.popover.addEventListener('pointerleave', handlePopoverMouseLeave);

            this.updateTriggerLabel();

            // Eventos
            this.trigger.addEventListener('mousedown', (e) => {
                if (typeof window.EduContaTextEngine?.saveActiveSelection === 'function') {
                    window.EduContaTextEngine.saveActiveSelection(true);
                }
                e.preventDefault();
            });

            this.trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();
            });

            this.trigger.addEventListener('keydown', (e) => {
                if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
                    e.preventDefault();
                    if (!this.isOpen) {
                        this.open();
                    }
                } else if (e.key === 'Escape' && this.isOpen) {
                    e.preventDefault();
                    this.close();
                }
            });

            // Sincronizar cambios externos en el select original
            this._observer = new MutationObserver(() => {
                if (!this.selectEl || !this.selectEl.isConnected) {
                    this.destroy();
                    return;
                }
                this.updateTriggerLabel();
            });
            this._observer.observe(this.selectEl, { childList: true, subtree: true, attributes: true });
        }

        destroy() {
            if (this.isOpen) this.close();
            if (this._observer) {
                this._observer.disconnect();
                this._observer = null;
            }
            if (this.popover && this.popover.parentNode) {
                this.popover.parentNode.removeChild(this.popover);
            }
            if (this.root && this.root.parentNode) {
                this.root.parentNode.removeChild(this.root);
            }
            if (this.selectEl) {
                delete this.selectEl._glassInstance;
                delete this.selectEl.dataset.glassSelectInitialized;
            }
        }

        updateTriggerLabel() {
            if (!this.selectEl || !this.selectEl.isConnected) {
                if (this.selectEl && !this.selectEl.isConnected && this.root?.isConnected) {
                    this.destroy();
                    return;
                }
            }
            const selectedOpt = this.selectEl.options[this.selectEl.selectedIndex];
            if (selectedOpt) {
                this.triggerLabel.textContent = selectedOpt.textContent;
                if (selectedOpt.style && selectedOpt.style.fontFamily) {
                    this.triggerLabel.style.fontFamily = selectedOpt.style.fontFamily;
                } else if (this.isFontFamilySelect && selectedOpt.value) {
                    if (typeof window.ensureGoogleFontLoaded === 'function') {
                        window.ensureGoogleFontLoaded(selectedOpt.value);
                    }
                    this.triggerLabel.style.fontFamily = `'${selectedOpt.value}', sans-serif`;
                } else {
                    this.triggerLabel.style.fontFamily = '';
                }
            } else {
                this.triggerLabel.textContent = 'Seleccione...';
            }

            // Insertar después del select original
            if (this.selectEl.parentNode && !this.root.parentNode) {
                this.selectEl.parentNode.insertBefore(this.root, this.selectEl.nextSibling);
            }
        }

        renderPopoverOptions(filterQuery = '') {
            this.popover.innerHTML = '';
            this.highlightedIndex = -1;

            const theme = getCurrentPageTheme();
            const searchHeader = document.createElement('div');
            searchHeader.className = 'search-header-glass sticky top-0 z-30 p-1.5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-b border-slate-200/50 dark:border-white/10 rounded-t-2xl';

            if (this.isFontSizeSelect) {
                // Selector de tamaño de fuente: número interactivo + cuadrícula de tamaños rápidos
                const rawCurrent = (this.selectEl.value || '16').replace(/[^0-9]/g, '');
                const currentVal = rawCurrent || '16';
                searchHeader.innerHTML = `
                    <div class="flex flex-col gap-1.5">
                        <div class="relative flex items-center doble-aura-sweep-${theme.primary} rounded-xl bg-slate-100/70 dark:bg-slate-950/50 border border-slate-200/60 dark:border-white/10 shadow-inner transition-all">
                            <input type="number" min="6" max="150" class="w-full px-2.5 py-1.5 bg-transparent rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-extrabold text-center relative z-10" placeholder="Tamaño pt/px..." value="${currentVal}">
                        </div>
                    </div>
                `;
                const sizeInput = searchHeader.querySelector('input');
                
                // Aplicar el tamaño si cambia o presiona enter
                const applySize = (explicitVal = null) => {
                    const parsed = explicitVal !== null ? explicitVal : parseInt(sizeInput.value.replace(/[^0-9]/g, ''), 10);
                    if (parsed && parsed >= 5 && parsed <= 150) {
                        let matchedVal = String(parsed);
                        for (let i = 0; i < this.selectEl.options.length; i++) {
                            const optV = this.selectEl.options[i].value;
                            if (optV === String(parsed) || optV === `${parsed}px` || optV === `${parsed}pt`) {
                                matchedVal = optV;
                                break;
                            }
                        }
                        const optionExists = Array.from(this.selectEl.options).some(o => o.value === matchedVal);
                        if (!optionExists) {
                            const newOpt = document.createElement('option');
                            newOpt.value = matchedVal;
                            newOpt.textContent = `${parsed} pt`;
                            this.selectEl.appendChild(newOpt);
                        }
                        this.selectEl.value = matchedVal;
                        if (typeof window.EduContaTextEngine?.commitFontSizePreview === 'function') {
                            window.EduContaTextEngine.commitFontSizePreview(matchedVal);
                        } else if (typeof window.EduContaTextEngine?.setFontSize === 'function') {
                            window.EduContaTextEngine.setFontSize(matchedVal);
                        } else {
                            this.selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        this.updateTriggerLabel();
                        this.close();
                    }
                };

                sizeInput.addEventListener('input', () => {
                    const parsed = parseInt(sizeInput.value.replace(/[^0-9]/g, ''), 10);
                    if (parsed && parsed >= 5 && parsed <= 150) {
                        if (typeof window.EduContaTextEngine?.previewFontSize === 'function') {
                            window.EduContaTextEngine.previewFontSize(parsed);
                        }
                    } else {
                        if (typeof window.EduContaTextEngine?.cancelFontSizePreview === 'function') {
                            window.EduContaTextEngine.cancelFontSizePreview(false);
                        }
                    }
                });

                sizeInput.addEventListener('change', () => {
                    applySize();
                });
                
                // Revertir previsualización al salir de la lista de tamaños o entrar al encabezado
                searchHeader.addEventListener('mouseenter', () => {
                    if (document.activeElement !== sizeInput) {
                        if (typeof window.EduContaTextEngine?.cancelFontSizePreview === 'function') {
                            window.EduContaTextEngine.cancelFontSizePreview(false);
                        }
                    }
                });

                this.popover.appendChild(searchHeader);

                // Cuadrícula de presets rápidos de tamaño
                const sizePresets = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 64, 72];
                const presetGrid = document.createElement('div');
                presetGrid.className = 'grid grid-cols-4 gap-1 p-1.5 max-h-56 overflow-y-auto custom-scrollbar';

                presetGrid.addEventListener('mouseleave', () => {
                    if (document.activeElement !== sizeInput) {
                        if (typeof window.EduContaTextEngine?.cancelFontSizePreview === 'function') {
                            window.EduContaTextEngine.cancelFontSizePreview(false);
                        }
                    }
                });

                sizePresets.forEach(sz => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.dataset.optionItem = "true";
                    btn.setAttribute('role', 'option');
                    const isSelected = parseInt(currentVal, 10) === sz;
                    btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
                    btn.className = `py-1.5 text-center text-xs font-bold rounded-xl transition-all outline-none ${
                        isSelected 
                            ? theme.activeItemClass 
                            : 'hover:bg-white/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 bg-white/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/10'
                    }`;
                    btn.textContent = sz;
                    btn.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                    });

                    // Previsualización en vivo al pasar el ratón por los botones de tamaño
                    const triggerSizePreview = () => {
                        if (typeof window.EduContaTextEngine?.previewFontSize === 'function') {
                            window.EduContaTextEngine.previewFontSize(sz);
                        }
                    };
                    btn.addEventListener('mouseenter', triggerSizePreview);
                    btn.addEventListener('mouseover', triggerSizePreview);
                    btn.addEventListener('pointerenter', triggerSizePreview);

                    btn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        applySize(sz);
                    };
                    presetGrid.appendChild(btn);
                });

                this.popover.appendChild(presetGrid);
                return;
            } else {
                // Buscador estándar para otros selectores
                searchHeader.innerHTML = `
                    <div class="relative flex items-center doble-aura-sweep-${theme.primary} rounded-xl bg-slate-100/70 dark:bg-slate-950/50 border border-slate-200/60 dark:border-white/10 shadow-inner transition-all">
                        <i class="fas fa-search absolute left-2.5 text-[11px] text-slate-400 dark:text-slate-500 pointer-events-none z-20"></i>
                        <input type="text" class="w-full pl-8 pr-2.5 py-1.5 bg-transparent rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-semibold relative z-10" placeholder="Buscar opción..." value="${filterQuery}">
                    </div>
                `;
                const searchInput = searchHeader.querySelector('input');
                searchInput.addEventListener('input', (e) => {
                    const query = e.target.value;
                    this.filterQuery = query;
                    this.renderPopoverOptions(query);
                    const newSearchInput = this.popover.querySelector('input');
                    if (newSearchInput) {
                        newSearchInput.focus();
                        newSearchInput.setSelectionRange(query.length, query.length);
                    }
                });

                searchHeader.addEventListener('mouseenter', () => {
                    if (this.isFontFamilySelect && typeof window.EduContaTextEngine?.cancelFontPreview === 'function') {
                        window.EduContaTextEngine.cancelFontPreview(false);
                    }
                });

                this.popover.appendChild(searchHeader);
            }

            // Contenedor desplazable de opciones
            const optionsScrollContainer = document.createElement('div');
            optionsScrollContainer.className = 'flex flex-col gap-1 p-1.5 overflow-y-auto custom-scrollbar flex-1';

            optionsScrollContainer.addEventListener('mouseleave', () => {
                if (this.isFontFamilySelect && typeof window.EduContaTextEngine?.cancelFontPreview === 'function') {
                    window.EduContaTextEngine.cancelFontPreview(false);
                }
            });

            const query = filterQuery.trim().toLowerCase();
            const children = Array.from(this.selectEl.children);

            let hasMatches = false;

            children.forEach(child => {
                if (child.tagName === 'OPTGROUP') {
                    const optElements = Array.from(child.children).filter(opt => {
                        return !query || opt.textContent.toLowerCase().includes(query) || opt.value.toLowerCase().includes(query);
                    });

                    if (optElements.length > 0) {
                        hasMatches = true;

                        const sectionWrapper = document.createElement('div');
                        sectionWrapper.className = 'optgroup-section relative flex flex-col gap-0.5';

                        const groupTitle = document.createElement('div');
                        const theme = getCurrentPageTheme();
                        groupTitle.className = `sticky top-0 z-20 px-3 py-1.5 my-0.5 text-[10px] uppercase tracking-wider font-extrabold ${theme.optgroupHeaderClass} bg-slate-100/80 dark:bg-slate-800/60 backdrop-blur-md rounded-xl flex items-center justify-between border border-slate-200/60 dark:border-white/10 shadow-sm select-none`;
                        const spanLabel = document.createElement('span');
                        spanLabel.textContent = child.label;
                        groupTitle.appendChild(spanLabel);
                        sectionWrapper.appendChild(groupTitle);

                        const optsGroupContainer = document.createElement('div');
                        optsGroupContainer.className = 'flex flex-col gap-0.5';

                        optElements.forEach(opt => {
                            this.appendOptionItemToContainer(opt, optsGroupContainer);
                        });

                        sectionWrapper.appendChild(optsGroupContainer);
                        optionsScrollContainer.appendChild(sectionWrapper);
                    }
                } else if (child.tagName === 'OPTION') {
                    if (!query || child.textContent.toLowerCase().includes(query) || child.value.toLowerCase().includes(query)) {
                        hasMatches = true;
                        this.appendOptionItemToContainer(child, optionsScrollContainer);
                    }
                }
            });

            if (!hasMatches) {
                const noResult = document.createElement('div');
                noResult.className = 'px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-semibold';
                noResult.innerHTML = '<i class="fas fa-search mr-1.5"></i> No se encontraron resultados';
                optionsScrollContainer.appendChild(noResult);
            }

            this.popover.appendChild(optionsScrollContainer);
        }

        appendOptionItemToContainer(optEl, containerEl) {
            const isSelected = optEl.selected;
            const item = document.createElement('button');
            item.type = 'button';
            item.dataset.optionItem = "true";
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            const theme = getCurrentPageTheme();
            const itemPadClass = this.isFontFamilySelect ? 'px-3.5 py-2.5 min-h-[40px] text-[13px]' : 'px-3 py-2 text-xs';
            item.className = `w-full text-left ${itemPadClass} rounded-xl flex items-center justify-between gap-2 font-semibold transition-all outline-none ${
                isSelected 
                    ? theme.activeItemClass 
                    : 'hover:bg-slate-100/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200'
            }`;

            const textSpan = document.createElement('span');
            textSpan.className = 'truncate';
            textSpan.textContent = optEl.textContent;
            if (optEl.style && optEl.style.fontFamily) {
                textSpan.style.fontFamily = optEl.style.fontFamily;
            }

            item.appendChild(textSpan);

            if (isSelected) {
                const checkIcon = document.createElement('i');
                const theme = getCurrentPageTheme();
                checkIcon.className = `fas fa-check ${theme.checkIconClass} text-xs shrink-0`;
                item.appendChild(checkIcon);
            }

            item.dataset.value = optEl.value;

            item.addEventListener('mousedown', (e) => {
                // Prevenir que el clic en la opción le quite el foco o colapse la selección en el editor
                e.preventDefault();
            });

            // Previsualización en vivo en tiempo real al pasar el ratón por cada fuente
            const triggerPreview = () => {
                if (this.isFontFamilySelect && typeof window.EduContaTextEngine?.previewFontFamily === 'function') {
                    window.EduContaTextEngine.previewFontFamily(optEl.value);
                } else if (this.isFontFamilySelect && typeof window.ensureGoogleFontLoaded === 'function') {
                    window.ensureGoogleFontLoaded(optEl.value);
                }
            };
            item.addEventListener('mouseenter', triggerPreview);
            item.addEventListener('mouseover', triggerPreview);
            item.addEventListener('pointerenter', triggerPreview);

            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.isFontFamilySelect && typeof window.ensureGoogleFontLoaded === 'function') {
                    window.ensureGoogleFontLoaded(optEl.value);
                }
                this.selectEl.value = optEl.value;
                if (this.isFontFamilySelect && typeof window.EduContaTextEngine?.commitFontPreview === 'function') {
                    window.EduContaTextEngine.commitFontPreview(optEl.value);
                } else if (this.isFontFamilySelect && window.EduContaTextEngine?.setFontFamily) {
                    window.EduContaTextEngine.setFontFamily(optEl.value);
                } else {
                    this.selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                }
                this.updateTriggerLabel();
                this.close();
            });

            containerEl.appendChild(item);
        }

        _handleGlobalKeyDown(e) {
            if (!this.isOpen) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this.close();
                if (this.trigger) this.trigger.focus();
                return;
            }

            const items = Array.from(this.popover.querySelectorAll('button[data-option-item]'));
            if (items.length === 0) return;

            if (e.key === 'ArrowDown' || e.key === 'Down') {
                e.preventDefault();
                e.stopPropagation();
                if (this.highlightedIndex < 0 || this.highlightedIndex >= items.length - 1) {
                    this.highlightedIndex = 0;
                } else {
                    this.highlightedIndex++;
                }
                this.updateHighlight(items);
            } else if (e.key === 'ArrowUp' || e.key === 'Up') {
                e.preventDefault();
                e.stopPropagation();
                if (this.highlightedIndex <= 0) {
                    this.highlightedIndex = items.length - 1;
                } else {
                    this.highlightedIndex--;
                }
                this.updateHighlight(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                if (this.highlightedIndex >= 0 && this.highlightedIndex < items.length) {
                    items[this.highlightedIndex].click();
                } else if (this.isFontSizeSelect) {
                    const input = this.popover.querySelector('input');
                    if (input) {
                        const parsed = parseInt(input.value.replace(/[^0-9]/g, ''), 10);
                        if (parsed && typeof window.EduContaTextEngine?.commitFontSizePreview === 'function') {
                            window.EduContaTextEngine.commitFontSizePreview(parsed);
                        }
                    }
                    this.close();
                } else if (items.length > 0) {
                    items[0].click();
                }
            }
        }

        updateHighlight(items) {
            if (!items || items.length === 0) return;
            const theme = getCurrentPageTheme();
            const hlClasses = theme.highlightItemClass.split(' ');
            const allHighlightClasses = [
                'ring-2', 'ring-sky-400', 'bg-sky-500/20', 'text-sky-500', 'dark:text-sky-400',
                'ring-amber-400', 'bg-amber-500/20', 'text-amber-500', 'dark:text-amber-400',
                'ring-indigo-400', 'bg-indigo-500/20', 'text-indigo-500', 'dark:text-indigo-400',
                'ring-emerald-400', 'bg-emerald-500/20', 'text-emerald-500', 'dark:text-emerald-400'
            ];
            items.forEach((item, idx) => {
                item.classList.remove(...allHighlightClasses);
                if (idx === this.highlightedIndex) {
                    item.classList.add(...hlClasses);
                    item.scrollIntoView({ block: 'nearest' });

                    // Previsualización en vivo en navegación con teclado
                    if (this.isFontFamilySelect && typeof window.EduContaTextEngine?.previewFontFamily === 'function' && item.dataset.value) {
                        window.EduContaTextEngine.previewFontFamily(item.dataset.value);
                    } else if (this.isFontFamilySelect && typeof window.ensureGoogleFontLoaded === 'function' && item.dataset.value) {
                        window.ensureGoogleFontLoaded(item.dataset.value);
                    } else if (this.isFontSizeSelect && typeof window.EduContaTextEngine?.previewFontSize === 'function') {
                        const szVal = parseInt(item.textContent.trim(), 10);
                        if (szVal) window.EduContaTextEngine.previewFontSize(szVal);
                    }
                }
            });
        }

        positionPopover() {
            const rect = this.trigger.getBoundingClientRect();
            const popoverHeight = Math.min(this.popover.offsetHeight || 480, window.innerHeight - 20);
            const popoverWidth = this.popover.offsetWidth || (this.isFontFamilySelect ? 336 : 288);

            let top = rect.bottom + 6;
            let left = rect.left;

            // Si se desborda por abajo, posicionar arriba si hay espacio suficiente, o ajustar al límite de la pantalla
            if (top + popoverHeight > window.innerHeight) {
                if (rect.top - popoverHeight - 6 >= 10) {
                    top = rect.top - popoverHeight - 6;
                } else {
                    top = Math.max(10, window.innerHeight - popoverHeight - 12);
                }
            }
            if (left + popoverWidth > window.innerWidth) {
                left = Math.max(10, window.innerWidth - popoverWidth - 16);
            }

            this.popover.style.top = `${Math.max(10, top)}px`;
            this.popover.style.left = `${Math.max(10, left)}px`;
        }

        toggle() {
            if (this.isOpen) this.close();
            else this.open();
        }

        open() {
            if (this.isFontFamilySelect && typeof window.preloadAllFontBatchesOnce === 'function') {
                window.preloadAllFontBatchesOnce();
            }

            // Guardar selección si es editor de texto sin mutar el DOM
            if (typeof window.EduContaTextEngine?.saveActiveSelection === 'function') {
                window.EduContaTextEngine.saveActiveSelection(false);
            }

            if (openPopoverInstance && openPopoverInstance !== this) {
                openPopoverInstance.close();
            }
            openPopoverInstance = this;

            this.filterQuery = '';
            this.highlightedIndex = -1;
            this.renderPopoverOptions('');
            this.popover.classList.remove('hidden');
            this.positionPopover();
            this.trigger.setAttribute('aria-expanded', 'true');

            // Interceptar navegación de teclado de forma global mientras el popover esté abierto
            this._boundKeyDown = (e) => this._handleGlobalKeyDown(e);
            document.addEventListener('keydown', this._boundKeyDown, true);

            requestAnimationFrame(() => {
                this.popover.classList.remove('opacity-0', 'scale-95');
                this.popover.classList.add('opacity-100', 'scale-100');
                this.triggerArrow.classList.add('rotate-180');

                // Si NO hay selección/rango activo en editor y no es selector de tamaño, enfocar buscador
                const hasEditorSelection = !!window.EduContaTextEngine?._savedRange;
                if (!hasEditorSelection && !this.isFontSizeSelect) {
                    const searchInput = this.popover.querySelector('input');
                    if (searchInput) searchInput.focus();
                }
            });
            this.isOpen = true;
        }

        close() {
            // Desvincular listener global de teclado
            if (this._boundKeyDown) {
                document.removeEventListener('keydown', this._boundKeyDown, true);
                this._boundKeyDown = null;
            }
            if (this.trigger) {
                this.trigger.setAttribute('aria-expanded', 'false');
            }

            // Si había una previsualización activa no confirmada, cancelarla con limpieza total
            if (this.isFontFamilySelect && typeof window.EduContaTextEngine?.cancelFontPreview === 'function') {
                window.EduContaTextEngine.cancelFontPreview(true);
            } else if (this.isFontSizeSelect && typeof window.EduContaTextEngine?.cancelFontSizePreview === 'function') {
                window.EduContaTextEngine.cancelFontSizePreview(true);
            }

            this.popover.classList.remove('opacity-100', 'scale-100');
            this.popover.classList.add('opacity-0', 'scale-95');
            this.triggerArrow.classList.remove('rotate-180');

            setTimeout(() => {
                this.popover.classList.add('hidden');
            }, 150);
            this.isOpen = false;
            if (openPopoverInstance === this) openPopoverInstance = null;

            // Restaurar la selección activa en el editor para mantener el sombreado visual
            if (typeof window.EduContaTextEngine?.restoreActiveSelection === 'function') {
                window.EduContaTextEngine.restoreActiveSelection();
            }
        }
    }

    /**
     * CLASE 2: EduContaGlassDatePicker (Calendario Flotante Glassmorphism)
     */
    class EduContaGlassDatePicker {
        constructor(inputEl) {
            if (!inputEl || inputEl.dataset.glassDateInitialized) return;
            this.inputEl = inputEl;
            this.inputEl.dataset.glassDateInitialized = "true";
            this.inputEl.style.display = "none";
            this.inputEl._glassDateInstance = this;

            const initialVal = this.inputEl.value ? new Date(this.inputEl.value + 'T00:00:00') : new Date();
            this.currentYear = initialVal.getFullYear();
            this.currentMonth = initialVal.getMonth();
            this.selectedDate = this.inputEl.value ? new Date(this.inputEl.value + 'T00:00:00') : null;

            this.isOpen = false;
            this.init();
        }

        init() {
            // Contenedor Raíz
            this.root = document.createElement('div');
            this.root.className = 'educonta-glass-popover-root inline-block relative font-sans text-xs select-none';
            if (this.inputEl.className) {
                const widthClasses = Array.from(this.inputEl.classList).filter(c => c.startsWith('w-') || c.startsWith('max-w-') || c.startsWith('min-w-'));
                if (widthClasses.length > 0) this.root.classList.add(...widthClasses);
            }

            // Trigger Button
            this.trigger = document.createElement('button');
            this.trigger.type = 'button';
            this.trigger.setAttribute('aria-haspopup', 'dialog');
            this.trigger.setAttribute('aria-expanded', 'false');
            const theme = getCurrentPageTheme();
            this.trigger.className = `educonta-glass-date-trigger w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-[#0b1324] border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 font-bold shadow-sm ${theme.triggerHoverClass} transition-all outline-none`;

            this.triggerIcon = document.createElement('i');
            this.triggerIcon.className = `far fa-calendar-alt ${theme.triggerIconClass} text-sm pointer-events-none`;

            this.triggerLabel = document.createElement('span');
            this.triggerLabel.className = 'truncate tabular-nums font-semibold pointer-events-none';

            this.trigger.appendChild(this.triggerIcon);
            this.trigger.appendChild(this.triggerLabel);
            this.root.appendChild(this.trigger);

            // Popover Flotante de Calendario (Efecto Píldora Vidrio Templado)
            this.popover = document.createElement('div');
            this.popover.setAttribute('role', 'dialog');
            this.popover.setAttribute('aria-modal', 'false');
            this.popover.className = 'educonta-glass-date-popover hidden fixed z-[9999] w-80 text-slate-800 dark:text-slate-100 p-4 flex flex-col gap-3 transition-all duration-200 opacity-0 scale-95';

            document.body.appendChild(this.popover);

            this.updateTriggerLabel();

            // Eventos
            this.trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();
            });

            if (this.inputEl.parentNode) {
                this.inputEl.parentNode.insertBefore(this.root, this.inputEl.nextSibling);
            }
        }

        destroy() {
            if (this.isOpen) this.close();
            if (this.popover && this.popover.parentNode) {
                this.popover.parentNode.removeChild(this.popover);
            }
            if (this.root && this.root.parentNode) {
                this.root.parentNode.removeChild(this.root);
            }
            if (this.inputEl) {
                delete this.inputEl._glassDateInstance;
                delete this.inputEl.dataset.glassDateInitialized;
            }
        }

        updateTriggerLabel() {
            if (this.inputEl && !this.inputEl.isConnected && this.root?.isConnected) {
                this.destroy();
                return;
            }
            if (this.inputEl.value) {
                const parts = this.inputEl.value.split('-');
                if (parts.length === 3) {
                    this.triggerLabel.textContent = `${parts[2]}/${parts[1]}/${parts[0]}`;
                } else {
                    this.triggerLabel.textContent = this.inputEl.value;
                }
            } else {
                this.triggerLabel.textContent = 'Seleccionar fecha...';
            }
        }

        renderCalendarGrid() {
            this.popover.innerHTML = '';

            // 1. Cabecera (Mes / Año y flechas)
            const header = document.createElement('div');
            header.className = 'flex items-center justify-between px-1 pb-2 border-b border-slate-200/60 dark:border-slate-800/80';

            const prevBtn = document.createElement('button');
            prevBtn.type = 'button';
            prevBtn.className = 'w-8 h-8 rounded-xl flex items-center justify-between justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all';
            prevBtn.innerHTML = '<i class="fas fa-chevron-left text-xs"></i>';
            prevBtn.onclick = (e) => { e.stopPropagation(); this.prevMonth(); };

            const monthTitle = document.createElement('span');
            monthTitle.className = 'font-extrabold text-sm tracking-wide text-slate-900 dark:text-white uppercase';
            monthTitle.textContent = `${MONTH_NAMES_ES[this.currentMonth]} ${this.currentYear}`;

            const nextBtn = document.createElement('button');
            nextBtn.type = 'button';
            nextBtn.className = 'w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all';
            nextBtn.innerHTML = '<i class="fas fa-chevron-right text-xs"></i>';
            nextBtn.onclick = (e) => { e.stopPropagation(); this.nextMonth(); };

            header.appendChild(prevBtn);
            header.appendChild(monthTitle);
            header.appendChild(nextBtn);
            this.popover.appendChild(header);

            // 2. Días de la semana
            const weekHeader = document.createElement('div');
            weekHeader.className = 'grid grid-cols-7 text-center font-bold text-[10px] text-slate-400 dark:text-slate-500 py-1';
            DAY_NAMES_ES.forEach(day => {
                const daySpan = document.createElement('span');
                daySpan.textContent = day;
                weekHeader.appendChild(daySpan);
            });
            this.popover.appendChild(weekHeader);

            // 3. Matriz de Días
            const daysGrid = document.createElement('div');
            daysGrid.className = 'grid grid-cols-7 gap-1 text-center font-semibold text-xs';

            const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
            const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
            const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

            // Días mes anterior
            for (let i = firstDayIndex - 1; i >= 0; i--) {
                const btn = document.createElement('span');
                btn.className = 'h-9 flex items-center justify-center text-slate-300 dark:text-slate-700 pointer-events-none';
                btn.textContent = daysInPrevMonth - i;
                daysGrid.appendChild(btn);
            }

            // Días mes actual
            const today = new Date();
            for (let d = 1; d <= daysInMonth; d++) {
                const dayBtn = document.createElement('button');
                dayBtn.type = 'button';
                const isSelected = this.selectedDate && 
                                  this.selectedDate.getDate() === d && 
                                  this.selectedDate.getMonth() === this.currentMonth && 
                                  this.selectedDate.getFullYear() === this.currentYear;

                const isToday = today.getDate() === d && 
                                today.getMonth() === this.currentMonth && 
                                today.getFullYear() === this.currentYear;

                const theme = getCurrentPageTheme();
                let classes = 'h-9 w-9 mx-auto rounded-2xl flex items-center justify-center transition-all tabular-nums font-semibold ';
                if (isSelected) {
                    classes += theme.selectedDayClass;
                } else if (isToday) {
                    classes += theme.todayDayClass;
                } else {
                    classes += 'hover:bg-slate-100 dark:hover:bg-[#121e36] text-slate-700 dark:text-slate-200';
                }

                dayBtn.className = classes;
                dayBtn.textContent = d;

                dayBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.selectDate(new Date(this.currentYear, this.currentMonth, d));
                });

                daysGrid.appendChild(dayBtn);
            }

            this.popover.appendChild(daysGrid);
        }

        prevMonth() {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.renderCalendarGrid();
        }

        nextMonth() {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.renderCalendarGrid();
        }

        selectDate(dateObj) {
            this.selectedDate = dateObj;
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');

            const formattedISO = `${yyyy}-${mm}-${dd}`;
            this.inputEl.value = formattedISO;
            this.inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            this.inputEl.dispatchEvent(new Event('change', { bubbles: true }));

            this.updateTriggerLabel();
            this.close();
        }

        positionPopover() {
            const rect = this.trigger.getBoundingClientRect();
            let top = rect.bottom + 6;
            let left = rect.left;

            if (top + 340 > window.innerHeight) {
                top = rect.top - 346;
            }
            if (left + 320 > window.innerWidth) {
                left = window.innerWidth - 330;
            }

            this.popover.style.top = `${Math.max(10, top)}px`;
            this.popover.style.left = `${Math.max(10, left)}px`;
        }

        toggle() {
            if (this.isOpen) this.close();
            else this.open();
        }

        open() {
            if (openPopoverInstance && openPopoverInstance !== this) {
                openPopoverInstance.close();
            }
            openPopoverInstance = this;

            this.renderCalendarGrid();
            this.popover.classList.remove('hidden');
            this.positionPopover();
            this.trigger.setAttribute('aria-expanded', 'true');

            this._boundKeyDown = (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.close();
                    if (this.trigger) this.trigger.focus();
                }
            };
            document.addEventListener('keydown', this._boundKeyDown, true);

            requestAnimationFrame(() => {
                this.popover.classList.remove('opacity-0', 'scale-95');
                this.popover.classList.add('opacity-100', 'scale-100');
            });
            this.isOpen = true;
        }

        close() {
            if (this._boundKeyDown) {
                document.removeEventListener('keydown', this._boundKeyDown, true);
                this._boundKeyDown = null;
            }
            if (this.trigger) {
                this.trigger.setAttribute('aria-expanded', 'false');
            }

            this.popover.classList.remove('opacity-100', 'scale-100');
            this.popover.classList.add('opacity-0', 'scale-95');

            if (this.isFontFamilySelect && window.EduContaTextEngine?._fontPreviewState) {
                window.EduContaTextEngine.cancelFontPreview();
            }

            setTimeout(() => {
                this.popover.classList.add('hidden');
            }, 150);
            this.isOpen = false;
            if (openPopoverInstance === this) openPopoverInstance = null;
        }
    }

    /**
     * Auto-inicializador global para todos los elementos <select> e <input type="date">
     */
    function initGlassComponents() {
        document.querySelectorAll('select:not([data-glass-select-initialized])').forEach(el => {
            new EduContaGlassSelect(el);
        });

        document.querySelectorAll('input[type="date"]:not([data-glass-date-initialized])').forEach(el => {
            new EduContaGlassDatePicker(el);
        });
    }

    // Exponer globalmente
    EduContaGlassSelect.hasOpenPopover = () => !!openPopoverInstance;
    window.EduContaGlassSelect = EduContaGlassSelect;
    window.EduContaGlassDatePicker = EduContaGlassDatePicker;
    window.initGlassComponents = initGlassComponents;
    window.initEduContaCustomSelects = initGlassComponents;

    window.refreshEduContaGlassSelects = function(container = document) {
        const root = typeof container === 'string' ? document.querySelector(container) : container;
        if (!root) return;
        root.querySelectorAll('select').forEach(sel => {
            if (sel._glassInstance) {
                sel._glassInstance.updateTriggerLabel();
            } else if (typeof window.initEduContaCustomSelects === 'function') {
                new EduContaGlassSelect(sel);
            }
        });
    };

    document.addEventListener('DOMContentLoaded', () => {
        initGlassComponents();
    });
})();
