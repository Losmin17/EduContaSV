// =====================================================
// PLANILLA DE SALARIOS ENGINE v2 — EduConta SV
// Tabla sectorial con columnas configurables por sección
// =====================================================

// ─── DEFINICIÓN DE SECCIONES ──────────────────────────────────────
const SECTIONS = [
    {
        id: 1, label: 'Identificación del Trabajador', shortLabel: 'Identif.', color: 'indigo',
        icon: 'fa-id-card',
        defaultCols: ['nombre', 'codigo', 'sexo'],
        optionalCols: ['dui', 'nit', 'isss_num', 'afp_num', 'fecha_nac', 'estado_civil', 'fecha_ingreso'],
    },
    {
        id: 2, label: 'Datos Laborales', shortLabel: 'Laboral', color: 'sky',
        icon: 'fa-briefcase',
        defaultCols: ['cargo', 'departamento'],
        optionalCols: ['jornada', 'tipo_contrato', 'fecha_salida', 'observaciones'],
    },
    {
        id: 3, label: 'Información Salarial', shortLabel: 'Salarial', color: 'emerald',
        icon: 'fa-coins',
        defaultCols: ['salario_base'],
        optionalCols: ['tipo_incap', 'dias_incap', 'dias_trab', 'salario_dias_trab', 'subsidio_patrono', 'subsidio_isss', 'horas_ext_diurnas', 'horas_ext_nocturnas', 'horas_ext_festivas', 'bonificaciones', 'comisiones', 'incentivos', 'horas_ordinarias', 'salario_diario', 'pago_ordinario', 'pago_ext_diurnas', 'pago_ext_nocturnas', 'pago_ext_festivas'],
    },
    {
        id: 4, label: 'Prestaciones Adicionales', shortLabel: 'Prestaciones', color: 'violet',
        icon: 'fa-gift',
        isOptionalSection: true,
        defaultCols: ['vacaciones', 'aguinaldo', 'indemnizacion', 'otros_beneficios'],
        optionalCols: [],
    },
    {
        id: 5, label: 'Deducciones Legales', shortLabel: 'Deducciones', color: 'rose',
        icon: 'fa-scale-balanced',
        defaultCols: ['isss_lab', 'afp_lab', 'renta'],
        optionalCols: ['descuento_tardanzas', 'otros_descuentos', 'isss_patronal', 'afp_patronal'],
    },
    {
        id: 6, label: 'Totales y Neto', shortLabel: 'Totales', color: 'slate',
        icon: 'fa-calculator',
        defaultCols: ['total_devengado', 'total_deducciones', 'salario_neto', 'forma_pago'],
        optionalCols: [],
    },
];

// ─── REGISTRO DE COLUMNAS ────────────────────────────────────────
const COL = {
    // Sección 1 — Identificación
    codigo:              { label: 'Código', type: 'text', width: 95, placeholder: 'Código' },
    nombre:              { label: 'Nombre<br>Completo', type: 'text', width: 200, required: true, placeholder: 'Nombre Completo' },
    sexo:                { label: 'Sexo', type: 'select', options: ['—','M','F','Otro'], width: 85 },
    dui:                 { label: 'DUI /<br>Pasaporte', type: 'text', width: 125, placeholder: 'DUI' },
    nit:                 { label: 'NIT', type: 'text', width: 125, placeholder: 'NIT' },
    isss_num:            { label: 'Nº ISSS', type: 'text', width: 120, placeholder: 'ISSS' },
    afp_num:             { label: 'Nº AFP', type: 'text', width: 120, placeholder: 'AFP' },
    fecha_nac:           { label: 'F.<br>Nacimiento', type: 'date', width: 125, placeholder: 'F. Nac.' },
    estado_civil:        { label: 'Estado<br>Civil', type: 'text', width: 110, placeholder: 'Est. Civil' },
    fecha_ingreso:       { label: 'F.<br>Ingreso', type: 'date', width: 125, placeholder: 'F. Ingreso' },
    // Sección 2 — Datos laborales
    cargo:               { label: 'Cargo /<br>Puesto', type: 'text', width: 150, placeholder: 'Cargo' },
    departamento:        { label: 'Departa-<br>mento', type: 'text', width: 140, placeholder: 'Depto.' },
    jornada:             { label: 'Jornada', type: 'select', options: ['—','Tiempo Completo','Tiempo Parcial'], width: 135 },
    tipo_contrato:       { label: 'Tipo<br>Contrato', type: 'text', width: 120, placeholder: 'Contrato' },
    fecha_salida:        { label: 'F.<br>Salida', type: 'date', width: 125, placeholder: 'F. Salida' },
    observaciones:       { label: 'Observa-<br>ciones', type: 'text', width: 150, placeholder: 'Obs.' },
    // Sección 3 — Información salarial
    salario_base:        { label: 'Salario<br>Base ($)', type: 'number', width: 125, affectsTotal: true },
    tipo_incap:          { label: 'Tipo<br>Licencia/Incap.', type: 'select', options: ['—','Enfermedad Común','Accidente de Trabajo','Maternidad'], width: 145 },
    dias_incap:          { label: 'Días<br>Incap.', type: 'number', width: 85, placeholder: 'Días' },
    dias_trab:           { label: 'Días<br>Trab.', type: 'computed', width: 85 },
    salario_dias_trab:   { label: 'Salario Días<br>Trab. ($)', type: 'computed', width: 120 },
    subsidio_patrono:    { label: 'Subsidio<br>Patrono ($)', type: 'computed', width: 110 },
    subsidio_isss:       { label: 'Subsidio<br>ISSS ($)', type: 'computed', width: 110 },
    horas_ordinarias:    { label: 'H. Ord.<br>(Hrs)', type: 'number', width: 95, note: 'hrs' },
    horas_ext_diurnas:   { label: 'H.E. Diur.<br>(Hrs)', type: 'number', width: 85 },
    horas_ext_nocturnas: { label: 'H.E. Noct.<br>(Hrs)', type: 'number', width: 85 },
    horas_ext_festivas:  { label: 'H. Fest.<br>(Hrs)', type: 'number', width: 85 },
    bonificaciones:      { label: 'Bonifica-<br>ciones ($)', type: 'number', width: 115, affectsTotal: true },
    comisiones:          { label: 'Comisiones<br>($)', type: 'number', width: 110, affectsTotal: true },
    incentivos:          { label: 'Incentivos<br>($)', type: 'number', width: 110, affectsTotal: true },
    salario_diario:      { label: 'Salario<br>Diario ($)', type: 'computed', width: 115 },
    pago_ordinario:      { label: 'Pago Horas<br>Ord. ($)', type: 'computed', width: 110 },
    pago_ext_diurnas:    { label: 'Pago H.E.<br>Diur. ($)', type: 'computed', width: 110 },
    pago_ext_nocturnas:  { label: 'Pago H.E.<br>Noct. ($)', type: 'computed', width: 110 },
    pago_ext_festivas:   { label: 'Pago H.E.<br>Fest. ($)', type: 'computed', width: 110 },
    // Sección 4 — Prestaciones
    vacaciones:          { label: 'Vacaciones<br>($)', type: 'number', width: 115, affectsTotal: true },
    aguinaldo:           { label: 'Aguinaldo<br>Prop. ($)', type: 'number', width: 115, affectsTotal: true },
    indemnizacion:       { label: 'Indemni-<br>zación ($)', type: 'number', width: 115, affectsTotal: true },
    otros_beneficios:    { label: 'Otros<br>Benef. ($)', type: 'number', width: 115, affectsTotal: true },
    // Sección 5 — Deducciones
    isss_lab:            { label: 'ISSS<br>(3%)', type: 'computed', width: 110, isDeduction: true },
    afp_lab:             { label: 'AFP<br>(7.25%)', type: 'computed', width: 110, isDeduction: true },
    renta:               { label: 'Renta<br>(MH)', type: 'computed', width: 110, isDeduction: true },
    descuento_tardanzas: { label: 'Desc.<br>Tardanzas', type: 'number', width: 105, isDeduction: true },
    otros_descuentos:    { label: 'Otros<br>Desc. ($)', type: 'number', width: 110, isDeduction: true },
    isss_patronal:       { label: 'ISSS<br>Patronal', type: 'computed', width: 110, isDeduction: true },
    afp_patronal:        { label: 'AFP<br>Patronal', type: 'computed', width: 110, isDeduction: true },
    // Sección 6 — Totales
    total_devengado:     { label: 'Total<br>Devengado', type: 'computed', width: 135, isTotal: true },
    total_deducciones:   { label: 'Total<br>Deducciones', type: 'computed', width: 135, isTotal: true },
    salario_neto:        { label: 'Salario<br>Neto', type: 'computed', width: 135, isNetPay: true },
    forma_pago:          { label: 'Forma de<br>Pago', type: 'select', options: ['—','Transferencia','Cheque','Efectivo'], width: 130 },
};

// ─── Estilos por sección ─────────────────────────────────────────
const SEC_STYLE = {
    1: { hd: 'bg-indigo-900 text-indigo-100', btn: 'hover:bg-indigo-700', cell: '' },
    2: { hd: 'bg-sky-800 text-sky-100',       btn: 'hover:bg-sky-700',    cell: '' },
    3: { hd: 'bg-emerald-800 text-emerald-100',btn: 'hover:bg-emerald-700',cell: '' },
    4: { hd: 'bg-violet-800 text-violet-100', btn: 'hover:bg-violet-700', cell: '' },
    5: { hd: 'bg-rose-900 text-rose-100',     btn: 'hover:bg-rose-800',   cell: '' },
    6: { hd: 'bg-slate-900 text-slate-100',   btn: 'hover:bg-slate-700',  cell: '' },
};

// ─── Estado global ───────────────────────────────────────────────
var projects = [];
var proyecto_actual = null;
var activeSheetIndex = 0;
window.projects = projects;
window.proyecto_actual = proyecto_actual;
window.activeSheetIndex = activeSheetIndex;
window.getActiveCols = getActiveCols;
window.COL = COL;
window.SECTIONS = SECTIONS;
let configModalSectionId = null;
let _activeView = 'planilla'; // 'planilla' | 'tablas'
window._syncPill = null;
window.lastSyncError = "";

// ─── Historial Undo / Redo ────────────────────────────────────────
const _history = [];      // pila de estados anteriores
const _redoStack = [];    // pila de estados redo
const MAX_HISTORY = 30;

function _snapshotState() {
    return JSON.stringify(proyecto_actual);
}

function pushHistory() {
    _history.push(_snapshotState());
    if (_history.length > MAX_HISTORY) _history.shift();
    _redoStack.length = 0; // cualquier acción nueva limpia el redo
    _updateUndoRedoBtns();
}

window.undoAction = function() {
    if (window.isAuditMode) return;
    if (!_history.length) return;
    _redoStack.push(_snapshotState());
    proyecto_actual = JSON.parse(_history.pop());
    // Sincronizar en projects
    const idx = projects.findIndex(p => p.id === proyecto_actual.id);
    if (idx !== -1) projects[idx] = proyecto_actual;
    calculateAndRenderPayroll();
    renderSheetSelect();
    saveState();
    _updateUndoRedoBtns();
    _showUndoToast('Acción deshecha ↩');
};

window.redoAction = function() {
    if (window.isAuditMode) return;
    if (!_redoStack.length) return;
    _history.push(_snapshotState());
    proyecto_actual = JSON.parse(_redoStack.pop());
    const idx = projects.findIndex(p => p.id === proyecto_actual.id);
    if (idx !== -1) projects[idx] = proyecto_actual;
    calculateAndRenderPayroll();
    renderSheetSelect();
    saveState();
    _updateUndoRedoBtns();
    _showUndoToast('Acción rehecha ↪');
};

function _updateUndoRedoBtns() {
    const u = document.getElementById('btn-undo');
    const r = document.getElementById('btn-redo');
    if (u) u.disabled = _history.length === 0;
    if (r) r.disabled = _redoStack.length === 0;
}

function _showUndoToast(msg) {
    let t = document.getElementById('undo-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'undo-toast';
        t.className = 'undo-toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('visible');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('visible'), 2200);
}

// Atajo de teclado Ctrl+Z / Ctrl+Y
document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
    if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); window.undoAction(); }
    if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); window.redoAction(); }
});

// ─── Helpers ─────────────────────────────────────────────────────
function getDefaultSectionConfig() {
    const cfg = {};
    SECTIONS.forEach(s => {
        cfg[s.id] = {
            customActiveCols: [...s.defaultCols],
            optionalActive: [], // compatibilidad con versiones previas
            sectionActive: !s.isOptionalSection
        };
    });
    return cfg;
}

function createEmptyEmployee() {
    return {
        id: 'emp_' + Date.now(),
        nombre: '', codigo: '', sexo: '—',
        cargo: '', departamento: '', jornada: '—',
        tipo_contrato: '', fecha_salida: '', observaciones: '',
        dui: '', nit: '', isss_num: '', afp_num: '',
        fecha_nac: '', estado_civil: '', fecha_ingreso: '',
        salario_base: 0,
        tipo_incap: '—',
        dias_incap: 0,
        horas_ordinarias: 0,
        horas_ext_diurnas: 0, horas_ext_nocturnas: 0, horas_ext_festivas: 0,
        bonificaciones: 0, comisiones: 0, incentivos: 0,
        vacaciones: 0, aguinaldo: 0, indemnizacion: 0, otros_beneficios: 0,
        descuento_tardanzas: 0, otros_descuentos: 0, forma_pago: '—',
        _computed: {}
    };
}

// Migración del modelo antiguo al nuevo
function migrateEmployee(e) {
    if (e.salarioBase !== undefined && e.salario_base === undefined) {
        e.salario_base    = e.salarioBase || 0;
        e.horas_ext_diurnas = e.horasExtras || 0;
        e.comisiones      = e.comisiones || 0;
        e.bonificaciones  = e.otros || 0;
        delete e.salarioBase; delete e.horasExtras; delete e.otros;
    }
    if (e.dias_incap === undefined) {
        e.dias_incap = 0;
    }
    if (e.tipo_incap === undefined) {
        e.tipo_incap = '—';
    }
    if (!e._computed) e._computed = {};
    return e;
}

function ensureSheetDefaults(sheet) {
    // Si no tiene sectionConfig es esquema viejo (pre-v2): limpiar y partir de 1 fila vacía
    const isLegacy = !sheet.sectionConfig;
    if (!sheet.sectionConfig) sheet.sectionConfig = getDefaultSectionConfig();
    // No longer forcing customActiveCols injection so that layout is clean by default.

    if (!sheet.employees || sheet.employees.length === 0 || isLegacy) {
        sheet.employees = [createEmptyEmployee()];
    } else {
        sheet.employees = sheet.employees.map(migrateEmployee);
    }
}

