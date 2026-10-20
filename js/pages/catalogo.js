/**
 * ==============================================================================
 * EduConta SV - Catálogo Maestro (Plan 1: Explorador Split-View & Ficha Viva)
 * Arquitectura: ES6 Vanilla JS, Integración Supabase/Caché, Identidad Índigo (#6366f1)
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    if (window.loadCatalogoMaestro) {
        window.loadCatalogoMaestro().then(() => {
            if (typeof window.filterCatalog === 'function') window.filterCatalog('');
            if (typeof window.updateCatalogTabIndicator === 'function') window.updateCatalogTabIndicator(false);
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(() => {
                    if (typeof window.updateCatalogTabIndicator === 'function') window.updateCatalogTabIndicator(false);
                });
            }
        });
    }

    // Alinear indicador deslizante al redimensionar ventana
    window.addEventListener('resize', () => {
        if (typeof window.updateCatalogTabIndicator === 'function') window.updateCatalogTabIndicator(false);
    });
});

window.currentCatalogFilter = 'Todos';
window.currentLevelFilter = 'all';
window.currentSelectedAccountId = null;
window.catalogRenderLimit = 150;

/**
 * Filtro por Sector (Pestañas superiores)
 */
window.setCatalogFilter = function(cat) {
    window.currentCatalogFilter = cat;

    // Actualizar UI de botones de filtro
    document.querySelectorAll('.cat-filter-btn').forEach(btn => {
        btn.classList.remove('active', 'text-indigo-600', 'text-sky-600');
        btn.classList.add('text-slate-500');

        if (btn.dataset.cat === cat) {
            btn.classList.add('active', 'text-indigo-600');
            btn.classList.remove('text-slate-500');
        }
    });

    window.updateCatalogTabIndicator();
    window.filterCatalog();
};

/**
 * Filtro por Nivel Contable (Sub-pills en el Explorador)
 */
