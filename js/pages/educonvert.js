// =============================================================================
// EDUCONVERT STUDIO — MOTOR NATIVO DE ESTRUCTURACIÓN DE LEYES Y DOCUMENTOS (MPA)
// EduConta SV • Todos los derechos reservados
// =============================================================================

window.studioLawData = {
    id: '',
    nombre: '',
    abreviatura: '',
    decreto_numero: '',
    categoria: 'Aduanas y Tributos',
    fecha_publicacion: new Date().toISOString().split('T')[0],
    descripcion: ''
};

window.studioArticles = [];
window.activeFilterQuery = '';
window.existingLawsDatabase = [];
window.activeStudioTab = 'compiler';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar tema visual si existe theme.js
    if (typeof window.initTheme === 'function') {
        window.initTheme();
    }

    // 2. Verificación de privilegios de Administrador
    if (window.supabaseClient) {
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            const adminEmail = (window.ADMIN_EMAIL || 'admin@educontasv.com').toLowerCase();
            if (!session || (session.user && session.user.email.toLowerCase() !== adminEmail)) {
                console.warn("Usuario no autenticado como admin. Redirigiendo a index...");
            }
        } catch (e) {
            console.warn("Verificación de sesión en EduConvert:", e);
        }
    }

    // 4. Inicializar fecha por defecto en input
    const dateInput = document.getElementById('law-date-input');
    if (dateInput && !dateInput.value) {
        dateInput.value = window.studioLawData.fecha_publicacion;
    }

    // 5. Cargar catálogo de leyes existentes en Supabase
    await window.loadExistingLawsCatalog();

    // 6. Verificar parámetros URL (?id=... o ?tab=...)
    const urlParams = new URLSearchParams(window.location.search);
    const lawIdParam = urlParams.get('id') || urlParams.get('edit');
    const tabParam = urlParams.get('tab');

    if (tabParam && ['compiler', 'laws', 'config'].includes(tabParam)) {
        window.switchStudioTab(tabParam);
    }

    if (lawIdParam) {
        window.switchStudioTab('compiler');
        await window.loadLawFromDatabase(lawIdParam);
    }

    // Desvanecer preloader suavemente tras inicializar el studio y catálogo de leyes
    if (typeof window.dismissGlobalPreloader === 'function') {
        window.dismissGlobalPreloader();
    }
});

// =============================================================================
// 1. NAVEGACIÓN ENTRE PESTAÑAS DEL STUDIO
// =============================================================================
window.switchStudioTab = function(tabId) {
    window.activeStudioTab = tabId;

    const screens = {
        'compiler': document.getElementById('studio-compiler-screen'),
        'laws': document.getElementById('studio-laws-screen'),
        'config': document.getElementById('studio-config-screen')
    };

    const buttons = {
        'compiler': document.getElementById('btn-tab-compiler'),
        'laws': document.getElementById('btn-tab-laws'),
        'config': document.getElementById('btn-tab-config')
    };

    Object.keys(screens).forEach(key => {
        if (screens[key]) {
            if (key === tabId) {
                screens[key].classList.remove('hidden');
            } else {
                screens[key].classList.add('hidden');
            }
        }
    });

    Object.keys(buttons).forEach(key => {
        if (buttons[key]) {
            if (key === tabId) {
                buttons[key].className = "px-4 py-1.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] uppercase font-black tracking-wider transition-all flex items-center gap-1.5 shadow-md";
            } else {
                buttons[key].className = "px-4 py-1.5 rounded-full bg-transparent text-slate-400 text-[10px] uppercase font-black tracking-wider transition-all flex items-center gap-1.5 border border-transparent hover:text-slate-200";
            }
        }
    });

    if (tabId === 'laws') {
        window.renderCloudLawsTable();
    }
};

// =============================================================================
// 2. CARGA Y GESTIÓN DE LEYES DESDE SUPABASE
// =============================================================================
window.loadExistingLawsCatalog = async function() {
    if (!window.supabaseClient) {
        window.updateConnectionStatus(false);
        return;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from('leyes')
            .select('id, nombre, decreto_numero, categoria, fecha_publicacion, abreviatura')
            .order('nombre', { ascending: true });

        if (error) throw error;
        window.existingLawsDatabase = data || [];

        window.updateConnectionStatus(true);
        window.populateSelectCatalog();
        window.renderCloudLawsTable();
        window.updateCloudStats();

    } catch (e) {
        console.warn("No se pudieron cargar leyes existentes:", e);
        window.updateConnectionStatus(false);
    }
};