function getActiveCols() {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    const cfg = sheet.sectionConfig || getDefaultSectionConfig();
    const cols = [];
    SECTIONS.forEach(section => {
        const secCfg = cfg[section.id] || {};
        if (section.isOptionalSection && !secCfg.sectionActive) return;
        
        let activeKeys;
        if (secCfg.customActiveCols !== undefined) {
            // Nuevo modelo: el usuario ya configuró sus columnas
            activeKeys = secCfg.customActiveCols;
        } else {
            // Modelo anterior: columnas default + opcionales que estuviesen activas
            activeKeys = [...section.defaultCols, ...(secCfg.optionalActive || [])];
        }

        activeKeys.forEach(key => {
            if (section.defaultCols.includes(key) || section.optionalCols.includes(key)) {
                cols.push({ sectionId: section.id, colKey: key });
            }
        });
    });
    return cols;
}

// ─── Sanitización HTML Anti-XSS ──────────────────────────────────
function escapeHtml(val) {
    if (window.EduSec && typeof window.EduSec.escapeHtml === 'function') {
        return window.EduSec.escapeHtml(val);
    }
    return String(val ?? '').replace(/[&<>"'`]/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;'
    }[ch]));
}
const escAttr = escapeHtml;

// ─── Motor de Cálculo ────────────────────────────────────────────
function calculateRentaSV(gravado) {
    if (gravado <= 550.00) return 0;
    if (gravado <= 895.24)  return (gravado - 550.00) * 0.10 + 17.67;
    if (gravado <= 2038.10) return (gravado - 895.24) * 0.20 + 60.00;
    return (gravado - 2038.10) * 0.30 + 288.57;
}

function calculateEmployee(e, sheet) {
    const cfg = sheet.sectionConfig || getDefaultSectionConfig();
    const sec4 = cfg[4] && cfg[4].sectionActive;

    // Columnas activas de la sección 5 (deducciones) — solo descontar si está visible
    const sec5Cols = (cfg[5] && cfg[5].customActiveCols) || [];
    const colVisible = key => sec5Cols.includes(key);

    const n = k => parseFloat(e[k]) || 0;

    const salarioBase = n('salario_base');
    const salarioDiario = salarioBase / 30;
    const valorHora = salarioDiario / 8;

    // Incapacidades y Subsidios
    const diasIncap = n('dias_incap');
    const diasTrab = Math.max(0, 30 - diasIncap);
    const salarioDiasTrab = (salarioBase / 30) * diasTrab;
    const tipoIncap = e.tipo_incap || '—';

    let subsidioPatrono = 0;
    let subsidioIsss = 0;

    if (tipoIncap === 'Maternidad') {
        // En Maternidad, el ISSS subsidia el 100% de la base diaria de cotización, con un techo mensual de $1000 ($33.33 diarios).
        // El empleador cubre el excedente para garantizar el 100% del sueldo de la empleada.
        const diarioTecho = 1000 / 30;
        if (salarioDiario > diarioTecho) {
            subsidioIsss = diarioTecho * diasIncap;
            subsidioPatrono = (salarioDiario - diarioTecho) * diasIncap;
        } else {
            subsidioIsss = salarioDiario * diasIncap;
            subsidioPatrono = 0;
        }
    } else {
        // Incapacidad normal (Enfermedad común/Accidente de trabajo):
        // El patrono cubre 100% los primeros 3 días. El ISSS cubre 75% a partir del 4º día.
        subsidioPatrono = diasIncap <= 3 ? salarioDiario * diasIncap : salarioDiario * 3;
        subsidioIsss = diasIncap > 3 ? (salarioDiario * 0.75) * (diasIncap - 3) : 0;
    }

    // Horas ordinarias (si se ingresan horas ordinarias > 0, se calcula el pago de esas horas; de lo contrario, se usa salarioDiasTrab)
    const hrsOrd = n('horas_ordinarias');
    const pagoOrdinario = hrsOrd > 0 ? (valorHora * hrsOrd) : salarioBase;

    // Horas extras pagos según recargos de ley SV
    const pagoExtDiurnas = valorHora * n('horas_ext_diurnas') * 2;
    const pagoExtNocturnas = valorHora * n('horas_ext_nocturnas') * 2.25;
    const pagoExtFestivas = valorHora * n('horas_ext_festivas') * 2.5;
    const pagoHorasExt = pagoExtDiurnas + pagoExtNocturnas + pagoExtFestivas;

    // Prestaciones (Sección 4)
    const vac = sec4 ? n('vacaciones') : 0;
    const agui = sec4 ? n('aguinaldo') : 0;
    const indem = sec4 ? n('indemnizacion') : 0;
    const otrosB = sec4 ? n('otros_beneficios') : 0;

    // Total Devengado corregido con subsidio patrono y días trabajados
    const totalDevengado =
        salarioDiasTrab +
        subsidioPatrono +
        pagoExtDiurnas +
        pagoExtNocturnas +
        pagoExtFestivas +
        n('bonificaciones') +
        n('comisiones') +
        n('incentivos') +
        vac + agui + indem + otrosB;

    // ── Deducciones Legales y Bases de Cotización ────────────────────
    // ISSS: techo de $1000. AFP: sin techo.
    // Maternidad: Exenta de ISSS laboral y patronal cuando diasTrab === 0; el subsidio está exento de ISSS.
    // AFP Laboral: Se retiene 7.25% sobre el total devengado en planilla (incluyendo complemento patronal).
    // AFP Patronal: Se aporta 8.75% sobre el total (totalDevengado + subsidioIsss).
    let baseISSS = totalDevengado;
    let baseAFP = totalDevengado;
    let baseAFPPatronal = totalDevengado;

    if (tipoIncap === 'Maternidad') {
        baseISSS = diasTrab === 0 ? 0 : Math.max(0, totalDevengado - subsidioPatrono);
        baseAFP = totalDevengado;
        baseAFPPatronal = totalDevengado + subsidioIsss;
    }

    const isssLab     = Math.min(baseISSS, 1000) * 0.03;
    const afpLab      = baseAFP * 0.0725;

    // Renta: se calcula sobre el gravado (descontando ISSS+AFP si están visibles)
    const isssLabEfectivo = colVisible('isss_lab') ? isssLab : 0;
    const afpLabEfectivo  = colVisible('afp_lab')  ? afpLab  : 0;
    const gravado     = Math.max(0, totalDevengado - isssLabEfectivo - afpLabEfectivo);
    const renta       = calculateRentaSV(gravado);

    // Solo se resta si la columna está visible
    const tardanzas   = n('descuento_tardanzas');
    const otrosDesc   = n('otros_descuentos');
    const totalDed    = isssLabEfectivo
                      + afpLabEfectivo
                      + (colVisible('renta') ? renta : 0)
                      + (colVisible('descuento_tardanzas') ? tardanzas : 0)
                      + (colVisible('otros_descuentos')    ? otrosDesc  : 0);

    // Neto a recibir
    const salarioNeto = totalDevengado - totalDed;

    // Control Patronal — siempre se calcula
    const isssP       = Math.min(baseISSS, 1000) * 0.075;
    const afpP        = baseAFPPatronal * 0.0875;
    const isssPatEfectivo = colVisible('isss_patronal') ? isssP : 0;
    const afpPatEfectivo  = colVisible('afp_patronal')  ? afpP  : 0;

    e._computed = {
        salario_diario:    salarioDiario,
        dias_trab:         diasTrab,
        salario_dias_trab: salarioDiasTrab,
        salario_devengado: salarioDiasTrab,
        subsidio_patrono:  subsidioPatrono,
        subsidio_isss:     subsidioIsss,
        pago_ordinario:    pagoOrdinario,
        pago_ext_diurnas:  pagoExtDiurnas,
        pago_ext_nocturnas:pagoExtNocturnas,
        pago_ext_festivas: pagoExtFestivas,
        pago_horas_ext:    pagoHorasExt,
        isss_lab:          isssLab,
        afp_lab:           afpLab,
        renta:             renta,
        isss_patronal:     isssP,
        isss_pat:          isssP,
        afp_patronal:      afpP,
        afp_pat:           afpP,
        total_devengado:   totalDevengado,
        total_deducciones: totalDed,
        salario_neto:      salarioNeto,
        liquido_recibir:   salarioNeto,
        _isssAfpLab:       isssLabEfectivo + afpLabEfectivo,
        _cargaPatronal:    isssPatEfectivo + afpPatEfectivo,
    };
}

// ─── Renderizado del Encabezado de Tabla ─────────────────────────
function renderTableHeader() {
    const table = document.getElementById('payroll-table');
    if (!table) return;
    const activeCols = getActiveCols();
    const isAudit = !!window.isAuditMode;

    // Agrupar columnas consecutivas por sección
    const spans = [];
    activeCols.forEach(col => {
        if (!spans.length || spans[spans.length - 1].sectionId !== col.sectionId) {
            spans.push({ sectionId: col.sectionId, span: 1 });
        } else {
            spans[spans.length - 1].span++;
        }
    });

    // Fila 1: Secciones
    let r1 = `<tr class="border-b-2 border-slate-600">`;
    spans.forEach(({ sectionId, span }) => {
        const sec = SECTIONS.find(s => s.id === sectionId);
        const st = SEC_STYLE[sectionId];
        const displayLabel = span === 1 ? (sec.shortLabel || sec.label) : sec.label;
        r1 += `<th colspan="${span}" class="${st.hd} py-1.5 px-2 text-[12px] font-black uppercase tracking-widest">
            <div class="flex items-center justify-between gap-1 whitespace-nowrap">
                <span class="flex items-center gap-1.5"><i class="fas ${sec.icon} opacity-70"></i>${displayLabel}</span>
                ${!isAudit ? `<button onclick="openSectionConfig(${sectionId})"
                    class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-white/10 ${st.btn} transition-colors"
                    title="Configurar columnas de esta sección">
                    <i class="fas fa-gear text-[11px]"></i>
                </button>` : ''}
            </div>
        </th>`;
    });
    r1 += `</tr>`;

    // Fila 2: Columnas — con anchos explícitos para un ajuste perfecto
    let r2 = `<tr class="bg-slate-800 dark:bg-slate-900 text-slate-200 border-b border-slate-700">`;
    activeCols.forEach(({ sectionId, colKey }) => {
        const colDef = COL[colKey];
        const wVal = colDef.width ? `${colDef.width}px` : 'auto';
        r2 += `<th class="py-1.5 px-1.5 font-bold text-[11px] leading-tight text-center border-l border-slate-700/50 uppercase tracking-wider" style="width:${wVal}; min-width:${wVal}; max-width:${wVal};">${colDef.label}</th>`;
    });
    r2 += `</tr>`;

    let thead = table.querySelector('thead');
    if (!thead) { thead = document.createElement('thead'); table.prepend(thead); }
    thead.innerHTML = r1 + r2;
}

// ─── Fórmulas explicativas por columna (para el tooltip glowing-glass) ──────
const COL_FORMULAS = {
    salario_diario:      { title: 'Salario Diario',       icon: '📅', formula: 'Salario Base ÷ 30',                                                          note: 'En El Salvador se divide entre 30 días independientemente del mes.' },
    dias_trab:           { title: 'Días Trabajados',      icon: '🗓️', formula: '30 − Días de Incapacidad',                                                   note: 'Días calendario efectivos trabajados en el mes.' },
    salario_dias_trab:   { title: 'Salario por Días Trab.', icon: '💵', formula: '(Salario Base ÷ 30) × Días Trabajados',                                    note: 'Pago proporcional al tiempo efectivamente laborado.' },
    subsidio_patrono:    { title: 'Subsidio Patrono',     icon: '🏢', formula: 'Enfermedad: Si Incap ≤ 3 días → (S.Base÷30)×Días Incap; Si Incap > 3 días → (S.Base÷30)×3\nMaternidad: Si S.Base > $1,000 → (S.Base − $1,000) ÷ 30 × Días Maternidad; de lo contrario → $0', note: 'El patrono cubre los primeros 3 días en enfermedad común, y cubre la diferencia sobre el techo en maternidad para garantizar el 100% del sueldo.' },
    subsidio_isss:       { title: 'Subsidio ISSS',        icon: '🏥', formula: 'Enfermedad: (Salario Base ÷ 30 × 75%) × (Días Incap − 3)\nMaternidad: MIN(Salario Base, $1,000) ÷ 30 × Días Maternidad', note: 'El ISSS subsidia el 75% a partir del día 4 en enfermedad, y el 100% (hasta techo de $1,000) desde el día 1 en maternidad.' },
    pago_ordinario:      { title: 'Pago Horas Ordinarias', icon: '⏱️', formula: 'Valor Hora × Horas Ordinarias',                                            note: 'Solo aplica si se ingresan horas ordinarias. Si no, se usa el salario base.' },
    pago_ext_diurnas:    { title: 'Horas Extra Diurnas',  icon: '☀️', formula: 'Valor Hora × Hrs. Extra Diurnas × 2',                                        note: 'Recargo del 100% adicional (Art. 169 CT). Valor hora = Salario÷30÷8.' },
    pago_ext_nocturnas:  { title: 'Horas Extra Nocturnas', icon: '🌙', formula: 'Valor Hora × Hrs. Extra Nocturnas × 2.25',                                  note: 'Recargo del 125% adicional (Art. 169 CT).' },
    pago_ext_festivas:   { title: 'Horas Extra Festivas', icon: '🎉', formula: 'Valor Hora × Hrs. Extra Festivas × 2.5',                                     note: 'Recargo del 150% adicional en días festivos o asueto (Art. 190 CT).' },
    isss_lab:            { title: 'ISSS Laboral',          icon: '🏥', formula: 'MIN(Base Cotizable ISSS, $1,000) × 3%',                                     note: 'Base máxima de cotización ISSS: $1,000. Maternidad: el subsidio por maternidad está exento del descuento del ISSS.' },
    afp_lab:             { title: 'AFP Laboral',           icon: '💼', formula: 'Base Cotizable AFP × 7.25%',                                                note: 'Maternidad: se calcula solo sobre el pago realizado por el patrono (el ISSS retiene la parte del subsidio).' },
    renta:               { title: 'Retención de Renta',   icon: '🏛️', formula: 'Escala MH Decreto No. 10 sobre salario gravado',                            note: 'Salario gravado = Total Devengado − ISSS − AFP (si están visibles).\n≤$550: $0 | ≤$895.24: 10%+$17.67 | ≤$2,038.10: 20%+$60 | >$2,038.10: 30%+$288.57' },
    isss_patronal:       { title: 'ISSS Patronal',         icon: '🏢', formula: 'MIN(Base Cotizable ISSS, $1,000) × 7.5%',                                   note: 'Aporte del empleador. Exento durante licencia de maternidad.' },
    afp_patronal:        { title: 'AFP Patronal',          icon: '🏢', formula: 'Base Cotizable AFP Patronal × 8.75%',                                       note: 'Maternidad: el patrono debe pagar el 8.75% sobre el total (salario devengado + subsidio ISSS) según Ley Integral de Pensiones.' },
    total_devengado:     { title: 'Total Devengado',       icon: '📊', formula: 'Sal.Días Trab + Subs.Patrono + H.Extra + Bonif + Comis + Incent + Prestaciones', note: 'Suma de todos los ingresos del período que el patrono paga directamente. No incluye subsidio ISSS.' },
    total_deducciones:   { title: 'Total Deducciones',     icon: '➖', formula: 'ISSS + AFP + Renta + Tardanzas + Otros Desc.',                               note: 'Solo se deducen las columnas que están visibles/activas en la planilla.' },
    salario_neto:        { title: 'Salario Neto',          icon: '💰', formula: 'Total Devengado − Total Deducciones',                                       note: 'Monto líquido que recibe el trabajador.' },
};

