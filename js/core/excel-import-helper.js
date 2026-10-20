// =================================================================
// EDUCONTA SV — HELPER DE IMPORTACIÓN DE EXCEL, CSV, ODS Y EDC
// Conversión multi-hoja, extracción avanzada de estilos/colores/bordes,
// traducción y normalización de fórmulas, detección de formatos y diagnóstico.
// =================================================================

(function (window) {
    'use strict';

    /**
     * Paleta estándar de colores indexados de Excel (0 a 64)
     */
    const EXCEL_INDEXED_COLORS = [
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
        '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0', '#808080',
        '#9999FF', '#993366', '#FFFFCC', '#CCFFFF', '#660066', '#FF8080', '#0066CC', '#CCCCFF',
        '#000080', '#FF00FF', '#FFFF00', '#00FFFF', '#800080', '#800000', '#008080', '#0000FF',
        '#00CCFF', '#CCFFFF', '#CCFFCC', '#FFFF99', '#99CCFF', '#FF99CC', '#CC99FF', '#FFCC99',
        '#3366FF', '#33CCCC', '#99CC00', '#FFCC00', '#FF9900', '#FF6600', '#666699', '#969696',
        '#003366', '#339966', '#003300', '#333300', '#993300', '#993366', '#333399', '#333333'
    ];

    /**
     * Objeto principal de importación de hojas de cálculo
     */
    const EduContaExcelImporter = {
        /**
         * Lee y analiza cualquier archivo compatible (.xlsx, .xls, .csv, .ods, .tsv, .edc)
         * @param {File|Blob} file 
         * @returns {Promise<Object>} Objeto estructurado de documento EduConta
         */
        async parseSpreadsheetFile(file) {
            if (!file) {
                throw new Error("No se proporcionó ningún archivo para importar.");
            }

            const fileName = file.name || 'documento_importado';
            const fileExt = (fileName.split('.').pop() || '').toLowerCase();
            const cleanName = fileName.replace(/\.[^/.]+$/, "").trim() || 'Hoja de Cálculo';

            try {
                // 1. Caso archivo nativo de respaldo EduConta SV (.edc)
                if (fileExt === 'edc') {
                    return await this.parseEdcFile(file, cleanName);
                }

                // 2. Caso archivo de Excel o texto delimitado (.xlsx, .xls, .csv, .ods, .tsv)
                if (['xlsx', 'xls', 'csv', 'ods', 'tsv'].includes(fileExt)) {
                    return await this.parseExcelBinaryFile(file, cleanName, fileExt);
                }

                // 3. Intento heurístico de detección si no tiene extensión conocida
                return await this.parseExcelBinaryFile(file, cleanName, fileExt);

            } catch (err) {
                console.error("Error en EduContaExcelImporter.parseSpreadsheetFile:", err);
                const enhancedError = new Error(err.message || "Error desconocido al procesar el archivo.");
                enhancedError.originalError = err;
                enhancedError.fileName = fileName;
                enhancedError.fileSize = file.size;
                enhancedError.fileType = file.type || fileExt;
                enhancedError.stage = "Procesamiento y conversión de estructura de datos";
                throw enhancedError;
            }
        },

        /**
         * Procesa y desencripta archivos de respaldo .edc
         */
        async parseEdcFile(file, cleanName) {
            const rawText = await this.readFileAsText(file);
            let contenido;

            const desblindarData = (b64) => {
                const key = "EDC_SHIELD_2024";
                const str = decodeURIComponent(escape(atob(b64)));
                let output = "";
                for (let i = 0; i < str.length; i++) {
                    output += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
                }
                return output;
            };

            try {
                contenido = JSON.parse(rawText);
            } catch (e) {
                try {
                    contenido = JSON.parse(desblindarData(rawText));
                } catch (e2) {
                    throw new Error("El archivo .edc está dañado, corrupto o no corresponde a una firma válida de EduConta SV.");
                }
            }

            if (contenido.identificador_app && contenido.identificador_app !== 'EDUCONTA_SV_OFFICIAL') {
                throw new Error("El archivo .edc no proviene de una versión oficial compatible de EduConta SV.");
            }

            const docData = contenido.cuerpo_contable || contenido;
            const meta = contenido.metadata || {};

            let sheets = docData.sheets || docData.data || [];
            if (!Array.isArray(sheets) && typeof sheets === 'object') {
                sheets = [{ id: 'sheet_1', name: 'Hoja1', data: sheets }];
            }
            if (sheets.length === 0) {
                sheets = [{ id: 'sheet_1', name: 'Hoja1', data: {} }];
            }

            return {
                id: 'proj_' + Date.now(),
                name: (meta.nombre || docData.name || cleanName) + ' (Importado)',
                type: docData.type || 'calculo',
                catalogo: meta.catalogo || docData.catalogo || 'MAESTRO',
                sector: meta.sector || docData.sector || 'ALL',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                sheets: sheets,
                data: sheets,
                options: docData.options || { rowCount: 100, colCount: 26 },
                isEdc: true
            };
        },

        /**
         * Procesa archivos binarios de Excel (.xlsx, .xls, .csv, .ods) extrayendo datos, fórmulas y estilos/bordes
         */
        async parseExcelBinaryFile(file, cleanName, fileExt) {
            if (typeof XLSX === 'undefined') {
                throw new Error("El motor SheetJS (XLSX) no está cargado en el entorno. Asegúrate de incluir la librería xlsx.full.min.js.");
            }

            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            let workbook;

            try {
                const readOptions = {
                    type: 'array',
                    cellFormula: true,
                    cellStyles: true,
                    cellDates: true,
                    cellNF: true,
                    raw: true // IMPORTANTE: raw: true mantiene los valores numéricos puros (evita strings como "$12.00" que rompen fórmulas)
                };

                if (fileExt === 'csv' || fileExt === 'tsv') {
                    readOptions.raw = true;
                    readOptions.codepage = 65001; // UTF-8
                }

                workbook = XLSX.read(arrayBuffer, readOptions);
            } catch (readErr) {
                throw new Error(`No se pudo decodificar el archivo Excel (${fileExt.toUpperCase()}). Motivo: ${readErr.message}`);
            }

            if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error("El libro de cálculo no contiene ninguna hoja válida de trabajo.");
            }

            // Intentar extraer mapa completo de estilos, colores de fondo y bordes desde el archivo XML del XLSX
            let xmlStylesMap = {};
            if (fileExt === 'xlsx' || fileExt === '') {
                try {
                    xmlStylesMap = await this.extractXlsxStylesAndBorders(arrayBuffer);
                } catch (styleErr) {
                    console.warn("Extracción de estilos XML omitida o no soportada en este archivo:", styleErr);
                }
            }

            return this.convertWorkbookToEduConta(workbook, cleanName, xmlStylesMap);
        },

        /**
         * Extractor universal de estilos, colores de fondo (fills), fuentes y bordes desde los XML del paquete XLSX
         */
        async extractXlsxStylesAndBorders(arrayBuffer) {
            const zipFiles = await this.unzipArrayBuffer(arrayBuffer);
            if (!zipFiles['xl/styles.xml']) return {};

            const parser = new DOMParser();
            
            // 1. Extraer Colores del Tema (xl/theme/theme1.xml)
            const themeColors = {
                0: '#FFFFFF', // lt1
                1: '#000000', // dk1
                2: '#EEECE1', // lt2
                3: '#1F497D', // dk2
                4: '#4F81BD', // accent1
                5: '#C0504D', // accent2
                6: '#9BBB59', // accent3
                7: '#8064A2', // accent4
                8: '#4BACC6', // accent5
                9: '#F79646', // accent6
            };

            if (zipFiles['xl/theme/theme1.xml']) {
                try {
                    const themeDoc = parser.parseFromString(zipFiles['xl/theme/theme1.xml'], 'text/xml');
                    const clrScheme = themeDoc.querySelector('clrScheme');
                    if (clrScheme) {
                        const getHex = (tag) => {
                            const node = clrScheme.querySelector(tag);
                            if (!node) return null;
                            const srgb = node.querySelector('srgbClr');
                            if (srgb) return '#' + srgb.getAttribute('val');
                            const sys = node.querySelector('sysClr');
                            if (sys) return '#' + (sys.getAttribute('lastClr') || '000000');
                            return null;
                        };
                        if (getHex('lt1')) themeColors[0] = getHex('lt1');
                        if (getHex('dk1')) themeColors[1] = getHex('dk1');
                        if (getHex('lt2')) themeColors[2] = getHex('lt2');
                        if (getHex('dk2')) themeColors[3] = getHex('dk2');
                        if (getHex('accent1')) themeColors[4] = getHex('accent1');
                        if (getHex('accent2')) themeColors[5] = getHex('accent2');
                        if (getHex('accent3')) themeColors[6] = getHex('accent3');
                        if (getHex('accent4')) themeColors[7] = getHex('accent4');
                        if (getHex('accent5')) themeColors[8] = getHex('accent5');
                        if (getHex('accent6')) themeColors[9] = getHex('accent6');
                    }
                } catch (e) { /* noop */ }
            }

            // Función auxiliar para resolver cualquier color de nodo XML (RGB, Theme, Indexed, Tint)
            const resolveColor = (colorNode) => {
                if (!colorNode) return null;
                let hex = null;
                if (colorNode.getAttribute('rgb')) {
                    const rawRgb = colorNode.getAttribute('rgb').trim();
                    hex = '#' + rawRgb.slice(-6);
                } else if (colorNode.getAttribute('theme') !== null) {
                    const themeIdx = parseInt(colorNode.getAttribute('theme'), 10);
                    hex = themeColors[themeIdx] || '#000000';
                } else if (colorNode.getAttribute('indexed') !== null) {
                    const indexedIdx = parseInt(colorNode.getAttribute('indexed'), 10);
                    hex = EXCEL_INDEXED_COLORS[indexedIdx] || null;
                }

                if (hex && colorNode.getAttribute('tint') !== null) {
                    const tint = parseFloat(colorNode.getAttribute('tint'));
                    hex = this.applyTint(hex, tint);
                }
                return hex;
            };

            // 2. Parsear xl/styles.xml
            const stylesDoc = parser.parseFromString(zipFiles['xl/styles.xml'], 'text/xml');
            
            // Fuentes
            const fontNodes = stylesDoc.querySelectorAll('fonts > font');
            const fonts = [];
            fontNodes.forEach(fNode => {
                const isBold = !!fNode.querySelector('b');
                const isItalic = !!fNode.querySelector('i');
                const isUnderline = !!fNode.querySelector('u');
                const isStrike = !!fNode.querySelector('strike');
                const szNode = fNode.querySelector('sz');
                const nameNode = fNode.querySelector('name');
                const colorNode = fNode.querySelector('color');

                fonts.push({
                    bold: isBold,
                    italic: isItalic,
                    underline: isUnderline,
                    strikethrough: isStrike,
                    size: szNode ? parseFloat(szNode.getAttribute('val')) : null,
                    name: nameNode ? nameNode.getAttribute('val') : null,
                    color: resolveColor(colorNode)
                });
            });

            // Rellenos / Background Colors
            const fillNodes = stylesDoc.querySelectorAll('fills > fill');
            const fills = [];
            fillNodes.forEach((fillNode, fIdx) => {
                const pattern = fillNode.querySelector('patternFill');
                let bgcolor = null;
                if (pattern) {
                    const fgColor = pattern.querySelector('fgColor');
                    const patternType = pattern.getAttribute('patternType');
                    if (patternType && patternType !== 'none') {
                        bgcolor = resolveColor(fgColor);
                    }
                }
                fills.push({ bgcolor });
            });

            // Bordes
            const borderNodes = stylesDoc.querySelectorAll('borders > border');
            const borders = [];
            borderNodes.forEach(bNode => {
                const parseSide = (sideNames) => {
                    const names = Array.isArray(sideNames) ? sideNames : [sideNames];
                    let sideNode = null;
                    for (const name of names) {
                        sideNode = Array.from(bNode.children).find(el => el.localName && el.localName.toLowerCase() === name.toLowerCase()) || bNode.querySelector(name);
                        if (sideNode) break;
                    }
                    if (!sideNode) return null;
                    const style = sideNode.getAttribute('style');
                    if (!style || style === 'none') return null;

                    const colorNode = Array.from(sideNode.children).find(el => el.localName && el.localName.toLowerCase() === 'color') || sideNode.querySelector('color');
                    let resolvedColor = resolveColor(colorNode);
                    if (!resolvedColor || resolvedColor === '#000000' || (colorNode && (colorNode.getAttribute('auto') === '1' || colorNode.getAttribute('indexed') === '64'))) {
                        resolvedColor = '#64748b';
                    }
                    const color = resolvedColor;
                    
                    let cssStyle = '1px solid ' + color;
                    if (style === 'thin' || style === 'hair') cssStyle = `1px solid ${color}`;
                    else if (style === 'medium') cssStyle = `1.5px solid ${color}`;
                    else if (style === 'thick') cssStyle = `2px solid ${color}`;
                    else if (style === 'double') cssStyle = `3px double ${color}`;
                    else if (style === 'dashed' || style === 'dashDot') cssStyle = `1px dashed ${color}`;
                    else if (style === 'dotted') cssStyle = `1px dotted ${color}`;
                    return { style, color, css: cssStyle };
                };

                borders.push({
                    left: parseSide(['left', 'start']),
                    right: parseSide(['right', 'end']),
                    top: parseSide(['top']),
                    bottom: parseSide(['bottom'])
                });
            });

            // XFs de Celda (cellXfs)
            const xfNodes = stylesDoc.querySelectorAll('cellXfs > xf');
            const cellXfs = [];
            xfNodes.forEach(xfNode => {
                const fontId = parseInt(xfNode.getAttribute('fontId') || '0', 10);
                const fillId = parseInt(xfNode.getAttribute('fillId') || '0', 10);
                const borderId = parseInt(xfNode.getAttribute('borderId') || '0', 10);
                const applyFont = xfNode.getAttribute('applyFont') !== '0';
                const applyFill = xfNode.getAttribute('applyFill') !== '0';
                const applyBorder = xfNode.getAttribute('applyBorder') !== '0';
                const alignNode = xfNode.querySelector('alignment');

                let align = null, valign = null, wrap = false, indent = 0;
                if (alignNode) {
                    if (alignNode.getAttribute('horizontal')) align = alignNode.getAttribute('horizontal');
                    if (alignNode.getAttribute('vertical')) {
                        valign = alignNode.getAttribute('vertical') === 'center' ? 'middle' : alignNode.getAttribute('vertical');
                    }
                    if (alignNode.getAttribute('wrapText') === '1' || alignNode.getAttribute('wrapText') === 'true') {
                        wrap = true;
                    }
                    if (alignNode.getAttribute('indent')) {
                        indent = parseInt(alignNode.getAttribute('indent'), 10) || 0;
                    }
                }

                cellXfs.push({
                    font: fonts[fontId] || fonts[0],
                    fill: (fillId > 0 && fills[fillId]) ? fills[fillId] : null,
                    border: (borderId > 0 && borders[borderId]) ? borders[borderId] : null,
                    align, valign, wrap, indent
                });
            });

            // 3. Mapear cada hoja a sus celdas mediante mapeo de relaciones de workbook.xml
            const sheetStylesMap = {}; // { sheetIdx / sheetName: { "r_c": styleObj } }

            // Parsear relaciones de workbook si están disponibles
            const sheetPathOrder = [];
            if (zipFiles['xl/workbook.xml'] && zipFiles['xl/_rels/workbook.xml.rels']) {
                try {
                    const wbDoc = parser.parseFromString(zipFiles['xl/workbook.xml'], 'text/xml');
                    const relsDoc = parser.parseFromString(zipFiles['xl/_rels/workbook.xml.rels'], 'text/xml');
                    
                    const relsMap = {};
                    relsDoc.querySelectorAll('Relationship').forEach(rel => {
                        relsMap[rel.getAttribute('Id')] = rel.getAttribute('Target');
                    });

                    const sheetNodes = wbDoc.querySelectorAll('sheets > sheet');
                    sheetNodes.forEach((sNode, idx) => {
                        const rId = sNode.getAttribute('r:id') || sNode.getAttribute('id');
                        const sName = sNode.getAttribute('name');
                        let target = relsMap[rId] || `worksheets/sheet${idx + 1}.xml`;
                        if (!target.startsWith('xl/')) {
                            target = 'xl/' + target.replace(/^\/?/, '');
                        }
                        sheetPathOrder.push({ idx, name: sName, path: target });
                    });
                } catch (e) { /* fallback a escaneo directo */ }
            }

            if (sheetPathOrder.length > 0) {
                sheetPathOrder.forEach(({ idx, name, path }) => {
                    const xmlContent = zipFiles[path] || zipFiles[path.replace('xl/', '')] || zipFiles['xl/' + path];
                    if (!xmlContent) return;
                    try {
                        const sheetDoc = parser.parseFromString(xmlContent, 'text/xml');
                        const cellNodes = sheetDoc.querySelectorAll('row > c');
                        const sheetMap = {};

                        cellNodes.forEach(cNode => {
                            const cellRef = cNode.getAttribute('r');
                            const sIdx = parseInt(cNode.getAttribute('s') || '0', 10);
                            if (!cellRef || isNaN(sIdx)) return;

                            const decoded = this.decodeCellRef(cellRef);
                            if (!decoded) return;
                            const key = `${decoded.r}_${decoded.c}`;
                            const xf = cellXfs[sIdx];
                            if (xf) sheetMap[key] = xf;
                        });

                        sheetStylesMap[idx] = sheetMap;
                        if (name) sheetStylesMap[name] = sheetMap;
                    } catch (e) { /* noop */ }
                });
            } else {
                // Escaneo directo de rutas worksheets/sheetX.xml
                Object.keys(zipFiles).forEach(zipPath => {
                    if (!zipPath.includes('worksheets/sheet') || !zipPath.endsWith('.xml')) return;
                    const match = zipPath.match(/sheet(\d+)\.xml/);
                    const sheetIdx = match ? parseInt(match[1], 10) - 1 : 0;
                    
                    try {
                        const sheetDoc = parser.parseFromString(zipFiles[zipPath], 'text/xml');
                        const cellNodes = sheetDoc.querySelectorAll('row > c');
                        const sheetMap = {};

                        cellNodes.forEach(cNode => {
                            const cellRef = cNode.getAttribute('r');
                            const sIdx = parseInt(cNode.getAttribute('s') || '0', 10);
                            if (!cellRef || isNaN(sIdx)) return;

                            const decoded = this.decodeCellRef(cellRef);
                            if (!decoded) return;
                            const key = `${decoded.r}_${decoded.c}`;
                            const xf = cellXfs[sIdx];
                            if (xf) sheetMap[key] = xf;
                        });

                        sheetStylesMap[sheetIdx] = sheetMap;
                    } catch (e) { /* noop */ }
                });
            }

            return sheetStylesMap;
        },

        /**
         * Aplica el factor de tinte a un color HEX
         */
        applyTint(hex, tint) {
            if (!tint || isNaN(tint)) return hex;
            let r = parseInt(hex.slice(1, 3), 16) || 0;
            let g = parseInt(hex.slice(3, 5), 16) || 0;
            let b = parseInt(hex.slice(5, 7), 16) || 0;

            if (tint > 0) {
                r = Math.round(r * (1 - tint) + 255 * tint);
                g = Math.round(g * (1 - tint) + 255 * tint);
                b = Math.round(b * (1 - tint) + 255 * tint);
            } else {
                r = Math.round(r * (1 + tint));
                g = Math.round(g * (1 + tint));
                b = Math.round(b * (1 + tint));
            }
            return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
        },

        /**
         * Descomprime archivos ZIP (OPC / .xlsx) en memoria usando DecompressionStream nativo del navegador
         */
        async unzipArrayBuffer(buffer) {
            const view = new DataView(buffer);
            const files = {};
            const len = buffer.byteLength;

            // 1. Buscar End of Central Directory (EOCD)
            let eocdOffset = -1;
            for (let i = len - 22; i >= Math.max(0, len - 65536); i--) {
                if (view.getUint32(i, true) === 0x06054b50) {
                    eocdOffset = i;
                    break;
                }
            }

            if (eocdOffset !== -1) {
                const cdCount = view.getUint16(eocdOffset + 10, true);
                const cdOffset = view.getUint32(eocdOffset + 16, true);
                let cdPos = cdOffset;

                for (let i = 0; i < cdCount && cdPos < len - 46; i++) {
                    const sig = view.getUint32(cdPos, true);
                    if (sig !== 0x02014b50) break;

                    const method = view.getUint16(cdPos + 10, true);
                    const compSize = view.getUint32(cdPos + 20, true);
                    const uncompSize = view.getUint32(cdPos + 24, true);
                    const nameLen = view.getUint16(cdPos + 28, true);
                    const extraLen = view.getUint16(cdPos + 30, true);
                    const commentLen = view.getUint16(cdPos + 32, true);
                    const localHeaderOffset = view.getUint32(cdPos + 42, true);

                    const nameBytes = new Uint8Array(buffer, cdPos + 46, nameLen);
                    const fileName = new TextDecoder('utf-8').decode(nameBytes);

                    if (localHeaderOffset + 30 <= len) {
                        const locNameLen = view.getUint16(localHeaderOffset + 26, true);
                        const locExtraLen = view.getUint16(localHeaderOffset + 28, true);
                        const dataOffset = localHeaderOffset + 30 + locNameLen + locExtraLen;

                        if (compSize > 0 && dataOffset + compSize <= len) {
                            const compData = new Uint8Array(buffer, dataOffset, compSize);
                            try {
                                if (method === 0) {
                                    files[fileName] = new TextDecoder('utf-8').decode(compData);
                                } else if (method === 8 && typeof DecompressionStream !== 'undefined') {
                                    const ds = new DecompressionStream('deflate-raw');
                                    const resp = new Response(compData).body.pipeThrough(ds);
                                    const decomp = await new Response(resp).arrayBuffer();
                                    files[fileName] = new TextDecoder('utf-8').decode(decomp);
                                }
                            } catch (e) { /* noop */ }
                        }
                    }

                    cdPos += 46 + nameLen + extraLen + commentLen;
                }
            }

            return files;
        },

        /**
         * Convierte un Workbook de SheetJS a la estructura nativa de EduContaSpreadsheetEngine
         */
        convertWorkbookToEduConta(workbook, cleanName, xmlStylesMap = {}) {
            const convertedSheets = [];
            let maxTotalRows = 100;
            let maxTotalCols = 26;

            workbook.SheetNames.forEach((sheetName, sheetIdx) => {
                const ws = workbook.Sheets[sheetName];
                if (!ws) return;

                const ref = ws['!ref'] || 'A1:Z100';
                let range;
                try {
                    range = XLSX.utils.decode_range(ref);
                } catch (e) {
                    range = { s: { r: 0, c: 0 }, e: { r: 99, c: 25 } };
                }

                const sheetRowCount = Math.max(100, range.e.r + 20);
                const sheetColCount = Math.max(26, range.e.c + 6);
                if (sheetRowCount > maxTotalRows) maxTotalRows = sheetRowCount;
                if (sheetColCount > maxTotalCols) maxTotalCols = sheetColCount;

                const sheetData = {};
                const colWidths = {};
                const rowHeights = {};
                const sheetXmlStyles = xmlStylesMap[sheetIdx] || xmlStylesMap[sheetName] || {};

                // 1. Mapeo de anchos de columna (!cols)
                if (Array.isArray(ws['!cols'])) {
                    ws['!cols'].forEach((col, cIdx) => {
                        if (!col) return;
                        if (col.wpx) {
                            colWidths[cIdx] = Math.round(col.wpx);
                        } else if (col.wch) {
                            colWidths[cIdx] = Math.max(50, Math.min(600, Math.round(col.wch * 8.2 + 12)));
                        } else if (col.width) {
                            colWidths[cIdx] = Math.max(50, Math.min(600, Math.round(col.width * 8.2)));
                        }
                    });
                }

                // 2. Mapeo de altos de fila (!rows)
                if (Array.isArray(ws['!rows'])) {
                    ws['!rows'].forEach((row, rIdx) => {
                        if (!row) return;
                        if (row.hpx) {
                            rowHeights[rIdx] = Math.round(row.hpx);
                        } else if (row.hpt) {
                            rowHeights[rIdx] = Math.round(row.hpt * 1.33);
                        }
                    });
                }

                // 3. Mapeo de celdas combinadas (!merges)
                if (Array.isArray(ws['!merges'])) {
                    ws['!merges'].forEach(mergeRange => {
                        const r1 = mergeRange.s.r;
                        const c1 = mergeRange.s.c;
                        const r2 = mergeRange.e.r;
                        const c2 = mergeRange.e.c;
                        const rowspan = r2 - r1 + 1;
                        const colspan = c2 - c1 + 1;

                        const rootKey = `${r1}_${c1}`;
                        sheetData[rootKey] = sheetData[rootKey] || {};
                        sheetData[rootKey].merge = { rowspan, colspan };

                        // Marcar celdas absorbidas
                        for (let r = r1; r <= r2; r++) {
                            for (let c = c1; c <= c2; c++) {
                                if (r === r1 && c === c1) continue;
                                const childKey = `${r}_${c}`;
                                sheetData[childKey] = sheetData[childKey] || {};
                                sheetData[childKey].mergedInto = { r: r1, c: c1 };
                            }
                        }
                    });
                }

                // 4. Mapeo de celdas individuales
                for (let r = range.s.r; r <= range.e.r; r++) {
                    for (let c = range.s.c; c <= range.e.c; c++) {
                        const cellRef = XLSX.utils.encode_cell({ r, c });
                        const cell = ws[cellRef];
                        const key = `${r}_${c}`;
                        const xfStyle = sheetXmlStyles[key];

                        if (!cell && !xfStyle) continue;

                        sheetData[key] = sheetData[key] || {};
                        const cellObj = sheetData[key];

                        if (cell) {
                            // A. Valor y Tipo (preservando tipo numérico para operaciones de fórmulas)
                            let rawValue = cell.v;
                            if (cell.t === 'd' && cell.v instanceof Date) {
                                const d = cell.v;
                                const day = String(d.getDate()).padStart(2, '0');
                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                const year = d.getFullYear();
                                rawValue = `${day}/${month}/${year}`;
                                cellObj.fmt = 'date_dmy';
                            } else if (cell.t === 'b') {
                                rawValue = !!cell.v;
                            } else if (cell.t === 'n') {
                                rawValue = typeof cell.v === 'number' ? cell.v : parseFloat(cell.v);
                                if (isNaN(rawValue)) rawValue = cell.v;
                            } else if (cell.t === 's' && typeof cell.v === 'string') {
                                // Si es un string pero representa moneda o porcentaje, parsear a número limpio
                                const trimmed = cell.v.trim();
                                if (/^[-+]?\$?\s*[\d,]+(?:\.\d+)?%?$/.test(trimmed)) {
                                    let cleanNum = trimmed.replace(/[$€\s]/g, '');
                                    const isPercent = cleanNum.endsWith('%');
                                    if (isPercent) cleanNum = cleanNum.replace('%', '');
                                    cleanNum = cleanNum.replace(/,/g, '');
                                    const parsed = parseFloat(cleanNum);
                                    if (!isNaN(parsed)) {
                                        rawValue = isPercent ? (parsed / 100) : parsed;
                                        if (isPercent && !cellObj.fmt) cellObj.fmt = 'percent';
                                        if (trimmed.includes('$') && !cellObj.fmt) cellObj.fmt = 'usd';
                                    }
                                }
                            }

                            if (rawValue !== undefined && rawValue !== null) {
                                cellObj.v = rawValue;
                            }

                            // B. Fórmulas de Excel y Normalización
                            if (cell.f) {
                                let formulaStr = String(cell.f).trim();
                                if (formulaStr.startsWith('=')) {
                                    formulaStr = formulaStr.substring(1);
                                }
                                cellObj.f = formulaStr;
                            }

                            // C. Detección Inteligente de Formatos Contables
                            const numFmt = (cell.z || '').toLowerCase();
                            const formattedText = (cell.w || '').trim();

                            if (!cellObj.fmt) {
                                if (numFmt.includes('$') || formattedText.startsWith('$') || numFmt.includes('usd') || formattedText.includes('-$')) {
                                    cellObj.fmt = 'usd';
                                    cellObj.fmtDecimals = 2;
                                } else if (numFmt.includes('%') || formattedText.endsWith('%')) {
                                    cellObj.fmt = 'percent';
                                    cellObj.fmtDecimals = 2;
                                } else if (numFmt.includes('yy') || numFmt.includes('dd') || numFmt.includes('mm/dd') || /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(formattedText)) {
                                    cellObj.fmt = 'date_dmy';
                                } else if (numFmt.includes('hh:mm') || numFmt.includes('h:mm')) {
                                    cellObj.fmt = 'time_24h';
                                } else if (cell.t === 'n' && (numFmt.includes('0.00') || numFmt.includes('#,##0') || formattedText.includes(','))) {
                                    cellObj.fmt = 'number';
                                    cellObj.fmtDecimals = 2;
                                }
                            }
                        }

                        // D. Inyección de Estilos, Colores y Bordes Extraídos del XML
                        if (xfStyle) {
                            if (xfStyle.fill && xfStyle.fill.bgcolor) {
                                cellObj.bgcolor = xfStyle.fill.bgcolor;
                            }
                            if (xfStyle.font) {
                                if (xfStyle.font.bold) cellObj.bold = true;
                                if (xfStyle.font.italic) cellObj.italic = true;
                                if (xfStyle.font.underline) cellObj.underline = true;
                                if (xfStyle.font.strikethrough) cellObj.strikethrough = true;
                                if (xfStyle.font.color) cellObj.color = xfStyle.font.color;
                                if (xfStyle.font.name) cellObj.font = xfStyle.font.name;
                                if (xfStyle.font.size) cellObj.size = xfStyle.font.size;
                            }
                            if (xfStyle.align) cellObj.align = xfStyle.align;
                            if (xfStyle.valign) cellObj.valign = xfStyle.valign;
                            if (xfStyle.wrap) cellObj.wrap = true;
                            if (xfStyle.indent) cellObj.indent = xfStyle.indent;

                            if (xfStyle.border) {
                                const b = xfStyle.border;
                                if (b.top) cellObj.borderTop = b.top.css;
                                if (b.bottom) cellObj.borderBottom = b.bottom.css;
                                if (b.left) cellObj.borderLeft = b.left.css;
                                if (b.right) cellObj.borderRight = b.right.css;

                                if (b.top && b.bottom && b.left && b.right && b.top.css === b.bottom.css && b.top.css === b.left.css && b.top.css === b.right.css) {
                                    cellObj.border = 'all';
                                    cellObj.borderColor = b.top.color || '#64748b';
                                }
                            }
                        }
                    }
                }

                convertedSheets.push({
                    id: 'sheet_' + (sheetIdx + 1),
                    name: sheetName || `Hoja${sheetIdx + 1}`,
                    data: sheetData,
                    colWidths: colWidths,
                    rowHeights: rowHeights,
                    hiddenCols: {},
                    hiddenRows: {},
                    colFormats: {},
                    tables: []
                });
            });

            if (convertedSheets.length === 0) {
                convertedSheets.push({
                    id: 'sheet_1',
                    name: 'Hoja1',
                    data: {},
                    colWidths: {},
                    rowHeights: {},
                    hiddenCols: {},
                    hiddenRows: {},
                    colFormats: {},
                    tables: []
                });
            }

            return {
                id: 'proj_' + Date.now(),
                name: cleanName || 'Hoja de Cálculo',
                type: 'calculo',
                catalogo: 'MAESTRO',
                sector: 'ALL',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                sheets: convertedSheets,
                data: convertedSheets,
                options: {
                    rowCount: Math.min(1000, Math.max(100, maxTotalRows)),
                    colCount: Math.min(100, Math.max(26, maxTotalCols))
                }
            };
        },

        /**
         * Decodifica una referencia tipo "A1" o "BC24" a coordenadas { r, c } (0-indexed)
         */
        decodeCellRef(ref) {
            if (!ref) return null;
            const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
            if (!match) return null;
            const colStr = match[1];
            const row = parseInt(match[2], 10) - 1;
            let col = 0;
            for (let i = 0; i < colStr.length; i++) {
                col = col * 26 + (colStr.charCodeAt(i) - 64);
            }
            col -= 1;
            return { r: row, c: col };
        },

        /**
         * Utilidad para leer archivo como ArrayBuffer
         */
        readFileAsArrayBuffer(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => reject(new Error("Fallo de lectura de bajo nivel al leer los bytes del archivo."));
                reader.readAsArrayBuffer(file);
            });
        },

        /**
         * Utilidad para leer archivo como texto plano
         */
        readFileAsText(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => reject(new Error("Fallo de lectura de texto al abrir el archivo."));
                reader.readAsText(file);
            });
        },

        // =========================================================================
        // MODAL DE DIAGNÓSTICO Y REPORTE DE ERRORES GLASSMORPHIC
        // =========================================================================

        /**
         * Muestra un modal Glassmorphic informativo con detalles técnicos y botón de copiado
         * @param {Object} info - Datos del error ({ file, error, stage, customMessage })
         */
        showImportErrorModal(info = {}) {
            const error = info.error || new Error("Error desconocido durante la importación.");
            const file = info.file || {};
            const fileName = file.name || info.fileName || 'archivo_desconocido';
            const fileSize = file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Desconocido';
            const fileType = file.type || fileName.split('.').pop() || 'Desconocido';
            const stage = info.stage || error.stage || 'Procesamiento del archivo';
            const customMessage = info.customMessage || error.message || 'No fue posible importar o procesar el archivo seleccionado.';

            const diagnosticReport = [
                `========================================`,
                `REPORTE DE ERROR - EDUCONTA SV IMPORTACIÓN`,
                `Fecha: ${new Date().toISOString()}`,
                `Navegador: ${navigator.userAgent}`,
                `========================================`,
                `Archivo: ${fileName}`,
                `Tamaño: ${fileSize}`,
                `Tipo detectado: ${fileType}`,
                `Etapa del fallo: ${stage}`,
                `Mensaje de error: ${customMessage}`,
                `Stack técnico:`,
                error.stack || 'No stack trace available.',
                `========================================`
            ].join('\n');

            window._lastImportErrorReport = diagnosticReport;

            let modalEl = document.getElementById('educonta-import-error-modal');
            if (!modalEl) {
                modalEl = document.createElement('div');
                modalEl.id = 'educonta-import-error-modal';
                modalEl.className = 'educonta-modal-overlay';
                document.body.appendChild(modalEl);
            }

            modalEl.innerHTML = `
                <div class="educonta-modal-content max-w-lg w-full relative p-6 md:p-8" style="max-width: 520px; border-radius: 32px !important; box-shadow: 0 25px 60px -15px rgba(225, 29, 72, 0.25), 0 0 0 1px rgba(244, 63, 94, 0.25) !important;">
                    <button type="button" onclick="EduContaExcelImporter.closeImportErrorModal()" class="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-all focus:outline-none">
                        <i class="fas fa-times text-sm"></i>
                    </button>

                    <div class="w-16 h-16 rounded-[28px] bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mb-4 mx-auto shadow-lg shadow-rose-500/10">
                        <i class="fas fa-triangle-exclamation text-2xl animate-pulse"></i>
                    </div>

                    <h4 class="text-xl md:text-2xl font-black text-slate-800 dark:text-white text-center mb-1">Error de Importación</h4>
                    <p class="text-[11px] text-rose-500 font-bold uppercase tracking-widest text-center mb-4">No se pudo procesar el archivo</p>

                    <div class="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl p-3.5 mb-4 text-xs text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
                        <p class="mb-1 font-bold"><i class="fas fa-circle-info mr-1 text-rose-500"></i> ${this.escapeHtml(customMessage)}</p>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400">Verifica que el archivo no esté protegido con contraseña, dañado o en un formato no reconocido.</p>
                    </div>

                    <div class="flex items-center justify-between px-3.5 py-2 bg-slate-100/80 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 mb-3 text-[11px] tabular-nums">
                        <span class="truncate font-bold text-slate-700 dark:text-slate-300 max-w-[200px]" title="${this.escapeHtml(fileName)}">
                            <i class="fas fa-file-excel mr-1.5 text-amber-500"></i>${this.escapeHtml(fileName)}
                        </span>
                        <span class="text-slate-400 font-semibold">${fileSize}</span>
                    </div>

                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-1 px-1">
                            <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Detalles de Diagnóstico</span>
                            <span class="text-[9px] text-amber-500 font-bold uppercase">${this.escapeHtml(stage)}</span>
                        </div>
                        <div class="bg-slate-900 text-amber-300 font-mono text-[11px] p-3 rounded-2xl max-h-32 overflow-y-auto custom-scrollbar border border-slate-800 shadow-inner select-all leading-tight">
                            ${this.escapeHtml(error.stack || error.message || 'Sin traza técnica disponible.')}
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-2.5 pt-1">
                        <button type="button" id="btn-copy-error-details" onclick="EduContaExcelImporter.copyImportErrorDetails()" class="flex-1 px-4 py-3 rounded-[36px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase transition-all shadow-sm flex items-center justify-center gap-2">
                            <i class="fas fa-copy text-amber-500"></i> <span>Copiar Diagnóstico</span>
                        </button>
                        <button type="button" onclick="EduContaExcelImporter.closeImportErrorModal()" class="flex-1 px-5 py-3 rounded-[36px] bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-black text-xs uppercase shadow-lg shadow-rose-500/25 transition-all active:scale-95 flex items-center justify-center">
                            <span>Entendido</span>
                        </button>
                    </div>
                </div>
            `;

            modalEl.style.display = 'flex';
            modalEl.classList.remove('closing');
        },

        closeImportErrorModal() {
            const modalEl = document.getElementById('educonta-import-error-modal');
            if (modalEl) {
                modalEl.classList.add('closing');
                setTimeout(() => {
                    modalEl.style.display = 'none';
                    modalEl.classList.remove('closing');
                }, 280);
            }
        },

        async copyImportErrorDetails() {
            const report = window._lastImportErrorReport || 'No hay reporte disponible.';
            const btn = document.getElementById('btn-copy-error-details');
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(report);
                } else {
                    const textarea = document.createElement('textarea');
                    textarea.value = report;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                }

                if (btn) {
                    const origHtml = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check text-emerald-500"></i> <span class="text-emerald-500">¡Copiado!</span>';
                    setTimeout(() => { btn.innerHTML = origHtml; }, 2000);
                }
            } catch (err) {
                console.error("Error al copiar diagnóstico:", err);
                if (btn) btn.innerText = "No se pudo copiar";
            }
        },

        escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    };

    // Exponer globalmente
    window.EduContaExcelImporter = EduContaExcelImporter;
    window.showImportErrorModal = function (info) {
        EduContaExcelImporter.showImportErrorModal(info);
    };
    window.closeImportErrorModal = function () {
        EduContaExcelImporter.closeImportErrorModal();
    };

})(window);
