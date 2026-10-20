// ==========================================
// DIAGRAMS EDITOR ENGINE — EduConta SV
// ==========================================

let projects = [];
let proyecto_actual = null;
let activeSheetIndex = 0;
let autoSaveTimeout = null;
let zIndexCounter = 10;

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (typeof injectSharedUI === 'function') {
            injectSharedUI('shared-components-root');
        }
    } catch (e) {}

    // Cargar datos de LocalStorage
    const rawProjects = localStorage.getItem('educonta_projects_diagramas');
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
    
    // Crear documento por defecto si no existe
    if (!proyecto_actual) {
        const defaultProj = {
            id: 'doc_diagrama_default_' + Date.now(),
            name: 'Mi Diagrama',
            type: 'diagramas',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sheets: [
                {
                    name: 'Diagrama 1',
                    nodes: [
                        {
                            id: 'node_init',
                            type: 'startend',
                            text: 'Inicio / Requisición',
                            top: 50,
                            left: 250,
                            width: 110,
                            height: 50
                        }
                    ],
                    connections: []
                }
            ]
        };
        projects = [defaultProj];
        localStorage.setItem('educonta_projects_diagramas', JSON.stringify(projects));
        localStorage.setItem('educonta_last_project_id', defaultProj.id);
        proyecto_actual = defaultProj;
    }

    if (!proyecto_actual) {
        window.location.href = 'documentos.html';
        return;
    }

    // Asegurar estructura de sheets
    if (!proyecto_actual.sheets || proyecto_actual.sheets.length === 0) {
        proyecto_actual.sheets = [
            {
                name: 'Diagrama 1',
                nodes: [],
                connections: []
            }
        ];
    }

    // Configurar título del documento en cabecera
    document.getElementById('current-project-name').innerText = proyecto_actual.name || 'Sin Nombre';

    // Cargar diagrama activo
    activeSheetIndex = 0;
    renderSheetSelect();
    loadActiveSheet();

    if (proyecto_actual) {
        window.activarSincronizacionTiempoReal(proyecto_actual.id);
    }

    // Sincronización nube
    checkCloudSession();

    // Redibujar conexiones al redimensionar la ventana (debounceado)
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(renderConnections, 100);
    }, { passive: true });

    // Desvanecer preloader suavemente tras inicializar nodos y lienzo de diagramas
    if (typeof window.dismissGlobalPreloader === 'function') {
        window.dismissGlobalPreloader();
    }
});

