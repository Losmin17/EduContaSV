const escContab = (v) => (window.EduSec && typeof window.EduSec.escapeHtml === 'function')
    ? window.EduSec.escapeHtml(v)
    : String(v ?? '').replace(/[&<>"'`]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[ch]));
const round2 = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100;

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
                    const d = round2(parseLocalFloat(inps[2].value));
                    const h = round2(parseLocalFloat(inps[3].value));

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
                    if (d > 0) { accs[key].debeList.push({ val: d, ref: partidaRef }); accs[key].totDebe = round2(accs[key].totDebe + d); }
                    if (h > 0) { accs[key].haberList.push({ val: h, ref: partidaRef }); accs[key].totHaber = round2(accs[key].totHaber + h); }
                });
            });

            // Determina saldos
            Object.values(accs).forEach(a => {
                a.saldoDeudor = 0; a.saldoAcreedor = 0;
                if (a.totDebe >= a.totHaber) {
                    a.saldoDeudor = round2(a.totDebe - a.totHaber);
                } else {
                    a.saldoAcreedor = round2(a.totHaber - a.totDebe);
                }
            });

            return Object.values(accs).sort((a, b) => a.codigo.localeCompare(b.codigo));
        }

window.renderMayor = function(accounts) {
            const grid = document.getElementById('mayor-grid');
            if (!grid) return;

            if (!accounts || accounts.length === 0) {
                grid.innerHTML = `<div class="col-span-full p-8 text-center text-slate-400 italic text-xs bg-white/60 rounded-3xl border border-slate-200">No hay movimientos registrados en el Libro Diario para mayorizar.</div>`;
                return;
            }

            grid.innerHTML = accounts.map(a => {
                const totDebe = round2(a.totDebe);
                const totHaber = round2(a.totHaber);
                const saldoDeudor = round2(a.saldoDeudor);
                const saldoAcreedor = round2(a.saldoAcreedor);
                const debeRows = (a.debeList || []).map(m => `
                    <div class="flex justify-between items-center text-[11px] py-1 px-2 border-b border-slate-100 last:border-none">
                        <span class="text-[9px] font-bold text-slate-400 uppercase">Pda #${escContab(m.ref)}</span>
                        <span class="font-bold text-slate-700 tabular-nums">$ ${fmtUI(round2(m.val))}</span>
                    </div>
                `).join('') || `<div class="text-[10px] text-slate-300 italic py-2 text-center">Sin cargos</div>`;

                const haberRows = (a.haberList || []).map(m => `
                    <div class="flex justify-between items-center text-[11px] py-1 px-2 border-b border-slate-100 last:border-none">
                        <span class="font-bold text-slate-700 tabular-nums">$ ${fmtUI(round2(m.val))}</span>
                        <span class="text-[9px] font-bold text-slate-400 uppercase">Pda #${escContab(m.ref)}</span>
                    </div>
                `).join('') || `<div class="text-[10px] text-slate-300 italic py-2 text-center">Sin abonos</div>`;

                return `
                    <div class="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div class="bg-slate-900 text-white px-4 py-3 text-center border-b-2 border-slate-800">
                            <span class="text-[10px] font-black text-sky-400 uppercase tracking-widest block">${escContab(a.codigo || 'S/C')}</span>
                            <h4 class="font-black text-xs uppercase tracking-wide truncate" title="${escContab(a.nombre)}">${escContab(a.nombre)}</h4>
                        </div>
                        <div class="grid grid-cols-2 divide-x-2 divide-slate-800 flex-1 min-h-[120px]">
                            <div class="p-2 flex flex-col justify-between">
                                <div>
                                    <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-200 pb-1 mb-1">Debe (Cargos)</div>
                                    ${debeRows}
                                </div>
                                <div class="mt-2 pt-1.5 border-t border-slate-300 flex justify-between items-center text-[11px] font-black text-slate-800 px-1">
                                    <span>Suma</span>
                                    <span class="tabular-nums">$ ${fmtUI(totDebe)}</span>
                                </div>
                            </div>
                            <div class="p-2 flex flex-col justify-between">
                                <div>
                                    <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-200 pb-1 mb-1">Haber (Abonos)</div>
                                    ${haberRows}
                                </div>
                                <div class="mt-2 pt-1.5 border-t border-slate-300 flex justify-between items-center text-[11px] font-black text-slate-800 px-1">
                                    <span>Suma</span>
                                    <span class="tabular-nums">$ ${fmtUI(totHaber)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="bg-slate-50 px-4 py-2.5 border-t-2 border-slate-800 flex justify-between items-center text-xs font-black">
                            ${saldoDeudor >= saldoAcreedor
                                ? `<span class="text-emerald-600 uppercase text-[10px]">Saldo Deudor</span><span class="text-emerald-700 tabular-nums">$ ${fmtUI(saldoDeudor)}</span>`
                                : `<span class="text-indigo-600 uppercase text-[10px]">Saldo Acreedor</span><span class="text-indigo-700 tabular-nums">$ ${fmtUI(saldoAcreedor)}</span>`
                            }
                        </div>
                    </div>
                `;
            }).join('');
        };

