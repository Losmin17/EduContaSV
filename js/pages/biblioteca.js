/**
 * Biblioteca Contable Integral - EduConta SV
 * Versión 2.0 (2026)
 * Gestión de Glosario Técnico, Métodos y Procedimientos Paso a Paso,
 * Leyes Sectoriales de El Salvador y Parámetros Fiscales Actualizados.
 */

// =============================================================================
// ESTADO GLOBAL DEL MÓDULO
// =============================================================================
let currentActiveTab = 'glosario';
let activeGlosarioCategory = 'all';
let activeGlosarioAlpha = 'all';
let activeScrollLetter = 'all';
let isAlphaFilterMode = false;
let activeLeyesCategory = 'all';
let activeSearchQuery = '';

// Datasets en memoria
let glosarioDataset = [];
let metodosDataset = [];
let leyesDataset = [];
let parametrosDataset = {};

// =============================================================================
// 1. DATASET DE TERMINOLOGÍAS CONTABLES (GLOSARIO TÉCNICO SV)
// Delegado a window.EDUCONTA_GLOSARIO_SEEDS (js/core/glosario-seeds.js)
// =============================================================================
const GLOSARIO_SEEDS = Array.isArray(window.EDUCONTA_GLOSARIO_SEEDS)
    ? window.EDUCONTA_GLOSARIO_SEEDS
    : [];

glosarioDataset = [...GLOSARIO_SEEDS];

// =============================================================================
// 2. DATASET DE MÉTODOS Y GUÍAS CONTABLES PASO A PASO (SV)
// =============================================================================
const METODOS_SEEDS = [
    {
        id: 'guia-planilla',
        titulo: 'Elaboración y Contabilización de Planilla de Sueldos',
        subtitulo: 'Cálculo de ISSS (3%), AFP (7.25%), Tabla de Renta MH D.L. 10 y aportes patronales.',
        categoria: 'Laboral y Planillas',
        icono: 'fa-users-cog',
        color: 'emerald',
        baseLegal: 'Código de Trabajo Art. 119+, Ley del ISSS, Ley SAP/AFP y Decreto No. 10 MH.',
        pasos: [
            {
                num: 1,
                titulo: 'Determinar el Total Devengado',
                desc: 'Sumar el salario base ordinario más las horas extras diurnas (recargo 100%), nocturnas (recargo 125%), días festivos laborados (recargo 150%) y bonificaciones.',
                formula: 'Total Devengado = Salario Base + Horas Extras + Bonos'
            },
            {
                num: 2,
                titulo: 'Calcular Retención Laboral de ISSS (3.0%)',
                desc: 'Aplicar la tasa del 3.0% sobre el devengado con un tope salarial máximo de $1,000.00 mensuales. La retención máxima laboral no puede exceder los $30.00.',
                formula: 'ISSS Laboral = MIN(Devengado, $1,000.00) × 3.0%'
            },
            {
                num: 3,
                titulo: 'Calcular Retención Laboral de AFP (7.25%)',
                desc: 'Aplicar el 7.25% sobre el total devengado. En El Salvador, la cotización de pensión NO tiene límite máximo de techo.',
                formula: 'AFP Laboral = Total Devengado × 7.25%'
            },
            {
                num: 4,
                titulo: 'Determinar la Base Imponible de Renta (ISR)',
                desc: 'Restar al total devengado las retenciones de seguridad social laboral (ISSS y AFP). El monto resultante es la base imponible.',
                formula: 'Base Gravada ISR = Total Devengado - ISSS Laboral - AFP Laboral'
            },
            {
                num: 5,
                titulo: 'Aplicar Tabla Mensual de Retención de ISR (Decreto 10)',
                desc: 'Ubicar la base gravada en el tramo correspondiente: Tramo I (Hasta $550.00 = Exento); Tramo II ($550.01 a $895.24 = 10% s/exceso $550 + $17.67); Tramo III ($895.25 a $2,038.10 = 20% s/exceso $895.24 + $60.00); Tramo IV (Más de $2,038.10 = 30% s/exceso $2,038.10 + $288.57).'
            },
            {
                num: 6,
                titulo: 'Calcular el Salario Líquido a Pagar',
                desc: 'Descontar del total devengado todas las retenciones de ley y otros descuentos autorizados por el empleado.',
                formula: 'Salario Líquido = Total Devengado - (ISSS + AFP + ISR + Otros Descuentos)'
            },
            {
                num: 7,
                titulo: 'Calcular Aportes Patronales',
                desc: 'Calcular ISSS Patronal del 7.5% (con tope de $1,000.00 -> Máximo $75.00) y AFP Patronal del 8.75% sobre el total devengado.',
                formula: 'ISSS Patronal = MIN(Devengado, $1,000) × 7.5% | AFP Patronal = Devengado × 8.75%'
            },
            {
                num: 8,
                titulo: 'Asiento Contable de Planilla',
                desc: 'Cargar las cuentas de Gastos de Operación (Sueldos y Aportes Patronales) y abonar las cuentas de Pasivo por Retenciones y Efectivo/Bancos.'
            }
        ],
        partidaTipo: `--------------------------------------------------------------------------------
PARTIDA DE DIARIO: PAGO Y PROVISIÓN DE PLANILLA
--------------------------------------------------------------------------------
CUENTA                                               DEBE ($)         HABER ($)
--------------------------------------------------------------------------------
5101 GASTOS DE ADMINISTRACIÓN                        $ 1,000.00
     510101 Sueldos y Salarios                       $   800.00
     510102 Aporte Patronal ISSS (7.5%)              $    60.00
     510103 Aporte Patronal AFP (8.75%)              $    70.00
     510104 Horas Extras                             $    70.00
2103 RETENCIONES Y DESCUENTOS POR PAGAR                               $   249.00
     210301 ISSS por Pagar (3% lab + 7.5% pat)                        $    84.00
     210302 AFP por Pagar (7.25% lab + 8.75% pat)                     $   128.00
     210303 Impuesto sobre la Renta Retenido                          $    37.00
1101 EFECTIVO Y EQUIVALENTES (Bancos)                                 $   751.00
     110102 Cuenta Corriente
--------------------------------------------------------------------------------
SUMAS IGUALES                                       $ 1,000.00        $ 1,000.00
Concepto: Registro y pago de planilla del personal correspondiente al mes.`
    },
    {
        id: 'guia-iva',
        titulo: 'Liquidación Mensual de IVA y Declaración F-07',
        subtitulo: 'Compensación de Débito Fiscal vs. Crédito Fiscal, Retenciones 1% y Percepciones.',
        categoria: 'Tributaria y Fiscal',
        icono: 'fa-file-invoice-dollar',
        color: 'sky',
        baseLegal: 'Ley de Impuesto a la Transferencia de Bienes Muebles y Prestación de Servicios (IVA) Art. 64-72.',
        pasos: [
            {
                num: 1,
                titulo: 'Totalizar Débito Fiscal Mensual',
                desc: 'Sumar el 13% de IVA generado en todas las ventas y servicios del mes amparados en Comprobantes de Crédito Fiscal y Facturas de Consumidor Final.'
            },
            {
                num: 2,
                titulo: 'Totalizar Crédito Fiscal Mensual',
                desc: 'Sumar el 13% de IVA pagado en compras locales e importaciones destinadas a la actividad económica gravada con CCF válidos.'
            },
            {
                num: 3,
                titulo: 'Aplicar Retenciones y Percepciones',
                desc: 'Restar las retenciones de IVA (1%) sufridas (certificadas con Comprobante de Retención) y sumar/deducir las percepciones de IVA (1%) pagadas a Grandes Contribuyentes.'
            },
            {
                num: 4,
                titulo: 'Determinar Saldo a Pagar o Remanente',
                desc: 'Si Débito Fiscal > Crédito Fiscal = Impuesto a Pagar al Fisco. Si Crédito Fiscal > Débito Fiscal = Remanente de Crédito Fiscal a trasladar para el mes siguiente.'
            },
            {
                num: 5,
                titulo: 'Registro de la Partida Contable de Liquidación',
                desc: 'Saldar las cuentas de IVA Débito Fiscal (al Debe) e IVA Crédito Fiscal (al Haber) reconociendo la obligación tributaria en IVA por Pagar o el activo en Remanente.'
            }
        ],
        partidaTipo: `--------------------------------------------------------------------------------
PARTIDA DE DIARIO: LIQUIDACIÓN MENSUAL DEL IVA
--------------------------------------------------------------------------------
CUENTA                                               DEBE ($)         HABER ($)
--------------------------------------------------------------------------------
2108 DÉBITO FISCAL IVA (Cancelación mensual)         $ 3,900.00
1106 CRÉDITO FISCAL IVA (Cancelación mensual)                         $ 2,600.00
1107 RETENCIONES DE IVA SUFRIDAS (1%)                                 $    50.00
2109 IVA POR PAGAR (Impuesto neto liquidado F-07)                     $ 1,250.00
--------------------------------------------------------------------------------
SUMAS IGUALES                                       $ 3,900.00        $ 3,900.00
Concepto: Liquidación mensual de cuentas de IVA y determinación de impuesto a pagar en F-07.`
    },
    {
        id: 'guia-kardex',
        titulo: 'Valuación de Inventarios en Kardex (PEPS y Costo Promedio)',
        subtitulo: 'Control de entradas, salidas y valuación del Costo de Ventas según Art. 142 Código Tributario.',
        categoria: 'Costos e Inventarios',
        icono: 'fa-boxes-stacked',
        color: 'amber',
        baseLegal: 'Código Tributario Art. 142 y 143 / NIC 2 (Inventarios).',
        pasos: [
            {
                num: 1,
                titulo: 'Recepción de Mercaderías (Entradas)',
                desc: 'Registrar la cantidad y el costo unitario de adquisición sin IVA. En compras locales, tomar el valor neto del CCF.'
            },
            {
                num: 2,
                titulo: 'Actualización de Saldos en Costo Promedio',
                desc: 'Calcular el nuevo costo unitario ponderado: (Saldo en dinero anterior + Costo total de entrada) ÷ (Cantidad física anterior + Cantidad física de entrada).'
            },
            {
                num: 3,
                titulo: 'Control de Lotes en Método PEPS',
                desc: 'Mantener las existencias segregadas por capas o lotes cronológicos de adquisición con su costo unitario original respectivo.'
            },
            {
                num: 4,
                titulo: 'Registro de Despacho / Venta (Salidas)',
                desc: 'En Costo Promedio, multiplicar las unidades vendidas por el costo promedio vigente. En PEPS, agotar primero las capas más antiguas de compra.'
            },
            {
                num: 5,
                titulo: 'Asiento Contable de Costo de Ventas',
                desc: 'Cargar a Costo de Ventas y abonar a Inventarios de Mercaderías por el valor total obtenido en el Kardex.'
            }
        ],
        partidaTipo: `--------------------------------------------------------------------------------
PARTIDA DE DIARIO: RECONOCIMIENTO DE COSTO DE VENTAS
--------------------------------------------------------------------------------
CUENTA                                               DEBE ($)         HABER ($)
--------------------------------------------------------------------------------
4101 COSTO DE VENTAS                                 $ 4,500.00
     410101 Mercadería para la Venta
1105 INVENTARIOS                                                      $ 4,500.00
     110501 Mercadería en Existencia (Kardex)
--------------------------------------------------------------------------------
SUMAS IGUALES                                       $ 4,500.00        $ 4,500.00
Concepto: Registro del costo de mercadería vendida según reporte auxiliar de Kardex.`
    },
    {
        id: 'guia-depreciacion',
        titulo: 'Depreciación de Activos Fijos (Línea Recta Art. 30 LISR)',
        subtitulo: 'Porcentajes máximos de ley, vida útil y contabilización mensual de la depreciación acumulada.',
        categoria: 'Contabilidad Financiera',
        icono: 'fa-building',
        color: 'emerald',
        baseLegal: 'Ley de Impuesto sobre la Renta Art. 30 / NIC 16 (Propiedad, Planta y Equipo).',
        pasos: [
            {
                num: 1,
                titulo: 'Determinar el Costo Histórico del Activo',
                desc: 'Precio de adquisición más fletes, aranceles, seguros y gastos necesarios de instalación para poner el activo en operación (sin IVA).'
            },
            {
                num: 2,
                titulo: 'Identificar la Categoría Legal y Tasa Máxima',
                desc: 'Edificaciones: 5% anual (20 años); Maquinaria y Mobiliario: 20% anual (5 años); Vehículos: 25% anual (4 años); Equipo de Cómputo: 50% anual (2 años).'
            },
            {
                num: 3,
                titulo: 'Calcular la Cuota Mensual de Depreciación',
                desc: 'Dividir la cuota anual (Costo Histórico × % Legal) entre 12 meses.'
            },
            {
                num: 4,
                titulo: 'Registro de la Partida Mensual',
                desc: 'Cargar a Gastos de Depreciación (Administración o Venta) y abonar a Depreciación Acumulada (cuenta complementaria de activo).'
            }
        ],
        partidaTipo: `--------------------------------------------------------------------------------
PARTIDA DE DIARIO: DEPRECIACIÓN MENSUAL DE VEHÍCULO ($24,000 @ 25%)
--------------------------------------------------------------------------------
CUENTA                                               DEBE ($)         HABER ($)
--------------------------------------------------------------------------------
5101 GASTOS DE ADMINISTRACIÓN                        $   500.00
     510115 Gasto por Depreciación de Vehículos
1202 DEPRECIACIÓN ACUMULADA (Complementaria Activo)                   $   500.00
     120203 Depreciación Acumulada de Vehículos
--------------------------------------------------------------------------------
SUMAS IGUALES                                       $   500.00        $   500.00
Concepto: Depreciación mensual del vehículo de reparto ($24,000 × 25% = $6,000 anual ÷ 12 = $500/mes).`
    },
    {
        id: 'guia-cierre',
        titulo: 'Proceso de Cierre Contable del Ejercicio Anual',
        subtitulo: 'Cancelación de cuentas de resultados, cálculo de Reserva Legal (7%) y provisión de ISR.',
        categoria: 'Contabilidad Financiera',
        icono: 'fa-scale-balanced',
        color: 'indigo',
        baseLegal: 'Código de Comercio Art. 123 y 440 / Ley de Impuesto sobre la Renta.',
        pasos: [
            {
                num: 1,
                titulo: 'Elaborar Balanza de Comprobación Ajustada',
                desc: 'Asegurar que todas las partidas de ajuste (depreciaciones, amortizaciones, provisiones de aguinaldo y ajustes de inventario) estén contabilizadas al 31 de diciembre.'
            },
            {
                num: 2,
                titulo: 'Liquidar Cuentas de Ingresos',
                desc: 'Cargar todas las cuentas de ingresos (Ventas, Otros Ingresos) y abonar a la cuenta liquidadora "Pérdidas y Ganancias".'
            },
            {
                num: 3,
                titulo: 'Liquidar Cuentas de Costos y Gastos',
                desc: 'Cargar a "Pérdidas y Ganancias" y abonar todas las cuentas de egreso (Costo de Ventas, Gastos de Administración, Venta y Financieros).'
            },
            {
                num: 4,
                titulo: 'Calcular la Reserva Legal (7%)',
                desc: 'Si hay utilidad contable en Sociedades Anónimas o de R.L., calcular el 7% de Reserva Legal según Art. 123 C.Com. (hasta el 20% del capital social).'
            },
            {
                num: 5,
                titulo: 'Calcular Provisión de Impuesto sobre la Renta (30% / 25%)',
                desc: 'Calcular el ISR anual (30% para rentas gravadas > $150k o 25% para ≤ $150k) conciliando las rentas no gravables y gastos no deducibles.'
            },
            {
                num: 6,
                titulo: 'Traslado a Utilidad Neta en Balance General',
                desc: 'Saldar Pérdidas y Ganancias trasladando la Utilidad Neta del Ejercicio a la cuenta de Patrimonio del Balance General.'
            }
        ],
        partidaTipo: `--------------------------------------------------------------------------------
PARTIDA DE DIARIO: DISTRIBUCIÓN DE UTILIDAD Y RESERVAS AL CIERRE
--------------------------------------------------------------------------------
CUENTA                                               DEBE ($)         HABER ($)
--------------------------------------------------------------------------------
6101 PÉRDIDAS Y GANANCIAS (Saldo acreedor utilidad)  $ 50,000.00
3102 RESERVA LEGAL (7% según Art. 123 C.Com.)                         $  3,500.00
2105 IMPUESTO SOBRE LA RENTA POR PAGAR (30%)                          $ 15,000.00
3103 UTILIDAD NETA DEL EJERCICIO (Al Patrimonio)                      $ 31,500.00
--------------------------------------------------------------------------------
SUMAS IGUALES                                       $ 50,000.00        $ 50,000.00
Concepto: Liquidación anual de Pérdidas y Ganancias, provisión de Reserva Legal e ISR.`
    },
    {
        id: 'guia-conciliacion',
        titulo: 'Conciliación Bancaria Mensual',
        subtitulo: 'Procedimiento de cotejo de estado de cuenta bancario vs. libro auxiliar de bancos.',
        categoria: 'Contabilidad Financiera',
        icono: 'fa-building-columns',
        color: 'sky',
        baseLegal: 'Normas de Control Interno Contable / NIIF.',
        pasos: [
            {
                num: 1,
                titulo: 'Cotejo de Cheques y Transferencias',
                desc: 'Comparar los cheques emitidos en libros con los cheques cobrados en el estado bancario e identificar cheques en tránsito.'
            },
            {
                num: 2,
                titulo: 'Cotejo de Depósitos e Ingresos',
                desc: 'Identificar depósitos registrados en libros no acreditados aún por el banco (depósitos en tránsito).'
            },
            {
                num: 3,
                titulo: 'Identificar Notas de Débito y Crédito Bancarias',
                desc: 'Detectar cargos bancarios por comisiones, cuotas de préstamos o cheques devueltos (Notas de Débito) e intereses ganados o transferencias recibidas (Notas de Crédito).'
            },
            {
                num: 4,
                titulo: 'Cédula de Conciliación y Ajustes',
                desc: 'Elaborar la cédula de cuadre aritmético y registrar en el libro diario las partidas de ajuste por comisiones o intereses.'
            }
        ],
        partidaTipo: `--------------------------------------------------------------------------------
PARTIDA DE DIARIO: AJUSTE POR COMISIONES Y CARGOS BANCARIOS
--------------------------------------------------------------------------------
CUENTA                                               DEBE ($)         HABER ($)
--------------------------------------------------------------------------------
5103 GASTOS FINANCIEROS                              $    45.00
     510301 Comisiones Bancarias
1106 CRÉDITO FISCAL IVA (13% s/comisión)             $     5.85
1101 EFECTIVO Y EQUIVALENTES (Bancos)                                 $    50.85
     110102 Cuenta Corriente
--------------------------------------------------------------------------------
SUMAS IGUALES                                       $    50.85        $    50.85
Concepto: Registro de cargos bancarios identificados en la conciliación bancaria del mes.`
    }
];

