window.goToIndices = function() {
    if (typeof procesarDiario !== 'function' || typeof calcularUtilidad !== 'function' || typeof clasificarCuenta !== 'function') {
        showAlert('Error', 'No se pudieron cargar los módulos contables requeridos.');
        return;
    }

    const accounts = procesarDiario(false);
    const utilidad = calcularUtilidad(accounts);
    
    let tActivo = 0, tPatrimonio = 0, tPasivo = 0;
    
    accounts.forEach(a => {
        const info = clasificarCuenta(a);
        if (info.tipo === 'Activo') {
            if (a.saldoDeudor >= a.saldoAcreedor) {
                tActivo += (a.saldoDeudor - a.saldoAcreedor);
            } else {
                tPasivo += (a.saldoAcreedor - a.saldoDeudor);
            }
        } else if (info.tipo === 'Pasivo') {
            if (a.saldoAcreedor >= a.saldoDeudor) {
                tPasivo += (a.saldoAcreedor - a.saldoDeudor);
            } else {
                tActivo += (a.saldoDeudor - a.saldoAcreedor);
            }
        } else if (info.tipo === 'Patrimonio') {
            tPatrimonio += (a.saldoAcreedor - a.saldoDeudor);
        }
    });

    tPatrimonio += utilidad; 

    // Solo exportar montos mayores de 0, para no tirar div entre 0 a menos que sea 0.
    const pid = window.proyecto_actual?.id || '';
    const url = 'indices.html?pid=' + pid + '&act=' + tActivo.toFixed(2) + '&pat=' + tPatrimonio.toFixed(2) + '&uti=' + utilidad.toFixed(2);
    window.location.href = url;
};
