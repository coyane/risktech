# Sprint 1 — Conexión SII, extracción y Diagnóstico Base

6 de octubre de 2026 · Cristóbal Oyanedel

En 5 días hábiles una persona debe poder registrarse, conectar su RUT y clave tributaria, ver cómo el sistema extrae sus fuentes desde el SII y recibir su **Diagnóstico Base**: un informe con los datos obtenidos del SII y los cálculos del método sobre esos datos, cada uno explicado con su operación y su fuente, que puede descargar en PDF para un banco. Es la fase 1 del proyecto; el agente y los hallazgos quedan fuera.

El informe **no interpreta**. No tiene semáforo, evaluaciones ni texto generado: dos personas con las mismas cifras reciben el mismo informe. Lo que el método aún no define se muestra igual, rotulado como "por confirmar" o "por determinar".

Este plan incorpora el traspaso funcional "Extracción SII y análisis de capacidad crediticia" y el contenido del Informe de Apertura de BICRED.

## Alcance de la fase 1

El recorrido del cliente tiene tres pantallas, y las tres ya existen en el front con datos de ejemplo. El trabajo de la semana es construir lo que hay detrás y conectarlo. La vista Propietarios es para el equipo interno.

| Pantalla | Qué hace el usuario | Qué falta construir |
| --- | --- | --- |
| Conexión | Se registra, ingresa RUT y clave, autoriza la consulta | Registro, consentimiento, sesión efímera con el SII, creación del run |
| Extracción | Ve el avance fuente por fuente y puede cancelar | Conectores, parsers, estados del run, evidencia cruda |
| Diagnóstico Base | Lee sus resultados, ve cómo se calcula cada uno, simula un crédito y descarga el PDF | Motor de cálculo y reporte con el contrato que ya usa el front |
| Propietarios (interna) | El equipo ve quiénes han entrado y sus cifras | Persistencia de todos los clientes procesados y su listado |

| Entra | Queda fuera |
| --- | --- |
| Registro de usuario y login SII en sesión efímera | Conectar el agente y los hallazgos (su front queda visible como "Próximamente") |
| Consentimiento con finalidad, fuentes, vigencia y revocación | Interpretación de las cifras: semáforo, párrafos generativos y recomendaciones |
| F22: últimos 4 a 5 AT, declaración vigente, con orígenes de renta y rebajas | Declaraciones juradas, RCV, DTE, balance tributario |
| F29 y F50: últimos 24 períodos | Contingencias Art. 53 y 97 (dependen de un dato que no viene del SII) |
| Bienes raíces con enajenación, pago al contado y financiamiento | Estadísticas agregadas, arquetipos y vista comercial para bancos |
| Datos personales, actividades económicas, sociedades, regímenes tributarios y timbrajes | Historial de rectificatorias, modelo bitemporal, WORM, SIEM |
| Cálculos del Capítulo IV y del Informe de Apertura, con su estado | Rediseño de las vistas: se usan las que ya existen |
| Vista Propietarios mínima | Evasión de CAPTCHA o MFA (si aparece, el run se detiene) |

**Criterio de terminado**

1. Con los códigos del caso Carlos Díaz (AT 2022–2025), el motor reproduce la tabla "Análisis financiero" del Capítulo IV con tolerancia de ±10 pesos, y la capacidad de crédito del caso: $285.216.668, UF 7.424.
2. Con un RUT real de prueba, el recorrido completo de conexión a Diagnóstico Base toma menos de 10 minutos y todos los cálculos usan datos de esa captura.
3. Cada cifra del diagnóstico responde "¿de dónde salió este número?": la operación completa y, por cada dato, formulario, año, código, folio y valor.
4. Ninguna frase del informe depende del caso: solo cambian cifras, fechas y nombres propios. Lo pendiente aparece rotulado, no se omite.
5. Una clave errónea, un CAPTCHA o una fuente caída terminan en su estado propio y la pantalla lo explica.
6. La clave tributaria no queda en disco, logs ni respuestas de la API.
7. El cliente procesado aparece en la vista Propietarios.

## Lo que ya existe

El front (React + Vite) está construido y funciona contra una API simulada en `src/lib/api.ts`. Ese archivo es el único punto que se reemplaza: las pantallas no cambian si el backend respeta el contrato.

