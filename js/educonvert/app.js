/**
 * EduConvert App Controller - EduConta SV
 */

// Instancias globales
const parserManager = new ParserManager();
const lawEditor = new LawEditor();

// Configuración por defecto
const DEFAULT_SUPABASE_URL = 'https://opteohbpsbrjnblexkqo.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wdGVvaGJwc2Jyam5ibGV4a3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzM0NDEsImV4cCI6MjA4ODI0OTQ0MX0.tkUB4Wxul4IlS0eJTF9puWHNShIT9STMKaCwIkIIaws';
const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3';

let currentWizardStep = 1;
let loadedLawsList = [];

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initSupabase();
    loadLawsFromSupabase();
    setupEventListeners();
    toggleEngineSettings();
    
    // Inicializar Hoja Universal
    if (window.canvasManager) {
        window.canvasManager.init();
    }
});

// Cargar ajustes guardados de localStorage o rellenar con los por defecto
function loadSettings() {
    const sbUrl = localStorage.getItem('educonvert_sb_url') || DEFAULT_SUPABASE_URL;
    const sbKey = localStorage.getItem('educonvert_sb_key') || DEFAULT_SUPABASE_KEY;
    const olUrl = localStorage.getItem('educonvert_ollama_url') || DEFAULT_OLLAMA_URL;
    const olModel = localStorage.getItem('educonvert_ollama_model') || DEFAULT_OLLAMA_MODEL;
    const geminiKey = localStorage.getItem('educonvert_gemini_key') || '';
    const lastEngine = localStorage.getItem('educonvert_last_engine') || 'regex';

    const sbUrlEl = document.getElementById('config-supabase-url');
    const sbKeyEl = document.getElementById('config-supabase-key');
    const olUrlEl = document.getElementById('config-ollama-url');
    const olModelEl = document.getElementById('config-ollama-model');
    const olUrlTabEl = document.getElementById('config-ollama-url-tab');
    const olModelTabEl = document.getElementById('config-ollama-model-tab');
    const geminiKeyEl = document.getElementById('config-gemini-key');
    const geminiKeyTabEl = document.getElementById('config-gemini-key-tab');
    const engineSelectEl = document.getElementById('parser-engine-select');

    if (sbUrlEl) sbUrlEl.value = sbUrl;
    if (sbKeyEl) sbKeyEl.value = sbKey;
    if (olUrlEl) olUrlEl.value = olUrl;
    if (olModelEl) olModelEl.value = olModel;
    if (olUrlTabEl) olUrlTabEl.value = olUrl;
    if (olModelTabEl) olModelTabEl.value = olModel;
    if (geminiKeyEl) geminiKeyEl.value = geminiKey;
    if (geminiKeyTabEl) geminiKeyTabEl.value = geminiKey;
    if (engineSelectEl) engineSelectEl.value = lastEngine;
}

// Inicializar cliente Supabase
function initSupabase() {
    const sbUrlEl = document.getElementById('config-supabase-url');
    const sbKeyEl = document.getElementById('config-supabase-key');
    const sbUrl = sbUrlEl ? sbUrlEl.value : DEFAULT_SUPABASE_URL;
    const sbKey = sbKeyEl ? sbKeyEl.value : DEFAULT_SUPABASE_KEY;

    if (window.supabaseClient) {
        testSupabaseConnectionSilent();
        return;
    }

    if (sbUrl && sbKey && window.supabase) {
        try {
            window.supabaseClient = window.supabase.createClient(sbUrl, sbKey);
            testSupabaseConnectionSilent();
        } catch (e) {
            console.error("Error al inicializar Supabase:", e);
            updateDbStatusUI(false);
        }
    } else {
        updateDbStatusUI(false);
    }
}

// Guardar configuraciones en localStorage
function saveAllConfigurations() {
    const sbUrl = (document.getElementById('config-supabase-url')?.value || '').trim();
    const sbKey = (document.getElementById('config-supabase-key')?.value || '').trim();
    const olUrl = (document.getElementById('config-ollama-url-tab')?.value || '').trim();
    const olModel = (document.getElementById('config-ollama-model-tab')?.value || '').trim();
    const geminiKey = (document.getElementById('config-gemini-key-tab')?.value || '').trim();

    localStorage.setItem('educonvert_sb_url', sbUrl);
    localStorage.setItem('educonvert_sb_key', sbKey);
    localStorage.setItem('educonvert_ollama_url', olUrl);
    localStorage.setItem('educonvert_ollama_model', olModel);
    localStorage.setItem('educonvert_gemini_key', geminiKey);

    if (document.getElementById('config-ollama-url')) document.getElementById('config-ollama-url').value = olUrl;
    if (document.getElementById('config-ollama-model')) document.getElementById('config-ollama-model').value = olModel;
    if (document.getElementById('config-gemini-key')) document.getElementById('config-gemini-key').value = geminiKey;

    initSupabase();
    showToast("Configuración Guardada", "Los parámetros del entorno se actualizaron con éxito.", "success");
    switchTab('dashboard');
}

