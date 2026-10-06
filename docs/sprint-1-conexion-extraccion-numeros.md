# Sprint 1 — Conexión SII, extracción y Números

6 de octubre de 2026 · Cristóbal Oyanedel

En 5 días hábiles el cliente debe poder ingresar con su RUT y clave tributaria, ver cómo el sistema extrae sus fuentes desde el SII y llegar a la sección Números con sus datos reales. Esta es la fase 1 del proyecto: el agente y los hallazgos quedan fuera.

## Alcance de la fase 1

El recorrido tiene tres pantallas, y las tres ya existen en el front con datos de ejemplo. El trabajo de la semana es construir lo que hay detrás y conectarlo.

| Pantalla | Qué hace el usuario | Qué falta construir |
| --- | --- | --- |
| Conexión | Ingresa RUT y clave, autoriza la consulta | Consentimiento, sesión efímera con el SII, creación del run |
| Extracción | Ve el avance fuente por fuente y puede cancelar | Conectores, parsers, estados del run, evidencia cruda |
| Números | Revisa tablas, gráficos y cobertura; descarga | Motor de cálculo y reporte con el contrato que ya usa el front |

| Entra | Queda fuera |
| --- | --- |
| Login SII con RUT y clave tributaria, en sesión efímera | Agente, hallazgos, preguntas y casos de uso |
| Consentimiento con finalidad, fuentes, vigencia y revocación | Resumen del análisis, KPI y alertas del método |
| F22: últimos 4 AT, declaración vigente | Consola de administración y portafolio |
| F29 y F50: últimos 24 períodos | Declaraciones juradas, RCV, DTE, balance tributario |
| Bienes raíces y actividades económicas | Contingencias Art. 53 y 97 (dependen de un dato que no viene del SII) |
| Cálculos del Capítulo IV con parámetros configurables | Enajenación, pago contado y deuda por banco |
| Sección Números completa con datos reales | Historial de rectificatorias, modelo bitemporal, WORM, SIEM |
| Cobertura por fuente y estados de falla visibles | Evasión de CAPTCHA o MFA (si aparece, el run se detiene) |

**Criterio de terminado**

1. Con los códigos del caso Carlos Díaz (AT 2022–2025), el motor reproduce la tabla “Análisis financiero” del Capítulo IV con tolerancia de ±10 pesos.
2. Con un RUT real de prueba, el recorrido completo de conexión a Números toma menos de 10 minutos y todas las secciones muestran datos de esa captura.
3. Una clave errónea, un CAPTCHA o una fuente caída terminan en su estado propio y la pantalla lo explica.
4. La clave tributaria no queda en disco, logs ni respuestas de la API.

## Lo que ya existe

El front (React + Vite) está construido y funciona contra una API simulada en `src/lib/api.ts`. Ese archivo es el único punto que se reemplaza: las pantallas no cambian si el backend respeta el contrato.

- **Conexión:** valida el dígito verificador, pide consentimiento y envía el RUT sin puntos con el DV separado.
- **Extracción:** muestra los pasos, la bitácora, el botón de cancelar y una pantalla por cada estado terminal.
- **Números:** cobertura por fuente, gráficos, las tablas del Capítulo IV, simulador de capacidad de crédito, bienes raíces, F29 y F50, descarga CSV e impresión a PDF.
- **Escenarios de prueba:** `?demo=captcha|mfa|clave|parcial|fallo|error` en el login simula cada estado sin tocar el SII.

## Fuentes y datos a extraer

Cada formulario se captura completo como pares código–monto, aunque Números use solo una parte. Así no hay que volver a extraer cuando se agregue un código.

| Fuente | Período | Qué se extrae | Dónde se ve en Números |
| --- | --- | --- | --- |
| F22 | Últimos 4 AT | Todos los códigos y montos, folio, fecha, tipo de declaración | Orígenes de renta, base imponible IGC, análisis financiero |
| F29 | Últimos 24 meses | Todos los códigos y montos, folio, fecha, tipo, estado de pago | Tabla F29 |
| F50 | Últimos 24 meses | Todos los códigos y montos, folio, fecha | Columna “Total F50” |
| Bienes raíces | Vigente | Rol, comuna, dirección, destino, superficies, avalúo total, afecto y exento, contribución | Radiografía patrimonial |
| Actividades económicas | Vigente | Código, glosa, categoría, fecha de inicio | Tabla de actividades |

**Códigos F22 que usa Números**

- Orígenes de renta: 104, 105, 106, 108, 955, 1632, 155, 152, 1032, 1891, 1104, 749, 161, 110.
- Base imponible IGC: 170 y 157.
- Ajustes del método (se muestran, aún no se calculan): 158, 494, 465, 750, 765.

**Reglas de datos**

