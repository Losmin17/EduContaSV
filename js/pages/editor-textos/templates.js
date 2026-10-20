/**
 * templates.js — DocumentTemplates
 * Plantillas contables y legales salvadoreñas estructuradas con elementos 100% nativos
 * y editables del procesador de texto (sin hacks CSS inaccesibles ni guiones frágiles).
 * EduConta SV
 */
import { MultiPageEngine } from './engine.js';
import { TextDocStateManager } from './state.js';
import { DocStatsManager } from './stats.js';

const DocumentTemplates = {
    templates: {
        carta_solicitud: () => {
            const fecha = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });
            return `
                <p style="text-align: right;"><strong>San Salvador, ${fecha}</strong></p>
                <p><br></p>
                <p>Señores:<br>
                <strong>FIRMA DE AUDITORES &amp; CONSULTORES, S.A. DE C.V.</strong><br>
                Presente.</p>
                <p><br></p>
                <p><strong>ASUNTO: Solicitud de Propuesta de Servicios de Auditoría Externa y Fiscal</strong></p>
                <p><br></p>
                <p>Estimados señores:</p>
                <p>Por medio de la presente, nos dirigimos a ustedes con el propósito de solicitarles formalmente una propuesta técnica y económica para la realización de la <strong>Auditoría Externa de Estados Financieros y Dictamen Fiscal</strong> correspondiente al ejercicio contable vigente de nuestra sociedad.</p>
                <p>Nuestra entidad se encuentra sujeta al cumplimiento de las Normas Internacionales de Información Financiera (NIIF) y las disposiciones vigentes del Código Tributario de El Salvador. Solicitamos incluir dentro de su propuesta el alcance del trabajo, cronograma preliminar de visitas y honorarios profesionales estimados.</p>
                <p>Agradeciendo de antemano su atención a la presente solicitud, quedamos atentos a su pronta comunicación.</p>
                <p><br></p>
                <p>Atentamente,</p>
                <div class="doc-signature-block" style="margin-top: 48px;">
                    <div style="display: block; width: 280px; text-align: left;">
                        <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 100%; margin-bottom: 6px;"></div>
                        <p style="margin: 0; font-weight: 700;">Representante Legal / Gerente General</p>
                        <p style="margin: 0; font-size: 0.85em; color: #64748b;">EduConta SV S.A. de C.V.</p>
                    </div>
                </div>
            `;
        },

        memorando: () => {
            const fecha = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });
            return `
                <h2 style="text-align: center; margin-bottom: 6px;">MEMORANDO INTERNO</h2>
                <hr class="doc-accent-rule">
                <p><br></p>
                <table class="table-borderless" style="width: 100%; border: none; margin-bottom: 16px;">
                    <tbody>
                        <tr><td style="border: none; width: 15%; padding: 4px 6px;"><strong>DE:</strong></td><td style="border: none; padding: 4px 6px;">Gerencia Financiera y Administrativa</td></tr>
                        <tr><td style="border: none; width: 15%; padding: 4px 6px;"><strong>PARA:</strong></td><td style="border: none; padding: 4px 6px;">Equipo de Contabilidad, Tesorería y Bodega</td></tr>
                        <tr><td style="border: none; width: 15%; padding: 4px 6px;"><strong>FECHA:</strong></td><td style="border: none; padding: 4px 6px;">${fecha}</td></tr>
                        <tr><td style="border: none; width: 15%; padding: 4px 6px;"><strong>ASUNTO:</strong></td><td style="border: none; padding: 4px 6px;"><strong>Instrucciones para el Cierre Contable Mensual y Arqueos</strong></td></tr>
                    </tbody>
                </table>
                <hr>
                <p>Estimado equipo:</p>
                <p>Por medio del presente memorando se establecen las directrices obligatorias para la ejecución del cierre contable del presente período:</p>
                <ul>
                    <li><strong>Conciliaciones Bancarias:</strong> Deberán quedar cuadradas y firmadas antes del día 5 hábil posterior al cierre.</li>
                    <li><strong>Toma Física de Inventarios:</strong> El conteo físico en bodega central se llevará a cabo el último día hábil a partir de las 16:00 horas.</li>
                    <li><strong>Cuentas por Cobrar y Pagar:</strong> Remitir informe de antigüedades de saldos a la Gerencia Financiera.</li>
                    <li><strong>Declaraciones Tributarias:</strong> Preparación del F-07 (IVA y Pago a Cuenta) y F-14 para revisión previa.</li>
                </ul>
                <p>Agradecemos su compromiso y puntualidad en el cumplimiento de estas disposiciones.</p>
            `;
        },

        contrato_servicios: () => {
            return `
                <h2 style="text-align: center; margin-bottom: 6px;">CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES CONTABLES</h2>
                <hr class="doc-accent-rule">
                <p><br></p>
                <p>Nosotros, por una parte <strong>[NOMBRE DE LA EMPRESA CLIENTE]</strong>, sociedad constituida bajo las leyes de El Salvador, que en adelante se denominará <strong>"EL CONTRATANTE"</strong>; y por otra parte <strong>[NOMBRE DEL PROFESIONAL CONTABLE]</strong>, Contador Público Autorizado, que en adelante se denominará <strong>"EL CONTRATISTA"</strong>, convenimos celebrar el presente contrato sujeto a las siguientes cláusulas:</p>
                <p><br></p>
                <p><strong>PRIMERA: OBJETO DEL CONTRATO.</strong> El Contratista se compromete a prestar sus servicios profesionales independientes de teneduría de libros contables (Diario, Mayor, Estados Financieros y Registros del IVA) cumpliendo con las NIIF y la legislación tributaria y mercantil de El Salvador.</p>
                <p><strong>SEGUNDA: HONORARIOS Y FORMA DE PAGO.</strong> El Contratante pagará al Contratista la suma mensual de <strong>$[MONTO] DÓLARES</strong> de los Estados Unidos de América. Se aplicará la retención del <strong>10% en concepto de Impuesto sobre la Renta (ISR)</strong> de conformidad al Artículo 156 del Código Tributario.</p>
                <p><strong>TERCERA: CONFIDENCIALIDAD.</strong> El Contratista guardará estricto secreto profesional respecto a toda la información contable, financiera y tributaria a la que tenga acceso.</p>
                <p><strong>CUARTA: PLAZO.</strong> El presente contrato tendrá una vigencia de un año calendario a partir de su firma.</p>
                <p><br></p>
                <table class="table-borderless doc-signature-table" style="width: 100%; border: none; margin-top: 48px;">
                    <tbody>
                        <tr>
                            <td style="width: 48%; text-align: center; border: none; padding: 0 12px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 240px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">EL CONTRATANTE</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Firma y Sello</p>
                            </td>
                            <td style="width: 4%; border: none;"></td>
                            <td style="width: 48%; text-align: center; border: none; padding: 0 12px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 240px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">EL CONTRATISTA</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Firma y Sello</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        },

        acta_junta: () => {
            const fecha = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });
            return `
                <h2 style="text-align: center; margin-bottom: 6px;">ACTA NÚMERO DIEZ: JUNTA GENERAL ORDINARIA DE ACCIONISTAS</h2>
                <hr class="doc-accent-rule">
                <p><br></p>
                <p>En la ciudad de San Salvador, a las diez horas del día <strong>${fecha}</strong>, reunidos en la sede social de <strong>[NOMBRE DE LA SOCIEDAD, S.A. DE C.V.]</strong>, los accionistas que representan el cien por ciento del capital social suscrito y pagado, se procedió a desarrollar la siguiente agenda:</p>
                <ol>
                    <li>Comprobación del quórum legal y apertura de la sesión.</li>
                    <li>Lectura y aprobación de la Memoria de Labores de la Administración.</li>
                    <li>Aprobación del Balance General y Estado de Resultados del ejercicio finalizado.</li>
                    <li>Destino de las utilidades y reserva legal.</li>
                    <li>Nombramiento de Auditor Externo y Fiscal.</li>
                </ol>
                <p><br></p>
                <p><strong>ACUERDO PRIMERO:</strong> Se aprueban por unanimidad los Estados Financieros presentados por la administración.</p>
                <p><strong>ACUERDO SEGUNDO:</strong> Se acuerda aplicar el siete por ciento (7%) a la Reserva Legal y distribuir el remanente en concepto de dividendos a los accionistas.</p>
                <p><br></p>
                <div class="doc-signature-block" style="margin-top: 48px; text-align: center;">
                    <div style="display: inline-block; width: 300px; text-align: center;">
                        <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 100%; margin-bottom: 6px;"></div>
                        <p style="margin: 0; font-weight: 700;">Presidente y Secretario de la Junta</p>
                    </div>
                </div>
            `;
        },

        dictamen_auditoria: () => {
            return `
                <h2 style="text-align: center; margin-bottom: 6px;">INFORME DEL AUDITOR INDEPENDIENTE</h2>
                <hr class="doc-accent-rule">
                <p><br></p>
                <p>A los Accionistas y Junta Directiva de:<br>
                <strong>[NOMBRE DE LA SOCIEDAD], S.A. DE C.V.</strong></p>
                <p><br></p>
                <p><strong>Opinión Favorable (Limpia)</strong></p>
                <p>Hemos auditado los estados financieros adjuntos de la sociedad, que comprenden el Estado de Situación Financiera al 31 de diciembre, el Estado de Resultados Integral, el Estado de Cambios en el Patrimonio y el Estado de Flujos de Efectivo correspondientes al ejercicio terminado en dicha fecha, así como un resumen de las políticas contables significativas.</p>
                <p>En nuestra opinión, los estados financieros adjuntos presentan razonablemente, en todos los aspectos materiales, la situación financiera de la entidad, así como sus resultados y flujos de efectivo de conformidad con las Normas Internacionales de Información Financiera (NIIF para las PYMES) y la normativa del Consejo de Vigilancia de la Profesión de Contaduría Pública y Auditoría (CVPCPA) de El Salvador.</p>
                <p><br></p>
                <p><strong>Fundamento de la Opinión</strong></p>
                <p>Hemos llevado a cabo nuestra auditoría de conformidad con las Normas Internacionales de Auditoría (NIA). Nuestras responsabilidades se describen con mayor detalle en la sección <em>Responsabilidades del auditor</em> de nuestro informe.</p>
                <div class="doc-signature-block" style="margin-top: 48px;">
                    <div style="display: block; width: 280px; text-align: left;">
                        <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 100%; margin-bottom: 6px;"></div>
                        <p style="margin: 0; font-weight: 700;">Auditor Externo Autorizado</p>
                        <p style="margin: 0; font-size: 0.85em; color: #64748b;">Registro CVPCPA No. [XXXX]</p>
                    </div>
                </div>
            `;
        },

        acta_recepcion: () => {
            const fecha = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });
            return `
                <h2 style="text-align: center; margin-bottom: 6px;">ACTA DE RECEPCIÓN Y CONFORMIDAD DE BIENES (BTVAC 1.2 / 1.5)</h2>
                <hr class="doc-accent-rule">
                <p style="text-align: right; margin-top: 8px;"><strong>Acta N.°:</strong> ARB-${new Date().getFullYear()}-0042 &nbsp;|&nbsp; <strong>Fecha:</strong> ${fecha}</p>
                <table class="table-bordered" style="width: 100%; margin-top: 12px; font-size: 11pt;">
                    <tbody>
                        <tr>
                            <td><strong>Proveedor:</strong></td>
                            <td>[NOMBRE DEL PROVEEDOR, S.A. DE C.V.]</td>
                            <td><strong>N.° CCF / Factura:</strong></td>
                            <td>CCF-001294</td>
                        </tr>
                        <tr>
                            <td><strong>N.° Orden de Compra:</strong></td>
                            <td>OC-${new Date().getFullYear()}-0018</td>
                            <td><strong>Bodega Destino:</strong></td>
                            <td>Bodega Central de Materias Primas</td>
                        </tr>
                    </tbody>
                </table>
                <p><br></p>
                <p>En las instalaciones de la empresa se procede a la inspección física, verificación técnica y control de calidad de los bienes remitidos según el siguiente detalle:</p>
                <table class="table-striped" style="width: 100%; text-align: center; font-size: 10.5pt;">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th style="text-align: left;">Descripción del Artículo</th>
                            <th>Cant. Doc.</th>
                            <th>Cant. Recibida</th>
                            <th>Estado Físico</th>
                            <th>Resultado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>MP-0101</td>
                            <td style="text-align: left;">Resmas de Papel Bond Base 20 Carta</td>
                            <td>100</td>
                            <td>100</td>
                            <td>Óptimo / Sellado</td>
                            <td><span class="doc-badge doc-badge-emerald">CONFORME</span></td>
                        </tr>
                        <tr>
                            <td>MP-0102</td>
                            <td style="text-align: left;">Tóner Negro de Alta Capacidad Modelo X</td>
                            <td>10</td>
                            <td>10</td>
                            <td>Empaque Original</td>
                            <td><span class="doc-badge doc-badge-emerald">CONFORME</span></td>
                        </tr>
                    </tbody>
                </table>
                <p><br></p>
                <p><strong>Observaciones:</strong> La mercadería cumple satisfactoriamente con las especificaciones técnicas requeridas. Se autoriza el ingreso en el sistema de Kardex y se remite el Comprobante de Crédito Fiscal al Departamento de Contabilidad para su registro y programación de pago.</p>
                <table class="table-borderless doc-signature-table" style="width: 100%; border: none; margin-top: 48px;">
                    <tbody>
                        <tr>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Encargado(a) de Bodega</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Recepción y Custodia</p>
                            </td>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Control de Calidad</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Inspección Técnica</p>
                            </td>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Entregado por Proveedor</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Firma y Sello</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        },

        requisicion_bodega: () => {
            const fecha = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });
            return `
                <h2 style="text-align: center; margin-bottom: 6px;">REQUISICIÓN Y SOLICITUD DE MATERIALES A BODEGA</h2>
                <hr class="doc-accent-rule">
                <p style="text-align: right; margin-top: 8px;"><strong>Requisición N.°:</strong> REQ-${new Date().getFullYear()}-0105 &nbsp;|&nbsp; <strong>Fecha:</strong> ${fecha}</p>
                <table class="table-bordered" style="width: 100%; margin-top: 12px; font-size: 11pt;">
                    <tbody>
                        <tr>
                            <td><strong>Centro de Costo / Área:</strong></td>
                            <td>Departamento de Producción / Fabricación</td>
                            <td><strong>Orden de Trabajo:</strong></td>
                            <td>OT-Lote-45</td>
                        </tr>
                        <tr>
                            <td><strong>Solicitante:</strong></td>
                            <td>Jefe de Producción / Supervisor</td>
                            <td><strong>Fecha Requerida:</strong></td>
                            <td>Inmediata</td>
                        </tr>
                    </tbody>
                </table>
                <p><br></p>
                <table class="table-striped" style="width: 100%; text-align: center; font-size: 10.5pt;">
                    <thead>
                        <tr>
                            <th>Ítem</th>
                            <th>Código</th>
                            <th style="text-align: left;">Descripción del Material</th>
                            <th>Cant. Solicitada</th>
                            <th>Cant. Despachada</th>
                            <th>Costo Unit.</th>
                            <th>Total Estimado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>MP-0210</td>
                            <td style="text-align: left;">Materia Prima A (Uso directo en ensamble)</td>
                            <td>50 Unidades</td>
                            <td>50 Unidades</td>
                            <td>$12.50</td>
                            <td>$625.00</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>MAT-008</td>
                            <td style="text-align: left;">Insumos auxiliares de embalaje</td>
                            <td>20 Rollos</td>
                            <td>20 Rollos</td>
                            <td>$3.75</td>
                            <td>$75.00</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr style="font-weight: bold;">
                            <td colspan="6" style="text-align: right;">TOTAL MATERIA PRIMA DESPACHADA:</td>
                            <td style="color: #0284c7;">$700.00</td>
                        </tr>
                    </tfoot>
                </table>
                <p><br></p>
                <p><em>Constancia: La bodega central descargará de inmediato del inventario las cantidades antes detalladas mediante el método de valuación vigente (PEPS o Promedio Ponderado).</em></p>
                <table class="table-borderless doc-signature-table" style="width: 100%; border: none; margin-top: 48px;">
                    <tbody>
                        <tr>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Solicitado por</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Jefatura de Área</p>
                            </td>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Autorizado por</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Gerencia de Operaciones</p>
                            </td>
                            <td style="width: 32%; text-align: center; border: none; padding: 0 8px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 180px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Despachado por Bodega</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Descargo Kardex Efectuado</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        },

        contrato_trabajo_sv: () => {
            const fecha = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });
            return `
                <h2 style="text-align: center; margin-bottom: 6px;">CONTRATO INDIVIDUAL DE TRABAJO A PLAZO INDEFINIDO</h2>
                <hr class="doc-accent-rule">
                <p style="text-align: center; font-size: 10pt; color: #475569;">(Formulado conforme al Artículo 23 y siguientes del Código de Trabajo de la República de El Salvador)</p>
                <p><br></p>
                <p>Nosotros, por una parte <strong>[NOMBRE DEL REPRESENTANTE LEGAL]</strong>, de [EDAD] años de edad, [PROFESIÓN U OFICIO], del domicilio de [CIUDAD/DEPARTAMENTO], portador de mi Documento Único de Identidad número [DUI-PATRONO], actuando en mi calidad de Representante Legal de la entidad <strong>[NOMBRE DE LA EMPRESA / SOCIEDAD], S.A. DE C.V.</strong>, con Número de Identificación Tributaria [NIT-EMPRESA], que en lo sucesivo se denominará <strong>"EL PATRONO"</strong>; y por otra parte <strong>[NOMBRE COMPLETO DEL TRABAJADOR]</strong>, de [EDAD] años de edad, de sexo [MASCULINO/FEMENINO], estado familiar [SOLTERO(A)/CASADO(A)], de profesión u oficio [PROFESIÓN], del domicilio de [CIUDAD/DEPARTAMENTO], con Documento Único de Identidad número [DUI-TRABAJADOR], y con Número de Identificación Tributaria [NIT-TRABAJADOR], que en lo sucesivo se denominará <strong>"EL TRABAJADOR"</strong>, convenimos en celebrar el presente Contrato Individual de Trabajo sujeto a las estipulaciones siguientes:</p>
                <p><br></p>
                <p><strong>I. CLASE DE TRABAJO O SERVICIO:</strong> El Trabajador se compromete a prestar sus servicios personales como <strong>AUXILIAR CONTABLE / ADMINISTRATIVO</strong>, realizando las labores de registro de partidas en libros contables, conciliaciones bancarias, control de inventarios Kardex, arqueos de caja y apoyo en declaraciones tributarias.</p>
                <p><strong>II. LUGAR DE PRESTACIÓN DE SERVICIOS:</strong> Los servicios se prestarán en las instalaciones principales de la empresa ubicadas en [DIRECCIÓN COMPLETA DE LA OFICINA O SUCURSAL], El Salvador.</p>
                <p><strong>III. DURACIÓN DEL CONTRATO Y PERÍODO DE PRUEBA:</strong> El presente contrato se celebra por <strong>TIEMPO INDEFINIDO</strong>. Se estipula un período de prueba de <strong>treinta días</strong> de conformidad al Artículo 28 del Código de Trabajo.</p>
                <p><strong>IV. HORARIO Y JORNADA DE TRABAJO:</strong> La jornada ordinaria semanal será de <strong>cuarenta y cuatro horas diurnas</strong>, distribuidas de lunes a viernes de las 8:00 a las 17:00 horas con una hora para tomar alimentos y descanso, y sábados de las 8:00 a las 12:00 horas, respetando los límites del Artículo 161 del Código de Trabajo.</p>
                <p><strong>V. SALARIO, FORMA Y LUGAR DE PAGO:</strong> El salario acordado es de <strong>$[MONTO DEVENGADO] DÓLARES</strong> de los Estados Unidos de América por mes calendario, pagaderos quincenalmente en días 15 y último de cada mes mediante transferencia bancaria. Sobre dicho salario se aplicarán estrictamente las deducciones legales obligatorias de El Salvador:
                    <ul>
                        <li><strong>ISSS (Salud):</strong> 3.0% laboral (con el tope máximo legal de cotización de $1,000.00).</li>
                        <li><strong>AFP (Pensión):</strong> 7.25% laboral de conformidad a la Ley del Sistema de Pensiones.</li>
                        <li><strong>Impuesto sobre la Renta (ISR):</strong> Tabla de retención oficial mensual emitida por el Ministerio de Hacienda (Decreto No. 10).</li>
                    </ul>
                </p>
                <p><strong>VI. PRESTACIONES DE LEY:</strong> El Patrono reconoce el pago de <strong>Vacación Anual Remunerada</strong> de 15 días continuos con el 30% de recargo de conformidad al Artículo 177 del Código de Trabajo, y el pago de <strong>Aguinaldo Anual</strong> según los años de servicio continuo en cumplimiento de los Artículos 196 y siguientes del Código de Trabajo.</p>
                <p><strong>VII. OBLIGACIONES Y PROHIBICIONES:</strong> Ambas partes se comprometen a respetar las obligaciones y prohibiciones señaladas en el Código de Trabajo y el Reglamento Interno de Trabajo de la empresa.</p>
                <p><br></p>
                <p>En fe de lo acordado, se firman dos ejemplares de igual valor legal en la ciudad de San Salvador, a los ${fecha}.</p>
                <table class="table-borderless doc-signature-table" style="width: 100%; border: none; margin-top: 48px;">
                    <tbody>
                        <tr>
                            <td style="width: 48%; text-align: center; border: none; padding: 0 12px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 240px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">POR EL PATRONO</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Representante Legal / Apoderado</p>
                            </td>
                            <td style="width: 4%; border: none;"></td>
                            <td style="width: 48%; text-align: center; border: none; padding: 0 12px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 240px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">EL TRABAJADOR</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">DUI: ________________________</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        },

        solicitud_cotizacion: () => {
            const fecha = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });
            return `
                <h2 style="text-align: center; margin-bottom: 6px;">SOLICITUD FORMAL DE COTIZACIÓN COMERCIAL (BTVAC 1.2)</h2>
                <hr class="doc-accent-rule">
                <p style="text-align: right; margin-top: 8px;"><strong>SC-N.°:</strong> COT-${new Date().getFullYear()}-0089 &nbsp;|&nbsp; <strong>Fecha:</strong> ${fecha}</p>
                <table class="table-bordered" style="width: 100%; margin-top: 12px; font-size: 11pt;">
                    <tbody>
                        <tr>
                            <td><strong>Señores Proveedores:</strong></td>
                            <td>[NOMBRE DE LA CASA COMERCIAL / DISTRIBUIDOR]</td>
                            <td><strong>Atención:</strong></td>
                            <td>Departamento de Ventas Corporativas</td>
                        </tr>
                        <tr>
                            <td><strong>Empresa Solicitante:</strong></td>
                            <td>EduConta SV S.A. de C.V. (Gran Contribuyente)</td>
                            <td><strong>Plazo de Oferta:</strong></td>
                            <td>Vigencia mínima 30 días</td>
                        </tr>
                    </tbody>
                </table>
                <p><br></p>
                <p>Agradeceremos presentarnos su mejor oferta económica y condiciones de entrega para el suministro de los siguientes bienes:</p>
                <table class="table-striped" style="width: 100%; text-align: center; font-size: 10.5pt;">
                    <thead>
                        <tr>
                            <th>Renglón</th>
                            <th style="text-align: left;">Descripción y Especificaciones Técnicas</th>
                            <th>Cantidad</th>
                            <th>Precio Unit. (Sin IVA)</th>
                            <th>IVA (13%)</th>
                            <th>Precio Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>01</td>
                            <td style="text-align: left;">Computadoras de Escritorio Core i5, 16GB RAM, 512GB SSD para área contable</td>
                            <td>5 Equipos</td>
                            <td>[A cotizar]</td>
                            <td>[A cotizar]</td>
                            <td>[A cotizar]</td>
                        </tr>
                        <tr>
                            <td>02</td>
                            <td style="text-align: left;">Impresoras Multifuncionales Láser de Alto Rendimiento con escáner dúplex</td>
                            <td>2 Equipos</td>
                            <td>[A cotizar]</td>
                            <td>[A cotizar]</td>
                            <td>[A cotizar]</td>
                        </tr>
                    </tbody>
                </table>
                <p><br></p>
                <p><strong>Condiciones indispensables para la cotización:</strong></p>
                <ol>
                    <li>Presentar precios desglosando el 13% de IVA en Comprobante de Crédito Fiscal (CCF).</li>
                    <li>Indicar tiempo de entrega en días hábiles y período de garantía técnica por escrito (mínimo 1 año).</li>
                    <li>Términos de crédito: Crédito comercial a 30 días fecha de emisión del CCF.</li>
                </ol>
                <table class="table-borderless doc-signature-table" style="width: 100%; border: none; margin-top: 48px;">
                    <tbody>
                        <tr>
                            <td style="width: 48%; text-align: center; border: none; padding: 0 12px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 240px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Unidad de Adquisiciones y Compras</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">EduConta SV S.A. de C.V.</p>
                            </td>
                            <td style="width: 4%; border: none;"></td>
                            <td style="width: 48%; text-align: center; border: none; padding: 0 12px; vertical-align: top;">
                                <div class="doc-signature-line" style="border-top: 1.5px solid #475569; width: 240px; margin: 0 auto 6px auto;"></div>
                                <p style="margin: 0; font-weight: 700;">Gerencia Administrativa y Financiera</p>
                                <p style="margin: 0; font-size: 0.85em; color: #64748b;">Vo.Bo. Presupuestario</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        }
    },

    load(type) {
        if (!this.templates[type]) return;
        if (confirm('¿Deseas insertar esta plantilla? Se cargará en el documento.')) {
            const html = this.templates[type]();
            MultiPageEngine.loadContent(html);
            TextDocStateManager.pushHistory();
            DocStatsManager.update();
            TextDocStateManager.triggerAutoSave();
            TextDocStateManager.showToast('Plantilla cargada con éxito');
        }
    }
};

export { DocumentTemplates };