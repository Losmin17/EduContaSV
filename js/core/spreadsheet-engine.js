// =================================================================
// EDUCONTA SV — MOTOR DE HOJA DE CÁLCULO NATIVO CON HYPERFORMULA
// Reordenado / Movimiento de Filas y Columnas (Drag & Drop + Menú)
// Corrección de Undo/Redo en Inserción y Resaltado de Selección Completa
// =================================================================

class EduContaSpreadsheetEngine {
    constructor(containerId, options = {}) {
        this.container = typeof containerId === 'string' ? document.querySelector(containerId) : containerId;
        if (!this.container) return;

        this.options = Object.assign({
            rowCount: 100,
            colCount: 26,
            defaultColWidth: 100,
            defaultRowHeight: 28,
            sheets: [
                { id: 'sheet_1', name: 'Hoja1', data: {}, colWidths: {}, rowHeights: {} }
            ],
            onCellSelect: null,
            onChange: null,
            maxHistory: 100,
        }, options);

        this.sheets = this.options.sheets;
        this.activeSheetIndex = 0;

        // Modos de Vista (Normal, Paginada, Saltos de Página, Auditoría de Fórmulas)
        this.currentViewMode = 'normal'; // 'normal' | 'paginada' | 'saltos' | 'formulas'
        this.pageConfig = {
            size: 'letter',
            orientation: 'portrait',
            rowsPerPage: 35,
            colsPerPage: 8
        };

        // Colaboradores Multijugador Remotos
        this.remoteCollaborators = new Map();

        // Estado de Selección
        this.activeRow = 0;
        this.activeCol = 0;
        this.selectStartRow = 0;
        this.selectStartCol = 0;
        this.selectEndRow = 0;
        this.selectEndCol = 0;

        this.isEditing = false;
        this.editingRow = -1;
        this.editingCol = -1;

        this.isDragSelecting = false;
        this.isFormulaPicking = false;
        this.isFormulaPickingDrag = false;
        this.isFormulaPickingContinuous = false;
        this.isFormulaPointMode = false;
        this.formulaPickAnchorRow = 0;
        this.formulaPickAnchorCol = 0;
        this.formulaPickBaseText = '';
        this.formulaPickSeparator = '';
        this.isFormulaBarActive = false;
        this.pickingRow = 0;
        this.pickingCol = 0;

        // Doble Clic y Drag-to-Move de Selección
        this.lastClickCell = null;
        this.lastClickTime = 0;
        this.isDraggingFillHandle = false;
        this.fillSourceRange = null;
        this.fillTargetRange = null;
        this.isDraggingCellMove = false;
        this.cellMoveSource = null;
        this.cellMoveTarget = null;
        this.detectedRangeForFormula = null;

        // Menú de Cabeceras
        this.activeHeaderType = null; // 'col' | 'row'
        this.targetHeaderCol = 0;
        this.targetHeaderRow = 0;
        this.sizePromptMode = null; // 'col' | 'row'

        // Drag & Drop de Filas y Columnas
        this.draggedHeaderType = null; // 'col' | 'row'
        this.draggedHeaderIdx = -1;

        // Autocompletado de Fórmulas
        this.autocompleteActiveIdx = 0;
        this.filteredFormulas = [];

        // Catálogo Traducido y Exhaustivo de Fórmulas (Español / Salvador + HyperFormula)
        this.formulaCatalog = [
            // === 💰 FINANCIERAS ===
            { es: 'VAN', en: 'NPV', desc: 'Calcula el Valor Actual Neto de una inversión a partir de una tasa de descuento y flujos de efectivo periódicos.', syntax: 'VAN(tasa; flujo1; [flujo2]; ...)' },
            { es: 'VNA', en: 'NPV', desc: 'Calcula el Valor Neto Actual (VNA) descontando flujos de caja futuros periódicos.', syntax: 'VNA(tasa; rango_flujos)' },
            { es: 'TIR', en: 'IRR', desc: 'Devuelve la Tasa Interna de Retorno para una serie periódica de flujos de efectivo.', syntax: 'TIR(valores; [estimar])' },
            { es: 'TIR.NO.PER', en: 'XIRR', desc: 'Calcula la tasa interna de retorno para un calendario de flujos de caja no periódicos.', syntax: 'TIR.NO.PER(valores; fechas; [estimar])' },
            { es: 'VNA.NO.PER', en: 'XNPV', desc: 'Calcula el valor neto actual para flujos de caja no periódicos con fechas.', syntax: 'VNA.NO.PER(tasa; valores; fechas)' },
            { es: 'TASA', en: 'RATE', desc: 'Devuelve la tasa de interés por período de un préstamo o anualidad.', syntax: 'TASA(nper; pago; va; [vf]; [tipo])' },
            { es: 'NPER', en: 'NPER', desc: 'Calcula el número de períodos de una inversión o préstamo con pagos constantes.', syntax: 'NPER(tasa; pago; va; [vf]; [tipo])' },
            { es: 'PAGO', en: 'PMT', desc: 'Calcula la cuota o pago periódico de un préstamo a amortizar a tasa fija.', syntax: 'PAGO(tasa; nper; va; [vf]; [tipo])' },
            { es: 'PAGOPRIN', en: 'PPMT', desc: 'Calcula el pago sobre el capital de un préstamo en un período específico.', syntax: 'PAGOPRIN(tasa; período; nper; va; [vf]; [tipo])' },
            { es: 'PAGOINT', en: 'IPMT', desc: 'Calcula la amortización de interés de un préstamo en un período determinado.', syntax: 'PAGOINT(tasa; período; nper; va; [vf]; [tipo])' },
            { es: 'VF', en: 'FV', desc: 'Devuelve el valor futuro de una inversión basada en pagos periódicos y tasa fija.', syntax: 'VF(tasa; nper; pago; [va]; [tipo])' },
            { es: 'VA', en: 'PV', desc: 'Devuelve el valor actual o suma presente de una serie de pagos futuros.', syntax: 'VA(tasa; nper; pago; [vf]; [tipo])' },
            { es: 'SLN', en: 'SLN', desc: 'Depreciación por el método de línea recta de un activo durante un período.', syntax: 'SLN(costo; valor_residual; vida_útil)' },
            { es: 'SYD', en: 'SYD', desc: 'Depreciación por el método de suma de dígitos de los años.', syntax: 'SYD(costo; valor_residual; vida_útil; período)' },
            { es: 'DDB', en: 'DDB', desc: 'Depreciación por el método de doble disminución del saldo amortizado.', syntax: 'DDB(costo; valor_residual; vida_útil; período; [factor])' },
            { es: 'DB', en: 'DB', desc: 'Depreciación de un bien a un período especificado usando el método de saldo fijo decreciente.', syntax: 'DB(costo; valor_residual; vida_útil; período; [mes])' },
            { es: 'INT.PAGO.DIR', en: 'ISPMT', desc: 'Calcula el interés pagado durante un período específico de una inversión.', syntax: 'INT.PAGO.DIR(tasa; período; nper; valor)' },
            { es: 'TASA.INT', en: 'INTRATE', desc: 'Calcula la tasa de interés para la inversión total de un valor bursátil.', syntax: 'TASA.INT(liquidación; vencimiento; inversión; amortización; [base])' },
            { es: 'PRECIO', en: 'PRICE', desc: 'Calcula el precio por $100 de valor nominal de un valor bursátil con interés periódico.', syntax: 'PRECIO(liquidación; vencimiento; tasa; rendimiento; amortización; frecuencia; [base])' },
            { es: 'RENDTO', en: 'YIELD', desc: 'Calcula el rendimiento de un valor que devenga intereses periódicos.', syntax: 'RENDTO(liquidación; vencimiento; tasa; precio; amortización; frecuencia; [base])' },

            // === 🇸🇻 TRIBUTARIAS Y LABORALES EL SALVADOR ===
            { es: 'IVA', en: 'SV_IVA', desc: 'Calcula el Impuesto a la Transferencia de Bienes Muebles y Servicios en El Salvador (13%).', syntax: 'IVA(monto)' },
            { es: 'ISSS_LABORAL', en: 'SV_ISSS_LAB', desc: 'Retención ISSS laboral en El Salvador (3.0% con techo de $1,000.00).', syntax: 'ISSS_LABORAL(salario)' },
            { es: 'ISSS_PATRONAL', en: 'SV_ISSS_PAT', desc: 'Aporte patronal ISSS en El Salvador (7.5% con techo de $1,000.00).', syntax: 'ISSS_PATRONAL(salario)' },
            { es: 'AFP_LABORAL', en: 'SV_AFP_LAB', desc: 'Retención de pensiones AFP laboral en El Salvador (7.25% sin techo).', syntax: 'AFP_LABORAL(salario)' },
            { es: 'AFP_PATRONAL', en: 'SV_AFP_PAT', desc: 'Aporte patronal AFP en El Salvador (8.75% sin techo).', syntax: 'AFP_PATRONAL(salario)' },
            { es: 'RENTA', en: 'SV_ISR', desc: 'Calcula la retención mensual del Impuesto Sobre la Renta (ISR) según Decreto MH de El Salvador.', syntax: 'RENTA(salario_gravable)' },

            // === 📊 MATEMÁTICAS Y TRIGONOMÉTRICAS ===
            { es: 'SUMA', en: 'SUM', desc: 'Suma todos los números de uno o varios rangos de celdas.', syntax: 'SUMA(número1; [número2]; ...)' },
            { es: 'SUMAR.SI', en: 'SUMIF', desc: 'Suma las celdas que cumplen con un criterio determinado.', syntax: 'SUMAR.SI(rango; criterio; [rango_suma])' },
            { es: 'SUMAR.SI.CONJUNTO', en: 'SUMIFS', desc: 'Suma las celdas que cumplen múltiples condiciones y criterios.', syntax: 'SUMAR.SI.CONJUNTO(rango_suma; rango_criterio1; criterio1; ...)' },
            { es: 'SUMAPRODUCTO', en: 'SUMPRODUCT', desc: 'Multiplica los componentes correspondientes de las matrices y devuelve la suma.', syntax: 'SUMAPRODUCTO(matriz1; [matriz2]; ...)' },
            { es: 'SUMA.CUADRADOS', en: 'SUMSQ', desc: 'Devuelve la suma de los cuadrados de los argumentos.', syntax: 'SUMA.CUADRADOS(número1; [número2]; ...)' },
            { es: 'REDONDEAR', en: 'ROUND', desc: 'Redondea un número al número de decimales especificado.', syntax: 'REDONDEAR(número; decimales)' },
            { es: 'REDONDEAR.MAS', en: 'ROUNDUP', desc: 'Redondea un número hacia arriba, en dirección contraria a cero.', syntax: 'REDONDEAR.MAS(número; decimales)' },
            { es: 'REDONDEAR.MENOS', en: 'ROUNDDOWN', desc: 'Redondea un número hacia abajo, hacia cero.', syntax: 'REDONDEAR.MENOS(número; decimales)' },
            { es: 'REDOND.MULT', en: 'MROUND', desc: 'Devuelve un número redondeado al múltiplo deseado.', syntax: 'REDOND.MULT(número; múltiplo)' },
            { es: 'ENTERO', en: 'INT', desc: 'Redondea un número hacia abajo al entero más cercano.', syntax: 'ENTERO(número)' },
            { es: 'TRUNCAR', en: 'TRUNC', desc: 'Suprime la parte decimal de un número sin redondear.', syntax: 'TRUNCAR(número; [núm_decimales])' },
            { es: 'ABS', en: 'ABS', desc: 'Devuelve el valor absoluto de un número (sin signo).', syntax: 'ABS(número)' },
            { es: 'RESIDUO', en: 'MOD', desc: 'Devuelve el residuo o resto de la división entre dos números.', syntax: 'RESIDUO(número; divisor)' },
            { es: 'SIGNO', en: 'SIGN', desc: 'Devuelve el signo de un número (1 si es positivo, -1 si es negativo, 0 si es cero).', syntax: 'SIGNO(número)' },
            { es: 'PRODUCTO', en: 'PRODUCT', desc: 'Multiplica todos los números especificados como argumentos.', syntax: 'PRODUCTO(número1; [número2]; ...)' },
            { es: 'POTENCIA', en: 'POWER', desc: 'Eleva un número a una potencia determinada.', syntax: 'POTENCIA(número; potencia)' },
            { es: 'RAIZ', en: 'SQRT', desc: 'Devuelve la raíz cuadrada positiva de un número.', syntax: 'RAIZ(número)' },
            { es: 'EXP', en: 'EXP', desc: 'Eleva la constante e (base del logaritmo natural) a una potencia dada.', syntax: 'EXP(número)' },
            { es: 'LN', en: 'LN', desc: 'Devuelve el logaritmo natural (en base e) de un número.', syntax: 'LN(número)' },
            { es: 'LOG10', en: 'LOG10', desc: 'Devuelve el logaritmo en base 10 de un número.', syntax: 'LOG10(número)' },
            { es: 'LOG', en: 'LOG', desc: 'Devuelve el logaritmo de un número en la base especificada.', syntax: 'LOG(número; [base])' },
            { es: 'FACT', en: 'FACT', desc: 'Devuelve el factorial de un número entero.', syntax: 'FACT(número)' },
            { es: 'ALEATORIO.ENTRE', en: 'RANDBETWEEN', desc: 'Devuelve un número entero aleatorio entre los números que especifique.', syntax: 'ALEATORIO.ENTRE(inferior; superior)' },
            { es: 'ALEATORIO', en: 'RAND', desc: 'Devuelve un número real aleatorio mayor o igual a 0 y menor que 1.', syntax: 'ALEATORIO()' },
            { es: 'PI', en: 'PI', desc: 'Devuelve el valor del número Pi con 15 dígitos de precisión.', syntax: 'PI()' },
            { es: 'SUBTOTALES', en: 'SUBTOTAL', desc: 'Devuelve un subtotal en una lista o base de datos según el tipo de función.', syntax: 'SUBTOTALES(núm_función; ref1; [ref2]; ...)' },
            { es: 'RADIANES', en: 'RADIANS', desc: 'Convierte grados angulares en radianes.', syntax: 'RADIANES(ángulo)' },
            { es: 'GRADOS', en: 'DEGREES', desc: 'Convierte radianes en grados sexagesimales.', syntax: 'GRADOS(ángulo)' },
            { es: 'SENO', en: 'SIN', desc: 'Devuelve el seno de un ángulo dado en radianes.', syntax: 'SENO(número)' },
            { es: 'COSENO', en: 'COS', desc: 'Devuelve el coseno de un ángulo dado en radianes.', syntax: 'COSENO(número)' },
            { es: 'TANGENTE', en: 'TAN', desc: 'Devuelve la tangente de un ángulo dado en radianes.', syntax: 'TANGENTE(número)' },

            // === 📈 ESTADÍSTICAS ===
            { es: 'PROMEDIO', en: 'AVERAGE', desc: 'Devuelve la media aritmética de los argumentos numéricos.', syntax: 'PROMEDIO(rango1; [rango2]; ...)' },
            { es: 'PROMEDIO.SI', en: 'AVERAGEIF', desc: 'Calcula el promedio de las celdas que cumplen con un criterio dado.', syntax: 'PROMEDIO.SI(rango; criterio; [rango_promedio])' },
            { es: 'PROMEDIO.SI.CONJUNTO', en: 'AVERAGEIFS', desc: 'Calcula el promedio de las celdas que cumplen con múltiples criterios.', syntax: 'PROMEDIO.SI.CONJUNTO(rango_promedio; rango_criterio1; criterio1; ...)' },
            { es: 'PROMEDIO.A', en: 'AVERAGEA', desc: 'Calcula el promedio incluyendo valores de texto y lógicos.', syntax: 'PROMEDIO.A(valor1; [valor2]; ...)' },
            { es: 'CONTAR', en: 'COUNT', desc: 'Cuenta cuántas celdas contienen números.', syntax: 'CONTAR(rango1; [rango2]; ...)' },
            { es: 'CONTARA', en: 'COUNTA', desc: 'Cuenta cuántas celdas no están vacías.', syntax: 'CONTARA(rango1; [rango2]; ...)' },
            { es: 'CONTAR.SI', en: 'COUNTIF', desc: 'Cuenta el número de celdas en un rango que cumplen con un criterio.', syntax: 'CONTAR.SI(rango; criterio)' },
            { es: 'CONTAR.SI.CONJUNTO', en: 'COUNTIFS', desc: 'Cuenta las celdas que cumplen múltiples criterios.', syntax: 'CONTAR.SI.CONJUNTO(rango_criterio1; criterio1; ...)' },
            { es: 'CONTAR.BLANCO', en: 'COUNTBLANK', desc: 'Cuenta el número de celdas vacías dentro de un rango especificado.', syntax: 'CONTAR.BLANCO(rango)' },
            { es: 'MAX', en: 'MAX', desc: 'Devuelve el valor numérico máximo de una lista de argumentos.', syntax: 'MAX(número1; [número2]; ...)' },
            { es: 'MAX.A', en: 'MAXA', desc: 'Devuelve el valor máximo de una lista incluyendo texto y valores lógicos.', syntax: 'MAX.A(valor1; [valor2]; ...)' },
            { es: 'MIN', en: 'MIN', desc: 'Devuelve el valor numérico mínimo de una lista de argumentos.', syntax: 'MIN(número1; [número2]; ...)' },
            { es: 'MIN.A', en: 'MINA', desc: 'Devuelve el valor mínimo de una lista incluyendo texto y valores lógicos.', syntax: 'MIN.A(valor1; [valor2]; ...)' },
            { es: 'MEDIANA', en: 'MEDIAN', desc: 'Devuelve la mediana o número central de un conjunto de datos.', syntax: 'MEDIANA(número1; [número2]; ...)' },
            { es: 'MODA.UNO', en: 'MODE.SNGL', desc: 'Devuelve el valor que se repite con más frecuencia en un rango de datos.', syntax: 'MODA.UNO(número1; [número2]; ...)' },
            { es: 'MODA', en: 'MODE', desc: 'Devuelve el valor modal o más frecuente en una matriz de datos.', syntax: 'MODA(número1; [número2]; ...)' },
            { es: 'K.ESIMO.MAYOR', en: 'LARGE', desc: 'Devuelve el k-ésimo valor mayor de un conjunto de datos.', syntax: 'K.ESIMO.MAYOR(matriz; k)' },
            { es: 'K.ESIMO.MENOR', en: 'SMALL', desc: 'Devuelve el k-ésimo valor menor de un conjunto de datos.', syntax: 'K.ESIMO.MENOR(matriz; k)' },
            { es: 'DESVEST.M', en: 'STDEV.S', desc: 'Calcula la desviación estándar de una muestra.', syntax: 'DESVEST.M(número1; [número2]; ...)' },
            { es: 'DESVEST.P', en: 'STDEV.P', desc: 'Calcula la desviación estándar en función de toda la población.', syntax: 'DESVEST.P(número1; [número2]; ...)' },
            { es: 'DESVEST', en: 'STDEV', desc: 'Estima la desviación estándar a partir de una muestra.', syntax: 'DESVEST(número1; [número2]; ...)' },
            { es: 'VAR.S', en: 'VAR.S', desc: 'Calcula la varianza en función de una muestra.', syntax: 'VAR.S(número1; [número2]; ...)' },
            { es: 'VAR.P', en: 'VAR.P', desc: 'Calcula la varianza en función de toda la población.', syntax: 'VAR.P(número1; [número2]; ...)' },
            { es: 'VAR', en: 'VAR', desc: 'Estima la varianza a partir de una muestra de datos.', syntax: 'VAR(número1; [número2]; ...)' },
            { es: 'COEF.DE.CORREL', en: 'CORREL', desc: 'Devuelve el coeficiente de correlación de Pearson entre dos conjuntos de datos.', syntax: 'COEF.DE.CORREL(matriz1; matriz2)' },
            { es: 'PRONOSTICO', en: 'FORECAST', desc: 'Calcula un valor futuro a partir de una tendencia lineal.', syntax: 'PRONOSTICO(x; valores_conocidos_y; valores_conocidos_x)' },
            { es: 'JERARQUIA', en: 'RANK', desc: 'Devuelve la posición relativa o ranking de un número en una lista de valores.', syntax: 'JERARQUIA(número; referencia; [orden])' },
            { es: 'PERCENTIL', en: 'PERCENTILE', desc: 'Devuelve el k-ésimo percentil de los valores de un rango.', syntax: 'PERCENTIL(matriz; k)' },
            { es: 'CUARTIL', en: 'QUARTILE', desc: 'Devuelve el cuartil de un conjunto de datos (0 a 4).', syntax: 'CUARTIL(matriz; cuartil)' },

            // === 🔀 LÓGICAS Y COMPROBACIÓN ===
            { es: 'SI', en: 'IF', desc: 'Evalúa una condición lógica y devuelve un valor si es verdadera u otro si es falsa.', syntax: 'SI(prueba_lógica; valor_si_verdadero; [valor_si_falso])' },
            { es: 'SI.CONJUNTO', en: 'IFS', desc: 'Comprueba si se cumplen una o más condiciones y devuelve el valor que corresponde a la primera condición verdadera.', syntax: 'SI.CONJUNTO(prueba_lógica1; valor_si_verdadero1; ...)' },
            { es: 'SI.ERROR', en: 'IFERROR', desc: 'Devuelve un valor personalizado si la fórmula genera un error.', syntax: 'SI.ERROR(valor; valor_si_error)' },
            { es: 'SI.ND', en: 'IFNA', desc: 'Devuelve el valor que especifique si la expresión se resuelve como #N/A.', syntax: 'SI.ND(valor; valor_si_nd)' },
            { es: 'Y', en: 'AND', desc: 'Devuelve VERDADERO si todos los argumentos evaluados son verdaderos.', syntax: 'Y(lógico1; [lógico2]; ...)' },
            { es: 'O', en: 'OR', desc: 'Devuelve VERDADERO si al menos uno de los argumentos es verdadero.', syntax: 'O(lógico1; [lógico2]; ...)' },
            { es: 'XO', en: 'XOR', desc: 'Devuelve una disyunción exclusiva lógica de todos los argumentos.', syntax: 'XO(lógico1; [lógico2]; ...)' },
            { es: 'NO', en: 'NOT', desc: 'Invierte el valor de falso a verdadero o viceversa.', syntax: 'NO(lógico)' },
            { es: 'VERDADERO', en: 'TRUE', desc: 'Devuelve el valor lógico VERDADERO.', syntax: 'VERDADERO()' },
            { es: 'FALSO', en: 'FALSE', desc: 'Devuelve el valor lógico FALSO.', syntax: 'FALSO()' },
            { es: 'ESBLANCO', en: 'ISBLANK', desc: 'Comprueba si una celda está vacía.', syntax: 'ESBLANCO(valor)' },
            { es: 'ESNUMERO', en: 'ISNUMBER', desc: 'Comprueba si un valor es numérico.', syntax: 'ESNUMERO(valor)' },
            { es: 'ESTEXTO', en: 'ISTEXT', desc: 'Comprueba si un valor corresponde a texto.', syntax: 'ESTEXTO(valor)' },
            { es: 'ESNODESC', en: 'ISNA', desc: 'Comprueba si un valor es el error #N/A.', syntax: 'ESNODESC(valor)' },
            { es: 'ESERROR', en: 'ISERROR', desc: 'Comprueba si un valor corresponde a cualquier tipo de error.', syntax: 'ESERROR(valor)' },
            { es: 'ESERR', en: 'ISERR', desc: 'Comprueba si un valor es un error excepto #N/A.', syntax: 'ESERR(valor)' },
            { es: 'ESLOGICO', en: 'ISLOGICAL', desc: 'Comprueba si un valor es de tipo booleano / lógico.', syntax: 'ESLOGICO(valor)' },
            { es: 'ESPAR', en: 'ISEVEN', desc: 'Devuelve VERDADERO si el número es par.', syntax: 'ESPAR(número)' },
            { es: 'ESIMPAR', en: 'ISODD', desc: 'Devuelve VERDADERO si el número es impar.', syntax: 'ESIMPAR(número)' },

            // === 🔍 BÚSQUEDA Y REFERENCIA ===
            { es: 'BUSCARX', en: 'XLOOKUP', desc: 'Busca una coincidencia en un rango o matriz y devuelve el elemento correspondiente.', syntax: 'BUSCARX(valor_buscado; matriz_búsqueda; matriz_devuelta; [si_no_se_encuentra]; [modo_coincidencia]; [modo_búsqueda])' },
            { es: 'BUSCARV', en: 'VLOOKUP', desc: 'Busca un valor en la primera columna de una tabla y devuelve el valor de otra columna.', syntax: 'BUSCARV(valor_buscado; matriz; indicador_columna; [ordenado])' },
            { es: 'BUSCARH', en: 'HLOOKUP', desc: 'Busca en la primera fila de una tabla o matriz de valores.', syntax: 'BUSCARH(valor_buscado; matriz; indicador_filas; [ordenado])' },
            { es: 'COINCIDIRX', en: 'XMATCH', desc: 'Devuelve la posición relativa de un elemento en una matriz con opciones avanzadas.', syntax: 'COINCIDIRX(valor_buscado; matriz_búsqueda; [modo_coincidencia]; [modo_búsqueda])' },
            { es: 'COINCIDIR', en: 'MATCH', desc: 'Devuelve la posición relativa de un elemento en un rango.', syntax: 'COINCIDIR(valor_buscado; matriz_búsqueda; [tipo])' },
            { es: 'INDICE', en: 'INDEX', desc: 'Devuelve un valor o la referencia a un valor desde una tabla o rango.', syntax: 'INDICE(matriz; número_fila; [número_columna])' },
            { es: 'ELEGIR', en: 'CHOOSE', desc: 'Elige un valor de una lista de argumentos a partir de un número de índice.', syntax: 'ELEGIR(núm_índice; valor1; [valor2]; ...)' },
            { es: 'DESREF', en: 'OFFSET', desc: 'Devuelve una referencia a un rango que está a un número especificado de filas y columnas de una celda.', syntax: 'DESREF(ref; filas; columnas; [alto]; [ancho])' },
            { es: 'DIRECCION', en: 'ADDRESS', desc: 'Crea una referencia de celda en forma de texto a partir de los números de fila y columna.', syntax: 'DIRECCION(fila; columna; [abs]; [a1]; [hoja])' },
            { es: 'COLUMNA', en: 'COLUMN', desc: 'Devuelve el número de columna de una celda de referencia.', syntax: 'COLUMNA([referencia])' },
            { es: 'COLUMNAS', en: 'COLUMNS', desc: 'Devuelve la cantidad de columnas contenidas en una matriz o referencia.', syntax: 'COLUMNAS(matriz)' },
            { es: 'FILA', en: 'ROW', desc: 'Devuelve el número de fila de una celda de referencia.', syntax: 'FILA([referencia])' },
            { es: 'FILAS', en: 'ROWS', desc: 'Devuelve la cantidad de filas contenidas en una matriz o referencia.', syntax: 'FILAS(matriz)' },
            { es: 'TRANSPONER', en: 'TRANSPOSE', desc: 'Transpone un rango vertical en horizontal o viceversa.', syntax: 'TRANSPONER(matriz)' },
            { es: 'FORMULATEXTO', en: 'FORMULATEXT', desc: 'Devuelve la fórmula contenida en una celda en formato de texto.', syntax: 'FORMULATEXTO(referencia)' },

            // === 🔤 TEXTO Y CADENAS ===
            { es: 'CONCATENAR', en: 'CONCATENATE', desc: 'Une varias cadenas de texto en una sola.', syntax: 'CONCATENAR(texto1; [texto2]; ...)' },
            { es: 'CONCAT', en: 'CONCAT', desc: 'Concatena una lista o rango de cadenas de texto.', syntax: 'CONCAT(texto1; [texto2]; ...)' },
            { es: 'UNIRCADENAS', en: 'TEXTJOIN', desc: 'Une texto de múltiples rangos o cadenas utilizando un delimitador.', syntax: 'UNIRCADENAS(delimitador; ignorar_vacías; texto1; ...)' },
            { es: 'TEXTO', en: 'TEXT', desc: 'Formatea un número y lo convierte a texto con una máscara personalizada.', syntax: 'TEXTO(valor; formato_texto)' },
            { es: 'VALOR', en: 'VALUE', desc: 'Convierte una cadena de texto que representa un número en un número.', syntax: 'VALOR(texto)' },
            { es: 'MAYUSC', en: 'UPPER', desc: 'Convierte todo el texto en letras mayúsculas.', syntax: 'MAYUSC(texto)' },
            { es: 'MINUSC', en: 'LOWER', desc: 'Convierte todo el texto en letras minúsculas.', syntax: 'MINUSC(texto)' },
            { es: 'NOMPROPIO', en: 'PROPER', desc: 'Convierte en mayúscula la primera letra de cada palabra de una cadena.', syntax: 'NOMPROPIO(texto)' },
            { es: 'IZQUIERDA', en: 'LEFT', desc: 'Extrae caracteres del extremo izquierdo de un texto.', syntax: 'IZQUIERDA(texto; [núm_caracteres])' },
            { es: 'DERECHA', en: 'RIGHT', desc: 'Extrae caracteres del extremo derecho de un texto.', syntax: 'DERECHA(texto; [núm_caracteres])' },
            { es: 'EXTRAE', en: 'MID', desc: 'Devuelve un número específico de caracteres de una cadena de texto desde una posición inicial.', syntax: 'EXTRAE(texto; posición_inicial; núm_caracteres)' },
            { es: 'LARGO', en: 'LEN', desc: 'Devuelve la cantidad total de caracteres de una cadena de texto.', syntax: 'LARGO(texto)' },
            { es: 'ESPACIOS', en: 'TRIM', desc: 'Elimina los espacios iniciales, finales y duplicados de un texto.', syntax: 'ESPACIOS(texto)' },
            { es: 'LIMPIAR', en: 'CLEAN', desc: 'Quita todos los caracteres no imprimibles de un texto.', syntax: 'LIMPIAR(texto)' },
            { es: 'REEMPLAZAR', en: 'REPLACE', desc: 'Reemplaza parte de una cadena de texto por otra diferente según la posición.', syntax: 'REEMPLAZAR(texto_original; núm_inicial; núm_caracteres; texto_nuevo)' },
            { es: 'SUSTITUIR', en: 'SUBSTITUTE', desc: 'Sustituye texto nuevo por texto antiguo en una cadena.', syntax: 'SUSTITUIR(texto; texto_original; texto_nuevo; [núm_de_ocurrencia])' },
            { es: 'HALLAR', en: 'SEARCH', desc: 'Busca una cadena de texto dentro de otra (no distingue mayúsculas).', syntax: 'HALLAR(texto_buscado; dentro_del_texto; [núm_inicial])' },
            { es: 'ENCONTRAR', en: 'FIND', desc: 'Busca una cadena de texto dentro de otra (distingue mayúsculas y minúsculas).', syntax: 'ENCONTRAR(texto_buscado; dentro_del_texto; [núm_inicial])' },
            { es: 'REPETIR', en: 'REPT', desc: 'Repite el texto un número especificado de veces.', syntax: 'REPETIR(texto; núm_veces)' },
            { es: 'IGUAL', en: 'EXACT', desc: 'Comprueba si dos cadenas de texto son idénticas exactamente.', syntax: 'IGUAL(texto1; texto2)' },

            // === 📅 FECHAS Y HORAS ===
            { es: 'HOY', en: 'TODAY', desc: 'Devuelve la fecha actual del sistema.', syntax: 'HOY()' },
            { es: 'AHORA', en: 'NOW', desc: 'Devuelve la fecha y hora actuales del sistema.', syntax: 'AHORA()' },
            { es: 'FECHA', en: 'DATE', desc: 'Devuelve el número de serie que representa una fecha determinada.', syntax: 'FECHA(año; mes; día)' },
            { es: 'HORA', en: 'TIME', desc: 'Convierte horas, minutos y segundos en una fracción decimal de tiempo.', syntax: 'HORA(hora; minuto; segundo)' },
            { es: 'AÑO', en: 'YEAR', desc: 'Devuelve el año correspondiente a una fecha determinada.', syntax: 'AÑO(núm_de_serie)' },
            { es: 'MES', en: 'MONTH', desc: 'Devuelve el mes de una fecha (un número de 1 a 12).', syntax: 'MES(núm_de_serie)' },
            { es: 'DIA', en: 'DAY', desc: 'Devuelve el día del mes correspondiente a una fecha (de 1 a 31).', syntax: 'DIA(núm_de_serie)' },
            { es: 'DIAS', en: 'DAYS', desc: 'Devuelve el número de días entre dos fechas.', syntax: 'DIAS(fecha_final; fecha_inicial)' },
            { es: 'SIFECHA', en: 'DATEDIF', desc: 'Calcula la diferencia de días, meses o años entre dos fechas.', syntax: 'SIFECHA(fecha_inicial; fecha_final; unidad)' },
            { es: 'FECHA.MES', en: 'EDATE', desc: 'Devuelve la fecha que es el número indicado de meses antes o después de la fecha inicial.', syntax: 'FECHA.MES(fecha_inicial; meses)' },
            { es: 'FIN.MES', en: 'EOMONTH', desc: 'Devuelve el último día del mes antes o después del número de meses especificado.', syntax: 'FIN.MES(fecha_inicial; meses)' },
            { es: 'DIA.LAB', en: 'WORKDAY', desc: 'Devuelve la fecha resultante tras sumar un número de días laborables.', syntax: 'DIA.LAB(fecha_inicial; días; [vacaciones])' },
            { es: 'DIAS.LAB', en: 'NETWORKDAYS', desc: 'Devuelve el número de días laborables totales entre dos fechas.', syntax: 'DIAS.LAB(fecha_inicial; fecha_final; [vacaciones])' },
            { es: 'DIASEM', en: 'WEEKDAY', desc: 'Devuelve un número de 1 a 7 que identifica el día de la semana.', syntax: 'DIASEM(núm_de_serie; [tipo])' },
            { es: 'NUM.DE.SEMANA', en: 'WEEKNUM', desc: 'Devuelve el número de semana en el año para una fecha.', syntax: 'NUM.DE.SEMANA(núm_de_serie; [modo])' },
            { es: 'FRAC.AÑO', en: 'YEARFRAC', desc: 'Calcula la fracción de año que representa el número de días enteros entre dos fechas.', syntax: 'FRAC.AÑO(fecha_inicial; fecha_final; [base])' }
        ];

        // Paleta de Colores Multicolor para Referencias de Fórmulas
        this.formulaColorPalette = [
            { border: 'outline-sky-400 border-sky-400', bg: 'bg-sky-500/30', text: 'text-sky-300', glow: 'shadow-[0_0_12px_rgba(56,189,248,0.5)]' },
            { border: 'outline-amber-400 border-amber-400', bg: 'bg-amber-500/30', text: 'text-amber-300', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]' },
            { border: 'outline-emerald-400 border-emerald-400', bg: 'bg-emerald-500/30', text: 'text-emerald-300', glow: 'shadow-[0_0_12px_rgba(52,211,153,0.5)]' },
            { border: 'outline-indigo-400 border-indigo-400', bg: 'bg-indigo-500/30', text: 'text-indigo-300', glow: 'shadow-[0_0_12px_rgba(129,140,248,0.5)]' },
            { border: 'outline-rose-400 border-rose-400', bg: 'bg-rose-500/30', text: 'text-rose-300', glow: 'shadow-[0_0_12px_rgba(251,113,133,0.5)]' },
            { border: 'outline-teal-400 border-teal-400', bg: 'bg-teal-500/30', text: 'text-teal-300', glow: 'shadow-[0_0_12px_rgba(45,212,191,0.5)]' },
        ];

        // Redimensionado de Columnas / Filas
        this.isResizingCol = false;
        this.resizingColIdx = -1;
        this.resizeStartX = 0;
        this.resizeStartWidth = 0;

        this.isResizingRow = false;
        this.resizingRowIdx = -1;
        this.resizeStartY = 0;
        this.resizeStartHeight = 0;

        this.clipboard = null;
        this.activeMenuSheetIndex = null;
        this.sheetTabMenuEl = null;

        // Historial (undo/redo)
        this.history = [];
        this.future = [];

        // Catálogo de Estilos de Tabla Predefinidos
        this.tableStyles = {
            amber: {
                id: 'amber',
                name: 'Ámbar Documental',
                headerBg: '#f59e0b',
                headerText: '#ffffff',
                stripeBg: 'rgba(245, 158, 11, 0.08)',
                border: '#f59e0b',
                accentText: '#d97706'
            },
            emerald: {
                id: 'emerald',
                name: 'Esmeralda Contable',
                headerBg: '#059669',
                headerText: '#ffffff',
                stripeBg: 'rgba(5, 150, 105, 0.08)',
                border: '#059669',
                accentText: '#047857'
            },
            sky: {
                id: 'sky',
                name: 'Celeste Corporativo',
                headerBg: '#0284c7',
                headerText: '#ffffff',
                stripeBg: 'rgba(2, 132, 199, 0.08)',
                border: '#0284c7',
                accentText: '#0369a1'
            },
            indigo: {
                id: 'indigo',
                name: 'Índigo Profesional',
                headerBg: '#4f46e5',
                headerText: '#ffffff',
                stripeBg: 'rgba(79, 70, 229, 0.08)',
                border: '#4f46e5',
                accentText: '#4338ca'
            },
            slate: {
                id: 'slate',
                name: 'Grafito Auditoría',
                headerBg: '#334155',
                headerText: '#ffffff',
                stripeBg: 'rgba(51, 65, 85, 0.08)',
                border: '#475569',
                accentText: '#1e293b'
            },
            purple: {
                id: 'purple',
                name: 'Violeta Patrimonio',
                headerBg: '#7e22ce',
                headerText: '#ffffff',
                stripeBg: 'rgba(126, 34, 206, 0.08)',
                border: '#7e22ce',
                accentText: '#6b21a8'
            }
        };

        this.initHyperFormula();
        this.initDOM();
        this.bindEvents();
        this.bindFormulaBar();
        this.initCustomScrollbars();
        this.render();
    }

    // === INICIALIZACIÓN DE HYPERFORMULA ===
    initHyperFormula() {
        try {
            if (typeof HyperFormula !== 'undefined') {
                this.hfInstance = HyperFormula.buildEmpty({
                    licenseKey: 'gpl-v3',
                    useColumnIndex: true,
                    dateFormats: ['DD/MM/YYYY', 'DD-MM-YYYY', 'DD/MM/YY', 'DD-MM-YY', 'YYYY-MM-DD', 'YYYY/MM/DD'],
                    timeFormats: ['HH:mm:ss', 'HH:mm', 'hh:mm:ss a', 'hh:mm a'],
                });

                this.sheetIdMap = {};
                this.sheets.forEach((sheet) => {
                    const sheetId = this.hfInstance.addSheet(sheet.name);
                    this.sheetIdMap[sheet.name] = sheetId;
                });

                this.syncSheetDataToHyperFormula();
            } else {
                console.warn('HyperFormula no disponible, usando fallback nativo.');
            }
        } catch (e) {
            console.error('Error al inicializar HyperFormula:', e);
        }
    }

    rebuildHyperFormula() {
        try {
            if (this.hfInstance && typeof this.hfInstance.destroy === 'function') {
                this.hfInstance.destroy();
            }
        } catch (e) { /* noop */ }
        this.hfInstance = null;
        this.sheetIdMap = {};
        this.initHyperFormula();
    }

    cleanNumericValue(val) {
        if (val === null || val === undefined || val === '') return null;
        if (typeof val === 'number') return isNaN(val) || !isFinite(val) ? null : val;
        if (typeof val === 'string') {
            const trimmed = val.trim();
            if (trimmed === '') return null;

            // Detectar valores con paréntesis contables negativos: (500.00), ($500.00), (4%), ($ 12.00)
            const isParenNegative = /^\(\s*[-+]?\$?\s*[\d,]+(?:\.\d+)?\s*%?\s*\)$/.test(trimmed);

            // Coincidir números estándar, con moneda $, €, comas o porcentajes %
            if (isParenNegative || /^[-+]?\$?\s*[\d,]+(?:\.\d+)?%?$/.test(trimmed) || /^[-+]?[\d,]+(?:\.\d+)?\s*[$€%]?$/.test(trimmed)) {
                let cleanStr = trimmed.replace(/[$€\s()]/g, '');
                const isPercent = cleanStr.endsWith('%');
                if (isPercent) cleanStr = cleanStr.replace('%', '');
                cleanStr = cleanStr.replace(/,/g, '');
                const parsed = parseFloat(cleanStr);
                if (!isNaN(parsed) && isFinite(parsed)) {
                    let num = isPercent ? (parsed / 100) : parsed;
                    if (isParenNegative && num > 0) num = -num;
                    return num;
                }
            }
        }
        return null;
    }

    syncSheetDataToHyperFormula() {
        if (!this.hfInstance) return;
        this.sheets.forEach((sheet) => {
            const sheetId = this.sheetIdMap[sheet.name];
            if (sheetId === undefined) return;
            const data = sheet.data || {};
            Object.keys(data).forEach(key => {
                const parts = key.split('_');
                const r = parseInt(parts[0], 10);
                const c = parseInt(parts[1], 10);
                const cellData = data[key];
                let content = '';
                if (cellData.f) {
                    content = this.normalizeFormula(`=${cellData.f}`);
                } else if (cellData.v !== undefined && cellData.v !== null && cellData.v !== '') {
                    const cleanNum = this.cleanNumericValue(cellData.v);
                    if (cleanNum !== null) {
                        content = cleanNum;
                    } else {
                        content = cellData.v;
                    }
                }
                if (content !== '' && content !== undefined) {
                    try {
                        this.hfInstance.setCellContents({ sheet: sheetId, col: c, row: r }, content);
                    } catch (err) { /* noop */ }
                }
            });
        });
    }

    // === AUTO-CIERRE INTELIGENTE DE FÓRMULAS (PARÉNTESIS Y COMILLAS NO CERRADAS) ===
    autoCloseFormula(formulaStr) {
        if (!formulaStr) return '';
        let f = String(formulaStr).trim();
        if (!f.startsWith('=')) return f;

        let inQuotes = false;
        let quoteChar = '';
        let openParens = 0;

        for (let i = 0; i < f.length; i++) {
            const ch = f[i];
            if (inQuotes) {
                if (ch === quoteChar) {
                    if (i + 1 < f.length && f[i + 1] === quoteChar) {
                        i++; // omitir comilla doble escapada
                    } else {
                        inQuotes = false;
                        quoteChar = '';
                    }
                }
            } else {
                if (ch === '"' || ch === "'") {
                    inQuotes = true;
                    quoteChar = ch;
                } else if (ch === '(') {
                    openParens++;
                } else if (ch === ')') {
                    if (openParens > 0) {
                        openParens--;
                    }
                }
            }
        }

        // Si quedó una comilla de texto abierta al final, cerrarla
        if (inQuotes && quoteChar) {
            f += quoteChar;
        }

        // Si quedaron paréntesis sin cerrar, anexar los paréntesis de cierre necesarios
        if (openParens > 0) {
            f += ')'.repeat(openParens);
        }

        return f;
    }

    normalizeFormula(formulaStr) {
        if (!formulaStr) return '';
        let f = String(formulaStr).trim();
        if (!f.startsWith('=')) f = '=' + f;

        // Auto-cerrar paréntesis y comillas abiertas automáticamente (estilo Excel / Google Sheets)
        f = this.autoCloseFormula(f);

        // 1. Normalizar comillas tipográficas a comillas estándar
        f = f.replace(/[\u201C\u201D\u00AB\u00BB\u201E]/g, '"')
             .replace(/[\u2018\u2019\u201A]/g, "'");

        // 2. Normalizar operadores matemáticos unicode (≥, ≤, ≠)
        f = f.replace(/\u2265/g, '>=')
             .replace(/\u2264/g, '<=')
             .replace(/\u2260/g, '<>');

        // 3. Reemplazar punto y coma ';' por coma ',' fuera de cadenas de texto con comillas dobles
        let inQuotes = false;
        let cleanChars = '';
        for (let i = 0; i < f.length; i++) {
            const ch = f[i];
            if (ch === '"') inQuotes = !inQuotes;
            if (ch === ';' && !inQuotes) {
                cleanChars += ',';
            } else {
                cleanChars += ch;
            }
        }
        f = cleanChars;

        // 4. Funciones Financieras
        f = f.replace(/TIR\.NO\.PER\(/gi, 'XIRR(')
             .replace(/VNA\.NO\.PER\(/gi, 'XNPV(')
             .replace(/VAN\.NO\.PER\(/gi, 'XNPV(')
             .replace(/VNA\(/gi, 'NPV(')
             .replace(/VAN\(/gi, 'NPV(')
             .replace(/TIR\(/gi, 'IRR(')
             .replace(/TASA\.INT\(/gi, 'INTRATE(')
             .replace(/TASA\(/gi, 'RATE(')
             .replace(/PAGOPRIN\(/gi, 'PPMT(')
             .replace(/PAGOINT\(/gi, 'IPMT(')
             .replace(/PAGO\(/gi, 'PMT(')
             .replace(/NPER\(/gi, 'NPER(')
             .replace(/VF\(/gi, 'FV(')
             .replace(/VA\(/gi, 'PV(')
             .replace(/SLN\(/gi, 'SLN(')
             .replace(/SYD\(/gi, 'SYD(')
             .replace(/DDB\(/gi, 'DDB(')
             .replace(/DB\(/gi, 'DB(')
             .replace(/INT\.PAGO\.DIR\(/gi, 'ISPMT(')
             .replace(/PRECIO\(/gi, 'PRICE(')
             .replace(/RENDTO\(/gi, 'YIELD(');

        // 5. Funciones Tributarias El Salvador
        f = f.replace(/ISSS_LABORAL\(/gi, 'SV_ISSS_LAB(')
             .replace(/ISSS_PATRONAL\(/gi, 'SV_ISSS_PAT(')
             .replace(/AFP_LABORAL\(/gi, 'SV_AFP_LAB(')
             .replace(/AFP_PATRONAL\(/gi, 'SV_AFP_PAT(')
             .replace(/RENTA\(/gi, 'SV_ISR(')
             .replace(/IVA\(/gi, 'SV_IVA(');

        // 6. Funciones de Agregación, Matemáticas y Estadísticas
        f = f.replace(/SUMAR\.SI\.CONJUNTO\(/gi, 'SUMIFS(')
             .replace(/SUMAR\.SI\(/gi, 'SUMIF(')
             .replace(/SUMAPRODUCTO\(/gi, 'SUMPRODUCT(')
             .replace(/SUMA\.CUADRADOS\(/gi, 'SUMSQ(')
             .replace(/SUMA\(/gi, 'SUM(')
             .replace(/PROMEDIO\.SI\.CONJUNTO\(/gi, 'AVERAGEIFS(')
             .replace(/PROMEDIO\.SI\(/gi, 'AVERAGEIF(')
             .replace(/PROMEDIO\.A\(/gi, 'AVERAGEA(')
             .replace(/PROMEDIO\(/gi, 'AVERAGE(')
             .replace(/CONTAR\.SI\.CONJUNTO\(/gi, 'COUNTIFS(')
             .replace(/CONTAR\.SI\(/gi, 'COUNTIF(')
             .replace(/CONTAR\.BLANCO\(/gi, 'COUNTBLANK(')
             .replace(/CONTARA\(/gi, 'COUNTA(')
             .replace(/CONTAR\(/gi, 'COUNT(')
             .replace(/REDONDEAR\.MAS\(/gi, 'ROUNDUP(')
             .replace(/REDONDEAR\.MENOS\(/gi, 'ROUNDDOWN(')
             .replace(/REDOND\.MULT\(/gi, 'MROUND(')
             .replace(/REDONDEAR\(/gi, 'ROUND(')
             .replace(/TRUNCAR\(/gi, 'TRUNC(')
             .replace(/ENTERO\(/gi, 'INT(')
             .replace(/RESIDUO\(/gi, 'MOD(')
             .replace(/SIGNO\(/gi, 'SIGN(')
             .replace(/ABS\(/gi, 'ABS(')
             .replace(/PRODUCTO\(/gi, 'PRODUCT(')
             .replace(/POTENCIA\(/gi, 'POWER(')
             .replace(/RAIZ\(/gi, 'SQRT(')
             .replace(/EXP\(/gi, 'EXP(')
             .replace(/LN\(/gi, 'LN(')
             .replace(/LOG10\(/gi, 'LOG10(')
             .replace(/LOG\(/gi, 'LOG(')
             .replace(/FACT\(/gi, 'FACT(')
             .replace(/ALEATORIO\.ENTRE\(/gi, 'RANDBETWEEN(')
             .replace(/ALEATORIO\(/gi, 'RAND(')
             .replace(/PI\(/gi, 'PI(')
             .replace(/SUBTOTALES\(/gi, 'SUBTOTAL(')
             .replace(/RADIANES\(/gi, 'RADIANS(')
             .replace(/GRADOS\(/gi, 'DEGREES(')
             .replace(/SENO\(/gi, 'SIN(')
             .replace(/COSENO\(/gi, 'COS(')
             .replace(/TANGENTE\(/gi, 'TAN(')
             .replace(/MAX\.A\(/gi, 'MAXA(')
             .replace(/MAX\(/gi, 'MAX(')
             .replace(/MIN\.A\(/gi, 'MINA(')
             .replace(/MIN\(/gi, 'MIN(')
             .replace(/MEDIANA\(/gi, 'MEDIAN(')
             .replace(/MODA\.UNO\(/gi, 'MODE.SNGL(')
             .replace(/MODA\(/gi, 'MODE(')
             .replace(/K\.ESIMO\.MAYOR\(/gi, 'LARGE(')
             .replace(/K\.ESIMO\.MENOR\(/gi, 'SMALL(')
             .replace(/DESVEST\.M\(/gi, 'STDEV.S(')
             .replace(/DESVEST\.P\(/gi, 'STDEV.P(')
             .replace(/DESVEST\(/gi, 'STDEV(')
             .replace(/VAR\.S\(/gi, 'VAR.S(')
             .replace(/VAR\.P\(/gi, 'VAR.P(')
             .replace(/VAR\(/gi, 'VAR(')
             .replace(/COEF\.DE\.CORREL\(/gi, 'CORREL(')
             .replace(/PRONOSTICO\(/gi, 'FORECAST(')
             .replace(/JERARQUIA\(/gi, 'RANK(')
             .replace(/PERCENTIL\(/gi, 'PERCENTILE(')
             .replace(/CUARTIL\(/gi, 'QUARTILE(');

        // 7. Lógicas y Comprobación
        f = f.replace(/SI\.CONJUNTO\(/gi, 'IFS(')
             .replace(/SI\.ERROR\(/gi, 'IFERROR(')
             .replace(/SI\.ND\(/gi, 'IFNA(')
             .replace(/SI\(/gi, 'IF(')
             .replace(/Y\(/gi, 'AND(')
             .replace(/O\(/gi, 'OR(')
             .replace(/XO\(/gi, 'XOR(')
             .replace(/NO\(/gi, 'NOT(')
             .replace(/VERDADERO\(\)/gi, 'TRUE()')
             .replace(/FALSO\(\)/gi, 'FALSE()')
             .replace(/ESBLANCO\(/gi, 'ISBLANK(')
             .replace(/ESNUMERO\(/gi, 'ISNUMBER(')
             .replace(/ESTEXTO\(/gi, 'ISTEXT(')
             .replace(/ESNODESC\(/gi, 'ISNA(')
             .replace(/ESERROR\(/gi, 'ISERROR(')
             .replace(/ESERR\(/gi, 'ISERR(')
             .replace(/ESLOGICO\(/gi, 'ISLOGICAL(')
             .replace(/ESPAR\(/gi, 'ISEVEN(')
             .replace(/ESIMPAR\(/gi, 'ISODD(');

        // 8. Búsqueda y Referencia
        f = f.replace(/BUSCARX\(/gi, 'XLOOKUP(')
             .replace(/BUSCARV\(/gi, 'VLOOKUP(')
             .replace(/BUSCARH\(/gi, 'HLOOKUP(')
             .replace(/COINCIDIRX\(/gi, 'XMATCH(')
             .replace(/COINCIDIR\(/gi, 'MATCH(')
             .replace(/INDICE\(/gi, 'INDEX(')
             .replace(/ELEGIR\(/gi, 'CHOOSE(')
             .replace(/DESREF\(/gi, 'OFFSET(')
             .replace(/DIRECCION\(/gi, 'ADDRESS(')
             .replace(/COLUMNAS\(/gi, 'COLUMNS(')
             .replace(/COLUMNA\(/gi, 'COLUMN(')
             .replace(/FILAS\(/gi, 'ROWS(')
             .replace(/FILA\(/gi, 'ROW(')
             .replace(/TRANSPONER\(/gi, 'TRANSPOSE(')
             .replace(/FORMULATEXTO\(/gi, 'FORMULATEXT(');

        // 9. Fechas y Textos
        f = f.replace(/UNIRCADENAS\(/gi, 'TEXTJOIN(')
             .replace(/CONCATENAR\(/gi, 'CONCATENATE(')
             .replace(/CONCAT\(/gi, 'CONCAT(')
             .replace(/TEXTO\(/gi, 'TEXT(')
             .replace(/VALOR\(/gi, 'VALUE(')
             .replace(/MAYUSC\(/gi, 'UPPER(')
             .replace(/MINUSC\(/gi, 'LOWER(')
             .replace(/NOMPROPIO\(/gi, 'PROPER(')
             .replace(/IZQUIERDA\(/gi, 'LEFT(')
             .replace(/DERECHA\(/gi, 'RIGHT(')
             .replace(/EXTRAE\(/gi, 'MID(')
             .replace(/LARGO\(/gi, 'LEN(')
             .replace(/ESPACIOS\(/gi, 'TRIM(')
             .replace(/LIMPIAR\(/gi, 'CLEAN(')
             .replace(/REEMPLAZAR\(/gi, 'REPLACE(')
             .replace(/SUSTITUIR\(/gi, 'SUBSTITUTE(')
             .replace(/HALLAR\(/gi, 'SEARCH(')
             .replace(/ENCONTRAR\(/gi, 'FIND(')
             .replace(/REPETIR\(/gi, 'REPT(')
             .replace(/IGUAL\(/gi, 'EXACT(')
             .replace(/HOY\(/gi, 'TODAY(')
             .replace(/AHORA\(/gi, 'NOW(')
             .replace(/FECHA\.MES\(/gi, 'EDATE(')
             .replace(/FIN\.MES\(/gi, 'EOMONTH(')
             .replace(/FECHA\(/gi, 'DATE(')
             .replace(/HORA\(/gi, 'TIME(')
             .replace(/AÑO\(/gi, 'YEAR(')
             .replace(/MES\(/gi, 'MONTH(')
             .replace(/DIA\.LAB\(/gi, 'WORKDAY(')
             .replace(/DIAS\.LAB\(/gi, 'NETWORKDAYS(')
             .replace(/DIASEM\(/gi, 'WEEKDAY(')
             .replace(/NUM\.DE\.SEMANA\(/gi, 'WEEKNUM(')
             .replace(/FRAC\.AÑO\(/gi, 'YEARFRAC(')
             .replace(/SIFECHA\(/gi, 'DATEDIF(')
             .replace(/DIAS\(/gi, 'DAYS(')
             .replace(/DIA\(/gi, 'DAY(');

        return f;
    }

    denormalizeFormula(formulaStr) {
        if (!formulaStr) return '';
        let f = String(formulaStr).trim();
        if (!f.startsWith('=')) f = '=' + f;

        // Auto-cerrar paréntesis y comillas abiertas automáticamente
        f = this.autoCloseFormula(f);

        f = f.replace(/XIRR\(/gi, 'TIR.NO.PER(')
             .replace(/XNPV\(/gi, 'VNA.NO.PER(')
             .replace(/NPV\(/gi, 'VAN(')
             .replace(/IRR\(/gi, 'TIR(')
             .replace(/INTRATE\(/gi, 'TASA.INT(')
             .replace(/RATE\(/gi, 'TASA(')
             .replace(/PPMT\(/gi, 'PAGOPRIN(')
             .replace(/IPMT\(/gi, 'PAGOINT(')
             .replace(/PMT\(/gi, 'PAGO(')
             .replace(/FV\(/gi, 'VF(')
             .replace(/PV\(/gi, 'VA(')
             .replace(/PRICE\(/gi, 'PRECIO(')
             .replace(/YIELD\(/gi, 'RENDTO(')
             .replace(/SV_ISSS_LAB\(/gi, 'ISSS_LABORAL(')
             .replace(/SV_ISSS_PAT\(/gi, 'ISSS_PATRONAL(')
             .replace(/SV_AFP_LAB\(/gi, 'AFP_LABORAL(')
             .replace(/SV_AFP_PAT\(/gi, 'AFP_PATRONAL(')
             .replace(/SV_ISR\(/gi, 'RENTA(')
             .replace(/SV_IVA\(/gi, 'IVA(')
             .replace(/SUMIFS\(/gi, 'SUMAR.SI.CONJUNTO(')
             .replace(/SUMIF\(/gi, 'SUMAR.SI(')
             .replace(/SUMPRODUCT\(/gi, 'SUMAPRODUCTO(')
             .replace(/SUMSQ\(/gi, 'SUMA.CUADRADOS(')
             .replace(/SUM\(/gi, 'SUMA(')
             .replace(/AVERAGEIFS\(/gi, 'PROMEDIO.SI.CONJUNTO(')
             .replace(/AVERAGEIF\(/gi, 'PROMEDIO.SI(')
             .replace(/AVERAGEA\(/gi, 'PROMEDIO.A(')
             .replace(/AVERAGE\(/gi, 'PROMEDIO(')
             .replace(/COUNTIFS\(/gi, 'CONTAR.SI.CONJUNTO(')
             .replace(/COUNTIF\(/gi, 'CONTAR.SI(')
             .replace(/COUNTBLANK\(/gi, 'CONTAR.BLANCO(')
             .replace(/COUNTA\(/gi, 'CONTARA(')
             .replace(/COUNT\(/gi, 'CONTAR(')
             .replace(/ROUNDUP\(/gi, 'REDONDEAR.MAS(')
             .replace(/ROUNDDOWN\(/gi, 'REDONDEAR.MENOS(')
             .replace(/MROUND\(/gi, 'REDOND.MULT(')
             .replace(/ROUND\(/gi, 'REDONDEAR(')
             .replace(/TRUNC\(/gi, 'TRUNCAR(')
             .replace(/INT\(/gi, 'ENTERO(')
             .replace(/MOD\(/gi, 'RESIDUO(')
             .replace(/SIGN\(/gi, 'SIGNO(')
             .replace(/PRODUCT\(/gi, 'PRODUCTO(')
             .replace(/POWER\(/gi, 'POTENCIA(')
             .replace(/SQRT\(/gi, 'RAIZ(')
             .replace(/RANDBETWEEN\(/gi, 'ALEATORIO.ENTRE(')
             .replace(/RAND\(/gi, 'ALEATORIO(')
             .replace(/SUBTOTAL\(/gi, 'SUBTOTALES(')
             .replace(/RADIANS\(/gi, 'RADIANES(')
             .replace(/DEGREES\(/gi, 'GRADOS(')
             .replace(/SIN\(/gi, 'SENO(')
             .replace(/COS\(/gi, 'COSENO(')
             .replace(/TAN\(/gi, 'TANGENTE(')
             .replace(/MAXA\(/gi, 'MAX.A(')
             .replace(/MAX\(/gi, 'MAX(')
             .replace(/MINA\(/gi, 'MIN.A(')
             .replace(/MIN\(/gi, 'MIN(')
             .replace(/MEDIAN\(/gi, 'MEDIANA(')
             .replace(/MODE\.SNGL\(/gi, 'MODA.UNO(')
             .replace(/MODE\(/gi, 'MODA(')
             .replace(/LARGE\(/gi, 'K.ESIMO.MAYOR(')
             .replace(/SMALL\(/gi, 'K.ESIMO.MENOR(')
             .replace(/STDEV\.S\(/gi, 'DESVEST.M(')
             .replace(/STDEV\.P\(/gi, 'DESVEST.P(')
             .replace(/STDEV\(/gi, 'DESVEST(')
             .replace(/VAR\.S\(/gi, 'VAR.S(')
             .replace(/VAR\.P\(/gi, 'VAR.P(')
             .replace(/VAR\(/gi, 'VAR(')
             .replace(/CORREL\(/gi, 'COEF.DE.CORREL(')
             .replace(/FORECAST\(/gi, 'PRONOSTICO(')
             .replace(/RANK\(/gi, 'JERARQUIA(')
             .replace(/PERCENTILE\(/gi, 'PERCENTIL(')
             .replace(/QUARTILE\(/gi, 'CUARTIL(')
             .replace(/IFS\(/gi, 'SI.CONJUNTO(')
             .replace(/IFERROR\(/gi, 'SI.ERROR(')
             .replace(/IFNA\(/gi, 'SI.ND(')
             .replace(/IF\(/gi, 'SI(')
             .replace(/AND\(/gi, 'Y(')
             .replace(/OR\(/gi, 'O(')
             .replace(/XOR\(/gi, 'XO(')
             .replace(/NOT\(/gi, 'NO(')
             .replace(/TRUE\(\)/gi, 'VERDADERO()')
             .replace(/FALSE\(\)/gi, 'FALSO()')
             .replace(/ISBLANK\(/gi, 'ESBLANCO(')
             .replace(/ISNUMBER\(/gi, 'ESNUMERO(')
             .replace(/ISTEXT\(/gi, 'ESTEXTO(')
             .replace(/ISNA\(/gi, 'ESNODESC(')
             .replace(/ISERROR\(/gi, 'ESERROR(')
             .replace(/ISERR\(/gi, 'ESERR(')
             .replace(/ISLOGICAL\(/gi, 'ESLOGICO(')
             .replace(/ISEVEN\(/gi, 'ESPAR(')
             .replace(/ISODD\(/gi, 'ESIMPAR(')
             .replace(/XLOOKUP\(/gi, 'BUSCARX(')
             .replace(/VLOOKUP\(/gi, 'BUSCARV(')
             .replace(/HLOOKUP\(/gi, 'BUSCARH(')
             .replace(/XMATCH\(/gi, 'COINCIDIRX(')
             .replace(/MATCH\(/gi, 'COINCIDIR(')
             .replace(/INDEX\(/gi, 'INDICE(')
             .replace(/CHOOSE\(/gi, 'ELEGIR(')
             .replace(/OFFSET\(/gi, 'DESREF(')
             .replace(/ADDRESS\(/gi, 'DIRECCION(')
             .replace(/COLUMNS\(/gi, 'COLUMNAS(')
             .replace(/COLUMN\(/gi, 'COLUMNA(')
             .replace(/ROWS\(/gi, 'FILAS(')
             .replace(/ROW\(/gi, 'FILA(')
             .replace(/TRANSPOSE\(/gi, 'TRANSPONER(')
             .replace(/FORMULATEXT\(/gi, 'FORMULATEXTO(')
             .replace(/TEXTJOIN\(/gi, 'UNIRCADENAS(')
             .replace(/CONCATENATE\(/gi, 'CONCATENAR(')
             .replace(/CONCAT\(/gi, 'CONCAT(')
             .replace(/TEXT\(/gi, 'TEXTO(')
             .replace(/VALUE\(/gi, 'VALOR(')
             .replace(/UPPER\(/gi, 'MAYUSC(')
             .replace(/LOWER\(/gi, 'MINUSC(')
             .replace(/PROPER\(/gi, 'NOMPROPIO(')
             .replace(/LEFT\(/gi, 'IZQUIERDA(')
             .replace(/RIGHT\(/gi, 'DERECHA(')
             .replace(/MID\(/gi, 'EXTRAE(')
             .replace(/LEN\(/gi, 'LARGO(')
             .replace(/TRIM\(/gi, 'ESPACIOS(')
             .replace(/CLEAN\(/gi, 'LIMPIAR(')
             .replace(/REPLACE\(/gi, 'REEMPLAZAR(')
             .replace(/SUBSTITUTE\(/gi, 'SUSTITUIR(')
             .replace(/SEARCH\(/gi, 'HALLAR(')
             .replace(/FIND\(/gi, 'ENCONTRAR(')
             .replace(/REPT\(/gi, 'REPETIR(')
             .replace(/EXACT\(/gi, 'IGUAL(')
             .replace(/TODAY\(/gi, 'HOY(')
             .replace(/NOW\(/gi, 'AHORA(')
             .replace(/EDATE\(/gi, 'FECHA.MES(')
             .replace(/EOMONTH\(/gi, 'FIN.MES(')
             .replace(/DATE\(/gi, 'FECHA(')
             .replace(/TIME\(/gi, 'HORA(')
             .replace(/YEAR\(/gi, 'AÑO(')
             .replace(/MONTH\(/gi, 'MES(')
             .replace(/WORKDAY\(/gi, 'DIA.LAB(')
             .replace(/NETWORKDAYS\(/gi, 'DIAS.LAB(')
             .replace(/WEEKDAY\(/gi, 'DIASEM(')
             .replace(/WEEKNUM\(/gi, 'NUM.DE.SEMANA(')
             .replace(/YEARFRAC\(/gi, 'FRAC.AÑO(')
             .replace(/DATEDIF\(/gi, 'SIFECHA(')
             .replace(/DAYS\(/gi, 'DIAS(')
             .replace(/DAY\(/gi, 'DIA(');

        return f;
    }

    getColName(colIndex) {
        let name = '';
        let i = colIndex;
        while (i >= 0) {
            name = String.fromCharCode((i % 26) + 65) + name;
            i = Math.floor(i / 26) - 1;
        }
        return name;
    }

    parseCellRef(ref) {
        if (!ref) return null;
        const cleanRef = String(ref).toUpperCase().replace(/\$/g, '').trim();
        const match = cleanRef.match(/^([A-Z]+)(\d+)$/);
        if (!match) return null;
        const colStr = match[1];
        const row = parseInt(match[2], 10) - 1;
        let col = 0;
        for (let i = 0; i < colStr.length; i++) {
            col = col * 26 + (colStr.charCodeAt(i) - 64);
        }
        col -= 1;
        return { row, col };
    }

    colNameToIndex(colStr) {
        if (!colStr) return -1;
        const clean = String(colStr).toUpperCase().replace(/[^A-Z]/g, '');
        if (!clean) return -1;
        let col = 0;
        for (let i = 0; i < clean.length; i++) {
            col = col * 26 + (clean.charCodeAt(i) - 64);
        }
        return col - 1;
    }

    // === AJUSTE RELATIVO DE REFERENCIAS DE FÓRMULAS AL EXPANDIR / AUTORRELLENAR ===
    adjustFormulaReferences(formulaStr, deltaRows, deltaCols) {
        if (!formulaStr || !formulaStr.startsWith('=')) return formulaStr;
        if (deltaRows === 0 && deltaCols === 0) return formulaStr;

        // Preservar literales de texto entre comillas
        const quoteSegments = [];
        let cleanF = '';
        let inQuotes = false;
        let quoteChar = '';
        let currSegment = '';

        for (let i = 0; i < formulaStr.length; i++) {
            const ch = formulaStr[i];
            if (inQuotes) {
                currSegment += ch;
                if (ch === quoteChar) {
                    if (i + 1 < formulaStr.length && formulaStr[i + 1] === quoteChar) {
                        currSegment += formulaStr[++i];
                    } else {
                        inQuotes = false;
                        const placeholder = `__STR_LITERAL_${quoteSegments.length}__`;
                        quoteSegments.push(currSegment);
                        cleanF += placeholder;
                        currSegment = '';
                    }
                }
            } else {
                if (ch === '"' || ch === "'") {
                    inQuotes = true;
                    quoteChar = ch;
                    currSegment = ch;
                } else {
                    cleanF += ch;
                }
            }
        }
        if (inQuotes) {
            const placeholder = `__STR_LITERAL_${quoteSegments.length}__`;
            quoteSegments.push(currSegment);
            cleanF += placeholder;
        }

        // Reconocer referencias de celda: [Sheet!]?($?)([A-Za-z]+)($?)(\d+)(?!\()
        const cellRefRegex = /((?:'[^']+'|[A-Za-z0-9_]+)!)?(\$?)([A-Za-z]+)(\$?)(\d+)(?!\()/g;

        const adjustedCleanF = cleanF.replace(cellRefRegex, (match, sheetPrefix, colDollar, colLetters, rowDollar, rowDigits, offset, fullStr) => {
            // Si está precedido por letra o dígito (parte de una variable/identificador mayor), no modificar
            if (offset > 0 && /[A-Za-z0-9_]/.test(fullStr[offset - 1])) {
                return match;
            }

            const colIndex = this.colNameToIndex(colLetters.toUpperCase());
            if (colIndex < 0 || colIndex >= 1000) {
                return match; // No es columna válida
            }

            let newColLetters = colLetters;
            if (!colDollar) {
                const newColIndex = Math.max(0, Math.min(this.options.colCount - 1, colIndex + deltaCols));
                newColLetters = this.getColName(newColIndex);
                if (colLetters === colLetters.toLowerCase()) newColLetters = newColLetters.toLowerCase();
            }

            let newRowDigits = rowDigits;
            if (!rowDollar) {
                const rowIndex = parseInt(rowDigits, 10) - 1;
                const newRowIndex = Math.max(0, Math.min(this.options.rowCount - 1, rowIndex + deltaRows));
                newRowDigits = String(newRowIndex + 1);
            }

            return (sheetPrefix || '') + (colDollar || '') + newColLetters + (rowDollar || '') + newRowDigits;
        });

        // Restaurar literales de texto
        let finalF = adjustedCleanF;
        for (let i = 0; i < quoteSegments.length; i++) {
            finalF = finalF.replace(`__STR_LITERAL_${i}__`, quoteSegments[i]);
        }

        return finalF;
    }

    initDOM() {
        this.container.innerHTML = `
            <div class="educonta-spreadsheet-root w-full h-full flex flex-col relative select-none bg-white dark:bg-[#05070e] text-slate-800 dark:text-slate-100 font-sans overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 shadow-2xl">
                <!-- VISTA DE CUADRÍCULA DE CELDAS SÓLIDA MIDNIGHT NAVY -->
                <div class="educonta-grid-wrapper flex-1 overflow-auto relative custom-scrollbar bg-white dark:bg-[#05070e]">
                    <table id="educonta-grid-table" class="border-collapse table-fixed w-max min-w-full text-xs bg-white dark:bg-[#05070e]">
                        <thead id="educonta-grid-thead"></thead>
                        <tbody id="educonta-grid-tbody"></tbody>
                    </table>
                </div>

                <!-- MENÚ FLOTANTE DE AUTOCOMPLETADO DE FÓRMULAS -->
                <div id="educonta-formula-autocomplete" class="hidden absolute z-50 w-80 max-h-64 bg-white dark:bg-[#070c18] border border-amber-500/40 rounded-2xl shadow-2xl text-slate-800 dark:text-slate-200 overflow-hidden font-sans text-xs flex flex-col">
                    <div class="px-3 py-1.5 bg-slate-100 dark:bg-[#05060a] border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold flex items-center justify-between shrink-0">
                        <span><i class="fas fa-square-root-variable mr-1 text-amber-500"></i> Fórmulas Disponibles</span>
                        <span class="text-slate-400 dark:text-slate-500 text-[9px] font-normal">↑↓ Elegir • Tab/Enter Usar</span>
                    </div>
                    <div id="educonta-autocomplete-list" class="overflow-y-auto custom-scrollbar flex-1 py-1 divide-y divide-slate-200/60 dark:divide-slate-800/80">
                        <!-- Lista inyectada dinámicamente -->
                    </div>
                </div>

                <!-- MENÚ CONTEXTUAL DE CELDAS (CLIC DERECHO EN CELDAS) -->
                <div id="educonta-context-menu" class="hidden fixed z-50 py-1.5 w-48 bg-white dark:bg-[#070c18] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl text-slate-800 dark:text-slate-200 text-xs">
                    <button onclick="spreadsheetEngine && spreadsheetEngine.copySelection(true)" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2">
                        <i class="fas fa-scissors w-4 text-amber-500"></i> Cortar <span class="ml-auto text-[10px] text-slate-400 dark:text-slate-500">Ctrl+X</span>
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.copySelection(false)" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2">
                        <i class="fas fa-copy w-4 text-amber-500"></i> Copiar <span class="ml-auto text-[10px] text-slate-400 dark:text-slate-500">Ctrl+C</span>
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.pasteSelection()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-1 pb-2">
                        <i class="fas fa-paste w-4 text-amber-500"></i> Pegar <span class="ml-auto text-[10px] text-slate-400 dark:text-slate-500">Ctrl+V</span>
                    </button>
                    <button onclick="toolInsertRow()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2">
                        <i class="fas fa-plus w-4 text-emerald-500"></i> Insertar Fila
                    </button>
                    <button onclick="toolInsertCol()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2">
                        <i class="fas fa-plus w-4 text-emerald-500"></i> Insertar Columna
                    </button>
                    <button onclick="toolDeleteRow()" class="w-full px-3 py-1.5 text-left hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-2">
                        <i class="fas fa-trash w-4 text-rose-500"></i> Eliminar Fila
                    </button>
                    <button onclick="toolDeleteCol()" class="w-full px-3 py-1.5 text-left hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-1 pb-2">
                        <i class="fas fa-trash w-4 text-rose-500"></i> Eliminar Columna
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.clearSelectedCells()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1">
                        <i class="fas fa-eraser w-4 text-slate-400"></i> Limpiar Contenido
                    </button>
                    <button onclick="typeof window.openCellFormatModal === 'function' && window.openCellFormatModal(); spreadsheetEngine && spreadsheetEngine.hideAllMenus()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
                        <i class="fas fa-wand-magic-sparkles w-4 text-amber-500"></i> Formato de Celdas... <span class="ml-auto text-[10px] text-slate-400 dark:text-slate-500 font-normal">Ctrl+1</span>
                    </button>
                </div>

                <!-- MENÚ CONTEXTUAL PARA CABECERAS DE COLUMNAS -->
                <div id="educonta-col-header-menu" class="hidden fixed z-50 py-1.5 w-64 bg-white dark:bg-[#070c18] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl text-slate-800 dark:text-slate-200 text-xs max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div class="px-3 py-1.5 text-[10px] uppercase font-black text-amber-500 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#070c18]/95 backdrop-blur-sm z-10">
                        <span id="col-menu-title">Columna A</span>
                        <i class="fas fa-columns"></i>
                    </div>

                    <!-- Operaciones de Columna -->
                    <button onclick="spreadsheetEngine && spreadsheetEngine.selectFullCol()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2">
                        <i class="fas fa-object-group w-4 text-amber-500"></i> Seleccionar Columna
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.autofitActiveColWidth()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2">
                        <i class="fas fa-arrows-left-right-to-line w-4 text-emerald-400"></i> Autoajustar al Contenido
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.promptActiveColWidth()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1">
                        <i class="fas fa-arrows-left-right w-4 text-sky-400"></i> Especificar Ancho Exacto...
                    </button>

                    <!-- Sección Formato de Datos de Columna -->
                    <div class="px-3 py-1 text-[9px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5">
                        <span>Formato de Columna</span>
                        <i class="fas fa-wand-magic-sparkles text-amber-500 text-[10px]"></i>
                    </div>
                    <button data-col-fmt="general" onclick="spreadsheetEngine && spreadsheetEngine.setColFormatQuick('general')" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center justify-between transition-colors">
                        <span class="flex items-center gap-2"><i class="fas fa-font w-4 text-slate-400"></i> General / Texto</span>
                        <span class="text-[9px] tabular-nums text-slate-400">Auto</span>
                    </button>
                    <button data-col-fmt="usd" onclick="spreadsheetEngine && spreadsheetEngine.setColFormatQuick('usd')" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center justify-between transition-colors">
                        <span class="flex items-center gap-2"><i class="fas fa-dollar-sign w-4 text-emerald-500 font-black"></i> Moneda ($ USD)</span>
                        <span class="text-[9px] tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">$1,250.00</span>
                    </button>
                    <button data-col-fmt="number" onclick="spreadsheetEngine && spreadsheetEngine.setColFormatQuick('number')" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center justify-between transition-colors">
                        <span class="flex items-center gap-2"><i class="fas fa-hashtag w-4 text-slate-400"></i> Número Decimal</span>
                        <span class="text-[9px] tabular-nums text-slate-400">1,250.00</span>
                    </button>
                    <button data-col-fmt="percent" onclick="spreadsheetEngine && spreadsheetEngine.setColFormatQuick('percent')" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center justify-between transition-colors">
                        <span class="flex items-center gap-2"><i class="fas fa-percent w-4 text-sky-400"></i> Porcentaje</span>
                        <span class="text-[9px] tabular-nums text-sky-500 font-bold">13.00%</span>
                    </button>
                    <button data-col-fmt="date_dmy" onclick="spreadsheetEngine && spreadsheetEngine.setColFormatQuick('date_dmy')" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center justify-between transition-colors">
                        <span class="flex items-center gap-2"><i class="fas fa-calendar-day w-4 text-amber-500"></i> Fecha Corta</span>
                        <span class="text-[9px] tabular-nums text-slate-400">15/08/2026</span>
                    </button>
                    <button data-col-fmt="date_long" onclick="spreadsheetEngine && spreadsheetEngine.setColFormatQuick('date_long')" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center justify-between transition-colors">
                        <span class="flex items-center gap-2"><i class="fas fa-calendar-week w-4 text-amber-500"></i> Fecha Larga</span>
                        <span class="text-[9px] tabular-nums text-slate-400">15 de ago...</span>
                    </button>
                    <button data-col-fmt="nit" onclick="spreadsheetEngine && spreadsheetEngine.setColFormatQuick('nit')" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center justify-between transition-colors">
                        <span class="flex items-center gap-2"><i class="fas fa-id-card w-4 text-indigo-400"></i> NIT / DUI SV</span>
                        <span class="text-[9px] tabular-nums text-slate-400">0614-...</span>
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.openColFormatAdvanced()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400 border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1">
                        <i class="fas fa-sliders w-4 text-amber-500"></i> Más Formatos de Columna...
                    </button>

                    <!-- Acciones Estructurales -->
                    <button onclick="spreadsheetEngine && spreadsheetEngine.hideActiveCol()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2">
                        <i class="fas fa-eye-slash w-4 text-slate-400"></i> Ocultar Columna
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.unhideAllCols()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1">
                        <i class="fas fa-eye w-4 text-slate-400"></i> Mostrar Todas las Columnas
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.moveActiveColLeft()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2">
                        <i class="fas fa-arrow-left w-4 text-indigo-400"></i> Mover a la Izquierda
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.moveActiveColRight()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1">
                        <i class="fas fa-arrow-right w-4 text-indigo-400"></i> Mover a la Derecha
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.insertColLeft()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2">
                        <i class="fas fa-plus-circle w-4 text-emerald-400"></i> Insertar Columna Izquierda
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.insertColRight()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1">
                        <i class="fas fa-plus-circle w-4 text-emerald-400"></i> Insertar Columna Derecha
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.clearActiveCol()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1">
                        <i class="fas fa-eraser w-4 text-slate-400"></i> Limpiar Columna
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.deleteActiveCol()" class="w-full px-3 py-1.5 text-left hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-2">
                        <i class="fas fa-trash-can w-4 text-rose-500"></i> Eliminar Columna
                    </button>
                </div>

                <!-- MENÚ CONTEXTUAL PARA CABECERAS DE FILAS -->
                <div id="educonta-row-header-menu" class="hidden fixed z-50 py-1.5 w-60 bg-white dark:bg-[#070c18] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl text-slate-800 dark:text-slate-200 text-xs">
                    <div class="px-3 py-1 text-[10px] uppercase font-bold text-amber-500 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span id="row-menu-title">Fila 1</span>
                        <i class="fas fa-list-ol"></i>
                    </div>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.selectFullRow()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2">
                        <i class="fas fa-object-group w-4 text-amber-500"></i> Seleccionar Fila
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.autofitActiveRowHeight()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2">
                        <i class="fas fa-arrows-up-down-left-right w-4 text-emerald-400"></i> Autoajustar al Contenido
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.promptActiveRowHeight()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1">
                        <i class="fas fa-arrows-up-down w-4 text-sky-400"></i> Especificar Alto Exacto...
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.hideActiveRow()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2">
                        <i class="fas fa-eye-slash w-4 text-slate-400"></i> Ocultar Fila
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.unhideAllRows()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1">
                        <i class="fas fa-eye w-4 text-slate-400"></i> Mostrar Todas las Filas
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.moveActiveRowUp()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2">
                        <i class="fas fa-arrow-up w-4 text-indigo-400"></i> Mover Fila Arriba
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.moveActiveRowDown()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1">
                        <i class="fas fa-arrow-down w-4 text-indigo-400"></i> Mover Fila Abajo
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.insertRowAbove()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2">
                        <i class="fas fa-plus-circle w-4 text-emerald-400"></i> Insertar Fila Arriba
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.insertRowBelow()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1">
                        <i class="fas fa-plus-circle w-4 text-emerald-400"></i> Insertar Fila Abajo
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.clearActiveRow()" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1">
                        <i class="fas fa-eraser w-4 text-slate-400"></i> Limpiar Fila
                    </button>
                    <button onclick="spreadsheetEngine && spreadsheetEngine.deleteActiveRow()" class="w-full px-3 py-1.5 text-left hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-2">
                        <i class="fas fa-trash-can w-4 text-rose-500"></i> Eliminar Fila
                    </button>
                </div>

                <!-- MENÚ CONTEXTUAL PARA VIÑETAS / PESTAÑAS DE HOJAS (ESTILO EXCEL / GOOGLE SHEETS) -->
                <div id="educonta-sheet-tab-menu" class="hidden fixed z-[99999] py-1.5 w-60 bg-white/95 dark:bg-[#0c1526]/95 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl backdrop-blur-2xl text-slate-800 dark:text-slate-200 text-xs select-none">
                    <div class="px-3 py-1 text-[10px] uppercase font-black text-amber-500 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span id="sheet-tab-menu-title" class="truncate max-w-[170px]">Hoja 1</span>
                        <i class="fas fa-table-cells"></i>
                    </div>
                    
                    <!-- 1. Renombrar Hoja -->
                    <button type="button" onclick="if(typeof openSheetRenameModal==='function') openSheetRenameModal(spreadsheetEngine.activeMenuSheetIndex); else spreadsheetEngine && spreadsheetEngine.promptRenameActiveTab();" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-2 transition-colors">
                        <i class="fas fa-pen w-4 text-amber-500"></i>
                        <span>Renombrar Hoja</span>
                    </button>

                    <!-- 2. Duplicar Hoja -->
                    <button type="button" onclick="if(typeof openSheetDuplicateModal==='function') openSheetDuplicateModal(spreadsheetEngine.activeMenuSheetIndex); else spreadsheetEngine && spreadsheetEngine.duplicateActiveTab();" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-2 transition-colors">
                        <i class="fas fa-copy w-4 text-emerald-500"></i>
                        <span>Duplicar Hoja</span>
                    </button>

                    <div class="border-t border-slate-200/80 dark:border-slate-800/80 my-1"></div>

                    <!-- 3. Color de Viñeta / Pestaña -->
                    <div class="px-3 py-1">
                        <div class="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                            <span class="flex items-center gap-1.5"><i class="fas fa-palette text-amber-500"></i> Color de Viñeta</span>
                            <div class="flex items-center gap-1.5">
                                <button type="button" onclick="if(typeof openSheetColorModal==='function') openSheetColorModal(spreadsheetEngine.activeMenuSheetIndex);" class="text-[9px] text-amber-500 hover:underline cursor-pointer">Más...</button>
                                <span class="text-slate-300 dark:text-slate-700">|</span>
                                <button type="button" onclick="spreadsheetEngine && spreadsheetEngine.setSheetTabColor(spreadsheetEngine.activeMenuSheetIndex, null)" class="text-[9px] text-slate-400 hover:text-rose-500 underline cursor-pointer">Quitar</button>
                            </div>
                        </div>
                        <div class="grid grid-cols-8 gap-1" id="sheet-tab-color-palette">
                            <!-- Inyectado dinámicamente -->
                        </div>
                    </div>

                    <div class="border-t border-slate-200/80 dark:border-slate-800/80 my-1"></div>

                    <!-- 4. Mover / Organizar Hojas -->
                    <button type="button" onclick="if(typeof openSheetReorderModal==='function') openSheetReorderModal();" class="w-full px-3 py-1.5 text-left hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-2 transition-colors">
                        <i class="fas fa-layer-group w-4 text-sky-500"></i>
                        <span>Organizar Hojas...</span>
                    </button>
                    <div class="flex items-center gap-1 px-2 pt-0.5">
                        <button type="button" id="btn-move-sheet-left" onclick="spreadsheetEngine && spreadsheetEngine.moveActiveTabLeft()" class="flex-1 py-1 px-2 text-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/20 hover:text-amber-500 text-[10px] font-bold text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center gap-1">
                            <i class="fas fa-arrow-left text-[9px]"></i> Izquierda
                        </button>
                        <button type="button" id="btn-move-sheet-right" onclick="spreadsheetEngine && spreadsheetEngine.moveActiveTabRight()" class="flex-1 py-1 px-2 text-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/20 hover:text-amber-500 text-[10px] font-bold text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center gap-1">
                            Derecha <i class="fas fa-arrow-right text-[9px]"></i>
                        </button>
                    </div>

                    <div class="border-t border-slate-200/80 dark:border-slate-800/80 my-1"></div>

                    <!-- 5. Eliminar Hoja -->
                    <button type="button" id="btn-delete-sheet-tab" onclick="if(typeof openSheetDeleteModal==='function') openSheetDeleteModal(spreadsheetEngine.activeMenuSheetIndex); else spreadsheetEngine && spreadsheetEngine.deleteActiveTab();" class="w-full px-3 py-1.5 text-left hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center gap-2 transition-colors">
                        <i class="fas fa-trash-can w-4 text-rose-500"></i>
                        <span>Eliminar Hoja</span>
                    </button>
                </div>

                <!-- MODAL GLASSMORPHIC PROMPT DE TAMAÑO EXACTO (ANCHO / ALTO) -->
                <div id="modal-size-prompt" class="educonta-modal-overlay">
                    <div class="educonta-modal-content max-w-sm w-full p-6 flex flex-col gap-4 relative" style="border-radius: 36px !important; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 45px -5px rgba(245, 158, 11, 0.22) !important;">
                        <div class="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                            <h3 id="size-prompt-title" class="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2.5">
                                <div class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold text-xs border border-amber-500/20 shadow-inner">
                                    <i class="fas fa-ruler-combined"></i>
                                </div>
                                <span id="size-prompt-label">Especificar Ancho de Columna</span>
                            </h3>
                            <button onclick="spreadsheetEngine && spreadsheetEngine.closeSizePromptModal()" class="w-8 h-8 rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-rose-500/15 hover:text-rose-500 text-slate-400 flex items-center justify-center transition-all shadow-sm">
                                <i class="fas fa-times text-sm font-bold"></i>
                            </button>
                        </div>
                        
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-bold text-slate-600 dark:text-slate-300" id="size-input-label">Ingrese la dimensión en píxeles (px):</label>
                            <div class="relative flex items-center">
                                <input id="size-prompt-input" type="number" min="20" max="1000" class="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-slate-800 dark:text-slate-100 text-sm tabular-nums font-bold focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="100" />
                                <span class="absolute right-3.5 text-xs tabular-nums text-slate-400">px</span>
                            </div>
                        </div>

                        <!-- Botones de Tamaño Predeterminado (Presets) -->
                        <div class="flex flex-col gap-1.5">
                            <span class="text-[10px] text-slate-400 uppercase font-black tracking-wider pl-1">Ajustes Rápidos</span>
                            <div id="size-presets-container" class="flex flex-wrap gap-1.5">
                                <!-- Inyectado por JS -->
                            </div>
                        </div>

                        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                            <button onclick="spreadsheetEngine && spreadsheetEngine.closeSizePromptModal()" class="px-4 py-2.5 rounded-[36px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase hover:bg-slate-200 transition-all shadow-sm">
                                Cancelar
                            </button>
                            <button onclick="spreadsheetEngine && spreadsheetEngine.confirmSizePromptModal()" class="glow-hover btn-bloom-orange px-5 py-2.5 rounded-[36px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs uppercase shadow-lg shadow-amber-500/30 transition-all active:scale-95">
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- BARRA DE DESPLAZAMIENTO FLOTANTE VERTICAL GLASSMORPHIC (EJE Y) -->
                <!-- BARRA DE DESPLAZAMIENTO FLOTANTE VERTICAL GLASSMORPHIC (EJE Y) -->
                <div id="educonta-scroll-track-y" class="educonta-magnetic-scroll-track educonta-magnetic-track-y">
                    <div id="educonta-scroll-thumb-y" class="educonta-magnetic-scroll-thumb educonta-magnetic-thumb-y"></div>
                </div>

                <!-- BARRA DE PESTAÑAS Y DESPLAZAMIENTO HORIZONTAL INTEGRADO (ESTILO EXCEL) -->
                <div class="educonta-bottom-bar flex items-center justify-between gap-3 px-3 py-1 bg-slate-100 dark:bg-[#03050a] border-t border-slate-200 dark:border-white/5 shrink-0 z-20 h-10 select-none">
                    <!-- SECCIÓN IZQUIERDA: BOTÓN AÑADIR, LISTA DE HOJAS CON LÍMITE Y FLECHAS AL LADO -->
                    <div class="flex items-center gap-1.5 min-w-0 max-w-[55%] md:max-w-[60%] shrink-0">
                        <!-- Botón Añadir Hoja -->
                        <button id="btn-add-sheet" class="w-6 h-6 rounded-lg bg-white dark:bg-[#05070e] hover:bg-amber-500/20 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center text-xs border border-slate-200 dark:border-white/10 active:scale-95 shadow-sm shrink-0 transition-colors cursor-pointer" title="Añadir Nueva Hoja">
                            <i class="fas fa-plus text-[10px]"></i>
                        </button>

                        <div class="w-[1px] h-4 bg-slate-300 dark:bg-slate-700/60 shrink-0"></div>

                        <!-- Lista de Pestañas con desplazamiento horizontal suave -->
                        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 min-w-0" id="educonta-sheet-tabs-list">
                            <!-- Pestañas inyectadas dinámicamente -->
                        </div>

                        <!-- Flechas de navegación al lado de las pestañas -->
                        <div class="flex items-center gap-1 shrink-0 pl-1" id="sheet-nav-arrows">
                            <button id="btn-sheet-scroll-left" onclick="spreadsheetEngine && spreadsheetEngine.scrollSheetTabs(-1)" class="w-6 h-6 rounded-lg bg-white dark:bg-[#05070e] hover:bg-amber-500/20 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center text-[9px] border border-slate-200 dark:border-white/10 active:scale-95 shadow-sm transition-colors cursor-pointer" title="Desplazar pestañas a la izquierda">
                                <i class="fas fa-chevron-left text-[9px]"></i>
                            </button>
                            <button id="btn-sheet-scroll-right" onclick="spreadsheetEngine && spreadsheetEngine.scrollSheetTabs(1)" class="w-6 h-6 rounded-lg bg-white dark:bg-[#05070e] hover:bg-amber-500/20 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center text-[9px] border border-slate-200 dark:border-white/10 active:scale-95 shadow-sm transition-colors cursor-pointer" title="Desplazar pestañas a la derecha">
                                <i class="fas fa-chevron-right text-[9px]"></i>
                            </button>
                        </div>
                    </div>

                    <!-- SECCIÓN DERECHA: BARRA DE DESPLAZAMIENTO HORIZONTAL MAGNÉTICA Y BOTÓN DE SOPORTE -->
                    <div class="flex-1 flex items-center justify-end gap-2.5 pl-2 pr-1">
                        <div id="educonta-scroll-track-x" class="educonta-bottom-scroll-track-x relative transition-all cursor-pointer select-none">
                            <div id="educonta-scroll-thumb-x" class="educonta-bottom-scroll-thumb-x absolute top-0.5 bottom-0.5 rounded-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 cursor-grab active:cursor-grabbing transition-all shadow-sm"></div>
                        </div>

                        <div class="w-[1px] h-4 bg-slate-300 dark:bg-slate-700/60 shrink-0"></div>

                        <!-- Botón de Soporte Integrado -->
                        <button type="button" onclick="if(typeof window.openSupportModal==='function') window.openSupportModal();" onmouseenter="if(typeof window.startFloatingAnim==='function') window.startFloatingAnim();" onmouseleave="if(typeof window.stopFloatingAnim==='function') window.stopFloatingAnim();" class="w-7 h-7 rounded-lg bg-white dark:bg-[#05070e] hover:bg-amber-500/20 text-sky-500 dark:text-sky-400 hover:text-amber-500 flex items-center justify-center border border-slate-200 dark:border-white/10 active:scale-95 shadow-sm shrink-0 transition-colors cursor-pointer" title="Centro de Ayuda y Soporte">
                            <i class="fas fa-headset text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.tableEl = this.container.querySelector('#educonta-grid-table');
        this.theadEl = this.container.querySelector('#educonta-grid-thead');
        this.tbodyEl = this.container.querySelector('#educonta-grid-tbody');
        this.wrapperEl = this.container.querySelector('.educonta-grid-wrapper');
        this.tabsListEl = this.container.querySelector('#educonta-sheet-tabs-list');
        this.sheetTabMenuEl = this.container.querySelector('#educonta-sheet-tab-menu');
        this.contextMenuEl = this.container.querySelector('#educonta-context-menu');
        this.colHeaderMenuEl = this.container.querySelector('#educonta-col-header-menu');
        this.rowHeaderMenuEl = this.container.querySelector('#educonta-row-header-menu');
        this.sizePromptModalEl = this.container.querySelector('#modal-size-prompt');
        this.autocompleteEl = this.container.querySelector('#educonta-formula-autocomplete');
        this.autocompleteListEl = this.container.querySelector('#educonta-autocomplete-list');
        this.trackYEl = this.container.querySelector('#educonta-scroll-track-y');
        this.thumbYEl = this.container.querySelector('#educonta-scroll-thumb-y');
        this.trackXEl = this.container.querySelector('#educonta-scroll-track-x');
        this.thumbXEl = this.container.querySelector('#educonta-scroll-thumb-x');
        this.rootEl = this.container.querySelector('.educonta-spreadsheet-root');
    }

    // === METADATOS Y RETROALIMENTACIÓN VISUAL DE FORMATOS ===
    getFormatMeta(fmt) {
        if (!fmt) fmt = 'general';
        switch (fmt) {
            case 'usd':
            case 'accounting':
                return {
                    key: 'usd',
                    label: 'Moneda ($ USD)',
                    short: '$ USD',
                    symbol: '$',
                    icon: 'fa-dollar-sign',
                    badgeHtml: '<span class="col-fmt-badge tabular-nums text-[9px] px-1 py-0.2 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black border border-emerald-500/30 shadow-xs" title="Formato de Columna: Moneda ($ USD)">$</span>',
                    colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
                    placeholder: '$ 0.00'
                };
            case 'percent':
                return {
                    key: 'percent',
                    label: 'Porcentaje (%)',
                    short: '%',
                    symbol: '%',
                    icon: 'fa-percent',
                    badgeHtml: '<span class="col-fmt-badge tabular-nums text-[9px] px-1 py-0.2 rounded-md bg-sky-500/20 text-sky-600 dark:text-sky-400 font-black border border-sky-500/30 shadow-xs" title="Formato de Columna: Porcentaje (%)">%</span>',
                    colorClass: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30',
                    placeholder: '0.00%'
                };
            case 'number':
            case 'decimal':
                return {
                    key: 'number',
                    label: 'Número Decimal',
                    short: ',00',
                    symbol: '.00',
                    icon: 'fa-hashtag',
                    badgeHtml: '<span class="col-fmt-badge tabular-nums text-[9px] px-1 py-0.2 rounded-md bg-slate-500/20 text-slate-600 dark:text-slate-300 font-bold border border-slate-500/30 shadow-xs" title="Formato de Columna: Número Decimal">,00</span>',
                    colorClass: 'text-slate-600 dark:text-slate-300 bg-slate-500/10 border-slate-500/30',
                    placeholder: '0.00'
                };
            case 'date':
            case 'date_dmy':
                return {
                    key: 'date_dmy',
                    label: 'Fecha Corta (DD/MM/AAAA)',
                    short: 'Fecha',
                    symbol: '📅',
                    icon: 'fa-calendar-day',
                    badgeHtml: '<span class="col-fmt-badge text-[9px] px-1 py-0.2 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30 shadow-xs" title="Formato de Columna: Fecha Corta (DD/MM/AAAA)"><i class="fas fa-calendar-day text-[8px]"></i></span>',
                    colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
                    placeholder: 'DD/MM/AAAA'
                };
            case 'date_long':
                return {
                    key: 'date_long',
                    label: 'Fecha Larga',
                    short: 'Fecha L',
                    symbol: '📆',
                    icon: 'fa-calendar-week',
                    badgeHtml: '<span class="col-fmt-badge text-[9px] px-1 py-0.2 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30 shadow-xs" title="Formato de Columna: Fecha Larga"><i class="fas fa-calendar-week text-[8px]"></i></span>',
                    colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
                    placeholder: 'Día de Mes de Año'
                };
            case 'time':
            case 'time_24h':
                return {
                    key: 'time_24h',
                    label: 'Hora (24h)',
                    short: 'Hora',
                    symbol: '🕒',
                    icon: 'fa-clock',
                    badgeHtml: '<span class="col-fmt-badge text-[9px] px-1 py-0.2 rounded-md bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/30 shadow-xs" title="Formato de Columna: Hora (24h)"><i class="fas fa-clock text-[8px]"></i></span>',
                    colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
                    placeholder: '00:00:00'
                };
            case 'time_12h':
                return {
                    key: 'time_12h',
                    label: 'Hora (12h)',
                    short: 'Hora 12',
                    symbol: '🕒',
                    icon: 'fa-clock',
                    badgeHtml: '<span class="col-fmt-badge text-[9px] px-1 py-0.2 rounded-md bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/30 shadow-xs" title="Formato de Columna: Hora (12h)"><i class="fas fa-clock text-[8px]"></i></span>',
                    colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
                    placeholder: '00:00 AM'
                };
            case 'nit':
                return {
                    key: 'nit',
                    label: 'NIT El Salvador',
                    short: 'NIT',
                    symbol: '🪪',
                    icon: 'fa-id-card',
                    badgeHtml: '<span class="col-fmt-badge text-[8px] tabular-nums uppercase px-1 py-0.2 rounded-md bg-purple-500/20 text-purple-600 dark:text-purple-400 font-black border border-purple-500/30 shadow-xs" title="Formato de Columna: NIT El Salvador">NIT</span>',
                    colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30',
                    placeholder: '0000-000000-000-0'
                };
            case 'dui':
                return {
                    key: 'dui',
                    label: 'DUI El Salvador',
                    short: 'DUI',
                    symbol: '🪪',
                    icon: 'fa-id-card',
                    badgeHtml: '<span class="col-fmt-badge text-[8px] tabular-nums uppercase px-1 py-0.2 rounded-md bg-purple-500/20 text-purple-600 dark:text-purple-400 font-black border border-purple-500/30 shadow-xs" title="Formato de Columna: DUI El Salvador">DUI</span>',
                    colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30',
                    placeholder: '00000000-0'
                };
            case 'nrc':
                return {
                    key: 'nrc',
                    label: 'NRC El Salvador',
                    short: 'NRC',
                    symbol: '🪪',
                    icon: 'fa-id-card',
                    badgeHtml: '<span class="col-fmt-badge text-[8px] tabular-nums uppercase px-1 py-0.2 rounded-md bg-purple-500/20 text-purple-600 dark:text-purple-400 font-black border border-purple-500/30 shadow-xs" title="Formato de Columna: NRC El Salvador">NRC</span>',
                    colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30',
                    placeholder: '00000-0'
                };
            case 'factura':
                return {
                    key: 'factura',
                    label: 'Factura / Doc SV',
                    short: 'FACT',
                    symbol: '🧾',
                    icon: 'fa-receipt',
                    badgeHtml: '<span class="col-fmt-badge text-[8px] tabular-nums uppercase px-1 py-0.2 rounded-md bg-purple-500/20 text-purple-600 dark:text-purple-400 font-black border border-purple-500/30 shadow-xs" title="Formato de Columna: Factura SV">FACT</span>',
                    colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30',
                    placeholder: 'N° 000000'
                };
            default:
                return {
                    key: 'general',
                    label: 'General / Texto',
                    short: '123',
                    symbol: '',
                    icon: 'fa-font',
                    badgeHtml: '',
                    colorClass: 'text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80',
                    placeholder: ''
                };
        }
    }

    escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // === RENDERIZADO VISUAL ===
    render() {
        const sheet = this.sheets[this.activeSheetIndex];
        if (!sheet) return;
        sheet.data = sheet.data || {};
        sheet.colWidths = sheet.colWidths || {};
        sheet.rowHeights = sheet.rowHeights || {};

        // 1. Cabeceras de Columnas (A..Z...) con Drag & Drop e Indicadores de Formato
        let theadHtml = `<tr class="h-7 bg-slate-100 dark:bg-[#03050a] border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-600 dark:text-slate-400">`;
        theadHtml += `<th class="w-12 bg-slate-200 dark:bg-[#03050a] border-r border-slate-300 dark:border-white/10 text-center sticky top-0 left-0 z-20 select-none cursor-pointer" onclick="spreadsheetEngine && spreadsheetEngine.selectAll()" title="Seleccionar Toda la Hoja">#</th>`;

        for (let c = 0; c < this.options.colCount; c++) {
            if (sheet.hiddenCols && sheet.hiddenCols[c]) continue;
            const colName = this.getColName(c);
            const colWidth = sheet.colWidths[c] || this.options.defaultColWidth;
            const isColActive = (c >= this.selectStartCol && c <= this.selectEndCol && c <= Math.max(this.selectStartCol, this.selectEndCol) && c >= Math.min(this.selectStartCol, this.selectEndCol));
            const colFmt = (sheet.colFormats && sheet.colFormats[c]) ? sheet.colFormats[c].fmt : null;
            const colMeta = this.getFormatMeta(colFmt);
            const badgeHtml = colMeta.badgeHtml || '';

            theadHtml += `
                <th draggable="true" class="border-r border-slate-200 dark:border-white/10 font-bold uppercase tracking-wider text-center sticky top-0 z-10 select-none relative group cursor-grab active:cursor-grabbing ${isColActive ? 'bg-amber-500/25 text-amber-600 dark:text-amber-400 border-b-2 border-b-amber-500' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-[#03050a] dark:hover:bg-[#0e1424] dark:text-slate-400'}" style="width: ${colWidth}px; min-width: ${colWidth}px;" data-col="${c}" title="${colFmt ? `Columna ${colName} [Formato: ${colMeta.label}]` : `Columna ${colName}`}">
                    <div class="flex items-center justify-between w-full h-full px-1.5 gap-1">
                        <span class="mx-auto truncate flex items-center justify-center gap-1">${colName} ${badgeHtml}</span>
                        <i class="col-menu-trigger fas fa-chevron-down text-[9px] text-slate-400 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5" title="Opciones de Columna"></i>
                    </div>
                    <div class="col-resize-handle absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-amber-400 z-30 opacity-0 group-hover:opacity-100 transition-opacity" data-col-resize="${c}"></div>
                </th>
            `;
        }
        theadHtml += `</tr>`;
        this.theadEl.innerHTML = theadHtml;

        // 2. Filas y Celdas de la Hoja con Drag & Drop en Cabecera de Fila
        let tbodyHtml = '';
        const currentSheetId = this.sheetIdMap ? this.sheetIdMap[sheet.name] : null;
        const rMin = Math.min(this.selectStartRow, this.selectEndRow);
        const rMax = Math.max(this.selectStartRow, this.selectEndRow);
        const cMin = Math.min(this.selectStartCol, this.selectEndCol);
        const cMax = Math.max(this.selectStartCol, this.selectEndCol);

        for (let r = 0; r < this.options.rowCount; r++) {
            if (sheet.hiddenRows && sheet.hiddenRows[r]) continue;
            const rowHeight = sheet.rowHeights[r] || this.options.defaultRowHeight;
            const isRowActive = (r >= rMin && r <= rMax);
            tbodyHtml += `<tr class="border-b border-slate-200 dark:border-white/5" style="height: ${rowHeight}px;">`;

            tbodyHtml += `
                <td draggable="true" class="w-12 bg-slate-100 dark:bg-[#03050a] border-r border-slate-200 dark:border-white/10 text-center tabular-nums font-semibold text-[10px] text-slate-600 dark:text-slate-400 sticky left-0 z-10 select-none relative group cursor-grab active:cursor-grabbing ${isRowActive ? 'bg-amber-500/25 text-amber-600 dark:text-amber-400 border-r-2 border-r-amber-500 font-bold' : ''}" data-row-idx="${r}" title="Arrastrar para Reordenar Fila | Clic Derecho: Opciones">
                    <div class="flex items-center justify-between w-full h-full px-1">
                        <span class="mx-auto">${r + 1}</span>
                        <i class="row-menu-trigger fas fa-ellipsis-v text-[8px] text-slate-400 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"></i>
                    </div>
                    <div class="row-resize-handle absolute bottom-0 left-0 w-full h-1.5 cursor-row-resize hover:bg-amber-400 z-30 opacity-0 group-hover:opacity-100 transition-opacity" data-row-resize="${r}"></div>
                </td>
            `;

            for (let c = 0; c < this.options.colCount; c++) {
                if (sheet.hiddenCols && sheet.hiddenCols[c]) continue;
                const cellKey = `${r}_${c}`;
                const cellData = sheet.data[cellKey] || {};
                const colWidth = sheet.colWidths[c] || this.options.defaultColWidth;
                const isSelected = (r === this.activeRow && c === this.activeCol);
                const isInRange = (r >= rMin && r <= rMax && c >= cMin && c <= cMax);
                const isSingleCell = (rMin === rMax && cMin === cMax);

                let displayVal = '';
                if (cellData.f) {
                    if (this.currentViewMode === 'formulas') {
                        displayVal = this.denormalizeFormula(`=${cellData.f}`);
                    } else {
                        displayVal = this.getEvaluatedCellValue(r, c, sheet);
                    }
                } else {
                    displayVal = cellData.v !== undefined ? cellData.v : '';
                }

                if (cellData.mergedInto) {
                    continue; // Omitir celda absorbida por combinación
                }

                let mergeAttrs = '';
                if (cellData.merge) {
                    mergeAttrs = ` rowspan="${cellData.merge.rowspan}" colspan="${cellData.merge.colspan}" `;
                }

                let cellStyles = `width: ${colWidth}px; max-width: ${colWidth}px; `;
                if (cellData.bold) cellStyles += 'font-weight: bold; ';
                if (cellData.italic) cellStyles += 'font-style: italic; ';
                
                let textDeco = [];
                if (cellData.underline) textDeco.push('underline');
                if (cellData.strikethrough) textDeco.push('line-through');
                if (textDeco.length > 0) cellStyles += `text-decoration: ${textDeco.join(' ')} !important; `;
                
                if (cellData.align) cellStyles += `text-align: ${cellData.align} !important; `;
                if (cellData.valign) cellStyles += `vertical-align: ${cellData.valign} !important; `;
                if (cellData.indent) cellStyles += `padding-left: ${(cellData.indent * 14) + 8}px !important; `;
                if (cellData.color) cellStyles += `color: ${cellData.color} !important; `;
                if (cellData.bgcolor) cellStyles += `background-color: ${cellData.bgcolor} !important; `;
                if (cellData.font) {
                    if (typeof window.ensureGoogleFontLoaded === 'function') window.ensureGoogleFontLoaded(cellData.font);
                    cellStyles += `font-family: '${cellData.font}', sans-serif; `;
                }
                if (cellData.size) cellStyles += `font-size: ${cellData.size}pt; `;
                
                // === RESOLUCIÓN Y SINCRONIZACIÓN NÍTIDA DE BORDES ===
                let bLeft = cellData.borderLeft || null;
                let bRight = cellData.borderRight || null;
                let bTop = cellData.borderTop || null;
                let bBottom = cellData.borderBottom || null;

                if (cellData.border) {
                    const bColor = cellData.borderColor || (cellData.border.includes('double') ? '#f59e0b' : '#64748b');
                    if (cellData.border === 'all' || cellData.border === 'outer') {
                        bLeft = bLeft || `1px solid ${bColor}`;
                        bRight = bRight || `1px solid ${bColor}`;
                        bTop = bTop || `1px solid ${bColor}`;
                        bBottom = bBottom || `1px solid ${bColor}`;
                    } else if (cellData.border === 'top') {
                        bTop = bTop || `1px solid ${bColor}`;
                    } else if (cellData.border === 'bottom') {
                        bBottom = bBottom || `1px solid ${bColor}`;
                    } else if (cellData.border === 'left') {
                        bLeft = bLeft || `1px solid ${bColor}`;
                    } else if (cellData.border === 'right') {
                        bRight = bRight || `1px solid ${bColor}`;
                    } else if (cellData.border === 'bottom-thick') {
                        bBottom = bBottom || `2.5px solid ${bColor}`;
                    } else if (cellData.border === 'accounting-double' || cellData.border === 'bottom-double') {
                        bBottom = bBottom || `3px double ${bColor}`;
                    } else if (cellData.border === 'top-bottom-thick') {
                        bTop = bTop || `1px solid ${bColor}`;
                        bBottom = bBottom || `2.5px solid ${bColor}`;
                    } else if (cellData.border === 'top-bottom-double') {
                        bTop = bTop || `1px solid ${bColor}`;
                        bBottom = bBottom || `3px double ${bColor}`;
                    }
                }

                // Sincronización bidireccional con vecinos para evitar que el algoritmo collapse de CSS oculte líneas
                const rightNeighbor = (sheet.data && sheet.data[`${r}_${c + 1}`]);
                if (rightNeighbor && !bRight) {
                    if (rightNeighbor.borderLeft) bRight = rightNeighbor.borderLeft;
                    else if (rightNeighbor.border === 'all' || rightNeighbor.border === 'outer' || rightNeighbor.border === 'left') {
                        bRight = `1px solid ${rightNeighbor.borderColor || '#64748b'}`;
                    }
                }

                const leftNeighbor = (sheet.data && sheet.data[`${r}_${c - 1}`]);
                if (leftNeighbor && !bLeft) {
                    if (leftNeighbor.borderRight) bLeft = leftNeighbor.borderRight;
                    else if (leftNeighbor.border === 'all' || leftNeighbor.border === 'outer' || leftNeighbor.border === 'right') {
                        bLeft = `1px solid ${leftNeighbor.borderColor || '#64748b'}`;
                    }
                }

                const bottomNeighbor = (sheet.data && sheet.data[`${r + 1}_${c}`]);
                if (bottomNeighbor && !bBottom) {
                    if (bottomNeighbor.borderTop) bBottom = bottomNeighbor.borderTop;
                    else if (bottomNeighbor.border === 'all' || bottomNeighbor.border === 'outer' || bottomNeighbor.border === 'top') {
                        bBottom = `1px solid ${bottomNeighbor.borderColor || '#64748b'}`;
                    }
                }

                const topNeighbor = (sheet.data && sheet.data[`${r - 1}_${c}`]);
                if (topNeighbor && !bTop) {
                    if (topNeighbor.borderBottom) bTop = topNeighbor.borderBottom;
                    else if (topNeighbor.border === 'all' || topNeighbor.border === 'outer' || topNeighbor.border === 'bottom') {
                        bTop = `1px solid ${topNeighbor.borderColor || '#64748b'}`;
                    }
                }

                if (bLeft) cellStyles += `border-left: ${bLeft} !important; `;
                if (bRight) cellStyles += `border-right: ${bRight} !important; `;
                if (bTop) cellStyles += `border-top: ${bTop} !important; `;
                if (bBottom) cellStyles += `border-bottom: ${bBottom} !important; `;

                const effectiveFmt = cellData.fmt || (sheet.colFormats && sheet.colFormats[c] && sheet.colFormats[c].fmt) || 'general';
                const effectiveMeta = this.getFormatMeta(effectiveFmt);
                const formattedDisplay = this.formatCellDisplayValue(cellData, displayVal, c);

                // Comprobar si la celda pertenece a una Tabla Inteligente
                const table = this.getTableAt(r, c);
                let innerCellContent = formattedDisplay;

                if (!innerCellContent && effectiveFmt !== 'general' && effectiveFmt !== 'text' && !table) {
                    innerCellContent = `<span class="cell-fmt-placeholder opacity-35 tabular-nums text-[10px] select-none pointer-events-none italic">${effectiveMeta.placeholder}</span>`;
                }

                if (table) {
                    const tStyle = this.tableStyles[table.style] || this.tableStyles.amber;
                    const isHeader = table.hasHeaderRow && (r === table.range.r1);
                    const isTotal = table.hasTotalRow && (r === table.range.r2);
                    const isData = !isHeader && !isTotal;

                    if (isHeader) {
                        cellStyles += `background-color: ${tStyle.headerBg} !important; color: ${tStyle.headerText} !important; font-weight: bold !important; `;
                        const headerText = formattedDisplay || `Columna${c - table.range.c1 + 1}`;
                        const isFiltered = table.filterStates && table.filterStates[c] && table.filterStates[c].length;
                        innerCellContent = `
                            <div class="flex items-center justify-between w-full h-full gap-1">
                                <span class="truncate font-black text-white">${headerText}</span>
                                <button type="button" onclick="event.stopPropagation(); if (typeof window.openTableFilterPopover === 'function') window.openTableFilterPopover('${table.id}', ${c}, event);" class="table-filter-btn px-1 py-0.5 rounded text-[8px] hover:bg-black/25 ${isFiltered ? 'text-amber-200 bg-black/30' : 'text-white/80 hover:text-white'} transition-all shrink-0 cursor-pointer" title="Filtro y Ordenación de Columna">
                                    <i class="fas ${isFiltered ? 'fa-filter' : 'fa-caret-down'} text-[8px]"></i>
                                </button>
                            </div>
                        `;
                    } else if (isTotal) {
                        cellStyles += `border-top: 1.5px solid ${tStyle.border} !important; border-bottom: 3px double ${tStyle.border} !important; font-weight: bold !important; `;
                        innerCellContent = `
                            <div class="flex items-center justify-between w-full h-full gap-1 group/tot">
                                <span class="truncate font-bold">${formattedDisplay || (c === table.range.c1 ? 'Total' : '')}</span>
                                <button type="button" onclick="event.stopPropagation(); if (typeof window.openTableTotalPopover === 'function') window.openTableTotalPopover('${table.id}', ${c}, event);" class="table-total-btn px-1 py-0.5 rounded text-[8px] opacity-0 group-hover/tot:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-all shrink-0 cursor-pointer" title="Función de Totales">
                                    <i class="fas fa-chevron-down text-[7px]"></i>
                                </button>
                            </div>
                        `;
                    } else if (isData) {
                        const dataRowIdx = r - (table.hasHeaderRow ? (table.range.r1 + 1) : table.range.r1);
                        if (table.hasBandedRows && (dataRowIdx % 2 === 1)) {
                            cellStyles += `background-color: ${tStyle.stripeBg} !important; `;
                        }
                        if (table.hasBandedCols && ((c - table.range.c1) % 2 === 1)) {
                            cellStyles += `background-color: ${tStyle.stripeBg} !important; `;
                        }
                        if (table.highlightFirstCol && c === table.range.c1) {
                            cellStyles += `font-weight: bold !important; `;
                        }
                        if (table.highlightLastCol && c === table.range.c2) {
                            cellStyles += `font-weight: bold !important; `;
                        }
                    }

                    // Bordes perimetrales de la tabla
                    if (c === table.range.c1) cellStyles += `border-left: 1.5px solid ${tStyle.border} !important; `;
                    if (c === table.range.c2) cellStyles += `border-right: 1.5px solid ${tStyle.border} !important; `;
                    if (r === table.range.r1) cellStyles += `border-top: 1.5px solid ${tStyle.border} !important; `;
                    if (r === table.range.r2) cellStyles += `border-bottom: 1.5px solid ${tStyle.border} !important; `;
                }

                let classes = 'px-2 py-1 text-xs relative cursor-cell ';
                if (!cellData.wrap) {
                    classes += 'truncate ';
                } else {
                    cellStyles += 'white-space: normal !important; word-break: break-word !important; ';
                }

                if (isSingleCell) {
                    if (isSelected) {
                        classes += 'cell-selected-active cell-sel-top cell-sel-bottom cell-sel-left cell-sel-right cell-move-edge font-medium ';
                        innerCellContent += `<div class="cell-fill-handle" title="Arrastrar para autorrellenar"></div>`;
                    } else {
                        classes += 'border-r border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 ';
                        if (!cellData.bgcolor) classes += 'bg-white hover:bg-slate-100 dark:bg-[#05070e] dark:hover:bg-[#0e1424] ';
                    }
                } else if (isInRange) {
                    classes += 'z-10 ';
                    if (isSelected) {
                        classes += 'cell-selected-active font-bold ';
                    } else {
                        classes += 'cell-selected-range text-slate-900 dark:text-slate-100 ';
                    }

                    if (r === rMin) classes += 'cell-sel-top cell-move-edge ';
                    if (r === rMax) classes += 'cell-sel-bottom cell-move-edge ';
                    else classes += 'border-b border-b-slate-200 dark:border-b-white/5 ';

                    if (c === cMin) classes += 'cell-sel-left cell-move-edge ';
                    if (c === cMax) classes += 'cell-sel-right cell-move-edge ';
                    else classes += 'border-r border-r-slate-200 dark:border-r-white/5 ';

                    if (r === rMax && c === cMax) {
                        innerCellContent += `<div class="cell-fill-handle" title="Arrastrar para autorrellenar"></div>`;
                    }
                } else {
                    classes += 'border-r border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 ';
                    if (!cellData.bgcolor) classes += 'bg-white hover:bg-slate-100 dark:bg-[#05070e] dark:hover:bg-[#0e1424] ';
                }

                if (this.currentViewMode === 'saltos' || this.currentViewMode === 'paginada') {
                    const rowsPerPage = this.pageConfig ? (this.pageConfig.orientation === 'landscape' ? 24 : 35) : 35;
                    const colsPerPage = this.pageConfig ? (this.pageConfig.orientation === 'landscape' ? 12 : 8) : 8;
                    if ((r + 1) % rowsPerPage === 0) classes += 'page-break-line-h ';
                    if ((c + 1) % colsPerPage === 0) classes += 'page-break-line-v ';
                }

                const formulaAttr = cellData.f ? `data-formula="${this.escapeHtml(cellData.f)}"` : '';
                const hasCustomFmt = effectiveFmt && effectiveFmt !== 'general' && effectiveFmt !== 'text';
                const fmtAttr = hasCustomFmt ? ` data-cell-fmt="${effectiveFmt}" title="Formato: ${effectiveMeta.label}"` : '';

                tbodyHtml += `
                    <td class="${classes}" style="${cellStyles}" ${mergeAttrs} data-row="${r}" data-col="${c}" id="cell_${r}_${c}" ${formulaAttr}${fmtAttr}>
                        ${innerCellContent}
                    </td>
                `;
            }
            tbodyHtml += `</tr>`;
        }
        this.tbodyEl.innerHTML = tbodyHtml;

        this.renderTabs();
        this.scrollActiveCellIntoView();
        this.triggerSelectCallback();
        this.updateFormulaPickHighlight();
        this.updateCustomScrollbars();
        this.renderRemoteSelections();
    }

    // === GESTIÓN DE MODOS DE VISTA (NORMAL, PAGINADA, SALTOS, FÓRMULAS) ===
    setViewMode(mode) {
        this.currentViewMode = mode || 'normal';
        if (this.rootEl) {
            this.rootEl.classList.toggle('paginated-mode-active', this.currentViewMode === 'paginada');
            this.rootEl.classList.toggle('formula-audit-active', this.currentViewMode === 'formulas');
        }
        this.render();
    }

    setPageConfig(config) {
        this.pageConfig = Object.assign(this.pageConfig || {}, config);
        if (this.pageConfig.orientation === 'landscape') {
            this.pageConfig.rowsPerPage = 24;
            this.pageConfig.colsPerPage = 12;
        } else {
            this.pageConfig.rowsPerPage = 35;
            this.pageConfig.colsPerPage = 8;
        }
        this.render();
    }

    // === GESTIÓN DE COLABORACIÓN Y SELECCIONES REMOTAS ===
    setRemoteSelection(userId, collabData) {
        if (!collabData) {
            this.remoteCollaborators.delete(userId);
        } else {
            this.remoteCollaborators.set(userId, collabData);
        }
        this.renderRemoteSelections();
    }

    clearRemoteSelection(userId) {
        this.remoteCollaborators.delete(userId);
        this.renderRemoteSelections();
    }

    renderRemoteSelections() {
        if (!this.wrapperEl) return;
        let overlay = this.container.querySelector('#collab-spreadsheet-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'collab-spreadsheet-overlay';
            overlay.className = 'absolute inset-0 pointer-events-none z-20 overflow-visible';
            this.wrapperEl.appendChild(overlay);
        }
        overlay.innerHTML = '';

        const currentSheet = this.sheets[this.activeSheetIndex];
        if (!currentSheet) return;

        this.remoteCollaborators.forEach((collab, userId) => {
            if (collab.currentSheetId && collab.currentSheetId !== currentSheet.id && collab.currentSheetId !== currentSheet.name) {
                return;
            }
            const r1 = Math.min(collab.startRow, collab.endRow);
            const r2 = Math.max(collab.startRow, collab.endRow);
            const c1 = Math.min(collab.startCol, collab.endCol);
            const c2 = Math.max(collab.startCol, collab.endCol);

            const cellTopLeft = this.container.querySelector(`#cell_${r1}_${c1}`);
            const cellBottomRight = this.container.querySelector(`#cell_${r2}_${c2}`);

            if (cellTopLeft && cellBottomRight) {
                const left = cellTopLeft.offsetLeft;
                const top = cellTopLeft.offsetTop;
                const width = (cellBottomRight.offsetLeft + cellBottomRight.offsetWidth) - left;
                const height = (cellBottomRight.offsetTop + cellBottomRight.offsetHeight) - top;

                const box = document.createElement('div');
                box.className = 'remote-cell-outline';
                box.style.left = `${left}px`;
                box.style.top = `${top}px`;
                box.style.width = `${width}px`;
                box.style.height = `${height}px`;
                box.style.borderColor = collab.userColor || '#38bdf8';
                box.style.backgroundColor = (collab.userColor || '#38bdf8') + '15';

                const tag = document.createElement('div');
                tag.className = 'remote-cell-tag';
                tag.style.backgroundColor = collab.userColor || '#38bdf8';
                tag.innerHTML = `<i class="fas fa-user text-[8px]"></i> <span>${this.escapeHtml(collab.userName || 'Colaborador')}: ${this.getColName(c1)}${r1 + 1}</span>`;

                box.appendChild(tag);
                overlay.appendChild(box);
            }
        });
    }

    applyRemoteCellUpdate(sheetId, row, col, cellData) {
        let sheet = this.sheets.find(s => s.id === sheetId || s.name === sheetId);
        if (!sheet) sheet = this.sheets[this.activeSheetIndex];
        if (!sheet) return;

        sheet.data = sheet.data || {};
        const cellKey = `${row}_${col}`;
        if (!cellData || (cellData.v === undefined && cellData.f === undefined && !cellData.clear)) {
            sheet.data[cellKey] = Object.assign(sheet.data[cellKey] || {}, cellData);
        } else if (cellData.clear) {
            delete sheet.data[cellKey];
        } else {
            sheet.data[cellKey] = Object.assign(sheet.data[cellKey] || {}, cellData);
        }

        if (this.hfInstance) {
            try {
                const hfSheetId = this.sheetIdMap ? this.sheetIdMap[sheet.name] : null;
                if (hfSheetId !== null && hfSheetId !== undefined) {
                    const valToSet = cellData.f ? cellData.f : (cellData.v !== undefined ? cellData.v : null);
                    this.hfInstance.setCellContents({ sheet: hfSheetId, col, row }, [[valToSet]]);
                }
            } catch (e) {
                console.warn('Error en HyperFormula remoto:', e);
            }
        }

        if (sheet === this.sheets[this.activeSheetIndex]) {
            this.render();
        }
    }

    // === BARRAS DE DESPLAZAMIENTO MAGNÉTICAS ULTRA-FINAS (EJES X & Y) ===
    initCustomScrollbars() {
        this.trackYEl = this.container.querySelector('#educonta-scroll-track-y');
        this.thumbYEl = this.container.querySelector('#educonta-scroll-thumb-y');
        this.trackXEl = this.container.querySelector('#educonta-scroll-track-x');
        this.thumbXEl = this.container.querySelector('#educonta-scroll-thumb-x');
        this.rootEl = this.container.querySelector('.educonta-spreadsheet-root');

        if (!this.trackYEl || !this.thumbYEl || !this.trackXEl || !this.thumbXEl || !this.wrapperEl) return;

        // 1. Sincronización continua de posición al hacer scroll (sin micro-activar barras en pantalla)
        this.wrapperEl.addEventListener('scroll', () => {
            this.updateCustomScrollbars();
        }, { passive: true });

        // 2. Activación por proximidad magnética y elástica para los scrolls (optimizada con rAF)
        this.isHoveringNearScroll = false;
        this.isHoveringNearScrollX = false;
        if (this.rootEl) {
            let cachedRootRect = null;
            let rafMouseId = null;

            const updateProximity = (clientX, clientY) => {
                if (!cachedRootRect) cachedRootRect = this.rootEl.getBoundingClientRect();
                const rect = cachedRootRect;
                const distRight = rect.right - clientX;
                const inYRange = (clientY >= rect.top + 32 && clientY <= rect.bottom - 48);

                // Proximidad Vertical Y
                if (!this.isDraggingScrollY) {
                    const isNearY = distRight <= 35 && distRight >= -8 && inYRange;
                    this.isHoveringNearScroll = isNearY;

                    if (isNearY) {
                        this.trackYEl.classList.add('is-visible');
                        const pullX = Math.max(-2.5, Math.min(0, (distRight - 22) * 0.1));
                        this.thumbYEl.style.transform = `translateX(${pullX}px)`;
                    } else {
                        this.trackYEl.classList.remove('is-visible');
                        this.thumbYEl.style.transform = 'none';
                    }
                }

                // Proximidad Horizontal X (Expansión Elástica Tipo Acordeón / Gelatina)
                if (!this.isDraggingScrollX) {
                    const distBottom = rect.bottom - clientY;
                    const inXArea = (distBottom <= 45 && distBottom >= -8 && clientX >= rect.right - 250);
                    this.isHoveringNearScrollX = inXArea;

                    if (inXArea) {
                        this.trackXEl.classList.add('is-hovered');
                    } else {
                        this.trackXEl.classList.remove('is-hovered');
                    }
                }
            };

            this.rootEl.addEventListener('mouseenter', () => {
                cachedRootRect = this.rootEl.getBoundingClientRect();
            });

            this.rootEl.addEventListener('mousemove', (e) => {
                const clientX = e.clientX;
                const clientY = e.clientY;
                if (!rafMouseId) {
                    rafMouseId = requestAnimationFrame(() => {
                        rafMouseId = null;
                        updateProximity(clientX, clientY);
                    });
                }
            }, { passive: true });

            this.rootEl.addEventListener('mouseleave', () => {
                cachedRootRect = null;
                if (rafMouseId) {
                    cancelAnimationFrame(rafMouseId);
                    rafMouseId = null;
                }
                this.isHoveringNearScroll = false;
                this.isHoveringNearScrollX = false;
                if (!this.isDraggingScrollY) {
                    if (this.trackYEl) {
                        this.trackYEl.classList.remove('is-visible');
                        this.thumbYEl.style.transform = 'none';
                    }
                }
                if (!this.isDraggingScrollX) {
                    if (this.trackXEl) {
                        this.trackXEl.classList.remove('is-hovered');
                    }
                }
            });
        }

        // 3. Arrastre (Drag) del Thumb Vertical Y
        this.isDraggingScrollY = false;
        let startY = 0;
        let startScrollTop = 0;

        this.thumbYEl.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.isDraggingScrollY = true;
            startY = e.clientY;
            startScrollTop = this.wrapperEl.scrollTop;
            this.trackYEl.classList.add('is-dragging', 'is-visible');
            document.body.classList.add('select-none');
        });

        // 4. Arrastre (Drag) del Thumb Horizontal X en barra inferior
        this.isDraggingScrollX = false;
        let startX = 0;
        let startScrollLeft = 0;

        this.thumbXEl.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.isDraggingScrollX = true;
            startX = e.clientX;
            startScrollLeft = this.wrapperEl.scrollLeft;
            this.trackXEl.classList.add('is-dragging', 'is-hovered');
            this.thumbXEl.classList.add('is-dragging');
            document.body.classList.add('select-none');
        });

        // Eventos globales de arrastre en document
        document.addEventListener('mousemove', (e) => {
            if (this.isDraggingScrollY) {
                const deltaY = e.clientY - startY;
                const trackHeight = this.trackYEl.clientHeight;
                const thumbHeight = this.thumbYEl.clientHeight;
                const maxThumbTop = trackHeight - thumbHeight;
                const maxScrollTop = this.wrapperEl.scrollHeight - this.wrapperEl.clientHeight;
                if (maxThumbTop > 0 && maxScrollTop > 0) {
                    const scrollRatio = maxScrollTop / maxThumbTop;
                    this.wrapperEl.scrollTop = startScrollTop + (deltaY * scrollRatio);
                }
            }

            if (this.isDraggingScrollX) {
                const deltaX = e.clientX - startX;
                const trackWidth = this.trackXEl.clientWidth;
                const thumbWidth = this.thumbXEl.clientWidth;
                const maxThumbLeft = trackWidth - thumbWidth;
                const maxScrollLeft = this.wrapperEl.scrollWidth - this.wrapperEl.clientWidth;
                if (maxThumbLeft > 0 && maxScrollLeft > 0) {
                    const scrollRatio = maxScrollLeft / maxThumbLeft;
                    this.wrapperEl.scrollLeft = startScrollLeft + (deltaX * scrollRatio);
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDraggingScrollY) {
                this.isDraggingScrollY = false;
                if (this.trackYEl) {
                    this.trackYEl.classList.remove('is-dragging');
                    if (!this.isHoveringNearScroll) this.trackYEl.classList.remove('is-visible');
                }
                document.body.classList.remove('select-none');
            }
            if (this.isDraggingScrollX) {
                this.isDraggingScrollX = false;
                if (this.trackXEl) {
                    this.trackXEl.classList.remove('is-dragging');
                    if (!this.isHoveringNearScrollX) this.trackXEl.classList.remove('is-hovered');
                }
                if (this.thumbXEl) this.thumbXEl.classList.remove('is-dragging');
                document.body.classList.remove('select-none');
            }
        });

        // Sincronizar dimensiones durante y después de la animación elástica de la pista
        if (this.trackXEl) {
            this.trackXEl.addEventListener('transitionend', () => {
                this.updateCustomScrollbars();
            });
            if (window.ResizeObserver) {
                const trackObserver = new ResizeObserver(() => {
                    this.updateCustomScrollbars();
                });
                trackObserver.observe(this.trackXEl);
            }
        }

        // 5. Clic directo en pista para salto de desplazamiento
        this.trackYEl.addEventListener('mousedown', (e) => {
            if (e.target === this.thumbYEl || this.thumbYEl.contains(e.target)) return;
            const trackRect = this.trackYEl.getBoundingClientRect();
            const clickY = e.clientY - trackRect.top;
            const trackHeight = trackRect.height;
            const thumbHeight = this.thumbYEl.clientHeight;
            const targetThumbTop = Math.max(0, Math.min(trackHeight - thumbHeight, clickY - (thumbHeight / 2)));
            const maxScrollTop = this.wrapperEl.scrollHeight - this.wrapperEl.clientHeight;
            const maxThumbTop = trackHeight - thumbHeight;
            if (maxThumbTop > 0) {
                this.wrapperEl.scrollTop = (targetThumbTop / maxThumbTop) * maxScrollTop;
            }
        });

        this.trackXEl.addEventListener('mousedown', (e) => {
            if (e.target === this.thumbXEl || this.thumbXEl.contains(e.target)) return;
            const trackRect = this.trackXEl.getBoundingClientRect();
            const clickX = e.clientX - trackRect.left;
            const trackWidth = trackRect.width;
            const thumbWidth = this.thumbXEl.clientWidth;
            const targetThumbLeft = Math.max(0, Math.min(trackWidth - thumbWidth, clickX - (thumbWidth / 2)));
            const maxScrollLeft = this.wrapperEl.scrollWidth - this.wrapperEl.clientWidth;
            const maxThumbLeft = trackWidth - thumbWidth;
            if (maxThumbLeft > 0) {
                this.wrapperEl.scrollLeft = (targetThumbLeft / maxThumbLeft) * maxScrollLeft;
            }
        });

        // ResizeObserver para mantener las dimensiones sincronizadas
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                this.updateCustomScrollbars();
            });
            ro.observe(this.wrapperEl);
        }
    }

    updateCustomScrollbars() {
        if (!this.trackYEl || !this.thumbYEl || !this.trackXEl || !this.thumbXEl || !this.wrapperEl) return;

        const { clientWidth, clientHeight, scrollWidth, scrollHeight, scrollTop, scrollLeft } = this.wrapperEl;

        // --- Actualizar Eje Y (Vertical) ---
        const trackHeight = this.trackYEl.clientHeight;
        if (scrollHeight > clientHeight && trackHeight > 0) {
            const rawThumbHeight = (clientHeight / scrollHeight) * trackHeight;
            const thumbHeight = Math.max(20, Math.min(trackHeight - 8, rawThumbHeight));
            const maxScrollTop = scrollHeight - clientHeight;
            const maxThumbTop = trackHeight - thumbHeight;
            const thumbTop = maxScrollTop > 0 ? (scrollTop / maxScrollTop) * maxThumbTop : 0;

            this.thumbYEl.style.height = `${thumbHeight}px`;
            this.thumbYEl.style.top = `${thumbTop}px`;
            this.trackYEl.style.display = 'block';
        } else {
            this.trackYEl.style.display = 'none';
        }

        // --- Actualizar Eje X (Horizontal integrado en pie de hoja) ---
        const trackWidth = this.trackXEl.clientWidth;
        if (scrollWidth > clientWidth && trackWidth > 0) {
            const rawThumbWidth = (clientWidth / scrollWidth) * trackWidth;
            const thumbWidth = Math.max(30, Math.min(trackWidth - 4, rawThumbWidth));
            const maxScrollLeft = scrollWidth - clientWidth;
            const maxThumbLeft = trackWidth - thumbWidth;
            const thumbLeft = maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * maxThumbLeft : 0;

            this.thumbXEl.style.width = `${thumbWidth}px`;
            this.thumbXEl.style.left = `${thumbLeft}px`;
            this.trackXEl.style.opacity = '1';
        } else {
            this.thumbXEl.style.width = '100%';
            this.thumbXEl.style.left = '0px';
            this.trackXEl.style.opacity = '0.5';
        }
    }

    scrollActiveCellIntoView() {
        const td = this.container.querySelector(`#cell_${this.activeRow}_${this.activeCol}`);
        if (td && typeof td.scrollIntoView === 'function') {
            td.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
    }

    renderTabs() {
        if (!this.tabsListEl) return;
        this.tabsListEl.innerHTML = this.sheets.map((sheet, index) => {
            const isActive = index === this.activeSheetIndex;
            const tabColor = sheet.tabColor || null;
            const safeSheetName = this.escapeHtml(sheet.name);
            
            let colorStyles = '';
            let colorDot = '';

            if (tabColor) {
                if (isActive) {
                    colorStyles = `background-color: ${tabColor} !important; color: #ffffff !important; border-color: ${tabColor} !important; box-shadow: 0 4px 12px -2px ${tabColor}80 !important;`;
                } else {
                    colorDot = `<span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style="background-color: ${tabColor};"></span>`;
                }
            }

            return `
                <div class="sheet-tab-item group relative inline-flex items-center" data-sheet-index="${index}">
                    <button type="button" class="sheet-tab-btn px-2.5 py-1 h-7 rounded-xl text-xs font-bold flex items-center gap-1.5 border whitespace-nowrap shrink-0 transition-all cursor-pointer select-none ${isActive ? (tabColor ? 'text-white shadow-sm' : 'bg-amber-500 text-white border-amber-400 shadow-sm') : 'bg-white dark:bg-[#05070e] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-[#0e1424] hover:text-slate-800 dark:hover:text-slate-200'}" style="${colorStyles}" data-sheet-index="${index}" title="${safeSheetName}&#10;• Clic: Activar hoja&#10;• Doble clic: Renombrar&#10;• Clic derecho: Opciones de viñeta">
                        ${colorDot || '<i class="fas fa-table-cells text-[10px] shrink-0 opacity-80"></i>'}
                        <span class="sheet-tab-name whitespace-nowrap truncate max-w-[150px] md:max-w-[200px]" data-sheet-index="${index}">${safeSheetName}</span>
                        <span class="sheet-tab-menu-trigger p-0.5 rounded hover:bg-black/15 dark:hover:bg-white/15 ${isActive ? 'opacity-90' : 'opacity-0 group-hover:opacity-80'} transition-opacity ml-0.5" data-sheet-index="${index}" title="Opciones de la viñeta">
                            <i class="fas fa-chevron-down text-[8px]"></i>
                        </span>
                    </button>
                </div>
            `;
        }).join('');

        // 1. Clic para activar hoja
        this.tabsListEl.querySelectorAll('.sheet-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Si hizo clic en el trigger del menú de opciones, no cambiar de hoja
                if (e.target.closest('.sheet-tab-menu-trigger')) return;
                const idx = parseInt(btn.getAttribute('data-sheet-index'), 10);
                if (!isNaN(idx) && idx !== this.activeSheetIndex) {
                    this.activeSheetIndex = idx;
                    this.activeRow = 0; this.activeCol = 0;
                    this.selectStartRow = 0; this.selectStartCol = 0;
                    this.selectEndRow = 0; this.selectEndCol = 0;
                    this.render();
                }
            });
        });

        // 2. Clic derecho (Menú contextual)
        this.tabsListEl.querySelectorAll('.sheet-tab-item').forEach(item => {
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const idx = parseInt(item.getAttribute('data-sheet-index'), 10);
                if (!isNaN(idx)) {
                    this.openSheetTabMenu(idx, e.clientX, e.clientY);
                }
            });
        });

        // 3. Clic en flechita de opciones de la viñeta
        this.tabsListEl.querySelectorAll('.sheet-tab-menu-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const idx = parseInt(trigger.getAttribute('data-sheet-index'), 10);
                if (!isNaN(idx)) {
                    const rect = trigger.getBoundingClientRect();
                    this.openSheetTabMenu(idx, rect.left, rect.top);
                }
            });
        });

        // 4. Doble clic para renombrar en línea
        this.tabsListEl.querySelectorAll('.sheet-tab-name').forEach(nameSpan => {
            nameSpan.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const idx = parseInt(nameSpan.getAttribute('data-sheet-index'), 10);
                if (!isNaN(idx)) {
                    this.startInlineTabRename(idx, nameSpan);
                }
            });
        });

        // Asegurar que la pestaña activa sea visible en el contenedor con scroll
        const activeTabBtn = this.tabsListEl.querySelector(`.sheet-tab-item[data-sheet-index="${this.activeSheetIndex}"] button`);
        if (activeTabBtn && typeof activeTabBtn.scrollIntoView === 'function') {
            activeTabBtn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        }
    }

    getRawCellValue(cellData, sheetData, visited = new Set()) {
        if (!cellData) return null;
        if (cellData.f) {
            const fKey = String(cellData.f).toUpperCase();
            if (visited.has(fKey)) return null; // Prevenir recursión infinita
            visited.add(fKey);
            const evaluated = this.evaluateNativeFormula(cellData.f, sheetData, visited);
            const num = this.cleanNumericValue(evaluated);
            return num !== null ? num : (evaluated !== undefined && evaluated !== null ? evaluated : null);
        }
        if (cellData.v !== undefined && cellData.v !== null && cellData.v !== '') {
            const num = this.cleanNumericValue(cellData.v);
            return num !== null ? num : cellData.v;
        }
        return null;
    }

    extractArgs(argString) {
        const args = [];
        let current = '';
        let depth = 0;
        let inQuotes = false;
        for (let i = 0; i < argString.length; i++) {
            const char = argString[i];
            if (char === '"') inQuotes = !inQuotes;
            if (!inQuotes) {
                if (char === '(') depth++;
                else if (char === ')') depth--;
                else if (char === ',' && depth === 0) {
                    args.push(current.trim());
                    current = '';
                    continue;
                }
            }
            current += char;
        }
        if (current.trim()) args.push(current.trim());
        return args;
    }

    getRangeOrValues(refOrExpr, sheetData, visited = new Set()) {
        const trimmed = String(refOrExpr || '').trim();
        const rangeMatch = trimmed.match(/^(\$?[A-Za-z]+\$?\d+)\s*:\s*(\$?[A-Za-z]+\$?\d+)$/);
        if (rangeMatch) {
            const pStart = this.parseCellRef(rangeMatch[1]);
            const pEnd = this.parseCellRef(rangeMatch[2]);
            if (!pStart || !pEnd) return [];
            const values = [];
            for (let r = Math.min(pStart.row, pEnd.row); r <= Math.max(pStart.row, pEnd.row); r++) {
                for (let c = Math.min(pStart.col, pEnd.col); c <= Math.max(pStart.col, pEnd.col); c++) {
                    const cd = sheetData ? sheetData[`${r}_${c}`] : null;
                    const val = this.getRawCellValue(cd, sheetData, new Set(visited));
                    if (val !== undefined && val !== null && val !== '') {
                        values.push(val);
                    }
                }
            }
            return values;
        }
        
        const singleCell = this.parseCellRef(trimmed);
        if (singleCell && /^\$?[A-Za-z]+\$?\d+$/.test(trimmed)) {
            const cd = sheetData ? sheetData[`${singleCell.row}_${singleCell.col}`] : null;
            const val = this.getRawCellValue(cd, sheetData, new Set(visited));
            return (val !== undefined && val !== null && val !== '') ? [val] : [];
        }

        const evaluated = this.evaluateNativeFormula(trimmed, sheetData, new Set(visited));
        const num = this.cleanNumericValue(evaluated);
        if (num !== null && !isNaN(num)) return [num];
        if (evaluated !== undefined && evaluated !== null && evaluated !== '') return [evaluated];
        return [];
    }

    calculateNativeNPV(rate, values) {
        if (typeof rate !== 'number' || isNaN(rate) || rate <= -1) return 0;
        let npv = 0;
        const cleanVals = (values || []).map(v => this.cleanNumericValue(v)).filter(v => v !== null && !isNaN(v));
        for (let t = 0; t < cleanVals.length; t++) {
            const v = cleanVals[t];
            npv += v / Math.pow(1 + rate, t + 1);
        }
        return npv;
    }

    calculateNativeIRR(values, guess = 0.1) {
        const cleanVals = (values || []).map(v => this.cleanNumericValue(v)).filter(v => v !== null && !isNaN(v));
        // Eliminar ceros finales correspondientes a celdas vacías del rango
        while (cleanVals.length > 2 && cleanVals[cleanVals.length - 1] === 0) {
            cleanVals.pop();
        }
        if (cleanVals.length < 2) return '#¡NUM!';
        const hasPos = cleanVals.some(v => v > 0);
        const hasNeg = cleanVals.some(v => v < 0);
        if (!hasPos || !hasNeg) return '#¡NUM!';

        let rate = (typeof guess === 'number' && !isNaN(guess)) ? guess : 0.1;
        const maxIter = 100;
        const tol = 1e-7;

        for (let iter = 0; iter < maxIter; iter++) {
            if (rate <= -1) rate = -0.9999;
            let npv = 0;
            let dNpv = 0;

            for (let t = 0; t < cleanVals.length; t++) {
                const v = cleanVals[t];
                const denom = Math.pow(1 + rate, t);
                npv += v / denom;
                if (t > 0) {
                    dNpv -= (t * v) / Math.pow(1 + rate, t + 1);
                }
            }

            if (Math.abs(npv) < tol) return rate;

            if (Math.abs(dNpv) < 1e-12) {
                rate += (npv > 0 ? 0.05 : -0.05);
            } else {
                const newRate = rate - (npv / dNpv);
                if (Math.abs(newRate - rate) < tol) return newRate;
                rate = newRate;
            }
        }
        return rate;
    }

    calculateNativePMT(rate, nper, pv, fv = 0, type = 0) {
        if (nper === 0) return 0;
        if (rate === 0) return -(pv + fv) / nper;
        const pvif = Math.pow(1 + rate, nper);
        let pmt = (rate * (pv * pvif + fv)) / (pvif - 1);
        if (type === 1) pmt /= (1 + rate);
        return -pmt;
    }

    calculateNativePV(rate, nper, pmt, fv = 0, type = 0) {
        if (rate === 0) return -(pmt * nper + fv);
        const pvif = Math.pow(1 + rate, nper);
        const f = (type === 1) ? (1 + rate) : 1;
        return -((fv + pmt * f * ((pvif - 1) / rate)) / pvif);
    }

    calculateNativeFV(rate, nper, pmt, pv = 0, type = 0) {
        if (rate === 0) return -(pv + pmt * nper);
        const pvif = Math.pow(1 + rate, nper);
        const f = (type === 1) ? (1 + rate) : 1;
        return -(pv * pvif + pmt * f * ((pvif - 1) / rate));
    }

    evaluateCondition(condStr, sheetData, visited = new Set()) {
        if (!condStr) return false;
        let str = String(condStr).trim();

        // 1. Manejo de funciones lógicas dentro de la condición: AND / Y, OR / O, NOT / NO
        if (/^AND\s*\(/i.test(str)) {
            const inner = str.replace(/^AND\s*\(/i, '').replace(/\)$/, '');
            const args = this.extractArgs(inner);
            return args.every(arg => this.evaluateCondition(arg, sheetData, new Set(visited)));
        }
        if (/^OR\s*\(/i.test(str)) {
            const inner = str.replace(/^OR\s*\(/i, '').replace(/\)$/, '');
            const args = this.extractArgs(inner);
            return args.some(arg => this.evaluateCondition(arg, sheetData, new Set(visited)));
        }
        if (/^NOT\s*\(/i.test(str)) {
            const inner = str.replace(/^NOT\s*\(/i, '').replace(/\)$/, '');
            return !this.evaluateCondition(inner, sheetData, new Set(visited));
        }

        // 2. Operadores de comparación: >=, <=, <>, !=, ==, =, >, <, ≥, ≤, ≠
        const match = str.match(/^(.*?)\s*(>=|<=|<>|!=|==|=|>|<|≥|≤|≠)\s*(.*?)$/);
        if (match) {
            const leftExpr = match[1].trim();
            let op = match[2];
            if (op === '≥') op = '>=';
            else if (op === '≤') op = '<=';
            else if (op === '≠') op = '<>';
            const rightExpr = match[3].trim();

            const leftRaw = this.evaluateNativeFormula(leftExpr, sheetData, new Set(visited));
            const rightRaw = this.evaluateNativeFormula(rightExpr, sheetData, new Set(visited));

            const leftNum = this.cleanNumericValue(leftRaw);
            const rightNum = this.cleanNumericValue(rightRaw);

            if (leftNum !== null && rightNum !== null && !isNaN(leftNum) && !isNaN(rightNum)) {
                if (op === '>=') return leftNum >= rightNum;
                if (op === '<=') return leftNum <= rightNum;
                if (op === '<>' || op === '!=') return leftNum !== rightNum;
                if (op === '=' || op === '==') return leftNum === rightNum;
                if (op === '>') return leftNum > rightNum;
                if (op === '<') return leftNum < rightNum;
            }

            const s1 = String(leftRaw).replace(/^["']|["']$/g, '').trim().toUpperCase();
            const s2 = String(rightRaw).replace(/^["']|["']$/g, '').trim().toUpperCase();

            if (op === '>=') return s1 >= s2;
            if (op === '<=') return s1 <= s2;
            if (op === '<>' || op === '!=') return s1 !== s2;
            if (op === '=' || op === '==') return s1 === s2;
            if (op === '>') return s1 > s2;
            if (op === '<') return s1 < s2;
        }

        // 3. Evaluación booleana directa
        const val = this.evaluateNativeFormula(str, sheetData, new Set(visited));
        const num = this.cleanNumericValue(val);
        if (num !== null) return num !== 0;
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') {
            const clean = val.replace(/^["']|["']$/g, '').trim().toUpperCase();
            return clean === 'TRUE' || clean === 'VERDADERO';
        }
        return !!val;
    }

    evaluateNativeFormula(formulaStr, sheetData, visited = new Set()) {
        if (!formulaStr) return 0;
        try {
            let expr = String(formulaStr).trim();
            if (expr.startsWith('=')) expr = expr.substring(1).trim();

            // Si es un texto puro entre comillas dobles, devolverlo directamente
            if (/^"[^"]*"$/.test(expr)) {
                return expr.slice(1, -1);
            }

            // 1. Normalizar funciones en español y reemplazar punto y coma y operadores unicode
            expr = this.normalizeFormula('=' + expr).substring(1);

            // 2. Funciones Lógicas Clave: IF / SI e IFS / SI.CONJUNTO
            while (/IF\s*\(/i.test(expr)) {
                const ifMatch = expr.match(/IF\s*\(([^()]+(?:\([^()]*\)[^()]*)*)\)/i);
                if (!ifMatch) break;
                const inner = ifMatch[1];
                const args = this.extractArgs(inner);
                if (args.length < 2) {
                    expr = expr.replace(ifMatch[0], '0');
                    continue;
                }
                const cond = this.evaluateCondition(args[0], sheetData, new Set(visited));
                let resultExpr = cond ? args[1] : (args[2] !== undefined ? args[2] : '""');
                const evaluatedRes = this.evaluateNativeFormula(resultExpr, sheetData, new Set(visited));
                const formattedRes = (typeof evaluatedRes === 'string') ? JSON.stringify(evaluatedRes) : evaluatedRes;
                expr = expr.replace(ifMatch[0], String(formattedRes));
            }

            expr = expr.replace(/IFS\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                for (let i = 0; i < args.length; i += 2) {
                    const cond = this.evaluateCondition(args[i], sheetData, new Set(visited));
                    if (cond) {
                        const res = this.evaluateNativeFormula(args[i + 1], sheetData, new Set(visited));
                        return (typeof res === 'string') ? JSON.stringify(res) : String(res);
                    }
                }
                return '#N/A';
            });

            expr = expr.replace(/IFERROR\s*\(([^,]+),\s*([^)]+)\)/gi, (m, valExpr, fallbackExpr) => {
                try {
                    const res = this.evaluateNativeFormula(valExpr, sheetData, new Set(visited));
                    if (res === '#ERROR!' || res === '#VALUE!' || res === '#N/A' || res === '#REF!' || res === '#DIV/0!' || res === '#NUM!' || res === '#¡NUM!') {
                        const fallback = this.evaluateNativeFormula(fallbackExpr, sheetData, new Set(visited));
                        return (typeof fallback === 'string') ? JSON.stringify(fallback) : String(fallback);
                    }
                    return (typeof res === 'string') ? JSON.stringify(res) : String(res);
                } catch (e) {
                    const fallback = this.evaluateNativeFormula(fallbackExpr, sheetData, new Set(visited));
                    return (typeof fallback === 'string') ? JSON.stringify(fallback) : String(fallback);
                }
            });

            expr = expr.replace(/IFNA\s*\(([^,]+),\s*([^)]+)\)/gi, (m, valExpr, fallbackExpr) => {
                const res = this.evaluateNativeFormula(valExpr, sheetData, new Set(visited));
                if (res === '#N/A') {
                    const fallback = this.evaluateNativeFormula(fallbackExpr, sheetData, new Set(visited));
                    return (typeof fallback === 'string') ? JSON.stringify(fallback) : String(fallback);
                }
                return (typeof res === 'string') ? JSON.stringify(res) : String(res);
            });

            // 3. Funciones Tributarias El Salvador (SV)
            expr = expr.replace(/SV_IVA\s*\(([^)]+)\)/gi, (m, inner) => {
                const val = (this.getRangeOrValues(inner, sheetData, new Set(visited))[0] || 0);
                return String(val * 0.13);
            });

            expr = expr.replace(/SV_ISSS_LAB\s*\(([^)]+)\)/gi, (m, inner) => {
                const salary = (this.getRangeOrValues(inner, sheetData, new Set(visited))[0] || 0);
                return String(Math.min(salary, 1000) * 0.03);
            });

            expr = expr.replace(/SV_ISSS_PAT\s*\(([^)]+)\)/gi, (m, inner) => {
                const salary = (this.getRangeOrValues(inner, sheetData, new Set(visited))[0] || 0);
                return String(Math.min(salary, 1000) * 0.075);
            });

            expr = expr.replace(/SV_AFP_LAB\s*\(([^)]+)\)/gi, (m, inner) => {
                const salary = (this.getRangeOrValues(inner, sheetData, new Set(visited))[0] || 0);
                return String(salary * 0.0725);
            });

            expr = expr.replace(/SV_AFP_PAT\s*\(([^)]+)\)/gi, (m, inner) => {
                const salary = (this.getRangeOrValues(inner, sheetData, new Set(visited))[0] || 0);
                return String(salary * 0.0875);
            });

            expr = expr.replace(/SV_ISR\s*\(([^)]+)\)/gi, (m, inner) => {
                const taxable = (this.getRangeOrValues(inner, sheetData, new Set(visited))[0] || 0);
                let isr = 0;
                // Tabla de retención mensual MH Decreto No. 10 (tramo exento hasta $550.00)
                if (taxable <= 550.00) isr = 0;
                else if (taxable <= 895.24) isr = (taxable - 550.00) * 0.10 + 17.67;
                else if (taxable <= 2038.10) isr = (taxable - 895.24) * 0.20 + 60.00;
                else isr = (taxable - 2038.10) * 0.30 + 288.57;
                return String(isr);
            });

            // 4. Funciones Financieras (NPV / VAN, IRR / TIR, PMT / PAGO, PV / VA, FV / VF, SLN, SYD, DDB, DB)
            expr = expr.replace(/NPV\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                if (args.length < 2) return '0';
                const rateVals = this.getRangeOrValues(args[0], sheetData, new Set(visited));
                const rate = rateVals.length ? rateVals[0] : 0;
                const flowValues = [];
                for (let i = 1; i < args.length; i++) {
                    flowValues.push(...this.getRangeOrValues(args[i], sheetData, new Set(visited)));
                }
                return String(this.calculateNativeNPV(rate, flowValues));
            });

            expr = expr.replace(/IRR\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                if (args.length < 1) return '0';
                const flowValues = [];
                for (let i = 0; i < (args.length > 1 ? args.length - 1 : args.length); i++) {
                    flowValues.push(...this.getRangeOrValues(args[i], sheetData, new Set(visited)));
                }
                const guessVals = args.length > 1 ? this.getRangeOrValues(args[args.length - 1], sheetData, new Set(visited)) : [0.1];
                const guess = guessVals.length ? guessVals[0] : 0.1;
                return String(this.calculateNativeIRR(flowValues, guess));
            });

            expr = expr.replace(/PMT\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                if (args.length < 3) return '0';
                const rate = (this.getRangeOrValues(args[0], sheetData, new Set(visited))[0] || 0);
                const nper = (this.getRangeOrValues(args[1], sheetData, new Set(visited))[0] || 0);
                const pv = (this.getRangeOrValues(args[2], sheetData, new Set(visited))[0] || 0);
                const fv = args[3] ? (this.getRangeOrValues(args[3], sheetData, new Set(visited))[0] || 0) : 0;
                const type = args[4] ? (this.getRangeOrValues(args[4], sheetData, new Set(visited))[0] || 0) : 0;
                return String(this.calculateNativePMT(rate, nper, pv, fv, type));
            });

            expr = expr.replace(/PV\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                if (args.length < 3) return '0';
                const rate = (this.getRangeOrValues(args[0], sheetData, new Set(visited))[0] || 0);
                const nper = (this.getRangeOrValues(args[1], sheetData, new Set(visited))[0] || 0);
                const pmt = (this.getRangeOrValues(args[2], sheetData, new Set(visited))[0] || 0);
                const fv = args[3] ? (this.getRangeOrValues(args[3], sheetData, new Set(visited))[0] || 0) : 0;
                const type = args[4] ? (this.getRangeOrValues(args[4], sheetData, new Set(visited))[0] || 0) : 0;
                return String(this.calculateNativePV(rate, nper, pmt, fv, type));
            });

            expr = expr.replace(/FV\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                if (args.length < 3) return '0';
                const rate = (this.getRangeOrValues(args[0], sheetData, new Set(visited))[0] || 0);
                const nper = (this.getRangeOrValues(args[1], sheetData, new Set(visited))[0] || 0);
                const pmt = (this.getRangeOrValues(args[2], sheetData, new Set(visited))[0] || 0);
                const pv = args[3] ? (this.getRangeOrValues(args[3], sheetData, new Set(visited))[0] || 0) : 0;
                const type = args[4] ? (this.getRangeOrValues(args[4], sheetData, new Set(visited))[0] || 0) : 0;
                return String(this.calculateNativeFV(rate, nper, pmt, pv, type));
            });

            expr = expr.replace(/SLN\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                if (args.length < 3) return '0';
                const cost = (this.getRangeOrValues(args[0], sheetData, new Set(visited))[0] || 0);
                const salvage = (this.getRangeOrValues(args[1], sheetData, new Set(visited))[0] || 0);
                const life = (this.getRangeOrValues(args[2], sheetData, new Set(visited))[0] || 1);
                return String(life !== 0 ? (cost - salvage) / life : 0);
            });

            expr = expr.replace(/SYD\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                if (args.length < 4) return '0';
                const cost = (this.getRangeOrValues(args[0], sheetData, new Set(visited))[0] || 0);
                const salvage = (this.getRangeOrValues(args[1], sheetData, new Set(visited))[0] || 0);
                const life = (this.getRangeOrValues(args[2], sheetData, new Set(visited))[0] || 1);
                const per = (this.getRangeOrValues(args[3], sheetData, new Set(visited))[0] || 1);
                const syd = ((cost - salvage) * (life - per + 1) * 2) / (life * (life + 1));
                return String(syd);
            });

            expr = expr.replace(/DDB\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                if (args.length < 4) return '0';
                const cost = (this.getRangeOrValues(args[0], sheetData, new Set(visited))[0] || 0);
                const salvage = (this.getRangeOrValues(args[1], sheetData, new Set(visited))[0] || 0);
                const life = (this.getRangeOrValues(args[2], sheetData, new Set(visited))[0] || 1);
                const per = (this.getRangeOrValues(args[3], sheetData, new Set(visited))[0] || 1);
                const factor = args[4] ? (this.getRangeOrValues(args[4], sheetData, new Set(visited))[0] || 2) : 2;
                let currentBookVal = cost;
                let dep = 0;
                for (let i = 1; i <= per; i++) {
                    dep = Math.min(currentBookVal - salvage, (currentBookVal * factor) / life);
                    currentBookVal -= dep;
                }
                return String(Math.max(0, dep));
            });

            // 5. Funciones de Búsqueda y Referencia (INDEX, MATCH, VLOOKUP, HLOOKUP, XLOOKUP, CHOOSE)
            expr = expr.replace(/INDEX\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                if (args.length < 2) return '0';
                const rangeMatch = args[0].match(/^(\$?[A-Za-z]+\$?\d+)\s*:\s*(\$?[A-Za-z]+\$?\d+)$/);
                if (!rangeMatch) return '0';
                const pStart = this.parseCellRef(rangeMatch[1]);
                const pEnd = this.parseCellRef(rangeMatch[2]);
                if (!pStart || !pEnd) return '0';
                const rowOffset = parseInt(this.evaluateNativeFormula(args[1], sheetData, new Set(visited)), 10) - 1;
                const colOffset = args[2] ? (parseInt(this.evaluateNativeFormula(args[2], sheetData, new Set(visited)), 10) - 1) : 0;
                const targetRow = Math.min(pStart.row, pEnd.row) + rowOffset;
                const targetCol = Math.min(pStart.col, pEnd.col) + colOffset;
                const cd = sheetData ? sheetData[`${targetRow}_${targetCol}`] : null;
                const res = this.getRawCellValue(cd, sheetData, new Set(visited));
                return (typeof res === 'string') ? JSON.stringify(res) : String(res);
            });

            expr = expr.replace(/MATCH\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                if (args.length < 2) return '#N/A';
                const searchVal = this.evaluateNativeFormula(args[0], sheetData, new Set(visited));
                const list = this.getRangeOrValues(args[1], sheetData, new Set(visited));
                const sValClean = String(searchVal).replace(/^["']|["']$/g, '').trim().toUpperCase();
                const idx = list.findIndex(item => String(item).trim().toUpperCase() === sValClean);
                return idx !== -1 ? String(idx + 1) : '#N/A';
            });

            expr = expr.replace(/VLOOKUP\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                if (args.length < 3) return '#N/A';
                const searchVal = this.evaluateNativeFormula(args[0], sheetData, new Set(visited));
                const rangeMatch = args[1].match(/^(\$?[A-Za-z]+\$?\d+)\s*:\s*(\$?[A-Za-z]+\$?\d+)$/);
                if (!rangeMatch) return '#N/A';
                const pStart = this.parseCellRef(rangeMatch[1]);
                const pEnd = this.parseCellRef(rangeMatch[2]);
                const colIdx = parseInt(this.evaluateNativeFormula(args[2], sheetData, new Set(visited)), 10) - 1;
                const sValClean = String(searchVal).replace(/^["']|["']$/g, '').trim().toUpperCase();

                const rMin = Math.min(pStart.row, pEnd.row);
                const rMax = Math.max(pStart.row, pEnd.row);
                const cMin = Math.min(pStart.col, pEnd.col);

                for (let r = rMin; r <= rMax; r++) {
                    const firstCd = sheetData ? sheetData[`${r}_${cMin}`] : null;
                    const firstVal = this.getRawCellValue(firstCd, sheetData, new Set(visited));
                    if (String(firstVal).trim().toUpperCase() === sValClean) {
                        const targetCd = sheetData ? sheetData[`${r}_${cMin + colIdx}`] : null;
                        const res = this.getRawCellValue(targetCd, sheetData, new Set(visited));
                        return (typeof res === 'string') ? JSON.stringify(res) : String(res);
                    }
                }
                return '#N/A';
            });

            expr = expr.replace(/CHOOSE\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                if (args.length < 2) return '#VALUE!';
                const idx = parseInt(this.evaluateNativeFormula(args[0], sheetData, new Set(visited)), 10);
                if (isNaN(idx) || idx < 1 || idx >= args.length) return '#VALUE!';
                const res = this.evaluateNativeFormula(args[idx], sheetData, new Set(visited));
                return (typeof res === 'string') ? JSON.stringify(res) : String(res);
            });

            // 6. Funciones de Texto (CONCATENATE, CONCAT, TEXTJOIN, UPPER, LOWER, PROPER, LEFT, RIGHT, MID, LEN, TRIM, EXACT, REPT)
            expr = expr.replace(/(CONCATENATE|CONCAT)\s*\(([^)]+)\)/gi, (m, fn, inner) => {
                const args = this.extractArgs(inner);
                const parts = [];
                for (const arg of args) {
                    const vals = this.getRangeOrValues(arg, sheetData, new Set(visited));
                    for (const v of vals) parts.push(String(v));
                }
                return JSON.stringify(parts.join(''));
            });

            expr = expr.replace(/TEXTJOIN\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                if (args.length < 3) return '""';
                const delim = String(this.evaluateNativeFormula(args[0], sheetData, new Set(visited))).replace(/^["']|["']$/g, '');
                const ignoreEmpty = String(args[1]).toUpperCase() === 'TRUE' || args[1] === '1';
                const parts = [];
                for (let i = 2; i < args.length; i++) {
                    const vals = this.getRangeOrValues(args[i], sheetData, new Set(visited));
                    for (const v of vals) {
                        const s = String(v);
                        if (!ignoreEmpty || s.trim() !== '') parts.push(s);
                    }
                }
                return JSON.stringify(parts.join(delim));
            });

            expr = expr.replace(/UPPER\s*\(([^)]+)\)/gi, (m, inner) => {
                const val = String(this.evaluateNativeFormula(inner, sheetData, new Set(visited))).replace(/^["']|["']$/g, '');
                return JSON.stringify(val.toUpperCase());
            });

            expr = expr.replace(/LOWER\s*\(([^)]+)\)/gi, (m, inner) => {
                const val = String(this.evaluateNativeFormula(inner, sheetData, new Set(visited))).replace(/^["']|["']$/g, '');
                return JSON.stringify(val.toLowerCase());
            });

            expr = expr.replace(/PROPER\s*\(([^)]+)\)/gi, (m, inner) => {
                const val = String(this.evaluateNativeFormula(inner, sheetData, new Set(visited))).replace(/^["']|["']$/g, '');
                const res = val.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                return JSON.stringify(res);
            });

            expr = expr.replace(/LEFT\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                const str = String(this.evaluateNativeFormula(args[0], sheetData, new Set(visited))).replace(/^["']|["']$/g, '');
                const num = args[1] ? (parseInt(this.evaluateNativeFormula(args[1], sheetData, new Set(visited)), 10) || 1) : 1;
                return JSON.stringify(str.substring(0, num));
            });

            expr = expr.replace(/RIGHT\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                const str = String(this.evaluateNativeFormula(args[0], sheetData, new Set(visited))).replace(/^["']|["']$/g, '');
                const num = args[1] ? (parseInt(this.evaluateNativeFormula(args[1], sheetData, new Set(visited)), 10) || 1) : 1;
                return JSON.stringify(str.substring(Math.max(0, str.length - num)));
            });

            expr = expr.replace(/MID\s*\(([^)]+)\)/gi, (m, inner) => {
                const args = this.extractArgs(inner);
                const str = String(this.evaluateNativeFormula(args[0], sheetData, new Set(visited))).replace(/^["']|["']$/g, '');
                const start = (parseInt(this.evaluateNativeFormula(args[1], sheetData, new Set(visited)), 10) || 1) - 1;
                const num = parseInt(this.evaluateNativeFormula(args[2], sheetData, new Set(visited)), 10) || 0;
                return JSON.stringify(str.substring(start, start + num));
            });

            expr = expr.replace(/LEN\s*\(([^)]+)\)/gi, (m, inner) => {
                const val = String(this.evaluateNativeFormula(inner, sheetData, new Set(visited))).replace(/^["']|["']$/g, '');
                return String(val.length);
            });

            expr = expr.replace(/TRIM\s*\(([^)]+)\)/gi, (m, inner) => {
                const val = String(this.evaluateNativeFormula(inner, sheetData, new Set(visited))).replace(/^["']|["']$/g, '');
                return JSON.stringify(val.trim().replace(/\s+/g, ' '));
            });

            expr = expr.replace(/REPT\s*\(([^,]+),\s*([^)]+)\)/gi, (m, strExpr, numExpr) => {
                const s = String(this.evaluateNativeFormula(strExpr, sheetData, new Set(visited))).replace(/^["']|["']$/g, '');
                const count = parseInt(this.evaluateNativeFormula(numExpr, sheetData, new Set(visited)), 10) || 0;
                return JSON.stringify(s.repeat(Math.max(0, count)));
            });

            // 7. Funciones de Fecha y Hora (TODAY, NOW, DATE, YEAR, MONTH, DAY, DAYS, EDATE, EOMONTH)
            expr = expr.replace(/TODAY\s*\(\s*\)/gi, () => {
                const d = new Date();
                return JSON.stringify(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
            });

            expr = expr.replace(/NOW\s*\(\s*\)/gi, () => {
                const d = new Date();
                return JSON.stringify(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
            });

            expr = expr.replace(/DAYS\s*\(([^,]+),\s*([^)]+)\)/gi, (m, endExpr, startExpr) => {
                const d1 = new Date(this.evaluateNativeFormula(endExpr, sheetData, new Set(visited)));
                const d2 = new Date(this.evaluateNativeFormula(startExpr, sheetData, new Set(visited)));
                const diffTime = d1.getTime() - d2.getTime();
                return String(Math.round(diffTime / (1000 * 60 * 60 * 24)));
            });

            expr = expr.replace(/YEAR\s*\(([^)]+)\)/gi, (m, inner) => {
                const d = new Date(this.evaluateNativeFormula(inner, sheetData, new Set(visited)));
                return isNaN(d.getFullYear()) ? '0' : String(d.getFullYear());
            });

            expr = expr.replace(/MONTH\s*\(([^)]+)\)/gi, (m, inner) => {
                const d = new Date(this.evaluateNativeFormula(inner, sheetData, new Set(visited)));
                return isNaN(d.getMonth()) ? '0' : String(d.getMonth() + 1);
            });

            expr = expr.replace(/DAY\s*\(([^)]+)\)/gi, (m, inner) => {
                const d = new Date(this.evaluateNativeFormula(inner, sheetData, new Set(visited)));
                return isNaN(d.getDate()) ? '0' : String(d.getDate());
            });

            // 8. Funciones de Agregación y Matemáticas (SUM, AVERAGE, COUNT, COUNTA, COUNTBLANK, MAX, MIN, PRODUCT, MEDIAN)
            expr = expr.replace(/(SUM|AVERAGE|COUNT|COUNTA|COUNTBLANK|MAX|MIN|PRODUCT|MEDIAN)\s*\(\s*(\$?[A-Za-z]+\$?\d+)\s*:\s*(\$?[A-Za-z]+\$?\d+)\s*\)/gi, (match, func, startRef, endRef) => {
                const pStart = this.parseCellRef(startRef);
                const pEnd = this.parseCellRef(endRef);
                if (!pStart || !pEnd) return '0';

                const values = [];
                let blankCount = 0;
                for (let r = Math.min(pStart.row, pEnd.row); r <= Math.max(pStart.row, pEnd.row); r++) {
                    for (let c = Math.min(pStart.col, pEnd.col); c <= Math.max(pStart.col, pEnd.col); c++) {
                        const cd = sheetData ? sheetData[`${r}_${c}`] : null;
                        const val = this.getRawCellValue(cd, sheetData, new Set(visited));
                        if (val === null || val === undefined || val === '') {
                            blankCount++;
                        } else if (typeof val === 'number' && !isNaN(val)) {
                            values.push(val);
                        } else {
                            const num = this.cleanNumericValue(val);
                            if (num !== null) values.push(num);
                        }
                    }
                }

                const fnName = func.toUpperCase();
                if (fnName === 'SUM') return String(values.reduce((a, b) => a + b, 0));
                if (fnName === 'AVERAGE') return values.length ? String(values.reduce((a, b) => a + b, 0) / values.length) : '0';
                if (fnName === 'COUNT') return String(values.length);
                if (fnName === 'COUNTA') return String(values.length);
                if (fnName === 'COUNTBLANK') return String(blankCount);
                if (fnName === 'MAX') return values.length ? String(Math.max(...values)) : '0';
                if (fnName === 'MIN') return values.length ? String(Math.min(...values)) : '0';
                if (fnName === 'PRODUCT') return values.length ? String(values.reduce((a, b) => a * b, 1)) : '0';
                if (fnName === 'MEDIAN') {
                    if (!values.length) return '0';
                    values.sort((a, b) => a - b);
                    const mid = Math.floor(values.length / 2);
                    return String(values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2);
                }
                return '0';
            });

            // 9. Funciones Matemáticas (ROUND, ROUNDUP, ROUNDDOWN, INT, TRUNC, ABS, SQRT, POWER, MOD, SIGN)
            expr = expr.replace(/ROUND\s*\(([^,]+),\s*(\d+)\)/gi, (m, inner, decimals) => {
                try {
                    const innerVal = this.evaluateNativeFormula(inner, sheetData, new Set(visited));
                    const val = parseFloat(innerVal);
                    return isNaN(val) ? '0' : String(Number(val.toFixed(parseInt(decimals, 10))));
                } catch (e) { return '0'; }
            });

            expr = expr.replace(/ROUNDUP\s*\(([^,]+),\s*(\d+)\)/gi, (m, inner, decimals) => {
                const val = parseFloat(this.evaluateNativeFormula(inner, sheetData, new Set(visited))) || 0;
                const d = parseInt(decimals, 10) || 0;
                const factor = Math.pow(10, d);
                return String(Math.ceil(val * factor) / factor);
            });

            expr = expr.replace(/ROUNDDOWN\s*\(([^,]+),\s*(\d+)\)/gi, (m, inner, decimals) => {
                const val = parseFloat(this.evaluateNativeFormula(inner, sheetData, new Set(visited))) || 0;
                const d = parseInt(decimals, 10) || 0;
                const factor = Math.pow(10, d);
                return String(Math.floor(val * factor) / factor);
            });

            expr = expr.replace(/INT\s*\(([^)]+)\)/gi, (m, inner) => {
                const val = this.evaluateNativeFormula(inner, sheetData, new Set(visited));
                return `Math.floor(${val})`;
            });

            expr = expr.replace(/TRUNC\s*\(([^)]+)\)/gi, (m, inner) => {
                const val = this.evaluateNativeFormula(inner, sheetData, new Set(visited));
                return `Math.trunc(${val})`;
            });

            expr = expr.replace(/ABS\s*\(([^)]+)\)/gi, (m, inner) => {
                const val = this.evaluateNativeFormula(inner, sheetData, new Set(visited));
                return `Math.abs(${val})`;
            });

            expr = expr.replace(/SQRT\s*\(([^)]+)\)/gi, (m, inner) => {
                const val = this.evaluateNativeFormula(inner, sheetData, new Set(visited));
                return `Math.sqrt(${val})`;
            });

            expr = expr.replace(/POWER\s*\(([^,]+),\s*([^)]+)\)/gi, (m, b, e) => {
                const bVal = this.evaluateNativeFormula(b, sheetData, new Set(visited));
                const eVal = this.evaluateNativeFormula(e, sheetData, new Set(visited));
                return `Math.pow(${bVal}, ${eVal})`;
            });

            expr = expr.replace(/MOD\s*\(([^,]+),\s*([^)]+)\)/gi, (m, n, d) => {
                const nVal = this.evaluateNativeFormula(n, sheetData, new Set(visited));
                const dVal = this.evaluateNativeFormula(d, sheetData, new Set(visited));
                return `(${nVal} % ${dVal})`;
            });

            expr = expr.replace(/SIGN\s*\(([^)]+)\)/gi, (m, inner) => {
                const val = parseFloat(this.evaluateNativeFormula(inner, sheetData, new Set(visited))) || 0;
                return String(Math.sign(val));
            });

            expr = expr.replace(/PI\s*\(\s*\)/gi, 'Math.PI');

            // 10. Reemplazar porcentajes literales (e.g. "4%" -> "(0.04)" o "100%" -> "(1)")
            expr = expr.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)');

            // 11. Potencia con ^
            expr = expr.replace(/\^/g, '**');

            // 12. Reemplazo de referencias de celdas individuales (con o sin $): $D$3, $B$3, C6, D$3, $D3
            expr = expr.replace(/(\$?[A-Za-z]+\$?\d+)/g, (match) => {
                const p = this.parseCellRef(match);
                if (!p) return '0';
                const cd = sheetData ? sheetData[`${p.row}_${p.col}`] : null;
                const val = this.getRawCellValue(cd, sheetData, new Set(visited));
                if (typeof val === 'number' && !isNaN(val)) return String(val);
                if (typeof val === 'string') return JSON.stringify(val);
                return '0';
            });

            // 13. Evaluar expresión final de forma segura
            //     Guardia de seguridad: tras la traducción solo pueden quedar números,
            //     operadores, literales de texto y Math.* permitidos. Cualquier otro
            //     identificador (fetch, window, constructor…) se rechaza antes de Function().
            const isSafe = (window.EduSec && typeof window.EduSec.isSafeExpression === 'function')
                ? window.EduSec.isSafeExpression(expr)
                : /^[\d\s.+\-*/%()<>=!?:&|,]*$/.test(expr.replace(/"(?:[^"\\]|\\.)*"/g, '0').replace(/\bMath\.[a-zA-Z0-9]+\b/g, '0'));
            if (!isSafe) {
                console.warn('Fórmula bloqueada por contener elementos no permitidos:', formulaStr);
                return '#ERROR!';
            }
            const safeResult = Function(`"use strict"; return (${expr});`)();
            if (typeof safeResult === 'number') {
                return isNaN(safeResult) || !isFinite(safeResult) ? 0 : safeResult;
            }
            return safeResult !== undefined && safeResult !== null ? safeResult : 0;
        } catch (e) {
            console.warn('Error en evaluación nativa de fórmula:', formulaStr, e);
            return '#ERROR!';
        }
    }

    // === EVENTOS NATIVOS & DRAG AND DROP ===
    bindEvents() {
        // Drag and Drop para Cabeceras de Columnas y Filas
        this.container.addEventListener('dragstart', (e) => {
            const th = e.target.closest('th[data-col]');
            if (th) {
                const c = parseInt(th.getAttribute('data-col'), 10);
                this.draggedHeaderType = 'col';
                this.draggedHeaderIdx = c;
                e.dataTransfer.setData('text/plain', `col:${c}`);
                e.dataTransfer.effectAllowed = 'move';
                return;
            }

            const rowHeaderTd = e.target.closest('td[data-row-idx]');
            if (rowHeaderTd) {
                const r = parseInt(rowHeaderTd.getAttribute('data-row-idx'), 10);
                this.draggedHeaderType = 'row';
                this.draggedHeaderIdx = r;
                e.dataTransfer.setData('text/plain', `row:${r}`);
                e.dataTransfer.effectAllowed = 'move';
                return;
            }
        });

        this.container.addEventListener('dragover', (e) => {
            const th = e.target.closest('th[data-col]');
            const rowHeaderTd = e.target.closest('td[data-row-idx]');

            if ((this.draggedHeaderType === 'col' && th) || (this.draggedHeaderType === 'row' && rowHeaderTd)) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            }
        });

        this.container.addEventListener('drop', (e) => {
            if (this.draggedHeaderType === 'col') {
                const th = e.target.closest('th[data-col]');
                if (th) {
                    e.preventDefault();
                    const targetCol = parseInt(th.getAttribute('data-col'), 10);
                    this.moveCol(this.draggedHeaderIdx, targetCol);
                    this.draggedHeaderType = null;
                    this.draggedHeaderIdx = -1;
                }
            } else if (this.draggedHeaderType === 'row') {
                const rowHeaderTd = e.target.closest('td[data-row-idx]');
                if (rowHeaderTd) {
                    e.preventDefault();
                    const targetRow = parseInt(rowHeaderTd.getAttribute('data-row-idx'), 10);
                    this.moveRow(this.draggedHeaderIdx, targetRow);
                    this.draggedHeaderType = null;
                    this.draggedHeaderIdx = -1;
                }
            }
        });

        // Redimensionado con Mouse
        this.container.addEventListener('mousedown', (e) => {
            const colResizeHandle = e.target.closest('[data-col-resize]');
            if (colResizeHandle) {
                this.isResizingCol = true;
                this.resizingColIdx = parseInt(colResizeHandle.getAttribute('data-col-resize'), 10);
                this.resizeStartX = e.clientX;
                const sheet = this.sheets[this.activeSheetIndex];
                sheet.colWidths = sheet.colWidths || {};
                this.resizeStartWidth = sheet.colWidths[this.resizingColIdx] || this.options.defaultColWidth;
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            const rowResizeHandle = e.target.closest('[data-row-resize]');
            if (rowResizeHandle) {
                this.isResizingRow = true;
                this.resizingRowIdx = parseInt(rowResizeHandle.getAttribute('data-row-resize'), 10);
                this.resizeStartY = e.clientY;
                const sheet = this.sheets[this.activeSheetIndex];
                sheet.rowHeights = sheet.rowHeights || {};
                this.resizeStartHeight = sheet.rowHeights[this.resizingRowIdx] || this.options.defaultRowHeight;
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isResizingCol) {
                const deltaX = e.clientX - this.resizeStartX;
                const newWidth = Math.max(45, this.resizeStartWidth + deltaX);
                const sheet = this.sheets[this.activeSheetIndex];
                sheet.colWidths = sheet.colWidths || {};
                sheet.colWidths[this.resizingColIdx] = newWidth;
                if (!this._resizeRaf) {
                    const colIdx = this.resizingColIdx;
                    this._resizeRaf = requestAnimationFrame(() => {
                        this._resizeRaf = null;
                        const th = this.theadEl ? this.theadEl.querySelector(`th[data-col="${colIdx}"]`) : null;
                        if (th) {
                            th.style.width = `${newWidth}px`;
                            th.style.minWidth = `${newWidth}px`;
                        }
                        if (this.tbodyEl) {
                            this.tbodyEl.querySelectorAll(`td[data-col="${colIdx}"]:not([colspan])`).forEach(td => {
                                td.style.width = `${newWidth}px`;
                                td.style.maxWidth = `${newWidth}px`;
                            });
                        }
                    });
                }
                return;
            }

            if (this.isResizingRow) {
                const deltaY = e.clientY - this.resizeStartY;
                const newHeight = Math.max(20, this.resizeStartHeight + deltaY);
                const sheet = this.sheets[this.activeSheetIndex];
                sheet.rowHeights = sheet.rowHeights || {};
                sheet.rowHeights[this.resizingRowIdx] = newHeight;
                if (!this._resizeRaf) {
                    const rowIdx = this.resizingRowIdx;
                    this._resizeRaf = requestAnimationFrame(() => {
                        this._resizeRaf = null;
                        const rowHeader = this.tbodyEl ? this.tbodyEl.querySelector(`td[data-row-idx="${rowIdx}"]`) : null;
                        if (rowHeader && rowHeader.parentElement) {
                            rowHeader.parentElement.style.height = `${newHeight}px`;
                        }
                    });
                }
                return;
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isResizingCol || this.isResizingRow) {
                if (this._resizeRaf) {
                    cancelAnimationFrame(this._resizeRaf);
                    this._resizeRaf = null;
                }
                this.isResizingCol = false;
                this.isResizingRow = false;
                this.render();
                if (typeof this.options.onChange === 'function') this.options.onChange();
            }
            this.isDragSelecting = false;
            if (this.isFormulaPickingDrag) {
                this.isFormulaPickingDrag = false;
                const activeInput = this.getActiveFormulaEditor();
                if (activeInput) {
                    activeInput.focus();
                    if (typeof activeInput.setSelectionRange === 'function') {
                        activeInput.setSelectionRange(activeInput.value.length, activeInput.value.length);
                    }
                }
            }

            if (this.isDraggingFillHandle) {
                this.isDraggingFillHandle = false;
                this.clearAutofillPreview();
                if (this.fillSourceRange && this.fillTargetRange) {
                    const src = this.fillSourceRange;
                    const dest = this.fillTargetRange;
                    if (src.r1 !== dest.r1 || src.r2 !== dest.r2 || src.c1 !== dest.c1 || src.c2 !== dest.c2) {
                        this.executeAutoFill(src.r1, src.r2, src.c1, src.c2, dest.r1, dest.r2, dest.c1, dest.c2);
                    }
                }
                this.fillSourceRange = null;
                this.fillTargetRange = null;
            }

            if (this.isDraggingCellMove) {
                this.isDraggingCellMove = false;
                this.clearCellMovePreview();
                if (this.cellMoveSource && this.cellMoveTarget) {
                    const src = this.cellMoveSource;
                    const dest = this.cellMoveTarget;
                    if (src.r1 !== dest.destRow || src.c1 !== dest.destCol) {
                        this.moveCellRange(src.r1, src.r2, src.c1, src.c2, dest.destRow, dest.destCol);
                    }
                }
                this.cellMoveSource = null;
                this.cellMoveTarget = null;
            }
        });

        // Eventos en Cabeceras de Columnas (thead)
        this.theadEl.addEventListener('mousedown', (e) => {
            if (this.isResizingCol || this.isResizingRow) return;

            const th = e.target.closest('th[data-col]');
            if (!th) return;
            const c = parseInt(th.getAttribute('data-col'), 10);
            this.activeHeaderType = 'col';
            this.targetHeaderCol = c;

            if (e.button === 2 || e.target.closest('.col-menu-trigger')) {
                e.preventDefault();
                e.stopPropagation();
                this.selectFullCol(c);
                this.openColHeaderMenu(c, e.clientX, e.clientY);
                return;
            }

            this.hideAllMenus();
            this.selectFullCol(c);
        });

        this.theadEl.addEventListener('contextmenu', (e) => {
            const th = e.target.closest('th[data-col]');
            if (th) {
                e.preventDefault();
                const c = parseInt(th.getAttribute('data-col'), 10);
                this.activeHeaderType = 'col';
                this.targetHeaderCol = c;
                this.selectFullCol(c);
                this.openColHeaderMenu(c, e.clientX, e.clientY);
            }
        });

        // Eventos en Celdas y Cabeceras de Filas (tbody)
        this.tbodyEl.addEventListener('mousedown', (e) => {
            if (this.isResizingCol || this.isResizingRow) return;

            const rowHeaderTd = e.target.closest('td[data-row-idx]');
            if (rowHeaderTd) {
                const r = parseInt(rowHeaderTd.getAttribute('data-row-idx'), 10);
                this.activeHeaderType = 'row';
                this.targetHeaderRow = r;

                if (e.button === 2 || e.target.closest('.row-menu-trigger')) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.selectFullRow(r);
                    this.openRowHeaderMenu(r, e.clientX, e.clientY);
                    return;
                }

                this.hideAllMenus();
                this.selectFullRow(r);
                return;
            }

            // 1. Arrastre de Autorrelleno (Fill Handle)
            const fillHandle = e.target.closest('.cell-fill-handle');
            if (fillHandle) {
                e.preventDefault();
                e.stopPropagation();
                const rMin = Math.min(this.selectStartRow, this.selectEndRow);
                const rMax = Math.max(this.selectStartRow, this.selectEndRow);
                const cMin = Math.min(this.selectStartCol, this.selectEndCol);
                const cMax = Math.max(this.selectStartCol, this.selectEndCol);
                this.isDraggingFillHandle = true;
                this.fillSourceRange = { r1: rMin, r2: rMax, c1: cMin, c2: cMax };
                this.fillTargetRange = { r1: rMin, r2: rMax, c1: cMin, c2: cMax };
                return;
            }

            const td = e.target.closest('td[data-row]');
            if (!td) return;
            const r = parseInt(td.getAttribute('data-row'), 10);
            const c = parseInt(td.getAttribute('data-col'), 10);

            if (e.button === 2) {
                e.preventDefault();
                this.selectCell(r, c, false);
                this.openContextMenu(e.clientX, e.clientY);
                return;
            }

            this.hideAllMenus();

            // 2. Detección infalible de Doble Clic (F2 / Edición directa)
            const now = Date.now();
            const isDoubleClick = (this.lastClickCell && this.lastClickCell.r === r && this.lastClickCell.c === c && (now - this.lastClickTime < 350));
            this.lastClickCell = { r, c };
            this.lastClickTime = now;

            if (isDoubleClick) {
                this.isDragSelecting = false;
                this.isDraggingFillHandle = false;
                this.isDraggingCellMove = false;
                this.startInlineEditing(r, c);
                return;
            }

            // 3. Si hay un editor de fórmulas activo (en celda o barra de fórmulas), iniciar o actualizar selección de rango
            const activeFormulaEditor = this.getActiveFormulaEditor();
            if (activeFormulaEditor) {
                const val = activeFormulaEditor.value || '';
                if (val.startsWith('=')) {
                    e.preventDefault();
                    this.startFormulaRangePick(activeFormulaEditor, r, c);
                    return;
                }
            }

            // 4. Mover celdas arrastrando el borde (Drag to Move)
            const rMin = Math.min(this.selectStartRow, this.selectEndRow);
            const rMax = Math.max(this.selectStartRow, this.selectEndRow);
            const cMin = Math.min(this.selectStartCol, this.selectEndCol);
            const cMax = Math.max(this.selectStartCol, this.selectEndCol);
            const isInSelection = (r >= rMin && r <= rMax && c >= cMin && c <= cMax);
            const isEdge = (r === rMin || r === rMax || c === cMin || c === cMax);

            if (isInSelection && isEdge && !e.shiftKey && (e.target.classList.contains('cell-move-edge') || isEdge)) {
                this.isDraggingCellMove = true;
                this.cellMoveSource = { r1: rMin, r2: rMax, c1: cMin, c2: cMax, clickR: r, clickC: c };
                this.cellMoveTarget = { destRow: rMin, destCol: cMin };
            }

            // 5. Si no es fórmula, selección normal de celdas
            if (document.activeElement && document.activeElement !== document.body && document.activeElement.id !== 'educonta-active-cell-input') {
                document.activeElement.blur();
            }

            this.isFormulaBarActive = false;
            this.isFormulaPicking = false;
            this.isFormulaPickingContinuous = false;
            this.isDragSelecting = true;
            this.selectCell(r, c, e.shiftKey);
            e.preventDefault();
        });

        this.tbodyEl.addEventListener('contextmenu', (e) => {
            const rowHeaderTd = e.target.closest('td[data-row-idx]');
            if (rowHeaderTd) {
                e.preventDefault();
                const r = parseInt(rowHeaderTd.getAttribute('data-row-idx'), 10);
                this.activeHeaderType = 'row';
                this.targetHeaderRow = r;
                this.selectFullRow(r);
                this.openRowHeaderMenu(r, e.clientX, e.clientY);
                return;
            }
            e.preventDefault();
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#educonta-context-menu, #educonta-col-header-menu, #educonta-row-header-menu, .col-menu-trigger, .row-menu-trigger')) {
                this.hideAllMenus();
            }
            if (!e.target.closest('#educonta-formula-autocomplete')) {
                this.hideFormulaAutocomplete();
            }
        });

        this.tbodyEl.addEventListener('mouseover', (e) => {
            const td = e.target.closest('td[data-row]');
            if (!td) return;
            const r = parseInt(td.getAttribute('data-row'), 10);
            const c = parseInt(td.getAttribute('data-col'), 10);

            if (this.isDraggingFillHandle) {
                this.updateFillHandleDrag(r, c);
                return;
            }

            if (this.isDraggingCellMove) {
                this.updateCellMoveDrag(r, c);
                return;
            }

            if (this.isFormulaPickingDrag) {
                this.updateFormulaRangePickDrag(r, c);
                return;
            }

            if (this.isDragSelecting) {
                this.selectCell(r, c, true);
            }
        });

        this.tbodyEl.addEventListener('dblclick', (e) => {
            const td = e.target.closest('td[data-row]');
            if (!td) return;
            const r = parseInt(td.getAttribute('data-row'), 10);
            const c = parseInt(td.getAttribute('data-col'), 10);
            this.startInlineEditing(r, c);
        });

        document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));

        const btnAddSheet = this.container.querySelector('#btn-add-sheet');
        if (btnAddSheet) {
            btnAddSheet.addEventListener('click', () => this.addSheet());
        }
    }

    // === GESTIÓN DE AUTORRELLENO / EXPANSIÓN (FILL HANDLE) ===
    renderAutofillPreview() {
        this.clearAutofillPreview();
        if (!this.fillTargetRange) return;
        const { r1, r2, c1, c2 } = this.fillTargetRange;
        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                const td = this.container.querySelector(`#cell_${r}_${c}`);
                if (td) td.classList.add('autofill-preview-cell');
            }
        }
    }

    clearAutofillPreview() {
        const prev = this.container.querySelectorAll('.autofill-preview-cell');
        prev.forEach(td => td.classList.remove('autofill-preview-cell'));
    }

    updateFillHandleDrag(hoverR, hoverC) {
        if (!this.isDraggingFillHandle || !this.fillSourceRange) return;
        const src = this.fillSourceRange;
        const dR = hoverR - (hoverR > src.r2 ? src.r2 : (hoverR < src.r1 ? src.r1 : src.r2));
        const dC = hoverC - (hoverC > src.c2 ? src.c2 : (hoverC < src.c1 ? src.c1 : src.c2));

        let destR1 = src.r1, destR2 = src.r2, destC1 = src.c1, destC2 = src.c2;
        if (Math.abs(dR) >= Math.abs(dC)) {
            if (hoverR > src.r2) destR2 = hoverR;
            else if (hoverR < src.r1) destR1 = hoverR;
        } else {
            if (hoverC > src.c2) destC2 = hoverC;
            else if (hoverC < src.c1) destC1 = hoverC;
        }
        destR1 = Math.max(0, Math.min(this.options.rowCount - 1, destR1));
        destR2 = Math.max(0, Math.min(this.options.rowCount - 1, destR2));
        destC1 = Math.max(0, Math.min(this.options.colCount - 1, destC1));
        destC2 = Math.max(0, Math.min(this.options.colCount - 1, destC2));

        this.fillTargetRange = { r1: destR1, r2: destR2, c1: destC1, c2: destC2 };
        this.renderAutofillPreview();
    }

    executeAutoFill(srcR1, srcR2, srcC1, srcC2, destR1, destR2, destC1, destC2) {
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        sheet.data = sheet.data || {};

        const srcWidth = srcC2 - srcC1 + 1;
        const srcHeight = srcR2 - srcR1 + 1;

        const fillCell = (sourceR, sourceC, targetR, targetC, deltaR, deltaC) => {
            const srcKey = `${sourceR}_${sourceC}`;
            const targetKey = `${targetR}_${targetC}`;
            const srcData = sheet.data[srcKey];

            if (!srcData) {
                delete sheet.data[targetKey];
                return;
            }

            const newCellData = JSON.parse(JSON.stringify(srcData));

            if (srcData.f) {
                const adjustedFormula = this.adjustFormulaReferences('=' + srcData.f, deltaR, deltaC);
                newCellData.f = adjustedFormula.startsWith('=') ? adjustedFormula.substring(1) : adjustedFormula;
                delete newCellData.v;
            } else if (srcData.v !== undefined && srcData.v !== null && srcData.v !== '') {
                const numVal = parseFloat(srcData.v);
                if (!isNaN(numVal) && String(srcData.v).trim() === String(numVal)) {
                    if (deltaR !== 0 && srcHeight > 1) {
                        const firstNum = parseFloat((sheet.data[`${srcR1}_${sourceC}`] || {}).v);
                        const lastNum = parseFloat((sheet.data[`${srcR2}_${sourceC}`] || {}).v);
                        if (!isNaN(firstNum) && !isNaN(lastNum)) {
                            const step = (lastNum - firstNum) / (srcHeight - 1 || 1);
                            const stepsAway = (targetR - srcR2);
                            newCellData.v = lastNum + (step * stepsAway);
                        }
                    } else if (deltaC !== 0 && srcWidth > 1) {
                        const firstNum = parseFloat((sheet.data[`${sourceR}_${srcC1}`] || {}).v);
                        const lastNum = parseFloat((sheet.data[`${sourceR}_${srcC2}`] || {}).v);
                        if (!isNaN(firstNum) && !isNaN(lastNum)) {
                            const step = (lastNum - firstNum) / (srcWidth - 1 || 1);
                            const stepsAway = (targetC - srcC2);
                            newCellData.v = lastNum + (step * stepsAway);
                        }
                    }
                }
            }

            sheet.data[targetKey] = newCellData;
        };

        // 1. Expansión hacia abajo
        if (destR2 > srcR2) {
            for (let r = srcR2 + 1; r <= destR2; r++) {
                for (let c = srcC1; c <= srcC2; c++) {
                    const sourceR = srcR1 + ((r - (srcR2 + 1)) % srcHeight);
                    const deltaR = r - sourceR;
                    fillCell(sourceR, c, r, c, deltaR, 0);
                }
            }
        }

        // 2. Expansión hacia arriba
        if (destR1 < srcR1) {
            for (let r = srcR1 - 1; r >= destR1; r--) {
                for (let c = srcC1; c <= srcC2; c++) {
                    const sourceR = srcR2 - (((srcR1 - 1) - r) % srcHeight);
                    const deltaR = r - sourceR;
                    fillCell(sourceR, c, r, c, deltaR, 0);
                }
            }
        }

        // 3. Expansión hacia la derecha
        if (destC2 > srcC2) {
            for (let c = srcC2 + 1; c <= destC2; c++) {
                for (let r = srcR1; r <= srcR2; r++) {
                    const sourceC = srcC1 + ((c - (srcC2 + 1)) % srcWidth);
                    const deltaC = c - sourceC;
                    fillCell(r, sourceC, r, c, 0, deltaC);
                }
            }
        }

        // 4. Expansión hacia la izquierda
        if (destC1 < srcC1) {
            for (let c = srcC1 - 1; c >= destC1; c--) {
                for (let r = srcR1; r <= srcR2; r++) {
                    const sourceC = srcC2 - (((srcC1 - 1) - c) % srcWidth);
                    const deltaC = c - sourceC;
                    fillCell(r, sourceC, r, c, 0, deltaC);
                }
            }
        }

        this.selectStartRow = destR1;
        this.selectEndRow = destR2;
        this.selectStartCol = destC1;
        this.selectEndCol = destC2;
        this.activeRow = destR1;
        this.activeCol = destC1;

        this.rebuildHyperFormula();
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
        if (typeof window.markUnsavedChanges === 'function') window.markUnsavedChanges();
    }

    // === GESTIÓN DE MOVER CELDAS (DRAG TO MOVE) ===
    renderCellMovePreview() {
        this.clearCellMovePreview();
        if (!this.cellMoveSource || !this.cellMoveTarget) return;
        const src = this.cellMoveSource;
        const width = src.c2 - src.c1 + 1;
        const height = src.r2 - src.r1 + 1;
        const destR = this.cellMoveTarget.destRow;
        const destC = this.cellMoveTarget.destCol;

        for (let r = src.r1; r <= src.r2; r++) {
            for (let c = src.c1; c <= src.c2; c++) {
                const td = this.container.querySelector(`#cell_${r}_${c}`);
                if (td) td.classList.add('cell-move-drag-source');
            }
        }

        for (let dr = 0; dr < height; dr++) {
            for (let dc = 0; dc < width; dc++) {
                const tr = destR + dr;
                const tc = destC + dc;
                const td = this.container.querySelector(`#cell_${tr}_${tc}`);
                if (td) td.classList.add('cell-move-drag-dest');
            }
        }
    }

    clearCellMovePreview() {
        const srcCells = this.container.querySelectorAll('.cell-move-drag-source');
        srcCells.forEach(td => td.classList.remove('cell-move-drag-source'));
        const destCells = this.container.querySelectorAll('.cell-move-drag-dest');
        destCells.forEach(td => td.classList.remove('cell-move-drag-dest'));
    }

    updateCellMoveDrag(hoverR, hoverC) {
        if (!this.isDraggingCellMove || !this.cellMoveSource) return;
        const src = this.cellMoveSource;
        const offsetR = hoverR - src.clickR;
        const offsetC = hoverC - src.clickC;

        const width = src.c2 - src.c1 + 1;
        const height = src.r2 - src.r1 + 1;

        let destRow = src.r1 + offsetR;
        let destCol = src.c1 + offsetC;

        destRow = Math.max(0, Math.min(this.options.rowCount - height, destRow));
        destCol = Math.max(0, Math.min(this.options.colCount - width, destCol));

        this.cellMoveTarget = { destRow, destCol };
        this.renderCellMovePreview();
    }

    moveCellRange(srcR1, srcR2, srcC1, srcC2, destRow, destCol) {
        if (srcR1 === destRow && srcC1 === destCol) return;
        this.pushHistory();

        const sheet = this.sheets[this.activeSheetIndex];
        const r1 = Math.min(srcR1, srcR2);
        const r2 = Math.max(srcR1, srcR2);
        const c1 = Math.min(srcC1, srcC2);
        const c2 = Math.max(srcC1, srcC2);
        const width = c2 - c1 + 1;
        const height = r2 - r1 + 1;

        const buffer = [];
        for (let dr = 0; dr < height; dr++) {
            const rowArr = [];
            for (let dc = 0; dc < width; dc++) {
                const srcKey = `${r1 + dr}_${c1 + dc}`;
                const cellData = sheet.data[srcKey] ? JSON.parse(JSON.stringify(sheet.data[srcKey])) : null;
                rowArr.push(cellData);
            }
            buffer.push(rowArr);
        }

        // Limpiar celdas de origen
        for (let dr = 0; dr < height; dr++) {
            for (let dc = 0; dc < width; dc++) {
                delete sheet.data[`${r1 + dr}_${c1 + dc}`];
            }
        }

        // Pegar en celdas de destino
        for (let dr = 0; dr < height; dr++) {
            for (let dc = 0; dc < width; dc++) {
                const targetR = destRow + dr;
                const targetC = destCol + dc;
                if (targetR < 0 || targetR >= this.options.rowCount || targetC < 0 || targetC >= this.options.colCount) continue;
                const cellData = buffer[dr][dc];
                const destKey = `${targetR}_${targetC}`;
                if (cellData) {
                    sheet.data[destKey] = cellData;
                } else {
                    delete sheet.data[destKey];
                }
            }
        }

        this.activeRow = destRow;
        this.activeCol = destCol;
        this.selectStartRow = destRow;
        this.selectStartCol = destCol;
        this.selectEndRow = Math.min(this.options.rowCount - 1, destRow + height - 1);
        this.selectEndCol = Math.min(this.options.colCount - 1, destCol + width - 1);

        this.rebuildHyperFormula();
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
        if (typeof window.markUnsavedChanges === 'function') window.markUnsavedChanges();
    }

    hideAllMenus() {
        if (this.contextMenuEl) this.contextMenuEl.classList.add('hidden');
        if (this.colHeaderMenuEl) this.colHeaderMenuEl.classList.add('hidden');
        if (this.rowHeaderMenuEl) this.rowHeaderMenuEl.classList.add('hidden');
        if (this.sheetTabMenuEl) this.sheetTabMenuEl.classList.add('hidden');
    }

    openContextMenu(x, y) {
        this.hideAllMenus();
        if (!this.contextMenuEl) return;
        this.contextMenuEl.style.top = `${y}px`;
        this.contextMenuEl.style.left = `${x}px`;
        this.contextMenuEl.classList.remove('hidden');
    }

    openColHeaderMenu(c, x, y) {
        this.hideAllMenus();
        if (!this.colHeaderMenuEl) return;
        this.targetHeaderCol = c;
        const sheet = this.sheets[this.activeSheetIndex];
        const colFmt = (sheet && sheet.colFormats && sheet.colFormats[c]) ? sheet.colFormats[c].fmt : 'general';
        const colTitle = this.container.querySelector('#col-menu-title');
        if (colTitle) {
            const meta = this.getFormatMeta(colFmt);
            colTitle.innerHTML = `<span>Columna ${this.getColName(c)}</span> <span class="text-[9px] tabular-nums font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">${meta.short}</span>`;
        }

        // Resaltar opción de formato activa en el menú contextual de columna
        const fmtButtons = this.colHeaderMenuEl.querySelectorAll('[data-col-fmt]');
        fmtButtons.forEach(btn => {
            const btnFmt = btn.getAttribute('data-col-fmt');
            const isActive = (btnFmt === (colFmt || 'general'));
            btn.classList.toggle('bg-amber-500/20', isActive);
            btn.classList.toggle('text-amber-600', isActive);
            btn.classList.toggle('dark:text-amber-300', isActive);
            btn.classList.toggle('font-bold', isActive);
        });

        let posX = x;
        let posY = y;
        if (posX + 240 > window.innerWidth) posX = window.innerWidth - 250;
        if (posY + 320 > window.innerHeight) posY = window.innerHeight - 330;

        this.colHeaderMenuEl.style.top = `${posY}px`;
        this.colHeaderMenuEl.style.left = `${posX}px`;
        this.colHeaderMenuEl.classList.remove('hidden');
    }

    openRowHeaderMenu(r, x, y) {
        this.hideAllMenus();
        if (!this.rowHeaderMenuEl) return;
        const rowTitle = this.container.querySelector('#row-menu-title');
        if (rowTitle) rowTitle.textContent = `Fila ${r + 1}`;

        let posX = x;
        let posY = y;
        if (posX + 240 > window.innerWidth) posX = window.innerWidth - 250;
        if (posY + 300 > window.innerHeight) posY = window.innerHeight - 310;

        this.rowHeaderMenuEl.style.top = `${posY}px`;
        this.rowHeaderMenuEl.style.left = `${posX}px`;
        this.rowHeaderMenuEl.classList.remove('hidden');
    }

    // === ACCIONES Y MOVIMIENTO DE FILAS Y COLUMNAS ===
    moveRow(fromRow, targetRow) {
        if (fromRow === targetRow) return;
        targetRow = Math.max(0, Math.min(this.options.rowCount - 1, targetRow));
        this.pushHistory();

        const sheet = this.sheets[this.activeSheetIndex];
        sheet.data = sheet.data || {};
        sheet.rowHeights = sheet.rowHeights || {};

        const extractedRowData = {};
        const extractedHeight = sheet.rowHeights[fromRow];

        for (let c = 0; c < this.options.colCount; c++) {
            const key = `${fromRow}_${c}`;
            if (sheet.data[key]) {
                extractedRowData[c] = Object.assign({}, sheet.data[key]);
                delete sheet.data[key];
            }
        }

        const newData = {};
        const newHeights = {};

        for (let r = 0; r < this.options.rowCount; r++) {
            if (sheet.rowHeights[r] !== undefined && r !== fromRow) {
                let destR = r;
                if (fromRow < targetRow && r > fromRow && r <= targetRow) destR = r - 1;
                else if (fromRow > targetRow && r >= targetRow && r < fromRow) destR = r + 1;
                newHeights[destR] = sheet.rowHeights[r];
            }
        }
        if (extractedHeight !== undefined) newHeights[targetRow] = extractedHeight;

        Object.keys(sheet.data).forEach(key => {
            const [r, c] = key.split('_').map(Number);
            let destR = r;
            if (fromRow < targetRow) {
                if (r > fromRow && r <= targetRow) destR = r - 1;
            } else {
                if (r >= targetRow && r < fromRow) destR = r + 1;
            }
            newData[`${destR}_${c}`] = sheet.data[key];
        });

        Object.keys(extractedRowData).forEach(c => {
            newData[`${targetRow}_${c}`] = extractedRowData[c];
        });

        sheet.data = newData;
        sheet.rowHeights = newHeights;

        this.activeRow = targetRow;
        this.selectStartRow = targetRow;
        this.selectEndRow = targetRow;

        this.rebuildHyperFormula();
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    moveCol(fromCol, targetCol) {
        if (fromCol === targetCol) return;
        targetCol = Math.max(0, Math.min(this.options.colCount - 1, targetCol));
        this.pushHistory();

        const sheet = this.sheets[this.activeSheetIndex];
        sheet.data = sheet.data || {};
        sheet.colWidths = sheet.colWidths || {};

        const extractedColData = {};
        const extractedWidth = sheet.colWidths[fromCol];

        for (let r = 0; r < this.options.rowCount; r++) {
            const key = `${r}_${fromCol}`;
            if (sheet.data[key]) {
                extractedColData[r] = Object.assign({}, sheet.data[key]);
                delete sheet.data[key];
            }
        }

        const newData = {};
        const newWidths = {};

        for (let c = 0; c < this.options.colCount; c++) {
            if (sheet.colWidths[c] !== undefined && c !== fromCol) {
                let destC = c;
                if (fromCol < targetCol && c > fromCol && c <= targetCol) destC = c - 1;
                else if (fromCol > targetCol && c >= targetCol && c < fromCol) destC = c + 1;
                newWidths[destC] = sheet.colWidths[c];
            }
        }
        if (extractedWidth !== undefined) newWidths[targetCol] = extractedWidth;

        Object.keys(sheet.data).forEach(key => {
            const [r, c] = key.split('_').map(Number);
            let destC = c;
            if (fromCol < targetCol) {
                if (c > fromCol && c <= targetCol) destC = c - 1;
            } else {
                if (c >= targetCol && c < fromCol) destC = c + 1;
            }
            newData[`${r}_${destC}`] = sheet.data[key];
        });

        Object.keys(extractedColData).forEach(r => {
            newData[`${r}_${targetCol}`] = extractedColData[r];
        });

        sheet.data = newData;
        sheet.colWidths = newWidths;

        this.activeCol = targetCol;
        this.selectStartCol = targetCol;
        this.selectEndCol = targetCol;

        this.rebuildHyperFormula();
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    moveActiveRowUp() {
        this.hideAllMenus();
        if (this.targetHeaderRow > 0) {
            this.moveRow(this.targetHeaderRow, this.targetHeaderRow - 1);
        }
    }

    moveActiveRowDown() {
        this.hideAllMenus();
        if (this.targetHeaderRow < this.options.rowCount - 1) {
            this.moveRow(this.targetHeaderRow, this.targetHeaderRow + 1);
        }
    }

    moveActiveColLeft() {
        this.hideAllMenus();
        if (this.targetHeaderCol > 0) {
            this.moveCol(this.targetHeaderCol, this.targetHeaderCol - 1);
        }
    }

    moveActiveColRight() {
        this.hideAllMenus();
        if (this.targetHeaderCol < this.options.colCount - 1) {
            this.moveCol(this.targetHeaderCol, this.targetHeaderCol + 1);
        }
    }

    selectFullCol(colIdx = null) {
        if (this.isEditing) this.commitInlineEditing();
        const c = colIdx !== null ? colIdx : this.targetHeaderCol;
        this.activeRow = 0;
        this.activeCol = c;
        this.selectStartRow = 0;
        this.selectEndRow = this.options.rowCount - 1;
        this.selectStartCol = c;
        this.selectEndCol = c;
        this.render();
    }

    selectFullRow(rowIdx = null) {
        if (this.isEditing) this.commitInlineEditing();
        const r = rowIdx !== null ? rowIdx : this.targetHeaderRow;
        this.activeRow = r;
        this.activeCol = 0;
        this.selectStartRow = r;
        this.selectEndRow = r;
        this.selectStartCol = 0;
        this.selectEndCol = this.options.colCount - 1;
        this.render();
    }

    insertColLeft() {
        this.hideAllMenus();
        this.insertColAt(this.targetHeaderCol);
    }

    insertColRight() {
        this.hideAllMenus();
        this.insertColAt(this.targetHeaderCol + 1);
    }

    insertRowAbove() {
        this.hideAllMenus();
        this.insertRowAt(this.targetHeaderRow);
    }

    insertRowBelow() {
        this.hideAllMenus();
        this.insertRowAt(this.targetHeaderRow + 1);
    }

    clearActiveCol() {
        this.hideAllMenus();
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        const c = this.targetHeaderCol;
        const sheetId = this.sheetIdMap ? this.sheetIdMap[sheet.name] : null;

        for (let r = 0; r < this.options.rowCount; r++) {
            delete sheet.data[`${r}_${c}`];
            if (this.hfInstance && sheetId !== null) {
                try { this.hfInstance.setCellContents({ sheet: sheetId, col: c, row: r }, ''); } catch (e) {}
            }
        }
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    clearActiveRow() {
        this.hideAllMenus();
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        const r = this.targetHeaderRow;
        const sheetId = this.sheetIdMap ? this.sheetIdMap[sheet.name] : null;

        for (let c = 0; c < this.options.colCount; c++) {
            delete sheet.data[`${r}_${c}`];
            if (this.hfInstance && sheetId !== null) {
                try { this.hfInstance.setCellContents({ sheet: sheetId, col: c, row: r }, ''); } catch (e) {}
            }
        }
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    deleteActiveCol() {
        this.hideAllMenus();
        this.deleteColAt(this.targetHeaderCol);
    }

    deleteActiveRow() {
        this.hideAllMenus();
        this.deleteRowAt(this.targetHeaderRow);
    }

    autofitActiveColWidth() {
        this.hideAllMenus();
        this.autofitCol(this.targetHeaderCol !== null && this.targetHeaderCol !== undefined ? this.targetHeaderCol : this.activeCol);
    }

    autofitCol(c) {
        const sheet = this.sheets[this.activeSheetIndex];
        if (!sheet) return;
        sheet.data = sheet.data || {};
        sheet.colWidths = sheet.colWidths || {};
        let maxLen = 4;

        for (let r = 0; r < this.options.rowCount; r++) {
            const cell = sheet.data[`${r}_${c}`];
            if (cell) {
                const text = String(cell.v !== undefined ? cell.v : (cell.f ? `=${cell.f}` : ''));
                if (text.length > maxLen) maxLen = text.length;
            }
        }

        const calculatedWidth = Math.max(65, Math.min(600, maxLen * 9 + 28));
        sheet.colWidths[c] = calculatedWidth;
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    autofitActiveRowHeight() {
        this.hideAllMenus();
        this.autofitRow(this.targetHeaderRow !== null && this.targetHeaderRow !== undefined ? this.targetHeaderRow : this.activeRow);
    }

    autofitRow(r) {
        const sheet = this.sheets[this.activeSheetIndex];
        if (!sheet) return;
        sheet.data = sheet.data || {};
        sheet.rowHeights = sheet.rowHeights || {};
        let maxLines = 1;

        for (let c = 0; c < this.options.colCount; c++) {
            const cell = sheet.data[`${r}_${c}`];
            if (cell && cell.wrap) {
                const text = String(cell.v !== undefined ? cell.v : (cell.f ? `=${cell.f}` : ''));
                const lines = text.split('\n').length;
                if (lines > maxLines) maxLines = lines;
            }
        }

        const calculatedHeight = Math.max(24, Math.min(400, maxLines * 20 + 8));
        sheet.rowHeights[r] = calculatedHeight;
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    hideCol(c) {
        this.hideAllMenus();
        const sheet = this.sheets[this.activeSheetIndex];
        if (!sheet) return;
        sheet.hiddenCols = sheet.hiddenCols || {};
        sheet.hiddenCols[c] = true;
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    hideActiveCol() {
        this.hideCol(this.targetHeaderCol !== null && this.targetHeaderCol !== undefined ? this.targetHeaderCol : this.activeCol);
    }

    unhideAllCols() {
        this.hideAllMenus();
        const sheet = this.sheets[this.activeSheetIndex];
        if (!sheet) return;
        sheet.hiddenCols = {};
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    hideRow(r) {
        this.hideAllMenus();
        const sheet = this.sheets[this.activeSheetIndex];
        if (!sheet) return;
        sheet.hiddenRows = sheet.hiddenRows || {};
        sheet.hiddenRows[r] = true;
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    hideActiveRow() {
        this.hideRow(this.targetHeaderRow !== null && this.targetHeaderRow !== undefined ? this.targetHeaderRow : this.activeRow);
    }

    unhideAllRows() {
        this.hideAllMenus();
        const sheet = this.sheets[this.activeSheetIndex];
        if (!sheet) return;
        sheet.hiddenRows = {};
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    // === FORMATEADOR CONTABLE Y FINANCIERO DE CELDAS Y COLUMNAS ===
    parseDateRobust(strVal) {
        if (strVal === null || strVal === undefined || strVal === '') return null;
        if (strVal instanceof Date && !isNaN(strVal.getTime())) return strVal;

        // 1. Objeto de fecha retornado por HyperFormula { year, month, day, ... }
        if (typeof strVal === 'object' && strVal !== null && strVal.year !== undefined && strVal.month !== undefined && strVal.day !== undefined) {
            const h = strVal.hours !== undefined ? strVal.hours : 0;
            const m = strVal.minutes !== undefined ? strVal.minutes : 0;
            const s = strVal.seconds !== undefined ? strVal.seconds : 0;
            return new Date(strVal.year, strVal.month - 1, strVal.day, h, m, s);
        }

        // 2. Número serial de fecha (Excel / HyperFormula)
        if (typeof strVal === 'number' || (!isNaN(Number(strVal)) && Number(strVal) >= 1 && Number(strVal) <= 100000 && !String(strVal).includes('/') && !String(strVal).includes('-') && !String(strVal).includes(':'))) {
            const num = Number(strVal);
            const utcDays = Math.floor(num - 25569);
            const utcValue = utcDays * 86400;
            const dateInfo = new Date(utcValue * 1000);
            const fractionalDay = num - Math.floor(num) + 0.0000001;
            let totalSeconds = Math.floor(86400 * fractionalDay);
            const seconds = totalSeconds % 60;
            totalSeconds -= seconds;
            const hours = Math.floor(totalSeconds / (60 * 60));
            const minutes = Math.floor(totalSeconds / 60) % 60;
            return new Date(dateInfo.getUTCFullYear(), dateInfo.getUTCMonth(), dateInfo.getUTCDate(), hours, minutes, seconds);
        }

        const str = String(strVal).trim();

        // 3. Formato Día/Mes/Año prioritario: DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY (o con hora)
        const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
        if (dmyMatch) {
            let part1 = parseInt(dmyMatch[1], 10);
            let part2 = parseInt(dmyMatch[2], 10);
            let y = parseInt(dmyMatch[3], 10);
            if (y < 100) y += 2000;

            let d, m;
            // Si el primer número > 12: es Día
            // Si el segundo número > 12: el usuario escribió Mes/Día (auto-corregir)
            // Por defecto en El Salvador: part1 = Día, part2 = Mes
            if (part1 > 12 && part2 <= 12) {
                d = part1;
                m = part2 - 1;
            } else if (part1 <= 12 && part2 > 12) {
                d = part2;
                m = part1 - 1;
            } else {
                d = part1;
                m = part2 - 1;
            }

            const hh = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
            const mm = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
            const ss = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
            const date = new Date(y, m, d, hh, mm, ss);
            if (!isNaN(date.getTime())) return date;
        }

        // 4. Formato YYYY-MM-DD o YYYY/MM/DD (ISO)
        const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
        if (isoMatch) {
            const y = parseInt(isoMatch[1], 10);
            const m = parseInt(isoMatch[2], 10) - 1;
            const d = parseInt(isoMatch[3], 10);
            const hh = isoMatch[4] ? parseInt(isoMatch[4], 10) : 0;
            const mm = isoMatch[5] ? parseInt(isoMatch[5], 10) : 0;
            const ss = isoMatch[6] ? parseInt(isoMatch[6], 10) : 0;
            const date = new Date(y, m, d, hh, mm, ss);
            if (!isNaN(date.getTime())) return date;
        }

        // 5. Parser nativo JS (fallback)
        const nativeDate = new Date(str);
        if (!isNaN(nativeDate.getTime())) return nativeDate;

        return null;
    }

    getEvaluatedCellValue(r, c, targetSheet = null) {
        const sheet = targetSheet || this.sheets[this.activeSheetIndex];
        if (!sheet) return '';
        const cellKey = `${r}_${c}`;
        const cellData = (sheet.data && sheet.data[cellKey]) || {};

        if (!cellData.f) {
            return cellData.v !== undefined && cellData.v !== null ? cellData.v : '';
        }

        // 1. Probar primero con el motor nativo de EduConta (óptimo para fórmulas SI, IFS, TIR, VAN, SV_*)
        let evaluatedVal = null;
        try {
            const nativeVal = this.evaluateNativeFormula(cellData.f, sheet.data);
            if (nativeVal !== '#ERROR!' && nativeVal !== null && nativeVal !== undefined && nativeVal !== '' && nativeVal !== '#¡NUM!' && nativeVal !== '#NUM!') {
                evaluatedVal = nativeVal;
            }
        } catch (e) {}

        // 2. Si el motor nativo no dio resultado, consultar HyperFormula
        if (evaluatedVal === null && this.hfInstance) {
            let currentSheetId = null;
            try {
                currentSheetId = this.hfInstance.getSheetId(sheet.name);
            } catch (e) {}
            if (currentSheetId === null || currentSheetId === undefined) {
                currentSheetId = this.sheetIdMap ? this.sheetIdMap[sheet.name] : null;
            }
            if (currentSheetId === null || currentSheetId === undefined) {
                try {
                    const sheetNames = this.hfInstance.getSheetNames();
                    if (sheetNames && sheetNames.length) {
                        const sIdx = this.sheets ? this.sheets.findIndex(s => s.id === sheet.id || s.name === sheet.name) : -1;
                        if (sIdx >= 0 && sheetNames[sIdx]) {
                            currentSheetId = this.hfInstance.getSheetId(sheetNames[sIdx]);
                        } else {
                            currentSheetId = this.hfInstance.getSheetId(sheetNames[0]);
                        }
                    }
                } catch (e) {}
            }

            if (currentSheetId !== null && currentSheetId !== undefined) {
                try {
                    const hfVal = this.hfInstance.getCellValue({ sheet: currentSheetId, col: c, row: r });
                    if (hfVal !== null && hfVal !== undefined) {
                        if (typeof hfVal === 'object' && hfVal.type) {
                            evaluatedVal = hfVal.value !== undefined ? hfVal.value : '#ERROR!';
                        } else {
                            evaluatedVal = hfVal;
                        }
                    }
                } catch (e) {}
            }
        }

        if (evaluatedVal !== null && evaluatedVal !== undefined) {
            return evaluatedVal;
        }

        return cellData.v !== undefined ? cellData.v : `=${cellData.f}`;
    }

    getEvaluatedCellDisplay(r, c, targetSheet = null) {
        const sheet = targetSheet || this.sheets[this.activeSheetIndex];
        if (!sheet) return '';
        const cellKey = `${r}_${c}`;
        const cellData = (sheet.data && sheet.data[cellKey]) || {};

        const rawVal = this.getEvaluatedCellValue(r, c, sheet);
        if (rawVal === '' || rawVal === null || rawVal === undefined) return '';

        // Si es un string de texto puro (como "SE ACEPTA", "SE RECHAZA", "Concepto"), devolverlo directamente escapado
        if (typeof rawVal === 'string') {
            const clean = rawVal.replace(/^["']|["']$/g, '').trim();
            const numTest = this.cleanNumericValue(clean);
            if (numTest === null || clean === 'SE ACEPTA' || clean === 'SE RECHAZA' || clean.startsWith('Caso ') || clean.includes('MÓDULO')) {
                return this.escapeHtml(clean);
            }
        }

        // Formatear valor si tiene formato contable / porcentaje / moneda
        const formatted = this.formatCellDisplayValue(cellData, rawVal, c);
        if (formatted !== '' && formatted !== undefined && formatted !== null) {
            return formatted;
        }

        // Formateo de protección para números flotantes crudos
        if (typeof rawVal === 'number') {
            if (!isFinite(rawVal)) return '#NUM!';
            if (cellData.fmt === 'percent' || (rawVal > 0 && rawVal < 1 && String(rawVal).length > 6)) {
                return (rawVal * 100).toFixed(2) + '%';
            }
            if (String(rawVal).includes('.') && String(rawVal).split('.')[1].length > 4) {
                return rawVal.toFixed(4);
            }
            if (Math.abs(rawVal) >= 1000) {
                return rawVal.toLocaleString('en-US', { maximumFractionDigits: 2 });
            }
            return String(rawVal);
        }

        return this.escapeHtml(rawVal);
    }

    formatCellDisplayValue(cellData, displayVal, colIdx = null) {
        if (displayVal === '' || displayVal === null || displayVal === undefined) return '';
        const sheet = this.sheets[this.activeSheetIndex];
        const colFmt = (colIdx !== null && sheet && sheet.colFormats) ? sheet.colFormats[colIdx] : null;

        const effectiveCell = Object.assign({}, colFmt || {}, cellData || {});
        const fmt = effectiveCell.fmt;

        if (!fmt || fmt === 'general' || fmt === 'text') {
            if (fmt !== 'text' && typeof displayVal === 'object' && displayVal !== null && displayVal.year !== undefined && displayVal.month !== undefined && displayVal.day !== undefined) {
                const day = String(displayVal.day).padStart(2, '0');
                const month = String(displayVal.month).padStart(2, '0');
                const year = displayVal.year;
                return `${day}/${month}/${year}`;
            }
            return this.escapeHtml(displayVal);
        }

        const strVal = String(displayVal).trim();
        const cleanNum = parseFloat(strVal.replace(/[$€%\s]/g, '').replace(/,/g, ''));
        const isNum = !isNaN(cleanNum) && isFinite(cleanNum);

        // 1. MONEDA / CONTABILIDAD USD
        if (fmt === 'usd' || fmt === 'accounting') {
            if (!isNum) return this.escapeHtml(displayVal);
            const decimals = effectiveCell.fmtDecimals !== undefined ? effectiveCell.fmtDecimals : 2;
            const absVal = Math.abs(cleanNum).toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });

            if (cleanNum < 0) {
                if (effectiveCell.fmtNegatives === 'parentheses') return `($${absVal})`;
                if (effectiveCell.fmtNegatives === 'red') return `<span class="text-rose-500 font-semibold">-$${absVal}</span>`;
                if (effectiveCell.fmtNegatives === 'red_parentheses') return `<span class="text-rose-500 font-semibold">($${absVal})</span>`;
                return `-$${absVal}`;
            }
            return `$${absVal}`;
        }

        // 2. PORCENTAJE
        if (fmt === 'percent') {
            if (!isNum) return this.escapeHtml(displayVal);
            const decimals = effectiveCell.fmtDecimals !== undefined ? effectiveCell.fmtDecimals : 2;
            return (cleanNum * 100).toFixed(decimals) + '%';
        }

        // 3. NÚMERO DECIMAL / MILLARES
        if (fmt === 'number' || fmt === 'decimal') {
            if (!isNum) return this.escapeHtml(displayVal);
            const decimals = effectiveCell.fmtDecimals !== undefined ? effectiveCell.fmtDecimals : 2;
            const absVal = Math.abs(cleanNum).toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });

            if (cleanNum < 0) {
                if (effectiveCell.fmtNegatives === 'parentheses') return `(${absVal})`;
                if (effectiveCell.fmtNegatives === 'red') return `<span class="text-rose-500 font-semibold">-${absVal}</span>`;
                if (effectiveCell.fmtNegatives === 'red_parentheses') return `<span class="text-rose-500 font-semibold">(${absVal})</span>`;
                return `-${absVal}`;
            }
            return absVal;
        }

        // 4. FORMATOS ESPECIALES DE EL SALVADOR
        if (fmt === 'nit') {
            const digits = strVal.replace(/\D/g, '');
            if (digits.length >= 14) {
                return `${digits.slice(0,4)}-${digits.slice(4,10)}-${digits.slice(10,13)}-${digits.slice(13,14)}`;
            }
            return this.escapeHtml(displayVal);
        }

        if (fmt === 'dui') {
            const digits = strVal.replace(/\D/g, '');
            if (digits.length >= 9) {
                return `${digits.slice(0,8)}-${digits.slice(8,9)}`;
            }
            return this.escapeHtml(displayVal);
        }

        if (fmt === 'nrc') {
            const digits = strVal.replace(/\D/g, '');
            if (digits.length >= 6) {
                return `${digits.slice(0, digits.length - 1)}-${digits.slice(digits.length - 1)}`;
            }
            return this.escapeHtml(displayVal);
        }

        if (fmt === 'factura') {
            const digits = strVal.replace(/\D/g, '');
            if (digits) {
                return 'N° ' + digits.padStart(6, '0');
            }
            return this.escapeHtml(displayVal);
        }

        // 5. FECHAS (Día/Mes/Año DD/MM/AAAA)
        if (fmt === 'date_dmy' || fmt === 'date') {
            const d = this.parseDateRobust(strVal);
            if (d) {
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                return `${day}/${month}/${year}`;
            }
            return this.escapeHtml(displayVal);
        }

        if (fmt === 'date_long') {
            const d = this.parseDateRobust(strVal);
            if (d) {
                const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                const day = d.getDate();
                const month = meses[d.getMonth()];
                const year = d.getFullYear();
                return `${day} de ${month} de ${year}`;
            }
            return this.escapeHtml(displayVal);
        }

        // 6. HORAS
        if (fmt === 'time' || fmt === 'time_24h') {
            const d = this.parseDateRobust(strVal);
            if (d && strVal.includes(':')) {
                const hh = String(d.getHours()).padStart(2, '0');
                const mm = String(d.getMinutes()).padStart(2, '0');
                const ss = String(d.getSeconds()).padStart(2, '0');
                return `${hh}:${mm}:${ss}`;
            }
            const timeMatch = strVal.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
            if (timeMatch) {
                const hh = String(timeMatch[1]).padStart(2, '0');
                const mm = String(timeMatch[2]).padStart(2, '0');
                const ss = timeMatch[3] ? String(timeMatch[3]).padStart(2, '0') : '00';
                return `${hh}:${mm}:${ss}`;
            }
            return this.escapeHtml(displayVal);
        }

        if (fmt === 'time_12h') {
            const timeMatch = strVal.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?/i);
            if (timeMatch) {
                let hh = parseInt(timeMatch[1], 10);
                const mm = String(timeMatch[2]).padStart(2, '0');
                const period = timeMatch[4] ? timeMatch[4].toUpperCase() : (hh >= 12 ? 'PM' : 'AM');
                if (hh > 12) hh = hh - 12;
                if (hh === 0) hh = 12;
                return `${String(hh).padStart(2, '0')}:${mm} ${period}`;
            }
            return this.escapeHtml(displayVal);
        }

        return this.escapeHtml(displayVal);
    }

    // === GESTIÓN Y PERSISTENCIA DE FORMATOS DE COLUMNAS ===
    getColFormat(colIdx) {
        const sheet = this.sheets[this.activeSheetIndex];
        return (sheet && sheet.colFormats) ? sheet.colFormats[colIdx] : null;
    }

    applyColFormat(colIdx, formatConfig) {
        if (colIdx === null || colIdx === undefined) return;
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        sheet.data = sheet.data || {};
        sheet.colFormats = sheet.colFormats || {};
        sheet.colFormats[colIdx] = Object.assign({}, sheet.colFormats[colIdx] || {}, formatConfig);

        for (let r = 0; r < this.options.rowCount; r++) {
            const key = `${r}_${colIdx}`;
            sheet.data[key] = sheet.data[key] || {};
            const cell = sheet.data[key];
            if (formatConfig.fmt !== undefined) cell.fmt = formatConfig.fmt;
            if (formatConfig.fmtDecimals !== undefined) cell.fmtDecimals = formatConfig.fmtDecimals;
            if (formatConfig.fmtNegatives !== undefined) cell.fmtNegatives = formatConfig.fmtNegatives;
            if (formatConfig.fmtDate !== undefined) cell.fmtDate = formatConfig.fmtDate;
            if (formatConfig.fmtTime !== undefined) cell.fmtTime = formatConfig.fmtTime;
            if (formatConfig.align !== undefined) cell.align = formatConfig.align;
            if (formatConfig.valign !== undefined) cell.valign = formatConfig.valign;
            if (formatConfig.font !== undefined) cell.font = formatConfig.font;
            if (formatConfig.size !== undefined) cell.size = formatConfig.size;
            if (formatConfig.bold !== undefined) cell.bold = formatConfig.bold;
            if (formatConfig.italic !== undefined) cell.italic = formatConfig.italic;
            if (formatConfig.underline !== undefined) cell.underline = formatConfig.underline;
            if (formatConfig.color !== undefined) cell.color = formatConfig.color;
            if (formatConfig.bgcolor !== undefined) cell.bgcolor = formatConfig.bgcolor;
        }

        this.render();
        this.triggerSelectCallback();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    setColFormatQuick(fmtType) {
        this.hideAllMenus();
        const c = this.targetHeaderCol !== null && this.targetHeaderCol !== undefined ? this.targetHeaderCol : this.activeCol;
        this.applyColFormat(c, { fmt: fmtType, fmtDecimals: 2, fmtNegatives: 'minus' });
    }

    openColFormatAdvanced() {
        this.hideAllMenus();
        const c = this.targetHeaderCol !== null && this.targetHeaderCol !== undefined ? this.targetHeaderCol : this.activeCol;
        this.selectFullCol(c);
        if (typeof window.openCellFormatModal === 'function') {
            window.openCellFormatModal('number');
        }
    }

    // === APLICAR FORMATO COMPUESTO DESDE MODAL ===
    applyCompositeFormatToSelection(formatConfig) {
        if (!formatConfig) return;
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        sheet.data = sheet.data || {};

        const r1 = Math.min(this.selectStartRow, this.selectEndRow);
        const r2 = Math.max(this.selectStartRow, this.selectEndRow);
        const c1 = Math.min(this.selectStartCol, this.selectEndCol);
        const c2 = Math.max(this.selectStartCol, this.selectEndCol);

        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                const key = `${r}_${c}`;
                sheet.data[key] = sheet.data[key] || {};
                const cell = sheet.data[key];

                if (formatConfig.fmt !== undefined) cell.fmt = formatConfig.fmt;
                if (formatConfig.fmtDecimals !== undefined) cell.fmtDecimals = formatConfig.fmtDecimals;
                if (formatConfig.fmtNegatives !== undefined) cell.fmtNegatives = formatConfig.fmtNegatives;
                if (formatConfig.fmtDate !== undefined) cell.fmtDate = formatConfig.fmtDate;
                if (formatConfig.fmtTime !== undefined) cell.fmtTime = formatConfig.fmtTime;

                if (formatConfig.align !== undefined) cell.align = formatConfig.align;
                if (formatConfig.valign !== undefined) cell.valign = formatConfig.valign;
                if (formatConfig.indent !== undefined) cell.indent = formatConfig.indent;
                if (formatConfig.wrap !== undefined) cell.wrap = formatConfig.wrap;

                if (formatConfig.font !== undefined) cell.font = formatConfig.font;
                if (formatConfig.size !== undefined) cell.size = formatConfig.size;
                if (formatConfig.bold !== undefined) cell.bold = formatConfig.bold;
                if (formatConfig.italic !== undefined) cell.italic = formatConfig.italic;
                if (formatConfig.underline !== undefined) cell.underline = formatConfig.underline;
                if (formatConfig.strikethrough !== undefined) cell.strikethrough = formatConfig.strikethrough;
                if (formatConfig.color !== undefined) cell.color = formatConfig.color;

                if (formatConfig.bgcolor !== undefined) cell.bgcolor = formatConfig.bgcolor;
                if (formatConfig.border !== undefined) cell.border = formatConfig.border;
                if (formatConfig.borderColor !== undefined) cell.borderColor = formatConfig.borderColor;
            }
        }

        if (r1 === 0 && r2 === this.options.rowCount - 1) {
            sheet.colFormats = sheet.colFormats || {};
            for (let c = c1; c <= c2; c++) {
                sheet.colFormats[c] = Object.assign({}, sheet.colFormats[c] || {}, formatConfig);
            }
        }

        this.render();
        this.triggerSelectCallback();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    // === APLICACIÓN COMPLETA DE BORDES Y GROSORES (ESTILO EXCEL) ===
    applyBorderToSelection(borderType, lineStyle = 'thin', borderColor = null) {
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        sheet.data = sheet.data || {};

        const r1 = Math.min(this.selectStartRow, this.selectEndRow);
        const r2 = Math.max(this.selectStartRow, this.selectEndRow);
        const c1 = Math.min(this.selectStartCol, this.selectEndCol);
        const c2 = Math.max(this.selectStartCol, this.selectEndCol);

        const color = borderColor || this.currentBorderColor || '#64748b';
        this.currentBorderColor = color;
        this.currentBorderStyle = lineStyle || 'thin';

        let stroke = `1px solid ${color}`;
        if (lineStyle === 'medium') stroke = `2px solid ${color}`;
        else if (lineStyle === 'thick') stroke = `3px solid ${color}`;
        else if (lineStyle === 'double') stroke = `3px double ${color}`;
        else if (lineStyle === 'dashed') stroke = `1px dashed ${color}`;
        else if (lineStyle === 'dotted') stroke = `1px dotted ${color}`;

        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                const key = `${r}_${c}`;
                sheet.data[key] = sheet.data[key] || {};
                const cell = sheet.data[key];

                if (borderType === 'none') {
                    delete cell.border;
                    delete cell.borderColor;
                    delete cell.borderTop;
                    delete cell.borderBottom;
                    delete cell.borderLeft;
                    delete cell.borderRight;
                    continue;
                }

                if (borderType === 'all') {
                    cell.border = 'all';
                    cell.borderColor = color;
                    cell.borderTop = stroke;
                    cell.borderBottom = stroke;
                    cell.borderLeft = stroke;
                    cell.borderRight = stroke;
                } else if (borderType === 'outer') {
                    if (r === r1) cell.borderTop = stroke;
                    if (r === r2) cell.borderBottom = stroke;
                    if (c === c1) cell.borderLeft = stroke;
                    if (c === c2) cell.borderRight = stroke;
                    if (r1 === r2 && c1 === c2) {
                        cell.border = 'outer';
                        cell.borderColor = color;
                    }
                } else if (borderType === 'top') {
                    if (r === r1) cell.borderTop = stroke;
                } else if (borderType === 'bottom') {
                    if (r === r2) cell.borderBottom = stroke;
                } else if (borderType === 'left') {
                    if (c === c1) cell.borderLeft = stroke;
                } else if (borderType === 'right') {
                    if (c === c2) cell.borderRight = stroke;
                } else if (borderType === 'bottom-thick') {
                    if (r === r2) cell.borderBottom = `2.5px solid ${color}`;
                } else if (borderType === 'accounting-double' || borderType === 'bottom-double') {
                    if (r === r2) cell.borderBottom = `3px double ${color}`;
                } else if (borderType === 'top-bottom-thick') {
                    if (r === r1) cell.borderTop = `1px solid ${color}`;
                    if (r === r2) cell.borderBottom = `2.5px solid ${color}`;
                } else if (borderType === 'top-bottom-double') {
                    if (r === r1) cell.borderTop = `1px solid ${color}`;
                    if (r === r2) cell.borderBottom = `3px double ${color}`;
                } else if (borderType === 'inside') {
                    if (r > r1) cell.borderTop = stroke;
                    if (r < r2) cell.borderBottom = stroke;
                    if (c > c1) cell.borderLeft = stroke;
                    if (c < c2) cell.borderRight = stroke;
                } else if (borderType === 'inside-h') {
                    if (r < r2) cell.borderBottom = stroke;
                } else if (borderType === 'inside-v') {
                    if (c < c2) cell.borderRight = stroke;
                }
            }
        }

        this.render();
        this.triggerSelectCallback();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    // === GESTIÓN Y OPERACIONES DE TABLAS INTELIGENTES (EXCEL TABLES) ===
    detectDataRegion(startRow, startCol) {
        const sheet = this.sheets[this.activeSheetIndex];
        const data = sheet.data || {};

        let r1 = startRow, r2 = startRow;
        let c1 = startCol, c2 = startCol;

        const hasContent = (r, c) => {
            const cell = data[`${r}_${c}`];
            return !!(cell && (cell.f || (cell.v !== undefined && cell.v !== '')));
        };

        // Si la celda inicial no tiene contenido, buscar hacia la derecha o abajo en 3 pasos
        if (!hasContent(startRow, startCol)) {
            let found = false;
            for (let dr = 0; dr <= 3 && !found; dr++) {
                for (let dc = 0; dc <= 3 && !found; dc++) {
                    if (hasContent(startRow + dr, startCol + dc)) {
                        r1 = r2 = startRow + dr;
                        c1 = c2 = startCol + dc;
                        found = true;
                    }
                }
            }
            if (!found) {
                return {
                    r1: startRow,
                    c1: startCol,
                    r2: Math.min(this.options.rowCount - 1, startRow + 4),
                    c2: Math.min(this.options.colCount - 1, startCol + 3)
                };
            }
        }

        // Expandir hacia arriba
        while (r1 > 0 && hasContent(r1 - 1, c1)) r1--;
        // Expandir hacia abajo
        while (r2 < this.options.rowCount - 1 && hasContent(r2 + 1, c1)) r2++;
        // Expandir hacia la izquierda
        while (c1 > 0 && hasContent(r1, c1 - 1)) c1--;
        // Expandir hacia la derecha
        while (c2 < this.options.colCount - 1 && hasContent(r1, c2 + 1)) c2++;

        return { r1, c1, r2, c2 };
    }

    createTable(range, options = {}) {
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        sheet.tables = sheet.tables || [];

        let r1 = Math.min(range.r1, range.r2);
        let r2 = Math.max(range.r1, range.r2);
        let c1 = Math.min(range.c1, range.c2);
        let c2 = Math.max(range.c1, range.c2);

        // Si solo se seleccionó 1 celda, auto-expandir a la región continua de datos
        if (r1 === r2 && c1 === c2) {
            const exp = this.detectDataRegion(r1, c1);
            r1 = exp.r1; r2 = exp.r2; c1 = exp.c1; c2 = exp.c2;
        }

        // Asegurar dimensiones mínimas de tabla (al menos 2 filas y 2 columnas)
        if (r1 === r2) r2 = Math.min(this.options.rowCount - 1, r1 + 3);
        if (c1 === c2) c2 = Math.min(this.options.colCount - 1, c1 + 2);

        const tableNum = sheet.tables.length + 1;
        const tableName = (options.name && options.name.trim()) ? options.name.trim() : `Tabla${tableNum}`;
        const tableId = `tbl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const hasHeaderRow = options.hasHeaderRow !== undefined ? !!options.hasHeaderRow : true;

        sheet.data = sheet.data || {};

        // Si tiene encabezados, nombrar automáticamente celdas vacías
        if (hasHeaderRow) {
            for (let c = c1; c <= c2; c++) {
                const key = `${r1}_${c}`;
                sheet.data[key] = sheet.data[key] || {};
                if (!sheet.data[key].v && !sheet.data[key].f) {
                    sheet.data[key].v = `Columna${c - c1 + 1}`;
                }
            }
        }

        const newTable = {
            id: tableId,
            name: tableName,
            range: { r1, c1, r2, c2 },
            style: options.style || 'amber',
            hasHeaderRow: hasHeaderRow,
            hasTotalRow: !!options.hasTotalRow,
            totalRowConfigs: options.totalRowConfigs || {},
            hasBandedRows: options.hasBandedRows !== undefined ? !!options.hasBandedRows : true,
            hasBandedCols: !!options.hasBandedCols,
            highlightFirstCol: !!options.highlightFirstCol,
            highlightLastCol: !!options.highlightLastCol,
            filterStates: {}
        };

        sheet.tables.push(newTable);
        this.render();
        this.triggerSelectCallback();
        if (typeof this.options.onChange === 'function') this.options.onChange();
        return newTable;
    }

    getTableAt(r, c) {
        const sheet = this.sheets[this.activeSheetIndex];
        if (!sheet || !sheet.tables || !Array.isArray(sheet.tables)) return null;
        for (const tbl of sheet.tables) {
            if (r >= tbl.range.r1 && r <= tbl.range.r2 && c >= tbl.range.c1 && c <= tbl.range.c2) {
                return tbl;
            }
        }
        return null;
    }

    getTableById(tableId) {
        const sheet = this.sheets[this.activeSheetIndex];
        if (!sheet || !sheet.tables) return null;
        return sheet.tables.find(t => t.id === tableId) || null;
    }

    updateTableConfig(tableId, newConfig) {
        const tbl = this.getTableById(tableId);
        if (!tbl) return;
        this.pushHistory();
        Object.assign(tbl, newConfig);
        this.render();
        this.triggerSelectCallback();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    convertTableToRange(tableId) {
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        if (!sheet || !sheet.tables) return;
        const idx = sheet.tables.findIndex(t => t.id === tableId);
        if (idx !== -1) {
            sheet.hiddenRows = {};
            sheet.tables.splice(idx, 1);
            this.render();
            this.triggerSelectCallback();
            if (typeof this.options.onChange === 'function') this.options.onChange();
        }
    }

    deleteTable(tableId, clearData = false) {
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        if (!sheet || !sheet.tables) return;
        const idx = sheet.tables.findIndex(t => t.id === tableId);
        if (idx !== -1) {
            const tbl = sheet.tables[idx];
            if (clearData && sheet.data) {
                for (let r = tbl.range.r1; r <= tbl.range.r2; r++) {
                    for (let c = tbl.range.c1; c <= tbl.range.c2; c++) {
                        delete sheet.data[`${r}_${c}`];
                    }
                }
            }
            sheet.hiddenRows = {};
            sheet.tables.splice(idx, 1);
            this.rebuildHyperFormula();
            this.render();
            this.triggerSelectCallback();
            if (typeof this.options.onChange === 'function') this.options.onChange();
        }
    }

    toggleTableTotalRow(tableId) {
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        const tbl = this.getTableById(tableId);
        if (!tbl) return;

        tbl.hasTotalRow = !tbl.hasTotalRow;
        if (tbl.hasTotalRow) {
            if (tbl.range.r2 < this.options.rowCount - 1) {
                tbl.range.r2 += 1;
            }
            const firstCellKey = `${tbl.range.r2}_${tbl.range.c1}`;
            sheet.data = sheet.data || {};
            sheet.data[firstCellKey] = sheet.data[firstCellKey] || {};
            if (!sheet.data[firstCellKey].v && !sheet.data[firstCellKey].f) {
                sheet.data[firstCellKey].v = 'Total';
            }

            const lastCol = tbl.range.c2;
            const lastColLet = this.getColName(lastCol);
            const dataR1 = tbl.hasHeaderRow ? tbl.range.r1 + 2 : tbl.range.r1 + 1;
            const dataR2 = tbl.range.r2;
            const lastCellKey = `${tbl.range.r2}_${lastCol}`;
            sheet.data[lastCellKey] = sheet.data[lastCellKey] || {};
            this.setCellValue(tbl.range.r2, lastCol, `=SUM(${lastColLet}${dataR1}:${lastColLet}${dataR2})`, { skipHistory: true });
            tbl.totalRowConfigs = tbl.totalRowConfigs || {};
            tbl.totalRowConfigs[lastCol] = 'SUM';
        } else {
            const totalR = tbl.range.r2;
            for (let c = tbl.range.c1; c <= tbl.range.c2; c++) {
                delete sheet.data[`${totalR}_${c}`];
            }
            tbl.range.r2 = Math.max(tbl.range.r1 + 1, tbl.range.r2 - 1);
            this.rebuildHyperFormula();
        }

        this.render();
        this.triggerSelectCallback();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    setTableTotalFunction(tableId, colIdx, funcName) {
        this.pushHistory();
        const tbl = this.getTableById(tableId);
        if (!tbl || !tbl.hasTotalRow) return;

        const totalR = tbl.range.r2;
        const colLet = this.getColName(colIdx);
        const dataR1 = tbl.hasHeaderRow ? tbl.range.r1 + 2 : tbl.range.r1 + 1;
        const dataR2 = tbl.range.r2;

        tbl.totalRowConfigs = tbl.totalRowConfigs || {};
        tbl.totalRowConfigs[colIdx] = funcName;

        if (funcName === 'NONE' || !funcName) {
            const key = `${totalR}_${colIdx}`;
            const sheet = this.sheets[this.activeSheetIndex];
            if (sheet.data) delete sheet.data[key];
            this.rebuildHyperFormula();
        } else {
            const formula = `=${funcName}(${colLet}${dataR1}:${colLet}${dataR2})`;
            this.setCellValue(totalR, colIdx, formula, { skipHistory: true });
        }

        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    sortTableByColumn(tableId, colIdx, direction = 'asc') {
        const tbl = this.getTableById(tableId);
        if (!tbl) return;
        this.pushHistory();

        const sheet = this.sheets[this.activeSheetIndex];
        const rStart = tbl.hasHeaderRow ? tbl.range.r1 + 1 : tbl.range.r1;
        const rEnd = tbl.hasTotalRow ? tbl.range.r2 - 1 : tbl.range.r2;
        if (rStart >= rEnd) return;

        const rows = [];
        for (let r = rStart; r <= rEnd; r++) {
            const rowData = {};
            for (let c = 0; c < this.options.colCount; c++) {
                const key = `${r}_${c}`;
                if (sheet.data && sheet.data[key]) {
                    rowData[c] = Object.assign({}, sheet.data[key]);
                }
            }
            const sortValKey = `${r}_${colIdx}`;
            const sortVal = sheet.data && sheet.data[sortValKey] ? (sheet.data[sortValKey].v !== undefined ? sheet.data[sortValKey].v : sheet.data[sortValKey].f) : '';
            rows.push({ rowIdx: r, sortVal: sortVal, cells: rowData });
        }

        rows.sort((a, b) => {
            let valA = a.sortVal;
            let valB = b.sortVal;
            const numA = parseFloat(String(valA).replace(/[$€%\s,]/g, ''));
            const numB = parseFloat(String(valB).replace(/[$€%\s,]/g, ''));
            if (!isNaN(numA) && !isNaN(numB)) {
                return direction === 'asc' ? numA - numB : numB - numA;
            }
            valA = String(valA || '').toLowerCase();
            valB = String(valB || '').toLowerCase();
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        rows.forEach((rowObj, idx) => {
            const targetR = rStart + idx;
            for (let c = tbl.range.c1; c <= tbl.range.c2; c++) {
                const key = `${targetR}_${c}`;
                if (rowObj.cells[c]) {
                    sheet.data[key] = rowObj.cells[c];
                } else {
                    delete sheet.data[key];
                }
            }
        });

        this.rebuildHyperFormula();
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    getTableColumnUniqueValues(tableId, colIdx) {
        const tbl = this.getTableById(tableId);
        if (!tbl) return [];
        const sheet = this.sheets[this.activeSheetIndex];
        const rStart = tbl.hasHeaderRow ? tbl.range.r1 + 1 : tbl.range.r1;
        const rEnd = tbl.hasTotalRow ? tbl.range.r2 - 1 : tbl.range.r2;

        const valMap = {};
        for (let r = rStart; r <= rEnd; r++) {
            const key = `${r}_${colIdx}`;
            const val = sheet.data && sheet.data[key] ? String(sheet.data[key].v !== undefined ? sheet.data[key].v : sheet.data[key].f) : '(Vacías)';
            valMap[val] = (valMap[val] || 0) + 1;
        }

        return Object.keys(valMap).map(v => ({ value: v, count: valMap[v] }));
    }

    filterTableByValues(tableId, colIdx, selectedValues) {
        const tbl = this.getTableById(tableId);
        if (!tbl) return;

        const sheet = this.sheets[this.activeSheetIndex];
        sheet.hiddenRows = sheet.hiddenRows || {};

        const rStart = tbl.hasHeaderRow ? tbl.range.r1 + 1 : tbl.range.r1;
        const rEnd = tbl.hasTotalRow ? tbl.range.r2 - 1 : tbl.range.r2;

        tbl.filterStates = tbl.filterStates || {};
        tbl.filterStates[colIdx] = selectedValues;

        for (let r = rStart; r <= rEnd; r++) {
            const key = `${r}_${colIdx}`;
            const cellVal = sheet.data && sheet.data[key] ? String(sheet.data[key].v !== undefined ? sheet.data[key].v : sheet.data[key].f) : '(Vacías)';
            if (selectedValues && !selectedValues.includes(cellVal)) {
                sheet.hiddenRows[r] = true;
            } else {
                delete sheet.hiddenRows[r];
            }
        }

        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    checkAutoExpandTable(r, c) {
        const sheet = this.sheets[this.activeSheetIndex];
        if (!sheet || !sheet.tables || !Array.isArray(sheet.tables)) return;

        for (const tbl of sheet.tables) {
            // Expansión hacia abajo (fila inmediatamente siguiente)
            if (r === tbl.range.r2 + 1 && c >= tbl.range.c1 && c <= tbl.range.c2) {
                tbl.range.r2 = r;
                break;
            }
            // Expansión hacia la derecha (columna inmediatamente siguiente)
            if (c === tbl.range.c2 + 1 && r >= tbl.range.r1 && r <= tbl.range.r2) {
                tbl.range.c2 = c;
                if (tbl.hasHeaderRow) {
                    const headerKey = `${tbl.range.r1}_${c}`;
                    if (!sheet.data[headerKey] || (!sheet.data[headerKey].v && !sheet.data[headerKey].f)) {
                        sheet.data[headerKey] = { v: `Columna${c - tbl.range.c1 + 1}` };
                    }
                }
                break;
            }
        }
    }

    // === MODAL PROMPT DE TAMAÑO EXACTO (PX) ===
    promptActiveColWidth() {
        this.hideAllMenus();
        this.sizePromptMode = 'col';
        const sheet = this.sheets[this.activeSheetIndex];
        const currentWidth = (sheet.colWidths && sheet.colWidths[this.targetHeaderCol]) || this.options.defaultColWidth;

        const titleLabel = this.container.querySelector('#size-prompt-label');
        const inputLabel = this.container.querySelector('#size-input-label');
        const input = this.container.querySelector('#size-prompt-input');
        const presetsContainer = this.container.querySelector('#size-presets-container');

        if (titleLabel) titleLabel.textContent = `Especificar Ancho de Columna (${this.getColName(this.targetHeaderCol)})`;
        if (inputLabel) inputLabel.textContent = 'Ingrese el ancho exacto de la columna en píxeles (px):';
        if (input) input.value = currentWidth;

        const presets = [65, 85, 100, 120, 150, 200, 300];
        if (presetsContainer) {
            presetsContainer.innerHTML = presets.map(val => `
                <button onclick="spreadsheetEngine && spreadsheetEngine.setPromptPreset(${val})" class="px-2.5 py-1 rounded-lg text-xs tabular-nums font-bold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-500/20 hover:text-amber-500 hover:border-amber-400 transition-all">
                    ${val}px
                </button>
            `).join('');
        }

        if (this.sizePromptModalEl) {
            this.sizePromptModalEl.classList.remove('closing');
            this.sizePromptModalEl.style.display = 'flex';
            setTimeout(() => { if (input) { input.focus(); input.select(); } }, 50);
        }
    }

    promptActiveRowHeight() {
        this.hideAllMenus();
        this.sizePromptMode = 'row';
        const sheet = this.sheets[this.activeSheetIndex];
        const currentHeight = (sheet.rowHeights && sheet.rowHeights[this.targetHeaderRow]) || this.options.defaultRowHeight;

        const titleLabel = this.container.querySelector('#size-prompt-label');
        const inputLabel = this.container.querySelector('#size-input-label');
        const input = this.container.querySelector('#size-prompt-input');
        const presetsContainer = this.container.querySelector('#size-presets-container');

        if (titleLabel) titleLabel.textContent = `Especificar Alto de Fila (${this.targetHeaderRow + 1})`;
        if (inputLabel) inputLabel.textContent = 'Ingrese el alto exacto de la fila en píxeles (px):';
        if (input) input.value = currentHeight;

        const presets = [20, 28, 35, 45, 60, 80, 100];
        if (presetsContainer) {
            presetsContainer.innerHTML = presets.map(val => `
                <button onclick="spreadsheetEngine && spreadsheetEngine.setPromptPreset(${val})" class="px-2.5 py-1 rounded-lg text-xs tabular-nums font-bold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-500/20 hover:text-amber-500 hover:border-amber-400 transition-all">
                    ${val}px
                </button>
            `).join('');
        }

        if (this.sizePromptModalEl) {
            this.sizePromptModalEl.classList.remove('closing');
            this.sizePromptModalEl.style.display = 'flex';
            setTimeout(() => { if (input) { input.focus(); input.select(); } }, 50);
        }
    }

    setPromptPreset(val) {
        const input = this.container.querySelector('#size-prompt-input');
        if (input) input.value = val;
    }

    closeSizePromptModal() {
        if (this.sizePromptModalEl) {
            this.sizePromptModalEl.classList.add('closing');
            setTimeout(() => {
                this.sizePromptModalEl.style.display = 'none';
                this.sizePromptModalEl.classList.remove('closing');
            }, 280);
        }
    }

    confirmSizePromptModal() {
        const input = this.container.querySelector('#size-prompt-input');
        const val = input ? parseInt(input.value, 10) : 0;

        if (isNaN(val) || val <= 0) {
            this.closeSizePromptModal();
            return;
        }

        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];

        if (this.sizePromptMode === 'col') {
            const clampedWidth = Math.max(35, Math.min(1000, val));
            sheet.colWidths = sheet.colWidths || {};
            sheet.colWidths[this.targetHeaderCol] = clampedWidth;
        } else if (this.sizePromptMode === 'row') {
            const clampedHeight = Math.max(18, Math.min(500, val));
            sheet.rowHeights = sheet.rowHeights || {};
            sheet.rowHeights[this.targetHeaderRow] = clampedHeight;
        }

        this.closeSizePromptModal();
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    isForeignInputFocused(target) {
        if (!target) return false;
        if (target.id === 'educonta-active-cell-input') return false;
        if (target.id === 'formula-input') return false;
        if (target.closest('#modal-formulas-guide, #modal-search-replace, #modal-size-prompt')) return true;
        if (target.closest('.educonta-glass-popover-root, .educonta-glass-select-popover, .educonta-glass-date-popover, select, optgroup, option')) return true;
        if (target.id === 'size-prompt-input' || target.id === 'search-term-input' || target.id === 'replace-term-input') return true;
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
            if (target.closest('.educonta-spreadsheet-root')) return false;
            return true;
        }
        if (target.isContentEditable) return true;
        return false;
    }

    // === AUTOCOMPLETADO Y BÚSQUEDA FLOTANTE DE FÓRMULAS ===
    checkAndShowFormulaAutocomplete(inputEl) {
        if (!inputEl || !this.autocompleteEl) return;
        const val = inputEl.value;

        // Autocompletado de fórmulas SÓLO debe activarse si el texto inicia explícitamente con '='
        if (!val || !val.startsWith('=')) {
            this.hideFormulaAutocomplete();
            return;
        }

        // Buscar el nombre de la función que se está redactando tras '=', operadores o paréntesis
        const match = val.match(/(?:=|[+\-*/(,;]+)\s*([A-Za-z.ÁÉÍÓÚáéíóúÑñ]+)$/);
        if (match) {
            const search = match[1].toUpperCase();
            if (!this.parseCellRef(search)) {
                this.isFormulaPicking = false;
                this.filteredFormulas = this.formulaCatalog.filter(item =>
                    item.es.startsWith(search) || item.en.startsWith(search)
                );

                if (this.filteredFormulas.length > 0) {
                    this.autocompleteActiveIdx = 0;
                    this.renderAutocompleteList(search);
                    this.positionAutocomplete(inputEl);
                    this.autocompleteEl.classList.remove('hidden');
                    return;
                }
            }
        }

        this.hideFormulaAutocomplete();
    }

    renderAutocompleteList(searchTerm) {
        if (!this.autocompleteListEl) return;
        this.autocompleteListEl.innerHTML = this.filteredFormulas.map((item, idx) => {
            const isActive = idx === this.autocompleteActiveIdx;
            return `
                <div class="px-3 py-2 cursor-pointer flex flex-col gap-0.5 ${isActive ? 'bg-amber-500/25 border-l-2 border-l-amber-400 text-slate-900 dark:text-slate-100 font-bold' : 'hover:bg-slate-100 dark:hover:bg-[#111a2e] text-slate-700 dark:text-slate-300'}" data-formula-idx="${idx}">
                    <div class="flex items-center justify-between">
                        <span class="tabular-nums text-amber-600 dark:text-amber-300 font-bold text-xs">${item.es}</span>
                        <span class="text-[9px] tabular-nums text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#05060a] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">${item.en}</span>
                    </div>
                    <div class="text-[10px] text-slate-600 dark:text-slate-300 truncate">${item.desc}</div>
                    <div class="text-[9px] tabular-nums font-medium text-emerald-600 dark:text-emerald-400/90 tracking-tight truncate">${item.syntax}</div>
                </div>
            `;
        }).join('');

        this.autocompleteListEl.querySelectorAll('[data-formula-idx]').forEach(el => {
            el.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const idx = parseInt(el.getAttribute('data-formula-idx'), 10);
                this.commitSelectedFormula(idx);
            });
        });

        const activeItem = this.autocompleteListEl.children[this.autocompleteActiveIdx];
        if (activeItem) {
            activeItem.scrollIntoView({ block: 'nearest' });
        }
    }

    positionAutocomplete(inputEl) {
        if (!this.autocompleteEl) return;
        const rect = inputEl.getBoundingClientRect();
        const rootRect = this.container.getBoundingClientRect();

        let top = rect.bottom - rootRect.top + 4;
        let left = rect.left - rootRect.left;

        if (left + 320 > rootRect.width) left = rootRect.width - 330;
        if (top + 250 > rootRect.height) top = rect.top - rootRect.top - 260;

        this.autocompleteEl.style.top = `${Math.max(10, top)}px`;
        this.autocompleteEl.style.left = `${Math.max(10, left)}px`;
    }

    hideFormulaAutocomplete() {
        if (this.autocompleteEl) {
            this.autocompleteEl.classList.add('hidden');
        }
    }

    commitSelectedFormula(idx = null) {
        const targetIdx = idx !== null ? idx : this.autocompleteActiveIdx;
        const selected = this.filteredFormulas[targetIdx];
        if (!selected) return;

        const activeInput = this.getActiveFormulaEditor();
        if (!activeInput) return;

        let val = activeInput.value;
        if (this.detectedRangeForFormula) {
            val = val.replace(/(?:=|[+\-*/(,;: ]+)([A-Za-z.ÁÉÍÓÚáéíóúÑñ]+)$/, (match, group1) => {
                const prefix = match.substring(0, match.length - group1.length);
                return `${prefix}${selected.es}(${this.detectedRangeForFormula})`;
            });
            this.detectedRangeForFormula = null;
        } else {
            val = val.replace(/(?:=|[+\-*/(,;: ]+)([A-Za-z.ÁÉÍÓÚáéíóúÑñ]+)$/, (match, group1) => {
                const prefix = match.substring(0, match.length - group1.length);
                return `${prefix}${selected.es}(`;
            });
        }

        activeInput.value = val;
        activeInput.focus();
        if (typeof activeInput.setSelectionRange === 'function') {
            activeInput.setSelectionRange(val.length, val.length);
        }

        this.hideFormulaAutocomplete();
        this.updateFormulaPickHighlight();
    }

    // === RESALTADO MULTICOLOR DINÁMICO DE CELDAS Y RANGOS EN FÓRMULAS ===
    updateFormulaPickHighlight() {
        const highlightedCells = this.container.querySelectorAll('.formula-ref-highlight');
        highlightedCells.forEach(td => {
            td.classList.remove(
                'formula-ref-highlight',
                'formula-ref-0', 'formula-ref-1', 'formula-ref-2', 'formula-ref-3', 'formula-ref-4', 'formula-ref-5',
                'formula-ref-6', 'formula-ref-7', 'formula-ref-8', 'formula-ref-9', 'formula-ref-10', 'formula-ref-11'
            );
        });

        const activeInput = this.getActiveFormulaEditor();
        if (!activeInput) return;

        const val = activeInput.value;
        if (!val || !val.startsWith('=')) return;

        const matches = val.match(/(\$?[A-Za-z]+\$?[0-9]+)(?::(\$?[A-Za-z]+\$?[0-9]+))?/gi);
        let uniqueRefs = [];
        if (matches) {
            uniqueRefs = [...new Set(matches.map(m => m.toUpperCase()))];
            uniqueRefs.forEach((refStr, idx) => {
                const colorClass = `formula-ref-${idx % 12}`;

                if (refStr.includes(':')) {
                    const [startRef, endRef] = refStr.split(':');
                    const pStart = this.parseCellRef(startRef);
                    const pEnd = this.parseCellRef(endRef);
                    if (pStart && pEnd) {
                        for (let r = Math.min(pStart.row, pEnd.row); r <= Math.max(pStart.row, pEnd.row); r++) {
                            for (let c = Math.min(pStart.col, pEnd.col); c <= Math.max(pStart.col, pEnd.col); c++) {
                                const td = this.container.querySelector(`#cell_${r}_${c}`);
                                if (td) {
                                    td.classList.add('formula-ref-highlight', colorClass);
                                }
                            }
                        }
                    }
                } else {
                    const p = this.parseCellRef(refStr);
                    if (p) {
                        const td = this.container.querySelector(`#cell_${p.row}_${p.col}`);
                        if (td) {
                            td.classList.add('formula-ref-highlight', colorClass);
                        }
                    }
                }
            });
        }

        if (this.isFormulaPicking) {
            const pickTd = this.container.querySelector(`#cell_${this.pickingRow}_${this.pickingCol}`);
            if (pickTd) {
                const hasTrailingRef = !!val.match(/([A-Za-z]+[0-9]+)$/i);
                const colorIdx = uniqueRefs.length > 0 ? (uniqueRefs.length - (hasTrailingRef ? 1 : 0)) : 0;
                const colorClass = `formula-ref-${colorIdx % 12}`;
                pickTd.classList.add('formula-ref-highlight', colorClass);
                pickTd.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        }
    }

    getActiveFormulaEditor() {
        const cellInput = this.getActiveCellInput();
        const formulaBarInput = document.getElementById('formula-input');
        
        if (this.isEditing && cellInput) {
            return cellInput;
        }

        if (formulaBarInput && (document.activeElement === formulaBarInput || this.isFormulaBarActive)) {
            const val = formulaBarInput.value || '';
            if (val.startsWith('=')) {
                return formulaBarInput;
            }
        }

        return null;
    }

    startFormulaRangePick(activeInput, r, c) {
        this.isFormulaPicking = true;
        this.isFormulaPickingDrag = true;
        this.formulaPickAnchorRow = r;
        this.formulaPickAnchorCol = c;
        this.pickingRow = r;
        this.pickingCol = c;

        let currentVal = activeInput.value || '=';

        // Si el usuario escribió el nombre de una fórmula (ej. '=TIR', '=SUMA') sin '(' y comenzó a seleccionar celdas, auto-abrir '('
        const fnMatch = currentVal.match(/(?:=|[+\-*/,;:])\s*([A-Za-z.ÁÉÍÓÚáéíóúÑñ]+)$/);
        if (fnMatch) {
            const candidate = fnMatch[1].toUpperCase();
            if (!this.parseCellRef(candidate)) {
                currentVal = currentVal + '(';
                activeInput.value = currentVal;
            }
        }
        
        const lastRefMatch = currentVal.match(/(?:[+\-*/(<>=,;: ]|^=)\s*(\$?[A-Za-z]+\$?\d+(?::\$?[A-Za-z]+\$?\d+)?)$/);
        
        if (lastRefMatch && this.isFormulaPickingContinuous) {
            this.formulaPickBaseText = currentVal.substring(0, currentVal.length - lastRefMatch[1].length);
        } else {
            this.formulaPickBaseText = currentVal;
        }

        const trimmed = this.formulaPickBaseText.trim();
        if (trimmed.endsWith('=') || /[+\-*/(<>=,;: ]$/.test(trimmed)) {
            this.formulaPickSeparator = '';
        } else {
            this.formulaPickSeparator = '+';
        }

        this.isFormulaPickingContinuous = true;
        const refStr = `${this.getColName(c)}${r + 1}`;
        activeInput.value = this.formulaPickBaseText + this.formulaPickSeparator + refStr;

        if (typeof activeInput.setSelectionRange === 'function') {
            activeInput.setSelectionRange(activeInput.value.length, activeInput.value.length);
        }

        this.hideFormulaAutocomplete();
        this.updateFormulaPickHighlight();
    }

    updateFormulaRangePickDrag(r, c) {
        if (!this.isFormulaPickingDrag) return;
        const activeInput = this.getActiveFormulaEditor();
        if (!activeInput) return;

        const r1 = Math.min(this.formulaPickAnchorRow, r);
        const r2 = Math.max(this.formulaPickAnchorRow, r);
        const c1 = Math.min(this.formulaPickAnchorCol, c);
        const c2 = Math.max(this.formulaPickAnchorCol, c);

        let rangeStr = '';
        if (r1 === r2 && c1 === c2) {
            rangeStr = `${this.getColName(c1)}${r1 + 1}`;
        } else {
            rangeStr = `${this.getColName(c1)}${r1 + 1}:${this.getColName(c2)}${r2 + 1}`;
        }

        activeInput.value = this.formulaPickBaseText + this.formulaPickSeparator + rangeStr;
        if (typeof activeInput.setSelectionRange === 'function') {
            activeInput.setSelectionRange(activeInput.value.length, activeInput.value.length);
        }

        this.pickingRow = r;
        this.pickingCol = c;
        this.updateFormulaPickHighlight();
    }

    handleFormulaArrowPicking(arrowKey) {
        const activeInput = this.getActiveFormulaEditor();
        if (!activeInput) return false;

        let val = activeInput.value;
        if (!val || !val.startsWith('=')) return false;

        // Si el usuario escribió el nombre de una fórmula (ej. '=TIR') sin '(' y usó flechas para apuntar, auto-abrir '('
        const fnMatch = val.match(/(?:=|[+\-*/,;:])\s*([A-Za-z.ÁÉÍÓÚáéíóúÑñ]+)$/);
        if (fnMatch) {
            const candidate = fnMatch[1].toUpperCase();
            if (!this.parseCellRef(candidate)) {
                val = val + '(';
                activeInput.value = val;
            }
        }

        const dRow = arrowKey === 'ArrowUp' ? -1 : arrowKey === 'ArrowDown' ? 1 : 0;
        const dCol = arrowKey === 'ArrowLeft' ? -1 : arrowKey === 'ArrowRight' ? 1 : 0;

        if (!this.isFormulaPicking) {
            this.isFormulaPicking = true;
            this.pickingRow = Math.max(0, Math.min(this.options.rowCount - 1, this.activeRow + dRow));
            this.pickingCol = Math.max(0, Math.min(this.options.colCount - 1, this.activeCol + dCol));
        } else {
            this.pickingRow = Math.max(0, Math.min(this.options.rowCount - 1, this.pickingRow + dRow));
            this.pickingCol = Math.max(0, Math.min(this.options.colCount - 1, this.pickingCol + dCol));
        }

        const ref = `${this.getColName(this.pickingCol)}${this.pickingRow + 1}`;

        const trailingRefMatch = val.match(/([A-Za-z]+\d+)$/);
        if (trailingRefMatch && this.isFormulaPicking) {
            val = val.substring(0, val.length - trailingRefMatch[1].length) + ref;
        } else if (val.endsWith('=') || /[+\-*/(,;: ]$/.test(val.trim())) {
            val = val + ref;
        } else {
            val = val + '+' + ref;
        }

        activeInput.value = val;
        this.updateFormulaPickHighlight();
        return true;
    }

    getActiveCellInput() {
        return this.container.querySelector('#educonta-active-cell-input');
    }

    handleGlobalKeydown(e) {
        if (e.target.closest('#modal-formulas-guide, #modal-search-replace, #modal-size-prompt, header, .educonta-glass-popover-root, .educonta-glass-select-popover, .educonta-glass-date-popover')) return;
        if (document.querySelector('.educonta-glass-select-popover:not(.hidden), .educonta-glass-date-popover:not(.hidden)')) return;
        if (this.isForeignInputFocused(e.target)) return;

        const ctrlOrCmd = e.ctrlKey || e.metaKey;
        const activeInput = this.getActiveCellInput() || (document.activeElement && document.activeElement.id === 'formula-input' ? document.activeElement : null);
        const isAutocompleteOpen = this.autocompleteEl && !this.autocompleteEl.classList.contains('hidden');

        // Si el usuario está redactando dentro de un input (celda activa o barra de fórmulas)
        if (activeInput) {
            if (isAutocompleteOpen) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.autocompleteActiveIdx = (this.autocompleteActiveIdx + 1) % this.filteredFormulas.length;
                    this.renderAutocompleteList();
                    return;
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.autocompleteActiveIdx = (this.autocompleteActiveIdx - 1 + this.filteredFormulas.length) % this.filteredFormulas.length;
                    this.renderAutocompleteList();
                    return;
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    this.hideFormulaAutocomplete();
                } else if (e.key === 'Tab' || e.key === 'Enter') {
                    e.preventDefault();
                    this.commitSelectedFormula();
                    return;
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.hideFormulaAutocomplete();
                    return;
                }
            }

            // Alternar modo edición / modo apuntado de referencias con F2
            if (e.key === 'F2') {
                e.preventDefault();
                this.isFormulaPointMode = !this.isFormulaPointMode;
                return;
            }

            if (['+', '-', '*', '/', '(', ')', ',', ';', ':'].includes(e.key)) {
                this.isFormulaPicking = false;
                this.isFormulaPickingContinuous = false;
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.isFormulaPicking = false;
                this.isFormulaPickingContinuous = false;
                this.isFormulaBarActive = false;
                this.isFormulaPointMode = false;
                this.hideFormulaAutocomplete();
                if (this.isEditing) {
                    this.commitInlineEditing();
                } else {
                    const closedVal = this.autoCloseFormula(activeInput.value);
                    this.setCellValue(this.activeRow, this.activeCol, closedVal);
                }
                this.moveSelection(1, 0);
                if (document.activeElement && document.activeElement.id === 'formula-input') {
                    document.activeElement.blur();
                }
                this.render();
                return;
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.isFormulaPicking = false;
                this.isFormulaPickingContinuous = false;
                this.isFormulaBarActive = false;
                this.isFormulaPointMode = false;
                this.hideFormulaAutocomplete();
                if (this.isEditing) {
                    this.cancelInlineEditing();
                } else {
                    this.syncFormulaBar();
                    if (document.activeElement && document.activeElement.id === 'formula-input') {
                        document.activeElement.blur();
                    }
                }
                this.render();
                return;
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.isFormulaPicking = false;
                this.isFormulaPickingContinuous = false;
                this.isFormulaBarActive = false;
                this.isFormulaPointMode = false;
                this.hideFormulaAutocomplete();
                if (this.isEditing) {
                    this.commitInlineEditing();
                } else {
                    const closedVal = this.autoCloseFormula(activeInput.value);
                    this.setCellValue(this.activeRow, this.activeCol, closedVal);
                }
                this.moveSelection(0, e.shiftKey ? -1 : 1);
                if (document.activeElement && document.activeElement.id === 'formula-input') {
                    document.activeElement.blur();
                }
                this.render();
                return;
            }

            // Manejo de Flechas Izquierda y Derecha (Desplazamiento Interno + Apuntado en Límites de Fórmulas)
            if (e.key === 'ArrowLeft') {
                const caretPos = typeof activeInput.selectionStart === 'number' ? activeInput.selectionStart : 0;
                const isAtStart = (caretPos === 0 && activeInput.selectionEnd === 0);
                const isFormula = (activeInput.value && activeInput.value.startsWith('='));

                if (isFormula && (this.isFormulaPointMode || (isAtStart && this.isFormulaPicking))) {
                    e.preventDefault();
                    this.handleFormulaArrowPicking('ArrowLeft');
                    return;
                }
                // Si no está en el límite extremo o no está en modo apuntar, permitir navegación interna normal
                return;
            }

            if (e.key === 'ArrowRight') {
                const caretPos = typeof activeInput.selectionStart === 'number' ? activeInput.selectionStart : 0;
                const isAtEnd = (caretPos >= activeInput.value.length && activeInput.selectionEnd >= activeInput.value.length);
                const isFormula = (activeInput.value && activeInput.value.startsWith('='));

                if (isFormula && (this.isFormulaPointMode || (isAtEnd && this.isFormulaPicking))) {
                    e.preventDefault();
                    this.handleFormulaArrowPicking('ArrowRight');
                    return;
                }
                // Permitir navegación interna normal dentro del texto
                return;
            }

            // Manejo de Flechas Arriba y Abajo en Edición de Fórmulas
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                const isFormula = (activeInput.value && activeInput.value.startsWith('='));
                const isAfterOp = isFormula && /[+\-*/(,;: =]$/.test(activeInput.value.trim());

                if (isFormula && (this.isFormulaPointMode || this.isFormulaPicking || isAfterOp)) {
                    e.preventDefault();
                    this.handleFormulaArrowPicking(e.key);
                    return;
                }

                // Si no está apuntando fórmulas, confirmar celda y mover selección vertical
                e.preventDefault();
                this.isFormulaPicking = false;
                this.isFormulaPointMode = false;
                this.commitInlineEditing();
                this.moveSelection(e.key === 'ArrowUp' ? -1 : 1, 0);
                return;
            }

            if (['Home', 'End', 'Backspace', 'Delete'].includes(e.key)) {
                return;
            }
        }

        if (this.isEditing) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.commitInlineEditing();
                this.moveSelection(1, 0);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelInlineEditing();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.commitInlineEditing();
                this.moveSelection(0, e.shiftKey ? -1 : 1);
            }
            return;
        }

        if (ctrlOrCmd) {
            const key = e.key.toLowerCase();
            if (key === '1' || e.code === 'Digit1') {
                e.preventDefault();
                if (typeof window.openCellFormatModal === 'function') {
                    window.openCellFormatModal();
                }
                return;
            }
            if (key === 'p') {
                e.preventDefault();
                if (typeof window.toolPrint === 'function') {
                    window.toolPrint();
                }
                return;
            }
            if (key === 'c') { e.preventDefault(); this.copySelection(false); return; }
            if (key === 'x') { e.preventDefault(); this.copySelection(true); return; }
            if (key === 'v') { e.preventDefault(); this.pasteSelection(); return; }
            if (key === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); return; }
            if (key === 'y') { e.preventDefault(); this.redo(); return; }
            if (key === 'b') { e.preventDefault(); this.toggleSelectionAttr('bold'); return; }
            if (key === 'i') { e.preventDefault(); this.toggleSelectionAttr('italic'); return; }
            if (key === 'u') { e.preventDefault(); this.toggleSelectionAttr('underline'); return; }
            if (key === 'a') { e.preventDefault(); this.selectAll(); return; }
            if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
                this.jumpToDataEdge(e.key, e.shiftKey);
                return;
            }
            if (e.key === 'Home') { e.preventDefault(); this.selectCell(0, 0, e.shiftKey); return; }
            if (e.key === 'End') {
                e.preventDefault();
                this.selectCell(this.options.rowCount - 1, this.options.colCount - 1, e.shiftKey);
                return;
            }
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Delete', 'Backspace', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
            e.preventDefault();
            this.isFormulaPicking = false;
            this.isFormulaPickingContinuous = false;
            this.hideFormulaAutocomplete();
            if (e.key === 'ArrowUp') this.moveSelection(-1, 0, e.shiftKey);
            else if (e.key === 'ArrowDown' || e.key === 'Enter') this.moveSelection(1, 0, e.shiftKey);
            else if (e.key === 'ArrowLeft') this.moveSelection(0, -1, e.shiftKey);
            else if (e.key === 'ArrowRight' || e.key === 'Tab') this.moveSelection(0, e.shiftKey && e.key === 'Tab' ? -1 : 1, e.key === 'Tab' ? false : e.shiftKey);
            else if (e.key === 'Home') this.selectCell(this.activeRow, 0, e.shiftKey);
            else if (e.key === 'End') this.selectCell(this.activeRow, this.options.colCount - 1, e.shiftKey);
            else if (e.key === 'PageUp') this.moveSelection(-10, 0, e.shiftKey);
            else if (e.key === 'PageDown') this.moveSelection(10, 0, e.shiftKey);
            else if (e.key === 'Delete' || e.key === 'Backspace') this.clearSelectedCells();
            return;
        }

        if (e.key === 'F2') {
            e.preventDefault();
            this.startInlineEditing(this.activeRow, this.activeCol);
            return;
        }

        // Detector Automático de Rango al escribir '=' sobre selección múltiple
        if (e.key === '=' && !ctrlOrCmd && !e.altKey && !this.isEditing) {
            const rMin = Math.min(this.selectStartRow, this.selectEndRow);
            const rMax = Math.max(this.selectStartRow, this.selectEndRow);
            const cMin = Math.min(this.selectStartCol, this.selectEndCol);
            const cMax = Math.max(this.selectStartCol, this.selectEndCol);

            if (rMin !== rMax || cMin !== cMax) {
                e.preventDefault();
                e.stopPropagation();

                let targetRow = rMax + 1;
                let targetCol = cMin;

                if (rMin === rMax && cMax > cMin) {
                    // Rango horizontal (fila): celda siguiente a la derecha
                    targetRow = rMin;
                    targetCol = cMax + 1;
                } else if (cMin === cMax && rMax > rMin) {
                    // Rango vertical (columna): celda siguiente abajo
                    targetRow = rMax + 1;
                    targetCol = cMin;
                } else {
                    // Bloque 2D: celda siguiente abajo de la primera columna
                    targetRow = rMax + 1;
                    targetCol = cMin;
                }

                targetRow = Math.max(0, Math.min(this.options.rowCount - 1, targetRow));
                targetCol = Math.max(0, Math.min(this.options.colCount - 1, targetCol));

                const detectedRangeStr = `${this.getColName(cMin)}${rMin + 1}:${this.getColName(cMax)}${rMax + 1}`;
                this.detectedRangeForFormula = detectedRangeStr;

                this.selectCell(targetRow, targetCol, false);
                this.startInlineEditing(targetRow, targetCol, '=');
                return;
            }
        }

        if (e.key.length === 1 && !ctrlOrCmd && !e.altKey) {
            e.preventDefault();
            e.stopPropagation();
            this.startInlineEditing(this.activeRow, this.activeCol, e.key);
        }
    }

    selectCell(r, c, isShift = false) {
        if (this.isEditing && (r !== this.editingRow || c !== this.editingCol)) {
            this.commitInlineEditing();
        }

        r = Math.max(0, Math.min(this.options.rowCount - 1, r));
        c = Math.max(0, Math.min(this.options.colCount - 1, c));

        if (isShift) {
            this.selectEndRow = r;
            this.selectEndCol = c;
        } else {
            this.activeRow = r;
            this.activeCol = c;
            this.selectStartRow = r;
            this.selectStartCol = c;
            this.selectEndRow = r;
            this.selectEndCol = c;
        }

        this.render();
    }

    moveSelection(dRow, dCol, isShift = false) {
        const targetRow = (isShift ? this.selectEndRow : this.activeRow) + dRow;
        const targetCol = (isShift ? this.selectEndCol : this.activeCol) + dCol;
        this.selectCell(targetRow, targetCol, isShift);
    }

    selectAll() {
        if (this.isEditing) this.commitInlineEditing();
        this.activeRow = 0; this.activeCol = 0;
        this.selectStartRow = 0; this.selectStartCol = 0;
        this.selectEndRow = this.options.rowCount - 1;
        this.selectEndCol = this.options.colCount - 1;
        this.render();
    }

    jumpToDataEdge(arrowKey, isShift) {
        if (this.isEditing) this.commitInlineEditing();
        const sheet = this.sheets[this.activeSheetIndex];
        const data = sheet.data || {};
        let r = isShift ? this.selectEndRow : this.activeRow;
        let c = isShift ? this.selectEndCol : this.activeCol;
        const dRow = arrowKey === 'ArrowUp' ? -1 : arrowKey === 'ArrowDown' ? 1 : 0;
        const dCol = arrowKey === 'ArrowLeft' ? -1 : arrowKey === 'ArrowRight' ? 1 : 0;

        const hasContent = (rr, cc) => {
            const cell = data[`${rr}_${cc}`];
            return !!(cell && (cell.f || (cell.v !== undefined && cell.v !== '')));
        };

        const inBounds = (rr, cc) => rr >= 0 && rr < this.options.rowCount && cc >= 0 && cc < this.options.colCount;

        const startHasContent = hasContent(r, c);
        let nr = r, nc = c;

        if (startHasContent) {
            while (inBounds(nr + dRow, nc + dCol) && hasContent(nr + dRow, nc + dCol)) {
                nr += dRow; nc += dCol;
            }
        } else {
            while (inBounds(nr + dRow, nc + dCol) && !hasContent(nr + dRow, nc + dCol)) {
                nr += dRow; nc += dCol;
            }
            if (inBounds(nr + dRow, nc + dCol)) { nr += dRow; nc += dCol; }
        }

        if (!inBounds(nr + dRow, nc + dCol)) {
            nr = Math.max(0, Math.min(this.options.rowCount - 1, nr + (inBounds(nr, nc) ? 0 : dRow)));
            nc = Math.max(0, Math.min(this.options.colCount - 1, nc));
        }

        this.selectCell(nr, nc, isShift);
    }

    // === EDICIÓN DIRECTA TRANSPARENTE DENTRO DE LA CELDA ORIGINAL ===
    startInlineEditing(r, c, initialChar = null) {
        if (window.isAuditMode) return;
        if (this.isEditing && (r !== this.editingRow || c !== this.editingCol)) {
            this.commitInlineEditing();
        }

        const td = this.container.querySelector(`#cell_${r}_${c}`);
        if (!td) return;

        this.pushHistory();
        this.isEditing = true;
        this.isFormulaPicking = false;
        this.editingRow = r;
        this.editingCol = c;

        const sheet = this.sheets[this.activeSheetIndex];
        const cellData = sheet.data[`${r}_${c}`] || {};

        let initialText = cellData.f ? this.denormalizeFormula(`=${cellData.f}`) : (cellData.v !== undefined ? cellData.v : '');
        if (initialChar !== null) {
            initialText = initialChar;
        }

        let inputStyle = "background: transparent !important; border: none !important; border-radius: 0px !important; outline: none !important; box-shadow: none !important; width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 2px !important; appearance: none !important; -webkit-appearance: none !important; user-select: text !important; -webkit-user-select: text !important; pointer-events: auto !important;";
        if (cellData.font) {
            if (typeof window.ensureGoogleFontLoaded === 'function') window.ensureGoogleFontLoaded(cellData.font);
            inputStyle += ` font-family: '${cellData.font}', sans-serif !important;`;
        } else inputStyle += ` font-family: inherit !important;`;
        if (cellData.size) inputStyle += ` font-size: ${cellData.size}pt !important;`;
        else inputStyle += ` font-size: inherit !important;`;
        if (cellData.bold) inputStyle += ` font-weight: bold !important;`;
        if (cellData.italic) inputStyle += ` font-style: italic !important;`;
        if (cellData.color) inputStyle += ` color: ${cellData.color} !important;`;
        else inputStyle += ` color: #f59e0b !important;`;

        td.innerHTML = `<input id="educonta-active-cell-input" type="text" autocomplete="off" spellcheck="false" style="${inputStyle}" />`;
        td.classList.remove('cell-selected-active');
        td.classList.add('editing-active-cell');

        const input = td.querySelector('#educonta-active-cell-input');
        input.value = initialText;
        this.activeInputEl = input;
        this.lastInputText = initialText;

        requestAnimationFrame(() => {
            input.focus();
            if (typeof input.setSelectionRange === 'function') {
                input.setSelectionRange(input.value.length, input.value.length);
            }
        });

        input.addEventListener('input', () => {
            this.lastInputText = input.value;
            const val = input.value;
            if (/[+\-*/(<>=,;: ]$/.test(val.trim())) {
                this.isFormulaPickingContinuous = false;
            }
            this.checkAndShowFormulaAutocomplete(input);
            this.updateFormulaPickHighlight();
            if (typeof window.markUnsavedChanges === 'function') window.markUnsavedChanges();
        });

        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (this.isEditing && this.activeInputEl === input && !this.isFormulaPicking && (!this.autocompleteEl || this.autocompleteEl.classList.contains('hidden'))) {
                    this.commitInlineEditing();
                }
            }, 150);
        });
    }

    commitInlineEditing() {
        if (!this.isEditing) return;
        const input = this.activeInputEl || this.container.querySelector('#educonta-active-cell-input');
        let text = input ? input.value : (this.lastInputText !== undefined ? this.lastInputText : '');
        text = this.autoCloseFormula(text);
        const targetRow = this.editingRow;
        const targetCol = this.editingCol;
        this.isEditing = false;
        this.isFormulaPicking = false;
        this.activeInputEl = null;
        this.lastInputText = undefined;
        this.hideFormulaAutocomplete();
        this.setCellValue(targetRow, targetCol, text.trim(), { skipHistory: true });
    }

    cancelInlineEditing() {
        this.isEditing = false;
        this.isFormulaPicking = false;
        this.activeInputEl = null;
        this.lastInputText = undefined;
        this.hideFormulaAutocomplete();
        this.history.pop();
        this.render();
    }

    // === HISTORIAL (UNDO/REDO COMPLETO INCLUYENDO DIMENSIONES DE MATRIZ) ===
    snapshotSheets() {
        return JSON.stringify({
            sheets: this.sheets,
            rowCount: this.options.rowCount,
            colCount: this.options.colCount
        });
    }

    pushHistory() {
        this.history.push(this.snapshotSheets());
        if (this.history.length > this.options.maxHistory) this.history.shift();
        this.future = [];
    }

    restoreSnapshot(snapshot) {
        if (!snapshot) return;
        try {
            const parsed = JSON.parse(snapshot);
            if (parsed && parsed.sheets) {
                this.sheets = parsed.sheets;
                this.options.rowCount = parsed.rowCount || this.options.rowCount;
                this.options.colCount = parsed.colCount || this.options.colCount;
            } else {
                this.sheets = parsed;
            }
        } catch (e) {
            console.error('Error al restaurar snapshot:', e);
            return;
        }

        if (this.activeSheetIndex >= this.sheets.length) this.activeSheetIndex = this.sheets.length - 1;
        this.activeRow = Math.min(this.activeRow, this.options.rowCount - 1);
        this.activeCol = Math.min(this.activeCol, this.options.colCount - 1);
        this.selectStartRow = Math.min(this.selectStartRow, this.options.rowCount - 1);
        this.selectEndRow = Math.min(this.selectEndRow, this.options.rowCount - 1);
        this.selectStartCol = Math.min(this.selectStartCol, this.options.colCount - 1);
        this.selectEndCol = Math.min(this.selectEndCol, this.options.colCount - 1);

        this.rebuildHyperFormula();
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    undo() {
        if (this.history.length === 0) return;
        this.future.push(this.snapshotSheets());
        const snap = this.history.pop();
        this.restoreSnapshot(snap);
    }

    redo() {
        if (this.future.length === 0) return;
        this.history.push(this.snapshotSheets());
        const snap = this.future.pop();
        this.restoreSnapshot(snap);
    }

    // === ESTABLECER VALORES Y REENVIAR A HYPERFORMULA ===
    setCellValue(r, c, valObj, opts = {}) {
        if (!opts.skipHistory) this.pushHistory();

        const sheet = this.sheets[this.activeSheetIndex];
        sheet.data = sheet.data || {};
        const cellKey = `${r}_${c}`;
        sheet.data[cellKey] = sheet.data[cellKey] || {};

        let content = '';
        if (typeof valObj === 'object' && valObj !== null && valObj.f) {
            content = this.normalizeFormula(valObj.f);
            sheet.data[cellKey].f = content.substring(1);
            delete sheet.data[cellKey].v;
        } else {
            const strVal = String(valObj !== null && valObj !== undefined ? valObj : '').trim();
            if (strVal.startsWith('=') && strVal.length > 1) {
                content = this.normalizeFormula(strVal);
                sheet.data[cellKey].f = content.substring(1);
                delete sheet.data[cellKey].v;
            } else if (strVal === '') {
                content = '';
                delete sheet.data[cellKey].f;
                delete sheet.data[cellKey].v;
            } else {
                delete sheet.data[cellKey].f;

                // Auto-detección inteligente de formato contable al ingresar datos
                const numVal = this.cleanNumericValue(strVal);
                if (numVal !== null && typeof strVal === 'string') {
                    if (strVal.includes('%')) {
                        if (!sheet.data[cellKey].fmt) sheet.data[cellKey].fmt = 'percent';
                        sheet.data[cellKey].v = numVal;
                        content = numVal;
                    } else if (strVal.includes('$')) {
                        if (!sheet.data[cellKey].fmt) sheet.data[cellKey].fmt = 'usd';
                        sheet.data[cellKey].v = numVal;
                        content = numVal;
                    } else if (!isNaN(Number(strVal.replace(/,/g, '')))) {
                        sheet.data[cellKey].v = Number(strVal.replace(/,/g, ''));
                        content = Number(strVal.replace(/,/g, ''));
                    } else {
                        sheet.data[cellKey].v = numVal;
                        content = numVal;
                    }
                } else {
                    sheet.data[cellKey].v = strVal;
                    content = strVal;
                }
            }
        }

        // Heredar formato predeterminado de la columna si la celda no tiene uno explícito
        if (content !== '' && sheet.colFormats && sheet.colFormats[c] && sheet.data[cellKey].fmt === undefined) {
            const colFmt = sheet.colFormats[c];
            if (colFmt.fmt) sheet.data[cellKey].fmt = colFmt.fmt;
            if (colFmt.fmtDecimals !== undefined) sheet.data[cellKey].fmtDecimals = colFmt.fmtDecimals;
            if (colFmt.fmtNegatives !== undefined) sheet.data[cellKey].fmtNegatives = colFmt.fmtNegatives;
            if (colFmt.fmtDate !== undefined) sheet.data[cellKey].fmtDate = colFmt.fmtDate;
            if (colFmt.fmtTime !== undefined) sheet.data[cellKey].fmtTime = colFmt.fmtTime;
        }

        // Auto-expandir tabla inteligente si se escribió al borde inferior o derecho
        if (content !== '') {
            this.checkAutoExpandTable(r, c);
        }

        if (this.hfInstance) {
            const sheetId = this.sheetIdMap[sheet.name];
            if (sheetId !== undefined) {
                try {
                    let hfContent = content;
                    if (typeof hfContent === 'string' && !hfContent.startsWith('=')) {
                        const clean = this.cleanNumericValue(hfContent);
                        if (clean !== null) hfContent = clean;
                    }
                    this.hfInstance.setCellContents({ sheet: sheetId, col: c, row: r }, hfContent);
                } catch (e) {
                    console.error('Error al actualizar HyperFormula:', e);
                }
            }
        }

        this.render();
        if (typeof this.options.onCellChange === 'function') {
            this.options.onCellChange({ sheetId: sheet.id, row: r, col: c, data: sheet.data[cellKey] });
        }
        if (typeof this.options.onChange === 'function') {
            this.options.onChange();
        }
    }

    setCellAttr(r, c, key, value) {
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        sheet.data = sheet.data || {};
        const cellKey = `${r}_${c}`;
        sheet.data[cellKey] = sheet.data[cellKey] || {};
        sheet.data[cellKey][key] = value;
        this.render();
        if (typeof this.options.onCellChange === 'function') {
            this.options.onCellChange({ sheetId: sheet.id, row: r, col: c, data: sheet.data[cellKey] });
        }
        if (typeof this.options.onChange === 'function') {
            this.options.onChange();
        }
    }

    applyAttrToSelection(key, value) {
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        sheet.data = sheet.data || {};
        const r1 = Math.min(this.selectStartRow, this.selectEndRow);
        const r2 = Math.max(this.selectStartRow, this.selectEndRow);
        const c1 = Math.min(this.selectStartCol, this.selectEndCol);
        const c2 = Math.max(this.selectStartCol, this.selectEndCol);

        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                const cellKey = `${r}_${c}`;
                sheet.data[cellKey] = sheet.data[cellKey] || {};
                sheet.data[cellKey][key] = value;
            }
        }
        this.render();
        if (typeof this.options.onCellRangeChange === 'function') {
            this.options.onCellRangeChange({ sheetId: sheet.id, r1, r2, c1, c2, key, value });
        }
        if (typeof this.options.onChange === 'function') {
            this.options.onChange();
        }
    }

    toggleSelectionAttr(key) {
        const sheet = this.sheets[this.activeSheetIndex];
        const active = sheet.data[`${this.activeRow}_${this.activeCol}`] || {};
        this.applyAttrToSelection(key, !active[key]);
    }

    toggleMergeSelection() {
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        sheet.data = sheet.data || {};
        const r1 = Math.min(this.selectStartRow, this.selectEndRow);
        const r2 = Math.max(this.selectStartRow, this.selectEndRow);
        const c1 = Math.min(this.selectStartCol, this.selectEndCol);
        const c2 = Math.max(this.selectStartCol, this.selectEndCol);

        const rootKey = `${r1}_${c1}`;
        const rootCell = sheet.data[rootKey] || {};

        // Si ya está combinada, descombinar
        if (rootCell.merge) {
            const { rowspan, colspan } = rootCell.merge;
            for (let r = r1; r < r1 + rowspan; r++) {
                for (let c = c1; c < c1 + colspan; c++) {
                    const k = `${r}_${c}`;
                    if (sheet.data[k]) {
                        delete sheet.data[k].mergedInto;
                        delete sheet.data[k].merge;
                    }
                }
            }
        } else {
            // Si hay 2 o más celdas seleccionadas, combinar
            if (r1 === r2 && c1 === c2) return;
            const rowspan = r2 - r1 + 1;
            const colspan = c2 - c1 + 1;
            rootCell.merge = { rowspan, colspan };
            sheet.data[rootKey] = rootCell;

            for (let r = r1; r <= r2; r++) {
                for (let c = c1; c <= c2; c++) {
                    if (r === r1 && c === c1) continue;
                    const k = `${r}_${c}`;
                    sheet.data[k] = sheet.data[k] || {};
                    sheet.data[k].mergedInto = rootKey;
                }
            }
        }

        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    sortColumn(colIdx, order = 'asc') {
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        sheet.data = sheet.data || {};

        const rows = [];
        for (let r = 0; r < this.options.rowCount; r++) {
            const rowObj = { r, data: {} };
            for (let c = 0; c < this.options.colCount; c++) {
                if (sheet.data[`${r}_${c}`]) {
                    rowObj.data[c] = Object.assign({}, sheet.data[`${r}_${c}`]);
                }
            }
            rows.push(rowObj);
        }

        rows.sort((a, b) => {
            const valA = a.data[colIdx] ? (a.data[colIdx].v !== undefined ? a.data[colIdx].v : a.data[colIdx].f || '') : '';
            const valB = b.data[colIdx] ? (b.data[colIdx].v !== undefined ? b.data[colIdx].v : b.data[colIdx].f || '') : '';
            const numA = parseFloat(String(valA).replace(/[$€,\s]/g, ''));
            const numB = parseFloat(String(valB).replace(/[$€,\s]/g, ''));
            if (!isNaN(numA) && !isNaN(numB)) {
                return order === 'asc' ? numA - numB : numB - numA;
            }
            return order === 'asc' 
                ? String(valA).localeCompare(String(valB)) 
                : String(valB).localeCompare(String(valA));
        });

        const newData = {};
        rows.forEach((row, newR) => {
            Object.keys(row.data).forEach(c => {
                newData[`${newR}_${c}`] = row.data[c];
            });
        });
        sheet.data = newData;
        this.rebuildHyperFormula();
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    clearSelectedCells() {
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        const sheetId = this.sheetIdMap ? this.sheetIdMap[sheet.name] : null;

        const r1 = Math.min(this.selectStartRow, this.selectEndRow);
        const r2 = Math.max(this.selectStartRow, this.selectEndRow);
        const c1 = Math.min(this.selectStartCol, this.selectEndCol);
        const c2 = Math.max(this.selectStartCol, this.selectEndCol);

        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                delete sheet.data[`${r}_${c}`];
                if (this.hfInstance && sheetId !== null) {
                    try {
                        this.hfInstance.setCellContents({ sheet: sheetId, col: c, row: r }, '');
                    } catch (e) { /* noop */ }
                }
            }
        }
        this.render();
        if (typeof this.options.onChange === 'function') {
            this.options.onChange();
        }
    }

    // === COPIAR / CORTAR / PEGAR ===
    copySelection(cut = false) {
        const sheet = this.sheets[this.activeSheetIndex];
        const r1 = Math.min(this.selectStartRow, this.selectEndRow);
        const r2 = Math.max(this.selectStartRow, this.selectEndRow);
        const c1 = Math.min(this.selectStartCol, this.selectEndCol);
        const c2 = Math.max(this.selectStartCol, this.selectEndCol);
        const width = c2 - c1 + 1;
        const height = r2 - r1 + 1;

        const styles = [];
        for (let dr = 0; dr < height; dr++) {
            const row = [];
            for (let dc = 0; dc < width; dc++) {
                const cellData = sheet.data[`${r1 + dr}_${c1 + dc}`] || {};
                const styleKeys = ['bold', 'italic', 'underline', 'strikethrough', 'align', 'valign', 'indent', 'color', 'bgcolor', 'font', 'size', 'fmt', 'fmtDecimals', 'fmtNegatives', 'fmtDate', 'border', 'borderColor', 'wrap'];
                const style = {};
                styleKeys.forEach(k => { if (cellData[k] !== undefined) style[k] = cellData[k]; });
                row.push(style);
            }
            styles.push(row);
        }

        if (this.hfInstance) {
            const sheetId = this.sheetIdMap[sheet.name];
            const source = { sheet: sheetId, col: c1, row: r1 };
            try {
                if (cut) this.hfInstance.cut(source, width, height);
                else this.hfInstance.copy(source, width, height);
            } catch (e) {
                console.error('Error al copiar/cortar:', e);
                return;
            }
        }

        this.clipboard = { width, height, cut, sourceRow: r1, sourceCol: c1, styles, sheetName: sheet.name };

        try {
            const lines = [];
            for (let dr = 0; dr < height; dr++) {
                const rowVals = [];
                for (let dc = 0; dc < width; dc++) {
                    const cd = sheet.data[`${r1 + dr}_${c1 + dc}`] || {};
                    rowVals.push(cd.f ? `=${cd.f}` : (cd.v !== undefined ? cd.v : ''));
                }
                lines.push(rowVals.join('\t'));
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
            }
        } catch (e) { /* noop */ }
    }

    pasteSelection() {
        if (!this.clipboard) return;
        this.pushHistory();

        const sheet = this.sheets[this.activeSheetIndex];
        const { width, height, styles, cut } = this.clipboard;
        const destRow = this.activeRow;
        const destCol = this.activeCol;

        if (this.hfInstance) {
            const sheetId = this.sheetIdMap[sheet.name];
            const target = { sheet: sheetId, col: destCol, row: destRow };
            try {
                this.hfInstance.paste(target);
            } catch (e) {
                console.error('Error al pegar:', e);
            }

            for (let dr = 0; dr < height; dr++) {
                for (let dc = 0; dc < width; dc++) {
                    const rr = destRow + dr;
                    const cc = destCol + dc;
                    if (rr >= this.options.rowCount || cc >= this.options.colCount) continue;
                    let serialized;
                    try {
                        serialized = this.hfInstance.getCellSerialized({ sheet: sheetId, col: cc, row: rr });
                    } catch (e) { serialized = ''; }

                    const cellKey = `${rr}_${cc}`;
                    sheet.data[cellKey] = sheet.data[cellKey] || {};
                    if (typeof serialized === 'string' && serialized.startsWith('=')) {
                        sheet.data[cellKey].f = serialized.substring(1);
                        delete sheet.data[cellKey].v;
                    } else if (serialized === '' || serialized === null || serialized === undefined) {
                        delete sheet.data[cellKey].f;
                        delete sheet.data[cellKey].v;
                    } else {
                        delete sheet.data[cellKey].f;
                        sheet.data[cellKey].v = serialized;
                    }
                    Object.assign(sheet.data[cellKey], styles[dr][dc]);
                }
            }

            if (cut) {
                const srcSheet = this.sheets.find(s => s.name === this.clipboard.sheetName) || sheet;
                for (let dr = 0; dr < height; dr++) {
                    for (let dc = 0; dc < width; dc++) {
                        const srcRow = this.clipboard.sourceRow + dr;
                        const srcCol = this.clipboard.sourceCol + dc;
                        if (srcSheet !== sheet || srcRow < destRow || srcRow >= destRow + height || srcCol < destCol || srcCol >= destCol + width) {
                            delete srcSheet.data[`${srcRow}_${srcCol}`];
                        }
                    }
                }
                try { this.hfInstance.clearClipboard(); } catch (e) { /* noop */ }
                this.clipboard = null;
            }
        } else {
            for (let dr = 0; dr < height; dr++) {
                for (let dc = 0; dc < width; dc++) {
                    const rr = destRow + dr;
                    const cc = destCol + dc;
                    if (rr >= this.options.rowCount || cc >= this.options.colCount) continue;
                    const srcData = sheet.data[`${this.clipboard.sourceRow + dr}_${this.clipboard.sourceCol + dc}`] || {};
                    sheet.data[`${rr}_${cc}`] = Object.assign({}, srcData);
                }
            }

            if (cut) {
                const srcSheet = this.sheets.find(s => s.name === this.clipboard.sheetName) || sheet;
                for (let dr = 0; dr < height; dr++) {
                    for (let dc = 0; dc < width; dc++) {
                        const srcRow = this.clipboard.sourceRow + dr;
                        const srcCol = this.clipboard.sourceCol + dc;
                        if (srcSheet !== sheet || srcRow < destRow || srcRow >= destRow + height || srcCol < destCol || srcCol >= destCol + width) {
                            delete srcSheet.data[`${srcRow}_${srcCol}`];
                        }
                    }
                }
                this.clipboard = null;
            }
        }

        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    // === INSERTAR / ELIMINAR FILAS Y COLUMNAS ===
    insertRowAt(atRow) {
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        const sheetId = this.sheetIdMap ? this.sheetIdMap[sheet.name] : null;
        if (this.hfInstance && sheetId !== undefined) {
            try { this.hfInstance.addRows(sheetId, [[atRow, 1]]); } catch (e) { console.error(e); }
        }
        this.shiftDataForRowInsert(sheet, atRow);
        this.options.rowCount += 1;
        this.resyncFromHyperFormula();
    }

    deleteRowAt(atRow) {
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        const sheetId = this.sheetIdMap ? this.sheetIdMap[sheet.name] : null;
        if (this.hfInstance && sheetId !== undefined) {
            try { this.hfInstance.removeRows(sheetId, [[atRow, atRow]]); } catch (e) { console.error(e); }
        }
        this.shiftDataForRowDelete(sheet, atRow);
        this.options.rowCount = Math.max(1, this.options.rowCount - 1);
        this.resyncFromHyperFormula();
    }

    insertColAt(atCol) {
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        const sheetId = this.sheetIdMap ? this.sheetIdMap[sheet.name] : null;
        if (this.hfInstance && sheetId !== undefined) {
            try { this.hfInstance.addColumns(sheetId, [[atCol, 1]]); } catch (e) { console.error(e); }
        }
        this.shiftDataForColInsert(sheet, atCol);
        this.options.colCount += 1;
        this.resyncFromHyperFormula();
    }

    deleteColAt(atCol) {
        this.pushHistory();
        const sheet = this.sheets[this.activeSheetIndex];
        const sheetId = this.sheetIdMap ? this.sheetIdMap[sheet.name] : null;
        if (this.hfInstance && sheetId !== undefined) {
            try { this.hfInstance.removeColumns(sheetId, [[atCol, atCol]]); } catch (e) { console.error(e); }
        }
        this.shiftDataForColDelete(sheet, atCol);
        this.options.colCount = Math.max(1, this.options.colCount - 1);
        this.resyncFromHyperFormula();
    }

    shiftDataForRowInsert(sheet, atRow) {
        const newData = {};
        Object.keys(sheet.data).forEach(key => {
            const [r, c] = key.split('_').map(Number);
            const newR = r >= atRow ? r + 1 : r;
            newData[`${newR}_${c}`] = sheet.data[key];
        });
        sheet.data = newData;
    }

    shiftDataForRowDelete(sheet, atRow) {
        const newData = {};
        Object.keys(sheet.data).forEach(key => {
            const [r, c] = key.split('_').map(Number);
            if (r === atRow) return;
            const newR = r > atRow ? r - 1 : r;
            newData[`${newR}_${c}`] = sheet.data[key];
        });
        sheet.data = newData;
    }

    shiftDataForColInsert(sheet, atCol) {
        const newData = {};
        Object.keys(sheet.data).forEach(key => {
            const [r, c] = key.split('_').map(Number);
            const newC = c >= atCol ? c + 1 : c;
            newData[`${r}_${newC}`] = sheet.data[key];
        });
        sheet.data = newData;
    }

    shiftDataForColDelete(sheet, atCol) {
        const newData = {};
        Object.keys(sheet.data).forEach(key => {
            const [r, c] = key.split('_').map(Number);
            if (c === atCol) return;
            const newC = c > atCol ? c - 1 : c;
            newData[`${r}_${newC}`] = sheet.data[key];
        });
        sheet.data = newData;
    }

    resyncFromHyperFormula() {
        if (!this.hfInstance) { this.render(); if (typeof this.options.onChange === 'function') this.options.onChange(); return; }
        const sheet = this.sheets[this.activeSheetIndex];
        const sheetId = this.sheetIdMap[sheet.name];
        Object.keys(sheet.data).forEach(key => {
            const [r, c] = key.split('_').map(Number);
            let serialized;
            try {
                serialized = this.hfInstance.getCellSerialized({ sheet: sheetId, col: c, row: r });
            } catch (e) { return; }
            if (typeof serialized === 'string' && serialized.startsWith('=')) {
                sheet.data[key].f = serialized.substring(1);
                delete sheet.data[key].v;
            } else if (serialized !== '' && serialized !== null && serialized !== undefined) {
                delete sheet.data[key].f;
                sheet.data[key].v = serialized;
            }
        });
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
    }

    // === HOJAS Y VIÑETAS (GESTIÓN Y EDICIÓN COMPLETA) ===
    addSheet() {
        this.pushHistory();
        const newIndex = this.sheets.length + 1;
        let newSheetName = `Hoja${newIndex}`;
        let counter = newIndex;
        while (this.sheets.some(s => s.name.toLowerCase() === newSheetName.toLowerCase())) {
            counter++;
            newSheetName = `Hoja${counter}`;
        }

        const newSheet = {
            id: `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: newSheetName,
            data: {},
            colWidths: {},
            rowHeights: {},
            hiddenCols: {},
            hiddenRows: {},
            tables: [],
            colFormats: {},
            tabColor: null
        };

        this.sheets.push(newSheet);
        this.activeSheetIndex = this.sheets.length - 1;
        this.rebuildHyperFormula();
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
        if (typeof window.markUnsavedChanges === 'function') window.markUnsavedChanges();
    }

    openSheetTabMenu(index, x, y) {
        if (!this.sheetTabMenuEl || index < 0 || index >= this.sheets.length) return;
        this.hideAllMenus();
        this.activeMenuSheetIndex = index;
        const sheet = this.sheets[index];

        const titleEl = this.container.querySelector('#sheet-tab-menu-title');
        if (titleEl) titleEl.textContent = sheet.name;

        // Paleta de colores de viñeta
        const paletteEl = this.container.querySelector('#sheet-tab-color-palette');
        if (paletteEl) {
            const colors = ['#f59e0b', '#10b981', '#0ea5e9', '#6366f1', '#ec4899', '#8b5cf6', '#ef4444', '#64748b'];
            paletteEl.innerHTML = colors.map(c => `
                <button type="button" onclick="spreadsheetEngine && spreadsheetEngine.setSheetTabColor(${index}, '${c}')" class="w-5 h-5 rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm hover:scale-110 transition-transform cursor-pointer ${sheet.tabColor === c ? 'ring-2 ring-amber-400 scale-105' : ''}" style="background-color: ${c};" title="Color ${c}"></button>
            `).join('');
        }

        // Habilitar / Deshabilitar Mover y Eliminar
        const btnLeft = this.container.querySelector('#btn-move-sheet-left');
        if (btnLeft) {
            if (index === 0) {
                btnLeft.classList.add('opacity-40', 'pointer-events-none');
            } else {
                btnLeft.classList.remove('opacity-40', 'pointer-events-none');
            }
        }

        const btnRight = this.container.querySelector('#btn-move-sheet-right');
        if (btnRight) {
            if (index === this.sheets.length - 1) {
                btnRight.classList.add('opacity-40', 'pointer-events-none');
            } else {
                btnRight.classList.remove('opacity-40', 'pointer-events-none');
            }
        }

        const btnDelete = this.container.querySelector('#btn-delete-sheet-tab');
        if (btnDelete) {
            if (this.sheets.length <= 1) {
                btnDelete.classList.add('opacity-40', 'pointer-events-none');
            } else {
                btnDelete.classList.remove('opacity-40', 'pointer-events-none');
            }
        }

        this.sheetTabMenuEl.classList.remove('hidden');

        // Posicionar el menú hacia arriba de la pestaña
        const menuRect = this.sheetTabMenuEl.getBoundingClientRect();
        let posX = x;
        let posY = y - menuRect.height - 8;

        if (posY < 10) {
            posY = y + 10;
        }
        if (posX + menuRect.width > window.innerWidth - 10) {
            posX = window.innerWidth - menuRect.width - 10;
        }
        if (posX < 10) posX = 10;

        this.sheetTabMenuEl.style.left = `${posX}px`;
        this.sheetTabMenuEl.style.top = `${posY}px`;
    }

    closeSheetTabMenu() {
        if (this.sheetTabMenuEl) this.sheetTabMenuEl.classList.add('hidden');
        this.activeMenuSheetIndex = null;
    }

    promptRenameActiveTab() {
        if (this.activeMenuSheetIndex === null) return;
        const index = this.activeMenuSheetIndex;
        this.hideAllMenus();
        if (typeof window.openSheetRenameModal === 'function') {
            window.openSheetRenameModal(index);
            return;
        }
        const currentName = this.sheets[index].name;
        const newName = prompt('Ingresa el nuevo nombre para la viñeta / pestaña:', currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
            this.renameSheet(index, newName.trim());
        }
    }

    startInlineTabRename(index, nameSpan) {
        if (!nameSpan || index < 0 || index >= this.sheets.length) return;
        const currentName = this.sheets[index].name;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.maxLength = 40;
        input.className = 'h-5 px-1.5 bg-white dark:bg-slate-900 border border-amber-500 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 outline-none w-32 shadow-inner';
        
        let committed = false;
        const commit = () => {
            if (committed) return;
            committed = true;
            const newName = input.value.trim();
            if (newName && newName !== currentName) {
                this.renameSheet(index, newName);
            } else {
                this.renderTabs();
            }
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                commit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                committed = true;
                this.renderTabs();
            }
        });

        input.addEventListener('blur', commit);

        nameSpan.replaceWith(input);
        input.focus();
        input.select();
    }

    renameSheet(index, newName) {
        if (index < 0 || index >= this.sheets.length || !newName) return;
        const cleanName = newName.trim().substring(0, 40);
        if (!cleanName) return;

        // Comprobar si ya existe otra hoja con el mismo nombre
        const duplicate = this.sheets.some((s, idx) => idx !== index && s.name.toLowerCase() === cleanName.toLowerCase());
        if (duplicate) {
            alert(`Ya existe una hoja con el nombre "${cleanName}". Por favor ingresa un nombre diferente.`);
            return;
        }

        this.pushHistory();
        this.sheets[index].name = cleanName;
        this.rebuildHyperFormula();
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
        if (typeof window.markUnsavedChanges === 'function') window.markUnsavedChanges();
    }

    duplicateActiveTab() {
        if (this.activeMenuSheetIndex === null) return;
        const index = this.activeMenuSheetIndex;
        this.hideAllMenus();
        if (typeof window.openSheetDuplicateModal === 'function') {
            window.openSheetDuplicateModal(index);
            return;
        }
        this.duplicateSheet(index);
    }

    duplicateSheet(index) {
        if (index < 0 || index >= this.sheets.length) return;
        this.pushHistory();
        const sourceSheet = this.sheets[index];

        // Generar nombre de copia único
        let copyName = `${sourceSheet.name} (Copia)`;
        let counter = 2;
        while (this.sheets.some(s => s.name.toLowerCase() === copyName.toLowerCase())) {
            copyName = `${sourceSheet.name} (Copia ${counter})`;
            counter++;
        }

        const newSheet = {
            id: `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: copyName,
            data: JSON.parse(JSON.stringify(sourceSheet.data || {})),
            colWidths: JSON.parse(JSON.stringify(sourceSheet.colWidths || {})),
            rowHeights: JSON.parse(JSON.stringify(sourceSheet.rowHeights || {})),
            hiddenCols: JSON.parse(JSON.stringify(sourceSheet.hiddenCols || {})),
            hiddenRows: JSON.parse(JSON.stringify(sourceSheet.hiddenRows || {})),
            tables: JSON.parse(JSON.stringify(sourceSheet.tables || [])),
            colFormats: JSON.parse(JSON.stringify(sourceSheet.colFormats || {})),
            tabColor: sourceSheet.tabColor || null
        };

        this.sheets.splice(index + 1, 0, newSheet);
        this.activeSheetIndex = index + 1;
        this.rebuildHyperFormula();
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
        if (typeof window.markUnsavedChanges === 'function') window.markUnsavedChanges();
    }

    setSheetTabColor(index, color) {
        if (index < 0 || index >= this.sheets.length) return;
        this.pushHistory();
        this.sheets[index].tabColor = color || null;
        this.hideAllMenus();
        this.renderTabs();
        if (typeof this.options.onChange === 'function') this.options.onChange();
        if (typeof window.markUnsavedChanges === 'function') window.markUnsavedChanges();
    }

    moveActiveTabLeft() {
        if (this.activeMenuSheetIndex === null || this.activeMenuSheetIndex <= 0) return;
        this.moveSheet(this.activeMenuSheetIndex, this.activeMenuSheetIndex - 1);
        this.hideAllMenus();
    }

    moveActiveTabRight() {
        if (this.activeMenuSheetIndex === null || this.activeMenuSheetIndex >= this.sheets.length - 1) return;
        this.moveSheet(this.activeMenuSheetIndex, this.activeMenuSheetIndex + 1);
        this.hideAllMenus();
    }

    moveSheet(fromIndex, toIndex) {
        if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= this.sheets.length || toIndex < 0 || toIndex >= this.sheets.length) return;
        this.pushHistory();
        const moved = this.sheets.splice(fromIndex, 1)[0];
        this.sheets.splice(toIndex, 0, moved);
        this.activeSheetIndex = toIndex;
        this.rebuildHyperFormula();
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
        if (typeof window.markUnsavedChanges === 'function') window.markUnsavedChanges();
    }

    deleteActiveTab() {
        if (this.activeMenuSheetIndex === null) return;
        const index = this.activeMenuSheetIndex;
        this.hideAllMenus();
        if (typeof window.openSheetDeleteModal === 'function') {
            window.openSheetDeleteModal(index);
            return;
        }
        this.deleteSheet(index);
    }

    deleteSheet(index, skipConfirm = false) {
        if (index < 0 || index >= this.sheets.length) return;
        if (this.sheets.length <= 1) {
            alert('El libro contable debe tener al menos una hoja visible.');
            return;
        }

        const sheetName = this.sheets[index].name;
        if (!skipConfirm && typeof window.openSheetDeleteModal === 'function') {
            window.openSheetDeleteModal(index);
            return;
        }
        if (!skipConfirm && !confirm(`¿Estás seguro de que deseas eliminar permanentemente la hoja "${sheetName}"?`)) {
            return;
        }

        this.pushHistory();
        this.sheets.splice(index, 1);
        this.activeSheetIndex = Math.min(this.activeSheetIndex, this.sheets.length - 1);
        this.rebuildHyperFormula();
        this.render();
        if (typeof this.options.onChange === 'function') this.options.onChange();
        if (typeof window.markUnsavedChanges === 'function') window.markUnsavedChanges();
    }

    // === BÚSQUEDA Y REEMPLAZO ===
    findNext(term, fromRow = null, fromCol = null) {
        if (!term) return null;
        const sheet = this.sheets[this.activeSheetIndex];
        const total = this.options.rowCount * this.options.colCount;
        let startR = fromRow !== null ? fromRow : this.activeRow;
        let startC = fromCol !== null ? fromCol : this.activeCol;
        let idx = startR * this.options.colCount + startC;

        for (let step = 1; step <= total; step++) {
            idx = (idx + 1) % total;
            const r = Math.floor(idx / this.options.colCount);
            const c = idx % this.options.colCount;
            const cell = sheet.data[`${r}_${c}`];
            const text = cell ? String(cell.v !== undefined ? cell.v : (cell.f || '')) : '';
            if (text.toLowerCase().includes(term.toLowerCase())) {
                this.selectCell(r, c, false);
                return { row: r, col: c };
            }
        }
        return null;
    }

    replaceAll(term, replacement) {
        if (!term) return 0;
        const sheet = this.sheets[this.activeSheetIndex];
        let count = 0;
        Object.keys(sheet.data).forEach(key => {
            const [r, c] = key.split('_').map(Number);
            const cell = sheet.data[key];
            if (cell.f) return;
            if (cell.v !== undefined && String(cell.v).toLowerCase().includes(term.toLowerCase())) {
                const newVal = String(cell.v).split(new RegExp(term, 'gi')).join(replacement);
                this.setCellValue(r, c, newVal, { skipHistory: count > 0 });
                count++;
            }
        });
        return count;
    }

    // === ESTADÍSTICAS DE SELECCIÓN ===
    getSelectionStats() {
        const sheet = this.sheets[this.activeSheetIndex];
        const sheetId = this.sheetIdMap ? this.sheetIdMap[sheet.name] : null;
        const r1 = Math.min(this.selectStartRow, this.selectEndRow);
        const r2 = Math.max(this.selectStartRow, this.selectEndRow);
        const c1 = Math.min(this.selectStartCol, this.selectEndCol);
        const c2 = Math.max(this.selectStartCol, this.selectEndCol);

        const values = [];
        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                let val;
                if (this.hfInstance && sheetId !== undefined) {
                    try { val = this.hfInstance.getCellValue({ sheet: sheetId, col: c, row: r }); } catch (e) { val = undefined; }
                } else {
                    const cd = sheet.data[`${r}_${c}`];
                    val = cd ? (cd.v !== undefined ? cd.v : undefined) : undefined;
                }
                const num = this.cleanNumericValue(val);
                if (num !== null && !isNaN(num) && isFinite(num)) values.push(num);
            }
        }

        const sum = values.reduce((a, b) => a + b, 0);
        return {
            sum,
            avg: values.length ? sum / values.length : 0,
            count: values.length,
            min: values.length ? Math.min(...values) : 0,
            max: values.length ? Math.max(...values) : 0,
        };
    }

    // === BARRA DE FÓRMULAS ===
    bindFormulaBar() {
        const formulaInput = document.getElementById('formula-input');
        if (!formulaInput || formulaInput._eduContaBound) return;
        formulaInput._eduContaBound = true;

        formulaInput.addEventListener('focus', () => {
            if (formulaInput.value.startsWith('=')) {
                this.isFormulaBarActive = true;
                this.updateFormulaPickHighlight();
            }
        });

        formulaInput.addEventListener('input', () => {
            if (formulaInput.value.startsWith('=')) {
                this.isFormulaBarActive = true;
            }
            const val = formulaInput.value;
            if (/[+\-*/(<>=,;: ]$/.test(val.trim())) {
                this.isFormulaPickingContinuous = false;
            }
            this.checkAndShowFormulaAutocomplete(formulaInput);
            this.updateFormulaPickHighlight();
            if (typeof window.markUnsavedChanges === 'function') window.markUnsavedChanges();
        });

        formulaInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (!this.isFormulaPickingDrag && document.activeElement !== formulaInput) {
                    if (!this.isFormulaPicking) {
                        this.isFormulaBarActive = false;
                    }
                }
            }, 250);
        });

        formulaInput.addEventListener('keydown', (e) => {
            const isAutocompleteOpen = this.autocompleteEl && !this.autocompleteEl.classList.contains('hidden');
            if (isAutocompleteOpen) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.autocompleteActiveIdx = (this.autocompleteActiveIdx + 1) % this.filteredFormulas.length;
                    this.renderAutocompleteList();
                    return;
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.autocompleteActiveIdx = (this.autocompleteActiveIdx - 1 + this.filteredFormulas.length) % this.filteredFormulas.length;
                    this.renderAutocompleteList();
                    return;
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    this.hideFormulaAutocomplete();
                } else if (e.key === 'Tab' || e.key === 'Enter') {
                    e.preventDefault();
                    this.commitSelectedFormula();
                    return;
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.hideFormulaAutocomplete();
                    return;
                }
            }

            if (['+', '-', '*', '/', '(', ')', ',', ';', ':'].includes(e.key)) {
                this.isFormulaPicking = false;
                this.isFormulaPickingContinuous = false;
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.isFormulaPicking = false;
                this.isFormulaPickingContinuous = false;
                this.isFormulaBarActive = false;
                this.hideFormulaAutocomplete();
                const closedVal = this.autoCloseFormula(formulaInput.value);
                this.setCellValue(this.activeRow, this.activeCol, closedVal);
                this.moveSelection(1, 0);
                formulaInput.blur();
                this.render();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.isFormulaPicking = false;
                this.isFormulaPickingContinuous = false;
                this.isFormulaBarActive = false;
                this.hideFormulaAutocomplete();
                this.syncFormulaBar();
                formulaInput.blur();
                this.render();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.isFormulaPicking = false;
                this.isFormulaPickingContinuous = false;
                this.isFormulaBarActive = false;
                this.hideFormulaAutocomplete();
                const closedVal = this.autoCloseFormula(formulaInput.value);
                this.setCellValue(this.activeRow, this.activeCol, closedVal);
                this.moveSelection(0, e.shiftKey ? -1 : 1);
                formulaInput.blur();
                this.render();
            }
        });
    }

    syncFormulaBar() {
        const formulaInput = document.getElementById('formula-input');
        const nameBox = document.getElementById('cell-name-box');
        const sheet = this.sheets[this.activeSheetIndex];
        const cellData = sheet.data[`${this.activeRow}_${this.activeCol}`] || {};
        if (formulaInput && document.activeElement !== formulaInput) {
            formulaInput.value = cellData.f ? this.denormalizeFormula(`=${cellData.f}`) : (cellData.v !== undefined ? cellData.v : '');
        }
        if (nameBox) {
            nameBox.textContent = `${this.getColName(this.activeCol)}${this.activeRow + 1}`;
        }
    }

    triggerSelectCallback() {
        this.syncFormulaBar();
        const sheet = this.sheets[this.activeSheetIndex];
        const cellData = sheet.data[`${this.activeRow}_${this.activeCol}`] || {};
        const colFormat = (sheet.colFormats && sheet.colFormats[this.activeCol]) || null;
        const effectiveFmt = cellData.fmt || (colFormat && colFormat.fmt) || 'general';
        const formatMeta = this.getFormatMeta(effectiveFmt);
        const activeTable = this.getTableAt(this.activeRow, this.activeCol);
        if (typeof this.options.onCellSelect === 'function') {
            this.options.onCellSelect({
                row: this.activeRow,
                col: this.activeCol,
                colName: this.getColName(this.activeCol),
                cellRef: `${this.getColName(this.activeCol)}${this.activeRow + 1}`,
                data: cellData,
                colFormat: colFormat,
                effectiveFmt: effectiveFmt,
                formatMeta: formatMeta,
                table: activeTable,
                stats: this.getSelectionStats(),
            });
        }
    }
}

window.EduContaSpreadsheetEngine = EduContaSpreadsheetEngine;