// =============================================================================
// 3. DATASET DE LEYES SECTORIALES DE EL SALVADOR (DEFAULT / FALLBACK)
// =============================================================================
const LEYES_SEEDS = [
    // 1. Sector Financiero
    {
        id: 'ley-bancos',
        nombre: 'Ley de Bancos',
        abreviatura: 'Ley de Bancos',
        decreto_numero: 'Decreto Legislativo No. 700',
        categoria: 'Sector Financiero',
        fecha_publicacion: '1999-09-02',
        descripcion: 'Régimen legal para el funcionamiento de bancos comerciales, intermediación financiera, solvencia, encaje legal y presentación de estados financieros ante la SSF.'
    },
    {
        id: 'ley-seguros',
        nombre: 'Ley de Sociedades de Seguros',
        abreviatura: 'Ley Seguros',
        decreto_numero: 'Decreto Legislativo No. 844',
        categoria: 'Sector Financiero',
        fecha_publicacion: '1996-10-10',
        descripcion: 'Regula la constitución, organización, funcionamiento y solvencia de las sociedades de seguros y fianzas en El Salvador.'
    },
    {
        id: 'ley-bancos-coop',
        nombre: 'Ley de Bancos Cooperativos',
        abreviatura: 'Ley B. Coop.',
        decreto_numero: 'Decreto Legislativo No. 544',
        categoria: 'Sector Financiero',
        fecha_publicacion: '2001-07-27',
        descripcion: 'Régimen aplicable a las entidades financieras cooperativas y sociedades de ahorro y crédito supervisadas por la SSF.'
    },
    {
        id: 'ley-mercado-valores',
        nombre: 'Ley del Mercado de Valores',
        abreviatura: 'Ley M.V.',
        decreto_numero: 'Decreto Legislativo No. 809',
        categoria: 'Sector Financiero',
        fecha_publicacion: '1994-02-16',
        descripcion: 'Regula la oferta pública de valores, casas de corredores de bolsa, bolsas de valores y mecanismos de negociación bursátil.'
    },

    // 2. Normas Contables
    {
        id: 'nic-disposiciones',
        nombre: 'Disposiciones de las NIC',
        abreviatura: 'NIC / IASB',
        decreto_numero: 'Normas Internacionales de Contabilidad',
        categoria: 'Normas Contables',
        fecha_publicacion: '2005-01-01',
        descripcion: 'Marco técnico internacional de directrices contables para reconocimiento, medición y presentación de estados financieros.'
    },
    {
        id: 'niif-pymes',
        nombre: 'NIIF para PYMES',
        abreviatura: 'NIIF PYMES',
        decreto_numero: 'Resolución CVPCPA',
        categoria: 'Normas Contables',
        fecha_publicacion: '2015-01-01',
        descripcion: 'Norma técnica contable oficial adoptada en El Salvador por el Consejo de Vigilancia de la Profesión de Contaduría Pública.'
    },
    {
        id: 'etica-contador',
        nombre: 'Principios Éticos del Contador',
        abreviatura: 'Código de Ética',
        decreto_numero: 'Resolución CVPCPA / IESBA',
        categoria: 'Normas Contables',
        fecha_publicacion: '2018-01-01',
        descripcion: 'Código de ética profesional de estricto cumplimiento para contadores públicos y auditores certificados de El Salvador.'
    },
    {
        id: 'cvpcpa-pronunciamientos',
        nombre: 'Pronunciamientos del CVPCPA',
        abreviatura: 'CVPCPA',
        decreto_numero: 'Resoluciones Oficiales CVPCPA',
        categoria: 'Normas Contables',
        fecha_publicacion: '2020-01-01',
        descripcion: 'Acuerdos de adopción técnica, circulares normativas y guías de aplicación contable y de auditoría en El Salvador.'
    },

    // 3. Administración Pública
    {
        id: 'ley-safi',
        nombre: 'Ley AFI (Adm. Financiera)',
        abreviatura: 'Ley SAFI',
        decreto_numero: 'Decreto Legislativo No. 516',
        categoria: 'Administración Pública',
        fecha_publicacion: '1995-11-23',
        descripcion: 'Regula los subsistemas de Presupuesto, Tesorería, Crédito Público y Contabilidad Gubernamental para el sector público salvadoreño.'
    },
    {
        id: 'ley-servicio-civil',
        nombre: 'Ley del Servicio Civil',
        abreviatura: 'L. Serv. Civil',
        decreto_numero: 'Decreto Legislativo No. 502',
        categoria: 'Administración Pública',
        fecha_publicacion: '1961-11-24',
        descripcion: 'Regula las relaciones entre el Estado salvadoreño y los servidores públicos, derechos laborales y régimen disciplinario.'
    },
    {
        id: 'ley-etica-gubernamental',
        nombre: 'Ley de Ética Gubernamental',
        abreviatura: 'L.E.G.',
        decreto_numero: 'Decreto Legislativo No. 876',
        categoria: 'Administración Pública',
        fecha_publicacion: '2011-12-07',
        descripcion: 'Norma el desempeño ético de la función pública, previene y sanciona actos de corrupción y conflictos de interés estatal.'
    },
    {
        id: 'ley-compras-publicas',
        nombre: 'Ley de Compras Públicas',
        abreviatura: 'LCP (DINAC)',
        decreto_numero: 'Decreto Legislativo No. 652',
        categoria: 'Administración Pública',
        fecha_publicacion: '2023-03-09',
        descripcion: 'Marco normativo que rige la contratación, licitación y adquisición de bienes, obras y servicios por el Estado salvadoreño.'
    },

    // 4. Derecho Mercantil
    {
        id: 'ley-comercio',
        nombre: 'Código de Comercio',
        abreviatura: 'C.Com.',
        decreto_numero: 'Decreto Legislativo No. 671',
        categoria: 'Derecho Mercantil',
        fecha_publicacion: '1970-05-08',
        descripcion: 'Regula los actos mercantiles, comerciantes, constitución de sociedades, libros obligatorios (Art. 435+) y Reserva Legal (Art. 123).'
    },
    {
        id: 'ley-sociedades',
        nombre: 'Ley de Sociedades',
        abreviatura: 'L. Sociedades',
        decreto_numero: 'Decreto Legislativo No. 828',
        categoria: 'Derecho Mercantil',
        fecha_publicacion: '2000-01-26',
        descripcion: 'Régimen de personería jurídica, firmas de auditoría contable y requerimientos para constitución de sociedades mercantiles.'
    },
    {
        id: 'ley-derechos-registro',
        nombre: 'Derechos de Registro',
        abreviatura: 'Der. Registro',
        decreto_numero: 'Decreto Legislativo No. 345',
        categoria: 'Derecho Mercantil',
        fecha_publicacion: '1995-06-08',
        descripcion: 'Ley de Tasas y Derechos por Servicios del Registro de Comercio del CNR para matrículas de empresa y balances contables.'
    },
    {
        id: 'ley-registro-comercio',
        nombre: 'Registro de Comercio',
        abreviatura: 'Reg. Comercio',
        decreto_numero: 'Decreto Legislativo No. 559',
        categoria: 'Derecho Mercantil',
        fecha_publicacion: '1973-10-18',
        descripcion: 'Regula las formalidades de inscripción y publicidad de actos jurídicos, contratos mercantiles y depósito de estados financieros.'
    },

    // 5. Derecho Laboral
    {
        id: 'ley-trabajo',
        nombre: 'Código de Trabajo',
        abreviatura: 'C.Trab.',
        decreto_numero: 'Decreto Legislativo No. 241',
        categoria: 'Derecho Laboral',
        fecha_publicacion: '1972-06-23',
        descripcion: 'Norma las relaciones laborales, salarios, horas extras (Art. 168), vacaciones (Art. 177), aguinaldo (Art. 196) e indemnizaciones.'
    },
    {
        id: 'ley-isss',
        nombre: 'Ley del Seguro Social (ISSS)',
        abreviatura: 'Ley ISSS',
        decreto_numero: 'Decreto Legislativo No. 1263',
        categoria: 'Derecho Laboral',
        fecha_publicacion: '1953-12-03',
        descripcion: 'Regula las cotizaciones de salud del 3.0% laboral y 7.5% patronal con techo cotizable de $1,000.00 mensuales en El Salvador.'
    },
    {
        id: 'ley-afp',
        nombre: 'Ley de Pensiones (AFP)',
        abreviatura: 'Ley SAP / AFP',
        decreto_numero: 'Decreto Legislativo No. 927',
        categoria: 'Derecho Laboral',
        fecha_publicacion: '1996-12-20',
        descripcion: 'Regula el Sistema de Ahorro para Pensiones: 7.25% retención laboral y 8.75% aporte patronal sin límite máximo cotizable.'
    },
    {
        id: 'ley-tramites-laborales',
        nombre: 'Trámites Administrativos',
        abreviatura: 'Reg. Min. Trabajo',
        decreto_numero: 'Decreto Ejecutivo No. 86',
        categoria: 'Derecho Laboral',
        fecha_publicacion: '2012-05-10',
        descripcion: 'Procedimientos y requerimientos ante el Ministerio de Trabajo, inspección laboral, contratos colectivos y seguridad ocupacional.'
    },

    // 6. Aduanas y Tributos
    {
        id: 'ley-aduanas',
        nombre: 'Leyes Aduaneras',
        abreviatura: 'L. Aduanas',
        decreto_numero: 'Decreto Legislativo No. 551 / CAUCA',
        categoria: 'Aduanas y Tributos',
        fecha_publicacion: '2001-09-20',
        descripcion: 'Régimen aduanero regional de importación, retaceos, DAI, tránsitos internacionales de mercaderías e infracciones tributarias.'
    },
    {
        id: 'ley-tributario',
        nombre: 'Código Tributario',
        abreviatura: 'Cód. Trib.',
        decreto_numero: 'Decreto Legislativo No. 230',
        categoria: 'Aduanas y Tributos',
        fecha_publicacion: '2000-12-14',
        descripcion: 'Marco general tributario, obligaciones formales (Art. 139), control de inventarios Kardex (Art. 142) y retenciones/percepciones (Art. 162-163).'
    },
    {
        id: 'ley-iva-isr',
        nombre: 'Ley del IVA / ISR',
        abreviatura: 'IVA & LISR',
        decreto_numero: 'D.L. 296 (IVA) & D.L. 134 (ISR)',
        categoria: 'Aduanas y Tributos',
        fecha_publicacion: '1992-07-24',
        descripcion: 'Leyes directas e indirectas que regulan el 13% de IVA (Crédito/Débito), Pago a Cuenta (1.75%) y tablas de retención de Renta.'
    },
    {
        id: 'ley-entes-reguladores',
        nombre: 'Entes Reguladores (SSF/CVPCPA)',
        abreviatura: 'Marco SSF/CVPCPA',
        decreto_numero: 'Leyes Orgánicas de Supervisión',
        categoria: 'Aduanas y Tributos',
        fecha_publicacion: '2011-01-27',
        descripcion: 'Marco legal que faculta la fiscalización de la DGII/Hacienda, Superintendencia del Sistema Financiero y Consejo de Vigilancia.'
    }
];

