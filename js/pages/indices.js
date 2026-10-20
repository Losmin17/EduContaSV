/* ── GLOBALS ── */
const charts = {};
let chartTypes = { liquidez:'bar', deuda:'bar', rentabil:'bar', efic:'bar' };

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', async () => {
    try { if (typeof injectSharedUI==='function') injectSharedUI('shared-header'); } catch(e){}

    const p = new URLSearchParams(window.location.search);
    const pid = p.get('pid');
    const g = (k,d=0) => Math.max(d, parseFloat(p.get(k))||d);

    const act=g('act'), pas=g('pas'), ing=g('ing');
    const acor=g('acor'), pcor=g('pcor'), inv=g('inv'), cxc=g('cxc'), cvta=g('cvta');
    let pat=parseFloat(p.get('pat'))||0;
    const uti=parseFloat(p.get('uti'))||0;
    if(!pat && act>0 && pas>0) pat=act-pas;

    const sd = (n,d) => d!==0 ? n/d : null;
    const I = {
        razon:  sd(acor,pcor),
        acida:  sd(acor-inv,pcor),
        nEnd:   sd(pas,act),
        dCap:   sd(pas,pat),
        margen: ing>0 ? (uti/ing)*100 : null,
        roa:    act>0 ? (uti/act)*100  : null,
        roe:    pat!==0 ? (uti/pat)*100 : null,
        roi:    act>0 ? ((ing-act)/act)*100 : null,
        rotInv: sd(cvta,inv),
        rotCxc: sd(ing,cxc)
    };

    window._FI = { I, act, pas, pat, uti, ing, acor, pcor, inv, cxc, cvta };

    buildTabs();
    renderAll(I, act, pas, pat, uti, ing);
    renderNotifs(I);
    renderDiag(I, act, pas, pat, uti, ing);
    buildCharts();

    const pname = p.get('pname');
    if(pname && pname!=='undefined') {
        const d=decodeURIComponent(pname);
        document.getElementById('current-project-name').innerText=d;
        document.title=`Análisis - ${d}`;
    } else { loadTitle(pid); }
});

/* ── TABS ── */
function buildTabs() {
    const all = document.querySelectorAll('.tab-btn, .sidebar-tab-btn');
    all.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
    switchTab('general');
}

function switchTab(tab) {
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.tab-btn, .sidebar-tab-btn').forEach(b=>{
        b.classList.remove('active','active-tab');
    });
    const panel = document.getElementById('panel-'+tab);
    if(panel) panel.classList.add('active');
    document.querySelectorAll(`[data-tab="${tab}"]`).forEach(b=>{
        b.classList.add('active'); b.classList.add('active-tab');
    });
    if(tab!=='general' && tab!=='diagnostico') setTimeout(()=>drawChart(tab),80);
}

/* ── FORMAT ── */
const f2 = (v,s='%') => v===null ? '—' : v.toFixed(2)+s;
const bloomOf = (v, thresholds) => {
    if(v===null) return 'text-slate-300';
    for(const [t,cls] of thresholds) if(typeof t==='function' ? t(v) : v>t) return cls;
    return thresholds[thresholds.length-1][1];
};

/* ── MINI CARD ── */
function miniCard(cfg) {
    return `<div class="mini-card">
      <div class="mini-glow" style="background:${cfg.glow}"></div>
      <div class="mini-icon" style="background:${cfg.ibg};color:${cfg.ic}"><i class="fas ${cfg.icon}"></i></div>
      <div class="mini-label">${cfg.label}</div>
      <div class="mini-value ${cfg.bloom}" id="${cfg.id}">${cfg.val}</div>
      <div class="mini-formula">${cfg.formula}</div>
      <div class="mini-hint">${cfg.hint||''}</div>
    </div>`;
}