- **Conexión:** valida el dígito verificador, pide consentimiento y envía el RUT sin puntos con el DV separado.
- **Extracción:** muestra los pasos, la bitácora, el botón de cancelar y una pantalla por cada estado terminal.
- **Diagnóstico Base:** en pantalla se recorre por vistas (Resumen, Cálculos, Datos del SII, Pendientes, Glosario), sin página larga: el resumen muestra las cifras principales y la tabla por año; los cálculos se ven como bloques y la explicación de uno, con su operación dibujada y sus fuentes, queda siempre abierta al lado. El PDF imprime el documento completo.
- **Registro de cálculos:** `src/lib/calculos.ts` define cada cálculo como una función pura con definición fija, operación, fuentes y estado. Tiene 13 pruebas (`npm test`): el caso Carlos Díaz, un caso real de 5 años anonimizado y 1.000 reportes generados al azar.
- **Propietarios:** tabla de la consola interna, hoy con un portafolio de ejemplo.
- **Escenarios de prueba:** `?demo=captcha|mfa|clave|parcial|fallo|error` en el login simula cada estado sin tocar el SII.

Los hallazgos y la mesa de trabajo con el agente están construidos y siguen visibles en el menú con la etiqueta "Próximamente". No son alcance de este sprint, pero no se ocultan ni se eliminan.

## Fuentes y datos a extraer

Cada formulario se captura completo como pares código–monto, aunque el diagnóstico use solo una parte.

| Fuente | Ruta en sii.cl | Qué se extrae | Dónde se usa |
| --- | --- | --- | --- |
| F22 | Servicios Online → Declaración de Renta → Corregir o Rectificar → año → Formulario 22 compacto | Todos los códigos visibles con su signo, folio, fecha, tipo | Orígenes de renta, rebajas, base imponible, impuesto, tramo, crédito |
| F29 | Servicios Online → Impuestos Mensuales → Consulta y seguimiento → Consulta Integral | Todos los códigos, folio, fecha, tipo, estado de pago | Declaraciones mensuales |
| F50 | Misma Consulta Integral, formulario 50 | Todos los códigos, folio, fecha | Declaraciones mensuales |
| Bienes raíces | Servicios Online → Bienes Raíces → Mis Bienes → antecedentes | Ver detalle abajo | Propiedades y análisis inmobiliario |
| Contribuyente | Datos generales de la sesión | Nombre, fecha de nacimiento, inicio de actividades, actividades económicas | Encabezado y tablas del SII |
| Sociedades | Datos personales y tributarios → participación en sociedades | RUT y nombre de la sociedad, participación, fecha | Tablas del SII |
| Regímenes tributarios | Datos personales y tributarios | Régimen y fecha de inicio | Tablas del SII |
| Timbrajes | Documentos tributarios autorizados | Documento, rango de folios, fecha | Tablas del SII |

**Datos por propiedad** (cuando el SII los entregue)

- Identificación: rol, comuna, región, dirección, destino, superficies.
- Avalúo: total, afecto y exento; contribución.
- Adquisición: fecha, tipo de acto (compraventa, leasing, adjudicación), monto de enajenación y pago al contado, en pesos y en UF.
- Financiamiento: institución, monto financiado, monto en UF.
- Marcas del informe de referencia: acogida a la Ley 20.455 y uso familiar. Falta confirmar si vienen del SII o las informa el cliente.

**Códigos F22 que usa el diagnóstico**

- Orígenes de renta: 104, 105, 106, 108, 955, 1632, 155, 152, 1032, 1891, 1104, 749, 161, 110.
- Rebajas a la renta: los 9 conceptos del informe de referencia (impuesto territorial, donaciones, pérdida en capitales mobiliarios, cotizaciones de empresario o socio, intereses Art. 55 bis código 750, dividendos Ley 19.622, cuotas de fondos de inversión, APV Art. 42 bis código 765). Falta confirmar el código de los demás.
- Base imponible e impuesto: 170 y 157.
- Gasto presunto de honorarios: 494 (entra en la renta financiera bruta).
- Se muestran sin entrar en ningún cálculo: 158 y 465.

**Reglas de datos**

- **F22 compacto:** un código que no aparece vale cero, no es un error de extracción. Los negativos sí aparecen y se guardan con su signo.
- `null` se reserva para lo que no se capturó (un año sin declaración, una fuente que falló, un dato de propiedad que el SII no entrega). Se muestra como raya, nunca como cero.
- Montos como enteros en CLP, RUT sin puntos y DV separado, fechas en ISO-8601.
- Tres capas separadas: dato crudo (HTML o PDF original con su hash SHA-256), dato normalizado (rut, período, formulario, código, valor, fuente, fecha de extracción) y dato derivado (cálculos). No se mezclan datos originales con inferencias.

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
| `/v1/owners` | GET | Listado de clientes procesados para la vista Propietarios |

