window.CATALOGO_MAESTRO = [];

window.loadCatalogoMaestro = async function() {
    // 1. CARGA INSTANTÁNEA DESDE CACHÉ
    const cachedCatalogo = localStorage.getItem('educonta_catalogo_maestro_v4');
    if (cachedCatalogo) {
        try {
            window.CATALOGO_MAESTRO = JSON.parse(cachedCatalogo);
            // console.log("🚀 Catálogo cargado instantáneamente desde caché local.");
            
            // Iniciamos sincronización en segundo plano sin bloquear el retorno
            syncCatalogoMaestroInBackground();
            return true; 
        } catch (e) {
            console.error("Error al parsear caché del catálogo:", e);
        }
    }

    // 2. CARGA INICIAL (Si no hay caché, forzamos descarga)
    return await syncCatalogoMaestroInBackground(true);
}

// Función auxiliar para sincronización sin bloqueo
async function syncCatalogoMaestroInBackground(isInitial = false) {
    if (!navigator.onLine) return;
    
    try {
        let todosLosDatos = [];
        let limite = 1000;
        let inicio = 0;
        let hayMasDatos = true;

        console.log(isInitial ? "📥 Iniciando descarga inicial del catálogo..." : "🔄 Sincronizando catálogo en segundo plano...");

        while (hayMasDatos) {
            const { data, error } = await supabaseClient
                .from('catalogo_maestro')
                .select('id, name, rubro, Sector')
                .order('id', { ascending: true })
                .range(inicio, inicio + limite - 1);

            if (error) throw error;

            if (data && data.length > 0) {
                todosLosDatos = todosLosDatos.concat(data);
                inicio += limite;
                if (data.length < limite) hayMasDatos = false;
            } else {
                hayMasDatos = false;
            }
        }

        if (todosLosDatos.length > 0) {
            window.CATALOGO_MAESTRO = todosLosDatos.map(row => ({
                id: String(row.id || ''),
                name: String(row.name || ''),
                cat: String(row.Sector || ''),
                sector: String(row.Sector || ''),
                rubro: String(row.rubro || '-')
            }));
            localStorage.setItem('educonta_catalogo_maestro_v4', JSON.stringify(window.CATALOGO_MAESTRO));
            console.log("✅ Catálogo sincronizado y guardado en caché.");
            if (typeof window.filterCatalog === 'function') {
                window.filterCatalog();
            }
        }
        return true;
    } catch (err) {
        console.error("Error en la sincronización del catálogo:", err);
        return false;
    }
}