/* ── BIG CARD ── */
function bigCard(cfg) {
    return `<div class="big-card">
      <div class="big-glow" style="background:${cfg.glow}"></div>
      <div class="big-icon" style="background:${cfg.ibg};color:${cfg.ic}"><i class="fas ${cfg.icon}"></i></div>
      <div class="big-title">${cfg.label}</div>
      <div class="big-value ${cfg.bloom}">${cfg.val}</div>
      <div class="big-desc">${cfg.desc}</div>
      <div style="background:rgba(248,250,252,.9);border:1px solid rgba(226,232,240,.8);border-radius:12px;padding:8px 12px;margin-bottom:12px;font-family:'Plus Jakarta Sans',sans-serif;font-variant-numeric:tabular-nums;font-size:10px;color:#475569;line-height:1.6">
        <span style="color:#94a3b8;font-weight:600;letter-spacing:.05em">FÓRMULA</span><br>
        <span style="color:${cfg.ic};font-weight:700">${cfg.bigFormula||cfg.formula}</span>
      </div>
      <div class="big-footer">
        <span>${cfg.f1l}<br><span style="color:${cfg.ic};font-weight:800">${cfg.f1v}</span></span>
        <span style="text-align:right">${cfg.f2l}<br><span class="text-slate-700 font-bold">${cfg.f2v}</span></span>
      </div>
    </div>`;
}

