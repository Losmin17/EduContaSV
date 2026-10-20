/**
 * Lógica para el Visualizador de Leyes (Nueva Página)
 */

let activeLawArticles = [];
let isGridView = false;
let isSidebarOpen = window.innerWidth >= 1024;
let indexElements = [];
let scrollSpyInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    initLawReader();
    applySidebarState();
    initSidebarResizer();
});

async function initLawReader() {
    const urlParams = new URLSearchParams(window.location.search);
    const leyId = urlParams.get('id');

    if (!leyId) {
        showError("No se especificó ninguna ley para visualizar.");
        return;
    }

    if (!window.supabaseClient) {
        showError("Error: Cliente de Supabase no configurado.");
        return;
    }

    try {
        // Cargar datos de la ley
        const { data: ley, error: leyError } = await window.supabaseClient
            .from('leyes')
            .select('*')
            .eq('id', leyId)
            .single();

        if (leyError) throw leyError;
        if (!ley) {
            showError("La ley solicitada no existe.");
            return;
        }

        // Actualizar UI con datos de la ley
        document.title = `${ley.nombre} | EduConta SV`;
        document.getElementById('reader-law-title').innerText = ley.nombre;
        document.getElementById('reader-law-subtitle').innerText = `${ley.decreto_numero || ''} • Publicado: ${ley.fecha_publicacion ? new Date(ley.fecha_publicacion).toLocaleDateString('es-SV') : 'N/A'}`;

        // Cargar artículos
        const { data: articles, error: artError } = await window.supabaseClient
            .from('articulos')
            .select('*')
            .eq('ley_id', leyId)
            .order('orden', { ascending: true });

        if (artError) throw artError;

        activeLawArticles = articles || [];
        renderReaderContent(activeLawArticles);

    } catch (e) {
        console.error("Error al cargar la ley:", e);
        showError(`Error al cargar la ley: ${e.message}`);
    }
}

function showError(message) {
    const contentArea = document.getElementById('reader-content-area');
    contentArea.innerHTML = `<div class="flex flex-col items-center justify-center py-32 text-rose-500"><i class="fas fa-exclamation-triangle text-6xl mb-4 opacity-80"></i><p class="font-bold tracking-wide">${message}</p></div>`;
    document.getElementById('reader-index-nav').innerHTML = '';
}

// Auxiliar para separar cuerpo y título (primer párrafo es el título)
function extractTitleAndBody(art) {
    let titleText = '';
    let bodyHTML = '';
    let isTitle = false;
    
    if (art.parrafos && Array.isArray(art.parrafos) && art.parrafos.length > 0) {
        const firstPara = art.parrafos[0].trim();
        const startsWithCapital = /^[A-ZÁÉÍÓÚÑ]/.test(firstPara);
        const isReasonablyShort = firstPara.length < 120;
        const doesNotEndWithPunctuation = !/[\.\?!;:]$/.test(firstPara);
        
        isTitle = !!(art.parrafos.length > 1 && startsWithCapital && isReasonablyShort && doesNotEndWithPunctuation);
        
        if (isTitle) {
            titleText = firstPara;
            const bodyParagraphs = art.parrafos.slice(1);
            bodyHTML = bodyParagraphs.map(p => `<p class="mb-3">${p}</p>`).join('');
        } else {
            titleText = '';
            bodyHTML = art.parrafos.map(p => `<p class="mb-3">${p}</p>`).join('');
        }
    } else {
        const lines = art.texto ? art.texto.split('\n') : [];
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            const startsWithCapital = /^[A-ZÁÉÍÓÚÑ]/.test(firstLine);
            const isReasonablyShort = firstLine.length < 120;
            const doesNotEndWithPunctuation = !/[\.\?!;:]$/.test(firstLine);
            
            isTitle = !!(lines.length > 1 && startsWithCapital && isReasonablyShort && doesNotEndWithPunctuation);
            if (isTitle) {
                titleText = firstLine;
                bodyHTML = lines.slice(1).map(l => `<p class="mb-3">${l}</p>`).join('');
            } else {
                titleText = '';
                bodyHTML = lines.map(l => `<p class="mb-3">${l}</p>`).join('');
            }
        }
    }
    return { titleText, bodyHTML, isTitle };
}

