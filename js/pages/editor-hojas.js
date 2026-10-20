// ==========================================
// HOJAS / LIENZO UNIVERSAL ENGINE — EduConta SV
// ==========================================

let projects = [];
let proyecto_actual = null;
let activeSheetIndex = 0;

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (typeof injectSharedUI === 'function') {
            injectSharedUI('shared-components-root');
        }
    } catch (e) {}

    // Cargar datos de LocalStorage
    const rawProjects = localStorage.getItem('educonta_projects_hojas');
    let lastProjectId = localStorage.getItem('educonta_last_project_id');
    
    if (rawProjects) {
        projects = JSON.parse(rawProjects);
    }
    
    if (projects.length > 0) {
        proyecto_actual = projects.find(p => p.id === lastProjectId);
        if (!proyecto_actual) {
            proyecto_actual = projects[0];
            localStorage.setItem('educonta_last_project_id', proyecto_actual.id);
        }
    }
    
    if (!proyecto_actual) {
        const defaultProj = {
            id: 'proj_documents_default',
            name: 'Mis Documentos',
            type: 'hojas',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sheets: [
                {
                    name: 'Documento Inicial',
                    template_id: null,
                    blocks: [
                        {
                            id: 'b_' + Date.now() + '_init',
                            type: 'h2',
                            content: 'Documento en Blanco'
                        },
                        {
                            id: 'b_' + Date.now() + '_init_text',
                            type: 'text',
                            content: 'Comienza a redactar tu carta, solicitud o contrato aquí. Puedes insertar tablas reactivas o diagramas de flujos desde la barra de herramientas superior.'
                        }
                    ]
                }
            ]
        };
        projects = [defaultProj];
        localStorage.setItem('educonta_projects_hojas', JSON.stringify(projects));
        localStorage.setItem('educonta_last_project_id', defaultProj.id);
        proyecto_actual = defaultProj;
    }
    
    if (!proyecto_actual) {
        window.location.href = 'index.html';
        return;
    }

    // Asegurar estructura de sheets
    if (!proyecto_actual.sheets || proyecto_actual.sheets.length === 0) {
        proyecto_actual.sheets = [
            {
                name: 'Documento Inicial',
                template_id: null,
                blocks: [
                    {
                        id: 'b_' + Date.now() + '_init',
                        type: 'h2',
                        content: 'Documento en Blanco'
                    },
                    {
                        id: 'b_' + Date.now() + '_init_text',
                        type: 'text',
                        content: 'Comienza a redactar tu carta, solicitud o contrato aquí. Puedes insertar tablas reactivas o diagramas de flujos desde la barra de herramientas superior.'
                    }
                ]
            }
        ];
    }

    // Inicializar títulos en cabecera
    document.getElementById('current-project-name').innerText = proyecto_actual.name || 'Sin Nombre';

    activeSheetIndex = 0;
    renderSheetSelect();
    loadActiveSheet();
    if (proyecto_actual) {
        window.activarSincronizacionTiempoReal(proyecto_actual.id);
    }
    if (typeof window.dismissGlobalPreloader === 'function') {
        window.dismissGlobalPreloader();
    }
});

// === CONTROL DE HOJAS / DOCUMENTOS DEL PROYECTO ===
function renderSheetSelect() {
    const select = document.getElementById('hojas-sheet-select');
    if (!select) return;
    select.innerHTML = '';
    proyecto_actual.sheets.forEach((sheet, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = sheet.name;
        if (idx === activeSheetIndex) opt.selected = true;
        select.appendChild(opt);
    });
    if (typeof window.refreshEduContaGlassSelects === 'function') {
        window.refreshEduContaGlassSelects();
    }
}

window.switchHojasSheet = function(idx) {
    // Sincronizar cambios en pantalla de la hoja actual antes de cambiar
    if (window.canvasManager && canvasManager.activeDoc) {
        canvasManager.syncActiveBlocksData();
    }
    
    activeSheetIndex = parseInt(idx);
    loadActiveSheet();
};

function loadActiveSheet() {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    // Configurar el título del documento en el input
    const titleInput = document.getElementById('canvas-doc-title');
    if (titleInput) {
        titleInput.value = sheet.name || 'Documento Sin Título';
    }

    // Cargar en el gestor del lienzo
    window.canvasManager.activeDoc = {
        id: 'sheet_' + activeSheetIndex,
        title: sheet.name || 'Documento Sin Título',
        template_id: sheet.template_id || null,
        blocks: sheet.blocks || []
    };

    window.canvasManager.renderActiveDocument();
}

// === DIÁLOGOS DE NUEVA / BORRAR HOJA ===
window.openNewSheetModal = function() {
    if (window.isAuditMode) return;
    document.getElementById('sheet-input-name').value = '';
    document.getElementById('sheet-modal').style.display = 'flex';
};

window.closeSheetModal = function() {
    const md = document.getElementById('sheet-modal');
    if (md) {
        md.classList.add('closing');
        setTimeout(() => {
            md.style.display = 'none';
            md.classList.remove('closing');
        }, 300);
    }
};

window.saveNewSheet = function() {
    if (window.isAuditMode) return;
    const nameInput = document.getElementById('sheet-input-name').value.trim();
    if (!nameInput) return;

    // Sincronizar hoja anterior
    if (window.canvasManager && canvasManager.activeDoc) {
        canvasManager.syncActiveBlocksData();
    }

    proyecto_actual.sheets.push({
        name: nameInput,
        template_id: null,
        blocks: [
            {
                id: 'b_' + Date.now() + '_init',
                type: 'h2',
                content: nameInput
            },
            {
                id: 'b_' + Date.now() + '_init_text',
                type: 'text',
                content: 'Haz doble clic aquí para comenzar a redactar...'
            }
        ]
    });

    saveState();
    activeSheetIndex = proyecto_actual.sheets.length - 1;
    renderSheetSelect();
    loadActiveSheet();
    closeSheetModal();
};

window.confirmDeleteSheet = function() {
    if (window.isAuditMode) return;
    if (proyecto_actual.sheets.length <= 1) {
        alert("No puedes eliminar todos los documentos. Debe quedar al menos uno en el proyecto.");
        return;
    }
    if (confirm(`¿Estás seguro de que deseas eliminar el documento "${proyecto_actual.sheets[activeSheetIndex].name}"?`)) {
        proyecto_actual.sheets.splice(activeSheetIndex, 1);
        activeSheetIndex = 0;
        saveState();
        renderSheetSelect();
        loadActiveSheet();
    }
};

let autoSaveTimer = null;

function triggerAutoSave() {
    if (window.isAuditMode || !proyecto_actual) return;
    if (autoSaveTimer) clearTimeout(autoSaveTimer);

    const saveIndicator = document.getElementById('save-indicator');
    if (saveIndicator) {
        saveIndicator.innerHTML = '<i class="fas fa-circle-notch fa-spin text-xs"></i> GUARDANDO...';
        saveIndicator.className = "flex items-center justify-center gap-1.5 w-full text-amber-600 dark:text-amber-400 font-black bg-amber-50 dark:bg-amber-950/20 rounded-[36px] border border-amber-100 dark:border-amber-900/30";
    }

    autoSaveTimer = setTimeout(() => {
        autoSaveTimer = null;
        saveState(false);
    }, 3000);
}

function flushSaveSyncHojas() {
    if (!proyecto_actual || window.isAuditMode) return;
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }
    if (window.canvasManager && typeof window.canvasManager.syncActiveBlocksData === 'function') {
        window.canvasManager.syncActiveBlocksData();
    }
    proyecto_actual.updatedAt = new Date().toISOString();
    const idx = projects.findIndex(p => p.id === proyecto_actual.id);
    if (idx !== -1) {
        projects[idx] = proyecto_actual;
    } else {
        projects.unshift(proyecto_actual);
    }
    localStorage.setItem('educonta_projects_hojas', JSON.stringify(projects));
}

// === CERRAR PROYECTO ===
window.closeProject = function() {
    flushSaveSyncHojas();
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'documentos.html';
    }
};