window.renderComprobacion = function(accounts, entityName) {
            const projName = entityName || document.getElementById('current-project-name')?.innerText || 'ENTIDAD';
            const entEl = document.getElementById('comp-entidad');
            if (entEl) entEl.innerText = projName;

            const tbody = document.getElementById('comprobacion-body');
            if (!tbody) return;

            let sumMovDebe = 0;
            let sumMovHaber = 0;
            let sumSalDebe = 0;
            let sumSalHaber = 0;

            if (!accounts || accounts.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-400 italic text-xs">Sin movimientos registrados en el Libro Diario.</td></tr>`;
            } else {
                tbody.innerHTML = accounts.map(a => {
                    const md = round2(a.totDebe);
                    const mh = round2(a.totHaber);
                    const sd = round2(a.saldoDeudor);
                    const sh = round2(a.saldoAcreedor);

                    sumMovDebe = round2(sumMovDebe + md);
                    sumMovHaber = round2(sumMovHaber + mh);
                    sumSalDebe = round2(sumSalDebe + sd);
                    sumSalHaber = round2(sumSalHaber + sh);

                    return `
                        <tr class="hover:bg-slate-50/80 transition-colors text-xs">
                            <td class="py-2.5 px-4 font-black text-sky-600 tabular-nums">${escContab(a.codigo)}</td>
                            <td class="py-2.5 px-4 font-bold text-slate-700">${escContab(a.nombre)}</td>
                            <td class="py-2.5 px-4 text-right tabular-nums border-l border-slate-100">${md > 0 ? '$ ' + fmtUI(md) : '-'}</td>
                            <td class="py-2.5 px-4 text-right tabular-nums border-l border-slate-100">${mh > 0 ? '$ ' + fmtUI(mh) : '-'}</td>
                            <td class="py-2.5 px-4 text-right font-bold text-emerald-700 tabular-nums border-l border-slate-100">${sd > 0 ? '$ ' + fmtUI(sd) : '-'}</td>
                            <td class="py-2.5 px-4 text-right font-bold text-indigo-700 tabular-nums border-l border-slate-100">${sh > 0 ? '$ ' + fmtUI(sh) : '-'}</td>
                        </tr>
                    `;
                }).join('');
            }

            const elMD = document.getElementById('comp-mov-debe');
            const elMH = document.getElementById('comp-mov-haber');
            const elSD = document.getElementById('comp-sal-debe');
            const elSH = document.getElementById('comp-sal-haber');
            if (elMD) elMD.innerText = `$ ${fmtUI(sumMovDebe)}`;
            if (elMH) elMH.innerText = `$ ${fmtUI(sumMovHaber)}`;
            if (elSD) elSD.innerText = `$ ${fmtUI(sumSalDebe)}`;
            if (elSH) elSH.innerText = `$ ${fmtUI(sumSalHaber)}`;
        };

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
                    const val = round2((tipoContexto === 'Activo') ? (a.saldoDeudor - a.saldoAcreedor) : (a.saldoAcreedor - a.saldoDeudor));
                    grupos[cl][rKey].cuentas.push({ ...a, val });
                    grupos[cl][rKey].total = round2(grupos[cl][rKey].total + val);
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
                                <div class="flex justify-between font-bold text-slate-700 text-[11px]"><span>${escContab(r.nombre)}</span><span>$ ${fmtUI(r.total)}</span></div>`;
                            r.cuentas.forEach(a => {
                                if (Math.abs(a.val) < 0.01) return;
                                innerHtml += `<div class="flex justify-between text-[10px] text-slate-500 pl-3"><span>${escContab(a.nombre)}</span><span>${fmtUI(a.val)}</span></div>`;
                            });
                            innerHtml += `</div>`;
                        });
                        if (innerHtml) {
                            const totalSeccion = round2(Object.values(grupos[cl]).reduce((acc, r) => acc + r.total, 0));
                            const labelClase = (sector === 'SSF' || sector === 'GUB') ?
                                (tipo === 'Activo' ? 'Activos según Liquidez' : 'Pasivos según Exigibilidad') :
                                getClaseNombre(cl, tipo);
                            html += `
                                <div class="mt-4 mb-2 flex justify-between items-end border-b-2 border-slate-200 pb-1">
                                    <h5 class="text-[10px] font-black text-slate-800 uppercase tracking-widest">${escContab(labelClase)}</h5>
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
            Object.values(activosG).forEach(cl => Object.values(cl).forEach(r => tActivo = round2(tActivo + r.total)));
            // Totales Pasivo
            Object.values(pasivosG).forEach(cl => Object.values(cl).forEach(r => tPasivo = round2(tPasivo + r.total)));

            // Render Patrimonio Refinado
            let htmlPatrimonio = '';
            if (patrimonios.length > 0) {
                htmlPatrimonio = patrimonios.map(a => {
                    const v = round2(a.saldoAcreedor - a.saldoDeudor); tPatrimonio = round2(tPatrimonio + v);
                    return `<div class="flex justify-between border-b border-dashed border-slate-200 pb-1 mb-1"><span class="text-slate-600 text-[10px]">${escContab(a.nombre)}</span><span class="tabular-nums text-[10px]">$ ${fmtUI(v)}</span></div>`;
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

            tPatrimonio = round2(tPatrimonio + utilidad);
            const tPasPat = round2(tPasivo + tPatrimonio);

            document.getElementById('ini-tot-activo').innerText = `$ ${fmtUI(tActivo)}`;
            document.getElementById('ini-tot-pas-pat').innerText = `$ ${fmtUI(tPasPat)}`;

            const verifEl = document.getElementById('ini-verificacion');
            const margenError = round2(Math.abs(tActivo - tPasPat));
            if (margenError < 0.01 && tActivo > 0) {
                verifEl.className = "p-4 text-center font-bold text-xs uppercase tracking-widest bg-emerald-500 text-white rounded-[36px] shadow-md";
                verifEl.innerText = "¡Balance Inicial Cuadrado!";
            } else if (tActivo === 0) {
                verifEl.className = "p-4 text-center font-bold text-xs uppercase tracking-widest bg-slate-100 text-slate-500 rounded-[36px]";
                verifEl.innerText = "Sin movimientos registrados";
            } else {
                verifEl.className = "p-4 text-center font-bold text-xs uppercase tracking-widest bg-rose-500 text-white rounded-[36px] shadow-md";
                verifEl.innerText = `Descuadre: $ ${fmtUI(margenError)}`;
            }
        };

window.renderResultados = function(accounts) {
            const projName = document.getElementById('current-project-name').innerText;
            const project = typeof window.proyecto_actual !== 'undefined' ? window.proyecto_actual : null;
            const sector = project?.sector || 'COM';
            const catalogo = project?.catalogo || 'MAESTRO';
            document.getElementById('res-entidad').innerText = projName;

            let ingresos = [], costos = [], gastosOp = [], otrosIng = [], otrosGas = [];
            let variacionValorRazonable = 0; // Para AGR (NIC 41)

            accounts.forEach(a => {
                const clasif = clasificarCuenta(a);
                if (clasif.tipo !== 'Resultado') return;
                const val = round2(Math.abs(a.saldoAcreedor - a.saldoDeudor));
                if (val === 0) return;

                // Lógica de Variación Biológica (NICS - NIC 41)
                // Usualmente cuentas 41xx (Ganancia) o 42xx (Pérdida) en catálogos agrícolas
                if (sector === 'NICS' && (a.nombre.toLowerCase().includes('valor razonable') || a.nombre.toLowerCase().includes('biológica'))) {
                    if (a.saldoAcreedor > a.saldoDeudor) variacionValorRazonable = round2(variacionValorRazonable + val);
                    else variacionValorRazonable = round2(variacionValorRazonable - val);
                    return; // Se procesará en un rubro especial
                }

                if (clasif.sub === 'Ingreso') ingresos.push({ ...a, val });
                else if (clasif.sub === 'Costo') costos.push({ ...a, val });
                else if (clasif.sub === 'Gasto') gastosOp.push({ ...a, val });
                else if (clasif.sub === 'OtrosIngresos') otrosIng.push({ ...a, val });
                else if (clasif.sub === 'OtrosGastos') otrosGas.push({ ...a, val });
                else {
                    if (a.saldoAcreedor > a.saldoDeudor) otrosIng.push({ ...a, val });
                    else otrosGas.push({ ...a, val });
                }
            });

            const sum = (arr) => round2(arr.reduce((acc, el) => acc + el.val, 0));
            const tIngresos = sum(ingresos);
            const tCostos = sum(costos);

            // Margen Operativo Base
            let margenPrincipal = round2(tIngresos - tCostos);

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
                margenPrincipal = round2(margenPrincipal + variacionValorRazonable);
            }

            const tGastosOp = sum(gastosOp);
            const utilidadOp = round2(margenPrincipal - tGastosOp);
            const netoOtros = round2(sum(otrosIng) - sum(otrosGas));
            const utilidadFinal = round2(utilidadOp + netoOtros);

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
                        <span class="w-1/2 font-bold">${escContab(labelVentas)}</span>
                        <div class="w-1/2 flex justify-between">
                            <span class="w-1/2"></span>
                            <span class="w-1/2 text-right text-slate-900">$ ${fmtUI(tIngresos)}</span>
                        </div>
                    </div>
                    ${ingresos.map(a => `<div class="flex justify-between text-[11px] text-slate-500 pl-4"><span class="truncate pr-2">${escContab(a.nombre)}</span><div class="w-1/2 flex justify-between"><span class="w-1/2 text-right">${fmtUI(a.val)}</span><span class="w-1/2"></span></div></div>`).join('')}
                    
                    <div class="flex justify-between items-center mt-2 mb-2">
                        <span class="w-1/2 font-bold">- ${escContab(labelCostos)}</span>
                        <div class="w-1/2 flex justify-between">
                            <span class="w-1/2"></span>
                            <span class="w-1/2 text-right border-b border-slate-400 pb-1">${fmtNegUI(tCostos)}</span>
                        </div>
                    </div>
                    ${costos.map(a => `<div class="flex justify-between text-[11px] text-slate-500 pl-4"><span class="truncate pr-2">${escContab(a.nombre)}</span><div class="w-1/2 flex justify-between"><span class="w-1/2 text-right">${fmtUI(a.val)}</span><span class="w-1/2"></span></div></div>`).join('')}

                    ${layoutAgroHTML}

                    <div class="flex justify-between items-center font-black text-sky-700 mb-4 bg-sky-50/30 p-1 rounded-lg border-y border-sky-100">
                        <span class="w-1/2 uppercase tracking-tight text-[11px]">= ${escContab(labelMargen)}</span>
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
                            <span class="w-1/2 truncate pr-2">${escContab(a.nombre)}</span>
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
                            <span class="w-1/2 truncate pr-2">+ ${escContab(a.nombre)}</span>
                            <div class="w-1/2 flex justify-between">
                                <span class="w-1/2 text-right">${fmtUI(a.val)}</span>
                                <span class="w-1/2 text-right"></span>
                            </div>
                        </div>
                    `).join('')}
                    ${otrosGas.map((a, i) => `
                        <div class="flex justify-between items-center text-slate-600 pl-4">
                            <span class="w-1/2 truncate pr-2">- ${escContab(a.nombre)}</span>
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
                    const val = round2((tipoContexto === 'Activo') ? (a.saldoDeudor - a.saldoAcreedor) : (a.saldoAcreedor - a.saldoDeudor));
                    grupos[clase][rKey].cuentas.push({ ...a, val });
                    grupos[clase][rKey].total = round2(grupos[clase][rKey].total + val);
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
                                    <span>${escContab(rubro.nombre)}</span>
                                    <span class="tabular-nums">$ ${fmtUI(rubro.total)}</span>
                                </div>`;
                            rubro.cuentas.forEach(a => {
                                if (Math.abs(a.val) < 0.01) return;
                                innerHtml += `<div class="flex justify-between text-[11px] text-slate-500 pl-4 border-l border-slate-50 ml-1 mb-0.5">
                                    <span class="truncate pr-2">${escContab(a.nombre)}</span>
                                    <span class="tabular-nums text-[10px]">${fmtUI(a.val)}</span>
                                </div>`;
                            });
                            innerHtml += `</div>`;
                        });

                        if (innerHtml) {
                            const totalSecc = round2(Object.values(grupos[cl]).reduce((acc, r) => acc + r.total, 0));
                            const labelClase = (sector === 'SSF' || sector === 'GUB') ?
                                (tipo === 'Activo' ? 'Activos según Liquidez' : 'Pasivos según Exigibilidad') :
                                getClaseNombre(cl, tipo);
                            html += `
                                <div class="mt-4 mb-2 flex justify-between items-end border-b-2 border-slate-200 pb-1">
                                    <h5 class="text-[11px] font-black text-slate-800 uppercase tracking-widest">${escContab(labelClase)}</h5>
                                    <span class="text-[12px] font-black text-slate-900">$ ${fmtUI(totalSecc)}</span>
                                </div>` + innerHtml;
                        }
                    }
                });
                return html;
            };

            document.getElementById('bal-activos').innerHTML = renderSeccion(activosG, 'Activo') || '<div class="text-slate-400 italic text-xs">Sin activos reportables.</div>';
            document.getElementById('bal-pasivos').innerHTML = renderSeccion(pasivosG, 'Pasivo') || '<div class="text-slate-400 italic text-xs">Sin pasivos reportables.</div>';

            Object.values(activosG).forEach(cl => Object.values(cl).forEach(r => tActivo = round2(tActivo + r.total)));
            Object.values(pasivosG).forEach(cl => Object.values(cl).forEach(r => tPasivo = round2(tPasivo + r.total)));

            let htmlPatrimonio = patrimonios.map(a => {
                const v = round2(a.saldoAcreedor - a.saldoDeudor); tPatrimonio = round2(tPatrimonio + v);
                return `<div class="flex justify-between border-b border-dashed border-slate-200 pb-1 mb-1"><span class="text-slate-600 text-[11px]">${escContab(a.nombre)}</span><span class="tabular-nums text-[11px]">$ ${fmtUI(v)}</span></div>`;
            }).join('') || (utilidad === 0 ? '<div class="text-slate-400 italic text-xs">Sin patrimonio.</div>' : '');

            document.getElementById('bal-patrimonio').innerHTML = htmlPatrimonio;
            document.getElementById('bal-resultado-ej').innerText = `$ ${fmtUI(utilidad)}`;
            tPatrimonio = round2(tPatrimonio + utilidad);
            const tPasPat = round2(tPasivo + tPatrimonio);

            document.getElementById('bal-tot-activo').innerText = `$ ${fmtUI(tActivo)}`;
            document.getElementById('bal-tot-pas-pat').innerText = `$ ${fmtUI(tPasPat)}`;

            const verifEl = document.getElementById('bal-verificacion');
            const margenError = round2(Math.abs(tActivo - tPasPat));
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
            b.querySelectorAll('.val-debe').forEach(i => { d = round2(d + parseLocalFloat(i.value)); });
            b.querySelectorAll('.val-haber').forEach(i => { h = round2(h + parseLocalFloat(i.value)); });
            b.querySelector('.total-debe').innerText = `$ ${fmtUI(d)}`;
            b.querySelector('.total-haber').innerText = `$ ${fmtUI(h)}`;
            const badge = b.querySelector('.balance-status');
            const ok = d > 0 && Math.round(d * 100) === Math.round(h * 100);
            badge.className = `balance-status px-3 py-1 rounded-[36px] text-[9px] font-black uppercase ${ok ? 'balanced' : 'unbalanced'}`;
            badge.innerText = ok ? "Cuadrado" : "Descuadrado";
        }

window.calcularUtilidad = function(accounts) {
            let utilidad = 0;
            accounts.forEach(a => {
                if (clasificarCuenta(a).tipo === 'Resultado') {
                    // Ingresos suman (Acreedor > Deudor), Gastos/Costos restan (Deudor > Acreedor)
                    utilidad = round2(utilidad + (a.saldoAcreedor - a.saldoDeudor));
                }
            });
            return utilidad;
        }


// =========================================================================
// MÓDULO TRIBUTARIO Y FISCAL / EL SALVADOR (BTVAC 2.1 - 2.2)
// Ley de IVA, F-07, F-14 y Libros Legales de IVA (Arts. 141-142 CT)
// =========================================================================

window._tributarioMode = 'practica';
window._tributarioRealData = {
    ventasGravadas: 0,
    debitoFiscal: 0,
    ventasConsumidorFinal: 0,
    debitoConsumidorFinal: 0,
    totalDebito: 0,
    comprasGravadas: 0,
    creditoFiscal: 0,
    importaciones: 0,
    creditoImportaciones: 0,
    remanenteAnterior: 0,
    totalCredito: 0,
    impuestoDeterminado: 0,
    remanenteSiguiente: 0,
    retenciones1: 0,
    ivaPagar: 0,
    ingresosMes: 0,
    pagoCuenta: 0,
    totalPagarF07: 0,
    honorariosBase: 0,
    retencion10: 0,
    comprasIva1Base: 0,
    retencionIva1: 0,
    totalF14: 0
};

window.setTributarioMode = function (mode) {
    window._tributarioMode = mode;
    const btnAsistido = document.getElementById('btn-trib-mode-asistido');
    const btnPractica = document.getElementById('btn-trib-mode-practica');
    const panelAudit = document.getElementById('panel-audit-tributario');
    if (panelAudit) panelAudit.classList.add('hidden');

    if (mode === 'asistido') {
        if (btnAsistido) {
            btnAsistido.className = "px-4 py-2 rounded-xl transition-all duration-200 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm flex items-center gap-2";
        }
        if (btnPractica) {
            btnPractica.className = "px-4 py-2 rounded-xl transition-all duration-200 text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-2";
        }
        // Poblar con datos reales
        window.populateTributarioInputs(window._tributarioRealData);
        window.calcF07Live();
        window.calcF14Live();
    } else {
        if (btnPractica) {
            btnPractica.className = "px-4 py-2 rounded-xl transition-all duration-200 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm flex items-center gap-2";
        }
        if (btnAsistido) {
            btnAsistido.className = "px-4 py-2 rounded-xl transition-all duration-200 text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-2";
        }
        // Limpiar para práctica manual
        const fields = ['f07-cas-10', 'f07-cas-20', 'f07-cas-50', 'f07-cas-60', 'f07-cas-75', 'f07-cas-100', 'f14-ingresos-mes', 'f14-base-profesionales', 'f14-base-iva1'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        window.calcF07Live();
        window.calcF14Live();
    }
};

window.switchTributarioSubTab = function (subTabId) {
    const tabs = ['f07', 'f14', 'libros'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-trib-${t}`);
        const view = document.getElementById(`subview-trib-${t}`);
        if (btn) {
            if (t === subTabId) {
                btn.className = "px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800";
            } else {
                btn.className = "px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 border border-transparent";
            }
        }
        if (view) {
            if (t === subTabId) {
                view.classList.remove('hidden');
            } else {
                view.classList.add('hidden');
            }
        }
    });
};

