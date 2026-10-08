# Sprint 1 (versión 2) — Conexión SII, extracción, Diagnóstico Base y backoffice

7 de octubre de 2026 · Cristóbal Oyanedel

En 5 días hábiles una persona debe poder registrarse, conectar su RUT y clave tributaria, ver cómo el sistema extrae sus fuentes desde el SII y recibir su **Diagnóstico Base**. El equipo interno debe poder ver en el **backoffice** quiénes han entrado y cómo se compone el portafolio.

Este documento reemplaza como plan vigente a `sprint-1-conexion-extraccion-diagnostico-base.md`, que queda sin modificar como referencia. Reúne en un solo lugar todas las fórmulas que el motor debe implementar, con su estado y su evidencia.

## Qué cambió respecto del plan anterior

| Tema | Antes | Ahora |
| --- | --- | --- |
| UF | Un valor de referencia cargado a mano | Se obtiene del SII todos los días y cada cálculo pide la de su fecha |
| Diagnóstico Base en pantalla | Una página larga | Seis vistas (Resumen, Cálculos, Crédito, Datos del SII, Pendientes, Glosario). Los cálculos se ven como bloques y la explicación de uno queda siempre abierta al lado |
| PDF | Lo mismo que la pantalla | Documento completo aparte: imprime todas las vistas y todos los cálculos en orden |
| Fórmulas | Repartidas en tres tablas | Un solo catálogo numerado, con redondeo, tolerancia y casos especiales |
| Reunión con Ricardo | Doce puntos por confirmar y cinco por determinar | Diez cerrados y aplicados; quedan cinco por confirmar y dos por determinar |
| Origen de los datos | Una tabla de fuentes | Ruta paso a paso de cada fuente, cada dato con su código y los cálculos que lo usan, y una ficha por cálculo con lo que toma y lo que necesita |
| Contingencias Art. 53 y 97 | Sin fórmulas | Fórmulas deducidas del caso y verificadas, en un anexo. Siguen fuera de la fase 1 |
| Backoffice | "Vista Propietarios mínima" | Propietarios y Radiografía del portafolio, con sus datos, fórmulas, endpoints y tickets |
| Agente del portafolio | Sin mencionar | Visible como "Próximamente", igual que el agente del cliente |

## Lo que confirmó Ricardo (reunión del 7 de octubre)

Se revisaron con él los pendientes del método. Este documento y el prototipo ya incorporan lo que quedó cerrado.

| Pendiente | Respuesta de Ricardo | Efecto |
| --- | --- | --- |
| Base imponible | Orígenes menos rebajas tiene que coincidir con el código 170; la diferencia de AT 2022 del informe real es un error | Pasa a "calculado" |
| UTA | Siempre la de diciembre del mismo año de la declaración | Pasa a "calculado" |
| Tramo Art. 55 bis | Hasta 90 UTA, 100% de la rebaja; entre 90 y 150 se extingue gradualmente; desde 150, nada. Tope de 8 UTA | Pasa a "calculado" y se agrega el cálculo de la rebaja máxima |
| Tramo de Global Complementario | Art. 52 de la Ley de la Renta; usar la tabla de cada año tributario, que ya viene en pesos | Fuente cerrada; falta cargar las tablas |
| Credit Capacity | No hay tasa ni plazo únicos: tiene que ser interactivo, con las variables ajustables. La tabla va de 5 a 25 años y de 3,0% a 5,0% | Pasa a "calculado". Tiene su propia vista, Crédito: la persona escribe la tasa y el plazo y todo el informe se recalcula |
| Factor leverage | Lo define cada institución; niveles F1 a F5 | Pasa a "calculado", con factores 1 a 5 |
| Deuda por institución | Sale de la tabla de propiedades: valor de compra menos pie, sumado por institución | Nuevo cálculo, verificado contra la vista de BICRED |
| Asiento de apertura, valor depreciable, monto IVA y estado de resultados | Son contables; no van | Salen del informe |
| Renta financiera bruta | Dio el concepto (código 158 menos gastos rechazados y rentas presuntas) y no recordó los códigos | Sigue por confirmar: su descripción no reproduce sus casos |
| Factor de renta neta | En la reunión grabada no recordó el contexto. Cristóbal informa que lo validó después | Pasa a "calculado" con la regla tal como estaba: 0,90 bajo 15% de tasa efectiva y 0,80 desde 15% |
| Leverage por institución | "Súper importante"; no dio la fórmula | Por determinar: falta el divisor |

No se trataron: la fecha de la UF, la tasa del crédito automotriz, el código de cada rebaja, el origen de la marca de Ley 20.455 y la recomendación sobre esa ley.

Lo que no cambia: el informe **no interpreta**. No tiene semáforo, evaluaciones ni texto generado. Dos personas con las mismas cifras reciben el mismo informe, y lo que el método aún no define se muestra rotulado como "por confirmar" o "por determinar".

## Alcance

| Pantalla | Para quién | Qué hace | Qué falta construir |
| --- | --- | --- | --- |
| Conexión | Cliente | Se registra, ingresa RUT y clave, autoriza la consulta | Registro, consentimiento, sesión efímera con el SII, creación del run |
| Extracción | Cliente | Ve el avance fuente por fuente y puede cancelar | Conectores, parsers, estados del run, evidencia cruda |
| Diagnóstico Base | Cliente | Ve sus resultados, abre cada cálculo, simula un crédito y descarga el PDF | Motor de cálculo y reporte con el contrato que ya usa el front |
| Propietarios | Equipo interno | Ve cada cliente procesado con sus cifras principales | Persistencia por cliente y listado |
| Radiografía | Equipo interno | Ve cómo se agrupa el portafolio por tramo, destino, avalúo y comuna | Agregados del portafolio |

| Entra | Queda fuera |
| --- | --- |
| Registro de usuario y login SII en sesión efímera | Conectar los agentes (cliente y portafolio); su front queda visible como "Próximamente" |
| Consentimiento con finalidad, fuentes, vigencia y revocación | Interpretación de las cifras: semáforo, párrafos generativos y recomendaciones |
| F22: últimos 4 a 5 AT, declaración vigente, con orígenes de renta y rebajas | Declaraciones juradas, RCV, DTE, balance tributario |
| F29 y F50: últimos 24 períodos | Contingencias Art. 53 y 97: dependen de un dato que no viene del SII (fórmulas en el anexo) |
| Bienes raíces con enajenación, pago al contado y financiamiento | Arquetipos y vista comercial para bancos |
| Datos personales, actividades económicas, sociedades, regímenes y timbrajes | Historial de rectificatorias, modelo bitemporal, WORM, SIEM |
| Cálculos del Capítulo IV y del Informe de Apertura, con su estado | Evasión de CAPTCHA o MFA (si aparece, el run se detiene) |
| Deuda de origen por institución | Análisis contable: asiento de apertura, valor depreciable, monto IVA y estado de resultados (decisión de Ricardo) |
| Backoffice: Propietarios y Radiografía | Edición de datos desde el backoffice, exportes y filtros avanzados |

**Criterio de terminado**

1. Con los códigos del caso Carlos Díaz (AT 2022–2025), el motor reproduce la tabla "Análisis financiero" del Capítulo IV con tolerancia de ±10 pesos y el Credit Capacity del caso: $285.216.668, UF 7.424.
2. Con un RUT real de prueba, el recorrido completo de conexión a Diagnóstico Base toma menos de 10 minutos y todos los cálculos usan datos de esa captura.
3. Cada cifra del diagnóstico responde "¿de dónde salió este número?": la operación completa y, por cada dato, formulario, año, código, folio y valor.
4. Ninguna frase del informe depende del caso: solo cambian cifras, fechas y nombres propios. Lo pendiente aparece rotulado, no se omite.
5. Una clave errónea, un CAPTCHA o una fuente caída terminan en su estado propio y la pantalla lo explica.
6. La clave tributaria no queda en disco, logs ni respuestas de la API.
7. Cada cliente procesado aparece en Propietarios con las mismas cifras de su Diagnóstico Base, y la Radiografía cuadra con la suma de los propietarios.
8. Solo un usuario interno autorizado puede abrir el backoffice.
9. La UF que usa cada cálculo es la que informa el SII para esa fecha, y el informe muestra el valor y la fecha.

## Lo que ya existe

El front (React + Vite) está construido y funciona contra una API simulada en `src/lib/api.ts`. Ese archivo es el único punto que se reemplaza: las pantallas no cambian si el backend respeta el contrato.

