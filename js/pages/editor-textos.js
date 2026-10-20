/**
 * =====================================================================
 * EduConta SV -- Motor Completo del Editor de Textos Documentales
 * Consolidado para compatibilidad offline universal (file:// y http://)
 * Generado desde los submodulos de js/pages/editor-textos/
 * Codificacion: UTF-8 sin BOM estricto
 * =====================================================================
 */

(() => {
    'use strict';

    /* ===================================================================
     * MODULO: constants.js
     * =================================================================== */
/**
 * constants.js — Constantes globales del Editor de Textos
 * EduConta SV — Módulo sin dependencias externas.
 */

// ── Almacenamiento Local ───────────────────────────────────────────────────
const STORAGE_KEY = 'educonta_projects_textos';
const LAST_ID_KEY = 'educonta_last_project_id';
const MAX_HISTORY = 30;

// ── Dimensiones de Papel (mm) ──────────────────────────────────────────────
const PAGE_DIMENSIONS = {
    letter: { width: 215.9, height: 279.4, label: 'Carta (Letter)' },
    oficio: { width: 215.9, height: 330.2, label: 'Oficio (Folio)' },
    legal:  { width: 215.9, height: 355.6, label: 'Legal' },
    a4:     { width: 210.0, height: 297.0, label: 'A4' },
    a5:     { width: 148.0, height: 210.0, label: 'A5' }
};

// ── Preajustes de Márgenes (mm) ────────────────────────────────────────────
const MARGIN_PRESETS = {
    normal:   { top: 25, bottom: 25, left: 25, right: 25 },
    narrow:   { top: 15, bottom: 15, left: 15, right: 15 },
    moderate: { top: 20, bottom: 20, left: 20, right: 20 },
    wide:     { top: 30, bottom: 30, left: 30, right: 30 }
};

// ── Símbolos especiales ────────────────────────────────────────────────────
const SPECIAL_SYMBOLS = [
    '$', '¢', '€', '£', '¥', '©', '®', '™', '§', '¶',
    '±', '≠', '≤', '≥', '÷', '×', '‰', '°', 'µ', 'π',
    '✓', '✗', '—', '–', '…', '«', '»', '"', '"', '¿',
    '¡', '•', '→', '←', '↑', '↓', '↔', '▲', '▼', '◆'
];

// ── Paleta de colores glassmorphic ────────────────────────────────────────
const EDUCONTA_COLOR_PRESETS = [
    // Neutros / Grises
    '#000000', '#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#ffffff',
    // Ámbar (Documentos / Advertencias)
    '#451a03', '#78350f', '#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fef3c7',
    // Esmeralda (Activos / Positivos)
    '#064e3b', '#065f46', '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#d1fae5',
    // Celeste (Proyectos / Bancos)
    '#082f49', '#075985', '#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#e0f2fe',
    // Índigo (Catálogos / Cuentas)
    '#1e1b4b', '#312e81', '#3730a3', '#4338ca', '#4f46e5', '#6366f1', '#818cf8', '#e0e7ff',
    // Rojo / Rosa (Pasivos / Gastos)
    '#450a0a', '#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fee2e2',
    // Violeta / Púrpura (Patrimonio)
    '#3b0764', '#581c87', '#6b21a8', '#7e22ce', '#9333ea', '#a855f7', '#c084fc', '#f3e8ff',
    // Turquesa / Teal (Caja Chica)
    '#042f2e', '#115e59', '#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#ccfbf1'
];

// ── Factor de conversión mm → px (96 DPI) ─────────────────────────────────
function mmToPx(mm) {
    return (mm * 96) / 25.4;
}


    /* ===================================================================
     * MODULO: spellcheck-dictionary.js
     * =================================================================== */
/**
 * spellcheck-dictionary.js — Diccionario y motor lingüístico bilingüe
 * Español (con terminología contable, fiscal y comercial de El Salvador) + Inglés
 * EduConta SV — ES Module
 */

// ── 1. MAPA DE RESTAURACIÓN RÁPIDA DE ACENTOS (TILDES) EN ESPAÑOL ──────────────
// Palabras comunes frecuentemente escritas sin tilde por teclados o configuración en inglés
const SPANISH_ACCENT_MAP = {
    'ano': 'año', 'anos': 'años',
    'articulo': 'artículo', 'articulos': 'artículos',
    'credito': 'crédito', 'creditos': 'créditos',
    'debito': 'débito', 'debitos': 'débitos',
    'periodo': 'período', 'periodos': 'períodos',
    'numero': 'número', 'numeros': 'números',
    'pagina': 'página', 'paginas': 'páginas',
    'codigo': 'código', 'codigos': 'códigos',
    'termino': 'término', 'terminos': 'términos',
    'limite': 'límite', 'limites': 'límites',
    'regimen': 'régimen', 'regimenes': 'regímenes',
    'orden': 'orden', 'ordenes': 'órdenes',
    'origen': 'origen', 'origenes': 'orígenes',
    'margen': 'margen', 'margenes': 'márgenes',
    'politica': 'política', 'politicas': 'políticas',
    'metodo': 'método', 'metodos': 'métodos',
    'tecnica': 'técnica', 'tecnicas': 'técnicas',
    'tecnico': 'técnico', 'tecnicos': 'técnicos',
    'practica': 'práctica', 'practicas': 'prácticas',
    'practico': 'práctico', 'practicos': 'prácticos',
    'analisis': 'análisis',
    'sintesis': 'síntesis',
    'hipotesis': 'hipótesis',
    'enfasis': 'énfasis',
    'deficit': 'déficit',
    'superavit': 'superávit',
    'publico': 'público', 'publicos': 'públicos', 'publica': 'pública', 'publicas': 'públicas',
    'ultimo': 'último', 'ultimos': 'últimos', 'ultima': 'última', 'ultimas': 'últimas',
    'unico': 'único', 'unicos': 'únicos', 'unica': 'única', 'unicas': 'únicas',
    'minimo': 'mínimo', 'minimos': 'mínimos', 'minima': 'mínima', 'minimas': 'mínimas',
    'maximo': 'máximo', 'maximos': 'máximos', 'maxima': 'máxima', 'maximas': 'máximas',
    'optimo': 'óptimo', 'optimos': 'óptimos',
    'basico': 'básico', 'basicos': 'básicos', 'basica': 'básica', 'basicas': 'básicas',
    'economico': 'económico', 'economicos': 'económicos', 'economica': 'económica', 'economicas': 'económicas',
    'juridico': 'jurídico', 'juridicos': 'jurídicos', 'juridica': 'jurídica', 'juridicas': 'jurídicas',
    'fisico': 'físico', 'fisicos': 'físicos', 'fisica': 'física', 'fisicas': 'físicas',
    'logico': 'lógico', 'logicos': 'lógicos',
    'clasico': 'clásico', 'clasicos': 'clásicos',
    'critico': 'crítico', 'criticos': 'críticos',
    'especifico': 'específico', 'especificos': 'específicos',
    'automatico': 'automático', 'automaticos': 'automáticos',
    'electronico': 'electrónico', 'electronicos': 'electrónicos', 'electronica': 'electrónica', 'electronicas': 'electrónicas',
    'calculo': 'cálculo', 'calculos': 'cálculos',
    'titulo': 'título', 'titulos': 'títulos',
    'modulo': 'módulo', 'modulos': 'módulos',
    'vehiculo': 'vehículo', 'vehiculos': 'vehículos',
    'formula': 'fórmula', 'formulas': 'fórmulas',
    'area': 'área', 'areas': 'áreas',
    'linea': 'línea', 'lineas': 'líneas',
    'dia': 'día', 'dias': 'días',
    'guia': 'guía', 'guias': 'guías',
    'auditoria': 'auditoría', 'auditorias': 'auditorías',
    'garantia': 'garantía', 'garantias': 'garantías',
    'compania': 'compañía', 'companias': 'compañías',
    'energia': 'energía',
    'mayoria': 'mayoría',
    'minoria': 'minoría',
    'categoria': 'categoría', 'categorias': 'categorías',
    'alcaldia': 'alcaldía', 'alcaldias': 'alcaldías',
    'mercaderia': 'mercadería', 'mercaderias': 'mercaderías',
    'tesoreria': 'tesorería',
    'asesoria': 'asesoría',
    'consultoria': 'consultoría',
    'plusvalia': 'plusvalía',
    'cuantia': 'cuantía',
    'pais': 'país', 'paises': 'países',
    'mas': 'más',
    'tambien': 'también',
    'ademas': 'además',
    'despues': 'después',
    'segun': 'según',
    'estara': 'estará', 'estaran': 'estarán',
    'sera': 'será', 'seran': 'serán',
    'tendra': 'tendrá', 'tendran': 'tendrán',
    'debera': 'deberá', 'deberan': 'deberán',
    'pagara': 'pagará', 'pagaran': 'pagarán',
    'aplicara': 'aplicará', 'aplicaran': 'aplicarán',
    'presentara': 'presentará', 'presentaran': 'presentarán',
    'efectuara': 'efectuará', 'efectuaran': 'efectuarán',
    'realizara': 'realizará', 'realizaran': 'realizarán',
    'emitira': 'emitirá', 'emitiran': 'emitirán',
    'deducira': 'deducirá', 'deduciran': 'deducirán',
    'aqui': 'aquí', 'alli': 'allí', 'ahi': 'ahí', 'alla': 'allá', 'aca': 'acá',
    'asi': 'así',
    'cancion': 'canción', 'canciones': 'canciones',
    'razon': 'razón', 'razones': 'razones',
    'estacion': 'estación', 'estaciones': 'estaciones',
    'porcion': 'porción', 'porciones': 'porciones',
    'seccion': 'sección', 'secciones': 'secciones',
    'accion': 'acción', 'acciones': 'acciones',
    'fraccion': 'fracción', 'fracciones': 'fracciones',
    'opcion': 'opción', 'opciones': 'opciones',
    'porcion': 'porción', 'porciones': 'porciones',
    'edicion': 'edición', 'ediciones': 'ediciones',
    'condicion': 'condición', 'condiciones': 'condiciones',
    'posicion': 'posición', 'posiciones': 'posiciones',
    'relacion': 'relación', 'relaciones': 'relaciones',
    'mencion': 'mención', 'menciones': 'menciones',
    'atencion': 'atención',
    'intencion': 'intención',
    'retencion': 'retención', 'retenciones': 'retenciones',
    'percepcion': 'percepción', 'percepciones': 'percepciones',
    'depreciacion': 'depreciación', 'depreciaciones': 'depreciaciones',
    'amortizacion': 'amortización', 'amortizaciones': 'amortizaciones',
    'administracion': 'administración',
    'operacion': 'operación', 'operaciones': 'operaciones',
    'facturacion': 'facturación',
    'cotizacion': 'cotización', 'cotizaciones': 'cotizaciones',
    'valuacion': 'valuación', 'valuaciones': 'valuaciones',
    'conciliacion': 'conciliación', 'conciliaciones': 'conciliaciones',
    'declaracion': 'declaración', 'declaraciones': 'declaraciones',
    'liquidacion': 'liquidación', 'liquidaciones': 'liquidaciones',
    'resolucion': 'resolución', 'resoluciones': 'resoluciones',
    'autorizacion': 'autorización', 'autorizaciones': 'autorizaciones',
    'modificacion': 'modificación', 'modificaciones': 'modificaciones',
    'remuneracion': 'remuneración', 'remuneraciones': 'remuneraciones',
    'indemnizacion': 'indemnización', 'indemnizaciones': 'indemnizaciones',
    'institucion': 'institución', 'instituciones': 'instituciones',
    'constitucion': 'constitución',
    'transaccion': 'transacción', 'transacciones': 'transacciones',
    'informacion': 'información',
    'situacion': 'situación',
    'produccion': 'producción',
    'adquisicion': 'adquisición', 'adquisiciones': 'adquisiciones',
    'disposicion': 'disposición', 'disposiciones': 'disposiciones',
    'obligacion': 'obligación', 'obligaciones': 'obligaciones',
    'aprobacion': 'aprobación',
    'ejecucion': 'ejecución',
    'gestion': 'gestión', 'gestiones': 'gestiones',
    'presentacion': 'presentación',
    'conclusion': 'conclusión', 'conclusiones': 'conclusiones',
    'decision': 'decisión', 'decisiones': 'decisiones',
    'revision': 'revisión', 'revisiones': 'revisiones',
    'supervision': 'supervisión',
    'prevision': 'previsión', 'previsiones': 'previsiones',
    'provision': 'provisión', 'provisiones': 'provisiones',
    'inversion': 'inversión', 'inversiones': 'inversiones',
    'mision': 'misión', 'vision': 'visión',
    'comision': 'comisión', 'comisiones': 'comisiones',
    'emision': 'emisión', 'emisiones': 'emisiones',
    'remision': 'remisión',
    'sesion': 'sesión', 'sesiones': 'sesiones',
    'reunion': 'reunión', 'reuniones': 'reuniones',
    'direccion': 'dirección', 'direcciones': 'direcciones',
    'distribucion': 'distribución',
    'contribucion': 'contribución', 'contribuciones': 'contribuciones',
    'exencion': 'exención', 'exenciones': 'exenciones',
    'adicion': 'adición', 'adiciones': 'adiciones',
    'funcion': 'función', 'funciones': 'funciones'
};

// ── 2. VOCABULARIO BASE EN ESPAÑOL (Gramatical, General, Contable, Legal y SV) ─
const SPANISH_RAW = [
    // Gramática y funcionales
    'a', 'al', 'del', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'en', 'con', 'por', 'para', 'sin', 'sobre', 'tras', 'entre', 'hacia', 'hasta', 'desde', 'durante', 'mediante', 'contra', 'bajo', 'segun', 'según', 'ante', 'cabe', 'so', 'via', 'vía', 'versus',
    'y', 'e', 'ni', 'o', 'u', 'pero', 'mas', 'más', 'sino', 'aunque', 'porque', 'pues', 'ya', 'si', 'como', 'cuando', 'donde', 'mientras', 'que', 'quien', 'quienes', 'cual', 'cuales', 'cuyo', 'cuya', 'cuyos', 'cuyas',
    'yo', 'tu', 'tú', 'el', 'él', 'ella', 'ello', 'nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas', 'usted', 'ustedes',
    'me', 'te', 'se', 'nos', 'os', 'le', 'les', 'lo', 'la', 'los', 'las', 'mi', 'mí', 'ti', 'si', 'sí', 'conmigo', 'contigo', 'consigo',
    'este', 'esta', 'estos', 'estas', 'esto', 'ese', 'esa', 'esos', 'esas', 'eso', 'aquel', 'aquella', 'aquellos', 'aquellas', 'aquello',
    'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro', 'vuestra', 'vuestros', 'vuestras',
    'no', 'si', 'sí', 'tambien', 'también', 'tampoco', 'jamas', 'jamás', 'nunca', 'siempre', 'acaso', 'quizas', 'quizás', 'tal', 'vez',
    'bien', 'mal', 'asi', 'así', 'despacio', 'deprisa', 'alto', 'bajo', 'excepto', 'salvo', 'incluso',
    'mas', 'más', 'menos', 'mucho', 'mucha', 'muchos', 'muchas', 'poco', 'poca', 'pocos', 'pocas', 'bastante', 'bastantes', 'casi', 'muy', 'tanto', 'tanta', 'tantos', 'tantas', 'tan', 'nada', 'algo', 'medio', 'demasiado',
    'aqui', 'aquí', 'alli', 'allí', 'ahi', 'ahí', 'alla', 'allá', 'aca', 'acá', 'cerca', 'lejos', 'enfrente', 'delante', 'detras', 'detrás', 'dentro', 'adentro', 'fuera', 'afuera', 'arriba', 'abajo', 'encima', 'debajo',
    'hoy', 'ayer', 'anteayer', 'mañana', 'ahora', 'antes', 'despues', 'después', 'luego', 'tarde', 'temprano', 'pronto', 'todavia', 'todavía', 'aun', 'aún', 'enseguida',

    // Verbos esenciales y conjugaciones comunes
    'es', 'son', 'era', 'eran', 'fue', 'fueron', 'sera', 'será', 'seran', 'serán', 'ser', 'siendo', 'sido', 'sea', 'sean',
    'esta', 'está', 'estan', 'están', 'estaba', 'estaban', 'estuvo', 'estuvieron', 'estara', 'estará', 'estaran', 'estarán', 'estar', 'estando', 'estado', 'este', 'esté', 'esten', 'estén',
    'ha', 'han', 'habia', 'había', 'habian', 'habían', 'hubo', 'hubieron', 'habra', 'habrá', 'habran', 'habrán', 'haber', 'habiendo', 'habido', 'haya', 'hayan',
    'tiene', 'tienen', 'tenia', 'tenía', 'tenian', 'tenían', 'tuvo', 'tuvieron', 'tendra', 'tendrá', 'tendran', 'tendrán', 'tener', 'teniendo', 'tenido', 'tenga', 'tengan',
    'hace', 'hacen', 'hacia', 'hacía', 'hacian', 'hacían', 'hizo', 'hicieron', 'hara', 'hará', 'haran', 'harán', 'hacer', 'haciendo', 'hecho', 'haga', 'hagan',
    'dice', 'dicen', 'decia', 'decía', 'dijo', 'dijeron', 'dira', 'dirá', 'decir', 'diciendo', 'dicho',
    'va', 'van', 'iba', 'iban', 'fue', 'fueron', 'ira', 'irá', 'iran', 'irán', 'ir', 'yendo', 'ido', 'vaya', 'vayan',
    've', 'ven', 'veia', 'veía', 'vio', 'vieron', 'vera', 'verá', 'ver', 'viendo', 'visto',
    'da', 'dan', 'daba', 'daban', 'dio', 'dieron', 'dara', 'dará', 'dar', 'dando', 'dado',
    'sabe', 'saben', 'sabia', 'sabía', 'supo', 'supieron', 'sabra', 'sabrá', 'saber', 'sabiendo', 'sabido',
    'puede', 'pueden', 'podia', 'podía', 'pudo', 'pudieron', 'podra', 'podrá', 'podran', 'podrán', 'poder', 'pudiendo', 'podido',
    'pone', 'ponen', 'ponia', 'ponía', 'puso', 'pusieron', 'pondra', 'pondrá', 'poner', 'poniendo', 'puesto',
    'debe', 'deben', 'debia', 'debía', 'debio', 'debió', 'debieron', 'debera', 'deberá', 'deberan', 'deberán', 'deber', 'debiendo', 'debido',
    'quiere', 'quieren', 'queria', 'quería', 'quiso', 'quisieron', 'querra', 'querrá', 'querer', 'queriendo', 'querido',
    'llega', 'llegan', 'llegaba', 'llego', 'llegó', 'llegaron', 'llegara', 'llegará', 'llegar', 'llegando', 'llegado',
    'pasa', 'pasan', 'pasaba', 'paso', 'pasó', 'pasaron', 'pasara', 'pasará', 'pasar', 'pasando', 'pasado',
    'queda', 'quedan', 'quedaba', 'quedo', 'quedó', 'quedaron', 'quedar', 'quedando', 'quedado',
    'cree', 'creen', 'creia', 'creía', 'creyo', 'creyó', 'creyeron', 'creer', 'creyendo', 'creido', 'creído',
    'habla', 'hablan', 'hablaba', 'hablo', 'habló', 'hablaron', 'hablar', 'hablando', 'hablado',
    'lleva', 'llevan', 'llevaba', 'llevo', 'llevó', 'llevaron', 'llevar', 'llevando', 'llevado',
    'deja', 'dejan', 'dejaba', 'dejo', 'dejó', 'dejaron', 'dejar', 'dejando', 'dejado',
    'sigue', 'siguen', 'seguia', 'seguía', 'siguio', 'siguió', 'siguieron', 'seguir', 'siguiendo', 'seguido',
    'encuentra', 'encuentran', 'encontraba', 'encontro', 'encontró', 'encontraron', 'encontrar', 'encontrando', 'encontrado',
    'llama', 'llaman', 'llamaba', 'llamo', 'llamó', 'llamaron', 'llamar', 'llamando', 'llamado',
    'viene', 'vienen', 'venia', 'venía', 'vino', 'vinieron', 'vendra', 'vendrá', 'venir', 'viniendo', 'venido',
    'piensa', 'piensan', 'pensaba', 'penso', 'pensó', 'pensaron', 'pensar', 'pensando', 'pensado',
    'sale', 'salen', 'salia', 'salía', 'salio', 'salió', 'salieron', 'saldra', 'saldrá', 'salir', 'saliendo', 'salido',
    'vuelve', 'vuelven', 'volvia', 'volvía', 'volvio', 'volvió', 'volvieron', 'volver', 'volviendo', 'vuelto',
    'toma', 'toman', 'tomaba', 'tomo', 'tomó', 'tomaron', 'tomar', 'tomando', 'tomado',
    'conoce', 'conocen', 'conocia', 'conocía', 'conocio', 'conoció', 'conocieron', 'conocer', 'conociendo', 'conocido',
    'vive', 'viven', 'vivia', 'vivía', 'vivio', 'vivió', 'vivieron', 'vivir', 'viviendo', 'vivido',
    'siente', 'sienten', 'sentia', 'sentía', 'sintio', 'sintió', 'sintieron', 'sentir', 'sintiendo', 'sentido',
    'trata', 'tratan', 'trataba', 'trato', 'trató', 'trataron', 'tratar', 'tratando', 'tratado',
    'mira', 'miran', 'miraba', 'miro', 'miró', 'miraron', 'mirar', 'mirando', 'mirado',
    'cuenta', 'cuentan', 'contaba', 'conto', 'contó', 'contaron', 'contar', 'contando', 'contado',
    'empieza', 'empiezan', 'empezaba', 'empezo', 'empezó', 'empezaron', 'empezar', 'empezando', 'empezado',
    'espera', 'esperan', 'esperaba', 'espero', 'esperó', 'esperaron', 'esperar', 'esperando', 'esperado',
    'busca', 'buscan', 'buscaba', 'busco', 'buscó', 'buscaron', 'buscar', 'buscando', 'buscado',
    'existe', 'existen', 'existia', 'existía', 'existio', 'existió', 'existieron', 'existir', 'existiendo', 'existido',
    'entra', 'entran', 'entraba', 'entro', 'entró', 'entraron', 'entrar', 'entrando', 'entrado',
    'trabaja', 'trabajan', 'trabajaba', 'trabajo', 'trabajó', 'trabajaron', 'trabajar', 'trabajando', 'trabajado',
    'escribe', 'escriben', 'escribia', 'escribía', 'escribio', 'escribió', 'escribieron', 'escribir', 'escribiendo', 'escrito',
    'pierde', 'pierden', 'perdia', 'perdía', 'perdio', 'perdió', 'perdieron', 'perder', 'perdiendo', 'perdido',
    'produce', 'producen', 'producia', 'producía', 'produjo', 'produjeron', 'producir', 'produciendo', 'producido',
    'ocurre', 'ocurren', 'ocurria', 'ocurría', 'ocurrio', 'ocurrió', 'ocurrieron', 'ocurrir', 'ocurriendo', 'ocurrido',
    'entiende', 'entienden', 'entendio', 'entendió', 'entender', 'entendiendo', 'entendido',
    'pide', 'piden', 'pidio', 'pidió', 'pidieron', 'pedir', 'pidiendo', 'pedido',
    'recibe', 'reciben', 'recibia', 'recibía', 'recibio', 'recibió', 'recibieron', 'recibir', 'recibiendo', 'recibido',
    'recuerda', 'recuerdan', 'recordo', 'recordó', 'recordar', 'recordando', 'recordado',
    'termina', 'terminan', 'termino', 'terminó', 'terminaron', 'terminar', 'terminando', 'terminado',
    'permite', 'permiten', 'permitio', 'permitió', 'permitir', 'permitiendo', 'permitido',
    'aparece', 'aparecen', 'aparecio', 'apareció', 'aparecer', 'apareciendo', 'aparecido',
    'consigue', 'consiguen', 'consiguio', 'consiguió', 'conseguir', 'consiguiendo', 'conseguido',
    'comienza', 'comienzan', 'comenzo', 'comenzó', 'comenzar', 'comenzando', 'comenzado',
    'sirve', 'sirven', 'sirvio', 'sirvió', 'servir', 'sirviendo', 'servido',
    'saca', 'sacan', 'saco', 'sacó', 'sacar', 'sacando', 'sacado',
    'necesita', 'necesitan', 'necesito', 'necesitó', 'necesitar', 'necesitando', 'necesitado',
    'mantiene', 'mantienen', 'mantuvo', 'mantuvieron', 'mantener', 'manteniendo', 'mantenido',
    'resulta', 'resultan', 'resulto', 'resultó', 'resultar', 'resultando', 'resultado',
    'lee', 'leen', 'leia', 'leía', 'leyo', 'leyó', 'leyeron', 'leer', 'leyendo', 'leido', 'leído',
    'cae', 'caen', 'caia', 'caía', 'cayo', 'cayó', 'cayeron', 'caer', 'cayendo', 'caido', 'caído',
    'cambia', 'cambian', 'cambio', 'cambió', 'cambiar', 'cambiando', 'cambiado',
    'presenta', 'presentan', 'presento', 'presentó', 'presentaron', 'presentara', 'presentará', 'presentar', 'presentando', 'presentado',
    'crea', 'crean', 'creo', 'creó', 'crear', 'creando', 'creado',
    'abre', 'abren', 'abrio', 'abrió', 'abrieron', 'abrir', 'abriendo', 'abierto',
    'considera', 'consideran', 'considero', 'consideró', 'considerar', 'considerando', 'considerado',
    'oye', 'oyen', 'oia', 'oía', 'oyo', 'oyó', 'oyeron', 'oir', 'oír', 'oyendo', 'oido', 'oído',
    'acaba', 'acaban', 'acabo', 'acabó', 'acabar', 'acabando', 'acabado',
    'gana', 'ganan', 'gano', 'ganó', 'ganar', 'ganando', 'ganado',
    'forma', 'forman', 'formo', 'formó', 'formar', 'formando', 'formado',
    'parte', 'parten', 'partio', 'partió', 'partir', 'partiendo', 'partido',

    // Verbos de gestión, contables y administrativos
    'paga', 'pagan', 'pago', 'pagó', 'pagaron', 'pagara', 'pagará', 'pagar', 'pagando', 'pagado',
    'compra', 'compran', 'compro', 'compró', 'compraron', 'comprar', 'comprando', 'comprado',
    'vende', 'venden', 'vendio', 'vendió', 'vendieron', 'vender', 'vendiendo', 'vendido',
    'calcula', 'calculan', 'calculo', 'calculó', 'calcular', 'calculando', 'calculado',
    'registra', 'registran', 'registro', 'registró', 'registrar', 'registrando', 'registrado',
    'audita', 'auditan', 'audito', 'auditó', 'auditar', 'auditando', 'auditado',
    'abona', 'abonan', 'abono', 'abonó', 'abonar', 'abonando', 'abonado',
    'carga', 'cargan', 'cargo', 'cargó', 'cargar', 'cargando', 'cargado',
    'liquida', 'liquidan', 'liquido', 'liquidó', 'liquidar', 'liquidando', 'liquidado',
    'deduce', 'deducen', 'dedujo', 'dedujeron', 'deducira', 'deducirá', 'deducir', 'deduciendo', 'deducido',
    'retiene', 'retienen', 'retuvo', 'retuvieron', 'retener', 'reteniendo', 'retenido',
    'percibe', 'perciben', 'percibio', 'percibió', 'percibir', 'percibiendo', 'percibido',
    'emite', 'emiten', 'emitio', 'emitió', 'emitieron', 'emitira', 'emitirá', 'emitir', 'emitiendo', 'emitido',
    'autoriza', 'autorizan', 'autorizo', 'autorizó', 'autorizar', 'autorizando', 'autorizado',
    'aprueba', 'aprueban', 'aprobo', 'aprobó', 'aprobar', 'aprobando', 'aprobado',
    'anula', 'anulan', 'anulo', 'anuló', 'anular', 'anulando', 'anulado',
    'modifica', 'modifican', 'modifico', 'modificó', 'modificar', 'modificando', 'modificado',
    'elabora', 'elaboran', 'elaboro', 'elaboró', 'elaborar', 'elaborando', 'elaborado',
    'revisa', 'revisan', 'reviso', 'revisó', 'revisar', 'revisando', 'revisado',
    'supervisa', 'supervisan', 'superviso', 'supervisó', 'supervisar', 'supervisando', 'supervisado',
    'verifica', 'verifican', 'verifico', 'verificó', 'verificar', 'verificando', 'verificado',
    'valida', 'validan', 'valido', 'validó', 'validar', 'validando', 'validado',
    'concilia', 'concilian', 'concilio', 'concilió', 'conciliar', 'conciliando', 'conciliado',
    'determina', 'determinan', 'determino', 'determinó', 'determinar', 'determinando', 'determinado',
    'establece', 'establecen', 'establecio', 'estableció', 'establecer', 'estableciendo', 'establecido',
    'cumple', 'cumplen', 'cumplio', 'cumplió', 'cumplir', 'cumpliendo', 'cumplido',
    'aplica', 'aplican', 'aplico', 'aplicó', 'aplicar', 'aplicando', 'aplicado',
    'imputa', 'imputan', 'imputo', 'imputó', 'imputar', 'imputando', 'imputado',
    'devenga', 'devengan', 'devengo', 'devengó', 'devengar', 'devengando', 'devengado',
    'distribuye', 'distribuyen', 'distribuyo', 'distribuyó', 'distribuir', 'distribuyendo', 'distribuido',
    'provisiona', 'provisionan', 'provisiono', 'provisionó', 'provisionar', 'provisionando', 'provisionado',
    'deprecia', 'deprecian', 'deprecio', 'depreció', 'depreciar', 'depreciando', 'depreciado',
    'amortiza', 'amortizan', 'amortizo', 'amortizó', 'amortizar', 'amortizando', 'amortizado',
    'factura', 'facturan', 'facturo', 'facturó', 'facturar', 'facturando', 'facturado',
    'declara', 'declaran', 'declaro', 'declaró', 'declarar', 'declarando', 'declarado',
    'contabiliza', 'contabilizan', 'contabilizo', 'contabilizó', 'contabilizar', 'contabilizando', 'contabilizado',

    // ── TERMINOLOGÍA CONTABLE, FINANCIERA, MERCANTIL Y FISCAL (EL SALVADOR) ──
    'contabilidad', 'contable', 'contables', 'contador', 'contadora', 'contadores',
    'auditoria', 'auditoría', 'auditorias', 'auditorías', 'auditor', 'auditora', 'auditores', 'auditado', 'auditada',
    'balance', 'balances', 'balance general', 'partida', 'partidas', 'diario', 'mayor', 'asiento', 'asientos',
    'cargo', 'cargos', 'abono', 'abonos', 'debito', 'débito', 'debitos', 'débitos', 'credito', 'crédito', 'creditos', 'créditos',
    'debe', 'haber', 'saldo', 'saldos', 'deudor', 'deudores', 'deudora', 'acreedor', 'acreedores', 'acreedora',
    'activo', 'activos', 'pasivo', 'pasivos', 'patrimonio', 'capital', 'capital social', 'acciones', 'accionista', 'accionistas',
    'corriente', 'corrientes', 'no corriente', 'no corrientes', 'fijo', 'fijos', 'circulante', 'intangible', 'intangibles',
    'reserva', 'reservas', 'reserva legal', 'utilidad', 'utilidades', 'perdida', 'pérdida', 'perdidas', 'pérdidas',
    'ejercicio', 'ejercicios', 'periodo', 'período', 'periodos', 'períodos', 'fiscal', 'fiscales',
    'ingreso', 'ingresos', 'costo', 'costos', 'gasto', 'gastos', 'venta', 'ventas', 'compra', 'compras',
    'costo de ventas', 'gastos de administracion', 'gastos de administración', 'gastos de venta', 'gastos financieros',
    'operacional', 'operacionales', 'operativo', 'operativos', 'no operacional',
    'impuesto', 'impuestos', 'renta', 'impuesto sobre la renta', 'isr', 'iva', 'debito fiscal', 'débito fiscal', 'credito fiscal', 'crédito fiscal',
    'retencion', 'retención', 'retenciones', 'percepcion', 'percepción', 'percepciones',
    'anticipo', 'anticipos', 'pago a cuenta', 'declaracion', 'declaración', 'declaraciones',
    'hacienda', 'ministerio de hacienda', 'direccion general', 'dirección general', 'dgii',
    'tributo', 'tributos', 'tributario', 'tributaria', 'tributarios', 'tributarias',
    'codigo tributario', 'código tributario', 'codigo de comercio', 'código de comercio', 'ley', 'leyes', 'reglamento', 'decreto',
    'articulo', 'artículo', 'articulos', 'artículos', 'inciso', 'incisos', 'literal', 'literales', 'seccion', 'sección',
    'contribuyente', 'contribuyentes', 'gran contribuyente', 'mediano contribuyente', 'pequeño contribuyente',
    'consumidor final', 'factura', 'facturas', 'factura electronica', 'factura electrónica', 'dte', 'documento tributario electronico',
    'nota de debito', 'nota de débito', 'nota de credito', 'nota de crédito', 'guia de remision', 'guía de remisión',
    'comprobante', 'comprobantes', 'comprobante de retencion', 'comprobante de retención', 'comprobante de liquidacion',
    'planilla', 'planillas', 'salario', 'salarios', 'sueldo', 'sueldos', 'basico', 'básico', 'devengado', 'neto',
    'deduccion', 'deducción', 'deducciones', 'isss', 'seguro social', 'afp', 'pensiones', 'confiar', 'crecer', 'inpep', 'ipsfa',
    'cuota patronal', 'aporte patronal', 'retencion laboral', 'retención laboral',
    'maternidad', 'incapacidad', 'incapacidades', 'subsidio', 'enfermedad comun', 'enfermedad común', 'riesgo profesional',
    'horas extras', 'nocturnidad', 'asueto', 'dias festivos', 'días festivos', 'vacaciones', 'vacacion', 'vacación',
    'aguinaldo', 'aguinaldos', 'indemnizacion', 'indemnización', 'indemnizaciones', 'despido', 'renuncia', 'liquidacion laboral',
    'patrono', 'empleador', 'trabajador', 'trabajadora', 'trabajadores', 'empleado', 'empleada', 'empleados',
    'contrato', 'contratos', 'individual', 'colectivo', 'jornada', 'diurna', 'nocturna', 'mixta',
    'inventario', 'inventarios', 'kardex', 'peps', 'ueps', 'promedio ponderado', 'costo estandar', 'costo estándar',
    'valuacion', 'valuación', 'mercaderia', 'mercadería', 'mercaderias', 'mercaderías',
    'producto', 'productos', 'producto terminado', 'materia prima', 'materias primas', 'produccion en proceso', 'producción en proceso',
    'almacen', 'almacén', 'bodega', 'bodegas', 'suministros', 'existencias',
    'proveedor', 'proveedores', 'cliente', 'clientes', 'cuentas por cobrar', 'cuentas por pagar',
    'documentos por cobrar', 'documentos por pagar', 'estimacion', 'estimación', 'cuentas incobrables', 'deterioro',
    'depreciacion', 'depreciación', 'depreciaciones', 'linea recta', 'línea recta', 'unidades producidas',
    'vida util', 'vida útil', 'valor residual', 'valor de desecho', 'valor en libros',
    'amortizacion', 'amortización', 'amortizaciones',
    'propiedad planta y equipo', 'activo fijo', 'edificio', 'edificios', 'terreno', 'terrenos',
    'maquinaria', 'equipo de transporte', 'equipo de reparto', 'equipo de computo', 'equipo de cómputo', 'mobiliario', 'enseres', 'instalaciones',
    'arrendamiento', 'arrendamiento financiero', 'arrendamiento operativo',
    'tesoreria', 'tesorería', 'caja', 'caja chica', 'caja general', 'arqueo', 'arqueo de caja', 'faltante', 'sobrante',
    'banco', 'bancos', 'cuenta corriente', 'cuenta de ahorros', 'deposito', 'depósito', 'depositos', 'depósitos',
    'retiro', 'retiros', 'transferencia', 'transferencias', 'remesa', 'remesas',
    'conciliacion bancaria', 'conciliación bancaria', 'libro de bancos', 'cheque', 'cheques', 'voucher', 'vouchers',
    'pagare', 'pagaré', 'pagares', 'pagarés', 'letra de cambio', 'letras de cambio',
    'poliza', 'póliza', 'polizas', 'pólizas', 'seguro', 'seguros', 'flete', 'fletes',
    'importacion', 'importación', 'importaciones', 'exportacion', 'exportación', 'exportaciones',
    'aduana', 'aduanas', 'arancel', 'aranceles', 'dai', 'derechos arancelarios', 'retaceo',
    'costo de importacion', 'costo de importación',
    'margen', 'margen bruto', 'margen neto', 'rentabilidad', 'liquidez', 'solvencia', 'endeudamiento', 'apalancamiento',
    'razon financiera', 'razón financiera', 'razones financieras', 'roa', 'roe', 'ebitda', 'ebit',
    'flujo de caja', 'flujo de efectivo', 'estado de resultados', 'estado de situacion financiera', 'estado de situación financiera',
    'estado de cambios en el patrimonio', 'notas explicativas', 'notas a los estados financieros',
    'niif', 'nic', 'niif para pymes', 'principios de contabilidad', 'normas internacionales',
    'catalogo de cuentas', 'catálogo de cuentas', 'cuentas de orden', 'cuentas T',
    'empresa', 'empresas', 'sociedad', 'sociedades', 'anonima', 'anónima', 'sociedad anonima', 'sociedad anónima',
    'responsabilidad limitada', 'sucursal', 'sucursales', 'casa matriz', 'filial', 'subsidiaria',
    'asamblea', 'asamblea general', 'junta directiva', 'representante legal', 'apoderado', 'escritura publica', 'escritura pública',
    'matricula de comercio', 'matrícula de comercio', 'balance inicial', 'balance de liquidacion', 'balance de liquidación',

    // Geografía, Ciudades e Instituciones de El Salvador
    'salvador', 'el salvador', 'salvadoreño', 'salvadoreña', 'salvadoreños', 'salvadoreñas',
    'san salvador', 'santa ana', 'san miguel', 'sonsonate', 'ahuachapan', 'ahuachapán',
    'la libertad', 'usulutan', 'usulután', 'chalatenango', 'cuscatlan', 'cuscatlán',
    'cabañas', 'san vicente', 'morazan', 'morazán', 'la union', 'la unión',
    'santa tecla', 'antiguo cuscatlan', 'antiguo cuscatlán', 'soyapango', 'ilopango', 'apopa', 'nejapa', 'mejicanos',
    'ciudad delgado', 'san marcos', 'santo tomas', 'santo tomás', 'panchimalco',
    'colon', 'colón', 'colones', 'dolar', 'dólar', 'dolares', 'dólares', 'centavo', 'centavos',
    'alcaldia', 'alcaldía', 'alcaldias', 'alcaldías', 'municipalidad', 'consejo municipal', 'tasa municipal',
    'registro de comercio', 'cnr', 'centro nacional de registros',
    'superintendencia', 'ssf', 'superintendencia del sistema financiero',
    'defensoria del consumidor', 'defensoría del consumidor', 'bcr', 'banco central de reserva',
    'corte de cuentas', 'asamblea legislativa', 'diario oficial',

    // Vocabulario común general en redacción
    'persona', 'personas', 'año', 'años', 'dia', 'día', 'dias', 'días', 'mes', 'meses', 'fecha', 'fechas',
    'tiempo', 'hora', 'horas', 'minuto', 'minutos', 'segundo', 'segundos', 'momento', 'plazo', 'plazos',
    'hombre', 'mujer', 'niño', 'vida', 'mundo', 'casa', 'pais', 'país', 'ciudad', 'gobierno',
    'grupo', 'caso', 'punto', 'mano', 'lugar', 'parte', 'lado', 'cosa', 'forma', 'manera',
    'numero', 'número', 'problema', 'hecho', 'tema', 'tipo', 'modo', 'nombre', 'cuenta',
    'calidad', 'servicio', 'atencion', 'atención', 'cliente', 'usuario', 'sistema', 'proceso',
    'documento', 'documentos', 'texto', 'textos', 'archivo', 'archivos', 'informe', 'informes',
    'carta', 'memorando', 'memorandum', 'memorándum', 'acta', 'actas', 'notificacion', 'notificación',
    'oficio', 'oficios', 'circular', 'circulares', 'anexo', 'anexos', 'apendice', 'apéndice',
    'primero', 'primera', 'segundo', 'segunda', 'tercero', 'tercera', 'cuarto', 'quinto', 'ultimo', 'último',
    'nuevo', 'nueva', 'nuevos', 'nuevas', 'viejo', 'antiguo', 'reciente', 'actual', 'presente',
    'bueno', 'buena', 'buenos', 'buenas', 'malo', 'mala', 'gran', 'grande', 'grandes', 'pequeño', 'pequeña',
    'mayor', 'menor', 'mejor', 'peor', 'alto', 'alta', 'bajo', 'baja', 'total', 'totales', 'general', 'generales',
    'claro', 'clara', 'cierto', 'cierta', 'seguro', 'segura', 'posible', 'imposible', 'diferente', 'igual',
    'completo', 'completa', 'correcto', 'correcta', 'exacto', 'exacta', 'preciso', 'precisa',
    'importante', 'necesario', 'suficiente', 'adecuado', 'oportuno', 'valido', 'válido', 'vigente'
];

// ── 3. VOCABULARIO BASE EN INGLÉS (General, Negocios, Contable y Técnico) ──────
const ENGLISH_RAW = [
    // Grammar & core functional words
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
    'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
    'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'having', 'does', 'did', 'doing',
    'can', 'could', 'shall', 'should', 'will', 'would', 'may', 'might', 'must',

    // Business, Accounting, Finance & Corporate English
    'accounting', 'accountant', 'accountants', 'account', 'accounts', 'accounting cycle',
    'ledger', 'general ledger', 'journal', 'journal entry', 'double entry',
    'debit', 'debits', 'credit', 'credits', 'balance', 'balances', 'balance sheet', 'trial balance',
    'income', 'income statement', 'profit', 'profits', 'net profit', 'gross profit', 'loss', 'losses', 'profit and loss',
    'revenue', 'revenues', 'expense', 'expenses', 'expenditure', 'cost', 'costs', 'cost of goods sold', 'cogs',
    'asset', 'assets', 'current assets', 'fixed assets', 'tangible', 'intangible', 'intangibles',
    'liability', 'liabilities', 'current liabilities', 'long term liabilities', 'obligation', 'obligations',
    'equity', 'owner equity', 'shareholder equity', 'retained earnings', 'capital', 'working capital', 'share', 'shares', 'stock', 'stocks',
    'cash', 'cash flow', 'cash flow statement', 'petty cash', 'liquidity', 'solvency',
    'bank', 'banks', 'banking', 'bank statement', 'reconciliation', 'bank reconciliation', 'deposit', 'deposits', 'withdrawal', 'withdrawals',
    'audit', 'audits', 'auditor', 'auditors', 'auditing', 'audit report', 'internal audit', 'external audit',
    'voucher', 'vouchers', 'receipt', 'receipts', 'invoice', 'invoices', 'billing', 'bill', 'bills',
    'payable', 'accounts payable', 'receivable', 'accounts receivable', 'bad debt', 'provision', 'provisions', 'allowance',
    'tax', 'taxes', 'taxation', 'income tax', 'sales tax', 'vat', 'withholding tax', 'fiscal', 'fiscal year',
    'payroll', 'salary', 'salaries', 'wage', 'wages', 'compensation', 'benefit', 'benefits', 'deduction', 'deductions',
    'severance', 'pension', 'social security', 'insurance', 'overtime', 'vacation', 'bonus',
    'inventory', 'inventories', 'stock', 'warehouse', 'raw material', 'work in process', 'finished goods',
    'fifo', 'lifo', 'weighted average', 'valuation', 'supply', 'supplies', 'procurement',
    'depreciation', 'depreciations', 'straight line', 'accumulated depreciation', 'amortization', 'amortisation', 'impairment',
    'salvage value', 'useful life', 'book value', 'carrying amount',
    'property', 'plant', 'equipment', 'ppe', 'machinery', 'building', 'land', 'lease', 'leases', 'operating lease', 'finance lease',
    'customer', 'customers', 'client', 'clients', 'vendor', 'vendors', 'supplier', 'suppliers',
    'purchase', 'purchases', 'order', 'purchase order', 'sales', 'sales order', 'discount', 'discounts',
    'budget', 'budgets', 'budgeting', 'forecast', 'forecasts', 'variance', 'variance analysis',
    'ratio', 'financial ratios', 'liquidity ratio', 'current ratio', 'quick ratio', 'debt ratio', 'leverage',
    'margin', 'gross margin', 'operating margin', 'net margin', 'markup',
    'return', 'return on equity', 'roe', 'return on assets', 'roa', 'roi', 'return on investment',
    'ebit', 'ebitda', 'earnings', 'operating income',
    'check', 'checks', 'cheque', 'cheques', 'wire transfer', 'promissory note', 'notes payable', 'notes receivable',
    'interest', 'interest rate', 'principal', 'loan', 'loans', 'mortgage', 'debt', 'debts', 'bond', 'bonds',
    'dividend', 'dividends', 'yield', 'securities', 'portfolio', 'fund', 'funds', 'treasury',
    'currency', 'exchange rate', 'foreign exchange', 'forex', 'dollar', 'dollars', 'cent', 'cents',
    'holding', 'subsidiary', 'parent company', 'merger', 'acquisition', 'joint venture',
    'due diligence', 'compliance', 'regulatory', 'governance', 'internal controls',
    'contract', 'contracts', 'agreement', 'agreements', 'terms', 'conditions', 'clause', 'clauses',
    'clause', 'section', 'article', 'policy', 'policies', 'procedure', 'procedures', 'manual',
    'corporate', 'corporation', 'company', 'enterprise', 'business', 'firm', 'incorporated', 'inc', 'ltd', 'llc',
    'director', 'directors', 'board', 'board of directors', 'manager', 'managers', 'management', 'executive', 'officer',
    'employee', 'employees', 'employer', 'employers', 'staff', 'personnel', 'human resources', 'hr',
    'report', 'reports', 'financial statements', 'annual report', 'interim report', 'quarterly', 'monthly',
    'file', 'files', 'document', 'documents', 'memo', 'memorandum', 'letter', 'summary',
    'system', 'systems', 'software', 'application', 'platform', 'database', 'tool', 'tools',
    'online', 'digital', 'electronic', 'data', 'information', 'security', 'privacy',
    'international', 'standards', 'ifrs', 'gaap', 'framework', 'policy'
];

// Construir conjuntos (Sets) para búsqueda O(1)
const SPANISH_SET = new Set();
const ENGLISH_SET = new Set();

// Población con normalización a minúsculas
SPANISH_RAW.forEach(w => {
    const clean = w.trim().toLowerCase();
    if (clean) SPANISH_SET.add(clean);
});

ENGLISH_RAW.forEach(w => {
    const clean = w.trim().toLowerCase();
    if (clean) ENGLISH_SET.add(clean);
});

// Agregar también todas las versiones acentuadas del mapa de acentos
Object.values(SPANISH_ACCENT_MAP).forEach(w => {
    SPANISH_SET.add(w.toLowerCase());
});

// ── 4. REGLAS MORFOLÓGICAS Y DERIVATIVAS (ESPAÑOL) ──────────────────────────────
/**
 * Verifica si una palabra es válida en Español aplicando reglas de sufijos/prefijos
 */
function isSpanishWord(rawWord) {
    const word = rawWord.trim().toLowerCase();
    if (!word || word.length < 2) return true; // Letras aisladas (a, e, o, y) se tratan aparte

    // 1. Coincidencia directa exacta
    if (SPANISH_SET.has(word)) return true;

    // 2. Si termina en 's' o 'es' (plural regular)
    if (word.endsWith('es')) {
        const singular = word.slice(0, -2);
        if (SPANISH_SET.has(singular) || singular.endsWith('d') || singular.endsWith('r') || singular.endsWith('l') || singular.endsWith('z')) {
            if (SPANISH_SET.has(singular) || SPANISH_SET.has(singular.slice(0, -1) + 'z')) return true;
        }
    }
    if (word.endsWith('s')) {
        const singular = word.slice(0, -1);
        if (SPANISH_SET.has(singular)) return true;
    }

    // 3. Femeninos regulares (-a, -as)
    if (word.endsWith('as')) {
        const masc = word.slice(0, -2) + 'o';
        if (SPANISH_SET.has(masc)) return true;
    }
    if (word.endsWith('a')) {
        const masc = word.slice(0, -1) + 'o';
        if (SPANISH_SET.has(masc)) return true;
    }

    // 4. Adverbios en -mente
    if (word.endsWith('mente') && word.length > 6) {
        const base = word.slice(0, -5);
        if (SPANISH_SET.has(base) || SPANISH_SET.has(base + 'o')) return true;
    }

    // 5. Diminutivos (-ito, -ita, -itos, -itas)
    if (/(itos|itas|ito|ita)$/.test(word) && word.length > 5) {
        const base = word.replace(/(itos|itas|ito|ita)$/, 'o');
        if (SPANISH_SET.has(base)) return true;
    }

    // 6. Terminaciones verbales comunes (-ando, -iendo, -ado, -ido, -aba, -aron, -ieron)
    if (/(ando|iendo|ado|ido|aron|ieron|aban|aran|arian|arían)$/.test(word) && word.length > 5) {
        return true; // Muy alta probabilidad de ser forma verbal válida
    }

    return false;
}

// ── 5. REGLAS MORFOLÓGICAS Y DERIVATIVAS (INGLÉS) ───────────────────────────────
/**
 * Verifica si una palabra es válida en Inglés aplicando reglas morfológicas
 */
function isEnglishWord(rawWord) {
    const word = rawWord.trim().toLowerCase();
    if (!word || word.length < 2) return true;

    // 1. Coincidencia directa exacta
    if (ENGLISH_SET.has(word)) return true;

    // 2. Plurales regulares (-s, -es, -ies)
    if (word.endsWith('ies') && word.length > 4) {
        if (ENGLISH_SET.has(word.slice(0, -3) + 'y')) return true;
    }
    if (word.endsWith('es') && word.length > 3) {
        if (ENGLISH_SET.has(word.slice(0, -2))) return true;
    }
    if (word.endsWith('s') && word.length > 2) {
        if (ENGLISH_SET.has(word.slice(0, -1))) return true;
    }

    // 3. Pasados y participios (-ed, -d)
    if (word.endsWith('ed') && word.length > 4) {
        if (ENGLISH_SET.has(word.slice(0, -2)) || ENGLISH_SET.has(word.slice(0, -1))) return true;
    }

    // 4. Gerundios (-ing)
    if (word.endsWith('ing') && word.length > 4) {
        if (ENGLISH_SET.has(word.slice(0, -3)) || ENGLISH_SET.has(word.slice(0, -3) + 'e')) return true;
    }

    // 5. Adverbios (-ly)
    if (word.endsWith('ly') && word.length > 4) {
        if (ENGLISH_SET.has(word.slice(0, -2))) return true;
    }

    return false;
}

// ── 6. DISTANCIA DAMERAU-LEVENSHTEIN Y GENERADOR DE SUGERENCIAS ───────────────
/**
 * Calcula la distancia Damerau-Levenshtein entre dos cadenas (incluye transposiciones)
 */
function damerauLevenshtein(a, b) {
    const al = a.length;
    const bl = b.length;
    if (Math.abs(al - bl) > 2) return 99; // Bounding rápido para rendimiento

    const d = [];
    for (let i = 0; i <= al; i++) {
        d[i] = [i];
    }
    for (let j = 0; j <= bl; j++) {
        d[0][j] = j;
    }

    for (let i = 1; i <= al; i++) {
        for (let j = 1; j <= bl; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            d[i][j] = Math.min(
                d[i - 1][j] + 1,      // Eliminación
                d[i][j - 1] + 1,      // Inserción
                d[i - 1][j - 1] + cost // Sustitución
            );
            // Transposición de caracteres contiguos (ej. "balanse" -> "balance", "cta" -> "cat")
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
            }
        }
    }
    return d[al][bl];
}

/**
 * Genera sugerencias inteligentes para una palabra mal escrita
 * @param {string} originalWord Palabra ingresada por el usuario
 * @param {'es'|'en'|'bilingual'} lang Idioma activo
 * @returns {Array<string>} Lista de hasta 5 sugerencias ordenadas por relevancia
 */
function getSmartSuggestions(originalWord, lang = 'es') {
    const wordLower = originalWord.trim().toLowerCase();
    const isCapitalized = /^[A-ZÁÉÍÓÚÑ]/.test(originalWord);
    const isAllUpper = originalWord.length > 1 && originalWord === originalWord.toUpperCase();

    const suggestions = [];
    const seen = new Set();

    function addSuggestion(cand) {
        if (!cand) return;
        let formatted = cand;
        if (isAllUpper) formatted = cand.toUpperCase();
        else if (isCapitalized) formatted = cand.charAt(0).toUpperCase() + cand.slice(1);

        if (!seen.has(formatted.toLowerCase()) && formatted.toLowerCase() !== wordLower) {
            seen.add(formatted.toLowerCase());
            suggestions.push(formatted);
        }
    }

    // 1. Revisión de Mapa de Acentos (prioridad #1 en Español)
    if (lang === 'es' || lang === 'bilingual') {
        if (SPANISH_ACCENT_MAP[wordLower]) {
            addSuggestion(SPANISH_ACCENT_MAP[wordLower]);
        }
    }

    // 2. Errores fonéticos y ortográficos frecuentes en español (b/v, c/s/z, ll/y, h)
    if (lang === 'es' || lang === 'bilingual') {
        const phoneticRules = [
            [/sio/g, 'ció'],
            [/cion$/g, 'ción'],
            [/sion$/g, 'sión'],
            [/v/g, 'b'],
            [/b/g, 'v'],
            [/z/g, 'c'],
            [/c/g, 'z'],
            [/ll/g, 'y'],
            [/y/g, 'll'],
            [/^h/g, ''],
            [/^/g, 'h']
        ];
        phoneticRules.forEach(([pattern, rep]) => {
            const variant = wordLower.replace(pattern, rep);
            if (SPANISH_SET.has(variant) || SPANISH_ACCENT_MAP[variant]) {
                addSuggestion(SPANISH_ACCENT_MAP[variant] || variant);
            }
        });
    }

    // 3. Búsqueda por Levenshtein bounded en los diccionarios relevantes
    const candidatePool = [];
    if (lang === 'es' || lang === 'bilingual') {
        candidatePool.push(...SPANISH_SET);
    }
    if (lang === 'en' || lang === 'bilingual') {
        candidatePool.push(...ENGLISH_SET);
    }

    const scored = [];
    const targetLen = wordLower.length;

    for (let i = 0; i < candidatePool.length; i++) {
        const cand = candidatePool[i];
        // Filtrar por longitud antes de calcular distancia costosa
        if (Math.abs(cand.length - targetLen) > 2) continue;

        // Comprobación de prefijo común (acelera y mejora precisión)
        if (cand.charAt(0) !== wordLower.charAt(0) && cand.charAt(1) !== wordLower.charAt(0)) continue;

        const dist = damerauLevenshtein(wordLower, cand);
        if (dist <= 2) {
            scored.push({ cand, dist });
        }
    }

    // Ordenar por menor distancia
    scored.sort((a, b) => a.dist - b.dist);

    for (let i = 0; i < scored.length && suggestions.length < 5; i++) {
        addSuggestion(scored[i].cand);
    }

    return suggestions.slice(0, 5);
}


    /* ===================================================================
     * MODULO: color-picker.js
     * =================================================================== */
/**
 * color-picker.js — Utilidades del color picker glassmorphic flotante
 * initColorPresetsGrid, toggleColorPickerPopover, applyPaletteColor, etc.
 * EduConta SV
 */

let activeColorPickerType = null; // 'text' | 'bg'

function initColorPresetsGrid() {
    const grid = document.getElementById('color-presets-grid');
    if (!grid) return;
    // DT-2: Guarda de reentrancia — evita reconstruir la paleta si ya está poblada
    if (grid.children.length > 0) return;
    grid.innerHTML = EDUCONTA_COLOR_PRESETS.map(hex => `
        <button type="button"
            onmouseenter="previewPaletteColor('${hex}')"
            onclick="applyPaletteColor('${hex}')"
            class="w-6 h-6 rounded-lg border border-slate-300/70 dark:border-slate-700 hover:scale-110 hover:shadow-md transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
            style="background-color: ${hex};"
            title="${hex}">
        </button>
    `).join('');

    grid.addEventListener('mouseleave', () => {
        cancelPaletteColorPreview();
    });
}

function previewPaletteColor(color) {
    if (!window.EduContaTextEngine || !activeColorPickerType) return;
    window.EduContaTextEngine.previewColor(color, activeColorPickerType);
}

function cancelPaletteColorPreview() {
    if (!window.EduContaTextEngine) return;
    window.EduContaTextEngine.cancelColorPreview();
}

function positionPopoverBelow(popover, triggerEl, preferredAlign = 'left') {
    if (!popover || !triggerEl) return;
    if (popover.parentElement !== document.body) {
        document.body.appendChild(popover);
    }
    const rect = triggerEl.getBoundingClientRect();
    const popoverWidth = popover.offsetWidth || 280;
    const top = rect.bottom + 6;
    let left;

    if (preferredAlign === 'center') {
        left = rect.left + (rect.width / 2) - (popoverWidth / 2);
    } else if (preferredAlign === 'right') {
        left = rect.right - popoverWidth;
    } else {
        left = rect.left;
    }

    const maxLeft = window.innerWidth - popoverWidth - 12;
    left = Math.max(12, Math.min(left, maxLeft));

    popover.style.position = 'fixed';
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.style.zIndex = '999999';
}

function toggleColorPickerPopover(type, event) {
    if (event) event.stopPropagation();
    const popover = document.getElementById('popover-color-picker');
    if (!popover) return;

    if (popover.parentElement !== document.body) {
        document.body.appendChild(popover);
    }

    if (!popover.classList.contains('hidden') && activeColorPickerType === type) {
        closeColorPickers();
        return;
    }

    if (window.EduContaTextEngine?.saveActiveSelection) {
        window.EduContaTextEngine.saveActiveSelection(true);
    }
    activeColorPickerType = type;

    const titleEl = document.getElementById('color-picker-title');
    if (titleEl) titleEl.textContent = type === 'text' ? 'Color de Texto' : 'Color de Relleno / Fondo';

    initColorPresetsGrid();
    switchToPresetsColorView(false);

    const triggerBtn = document.getElementById(type === 'text' ? 'btn-tool-text-color' : 'btn-tool-bg-color');
    positionPopoverBelow(popover, triggerBtn, 'left');

    popover.classList.remove('hidden');
    requestAnimationFrame(() => {
        popover.classList.remove('opacity-0', 'scale-95');
        popover.classList.add('opacity-100', 'scale-100');
    });
}

function closeColorPickers() {
    const popover = document.getElementById('popover-color-picker');
    if (!popover || popover.classList.contains('hidden')) return;

    if (window.EduContaTextEngine?.hasActiveColorPreview?.()) {
        window.EduContaTextEngine.cancelColorPreview();
    }

    popover.classList.remove('opacity-100', 'scale-100');
    popover.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        popover.classList.add('hidden');
        activeColorPickerType = null;
    }, 150);
}

function applyPaletteColor(color) {
    if (!window.EduContaTextEngine || !activeColorPickerType) return;
    const type = activeColorPickerType;
    window.EduContaTextEngine.commitColorPreview(color, type);
    closeColorPickers();
}

async function pickColorWithEyedropper() {
    if (!('EyeDropper' in window)) {
        if (typeof window.showAlert === 'function') {
            window.showAlert('Cuentagotas no disponible', 'Tu navegador actual no soporta la herramienta nativa de Cuentagotas (EyeDropper API). Puedes seleccionar el color usando la paleta 2D o ingresando el código HEX.');
        } else {
            alert('Tu navegador no soporta la herramienta Cuentagotas nativa.');
        }
        return;
    }

    try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
            const hex = result.sRGBHex.toUpperCase();
            currentCustomHsv = hexToHsv(hex);
            switchToCustomColorView(false);
            updateCustomColorUI();

            if (window.EduContaTextEngine && activeColorPickerType) {
                window.EduContaTextEngine.restoreActiveSelection();
                if (activeColorPickerType === 'text') {
                    window.EduContaTextEngine.setTextColor(hex);
                    const ind = document.getElementById('indicator-text-color');
                    if (ind) ind.style.backgroundColor = hex;
                } else {
                    const sel = window.getSelection();
                    let node = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
                    const activeCell = node ? node.closest('td, th') : null;
                    if (activeCell && (!sel || sel.isCollapsed)) {
                        activeCell.style.backgroundColor = hex;
                        window.TextDocStateManager?.pushHistory();
                        window.TextDocStateManager?.triggerAutoSave();
                    } else {
                        window.EduContaTextEngine.setHighlightColor(hex);
                    }
                    const ind = document.getElementById('indicator-bg-color');
                    if (ind) ind.style.backgroundColor = hex;
                }
            }
        }
    } catch (err) {
        console.log('Cuentagotas cancelado o no completado:', err);
    }
}

let currentCustomHsv = { h: 38, s: 0.93, v: 0.96 }; // #F59E0B por defecto
let isDraggingSatVal = false;
let isDraggingHue = false;

function hsvToRgb(h, s, v) {
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h / 60) % 6;
    const f = (h / 60) - Math.floor(h / 60);
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = Math.max(0, Math.min(255, x)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
}

function hexToHsv(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return { h: 38, s: 0.93, v: 0.96 };
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0;
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.max(0, Math.min(1, s)), v: Math.max(0, Math.min(1, v)) };
}

function switchToCustomColorView(resetFromSelection = true) {
    const presetsView = document.getElementById('color-picker-presets-view');
    const customView = document.getElementById('color-picker-custom-view');
    const track = document.getElementById('color-picker-slider-track');
    if (!presetsView || !customView) return;

    if (resetFromSelection) {
        try {
            const sel = window.getSelection();
            let node = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
            if (node) {
                const comp = window.getComputedStyle(node);
                const currentColor = activeColorPickerType === 'text' ? comp.color : comp.backgroundColor;
                if (currentColor && currentColor !== 'transparent' && currentColor !== 'rgba(0, 0, 0, 0)') {
                    const rgbMatch = currentColor.match(/\d+/g);
                    if (rgbMatch && rgbMatch.length >= 3) {
                        const hex = rgbToHex(parseInt(rgbMatch[0]), parseInt(rgbMatch[1]), parseInt(rgbMatch[2]));
                        currentCustomHsv = hexToHsv(hex);
                    }
                }
            }
        } catch (_) {}
    }

    if (window.EduContaTextEngine && activeColorPickerType) {
        window.EduContaTextEngine.beginColorPreview(activeColorPickerType);
    }

    initCustomColorPickerEvents();
    updateCustomColorUI();

    presetsView.style.position = 'absolute';
    presetsView.style.top = '0';
    presetsView.style.left = '0';
    presetsView.style.transform = 'translateX(-100%)';
    presetsView.style.opacity = '0';
    presetsView.style.pointerEvents = 'none';

    customView.style.position = 'relative';
    customView.style.top = 'auto';
    customView.style.left = 'auto';
    customView.style.transform = 'translateX(0%)';
    customView.style.opacity = '1';
    customView.style.pointerEvents = 'auto';

    if (track) track.style.height = '';
}

function switchToPresetsColorView(cancelPreview = true) {
    if (cancelPreview && window.EduContaTextEngine?.hasActiveColorPreview?.()) {
        window.EduContaTextEngine.cancelColorPreview();
    }

    const presetsView = document.getElementById('color-picker-presets-view');
    const customView = document.getElementById('color-picker-custom-view');
    const track = document.getElementById('color-picker-slider-track');
    if (!presetsView || !customView) return;

    customView.style.position = 'absolute';
    customView.style.top = '0';
    customView.style.left = '0';
    customView.style.transform = 'translateX(100%)';
    customView.style.opacity = '0';
    customView.style.pointerEvents = 'none';

    presetsView.style.position = 'relative';
    presetsView.style.top = 'auto';
    presetsView.style.left = 'auto';
    presetsView.style.transform = 'translateX(0%)';
    presetsView.style.opacity = '1';
    presetsView.style.pointerEvents = 'auto';

    if (track) track.style.height = '';
}

function updateCustomColorUI() {
    const rgb = hsvToRgb(currentCustomHsv.h, currentCustomHsv.s, currentCustomHsv.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    const satValBox = document.getElementById('custom-color-satval-box');
    const satValCursor = document.getElementById('custom-color-satval-cursor');
    const hueCursor = document.getElementById('custom-color-hue-cursor');
    const previewSwatch = document.getElementById('custom-color-preview-swatch');
    const hexInput = document.getElementById('custom-color-hex-input');
    const rInput = document.getElementById('custom-color-r-input');
    const gInput = document.getElementById('custom-color-g-input');
    const bInput = document.getElementById('custom-color-b-input');

    if (satValBox) satValBox.style.backgroundColor = `hsl(${currentCustomHsv.h}, 100%, 50%)`;
    if (satValCursor) {
        satValCursor.style.left = `${currentCustomHsv.s * 100}%`;
        satValCursor.style.top = `${(1 - currentCustomHsv.v) * 100}%`;
    }
    if (hueCursor) hueCursor.style.left = `${(currentCustomHsv.h / 360) * 100}%`;
    if (previewSwatch) previewSwatch.style.backgroundColor = hex;
    if (hexInput && document.activeElement !== hexInput) hexInput.value = hex;
    if (rInput && document.activeElement !== rInput) rInput.value = rgb.r;
    if (gInput && document.activeElement !== gInput) gInput.value = rgb.g;
    if (bInput && document.activeElement !== bInput) bInput.value = rgb.b;
}

let customColorEventsInitialized = false;

function initCustomColorPickerEvents() {
    if (customColorEventsInitialized) return;
    customColorEventsInitialized = true;

    const satValBox = document.getElementById('custom-color-satval-box');
    const hueBar = document.getElementById('custom-color-hue-bar');

    const handleSatValMove = (e) => {
        if (!isDraggingSatVal || !satValBox) return;
        const rect = satValBox.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
        currentCustomHsv.s = x / rect.width;
        currentCustomHsv.v = 1 - (y / rect.height);
        updateCustomColorUI();
        livePreviewCustomColor();
    };

    const handleHueMove = (e) => {
        if (!isDraggingHue || !hueBar) return;
        const rect = hueBar.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        currentCustomHsv.h = (x / rect.width) * 360;
        updateCustomColorUI();
        livePreviewCustomColor();
    };

    if (satValBox) {
        satValBox.addEventListener('mousedown', (e) => { isDraggingSatVal = true; handleSatValMove(e); });
        satValBox.addEventListener('touchstart', (e) => { isDraggingSatVal = true; handleSatValMove(e); }, { passive: true });
    }

    if (hueBar) {
        hueBar.addEventListener('mousedown', (e) => { isDraggingHue = true; handleHueMove(e); });
        hueBar.addEventListener('touchstart', (e) => { isDraggingHue = true; handleHueMove(e); }, { passive: true });
    }

    document.addEventListener('mousemove', (e) => {
        if (isDraggingSatVal) handleSatValMove(e);
        if (isDraggingHue) handleHueMove(e);
    });
    document.addEventListener('touchmove', (e) => {
        if (isDraggingSatVal) handleSatValMove(e);
        if (isDraggingHue) handleHueMove(e);
    }, { passive: true });
    document.addEventListener('mouseup', () => { isDraggingSatVal = false; isDraggingHue = false; });
    document.addEventListener('touchend', () => { isDraggingSatVal = false; isDraggingHue = false; });
}

function livePreviewCustomColor() {
    if (!window.EduContaTextEngine || !activeColorPickerType) return;
    const rgb = hsvToRgb(currentCustomHsv.h, currentCustomHsv.s, currentCustomHsv.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    window.EduContaTextEngine.previewColor(hex, activeColorPickerType);
}

function onHexInputChange(val) {
    let clean = val.trim();
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (/^#[0-9A-F]{6}$/i.test(clean) || /^#[0-9A-F]{3}$/i.test(clean)) {
        currentCustomHsv = hexToHsv(clean);
        updateCustomColorUI();
        livePreviewCustomColor();
    }
}

function onRgbInputChange() {
    const rInput = document.getElementById('custom-color-r-input');
    const gInput = document.getElementById('custom-color-g-input');
    const bInput = document.getElementById('custom-color-b-input');
    const r = parseInt(rInput ? rInput.value : 0, 10) || 0;
    const g = parseInt(gInput ? gInput.value : 0, 10) || 0;
    const b = parseInt(bInput ? bInput.value : 0, 10) || 0;
    const hex = rgbToHex(r, g, b);
    currentCustomHsv = hexToHsv(hex);
    updateCustomColorUI();
    livePreviewCustomColor();
}

function applyCustomInteractiveColor() {
    const rgb = hsvToRgb(currentCustomHsv.h, currentCustomHsv.s, currentCustomHsv.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    applyPaletteColor(hex);
    switchToPresetsColorView(false);
}


    /* ===================================================================
     * MODULO: audit.js
     * =================================================================== */
/**
 * audit.js — AuditModeHandler
 * Modo solo-lectura (window.isAuditMode). Sin dependencias de otros módulos.
 * EduConta SV
 */

const AuditModeHandler = {
    apply() {
        document.querySelectorAll('.page-editor-surface').forEach(surface => {
            surface.setAttribute('contenteditable', 'false');
        });

        document.querySelectorAll('.tool-btn, .toolbar-btn, #font-family-select, #font-size-select, #block-style-select, #page-size-select, #page-margins-select, #page-spacing-select, #text-color-input, #bg-color-input').forEach(el => {
            el.disabled = true;
            el.style.opacity = '0.4';
            el.style.pointerEvents = 'none';
        });

        const saveBtn = document.getElementById('btn-save-doc');
        if (saveBtn) saveBtn.style.display = 'none';
        const saveToolbarBtn = document.getElementById('btn-save-toolbar');
        if (saveToolbarBtn) saveToolbarBtn.style.display = 'none';
        const undoBtn = document.getElementById('btn-undo');
        if (undoBtn) undoBtn.style.display = 'none';
        const redoBtn = document.getElementById('btn-redo');
        if (redoBtn) redoBtn.style.display = 'none';
    }
};


    /* ===================================================================
     * MODULO: stats.js
     * =================================================================== */
/**
 * stats.js — DocStatsManager
 * Estadísticas en vivo: palabras, caracteres, páginas y tiempo de lectura.
 * EduConta SV
 */

    const DocStatsManager = {
        update() {
            const editors = MultiPageEngine.getAllEditors();
            let totalText = '';
            editors.forEach(ed => {
                const clone = ed.cloneNode(true);
                clone.querySelectorAll('.toc-block').forEach(el => el.remove());
                clone.querySelectorAll('span[data-ec-pending-color], span[data-ec-pending-bg]').forEach(s => {
                    if (s.textContent.replace(/\u200B/g, '').trim() === '') s.remove();
                });
                totalText += ' ' + (clone.innerText || clone.textContent || '').replace(/\u200B/g, '');
            });

            const cleanText = totalText.trim();
            const words = cleanText === '' ? 0 : cleanText.split(/\s+/).length;
            const chars = totalText.length;
            const readMinutes = Math.ceil(words / 200);

            const elWords = document.getElementById('stat-words');
            const elChars = document.getElementById('stat-chars');
            const elReadTime = document.getElementById('stat-read-time');
            const elPages = document.getElementById('stat-pages');

            if (elWords) elWords.textContent = words.toLocaleString();
            if (elChars) elChars.textContent = chars.toLocaleString();
            if (elReadTime) elReadTime.textContent = `${readMinutes} min`;
            if (elPages) elPages.textContent = (MultiPageEngine.pageCount || 1).toString();
        }
    };


    /* ===================================================================
     * MODULO: export.js
     * =================================================================== */
/**
 * export.js — DocExportManager
 * Exportación multiformato: .EDC, .HTML, .TXT, PDF (window.print).
 * EduConta SV
 */


    const DocExportManager = {
        openExportModal() {
            const modal = document.getElementById('export-modal');
            if (modal) modal.style.display = 'flex';
        },

        closeExportModal() {
            const modal = document.getElementById('export-modal');
            if (modal) modal.style.display = 'none';
        },

        printPDF() {
            this.closeExportModal();
            window.print();
        },

        exportEDC() {
            this.closeExportModal();
            const project = TextDocStateManager.currentProject;
            if (!project) return;

            if (project.sheets[TextDocStateManager.activeSheetIndex]) {
                project.sheets[TextDocStateManager.activeSheetIndex].content = MultiPageEngine.getCleanHTML();
            }

            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', dataStr);
            downloadAnchor.setAttribute('download', `${project.name || 'documento'}_backup.edc`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            TextDocStateManager.showToast('Copia de seguridad .EDC descargada');
        },

        exportHTML() {
            this.closeExportModal();
            const project = TextDocStateManager.currentProject;
            if (!project) return;

            const sheet = project.sheets?.[TextDocStateManager.activeSheetIndex];
            const fontName = (sheet?.fontFamily || 'Plus Jakarta Sans').trim().replace(/^['"]|['"]$/g, '');
            const fontParam = encodeURIComponent(fontName).replace(/%20/g, '+');

            const docContent = MultiPageEngine.getCleanHTML();

            const fullHTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>${project.name || 'Documento EduConta SV'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono&family=${fontParam}:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: '${fontName}', 'Plus Jakarta Sans', sans-serif; line-height: 1.6; color: #1e293b; max-width: 850px; margin: 0 auto; padding: 25mm; background: #ffffff; }
        h1 { font-size: 2rem; font-weight: 800; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; }
        h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5rem; }
        h3 { font-size: 1.25rem; font-weight: 600; }
        blockquote { border-left: 4px solid #f59e0b; background: #fffbeb; padding: 12px 18px; font-style: italic; margin: 16px 0; border-radius: 0 8px 8px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
        th { background-color: #f1f5f9; font-weight: bold; }
        code { font-family: 'JetBrains Mono', monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
        .edu-callout { padding: 12px 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #f59e0b; background: #fffbeb; }
    </style>
</head>
<body>
    ${docContent}
</body>
</html>`;

            const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name || 'documento'}.html`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            TextDocStateManager.showToast('Documento .HTML descargado');
        },

        exportTXT() {
            this.closeExportModal();
            const project = TextDocStateManager.currentProject;
            if (!project) return;

            const editors = MultiPageEngine.getAllEditors();
            let text = '';
            editors.forEach(ed => {
                const clone = ed.cloneNode(true);
                clone.querySelectorAll('.toc-block').forEach(el => el.remove());
                text += '\n\n' + (clone.innerText || clone.textContent || '');
            });

            const blob = new Blob([text.trim()], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name || 'documento'}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            TextDocStateManager.showToast('Texto plano .TXT descargado');
        }
    };


    /* ===================================================================
     * MODULO: image-resizer.js
     * =================================================================== */
/**
 * image-resizer.js — ImageResizeManager
 * Motor 2D de redimensionamiento fluido y de alta precisión para imágenes.
 * EduConta SV — Módulo Documentos (Ámbar)
 * 
 * Características:
 * - Render loop sincronizado con requestAnimationFrame (60/120 Hz, cero layout thrashing).
 * - Pointer Capture para prevenir pérdida de cursor en movimientos veloces.
 * - 8 tiradores interactivos (4 esquinas con aspect ratio y 4 laterales independientes).
 * - Indicador flotante HUD de dimensiones en tiempo real (píxeles y porcentaje).
 * - Soporte para relación de aspecto proporcional por defecto y libre manteniendo Shift.
 */
const ImageResizeManager = {
    containerEl: null,
    hudEl: null,
    targetImg: null,
    isDragging: false,
    _dragData: null,
    _rafId: null,

    init() {
        this.containerEl = document.getElementById('image-resize-handles');
        if (!this.containerEl) {
            this.containerEl = document.createElement('div');
            this.containerEl.id = 'image-resize-handles';
            this.containerEl.className = 'no-print';
            document.body.appendChild(this.containerEl);
        }

        // Crear o enlazar el badge HUD de medidas
        this.hudEl = document.getElementById('image-resize-hud');
        if (!this.hudEl) {
            this.hudEl = document.createElement('div');
            this.hudEl.id = 'image-resize-hud';
            this.hudEl.className = 'no-print';
            this.containerEl.appendChild(this.hudEl);
        }

        // Asegurar la presencia de los 8 tiradores (4 esquinas + 4 puntos medios)
        const dirs = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
        dirs.forEach(dir => {
            let handle = this.containerEl.querySelector(`.img-resize-handle[data-dir="${dir}"]`);
            if (!handle) {
                handle = document.createElement('div');
                handle.className = 'img-resize-handle';
                handle.dataset.dir = dir;
                this.containerEl.appendChild(handle);
            }
            this._bindHandleEvents(handle, dir);
        });

        // Sincronizar posición de las asas al redimensionar la ventana o hacer scroll
        window.addEventListener('resize', () => this.update(), { passive: true });
        document.querySelector('.editor-scroll-area')?.addEventListener('scroll', () => this.update(), { passive: true });
    },

    _bindHandleEvents(handle, dir) {
        handle.addEventListener('pointerdown', (e) => {
            if (window.isAuditMode || !this.targetImg) return;
            e.preventDefault();
            e.stopPropagation();

            try {
                handle.setPointerCapture(e.pointerId);
            } catch (_) {}

            const rect = this.targetImg.getBoundingClientRect();
            const surface = this.targetImg.closest('.page-editor-surface');
            const surfaceRect = surface ? surface.getBoundingClientRect() : { width: 800 };
            const isFree = this.targetImg.classList.contains('doc-img-behind') || this.targetImg.classList.contains('doc-img-front');

            this.isDragging = true;
            this._dragData = {
                handle,
                pointerId: e.pointerId,
                dir,
                startX: e.clientX,
                startY: e.clientY,
                startW: rect.width,
                startH: rect.height,
                aspect: rect.width / (rect.height || 1),
                isFree,
                startLeft: parseFloat(this.targetImg.style.left) || 0,
                startTop: parseFloat(this.targetImg.style.top) || 0,
                pageContentWidth: surfaceRect.width ? Math.max(300, surfaceRect.width - 96) : 700
            };

            this.targetImg.classList.add('doc-img-resizing');
            this.containerEl.classList.add('is-resizing');
            this.showHud(rect.width, rect.height);

            const onPointerMove = (evt) => {
                if (!this.isDragging || !this._dragData) return;
                evt.preventDefault();

                if (this._rafId) cancelAnimationFrame(this._rafId);
                this._rafId = requestAnimationFrame(() => {
                    this._processResizeMove(evt);
                });
            };

            const onPointerUp = (evt) => {
                try {
                    handle.releasePointerCapture(evt.pointerId);
                } catch (_) {}

                handle.removeEventListener('pointermove', onPointerMove);
                handle.removeEventListener('pointerup', onPointerUp);
                handle.removeEventListener('pointercancel', onPointerUp);

                if (this._rafId) {
                    cancelAnimationFrame(this._rafId);
                    this._rafId = null;
                }

                if (this.isDragging) {
                    this.isDragging = false;
                    this.targetImg?.classList.remove('doc-img-resizing');
                    this.containerEl?.classList.remove('is-resizing');
                    this.hideHud();
                    this.update();

                    // Sincronizar barra flotante y persistir cambios
                    if (window.ImageLayerManager) {
                        window.ImageLayerManager.updateToolbarPosition();
                    }

                    TextDocStateManager.pushHistory();
                    DocStatsManager.update();
                    TextDocStateManager.triggerAutoSave();
                    MultiPageEngine.debouncePaginate();
                }
                this._dragData = null;
            };

            handle.addEventListener('pointermove', onPointerMove);
            handle.addEventListener('pointerup', onPointerUp);
            handle.addEventListener('pointercancel', onPointerUp);
        });
    },

    _processResizeMove(e) {
        if (!this.targetImg || !this._dragData) return;
        const d = this._dragData;
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;

        const isShift = e.shiftKey; // Con Shift = libre; sin Shift = mantiene aspect ratio en esquinas
        let newW = d.startW;
        let newH = d.startH;
        let posX = d.startLeft;
        let posY = d.startTop;

        const dir = d.dir;

        // 1. Cálculo de nuevo ancho y alto según el tirador
        switch (dir) {
            case 'se': // Esquina inferior derecha
                newW = d.startW + dx;
                newH = !isShift ? (newW / d.aspect) : (d.startH + dy);
                break;

            case 'sw': // Esquina inferior izquierda
                newW = d.startW - dx;
                newH = !isShift ? (newW / d.aspect) : (d.startH + dy);
                if (d.isFree) posX = d.startLeft + dx;
                break;

            case 'ne': // Esquina superior derecha
                newW = d.startW + dx;
                newH = !isShift ? (newW / d.aspect) : (d.startH - dy);
                if (d.isFree) posY = d.startTop + (d.startH - newH);
                break;

            case 'nw': // Esquina superior izquierda
                newW = d.startW - dx;
                newH = !isShift ? (newW / d.aspect) : (d.startH - dy);
                if (d.isFree) {
                    posX = d.startLeft + (d.startW - newW);
                    posY = d.startTop + (d.startH - newH);
                }
                break;

            case 'e': // Borde derecho (solo ancho)
                newW = d.startW + dx;
                newH = d.startH;
                break;

            case 'w': // Borde izquierdo (solo ancho)
                newW = d.startW - dx;
                newH = d.startH;
                if (d.isFree) posX = d.startLeft + dx;
                break;

            case 's': // Borde inferior (solo alto)
                newH = d.startH + dy;
                newW = d.startW;
                break;

            case 'n': // Borde superior (solo alto)
                newH = d.startH - dy;
                newW = d.startW;
                if (d.isFree) posY = d.startTop + dy;
                break;
        }

        // 2. Límites mínimos y máximos seguros
        newW = Math.max(40, Math.min(d.pageContentWidth, newW));
        newH = Math.max(30, newH);

        // Si es proporcional en esquinas, re-armonizar alto
        if (!isShift && ['nw', 'ne', 'sw', 'se'].includes(dir)) {
            newH = Math.round(newW / d.aspect);
        }

        // 3. Aplicar dimensiones a la imagen
        this.targetImg.style.width = `${Math.round(newW)}px`;
        this.targetImg.style.height = (!isShift && ['nw', 'ne', 'sw', 'se'].includes(dir)) ? 'auto' : `${Math.round(newH)}px`;

        if (d.isFree) {
            this.targetImg.style.left = `${Math.round(posX)}px`;
            this.targetImg.style.top = `${Math.round(posY)}px`;
            this.targetImg.dataset.ecPosX = Math.round(posX);
            this.targetImg.dataset.ecPosY = Math.round(posY);
        }

        // 4. Actualizar marco visual y badge HUD
        this.update();
        this.showHud(newW, newH, d.pageContentWidth);
    },

    show(img) {
        if (!img) return;
        this.targetImg = img;
        if (this.containerEl) {
            this.containerEl.style.display = 'block';
            this.update();
        }
    },

    hide() {
        if (this.containerEl) {
            this.containerEl.style.display = 'none';
        }
        this.hideHud();
        this.targetImg = null;
        this.isDragging = false;
    },

    update() {
        if (!this.targetImg || !this.containerEl || this.containerEl.style.display === 'none') return;
        
        // Si la imagen fue removida del DOM, ocultar
        if (!document.body.contains(this.targetImg)) {
            this.hide();
            return;
        }

        const rect = this.targetImg.getBoundingClientRect();
        const scrollX = window.scrollX || document.documentElement.scrollLeft || 0;
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;

        const el = this.containerEl;
        el.style.top = `${Math.round(rect.top + scrollY)}px`;
        el.style.left = `${Math.round(rect.left + scrollX)}px`;
        el.style.width = `${Math.round(rect.width)}px`;
        el.style.height = `${Math.round(rect.height)}px`;
    },

    showHud(w, h, maxW = null) {
        if (!this.hudEl) return;
        const widthPx = Math.round(w);
        const heightPx = Math.round(h);
        
        let pctText = '';
        if (maxW && maxW > 0) {
            const pct = Math.min(100, Math.round((widthPx / maxW) * 100));
            pctText = ` • ${pct}%`;
        }

        this.hudEl.textContent = `${widthPx} × ${heightPx} px${pctText}`;
        this.hudEl.style.display = 'flex';
    },

    hideHud() {
        if (this.hudEl) {
            this.hudEl.style.display = 'none';
        }
    }
};


    /* ===================================================================
     * MODULO: images.js
     * =================================================================== */
/**
 * images.js — ImageLayerManager
 * Selección, ajuste de capa, tamaño y resize handles de imágenes.
 * EduConta SV
 */



    const ImageLayerManager = {
        selectedImg: null,
        toolbarEl: null,
        _resizeHandlesEl: null,
        _resizeDrag: null,

        _didDragJustNow: false,
        _dragCandidate: null,
        _dragState: null,

        init() {
            this.toolbarEl = document.getElementById('image-floating-toolbar');
            this._resizeHandlesEl = document.getElementById('image-resize-handles');

            // Prevenir que el navegador ejecute el arrastre nativo HTML5 (fantasma) en imágenes
            document.addEventListener('dragstart', (e) => {
                if (e.target && e.target.tagName === 'IMG' && e.target.closest('.page-editor-surface')) {
                    e.preventDefault();
                }
            }, true);

            // Red de seguridad global: evitar que el navegador abra archivos arrastrados
            // en una pestaña nueva si el drop cae fuera de un editor surface
            document.addEventListener('dragover', (e) => {
                if (e.dataTransfer?.types?.includes('Files')) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                }
            });
            document.addEventListener('drop', (e) => {
                // Solo intervenir si se sueltan archivos fuera de un .page-editor-surface
                // (los drops dentro ya los maneja engine.js bindPageEvents)
                if (e.dataTransfer?.types?.includes('Files') && !e.target.closest('.page-editor-surface')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            // Escuchar clics globales para seleccionar/deseleccionar imágenes
            document.addEventListener('click', (e) => {
                if (window.isAuditMode) return;

                // Si acabamos de soltar un arrastre, no alterar la selección
                if (this._didDragJustNow) return;

                // Si el clic fue dentro de la barra flotante o panel editor, no hacer nada
                if (this.toolbarEl && this.toolbarEl.contains(e.target)) return;
                const editorPanel = document.getElementById('image-editor-panel');
                if (editorPanel && editorPanel.contains(e.target)) return;
                const cropOverlay = document.getElementById('image-crop-overlay');
                if (cropOverlay && cropOverlay.contains(e.target)) return;
                const cropControls = document.getElementById('crop-controls');
                if (cropControls && cropControls.contains(e.target)) return;
                if (this._resizeHandlesEl && this._resizeHandlesEl.contains(e.target)) return;

                // Si el clic fue sobre una imagen dentro de un editor
                const img = e.target.closest('.page-editor-surface img');
                if (img) {
                    this.selectImage(img);
                } else {
                    this.deselect();
                }
            });

            // Ocultar o reposicionar barra al hacer scroll o redimensionar
            window.addEventListener('resize', () => {
                this.updateToolbarPosition();
                this._updateResizeHandles();
            });
            document.querySelector('.editor-scroll-area')?.addEventListener('scroll', () => {
                this.updateToolbarPosition();
                this._updateResizeHandles();
            });

            // Inicializar resize handles (drag events)
            this._initResizeHandles();

            // Inicializar arrastre libre para cualquier imagen
            this._initDragFree();
        },

        selectImage(img) {
            this.deselect();
            this.selectedImg = img;
            img.classList.add('doc-img-selected');
            this.showToolbar();
            this._showResizeHandles();

            // Sincronizar panel de edición si está abierto
            if (window.ImageEditorManager?.panelEl?.classList.contains('ec-panel-open')) {
                window.ImageEditorManager._syncPanelWithImage();
            }
        },

        deselect() {
            if (this.selectedImg) {
                this.selectedImg.classList.remove('doc-img-selected');
                this.selectedImg = null;
            }
            if (this.toolbarEl) {
                this.toolbarEl.style.display = 'none';
            }
            this._hideResizeHandles();
            // Cerrar panel de edición
            if (window.ImageEditorManager?.panelEl?.classList.contains('ec-panel-open')) {
                window.ImageEditorManager.closeEditorPanel();
            }
        },

        showToolbar() {
            if (!this.selectedImg || !this.toolbarEl) return;
            this.toolbarEl.style.display = 'flex';
            this.updateToolbarPosition();
        },

        updateToolbarPosition() {
            if (!this.selectedImg || !this.toolbarEl || this.toolbarEl.style.display === 'none') return;
            const imgRect = this.selectedImg.getBoundingClientRect();
            const toolbarRect = this.toolbarEl.getBoundingClientRect();

            const toolbarW = toolbarRect.width || 96;
            const toolbarH = toolbarRect.height || 330;

            // 1. Posición Horizontal: colocar al lateral derecho de la imagen
            let left = imgRect.right + window.scrollX + 12;

            // Si no cabe a la derecha de la ventana, posicionar al lateral izquierdo
            if (left + toolbarW > window.innerWidth - 12) {
                left = imgRect.left + window.scrollX - toolbarW - 12;
            }

            // Si la imagen es muy ancha y tampoco cabe a la izquierda, fijar al margen seguro
            if (left < 10) {
                left = Math.min(window.innerWidth - toolbarW - 14, Math.max(10, imgRect.right + window.scrollX - toolbarW - 8));
            }

            // 2. Posición Vertical: alinear con la parte superior de la imagen
            let top = imgRect.top + window.scrollY;

            // Límite superior: evitar chocar con la barra de herramientas superior fija
            const floatingToolbar = document.querySelector('.sticky-fixed-controls, #editor-sticky-controls');
            const minAllowedTop = floatingToolbar 
                ? (floatingToolbar.getBoundingClientRect().bottom + window.scrollY + 8) 
                : (window.scrollY + 64);

            if (top < minAllowedTop) {
                top = minAllowedTop;
            }

            // Límite inferior: evitar que se desborde por el fondo de la pantalla visible
            const maxAllowedTop = window.scrollY + window.innerHeight - toolbarH - 16;
            if (top > maxAllowedTop && maxAllowedTop >= minAllowedTop) {
                top = maxAllowedTop;
            }

            this.toolbarEl.style.top = `${Math.round(top)}px`;
            this.toolbarEl.style.left = `${Math.round(left)}px`;
        },

        setLayerMode(mode) {
            if (!this.selectedImg) return;

            const img = this.selectedImg;
            const wasFreefloat = img.classList.contains('doc-img-behind') || img.classList.contains('doc-img-front');
            const willFreefloat = mode === 'behind' || mode === 'front';

            // Remover clases de modo anteriores
            img.classList.remove(
                'doc-img-inline', 
                'doc-img-center', 
                'doc-img-wrap-left', 
                'doc-img-wrap-right', 
                'doc-img-top-bottom',
                'doc-img-behind', 
                'doc-img-front'
            );

            // Si cambiamos A modo libre (behind/front), inicializar posición
            if (willFreefloat && !wasFreefloat) {
                const surface = img.closest('.page-editor-surface');
                if (surface) {
                    const surfaceRect = surface.getBoundingClientRect();
                    const imgRect = img.getBoundingClientRect();
                    const x = imgRect.left - surfaceRect.left;
                    const y = imgRect.top - surfaceRect.top;
                    img.style.left = `${Math.max(0, x)}px`;
                    img.style.top  = `${Math.max(0, y)}px`;
                    img.dataset.ecPosX = Math.max(0, x);
                    img.dataset.ecPosY = Math.max(0, y);
                }
            }

            // Si salimos de modo libre, limpiar posicionamiento absoluto
            if (!willFreefloat && wasFreefloat) {
                img.style.left = '';
                img.style.top  = '';
                delete img.dataset.ecPosX;
                delete img.dataset.ecPosY;
            }

            img.classList.add(`doc-img-${mode}`);

            // Si ya tenía posición guardada (recarga), restaurarla
            if (willFreefloat && img.dataset.ecPosX) {
                img.style.left = `${img.dataset.ecPosX}px`;
                img.style.top  = `${img.dataset.ecPosY}px`;
            }

            const labels = {
                'inline': 'En línea', 'center': 'Centrada', 
                'wrap-left': 'Texto a la derecha', 'wrap-right': 'Texto a la izquierda',
                'top-bottom': 'Arriba y abajo', 'behind': 'Detrás (libre)', 'front': 'Delante (libre)'
            };

            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            TextDocStateManager.triggerAutoSave();
            MultiPageEngine.debouncePaginate();
            this.updateToolbarPosition();
            this._updateResizeHandles();
            TextDocStateManager.showToast(labels[mode] || mode);
        },

        setSize(sizePercent) {
            if (!this.selectedImg) return;
            this.selectedImg.style.width = sizePercent;
            this.selectedImg.style.height = 'auto';

            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            TextDocStateManager.triggerAutoSave();
            MultiPageEngine.debouncePaginate();
            this.updateToolbarPosition();
            this._updateResizeHandles();
        },

        deleteSelectedImage() {
            if (!this.selectedImg) return;
            const img = this.selectedImg;
            this.deselect();
            // Si está dentro de un <figure>, eliminar el figure completo
            const figure = img.parentElement;
            if (figure && figure.tagName === 'FIGURE') {
                figure.remove();
            } else {
                img.remove();
            }

            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            TextDocStateManager.triggerAutoSave();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.showToast('Imagen eliminada');
        },

        // ═══════════════════════════════════════════════════════════════════
        //  RESIZE HANDLES — asas de redimensionado interactivas
        // ═══════════════════════════════════════════════════════════════════

        _showResizeHandles() {
            if (!this._resizeHandlesEl || !this.selectedImg) return;
            this._resizeHandlesEl.style.display = 'block';
            this._updateResizeHandles();
        },

        _hideResizeHandles() {
            if (this._resizeHandlesEl) {
                this._resizeHandlesEl.style.display = 'none';
            }
        },

        _updateResizeHandles() {
            if (!this._resizeHandlesEl || !this.selectedImg || this._resizeHandlesEl.style.display === 'none') return;

            const imgRect = this.selectedImg.getBoundingClientRect();
            const el = this._resizeHandlesEl;

            el.style.top    = (imgRect.top + window.scrollY) + 'px';
            el.style.left   = (imgRect.left + window.scrollX) + 'px';
            el.style.width  = imgRect.width + 'px';
            el.style.height = imgRect.height + 'px';
        },

        _initResizeHandles() {
            if (!this._resizeHandlesEl) return;

            const handles = this._resizeHandlesEl.querySelectorAll('.img-resize-handle');
            handles.forEach(handle => {
                handle.addEventListener('pointerdown', (e) => {
                    if (window.isAuditMode || !this.selectedImg) return;
                    e.preventDefault();
                    e.stopPropagation();

                    const imgRect = this.selectedImg.getBoundingClientRect();
                    const aspectRatio = imgRect.width / imgRect.height;

                    this._resizeDrag = {
                        dir:    handle.dataset.dir,
                        startX: e.clientX,
                        startY: e.clientY,
                        startW: imgRect.width,
                        startH: imgRect.height,
                        aspect: aspectRatio,
                    };

                    document.addEventListener('pointermove', this._onResizeMove);
                    document.addEventListener('pointerup',   this._onResizeUp);
                });
            });

            this._onResizeMove = (e) => {
                if (!this._resizeDrag || !this.selectedImg) return;
                e.preventDefault();

                const d  = this._resizeDrag;
                const dx = e.clientX - d.startX;
                const dy = e.clientY - d.startY;

                let newW = d.startW;

                // Calcular nuevo ancho según la dirección del handle
                if (d.dir === 'se' || d.dir === 'ne') newW = Math.max(30, d.startW + dx);
                if (d.dir === 'sw' || d.dir === 'nw') newW = Math.max(30, d.startW - dx);

                this.selectedImg.style.width  = newW + 'px';
                this.selectedImg.style.height = 'auto';  // Mantener proporción

                this.updateToolbarPosition();
                this._updateResizeHandles();
            };

            this._onResizeUp = () => {
                if (this._resizeDrag) {
                    this._resizeDrag = null;
                    TextDocStateManager.pushHistory();
                    DocStatsManager.update();
                    TextDocStateManager.triggerAutoSave();
                    MultiPageEngine.debouncePaginate();
                }
                document.removeEventListener('pointermove', this._onResizeMove);
                document.removeEventListener('pointerup',   this._onResizeUp);
            };
        },

        // ═══════════════════════════════════════════════════════════════════
        //  ARRASTRE LIBRE — cualquier imagen se puede arrastrar y soltar
        // ═══════════════════════════════════════════════════════════════════

        _isFreefloat(img) {
            return img && (img.classList.contains('doc-img-behind') || img.classList.contains('doc-img-front'));
        },

        _initDragFree() {
            // Escuchar pointerdown globalmente para capturar arrastre de cualquier imagen
            document.addEventListener('pointerdown', (e) => {
                if (window.isAuditMode) return;

                // Verificar si se presionó sobre una imagen del documento
                const img = e.target.closest('.page-editor-surface img');
                if (!img) return;

                // Ignorar si se hizo clic en un asa de redimensionado o en el toolbar
                if (e.target.closest('.img-resize-handle') || e.target.closest('#image-floating-toolbar')) return;

                const surface = img.closest('.page-editor-surface');
                if (!surface) return;

                // Registrar candidato a arrastre
                this._dragCandidate = {
                    img: img,
                    surface: surface,
                    startX: e.clientX,
                    startY: e.clientY
                };
            });

            document.addEventListener('pointermove', (e) => {
                if (window.isAuditMode) return;

                // 1. Detectar si un candidato supera el umbral de movimiento (4px)
                if (this._dragCandidate && !this._dragState) {
                    const c = this._dragCandidate;
                    const dist = Math.hypot(e.clientX - c.startX, e.clientY - c.startY);

                    if (dist > 4) {
                        e.preventDefault();

                        // Seleccionar la imagen
                        if (this.selectedImg !== c.img) {
                            this.selectImage(c.img);
                        }

                        const surfaceRect = c.surface.getBoundingClientRect();
                        const imgRect = c.img.getBoundingClientRect();

                        // Posición actual relativa a la página
                        let currentLeft = parseFloat(c.img.style.left);
                        let currentTop  = parseFloat(c.img.style.top);

                        // Si la imagen no estaba en modo libre (behind/front), convertirla automáticamente a libre
                        if (!this._isFreefloat(c.img) || isNaN(currentLeft) || isNaN(currentTop)) {
                            currentLeft = Math.round(imgRect.left - surfaceRect.left);
                            currentTop  = Math.round(imgRect.top - surfaceRect.top);
                            this.setLayerMode('front');
                            c.img.style.left = `${currentLeft}px`;
                            c.img.style.top  = `${currentTop}px`;
                        }

                        c.img.classList.add('doc-img-dragging');

                        this._dragState = {
                            img:       c.img,
                            surface:   c.surface,
                            startX:    e.clientX,
                            startY:    e.clientY,
                            startLeft: currentLeft,
                            startTop:  currentTop
                        };

                        // Ocultar barra flotante y asas mientras se arrastra
                        if (this.toolbarEl) this.toolbarEl.style.display = 'none';
                        this._hideResizeHandles();
                    }
                }

                // 2. Mover la imagen en tiempo real si el arrastre está activo
                if (this._dragState) {
                    e.preventDefault();

                    const d = this._dragState;
                    const dx = e.clientX - d.startX;
                    const dy = e.clientY - d.startY;

                    // Si el puntero se desplaza sobre otra hoja física, transferir la imagen
                    const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
                    const targetSurface = elementUnder?.closest('.page-editor-surface');
                    if (targetSurface && targetSurface !== d.surface) {
                        const oldRect = d.surface.getBoundingClientRect();
                        const newRect = targetSurface.getBoundingClientRect();
                        targetSurface.appendChild(d.img);
                        d.startLeft += (oldRect.left - newRect.left);
                        d.startTop  += (oldRect.top - newRect.top);
                        d.surface = targetSurface;
                    }

                    const surfaceRect = d.surface.getBoundingClientRect();
                    const imgW = d.img.offsetWidth;
                    const imgH = d.img.offsetHeight;

                    let newX = d.startLeft + dx;
                    let newY = d.startTop + dy;

                    // Restricción: mantener la imagen dentro del área visible de la página
                    newX = Math.max(-imgW * 0.3, Math.min(surfaceRect.width  - imgW * 0.7, newX));
                    newY = Math.max(0, Math.min(surfaceRect.height - imgH * 0.3, newY));

                    d.img.style.left = `${Math.round(newX)}px`;
                    d.img.style.top  = `${Math.round(newY)}px`;
                }
            });

            document.addEventListener('pointerup', () => {
                if (this._dragState) {
                    const d = this._dragState;
                    d.img.classList.remove('doc-img-dragging');

                    // Guardar coordenadas finales en datasets para persistencia
                    d.img.dataset.ecPosX = Math.round(parseFloat(d.img.style.left) || 0);
                    d.img.dataset.ecPosY = Math.round(parseFloat(d.img.style.top) || 0);

                    // Evitar que el clic subsiguiente altere la selección
                    this._didDragJustNow = true;
                    setTimeout(() => { this._didDragJustNow = false; }, 120);

                    this._dragState = null;
                    this._dragCandidate = null;

                    // Restaurar barra y asas
                    this.showToolbar();
                    this._showResizeHandles();

                    TextDocStateManager.pushHistory();
                    DocStatsManager.update();
                    TextDocStateManager.triggerAutoSave();
                    TextDocStateManager.showToast('Imagen reubicada');
                } else {
                    this._dragCandidate = null;
                }
            });
        }
    };


    /* ===================================================================
     * MODULO: image-crop.js
     * =================================================================== */
/**
 * image-crop.js — ImageCropManager
 * Herramienta de recorte interactivo para imágenes con Canvas API.
 * Soporta proporciones fijas y libres.
 * EduConta SV — Módulo Documentos (Amber)
 */




const ImageCropManager = {
    overlayEl:   null,
    controlsEl:  null,
    _active:     false,
    _startX:     0,
    _startY:     0,
    _startRect:  null,
    _cropRect:   { x: 0, y: 0, w: 0, h: 0 },
    _imgRect:    null,
    _ratio:      null,       // null = libre, '1:1', '4:3', '16:9', '3:2'
    _dragType:   null,       // 'move' | 'nw' | 'ne' | 'sw' | 'se'
    _onMouseDown: null,
    _onMouseMove: null,
    _onMouseUp:   null,

    init() {
        this.overlayEl  = document.getElementById('image-crop-overlay');
        this.controlsEl = document.getElementById('crop-controls');
    },

    // ═══════════════════════════════════════════════════════════════════
    //  ABRIR / CERRAR MODO RECORTE
    // ═══════════════════════════════════════════════════════════════════

    openCropMode() {
        const img = ImageLayerManager.selectedImg;
        if (!img || !this.overlayEl) return;

        this._active = true;
        this._ratio  = null;

        // Posicionar overlay exactamente sobre la imagen
        const rect = img.getBoundingClientRect();
        this._imgRect = {
            top:    rect.top + window.scrollY,
            left:   rect.left + window.scrollX,
            width:  rect.width,
            height: rect.height
        };

        const o = this.overlayEl;
        o.style.display = 'block';
        o.style.top     = this._imgRect.top + 'px';
        o.style.left    = this._imgRect.left + 'px';
        o.style.width   = this._imgRect.width + 'px';
        o.style.height  = this._imgRect.height + 'px';

        // Área de recorte inicial = imagen completa con margen del 10%
        const mx = rect.width  * 0.1;
        const my = rect.height * 0.1;
        this._cropRect = {
            x: mx,
            y: my,
            w: rect.width  - mx * 2,
            h: rect.height - my * 2
        };
        this._renderCropArea();

        // Mostrar controles
        if (this.controlsEl) this.controlsEl.style.display = 'flex';

        // Resaltar botón de proporción libre
        this._highlightRatioBtn(null);

        // Vincular eventos
        this._onMouseDown = this._handleMouseDown.bind(this);
        this._onMouseMove = this._handleMouseMove.bind(this);
        this._onMouseUp   = this._handleMouseUp.bind(this);
        o.addEventListener('pointerdown', this._onMouseDown);
        document.addEventListener('pointermove', this._onMouseMove);
        document.addEventListener('pointerup',   this._onMouseUp);

        // Ocultar toolbar de imagen temporalmente
        const toolbar = document.getElementById('image-floating-toolbar');
        if (toolbar) toolbar.style.display = 'none';

        TextDocStateManager.showToast('Modo recorte activado');
    },

    closeCropMode() {
        this._active   = false;
        this._dragType = null;

        if (this.overlayEl) {
            this.overlayEl.style.display = 'none';
            this.overlayEl.removeEventListener('pointerdown', this._onMouseDown);
        }
        document.removeEventListener('pointermove', this._onMouseMove);
        document.removeEventListener('pointerup',   this._onMouseUp);

        if (this.controlsEl) this.controlsEl.style.display = 'none';

        // Restaurar toolbar
        ImageLayerManager.showToolbar();
    },

    // ═══════════════════════════════════════════════════════════════════
    //  PROPORCIÓN DE ASPECTO
    // ═══════════════════════════════════════════════════════════════════

    setAspectRatio(ratio) {
        this._ratio = ratio;   // null | '1:1' | '4:3' | '16:9' | '3:2'
        this._highlightRatioBtn(ratio);

        if (ratio && this._active) {
            const [rw, rh] = ratio.split(':').map(Number);
            const ar = rw / rh;
            const maxW = parseFloat(this.overlayEl.style.width);
            const maxH = parseFloat(this.overlayEl.style.height);
            const r = this._cropRect;

            // Ajustar alto en función del ancho actual
            let newH = r.w / ar;
            if (r.y + newH > maxH) {
                newH = maxH - r.y;
                r.w  = newH * ar;
            }
            r.h = newH;

            // Asegurar que no exceda límites
            if (r.x + r.w > maxW) { r.w = maxW - r.x; r.h = r.w / ar; }

            this._renderCropArea();
        }
    },

    _highlightRatioBtn(ratio) {
        if (!this.controlsEl) return;
        this.controlsEl.querySelectorAll('.crop-ratio-btn').forEach(btn => {
            const val = btn.dataset.ratio || null;
            btn.classList.toggle('ec-crop-ratio-active', val === ratio);
        });
    },

    // ═══════════════════════════════════════════════════════════════════
    //  APLICAR RECORTE (Canvas API)
    // ═══════════════════════════════════════════════════════════════════

    applyCrop() {
        const img = ImageLayerManager.selectedImg;
        if (!img || !this._active) return;

        const displayW = parseFloat(this.overlayEl.style.width);
        const displayH = parseFloat(this.overlayEl.style.height);

        // Escala entre píxeles naturales y píxeles renderizados
        const scaleX = img.naturalWidth  / displayW;
        const scaleY = img.naturalHeight / displayH;

        const cr = this._cropRect;
        const sx = Math.round(cr.x * scaleX);
        const sy = Math.round(cr.y * scaleY);
        const sw = Math.round(cr.w * scaleX);
        const sh = Math.round(cr.h * scaleY);

        if (sw < 1 || sh < 1) {
            TextDocStateManager.showToast('Área de recorte demasiado pequeña');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width  = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d');

        // Intentar dibujar directamente (funciona con data: URIs y same-origin)
        const doCrop = (source) => {
            try {
                ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
                img.src = canvas.toDataURL('image/png');
                TextDocStateManager.pushHistory();
                DocStatsManager.update();
                TextDocStateManager.triggerAutoSave();
                MultiPageEngine.debouncePaginate();
                TextDocStateManager.showToast('Imagen recortada');
            } catch (e) {
                TextDocStateManager.showToast('Error al recortar (CORS)');
            }
            this.closeCropMode();
        };

        // Si es data URI o blob, dibujar directo
        if (img.src.startsWith('data:') || img.src.startsWith('blob:')) {
            doCrop(img);
        } else {
            // Para URLs externas, cargar con crossOrigin
            const tmpImg = new Image();
            tmpImg.crossOrigin = 'anonymous';
            tmpImg.onload  = () => doCrop(tmpImg);
            tmpImg.onerror = () => {
                // Fallback: intentar directamente (puede fallar por CORS tainted canvas)
                try { doCrop(img); } catch { TextDocStateManager.showToast('No se pudo recortar'); this.closeCropMode(); }
            };
            tmpImg.src = img.src;
        }
    },

    // ═══════════════════════════════════════════════════════════════════
    //  RENDERIZADO DEL ÁREA DE RECORTE
    // ═══════════════════════════════════════════════════════════════════

    _renderCropArea() {
        const sel = this.overlayEl?.querySelector('.crop-selection');
        if (!sel) return;

        const r  = this._cropRect;
        sel.style.left   = r.x + 'px';
        sel.style.top    = r.y + 'px';
        sel.style.width  = r.w + 'px';
        sel.style.height = r.h + 'px';

        // Actualizar máscaras de oscurecimiento (4 divs alrededor de la selección)
        const oW = parseFloat(this.overlayEl.style.width);
        const oH = parseFloat(this.overlayEl.style.height);

        const top    = this.overlayEl.querySelector('.crop-mask-top');
        const bottom = this.overlayEl.querySelector('.crop-mask-bottom');
        const left   = this.overlayEl.querySelector('.crop-mask-left');
        const right  = this.overlayEl.querySelector('.crop-mask-right');

        if (top) {
            top.style.left   = '0'; top.style.top = '0';
            top.style.width  = oW + 'px'; top.style.height = r.y + 'px';
        }
        if (bottom) {
            bottom.style.left   = '0'; bottom.style.top = (r.y + r.h) + 'px';
            bottom.style.width  = oW + 'px'; bottom.style.height = (oH - r.y - r.h) + 'px';
        }
        if (left) {
            left.style.left   = '0'; left.style.top = r.y + 'px';
            left.style.width  = r.x + 'px'; left.style.height = r.h + 'px';
        }
        if (right) {
            right.style.left   = (r.x + r.w) + 'px'; right.style.top = r.y + 'px';
            right.style.width  = (oW - r.x - r.w) + 'px'; right.style.height = r.h + 'px';
        }

        // Grid de tercios dentro de la selección
        const grid = sel.querySelector('.crop-grid');
        if (grid) grid.style.display = this._dragType ? 'block' : 'none';
    },

    // ═══════════════════════════════════════════════════════════════════
    //  EVENTOS DE RATÓN / PUNTERO
    // ═══════════════════════════════════════════════════════════════════

    _handleMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();

        this._startX    = e.clientX;
        this._startY    = e.clientY;
        this._startRect = { ...this._cropRect };

        const target = e.target;

        if (target.classList.contains('crop-handle')) {
            this._dragType = target.dataset.handle;
        } else if (target.closest('.crop-selection')) {
            this._dragType = 'move';
            this.overlayEl.style.cursor = 'grabbing';
        } else {
            // Clic fuera del área — iniciar nueva selección
            const oRect = this.overlayEl.getBoundingClientRect();
            this._cropRect = {
                x: e.clientX - oRect.left,
                y: e.clientY - oRect.top,
                w: 0,
                h: 0
            };
            this._startRect = { ...this._cropRect };
            this._dragType = 'se';
        }
    },

    _handleMouseMove(e) {
        if (!this._dragType || !this._active) return;
        e.preventDefault();

        const dx   = e.clientX - this._startX;
        const dy   = e.clientY - this._startY;
        const s    = this._startRect;
        const maxW = parseFloat(this.overlayEl.style.width);
        const maxH = parseFloat(this.overlayEl.style.height);

        const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

        if (this._dragType === 'move') {
            this._cropRect.x = clamp(s.x + dx, 0, maxW - s.w);
            this._cropRect.y = clamp(s.y + dy, 0, maxH - s.h);
        } else {
            let { x, y, w, h } = { ...s };

            // Redimensionar según el handle
            if (this._dragType.includes('e')) w = clamp(s.w + dx, 20, maxW - s.x);
            if (this._dragType.includes('w')) { x = clamp(s.x + dx, 0, s.x + s.w - 20); w = s.w - (x - s.x); }
            if (this._dragType.includes('s')) h = clamp(s.h + dy, 20, maxH - s.y);
            if (this._dragType.includes('n')) { y = clamp(s.y + dy, 0, s.y + s.h - 20); h = s.h - (y - s.y); }

            // Restricción de proporción
            if (this._ratio) {
                const [rw, rh] = this._ratio.split(':').map(Number);
                const ar = rw / rh;
                if (this._dragType.includes('e') || this._dragType.includes('w')) {
                    h = w / ar;
                    if (y + h > maxH) { h = maxH - y; w = h * ar; }
                } else {
                    w = h * ar;
                    if (x + w > maxW) { w = maxW - x; h = w / ar; }
                }
            }

            this._cropRect = { x, y, w: Math.max(w, 4), h: Math.max(h, 4) };
        }

        this._renderCropArea();
    },

    _handleMouseUp() {
        if (this._dragType === 'move') {
            this.overlayEl.style.cursor = '';
        }
        this._dragType = null;

        // Mostrar grid solo durante drag
        const grid = this.overlayEl?.querySelector('.crop-grid');
        if (grid) grid.style.display = 'none';
    }
};


    /* ===================================================================
     * MODULO: image-editor.js
     * =================================================================== */
/**
 * image-editor.js — ImageEditorManager
 * Edición avanzada de fotos: rotar, voltear, filtros CSS,
 * bordes, sombras, formas, alt text, caption y tamaño personalizado.
 * EduConta SV — Módulo Documentos (Amber)
 */




// ─── Defaults & Presets ─────────────────────────────────────────────────
const FILTER_DEFAULTS = {
    brightness: 100, contrast: 100, saturate: 100,
    hueRotate: 0, blur: 0, grayscale: 0, sepia: 0
};

const PRESETS = {
    original:  { brightness: 100, contrast: 100, saturate: 100, hueRotate: 0,   blur: 0, grayscale: 0,   sepia: 0  },
    vivid:     { brightness: 110, contrast: 120, saturate: 150, hueRotate: 0,   blur: 0, grayscale: 0,   sepia: 0  },
    bw:        { brightness: 100, contrast: 110, saturate: 0,   hueRotate: 0,   blur: 0, grayscale: 100, sepia: 0  },
    sepia:     { brightness: 105, contrast: 90,  saturate: 100, hueRotate: 0,   blur: 0, grayscale: 0,   sepia: 80 },
    cold:      { brightness: 110, contrast: 100, saturate: 70,  hueRotate: 180, blur: 0, grayscale: 0,   sepia: 0  },
    dramatic:  { brightness: 90,  contrast: 150, saturate: 130, hueRotate: 0,   blur: 0, grayscale: 0,   sepia: 0  },
    warm:      { brightness: 105, contrast: 105, saturate: 120, hueRotate: 15,  blur: 0, grayscale: 0,   sepia: 20 },
    soft:      { brightness: 110, contrast: 90,  saturate: 80,  hueRotate: 0,   blur: 1, grayscale: 0,   sepia: 0  },
};

const SHAPES = {
    none:     '',
    circle:   'circle(50%)',
    rounded:  'inset(0 round 20px)',
    pill:     'inset(0 round 50%)',
    diamond:  'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    pentagon: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
    hexagon:  'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    star:     'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
};

// ─── Manager ────────────────────────────────────────────────────────────
const ImageEditorManager = {
    panelEl: null,
    _isReplaceMode: false,

    /** Shortcut al img seleccionado del LayerManager */
    get img() {
        return ImageLayerManager.selectedImg;
    },

    init() {
        this.panelEl = document.getElementById('image-editor-panel');
    },

    // ═══════════════════════════════════════════════════════════════════
    //  TRANSFORMACIONES
    // ═══════════════════════════════════════════════════════════════════

    rotateImage(deg) {
        if (!this.img) return;
        const current = parseInt(this.img.dataset.ecRotation || '0', 10);
        const next = ((current + deg) % 360 + 360) % 360;
        this.img.dataset.ecRotation = next;
        this._applyTransform();
        this._save('Rotar ' + deg + '°');
    },

    flipImage(axis) {
        if (!this.img) return;
        const key = axis === 'horizontal' ? 'ecFlipH' : 'ecFlipV';
        this.img.dataset[key] = this.img.dataset[key] === '-1' ? '1' : '-1';
        this._applyTransform();
        this._save('Voltear ' + (axis === 'horizontal' ? 'horizontal' : 'vertical'));
    },

    _applyTransform() {
        if (!this.img) return;
        const rot = this.img.dataset.ecRotation || '0';
        const fh  = this.img.dataset.ecFlipH || '1';
        const fv  = this.img.dataset.ecFlipV || '1';
        this.img.style.transform = `rotate(${rot}deg) scaleX(${fh}) scaleY(${fv})`;
    },

    // ═══════════════════════════════════════════════════════════════════
    //  FILTROS CSS
    // ═══════════════════════════════════════════════════════════════════

    setFilter(name, value) {
        if (!this.img) return;
        const key = 'ecF' + name.charAt(0).toUpperCase() + name.slice(1);
        this.img.dataset[key] = value;
        this._applyFilters();
        this._updateSliderDisplay(name, value);
        this._save();
    },

    _applyFilters() {
        if (!this.img) return;
        const d = this.img.dataset;
        const vals = {
            brightness: d.ecFBrightness || 100,
            contrast:   d.ecFContrast   || 100,
            saturate:   d.ecFSaturate   || 100,
            hueRotate:  d.ecFHueRotate  || 0,
            blur:       d.ecFBlur       || 0,
            grayscale:  d.ecFGrayscale  || 0,
            sepia:      d.ecFSepia      || 0,
        };

        const parts = [];
        if (vals.brightness != 100) parts.push(`brightness(${vals.brightness / 100})`);
        if (vals.contrast   != 100) parts.push(`contrast(${vals.contrast / 100})`);
        if (vals.saturate   != 100) parts.push(`saturate(${vals.saturate / 100})`);
        if (vals.hueRotate  != 0)   parts.push(`hue-rotate(${vals.hueRotate}deg)`);
        if (vals.blur       != 0)   parts.push(`blur(${vals.blur}px)`);
        if (vals.grayscale  != 0)   parts.push(`grayscale(${vals.grayscale / 100})`);
        if (vals.sepia      != 0)   parts.push(`sepia(${vals.sepia / 100})`);

        this.img.style.filter = parts.length ? parts.join(' ') : '';
    },

    applyPreset(name) {
        if (!this.img || !PRESETS[name]) return;
        const p = PRESETS[name];
        this.img.dataset.ecFBrightness = p.brightness;
        this.img.dataset.ecFContrast   = p.contrast;
        this.img.dataset.ecFSaturate   = p.saturate;
        this.img.dataset.ecFHueRotate  = p.hueRotate;
        this.img.dataset.ecFBlur       = p.blur;
        this.img.dataset.ecFGrayscale  = p.grayscale;
        this.img.dataset.ecFSepia      = p.sepia;
        this._applyFilters();
        this._syncPanelWithImage();
        this._save('Preset: ' + name);
    },

    resetFilters() {
        this.applyPreset('original');
    },

    // ═══════════════════════════════════════════════════════════════════
    //  OPACIDAD
    // ═══════════════════════════════════════════════════════════════════

    setOpacity(value) {
        if (!this.img) return;
        this.img.dataset.ecOpacity = value;
        this.img.style.opacity = value / 100;
        this._updateSliderDisplay('opacity', value);
        this._save();
    },

    // ═══════════════════════════════════════════════════════════════════
    //  BORDES
    // ═══════════════════════════════════════════════════════════════════

    setBorderWidth(px) {
        if (!this.img) return;
        this.img.dataset.ecBorderWidth = px;
        this._applyBorder();
    },
    setBorderColor(color) {
        if (!this.img) return;
        this.img.dataset.ecBorderColor = color;
        this._applyBorder();
    },
    setBorderStyle(style) {
        if (!this.img) return;
        this.img.dataset.ecBorderStyle = style;
        this._applyBorder();
    },
    setBorderRadius(px) {
        if (!this.img) return;
        this.img.dataset.ecBorderRadius = px;
        this._applyBorder();
        this._updateSliderDisplay('borderRadius', px);
    },

    _applyBorder() {
        if (!this.img) return;
        const w = parseInt(this.img.dataset.ecBorderWidth || '0', 10);
        const c = this.img.dataset.ecBorderColor || '#f59e0b';
        const s = this.img.dataset.ecBorderStyle || 'solid';
        const r = parseInt(this.img.dataset.ecBorderRadius || '0', 10);

        this.img.style.border = w > 0 ? `${w}px ${s} ${c}` : '';
        this.img.style.borderRadius = r > 0 ? `${r}px` : '';
        this._save();
    },

    // ═══════════════════════════════════════════════════════════════════
    //  SOMBRAS
    // ═══════════════════════════════════════════════════════════════════

    toggleShadow(on) {
        if (!this.img) return;
        this.img.dataset.ecShadowOn = on ? '1' : '0';
        this._applyShadow();
    },
    setShadowX(v)     { if (!this.img) return; this.img.dataset.ecShadowX = v; this._applyShadow(); },
    setShadowY(v)     { if (!this.img) return; this.img.dataset.ecShadowY = v; this._applyShadow(); },
    setShadowBlur(v)  { if (!this.img) return; this.img.dataset.ecShadowBlur = v; this._applyShadow(); },
    setShadowColor(c) { if (!this.img) return; this.img.dataset.ecShadowColor = c; this._applyShadow(); },

    _applyShadow() {
        if (!this.img) return;
        if (this.img.dataset.ecShadowOn !== '1') {
            this.img.style.boxShadow = '';
            this._save();
            return;
        }
        const x = this.img.dataset.ecShadowX    || '4';
        const y = this.img.dataset.ecShadowY    || '4';
        const b = this.img.dataset.ecShadowBlur  || '12';
        const c = this.img.dataset.ecShadowColor || 'rgba(0,0,0,0.35)';
        this.img.style.boxShadow = `${x}px ${y}px ${b}px ${c}`;
        this._save();
    },

    // ═══════════════════════════════════════════════════════════════════
    //  FORMAS / MÁSCARAS (clip-path)
    // ═══════════════════════════════════════════════════════════════════

    setShape(shape) {
        if (!this.img) return;
        this.img.dataset.ecShape = shape;
        this.img.style.clipPath = SHAPES[shape] || '';
        this._save('Forma: ' + shape);
    },

    // ═══════════════════════════════════════════════════════════════════
    //  TEXTO ALT (Accesibilidad)
    // ═══════════════════════════════════════════════════════════════════

    setAltText(text) {
        if (!this.img) return;
        this.img.alt = text;
        this._save();
    },

    // ═══════════════════════════════════════════════════════════════════
    //  CAPTION / PIE DE IMAGEN
    // ═══════════════════════════════════════════════════════════════════

    toggleCaption() {
        if (!this.img) return;
        const parent = this.img.parentElement;

        if (parent && parent.tagName === 'FIGURE') {
            // Quitar caption — desenvolver del <figure>
            const figcaption = parent.querySelector('figcaption');
            if (figcaption) figcaption.remove();
            parent.replaceWith(this.img);
        } else {
            // Agregar caption — envolver en <figure>
            const figure = document.createElement('figure');
            figure.style.textAlign = 'center';
            figure.style.margin = '12px 0';
            this.img.parentNode.insertBefore(figure, this.img);
            figure.appendChild(this.img);

            const caption = document.createElement('figcaption');
            caption.contentEditable = 'true';
            caption.className = 'text-xs text-slate-400 dark:text-slate-500 italic mt-1 outline-none text-center';
            caption.textContent = 'Pie de imagen…';
            caption.style.fontSize = '11px';
            figure.appendChild(caption);
        }
        this._save('Caption toggled');
        MultiPageEngine.debouncePaginate();
    },

    // ═══════════════════════════════════════════════════════════════════
    //  TAMAÑO PERSONALIZADO
    // ═══════════════════════════════════════════════════════════════════

    setCustomSize(value, unit) {
        if (!this.img || !value) return;
        this.img.style.width = `${value}${unit || 'px'}`;
        this.img.style.height = 'auto';
        ImageLayerManager.updateToolbarPosition();
        this._save();
    },

    // ═══════════════════════════════════════════════════════════════════
    //  DUPLICAR
    // ═══════════════════════════════════════════════════════════════════

    duplicateImage() {
        if (!this.img) return;
        const clone = this.img.cloneNode(true);
        clone.classList.remove('doc-img-selected');
        const ref = this.img.parentElement?.tagName === 'FIGURE'
            ? this.img.parentElement
            : this.img;
        ref.parentNode.insertBefore(clone, ref.nextSibling);
        this._save('Imagen duplicada');
    },

    // ═══════════════════════════════════════════════════════════════════
    //  REEMPLAZAR
    // ═══════════════════════════════════════════════════════════════════

    replaceImage() {
        if (!this.img) return;
        this._isReplaceMode = true;
        const modal = document.getElementById('image-modal');
        const title = modal?.querySelector('h4');
        if (title) title.textContent = 'Reemplazar Imagen';
        // Limpiar inputs previos
        const fi = document.getElementById('image-input-file');
        const ui = document.getElementById('image-input-url');
        if (fi) fi.value = '';
        if (ui) ui.value = '';
        if (modal) modal.style.display = 'flex';
    },

    confirmReplaceImage(newSrc) {
        if (!this.img || !newSrc) return;
        this.img.src = newSrc;
        this._isReplaceMode = false;
        const title = document.querySelector('#image-modal h4');
        if (title) title.textContent = 'Insertar Imagen';
        this._save('Imagen reemplazada');
    },

    // ═══════════════════════════════════════════════════════════════════
    //  RESTABLECER TODO
    // ═══════════════════════════════════════════════════════════════════

    resetAll() {
        if (!this.img) return;

        // Filtros
        Object.keys(FILTER_DEFAULTS).forEach(k => {
            const key = 'ecF' + k.charAt(0).toUpperCase() + k.slice(1);
            this.img.dataset[key] = FILTER_DEFAULTS[k];
        });
        this._applyFilters();

        // Transformaciones
        delete this.img.dataset.ecRotation;
        delete this.img.dataset.ecFlipH;
        delete this.img.dataset.ecFlipV;
        this.img.style.transform = '';

        // Opacidad
        this.img.dataset.ecOpacity = '100';
        this.img.style.opacity = '';

        // Borde
        delete this.img.dataset.ecBorderWidth;
        delete this.img.dataset.ecBorderColor;
        delete this.img.dataset.ecBorderStyle;
        this.img.dataset.ecBorderRadius = '0';
        this.img.style.border = '';
        this.img.style.borderRadius = '';

        // Sombra
        this.img.dataset.ecShadowOn = '0';
        this.img.style.boxShadow = '';

        // Forma
        delete this.img.dataset.ecShape;
        this.img.style.clipPath = '';

        this._syncPanelWithImage();
        this._save('Imagen restablecida');
    },

    // ═══════════════════════════════════════════════════════════════════
    //  PANEL LATERAL
    // ═══════════════════════════════════════════════════════════════════

    openEditorPanel() {
        if (window.isAuditMode) return;
        if (!this.img || !this.panelEl) return;
        this._syncPanelWithImage();
        this.panelEl.classList.add('ec-panel-open');
    },

    closeEditorPanel() {
        if (!this.panelEl) return;
        this.panelEl.classList.remove('ec-panel-open');
    },

    /** Lee el estado actual del <img> y sincroniza todos los controles del panel */
    _syncPanelWithImage() {
        if (!this.img || !this.panelEl) return;
        const d = this.img.dataset;

        // Filtros
        this._setSlider('brightness', d.ecFBrightness || 100);
        this._setSlider('contrast',   d.ecFContrast   || 100);
        this._setSlider('saturate',   d.ecFSaturate   || 100);
        this._setSlider('hueRotate',  d.ecFHueRotate  || 0);
        this._setSlider('blur',       d.ecFBlur       || 0);
        this._setSlider('grayscale',  d.ecFGrayscale  || 0);
        this._setSlider('sepia',      d.ecFSepia      || 0);
        this._setSlider('opacity',    d.ecOpacity     || 100);
        this._setSlider('borderRadius', d.ecBorderRadius || 0);

        // Inputs de borde
        const bw = this.panelEl.querySelector('#ec-border-width');
        const bc = this.panelEl.querySelector('#ec-border-color');
        const bs = this.panelEl.querySelector('#ec-border-style');
        if (bw) bw.value = d.ecBorderWidth || '0';
        if (bc) bc.value = d.ecBorderColor || '#f59e0b';
        if (bs) bs.value = d.ecBorderStyle || 'solid';

        // Sombra
        const st = this.panelEl.querySelector('#ec-shadow-toggle');
        if (st) st.checked = d.ecShadowOn === '1';
        const sx = this.panelEl.querySelector('#ec-shadow-x');
        const sy = this.panelEl.querySelector('#ec-shadow-y');
        const sb = this.panelEl.querySelector('#ec-shadow-blur-input');
        const sc = this.panelEl.querySelector('#ec-shadow-color');
        if (sx) sx.value = d.ecShadowX    || '4';
        if (sy) sy.value = d.ecShadowY    || '4';
        if (sb) sb.value = d.ecShadowBlur  || '12';
        if (sc) sc.value = d.ecShadowColor || '#000000';

        // Texto alt
        const at = this.panelEl.querySelector('#ec-alt-text');
        if (at) at.value = this.img.alt || '';

        // Tamaño custom
        const cw = this.panelEl.querySelector('#ec-custom-width');
        if (cw) {
            const w = parseInt(this.img.style.width, 10);
            cw.value = isNaN(w) ? '' : w;
        }

        // Marcar forma activa
        this.panelEl.querySelectorAll('.ec-shape-btn').forEach(btn => {
            btn.classList.toggle('ec-shape-active', btn.dataset.shape === (d.ecShape || 'none'));
        });

        // Marcar preset activo
        this.panelEl.querySelectorAll('.ec-preset-btn').forEach(btn => {
            const p = PRESETS[btn.dataset.preset];
            if (!p) return;
            const isActive = Object.entries(p).every(([k, v]) => {
                const key = 'ecF' + k.charAt(0).toUpperCase() + k.slice(1);
                return (d[key] || FILTER_DEFAULTS[k]) == v;
            });
            btn.classList.toggle('ec-preset-active', isActive);
        });
    },

    _setSlider(name, value) {
        const slider = this.panelEl?.querySelector(`#ec-slider-${name}`);
        if (slider) slider.value = value;
        this._updateSliderDisplay(name, value);
    },

    _updateSliderDisplay(name, value) {
        const display = this.panelEl?.querySelector(`#ec-val-${name}`);
        if (!display) return;
        const suffixes = { hueRotate: '°', blur: 'px', borderRadius: 'px' };
        display.textContent = value + (suffixes[name] || '%');
    },

    // ═══════════════════════════════════════════════════════════════════
    //  HELPER — guardar estado
    // ═══════════════════════════════════════════════════════════════════

    _save(msg) {
        TextDocStateManager.pushHistory();
        DocStatsManager.update();
        TextDocStateManager.triggerAutoSave();
        MultiPageEngine.debouncePaginate();
        ImageLayerManager.updateToolbarPosition();
        if (msg) TextDocStateManager.showToast(msg);
    }
};


    /* ===================================================================
     * MODULO: table-manager.js
     * =================================================================== */
/**
 * table-manager.js — TableManager
 * Gestión contextual de tablas: barra flotante, manipulación de filas/columnas,
 * estilos de cuadrícula y personalización de celdas.
 * EduConta SV
 */


const TableManager = {
    activeTable: null,
    activeCell: null,
    toolbarEl: null,
    colorPopoverEl: null,
    _rafId: null,

    init() {
        this.toolbarEl = document.getElementById('table-floating-toolbar');
        this.colorPopoverEl = document.getElementById('table-color-popover');

        // Escuchar clics globales para mostrar u ocultar la barra flotante de tabla
        document.addEventListener('click', (e) => {
            if (window.isAuditMode) return;

            // Si el clic fue dentro de la barra flotante o del popover, no ocultar
            if (this.toolbarEl && this.toolbarEl.contains(e.target)) return;
            if (this.colorPopoverEl && this.colorPopoverEl.contains(e.target)) return;

            // Verificar si el cursor o clic está dentro de una celda de tabla en el editor
            const cell = e.target.closest && e.target.closest('.page-editor-surface td, .page-editor-surface th');
            if (cell) {
                const table = cell.closest('table');
                if (table) {
                    this.showToolbarFor(table, cell);
                    return;
                }
            }

            this.hideToolbar();
        });

        // Reposicionar en scroll o resize
        window.addEventListener('resize', () => {
            if (this.activeTable && this.toolbarEl && this.toolbarEl.style.display !== 'none') {
                this.updateToolbarPosition();
            }
        });

        document.querySelector('.editor-scroll-area')?.addEventListener('scroll', () => {
            if (this.activeTable && this.toolbarEl && this.toolbarEl.style.display !== 'none') {
                this.updateToolbarPosition();
            }
        });

        // Escuchar cambios de selección dentro del editor
        document.addEventListener('selectionchange', () => {
            if (window.isAuditMode) return;
            if (this._rafId) cancelAnimationFrame(this._rafId);
            this._rafId = requestAnimationFrame(() => {
                const sel = window.getSelection();
                if (!sel || sel.rangeCount === 0) return;
                const node = sel.anchorNode;
                if (!node) return;
                const el = node.nodeType === 3 ? node.parentElement : node;
                const cell = el ? el.closest('.page-editor-surface td, .page-editor-surface th') : null;
                if (cell) {
                    const table = cell.closest('table');
                    if (table) {
                        this.showToolbarFor(table, cell);
                        return;
                    }
                }
                // Si el foco se movió a otro elemento que no es la tabla ni sus controles
                if (!document.activeElement?.closest('#table-floating-toolbar, #table-color-popover')) {
                    if (this.toolbarEl && !this.toolbarEl.contains(document.activeElement)) {
                        this.hideToolbar();
                    }
                }
            });
        });
    },

    showToolbarFor(table, cell) {
        this.activeTable = table;
        this.activeCell = cell;
        if (!this.toolbarEl) return;

        this.toolbarEl.style.display = 'flex';
        this.updateToolbarPosition();
    },

    hideToolbar() {
        if (this.toolbarEl) {
            this.toolbarEl.style.display = 'none';
        }
        if (this.colorPopoverEl) {
            this.colorPopoverEl.style.display = 'none';
        }
        this.activeTable = null;
        this.activeCell = null;
    },

    updateToolbarPosition() {
        if (!this.activeTable || !this.toolbarEl || this.toolbarEl.style.display === 'none') return;
        const targetRect = (this.activeCell || this.activeTable).getBoundingClientRect();
        const tableRect = this.activeTable.getBoundingClientRect();
        const tbRect = this.toolbarEl.getBoundingClientRect();

        const tbW = tbRect.width || 380;
        const tbH = tbRect.height || 42;

        // Centrar horizontalmente respecto a la celda o la tabla
        let left = targetRect.left + (targetRect.width / 2) - (tbW / 2) + window.scrollX;
        
        // Mantener dentro de los bordes visibles de la ventana
        if (left < 12) left = 12;
        if (left + tbW > window.innerWidth - 12) {
            left = window.innerWidth - tbW - 12;
        }

        // Posicionar arriba de la tabla o celda
        let top = targetRect.top + window.scrollY - tbH - 8;

        // Si choca con el header superior fijo, ubicar debajo de la celda
        const topBar = document.querySelector('.sticky-fixed-controls, #editor-sticky-controls');
        const minTop = topBar ? (topBar.getBoundingClientRect().bottom + window.scrollY + 8) : (window.scrollY + 56);
        if (top < minTop) {
            top = targetRect.bottom + window.scrollY + 8;
        }

        this.toolbarEl.style.top = `${Math.round(top)}px`;
        this.toolbarEl.style.left = `${Math.round(left)}px`;
    },

    // ─── OPERACIONES DE FILAS ─────────────────────────────────────────────

    insertRowAbove() {
        if (!this.activeTable || window.isAuditMode) return;
        const currentCell = this.activeCell || this.activeTable.querySelector('td, th');
        const currentRow = currentCell ? currentCell.closest('tr') : this.activeTable.rows[0];
        if (!currentRow) return;

        const colCount = currentRow.children.length;
        const newRow = document.createElement('tr');
        for (let i = 0; i < colCount; i++) {
            const td = document.createElement('td');
            td.innerHTML = '<br>';
            newRow.appendChild(td);
        }

        currentRow.parentNode.insertBefore(newRow, currentRow);
        this.focusFirstCell(newRow);
        this.recordChange('Fila insertada arriba');
    },

    insertRowBelow() {
        if (!this.activeTable || window.isAuditMode) return;
        const currentCell = this.activeCell || this.activeTable.querySelector('td, th');
        const currentRow = currentCell ? currentCell.closest('tr') : this.activeTable.rows[this.activeTable.rows.length - 1];
        if (!currentRow) return;

        const colCount = currentRow.children.length;
        const newRow = document.createElement('tr');
        for (let i = 0; i < colCount; i++) {
            const td = document.createElement('td');
            td.innerHTML = '<br>';
            newRow.appendChild(td);
        }

        if (currentRow.nextSibling) {
            currentRow.parentNode.insertBefore(newRow, currentRow.nextSibling);
        } else {
            const tbody = this.activeTable.querySelector('tbody') || this.activeTable;
            tbody.appendChild(newRow);
        }

        this.focusFirstCell(newRow);
        this.recordChange('Fila insertada abajo');
    },

    deleteRow() {
        if (!this.activeTable || window.isAuditMode) return;
        const currentCell = this.activeCell || this.activeTable.querySelector('td, th');
        const currentRow = currentCell ? currentCell.closest('tr') : null;
        if (!currentRow) return;

        if (this.activeTable.rows.length <= 1) {
            this.deleteTable();
            return;
        }

        currentRow.remove();
        this.hideToolbar();
        this.recordChange('Fila eliminada');
    },

    // ─── OPERACIONES DE COLUMNAS ──────────────────────────────────────────

    insertColLeft() {
        if (!this.activeTable || window.isAuditMode) return;
        const currentCell = this.activeCell || this.activeTable.querySelector('td, th');
        const colIdx = currentCell ? currentCell.cellIndex : 0;

        Array.from(this.activeTable.rows).forEach((row) => {
            const isHeader = (row.parentElement && row.parentElement.tagName.toLowerCase() === 'thead') || row.firstElementChild?.tagName.toLowerCase() === 'th';
            const newCell = document.createElement(isHeader ? 'th' : 'td');
            newCell.innerHTML = isHeader ? 'Columna' : '<br>';

            if (colIdx >= 0 && row.children[colIdx]) {
                row.insertBefore(newCell, row.children[colIdx]);
            } else {
                row.insertBefore(newCell, row.firstChild);
            }
        });

        this.recordChange('Columna insertada a la izquierda');
    },

    insertColRight() {
        if (!this.activeTable || window.isAuditMode) return;
        const currentCell = this.activeCell || this.activeTable.querySelector('td, th');
        const colIdx = currentCell ? currentCell.cellIndex : this.activeTable.rows[0]?.children.length - 1;

        Array.from(this.activeTable.rows).forEach((row) => {
            const isHeader = (row.parentElement && row.parentElement.tagName.toLowerCase() === 'thead') || row.firstElementChild?.tagName.toLowerCase() === 'th';
            const newCell = document.createElement(isHeader ? 'th' : 'td');
            newCell.innerHTML = isHeader ? 'Columna' : '<br>';

            if (colIdx >= 0 && row.children[colIdx]) {
                row.insertBefore(newCell, row.children[colIdx].nextSibling);
            } else {
                row.appendChild(newCell);
            }
        });

        this.recordChange('Columna insertada a la derecha');
    },

    deleteCol() {
        if (!this.activeTable || window.isAuditMode) return;
        const currentCell = this.activeCell || this.activeTable.querySelector('td, th');
        if (!currentCell) return;
        const colIdx = currentCell.cellIndex;

        const rows = Array.from(this.activeTable.rows);
        if (rows[0] && rows[0].children.length <= 1) {
            this.deleteTable();
            return;
        }

        rows.forEach((row) => {
            if (row.children[colIdx]) {
                row.children[colIdx].remove();
            }
        });

        this.hideToolbar();
        this.recordChange('Columna eliminada');
    },

    // ─── ELIMINAR TABLA COMPLETA ──────────────────────────────────────────

    deleteTable() {
        if (!this.activeTable || window.isAuditMode) return;
        const table = this.activeTable;
        this.hideToolbar();
        table.remove();
        this.recordChange('Tabla eliminada');
    },

    // ─── ESTILOS Y FORMATO DE TABLA ────────────────────────────────────────

    cycleStyle() {
        if (!this.activeTable || window.isAuditMode) return;
        const styles = ['table-striped', 'table-bordered', 'table-minimal', 'table-borderless'];
        const styleNames = {
            'table-striped': 'Rayada (Striped)',
            'table-bordered': 'Cuadrícula Completa',
            'table-minimal': 'Minimalista (Líneas)',
            'table-borderless': 'Sin Bordes (Limpia)'
        };

        let currentIdx = -1;
        for (let i = 0; i < styles.length; i++) {
            if (this.activeTable.classList.contains(styles[i])) {
                currentIdx = i;
                break;
            }
        }

        // Remover todos los estilos anteriores
        styles.forEach(s => this.activeTable.classList.remove(s));

        // Siguiente estilo
        const nextIdx = (currentIdx + 1) % styles.length;
        const nextStyle = styles[nextIdx];
        this.activeTable.classList.add(nextStyle);

        // Si es borderless, limpiar inline borders que restrinjan
        if (nextStyle === 'table-borderless') {
            this.activeTable.style.border = 'none';
        } else {
            this.activeTable.style.border = '';
        }

        TextDocStateManager.showToast(`Estilo de Tabla: ${styleNames[nextStyle]}`);
        this.recordChange('Estilo de tabla cambiado');
    },

    toggleCellColorPopover(event) {
        if (!this.colorPopoverEl) return;
        if (this.colorPopoverEl.style.display === 'flex') {
            this.colorPopoverEl.style.display = 'none';
            return;
        }

        const btn = event.currentTarget || event.target;
        const rect = btn.getBoundingClientRect();

        this.colorPopoverEl.style.display = 'flex';
        this.colorPopoverEl.style.top = `${Math.round(rect.bottom + window.scrollY + 6)}px`;
        this.colorPopoverEl.style.left = `${Math.round(rect.left + window.scrollX - 60)}px`;
    },

    setCellColor(color) {
        if (!this.activeCell || window.isAuditMode) return;
        if (!color || color === 'transparent') {
            this.activeCell.style.backgroundColor = '';
        } else {
            this.activeCell.style.backgroundColor = color;
        }
        if (this.colorPopoverEl) this.colorPopoverEl.style.display = 'none';
        this.recordChange('Color de celda actualizado');
    },

    alignCell(alignment) {
        if (!this.activeCell || window.isAuditMode) return;
        this.activeCell.style.textAlign = alignment;
        this.recordChange(`Alineación de celda: ${alignment}`);
    },

    // ─── HELPERS AUXILIARES ───────────────────────────────────────────────

    focusFirstCell(row) {
        const firstCell = row.querySelector('td, th');
        if (firstCell) {
            const range = document.createRange();
            range.selectNodeContents(firstCell);
            range.collapse(true);
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(range);
            }
            this.activeCell = firstCell;
            this.updateToolbarPosition();
        }
    },

    recordChange(message) {
        TextDocStateManager.pushHistory();
        MultiPageEngine.debouncePaginate();
        TextDocStateManager.triggerAutoSave();
        if (message && typeof TextDocStateManager.showToast === 'function') {
            TextDocStateManager.showToast(message);
        }
    }
};


    /* ===================================================================
     * MODULO: templates.js
     * =================================================================== */
/**
 * templates.js — DocumentTemplates
 * Plantillas contables y legales salvadoreñas estructuradas con elementos 100% nativos
 * y editables del procesador de texto (sin hacks CSS inaccesibles ni guiones frágiles).
 * EduConta SV
 */



const DocumentTemplates = {
    templates: {
        carta_solicitud: () => {
            const fecha = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });
            return `
                <p style="text-align: right;"><strong>San Salvador, ${fecha}</strong></p>
                <p><br></p>
                <p>Señores:<br>
                <strong>FIRMA DE AUDITORES &amp; CONSULTORES, S.A. DE C.V.</strong><br>
                Presente.</p>
                <p><br></p>
                <p><strong>ASUNTO: Solicitud de Propuesta de Servicios de Auditoría Externa y Fiscal</strong></p>
                <p><br></p>
                <p>Estimados señores:</p>
                <p>Por medio de la presente, nos dirigimos a ustedes con el propósito de solicitarles formalmente una propuesta técnica y económica para la realización de la <strong>Auditoría Externa de Estados Financieros y Dictamen Fiscal</strong> correspondiente al ejercicio contable vigente de nuestra sociedad.</p>
                <p>Nuestra entidad se encuentra sujeta al cumplimiento de las Normas Internacionales de Información Financiera (NIIF) y las disposiciones vigentes del Código Tributario de El Salvador. Solicitamos incluir dentro de su propuesta el alcance del trabajo, cronograma preliminar de visitas y honorarios profesionales estimados.</p>
                <p>Agradeciendo de antemano su atención a la presente solicitud, quedamos atentos a su pronta comunicación.</p>
                <p><br></p>
                <p>Atentamente,</p>
                <div class="doc-signature-block" style="margin-top: 48px;">
                    <div style="display: block; width: 280px; text-align: left;">
                        <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 100%; margin-bottom: 6px;"></div>
                        <p style="margin: 0; font-weight: 700;">Representante Legal / Gerente General</p>
                        <p style="margin: 0; font-size: 0.85em; color: #64748b;">EduConta SV S.A. de C.V.</p>
                    </div>
                </div>
            `;
        },

        memorando: () => {
            const fecha = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });
            return `
                <h2 style="text-align: center; margin-bottom: 6px;">MEMORANDO INTERNO</h2>
                <hr class="doc-accent-rule">
                <p><br></p>
                <table class="table-borderless" style="width: 100%; border: none; margin-bottom: 16px;">
                    <tbody>
                        <tr><td style="border: none; width: 15%; padding: 4px 6px;"><strong>DE:</strong></td><td style="border: none; padding: 4px 6px;">Gerencia Financiera y Administrativa</td></tr>
                        <tr><td style="border: none; width: 15%; padding: 4px 6px;"><strong>PARA:</strong></td><td style="border: none; padding: 4px 6px;">Equipo de Contabilidad, Tesorería y Bodega</td></tr>
                        <tr><td style="border: none; width: 15%; padding: 4px 6px;"><strong>FECHA:</strong></td><td style="border: none; padding: 4px 6px;">${fecha}</td></tr>
                        <tr><td style="border: none; width: 15%; padding: 4px 6px;"><strong>ASUNTO:</strong></td><td style="border: none; padding: 4px 6px;"><strong>Instrucciones para el Cierre Contable Mensual y Arqueos</strong></td></tr>
                    </tbody>
                </table>
                <hr>
                <p>Estimado equipo:</p>
                <p>Por medio del presente memorando se establecen las directrices obligatorias para la ejecución del cierre contable del presente período:</p>
                <ul>
                    <li><strong>Conciliaciones Bancarias:</strong> Deberán quedar cuadradas y firmadas antes del día 5 hábil posterior al cierre.</li>
                    <li><strong>Toma Física de Inventarios:</strong> El conteo físico en bodega central se llevará a cabo el último día hábil a partir de las 16:00 horas.</li>
                    <li><strong>Cuentas por Cobrar y Pagar:</strong> Remitir informe de antigüedades de saldos a la Gerencia Financiera.</li>
                    <li><strong>Declaraciones Tributarias:</strong> Preparación del F-07 (IVA y Pago a Cuenta) y F-14 para revisión previa.</li>
                </ul>
                <p>Agradecemos su compromiso y puntualidad en el cumplimiento de estas disposiciones.</p>
            `;
        },

        contrato_servicios: () => {
            return `
                <h2 style="text-align: center; margin-bottom: 6px;">CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES CONTABLES</h2>
                <hr class="doc-accent-rule">
                <p><br></p>
                <p>Nosotros, por una parte <strong>[NOMBRE DE LA EMPRESA CLIENTE]</strong>, sociedad constituida bajo las leyes de El Salvador, que en adelante se denominará <strong>"EL CONTRATANTE"</strong>; y por otra parte <strong>[NOMBRE DEL PROFESIONAL CONTABLE]</strong>, Contador Público Autorizado, que en adelante se denominará <strong>"EL CONTRATISTA"</strong>, convenimos celebrar el presente contrato sujeto a las siguientes cláusulas:</p>
                <p><br></p>
                <p><strong>PRIMERA: OBJETO DEL CONTRATO.</strong> El Contratista se compromete a prestar sus servicios profesionales independientes de teneduría de libros contables (Diario, Mayor, Estados Financieros y Registros del IVA) cumpliendo con las NIIF y la legislación tributaria y mercantil de El Salvador.</p>
                <p><strong>SEGUNDA: HONORARIOS Y FORMA DE PAGO.</strong> El Contratante pagará al Contratista la suma mensual de <strong>$[MONTO] DÓLARES</strong> de los Estados Unidos de América. Se aplicará la retención del <strong>10% en concepto de Impuesto sobre la Renta (ISR)</strong> de conformidad al Artículo 156 del Código Tributario.</p>
                <p><strong>TERCERA: CONFIDENCIALIDAD.</strong> El Contratista guardará estricto secreto profesional respecto a toda la información contable, financiera y tributaria a la que tenga acceso.</p>
                <p><strong>CUARTA: PLAZO.</strong> El presente contrato tendrá una vigencia de un año calendario a partir de su firma.</p>
                <p><br></p>
                <table class="table-borderless doc-signature-table" style="width: 100%; border: none; margin-top: 48px;">
                    <tbody>
                        <tr>
                            <td style="width: 48%; text-align: center; border: none; padding: 0 12px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 240px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">EL CONTRATANTE</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Firma y Sello</p>
                            </td>
                            <td style="width: 4%; border: none;"></td>
                            <td style="width: 48%; text-align: center; border: none; padding: 0 12px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 240px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">EL CONTRATISTA</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Firma y Sello</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        },

        acta_junta: () => {
            const fecha = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });
            return `
                <h2 style="text-align: center; margin-bottom: 6px;">ACTA NÚMERO DIEZ: JUNTA GENERAL ORDINARIA DE ACCIONISTAS</h2>
                <hr class="doc-accent-rule">
                <p><br></p>
                <p>En la ciudad de San Salvador, a las diez horas del día <strong>${fecha}</strong>, reunidos en la sede social de <strong>[NOMBRE DE LA SOCIEDAD, S.A. DE C.V.]</strong>, los accionistas que representan el cien por ciento del capital social suscrito y pagado, se procedió a desarrollar la siguiente agenda:</p>
                <ol>
                    <li>Comprobación del quórum legal y apertura de la sesión.</li>
                    <li>Lectura y aprobación de la Memoria de Labores de la Administración.</li>
                    <li>Aprobación del Balance General y Estado de Resultados del ejercicio finalizado.</li>
                    <li>Destino de las utilidades y reserva legal.</li>
                    <li>Nombramiento de Auditor Externo y Fiscal.</li>
                </ol>
                <p><br></p>
                <p><strong>ACUERDO PRIMERO:</strong> Se aprueban por unanimidad los Estados Financieros presentados por la administración.</p>
                <p><strong>ACUERDO SEGUNDO:</strong> Se acuerda aplicar el siete por ciento (7%) a la Reserva Legal y distribuir el remanente en concepto de dividendos a los accionistas.</p>
                <p><br></p>
                <div class="doc-signature-block" style="margin-top: 48px; text-align: center;">
                    <div style="display: inline-block; width: 300px; text-align: center;">
                        <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 100%; margin-bottom: 6px;"></div>
                        <p style="margin: 0; font-weight: 700;">Presidente y Secretario de la Junta</p>
                    </div>
                </div>
            `;
        },

        dictamen_auditoria: () => {
            return `
                <h2 style="text-align: center; margin-bottom: 6px;">INFORME DEL AUDITOR INDEPENDIENTE</h2>
                <hr class="doc-accent-rule">
                <p><br></p>
                <p>A los Accionistas y Junta Directiva de:<br>
                <strong>[NOMBRE DE LA SOCIEDAD], S.A. DE C.V.</strong></p>
                <p><br></p>
                <p><strong>Opinión Favorable (Limpia)</strong></p>
                <p>Hemos auditado los estados financieros adjuntos de la sociedad, que comprenden el Estado de Situación Financiera al 31 de diciembre, el Estado de Resultados Integral, el Estado de Cambios en el Patrimonio y el Estado de Flujos de Efectivo correspondientes al ejercicio terminado en dicha fecha, así como un resumen de las políticas contables significativas.</p>
                <p>En nuestra opinión, los estados financieros adjuntos presentan razonablemente, en todos los aspectos materiales, la situación financiera de la entidad, así como sus resultados y flujos de efectivo de conformidad con las Normas Internacionales de Información Financiera (NIIF para las PYMES) y la normativa del Consejo de Vigilancia de la Profesión de Contaduría Pública y Auditoría (CVPCPA) de El Salvador.</p>
                <p><br></p>
                <p><strong>Fundamento de la Opinión</strong></p>
                <p>Hemos llevado a cabo nuestra auditoría de conformidad con las Normas Internacionales de Auditoría (NIA). Nuestras responsabilidades se describen con mayor detalle en la sección <em>Responsabilidades del auditor</em> de nuestro informe.</p>
                <div class="doc-signature-block" style="margin-top: 48px;">
                    <div style="display: block; width: 280px; text-align: left;">
                        <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 100%; margin-bottom: 6px;"></div>
                        <p style="margin: 0; font-weight: 700;">Auditor Externo Autorizado</p>
                        <p style="margin: 0; font-size: 0.85em; color: #64748b;">Registro CVPCPA No. [XXXX]</p>
                    </div>
                </div>
            `;
        },

        acta_recepcion: () => {
            const fecha = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });
            return `
                <h2 style="text-align: center; margin-bottom: 6px;">ACTA DE RECEPCIÓN Y CONFORMIDAD DE BIENES (BTVAC 1.2 / 1.5)</h2>
                <hr class="doc-accent-rule">
                <p style="text-align: right; margin-top: 8px;"><strong>Acta N.°:</strong> ARB-${new Date().getFullYear()}-0042 &nbsp;|&nbsp; <strong>Fecha:</strong> ${fecha}</p>
                <table class="table-bordered" style="width: 100%; margin-top: 12px; font-size: 11pt;">
                    <tbody>
                        <tr>
                            <td><strong>Proveedor:</strong></td>
                            <td>[NOMBRE DEL PROVEEDOR, S.A. DE C.V.]</td>
                            <td><strong>N.° CCF / Factura:</strong></td>
                            <td>CCF-001294</td>
                        </tr>
                        <tr>
                            <td><strong>N.° Orden de Compra:</strong></td>
                            <td>OC-${new Date().getFullYear()}-0018</td>
                            <td><strong>Bodega Destino:</strong></td>
                            <td>Bodega Central de Materias Primas</td>
                        </tr>
                    </tbody>
                </table>
                <p><br></p>
                <p>En las instalaciones de la empresa se procede a la inspección física, verificación técnica y control de calidad de los bienes remitidos según el siguiente detalle:</p>
                <table class="table-striped" style="width: 100%; text-align: center; font-size: 10.5pt;">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th style="text-align: left;">Descripción del Artículo</th>
                            <th>Cant. Doc.</th>
                            <th>Cant. Recibida</th>
                            <th>Estado Físico</th>
                            <th>Resultado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>MP-0101</td>
                            <td style="text-align: left;">Resmas de Papel Bond Base 20 Carta</td>
                            <td>100</td>
                            <td>100</td>
                            <td>Óptimo / Sellado</td>
                            <td><span class="doc-badge doc-badge-emerald">CONFORME</span></td>
                        </tr>
                        <tr>
                            <td>MP-0102</td>
                            <td style="text-align: left;">Tóner Negro de Alta Capacidad Modelo X</td>
                            <td>10</td>
                            <td>10</td>
                            <td>Empaque Original</td>
                            <td><span class="doc-badge doc-badge-emerald">CONFORME</span></td>
                        </tr>
                    </tbody>
                </table>
                <p><br></p>
                <p><strong>Observaciones:</strong> La mercadería cumple satisfactoriamente con las especificaciones técnicas requeridas. Se autoriza el ingreso en el sistema de Kardex y se remite el Comprobante de Crédito Fiscal al Departamento de Contabilidad para su registro y programación de pago.</p>
                <table class="table-borderless doc-signature-table" style="width: 100%; border: none; margin-top: 48px;">
                    <tbody>
                        <tr>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Encargado(a) de Bodega</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Recepción y Custodia</p>
                            </td>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Control de Calidad</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Inspección Técnica</p>
                            </td>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Entregado por Proveedor</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Firma y Sello</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        },

        requisicion_bodega: () => {
            const fecha = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });
            return `
                <h2 style="text-align: center; margin-bottom: 6px;">REQUISICIÓN Y SOLICITUD DE MATERIALES A BODEGA</h2>
                <hr class="doc-accent-rule">
                <p style="text-align: right; margin-top: 8px;"><strong>Requisición N.°:</strong> REQ-${new Date().getFullYear()}-0105 &nbsp;|&nbsp; <strong>Fecha:</strong> ${fecha}</p>
                <table class="table-bordered" style="width: 100%; margin-top: 12px; font-size: 11pt;">
                    <tbody>
                        <tr>
                            <td><strong>Centro de Costo / Área:</strong></td>
                            <td>Departamento de Producción / Fabricación</td>
                            <td><strong>Orden de Trabajo:</strong></td>
                            <td>OT-Lote-45</td>
                        </tr>
                        <tr>
                            <td><strong>Solicitante:</strong></td>
                            <td>Jefe de Producción / Supervisor</td>
                            <td><strong>Fecha Requerida:</strong></td>
                            <td>Inmediata</td>
                        </tr>
                    </tbody>
                </table>
                <p><br></p>
                <table class="table-striped" style="width: 100%; text-align: center; font-size: 10.5pt;">
                    <thead>
                        <tr>
                            <th>Ítem</th>
                            <th>Código</th>
                            <th style="text-align: left;">Descripción del Material</th>
                            <th>Cant. Solicitada</th>
                            <th>Cant. Despachada</th>
                            <th>Costo Unit.</th>
                            <th>Total Estimado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>MP-0210</td>
                            <td style="text-align: left;">Materia Prima A (Uso directo en ensamble)</td>
                            <td>50 Unidades</td>
                            <td>50 Unidades</td>
                            <td>$12.50</td>
                            <td>$625.00</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>MAT-008</td>
                            <td style="text-align: left;">Insumos auxiliares de embalaje</td>
                            <td>20 Rollos</td>
                            <td>20 Rollos</td>
                            <td>$3.75</td>
                            <td>$75.00</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr style="font-weight: bold;">
                            <td colspan="6" style="text-align: right;">TOTAL MATERIA PRIMA DESPACHADA:</td>
                            <td style="color: #0284c7;">$700.00</td>
                        </tr>
                    </tfoot>
                </table>
                <p><br></p>
                <p><em>Constancia: La bodega central descargará de inmediato del inventario las cantidades antes detalladas mediante el método de valuación vigente (PEPS o Promedio Ponderado).</em></p>
                <table class="table-borderless doc-signature-table" style="width: 100%; border: none; margin-top: 48px;">
                    <tbody>
                        <tr>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Solicitado por</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Jefatura de Área</p>
                            </td>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Autorizado por</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Gerencia de Operaciones</p>
                            </td>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Despachado por Bodega</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Descargo Kardex Efectuado</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        },

        contrato_trabajo_sv: () => {
            const fecha = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });
            return `
                <h2 style="text-align: center; margin-bottom: 6px;">CONTRATO INDIVIDUAL DE TRABAJO A PLAZO INDEFINIDO</h2>
                <hr class="doc-accent-rule">
                <p style="text-align: center; font-size: 10pt; color: #475569;">(Formulado conforme al Artículo 23 y siguientes del Código de Trabajo de la República de El Salvador)</p>
                <p><br></p>
                <p>Nosotros, por una parte <strong>[NOMBRE DEL REPRESENTANTE LEGAL]</strong>, de [EDAD] años de edad, [PROFESIÓN U OFICIO], del domicilio de [CIUDAD/DEPARTAMENTO], portador de mi Documento Único de Identidad número [DUI-PATRONO], actuando en mi calidad de Representante Legal de la entidad <strong>[NOMBRE DE LA EMPRESA / SOCIEDAD], S.A. DE C.V.</strong>, con Número de Identificación Tributaria [NIT-EMPRESA], que en lo sucesivo se denominará <strong>"EL PATRONO"</strong>; y por otra parte <strong>[NOMBRE COMPLETO DEL TRABAJADOR]</strong>, de [EDAD] años de edad, de sexo [MASCULINO/FEMENINO], estado familiar [SOLTERO(A)/CASADO(A)], de profesión u oficio [PROFESIÓN], del domicilio de [CIUDAD/DEPARTAMENTO], con Documento Único de Identidad número [DUI-TRABAJADOR], y con Número de Identificación Tributaria [NIT-TRABAJADOR], que en lo sucesivo se denominará <strong>"EL TRABAJADOR"</strong>, convenimos en celebrar el presente Contrato Individual de Trabajo sujeto a las estipulaciones siguientes:</p>
                <p><br></p>
                <p><strong>I. CLASE DE TRABAJO O SERVICIO:</strong> El Trabajador se compromete a prestar sus servicios personales como <strong>AUXILIAR CONTABLE / ADMINISTRATIVO</strong>, realizando las labores de registro de partidas en libros contables, conciliaciones bancarias, control de inventarios Kardex, arqueos de caja y apoyo en declaraciones tributarias.</p>
                <p><strong>II. LUGAR DE PRESTACIÓN DE SERVICIOS:</strong> Los servicios se prestarán en las instalaciones principales de la empresa ubicadas en [DIRECCIÓN COMPLETA DE LA OFICINA O SUCURSAL], El Salvador.</p>
                <p><strong>III. DURACIÓN DEL CONTRATO Y PERÍODO DE PRUEBA:</strong> El presente contrato se celebra por <strong>TIEMPO INDEFINIDO</strong>. Se estipula un período de prueba de <strong>treinta días</strong> de conformidad al Artículo 28 del Código de Trabajo.</p>
                <p><strong>IV. HORARIO Y JORNADA DE TRABAJO:</strong> La jornada ordinaria semanal será de <strong>cuarenta y cuatro horas diurnas</strong>, distribuidas de lunes a viernes de las 8:00 a las 17:00 horas con una hora para tomar alimentos y descanso, y sábados de las 8:00 a las 12:00 horas, respetando los límites del Artículo 161 del Código de Trabajo.</p>
                <p><strong>V. SALARIO, FORMA Y LUGAR DE PAGO:</strong> El salario acordado es de <strong>$[MONTO DEVENGADO] DÓLARES</strong> de los Estados Unidos de América por mes calendario, pagaderos quincenalmente en días 15 y último de cada mes mediante transferencia bancaria. Sobre dicho salario se aplicarán estrictamente las deducciones legales obligatorias de El Salvador:
                    <ul>
                        <li><strong>ISSS (Salud):</strong> 3.0% laboral (con el tope máximo legal de cotización de $1,000.00).</li>
                        <li><strong>AFP (Pensión):</strong> 7.25% laboral de conformidad a la Ley del Sistema de Pensiones.</li>
                        <li><strong>Impuesto sobre la Renta (ISR):</strong> Tabla de retención oficial mensual emitida por el Ministerio de Hacienda (Decreto No. 10).</li>
                    </ul>
                </p>
                <p><strong>VI. PRESTACIONES DE LEY:</strong> El Patrono reconoce el pago de <strong>Vacación Anual Remunerada</strong> de 15 días continuos con el 30% de recargo de conformidad al Artículo 177 del Código de Trabajo, y el pago de <strong>Aguinaldo Anual</strong> según los años de servicio continuo en cumplimiento de los Artículos 196 y siguientes del Código de Trabajo.</p>
                <p><strong>VII. OBLIGACIONES Y PROHIBICIONES:</strong> Ambas partes se comprometen a respetar las obligaciones y prohibiciones señaladas en el Código de Trabajo y el Reglamento Interno de Trabajo de la empresa.</p>
                <p><br></p>
                <p>En fe de lo acordado, se firman dos ejemplares de igual valor legal en la ciudad de San Salvador, a los ${fecha}.</p>
                <table class="table-borderless doc-signature-table" style="width: 100%; border: none; margin-top: 48px;">
                    <tbody>
                        <tr>
                            <td style="width: 48%; text-align: center; border: none; padding: 0 12px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 240px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">POR EL PATRONO</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Representante Legal / Apoderado</p>
                            </td>
                            <td style="width: 4%; border: none;"></td>
                            <td style="width: 48%; text-align: center; border: none; padding: 0 12px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 240px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">EL TRABAJADOR</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">DUI: ________________________</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        },

        solicitud_cotizacion: () => {
            const fecha = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });
            return `
                <h2 style="text-align: center; margin-bottom: 6px;">SOLICITUD FORMAL DE COTIZACIÓN COMERCIAL (BTVAC 1.2)</h2>
                <hr class="doc-accent-rule">
                <p style="text-align: right; margin-top: 8px;"><strong>SC-N.°:</strong> COT-${new Date().getFullYear()}-0089 &nbsp;|&nbsp; <strong>Fecha:</strong> ${fecha}</p>
                <table class="table-bordered" style="width: 100%; margin-top: 12px; font-size: 11pt;">
                    <tbody>
                        <tr>
                            <td><strong>Señores Proveedores:</strong></td>
                            <td>[NOMBRE DE LA CASA COMERCIAL / DISTRIBUIDOR]</td>
                            <td><strong>Atención:</strong></td>
                            <td>Departamento de Ventas Corporativas</td>
                        </tr>
                        <tr>
                            <td><strong>Empresa Solicitante:</strong></td>
                            <td>EduConta SV S.A. de C.V. (Gran Contribuyente)</td>
                            <td><strong>Plazo de Oferta:</strong></td>
                            <td>Vigencia mínima 30 días</td>
                        </tr>
                    </tbody>
                </table>
                <p><br></p>
                <p>Agradeceremos presentarnos su mejor oferta económica y condiciones de entrega para el suministro de los siguientes bienes:</p>
                <table class="table-striped" style="width: 100%; text-align: center; font-size: 10.5pt;">
                    <thead>
                        <tr>
                            <th>Renglón</th>
                            <th style="text-align: left;">Descripción y Especificaciones Técnicas</th>
                            <th>Cantidad</th>
                            <th>Precio Unit. (Sin IVA)</th>
                            <th>IVA (13%)</th>
                            <th>Precio Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>01</td>
                            <td style="text-align: left;">Computadoras de Escritorio Core i5, 16GB RAM, 512GB SSD para área contable</td>
                            <td>5 Equipos</td>
                            <td>[A cotizar]</td>
                            <td>[A cotizar]</td>
                            <td>[A cotizar]</td>
                        </tr>
                        <tr>
                            <td>02</td>
                            <td style="text-align: left;">Impresoras Multifuncionales Láser de Alto Rendimiento con escáner dúplex</td>
                            <td>2 Equipos</td>
                            <td>[A cotizar]</td>
                            <td>[A cotizar]</td>
                            <td>[A cotizar]</td>
                        </tr>
                    </tbody>
                </table>
                <p><br></p>
                <p><strong>Condiciones indispensables para la cotización:</strong></p>
                <ol>
                    <li>Presentar precios desglosando el 13% de IVA en Comprobante de Crédito Fiscal (CCF).</li>
                    <li>Indicar tiempo de entrega en días hábiles y período de garantía técnica por escrito (mínimo 1 año).</li>
                    <li>Términos de crédito: Crédito comercial a 30 días fecha de emisión del CCF.</li>
                </ol>
                <table class="table-borderless doc-signature-table" style="width: 100%; border: none; margin-top: 48px;">
                    <tbody>
                        <tr>
                            <td style="width: 48%; text-align: center; border: none; padding: 0 12px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 240px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Unidad de Adquisiciones y Compras</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">EduConta SV S.A. de C.V.</p>
                            </td>
                            <td style="width: 4%; border: none;"></td>
                            <td style="width: 48%; text-align: center; border: none; padding: 0 12px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 240px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Gerencia Administrativa y Financiera</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Vo.Bo. Presupuestario</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        }
    },

    load(type) {
        if (!this.templates[type]) return;
        if (confirm('¿Deseas insertar esta plantilla? Se cargará en el documento.')) {
            const html = this.templates[type]();
            MultiPageEngine.loadContent(html);
            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            TextDocStateManager.triggerAutoSave();
            TextDocStateManager.showToast('Plantilla cargada con éxito');
        }
    }
};


    /* ===================================================================
     * MODULO: find-replace.js
     * =================================================================== */
/**
 * find-replace.js — FindReplaceManager
 * Motor de búsqueda y reemplazo con resaltado de coincidencias.
 * EduConta SV
 */



    const FindReplaceManager = {
        matches: [],
        currentIndex: -1,

        openModal() {
            const modal = document.getElementById('find-replace-modal');
            if (modal) {
                modal.style.display = 'flex';
                setTimeout(() => document.getElementById('find-input-query')?.focus(), 80);
            }
        },

        closeModal() {
            const modal = document.getElementById('find-replace-modal');
            if (modal) modal.style.display = 'none';
            this.clearHighlights();
        },

        handleSearchInput() {
            const query = document.getElementById('find-input-query')?.value || '';
            const countEl = document.getElementById('find-matches-count');
            this.clearHighlights();

            if (!query.trim()) {
                if (countEl) countEl.textContent = '0 coincidencias';
                return;
            }

            this.highlightText(query);
            const total = this.matches.length;
            if (countEl) countEl.textContent = `${total} coincidencia${total === 1 ? '' : 's'}`;
        },

        highlightText(query) {
            this.matches = [];
            this.currentIndex = -1;
            const editors = MultiPageEngine.getAllEditors();
            if (editors.length === 0) return;

            const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');

            const walkTextNodes = (node) => {
                if (node.nodeType === 3) {
                    if (regex.test(node.nodeValue)) {
                        const span = document.createElement('span');
                        span.innerHTML = node.nodeValue.replace(regex, '<mark class="find-match">$1</mark>');
                        node.parentNode.replaceChild(span, node);
                    }
                } else if (node.nodeType === 1 && !node.classList.contains('find-match')) {
                    Array.from(node.childNodes).forEach(walkTextNodes);
                }
            };

            editors.forEach(ed => {
                Array.from(ed.childNodes).forEach(walkTextNodes);
            });

            this.matches = Array.from(document.querySelectorAll('.find-match'));
        },

        clearHighlights() {
            document.querySelectorAll('.find-match').forEach(m => {
                const parent = m.parentNode;
                if (parent) {
                    parent.replaceChild(document.createTextNode(m.textContent), m);
                    parent.normalize();
                }
            });
            this.matches = [];
            this.currentIndex = -1;
        },

        replaceNext() {
            const query = document.getElementById('find-input-query')?.value || '';
            const replacement = document.getElementById('find-input-replace')?.value || '';
            if (!query) return;

            const editors = MultiPageEngine.getAllEditors();
            const regex = new RegExp(this.escapeRegExp(query), 'i');

            for (const ed of editors) {
                if (regex.test(ed.innerHTML)) {
                    ed.innerHTML = ed.innerHTML.replace(regex, replacement);
                    break;
                }
            }

            this.handleSearchInput();
            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            MultiPageEngine.debouncePaginate();
        },

        replaceAll() {
            const query = document.getElementById('find-input-query')?.value || '';
            const replacement = document.getElementById('find-input-replace')?.value || '';
            if (!query) return;

            this.clearHighlights();
            const regex = new RegExp(this.escapeRegExp(query), 'gi');
            const editors = MultiPageEngine.getAllEditors();

            editors.forEach(ed => {
                ed.innerHTML = ed.innerHTML.replace(regex, replacement);
            });

            this.handleSearchInput();
            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            MultiPageEngine.paginate();
            TextDocStateManager.showToast('Reemplazo completado');
        },

        escapeRegExp(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
    };


    /* ===================================================================
     * MODULO: toc.js
     * =================================================================== */
/**
 * toc.js — TableOfContentsManager
 * Generación de tabla de contenidos (TOC) desde h1/h2/h3.
 * EduConta SV
 */


    const TableOfContentsManager = {
        insertOrUpdateTOC() {
            const editors = MultiPageEngine.getAllEditors();
            if (editors.length === 0) return;

            const headings = [];
            editors.forEach(ed => {
                ed.querySelectorAll('h1, h2, h3').forEach(h => headings.push(h));
            });

            if (headings.length === 0) {
                alert('No se encontraron títulos (H1, H2 o H3) para generar el índice.');
                return;
            }

            const tocContainer = document.createElement('div');
            tocContainer.className = 'toc-block';
            tocContainer.setAttribute('contenteditable', 'false');

            let html = '<div class="toc-title">ÍNDICE DE CONTENIDOS</div>';
            headings.forEach((h, idx) => {
                const level = h.tagName.toLowerCase() === 'h1' ? 1 : h.tagName.toLowerCase() === 'h2' ? 2 : 3;
                const text = h.textContent.trim() || `Sección ${idx + 1}`;
                const anchorId = `heading-sec-${idx + 1}`;
                h.id = anchorId;
                html += `<a href="#${anchorId}" class="toc-link toc-level-${level}">${text}</a>`;
            });
            tocContainer.innerHTML = html;

            const existingTOC = document.querySelector('.toc-block');
            if (existingTOC) {
                existingTOC.replaceWith(tocContainer);
                TextDocStateManager.showToast('Tabla de contenidos actualizada');
            } else {
                const firstEditor = editors[0];
                if (firstEditor) {
                    firstEditor.insertBefore(tocContainer, firstEditor.firstChild);
                    TextDocStateManager.showToast('Tabla de contenidos insertada');
                }
            }

            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
        }
    };


    /* ===================================================================
     * MODULO: spellcheck.js
     * =================================================================== */
/**
 * spellcheck.js — SpellCheckManager
 * Motor completo de Corrección Ortográfica y Gramatical Bilingüe (Español e Inglés)
 * Ignora el idioma del navegador y previene falsos positivos por configuraciones en inglés.
 * EduConta SV — ES Module
 */




const STORAGE_KEY_CONFIG = 'educonta_spellcheck_config';
const STORAGE_KEY_USER_WORDS = 'educonta_user_words';
const SpellCheckManager = {
    // Configuración activa
    language: 'es',            // 'es' | 'en' | 'bilingual'
    browserSpellcheck: false,  // false por defecto para evitar marcas rojas de navegadores en inglés
    liveHighlight: false,      // Subrayado en vivo inteligente de EduConta

    // Diccionario personalizado y palabras ignoradas en la sesión
    userDictionary: new Set(),
    ignoredWords: new Set(),

    // Estado del asistente de revisión
    currentIssues: [],
    currentIssueIndex: -1,
    activeHighlightNode: null,

    // Inicialización
    init() {
        this.loadSettings();
        this.loadUserDictionary();
        this.applyToAllSurfaces();
        this.updateStatusPillUI();
        this.bindGlobalShortcuts();
        this.bindOutsideClickEvents();
    },

    // Cargar configuración guardada
    loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
            if (raw) {
                const cfg = JSON.parse(raw);
                if (cfg.language) this.language = cfg.language;
                if (typeof cfg.browserSpellcheck === 'boolean') this.browserSpellcheck = cfg.browserSpellcheck;
                if (typeof cfg.liveHighlight === 'boolean') this.liveHighlight = cfg.liveHighlight;
            }
        } catch (e) {
            console.warn('Error cargando configuración de ortografía:', e);
        }
    },

    saveSettings() {
        try {
            const cfg = {
                language: this.language,
                browserSpellcheck: this.browserSpellcheck,
                liveHighlight: this.liveHighlight
            };
            localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
        } catch (e) {
            console.warn('Error guardando configuración de ortografía:', e);
        }
    },

    // Cargar palabras del usuario
    loadUserDictionary() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_USER_WORDS);
            if (raw) {
                const words = JSON.parse(raw);
                if (Array.isArray(words)) {
                    words.forEach(w => this.userDictionary.add(w.toLowerCase()));
                }
            }
        } catch (e) {
            this.userDictionary = new Set();
        }
    },

    saveUserDictionary() {
        try {
            const arr = Array.from(this.userDictionary);
            localStorage.setItem(STORAGE_KEY_USER_WORDS, JSON.stringify(arr));
        } catch (e) {
            console.warn('Error guardando diccionario personal:', e);
        }
    },

    getLangCode() {
        if (this.language === 'en') return 'en';
        if (this.language === 'bilingual') return 'es-SV, en';
        return 'es';
    },

    getLanguageLabel() {
        if (this.language === 'en') return 'English (EN)';
        if (this.language === 'bilingual') return 'Bilingüe (ES + EN)';
        return 'Español (ES)';
    },

    // Aplicar atributos a todas las páginas de edición
    applyToAllSurfaces() {
        const editors = MultiPageEngine.getAllEditors();
        const langCode = this.getLangCode();
        const spellAttr = this.browserSpellcheck ? 'true' : 'false';

        editors.forEach(ed => {
            ed.setAttribute('spellcheck', spellAttr);
            ed.setAttribute('lang', langCode);
        });

        document.documentElement.lang = this.language === 'en' ? 'en' : 'es';
        this.updateStatusPillUI();
    },

    // Actualizar indicador en barra de estado inferior
    updateStatusPillUI() {
        const pillText = document.getElementById('doc-lang-pill-text');
        const statusDot = document.getElementById('doc-spellcheck-status-dot');

        if (pillText) {
            if (this.language === 'en') pillText.textContent = 'English';
            else if (this.language === 'bilingual') pillText.textContent = 'Bilingüe';
            else pillText.textContent = 'Español';
        }

        if (statusDot) {
            if (this.browserSpellcheck) {
                statusDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500';
                statusDot.title = 'Corrector del navegador activo';
            } else {
                statusDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-500';
                statusDot.title = 'Corrector EduConta SV activo (Navegador silenciado)';
            }
        }
    },

    // Atajo global de teclado F7 (estándar en Word / Google Docs / Office)
    bindGlobalShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F7' || e.code === 'F7') {
                e.preventDefault();
                this.openAssistant();
            }
        });
    },

    // Cerrar popovers al hacer clic fuera
    bindOutsideClickEvents() {
        document.addEventListener('click', (e) => {
            const popover = document.getElementById('popover-spellcheck-config');
            const btnPill = document.getElementById('btn-doc-lang-pill');
            if (popover && !popover.classList.contains('hidden')) {
                if (!popover.contains(e.target) && !btnPill?.contains(e.target)) {
                    this.closeConfigPopover();
                }
            }
        });
    },

    // ── VALIDACIÓN DE PALABRA INDIVIDUAL ──────────────────────────────────────
    checkWord(rawWord) {
        if (!rawWord) return true;

        // Limpiar signos de puntuación iniciales y finales
        const clean = rawWord.trim().replace(/^[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+|[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/g, '');
        if (!clean || clean.length < 2) return true;

        // Ignorar números puros, porcentajes, montos en moneda ($100.50)
        if (/^\d+([.,]\d+)*%?$/.test(clean)) return true;

        // Ignorar siglas con puntos o mayúsculas de 2-4 letras (ej. S.A., DTE, IVA, ISSS, AFP, CNR, US$)
        if (/^[A-ZÁÉÍÓÚÑ]{1,5}$/.test(clean)) return true;
        if (/^([A-ZÁÉÍÓÚÑ]\.)+$/.test(clean)) return true;

        const lower = clean.toLowerCase();

        // 1. Verificar si está en palabras ignoradas de esta sesión
        if (this.ignoredWords.has(lower)) return true;

        // 2. Verificar diccionario personal del usuario
        if (this.userDictionary.has(lower)) return true;

        // 3. Verificar según el idioma activo
        if (this.language === 'es') {
            return isSpanishWord(clean);
        } else if (this.language === 'en') {
            return isEnglishWord(clean);
        } else if (this.language === 'bilingual') {
            // Acepta si es correcta en Español O en Inglés
            return isSpanishWord(clean) || isEnglishWord(clean);
        }

        return true;
    },

    // ── ESCANEO COMPLETO DEL DOCUMENTO ────────────────────────────────────────
    scanDocument() {
        this.clearActiveHighlight();
        this.currentIssues = [];
        this.currentIssueIndex = -1;

        const editors = MultiPageEngine.getAllEditors();
        if (editors.length === 0) return [];

        const wordRegex = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+/g;

        editors.forEach((ed, pageIdx) => {
            const walkTextNodes = (node) => {
                if (node.nodeType === 3) { // Nodo de texto
                    const text = node.nodeValue;
                    if (!text || !text.trim()) return;

                    let match;
                    wordRegex.lastIndex = 0;
                    while ((match = wordRegex.exec(text)) !== null) {
                        const word = match[0];
                        const offset = match.index;

                        if (!this.checkWord(word)) {
                            // Extraer un fragmento de contexto (snippet) de 30 caracteres antes y después
                            const startContext = Math.max(0, offset - 35);
                            const endContext = Math.min(text.length, offset + word.length + 35);
                            const before = text.substring(startContext, offset);
                            const after = text.substring(offset + word.length, endContext);

                            const suggestions = getSmartSuggestions(word, this.language);

                            this.currentIssues.push({
                                word,
                                textNode: node,
                                offset,
                                length: word.length,
                                pageIndex: pageIdx,
                                beforeContext: (startContext > 0 ? '...' : '') + before,
                                afterContext: after + (endContext < text.length ? '...' : ''),
                                suggestions
                            });
                        }
                    }
                } else if (node.nodeType === 1) {
                    // Evitar escanear tablas de contenido, bloques no editables o marcas
                    if (!node.classList.contains('toc-block') && !node.classList.contains('page-header-bar') && !node.classList.contains('page-footer-bar')) {
                        Array.from(node.childNodes).forEach(walkTextNodes);
                    }
                }
            };

            Array.from(ed.childNodes).forEach(walkTextNodes);
        });

        return this.currentIssues;
    },

    // ── ASISTENTE INTERACTIVO DE REVISIÓN (MODAL F7) ───────────────────────────
    openAssistant() {
        this.scanDocument();
        const modal = document.getElementById('spellcheck-assistant-modal');
        if (!modal) return;

        modal.style.display = 'flex';
        modal.classList.remove('hidden');

        // Actualizar etiqueta del idioma en cabecera del modal
        const langBadge = document.getElementById('spellcheck-modal-lang-badge');
        if (langBadge) {
            langBadge.textContent = this.getLanguageLabel();
        }

        if (this.currentIssues.length === 0) {
            this.renderNoIssuesState();
        } else {
            this.goToIssue(0);
        }
    },

    closeAssistant() {
        const modal = document.getElementById('spellcheck-assistant-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
        this.clearActiveHighlight();
    },

    renderNoIssuesState() {
        const issueCard = document.getElementById('spellcheck-issue-card');
        const emptyCard = document.getElementById('spellcheck-empty-card');
        const actionsFooter = document.getElementById('spellcheck-actions-footer');
        const counterEl = document.getElementById('spellcheck-counter-badge');

        if (issueCard) issueCard.classList.add('hidden');
        if (actionsFooter) actionsFooter.classList.add('hidden');
        if (emptyCard) emptyCard.classList.remove('hidden');
        if (counterEl) counterEl.textContent = '0 faltas';

        this.clearActiveHighlight();
    },

    goToIssue(index) {
        if (index < 0 || index >= this.currentIssues.length) return;
        this.currentIssueIndex = index;
        const issue = this.currentIssues[index];

        const issueCard = document.getElementById('spellcheck-issue-card');
        const emptyCard = document.getElementById('spellcheck-empty-card');
        const actionsFooter = document.getElementById('spellcheck-actions-footer');
        const counterEl = document.getElementById('spellcheck-counter-badge');

        if (emptyCard) emptyCard.classList.add('hidden');
        if (issueCard) issueCard.classList.remove('hidden');
        if (actionsFooter) actionsFooter.classList.remove('hidden');

        if (counterEl) {
            counterEl.textContent = `${index + 1} de ${this.currentIssues.length}`;
        }

        // 1. Mostrar palabra y contexto
        const wordEl = document.getElementById('spellcheck-current-word');
        const contextEl = document.getElementById('spellcheck-context-snippet');
        const manualInput = document.getElementById('spellcheck-manual-input');

        if (wordEl) wordEl.textContent = issue.word;
        if (contextEl) {
            contextEl.innerHTML = `${this.escapeHTML(issue.beforeContext)}<mark class="spellcheck-snippet-highlight">${this.escapeHTML(issue.word)}</mark>${this.escapeHTML(issue.afterContext)}`;
        }

        // 2. Renderizar sugerencias inteligentes
        const suggestionsContainer = document.getElementById('spellcheck-suggestions-list');
        if (suggestionsContainer) {
            suggestionsContainer.innerHTML = '';
            if (issue.suggestions && issue.suggestions.length > 0) {
                issue.suggestions.forEach((sug, i) => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = `w-full text-left px-3 py-2 rounded-xl border transition-all flex items-center justify-between text-xs font-bold ${
                        i === 0
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/50 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                    }`;
                    btn.innerHTML = `
                        <div class="flex items-center gap-2">
                            <i class="fas fa-check-circle text-[11px] ${i === 0 ? 'text-amber-500' : 'text-slate-400'}"></i>
                            <span class="tracking-wide">${this.escapeHTML(sug)}</span>
                        </div>
                        <span class="text-[9px] font-black uppercase text-amber-500/80">${i === 0 ? 'Recomendada' : 'Opción'}</span>
                    `;
                    btn.onclick = () => {
                        Array.from(suggestionsContainer.children).forEach(c => {
                            c.className = c.className.replace(/bg-amber-50 dark:bg-amber-950\/40 border-amber-500\/50 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500\/30/g, 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400');
                        });
                        btn.className = 'w-full text-left px-3 py-2 rounded-xl border transition-all flex items-center justify-between text-xs font-bold bg-amber-50 dark:bg-amber-950/40 border-amber-500/50 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30';
                        if (manualInput) manualInput.value = sug;
                    };
                    btn.ondblclick = () => {
                        this.replaceCurrentWith(sug);
                    };
                    suggestionsContainer.appendChild(btn);
                });

                if (manualInput) manualInput.value = issue.suggestions[0];
            } else {
                suggestionsContainer.innerHTML = `
                    <div class="p-3 text-center rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-400 italic">
                        Sin sugerencias directas. Escribe una corrección abajo o añade la palabra al diccionario si es un nombre propio o término técnico.
                    </div>
                `;
                if (manualInput) manualInput.value = issue.word;
            }
        }

        // 3. Resaltar visualmente la palabra en el lienzo de la página correspondiente
        this.highlightInDocument(issue);
    },

    // Resaltado dinámico en la hoja física real
    highlightInDocument(issue) {
        this.clearActiveHighlight();
        if (!issue || !issue.textNode || !issue.textNode.parentNode) return;

        try {
            const parent = issue.textNode.parentNode;
            const fullText = issue.textNode.nodeValue;

            // Dividir nodo de texto e insertar <mark class="spellcheck-highlight-active">
            const beforeText = fullText.substring(0, issue.offset);
            const wordText = fullText.substring(issue.offset, issue.offset + issue.length);
            const afterText = fullText.substring(issue.offset + issue.length);

            const mark = document.createElement('mark');
            mark.className = 'spellcheck-highlight-active';
            mark.textContent = wordText;

            const frag = document.createDocumentFragment();
            if (beforeText) frag.appendChild(document.createTextNode(beforeText));
            frag.appendChild(mark);
            if (afterText) frag.appendChild(document.createTextNode(afterText));

            parent.replaceChild(frag, issue.textNode);
            this.activeHighlightNode = mark;

            // Desplazar suavemente a la vista
            mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {
            console.warn('No se pudo resaltar la palabra en el documento:', e);
        }
    },

    clearActiveHighlight() {
        if (this.activeHighlightNode && this.activeHighlightNode.parentNode) {
            const text = this.activeHighlightNode.textContent;
            const textNode = document.createTextNode(text);
            this.activeHighlightNode.parentNode.replaceChild(textNode, this.activeHighlightNode);
            this.activeHighlightNode = null;
        }

        // Limpieza adicional de cualquier marca residual
        document.querySelectorAll('.spellcheck-highlight-active').forEach(mark => {
            if (mark.parentNode) {
                const textNode = document.createTextNode(mark.textContent);
                mark.parentNode.replaceChild(textNode, mark);
                mark.parentNode.normalize();
            }
        });
    },

    // ── ACCIONES DE CORRECCIÓN ────────────────────────────────────────────────
    replaceCurrent() {
        const manualInput = document.getElementById('spellcheck-manual-input');
        const replacement = manualInput?.value?.trim();
        if (!replacement) return;
        this.replaceCurrentWith(replacement);
    },

    replaceCurrentWith(replacement) {
        if (this.currentIssueIndex < 0 || this.currentIssueIndex >= this.currentIssues.length) return;
        const issue = this.currentIssues[this.currentIssueIndex];

        if (this.activeHighlightNode && this.activeHighlightNode.parentNode) {
            const parent = this.activeHighlightNode.parentNode;
            const replacementNode = document.createTextNode(replacement);
            parent.replaceChild(replacementNode, this.activeHighlightNode);
            parent.normalize();
            this.activeHighlightNode = null;
        } else if (issue && issue.textNode && issue.textNode.parentNode) {
            const val = issue.textNode.nodeValue;
            const before = val.substring(0, issue.offset);
            const after = val.substring(issue.offset + issue.length);
            issue.textNode.nodeValue = before + replacement + after;
        }

        TextDocStateManager.pushHistory();
        DocStatsManager.update();
        MultiPageEngine.debouncePaginate();

        // Re-escanear y continuar en el mismo índice o siguiente
        this.scanDocument();
        if (this.currentIssues.length === 0) {
            this.renderNoIssuesState();
            TextDocStateManager.showToast('¡Todas las faltas corregidas con éxito!');
        } else {
            const nextIdx = Math.min(this.currentIssueIndex, this.currentIssues.length - 1);
            this.goToIssue(nextIdx);
        }
    },

    replaceAll() {
        if (this.currentIssueIndex < 0 || this.currentIssueIndex >= this.currentIssues.length) return;
        const issue = this.currentIssues[this.currentIssueIndex];
        const manualInput = document.getElementById('spellcheck-manual-input');
        const replacement = manualInput?.value?.trim();
        if (!replacement) return;

        this.clearActiveHighlight();
        const targetWord = issue.word;
        const regex = new RegExp(`\\b${this.escapeRegExp(targetWord)}\\b`, 'g');

        const editors = MultiPageEngine.getAllEditors();
        editors.forEach(ed => {
            ed.innerHTML = ed.innerHTML.replace(regex, replacement);
        });

        TextDocStateManager.pushHistory();
        DocStatsManager.update();
        MultiPageEngine.paginate();

        TextDocStateManager.showToast(`Reemplazadas todas las apariciones de "${targetWord}"`);

        this.scanDocument();
        if (this.currentIssues.length === 0) {
            this.renderNoIssuesState();
        } else {
            this.goToIssue(0);
        }
    },

    ignoreCurrent() {
        this.clearActiveHighlight();
        const nextIdx = this.currentIssueIndex + 1;
        if (nextIdx < this.currentIssues.length) {
            this.goToIssue(nextIdx);
        } else {
            this.renderNoIssuesState();
            TextDocStateManager.showToast('Revisión completada');
        }
    },

    ignoreAll() {
        if (this.currentIssueIndex < 0 || this.currentIssueIndex >= this.currentIssues.length) return;
        const issue = this.currentIssues[this.currentIssueIndex];
        this.ignoredWords.add(issue.word.toLowerCase());

        this.clearActiveHighlight();
        this.scanDocument();
        if (this.currentIssues.length === 0) {
            this.renderNoIssuesState();
            TextDocStateManager.showToast(`Se ignorarán todas las apariciones de "${issue.word}"`);
        } else {
            this.goToIssue(0);
        }
    },

    addCurrentToDictionary() {
        if (this.currentIssueIndex < 0 || this.currentIssueIndex >= this.currentIssues.length) return;
        const issue = this.currentIssues[this.currentIssueIndex];
        const wordClean = issue.word.trim().toLowerCase();

        this.userDictionary.add(wordClean);
        this.saveUserDictionary();

        this.clearActiveHighlight();
        TextDocStateManager.showToast(`"${issue.word}" agregada a tu diccionario personal`);

        this.scanDocument();
        if (this.currentIssues.length === 0) {
            this.renderNoIssuesState();
        } else {
            this.goToIssue(0);
        }
    },

    nextIssue() {
        if (this.currentIssueIndex + 1 < this.currentIssues.length) {
            this.clearActiveHighlight();
            this.goToIssue(this.currentIssueIndex + 1);
        }
    },

    prevIssue() {
        if (this.currentIssueIndex - 1 >= 0) {
            this.clearActiveHighlight();
            this.goToIssue(this.currentIssueIndex - 1);
        }
    },

    // ── CAMBIO DE IDIOMA Y CONFIGURACIÓN ───────────────────────────────────────
    setLanguage(newLang) {
        if (!['es', 'en', 'bilingual'].includes(newLang)) return;
        this.language = newLang;
        this.saveSettings();
        this.applyToAllSurfaces();

        // Actualizar radios en popover
        document.querySelectorAll('input[name="spellcheck-lang-radio"]').forEach(r => {
            r.checked = (r.value === newLang);
        });

        // Actualizar badge en modal de revisión si está abierto
        const langBadge = document.getElementById('spellcheck-modal-lang-badge');
        if (langBadge) langBadge.textContent = this.getLanguageLabel();

        // Si el asistente está abierto, re-escanear inmediatamente
        const modal = document.getElementById('spellcheck-assistant-modal');
        if (modal && modal.style.display !== 'none' && !modal.classList.contains('hidden')) {
            this.openAssistant();
        }

        TextDocStateManager.showToast(`Idioma del corrector cambiado a ${this.getLanguageLabel()}`);
    },

    setBrowserSpellcheck(enabled) {
        this.browserSpellcheck = !!enabled;
        this.saveSettings();
        this.applyToAllSurfaces();

        const toggleInput = document.getElementById('toggle-browser-spellcheck');
        if (toggleInput) toggleInput.checked = this.browserSpellcheck;

        if (this.browserSpellcheck) {
            TextDocStateManager.showToast('Corrector nativo del navegador activado');
        } else {
            TextDocStateManager.showToast('Subrayado rojo del navegador desactivado (Falsos errores eliminados)');
        }
    },

    setLiveHighlight(enabled) {
        this.liveHighlight = !!enabled;
        this.saveSettings();
        const toggleInput = document.getElementById('toggle-live-highlight');
        if (toggleInput) toggleInput.checked = this.liveHighlight;

        TextDocStateManager.showToast(this.liveHighlight ? 'Resaltado en vivo EduConta activado' : 'Resaltado en vivo desactivado');
    },

    // ── POPOVER DE CONFIGURACIÓN RÁPIDA ────────────────────────────────────────
    toggleConfigPopover(event) {
        if (event) event.stopPropagation();
        const popover = document.getElementById('popover-spellcheck-config');
        if (!popover) return;

        if (popover.classList.contains('hidden')) {
            this.openConfigPopover();
        } else {
            this.closeConfigPopover();
        }
    },

    openConfigPopover() {
        const popover = document.getElementById('popover-spellcheck-config');
        if (!popover) return;

        // Sincronizar estado de inputs
        document.querySelectorAll('input[name="spellcheck-lang-radio"]').forEach(r => {
            r.checked = (r.value === this.language);
        });

        const toggleBrowser = document.getElementById('toggle-browser-spellcheck');
        if (toggleBrowser) toggleBrowser.checked = !this.browserSpellcheck; // "Desactivar marcas rojas" es invertido para mayor claridad al usuario

        const dictCountEl = document.getElementById('user-dict-count-text');
        if (dictCountEl) {
            const count = this.userDictionary.size;
            dictCountEl.textContent = `${count} palabra${count === 1 ? '' : 's'} guardada${count === 1 ? '' : 's'}`;
        }

        popover.classList.remove('hidden');
    },

    closeConfigPopover() {
        const popover = document.getElementById('popover-spellcheck-config');
        if (popover) popover.classList.add('hidden');
    },

    // ── MODAL DEL DICCIONARIO PERSONAL ─────────────────────────────────────────
    openUserDictionaryModal() {
        this.closeConfigPopover();
        const modal = document.getElementById('user-dictionary-modal');
        if (!modal) return;

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        this.renderUserDictionaryList();
    },

    closeUserDictionaryModal() {
        const modal = document.getElementById('user-dictionary-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    },

    renderUserDictionaryList(filterQuery = '') {
        const listEl = document.getElementById('user-dict-words-list');
        const emptyEl = document.getElementById('user-dict-empty');
        if (!listEl) return;

        listEl.innerHTML = '';
        const words = Array.from(this.userDictionary).sort();
        const filtered = filterQuery ? words.filter(w => w.includes(filterQuery.toLowerCase())) : words;

        if (filtered.length === 0) {
            if (emptyEl) emptyEl.classList.remove('hidden');
            return;
        }

        if (emptyEl) emptyEl.classList.add('hidden');

        filtered.forEach(word => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300';
            item.innerHTML = `
                <div class="flex items-center gap-2">
                    <i class="fas fa-book-bookmark text-amber-500 text-[10px]"></i>
                    <span>${this.escapeHTML(word)}</span>
                </div>
                <button type="button" class="text-rose-500 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors" title="Eliminar del diccionario">
                    <i class="fas fa-trash-alt text-[10px]"></i>
                </button>
            `;
            item.querySelector('button').onclick = () => {
                this.removeUserWord(word);
            };
            listEl.appendChild(item);
        });
    },

    addUserWord(word) {
        if (!word) return;
        const clean = word.trim().toLowerCase();
        this.userDictionary.add(clean);
        this.saveUserDictionary();
    },

    addWordFromInput() {
        const input = document.getElementById('user-dict-new-word-input');
        const word = input?.value?.trim()?.toLowerCase();
        if (!word) return;

        this.addUserWord(word);
        if (input) input.value = '';

        this.renderUserDictionaryList();
        TextDocStateManager.showToast(`"${word}" añadida al diccionario`);
    },

    removeUserWord(word) {
        this.userDictionary.delete(word.toLowerCase());
        this.saveUserDictionary();
        this.renderUserDictionaryList();
        TextDocStateManager.showToast(`"${word}" eliminada del diccionario`);
    },

    // ── UTILIDADES ─────────────────────────────────────────────────────────────
    escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
};


    /* ===================================================================
     * MODULO: layout.js
     * =================================================================== */
/**
 * layout.js — PageLayoutManager
 * Dimensiones de papel, márgenes, zoom y orientación.
 * EduConta SV
 */




const PageLayoutManager = {
    currentZoom: 1.5,
    currentSheetTheme: null,

    // ─── Modo de Hojas y Lienzo (Claro / Oscuro) ──────────────────────────
    initSheetTheme() {
        const saved = localStorage.getItem('educonta-textos-sheet-theme');
        if (saved === 'light' || saved === 'dark') {
            this.setSheetTheme(saved, false);
        } else {
            const appTheme = document.documentElement.getAttribute('data-theme') || 'light';
            this.setSheetTheme(appTheme, false);
        }
    },

    getSheetTheme() {
        if (this.currentSheetTheme) return this.currentSheetTheme;
        const container = document.getElementById('pages-container');
        if (container && container.getAttribute('data-sheet-theme')) {
            return container.getAttribute('data-sheet-theme');
        }
        return document.documentElement.getAttribute('data-theme') || 'light';
    },

    setSheetTheme(theme, save = true) {
        if (theme !== 'light' && theme !== 'dark') return;
        this.currentSheetTheme = theme;

        const container = document.getElementById('pages-container');
        if (container) {
            container.setAttribute('data-sheet-theme', theme);
        }

        this.updateSheetThemeUI(theme);

        if (save) {
            localStorage.setItem('educonta-textos-sheet-theme', theme);
            if (window.TextDocStateManager && typeof window.TextDocStateManager.showToast === 'function') {
                const label = theme === 'light' ? 'Modo Claro (Hoja blanca)' : 'Modo Oscuro (Hoja oscura)';
                window.TextDocStateManager.showToast(`Hojas: ${label}`);
            }
        }
    },

    toggleSheetTheme() {
        const current = this.getSheetTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        this.setSheetTheme(next, true);
    },

    updateSheetThemeUI(theme) {
        const current = theme || this.getSheetTheme();
        const btnLight = document.getElementById('btn-sheet-mode-light');
        const btnDark  = document.getElementById('btn-sheet-mode-dark');

        if (btnLight) {
            const isLight = (current === 'light');
            btnLight.classList.toggle('active', isLight);
            btnLight.setAttribute('aria-pressed', isLight ? 'true' : 'false');
        }

        if (btnDark) {
            const isDark = (current === 'dark');
            btnDark.classList.toggle('active', isDark);
            btnDark.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        }
    },

    applyPageGeometry(sizeKey, margins, lineSpacing, orientation, fontFamily = '') {
        const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
        const activeFont = fontFamily || sheet?.fontFamily || 'Plus Jakarta Sans';
        const cleanFont = activeFont.trim().replace(/^['"]|['"]$/g, '');

        if (typeof window.ensureGoogleFontLoaded === 'function' && cleanFont) {
            window.ensureGoogleFontLoaded(cleanFont);
        }

        const root = document.documentElement;
        const dim = PAGE_DIMENSIONS[sizeKey] || PAGE_DIMENSIONS.letter;

        const widthMm  = (orientation === 'landscape') ? dim.height : dim.width;
        const heightMm = (orientation === 'landscape') ? dim.width  : dim.height;

        root.style.setProperty('--doc-page-width',    `${widthMm}mm`);
        root.style.setProperty('--doc-page-height',   `${heightMm}mm`);
        root.style.setProperty('--doc-margin-top',    `${margins.top    || 25}mm`);
        root.style.setProperty('--doc-margin-bottom', `${margins.bottom || 25}mm`);
        root.style.setProperty('--doc-margin-left',   `${margins.left   || 25}mm`);
        root.style.setProperty('--doc-margin-right',  `${margins.right  || 25}mm`);

        const sizeSelect    = document.getElementById('page-size-select');
        const spacingSelect = document.getElementById('page-spacing-select');
        const fontSelect    = document.getElementById('font-family-select');
        if (sizeSelect)    sizeSelect.value = sizeKey;
        if (spacingSelect) spacingSelect.value = lineSpacing;
        if (fontSelect && cleanFont) {
            fontSelect.value = cleanFont;
            if (fontSelect._glassInstance) fontSelect._glassInstance.updateTriggerLabel();
        }

        const pages = document.querySelectorAll('.page-sheet');
        pages.forEach(p => {
            ['spacing-single','spacing-115','spacing-125','spacing-15','spacing-175','spacing-double']
                .forEach(c => p.classList.remove(c));
            p.classList.add(`spacing-${lineSpacing}`);
            const surface = p.querySelector('.page-editor-surface');
            if (surface) surface.style.fontFamily = `'${cleanFont}', sans-serif`;
        });

        this.injectPrintPageRule(widthMm, heightMm);
        MultiPageEngine.updateAllPageNumbers();
        MultiPageEngine.paginate();
        this.applyZoom();
        this.initSheetTheme();
    },

    injectPrintPageRule(widthMm, heightMm) {
        let styleTag = document.getElementById('dynamic-print-page-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'dynamic-print-page-style';
            document.head.appendChild(styleTag);
        }
        styleTag.textContent = `@media print { @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; } }`;
    },

    setPageSize(sizeKey) {
        const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
        if (!sheet) return;
        sheet.pageSize = sizeKey;
        this.applyPageGeometry(sizeKey, sheet.margins, sheet.lineSpacing, sheet.orientation);
        TextDocStateManager.triggerAutoSave();
        CollabPresenceManager.broadcastLayoutChange({
            pageSize: sizeKey,
            margins: sheet.margins,
            lineSpacing: sheet.lineSpacing,
            orientation: sheet.orientation,
            headerFooter: sheet.headerFooter
        });
    },

    setMarginPreset(presetKey) {
        const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
        if (!sheet) return;
        if (presetKey === 'custom') { this.openPageSetupModal(); return; }
        const preset = MARGIN_PRESETS[presetKey] || MARGIN_PRESETS.normal;
        sheet.margins = preset;
        sheet.marginPreset = presetKey;
        this.applyPageGeometry(sheet.pageSize, preset, sheet.lineSpacing, sheet.orientation);
        TextDocStateManager.triggerAutoSave();
        CollabPresenceManager.broadcastLayoutChange({
            pageSize: sheet.pageSize,
            margins: preset,
            marginPreset: presetKey,
            lineSpacing: sheet.lineSpacing,
            orientation: sheet.orientation,
            headerFooter: sheet.headerFooter
        });
    },

    setSpacing(spacing) {
        const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
        if (!sheet) return;
        sheet.lineSpacing = spacing;
        this.applyPageGeometry(sheet.pageSize, sheet.margins, spacing, sheet.orientation);
        TextDocStateManager.triggerAutoSave();
        CollabPresenceManager.broadcastLayoutChange({
            pageSize: sheet.pageSize,
            margins: sheet.margins,
            marginPreset: sheet.marginPreset,
            lineSpacing: spacing,
            orientation: sheet.orientation,
            headerFooter: sheet.headerFooter
        });
    },

    toggleOrientation() {
        const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
        if (!sheet) return;
        const currentOrientation = sheet.orientation || 'portrait';
        const nextOrientation    = currentOrientation === 'portrait' ? 'landscape' : 'portrait';
        sheet.orientation = nextOrientation;
        this.applyPageGeometry(sheet.pageSize, sheet.margins, sheet.lineSpacing, nextOrientation);
        TextDocStateManager.triggerAutoSave();
        TextDocStateManager.showToast(`Orientación: ${nextOrientation === 'portrait' ? 'Vertical' : 'Horizontal (Apaisado)'}`);
        CollabPresenceManager.broadcastLayoutChange({
            pageSize: sheet.pageSize,
            margins: sheet.margins,
            marginPreset: sheet.marginPreset,
            lineSpacing: sheet.lineSpacing,
            orientation: nextOrientation,
            headerFooter: sheet.headerFooter
        });
    },

    openPageSetupModal() {
        const modal = document.getElementById('page-setup-modal');
        if (!modal) return;
        const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
        const size = sheet?.pageSize || 'letter';
        const orient = sheet?.orientation || 'portrait';
        const margins = sheet?.margins || MARGIN_PRESETS.normal;
        const hf = sheet?.headerFooter || {
            showHeader: false, showFooter: false,
            headerText: '', footerText: '', showPageNumbers: false
        };

        const sizeSel        = document.getElementById('modal-page-size-select');
        const orientSel      = document.getElementById('modal-page-orientation-select');
        const topInp         = document.getElementById('margin-top-input');
        const bottomInp      = document.getElementById('margin-bottom-input');
        const leftInp        = document.getElementById('margin-left-input');
        const rightInp       = document.getElementById('margin-right-input');
        const showHeaderInp  = document.getElementById('modal-show-header');
        const headerTextInp  = document.getElementById('modal-header-text');
        const showFooterInp  = document.getElementById('modal-show-footer');
        const footerTextInp  = document.getElementById('modal-footer-text');
        const showPageNumsInp= document.getElementById('modal-show-pagenums');

        if (sizeSel)    sizeSel.value    = size;
        if (orientSel)  orientSel.value  = orient;
        if (topInp)     topInp.value     = margins.top    || 25;
        if (bottomInp)  bottomInp.value  = margins.bottom || 25;
        if (leftInp)    leftInp.value    = margins.left   || 25;
        if (rightInp)   rightInp.value   = margins.right  || 25;
        if (showHeaderInp)  showHeaderInp.checked  = !!hf.showHeader;
        if (headerTextInp)  headerTextInp.value    = hf.headerText || '';
        if (showFooterInp)  showFooterInp.checked  = !!hf.showFooter;
        if (footerTextInp)  footerTextInp.value    = hf.footerText || '';
        if (showPageNumsInp)showPageNumsInp.checked = !!hf.showPageNumbers;

        modal.style.display = 'flex';
    },

    closePageSetupModal() {
        const modal = document.getElementById('page-setup-modal');
        if (modal) modal.style.display = 'none';
    },

    applyPresetToModal(presetKey) {
        const preset = MARGIN_PRESETS[presetKey] || MARGIN_PRESETS.normal;
        const topInp    = document.getElementById('margin-top-input');
        const bottomInp = document.getElementById('margin-bottom-input');
        const leftInp   = document.getElementById('margin-left-input');
        const rightInp  = document.getElementById('margin-right-input');
        if (topInp)    topInp.value    = preset.top;
        if (bottomInp) bottomInp.value = preset.bottom;
        if (leftInp)   leftInp.value   = preset.left;
        if (rightInp)  rightInp.value  = preset.right;
    },

    applyPageSetupFromModal() {
        const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
        if (!sheet) return;

        const size        = document.getElementById('modal-page-size-select')?.value        || 'letter';
        const orientation = document.getElementById('modal-page-orientation-select')?.value || 'portrait';
        const top         = parseInt(document.getElementById('margin-top-input')?.value, 10)    || 25;
        const bottom      = parseInt(document.getElementById('margin-bottom-input')?.value, 10) || 25;
        const left        = parseInt(document.getElementById('margin-left-input')?.value, 10)   || 25;
        const right       = parseInt(document.getElementById('margin-right-input')?.value, 10)  || 25;

        const showHeader     = document.getElementById('modal-show-header')?.checked     || false;
        const headerText     = document.getElementById('modal-header-text')?.value.trim() || '';
        const showFooter     = document.getElementById('modal-show-footer')?.checked     || false;
        const footerText     = document.getElementById('modal-footer-text')?.value.trim() || '';
        const showPageNumbers= document.getElementById('modal-show-pagenums')?.checked   || false;

        const newMargins = { top, bottom, left, right };
        let presetFound = 'custom';
        for (const [key, p] of Object.entries(MARGIN_PRESETS)) {
            if (p.top === top && p.bottom === bottom && p.left === left && p.right === right) {
                presetFound = key; break;
            }
        }

        sheet.pageSize     = size;
        sheet.orientation  = orientation;
        sheet.margins      = newMargins;
        sheet.marginPreset = presetFound;
        sheet.headerFooter = { showHeader, showFooter, headerText, footerText, showPageNumbers };

        const marginSelect = document.getElementById('page-margins-select');
        if (marginSelect) marginSelect.value = presetFound;

        this.applyPageGeometry(size, newMargins, sheet.lineSpacing, orientation);
        MultiPageEngine.updateAllPageNumbers();
        MultiPageEngine.paginate();
        TextDocStateManager.triggerAutoSave();
        this.closePageSetupModal();
        TextDocStateManager.showToast('Configuración de página aplicada');
        CollabPresenceManager.broadcastLayoutChange({
            pageSize: size, orientation, margins: newMargins,
            marginPreset: presetFound, headerFooter: sheet.headerFooter
        });
    },

    zoomIn() {
        if (this.currentZoom < 2.0) {
            this.currentZoom = Math.min(2.0, Math.round((this.currentZoom + 0.1) * 10) / 10);
            this.applyZoom();
        }
    },

    zoomOut() {
        if (this.currentZoom > 0.5) {
            this.currentZoom = Math.max(0.5, Math.round((this.currentZoom - 0.1) * 10) / 10);
            this.applyZoom();
        }
    },

    resetZoom() {
        this.currentZoom = 1.5;
        this.applyZoom();
    },

    setZoom(val) {
        this.currentZoom = Math.max(0.5, Math.min(2.0, Math.round(val * 10) / 10));
        this.applyZoom();
    },

    applyZoom(isPaginationSync = false) {
        const wrapper = document.getElementById('paper-transform-wrapper');
        const container = document.getElementById('pages-container');
        const spacer = document.getElementById('zoom-scroll-spacer');
        if (!wrapper) return;

        const zoom = this.currentZoom;
        const zoomStr = `${Math.round(zoom * 100)}%`;

        // Transformación cinemática suave con aceleración por hardware:
        wrapper.style.transform = `scale(${zoom})`;
        wrapper.style.transformOrigin = 'top center';

        // Sincronización exacta y segura de las dimensiones de desplazamiento:
        // Evita el bug de doble escalado multiplicador, ajustando el espaciador exterior
        // para que scrollHeight refleje fielmente el tamaño físico escalado de la hoja.
        if (container) {
            const baseHeight = container.offsetHeight || 0;
            const scaledHeight = Math.ceil(baseHeight * zoom);

            if (zoom < 1.0) {
                wrapper.style.height = `${scaledHeight}px`;
                if (spacer) {
                    spacer.style.height = '0px';
                    spacer.style.minHeight = '0px';
                }
            } else {
                wrapper.style.height = '';
                const extra = Math.max(0, scaledHeight - baseHeight);
                if (spacer) {
                    spacer.style.height = `${extra}px`;
                    spacer.style.minHeight = `${extra}px`;
                }
            }
        }

        // Limpiar cualquier residuo de minWidth o minHeight para impedir scroll horizontal
        wrapper.style.minHeight = '';
        wrapper.style.minWidth = '';

        // Confinamiento seguro: asegurar que el scroll vertical nunca sobrepase la hoja ni salga del campo visible
        const scrollArea = document.querySelector('.editor-scroll-area');
        if (scrollArea) {
            scrollArea.scrollLeft = 0;
            const maxScrollY = Math.max(0, scrollArea.scrollHeight - scrollArea.clientHeight);
            if (scrollArea.scrollTop > maxScrollY) {
                scrollArea.scrollTop = maxScrollY;
            }
            if (!isPaginationSync && window.SmoothScrollManager) {
                window.SmoothScrollManager.stopAnimation();
            }
        }

        if (!isPaginationSync) {
            const ribbonText    = document.getElementById('zoom-level-text');
            const statusbarText = document.getElementById('zoom-level-statusbar');
            if (ribbonText)    ribbonText.textContent    = zoomStr;
            if (statusbarText) statusbarText.textContent = zoomStr;

            // Actualizar la animación elástica de la burbuja en los presets de zoom
            this.updateZoomBubble(this.currentBubbleIndex < 0);
        }
    },

    currentBubbleIndex: -1,
    bubbleSnapTimeout: null,

    updateZoomBubble(instant = false) {
        const pill = document.getElementById('zoom-bubble-indicator');
        const container = document.getElementById('zoom-presets-container');
        if (!pill || !container) return;

        const roundedZoom = Math.round(this.currentZoom * 10) / 10;
        let activeBtn = null;
        let targetIndex = -1;

        if (roundedZoom === 1.0) {
            activeBtn = document.getElementById('btn-reset-zoom');
            targetIndex = 0;
        } else if (roundedZoom === 1.5) {
            activeBtn = document.getElementById('btn-zoom-preset-150');
            targetIndex = 1;
        } else if (roundedZoom === 2.0) {
            activeBtn = document.getElementById('btn-zoom-preset-max');
            targetIndex = 2;
        }

        const allButtons = container.querySelectorAll('.zoom-preset-btn');

        if (!activeBtn) {
            pill.style.opacity = '0';
            allButtons.forEach(b => {
                b.classList.remove('text-white', '!text-white');
                b.classList.add('text-slate-600', 'dark:text-slate-300');
            });
            this.currentBubbleIndex = -1;
            return;
        }

        allButtons.forEach(b => {
            if (b === activeBtn) {
                b.classList.add('text-white', '!text-white');
                b.classList.remove('text-slate-600', 'dark:text-slate-300');
            } else {
                b.classList.remove('text-white', '!text-white');
                b.classList.add('text-slate-600', 'dark:text-slate-300');
            }
        });

        if (activeBtn.offsetWidth === 0) {
            requestAnimationFrame(() => this.updateZoomBubble(instant));
            return;
        }

        if (this.bubbleSnapTimeout) {
            clearTimeout(this.bubbleSnapTimeout);
            this.bubbleSnapTimeout = null;
        }

        const distance = this.currentBubbleIndex >= 0 ? Math.abs(targetIndex - this.currentBubbleIndex) : 0;
        const stretch = (distance > 0) ? (1 + Math.min(distance * 0.15, 0.35)) : 1;
        const isInstant = instant || distance === 0 || this.currentBubbleIndex < 0;

        pill.style.width = `${activeBtn.offsetWidth}px`;
        pill.style.opacity = '1';

        if (isInstant) {
            pill.style.transition = 'none';
            pill.style.transform = `translateX(${activeBtn.offsetLeft}px) scaleX(1) scaleY(1)`;
            void pill.offsetWidth;
            requestAnimationFrame(() => {
                pill.style.transition = '';
            });
        } else {
            // Efecto elástico squish/stretch característico de la burbuja de EduConta SV
            pill.style.transform = `translateX(${activeBtn.offsetLeft}px) scaleX(${stretch}) scaleY(0.88)`;
            this.bubbleSnapTimeout = setTimeout(() => {
                pill.style.transform = `translateX(${activeBtn.offsetLeft}px) scaleX(1) scaleY(1)`;
                this.bubbleSnapTimeout = null;
            }, 180);
        }

        this.currentBubbleIndex = targetIndex;
    }
};

window.addEventListener('resize', () => {
    window.PageLayoutManager?.updateZoomBubble?.(true);
    window.PageLayoutManager?.applyZoom?.();
});

if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
        window.PageLayoutManager?.updateZoomBubble?.(true);
    });
}

const SmoothScrollManager = {
    scrollArea: null,
    targetY: null,
    isAnimating: false,
    rafId: null,

    init() {
        this.scrollArea = document.querySelector('.editor-scroll-area');
        if (!this.scrollArea) return;

        // Asegurar bloqueo estricto de cualquier scroll horizontal
        this.scrollArea.scrollLeft = 0;
        this.scrollArea.style.overflowX = 'hidden';

        // Escucha de rueda con cinemática suave en el área de edición
        this.scrollArea.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // Reenvío suave de rueda desde los controles superiores y cabeceras
        document.addEventListener('wheel', (e) => {
            const onTopControls = e.target?.closest?.('.sticky-fixed-controls, #editor-sticky-controls, .main-header-wrapper, .main-header');
            if (onTopControls && !e.target.closest('.educonta-glass-select-popover, select, [data-scrollable], textarea, input')) {
                this.handleWheel(e);
            }
        }, { passive: false });

        // Detener animación si el usuario arrastra la barra de scroll con el ratón o usa táctil
        this.scrollArea.addEventListener('mousedown', () => this.stopAnimation());
        this.scrollArea.addEventListener('touchstart', () => this.stopAnimation(), { passive: true });

        // Asegurar que scrollLeft se mantenga siempre en cero
        this.scrollArea.addEventListener('scroll', () => {
            if (this.scrollArea.scrollLeft !== 0) {
                this.scrollArea.scrollLeft = 0;
            }
        }, { passive: true });
    },

    handleWheel(e) {
        if (!this.scrollArea) return;

        // Atajo interactivo: Ctrl + Rueda de ratón para acercar o alejar el zoom de forma segura
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.deltaY < 0) {
                PageLayoutManager.zoomIn();
            } else if (e.deltaY > 0) {
                PageLayoutManager.zoomOut();
            }
            return;
        }

        // Detección de Trackpad/Touchpad: eventos continuos con deltas fraccionarios
        const isTrackpad = Math.abs(e.deltaY) < 35 && !Number.isInteger(e.deltaY);
        if (isTrackpad && e.deltaMode === 0) {
            this.stopAnimation();
            return;
        }

        e.preventDefault();

        let deltaY = e.deltaY;

        // Normalizar según deltaMode
        if (e.deltaMode === 1) { // Líneas (ruedas de ratón clásicas)
            deltaY *= 32;
        } else if (e.deltaMode === 2) { // Páginas
            deltaY *= this.scrollArea.clientHeight * 0.85;
        }

        if (!this.isAnimating) {
            this.targetY = this.scrollArea.scrollTop;
        }

        // Confinamiento estricto y seguro: el desplazamiento vertical NUNCA sale del campo visible de la hoja
        const maxScrollY = Math.max(0, this.scrollArea.scrollHeight - this.scrollArea.clientHeight);
        this.targetY = Math.max(0, Math.min(maxScrollY, this.targetY + deltaY));

        if (!this.isAnimating) {
            this.isAnimating = true;
            this.rafId = requestAnimationFrame(() => this.step());
        }
    },

    step() {
        if (!this.isAnimating || !this.scrollArea) return;

        const currentY = this.scrollArea.scrollTop;
        const diffY = this.targetY - currentY;

        // Si la distancia es menor a 0.5px, fijar posición final
        if (Math.abs(diffY) < 0.5) {
            this.scrollArea.scrollTop = this.targetY;
            this.isAnimating = false;
            this.rafId = null;
            return;
        }

        // Factor de amortiguación 0.18 para una fluidez sedosa pero precisa
        this.scrollArea.scrollTop = currentY + diffY * 0.18;

        this.rafId = requestAnimationFrame(() => this.step());
    },

    stopAnimation() {
        this.isAnimating = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this.scrollArea) {
            this.targetY = this.scrollArea.scrollTop;
        }
    }
};


    /* ===================================================================
     * MODULO: engine.js
     * =================================================================== */
/**
 * engine.js — MultiPageEngine
 * Motor de hojas físicas, paginación 3-pases, cursor DOM y flujo nativo.
 * EduConta SV
 */



    //    corte de nodo, y separación de empuje / consolidación.
    // =====================================================================
    const MultiPageEngine = {
        containerEl: null,
        isPaginating: false,
        paginateQueued: false,
        _debounceTimer: null,
        _cursorMarker: null,
        pageCount: 1,

        getContainer() {
            if (!this.containerEl) {
                this.containerEl = document.getElementById('pages-container');
            }
            return this.containerEl;
        },

        getActiveEditor() {
            const container = this.getContainer();
            if (!container) return null;

            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                let node = sel.anchorNode;
                while (node && node !== container) {
                    if (node.nodeType === 1 && node.classList.contains('page-editor-surface')) {
                        return node;
                    }
                    node = node.parentNode;
                }
            }

            if (document.activeElement && document.activeElement.classList.contains('page-editor-surface')) {
                return document.activeElement;
            }

            return container.querySelector('.page-editor-surface') || null;
        },

        getAllEditors() {
            const container = this.getContainer();
            return container ? Array.from(container.querySelectorAll('.page-editor-surface')) : [];
        },

        // =============================================================
        // ENFOQUE ACTIVO DEL EDITOR Y POSICIONAMIENTO DEL CURSOR
        // =============================================================
        focusActiveEditor(atStart = true) {
            if (window.isAuditMode) return;
            if (window.TextDocStateManager?.getUserRole && window.TextDocStateManager.getUserRole() === 'lector') return;

            // Si hay un marcador temporal de cursor activo pendiente de restauración, no forzar
            if (this._cursorMarker || this._selectionStartMarker) return;

            const editor = this.getActiveEditor();
            if (!editor) return;

            // Si el editor ya tiene el foco y una selección activa dentro de sí, preservar la posición actual
            if (document.activeElement === editor) {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
                    return;
                }
            }

            // Evitar robar el foco si el usuario ya está interactuando con otro campo de texto o modal
            const activeEl = document.activeElement;
            if (activeEl && activeEl !== document.body && activeEl !== editor && activeEl !== document.documentElement) {
                if (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl.isContentEditable && !activeEl.classList.contains('page-editor-surface'))) {
                    return;
                }
            }

            try {
                editor.focus({ preventScroll: true });

                const sel = window.getSelection();
                if (!sel) return;

                const range = document.createRange();

                if (atStart) {
                    // Buscar el primer punto de inserción de texto en la superficie
                    const walker = document.createTreeWalker(
                        editor,
                        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                        {
                            acceptNode(node) {
                                if (node === editor) return NodeFilter.FILTER_SKIP;
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                    if (node.getAttribute && node.getAttribute('contenteditable') === 'false') {
                                        return NodeFilter.FILTER_REJECT;
                                    }
                                    if (node.tagName === 'BR' || node.tagName === 'IMG') {
                                        return NodeFilter.FILTER_ACCEPT;
                                    }
                                    return NodeFilter.FILTER_SKIP;
                                }
                                if (node.nodeType === Node.TEXT_NODE) {
                                    return NodeFilter.FILTER_ACCEPT;
                                }
                                return NodeFilter.FILTER_SKIP;
                            }
                        }
                    );

                    const firstNode = walker.nextNode();
                    if (firstNode) {
                        if (firstNode.nodeType === Node.TEXT_NODE) {
                            range.setStart(firstNode, 0);
                            range.collapse(true);
                        } else if (firstNode.tagName === 'BR' || firstNode.tagName === 'IMG') {
                            range.setStartBefore(firstNode);
                            range.collapse(true);
                        } else {
                            range.selectNodeContents(firstNode);
                            range.collapse(true);
                        }
                    } else {
                        range.selectNodeContents(editor);
                        range.collapse(true);
                    }
                } else {
                    range.selectNodeContents(editor);
                    range.collapse(false);
                }

                sel.removeAllRanges();
                sel.addRange(range);

                if (window.EduContaTextEngine) {
                    window.EduContaTextEngine._savedRange = range.cloneRange();
                    window.EduContaTextEngine._savedEditor = editor;
                    window.EduContaTextEngine.updateToolbarState();
                }
            } catch (err) {
                try { editor.focus({ preventScroll: true }); } catch (_) {}
            }
        },

        // =============================================================
        // CURSOR Y SELECCIÓN: Guardar y restaurar posición o sombreado
        // =============================================================
        saveCursor() {
            try {
                this.removeCursorMarker();
                const sel = window.getSelection();
                let range = null;
                if (sel && sel.rangeCount > 0) {
                    range = sel.getRangeAt(0);
                } else if (window.EduContaTextEngine?._savedRange) {
                    range = window.EduContaTextEngine._savedRange;
                }
                if (!range) return;

                const container = this.getContainer();
                if (!container || !container.contains(range.commonAncestorContainer)) return;

                if (!range.collapsed) {
                    // SELECCIÓN DE TEXTO (Sombreado activo multicarácter): Guardar extremos sin colapsar el rango
                    const startMarker = document.createElement('span');
                    startMarker.id = '__ec_sel_start__';
                    startMarker.setAttribute('data-ec-cursor', '1');
                    startMarker.style.cssText = 'display:inline;font-size:0;line-height:0;width:0;height:0;overflow:hidden;position:relative;';

                    const endMarker = document.createElement('span');
                    endMarker.id = '__ec_sel_end__';
                    endMarker.setAttribute('data-ec-cursor', '1');
                    endMarker.style.cssText = 'display:inline;font-size:0;line-height:0;width:0;height:0;overflow:hidden;position:relative;';

                    // Insertar marcador de fin primero (para no alterar los offsets del inicio)
                    const endRange = range.cloneRange();
                    endRange.collapse(false);
                    endRange.insertNode(endMarker);

                    // Insertar marcador de inicio
                    const startRange = range.cloneRange();
                    startRange.collapse(true);
                    startRange.insertNode(startMarker);

                    // Re-anclar selección activa entre marcadores sin destruirla ni colapsarla
                    const activeRange = document.createRange();
                    activeRange.setStartAfter(startMarker);
                    activeRange.setEndBefore(endMarker);
                    if (sel) {
                        sel.removeAllRanges();
                        sel.addRange(activeRange);
                    }
                    if (window.EduContaTextEngine) {
                        window.EduContaTextEngine._savedRange = activeRange.cloneRange();
                        window.EduContaTextEngine._savedEditor = startMarker.closest('.page-editor-surface') || endMarker.closest('.page-editor-surface');
                    }

                    this._selectionStartMarker = startMarker;
                    this._selectionEndMarker = endMarker;
                } else {
                    // CURSOR SIMPLE (Caret de escritura colapsado)
                    const marker = document.createElement('span');
                    marker.id = '__ec_cursor__';
                    marker.setAttribute('data-ec-cursor', '1');
                    marker.style.cssText = 'display:inline;font-size:0;line-height:0;width:0;height:0;overflow:hidden;position:relative;';

                    const insertRange = range.cloneRange();
                    insertRange.collapse(true);
                    insertRange.insertNode(marker);

                    range.setStartAfter(marker);
                    range.collapse(true);
                    if (sel) {
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    if (window.EduContaTextEngine) {
                        window.EduContaTextEngine._savedRange = range.cloneRange();
                        window.EduContaTextEngine._savedEditor = marker.closest('.page-editor-surface');
                    }

                    this._cursorMarker = marker;
                }
            } catch (_) { /* Selection API puede fallar en edge cases */ }
        },

        restoreCursor() {
            const startMarker = this._selectionStartMarker || document.getElementById('__ec_sel_start__');
            const endMarker = this._selectionEndMarker || document.getElementById('__ec_sel_end__');

            if (startMarker && endMarker && startMarker.parentNode && endMarker.parentNode) {
                try {
                    let editorSurface = startMarker.closest('.page-editor-surface') || endMarker.closest('.page-editor-surface');
                    if (editorSurface && document.activeElement !== editorSurface) {
                        editorSurface.focus({ preventScroll: true });
                    }

                    const range = document.createRange();
                    range.setStartAfter(startMarker);
                    range.setEndBefore(endMarker);

                    startMarker.remove();
                    endMarker.remove();
                    this._selectionStartMarker = null;
                    this._selectionEndMarker = null;

                    const sel = window.getSelection();
                    if (sel) {
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    if (window.EduContaTextEngine) {
                        window.EduContaTextEngine._savedRange = range.cloneRange();
                        window.EduContaTextEngine._savedEditor = editorSurface;
                    }
                } catch (_) {
                    if (startMarker) startMarker.remove();
                    if (endMarker) endMarker.remove();
                    this._selectionStartMarker = null;
                    this._selectionEndMarker = null;
                }
                return;
            }

            const marker = this._cursorMarker || document.getElementById('__ec_cursor__');
            if (!marker || !marker.parentNode) {
                this._cursorMarker = null;
                return;
            }
            try {
                // Enfocar el editor que contiene el marcador sin alterar el scroll
                let editorSurface = marker.closest('.page-editor-surface');
                if (editorSurface && document.activeElement !== editorSurface) {
                    editorSurface.focus({ preventScroll: true });
                }

                const range = document.createRange();
                range.setStartAfter(marker);
                range.collapse(true);
                const sel = window.getSelection();
                if (sel) {
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                if (window.EduContaTextEngine) {
                    window.EduContaTextEngine._savedRange = range.cloneRange();
                    window.EduContaTextEngine._savedEditor = editorSurface;
                }
            } catch (_) { /* ignorar */ }
            marker.remove();
            this._cursorMarker = null;

            // Mantener el cursor visible suavemente sin forzar saltos hacia arriba
            this.scrollCaretIntoView(false);
        },

        scrollCaretIntoView(allowScrollUp = false) {
            const scrollContainer = document.querySelector('.editor-scroll-area');
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;

            const range = sel.getRangeAt(0);
            let rect = null;

            const rects = range.getClientRects();
            if (rects.length > 0) {
                rect = rects[0];
            } else {
                const el = range.startContainer.nodeType === 1 
                    ? range.startContainer 
                    : range.startContainer.parentElement;
                if (el && !el.classList.contains('page-editor-surface') && !el.classList.contains('page-sheet') && !el.id?.includes('pages-container')) {
                    rect = el.getBoundingClientRect();
                }
            }

            if (!rect || (rect.top === 0 && rect.bottom === 0)) return;
            // Un cursor de texto real nunca mide más de 120px de alto; si es mayor, es un contenedor completo
            if (rect.height > 120) return;

            if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
                const cRect = scrollContainer.getBoundingClientRect();
                const floatingToolbar = document.querySelector('.sticky-fixed-controls, #editor-sticky-controls');
                const toolbarBottom = floatingToolbar ? floatingToolbar.getBoundingClientRect().bottom : 224;
                const topBuffer = Math.max(toolbarBottom + 12, cRect.top + 20);
                const bottomBuffer = cRect.bottom - 70;

                // Solo desplazar hacia arriba si se autorizó explícitamente (ej: navegación con flechas o PageUp),
                // nunca al escribir texto ordinario, y solo si el cursor está verdaderamente detrás de la barra fija
                if (allowScrollUp && rect.top > 0 && rect.top < topBuffer && scrollContainer.scrollTop > 0) {
                    const diff = Math.min(topBuffer - rect.top, 100);
                    scrollContainer.scrollBy({ top: -diff, behavior: 'smooth' });
                } else if (rect.bottom > bottomBuffer) {
                    const diff = Math.min(rect.bottom - bottomBuffer, 120);
                    scrollContainer.scrollBy({ top: diff, behavior: 'smooth' });
                }
            } else {
                const topHeaderBuffer = 240;
                const bottomBuffer = 80;
                const viewportHeight = window.innerHeight;

                if (allowScrollUp && rect.top > 0 && rect.top < topHeaderBuffer && (window.scrollY || document.documentElement.scrollTop) > 0) {
                    const diff = Math.min(topHeaderBuffer - rect.top, 100);
                    window.scrollBy({ top: -diff, behavior: 'smooth' });
                } else if (rect.bottom > viewportHeight - bottomBuffer) {
                    const diff = Math.min(rect.bottom - (viewportHeight - bottomBuffer), 120);
                    window.scrollBy({ top: diff, behavior: 'smooth' });
                }
            }
        },

        removeCursorMarker() {
            const existingCursor = document.getElementById('__ec_cursor__');
            if (existingCursor) existingCursor.remove();
            const existingStart = document.getElementById('__ec_sel_start__');
            if (existingStart) existingStart.remove();
            const existingEnd = document.getElementById('__ec_sel_end__');
            if (existingEnd) existingEnd.remove();
            this._cursorMarker = null;
            this._selectionStartMarker = null;
            this._selectionEndMarker = null;
        },

        // =============================================================
        // NORMALIZACIÓN: Envolver nodos de texto sueltos en <p> y sanar tablas
        // =============================================================
        normalizeEditor(editor) {
            // 1. Re-unificar tablas partidas o fragmentadas con espacios vacíos
            this.healFragmentedTables(editor);

            // 2. Envolver nodos de texto sueltos (no envueltos en un bloque) en <p>
            Array.from(editor.childNodes).forEach(node => {
                if (node.nodeType === 3 && node.textContent.trim()) {
                    const p = document.createElement('p');
                    editor.insertBefore(p, node);
                    p.appendChild(node);
                } else if (node.nodeType === 3 && !node.textContent.trim()) {
                    // Nodo de texto vacío fuera de un bloque — remover
                    node.remove();
                }
            });
            // 3. Envolver <br> sueltos en <p>
            Array.from(editor.childNodes).forEach(node => {
                if (node.nodeType === 1 && node.tagName === 'BR') {
                    const p = document.createElement('p');
                    editor.insertBefore(p, node);
                    p.appendChild(node);
                }
            });
            // 4. Asegurar al menos un hijo
            if (editor.children.length === 0 && editor.childNodes.length === 0) {
                const p = document.createElement('p');
                p.innerHTML = '<br>';
                editor.appendChild(p);
            }
        },

        // =============================================================
        // PUNTOS DE CORTE Y DIVISIÓN PRECISA DE BLOQUES POR PALABRA/NODO
        // =============================================================
        collectBreakPoints(container) {
            const points = [];
            const walker = document.createTreeWalker(
                container,
                NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                {
                    acceptNode(node) {
                        if (node.nodeType === 1 && node.hasAttribute('data-ec-cursor')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        if (node.nodeType === 3) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        if (node.nodeType === 1 && (node.tagName === 'BR' || node.tagName === 'IMG')) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        return NodeFilter.FILTER_SKIP;
                    }
                }
            );

            let node;
            while ((node = walker.nextNode())) {
                if (node.nodeType === 3) {
                    const text = node.nodeValue;
                    if (!text) continue;
                    points.push({ container: node, offset: 0 });
                    const regex = /\s+/g;
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        points.push({ container: node, offset: match.index + match[0].length });
                    }
                    if (points[points.length - 1]?.offset !== text.length) {
                        points.push({ container: node, offset: text.length });
                    }
                } else if (node.nodeType === 1) {
                    const parent = node.parentNode;
                    if (parent) {
                        const idx = Array.prototype.indexOf.call(parent.childNodes, node);
                        points.push({ container: parent, offset: idx + 1 });
                    }
                }
            }
            return points;
        },

        splitBlockToFit(block, editor) {
            if (!block || !editor) return null;

            // Listas ordenadas y desordenadas
            if ((block.tagName === 'OL' || block.tagName === 'UL') && block.children.length > 0) {
                return this.splitListBlock(block, editor);
            }

            // Tablas con múltiples filas
            if (block.tagName === 'TABLE' && block.querySelectorAll('tr').length > 1) {
                return this.splitTableBlock(block, editor);
            }

            // Elementos atómicos que no deben dividirse internamente (Imágenes, Separadores, Callouts, Figuras)
            const atomicTags = ['IMG', 'HR', 'IFRAME', 'FIGURE'];
            if (atomicTags.includes(block.tagName) || block.classList.contains('edu-callout') || block.classList.contains('toc-block')) {
                return null;
            }

            const editorRect = editor.getBoundingClientRect();
            const maxBottom = editorRect.bottom + 0.5;

            const points = this.collectBreakPoints(block);
            if (points.length <= 1) return null;

            const testRange = document.createRange();
            let lo = 0;
            let hi = points.length - 1;
            let bestIdx = -1;

            while (lo <= hi) {
                const mid = Math.floor((lo + hi) / 2);
                const pt = points[mid];

                try {
                    if (pt.container.nodeType === 3) {
                        const startOff = Math.max(0, pt.offset - 1);
                        const endOff = Math.max(startOff + 1, pt.offset);
                        testRange.setStart(pt.container, startOff);
                        testRange.setEnd(pt.container, Math.min(endOff, pt.container.length));
                    } else {
                        testRange.setStart(pt.container, Math.max(0, pt.offset - 1));
                        testRange.setEnd(pt.container, pt.offset);
                    }

                    const rects = testRange.getClientRects();
                    let rectBottom = 0;
                    if (rects.length > 0) {
                        rectBottom = rects[rects.length - 1].bottom;
                    } else {
                        const bRect = testRange.getBoundingClientRect();
                        rectBottom = bRect.bottom;
                    }

                    if (rectBottom > 0 && rectBottom <= maxBottom) {
                        bestIdx = mid;
                        lo = mid + 1;
                    } else {
                        hi = mid - 1;
                    }
                } catch (_) {
                    hi = mid - 1;
                }
            }

            // Si encontramos un punto de corte válido intermedio
            if (bestIdx > 0 && bestIdx < points.length - 1) {
                const splitPt = points[bestIdx];
                const splitRange = document.createRange();
                splitRange.setStart(splitPt.container, splitPt.offset);
                splitRange.setEnd(block, block.childNodes.length);

                const fragment = splitRange.extractContents();
                const newBlock = block.cloneNode(false);
                newBlock.removeAttribute('id');
                newBlock.appendChild(fragment);

                const origHasContent = block.textContent.trim() || block.querySelector('img, table, br');
                const newHasContent = newBlock.textContent.trim() || newBlock.querySelector('img, table, br, [data-ec-cursor]');

                if (!origHasContent || !newHasContent) {
                    // Revertir la extracción para evitar pérdida de nodos
                    block.appendChild(fragment);
                    return null;
                }

                return newBlock;
            }

            return null;
        },

        splitListBlock(listBlock, editor) {
            const isOrdered = listBlock.tagName === 'OL';
            const items = Array.from(listBlock.children).filter(c => c.tagName === 'LI');
            if (items.length <= 1) {
                if (items.length === 1) {
                    const singleLi = items[0];
                    const overflowLi = this.splitBlockToFit(singleLi, editor);
                    if (overflowLi) {
                        const newList = listBlock.cloneNode(false);
                        newList.removeAttribute('id');
                        if (isOrdered) {
                            const startVal = parseInt(listBlock.getAttribute('start') || '1', 10);
                            newList.setAttribute('start', (startVal + 1).toString());
                        }
                        newList.appendChild(overflowLi);
                        return newList;
                    }
                }
                return null;
            }

            const editorRect = editor.getBoundingClientRect();
            const maxBottom = editorRect.bottom + 0.5;

            let splitIndex = -1;
            for (let i = 0; i < items.length; i++) {
                const itemRect = items[i].getBoundingClientRect();
                if (itemRect.bottom > maxBottom) {
                    splitIndex = i;
                    break;
                }
            }

            if (splitIndex === -1) return null;

            if (splitIndex === 0) {
                const overflowLi = this.splitBlockToFit(items[0], editor);
                if (overflowLi) {
                    const newList = listBlock.cloneNode(false);
                    newList.removeAttribute('id');
                    if (isOrdered) {
                        const startVal = parseInt(listBlock.getAttribute('start') || '1', 10);
                        newList.setAttribute('start', startVal.toString());
                    }
                    newList.appendChild(overflowLi);
                    for (let j = 1; j < items.length; j++) {
                        newList.appendChild(items[j]);
                    }
                    return newList;
                }
                return null;
            }

            const overflowLi = this.splitBlockToFit(items[splitIndex], editor);
            const newList = listBlock.cloneNode(false);
            newList.removeAttribute('id');
            if (isOrdered) {
                const baseStart = parseInt(listBlock.getAttribute('start') || '1', 10);
                const startVal = baseStart + splitIndex;
                newList.setAttribute('start', startVal.toString());
            }

            if (overflowLi) {
                newList.appendChild(overflowLi);
                for (let j = splitIndex + 1; j < items.length; j++) {
                    newList.appendChild(items[j]);
                }
            } else {
                for (let j = splitIndex; j < items.length; j++) {
                    newList.appendChild(items[j]);
                }
            }

            return (newList.children.length > 0) ? newList : null;
        },

        splitTableBlock(tableBlock, editor) {
            if (!tableBlock || tableBlock.tagName !== 'TABLE') return null;

            const tbody = tableBlock.querySelector('tbody') || tableBlock;
            const rows = Array.from(tbody.querySelectorAll(':scope > tr'));
            if (rows.length <= 1) return null;

            const editorRect = editor.getBoundingClientRect();
            const maxBottom = editorRect.bottom + 0.5;

            let splitIndex = -1;
            for (let i = 0; i < rows.length; i++) {
                const rowRect = rows[i].getBoundingClientRect();
                if (rowRect.bottom > maxBottom) {
                    splitIndex = i;
                    break;
                }
            }

            if (splitIndex <= 0) return null;

            // Clonar la tabla para la siguiente página
            const newTable = tableBlock.cloneNode(false);
            newTable.removeAttribute('id');
            newTable.setAttribute('data-ec-table-part', 'cont');

            // Clonar thead si existe para que los títulos de columna se mantengan
            const thead = tableBlock.querySelector('thead');
            if (thead) {
                newTable.appendChild(thead.cloneNode(true));
            }

            const newTbody = tbody.cloneNode(false);
            newTable.appendChild(newTbody);

            // Mover filas desde splitIndex en adelante a la nueva tabla
            for (let j = splitIndex; j < rows.length; j++) {
                newTbody.appendChild(rows[j]);
            }

            tableBlock.setAttribute('data-ec-table-part', 'head');

            return (newTbody.children.length > 0) ? newTable : null;
        },

        healFragmentedTables(containerOrElement) {
            if (!containerOrElement) return;

            const isVisuallyEmpty = (node) => {
                if (!node) return true;
                if (node.nodeType === 3) {
                    return !node.textContent.replace(/[\s\u00A0\u200B]/g, '');
                }
                if (node.nodeType === 1) {
                    if (['IMG', 'TABLE', 'IFRAME', 'CANVAS', 'HR', 'FIGURE'].includes(node.tagName)) {
                        return false;
                    }
                    const text = node.textContent.replace(/[\s\u00A0\u200B]/g, '');
                    if (text.length > 0) return false;
                    const media = node.querySelector('img, table, iframe, canvas, hr, figure');
                    if (media) return false;
                    return true;
                }
                return true;
            };

            const allTables = Array.from(containerOrElement.querySelectorAll('table'));
            for (let i = 0; i < allTables.length - 1; i++) {
                const t1 = allTables[i];
                const t2 = allTables[i + 1];
                if (!t1.parentNode || !t2.parentNode) continue;

                // Verificar si todos los nodos intermedios entre t1 y t2 están vacíos
                let sibling = t1.nextSibling;
                let onlyEmpty = true;
                const nodesToRemove = [];

                while (sibling && sibling !== t2) {
                    if (!isVisuallyEmpty(sibling)) {
                        onlyEmpty = false;
                        break;
                    }
                    nodesToRemove.push(sibling);
                    sibling = sibling.nextSibling;
                }

                if (onlyEmpty && sibling === t2) {
                    const tbody1 = t1.querySelector('tbody') || t1;
                    const tbody2 = t2.querySelector('tbody') || t2;

                    // Si t2 tiene thead idéntico o redundante, removerlo para no duplicar cabeceras en medio
                    const t2Head = t2.querySelector('thead');
                    if (t2Head) t2Head.remove();

                    // Mover filas de t2 a tbody1
                    Array.from(tbody2.querySelectorAll(':scope > tr')).forEach(tr => {
                        tbody1.appendChild(tr);
                    });

                    // Si t2 tenía filas directamente fuera de tbody
                    Array.from(t2.querySelectorAll(':scope > tr')).forEach(tr => {
                        tbody1.appendChild(tr);
                    });

                    // Eliminar los nodos vacíos intermedios (<p><br></p>, etc.)
                    nodesToRemove.forEach(n => n.remove());

                    // Eliminar la segunda tabla vacía
                    t2.remove();
                    allTables.splice(i + 1, 1);
                    i--; // Re-evaluar por si hay más tablas continuas
                }
            }
        },

        // =============================================================
        // HELPER: Obtener el último hijo movible (que no sea el cursor marker)
        // =============================================================
        getLastMovableChild(editor) {
            let child = editor.lastElementChild;
            while (child && child.hasAttribute('data-ec-cursor')) {
                child = child.previousElementSibling;
            }
            return child;
        },

        // =============================================================
        // CREACIÓN DE PÁGINAS
        // =============================================================
        createPageDOM(pageNum, contentHTML = '<p><br></p>') {
            const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
            const hf = sheet?.headerFooter || {
                showHeader: false,
                showFooter: false,
                headerText: '',
                footerText: '',
                showPageNumbers: false
            };

            const showHeader = hf.showHeader || hf.showPageNumbers;
            const showFooter = hf.showFooter || hf.showPageNumbers;

            const pageDiv = document.createElement('div');
            pageDiv.className = 'page-sheet';
            pageDiv.setAttribute('data-page', pageNum);

            const spacing = sheet?.lineSpacing || '15';
            pageDiv.classList.add(`spacing-${spacing}`);

            const fontFamily = (sheet?.fontFamily || 'Plus Jakarta Sans').trim().replace(/^['"]|['"]$/g, '');
            if (typeof window.ensureGoogleFontLoaded === 'function' && fontFamily) {
                window.ensureGoogleFontLoaded(fontFamily);
            }

            const spellcheckAttr = (window.SpellCheckManager && window.SpellCheckManager.browserSpellcheck) ? 'true' : 'false';
            const langCode = window.SpellCheckManager ? window.SpellCheckManager.getLangCode() : 'es';

            pageDiv.innerHTML = `
                <div class="page-header-bar ${!showHeader ? 'zone-hidden' : ''}" contenteditable="false">
                    <span class="page-header-text truncate max-w-[280px] font-semibold text-[10px] text-slate-400 dark:text-slate-500">${hf.headerText || ''}</span>
                    <span class="page-counter-badge text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full text-slate-500 dark:text-slate-400 ${!hf.showPageNumbers ? 'hidden' : ''}">Pág. ${pageNum} de ${this.pageCount || 1}</span>
                </div>
                <div class="page-editor-surface" style="font-family: '${fontFamily}', sans-serif;" contenteditable="${window.isAuditMode ? 'false' : 'true'}" spellcheck="${spellcheckAttr}" lang="${langCode}">
                    ${contentHTML}
                </div>
                <div class="page-footer-bar ${!showFooter ? 'zone-hidden' : ''}" contenteditable="false">
                    <span class="page-footer-text font-medium text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">${hf.footerText || ''}</span>
                    <span class="page-footer-num font-bold text-[10px] text-slate-500 dark:text-slate-400 ${!hf.showPageNumbers ? 'hidden' : ''}">${pageNum}</span>
                </div>
            `;

            this.bindPageEvents(pageDiv);
            return pageDiv;
        },

        bindPageEvents(pageDiv) {
            const editor = pageDiv.querySelector('.page-editor-surface');
            if (!editor) return;

            pageDiv.addEventListener('click', (e) => {
                if (e.target === pageDiv && !window.isAuditMode) {
                    this.focusActiveEditor(false);
                }
            });

            // Evitar cualquier desplazamiento de scroll interno en la superficie física de la hoja
            editor.addEventListener('scroll', () => {
                if (editor.scrollTop !== 0) editor.scrollTop = 0;
                if (editor.scrollLeft !== 0) editor.scrollLeft = 0;
            }, { passive: true });

            editor.oninput = () => {
                if (editor.scrollTop !== 0) editor.scrollTop = 0;
                if (editor.scrollLeft !== 0) editor.scrollLeft = 0;

                DocStatsManager.update();
                EduContaTextEngine.saveActiveSelection();
                EduContaTextEngine.updateToolbarState();
                TextDocStateManager.triggerAutoSave();
                TextDocStateManager.debouncePushHistory();
                window.CollabPresenceManager?.broadcastContent(null, TextDocStateManager.activeSheetIndex);
                this.scrollCaretIntoView(false);
                this.debouncePaginate();
            };

            editor.onfocus = () => {
                if (editor.scrollTop !== 0) editor.scrollTop = 0;
                if (editor.scrollLeft !== 0) editor.scrollLeft = 0;
                EduContaTextEngine.updateToolbarState();
                this.scrollCaretIntoView(false);
            };
            editor.onmouseup = () => {
                EduContaTextEngine.saveActiveSelection(true);
                EduContaTextEngine.updateToolbarState();
                this.scrollCaretIntoView(false);
            };
            editor.onkeyup = (e) => {
                EduContaTextEngine.saveActiveSelection(true);
                EduContaTextEngine.updateToolbarState();
                const isUpNav = (e.key === 'ArrowUp' || e.key === 'PageUp');
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Enter', 'Backspace'].includes(e.key)) {
                    this.scrollCaretIntoView(isUpNav);
                }
            };

            editor.onkeydown = (e) => {
                if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
                    const k = e.key.toLowerCase();
                    if (k === 'b') {
                        e.preventDefault();
                        window.EduContaTextEngine?.execFormat('bold');
                        return;
                    } else if (k === 'i') {
                        e.preventDefault();
                        window.EduContaTextEngine?.execFormat('italic');
                        return;
                    } else if (k === 'u') {
                        e.preventDefault();
                        window.EduContaTextEngine?.execFormat('underline');
                        return;
                    }
                }

                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.insertPageBreak();
                    return;
                }

                if (e.key === 'Backspace') {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
                        const range = sel.getRangeAt(0);
                        if (this.isCaretAtStart(editor, range)) {
                            const pageNum = parseInt(pageDiv.getAttribute('data-page'), 10);
                            if (pageNum > 1) {
                                e.preventDefault();
                                this.mergeWithPreviousPage(pageNum);
                                return;
                            }
                        }
                    }
                }

                // Flecha arriba al inicio → ir a la página anterior
                if (e.key === 'ArrowUp') {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
                        const range = sel.getRangeAt(0);
                        if (this.isCaretAtStart(editor, range)) {
                            const pageNum = parseInt(pageDiv.getAttribute('data-page'), 10);
                            if (pageNum > 1) {
                                e.preventDefault();
                                const container = this.getContainer();
                                const pages = Array.from(container.querySelectorAll('.page-sheet'));
                                const prevEditor = pages[pageNum - 2]?.querySelector('.page-editor-surface');
                                if (prevEditor) {
                                    prevEditor.focus({ preventScroll: true });
                                    const r = document.createRange();
                                    r.selectNodeContents(prevEditor);
                                    r.collapse(false);
                                    sel.removeAllRanges();
                                    sel.addRange(r);
                                }
                            }
                        }
                    }
                }

                // Flecha abajo al final → ir a la página siguiente
                if (e.key === 'ArrowDown') {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
                        const range = sel.getRangeAt(0);
                        if (this.isCaretAtEnd(editor, range)) {
                            const pageNum = parseInt(pageDiv.getAttribute('data-page'), 10);
                            const container = this.getContainer();
                            const pages = Array.from(container.querySelectorAll('.page-sheet'));
                            if (pageNum < pages.length) {
                                e.preventDefault();
                                const nextEditor = pages[pageNum]?.querySelector('.page-editor-surface');
                                if (nextEditor) {
                                    nextEditor.focus({ preventScroll: true });
                                    const r = document.createRange();
                                    r.selectNodeContents(nextEditor);
                                    r.collapse(true);
                                    sel.removeAllRanges();
                                    sel.addRange(r);
                                }
                            }
                        }
                    }
                }
            };

            editor.onpaste = (e) => {
                e.preventDefault();

                // 1. Detectar si hay archivos o imágenes en el portapapeles (capturas, PNGs transparentes, etc.)
                const items = (e.clipboardData || window.clipboardData)?.items;
                if (items) {
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].type && items[i].type.indexOf('image') !== -1) {
                            const blob = items[i].getAsFile();
                            if (blob) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    EduContaTextEngine.insertImageNode(event.target.result, 'Imagen pegada');
                                };
                                reader.readAsDataURL(blob);
                                return;
                            }
                        }
                    }
                }

                // 2. Si es texto o HTML
                const text = (e.clipboardData || window.clipboardData)?.getData('text/html') ||
                    (e.clipboardData || window.clipboardData)?.getData('text/plain') || '';
                EduContaTextEngine.handleSmartPaste(text);
                setTimeout(() => this.paginate(), 40);
            };

            // ── Drag & Drop externo: insertar imágenes arrastradas desde el escritorio ──
            editor.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'copy';
            });

            editor.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });

            editor.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const files = e.dataTransfer?.files;
                if (!files || files.length === 0) return;

                // Colocar el cursor en la posición del drop dentro del editor
                let dropRange = null;
                if (document.caretRangeFromPoint) {
                    dropRange = document.caretRangeFromPoint(e.clientX, e.clientY);
                } else if (document.caretPositionFromPoint) {
                    const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
                    if (pos) {
                        dropRange = document.createRange();
                        dropRange.setStart(pos.offsetNode, pos.offset);
                        dropRange.collapse(true);
                    }
                }
                if (dropRange) {
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(dropRange);
                }

                for (const file of files) {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            EduContaTextEngine.insertImageNode(event.target.result, file.name || 'Imagen importada');
                        };
                        reader.readAsDataURL(file);
                    }
                }
            });
        },

        isCaretAtStart(editor, range) {
            try {
                const preRange = document.createRange();
                preRange.selectNodeContents(editor);
                preRange.setEnd(range.startContainer, range.startOffset);
                return preRange.toString().length === 0;
            } catch (_) {
                return false;
            }
        },

        isCaretAtEnd(editor, range) {
            try {
                const postRange = document.createRange();
                postRange.selectNodeContents(editor);
                postRange.setStart(range.endContainer, range.endOffset);
                return postRange.toString().length === 0;
            } catch (_) {
                return false;
            }
        },

        mergeWithPreviousPage(pageNum) {
            const container = this.getContainer();
            const pages = Array.from(container.querySelectorAll('.page-sheet'));
            const currentPage = pages[pageNum - 1];
            const prevPage    = pages[pageNum - 2];
            if (!currentPage || !prevPage) return;

            const currentEditor = currentPage.querySelector('.page-editor-surface');
            const prevEditor    = prevPage.querySelector('.page-editor-surface');
            if (!currentEditor || !prevEditor) return;

            // 1. Anotar punto de union ANTES de mover contenido
            const joinAnchor = prevEditor.lastChild;

            // 2. Filtrar el <p><br> placeholder que contenteditable crea en editor vacio
            //    Solo se filtra si es el UNICO nodo (placeholder puro, sin contenido real)
            const nodesToMove = [];
            let child = currentEditor.firstChild;
            while (child) {
                const next = child.nextSibling;
                const isPlaceholder =
                    child.nodeType === 1 && child.nodeName === 'P' &&
                    (child.innerHTML === '<br>' || child.innerHTML === '') &&
                    child === currentEditor.firstChild && !child.nextSibling;
                if (!isPlaceholder) nodesToMove.push(child);
                child = next;
            }

            // 3. Mover los nodos validos a la pagina anterior
            nodesToMove.forEach(n => prevEditor.appendChild(n));

            // 4. Eliminar la pagina actual y actualizar contadores
            currentPage.remove();
            this.pageCount = Math.max(1, pages.length - 1);
            this.updateAllPageNumbers();
            this.paginate();

            // 5. Colocar cursor en el punto de union (inicio del contenido movido)
            prevEditor.focus({ preventScroll: true });
            try {
                const sel2 = window.getSelection();
                const r2   = document.createRange();
                const firstMoved = joinAnchor ? joinAnchor.nextSibling : prevEditor.firstChild;
                if (firstMoved) {
                    r2.setStart(firstMoved, 0);
                    r2.collapse(true);
                } else {
                    r2.selectNodeContents(prevEditor);
                    r2.collapse(false);
                }
                sel2.removeAllRanges();
                sel2.addRange(r2);
            } catch (_) {
                // Fallback: cursor al final de pagina anterior
                const s = window.getSelection();
                const r = document.createRange();
                r.selectNodeContents(prevEditor);
                r.collapse(false);
                s.removeAllRanges();
                s.addRange(r);
            }

            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            TextDocStateManager.triggerAutoSave();
        },

        // =============================================================
        // DEBOUNCE: Usa setTimeout en vez de rAF para dar tiempo al layout
        // =============================================================
        debouncePaginate() {
            if (this._debounceTimer) clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => {
                this.paginate();
            }, 220);
        },

        // =============================================================
        // CARGA DE CONTENIDO
        // =============================================================
        loadContent(htmlContent = '<p><br></p>', autoFocus = true) {
            const container = this.getContainer();
            if (!container) return;

            container.innerHTML = '';

            let clean = htmlContent;
            clean = clean
                .replace(/<div class="first-page-header[\s\S]*?<\/div>/gi, '')
                .replace(/<div class="last-page-footer[\s\S]*?<\/div>/gi, '')
                .replace(/<div class="doc-page-break-widget[\s\S]*?<\/div><\/div><\/div>/gi, '')
                .replace(/<div class="doc-page-break-widget[\s\S]*?<\/div>/gi, '')
                .replace(/<span[^>]*data-ec-cursor[^>]*><\/span>/gi, '');

            if (!clean.trim()) clean = '<p><br></p>';

            // Reparar tablas fragmentadas y sanear en el HTML inicial
            const temp = document.createElement('div');
            temp.innerHTML = clean;
            temp.querySelectorAll('script, iframe, object, embed, meta, link').forEach(el => el.remove());
            temp.querySelectorAll('*').forEach(el => {
                Array.from(el.attributes).forEach(attr => {
                    const attrName = attr.name.toLowerCase();
                    const attrVal = String(attr.value || '').trim().toLowerCase();
                    if (attrName.startsWith('on') || ((attrName === 'href' || attrName === 'src' || attrName === 'xlink:href' || attrName === 'action' || attrName === 'formaction') && attrVal.startsWith('javascript:'))) {
                        el.removeAttribute(attr.name);
                    }
                });
            });
            this.healFragmentedTables(temp);
            clean = temp.innerHTML;

            const firstPage = this.createPageDOM(1, clean);
            container.appendChild(firstPage);
            this.pageCount = 1;

            // Paginación diferida para que el layout se estabilice
            requestAnimationFrame(() => {
                this.paginate();
                if (autoFocus && !window.isAuditMode) {
                    this.focusActiveEditor(true);
                }
            });
        },

        // =============================================================
        // PAGINACIÓN PRINCIPAL — 3 Pases
        //   Pase 1: Empujar desborde hacia adelante
        //   Pase 2: Consolidar (jalar contenido de la siguiente si cabe)
        //   Pase 3: Eliminar páginas vacías finales
        // =============================================================
        paginate() {
            if (this.isPaginating) {
                this.paginateQueued = true;
                return;
            }
            this.isPaginating = true;

            const container = this.getContainer();
            if (!container) {
                this.isPaginating = false;
                return;
            }

            let pages = Array.from(container.querySelectorAll('.page-sheet'));
            if (pages.length === 0) {
                const firstPage = this.createPageDOM(1, '<p><br></p>');
                container.appendChild(firstPage);
                pages = [firstPage];
            }

            // Comprobar si se requiere paginación real para no alterar el DOM ni el cursor durante escritura normal
            const needsWork = pages.some((p, idx) => {
                const ed = p.querySelector('.page-editor-surface');
                if (!ed) return false;
                if (ed.scrollHeight > ed.clientHeight + 1) return true;
                if (idx > 0 && ed.children.length === 0) return true;
                return false;
            });

            if (!needsWork && pages.length === 1) {
                this.isPaginating = false;
                return;
            }

            // Guardar cursor antes de cualquier manipulación DOM
            this.saveCursor();

            // Normalizar todos los editores (texto suelto → <p>)
            pages.forEach(p => {
                const ed = p.querySelector('.page-editor-surface');
                if (ed) this.normalizeEditor(ed);
            });

            // ─── PASE 1: Empujar desborde hacia adelante ───
            let globalLimit = Math.max(1000, pages.length * 150);
            for (let pIdx = 0; pIdx < pages.length && globalLimit > 0; pIdx++) {
                const page = pages[pIdx];
                const editor = page.querySelector('.page-editor-surface');
                if (!editor) continue;

                let pushLimit = 150;
                while (editor.scrollHeight > editor.clientHeight + 1 && pushLimit-- > 0 && globalLimit-- > 0) {
                    // Asegurar que existe la página siguiente
                    if (pIdx + 1 >= pages.length) {
                        const newPage = this.createPageDOM(pages.length + 1, '');
                        container.appendChild(newPage);
                        pages = Array.from(container.querySelectorAll('.page-sheet'));
                    }
                    const nextEditor = pages[pIdx + 1]?.querySelector('.page-editor-surface');
                    if (!nextEditor) break;

                    // Contar hijos movibles (excluyendo marcador de cursor)
                    const movableChildren = Array.from(editor.children).filter(
                        c => !c.hasAttribute('data-ec-cursor')
                    );
                    if (movableChildren.length === 0) break;

                    const lastChild = movableChildren[movableChildren.length - 1];

                    // Intentar dividir el último hijo por palabra / línea
                    const overflowBlock = this.splitBlockToFit(lastChild, editor);

                    if (overflowBlock) {
                        // El último bloque se dividió: el fragmento que desborda va al inicio de la siguiente página
                        nextEditor.insertBefore(overflowBlock, nextEditor.firstChild);
                    } else {
                        // No se pudo dividir (elemento atómico o no cabe nada de él)
                        if (movableChildren.length > 1) {
                            // Mover el elemento completo a la siguiente página
                            nextEditor.insertBefore(lastChild, nextEditor.firstChild);
                        } else {
                            // Era el único elemento y no se puede reducir más
                            break;
                        }
                    }
                }
            }

            // ─── PASE 2: Consolidar — jalar del siguiente si cabe ───
            pages = Array.from(container.querySelectorAll('.page-sheet'));
            for (let i = 0; i < pages.length - 1; i++) {
                const editor = pages[i].querySelector('.page-editor-surface');
                const nextEditor = pages[i + 1]?.querySelector('.page-editor-surface');
                if (!editor || !nextEditor) continue;

                let pullLimit = 100;
                while (pullLimit-- > 0) {
                    const candidate = Array.from(nextEditor.children).find(
                        c => !c.hasAttribute('data-ec-cursor')
                    );
                    if (!candidate) break;

                    const lastEl = this.getLastMovableChild(editor);
                    
                    // 1. Si ambos son tablas: fusionar filas de candidate en lastEl
                    const isSameTable = lastEl && 
                        lastEl.tagName === 'TABLE' && 
                        candidate.tagName === 'TABLE';

                    // 2. Si ambos son listas del mismo tipo (UL o OL), podemos mover ítems <li> uno a uno
                    const isSameList = lastEl && 
                        (lastEl.tagName === 'UL' || lastEl.tagName === 'OL') && 
                        lastEl.tagName === candidate.tagName;

                    if (isSameTable) {
                        const targetTbody = lastEl.querySelector('tbody') || lastEl;
                        const srcTbody = candidate.querySelector('tbody') || candidate;
                        const firstRow = srcTbody.querySelector(':scope > tr');

                        if (!firstRow) {
                            candidate.remove();
                            continue;
                        }

                        // Mover la primera fila de la tabla candidata a la tabla anterior
                        targetTbody.appendChild(firstRow);

                        // Si la tabla candidata se quedó sin filas, eliminarla
                        const remainingRows = srcTbody.querySelectorAll(':scope > tr');
                        if (remainingRows.length === 0) {
                            candidate.remove();
                        }

                        if (editor.scrollHeight > editor.clientHeight + 1) {
                            // Desbordó: volver a dividir la tabla
                            const overflowTable = this.splitTableBlock(lastEl, editor);
                            if (overflowTable) {
                                nextEditor.insertBefore(overflowTable, nextEditor.firstChild);
                            } else {
                                if (!candidate.parentNode) {
                                    nextEditor.insertBefore(candidate, nextEditor.firstChild);
                                }
                                srcTbody.insertBefore(firstRow, srcTbody.firstChild);
                            }
                            break; // Página llena
                        }
                    } else if (isSameList) {
                        const firstLi = Array.from(candidate.children).find(c => c.tagName === 'LI');
                        if (!firstLi) {
                            candidate.remove();
                            continue;
                        }

                        // Mover el primer <li> del candidato a la lista en la página actual
                        lastEl.appendChild(firstLi);

                        if (candidate.children.length === 0) {
                            candidate.remove();
                        } else if (candidate.tagName === 'OL') {
                            const currentStart = parseInt(candidate.getAttribute('start') || '1', 10);
                            candidate.setAttribute('start', (currentStart + 1).toString());
                        }

                        if (editor.scrollHeight > editor.clientHeight + 1) {
                            // Desbordó: dividir la lista de nuevo
                            const overflowList = this.splitListBlock(lastEl, editor);
                            if (overflowList) {
                                nextEditor.insertBefore(overflowList, nextEditor.firstChild);
                            } else {
                                if (!candidate.parentNode) {
                                    nextEditor.insertBefore(candidate, nextEditor.firstChild);
                                }
                                candidate.insertBefore(firstLi, candidate.firstChild);
                            }
                            break; // Página llena
                        }
                    } else {
                        // Para cualquier otro elemento (<p>, <h2>, <blockquote>, etc.):
                        // Mover el elemento COMPLETO (nunca fusionar párrafos o viñetas horizontalmente)
                        editor.appendChild(candidate);

                        if (editor.scrollHeight > editor.clientHeight + 1) {
                            // No cupo entero: intentar dividirlo si es divisible por palabras
                            const overflow = this.splitBlockToFit(candidate, editor);
                            if (overflow) {
                                nextEditor.insertBefore(overflow, nextEditor.firstChild);
                            } else {
                                // Devolver entero a la siguiente página
                                nextEditor.insertBefore(candidate, nextEditor.firstChild);
                            }
                            break; // Página llena
                        }
                    }
                }
            }

            // ─── PASE 3: Eliminar páginas vacías finales (mantener mínimo 1) ───
            pages = Array.from(container.querySelectorAll('.page-sheet'));
            for (let i = pages.length - 1; i > 0; i--) {
                const editor = pages[i].querySelector('.page-editor-surface');
                if (!editor) continue;

                // Verificar si la página está vacía (ignorando marcadores de cursor)
                const realChildren = Array.from(editor.children).filter(
                    c => !c.hasAttribute('data-ec-cursor')
                );
                const hasRealContent = realChildren.some(c => {
                    const t = c.textContent?.trim();
                    const h = c.innerHTML?.trim();
                    const hasMedia = c.querySelector('img, table, iframe');
                    return t || (h && h !== '<br>' && h !== '<br/>') || hasMedia;
                });

                if (!hasRealContent) {
                    // Mover marcadores de cursor o selección si existen aquí
                    editor.querySelectorAll('[data-ec-cursor]').forEach(cMarker => {
                        const prevEditor = pages[i - 1]?.querySelector('.page-editor-surface');
                        if (prevEditor) prevEditor.appendChild(cMarker);
                    });
                    if (document.activeElement === editor) {
                        const prevEditor = pages[i - 1]?.querySelector('.page-editor-surface');
                        if (prevEditor) prevEditor.focus({ preventScroll: true });
                    }
                    pages[i].remove();
                } else {
                    break; // Detenerse en la primera página no vacía desde el final
                }
            }

            // Actualizar conteo y numeración
            pages = Array.from(container.querySelectorAll('.page-sheet'));
            this.pageCount = Math.max(1, pages.length);
            this.updateAllPageNumbers();

            // Restaurar cursor
            this.restoreCursor();

            // Re-sincronizar compensación geométrica de zoom (dimensiones de scroll en wrapper)
            window.PageLayoutManager?.applyZoom(true);

            this.isPaginating = false;

            // Procesar paginación encolada
            if (this.paginateQueued) {
                this.paginateQueued = false;
                setTimeout(() => this.paginate(), 20);
            }
        },

        updateAllPageNumbers() {
            const container = this.getContainer();
            if (!container) return;

            const sheet = TextDocStateManager.currentProject?.sheets[TextDocStateManager.activeSheetIndex];
            const hf = sheet?.headerFooter || {
                showHeader: false,
                showFooter: false,
                headerText: '',
                footerText: '',
                showPageNumbers: false
            };

            const total = this.pageCount || 1;
            const showHeader = hf.showHeader || hf.showPageNumbers;
            const showFooter = hf.showFooter || hf.showPageNumbers;

            const pages = Array.from(container.querySelectorAll('.page-sheet'));
            pages.forEach((page, idx) => {
                const pageNum = idx + 1;
                page.setAttribute('data-page', pageNum);

                // Header
                const headerBar = page.querySelector('.page-header-bar');
                if (headerBar) {
                    headerBar.classList.toggle('zone-hidden', !showHeader);
                    const hText = headerBar.querySelector('.page-header-text');
                    if (hText) hText.textContent = hf.headerText || '';
                    const hBadge = headerBar.querySelector('.page-counter-badge');
                    if (hBadge) {
                        hBadge.textContent = `Pág. ${pageNum} de ${total}`;
                        hBadge.classList.toggle('hidden', !hf.showPageNumbers);
                    }
                }

                // Footer
                const footerBar = page.querySelector('.page-footer-bar');
                if (footerBar) {
                    footerBar.classList.toggle('zone-hidden', !showFooter);
                    const fText = footerBar.querySelector('.page-footer-text');
                    if (fText) fText.textContent = hf.footerText || '';
                    const fNum = footerBar.querySelector('.page-footer-num');
                    if (fNum) {
                        fNum.textContent = `${pageNum}`;
                        fNum.classList.toggle('hidden', !hf.showPageNumbers);
                    }
                }
            });

            const statPages = document.getElementById('stat-pages');
            if (statPages) statPages.textContent = total.toString();
        },

        insertPageBreak() {
            if (window.isAuditMode) return;

            const container = this.getContainer();
            if (!container) return;

            const activeEditor = this.getActiveEditor();
            const currentPage = activeEditor ? activeEditor.closest('.page-sheet') : null;
            const pageNum = currentPage ? parseInt(currentPage.getAttribute('data-page'), 10) : this.pageCount;

            const newPage = this.createPageDOM(pageNum + 1, '<p><br></p>');
            if (currentPage && currentPage.nextSibling) {
                container.insertBefore(newPage, currentPage.nextSibling);
            } else {
                container.appendChild(newPage);
            }

            this.pageCount++;
            this.updateAllPageNumbers();

            const newEditor = newPage.querySelector('.page-editor-surface');
            if (newEditor) {
                newEditor.focus({ preventScroll: true });
            }

            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            TextDocStateManager.triggerAutoSave();
            TextDocStateManager.showToast('Salto de página insertado');
        },

        getCleanHTML() {
            const container = this.getContainer();
            if (!container) return '<p><br></p>';

            const editors = Array.from(container.querySelectorAll('.page-editor-surface'));
            if (editors.length === 0) return '<p><br></p>';

            const tempDiv = document.createElement('div');
            editors.forEach(ed => {
                const clone = ed.cloneNode(true);
                // Remover marcadores de cursor y clases temporales de selección y color
                clone.querySelectorAll('[data-ec-cursor]').forEach(m => m.remove());
                clone.querySelectorAll('.doc-img-selected').forEach(img => img.classList.remove('doc-img-selected'));
                clone.querySelectorAll('.spellcheck-highlight-active').forEach(m => {
                    const parent = m.parentNode;
                    if (parent) {
                        parent.replaceChild(document.createTextNode(m.textContent), m);
                        parent.normalize();
                    }
                });
                clone.querySelectorAll('.educonta-color-preview-target').forEach(el => {
                    el.classList.remove('educonta-color-preview-target');
                    delete el.dataset.ecOrigColor;
                });
                clone.querySelectorAll('span[data-ec-pending], span[data-ec-pending-color], span[data-ec-pending-bg]').forEach(s => {
                    if (s.textContent.replace(/\u200B/g, '').trim() === '') {
                        s.remove();
                    } else {
                        s.removeAttribute('data-ec-pending');
                        s.removeAttribute('data-ec-pending-color');
                        s.removeAttribute('data-ec-pending-bg');
                    }
                });
                while (clone.firstChild) {
                    tempDiv.appendChild(clone.firstChild);
                }
            });

            // Re-unificar tablas partidas y limpiar atributos temporales
            this.healFragmentedTables(tempDiv);
            tempDiv.querySelectorAll('[data-ec-table-part]').forEach(t => t.removeAttribute('data-ec-table-part'));

            return tempDiv.innerHTML.replace(/\u200B/g, '').trim() || '<p><br></p>';
        },

        getPagesContent() {
            return [this.getCleanHTML()];
        }
    };


    /* ===================================================================
     * MODULO: text-engine.js
     * =================================================================== */
/**
 * text-engine.js — EduContaTextEngine
 * Formateo de texto enriquecido, fuentes, colores, tablas y pegado limpio.
 * EduConta SV
 */




    const EduContaTextEngine = {
        _savedRange: null,
        _savedEditor: null,
        _fontPreviewState: null,
        _colorPreviewState: null,
        _hideSelectionTimer: null,
        _hideSelectionCleanupEvents: null,

        saveActiveSelection(force = false) {
            try {
                const sel = window.getSelection();
                if (!sel || sel.rangeCount === 0) return;
                const range = sel.getRangeAt(0);
                const container = MultiPageEngine.getContainer();
                if (container && container.contains(range.commonAncestorContainer)) {
                    if (!force && document.activeElement && !container.contains(document.activeElement) && document.activeElement !== document.body) {
                        return;
                    }
                    this._savedRange = range.cloneRange();
                    this._savedEditor = MultiPageEngine.getActiveEditor();
                }
            } catch (_) {}
        },

        restoreActiveSelection() {
            try {
                if (!this._savedRange) return;
                const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                if (editor && document.activeElement !== editor) {
                    editor.focus({ preventScroll: true });
                }
                const sel = window.getSelection();
                if (sel) {
                    if (sel.rangeCount > 0) {
                        const cur = sel.getRangeAt(0);
                        if (cur.startContainer === this._savedRange.startContainer &&
                            cur.startOffset === this._savedRange.startOffset &&
                            cur.endContainer === this._savedRange.endContainer &&
                            cur.endOffset === this._savedRange.endOffset) {
                            return;
                        }
                    }
                    sel.removeAllRanges();
                    sel.addRange(this._savedRange);
                }
            } catch (_) {}
        },

        getOrCreatePendingSpan() {
            this.restoreActiveSelection();
            const sel = window.getSelection();
            const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : this._savedRange;
            if (!range) return null;

            let node = range.startContainer;
            if (node && node.nodeType === 3) node = node.parentElement;

            // Si el cursor ya está dentro de un span pendiente que aún no contiene texto real
            let existingPending = node ? node.closest('span[data-ec-pending="true"], span[data-ec-pending-color="true"], span[data-ec-pending-bg="true"]') : null;
            if (existingPending && existingPending.textContent.replace(/\u200B/g, '').trim() === '') {
                existingPending.dataset.ecPending = "true";
                return existingPending;
            }

            // Si el span pendiente anterior ya tiene texto tipeado, desmarcarlo para no alterar lo ya escrito
            if (existingPending) {
                existingPending.removeAttribute('data-ec-pending');
                existingPending.removeAttribute('data-ec-pending-color');
                existingPending.removeAttribute('data-ec-pending-bg');
            }

            const span = document.createElement('span');
            span.dataset.ecPending = "true";

            // Heredar estilos calculados del nodo actual para mantener consistencia
            if (node) {
                const comp = window.getComputedStyle(node);
                if (comp.fontFamily) span.style.fontFamily = comp.fontFamily;
                if (comp.fontSize) span.style.fontSize = comp.fontSize;
                if (comp.color) span.style.color = comp.color;
            }

            const zwsp = document.createTextNode('\u200B');
            span.appendChild(zwsp);

            range.insertNode(span);

            const newRange = document.createRange();
            newRange.setStart(zwsp, 1);
            newRange.collapse(true);

            if (sel) {
                sel.removeAllRanges();
                sel.addRange(newRange);
            }
            this._savedRange = newRange.cloneRange();
            this._savedEditor = MultiPageEngine.getActiveEditor();

            return span;
        },

        hideSelectionTemporarily(durationMs = 800) {
            if (this._hideSelectionTimer) {
                clearTimeout(this._hideSelectionTimer);
                this._hideSelectionTimer = null;
            }

            document.body.classList.add('educonta-hide-selection');

            if (!this._hideSelectionCleanupEvents) {
                this._hideSelectionCleanupEvents = (e) => {
                    if (e.target && e.target.closest && e.target.closest('#popover-color-picker, #btn-tool-text-color, #btn-tool-bg-color')) {
                        return;
                    }
                    this.showSelection();
                };
                document.addEventListener('keydown', this._hideSelectionCleanupEvents, { capture: true, once: true });
                document.addEventListener('mousedown', this._hideSelectionCleanupEvents, { capture: true, once: true });
            }

            if (durationMs > 0) {
                this._hideSelectionTimer = setTimeout(() => {
                    this.showSelection();
                }, durationMs);
            }
        },

        showSelection() {
            if (this._hideSelectionTimer) {
                clearTimeout(this._hideSelectionTimer);
                this._hideSelectionTimer = null;
            }
            document.body.classList.remove('educonta-hide-selection');
            if (this._hideSelectionCleanupEvents) {
                document.removeEventListener('keydown', this._hideSelectionCleanupEvents, { capture: true });
                document.removeEventListener('mousedown', this._hideSelectionCleanupEvents, { capture: true });
                this._hideSelectionCleanupEvents = null;
            }
        },

        hasActiveColorPreview() {
            return !!(this._colorPreviewState && (
                (this._colorPreviewState.targets && this._colorPreviewState.targets.length > 0) ||
                this._colorPreviewState.isCollapsed
            ));
        },

        beginColorPreview(type = 'text') {
            if (window.isAuditMode) return;
            this.saveActiveSelection(false);
            if (!this._savedRange) return;

            this.cancelColorPreview();

            try {
                const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                this.restoreActiveSelection();
                const sel = window.getSelection();
                const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : this._savedRange;
                const hasSelection = range && !range.collapsed && range.toString().length > 0;

                if (hasSelection) {
                    let origNode = range.startContainer;
                    if (origNode && origNode.nodeType === 3) origNode = origNode.parentElement;
                    const origComp = origNode ? window.getComputedStyle(origNode) : null;
                    const origColor = type === 'text' 
                        ? (origComp?.color || '#1e293b') 
                        : (origComp?.backgroundColor || 'transparent');

                    const TEMP_COLOR = '#010203';
                    try {
                        document.execCommand('styleWithCSS', false, true);
                    } catch (_) {}

                    if (type === 'text') {
                        document.execCommand('foreColor', false, TEMP_COLOR);
                    } else {
                        if (!document.execCommand('hiliteColor', false, TEMP_COLOR)) {
                            document.execCommand('backColor', false, TEMP_COLOR);
                        }
                    }

                    const container = MultiPageEngine.getContainer() || document.body;
                    const createdTargets = [];

                    if (type === 'text') {
                        container.querySelectorAll('font[color="#010203"]').forEach(f => {
                            const span = document.createElement('span');
                            span.className = 'educonta-color-preview-target';
                            span.dataset.ecOrigColor = origColor;
                            span.style.color = origColor;
                            if (f.style.cssText) span.style.cssText += ';' + f.style.cssText;
                            while (f.firstChild) span.appendChild(f.firstChild);
                            f.parentNode?.replaceChild(span, f);
                            createdTargets.push(span);
                        });
                    }

                    const selector = '[style*="rgb(1, 2, 3)"], [style*="#010203"]';
                    container.querySelectorAll(selector).forEach(s => {
                        s.classList.add('educonta-color-preview-target');
                        if (!s.dataset.ecOrigColor) s.dataset.ecOrigColor = origColor;
                        if (type === 'text') s.style.color = origColor;
                        else s.style.backgroundColor = origColor;
                        if (!createdTargets.includes(s)) createdTargets.push(s);
                    });

                    if (createdTargets.length > 0) {
                        const newRange = document.createRange();
                        newRange.setStartBefore(createdTargets[0]);
                        newRange.setEndAfter(createdTargets[createdTargets.length - 1]);
                        if (sel) {
                            sel.removeAllRanges();
                            sel.addRange(newRange);
                        }
                        this._savedRange = newRange.cloneRange();
                    } else {
                        this.saveActiveSelection(true);
                    }

                    this._colorPreviewState = {
                        type: type,
                        targets: createdTargets,
                        originalColor: origColor,
                        activeEditor: editor
                    };

                    this.hideSelectionTemporarily(0);
                } else {
                    let activeNode = (range && range.startContainer) ? range.startContainer : (sel && sel.rangeCount > 0 ? sel.anchorNode : null);
                    if (activeNode && activeNode.nodeType === 3) activeNode = activeNode.parentElement;
                    const activeCell = activeNode ? activeNode.closest('td, th') : null;

                    if (type === 'bg' && activeCell && editor && editor.contains(activeCell)) {
                        const origComp = window.getComputedStyle(activeCell);
                        const origBg = activeCell.style.backgroundColor || origComp.backgroundColor;
                        activeCell.classList.add('educonta-color-preview-target');
                        activeCell.dataset.ecOrigColor = origBg;

                        this._colorPreviewState = {
                            type: 'bg',
                            targets: [activeCell],
                            originalColor: origBg,
                            activeEditor: editor,
                            isCell: true
                        };
                        this.hideSelectionTemporarily(0);
                    } else {
                        const pendingSpan = this.getOrCreatePendingSpan();
                        if (pendingSpan) {
                            const origComp = window.getComputedStyle(pendingSpan);
                            const origColor = type === 'text' ? (origComp.color || '#1e293b') : (origComp.backgroundColor || 'transparent');
                            pendingSpan.classList.add('educonta-color-preview-target');
                            pendingSpan.dataset.ecOrigColor = origColor;

                            this._colorPreviewState = {
                                type: type,
                                targets: [pendingSpan],
                                originalColor: origColor,
                                activeEditor: editor,
                                isCollapsed: true
                            };
                            this.hideSelectionTemporarily(0);
                        }
                    }
                }
            } catch (err) {
                console.warn('beginColorPreview error:', err);
            }
        },

        previewColor(color, type = 'text') {
            if (window.isAuditMode) return;
            if (!this._colorPreviewState || this._colorPreviewState.type !== type) {
                this.beginColorPreview(type);
            }

            const state = this._colorPreviewState;
            if (!state) return;

            if (state.targets && state.targets.length > 0) {
                state.targets.forEach(el => {
                    if (type === 'text') {
                        el.style.color = color || state.originalColor || '';
                    } else {
                        el.style.backgroundColor = color || 'transparent';
                    }
                });
                this.hideSelectionTemporarily(0);
            }

            const ind = document.getElementById(type === 'text' ? 'indicator-text-color' : 'indicator-bg-color');
            if (ind) {
                ind.style.backgroundColor = color || (type === 'text' ? '#1e293b' : '#f59e0b');
            }
        },

        cancelColorPreview() {
            if (!this._colorPreviewState) {
                this.showSelection();
                return;
            }

            const state = this._colorPreviewState;
            if (state.targets && state.targets.length > 0) {
                const firstTarget = state.targets[0];
                const lastTarget = state.targets[state.targets.length - 1];

                state.targets.forEach(el => {
                    const orig = el.dataset.ecOrigColor;
                    if (state.type === 'text') {
                        el.style.color = orig || '';
                    } else {
                        el.style.backgroundColor = orig || '';
                    }
                    el.classList.remove('educonta-color-preview-target');
                    delete el.dataset.ecOrigColor;
                });

                try {
                    const editor = state.activeEditor || MultiPageEngine.getActiveEditor();
                    if (editor) editor.focus({ preventScroll: true });
                    if (firstTarget.parentNode && lastTarget.parentNode) {
                        const newRange = document.createRange();
                        if (firstTarget.dataset?.ecPending === "true") {
                            const zwsp = firstTarget.firstChild;
                            newRange.setStart(zwsp || firstTarget, 1);
                            newRange.collapse(true);
                        } else {
                            newRange.setStartBefore(firstTarget);
                            newRange.setEndAfter(lastTarget);
                        }
                        const sel = window.getSelection();
                        if (sel) {
                            sel.removeAllRanges();
                            sel.addRange(newRange);
                        }
                        this._savedRange = newRange.cloneRange();
                    }
                } catch (_) {}
            }

            this._colorPreviewState = null;
            this.showSelection();
            this.restoreActiveSelection();
        },

        commitColorPreview(color, type = 'text') {
            const state = this._colorPreviewState;

            if (state && state.targets && state.targets.length > 0) {
                const firstTarget = state.targets[0];
                const lastTarget = state.targets[state.targets.length - 1];

                state.targets.forEach(el => {
                    if (type === 'text') {
                        el.style.color = color || '';
                        el.querySelectorAll('span[style*="color"], font').forEach(nested => {
                            if (nested.style.color) nested.style.color = color || '';
                            nested.removeAttribute('color');
                        });
                    } else {
                        el.style.backgroundColor = color || 'transparent';
                    }
                    el.classList.remove('educonta-color-preview-target');
                    delete el.dataset.ecOrigColor;
                });

                this._colorPreviewState = null;

                const ind = document.getElementById(type === 'text' ? 'indicator-text-color' : 'indicator-bg-color');
                if (ind) {
                    ind.style.backgroundColor = color || (type === 'text' ? '#1e293b' : '#f59e0b');
                }

                try {
                    const editor = state.activeEditor || MultiPageEngine.getActiveEditor();
                    if (editor) editor.focus({ preventScroll: true });
                    if (firstTarget.parentNode && lastTarget.parentNode) {
                        const newRange = document.createRange();
                        if (firstTarget.dataset?.ecPending === "true") {
                            const zwsp = firstTarget.firstChild;
                            newRange.setStart(zwsp || firstTarget, 1);
                            newRange.collapse(true);
                        } else {
                            newRange.setStartBefore(firstTarget);
                            newRange.setEndAfter(lastTarget);
                        }
                        const sel = window.getSelection();
                        if (sel) {
                            sel.removeAllRanges();
                            sel.addRange(newRange);
                        }
                        this._savedRange = newRange.cloneRange();
                    }
                } catch (_) {}

                this.hideSelectionTemporarily(800);

                this.updateToolbarState();
                TextDocStateManager.pushHistory();
                DocStatsManager.update();
                MultiPageEngine.debouncePaginate();
                TextDocStateManager.triggerAutoSave();
                CollabPresenceManager.broadcastContent(MultiPageEngine.getCleanHTML(), TextDocStateManager.activeSheetIndex);
            } else {
                this._colorPreviewState = null;
                if (type === 'text') {
                    this.setTextColor(color);
                } else {
                    this.setHighlightColor(color);
                }
            }
        },

        // Métodos de compatibilidad y previsualización segura en tiempo real (sin mutación destructiva de párrafos)
        beginFontPreview() {
            if (window.isAuditMode) return;
            if (!this._savedRange) {
                this.saveActiveSelection(false);
            }
            if (!this._savedRange) return;

            // Si ya existía una sesión previa activa, cancelarla antes de iniciar otra
            this.cancelFontPreview();

            try {
                const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                this.restoreActiveSelection();
                const sel = window.getSelection();
                const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : this._savedRange;
                const hasSelection = range && !range.collapsed && range.toString().trim().length > 0;

                if (hasSelection) {
                    // Guardar la fuente original calculada del nodo inicial
                    let origNode = range.startContainer;
                    if (origNode && origNode.nodeType === 3) origNode = origNode.parentElement;
                    const origComp = origNode ? window.getComputedStyle(origNode) : null;
                    const origFont = origComp?.fontFamily ? origComp.fontFamily.split(',')[0].replace(/['"]/g, '').trim() : 'Plus Jakarta Sans';

                    const TEMP_MARKER = 'EDUCONTA_PREVIEW_TEMP';
                    try {
                        document.execCommand('styleWithCSS', false, true);
                    } catch (_) {}
                    document.execCommand('fontName', false, TEMP_MARKER);

                    const container = MultiPageEngine.getContainer() || document.body;

                    const createdTargets = [];
                    // Convertir <font face="EDUCONTA_PREVIEW_TEMP"> a spans con clase preview
                    container.querySelectorAll(`font[face="${TEMP_MARKER}"]`).forEach(f => {
                        const span = document.createElement('span');
                        span.className = 'educonta-font-preview-target';
                        span.dataset.origFont = origFont;
                        span.style.fontFamily = `'${origFont}', sans-serif`;
                        if (f.style.cssText) span.style.cssText += ';' + f.style.cssText;
                        while (f.firstChild) span.appendChild(f.firstChild);
                        f.parentNode?.replaceChild(span, f);
                        createdTargets.push(span);
                    });

                    // Spans generados directamente con style="font-family: EDUCONTA_PREVIEW_TEMP"
                    container.querySelectorAll(`span[style*="${TEMP_MARKER}"]`).forEach(s => {
                        s.classList.add('educonta-font-preview-target');
                        s.dataset.origFont = origFont;
                        s.style.fontFamily = `'${origFont}', sans-serif`;
                        if (!createdTargets.includes(s)) createdTargets.push(s);
                    });

                    if (createdTargets.length > 0) {
                        const newRange = document.createRange();
                        newRange.setStartBefore(createdTargets[0]);
                        newRange.setEndAfter(createdTargets[createdTargets.length - 1]);
                        if (sel) {
                            sel.removeAllRanges();
                            sel.addRange(newRange);
                        }
                        this._savedRange = newRange.cloneRange();
                    } else {
                        this.saveActiveSelection(true);
                    }

                    this._fontPreviewState = {
                        type: 'selection',
                        originalFont: origFont,
                        activeEditor: editor
                    };
                } else {
                    // Selección colapsada: preparar span pendiente en el cursor
                    const pendingSpan = this.getOrCreatePendingSpan();
                    if (pendingSpan) {
                        const comp = window.getComputedStyle(pendingSpan);
                        const origFont = comp?.fontFamily ? comp.fontFamily.split(',')[0].replace(/['"]/g, '').trim() : 'Plus Jakarta Sans';
                        pendingSpan.classList.add('educonta-font-preview-target');
                        pendingSpan.dataset.origFont = pendingSpan.style.fontFamily || origFont;

                        this._fontPreviewState = {
                            type: 'pending',
                            target: pendingSpan,
                            targets: [pendingSpan],
                            originalFont: pendingSpan.dataset.origFont,
                            activeEditor: editor,
                            isCollapsed: true
                        };
                    }
                }
            } catch (err) {
                console.warn('beginFontPreview error:', err);
            }
        },

        previewFontFamily(fontName) {
            if (window.isAuditMode || !fontName) return;
            const cleanFont = fontName.trim().replace(/^['"]|['"]$/g, '');
            if (!cleanFont) return;

            if (typeof window.ensureGoogleFontLoaded === 'function') {
                window.ensureGoogleFontLoaded(cleanFont);
            }

            if (!this._fontPreviewState) {
                this.beginFontPreview();
            }

            const previewTargets = document.querySelectorAll('.educonta-font-preview-target');
            if (previewTargets.length > 0) {
                previewTargets.forEach(el => {
                    el.style.fontFamily = `'${cleanFont}', sans-serif`;
                    el.querySelectorAll('span[style*="font-family"], font').forEach(nested => {
                        nested.style.fontFamily = `'${cleanFont}', sans-serif`;
                    });
                });
            }
        },

        cancelFontPreview(fullCleanup = false) {
            if (!this._fontPreviewState) return;
            const previewTargets = document.querySelectorAll('.educonta-font-preview-target');
            if (previewTargets.length > 0) {
                const firstTarget = previewTargets[0];
                const lastTarget = previewTargets[previewTargets.length - 1];
                previewTargets.forEach(el => {
                    const orig = el.dataset.origFont;
                    if (orig) {
                        el.style.fontFamily = orig.includes(',') || orig.includes('sans-serif') || orig.includes('serif') ? orig : `'${orig}', sans-serif`;
                    } else {
                        el.style.fontFamily = '';
                    }
                    el.querySelectorAll('span[style*="font-family"], font').forEach(nested => {
                        nested.style.fontFamily = el.style.fontFamily;
                    });
                    if (fullCleanup) {
                        el.classList.remove('educonta-font-preview-target');
                        delete el.dataset.origFont;
                    }
                });
                try {
                    const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                    if (editor && document.activeElement !== editor) editor.focus({ preventScroll: true });
                    const newRange = document.createRange();
                    if (firstTarget.dataset?.ecPending === "true") {
                        const zwsp = firstTarget.firstChild;
                        if (zwsp && zwsp.nodeType === 3) {
                            newRange.setStart(zwsp, zwsp.textContent.length);
                        } else {
                            newRange.setStart(firstTarget, 0);
                        }
                        newRange.collapse(true);
                    } else {
                        newRange.setStartBefore(firstTarget);
                        newRange.setEndAfter(lastTarget);
                    }
                    const sel = window.getSelection();
                    if (sel) {
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    }
                    this._savedRange = newRange.cloneRange();
                } catch (_) {}
            }
            if (fullCleanup) {
                this._fontPreviewState = null;
            }
            this.restoreActiveSelection();
        },

        commitFontPreview(fontName) {
            const cleanFont = (fontName || '').trim().replace(/^['"]|['"]$/g, '');
            if (!cleanFont) {
                this.cancelFontPreview();
                return;
            }

            if (typeof window.ensureGoogleFontLoaded === 'function') {
                window.ensureGoogleFontLoaded(cleanFont);
            }

            const previewTargets = document.querySelectorAll('.educonta-font-preview-target');
            if (previewTargets.length > 0) {
                const firstTarget = previewTargets[0];
                const lastTarget = previewTargets[previewTargets.length - 1];

                previewTargets.forEach(el => {
                    el.style.fontFamily = `'${cleanFont}', sans-serif`;
                    el.classList.remove('educonta-font-preview-target');
                    delete el.dataset.origFont;

                    el.querySelectorAll('span[style*="font-family"], font').forEach(nested => {
                        nested.style.fontFamily = `'${cleanFont}', sans-serif`;
                        nested.removeAttribute('face');
                    });
                });

                this._fontPreviewState = null;

                const fontSelect = document.getElementById('font-family-select');
                if (fontSelect) {
                    fontSelect.value = cleanFont;
                    if (fontSelect._glassInstance) {
                        fontSelect._glassInstance.updateTriggerLabel();
                    }
                }

                // Re-seleccionar el rango completo modificado para que el texto siga seleccionado o posicionar caret en pending
                try {
                    const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                    if (editor && document.activeElement !== editor) editor.focus({ preventScroll: true });
                    const newRange = document.createRange();
                    if (firstTarget.dataset?.ecPending === "true") {
                        const zwsp = firstTarget.firstChild;
                        if (zwsp && zwsp.nodeType === 3) {
                            newRange.setStart(zwsp, zwsp.textContent.length);
                        } else {
                            newRange.setStart(firstTarget, 0);
                        }
                        newRange.collapse(true);
                    } else {
                        newRange.setStartBefore(firstTarget);
                        newRange.setEndAfter(lastTarget);
                    }
                    const sel = window.getSelection();
                    if (sel) {
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    }
                    this._savedRange = newRange.cloneRange();
                } catch (_) {}

                this.updateToolbarState();
                TextDocStateManager.pushHistory();
                DocStatsManager.update();
                MultiPageEngine.debouncePaginate();
                TextDocStateManager.triggerAutoSave();
                CollabPresenceManager.broadcastContent(MultiPageEngine.getCleanHTML(), TextDocStateManager.activeSheetIndex);
            } else {
                this._fontPreviewState = null;
                this.setFontFamily(cleanFont);
            }
        },

        execFormat(command, value = null) {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const editor = MultiPageEngine.getActiveEditor();
            if (editor && document.activeElement !== editor) editor.focus({ preventScroll: true });

            const isSemanticInline = ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript'].includes(command);

            try {
                // Para comandos semánticos (negrita, cursiva, subrayado, etc.) usar styleWithCSS: false
                // de modo que Chromium use tags semánticos nativos (b, i, u, strike, sub, sup)
                // y mantenga de forma natural el typing style acumulado para lo que se escriba a continuación.
                document.execCommand('styleWithCSS', false, !isSemanticInline);
            } catch (_) {}

            document.execCommand(command, false, value);
            this.saveActiveSelection(true);
            this.updateToolbarState();
            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            MultiPageEngine.debouncePaginate();
        },

        setFontFamily(fontName) {
            if (window.isAuditMode || !fontName) return;
            this._fontPreviewState = null;
            this._savedPreviewSpan = null;
            const cleanFont = fontName.trim().replace(/^['"]|['"]$/g, '');
            if (!cleanFont) return;

            if (typeof window.ensureGoogleFontLoaded === 'function') {
                window.ensureGoogleFontLoaded(cleanFont);
            }

            this.restoreActiveSelection();
            const editor = MultiPageEngine.getActiveEditor();
            if (editor && document.activeElement !== editor) {
                editor.focus({ preventScroll: true });
            }

            const sel = window.getSelection();
            const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : this._savedRange;
            const hasSelection = range && !range.collapsed && range.toString().trim().length > 0;

            if (hasSelection) {
                try {
                    document.execCommand('styleWithCSS', false, true);
                } catch (_) {}

                document.execCommand('fontName', false, cleanFont);

                // Normalizar elementos <font face="..."> generados por navegadores a <span style="font-family: ...">
                const container = MultiPageEngine.getContainer() || document.body;
                const createdSpans = [];

                container.querySelectorAll('font[face]').forEach(f => {
                    const span = document.createElement('span');
                    span.style.fontFamily = `'${cleanFont}', sans-serif`;
                    if (f.style.cssText) span.style.cssText += ';' + f.style.cssText;
                    span.style.fontFamily = `'${cleanFont}', sans-serif`;
                    while (f.firstChild) span.appendChild(f.firstChild);

                    span.querySelectorAll('span[style*="font-family"], font').forEach(nested => {
                        nested.style.fontFamily = `'${cleanFont}', sans-serif`;
                        nested.removeAttribute('face');
                    });

                    f.parentNode?.replaceChild(span, f);
                    createdSpans.push(span);
                });

                // Normalizar spans directos que tengan font-family aplicado
                container.querySelectorAll('span[style*="font-family"]').forEach(s => {
                    if (s.style.fontFamily && s.style.fontFamily.toLowerCase().includes(cleanFont.toLowerCase())) {
                        s.style.fontFamily = `'${cleanFont}', sans-serif`;
                        if (!createdSpans.includes(s)) createdSpans.push(s);
                    }
                });

                if (createdSpans.length > 0) {
                    try {
                        const newRange = document.createRange();
                        newRange.setStartBefore(createdSpans[0]);
                        newRange.setEndAfter(createdSpans[createdSpans.length - 1]);
                        const selNow = window.getSelection();
                        if (selNow) {
                            selNow.removeAllRanges();
                            selNow.addRange(newRange);
                        }
                        this._savedRange = newRange.cloneRange();
                    } catch (_) {
                        this.saveActiveSelection(true);
                    }
                } else {
                    this.saveActiveSelection(true);
                }
            } else {
                // Caso B: Selección colapsada - aplicar al span pendiente para lo que se escriba a continuación
                const span = this.getOrCreatePendingSpan();
                if (span) {
                    span.style.fontFamily = `'${cleanFont}', sans-serif`;
                    const zwsp = span.firstChild;
                    const newRange = document.createRange();
                    if (zwsp && zwsp.nodeType === 3) {
                        newRange.setStart(zwsp, zwsp.textContent.length);
                    } else {
                        newRange.setStart(span, 0);
                    }
                    newRange.collapse(true);
                    const selNow = window.getSelection();
                    if (selNow) {
                        selNow.removeAllRanges();
                        selNow.addRange(newRange);
                    }
                    this._savedRange = newRange.cloneRange();
                }
                const ed = this._savedEditor || MultiPageEngine.getActiveEditor();
                if (ed && document.activeElement !== ed) {
                    ed.focus({ preventScroll: true });
                }
            }

            // Sincronizar el selector de fuentes en la barra y su trigger Glassmorphic
            const fontSelect = document.getElementById('font-family-select');
            if (fontSelect) {
                fontSelect.value = cleanFont;
                if (fontSelect._glassInstance) {
                    fontSelect._glassInstance.updateTriggerLabel();
                }
            }

            this.updateToolbarState();
            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
            CollabPresenceManager.broadcastContent(MultiPageEngine.getCleanHTML(), TextDocStateManager.activeSheetIndex);
        },

        // =====================================================================
        // PREVISUALIZACIÓN DE TAMAÑO DE FUENTE EN TIEMPO REAL
        // =====================================================================
        beginFontSizePreview() {
            if (window.isAuditMode) return;
            this.saveActiveSelection(false);
            if (!this._savedRange) return;

            this.cancelFontSizePreview();

            try {
                const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                this.restoreActiveSelection();
                const sel = window.getSelection();
                const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : this._savedRange;
                const hasSelection = range && !range.collapsed && range.toString().trim().length > 0;

                if (hasSelection) {
                    let origNode = range.startContainer;
                    if (origNode && origNode.nodeType === 3) origNode = origNode.parentElement;
                    const origComp = origNode ? window.getComputedStyle(origNode) : null;
                    const origPt = origComp?.fontSize ? Math.round(parseFloat(origComp.fontSize) * 0.75) : 16;
                    const origSize = `${origPt}pt`;

                    const TEMP_SIZE_MARKER = '7';
                    try {
                        document.execCommand('styleWithCSS', false, false);
                    } catch (_) {}
                    document.execCommand('fontSize', false, TEMP_SIZE_MARKER);

                    const container = MultiPageEngine.getContainer() || document.body;

                    const createdTargets = [];
                    container.querySelectorAll('font[size="7"], font[size]').forEach(f => {
                        const span = document.createElement('span');
                        span.className = 'educonta-font-size-preview-target';
                        span.dataset.origSize = origSize;
                        span.style.fontSize = origSize;
                        if (f.style.cssText) span.style.cssText += ';' + f.style.cssText;
                        while (f.firstChild) span.appendChild(f.firstChild);
                        f.parentNode?.replaceChild(span, f);
                        createdTargets.push(span);
                    });

                    container.querySelectorAll('span[style*="xxx-large"]').forEach(s => {
                        s.classList.add('educonta-font-size-preview-target');
                        s.dataset.origSize = origSize;
                        s.style.fontSize = origSize;
                        if (!createdTargets.includes(s)) createdTargets.push(s);
                    });

                    if (createdTargets.length > 0) {
                        const newRange = document.createRange();
                        newRange.setStartBefore(createdTargets[0]);
                        newRange.setEndAfter(createdTargets[createdTargets.length - 1]);
                        if (sel) {
                            sel.removeAllRanges();
                            sel.addRange(newRange);
                        }
                        this._savedRange = newRange.cloneRange();
                    } else {
                        this.saveActiveSelection(true);
                    }

                    this._fontSizePreviewState = {
                        type: 'selection',
                        originalSize: origSize,
                        activeEditor: editor
                    };
                } else {
                    // Selección colapsada: preparar span pendiente en el cursor
                    const pendingSpan = this.getOrCreatePendingSpan();
                    if (pendingSpan) {
                        const comp = window.getComputedStyle(pendingSpan);
                        const origPt = comp?.fontSize ? Math.round(parseFloat(comp.fontSize) * 0.75) : 16;
                        const origSize = `${origPt}pt`;
                        pendingSpan.classList.add('educonta-font-size-preview-target');
                        pendingSpan.dataset.origSize = pendingSpan.style.fontSize || origSize;

                        this._fontSizePreviewState = {
                            type: 'pending',
                            target: pendingSpan,
                            targets: [pendingSpan],
                            originalSize: pendingSpan.dataset.origSize,
                            activeEditor: editor,
                            isCollapsed: true
                        };
                    }
                }
            } catch (err) {
                console.warn('beginFontSizePreview error:', err);
            }
        },

        previewFontSize(size) {
            if (window.isAuditMode || !size) return;
            const rawSize = String(size).replace(/[^0-9]/g, '');
            const numSize = parseInt(rawSize, 10) || 16;
            const formattedSize = `${numSize}pt`;

            if (!this._fontSizePreviewState) {
                this.beginFontSizePreview();
            }

            const previewTargets = document.querySelectorAll('.educonta-font-size-preview-target');
            if (previewTargets.length > 0) {
                previewTargets.forEach(el => {
                    el.style.fontSize = formattedSize;
                    el.querySelectorAll('span[style*="font-size"], font').forEach(nested => {
                        nested.style.fontSize = formattedSize;
                    });
                });
                // Recalcular paginación dinámica si el nuevo tamaño empuja texto a otra página
                MultiPageEngine.debouncePaginate();
            }
        },

        cancelFontSizePreview(fullCleanup = false) {
            if (!this._fontSizePreviewState) return;
            const previewTargets = document.querySelectorAll('.educonta-font-size-preview-target');
            if (previewTargets.length > 0) {
                const firstTarget = previewTargets[0];
                const lastTarget = previewTargets[previewTargets.length - 1];
                previewTargets.forEach(el => {
                    const orig = el.dataset.origSize;
                    if (orig) {
                        el.style.fontSize = orig;
                    } else {
                        el.style.fontSize = '';
                    }
                    el.querySelectorAll('span[style*="font-size"], font').forEach(nested => {
                        nested.style.fontSize = el.style.fontSize;
                    });
                    if (fullCleanup) {
                        el.classList.remove('educonta-font-size-preview-target');
                        delete el.dataset.origSize;
                    }
                });
                try {
                    const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                    if (editor) editor.focus({ preventScroll: true });
                    const newRange = document.createRange();
                    if (firstTarget.dataset?.ecPending === "true") {
                        const zwsp = firstTarget.firstChild;
                        newRange.setStart(zwsp || firstTarget, 1);
                        newRange.collapse(true);
                    } else {
                        newRange.setStartBefore(firstTarget);
                        newRange.setEndAfter(lastTarget);
                    }
                    const sel = window.getSelection();
                    if (sel) {
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    }
                    this._savedRange = newRange.cloneRange();
                } catch (_) {}
                MultiPageEngine.debouncePaginate();
            }
            if (fullCleanup) {
                this._fontSizePreviewState = null;
            }
            this.restoreActiveSelection();
        },

        commitFontSizePreview(size) {
            const rawSize = String(size).replace(/[^0-9]/g, '');
            const numSize = parseInt(rawSize, 10) || 16;
            const formattedSize = `${numSize}pt`;

            const previewTargets = document.querySelectorAll('.educonta-font-size-preview-target');
            if (previewTargets.length > 0) {
                const firstTarget = previewTargets[0];
                const lastTarget = previewTargets[previewTargets.length - 1];

                previewTargets.forEach(el => {
                    el.style.fontSize = formattedSize;
                    el.classList.remove('educonta-font-size-preview-target');
                    delete el.dataset.origSize;

                    el.querySelectorAll('span[style*="font-size"], font').forEach(nested => {
                        nested.style.fontSize = formattedSize;
                        nested.removeAttribute('size');
                    });
                });

                this._fontSizePreviewState = null;

                const sizeSelect = document.getElementById('font-size-select');
                if (sizeSelect) {
                    const optExists = Array.from(sizeSelect.options).some(o => o.value === String(numSize));
                    if (!optExists) {
                        const newOpt = document.createElement('option');
                        newOpt.value = String(numSize);
                        newOpt.textContent = String(numSize);
                        sizeSelect.appendChild(newOpt);
                    }
                    sizeSelect.value = String(numSize);
                    if (sizeSelect._glassInstance) {
                        sizeSelect._glassInstance.updateTriggerLabel();
                    }
                }

                // Re-seleccionar el rango completo modificado para que el texto siga seleccionado o posicionar caret en pending
                try {
                    const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                    if (editor) editor.focus({ preventScroll: true });
                    const newRange = document.createRange();
                    if (firstTarget.dataset?.ecPending === "true") {
                        const zwsp = firstTarget.firstChild;
                        newRange.setStart(zwsp || firstTarget, 1);
                        newRange.collapse(true);
                    } else {
                        newRange.setStartBefore(firstTarget);
                        newRange.setEndAfter(lastTarget);
                    }
                    const sel = window.getSelection();
                    if (sel) {
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    }
                    this._savedRange = newRange.cloneRange();
                } catch (_) {}

                this.updateToolbarState();
                TextDocStateManager.pushHistory();
                DocStatsManager.update();
                MultiPageEngine.debouncePaginate();
                TextDocStateManager.triggerAutoSave();
                CollabPresenceManager.broadcastContent(MultiPageEngine.getCleanHTML(), TextDocStateManager.activeSheetIndex);
            } else {
                this._fontSizePreviewState = null;
                this.setFontSize(size);
            }
        },

        setFontSize(size) {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const editor = MultiPageEngine.getActiveEditor();
            if (editor && document.activeElement !== editor) {
                editor.focus({ preventScroll: true });
            }

            const rawSize = String(size).replace(/[^0-9]/g, '');
            const numSize = parseInt(rawSize, 10) || 16;
            const formattedSize = `${numSize}pt`;

            const sel = window.getSelection();
            const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : this._savedRange;
            const hasSelection = range && !range.collapsed && range.toString().trim().length > 0;

            if (hasSelection) {
                try {
                    document.execCommand('styleWithCSS', false, false);
                } catch (_) {}

                // Ejecutar comando fontSize con marcador 7
                document.execCommand('fontSize', false, '7');

                const container = MultiPageEngine.getContainer() || document.body;
                const createdSpans = [];

                // Reemplazar <font size="7"> y <font size> por <span style="font-size: ${formattedSize}">
                container.querySelectorAll('font[size="7"], font[size]').forEach(f => {
                    const span = document.createElement('span');
                    span.style.fontSize = formattedSize;
                    if (f.style.cssText) span.style.cssText += ';' + f.style.cssText;
                    span.style.fontSize = formattedSize;
                    while (f.firstChild) span.appendChild(f.firstChild);

                    // Sobrescribir cualquier span anidado previo
                    span.querySelectorAll('span[style*="font-size"], font').forEach(nested => {
                        nested.style.fontSize = formattedSize;
                        nested.removeAttribute('size');
                    });

                    f.parentNode?.replaceChild(span, f);
                    createdSpans.push(span);
                });

                // Si el navegador generó spans con style="font-size: xxx-large" o similar
                container.querySelectorAll('span[style*="font-size"]').forEach(s => {
                    const fs = s.style.fontSize;
                    if (fs === 'xxx-large' || fs === '-webkit-xxx-large' || fs === '7' || s.getAttribute('size') === '7' || (fs && fs.includes('xxx-large'))) {
                        s.style.fontSize = formattedSize;
                        s.removeAttribute('size');
                        if (!createdSpans.includes(s)) createdSpans.push(s);
                    }
                });

                if (createdSpans.length > 0) {
                    try {
                        const newRange = document.createRange();
                        newRange.setStartBefore(createdSpans[0]);
                        newRange.setEndAfter(createdSpans[createdSpans.length - 1]);
                        const selNow = window.getSelection();
                        if (selNow) {
                            selNow.removeAllRanges();
                            selNow.addRange(newRange);
                        }
                        this._savedRange = newRange.cloneRange();
                    } catch (_) {
                        this.saveActiveSelection(true);
                    }
                } else {
                    this.saveActiveSelection(true);
                }
            } else {
                // Caso B: Sin texto seleccionado, aplicar al span pendiente para lo que se escriba a continuación
                const span = this.getOrCreatePendingSpan();
                if (span) {
                    span.style.fontSize = formattedSize;
                }
                const ed = this._savedEditor || MultiPageEngine.getActiveEditor();
                if (ed && document.activeElement !== ed) {
                    ed.focus({ preventScroll: true });
                }
            }

            // Sincronizar el selector de tamaño y su trigger Glassmorphic
            const sizeSelect = document.getElementById('font-size-select');
            if (sizeSelect) {
                const optExists = Array.from(sizeSelect.options).some(o => o.value === String(numSize));
                if (!optExists) {
                    const newOpt = document.createElement('option');
                    newOpt.value = String(numSize);
                    newOpt.textContent = String(numSize);
                    sizeSelect.appendChild(newOpt);
                }
                sizeSelect.value = String(numSize);
                if (sizeSelect._glassInstance) {
                    sizeSelect._glassInstance.updateTriggerLabel();
                }
            }

            this.updateToolbarState();
            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
            CollabPresenceManager.broadcastContent(MultiPageEngine.getCleanHTML(), TextDocStateManager.activeSheetIndex);
        },

        changeFontSize(delta) {
            if (window.isAuditMode) return;
            const SIZES = [10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];
            const sizeSelect = document.getElementById('font-size-select');
            let current = 16;
            if (sizeSelect && sizeSelect.value) {
                current = parseInt(sizeSelect.value, 10) || 16;
            } else {
                const sel = window.getSelection();
                let node = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
                if (node) {
                    const comp = window.getComputedStyle(node);
                    if (comp && comp.fontSize) {
                        current = Math.round(parseFloat(comp.fontSize) * 0.75) || 16;
                    }
                }
            }

            let nextSize = current;
            if (delta > 0) {
                nextSize = SIZES.find(s => s > current) || (current + 2);
            } else {
                const smaller = SIZES.filter(s => s < current);
                nextSize = smaller.length > 0 ? smaller[smaller.length - 1] : Math.max(8, current - 2);
            }

            this.setFontSize(nextSize);
        },

        setTextColor(color) {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const sel = window.getSelection();
            const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : this._savedRange;
            const isCollapsed = !range || range.collapsed || range.toString().length === 0;

            const ind = document.getElementById('indicator-text-color');
            if (ind) ind.style.backgroundColor = color || '#1e293b';

            if (isCollapsed && range) {
                // Caso 1: Cursor colapsado (nada seleccionado)
                // Lo siguiente que se escriba DEBE ser en este color
                const span = this.getOrCreatePendingSpan();
                if (span) {
                    span.style.color = color || '#1e293b';
                }

                // Redundancia nativa con execCommand
                try {
                    document.execCommand('styleWithCSS', false, true);
                    document.execCommand('foreColor', false, color || '#1e293b');
                } catch (_) {}

                const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                if (editor && document.activeElement !== editor) editor.focus({ preventScroll: true });

                this.hideSelectionTemporarily(800);
                this.updateToolbarState();
                return;
            }

            // Caso 2: Texto seleccionado
            if (this._colorPreviewState && this._colorPreviewState.targets && this._colorPreviewState.targets.length > 0) {
                this.commitColorPreview(color, 'text');
                return;
            }

            try {
                document.execCommand('styleWithCSS', false, true);
            } catch (_) {}
            this.execFormat('foreColor', color || '#1e293b');

            const container = MultiPageEngine.getContainer() || document.body;
            container.querySelectorAll('font[color]').forEach(f => {
                const span = document.createElement('span');
                span.style.color = color || '#1e293b';
                if (f.style.cssText) span.style.cssText += ';' + f.style.cssText;
                while (f.firstChild) span.appendChild(f.firstChild);
                f.parentNode?.replaceChild(span, f);
            });

            this.hideSelectionTemporarily(800);
            this.restoreActiveSelection();
        },

        setHighlightColor(color) {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const sel = window.getSelection();
            const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : this._savedRange;
            const isCollapsed = !range || range.collapsed || range.toString().length === 0;

            const ind = document.getElementById('indicator-bg-color');
            if (ind) ind.style.backgroundColor = color || '#f59e0b';

            let node = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
            const activeCell = node ? node.closest('td, th') : null;

            if (activeCell && isCollapsed) {
                activeCell.style.backgroundColor = color || 'transparent';
                this.hideSelectionTemporarily(800);
                TextDocStateManager.pushHistory();
                TextDocStateManager.triggerAutoSave();
                return;
            }

            if (isCollapsed && range) {
                const span = this.getOrCreatePendingSpan();
                if (span) {
                    span.style.backgroundColor = color || 'transparent';
                }

                try {
                    document.execCommand('styleWithCSS', false, true);
                    if (!document.execCommand('hiliteColor', false, color || 'transparent')) {
                        document.execCommand('backColor', false, color || 'transparent');
                    }
                } catch (_) {}

                const editor = this._savedEditor || MultiPageEngine.getActiveEditor();
                if (editor && document.activeElement !== editor) editor.focus({ preventScroll: true });

                this.hideSelectionTemporarily(800);
                this.updateToolbarState();
                return;
            }

            if (this._colorPreviewState && this._colorPreviewState.targets && this._colorPreviewState.targets.length > 0) {
                this.commitColorPreview(color, 'bg');
                return;
            }

            try {
                document.execCommand('styleWithCSS', false, true);
            } catch (_) {}
            this.execFormat('hiliteColor', color || 'transparent');
            this.hideSelectionTemporarily(800);
            this.restoreActiveSelection();
        },

        setBlockStyle(tag) {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            if (tag.startsWith('callout-')) {
                const type = tag.replace('callout-', '');
                this.insertCallout(type);
                return;
            }

            if (tag === 'p') {
                this.execFormat('formatBlock', '<p>');
            } else if (tag === 'h1') {
                this.execFormat('formatBlock', '<h1>');
            } else if (tag === 'h2') {
                this.execFormat('formatBlock', '<h2>');
            } else if (tag === 'h3') {
                this.execFormat('formatBlock', '<h3>');
            } else if (tag === 'blockquote') {
                this.execFormat('formatBlock', '<blockquote>');
            }
        },

        toggleBlockquote() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const sel = window.getSelection();
            let node = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
            const existingQuote = node ? node.closest('blockquote') : null;
            if (existingQuote) {
                this.execFormat('formatBlock', '<p>');
            } else {
                this.execFormat('formatBlock', '<blockquote>');
            }
        },

        insertChecklist() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const ul = document.createElement('ul');
            ul.className = 'task-list my-2 space-y-1';
            ul.style.listStyleType = 'none';
            ul.style.paddingLeft = '1.25rem';

            const li = document.createElement('li');
            li.className = 'task-list-item flex items-center gap-2';
            li.innerHTML = '<input type="checkbox" class="rounded text-amber-500 focus:ring-amber-400 cursor-pointer" onchange="this.toggleAttribute(\'checked\', this.checked); window.TextDocStateManager?.triggerAutoSave();"> <span>Tarea pendiente...</span>';
            ul.appendChild(li);

            const p = document.createElement('p');
            p.innerHTML = '<br>';
            const frag = document.createDocumentFragment();
            frag.appendChild(ul);
            frag.appendChild(p);

            this.insertNodeAtCursor(frag);
            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
        },

        insertHorizontalRule() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const hr = document.createElement('hr');
            hr.className = 'my-4 border-t border-slate-300 dark:border-slate-700';
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            const frag = document.createDocumentFragment();
            frag.appendChild(hr);
            frag.appendChild(p);

            this.insertNodeAtCursor(frag);
            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
        },

        insertCallout(type) {
            const selection = window.getSelection();
            const text = (selection && !selection.isCollapsed) ? selection.toString() : 'Nota importante contable / fiscal...';
            const div = document.createElement('div');
            div.className = `edu-callout ${type}`;
            div.innerHTML = `<strong>${type.toUpperCase()}:</strong> ${text}`;
            this.insertNodeAtCursor(div);
            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
        },

        toggleInlineCode() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const editor = MultiPageEngine.getActiveEditor();
            if (editor && document.activeElement !== editor) editor.focus({ preventScroll: true });

            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const container = MultiPageEngine.getContainer();
            if (!container || !container.contains(range.commonAncestorContainer)) return;

            let node = range.commonAncestorContainer;
            if (node.nodeType === 3) node = node.parentElement;
            const existingCode = node ? node.closest('code') : null;

            if (existingCode) {
                if (existingCode.textContent === '\u200B' || existingCode.textContent.trim() === '') {
                    const newRange = document.createRange();
                    newRange.setStartBefore(existingCode);
                    newRange.collapse(true);
                    existingCode.remove();
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    this._savedRange = newRange.cloneRange();
                } else {
                    const parent = existingCode.parentNode;
                    const frag = document.createDocumentFragment();
                    let firstChild = null;
                    let lastChild = null;
                    while (existingCode.firstChild) {
                        const child = existingCode.firstChild;
                        if (!firstChild) firstChild = child;
                        lastChild = child;
                        frag.appendChild(child);
                    }
                    if (parent) {
                        parent.replaceChild(frag, existingCode);
                        if (firstChild && lastChild) {
                            const newRange = document.createRange();
                            newRange.setStartBefore(firstChild);
                            newRange.setEndAfter(lastChild);
                            selection.removeAllRanges();
                            selection.addRange(newRange);
                            this._savedRange = newRange.cloneRange();
                        }
                    }
                }
            } else {
                const selectedText = range.toString();
                if (selectedText.length > 0) {
                    const code = document.createElement('code');
                    code.className = 'educonta-inline-code font-mono text-[0.9em] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 border border-slate-200 dark:border-slate-700';
                    code.appendChild(range.extractContents());
                    range.insertNode(code);

                    const newRange = document.createRange();
                    newRange.setStartAfter(code);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    this._savedRange = newRange.cloneRange();
                } else {
                    const code = document.createElement('code');
                    code.className = 'educonta-inline-code font-mono text-[0.9em] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 border border-slate-200 dark:border-slate-700';
                    code.dataset.ecPendingCode = "true";
                    const zwsp = document.createTextNode('\u200B');
                    code.appendChild(zwsp);
                    range.insertNode(code);

                    const newRange = document.createRange();
                    newRange.setStart(zwsp, 1);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    this._savedRange = newRange.cloneRange();
                }
            }

            this.updateToolbarState();
            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            MultiPageEngine.debouncePaginate();
        },

        clearFormatting() {
            if (window.isAuditMode) return;
            this.execFormat('removeFormat');
            this.execFormat('formatBlock', '<p>');
            MultiPageEngine.debouncePaginate();
        },

        insertTextAtCursor(text) {
            if (window.isAuditMode) return;
            document.execCommand('insertText', false, text);
            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
        },

        insertNodeAtCursor(node) {
            const editor = MultiPageEngine.getActiveEditor();
            if (!editor) return;

            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0 || !editor.contains(selection.anchorNode)) {
                editor.appendChild(node);
                return;
            }

            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(node);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        },

        openTableModal() {
            const modal = document.getElementById('table-modal');
            if (modal) modal.style.display = 'flex';
        },
        closeTableModal() {
            const modal = document.getElementById('table-modal');
            if (modal) modal.style.display = 'none';
        },
        confirmInsertTable() {
            const rows = parseInt(document.getElementById('table-input-rows')?.value, 10) || 3;
            const cols = parseInt(document.getElementById('table-input-cols')?.value, 10) || 3;
            const withHeader = document.getElementById('table-input-header')?.checked ?? true;
            const styleClass = document.getElementById('table-input-style')?.value || 'table-striped';

            const table = document.createElement('table');
            table.className = styleClass;

            if (withHeader) {
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                for (let c = 0; c < cols; c++) {
                    const th = document.createElement('th');
                    th.textContent = `Columna ${c + 1}`;
                    headerRow.appendChild(th);
                }
                thead.appendChild(headerRow);
                table.appendChild(thead);
            }

            const tbody = document.createElement('tbody');
            for (let r = 0; r < rows; r++) {
                const tr = document.createElement('tr');
                for (let c = 0; c < cols; c++) {
                    const td = document.createElement('td');
                    td.innerHTML = '<br>';
                    tr.appendChild(td);
                }
                tbody.appendChild(tr);
            }
            table.appendChild(tbody);

            const p = document.createElement('p');
            p.innerHTML = '<br>';

            const fragment = document.createDocumentFragment();
            fragment.appendChild(table);
            fragment.appendChild(p);

            this.insertNodeAtCursor(fragment);
            this.closeTableModal();
            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.showToast('Tabla insertada');
        },

        insertTextBox() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const box = document.createElement('div');
            box.className = 'doc-text-box';
            box.innerHTML = '<p><strong>Nota o Sección Destacada:</strong> Escriba aquí el contenido del cuadro de texto...</p>';

            const p = document.createElement('p');
            p.innerHTML = '<br>';

            const frag = document.createDocumentFragment();
            frag.appendChild(box);
            frag.appendChild(p);

            this.insertNodeAtCursor(frag);
            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
            TextDocStateManager.showToast('Cuadro de texto insertado');
        },

        openShapesModal() {
            const modal = document.getElementById('shapes-modal');
            if (modal) modal.style.display = 'flex';
        },
        closeShapesModal() {
            const modal = document.getElementById('shapes-modal');
            if (modal) modal.style.display = 'none';
        },
        insertShape(type) {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            let nodeToInsert = null;

            if (type === 'signature_single') {
                const div = document.createElement('div');
                div.className = 'doc-signature-block';
                div.innerHTML = `
                    <div style="display: block; width: 280px; margin: 32px auto 16px auto; text-align: center;">
                        <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 100%; margin-bottom: 6px;"></div>
                        <p style="margin: 0; font-weight: 700;">[NOMBRE DEL FIRMANTE]</p>
                        <p style="margin: 0; font-size: 0.85em; color: #64748b;">Representante Legal / Gerente General</p>
                    </div>
                `;
                nodeToInsert = div;
            } else if (type === 'signature_dual') {
                const table = document.createElement('table');
                table.className = 'table-borderless doc-signature-table';
                table.style.width = '100%';
                table.style.border = 'none';
                table.style.margin = '32px 0 16px 0';
                table.innerHTML = `
                    <tbody>
                        <tr>
                            <td style="width: 48%; text-align: center; border: none; padding: 0 12px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 240px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">EL CONTRATANTE</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Firma y Sello</p>
                            </td>
                            <td style="width: 4%; border: none;"></td>
                            <td style="width: 48%; text-align: center; border: none; padding: 0 12px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 240px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">EL CONTRATISTA</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Firma y Sello</p>
                            </td>
                        </tr>
                    </tbody>
                `;
                nodeToInsert = table;
            } else if (type === 'signature_triple') {
                const table = document.createElement('table');
                table.className = 'table-borderless doc-signature-table';
                table.style.width = '100%';
                table.style.border = 'none';
                table.style.margin = '32px 0 16px 0';
                table.innerHTML = `
                    <tbody>
                        <tr>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Elaborado por</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Encargado(a)</p>
                            </td>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Revisado por</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Auditoría / Calidad</p>
                            </td>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Autorizado por</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Gerencia General</p>
                            </td>
                        </tr>
                    </tbody>
                `;
                nodeToInsert = table;
            } else if (type === 'divider_accent') {
                const hr = document.createElement('hr');
                hr.className = 'doc-accent-rule';
                nodeToInsert = hr;
            } else if (type === 'badge_approved') {
                const span = document.createElement('span');
                span.className = 'doc-badge doc-badge-emerald';
                span.textContent = 'CONFORME / APROBADO';
                nodeToInsert = span;
            } else if (type === 'badge_reviewed') {
                const span = document.createElement('span');
                span.className = 'doc-badge doc-badge-sky';
                span.textContent = 'REVISADO / AUDITADO';
                nodeToInsert = span;
            } else if (type === 'badge_confidential') {
                const span = document.createElement('span');
                span.className = 'doc-badge doc-badge-amber';
                span.textContent = 'CONFIDENCIAL';
                nodeToInsert = span;
            } else if (type === 'badge_void') {
                const span = document.createElement('span');
                span.className = 'doc-badge doc-badge-rose';
                span.textContent = 'ANULADO';
                nodeToInsert = span;
            } else if (type === 'circle_numbered') {
                const span = document.createElement('span');
                span.className = 'doc-circle-step';
                span.textContent = '1';
                nodeToInsert = span;
            } else if (type === 'callout_box') {
                const callout = document.createElement('div');
                callout.className = 'edu-callout info';
                callout.innerHTML = '<p><strong>Aviso Importante:</strong> Ingrese aquí las notas o consideraciones legales/contables...</p>';
                nodeToInsert = callout;
            }

            if (nodeToInsert) {
                const frag = document.createDocumentFragment();
                frag.appendChild(nodeToInsert);
                const p = document.createElement('p');
                p.innerHTML = '<br>';
                frag.appendChild(p);

                this.insertNodeAtCursor(frag);
                TextDocStateManager.pushHistory();
                MultiPageEngine.debouncePaginate();
                TextDocStateManager.triggerAutoSave();
                TextDocStateManager.showToast('Elemento insertado');
            }
            this.closeShapesModal();
        },

        insertTableRow() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const sel = window.getSelection();
            let anchor = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
            let currentCell = anchor ? anchor.closest('td, th') : null;
            let currentRow = anchor ? anchor.closest('tr') : null;
            let table = anchor ? anchor.closest('table') : null;

            if (!table) {
                this.confirmInsertTable();
                return;
            }

            const colCount = currentRow ? currentRow.children.length : (table.rows[0] ? table.rows[0].children.length : 3);
            const newRow = document.createElement('tr');
            for (let i = 0; i < colCount; i++) {
                const td = document.createElement('td');
                td.innerHTML = '<br>';
                newRow.appendChild(td);
            }

            if (currentRow && currentRow.parentNode) {
                currentRow.parentNode.insertBefore(newRow, currentRow.nextSibling);
            } else {
                const tbody = table.querySelector('tbody') || table;
                tbody.appendChild(newRow);
            }

            const firstTd = newRow.querySelector('td');
            if (firstTd) {
                const range = document.createRange();
                range.selectNodeContents(firstTd);
                range.collapse(true);
                const selNow = window.getSelection();
                if (selNow) {
                    selNow.removeAllRanges();
                    selNow.addRange(range);
                }
                this.saveActiveSelection(true);
            }

            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
        },

        insertTableCol() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const sel = window.getSelection();
            let anchor = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
            let currentCell = anchor ? anchor.closest('td, th') : null;
            let table = anchor ? anchor.closest('table') : null;

            if (!table) {
                this.confirmInsertTable();
                return;
            }

            const colIndex = currentCell ? currentCell.cellIndex : (table.rows[0] ? table.rows[0].children.length - 1 : 0);

            Array.from(table.rows).forEach((row) => {
                const isHeader = (row.parentElement && row.parentElement.tagName.toLowerCase() === 'thead') || row.firstElementChild?.tagName.toLowerCase() === 'th';
                const newCell = document.createElement(isHeader ? 'th' : 'td');
                newCell.innerHTML = isHeader ? 'Columna' : '<br>';
                
                if (colIndex >= 0 && row.children[colIndex]) {
                    row.insertBefore(newCell, row.children[colIndex].nextSibling);
                } else {
                    row.appendChild(newCell);
                }
            });

            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
        },

        deleteTableRow() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const sel = window.getSelection();
            let anchor = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
            let currentRow = anchor ? anchor.closest('tr') : null;
            let table = anchor ? anchor.closest('table') : null;

            if (!table || !currentRow) return;

            if (table.rows.length <= 1) {
                table.remove();
            } else {
                currentRow.remove();
            }

            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
        },

        deleteTableCol() {
            if (window.isAuditMode) return;
            this.restoreActiveSelection();
            const sel = window.getSelection();
            let anchor = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
            let currentCell = anchor ? anchor.closest('td, th') : null;
            let table = anchor ? anchor.closest('table') : null;

            if (!table || !currentCell) return;

            const colIndex = currentCell.cellIndex;
            const rows = Array.from(table.rows);

            if (rows[0] && rows[0].children.length <= 1) {
                table.remove();
            } else {
                rows.forEach(row => {
                    if (row.children[colIndex]) {
                        row.children[colIndex].remove();
                    }
                });
            }

            TextDocStateManager.pushHistory();
            MultiPageEngine.debouncePaginate();
            TextDocStateManager.triggerAutoSave();
        },

        openLinkModal() {
            const modal = document.getElementById('link-modal');
            const selection = window.getSelection();
            const textInput = document.getElementById('link-input-text');
            if (textInput && selection) {
                textInput.value = selection.toString();
            }
            if (modal) modal.style.display = 'flex';
        },
        closeLinkModal() {
            const modal = document.getElementById('link-modal');
            if (modal) modal.style.display = 'none';
        },
        confirmInsertLink() {
            const text = document.getElementById('link-input-text')?.value.trim() || 'Enlace';
            const url = document.getElementById('link-input-url')?.value.trim() || 'https://';
            if (url && url !== 'https://') {
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = text;
                this.insertNodeAtCursor(a);
                TextDocStateManager.pushHistory();
            }
            this.closeLinkModal();
        },

        openImageModal() {
            const modal = document.getElementById('image-modal');
            if (!modal) return;
            // Limpiar inputs anteriores
            const fi = document.getElementById('image-input-file');
            const ui = document.getElementById('image-input-url');
            if (fi) fi.value = '';
            if (ui) ui.value = '';
            modal.style.display = 'flex';
        },
        closeImageModal() {
            const modal = document.getElementById('image-modal');
            if (modal) modal.style.display = 'none';
            // Resetear modo reemplazo
            if (window.ImageEditorManager) window.ImageEditorManager._isReplaceMode = false;
            const title = modal?.querySelector('h4');
            if (title) title.textContent = 'Insertar Imagen';
        },
        confirmInsertImage() {
            const fileInput = document.getElementById('image-input-file');
            const urlInput = document.getElementById('image-input-url');
            const isReplace = window.ImageEditorManager?._isReplaceMode && window.ImageLayerManager?.selectedImg;

            if (fileInput && fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (isReplace) {
                        window.ImageEditorManager.confirmReplaceImage(e.target.result);
                    } else {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.alt = 'Imagen cargada';
                        this.insertNodeAtCursor(img);
                    }
                    TextDocStateManager.pushHistory();
                    MultiPageEngine.debouncePaginate();
                };
                reader.readAsDataURL(fileInput.files[0]);
            } else if (urlInput && urlInput.value.trim() && urlInput.value.trim() !== 'https://') {
                if (isReplace) {
                    window.ImageEditorManager.confirmReplaceImage(urlInput.value.trim());
                } else {
                    const img = document.createElement('img');
                    img.src = urlInput.value.trim();
                    img.alt = 'Imagen web';
                    this.insertNodeAtCursor(img);
                }
                TextDocStateManager.pushHistory();
                MultiPageEngine.debouncePaginate();
            }

            this.closeImageModal();
        },

        openSymbolsModal() {
            const modal = document.getElementById('symbols-modal');
            if (modal) modal.style.display = 'flex';
        },
        closeSymbolsModal() {
            const modal = document.getElementById('symbols-modal');
            if (modal) modal.style.display = 'none';
        },

        handleSmartPaste(rawHtml) {
            if (!rawHtml) return;

            // ─── Paso 1: Sanear en un documento INERTE (lista blanca) ───
            //     EduSec.sanitizeHtmlString usa DOMParser: no ejecuta scripts ni
            //     dispara onerror/onload. Elimina etiquetas de Office (o:, v:, w:, m:),
            //     comentarios, atributos on*, URLs javascript: y etiquetas peligrosas.
            let clean;
            if (window.EduSec && typeof window.EduSec.sanitizeHtmlString === 'function') {
                clean = window.EduSec.sanitizeHtmlString(rawHtml);
            } else {
                // Respaldo seguro: insertar como texto plano si el sanitizador no cargó
                const plain = new DOMParser().parseFromString(String(rawHtml), 'text/html').body.textContent || '';
                document.execCommand('insertText', false, plain);
                TextDocStateManager.pushHistory();
                DocStatsManager.update();
                return;
            }

            // ─── Paso 2: Parsear (ya saneado) y limpiar selectivamente ───
            const temp = document.createElement('div');
            temp.innerHTML = clean;
            temp.querySelectorAll('script, iframe, object, embed, meta, link').forEach(el => el.remove());

            // Estilos visuales a PRESERVAR (formato de texto visible)
            const keepStyles = [
                'font-weight', 'font-style', 'font-size', 'font-family',
                'text-decoration', 'text-align', 'color', 'background-color',
                'vertical-align', 'text-transform', 'letter-spacing'
            ];

            temp.querySelectorAll('*').forEach(el => {
                Array.from(el.attributes).forEach(attr => {
                    const attrName = attr.name.toLowerCase();
                    const attrVal = String(attr.value || '').trim().toLowerCase();
                    if (attrName.startsWith('on') || ((attrName === 'href' || attrName === 'src' || attrName === 'xlink:href' || attrName === 'action' || attrName === 'formaction') && attrVal.startsWith('javascript:'))) {
                        el.removeAttribute(attr.name);
                    }
                });

                // Eliminar clases de Office (Mso*) pero preservar las demás
                if (el.className) {
                    const classes = el.className.split(/\s+/).filter(c => !c.startsWith('Mso'));
                    if (classes.length > 0) {
                        el.className = classes.join(' ');
                    } else {
                        el.removeAttribute('class');
                    }
                }

                // Para estilos: conservar solo los visuales, quitar los de layout de Office
                if (el.hasAttribute('style')) {
                    const original = el.style;
                    const preserved = [];
                    for (const prop of keepStyles) {
                        const val = original.getPropertyValue(prop);
                        if (val) preserved.push(`${prop}:${val}`);
                    }
                    if (preserved.length > 0) {
                        el.setAttribute('style', preserved.join(';'));
                    } else {
                        el.removeAttribute('style');
                    }
                }
            });

            // ─── Paso 3: Convertir <div> sueltos a <p> para consistencia ───
            temp.querySelectorAll(':scope > div').forEach(div => {
                // Solo convertir divs de nivel superior que no tienen hijos de bloque
                const hasBlockChild = div.querySelector('p, h1, h2, h3, h4, h5, h6, ul, ol, table, blockquote, pre');
                if (!hasBlockChild) {
                    const p = document.createElement('p');
                    p.innerHTML = div.innerHTML;
                    Array.from(div.attributes).forEach(a => {
                        if (a.name !== 'class') p.setAttribute(a.name, a.value);
                    });
                    div.replaceWith(p);
                } else {
                    // Div con bloques internos → desenvolver (mover hijos fuera)
                    div.replaceWith(...div.childNodes);
                }
            });

            // ─── Paso 4: Insertar el HTML limpio ───
            const finalHTML = temp.innerHTML.trim();
            if (!finalHTML) return;

            document.execCommand('insertHTML', false, finalHTML);
            TextDocStateManager.pushHistory();
            DocStatsManager.update();
        },

        updateToolbarState() {
            const isStateActive = (cmd) => {
                try { return document.queryCommandState(cmd); } catch (e) { return false; }
            };

            const toggle = (id, active) => {
                const el = document.getElementById(id);
                if (el) el.classList.toggle('active', !!active);
            };

            const sel = window.getSelection();
            let pendingSpan = null;
            let node = null;
            if (sel && sel.rangeCount > 0) {
                node = sel.anchorNode;
                if (node && node.nodeType === 3) node = node.parentElement;
                pendingSpan = node ? node.closest('span[data-ec-pending="true"], span[data-ec-pending-color="true"], span[data-ec-pending-bg="true"]') : null;
            }

            const isBoldActive = (pendingSpan && pendingSpan.style.fontWeight)
                ? (pendingSpan.style.fontWeight === 'bold' || pendingSpan.style.fontWeight === '700')
                : isStateActive('bold');

            const isItalicActive = (pendingSpan && pendingSpan.style.fontStyle)
                ? (pendingSpan.style.fontStyle === 'italic')
                : isStateActive('italic');

            const isUnderlineActive = (pendingSpan && pendingSpan.style.textDecoration)
                ? pendingSpan.style.textDecoration.includes('underline')
                : isStateActive('underline');

            const isStrikeActive = (pendingSpan && pendingSpan.style.textDecoration)
                ? pendingSpan.style.textDecoration.includes('line-through')
                : isStateActive('strikeThrough');

            const isSupActive = (pendingSpan && pendingSpan.style.verticalAlign)
                ? (pendingSpan.style.verticalAlign === 'super')
                : isStateActive('superscript');

            const isSubActive = (pendingSpan && pendingSpan.style.verticalAlign)
                ? (pendingSpan.style.verticalAlign === 'sub')
                : isStateActive('subscript');

            toggle('btn-bold', isBoldActive);
            toggle('btn-italic', isItalicActive);
            toggle('btn-underline', isUnderlineActive);
            toggle('btn-strike', isStrikeActive);
            toggle('btn-sup', isSupActive);
            toggle('btn-sub', isSubActive);
            const isCodeActive = !!(node && (node.closest('code') || (pendingSpan && pendingSpan.dataset.ecPendingCode === "true")));
            toggle('btn-code', isCodeActive);
            toggle('btn-align-left', isStateActive('justifyLeft'));
            toggle('btn-align-center', isStateActive('justifyCenter'));
            toggle('btn-align-right', isStateActive('justifyRight'));
            toggle('btn-align-justify', isStateActive('justifyFull'));
            toggle('btn-list-ul', isStateActive('insertUnorderedList'));
            toggle('btn-list-ol', isStateActive('insertOrderedList'));

            // Sincronizar indicadores de color de texto y fondo si hay pendingSpan o nodo activo
            if (pendingSpan) {
                if (pendingSpan.style.color) {
                    const ind = document.getElementById('indicator-text-color');
                    if (ind) ind.style.backgroundColor = pendingSpan.style.color;
                }
                if (pendingSpan.style.backgroundColor && pendingSpan.style.backgroundColor !== 'transparent') {
                    const ind = document.getElementById('indicator-bg-color');
                    if (ind) ind.style.backgroundColor = pendingSpan.style.backgroundColor;
                }
            } else if (node && node.nodeType === 1) {
                try {
                    const comp = window.getComputedStyle(node);
                    if (comp.color) {
                        const ind = document.getElementById('indicator-text-color');
                        if (ind) ind.style.backgroundColor = comp.color;
                    }
                    if (comp.backgroundColor && comp.backgroundColor !== 'transparent' && comp.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                        const ind = document.getElementById('indicator-bg-color');
                        if (ind) ind.style.backgroundColor = comp.backgroundColor;
                    }
                } catch (_) {}
            }

            // Sincronizar fuente, tamaño y estilo de bloque del nodo activo
            try {
                if (node && node.nodeType === 1) {
                    const computed = window.getComputedStyle(node);
                        
                        // 1. Tipografía activa
                        const fontSelect = document.getElementById('font-family-select');
                        if (fontSelect && computed.fontFamily) {
                            const firstFont = computed.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
                            if (firstFont) {
                                for (let i = 0; i < fontSelect.options.length; i++) {
                                    if (fontSelect.options[i].value.toLowerCase() === firstFont.toLowerCase()) {
                                        if (fontSelect.value !== fontSelect.options[i].value) {
                                            fontSelect.value = fontSelect.options[i].value;
                                            if (fontSelect._glassInstance) {
                                                fontSelect._glassInstance.updateTriggerLabel();
                                            }
                                        }
                                        break;
                                    }
                                }
                            }
                        }

                        // 2. Tamaño de fuente activo
                        const sizeSelect = document.getElementById('font-size-select');
                        if (sizeSelect && computed.fontSize) {
                            const ptSize = Math.round(parseFloat(computed.fontSize) * 0.75);
                            const sizeVal = String(ptSize);
                            for (let i = 0; i < sizeSelect.options.length; i++) {
                                const optV = sizeSelect.options[i].value;
                                if (optV === sizeVal || optV === `${sizeVal}px` || optV === `${sizeVal}pt`) {
                                    if (sizeSelect.value !== optV) {
                                        sizeSelect.value = optV;
                                        if (sizeSelect._glassInstance) {
                                            sizeSelect._glassInstance.updateTriggerLabel();
                                        }
                                    }
                                    break;
                                }
                            }
                        }

                        // 3. Estilo de bloque activo (p, h1, h2, h3, blockquote, callout)
                        const blockSelect = document.getElementById('block-style-select');
                        if (blockSelect) {
                            const blockEl = node.closest('h1, h2, h3, blockquote, .edu-callout, p');
                            if (blockEl) {
                                let blockTag = blockEl.tagName.toLowerCase();
                                if (blockEl.classList.contains('edu-callout')) {
                                    if (blockEl.classList.contains('info')) blockTag = 'callout-info';
                                    else if (blockEl.classList.contains('success')) blockTag = 'callout-success';
                                    else if (blockEl.classList.contains('danger')) blockTag = 'callout-danger';
                                }
                                if (blockSelect.value !== blockTag) {
                                    blockSelect.value = blockTag;
                                    if (blockSelect._glassInstance) {
                                        blockSelect._glassInstance.updateTriggerLabel();
                                    }
                                }
                            }
                        }
                    }
            } catch (_) {}
        }
    };

    // =====================================================================
    // 5. PLANTILLAS CONTABLES Y LEGALES DE EL SALVADOR (DocumentTemplates)


    /* ===================================================================
     * MODULO: collab.js
     * =================================================================== */
/**
 * collab.js — CollabPresenceManager
 * Colaboración en tiempo real y presencia con Supabase Realtime.
 * EduConta SV
 */




    const CollabPresenceManager = {
        channel: null,
        dbChannel: null,
        currentUserId: null,
        currentUserEmail: null,
        userName: null,
        userColor: null,
        presences: {},
        contentThrottleTimer: null,
        lastBroadcastHTML: '',

        PALETTE: [
            '#0ea5e9', '#10b981', '#8b5cf6', '#f43f5e', 
            '#f59e0b', '#06b6d4', '#ec4899', '#3b82f6', '#14b8a6'
        ],

        async init(projectId) {
            if (!projectId) return;

            // 1. Obtener usuario de Supabase Auth o generar perfil consistente para invitados
            let session = null;
            if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) {
                try {
                    const res = await window.supabaseClient.auth.getSession();
                    session = res.data?.session;
                } catch (e) {}
            }

            if (session && session.user) {
                this.currentUserId = session.user.id;
                this.currentUserEmail = session.user.email;
                this.userName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario';
            } else {
                let storedUid = sessionStorage.getItem('educonta_collab_uid');
                if (!storedUid) {
                    storedUid = 'guest_' + Math.random().toString(36).substring(2, 9);
                    sessionStorage.setItem('educonta_collab_uid', storedUid);
                }
                this.currentUserId = storedUid;
                this.userName = sessionStorage.getItem('educonta_collab_name') || `Invitado ${Math.floor(100 + Math.random() * 900)}`;
                this.currentUserEmail = '';
            }

            // Asignar color distintivo según el hash del ID
            let hash = 0;
            for (let i = 0; i < this.currentUserId.length; i++) hash += this.currentUserId.charCodeAt(i);
            this.userColor = this.PALETTE[Math.abs(hash) % this.PALETTE.length];

            this.renderPresenceUI();

            // 2. Conectar a Supabase Realtime si está disponible
            if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) {
                try {
                    if (this.channel) {
                        window.supabaseClient.removeChannel(this.channel);
                    }

                    // Canal Broadcast y Presencia
                    this.channel = window.supabaseClient
                        .channel(`collab-textos-${projectId}`, {
                            config: {
                                presence: { key: this.currentUserId },
                                broadcast: { ack: false }
                            }
                        });

                    this.channel
                        // Presencia (Usuarios Conectados)
                        .on('presence', { event: 'sync' }, () => this.handlePresenceSync())
                        .on('presence', { event: 'join' }, ({ newPresences }) => this.handleUserJoin(newPresences))
                        .on('presence', { event: 'leave' }, ({ leftPresences }) => this.handleUserLeave(leftPresences))
                        // Eventos en Vivo (Contenido, Secciones, Configuración)
                        .on('broadcast', { event: 'content_patch' }, ({ payload }) => this.handleRemoteContentPatch(payload))
                        .on('broadcast', { event: 'sheet_event' }, ({ payload }) => this.handleRemoteSheetEvent(payload))
                        .on('broadcast', { event: 'layout_change' }, ({ payload }) => this.handleRemoteLayoutChange(payload))
                        .on('broadcast', { event: 'doc_update' }, ({ payload }) => this.handleRemoteUpdate(payload))
                        .subscribe(async (status) => {
                            if (status === 'SUBSCRIBED') {
                                await this.channel.track({
                                    user_id: this.currentUserId,
                                    user_name: this.userName,
                                    user_color: this.userColor,
                                    active_sheet_idx: TextDocStateManager.activeSheetIndex,
                                    online_at: new Date().toISOString()
                                });
                                this.renderPresenceUI();
                            }
                        });

                    // Canal Postgres Changes para actualizaciones guardadas en la base de datos
                    if (this.dbChannel) {
                        window.supabaseClient.removeChannel(this.dbChannel);
                    }
                    this.dbChannel = window.supabaseClient
                        .channel(`db-collab-textos-${projectId}`)
                        .on('postgres_changes', {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'proyectos_contables',
                            filter: `id=eq.${projectId}`
                        }, (payload) => {
                            if (payload.new && payload.new.data) {
                                const incoming = payload.new.data;
                                if (incoming.last_modified_by && incoming.last_modified_by === this.currentUserId) {
                                    return;
                                }
                                this.handleRemoteUpdate({ project: incoming, sender_id: incoming.last_modified_by });
                            }
                        })
                        .subscribe();
                } catch (err) {
                    console.warn('Error inicializando canal de colaboración:', err);
                }
            }

            // Configurar enlace para compartir en el modal
            this.setupShareLink();
        },

        escapeHtml(str) {
            return String(str ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },

        handlePresenceSync() {
            if (!this.channel) return;
            this.presences = this.channel.presenceState() || {};
            this.renderPresenceUI();
        },

        handleUserJoin(newPresences) {
            this.handlePresenceSync();
            (newPresences || []).forEach(p => {
                if (p.user_id !== this.currentUserId) {
                    TextDocStateManager.showToast(`🟢 ${p.user_name || 'Un colaborador'} se ha unido al documento`);
                }
            });
        },

        handleUserLeave(leftPresences) {
            this.handlePresenceSync();
        },

        renderPresenceUI() {
            const container = document.getElementById('collab-presence-container');
            const liveList = document.getElementById('collaborators-live-list');
            const countLabel = document.getElementById('collab-live-count-label');

            let userList = [];
            Object.keys(this.presences).forEach(k => {
                const p = this.presences[k];
                if (Array.isArray(p) && p.length > 0) {
                    userList.push(p[0]);
                }
            });

            // Asegurar que al menos el usuario actual aparezca
            if (userList.length === 0 && this.currentUserId) {
                userList = [{ user_id: this.currentUserId, user_name: this.userName, user_color: this.userColor }];
            }

            if (container) {
                container.innerHTML = userList.slice(0, 5).map(u => {
                    const isMe = u.user_id === this.currentUserId;
                    const initials = this.escapeHtml((u.user_name || 'U').substring(0, 2).toUpperCase());
                    const safeName = this.escapeHtml(u.user_name || 'Colaborador');
                    return `
                        <div class="collab-avatar-bubble" style="background-color: ${u.user_color || '#f59e0b'};" title="${safeName} ${isMe ? '(Tú)' : ''}">
                            ${initials}
                        </div>
                    `;
                }).join('');

                if (userList.length > 5) {
                    container.innerHTML += `<div class="collab-avatar-bubble bg-slate-700 text-[9px] font-bold">+${userList.length - 5}</div>`;
                }
            }

            if (countLabel) {
                countLabel.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> ${userList.length} ${userList.length === 1 ? 'conectado' : 'conectados'}`;
            }

            if (liveList) {
                liveList.innerHTML = userList.map(u => {
                    const isMe = u.user_id === this.currentUserId;
                    const safeName = this.escapeHtml(u.user_name || 'Colaborador');
                    return `
                        <div class="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                            <div class="flex items-center gap-2">
                                <span class="w-3 h-3 rounded-full" style="background-color: ${u.user_color || '#f59e0b'};"></span>
                                <span class="font-bold text-slate-800 dark:text-slate-200">${safeName} ${isMe ? '<span class="text-[10px] text-amber-500 font-bold">(Tú)</span>' : ''}</span>
                            </div>
                            <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest">En Línea</span>
                        </div>
                    `;
                }).join('');
            }
        },

        // --- BROADCAST DE ESCRITURA EN VIVO (THROTTLED) ---
        broadcastContent(cleanHTML, sheetIdx) {
            if (!this.channel || !this.currentUserId || window.isAuditMode) return;
            if (TextDocStateManager.getUserRole && TextDocStateManager.getUserRole() === 'lector') return;

            if (this.contentThrottleTimer) return;
            this.contentThrottleTimer = setTimeout(() => {
                this.contentThrottleTimer = null;
                const htmlToSend = cleanHTML || (typeof MultiPageEngine !== 'undefined' && typeof MultiPageEngine.getCleanHTML === 'function' ? MultiPageEngine.getCleanHTML() : '');
                if (!htmlToSend || htmlToSend === this.lastBroadcastHTML) return;
                this.lastBroadcastHTML = htmlToSend;
                const targetIdx = sheetIdx !== undefined ? sheetIdx : TextDocStateManager.activeSheetIndex;
                this.channel.send({
                    type: 'broadcast',
                    event: 'content_patch',
                    payload: {
                        sender_id: this.currentUserId,
                        sheet_idx: targetIdx,
                        content: htmlToSend,
                        timestamp: Date.now()
                    }
                }).catch(() => {});
            }, 250);
        },

        handleRemoteContentPatch(payload) {
            if (!payload || payload.sender_id === this.currentUserId || !TextDocStateManager.currentProject) return;

            const targetSheetIdx = payload.sheet_idx;
            const sheet = TextDocStateManager.currentProject.sheets[targetSheetIdx];
            if (!sheet) return;

            // Actualizar contenido en memoria del proyecto
            sheet.content = payload.content;
            sheet.pages = [payload.content];

            // Si la hoja que se está editando remotamente es la que el usuario tiene abierta actualmente
            if (targetSheetIdx === TextDocStateManager.activeSheetIndex) {
                MultiPageEngine.saveCursor();
                MultiPageEngine.loadContent(payload.content, false);
                MultiPageEngine.restoreCursor();
                DocStatsManager.update();
            }
        },

        // --- GESTIÓN DE SECCIONES REMOTAS ---
        broadcastSheetEvent(eventType, sheetData, sheetIdx) {
            if (!this.channel || !this.currentUserId || window.isAuditMode) return;
            if (TextDocStateManager.getUserRole && TextDocStateManager.getUserRole() === 'lector') return;
            this.channel.send({
                type: 'broadcast',
                event: 'sheet_event',
                payload: {
                    sender_id: this.currentUserId,
                    event_type: eventType,
                    sheet_data: sheetData,
                    sheet_idx: sheetIdx,
                    all_sheets: TextDocStateManager.currentProject?.sheets
                }
            }).catch(() => {});
        },

        handleRemoteSheetEvent(payload) {
            if (!payload || payload.sender_id === this.currentUserId || !TextDocStateManager.currentProject) return;

            if (Array.isArray(payload.all_sheets)) {
                TextDocStateManager.currentProject.sheets = payload.all_sheets;
                if (TextDocStateManager.activeSheetIndex >= TextDocStateManager.currentProject.sheets.length) {
                    TextDocStateManager.activeSheetIndex = 0;
                }
                TextDocStateManager.renderSheetSelect();
                TextDocStateManager.loadActiveSheet();
                TextDocStateManager.showToast('Estructura de secciones actualizada por un colaborador');
            }
        },

        // --- GESTIÓN DE GEOMETRÍA DE PÁGINA REMOTA ---
        broadcastLayoutChange(layoutConfig) {
            if (!this.channel || !this.currentUserId || window.isAuditMode) return;
            if (TextDocStateManager.getUserRole && TextDocStateManager.getUserRole() === 'lector') return;
            this.channel.send({
                type: 'broadcast',
                event: 'layout_change',
                payload: {
                    sender_id: this.currentUserId,
                    sheet_idx: TextDocStateManager.activeSheetIndex,
                    layout: layoutConfig
                }
            }).catch(() => {});
        },

        handleRemoteLayoutChange(payload) {
            if (!payload || payload.sender_id === this.currentUserId || !TextDocStateManager.currentProject) return;

            const sheet = TextDocStateManager.currentProject.sheets[payload.sheet_idx];
            if (!sheet || !payload.layout) return;

            Object.assign(sheet, payload.layout);

            if (payload.sheet_idx === TextDocStateManager.activeSheetIndex) {
                PageLayoutManager.applyPageGeometry(sheet.pageSize, sheet.margins, sheet.lineSpacing, sheet.orientation);
                MultiPageEngine.updateAllPageNumbers();
                MultiPageEngine.paginate();
            }
        },

        // --- ACTUALIZACIÓN DE ESTADO COMPLETO DEL DOCUMENTO ---
        broadcastUpdate(project) {
            if (!this.channel || !this.currentUserId || window.isAuditMode) return;
            if (TextDocStateManager.getUserRole && TextDocStateManager.getUserRole() === 'lector') return;
            this.channel.send({
                type: 'broadcast',
                event: 'doc_update',
                payload: { sender_id: this.currentUserId, project: project }
            }).catch(() => {});
        },

        handleRemoteUpdate(payload) {
            const incoming = payload.project;
            if (!incoming || incoming.id !== TextDocStateManager.currentProject?.id) return;

            if (new Date(incoming.updatedAt) > new Date(TextDocStateManager.currentProject.updatedAt)) {
                TextDocStateManager.currentProject = incoming;
                TextDocStateManager.renderSheetSelect();
                TextDocStateManager.loadActiveSheet();
                this.renderCollaboratorsList();
                TextDocStateManager.showToast('Documento actualizado por un colaborador');
            }
        },

        // --- MODAL DE COMPARTIR Y ENLACE DE INVITACIÓN ---
        setupShareLink() {
            const linkInput = document.getElementById('share-invite-link');
            if (linkInput && TextDocStateManager.currentProject) {
                linkInput.value = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(TextDocStateManager.currentProject.id)}&collab=true`;
            }
        },

        async copyInviteLink() {
            this.setupShareLink();
            const linkInput = document.getElementById('share-invite-link');
            const url = linkInput?.value || `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(TextDocStateManager.currentProject?.id || '')}&collab=true`;

            try {
                await navigator.clipboard.writeText(url);
                const btn = document.getElementById('btn-copy-invite');
                if (btn) {
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check text-xs"></i> <span>¡Copiado!</span>';
                    btn.classList.replace('bg-sky-500', 'bg-emerald-600');
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.classList.replace('bg-emerald-600', 'bg-sky-500');
                    }, 2200);
                }
                TextDocStateManager.showToast('¡Enlace de invitación copiado al portapapeles!');
            } catch (e) {
                if (linkInput) {
                    linkInput.select();
                    document.execCommand('copy');
                    TextDocStateManager.showToast('¡Enlace copiado!');
                }
            }
        },

        async openShareModal() {
            const modal = document.getElementById('share-modal');
            if (!modal) return;

            const proj = TextDocStateManager.currentProject;
            const titleEl = document.getElementById('editor-share-modal-title');
            const subEl = document.getElementById('editor-share-modal-subtitle');
            if (titleEl && proj) titleEl.textContent = `Gestión de Acceso: "${proj.name || 'Documento'}"`;
            if (subEl && proj) {
                subEl.textContent = 'Controla quién puede ver y editar este documento en tiempo real.';
            }

            // 1. Mostrar Administrador / Propietario en la tarjeta superior
            const adminNameEl = document.getElementById('editor-doc-admin-name');
            if (adminNameEl && proj) {
                let ownerDisplay = proj.owner_name || proj.owner_email || 'Propietario del Documento';
                if (proj.owner_id && this.currentUserId && proj.owner_id === this.currentUserId) {
                    ownerDisplay += ' (Tú)';
                } else if (!proj.owner_id && this.currentUserId) {
                    ownerDisplay = (this.userName || 'Tú') + ' (Propietario)';
                }
                adminNameEl.textContent = ownerDisplay;
            }

            // 2. Configurar enlace oculto (por si se reactiva o inspecciona)
            this.setupShareLink();

            // 3. Limpiar campo de texto y selector de rol
            const input = document.getElementById('share-uid-input');
            if (input) input.value = '';

            const roleSelect = document.getElementById('share-role-select');
            if (roleSelect) roleSelect.value = 'editor';

            this.renderPresenceUI();
            this.renderCollaboratorsList();

            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            modal.classList.add('active');
        },

        closeShareModal() {
            const modal = document.getElementById('share-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
                modal.classList.remove('active');
            }
        },

        async addCollaborator() {
            if (window.isAuditMode) return;
            const input = document.getElementById('share-uid-input');
            const roleSelect = document.getElementById('share-role-select');
            const uid = input?.value.trim();
            const role = roleSelect?.value || 'editor';

            if (!uid || !TextDocStateManager.currentProject) {
                TextDocStateManager.showToast('Ingresa el UID del usuario');
                input?.focus();
                return;
            }

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(uid)) {
                TextDocStateManager.showToast('El UID ingresado no tiene un formato UUID válido');
                input?.focus();
                return;
            }

            if (this.currentUserId && uid === this.currentUserId) {
                TextDocStateManager.showToast('No puedes añadirte a ti mismo como invitado');
                return;
            }

            if (!Array.isArray(TextDocStateManager.currentProject.shared_with)) {
                TextDocStateManager.currentProject.shared_with = [];
            }
            if (!TextDocStateManager.currentProject.collaborator_roles) {
                TextDocStateManager.currentProject.collaborator_roles = {};
            }

            if (TextDocStateManager.currentProject.shared_with.includes(uid)) {
                TextDocStateManager.showToast('Este usuario ya está en la lista');
                return;
            }

            TextDocStateManager.currentProject.shared_with.push(uid);
            TextDocStateManager.currentProject.collaborator_roles[uid] = role;
            TextDocStateManager.currentProject.updatedAt = new Date().toISOString();
            if (input) input.value = '';

            TextDocStateManager.saveState();
            this.broadcastUpdate(TextDocStateManager.currentProject);
            TextDocStateManager.syncCloud(false);
            this.renderCollaboratorsList();
            TextDocStateManager.showToast(`¡Invitado añadido en ${role === 'editor' ? 'Modo Editor' : 'Modo Lectura'}!`);
        },

        async setCollaboratorRole(uid, role) {
            if (window.isAuditMode || !TextDocStateManager.currentProject) return;

            if (!TextDocStateManager.currentProject.collaborator_roles) {
                TextDocStateManager.currentProject.collaborator_roles = {};
            }

            TextDocStateManager.currentProject.collaborator_roles[uid] = role;
            TextDocStateManager.currentProject.updatedAt = new Date().toISOString();

            TextDocStateManager.saveState();
            this.broadcastUpdate(TextDocStateManager.currentProject);
            TextDocStateManager.syncCloud(false);
            this.renderCollaboratorsList();
            TextDocStateManager.showToast(`Permiso actualizado a ${role === 'editor' ? 'Modo Editor' : 'Modo Lectura'}`);
        },

        async removeCollaborator(uid) {
            if (window.isAuditMode || !TextDocStateManager.currentProject || !Array.isArray(TextDocStateManager.currentProject.shared_with)) return;

            TextDocStateManager.currentProject.shared_with = TextDocStateManager.currentProject.shared_with.filter(u => u !== uid);
            if (TextDocStateManager.currentProject.collaborator_roles) {
                delete TextDocStateManager.currentProject.collaborator_roles[uid];
            }
            TextDocStateManager.currentProject.updatedAt = new Date().toISOString();

            TextDocStateManager.saveState();
            this.broadcastUpdate(TextDocStateManager.currentProject);
            TextDocStateManager.syncCloud(false);
            this.renderCollaboratorsList();
            TextDocStateManager.showToast('Invitado eliminado');
        },

        renderCollaboratorsList() {
            const container = document.getElementById('collaborators-list');
            const countEl = document.getElementById('editor-share-collaborators-count');
            if (!container || !TextDocStateManager.currentProject) return;

            const list = TextDocStateManager.currentProject.shared_with || [];
            const roles = TextDocStateManager.currentProject.collaborator_roles || {};
            container.innerHTML = '';

            if (list.length === 0) {
                if (countEl) countEl.textContent = '0 invitados';
                container.innerHTML = `
                    <div class="py-5 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        <i class="fas fa-user-shield text-lg mb-1 text-slate-300 dark:text-slate-600"></i>
                        <p>No hay invitados registrados. Solo el administrador tiene acceso.</p>
                    </div>
                `;
                return;
            }

            if (countEl) countEl.textContent = `${list.length} invitado${list.length === 1 ? '' : 's'}`;

            list.forEach((uid, index) => {
                const role = roles[uid] || 'editor';
                const safeUid = this.escapeHtml(uid);
                const shortUid = this.escapeHtml(uid.length > 16 ? `${uid.substring(0, 8)}...${uid.substring(uid.length - 6)}` : uid);
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs gap-2';
                item.innerHTML = `
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                        <div class="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                            ${index + 1}
                        </div>
                        <div class="min-w-0">
                            <p class="font-mono font-bold text-slate-700 dark:text-slate-300 truncate text-[11px] select-all" title="${safeUid}">${shortUid}</p>
                            <span class="text-[9px] ${role === 'editor' ? 'text-emerald-500' : 'text-sky-500'} font-semibold flex items-center gap-1">
                                <i class="fas ${role === 'editor' ? 'fa-pen-to-square' : 'fa-book-open'} text-[8px]"></i>
                                ${role === 'editor' ? 'Modo Editor' : 'Modo Lectura'}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        ${!window.isAuditMode ? `
                            <select onchange="window.CollabPresenceManager?.setCollaboratorRole('${safeUid}', this.value)" 
                                class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-amber-500 cursor-pointer shadow-sm">
                                <option value="editor" ${role === 'editor' ? 'selected' : ''}>Modo Editor</option>
                                <option value="lector" ${role === 'lector' ? 'selected' : ''}>Modo Lectura</option>
                            </select>
                            <button onclick="window.CollabPresenceManager?.removeCollaborator('${safeUid}')" 
                                class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all shrink-0"
                                title="Eliminar invitado">
                                <i class="fas fa-trash-alt text-xs"></i>
                            </button>
                        ` : `
                            <span class="text-[10px] font-bold text-slate-400 capitalize">${this.escapeHtml(role)}</span>
                        `}
                    </div>
                `;
                container.appendChild(item);
            });
        }
    };


    /* ===================================================================
     * MODULO: state.js
     * =================================================================== */
/**
 * state.js — TextDocStateManager
 * Estado global, proyectos, undo/redo, autosave y sync cloud.
 * EduConta SV
 */







const TextDocStateManager = {
        projects: [],
        currentProject: null,
        activeSheetIndex: 0,
        historyStack: [],
        historyIndex: -1,
        autoSaveTimer: null,
        historyTimer: null,
        // DT-3: Candado anti-concurrencia para sincronización cloud
        _syncPending: false,
        cloudSyncTimer: null,

        async init() {
            // 1. Inyectar Componentes Compartidos (Navbar, Auth)
            try {
                if (typeof window.injectSharedUI === 'function') {
                    window.injectSharedUI('shared-components-root');
                }
            } catch (e) {
                console.warn('Error inyectando componentes compartidos:', e);
            }

            // 2. Mostrar botón Volver en Navbar si aplica
            setTimeout(() => {
                const btnVolver = document.getElementById('btn-volver');
                if (btnVolver && !window.isAuditMode) {
                    btnVolver.classList.remove('hidden');
                }
            }, 60);

            // 3. Cargar proyectos (esperar en caso de carga remota de Supabase)
            await this.loadProjects();

            // 4. Poblar grid de símbolos y colores presets
            this.populateSymbols();
            initColorPresetsGrid();

            // 5. Inicializar Presencia Colaborativa con Supabase
            if (this.currentProject) {
                CollabPresenceManager.init(this.currentProject.id);
            }

            // 6. Inicializar Gestor de Capas, Editor de Imagen y Recorte
            ImageLayerManager.init();
            if (window.ImageEditorManager?.init) window.ImageEditorManager.init();
            if (window.ImageCropManager?.init) window.ImageCropManager.init();

            // 7. Modo auditoría
            if (window.isAuditMode) {
                AuditModeHandler.apply();
            }

            // 8. Esperar a que las fuentes y el renderizado inicial de páginas se estabilicen antes de desvanecer el preloader
            if (document.fonts && document.fonts.ready) {
                try { await document.fonts.ready; } catch (e) {}
            }
            setTimeout(() => {
                if (typeof window.dismissGlobalPreloader === 'function') {
                    window.dismissGlobalPreloader();
                }
            }, 80);

            // 9. Activar inmediatamente el cursor en la hoja al entrar al editor
            if (!window.isAuditMode && this.getUserRole() !== 'lector') {
                requestAnimationFrame(() => {
                    MultiPageEngine.focusActiveEditor(true);
                });
                setTimeout(() => {
                    MultiPageEngine.focusActiveEditor(true);
                }, 120);
                setTimeout(() => {
                    MultiPageEngine.focusActiveEditor(true);
                }, 320);
            }
        },

        async loadProjects() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                this.projects = raw ? JSON.parse(raw) : [];
            } catch (e) {
                this.projects = [];
            }

            const urlParams = new URLSearchParams(window.location.search);
            const paramId = urlParams.get('id');
            const lastId = paramId || localStorage.getItem(LAST_ID_KEY);

            if (this.projects.length > 0) {
                this.currentProject = this.projects.find(p => p.id === lastId) || this.projects[0];
            }

            // Si se especificó un id por URL (?id=... / ?collab=true) y no está en la lista local, intentar cargar de Supabase
            if ((!this.currentProject || this.currentProject.id !== paramId) && paramId && typeof window.supabaseClient !== 'undefined') {
                try {
                    const { data, error } = await window.supabaseClient
                        .from('proyectos_contables')
                        .select('*')
                        .eq('data->>id', paramId)
                        .maybeSingle();

                    if (data && data.data) {
                        this.currentProject = data.data;
                        const existingIdx = this.projects.findIndex(p => p.id === this.currentProject.id);
                        if (existingIdx !== -1) {
                            this.projects[existingIdx] = this.currentProject;
                        } else {
                            this.projects.unshift(this.currentProject);
                        }
                        this.saveToStorage();
                    }
                } catch (err) {
                    console.warn("No se pudo cargar documento remoto desde Supabase por ID:", err);
                }
            }

            // Si se especificó un id por URL y no está en textos ni en Supabase, buscarlo en otras bóvedas locales
            if ((!this.currentProject || this.currentProject.id !== lastId) && paramId) {
                const otherVaults = ['educonta_projects_calculo', 'educonta_projects_lienzos', 'educonta_projects_diagramas'];
                for (const vKey of otherVaults) {
                    try {
                        const list = JSON.parse(localStorage.getItem(vKey)) || [];
                        const found = list.find(p => p.id === paramId);
                        if (found) {
                            found.type = 'textos';
                            this.projects.unshift(found);
                            this.currentProject = found;
                            this.saveToStorage();
                            break;
                        }
                    } catch(e) {}
                }
            }

            // Crear documento por defecto si no existe ninguno
            if (!this.currentProject) {
                const defaultProject = {
                    id: 'doc_textos_' + Date.now(),
                    name: 'Documento Sin Título',
                    type: 'textos',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    shared_with: [],
                    sheets: [
                        {
                            name: 'Página Inicial',
                            pageSize: 'letter',
                            orientation: 'portrait',
                            margins: { top: 25, bottom: 25, left: 25, right: 25 },
                            marginPreset: 'normal',
                            lineSpacing: '15',
                            headerFooter: {
                                showHeader: false,
                                showFooter: false,
                                headerText: '',
                                footerText: '',
                                showPageNumbers: false
                            },
                            content: '<h1>Documento Sin Título</h1><p>Comienza a redactar tu documento contable o empresarial aquí...</p>'
                        }
                    ]
                };
                this.projects = [defaultProject];
                this.currentProject = defaultProject;
                this.saveToStorage();
            }

            localStorage.setItem(LAST_ID_KEY, this.currentProject.id);

            // Asegurar estructura
            if (!this.currentProject.sheets || this.currentProject.sheets.length === 0) {
                this.currentProject.sheets = [{
                    name: 'Página Inicial',
                    pageSize: 'letter',
                    orientation: 'portrait',
                    margins: { top: 25, bottom: 25, left: 25, right: 25 },
                    marginPreset: 'normal',
                    lineSpacing: '15',
                    fontFamily: 'Plus Jakarta Sans',
                    headerFooter: {
                        showHeader: false,
                        showFooter: false,
                        headerText: '',
                        footerText: '',
                        showPageNumbers: false
                    },
                    content: '<p></p>'
                }];
            }

            if (!Array.isArray(this.currentProject.shared_with)) {
                this.currentProject.shared_with = [];
            }

            // Actualizar título en interfaz y pestaña
            const titleEl = document.getElementById('current-project-name');
            if (titleEl) {
                titleEl.textContent = this.currentProject.name || 'Sin Nombre';
            }
            if (this.currentProject.name) {
                document.title = `${this.currentProject.name} | EduConta SV`;
            }

            // Cargar selector de secciones y renderizar páginas
            this.activeSheetIndex = 0;
            this.renderSheetSelect();
            this.loadActiveSheet();
        },

        loadActiveSheet() {
            const sheet = this.currentProject.sheets[this.activeSheetIndex];
            if (!sheet) return;

            // Extraer contenido HTML
            let contentHTML = '';
            if (sheet.content) {
                contentHTML = sheet.content;
            } else if (sheet.pages && Array.isArray(sheet.pages)) {
                contentHTML = sheet.pages.join('');
            } else {
                contentHTML = '<p></p>';
            }

            // Asegurar estructura de márgenes y tipografía
            if (typeof sheet.margins === 'string') {
                sheet.marginPreset = sheet.margins;
                sheet.margins = MARGIN_PRESETS[sheet.margins] || MARGIN_PRESETS.normal;
            } else if (!sheet.margins) {
                sheet.margins = MARGIN_PRESETS.normal;
                sheet.marginPreset = 'normal';
            }
            if (!sheet.orientation) sheet.orientation = 'portrait';
            if (!sheet.pageSize) sheet.pageSize = 'letter';
            if (!sheet.lineSpacing) sheet.lineSpacing = '15';
            if (!sheet.fontFamily) sheet.fontFamily = 'Plus Jakarta Sans';

            // Asegurar configuración de encabezado y pie
            if (!sheet.headerFooter) {
                sheet.headerFooter = {
                    showHeader: false,
                    showFooter: false,
                    headerText: '',
                    footerText: '',
                    showPageNumbers: false
                };
            }

            // Aplicar geometría y tipografía en pantalla
            window.PageLayoutManager?.applyPageGeometry(sheet.pageSize, sheet.margins, sheet.lineSpacing, sheet.orientation, sheet.fontFamily);

            // Inicializar el cuerpo unificado en el DOM
            MultiPageEngine.loadContent(contentHTML);

            // Historial inicial
            this.historyStack = [MultiPageEngine.getCleanHTML()];
            this.historyIndex = 0;
            this.updateUndoRedoUI();

            // Actualizar estadísticas
            DocStatsManager.update();

            // Aplicar permisos según rol (editor vs lector)
            this.checkAndApplyPermissions();

            // Sincronizar corrector de ortografía
            window.SpellCheckManager?.applyToAllSurfaces();

            // Enfocar la hoja automáticamente al cargar o cambiar de sección si tiene permisos de edición
            if (!window.isAuditMode && this.getUserRole() !== 'lector') {
                requestAnimationFrame(() => {
                    MultiPageEngine.focusActiveEditor(true);
                });
            }
        },

        getUserRole() {
            if (window.isAuditMode) return 'lector';
            if (!this.currentProject) return 'editor';

            const myUid = CollabPresenceManager.currentUserId;
            // Si el proyecto tiene owner_id y coincide con el usuario actual o no hay owner_id fijado -> admin/owner
            if (!this.currentProject.owner_id || (myUid && this.currentProject.owner_id === myUid)) {
                return 'owner';
            }

            // Si es un colaborador invitado, verificar su rol configurado
            if (myUid && this.currentProject.collaborator_roles && this.currentProject.collaborator_roles[myUid]) {
                return this.currentProject.collaborator_roles[myUid];
            }

            return 'editor';
        },

        checkAndApplyPermissions() {
            const role = this.getUserRole();
            const isReadOnly = (role === 'lector' || window.isAuditMode);

            document.querySelectorAll('.page-editor-surface').forEach(surface => {
                surface.setAttribute('contenteditable', isReadOnly ? 'false' : 'true');
            });

            // Si es modo lectura, deshabilitar herramientas de formato
            const formattingTools = document.querySelectorAll('.tool-btn:not(#btn-theme-toggle):not(#btn-zoom-in):not(#btn-zoom-out):not(#btn-reset-zoom):not(#btn-find-replace), #font-family-select, #font-size-select, #block-style-select, #page-size-select, #page-margins-select, #page-spacing-select, #text-color-input, #bg-color-input');
            formattingTools.forEach(el => {
                if (isReadOnly) {
                    el.disabled = true;
                    el.style.opacity = '0.4';
                    el.style.pointerEvents = 'none';
                } else if (!window.isAuditMode) {
                    el.disabled = false;
                    el.style.opacity = '1';
                    el.style.pointerEvents = 'auto';
                }
            });

            // Banner o etiqueta en cabecera si es modo lectura
            const titleContainer = document.querySelector('.editor-doc-title-container');
            let roleBadge = document.getElementById('user-role-mode-badge');
            if (role === 'lector') {
                if (!roleBadge && titleContainer) {
                    roleBadge = document.createElement('span');
                    roleBadge.id = 'user-role-mode-badge';
                    roleBadge.className = 'px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center gap-1 shrink-0';
                    roleBadge.innerHTML = '<i class="fas fa-book-open text-[8px]"></i> Modo Lectura';
                    titleContainer.appendChild(roleBadge);
                }
            } else if (roleBadge) {
                roleBadge.remove();
            }
        },

        triggerAutoSave() {
            if (this.getUserRole() === 'lector' || window.isAuditMode) return;
            if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = setTimeout(() => {
                this.saveState();
            }, 1800);
        },

        // DT-3: Sync cloud diferido con candado anti-concurrencia.
        // Se espera 5 s desde el último cambio antes de enviar. Si ya hay un
        // request en vuelo (_syncPending), se descarta la llamada: el request
        // activo ya lleva la versión más reciente gracias al guardado local previo.
        triggerCloudSync() {
            if (this.getUserRole() === 'lector' || window.isAuditMode) return;
            if (this.cloudSyncTimer) clearTimeout(this.cloudSyncTimer);
            this.cloudSyncTimer = setTimeout(async () => {
                if (this._syncPending) return; // request anterior aún en vuelo
                this._syncPending = true;
                try {
                    await this.syncCloud(false);
                } finally {
                    this._syncPending = false;
                }
            }, 5000);
        },

        saveState() {
            if (!this.currentProject || this.getUserRole() === 'lector' || window.isAuditMode) return;

            const sheet = this.currentProject.sheets[this.activeSheetIndex];
            if (sheet) {
                const cleanHTML = MultiPageEngine.getCleanHTML();
                sheet.content = cleanHTML;
                sheet.pages = [cleanHTML];
            }
            this.currentProject.updatedAt = new Date().toISOString();

            const pIdx = this.projects.findIndex(p => p.id === this.currentProject.id);
            if (pIdx !== -1) {
                this.projects[pIdx] = this.currentProject;
            } else {
                this.projects.unshift(this.currentProject);
            }

            // DT-3: Guardar localmente de inmediato y delegar el cloud al timer con candado
            this.saveToStorage();
            this.triggerCloudSync();
            CollabPresenceManager.broadcastUpdate(this.currentProject);
        },

        saveToStorage() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projects));
                if (this.currentProject) {
                    localStorage.setItem(LAST_ID_KEY, this.currentProject.id);
                }
            } catch (e) {
                console.error('Error guardando en localStorage:', e);
            }
        },

        updateSyncUI(state, detail = "") {
            const saveInd = document.getElementById('save-indicator');
            const cloudInd = document.getElementById('cloud-indicator');
            
            if (saveInd) {
                saveInd.className = "flex items-center justify-center gap-1 px-2 h-7 w-[64px] min-w-[64px] max-w-[64px] rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 shrink-0 select-none";
                saveInd.innerHTML = '<i class="fas fa-check-circle text-[9px]"></i> <span>LOCAL</span>';
            }

            if (!cloudInd) return;

            if (!navigator.onLine && state !== 'offline') {
                state = 'offline';
            }

            if (state === 'syncing') {
                cloudInd.className = "flex items-center justify-center gap-1 px-2 h-7 w-[118px] min-w-[118px] max-w-[118px] rounded-full text-[9px] font-bold bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40 shrink-0 animate-pulse select-none";
                cloudInd.innerHTML = '<i class="fas fa-sync fa-spin text-[9px]"></i> <span class="truncate">SINCRONIZANDO</span>';
            } else if (state === 'success' || state === 'online') {
                cloudInd.className = "flex items-center justify-center gap-1 px-2 h-7 w-[118px] min-w-[118px] max-w-[118px] rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 shrink-0 select-none";
                cloudInd.innerHTML = '<i class="fas fa-cloud-check text-[9px]"></i> <span class="truncate">SINCRONIZADO</span>';
            } else if (state === 'offline') {
                cloudInd.className = "flex items-center justify-center gap-1 px-2 h-7 w-[118px] min-w-[118px] max-w-[118px] rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 shrink-0 select-none";
                cloudInd.innerHTML = '<i class="fas fa-wifi-slash text-[9px]"></i> <span class="truncate">OFFLINE</span>';
            } else if (state === 'local') {
                cloudInd.className = "flex items-center justify-center gap-1 px-2 h-7 w-[118px] min-w-[118px] max-w-[118px] rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0 select-none";
                cloudInd.innerHTML = '<i class="fas fa-hdd text-[9px]"></i> <span class="truncate">SOLO LOCAL</span>';
            } else if (state === 'error') {
                cloudInd.className = "flex items-center justify-center gap-1 px-2 h-7 w-[118px] min-w-[118px] max-w-[118px] rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 shrink-0 select-none";
                cloudInd.innerHTML = '<i class="fas fa-exclamation-triangle text-[9px]"></i> <span class="truncate">ERROR SYNC</span>';
            }
        },

        async syncCloud(isManual = false) {
            if (window.isAuditMode) return;

            if (!navigator.onLine) {
                this.updateSyncUI('offline');
                if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('offline');
                return;
            }

            if (typeof window.supabaseClient === 'undefined') {
                this.updateSyncUI('local');
                if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('local', 'Guardado en este equipo');
                return;
            }

            try {
                const { data: { session } } = await window.supabaseClient.auth.getSession().catch(() => ({ data: { session: null } }));
                if (session && typeof window.syncCurrentProjectWithSupabase === 'function') {
                    this.updateSyncUI('syncing');

                    await window.syncCurrentProjectWithSupabase(this.currentProject, session.user.id, true);
                    
                    this.updateSyncUI('success');
                    if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('success', 'Documento respaldado con éxito');
                } else {
                    this.updateSyncUI('local');
                    if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('local', 'Guardado en este equipo');
                }
            } catch (e) {
                console.error("Error sincronizando documento de texto:", e);
                const errMsg = e.message || String(e);
                this.updateSyncUI('error', errMsg);
                if (isManual && typeof window.showSyncToast === 'function') window.showSyncToast('error', errMsg);
            }
        },

        saveStateManual() {
            this.saveState();
            // DT-3: Cancelar el timer diferido y el candado para forzar sync inmediato en guardado manual
            if (this.cloudSyncTimer) {
                clearTimeout(this.cloudSyncTimer);
                this.cloudSyncTimer = null;
            }
            this._syncPending = false;
            this.syncCloud(true);
            const btn = document.getElementById('btn-save-doc');
            if (btn) {
                const icon = document.getElementById('btn-save-toolbar-icon') || btn.querySelector('i');
                const textSpan = document.getElementById('btn-save-doc-text') || btn.querySelector('span');
                if (icon && textSpan) {
                    icon.className = 'fas fa-check text-[11px]';
                    textSpan.textContent = '¡Guardado!';
                    btn.classList.replace('bg-emerald-600', 'bg-emerald-500');
                    setTimeout(() => {
                        icon.className = 'fas fa-cloud text-[11px]';
                        textSpan.textContent = 'Guardar';
                        btn.classList.replace('bg-emerald-500', 'bg-emerald-600');
                    }, 1600);
                } else {
                    const orig = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check text-[11px]" id="btn-save-toolbar-icon"></i><span id="btn-save-doc-text" class="text-xs font-bold leading-none">¡Guardado!</span>';
                    btn.classList.replace('bg-emerald-600', 'bg-emerald-500');
                    setTimeout(() => {
                        btn.innerHTML = orig;
                        btn.classList.replace('bg-emerald-500', 'bg-emerald-600');
                    }, 1600);
                }
            }
            const btnToolbar = document.getElementById('btn-save-toolbar');
            if (btnToolbar) {
                const icon = document.getElementById('btn-save-toolbar-icon');
                if (icon) {
                    icon.className = 'fas fa-check text-[11px] text-emerald-500';
                    setTimeout(() => {
                        icon.className = 'fas fa-cloud text-[11px]';
                    }, 1600);
                }
            }
        },

        debouncePushHistory() {
            if (this.historyTimer) clearTimeout(this.historyTimer);
            this.historyTimer = setTimeout(() => {
                this.pushHistory();
            }, 600);
        },

        pushHistory() {
            const currentHTML = MultiPageEngine.getCleanHTML();
            if (this.historyStack[this.historyIndex] === currentHTML) return;

            this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
            this.historyStack.push(currentHTML);

            if (this.historyStack.length > MAX_HISTORY) {
                this.historyStack.shift();
            } else {
                this.historyIndex++;
            }
            this.updateUndoRedoUI();
        },

        undo() {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                const html = this.historyStack[this.historyIndex];
                MultiPageEngine.loadContent(html);
                this.updateUndoRedoUI();
                DocStatsManager.update();
                this.triggerAutoSave();
            }
        },

        redo() {
            if (this.historyIndex < this.historyStack.length - 1) {
                this.historyIndex++;
                const html = this.historyStack[this.historyIndex];
                MultiPageEngine.loadContent(html);
                this.updateUndoRedoUI();
                DocStatsManager.update();
                this.triggerAutoSave();
            }
        },

        updateUndoRedoUI() {
            const isUndoDisabled = (this.historyIndex <= 0);
            const isRedoDisabled = (this.historyIndex >= this.historyStack.length - 1);
            
            ['btn-undo', 'btn-undo-toolbar'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.disabled = isUndoDisabled;
                    el.style.opacity = isUndoDisabled ? '0.45' : '1';
                }
            });

            ['btn-redo', 'btn-redo-toolbar'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.disabled = isRedoDisabled;
                    el.style.opacity = isRedoDisabled ? '0.45' : '1';
                }
            });
        },

        // --- Gestión de Secciones / Hojas ---
        renderSheetSelect() {
            const select = document.getElementById('textos-sheet-select');
            if (!select || !this.currentProject) return;

            select.innerHTML = '';
            this.currentProject.sheets.forEach((sheet, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = sheet.name || `Sección ${idx + 1}`;
                if (idx === this.activeSheetIndex) opt.selected = true;
                select.appendChild(opt);
            });
        },

        switchSheet(idx) {
            const newIndex = parseInt(idx, 10);
            if (isNaN(newIndex) || newIndex < 0 || newIndex >= this.currentProject.sheets.length) return;

            if (this.currentProject.sheets[this.activeSheetIndex]) {
                this.currentProject.sheets[this.activeSheetIndex].content = MultiPageEngine.getCleanHTML();
            }

            this.activeSheetIndex = newIndex;
            this.loadActiveSheet();
            this.renderSheetSelect();

            if (CollabPresenceManager.channel && CollabPresenceManager.currentUserId) {
                CollabPresenceManager.channel.track({
                    user_id: CollabPresenceManager.currentUserId,
                    user_name: CollabPresenceManager.userName,
                    user_color: CollabPresenceManager.userColor,
                    active_sheet_idx: this.activeSheetIndex,
                    online_at: new Date().toISOString()
                }).catch(() => {});
            }
        },

        openNewSheetModal() {
            const modal = document.getElementById('sheet-modal');
            if (!modal) return;
            const input = document.getElementById('sheet-input-name');
            if (input) {
                input.value = `Sección ${this.currentProject.sheets.length + 1}`;
            }
            modal.style.display = 'flex';
            setTimeout(() => input?.focus(), 80);
        },

        closeSheetModal() {
            const modal = document.getElementById('sheet-modal');
            if (modal) modal.style.display = 'none';
        },

        saveSheetFromModal() {
            const input = document.getElementById('sheet-input-name');
            const name = input ? input.value.trim() : '';
            const sheetName = name || `Sección ${this.currentProject.sheets.length + 1}`;

            if (this.currentProject.sheets[this.activeSheetIndex]) {
                this.currentProject.sheets[this.activeSheetIndex].content = MultiPageEngine.getCleanHTML();
            }

            const newSheet = {
                name: sheetName,
                pageSize: 'letter',
                orientation: 'portrait',
                margins: { top: 25, bottom: 25, left: 25, right: 25 },
                marginPreset: 'normal',
                lineSpacing: '15',
                fontFamily: 'Plus Jakarta Sans',
                headerFooter: {
                    showHeader: false,
                    showFooter: false,
                    headerText: '',
                    footerText: '',
                    showPageNumbers: false
                },
                content: '<p></p>'
            };

            this.currentProject.sheets.push(newSheet);

            this.saveState();
            this.activeSheetIndex = this.currentProject.sheets.length - 1;
            this.renderSheetSelect();
            this.loadActiveSheet();
            this.closeSheetModal();
            this.showToast(`Sección "${sheetName}" creada`);
            CollabPresenceManager.broadcastSheetEvent('add', newSheet, this.activeSheetIndex);
        },

        duplicateCurrentSheet() {
            const currentSheet = this.currentProject.sheets[this.activeSheetIndex];
            if (!currentSheet) return;

            currentSheet.content = MultiPageEngine.getCleanHTML();
            const duplicate = JSON.parse(JSON.stringify(currentSheet));
            duplicate.name += ' (Copia)';
            if (!duplicate.fontFamily) duplicate.fontFamily = currentSheet.fontFamily || 'Plus Jakarta Sans';
            this.currentProject.sheets.push(duplicate);

            this.saveState();
            this.activeSheetIndex = this.currentProject.sheets.length - 1;
            this.renderSheetSelect();
            this.loadActiveSheet();
            this.showToast('Sección duplicada');
            CollabPresenceManager.broadcastSheetEvent('duplicate', duplicate, this.activeSheetIndex);
        },

        confirmDeleteSheet() {
            if (this.currentProject.sheets.length <= 1) {
                alert('El documento debe contener al menos una sección activa.');
                return;
            }

            const sheetName = this.currentProject.sheets[this.activeSheetIndex].name;
            if (confirm(`¿Estás seguro de que deseas eliminar la sección "${sheetName}"?`)) {
                this.currentProject.sheets.splice(this.activeSheetIndex, 1);
                this.activeSheetIndex = 0;
                this.saveState();
                this.renderSheetSelect();
                this.loadActiveSheet();
                this.showToast(`Sección "${sheetName}" eliminada`);
                CollabPresenceManager.broadcastSheetEvent('delete', null, 0);
            }
        },

        populateSymbols() {
            const grid = document.getElementById('symbols-grid');
            if (!grid) return;
            // DT-2: Guarda de reentrancia — evita reconstruir el DOM si ya está poblado
            if (grid.children.length > 0) return;
            SPECIAL_SYMBOLS.forEach(sym => {
                const btn = document.createElement('button');
                btn.className = 'w-9 h-9 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-white dark:bg-slate-800 dark:hover:bg-amber-500 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center justify-center transition-all shadow-sm';
                btn.textContent = sym;
                btn.onclick = () => {
                    window.EduContaTextEngine?.insertTextAtCursor(sym);
                    window.EduContaTextEngine?.closeSymbolsModal();
                };
                grid.appendChild(btn);
            });
        },

        renameProject(newName) {
            if (!this.currentProject || window.isAuditMode) return;
            const trimmed = (newName || '').trim();
            if (!trimmed) return;
            this.currentProject.name = trimmed;
            const titleEl = document.getElementById('current-project-name');
            if (titleEl) titleEl.textContent = trimmed;
            document.title = `${trimmed} | EduConta SV`;
            this.saveState();
            this.syncCloud(false);
            if (typeof window.showSyncToast === 'function') {
                window.showSyncToast('success', 'Nombre actualizado');
            }
        },

        openRenameModal() {
            if (window.isAuditMode || !this.currentProject) return;
            const modal = document.getElementById('rename-doc-modal');
            const input = document.getElementById('rename-doc-input');
            if (modal && input) {
                input.value = this.currentProject.name || '';
                modal.classList.add('active');
                setTimeout(() => {
                    input.focus();
                    input.select();
                }, 100);
            }
        },

        closeRenameModal() {
            const modal = document.getElementById('rename-doc-modal');
            if (modal) modal.classList.remove('active');
        },

        saveRenameFromModal() {
            const input = document.getElementById('rename-doc-input');
            if (!input) return;
            const newName = input.value.trim();
            if (newName) {
                this.renameProject(newName);
            }
            this.closeRenameModal();
        },

        promptRename() {
            this.openRenameModal();
        },

        async closeProject() {
            this.saveState();
            try {
                await this.syncCloud(false);
            } catch (e) {}
            window.location.href = 'documentos.html';
        },

        showToast(message) {
            const toast = document.getElementById('sync-toast');
            if (!toast) return;
            const desc = toast.querySelector('p');
            if (desc) desc.textContent = message;
            toast.classList.remove('translate-y-32', 'opacity-0');
            setTimeout(() => {
                toast.classList.add('translate-y-32', 'opacity-0');
            }, 3000);
        }
    };

    // =====================================================================
    // 2. MOTOR DE HOJAS FÍSICAS INDIVIDUALES (MultiPageEngine)


    /* ===================================================================
     * MODULO: index.js
     * =================================================================== */
/**
 * index.js — Entry point del Editor de Textos
 * Importa todos los módulos, expone a window.* y ejecuta la inicialización.
 * EduConta SV — type="module"
 */

// Módulos del editor


















// ─── Exposición global (window.*) ───────────────────────────────────────
// Necesario para los onclick="" inline del HTML y para otros scripts del proyecto
window.TextDocStateManager    = TextDocStateManager;
window.MultiPageEngine        = MultiPageEngine;
window.PageLayoutManager      = PageLayoutManager;
window.SmoothScrollManager    = SmoothScrollManager;
window.EduContaTextEngine     = EduContaTextEngine;
window.DocumentTemplates      = DocumentTemplates;
window.FindReplaceManager     = FindReplaceManager;
window.TableOfContentsManager = TableOfContentsManager;
window.DocStatsManager        = DocStatsManager;
window.DocExportManager       = DocExportManager;
window.CollabPresenceManager  = CollabPresenceManager;
window.ImageLayerManager      = ImageLayerManager;
window.ImageEditorManager     = ImageEditorManager;
window.ImageCropManager       = ImageCropManager;
window.ImageResizeManager     = ImageResizeManager;
window.AuditModeHandler       = AuditModeHandler;
window.SpellCheckManager      = SpellCheckManager;
window.TableManager           = TableManager;

// Color picker utilities
window.toggleColorPickerPopover    = toggleColorPickerPopover;
window.closeColorPickers           = closeColorPickers;
window.applyPaletteColor           = applyPaletteColor;
window.previewPaletteColor         = previewPaletteColor;
window.cancelPaletteColorPreview   = cancelPaletteColorPreview;
window.pickColorWithEyedropper     = pickColorWithEyedropper;
window.switchToCustomColorView     = switchToCustomColorView;
window.switchToPresetsColorView    = switchToPresetsColorView;
window.onHexInputChange            = onHexInputChange;
window.onRgbInputChange            = onRgbInputChange;
window.applyCustomInteractiveColor = applyCustomInteractiveColor;

// Métodos globales auxiliares para eventos HTML inline
window.openShareModal    = () => CollabPresenceManager.openShareModal();
window.closeShareModal   = () => CollabPresenceManager.closeShareModal();
window.copyInviteLink    = () => CollabPresenceManager.copyInviteLink();
window.addCollaborator   = () => CollabPresenceManager.addCollaborator();
window.setCollaboratorRole = (uid, role) => CollabPresenceManager.setCollaboratorRole(uid, role);
window.removeCollaborator  = (uid) => CollabPresenceManager.removeCollaborator(uid);

// ─── Control del Cajón Lateral (Drawer) de Páginas y Plantillas ─────────────
window.toggleDocSidebarDrawer = function(force) {
    const drawer = document.getElementById('doc-sidebar-drawer');
    const backdrop = document.getElementById('sidebar-drawer-backdrop');
    const btnToggle = document.getElementById('btn-toggle-sidebar');
    if (!drawer) return;

    const isOpen = drawer.classList.contains('translate-x-0');
    const shouldOpen = typeof force === 'boolean' ? force : !isOpen;

    if (shouldOpen) {
        drawer.classList.remove('-translate-x-full', '-translate-x-[calc(100%+24px)]', '-translate-x-[380px]');
        drawer.classList.add('translate-x-0');
        if (backdrop) backdrop.classList.add('hidden'); // Sin oscurecer ni desenfocar la vista
        if (btnToggle) {
            btnToggle.setAttribute('aria-expanded', 'true');
            btnToggle.classList.add('bg-amber-500/20', 'text-amber-600', 'border-amber-500/40', 'dark:text-amber-400');
        }
    } else {
        drawer.classList.remove('translate-x-0');
        drawer.classList.add('-translate-x-[calc(100%+24px)]');
        if (backdrop) backdrop.classList.add('hidden');
        if (btnToggle) {
            btnToggle.setAttribute('aria-expanded', 'false');
            btnToggle.classList.remove('bg-amber-500/20', 'text-amber-600', 'border-amber-500/40', 'dark:text-amber-400');
        }
    }
};

// ─── Control de Pestañas de la Cinta Ribbon (Inicio / Insertar / Vista) con Animación de Burbuja ────
let currentRibbonTabIndex = 0;
let ribbonTabSnapTimeout = null;
window.currentActiveRibbonTab = 'inicio';

window.updateRibbonBubble = function(tabName, instant = false) {
    const tabs = ['inicio', 'insertar', 'vista'];
    const pill = document.getElementById('ribbon-bubble-indicator');
    const container = document.getElementById('ribbon-tabs-container');
    const btn = document.getElementById(`ribbon-tab-btn-${tabName}`);
    if (!pill || !container || !btn) return;

    if (btn.offsetWidth === 0) {
        requestAnimationFrame(() => window.updateRibbonBubble(tabName, instant));
        return;
    }

    if (ribbonTabSnapTimeout) {
        clearTimeout(ribbonTabSnapTimeout);
        ribbonTabSnapTimeout = null;
    }

    const targetIndex = tabs.indexOf(tabName);
    const distance = (targetIndex >= 0 && currentRibbonTabIndex >= 0)
        ? Math.abs(targetIndex - currentRibbonTabIndex)
        : 0;
    const stretch = (!instant && distance > 0) ? (1 + Math.min(distance * 0.15, 0.35)) : 1;
    const isInstant = instant || distance === 0;

    if (isInstant) {
        pill.style.transition = 'none';
    }

    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.opacity = '1';

    if (!isInstant && distance > 0) {
        // Efecto elástico squish/stretch característico de la burbuja de EduConta SV
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(${stretch}) scaleY(0.9)`;
        ribbonTabSnapTimeout = setTimeout(() => {
            pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(1) scaleY(1)`;
            ribbonTabSnapTimeout = null;
        }, 180);
    } else {
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(1) scaleY(1)`;
    }

    if (isInstant) {
        void pill.offsetWidth;
        requestAnimationFrame(() => {
            pill.style.transition = '';
        });
    }

    if (targetIndex >= 0) currentRibbonTabIndex = targetIndex;
    window.currentActiveRibbonTab = tabName;
};

let ribbonTabSwitchTimeout = null;

window.switchRibbonTab = function(tabName) {
    const tabs = ['inicio', 'insertar', 'vista'];
    if (!tabs.includes(tabName)) return;

    const isAlreadyActive = (tabName === window.currentActiveRibbonTab);
    const isCollapsed = document.body.classList.contains('ribbon-shelf-collapsed');

    // Si ya está activa y la barra no está colapsada, no hay nada que cambiar
    if (isAlreadyActive && !isCollapsed && !ribbonTabSwitchTimeout) {
        return;
    }

    // Cancelar cualquier timeout anterior si el usuario hace clics rápidos
    if (ribbonTabSwitchTimeout) {
        clearTimeout(ribbonTabSwitchTimeout);
        ribbonTabSwitchTimeout = null;
    }

    const ribbon = document.querySelector('.toolbar-ribbon');

    // Actualizar botones de la píldora inmediatamente para feedback táctil instantáneo
    tabs.forEach(t => {
        const btn = document.getElementById(`ribbon-tab-btn-${t}`);
        const isActive = (t === tabName);
        if (btn) {
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        }
    });

    // Mover burbuja indicadora elásticamente al nuevo botón
    window.updateRibbonBubble(tabName, false);

    // Si la cinta de herramientas estaba colapsada y el usuario hace clic en una pestaña, la expandimos
    if (isCollapsed) {
        window.toggleRibbonShelf(true);
    }

    // Si no hay elemento ribbon o ya estaba activa (pero colapsada), solo mostramos directamente
    if (!ribbon) {
        tabs.forEach(t => {
            const pane = document.getElementById(`shelf-tab-${t}`);
            if (pane) {
                pane.classList.toggle('hidden', t !== tabName);
                pane.classList.toggle('flex', t === tabName);
            }
        });
        if (tabName === 'vista' && window.PageLayoutManager?.updateSheetThemeUI) {
            window.PageLayoutManager.updateSheetThemeUI();
        }
        return;
    }

    // 1. Salen todos a la vez
    ribbon.classList.remove('anim-enter');
    ribbon.classList.add('anim-exit');

    // 2. Tras completar la salida (220ms), mostrar el nuevo contenido y entrar juntos
    ribbonTabSwitchTimeout = setTimeout(() => {
        tabs.forEach(t => {
            const pane = document.getElementById(`shelf-tab-${t}`);
            const isActive = (t === tabName);
            if (pane) {
                if (isActive) {
                    pane.classList.remove('hidden');
                    pane.classList.add('flex');
                } else {
                    pane.classList.remove('flex');
                    pane.classList.add('hidden');
                }
            }
        });

        // Entran todos juntos con la curva elástica
        ribbon.classList.remove('anim-exit');
        ribbon.classList.add('anim-enter');

        // Limpiar anim-enter al terminar la animación para dejar el DOM limpio
        ribbon.addEventListener('animationend', () => {
            ribbon.classList.remove('anim-enter');
        }, { once: true });

        // Actualizar controles si se pasa a la pestaña Disposición & Vista
        if (tabName === 'vista' && window.PageLayoutManager?.updateSheetThemeUI) {
            window.PageLayoutManager.updateSheetThemeUI();
        }

        ribbonTabSwitchTimeout = null;
    }, 220);
};

// ─── Alternar Colapso de la Cinta de Herramientas (Modo Zen / Compacto) ────
window.toggleRibbonShelf = function(force) {
    const isCollapsed = document.body.classList.contains('ribbon-shelf-collapsed');
    const shouldExpand = typeof force === 'boolean' ? force : isCollapsed;
    const shelf = document.getElementById('ribbon-shelf-card');

    if (shouldExpand) {
        document.body.classList.remove('ribbon-shelf-collapsed');
        if (shelf) {
            shelf.classList.remove('collapsed', 'anim-shelf-exit');
            shelf.classList.add('revealed', 'anim-shelf-enter');
        }
    } else {
        document.body.classList.add('ribbon-shelf-collapsed');
        if (shelf) {
            shelf.classList.remove('revealed', 'anim-shelf-enter');
            shelf.classList.add('collapsed', 'anim-shelf-exit');
        }
    }

    requestAnimationFrame(() => {
        if (window.currentActiveRibbonTab) {
            window.updateRibbonBubble(window.currentActiveRibbonTab, true);
        }
    });
};

window.forceSave = function(quiet = false) {
    if (window.TextDocStateManager) {
        window.TextDocStateManager.saveState();
        window.TextDocStateManager.syncCloud(!quiet);
    }
};

window.focusActiveEditor = (atStart = true) => MultiPageEngine.focusActiveEditor(atStart);

// ─── Inicialización ────────────────────────────────────────────────────────
const initTextEditorSubsystems = () => {
    SpellCheckManager.init();
    TableManager.init();
    TextDocStateManager.init();
    PageLayoutManager.initSheetTheme();
    PageLayoutManager.applyZoom();
    SmoothScrollManager.init();
    setTimeout(() => {
        PageLayoutManager.updateZoomBubble(true);
        window.updateRibbonBubble(window.currentActiveRibbonTab || 'inicio', true);
    }, 60);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTextEditorSubsystems);
} else {
    initTextEditorSubsystems();
}

window.addEventListener('resize', () => {
    if (window.currentActiveRibbonTab) {
        window.updateRibbonBubble(window.currentActiveRibbonTab, true);
    }
});

if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
        if (window.currentActiveRibbonTab) {
            window.updateRibbonBubble(window.currentActiveRibbonTab, true);
        }
    });
}

// Listeners globales de conectividad
window.addEventListener('online', () => {
    if (typeof window.showSyncToast === 'function') window.showSyncToast('online');
    if (window.TextDocStateManager?.syncCloud) window.TextDocStateManager.syncCloud(false);
});
window.addEventListener('offline', () => {
    if (window.TextDocStateManager?.updateSyncUI) window.TextDocStateManager.updateSyncUI('offline');
    if (typeof window.showSyncToast === 'function') window.showSyncToast('offline');
});

// Atajos globales de teclado (Ctrl+S, Ctrl++, Ctrl+-, Ctrl+0, Alt+P, Escape)
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const drawer = document.getElementById('doc-sidebar-drawer');
        if (drawer && drawer.classList.contains('translate-x-0')) {
            window.toggleDocSidebarDrawer(false);
        }
    } else if (e.altKey && (e.key === 'p' || e.key === 'P' || e.code === 'KeyP')) {
        e.preventDefault();
        window.toggleDocSidebarDrawer();
    } else if (e.altKey && (e.key === 'l' || e.key === 'L' || e.code === 'KeyL')) {
        e.preventDefault();
        window.PageLayoutManager?.toggleSheetTheme();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
        e.preventDefault();
        if (window.TextDocStateManager?.saveStateManual) {
            window.TextDocStateManager.saveStateManual();
        }
    } else if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=' || e.code === 'Equal' || e.code === 'NumpadAdd')) {
        e.preventDefault();
        window.PageLayoutManager?.zoomIn();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_' || e.code === 'Minus' || e.code === 'NumpadSubtract')) {
        e.preventDefault();
        window.PageLayoutManager?.zoomOut();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0')) {
        e.preventDefault();
        window.PageLayoutManager?.resetZoom();
    }
});

// Prevenir pérdida de foco/selección al hacer clic en controles de barra
document.addEventListener('mousedown', (e) => {
    const colorPopover = e.target.closest('#popover-color-picker');
    if (colorPopover) {
        // Permitir foco interactivo únicamente en campos de entrada (HEX, R, G, B)
        const isInputField = e.target.closest('input, textarea');
        if (!isInputField) {
            if (window.EduContaTextEngine?.saveActiveSelection) {
                window.EduContaTextEngine.saveActiveSelection(true);
            }
            e.preventDefault();
        }
        return;
    }

    const isColorInput = e.target.closest('#text-color-input, #bg-color-input');
    if (isColorInput) {
        if (window.EduContaTextEngine?.saveActiveSelection) {
            window.EduContaTextEngine.saveActiveSelection(true);
        }
        return;
    }

    const isTool = e.target.closest('.tool-btn, .toolbar-btn, .educonta-glass-select-trigger, .educonta-glass-select-popover button, .toolbar-row button, [data-option-item], .ec-table-tool-btn, #table-floating-toolbar button, #table-color-popover button');
    const isInput = e.target.closest('input, textarea, [contenteditable="true"]');
    if (isTool && !isInput) {
        if (window.EduContaTextEngine?.saveActiveSelection) {
            window.EduContaTextEngine.saveActiveSelection(false);
        }
        e.preventDefault();
    }
}, true);

// Cerrar popovers de colores al hacer clic fuera
document.addEventListener('click', (e) => {
    const colorPopover = document.getElementById('popover-color-picker');
    const btnColorText = document.getElementById('btn-tool-text-color');
    const btnColorBg   = document.getElementById('btn-tool-bg-color');
    if (colorPopover && !colorPopover.classList.contains('hidden')) {
        if (!colorPopover.contains(e.target) && (!btnColorText || !btnColorText.contains(e.target)) && (!btnColorBg || !btnColorBg.contains(e.target))) {
            closeColorPickers();
        }
    }
});

window.addEventListener('resize', () => { closeColorPickers(); });

// Sincronización continua de inputs de color nativos
const setupColorInputs = () => {
    const textCol = document.getElementById('text-color-input');
    if (textCol && !textCol.dataset.boundColor) {
        textCol.dataset.boundColor = 'true';
        textCol.addEventListener('input', (e) => {
            window.EduContaTextEngine?.setTextColor(e.target.value);
            const ind = document.getElementById('indicator-text-color');
            if (ind) ind.style.backgroundColor = e.target.value;
        });
    }
    const bgCol = document.getElementById('bg-color-input');
    if (bgCol && !bgCol.dataset.boundColor) {
        bgCol.dataset.boundColor = 'true';
        bgCol.addEventListener('input', (e) => {
            window.EduContaTextEngine?.setHighlightColor(e.target.value);
            const ind = document.getElementById('indicator-bg-color');
            if (ind) ind.style.backgroundColor = e.target.value;
        });
    }
};
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupColorInputs);
} else {
    setupColorInputs();
}

// Prevenir pérdida de foco del editor al pulsar botones de la barra de herramientas (toolbar)
document.addEventListener('mousedown', (e) => {
    const btn = e.target.closest('.toolbar-btn, .ribbon-tab-btn, .educonta-glass-select-trigger');
    if (btn && !e.target.closest('input, textarea, select')) {
        if (window.EduContaTextEngine?.saveActiveSelection) {
            window.EduContaTextEngine.saveActiveSelection(true);
        }
        e.preventDefault();
    }
});

// Consolidar spans y tags pendientes al escribir texto real
document.addEventListener('input', (e) => {
    const target = e.target;
    if (target && target.isContentEditable) {
        const pendingElements = target.querySelectorAll('span[data-ec-pending="true"], span[data-ec-pending-color="true"], span[data-ec-pending-bg="true"], code[data-ec-pending-code="true"]');
        if (pendingElements && pendingElements.length > 0) {
            pendingElements.forEach(el => {
                const text = el.textContent;
                if (text && text !== '\u200B' && text.replace(/\u200B/g, '').length > 0) {
                    el.removeAttribute('data-ec-pending');
                    el.removeAttribute('data-ec-pending-color');
                    el.removeAttribute('data-ec-pending-bg');
                    el.removeAttribute('data-ec-pending-code');
                }
            });
        }
    }
}, true);

// Guardar selección y sincronizar toolbar en selectionchange
let _selChangeRaf = null;
document.addEventListener('selectionchange', () => {
    if (window.EduContaTextEngine?.saveActiveSelection) {
        window.EduContaTextEngine.saveActiveSelection();
    }

    // Limpieza de elementos pendientes que quedaron vacíos únicamente si el usuario
    // movió activamente el cursor a otra posición dentro del editor (abandonó el formato)
    // NO limpiar si hay un selector desplegado o previsualización activa
    if (window.EduContaTextEngine?._fontPreviewState || 
        window.EduContaTextEngine?._colorPreviewState || 
        window.EduContaGlassSelect?.hasOpenPopover?.()) {
        return;
    }

    const activeEditor = MultiPageEngine?.getActiveEditor?.();
    const sel = window.getSelection();
    if (activeEditor && sel && sel.anchorNode && activeEditor.contains(sel.anchorNode)) {
        const container = MultiPageEngine?.getContainer?.();
        if (container) {
            container.querySelectorAll('span[data-ec-pending="true"], span[data-ec-pending-color="true"], span[data-ec-pending-bg="true"], code[data-ec-pending-code="true"]').forEach(el => {
                if (!el.contains(sel.anchorNode)) {
                    if (el.textContent === '\u200B' || el.textContent.trim() === '') {
                        el.remove();
                    }
                }
            });
        }
    }

    if (_selChangeRaf) cancelAnimationFrame(_selChangeRaf);
    _selChangeRaf = requestAnimationFrame(() => {
        if (window.EduContaTextEngine?.updateToolbarState) {
            window.EduContaTextEngine.updateToolbarState();
        }
    });
});

    // --- Exposicion de utilidades adicionales a window ------------------
    window.PAGE_DIMENSIONS = PAGE_DIMENSIONS;
    window.MARGIN_PRESETS = MARGIN_PRESETS;
    window.SPECIAL_SYMBOLS = SPECIAL_SYMBOLS;
    window.EDUCONTA_COLOR_PRESETS = EDUCONTA_COLOR_PRESETS;
    window.mmToPx = mmToPx;
    window.SPANISH_ACCENT_MAP = SPANISH_ACCENT_MAP;
    window.isSpanishWord = isSpanishWord;
    window.isEnglishWord = isEnglishWord;
    window.damerauLevenshtein = damerauLevenshtein;
    window.getSmartSuggestions = getSmartSuggestions;

})();