/* ── RENDER ALL ── */
function renderAll(I, act, pas, pat, uti, ing) {
    const fmt$ = v => v===0?'$0.00':'$'+v.toFixed(2);
    const razon=I.razon, acida=I.acida, nEnd=I.nEnd, dCap=I.dCap;
    const margen=I.margen, roa=I.roa, roe=I.roe, roi=I.roi;
    const rotInv=I.rotInv, rotCxc=I.rotCxc;

    /* ── LIQUIDEZ ── */
    const liqDefs = [
        { label:'Razón Corriente', id:'val-razon', val:f2(razon,'x'), formula:'AC / PC', glow:'#0ea5e9', ibg:'#e0f2fe', ic:'#0ea5e9', icon:'fa-balance-scale',
          bigFormula:'Razón Corriente = Activo Corriente / Pasivo Corriente',
          bloom: razon===null?'text-slate-300':razon>1?'bloom-green':'bloom-rose',
          hint: razon===null?'Sin datos':razon>1.5?'Excelente cobertura':razon>1?'Cubre obligaciones':'Riesgo de liquidez',
          f1l:'Act. Corriente', f1v:fmt$(window._FI.acor), f2l:'Pas. Corriente', f2v:fmt$(window._FI.pcor) },
        { label:'Prueba Ácida', id:'val-acida', val:f2(acida,'x'), formula:'(AC-Inv) / PC', glow:'#06b6d4', ibg:'#cffafe', ic:'#0891b2', icon:'fa-flask',
          bigFormula:'Prueba Ácida = (Activo Corriente − Inventarios) / Pasivo Corriente',
          bloom: acida===null?'text-slate-300':acida>=1?'bloom-green':'bloom-amber',
          hint: acida===null?'Sin datos':acida>=1?'Liquidez inmediata OK':'Depende del inventario',
          f1l:'AC - Inventario', f1v:fmt$(window._FI.acor-window._FI.inv), f2l:'Pas. Corriente', f2v:fmt$(window._FI.pcor) }
    ];

    /* ── ENDEUDAMIENTO ── */
    const nePct = nEnd!==null ? nEnd*100 : null;
    const deudaDefs = [
        { label:'Nivel de Endeudamiento', id:'val-nend', val:f2(nePct,'%'), formula:'Pasivo Total / Activo Total', glow:'#f59e0b', ibg:'#fef3c7', ic:'#d97706', icon:'fa-percentage',
          bigFormula:'Nivel Endeud. = Pasivo Total / Activo Total × 100',
          bloom: nEnd===null?'text-slate-300':nEnd>0.6?'bloom-rose':nEnd>0.5?'bloom-amber':'bloom-green',
          hint: nEnd===null?'Sin datos':nEnd>0.6?'Endeudamiento crítico':nEnd>0.5?'Moderado':'Estructura sana',
          f1l:'Pasivo Total', f1v:fmt$(pas), f2l:'Activo Total', f2v:fmt$(act) },
        { label:'Deuda / Capital', id:'val-dcap', val:f2(dCap,'x'), formula:'Pasivo Total / Patrimonio', glow:'#f97316', ibg:'#ffedd5', ic:'#ea580c', icon:'fa-coins',
          bigFormula:'Deuda/Capital = Pasivo Total / Patrimonio Neto',
          bloom: dCap===null?'text-slate-300':dCap>2?'bloom-rose':dCap>1?'bloom-amber':'bloom-green',
          hint: dCap===null?'Sin datos':dCap>2?'Apalancamiento alto':dCap>1?'Más deuda que capital':'Capital predominante',
          f1l:'Pasivo Total', f1v:fmt$(pas), f2l:'Patrimonio', f2v:fmt$(pat) }
    ];

    /* ── RENTABILIDAD ── */
    const rentDefs = [
        { label:'Margen Neto', id:'val-margen', val:f2(margen,'%'), formula:'UN / Ventas × 100', glow:'#8b5cf6', ibg:'#ede9fe', ic:'#7c3aed', icon:'fa-tag',
          bigFormula:'Margen Neto = (Utilidad Neta / Ventas Totales) × 100',
          bloom: margen===null?'text-slate-300':margen>10?'bloom-green':margen>0?'bloom-amber':'bloom-rose',
          hint: margen===null?'Sin datos':margen>10?'Margen sólido':margen>0?'Margen ajustado':'Con pérdida',
          f1l:'Utilidad Neta', f1v:fmt$(uti), f2l:'Ventas', f2v:fmt$(ing) },
        { label:'ROA', id:'val-roa', val:f2(roa,'%'), formula:'UN / Activo Total × 100', glow:'#0ea5e9', ibg:'#e0f2fe', ic:'#0284c7', icon:'fa-chart-line',
          bigFormula:'ROA = (Utilidad Neta / Activo Total) × 100',
          bloom: roa===null?'text-slate-300':roa>5?'bloom-green':roa>0?'bloom-amber':'bloom-rose',
          hint: roa===null?'Sin datos':roa>5?'Activos rentables':roa>0?'Baja eficiencia':'Destruyendo valor',
          f1l:'Utilidad', f1v:fmt$(uti), f2l:'Activos', f2v:fmt$(act) },
        { label:'ROE', id:'val-roe', val:f2(roe,'%'), formula:'UN / Patrimonio × 100', glow:'#6366f1', ibg:'#e0e7ff', ic:'#4f46e5', icon:'fa-user-tie',
          bigFormula:'ROE = (Utilidad Neta / Patrimonio Neto) × 100',
          bloom: roe===null?'text-slate-300':roe>10?'bloom-green':roe>0?'bloom-amber':'bloom-rose',
          hint: roe===null?'Sin datos':roe>10?'Excelente rendimiento':roe>0?'Rentable':'Sin retorno',
          f1l:'Utilidad', f1v:fmt$(uti), f2l:'Patrimonio', f2v:fmt$(pat) },
        { label:'ROI', id:'val-roi', val:f2(roi,'%'), formula:'(Ingresos-AT) / AT × 100', glow:'#a855f7', ibg:'#f3e8ff', ic:'#9333ea', icon:'fa-rocket',
          bigFormula:'ROI = (Ingresos Totales − Activo Total) / Activo Total × 100',
          bloom: roi===null?'text-slate-300':roi>0?'bloom-green':'bloom-rose',
          hint: roi===null?'Sin datos':roi>0?'Inversión recuperable':'Retorno negativo',
          f1l:'Ingresos', f1v:fmt$(ing), f2l:'Inversión (AT)', f2v:fmt$(act) }
    ];

    /* ── EFICIENCIA ── */
    const eficDefs = [
        { label:'Rotación de Inventarios', id:'val-rotinv', val:f2(rotInv,'x'), formula:'Costo Ventas / Inventario', glow:'#10b981', ibg:'#d1fae5', ic:'#059669', icon:'fa-boxes',
          bigFormula:'Rot. Inventarios = Costo de Ventas / Inventario Promedio',
          bloom: rotInv===null?'text-slate-300':rotInv>6?'bloom-green':rotInv>2?'bloom-amber':'bloom-rose',
          hint: rotInv===null?'Sin datos':rotInv>6?'Alta rotación':rotInv>2?'Rotación media':'Inventario lento',
          f1l:'Costo Ventas', f1v:fmt$(window._FI.cvta), f2l:'Inventario', f2v:fmt$(window._FI.inv) },
        { label:'Rotación de Cartera', id:'val-rotcxc', val:f2(rotCxc,'x'), formula:'Ventas / CxCobrar', glow:'#14b8a6', ibg:'#ccfbf1', ic:'#0d9488', icon:'fa-file-invoice-dollar',
          bigFormula:'Rot. Cartera = Ventas Totales / Cuentas por Cobrar',
          bloom: rotCxc===null?'text-slate-300':rotCxc>6?'bloom-green':rotCxc>2?'bloom-amber':'bloom-rose',
          hint: rotCxc===null?'Sin datos':rotCxc>6?'Cobro eficiente':rotCxc>2?'Cobro moderado':'Cartera lenta',
          f1l:'Ventas', f1v:fmt$(ing), f2l:'CxCobrar', f2v:fmt$(window._FI.cxc) }
    ];

    /* ── GENERAL TAB (mini cards) ── */
    document.getElementById('gen-liquidez').innerHTML = liqDefs.map(miniCard).join('');
    document.getElementById('gen-deuda').innerHTML    = deudaDefs.map(miniCard).join('');
    document.getElementById('gen-rent').innerHTML     = rentDefs.map(miniCard).join('');
    document.getElementById('gen-efic').innerHTML     = eficDefs.map(miniCard).join('');

    /* ── INDIVIDUAL TABS (big cards) ── */
    document.getElementById('big-liquidez').innerHTML = liqDefs.map(bigCard).join('');
    document.getElementById('big-deuda').innerHTML    = deudaDefs.map(bigCard).join('');
    // Rentabilidad: 3 + 1 layout
    document.getElementById('big-rentabil').innerHTML  = rentDefs.map(bigCard).join('');
    document.getElementById('big-rentabil2').innerHTML = '';
    document.getElementById('big-efic').innerHTML      = eficDefs.map(bigCard).join('');
}