window.setCatalogLevelFilter = function(level) {
    window.currentLevelFilter = level;
    document.querySelectorAll('.cat-level-btn').forEach(btn => {
        if (btn.dataset.level === level) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    window.filterCatalog();
};

/**
 * Motor de Inteligencia Pedagógica y Contable (El Salvador)
 * Genera la dinámica de Cuenta "T", Marco Normativo y Asiento de Ejemplo
 */
function getCuentaPedagogicaData(item) {
    const id = String(item.id || '');
    const name = String(item.name || '');
    const rubro = String(item.rubro || '');
    const cat = String(item.cat || item.sector || '');

    let info = { tipo: 'Cuenta', clase: '' };
    if (typeof window.clasificarCuenta === 'function') {
        info = window.clasificarCuenta({ id, cat, rubro });
    }

    const tipo = info.tipo || 'Activo';
    const clase = info.clase || (tipo === 'Activo' || tipo === 'Pasivo' ? 'Corriente' : '');

    // 1. Naturaleza y Saldo Habitual
    let naturaleza = 'Deudora';
    let saldoHabitual = 'DEUDOR';
    let debeSigno = '(+) Aumenta';
    let haberSigno = '(-) Disminuye';

    if (tipo === 'Pasivo' || tipo === 'Patrimonio' || (tipo === 'Resultado' && (rubro.toLowerCase().includes('ingreso') || id.startsWith('4')))) {
        naturaleza = 'Acreedora';
        saldoHabitual = 'ACREEDOR';
        debeSigno = '(-) Disminuye';
        haberSigno = '(+) Aumenta';
    }

    // 2. Dinámica de Cargos y Abonos (Cuenta "T")
    let debeMotivos = [];
    let haberMotivos = [];

    if (tipo === 'Activo') {
        if (id.startsWith('1101') || id.startsWith('1110') || name.toLowerCase().includes('caja') || name.toLowerCase().includes('fondo')) {
            debeMotivos = [
                'Ingresos de efectivo por ventas o cobros a clientes.',
                'Recepción de remesas, transferencias o aportes de capital.',
                'Constitución o aumento de fondos fijos de caja chica.'
            ];
            haberMotivos = [
                'Depósitos bancarios de remesas enviadas a cuentas corrientes.',
                'Pagos menores en efectivo debidamente amparados por recibos.',
                'Faltantes de caja detectados en arqueos periódicos.'
            ];
        } else if (id.startsWith('1102') || id.startsWith('1111') || name.toLowerCase().includes('banco')) {
            debeMotivos = [
                'Depósitos en efectivo y transferencias electrónicas recibidas.',
                'Notas de crédito bancarias (intereses a favor, abonos).',
                'Cobro o liquidación de inversiones temporales.'
            ];
            haberMotivos = [
                'Emisión de cheques o transferencias de pago a proveedores.',
                'Notas de débito bancarias (comisiones, chequeras, retención ISR).',
                'Cargos automáticos por préstamos o servicios contratados.'
            ];
        } else if (id.startsWith('1103') || name.toLowerCase().includes('inventario') || name.toLowerCase().includes('mercader')) {
            debeMotivos = [
                'Adquisición de mercaderías o materias primas al costo de compra.',
                'Fletes, aranceles de importación y gastos de internación.',
                'Devoluciones de mercadería en buen estado recibidas de clientes.'
            ];
            haberMotivos = [
                'Salidas por costo de ventas al facturar productos a clientes.',
                'Devoluciones de mercaderías defectuosas a proveedores.',
                'Mermas normales o ajustes por toma de inventario físico.'
            ];
        } else if (id.startsWith('12') || name.toLowerCase().includes('propiedad') || name.toLowerCase().includes('equipo')) {
            debeMotivos = [
                'Compra de inmuebles, vehículos, mobiliario o maquinaria al costo.',
                'Costos de instalación, mejoras o adiciones que extiendan su vida útil.',
                'Revalúos técnicos autorizados bajo norma NIC 16.'
            ];
            haberMotivos = [
                'Venta, permuta o retiro de bienes fuera de servicio.',
                'Baja por obsolescencia tecnológica, siniestro o daño total.',
                'Cancelación del costo histórico al finalizar su depreciación.'
            ];
        } else {
            debeMotivos = [
                'Reconocimiento inicial de derechos exigibles y recursos controlados.',
                'Incrementos por compras, liquidaciones o devengos a favor.',
                'Ajustes por diferencial cambiario favorable o correcciones.'
            ];
            haberMotivos = [
                'Cobro en efectivo o liquidación total de los derechos exigibles.',
                'Bajas, estimación para cuentas incobrables o amortizaciones.',
                'Traspaso o reclasificación a otras partidas del activo.'
            ];
        }
    } else if (tipo === 'Pasivo') {
        if (id.startsWith('2101') || name.toLowerCase().includes('proveedor')) {
            debeMotivos = [
                'Pagos efectuados mediante cheque, transferencia o efectivo.',
                'Devoluciones de mercadería efectuadas al proveedor comercial.',
                'Descuentos y rebajas obtenidos con posterioridad a la compra.'
            ];
            haberMotivos = [
                'Recepción de facturas o comprobantes de crédito fiscal.',
                'Compras de mercaderías o materias primas al crédito.',
                'Intereses moratorios o recargos financieros convenidos.'
            ];
        } else if (id.startsWith('2105') || name.toLowerCase().includes('retencion') || name.toLowerCase().includes('isss') || name.toLowerCase().includes('afp')) {
            debeMotivos = [
                'Pago y entero mensual de planillas al ISSS, AFP o Ministerio de Hacienda.',
                'Ajustes por retenciones indebidas devueltas a empleados.'
            ];
            haberMotivos = [
                'Retenciones laborales del 3% ISSS (tope $1,000) y 7.25% AFP.',
                'Retención del Impuesto sobre la Renta según tablas oficiales MH.',
                'Retención del 1% de IVA a proveedores según Art. 162 del Código Tributario.'
            ];
        } else {
            debeMotivos = [
                'Amortización de capital o liquidación total de la obligación.',
                'Condonación legal, quita o reestructuración convenida de deuda.',
                'Pagos efectivos mediante fondos bancarios o remesas.'
            ];
            haberMotivos = [
                'Contratación de créditos, préstamos bancarios o emisión de títulos.',
                'Provisión de gastos y servicios devengados pendientes de liquidar.',
                'Reconocimiento de obligaciones laborales, fiscales o mercantiles.'
            ];
        }
    } else if (tipo === 'Patrimonio') {
        debeMotivos = [
            'Disminución o retiro de capital social acordado en junta general.',
            'Absorción de pérdidas netas de ejercicios anteriores.',
            'Decretación y distribución de dividendos en efectivo a socios.'
        ];
        haberMotivos = [
            'Aportes iniciales o aumentos de capital de los accionistas.',
            'Utilidades netas generadas en el período contable.',
            'Constitución de Reserva Legal (7% anual en sociedades de capital salvadoreñas).'
        ];
    } else if (tipo === 'Resultado' && (rubro.toLowerCase().includes('ingreso') || id.startsWith('4'))) {
        debeMotivos = [
            'Devoluciones, rebajas o descuentos sobre ventas otorgados a clientes.',
            'Cancelación y traspaso al cierre del ejercicio contable.',
            'Liquidación final contra la cuenta de Pérdidas y Ganancias.'
        ];
        haberMotivos = [
            'Facturación de ventas de bienes y servicios devengados en el período.',
            'Ingresos financieros por intereses generados en cuentas o depósitos.',
            'Otros ingresos no operacionales o extraordinarios devengados.'
        ];
    } else { // Gastos y Costos
        debeMotivos = [
            'Devengo y pago de sueldos, salarios y prestaciones sociales de ley.',
            'Adquisición de servicios básicos, publicidad, alquileres y suministros.',
            'Reconocimiento sistemático de depreciaciones y amortizaciones.'
        ];
        haberMotivos = [
            'Ajustes por corrección de errores en imputaciones de gastos.',
            'Devoluciones o notas de crédito recibidas sobre servicios facturados.',
            'Liquidación y cierre anual contra la cuenta de Pérdidas y Ganancias.'
        ];
    }

    // 3. Fundamento Normativo (Marco Legal El Salvador)
    let normaNombre = 'NIC 1 - Presentación de Estados Financieros';
    let normaDesc = 'Exige la presentación comprensible y fiable de la estructura financiera de la entidad, distinguiendo partidas corrientes y no corrientes.';
    let sectorTag = cat || 'Comercial';

    if (cat === 'SSF') {
        normaNombre = 'Manual Contable de la Superintendencia del Sistema Financiero (SSF)';
        normaDesc = 'Normativa rectora de observancia obligatoria para bancos comerciales, aseguradoras y entidades financieras supervisadas en El Salvador.';
    } else if (cat === 'Gub') {
        normaNombre = 'Sistema de Administración Financiera Integrado (SAFI - MH)';
        normaDesc = 'Catálogo unificado y manual de contabilidad gubernamental emitido por la Dirección General de Contabilidad Gubernamental del Ministerio de Hacienda.';
    } else if (id.startsWith('1101') || id.startsWith('1102') || id.startsWith('1110')) {
        normaNombre = 'NIC 7 - Estado de Flujos de Efectivo & NIC 1';
        normaDesc = 'Regula el tratamiento de los fondos en efectivo y equivalentes disponibles inmediatamente sin restricciones cambiarias ni operativas.';
    } else if (id.startsWith('1103') || cat === 'INV') {
        normaNombre = 'NIC 2 - Inventarios (Medición y Valuación)';
        normaDesc = 'Norma que estipula la valuación al costo o valor neto realizable (el menor), aplicando métodos de costeo como PEPS o Costo Promedio Ponderado.';
    } else if (cat === 'AGR' || id.startsWith('1104')) {
        normaNombre = 'NIC 41 - Agricultura (Activos Biológicos)';
        normaDesc = 'Tratamiento contable de los activos biológicos vinculados a la actividad agropecuaria, medidos a su valor razonable menos costos de venta.';
    } else if (id.startsWith('12')) {
        normaNombre = 'NIC 16 - Propiedades, Planta y Equipo';
        normaDesc = 'Establece el reconocimiento inicial al costo de adquisición y su posterior depreciación sistemática en función de su vida útil estimada.';
    } else if (id.startsWith('2105') || rubro.toLowerCase().includes('retencion')) {
        normaNombre = 'Código Tributario y Ley del Seguro Social / AFP (El Salvador)';
        normaDesc = 'Regula las retenciones del 3% ISSS (techo máximo de cotización $1,000.00), 7.25% AFP laboral y tablas mensuales de retención del ISR (Decreto No. 10 MH).';
    } else if (tipo === 'Pasivo') {
        normaNombre = 'NIC 37 - Provisiones, Pasivos Contingentes y Activos Contingentes';
        normaDesc = 'Reconocimiento de obligaciones presentes derivadas de hechos pasados, cuya cancelación involucra una probable salida de recursos con beneficios económicos.';
    }

    // 4. Asiento Contable Tipo (Caso Práctico Didáctico)
    let asiento = {
        concepto: `Registro contable habitual correspondiente a ${name.toLowerCase()}`,
        filas: [],
        totalDebe: '$500.00',
        totalHaber: '$500.00'
    };

    if (id.startsWith('1101') || id.startsWith('1110') || name.toLowerCase().includes('caja')) {
        asiento.concepto = 'Cobro en efectivo a clientes por venta de mercaderías del día con comprobante fiscal.';
        asiento.filas = [
            { codigo: id, cuenta: name, debe: '$565.00', haber: '-' },
            { codigo: '410101', cuenta: 'Ventas de Mercaderías', debe: '-', haber: '$500.00' },
            { codigo: '210701', cuenta: 'Débito Fiscal IVA (13%)', debe: '-', haber: '$65.00' }
        ];
        asiento.totalDebe = '$565.00';
        asiento.totalHaber = '$565.00';
    } else if (id.startsWith('1102') || id.startsWith('1111') || name.toLowerCase().includes('banco')) {
        asiento.concepto = 'Pago con transferencia electrónica a proveedor por cancelación de factura comercial vencida.';
        asiento.filas = [
            { codigo: '210101', cuenta: 'Cuentas y Documentos por Pagar', debe: '$1,200.00', haber: '-' },
            { codigo: id, cuenta: name, debe: '-', haber: '$1,200.00' }
        ];
        asiento.totalDebe = '$1,200.00';
        asiento.totalHaber = '$1,200.00';
    } else if (id.startsWith('1103') || name.toLowerCase().includes('inventario')) {
        asiento.concepto = 'Adquisición de mercaderías al crédito amparadas con Comprobante de Crédito Fiscal.';
        asiento.filas = [
            { codigo: id, cuenta: name, debe: '$2,000.00', haber: '-' },
            { codigo: '110701', cuenta: 'Crédito Fiscal IVA (13%)', debe: '$260.00', haber: '-' },
            { codigo: '210101', cuenta: 'Proveedores Nacionales', debe: '-', haber: '$2,260.00' }
        ];
        asiento.totalDebe = '$2,260.00';
        asiento.totalHaber = '$2,260.00';
    } else if (tipo === 'Pasivo') {
        asiento.concepto = 'Provisión contable de obligación comercial al cierre de operaciones del período.';
        asiento.filas = [
            { codigo: '510201', cuenta: 'Gastos de Administración', debe: '$750.00', haber: '-' },
            { codigo: id, cuenta: name, debe: '-', haber: '$750.00' }
        ];
        asiento.totalDebe = '$750.00';
        asiento.totalHaber = '$750.00';
    } else if (tipo === 'Resultado' && (rubro.toLowerCase().includes('ingreso') || id.startsWith('4'))) {
        asiento.concepto = 'Facturación de venta de mercadería al crédito con comprobante fiscal emitido.';
        asiento.filas = [
            { codigo: '110401', cuenta: 'Cuentas por Cobrar Comerciales', debe: '$1,130.00', haber: '-' },
            { codigo: id, cuenta: name, debe: '-', haber: '$1,000.00' },
            { codigo: '210701', cuenta: 'Débito Fiscal IVA (13%)', debe: '-', haber: '$130.00' }
        ];
        asiento.totalDebe = '$1,130.00';
        asiento.totalHaber = '$1,130.00';
    } else { // Gastos
        asiento.concepto = 'Reconocimiento y desembolso de gasto operativo del mes con comprobante bancario.';
        asiento.filas = [
            { codigo: id, cuenta: name, debe: '$350.00', haber: '-' },
            { codigo: '110201', cuenta: 'Bancos Cuenta Corriente', debe: '-', haber: '$350.00' }
        ];
        asiento.totalDebe = '$350.00';
        asiento.totalHaber = '$350.00';
    }

    return {
        id,
        name,
        rubro: rubro && rubro !== '-' && rubro !== 'null' ? rubro : tipo,
        cat: sectorTag,
        tipo,
        clase,
        naturaleza,
        saldoHabitual,
        debeSigno,
        haberSigno,
        debeMotivos,
        haberMotivos,
        normaNombre,
        normaDesc,
        asiento
    };
}

/**
 * Renderiza la Ficha Maestra Viva en Tiempo Real (Panel Derecho / Drawer Móvil)
 */
window.renderCatalogInspector = function(item, targetId = 'catalog-inspector-content') {
    const container = document.getElementById(targetId);
    if (!container || !item) return;

    const data = getCuentaPedagogicaData(item);
    const id = data.id;
    const name = data.name;
    const safeId = window.EduSec ? EduSec.escapeHtml(id) : String(id ?? '');
    const jsId = window.EduSec ? EduSec.jsArg(id) : `'${String(id ?? '')}'`;
    const safeName = window.EduSec ? EduSec.escapeHtml(name) : String(name ?? '');
    const safeCat = window.EduSec ? EduSec.escapeHtml(data.cat) : String(data.cat ?? '');
    const safeRubro = window.EduSec ? EduSec.escapeHtml(data.rubro) : String(data.rubro ?? '');
    const safeClase = data.clase ? (window.EduSec ? EduSec.escapeHtml(data.clase) : String(data.clase)) : '';
    const isMobile = targetId === 'catalog-drawer-content';

    let nivelTexto = 'Subcuenta Analítica • Nivel 4';
    if (id.length === 1) nivelTexto = 'Clase Contable • Elemento Primario (1 dígito)';
    else if (id.length === 2) nivelTexto = 'Grupo Contable • Clasificación (2 dígitos)';
    else if (id.length === 4) nivelTexto = 'Cuenta de Mayor • Rubro Principal (4 dígitos)';

    const natBadgeClass = data.naturaleza === 'Deudora'
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';

    const natIcon = data.naturaleza === 'Deudora' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';

    // Generar migas de pan de ancestros
    let breadcrumbsHtml = '';
    const lengths = [1, 2, 4, id.length];
    const uniqueLengths = [...new Set(lengths)].filter(l => l <= id.length);
    uniqueLengths.forEach((len, idx) => {
        const ancId = id.substring(0, len);
        let ancName = ancId;
        if (typeof CATALOGO_MAESTRO !== 'undefined') {
            const f = CATALOGO_MAESTRO.find(x => String(x.id) === ancId);
            if (f) ancName = f.name;
        }
        const safeAncId = window.EduSec ? EduSec.escapeHtml(ancId) : ancId;
        const jsAncId = window.EduSec ? EduSec.jsArg(ancId) : `'${ancId}'`;
        const safeAncName = window.EduSec ? EduSec.escapeHtml(ancName) : ancName;
        breadcrumbsHtml += `
            <button onclick="filterCatalog(${jsAncId})" class="hover:text-indigo-500 transition-colors ${ancId === id ? 'font-bold text-indigo-500 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}" title="Filtrar por ${safeAncId}">
                <span class="font-mono text-[10px] opacity-75">${safeAncId}</span> ${safeAncName}
            </button>
        `;
        if (idx < uniqueLengths.length - 1) {
            breadcrumbsHtml += `<i class="fas fa-chevron-right text-[8px] text-slate-300 dark:text-slate-600 mx-1"></i>`;
        }
    });

    const closeBtnHtml = isMobile ? `
        <button onclick="closeCatalogDrawer()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/50 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors z-20" title="Cerrar ficha">
            <i class="fas fa-times"></i>
        </button>
    ` : '';

    container.innerHTML = `
        <div class="flex-1 min-h-0 flex flex-col overflow-hidden relative fade-in">
            ${closeBtnHtml}
            <!-- CABECERA DE LA FICHA MAESTRA -->
            <div class="p-5 pb-4 border-b border-slate-200/60 dark:border-white/5 shrink-0 bg-slate-50/50 dark:bg-white/[0.01]">
                <div class="flex items-center gap-2 mb-2">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        ${nivelTexto}
                    </span>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        ${safeCat}
                    </span>
                </div>

                <div class="flex items-center justify-between gap-3 mb-1">
                    <div class="flex items-center gap-2.5">
                        <span class="text-3xl font-black font-mono tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums">
                            ${safeId}
                        </span>
                        <button onclick="copyCatalogCode(${jsId}, event)" class="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center transition-all shadow-sm" title="Copiar código al portapapeles">
                            <i class="far fa-copy text-xs"></i>
                        </button>
                    </div>
                </div>

                <h3 class="text-xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight mb-3">
                    ${safeName}
                </h3>

                <!-- Píldoras informativas de clasificación -->
                <div class="flex flex-wrap items-center gap-2">
                    <span class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wide bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                        <i class="fas fa-layer-group text-indigo-500 mr-1"></i>${safeRubro}
                    </span>
                    <span class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wide border ${natBadgeClass}">
                        <i class="fas ${natIcon} mr-1"></i>${data.naturaleza}
                    </span>
                    ${safeClase ? `
                    <span class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wide bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                        ${safeClase}
                    </span>` : ''}
                </div>
            </div>

            <!-- CONTENIDO SCROLLABLE DE LA FICHA (DISEÑO UNIFICADO Y LIMPIO) -->
            <div class="flex-1 min-h-0 overflow-y-auto px-5 divide-y divide-slate-200/70 dark:divide-white/[0.06] custom-scrollbar">

                <!-- 1. VISUALIZADOR CUENTA "T" DIDÁCTICA -->
                <div class="py-4 space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-[10.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <i class="fas fa-scale-balanced text-indigo-500"></i> Dinámica de la Cuenta "T"
                        </span>
                        <span class="text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Reglas Contables SV
                        </span>
                    </div>

                    <!-- Estructura formal de T con 2 columnas sin caja contenedora -->
                    <div class="grid grid-cols-2 relative pt-1">
                        <!-- Línea vertical divisoria de la T contable -->
                        <div class="absolute inset-y-0 left-1/2 w-px bg-slate-200/80 dark:bg-white/10 -translate-x-1/2"></div>

                        <!-- Columna DEBE -->
                        <div class="pr-3">
                            <div class="flex items-center justify-between pb-1.5 mb-2 border-b-2 border-indigo-500/30">
                                <span class="font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wide">DEBE (Cargos)</span>
                                <span class="text-[9.5px] font-bold px-1.5 py-0.5 rounded ${data.naturaleza === 'Deudora' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'}">
                                    ${data.debeSigno}
                                </span>
                            </div>
                            <ul class="text-[11.5px] space-y-1.5 text-slate-600 dark:text-slate-300 font-medium">
                                ${data.debeMotivos.map(m => `<li class="flex items-start gap-1.5"><i class="fas fa-check text-[9px] text-indigo-400 mt-1 shrink-0"></i><span>${m}</span></li>`).join('')}
                            </ul>
                        </div>

                        <!-- Columna HABER -->
                        <div class="pl-3">
                            <div class="flex items-center justify-between pb-1.5 mb-2 border-b-2 border-indigo-500/30">
                                <span class="font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wide">HABER (Abonos)</span>
                                <span class="text-[9.5px] font-bold px-1.5 py-0.5 rounded ${data.naturaleza === 'Acreedora' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'}">
                                    ${data.haberSigno}
                                </span>
                            </div>
                            <ul class="text-[11.5px] space-y-1.5 text-slate-600 dark:text-slate-300 font-medium">
                                ${data.haberMotivos.map(m => `<li class="flex items-start gap-1.5"><i class="fas fa-check text-[9px] text-indigo-400 mt-1 shrink-0"></i><span>${m}</span></li>`).join('')}
                            </ul>
                        </div>
                    </div>

                    <!-- Pie de la Cuenta T: Saldo Habitual -->
                    <div class="pt-2.5 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                        <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Saldo Habitual al Cierre:</span>
                        <span class="text-xs font-bold px-2.5 py-0.5 rounded-full ${data.naturaleza === 'Deudora' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'}">
                            ${data.saldoHabitual} <span class="font-normal opacity-75">(Mayor al ${data.naturaleza === 'Deudora' ? 'Debe' : 'Haber'})</span>
                        </span>
                    </div>
                </div>

                <!-- 2. FUNDAMENTO NORMATIVO -->
                <div class="py-4 space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-[10.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <i class="fas fa-gavel text-indigo-500"></i> Marco Normativo Aplicable
                        </span>
                        <a href="biblioteca.html" class="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors" title="Abrir Biblioteca Legal">
                            Biblioteca Legal <i class="fas fa-arrow-up-right-from-square text-[9px]"></i>
                        </a>
                    </div>
                    <div class="pl-3.5 border-l-2 border-indigo-500/40 space-y-1">
                        <h5 class="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                            ${data.normaNombre}
                        </h5>
                        <p class="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                            ${data.normaDesc}
                        </p>
                    </div>
                </div>

                <!-- 3. ASIENTO CONTABLE TIPO -->
                <div class="py-4 space-y-2.5">
                    <div class="flex items-center justify-between">
                        <span class="text-[10.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <i class="fas fa-book-journal-whills text-indigo-500"></i> Asiento Contable de Ejemplo
                        </span>
                        <span class="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">Libro Diario</span>
                    </div>

                    <p class="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        "${data.asiento.concepto}"
                    </p>

                    <div class="overflow-x-auto">
                        <table class="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr class="text-[9.5px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-200/80 dark:border-white/10">
                                    <th class="pb-2 font-bold">Código / Cuenta</th>
                                    <th class="text-right pb-2 font-bold w-24">Debe ($)</th>
                                    <th class="text-right pb-2 font-bold w-24">Haber ($)</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 dark:divide-white/[0.04]">
                                ${data.asiento.filas.map(f => `
                                    <tr class="${f.codigo === id ? 'bg-indigo-500/[0.08] font-bold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}">
                                        <td class="py-2 pr-2">
                                            <div class="font-mono text-[10px] opacity-75">${window.EduSec ? EduSec.escapeHtml(f.codigo) : f.codigo}</div>
                                            <div class="text-[11.5px] truncate max-w-[210px]">${window.EduSec ? EduSec.escapeHtml(f.cuenta) : f.cuenta}</div>
                                        </td>
                                        <td class="text-right font-mono tabular-nums py-2">${window.EduSec ? EduSec.escapeHtml(f.debe) : f.debe}</td>
                                        <td class="text-right font-mono tabular-nums py-2">${window.EduSec ? EduSec.escapeHtml(f.haber) : f.haber}</td>
                                    </tr>
                                `).join('')}
                                <tr class="font-black text-slate-800 dark:text-white border-t border-slate-200/80 dark:border-white/10">
                                    <td class="text-right uppercase text-[9px] tracking-wider pr-3 py-2">Sumas Iguales:</td>
                                    <td class="text-right font-mono tabular-nums py-2 border-b-2 border-double border-slate-300 dark:border-white/20">${data.asiento.totalDebe}</td>
                                    <td class="text-right font-mono tabular-nums py-2 border-b-2 border-double border-slate-300 dark:border-white/20">${data.asiento.totalHaber}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- 4. RUTA GENEALÓGICA -->
                <div class="py-4 space-y-1.5">
                    <span class="text-[10.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <i class="fas fa-sitemap text-indigo-500"></i> Ruta Genealógica en el Catálogo
                    </span>
                    <div class="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
                        ${breadcrumbsHtml}
                    </div>
                </div>

            </div>

            <!-- FOOTER DE ACCIONES -->
            <div class="p-4 border-t border-slate-200/60 dark:border-white/5 shrink-0 bg-slate-50/50 dark:bg-white/[0.01] flex items-center gap-3">
                <button onclick="copyFullAccountCard(${jsId}, event)" class="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all">
                    <i class="far fa-copy text-xs"></i> Copiar Ficha
                </button>
                <button onclick="filterCatalog(${jsId})" class="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-all">
                    <i class="fas fa-sitemap text-xs"></i> Ver Subcuentas
                </button>
            </div>
        </div>
    `;
};

/**
 * Selecciona una cuenta y sincroniza los paneles en tiempo real
 */
window.selectCatalogAccount = function(id, openMobileIfSmall = false) {
    if (!id || typeof CATALOGO_MAESTRO === 'undefined') return;
    const item = CATALOGO_MAESTRO.find(x => String(x.id) === String(id));
    if (!item) return;

    window.currentSelectedAccountId = String(id);

    // Actualizar fila activa en el DOM
    document.querySelectorAll('.catalog-row').forEach(row => {
        if (row.getAttribute('data-item-id') === String(id)) {
            row.classList.add('catalog-row-active');
        } else {
            row.classList.remove('catalog-row-active');
        }
    });

    // Actualizar label móvil
    const mobileLabel = document.getElementById('catalog-mobile-selected-label');
    if (mobileLabel) {
        mobileLabel.textContent = `${item.id} - ${item.name}`;
    }

    // Renderizar en el panel derecho de escritorio
    window.renderCatalogInspector(item, 'catalog-inspector-content');

    // Renderizar también en el drawer móvil
    window.renderCatalogInspector(item, 'catalog-drawer-content');

    if (openMobileIfSmall && window.innerWidth < 1024) {
        window.openCatalogMobileInspector();
    }
};

let _catalogSearchDebounceTimer = null;
window.debouncedFilterCatalog = function() {
    if (_catalogSearchDebounceTimer) clearTimeout(_catalogSearchDebounceTimer);
    _catalogSearchDebounceTimer = setTimeout(() => {
        window.filterCatalog();
    }, 180);
};

/**
 * Filtrado del Catálogo (Sector, Nivel y Término de búsqueda)
 */
window.filterCatalog = function(searchTermOverride = null, isLoadMore = false) {
    if (!isLoadMore) {
        window.catalogRenderLimit = 150;
    }

    const input = document.getElementById('catalog-search');
    if (searchTermOverride !== null && input) {
        input.value = searchTermOverride;
    }

    const searchTerm = input ? input.value.trim() : '';
    const searchTermLower = searchTerm.toLowerCase();
    const btnClear = document.getElementById('catalog-clear-search');
    const tbody = document.getElementById('catalog-table-body');
    const countBadge = document.getElementById('catalog-count-badge');

    if (!tbody) return;

    if (btnClear) {
        if (searchTerm.length > 0) btnClear.classList.remove('hidden');
        else btnClear.classList.add('hidden');
    }

    if (typeof CATALOGO_MAESTRO === 'undefined' || !Array.isArray(CATALOGO_MAESTRO)) return;

    // Actualizar migas de pan
    window.renderCatalogBreadcrumbs(searchTerm);

    // Búsqueda directa por coincidencia de texto con Set O(1)
    const directMatchedSet = new Set();
    if (searchTermLower !== '') {
        CATALOGO_MAESTRO.forEach(item => {
            const idStr = String(item.id || '').toLowerCase();
            const nameStr = String(item.name || '').toLowerCase();
            if (idStr.includes(searchTermLower) || nameStr.includes(searchTermLower)) {
                directMatchedSet.add(String(item.id));
            }
        });
    }

    const prefixLengths = [1, 2, 4, 6, 8];

    // Filtrar catálogo completo
    const filtered = CATALOGO_MAESTRO.filter(item => {
        const itemCatLower = String(item.cat || '').toLowerCase();
        const filterLower = currentCatalogFilter.toLowerCase();

        // 1. Sector
        let matchesCat = false;
        if (currentCatalogFilter === 'Todos') {
            matchesCat = true;
        } else if (filterLower === 'ssf') {
            matchesCat = (['ssf', 'bancos', 'seguros', 'cooperativas', 'coop'].includes(itemCatLower));
        } else if (filterLower === 'inv') {
            matchesCat = (['inv', 'com', 'prod', 'nics_gral', 'produccion'].includes(itemCatLower));
        } else if (filterLower === 'agr') {
            matchesCat = (['agr'].includes(itemCatLower));
        } else if (filterLower === 'gub') {
            matchesCat = (['gub', 'safi', 'muni'].includes(itemCatLower));
        } else {
            matchesCat = itemCatLower === filterLower;
        }

        // 2. Nivel
        let matchesLevel = true;
        const codLen = String(item.id || '').length;
        if (window.currentLevelFilter === '1') matchesLevel = codLen === 1;
        else if (window.currentLevelFilter === '2') matchesLevel = codLen === 2;
        else if (window.currentLevelFilter === '4') matchesLevel = codLen === 4;
        else if (window.currentLevelFilter === 'sub') matchesLevel = codLen >= 6;

        // 3. Búsqueda con soporte para subcuentas hijas en O(1)
        let matchesSearch = true;
        if (searchTermLower !== '') {
            const itemIdStr = String(item.id || '');
            matchesSearch = directMatchedSet.has(itemIdStr);
            if (!matchesSearch) {
                for (let i = 0; i < prefixLengths.length; i++) {
                    const pLen = prefixLengths[i];
                    if (itemIdStr.length > pLen && directMatchedSet.has(itemIdStr.substring(0, pLen))) {
                        matchesSearch = true;
                        break;
                    }
                }
            }
        }

        return matchesCat && matchesLevel && matchesSearch;
    });

    if (countBadge) {
        countBadge.textContent = `${filtered.length.toLocaleString()} cuentas`;
    }

    const displayed = filtered.slice(0, window.catalogRenderLimit);

    const escHtml = (window.EduSec && window.EduSec.escapeHtml) ? window.EduSec.escapeHtml : (v => String(v ?? ''));
    const escJs = (window.EduSec && window.EduSec.jsArg) ? window.EduSec.jsArg : (v => `'${String(v ?? '').replace(/'/g, "\\'")}'`);
    const highlightRegex = searchTermLower !== ''
        ? new RegExp(`(${searchTermLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
        : null;

    let html = displayed.length ? displayed.map(item => {
        const cod = String(item.id || '');
        const codLen = cod.length;
        let levelClass = 'level-4';
        let indentClass = 'pl-10';
        let levelIcon = '<i class="fas fa-file-lines text-slate-400 text-[10px] mr-2"></i>';

        if (codLen === 1) {
            levelClass = 'level-1';
            indentClass = 'pl-3 font-extrabold';
            levelIcon = '<i class="fas fa-folder text-indigo-500 text-xs mr-2"></i>';
        } else if (codLen === 2) {
            levelClass = 'level-2';
            indentClass = 'pl-5 font-bold';
            levelIcon = '<i class="fas fa-folder-open text-sky-400 text-xs mr-2"></i>';
        } else if (codLen === 4) {
            levelClass = 'level-3';
            indentClass = 'pl-7 font-semibold';
            levelIcon = '<i class="fas fa-file-invoice text-emerald-400 text-xs mr-2"></i>';
        }

        const safeIdHtml = escHtml(item.id || '');
        const safeIdJs = escJs(item.id || '');
        const safeName = escHtml(item.name || '');
        const safeRubro = escHtml(item.rubro || '');
        const safeCat = escHtml(item.cat || '');
        const safeCatClass = escHtml(String(item.cat || '').toLowerCase().replace(/[^a-z0-9_-]/g, ''));

        const isActive = String(item.id) === String(window.currentSelectedAccountId);
        const activeClass = isActive ? 'catalog-row-active' : '';

        // Resaltar coincidencias de búsqueda en el nombre
        let displayName = safeName;
        if (highlightRegex && !displayName.toLowerCase().includes('<mark')) {
            displayName = displayName.replace(highlightRegex, '<mark class="bg-indigo-500/30 text-indigo-300 rounded px-0.5">$1</mark>');
        }

        return `
        <tr tabindex="0" class="catalog-row ${levelClass} ${activeClass} border-b border-slate-100/5 dark:border-slate-800/20 transition-all select-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            onclick="selectCatalogAccount(${safeIdJs}, true)"
            onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectCatalogAccount(${safeIdJs}, true);}"
            data-item-id="${safeIdHtml}" data-item-name="${safeName}" data-item-rubro="${safeRubro}" data-item-cat="${safeCat}">
            <td class="py-3 px-4 tabular-nums font-mono font-bold text-xs">
                <div class="flex items-center gap-1.5">
                    <span class="text-indigo-600 dark:text-indigo-400">${safeIdHtml}</span>
                    <button onclick="copyCatalogCode(${safeIdJs}, event)" class="catalog-copy-btn" title="Copiar código">
                        <i class="far fa-copy text-[10px]"></i>
                    </button>
                </div>
            </td>
            <td class="py-3 px-4 ${indentClass}">
                <div class="flex items-center">
                    ${levelIcon}
                    <span class="cat-row-name truncate text-slate-800 dark:text-slate-200">${displayName}</span>
                </div>
            </td>
            <td class="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 truncate">${safeRubro || 'N/A'}</td>
            <td class="py-3 px-4 text-center">
                <span class="cat-tag tag-${safeCatClass}">${safeCat}</span>
            </td>
        </tr>
        `;
    }).join('') : `
        <tr>
            <td colspan="4" class="py-16 text-center text-slate-400 dark:text-slate-500 font-bold bg-transparent">
                <div class="flex flex-col items-center justify-center gap-2">
                    <i class="fas fa-search text-3xl opacity-30 text-indigo-400"></i>
                    <span>No se encontraron cuentas contables con esos criterios.</span>
                    <button onclick="clearCatalogSearch(); setCatalogLevelFilter('all');" class="mt-2 text-xs text-indigo-500 hover:underline font-bold">
                        Limpiar filtros y ver todas
                    </button>
                </div>
            </td>
        </tr>
    `;

    if (filtered.length > window.catalogRenderLimit) {
        html += `
        <tr>
            <td colspan="4" class="py-5 text-center">
                <button onclick="window.catalogRenderLimit += 150; filterCatalog(null, true);" class="px-6 py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-full font-bold text-xs uppercase tracking-wide transition-all border border-indigo-200/50 dark:border-indigo-800/50 shadow-sm">
                    Cargar más (${(filtered.length - window.catalogRenderLimit).toLocaleString()} restantes) <i class="fas fa-chevron-down ml-1"></i>
                </button>
            </td>
        </tr>
        `;
    }

    tbody.innerHTML = html;

    // Asegurar que haya una cuenta seleccionada inmediatamente (Ficha nunca vacía)
    if (displayed.length > 0) {
        const stillPresent = displayed.find(x => String(x.id) === String(window.currentSelectedAccountId));
        if (!stillPresent) {
            window.selectCatalogAccount(displayed[0].id, false);
        }
    }
};

/**
 * Migas de Pan (Breadcrumbs)
 */
window.renderCatalogBreadcrumbs = function(currentSearch) {
    const container = document.getElementById('catalog-breadcrumbs');
    if (!container) return;
    const searchTrim = String(currentSearch || '').trim();
    if (!searchTrim || !/^\d+$/.test(searchTrim)) {
        container.innerHTML = '';
        container.classList.add('hidden');
        return;
    }

    const escHtml = (window.EduSec && window.EduSec.escapeHtml) ? window.EduSec.escapeHtml : (v => String(v ?? ''));
    const escJs = (window.EduSec && window.EduSec.jsArg) ? window.EduSec.jsArg : (v => `'${String(v ?? '').replace(/'/g, "\\'")}'`);
    const lengths = [1, 2, 4, 6, 8, 10];
    let breadcrumbsHtml = `<button onclick="clearCatalogSearch()" class="hover:text-indigo-600 text-slate-400 transition-colors flex items-center gap-1" title="Volver al inicio"><i class="fas fa-home"></i> Catálogo</button>`;

    if (typeof CATALOGO_MAESTRO !== 'undefined') {
        for (let len of lengths) {
            if (searchTrim.length >= len) {
                const levelId = searchTrim.substring(0, len);
                const matchedItem = CATALOGO_MAESTRO.find(i => String(i.id) === levelId);
                if (matchedItem) {
                    const safeLevelIdJs = escJs(levelId);
                    const safeMatchedName = escHtml(matchedItem.name || '');
                    breadcrumbsHtml += `
                        <i class="fas fa-chevron-right text-[8px] text-slate-300 dark:text-slate-600"></i>
                        <button onclick="filterCatalog(${safeLevelIdJs})" class="hover:text-indigo-600 transition-colors ${searchTrim === levelId ? 'text-indigo-600 font-black' : ''}">${safeMatchedName}</button>
                    `;
                }
            } else {
                break;
            }
        }
    }

    container.innerHTML = breadcrumbsHtml;
    container.classList.remove('hidden');
};