- **Conexión:** valida el dígito verificador, pide consentimiento y envía el RUT sin puntos con el DV separado.
- **Extracción:** muestra los pasos, la bitácora, el botón de cancelar y una pantalla por cada estado terminal.
- **Diagnóstico Base:** seis vistas con el año siempre a la vista. Una cifra del resumen abre su cálculo; un dato del SII dentro de un cálculo abre su tabla con la fila resaltada; "Se usa en" vuelve al cálculo. Cada vista y cada cálculo tiene dirección propia (`/diagnostico#calc-tasa-efectiva`).
- **Registro de cálculos:** `src/lib/calculos.ts` define cada cálculo como una función pura con definición fija, operación, fuentes, dependencias y estado. Tiene 17 pruebas (`npm test`): el caso Carlos Díaz, un caso real de 5 años anonimizado y 1.000 reportes generados al azar.
- **Vista Crédito:** dos campos numéricos libres (tasa de interés anual y plazo en años), el resultado al lado, la explicación de los cálculos 14, 15 y 16, una tabla de consulta por tasa y plazo, y el crédito automotriz. Al escribir se recalculan el Credit Capacity, su valor en UF y el factor leverage en todo el informe, incluidos el resumen, la tabla por año y el PDF.
- **PDF:** impresión del navegador, con todas las vistas y todos los cálculos.
- **Backoffice:** Propietarios (cifras del portafolio y tabla por cliente) y Radiografía (clientes por tramo de Global Complementario y de Art. 55 bis; propiedades por destino, avalúo y comuna). Hoy usan un portafolio de ejemplo de 10 clientes.
- **Escenarios de prueba:** `?demo=captcha|mfa|clave|parcial|fallo|error` en el login simula cada estado sin tocar el SII.
- **Verificación:** `npm run verify` corre tipos, lint, las pruebas del registro y el build; `npm run test:ui` recorre la aplicación en Chrome a 1440 y 375 px. Las reglas de trabajo para agentes están en `AGENTS.md`, el contexto de producto en `docs/product.md` y la guía de interfaz en `docs/ui.md`.

Los dos agentes (el del cliente y el del portafolio) están construidos y siguen visibles con la etiqueta "Próximamente". No son alcance de este sprint, pero no se ocultan ni se eliminan.

## De dónde sale cada dato

Hay cuatro orígenes posibles para un dato, y el informe los distingue siempre:

| Origen | Qué es | Cómo se obtiene |
| --- | --- | --- |
| Sesión del contribuyente en sii.cl | Lo que la persona declaró o tiene registrado | Conectores, con su RUT y clave |
| Valores públicos del SII | UF de cada día, UTA y tabla del Impuesto Global Complementario | Se leen del sitio del SII, sin sesión. La UF se actualiza todos los días |
| Parámetros del método | Factores y reglas de Ricardo | Tabla de parámetros versionada |
| Lo que ajusta la persona | Tasa y plazo del Credit Capacity; tasa del crédito automotriz | Controles del front; no se guarda como dato del SII |

### Rutas en sii.cl

Todas parten en **sii.cl → Servicios Online**, con la sesión del contribuyente que se está analizando. Las cuatro primeras son las del traspaso funcional.

| Fuente | Ruta paso a paso | Se consulta por | Consultas por cliente |
| --- | --- | --- | --- |
| Formulario 22 | Declaración de Renta → Corregir o rectificar declaración → Elegir año tributario → Consultar → Formulario 22 → Versión compacta | Año tributario | Una por año: 4 a 5 |
| Formulario 29 | Impuestos Mensuales → Consulta y seguimiento → Consulta Integral → Seleccionar F29 → Elegir año y período → Consultar | Período mensual | Una por mes: 24 |
| Formulario 50 | Impuestos Mensuales → Consulta y seguimiento → Consulta Integral → Seleccionar F50 → Elegir año y período → Consultar | Período mensual | Una por mes: 24 |
| Bienes raíces | Bienes Raíces → Mis Bienes → Consulta de antecedentes de bienes raíces → Listado de propiedades → Antecedentes o PDF de cada una | Propiedad | Una para el listado y una por rol |
| Datos del contribuyente, sociedades, regímenes y timbrajes | **Ruta por confirmar.** No viene en el traspaso | — | Por confirmar |

Para los datos del contribuyente el punto de partida a revisar el día 1 es "Mi SII → Datos personales y tributarios". Es una suposición nuestra, no una ruta entregada por Ricardo; se cierra en el ticket SII-02.

### Formulario 22: qué se saca y para qué

Una consulta por año tributario. Se guarda el formulario compacto completo; esta tabla lista lo que el diagnóstico usa.

| Dato | Código | Dónde queda en el reporte | Cálculos que lo usan |
| --- | --- | --- | --- |
| Folio, fecha de presentación y tipo (original o rectificatoria) | Encabezado | `f22Returns` | Fuente que acompaña a cada dato; línea de tiempo |
| Retiros | 104 | `incomeOrigins` | 1 |
| Dividendos | 105 | `incomeOrigins` | 1 |
| Gastos rechazados | 106 | `incomeOrigins` | 1 |
| Rentas presuntas | 108 | `incomeOrigins` | 1 |
| Ingresos por arriendos de bienes raíces | 955 | `incomeOrigins` | 1 y 9 |
| Rentas asignadas Art. 14 D N°8 | 1632 | `incomeOrigins` | 1 |
| Rentas de capitales mobiliarios | 155 | `incomeOrigins` | 1 |
| Rentas exentas del IGC | 152 | `incomeOrigins` | 1 y 9 |
| Otras rentas de fuente chilena | 1032 | `incomeOrigins` | 1 |
| Mayor valor en venta de bienes raíces | 1891 | `incomeOrigins` | 1 |
| Rentas de fuente extranjera afectas al IGC | 1104 | `incomeOrigins` | 1 |
| Incremento por impuesto de primera categoría | 749 | `incomeOrigins` | 1 |
| Sueldos y salarios | 161 | `incomeOrigins` | 1 |
| Honorarios | 110 | `incomeOrigins` | 1 |
| Impuesto territorial | Por confirmar | `deductions` | 2 |
| Donaciones Ley 16.282 y DL 45 | Por confirmar | `deductions` | 2 |
| Pérdida en operaciones de capitales mobiliarios | Por confirmar | `deductions` | 2 |
| Donaciones a entidades sin fines de lucro | Por confirmar | `deductions` | 2 |
| Cotizaciones previsionales de empresario o socio | Por confirmar | `deductions` | 2 |
| Intereses pagados Art. 55 bis | 750 | `deductions` | 2 |
| Dividendos hipotecarios Ley 19.622 | Por confirmar | `deductions` | 2 |
| 20% de cuotas de fondos de inversión (Ley 19.247) | Por confirmar | `deductions` | 2 |
| Ahorro previsional voluntario Art. 42 bis | 765 | `deductions` | 2 |
| Base imponible tributaria | 170 | `igcBase.base170` | 3 (comparación), 4 y 5; también 8 cuando se cargue la tabla en pesos |
| Impuesto determinado según tabla | 157 | `igcBase.tax157` | 4 |
| Gastos presuntos de honorarios | 494 | `method.adjustments` | 9 |
| Total ingresos brutos afectos | 158 | `method.adjustments` | Ninguno: solo se muestra |
| Gastos efectivos de honorarios | 465 | `method.adjustments` | Ninguno: solo se muestra |

Reglas del F22:

- Un código que no aparece en el formulario compacto vale cero, no es un error de extracción. Los negativos sí aparecen y se guardan con su signo.
- Si el año no tiene declaración, todos sus códigos quedan como no capturados y sus cálculos muestran "Sin declaración ese año".
- Si hay rectificatoria, se usa la declaración vigente. Falta confirmar cómo se identifica.

### Formularios 29 y 50: qué se saca y para qué

Una consulta por período, los últimos 24 meses. Ningún cálculo del método usa estos formularios en la fase 1: se muestran en "Datos del SII → Declaraciones mensuales".

| Dato | Formulario | Dónde queda en el reporte |
| --- | --- | --- |
| Período, folio, fecha de presentación y tipo | F29 | `f29` |
| Débito, crédito, IVA determinado y remanente | F29 | `f29` |
| PPM y retenciones | F29 | `f29` |
| Total a pagar y estado de pago (pagado, pendiente, sin movimiento) | F29 | `f29` |
| Período, total y fecha de presentación | F50 | `f50` |

El código exacto de cada columna del F29 está por confirmar (bloqueante menor). Un período sin declaración no se inventa: queda como faltante en la cobertura de la fuente.

### Bienes raíces: qué se saca y para qué

El listado entrega una fila por rol; los antecedentes o el PDF de cada rol entregan el resto.

