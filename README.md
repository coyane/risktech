# Risktech · CEFT

Prototipo React del agente CEFT (diagnóstico tributario / Método ICRED). Todo corre en el navegador con datos de ejemplo: no hay backend ni se consulta el SII.

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
| `docs/decisions/` | Decisiones costosas de revertir |
| `design-system/risktech-ceft/` | Reglas visuales por página |

## Rutas

| Ruta | Acceso | Contenido |
| --- | --- | --- |
| `/` | público | Login demo con clave tributaria |
| `/diagnostico` | sesión | Avance de la captura y, al terminar, el Diagnóstico Base. El fragmento elige la vista: `#resumen`, `#calculos`, `#calc-tasa-efectiva`, `#credito`, `#datos-propiedades`, `#origenes-104`, `#pendientes`, `#glosario` |
| `/analisis` | sesión | Hallazgos del agente, marcado como "Próximamente" |
| `/analisis/hallazgo/:id` | sesión | Mesa de trabajo de un hallazgo: origen, preguntas al agente y casos de uso |
| `/admin` | rol admin | Propietarios del portafolio |
| `/admin/radiografia` | rol admin | Composición del portafolio |
| `/admin/agente` | rol admin | Agente del portafolio |

## Diagnóstico Base

Es la vista principal de la fase 1: muestra los datos obtenidos del SII y los cálculos del método sobre esos datos. **No interpreta**: no hay semáforo, evaluaciones ni texto generado. Dos personas con las mismas cifras reciben el mismo informe.

- **Pantalla y PDF son dos presentaciones del mismo contenido.** En pantalla el informe se recorre por vistas (Resumen, Cálculos, Crédito, Datos del SII, Pendientes, Glosario); no hay una página larga. En Crédito, la persona escribe la tasa y el plazo del Credit Capacity y todo el informe se recalcula. En Cálculos, todos se ven como bloques agrupados y la explicación de uno queda siempre abierta al lado; presionar otro bloque la cambia. En pantallas angostas la explicación se desliza sobre los bloques al elegir uno. El PDF imprime todo, en el mismo orden. `src/lib/reportViews.ts` traduce el fragmento de la URL a la vista y `src/components/diagnostico/CalcExplorer.tsx` tiene los bloques y el panel de explicación.
- `src/lib/calculos.ts` es el registro único de cálculos. Cada uno es una función pura con una pregunta, un nombre técnico, una definición fija, una sola plantilla de frase "en simple", su operación con los datos usados y sus dependencias. La pantalla solo recorre el registro.
- Cada cálculo lleva uno de tres estados: **Calculado** (la fórmula está en un documento del método y cuadra con los casos), **Por confirmar** (la fórmula se dedujo de los casos o usa un parámetro supuesto) y **Por determinar** (falta la fórmula o el dato; la sección aparece igual, con los datos que sí se tienen y lo que falta).
- Cada dato de una operación es de uno de tres tipos, siempre con etiqueta: **Dato del SII** (formulario, código, año y folio), **Parámetro del método** y **Resultado calculado**. Las fichas enlazan a su fila de origen o al cálculo que las produce, y las tablas del SII indican en qué cálculos se usa cada código.
- El front recalcula cada operación y la compara con el valor del motor. Si difieren, muestra una frase fija con la diferencia.
- Los casos especiales son un conjunto cerrado de frases (`FIXED` en el registro): dato no capturado, sin declaración ese año, sin propiedades, división por cero.
- `src/lib/patrimonio.ts` suma las propiedades (enajenación y pago al contado en UF, Ley 20.455, por institución, comuna y destino) y `src/lib/timeline.ts` ordena por fecha los hechos que ya están en el reporte.
- El PDF se genera con la impresión del navegador ("Descargar PDF"); los estilos están al final de `src/index.css`.
- El sistema de diseño está en `design-system/risktech-ceft/` (generado con la skill ui-ux-pro-max).

`npm test` corre tres grupos de pruebas sobre el registro: el caso del Capítulo IV, un caso real de cinco años (anonimizado: solo cifras por código y año) y 1.000 reportes generados al azar, en los que ninguna salida puede contener valores rotos y cada frase debe salir de su plantilla.

Los hallazgos y la mesa de trabajo con el agente no son parte de la fase 1, pero siguen completos y visibles en el menú con la etiqueta "Próximamente". No se ocultan ni se eliminan.

## Modo demo

- El login valida el formato y el dígito verificador del RUT, pero no envía credenciales: se usa el caso embebido en `src/data/demo.json`. Cualquier RUT válido sirve (por ejemplo `12.345.678-5`).
- La sesión y el rol (`src/context/SessionProvider.tsx`) solo ordenan la navegación. **No son autenticación**: el control de acceso real debe resolverlo el backend.
- La corrida, la sesión y las conversaciones con el agente se guardan en `sessionStorage`, así que sobreviven a una recarga pero no al cierre de la pestaña.
- El agente no está conectado a un modelo: responde con guiones por hallazgo y lo dice cuando una pregunta no tiene guion. La descarga genera un CSV y el PDF usa la impresión del navegador.

## Datos de ejemplo

`src/data/demo.json` reproduce el caso del Capítulo IV (Carlos Díaz, AT 2022–2025): los 14 códigos de orígenes de renta, la base imponible, el análisis financiero, las contingencias de los Art. 53 y 97 y los totales de propiedades en UF. El total de rebajas de cada año es la diferencia entre los orígenes y la base imponible del caso. Son **ilustrativos** (no vienen del documento) los folios, el desglose de las rebajas, el detalle de bienes raíces por rol (que suma los totales del caso), la sociedad, el régimen tributario, los períodos del F29 y la tabla de tramos.

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

## Estructura

- `src/lib/api.ts` — API simulada (`createConsent`, `createRun`, `getRun`, `cancelRun`, `getReport`); es el punto a reemplazar por el backend.
- `src/lib/calculos.ts` — registro de cálculos del Diagnóstico Base.
- `src/lib/icred.ts` — valor presente de la capacidad de crédito y alertas del método (las alertas solo se usan en la sección del agente).
- `src/context/` — sesión, corrida (polling y carga del reporte) y conversaciones por hallazgo.
- `src/data/insightPlaybooks.ts` — guiones del agente por hallazgo: origen, preguntas, simulaciones y casos de uso. Las cifras se calculan desde el reporte; el texto es fijo.
- `src/styles/` — estilos por área; `src/index.css` los importa en el orden de la cascada.
- `e2e/` — pruebas de interfaz con Playwright.
- `src/components/` — shells y piezas compartidas; `diagnostico/` tiene las piezas del informe (fichas, ecuación, bloque de cálculo, explorador de cálculos, cascada, tablas del SII).
- `src/pages/` — pantallas del cliente y de administración.

## Despliegue

Es una SPA con `BrowserRouter`: el hosting debe servir `index.html` para cualquier ruta. `vercel.json` ya incluye esa regla para Vercel.