window.clasificarCuenta = function(a) {
            const c = a.id ? String(a.id).trim() : String(a.codigo || '').trim();
            const cat = String(a.cat || 'COM').trim().toUpperCase();
            const rubroLabel = (a.rubro || '').trim();
            const nombreLower = String(a.nombre || a.name || '').toLowerCase();
            const rubroLower = rubroLabel.toLowerCase();

            let tipo = 'Otros'; // Activo, Pasivo, Patrimonio, Resultado
            let sub = ''; // Ingreso, Costo, Gasto, OtrosIngresos, OtrosGastos
            let clase = 'Mixto'; // Corriente, No Corriente
            let rubroId = '';
            let rubroNombre = 'Otros';

            // 1. DETERMINAR TIPO (Basado en Rubro de DB o Prefijo)
            if (rubroLabel.includes('Activo') || c.startsWith('1')) tipo = 'Activo';
            else if (rubroLabel.includes('Pasivo') || c.startsWith('2')) tipo = 'Pasivo';
            else if (rubroLabel.includes('Patrimonio') || c.startsWith('3')) tipo = 'Patrimonio';
            else if (rubroLabel.includes('Ingreso') || rubroLabel.includes('Gasto') || rubroLabel.includes('Costo') ||
                c.startsWith('4') || c.startsWith('5') || c.startsWith('6') || c.startsWith('7') || c.startsWith('8')) {
                tipo = 'Resultado';
            }

            // 1.1 DETERMINAR SUB-CLASIFICACIÓN DE RESULTADOS (Estado de Resultados El Salvador)
            if (tipo === 'Resultado') {
                if (c.startsWith('51') || rubroLower.includes('ingreso de operación') || rubroLower.includes('ingresos de operación')) {
                    sub = 'Ingreso';
                } else if (c.startsWith('41')) {
                    if (nombreLower.includes('venta') || nombreLower.includes('ingreso') || (rubroLower.includes('ingreso') && !nombreLower.includes('compra') && !nombreLower.includes('costo'))) {
                        sub = 'Ingreso';
                    } else {
                        sub = 'Costo';
                    }
                } else if (c.startsWith('42') || c.startsWith('43')) {
                    sub = 'Gasto';
                } else if (rubroLower.includes('costo') || nombreLower.includes('costo de venta') || nombreLower.includes('compra')) {
                    sub = 'Costo';
                } else if (rubroLower.includes('gasto de operación') || rubroLower.includes('gastos de operación') || nombreLower.includes('gasto de venta') || nombreLower.includes('gasto de administración') || nombreLower.includes('gastos de venta') || nombreLower.includes('gastos de administración')) {
                    sub = 'Gasto';
                } else if (rubroLower.includes('otros ingresos') || c.startsWith('52') || c.startsWith('71')) {
                    sub = 'OtrosIngresos';
                } else if (rubroLower.includes('otros gastos') || c.startsWith('44') || c.startsWith('61')) {
                    sub = 'OtrosGastos';
                } else if (rubroLower.includes('ingreso') || nombreLower.includes('venta') || nombreLower.includes('ingreso')) {
                    sub = 'Ingreso';
                } else if (rubroLower.includes('gasto') || nombreLower.includes('gasto')) {
                    sub = 'Gasto';
                } else {
                    sub = (Number(a.saldoAcreedor) > Number(a.saldoDeudor)) ? 'OtrosIngresos' : 'OtrosGastos';
                }
            }

            // 2. DETERMINAR CLASE (Corriente vs No Corriente) - Basado en NIC 1 / SSF
            if (tipo === 'Activo') {
                if (cat === 'SSF') {
                    // SSF: 11 Intermediación (C), 12 Otros (C), 13 Fijo (NC)
                    if (c.startsWith('11') || c.startsWith('12')) clase = 'Corriente';
                    else if (c.startsWith('13')) clase = 'No Corriente';
                    else clase = 'Corriente';
                } else if (cat === 'GUB') {
                    if (c.startsWith('21')) clase = 'Corriente';
                    else clase = 'No Corriente';
                } else { // Comercial (NIC) / AGR
                    // 11 Corriente, 12 No Corriente
                    if (c.startsWith('11')) clase = 'Corriente';
                    else if (c.startsWith('12')) clase = 'No Corriente';
                    else clase = 'Corriente';
                }
            } else if (tipo === 'Pasivo') {
                if (cat === 'SSF') {
                    // SSF: 21 (C), 22/23 (Mixto/NC), 24 (NC)
                    if (c.startsWith('21')) clase = 'Corriente';
                    else clase = 'No Corriente';
                } else {
                    // 21 Corriente, 22 No Corriente
                    if (c.startsWith('21')) clase = 'Corriente';
                    else if (c.startsWith('22')) clase = 'No Corriente';
                    else clase = 'Corriente';
                }
            }

            // 3. DETERMINAR RUBRO DE AGRUPACIÓN (Jerarquía)
            // Tomamos los primeros 4 dígitos para identificar el Rubro Normativo (Cuentas de Mayor)
            // Si el código es más corto, tomamos lo que haya.
            if (c.length >= 4) {
                rubroId = c.substring(0, 4);
            } else {
                rubroId = c;
            }

            rubroNombre = obtenerNombreRubro(rubroId, cat, tipo);

            return { tipo, sub, cat, clase, rubroId, rubroNombre };
        }