// Obtener texto plano de forma rápida y estable sin tocar el DOM (evita lag de reflow)
function getPlainText(art) {
    if (art.texto) return art.texto.trim();
    if (art.parrafos && Array.isArray(art.parrafos)) return art.parrafos.join(' ').trim();
    return '';
}

// Renderizar el contenido y el índice de navegación
function renderReaderContent(articles) {
    const sidebarNav = document.getElementById('reader-index-nav');
    const contentArea = document.getElementById('reader-content-area');

    sidebarNav.innerHTML = '';
    contentArea.innerHTML = '';
    indexElements = [];

    if (articles.length === 0) {
        contentArea.innerHTML = '<div class="flex flex-col items-center justify-center py-32 text-slate-400"><i class="fas fa-folder-open text-6xl mb-4 opacity-50"></i><p class="font-bold tracking-wide">Esta ley no contiene artículos registrados.</p></div>';
        const counter = document.getElementById('index-counter');
        if (counter) counter.innerText = '0 items';
        return;
    }

    let lastTitle = '';
    let lastChapter = '';
    let lastSection = '';

    articles.forEach((art, index) => {
        // ID único para scroll
        const artAnchorId = `art-node-${art.id}`;

        // TÍTULO SECCIÓN
        if (art.titulo_seccion && art.titulo_seccion !== lastTitle) {
            const titleId = `title-${index}`;
            
            // Agregar al contenido principal
            const titleHeader = document.createElement('h2');
            titleHeader.className = `w-full bg-gradient-to-r from-emerald-500/10 to-transparent dark:from-emerald-500/20 dark:to-transparent border-l-4 border-emerald-500 p-4 rounded-r-2xl mt-12 mb-6 shadow-sm flex items-center gap-3 text-lg md:text-xl font-black text-slate-900 dark:text-white drop-shadow-sm ${isGridView ? 'col-span-full' : ''}`;
            titleHeader.id = titleId;
            titleHeader.innerHTML = `<i class="fas fa-bookmark text-emerald-600 dark:text-emerald-400 text-sm"></i> <span>${art.titulo_seccion}</span>`;
            contentArea.appendChild(titleHeader);

            // Agregar al índice del sidebar
            const sidebarItem = document.createElement('button');
            sidebarItem.className = "index-nav-item nav-type-tit";
            sidebarItem.innerHTML = `<i class="fas fa-bookmark text-emerald-500/60 text-[10px] flex-shrink-0"></i> <span>${art.titulo_seccion}</span>`;
            sidebarItem.title = art.titulo_seccion;
            sidebarItem.onclick = () => scrollToElement(titleId);
            sidebarNav.appendChild(sidebarItem);

            indexElements.push({ elId: titleId, sidebarEl: sidebarItem, type: 'TIT' });

            lastTitle = art.titulo_seccion;
            lastChapter = '';
            lastSection = '';
        }

        // CAPÍTULO
        if (art.capitulo_seccion && art.capitulo_seccion !== lastChapter) {
            const chapId = `chap-${index}`;

            // Contenido principal
            const chapHeader = document.createElement('h3');
            chapHeader.className = `w-full bg-gradient-to-r from-blue-500/5 to-transparent dark:from-blue-500/10 dark:to-transparent border-l-4 border-blue-500/70 p-3 rounded-r-xl mt-8 mb-4 shadow-sm flex items-center gap-2.5 text-base font-extrabold text-slate-800 dark:text-slate-100 ${isGridView ? 'col-span-full' : ''}`;
            chapHeader.id = chapId;
            chapHeader.innerHTML = `<i class="fas fa-folder text-blue-500 text-sm"></i> <span>${art.capitulo_seccion}</span>`;
            contentArea.appendChild(chapHeader);

            // Sidebar
            const sidebarItem = document.createElement('button');
            sidebarItem.className = "index-nav-item nav-type-cap";
            sidebarItem.innerHTML = `<i class="fas fa-folder text-blue-500/60 text-[10px] flex-shrink-0"></i> <span>${art.capitulo_seccion}</span>`;
            sidebarItem.title = art.capitulo_seccion;
            sidebarItem.onclick = () => scrollToElement(chapId);
            sidebarNav.appendChild(sidebarItem);

            indexElements.push({ elId: chapId, sidebarEl: sidebarItem, type: 'CAP' });

            lastChapter = art.capitulo_seccion;
            lastSection = '';
        }

        // SECCIÓN
        if (art.seccion && art.seccion !== lastSection) {
            const secId = `sec-${index}`;

            // Contenido principal
            const secHeader = document.createElement('h4');
            secHeader.className = `w-full bg-gradient-to-r from-teal-500/5 to-transparent dark:from-teal-500/10 dark:to-transparent border-l-4 border-teal-500/50 p-2.5 rounded-r-lg mt-6 mb-3 flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${isGridView ? 'col-span-full' : ''}`;
            secHeader.id = secId;
            secHeader.innerHTML = `<i class="fas fa-tag text-teal-500 text-xs"></i> <span>${art.seccion}</span>`;
            contentArea.appendChild(secHeader);

            // Sidebar
            const sidebarItem = document.createElement('button');
            sidebarItem.className = "index-nav-item nav-type-sec";
            sidebarItem.innerHTML = `<i class="fas fa-tag text-teal-500/60 text-[9px] flex-shrink-0"></i> <span>${art.seccion}</span>`;
            sidebarItem.title = art.seccion;
            sidebarItem.onclick = () => scrollToElement(secId);
            sidebarNav.appendChild(sidebarItem);

            indexElements.push({ elId: secId, sidebarEl: sidebarItem, type: 'SEC' });

            lastSection = art.seccion;
        }

        // ARTÍCULO CARD
        const artCard = document.createElement('div');
        artCard.className = "group glass-card bg-white/80 dark:bg-slate-900/80 p-6 md:p-8 border border-white/50 dark:border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 rounded-3xl relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 backdrop-blur-md";
        artCard.id = artAnchorId;

        // Separar cuerpo y título
        const { titleText, bodyHTML, isTitle } = extractTitleAndBody(art);
        let previewText = '';
        if (!isTitle) {
            const plainText = getPlainText(art);
            previewText = plainText.length > 80 ? plainText.substring(0, 80) + '...' : plainText;
        }

        artCard.innerHTML = `
            <div class="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div class="px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black rounded-xl shadow-inner flex items-center gap-1.5 group-hover:from-emerald-500/20 group-hover:to-teal-500/20 transition-all">
                    <i class="fas fa-bookmark opacity-50"></i> Art. ${art.numero}
                </div>
            </div>
            <div class="article-title bg-slate-50/80 dark:bg-slate-900/40 border-l-4 border-emerald-500 rounded-r-2xl py-3 px-4 mb-4 flex items-center gap-3 ${isTitle ? '' : 'hidden'}">
                <i class="fas fa-align-left text-emerald-500 text-xs opacity-75"></i>
                <div class="text-[13px] md:text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-snug">
                    ${titleText}
                </div>
            </div>
            <div class="article-preview text-slate-500 dark:text-slate-400 text-xs italic mb-3 ${(!isTitle && isGridView) ? '' : 'hidden'}">
                ${previewText}
            </div>
            <div class="article-body text-slate-700 dark:text-slate-300 leading-relaxed font-medium text-[13px] md:text-sm ${isGridView ? 'hidden' : ''}">
                ${bodyHTML}
            </div>
        `;
        contentArea.appendChild(artCard);
    });

    const counter = document.getElementById('index-counter');
    if (counter) counter.innerText = `${indexElements.length} items`;
    
    // Iniciar ScrollSpy
    initScrollSpy();
}