- Un valor que la fuente no informa viaja como `null` y se muestra como raya. Nunca se rellena con cero.
- Montos como enteros en CLP, RUT sin puntos y DV separado, fechas en ISO-8601.
- Se guarda el HTML o PDF original de cada captura con su hash SHA-256.

## Contrato de API

Es el que ya consume el front. Los tipos completos están en `src/types.ts`.

| Endpoint | Método | Para qué |
| --- | --- | --- |
| `/v1/consents` | POST | Registrar la autorización antes de crear el run |
| `/v1/consents/{id}` | DELETE | Revocar la autorización |
| `/v1/runs` | POST | Iniciar la captura con RUT, DV, clave, `consentId`, fuentes e `idempotencyKey` |
| `/v1/runs/{id}` | GET | Estado, avance, pasos, bitácora y `correlationId` (el front consulta cada 1 segundo) |
| `/v1/runs/{id}/cancel` | POST | Cancelar una captura en curso |
| `/v1/runs/{id}/report` | GET | Reporte para Números |

**Estados del run.** `RUNNING` agrupa los estados intermedios. Los terminales son `COMPLETED`, `PARTIAL`, `BLOCKED_CAPTCHA`, `BLOCKED_MFA`, `AUTH_FAILED`, `SOURCE_CHANGED`, `QUARANTINED`, `CANCELLED`, `EXPIRED` y `FAILED`.

**Pasos que muestra la pantalla de extracción.** `LOGIN`, `F22`, `F29`, `F50`, `BIENES_RAICES` (incluye actividades) y `CALCULO`, cada uno en estado `queued`, `running`, `done` o `error`.

**Errores.** Formato `application/problem+json` con `code`, `detail`, `correlation_id` y `retryable`. El front solo ofrece reintentar cuando `retryable` es verdadero. Nunca se devuelve HTML del SII ni la clave.

**Reporte para la fase 1**

| Campo | Contenido | Fase 1 |
| --- | --- | --- |
| `taxpayer` | RUT, nombre, fecha de captura y cobertura por fuente (estado, obtenido, faltante, nota) | Sí |
| `years`, `incomeOrigins`, `igcBase` | Años tributarios y códigos del F22 | Sí |
| `f22Returns` | Folio, fecha y tipo de cada declaración | Sí |
| `financial` | Indicadores calculados por año | Sí |
| `method` | Versión de reglas, UF, factores, parámetros con su estado, fórmulas y códigos de ajuste | Sí |
| `activities`, `properties`, `f29`, `f50` | Datos de las demás fuentes | Sí |
| `patrimony`, `contingency` | Deuda, enajenación y contingencias | `null`: el front oculta esas partes |
| `summary`, `kpis`, `insights`, `recommendations` | Contenido del agente | Vacíos |

## Cálculos del Capítulo IV

Se implementa lo que reproduce la tabla “Análisis financiero” del caso, porque es lo único verificable al peso. Lo que no está definido queda como parámetro, con el valor que cuadra el caso.

| Indicador | Fórmula | Control AT 2025 |
| --- | --- | --- |
| Total orígenes de renta | Suma de los 14 códigos | 104.832.677 |
| Tasa efectiva de tributación | 157 / 170 | 16,0% |
| Renta financiera bruta (RFB) | Total orígenes − códigos excluidos | 81.700.093 |
| Renta financiera neta (RFN) | RFB × factor RFN del año | 65.360.074 |
| RFN promedio mensual | RFN / 12 | 5.446.673 |
| BIT IGC en UTA | 170 / UTA del año | 119,0 |
| Tramo Art. 55 bis | Rango de la BIT en UTA | B |
| Límite crédito hipotecario | RFN mensual × 0,25 | 1.361.668 |
| Límite crédito automotriz | RFN mensual × 0,07 | 381.267 |

### Capacidad de crédito (Credit Capacity)

Se calcula a partir del límite hipotecario del último año tributario. No depende de ninguna fuente adicional.

| Cálculo | Fórmula | Control del caso |
| --- | --- | --- |
| Capacidad de endeudamiento personal | PV = PMT × (1 − (1 + i)^−n) / i, con PMT = límite hipotecario, i = tasa anual / 12 y n = meses | $285.216.668 con 4% anual a 30 años |
| Capacidad en UF | PV / UF de referencia | UF 7.424 (UF 38.416,69 al 31-12-2024) |
| Factor leverage | PV × factor | Factor 2: UF 14.849 · Factor 3: UF 22.273 |
| Monto automotriz | PV con PMT = límite automotriz y n = 48 meses | Sin control: el Capítulo IV no fija la tasa |

El motor calcula estos valores con los parámetros por defecto y los cubre la prueba dorada. El front repite la misma fórmula solo para el simulador, donde el usuario cambia tasa y plazo; hoy vive en `src/lib/icred.ts` y no tiene pruebas.