// === CONTROL DE PÁGINAS/DIAGRAMAS INTERNOS ===
function renderSheetSelect() {
    const select = document.getElementById('diagramas-sheet-select');
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

window.switchDiagramSheet = function(idx) {
    activeSheetIndex = parseInt(idx);
    loadActiveSheet();
};

function loadActiveSheet() {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    // Asegurar que existan las colecciones necesarias
    if (!sheet.nodes) sheet.nodes = [];
    if (!sheet.connections) sheet.connections = [];

    // Actualizar título en el input editable
    const titleInput = document.getElementById('canvas-doc-title');
    if (titleInput) {
        titleInput.value = sheet.name || 'Diagrama Sin Título';
        titleInput.disabled = !!window.isAuditMode;
    }

    // Limpiar capa de nodos e inyectar nuevos nodos
    const nodesLayer = document.getElementById('diagram-nodes-layer');
    if (nodesLayer) {
        nodesLayer.innerHTML = '';
    }

    // Cargar nodos DOM
    sheet.nodes.forEach(node => {
        renderNode(node);
    });

    // Cargar conexiones SVG
    renderConnections();

    // Sincronizar selectores de conexión
    updateConnectorSelects();

    if (window.isAuditMode && typeof window.aplicarModoLectura === 'function') {
        window.aplicarModoLectura();
    }
}

window.updateSheetTitle = function(newTitle) {
    if (window.isAuditMode || !proyecto_actual) return;
    const cleanTitle = newTitle.trim() || 'Diagrama Sin Título';
    proyecto_actual.sheets[activeSheetIndex].name = cleanTitle;
    renderSheetSelect();
    triggerAutoSave();
};

// === INSERTAR Y RENDERIZAR NODOS ===
window.addNode = function(type) {
    if (window.isAuditMode) return;
    let text = '';
    let w = 110;
    let h = 50;

    if (type === 'startend') {
        text = 'Inicio / Fin';
        w = 110;
        h = 50;
    } else if (type === 'process') {
        text = 'Proceso Contable';
        w = 120;
        h = 60;
    } else if (type === 'decision') {
        text = '¿Aprobado?';
        w = 80;
        h = 80;
    } else if (type === 'database') {
        text = 'Almacén / DB';
        w = 90;
        h = 75;
    }

    // Evitar superposición exacta colocando los nodos ligeramente desviados
    let left = 200;
    let top = 150;
    const sheet = proyecto_actual.sheets[activeSheetIndex];

    while (sheet.nodes.some(n => n.left === left && n.top === top)) {
        left += 25;
        top += 25;
    }

    const nodeObj = {
        id: 'node_' + Date.now(),
        type: type,
        text: text,
        top: top,
        left: left,
        width: w,
        height: h
    };

    sheet.nodes.push(nodeObj);
    renderNode(nodeObj);
    updateConnectorSelects();
    triggerAutoSave();
};

function renderNode(shape) {
    const layer = document.getElementById('diagram-nodes-layer');
    if (!layer) return;

    const el = document.createElement('div');
    el.id = shape.id;
    el.className = `diagram-node node-${shape.type} pointer-events-auto`;
    el.style.top = shape.top + 'px';
    el.style.left = shape.left + 'px';
    el.style.width = shape.width + 'px';
    el.style.height = shape.height + 'px';
    el.style.zIndex = zIndexCounter++;

    // Botón de eliminación
    const delBtn = document.createElement('div');
    delBtn.className = 'node-delete-btn no-print';
    if (window.isAuditMode) delBtn.style.display = 'none';
    delBtn.innerHTML = '<i class="fas fa-times"></i>';
    delBtn.onclick = (e) => {
        e.stopPropagation();
        if (window.isAuditMode) return;
        deleteNodeById(shape.id);
    };
    el.appendChild(delBtn);

    // Texto editable interno
    const content = document.createElement(shape.type === 'decision' ? 'span' : 'div');
    content.className = 'outline-none text-center select-none w-full px-2 block';
    content.contentEditable = !window.isAuditMode;
    content.spellcheck = false;
    content.innerText = shape.text;
    content.oninput = () => {
        if (window.isAuditMode) return;
        shape.text = content.innerText;
        updateConnectorSelects();
        triggerAutoSave();
    };
    el.appendChild(content);

    layer.appendChild(el);
    makeDraggable(el, shape);
}

function deleteNodeById(id) {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    
    // Remover nodo del arreglo
    sheet.nodes = sheet.nodes.filter(n => n.id !== id);
    
    // Remover todas las conexiones ligadas al nodo
    sheet.connections = (sheet.connections || []).filter(c => c.from !== id && c.to !== id);
    
    // Remover del DOM
    const element = document.getElementById(id);
    if (element) element.remove();
    
    updateConnectorSelects();
    renderConnections();
    triggerAutoSave();
}

// === DRAG & DROP MULTI-SOPORTE (MOUSE + TOUCH) ===
function makeDraggable(el, shapeObj) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    el.addEventListener('mousedown', dragMouseDown);
    el.addEventListener('touchstart', dragTouchStart, { passive: false });

    function dragMouseDown(e) {
        if (window.isAuditMode) return;
        if (e.target.classList.contains('node-delete-btn') || e.target.getAttribute('contenteditable') === 'true') {
            return;
        }
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('mousemove', elementDrag);
        
        // Traer al frente visualmente
        el.style.zIndex = zIndexCounter++;
    }

    function dragTouchStart(e) {
        if (window.isAuditMode) return;
        if (e.target.classList.contains('node-delete-btn') || e.target.getAttribute('contenteditable') === 'true') {
            return;
        }
        if (e.touches.length === 1) {
            e.preventDefault();
            pos3 = e.touches[0].clientX;
            pos4 = e.touches[0].clientY;
            document.addEventListener('touchend', closeDragElement);
            document.addEventListener('touchmove', elementTouchDrag, { passive: false });
            el.style.zIndex = zIndexCounter++;
        }
    }

    let rafDragMoveId = null;
    let pendingPos1 = 0;
    let pendingPos2 = 0;

    function elementDrag(e) {
        if (window.isAuditMode) return;
        e.preventDefault();
        pendingPos1 += (pos3 - e.clientX);
        pendingPos2 += (pos4 - e.clientY);
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        if (!rafDragMoveId) {
            rafDragMoveId = requestAnimationFrame(() => {
                rafDragMoveId = null;
                pos1 = pendingPos1;
                pos2 = pendingPos2;
                pendingPos1 = 0;
                pendingPos2 = 0;
                moveEl();
            });
        }
    }

    function elementTouchDrag(e) {
        if (window.isAuditMode) return;
        if (e.touches.length === 1) {
            e.preventDefault();
            pendingPos1 += (pos3 - e.touches[0].clientX);
            pendingPos2 += (pos4 - e.touches[0].clientY);
            pos3 = e.touches[0].clientX;
            pos4 = e.touches[0].clientY;
            
            if (!rafDragMoveId) {
                rafDragMoveId = requestAnimationFrame(() => {
                    rafDragMoveId = null;
                    pos1 = pendingPos1;
                    pos2 = pendingPos2;
                    pendingPos1 = 0;
                    pendingPos2 = 0;
                    moveEl();
                });
            }
        }
    }

    function moveEl() {
        if (window.isAuditMode) return;
        let newTop = el.offsetTop - pos2;
        let newLeft = el.offsetLeft - pos1;
        const container = document.getElementById('diagram-canvas-container');
        if (container) {
            newTop = Math.max(0, Math.min(container.offsetHeight - el.offsetHeight, newTop));
            newLeft = Math.max(0, Math.min(container.offsetWidth - el.offsetWidth, newLeft));
        }
        el.style.top = newTop + "px";
        el.style.left = newLeft + "px";
        
        shapeObj.top = newTop;
        shapeObj.left = newLeft;

        // Redibujar conexiones en tiempo real sincronizado con requestAnimationFrame
        requestAnimationFrame(() => renderConnections());
    }

    function closeDragElement() {
        if (rafDragMoveId) {
            cancelAnimationFrame(rafDragMoveId);
            rafDragMoveId = null;
        }
        renderConnections();
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
        document.removeEventListener('touchend', closeDragElement);
        document.removeEventListener('touchmove', elementTouchDrag);
        triggerAutoSave();
    }
}