window.obtenerNombreRubro = function(id, cat, tipo = 'Activo') {
            const catNorm = String(cat || 'COM').trim().toUpperCase();
            const project = typeof window.proyecto_actual !== 'undefined' ? window.proyecto_actual : null;
            const catalogo = project?.catalogo || 'MAESTRO';

            // Caso especial: Sobregiros Bancarios (Activo con saldo acreedor movido a Pasivo)
            if (tipo === 'Pasivo' && id.startsWith('11')) {
                return 'Sobregiros Bancarios';
            }

            // Reglas de Nomenclatura por Catálogo Específico
            if (catNorm === 'SSF') {
                if (catalogo === 'BANCOS') {
                    if (id === '1101') return 'Disponibilidades';
                    if (id === '1102') return 'Inversiones Financieras';
                    if (id === '1103') return 'Cartera de Préstamos (Neta)';
                    if (id === '2101') return 'Obligaciones con el Público';
                } else if (catalogo === 'SEGUROS') {
                    if (id === '1101') return 'Inversiones y Disponibilidades';
                    if (id === '2101') return 'Obligaciones Contractuales';
                }
            } else if (catNorm === 'AGR') {
                if (catalogo === 'NIC41') {
                    if (id === '1103') return 'Activos Biológicos Corrientes';
                    if (id === '1201') return 'Activos Biológicos Productores';
                }
            } else if (catNorm === 'GUB') {
                if (id === '1101') return 'Fondo General / Tesorería';
                if (id === '2101') return 'Deuda Flotante';
            }

            const match = CATALOGO_MAESTRO.find(x => x.id === id && String(x.cat || '').trim().toUpperCase() === catNorm);
            if (match) return match.name;

            // Fallbacks comunes si no está en el catálogo (Nomenclatura Estándar El Salvador)
            const fallbacks = {
                '11': 'Activos Corrientes',
                '1101': 'Efectivo y Equivalentes',
                '1103': 'Inventarios',
                '12': 'Activos No Corrientes',
                '1201': 'Propiedad, Planta y Equipo',
                '21': 'Pasivos Corrientes',
                '2101': 'Cuentas por Pagar',
                '22': 'Pasivos No Corrientes',
                '31': 'Capital y Reservas',
                '41': 'Costos de Ventas y Operación',
                '42': 'Gastos de Operación',
                '51': 'Ingresos de Operación'
            };
            return fallbacks[id] || `Grupo ${id}`;
        }

window.getClaseNombre = function(clase, tipo) {
            if (tipo === 'Activo') return clase === 'Corriente' ? 'Activo Corriente' : 'Activo No Corriente';
            if (tipo === 'Pasivo') return clase === 'Corriente' ? 'Pasivo Corriente' : 'Pasivo No Corriente';
            return tipo;
        }

// Mapeo universal de bóvedas de almacenamiento local por tipo de proyecto / documento
window.getVaultStorageKey = function(type) {
    const map = {
        'libros': 'educonta_projects_libros',
        'kardex': 'educonta_projects_kardex',
        'planillas': 'educonta_projects_planillas',
        'tributario': 'educonta_projects_tributario',
        'costos': 'educonta_projects_costos',
        'caja': 'educonta_projects_caja',
        'finanzas': 'educonta_projects_finanzas',
        'textos': 'educonta_projects_textos',
        'calculo': 'educonta_projects_calculo',
        'hojas': 'educonta_projects_calculo',
        'lienzos': 'educonta_projects_lienzos',
        'diagramas': 'educonta_projects_diagramas'
    };
    return map[type] || 'educonta_projects_libros';
};