// === PERSISTENCIA LOCAL Y NUBE ===
async function saveState(isManual = false) {
    if (!proyecto_actual || window.isAuditMode) return;
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }
    if (window.canvasManager && typeof window.canvasManager.syncActiveBlocksData === 'function') {
        window.canvasManager.syncActiveBlocksData();
    }
    proyecto_actual.updatedAt = new Date().toISOString();

    // Guardar en la lista global de proyectos
    const idx = projects.findIndex(p => p.id === proyecto_actual.id);
    if (idx !== -1) {
        projects[idx] = proyecto_actual;
    } else {
        projects.unshift(proyecto_actual);
    }

    localStorage.setItem('educonta_projects_hojas', JSON.stringify(projects));

    const saveIndicator = document.getElementById('save-indicator');
    const cloudIndicator = document.getElementById('cloud-indicator');

    if (saveIndicator) {
        saveIndicator.innerHTML = '<i class="fas fa-check-circle"></i> LOCAL';
        saveIndicator.className = "flex items-center justify-center gap-1.5 w-full text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-950/20 rounded-[36px] border border-emerald-100 dark:border-emerald-900/30";
    }

    if (!navigator.onLine) {
        if (typeof updateSyncUI === 'function') updateSyncUI('offline');
        if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('offline');
        return;
    }

    // Sincronizar en la nube si hay sesión
    if (typeof supabaseClient !== 'undefined') {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession().catch(() => ({ data: { session: null } }));
            if (session) {
                if (typeof updateSyncUI === 'function') updateSyncUI('syncing');
                
                if (typeof window.syncCurrentProjectWithSupabase === 'function') {
                    await window.syncCurrentProjectWithSupabase(proyecto_actual, session.user.id, true);
                }

                if (typeof updateSyncUI === 'function') updateSyncUI('success');
                if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('success', 'Documento respaldado con éxito');
            } else {
                if (typeof updateSyncUI === 'function') updateSyncUI('local');
                if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('local', 'Documento guardado en este equipo');
            }
        } catch (e) {
            console.error("Error sincronizando Hojas:", e);
            const errMsg = e.message || String(e);
            if (typeof updateSyncUI === 'function') updateSyncUI('error', errMsg);
            if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('error', errMsg);
        }
    } else {
        if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('local', 'Documento guardado en este equipo');
    }
}

window.addEventListener('beforeunload', () => {
    flushSaveSyncHojas();
});

window.addEventListener('pagehide', () => {
    flushSaveSyncHojas();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        flushSaveSyncHojas();
    }
});

window.updateSyncUI = function(state, detail = "") {
    const saveIndicator = document.getElementById('save-indicator');
    const cloudIndicator = document.getElementById('cloud-indicator');

    if (saveIndicator) {
        saveIndicator.innerHTML = '<i class="fas fa-check-circle"></i> LOCAL';
        saveIndicator.className = "flex items-center justify-center gap-1.5 w-full text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-950/20 rounded-[36px] border border-emerald-100 dark:border-emerald-900/30";
    }

    if (!cloudIndicator) return;

    if (!navigator.onLine && state !== 'offline') {
        state = 'offline';
    }

    if (state === 'syncing') {
        cloudIndicator.className = "flex items-center justify-center gap-1.5 w-full text-sky-600 dark:text-sky-400 font-black bg-sky-50 dark:bg-sky-950/20 rounded-[36px] border border-sky-100 dark:border-sky-900/30 animate-pulse";
        cloudIndicator.innerHTML = '<i class="fas fa-sync fa-spin"></i> <span>SINCRONIZANDO</span>';
    } else if (state === 'success' || state === 'online') {
        cloudIndicator.className = "flex items-center justify-center gap-1.5 w-full text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-950/20 rounded-[36px] border border-emerald-100 dark:border-emerald-900/30";
        cloudIndicator.innerHTML = '<i class="fas fa-cloud-check"></i> <span>SINCRONIZADO</span>';
    } else if (state === 'offline') {
        cloudIndicator.className = "flex items-center justify-center gap-1.5 w-full text-amber-600 dark:text-amber-400 font-black bg-amber-50 dark:bg-amber-950/20 rounded-[36px] border border-amber-100 dark:border-amber-900/30";
        cloudIndicator.innerHTML = '<i class="fas fa-wifi-slash"></i> <span>OFFLINE</span>';
    } else if (state === 'local') {
        cloudIndicator.className = "flex items-center justify-center gap-1.5 w-full text-slate-500 dark:text-slate-400 font-black bg-slate-50 dark:bg-slate-800 rounded-[36px] border border-slate-200 dark:border-slate-700";
        cloudIndicator.innerHTML = '<i class="fas fa-hdd"></i> <span>SOLO LOCAL</span>';
    } else if (state === 'error') {
        cloudIndicator.className = "flex items-center justify-center gap-1.5 w-full text-rose-600 dark:text-rose-450 font-black bg-rose-50 dark:bg-rose-950/20 rounded-[36px] border border-rose-100 dark:border-rose-900/30";
        cloudIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>ERROR SYNC</span>';
    }
};

window.addEventListener('online', () => {
    if (typeof window.showSyncToast === 'function') window.showSyncToast('online');
    if (typeof saveState === 'function') saveState(false);
});
window.addEventListener('offline', () => {
    if (typeof updateSyncUI === 'function') updateSyncUI('offline');
    if (typeof window.showSyncToast === 'function') window.showSyncToast('offline');
});

// Handler de guardado manual desde botón
window.saveActiveCanvas = function() {
    if (window.canvasManager && canvasManager.activeDoc) {
        // Sincronizar título
        const titleInput = document.getElementById('canvas-doc-title');
        if (titleInput) {
            const newTitle = titleInput.value.trim() || 'Documento Sin Título';
            canvasManager.activeDoc.title = newTitle;
            if (proyecto_actual && proyecto_actual.sheets && proyecto_actual.sheets[activeSheetIndex]) {
                proyecto_actual.sheets[activeSheetIndex].name = newTitle;
            }
            if (typeof renderSheetSelect === 'function') renderSheetSelect();
        }
        
        canvasManager.syncActiveBlocksData();
        if (proyecto_actual && proyecto_actual.sheets && proyecto_actual.sheets[activeSheetIndex]) {
            proyecto_actual.sheets[activeSheetIndex].blocks = canvasManager.activeDoc.blocks;
        }
        
        saveState(true);
        
        // Show success animation on the save button
        const btn = document.getElementById('btn-save-canvas');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> ¡Guardado!';
            btn.classList.remove('bg-sky-500', 'hover:bg-sky-600');
            btn.classList.add('bg-emerald-500', 'hover:bg-emerald-600');
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
                btn.classList.add('bg-sky-500', 'hover:bg-sky-600');
            }, 1500);
        }
    }
};

window.forceSave = function(quiet = false) {
    if (typeof window.saveActiveCanvas === 'function') {
        window.saveActiveCanvas();
    } else if (typeof saveState === 'function') {
        saveState(!quiet);
    }
};

// Atajo de teclado para Guardar Manual (Ctrl+S / Cmd+S)
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
        e.preventDefault();
        window.saveActiveCanvas();
    }
});

// === EXPORTAR RESPALDO SHIELD .edc ===
window.exportarProyectoEduConta = function() {
    if (!proyecto_actual) {
        alert('No hay un proyecto activo para exportar.');
        return;
    }

    const nombreProyecto = proyecto_actual.name || 'Proyecto_Hojas';

    const paqueteRespaldo = {
        identificador_app: "EDUCONTA_SV_OFFICIAL",
        version_formato: "1.2",
        metadata: {
            nombre: nombreProyecto,
            fecha: new Date().toISOString(),
            usuario_origen: 'UsuarioLocal',
            catalogo: 'MAESTRO',
            sector: 'ALL'
        },
        cuerpo_contable: proyecto_actual
    };

    // PROCESO DE BLINDADO XOR
    const blindarData = (str) => {
        const key = "EDC_SHIELD_2024";
        let output = "";
        for (let i = 0; i < str.length; i++) {
            output += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(unescape(encodeURIComponent(output)));
    };

    const jsonStr = JSON.stringify(paqueteRespaldo);
    const dataBlindada = blindarData(jsonStr);

    const blob = new Blob([dataBlindada], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombreProyecto.replace(/\s+/g, '_')}_Hojas_${new Date().toISOString().split('T')[0]}.edc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    // Toast
    const toast = document.getElementById('sync-toast');
    if (toast) {
        toast.querySelector('h4').textContent = 'Proyecto Exportado';
        toast.querySelector('p').textContent = `${a.download}`;
        toast.style.background = '#10b981';
        toast.style.borderColor = '#34d399';
        toast.classList.remove('translate-y-32', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-32', 'opacity-0');
        }, 3000);
    }
};