/* ── NOTIFICACIONES ── */
function renderNotifs(I) {
    const area = document.getElementById('notif-area');
    if(!area) return;
    const items = [];
    if(I.razon!==null && I.razon<1) items.push({c:'bg-rose-50 border border-rose-200 text-rose-700',i:'fa-exclamation-triangle text-rose-500',m:'<strong>Alerta de liquidez:</strong> Razón corriente menor a 1. No se cubren pasivos de corto plazo.'});
    if(I.nEnd!==null && I.nEnd>0.5) items.push({c:'bg-amber-50 border border-amber-200 text-amber-700',i:'fa-link text-amber-500',m:'<strong>Endeudamiento elevado:</strong> Más del 50% de activos financiados por terceros.'});
    if(I.roe!==null && I.roa!==null && I.roe>I.roa && I.roa>0) items.push({c:'bg-indigo-50 border border-indigo-200 text-indigo-700',i:'fa-chart-line text-indigo-500',m:`<strong>Apalancamiento positivo:</strong> ROE (${I.roe.toFixed(2)}%) &gt; ROA (${I.roa.toFixed(2)}%). El financiamiento externo potencia el retorno a socios.`});
    if(I.roa!==null && I.roa>5) items.push({c:'bg-emerald-50 border border-emerald-200 text-emerald-700',i:'fa-check-circle text-emerald-500',m:`<strong>ROA sobresaliente:</strong> Retorno sobre activos del ${I.roa.toFixed(2)}%, señal de gestión eficiente.`});
    area.innerHTML = items.map(n=>`<div class="notif-banner ${n.c}"><i class="fas ${n.i}"></i><span>${n.m}</span></div>`).join('');
}

