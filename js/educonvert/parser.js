/**
 * Parser de Legislación para EduConvert - EduConta SV
 * Arquitectura de Adaptadores para permitir múltiples métodos de procesamiento
 */

class ParserManager {
    constructor() {
        this.adapters = {
            'regex': new HeuristicParserAdapter(),
            'gemini': new GeminiParserAdapter(),
            'ollama': new OllamaParserAdapter(),
            'custom': new CustomLocalAIAdapter()
        };
    }

    /**
     * Parsea un texto bruto y devuelve un arreglo de líneas clasificadas para el editor.
     * @param {string} rawText 
     * @param {string} engine 
     * @param {object} config 
     * @returns {Promise<Array<{text: string, type: string}>>}
     */
    async parseToLines(rawText, engine = 'regex', config = {}) {
        const adapter = this.adapters[engine] || this.adapters['regex'];
        try {
            const lines = await adapter.parseToLines(rawText, config);
            
            // Post-procesado para detectar TART (Título de Artículo)
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.type === 'TXT') {
                    const trimmedText = line.text.trim();
                    const startsWithCapital = /^[A-ZÁÉÍÓÚÑ]/.test(trimmedText);
                    const isReasonablyShort = trimmedText.length < 120;
                    const doesNotEndWithPunctuation = !/[\.\?!;:]$/.test(trimmedText);

                    if (startsWithCapital && isReasonablyShort && doesNotEndWithPunctuation) {
                        // Buscar la siguiente línea útil que no sea ignorada ni vacía
                        let nextUsefulLine = null;
                        for (let j = i + 1; j < lines.length; j++) {
                            const nextLine = lines[j];
                            const nextTrim = nextLine.text.trim();
                            if (!nextTrim || nextLine.type === 'IGN') continue;
                            nextUsefulLine = nextLine;
                            break;
                        }

                        if (nextUsefulLine && nextUsefulLine.type === 'ART') {
                            line.type = 'TART';
                        }
                    }
                }
            }
            return lines;
        } catch (error) {
            console.error("Error durante el parsing de líneas:", error);
            throw error;
        }
    }
}

/**
 * ADAPTADOR 1: Parser Heurístico por Expresiones Regulares (100% Local y Offline)
 */
class HeuristicParserAdapter {
    async parseToLines(rawText, config) {
        if (!rawText) return [];
        
        // Dividir el texto en líneas y limpiar espacios vacíos
        const lines = rawText.split('\n');
        const processedLines = [];
        // Expresiones regulares para identificar bloques en leyes de El Salvador
        const rxTitle = /^\s*(T[IÍ]TULO\s+([IVXLCDM\d]+|PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[EÉ]PTIMO|OCTAVO|NOVENO|D[EÉ]CIMO)|[IVXLCDM]+\s+T[IÍ]TULO)/i;
        const rxChapter = /^\s*(CAP[IÍ]TULO\s+([IVXLCDM\d]+|[UÚ]NICO|PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[EÉ]PTIMO|OCTAVO|NOVENO|D[EÉ]CIMO)|[IVXLCDM]+\s+CAP[IÍ]TULO)/i;
        const rxSection = /^\s*(SECCI[OÓ]N\s+[IVXLCDM\d\w]+)/i;
        const rxArticle = /^\s*(Art(?:\.|ículo)?\s*(\d+[-a-zA-Z0-9]*))[\.\s:-]+/i;

        // Patrones de ruido comunes en PDFs de leyes a ignorar
        const rxSeparator = /^\s*[_\-\s\.=\*]{4,}\s*$/;
        const rxPageNumber = /^\s*\d+\s*$/;
        const rxNoiseText = /^\s*(ASAMBLEA\s+LEGISLATIVA|REP[UÚ]BLICA\s+DE\s+EL\s+SALVADOR|DIARIO\s+OFICIAL|Tomo\s+\d+|P[aá]g\w*\s*\d+)/i;
        const rxLegislativeIndex = /^\s*([IÍ]NDICE\s+LEGISLATIVO|[IÍ]NDICE)\s*$/i;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '') continue;

            let type = 'TXT'; // Por defecto es texto plano

            // Clasificación heurística
            if (rxSeparator.test(line) || rxPageNumber.test(line) || rxNoiseText.test(line) || rxLegislativeIndex.test(line)) {
                type = 'IGN';
            } else if (rxTitle.test(line)) {
                type = 'TIT';
            } else if (rxChapter.test(line)) {
                type = 'CAP';
            } else if (rxSection.test(line)) {
                type = 'SEC';
            } else if (rxArticle.test(line)) {
                type = 'ART';
            }

            processedLines.push({
                text: line,
                type: type
            });
        }
        return processedLines;
    }
}

/**
 * ADAPTADOR 2: Parser de IA Local usando Ollama
 */
