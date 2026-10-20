/**
 * EduConta SV - Glosario Técnico Contable Oficial (30 Términos Semilla)
 * Legislación, Normativa NIIF/NIC y Práctica Contable de El Salvador (2026)
 */

window.EDUCONTA_GLOSARIO_SEEDS = [
    {
        id: 'activo',
        termino: 'Activo',
        letra: 'A',
        categoria: 'financiera',
        categoriaLabel: 'Contabilidad Financiera',
        definicion: 'Recurso económico controlado por la entidad como resultado de sucesos pasados, del que la entidad espera obtener en el futuro beneficios económicos o potencial de servicio.',
        baseLegal: 'Marco Conceptual NIIF / NIC 1 y Código de Comercio Art. 435.',
        ejemplo: 'Dinero en caja y bancos ($10,000.00), Cuentas por Cobrar ($4,500.00) e Inventarios de Mercadería ($18,200.00).',
        relacionados: ['Pasivo', 'Patrimonio', 'Activo Corriente', 'Activo No Corriente']
    },
    {
        id: 'activo-biologico',
        termino: 'Activo Biológico',
        letra: 'A',
        categoria: 'niif',
        categoriaLabel: 'NIIF / Sector Agropecuario',
        definicion: 'Un animal vivo o una planta cultivada bajo gestión agrícola que experimenta transformación biológica (crecimiento, procreación y producción).',
        baseLegal: 'Norma Internacional de Contabilidad NIC 41 (Agricultura) / Sección 34 NIIF para las PYMES.',
        ejemplo: 'Plantaciones de café en desarrollo, ganado bovino para engorde o caña de azúcar antes de la zafra.',
        relacionados: ['NIC 41', 'Transformación Biológica', 'Valor Razonable']
    },
    {
        id: 'aguinaldo',
        termino: 'Aguinaldo (Prima de Navidad)',
        letra: 'A',
        categoria: 'laboral',
        categoriaLabel: 'Laboral & Planillas',
        definicion: 'Compensación económica anual obligatoria que el patrono debe pagar a sus trabajadores entre el 12 y el 20 de diciembre de cada año, proporcional a su antigüedad.',
        baseLegal: 'Código de Trabajo de El Salvador, Art. 196 al 202.',
        ejemplo: 'Antigüedad 1 a 3 años: 15 días de salario; 3 a 10 años: 19 días de salario; Más de 10 años: 21 días de salario. Exento de ISR hasta el límite fijado por decreto legislativo anual.',
        relacionados: ['Planilla de Sueldos', 'Indemnización', 'Código de Trabajo']
    },
    {
        id: 'amortizacion',
        termino: 'Amortización',
        letra: 'A',
        categoria: 'financiera',
        categoriaLabel: 'Contabilidad Financiera',
        definicion: 'Distribución sistemática del costo de un activo intangible a lo largo de los años estimados de su vida útil.',
        baseLegal: 'NIC 38 / Ley de Impuesto sobre la Renta Art. 30 (Deducciones).',
        ejemplo: 'Una licencia de software empresarial adquirida por $6,000.00 con vida útil de 3 años genera una amortización de $2,000.00 anuales ($166.67/mes).',
        relacionados: ['Depreciación', 'Activo Intangible', 'Vida Útil']
    },
    {
        id: 'anticipo-cuenta',
        termino: 'Anticipo a Cuenta del ISR (Pago a Cuenta)',
        letra: 'A',
        categoria: 'fiscal',
        categoriaLabel: 'Tributaria & Fiscal (SV)',
        definicion: 'Sistema de recaudación del Impuesto sobre la Renta consistente en enteros mensuales obligatorios del 1.75% sobre los ingresos brutos percibidos.',
        baseLegal: 'Código Tributario Art. 151 y Ley de Impuesto sobre la Renta.',
        ejemplo: 'Si una empresa factura $50,000.00 de ingresos brutos en el mes, el Pago a Cuenta a declarar en el Formulario F-14 es $50,000.00 × 1.75% = $875.00.',
        relacionados: ['Impuesto sobre la Renta', 'Formulario F-14', 'Ingreso Gravable']
    },
    {
        id: 'afp',
        termino: 'Aporte Previsional (AFP)',
        letra: 'A',
        categoria: 'laboral',
        categoriaLabel: 'Laboral & Planillas',
        definicion: 'Cotización al Sistema de Ahorro para Pensiones (SAP). En El Salvador corresponde al 7.25% de retención laboral y 8.75% de aporte patronal sin tope salarial máximo.',
        baseLegal: 'Ley del Sistema de Ahorro para Pensiones (Decreto Legislativo No. 927 y reformas).',
        ejemplo: 'Para un salario devengado de $800.00: Retención Laboral = $800 × 7.25% = $58.00; Aporte Patronal = $800 × 8.75% = $70.00.',
        relacionados: ['ISSS', 'Renta Sueldos', 'Planilla de Sueldos']
    },
    {
        id: 'balance-general',
        termino: 'Balance General (Estado de Situación)',
        letra: 'B',
        categoria: 'financiera',
        categoriaLabel: 'Contabilidad Financiera',
        definicion: 'Estado financiero que refleja a una fecha determinada la posición patrimonial de la empresa, estructurado en Activos, Pasivos y Patrimonio Neto.',
        baseLegal: 'Código de Comercio Art. 435 y 441 / NIC 1.',
        ejemplo: 'Ecuación Fundamental: Activo ($125,000.00) = Pasivo ($45,000.00) + Patrimonio ($80,000.00).',
        relacionados: ['Estado de Resultados', 'Activo', 'Pasivo', 'Patrimonio']
    },
    {
        id: 'balanza-comprobacion',
        termino: 'Balanza de Comprobación',
        letra: 'B',
        categoria: 'financiera',
        categoriaLabel: 'Contabilidad Financiera',
        definicion: 'Documento contable de control en el que se listan todas las cuentas del libro mayor con sus movimientos acumulados (Debe/Haber) y saldos (Deudor/Acreedor) para verificar el cuadre de partida doble.',
        baseLegal: 'Código de Comercio Art. 438 y 442.',
        ejemplo: 'Total Sumas Debe ($320,500.00) = Total Sumas Haber ($320,500.00); Total Saldos Deudores ($142,000.00) = Total Saldos Acreedores ($142,000.00).',
        relacionados: ['Libro Mayor', 'Partida Doble', 'Cierre Contable']
    },
    {
        id: 'base-imponible',
        termino: 'Base Imponible',
        letra: 'B',
        categoria: 'fiscal',
        categoriaLabel: 'Tributaria & Fiscal (SV)',
        definicion: 'Cuantía o monto dinerario sobre el cual se aplica la alícuota tributaria porcentual para liquidar el impuesto a pagar.',
        baseLegal: 'Código Tributario Art. 62 y Ley de IVA Art. 46.',
        ejemplo: 'En una venta gravada por $1,000.00 netos, la base imponible del IVA es $1,000.00, resultando un IVA Débito Fiscal del 13% = $130.00.',
        relacionados: ['IVA', 'Hecho Generador', 'Crédito Fiscal']
    },
    {
        id: 'catalogo-cuentas',
        termino: 'Catálogo de Cuentas',
        letra: 'C',
        categoria: 'financiera',
        categoriaLabel: 'Contabilidad Financiera',
        definicion: 'Estructura codificada y sistemática de todas las cuentas que integran la contabilidad de una empresa, autorizada por un Contador Público certificado.',
        baseLegal: 'Código de Comercio Art. 437 y Código Tributario Art. 139.',
        ejemplo: '1 = Activo; 11 = Activo Corriente; 1101 = Efectivo y Equivalentes; 110101 = Caja General.',
        relacionados: ['Libro Diario', 'Manual de Aplicación', 'Contabilidad Formal']
    },
    {
        id: 'cierre-contable',
        termino: 'Cierre Contable',
        letra: 'C',
        categoria: 'financiera',
        categoriaLabel: 'Contabilidad Financiera',
        definicion: 'Proceso de liquidación y saldado de las cuentas nominales de resultados (Ingresos, Costos y Gastos) al 31 de diciembre contra la cuenta Pérdidas y Ganancias para determinar la Utilidad o Pérdida neta del ejercicio.',
        baseLegal: 'Código de Comercio Art. 440 y Ley de Impuesto sobre la Renta.',
        ejemplo: 'Se cargan las cuentas de ingresos y se abonan las de gastos. La diferencia se traslada a Utilidad del Ejercicio previa deducción de Reserva Legal e ISR.',
        relacionados: ['Pérdidas y Ganancias', 'Reserva Legal', 'Estado de Resultados']
    },
    {
        id: 'comprobante-credito-fiscal',
        termino: 'Comprobante de Crédito Fiscal (CCF)',
        letra: 'C',
        categoria: 'fiscal',
        categoriaLabel: 'Tributaria & Fiscal (SV)',
        definicion: 'Documento tributario formal que emite un contribuyente inscrito en IVA a otro contribuyente al vender bienes o prestar servicios gravados, permitiendo el deducible de Crédito Fiscal.',
        baseLegal: 'Código Tributario de El Salvador, Art. 107 y 110.',
        ejemplo: 'Contiene: Número de Registro de Contribuyente (NRC), NIT, desglose del valor neto de operación y el 13% de IVA explícito.',
        relacionados: ['Crédito Fiscal', 'Débito Fiscal', 'Factura Consumidor Final']
    },
    {
        id: 'conciliacion-bancaria',
        termino: 'Conciliación Bancaria',
        letra: 'C',
        categoria: 'financiera',
        categoriaLabel: 'Contabilidad Financiera',
        definicion: 'Procedimiento de control interno que compara los movimientos y saldos del libro auxiliar de bancos con el estado de cuenta bancario para identificar partidas en tránsito y ajustes necesarios.',
        baseLegal: 'Normas de Control Interno Contable / NIIF.',
        ejemplo: 'Saldo Banco ($12,400.00) + Depósitos en tránsito ($2,000.00) - Cheques no cobrados ($1,500.00) = Saldo según Libros ($12,900.00).',
        relacionados: ['Efectivo y Equivalentes', 'Libro Mayor', 'Ajuste Contable']
    },
    {
        id: 'costo-promedio',
        termino: 'Costo Promedio Ponderado',
        letra: 'C',
        categoria: 'costos',
        categoriaLabel: 'Costos & Kardex',
        definicion: 'Método de valuación de inventarios que promedia el costo unitario de las existencias dividiendo el saldo total en dinero entre el total de unidades disponibles tras cada compra.',
        baseLegal: 'Código Tributario Art. 143 literal a) / NIC 2 (Inventarios).',
        ejemplo: 'Saldo: 100 u a $5 ($500). Entrada: 50 u a $6 ($300). Nuevo Costo Promedio = ($500 + $300) / (100 + 50) = $800 / 150 = $5.333 por unidad.',
        relacionados: ['PEPS', 'Kardex', 'NIC 2', 'Costo de Ventas']
    },
    {
        id: 'costo-ventas',
        termino: 'Costo de Ventas',
        letra: 'C',
        categoria: 'costos',
        categoriaLabel: 'Costos & Kardex',
        definicion: 'Monto total invertido en la adquisición o producción de los bienes o servicios que la empresa vendió efectivamente durante un período contable.',
        baseLegal: 'Ley de Impuesto sobre la Renta Art. 29 y NIC 2.',
        ejemplo: 'Fórmula Comercial: Inventario Inicial + Compras Netas - Inventario Final = Costo de Ventas.',
        relacionados: ['Utilidad Bruta', 'Inventarios', 'Kardex']
    },
    {
        id: 'credito-fiscal-iva',
        termino: 'Crédito Fiscal (IVA)',
        letra: 'C',
        categoria: 'fiscal',
        categoriaLabel: 'Tributaria & Fiscal (SV)',
        definicion: 'El 13% de IVA soportado y pagado en compras de bienes o servicios necesarios para el giro del negocio amparados con Comprobante de Crédito Fiscal (CCF), el cual se deduce del Débito Fiscal.',
        baseLegal: 'Ley de IVA de El Salvador, Art. 64 al 70.',
        ejemplo: 'Compra de mercadería por $2,000.00 + IVA $260.00 = Total $2,260.00. Los $260.00 son Crédito Fiscal a deducir en el F-07.',
        relacionados: ['Débito Fiscal', 'Liquidación IVA', 'Remanente']
    },
    {
        id: 'debito-fiscal-iva',
        termino: 'Débito Fiscal (IVA)',
        letra: 'D',
        categoria: 'fiscal',
        categoriaLabel: 'Tributaria & Fiscal (SV)',
        definicion: 'El 13% de IVA devengado y cobrado por el contribuyente en las ventas locales de bienes o prestaciones de servicios.',
        baseLegal: 'Ley de IVA de El Salvador, Art. 53 al 63.',
        ejemplo: 'Venta de mercadería por $5,000.00 netos genera un Débito Fiscal de $5,000.00 × 13% = $650.00.',
        relacionados: ['Crédito Fiscal', 'Liquidación IVA', 'Factura Consumidor Final']
    },
    {
        id: 'depreciacion-linea-recta',
        termino: 'Depreciación por Línea Recta',
        letra: 'D',
        categoria: 'financiera',
        categoriaLabel: 'Contabilidad Financiera',
        definicion: 'Método de prorrateo constante del costo de un bien de uso entre los años de vida útil permitidos por ley.',
        baseLegal: 'Ley de Impuesto sobre la Renta Art. 30 / NIC 16.',
        ejemplo: 'Tasas legales SV: Edificaciones 5% (20 años), Maquinaria 20% (5 años), Vehículos 25% (4 años), Cómputo 50% (2 años).',
        relacionados: ['Amortización', 'Activo Fijo', 'Valor Residual']
    },
    {
        id: 'devengado',
        termino: 'Devengado (Principio Contable)',
        letra: 'D',
        categoria: 'niif',
        categoriaLabel: 'NIIF / Principios Contables',
        definicion: 'Postulado contable que estipula que los ingresos y gastos deben reconocerse y registrarse en el período en que ocurren, independientemente de la fecha en que se cobren o paguen.',
        baseLegal: 'Marco Conceptual NIIF / Código Tributario Art. 139.',
        ejemplo: 'Los salarios de diciembre trabajados por el personal se registran como gasto de diciembre aunque se paguen el 2 de enero.',
        relacionados: ['Partida Doble', 'Período Contable', 'Realización']
    },
    {
        id: 'estado-resultados',
        termino: 'Estado de Resultados (Pérdidas y Ganancias)',
        letra: 'E',
        categoria: 'financiera',
        categoriaLabel: 'Contabilidad Financiera',
        definicion: 'Estado financiero básico que muestra de forma estructurada los ingresos, costos y gastos de un período para determinar la ganancia o pérdida neta.',
        baseLegal: 'Código de Comercio Art. 441 / NIC 1.',
        ejemplo: 'Ventas Netas ($100k) - Costo de Ventas ($60k) = Utilidad Bruta ($40k) - Gastos de Operación ($25k) = Utilidad Operativa ($15k).',
        relacionados: ['Balance General', 'Costo de Ventas', 'Utilidad del Ejercicio']
    },
    {
        id: 'horas-extras',
        termino: 'Horas Extraordinarias (Horas Extras)',
        letra: 'H',
        categoria: 'laboral',
        categoriaLabel: 'Laboral & Planillas',
        definicion: 'Horas laboradas fuera de la jornada ordinaria legal de trabajo, las cuales gozan de recargos salariales obligatorios por ley.',
        baseLegal: 'Código de Trabajo de El Salvador, Art. 168 al 170.',
        ejemplo: 'Recargo Diurno: 100% (Factor 2.0 × Valor Hora); Recargo Nocturno: 125% (Factor 2.25 × Valor Hora); Asuetos/Festivos: 150% (Factor 2.50).',
        relacionados: ['Planilla de Sueldos', 'Salario Mínimo', 'Código de Trabajo']
    },
    {
        id: 'isss',
        termino: 'Instituto Salvadoreño del Seguro Social (ISSS)',
        letra: 'I',
        categoria: 'laboral',
        categoriaLabel: 'Laboral & Planillas',
        definicion: 'Cotización para el régimen de salud y riesgos profesionales con base en tarifas del 3.0% laboral y 7.5% patronal sobre un techo máximo cotizable de $1,000.00 mensuales.',
        baseLegal: 'Ley del Seguro Social y Reglamento para la Aplicación del Régimen del Seguro Social.',
        ejemplo: 'Salario $800.00 -> ISSS Laboral (3%) = $24.00; Salario $1,500.00 -> ISSS Laboral con techo de $1,000.00 = $30.00 máximo.',
        relacionados: ['AFP', 'Renta Sueldos', 'Planilla de Sueldos']
    },
    {
        id: 'isr-sueldos',
        termino: 'Impuesto sobre la Renta (Retención Salarial)',
        letra: 'I',
        categoria: 'laboral',
        categoriaLabel: 'Laboral & Planillas',
        definicion: 'Retención mensual que el empleador aplica al trabajador sobre su salario gravado (Devengado - ISSS - AFP) conforme a la tabla oficial de 4 tramos del Ministerio de Hacienda.',
        baseLegal: 'Ley de Impuesto sobre la Renta y Decreto Legislativo No. 10.',
        ejemplo: 'Base Imponible hasta $550.00 mensual = Exento de ISR. De $550.01 a $895.24 = 10% sobre el exceso de $550.00 + $17.67 cuota fija.',
        relacionados: ['ISSS', 'AFP', 'Planilla de Sueldos', 'Tabla ISR']
    },
    {
        id: 'kardex',
        termino: 'Kardex (Control de Inventarios)',
        letra: 'K',
        categoria: 'costos',
        categoriaLabel: 'Costos & Kardex',
        definicion: 'Registro auxiliar obligatorio y cronológico donde se asientan todas las entradas, salidas y saldos físicos y valorados de cada producto del inventario.',
        baseLegal: 'Código Tributario Art. 142 y NIC 2.',
        ejemplo: 'Cada tarjeta de Kardex controla: Fecha, Comprobante, Entrada (u y $), Salida (u y $) y Saldo final disponible.',
        relacionados: ['PEPS', 'Costo Promedio', 'NIC 2', 'Inventarios']
    },
    {
        id: 'partida-doble',
        termino: 'Partida Doble',
        letra: 'P',
        categoria: 'financiera',
        categoriaLabel: 'Contabilidad Financiera',
        definicion: 'Principio universal de la contabilidad que establece que en toda transacción económica, no hay deudor sin acreedor, por lo que la suma de los cargos (Debe) debe ser idéntica a la suma de los abonos (Haber).',
        baseLegal: 'Código de Comercio Art. 436.',
        ejemplo: 'Compra al contado: Cargo a Mercadería ($1,000.00) + Cargo a IVA Crédito ($130.00) = Abono a Bancos ($1,130.00). Total Debe = Total Haber.',
        relacionados: ['Libro Diario', 'Cuenta T', 'Balanza de Comprobación']
    },
    {
        id: 'peps',
        termino: 'PEPS (Primeras Entradas, Primeras Salidas)',
        letra: 'P',
        categoria: 'costos',
        categoriaLabel: 'Costos & Kardex',
        definicion: 'Método de valuación de inventarios que asume que los primeros productos comprados son los primeros en venderse, quedando el inventario final valuado a los precios de compra más recientes.',
        baseLegal: 'Código Tributario Art. 143 literal c) / NIC 2.',
        ejemplo: 'Si se compran 10 u a $5 y luego 10 u a $8, al vender 12 u se costean: 10 u a $5 ($50) + 2 u a $8 ($16) = Costo de Venta $66.',
        relacionados: ['Costo Promedio', 'Kardex', 'NIC 2']
    },
    {
        id: 'percepcion-iva',
        termino: 'Percepción del IVA (1%)',
        letra: 'P',
        categoria: 'fiscal',
        categoriaLabel: 'Tributaria & Fiscal (SV)',
        definicion: 'Mecanismo de recaudación anticipada donde un Gran Contribuyente agente de percepción cobra un 1% adicional a sus clientes contribuyentes en ventas de bienes muebles iguales o mayores a $100.00.',
        baseLegal: 'Código Tributario de El Salvador, Art. 163.',
        ejemplo: 'Gran Contribuyente vende a Mediano: Venta $1,000.00 + IVA $130.00 + Percepción 1% ($10.00) = Total a cobrar $1,140.00.',
        relacionados: ['Retención IVA', 'Grandes Contribuyentes', 'Formulario F-07']
    },
    {
        id: 'reserva-legal',
        termino: 'Reserva Legal',
        letra: 'R',
        categoria: 'financiera',
        categoriaLabel: 'Contabilidad Financiera',
        definicion: 'Porción obligatoria de las utilidades netas anuales que las sociedades deben destinar a un fondo de reserva patrimonial para proteger el capital social.',
        baseLegal: 'Código de Comercio Art. 123 (Sociedades Anónimas y R.L.: 7% hasta alcanzar el 20% del capital).',
        ejemplo: 'Para una utilidad neta de $20,000.00 en una S.A. de C.V.: Reserva Legal del ejercicio = $20,000.00 × 7% = $1,400.00.',
        relacionados: ['Cierre Contable', 'Patrimonio', 'Código de Comercio']
    },
    {
        id: 'retencion-iva',
        termino: 'Retención del IVA (1%)',
        letra: 'R',
        categoria: 'fiscal',
        categoriaLabel: 'Tributaria & Fiscal (SV)',
        definicion: 'Mecanismo donde un Gran Contribuyente designado como agente de retención descuenta y entera el 1% del valor neto de compra en adquisiciones a medianos y otros contribuyentes iguales o superiores a $100.00.',
        baseLegal: 'Código Tributario de El Salvador, Art. 162.',
        ejemplo: 'Gran Contribuyente compra a Proveedor por $1,000.00 + IVA $130.00: Retiene 1% ($10.00) y le paga líquido $1,120.00 emitiendo Comprobante de Retención.',
        relacionados: ['Percepción IVA', 'Grandes Contribuyentes', 'Formulario F-07']
    },
    {
        id: 'retaceo',
        termino: 'Retaceo de Importaciones',
        letra: 'R',
        categoria: 'costos',
        categoriaLabel: 'Costos & Kardex',
        definicion: 'Procedimiento contable que calcula el costo real unitario de las mercaderías importadas integrando el precio FOB, flete, seguro, aranceles (DAI) y todos los gastos locales de aduana.',
        baseLegal: 'Código Tributario y Ley de Aduanas / NIC 2.',
        ejemplo: 'Valor CIF (FOB + Flete + Seguro) + DAI + Bodegaje + Gastos de Agencia Aduanal = Costo Total Puesto en Almacén.',
        relacionados: ['Kardex', 'Valor CIF', 'DAI', 'Costo Promedio']
    }
];

