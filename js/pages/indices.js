document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inyectar UI compartida (Header)
    try {
        if (typeof injectSharedUI === 'function') {
            injectSharedUI('shared-header');
        }
    } catch (e) { console.warn('Error inyectando UI:', e); }

    // 2. Extraer parámetros de URL
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('pid');
    
    // Convertir a números y asegurar que no sean NaN
    const act = Math.max(0, parseFloat(params.get('act')) || 0);
    let pat = parseFloat(params.get('pat')) || 0;
    const uti = parseFloat(params.get('uti')) || 0;
    const pas = Math.max(0, parseFloat(params.get('pas')) || 0);
    const ing = Math.max(0, parseFloat(params.get('ing')) || 0);

    // Ajuste contable de emergencia si el patrimonio no viene explícito
    if (pat === 0 && act > 0 && pas > 0) {
        pat = act - pas;
    }
    
    // Asegurar que pat no sea negativo para el cálculo de ROE (aunque contablemente sea posible)
    const patCalc = pat === 0 ? 0 : pat;

    // 4. Calcular ROA, ROE, ROI
    const roa = act > 0 ? (uti / act) * 100 : 0;
    const roe = patCalc !== 0 ? (uti / patCalc) * 100 : 0;
    
    // ROI: Inversión = Activo total (según guion educativo)
    const roi = act > 0 ? ((ing - act) / act) * 100 : 0;

    // 5. Renderizar UI con seguridad
    const safeFmt = (val) => {
        try {
            return typeof window.fmt === 'function' ? window.fmt(val) : val.toFixed(2);
        } catch (e) { return val.toFixed(2); }
    };

    // Función auxiliar para pintar valores con colores
    const updateIndicator = (id, value, threshold) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerText = value.toFixed(2) + '%';
        
        // Colores según rendimiento
        if (value > threshold) {
            el.className = el.className.replace(/text-(sky|rose|amber)-600/g, 'text-emerald-500');
            el.style.textShadow = '0 0 20px rgba(16,185,129,0.3)';
        } else if (value < 0) {
            el.className = el.className.replace(/text-(sky|emerald|amber)-600/g, 'text-rose-500');
            el.style.textShadow = '0 0 20px rgba(244,63,94,0.3)';
        } else if (value < threshold) {
            el.className = el.className.replace(/text-(sky|emerald|rose)-600/g, 'text-amber-500');
            el.style.textShadow = '0 0 20px rgba(245,158,11,0.3)';
        }
    };

    // Aplicar actualizaciones
    updateIndicator('val-roa', roa, 5);
    updateIndicator('val-roe', roe, 10); // Meta ROE suele ser mayor al ROA
    updateIndicator('val-roi', roi, 0);

    // Actualizar etiquetas de soporte
    const setLabel = (id, prefix, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = prefix + safeFmt(val);
    };

    setLabel('roa-uti', '$', uti);
    setLabel('roa-act', '$', act);
    setLabel('roe-uti', '$', uti);
    setLabel('roe-pat', '$', pat);
    setLabel('roi-ing', '$', ing);
    setLabel('roi-inv', '$', act);

    // Descripciones dinámicas
    if (document.getElementById('roa-desc')) document.getElementById('roa-desc').innerText = "Eficiencia del uso de activos (" + roa.toFixed(1) + "%)";
    if (document.getElementById('roe-desc')) document.getElementById('roe-desc').innerText = "Rendimiento del capital propio (" + roe.toFixed(1) + "%)";
    if (document.getElementById('roi-desc')) document.getElementById('roi-desc').innerText = roi > 0 ? "Retorno de inversión positivo" : "Retorno de inversión negativo";

    // 6. Generar Diagnóstico Cualitativo
    try {
        renderDiagnostico(roa, roe, roi, act, pat, uti, pas);
    } catch (e) {
        console.error('Error en diagnóstico:', e);
    }

    // 7. Cargar el Título del Proyecto (Prioridad URL -> Local -> DB)
    const pname = params.get('pname');
    if (pname && pname !== 'undefined' && pname !== 'null') {
        const decodedName = decodeURIComponent(pname);
        document.getElementById('current-project-name').innerText = decodedName;
        document.title = `Rentabilidad - ${decodedName}`;
    } else {
        cargarTituloProyecto(pid);
    }
});