### Dónde vive cada cálculo de Números

| Sección de Números | Cálculo | Dónde corre | Ticket |
| --- | --- | --- | --- |
| Orígenes de renta | Total por año | Motor | CAL-02 |
| Gráficos | Sin cálculo propio: usan orígenes, RFN y tasa efectiva | Front | WEB-04 |
| Base imponible IGC | Sin cálculo: códigos 170 y 157 | — | SII-03 |
| Análisis financiero | Los 9 indicadores | Motor | CAL-02 y CAL-03 |
| Capacidad de crédito | PV, conversión a UF y factor leverage con parámetros por defecto | Motor | CAL-04 |
| Capacidad de crédito | Simulación con tasa y plazo que elige el usuario | Front | WEB-06 |
| Radiografía patrimonial | Totales de avalúo y contribuciones, conteo por destino y comuna | Front | WEB-04 |
| Radiografía patrimonial | Control avalúo total = afecto + exento | Motor | CAL-05 |
| F29 y F50 | Sin cálculo: resumen por período | — | SII-04 y SII-05 |
| Fuentes y cobertura | Estado, obtenido y faltante por fuente | Motor | API-05 |

**Parámetros (tabla editable y versionada)**

| Parámetro | Valor inicial | Estado |
| --- | --- | --- |
| Códigos excluidos de la RFB | 955 y 152 | Pendiente Ricardo |
| Factor RFN | 0,90 hasta AT 2024; 0,80 en AT 2025 | Pendiente Ricardo: regla que lo define |
| Rangos del tramo Art. 55 bis | Por definir (el caso da A bajo 90 UTA y B sobre 90) | Pendiente Ricardo |
| UTA por AT | Valores oficiales SII | Cargar el día 1 y contrastar con la BIT del caso |
| UF de referencia | Valor del día de captura | Pendiente Ricardo: el caso usa la del 31 de diciembre del año comercial |
| Factor hipotecario y automotriz | 0,25 y 0,07 | Confirmados en el Capítulo IV |
| Tasa y plazo hipotecario de referencia | 4% anual a 30 años | Valores del caso; confirmar si son los de producción |
| Plazo automotriz de referencia | 48 meses | Confirmado en el Capítulo IV; falta la tasa |
| Factores leverage a mostrar | 1 a 4 | Pendiente Ricardo: el caso solo muestra 2 y 3 |
| Tolerancia de la prueba dorada | ±10 pesos | Hasta aclarar la diferencia de la RFB |

Cada parámetro viaja en el reporte con su estado. Números marca como “por validar” los indicadores que dependen de uno pendiente.

## Arquitectura mínima

Un servicio, una base de datos y un almacenamiento de archivos. Los nombres siguen el ERS para que la fase 2 crezca sobre esto.

**Stack propuesto:** Python 3.12, Playwright (Chromium headless), FastAPI, PostgreSQL con JSONB y almacenamiento de objetos para la evidencia cruda.

**Flujo de un run**

1. El front registra el consentimiento y crea el run. La clave vive solo en memoria mientras dura la captura.
2. El conector abre sesión en el SII. Si aparece CAPTCHA o MFA, el run termina en su estado de bloqueo.
3. Un conector por fuente navega y descarga. Cada paso actualiza el estado que consulta el front.
4. Se guarda el HTML o PDF crudo con su hash.
5. Un parser por fuente lo convierte a pares código–monto.
6. El motor de cálculo lee códigos y parámetros y produce los indicadores.
7. El reporte queda disponible y el front lleva al usuario a Números.

**Tablas mínimas:** `consent`, `taxpayer`, `source_run`, `raw_artifact`, `tax_return`, `declared_field`, `property`, `economic_activity`, `parameter`.

**Reglas de diseño**

- El conector no calcula y el motor no sabe nada del SII. Si cambia el portal se toca solo el conector; si cambia una fórmula, solo el motor o la tabla de parámetros.
- Si una fuente falla, el run termina en `PARTIAL` y el reporte la marca como fallida. No se presenta un análisis incompleto como completo.
- El reporte solo puede leerlo quien inició el run: se entrega un token de sesión atado a ese run.

## Plan día a día

Tres frentes en paralelo. El motor no espera al scraper porque parte con la prueba dorada, y el front no espera al backend porque ya funciona contra la API simulada.

