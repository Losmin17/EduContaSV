/**
 * CanvasManager - Motor del Lienzo Universal (Word + Excel + Visio) para EduContaSV
 */

class CanvasManager {
    constructor() {
        this.documents = []; // Lista de documentos del usuario
        this.activeDoc = null; // Documento activo: { id, title, template_id, blocks: [] }
        this.activeBlockId = null; // ID del bloque enfocado
        
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
     * Inicializa el módulo, carga documentos desde Supabase y localStorage
     */
    init() {
        this.loadDocuments();
    }

    /**
     * Carga la lista de documentos guardados
     */
    async loadDocuments() {
        this.documents = [];

        // 1. Intentar cargar desde Supabase si está activo
        if (window.supabaseClient) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('user_canvases')
                    .select('id, title, template_id, created_at')
                    .order('updated_at', { ascending: false });

                if (!error && data) {
                    this.documents = data;
                }
            } catch (e) {
                console.error("Error al cargar lienzos de Supabase:", e);
            }
        }

        // 2. Si no hay nada o está offline, complementar con localStorage
        try {
            const localDocsStr = localStorage.getItem('educonvert_local_canvases') || '[]';
            const localDocs = JSON.parse(localDocsStr);
            
            localDocs.forEach(ld => {
                if (!this.documents.some(d => d.id === ld.id)) {
                    this.documents.push(ld);
                }
            });
        } catch (err) {
            console.error("Error al leer localStorage:", err);
        }