// ==========================================
// CLASE CANVASMANAGER - MOTOR DEL LIENZO
// ==========================================
class CanvasManager {
    constructor() {
        this.activeDoc = null; // { id, title, template_id, blocks: [] }
        this.activeBlockId = null;
        
        // Diagraming state
        this.dragNode = null;
        this.dragOffset = { x: 0, y: 0 };
        this.connectingPort = null; // { nodeId, portName, x, y }
        this.tempLineEnd = null; // { x, y }
        
        // Plantillas globales preconfiguradas
        this.templates = {
            'BTVAC-3.4-RETACEO': {
                title: 'Retaceo de Importaciones y Liquidación',
                category: 'Comercio Internacional',
                description: 'Cálculo automático de CIF/FOB, DAI y prorrateo local de costos.',
                blocks: [
                    {
                        id: 'retaceo-t1',
                        type: 'h2',
                        content: 'Cuadro de Retaceo de Importaciones (Liquidación de DAI)'
                    },
                    {
                        id: 'retaceo-t2',
                        type: 'text',
                        content: 'Este modelo didáctico distribuye proporcionalmente los costos de flete, seguro y otros gastos aduaneros en función del valor FOB de cada artículo importado. Edita los valores de cantidad, precio FOB unitario y DAI % para ver el recálculo.'
                    },
                    {
                        id: 'retaceo-table-1',
                        type: 'table',
                        isRetaceo: true,
                        retaceoConfig: {
                            flete: 1500,
                            seguro: 350,
                            gastos: 800
                        },
                        headers: [
                            'Producto', 'Cantidad', 'FOB Unitario', 'FOB Total', 
                            '% Part.', 'Flete Pror.', 'Seguro Pror.', 'Valor CIF', 
                            'DAI %', 'DAI Local', 'Gastos Aduana', 'Costo Local', 'Unitario Local'
                        ],
                        rows: [
                            ['Laptop Educativa SV', 50, 300, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0],
                            ['Tablets Didácticas', 100, 150, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0],
                            ['Router Industrial WAN', 20, 250, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0]
                        ]
                    }
                ]
            },
            'BTVAC-3.4-PROFORMA': {
                title: 'Cotización Internacional (Factura Proforma)',
                category: 'Comercio Internacional',
                description: 'Modelo de cotización formal con campos Incoterms y términos comerciales.',
                blocks: [
                    {
                        id: 'prof-h1',
                        type: 'h2',
                        content: 'PROFORMA INVOICE / COTIZACIÓN INTERNACIONAL'
                    },
                    {
                        id: 'prof-meta',
                        type: 'text',
                        content: '<strong>Exportador:</strong> EduConta Exportaciones S.A. de C.V. (El Salvador)<br><strong>Importador:</strong> Inversiones Andinas S.A. (Colombia)<br><strong>Incoterm Cotizado:</strong> FOB Puerto de Acajutla (Incoterms 2020)<br><strong>Puerto de Destino:</strong> Puerto de Buenaventura, Colombia<br><strong>Moneda de Pago:</strong> Dólares Americanos (USD)<br><strong>Método de Pago:</strong> Carta de Crédito Confirmada Irrevocable a la vista.'
                    },
                    {
                        id: 'prof-table',
                        type: 'table',
                        headers: ['Descripción de Mercancía', 'Unidad Medida', 'Cantidad', 'Precio Unitario FOB', 'Total FOB'],
                        rows: [
                            ['Café de Altura Premium en Grano', 'Sacos 60kg', 200, 180, 36000],
                            ['Bolsas de Empaque Ecológico', 'Millar', 10, 450, 4500],
                            ['Cajas de Cartón Corrugado', 'Unidades', 1000, 1.2, 1200]
                        ]
                    },
                    {
                        id: 'prof-text-end',
                        type: 'text',
                        content: '<strong>Tiempos de Entrega:</strong> Estimado 15 días posteriores a la confirmación de la carta de crédito. Esta cotización tiene una validez de 30 días calendario.'
                    }
                ]
            },
            'BTVAC-3.4-CARTA-CREDITO': {
                title: 'Operativa de Carta de Crédito Documentaria',
                category: 'Comercio Internacional',
                description: 'Flujo visual entre bancos y borrador de solicitud legal.',
                blocks: [
                    {
                        id: 'cc-h1',
                        type: 'h2',
                        content: 'Flujo y Solicitud de Carta de Crédito'
                    },
                    {
                        id: 'cc-t1',
                        type: 'text',
                        content: 'La Carta de Crédito es el método de pago internacional más seguro. A continuación, el esquema operativo del proceso y la plantilla de solicitud para el banco emisor:'
                    },
                    {
                        id: 'cc-diag-1',
                        type: 'diagram',
                        nodes: [
                            { id: 'n1', type: 'startend', label: 'Importador\n(Comprador SV)', x: 50, y: 50 },
                            { id: 'n2', type: 'startend', label: 'Exportador\n(Vendedor USA)', x: 450, y: 50 },
                            { id: 'n3', type: 'database', label: 'Banco Emisor\n(El Salvador)', x: 50, y: 250 },
                            { id: 'n4', type: 'database', label: 'Banco Corresponsal\n(USA)', x: 450, y: 250 }
                        ],
                        edges: [
                            { id: 'e1', from: 'n1', fromPort: 'right', to: 'n2', toPort: 'left', label: '1. Contrato Comercial' },
                            { id: 'e2', from: 'n1', fromPort: 'bottom', to: 'n3', toPort: 'top', label: '2. Solicitud Apertura' },
                            { id: 'e3', from: 'n3', fromPort: 'right', to: 'n4', toPort: 'left', label: '3. Envío Mensaje MT700' },
                            { id: 'e4', from: 'n4', fromPort: 'top', to: 'n2', toPort: 'bottom', label: '4. Notifica/Confirma' },
                            { id: 'e5', from: 'n2', fromPort: 'left', to: 'n1', toPort: 'right', label: '5. Despacha Mercancía' }
                        ]
                    },
                    {
                        id: 'cc-form',
                        type: 'text',
                        content: '<h3>Borrador de Solicitud de Apertura de Carta de Crédito</h3><p>Al Banco Agrícola de El Salvador:<br>Por este medio solicitamos la apertura de una Carta de Crédito Documentaria Irrevocable por el monto de <strong>$41,700.00 USD</strong> a favor de US Educational Materials Inc.<br><strong>Documentos Requeridos para el Pago:</strong><br>1. Factura Comercial por triplicado.<br>2. Conocimiento de Embarque (Bill of Lading) consignado a la orden del banco.<br>3. Certificado de Origen.</p>'
                    }
                ]
            },
            'BTVAC-3.4-LOGISTICA': {
                title: 'Ruta Logística y Tránsito Aduanero',
                category: 'Comercio Internacional',
                description: 'Mapa de tránsito internacional y tabla de costos de distribución.',
                blocks: [
                    {
                        id: 'log-h1',
                        type: 'h2',
                        content: 'Plan de Ruta Logística Internacional'
                    },
                    {
                        id: 'log-diag',
                        type: 'diagram',
                        nodes: [
                            { id: 'n1', type: 'startend', label: 'Fábrica Origen\n(San Salvador)', x: 30, y: 150 },
                            { id: 'n2', type: 'process', label: 'Aduana Terrestre\n(Frontera)', x: 220, y: 150 },
                            { id: 'n3', type: 'process', label: 'Puerto Marítimo\n(Santo Tomás)', x: 410, y: 50 },
                            { id: 'n4', type: 'process', label: 'Aduana Destino\n(Miami Port)', x: 600, y: 150 }
                        ],
                        edges: [
                            { id: 'e1', from: 'n1', fromPort: 'right', to: 'n2', toPort: 'left', label: 'Camión local (12h)' },
                            { id: 'e2', from: 'n2', fromPort: 'right', to: 'n3', toPort: 'left', label: 'Tránsito local (8h)' },
                            { id: 'e3', from: 'n3', fromPort: 'right', to: 'n4', toPort: 'left', label: 'Flete Marítimo (4 días)' }
                        ]
                    },
                    {
                        id: 'log-table',
                        type: 'table',
                        headers: ['Tramo Logístico', 'Medio de Transporte', 'Tiempo Estimado', 'Costo Unitario (USD)', 'Observaciones'],
                        rows: [
                            ['San Salvador - Santo Tomás', 'Terrestre (Furgón)', '20 horas', 850, 'Incluye trámites de aduana fronteriza'],
                            ['Santo Tomás - Miami Port', 'Marítimo (Contenedor 20\')', '4 días', 1500, 'Tarifa FOB con recargo por combustible'],
                            ['Miami Port - Distribuidor', 'Terrestre local', '4 horas', 250, 'Distribución de última milla']
                        ]
                    }
                ]
            }
        };
    }