| Dato | De dónde | Dónde queda en el reporte | Cálculos que lo usan |
| --- | --- | --- | --- |
| Rol, comuna, región, dirección y destino | Listado | `properties` | Totales por comuna y destino; backoffice |
| Avalúo total, afecto y exento; contribución | Listado o antecedentes | `properties` | Avalúo fiscal total; backoffice |
| Superficie de terreno y construida | Antecedentes | `properties` | Ninguno: solo se muestra |
| Fecha de adquisición y tipo de acto | Antecedentes | `properties` | Línea de tiempo |
| Monto de enajenación en pesos | Antecedentes | `properties.precioAdquisicion` | Ninguno: solo se muestra |
| Monto de enajenación en UF | Antecedentes | `properties.enajenacionUf` | 17, 20 y 21 |
| Pago al contado en pesos | Antecedentes | `properties.pagoContado` | Ninguno: solo se muestra |
| Pago al contado en UF | Antecedentes | `properties.pagoContadoUf` | 18 y 21 |
| Institución que financió la compra | Antecedentes | `properties.institucion` | 21 |
| Monto financiado, en pesos y en UF | Antecedentes | `properties` | Ninguno: la deuda de origen se calcula como enajenación menos pago al contado |
| Acogida a la Ley 20.455 | Por confirmar si viene del SII | `properties.ley20455` | 20 |
| Uso familiar | Por confirmar si viene del SII | `properties.usoFamiliar` | Ninguno: solo se muestra |

La vista de propiedades de la herramienta de referencia (BICRED) muestra además estos datos por propiedad, que hoy no están en el reporte: porcentaje de derechos, repertorio, naturaleza de la escritura, acogida a DFL2, plazo del crédito en meses, monto de IVA, fojas, número y fecha de inscripción, si adquiere dominio pleno y si es nueva. Ningún cálculo vigente los usa. Se agregan al reporte cuando el conector de bienes raíces confirme que el SII los entrega.

Reglas de bienes raíces:

- Si el SII no entrega un dato de una propiedad, queda como no capturado. Los totales suman solo lo informado; si ninguna propiedad trae el dato, el total es desconocido.
- Si el SII entrega la enajenación solo en pesos, la conversión usa la UF del SII de la fecha de adquisición, tomada de la tabla diaria. Falta confirmar si el SII ya la entrega en UF.
- Si esta fuente falla, el run termina en `PARTIAL` y los cálculos 17 a 21 muestran "Dato no capturado".

### Datos del contribuyente

| Dato | Dónde queda en el reporte | Dónde se usa |
| --- | --- | --- |
| Nombre y RUT | `taxpayer` | Encabezado; backoffice |
| Fecha de nacimiento e inicio de actividades | `taxpayer` | Resumen |
| Actividades económicas: código, glosa, categoría y fecha de inicio | `activities` | Datos del SII; línea de tiempo |
| Sociedades: RUT, nombre, participación y fecha | `companies` | Datos del SII; línea de tiempo |
| Regímenes tributarios: código, nombre y fecha de inicio | `regimes` | Datos del SII; línea de tiempo |
| Timbrajes: documento y fecha | `stampings` | Datos del SII; línea de tiempo |

Ningún cálculo del método usa estos datos en la fase 1. La herramienta de referencia muestra además el capital enterado y el porcentaje de capital de cada sociedad, y si cada actividad afecta IVA; hoy no están en el reporte.

### Valores públicos y parámetros

No vienen de la sesión del contribuyente. Se cargan una vez por período y viajan en `method`.

| Dato | De dónde sale | Qué valor se toma | Cálculos que lo usan |
| --- | --- | --- | --- |
| UTA | Valores publicados por el SII | Diciembre del mismo año de la declaración (confirmado) | 5 y 7 |
| UF | Valor diario que informa el SII; se carga todos los días (ver abajo) | La de la fecha que pida cada cálculo. Para el Credit Capacity en UF, hoy el 31 de diciembre del año comercial (por confirmar) | 15 y la tabla de tasas y plazos |
| Tabla del Impuesto Global Complementario | Art. 52 de la Ley de la Renta; el SII publica la de cada año tributario, ya en pesos | La del año tributario | 8 |
| Rangos del Art. 55 bis | Ley de la Renta (confirmado) | A hasta 90 UTA, B sobre 90 y bajo 150, C desde 150 | 6 |
| Rebaja máxima de intereses del Art. 55 bis | Ley de la Renta (confirmado) | Tope de 8 UTA; entre 90 y 150 UTA, porcentaje = 250 − 1,667 × base en UTA | 7 |
| Códigos que restan y suman en la RFB | Ricardo | 955, 152 y 494 (por confirmar) | 9 |
| Regla del factor de renta neta | Ricardo (validada) | 0,90 si la tasa efectiva es menor a 15%; 0,80 si es 15% o más | 10 |
| Factor hipotecario y automotriz | Capítulo IV | 0,25 y 0,07 | 12 y 13 |
| Tasa y plazo de partida | Capítulo IV | 4% anual a 30 años; la persona escribe los suyos | 14 |
| Rango de la tabla de consulta | Ricardo, más el plazo del Capítulo IV | Tasas de 3,0% a 5,0% de 0,1 en 0,1; plazos de 5, 10, 15, 20, 25 y 30 años | Tabla de la vista Crédito |
| Factores leverage | Ricardo (confirmado) | 1 a 5; cada institución define el suyo | 16 |

### UF: se obtiene del SII todos los días

La UF nunca se escribe a mano ni se toma de otra fuente. El valor válido es el que informa el SII para cada día.

| Tema | Regla |
| --- | --- |
| Fuente | El valor de la UF que publica el SII en sii.cl → Valores y fechas → UF, por año. Es una página pública: no usa la sesión de ningún contribuyente. La dirección exacta se confirma el día 1 |
| Frecuencia | Un proceso corre todos los días y guarda los valores que el SII tenga publicados, incluidos los días siguientes que ya informe |
| Qué se guarda | Una fila por día: fecha, valor, cuándo se leyó y la huella de la página de origen. El valor de un día ya guardado no se modifica; si el SII informa otro distinto, se registra como incidencia |
| Carga inicial | Los valores históricos del SII hacia atrás, al menos hasta la fecha de compra más antigua entre las propiedades capturadas |
| Qué fecha usa cada cálculo | Cada cálculo pide la UF de una fecha concreta: el Credit Capacity en UF, la fecha de referencia del método; una propiedad informada solo en pesos, su fecha de adquisición |
| Si falta el valor de un día | No se aproxima ni se usa el del día anterior. El cálculo queda como "Dato no capturado" y el proceso alerta |
| Qué muestra el informe | El valor de la UF usado y su fecha, como parámetro del cálculo (`method.uf`) |

Lo que sigue por confirmar con Ricardo es **qué fecha** usa el Credit Capacity en UF: el caso usa la del 31 de diciembre del año comercial; la alternativa es la del día de la captura. Con la tabla diaria cualquiera de las dos se resuelve sin cambiar código.

### Lo que escribe la persona

| Dato | Dónde | Para qué |
| --- | --- | --- |
| Tasa de interés anual y plazo en años del Credit Capacity | Campos numéricos de la vista Crédito | Recalcular los cálculos 14, 15 y 16 de todos los años |
| Tasa de interés anual del crédito automotriz | Campo numérico de la vista Crédito | Calcular el crédito automotriz, que no tiene tasa por defecto |

Los campos son libres: aceptan cualquier tasa entre 0% y 30% y cualquier plazo entre 1 y 50 años, con coma o punto decimal. Lo que se escribe se muestra tal cual (3,75% no se redondea a 3,8%). Si un valor no es válido, el informe conserva el último válido y el campo lo indica.

La elección vive en la pantalla: no se guarda en el reporte ni viaja al backend. El informe indica con qué tasa y plazo está calculado, y el PDF imprime la elección vigente. Al volver a entrar, parte de nuevo en la referencia.

Los arriendos realmente percibidos, que alimentan las contingencias, también los informa la persona. Están fuera de la fase 1.

### Reglas de datos

- `null` se reserva para lo que no se capturó (un año sin declaración, una fuente que falló, un dato de propiedad que el SII no entrega). Se muestra como raya, nunca como cero.
- Montos como enteros en CLP, montos de propiedades en UF con 2 decimales, RUT sin puntos y DV separado, fechas en ISO-8601.
- Tres capas separadas: dato crudo (HTML o PDF original con su hash SHA-256), dato normalizado (rut, período, formulario, código, valor, fuente, fecha de extracción) y dato derivado (cálculos). No se mezclan datos originales con inferencias.
- Cada dato normalizado guarda de qué consulta salió, para que el informe pueda decir formulario, código, año y folio.

## Fórmulas

Se implementa lo que está en los documentos de Ricardo o lo que se pudo deducir de sus casos; no se inventan fórmulas. Cada cálculo lleva un estado, y el informe lo muestra:

| Estado | Cuándo | Qué muestra el informe |
| --- | --- | --- |
| **Calculado** | La fórmula está en un documento del método y cuadra con los casos | Definición, operación con las cifras, fuente de cada dato |
| **Por confirmar** | La fórmula se dedujo de los casos, o usa un parámetro supuesto | Lo mismo, más qué falta confirmar |
| **Por determinar** | Falta la fórmula o el dato | La sección aparece igual, con los datos de entrada que sí se tienen y lo que falta |

La evidencia son 9 años de datos: los 4 del Capítulo IV (Carlos Díaz) y los 5 de un Informe de Apertura real de BICRED, que se usa anonimizado como prueba automática. La columna "Control" trae el valor de AT 2025 del caso Carlos Díaz.