// Cambiar de pestaña en la navegación principal
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    const tabElement = document.getElementById(`tab-${tabId}`);
    const btnElement = document.getElementById(`tab-btn-${tabId}`);

    if (tabElement && btnElement) {
        tabElement.classList.add('active');
        btnElement.classList.add('active');
    }

    if (tabId === 'dashboard') {
        loadLawsFromSupabase();
    } else if (tabId === 'canvas') {
        if (window.canvasManager) {
            window.canvasManager.loadDocuments();
        }
    }
}

// Configurar controladores de eventos
function setupEventListeners() {
    const olUrlTab = document.getElementById('config-ollama-url-tab');
    const olUrl = document.getElementById('config-ollama-url');
    const olModelTab = document.getElementById('config-ollama-model-tab');
    const olModel = document.getElementById('config-ollama-model');
    const geminiKeyTab = document.getElementById('config-gemini-key-tab');
    const geminiKey = document.getElementById('config-gemini-key');

    if (olUrlTab && olUrl) {
        olUrlTab.addEventListener('input', (e) => { olUrl.value = e.target.value; });
        olUrl.addEventListener('input', (e) => { olUrlTab.value = e.target.value; });
    }
    if (olModelTab && olModel) {
        olModelTab.addEventListener('input', (e) => { olModel.value = e.target.value; });
        olModel.addEventListener('input', (e) => { olModelTab.value = e.target.value; });
    }
    if (geminiKeyTab && geminiKey) {
        geminiKeyTab.addEventListener('input', (e) => { geminiKey.value = e.target.value; });
        geminiKey.addEventListener('input', (e) => { geminiKeyTab.value = e.target.value; });
    }

    const dropZone = document.getElementById('file-drop-zone');
    const fileInput = document.getElementById('file-input');

    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('border-sky-500', 'bg-slate-800/40');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('border-sky-500', 'bg-slate-800/40');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                handleUploadedFile(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                handleUploadedFile(files[0]);
            }
        });
    }
}

// Procesar el archivo subido (.txt, .json, .docx o .pdf)
function handleUploadedFile(file) {
    if (file.name.endsWith('.pdf')) {
        showToast("Procesando PDF...", "Extrayendo el texto del archivo PDF de forma local.", "info");
        extractTextFromPDF(file).then(text => {
            document.getElementById('law-raw-text').value = text;
            showToast("PDF Cargado con éxito", `Se extrajo el texto del PDF de manera estructurada.`, "success");
        }).catch(err => {
            console.error("Error al extraer texto del PDF:", err);
            showToast("Error de PDF", "No se pudo extraer el texto. Verifica que no esté protegido o escaneado como imagen pura.", "error");
        });
        return;
    }

    if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        showToast("Procesando Word...", "Extrayendo texto del documento Word.", "info");
        if (typeof mammoth !== 'undefined') {
            const reader = new FileReader();
            reader.onload = async function(e) {
                const arrayBuffer = e.target.result;
                const result = await mammoth.extractRawText({ arrayBuffer });
                document.getElementById('law-raw-text').value = result.value || '';
                showToast("Word Cargado", "Texto extraído correctamente.", "success");
            };
            reader.readAsArrayBuffer(file);
            return;
        }
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        const content = e.target.result;

        if (file.name.endsWith('.json')) {
            try {
                const parsed = JSON.parse(content);
                
                if (parsed.nombre && parsed.categoria) {
                    document.getElementById('law-form-name').value = parsed.nombre || '';
                    document.getElementById('law-form-abbr').value = parsed.abreviatura || '';
                    document.getElementById('law-form-category').value = parsed.categoria || '';
                    document.getElementById('law-form-decree').value = parsed.decreto_numero || '';
                    document.getElementById('law-form-date').value = parsed.fecha_publicacion || '';
                    document.getElementById('law-form-gazette').value = parsed.diario_oficial_info || '';
                    
                    if (parsed.articles && Array.isArray(parsed.articles)) {
                        let reconstructedText = "";
                        parsed.articles.forEach(art => {
                            if (art.titulo_seccion) reconstructedText += `${art.titulo_seccion}\n`;
                            if (art.capitulo_seccion) reconstructedText += `${art.capitulo_seccion}\n`;
                            if (art.seccion) reconstructedText += `${art.seccion}\n`;
                            reconstructedText += `Art. ${art.numero}.- ${art.texto}\n\n`;
                        });
                        document.getElementById('law-raw-text').value = reconstructedText.trim();
                        showToast("JSON Cargado", "Metadatos y artículos cargados desde la copia de seguridad.", "success");
                        return;
                    }
                }
            } catch (err) {
                console.error("Error al leer archivo JSON:", err);
            }
        }

        document.getElementById('law-raw-text').value = content;
        showToast("Archivo Cargado", `Se leyó el archivo "${file.name}" con éxito. Haz clic en 'Procesar' para compilarlo.`, "success");
    };

    reader.readAsText(file);
}