| Día | Conectores | Motor y API | Front | Entregable del día |
| --- | --- | --- | --- | --- |
| 1 | Login SII con RUT de prueba; mapa de rutas y formato por fuente | Esquema de base de datos, parámetros, carga de la prueba dorada | Apagar agente y hallazgos tras una bandera; cliente HTTP con respaldo al mock | Login funcionando y front de fase 1 navegable |
| 2 | Conector y parser F22 (4 AT) | Motor de los 9 indicadores y de capacidad de crédito con la prueba dorada pasando; endpoints de consentimiento y run | Conexión y extracción contra la API real | F22 real en base de datos y run visible en pantalla |
| 3 | Conectores y parsers F29 y F50 | Endpoint de reporte: F22, cálculos, `method` y cobertura | Números con datos reales de F22; pruebas del simulador | Primer recorrido completo con F22 |
| 4 | Conector y parser de bienes raíces y actividades | Reporte completo; estados terminales y errores con su formato | Tablas de F29, F50, bienes raíces y actividades con datos reales | Números completo de un RUT real |
| 5 | Sesión vencida, período sin declaración, CAPTCHA, timeout | Prueba con 3 a 5 RUT reales; ajuste de parsers | Revisión de estados de falla, móvil y descargas | Demo a Ricardo |

Si el equipo es de dos personas, el frente de front se reparte entre los días 1 y 4, porque es el que menos trabajo nuevo tiene.

### Tickets para Linear

**Conectores**

- [ ] SII-01 Login SII con sesión efímera y detección de CAPTCHA y MFA
- [ ] SII-02 Mapa de rutas y formato por fuente
- [ ] SII-03 Conector y parser F22
- [ ] SII-04 Conector y parser F29
- [ ] SII-05 Conector y parser F50
- [ ] SII-06 Conector y parser de bienes raíces
- [ ] SII-07 Conector y parser de actividades económicas
- [ ] SII-08 Almacenamiento de evidencia cruda con hash

**Motor y API**

- [ ] CAL-01 Esquema de base de datos y tabla de parámetros
- [ ] CAL-02 Motor de cálculo del Capítulo IV
- [ ] CAL-03 Prueba dorada del caso Carlos Díaz: tabla “Análisis financiero” AT 2022–2025
- [ ] CAL-04 Capacidad de crédito: PV, conversión a UF, factor leverage y monto automotriz, con sus controles en la prueba dorada
- [ ] CAL-05 Controles de datos: avalúo total = afecto + exento y total de orígenes contra la suma de códigos
- [ ] API-01 Consentimiento: crear y revocar
- [ ] API-02 Run: crear, consultar estado y cancelar
- [ ] API-03 Reporte con el contrato del front
- [ ] API-04 Errores en formato problem+json y token de sesión por run
- [ ] API-05 Cobertura por fuente y estado `PARTIAL`

**Front**

- [ ] WEB-01 Bandera de fase 1: ocultar agente, hallazgos y administración
- [ ] WEB-02 Cliente HTTP en `src/lib/api.ts`, con la API simulada como respaldo para demos
- [ ] WEB-03 Al completar la captura, llevar al usuario a Números
- [ ] WEB-04 Validar Números con datos reales: valores nulos, cobertura y estados vacíos
- [ ] WEB-05 Revisar las pantallas de falla con respuestas reales del backend
- [ ] WEB-06 Simulador de capacidad de crédito: pruebas de la fórmula contra el caso y parámetros por defecto tomados del reporte

**Operación**

- [ ] OPS-01 Manejo de errores y estados del run
- [ ] OPS-02 Verificar que la clave no queda en logs ni en disco
- [ ] OPS-03 Prueba con RUT reales y demo

## Bloqueantes para el día 1

Sin los dos primeros puntos el sprint no parte. Los demás se resuelven durante la semana sin detener el desarrollo.

- [ ] **RUT de prueba con clave tributaria y consentimiento firmado.** Idealmente 3 a 5: uno con arriendos, uno con honorarios y uno con empresa.
- [ ] **ERS de BICRED y cualquier avance del scraper existente.** Si ya hay rutas o selectores mapeados, el día 1 se acorta.
- [ ] Ricardo responde la regla del factor RFN y los códigos excluidos de la RFB. Mientras tanto se usan los valores que cuadran el caso.
- [ ] Ricardo entrega los rangos del tramo Art. 55 bis.
- [ ] Ricardo confirma los parámetros de capacidad de crédito: tasa y plazo de referencia, fecha de la UF y factores leverage a mostrar.
- [ ] Confirmar qué códigos del F29 alimentan el resumen mensual (débitos, créditos, IVA, remanente, PPM y retenciones).
- [ ] Confirmar dónde corre el servicio y con qué IP sale, para no gatillar bloqueos del SII.

**Riesgo principal:** que el SII exija CAPTCHA o segundo factor en el login. Si ocurre, el plan B es un flujo asistido en el que el cliente inicia sesión y el sistema continúa con su sesión, sin evadir el control.

## Qué sigue después

La fase 2 retoma lo que este sprint deja apagado: los hallazgos, la mesa de trabajo con el agente y la consola de administración. El front de esas partes ya existe y queda detrás de la bandera de fase 1.