class OllamaParserAdapter {
    async parseToLines(rawText, config) {
        const url = config.url || 'http://localhost:11434';
        const model = config.model || 'llama3';
        
        const systemPrompt = `Actúa como un procesador de documentos legales de El Salvador. 
Tu tarea es tomar el texto de una ley y clasificar CADA línea según los siguientes tipos exactos de 3 letras:
- TIT : Título de la ley o sección mayor (ej. TÍTULO I, TÍTULO SEGUNDO).
- CAP : Capítulo (ej. CAPÍTULO III, CAPÍTULO UNICO).
- SEC : Sección (ej. SECCIÓN A, SECCIÓN PRIMERA).
- ART : Inicio de un artículo (debe comenzar con Art. o Artículo y su número).
- TXT : Párrafo de texto común, descripción o continuación del artículo anterior.
- IGN : Líneas en blanco, firmas, fechas de decreto al final, o datos de relleno a ignorar.

Debes devolver obligatoriamente un JSON con la estructura:
{
  "lines": [
    { "text": "Texto exacto de la línea", "type": "TIPO" }
  ]
}

No agregues texto explicativo ni formato markdown. Devuelve SOLAMENTE el objeto JSON.`;

        try {
            const response = await fetch(`${url}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    prompt: `${systemPrompt}\n\nTexto de la ley a procesar:\n${rawText}`,
                    stream: false,
                    options: {
                        temperature: 0.1
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Error en el servidor local de Ollama: ${response.statusText}`);
            }

            const resData = await response.json();
            let responseText = resData.response.trim();

            // Limpieza de formato markdown de JSON si el modelo lo agrega
            if (responseText.startsWith('```json')) {
                responseText = responseText.substring(7);
            }
            if (responseText.endsWith('```')) {
                responseText = responseText.substring(0, responseText.length - 3);
            }
            responseText = responseText.trim();

            const parsedData = JSON.parse(responseText);
            if (parsedData && Array.isArray(parsedData.lines)) {
                return parsedData.lines;
            } else {
                throw new Error("El modelo de IA no devolvió el formato esperado.");
            }
        } catch (error) {
            console.error("Error conectando a Ollama:", error);
            throw new Error(`No se pudo completar el análisis por IA Local. Asegúrate de que Ollama está corriendo en ${url} y que tienes el modelo '${model}' descargado. Detalles: ${error.message}`);
        }
    }
}

/**
 * ADAPTADOR 3: Conector para Futura IA Local propia
 */
class CustomLocalAIAdapter {
    async parseToLines(rawText, config) {
        console.warn("Se ha invocado el adaptador CustomLocalAI, pero aún no está implementado.");
        throw new Error("El motor 'Custom IA Local' no está configurado todavía. Se utilizará el motor Heurístico en su lugar.");
    }
}

/**
 * ADAPTADOR 4: Parser de IA en la nube usando la API de Google Gemini (Gratuito)
 */
async function fetchWithRetry(url, options, maxRetries = 3, initialDelay = 3000) {
    let delay = initialDelay;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            
            if (response.status === 429 || response.status === 503 || response.status === 504) {
                if (attempt === maxRetries) {
                    return response;
                }
                
                let waitTime = delay;
                if (response.status === 429) {
                    try {
                        const clone = response.clone();
                        const errData = await clone.json().catch(() => ({}));
                        const errMsg = errData.error?.message || "";
                        const match = errMsg.match(/(?:please retry in|retry in)\s+([\d\.]+)\s*s/i);
                        if (match && match[1]) {
                            const seconds = parseFloat(match[1]);
                            if (!isNaN(seconds)) {
                                waitTime = Math.ceil((seconds + 1.0) * 1000);
                                if (typeof showToast === 'function') {
                                    showToast("Límite de API Alcanzado", `Esperando ${Math.ceil(seconds + 1)}s para reintentar debido a límites de cuota...`, "info");
                                }
                            }
                        }
                    } catch (e) {
                        console.warn("[GeminiParser] No se pudo parsear el tiempo de espera del error 429:", e);
                    }
                }

                await new Promise(resolve => setTimeout(resolve, waitTime));
                delay = Math.max(delay * 2, waitTime);
                continue;
            }
            return response;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw error;
            }
            if (attempt === maxRetries) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
}