/**
 * Normalizador seguro de términos contables (compatibilidad con Supabase, localStorage y CMS)
 */
window.normalizeGlosarioTerm = function(raw) {
    if (!raw) return null;
    const nombre = (raw.termino || raw.nombre || '').trim();
    if (!nombre) return null;

    const id = raw.id || nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const cat = (raw.categoria || 'financiera').toLowerCase().trim();

    let catLabel = raw.categoriaLabel || raw.categoria_label;
    if (!catLabel) {
        if (cat === 'financiera') catLabel = 'Contabilidad Financiera';
        else if (cat === 'fiscal') catLabel = 'Tributaria & Fiscal (SV)';
        else if (cat === 'laboral') catLabel = 'Laboral & Planillas';
        else if (cat === 'costos') catLabel = 'Costos & Kardex';
        else if (cat === 'niif') catLabel = 'NIIF / Principios Contables';
        else catLabel = 'General';
    }

    let rel = raw.relacionados || [];
    if (typeof rel === 'string') {
        rel = rel.split(',').map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(rel)) {
        rel = [];
    }

    const baseLegal = raw.baseLegal || raw.base_legal || 'Legislación y Normas Técnicas de El Salvador.';
    const definicion = raw.definicion || raw.descripcion || '';
    const ejemplo = raw.ejemplo || '';
    const letra = (raw.letra || nombre[0] || 'A').toUpperCase();

    return {
        id: id,
        termino: nombre,
        letra: letra,
        categoria: cat,
        categoriaLabel: catLabel,
        categoria_label: catLabel,
        definicion: definicion,
        baseLegal: baseLegal,
        base_legal: baseLegal,
        ejemplo: ejemplo,
        relacionados: rel,
        vigencia_anio: raw.vigencia_anio || 2026
    };
};