function getColLabelLength(colKey) {
    const colDef = COL[colKey];
    if (!colDef) return 10;
    const cleanText = colDef.label.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return Math.max(cleanText.length, 6);
}

// ─── Renderizado de Celda Individual ─────────────────────────────
function renderCell(e, idx, colKey, sectionId) {
    const colDef = COL[colKey];
    const val = e[colKey];
    const computed = e._computed || {};
    const isAudit = !!window.isAuditMode;
    const disabledAttr = isAudit ? 'disabled' : '';
    // Uniform cell background: only deductions get a subtle rose tint, totals get a slight slate
    const cellBg = colDef.isDeduction ? 'bg-rose-50/20' : (colDef.isNetPay ? 'bg-indigo-50/20' : '');

    if (colDef.type === 'computed') {
        const num = computed[colKey] !== undefined ? computed[colKey] : 0;
        
        // Modo Práctica (BTVAC 3.3): cálculo manual de deducciones e ingresos líquidos
        if (window._planillaMode === 'practica' && ['isss_lab', 'afp_lab', 'renta', 'salario_neto', 'liquido_recibir'].includes(colKey)) {
            e._practice = e._practice || {};
            const rawPVal = e._practice[colKey] !== undefined
                ? e._practice[colKey]
                : (colKey === 'salario_neto' ? e._practice.liquido_recibir : undefined);
            const pVal = rawPVal !== undefined ? rawPVal : '';
            return `<td class="p-0.5 whitespace-nowrap ${cellBg}">
                <input type="number" step="0.01" value="${escAttr(pVal)}" ${disabledAttr}
                    placeholder="0.00"
                    onchange="window.savePracticeField(${idx}, '${colKey}', this.value)"
                    class="planilla-input text-center text-[13px] tabular-nums font-bold text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-lg focus:ring-2 focus:ring-amber-500"
                    style="width: 100%; box-sizing: border-box;" title="Ingresa tu cálculo manual según ley SV">
            </td>`;
        }

        let cls = 'text-slate-600 font-semibold';
        if (colDef.isDeduction) cls = 'text-rose-600 font-bold';
        if (colDef.isTotal) cls = 'text-slate-800 font-black';
        if (colDef.isNetPay) cls = 'text-indigo-700 font-black text-sm';
        if (colKey === 'total_deducciones') cls = 'text-rose-700 font-black';
        const formattedVal = colKey === 'dias_trab' ? parseInt(num) : `$${num.toFixed(2)}`;
        const hasFormula = !!COL_FORMULAS[colKey];
        const formulaAttr = hasFormula ? `data-formula-key="${colKey}" data-emp-idx="${idx}"` : '';
        const cursorCls = hasFormula ? 'cursor-pointer hover:underline hover:decoration-dotted' : '';
        const compWidth = (formattedVal.length + 1.5) + 'ch';
        // ID único para actualizar sin re-renderizar la tabla completa
        return `<td class="p-0.5 whitespace-nowrap ${cellBg}">
            <span id="cell-${idx}-${colKey}" class="planilla-computed justify-center text-center ${cls} ${cursorCls}" ${formulaAttr} onclick="showFormulaTooltip(event, '${colKey}', ${idx})" style="width:${compWidth}; min-width:50px; display:inline-flex;">${formattedVal}</span>
        </td>`;
    }

    if (colDef.type === 'number') {
        const num = val !== undefined ? parseFloat(val) || 0 : 0;
        const inputCls = colDef.isDeduction ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200';
        const isDays = colKey === 'dias_incap';
        const stepVal = isDays ? '1' : '0.01';
        const displayVal = isDays ? parseInt(num) : num;
        
        return `<td class="p-0.5 whitespace-nowrap ${cellBg}">
            <input type="number" step="${stepVal}" min="0" ${isDays ? 'max="30"' : ''} value="${escAttr(displayVal)}" ${disabledAttr}
                onfocus="if(parseFloat(this.value) === 0) this.value = ''"
                onblur="if(this.value === '') { this.value = '${displayVal}'; saveNumField(${idx}, '${colKey}', 0); }"
                onchange="saveNumField(${idx}, '${colKey}', this.value)"
                class="planilla-input text-center text-[13.5px] font-semibold ${inputCls}"
                style="width: 100%; box-sizing: border-box;" placeholder="${isDays ? '0' : '0.00'}">
        </td>`;
    }

    if (colDef.type === 'select') {
        const current = val || '—';
        const opts = colDef.options.map(o =>
            `<option value="${escAttr(o)}" ${o === current ? 'selected' : ''}>${escapeHtml(o)}</option>`
        ).join('');
        return `<td class="p-0.5 whitespace-nowrap ${cellBg}">
            <select onchange="saveTextField(${idx}, '${colKey}', this.value)" ${disabledAttr}
                class="planilla-input text-center text-[13.5px] font-semibold cursor-pointer"
                style="width: 100%; box-sizing: border-box;">
                ${opts}
            </select>
        </td>`;
    }

    if (colDef.type === 'date') {
        const dateVal = val || '';
        return `<td class="p-0.5 whitespace-nowrap ${cellBg}">
            <input type="date" value="${escAttr(dateVal)}" ${disabledAttr}
                onchange="saveTextField(${idx}, '${colKey}', this.value)"
                class="planilla-input text-center text-[13.5px] font-medium text-slate-600 dark:text-slate-300"
                style="width: 100%; box-sizing: border-box;">
        </td>`;
    }

    // text — celda expandida a 100% de la columna
    const txtVal = escAttr(val || '');
    const isName = colKey === 'nombre';
    const placeholderText = escAttr((colDef.placeholder || colDef.label).replace(/<br>/g, ' ') + '...');
    return `<td class="p-0.5 ${cellBg} ${isName ? 'relative' : ''}">
        <input type="text" value="${txtVal}" ${disabledAttr}
            onchange="saveTextField(${idx}, '${colKey}', this.value)"
            class="planilla-input ${isName ? 'text-left font-bold text-slate-800 dark:text-slate-100' : 'text-center font-medium text-slate-600 dark:text-slate-300'} text-[13.5px]"
            style="width: 100%; box-sizing: border-box;"
            placeholder="${placeholderText}">
    </td>`;
}

// ─── Renderizado del Cuerpo de Tabla ─────────────────────────────
function renderTableBody() {
    const tbody = document.getElementById('payroll-table-body');
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!tbody || !sheet) return;

    // Limpiar popovers huérfanos de instancias Glass anteriores antes de vaciar tbody
    tbody.querySelectorAll('select, input[type="date"]').forEach(el => {
        if (el._glassInstance && el._glassInstance.popover) {
            el._glassInstance.popover.remove();
        }
    });

    const activeCols = getActiveCols();
    const emps = sheet.employees || [];
    const fragment = document.createDocumentFragment();
    const isAudit = !!window.isAuditMode;

    emps.forEach((e, idx) => {
        const tr = document.createElement('tr');
        tr.className = `border-b border-slate-100 hover:bg-indigo-50/20 transition-colors group relative`;
        tr.dataset.empIdx = idx;
        tr.style.position = 'relative';

        let cells = activeCols.map(({ sectionId, colKey }) =>
            renderCell(e, idx, colKey, sectionId)
        ).join('');

        tr.innerHTML = cells;

        // Botón eliminar — aparece al hover sobre la fila, posición absoluta en el último <td>
        tr.addEventListener('mouseenter', () => {
            if (window.isAuditMode) return;
            const lastTd = tr.querySelector('td:last-child');
            if (lastTd) {
                lastTd.style.position = 'relative';
                if (!lastTd.querySelector('.row-delete-btn')) {
                    const btn = document.createElement('button');
                    btn.className = 'row-delete-btn';
                    btn.title = 'Eliminar fila';
                    btn.innerHTML = '<i class="far fa-trash-alt"></i>';
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        deleteEmployeeRow(idx);
                    };
                    lastTd.appendChild(btn);
                }
                lastTd.querySelector('.row-delete-btn').classList.add('visible');
            }
        });
        tr.addEventListener('mouseleave', () => {
            const btn = tr.querySelector('.row-delete-btn');
            if (btn) btn.classList.remove('visible');
        });

        fragment.appendChild(tr);
    });

    tbody.innerHTML = '';
    tbody.appendChild(fragment);

    // Integrar componentes flotantes Glassmorphic en selects e inputs de fecha de la tabla
    if (typeof window.EduContaGlassSelect === 'function') {
        tbody.querySelectorAll('select:not([data-glass-select-initialized])').forEach(el => {
            new window.EduContaGlassSelect(el);
        });
    }
    if (typeof window.EduContaGlassDatePicker === 'function') {
        tbody.querySelectorAll('input[type="date"]:not([data-glass-date-initialized])').forEach(el => {
            new window.EduContaGlassDatePicker(el);
        });
    }
    if (isAudit) {
        tbody.querySelectorAll('.educonta-glass-select-trigger, .educonta-glass-date-trigger').forEach(btn => {
            btn.disabled = true;
            btn.classList.add('opacity-70', 'cursor-not-allowed', 'pointer-events-none');
        });
    }
}

// ─── Renderizado completo ─────────────────────────────────────────
function calculateAndRenderPayroll() {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;

    sheet.employees = (sheet.employees || []).map(migrateEmployee);

    let totNet = 0, totDedLab = 0, totRenta = 0, totPatronal = 0;

    sheet.employees.forEach(e => {
        calculateEmployee(e, sheet);
        totNet      += e._computed.salario_neto     || 0;
        totDedLab   += e._computed._isssAfpLab      || 0;
        totRenta    += e._computed.renta             || 0;
        totPatronal += e._computed._cargaPatronal   || 0;
    });

    renderTableHeader();
    renderTableBody();
    updateDashboardMetrics(totNet, totDedLab, totRenta, totPatronal);

    const emptyState = document.getElementById('payroll-empty-state');
    if (emptyState) {
        emptyState.classList.toggle('hidden', sheet.employees.length > 0);
    }
}

// ─── Modal de Configuración de Sección ───────────────────────────
window.openSectionConfig = function(sectionId) {
    if (window.isAuditMode) return;
    configModalSectionId = sectionId;
    const section  = SECTIONS.find(s => s.id === sectionId);
    const sheet    = proyecto_actual.sheets[activeSheetIndex];
    const cfg      = sheet.sectionConfig || getDefaultSectionConfig();
    const secCfg   = cfg[sectionId] || { sectionActive: !section.isOptionalSection };
    const st       = SEC_STYLE[sectionId];

    // Título e ícono
    document.getElementById('scm-title').textContent = section.label;
    document.getElementById('scm-subtitle').textContent = 'Personalizar columnas de esta sección';
    const iconEl = document.getElementById('scm-icon');
    if (iconEl) {
        iconEl.className = `w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto text-xl ${st.hd}`;
        iconEl.innerHTML = `<i class="fas ${section.icon}"></i>`;
    }

    // Limpiar el contenedor de la lista fija (ahora todo es editable)
    document.getElementById('scm-default-list').innerHTML = '';

    // Unimos columnas predeterminadas y opcionales para que todas aparezcan en la misma lista configurable
    const allCols = [...section.defaultCols, ...section.optionalCols];

    // Columnas seleccionables (checkboxes)
    const optList = document.getElementById('scm-optional-list');
    if (!allCols.length) {
        optList.innerHTML = `<p class="text-xs text-slate-400 italic px-1">Esta sección no tiene columnas configurables.</p>`;
    } else {
        optList.innerHTML = allCols.map(key => {
            const colDef   = COL[key];
            
            let isActive;
            if (secCfg.customActiveCols !== undefined) {
                isActive = secCfg.customActiveCols.includes(key);
            } else {
                // Modelo anterior: las default siempre estaban activas, y las opcionales según optionalActive
                isActive = section.defaultCols.includes(key) || (secCfg.optionalActive || []).includes(key);
            }

            return `<label class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                <input type="checkbox" value="${key}" ${isActive ? 'checked' : ''}
                    class="scm-optional-checkbox w-4 h-4 rounded accent-indigo-500">
                <div>
                    <p class="text-xs font-bold text-slate-700">${colDef.label.replace(/<br>/g, ' ')}</p>
                    ${colDef.note ? `<p class="text-[9px] text-slate-400 font-medium">${colDef.note}</p>` : ''}
                </div>
            </label>`;
        }).join('');
    }

    // Toggle de sección opcional (solo sección 4)
    const sec4Block = document.getElementById('scm-section4-toggle');
    if (section.isOptionalSection) {
        sec4Block.classList.remove('hidden');
        document.getElementById('scm-section4-active').checked = !!secCfg.sectionActive;
    } else {
        sec4Block.classList.add('hidden');
    }

    document.getElementById('section-config-modal').style.display = 'flex';
};

window.closeSectionConfig = function() {
    const md = document.getElementById('section-config-modal');
    if (md) {
        md.classList.add('closing');
        setTimeout(() => {
            md.style.display = 'none';
            md.classList.remove('closing');
        }, 300);
    }
};

window.saveSectionConfig = function() {
    if (window.isAuditMode) return;
    const sheet   = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet.sectionConfig) sheet.sectionConfig = getDefaultSectionConfig();

    const section = SECTIONS.find(s => s.id === configModalSectionId);
    const boxes   = document.querySelectorAll('.scm-optional-checkbox');
    const customActiveCols = Array.from(boxes).filter(c => c.checked).map(c => c.value);

    sheet.sectionConfig[configModalSectionId] = {
        customActiveCols,
        optionalActive: customActiveCols.filter(k => section.optionalCols.includes(k)), // Para compatibilidad
        sectionActive: section.isOptionalSection
            ? document.getElementById('scm-section4-active').checked
            : true,
    };

    closeSectionConfig();
    calculateAndRenderPayroll();
    saveState();
};

// ─── Gestión de Hojas / Períodos ─────────────────────────────────
function renderSheetSelect() {
    const select = document.getElementById('payroll-sheet-select');
    if (!select) return;
    select.innerHTML = '';
    
    const customList = document.getElementById('custom-period-dropdown-list');
    const customLabel = document.getElementById('custom-period-dropdown-label');
    if (customList) customList.innerHTML = '';

    proyecto_actual.sheets.forEach((sh, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = sh.name;
        if (i === activeSheetIndex) {
            opt.selected = true;
            if (customLabel) customLabel.textContent = sh.name;
        }
        select.appendChild(opt);

        if (customList) {
            const li = document.createElement('li');
            li.className = `custom-dropdown-item ${i === activeSheetIndex ? 'active' : ''}`;
            li.textContent = sh.name;
            li.onclick = () => {
                switchPayrollSheet(i);
                const dropdownMenu = document.getElementById('custom-period-dropdown-menu');
                if (dropdownMenu) dropdownMenu.classList.remove('show');
            };
            customList.appendChild(li);
        }
    });
}

