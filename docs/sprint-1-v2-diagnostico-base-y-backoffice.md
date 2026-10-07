# Sprint 1 (versión 2) — Conexión SII, extracción, Diagnóstico Base y backoffice

7 de octubre de 2026 · Cristóbal Oyanedel

En 5 días hábiles una persona debe poder registrarse, conectar su RUT y clave tributaria, ver cómo el sistema extrae sus fuentes desde el SII y recibir su **Diagnóstico Base**. El equipo interno debe poder ver en el **backoffice** quiénes han entrado y cómo se compone el portafolio.

Este documento reemplaza como plan vigente a `sprint-1-conexion-extraccion-diagnostico-base.md`, que queda sin modificar como referencia. Reúne en un solo lugar todas las fórmulas que el motor debe implementar, con su estado y su evidencia.

## Qué cambió respecto del plan anterior

| Tema | Antes | Ahora |
| --- | --- | --- |
| UF | Un valor de referencia cargado a mano | Se obtiene del SII todos los días y cada cálculo pide la de su fecha |
| Diagnóstico Base en pantalla | Una página larga | Cinco vistas (Resumen, Cálculos, Datos del SII, Pendientes, Glosario). Los cálculos se ven como bloques y la explicación de uno queda siempre abierta al lado |
| PDF | Lo mismo que la pantalla | Documento completo aparte: imprime todas las vistas y todos los cálculos en orden |
| Fórmulas | Repartidas en tres tablas | Un solo catálogo numerado, con redondeo, tolerancia y casos especiales |
| Origen de los datos | Una tabla de fuentes | Ruta paso a paso de cada fuente, cada dato con su código y los cálculos que lo usan, y una ficha por cálculo con lo que toma y lo que necesita |
| Contingencias Art. 53 y 97 | Sin fórmulas | Fórmulas deducidas del caso y verificadas, en un anexo. Siguen fuera de la fase 1 |
| Backoffice | "Vista Propietarios mínima" | Propietarios y Radiografía del portafolio, con sus datos, fórmulas, endpoints y tickets |
| Agente del portafolio | Sin mencionar | Visible como "Próximamente", igual que el agente del cliente |

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
- **Diagnóstico Base:** cinco vistas con el año siempre a la vista. Una cifra del resumen abre su cálculo; un dato del SII dentro de un cálculo abre su tabla con la fila resaltada; "Se usa en" vuelve al cálculo. Cada vista y cada cálculo tiene dirección propia (`/diagnostico#calc-tasa-efectiva`).
- **Registro de cálculos:** `src/lib/calculos.ts` define cada cálculo como una función pura con definición fija, operación, fuentes, dependencias y estado. Tiene 13 pruebas (`npm test`): el caso Carlos Díaz, un caso real de 5 años anonimizado y 1.000 reportes generados al azar.
- **PDF:** impresión del navegador, con todas las vistas y todos los cálculos.
- **Backoffice:** Propietarios (cifras del portafolio y tabla por cliente) y Radiografía (clientes por tramo de Global Complementario y de Art. 55 bis; propiedades por destino, avalúo y comuna). Hoy usan un portafolio de ejemplo de 10 clientes.
- **Escenarios de prueba:** `?demo=captcha|mfa|clave|parcial|fallo|error` en el login simula cada estado sin tocar el SII.

Los dos agentes (el del cliente y el del portafolio) están construidos y siguen visibles con la etiqueta "Próximamente". No son alcance de este sprint, pero no se ocultan ni se eliminan.

## De dónde sale cada dato

Hay cuatro orígenes posibles para un dato, y el informe los distingue siempre:

| Origen | Qué es | Cómo se obtiene |
| --- | --- | --- |
| Sesión del contribuyente en sii.cl | Lo que la persona declaró o tiene registrado | Conectores, con su RUT y clave |
| Valores públicos del SII | UF de cada día, UTA y tabla del Impuesto Global Complementario | Se leen del sitio del SII, sin sesión. La UF se actualiza todos los días |
| Parámetros del método | Factores y reglas de Ricardo | Tabla de parámetros versionada |
| Lo que escribe la persona | Tasa y plazo del simulador | Formulario del front; no se guarda como dato del SII |

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
| Ingresos por arriendos de bienes raíces | 955 | `incomeOrigins` | 1 y 8 |
| Rentas asignadas Art. 14 D N°8 | 1632 | `incomeOrigins` | 1 |
| Rentas de capitales mobiliarios | 155 | `incomeOrigins` | 1 |
| Rentas exentas del IGC | 152 | `incomeOrigins` | 1 y 8 |
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
| Base imponible tributaria | 170 | `igcBase.base170` | 3 (comparación), 4 y 5 |
| Impuesto determinado según tabla | 157 | `igcBase.tax157` | 4 |
| Gastos presuntos de honorarios | 494 | `method.adjustments` | 8 |
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
| Monto de enajenación en pesos | Antecedentes | `properties.precioAdquisicion` | 20 |
| Monto de enajenación en UF | Antecedentes | `properties.enajenacionUf` | 16 y 19 |
| Pago al contado en pesos | Antecedentes | `properties.pagoContado` | 20 |
| Pago al contado en UF | Antecedentes | `properties.pagoContadoUf` | 17 |
| Institución, monto financiado y monto en UF | Antecedentes | `properties` | Deuda por institución (por determinar) |
| Acogida a la Ley 20.455 | Por confirmar si viene del SII | `properties.ley20455` | 19 |
| Uso familiar | Por confirmar si viene del SII | `properties.usoFamiliar` | Ninguno: solo se muestra |

Reglas de bienes raíces:

- Si el SII no entrega un dato de una propiedad, queda como no capturado. Los totales suman solo lo informado; si ninguna propiedad trae el dato, el total es desconocido.
- Si el SII entrega la enajenación solo en pesos, la conversión usa la UF del SII de la fecha de adquisición, tomada de la tabla diaria. Falta confirmar si el SII ya la entrega en UF.
- Si esta fuente falla, el run termina en `PARTIAL` y los cálculos 16 a 20 muestran "Dato no capturado".

### Datos del contribuyente

| Dato | Dónde queda en el reporte | Dónde se usa |
| --- | --- | --- |
| Nombre y RUT | `taxpayer` | Encabezado; backoffice |
| Fecha de nacimiento e inicio de actividades | `taxpayer` | Resumen |
| Actividades económicas: código, glosa, categoría y fecha de inicio | `activities` | Datos del SII; línea de tiempo |
| Sociedades: RUT, nombre, participación y fecha | `companies` | Datos del SII; línea de tiempo |
| Regímenes tributarios: código, nombre y fecha de inicio | `regimes` | Datos del SII; línea de tiempo |
| Timbrajes: documento y fecha | `stampings` | Datos del SII; línea de tiempo |

Ningún cálculo del método usa estos datos en la fase 1.

### Valores públicos y parámetros

No vienen de la sesión del contribuyente. Se cargan una vez por período y viajan en `method`.

| Dato | De dónde sale | Qué valor se toma | Cálculos que lo usan |
| --- | --- | --- | --- |
| UTA | Valores publicados por el SII | Diciembre del mismo año del AT (por confirmar) | 5 |
| UF | Valor diario que informa el SII; se carga todos los días (ver abajo) | La de la fecha que pida cada cálculo. Para el Credit Capacity en UF, hoy el 31 de diciembre del año comercial (por confirmar) | 14; simulador |
| Tabla del Impuesto Global Complementario | Tabla anual publicada por el SII, en UTA | La del año tributario | 7 |
| Rangos del Art. 55 bis | Ley y casos de referencia | A, B y C en UTA | 6 |
| Códigos que restan y suman en la RFB | Ricardo | 955, 152 y 494 | 8 |
| Regla del factor de renta neta | Ricardo | 0,90 o 0,80 según la tasa efectiva | 9 |
| Factor hipotecario y automotriz | Capítulo IV | 0,25 y 0,07 | 11 y 12 |
| Tasa y plazo hipotecario | Ricardo | 4% anual a 30 años | 13 |
| Factores leverage | Ricardo | 1 a 4 | 15 |
| Capital del asiento de apertura | Informe de referencia | $10.000.000 | 20 |

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
| Tasa anual y plazo del crédito hipotecario | Simulador | Recalcular el Credit Capacity con otros supuestos |
| Tasa anual del crédito automotriz | Simulador | Calcular el crédito automotriz, que no tiene tasa por defecto |

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
| 3 | Base imponible | (1) − (2), comparada con el código 170 declarado | Por confirmar | Exacto en 4 de 5 años; en AT 2022 del informe real difiere en $1.252.199 | $99.322.241 |
| 4 | Tasa efectiva de tributación | Código 157 ÷ código 170 | Calculado | 9 de 9 | 16,04% |
| 5 | Base imponible en UTA | Código 170 ÷ UTA del año | Por confirmar | Los casos usan la UTA de diciembre del mismo año del AT | 119,00 UTA |
| 6 | Tramo Art. 55 bis | Rango de (5): A bajo 90 UTA, B de 90 a 150, C sobre 150 | Por confirmar | A y B coinciden en los 9 años; el tope de B viene de la ley | B |
| 7 | Tramo de Global Complementario | Rango de (5) en la tabla oficial del año | Por confirmar | Falta cargar la tabla de cada año | Tramo 5 · 30,4% |