// Extraer texto de un archivo PDF usando PDF.js
async function extractTextFromPDF(file) {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result);
                
                if (window.pdfjsLib) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                }
                
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    
                    let lastY;
                    let pageText = '';

                    for (let item of textContent.items) {
                        if (lastY !== undefined && Math.abs(item.transform[5] - lastY) > 2) {
                            pageText += '\n';
                        }
                        pageText += item.str;
                        lastY = item.transform[5];
                    }
                    
                    // Limpieza de cabeceras de Diario Oficial
                    pageText = pageText.replace(/DIARIO\s+OFICIAL\s*[-–—]\s*Tomo\s*N[°ºo\.]*\s*\d+/gi, '')
                                       .replace(/San\s+Salvador,\s*\d+\s*de\s+[a-zñA-ZÑ]+\s+de\s+\d+/gi, '')
                                       .replace(/NÚMERO\s+\d+/gi, '');

                    fullText += pageText + '\n\n';
                }
                
                resolve(fullText.trim());
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
}

function toggleEngineSettings() {
    const select = document.getElementById('parser-engine-select');
    if (!select) return;
    const ollamaPanel = document.getElementById('ollama-settings-panel');
    const geminiPanel = document.getElementById('gemini-settings-panel');
    
    localStorage.setItem('educonvert_last_engine', select.value);
    
    if (ollamaPanel) ollamaPanel.classList.add('hidden');
    if (geminiPanel) geminiPanel.classList.add('hidden');
    
    if (select.value === 'ollama' && ollamaPanel) {
        ollamaPanel.classList.remove('hidden');
    } else if (select.value === 'gemini' && geminiPanel) {
        geminiPanel.classList.remove('hidden');
    }
}

async function testSupabaseConnectionSilent() {
    if (!window.supabaseClient) {
        updateDbStatusUI(false);
        return;
    }
    try {
        const { data, error } = await window.supabaseClient.from('leyes').select('id').limit(1);
        if (error) throw error;
        updateDbStatusUI(true);
    } catch (e) {
        updateDbStatusUI(false);
    }
}

async function testSupabaseConnection() {
    const indicator = document.getElementById('supabase-test-indicator');
    if (indicator) indicator.className = "w-2 h-2 rounded-full bg-yellow-500 animate-pulse";
    
    initSupabase();
    
    if (!window.supabaseClient) {
        showToast("Error de Conexión", "No se pudo crear el cliente de Supabase. Revisa los parámetros.", "error");
        if (indicator) indicator.className = "w-2 h-2 rounded-full bg-rose-500";
        return;
    }

    try {
        const { data, error } = await window.supabaseClient.from('leyes').select('id').limit(1);
        if (error) throw error;
        showToast("Conexión Exitosa", "Se pudo conectar correctamente a la base de datos de Supabase.", "success");
        if (indicator) indicator.className = "w-2 h-2 rounded-full bg-emerald-500";
        updateDbStatusUI(true);
    } catch (e) {
        showToast("Error de Conexión", "La conexión falló: " + e.message, "error");
        if (indicator) indicator.className = "w-2 h-2 rounded-full bg-rose-500";
        updateDbStatusUI(false);
    }
}

