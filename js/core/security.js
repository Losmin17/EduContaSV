/**
 * =====================================================================
 * EduConta SV · Utilidades de seguridad compartidas (window.EduSec)
 * ---------------------------------------------------------------------
 * - escapeHtml(value)        → Escapa texto para interpolarlo en plantillas HTML.
 * - sanitizeHtml(html)       → DocumentFragment seguro (lista blanca) para pegado/contenido rico.
 * - sanitizeHtmlString(html) → Igual que sanitizeHtml pero devuelve string.
 * - isSafeExpression(expr)   → Guardia del evaluador de fórmulas antes de Function().
 * - safeStorage.getJSON/setJSON → localStorage tolerante a JSON corrupto y cuota llena.
 *
 * Se carga de forma síncrona antes de supabase.js en todas las páginas.
 * Sin dependencias externas.
 * =====================================================================
 */
(function (global) {
    'use strict';

    // ─────────────────────────────────────────────────────────────────
    // 1. Escape de texto para HTML (contenido y atributos)
    // ─────────────────────────────────────────────────────────────────
    const HTML_ESCAPES = {
        '&': '&amp;', '<': '&lt;', '>': '&gt;',
        '"': '&quot;', "'": '&#39;', '`': '&#96;'
    };

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"'`]/g, ch => HTML_ESCAPES[ch]);
    }

    /**
     * Literal JS seguro para usar DENTRO de un atributo HTML de evento:
     *   `onclick="fn(${EduSec.jsArg(nombre)})"`
     * JSON.stringify produce un string JS válido y escapeHtml evita romper el atributo.
     */
    function jsArg(value) {
        return escapeHtml(JSON.stringify(String(value ?? '')));
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. Sanitizador HTML por lista blanca
    //    DOMParser genera un documento INERTE: no ejecuta <script> ni
    //    dispara onerror/onload durante el parseo (a diferencia de
    //    asignar innerHTML a un nodo del documento activo).
    // ─────────────────────────────────────────────────────────────────
    const ALLOWED_TAGS = new Set([
        'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SUB', 'SUP', 'SPAN', 'DIV', 'FONT',
        'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'CODE', 'MARK',
        'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD', 'COLGROUP', 'COL', 'CAPTION',
        'A', 'IMG', 'HR', 'FIGURE', 'FIGCAPTION', 'SMALL'
    ]);

    // Etiquetas cuyo contenido completo se descarta (no solo la etiqueta)
    const DROP_WITH_CONTENT = new Set([
        'SCRIPT', 'STYLE', 'IFRAME', 'FRAME', 'FRAMESET', 'OBJECT', 'EMBED', 'APPLET', 'LINK', 'META',
        'BASE', 'SVG', 'MATH', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'TEMPLATE', 'NOSCRIPT',
        'AUDIO', 'VIDEO', 'SOURCE', 'TRACK', 'PORTAL', 'XML', 'TITLE', 'HEAD'
    ]);

    const ALLOWED_ATTRS = new Set([
        'href', 'src', 'alt', 'title', 'colspan', 'rowspan', 'style', 'class',
        'width', 'height', 'align', 'valign', 'color', 'face', 'size', 'target'
    ]);

    const ALLOWED_STYLES = new Set([
        'font-weight', 'font-style', 'font-size', 'font-family', 'text-decoration',
        'text-decoration-line', 'text-align', 'color', 'background-color', 'vertical-align',
        'text-transform', 'letter-spacing', 'line-height', 'width', 'height',
        'border', 'border-collapse', 'padding', 'margin-left', 'text-indent'
    ]);

    const SAFE_URL = /^(https?:|mailto:|tel:|#|\/|\.\/|data:image\/(png|jpe?g|gif|webp|bmp);base64,)/i;

    function cleanElement(el) {
        // Atributos
        for (const attr of [...el.attributes]) {
            const name = attr.name.toLowerCase();
            if (!ALLOWED_ATTRS.has(name)) {
                el.removeAttribute(attr.name);
                continue;
            }
            if (name === 'href' || name === 'src') {
                const url = attr.value.trim().replace(/[\u0000-\u001F\u007F\s]+/g, '');
                if (!SAFE_URL.test(url)) el.removeAttribute(attr.name);
            } else if (name === 'class') {
                const classes = attr.value.split(/\s+/).filter(c => c && !c.startsWith('Mso'));
                classes.length ? el.setAttribute('class', classes.join(' ')) : el.removeAttribute('class');
            } else if (name === 'target') {
                el.setAttribute('target', '_blank');
            }
        }

        // Estilos en línea: solo propiedades visuales seguras
        if (el.hasAttribute('style')) {
            const kept = [];
            for (let i = 0; i < el.style.length; i++) {
                const prop = el.style[i];
                if (!ALLOWED_STYLES.has(prop)) continue;
                const val = el.style.getPropertyValue(prop);
                if (/url\s*\(|expression\s*\(|javascript:/i.test(val)) continue;
                kept.push(`${prop}: ${val}`);
            }
            kept.length ? el.setAttribute('style', kept.join('; ')) : el.removeAttribute('style');
        }

        if (el.tagName === 'A') el.setAttribute('rel', 'noopener noreferrer');
    }

    function walk(parent) {
        for (const node of [...parent.childNodes]) {
            if (node.nodeType === 8) { // comentario
                node.remove();
                continue;
            }
            if (node.nodeType !== 1) continue;

            const tag = node.tagName.toUpperCase();
            if (DROP_WITH_CONTENT.has(tag) || tag.includes(':')) {
                // Etiquetas peligrosas o de Office (o:p, v:shape, w:…)
                if (tag.includes(':') && !DROP_WITH_CONTENT.has(tag)) {
                    walk(node);
                    node.replaceWith(...node.childNodes);
                } else {
                    node.remove();
                }
                continue;
            }
            if (!ALLOWED_TAGS.has(tag)) {
                // Etiqueta desconocida: conservar su contenido limpio
                walk(node);
                node.replaceWith(...node.childNodes);
                continue;
            }
            cleanElement(node);
            walk(node);
        }
    }

    function parseClean(dirty) {
        const doc = new DOMParser().parseFromString(String(dirty ?? ''), 'text/html');
        walk(doc.body);
        return doc.body;
    }

    /** Devuelve un DocumentFragment saneado, listo para insertar en el DOM. */
    function sanitizeHtml(dirty) {
        const body = parseClean(dirty);
        const frag = document.createDocumentFragment();
        frag.append(...body.childNodes);
        return frag;
    }

    /** Devuelve el HTML saneado como string (para código que trabaja con strings). */
    function sanitizeHtmlString(dirty) {
        return parseClean(dirty).innerHTML;
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. Guardia del evaluador de fórmulas
    //    Tras traducir la fórmula a JS, solo deben quedar números,
    //    operadores, paréntesis, literales JSON y llamadas Math.* permitidas.
    //    Cualquier identificador restante (fetch, window, localStorage…) bloquea.
    // ─────────────────────────────────────────────────────────────────
    const MATH_ALLOWED = /\bMath\.(abs|ceil|floor|round|trunc|pow|sqrt|cbrt|max|min|sign|log|log10|log2|exp|sin|cos|tan|asin|acos|atan|atan2|PI|E|random|hypot)\b/g;
    const SAFE_RESIDUE = /^[\d\s.+\-*/%()<>=!?:&|,\[\]]*$/;

    function isSafeExpression(expr) {
        if (typeof expr !== 'string') return false;
        const residue = expr
            .replace(/"(?:[^"\\]|\\.)*"/g, '0')            // literales generados con JSON.stringify
            .replace(/'(?:[^'\\]|\\.)*'/g, '0')
            .replace(MATH_ALLOWED, '0')
            .replace(/\b(true|false|null|NaN|Infinity)\b/g, '0')
            .replace(/\d*\.?\d+e[+-]?\d+/gi, '0');         // notación científica
        // Bloquea llamadas sobre accesos por corchetes: (0)["constructor"]["constructor"]("…")()
        if (/\]\s*\(/.test(residue)) return false;
        return SAFE_RESIDUE.test(residue);
    }

    // ─────────────────────────────────────────────────────────────────
    // 4. Persistencia local segura
    // ─────────────────────────────────────────────────────────────────
    const safeStorage = {
        /** Lee y parsea JSON. Devuelve fallback si no existe o está corrupto. */
        getJSON(key, fallback = null) {
            try {
                const raw = global.localStorage.getItem(key);
                return raw == null ? fallback : JSON.parse(raw);
            } catch (err) {
                console.warn(`[EduSec] JSON corrupto en "${key}". Se usa el valor por defecto.`, err);
                return fallback;
            }
        },
        /** Guarda JSON. Si la cuota se agota emite 'educonta:storage-error' en vez de fallar en silencio. */
        setJSON(key, value) {
            try {
                global.localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (err) {
                const quota = !!err && (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014);
                console.error(`[EduSec] No se pudo guardar "${key}"${quota ? ' (almacenamiento lleno)' : ''}.`, err);
                global.dispatchEvent(new CustomEvent('educonta:storage-error', { detail: { key, quota } }));
                return false;
            }
        }
    };

    global.EduSec = Object.freeze({
        escapeHtml,
        jsArg,
        sanitizeHtml,
        sanitizeHtmlString,
        isSafeExpression,
        safeStorage
    });
})(window);