### Reglas generales del motor

- **Valor que se muestra.** Si el motor entrega el valor, se muestra ese; el front lo recalcula con los datos mostrados y, si difieren más que la tolerancia, agrega una frase fija con la diferencia.
- **Redondeo.** Los montos en pesos se redondean al peso después de cada paso. Las sumas de propiedades en UF se redondean a 2 decimales; el Credit Capacity en UF se muestra sin decimales.
- **Año sin declaración.** Todos los cálculos del año quedan como "Sin declaración ese año".
- **Dato faltante.** Si falta un dato de entrada, el resultado es "Dato no capturado", no cero.
- **División por cero.** Si el divisor es cero, el resultado es "No se puede calcular: … es 0".
- **Sumas de propiedades.** Suman solo los valores informados; si ninguno viene informado, el total es desconocido.

### 1. Renta e impuesto

| N° | Cálculo | Fórmula | Estado | Evidencia | Control |
| --- | --- | --- | --- | --- | --- |
| 1 | Total de orígenes de renta | Suma de los 14 códigos de orígenes | Calculado | 9 de 9 años | $104.832.677 |
| 2 | Total de rebajas | Suma de los 9 conceptos de rebajas | Calculado | Suma directa de lo declarado | $5.510.436 |
| 3 | Base imponible | (1) − (2), comparada con el código 170 declarado | Calculado | Confirmado por Ricardo: tiene que coincidir. Es exacto en 4 de 5 años del informe real; la diferencia de AT 2022 ($1.252.199) es un error de ese informe | $99.322.241 |
| 4 | Tasa efectiva de tributación | Código 157 ÷ código 170 | Calculado | 9 de 9 | 16,04% |
| 5 | Base imponible en UTA | Código 170 ÷ UTA de diciembre del mismo año de la declaración | Calculado | Confirmado por Ricardo: siempre es así | 119,00 UTA |
| 6 | Tramo Art. 55 bis | Rango de (5): A hasta 90 UTA, B sobre 90 y bajo 150, C desde 150 | Calculado | Confirmado por Ricardo | B |
| 7 | Rebaja máxima de intereses (Art. 55 bis) | 8 UTA × porcentaje. Porcentaje: 100% hasta 90 UTA; 250 − 1,667 × (5) entre 90 y 150 UTA; 0% desde 150 UTA | Calculado | Fórmula que dio Ricardo. Da 100% en 90 UTA y 0% en 150 | 4,13 UTA ($3.446.502) |
| 8 | Tramo de Global Complementario | Rango de la base en la tabla del Art. 52 del año tributario | Por confirmar | Fuente confirmada por Ricardo. Falta cargar la tabla oficial de cada año | Tramo 5 · 30,4% |

Detalles:

- Si el motor informa una base imponible distinta de (1) − (2), el informe muestra la diferencia; no la corrige.
- Tasa efectiva: tolerancia de 0,01 puntos porcentuales. Si el código 170 es cero no se calcula.
- Base imponible en UTA: tolerancia de 0,05 UTA.
- UTA cargada hoy: $733.884 (AT 2022), $770.592 (AT 2023), $807.528 (AT 2024), $834.504 (AT 2025).
- En los rangos, el tope de un tramo pertenece a ese tramo: 90 UTA exactas son tramo A del Art. 55 bis, y 150 UTA exactas son tramo C.
- Rebaja máxima de intereses: se muestra en UTA y en pesos, con la misma UTA de (5).
- Tramo de Global Complementario: Ricardo indicó usar la tabla de cada año tributario, que el SII publica ya en pesos. Con ella el tramo se obtiene comparando el código 170 directamente, sin pasar por (5). Mientras esas tablas no estén cargadas, el prototipo usa la tabla general en UTA.
- La herramienta de referencia (BICRED) muestra otro número de tramo para la misma base. Puede venir de una tabla antigua: manda la tabla oficial del año, no esa etiqueta.
- Tabla general en UTA cargada hoy (ilustrativa, una sola para todos los años):

| Tramo | Desde (UTA) | Hasta (UTA) | Tasa |
| --- | --- | --- | --- |
| Exento | 0 | 13,5 | 0% |
| Tramo 1 | 13,5 | 30 | 4% |
| Tramo 2 | 30 | 50 | 8% |
| Tramo 3 | 50 | 70 | 13,5% |
| Tramo 4 | 70 | 90 | 23% |
| Tramo 5 | 90 | 120 | 30,4% |
| Tramo 6 | 120 | 310 | 35% |
| Tramo 7 | 310 | — | 40% |

### 2. Renta financiera y crédito

| N° | Cálculo | Fórmula | Estado | Evidencia | Control |
| --- | --- | --- | --- | --- | --- |
| 9 | Renta financiera bruta (RFB) | (1) − código 955 − código 152 + código 494 | Por confirmar | Cuadra con 5 a 10 pesos de diferencia en los 9 años. No coincide con la descripción que dio Ricardo (ver abajo) | $81.700.093 |
| 10 | Renta financiera neta (RFN) | (9) × factor. Factor 0,90 si (4) es menor a 15%; 0,80 si es 15% o más | Calculado | La regla reproduce los 9 años. Validada por Ricardo según informó Cristóbal; la reunión grabada no lo registra | $65.360.074 |
| 11 | RFN mensual | (10) ÷ 12 | Calculado | 9 de 9 | $5.446.673 |
| 12 | Límite crédito hipotecario | (11) × 0,25 | Calculado | Capítulo IV | $1.361.668 |
| 13 | Límite crédito automotriz | (11) × 0,07 | Calculado | Capítulo IV | $381.267 |
| 14 | Credit Capacity | PV = PMT × (1 − (1 + i)^−n) ÷ i, con PMT = (12), i = tasa anual ÷ 12, n = años × 12. La tasa y el plazo los escribe la persona | Calculado | La fórmula es la del Capítulo IV. Ricardo: no hay tasa ni plazo únicos; tiene que ser interactivo | $285.216.668 con 4% a 30 años |
| 15 | Credit Capacity en UF | (14) ÷ UF del SII en la fecha de referencia | Por confirmar | El valor sale de la tabla diaria del SII; falta confirmar qué fecha se usa | UF 7.424 (UF 38.416,69 al 31-12-2024) |
| 16 | Factor leverage | (15) × factor, para los factores 1 a 5 | Calculado | Confirmado por Ricardo: lo define cada institución y son niveles F1 a F5 | Factor 2: UF 14.849 · Factor 3: UF 22.273 |

Detalles:

- RFB: en AT 2025 la operación da $81.700.084 y el caso informa $81.700.093. El informe muestra el valor del caso y la diferencia de $9.
- Factor de renta neta: si el código 170 es cero, la tasa efectiva se toma como 0 y el factor es 0,90.
- RFN mensual y los dos límites: tolerancia de 1 peso.
- Credit Capacity: si la tasa es 0, PV = PMT × n. El resultado se redondea al peso.

**Renta financiera bruta: lo que dijo Ricardo y por qué sigue abierta.** En la reunión la describió como el código 158 menos los gastos rechazados (106) y las rentas presuntas (108), que es la fórmula del manual, más el código 494 cuando existe. No recordó los códigos exactos. Esa descripción no reproduce sus propios casos: en ambos, los códigos 106 y 108 están en cero, así que daría cerca del total declarado ($104,8 millones en AT 2025), y su tabla dice $81,7 millones, que es lo que da la fórmula de esta tabla en los 9 años. Hay que revisarlo con él con los números a la vista.

**Factor de renta neta.** Quedó validado con la regla por tasa efectiva. Para tenerlo presente: los datos solo fijan el corte entre 14,56% y 16,04% (15% es el número redondo dentro de ese tramo), y no hay casos con tasa efectiva sobre 17,39%, así que no se sabe si existe un tercer escalón.

**Vista Crédito (front).** Como no hay una tasa ni un plazo únicos, el Credit Capacity tiene su propia vista en el informe, separada de los demás cálculos:

- Dos campos numéricos libres: tasa de interés anual y plazo en años. Parten en la referencia del Capítulo IV (4% a 30 años) y hay un botón para volver a ella.
- El resultado al lado de los campos: dividendo de referencia, Credit Capacity y Credit Capacity en UF.
- La explicación completa de los cálculos 14, 15 y 16, con la misma forma que el resto: pregunta, cifra, frase, definición y operación con sus fuentes. Se ve una a la vez, con tres subpestañas.
- Una tabla de consulta, plegada por defecto, con el Credit Capacity en UF para tasas de 3,0% a 5,0% contra plazos de 5 a 30 años. Si la combinación escrita está en la tabla, queda marcada.
- El crédito automotriz, con su propio campo de tasa.

Al escribir se recalculan los cálculos 14, 15 y 16 de todos los años, y con ellos las cifras del resumen, la tabla de análisis financiero y el PDF. En la operación del cálculo 14, la tasa y el plazo aparecen como "Referencia del Capítulo IV" o como "Valor ajustado en este informe". En la vista Cálculos, el grupo de renta financiera termina en el cálculo 13 y enlaza a Crédito.