window.populateSelectCatalog = function() {
    const select = document.getElementById('studio-existing-laws-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Cargar una ley de Supabase para editarla --</option>' +
        window.existingLawsDatabase.map(l => `
            <option value="${l.id}">${l.nombre} (${l.decreto_numero || l.abreviatura || 'Oficial'})</option>
        `).join('');
};

window.loadLawFromDatabase = async function(lawId) {
    if (!lawId || !window.supabaseClient) return;

    const select = document.getElementById('studio-existing-laws-select');
    let selected = window.existingLawsDatabase.find(l => l.id === lawId);

    try {
        if (select) select.disabled = true;
        window.showToastNotification("Cargando ley desde Supabase...");

        // Si no está en memoria, consultarla individualmente
        if (!selected) {
            const { data: fetchedLaw, error: fetchErr } = await window.supabaseClient
                .from('leyes')
                .select('*')
                .eq('id', lawId)
                .single();
            if (fetchErr) throw fetchErr;
            selected = fetchedLaw;
        }

        if (!selected) {
            alert("No se encontró la ley especificada.");
            return;
        }

        // 1. Asignar Metadatos en UI
        document.getElementById('law-name-input').value = selected.nombre || '';
        document.getElementById('law-decreto-input').value = selected.decreto_numero || '';
        document.getElementById('law-abbrev-input').value = selected.abreviatura || '';
        document.getElementById('law-cat-input').value = selected.categoria || 'Aduanas y Tributos';
        if (selected.fecha_publicacion) {
            document.getElementById('law-date-input').value = selected.fecha_publicacion.split('T')[0];
        }
        window.updateLawMetadataState();

        // 2. Cargar Artículos
        const { data: articles, error } = await window.supabaseClient
            .from('articulos')
            .select('*')
            .eq('ley_id', lawId)
            .order('orden', { ascending: true });

        if (error) throw error;

        // Normalizar artículos asegurando texto plano
        window.studioArticles = (articles || []).map(art => {
            let texto = art.texto || '';
            if (!texto && Array.isArray(art.parrafos)) {
                texto = art.parrafos.join('\n\n');
            }
            return {
                id: art.id,
                ley_id: art.ley_id,
                numero: String(art.numero),
                titulo_seccion: art.titulo_seccion || '',
                capitulo_seccion: art.capitulo_seccion || '',
                seccion: art.seccion || '',
                texto: texto,
                orden: art.orden || 1
            };
        });

        // Reconstruir texto fuente para el textarea
        let reconstructedSource = `DECRETO OFICIAL: ${selected.decreto_numero || ''}\n${selected.nombre}\n\n`;
        let lastCap = '';
        window.studioArticles.forEach(art => {
            if (art.capitulo_seccion && art.capitulo_seccion !== lastCap) {
                reconstructedSource += `\n${art.capitulo_seccion.toUpperCase()}\n\n`;
                lastCap = art.capitulo_seccion;
            }
            reconstructedSource += `Art. ${art.numero}.- ${art.texto}\n\n`;
        });

        document.getElementById('raw-source-text').value = reconstructedSource.trim();
        if (select) select.value = lawId;

        window.updateSourceMetrics();
        window.renderStudioArticles();
        window.checkIntegrity();
        window.showToastNotification(`Ley cargada: ${window.studioArticles.length} artículos estructurados.`);

        // Actualizar breadcrumb
        const breadcrumbEl = document.getElementById('current-law-breadcrumb');
        if (breadcrumbEl) breadcrumbEl.innerText = selected.nombre || 'Ley en Edición';

    } catch (e) {
        console.error("Error al cargar ley:", e);
        alert("Error al cargar ley desde Supabase: " + e.message);
    } finally {
        if (select) select.disabled = false;
    }
};

window.deleteLawFromDatabase = async function(lawId, lawName) {
    if (!lawId || !window.supabaseClient) return;

    const confirmed = confirm(`¿Estás seguro de eliminar permanentemente la ley "${lawName || lawId}" y todos sus artículos asociados de Supabase? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
        window.showToastNotification("Eliminando ley de Supabase...");

        // 1. Eliminar artículos primero
        await window.supabaseClient
            .from('articulos')
            .delete()
            .eq('ley_id', lawId);

        // 2. Eliminar registro de ley
        const { error } = await window.supabaseClient
            .from('leyes')
            .delete()
            .eq('id', lawId);

        if (error) throw error;

        window.showToastNotification(`Ley eliminada con éxito.`);
        await window.loadExistingLawsCatalog();

    } catch (e) {
        console.error("Error al eliminar ley:", e);
        alert("Error al eliminar la ley de Supabase: " + e.message);
    }
};

window.updateCloudStats = async function() {
    const totalLawsEl = document.getElementById('stat-total-laws');
    const totalArticlesEl = document.getElementById('stat-total-articles');

    if (totalLawsEl) {
        totalLawsEl.innerText = window.existingLawsDatabase.length;
    }

    if (totalArticlesEl && window.supabaseClient) {
        try {
            const { count, error } = await window.supabaseClient
                .from('articulos')
                .select('*', { count: 'exact', head: true });
            if (!error && count !== null) {
                totalArticlesEl.innerText = count.toLocaleString();
            }
        } catch (err) {
            console.warn("No se pudo obtener conteo total de artículos:", err);
        }
    }
};

window.updateConnectionStatus = function(isConnected) {
    const el = document.getElementById('db-connection-status');
    const dot = document.getElementById('db-connection-dot');
    if (el) {
        el.innerText = isConnected ? 'Conectado a Supabase' : 'Desconectado';
        el.className = isConnected ? 'text-xs font-bold text-emerald-400 flex items-center gap-1.5' : 'text-xs font-bold text-rose-400 flex items-center gap-1.5';
    }
    if (dot) {
        dot.className = isConnected ? 'w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse' : 'w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse';
    }
};

// Renderizar tabla del Catálogo en Nube (Tab 2)
window.renderCloudLawsTable = function() {
    const tbody = document.getElementById('studio-laws-table-body');
    const searchInput = document.getElementById('laws-filter-input');
    const catFilter = document.getElementById('laws-cat-filter');
    if (!tbody) return;

    const query = (searchInput?.value || '').toLowerCase().trim();
    const selectedCat = catFilter?.value || 'all';

    const filtered = window.existingLawsDatabase.filter(law => {
        const matchesQuery = !query ||
            (law.nombre && law.nombre.toLowerCase().includes(query)) ||
            (law.decreto_numero && law.decreto_numero.toLowerCase().includes(query)) ||
            (law.abreviatura && law.abreviatura.toLowerCase().includes(query));
        const matchesCat = selectedCat === 'all' || law.categoria === selectedCat;
        return matchesQuery && matchesCat;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-12 text-center text-slate-500 font-bold">
                    <i class="fas fa-search text-2xl mb-2 opacity-40 block"></i>
                    No se encontraron leyes con los filtros aplicados.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(law => {
        const dateStr = law.fecha_publicacion ? new Date(law.fecha_publicacion).toLocaleDateString('es-SV') : 'N/A';
        const escapedName = (law.nombre || '').replace(/'/g, "\\'");

        return `
            <tr class="hover:bg-white/[0.02] transition-colors group">
                <td class="py-4 pl-4 pr-3">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm shrink-0">
                            <i class="fas fa-gavel"></i>
                        </div>
                        <div>
                            <div class="font-extrabold text-slate-100 group-hover:text-emerald-400 transition-colors">${law.nombre || 'Ley sin título'}</div>
                            <div class="text-[10px] text-slate-500">${law.abreviatura || 'Oficial'} • Publicado: ${dateStr}</div>
                        </div>
                    </div>
                </td>
                <td class="py-4 px-3 text-slate-300 tabular-nums font-semibold text-[11px]">
                    ${law.decreto_numero || '-'}
                </td>
                <td class="py-4 px-3">
                    <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ${law.categoria || 'Aduanas y Tributos'}
                    </span>
                </td>
                <td class="py-4 pr-4 pl-3 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        <button onclick="window.loadLawAndSwitchToCompiler('${law.id}')" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700" title="Editar en Studio">
                            <i class="fas fa-pen-to-square"></i> <span>Editar</span>
                        </button>
                        <button onclick="window.open('visor-ley.html?id=${law.id}', '_blank')" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center justify-center transition-all border border-slate-700" title="Abrir en Visor de Ley">
                            <i class="fas fa-arrow-up-right-from-square"></i>
                        </button>
                        <button onclick="window.deleteLawFromDatabase('${law.id}', '${escapedName}')" class="w-8 h-8 rounded-xl bg-rose-950/30 hover:bg-rose-900 text-rose-400 text-xs flex items-center justify-center transition-all border border-rose-900/30" title="Eliminar de Supabase">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};

window.loadLawAndSwitchToCompiler = async function(lawId) {
    window.switchStudioTab('compiler');
    await window.loadLawFromDatabase(lawId);
};

// =============================================================================
// 3. GESTOR DE ENTRADA, EXTRACCIÓN DE PDF / DOCX Y DRAG & DROP
// =============================================================================
window.handleStudioDragOver = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('studio-dropzone');
    if (dropzone) {
        dropzone.classList.add('border-emerald-500', 'bg-emerald-950/20');
    }
};

window.handleStudioDragLeave = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('studio-dropzone');
    if (dropzone) {
        dropzone.classList.remove('border-emerald-500', 'bg-emerald-950/20');
    }
};

