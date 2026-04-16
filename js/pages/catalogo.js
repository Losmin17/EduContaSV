document.addEventListener('DOMContentLoaded', () => {
    if(window.loadCatalogoMaestro) {
        window.loadCatalogoMaestro().then(() => {
            if(typeof window.filterCatalog === 'function') window.filterCatalog('');
        });
    }
});

window.currentCatalogFilter = 'Todos';

window.setCatalogFilter = function(cat) {
    currentCatalogFilter = cat;

    // Actualizar UI de botones de filtro
    document.querySelectorAll('.cat-filter-btn').forEach(btn => {
        btn.classList.remove('active', 'text-sky-600');
        btn.classList.add('text-slate-500');

        // Verificamos el atributo en lugar del evento global
        if (btn.dataset.cat === cat) {
            btn.classList.add('active', 'text-sky-600');
            btn.classList.remove('text-slate-500');
        }
    });

    updateCatalogTabIndicator();
    filterCatalog();
}

window.filterCatalog = function(searchTermOverride = null) {
    const input = document.getElementById('catalog-search');
    if (searchTermOverride !== null && input) {
        input.value = searchTermOverride;
    }

    const searchTerm = input ? input.value.trim() : '';
    const searchTermLower = searchTerm.toLowerCase();
    const btnClear = document.getElementById('catalog-clear-search');
    const tbody = document.getElementById('catalog-table-body');

    if(!tbody) return;

    if (btnClear) {
        if (searchTerm.length > 0) {
            btnClear.classList.remove('hidden');
        } else {
            btnClear.classList.add('hidden');
        }
    }

    if (typeof CATALOGO_MAESTRO === 'undefined') return;

    // Step 1: Find direct matches
    let directMatchedIds = [];
    if (searchTermLower !== '') {
        CATALOGO_MAESTRO.forEach(item => {
            if (String(item.id || '').toLowerCase().includes(searchTermLower) || String(item.name || '').toLowerCase().includes(searchTermLower)) {
                directMatchedIds.push(String(item.id));
            }
        });
    }

    // Step 2: Render Breadcrumbs
    renderCatalogBreadcrumbs(searchTerm);

    // Step 3: Filter logic allowing related subaccounts
    const filtered = CATALOGO_MAESTRO.filter(item => {
        const itemCatLower = String(item.cat || '').toLowerCase();
        const filterLower = currentCatalogFilter.toLowerCase();

        let matchesCat = false;
        if (currentCatalogFilter === 'Todos') {
            matchesCat = true;
        } else if (filterLower === 'ssf') {
            matchesCat = (['ssf', 'bancos', 'seguros', 'cooperativas', 'coop'].includes(itemCatLower));
        } else if (filterLower === 'inv') {
            matchesCat = (['inv', 'com', 'prod', 'nics_gral', 'produccion'].includes(itemCatLower));
        } else if (filterLower === 'agr') {
            matchesCat = (['agr'].includes(itemCatLower));
        } else if (filterLower === 'gub') {
            matchesCat = (['gub', 'safi', 'muni'].includes(itemCatLower));
        } else {
            matchesCat = itemCatLower === filterLower;
        }

        let matchesSearch = true;
        if (searchTermLower !== '') {
            const itemIdStr = String(item.id || '');
            matchesSearch = directMatchedIds.some(mId => itemIdStr.startsWith(mId));
        }

        return matchesCat && matchesSearch;
    });

    tbody.innerHTML = filtered.length ? filtered.map(item => {
        const cod = String(item.id || '');
        let indentClass = '';
        let textClass = 'text-slate-700';
        let rowBgClass = 'hover:bg-slate-100 transition-colors bg-white';
        let fontWeightClass = '';
        let cursorClass = '';
        let clickHandler = '';

        if (cod.length === 1) {
            fontWeightClass = 'font-black';
            rowBgClass = 'bg-slate-50 hover:bg-slate-200 transition-colors border-y border-slate-200 shadow-sm z-0 relative';
            cursorClass = 'cursor-pointer';
            clickHandler = `onclick="filterCatalog('${item.id}')" title="Ver subcuentas de ${item.name}"`;
        } else if (cod.length === 2) {
            indentClass = 'pl-5';
            fontWeightClass = 'font-bold';
            cursorClass = 'cursor-pointer';
            clickHandler = `onclick="filterCatalog('${item.id}')" title="Ver subcuentas de ${item.name}"`;
        } else if (cod.length === 4) {
            indentClass = 'pl-10';
            fontWeightClass = 'font-semibold';
            cursorClass = 'cursor-pointer';
            clickHandler = `onclick="filterCatalog('${item.id}')" title="Ver subcuentas de ${item.name}"`;
        } else if (cod.length >= 6) {
            indentClass = 'pl-14';
            textClass = 'text-slate-500 text-xs';
        }

        return `
        <tr class="${rowBgClass} ${cursorClass} group" ${clickHandler}>
            <td class="py-3 px-6 font-mono text-xs text-slate-500 font-bold flex items-center gap-2">
                <span>${item.id || ''}</span>
                <button onclick="copyCatalogCode('${item.id}', event)" class="text-slate-300 hover:text-sky-500 transition-colors opacity-0 group-hover:opacity-100" title="Copiar código">
                    <i class="far fa-copy flex-shrink-0"></i>
                </button>
            </td>
            <td class="py-3 px-6 text-sm ${textClass} ${fontWeightClass}">
                <div class="${indentClass}">${item.name || ''}</div>
            </td>
            <td class="py-3 px-6 text-sm text-slate-600">${item.rubro || 'N/A'}</td>
            <td class="py-3 px-6 text-center">
                <span class="cat-tag tag-${(item.cat || '').toLowerCase()}">${item.cat || ''}</span>
            </td>
        </tr>
    `}).join('') : `<tr><td colspan="4" class="py-8 text-center text-slate-400 font-bold">No se encontraron resultados.</td></tr>`;
}