async function testOllamaConnection(fromTab = false) {
    const prefix = fromTab ? '-tab' : '';
    const indicator = document.getElementById(`ollama-test-indicator${prefix}`);
    const url = (document.getElementById(`config-ollama-url${prefix}`)?.value || '').trim();
    const model = (document.getElementById(`config-ollama-model${prefix}`)?.value || '').trim();

    if (indicator) indicator.className = "w-2 h-2 rounded-full bg-yellow-500 animate-pulse";

    try {
        const response = await fetch(`${url}/api/tags`);
        if (!response.ok) throw new Error("No se pudo obtener la lista de modelos.");
        
        const data = await response.json();
        const models = data.models || [];
        const modelNames = models.map(m => m.name.split(':')[0]);
        
        if (modelNames.includes(model.split(':')[0]) || models.some(m => m.name === model)) {
            showToast("Ollama Conectado", `Servidor activo y modelo '${model}' disponible en local.`, "success");
            if (indicator) indicator.className = "w-2 h-2 rounded-full bg-emerald-500";
        } else {
            showToast("Modelo no encontrado", `Ollama está activo, pero el modelo '${model}' no está descargado. Ejecuta 'ollama run ${model}' en tu consola.`, "info");
            if (indicator) indicator.className = "w-2 h-2 rounded-full bg-amber-500";
        }
    } catch (e) {
        showToast("Ollama Desconectado", "No se pudo conectar a Ollama. Asegúrate de iniciar la aplicación en tu máquina local.", "error");
        if (indicator) indicator.className = "w-2 h-2 rounded-full bg-rose-500";
    }
}

async function testGeminiConnection(fromTab = false) {
    const prefix = fromTab ? '-tab' : '';
    const indicator = document.getElementById(`gemini-test-indicator${prefix}`);
    const apiKey = (document.getElementById(`config-gemini-key${prefix}`)?.value || '').trim();

    if (!apiKey) {
        showToast("Clave Vacía", "Por favor ingresa tu API Key antes de probar la conexión.", "error");
        return;
    }

    if (indicator) indicator.className = "w-2 h-2 rounded-full bg-yellow-500 animate-pulse";

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || response.statusText);
        }

        const data = await response.json();
        const models = data.models || [];
        
        if (models.length > 0) {
            showToast("Gemini Conectado", "¡API Key válida! Conexión exitosa con el servicio de Gemini.", "success");
            if (indicator) indicator.className = "w-2 h-2 rounded-full bg-emerald-500";
        } else {
            showToast("Sin modelos", "La clave es válida, pero no hay modelos asignados a este proyecto.", "info");
            if (indicator) indicator.className = "w-2 h-2 rounded-full bg-amber-500";
        }
    } catch (e) {
        showToast("Error de Conexión", `No se pudo conectar a Gemini: ${e.message}`, "error");
        if (indicator) indicator.className = "w-2 h-2 rounded-full bg-rose-500";
    }
}

function updateDbStatusUI(connected) {
    const statusText = document.getElementById('db-connection-status');
    const summaryDbStatus = document.getElementById('summary-db-status');
    
    if (connected) {
        if (statusText) {
            statusText.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Conectado`;
            statusText.className = "text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-1";
        }
        if (summaryDbStatus) {
            summaryDbStatus.innerText = "Conexión Establecida";
            summaryDbStatus.className = "text-xs font-bold text-emerald-400";
        }
    } else {
        if (statusText) {
            statusText.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse"></span> Desconectado`;
            statusText.className = "text-xs font-bold text-rose-400 flex items-center gap-1.5 mt-1";
        }
        if (summaryDbStatus) {
            summaryDbStatus.innerText = "Desconectado";
            summaryDbStatus.className = "text-xs font-bold text-rose-400";
        }
    }
}

