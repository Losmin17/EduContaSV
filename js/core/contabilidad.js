window.procesarDiario = function(onlyOpening = false) {
            const accs = {};
            const booksNodeList = document.querySelectorAll('#books-stack .glass-card');
            const allBooks = Array.from(booksNodeList);
            const books = onlyOpening && allBooks.length > 0 ? [allBooks[0]] : allBooks;

            books.forEach(b => {
                // Obtenemos el número de orden de esta partida en específico (1, 2, 3...)
                const partidaRef = allBooks.indexOf(b) + 1;

                b.querySelectorAll('.entries-container tr').forEach(tr => {
                    const inps = tr.querySelectorAll('input');
                    const cod = inps[0].value.trim();
                    const name = inps[1].value.trim();
                    const d = parseLocalFloat(inps[2].value);
                    const h = parseLocalFloat(inps[3].value);

                    if (!cod && !name) return; // Salta filas vacías

                    const key = cod || name;
                    if (!accs[key]) {
                        accs[key] = {
                            codigo: cod, nombre: name || 'Sin Cuenta',
                            debeList: [], haberList: [],
                            totDebe: 0, totHaber: 0,
                            grupo: cod ? cod.charAt(0) : '0', // 1:Activo, 2:Pasivo, 3:Pat, 4:Ing, 5:Gastos
                            cat: CATALOGO_MAESTRO.find(x => x.id === cod)?.cat || 'Com' // Por defecto Comercial
                        };
                    }
                    // Guardamos no solo el valor, sino la referencia a la partida
                    if (d > 0) { accs[key].debeList.push({ val: d, ref: partidaRef }); accs[key].totDebe += d; }
                    if (h > 0) { accs[key].haberList.push({ val: h, ref: partidaRef }); accs[key].totHaber += h; }
                });
            });

            // Determina saldos
            Object.values(accs).forEach(a => {
                a.saldoDeudor = 0; a.saldoAcreedor = 0;
                if (a.totDebe >= a.totHaber) {
                    a.saldoDeudor = a.totDebe - a.totHaber;
                } else {
                    a.saldoAcreedor = a.totHaber - a.totDebe;
                }
            });

            return Object.values(accs).sort((a, b) => a.codigo.localeCompare(b.codigo));
        }