Detalles:

- Tasa efectiva: tolerancia de 0,01 puntos porcentuales. Si el código 170 es cero no se calcula.
- Base imponible en UTA: tolerancia de 0,05 UTA.
- UTA cargada hoy: $733.884 (AT 2022), $770.592 (AT 2023), $807.528 (AT 2024), $834.504 (AT 2025).
- Tabla de Global Complementario cargada hoy (ilustrativa, una sola para todos los años):

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
| 8 | Renta financiera bruta (RFB) | (1) − código 955 − código 152 + código 494 | Por confirmar | Cuadra con 5 a 10 pesos de diferencia en los 9 años | $81.700.093 |
| 9 | Renta financiera neta (RFN) | (8) × factor. Factor 0,90 si (4) es menor a 15%; 0,80 si es 15% o más | Por confirmar | La regla reproduce los 9 años | $65.360.074 |
| 10 | RFN mensual | (9) ÷ 12 | Calculado | 9 de 9 | $5.446.673 |
| 11 | Límite crédito hipotecario | (10) × 0,25 | Calculado | Capítulo IV | $1.361.668 |
| 12 | Límite crédito automotriz | (10) × 0,07 | Calculado | Capítulo IV | $381.267 |
| 13 | Credit Capacity | PV = PMT × (1 − (1 + i)^−n) ÷ i, con PMT = (11), i = tasa anual ÷ 12, n = años × 12 | Por confirmar | La fórmula es la del Capítulo IV; faltan tasa, plazo y fecha de la UF de producción | $285.216.668 con 4% a 30 años |
| 14 | Credit Capacity en UF | (13) ÷ UF del SII en la fecha de referencia | Por confirmar | El valor sale de la tabla diaria del SII; falta confirmar qué fecha se usa | UF 7.424 (UF 38.416,69 al 31-12-2024) |
| 15 | Factor leverage | (14) × factor, para cada factor de la lista | Por confirmar | Falta saber qué factores mostrar | Factor 2: UF 14.849 · Factor 3: UF 22.273 |

Detalles:

- RFB: en AT 2025 la operación da $81.700.084 y el caso informa $81.700.093. El informe muestra el valor del caso y la diferencia de $9.
- Factor de renta neta: si el código 170 es cero, la tasa efectiva se toma como 0 y el factor es 0,90.
- RFN mensual y los dos límites: tolerancia de 1 peso.
- Credit Capacity: si la tasa es 0, PV = PMT × n. El resultado se redondea al peso.

**Simulador de crédito (front).** Usa la misma fórmula del Credit Capacity con la tasa y el plazo que escribe la persona; parte con los valores por defecto del reporte.

| Cálculo | Fórmula | Estado |
| --- | --- | --- |
| Crédito hipotecario simulado | PV con PMT = (11), tasa y plazo ingresados | Calculado |
| Crédito automotriz simulado | PV con PMT = (12) y n = 48 meses | Por confirmar: el Capítulo IV no fija la tasa, así que solo se calcula cuando la persona la ingresa |
| Conversión a UF | Monto ÷ UF del SII en la fecha de referencia | Por confirmar: qué fecha se usa |

### 3. Propiedades

| N° | Cálculo | Fórmula | Estado | Evidencia |
| --- | --- | --- | --- | --- |
| 16 | Activos (enajenación total) | Suma de los montos de enajenación en UF | Calculado | Exacto en ambos casos: 35.728,07 y 24.708 UF |
| 17 | Patrimonio (pago contado total) | Suma de los pagos al contado en UF | Calculado | Exacto en ambos casos: 7.693,49 y 6.281,6 UF |
| 18 | Pasivos de origen | (16) − (17) | Calculado | Exacto en ambos casos: 28.034,58 y 18.426,4 UF |
| 19 | Adquisición sin las propiedades acogidas a la Ley 20.455 | (16) − enajenación en UF de las propiedades acogidas | Calculado | Informe real: 24.708 − 13.100 − 5.800 = 5.808 UF |