// === CÁLCULO DE INTERSECCIÓN DE CONEXIONES Y DIBUJO SVG ===
function getNodeDimensions(node) {
    let w = node.width;
    let h = node.height;
    if (!w || !h) {
        if (node.type === 'startend') { w = 110; h = 50; }
        else if (node.type === 'process') { w = 120; h = 60; }
        else if (node.type === 'decision') { w = 80; h = 80; }
        else if (node.type === 'database') { w = 90; h = 75; }
        else { w = 100; h = 50; }
    }
    return {
        left: node.left,
        top: node.top,
        width: w,
        height: h
    };
}

function getIntersectionPoint(node, targetX, targetY) {
    const dim = getNodeDimensions(node);
    const cx = dim.left + dim.width / 2;
    const cy = dim.top + dim.height / 2;

    const dx = targetX - cx;
    const dy = targetY - cy;

    if (dx === 0 && dy === 0) {
        return { x: cx, y: cy };
    }

    let t = 0;
    const w2 = dim.width / 2;
    const h2 = dim.height / 2;

    if (node.type === 'decision') {
        // Intersección de rombo (Rotated square / diamond)
        t = 1 / (Math.abs(dx) / w2 + Math.abs(dy) / h2);
    } else {
        // Intersección de rectángulo estándar (startend, process, database)
        const tx = Math.abs(dx) > 0 ? w2 / Math.abs(dx) : Infinity;
        const ty = Math.abs(dy) > 0 ? h2 / Math.abs(dy) : Infinity;
        t = Math.min(tx, ty);
    }

    return {
        x: cx + t * dx,
        y: cy + t * dy
    };
}