async function cargarTituloProyecto(pid) {
    try {
        const allProjsStr = localStorage.getItem('educonta_projects_v38');
        const searchId = pid || localStorage.getItem('educonta_last_project_id');
        let foundProj = null;

        if (allProjsStr) {
            const allProjs = JSON.parse(allProjsStr);
            foundProj = allProjs.find(p => p.id == searchId);
        }

        if (foundProj) {
            const projName = foundProj.name || foundProj.nombre || 'Proyecto sin nombre';
            document.getElementById('current-project-name').innerText = projName;
            document.title = `Rentabilidad - ${projName}`;
        } else if (searchId && searchId !== 'null') {
            const { data } = await supabaseClient.from('proyectos').select('nombre').eq('id', searchId).single();
            if (data) {
                document.getElementById('current-project-name').innerText = data.nombre;
                document.title = `Rentabilidad - ${data.nombre}`;
            } else {
                document.getElementById('current-project-name').innerText = "Análisis Financiero";
            }
        } else {
            document.getElementById('current-project-name').innerText = "Análisis Financiero";
        }
    } catch (e) {
        console.warn('No se pudo cargar el nombre del proyecto', e);
        document.getElementById('current-project-name').innerText = "Análisis Financiero";
    }
}

function renderDiagnostico(roa, roe, roi, act, pat, uti, pas) {
    const container = document.getElementById('diagnostico-container');
    if (!container) return; // Si no existe, no chocar la página

    let html = '';

    // Evaluación ROA
    let roaStatus = '';
    let roaColor = '';
    let roaIcon = '';
    let roaNote = '';
    
    if (roa > 5) {
        roaStatus = 'Viable / Elegible para crédito';
        roaNote = 'La administración está utilizando eficazmente sus bienes para generar riqueza.';
        roaColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
        roaIcon = 'fa-check-circle text-emerald-500';
    } else if (roa > 0 && roa <= 5) {
        roaStatus = 'Ineficiencia en el uso de activos';
        roaNote = 'La rentabilidad es positiva pero baja (<5%). Posible exceso de maquinaria o efectivo ocioso.';
        roaColor = 'text-amber-600 bg-amber-50 border-amber-100';
        roaIcon = 'fa-exclamation-triangle text-amber-500';
    } else if (roa == 0 && uti == 0 && act == 0) {
        roaStatus = 'Datos Incompletos';
        roaNote = 'Por favor ingresa transacciones en el Libro Diario para obtener un diagnóstico.';
        roaColor = 'text-slate-600 bg-slate-50 border-slate-100';
        roaIcon = 'fa-info-circle text-slate-500';
    } else {
        roaStatus = 'Alerta de Destrucción de Valor';
        roaNote = 'Ineficiencia severa. El ROA es negativo, los activos están generando pérdidas.';
        roaColor = 'text-rose-600 bg-rose-50 border-rose-100';
        roaIcon = 'fa-times-circle text-rose-500';
    }

    // Agregar bloque básico ROA
    html += `<div class="flex gap-4 p-4 rounded-2xl ${roaColor} border mb-4">
        <i class="fas ${roaIcon} text-xl mt-0.5"></i>
        <div>
            <h4 class="font-bold text-sm">${roaStatus}</h4>
            <p class="text-xs mt-1 opacity-80">${roaNote} (ROA: ${roa.toFixed(2)}%).</p>
        </div>
    </div>`;

    // Evaluación ROE vs ROA (Efecto de Apalancamiento)
    if (roe > roa && roa > 0) {
        let apaColor = 'text-indigo-600 bg-indigo-50 border border-indigo-100';
        let apaIcon = 'fa-chart-line text-indigo-500';
        html += `<div class="flex gap-4 p-4 rounded-2xl ${apaColor} mb-4">
            <i class="fas ${apaIcon} text-xl mt-0.5"></i>
            <div>
                <h4 class="font-bold text-sm">Apalancamiento Positivo</h4>
                <p class="text-xs mt-1 opacity-80">El financiamiento externo está impulsando la rentabilidad de los socios (ROE > ROA).</p>
            </div>
        </div>`;
    }

    // Evaluación Patrimonio vs Pasivo
    if (pat > 0 && pat > pas) {
        html += `<div class="flex gap-4 p-4 rounded-2xl text-emerald-600 bg-emerald-50 border border-emerald-100">
            <i class="fas fa-shield-alt text-emerald-500 text-xl mt-0.5"></i>
            <div>
                <h4 class="font-bold text-sm">Empresa sólida financieramente</h4>
                <p class="text-xs mt-1 opacity-80">El capital propio (${typeof fmtUI==='function'?fmtUI(pat):pat.toFixed(2)}) supera a las obligaciones de terceros (${typeof fmtUI==='function'?fmtUI(pas):pas.toFixed(2)}).</p>
            </div>
        </div>`;
    } else if (pas > pat) {
        html += `<div class="flex gap-4 p-4 rounded-2xl text-rose-600 bg-rose-50 border border-rose-100">
            <i class="fas fa-exclamation-triangle text-rose-500 text-xl mt-0.5"></i>
            <div>
                <h4 class="font-bold text-sm">Riesgo Financiero</h4>
                <p class="text-xs mt-1 opacity-80">Las obligaciones de la empresa superan el capital propio aportado. Alto nivel de endeudamiento.</p>
            </div>
        </div>`;
    }

    container.innerHTML = html;
}

window.goToEditor = function() {
    window.location.href = 'editor.html';
};

window.printIndices = function() {
    window.print();
};