window.handleStudioDrop = async function(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('studio-dropzone');
    if (dropzone) {
        dropzone.classList.remove('border-emerald-500', 'bg-emerald-950/20');
    }

    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        await window.processSelectedFile(file);
    }
};

window.handleStudioFileSelect = async function(e) {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        await window.processSelectedFile(file);
    }
};

window.processSelectedFile = async function(file) {
    const fileName = file.name;
    const ext = fileName.split('.').pop().toLowerCase();

    // Auto-completar nombre de ley a partir del nombre del archivo si está vacío
    const nameInput = document.getElementById('law-name-input');
    if (!nameInput.value) {
        const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
        nameInput.value = cleanName.toUpperCase();
        window.updateLawMetadataState();
    }

    if (ext === 'json') {
        const text = await file.text();
        window.importStudioJSON(text);
        return;
    }

    window.showToastNotification(`Leyendo y procesando "${fileName}"...`);

    try {
        let extractedText = '';

        if (ext === 'pdf') {
            const arrayBuffer = await file.arrayBuffer();
            extractedText = await window.extractTextFromPDF(arrayBuffer);
        } else if (ext === 'docx' || ext === 'doc') {
            const arrayBuffer = await file.arrayBuffer();
            extractedText = await window.extractTextFromDOCX(arrayBuffer);
        } else {
            extractedText = await file.text();
        }

        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error("No se pudo extraer texto del archivo o el documento es una imagen escaneada sin capa de texto.");
        }

        document.getElementById('raw-source-text').value = extractedText;

        // Limpieza automática inicial
        window.cleanPdfLineBreaks();
        window.cleanHyphenatedWords();
        window.cleanExtraSpaces();
        window.updateSourceMetrics();

        // Detectar metadatos y segmentar automáticamente
        window.handleSourceTextInput();
        window.executeEduconvertEngine();

    } catch (err) {
        console.error("Error al procesar archivo:", err);
        alert(`Error al procesar "${fileName}": ${err.message}`);
    }
};