window.switchPayrollSheet = function(idx) {
    activeSheetIndex = parseInt(idx);
    loadActiveSheet();
    renderSheetSelect();
};

window.updateSheetName = function(el) {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (sheet) {
        const newName = el.innerText.trim();
        if (newName) {
            sheet.name = newName;
            saveState();
            renderSheetSelect();
            const printInfo = document.getElementById('print-period-info');
            if (printInfo) printInfo.innerText = `${sheet.name} — FECHA: ${sheet.date || ''}`;
        } else {
            el.innerText = sheet.name;
        }
    }
};

window.updateSheetDate = function(val) {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (sheet) {
        sheet.date = val;
        saveState();
        const printInfo = document.getElementById('print-period-info');
        if (printInfo) printInfo.innerText = `${sheet.name} — FECHA: ${sheet.date || ''}`;
    }
};

window.handleTitleKey = function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        e.target.blur();
    }
};

function formatDisplayDate(dateStr) {
    if (!dateStr) return '--/--/----';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

function loadActiveSheet() {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;
    ensureSheetDefaults(sheet);
    const title = document.getElementById('payroll-item-title');
    if (title) title.innerText = sheet.name;
    
    const dateInput = document.getElementById('payroll-sheet-date');
    if (dateInput) {
        if (!sheet.date) {
            sheet.date = new Date().toISOString().split('T')[0];
        }
        dateInput.value = sheet.date;
    }

    const dateDisplay = document.getElementById('custom-date-display');
    if (dateDisplay) {
        dateDisplay.textContent = formatDisplayDate(sheet.date);
    }
    if (typeof syncCustomCalendar === 'function') {
        syncCustomCalendar(sheet.date);
    }

    const printInfo = document.getElementById('print-period-info');
    if (printInfo) {
        printInfo.innerText = `${sheet.name} — FECHA: ${sheet.date || ''}`;
    }

    calculateAndRenderPayroll();
}

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
    const name = (document.getElementById('sheet-input-name').value || '').trim();
    if (!name) return;
    proyecto_actual.sheets.push({
        name,
        date: new Date().toISOString().split('T')[0],
        employees: [createEmptyEmployee()],
        sectionConfig: getDefaultSectionConfig(),
    });
    activeSheetIndex = proyecto_actual.sheets.length - 1;
    saveState();
    renderSheetSelect();
    loadActiveSheet();
    closeSheetModal();
};

window.confirmDeleteSheet = function() {
    if (window.isAuditMode) return;
    if (proyecto_actual.sheets.length <= 1) {
        if (typeof window.showAlert === 'function') {
            window.showAlert('Aviso', 'No puedes eliminar el único período. Debe existir al menos uno.');
        } else {
            alert('No puedes eliminar el único período. Debe existir al menos uno.');
        }
        return;
    }
    const sheetName = proyecto_actual.sheets[activeSheetIndex].name;
    if (typeof window.showModal === 'function') {
        window.showModal(
            "Eliminar Período",
            `¿Eliminar la planilla "${sheetName}"?`,
            () => {
                proyecto_actual.sheets.splice(activeSheetIndex, 1);
                activeSheetIndex = 0;
                saveState();
                renderSheetSelect();
                loadActiveSheet();
                if (typeof window.closeModal === 'function') window.closeModal();
            },
            false
        );
    } else {
        if (confirm(`¿Eliminar la planilla "${sheetName}"?`)) {
            proyecto_actual.sheets.splice(activeSheetIndex, 1);
            activeSheetIndex = 0;
            saveState();
            renderSheetSelect();
            loadActiveSheet();
        }
    }
};

// ─── Tooltip Glowing-Glass de Fórmulas ───────────────────────────
window.showFormulaTooltip = function(event, colKey, empIdx) {
    event.stopPropagation();
    const info = COL_FORMULAS[colKey];
    if (!info) return;

    // Obtener valor calculado del empleado
    const sheet = proyecto_actual?.sheets?.[activeSheetIndex];
    const emp = sheet?.employees?.[empIdx];
    const computed = emp?._computed || {};
    const rawVal = computed[colKey];
    const displayVal = rawVal !== undefined
        ? (colKey === 'dias_trab' ? `${parseInt(rawVal)} días` : `$${parseFloat(rawVal).toFixed(2)}`)
        : '—';

    // Eliminar tooltip previo si existe
    const prev = document.getElementById('formula-tooltip');
    if (prev) prev.remove();

    // Construir tooltip
    const tip = document.createElement('div');
    tip.id = 'formula-tooltip';
    tip.innerHTML = `
        <div class="formula-tip-header">
            <span class="formula-tip-icon">${info.icon}</span>
            <span class="formula-tip-title">${info.title}</span>
            <button class="formula-tip-close" onclick="document.getElementById('formula-tooltip')?.remove()">✕</button>
        </div>
        <div class="formula-tip-result">
            <span class="formula-tip-result-label">Resultado</span>
            <span class="formula-tip-result-val">${displayVal}</span>
        </div>
        <div class="formula-tip-formula">
            <span class="formula-tip-label">📐 Fórmula</span>
            <code class="formula-tip-code">${info.formula.replace(/\n/g, '<br>')}</code>
        </div>
        ${info.note ? `<div class="formula-tip-note">${info.note.replace(/\n/g, '<br>')}</div>` : ''}
    `;

    document.body.appendChild(tip);

    // Posicionamiento inteligente respecto al click
    const rect = event.target.getBoundingClientRect();
    const tipW = 320, tipH = tip.offsetHeight || 220;
    let top = rect.bottom + window.scrollY + 8;
    let left = rect.left + window.scrollX - tipW / 2 + rect.width / 2;
    if (left + tipW > window.innerWidth - 16) left = window.innerWidth - tipW - 16;
    if (left < 8) left = 8;
    if (top + tipH > window.innerHeight + window.scrollY - 16) top = rect.top + window.scrollY - tipH - 8;
    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;

    // Animación de entrada
    requestAnimationFrame(() => tip.classList.add('visible'));

    // Cerrar al hacer click fuera o Escape
    const closeHandler = (e) => {
        if (!tip.contains(e.target) && e.target !== event.target) {
            tip.classList.remove('visible');
            setTimeout(() => tip.remove(), 200);
            document.removeEventListener('click', closeHandler);
            document.removeEventListener('keydown', escHandler);
        }
    };
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            tip.classList.remove('visible');
            setTimeout(() => tip.remove(), 200);
            document.removeEventListener('click', closeHandler);
            document.removeEventListener('keydown', escHandler);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', closeHandler);
        document.addEventListener('keydown', escHandler);
    }, 50);
};