**Estados del run.** `RUNNING` agrupa los estados intermedios. Los terminales son `COMPLETED`, `PARTIAL`, `BLOCKED_CAPTCHA`, `BLOCKED_MFA`, `AUTH_FAILED`, `SOURCE_CHANGED`, `QUARANTINED`, `CANCELLED`, `EXPIRED` y `FAILED`.

**Pasos de la extracción.** `LOGIN`, `F22`, `F29`, `F50`, `BIENES_RAICES` (incluye actividades) y `CALCULO`, cada uno en `queued`, `running`, `done` o `error`.

**Errores.** Formato `application/problem+json` con `code`, `detail`, `correlation_id` y `retryable`. Nunca se devuelve HTML del SII ni la clave.

**Reporte para la fase 1**

| Campo | Contenido | Fase 1 |
| --- | --- | --- |
| `taxpayer` | RUT, nombre, fecha de nacimiento, inicio de actividades, fecha de captura y cobertura por fuente | Sí |
| `years`, `incomeOrigins`, `deductions`, `igcBase`, `f22Returns` | Códigos del F22 por año, con folio, fecha y tipo | Sí |
| `financial` | Indicadores calculados por año | Sí |
| `method` | Versión de reglas, UF, UTA por año, factores, regla del factor de renta neta, rangos del Art. 55 bis, tramos de Global Complementario, parámetros con su estado | Sí |
| `properties` | Una fila por rol con identificación, avalúo, enajenación, pago al contado y financiamiento | Sí |
| `activities`, `companies`, `regimes`, `stampings`, `f29`, `f50` | Datos de las demás fuentes | Sí |
| `contingency` | Contingencias tributarias | `null`: el front oculta la sección |
| `summary`, `kpis`, `insights`, `recommendations` | Contenido del agente | Vacíos |

## Cálculos

Se implementa lo que está en los documentos de Ricardo o lo que se pudo deducir de sus casos; no se inventan fórmulas. Cada cálculo lleva un estado, y el informe lo muestra:

| Estado | Cuándo | Qué muestra el informe |
| --- | --- | --- |
| **Calculado** | La fórmula está en un documento del método y cuadra con los casos | Definición, operación con las cifras, fuente de cada dato |
| **Por confirmar** | La fórmula se dedujo de los casos, o usa un parámetro supuesto | Lo mismo, más qué falta confirmar |
| **Por determinar** | Falta la fórmula o el dato | La sección aparece igual, con los datos de entrada que sí se tienen y lo que falta |

La evidencia son 9 años de datos: los 4 del Capítulo IV (Carlos Díaz) y los 5 de un Informe de Apertura real de BICRED, que se usa anonimizado como prueba automática.

### Renta e impuesto

| Cálculo | Fórmula | Estado | Evidencia |
| --- | --- | --- | --- |
| Total de orígenes de renta | Suma de los 14 códigos | Calculado | 9 de 9 años |
| Total de rebajas | Suma de los 9 conceptos | Calculado | Suma directa de lo declarado |
| Base imponible (170) | Total de orígenes − total de rebajas | Por confirmar | Exacto en 4 de 5 años; en AT 2022 del informe real difiere en $1.252.199 |
| Tasa efectiva de tributación | 157 ÷ 170 | Calculado | 9 de 9 |
| Renta financiera bruta (RFB) | Total de orígenes − 955 − 152 + 494 | Por confirmar | Cuadra con 5 a 10 pesos de diferencia en los 9 años |
| Renta financiera neta (RFN) | RFB × factor: 0,90 si la tasa efectiva es menor a 15%; 0,80 si es 15% o más | Por confirmar | La regla reproduce los 9 años |
| RFN mensual | RFN ÷ 12 | Calculado | 9 de 9 |
| Base imponible en UTA | 170 ÷ UTA | Por confirmar | Los casos usan la UTA de diciembre del mismo año del AT |
| Tramo Art. 55 bis | A bajo 90 UTA · B de 90 a 150 · C sobre 150 | Por confirmar | A y B coinciden en los 9 años; el tope de B viene de la ley |
| Tramo de Global Complementario | Base en UTA contra la tabla oficial del año | Por confirmar | Falta cargar la tabla de cada año |

