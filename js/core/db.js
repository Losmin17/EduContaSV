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
        }
        return true;
    } catch (err) {
        console.error("Error en la sincronización del catálogo:", err);
        return false;
    }
}

window.clasificarCuenta = function(a) {
            const c = a.id ? String(a.id).trim() : String(a.codigo || '').trim();
            const cat = a.cat || 'Com';
            const rubroLabel = (a.rubro || '').trim();

            let tipo = 'Otros'; // Activo, Pasivo, Patrimonio, Resultado
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

            // 2. DETERMINAR CLASE (Corriente vs No Corriente) - Basado en NIC 1 / SSF
            if (tipo === 'Activo') {
                if (cat === 'SSF') {
                    // SSF: 11 Intermediación (C), 12 Otros (C), 13 Fijo (NC)
                    if (c.startsWith('11') || c.startsWith('12')) clase = 'Corriente';
                    else if (c.startsWith('13')) clase = 'No Corriente';
                    else clase = 'Corriente';
                } else if (cat === 'Gub') {
                    if (c.startsWith('21')) clase = 'Corriente';
                    else clase = 'No Corriente';
                } else { // Comercial (NIC) / Agr
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

            return { tipo, clase, rubroId, rubroNombre };
        }

window.obtenerNombreRubro = function(id, cat, tipo = 'Activo') {
            const project = typeof window.proyecto_actual !== 'undefined' ? window.proyecto_actual : null;
            const catalogo = project?.catalogo || 'MAESTRO';

            // Caso especial: Sobregiros Bancarios (Activo con saldo acreedor movido a Pasivo)
            if (tipo === 'Pasivo' && id.startsWith('11')) {
                return 'Sobregiros Bancarios';
            }

            // Reglas de Nomenclatura por Catálogo Específico
            if (cat === 'SSF') {
                if (catalogo === 'BANCOS') {
                    if (id === '1101') return 'Disponibilidades';
                    if (id === '1102') return 'Inversiones Financieras';
                    if (id === '1103') return 'Cartera de Préstamos (Neta)';
                    if (id === '2101') return 'Obligaciones con el Público';
                } else if (catalogo === 'SEGUROS') {
                    if (id === '1101') return 'Inversiones y Disponibilidades';
                    if (id === '2101') return 'Obligaciones Contractuales';
                }
            } else if (cat === 'AGR') {
                if (catalogo === 'NIC41') {
                    if (id === '1103') return 'Activos Biológicos Corrientes';
                    if (id === '1201') return 'Activos Biológicos Productores';
                }
            } else if (cat === 'GUB') {
                if (id === '1101') return 'Fondo General / Tesorería';
                if (id === '2101') return 'Deuda Flotante';
            }

            const match = CATALOGO_MAESTRO.find(x => x.id === id && x.cat === cat);
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
                '41': 'Ingresos',
                '51': 'Costos y Gastos'
            };
            return fallbacks[id] || `Grupo ${id}`;
        }

window.getClaseNombre = function(clase, tipo) {
            if (tipo === 'Activo') return clase === 'Corriente' ? 'Activo Corriente' : 'Activo No Corriente';
            if (tipo === 'Pasivo') return clase === 'Corriente' ? 'Pasivo Corriente' : 'Pasivo No Corriente';
            return tipo;
        }