function renderConnections() {
    const svg = document.getElementById('diagram-svg-connections');
    if (!svg) return;

    // Limpiar líneas y textos anteriores, manteniendo los markers de <defs>
    const defs = svg.querySelector('defs');
    svg.innerHTML = '';
    if (defs) {
        svg.appendChild(defs);
    }

    const sheet = proyecto_actual.sheets[activeSheetIndex];
    const connections = sheet.connections || [];
    const nodes = sheet.nodes || [];

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const lineColor = isDark ? '#b45309' : '#b45309';

    connections.forEach(conn => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);
        if (!fromNode || !toNode) return;

        const dim1 = getNodeDimensions(fromNode);
        const dim2 = getNodeDimensions(toNode);

        // Centros de los nodos
        const cx1 = dim1.left + dim1.width / 2;
        const cy1 = dim1.top + dim1.height / 2;
        const cx2 = dim2.left + dim2.width / 2;
        const cy2 = dim2.top + dim2.height / 2;

        // Calcular puntos de intersección del borde
        const p1 = getIntersectionPoint(fromNode, cx2, cy2);
        const p2 = getIntersectionPoint(toNode, cx1, cy1);

        // Línea SVG
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', p1.x);
        line.setAttribute('y1', p1.y);
        line.setAttribute('x2', p2.x);
        line.setAttribute('y2', p2.y);
        line.setAttribute('stroke', lineColor);
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', 'url(#arrow)');
        line.setAttribute('class', `${window.isAuditMode ? 'cursor-default' : 'cursor-pointer hover:stroke-rose-500'} transition-colors`);
        line.setAttribute('style', 'pointer-events: visibleStroke;');
        
        // Doble clic o clic en la línea para borrar la conexión
        line.onclick = () => {
            if (window.isAuditMode) return;
            if (confirm("¿Deseas eliminar esta línea de conexión?")) {
                sheet.connections = sheet.connections.filter(c => c.id !== conn.id);
                renderConnections();
                triggerAutoSave();
            }
        };

        svg.appendChild(line);

        // Renderizar texto / etiqueta del conector
        if (conn.label && conn.label.trim() !== '') {
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', midX);
            text.setAttribute('y', midY - 6);
            text.setAttribute('fill', isDark ? '#fbbf24' : '#78350f');
            text.setAttribute('font-size', '10px');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('style', `paint-order: stroke; stroke: ${isDark ? '#0d1117' : '#fafaf9'}; stroke-width: 4px; stroke-linejoin: round;`);
            text.textContent = conn.label;
            svg.appendChild(text);
        }
    });
}

// === GESTIÓN DE SELECTORES Y NUEVA CONEXIÓN ===
function updateConnectorSelects() {
    const fromSelect = document.getElementById('connector-from');
    const toSelect = document.getElementById('connector-to');
    if (!fromSelect || !toSelect) return;

    const currentFromVal = fromSelect.value;
    const currentToVal = toSelect.value;

    fromSelect.innerHTML = '<option value="">Desde...</option>';
    toSelect.innerHTML = '<option value="">Hacia...</option>';

    const nodes = proyecto_actual.sheets[activeSheetIndex].nodes || [];
    nodes.forEach(node => {
        const optionText = `${node.text.substring(0, 15)}${node.text.length > 15 ? '...' : ''} (${node.id.substring(5, 9)})`;
        
        const optFrom = document.createElement('option');
        optFrom.value = node.id;
        optFrom.textContent = optionText;
        if (node.id === currentFromVal) optFrom.selected = true;
        fromSelect.appendChild(optFrom);

        const optTo = document.createElement('option');
        optTo.value = node.id;
        optTo.textContent = optionText;
        if (node.id === currentToVal) optTo.selected = true;
        toSelect.appendChild(optTo);
    });

    if (typeof window.refreshEduContaGlassSelects === 'function') {
        window.refreshEduContaGlassSelects();
    }
}