// Extractor nativo de texto PDF usando PDF.js
window.extractTextFromPDF = async function(arrayBuffer) {
    if (typeof pdfjsLib === 'undefined') {
        throw new Error("Librería PDF.js no disponible en el navegador.");
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    let fullDocumentText = '';

    const statusBadge = document.getElementById('studio-status-indicator');

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (statusBadge) {
            statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> <span class="text-[10px] text-amber-400">Extrayendo pág. ${pageNum}/${numPages}</span>`;
        }

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const items = textContent.items;

        if (!items || items.length === 0) continue;

        let lastY = null;
        let pageText = '';

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const currentY = item.transform[5];

            if (lastY === null || Math.abs(currentY - lastY) > 5) {
                pageText += '\n' + item.str;
            } else {
                pageText += (item.str.startsWith(' ') || pageText.endsWith(' ') ? '' : ' ') + item.str;
            }
            lastY = currentY;
        }

        // Limpiar cabeceras típicas del Diario Oficial de El Salvador
        pageText = pageText.replace(/DIARIO\s+OFICIAL\s*[-–—]\s*Tomo\s*N[°ºo\.]*\s*\d+/gi, '')
                           .replace(/San\s+Salvador,\s*\d+\s*de\s+[a-zñA-ZÑ]+\s+de\s+\d+/gi, '')
                           .replace(/NÚMERO\s+\d+/gi, '')
                           .replace(/\b\d+\s+DIARIO\s+OFICIAL\b/gi, '');

        fullDocumentText += '\n\n' + pageText;
    }

    if (statusBadge) {
        statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> <span class="text-[10px] text-emerald-400 font-bold">Documento Extraído</span>`;
    }

    return fullDocumentText.trim();
};

// Extractor de texto Word DOCX usando Mammoth.js
window.extractTextFromDOCX = async function(arrayBuffer) {
    if (typeof mammoth === 'undefined') {
        throw new Error("Librería Mammoth.js no disponible.");
    }
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value || '';
};

window.handleSourceTextInput = function() {
    window.updateSourceMetrics();

    // Auto-detección inteligente del nombre si está vacío
    const nameInput = document.getElementById('law-name-input');
    const decretoInput = document.getElementById('law-decreto-input');
    const text = document.getElementById('raw-source-text').value.trim();

    if (text && (!nameInput.value || !decretoInput.value)) {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        for (let i = 0; i < Math.min(lines.length, 6); i++) {
            const line = lines[i];
            if (!decretoInput.value && /(?:DECRETO|D\.L\.|DEC\.)\s*(?:N[°o\.]*|NUMERO)?\s*([0-9]+(?:\s*\/[0-9]+)?)/i.test(line)) {
                decretoInput.value = line;
            }
            if (!nameInput.value && /(?:LEY|CÓDIGO|CODIGO|REGLAMENTO)\s+DE\s+/i.test(line)) {
                nameInput.value = line;
            }
        }
        window.updateLawMetadataState();
    }
};

window.updateSourceMetrics = function() {
    const text = document.getElementById('raw-source-text')?.value || '';
    const badge = document.getElementById('source-metrics-badge');
    if (badge) {
        const charCount = text.length;
        const lineCount = text ? text.split('\n').length : 0;
        const artMatches = (text.match(/(?:^|\n)(?:Art\.|Artículo|Articulo)\s*[0-9]+/gi) || []).length;
        badge.innerText = `${lineCount} líneas • ${charCount.toLocaleString()} caracteres • ~${artMatches} artículos detectados`;
    }
};

window.clearSourceText = function() {
    if (confirm("¿Deseas limpiar el texto fuente y los artículos procesados?")) {
        document.getElementById('raw-source-text').value = '';
        document.getElementById('law-name-input').value = '';
        document.getElementById('law-decreto-input').value = '';
        document.getElementById('law-abbrev-input').value = '';
        window.studioArticles = [];
        window.updateSourceMetrics();
        window.renderStudioArticles();
        window.checkIntegrity();
    }
};

window.updateLawMetadataState = function() {
    const name = document.getElementById('law-name-input').value.trim();
    const decreto = document.getElementById('law-decreto-input').value.trim();
    const abbrev = document.getElementById('law-abbrev-input').value.trim();
    const cat = document.getElementById('law-cat-input').value;
    const date = document.getElementById('law-date-input').value;

    const lawId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'ley-oficial';

    window.studioLawData = {
        id: lawId,
        nombre: name,
        abreviatura: abbrev,
        decreto_numero: decreto,
        categoria: cat,
        fecha_publicacion: date || new Date().toISOString().split('T')[0],
        descripcion: `Legislación oficial de El Salvador estructurada con EduConvert Studio.`
    };

    const breadcrumbEl = document.getElementById('current-law-breadcrumb');
    if (breadcrumbEl) {
        breadcrumbEl.innerText = name || 'Nueva Ley';
    }
};

// =============================================================================
// 4. HERRAMIENTAS DE LIMPIEZA AUTOMÁTICA DE TEXTO
// =============================================================================
window.cleanPdfLineBreaks = function() {
    const textarea = document.getElementById('raw-source-text');
    if (!textarea || !textarea.value) return;

    let text = textarea.value;
    text = text.replace(/([^\.\:\;\n])\r?\n(?!\r?\n|[A-Z0-9\-\.]{1,8}\s*[\.\-]|Art\.|Artículo|Articulo|CAPÍTULO|CAPITULO|TÍTULO|TITULO|SECCIÓN|SECCION|LIBRO)/gi, '$1 ');
    textarea.value = text;
    window.updateSourceMetrics();
    window.showToastNotification("Saltos de línea de PDF reparados.");
};

window.cleanHyphenatedWords = function() {
    const textarea = document.getElementById('raw-source-text');
    if (!textarea || !textarea.value) return;

    let text = textarea.value;
    text = text.replace(/([a-záéíóúñA-ZÁÉÍÓÚÑ])\s*[-–—]\s*\r?\n\s*([a-záéíóúñA-ZÁÉÍÓÚÑ])/gi, '$1$2');
    textarea.value = text;
    window.updateSourceMetrics();
    window.showToastNotification("Palabras cortadas con guion unificadas.");
};

window.cleanExtraSpaces = function() {
    const textarea = document.getElementById('raw-source-text');
    if (!textarea || !textarea.value) return;

    let text = textarea.value;
    text = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
    textarea.value = text.trim();
    window.updateSourceMetrics();
    window.showToastNotification("Espacios dobles y redundancias eliminadas.");
};

// =============================================================================
// 5. MOTOR INTELIGENTE DE SEGMENTACIÓN (EDUCONVERT ENGINE)
// =============================================================================
window.executeEduconvertEngine = function() {
    const textarea = document.getElementById('raw-source-text');
    if (!textarea || !textarea.value.trim()) {
        alert("Por favor pega o carga el texto fuente de la ley en el panel izquierdo.");
        return;
    }

    window.updateLawMetadataState();
    const sourceText = textarea.value;
    const lines = sourceText.split(/\r?\n/);

    let currentTitulo = '';
    let currentCapitulo = '';
    let currentSeccion = '';
    let parsedArticles = [];

    const tituloPattern = /^(?:TÍTULO|TITULO|LIBRO)\s+([IVXLCDM0-9]+(?:\s*[-–—:]\s*.*)?)/i;
    const capituloPattern = /^(?:CAPÍTULO|CAPITULO)\s+([IVXLCDM0-9]+(?:\s*[-–—:]\s*.*)?)/i;
    const seccionPattern = /^(?:SECCIÓN|SECCION)\s+([IVXLCDM0-9]+(?:\s*[-–—:]\s*.*)?)/i;
    const articleHeaderPattern = /^(?:Art\.|Artículo|Articulo)\s*([0-9]+(?:\s*-[A-Za-z0-9]+)?|[0-9]+[°o\.]?)\s*[\.\-–—\s]*(.*)/i;

    let activeArticle = null;
    let orderCounter = 1;

    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i].trim();
        if (!rawLine) continue;

        // Detectar Título / Libro
        const tMatch = rawLine.match(tituloPattern);
        if (tMatch) {
            currentTitulo = rawLine;
            continue;
        }

        // Detectar Capítulo
        const cMatch = rawLine.match(capituloPattern);
        if (cMatch) {
            currentCapitulo = rawLine;
            continue;
        }

        // Detectar Sección
        const sMatch = rawLine.match(seccionPattern);
        if (sMatch) {
            currentSeccion = rawLine;
            continue;
        }

        // Detectar Artículo
        const aMatch = rawLine.match(articleHeaderPattern);
        if (aMatch) {
            if (activeArticle) {
                activeArticle.texto = activeArticle.texto.trim();
                parsedArticles.push(activeArticle);
            }

            const num = aMatch[1].replace(/[^0-9A-Za-z\-]/g, '').trim();
            const restOfLine = aMatch[2] ? aMatch[2].trim() : '';

            activeArticle = {
                id: `${window.studioLawData.id || 'ley'}-art-${num}`,
                ley_id: window.studioLawData.id || 'ley',
                numero: num,
                titulo_seccion: currentTitulo,
                capitulo_seccion: currentCapitulo,
                seccion: currentSeccion,
                texto: restOfLine,
                orden: orderCounter++
            };
        } else {
            // Línea de cuerpo del artículo
            if (activeArticle) {
                activeArticle.texto += (activeArticle.texto ? '\n\n' : '') + rawLine;
            }
        }
    }

    if (activeArticle) {
        activeArticle.texto = activeArticle.texto.trim();
        parsedArticles.push(activeArticle);
    }

    // Fallback con Regex global si la segmentación lineal no detectó suficientes artículos
    if (parsedArticles.length === 0) {
        const blockRegex = /(?:^|\n)(?:Art\.|Artículo|Articulo)\s*([0-9]+(?:\s*-[A-Za-z0-9]+)?|[0-9]+[°o\.]?)\s*[\.\-–—\s]+([\s\S]*?)(?=(?:\n(?:Art\.|Artículo|Articulo)\s*[0-9]+)|$)/gi;
        let bMatch;
        let bOrder = 1;
        while ((bMatch = blockRegex.exec(sourceText)) !== null) {
            const num = bMatch[1].replace(/[^0-9A-Za-z\-]/g, '').trim();
            parsedArticles.push({
                id: `${window.studioLawData.id || 'ley'}-art-${num}`,
                ley_id: window.studioLawData.id || 'ley',
                numero: num,
                titulo_seccion: '',
                capitulo_seccion: '',
                seccion: '',
                texto: bMatch[2].trim(),
                orden: bOrder++
            });
        }
    }

    window.studioArticles = parsedArticles;
    window.renderStudioArticles();
    window.checkIntegrity();
    window.showToastNotification(`Se estructuraron ${parsedArticles.length} artículos.`);
};