window.renderCatalogBreadcrumbs = function(currentSearch) {
    const container = document.getElementById('catalog-breadcrumbs');
    if(!container) return;
    const searchTrim = currentSearch.trim();
    if (!searchTrim || isNaN(searchTrim)) {
        container.innerHTML = '';
        container.classList.add('hidden');
        return;
    }

    const lengths = [1, 2, 4, 6, 8, 10];
    let breadcrumbsHtml = `<button onclick="clearCatalogSearch()" class="hover:text-sky-600 text-slate-400 transition-colors flex items-center gap-1" title="Volver al inicio"><i class="fas fa-home"></i> Catálogo</button>`;

    if (typeof CATALOGO_MAESTRO !== 'undefined') {
        for (let len of lengths) {
            if (searchTrim.length >= len) {
                const levelId = searchTrim.substring(0, len);
                const matchedItem = CATALOGO_MAESTRO.find(i => String(i.id) === levelId);
                if (matchedItem) {
                    breadcrumbsHtml += `
                        <i class="fas fa-chevron-right text-[8px] text-slate-300"></i>
                        <button onclick="filterCatalog('${levelId}')" class="hover:text-sky-600 transition-colors ${searchTrim === levelId ? 'text-sky-600 font-black' : ''}">${matchedItem.name}</button>
                    `;
                }
            } else {
                break;
            }
        }
    }

    container.innerHTML = breadcrumbsHtml;
    container.classList.remove('hidden');
}

window.updateCatalogTabIndicator = function() {
    const activeBtn = document.querySelector('.cat-filter-btn.active');
    const indicator = document.getElementById('catalog-tab-indicator');
    if (activeBtn && indicator) {
        indicator.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
        indicator.style.width = `${activeBtn.offsetWidth}px`;
    }
}

window.clearCatalogSearch = function() {
    const input = document.getElementById('catalog-search');
    if (input) input.value = '';
    const btnClear = document.getElementById('catalog-clear-search');
    if (btnClear) btnClear.classList.add('hidden');
    filterCatalog();
}

window.copyCatalogCode = function(code, event) {
    if (event) {
        event.stopPropagation();
        const btn = event.currentTarget;
        if(btn) {
            const icon = btn.querySelector('i');
            if(icon) {
                icon.className = 'fas fa-check text-emerald-500 scale-125 transition-all';
                setTimeout(() => { icon.className = 'far fa-copy scale-100 transition-all'; }, 1500);
            }
        }
    }
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(code);
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = code;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try { document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(textArea);
    }
}
