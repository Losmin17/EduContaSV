/**
 * Editor y Compilador Interactivo de Líneas para EduConvert - EduConta SV
 */

class LawEditor {
    constructor() {
        this.lines = []; // Array de {text, type}
        this.compiledArticles = []; // Array de artículos estructurados
        this.activeLineIndex = null;
        
        // Mapeo de tipos y sus colores
        this.types = ['TXT', 'ART', 'TART', 'TIT', 'CAP', 'SEC', 'IGN'];
    }

    /**
     * Inicializa el editor con un conjunto de líneas ya clasificadas.
     * @param {Array} parsedLines 
     */
    init(parsedLines) {
        this.lines = parsedLines;
        this.renderLines();
        this.updateTreePreview();
    }

    /**
     * Renderiza las líneas en el panel de anotaciones.
     */
    renderLines() {
        const container = document.getElementById('line-annotator-container');
        const badgeCount = document.getElementById('lines-count-badge');
        if (!container) return;

        container.innerHTML = '';
        badgeCount.innerText = `${this.lines.length} Líneas`;

        this.lines.forEach((line, index) => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'annotator-line';
            lineDiv.dataset.index = index;

            // Número de línea
            const numSpan = document.createElement('span');
            numSpan.className = 'line-number';
            numSpan.innerText = index + 1;

            // Badge del Tipo
            const typeBadge = document.createElement('span');
            typeBadge.className = `badge-tag type-${line.type}`;
            typeBadge.innerText = line.type;
            
            // Evento click en el badge para cambiar el tipo (ciclo de tipos)
            typeBadge.onclick = (e) => {
                e.stopPropagation();
                this.cycleLineType(index);
            };

            // Texto de la línea
            const textSpan = document.createElement('span');
            textSpan.className = 'line-text';
            textSpan.innerText = line.text;

            lineDiv.appendChild(numSpan);
            lineDiv.appendChild(typeBadge);
            lineDiv.appendChild(textSpan);

            container.appendChild(lineDiv);
        });
    }

    /**
     * Alterna cíclicamente el tipo de una línea seleccionada.
     * @param {number} index 
     */
    cycleLineType(index) {
        const line = this.lines[index];
        const currentTypeIndex = this.types.indexOf(line.type);
        const nextTypeIndex = (currentTypeIndex + 1) % this.types.length;
        line.type = this.types[nextTypeIndex];
        
        // Actualizar visualmente la línea en el DOM
        const lineDiv = document.querySelector(`.annotator-line[data-index="${index}"]`);
        if (lineDiv) {
            const badge = lineDiv.querySelector('.badge-tag');
            badge.className = `badge-tag type-${line.type}`;
            badge.innerText = line.type;
        }

        // Actualizar vista previa del árbol
        this.updateTreePreview();
    }

    /**
     * Compila la lista de líneas etiquetadas en una estructura limpia de artículos.
     * @returns {Array} Arreglo de artículos
     */
    compile() {
        const compiled = [];
        let currentTitle = null;
        let currentChapter = null;
        let currentSection = null;
        let currentArticle = null;
        let orderCounter = 1;
        let pendingArticleTitle = null;

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const trimmedText = line.text.trim();
            if (!trimmedText) continue;

            switch (line.type) {
                case 'TIT':
                    currentTitle = trimmedText;
                    currentChapter = null; // Reiniciar jerarquía inferior
                    currentSection = null;
                    break;
                case 'CAP':
                    currentChapter = trimmedText;
                    currentSection = null;
                    break;
                case 'SEC':
                    currentSection = trimmedText;
                    break;
                case 'ART':
                    // Si ya había un artículo activo, guardarlo
                    if (currentArticle) {
                        compiled.push(currentArticle);
                    }

                    // Extraer número de artículo usando regex
                    let num = "S/N";
                    const match = trimmedText.match(/^(?:Art(?:\.|ículo)?\s*(\d+[-a-zA-Z0-9]*))/i);
                    if (match) {
                        num = match[1];
                    }

                    // Limpiar el prefijo del texto del artículo
                    let text = trimmedText.replace(/^(?:Art(?:\.|ículo)?\s*\d+[-a-zA-Z0-9]*[\.\s:-]*)/i, '').trim();

                    // Si hay un título pendiente detectado en las líneas anteriores, lo inyectamos al principio
                    let articleText = text;
                    let paragraphs = [];
                    if (pendingArticleTitle) {
                        paragraphs.push(pendingArticleTitle);
                        if (text) {
                            articleText = pendingArticleTitle + "\n" + text;
                            paragraphs.push(text);
                        } else {
                            articleText = pendingArticleTitle;
                        }
                        pendingArticleTitle = null; // Limpiar
                    } else {
                        paragraphs = text ? [text] : [];
                    }

                    currentArticle = {
                        titulo_seccion: currentTitle,
                        capitulo_seccion: currentChapter,
                        seccion: currentSection,
                        numero: num,
                        texto: articleText,
                        parrafos: paragraphs,
                        orden: orderCounter++
                    };
                    break;
                case 'TART':
                    pendingArticleTitle = trimmedText;
                    break;
                case 'TXT':
                    if (currentArticle) {
                        // Agregar al texto del artículo actual
                        currentArticle.texto += "\n" + trimmedText;
                        currentArticle.parrafos.push(trimmedText);
                    }
                    break;
                case 'IGN':
                default:
                    // Ignorado
                    break;
            }
        }

        // Guardar el último artículo si quedó activo
        if (currentArticle) {
            compiled.push(currentArticle);
        }

        this.compiledArticles = compiled;
        return compiled;
    }

    /**
     * Actualiza la vista previa del árbol en el panel lateral.
     */
    updateTreePreview() {
        const container = document.getElementById('tree-preview-container');
        if (!container) return;

        container.innerHTML = '';
        
        // Compilamos en caliente para renderizar el árbol
        const tempArticles = this.compile();

        if (tempArticles.length === 0) {
            container.innerHTML = '<div class="text-slate-500 italic text-center py-8">Ningún artículo detectado aún.</div>';
            return;
        }

        let lastTitle = '';
        let lastChapter = '';
        let lastSection = '';

        tempArticles.forEach((art) => {
            // Mostrar Título si cambia
            if (art.titulo_seccion && art.titulo_seccion !== lastTitle) {
                const titleDiv = document.createElement('div');
                titleDiv.className = 'tree-node-title';
                titleDiv.innerHTML = `<i class="fas fa-bookmark text-purple-400"></i> ${art.titulo_seccion}`;
                container.appendChild(titleDiv);
                lastTitle = art.titulo_seccion;
                lastChapter = ''; // Resetear capítulos
                lastSection = '';
            }

            // Mostrar Capítulo si cambia
            if (art.capitulo_seccion && art.capitulo_seccion !== lastChapter) {
                const chapDiv = document.createElement('div');
                chapDiv.className = 'tree-node-chapter';
                chapDiv.innerHTML = `<i class="fas fa-folder text-blue-400"></i> ${art.capitulo_seccion}`;
                container.appendChild(chapDiv);
                lastChapter = art.capitulo_seccion;
                lastSection = ''; // Resetear secciones
            }

            // Mostrar Sección si cambia
            if (art.seccion && art.seccion !== lastSection) {
                const secDiv = document.createElement('div');
                secDiv.className = 'tree-node-section';
                secDiv.innerHTML = `<i class="fas fa-tags text-teal-400"></i> ${art.seccion}`;
                container.appendChild(secDiv);
                lastSection = art.seccion;
            }

            // Mostrar Artículo
            const artDiv = document.createElement('div');
            artDiv.className = 'tree-node-article';
            // Truncar texto del artículo para que quepa en el árbol
            const previewText = art.texto.length > 30 ? art.texto.substring(0, 30) + '...' : art.texto;
            artDiv.innerHTML = `<i class="fas fa-file-alt text-emerald-400"></i> <strong class="text-white">Art. ${art.numero}</strong>: ${previewText}`;
            
            container.appendChild(artDiv);
        });
    }
}

window.LawEditor = LawEditor;