window.createConnector = function() {
    if (window.isAuditMode) return;
    const fromSelect = document.getElementById('connector-from');
    const toSelect = document.getElementById('connector-to');
    const labelInput = document.getElementById('connector-label');
    if (!fromSelect || !toSelect || !labelInput) return;

    const fromId = fromSelect.value;
    const toId = toSelect.value;
    const label = labelInput.value.trim();

    if (!fromId || !toId) {
        alert("Por favor selecciona un nodo de origen ('Desde') y uno de destino ('Hacia').");
        return;
    }

    if (fromId === toId) {
        alert("No puedes conectar un nodo consigo mismo.");
        return;
    }

    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet.connections) sheet.connections = [];

    // Validar duplicados
    const exists = sheet.connections.find(c => c.from === fromId && c.to === toId);
    if (exists) {
        if (confirm("Ya existe una conexión entre estos nodos. ¿Deseas actualizar su etiqueta?")) {
            exists.label = label;
            renderConnections();
            triggerAutoSave();
            labelInput.value = '';
        }
        return;
    }

    const connObj = {
        id: 'conn_' + Date.now(),
        from: fromId,
        to: toId,
        label: label
    };

    sheet.connections.push(connObj);
    renderConnections();
    triggerAutoSave();

    // Limpiar controles
    labelInput.value = '';
    fromSelect.value = '';
    toSelect.value = '';
    if (typeof window.refreshEduContaGlassSelects === 'function') {
        window.refreshEduContaGlassSelects();
    }
};

// === CONTROL GLOBAL DE LIMPIEZA ===
window.clearAllDiagram = function() {
    if (window.isAuditMode) return;
    if (confirm("¿Estás seguro de que deseas limpiar todo el diagrama actual (nodos y conexiones)?")) {
        const sheet = proyecto_actual.sheets[activeSheetIndex];
        sheet.nodes = [];
        sheet.connections = [];
        
        document.getElementById('diagram-nodes-layer').innerHTML = '';
        renderConnections();
        updateConnectorSelects();
        triggerAutoSave();
    }
};

// === CREACIÓN DE DIAGRAMAS DESDE MODAL ===
window.openNewSheetModal = function() {
    if (window.isAuditMode) return;
    const modal = document.getElementById('sheet-modal');
    if (modal) {
        modal.style.display = 'flex';
        const input = document.getElementById('sheet-input-name');
        if (input) {
            input.value = '';
            setTimeout(() => input.focus(), 100);
        }
    }
};

window.closeSheetModal = function() {
    const modal = document.getElementById('sheet-modal');
    if (modal) modal.style.display = 'none';
};