// ─── Gestión de Empleados ─────────────────────────────────────────
window.addEmployeeRow = function() {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;
    if (!sheet.employees) sheet.employees = [];
    pushHistory();
    sheet.employees.push(createEmptyEmployee());
    calculateAndRenderPayroll();
    saveState();
    const tbody = document.getElementById('payroll-table-body');
    if (tbody && tbody.lastElementChild) {
        tbody.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};

window.deleteEmployeeRow = function(idx) {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;
    const emp = sheet.employees[idx];
    const empName = emp?.nombre?.trim() || `Empleado #${idx + 1}`;
    
    let modal = document.getElementById('confirm-delete-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'confirm-delete-modal';
        modal.style.cssText = 'display:none;';
        
        const closeModal = () => {
            modal.classList.add('closing');
            setTimeout(() => {
                modal.style.display = 'none';
                modal.classList.remove('closing');
            }, 300);
        };
        
        modal.innerHTML = `
            <div class="glass-modal max-w-sm w-full mx-4 relative" style="text-align:center;">
                <button id="confirm-delete-close-btn"
                    class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-transform hover:rotate-90">
                    <i class="fas fa-times text-lg"></i>
                </button>
                <div class="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4 mx-auto">
                    <i class="far fa-trash-alt text-rose-500 text-xl"></i>
                </div>
                <h4 class="text-lg font-black text-slate-800 mb-2">¿Eliminar fila?</h4>
                <p class="confirm-delete-msg text-sm text-slate-500 mb-6 leading-relaxed" id="confirm-delete-msg"></p>
                <div class="flex gap-3">
                    <button id="confirm-delete-cancel-btn"
                        class="flex-1 px-4 py-3 rounded-[36px] bg-slate-100 text-slate-500 font-bold text-xs uppercase hover:bg-slate-200 transition-colors">
                        Cancelar
                    </button>
                    <button id="confirm-delete-ok-btn"
                        class="glow-hover flex-1 px-4 py-3 rounded-[36px] bg-rose-500 text-white font-bold text-xs uppercase hover:bg-rose-600 transition-colors shadow-lg">
                        Sí, eliminar
                    </button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        
        document.getElementById('confirm-delete-close-btn').onclick = closeModal;
        document.getElementById('confirm-delete-cancel-btn').onclick = closeModal;
    }
    document.getElementById('confirm-delete-msg').textContent = `Se eliminará la fila de "${empName}". Puedes deshacer con Ctrl+Z.`;
    modal.style.display = 'flex';
    
    const box = modal.querySelector('.glass-modal');
    if (box) { box.style.animation = 'none'; requestAnimationFrame(() => { box.style.animation = ''; }); }
    
    const okBtn = document.getElementById('confirm-delete-ok-btn');
    okBtn.onclick = () => {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
        }, 300);
        pushHistory();
        sheet.employees.splice(idx, 1);
        calculateAndRenderPayroll();
        saveState();
    };
};

// ─── Actualización sin re-render completo ────────────────────────
// Para campos de texto / select / fecha: solo guarda el valor al perder foco
window.saveTextField = function(idx, field, value) {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet || !sheet.employees[idx]) return;
    pushHistory();
    sheet.employees[idx][field] = value;

    if (field === 'tipo_incap') {
        if (!value || value === '—') {
            sheet.employees[idx].dias_incap = 0;
        } else if ((parseFloat(sheet.employees[idx].dias_incap) || 0) <= 0) {
            sheet.employees[idx].dias_incap = value === 'Maternidad' ? 30 : 3;
        }
    }

    calculateEmployee(sheet.employees[idx], sheet);

    if (field === 'tipo_incap') {
        renderTableBody();
    } else {
        updateComputedCellsInRow(idx, sheet.employees[idx]);
    }

    updateDashboardTotals();
    updateRetentionView();
    saveState();
};

// Para campos numéricos: guarda, recalcula y actualiza solo las celdas
// calculadas de esa fila mediante IDs, sin tocar el DOM del resto
window.saveNumField = function(idx, field, value) {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet || !sheet.employees[idx]) return;
    pushHistory();
    sheet.employees[idx][field] = parseFloat(value) || 0;
    calculateEmployee(sheet.employees[idx], sheet);
    updateComputedCellsInRow(idx, sheet.employees[idx]);
    updateDashboardTotals();
    updateRetentionView();
    saveState();
};

// Actualiza solo los <span> de celdas calculadas en la fila indicada
function updateComputedCellsInRow(idx, emp) {
    const c = emp._computed || {};
    Object.keys(c).forEach(colKey => {
        if (colKey.startsWith('_')) return; // privadas (isssAfpLab, etc.)
        const el = document.getElementById(`cell-${idx}-${colKey}`);
        if (!el) return;
        if (colKey === 'dias_trab') {
            el.textContent = parseInt(c[colKey] || 0);
        } else {
            el.textContent = '$' + (c[colKey] || 0).toFixed(2);
        }
    });
}

// Recalcula y muestra los totales del dashboard sin re-renderizar nada
function updateDashboardTotals() {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;
    let totNet = 0, totDedLab = 0, totRenta = 0, totPatronal = 0;
    (sheet.employees || []).forEach(e => {
        const c = e._computed || {};
        totNet      += c.salario_neto   || 0;
        totDedLab   += c._isssAfpLab   || 0;
        totRenta    += c.renta          || 0;
        totPatronal += c._cargaPatronal || 0;
    });
    updateDashboardMetrics(totNet, totDedLab, totRenta, totPatronal);
}

// Compatibilidad: updateEmployeeField ya no se llama desde celdas pero se conserva
window.updateEmployeeField = function(idx, field, value) {
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet || !sheet.employees[idx]) return;
    const colDef = COL[field];
    if (colDef && colDef.type === 'number') {
        window.saveNumField(idx, field, value);
    } else {
        window.saveTextField(idx, field, value);
    }
};

// ─── Métricas Dashboard ───────────────────────────────────────────
function updateDashboardMetrics(totalNet, totalDed, totalRenta, totalPatronal) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = `$${val.toFixed(2)}`; };
    set('metric-total-net',       totalNet);
    set('metric-total-deductions', totalDed);
    set('metric-total-renta',     totalRenta);
    set('metric-total-patronal',  totalPatronal);
}

// ─── Cambio de Vista (Planilla / Tablas / Boletas / Préstamos) ────
let currentPlanillaTabIndex = 0;
let planillaTabSnapTimeout = null;
const PLANILLA_TABS = ['planilla', 'tablas', 'boletas'];

function movePlanillaTab(btn, newIndex, animate = true) {
    const pill = document.getElementById('planilla-tab-indicator');
    if (!pill || !btn) return;

    if (planillaTabSnapTimeout) {
        clearTimeout(planillaTabSnapTimeout);
        planillaTabSnapTimeout = null;
    }

    if (btn.offsetWidth === 0) {
        requestAnimationFrame(() => {
            if (btn.offsetWidth > 0) movePlanillaTab(btn, newIndex, animate);
        });
        return;
    }

    const distance = Math.abs(newIndex - currentPlanillaTabIndex);
    const stretch = (animate && distance > 0) ? (1 + Math.min(distance * 0.15, 0.35)) : 1;

    if (!animate) {
        pill.style.transition = 'none';
    }

    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.opacity = '1';

    if (animate && distance > 0) {
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(${stretch}) scaleY(0.9)`;
        planillaTabSnapTimeout = setTimeout(() => {
            pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(1) scaleY(1)`;
        }, 180);
    } else {
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(1) scaleY(1)`;
    }

    if (!animate) {
        void pill.offsetWidth;
        requestAnimationFrame(() => {
            pill.style.transition = '';
        });
    }

    currentPlanillaTabIndex = newIndex;
}
window.movePlanillaTab = movePlanillaTab;
window._movePlanillaTabIndicator = function(btn) {
    movePlanillaTab(btn, 0, false);
};

window.switchView = function(view) {
    _activeView = view;
    document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.planilla-tab-btn').forEach(t => t.classList.remove('active'));
    const panel = document.getElementById(`view-${view}`);
    const tab   = document.getElementById(`tab-${view}`);
    if (panel) panel.classList.remove('hidden');
    if (tab)   tab.classList.add('active');

    // Desplazamiento animado del indicador de pestañas con deformación elástica
    if (tab) {
        const idx = PLANILLA_TABS.indexOf(view);
        movePlanillaTab(tab, idx >= 0 ? idx : 0);
    }

    if (view === 'tablas') updateRetentionView();
    if (view === 'boletas' && typeof window.renderBoletaView === 'function') window.renderBoletaView();
};

window.addEventListener('resize', () => {
    const activeBtn = document.querySelector('.planilla-tab-btn.active');
    if (activeBtn) {
        const idx = PLANILLA_TABS.indexOf(_activeView || 'planilla');
        movePlanillaTab(activeBtn, idx >= 0 ? idx : 0, false);
    }
});

const syncPlanillaIndicator = () => {
    const activeBtn = document.querySelector('.planilla-tab-btn.active');
    if (activeBtn) {
        const idx = PLANILLA_TABS.indexOf(_activeView || 'planilla');
        movePlanillaTab(activeBtn, idx >= 0 ? idx : 0, false);
    }
};
syncPlanillaIndicator();
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncPlanillaIndicator);
}

// ─── Vista de Tablas de Retenciones ──────────────────────────────
function updateRetentionView() {
    if (_activeView !== 'tablas') return;
    const container = document.getElementById('retention-view-container');
    if (!container) return;
    const sheet = proyecto_actual?.sheets?.[activeSheetIndex];
    const emps  = (sheet?.employees || []).filter(e => e.nombre?.trim());

    const fmt  = v => `$${parseFloat(v||0).toFixed(2)}`;
    const pct  = (v, base) => base > 0 ? `${((v/base)*100).toFixed(1)}%` : '—';

    // ── Tablas de Referencia Oficiales (El Salvador) ─────────────
    const isssEscala = `
        <tr><td>$0.01 – $1,000.00 (Techo)</td><td class="highlight">3.00% (Máx. $30.00)</td><td>7.50% (Máx. $75.00)</td><td>Salarios ordinarios</td></tr>
        <tr><td>Excedente de $1,000.00</td><td>Exento ($0.00)</td><td>Exento ($0.00)</td><td>Límite máximo superado</td></tr>
        <tr><td>Maternidad e Incapacidades</td><td>Exento</td><td>Exento</td><td>Subsidios cubiertos por Seguro Social</td></tr>`;

    const afpEscala = `
        <tr><td>Cualquier ingreso (Sin Techo)</td><td class="highlight">7.25%</td><td>8.75% (Aporte total 16%)</td><td>Desde reforma previsional 2023</td></tr>
        <tr><td>Subsidio por Maternidad</td><td>7.25% (retenido por ISSS)</td><td style="color:#ef4444;font-weight:700">8.75% (pagado por Patrono)</td><td>Obligatorio sobre subsidio por ley</td></tr>`;

    const rentaEscala = `
        <tr><td>$0.01 – $550.00</td><td>$0.00</td><td>0% (Exento)</td><td>Tramo I (MH Decreto No. 10)</td></tr>
        <tr><td>$550.01 – $895.24</td><td>$17.67</td><td>10%</td><td>Tramo II (MH Decreto No. 10) sobre exceso de $550.00</td></tr>
        <tr><td>$895.25 – $2,038.10</td><td>$60.00</td><td>20%</td><td>Tramo III (MH Decreto No. 10) sobre exceso de $895.24</td></tr>
        <tr><td>Más de $2,038.10</td><td>$288.57</td><td>30%</td><td>Tramo IV (MH Decreto No. 10) sobre exceso de $2,038.10</td></tr>`;

    let resumenHTML = '';
    let cargaPatronalHTML = '';

    if (!emps.length) {
        resumenHTML = '';
        cargaPatronalHTML = '';
    } else {
        // ── Tabla 1: Resumen General ─────────────────────────────────
        let rowsGeneral = emps.map(e => {
            const c = e._computed || {};
            return `<tr>
                <td>${escapeHtml(e.nombre)}</td>
                <td class="highlight">${fmt(c.total_devengado)}</td>
                <td class="deduction">${fmt(c.isss_lab)}</td>
                <td class="deduction">${fmt(c.afp_lab)}</td>
                <td class="deduction">${fmt(c.renta)}</td>
                <td class="deduction">${fmt(c.total_deducciones)}</td>
                <td style="color:#6366f1;font-weight:900">${fmt(c.salario_neto)}</td>
            </tr>`;
        }).join('');

        const totDev  = emps.reduce((s,e) => s+(e._computed?.total_devengado||0), 0);
        const totIsss = emps.reduce((s,e) => s+(e._computed?.isss_lab||0), 0);
        const totAfp  = emps.reduce((s,e) => s+(e._computed?.afp_lab||0), 0);
        const totRent = emps.reduce((s,e) => s+(e._computed?.renta||0), 0);
        const totDed  = emps.reduce((s,e) => s+(e._computed?.total_deducciones||0), 0);
        const totNet  = emps.reduce((s,e) => s+(e._computed?.salario_neto||0), 0);

        resumenHTML = `
            <div class="ret-card mb-6">
                <div class="ret-card-header" style="display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid #f1f5f9;">
                    <div style="width:36px;height:36px;border-radius:10px;background:#eef2ff;display:flex;align-items:center;justify-content:center;color:#6366f1;font-size:16px;shrink:0">
                        <i class="fas fa-table"></i>
                    </div>
                    <div>
                        <p class="ret-title-lg">Resumen de Deducciones Laborales</p>
                        <p style="font-size:10px;color:#94a3b8;font-weight:600;margin:2px 0 0;text-transform:uppercase;letter-spacing:.05em">Período activo · ${emps.length} empleado(s)</p>
                    </div>
                </div>
                <div style="overflow-x:auto;">
                    <table class="ret-table">
                        <thead><tr>
                            <th>Empleado</th><th>Total Devengado</th><th>ISSS (3%)</th>
                            <th>AFP (7.25%)</th><th>Renta (MH)</th><th>Total Ded.</th><th>Salario Neto</th>
                        </tr></thead>
                        <tbody>
                            ${rowsGeneral}
                            <tr class="ret-total-row">
                                <td>TOTALES</td>
                                <td class="highlight">${fmt(totDev)}</td>
                                <td class="deduction">${fmt(totIsss)}</td>
                                <td class="deduction">${fmt(totAfp)}</td>
                                <td class="deduction">${fmt(totRent)}</td>
                                <td class="deduction">${fmt(totDed)}</td>
                                <td style="color:#6366f1;font-weight:900">${fmt(totNet)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>`;

        // ── Tabla 2: Carga Patronal ──────────────────────────────────
        let rowsPatronal = emps.map(e => {
            const c = e._computed || {};
            const dev = c.total_devengado || 0;
            return `<tr>
                <td>${escapeHtml(e.nombre)}</td>
                <td class="highlight">${fmt(dev)}</td>
                <td>${fmt(c.isss_patronal)} <span style="color:#94a3b8;font-weight:500">(7.5%)</span></td>
                <td>${fmt(c.afp_patronal)} <span style="color:#94a3b8;font-weight:500">(8.75%)</span></td>
                <td style="color:#f59e0b;font-weight:800">${fmt((c.isss_patronal||0)+(c.afp_patronal||0))}</td>
                <td style="color:#64748b;font-weight:700">${pct((c.isss_patronal||0)+(c.afp_patronal||0), dev)}</td>
            </tr>`;
        }).join('');

        const totIsssPat = emps.reduce((s,e) => s+(e._computed?.isss_patronal||0), 0);
        const totAfpPat  = emps.reduce((s,e) => s+(e._computed?.afp_patronal||0), 0);

        cargaPatronalHTML = `
            <div class="ret-card mb-6">
                <div class="ret-card-header" style="display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid #f1f5f9;">
                    <div style="width:36px;height:36px;border-radius:10px;background:#fefce8;display:flex;align-items:center;justify-content:center;color:#f59e0b;font-size:16px;">
                        <i class="fas fa-building"></i>
                    </div>
                    <div>
                        <p class="ret-title-lg">Carga Patronal</p>
                        <p style="font-size:10px;color:#94a3b8;font-weight:600;margin:2px 0 0;text-transform:uppercase;letter-spacing:.05em">ISSS 7.5% + AFP 8.75% · No se deduce del salario</p>
                    </div>
                </div>
                <div style="overflow-x:auto;">
                    <table class="ret-table">
                        <thead><tr>
                            <th>Empleado</th><th>Base (Devengado)</th><th>ISSS Patronal</th>
                            <th>AFP Patronal</th><th>Total Carga</th><th>% del Salario</th>
                        </tr></thead>
                        <tbody>
                            ${rowsPatronal}
                            <tr class="ret-total-row">
                                <td>TOTALES</td><td class="highlight">${fmt(totDev)}</td>
                                <td>${fmt(totIsssPat)}</td><td>${fmt(totAfpPat)}</td>
                                <td style="color:#f59e0b;font-weight:900">${fmt(totIsssPat+totAfpPat)}</td>
                                <td style="color:#64748b">${pct(totIsssPat+totAfpPat, totDev)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    container.innerHTML = `
        <!-- Tabla 1: Resumen -->
        ${resumenHTML}

        <!-- Tabla 2: Carga Patronal -->
        ${cargaPatronalHTML}

        <div style="max-width: 800px; margin: 0 auto; width: 100%;">
            ${emps.length ? `
            <div style="margin: 24px 0 12px; padding-bottom: 8px;" class="ret-divider">
                <p class="ret-section-title">
                    <i class="fas fa-info-circle text-indigo-500"></i> Tablas de Referencia Oficiales (Ley El Salvador)
                </p>
            </div>
            ` : `
            <div style="margin: 0 0 16px; padding-bottom: 12px;" class="ret-divider">
                <p class="ret-section-title" style="justify-content: center;">
                    <i class="fas fa-info-circle text-indigo-500"></i> Tablas de Referencia Oficiales (Ley El Salvador)
                </p>
            </div>
            `}

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-bottom: 24px;">
                <!-- Tabla Referencia ISSS -->
                <div class="ret-card">
                    <div class="ret-card-header" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #f1f5f9;">
                        <div style="width:28px;height:28px;border-radius:8px;background:#e0f2fe;display:flex;align-items:center;justify-content:center;color:#0369a1;font-size:14px;">
                            <i class="fas fa-hospital"></i>
                        </div>
                        <p class="ret-title">ISSS Seguro Social</p>
                    </div>
                    <div style="overflow-x:auto;">
                        <table class="ret-table" style="font-size:11px;">
                            <thead><tr>
                                <th>Rango Salario</th><th>Trabajador</th><th>Patrono</th><th>Aplicación</th>
                            </tr></thead>
                            <tbody>${isssEscala}</tbody>
                        </table>
                    </div>
                </div>

                <!-- Tabla Referencia AFP -->
                <div class="ret-card">
                    <div class="ret-card-header" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #f1f5f9;">
                        <div style="width:28px;height:28px;border-radius:8px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;color:#15803d;font-size:14px;">
                            <i class="fas fa-wallet"></i>
                        </div>
                        <p class="ret-title">AFP Previsión Pensiones</p>
                    </div>
                    <div style="overflow-x:auto;">
                        <table class="ret-table" style="font-size:11px;">
                            <thead><tr>
                                <th>Rango Salario</th><th>Trabajador</th><th>Patrono</th><th>Notas de Ley</th>
                            </tr></thead>
                            <tbody>${afpEscala}</tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Tabla 3: Escala de Renta de referencia -->
            <div class="ret-card">
                <div class="ret-card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 20px;border-bottom:1px solid #f1f5f9;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:36px;height:36px;border-radius:10px;background:#fef2f2;display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:16px;">
                            <i class="fas fa-landmark"></i>
                        </div>
                        <div>
                            <p class="ret-title-lg">Tabla de Retención de Renta/ISR — MH El Salvador</p>
                            <p id="renta-exenta-label" style="font-size:10px;color:#94a3b8;font-weight:600;margin:2px 0 0;text-transform:uppercase;letter-spacing:.05em">Decreto Ejecutivo No. 10 (MH) · Base Exenta: $550.00</p>
                        </div>
                    </div>
                    <!-- Selector de Período Renta -->
                    <div class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-full" style="gap:4px;">
                        <button onclick="changeRentaPeriod('mensual')" id="btn-renta-mensual" class="renta-tab-btn">Mensual</button>
                        <button onclick="changeRentaPeriod('quincenal')" id="btn-renta-quincenal" class="renta-tab-btn">Quincenal</button>
                        <button onclick="changeRentaPeriod('semanal')" id="btn-renta-semanal" class="renta-tab-btn">Semanal</button>
                        <button onclick="changeRentaPeriod('diaria')" id="btn-renta-diaria" class="renta-tab-btn">Diaria</button>
                    </div>
                </div>
                <div style="overflow-x:auto;">
                    <table class="ret-table">
                        <thead><tr>
                            <th>Rango de Renta Gravada</th><th>Cuota Fija</th><th>Tasa</th><th>Aplicado sobre</th>
                        </tr></thead>
                        <tbody id="renta-table-body">
                            <!-- Renderizado dinámicamente -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;

    // Inicializar el período de la tabla de renta
    changeRentaPeriod(window._activeRentaPeriod || 'mensual');
}

window._activeRentaPeriod = window._activeRentaPeriod || 'mensual';

window.changeRentaPeriod = function(period) {
    window._activeRentaPeriod = period;
    
    // Update active tab styles
    ['mensual', 'quincenal', 'semanal', 'diaria'].forEach(p => {
        const btn = document.getElementById(`btn-renta-${p}`);
        if (btn) {
            btn.classList.toggle('active-renta-tab', p === period);
        }
    });

    const tbody = document.getElementById('renta-table-body');
    const label = document.getElementById('renta-exenta-label');
    if (!tbody || !label) return;

    let rowsHTML = '';
    let exentaText = '';

    if (period === 'mensual') {
        exentaText = 'Decreto Ejecutivo No. 10 (MH) · Base Exenta: $550.00';
        rowsHTML = `
            <tr><td>$0.01 – $550.00</td><td>$0.00</td><td>0% (Exento)</td><td>Tramo I (MH Decreto No. 10)</td></tr>
            <tr><td>$550.01 – $895.24</td><td>$17.67</td><td>10%</td><td>Tramo II (MH Decreto No. 10) sobre exceso de $550.00</td></tr>
            <tr><td>$895.25 – $2,038.10</td><td>$60.00</td><td>20%</td><td>Tramo III (MH Decreto No. 10) sobre exceso de $895.24</td></tr>
            <tr><td>Más de $2,038.10</td><td>$288.57</td><td>30%</td><td>Tramo IV (MH Decreto No. 10) sobre exceso de $2,038.10</td></tr>`;
    } else if (period === 'quincenal') {
        exentaText = 'Decreto Ejecutivo No. 10 (MH) · Base Exenta: $275.00';
        rowsHTML = `
            <tr><td>$0.01 – $275.00</td><td>$0.00</td><td>0% (Exento)</td><td>Tramo I (MH Decreto No. 10)</td></tr>
            <tr><td>$275.01 – $447.62</td><td>$8.83</td><td>10%</td><td>Tramo II (MH Decreto No. 10) sobre exceso de $275.00</td></tr>
            <tr><td>$447.63 – $1,019.05</td><td>$30.00</td><td>20%</td><td>Tramo III (MH Decreto No. 10) sobre exceso de $447.62</td></tr>
            <tr><td>Más de $1,019.05</td><td>$144.28</td><td>30%</td><td>Tramo IV (MH Decreto No. 10) sobre exceso de $1,019.05</td></tr>`;
    } else if (period === 'semanal') {
        exentaText = 'Decreto Ejecutivo No. 10 (MH) · Base Exenta: $137.50';
        rowsHTML = `
            <tr><td>$0.01 – $137.50</td><td>$0.00</td><td>0% (Exento)</td><td>Tramo I (MH Decreto No. 10)</td></tr>
            <tr><td>$137.51 – $223.81</td><td>$4.42</td><td>10%</td><td>Tramo II (MH Decreto No. 10) sobre exceso de $137.50</td></tr>
            <tr><td>$223.82 – $509.52</td><td>$15.00</td><td>20%</td><td>Tramo III (MH Decreto No. 10) sobre exceso de $223.81</td></tr>
            <tr><td>Más de $509.52</td><td>$72.14</td><td>30%</td><td>Tramo IV (MH Decreto No. 10) sobre exceso de $509.52</td></tr>`;
    } else if (period === 'diaria') {
        exentaText = 'Decreto Ejecutivo No. 10 (MH) · Base Exenta: $18.33';
        rowsHTML = `
            <tr><td>$0.01 – $18.33</td><td>$0.00</td><td>0% (Exento)</td><td>Tramo I (MH Decreto No. 10)</td></tr>
            <tr><td>$18.34 – $29.84</td><td>$0.59</td><td>10%</td><td>Tramo II (MH Decreto No. 10) sobre exceso de $18.33</td></tr>
            <tr><td>$29.85 – $67.94</td><td>$2.00</td><td>20%</td><td>Tramo III (MH Decreto No. 10) sobre exceso de $29.84</td></tr>
            <tr><td>Más de $67.94</td><td>$9.62</td><td>30%</td><td>Tramo IV (MH Decreto No. 10) sobre exceso de $67.94</td></tr>`;
    }

    tbody.innerHTML = rowsHTML;
    label.textContent = exentaText;
};

// ─── Sincronización y Estado de Red ───────────────────────────────
window.setupTitlePillAnimation = function () {
    const titleEl = document.getElementById('current-project-name');
    if (!titleEl) return;
    const titlePill = titleEl.closest('.project-card');
    if (!titlePill) return;
    // Solo escuchar el elemento del título del proyecto, NO los títulos de hojas
    titleEl.addEventListener('focusin', () => titlePill.classList.add('border-active'));
    titleEl.addEventListener('focusout', () => titlePill.classList.remove('border-active'));
}

window.updateCurrentProjectName = function (el) {
    if (window.isAuditMode) return;
    if (proyecto_actual) {
        const newName = el.innerText.trim();
        if (newName) {
            proyecto_actual.name = newName;
            saveState();
            
            // Sincronizar UI de nombres
            const nameEl = document.getElementById('current-project-name');
            const mobName = document.getElementById('mobile-project-name');
            if (nameEl) nameEl.innerText = newName;
            if (mobName) mobName.innerText = newName;
        } else {
            el.innerText = proyecto_actual.name || 'Sin Nombre';
        }
    }
}

window.getSyncPill = function () {
    if (!window._syncPill) window._syncPill = document.getElementById('cloud-indicator')?.closest('.glass-pill');
    return window._syncPill;
}

window.setSyncAnimating = function (active) {
    const pill = window.getSyncPill();
    if (pill) pill.classList.toggle('border-active', active);
}

window.updateSyncUI = function(state) {
    const cloudInd = document.getElementById('cloud-indicator');
    const cloudIndMobile = document.getElementById('cloud-indicator-mobile');

    const inds = [cloudInd, cloudIndMobile];
    
    // Si no hay internet, forzar estado offline inmediatamente
    if (!navigator.onLine && state !== 'offline') {
        state = 'offline';
    }

    inds.forEach(el => {
        if (!el) return;
        el.classList.remove('synced', 'error', 'syncing-pulse', 'animate-pulse');
        const icon = el.querySelector('i');
        if (icon) {
            icon.classList.remove('sync-spin', 'fa-spin', 'fa-rotate', 'fa-sync-alt');
        }
    });

    if (state === 'syncing') {
        inds.forEach(el => {
            if (!el) return;
            el.classList.add('syncing-pulse');
            const span = el.querySelector('span'); if (span) span.innerText = 'SINCRONIZANDO';
            const icon = el.querySelector('i'); if (icon) { icon.className = 'fas fa-sync-alt sync-spin'; }
        });
    } else if (state === 'success' || state === 'online') {
        inds.forEach(el => {
            if (!el) return;
            el.classList.add('synced');
            const span = el.querySelector('span'); if (span) span.innerText = 'SINCRONIZADO';
            const icon = el.querySelector('i'); if (icon) icon.className = 'fas fa-cloud-check';
        });
    } else if (state === 'offline' || state === 'error') {
        inds.forEach(el => {
            if (!el) return;
            el.classList.add('error');
            const span = el.querySelector('span'); 
            if (span) {
                if (state === 'error' && window.lastSyncError) {
                    // Truncate to avoid visual overflow if it's too long
                    const displayMsg = window.lastSyncError.length > 25 ? window.lastSyncError.substring(0, 22) + '...' : window.lastSyncError;
                    span.innerText = displayMsg.toUpperCase();
                } else {
                    span.innerText = 'OFFLINE';
                }
            }
            const icon = el.querySelector('i');
            if (icon) {
                icon.className = (state === 'error') ? 'fas fa-exclamation-triangle' : 'fas fa-wifi-slash';
            }
        });
    } else if (state === 'local') {
        inds.forEach(el => {
            if (!el) return;
            const span = el.querySelector('span'); if (span) span.innerText = 'SOLO LOCAL';
            const icon = el.querySelector('i'); if (icon) icon.className = 'fas fa-hdd';
        });
    } else {
        inds.forEach(el => {
            if (!el) return;
            const span = el.querySelector('span'); if (span) span.innerText = 'PENDIENTE';
            const icon = el.querySelector('i'); if (icon) icon.className = 'fas fa-cloud-upload';
        });
    }
}

// Listeners de conectividad global
window.addEventListener('online', () => {
    window.updateSyncUI('online');
    if (typeof window.showSyncToast === 'function') window.showSyncToast('online');
    // Al recuperar conexión, intentar sincronizar inmediatamente si hay proyecto
    setTimeout(() => { if (typeof saveState === 'function') saveState(); }, 1000);
});
window.addEventListener('offline', () => {
    window.updateSyncUI('offline');
    if (typeof window.showSyncToast === 'function') window.showSyncToast('offline');
});

// Atajo de teclado para Guardar Manual (Ctrl+S / Cmd+S)
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (typeof window.forceSave === 'function') window.forceSave(false);
    }
});