Totales que acompañan a la tabla de propiedades, sin fórmula del método: cantidad de roles, suma de avalúos fiscales, suma de contribuciones, propiedades por destino, por comuna y por institución (cantidad y UF financiadas).

Los pasivos de origen son lo financiado al comprar, no la deuda vigente.

### 4. Análisis inmobiliario

| N° | Cálculo | Fórmula | Estado | Evidencia |
| --- | --- | --- | --- | --- |
| 20 | Asiento de apertura: reservas para futuras capitalizaciones | Activos inmobiliarios en pesos − pasivo de largo plazo − capital | Por confirmar | Reproduce $525.130.859 del informe real. El pasivo coincide con el pago al contado y el capital es $10.000.000 fijo |
| — | Valor depreciable total y cuota mensual | Inversión × (1 − 0,17) no reproduce el informe. La cuota sería el total ÷ 192 meses | Por determinar | — |
| — | Monto IVA total | Sin fórmula | Por determinar | — |
| — | Estado de resultados | Sin datos en el informe de referencia | Por determinar | — |
| — | Deuda por institución y leverage | Se tiene la deuda de origen por institución; falta la fórmula del leverage (el Capítulo IV muestra 5,7) | Por determinar | — |
| — | Recomendación sobre la Ley 20.455 | Falta saber si es un texto fijo o una regla | Por determinar | — |

### 5. Backoffice

Todo sale de los valores ya calculados para cada cliente; el backoffice no tiene fórmulas del método. Se usa la última captura completa de cada cliente y, de ella, su año tributario más reciente.

**Por propietario**

| Dato | De dónde sale |
| --- | --- |
| Nombre y RUT | Datos del contribuyente |
| Estado | Regla por definir (ver decisiones abiertas). Propuesta: Activo si la última captura terminó completa; En revisión si terminó parcial o algún cálculo no cuadra con su verificación; Sin datos si no tiene captura completa |
| Tramo de Global Complementario | Cálculo 7 |
| Tramo Art. 55 bis | Cálculo 6 |
| Región principal | La región con más propiedades del cliente |
| Orígenes de renta | Cálculo 1 |
| RFN mensual | Cálculo 10 |
| Tasa efectiva | Cálculo 4 |
| Dividendo máximo | Cálculo 11 |
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

**Orden de cálculo.** 1 y 2 → 3 · 4 · 5 → 6 y 7 · 8 → 9 → 10 → 11 y 12 → 13 → 14 → 15 · 16 y 17 → 18 · 19 · 20. Los cálculos 1 a 15 se repiten para cada año tributario capturado; los 16 a 20 se calculan una vez por cliente.

### Renta e impuesto

| N° | Cálculo | Toma del SII | Parámetros | Cálculos previos | Necesita | Si falta | Lo usan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Total de orígenes de renta | Los 14 códigos de orígenes del F22 del año | — | — | F22 del año capturado | Sin declaración ese año | 3 y 8; backoffice |
| 2 | Total de rebajas | Los 9 conceptos de rebajas del F22 del año | — | — | F22 del año capturado | Sin declaración ese año | 3 |
| 3 | Base imponible | Código 170, para comparar | — | 1 y 2 | F22 del año capturado | Sin declaración ese año | Ninguno |
| 4 | Tasa efectiva | Códigos 157 y 170 | — | — | F22 del año, con código 170 distinto de cero | No se puede calcular: la base imponible es 0 | 9; backoffice |
| 5 | Base imponible en UTA | Código 170 | UTA del año | — | F22 del año y UTA cargada para ese año | Dato no capturado | 6 y 7 |
| 6 | Tramo Art. 55 bis | — | Rangos A, B y C | 5 | Cálculo 5 con valor | Dato no capturado | Backoffice |
| 7 | Tramo de Global Complementario | — | Tabla del año | 5 | Cálculo 5 con valor y tabla del año cargada | Dato no capturado | Backoffice |

### Renta financiera y crédito