// Scroll suave al hacer clic en el índice
function scrollToElement(id) {
    const el = document.getElementById(id);
    const scrollContainer = document.getElementById('reader-content-area-scroll');
    if (el && scrollContainer) {
        const offsetTop = el.offsetTop - 40; // Margen superior
        scrollContainer.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Filtrar artículos por palabra clave o número
function filterReaderArticles() {
    const filterText = document.getElementById('reader-search-input').value.toLowerCase().trim();
    const contentArea = document.getElementById('reader-content-area');

    if (!filterText) {
        renderReaderContent(activeLawArticles);
        return;
    }

    // Filtrar artículos que contengan la consulta
    const filtered = activeLawArticles.filter(art => 
        art.numero.toLowerCase().includes(filterText) || 
        art.texto.toLowerCase().includes(filterText) ||
        (art.titulo_seccion && art.titulo_seccion.toLowerCase().includes(filterText)) ||
        (art.capitulo_seccion && art.capitulo_seccion.toLowerCase().includes(filterText))
    );

    contentArea.innerHTML = '';
    
    if (filtered.length === 0) {
        contentArea.innerHTML = '<div class="flex flex-col items-center justify-center py-32 text-slate-400"><i class="fas fa-search text-6xl mb-4 opacity-50"></i><p class="font-bold tracking-wide">No se encontraron artículos.</p></div>';
        return;
    }

    filtered.forEach(art => {
        const artCard = document.createElement('div');
        artCard.className = "group glass-card bg-white/80 dark:bg-slate-900/80 p-6 md:p-8 border border-white/50 dark:border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 rounded-3xl relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 backdrop-blur-md mb-6";

        // Separar cuerpo y título
        let { titleText, bodyHTML, isTitle } = extractTitleAndBody(art);
        let previewText = '';
        if (!isTitle) {
            const plainText = getPlainText(art);
            previewText = plainText.length > 80 ? plainText.substring(0, 80) + '...' : plainText;
        }

        // Resaltar términos
        const escapedFilterText = filterText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escapedFilterText})`, 'gi');
        titleText = titleText.replace(regex, '<mark class="bg-yellow-500/40 text-yellow-900 dark:text-yellow-100 px-1 rounded-sm">$1</mark>');
        bodyHTML = bodyHTML.replace(regex, '<mark class="bg-yellow-500/40 text-yellow-900 dark:text-yellow-100 px-1 rounded-sm">$1</mark>');
        previewText = previewText.replace(regex, '<mark class="bg-yellow-500/40 text-yellow-900 dark:text-yellow-100 px-1 rounded-sm">$1</mark>');

        let hierarchyString = '';
        if (art.titulo_seccion) hierarchyString += `${art.titulo_seccion} ➔ `;
        if (art.capitulo_seccion) hierarchyString += `${art.capitulo_seccion} ➔ `;
        if (art.seccion) hierarchyString += `${art.seccion} ➔ `;
        
        artCard.innerHTML = `
            <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div class="px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black rounded-xl shadow-inner inline-flex items-center gap-1.5 w-fit group-hover:from-emerald-500/20 group-hover:to-teal-500/20 transition-all">
                    <i class="fas fa-search opacity-50"></i> Art. ${art.numero}
                </div>
                <span class="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.1em] text-right">${hierarchyString.replace(/ ➔ $/, '')}</span>
            </div>
            <div class="article-title bg-slate-50/80 dark:bg-slate-900/40 border-l-4 border-emerald-500 rounded-r-2xl py-3 px-4 mb-4 flex items-center gap-3 ${isTitle ? '' : 'hidden'}">
                <i class="fas fa-align-left text-emerald-500 text-xs opacity-75"></i>
                <div class="text-[13px] md:text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-snug">
                    ${titleText}
                </div>
            </div>
            <div class="article-preview text-slate-500 dark:text-slate-400 text-xs italic mb-3 ${(!isTitle && isGridView) ? '' : 'hidden'}">
                ${previewText}
            </div>
            <div class="article-body text-slate-700 dark:text-slate-300 leading-relaxed font-medium text-[13px] md:text-sm ${isGridView ? 'hidden' : ''}">
                ${bodyHTML}
            </div>
        `;
        contentArea.appendChild(artCard);
    });
}

// Toggles de la interfaz
function toggleGridView() {
    isGridView = !isGridView;
    const contentArea = document.getElementById('reader-content-area');
    const icon = document.getElementById('icon-toggle-view');
    const btn = document.getElementById('btn-toggle-view');
    
    const bodies = contentArea.querySelectorAll('.article-body');
    const previews = contentArea.querySelectorAll('.article-preview');
    
    if (isGridView) {
        icon.classList.replace('fa-th-large', 'fa-list');
        if (btn) btn.title = "Alternar Vista (Lista)";
        contentArea.classList.remove('space-y-8');
        contentArea.classList.add('grid', 'gap-6', 'grid-cols-1', 'md:grid-cols-2', 'xl:grid-cols-3');
        
        // Hide bodies, show previews for articles without real title
        bodies.forEach(b => b.classList.add('hidden'));
        previews.forEach(p => p.classList.remove('hidden'));
        
        Array.from(contentArea.children).forEach(child => {
            if (['H2', 'H3', 'H4'].includes(child.tagName)) {
                child.classList.add('col-span-full');
            }
        });
    } else {
        icon.classList.replace('fa-list', 'fa-th-large');
        if (btn) btn.title = "Alternar Vista (Grid)";
        contentArea.classList.remove('grid', 'gap-6', 'grid-cols-1', 'md:grid-cols-2', 'xl:grid-cols-3');
        contentArea.classList.add('space-y-8');
        
        // Show bodies, hide previews
        bodies.forEach(b => b.classList.remove('hidden'));
        previews.forEach(p => p.classList.add('hidden'));
        
        Array.from(contentArea.children).forEach(child => {
            if (['H2', 'H3', 'H4'].includes(child.tagName)) {
                child.classList.remove('col-span-full');
            }
        });
    }
}

function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
    applySidebarState();
}

function applySidebarState() {
    const sidebar = document.getElementById('reader-sidebar');
    if (!sidebar) return;
    
    if (isSidebarOpen) {
        sidebar.classList.remove('hidden');
        if (window.innerWidth < 1024) {
            sidebar.classList.add('absolute', 'inset-y-0', 'left-0', 'z-40', 'bg-white', 'dark:bg-slate-900', 'shadow-2xl');
        } else {
            sidebar.classList.remove('absolute', 'inset-y-0', 'left-0', 'z-40', 'bg-white', 'dark:bg-slate-900', 'shadow-2xl');
        }
    } else {
        sidebar.classList.add('hidden');
    }
}

window.addEventListener('resize', () => {
    applySidebarState();
});

function initScrollSpy() {
    const scrollContainer = document.getElementById('reader-content-area-scroll');
    if (!scrollContainer || scrollSpyInitialized) return;
    
    scrollSpyInitialized = true;
    let rafScrollSpyId = null;
    
    const updateActiveItem = () => {
        let activeId = null;
        const containerRect = scrollContainer.getBoundingClientRect();
        const threshold = 120;
        
        for (const item of indexElements) {
            const el = document.getElementById(item.elId);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.top - containerRect.top <= threshold) {
                    activeId = item.elId;
                }
            }
        }
        
        if (activeId) {
            indexElements.forEach(item => {
                if (item.elId === activeId) {
                    item.sidebarEl.classList.add('active-index-item');
                } else {
                    item.sidebarEl.classList.remove('active-index-item');
                }
            });
        }
    };

    scrollContainer.addEventListener('scroll', () => {
        if (!rafScrollSpyId) {
            rafScrollSpyId = requestAnimationFrame(() => {
                rafScrollSpyId = null;
                updateActiveItem();
            });
        }
    }, { passive: true });
}

// Inicializar redimensionamiento dinámico del sidebar
function initSidebarResizer() {
    const resizer = document.getElementById('sidebar-resizer');
    const sidebar = document.getElementById('reader-sidebar');
    if (!resizer || !sidebar) return;

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizer.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        let newWidth = e.clientX;
        
        // Limitar ancho mínimo y máximo del sidebar
        if (newWidth < 220) newWidth = 220;
        if (newWidth > 500) newWidth = 500;
        
        sidebar.style.width = `${newWidth}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizer.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
}

// Hacer global
window.filterReaderArticles = filterReaderArticles;
window.toggleGridView = toggleGridView;
window.toggleSidebar = toggleSidebar;