// =============================================================================
// 4. DATASET DE TABLAS Y PARÁMETROS FISCALES 2026 (EL SALVADOR)
// =============================================================================
const PARAMETROS_DATA = {
    salariosMinimos: [
        { sector: 'Comercio y Servicios', mensual: 365.00, diario: 12.17, hora: 1.52, vigencia: '2026' },
        { sector: 'Industria y Manufactura', mensual: 365.00, diario: 12.17, hora: 1.52, vigencia: '2026' },
        { sector: 'Maquila Textil y Confección', mensual: 359.16, diario: 11.97, hora: 1.50, vigencia: '2026' },
        { sector: 'Agropecuario (Café y Azúcar)', mensual: 272.66, diario: 9.09, hora: 1.14, vigencia: '2026' },
        { sector: 'Agropecuario (Otras labores)', mensual: 243.46, diario: 8.12, hora: 1.01, vigencia: '2026' }
    ],
    seguridadSocial: [
        { concepto: 'ISSS Laboral (Salud)', tasa: '3.0%', techo: '$1,000.00 / mes', retencionMax: '$30.00', detalle: 'Deducción en nómina al trabajador' },
        { concepto: 'ISSS Patronal (Salud)', tasa: '7.5%', techo: '$1,000.00 / mes', retencionMax: '$75.00', detalle: 'Aporte obligatorio patronal' },
        { concepto: 'AFP Laboral (Pensiones)', tasa: '7.25%', techo: 'Sin límite de techo', retencionMax: 'Proporcional', detalle: 'Deducción en nómina al trabajador' },
        { concepto: 'AFP Patronal (Pensiones)', tasa: '8.75%', techo: 'Sin límite de techo', retencionMax: 'Proporcional', detalle: 'Aporte obligatorio patronal (Total 16%)' }
    ],
    tablaRentaMensual: [
        { tramo: 'Tramo I', desde: 0.01, hasta: 550.00, porcentaje: 'Exento (0%)', sobreExceso: '$0.00', cuotaFija: '$0.00' },
        { tramo: 'Tramo II', desde: 550.01, hasta: 895.24, porcentaje: '10%', sobreExceso: '$550.00', cuotaFija: '$17.67' },
        { tramo: 'Tramo III', desde: 895.25, hasta: 2038.10, porcentaje: '20%', sobreExceso: '$895.24', cuotaFija: '$60.00' },
        { tramo: 'Tramo IV', desde: 2038.11, hasta: 999999.00, porcentaje: '30%', sobreExceso: '$2,038.10', cuotaFija: '$288.57' }
    ],
    tasasImpuestos: [
        { impuesto: 'IVA Débito / Crédito Fiscal', tasa: '13.0%', base: 'Ventas y servicios gravados', baseLegal: 'Ley de IVA Art. 54' },
        { impuesto: 'Retención IVA (Grandes Contrib.)', tasa: '1.0%', base: 'Compras de bienes/servicios ≥ $100.00', baseLegal: 'Código Tributario Art. 162' },
        { impuesto: 'Percepción IVA (Grandes Contrib.)', tasa: '1.0%', base: 'Ventas de bienes muebles ≥ $100.00', baseLegal: 'Código Tributario Art. 163' },
        { impuesto: 'Pago a Cuenta ISR (Mensual)', tasa: '1.75%', base: 'Ingresos brutos percibidos', baseLegal: 'Código Tributario Art. 151' },
        { impuesto: 'ISR Sociedades (Renta > $150k)', tasa: '30.0%', base: 'Renta imponible neta anual', baseLegal: 'Ley de ISR Art. 41' },
        { impuesto: 'ISR Sociedades (Renta ≤ $150k)', tasa: '25.0%', base: 'Renta imponible neta anual', baseLegal: 'Ley de ISR Art. 41' }
    ],
    depreciacionesLegales: [
        { bien: 'Edificaciones y Construcciones', tasaAnual: '5.0%', vidaUtil: '20 años', metodo: 'Línea Recta Art. 30 LISR' },
        { bien: 'Maquinaria, Mobiliario y Equipo', tasaAnual: '20.0%', vidaUtil: '5 años', metodo: 'Línea Recta Art. 30 LISR' },
        { bien: 'Vehículos y Medios de Transporte', tasaAnual: '25.0%', vidaUtil: '4 años', metodo: 'Línea Recta Art. 30 LISR' },
        { bien: 'Equipos de Cómputo y Software', tasaAnual: '50.0%', vidaUtil: '2 años', metodo: 'Línea Recta Art. 30 LISR' }
    ],
    prestacionesLaborales: [
        { concepto: 'Horas Extras Diurnas', recargo: '100% (2.0×)', base: 'Salario por hora ordinaria', baseLegal: 'Código de Trabajo Art. 169' },
        { concepto: 'Horas Extras Nocturnas', recargo: '125% (2.25×)', base: 'Salario hora con recargo nocturno', baseLegal: 'Código de Trabajo Art. 168' },
        { concepto: 'Días de Asueto y Festivos', recargo: '150% (2.50×)', base: 'Salario ordinario del día laborado', baseLegal: 'Código de Trabajo Art. 192' },
        { concepto: 'Vacación Anual Remunerada', recargo: '15 días + 30%', base: 'Salario devengado por año cumplido', baseLegal: 'Código de Trabajo Art. 177' },
        { concepto: 'Aguinaldo Legal Anual', recargo: '15 a 21 días', base: '1-3 años: 15d | 3-10a: 19d | >10a: 21d', baseLegal: 'Código de Trabajo Art. 196' },
        { concepto: 'Reserva Legal Sociedades', recargo: '7.0% anual', base: 'Utilidad neta (tope 20% capital social)', baseLegal: 'Código de Comercio Art. 123' }
    ]
};

// =============================================================================
// AJUSTE DINÁMICO DE POSICIONAMIENTO DE CONTENIDO & STICKY DOCKING
// =============================================================================
function updateLibraryContentOffset() {
    const headerGroup = document.getElementById('library-fixed-header-group');
    const contentArea = document.getElementById('library-content-area');
    if (!headerGroup || !contentArea) return;

    const rect = headerGroup.getBoundingClientRect();
    const bottom = rect.bottom;
    if (bottom > 0) {
        if (currentActiveTab === 'parametros') {
            contentArea.style.paddingTop = `${Math.ceil(bottom + 8)}px`;
            contentArea.style.paddingBottom = '0px';
        } else {
            contentArea.style.paddingTop = `${Math.ceil(bottom + 16)}px`;
            contentArea.style.paddingBottom = '';
        }
    }
}

let currentPinnedTitle = '';
let isScrollDockingScheduled = false;

function initStickySectionDocking() {
    const contentArea = document.getElementById('library-content-area');
    if (!contentArea) return;

    contentArea.addEventListener('scroll', onContentAreaScroll, { passive: true });
}

function onContentAreaScroll() {
    if (isScrollDockingScheduled) return;
    isScrollDockingScheduled = true;
    requestAnimationFrame(() => {
        updateStickyHeaderDocking();
        isScrollDockingScheduled = false;
    });
}

function updateStickyHeaderDocking() {
    const contentArea = document.getElementById('library-content-area');
    const headerGroup = document.getElementById('library-fixed-header-group');
    if (!contentArea || !headerGroup) return;

    const dockContainer = document.getElementById('header-pinned-dock');
    const dockText = document.getElementById('header-pinned-dock-text');
    const scrollTop = contentArea.scrollTop;

    // Si estamos al tope del scroll
    if (scrollTop < 40) {
        if (dockContainer && dockContainer.classList.contains('opacity-100')) {
            dockContainer.classList.remove('opacity-100', 'translate-y-0');
            dockContainer.classList.add('opacity-0', '-translate-y-1.5');
            currentPinnedTitle = '';
        }
        if (currentActiveTab === 'glosario') {
            const groupHeaders = contentArea.querySelectorAll('.glosario-group-header');
            groupHeaders.forEach((gh) => {
                gh.style.opacity = '1';
                gh.style.visibility = 'visible';
                gh.style.pointerEvents = 'auto';
            });
            if (!isAlphaFilterMode && activeScrollLetter !== 'all') {
                activeScrollLetter = 'all';
                buildAlphaBar();
            }
        }
        return;
    }

    const headerBottom = headerGroup.getBoundingClientRect().bottom;
    const readingZone = headerBottom + 60;

    let activeTitle = '';
    let activeLetter = '';

    if (currentActiveTab === 'glosario') {
        const groups = contentArea.querySelectorAll('.glosario-alpha-group');
        groups.forEach(group => {
            const rect = group.getBoundingClientRect();
            if (rect.top <= readingZone) {
                const id = group.id; // 'alpha-group-A'
                const letter = id.replace('alpha-group-', '');
                activeLetter = letter;
                activeTitle = `Letra ${letter}`;
            }
        });

        // Desvanecimiento suave animado de cabeceras sticky al desplazarse bajo las barras fijas superiores
        const groupHeaders = contentArea.querySelectorAll('.glosario-group-header');
        groupHeaders.forEach((gh) => {
            const rect = gh.getBoundingClientRect();

            if (rect.bottom <= headerBottom + 10) {
                // Rebasada completamente bajo el header fijo -> Ocultar
                gh.style.opacity = '0';
                gh.style.visibility = 'hidden';
                gh.style.pointerEvents = 'none';
            } else if (rect.top < headerBottom) {
                // Siendo empujada hacia arriba -> Desvanecer suavemente
                const progress = Math.max(0, Math.min(1, (rect.bottom - headerBottom) / rect.height));
                gh.style.opacity = progress.toFixed(2);
                gh.style.visibility = 'visible';
                gh.style.pointerEvents = 'none';
            } else {
                // Totalmente visible en pantalla
                gh.style.opacity = '1';
                gh.style.visibility = 'visible';
                gh.style.pointerEvents = 'auto';
            }
        });

        if (activeLetter && !isAlphaFilterMode && activeScrollLetter !== activeLetter) {
            activeScrollLetter = activeLetter;
            buildAlphaBar();
        }
    } else if (currentActiveTab === 'metodos') {
        const guideCards = contentArea.querySelectorAll('#metodos-guides-container .glass-card');
        guideCards.forEach(card => {
            const rect = card.getBoundingClientRect();
            if (rect.top <= readingZone) {
                const h4 = card.querySelector('h4');
                if (h4) activeTitle = h4.innerText.trim();
            }
        });
    } else if (currentActiveTab === 'leyes') {
        const lawSections = contentArea.querySelectorAll('#leyes-cards-container .glass-card');
        lawSections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= readingZone) {
                const h3 = section.querySelector('h3');
                if (h3) activeTitle = h3.innerText.trim();
            }
        });
    } else if (currentActiveTab === 'parametros') {
        const paramCards = contentArea.querySelectorAll('#parametros-cards-container .swiper-slide-active h4');
        if (paramCards.length > 0) {
            activeTitle = paramCards[0].innerText.trim();
        }
    }

    // Morphing / Reemplazo secuencial si existe dockContainer
    if (dockContainer && dockText) {
        if (activeTitle && activeTitle !== currentPinnedTitle) {
            currentPinnedTitle = activeTitle;
            dockText.style.opacity = '0';
            dockText.style.transform = 'translateY(3px)';

            setTimeout(() => {
                dockText.innerText = activeTitle;
                dockText.style.opacity = '1';
                dockText.style.transform = 'translateY(0)';
                dockContainer.classList.remove('opacity-0', '-translate-y-1.5');
                dockContainer.classList.add('opacity-100', 'translate-y-0');
            }, 100);
        } else if (!activeTitle) {
            dockContainer.classList.remove('opacity-100', 'translate-y-0');
            dockContainer.classList.add('opacity-0', '-translate-y-1.5');
            currentPinnedTitle = '';
        }
    }
}

// =============================================================================
// INICIALIZACIÓN DEL MÓDULO
// =============================================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initLibraryApp();
    });
} else {
    initLibraryApp();
}

async function initLibraryApp() {
    // Inicializar estado visual de pestañas de inmediato (no esperar carga de datos de red)
    switchLibraryTab(currentActiveTab || 'glosario', false);

    initStickySectionDocking();
    updateAlphaFilterButtonUI();

    // Offline-First: renderizar inmediatamente con semillas/localStorage y actualizar tras Promise.all de Supabase
    await loadAllLibraryData(() => {
        buildAlphaBar();
        renderGlosarioCards();
        renderMetodosGuides();
        renderLeyesCards();
        renderParametrosTables();
        updateLibraryTabIndicator(false);
        updateLibraryContentOffset();
    });

    buildAlphaBar();
    renderGlosarioCards();
    renderMetodosGuides();
    renderLeyesCards();
    renderParametrosTables();

    // Re-sincronizar el indicador de pestaña tras la carga y renderizado de datos
    updateLibraryTabIndicator(false);
    
    // Ajustar padding inicial del área de tarjetas
    updateLibraryContentOffset();
    requestAnimationFrame(() => updateLibraryContentOffset());

    // Observador reactivo de redimensionamiento para evitar cualquier solapamiento
    if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => {
            updateLibraryContentOffset();
            updateLibraryTabIndicator(false);
        });
        const headerGroup = document.getElementById('library-fixed-header-group');
        if (headerGroup) ro.observe(headerGroup);
    }

    // Sincronizar indicador si la ventana cambia de tamaño o cargan fuentes web
    window.addEventListener('resize', () => {
        updateLibraryTabIndicator(false);
    });
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            updateLibraryTabIndicator(false);
        });
    }
    // Cerrar modales al hacer clic en el backdrop/overlay
    const termModal = document.getElementById('term-detail-modal');
    if (termModal) {
        termModal.addEventListener('click', (e) => {
            if (e.target === termModal) closeTermModal();
        });
    }
    const lawModal = document.getElementById('law-detail-modal');
    if (lawModal) {
        lawModal.addEventListener('click', (e) => {
            if (e.target === lawModal) closeLawModal();
        });
    }
    window.addEventListener('resize', updateLibraryContentOffset);
}