    /**
     * Carga una plantilla del catálogo en el lienzo actual
     */
    loadTemplate(templateKey) {
        if (window.isAuditMode || !this.activeDoc) return;
        
        if (!confirm("¿Cargar esta plantilla? Esto reemplazará todo el contenido actual de este documento.")) {
            return;
        }

        const tmpl = this.templates[templateKey];
        if (!tmpl) return;

        // Copia profunda
        const blocksCopy = JSON.parse(JSON.stringify(tmpl.blocks));
        
        this.activeDoc.blocks = blocksCopy;
        this.activeDoc.template_id = templateKey;
        this.activeDoc.title = tmpl.title;

        // Actualizar datos del proyecto
        proyecto_actual.sheets[activeSheetIndex].blocks = blocksCopy;
        proyecto_actual.sheets[activeSheetIndex].template_id = templateKey;
        proyecto_actual.sheets[activeSheetIndex].name = tmpl.title;

        const titleInput = document.getElementById('canvas-doc-title');
        if (titleInput) titleInput.value = tmpl.title;

        renderSheetSelect();
        this.renderActiveDocument();
        saveState();
    }

    /**
     * Sincroniza los textos HTML de los bloques contenteditable con el estado activeDoc.blocks
     */
    syncActiveBlocksData() {
        if (!this.activeDoc) return;

        this.activeDoc.blocks.forEach(block => {
            const editorEl = document.getElementById(`editor-${block.id}`);
            if (editorEl) {
                if (block.type === 'text' || block.type === 'h2' || block.type === 'h3') {
                    block.content = editorEl.innerHTML;
                }
            }
        });

        proyecto_actual.sheets[activeSheetIndex].blocks = this.activeDoc.blocks;
    }

    /**
     * Aplica formatos enriquecidos al texto
     */
    formatText(command, value = null) {
        if (window.isAuditMode) return;
        document.execCommand(command, false, value);
    }

    /**
     * Agrega un nuevo bloque de texto
     */
    addTextBlock(type = 'text') {
        if (window.isAuditMode) return;
        const newBlock = {
            id: 'b_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: type,
            content: type.startsWith('h') ? 'Nuevo Subtítulo...' : 'Haz doble clic aquí para editar tu texto libremente...'
        };

        this.syncActiveBlocksData();
        this.activeDoc.blocks.push(newBlock);
        this.renderActiveDocument();
        saveState();
        
        setTimeout(() => {
            const el = document.getElementById(`editor-${newBlock.id}`);
            if (el) el.focus();
        }, 100);
    }

    /**
     * Agrega un bloque de Tabla (Excel)
     */
    addTableBlock() {
        if (window.isAuditMode) return;
        const newBlock = {
            id: 'b_' + Date.now() + '_table',
            type: 'table',
            isRetaceo: false,
            headers: ['Columna 1', 'Columna 2', 'Columna 3'],
            rows: [
                ['Dato A1', 'Dato B1', 100],
                ['Dato A2', 'Dato B2', 200]
            ]
        };

        this.syncActiveBlocksData();
        this.activeDoc.blocks.push(newBlock);
        this.renderActiveDocument();
        saveState();
    }

    /**
     * Convierte tabla simple a Retaceo
     */
    convertToRetaceo(blockId) {
        if (window.isAuditMode) return;
        const block = this.activeDoc.blocks.find(b => b.id === blockId);
        if (block && block.type === 'table') {
            block.isRetaceo = true;
            block.retaceoConfig = { flete: 1000, seguro: 250, gastos: 500 };
            block.headers = [
                'Producto', 'Cantidad', 'FOB Unitario', 'FOB Total', 
                '% Part.', 'Flete Pror.', 'Seguro Pror.', 'Valor CIF', 
                'DAI %', 'DAI Local', 'Gastos Aduana', 'Costo Local', 'Unitario Local'
            ];
            block.rows = [
                ['Mercadería A', 10, 500, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0],
                ['Mercadería B', 20, 250, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0]
            ];
            
            this.syncActiveBlocksData();
            this.renderActiveDocument();
            saveState();
        }
    }

    /**
     * Convierte tabla Retaceo a simple
     */
    convertToSimpleTable(blockId) {
        if (window.isAuditMode) return;
        const block = this.activeDoc.blocks.find(b => b.id === blockId);
        if (block && block.type === 'table') {
            block.isRetaceo = false;
            block.retaceoConfig = null;
            block.headers = ['Columna 1', 'Columna 2', 'Columna 3'];
            block.rows = [
                ['Detalle A', 10, 15.50],
                ['Detalle B', 20, 30.00]
            ];
            this.syncActiveBlocksData();
            this.renderActiveDocument();
            saveState();
        }
    }

    /**
     * Agrega un bloque de Diagramas (Visio)
     */
    addDiagramBlock() {
        if (window.isAuditMode) return;
        const newBlock = {
            id: 'b_' + Date.now() + '_diag',
            type: 'diagram',
            nodes: [
                { id: 'node_1', type: 'startend', label: 'Inicio', x: 50, y: 150 },
                { id: 'node_2', type: 'process', label: 'Proceso Contable', x: 250, y: 150 }
            ],
            edges: [
                { id: 'edge_1', from: 'node_1', fromPort: 'right', to: 'node_2', toPort: 'left', label: 'Flujo' }
            ]
        };

        this.syncActiveBlocksData();
        this.activeDoc.blocks.push(newBlock);
        this.renderActiveDocument();
        saveState();
    }

    /**
     * Mover bloque arriba
     */
    moveBlockUp(blockId) {
        if (window.isAuditMode) return;
        const index = this.activeDoc.blocks.findIndex(b => b.id === blockId);
        if (index > 0) {
            this.syncActiveBlocksData();
            const temp = this.activeDoc.blocks[index];
            this.activeDoc.blocks[index] = this.activeDoc.blocks[index - 1];
            this.activeDoc.blocks[index - 1] = temp;
            this.renderActiveDocument();
            saveState();
        }
    }

    /**
     * Mover bloque abajo
     */
    moveBlockDown(blockId) {
        if (window.isAuditMode) return;
        const index = this.activeDoc.blocks.findIndex(b => b.id === blockId);
        if (index >= 0 && index < this.activeDoc.blocks.length - 1) {
            this.syncActiveBlocksData();
            const temp = this.activeDoc.blocks[index];
            this.activeDoc.blocks[index] = this.activeDoc.blocks[index + 1];
            this.activeDoc.blocks[index + 1] = temp;
            this.renderActiveDocument();
            saveState();
        }
    }

    /**
     * Elimina bloque
     */
    removeBlock(blockId) {
        if (window.isAuditMode) return;
        this.syncActiveBlocksData();
        this.activeDoc.blocks = this.activeDoc.blocks.filter(b => b.id !== blockId);
        this.renderActiveDocument();
        saveState();
    }