Se probó primero con deslizadores y una tabla con celdas presionables dentro del cálculo, y se descartó: era incómodo de usar con mouse. Ricardo describió la tabla con plazos de 5 a 25 años; se agregó el de 30 porque es el del caso del Capítulo IV.

| Cálculo | Fórmula | Estado |
| --- | --- | --- |
| Crédito automotriz | PV con PMT = (13) y n = 48 meses | Por confirmar: el Capítulo IV no fija la tasa, así que solo se calcula cuando la persona la ingresa |
| Conversión a UF | Monto ÷ UF del SII en la fecha de referencia | Por confirmar: qué fecha se usa |

### 3. Propiedades

| N° | Cálculo | Fórmula | Estado | Evidencia |
| --- | --- | --- | --- | --- |
| 17 | Activos (enajenación total) | Suma de los montos de enajenación en UF | Calculado | Exacto en ambos casos: 35.728,07 y 24.708 UF |
| 18 | Patrimonio (pago contado total) | Suma de los pagos al contado en UF | Calculado | Exacto en ambos casos: 7.693,49 y 6.281,6 UF |
| 19 | Pasivos de origen | (17) − (18) | Calculado | Exacto en ambos casos: 28.034,58 y 18.426,4 UF |
| 20 | Adquisición sin las propiedades acogidas a la Ley 20.455 | (17) − enajenación en UF de las propiedades acogidas | Calculado | Informe real: 24.708 − 13.100 − 5.800 = 5.808 UF |

Totales que acompañan a la tabla de propiedades, sin fórmula del método: cantidad de roles, suma de avalúos fiscales, suma de contribuciones, propiedades por destino y por comuna.

Los pasivos de origen son lo financiado al comprar, no la deuda vigente.

### 4. Análisis inmobiliario

| N° | Cálculo | Fórmula | Estado | Evidencia |
| --- | --- | --- | --- | --- |
| 21 | Deuda de origen por institución | Por propiedad: enajenación en UF − pago al contado en UF. Se suma según la institución que financió la compra. Parte de cada institución = su deuda ÷ deuda total | Calculado | Ricardo: sale de la tabla de propiedades. Reproduce la vista de BICRED del caso real: 3.300, 2.440, 2.206,4 y 10.480 UF (17,9%, 13,2%, 12% y 56,9%). La suma es igual a (19) |
| — | Leverage por institución y total | Deuda de cada institución ÷ un mismo divisor; la suma de todos da el leverage total | Por determinar | Falta el divisor. BICRED muestra 1,6 · 1,2 · 1,1 y un total de 8,8 para el caso real, lo que deja el divisor entre 2.082 y 2.101 UF. No es el Credit Capacity de referencia: daría 1,7 |
| — | Recomendación sobre la Ley 20.455 | Falta saber si es un texto fijo o una regla | Por determinar | No se trató en la reunión |

Detalles de la deuda por institución:

- Una propiedad con deuda de origen y sin institución informada va en el grupo "Sin institución informada".
- Una propiedad sin enajenación o sin pago al contado en UF cuenta en su institución, pero no suma deuda.
- El monto financiado que entregue el SII no entra en el cálculo; la deuda es siempre enajenación menos pago al contado.

**Fuera del informe por decisión de Ricardo.** El asiento de apertura (reservas para futuras capitalizaciones), el valor depreciable, el monto IVA total y el estado de resultados son contables y no son parte de lo que necesita el diagnóstico. Se retiraron del informe y del registro de cálculos.

### 5. Backoffice

Todo sale de los valores ya calculados para cada cliente; el backoffice no tiene fórmulas del método. Se usa la última captura completa de cada cliente y, de ella, su año tributario más reciente.

**Por propietario**

| Dato | De dónde sale |
| --- | --- |
| Nombre y RUT | Datos del contribuyente |
| Estado | Regla por definir (ver decisiones abiertas). Propuesta: Activo si la última captura terminó completa; En revisión si terminó parcial o algún cálculo no cuadra con su verificación; Sin datos si no tiene captura completa |
| Tramo de Global Complementario | Cálculo 8 |
| Tramo Art. 55 bis | Cálculo 6 |
| Región principal | La región con más propiedades del cliente |
| Orígenes de renta | Cálculo 1 |
| RFN mensual | Cálculo 11 |
| Tasa efectiva | Cálculo 4 |
| Dividendo máximo | Cálculo 12 |
| Propiedades | Cantidad de roles |
| Alertas | Regla por definir. Propuesta: cantidad de fuentes incompletas más cantidad de cálculos que no cuadran con su verificación |

La tabla se ordena por orígenes de renta, de mayor a menor. La fila final suma orígenes, dividendo máximo, propiedades y alertas, y promedia la RFN mensual.

**Del portafolio**

| Cifra | Fórmula |
| --- | --- |
| Propietarios y activos | Cantidad de clientes; cantidad con estado Activo |
| RFN mensual promedio | Suma de RFN mensual ÷ cantidad de clientes |
| Capacidad hipotecaria | Suma de los dividendos máximos |
| Propiedades y avalúo fiscal total | Cantidad de roles; suma de avalúos |
| Advertencias | Suma de alertas |
| Clientes por tramo de Global Complementario | Cantidad de clientes en cada tramo, con todos los tramos aunque estén en cero. Parte del portafolio = cantidad ÷ total de clientes |
| Clientes por tramo Art. 55 bis | Cantidad de clientes en A, B y C |
| Tramo Art. 55 bis más frecuente | El tramo con más clientes; en empate, el primero en orden A, B, C |
| Propiedades por destino | Cantidad de roles por destino, de mayor a menor |
| Avalúo por tipo de propiedad | Suma de avalúos por destino. Parte = avalúo del destino ÷ avalúo total |
| Comunas con más roles | Cantidad de roles por comuna; las 8 primeras |

## Qué toma y qué necesita cada cálculo

La numeración es la del catálogo de fórmulas. "Necesita" es lo mínimo que debe existir para que el cálculo dé un valor; si falta, el informe muestra la frase fija indicada.

**Orden de cálculo.** 1 y 2 → 3 · 4 · 5 → 6, 7 y 8 · 9 → 10 → 11 → 12 y 13 → 14 → 15 → 16 · 17 y 18 → 19 · 20 · 21. Los cálculos 1 a 16 se repiten para cada año tributario capturado; los 17 a 21 se calculan una vez por cliente.

### Renta e impuesto

| N° | Cálculo | Toma del SII | Parámetros | Cálculos previos | Necesita | Si falta | Lo usan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Total de orígenes de renta | Los 14 códigos de orígenes del F22 del año | — | — | F22 del año capturado | Sin declaración ese año | 3 y 9; backoffice |
| 2 | Total de rebajas | Los 9 conceptos de rebajas del F22 del año | — | — | F22 del año capturado | Sin declaración ese año | 3 |
| 3 | Base imponible | Código 170, para comparar | — | 1 y 2 | F22 del año capturado | Sin declaración ese año | Ninguno |
| 4 | Tasa efectiva | Códigos 157 y 170 | — | — | F22 del año, con código 170 distinto de cero | No se puede calcular: la base imponible es 0 | 10; backoffice |
| 5 | Base imponible en UTA | Código 170 | UTA de diciembre del año | — | F22 del año y UTA cargada para ese año | Dato no capturado | 6, 7 y 8 |
| 6 | Tramo Art. 55 bis | — | Rangos A, B y C | 5 | Cálculo 5 con valor | Dato no capturado | Backoffice |
| 7 | Rebaja máxima de intereses | — | Tope de 8 UTA y fórmula del tramo intermedio; UTA del año para expresarla en pesos | 5 | Cálculo 5 con valor | Dato no capturado | Ninguno |
| 8 | Tramo de Global Complementario | Código 170, cuando se use la tabla en pesos | Tabla del año tributario | 5, mientras se use la tabla en UTA | Tabla del año cargada | Dato no capturado | Backoffice |

### Renta financiera y crédito

| N° | Cálculo | Toma del SII | Parámetros | Cálculos previos | Necesita | Si falta | Lo usan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | Renta financiera bruta | Códigos 955, 152 y 494 del F22 del año | Lista de códigos que restan y suman | 1 | F22 del año capturado | Sin declaración ese año | 10 |
| 10 | Renta financiera neta | — | Regla del factor (umbral de 15%, 0,90 y 0,80) | 9 y 4 | Cálculo 9 con valor. Si el código 170 es cero, la tasa se toma como 0 | Dato no capturado | 11 |
| 11 | RFN mensual | — | — | 10 | Cálculo 10 con valor | Dato no capturado | 12 y 13; backoffice |
| 12 | Límite crédito hipotecario | — | Factor 0,25 | 11 | Cálculo 11 con valor | Dato no capturado | 14 y la tabla de consulta de la vista Crédito; backoffice |
| 13 | Límite crédito automotriz | — | Factor 0,07 | 11 | Cálculo 11 con valor | Dato no capturado | Crédito automotriz |
| 14 | Credit Capacity | — | Tasa anual y plazo: los que escribe la persona en la vista Crédito; parten en la referencia | 12 | Cálculo 12 con valor | Dato no capturado | 15 |
| 15 | Credit Capacity en UF | — | UF del SII en la fecha de referencia | 14 | Cálculo 14 con valor y la UF de esa fecha cargada | Dato no capturado | 16 |
| 16 | Factor leverage | — | Factores 1 a 5 | 15 | Cálculo 15 con valor | Dato no capturado | Ninguno |