| N° | Cálculo | Toma del SII | Parámetros | Cálculos previos | Necesita | Si falta | Lo usan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | Renta financiera bruta | Códigos 955, 152 y 494 del F22 del año | Lista de códigos que restan y suman | 1 | F22 del año capturado | Sin declaración ese año | 9 |
| 9 | Renta financiera neta | — | Regla del factor (umbral de 15%, 0,90 y 0,80) | 8 y 4 | Cálculo 8 con valor. Si el código 170 es cero, la tasa se toma como 0 | Dato no capturado | 10 |
| 10 | RFN mensual | — | — | 9 | Cálculo 9 con valor | Dato no capturado | 11 y 12; backoffice |
| 11 | Límite crédito hipotecario | — | Factor 0,25 | 10 | Cálculo 10 con valor | Dato no capturado | 13; simulador; backoffice |
| 12 | Límite crédito automotriz | — | Factor 0,07 | 10 | Cálculo 10 con valor | Dato no capturado | Simulador |
| 13 | Credit Capacity | — | Tasa anual y plazo en años | 11 | Cálculo 11 con valor | Dato no capturado | 14 |
| 14 | Credit Capacity en UF | — | UF del SII en la fecha de referencia | 13 | Cálculo 13 con valor y la UF de esa fecha cargada | Dato no capturado | 15 |
| 15 | Factor leverage | — | Lista de factores | 14 | Cálculo 14 con valor | Dato no capturado | Ninguno |

### Propiedades y análisis inmobiliario

| N° | Cálculo | Toma del SII | Parámetros | Cálculos previos | Necesita | Si falta | Lo usan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 16 | Activos | Enajenación en UF de cada propiedad | — | — | Al menos una propiedad con enajenación en UF | Sin propiedades inscritas, o Dato no capturado | 18 y 19 |
| 17 | Patrimonio | Pago al contado en UF de cada propiedad | — | — | Al menos una propiedad con pago al contado en UF | Sin propiedades inscritas, o Dato no capturado | 18 |
| 18 | Pasivos de origen | — | — | 16 y 17 | Cálculos 16 y 17 con valor | Dato no capturado | Ninguno |
| 19 | Adquisición sin Ley 20.455 | Marca de Ley 20.455 y enajenación en UF de las propiedades acogidas | — | 16 | Cálculo 16 con valor. Sin propiedades acogidas, resta cero | Dato no capturado | Ninguno |
| 20 | Asiento de apertura | Enajenación y pago al contado en pesos de cada propiedad | Capital | — | Al menos una propiedad con ambos montos en pesos | Sin propiedades inscritas, o Dato no capturado | Ninguno |

Los cinco puntos "por determinar" del análisis inmobiliario no tienen ficha porque no tienen fórmula. Lo que ya se tiene para cada uno:

| Punto | Datos que ya se tienen | Qué falta |
| --- | --- | --- |
| Valor depreciable | Cálculo 16, factor de terreno 0,17 y vida útil de 192 meses | La fórmula del total |
| Monto IVA total | Enajenación total en pesos | La fórmula |
| Estado de resultados | Ninguno | Ingresos percibidos, gastos financieros y la fórmula del resultado |
| Deuda por institución y leverage | Propiedades y UF financiadas por institución | La fórmula del leverage |
| Recomendación sobre la Ley 20.455 | Cálculo 19 | Si es un texto fijo o una regla |

### Simulador y backoffice

| Pieza | Qué toma | Qué necesita |
| --- | --- | --- |
| Crédito hipotecario simulado | Cálculo 11 del último año, y la tasa y el plazo que escribe la persona | Tasa mayor o igual a cero y plazo mayor a cero |
| Crédito automotriz simulado | Cálculo 12 del último año, 48 meses y la tasa que escribe la persona | Que la persona escriba una tasa |
| Fila de un propietario en el backoffice | Cálculos 1, 4, 6, 7, 10 y 11 del último año de su última captura completa, y sus propiedades | Una captura completa del cliente |
| Cifras y gráficos del portafolio | Las filas de todos los propietarios y sus propiedades | Al menos un propietario; con portafolio vacío todo queda en cero |

## Parámetros

Nada que cambie con el tiempo queda fijo en el código. Todos viajan en `method` dentro del reporte, con la versión de reglas.