// ─── Persistencia ────────────────────────────────────────────────
let _syncDebounce = null;

async function triggerSupabaseSync(isManual = false) {
    if (typeof supabaseClient === 'undefined' || !proyecto_actual) {
        if (isManual && typeof window.showSyncToast === 'function') {
            window.showSyncToast('local', 'Guardado en este equipo');
        }
        return;
    }

    if (!navigator.onLine) {
        window.updateSyncUI('offline');
        if (isManual && typeof window.showSyncToast === 'function') {
            window.showSyncToast('offline');
        }
        return;
    }

    try {
        const { data: { session } } = await supabaseClient.auth.getSession().catch(() => ({ data: { session: null } }));
        if (session && typeof syncCurrentProjectWithSupabase === 'function') {
            window.updateSyncUI('syncing');
            if (typeof window.setSyncAnimating === 'function') window.setSyncAnimating(true);

            await syncCurrentProjectWithSupabase(proyecto_actual, session.user.id, true);

            const syncedIds = new Set(JSON.parse(localStorage.getItem('educonta_synced_ids')) || []);
            syncedIds.add(proyecto_actual.id);
            localStorage.setItem('educonta_synced_ids', JSON.stringify(Array.from(syncedIds)));

            window.updateSyncUI('success');
            if (isManual && typeof window.showSyncToast === 'function') {
                window.showSyncToast('success', 'Planilla respaldada con éxito');
            }
        } else {
            // Sin sesión en la nube, confirmar guardado local
            window.updateSyncUI('local');
            if (isManual && typeof window.showSyncToast === 'function') {
                window.showSyncToast('local', 'Planilla guardada en este equipo');
            }
        }
    } catch (err) {
        console.error('Sync error:', err);
        window.lastSyncError = err.message || String(err);
        window.updateSyncUI('error');
        if (isManual && typeof window.showSyncToast === 'function') {
            window.showSyncToast('error', window.lastSyncError);
        }
    } finally {
        setTimeout(() => {
            if (typeof window.setSyncAnimating === 'function') window.setSyncAnimating(false);
        }, 1000);
    }
}

window.forceSave = async function(quiet = false) {
    if (window.isAuditMode) return;
    if (!proyecto_actual) return;
    if (_syncDebounce) clearTimeout(_syncDebounce);
    proyecto_actual.updatedAt = new Date().toISOString();
    const idx = projects.findIndex(p => p.id === proyecto_actual.id);
    if (idx !== -1) projects[idx] = proyecto_actual;
    else projects.unshift(proyecto_actual);
    localStorage.setItem('educonta_projects_planillas', JSON.stringify(projects));

    const saveIndicator = document.getElementById('save-indicator');
    const saveIndicatorMobile = document.getElementById('save-indicator-mobile');
    if (saveIndicator) {
        saveIndicator.classList.add('synced');
        saveIndicator.innerHTML = '<i class="fas fa-check-circle"></i><span>LOCAL</span>';
    }
    if (saveIndicatorMobile) {
        saveIndicatorMobile.classList.add('synced');
        saveIndicatorMobile.innerHTML = '<i class="fas fa-check-circle"></i><span>LOCAL</span>';
    }

    await triggerSupabaseSync(!quiet);
};

async function saveState() {
    if (window.isAuditMode) return;
    if (!proyecto_actual) return;
    proyecto_actual.updatedAt = new Date().toISOString();
    const idx = projects.findIndex(p => p.id === proyecto_actual.id);
    if (idx !== -1) projects[idx] = proyecto_actual;
    else projects.unshift(proyecto_actual);
    localStorage.setItem('educonta_projects_planillas', JSON.stringify(projects));

    // Indicador local guardado
    const saveIndicator = document.getElementById('save-indicator');
    const saveIndicatorMobile = document.getElementById('save-indicator-mobile');
    if (saveIndicator) {
        saveIndicator.classList.add('synced');
        saveIndicator.innerHTML = '<i class="fas fa-check-circle"></i><span>LOCAL</span>';
    }
    if (saveIndicatorMobile) {
        saveIndicatorMobile.classList.add('synced');
        saveIndicatorMobile.innerHTML = '<i class="fas fa-check-circle"></i><span>LOCAL</span>';
    }

    // Gatillar sincronización con debounce de 3s para evitar saturar la red
    if (_syncDebounce) clearTimeout(_syncDebounce);
    _syncDebounce = setTimeout(() => {
        triggerSupabaseSync();
    }, 3000);
}

// ─── Acciones ────────────────────────────────────────────────────
window.closeProject = function() { window.location.href = 'proyectos.html'; };