/**
 * Pestañas y animación del indicador deslizante
 */
let currentCatalogTabIndex = 0;
let catalogSnapTimeout = null;

window.moveCatalogTab = function(btn, newIndex, animate = true) {
    const pill = document.getElementById('catalog-tab-indicator');
    if (!pill || !btn) return;

    if (catalogSnapTimeout) {
        clearTimeout(catalogSnapTimeout);
        catalogSnapTimeout = null;
    }

    if (btn.offsetWidth === 0) {
        requestAnimationFrame(() => {
            if (btn.offsetWidth > 0) window.moveCatalogTab(btn, newIndex, animate);
        });
        return;
    }

    const distance = Math.abs(newIndex - currentCatalogTabIndex);
    const stretch = (animate && distance > 0) ? (1 + Math.min(distance * 0.15, 0.35)) : 1;

    if (!animate) {
        pill.style.transition = 'none';
    }

    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.opacity = '1';

    if (animate && distance > 0) {
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(${stretch}) scaleY(0.9)`;
        catalogSnapTimeout = setTimeout(() => {
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

    currentCatalogTabIndex = newIndex;
};

window.updateCatalogTabIndicator = function(animate = true) {
    const activeBtn = document.querySelector('.cat-filter-btn.active');
    if (activeBtn) {
        const idx = activeBtn.dataset.idx ? parseInt(activeBtn.dataset.idx, 10) : 0;
        window.moveCatalogTab(activeBtn, idx, animate);
    }
};

window.clearCatalogSearch = function() {
    const input = document.getElementById('catalog-search');
    if (input) input.value = '';
    const btnClear = document.getElementById('catalog-clear-search');
    if (btnClear) btnClear.classList.add('hidden');
    window.filterCatalog();
};

/**
 * Utilidades de Portapapeles
 */
window.copyCatalogCode = function(code, event) {
    if (event) {
        event.stopPropagation();
        const btn = event.currentTarget;
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-check text-emerald-500 scale-125 transition-all';
                setTimeout(() => { icon.className = 'far fa-copy scale-100 transition-all'; }, 1500);
            }
        }
    }
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(code);
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = code;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try { document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(textArea);
    }
};

window.copyFullAccountCard = function(id, event) {
    if (event) {
        event.stopPropagation();
        const btn = event.currentTarget;
        if (btn) {
            const originalHtml = btn.innerHTML;
            btn.innerHTML = `<i class="fas fa-check text-emerald-500 text-xs"></i> ¡Copiado!`;
            setTimeout(() => { btn.innerHTML = originalHtml; }, 1600);
        }
    }
    if (!id || typeof CATALOGO_MAESTRO === 'undefined') return;
    const item = CATALOGO_MAESTRO.find(x => String(x.id) === String(id));
    if (!item) return;

    const data = getCuentaPedagogicaData(item);
    const textToCopy = `[${data.id}] ${data.name.toUpperCase()}
Rubro: ${data.rubro} | Sector: ${data.cat}
Naturaleza: ${data.naturaleza} (Saldo Habitual: ${data.saldoHabitual})
Normativa: ${data.normaNombre}
Ejemplo Práctico: ${data.asiento.concepto}
-- EduConta SV (Catálogo Maestro) --`;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy);
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try { document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(textArea);
    }
};

/**
 * Control del Cajón / Sheet Móvil
 */
window.openCatalogMobileInspector = function() {
    const backdrop = document.getElementById('catalog-drawer-backdrop');
    const drawer = document.getElementById('catalog-drawer');
    if (!backdrop || !drawer) return;

    backdrop.classList.remove('hidden');
    void backdrop.offsetWidth;
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    drawer.classList.remove('drawer-closed');
    drawer.classList.add('drawer-open');
};

window.closeCatalogDrawer = function() {
    const backdrop = document.getElementById('catalog-drawer-backdrop');
    const drawer = document.getElementById('catalog-drawer');
    if (!backdrop || !drawer) return;

    backdrop.classList.add('opacity-0', 'pointer-events-none');
    drawer.classList.remove('drawer-open');
    drawer.classList.add('drawer-closed');

    setTimeout(() => {
        backdrop.classList.add('hidden');
    }, 300);
};

// Compatibilidad hacia atrás
window.openCatalogDrawer = function(id) {
    window.selectCatalogAccount(id, true);
};