window.populateTributarioInputs = function (data) {
    const setVal = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = (v > 0) ? Number(v).toFixed(2) : '';
    };
    setVal('f07-cas-10', data.ventasGravadas);
    setVal('f07-cas-20', data.ventasConsumidorFinal);
    setVal('f07-cas-50', data.comprasGravadas);
    setVal('f07-cas-60', data.importaciones);
    setVal('f07-cas-75', data.remanenteAnterior);
    setVal('f07-cas-100', data.retenciones1);
    setVal('f14-ingresos-mes', data.ingresosMes);
    setVal('f14-base-profesionales', data.honorariosBase);
    setVal('f14-base-iva1', data.comprasIva1Base);
};

window.calcF07Live = function () {
    const getNum = id => {
        const el = document.getElementById(id);
        return el ? (parseFloat(el.value) || 0) : 0;
    };
    const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.innerText = txt;
    };

    // Casilla 10 y 15 (Ventas CCF)
    const cas10 = getNum('f07-cas-10');
    const cas15 = Math.round(cas10 * 0.13 * 100) / 100;
    setTxt('f07-cas-15', `$ ${fmtUI(cas15)}`);

    // Casilla 20 y 25 (Ventas CF - IVA incluido)
    const cas20 = getNum('f07-cas-20');
    const cas25 = Math.round((cas20 * (13 / 113)) * 100) / 100;
    setTxt('f07-cas-25', `$ ${fmtUI(cas25)}`);

    // Casilla 40 (Total Débito Fiscal)
    const cas40 = Math.round((cas15 + cas25) * 100) / 100;
    setTxt('f07-cas-40', `$ ${fmtUI(cas40)}`);

    // Casilla 50 y 55 (Compras Locales)
    const cas50 = getNum('f07-cas-50');
    const cas55 = Math.round(cas50 * 0.13 * 100) / 100;
    setTxt('f07-cas-55', `$ ${fmtUI(cas55)}`);

    // Casilla 60 y 65 (Importaciones)
    const cas60 = getNum('f07-cas-60');
    const cas65 = Math.round(cas60 * 0.13 * 100) / 100;
    setTxt('f07-cas-65', `$ ${fmtUI(cas65)}`);

    // Casilla 75 (Remanente anterior)
    const cas75 = getNum('f07-cas-75');

    // Casilla 80 (Total Crédito Fiscal)
    const cas80 = Math.round((cas55 + cas65 + cas75) * 100) / 100;
    setTxt('f07-cas-80', `$ ${fmtUI(cas80)}`);

    // Liquidación IVA
    let cas90 = 0; // Impuesto determinado
    let cas95 = 0; // Remanente a favor
    if (cas40 >= cas80) {
        cas90 = Math.round((cas40 - cas80) * 100) / 100;
    } else {
        cas95 = Math.round((cas80 - cas40) * 100) / 100;
    }
    setTxt('f07-cas-90', `$ ${fmtUI(cas90)}`);
    setTxt('f07-cas-95', `$ ${fmtUI(cas95)}`);

    // Retenciones soportadas (Casilla 100)
    const cas100 = getNum('f07-cas-100');
    const cas105 = Math.max(0, Math.round((cas90 - cas100) * 100) / 100);

    // Total General F-07 a Pagar (Impuesto Neto IVA Puro)
    const totalPagar = cas105;
    setTxt('f07-total-pagar', `$ ${fmtUI(totalPagar)}`);
};

