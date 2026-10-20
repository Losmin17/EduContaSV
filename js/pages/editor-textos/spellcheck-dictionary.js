/**
 * spellcheck-dictionary.js — Diccionario y motor lingüístico bilingüe
 * Español (con terminología contable, fiscal y comercial de El Salvador) + Inglés
 * EduConta SV — ES Module
 */

// ── 1. MAPA DE RESTAURACIÓN RÁPIDA DE ACENTOS (TILDES) EN ESPAÑOL ──────────────
// Palabras comunes frecuentemente escritas sin tilde por teclados o configuración en inglés
export const SPANISH_ACCENT_MAP = {
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
export function isSpanishWord(rawWord) {
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
export function isEnglishWord(rawWord) {
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
export function damerauLevenshtein(a, b) {
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
export function getSmartSuggestions(originalWord, lang = 'es') {
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