    /**
     * Dibuja todo el documento
     */
    renderActiveDocument() {
        const container = document.getElementById('universal-document-canvas');
        if (!container) return;

        container.innerHTML = '';

        if (!this.activeDoc || !this.activeDoc.blocks || this.activeDoc.blocks.length === 0) {
            container.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-16" id="canvas-empty-state">
                    <i class="fas fa-file-alt text-5xl mb-4 text-slate-400 opacity-45"></i>
                    <h4 class="font-extrabold text-sm text-slate-500 uppercase tracking-widest">Lienzo en Blanco</h4>
                    <p class="text-xs text-slate-400 mt-1.5 max-w-sm">Haz clic en los botones de inserción superiores o elige una plantilla del catálogo lateral para comenzar.</p>
                </div>
            `;
            if (window.isAuditMode && typeof window.aplicarModoLectura === 'function') {
                window.aplicarModoLectura();
            }
            return;
        }

        this.activeDoc.blocks.forEach((block, index) => {
            const blockWrapper = document.createElement('div');
            blockWrapper.className = 'canvas-block group';
            blockWrapper.dataset.id = block.id;

            // Controles
            const controls = document.createElement('div');
            controls.className = 'canvas-block-controls no-print';
            if (window.isAuditMode) controls.style.display = 'none';
            
            const upBtn = document.createElement('button');
            upBtn.className = 'canvas-control-btn';
            upBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            upBtn.onclick = () => this.moveBlockUp(block.id);
            upBtn.title = 'Mover bloque arriba';

            const downBtn = document.createElement('button');
            downBtn.className = 'canvas-control-btn';
            downBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
            downBtn.onclick = () => this.moveBlockDown(block.id);
            downBtn.title = 'Mover bloque abajo';

            const delBtn = document.createElement('button');
            delBtn.className = 'canvas-control-btn btn-delete';
            delBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            delBtn.onclick = () => this.removeBlock(block.id);
            delBtn.title = 'Eliminar bloque';

            controls.appendChild(upBtn);
            controls.appendChild(downBtn);
            controls.appendChild(delBtn);
            blockWrapper.appendChild(controls);

            // Contenido por tipo
            if (block.type === 'text' || block.type === 'h2' || block.type === 'h3') {
                const textDiv = document.createElement('div');
                textDiv.id = `editor-${block.id}`;
                textDiv.className = 'text-block-editor text-slate-800 dark:text-slate-200';
                textDiv.contentEditable = !window.isAuditMode;
                textDiv.innerHTML = block.content;
                
                if (block.type === 'h2') {
                    textDiv.className = 'text-block-editor font-extrabold text-slate-900 dark:text-white text-lg border-l-4 border-sky-500 pl-3 py-1';
                } else if (block.type === 'h3') {
                    textDiv.className = 'text-block-editor font-bold text-slate-800 dark:text-slate-200 text-sm border-l-4 border-slate-300 dark:border-slate-700 pl-3 py-0.5';
                }

                textDiv.onfocus = () => { this.activeBlockId = block.id; };
                textDiv.oninput = () => {
                    if (window.isAuditMode) return;
                    block.content = textDiv.innerHTML;
                    triggerAutoSave();
                };
                textDiv.onblur = () => {
                    if (window.isAuditMode) return;
                    block.content = textDiv.innerHTML;
                    triggerAutoSave();
                };
                blockWrapper.appendChild(textDiv);
            } 
            else if (block.type === 'table') {
                const tableContainer = this.renderTableBlock(block);
                blockWrapper.appendChild(tableContainer);
            } 
            else if (block.type === 'diagram') {
                const diagramContainer = this.renderDiagramBlock(block);
                blockWrapper.appendChild(diagramContainer);
            }

            container.appendChild(blockWrapper);
        });

        if (window.isAuditMode && typeof window.aplicarModoLectura === 'function') {
            window.aplicarModoLectura();
        }
    }

    /**
     * Dibuja grilla de Excel
     */
    renderTableBlock(block) {
        const wrapper = document.createElement('div');
        wrapper.className = 'spreadsheet-container bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-250 dark:border-slate-850 rounded-2xl';

        if (block.isRetaceo) {
            this.recalculateRetaceo(block);

            const configPanel = document.createElement('div');
            configPanel.className = 'grid gap-4 p-4 mb-4 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl retaceo-config-grid no-print';
            
            configPanel.innerHTML = `
                <div>
                    <label class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Flete Internacional Total</label>
                    <div class="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1">
                        <span class="text-xs text-slate-400 font-bold">$</span>
                        <input type="number" value="${block.retaceoConfig.flete}" ${window.isAuditMode ? 'disabled' : ''} class="bg-transparent text-xs tabular-nums font-bold text-slate-800 dark:text-white outline-none w-full" id="flete-${block.id}">
                    </div>
                </div>
                <div>
                    <label class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Seguro Marítimo Total</label>
                    <div class="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1">
                        <span class="text-xs text-slate-400 font-bold">$</span>
                        <input type="number" value="${block.retaceoConfig.seguro}" ${window.isAuditMode ? 'disabled' : ''} class="bg-transparent text-xs tabular-nums font-bold text-slate-800 dark:text-white outline-none w-full" id="seguro-${block.id}">
                    </div>
                </div>
                <div>
                    <label class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Otros Gastos Locales</label>
                    <div class="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1">
                        <span class="text-xs text-slate-400 font-bold">$</span>
                        <input type="number" value="${block.retaceoConfig.gastos}" ${window.isAuditMode ? 'disabled' : ''} class="bg-transparent text-xs tabular-nums font-bold text-slate-800 dark:text-white outline-none w-full" id="gastos-${block.id}">
                    </div>
                </div>
            `;

            setTimeout(() => {
                const flEl = document.getElementById(`flete-${block.id}`);
                const sgEl = document.getElementById(`seguro-${block.id}`);
                const gtEl = document.getElementById(`gastos-${block.id}`);
                
                const handler = () => {
                    if (window.isAuditMode) return;
                    block.retaceoConfig.flete = parseFloat(flEl.value) || 0;
                    block.retaceoConfig.seguro = parseFloat(sgEl.value) || 0;
                    block.retaceoConfig.gastos = parseFloat(gtEl.value) || 0;
                    this.recalculateRetaceo(block);
                    this.updateTableValues(block);
                    triggerAutoSave();
                };

                if (flEl) flEl.addEventListener('input', handler);
                if (sgEl) sgEl.addEventListener('input', handler);
                if (gtEl) gtEl.addEventListener('input', handler);
            }, 50);

            wrapper.appendChild(configPanel);
        }

        const tableWrap = document.createElement('div');
        tableWrap.className = 'overflow-x-auto w-full';
        
        const table = document.createElement('table');
        table.className = 'canvas-table w-full text-left text-xs border-collapse text-slate-700 dark:text-slate-300';
        table.id = `table-el-${block.id}`;

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        block.headers.forEach((h, cIdx) => {
            const th = document.createElement('th');
            th.className = 'bg-slate-100 dark:bg-slate-950/80 text-slate-800 dark:text-white font-extrabold uppercase text-[9px] tracking-wider p-2 border border-slate-200 dark:border-slate-800';
            th.innerText = h;
            headerRow.appendChild(th);
        });
        
        // Columna borrar
        const thDel = document.createElement('th');
        thDel.className = 'bg-slate-100 dark:bg-slate-950/80 p-2 border border-slate-200 dark:border-slate-800 w-8 no-print';
        thDel.innerText = '';
        headerRow.appendChild(thDel);
        
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        tbody.id = `tbody-${block.id}`;
        table.appendChild(tbody);
        
        tableWrap.appendChild(table);
        wrapper.appendChild(tableWrap);

        const actions = document.createElement('div');
        actions.className = 'table-actions-panel flex gap-2 mt-4 no-print';
        if (window.isAuditMode) actions.style.display = 'none';

        const addRowBtn = document.createElement('button');
        addRowBtn.className = 'px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded-lg transition-colors';
        addRowBtn.innerHTML = '<i class="fas fa-plus mr-1"></i> Fila';
        addRowBtn.onclick = () => {
            if (window.isAuditMode) return;
            const newRow = block.isRetaceo 
                ? ['Nuevo Producto', 1, 100, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0]
                : Array(block.headers.length).fill('');
            block.rows.push(newRow);
            this.renderActiveDocument();
            saveState();
        };

        const addColBtn = document.createElement('button');
        addColBtn.className = 'px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded-lg transition-colors';
        addColBtn.innerHTML = '<i class="fas fa-plus mr-1"></i> Columna';
        addColBtn.onclick = () => {
            if (window.isAuditMode || block.isRetaceo) return;
            block.headers.push(`Columna ${block.headers.length + 1}`);
            block.rows.forEach(r => r.push(''));
            this.renderActiveDocument();
            saveState();
        };

        const toggleTypeBtn = document.createElement('button');
        toggleTypeBtn.className = `px-3 py-1 ${block.isRetaceo ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-250 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450'} border text-[10px] font-bold rounded-lg transition-colors`;
        toggleTypeBtn.innerHTML = block.isRetaceo 
            ? '<i class="fas fa-exchange-alt mr-1"></i> Cambiar a Tabla Libre' 
            : '<i class="fas fa-table mr-1"></i> Cambiar a Fórmulas Retaceo';
        toggleTypeBtn.onclick = () => {
            if (window.isAuditMode) return;
            if (block.isRetaceo) {
                this.convertToSimpleTable(block.id);
            } else {
                this.convertToRetaceo(block.id);
            }
        };

        actions.appendChild(addRowBtn);
        if (!block.isRetaceo) actions.appendChild(addColBtn);
        actions.appendChild(toggleTypeBtn);
        wrapper.appendChild(actions);

        setTimeout(() => {
            this.updateTableValues(block);
        }, 30);

        return wrapper;
    }

    /**
     * Recalcula los costos y prorrateos de retaceo
     */
    recalculateRetaceo(block) {
        if (!block.isRetaceo || !block.retaceoConfig) return;

        const fleteTotal = block.retaceoConfig.flete || 0;
        const seguroTotal = block.retaceoConfig.seguro || 0;
        const otrosGastos = block.retaceoConfig.gastos || 0;

        let granTotalFob = 0;
        block.rows.forEach(row => {
            const qty = parseFloat(row[1]) || 0;
            const unitFob = parseFloat(row[2]) || 0;
            const totalFob = qty * unitFob;
            row[3] = totalFob;
            granTotalFob += totalFob;
        });

        block.rows.forEach(row => {
            const totalFob = row[3];
            const partPct = granTotalFob > 0 ? (totalFob / granTotalFob) : 0;
            
            row[4] = partPct;

            const fletePror = partPct * fleteTotal;
            row[5] = fletePror;

            const seguroPror = partPct * seguroTotal;
            row[6] = seguroPror;

            const cif = totalFob + fletePror + seguroPror;
            row[7] = cif;

            const daiRate = parseFloat(row[8]) || 0;
            const daiVal = cif * (daiRate / 100);
            row[9] = daiVal;

            const aduanaGasto = partPct * otrosGastos;
            row[10] = aduanaGasto;

            const localCostoTotal = cif + daiVal + aduanaGasto;
            row[11] = localCostoTotal;

            const qty = parseFloat(row[1]) || 0;
            row[12] = qty > 0 ? (localCostoTotal / qty) : 0;
        });
    }

    /**
     * Dibuja los inputs en la tabla
     */
    updateTableValues(block) {
        const tbody = document.getElementById(`tbody-${block.id}`);
        if (!tbody) return;

        tbody.innerHTML = '';

        block.rows.forEach((row, rIdx) => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors';
            
            row.forEach((cell, cIdx) => {
                const td = document.createElement('td');
                td.className = 'p-1 border border-slate-200 dark:border-slate-800';
                
                const isCalculatedCell = block.isRetaceo && [3, 4, 5, 6, 7, 9, 10, 11, 12].includes(cIdx);

                if (isCalculatedCell) {
                    td.className += ' tabular-nums text-right text-xs pr-2';
                    if (cIdx === 4) {
                        td.innerText = (cell * 100).toFixed(2) + '%';
                        td.className += ' text-center font-bold text-slate-400 dark:text-slate-500';
                    } else if (cIdx === 12) {
                        td.innerHTML = `<strong class="text-emerald-600 dark:text-emerald-400">$${cell.toFixed(2)}</strong>`;
                    } else {
                        td.innerText = '$' + cell.toFixed(2);
                    }
                } else {
                    const input = document.createElement('input');
                    input.className = 'w-full bg-transparent border-0 outline-none text-xs p-1 font-semibold text-slate-800 dark:text-slate-100';
                    input.value = cell;
                    input.disabled = !!window.isAuditMode;

                    const isNumeric = block.isRetaceo && [1, 2, 8].includes(cIdx);
                    if (isNumeric) {
                        input.type = 'number';
                        input.className += ' text-right tabular-nums';
                    }

                    input.oninput = () => {
                        if (window.isAuditMode) return;
                        let val = input.value;
                        if (isNumeric) {
                            val = parseFloat(val) || 0;
                        }
                        block.rows[rIdx][cIdx] = val;
                        
                        if (block.isRetaceo) {
                            this.recalculateRetaceo(block);
                            this.updateTableValues(block);
                        }
                        triggerAutoSave();
                    };
                    input.onblur = () => {
                        if (window.isAuditMode) return;
                        triggerAutoSave();
                    };

                    td.appendChild(input);
                }

                tr.appendChild(td);
            });

            // Botón eliminar fila
            const delCell = document.createElement('td');
            delCell.className = 'text-center border border-slate-200 dark:border-slate-800 no-print';
            if (!window.isAuditMode) {
                delCell.innerHTML = `<button class="text-slate-400 hover:text-rose-500 transition-colors p-1" title="Borrar Fila"><i class="fas fa-minus-circle"></i></button>`;
                delCell.onclick = () => {
                    if (window.isAuditMode) return;
                    block.rows.splice(rIdx, 1);
                    this.renderActiveDocument();
                    saveState();
                };
            }
            tr.appendChild(delCell);

            tbody.appendChild(tr);
        });

        // Totales de retaceo
        if (block.isRetaceo && block.rows.length > 0) {
            const tRow = document.createElement('tr');
            tRow.className = 'bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-450 font-black border-t-2 border-sky-200 dark:border-sky-900';
            
            let totalQty = 0;
            let totalFobVal = 0;
            let totalFletePror = 0;
            let totalSeguroPror = 0;
            let totalCifVal = 0;
            let totalDaiVal = 0;
            let totalAduanaGast = 0;
            let totalLocalCosto = 0;

            block.rows.forEach(r => {
                totalQty += parseFloat(r[1]) || 0;
                totalFobVal += parseFloat(r[3]) || 0;
                totalFletePror += parseFloat(r[5]) || 0;
                totalSeguroPror += parseFloat(r[6]) || 0;
                totalCifVal += parseFloat(r[7]) || 0;
                totalDaiVal += parseFloat(r[9]) || 0;
                totalAduanaGast += parseFloat(r[10]) || 0;
                totalLocalCosto += parseFloat(r[11]) || 0;
            });

            tRow.innerHTML = `
                <td class="p-2 border border-slate-200 dark:border-slate-800 font-extrabold">TOTALES</td>
                <td class="p-2 border border-slate-200 dark:border-slate-800 text-center tabular-nums font-bold">${totalQty}</td>
                <td class="p-2 border border-slate-200 dark:border-slate-800 text-center">-</td>
                <td class="p-2 border border-slate-200 dark:border-slate-800 text-right tabular-nums font-bold pr-2">$${totalFobVal.toFixed(2)}</td>
                <td class="p-2 border border-slate-200 dark:border-slate-800 text-center tabular-nums font-bold">100%</td>
                <td class="p-2 border border-slate-200 dark:border-slate-800 text-right tabular-nums font-bold pr-2">$${totalFletePror.toFixed(2)}</td>
                <td class="p-2 border border-slate-200 dark:border-slate-800 text-right tabular-nums font-bold pr-2">$${totalSeguroPror.toFixed(2)}</td>
                <td class="p-2 border border-slate-200 dark:border-slate-800 text-right tabular-nums font-bold pr-2">$${totalCifVal.toFixed(2)}</td>
                <td class="p-2 border border-slate-200 dark:border-slate-800 text-center">-</td>
                <td class="p-2 border border-slate-200 dark:border-slate-800 text-right tabular-nums font-bold pr-2">$${totalDaiVal.toFixed(2)}</td>
                <td class="p-2 border border-slate-200 dark:border-slate-800 text-right tabular-nums font-bold pr-2">$${totalAduanaGast.toFixed(2)}</td>
                <td class="p-2 border border-slate-200 dark:border-slate-800 text-right tabular-nums font-bold pr-2">$${totalLocalCosto.toFixed(2)}</td>
                <td class="p-2 border border-slate-200 dark:border-slate-800 text-right tabular-nums font-bold pr-2" title="Costo Unitario Local Promedio">$${totalQty > 0 ? (totalLocalCosto / totalQty).toFixed(2) : '0.00'}</td>
                <td class="no-print"></td>
            `;
            tbody.appendChild(tRow);
        }
    }

    /**
     * Dibuja lienzo de diagramas (Visio)
     */
    renderDiagramBlock(block) {
        const workspace = document.createElement('div');
        workspace.className = 'diagram-workspace bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl relative w-full h-[360px] overflow-hidden mb-2';
        workspace.id = `diagram-space-${block.id}`;

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('class', 'diagram-svg-overlay absolute inset-0 w-full h-full pointer-events-none z-10');
        svg.id = `diagram-svg-${block.id}`;
        
        svg.innerHTML = `
            <defs>
                <marker id="arrowhead-${block.id}" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#0ea5e9"></polygon>
                </marker>
            </defs>
        `;
        workspace.appendChild(svg);

        block.nodes.forEach(node => {
            const nodeDiv = document.createElement('div');
            nodeDiv.className = `diagram-node shape-${node.type} absolute z-20 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-750 p-2 shadow-md flex flex-col justify-between ${window.isAuditMode ? 'cursor-default' : 'cursor-move'} select-none`;
            nodeDiv.id = `node-${block.id}-${node.id}`;
            nodeDiv.style.left = `${node.x}px`;
            nodeDiv.style.top = `${node.y}px`;
            nodeDiv.style.width = '120px';
            nodeDiv.style.height = '70px';
            nodeDiv.style.borderRadius = node.type === 'startend' ? '24px' : '8px';

            const header = document.createElement('div');
            header.className = 'diagram-node-header flex justify-between items-center w-full text-[10px] text-slate-400 no-print';
            
            const typeIcon = document.createElement('i');
            typeIcon.className = `diagram-node-type-icon ${this.getShapeIcon(node.type)}`;
            
            const delNode = document.createElement('i');
            delNode.className = 'fas fa-times hover:text-rose-500 cursor-pointer';
            if (window.isAuditMode) delNode.style.display = 'none';
            delNode.onclick = (e) => {
                e.stopPropagation();
                if (window.isAuditMode) return;
                this.deleteNode(block, node.id);
                saveState();
            };

            header.appendChild(typeIcon);
            header.appendChild(delNode);
            nodeDiv.appendChild(header);

            const input = document.createElement('textarea');
            input.className = 'diagram-node-content-input bg-transparent text-slate-700 dark:text-slate-200 border-0 outline-none text-[10px] font-bold text-center resize-none w-full flex-1 overflow-hidden leading-tight mt-1';
            input.value = node.label;
            input.rows = 2;
            input.disabled = !!window.isAuditMode;
            input.oninput = () => {
                if (window.isAuditMode) return;
                node.label = input.value;
                triggerAutoSave();
            };
            input.onblur = () => {
                if (window.isAuditMode) return;
                triggerAutoSave();
            };
            nodeDiv.appendChild(input);

            // Anclajes de conexión
            ['top', 'right', 'bottom', 'left'].forEach(port => {
                const portDiv = document.createElement('div');
                portDiv.className = `diagram-anchor-port port-${port} absolute w-2 h-2 bg-sky-500 hover:bg-emerald-500 border border-white rounded-full cursor-crosshair no-print`;
                if (window.isAuditMode) portDiv.style.display = 'none';
                
                // Posicionamiento de anclajes
                if (port === 'top') { portDiv.style.top = '-5px'; portDiv.style.left = 'calc(50% - 4px)'; }
                if (port === 'bottom') { portDiv.style.bottom = '-5px'; portDiv.style.left = 'calc(50% - 4px)'; }
                if (port === 'left') { portDiv.style.left = '-5px'; portDiv.style.top = 'calc(50% - 4px)'; }
                if (port === 'right') { portDiv.style.right = '-5px'; portDiv.style.top = 'calc(50% - 4px)'; }

                portDiv.onpointerdown = (e) => {
                    if (window.isAuditMode) return;
                    e.stopPropagation();
                    const bounds = portDiv.getBoundingClientRect();
                    const spaceBounds = workspace.getBoundingClientRect();
                    
                    this.connectingPort = {
                        nodeId: node.id,
                        portName: port,
                        x: bounds.left - spaceBounds.left + 4,
                        y: bounds.top - spaceBounds.top + 4
                    };
                    this.tempLineEnd = {
                        x: bounds.left - spaceBounds.left + 4,
                        y: bounds.top - spaceBounds.top + 4
                    };
                };

                nodeDiv.appendChild(portDiv);
            });

            nodeDiv.onpointerdown = (e) => {
                if (window.isAuditMode) return;
                if (e.target.tagName === 'TEXTAREA' || e.target.classList.contains('fa-times')) return;
                
                e.preventDefault();
                nodeDiv.setPointerCapture(e.pointerId);
                
                this.dragNode = node;
                this.dragOffset = {
                    x: e.clientX - node.x,
                    y: e.clientY - node.y
                };
                nodeDiv.classList.add('border-sky-500');
            };

            nodeDiv.onpointermove = (e) => {
                if (window.isAuditMode) return;
                if (this.dragNode && this.dragNode.id === node.id) {
                    const spaceBounds = workspace.getBoundingClientRect();
                    
                    let newX = e.clientX - this.dragOffset.x;
                    let newY = e.clientY - this.dragOffset.y;
                    
                    newX = Math.max(0, Math.min(spaceBounds.width - 120, newX));
                    newY = Math.max(0, Math.min(spaceBounds.height - 70, newY));

                    node.x = newX;
                    node.y = newY;
                    
                    nodeDiv.style.left = `${newX}px`;
                    nodeDiv.style.top = `${newY}px`;

                    if (!this._rafPending) {
                        this._rafPending = true;
                        requestAnimationFrame(() => {
                            this._rafPending = false;
                            this.drawConnections(block);
                        });
                    }
                }
            };

            nodeDiv.onpointerup = (e) => {
                if (this.dragNode) {
                    nodeDiv.releasePointerCapture(e.pointerId);
                    this.dragNode = null;
                    nodeDiv.classList.remove('border-sky-500');
                    triggerAutoSave();
                }
            };

            workspace.appendChild(nodeDiv);
        });

        workspace.onpointermove = (e) => {
            if (window.isAuditMode) return;
            if (this.connectingPort) {
                const spaceBounds = workspace.getBoundingClientRect();
                this.tempLineEnd = {
                    x: e.clientX - spaceBounds.left,
                    y: e.clientY - spaceBounds.top
                };
                if (!this._rafPending) {
                    this._rafPending = true;
                    requestAnimationFrame(() => {
                        this._rafPending = false;
                        this.drawConnections(block);
                    });
                }
            }
        };

        workspace.onpointerup = (e) => {
            if (window.isAuditMode) return;
            if (this.connectingPort) {
                const targetPort = e.target.closest('.diagram-anchor-port');
                if (targetPort) {
                    const targetNodeDiv = targetPort.closest('.diagram-node');
                    const targetNodeId = targetNodeDiv.id.replace(`node-${block.id}-`, '');
                    const targetPortName = Array.from(targetPort.classList)
                        .find(cls => cls.startsWith('port-'))
                        .replace('port-', '');

                    if (targetNodeId !== this.connectingPort.nodeId) {
                        const newEdge = {
                            id: 'edge_' + Date.now(),
                            from: this.connectingPort.nodeId,
                            fromPort: this.connectingPort.portName,
                            to: targetNodeId,
                            toPort: targetPortName,
                            label: 'Conexión'
                        };
                        block.edges.push(newEdge);
                    }
                }
                
                this.connectingPort = null;
                this.tempLineEnd = null;
                this.drawConnections(block);
                triggerAutoSave();
            }
        };

        // Barra inferior del diagrama
        const toolbar = document.createElement('div');
        toolbar.className = 'diagram-toolbar absolute bottom-2 left-2 right-2 flex gap-1.5 p-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl z-30 overflow-x-auto no-scrollbar no-print';
        if (window.isAuditMode) toolbar.style.display = 'none';
        
        const shapes = [
            { type: 'process', label: 'Proceso', icon: 'fa-square' },
            { type: 'decision', label: 'Decisión', icon: 'fa-diamond' },
            { type: 'startend', label: 'Inicio/Fin', icon: 'fa-ellipsis-h' },
            { type: 'database', label: 'Banco/DB', icon: 'fa-database' },
            { type: 'document', label: 'Doc', icon: 'fa-file-alt' }
        ];

        shapes.forEach(sh => {
            const btn = document.createElement('button');
            btn.className = 'px-2 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-bold text-slate-600 dark:text-slate-300 flex items-center transition-colors';
            btn.innerHTML = `<i class="fas ${sh.icon} mr-1"></i> +${sh.label}`;
            btn.onclick = () => {
                if (window.isAuditMode) return;
                this.addNodeToDiagram(block, sh.type);
                saveState();
            };
            toolbar.appendChild(btn);
        });

        workspace.appendChild(toolbar);

        setTimeout(() => {
            this.drawConnections(block);
        }, 50);

        return workspace;
    }

    getShapeIcon(type) {
        switch (type) {
            case 'process': return 'fa-square';
            case 'decision': return 'fa-diamond';
            case 'startend': return 'fa-ellipsis-h';
            case 'database': return 'fa-database';
            case 'document': return 'fa-file-alt';
            default: return 'fa-info-circle';
        }
    }

    addNodeToDiagram(block, type) {
        if (window.isAuditMode) return;
        const id = 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        
        let label = 'Paso';
        if (type === 'decision') label = '¿Decisión?';
        if (type === 'startend') label = 'Inicio/Fin';
        if (type === 'database') label = 'Banco / DB';
        if (type === 'document') label = 'Factura / Doc';

        const newNode = {
            id: id,
            type: type,
            label: label,
            x: 100 + Math.random() * 80,
            y: 80 + Math.random() * 60
        };

        block.nodes.push(newNode);
        this.renderActiveDocument();
    }

    deleteNode(block, nodeId) {
        if (window.isAuditMode) return;
        block.nodes = block.nodes.filter(n => n.id !== nodeId);
        block.edges = block.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
        this.renderActiveDocument();
    }

    deleteEdge(block, edgeId) {
        if (window.isAuditMode) return;
        block.edges = block.edges.filter(e => e.id !== edgeId);
        this.renderActiveDocument();
    }

    drawConnections(block) {
        const svg = document.getElementById(`diagram-svg-${block.id}`);
        const workspace = document.getElementById(`diagram-space-${block.id}`);
        if (!svg || !workspace) return;

        const paths = svg.querySelectorAll('path');
        paths.forEach(p => p.remove());

        const tags = workspace.querySelectorAll('.diagram-connection-tag');
        tags.forEach(t => t.remove());

        const spaceBounds = workspace.getBoundingClientRect();

        block.edges.forEach(edge => {
            const fromEl = document.getElementById(`node-${block.id}-${edge.from}`);
            const toEl = document.getElementById(`node-${block.id}-${edge.to}`);
            
            if (!fromEl || !toEl) return;

            const fromPort = fromEl.querySelector(`.port-${edge.fromPort}`);
            const toPort = toEl.querySelector(`.port-${edge.toPort}`);
            
            if (!fromPort || !toPort) return;

            const fromBounds = fromPort.getBoundingClientRect();
            const toBounds = toPort.getBoundingClientRect();

            const x1 = fromBounds.left - spaceBounds.left + 4;
            const y1 = fromBounds.top - spaceBounds.top + 4;
            const x2 = toBounds.left - spaceBounds.left + 4;
            const y2 = toBounds.top - spaceBounds.top + 4;

            const pathData = this.calculateBezierCurve(x1, y1, edge.fromPort, x2, y2, edge.toPort);
            
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute('d', pathData);
            path.setAttribute('class', 'diagram-svg-line fill-none stroke-sky-500 dark:stroke-sky-450');
            path.setAttribute('style', `stroke-width: 2; marker-end: url(#arrowhead-${block.id}); pointer-events: visibleStroke; cursor: ${window.isAuditMode ? 'default' : 'pointer'};`);
            
            path.onclick = (e) => {
                e.stopPropagation();
                if (window.isAuditMode) return;
                if (confirm("¿Eliminar esta línea de conexión?")) {
                    this.deleteEdge(block, edge.id);
                    saveState();
                }
            };
            
            svg.appendChild(path);

            const tagInput = document.createElement('input');
            tagInput.className = 'diagram-connection-tag absolute z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[8px] font-bold text-slate-500 dark:text-slate-400 rounded px-1 text-center outline-none pointer-events-auto transition-all shadow-sm';
            tagInput.value = edge.label;
            tagInput.disabled = !!window.isAuditMode;
            
            const midX = (x1 + x2) / 2 - 30; // Centrado
            const midY = (y1 + y2) / 2 - 10;
            tagInput.style.left = `${midX}px`;
            tagInput.style.top = `${midY}px`;
            tagInput.style.width = '60px';
            
            tagInput.oninput = () => {
                if (window.isAuditMode) return;
                edge.label = tagInput.value;
                triggerAutoSave();
            };
            tagInput.onblur = () => {
                if (window.isAuditMode) return;
                triggerAutoSave();
            };

            workspace.appendChild(tagInput);
        });

        if (this.connectingPort && this.tempLineEnd) {
            const pathData = this.calculateBezierCurve(
                this.connectingPort.x, this.connectingPort.y, this.connectingPort.portName,
                this.tempLineEnd.x, this.tempLineEnd.y, 'center'
            );
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute('d', pathData);
            path.setAttribute('class', 'diagram-svg-line fill-none');
            path.setAttribute('style', 'stroke-width: 2; stroke-dasharray: 4; stroke: #10b981;');
            svg.appendChild(path);
        }
    }

    calculateBezierCurve(x1, y1, port1, x2, y2, port2) {
        const delta = 30;
        let cx1 = x1, cy1 = y1;
        let cx2 = x2, cy2 = y2;

        if (port1 === 'right') cx1 += delta;
        else if (port1 === 'left') cx1 -= delta;
        else if (port1 === 'bottom') cy1 += delta;
        else if (port1 === 'top') cy1 -= delta;

        if (port2 === 'right') cx2 += delta;
        else if (port2 === 'left') cx2 -= delta;
        else if (port2 === 'bottom') cy2 += delta;
        else if (port2 === 'top') cy2 -= delta;

        return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
    }
}

window.CanvasManager = CanvasManager;
window.canvasManager = new CanvasManager();

// === COLABORACIÓN EN TIEMPO REAL Y COMPARTIR ===
let realtimeChannel = null;

window.activarSincronizacionTiempoReal = function(projectId) {
    if (typeof supabaseClient === 'undefined' || !projectId) return;

    // Desconectar canal previo si existe
    if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
    }