async function loadLawsFromSupabase() {
    const tableBody = document.getElementById('laws-table-body');
    if (!window.supabaseClient) {
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="p-8 text-center text-rose-400 font-medium">
                        <div class="flex flex-col items-center justify-center gap-3">
                            <i class="fas fa-exclamation-triangle text-3xl"></i>
                            Supabase no está configurado. Ve a la pestaña Configuración.
                        </div>
                    </td>
                </tr>
            `;
        }
        return;
    }

    try {
        const { data: leyes, error: errorLeyes } = await window.supabaseClient
            .from('leyes')
            .select('*, articulos(count)')
            .order('nombre', { ascending: true });

        if (errorLeyes) throw errorLeyes;

        loadedLawsList = leyes || [];
        renderLawsTable(loadedLawsList);

        const statTotalLaws = document.getElementById('stat-total-laws');
        if (statTotalLaws) statTotalLaws.innerText = leyes.length;
        
        let totalArticles = 0;
        leyes.forEach(l => {
            if (l.articulos && l.articulos[0]) {
                totalArticles += l.articulos[0].count;
            }
        });
        const statTotalArticles = document.getElementById('stat-total-articles');
        if (statTotalArticles) statTotalArticles.innerText = totalArticles;
        updateDbStatusUI(true);

    } catch (e) {
        console.error(e);
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="p-8 text-center text-rose-400 font-medium">
                        <div class="flex flex-col items-center justify-center gap-3">
                            <i class="fas fa-exclamation-triangle text-3xl"></i>
                            Error al cargar leyes: ${e.message}
                        </div>
                    </td>
                </tr>
            `;
        }
        updateDbStatusUI(false);
    }
}