### Capacidad de crédito

| Cálculo | Fórmula | Estado | Control del caso |
| --- | --- | --- | --- |
| Límite crédito hipotecario | RFN mensual × 0,25 | Calculado | $1.361.668 |
| Límite crédito automotriz | RFN mensual × 0,07 | Calculado | $381.267 |
| Credit Capacity | PV = PMT × (1 − (1 + i)^−n) ÷ i, con PMT = límite hipotecario, i = tasa anual ÷ 12 y n = meses | Por confirmar: la fórmula es la del Capítulo IV; faltan tasa, plazo y fecha de la UF de producción | $285.216.668 con 4% anual a 30 años |
| Credit Capacity en UF | PV ÷ UF de referencia | Por confirmar: fecha de la UF | UF 7.424 (UF 38.416,69 al 31-12-2024) |
| Factor leverage | PV × factor | Por confirmar: qué factores mostrar | Factor 2: UF 14.849 · Factor 3: UF 22.273 |

### Propiedades y análisis inmobiliario

| Cálculo | Fórmula | Estado | Evidencia |
| --- | --- | --- | --- |
| Activos | Suma de los montos de enajenación en UF | Calculado | Exacto en ambos casos |
| Patrimonio | Suma de los pagos al contado en UF | Calculado | Exacto en ambos casos |
| Pasivos de origen | Activos − patrimonio | Calculado | Exacto en ambos casos |
| Adquisición fuera de la Ley 20.455 | Activos − las 2 primeras propiedades habitacionales acogidas | Calculado | 24.708 − 13.100 − 5.800 = 5.808 UF |
| Asiento de apertura | Reservas = activos inmobiliarios − pasivo de largo plazo − capital | Por confirmar | Reproduce $525.130.859; el pasivo coincide con el pago al contado y el capital es $10.000.000 fijo |
| Valor depreciable | Inversión × (1 − 0,17) no reproduce el informe | Por determinar | — |
| Monto IVA total | — | Por determinar | — |
| Estado de resultados | Sin datos en el informe de referencia | Por determinar | — |
| Deuda por institución y leverage 5,7 | — | Por determinar | — |
| Recomendación sobre la Ley 20.455 | Falta saber si es un texto fijo o una regla | Por determinar | — |

Si falta la enajenación o el pago al contado de una propiedad, los totales quedan como "dato no capturado", no en cero.

### Reglas para que el informe sea determinístico

- **Un registro único de cálculos.** Cada cálculo es una función pura con pregunta, nombre técnico, definición, operación, fuentes, dependencias y estado. La pantalla solo recorre el registro.
- **Sin texto condicional.** Cada cálculo tiene una sola plantilla de frase, verdadera para cualquier valor. Los casos especiales son un conjunto cerrado: "Dato no capturado", "Sin declaración ese año", "Sin propiedades inscritas", "No se puede calcular: … es 0".
- **Tres tipos de dato, siempre rotulados:** dato del SII (formulario, código, año y folio), parámetro del método y resultado calculado.
- **Trazabilidad en los dos sentidos.** Desde cada dato de una operación se llega a su fila de origen o al cálculo que lo produce; desde cada código de las tablas del SII se llega a los cálculos que lo usan.
- **Autoverificación.** El front recalcula cada operación con los datos mostrados y la compara con el valor del motor. Si difieren, muestra la diferencia en pesos.
- **Prueba masiva.** 1.000 reportes al azar (ceros, negativos, datos faltantes, un solo año, sin propiedades): ninguna salida puede contener valores rotos y cada frase debe salir de su plantilla.

### Dónde vive cada cálculo

| Parte del Diagnóstico Base | Dónde corre | Ticket |
| --- | --- | --- |
| Indicadores de renta e impuesto | Motor | CAL-02 y CAL-03 |
| Tramo de Global Complementario | Motor | CAL-06 |
| Credit Capacity con parámetros por defecto | Motor | CAL-04 |
| Simulación con tasa y plazo que elige el usuario | Front | WEB-06 |
| Propiedades y análisis inmobiliario | Motor (hoy en el front, `src/lib/patrimonio.ts`) | CAL-07 |
| Definiciones, operación dibujada, estados y autoverificación | Front (`src/lib/calculos.ts`) | WEB-07 |
| Controles de datos (avalúo = afecto + exento, total de orígenes) | Motor | CAL-05 |
| Cobertura por fuente | Motor | API-05 |

### Parámetros (tabla editable y versionada)