window.renderInicial = function(accounts) {
            const projName = document.getElementById('current-project-name').innerText;
            const project = typeof window.proyecto_actual !== 'undefined' ? window.proyecto_actual : null;
            const sector = project?.sector || 'COM';
            document.getElementById('ini-entidad').innerText = projName;

            const utilidad = calcularUtilidad(accounts);

            // Reclasificación Dinámica según naturaleza del saldo
            let baseActivos = [];
            let basePasivos = [];
            let patrimonios = [];

            accounts.forEach(a => {
                const info = clasificarCuenta(a);
                if (info.tipo === 'Activo') {
                    if (a.saldoAcreedor > a.saldoDeudor) basePasivos.push(a);
                    else baseActivos.push(a);
                } else if (info.tipo === 'Pasivo') {
                    if (a.saldoDeudor > a.saldoAcreedor) baseActivos.push(a);
                    else basePasivos.push(a);
                } else if (info.tipo === 'Patrimonio') {
                    patrimonios.push(a);
                }
            });

            const agruparLista = (lista, tipoContexto) => {
                const grupos = {};
                lista.forEach(a => {
                    const info = clasificarCuenta(a);
                    const cl = (sector === 'SSF' || sector === 'GUB') ? 'Unificada' : info.clase;
                    const rKey = info.rubroId;
                    if (!grupos[cl]) grupos[cl] = {};
                    if (!grupos[cl][rKey]) grupos[cl][rKey] = { nombre: info.rubroNombre, cuentas: [], total: 0 };
                    const val = (tipoContexto === 'Activo') ? (a.saldoDeudor - a.saldoAcreedor) : (a.saldoAcreedor - a.saldoDeudor);
                    grupos[cl][rKey].cuentas.push({ ...a, val });
                    grupos[cl][rKey].total += val;
                });
                return grupos;
            };

            const activosG = agruparLista(baseActivos, 'Activo');
            const pasivosG = agruparLista(basePasivos, 'Pasivo');

            let tActivo = 0, tPasivo = 0, tPatrimonio = 0;

            const renderSeccion = (grupos, tipo) => {
                let html = '';
                const clases = (sector === 'SSF' || sector === 'GUB') ? ['Unificada'] : ['Corriente', 'No Corriente', 'Mixto'];

                clases.forEach(cl => {
                    if (grupos[cl]) {
                        let innerHtml = '';
                        Object.values(grupos[cl]).forEach(r => {
                            if (Math.abs(r.total) < 0.01) return;
                            innerHtml += `<div class="pl-1 mb-2">
                                <div class="flex justify-between font-bold text-slate-700 text-[11px]"><span>${r.nombre}</span><span>$ ${fmtUI(r.total)}</span></div>`;
                            r.cuentas.forEach(a => {
                                if (Math.abs(a.val) < 0.01) return;
                                innerHtml += `<div class="flex justify-between text-[10px] text-slate-500 pl-3"><span>${a.nombre}</span><span>${fmtUI(a.val)}</span></div>`;
                            });
                            innerHtml += `</div>`;
                        });
                        if (innerHtml) {
                            const totalSeccion = Object.values(grupos[cl]).reduce((acc, r) => acc + r.total, 0);
                            const labelClase = (sector === 'SSF' || sector === 'GUB') ?
                                (tipo === 'Activo' ? 'Activos según Liquidez' : 'Pasivos según Exigibilidad') :
                                getClaseNombre(cl, tipo);
                            html += `
                                <div class="mt-4 mb-2 flex justify-between items-end border-b-2 border-slate-200 pb-1">
                                    <h5 class="text-[10px] font-black text-slate-800 uppercase tracking-widest">${labelClase}</h5>
                                    <span class="text-[11px] font-black text-slate-900">$ ${fmtUI(totalSeccion)}</span>
                                </div>` + innerHtml;
                        }
                    }
                });
                return html;
            };

            document.getElementById('ini-activos').innerHTML = renderSeccion(activosG, 'Activo') || '<div class="text-slate-400 italic text-xs">Sin activos con saldo deudor.</div>';
            document.getElementById('ini-pasivos').innerHTML = renderSeccion(pasivosG, 'Pasivo') || '<div class="text-slate-400 italic text-xs">Sin pasivos con saldo acreedor.</div>';

            // Totales Activo
            Object.values(activosG).forEach(cl => Object.values(cl).forEach(r => tActivo += r.total));
            // Totales Pasivo
            Object.values(pasivosG).forEach(cl => Object.values(cl).forEach(r => tPasivo += r.total));

            // Render Patrimonio Refinado
            let htmlPatrimonio = '';
            if (patrimonios.length > 0) {
                htmlPatrimonio = patrimonios.map(a => {
                    const v = a.saldoAcreedor - a.saldoDeudor; tPatrimonio += v;
                    return `<div class="flex justify-between border-b border-dashed border-slate-200 pb-1 mb-1"><span class="text-slate-600 text-[10px]">${a.nombre}</span><span class="font-mono text-[10px]">$ ${fmtUI(v)}</span></div>`;
                }).join('');
            } else if (utilidad === 0) {
                htmlPatrimonio = '<div class="text-slate-400 italic text-xs">Sin patrimonio.</div>';
            }
            document.getElementById('ini-patrimonio').innerHTML = htmlPatrimonio;

            const resContainer = document.getElementById('ini-resultado-container');
            if (utilidad !== 0) {
                resContainer.classList.remove('hidden'); resContainer.classList.add('flex');
                document.getElementById('ini-resultado-ej').innerText = `$ ${fmtUI(utilidad)}`;
            } else { resContainer.classList.add('hidden'); resContainer.classList.remove('flex'); }

            tPatrimonio += utilidad;
            const tPasPat = tPasivo + tPatrimonio;

            document.getElementById('ini-tot-activo').innerText = `$ ${fmtUI(tActivo)}`;
            document.getElementById('ini-tot-pas-pat').innerText = `$ ${fmtUI(tPasPat)}`;

            const verifEl = document.getElementById('ini-verificacion');
            if (Math.abs(tActivo - tPasPat) < 0.01 && tActivo > 0) {
                verifEl.className = "p-4 text-center font-bold text-xs uppercase tracking-widest bg-emerald-500 text-white";
                verifEl.innerText = "¡Balance Inicial Cuadrado!";
            } else if (tActivo === 0 && tPasPat === 0) {
                verifEl.className = "p-4 text-center font-bold text-xs uppercase tracking-widest bg-slate-100 text-slate-500";
                verifEl.innerText = "Esperando Datos en la Partida No. 1...";
            } else {
                verifEl.className = "p-4 text-center font-bold text-xs uppercase tracking-widest bg-rose-500 text-white";
                verifEl.innerText = `Descuadre: $ ${fmtUI(Math.abs(tActivo - tPasPat))}`;
            }
        }