| Parámetro | Valor inicial | Estado |
| --- | --- | --- |
| Códigos que se restan y se suman en la RFB | Restan 955 y 152; suma 494 | Por confirmar |
| Regla del factor de renta neta | 0,90 bajo 15% de tasa efectiva; 0,80 desde 15% | Por confirmar |
| Rangos del tramo Art. 55 bis | A hasta 90 UTA, B hasta 150, C sobre 150 | Por confirmar |
| Tramos de Global Complementario | Tabla oficial por año, en UTA | Cargar por AT y validar |
| UTA por año | Diciembre del mismo año del AT | Por confirmar |
| UF | Valor diario del SII, cargado todos los días | Fuente definida. Por confirmar qué fecha usa el Credit Capacity en UF: hoy el 31 de diciembre del año comercial |
| Factor hipotecario y automotriz | 0,25 y 0,07 | Capítulo IV |
| Tasa y plazo hipotecario de referencia | 4% anual a 30 años | Por confirmar si son los de producción |
| Plazo automotriz de referencia | 48 meses | Capítulo IV; falta la tasa |
| Factores leverage a mostrar | 1 a 4 | Por confirmar: el caso solo muestra 2 y 3 |
| Factor de terreno y vida útil | 0,17 y 192 meses | Por determinar: no reproducen el valor depreciable |
| Capital del asiento de apertura | $10.000.000 | Por confirmar de dónde sale |
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
| 2 | Conector y parser F22 compacto (4 a 5 AT), con rebajas | Cálculos 1 a 15 con las pruebas doradas pasando; endpoints de consentimiento y run | Conexión y extracción contra la API real | F22 real en base de datos y run visible en pantalla |
| 3 | Conectores y parsers F29 y F50 | Endpoint de reporte: F22, cálculos, `method` y cobertura | Diagnóstico Base con datos reales de F22 | Primer diagnóstico real, sin propiedades |
| 4 | Conector y parser de bienes raíces; datos del contribuyente, sociedades, regímenes y timbrajes | Cálculos 16 a 20; reporte completo; estados terminales y errores; fotografía por propietario | Propiedades, declaraciones mensuales y PDF con datos reales | Diagnóstico Base completo de un RUT real |
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
- [ ] CAL-02 Cálculos 1 a 12: renta, impuesto, tramos, renta financiera y límites, con el estado de cada uno
- [ ] CAL-03 Pruebas doradas: caso Carlos Díaz (AT 2022–2025) y caso real anonimizado de 5 años
- [ ] CAL-04 Cálculos 13 a 15: Credit Capacity, conversión a UF y factor leverage, con sus controles
- [ ] CAL-05 Controles de datos: avalúo total = afecto + exento y total de orígenes contra la suma de códigos
- [ ] CAL-06 Tramo de Global Complementario con tabla oficial por año
- [ ] CAL-07 Cálculos 16 a 20: propiedades, Ley 20.455 y asiento de apertura; totales por institución, comuna y destino
- [ ] CAL-08 Completar los cálculos "por determinar" cuando llegue la fórmula: valor depreciable, monto IVA, estado de resultados, leverage por institución
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
- [ ] WEB-06 Simulador de crédito con parámetros por defecto tomados del reporte
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

Es la misma lista que el informe muestra en su vista "Pendientes".

**Por confirmar** (hoy se calcula con una regla deducida de los casos)

- [ ] Base imponible: orígenes − rebajas da el código 170 en 4 de 5 años del informe real. ¿Qué explica la diferencia de $1.252.199 en AT 2022?
- [ ] Renta financiera bruta: ¿la fórmula es total de orígenes − 955 − 152 + 494? ¿De dónde salen los 5 a 10 pesos de diferencia?
- [ ] Factor de renta neta: ¿la regla es 0,90 bajo 15% de tasa efectiva y 0,80 desde 15%?
- [ ] UTA: ¿se usa la de diciembre del mismo año del AT?
- [ ] Tramo Art. 55 bis: ¿los rangos son A hasta 90 UTA, B hasta 150 y C sobre 150?
- [ ] Tramo de Global Complementario: validar la tabla oficial de cada año.
- [ ] Credit Capacity: tasa y plazo que se usan por defecto.
- [ ] Credit Capacity en UF: el valor de la UF se toma del SII; ¿de qué fecha? ¿31 de diciembre del año comercial, como en el caso, o el día de la captura?
- [ ] Crédito automotriz: tasa de referencia.
- [ ] Factor leverage: qué factores se muestran.
- [ ] Asiento de apertura: ¿el pasivo de largo plazo es el pago al contado o lo financiado? ¿De dónde sale el capital de $10.000.000?
- [ ] Rebajas: código del F22 de cada concepto.
- [ ] Ley 20.455 y uso familiar por propiedad: ¿vienen del SII o las informa el cliente?

**Por determinar** (hoy no se puede calcular)

- [ ] Valor depreciable total y su cuota mensual: inversión × (1 − 0,17) no reproduce el informe.
- [ ] Monto IVA total: fórmula.
- [ ] Estado de resultados: de dónde salen los ingresos percibidos y los gastos financieros, y la fórmula del resultado tributario.
- [ ] Deuda por institución y leverage: fórmula del leverage por banco y del leverage total (el Capítulo IV muestra 5,7 sin explicarlo).
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