Nada que cambie con el tiempo queda fijo en el código. Todos viajan en `method` dentro del reporte.

| Parámetro | Valor inicial | Estado |
| --- | --- | --- |
| Códigos que se restan y se suman en la RFB | Restan 955 y 152; suma 494 | Por confirmar |
| Regla del factor de renta neta | 0,90 bajo 15% de tasa efectiva; 0,80 desde 15% | Por confirmar |
| Rangos del tramo Art. 55 bis | A hasta 90 UTA, B hasta 150, C sobre 150 | Por confirmar |
| Tramos de Global Complementario | Tabla oficial por año, en UTA | Cargar por AT y validar |
| UTA por año | Diciembre del mismo año del AT | Por confirmar |
| UF de referencia | 31 de diciembre del año comercial | Por confirmar |
| Factor hipotecario y automotriz | 0,25 y 0,07 | Capítulo IV |
| Tasa y plazo hipotecario de referencia | 4% anual a 30 años | Por confirmar si son los de producción |
| Factores leverage a mostrar | 1 a 4 | Por confirmar: el caso solo muestra 2 y 3 |
| Factor de terreno y vida útil | 0,17 y 192 meses | Por determinar: no reproducen el valor depreciable |
| Capital del asiento de apertura | $10.000.000 | Por confirmar de dónde sale |
| Tolerancia de la prueba dorada | ±10 pesos | Hasta aclarar la diferencia de la RFB |

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
8. El cliente queda registrado para la vista Propietarios.

**Tablas mínimas:** `app_user`, `consent`, `taxpayer`, `source_run`, `raw_artifact`, `tax_return`, `declared_field`, `property`, `economic_activity`, `derived_value`, `parameter`.

**Reglas de diseño**

- El conector no calcula y el motor no sabe nada del SII. La extracción queda desacoplada del front para que las vistas evolucionen sin rehacer los extractores.
- Si una fuente falla, el run termina en `PARTIAL` y el reporte la marca como fallida. No se presenta un diagnóstico incompleto como completo.
- El reporte de un cliente solo puede leerlo quien inició el run o un usuario interno autorizado.

## Plan día a día

Tres frentes en paralelo. El motor no espera al scraper porque parte con la prueba dorada, y el front no espera al backend porque ya funciona contra la API simulada.

| Día | Conectores | Motor y API | Front | Entregable del día |
| --- | --- | --- | --- | --- |
| 1 | Login SII con RUT de prueba; confirmar las rutas del traspaso y el formato de cada fuente | Esquema de base de datos, parámetros, carga de la prueba dorada | Cliente HTTP con respaldo al mock; registro de usuario | Login funcionando y front navegable contra la API |
| 2 | Conector y parser F22 compacto (4 a 5 AT), con rebajas | Motor de indicadores, tramo y capacidad de crédito con la prueba dorada pasando; endpoints de consentimiento y run | Conexión y extracción contra la API real | F22 real en base de datos y run visible en pantalla |
| 3 | Conectores y parsers F29 y F50 | Endpoint de reporte: F22, cálculos, `method` y cobertura | Diagnóstico Base con datos reales de F22 | Primer diagnóstico real, sin propiedades |
| 4 | Conector y parser de bienes raíces (enajenación, pago al contado y financiamiento); datos del contribuyente, sociedades, regímenes y timbrajes | Cálculos de propiedades; reporte completo; estados terminales y errores | Propiedades, declaraciones mensuales y PDF con datos reales | Diagnóstico Base completo de un RUT real |
| 5 | Sesión vencida, período sin declaración, CAPTCHA, timeout | Listado de propietarios; prueba con 3 a 5 RUT reales | Vista Propietarios con datos reales; revisión de estados de falla y móvil | Demo a Ricardo |

Si el equipo es de dos personas, el frente de front se reparte entre los días 1 y 4, porque es el que menos trabajo nuevo tiene. El detalle de enajenación, pago al contado y financiamiento de bienes raíces es lo más incierto de la semana: depende de lo que entregue el SII en "Mis Bienes".

### Tickets para Linear

**Conectores**