        this.renderDocumentsList();
    }

    /**
     * Dibuja la lista de documentos guardados en la barra lateral
     */
    renderDocumentsList() {
        const container = document.getElementById('canvas-documents-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.documents.length === 0) {
            container.innerHTML = `<div class="text-[11px] text-slate-500 italic py-2 text-center">No hay documentos guardados.</div>`;
            return;
        }

        this.documents.forEach(doc => {
            const docDiv = document.createElement('div');
            docDiv.className = `p-2 bg-slate-950/30 border ${this.activeDoc && this.activeDoc.id === doc.id ? 'border-brand-500 bg-brand-500/10' : 'border-slate-800/80 hover:border-slate-700'} rounded-xl cursor-pointer flex justify-between items-center group transition-colors`;
            docDiv.onclick = () => this.loadDocument(doc.id);

            const titleSpan = document.createElement('span');
            titleSpan.className = 'text-xs font-bold text-slate-300 truncate pr-2 flex-1';
            titleSpan.innerText = doc.title || 'Sin Título';

            const actionsSpan = document.createElement('span');
            actionsSpan.className = 'opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity';
            
            const delBtn = document.createElement('button');
            delBtn.className = 'p-1 hover:text-rose-400 text-slate-500 transition-colors';
            delBtn.innerHTML = '<i class="fas fa-trash-alt text-[10px]"></i>';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteDocument(doc.id);
            };

            actionsSpan.appendChild(delBtn);
            docDiv.appendChild(titleSpan);
            docDiv.appendChild(actionsSpan);

            container.appendChild(docDiv);
        });
    }

    /**
     * Crea un nuevo lienzo en blanco
     */
    createNewDocument() {
        const newDoc = {
            id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            title: 'Nuevo Documento Administrativo',
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
        };

        this.activeDoc = newDoc;
        document.getElementById('canvas-doc-title').value = newDoc.title;
        this.renderActiveDocument();
        this.renderDocumentsList();
        
        if (window.showToast) {
            window.showToast("Lienzo Creado", "Se abrió un nuevo documento en blanco.", "success");
        }
    }

    /**
     * Carga una plantilla del catálogo
     */
    loadTemplate(templateKey) {
        const tmpl = this.templates[templateKey];
        if (!tmpl) return;

        const blocksCopy = JSON.parse(JSON.stringify(tmpl.blocks));

        const newDoc = {
            id: 'doc_' + Date.now(),
            title: tmpl.title,
            template_id: templateKey,
            blocks: blocksCopy
        };

        this.activeDoc = newDoc;
        document.getElementById('canvas-doc-title').value = newDoc.title;
        this.renderActiveDocument();
        this.renderDocumentsList();

        if (window.showToast) {
            window.showToast("Plantilla Cargada", `Se aplicó el modelo: "${tmpl.title}".`, "success");
        }
    }

    /**
     * Carga un documento específico por su ID
     */
    async loadDocument(docId) {
        let docData = null;

        if (window.supabaseClient) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('user_canvases')
                    .select('*')
                    .eq('id', docId)
                    .single();

                if (!error && data) {
                    docData = {
                        id: data.id,
                        title: data.title,
                        template_id: data.template_id,
                        blocks: data.current_blocks
                    };
                }
            } catch (err) {
                console.error("Error al leer lienzo de Supabase:", err);
            }
        }

        if (!docData) {
            try {
                const localDocsStr = localStorage.getItem('educonvert_local_canvases') || '[]';
                const localDocs = JSON.parse(localDocsStr);
                const found = localDocs.find(d => d.id === docId);
                if (found) {
                    docData = found;
                }
            } catch (err) {
                console.error("Error al leer localStorage:", err);
            }
        }

        if (docData) {
            this.activeDoc = docData;
            document.getElementById('canvas-doc-title').value = docData.title;
            this.renderActiveDocument();
            this.renderDocumentsList();
            
            if (window.showToast) {
                window.showToast("Documento Cargado", `Abierto: "${docData.title}"`, "success");
            }
        } else {
            if (window.showToast) {
                window.showToast("Error al cargar", "No se encontró el contenido del documento.", "error");
            }
        }
    }

    /**
     * Guarda el documento actual en Supabase y localStorage
     */
    async saveCurrentDocument() {
        if (!this.activeDoc) {
            if (window.showToast) window.showToast("Sin Documento", "No hay ningún documento activo para guardar.", "error");
            return;
        }

        const titleInput = document.getElementById('canvas-doc-title');
        this.activeDoc.title = titleInput.value.trim() || 'Documento Sin Título';

        this.syncActiveBlocksData();

        try {
            const localDocsStr = localStorage.getItem('educonvert_local_canvases') || '[]';
            let localDocs = JSON.parse(localDocsStr);
            const index = localDocs.findIndex(d => d.id === this.activeDoc.id);
            
            if (index >= 0) {
                localDocs[index] = this.activeDoc;
            } else {
                localDocs.push(this.activeDoc);
            }
            
            localStorage.setItem('educonvert_local_canvases', JSON.stringify(localDocs));
        } catch (err) {
            console.error("Error al guardar localmente:", err);
        }

        let savedInCloud = false;
        if (window.supabaseClient) {
            const btn = document.getElementById('btn-save-canvas');
            const originalHTML = btn ? btn.innerHTML : '';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Guardando...';
            }

            try {
                const { data: checkData } = await window.supabaseClient
                    .from('user_canvases')
                    .select('id')
                    .eq('id', this.activeDoc.id);

                let resultError = null;

                if (checkData && checkData.length > 0) {
                    const { error } = await window.supabaseClient
                        .from('user_canvases')
                        .update({
                            title: this.activeDoc.title,
                            template_id: this.activeDoc.template_id,
                            current_blocks: this.activeDoc.blocks,
                            updated_at: new Date()
                        })
                        .eq('id', this.activeDoc.id);
                    resultError = error;
                } else {
                    const { error } = await window.supabaseClient
                        .from('user_canvases')
                        .insert([{
                            id: this.activeDoc.id,
                            title: this.activeDoc.title,
                            template_id: this.activeDoc.template_id,
                            current_blocks: this.activeDoc.blocks
                        }]);
                    resultError = error;
                }

                if (!resultError) {
                    savedInCloud = true;
                } else {
                    console.error("Error en query Supabase:", resultError);
                }
            } catch (err) {
                console.error("Excepción al subir a Supabase:", err);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalHTML;
                }
            }
        }

        await this.loadDocuments();
        this.renderDocumentsList();

        if (window.showToast) {
            if (savedInCloud) {
                window.showToast("Documento Guardado", "Sincronizado en Supabase y localmente.", "success");
            } else {
                window.showToast("Guardado Local", "Guardado en el navegador (Supabase desconectado).", "info");
            }
        }
    }

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
    }

    async deleteDocument(docId) {
        if (!confirm("¿Estás seguro de que deseas eliminar permanentemente este documento?")) {
            return;
        }

        if (window.supabaseClient) {
            try {
                await window.supabaseClient.from('user_canvases').delete().eq('id', docId);
            } catch (e) {
                console.error(e);
            }
        }

        try {
            const localDocsStr = localStorage.getItem('educonvert_local_canvases') || '[]';
            let localDocs = JSON.parse(localDocsStr);
            localDocs = localDocs.filter(d => d.id !== docId);
            localStorage.setItem('educonvert_local_canvases', JSON.stringify(localDocs));
        } catch (e) {
            console.error(e);
        }

        if (this.activeDoc && this.activeDoc.id === docId) {
            this.activeDoc = null;
            const canvasEl = document.getElementById('universal-document-canvas');
            if (canvasEl) {
                canvasEl.innerHTML = `
                    <div class="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-16" id="canvas-empty-state">
                        <i class="fas fa-file-alt text-5xl mb-4 text-slate-600 opacity-40"></i>
                        <h4 class="font-extrabold text-sm text-slate-400 uppercase tracking-widest">Lienzo en Blanco</h4>
                        <p class="text-xs text-slate-500 mt-1.5 max-w-sm">Haz clic en los botones de inserción superiores o elige una plantilla del catálogo lateral para comenzar.</p>
                    </div>
                `;
            }
            const titleEl = document.getElementById('canvas-doc-title');
            if (titleEl) titleEl.value = 'Documento Sin Título';
        }

        await this.loadDocuments();

        if (window.showToast) {
            window.showToast("Documento Eliminado", "El lienzo se borró con éxito.", "success");
        }
    }

    deleteCurrentDocument() {
        if (this.activeDoc) {
            this.deleteDocument(this.activeDoc.id);
        }
    }

    exportCurrentDocument() {
        if (!this.activeDoc) {
            if (window.showToast) window.showToast("Exportar", "No hay ningún documento abierto para exportar.", "error");
            return;
        }

        this.syncActiveBlocksData();

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.activeDoc, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `${this.activeDoc.title.toLowerCase().replace(/\s+/g, '_')}_canvas.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        if (window.showToast) window.showToast("Copia Descargada", "Respaldo JSON descargado con éxito.", "success");
    }

    importDocument(inputElement) {
        const file = inputElement.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const doc = JSON.parse(e.target.result);
                if (doc.title && Array.isArray(doc.blocks)) {
                    doc.id = 'doc_' + Date.now();
                    this.activeDoc = doc;
                    document.getElementById('canvas-doc-title').value = doc.title;
                    
                    await this.saveCurrentDocument();
                    
                    if (window.showToast) window.showToast("Importación Exitosa", `Documento "${doc.title}" importado y guardado.`, "success");
                } else {
                    throw new Error("Formato inválido.");
                }
            } catch (err) {
                if (window.showToast) window.showToast("Error de Archivo", "El archivo JSON no corresponde a un lienzo válido.", "error");
            }
        };
        reader.readAsText(file);
        inputElement.value = '';
    }

    formatText(command, value = null) {
        document.execCommand(command, false, value);
    }

    addTextBlock(type = 'text') {
        if (!this.activeDoc) {
            this.createNewDocument();
        }

        const newBlock = {
            id: 'b_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: type,
            content: type.startsWith('h') ? 'Nuevo Subtítulo...' : 'Haz doble clic aquí para editar tu texto libremente...'
        };

        this.activeDoc.blocks.push(newBlock);
        this.renderActiveDocument();
        
        setTimeout(() => {
            const el = document.getElementById(`editor-${newBlock.id}`);
            if (el) el.focus();
        }, 100);
    }

    addTableBlock() {
        if (!this.activeDoc) {
            this.createNewDocument();
        }

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

        this.activeDoc.blocks.push(newBlock);
        this.renderActiveDocument();
    }

    convertToRetaceo(blockId) {
        if (!this.activeDoc) return;
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
            
            this.renderActiveDocument();
        }
    }

    convertToSimpleTable(blockId) {
        if (!this.activeDoc) return;
        const block = this.activeDoc.blocks.find(b => b.id === blockId);
        if (block && block.type === 'table') {
            block.isRetaceo = false;
            block.retaceoConfig = null;
            block.headers = ['Columna 1', 'Columna 2', 'Columna 3'];
            block.rows = [
                ['Detalle A', 10, 15.50],
                ['Detalle B', 20, 30.00]
            ];
            this.renderActiveDocument();
        }
    }

    addDiagramBlock() {
        if (!this.activeDoc) {
            this.createNewDocument();
        }

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

        this.activeDoc.blocks.push(newBlock);
        this.renderActiveDocument();
    }

    moveBlockUp(blockId) {
        if (!this.activeDoc) return;
        const index = this.activeDoc.blocks.findIndex(b => b.id === blockId);
        if (index > 0) {
            this.syncActiveBlocksData();
            const temp = this.activeDoc.blocks[index];
            this.activeDoc.blocks[index] = this.activeDoc.blocks[index - 1];
            this.activeDoc.blocks[index - 1] = temp;
            this.renderActiveDocument();
        }
    }

    moveBlockDown(blockId) {
        if (!this.activeDoc) return;
        const index = this.activeDoc.blocks.findIndex(b => b.id === blockId);
        if (index >= 0 && index < this.activeDoc.blocks.length - 1) {
            this.syncActiveBlocksData();
            const temp = this.activeDoc.blocks[index];
            this.activeDoc.blocks[index] = this.activeDoc.blocks[index + 1];
            this.activeDoc.blocks[index + 1] = temp;
            this.renderActiveDocument();
        }
    }

    removeBlock(blockId) {
        if (!this.activeDoc) return;
        this.syncActiveBlocksData();
        this.activeDoc.blocks = this.activeDoc.blocks.filter(b => b.id !== blockId);
        this.renderActiveDocument();
    }

    renderActiveDocument() {
        const container = document.getElementById('universal-document-canvas');
        if (!container) return;

        container.innerHTML = '';

        if (!this.activeDoc || this.activeDoc.blocks.length === 0) {
            container.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-16" id="canvas-empty-state">
                    <i class="fas fa-file-alt text-5xl mb-4 text-slate-600 opacity-40"></i>
                    <h4 class="font-extrabold text-sm text-slate-400 uppercase tracking-widest">Lienzo en Blanco</h4>
                    <p class="text-xs text-slate-500 mt-1.5 max-w-sm">Haz clic en los botones de inserción superiores o elige una plantilla del catálogo lateral para comenzar.</p>
                </div>
            `;
            return;
        }

        this.activeDoc.blocks.forEach((block) => {
            const blockWrapper = document.createElement('div');
            blockWrapper.className = 'canvas-block group';
            blockWrapper.dataset.id = block.id;

            const controls = document.createElement('div');
            controls.className = 'canvas-block-controls';
            
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

            if (block.type === 'text' || block.type === 'h2' || block.type === 'h3') {
                const textDiv = document.createElement('div');
                textDiv.id = `editor-${block.id}`;
                textDiv.className = 'text-block-editor';
                textDiv.contentEditable = true;
                textDiv.innerHTML = block.content;
                
                if (block.type === 'h2') {
                    textDiv.classList.add('font-extrabold', 'text-white', 'text-lg');
                } else if (block.type === 'h3') {
                    textDiv.classList.add('font-bold', 'text-slate-200', 'text-sm');
                }

                textDiv.onfocus = () => { this.activeBlockId = block.id; };
                
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
    }

    renderTableBlock(block) {
        const wrapper = document.createElement('div');
        wrapper.className = 'spreadsheet-container';

        if (block.isRetaceo) {
            this.recalculateRetaceo(block);

            const configPanel = document.createElement('div');
            configPanel.className = 'grid gap-4 p-4 mb-4 bg-slate-950/40 border border-slate-800 rounded-xl retaceo-config-grid';
            
            configPanel.innerHTML = `
                <div>
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Flete Internacional Total</label>
                    <div class="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                        <span class="text-xs text-slate-500 font-bold">$</span>
                        <input type="number" value="${block.retaceoConfig.flete}" class="bg-transparent text-xs tabular-nums font-bold text-white outline-none w-full" id="flete-${block.id}">
                    </div>
                </div>
                <div>
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Seguro Marítimo Total</label>
                    <div class="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                        <span class="text-xs text-slate-500 font-bold">$</span>
                        <input type="number" value="${block.retaceoConfig.seguro}" class="bg-transparent text-xs tabular-nums font-bold text-white outline-none w-full" id="seguro-${block.id}">
                    </div>
                </div>
                <div>
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Otros Gastos Locales</label>
                    <div class="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                        <span class="text-xs text-slate-500 font-bold">$</span>
                        <input type="number" value="${block.retaceoConfig.gastos}" class="bg-transparent text-xs tabular-nums font-bold text-white outline-none w-full" id="gastos-${block.id}">
                    </div>
                </div>
            `;

            setTimeout(() => {
                const flEl = document.getElementById(`flete-${block.id}`);
                const sgEl = document.getElementById(`seguro-${block.id}`);
                const gtEl = document.getElementById(`gastos-${block.id}`);
                
                const handler = () => {
                    block.retaceoConfig.flete = parseFloat(flEl.value) || 0;
                    block.retaceoConfig.seguro = parseFloat(sgEl.value) || 0;
                    block.retaceoConfig.gastos = parseFloat(gtEl.value) || 0;
                    this.recalculateRetaceo(block);
                    this.updateTableValues(block);
                };

                if (flEl) flEl.addEventListener('input', handler);
                if (sgEl) sgEl.addEventListener('input', handler);
                if (gtEl) gtEl.addEventListener('input', handler);
            }, 50);

            wrapper.appendChild(configPanel);
        }

        const table = document.createElement('table');
        table.className = 'canvas-table';
        table.id = `table-el-${block.id}`;

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        block.headers.forEach((h) => {
            const th = document.createElement('th');
            th.innerText = h;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        tbody.id = `tbody-${block.id}`;
        table.appendChild(tbody);
        wrapper.appendChild(table);

        const actions = document.createElement('div');
        actions.className = 'table-actions-panel';

        const addRowBtn = document.createElement('button');
        addRowBtn.className = 'px-3 py-1 bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-white rounded-lg transition-colors';
        addRowBtn.innerHTML = '<i class="fas fa-plus"></i> Fila';
        addRowBtn.onclick = () => {
            const newRow = block.isRetaceo 
                ? ['Nuevo Producto', 1, 100, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0]
                : Array(block.headers.length).fill('');
            block.rows.push(newRow);
            this.renderActiveDocument();
        };

        const addColBtn = document.createElement('button');
        addColBtn.className = 'px-3 py-1 bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-white rounded-lg transition-colors';
        addColBtn.innerHTML = '<i class="fas fa-plus"></i> Columna';
        addColBtn.onclick = () => {
            if (block.isRetaceo) return;
            block.headers.push(`Columna ${block.headers.length + 1}`);
            block.rows.forEach(r => r.push(''));
            this.renderActiveDocument();
        };

        const toggleTypeBtn = document.createElement('button');
        toggleTypeBtn.className = `px-3 py-1 ${block.isRetaceo ? 'bg-emerald-950 border-emerald-800 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'} border text-[10px] rounded-lg transition-colors`;
        toggleTypeBtn.innerHTML = block.isRetaceo 
            ? '<i class="fas fa-exchange-alt"></i> Cambiar a Tabla Libre' 
            : '<i class="fas fa-table"></i> Cambiar a Fórmulas Retaceo';
        toggleTypeBtn.onclick = () => {
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

    updateTableValues(block) {
        const tbody = document.getElementById(`tbody-${block.id}`);
        if (!tbody) return;

        tbody.innerHTML = '';

        block.rows.forEach((row, rIdx) => {
            const tr = document.createElement('tr');
            
            row.forEach((cell, cIdx) => {
                const td = document.createElement('td');
                const isCalculatedCell = block.isRetaceo && [3, 4, 5, 6, 7, 9, 10, 11, 12].includes(cIdx);

                if (isCalculatedCell) {
                    td.className = 'tabular-nums text-right text-xs';
                    if (cIdx === 4) {
                        td.innerText = (cell * 100).toFixed(2) + '%';
                        td.className = 'text-center font-bold text-slate-400';
                    } else if (cIdx === 12) {
                        td.innerHTML = `<strong class="text-sky-400">$${cell.toFixed(2)}</strong>`;
                    } else {
                        td.innerText = '$' + cell.toFixed(2);
                    }
                } else {
                    const input = document.createElement('input');
                    input.className = 'cell-editable';
                    input.value = cell;

                    const isNumeric = block.isRetaceo && [1, 2, 8].includes(cIdx);
                    if (isNumeric) {
                        input.type = 'number';
                        input.classList.add('cell-numeric');
                    }

                    input.oninput = () => {
                        let val = input.value;
                        if (isNumeric) {
                            val = parseFloat(val) || 0;
                        }
                        block.rows[rIdx][cIdx] = val;
                        
                        if (block.isRetaceo) {
                            this.recalculateRetaceo(block);
                            this.updateTableValues(block);
                        }
                    };

                    td.appendChild(input);
                }

                tr.appendChild(td);
            });

            const delCell = document.createElement('td');
            delCell.className = 'text-center';
            delCell.innerHTML = `<button class="text-slate-600 hover:text-rose-400 transition-colors" title="Borrar Fila"><i class="fas fa-minus-circle"></i></button>`;
            delCell.onclick = () => {
                block.rows.splice(rIdx, 1);
                this.renderActiveDocument();
            };
            tr.appendChild(delCell);

            tbody.appendChild(tr);
        });

        if (block.isRetaceo && block.rows.length > 0) {
            const tRow = document.createElement('tr');
            tRow.className = 'table-totals';
            
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
                <td class="font-black">TOTALES</td>
                <td class="text-center tabular-nums font-bold">${totalQty}</td>
                <td>-</td>
                <td class="text-right tabular-nums font-bold">$${totalFobVal.toFixed(2)}</td>
                <td class="text-center tabular-nums font-bold">100%</td>
                <td class="text-right tabular-nums font-bold">$${totalFletePror.toFixed(2)}</td>
                <td class="text-right tabular-nums font-bold">$${totalSeguroPror.toFixed(2)}</td>
                <td class="text-right tabular-nums font-bold">$${totalCifVal.toFixed(2)}</td>
                <td>-</td>
                <td class="text-right tabular-nums font-bold">$${totalDaiVal.toFixed(2)}</td>
                <td class="text-right tabular-nums font-bold">$${totalAduanaGast.toFixed(2)}</td>
                <td class="text-right tabular-nums font-bold">$${totalLocalCosto.toFixed(2)}</td>
                <td class="text-right tabular-nums font-bold" title="Costo Unitario Local Promedio">$${totalQty > 0 ? (totalLocalCosto / totalQty).toFixed(2) : '0.00'}</td>
                <td></td>
            `;
            tbody.appendChild(tRow);
        }
    }

    renderDiagramBlock(block) {
        const workspace = document.createElement('div');
        workspace.className = 'diagram-workspace';
        workspace.id = `diagram-space-${block.id}`;

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('class', 'diagram-svg-overlay');
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
            nodeDiv.className = `diagram-node shape-${node.type}`;
            nodeDiv.id = `node-${block.id}-${node.id}`;
            nodeDiv.style.left = `${node.x}px`;
            nodeDiv.style.top = `${node.y}px`;

            const header = document.createElement('div');
            header.className = 'diagram-node-header';
            
            const typeIcon = document.createElement('i');
            typeIcon.className = `diagram-node-type-icon ${this.getShapeIcon(node.type)}`;
            
            const delNode = document.createElement('i');
            delNode.className = 'fas fa-times diagram-node-btn-del';
            delNode.onclick = (e) => {
                e.stopPropagation();
                this.deleteNode(block, node.id);
            };

            header.appendChild(typeIcon);
            header.appendChild(delNode);
            nodeDiv.appendChild(header);

            const input = document.createElement('textarea');
            input.className = 'diagram-node-content-input';
            input.value = node.label;
            input.rows = 2;
            input.oninput = () => {
                node.label = input.value;
            };
            nodeDiv.appendChild(input);

            ['top', 'right', 'bottom', 'left'].forEach(port => {
                const portDiv = document.createElement('div');
                portDiv.className = `diagram-anchor-port port-${port}`;
                
                portDiv.onpointerdown = (e) => {
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
                if (e.target.tagName === 'TEXTAREA' || e.target.classList.contains('diagram-node-btn-del')) return;
                
                e.preventDefault();
                nodeDiv.setPointerCapture(e.pointerId);
                
                this.dragNode = node;
                this.dragOffset = {
                    x: e.clientX - node.x,
                    y: e.clientY - node.y
                };
                nodeDiv.classList.add('selected');
            };

            nodeDiv.onpointermove = (e) => {
                if (this.dragNode && this.dragNode.id === node.id) {
                    const spaceBounds = workspace.getBoundingClientRect();
                    
                    let newX = e.clientX - this.dragOffset.x;
                    let newY = e.clientY - this.dragOffset.y;
                    
                    newX = Math.max(0, Math.min(spaceBounds.width - 150, newX));
                    newY = Math.max(0, Math.min(spaceBounds.height - 80, newY));

                    node.x = newX;
                    node.y = newY;
                    
                    nodeDiv.style.left = `${newX}px`;
                    nodeDiv.style.top = `${newY}px`;

                    this.drawConnections(block);
                }
            };

            nodeDiv.onpointerup = (e) => {
                if (this.dragNode) {
                    nodeDiv.releasePointerCapture(e.pointerId);
                    this.dragNode = null;
                    nodeDiv.classList.remove('selected');
                }
            };

            workspace.appendChild(nodeDiv);
        });

        workspace.onpointermove = (e) => {
            if (this.connectingPort) {
                const spaceBounds = workspace.getBoundingClientRect();
                this.tempLineEnd = {
                    x: e.clientX - spaceBounds.left,
                    y: e.clientY - spaceBounds.top
                };
                this.drawConnections(block);
            }
        };

        workspace.onpointerup = (e) => {
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
            }
        };

        const toolbar = document.createElement('div');
        toolbar.className = 'diagram-toolbar';
        
        const shapes = [
            { type: 'process', label: 'Proceso', icon: 'fa-square' },
            { type: 'decision', label: 'Decisión', icon: 'fa-diamond' },
            { type: 'startend', label: 'Inicio/Fin', icon: 'fa-ellipsis-h' },
            { type: 'database', label: 'Banco / DB', icon: 'fa-database' },
            { type: 'document', label: 'Documento', icon: 'fa-file-alt' }
        ];

        shapes.forEach(sh => {
            const btn = document.createElement('button');
            btn.className = 'diagram-tool-btn';
            btn.innerHTML = `<i class="fas ${sh.icon} mr-1"></i> +${sh.label}`;
            btn.onclick = () => this.addNodeToDiagram(block, sh.type);
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
            y: 100 + Math.random() * 80
        };

        block.nodes.push(newNode);
        this.renderActiveDocument();
    }

    deleteNode(block, nodeId) {
        block.nodes = block.nodes.filter(n => n.id !== nodeId);
        block.edges = block.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
        this.renderActiveDocument();
    }

    deleteEdge(block, edgeId) {
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
            path.setAttribute('class', 'diagram-svg-line');
            path.setAttribute('style', `marker-end: url(#arrowhead-${block.id});`);
            svg.appendChild(path);

            const tagInput = document.createElement('input');
            tagInput.className = 'diagram-connection-tag';
            tagInput.value = edge.label;
            
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            tagInput.style.left = `${midX}px`;
            tagInput.style.top = `${midY}px`;
            
            tagInput.oninput = () => { edge.label = tagInput.value; };
            tagInput.onkeydown = (e) => {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    if (tagInput.value === '') {
                        this.deleteEdge(block, edge.id);
                    }
                }
            };

            tagInput.onfocus = () => {
                tagInput.style.borderColor = '#f43f5e';
                tagInput.style.color = 'white';
            };
            tagInput.onblur = () => {
                tagInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                tagInput.style.color = '#94a3b8';
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
            path.setAttribute('class', 'diagram-svg-line');
            path.setAttribute('style', 'stroke-dasharray: 4; stroke: #10b981;');
            svg.appendChild(path);
        }
    }

    calculateBezierCurve(x1, y1, port1, x2, y2, port2) {
        const delta = 50;
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