function renderLawsTable(laws) {
    const tableBody = document.getElementById('laws-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (laws.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="p-8 text-center text-slate-500 font-medium">
                    No se encontraron leyes registradas.
                </td>
            </tr>
        `;
        return;
    }

    laws.forEach(law => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/20 transition-colors";
        
        const dateStr = law.fecha_publicacion ? new Date(law.fecha_publicacion).toLocaleDateString('es-SV') : 'N/A';
        const articleCount = (law.articulos && law.articulos[0]) ? law.articulos[0].count : 0;

        tr.innerHTML = `
            <td class="p-4 pl-6 font-bold text-white">${law.nombre} ${law.abreviatura ? `(${law.abreviatura})` : ''}</td>
            <td class="p-4 text-xs font-semibold text-slate-400"><span class="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700">${law.categoria}</span></td>
            <td class="p-4 text-xs text-slate-300 tabular-nums font-semibold">${law.decreto_numero || 'N/A'}</td>
            <td class="p-4 text-xs text-slate-300">${dateStr}</td>
            <td class="p-4 text-center font-bold text-sky-400">${articleCount}</td>
            <td class="p-4 pr-6 text-right space-x-2">
                <button onclick="window.open('visor-ley.html?id=${law.id}', '_blank')" class="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors" title="Ver Ley Completa">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="exportLawJSON('${law.id}')" class="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors" title="Exportar JSON">
                    <i class="fas fa-file-code"></i>
                </button>
                <button onclick="deleteLawFromSupabase('${law.id}', '${law.nombre}')" class="p-1.5 hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-400 transition-colors" title="Eliminar Ley">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function filterLawsTable() {
    const filterInput = document.getElementById('laws-filter');
    if (!filterInput) return;
    const filterText = filterInput.value.toLowerCase();
    const filtered = loadedLawsList.filter(l => 
        l.nombre.toLowerCase().includes(filterText) || 
        (l.abreviatura && l.abreviatura.toLowerCase().includes(filterText)) ||
        l.categoria.toLowerCase().includes(filterText)
    );
    renderLawsTable(filtered);
}

async function exportLawJSON(lawId) {
    try {
        const { data: law, error: errLaw } = await window.supabaseClient.from('leyes').select('*').eq('id', lawId).single();
        if (errLaw) throw errLaw;

        const { data: articles, error: errArt } = await window.supabaseClient.from('articulos').select('*').eq('ley_id', lawId).order('orden', { ascending: true });
        if (errArt) throw errArt;

        const exportObj = {
            ...law,
            articles: articles
        };

        const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute("download", `${law.nombre.toLowerCase().replace(/\s+/g, '_')}_export.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        showToast("Exportación Exitosa", "Archivo de respaldo JSON descargado.", "success");
    } catch (e) {
        showToast("Error al exportar", e.message, "error");
    }
}

async function deleteLawFromSupabase(lawId, name) {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente la ley "${name}" y todos sus artículos asociados?`)) {
        return;
    }

    try {
        const { error } = await window.supabaseClient.from('leyes').delete().eq('id', lawId);
        if (error) throw error;
        showToast("Ley Eliminada", `La ley "${name}" fue borrada con éxito.`, "success");
        loadLawsFromSupabase();
    } catch (e) {
        showToast("Error al eliminar", e.message, "error");
    }
}

function nextWizardStep(stepNum) {
    if (stepNum === 2) {
        const name = document.getElementById('law-form-name').value.trim();
        const category = document.getElementById('law-form-category').value;
        if (!name || !category) {
            showToast("Campos Faltantes", "Debes ingresar el Nombre y la Categoría de la ley.", "error");
            return;
        }
    }

    document.querySelectorAll('.wizard-step-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`wizard-step-${stepNum}`).classList.add('active');

    const progressPercent = ((stepNum - 1) / 3) * 100;
    const pBar = document.getElementById('wizard-progress-bar');
    if (pBar) pBar.style.width = `${progressPercent}%`;

    for (let i = 1; i <= 4; i++) {
        const stepInd = document.getElementById(`step-indicator-${i}`);
        if (!stepInd) continue;
        if (i < stepNum) {
            stepInd.className = "wizard-step completed flex flex-col items-center gap-2";
        } else if (i === stepNum) {
            stepInd.className = "wizard-step active flex flex-col items-center gap-2";
        } else {
            stepInd.className = "wizard-step flex flex-col items-center gap-2";
        }
    }

    currentWizardStep = stepNum;
}

function prevWizardStep(stepNum) {
    nextWizardStep(stepNum);
}

async function runTextParser() {
    const rawText = document.getElementById('law-raw-text').value.trim();
    if (!rawText) {
        showToast("Texto Vacío", "Por favor ingresa o pega el texto bruto de la ley a procesar.", "error");
        return;
    }

    const engine = document.getElementById('parser-engine-select').value;
    const btn = document.getElementById('btn-run-parser');
    
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner animate-spin"></i> Procesando...`;

    try {
        const config = {
            url: document.getElementById('config-ollama-url').value.trim(),
            model: document.getElementById('config-ollama-model').value.trim(),
            geminiKey: document.getElementById('config-gemini-key').value.trim()
        };

        const parsedLines = await parserManager.parseToLines(rawText, engine, config);
        
        lawEditor.init(parsedLines);
        
        nextWizardStep(3);
        showToast("Procesamiento Completado", "Revisa la clasificación línea por línea en el editor.", "success");
    } catch (e) {
        if (engine === 'gemini' || engine === 'ollama') {
            showFallbackModal(
                e.message,
                () => {
                    document.getElementById('parser-engine-select').value = 'regex';
                    toggleEngineSettings();
                    runTextParser();
                },
                () => {
                    runTextParser();
                }
            );
        } else {
            showToast("Error de Procesamiento", e.message, "error");
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

function compileAndShowPreview() {
    const compiled = lawEditor.compile();
    if (compiled.length === 0) {
        showToast("Sin Artículos", "El compilador no detectó ningún artículo. Clasifica al menos una línea como 'ART'.", "error");
        return;
    }

    const name = document.getElementById('law-form-name').value.trim();
    const category = document.getElementById('law-form-category').value;

    document.getElementById('summary-law-name').innerText = name;
    document.getElementById('summary-law-category').innerText = category;
    document.getElementById('summary-articles-count').innerText = compiled.length;

    document.getElementById('json-preview-area').innerText = JSON.stringify(compiled, null, 2);

    testSupabaseConnectionSilent();

    nextWizardStep(4);
}

async function publishLawToSupabase() {
    if (!window.supabaseClient) {
        showToast("Base de datos no configurada", "Debes establecer la conexión con Supabase en la pestaña de Configuración.", "error");
        return;
    }

    const name = document.getElementById('law-form-name').value.trim();
    const abbr = document.getElementById('law-form-abbr').value.trim() || null;
    const category = document.getElementById('law-form-category').value;
    const decree = document.getElementById('law-form-decree').value.trim() || null;
    const pubDate = document.getElementById('law-form-date').value || null;
    const gazette = document.getElementById('law-form-gazette').value.trim() || null;

    const btn = document.getElementById('btn-publish-supabase');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner animate-spin"></i> Publicando...`;

    try {
        const { data: insertedLaw, error: lawError } = await window.supabaseClient
            .from('leyes')
            .insert([{
                nombre: name,
                abreviatura: abbr,
                categoria: category,
                decreto_numero: decree,
                fecha_publicacion: pubDate,
                diario_oficial_info: gazette,
                estado: 'Vigente'
            }])
            .select();

        if (lawError) throw lawError;
        if (!insertedLaw || insertedLaw.length === 0) {
            throw new Error("No se pudo obtener el ID de la ley registrada.");
        }

        const lawId = insertedLaw[0].id;
        const articles = lawEditor.compiledArticles.map(art => ({
            ley_id: lawId,
            titulo_seccion: art.titulo_seccion,
            capitulo_seccion: art.capitulo_seccion,
            seccion: art.seccion,
            numero: art.numero,
            texto: art.texto,
            parrafos: art.parrafos,
            orden: art.orden
        }));

        const batchSize = 100;
        for (let i = 0; i < articles.length; i += batchSize) {
            const batch = articles.slice(i, i + batchSize);
            const { error: artError } = await window.supabaseClient.from('articulos').insert(batch);
            if (artError) throw artError;
        }

        showToast("Ley Publicada", `La ley "${name}" y sus ${articles.length} artículos se subieron con éxito.`, "success");
        
        resetWizard();
        switchTab('dashboard');

    } catch (e) {
        showToast("Error al publicar", e.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

function resetWizard() {
    document.getElementById('law-form-name').value = '';
    document.getElementById('law-form-abbr').value = '';
    document.getElementById('law-form-category').value = '';
    document.getElementById('law-form-decree').value = '';
    document.getElementById('law-form-date').value = '';
    document.getElementById('law-form-gazette').value = '';
    document.getElementById('law-raw-text').value = '';
    document.getElementById('json-preview-area').innerText = '';
    
    lawEditor.lines = [];
    lawEditor.compiledArticles = [];
    
    nextWizardStep(1);
}

function copySQLSchema() {
    const text = document.getElementById('sql-schema-code').innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast("Copiado al Portapapeles", "El script SQL se copió con éxito.", "success");
    }).catch(err => {
        showToast("Error al copiar", err.message, "error");
    });
}

function showToast(title, desc, type = 'info') {
    const toast = document.getElementById('toast-message');
    const toastTitle = document.getElementById('toast-title');
    const toastDesc = document.getElementById('toast-desc');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastTitle || !toastDesc || !toastIcon) return;

    toastTitle.innerText = title;
    toastDesc.innerText = desc;

    toast.className = "fixed bottom-6 right-6 transform transition-all duration-500 z-[9999] flex items-center gap-3 px-5 py-4 rounded-3xl shadow-2xl pointer-events-none text-white border";
    toastIcon.className = "fas text-lg";

    if (type === 'success') {
        toast.classList.add('bg-emerald-950', 'border-emerald-500', 'text-emerald-300');
        toastIcon.classList.add('fa-check-circle', 'text-emerald-400');
    } else if (type === 'error') {
        toast.classList.add('bg-rose-950', 'border-rose-500', 'text-rose-300');
        toastIcon.classList.add('fa-exclamation-triangle', 'text-rose-400');
    } else {
        toast.classList.add('bg-slate-950', 'border-slate-800', 'text-slate-300');
        toastIcon.classList.add('fa-info-circle', 'text-sky-400');
    }

    toast.classList.remove('translate-y-32', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.add('translate-y-32', 'opacity-0');
        toast.classList.remove('translate-y-0', 'opacity-100');
    }, 4500);
}

function showFallbackModal(errorMessage, onUseHeuristic, onRetry) {
    const modal = document.getElementById('fallback-modal');
    const content = document.getElementById('fallback-modal-content');
    const errDetails = document.getElementById('fallback-modal-error-details');
    
    if (!modal || !content || !errDetails) return;

    errDetails.innerText = errorMessage;
    
    document.getElementById('fallback-btn-heuristic').onclick = () => {
        hideFallbackModal();
        if (typeof onUseHeuristic === 'function') onUseHeuristic();
    };
    
    document.getElementById('fallback-btn-retry').onclick = () => {
        hideFallbackModal();
        if (typeof onRetry === 'function') onRetry();
    };
    
    document.getElementById('fallback-btn-cancel').onclick = () => {
        hideFallbackModal();
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            hideFallbackModal();
        }
    };
    
    modal.classList.remove('hidden');
    modal.offsetHeight;
    
    content.classList.remove('scale-95', 'opacity-0');
    content.classList.add('scale-100', 'opacity-100');
}

function hideFallbackModal() {
    const modal = document.getElementById('fallback-modal');
    const content = document.getElementById('fallback-modal-content');
    
    if (!modal || !content) return;
    
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}