### Propiedades y análisis inmobiliario

| N° | Cálculo | Toma del SII | Parámetros | Cálculos previos | Necesita | Si falta | Lo usan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 17 | Activos | Enajenación en UF de cada propiedad | — | — | Al menos una propiedad con enajenación en UF | Sin propiedades inscritas, o Dato no capturado | 19 y 20 |
| 18 | Patrimonio | Pago al contado en UF de cada propiedad | — | — | Al menos una propiedad con pago al contado en UF | Sin propiedades inscritas, o Dato no capturado | 19 |
| 19 | Pasivos de origen | — | — | 17 y 18 | Cálculos 17 y 18 con valor | Dato no capturado | Ninguno |
| 20 | Adquisición sin Ley 20.455 | Marca de Ley 20.455 y enajenación en UF de las propiedades acogidas | — | 17 | Cálculo 17 con valor. Sin propiedades acogidas, resta cero | Dato no capturado | Ninguno |
| 21 | Deuda de origen por institución | Enajenación en UF, pago al contado en UF e institución de cada propiedad | — | — | Al menos una propiedad con ambos montos en UF | Sin propiedades inscritas, o Dato no capturado | Leverage por institución, cuando tenga fórmula |

Los dos puntos "por determinar" no tienen ficha porque no tienen fórmula completa. Lo que ya se tiene para cada uno:

| Punto | Datos que ya se tienen | Qué falta |
| --- | --- | --- |
| Leverage por institución y total | Cálculo 21: deuda de cada institución y su parte | El número por el que se divide la deuda, y la UF de qué fecha |
| Recomendación sobre la Ley 20.455 | Cálculo 20 | Si es un texto fijo o una regla |

### Crédito interactivo y backoffice

| Pieza | Qué toma | Qué necesita |
| --- | --- | --- |
| Vista Crédito: campos, resultado y tabla de consulta | Cálculo 12 del año elegido, la UF de referencia, y la tasa y el plazo que escribe la persona | Cálculo 12 con valor; tasa entre 0% y 30% y plazo entre 1 y 50 años |
| Crédito automotriz | Cálculo 13 del año elegido, 48 meses y la tasa que escribe la persona | Que la persona escriba una tasa |
| Fila de un propietario en el backoffice | Cálculos 1, 4, 6, 8, 11 y 12 del último año de su última captura completa, y sus propiedades | Una captura completa del cliente |
| Cifras y gráficos del portafolio | Las filas de todos los propietarios y sus propiedades | Al menos un propietario; con portafolio vacío todo queda en cero |

El backoffice usa el dividendo máximo (cálculo 12), que no depende de la tasa ni del plazo. No muestra Credit Capacity.

## Parámetros

Nada que cambie con el tiempo queda fijo en el código. Todos viajan en `method` dentro del reporte, con la versión de reglas.

| Parámetro | Valor inicial | Estado |
| --- | --- | --- |
| Códigos que se restan y se suman en la RFB | Restan 955 y 152; suma 494 | Por confirmar |
| Regla del factor de renta neta | 0,90 bajo 15% de tasa efectiva; 0,80 desde 15% | Confirmado |
| UTA por año | Diciembre del mismo año de la declaración | Confirmado |
| Rangos del tramo Art. 55 bis | A hasta 90 UTA, B sobre 90 y bajo 150, C desde 150 | Confirmado |
| Rebaja máxima de intereses del Art. 55 bis | Tope de 8 UTA; porcentaje = 250 − 1,667 × base en UTA entre 90 y 150 UTA | Confirmado |
| Tramos de Global Complementario | Tabla del Art. 52 por año tributario, en pesos | Fuente confirmada. Falta cargar cada año |
| UF | Valor diario del SII, cargado todos los días | Fuente definida. Por confirmar qué fecha usa el Credit Capacity en UF: hoy el 31 de diciembre del año comercial |
| Factor hipotecario y automotriz | 0,25 y 0,07 | Capítulo IV |
| Tasa y plazo de partida del Credit Capacity | 4% anual a 30 años | Capítulo IV. La persona escribe los suyos |
| Rango de la tabla de consulta | Tasas de 3,0% a 5,0%; plazos de 5 a 30 años | Confirmado de 5 a 25 años; el de 30 se agregó por el caso del Capítulo IV |
| Plazo automotriz de referencia | 48 meses | Capítulo IV; falta la tasa |
| Factores leverage | 1 a 5 | Confirmado: cada institución define el suyo |
| Tolerancia de la prueba dorada | ±10 pesos | Hasta aclarar la diferencia de la RFB |

## Reglas para que el informe sea determinístico

- **Un registro único de cálculos.** Cada cálculo es una función pura con pregunta, nombre técnico, definición, operación, fuentes, dependencias y estado. La pantalla y el PDF solo recorren el registro.
- **Sin texto condicional.** Cada cálculo tiene una sola plantilla de frase, verdadera para cualquier valor. Los casos especiales son un conjunto cerrado: "Dato no capturado", "Sin declaración ese año", "Sin propiedades inscritas", "No se puede calcular: … es 0".
- **Tres tipos de dato, siempre rotulados:** dato del SII (formulario, código, año y folio), parámetro del método y resultado calculado.
- **Trazabilidad en los dos sentidos.** Desde cada dato de una operación se llega a su fila de origen o al cálculo que lo produce; desde cada código de las tablas del SII se llega a los cálculos que lo usan.
- **Autoverificación.** El front recalcula cada operación con los datos mostrados y la compara con el valor del motor.
- **Prueba masiva.** 1.000 reportes al azar (ceros, negativos, datos faltantes, un solo año, sin propiedades): ninguna salida puede contener valores rotos y cada frase debe salir de su plantilla.

## Contrato de API

Es el que ya consume el front. Los tipos completos están en `src/types.ts`.

| Endpoint | Método | Para qué |
| --- | --- | --- |
| `/v1/users` | POST | Registrar al usuario de la plataforma |
| `/v1/consents` | POST | Registrar la autorización antes de crear el run |
| `/v1/consents/{id}` | DELETE | Revocar la autorización |
| `/v1/runs` | POST | Iniciar la captura con RUT, DV, clave, `consentId`, fuentes e `idempotencyKey` |
| `/v1/runs/{id}` | GET | Estado, avance, pasos, bitácora y `correlationId` (el front consulta cada 1 segundo) |
| `/v1/runs/{id}/cancel` | POST | Cancelar una captura en curso |
| `/v1/runs/{id}/report` | GET | Reporte para el Diagnóstico Base |
| `/v1/owners` | GET | Clientes procesados, con los datos de la tabla "Por propietario" y sus propiedades (rol, comuna, región, destino, avalúo, contribución). Solo rol interno |
| `/v1/portfolio/summary` | GET | Cifras y distribuciones de la tabla "Del portafolio". Solo rol interno |

El resumen del portafolio se puede calcular en el front a partir de `/v1/owners` mientras el portafolio sea chico; el endpoint propio evita traer todas las propiedades cuando crezca.

**Estados del run.** `RUNNING` agrupa los estados intermedios. Los terminales son `COMPLETED`, `PARTIAL`, `BLOCKED_CAPTCHA`, `BLOCKED_MFA`, `AUTH_FAILED`, `SOURCE_CHANGED`, `QUARANTINED`, `CANCELLED`, `EXPIRED` y `FAILED`.

**Pasos de la extracción.** `LOGIN`, `F22`, `F29`, `F50`, `BIENES_RAICES` (incluye actividades) y `CALCULO`, cada uno en `queued`, `running`, `done` o `error`.

**Errores.** Formato `application/problem+json` con `code`, `detail`, `correlation_id` y `retryable`. Nunca se devuelve HTML del SII ni la clave.

**Reporte para la fase 1**

| Campo | Contenido | Fase 1 |
| --- | --- | --- |
| `taxpayer` | RUT, nombre, fecha de nacimiento, inicio de actividades, fecha de captura y cobertura por fuente | Sí |
| `years`, `incomeOrigins`, `deductions`, `igcBase`, `f22Returns` | Códigos del F22 por año, con folio, fecha y tipo | Sí |
| `financial` | Indicadores calculados por año | Sí |
| `method` | Versión de reglas y todos los parámetros de la tabla anterior | Sí |
| `properties` | Una fila por rol con identificación, avalúo, enajenación, pago al contado y financiamiento | Sí |
| `activities`, `companies`, `regimes`, `stampings`, `f29`, `f50` | Datos de las demás fuentes | Sí |
| `contingency` | Contingencias tributarias | `null`: el front no muestra la sección |
| `summary`, `kpis`, `insights`, `recommendations` | Contenido del agente | Vacíos |