window.exportarProyectoEduConta = function() {
    if (!proyecto_actual) {
        if (typeof window.showAlert === 'function') {
            window.showAlert('Error', 'No hay proyecto activo.');
        } else {
            alert('No hay proyecto activo.');
        }
        return;
    }
    const nombre = proyecto_actual.name || 'Proyecto_Planilla';
    const paquete = {
        identificador_app: 'EDUCONTA_SV_OFFICIAL', version_formato: '1.2',
        metadata: { nombre, fecha: new Date().toISOString(), catalogo: 'MAESTRO', sector: 'ALL' },
        cuerpo_contable: proyecto_actual,
    };
    const blindar = str => {
        const key = 'EDC_SHIELD_2024';
        let out = '';
        for (let i = 0; i < str.length; i++) out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        return btoa(unescape(encodeURIComponent(out)));
    };
    const blob = new Blob([blindar(JSON.stringify(paquete))], { type: 'application/octet-stream' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${nombre.replace(/\s+/g,'_')}_Planilla_${new Date().toISOString().split('T')[0]}.edc`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    const toast = document.getElementById('sync-toast');
    if (toast) {
        toast.querySelector('h4').textContent = 'Planilla Exportada';
        toast.style.background = '#6366f1'; toast.style.borderColor = '#818cf8';
        toast.classList.remove('translate-y-32', 'opacity-0');
        setTimeout(() => toast.classList.add('translate-y-32', 'opacity-0'), 3000);
    }
};

window.exportarExcelPlanilla = function() {
    if (!proyecto_actual) {
        if (typeof window.showAlert === 'function') {
            window.showAlert('Error', 'No hay proyecto activo.');
        } else {
            alert('No hay proyecto activo.');
        }
        return;
    }
    const sheet = proyecto_actual.sheets[activeSheetIndex];
    if (!sheet) return;
    
    const activeCols = getActiveCols();
    const emps = sheet.employees || [];
    
    // Build HTML Table structure for Excel
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${escapeHtml(sheet.name)}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>`;
    html += `<table border="1">`;
    
    // Header Row 1: Sections
    html += `<tr>`;
    const spans = [];
    activeCols.forEach(col => {
        if (!spans.length || spans[spans.length - 1].sectionId !== col.sectionId) {
            spans.push({ sectionId: col.sectionId, span: 1 });
        } else {
            spans[spans.length - 1].span++;
        }
    });
    spans.forEach(({ sectionId, span }) => {
        const sec = SECTIONS.find(s => s.id === sectionId);
        html += `<th colspan="${span}" style="background-color: #4f46e5; color: #ffffff; font-weight: bold;">${sec.label}</th>`;
    });
    html += `</tr>`;
    
    // Header Row 2: Columns
    html += `<tr>`;
    activeCols.forEach(({ colKey }) => {
        const colDef = COL[colKey];
        html += `<th style="background-color: #1e293b; color: #ffffff; font-weight: bold;">${colDef.label.replace(/<br>/g, ' ')}</th>`;
    });
    html += `</tr>`;
    
    // Data Rows
    emps.forEach(e => {
        html += `<tr>`;
        activeCols.forEach(({ colKey }) => {
            const isName = colKey === 'nombre';
            const isCode = colKey === 'codigo';
            const isSex = colKey === 'sexo';
            const isCargo = colKey === 'cargo';
            const isDepto = colKey === 'departamento';
            const isTipoIncap = colKey === 'tipo_incap';
            const isFirma = colKey === 'firma';
            
            let val = '';
            if (isName || isCode || isSex || isCargo || isDepto || isTipoIncap || isFirma) {
                val = e[colKey] || '';
            } else {
                const comp = e._computed || {};
                val = comp[colKey] !== undefined ? comp[colKey] : (e[colKey] || 0);
            }
            
            if (typeof val === 'number') {
                html += `<td style="text-align: right;">${val.toFixed(2)}</td>`;
            } else {
                html += `<td>${escapeHtml(val)}</td>`;
            }
        });
        html += `</tr>`;
    });
    
    html += `</table></body></html>`;
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${proyecto_actual.name.replace(/\s+/g, '_')}_Planilla_${sheet.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

// ─── Inicialización ───────────────────────────────────────────────
window.initializePlanillasPage = async function () {
    try {
        if (typeof injectSharedUI === 'function') {
            const targetId = document.getElementById('shared-components-root') ? 'shared-components-root' : 'shared-header';
            injectSharedUI(targetId);
        }
    } catch (e) {}

    const raw = localStorage.getItem('educonta_projects_planillas');
    const lastId = localStorage.getItem('educonta_last_project_id');
    if (raw) projects = JSON.parse(raw);
    if (projects.length) {
        proyecto_actual = projects.find(p => String(p.id) === String(lastId)) || projects[0];
    }

    if (!proyecto_actual) { window.location.href = 'proyectos.html'; return; }

    // Si no tiene hojas, crear una limpia con el mes actual
    if (!proyecto_actual.sheets || proyecto_actual.sheets.length === 0) {
        const now = new Date();
        const mes = now.toLocaleString('es-SV', { month: 'long' });
        const anio = now.getFullYear();
        const nombre = mes.charAt(0).toUpperCase() + mes.slice(1) + ' ' + anio;
        proyecto_actual.sheets = [{
            name: nombre,
            date: now.toISOString().split('T')[0],
            employees: [createEmptyEmployee()],
            sectionConfig: getDefaultSectionConfig(),
        }];
    }

    const nameEl  = document.getElementById('current-project-name');
    const mobName = document.getElementById('mobile-project-name');
    if (nameEl) nameEl.innerText  = proyecto_actual.name || 'Sin Nombre';
    if (mobName) mobName.innerText = proyecto_actual.name || 'Sin Nombre';

    if (typeof window.setupTitlePillAnimation === 'function') {
        window.setupTitlePillAnimation();
    }

    activeSheetIndex = 0;
    if (typeof initCustomControls === 'function') initCustomControls();
    renderSheetSelect();
    loadActiveSheet();
    if (typeof window.setPlanillaMode === 'function') window.setPlanillaMode('practica');

    if (window.isAuditMode) {
        document.querySelectorAll('[contenteditable="true"]').forEach(el => {
            el.setAttribute('contenteditable', 'false');
        });
        document.querySelectorAll('[onclick*="addEmployeeRow"], [onclick*="openNewSheetModal"], [onclick*="confirmDeleteSheet"], #btn-undo, #btn-redo, #custom-date-btn').forEach(btn => {
            if (btn.id === 'custom-date-btn') {
                btn.disabled = true;
                btn.classList.add('pointer-events-none', 'opacity-70');
            } else {
                btn.style.display = 'none';
            }
        });
    }

    // Inicializar gota del indicador de tab
    setTimeout(() => {
        const activeBtn = document.getElementById('tab-planilla');
        if (activeBtn && typeof movePlanillaTab === 'function') {
            movePlanillaTab(activeBtn, 0, false);
        }
    }, 80);

    // Verificar estado de sincronización en Nube para mostrar la píldora
    if (proyecto_actual) {
        const syncedIds = new Set(JSON.parse(localStorage.getItem('educonta_synced_ids')) || []);
        if (syncedIds.has(proyecto_actual.id)) {
            window.updateSyncUI('success');
        } else {
            window.updateSyncUI('idle');
        }
    }

    // Sincronizar en segundo plano al cargar si estamos online y con sesión activa
    setTimeout(async () => {
        if (!window.isAuditMode && navigator.onLine && typeof supabaseClient !== 'undefined') {
            const { data: { session } } = await supabaseClient.auth.getSession().catch(() => ({ data: { session: null } }));
            if (session) {
                await saveState().catch(e => console.error("Sincronización inicial falló:", e));
            }
        }
    }, 800);

    // Escuchar cambios de autenticación para sincronizar automáticamente al iniciar sesión
    if (typeof supabaseClient !== 'undefined') {
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                setTimeout(() => { if (typeof saveState === 'function') saveState(); }, 500);
            } else if (event === 'SIGNED_OUT') {
                window.updateSyncUI('idle');
            }
        });
    }

    // Desvanecer preloader suavemente una vez que los empleados y la nómina estén cargados
    if (typeof window.dismissGlobalPreloader === 'function') {
        window.dismissGlobalPreloader();
    }
};

// ─── Calendario e Interacción Personalizada de Fecha ───────────────────
let calSelectedYear = new Date().getFullYear();
let calSelectedMonth = new Date().getMonth(); // 0-11

const MONTH_NAMES_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function syncCustomCalendar(dateStr) {
    if (!dateStr) return;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        calSelectedYear = parseInt(parts[0]);
        calSelectedMonth = parseInt(parts[1]) - 1;
        renderCustomCalendar();
    }
}

function renderCustomCalendar() {
    const monthYearSpan = document.getElementById('cal-month-year');
    const daysGrid = document.getElementById('cal-days-grid');
    if (!monthYearSpan || !daysGrid) return;

    monthYearSpan.textContent = `${MONTH_NAMES_ES[calSelectedMonth]} ${calSelectedYear}`;
    daysGrid.innerHTML = '';

    const firstDayIndex = new Date(calSelectedYear, calSelectedMonth, 1).getDay();
    const totalDays = new Date(calSelectedYear, calSelectedMonth + 1, 0).getDate();
    const prevTotalDays = new Date(calSelectedYear, calSelectedMonth, 0).getDate();

    for (let i = firstDayIndex; i > 0; i--) {
        const cell = document.createElement('div');
        cell.className = 'cal-day-cell empty';
        cell.textContent = prevTotalDays - i + 1;
        daysGrid.appendChild(cell);
    }

    const activeSheetDate = proyecto_actual?.sheets?.[activeSheetIndex]?.date || '';
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day-cell';
        cell.textContent = day;

        const padMonth = String(calSelectedMonth + 1).padStart(2, '0');
        const padDay = String(day).padStart(2, '0');
        const dateVal = `${calSelectedYear}-${padMonth}-${padDay}`;

        if (dateVal === activeSheetDate) {
            cell.classList.add('selected');
        }
        if (dateVal === todayStr) {
            cell.classList.add('today');
        }

        cell.onclick = () => {
            if (window.isAuditMode) return;
            const dateInput = document.getElementById('payroll-sheet-date');
            if (dateInput) {
                dateInput.value = dateVal;
                updateSheetDate(dateVal);
                
                const display = document.getElementById('custom-date-display');
                if (display) display.textContent = `${padDay}/${padMonth}/${calSelectedYear}`;
            }
            const popup = document.getElementById('custom-calendar-popup');
            if (popup) popup.classList.remove('show');
            renderCustomCalendar();
        };

        daysGrid.appendChild(cell);
    }
}

let customControlsInitialized = false;
function initCustomControls() {
    if (customControlsInitialized) return;
    customControlsInitialized = true;

    const dropdownBtn = document.getElementById('custom-period-dropdown-btn');
    const dropdownMenu = document.getElementById('custom-period-dropdown-menu');
    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.onclick = (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
            const calPopup = document.getElementById('custom-calendar-popup');
            if (calPopup) calPopup.classList.remove('show');
        };
    }

    const dateBtn = document.getElementById('custom-date-btn');
    const calPopup = document.getElementById('custom-calendar-popup');
    if (dateBtn && calPopup) {
        dateBtn.onclick = (e) => {
            if (window.isAuditMode) return;
            e.stopPropagation();
            calPopup.classList.toggle('show');
            if (dropdownMenu) dropdownMenu.classList.remove('show');
            renderCustomCalendar();
        };
    }

    const prevBtn = document.getElementById('cal-prev-btn');
    const nextBtn = document.getElementById('cal-next-btn');
    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            calSelectedMonth--;
            if (calSelectedMonth < 0) {
                calSelectedMonth = 11;
                calSelectedYear--;
            }
            renderCustomCalendar();
        };
    }
    if (nextBtn) {
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            calSelectedMonth++;
            if (calSelectedMonth > 11) {
                calSelectedMonth = 0;
                calSelectedYear++;
            }
            renderCustomCalendar();
        };
    }

    document.addEventListener('click', (e) => {
        if (dropdownMenu && !dropdownMenu.contains(e.target) && dropdownBtn && !dropdownBtn.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
        if (calPopup && !calPopup.contains(e.target) && dateBtn && !dateBtn.contains(e.target)) {
            calPopup.classList.remove('show');
        }
    });
}

// Carga segura e inmediata de la página según el estado de carga del documento
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initializePlanillasPage);
} else {
    window.initializePlanillasPage();
}

// =========================================================================
// MÓDULO LABORAL Y MATEMÁTICA FINANCIERA (BTVAC 3.3 - 3.5)
// EduConta SV · Normativa Legal y Fórmulas Laborales de El Salvador
// =========================================================================

window._planillaMode = 'practica';

window.setPlanillaMode = function (mode) {
    window._planillaMode = mode;
    const btnAsistido = document.getElementById('btn-planilla-mode-asistido');
    const btnPractica = document.getElementById('btn-planilla-mode-practica');
    const panelAudit = document.getElementById('panel-audit-planilla');
    if (panelAudit) panelAudit.classList.add('hidden');

    if (mode === 'asistido') {
        if (btnAsistido) {
            btnAsistido.className = "px-3 py-1.5 rounded-xl transition-all duration-200 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm flex items-center gap-1.5 text-[11px]";
        }
        if (btnPractica) {
            btnPractica.className = "px-3 py-1.5 rounded-xl transition-all duration-200 text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1.5 text-[11px]";
        }
    } else {
        if (btnPractica) {
            btnPractica.className = "px-3 py-1.5 rounded-xl transition-all duration-200 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm flex items-center gap-1.5 text-[11px]";
        }
        if (btnAsistido) {
            btnAsistido.className = "px-3 py-1.5 rounded-xl transition-all duration-200 text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1.5 text-[11px]";
        }
    }

    if (typeof calculateAndRenderPayroll === 'function') {
        calculateAndRenderPayroll();
    }
};

window.savePracticeField = function (idx, colKey, val) {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual?.sheets?.[activeSheetIndex];
    if (!sheet || !sheet.employees || !sheet.employees[idx]) return;
    const e = sheet.employees[idx];
    e._practice = e._practice || {};
    const parsedVal = parseFloat(val) || 0;
    e._practice[colKey] = parsedVal;
    if (colKey === 'salario_neto') {
        e._practice['liquido_recibir'] = parsedVal;
    } else if (colKey === 'liquido_recibir') {
        e._practice['salario_neto'] = parsedVal;
    }
    saveState();
};