window.calcF14Live = function () {
    const getNum = id => {
        const el = document.getElementById(id);
        return el ? (parseFloat(el.value) || 0) : 0;
    };
    const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.innerText = txt;
    };

    // Servicios Profesionales (Art. 156 CT - 10%)
    const baseProf = getNum('f14-base-profesionales');
    const retProf = Math.round((baseProf * 0.10) * 100) / 100;
    setTxt('f14-ret-profesionales', `$ ${fmtUI(retProf)}`);

    // Retención 1% IVA (Art. 162 CT)
    const baseIva1 = getNum('f14-base-iva1');
    const retIva1 = Math.round((baseIva1 * 0.01) * 100) / 100;
    setTxt('f14-ret-iva1', `$ ${fmtUI(retIva1)}`);

    const totalF14 = Math.round((retProf + retIva1) * 100) / 100;
    setTxt('f14-total-enterar', `$ ${fmtUI(totalF14)}`);
};

window.renderTributario = function (accounts) {
    let debitoTotal = 0;
    let creditoTotal = 0;
    let ventasTotales = 0;
    let comprasTotales = 0;

    const comprasRows = [];
    const ventasRows = [];

    // Inspeccionar el stack de partidas del Libro Diario
    const books = Array.from(document.querySelectorAll('#books-stack .glass-card'));
    books.forEach((b, idx) => {
        const pNum = idx + 1;
        const dateInput = b.querySelector('.doc-date');
        const fecha = dateInput ? (dateInput.value || '2026-09-01') : '2026-09-01';
        const glosa = b.querySelector('.glosa-input')?.value || `Partida N° ${pNum}`;

        let partidaTieneCredito = false;
        let partidaTieneDebito = false;
        let ivaCredVal = 0;
        let ivaDebVal = 0;
        let baseGravCompra = 0;
        let baseGravVenta = 0;

        b.querySelectorAll('.entries-container tr').forEach(tr => {
            const inps = tr.querySelectorAll('input');
            if (inps.length < 4) return;
            const cod = inps[0].value.trim();
            const nom = inps[1].value.trim().toUpperCase();
            const d = parseLocalFloat(inps[2].value);
            const h = parseLocalFloat(inps[3].value);

            // Detectar Crédito Fiscal (1108 o nombre con CRÉDITO FISCAL)
            if (cod.startsWith('1108') || nom.includes('CRÉDITO FISCAL') || nom.includes('CREDITO FISCAL')) {
                if (d > 0) {
                    partidaTieneCredito = true;
                    ivaCredVal += d;
                }
            }
            // Detectar Débito Fiscal (2107 o nombre con DÉBITO FISCAL)
            if (cod.startsWith('2107') || nom.includes('DÉBITO FISCAL') || nom.includes('DEBITO FISCAL')) {
                if (h > 0) {
                    partidaTieneDebito = true;
                    ivaDebVal += h;
                }
            }
            // Detectar base de compra (4101 Compras o 1105 Inventarios)
            if ((cod.startsWith('4101') || cod.startsWith('1105') || nom.includes('COMPRA') || nom.includes('MERCADER')) && d > 0) {
                baseGravCompra += d;
            }
            // Detectar base de venta (5101 Ventas)
            if ((cod.startsWith('5101') || nom.includes('VENTA')) && h > 0) {
                baseGravVenta += h;
            }
        });

        if (partidaTieneCredito && ivaCredVal > 0) {
            creditoTotal += ivaCredVal;
            const baseEst = baseGravCompra > 0 ? baseGravCompra : Math.round((ivaCredVal / 0.13) * 100) / 100;
            comprasTotales += baseEst;
            comprasRows.push({
                fecha,
                doc: `CCF-${String(100 + pNum).padStart(4, '0')}`,
                proveedor: glosa.includes('Prov') ? glosa : `Proveedor Local P-${pNum}`,
                nrc: `0614-${pNum}0198-1`,
                gravada: baseEst,
                iva: ivaCredVal,
                total: baseEst + ivaCredVal
            });
        }

        if (partidaTieneDebito && ivaDebVal > 0) {
            debitoTotal += ivaDebVal;
            const baseEst = baseGravVenta > 0 ? baseGravVenta : Math.round((ivaDebVal / 0.13) * 100) / 100;
            ventasTotales += baseEst;
            ventasRows.push({
                fecha,
                doc: `CCF-${String(500 + pNum).padStart(4, '0')}`,
                cliente: glosa.includes('Clie') ? glosa : `Cliente Contribuyente P-${pNum}`,
                nrc: `0614-${pNum}9921-2`,
                gravada: baseEst,
                iva: ivaDebVal,
                total: baseEst + ivaDebVal
            });
        }
    });

    // Si aún no hay partidas con IVA en el Diario, establecer base didáctica inicial
    if (debitoTotal === 0 && creditoTotal === 0) {
        ventasTotales = 10000.00;
        debitoTotal = 1300.00;
        comprasTotales = 6500.00;
        creditoTotal = 845.00;

        comprasRows.push({
            fecha: new Date().toISOString().split('T')[0],
            doc: 'CCF-0142',
            proveedor: 'Distribuidora Salvadoreña, S.A. de C.V.',
            nrc: '0614-230489-102-1',
            gravada: 6500.00,
            iva: 845.00,
            total: 7345.00
        });

        ventasRows.push({
            fecha: new Date().toISOString().split('T')[0],
            doc: 'CCF-0089',
            cliente: 'Comercial Cuscatlán, S.A. de C.V.',
            nrc: '0614-110294-101-5',
            gravada: 10000.00,
            iva: 1300.00,
            total: 11300.00
        });
    }

    // Actualizar datos reales de referencia
    window._tributarioRealData = {
        ventasGravadas: ventasTotales,
        debitoFiscal: debitoTotal,
        ventasConsumidorFinal: 0,
        debitoConsumidorFinal: 0,
        totalDebito: debitoTotal,
        comprasGravadas: comprasTotales,
        creditoFiscal: creditoTotal,
        importaciones: 0,
        creditoImportaciones: 0,
        remanenteAnterior: 0,
        totalCredito: creditoTotal,
        impuestoDeterminado: Math.max(0, debitoTotal - creditoTotal),
        remanenteSiguiente: Math.max(0, creditoTotal - debitoTotal),
        retenciones1: 0,
        ivaPagar: Math.max(0, debitoTotal - creditoTotal),
        ingresosMes: ventasTotales,
        pagoCuenta: Math.round((ventasTotales * 0.0175) * 100) / 100,
        totalPagarF07: Math.round((Math.max(0, debitoTotal - creditoTotal) + (ventasTotales * 0.0175)) * 100) / 100,
        honorariosBase: 1200.00,
        retencion10: 120.00,
        comprasIva1Base: 0,
        retencionIva1: 0,
        totalF14: 120.00
    };

    // Renderizar tablas de Libros de Compras y Ventas
    const cBody = document.getElementById('libro-compras-body');
    if (cBody) {
        if (comprasRows.length > 0) {
            cBody.innerHTML = comprasRows.map(r => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="py-2.5 px-3 text-slate-600 dark:text-slate-400">${escContab(r.fecha)}</td>
                    <td class="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">${escContab(r.doc)}</td>
                    <td class="py-2.5 px-3 text-slate-700 dark:text-slate-300">${escContab(r.proveedor)}</td>
                    <td class="py-2.5 px-3 text-slate-500">${escContab(r.nrc)}</td>
                    <td class="py-2.5 px-3 text-right font-bold">$ ${fmtUI(r.gravada)}</td>
                    <td class="py-2.5 px-3 text-right font-bold text-emerald-600">$ ${fmtUI(r.iva)}</td>
                    <td class="py-2.5 px-3 text-right font-black">$ ${fmtUI(r.total)}</td>
                </tr>
            `).join('');
            document.getElementById('libro-compras-tot-grav').innerText = `$ ${fmtUI(comprasTotales)}`;
            document.getElementById('libro-compras-tot-iva').innerText = `$ ${fmtUI(creditoTotal)}`;
            document.getElementById('libro-compras-tot-final').innerText = `$ ${fmtUI(comprasTotales + creditoTotal)}`;
        } else {
            cBody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-slate-400 italic">No hay partidas de compras registradas en el Libro Diario.</td></tr>`;
        }
    }

    const vBody = document.getElementById('libro-ventas-body');
    if (vBody) {
        if (ventasRows.length > 0) {
            vBody.innerHTML = ventasRows.map(r => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="py-2.5 px-3 text-slate-600 dark:text-slate-400">${escContab(r.fecha)}</td>
                    <td class="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">${escContab(r.doc)}</td>
                    <td class="py-2.5 px-3 text-slate-700 dark:text-slate-300">${escContab(r.cliente)}</td>
                    <td class="py-2.5 px-3 text-slate-500">${escContab(r.nrc)}</td>
                    <td class="py-2.5 px-3 text-right font-bold">$ ${fmtUI(r.gravada)}</td>
                    <td class="py-2.5 px-3 text-right font-bold text-indigo-600">$ ${fmtUI(r.iva)}</td>
                    <td class="py-2.5 px-3 text-right font-black">$ ${fmtUI(r.total)}</td>
                </tr>
            `).join('');
            document.getElementById('libro-ventas-tot-grav').innerText = `$ ${fmtUI(ventasTotales)}`;
            document.getElementById('libro-ventas-tot-iva').innerText = `$ ${fmtUI(debitoTotal)}`;
            document.getElementById('libro-ventas-tot-final').innerText = `$ ${fmtUI(ventasTotales + debitoTotal)}`;
        } else {
            vBody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-slate-400 italic">No hay partidas de ventas registradas en el Libro Diario.</td></tr>`;
        }
    }

    if (window._tributarioMode === 'asistido') {
        window.populateTributarioInputs(window._tributarioRealData);
        window.calcF07Live();
        window.calcF14Live();
    }
};

window.auditTributarioPractice = function () {
    const d = window._tributarioRealData;
    const cas10 = parseFloat(document.getElementById('f07-cas-10')?.value) || 0;
    const cas50 = parseFloat(document.getElementById('f07-cas-50')?.value) || 0;
    const cas110 = parseFloat(document.getElementById('f14-ingresos-mes')?.value || document.getElementById('f07-cas-110')?.value) || 0;

    let correctCount = 0;
    let totalChecks = 5;
    const errors = [];

    // 1. Verificación Débito Fiscal
    const calcDeb = Math.round(cas10 * 0.13 * 100) / 100;
    const expDeb = Math.round(d.ventasGravadas * 0.13 * 100) / 100;
    if (Math.abs(cas10 - d.ventasGravadas) < 1.00) {
        correctCount++;
    } else {
        errors.push(`Ventas Gravadas (Casilla 10): Declarado $ ${fmtUI(cas10)}, esperado $ ${fmtUI(d.ventasGravadas)} según registros del Libro Diario.`);
    }

    // 2. Verificación Crédito Fiscal
    if (Math.abs(cas50 - d.comprasGravadas) < 1.00) {
        correctCount++;
    } else {
        errors.push(`Compras Gravadas (Casilla 50): Declarado $ ${fmtUI(cas50)}, esperado $ ${fmtUI(d.comprasGravadas)} según Libro de Compras.`);
    }

    // 3. Verificación Liquidación IVA (Impuesto vs Remanente)
    const userImpuesto = Math.max(0, calcDeb - Math.round(cas50 * 0.13 * 100) / 100);
    const expImpuesto = d.impuestoDeterminado;
    if (Math.abs(userImpuesto - expImpuesto) < 0.50) {
        correctCount++;
    } else {
        errors.push(`Liquidación IVA: La diferencia entre Débito y Crédito Fiscal no coincide con el balance de las cuentas.`);
    }

    // 4. Verificación Pago a Cuenta 1.75% (F-14 / Art. 151 CT)
    if (Math.abs(cas110 - d.ingresosMes) < 1.00) {
        correctCount++;
    } else {
        errors.push(`Ingresos del Mes (F-14 Pago a Cuenta): Declarado $ ${fmtUI(cas110)}, base de pago a cuenta esperada $ ${fmtUI(d.ingresosMes)}.`);
    }

    // 5. Verificación de cálculo anticipo 1.75%
    const userPC = Math.round(cas110 * 0.0175 * 100) / 100;
    if (Math.abs(userPC - d.pagoCuenta) < 0.50) {
        correctCount++;
    } else {
        errors.push(`Anticipo de Pago a Cuenta (F-14): Error en la aplicación de la tasa del 1.75% sobre ingresos gravados.`);
    }

    // Determinar Nivel de Logro MINED (1 a 5)
    let nivel = 1;
    let titulo = "";
    let desc = "";
    let badgeClass = "";

    if (correctCount === 5) {
        nivel = 5;
        titulo = "Nivel 5: Excelente (Dominio Tributario Pleno)";
        desc = "Declaración F-07 y retenciones formalizadas con absoluta precisión conforme a la Ley de IVA y Código Tributario de El Salvador.";
        badgeClass = "bg-emerald-500 text-white";
    } else if (correctCount === 4) {
        nivel = 4;
        titulo = "Nivel 4: Muy Bueno (Competente con Mínimos Ajustes)";
        desc = "Comprensión sólida de las casillas del Formulario F-07. Se detectaron variaciones menores en redondeo o base imponible.";
        badgeClass = "bg-sky-500 text-white";
    } else if (correctCount === 3) {
        nivel = 3;
        titulo = "Nivel 3: Bueno (Aprobado Básico)";
        desc = "Cálculo de alícuota del 13% adecuado, pero requiere afinar la conciliación con el Libro Diario y el Pago a Cuenta Art. 151 CT.";
        badgeClass = "bg-amber-500 text-white";
    } else if (correctCount === 2) {
        nivel = 2;
        titulo = "Nivel 2: En Proceso (Requiere Refuerzo)";
        desc = "Discrepancias importantes entre las bases de compras/ventas y los impuestos determinados a pagar.";
        badgeClass = "bg-orange-500 text-white";
    } else {
        nivel = 1;
        titulo = "Nivel 1: Inicial (No Alcanzado)";
        desc = "Formulario F-07 incompleto o con errores conceptuales en la liquidación de IVA y retenciones.";
        badgeClass = "bg-rose-500 text-white";
    }

    const panel = document.getElementById('panel-audit-tributario');
    if (panel) {
        panel.classList.remove('hidden');
        panel.className = "mb-6 p-6 rounded-3xl border transition-all duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-xl";
        panel.innerHTML = `
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                <div class="flex items-center gap-3">
                    <span class="px-3.5 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider ${badgeClass}">
                        ${titulo}
                    </span>
                    <span class="text-xs font-bold text-slate-500 tabular-nums">Puntaje: ${correctCount} / ${totalChecks}</span>
                </div>
                <button type="button" onclick="this.closest('#panel-audit-tributario').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 text-sm">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="text-xs text-slate-700 dark:text-slate-300 font-medium mb-4">${desc}</p>
            ${errors.length > 0 ? `
                <div class="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                    <h5 class="text-xs font-black uppercase text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                        <i class="fas fa-exclamation-triangle"></i> Observaciones de Auditoría Fiscal:
                    </h5>
                    <ul class="text-xs text-rose-800 dark:text-rose-300 space-y-1.5 list-disc list-inside">
                        ${errors.map(e => `<li>${e}</li>`).join('')}
                    </ul>
                </div>
            ` : `
                <div class="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                    <i class="fas fa-check-circle text-base"></i> Declaración lista para presentación formal ante la DGII sin contingencias ni multas.
                </div>
            `}
        `;
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.insertLiquidacionIvaPartida = function () {
    const d = window._tributarioRealData;
    if (d.debitoFiscal <= 0 && d.creditoFiscal <= 0) {
        alert("No hay saldos de IVA Débito o Crédito Fiscal para liquidar en el periodo.");
        return;
    }

    if (typeof window.createNewBook === 'function') window.createNewBook();
    const bookId = typeof selectedSheetId !== 'undefined' ? selectedSheetId : window.selectedSheetId;
    if (!bookId) return;
    const sheetEl = document.getElementById(bookId);
    if (!sheetEl) return;

    const titleEl = sheetEl.querySelector('.sheet-title');
    if (titleEl) titleEl.innerText = "Liquidación Mensual de IVA";

    const descEl = sheetEl.querySelector('.sheet-desc');
    if (descEl) descEl.innerText = "Cierre de Cuentas Fiscales • Art. 65 Ley de IVA";

    const glosaInp = sheetEl.querySelector('.glosa-input');
    if (glosaInp) {
        glosaInp.value = "V/ Liquidación mensual de cuentas de IVA Débito y Crédito Fiscal según Art. 65 Ley de IVA. Determinación de impuesto a pagar o remanente.";
    }

    const entries = sheetEl.querySelector('.entries-container');
    if (entries) entries.innerHTML = '';

    // 1) Cargar IVA Débito Fiscal para saldar cuenta 2107
    const r1 = window.addRow(bookId, false);
    if (r1) {
        const inps = r1.querySelectorAll('input');
        inps[0].value = "2107";
        inps[1].value = "IVA Débito Fiscal (Liquidación Mensual)";
        inps[2].value = d.debitoFiscal.toFixed(2);
        inps[3].value = "";
    }

    // 2) Abonar IVA Crédito Fiscal para saldar cuenta 1108
    const r2 = window.addRow(bookId, false);
    if (r2) {
        const inps = r2.querySelectorAll('input');
        inps[0].value = "1108";
        inps[1].value = "IVA Crédito Fiscal (Liquidación Mensual)";
        inps[2].value = "";
        inps[3].value = d.creditoFiscal.toFixed(2);
    }

    // 3) Diferencia: IVA por Pagar (Pasivo) o Remanente (Activo)
    const diff = Math.round((d.debitoFiscal - d.creditoFiscal) * 100) / 100;
    if (diff > 0.005) {
        const r3 = window.addRow(bookId, false);
        if (r3) {
            const inps = r3.querySelectorAll('input');
            inps[0].value = "210703";
            inps[1].value = "IVA por Pagar (Dirección General de Impuestos Internos)";
            inps[2].value = "";
            inps[3].value = diff.toFixed(2);
        }
    } else if (diff < -0.005) {
        const r3 = window.addRow(bookId, false);
        if (r3) {
            const inps = r3.querySelectorAll('input');
            inps[0].value = "110802";
            inps[1].value = "Remanente de Crédito Fiscal (Traslado Próximo Periodo)";
            inps[2].value = Math.abs(diff).toFixed(2);
            inps[3].value = "";
        }
    }

    window.calc(bookId);
    window.saveHistory();
    window.switchTab('diario');

    const toast = document.getElementById('sync-toast');
    if (toast) {
        toast.querySelector('h4').innerText = "Liquidación de IVA Generada";
        toast.querySelector('p').innerText = "Partida registrada en el Libro Diario";
        toast.classList.remove('translate-y-32', 'opacity-0');
        setTimeout(() => toast.classList.add('translate-y-32', 'opacity-0'), 3500);
    }
};

// =========================================================================
// CONTABILIDAD DE COSTOS INDUSTRIALES (BTVAC 2.4)
// MPD + MOD + CIF, Hoja de Órdenes de Trabajo y Partidas Fabriles
// =========================================================================

window._costosMode = 'practica';
window._costosRealData = {
    iiMp: 0,
    comprasMp: 0,
    ifMp: 0,
    mpdUtilizada: 0,
    salariosMod: 0,
    cargasMod: 0,
    totalMod: 0,
    cifMat: 0,
    cifMoi: 0,
    cifEnergia: 0,
    cifDeprec: 0,
    totalCif: 0,
    costoIncurrido: 0,
    iiPp: 0,
    ifPp: 0,
    costoTerminados: 0,
    iiPt: 0,
    ifPt: 0,
    costoVendido: 0
};

window.setCostosMode = function (mode) {
    window._costosMode = mode;
    const btnAsistido = document.getElementById('btn-costos-mode-asistido');
    const btnPractica = document.getElementById('btn-costos-mode-practica');
    const panelAudit = document.getElementById('panel-audit-costos');
    if (panelAudit) panelAudit.classList.add('hidden');

    if (mode === 'asistido') {
        if (btnAsistido) {
            btnAsistido.className = "px-4 py-2 rounded-xl transition-all duration-200 bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm flex items-center gap-2";
        }
        if (btnPractica) {
            btnPractica.className = "px-4 py-2 rounded-xl transition-all duration-200 text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-2";
        }
        window.populateCostosInputs(window._costosRealData);
        window.calcCostosLive();
    } else {
        if (btnPractica) {
            btnPractica.className = "px-4 py-2 rounded-xl transition-all duration-200 bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm flex items-center gap-2";
        }
        if (btnAsistido) {
            btnAsistido.className = "px-4 py-2 rounded-xl transition-all duration-200 text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-2";
        }
        const ids = ['costos-ii-mp', 'costos-compras-mp', 'costos-if-mp', 'costos-salarios-mod', 'costos-cargas-mod', 'costos-cif-mat', 'costos-cif-moi', 'costos-cif-energia', 'costos-cif-deprec', 'costos-ii-pp', 'costos-if-pp', 'costos-ii-pt', 'costos-if-pt'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        window.calcCostosLive();
    }
};

window.switchCostosSubTab = function (subTabId) {
    const tabs = ['edo', 'orden'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-costos-${t}`);
        const view = document.getElementById(`subview-costos-${t}`);
        if (btn) {
            if (t === subTabId) {
                btn.className = "px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800";
            } else {
                btn.className = "px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 border border-transparent";
            }
        }
        if (view) {
            if (t === subTabId) {
                view.classList.remove('hidden');
            } else {
                view.classList.add('hidden');
            }
        }
    });
};

window.populateCostosInputs = function (data) {
    const setVal = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = (v > 0) ? Number(v).toFixed(2) : '';
    };
    setVal('costos-ii-mp', data.iiMp);
    setVal('costos-compras-mp', data.comprasMp);
    setVal('costos-if-mp', data.ifMp);
    setVal('costos-salarios-mod', data.salariosMod);
    setVal('costos-cargas-mod', data.cargasMod);
    setVal('costos-cif-mat', data.cifMat);
    setVal('costos-cif-moi', data.cifMoi);
    setVal('costos-cif-energia', data.cifEnergia);
    setVal('costos-cif-deprec', data.cifDeprec);
    setVal('costos-ii-pp', data.iiPp);
    setVal('costos-if-pp', data.ifPp);
    setVal('costos-ii-pt', data.iiPt);
    setVal('costos-if-pt', data.ifPt);
};

window.calcCostosLive = function () {
    const getNum = id => {
        const el = document.getElementById(id);
        return el ? (parseFloat(el.value) || 0) : 0;
    };
    const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.innerText = txt;
    };

    // 1. MPD
    const iiMp = getNum('costos-ii-mp');
    const compMp = getNum('costos-compras-mp');
    const ifMp = getNum('costos-if-mp');
    const totMpd = Math.max(0, Math.round((iiMp + compMp - ifMp) * 100) / 100);
    setTxt('costos-tot-mpd', `$ ${fmtUI(totMpd)}`);

    // 2. MOD
    const salMod = getNum('costos-salarios-mod');
    const carMod = getNum('costos-cargas-mod');
    const totMod = Math.round((salMod + carMod) * 100) / 100;
    setTxt('costos-tot-mod', `$ ${fmtUI(totMod)}`);

    // 3. CIF
    const cifMat = getNum('costos-cif-mat');
    const cifMoi = getNum('costos-cif-moi');
    const cifEne = getNum('costos-cif-energia');
    const cifDep = getNum('costos-cif-deprec');
    const totCif = Math.round((cifMat + cifMoi + cifEne + cifDep) * 100) / 100;
    setTxt('costos-tot-cif', `$ ${fmtUI(totCif)}`);

    // Costo de Producción del Periodo
    const costoIncurrido = Math.round((totMpd + totMod + totCif) * 100) / 100;

    // 4. Proceso
    const iiPp = getNum('costos-ii-pp');
    const ifPp = getNum('costos-if-pp');
    const totTerminados = Math.max(0, Math.round((costoIncurrido + iiPp - ifPp) * 100) / 100);
    setTxt('costos-tot-terminados', `$ ${fmtUI(totTerminados)}`);

    // 5. Terminados
    const iiPt = getNum('costos-ii-pt');
    const ifPt = getNum('costos-if-pt');
    const disponibles = Math.round((totTerminados + iiPt) * 100) / 100;
    setTxt('costos-tot-disponibles', `$ ${fmtUI(disponibles)}`);

    const totVendido = Math.max(0, Math.round((disponibles - ifPt) * 100) / 100);
    setTxt('costos-tot-vendido', `$ ${fmtUI(totVendido)}`);
};

window.addOpMpdRow = function () {
    const container = document.getElementById('op-mpd-rows');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'flex gap-2 items-center';
    div.innerHTML = `
        <input type="text" placeholder="Req. N° / Material" class="w-2/3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs op-mpd-desc">
        <input type="number" step="0.01" placeholder="$ 0.00" oninput="window.calcOpCostLive()" class="w-1/3 text-right bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs tabular-nums font-bold op-mpd-val">
    `;
    container.appendChild(div);
};

window.addOpModRow = function () {
    const container = document.getElementById('op-mod-rows');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'flex gap-2 items-center';
    div.innerHTML = `
        <input type="text" placeholder="Operario / Tarea" class="w-2/3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs op-mod-desc">
        <input type="number" step="0.01" placeholder="$ 0.00" oninput="window.calcOpCostLive()" class="w-1/3 text-right bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs tabular-nums font-bold op-mod-val">
    `;
    container.appendChild(div);
};

window.calcOpCostLive = function () {
    let totMpd = 0;
    document.querySelectorAll('.op-mpd-val').forEach(inp => totMpd += (parseFloat(inp.value) || 0));
    totMpd = Math.round(totMpd * 100) / 100;
    const elMpd = document.getElementById('op-tot-mpd');
    if (elMpd) elMpd.innerText = `$ ${fmtUI(totMpd)}`;

    let totMod = 0;
    document.querySelectorAll('.op-mod-val').forEach(inp => totMod += (parseFloat(inp.value) || 0));
    totMod = Math.round(totMod * 100) / 100;
    const elMod = document.getElementById('op-tot-mod');
    if (elMod) elMod.innerText = `$ ${fmtUI(totMod)}`;

    const elCifBase = document.getElementById('op-cif-base');
    if (elCifBase) elCifBase.innerText = `$ ${fmtUI(totMod)}`;

    const tasaInp = document.getElementById('op-tasa-cif');
    const tasa = tasaInp ? (parseFloat(tasaInp.value) || 50) : 50;
    const elFactor = document.getElementById('op-cif-factor');
    if (elFactor) elFactor.innerText = `${tasa}%`;

    const totCif = Math.round((totMod * (tasa / 100)) * 100) / 100;
    const elCif = document.getElementById('op-tot-cif');
    if (elCif) elCif.innerText = `$ ${fmtUI(totCif)}`;

    const costoTotal = Math.round((totMpd + totMod + totCif) * 100) / 100;
    const elTotal = document.getElementById('op-costo-total');
    if (elTotal) elTotal.innerText = `$ ${fmtUI(costoTotal)}`;

    const unidInp = document.getElementById('op-unidades');
    const unid = unidInp ? (parseFloat(unidInp.value) || 1) : 1;
    const costoUnit = unid > 0 ? Math.round((costoTotal / unid) * 100) / 100 : 0;
    const elUnit = document.getElementById('op-costo-unitario');
    if (elUnit) elUnit.innerText = `$ ${fmtUI(costoUnit)} / ud`;
};

window.renderCostos = function (accounts) {
    const projName = document.getElementById('current-project-name')?.innerText || 'EMPRESA INDUSTRIAL DE EL SALVADOR';
    const empEl = document.getElementById('costos-empresa-nombre');
    if (empEl) empEl.innerText = projName.toUpperCase();

    if (window._costosMode === 'asistido') {
        window.populateCostosInputs(window._costosRealData);
        window.calcCostosLive();
        window.calcOpCostLive();
    }
};

window.auditCostosPractice = function () {
    const d = window._costosRealData;
    const getNum = id => parseFloat(document.getElementById(id)?.value) || 0;

    const iiMp = getNum('costos-ii-mp');
    const compMp = getNum('costos-compras-mp');
    const ifMp = getNum('costos-if-mp');
    const salMod = getNum('costos-salarios-mod');
    const cifMat = getNum('costos-cif-mat');

    let correctCount = 0;
    const totalChecks = 4;
    const errors = [];

    // 1. Verificación Materia Prima Directa
    const userMpd = Math.max(0, iiMp + compMp - ifMp);
    if (Math.abs(userMpd - d.mpdUtilizada) < 1.00) {
        correctCount++;
    } else {
        errors.push(`Materia Prima Directa: El cálculo de MP utilizada ($ ${fmtUI(userMpd)}) difiere del valor esperado ($ ${fmtUI(d.mpdUtilizada)}).`);
    }

    // 2. Verificación Mano de Obra Directa
    if (Math.abs(salMod - d.salariosMod) < 1.00) {
        correctCount++;
    } else {
        errors.push(`Mano de Obra Directa: Discrepancia en salarios directos fabriles ($ ${fmtUI(salMod)} vs $ ${fmtUI(d.salariosMod)}).`);
    }

    // 3. Verificación Costos Indirectos de Fabricación
    if (Math.abs(cifMat - d.cifMat) < 1.00) {
        correctCount++;
    } else {
        errors.push(`Costos Indirectos de Fabricación (CIF): Revisa los materiales e insumos indirectos aplicados.`);
    }

    // 4. Verificación de Hoja de Costos por Órdenes
    const opTotalTxt = document.getElementById('op-costo-total')?.innerText.replace('$', '').trim() || '0';
    const opTotal = parseLocalFloat(opTotalTxt);
    if (opTotal > 0) {
        correctCount++;
    } else {
        errors.push(`Hoja OP-101: Debe completarse la acumulación de MPD, MOD y CIF de la orden de producción.`);
    }

    let nivel = 1;
    let titulo = "";
    let desc = "";
    let badgeClass = "";

    if (correctCount === 4) {
        nivel = 5;
        titulo = "Nivel 5: Excelente (Dominio en Costos Industriales)";
        desc = "Acumulación impecable de MPD, MOD y CIF. Determinación exacta del Costo de Producción y Costo Unitario de Orden.";
        badgeClass = "bg-emerald-500 text-white";
    } else if (correctCount === 3) {
        nivel = 4;
        titulo = "Nivel 4: Muy Bueno (Competente)";
        desc = "Buen dominio de la estructura fabril con leves desajustes en prorrateos indirectos.";
        badgeClass = "bg-sky-500 text-white";
    } else if (correctCount === 2) {
        nivel = 3;
        titulo = "Nivel 3: Bueno (Aprobado Básico)";
        desc = "Identifica los tres elementos del costo, pero requiere afinar la hoja de órdenes de trabajo.";
        badgeClass = "bg-amber-500 text-white";
    } else {
        nivel = 1;
        titulo = "Nivel 1: Inicial (Requiere Refuerzo)";
        desc = "Estructura de costos incompleta o fórmulas fabriles desarticuladas.";
        badgeClass = "bg-rose-500 text-white";
    }

    const panel = document.getElementById('panel-audit-costos');
    if (panel) {
        panel.classList.remove('hidden');
        panel.className = "mb-6 p-6 rounded-3xl border transition-all duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-xl";
        panel.innerHTML = `
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                <div class="flex items-center gap-3">
                    <span class="px-3.5 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider ${badgeClass}">
                        ${titulo}
                    </span>
                    <span class="text-xs font-bold text-slate-500 tabular-nums">Puntaje: ${correctCount} / ${totalChecks}</span>
                </div>
                <button type="button" onclick="this.closest('#panel-audit-costos').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 text-sm">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="text-xs text-slate-700 dark:text-slate-300 font-medium mb-4">${desc}</p>
            ${errors.length > 0 ? `
                <div class="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                    <h5 class="text-xs font-black uppercase text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                        <i class="fas fa-exclamation-triangle"></i> Observaciones de Costos Fabriles:
                    </h5>
                    <ul class="text-xs text-amber-800 dark:text-amber-300 space-y-1.5 list-disc list-inside">
                        ${errors.map(e => `<li>${e}</li>`).join('')}
                    </ul>
                </div>
            ` : `
                <div class="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                    <i class="fas fa-check-circle text-base"></i> Costo de fabricación y liquidación de órdenes perfectamente cuadradas.
                </div>
            `}
        `;
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.insertCostosPartidaIntoDiario = function () {
    const d = window._costosRealData;
    if (typeof window.createNewBook === 'function') window.createNewBook();
    const bookId = typeof selectedSheetId !== 'undefined' ? selectedSheetId : window.selectedSheetId;
    if (!bookId) return;
    const sheetEl = document.getElementById(bookId);
    if (!sheetEl) return;

    const titleEl = sheetEl.querySelector('.sheet-title');
    if (titleEl) titleEl.innerText = "Cierre de Costos de Producción Fabril";

    const descEl = sheetEl.querySelector('.sheet-desc');
    if (descEl) descEl.innerText = "Transferencia MPD + MOD + CIF a Productos Terminados";

    const glosaInp = sheetEl.querySelector('.glosa-input');
    if (glosaInp) {
        glosaInp.value = "V/ Liquidación y cierre de costos fabriles del periodo. Traslado de producción terminada a bodega y costo de lo vendido.";
    }

    const entries = sheetEl.querySelector('.entries-container');
    if (entries) entries.innerHTML = '';

    // Cargar Inventario de Productos Terminados
    const r1 = window.addRow(bookId, false);
    if (r1) {
        const inps = r1.querySelectorAll('input');
        inps[0].value = "110502";
        inps[1].value = "Inventario de Productos Terminados (Almacén Central)";
        inps[2].value = d.costoTerminados.toFixed(2);
        inps[3].value = "";
    }

    // Abonar elementos del costo
    const r2 = window.addRow(bookId, false);
    if (r2) {
        const inps = r2.querySelectorAll('input');
        inps[0].value = "110501";
        inps[1].value = "Inventario de Materia Prima (Consumo Fabril)";
        inps[2].value = "";
        inps[3].value = d.mpdUtilizada.toFixed(2);
    }

    const r3 = window.addRow(bookId, false);
    if (r3) {
        const inps = r3.querySelectorAll('input');
        inps[0].value = "410201";
        inps[1].value = "Mano de Obra Directa Aplicada";
        inps[2].value = "";
        inps[3].value = d.totalMod.toFixed(2);
    }

    const r4 = window.addRow(bookId, false);
    if (r4) {
        const inps = r4.querySelectorAll('input');
        inps[0].value = "410202";
        inps[1].value = "Costos Indirectos de Fabricación (CIF Aplicados)";
        inps[2].value = "";
        inps[3].value = (d.costoTerminados - d.mpdUtilizada - d.totalMod).toFixed(2);
    }

    window.calc(bookId);
    window.saveHistory();
    window.switchTab('diario');

    const toast = document.getElementById('sync-toast');
    if (toast) {
        toast.querySelector('h4').innerText = "Partida Fabril Generada";
        toast.querySelector('p').innerText = "Costos trasladados al Libro Diario";
        toast.classList.remove('translate-y-32', 'opacity-0');
        setTimeout(() => toast.classList.add('translate-y-32', 'opacity-0'), 3500);
    }
};