/* ── DIAGNÓSTICO ── */
function renderDiag(I, act, pas, pat, uti, ing) {
    const c = document.getElementById('diagnostico-container');
    if(!c) return;
    if(!act && !pas && !uti) { c.innerHTML='<div class="text-slate-400 italic text-xs">Sin datos registrados en el proyecto.</div>'; return; }
    const diags = [];
    const add = (color,icon,title,note) => diags.push({color,icon,title,note});

    if(I.razon!==null){ const ok=I.razon>=1; add(ok?'bg-emerald-50 border-emerald-100 text-emerald-700':'bg-rose-50 border-rose-100 text-rose-700', ok?'fa-check-circle text-emerald-500':'fa-times-circle text-rose-500', ok?'Liquidez Aceptable':'Riesgo de Liquidez', `Razón corriente de ${I.razon.toFixed(2)}x. ${ok?'La empresa puede cubrir deudas a corto plazo.':'Los activos corrientes NO cubren los pasivos corrientes.'}`); }
    if(I.acida!==null){ const ok=I.acida>=1; add(ok?'bg-emerald-50 border-emerald-100 text-emerald-700':'bg-amber-50 border-amber-100 text-amber-700', ok?'fa-check-circle text-emerald-500':'fa-exclamation-triangle text-amber-500', ok?'Prueba Ácida Positiva':'Dependencia del Inventario', `Prueba ácida de ${I.acida.toFixed(2)}x. ${ok?'Sin inventario, se cubren obligaciones.':'Sin vender inventario, hay dificultades de pago.'}`); }
    if(I.nEnd!==null){ const pct=(I.nEnd*100).toFixed(1); const a=I.nEnd>0.6,w=I.nEnd>0.5&&!a; add(a?'bg-rose-50 border-rose-100 text-rose-700':w?'bg-amber-50 border-amber-100 text-amber-700':'bg-emerald-50 border-emerald-100 text-emerald-700', a?'fa-times-circle text-rose-500':w?'fa-exclamation-triangle text-amber-500':'fa-shield-alt text-emerald-500', a?'Endeudamiento Crítico':w?'Endeudamiento Moderado':'Estructura Financiera Sana', `El ${pct}% de los activos son financiados por deuda de terceros.`); }
    if(I.dCap!==null){ const ok=I.dCap<=1; add(ok?'bg-emerald-50 border-emerald-100 text-emerald-700':'bg-amber-50 border-amber-100 text-amber-700', ok?'fa-shield-alt text-emerald-500':'fa-exclamation-triangle text-amber-500', ok?'Capital Predominante':'Deuda sobre Capital', `Por cada $1 de capital propio, se tienen $${I.dCap.toFixed(2)} de deuda.`); }
    if(I.roa!==null){ const ok=I.roa>5; add(ok?'bg-emerald-50 border-emerald-100 text-emerald-700':I.roa>0?'bg-amber-50 border-amber-100 text-amber-700':'bg-rose-50 border-rose-100 text-rose-700', ok?'fa-check-circle text-emerald-500':I.roa>0?'fa-exclamation-triangle text-amber-500':'fa-times-circle text-rose-500', ok?'ROA Eficiente':I.roa>0?'Activos Poco Rentables':'ROA Negativo — Alerta', `ROA de ${I.roa.toFixed(2)}%. ${ok?'Rendimiento superior al 5%.':I.roa>0?'Baja productividad (<5%).':'Los activos generan pérdidas.'}`); }
    if(I.roe!==null && I.roa!==null && I.roe>I.roa && I.roa>0) add('bg-indigo-50 border-indigo-100 text-indigo-700','fa-chart-line text-indigo-500','Apalancamiento Positivo Confirmado',`ROE (${I.roe.toFixed(2)}%) > ROA (${I.roa.toFixed(2)}%). El financiamiento externo amplifica el retorno de los socios.`);
    if(I.margen!==null){ const ok=I.margen>10; add(ok?'bg-emerald-50 border-emerald-100 text-emerald-700':I.margen>0?'bg-amber-50 border-amber-100 text-amber-700':'bg-rose-50 border-rose-100 text-rose-700', ok?'fa-check-circle text-emerald-500':I.margen>0?'fa-exclamation-triangle text-amber-500':'fa-times-circle text-rose-500', `Margen Neto: ${I.margen.toFixed(1)}%`, ok?'Por cada $100 de ventas, se retienen más de $10 de ganancia neta.':I.margen>0?'Margen positivo pero ajustado. Analiza estructura de costos.':'Las ventas no generan ganancia neta. Revisar costos urgente.'); }
    if(I.rotInv!==null){ const ok=I.rotInv>4; add(ok?'bg-emerald-50 border-emerald-100 text-emerald-700':'bg-amber-50 border-amber-100 text-amber-700', ok?'fa-check-circle text-emerald-500':'fa-exclamation-triangle text-amber-500', `Rotación de Inventarios: ${I.rotInv.toFixed(2)}x`, ok?'El inventario se renueva frecuentemente.':'Inventario con baja rotación. Posible exceso de mercancía.'); }
    if(I.rotCxc!==null){ const ok=I.rotCxc>4; add(ok?'bg-emerald-50 border-emerald-100 text-emerald-700':'bg-amber-50 border-amber-100 text-amber-700', ok?'fa-check-circle text-emerald-500':'fa-exclamation-triangle text-amber-500', `Rotación de Cartera: ${I.rotCxc.toFixed(2)}x`, ok?'Las cuentas por cobrar se recuperan rápidamente.':'Cartera con cobro lento. Revisar política crediticia.'); }

    c.innerHTML = diags.map(d=>`<div class="diag-item ${d.color} border"><i class="fas ${d.icon} text-xl mt-0.5 shrink-0"></i><div><h4 class="font-bold text-sm">${d.title}</h4><p class="text-xs mt-1 opacity-80">${d.note}</p></div></div>`).join('');
}