## Backoffice

**Pantallas**

| Pantalla | Contenido |
| --- | --- |
| Propietarios | Cinco cifras del portafolio y una tabla con una fila por cliente |
| Radiografía | Cuatro cifras, clientes por tramo de Global Complementario (columnas) y por tramo Art. 55 bis; propiedades por destino, avalúo por tipo de propiedad y comunas con más roles (barras) |
| Agente del portafolio | "Próximamente": vista previa con datos de ejemplo, sin conexión a un modelo |

El listado fila a fila de todas las propiedades del portafolio se retiró: no decía nada del grupo. El detalle por propiedad vive en el Diagnóstico Base de cada cliente.

**Qué tiene que hacer el backend**

- Al terminar un run, guardar una fotografía del cliente con los datos de la tabla "Por propietario" y sus propiedades. El backoffice lee esa fotografía, no vuelve a calcular.
- Si un cliente tiene varias capturas, el backoffice usa la última completa. Las anteriores se conservan.
- Un cliente que revoca su consentimiento sale del backoffice.
- El backoffice exige un usuario interno autenticado. Hoy el front solo ordena la navegación por rol: **no es control de acceso**.
- Cada consulta del backoffice queda registrada: quién, cuándo y qué cliente.

**Decisiones abiertas del backoffice** (no bloquean el desarrollo; mientras tanto se usa la propuesta)

- [ ] Regla del estado de un propietario (Activo, En revisión, Sin datos).
- [ ] Qué cuenta como alerta.
- [ ] Si el consentimiento del cliente debe mencionar que el equipo interno verá sus cifras.
- [ ] Quiénes son usuarios internos y cómo se autentican.

## Arquitectura mínima

Un servicio, una base de datos y un almacenamiento de archivos. Los nombres siguen el ERS para que la fase 2 crezca sobre esto.

**Stack propuesto:** Python 3.12, Playwright (Chromium headless), FastAPI, PostgreSQL con JSONB y almacenamiento de objetos para la evidencia cruda.

**Flujo de un run**

1. El usuario se registra, el front guarda el consentimiento y crea el run. La clave vive solo en memoria mientras dura la captura.
2. El conector abre sesión en el SII. Si aparece CAPTCHA o MFA, el run termina en su estado de bloqueo.
3. Un conector por fuente navega y descarga. Cada paso actualiza el estado que consulta el front.
4. Se guarda el HTML o PDF crudo con su hash.
5. Un parser por fuente lo convierte a pares código–monto.
6. El motor de cálculo lee códigos y parámetros y produce los indicadores.
7. El reporte queda disponible y el front muestra el Diagnóstico Base.
8. Se guarda la fotografía del cliente para el backoffice.

**Tablas mínimas:** `app_user`, `consent`, `taxpayer`, `source_run`, `raw_artifact`, `tax_return`, `declared_field`, `property`, `economic_activity`, `derived_value`, `parameter`, `uf_daily`, `owner_snapshot`, `access_log`.

**Proceso diario.** Aparte de los runs, un proceso lee todos los días la UF que informa el SII y la guarda en `uf_daily`. No depende de ningún cliente.

**Reglas de diseño**

- El conector no calcula y el motor no sabe nada del SII. La extracción queda desacoplada del front para que las vistas evolucionen sin rehacer los extractores.
- Si una fuente falla, el run termina en `PARTIAL` y el reporte la marca como fallida. No se presenta un diagnóstico incompleto como completo.
- El reporte de un cliente solo puede leerlo quien inició el run o un usuario interno autorizado.

## Plan día a día

Tres frentes en paralelo. El motor no espera al scraper porque parte con la prueba dorada, y el front no espera al backend porque ya funciona contra la API simulada.

| Día | Conectores | Motor y API | Front | Entregable del día |
| --- | --- | --- | --- | --- |
| 1 | Login SII con RUT de prueba; confirmar las rutas del traspaso y el formato de cada fuente | Esquema de base de datos, parámetros, carga de las pruebas doradas; UF diaria desde el SII con su carga histórica | Cliente HTTP con respaldo al mock; registro de usuario | Login funcionando y front navegable contra la API |
| 2 | Conector y parser F22 compacto (4 a 5 AT), con rebajas | Cálculos 1 a 16 con las pruebas doradas pasando; endpoints de consentimiento y run | Conexión y extracción contra la API real | F22 real en base de datos y run visible en pantalla |
| 3 | Conectores y parsers F29 y F50 | Endpoint de reporte: F22, cálculos, `method` y cobertura | Diagnóstico Base con datos reales de F22 | Primer diagnóstico real, sin propiedades |
| 4 | Conector y parser de bienes raíces; datos del contribuyente, sociedades, regímenes y timbrajes | Cálculos 17 a 21; reporte completo; estados terminales y errores; fotografía por propietario | Propiedades, declaraciones mensuales y PDF con datos reales | Diagnóstico Base completo de un RUT real |
| 5 | Sesión vencida, período sin declaración, CAPTCHA, timeout | Listado de propietarios, resumen del portafolio y control de acceso; prueba con 3 a 5 RUT reales | Propietarios y Radiografía con datos reales; revisión de estados de falla y móvil | Demo a Ricardo |

Si el equipo es de dos personas, el frente de front se reparte entre los días 1 y 4, porque es el que menos trabajo nuevo tiene. El detalle de enajenación, pago al contado y financiamiento de bienes raíces es lo más incierto de la semana: depende de lo que entregue el SII en "Mis Bienes". Si el día 5 no alcanza, el resumen del portafolio se calcula en el front y su endpoint pasa al sprint siguiente.

### Tickets para Linear

Los identificadores del plan anterior se conservan. Los nuevos llevan "(nuevo)".

**Conectores**

- [ ] SII-01 Login SII con sesión efímera y detección de CAPTCHA y MFA
- [ ] SII-02 Confirmar las cuatro rutas del traspaso y el formato de cada fuente; encontrar la ruta de los datos del contribuyente, sociedades, regímenes y timbrajes
- [ ] SII-03 Conector y parser F22 compacto, con regla de código ausente y signo; incluye las rebajas a la renta
- [ ] SII-04 Conector y parser F29
- [ ] SII-05 Conector y parser F50
- [ ] SII-06 Conector y parser de bienes raíces: identificación, avalúo, enajenación, pago al contado y financiamiento
- [ ] SII-07 Datos del contribuyente: fecha de nacimiento, inicio de actividades y actividades económicas
- [ ] SII-08 Almacenamiento de evidencia cruda con hash
- [ ] SII-09 Sociedades, regímenes tributarios y timbrajes

**Motor y API**

- [ ] CAL-01 Esquema de base de datos (crudo, normalizado, derivado) y tabla de parámetros por período
- [ ] CAL-02 Cálculos 1 a 13: renta, impuesto, tramos, rebaja máxima del Art. 55 bis, renta financiera y límites, con el estado de cada uno
- [ ] CAL-03 Pruebas doradas: caso Carlos Díaz (AT 2022–2025) y caso real anonimizado de 5 años
- [ ] CAL-04 Cálculos 14 a 16: Credit Capacity, conversión a UF y factor leverage (1 a 5), con sus controles
- [ ] CAL-05 Controles de datos: avalúo total = afecto + exento y total de orígenes contra la suma de códigos
- [ ] CAL-06 Tramo de Global Complementario con la tabla del Art. 52 de cada año tributario, en pesos, comparada contra el código 170
- [ ] CAL-07 Cálculos 17 a 21: propiedades, Ley 20.455 y deuda de origen por institución; totales por comuna y destino
- [ ] CAL-08 Leverage por institución y total, cuando se conozca el divisor
- [ ] CAL-09 (nuevo) Reglas generales del motor: redondeo, tolerancias, año sin declaración, dato faltante y división por cero
- [ ] CAL-10 (nuevo) Carga de UTA y de la tabla del Impuesto Global Complementario por año tributario, desde el SII
- [ ] CAL-11 (nuevo) UF diaria desde el SII: proceso de todos los días, carga histórica, alerta si falta un día y consulta por fecha para el motor
- [ ] API-01 Registro de usuario y consentimiento: crear y revocar
- [ ] API-02 Run: crear, consultar estado y cancelar
- [ ] API-03 Reporte con el contrato del front
- [ ] API-04 Errores en formato problem+json y control de acceso al reporte
- [ ] API-05 Cobertura por fuente y estado `PARTIAL`
- [ ] API-06 Trazabilidad: cada valor derivado guarda los datos normalizados que usó
- [ ] API-07 Listado de propietarios (`/v1/owners`)

**Backoffice**