function buildParametrosDataset(dynamicSalarios, dynamicSeguridad) {
    const salComercio = dynamicSalarios?.comercio !== undefined ? parseFloat(dynamicSalarios.comercio) : 365.00;
    const salIndustria = dynamicSalarios?.industria !== undefined ? parseFloat(dynamicSalarios.industria) : 365.00;
    const salMaquila = dynamicSalarios?.maquila !== undefined ? parseFloat(dynamicSalarios.maquila) : 359.16;
    const salAgro1 = dynamicSalarios?.agro1 !== undefined ? parseFloat(dynamicSalarios.agro1) : 272.66;
    const salAgro2 = dynamicSalarios?.agro2 !== undefined ? parseFloat(dynamicSalarios.agro2) : 243.46;

    const isssLab = dynamicSeguridad?.isss_laboral !== undefined ? parseFloat(dynamicSeguridad.isss_laboral) : 3.0;
    const isssPat = dynamicSeguridad?.isss_patronal !== undefined ? parseFloat(dynamicSeguridad.isss_patronal) : 7.5;
    const isssTecho = dynamicSeguridad?.isss_techo !== undefined ? parseFloat(dynamicSeguridad.isss_techo) : 1000.00;
    const afpLab = dynamicSeguridad?.afp_laboral !== undefined ? parseFloat(dynamicSeguridad.afp_laboral) : 7.25;
    const afpPat = dynamicSeguridad?.afp_patronal !== undefined ? parseFloat(dynamicSeguridad.afp_patronal) : 8.75;
    const ivaTasa = dynamicSeguridad?.iva !== undefined ? parseFloat(dynamicSeguridad.iva) : 13.0;
    const pagoCuentaTasa = dynamicSeguridad?.pago_cuenta !== undefined ? parseFloat(dynamicSeguridad.pago_cuenta) : 1.75;

    return {
        salariosMinimos: [
            { sector: 'Comercio y Servicios', mensual: salComercio, diario: salComercio / 30, hora: salComercio / 240, vigencia: '2026' },
            { sector: 'Industria y Manufactura', mensual: salIndustria, diario: salIndustria / 30, hora: salIndustria / 240, vigencia: '2026' },
            { sector: 'Maquila Textil y Confección', mensual: salMaquila, diario: salMaquila / 30, hora: salMaquila / 240, vigencia: '2026' },
            { sector: 'Agropecuario (Café y Azúcar)', mensual: salAgro1, diario: salAgro1 / 30, hora: salAgro1 / 240, vigencia: '2026' },
            { sector: 'Agropecuario (Otras labores)', mensual: salAgro2, diario: salAgro2 / 30, hora: salAgro2 / 240, vigencia: '2026' }
        ],
        seguridadSocial: [
            { concepto: 'ISSS Laboral (Salud)', tasa: `${isssLab.toFixed(1)}%`, techo: `$${isssTecho.toLocaleString('en-US', { minimumFractionDigits: 2 })} / mes`, retencionMax: `$${((isssTecho * isssLab) / 100).toFixed(2)}`, detalle: 'Deducción en nómina al trabajador' },
            { concepto: 'ISSS Patronal (Salud)', tasa: `${isssPat.toFixed(1)}%`, techo: `$${isssTecho.toLocaleString('en-US', { minimumFractionDigits: 2 })} / mes`, retencionMax: `$${((isssTecho * isssPat) / 100).toFixed(2)}`, detalle: 'Aporte obligatorio patronal' },
            { concepto: 'AFP Laboral (Pensiones)', tasa: `${afpLab.toFixed(2)}%`, techo: 'Sin límite de techo', retencionMax: 'Proporcional', detalle: 'Deducción en nómina al trabajador' },
            { concepto: 'AFP Patronal (Pensiones)', tasa: `${afpPat.toFixed(2)}%`, techo: 'Sin límite de techo', retencionMax: 'Proporcional', detalle: `Aporte obligatorio patronal (Total ${(afpLab + afpPat).toFixed(2)}%)` }
        ],
        tablaRentaMensual: [...PARAMETROS_DATA.tablaRentaMensual],
        tasasImpuestos: [
            { impuesto: 'IVA Débito / Crédito Fiscal', tasa: `${ivaTasa.toFixed(1)}%`, base: 'Ventas y servicios gravados', baseLegal: 'Ley de IVA Art. 54' },
            { impuesto: 'Retención IVA (Grandes Contrib.)', tasa: '1.0%', base: 'Compras de bienes/servicios ≥ $100.00', baseLegal: 'Código Tributario Art. 162' },
            { impuesto: 'Percepción IVA (Grandes Contrib.)', tasa: '1.0%', base: 'Ventas de bienes muebles ≥ $100.00', baseLegal: 'Código Tributario Art. 163' },
            { impuesto: 'Pago a Cuenta ISR (Mensual)', tasa: `${pagoCuentaTasa.toFixed(2)}%`, base: 'Ingresos brutos percibidos', baseLegal: 'Código Tributario Art. 151' },
            { impuesto: 'ISR Sociedades (Renta > $150k)', tasa: '30.0%', base: 'Renta imponible neta anual', baseLegal: 'Ley de ISR Art. 41' },
            { impuesto: 'ISR Sociedades (Renta ≤ $150k)', tasa: '25.0%', base: 'Renta imponible neta anual', baseLegal: 'Ley de ISR Art. 41' }
        ],
        depreciacionesLegales: [...PARAMETROS_DATA.depreciacionesLegales],
        prestacionesLaborales: [...PARAMETROS_DATA.prestacionesLaborales],
        maxSalario: Math.max(salComercio, salIndustria, salMaquila, salAgro1, salAgro2),
        totalAFP: (afpLab + afpPat).toFixed(1),
        ivaTasa: ivaTasa.toFixed(1)
    };
}