class GeminiParserAdapter {
    async getBestAvailableModel(apiKey) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`No se pudieron listar los modelos: ${response.statusText}`);
            }
            const data = await response.json();
            const models = data.models || [];
            
            const validModels = models.filter(m => 
                m.supportedGenerationMethods && 
                m.supportedGenerationMethods.includes('generateContent')
            );

            if (validModels.length === 0) {
                throw new Error("No se encontraron modelos que soporten la generación de contenido.");
            }

            const preferredModels = [
                'gemini-2.5-flash',
                'gemini-2.0-flash',
                'gemini-1.5-flash',
                'gemini-3.5-flash',
                'gemini-2.5-flash-lite',
                'gemini-1.5-flash-8b'
            ];

            for (const pref of preferredModels) {
                const found = validModels.find(m => m.name.endsWith(pref) || m.name === pref);
                if (found) return found.name;
            }

            const flashModel = validModels.find(m => m.name.toLowerCase().includes('flash'));
            if (flashModel) return flashModel.name;

            const proModel = validModels.find(m => m.name.toLowerCase().includes('pro'));
            if (proModel) return proModel.name;

            return validModels[0].name;
        } catch (e) {
            console.warn("[GeminiParser] Usando modelo fallback:", e);
            return 'models/gemini-2.5-flash';
        }
    }

    async parseToLines(rawText, config) {
        const apiKey = config.geminiKey || '';
        if (!apiKey) {
            throw new Error("No se ha configurado la clave API de Gemini. Por favor ingresa tu API Key en la configuración.");
        }

        const modelName = await this.getBestAvailableModel(apiKey);
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

        const allLines = rawText.split('\n')
            .map(line => line.trim())
            .filter(line => line !== '');

        if (allLines.length === 0) return [];

        const chunkSize = 250;
        const totalChunks = Math.ceil(allLines.length / chunkSize);
        const results = [];

        const systemPrompt = `Actúa como un procesador de documentos legales de El Salvador. 
Tu tarea es tomar el texto de una ley y clasificar CADA línea según los siguientes tipos exactos de 3 letras:
- TIT : Título de la ley o sección mayor (ej. TÍTULO I, TÍTULO SEGUNDO).
- CAP : Capítulo (ej. CAPÍTULO III, CAPÍTULO UNICO).
- SEC : Sección (ej. SECCIÓN A, SECCIÓN PRIMERA).
- ART : Inicio de un artículo (debe comenzar con Art. o Artículo y su número).
- TXT : Párrafo de texto común, descripción o continuación del artículo anterior.
- IGN : Líneas en blanco, firmas, fechas de decreto al final, o datos de relleno a ignorar.

Debes devolver obligatoriamente un JSON con la estructura:
{
  "lines": [
    { "text": "Texto exacto de la línea", "type": "TIPO" }
  ]
}

No agregues texto explicativo ni formato markdown. Devuelve SOLAMENTE el objeto JSON.`;

        for (let j = 0; j < totalChunks; j++) {
            const startIdx = j * chunkSize;
            const endIdx = Math.min(startIdx + chunkSize, allLines.length);
            const chunkLines = allLines.slice(startIdx, endIdx);
            const chunkText = chunkLines.join('\n');

            if (typeof showToast === 'function') {
                showToast("Procesando con IA", `Analizando bloque ${j + 1} de ${totalChunks}...`, "info");
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 50000);

            try {
                const response = await fetchWithRetry(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nTexto de la ley a procesar:\n${chunkText}` }] }],
                        generationConfig: {
                            responseMimeType: "application/json",
                            responseSchema: {
                                type: "OBJECT",
                                properties: {
                                    lines: {
                                        type: "ARRAY",
                                        items: {
                                            type: "OBJECT",
                                            properties: {
                                                text: { type: "STRING" },
                                                type: { type: "STRING", enum: ["TIT", "CAP", "SEC", "ART", "TXT", "IGN"] }
                                            },
                                            required: ["text", "type"]
                                        }
                                    }
                                },
                                required: ["lines"]
                            }
                        }
                    })
                }, 3, 3000);

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    const errMsg = errData.error?.message || response.statusText;
                    throw new Error(`Error en el bloque ${j + 1}: ${errMsg}`);
                }

                const resData = await response.json();
                const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (!responseText) {
                    throw new Error(`La respuesta para el bloque ${j + 1} está vacía.`);
                }

                const parsedData = JSON.parse(responseText.trim());
                if (parsedData && Array.isArray(parsedData.lines)) {
                    results.push({ index: j, lines: parsedData.lines });
                } else {
                    throw new Error(`Estructura inválida en el bloque ${j + 1}.`);
                }
            } catch (error) {
                clearTimeout(timeoutId);
                const msg = error.name === 'AbortError' 
                    ? `El bloque ${j + 1} tardó demasiado tiempo en responder (más de 50s).` 
                    : error.message;
                throw new Error(`Bloque ${j + 1}: ${msg}`);
            }

            if (j < totalChunks - 1) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

        results.sort((a, b) => a.index - b.index);
        const processedLines = [];
        for (const res of results) {
            processedLines.push(...res.lines);
        }

        return processedLines;
    }
}

window.ParserManager = ParserManager;