/* ── CHARTS ── */
const CHART_DATA = {
    liquidez: { labels:['Razón Corriente','Prueba Ácida'], key:['razon','acida'], ref:1, colors:['#0ea5e9','#06b6d4'] },
    deuda:    { labels:['Nivel Endeud. (%)','Deuda/Capital'], key:['nEndPct','dCap'], ref:null, colors:['#f59e0b','#f97316'] },
    rentabil: { labels:['Margen Neto %','ROA %','ROE %','ROI %'], key:['margen','roa','roe','roi'], ref:0, colors:['#8b5cf6','#0ea5e9','#6366f1','#a855f7'] },
    efic:     { labels:['Rot. Inventarios','Rot. Cartera'], key:['rotInv','rotCxc'], ref:null, colors:['#10b981','#14b8a6'] }
};

function buildCharts() { /* charts built on demand */ }

function drawChart(section) {
    const fi = window._FI.I;
    const def = CHART_DATA[section];
    if(!def) return;
    const vals = def.key.map(k => k==='nEndPct' ? (fi.nEnd!==null?fi.nEnd*100:0) : (fi[k]||0));
    const type = chartTypes[section]||'bar';
    const canvasId = 'chart-'+section;
    const canvas = document.getElementById(canvasId);
    if(!canvas) return;
    if(charts[section]) { charts[section].destroy(); delete charts[section]; }

    const cfg = type==='pie' ? {
        type:'pie',
        data:{ labels:def.labels, datasets:[{ data:vals.map(Math.abs), backgroundColor:def.colors, borderWidth:2, borderColor:'#fff' }] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{font:{family:'Plus Jakarta Sans',size:11},padding:16} } } }
    } : {
        type:'bar',
        data:{ labels:def.labels, datasets:[{
            label:'Valor', data:vals,
            backgroundColor: def.colors.map(c=>c+'55'),
            borderColor: def.colors, borderWidth:2, borderRadius:10, borderSkipped:false
        }] },
        options:{
            responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label: ctx=>' '+ctx.parsed.y.toFixed(2)+(section==='efic'?'x':'%') } } },
            scales:{
                x:{ grid:{display:false}, ticks:{font:{family:'Plus Jakarta Sans',size:10},color:'#64748b'} },
                y:{ grid:{color:'rgba(0,0,0,.04)'}, ticks:{font:{family:'Plus Jakarta Sans',size:10},color:'#64748b'},
                    ...(def.ref!==null ? { annotations:{} } : {})
                }
            }
        }
    };
    charts[section] = new Chart(canvas, cfg);
}

window.setChart = function(section, type, btn) {
    chartTypes[section] = type;
    btn.closest('.chart-toggle').querySelectorAll('.chart-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    drawChart(section);
};

/* ── TITLE LOADER ── */
async function loadTitle(pid) {
    try {
        const id = pid || localStorage.getItem('educonta_last_project_id');
        let name = 'Análisis Financiero';
        const raw = localStorage.getItem('educonta_projects_libros');
        if(raw){ const f=(JSON.parse(raw)||[]).find(p=>p.id==id); if(f) name=f.name||f.nombre||name; }
        if(name==='Análisis Financiero' && id) {
            const {data} = await supabaseClient.from('proyectos').select('nombre').eq('id',id).single();
            if(data) name=data.nombre;
        }
        document.getElementById('current-project-name').innerText=name;
        document.title=`Análisis - ${name}`;
    } catch(e){ document.getElementById('current-project-name').innerText='Análisis Financiero'; }
}

window.goToEditor  = () => { 
    const id = localStorage.getItem('educonta_last_project_id');
    const raw = localStorage.getItem('educonta_projects_libros');
    let pType = 'libros';
    if(raw && id){ 
        const f = (JSON.parse(raw)||[]).find(p => p.id == id); 
        if (f) pType = f.type || 'libros'; 
    }
    
    if (pType === 'kardex') {
        window.location.href = 'editor-kardex.html';
    } else if (pType === 'planillas') {
        window.location.href = 'editor-planillas.html';
    } else {
        window.location.href = 'editor-libros.html';
    }
};
window.printIndices = () => { window.print(); };