    realtimeChannel = supabaseClient
        .channel(`proyecto-${projectId}`)
        .on(
            'postgres_changes',
            { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'proyectos_contables',
                filter: `id=eq.${projectId}`
            },
            (payload) => {
                const incomingProject = payload.new.data;
                // Verificar si esta actualización corresponde al proyecto que tenemos abierto
                if (incomingProject && incomingProject.id === projectId) {
                    // Si los datos entrantes son más recientes que los locales, los cargamos
                    if (!proyecto_actual.updatedAt || new Date(incomingProject.updatedAt) > new Date(proyecto_actual.updatedAt)) {
                        proyecto_actual = incomingProject;
                        
                        // Actualizar en el arreglo global y en LocalStorage
                        const idx = projects.findIndex(p => p.id === proyecto_actual.id);
                        if (idx !== -1) {
                            projects[idx] = proyecto_actual;
                        } else {
                            projects.unshift(proyecto_actual);
                        }
                        localStorage.setItem('educonta_projects_hojas', JSON.stringify(projects));
                        
                        // Refrescar UI sin disparar un ciclo de auto-guardado
                        loadActiveSheet();
                        renderSheetSelect();
                        
                        // Notificar sutilmente
                        if (typeof window.showSyncToast === 'function') {
                            window.showSyncToast('success', 'Documento actualizado por otro colaborador');
                        }
                    }
                }
            }
        )
        .subscribe();
};