window.renderMayor = function(accounts) {
            const grid = document.getElementById('mayor-grid');
            if (accounts.length === 0) {
                grid.innerHTML = `<div class="col-span-full text-center py-10 text-slate-400 font-bold">No hay registros en el Libro Diario para mayorizar.</div>`;
                return;
            }

            grid.innerHTML = accounts.map(a => `
                <div class="bg-white p-5 rounded-[36px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div class="text-center mb-3">
                        <span class="text-xs font-black bg-slate-100 px-2 py-1 rounded text-slate-600">${a.codigo || '-'}</span>
                        <h4 class="font-bold text-slate-800 text-sm mt-1 truncate" title="${a.nombre}">${a.nombre}</h4>
                    </div>
                    
                    <div class="flex relative border-t-2 border-slate-800 pt-3 min-h-[80px]">
                        <div class="t-account-line"></div>
                        <div class="w-1/2 pr-3 text-right text-[11px] font-mono font-medium text-slate-600 space-y-1">
                            ${a.debeList.map(item => `<div class="flex justify-between gap-1"><span class="text-[9px] text-slate-400 font-bold">(${item.ref})</span> <span>$ ${fmtUI(item.val)}</span></div>`).join('')}
                        </div>
                        <div class="w-1/2 pl-3 text-left text-[11px] font-mono font-medium text-slate-600 space-y-1">
                            ${a.haberList.map(item => `<div class="flex justify-between gap-1"><span>$ ${fmtUI(item.val)}</span> <span class="text-[9px] text-slate-400 font-bold">(${item.ref})</span></div>`).join('')}
                        </div>
                    </div>
                    
                    <div class="flex border-t border-slate-200 mt-3 pt-2 text-xs font-black font-mono">
                        <div class="w-1/2 pr-3 text-right ${a.saldoDeudor > 0 ? 'text-sky-600' : 'text-slate-300'}">
                            ${a.saldoDeudor > 0 ? '$ ' + fmtUI(a.saldoDeudor) : ''}
                        </div>
                        <div class="w-1/2 pl-3 text-left ${a.saldoAcreedor > 0 ? 'text-sky-600' : 'text-slate-300'}">
                            ${a.saldoAcreedor > 0 ? '$ ' + fmtUI(a.saldoAcreedor) : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }

window.renderComprobacion = function(accounts) {
            const projName = document.getElementById('current-project-name').innerText;
            document.getElementById('comp-entidad').innerText = projName;

            const tbody = document.getElementById('comprobacion-body');
            let tMovDebe = 0, tMovHaber = 0, tSalDebe = 0, tSalHaber = 0;

            if (accounts.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-400 font-bold">No hay datos procesados.</td></tr>`;
                document.getElementById('comp-mov-debe').innerText = "$ 0.00";
                document.getElementById('comp-mov-haber').innerText = "$ 0.00";
                document.getElementById('comp-sal-debe').innerText = "$ 0.00";
                document.getElementById('comp-sal-haber').innerText = "$ 0.00";
                return;
            }

            tbody.innerHTML = accounts.map(a => {
                tMovDebe += a.totDebe;
                tMovHaber += a.totHaber;
                tSalDebe += a.saldoDeudor;
                tSalHaber += a.saldoAcreedor;

                return `
                <tr class="hover:bg-slate-50 transition-colors border-b border-slate-50">
                    <td class="py-3 px-4 font-mono text-xs text-slate-500">${a.codigo}</td>
                    <td class="py-3 px-4 text-sm font-bold text-slate-700">${a.nombre}</td>
                    
                    <td class="py-3 px-4 text-right font-mono text-xs text-slate-500 border-l border-slate-100">${a.totDebe > 0 ? '$ ' + fmtUI(a.totDebe) : '-'}</td>
                    <td class="py-3 px-4 text-right font-mono text-xs text-slate-500 border-l border-slate-100">${a.totHaber > 0 ? '$ ' + fmtUI(a.totHaber) : '-'}</td>
                    
                    <td class="py-3 px-4 text-right font-mono text-xs border-l border-slate-100 ${a.saldoDeudor > 0 ? 'text-slate-800 font-bold' : 'text-slate-300'}">${a.saldoDeudor > 0 ? '$ ' + fmtUI(a.saldoDeudor) : '-'}</td>
                    <td class="py-3 px-4 text-right font-mono text-xs border-l border-slate-100 ${a.saldoAcreedor > 0 ? 'text-slate-800 font-bold' : 'text-slate-300'}">${a.saldoAcreedor > 0 ? '$ ' + fmtUI(a.saldoAcreedor) : '-'}</td>
                </tr>
            `}).join('');

            document.getElementById('comp-mov-debe').innerText = `$ ${fmtUI(tMovDebe)}`;
            document.getElementById('comp-mov-haber').innerText = `$ ${fmtUI(tMovHaber)}`;
            document.getElementById('comp-sal-debe').innerText = `$ ${fmtUI(tSalDebe)}`;
            document.getElementById('comp-sal-haber').innerText = `$ ${fmtUI(tSalHaber)}`;

            const trFoot = document.getElementById('comp-mov-debe').parentElement;
            const isMovOk = Math.abs(tMovDebe - tMovHaber) < 0.01 && tMovDebe > 0;
            const isSalOk = Math.abs(tSalDebe - tSalHaber) < 0.01 && tSalDebe > 0;

            if (isMovOk && isSalOk) {
                trFoot.classList.add('bg-emerald-50'); trFoot.classList.remove('bg-rose-50', 'bg-slate-50');
                document.getElementById('comp-mov-debe').className = "py-4 px-4 text-right font-black text-emerald-700 border-l border-slate-200";
                document.getElementById('comp-mov-haber').className = "py-4 px-4 text-right font-black text-emerald-700 border-l border-slate-200";
                document.getElementById('comp-sal-debe').className = "py-4 px-4 text-right font-black text-emerald-700 border-l border-slate-200";
                document.getElementById('comp-sal-haber').className = "py-4 px-4 text-right font-black text-emerald-700 border-l border-slate-200";
            } else {
                trFoot.classList.add('bg-rose-50'); trFoot.classList.remove('bg-emerald-50', 'bg-slate-50');
                document.getElementById('comp-mov-debe').className = `py-4 px-4 text-right font-black border-l border-slate-200 ${isMovOk ? 'text-emerald-700' : 'text-rose-600'}`;
                document.getElementById('comp-mov-haber').className = `py-4 px-4 text-right font-black border-l border-slate-200 ${isMovOk ? 'text-emerald-700' : 'text-rose-600'}`;
                document.getElementById('comp-sal-debe').className = `py-4 px-4 text-right font-black border-l border-slate-200 ${isSalOk ? 'text-emerald-700' : 'text-rose-600'}`;
                document.getElementById('comp-sal-haber').className = `py-4 px-4 text-right font-black border-l border-slate-200 ${isSalOk ? 'text-emerald-700' : 'text-rose-600'}`;
            }
        }

