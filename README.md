# Innovacred

Prototipo React de Innovacred, un diagnóstico tributario y crediticio (sigue el Método ICRED, que la interfaz no nombra). Todo corre en el navegador con datos de ejemplo: no hay backend ni se consulta el SII.

## Scripts

```bash
npm install
npm run dev        # servidor de desarrollo
npm run verify     # tipos, lint, pruebas del registro de cálculos y build
npm run test:ui    # recorrido en Chrome a 1440 y 375 px (usa el Chrome instalado)
npm run verify:ui  # los dos anteriores, en orden
```

`npm run verify` encadena `typecheck`, `lint`, `test` y `build`, que también se pueden correr por separado.

## Documentación

| Documento | Contenido |
| --- | --- |
| `AGENTS.md` | Instrucciones para agentes de código; `CLAUDE.md` lo importa |
| `docs/product.md` | Qué es el producto, para quién y sus reglas |
| `docs/ui.md` | Cómo está construida la interfaz y cómo extenderla |
| `docs/sprint-1-v2-diagnostico-base-y-backoffice.md` | Plan vigente, fórmulas y pendientes del método |
| `docs/sprint-2-formulas-del-metodo.md` | Catálogo exacto de fórmulas, su fuente y su revisión por Ricardo |
| `docs/decisions/` | Decisiones costosas de revertir |
| `design-system/risktech-ceft/` | Reglas visuales por página |

## Rutas

| Ruta | Acceso | Contenido |
| --- | --- | --- |
| `/` | público | Login demo con clave tributaria |
| `/diagnostico` | sesión | Avance de la captura y, al terminar, el Diagnóstico Base. El fragmento elige la vista: `#resumen`, `#calculos`, `#calc-tasa-efectiva`, `#credito`, `#datos-propiedades`, `#origenes-104`, `#pendientes`, `#glosario`, `#deudas` (informe de deudas de la CMF, opcional) |
| `/analisis` | sesión | Hallazgos del agente, marcado como "Próximamente" |
| `/analisis/hallazgo/:id` | sesión | Mesa de trabajo de un hallazgo: origen, preguntas al agente y casos de uso |
| `/admin` | rol admin | Propietarios del portafolio |
| `/admin/radiografia` | rol admin | Composición del portafolio |
| `/admin/agente` | rol admin | Agente del portafolio |

## Diagnóstico Base

Es la vista principal de la fase 1: muestra los datos obtenidos del SII y los cálculos que se hacen con esos datos. La interfaz habla del cálculo y de su origen; no nombra el método que sigue. **No interpreta**: no hay semáforo, evaluaciones ni texto generado. Dos personas con las mismas cifras reciben el mismo informe.

- **Pantalla y PDF son dos presentaciones del mismo contenido.** En pantalla el informe es un panel por vistas (Resumen, Cálculos, Crédito, Propiedades, Datos del SII, Pendientes, Glosario) con un menú lateral; no hay una página larga. La tasa y el plazo del Credit Capacity se escriben en Resumen o en Crédito y todo el informe se recalcula. En Cálculos, cada grupo muestra su índice y el cálculo abierto por niveles: la respuesta primero; la operación y el origen de cada dato, plegados. En pantallas angostas el cálculo se abre como hoja. El PDF imprime todo, con los cálculos abiertos. `src/lib/reportViews.ts` traduce el fragmento de la URL a la vista y `src/components/panel/` tiene las piezas del panel.
- `src/lib/calculos.ts` es el registro único de cálculos. Cada uno es una función pura con una pregunta, un nombre técnico, una definición fija, una sola plantilla de frase "en simple", su operación con los datos usados y sus dependencias. La pantalla solo recorre el registro.
- Cada cálculo lleva uno de tres estados: **Calculado** (la operación y sus datos están completos), **Por confirmar** (falta confirmar un dato o un supuesto) y **Por determinar** (falta un dato o la forma de calcularlo; la sección aparece igual, con los datos que sí se tienen y lo que falta).
- Cada dato de una operación es de uno de tres tipos, siempre con etiqueta: **Dato del SII** (formulario, código, año y folio), **Valor de referencia** y **Resultado calculado**. Los datos enlazan a su fila de origen o al cálculo que las produce, y las tablas del SII indican en qué cálculos se usa cada código.
- El front recalcula cada operación y la compara con el valor del motor. Si difieren, muestra una frase fija con la diferencia.
- Los casos especiales son un conjunto cerrado de frases (`FIXED` en el registro): dato no capturado, sin declaración ese año, sin propiedades, división por cero.
- `src/lib/patrimonio.ts` suma las propiedades (enajenación y pago al contado en UF, Ley 20.455, por institución, comuna y destino) y `src/lib/timeline.ts` ordena por fecha los hechos que ya están en el reporte.
- El PDF se genera con la impresión del navegador ("PDF" en la barra superior); los estilos están en `src/styles/print.css`.
- El sistema de diseño está en `design-system/risktech-ceft/` (generado con la skill ui-ux-pro-max).

