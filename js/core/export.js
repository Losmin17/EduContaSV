window.exportarPDF = async function(baseFilename) {
            const btn = window.event ? window.event.currentTarget : null;
            let originalHTML = '';
            if (btn) {
                originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exportando...';
                btn.disabled = true;
                btn.classList.add('opacity-70', 'cursor-not-allowed');
            }

            await new Promise(r => setTimeout(r, 50)); // UI delay

            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({ format: 'a4', orientation: 'portrait' });

                // Colores Corporativos
                const bDark = [15, 23, 42];
                const bGray = [248, 250, 252];

                const projNameEl = document.getElementById('current-project-name');
                const projName = (projNameEl && projNameEl.innerText !== 'Cargando...') ? projNameEl.innerText : 'Proyecto_Contable';
                const dateStr = new Date().toLocaleDateString();

                // Datos del proyecto actual (para lógica multisectorial)
                const project = projects.find(p => p.id === currentProjectId);
                const sector = project?.sector || 'COM';
                const catalogo = project?.catalogo || 'MAESTRO';

                const fmt = (n) => typeof n === 'number' ? '$ ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n;
                const fmtNeg = (n) => typeof n === 'number' ? (n === 0 ? "0.00" : `($ ${(Math.abs(n)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`) : n;

                const buildHeader = (title, subtitle = null) => {
                    doc.setFontSize(14);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(...bDark);
                    doc.text(projName.toUpperCase(), 14, 20);

                    doc.setFontSize(11);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(100);
                    doc.text(title.toUpperCase(), 14, 26);

                    if (subtitle) {
                        doc.setFontSize(9);
                        doc.setFont("helvetica", "normal");
                        doc.text(subtitle, 14, 31);
                        doc.text(`Expresado en Dólares de los E.U.A. - Emitido: ${dateStr}`, 14, 36);
                    } else {
                        doc.setFontSize(9);
                        doc.setFont("helvetica", "normal");
                        doc.text(`Expresado en Dólares de los E.U.A. - Emitido: ${dateStr}`, 14, 32);
                    }

                    doc.setDrawColor(200, 200, 200);
                    doc.line(14, subtitle ? 39 : 35, 196, subtitle ? 39 : 35);
                };

                // === 1. LIBRO DIARIO ===
                if (baseFilename === 'Libro_Diario') {
                    buildHeader('Libro Diario General');
                    let startY = 42;
                    let lastPage = doc.internal.getNumberOfPages(); // Rastreamos la página actual
                    const cards = document.querySelectorAll('#books-stack .glass-card');

                    cards.forEach((card, idx) => {
                        const title = card.querySelector('.sheet-title').innerText;
                        const date = card.querySelector('.doc-date').value;
                        const glosa = card.querySelector('.glosa-input').value || 'Sin descripción';

                        const rows = [];
                        card.querySelectorAll('.entries-container tr').forEach(tr => {
                            const inps = tr.querySelectorAll('input');
                            if (inps[0].value || inps[1].value) {
                                // Regla 1: Sangría para cuentas del Haber
                                const isHaber = parseLocalFloat(inps[3].value) > 0;
                                const nombreCuenta = isHaber ? { content: inps[1].value, styles: { cellPadding: { left: 8 } } } : inps[1].value;

                                rows.push([
                                    inps[0].value,
                                    nombreCuenta,
                                    inps[2].value ? fmt(parseLocalFloat(inps[2].value)) : '',
                                    inps[3].value ? fmt(parseLocalFloat(inps[3].value)) : ''
                                ]);
                            }
                        });

                        const tDebe = card.querySelector('.total-debe').innerText;
                        const tHaber = card.querySelector('.total-haber').innerText;

                        // Regla 1: Glosa debajo de Sumas Iguales
                        rows.push([
                            { content: 'Sumas Iguales', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
                            { content: tDebe, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
                            { content: tHaber, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }
                        ]);
                        rows.push([
                            { content: `Concepto: ${glosa}`, colSpan: 4, styles: { fontStyle: 'italic', textColor: [100, 100, 100], fillColor: 255 } }
                        ]);

                        doc.autoTable({
                            startY: startY,
                            pageBreak: 'avoid',
                            head: [[`${title} (${date})`, 'Cuenta / Detalle', 'Debe', 'Haber']],
                            body: rows,
                            theme: 'grid',
                            headStyles: { fillColor: bDark, textColor: 255, fontSize: 9 },
                            bodyStyles: { fontSize: 8, textColor: 50 },
                            columnStyles: {
                                0: { cellWidth: 35, font: 'courier' },
                                1: { cellWidth: 'auto', overflow: 'linebreak' },
                                2: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
                                3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
                            },
                            margin: { top: 42, bottom: 20, left: 14, right: 14 },
                            didDrawPage: (data) => {
                                if (data.pageNumber > lastPage) {
                                    buildHeader('Libro Diario General (Continuación)');
                                    lastPage = data.pageNumber;
                                }
                            }
                        });
                        startY = doc.lastAutoTable.finalY + 10;
                        lastPage = doc.internal.getNumberOfPages();
                    });
                }
                // === 2. LIBROS MAYORES (CUENTAS T EN GRID) ===
                else if (baseFilename === 'Libros_Mayores') {
                    buildHeader('Libros Mayores / Cuentas T', 'Agrupación de Movimientos');
                    const accounts = procesarDiario(false);

                    let currY = 46;
                    let currX = 14;
                    let rowMaxY = currY;
                    const colW = 57;
                    const gapX = 5;
                    const pageW = 210;

                    accounts.forEach((a) => {
                        const maxLen = Math.max(a.debeList.length, a.haberList.length);
                        const rows = [];
                        for (let j = 0; j < maxLen; j++) {
                            const d = a.debeList[j] ? `(${a.debeList[j].ref}) ${fmt(a.debeList[j].val)}` : '';
                            const h = a.haberList[j] ? `${fmt(a.haberList[j].val)} (${a.haberList[j].ref})` : '';
                            rows.push([d, h]);
                        }

                        let sd = a.saldoDeudor > 0 ? fmt(a.saldoDeudor) : '';
                        let sh = a.saldoAcreedor > 0 ? fmt(a.saldoAcreedor) : '';

                        let startPage = doc.internal.getNumberOfPages();

                        // Regla 2: Generar Tabla individual por cuenta respetando el formato T y Grid
                        doc.autoTable({
                            startY: currY,
                            margin: { left: currX },
                            tableWidth: colW,
                            head: [
                                [{ content: `${a.codigo}\n${a.nombre}`, colSpan: 2, styles: { halign: 'center', fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 7, cellPadding: 2, overflow: 'linebreak' } }]
                            ],
                            body: rows.length ? rows : [['', '']],
                            foot: [
                                [{ content: sd, styles: { halign: 'center', textColor: [14, 165, 233], fontStyle: 'bold', fontSize: 7, fillColor: 255 } },
                                { content: sh, styles: { halign: 'center', textColor: [14, 165, 233], fontStyle: 'bold', fontSize: 7, fillColor: 255 } }]
                            ],
                            theme: 'plain',
                            tableLineColor: [200, 200, 200],
                            tableLineWidth: 0.3, // Borde de la tarjeta
                            styles: { fontSize: 6.5, textColor: [80, 80, 80], cellPadding: 1.5, overflow: 'linebreak' },
                            columnStyles: {
                                0: { halign: 'right', cellWidth: '50%' },
                                1: { halign: 'left', cellWidth: '50%' }
                            },
                            didDrawPage: (data) => {
                                if (data.pageNumber > startPage && data.cursor.y === data.settings.startY) {
                                    buildHeader('Libros Mayores (Continuación)', 'Agrupación de Movimientos');
                                }
                            },
                            didDrawCell: (data) => {
                                // Dibujar la T (Línea central)
                                if ((data.section === 'body' || data.section === 'foot') && data.column.index === 0) {
                                    doc.setDrawColor(15, 23, 42);
                                    doc.setLineWidth(0.6);
                                    doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                                }
                                // Línea superior al pie para denotar sumatorias
                                if (data.section === 'foot') {
                                    doc.setDrawColor(200, 200, 200);
                                    doc.setLineWidth(0.3);
                                    doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                                }
                            }
                        });

                        let endPage = doc.internal.getNumberOfPages();
                        if (endPage > startPage) {
                            // Salto de página detectado, reubicar coordenada X y Y para la página nueva
                            currX += colW + gapX;
                            if (currX + colW > pageW - 14) {
                                currX = 14;
                                currY = doc.lastAutoTable.finalY + 8;
                            } else {
                                currY = 46;
                            }
                            rowMaxY = Math.max(46, doc.lastAutoTable.finalY);
                        } else {
                            rowMaxY = Math.max(rowMaxY, doc.lastAutoTable.finalY);
                            currX += colW + gapX;

                            if (currX + colW > pageW - 14) {
                                currX = 14;
                                currY = rowMaxY + 8;
                                rowMaxY = currY;
                                if (currY > 250) {
                                    doc.addPage();
                                    buildHeader('Libros Mayores / Cuentas T (Continuación)', 'Agrupación de Movimientos');
                                    currY = 46;
                                    rowMaxY = currY;
                                }
                            }
                        }
                    });
                }
                // === 3. BALANCE DE COMPROBACIÓN ===
                else if (baseFilename === 'Balance_Comprobacion') {
                    buildHeader('Balance de Comprobación', 'De sumas y saldos');
                    const accounts = procesarDiario(false);

                    const rows = accounts.map(a => {
                        // Regla 3: Sangría a cuentas cargadas en el haber
                        const cName = a.totHaber > a.totDebe ? { content: a.nombre, styles: { cellPadding: { left: 8 } } } : a.nombre;
                        return [
                            a.codigo, cName,
                            a.totDebe > 0 ? fmt(a.totDebe) : '-',
                            a.totHaber > 0 ? fmt(a.totHaber) : '-',
                            a.saldoDeudor > 0 ? fmt(a.saldoDeudor) : '-',
                            a.saldoAcreedor > 0 ? fmt(a.saldoAcreedor) : '-'
                        ]
                    });

                    const tMovDebe = accounts.reduce((acc, a) => acc + a.totDebe, 0);
                    const tMovHaber = accounts.reduce((acc, a) => acc + a.totHaber, 0);
                    const tSalDebe = accounts.reduce((acc, a) => acc + a.saldoDeudor, 0);
                    const tSalHaber = accounts.reduce((acc, a) => acc + a.saldoAcreedor, 0);

                    doc.autoTable({
                        startY: 46,
                        head: [
                            [
                                { content: 'Código', rowSpan: 2, styles: { valign: 'middle' } },
                                { content: 'Cuentas', rowSpan: 2, styles: { valign: 'middle' } },
                                { content: 'Movimientos', colSpan: 2, styles: { halign: 'center' } },
                                { content: 'Saldos', colSpan: 2, styles: { halign: 'center' } }
                            ],
                            ['Debe', 'Haber', 'Deudor (Debe)', 'Acreedor (Haber)']
                        ],
                        body: rows,
                        foot: [['', 'SUMAS IGUALES', fmt(tMovDebe), fmt(tMovHaber), fmt(tSalDebe), fmt(tSalHaber)]],
                        theme: 'grid',
                        headStyles: { fillColor: bDark, textColor: 255, fontSize: 8 },
                        bodyStyles: { fontSize: 8, textColor: 50, overflow: 'linebreak' },
                        footStyles: { fillColor: bGray, textColor: bDark, fontStyle: 'bold', fontSize: 8 },
                        columnStyles: {
                            0: { font: 'courier', cellWidth: 25 },
                            1: { cellWidth: 'auto' },
                            2: { halign: 'right', cellWidth: 25 }, 3: { halign: 'right', cellWidth: 25 },
                            4: { halign: 'right', cellWidth: 25 }, 5: { halign: 'right', cellWidth: 25 }
                        },
                        margin: { left: 14, right: 14 },
                        didDrawPage: (data) => {
                            if (data.pageNumber > 1 && data.cursor.y === data.settings.startY) {
                                buildHeader('Balance de Comprobación (Continuación)');
                            }
                        }
                    });
                }
                // === 4. ESTADO DE RESULTADOS MULTISECTORIAL ===
                else if (baseFilename === 'Estado_Resultados') {
                    buildHeader('Estado de Resultados', `Sector: ${sector} | Catálogo: ${catalogo}`);

                    const accounts = procesarDiario(false);
                    let ingresos = [], costos = [], gastosOp = [], otrosIng = [], otrosGas = [];
                    let variacionValorRazonable = 0;

                    accounts.forEach(a => {
                        const clasif = clasificarCuenta(a);
                        if (clasif.tipo !== 'Resultado') return;
                        const val = Math.abs(a.saldoAcreedor - a.saldoDeudor);
                        if (val === 0) return;

                        // Lógica NIC 41 si es AGR
                        if (sector === 'AGR' && (a.nombre.toLowerCase().includes('valor razonable') || a.nombre.toLowerCase().includes('biológica'))) {
                            if (a.saldoAcreedor > a.saldoDeudor) variacionValorRazonable += val;
                            else variacionValorRazonable -= val;
                            return;
                        }

                        if (clasif.sub === 'Ingreso') ingresos.push({ ...a, val });
                        else if (clasif.sub === 'Costo') costos.push({ ...a, val });
                        else if (clasif.sub === 'Gasto') gastosOp.push({ ...a, val });
                        else {
                            if (a.saldoAcreedor > a.saldoDeudor) otrosIng.push({ ...a, val });
                            else otrosGas.push({ ...a, val });
                        }
                    });

                    const sum = (arr) => arr.reduce((acc, el) => acc + el.val, 0);
                    const tIngresos = sum(ingresos), tCostos = sum(costos), tGastosOp = sum(gastosOp), netoOtros = sum(otrosIng) - sum(otrosGas);
                    let margenPrincipal = tIngresos - tCostos;

                    let labelVentas = "INGRESOS POR VENTAS Y ACTIVIDADES";
                    let labelCostos = "COSTOS DE OPERACIÓN";
                    let labelMargen = "MARGEN BRUTO";

                    if (sector === 'SSF') {
                        labelVentas = (catalogo === 'SEGUROS') ? "PRIMAS Y RECARGOS NETOS" : "INGRESOS POR INTERESES Y COMISIONES";
                        labelCostos = (catalogo === 'SEGUROS') ? "SINIESTROS Y GASTOS DE REASEGURO" : "COSTOS DE CAPTACIÓN Y FINANCIEROS";
                        labelMargen = "MARGEN FINANCIERO NETO";
                    } else if (sector === 'AGR') {
                        labelVentas = "VENTAS DE PRODUCTOS AGRÍCOLAS";
                        labelMargen = "MARGEN OPERATIVO AGRÍCOLA (NIC 41)";
                    } else if (sector === 'GUB') {
                        labelVentas = "INGRESOS DE GESTIÓN / TRIBUTARIOS";
                        labelCostos = "COSTOS DE TRANSFERENCIAS Y SERVICIOS";
                        labelMargen = "AHORRO/DESAHORRO DE GESTIÓN";
                    }

                    const rows = [];
                    rows.push([{ content: labelVentas, styles: { fontStyle: 'bold', textColor: bDark } }, '', fmt(tIngresos)]);
                    ingresos.forEach(a => rows.push([{ content: a.nombre, styles: { cellPadding: { left: 8 } } }, fmt(a.val), '']));

                    rows.push([{ content: `MENOS: ${labelCostos}`, styles: { fontStyle: 'bold', textColor: bDark } }, '', fmtNeg(tCostos)]);
                    costos.forEach(a => rows.push([{ content: a.nombre, styles: { cellPadding: { left: 8 } } }, fmt(a.val), '']));

                    if (sector === 'AGR') {
                        rows.push([{ content: '+/- VARIACIÓN VALOR RAZONABLE (NIC 41)', styles: { fontStyle: 'italic', textColor: [79, 70, 229] } }, fmt(variacionValorRazonable), '']);
                        margenPrincipal += variacionValorRazonable;
                    }

                    rows.push([{ content: `IGUAL: ${labelMargen}`, styles: { fontStyle: 'bold', textColor: bDark, fillColor: bGray } }, '', { content: fmt(margenPrincipal), styles: { fontStyle: 'bold', fillColor: bGray } }]);

                    rows.push([{ content: 'MENOS: GASTOS DE OPERACIÓN Y ADMÓN', styles: { fontStyle: 'bold', textColor: bDark } }, '', fmtNeg(tGastosOp)]);
                    gastosOp.forEach(a => rows.push([{ content: a.nombre, styles: { cellPadding: { left: 8 } } }, fmt(a.val), '']));

                    const utilidadOp = margenPrincipal - tGastosOp;
                    const utilidadFinal = utilidadOp + netoOtros;

                    rows.push([{ content: 'IGUAL: UTILIDAD DE OPERACIÓN', styles: { fontStyle: 'bold', textColor: bDark, fillColor: bGray } }, '', { content: fmt(utilidadOp), styles: { fontStyle: 'bold', fillColor: bGray } }]);

                    rows.push([{ content: 'MÁS/MENOS: OTROS INGRESOS Y GASTOS', styles: { fontStyle: 'bold', textColor: bDark } }, '', fmt(netoOtros)]);
                    otrosIng.forEach(a => rows.push([{ content: '+ ' + a.nombre, styles: { cellPadding: { left: 8 } } }, fmt(a.val), '']));
                    otrosGas.forEach(a => rows.push([{ content: '- ' + a.nombre, styles: { cellPadding: { left: 8 } } }, fmtNeg(a.val), '']));

                    rows.push([{ content: 'RESULTADO FINAL DEL EJERCICIO', styles: { fontStyle: 'bold', textColor: bDark, lineWidth: { bottom: 1 }, lineColor: bDark } }, '', { content: fmt(utilidadFinal), styles: { fontStyle: 'bold', textColor: bDark, lineWidth: { bottom: 1 }, lineColor: bDark } }]);

                    doc.autoTable({
                        startY: 46,
                        body: rows,
                        theme: 'plain',
                        styles: { fontSize: 9, cellPadding: 2, textColor: 60, overflow: 'linebreak' },
                        columnStyles: {
                            0: { cellWidth: 100 },
                            1: { halign: 'right', cellWidth: 40 },
                            2: { halign: 'right', cellWidth: 40, fontStyle: 'bold', textColor: bDark }
                        },
                        margin: { left: 14, right: 14 }
                    });

                    let finalY = doc.lastAutoTable.finalY + 30;
                    if (finalY > 250) { doc.addPage(); finalY = 40; }
                    doc.setDrawColor(0);
                    doc.setLineWidth(0.3);
                    doc.line(20, finalY, 65, finalY); doc.text('F. Contador(a)', 30, finalY + 5);
                    doc.line(80, finalY, 130, finalY); doc.text('F. Representante Legal', 85, finalY + 5);
                    doc.line(145, finalY, 190, finalY); doc.text('F. Auditor(a)', 155, finalY + 5);
                }
                // === 5 y 6. BALANCES (USANDO MOTOR DINÁMICO) ===
                else if (baseFilename === 'Balance_Inicial' || baseFilename === 'Balance_General') {
                    buildHeader(baseFilename === 'Balance_Inicial' ? 'Balance Inicial de Apertura' : 'Balance General', 'Situación Financiera');
                    const accountsArr = procesarDiario(baseFilename === 'Balance_Inicial');

                    // 1. RECLASIFICACIÓN DINÁMICA NIIF (Anti-Sobregiros)
                    const baseActivos = accountsArr.filter(a => clasificarCuenta(a).tipo === 'Activo');
                    const basePasivos = accountsArr.filter(a => clasificarCuenta(a).tipo === 'Pasivo');
                    const basePatrimonios = accountsArr.filter(a => clasificarCuenta(a).tipo === 'Patrimonio');
                    const utilidad = calcularUtilidad(accountsArr);

                    // Reclasificación dinámica
                    const activosFinal = [];
                    const pasivosFinal = [];

                    baseActivos.forEach(a => {
                        const val = a.saldoDeudor - a.saldoAcreedor;
                        if (val < 0) pasivosFinal.push({ ...a, val: Math.abs(val), esRecl: true });
                        else if (val > 0) activosFinal.push({ ...a, val });
                    });

                    basePasivos.forEach(a => {
                        const val = a.saldoAcreedor - a.saldoDeudor;
                        if (val < 0) activosFinal.push({ ...a, val: Math.abs(val), esRecl: true });
                        else if (val > 0) pasivosFinal.push({ ...a, val });
                    });

                    const agruparParaPDF = (lista, tipoFuerza = null) => {
                        const grupos = {};
                        lista.forEach(a => {
                            const info = clasificarCuenta(a);
                            const t = tipoFuerza || info.tipo;
                            // Sincronización con lógica UI: SSF y GUB usan clase Unificada
                            const clase = (sector === 'SSF' || sector === 'GUB') ? 'Unificada' : info.clase;

                            if (!grupos[clase]) grupos[clase] = {};
                            const rubroId = String(a.codigo).substring(0, 4);
                            if (!grupos[clase][rubroId]) {
                                grupos[clase][rubroId] = {
                                    nombre: obtenerNombreRubro(rubroId, info.cat, t),
                                    cuentas: [],
                                    total: 0
                                };
                            }
                            grupos[clase][rubroId].cuentas.push(a);
                            grupos[clase][rubroId].total += a.val;
                        });
                        return grupos;
                    };

                    const actuG = agruparParaPDF(activosFinal, 'Activo');
                    const pasuG = agruparParaPDF(pasivosFinal, 'Pasivo');

                    let leftList = [], rightList = [];
                    let tAct = 0, tPas = 0, tPat = 0;

                    // Llenar Activos
                    const clasesAct = (sector === 'SSF' || sector === 'GUB') ? ['Unificada'] : ['Corriente', 'No Corriente', 'Mixto'];
                    clasesAct.forEach(clase => {
                        if (actuG[clase]) {
                            const label = (sector === 'SSF' || sector === 'GUB') ? 'ACTIVOS SEGÚN LIQUIDEZ' : `ACTIVO ${clase.toUpperCase()}`;
                            leftList.push({ name: label, val: '', isTitle: true, color: [16, 185, 129] });
                            let tClase = 0;
                            Object.values(actuG[clase]).forEach(r => {
                                leftList.push({ name: r.nombre.toUpperCase(), val: fmt(r.total), highlight: true, color: [20, 100, 80] });
                                r.cuentas.forEach(c => leftList.push({ name: `   ${c.nombre}${c.esRecl ? ' (Recl.)' : ''}`, val: fmt(c.val) }));
                                tClase += r.total;
                                tAct += r.total;
                            });
                            if (sector !== 'SSF' && sector !== 'GUB') {
                                leftList.push({ name: `TOTAL ACTIVO ${clase.toUpperCase()}`, val: fmt(tClase), isSubtotal: true });
                            }
                        }
                    });
                    leftList.push({ name: 'TOTAL COMPLETO DE ACTIVO', val: fmt(tAct), isTotal: true, color: [16, 185, 129] });

                    // Llenar Pasivos
                    const clasesPas = (sector === 'SSF' || sector === 'GUB') ? ['Unificada'] : ['Corriente', 'No Corriente', 'Mixto'];
                    clasesPas.forEach(clase => {
                        if (pasuG[clase]) {
                            const label = (sector === 'SSF' || sector === 'GUB') ? 'PASIVOS SEGÚN EXIGIBILIDAD' : `PASIVO ${clase.toUpperCase()}`;
                            rightList.push({ name: label, val: '', isTitle: true, color: [244, 63, 94] });
                            let tClase = 0;
                            Object.values(pasuG[clase]).forEach(r => {
                                rightList.push({ name: r.nombre.toUpperCase(), val: fmt(r.total), highlight: true, color: [150, 40, 60] });
                                r.cuentas.forEach(c => rightList.push({ name: `   ${c.nombre}${c.esRecl ? ' (Sobregiro)' : ''}`, val: fmt(c.val) }));
                                tClase += r.total;
                                tPas += r.total;
                            });
                            if (sector !== 'SSF' && sector !== 'GUB') {
                                rightList.push({ name: `TOTAL PASIVO ${clase.toUpperCase()}`, val: fmt(tClase), isSubtotal: true });
                            }
                        }
                    });

                    // Patrimonio
                    rightList.push({ name: '', val: '' });
                    rightList.push({ name: 'PATRIMONIO', val: '', isTitle: true, color: [99, 102, 241] });
                    basePatrimonios.forEach(a => {
                        const v = a.saldoAcreedor - a.saldoDeudor;
                        tPat += v;
                        rightList.push({ name: a.nombre, val: fmt(v) });
                    });
                    if (utilidad !== 0) {
                        rightList.push({ name: (utilidad > 0 ? 'Utilidad del Ejercicio' : 'Pérdida del Ejercicio'), val: fmt(utilidad), highlight: true });
                        tPat += utilidad;
                    }
                    rightList.push({ name: 'TOTAL PATRIMONIO', val: fmt(tPat), isSubtotal: true });
                    rightList.push({ name: 'TOTAL PASIVO + PATRIMONIO', val: fmt(tPas + tPat), isTotal: true, color: [99, 102, 241] });

                    // Unir listas en filas de 4 columnas
                    const maxRows = Math.max(leftList.length, rightList.length);
                    const combinedRows = [];

                    const getStyles = (item) => {
                        if (!item) return {};
                        if (item.isTitle) return { fontStyle: 'bold', textColor: item.color, fontSize: 8, cellPadding: { top: 4, bottom: 2 } };
                        if (item.isTotal) return { fontStyle: 'bold', textColor: bDark, fontSize: 9, lineWidth: { top: 0.5 }, lineColor: bDark, cellPadding: { top: 4 } };
                        if (item.isSubtotal) return { fontStyle: 'bold', textColor: [71, 85, 105], fontSize: 7.5, lineWidth: { top: 0.2 }, lineColor: [200, 200, 200] };
                        if (item.italic) return { fontStyle: 'italic', textColor: 150 };
                        if (item.highlight) return { fontStyle: 'bold', textColor: item.color || [99, 102, 241], fillColor: [248, 250, 252] };
                        return { textColor: 80 };
                    };
                    const getStylesVal = (item) => {
                        let st = getStyles(item);
                        st.halign = 'right';
                        st.font = 'courier';
                        if (item && (item.isTotal || item.isSubtotal)) st.textColor = item.color || [71, 85, 105];
                        return st;
                    };

                    for (let i = 0; i < maxRows; i++) {
                        const l = leftList[i] || { name: '', val: '' };
                        const r = rightList[i] || { name: '', val: '' };
                        combinedRows.push([
                            { content: l.name, styles: getStyles(l) },
                            { content: l.val, styles: getStylesVal(l) },
                            { content: r.name, styles: getStyles(r) },
                            { content: r.val, styles: getStylesVal(r) }
                        ]);
                    }

                    doc.autoTable({
                        startY: 46,
                        body: combinedRows,
                        theme: 'plain',
                        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                        columnStyles: {
                            0: { cellWidth: 56 },
                            1: { cellWidth: 35 },
                            2: { cellWidth: 56 },
                            3: { cellWidth: 35 }
                        },
                        margin: { left: 14, right: 14 },
                        didDrawCell: (data) => {
                            // Línea divisoria central
                            if (data.column.index === 1 && data.section === 'body') {
                                doc.setDrawColor(226, 232, 240);
                                doc.setLineWidth(0.5);
                                doc.line(data.cell.x + data.cell.width + 1, data.cell.y, data.cell.x + data.cell.width + 1, data.cell.y + data.cell.height);
                            }
                        },
                        didDrawPage: (data) => {
                            if (data.pageNumber > 1 && data.cursor.y === data.settings.startY) {
                                buildHeader(baseFilename === 'Balance_Inicial' ? 'Balance Inicial (Continuación)' : 'Balance General (Continuación)');
                            }
                        }
                    });

                    // Banner de Verificación de Cuadre
                    let finalY = doc.lastAutoTable.finalY + 15;
                    const isOk = Math.abs(tAct - (tPas + tPat)) < 0.01 && tAct > 0;
                    const verifText = isOk ? "¡BALANCE CUADRADO EXACTAMENTE!" : (tAct === 0 ? "Esperando Datos..." : `DESCUADRE: ${fmt(Math.abs(tAct - (tPas + tPat)))}`);

                    doc.setFillColor(...(isOk ? [16, 185, 129] : [244, 63, 94]));
                    doc.rect(14, finalY, 182, 10, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(9);
                    doc.setFont("helvetica", "bold");
                    doc.text(verifText, 105, finalY + 6.5, { align: 'center' });
                }

                // Guardar y descargar
                doc.save(`${projName.replace(/\s+/g, '_')}_${baseFilename}_${new Date().toISOString().split('T')[0]}.pdf`);

            } catch (err) {
                console.error(err);
                showModal("Error", "Hubo un error al generar el PDF. Verifica la consola.", closeModal);
            } finally {
                if (btn) {
                    btn.innerHTML = originalHTML;
                    btn.disabled = false;
                    btn.classList.remove('opacity-70', 'cursor-not-allowed');
                }
            }
        }