window.saveNewSheet = function() {
    if (window.isAuditMode) return;
    const input = document.getElementById('sheet-input-name');
    if (!input) return;
    const name = input.value.trim() || `Diagrama ${proyecto_actual.sheets.length + 1}`;

    proyecto_actual.sheets.push({
        name: name,
        nodes: [],
        connections: []
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
        alert("No puedes eliminar todos los diagramas. Al menos debe quedar uno.");
        return;
    }
    if (confirm(`¿Estás seguro de que deseas eliminar el diagrama "${proyecto_actual.sheets[activeSheetIndex].name}"?`)) {
        proyecto_actual.sheets.splice(activeSheetIndex, 1);
        activeSheetIndex = 0;
        saveState();
        renderSheetSelect();
        loadActiveSheet();
    }
};

// === EXPORTAR RESPALDO .EDC ===
window.exportarBackupDiagramas = function() {
    if (!proyecto_actual) {
        alert('No hay un diagrama activo para exportar.');
        return;
    }

    const nombreProyecto = proyecto_actual.name || 'Proyecto_Diagramas';

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
    a.download = `${nombreProyecto.replace(/\s+/g, '_')}_Diagramas_${new Date().toISOString().split('T')[0]}.edc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    const toast = document.getElementById('sync-toast');
    if (toast) {
        const h4 = toast.querySelector('h4');
        const p = toast.querySelector('p');
        if (h4) h4.textContent = 'Diagrama Exportado';
        if (p) p.textContent = a.download;
        toast.classList.remove('translate-y-32', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-32', 'opacity-0');
        }, 3000);
    }
};
window.exportarProyectoEduConta = window.exportarBackupDiagramas;

// === CERRAR PROYECTO ===
window.closeProject = function() {
    saveState().then(() => {
        window.location.href = 'documentos.html';
    }).catch(() => {
        window.location.href = 'documentos.html';
    });
};

// === AUTO GUARDADO Y PERSISTENCIA ===
function triggerAutoSave() {
    if (window.isAuditMode) return;
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        saveState();
    }, 3000);
}

async function saveState(isManual = false) {
    if (!proyecto_actual || window.isAuditMode) return;
    proyecto_actual.updatedAt = new Date().toISOString();

    const idx = projects.findIndex(p => p.id === proyecto_actual.id);
    if (idx !== -1) {
        projects[idx] = proyecto_actual;
    } else {
        projects.unshift(proyecto_actual);
    }

    localStorage.setItem('educonta_projects_diagramas', JSON.stringify(projects));

    // Supabase Sync
    if (!navigator.onLine) {
        if (typeof updateSyncUI === 'function') updateSyncUI('offline');
        if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('offline');
    } else if (typeof supabaseClient !== 'undefined') {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession().catch(() => ({ data: { session: null } }));
            if (session) {
                if (typeof updateSyncUI === 'function') updateSyncUI('syncing');
                
                if (typeof window.syncCurrentProjectWithSupabase === 'function') {
                    await window.syncCurrentProjectWithSupabase(proyecto_actual, session.user.id, true);
                }

                if (typeof updateSyncUI === 'function') updateSyncUI('success');
                if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('success', 'Diagrama respaldado con éxito');
            } else {
                if (typeof updateSyncUI === 'function') updateSyncUI('local');
                if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('local', 'Diagrama guardado en este equipo');
            }
        } catch (e) {
            console.error("Error al sincronizar diagrama:", e);
            const errMsg = e.message || String(e);
            if (typeof updateSyncUI === 'function') updateSyncUI('error', errMsg);
            if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('error', errMsg);
        }
    } else {
        if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('local', 'Diagrama guardado en este equipo');
    }
}

window.saveActiveDiagramManual = function() {
    return saveState(true);
};

window.forceSave = function(quiet = false) {
    return saveState(!quiet);
};

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

// Atajo de teclado para Guardar Manual (Ctrl+S / Cmd+S)
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
        e.preventDefault();
        window.saveActiveDiagramManual();
    }
});

async function checkCloudSession() {
    if (!navigator.onLine) {
        if (typeof updateSyncUI === 'function') updateSyncUI('offline');
        return;
    }
    if (typeof supabaseClient !== 'undefined') {
        const { data: { session } } = await supabaseClient.auth.getSession().catch(() => ({ data: { session: null } }));
        if (session) {
            if (typeof updateSyncUI === 'function') updateSyncUI('success');
        } else {
            if (typeof updateSyncUI === 'function') updateSyncUI('local');
        }
    }
}

// === TEMPLATES DE DIAGRAMAS ===
window.cargarPlantillaDiagrama = function(tipo) {
    if (window.isAuditMode) return;
    if (!confirm("¿Cargar esta plantilla? Se borrarán todos los nodos y conexiones actuales de este diagrama.")) return;

    const sheet = proyecto_actual.sheets[activeSheetIndex];
    sheet.nodes = [];
    sheet.connections = [];

    if (tipo === 'flujo-compras') {
        // Definir Nodos
        const n1 = { id: 'node_fc1', type: 'startend', text: 'Requisición de Compra\n(Inicio)', top: 40, left: 240, width: 130, height: 50 };
        const n2 = { id: 'node_fc2', type: 'process', text: 'Solicitar y Recibir\nCotizaciones', top: 130, left: 235, width: 140, height: 60 };
        const n3 = { id: 'node_fc3', type: 'decision', text: '¿Aprobada por\nPresupuesto?', top: 230, left: 265, width: 80, height: 80 };
        const n4 = { id: 'node_fc4', type: 'process', text: 'Generar Orden de\nCompra (Emisión)', top: 350, left: 235, width: 140, height: 60 };
        const n5 = { id: 'node_fc5', type: 'startend', text: 'Orden Enviada\na Proveedor (Fin)', top: 450, left: 240, width: 130, height: 50 };

        sheet.nodes = [n1, n2, n3, n4, n5];

        // Definir Conexiones
        sheet.connections = [
            { id: 'conn_fc1', from: 'node_fc1', to: 'node_fc2', label: '' },
            { id: 'conn_fc2', from: 'node_fc2', to: 'node_fc3', label: '' },
            { id: 'conn_fc3', from: 'node_fc3', to: 'node_fc4', label: 'Sí' },
            { id: 'conn_fc4', from: 'node_fc3', to: 'node_fc1', label: 'No (Rechazar)' },
            { id: 'conn_fc5', from: 'node_fc4', to: 'node_fc5', label: '' }
        ];

    } else if (tipo === 'control-calidad') {
        // Definir Nodos
        const n1 = { id: 'node_cc1', type: 'startend', text: 'Recibir Materia Prima\n(Inicio)', top: 40, left: 240, width: 130, height: 50 };
        const n2 = { id: 'node_cc2', type: 'process', text: 'Inspeccionar Calidad\ny Cantidades', top: 130, left: 235, width: 140, height: 60 };
        const n3 = { id: 'node_cc3', type: 'decision', text: '¿Cumple Estándar?', top: 230, left: 265, width: 80, height: 80 };
        const n4 = { id: 'node_cc4', type: 'process', text: 'Ingresar a Bodega\ny Registrar Auxiliar', top: 350, left: 110, width: 150, height: 60 };
        const n5 = { id: 'node_cc5', type: 'database', text: 'Kardex / Inventario\n(Historial)', top: 450, left: 140, width: 90, height: 75 };
        const n6 = { id: 'node_cc6', type: 'process', text: 'Generar Acta de\nRechazo y Devolución', top: 350, left: 360, width: 150, height: 60 };
        const n7 = { id: 'node_cc7', type: 'startend', text: 'Notificar a Compra\ny Proveedor (Fin)', top: 450, left: 370, width: 130, height: 50 };

        sheet.nodes = [n1, n2, n3, n4, n5, n6, n7];

        // Definir Conexiones
        sheet.connections = [
            { id: 'conn_cc1', from: 'node_cc1', to: 'node_cc2', label: '' },
            { id: 'conn_cc2', from: 'node_cc2', to: 'node_cc3', label: '' },
            { id: 'conn_cc3', from: 'node_cc3', to: 'node_cc4', label: 'Sí' },
            { id: 'conn_cc4', from: 'node_cc3', to: 'node_cc6', label: 'No' },
            { id: 'conn_cc5', from: 'node_cc4', to: 'node_cc5', label: '' },
            { id: 'conn_cc6', from: 'node_cc6', to: 'node_cc7', label: '' }
        ];
    }

    loadActiveSheet();
    triggerAutoSave();
};

// === COLABORACIÓN EN TIEMPO REAL Y COMPARTIR ===
let realtimeChannel = null;

window.activarSincronizacionTiempoReal = function(projectId) {
    if (typeof supabaseClient === 'undefined' || !projectId) return;

    if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
    }

    const currentProject = proyecto_actual || { id: projectId };
    realtimeChannel = supabaseClient
        .channel(`proyecto-${projectId}`)
        .on(
            'postgres_changes',
            { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'proyectos_contables',
                filter: `id=eq.${currentProject.id}`
            },
            (payload) => {
                const incomingProject = payload.new.data;
                if (incomingProject && incomingProject.id === projectId) {
                    if (!proyecto_actual.updatedAt || new Date(incomingProject.updatedAt) > new Date(proyecto_actual.updatedAt)) {
                        proyecto_actual = incomingProject;
                        
                        const idx = projects.findIndex(p => p.id === proyecto_actual.id);
                        if (idx !== -1) {
                            projects[idx] = proyecto_actual;
                        } else {
                            projects.unshift(proyecto_actual);
                        }
                        localStorage.setItem('educonta_projects_diagramas', JSON.stringify(projects));
                        
                        loadActiveSheet();
                        renderSheetSelect();
                        
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