window.syncCurrentProjectWithSupabase = async function(projectObj, userId, skipRender = false) {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
    if (!projectObj || !projectObj.id) {
        console.warn("syncCurrentProjectWithSupabase: Objeto de proyecto no válido o sin ID.");
        return;
    }

    try {
        // Resolver userId si no fue provisto
        if (!userId) {
            const { data: sessionData } = await supabaseClient.auth.getSession().catch(() => ({ data: { session: null } }));
            if (sessionData && sessionData.session && sessionData.session.user) {
                userId = sessionData.session.user.id;
            } else {
                console.warn("syncCurrentProjectWithSupabase: No hay sesión de usuario activa para sincronizar.");
                return;
            }
        }

        // 1. INYECCIÓN DE IDENTIDAD Y MARCAS DE TIEMPO
        projectObj.updatedAt = projectObj.updatedAt || new Date().toISOString();
        if (!projectObj.owner_id) {
            projectObj.owner_id = userId;
        }

        const { data: authData } = await supabaseClient.auth.getUser().catch(() => ({ data: { user: null } }));
        if (authData && authData.user) {
            if (!projectObj.owner_email) projectObj.owner_email = authData.user.email;
            if (!projectObj.owner_name) {
                projectObj.owner_name = authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || '';
            }
        }

        // 2. AUTO-HEALING DE PERFIL: Asegurar que el usuario existe en la tabla de perfiles (public.profiles)
        // para evitar que falle la restricción de clave foránea (foreign key constraint)
        const { data: profileCheck, error: profileCheckError } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        if (!profileCheck && !profileCheckError) {
            const emailName = authData?.user?.email ? authData.user.email.split('@')[0] : 'Usuario';
            const fullName = authData?.user?.user_metadata?.full_name || authData?.user?.user_metadata?.name || emailName;
            
            const { error: profileInsertError } = await supabaseClient
                .from('profiles')
                .insert([{ 
                    id: userId, 
                    full_name: fullName,
                    updated_at: new Date()
                }]);
            
            if (profileInsertError) {
                console.warn("No se pudo auto-crear el perfil del usuario (posible restricción de RLS en tabla profiles):", profileInsertError);
            } else {
                console.log("Perfil de usuario auto-creado exitosamente para resolver clave foránea.");
            }
        }

        // Usamos 'proyectos_contables' para todos los modelos de proyectos y documentos
        const tableName = 'proyectos_contables';

        // Busca si ya existe un registro con este mismo ID de proyecto/documento
        const { data, error } = await supabaseClient
            .from(tableName)
            .select('id, user_id, data')
            .eq('data->>id', projectObj.id)
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            const existingRow = data[0];
            const sharedList = Array.isArray(existingRow.data?.shared_with) ? existingRow.data.shared_with : [];
            const isSharedCollaborator = sharedList.some(u => (typeof u === 'string' ? u === userId : (u?.uid === userId || u?.id === userId)));
            const isOwner = existingRow.user_id === userId || existingRow.data?.owner_id === userId;

            // Comprobar si el usuario actual posee rol de Administrador para evitar colisiones entre cuentas
            const currentUserEmail = (authData?.user?.email || '').toLowerCase().trim();
            const adminEmail = (window.ADMIN_EMAIL || 'lopezosmin2021@gmail.com').toLowerCase().trim();
            const isAdmin = (currentUserEmail && currentUserEmail === adminEmail) ||
                            (authData?.user?.app_metadata?.role === 'admin') ||
                            (typeof window.isUserAdmin === 'boolean' && window.isUserAdmin) ||
                            (typeof window.isAdminSession === 'function' && window.isAdminSession());

            if (!isOwner && !isSharedCollaborator && !isAdmin) {
                throw new Error("Acceso denegado: no tiene permisos para sobrescribir este proyecto.");
            }

            // Existe y está autorizado, hacer UPDATE en el registro exacto manteniendo estado activo
            const { error: updateError } = await supabaseClient
                .from(tableName)
                .update({ data: projectObj, estado: 'activo', updated_at: new Date() })
                .eq('id', existingRow.id);
            if (updateError) throw updateError;
        } else {
            // Nuevo, hacer INSERT (Supabase generará el UUID PK para la fila)
            const { error: insertError } = await supabaseClient
                .from(tableName)
                .insert([{ user_id: userId, data: projectObj, estado: 'activo' }]);
            if (insertError) throw insertError;
        }

        // Actualizar registro de IDs sincronizados
        if (typeof syncedProjectIds !== 'undefined') {
            syncedProjectIds.add(projectObj.id);
            localStorage.setItem('educonta_synced_ids', JSON.stringify(Array.from(syncedProjectIds)));
        } else {
            const syncedIds = new Set(JSON.parse(localStorage.getItem('educonta_synced_ids')) || []);
            syncedIds.add(projectObj.id);
            localStorage.setItem('educonta_synced_ids', JSON.stringify(Array.from(syncedIds)));
        }

        // Notificar globalmente a través de un CustomEvent desacoplado
        try {
            window.dispatchEvent(new CustomEvent('educonta:projectSynced', { 
                detail: { id: projectObj.id, type: projectObj.type } 
            }));
        } catch (_) {}

        // Refrescar UI si estamos en la vista de proyectos/documentos y no se omite
        if (!skipRender && typeof renderProjectGrid === 'function') {
            const pm = document.getElementById('master-screen');
            if (!pm || pm.classList.contains('hidden')) {
                renderProjectGrid();
            }
        }
    } catch (err) {
        console.error("Error en syncCurrentProjectWithSupabase:", err);
        
        // Si falló la sincronización, quitar de los IDs sincronizados para no mentir en los indicadores
        if (projectObj && projectObj.id) {
            if (typeof syncedProjectIds !== 'undefined') {
                syncedProjectIds.delete(projectObj.id);
                localStorage.setItem('educonta_synced_ids', JSON.stringify(Array.from(syncedProjectIds)));
            } else {
                const syncedIds = new Set(JSON.parse(localStorage.getItem('educonta_synced_ids')) || []);
                syncedIds.delete(projectObj.id);
                localStorage.setItem('educonta_synced_ids', JSON.stringify(Array.from(syncedIds)));
            }
        }

        // Mostrar error específico en el cloud indicator si existe
        const cloudIndicator = document.getElementById('cloud-indicator');
        if (cloudIndicator) {
            cloudIndicator.classList.remove('hidden');
            cloudIndicator.classList.add('flex');
            cloudIndicator.className = "flex items-center justify-center gap-1.5 w-full text-rose-600 font-black bg-rose-50 rounded-[36px] border border-rose-100 error";
            const span = cloudIndicator.querySelector('span');
            if (span) {
                span.textContent = "ERROR: " + (err.message || err.error_description || "Error de red/seguridad");
            } else {
                const safeErrMsg = (window.EduSec && typeof window.EduSec.escapeHtml === 'function')
                    ? window.EduSec.escapeHtml(err.message || "Error")
                    : String(err.message || "Error").replace(/[&<>"'`]/g, '');
                cloudIndicator.innerHTML = `<i class="fas fa-exclamation-triangle text-rose-500"></i> ERROR: ${safeErrMsg}`;
            }
        }
        throw err;
    }
};

// =========================================================================
// MOTOR DE CARGA Y CACHÉ OFFLINE-FIRST: TERRITORIO Y CATÁLOGO TRIBUTARIO
// =========================================================================

window.TERRITORIO_SV = [];
window.CATALOGO_FORMULARIOS_TRIBUTARIOS = [];

window.loadCatalogoTributario = async function(forceRefresh = false) {
    // Paso A: Carga instantánea desde localStorage
    const cachedTerritorio = localStorage.getItem('educonta_territorio_sv_v1');
    const cachedFormularios = localStorage.getItem('educonta_formularios_tributarios_v1');

    if (cachedTerritorio && cachedFormularios && !forceRefresh) {
        try {
            window.TERRITORIO_SV = JSON.parse(cachedTerritorio);
            window.CATALOGO_FORMULARIOS_TRIBUTARIOS = JSON.parse(cachedFormularios);

            // Sincronización en segundo plano sin bloquear el retorno
            syncCatalogoTributarioInBackground(false);
            return {
                territorio: window.TERRITORIO_SV,
                formularios: window.CATALOGO_FORMULARIOS_TRIBUTARIOS
            };
        } catch (e) {
            console.error("Error al parsear caché tributario:", e);
        }
    }

    // Paso B: Descarga desde Supabase (o si no hay caché / forceRefresh)
    await syncCatalogoTributarioInBackground(true);
    return {
        territorio: window.TERRITORIO_SV,
        formularios: window.CATALOGO_FORMULARIOS_TRIBUTARIOS
    };
};

async function syncCatalogoTributarioInBackground(isInitial = false) {
    if (!navigator.onLine || typeof supabaseClient === 'undefined' || !supabaseClient) {
        return false;
    }

    try {
        const [resTerritorio, resFormularios] = await Promise.all([
            supabaseClient
                .from('territorio_sv')
                .select('distrito_codigo, departamento_codigo, departamento_nombre, municipio_codigo, municipio_nombre, distrito_nombre, alcaldia_nombre, es_cabecera_departamental')
                .order('distrito_codigo', { ascending: true })
                .limit(500),
            supabaseClient
                .from('vw_catalogo_formularios_tributarios')
                .select('*')
                .limit(500)
        ]);

        let updated = false;

        if (resTerritorio.data && resTerritorio.data.length > 0) {
            window.TERRITORIO_SV = resTerritorio.data;
            try {
                localStorage.setItem('educonta_territorio_sv_v1', JSON.stringify(window.TERRITORIO_SV));
            } catch (e) {
                console.warn("No se pudo guardar territorio en localStorage:", e);
            }
            updated = true;
        }

        if (resFormularios.data && resFormularios.data.length > 0) {
            window.CATALOGO_FORMULARIOS_TRIBUTARIOS = resFormularios.data;
            try {
                localStorage.setItem('educonta_formularios_tributarios_v1', JSON.stringify(window.CATALOGO_FORMULARIOS_TRIBUTARIOS));
            } catch (e) {
                console.warn("No se pudo guardar formularios tributarios en localStorage:", e);
            }
            updated = true;
        }

        if (updated) {
            window.dispatchEvent(new CustomEvent('educonta:catalogoTributarioLoaded', {
                detail: {
                    territorioCount: window.TERRITORIO_SV.length,
                    formulariosCount: window.CATALOGO_FORMULARIOS_TRIBUTARIOS.length
                }
            }));
            return true;
        }
        return false;
    } catch (err) {
        console.error("Error en syncCatalogoTributarioInBackground:", err);
        return false;
    }
}