window.auditPlanillaPractice = function () {
    const sheet = proyecto_actual?.sheets?.[activeSheetIndex];
    const emps = (sheet?.employees || []).filter(e => e.nombre?.trim());

    if (!emps.length) {
        alert("Agrega al menos un empleado con nombre para auditar la planilla.");
        return;
    }

    let totalChecks = 0;
    let correctChecks = 0;
    const feedbackList = [];

    emps.forEach((e, idx) => {
        const c = e._computed || {};
        const p = e._practice || {};

        const checkField = (fieldName, label, expectedVal, lawCite) => {
            totalChecks++;
            let userVal = 0;
            if (fieldName === 'liquido_recibir' || fieldName === 'salario_neto') {
                userVal = p.liquido_recibir !== undefined ? p.liquido_recibir : (p.salario_neto !== undefined ? p.salario_neto : 0);
            } else {
                userVal = p[fieldName] !== undefined ? p[fieldName] : 0;
            }
            const diff = Math.abs(userVal - expectedVal);
            if (diff <= 0.05) {
                correctChecks++;
            } else {
                feedbackList.push({
                    emp: e.nombre,
                    label,
                    userVal,
                    expectedVal,
                    lawCite,
                    msg: `Ingresado: $${userVal.toFixed(2)} | Esperado: $${expectedVal.toFixed(2)} (${lawCite})`
                });
            }
        };

        // 1. ISSS Laboral (3.0%, tope $1,000.00 / máx $30.00)
        checkField('isss_lab', 'ISSS Laboral', c.isss_lab || 0, '3% con techo de $1,000.00 [Art. 27 Ley Seguro Social]');

        // 2. AFP Laboral (7.25% sin tope)
        checkField('afp_lab', 'AFP Laboral', c.afp_lab || 0, '7.25% s/ total devengado [Ley SAP]');

        // 3. Renta Retenida (MH Decreto No. 10)
        checkField('renta', 'Retención de Renta', c.renta || 0, 'Escala progresiva Decreto No. 10 MH s/ salario gravado');

        // 4. Salario Líquido a Pagar
        checkField('liquido_recibir', 'Líquido a Recibir', c.liquido_recibir !== undefined ? c.liquido_recibir : (c.salario_neto || 0), 'Total Devengado − Total Deducciones');
    });

    const scorePct = totalChecks > 0 ? (correctChecks / totalChecks) * 100 : 0;
    let nivel = 1;
    let titulo = "";
    let desc = "";
    let badgeClass = "";

    if (scorePct >= 95) {
        nivel = 5;
        titulo = "Nivel 5: Excelente (Dominio Laboral y Previsional Pleno)";
        desc = "Cálculo impecable de retenciones laborales, techos de cotización del ISSS, AFP y tramos de retención de Renta conforme a la legislación de El Salvador.";
        badgeClass = "bg-emerald-500 text-white";
    } else if (scorePct >= 80) {
        nivel = 4;
        titulo = "Nivel 4: Muy Bueno (Competente con Leves Desajustes)";
        desc = "Comprensión sólida de la nómina salvadoreña. Se detectaron variaciones mínimas de redondeo o cálculo de horas.";
        badgeClass = "bg-sky-500 text-white";
    } else if (scorePct >= 65) {
        nivel = 3;
        titulo = "Nivel 3: Bueno (Aprobado Básico)";
        desc = "Aplica correctamente las tarifas básicas (ISSS 3% y AFP 7.25%), pero requiere afinar la base gravable de Renta o la aplicación de techos.";
        badgeClass = "bg-amber-500 text-white";
    } else if (scorePct >= 45) {
        nivel = 2;
        titulo = "Nivel 2: En Proceso (Requiere Refuerzo)";
        desc = "Dificultades en el cálculo del impuesto sobre la renta o el líquido final a transferir al colaborador.";
        badgeClass = "bg-orange-500 text-white";
    } else {
        nivel = 1;
        titulo = "Nivel 1: Inicial (No Alcanzado)";
        desc = "Los valores de deducción no concuerdan con la normativa legal vigente de El Salvador.";
        badgeClass = "bg-rose-500 text-white";
    }

    const panel = document.getElementById('panel-audit-planilla');
    if (panel) {
        panel.classList.remove('hidden');
        panel.className = "mb-6 p-6 rounded-3xl border transition-all duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-xl";
        panel.innerHTML = `
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                <div class="flex items-center gap-3">
                    <span class="px-3.5 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider ${badgeClass}">
                        ${titulo}
                    </span>
                    <span class="text-xs font-bold text-slate-500 tabular-nums">Puntaje: ${correctChecks} / ${totalChecks} (${scorePct.toFixed(1)}%)</span>
                </div>
                <button type="button" onclick="this.closest('#panel-audit-planilla').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 text-sm">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="text-xs text-slate-700 dark:text-slate-300 font-medium mb-4">${desc}</p>
            ${feedbackList.length > 0 ? `
                <div class="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                    <h5 class="text-xs font-black uppercase text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                        <i class="fas fa-exclamation-triangle"></i> Discrepancias Detectadas en la Planilla:
                    </h5>
                    <ul class="text-xs text-rose-800 dark:text-rose-300 space-y-1.5 list-disc list-inside">
                        ${feedbackList.map(f => `<li><strong>${escapeHtml(f.emp)}</strong> — ${escapeHtml(f.label)}: ${escapeHtml(f.msg)}</li>`).join('')}
                    </ul>
                </div>
            ` : `
                <div class="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                    <i class="fas fa-check-circle text-base"></i> ¡Todas las retenciones y salarios netos cumplen con exactitud la legislación de El Salvador!
                </div>
            `}
        `;
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// ─── Boleta de Pago Individual (Art. 138 Código de Trabajo) ──────
window.renderBoletaView = function () {
    const sheet = proyecto_actual?.sheets?.[activeSheetIndex];
    const emps = (sheet?.employees || []).filter(e => e.nombre?.trim());
    const sel = document.getElementById('boleta-emp-select');
    if (!sel) return;

    if (!emps.length) {
        sel.innerHTML = '<option value="">Sin empleados registrados</option>';
        if (sel._glassSelectInstance && typeof sel._glassSelectInstance.refresh === 'function') {
            sel._glassSelectInstance.refresh();
        } else if (typeof window.EduContaGlassSelect === 'function') {
            window.EduContaGlassSelect(sel, 'indigo');
        }
        const card = document.getElementById('boleta-printable-card');
        if (card) {
            card.innerHTML = `
                <div class="text-center py-12 text-slate-400">
                    <i class="fas fa-user-slash text-4xl mb-3 block text-slate-300"></i>
                    <p class="font-bold text-sm">Registra empleados en la pestaña de Planilla para visualizar sus Boletas de Pago.</p>
                </div>
            `;
        }
        return;
    }

    sel.innerHTML = emps.map((e, idx) => `
        <option value="${idx}">${escapeHtml(e.nombre)} (${escapeHtml(e.cargo || 'Colaborador')})</option>
    `).join('');

    if (sel._glassSelectInstance && typeof sel._glassSelectInstance.refresh === 'function') {
        sel._glassSelectInstance.refresh();
    } else if (typeof window.EduContaGlassSelect === 'function') {
        window.EduContaGlassSelect(sel, 'indigo');
    }

    window.renderSelectedBoleta(sel.value || 0);
};

window.renderSelectedBoleta = function (empIdx) {
    const sheet = proyecto_actual?.sheets?.[activeSheetIndex];
    const emps = (sheet?.employees || []).filter(e => e.nombre?.trim());
    const e = emps[empIdx];
    const card = document.getElementById('boleta-printable-card');
    if (!e || !card) return;

    const c = e._computed || {};
    const projName = escapeHtml(document.getElementById('current-project-name')?.innerText || 'EMPRESA SALVADOREÑA, S.A. DE C.V.');
    const periodName = escapeHtml(sheet?.name || 'Mes Corriente');
    const sheetDate = escapeHtml(sheet?.date || new Date().toISOString().split('T')[0]);
    const otrosDesc = parseFloat(e.otros_descuentos !== undefined ? e.otros_descuentos : e.otras_deducciones) || 0;
    const descTardanzas = parseFloat(e.descuento_tardanzas) || 0;

    const fmt = v => `$ ${(parseFloat(v) || 0).toFixed(2)}`;

    card.innerHTML = `
        <!-- Encabezado de la Boleta -->
        <div class="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h3 class="text-base font-black text-slate-900 uppercase tracking-wide">${projName}</h3>
                <p class="text-[11px] font-bold text-indigo-600 uppercase mt-0.5 tracking-wider">BOLETA DE PAGO INDIVIDUAL · ART. 138 CÓDIGO DE TRABAJO</p>
                <p class="text-[10px] text-slate-500">República de El Salvador · Ministerio de Trabajo y Previsión Social</p>
            </div>
            <div class="text-left sm:text-right text-xs">
                <span class="px-3 py-1 bg-slate-100 rounded-full font-bold tabular-nums text-slate-700">Período: ${periodName}</span>
                <p class="text-[10px] text-slate-400 mt-1 tabular-nums font-medium">Fecha de Emisión: ${sheetDate}</p>
            </div>
        </div>

        <!-- Datos del Colaborador -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
                <span class="text-slate-400 block font-bold text-[10px] uppercase">Colaborador:</span>
                <span class="font-black text-slate-900">${escapeHtml(e.nombre)}</span>
            </div>
            <div>
                <span class="text-slate-400 block font-bold text-[10px] uppercase">Cargo / Puesto:</span>
                <span class="font-bold text-slate-700">${escapeHtml(e.cargo || 'Empleado Operativo')}</span>
            </div>
            <div>
                <span class="text-slate-400 block font-bold text-[10px] uppercase">N° Afiliación ISSS:</span>
                <span class="tabular-nums font-bold text-slate-800">${escapeHtml(e.isss_num || '01928374-1')}</span>
            </div>
            <div>
                <span class="text-slate-400 block font-bold text-[10px] uppercase">NUP / AFP:</span>
                <span class="tabular-nums font-bold text-slate-800">${escapeHtml(e.afp_num || '1029384756')}</span>
            </div>
        </div>

        <!-- Tabla Desglosada: Ingresos vs Deducciones -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <!-- Columna Ingresos -->
            <div class="border border-slate-200 rounded-2xl overflow-hidden">
                <div class="bg-emerald-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                    <span class="font-black uppercase tracking-wider text-emerald-800 text-[11px]">I. Percepciones / Ingresos</span>
                    <span class="text-[10px] font-bold text-emerald-600">Devengado</span>
                </div>
                <div class="p-4 space-y-2 tabular-nums">
                    <div class="flex justify-between">
                        <span class="text-slate-600">Salario Ordinario:</span>
                        <span class="font-bold text-slate-800">${fmt(c.salario_devengado !== undefined ? c.salario_devengado : e.salario_base)}</span>
                    </div>
                    ${(c.pago_horas_ext || 0) > 0 ? `
                        <div class="flex justify-between">
                            <span class="text-slate-600">Horas Extras (100% / 125%):</span>
                            <span class="font-bold text-slate-800">${fmt(c.pago_horas_ext)}</span>
                        </div>
                    ` : ''}
                    ${(parseFloat(e.vacaciones) || 0) > 0 ? `
                        <div class="flex justify-between">
                            <span class="text-slate-600">Vacación Anual (+30% Art. 177 CT):</span>
                            <span class="font-bold text-slate-800">${fmt(e.vacaciones)}</span>
                        </div>
                    ` : ''}
                    ${(parseFloat(e.aguinaldo) || 0) > 0 ? `
                        <div class="flex justify-between">
                            <span class="text-slate-600">Aguinaldo Proporcional:</span>
                            <span class="font-bold text-slate-800">${fmt(e.aguinaldo)}</span>
                        </div>
                    ` : ''}
                    ${(parseFloat(e.bonificaciones) || 0) > 0 ? `
                        <div class="flex justify-between">
                            <span class="text-slate-600">Bonificaciones / Comisiones:</span>
                            <span class="font-bold text-slate-800">${fmt(e.bonificaciones)}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-between items-center font-bold">
                    <span class="uppercase text-slate-700 text-[11px]">Total Devengado:</span>
                    <span class="tabular-nums text-emerald-700 text-sm font-black">${fmt(c.total_devengado)}</span>
                </div>
            </div>

            <!-- Columna Deducciones -->
            <div class="border border-slate-200 rounded-2xl overflow-hidden">
                <div class="bg-rose-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                    <span class="font-black uppercase tracking-wider text-rose-800 text-[11px]">II. Deducciones de Ley</span>
                    <span class="text-[10px] font-bold text-rose-600">Retenido</span>
                </div>
                <div class="p-4 space-y-2 tabular-nums">
                    <div class="flex justify-between">
                        <span class="text-slate-600">ISSS Laboral (3.0%):</span>
                        <span class="font-bold text-rose-600">${fmt(c.isss_lab)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-600">AFP Laboral (7.25%):</span>
                        <span class="font-bold text-rose-600">${fmt(c.afp_lab)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-600">Renta Retenida (MH):</span>
                        <span class="font-bold text-rose-600">${fmt(c.renta)}</span>
                    </div>
                    ${descTardanzas > 0 ? `
                        <div class="flex justify-between">
                            <span class="text-slate-600">Descuento por Tardanzas:</span>
                            <span class="font-bold text-rose-600">${fmt(descTardanzas)}</span>
                        </div>
                    ` : ''}
                    ${otrosDesc > 0 ? `
                        <div class="flex justify-between">
                            <span class="text-slate-600">Otras Retenciones / Préstamos:</span>
                            <span class="font-bold text-rose-600">${fmt(otrosDesc)}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-between items-center font-bold">
                    <span class="uppercase text-slate-700 text-[11px]">Total Deducciones:</span>
                    <span class="tabular-nums text-rose-700 text-sm font-black">${fmt(c.total_deducciones)}</span>
                </div>
            </div>
        </div>

        <!-- Resumen Informativo Aportes Patronales -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-slate-500 gap-2">
            <span class="font-bold uppercase tracking-wider">Aportes Patronales (Informativo, Art. 29 Ley Seguro Social y SAP):</span>
            <div class="flex gap-4 tabular-nums font-bold">
                <span>ISSS Patronal (7.5%): ${fmt(c.isss_pat !== undefined ? c.isss_pat : c.isss_patronal)}</span>
                <span>AFP Patronal (8.75%): ${fmt(c.afp_pat !== undefined ? c.afp_pat : c.afp_patronal)}</span>
            </div>
        </div>

        <!-- Líquido a Pagar Destacado -->
        <div class="p-6 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-indigo-400">Remuneración Neta a Recibir</span>
                <p class="text-xs text-slate-300 mt-0.5">Cancelado conforme a derecho laboral salvadoreño.</p>
            </div>
            <div class="text-right">
                <div class="text-3xl font-black tabular-nums text-emerald-400">${fmt(c.liquido_recibir !== undefined ? c.liquido_recibir : c.salario_neto)}</div>
            </div>
        </div>

        <!-- Firmas de Conformidad -->
        <div class="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
                <div class="border-b border-slate-400 pb-8 mb-2"></div>
                <p class="font-bold text-slate-800">${escapeHtml(e.nombre)}</p>
                <p class="text-[10px] text-slate-400 uppercase">Firma del Colaborador (Recibí Conforme)</p>
            </div>
            <div>
                <div class="border-b border-slate-400 pb-8 mb-2"></div>
                <p class="font-bold text-slate-800">Pagador / Representante Legal</p>
                <p class="text-[10px] text-slate-400 uppercase">Firma Autorizada y Sello de Empresa</p>
            </div>
        </div>
    `;
};

window.printBoletaIndividual = function () {
    window.print();
};

// ─── Exportar Partida Contable de Nómina al Libro Diario ──────────
window.generatePayrollJournalEntry = function () {
    if (window.isAuditMode) return;
    const sheet = proyecto_actual?.sheets?.[activeSheetIndex];
    const emps = (sheet?.employees || []).filter(e => e.nombre?.trim());

    if (!emps.length) {
        alert("Agrega empleados en la planilla antes de generar la partida contable.");
        return;
    }

    let totDevengado = 0;
    let totIsssLab = 0;
    let totAfpLab = 0;
    let totRenta = 0;
    let totIsssPat = 0;
    let totAfpPat = 0;
    let totLiquido = 0;

    emps.forEach(e => {
        const c = e._computed || {};
        totDevengado += (c.total_devengado || 0);
        totIsssLab += (c.isss_lab || 0);
        totAfpLab += (c.afp_lab || 0);
        totRenta += (c.renta || 0);
        totIsssPat += (c.isss_pat !== undefined ? c.isss_pat : (c.isss_patronal || 0));
        totAfpPat += (c.afp_pat !== undefined ? c.afp_pat : (c.afp_patronal || 0));
        totLiquido += (c.liquido_recibir !== undefined ? c.liquido_recibir : (c.salario_neto || 0));
    });

    const periodName = sheet?.name || 'Mes Corriente';
    const entryData = {
        fecha: sheet?.date || new Date().toISOString().split('T')[0],
        titulo: `Partida de Nómina y Cargas Patronales · ${periodName}`,
        glosa: `V/ Liquidación de sueldos y salarios del período ${periodName}, retenciones laborales de ley (ISSS, AFP, Renta) y provisión de aportes patronales (ISSS 7.5%, AFP 8.75%).`,
        rows: [
            { cod: "410101", nom: "Gastos de Administración (Sueldos y Salarios)", debe: totDevengado.toFixed(2), haber: "" },
            { cod: "410102", nom: "Gastos de Administración (ISSS Patronal 7.5%)", debe: totIsssPat.toFixed(2), haber: "" },
            { cod: "410103", nom: "Gastos de Administración (AFP Patronal 8.75%)", debe: totAfpPat.toFixed(2), haber: "" },
            { cod: "210701", nom: "Retenciones por Pagar (ISSS Laboral 3%)", debe: "", haber: totIsssLab.toFixed(2) },
            { cod: "210702", nom: "Retenciones por Pagar (AFP Laboral 7.25%)", debe: "", haber: totAfpLab.toFixed(2) },
            { cod: "210704", nom: "Retenciones por Pagar (Impuesto sobre la Renta)", debe: "", haber: totRenta.toFixed(2) },
            { cod: "210801", nom: "Aportes Patronales por Pagar (ISSS y AFP)", debe: "", haber: (totIsssPat + totAfpPat).toFixed(2) },
            { cod: "110102", nom: "Bancos (Emisión de Transferencias / Sueldos)", debe: "", haber: totLiquido.toFixed(2) }
        ]
    };

    if (window.EduContaBridgeToDiario) {
        window.EduContaBridgeToDiario.open({
            origen: 'Planilla de Salarios',
            color: 'indigo',
            icono: 'fa-users-gear',
            titulo: entryData.titulo,
            subtitulo: `Planilla de Sueldos y Cargas Patronales • ${periodName}`,
            fecha: entryData.fecha,
            glosa: entryData.glosa,
            rows: entryData.rows
        });
    } else {
        const pendingKey = `pending_entry_${proyecto_actual?.id || 'default'}`;
        localStorage.setItem(pendingKey, JSON.stringify(entryData));
        window.location.href = "editor-libros.html";
    }
};