window.renderResultados = function(accounts) {
            const projName = document.getElementById('current-project-name').innerText;
            const project = typeof window.proyecto_actual !== 'undefined' ? window.proyecto_actual : null;
            const sector = project?.sector || 'ALL';
            const catalogo = project?.catalogo || 'MAESTRO';
            document.getElementById('res-entidad').innerText = projName;

            let ingresos = [], costos = [], gastosOp = [], otrosIng = [], otrosGas = [];
            let variacionValorRazonable = 0; // Para AGR (NIC 41)

            accounts.forEach(a => {
                const clasif = clasificarCuenta(a);
                if (clasif.tipo !== 'Resultado') return;
                const val = Math.abs(a.saldoAcreedor - a.saldoDeudor);
                if (val === 0) return;

                // Lógica de Variación Biológica (NICS - NIC 41)
                // Usualmente cuentas 41xx (Ganancia) o 42xx (Pérdida) en catálogos agrícolas
                if (sector === 'NICS' && (a.nombre.toLowerCase().includes('valor razonable') || a.nombre.toLowerCase().includes('biológica'))) {
                    if (a.saldoAcreedor > a.saldoDeudor) variacionValorRazonable += val;
                    else variacionValorRazonable -= val;
                    return; // Se procesará en un rubro especial
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
            const tIngresos = sum(ingresos);
            const tCostos = sum(costos);

            // Margen Operativo Base
            let margenPrincipal = tIngresos - tCostos;

            // Ajuste por NIC 41 (Agricultura dentro de NICS)
            let layoutAgroHTML = "";
            if (sector === 'NICS' && variacionValorRazonable !== 0) {
                layoutAgroHTML = `
                    <div class="flex justify-between items-center text-indigo-600 pl-4 py-1 italic">
                        <span class="w-1/2">+/- Variación neta en Valor Razonable (NIC 41)</span>
                        <div class="w-1/2 flex justify-between">
                            <span class="w-1/2 text-right">${fmtUI(variacionValorRazonable)}</span>
                            <span class="w-1/2"></span>
                        </div>
                    </div>
                `;
                margenPrincipal += variacionValorRazonable;
            }

            const tGastosOp = sum(gastosOp);
            const utilidadOp = margenPrincipal - tGastosOp;
            const netoOtros = sum(otrosIng) - sum(otrosGas);
            const utilidadFinal = utilidadOp + netoOtros;

            // Etiquetas dinámicas por sector/catálogo
            let labelVentas = "Ingresos por ventas y actividades";
            let labelCostos = "Costos de Operación";
            let labelMargen = "Margen Bruto";

            if (sector === 'SSF') {
                labelVentas = (catalogo === 'SEGUROS') ? "Primas y Recargos Netos" : "Ingresos por Intereses y Comisiones";
                labelCostos = (catalogo === 'SEGUROS') ? "Siniestros y Gastos de Reaseguro" : "Costos de Captación y Financieros";
                labelMargen = "Margen Financiero Neto";
            } else if (sector === 'NICS') {
                labelVentas = (variacionValorRazonable !== 0) ? "Ventas de Productos Agrícolas" : "Ingresos por Ventas Gravadas";
                labelMargen = (variacionValorRazonable !== 0) ? "Margen Operativo Agrícola (NIC 41)" : "Utilidad Bruta en Ventas";
            } else if (sector === 'GUB') {
                labelVentas = "Ingresos de Gestión / Tributarios";
                labelCostos = "Costos de Transferencias y Servicios";
                labelMargen = "Ahorro/Desahorro de Gestión";
            }

            let html = `
                <div class="space-y-1 text-[13px] text-slate-700 font-sans">
                    <div class="flex justify-between items-center mb-1 bg-slate-50/50 p-1 rounded-lg">
                        <span class="w-1/2 font-bold">${labelVentas}</span>
                        <div class="w-1/2 flex justify-between">
                            <span class="w-1/2"></span>
                            <span class="w-1/2 text-right text-slate-900">$ ${fmtUI(tIngresos)}</span>
                        </div>
                    </div>
                    ${ingresos.map(a => `<div class="flex justify-between text-[11px] text-slate-500 pl-4"><span class="truncate pr-2">${a.nombre}</span><div class="w-1/2 flex justify-between"><span class="w-1/2 text-right">${fmtUI(a.val)}</span><span class="w-1/2"></span></div></div>`).join('')}
                    
                    <div class="flex justify-between items-center mt-2 mb-2">
                        <span class="w-1/2 font-bold">- ${labelCostos}</span>
                        <div class="w-1/2 flex justify-between">
                            <span class="w-1/2"></span>
                            <span class="w-1/2 text-right border-b border-slate-400 pb-1">${fmtNegUI(tCostos)}</span>
                        </div>
                    </div>
                    ${costos.map(a => `<div class="flex justify-between text-[11px] text-slate-500 pl-4"><span class="truncate pr-2">${a.nombre}</span><div class="w-1/2 flex justify-between"><span class="w-1/2 text-right">${fmtUI(a.val)}</span><span class="w-1/2"></span></div></div>`).join('')}

                    ${layoutAgroHTML}

                    <div class="flex justify-between items-center font-black text-sky-700 mb-4 bg-sky-50/30 p-1 rounded-lg border-y border-sky-100">
                        <span class="w-1/2 uppercase tracking-tight text-[11px]">= ${labelMargen}</span>
                        <div class="w-1/2 flex justify-between">
                            <span class="w-1/2"></span>
                            <span class="w-1/2 text-right">${fmtUI(margenPrincipal)}</span>
                        </div>
                    </div>

                    <div class="flex justify-between items-center mb-1">
                        <span class="w-1/2 font-bold">- Gastos de Operación y Administración</span>
                        <div class="w-1/2 flex justify-between"></div>
                    </div>
                    ${gastosOp.map((a, i) => `
                        <div class="flex justify-between items-center text-slate-600 pl-4">
                            <span class="w-1/2 truncate pr-2">${a.nombre}</span>
                            <div class="w-1/2 flex justify-between">
                                <span class="w-1/2 text-right ${i === gastosOp.length - 1 ? 'border-b border-slate-400 pb-1' : ''}">${i === 0 ? '$ ' : ''}${fmtUI(a.val)}</span>
                                <span class="w-1/2 text-right"></span>
                            </div>
                        </div>
                    `).join('')}
                    ${gastosOp.length > 0 ? `
                        <div class="flex justify-between items-center">
                            <span class="w-1/2"></span>
                            <div class="w-1/2 flex justify-between">
                                <span class="w-1/2"></span>
                                <span class="w-1/2 text-right">${fmtNegUI(tGastosOp)}</span>
                            </div>
                        </div>
                    ` : ''}

                    <div class="flex justify-between items-center font-bold text-slate-900 mt-3 mb-4">
                        <span class="w-1/2">= Utilidad de Operación</span>
                        <div class="w-1/2 flex justify-between">
                            <span class="w-1/2"></span>
                            <span class="w-1/2 text-right">${fmtUI(utilidadOp)}</span>
                        </div>
                    </div>

                    <div class="flex justify-between items-center mb-1">
                        <span class="w-1/2 font-bold text-xs">+/- Otros Ingresos y Gastos</span>
                        <div class="w-1/2 flex justify-between"></div>
                    </div>
                    ${otrosIng.map(a => `
                        <div class="flex justify-between items-center text-slate-600 pl-4">
                            <span class="w-1/2 truncate pr-2">+ ${a.nombre}</span>
                            <div class="w-1/2 flex justify-between">
                                <span class="w-1/2 text-right">${fmtUI(a.val)}</span>
                                <span class="w-1/2 text-right"></span>
                            </div>
                        </div>
                    `).join('')}
                    ${otrosGas.map((a, i) => `
                        <div class="flex justify-between items-center text-slate-600 pl-4">
                            <span class="w-1/2 truncate pr-2">- ${a.nombre}</span>
                            <div class="w-1/2 flex justify-between">
                                <span class="w-1/2 text-right ${i === otrosGas.length - 1 ? 'border-b border-slate-400 pb-1' : ''}">${fmtNegUI(a.val)}</span>
                                <span class="w-1/2 text-right"></span>
                            </div>
                        </div>
                    `).join('')}
                    ${(otrosIng.length > 0 || otrosGas.length > 0) ? `
                        <div class="flex justify-between items-center">
                            <span class="w-1/2"></span>
                            <div class="w-1/2 flex justify-between">
                                <span class="w-1/2"></span>
                                <span class="w-1/2 text-right border-b border-slate-400 pb-1">${fmtUI(netoOtros)}</span>
                            </div>
                        </div>
                    ` : ''}

                    <div class="flex justify-between items-center font-black text-slate-900 mt-4 pt-2 border-t-2 border-slate-800 text-sm">
                        <span class="w-1/2">= Resultado Final del Ejercicio</span>
                        <div class="w-1/2 flex justify-between">
                            <span class="w-1/2"></span>
                            <span class="w-1/2 text-right border-b-4 border-double border-slate-800">$ ${fmtUI(utilidadFinal)}</span>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('res-body-content').innerHTML = html;
        }

window.renderBalance = function(accounts) {
            const projName = document.getElementById('current-project-name').innerText;
            const project = typeof window.proyecto_actual !== 'undefined' ? window.proyecto_actual : null;
            const sector = project?.sector || 'COM';
            document.getElementById('bal-entidad').innerText = projName;

            const utilidad = calcularUtilidad(accounts);

            let baseActivos = [], basePasivos = [], patrimonios = [];
            accounts.forEach(a => {
                const info = clasificarCuenta(a);
                if (info.tipo === 'Activo') {
                    if (a.saldoAcreedor > a.saldoDeudor) basePasivos.push(a);
                    else baseActivos.push(a);
                } else if (info.tipo === 'Pasivo') {
                    if (a.saldoDeudor > a.saldoAcreedor) baseActivos.push(a);
                    else basePasivos.push(a);
                } else if (info.tipo === 'Patrimonio') { patrimonios.push(a); }
            });

            // Agrupación Multisectorial
            const agruparLista = (lista, tipoContexto) => {
                const grupos = {};
                lista.forEach(a => {
                    const info = clasificarCuenta(a);
                    // Caso SSF: No usa Corriente/No Corriente usualmente, sino liquidez.
                    const clase = (sector === 'SSF' || sector === 'GUB') ? 'Unificada' : info.clase;
                    const rKey = info.rubroId;
                    if (!grupos[clase]) grupos[clase] = {};
                    if (!grupos[clase][rKey]) grupos[clase][rKey] = { nombre: info.rubroNombre, cuentas: [], total: 0 };
                    const val = (tipoContexto === 'Activo') ? (a.saldoDeudor - a.saldoAcreedor) : (a.saldoAcreedor - a.saldoDeudor);
                    grupos[clase][rKey].cuentas.push({ ...a, val });
                    grupos[clase][rKey].total += val;
                });
                return grupos;
            };

            const activosG = agruparLista(baseActivos, 'Activo');
            const pasivosG = agruparLista(basePasivos, 'Pasivo');
            let tActivo = 0, tPasivo = 0, tPatrimonio = 0;

            const renderSeccion = (grupos, tipo) => {
                let html = '';
                const clases = (sector === 'SSF' || sector === 'GUB') ? ['Unificada'] : ['Corriente', 'No Corriente', 'Mixto'];

                clases.forEach(cl => {
                    if (grupos[cl]) {
                        let innerHtml = '';
                        Object.entries(grupos[cl]).sort((a, b) => a[0].localeCompare(b[0])).forEach(([key, rubro]) => {
                            if (Math.abs(rubro.total) < 0.01) return;
                            innerHtml += `<div class="pl-2 mb-3">
                                <div class="flex justify-between items-center font-bold text-slate-700 text-[12px] mb-1">
                                    <span>${rubro.nombre}</span>
                                    <span class="font-mono">$ ${fmtUI(rubro.total)}</span>
                                </div>`;
                            rubro.cuentas.forEach(a => {
                                if (Math.abs(a.val) < 0.01) return;
                                innerHtml += `<div class="flex justify-between text-[11px] text-slate-500 pl-4 border-l border-slate-50 ml-1 mb-0.5">
                                    <span class="truncate pr-2">${a.nombre}</span>
                                    <span class="font-mono text-[10px]">${fmtUI(a.val)}</span>
                                </div>`;
                            });
                            innerHtml += `</div>`;
                        });

                        if (innerHtml) {
                            const totalSecc = Object.values(grupos[cl]).reduce((acc, r) => acc + r.total, 0);
                            const labelClase = (sector === 'SSF' || sector === 'GUB') ?
                                (tipo === 'Activo' ? 'Activos según Liquidez' : 'Pasivos según Exigibilidad') :
                                getClaseNombre(cl, tipo);
                            html += `
                                <div class="mt-4 mb-2 flex justify-between items-end border-b-2 border-slate-200 pb-1">
                                    <h5 class="text-[11px] font-black text-slate-800 uppercase tracking-widest">${labelClase}</h5>
                                    <span class="text-[12px] font-black text-slate-900">$ ${fmtUI(totalSecc)}</span>
                                </div>` + innerHtml;
                        }
                    }
                });
                return html;
            };

            document.getElementById('bal-activos').innerHTML = renderSeccion(activosG, 'Activo') || '<div class="text-slate-400 italic text-xs">Sin activos reportables.</div>';
            document.getElementById('bal-pasivos').innerHTML = renderSeccion(pasivosG, 'Pasivo') || '<div class="text-slate-400 italic text-xs">Sin pasivos reportables.</div>';

            Object.values(activosG).forEach(cl => Object.values(cl).forEach(r => tActivo += r.total));
            Object.values(pasivosG).forEach(cl => Object.values(cl).forEach(r => tPasivo += r.total));

            let htmlPatrimonio = patrimonios.map(a => {
                const v = a.saldoAcreedor - a.saldoDeudor; tPatrimonio += v;
                return `<div class="flex justify-between border-b border-dashed border-slate-200 pb-1 mb-1"><span class="text-slate-600 text-[11px]">${a.nombre}</span><span class="font-mono text-[11px]">$ ${fmtUI(v)}</span></div>`;
            }).join('') || (utilidad === 0 ? '<div class="text-slate-400 italic text-xs">Sin patrimonio.</div>' : '');

            document.getElementById('bal-patrimonio').innerHTML = htmlPatrimonio;
            document.getElementById('bal-resultado-ej').innerText = `$ ${fmtUI(utilidad)}`;
            tPatrimonio += utilidad;
            const tPasPat = tPasivo + tPatrimonio;

            document.getElementById('bal-tot-activo').innerText = `$ ${fmtUI(tActivo)}`;
            document.getElementById('bal-tot-pas-pat').innerText = `$ ${fmtUI(tPasPat)}`;

            const verifEl = document.getElementById('bal-verificacion');
            const margenError = Math.abs(tActivo - tPasPat);
            if (margenError < 0.01 && tActivo > 0) {
                verifEl.className = "p-4 text-center font-bold text-xs uppercase tracking-widest bg-emerald-500 text-white rounded-[36px] shadow-md";
                verifEl.innerText = `Balance ${sector} Cuadrado`;
            } else if (tActivo === 0) {
                verifEl.className = "p-4 text-center font-bold text-xs uppercase tracking-widest bg-slate-100 text-slate-500 rounded-[36px]";
                verifEl.innerText = "Sin movimientos registrados";
            } else {
                verifEl.className = "p-4 text-center font-bold text-xs uppercase tracking-widest bg-rose-500 text-white rounded-[36px] shadow-md";
                verifEl.innerText = `Descuadre: $ ${fmtUI(margenError)}`;
            }
        }

window.calc = function(id) {
            const b = document.getElementById(id); if (!b) return;
            let d = 0, h = 0;
            b.querySelectorAll('.val-debe').forEach(i => d += parseLocalFloat(i.value));
            b.querySelectorAll('.val-haber').forEach(i => h += parseLocalFloat(i.value));
            b.querySelector('.total-debe').innerText = `$ ${fmtUI(d)}`;
            b.querySelector('.total-haber').innerText = `$ ${fmtUI(h)}`;
            const badge = b.querySelector('.balance-status'); const ok = d > 0 && Math.abs(d - h) < 0.01;
            badge.className = `balance-status px-3 py-1 rounded-[36px] text-[9px] font-black uppercase ${ok ? 'balanced' : 'unbalanced'}`;
            badge.innerText = ok ? "Cuadrado" : "Descuadrado";
        }

window.calcularUtilidad = function(accounts) {
            let utilidad = 0;
            accounts.forEach(a => {
                if (clasificarCuenta(a).tipo === 'Resultado') {
                    // Ingresos suman (Acreedor > Deudor), Gastos/Costos restan (Deudor > Acreedor)
                    utilidad += (a.saldoAcreedor - a.saldoDeudor);
                }
            });
            return utilidad;
        }