window.openShareModal = function() {
    if (!proyecto_actual) return;
    const input = document.getElementById('share-uid-input');
    if (input) input.value = '';
    renderCollaboratorsList();
    const modal = document.getElementById('share-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeShareModal = function() {
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
        }, 300);
    }
};

window.renderCollaboratorsList = function() {
    const list = document.getElementById('collaborators-list');
    if (!list) return;
    list.innerHTML = '';
    
    const shared = proyecto_actual.shared_with || [];
    if (shared.length === 0) {
        list.innerHTML = `<p class="text-xs text-slate-400 dark:text-slate-500 italic py-2">No compartido aún. Solo tú tienes acceso.</p>`;
        return;
    }
    
    const esc = (str) => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    shared.forEach(uid => {
        const safeUid = esc(uid);
        const item = document.createElement('div');
        item.className = "flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/60";
        item.innerHTML = `
            <span class="text-xs font-mono text-slate-600 dark:text-slate-400 truncate max-w-[280px]" title="${safeUid}">${safeUid}</span>
            ${!window.isAuditMode ? `<button onclick="removeCollaborator('${safeUid}')" class="text-rose-500 hover:text-rose-650 text-xs px-2 py-1 shrink-0"><i class="fas fa-trash"></i></button>` : ''}
        `;
        list.appendChild(item);
    });
};

window.addCollaborator = async function() {
    if (window.isAuditMode) return;
    const emailInput = document.getElementById('share-uid-input');
    if (!emailInput) return;
    const uid = emailInput.value.trim();
    if (!uid) return;
    
    // Validar formato UUID simple (8-4-4-4-12 hex)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uid)) {
        alert("Por favor, ingresa un ID único de usuario (UUID) válido.");
        return;
    }
    
    if (!proyecto_actual.shared_with) proyecto_actual.shared_with = [];
    if (proyecto_actual.shared_with.includes(uid)) {
        alert("Este colaborador ya tiene acceso a este documento.");
        return;
    }
    
    proyecto_actual.shared_with.push(uid);
    emailInput.value = '';
    renderCollaboratorsList();
    await saveState();
};

window.removeCollaborator = async function(uid) {
    if (window.isAuditMode) return;
    if (!proyecto_actual.shared_with) return;
    proyecto_actual.shared_with = proyecto_actual.shared_with.filter(id => id !== uid);
    renderCollaboratorsList();
    await saveState();
};