`npm test` corre tres grupos de pruebas sobre el registro: el caso de ejemplo, un caso real de cinco años (anonimizado: solo cifras por código y año) y 1.000 reportes generados al azar, en los que ninguna salida puede contener valores rotos y cada frase debe salir de su plantilla.

Los hallazgos y la mesa de trabajo con el agente no son parte de la fase 1, pero siguen completos y visibles en el menú con la etiqueta "Próximamente". No se ocultan ni se eliminan.

## Modo demo

- El login valida el formato y el dígito verificador del RUT, pero no envía credenciales: se usa el caso embebido en `src/data/demo.json`. Cualquier RUT válido sirve (por ejemplo `12.345.678-5`).
- La sesión y el rol (`src/context/SessionProvider.tsx`) solo ordenan la navegación. **No son autenticación**: el control de acceso real debe resolverlo el backend.
- La corrida, la sesión y las conversaciones con el agente se guardan en `sessionStorage`, así que sobreviven a una recarga pero no al cierre de la pestaña.
- El agente no está conectado a un modelo: responde con guiones por hallazgo y lo dice cuando una pregunta no tiene guion. La descarga genera un CSV y el PDF usa la impresión del navegador.

## Datos de ejemplo

`src/data/demo.json` reproduce un caso de ejemplo del Método ICRED (Capítulo IV, AT 2022–2025): los 14 códigos de orígenes de renta, la base imponible, el análisis financiero, las contingencias de los Art. 53 y 97 y los totales de propiedades en UF. El total de rebajas de cada año es la diferencia entre los orígenes y la base imponible del caso. Son **ilustrativos** (no vienen del documento) los folios, el desglose de las rebajas, el detalle de bienes raíces por rol (que suma los totales del caso), la sociedad, el régimen tributario, los períodos del F29 y la tabla de tramos.

En los datos, `null` significa "no capturado" y se muestra como raya (—); `0` es un valor en cero. En un F22 capturado, un código ausente equivale a cero (regla del formulario compacto).

### Escenarios de captura

Agrega `?demo=<nombre>` a la URL del login para simular cada estado terminal del run:

| Parámetro | Estado | Qué muestra |
| --- | --- | --- |
| `captcha` / `mfa` | `BLOCKED_CAPTCHA` / `BLOCKED_MFA` | La captura se detiene sin evadir el control |
| `clave` | `AUTH_FAILED` | Credenciales rechazadas, sin reintento automático |
| `fallo` | `FAILED` | Error a mitad de la extracción |
| `parcial` | `PARTIAL` | Análisis sin bienes raíces, con la fuente marcada como fallida |
| `error` | error de API | Aviso con código, `correlation_id` y reintento |

### Escenarios de la verificación del informe de deudas

Con `?demo=<nombre>` (en el login o en cualquier dirección), la verificación por código QR termina así; sin parámetro, cualquier PDF queda verificado. Contrato en `docs/contrato-verificacion-informe-deudas.md`.

| Parámetro | Estado | Qué muestra |
| --- | --- | --- |
| `deuda-sin-qr` | `NO_QR` | Rechazo: el PDF no trae el código QR |
| `deuda-no-cmf` | `NOT_CMF` | Rechazo: el QR no es de la CMF |
| `deuda-no-coincide` | `MISMATCH` | Rechazo: el contenido no coincide |
| `deuda-servicio` | `SERVICE_ERROR` | El servicio no respondió; "Reintentar" termina verificado |

## Estructura

- `src/lib/api.ts` — API simulada (`createConsent`, `createRun`, `getRun`, `cancelRun`, `getReport`); es el punto a reemplazar por el backend.
- `src/lib/verificacionDeudas.ts` — verificación simulada del informe de deudas (`verifyDebtReport`, `getDebtVerification`, `cancelDebtVerification`).
- `src/lib/calculos.ts` — registro de cálculos del Diagnóstico Base.
- `src/lib/finanzas.ts` — valor presente de la capacidad de crédito y alertas que dependen de los códigos declarados (solo se usan en la sección del agente).
- `src/lib/variacion.ts` — variación entre años como dato neutro.
- `src/context/` — sesión, corrida (polling y carga del reporte) y conversaciones por hallazgo.
- `src/data/insightPlaybooks.ts` — guiones del agente por hallazgo: origen, preguntas, simulaciones y casos de uso. Las cifras se calculan desde el reporte; el texto es fijo.
- `src/styles/` — estilos por área; `src/index.css` los importa en el orden de la cascada.
- `e2e/` — pruebas de interfaz con Playwright.
- `src/components/` — marco (`ShellFrame`, `AppShell`, `AdminShell`), íconos y piezas compartidas; `panel/` tiene las piezas del panel (cifras, gráficos, cálculos por niveles) y `diagnostico/` las tablas del SII, el estado y la tabla por año.
- `src/pages/` — pantallas del cliente y de administración.

## Despliegue

Es una SPA con `BrowserRouter`: el hosting debe servir `index.html` para cualquier ruta. `vercel.json` ya incluye esa regla para Vercel.