- [ ] SII-01 Login SII con sesión efímera y detección de CAPTCHA y MFA
- [ ] SII-02 Confirmar rutas del traspaso y formato por fuente
- [ ] SII-03 Conector y parser F22 compacto, con regla de código ausente y signo; incluye las rebajas a la renta
- [ ] SII-04 Conector y parser F29
- [ ] SII-05 Conector y parser F50
- [ ] SII-06 Conector y parser de bienes raíces: identificación, avalúo, enajenación, pago al contado y financiamiento
- [ ] SII-07 Datos del contribuyente: fecha de nacimiento, inicio de actividades y actividades económicas
- [ ] SII-08 Almacenamiento de evidencia cruda con hash
- [ ] SII-09 Sociedades, regímenes tributarios y timbrajes

**Motor y API**

- [ ] CAL-01 Esquema de base de datos (crudo, normalizado, derivado) y tabla de parámetros por período
- [ ] CAL-02 Motor de cálculo: renta e impuesto, con el estado de cada cálculo
- [ ] CAL-03 Pruebas doradas: caso Carlos Díaz (AT 2022–2025) y caso real anonimizado de 5 años
- [ ] CAL-04 Credit Capacity: PV, conversión a UF y factor leverage, con sus controles
- [ ] CAL-05 Controles de datos: avalúo total = afecto + exento y total de orígenes contra la suma de códigos
- [ ] CAL-06 Tramo de Global Complementario con tabla oficial por año
- [ ] CAL-07 Propiedades: activos, patrimonio y pasivos en UF, Ley 20.455, asiento de apertura, por institución y por comuna
- [ ] CAL-08 Completar los cálculos "por determinar" cuando llegue la fórmula: valor depreciable, monto IVA, estado de resultados, leverage por institución
- [ ] API-01 Registro de usuario y consentimiento: crear y revocar
- [ ] API-02 Run: crear, consultar estado y cancelar
- [ ] API-03 Reporte con el contrato del front
- [ ] API-04 Errores en formato problem+json y control de acceso al reporte
- [ ] API-05 Cobertura por fuente y estado `PARTIAL`
- [ ] API-06 Trazabilidad: cada valor derivado guarda los datos normalizados que usó
- [ ] API-07 Listado de propietarios

**Front**

- [ ] WEB-01 Registro de usuario antes de la conexión
- [ ] WEB-02 Cliente HTTP en `src/lib/api.ts`, con la API simulada como respaldo para demos
- [ ] WEB-03 Diagnóstico Base con datos reales: valores no capturados, cobertura y estados vacíos
- [ ] WEB-04 Propiedades calculadas por el motor en lugar del front
- [ ] WEB-05 Revisar las pantallas de falla con respuestas reales del backend
- [ ] WEB-06 Simulador de crédito con parámetros por defecto tomados del reporte
- [ ] WEB-07 Registro de cálculos contra el reporte real: estados, autoverificación y enlaces de trazabilidad
- [ ] WEB-08 PDF: revisar el informe impreso con datos reales
- [ ] WEB-09 Vista Propietarios conectada al listado real

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
- [ ] Confirmar dónde corre el servicio y con qué IP sale, para no gatillar bloqueos del SII.

**Riesgo principal:** que el SII exija CAPTCHA o segundo factor en el login. Si ocurre, el plan B es un flujo asistido en el que el cliente inicia sesión y el sistema continúa con su sesión, sin evadir el control.

## Pendientes del método para Ricardo

Es la misma lista que el informe muestra en su sección "Pendientes del método".

**Por confirmar** (hoy se calcula con una regla deducida de los casos)

- [ ] Base imponible: orígenes − rebajas da el código 170 en 4 de 5 años del informe real. ¿Qué explica la diferencia de $1.252.199 en AT 2022?
- [ ] Renta financiera bruta: ¿la fórmula es total de orígenes − 955 − 152 + 494? ¿De dónde salen los 5 a 10 pesos de diferencia?
- [ ] Factor de renta neta: ¿la regla es 0,90 bajo 15% de tasa efectiva y 0,80 desde 15%?
- [ ] UTA: ¿se usa la de diciembre del mismo año del AT?
- [ ] Tramo Art. 55 bis: ¿los rangos son A hasta 90 UTA, B hasta 150 y C sobre 150?
- [ ] Tramo de Global Complementario: validar la tabla oficial de cada año.
- [ ] Credit Capacity: tasa, plazo y fecha de la UF que se usan por defecto.
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

- **P1:** estadísticas agregadas de clientes, distribución por tramo, análisis por banco y geográfico, segmentación por arquetipos.
- **P2:** hallazgos, mesa de trabajo con el agente, párrafos generativos y vista comercial para instituciones financieras. El front del agente ya existe y está visible como "Próximamente"; falta conectarlo a datos reales y a un modelo.