// =============================================================================
// 6. RENDERIZADO Y EDICIÓN EN CALIENTE DE ARTÍCULOS
// =============================================================================
window.renderStudioArticles = function() {
    const container = document.getElementById('parsed-articles-container');
    const badge = document.getElementById('parsed-count-badge');
    if (!container) return;

    const query = (window.activeFilterQuery || '').toLowerCase().trim();
    const filtered = window.studioArticles.filter(art => {
        if (!query) return true;
        return art.numero.toLowerCase().includes(query) ||
               (art.texto && art.texto.toLowerCase().includes(query)) ||
               (art.capitulo_seccion && art.capitulo_seccion.toLowerCase().includes(query));
    });

    if (badge) badge.innerText = `${window.studioArticles.length} Artículos`;

    if (window.studioArticles.length === 0) {
        container.innerHTML = `
            <div class="py-24 text-center text-slate-500 flex flex-col items-center justify-center">
                <div class="w-16 h-16 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-center text-slate-600 text-2xl mb-3">
                    <i class="fas fa-file-circle-check"></i>
                </div>
                <h4 class="text-sm font-bold text-slate-300">Ningún artículo procesado todavía</h4>
                <p class="text-xs text-slate-500 mt-1 max-w-sm">Pega o sube el texto de la ley en el panel izquierdo y presiona "Segmentar y Compilar Artículos".</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map((art) => {
        const originalIndex = window.studioArticles.indexOf(art);
        return `
            <div class="article-card-item p-4 space-y-3 bg-[#0c0d10] border border-white/5 rounded-2xl shadow-md transition-all hover:border-emerald-500/30" id="art-card-${originalIndex}">
                <div class="flex items-center justify-between gap-2 pb-2 border-b border-white/5">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 tabular-nums font-black text-xs border border-emerald-500/30">
                            Art. ${art.numero}
                        </span>
                        <input type="text" value="${art.capitulo_seccion || ''}" onchange="window.updateArticleCapitulo(${originalIndex}, this.value)" placeholder="Capítulo / Sección..." class="bg-[#14151a] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 w-44 sm:w-64 focus:border-emerald-500 focus:outline-none">
                    </div>
                    <div class="flex items-center gap-1">
                        <button onclick="window.duplicateArticle(${originalIndex})" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center justify-center transition-colors" title="Duplicar artículo">
                            <i class="fas fa-clone"></i>
                        </button>
                        <button onclick="window.deleteArticle(${originalIndex})" class="w-7 h-7 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-400 text-xs flex items-center justify-center transition-colors" title="Eliminar artículo">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                <div>
                    <textarea oninput="window.updateArticleText(${originalIndex}, this.value)" rows="3" class="w-full bg-[#14151a] border border-white/10 rounded-xl p-3 text-xs leading-relaxed text-slate-200 resize-y focus:outline-none focus:border-emerald-500/60 placeholder-slate-600 font-sans">${art.texto || ''}</textarea>
                </div>
            </div>
        `;
    }).join('');
};

window.updateArticleText = function(idx, text) {
    if (window.studioArticles[idx]) {
        window.studioArticles[idx].texto = text;
    }
};

window.updateArticleCapitulo = function(idx, cap) {
    if (window.studioArticles[idx]) {
        window.studioArticles[idx].capitulo_seccion = cap;
    }
};

window.deleteArticle = function(idx) {
    if (confirm(`¿Eliminar el Artículo ${window.studioArticles[idx]?.numero}?`)) {
        window.studioArticles.splice(idx, 1);
        window.renderStudioArticles();
        window.checkIntegrity();
    }
};

window.duplicateArticle = function(idx) {
    const current = window.studioArticles[idx];
    if (current) {
        const copy = JSON.parse(JSON.stringify(current));
        copy.numero = copy.numero + '-BIS';
        copy.id = `${window.studioLawData.id}-art-${copy.numero}`;
        window.studioArticles.splice(idx + 1, 0, copy);
        window.renderStudioArticles();
        window.checkIntegrity();
    }
};

window.addNewBlankArticle = function() {
    const nextNum = window.studioArticles.length + 1;
    window.studioArticles.push({
        id: `${window.studioLawData.id || 'ley'}-art-${nextNum}`,
        ley_id: window.studioLawData.id || 'ley',
        numero: String(nextNum),
        titulo_seccion: '',
        capitulo_seccion: '',
        seccion: '',
        texto: 'Texto del nuevo artículo...',
        orden: nextNum
    });
    window.renderStudioArticles();
    window.checkIntegrity();
};

window.filterParsedArticles = function() {
    window.activeFilterQuery = document.getElementById('filter-parsed-input')?.value || '';
    window.renderStudioArticles();
};

// =============================================================================
// 7. AUDITOR DE INTEGRIDAD NUMÉRICA
// =============================================================================
window.checkIntegrity = function() {
    const alertBox = document.getElementById('integrity-alert-box');
    const alertText = document.getElementById('integrity-alert-text');
    if (!alertBox || window.studioArticles.length === 0) {
        if (alertBox) alertBox.classList.add('hidden');
        return;
    }

    const missing = [];
    for (let i = 0; i < window.studioArticles.length; i++) {
        const currentNum = parseInt(window.studioArticles[i].numero, 10);
        if (!isNaN(currentNum) && i > 0) {
            const prevNum = parseInt(window.studioArticles[i - 1].numero, 10);
            if (!isNaN(prevNum) && currentNum > prevNum + 1) {
                missing.push(`del Art. ${prevNum} al Art. ${currentNum}`);
            }
        }
    }

    if (missing.length > 0) {
        alertBox.classList.remove('hidden');
        if (alertText) alertText.innerText = `Posible omisión de artículos: salto ${missing.slice(0, 2).join(', ')}.`;
    } else {
        alertBox.classList.add('hidden');
    }
};

window.autoRenumberArticles = function() {
    if (confirm("¿Deseas renumerar correlativamente todos los artículos del 1 al " + window.studioArticles.length + "?")) {
        window.studioArticles.forEach((art, idx) => {
            art.numero = String(idx + 1);
            art.orden = idx + 1;
            art.id = `${window.studioLawData.id || 'ley'}-art-${idx + 1}`;
        });
        window.renderStudioArticles();
        window.checkIntegrity();
        window.showToastNotification("Artículos renumerados correlativamente.");
    }
};

// =============================================================================
// 8. IMPORTADOR Y EXPORTADOR JSON COHERENTE
// =============================================================================
window.importStudioJSON = function(jsonContent) {
    try {
        const parsed = JSON.parse(jsonContent);

        let meta = parsed.ley || parsed.metadata || parsed;
        if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
            document.getElementById('law-name-input').value = meta.nombre || meta.titulo || '';
            document.getElementById('law-decreto-input').value = meta.decreto_numero || meta.decreto || '';
            document.getElementById('law-abbrev-input').value = meta.abreviatura || meta.siglas || '';
            document.getElementById('law-cat-input').value = meta.categoria || 'Aduanas y Tributos';
            if (meta.fecha_publicacion) {
                document.getElementById('law-date-input').value = meta.fecha_publicacion.split('T')[0];
            }
            window.updateLawMetadataState();
        }

        const rawArticles = parsed.articulos || parsed.articles || (Array.isArray(parsed) ? parsed : []);

        if (!Array.isArray(rawArticles) || rawArticles.length === 0) {
            throw new Error("No se encontraron artículos válidos en el archivo JSON.");
        }

        window.studioArticles = rawArticles.map((art, idx) => {
            const num = String(art.numero || art.num || (idx + 1));
            let texto = art.texto || art.contenido || '';
            if (!texto && Array.isArray(art.parrafos)) {
                texto = art.parrafos.join('\n\n');
            }
            return {
                id: `${window.studioLawData.id || 'ley'}-art-${num}`,
                ley_id: window.studioLawData.id || 'ley',
                numero: num,
                titulo_seccion: art.titulo_seccion || art.titulo || '',
                capitulo_seccion: art.capitulo_seccion || art.capitulo || '',
                seccion: art.seccion || '',
                texto: texto,
                orden: art.orden || (idx + 1)
            };
        });

        let reconstructed = '';
        window.studioArticles.forEach(a => {
            reconstructed += `Art. ${a.numero}.- ${a.texto}\n\n`;
        });
        document.getElementById('raw-source-text').value = reconstructed.trim();

        window.updateSourceMetrics();
        window.renderStudioArticles();
        window.checkIntegrity();
        window.showToastNotification(`JSON importado: ${window.studioArticles.length} artículos.`);

    } catch (e) {
        console.error("Error importando JSON:", e);
        alert("Error al importar archivo JSON: " + e.message);
    }
};

window.exportStudioJSON = function() {
    window.updateLawMetadataState();

    if (window.studioArticles.length === 0) {
        alert("No hay artículos estructurados para exportar.");
        return;
    }

    const exportedArticles = window.studioArticles.map((art, idx) => ({
        id: `${window.studioLawData.id}-art-${art.numero}`,
        ley_id: window.studioLawData.id,
        numero: art.numero,
        titulo_seccion: art.titulo_seccion || '',
        capitulo_seccion: art.capitulo_seccion || '',
        seccion: art.seccion || '',
        texto: art.texto,
        parrafos: art.texto.split(/\n\n+/).map(p => p.trim()).filter(Boolean),
        orden: idx + 1
    }));

    const payload = {
        ley: window.studioLawData,
        articulos: exportedArticles,
        export_date: new Date().toISOString(),
        version: "EduConvert Studio 2.8",
        compatibility: "EduConta SV Official"
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${window.studioLawData.id || 'ley'}_educonvert.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    window.showToastNotification("Archivo JSON exportado con éxito.");
};

// =============================================================================
// 9. PUBLICACIÓN DIRECTA EN SUPABASE
// =============================================================================
window.publishDirectToEduconta = async function() {
    window.updateLawMetadataState();

    if (!window.studioLawData.nombre) {
        alert("Por favor ingresa el Nombre Oficial de la Ley.");
        return;
    }

    if (window.studioArticles.length === 0) {
        alert("No hay artículos estructurados para publicar.");
        return;
    }

    if (!window.supabaseClient) {
        alert("Cliente de Supabase no disponible. Verifica la conexión.");
        return;
    }

    const btn = document.getElementById('btn-studio-publish');
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Sincronizando...</span>';
        }

        // 1. Guardar o actualizar la ley
        const { error: leyErr } = await window.supabaseClient
            .from('leyes')
            .upsert([window.studioLawData], { onConflict: 'id' });

        if (leyErr) throw leyErr;

        // 2. Eliminar artículos previos para evitar duplicados si se renumeraron
        await window.supabaseClient
            .from('articulos')
            .delete()
            .eq('ley_id', window.studioLawData.id);

        // 3. Normalizar artículos con array de párrafos (para visor-ley.html)
        const formattedArticles = window.studioArticles.map((art, idx) => ({
            id: `${window.studioLawData.id}-art-${art.numero}`,
            ley_id: window.studioLawData.id,
            numero: art.numero,
            titulo_seccion: art.titulo_seccion || '',
            capitulo_seccion: art.capitulo_seccion || '',
            seccion: art.seccion || '',
            texto: art.texto,
            parrafos: art.texto.split(/\n\n+/).map(p => p.trim()).filter(Boolean),
            orden: idx + 1
        }));

        // 4. Guardar artículos en lotes de 100
        const CHUNK_SIZE = 100;
        for (let i = 0; i < formattedArticles.length; i += CHUNK_SIZE) {
            const chunk = formattedArticles.slice(i, i + CHUNK_SIZE);
            const { error: artErr } = await window.supabaseClient
                .from('articulos')
                .upsert(chunk, { onConflict: 'id' });

            if (artErr) throw artErr;
        }

        if (typeof window.showAlert === 'function') {
            window.showAlert("¡Ley Publicada con Éxito!", `La ley "${window.studioLawData.nombre}" con ${formattedArticles.length} artículos ya está sincronizada en Supabase y lista para los alumnos.`);
        } else {
            alert(`¡Éxito! La ley "${window.studioLawData.nombre}" con ${formattedArticles.length} artículos ha sido publicada en EduConta SV.`);
        }

        window.closePreviewModal();
        await window.loadExistingLawsCatalog();

    } catch (e) {
        console.error("Error al publicar directamente:", e);
        alert("Error al publicar ley en Supabase: " + e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-cloud-arrow-up"></i> <span>Publicar en Supabase</span>';
        }
    }
};

// =============================================================================
// 10. MODAL DE PREVISUALIZACIÓN (SIMULADOR DE VISOR-LEY)
// =============================================================================
window.openPreviewModal = function() {
    window.updateLawMetadataState();
    const modal = document.getElementById('studio-preview-modal');
    const titleEl = document.getElementById('modal-preview-title');
    const metaEl = document.getElementById('modal-preview-meta');
    const bodyEl = document.getElementById('modal-preview-body');

    if (!modal) return;

    titleEl.innerText = window.studioLawData.nombre || 'Ley sin título';
    metaEl.innerText = `${window.studioLawData.decreto_numero || 'Decreto Oficial'} • ${window.studioArticles.length} Artículos estructurados • Categoría: ${window.studioLawData.categoria}`;

    if (window.studioArticles.length === 0) {
        bodyEl.innerHTML = `<p class="text-center py-16 text-slate-500 font-bold">No hay artículos estructurados todavía.</p>`;
    } else {
        bodyEl.innerHTML = window.studioArticles.map(art => `
            <article class="p-5 rounded-2xl bg-[#14151a] border border-white/5 space-y-2">
                <div class="flex items-center justify-between text-xs font-bold text-emerald-400 pb-2 border-b border-white/5">
                    <span class="tabular-nums font-bold">Art. ${art.numero}</span>
                    <span class="text-slate-500 uppercase text-[10px]">${art.capitulo_seccion || ''}</span>
                </div>
                <div class="text-xs text-slate-300 leading-relaxed pt-1 whitespace-pre-line font-sans">
                    ${art.texto}
                </div>
            </article>
        `).join('');
    }

    modal.style.display = 'flex';
};

window.closePreviewModal = function() {
    const modal = document.getElementById('studio-preview-modal');
    if (modal) modal.style.display = 'none';
};

// =============================================================================
// 11. NOTIFICACIONES TOAST
// =============================================================================
window.showToastNotification = function(msg) {
    const existing = document.getElementById('studio-toast-el');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'studio-toast-el';
    toast.className = 'fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs shadow-2xl flex items-center gap-2 transition-all';
    toast.innerHTML = `<i class="fas fa-check-circle text-sm"></i> <span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 2800);
};

// Copiar código SQL
window.copySQLSchema = function() {
    const code = document.getElementById('sql-schema-code')?.innerText;
    if (code) {
        navigator.clipboard.writeText(code).then(() => {
            window.showToastNotification("Esquema SQL copiado al portapapeles.");
        });
    }
};