// Cargar datos (Supabase con Fallback local transparente y sincronización unificada)
async function loadAllLibraryData(onLocalReady = null) {
    // 1. Cargar semillas base (30 términos oficiales)
    const baseSeeds = (window.EDUCONTA_GLOSARIO_SEEDS && window.EDUCONTA_GLOSARIO_SEEDS.length > 0)
        ? window.EDUCONTA_GLOSARIO_SEEDS
        : GLOSARIO_SEEDS;

    let loadedGlosario = baseSeeds.map(t => (window.normalizeGlosarioTerm ? window.normalizeGlosarioTerm(t) : t));

    // 2. Caché local previo de localStorage
    try {
        const localCachedGlosario = localStorage.getItem('educonta_glosario_custom');
        if (localCachedGlosario) {
            const parsed = JSON.parse(localCachedGlosario);
            if (Array.isArray(parsed) && parsed.length > 0) {
                loadedGlosario = parsed.map(t => (window.normalizeGlosarioTerm ? window.normalizeGlosarioTerm(t) : t));
            }
        }
    } catch (e) {
        console.warn("Error leyendo glosario de localStorage:", e);
    }

    // 3. Cargar parámetros fiscales dinámicos de localStorage previo
    let dynamicSalarios = null;
    let dynamicSeguridad = null;

    try {
        const cachedParams = localStorage.getItem('educonta_parametros_fiscales');
        if (cachedParams) {
            const parsed = JSON.parse(cachedParams);
            if (parsed.salarios) dynamicSalarios = parsed.salarios;
            if (parsed.seguridadSocial) dynamicSeguridad = parsed.seguridadSocial;
        }
    } catch (e) {
        console.warn("Error leyendo parámetros de localStorage:", e);
    }

    // Inicializar con los 24 seeds oficiales distribuidos en las 6 categorías
    let seeds = LEYES_SEEDS.map(s => ({
        ...s,
        existsInDb: false,
        supabaseId: null
    }));

    glosarioDataset = loadedGlosario;
    metodosDataset = [...METODOS_SEEDS];
    leyesDataset = seeds;
    parametrosDataset = buildParametrosDataset(dynamicSalarios, dynamicSeguridad);

    if (typeof onLocalReady === 'function') {
        try {
            onLocalReady();
        } catch (e) {
            console.warn("Error en renderizado inicial local de Biblioteca:", e);
        }
    }

    const cloudStatus = document.getElementById('library-cloud-status');

    if (window.supabaseClient) {
        try {
            const [termsRes, leyesRes, paramsRes] = await Promise.all([
                window.supabaseClient.from('biblioteca_terminos').select('*').order('termino', { ascending: true }),
                window.supabaseClient.from('leyes').select('*').order('nombre', { ascending: true }),
                window.supabaseClient.from('parametros_fiscales').select('*')
            ]);

            // A. Términos de Glosario actualizados desde Supabase
            const { data: dbTerms, error: termsErr } = termsRes || {};
            if (!termsErr && dbTerms && dbTerms.length > 0) {
                glosarioDataset = dbTerms.map(t => (window.normalizeGlosarioTerm ? window.normalizeGlosarioTerm(t) : t));
                try {
                    localStorage.setItem('educonta_glosario_custom', JSON.stringify(glosarioDataset));
                } catch (e) {}
            }

            // B. Leyes de Supabase vinculadas con las 24 leyes semilla (sin duplicados)
            const { data: dbLeyes, error: leyesErr } = leyesRes || {};
            if (!leyesErr && dbLeyes && dbLeyes.length > 0) {
                dbLeyes.forEach(dbLaw => {
                    const normDb = (dbLaw.nombre || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                    const abbrevDb = (dbLaw.abreviatura || dbLaw.id || '').toUpperCase().trim();

                    const matchedSeed = seeds.find(seed => {
                        if (seed.id === dbLaw.id) return true;
                        const normSeed = seed.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                        const abbrevSeed = (seed.abreviatura || '').toUpperCase().trim();
                        return normDb === normSeed || 
                               normDb.includes(normSeed) || 
                               normSeed.includes(normDb) ||
                               (abbrevDb && abbrevDb.length >= 2 && (abbrevDb === abbrevSeed || abbrevDb === seed.id.toUpperCase()));
                    });

                    if (matchedSeed) {
                        matchedSeed.existsInDb = true;
                        matchedSeed.supabaseId = dbLaw.id;
                        if (dbLaw.decreto_numero) matchedSeed.decreto_numero = dbLaw.decreto_numero;
                        if (dbLaw.descripcion) matchedSeed.descripcion = dbLaw.descripcion;
                    } else {
                        seeds.push({
                            id: dbLaw.id,
                            nombre: dbLaw.nombre,
                            abreviatura: dbLaw.abreviatura || 'SV',
                            decreto_numero: dbLaw.decreto_numero || 'Legislación Oficial',
                            categoria: dbLaw.categoria || 'Normas Contables',
                            descripcion: dbLaw.descripcion || 'Normativa legal disponible en la base de datos.',
                            existsInDb: true,
                            supabaseId: dbLaw.id
                        });
                    }
                });
                leyesDataset = seeds;
            }

            // C. Parámetros fiscales de Supabase
            const { data: dbParams, error: paramsErr } = paramsRes || {};
            if (!paramsErr && dbParams && dbParams.length > 0) {
                dbParams.forEach(row => {
                    if (row.id === 'salarios_minimos' && row.datos) {
                        dynamicSalarios = row.datos;
                    }
                    if (row.id === 'seguridad_social' && row.datos) {
                        dynamicSeguridad = row.datos;
                    }
                });

                try {
                    localStorage.setItem('educonta_parametros_fiscales', JSON.stringify({
                        salarios: dynamicSalarios,
                        seguridadSocial: dynamicSeguridad
                    }));
                } catch (e) {}
            }

            if (cloudStatus) {
                cloudStatus.innerHTML = '<i class="fas fa-cloud-check text-emerald-500 text-[9px]"></i> Nube Activa (2026)';
            }
        } catch (e) {
            console.warn("EduConta Library: Modo Offline activo. Usando dataset local integrado.", e);
            if (cloudStatus) {
                cloudStatus.innerHTML = '<i class="fas fa-database text-emerald-500 text-[9px]"></i> Almacén Local Vigente';
            }
        }
    }

    parametrosDataset = buildParametrosDataset(dynamicSalarios, dynamicSeguridad);
}

// =============================================================================
// NAVEGACIÓN ENTRE PESTAÑAS (TABS)
// =============================================================================
let currentLibraryTabIndex = 0;
let libraryTabSnapTimeout = null;
const LIBRARY_TABS = ['glosario', 'metodos', 'leyes', 'parametros'];

function moveLibraryTab(btn, newIndex, animate = true) {
    const pill = document.getElementById('library-tab-indicator');
    if (!pill || !btn) return;

    if (libraryTabSnapTimeout) {
        clearTimeout(libraryTabSnapTimeout);
        libraryTabSnapTimeout = null;
    }

    // Si el botón no tiene dimensiones todavía (ej. pre-render), reintentar en el siguiente frame
    if (btn.offsetWidth === 0) {
        requestAnimationFrame(() => moveLibraryTab(btn, newIndex, animate));
        return;
    }

    const distance = Math.abs(newIndex - currentLibraryTabIndex);
    const stretch = (animate && distance > 0) ? (1 + Math.min(distance * 0.15, 0.35)) : 1;

    if (!animate) {
        pill.style.transition = 'none';
        pill.style.width = `${btn.offsetWidth}px`;
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(1) scaleY(1)`;
        pill.style.opacity = '1';
        void pill.offsetWidth;
        requestAnimationFrame(() => {
            pill.style.transition = '';
        });
        currentLibraryTabIndex = newIndex;
        return;
    }

    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.opacity = '1';

    if (distance > 0) {
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(${stretch}) scaleY(0.9)`;
        libraryTabSnapTimeout = setTimeout(() => {
            pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(1) scaleY(1)`;
            libraryTabSnapTimeout = null;
        }, 180);
    } else {
        pill.style.transform = `translateX(${btn.offsetLeft}px) scaleX(1) scaleY(1)`;
    }

    currentLibraryTabIndex = newIndex;
}
window.moveLibraryTab = moveLibraryTab;

function updateLibraryTabIndicator(animate = true) {
    const activeBtn = document.querySelector('.tab-btn-emerald.active');
    if (activeBtn) {
        const idx = activeBtn.dataset.idx ? parseInt(activeBtn.dataset.idx, 10) : 0;
        moveLibraryTab(activeBtn, idx, animate);
    }
}
window.updateLibraryTabIndicator = updateLibraryTabIndicator;

function switchLibraryTab(tabName, animate = true) {
    currentActiveTab = tabName;

    // Actualizar botones, paneles de contenido y controles flotantes de cabecera
    const tabs = ['glosario', 'metodos', 'leyes', 'parametros'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-btn-${t}`);
        const pane = document.getElementById(`tab-pane-${t}`);
        const controls = document.getElementById(`tab-controls-${t}`);

        if (t === tabName) {
            if (btn) {
                btn.classList.add('active');
                btn.classList.remove('text-slate-600', 'dark:text-slate-300');
                btn.classList.add('text-white');
            }
            if (pane) {
                pane.classList.remove('hidden');
                pane.style.display = (t === 'parametros') ? 'flex' : 'block';
            }
            if (controls) {
                controls.classList.remove('hidden');
                controls.style.display = 'block';
            }
        } else {
            if (btn) {
                btn.classList.remove('active');
                btn.classList.remove('text-white');
                btn.classList.add('text-slate-600', 'dark:text-slate-300');
            }
            if (pane) {
                pane.classList.add('hidden');
                pane.style.display = 'none';
            }
            if (controls) {
                controls.classList.add('hidden');
                controls.style.display = 'none';
            }
        }
    });

    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    if (activeBtn) {
        const idx = tabs.indexOf(tabName);
        moveLibraryTab(activeBtn, idx >= 0 ? idx : 0, animate);
        if (typeof activeBtn.scrollIntoView === 'function') {
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    // Recalcular offset inmediatamente y tras los siguientes frames de renderizado
    updateLibraryContentOffset();
    requestAnimationFrame(() => updateLibraryContentOffset());
    setTimeout(() => updateLibraryContentOffset(), 50);

    // Resetear scroll y controlar overflow vertical/horizontal
    const contentArea = document.getElementById('library-content-area');
    if (contentArea) {
        contentArea.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        contentArea.scrollLeft = 0;
        if (tabName === 'parametros') {
            contentArea.style.overflow = 'hidden';
            contentArea.style.overflowX = 'hidden';
            contentArea.style.overflowY = 'hidden';
            document.documentElement.scrollLeft = 0;
        } else {
            contentArea.style.overflowX = 'hidden';
            contentArea.style.overflowY = 'auto';
        }
    }

    // Resetear docking flotante
    const dockContainer = document.getElementById('header-pinned-dock');
    if (dockContainer) {
        dockContainer.classList.remove('opacity-100', 'translate-y-0');
        dockContainer.classList.add('opacity-0', '-translate-y-1.5');
        currentPinnedTitle = '';
    }

    // Si regresamos al glosario, restaurar visibilidad de cabeceras de letras y barra alfabética
    if (tabName === 'glosario') {
        if (contentArea) {
            const groupHeaders = contentArea.querySelectorAll('.glosario-group-header');
            groupHeaders.forEach((gh) => {
                gh.style.opacity = '1';
                gh.style.visibility = 'visible';
                gh.style.pointerEvents = 'auto';
            });
        }
        if (!isAlphaFilterMode) {
            activeScrollLetter = 'all';
            buildAlphaBar();
        }
    }

    // Si entramos a la pestaña de parámetros, actualizar el escenario 3D interactivo
    if (tabName === 'parametros') {
        setTimeout(() => {
            updateParametrosCarousel();
        }, 50);
    }

    // Re-evaluar búsqueda activa en la pestaña seleccionada
    if (activeSearchQuery) {
        handleLibrarySearch(activeSearchQuery);
    } else {
        setTimeout(() => initScrollReveal(), 50);
    }
}

// =============================================================================
// GESTOR DE BÚSQUEDA GLOBAL
// =============================================================================
let _librarySearchDebounceTimer = null;

function executeLibrarySearchRender() {
    if (currentActiveTab === 'glosario') {
        buildAlphaBar();
        renderGlosarioCards();
    } else if (currentActiveTab === 'metodos') {
        renderMetodosGuides();
    } else if (currentActiveTab === 'leyes') {
        renderLeyesCards();
    }
}

function handleLibrarySearch(query, immediate = false) {
    activeSearchQuery = String(query || '').toLowerCase().trim();
    const clearBtn = document.getElementById('clear-search-btn');
    if (clearBtn) {
        if (activeSearchQuery) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
    }

    if (_librarySearchDebounceTimer) {
        clearTimeout(_librarySearchDebounceTimer);
        _librarySearchDebounceTimer = null;
    }

    if (immediate || !activeSearchQuery) {
        executeLibrarySearchRender();
    } else {
        _librarySearchDebounceTimer = setTimeout(() => {
            executeLibrarySearchRender();
        }, 180);
    }
}

function clearLibrarySearch() {
    const input = document.getElementById('library-global-search');
    if (input) input.value = '';
    handleLibrarySearch('', true);
}

// =============================================================================
// PESTAÑA 1: RENDERIZADO Y FILTROS DEL GLOSARIO CONTABLE
// =============================================================================
function toggleAlphaFilterMode() {
    isAlphaFilterMode = !isAlphaFilterMode;
    updateAlphaFilterButtonUI();

    if (!isAlphaFilterMode) {
        // Al desactivar el filtro: mostramos todos los términos y habilitamos el scroll suave
        activeGlosarioAlpha = 'all';
        activeScrollLetter = 'all';
        buildAlphaBar();
        renderGlosarioCards();
    } else {
        // Al activar el filtro: si había una letra seleccionada la aplicamos o dejamos 'all'
        buildAlphaBar();
    }
}

function updateAlphaFilterButtonUI() {
    const btn = document.getElementById('btn-toggle-alpha-filter');
    if (!btn) return;

    if (isAlphaFilterMode) {
        btn.className = "shrink-0 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/25";
        btn.innerHTML = `<i class="fas fa-filter text-[10px]"></i> <span>Filtrar</span> <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>`;
        btn.title = "Modo Filtrar ACTIVO: Solo muestra términos de la letra elegida. Clic para desactivar y cambiar a modo desplazamiento.";
    } else {
        btn.className = "shrink-0 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/70 hover:border-emerald-500 hover:text-emerald-500";
        btn.innerHTML = `<i class="fas fa-filter text-[10px] opacity-60"></i> <span>Filtrar</span>`;
        btn.title = "Modo Filtrar DESACTIVADO: Desplaza la lista hacia la letra pulsada. Clic para activar filtro exclusivo.";
    }
}

function buildAlphaBar() {
    const alphaBar = document.getElementById('glosario-alpha-bar');
    if (!alphaBar) return;

    // Calcular qué letras tienen términos disponibles bajo los filtros de categoría y búsqueda activos
    const availableLetters = new Set();
    let totalAvailableCount = 0;

    glosarioDataset.forEach(item => {
        const matchCategory = activeGlosarioCategory === 'all' || item.categoria === activeGlosarioCategory;
        const matchSearch = !activeSearchQuery || 
            item.termino.toLowerCase().includes(activeSearchQuery) || 
            (item.definicion && item.definicion.toLowerCase().includes(activeSearchQuery)) ||
            (item.baseLegal && item.baseLegal.toLowerCase().includes(activeSearchQuery));

        if (matchCategory && matchSearch) {
            totalAvailableCount++;
            const letter = (item.letra || item.termino.charAt(0) || '').toUpperCase();
            if (letter) availableLetters.add(letter);
        }
    });

    const alphabet = ['TODOS', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    alphaBar.innerHTML = '';

    const currentSelected = isAlphaFilterMode ? activeGlosarioAlpha : activeScrollLetter;

    alphabet.forEach(letter => {
        const btn = document.createElement('button');
        const isAll = letter === 'TODOS';
        const isSelected = (isAll && currentSelected === 'all') || letter === currentSelected;
        const hasTerms = isAll ? (totalAvailableCount > 0) : availableLetters.has(letter);

        btn.className = `alpha-pill px-2.5 py-1 rounded-lg text-[11px] font-black uppercase transition-all shrink-0 ${
            isSelected
                ? 'active'
                : hasTerms
                    ? 'has-terms cursor-pointer'
                    : 'no-terms'
        }`;

        btn.innerText = letter;

        if (hasTerms || isAll) {
            btn.title = isAll ? `Ver todos los términos (${totalAvailableCount})` : `Letra ${letter}: ${availableLetters.has(letter) ? 'términos disponibles' : 'sin términos'}`;
            btn.onclick = () => filterGlosarioAlpha(isAll ? 'all' : letter);
        } else {
            btn.title = `Letra ${letter}: Sin términos registrados`;
            btn.onclick = () => {
                if (window.showToast) {
                    window.showToast(`No hay términos registrados con la letra "${letter}"`, "info");
                }
            };
        }

        alphaBar.appendChild(btn);
    });
}

function filterGlosarioCategory(category) {
    activeGlosarioCategory = category;

    // Actualizar UI chips
    const chips = document.querySelectorAll('#glosario-category-filters .category-chip');
    chips.forEach(chip => {
        if (chip.getAttribute('data-cat') === category) {
            chip.classList.add('active');
            chip.classList.remove('text-slate-600', 'dark:text-slate-400');
        } else {
            chip.classList.remove('active');
            chip.classList.add('text-slate-600', 'dark:text-slate-400');
        }
    });

    buildAlphaBar();
    renderGlosarioCards();
}

function filterGlosarioAlpha(letter) {
    const contentArea = document.getElementById('library-content-area');
    const headerGroup = document.getElementById('library-fixed-header-group');

    if (isAlphaFilterMode) {
        // MODO FILTRAR: Solo muestra los términos que inicien con dicha letra
        if (letter === 'all' || letter === 'TODOS') {
            activeGlosarioAlpha = 'all';
        } else {
            activeGlosarioAlpha = letter;
        }
        buildAlphaBar();
        renderGlosarioCards();

        // Scroll al tope del área de contenido
        if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        // MODO DESPLAZAMIENTO: Toda la lista permanece visible y se desplaza hacia la letra seleccionada
        activeScrollLetter = letter;
        buildAlphaBar();

        if (letter === 'all' || letter === 'TODOS') {
            if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const targetEl = document.getElementById(`alpha-group-${letter}`);
        if (contentArea && targetEl && headerGroup) {
            const headerBottom = headerGroup.getBoundingClientRect().bottom;
            const targetTop = targetEl.getBoundingClientRect().top;
            const delta = targetTop - (headerBottom + 16);
            const targetScroll = Math.max(0, contentArea.scrollTop + delta);

            contentArea.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
            });
        }
    }
}

function renderGlosarioCards() {
    const container = document.getElementById('glosario-cards-container');
    const counter = document.getElementById('glosario-results-count');
    if (!container) return;

    // Filtrar dataset
    let filtered = glosarioDataset.filter(item => {
        // Filtro por categoría
        const matchCategory = activeGlosarioCategory === 'all' || item.categoria === activeGlosarioCategory;
        // Filtro por letra
        const itemLetter = (item.letra || item.termino.charAt(0) || '').toUpperCase();
        const matchAlpha = activeGlosarioAlpha === 'all' || itemLetter === activeGlosarioAlpha.toUpperCase();
        // Filtro por búsqueda
        const matchSearch = !activeSearchQuery || 
            item.termino.toLowerCase().includes(activeSearchQuery) || 
            (item.definicion && item.definicion.toLowerCase().includes(activeSearchQuery)) ||
            (item.baseLegal && item.baseLegal.toLowerCase().includes(activeSearchQuery));

        return matchCategory && matchAlpha && matchSearch;
    });

    // Ordenar alfabéticamente
    filtered.sort((a, b) => a.termino.localeCompare(b.termino, 'es'));

    if (counter) {
        counter.innerText = `${filtered.length} término${filtered.length === 1 ? '' : 's'} contable${filtered.length === 1 ? '' : 's'} encontrado${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="py-16 text-center text-slate-400 dark:text-slate-500">
                <i class="fas fa-book-open text-4xl mb-3 opacity-40"></i>
                <p class="font-bold text-sm">No se encontraron términos que coincidan con los filtros.</p>
                <button onclick="filterGlosarioCategory('all'); filterGlosarioAlpha('all'); clearLibrarySearch();" class="mt-3 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-500/20">
                    Restablecer Filtros
                </button>
            </div>
        `;
        return;
    }

    // Agrupar los términos por orden alfabético (por su letra inicial)
    const groups = {};
    filtered.forEach(item => {
        const letter = (item.letra || item.termino.charAt(0) || '#').toUpperCase();
        if (!groups[letter]) {
            groups[letter] = [];
        }
        groups[letter].push(item);
    });

    // Letras ordenadas alfabéticamente
    const sortedLetters = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'es'));
    const escHtml = (window.EduSec && window.EduSec.escapeHtml) ? window.EduSec.escapeHtml : (v => String(v ?? ''));
    const escJs = (window.EduSec && window.EduSec.jsArg) ? window.EduSec.jsArg : (v => `'${String(v ?? '').replace(/'/g, "\\'")}'`);
    const escapedQuery = activeSearchQuery ? activeSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
    const highlightRegex = escapedQuery ? new RegExp(`(${escapedQuery})`, 'gi') : null;

    container.innerHTML = sortedLetters.map(letter => {
        const groupItems = groups[letter];
        const safeGroupLetter = escHtml(letter);

        const cardsHtml = groupItems.map(item => {
            let highlightedTitle = escHtml(item.termino || '');
            let highlightedDef = escHtml(item.definicion || '');

            if (highlightRegex) {
                highlightedTitle = highlightedTitle.replace(highlightRegex, '<mark class="bg-yellow-400/40 dark:bg-yellow-500/30 text-slate-900 dark:text-white px-0.5 rounded">$1</mark>');
                highlightedDef = highlightedDef.replace(highlightRegex, '<mark class="bg-yellow-400/40 dark:bg-yellow-500/30 text-slate-900 dark:text-white px-0.5 rounded">$1</mark>');
            }

            const baseLegalDisplay = escHtml(item.baseLegal ? item.baseLegal.split('/')[0] : 'Normativa SV');
            const safeBaseLegalTitle = escHtml(item.baseLegal || '');
            const safeCatLabel = escHtml(item.categoriaLabel || '');
            const safeItemLetter = escHtml(item.letra || letter);
            const safeItemIdJs = escJs(item.id || '');

            return `
                <div class="glass-card group bg-white dark:bg-slate-900 p-5 md:p-6 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between gap-2 mb-3">
                            <span class="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                                ${safeCatLabel}
                            </span>
                            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-xs flex items-center justify-center">
                                ${safeItemLetter}
                            </span>
                        </div>

                        <h4 class="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2 group-hover:text-emerald-500 transition-colors">
                            ${highlightedTitle}
                        </h4>

                        <p class="text-xs md:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed font-medium mb-4">
                            ${highlightedDef}
                        </p>
                    </div>

                    <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        <span class="text-[10px] font-bold text-slate-400 truncate max-w-[170px]" title="${safeBaseLegalTitle}">
                            <i class="fas fa-gavel text-emerald-500/70 mr-1"></i> ${baseLegalDisplay}
                        </span>
                        <button onclick="openTermModal(${safeItemIdJs})" class="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-black text-xs hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1.5 shadow-sm">
                            <span>Ver Detalle</span> <i class="fas fa-arrow-right text-[10px]"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="glosario-alpha-group space-y-4 mb-8" id="alpha-group-${safeGroupLetter}">
                <div class="glosario-group-header flex items-center justify-between gap-3 p-3 px-5 mb-4">
                    <div class="flex items-center gap-3.5">
                        <div class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-sm flex items-center justify-center border border-emerald-500/30 shadow-sm">
                            ${safeGroupLetter}
                        </div>
                        <div class="flex items-baseline gap-2.5">
                            <h3 class="text-base font-black text-slate-900 dark:text-white tracking-tight">
                                Letra ${safeGroupLetter}
                            </h3>
                            <span class="text-xs font-bold text-slate-400 dark:text-slate-500">
                                (${groupItems.length} ${groupItems.length === 1 ? 'término' : 'términos'})
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span class="hidden sm:inline">Glosario Técnico SV</span>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }).join('');

    initScrollReveal();
}

// Modal de Término
function openTermModal(termId) {
    const item = glosarioDataset.find(t => t.id === termId);
    if (!item) return;

    const escHtml = (window.EduSec && window.EduSec.escapeHtml) ? window.EduSec.escapeHtml : (v => String(v ?? ''));
    document.getElementById('modal-term-category').innerText = item.categoriaLabel;
    document.getElementById('modal-term-title').innerText = item.termino;
    document.getElementById('modal-term-definition').innerText = item.definicion;
    document.getElementById('modal-term-legal').innerText = item.baseLegal || 'Normativa general contable aplicable.';
    document.getElementById('modal-term-example').innerText = item.ejemplo || 'No requiere ejemplo numérico.';

    // Términos relacionados
    const relatedContainer = document.getElementById('modal-term-related');
    if (relatedContainer) {
        if (item.relacionados && item.relacionados.length > 0) {
            relatedContainer.innerHTML = item.relacionados.map(rel => `
                <span class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                    ${escHtml(rel)}
                </span>
            `).join('');
            document.getElementById('modal-term-related-box').classList.remove('hidden');
        } else {
            document.getElementById('modal-term-related-box').classList.add('hidden');
        }
    }

    const modal = document.getElementById('term-detail-modal');
    if (modal) modal.style.display = 'flex';
}

function closeTermModal() {
    const modal = document.getElementById('term-detail-modal');
    if (modal) modal.style.display = 'none';
}

// =============================================================================
// PESTAÑA 2: MÉTODOS Y GUÍAS PASO A PASO
// =============================================================================
function renderMetodosGuides() {
    const container = document.getElementById('metodos-guides-container');
    if (!container) return;

    let filtered = metodosDataset.filter(guide => {
        if (!activeSearchQuery) return true;
        return guide.titulo.toLowerCase().includes(activeSearchQuery) ||
               guide.subtitulo.toLowerCase().includes(activeSearchQuery) ||
               guide.baseLegal.toLowerCase().includes(activeSearchQuery);
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="py-16 text-center text-slate-400">
                <i class="fas fa-search text-4xl mb-3 opacity-40"></i>
                <p class="font-bold text-sm">No se encontraron guías contables para tu búsqueda.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map((guide) => {
        return `
            <div class="glass-card group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <!-- Cabecera de la Guía (Acordeón) -->
                <button onclick="toggleGuideAccordion('${guide.id}')" class="w-full p-5 md:p-6 text-left flex items-center justify-between gap-4 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 transition-colors duration-200 cursor-pointer">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                            <i class="fas ${guide.icono}"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                    ${guide.categoria}
                                </span>
                                <span class="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                    <i class="fas fa-check-circle"></i> Procedimiento Oficial
                                </span>
                            </div>
                            <h4 class="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
                                ${guide.titulo}
                            </h4>
                            <p class="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                                ${guide.subtitulo}
                            </p>
                        </div>
                    </div>
                    <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-200 shadow-sm shrink-0" id="guide-arrow-${guide.id}">
                        <i class="fas fa-chevron-down text-xs"></i>
                    </div>
                </button>

                <!-- Cuerpo de Pasos de la Guía (Colapsado por defecto) -->
                <div id="guide-body-${guide.id}" class="p-6 md:p-8 pt-0 border-t border-slate-100 dark:border-slate-800/80 hidden">
                    <!-- Base Legal -->
                    <div class="mb-6 mt-4 p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center gap-3">
                        <i class="fas fa-gavel text-emerald-600 dark:text-emerald-400 text-sm"></i>
                        <span class="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Base Legal de El Salvador: <strong class="text-emerald-700 dark:text-emerald-400">${guide.baseLegal}</strong>
                        </span>
                    </div>

                    <!-- Timeline de Pasos -->
                    <div class="space-y-4 mb-8">
                        <h5 class="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <i class="fas fa-list-ol text-emerald-500"></i> Pasos del Procedimiento
                        </h5>
                        <div class="space-y-3 pl-2 border-l-2 border-emerald-500/30">
                            ${guide.pasos.map(step => `
                                <div class="relative pl-6">
                                    <div class="absolute -left-[17px] top-1 w-6 h-6 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center shadow-sm">
                                        ${step.num}
                                    </div>
                                    <h6 class="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                                        ${step.titulo}
                                    </h6>
                                    <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                        ${step.desc}
                                    </p>
                                    ${step.formula ? `
                                        <div class="mt-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-emerald-700 dark:text-emerald-300 tabular-nums text-xs font-semibold border border-slate-200/50 dark:border-slate-700/50">
                                            ${step.formula}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Partida Tipo / Asiento Modelo -->
                    ${guide.partidaTipo ? `
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <h5 class="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <i class="fas fa-code text-emerald-500"></i> Modelo de Asiento Contable
                                </h5>
                                <button onclick="copyGuideTemplate('${guide.id}', this)" class="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 text-xs font-bold transition-all flex items-center gap-1.5">
                                    <i class="fas fa-copy"></i> <span>Copiar Asiento</span>
                                </button>
                            </div>
                            <pre class="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">${guide.partidaTipo}</pre>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    initScrollReveal();
}

function toggleGuideAccordion(guideId) {
    const body = document.getElementById(`guide-body-${guideId}`);
    const arrow = document.getElementById(`guide-arrow-${guideId}`);
    if (!body) return;

    if (body.classList.contains('hidden')) {
        body.classList.remove('hidden');
        if (arrow) arrow.innerHTML = '<i class="fas fa-chevron-up text-xs"></i>';
    } else {
        body.classList.add('hidden');
        if (arrow) arrow.innerHTML = '<i class="fas fa-chevron-down text-xs"></i>';
    }
}

function expandAllMethodGuides(expand) {
    metodosDataset.forEach(guide => {
        const body = document.getElementById(`guide-body-${guide.id}`);
        const arrow = document.getElementById(`guide-arrow-${guide.id}`);
        if (body) {
            if (expand) {
                body.classList.remove('hidden');
                if (arrow) arrow.innerHTML = '<i class="fas fa-chevron-up text-xs"></i>';
            } else {
                body.classList.add('hidden');
                if (arrow) arrow.innerHTML = '<i class="fas fa-chevron-down text-xs"></i>';
            }
        }
    });
}

function copyGuideTemplate(guideId, btn) {
    const guide = metodosDataset.find(g => g.id === guideId);
    if (!guide || !guide.partidaTipo) return;

    navigator.clipboard.writeText(guide.partidaTipo).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check text-emerald-500"></i> <span>¡Copiado!</span>';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    });
}

// =============================================================================
// PESTAÑA 3: LEYES Y NORMATIVAS (MARCO LEGAL SV AGRUPADO POR SECCIONES)
// =============================================================================
const CATEGORIAS_LEYES_CONFIG = [
    {
        key: 'Sector Financiero',
        titulo: 'Sector Financiero',
        icono: 'fa-building-columns',
        badgeColor: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        descripcion: 'Bancos, aseguradoras, cooperativas y mercado bursátil.'
    },
    {
        key: 'Normas Contables',
        titulo: 'Normas Contables',
        icono: 'fa-file-lines',
        badgeColor: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        descripcion: 'Disposiciones NIC, NIIF para PYMES, Ética y CVPCPA.'
    },
    {
        key: 'Administración Pública',
        titulo: 'Administración Pública',
        icono: 'fa-gavel',
        badgeColor: 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/20',
        descripcion: 'Ley SAFI, Servicio Civil, Ética y Compras Estatales.'
    },
    {
        key: 'Derecho Mercantil',
        titulo: 'Derecho Mercantil',
        icono: 'fa-briefcase',
        badgeColor: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20',
        descripcion: 'Código de Comercio, Sociedades y Registro Mercantil CNR.'
    },
    {
        key: 'Derecho Laboral',
        titulo: 'Derecho Laboral',
        icono: 'fa-users',
        badgeColor: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20',
        descripcion: 'Código de Trabajo, ISSS, Pensiones AFP y trámites.'
    },
    {
        key: 'Aduanas y Tributos',
        titulo: 'Aduanas y Tributos',
        icono: 'fa-ship',
        badgeColor: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/20',
        descripcion: 'Código Tributario, IVA, Renta, aduanas y retenciones.'
    }
];

function filterLeyesCategory(category) {
    activeLeyesCategory = category;
    renderLeyesCards();
}

function renderLeyesCards() {
    const container = document.getElementById('leyes-cards-container');
    if (!container) return;

    let filtered = leyesDataset;
    if (activeSearchQuery) {
        filtered = leyesDataset.filter(ley => 
            ley.nombre.toLowerCase().includes(activeSearchQuery) ||
            (ley.categoria && ley.categoria.toLowerCase().includes(activeSearchQuery)) ||
            (ley.abreviatura && ley.abreviatura.toLowerCase().includes(activeSearchQuery)) ||
            (ley.descripcion && ley.descripcion.toLowerCase().includes(activeSearchQuery))
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-16 text-center text-slate-400">
                <i class="fas fa-gavel text-4xl mb-3 opacity-40"></i>
                <p class="font-bold text-sm">No se encontraron leyes que coincidan con la búsqueda.</p>
            </div>
        `;
        return;
    }

    const escHtml = (window.EduSec && window.EduSec.escapeHtml) ? window.EduSec.escapeHtml : (v => String(v ?? ''));
    const escJs = (window.EduSec && window.EduSec.jsArg) ? window.EduSec.jsArg : (v => `'${String(v ?? '').replace(/'/g, "\\'")}'`);
    const escapedQuery = activeSearchQuery ? activeSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
    const highlightRegex = escapedQuery ? new RegExp(`(${escapedQuery})`, 'gi') : null;

    // Renderizar las 6 secciones de categorías
    const sectionsHtml = CATEGORIAS_LEYES_CONFIG.map(cat => {
        const lawsInCategory = filtered.filter(ley => ley.categoria === cat.key);
        if (lawsInCategory.length === 0 && activeSearchQuery) return '';

        return `
            <div class="glass-card group bg-white dark:bg-slate-900 p-5 md:p-6 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div>
                    <!-- Encabezado de la Categoría -->
                    <div class="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-2xl ${cat.badgeColor} border flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform">
                                <i class="fas ${cat.icono}"></i>
                            </div>
                            <div>
                                <h4 class="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight group-hover:text-emerald-500 transition-colors">
                                    ${cat.titulo}
                                </h4>
                                <p class="text-[11px] text-slate-400 dark:text-slate-500 font-medium line-clamp-1">
                                    ${cat.descripcion}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Lista de Leyes de la Sección -->
                    <div class="space-y-2">
                        ${lawsInCategory.map(ley => {
                            const safeLawName = escHtml(ley.nombre || '');
                            let highlightedName = safeLawName;
                            if (highlightRegex) {
                                highlightedName = highlightedName.replace(highlightRegex, '<mark class="bg-yellow-400/40 dark:bg-yellow-500/30 text-slate-900 dark:text-white px-0.5 rounded">$1</mark>');
                            }

                            const isAvailable = ley.existsInDb === true;
                            const safeLawIdJs = escJs(ley.id || '');
                            const safeAbrev = escHtml(ley.abreviatura || '');
                            const safeDecreto = escHtml(ley.decreto_numero || 'Oficial SV');
                            const safeVisorUrlJs = escJs(`visor-ley.html?id=${encodeURIComponent(ley.supabaseId || ley.id || '')}`);

                            return `
                                <div onclick="openLawModal(${safeLawIdJs})" 
                                     class="group/item flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 hover:border-emerald-500/50 transition-all cursor-pointer shadow-sm"
                                     title="Clic para ver detalles de ${safeLawName}">
                                    <div class="flex items-center gap-2.5 min-w-0 pr-2">
                                        <span class="w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]' : 'bg-slate-400 dark:bg-slate-600'} shrink-0 group-hover/item:scale-125 transition-transform"></span>
                                        <div class="truncate">
                                            <span class="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-400 transition-colors block truncate">
                                                ${highlightedName}
                                            </span>
                                            ${safeAbrev ? `<span class="text-[10px] font-medium text-slate-400 dark:text-slate-500 block truncate">${safeAbrev} • ${safeDecreto}</span>` : ''}
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-1.5 shrink-0">
                                        ${isAvailable 
                                            ? `<span class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Disponible</span>
                                               <button onclick="event.stopPropagation(); window.open(${safeVisorUrlJs}, '_blank');" class="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover/item:bg-emerald-500 group-hover/item:text-white flex items-center justify-center transition-all text-xs shadow-sm" title="Abrir en Visor Oficial">
                                                   <i class="fas fa-arrow-up-right-from-square text-[10px]"></i>
                                               </button>`
                                            : `<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">En proceso</span>
                                               <button class="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover/item:bg-emerald-500 group-hover/item:text-white flex items-center justify-center transition-all text-xs shadow-sm" title="Ver información de la ley">
                                                   <i class="fas fa-info text-[10px]"></i>
                                               </button>`
                                        }
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Pie de Tarjeta de Categoría -->
                <div class="pt-3.5 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>${lawsInCategory.length} ${lawsInCategory.length === 1 ? 'ley / norma' : 'leyes / normas'}</span>
                    <span class="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><i class="fas fa-shield-check"></i> Marco Jurídico SV</span>
                </div>
            </div>
        `;
    }).filter(Boolean).join('');

    container.innerHTML = sectionsHtml;
    initScrollReveal();
}

function openLawModal(leyId) {
    const ley = leyesDataset.find(l => l.id === leyId) || LEYES_SEEDS.find(l => l.id === leyId);
    if (!ley) return;

    const catEl = document.getElementById('modal-law-category');
    const titleEl = document.getElementById('modal-law-title');
    const subtitleEl = document.getElementById('modal-law-subtitle');
    const descEl = document.getElementById('modal-law-description');
    const statusBadge = document.getElementById('modal-law-status');
    const infoBox = document.getElementById('modal-law-infobox');
    const readerBtn = document.getElementById('modal-law-reader-btn');

    if (catEl) catEl.innerText = ley.categoria || 'Normativa';
    if (titleEl) titleEl.innerText = ley.nombre;
    if (subtitleEl) subtitleEl.innerText = `${ley.abreviatura ? ley.abreviatura + ' • ' : ''}${ley.decreto_numero || 'Legislación Oficial de El Salvador'}`;
    if (descEl) descEl.innerText = ley.descripcion || 'Normativa legal de consulta técnica contable y fiscal para El Salvador.';

    const isAvailable = ley.existsInDb === true;

    if (statusBadge) {
        if (isAvailable) {
            statusBadge.className = "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1";
            statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Digitalizada';
        } else {
            statusBadge.className = "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1";
            statusBadge.innerHTML = '<i class="fas fa-clock"></i> En Digitalización';
        }
    }

    if (infoBox) {
        if (isAvailable) {
            infoBox.className = "p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-500/20 mb-4";
            infoBox.innerHTML = `
                <div class="flex items-start gap-2.5">
                    <i class="fas fa-book-open text-emerald-500 text-sm mt-0.5 shrink-0"></i>
                    <div>
                        <h6 class="text-xs font-black text-emerald-800 dark:text-emerald-300">Normativa Digitalizada</h6>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">Los artículos completos de esta ley están cargados en Supabase y listos para consulta interactiva en el Visor Oficial.</p>
                    </div>
                </div>
            `;
        } else {
            infoBox.className = "p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-500/20 mb-4";
            infoBox.innerHTML = `
                <div class="flex items-start gap-2.5">
                    <i class="fas fa-hourglass-half text-amber-500 text-sm mt-0.5 shrink-0"></i>
                    <div>
                        <h6 class="text-xs font-black text-amber-800 dark:text-amber-300">En Proceso de Digitalización</h6>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">Esta ley forma parte del marco legal de El Salvador. Sus artículos completos están en proceso de integración en EduConta SV.</p>
                    </div>
                </div>
            `;
        }
    }

    if (readerBtn) {
        if (isAvailable) {
            readerBtn.classList.remove('hidden');
            readerBtn.onclick = () => {
                window.open(`visor-ley.html?id=${ley.supabaseId || ley.id}`, '_blank');
            };
        } else {
            readerBtn.classList.add('hidden');
        }
    }

    const modal = document.getElementById('law-detail-modal');
    if (modal) modal.style.display = 'flex';
}

function closeLawModal() {
    const modal = document.getElementById('law-detail-modal');
    if (modal) modal.style.display = 'none';
}

function openLawReader(leyId, leyName) {
    if (leyId) {
        openLawModal(leyId);
    } else {
        alert(`Visualizador: ${leyName} está disponible en la base de datos de consulta.`);
    }
}

// =============================================================================
// PESTAÑA 4: TABLAS RÁPIDAS Y PARÁMETROS FISCALES 2026 (ESCENARIO 3D INTERACTIVO)
// =============================================================================
let activeParamIndex = 0;
const TOTAL_PARAM_CARDS = 6;
let isParamListenersAttached = false;

function renderParametrosTables() {
    const container = document.getElementById('parametros-cards-container');
    if (!container) return;

    const salariosList = (parametrosDataset.salariosMinimos && parametrosDataset.salariosMinimos.length > 0)
        ? parametrosDataset.salariosMinimos
        : PARAMETROS_DATA.salariosMinimos;

    const seguridadSocialList = (parametrosDataset.seguridadSocial && parametrosDataset.seguridadSocial.length > 0)
        ? parametrosDataset.seguridadSocial
        : PARAMETROS_DATA.seguridadSocial;

    const tablaRentaList = (parametrosDataset.tablaRentaMensual && parametrosDataset.tablaRentaMensual.length > 0)
        ? parametrosDataset.tablaRentaMensual
        : PARAMETROS_DATA.tablaRentaMensual;

    const tasasImpuestosList = (parametrosDataset.tasasImpuestos && parametrosDataset.tasasImpuestos.length > 0)
        ? parametrosDataset.tasasImpuestos
        : PARAMETROS_DATA.tasasImpuestos;

    const depreciacionesList = (parametrosDataset.depreciacionesLegales && parametrosDataset.depreciacionesLegales.length > 0)
        ? parametrosDataset.depreciacionesLegales
        : PARAMETROS_DATA.depreciacionesLegales;

    const prestacionesList = (parametrosDataset.prestacionesLaborales && parametrosDataset.prestacionesLaborales.length > 0)
        ? parametrosDataset.prestacionesLaborales
        : PARAMETROS_DATA.prestacionesLaborales;

    const maxSalario = (parametrosDataset.maxSalario !== undefined)
        ? parametrosDataset.maxSalario.toFixed(2)
        : Math.max(...salariosList.map(s => s.mensual)).toFixed(2);

    const totalAFP = parametrosDataset.totalAFP || '16.0';
    const ivaPill = parametrosDataset.ivaTasa ? `${parametrosDataset.ivaTasa}% IVA` : '13.0% IVA';

    container.innerHTML = `
        <!-- CARD 0: Salarios Mínimos Vigentes 2026 -->
        <div class="param-card-3d" data-index="0">
            <div class="param-card-inner">
                <!-- Cabecera Superior -->
                <div>
                    <div class="flex items-center justify-between gap-3 mb-2.5">
                        <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-sm">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
                            Comercio, Industria & Agro
                        </span>
                        <span class="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-black text-xs sm:text-sm border border-slate-200 dark:border-slate-700 shadow-sm tabular-nums">
                            $ ${maxSalario} Max
                        </span>
                    </div>
                    <h4 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        Salarios Mínimos (2026)
                    </h4>
                    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Tarifas oficiales fijadas por el Consejo Nacional del Salario Mínimo de El Salvador
                    </p>
                </div>

                <!-- Cuerpo Central: Tabla Completa y Amplia -->
                <div class="py-4 overflow-x-auto my-auto">
                    <table class="w-full text-left text-xs sm:text-sm">
                        <thead>
                            <tr class="text-slate-400 dark:text-slate-400 uppercase font-black text-[11px] sm:text-xs tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3">
                                <th class="pb-3 font-extrabold">Sector Económico</th>
                                <th class="pb-3 text-right font-extrabold">Mensual</th>
                                <th class="pb-3 text-right font-extrabold">Diario (8h)</th>
                                <th class="pb-3 text-right font-extrabold">Por Hora</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-700 dark:text-slate-200">
                            ${salariosList.map(s => `
                                <tr class="hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group/row">
                                    <td class="py-3 sm:py-3.5 pr-3 font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">${s.sector}</td>
                                    <td class="py-3 sm:py-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums text-base sm:text-lg">$ ${s.mensual.toFixed(2)}</td>
                                    <td class="py-3 sm:py-3.5 text-right text-slate-600 dark:text-slate-300 whitespace-nowrap tabular-nums font-bold text-xs sm:text-sm">$ ${s.diario.toFixed(2)}</td>
                                    <td class="py-3 sm:py-3.5 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums font-medium text-xs sm:text-sm">$ ${s.hora.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Pie Inferior: Base Legal y Estado -->
                <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span class="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate flex items-center gap-2" title="Consejo Nacional del Salario Mínimo">
                        <i class="fas fa-scale-balanced text-emerald-500 text-sm"></i>
                        <span>Decreto Ejecutivo / CNSM • D.L. No. 10</span>
                    </span>
                    <span class="px-4 py-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-xs sm:text-sm flex items-center gap-2 border border-emerald-500/30 shadow-sm shrink-0">
                        <i class="fas fa-shield-check text-emerald-500"></i> <span>Vigente 2026</span>
                    </span>
                </div>
            </div>
        </div>

        <!-- CARD 1: Seguridad Social (ISSS y AFP) -->
        <div class="param-card-3d" data-index="1">
            <div class="param-card-inner">
                <!-- Cabecera Superior -->
                <div>
                    <div class="flex items-center justify-between gap-3 mb-2.5">
                        <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-500/30 shadow-sm">
                            <span class="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9] animate-pulse"></span>
                            Salud & Pensiones (SAP)
                        </span>
                        <span class="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-400 font-black text-xs sm:text-sm border border-slate-200 dark:border-slate-700 shadow-sm tabular-nums">
                            ${totalAFP}% Total
                        </span>
                    </div>
                    <h4 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        Seguridad Social (ISSS y AFP)
                    </h4>
                    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Cotizaciones obligatorias de salud previsional y ahorro para pensiones en El Salvador
                    </p>
                </div>

                <!-- Cuerpo Central: Tabla Completa -->
                <div class="py-4 overflow-x-auto my-auto">
                    <table class="w-full text-left text-xs sm:text-sm">
                        <thead>
                            <tr class="text-slate-400 dark:text-slate-400 uppercase font-black text-[11px] sm:text-xs tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3">
                                <th class="pb-3 font-extrabold">Concepto</th>
                                <th class="pb-3 text-center font-extrabold">Tasa</th>
                                <th class="pb-3 font-extrabold">Tope Salarial Máximo</th>
                                <th class="pb-3 text-right font-extrabold">Retención Máxima</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-700 dark:text-slate-200">
                            ${seguridadSocialList.map(ss => `
                                <tr class="hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group/row">
                                    <td class="py-3 sm:py-3.5 pr-3 font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">${ss.concepto}</td>
                                    <td class="py-3 sm:py-3.5 text-center font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums text-base sm:text-lg">${ss.tasa}</td>
                                    <td class="py-3 sm:py-3.5 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold">${ss.techo}</td>
                                    <td class="py-3 sm:py-3.5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap tabular-nums text-base sm:text-lg">${ss.retencionMax}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Pie Inferior -->
                <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span class="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate flex items-center gap-2" title="Ley del Seguro Social y Ley SAP">
                        <i class="fas fa-gavel text-sky-500 text-sm"></i>
                        <span>Ley del Seguro Social & Ley SAP / D.L. No. 927</span>
                    </span>
                    <span class="px-4 py-2 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-black text-xs sm:text-sm flex items-center gap-2 border border-sky-500/30 shadow-sm shrink-0">
                        <i class="fas fa-shield-halved text-sky-500"></i> <span>De Ley Obligatorio</span>
                    </span>
                </div>
            </div>
        </div>

        <!-- CARD 2: Retención Mensual ISR (Sueldos) -->
        <div class="param-card-3d" data-index="2">
            <div class="param-card-inner">
                <!-- Cabecera Superior -->
                <div>
                    <div class="flex items-center justify-between gap-3 mb-2.5">
                        <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-sm">
                            <span class="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse"></span>
                            Tributaria & Salarios
                        </span>
                        <span class="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 font-black text-xs sm:text-sm border border-slate-200 dark:border-slate-700 shadow-sm tabular-nums">
                            Decreto No. 10 MH
                        </span>
                    </div>
                    <h4 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        Retención Mensual ISR (Sueldos)
                    </h4>
                    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Tabla oficial de retención en la fuente sobre sueldos gravados (Devengado - ISSS - AFP)
                    </p>
                </div>

                <!-- Cuerpo Central: Tabla Completa -->
                <div class="py-4 overflow-x-auto my-auto">
                    <table class="w-full text-left text-xs sm:text-sm">
                        <thead>
                            <tr class="text-slate-400 dark:text-slate-400 uppercase font-black text-[11px] sm:text-xs tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3">
                                <th class="pb-3 font-extrabold">Tramo</th>
                                <th class="pb-3 font-extrabold">Rango Imponible Mensual</th>
                                <th class="pb-3 text-center font-extrabold">% s/Exceso</th>
                                <th class="pb-3 text-right font-extrabold">Cuota Fija</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-700 dark:text-slate-200">
                            ${tablaRentaList.map(tr => `
                                <tr class="hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group/row">
                                    <td class="py-3 sm:py-3.5 pr-3 font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">${tr.tramo}</td>
                                    <td class="py-3 sm:py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap tabular-nums font-bold text-xs sm:text-sm">$ ${tr.desde.toFixed(2)} a ${tr.hasta > 90000 ? 'En adelante' : '$ ' + tr.hasta.toFixed(2)}</td>
                                    <td class="py-3 sm:py-3.5 text-center font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums text-base sm:text-lg">${tr.porcentaje}</td>
                                    <td class="py-3 sm:py-3.5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap tabular-nums text-base sm:text-lg">${tr.cuotaFija}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Pie Inferior -->
                <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span class="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate flex items-center gap-2" title="Ministerio de Hacienda de El Salvador">
                        <i class="fas fa-file-invoice-dollar text-amber-500 text-sm"></i>
                        <span>Ministerio de Hacienda • Decreto No. 10</span>
                    </span>
                    <span class="px-4 py-2 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-xs sm:text-sm flex items-center gap-2 border border-amber-500/30 shadow-sm shrink-0">
                        <i class="fas fa-stamp text-amber-500"></i> <span>Tabla Oficial MH</span>
                    </span>
                </div>
            </div>
        </div>

        <!-- CARD 3: Impuestos y Retenciones Fiscales -->
        <div class="param-card-3d" data-index="3">
            <div class="param-card-inner">
                <!-- Cabecera Superior -->
                <div>
                    <div class="flex items-center justify-between gap-3 mb-2.5">
                        <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30 shadow-sm">
                            <span class="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-pulse"></span>
                            Tributos & Anticipos Fiscales
                        </span>
                        <span class="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 font-black text-xs sm:text-sm border border-slate-200 dark:border-slate-700 shadow-sm tabular-nums">
                            ${ivaPill}
                        </span>
                    </div>
                    <h4 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        Impuestos & Retenciones Fiscales
                    </h4>
                    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Alícuotas impositivas vigentes de IVA, Pago a Cuenta e Impuesto sobre la Renta
                    </p>
                </div>

                <!-- Cuerpo Central: Tabla Completa -->
                <div class="py-4 overflow-x-auto my-auto">
                    <table class="w-full text-left text-xs sm:text-sm">
                        <thead>
                            <tr class="text-slate-400 dark:text-slate-400 uppercase font-black text-[11px] sm:text-xs tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3">
                                <th class="pb-3 font-extrabold">Impuesto / Hecho Generador</th>
                                <th class="pb-3 text-center font-extrabold">Alícuota</th>
                                <th class="pb-3 text-right font-extrabold">Base Imponible / Aplicación</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-700 dark:text-slate-200">
                            ${tasasImpuestosList.map(ti => `
                                <tr class="hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group/row">
                                    <td class="py-2.5 sm:py-3 pr-3 font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">${ti.impuesto}</td>
                                    <td class="py-2.5 sm:py-3 text-center font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums text-base sm:text-lg">${ti.tasa}</td>
                                    <td class="py-2.5 sm:py-3 text-right text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold">${ti.base}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Pie Inferior -->
                <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span class="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate flex items-center gap-2" title="Ley de IVA y Código Tributario">
                        <i class="fas fa-gavel text-indigo-500 text-sm"></i>
                        <span>Ley de IVA & Código Tributario de El Salvador</span>
                    </span>
                    <span class="px-4 py-2 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-black text-xs sm:text-sm flex items-center gap-2 border border-indigo-500/30 shadow-sm shrink-0">
                        <i class="fas fa-calculator text-indigo-500"></i> <span>Declaración F-07 / F-11</span>
                    </span>
                </div>
            </div>
        </div>

        <!-- CARD 4: Depreciaciones Fiscales de Activos Fijos -->
        <div class="param-card-3d" data-index="4">
            <div class="param-card-inner">
                <!-- Cabecera Superior -->
                <div>
                    <div class="flex items-center justify-between gap-3 mb-2.5">
                        <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-sm">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
                            Activo Fijo & Propiedad
                        </span>
                        <span class="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-black text-xs sm:text-sm border border-slate-200 dark:border-slate-700 shadow-sm tabular-nums">
                            Art. 30 LISR
                        </span>
                    </div>
                    <h4 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        Depreciación Fiscal de Activos
                    </h4>
                    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Porcentajes máximos deducibles por método de línea recta según la Ley de Impuesto sobre la Renta
                    </p>
                </div>

                <!-- Cuerpo Central: Tabla Completa -->
                <div class="py-4 overflow-x-auto my-auto">
                    <table class="w-full text-left text-xs sm:text-sm">
                        <thead>
                            <tr class="text-slate-400 dark:text-slate-400 uppercase font-black text-[11px] sm:text-xs tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3">
                                <th class="pb-3 font-extrabold">Tipo de Bien / Activo</th>
                                <th class="pb-3 text-center font-extrabold">Tasa Anual Legal</th>
                                <th class="pb-3 text-right font-extrabold">Vida Útil Estimada</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-700 dark:text-slate-200">
                            ${depreciacionesList.map(dp => `
                                <tr class="hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group/row">
                                    <td class="py-3 sm:py-3.5 pr-3 font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">${dp.bien}</td>
                                    <td class="py-3 sm:py-3.5 text-center font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums text-base sm:text-lg">${dp.tasaAnual}</td>
                                    <td class="py-3 sm:py-3.5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap tabular-nums text-base sm:text-lg">${dp.vidaUtil}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Pie Inferior -->
                <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span class="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate flex items-center gap-2" title="Ley de Impuesto sobre la Renta Art. 30 / NIC 16">
                        <i class="fas fa-building text-emerald-500 text-sm"></i>
                        <span>Ley de Impuesto sobre la Renta Art. 30 & NIC 16</span>
                    </span>
                    <span class="px-4 py-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-xs sm:text-sm flex items-center gap-2 border border-emerald-500/30 shadow-sm shrink-0">
                        <i class="fas fa-chart-line text-emerald-500"></i> <span>Método Línea Recta</span>
                    </span>
                </div>
            </div>
        </div>

        <!-- CARD 5: Prestaciones y Recargos Laborales -->
        <div class="param-card-3d" data-index="5">
            <div class="param-card-inner">
                <!-- Cabecera Superior -->
                <div>
                    <div class="flex items-center justify-between gap-3 mb-2.5">
                        <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-500/30 shadow-sm">
                            <span class="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_#14b8a6] animate-pulse"></span>
                            Laboral & Mercantil
                        </span>
                        <span class="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400 font-black text-xs sm:text-sm border border-slate-200 dark:border-slate-700 shadow-sm tabular-nums">
                            Código de Trabajo
                        </span>
                    </div>
                    <h4 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        Prestaciones & Recargos de Ley
                    </h4>
                    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Horas extras diurnas/nocturnas, asuetos, vacaciones, aguinaldos y reserva legal
                    </p>
                </div>

                <!-- Cuerpo Central: Tabla Completa -->
                <div class="py-4 overflow-x-auto my-auto">
                    <table class="w-full text-left text-xs sm:text-sm">
                        <thead>
                            <tr class="text-slate-400 dark:text-slate-400 uppercase font-black text-[11px] sm:text-xs tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3">
                                <th class="pb-3 font-extrabold">Concepto / Prestación</th>
                                <th class="pb-3 text-center font-extrabold">Recargo / Beneficio</th>
                                <th class="pb-3 text-right font-extrabold">Base Legal</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-700 dark:text-slate-200">
                            ${prestacionesList.map(pl => `
                                <tr class="hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group/row">
                                    <td class="py-2.5 sm:py-3 pr-3 font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">${pl.concepto}</td>
                                    <td class="py-2.5 sm:py-3 text-center font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums text-xs sm:text-sm">${pl.recargo}</td>
                                    <td class="py-2.5 sm:py-3 text-right text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap">${pl.baseLegal.split(' ')[0] + ' ' + (pl.baseLegal.split(' ')[1] || '')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Pie Inferior -->
                <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span class="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate flex items-center gap-2" title="Código de Trabajo y Código de Comercio de El Salvador">
                        <i class="fas fa-briefcase text-teal-500 text-sm"></i>
                        <span>Código de Trabajo & Código de Comercio</span>
                    </span>
                    <span class="px-4 py-2 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-black text-xs sm:text-sm flex items-center gap-2 border border-teal-500/30 shadow-sm shrink-0">
                        <i class="fas fa-award text-teal-500"></i> <span>Beneficios de Ley</span>
                    </span>
                </div>
            </div>
        </div>
    `;

    // Renderizar píldoras de paginación
    renderParametrosDots();

    // Inicializar listeners interactivos y renderizar estado 3D inicial
    initParametros3DShowcase();
}

function renderParametrosDots() {
    const dotsContainer = document.getElementById('parametros-dots-container');
    if (!dotsContainer) return;

    let dotsHtml = '';
    for (let i = 0; i < TOTAL_PARAM_CARDS; i++) {
        dotsHtml += `<button class="param-dot ${i === activeParamIndex ? 'active' : ''}" onclick="goToParamIndex(${i})" title="Tarjeta ${i + 1}"></button>`;
    }
    dotsContainer.innerHTML = dotsHtml;
}

function calculateNonOverlappingX(i, activeIdx, baseCardWidth) {
    if (i === activeIdx) return 0;
    const offset = i - activeIdx;
    const direction = offset > 0 ? 1 : -1;
    const absOffset = Math.abs(offset);
    
    // Espacio libre garantizado amplio entre los bordes de cada tarjeta (gap generoso y fluido)
    const screenWidth = window.innerWidth;
    const gap = screenWidth < 640 ? 35 : (screenWidth < 1024 ? 65 : (screenWidth < 1440 ? 95 : 130));
    
    // Distancia acumulada desde el centro (0) hasta el centro de la tarjeta i
    // Comenzamos desde el radio de la tarjeta activa (baseCardWidth / 2)
    let totalDist = baseCardWidth / 2;
    
    for (let step = 1; step <= absOffset; step++) {
        const stepScale = Math.max(0.66, 1 - (step * 0.10));
        const prevScale = Math.max(0.66, 1 - ((step - 1) * 0.10));
        
        if (step === 1) {
            totalDist += gap + (baseCardWidth * stepScale) / 2;
        } else {
            totalDist += (baseCardWidth * prevScale) / 2 + gap + (baseCardWidth * stepScale) / 2;
        }
    }
    
    return direction * totalDist;
}

function updateParametrosCarousel() {
    const stage = document.getElementById('parametros-cards-container');
    if (!stage) return;

    const cards = Array.from(stage.querySelectorAll('.param-card-3d'));
    if (cards.length === 0) return;

    const isMobile = window.innerWidth < 768;
    const activeCard = cards[activeParamIndex];
    const baseCardWidth = (activeCard && activeCard.offsetWidth) ? activeCard.offsetWidth : (isMobile ? 380 : 880);
    const zOffsetStep = isMobile ? -75 : -110;

    cards.forEach((card, i) => {
        const offset = i - activeParamIndex;
        const absOffset = Math.abs(offset);

        // Posición horizontal calculada geométricamente: CERO SOLAPAMIENTO GARANTIZADO
        const xPos = calculateNonOverlappingX(i, activeParamIndex, baseCardWidth);
        const zPos = absOffset * zOffsetStep;
        const scale = Math.max(0.66, 1 - (absOffset * 0.10));
        const opacity = Math.max(0.18, 1 - (absOffset * 0.20));

        // Retardo sutil en ola para fluidez cinemática
        card.style.transitionDelay = `${absOffset * 0.025}s`;

        // Jerarquía de capas (Z-Index)
        if (i === activeParamIndex) {
            card.classList.add('active-card');
            card.style.zIndex = 30;
        } else {
            card.classList.remove('active-card');
            card.style.zIndex = 20 - absOffset;
        }

        // Aplicación de la transformación 3D
        card.style.transform = `
            translateX(${xPos}px) 
            translateZ(${zPos}px) 
            scale(${scale})
        `;
        card.style.opacity = opacity;
    });

    // Actualizar píldoras de paginación
    const dots = document.querySelectorAll('.param-dot');
    dots.forEach((dot, index) => {
        if (index === activeParamIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function goToParamIndex(index) {
    if (index < 0) activeParamIndex = TOTAL_PARAM_CARDS - 1;
    else if (index >= TOTAL_PARAM_CARDS) activeParamIndex = 0;
    else activeParamIndex = index;

    updateParametrosCarousel();

    // Asegurar que el scroll horizontal se mantenga en 0 absoluto
    const contentArea = document.getElementById('library-content-area');
    if (contentArea && contentArea.scrollLeft !== 0) contentArea.scrollLeft = 0;
    if (document.documentElement.scrollLeft !== 0) document.documentElement.scrollLeft = 0;
}

function nextParamSlide() {
    goToParamIndex(activeParamIndex + 1);
}

function prevParamSlide() {
    goToParamIndex(activeParamIndex - 1);
}

function initParametros3DShowcase() {
    updateParametrosCarousel();

    if (isParamListenersAttached) return;
    isParamListenersAttached = true;

    // Clic directo en cualquier tarjeta para enfocarla
    const stage = document.getElementById('parametros-cards-container');
    if (stage) {
        stage.addEventListener('click', (e) => {
            const card = e.target.closest('.param-card-3d');
            if (card) {
                const targetIdx = parseInt(card.getAttribute('data-index'), 10);
                if (!isNaN(targetIdx) && targetIdx !== activeParamIndex) {
                    goToParamIndex(targetIdx);
                }
            }
        });
    }

    // Teclado (Flechas) cuando la pestaña de parámetros está activa: CERO SCROLL / CERO MOVIMIENTO DE FONDO
    window.addEventListener('keydown', (e) => {
        const pane = document.getElementById('tab-pane-parametros');
        if (!pane || pane.classList.contains('hidden')) return;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            e.stopPropagation();
            prevParamSlide();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            e.stopPropagation();
            nextParamSlide();
        }
    });

    // Gestos de Mouse Drag y Touch Swipe
    const container = document.getElementById('parametros-perspective-container');
    if (container) {
        let isDragging = false;
        let startX = 0;

        container.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
        });

        window.addEventListener('mouseup', () => { isDragging = false; });

        container.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const diffX = e.clientX - startX;
            if (Math.abs(diffX) > 40) {
                if (diffX > 0) prevParamSlide();
                else nextParamSlide();
                isDragging = false;
            }
        });

        // Touch Swipe en dispositivos móviles
        container.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches[0]) {
                startX = e.touches[0].clientX;
            }
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            if (e.changedTouches && e.changedTouches[0]) {
                const diffX = e.changedTouches[0].clientX - startX;
                if (Math.abs(diffX) > 40) {
                    if (diffX > 0) prevParamSlide();
                    else nextParamSlide();
                }
            }
        }, { passive: true });
    }

    // Redimensionado de ventana
    window.addEventListener('resize', updateParametrosCarousel);
}

// =============================================================================
// ANIMACIÓN REACTIVA DE REVELADO AL DESPLAZARSE (SCROLL REVEAL OBSERVER)
// =============================================================================
let cardRevealObserver = null;

function initScrollReveal() {
    const contentArea = document.getElementById('library-content-area');
    if (!contentArea) return;

    const cards = contentArea.querySelectorAll('.glass-card');
    if (cards.length === 0) return;

    if (!('IntersectionObserver' in window)) {
        cards.forEach(c => c.classList.add('is-visible'));
        return;
    }

    if (cardRevealObserver) {
        cardRevealObserver.disconnect();
    }

    cardRevealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                cardRevealObserver.unobserve(entry.target);
            }
        });
    }, {
        root: contentArea,
        rootMargin: '0px 0px -25px 0px',
        threshold: 0.05
    });

    cards.forEach((card) => {
        card.classList.add('reveal-on-scroll');
        cardRevealObserver.observe(card);
    });
}

// =============================================================================
// REFRESH Y SINCRONIZACIÓN MANUAL
// =============================================================================
async function refreshLibraryData() {
    const cloudStatus = document.getElementById('library-cloud-status');
    if (cloudStatus) {
        cloudStatus.innerHTML = '<i class="fas fa-spinner fa-spin text-emerald-500 text-[9px]"></i> Sincronizando...';
    }
    await loadAllLibraryData();
    buildAlphaBar();
    renderGlosarioCards();
    renderMetodosGuides();
    renderLeyesCards();
    renderParametrosTables();
    if (cloudStatus) {
        cloudStatus.innerHTML = '<i class="fas fa-check-circle text-emerald-500 text-[9px]"></i> Actualizado (2026)';
    }
}

// Globales para acceso en HTML
window.switchLibraryTab = switchLibraryTab;
window.moveLibraryTab = moveLibraryTab;
window.updateLibraryTabIndicator = updateLibraryTabIndicator;
window.handleLibrarySearch = handleLibrarySearch;
window.clearLibrarySearch = clearLibrarySearch;
window.filterGlosarioCategory = filterGlosarioCategory;
window.filterGlosarioAlpha = filterGlosarioAlpha;
window.openTermModal = openTermModal;
window.closeTermModal = closeTermModal;
window.toggleGuideAccordion = toggleGuideAccordion;
window.expandAllMethodGuides = expandAllMethodGuides;
window.copyGuideTemplate = copyGuideTemplate;
window.filterLeyesCategory = filterLeyesCategory;
window.openLawReader = openLawReader;
window.openLawModal = openLawModal;
window.closeLawModal = closeLawModal;
window.refreshLibraryData = refreshLibraryData;
window.updateLibraryContentOffset = updateLibraryContentOffset;
window.toggleAlphaFilterMode = toggleAlphaFilterMode;
window.initScrollReveal = initScrollReveal;
window.nextParamSlide = nextParamSlide;
window.prevParamSlide = prevParamSlide;
window.goToParamIndex = goToParamIndex;
window.updateParametrosCarousel = updateParametrosCarousel;

// Listener para sincronización en tiempo real entre pestañas (Admin -> Biblioteca)
window.addEventListener('storage', (e) => {
    if (e.key === 'educonta_parametros_fiscales') {
        loadAllLibraryData().then(() => {
            renderParametrosTables();
            updateParametrosCarousel();
        });
    }
});