- [ ] ADM-01 (nuevo) Fotografía por propietario al terminar el run; el backoffice usa la última captura completa
- [ ] ADM-02 (nuevo) Resumen del portafolio (`/v1/portfolio/summary`): cifras y distribuciones por tramo, destino, avalúo y comuna
- [ ] ADM-03 (nuevo) Reglas de estado del propietario y de alertas, según lo que se decida
- [ ] ADM-04 (nuevo) Acceso solo para usuarios internos y registro de cada consulta
- [ ] ADM-05 (nuevo) Un cliente que revoca su consentimiento sale del backoffice

**Front**

- [ ] WEB-01 Registro de usuario antes de la conexión
- [ ] WEB-02 Cliente HTTP en `src/lib/api.ts`, con la API simulada como respaldo para demos
- [ ] WEB-03 Diagnóstico Base con datos reales: valores no capturados, cobertura y estados vacíos
- [ ] WEB-04 Propiedades calculadas por el motor en lugar del front
- [ ] WEB-05 Revisar las pantallas de falla con respuestas reales del backend
- [ ] WEB-06 Vista Crédito: tasa y plazo de partida y rango de la tabla tomados del reporte
- [ ] WEB-07 Registro de cálculos contra el reporte real: estados, autoverificación y enlaces de trazabilidad
- [ ] WEB-08 PDF: revisar el informe impreso con datos reales
- [ ] WEB-09 Propietarios conectada al listado real
- [ ] WEB-10 (nuevo) Radiografía conectada a datos reales, con portafolio vacío y con un solo cliente
- [ ] WEB-11 (nuevo) Diagnóstico Base por vistas con datos reales: de 1 a 6 años, sin propiedades y en móvil

**Operación**

- [ ] OPS-01 Manejo de errores y estados del run
- [ ] OPS-02 Verificar que la clave no queda en logs ni en disco
- [ ] OPS-03 Prueba con RUT reales y demo

## Bloqueantes para el día 1

Sin los dos primeros puntos el sprint no parte. Los demás se resuelven durante la semana sin detener el desarrollo.

- [ ] **RUT de prueba con clave tributaria y consentimiento firmado.** Idealmente 3 a 5: uno con arriendos, uno con honorarios, uno con empresa y al menos uno con varias propiedades financiadas.
- [ ] **ERS de BICRED y cualquier avance del scraper existente.** Si ya hay selectores mapeados, el día 1 se acorta.
- [ ] Confirmar si el "documento original con códigos y fórmulas" del traspaso es el Capítulo IV u otro.
- [ ] Ricardo responde la lista de pendientes del método (abajo). No detiene el desarrollo: mientras tanto el informe muestra cada punto con su estado.
- [ ] Captura o acceso a la vista "Propietarios" de la herramienta de referencia, y definición de qué debe llevar el reporte que se entrega al banco.
- [ ] Confirmar cuántos años de F22 y meses de F29 se traen por defecto, y cómo se tratan las declaraciones rectificadas.
- [ ] Confirmar qué códigos del F29 alimentan el resumen mensual.
- [ ] Confirmar la ruta en sii.cl de los datos del contribuyente, sociedades, regímenes y timbrajes: no viene en el traspaso.
- [ ] Confirmar si "Mis Bienes" entrega la enajenación y el pago al contado en UF o solo en pesos.
- [ ] Confirmar dónde corre el servicio y con qué IP sale, para no gatillar bloqueos del SII.

**Riesgo principal:** que el SII exija CAPTCHA o segundo factor en el login. Si ocurre, el plan B es un flujo asistido en el que el cliente inicia sesión y el sistema continúa con su sesión, sin evadir el control.

## Pendientes del método para Ricardo

Es la misma lista que el informe muestra en su vista "Pendientes", más los datos que faltan.

**Cerrado en la reunión del 7 de octubre**

- [x] Base imponible: orígenes menos rebajas debe coincidir con el código 170.
- [x] UTA: la de diciembre del mismo año de la declaración.
- [x] Tramo Art. 55 bis y rebaja máxima de intereses.
- [x] Tramo de Global Complementario: tabla del Art. 52 de cada año tributario.
- [x] Credit Capacity: no hay tasa ni plazo únicos; la persona escribe ambos en la vista Crédito.
- [x] Factor de renta neta: 0,90 bajo 15% de tasa efectiva y 0,80 desde 15% (validado después de la reunión, según informó Cristóbal).
- [x] Factor leverage: lo define cada institución; niveles F1 a F5.
- [x] Deuda por institución: valor de compra menos pie, sumado por institución.
- [x] Asiento de apertura, valor depreciable, monto IVA y estado de resultados: fuera del informe.

**Por confirmar** (hoy se calcula con una regla deducida de los casos)

- [ ] Renta financiera bruta: la fórmula que reproduce los casos es total de orígenes − 955 − 152 + 494. La que describió Ricardo (código 158 − 106 − 108, más el 494) no los reproduce. ¿Cuál es la correcta y de dónde salen los 5 a 10 pesos de diferencia?
- [ ] Credit Capacity en UF: el valor de la UF se toma del SII; ¿de qué fecha? ¿31 de diciembre del año comercial, como en el caso, o el día de la captura?
- [ ] Crédito automotriz: tasa de referencia.
- [ ] Rebajas: código del F22 de cada concepto.
- [ ] Ley 20.455 y uso familiar por propiedad: ¿vienen del SII o las informa el cliente?
- [ ] Nivel de leverage que recomienda no superar: en la reunión se entendió "2,5 a 3". Confirmar la cifra antes de usarla; hoy no aparece en el informe.

**Por determinar** (hoy no se puede calcular)

- [ ] Leverage por institución y total: ¿por qué número se divide la deuda, y con la UF de qué fecha? BICRED muestra 8,8 para una deuda de 18.426,4 UF, lo que deja el divisor entre 2.082 y 2.101 UF. El Capítulo IV muestra 5,7 para Carlos Díaz.
- [ ] Recomendación sobre la Ley 20.455: ¿es un texto fijo o depende de una regla?

## Qué sigue después

- **P1:** contingencias tributarias con el dato que informa el cliente, análisis por banco, segmentación por arquetipos, filtros y exportes del backoffice.
- **P2:** hallazgos, mesa de trabajo con el agente del cliente, agente del portafolio, párrafos generativos y vista comercial para instituciones financieras. El front de ambos agentes ya existe y está visible como "Próximamente"; falta conectarlo a datos reales y a un modelo.

## Anexo: fórmulas de contingencias tributarias

Fuera de la fase 1. Se dejan escritas porque el front ya muestra la sección cuando el reporte la trae. Las fórmulas se dedujeron de las cifras del Capítulo IV (AT 2024 y AT 2025, calculadas al 01-11-2025) y están **por confirmar**. El punto de partida es un dato que informa el cliente y no viene del SII: los arriendos que realmente percibe al mes.

| Paso | Fórmula | Verificación contra el caso |
| --- | --- | --- |
| Arriendos que debió declarar | Arriendos percibidos al mes × 12 | $5.370.000 × 12 = $64.440.000 |
| Arriendos no declarados | Lo anterior − código 955 declarado | Exacto en los 2 años |
| Base imponible ajustada | Código 170 + arriendos no declarados | Exacto en los 2 años |
| Impuesto determinado ajustado | Tabla de Global Complementario del año sobre la base ajustada | No se recalculó: falta la tabla oficial |
| Diferencia de impuesto | Impuesto ajustado − código 157 | Difiere en $30 y en $200 |
| Débito fiscal neto | Diferencia de impuesto − IGC pagado | Exacto en los 2 años |
| Deuda en UF | Débito fiscal neto ÷ UF de abril del año del AT | UF implícita: 37.261,32 y 39.075,18 |
| Corrección monetaria (Art. 53) | Deuda en UF × UF de la fecha de cálculo − débito fiscal neto | UF implícita de 39.602,77 en los 2 años |
| Intereses (Art. 53) | (Débito + corrección) × 1,5% × meses de atraso | Exacto en los 2 años, con 19 y 7 meses |
| Multa (Art. 97) | (Débito + corrección + intereses) × tasa. Tasa = 10% + 2% por cada mes sobre el quinto, con tope de 30% | Tasas de 30% y 14%; difiere en $90 en AT 2024 |
| Débito total del año | Débito + corrección + intereses + multa | Exacto en AT 2025; el caso trae $300 menos en AT 2024 |
| Contingencia total | Suma de los débitos totales de cada año | $30.999.570 |

Los meses de atraso se cuentan desde el vencimiento de abril hasta la fecha de cálculo, y una fracción de mes cuenta como mes completo. Las dos UF de esta tabla (la de abril y la de la fecha de cálculo) salen de la tabla diaria del SII.

Por confirmar con Ricardo: de dónde sale el "IGC pagado", por qué la diferencia de impuesto no coincide exactamente con el impuesto ajustado menos el código 157, y si la fecha de la UF y el conteo de meses son los correctos.
