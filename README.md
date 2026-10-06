# Risktech · CEFT

Prototipo React del agente CEFT (diagnóstico tributario / Método ICRED). Todo corre en el navegador con datos de ejemplo: no hay backend ni se consulta el SII.

## Scripts

```bash
npm install
npm run dev        # servidor de desarrollo
npm run typecheck  # tsc -b
npm run lint       # oxlint
npm run build      # typecheck + build de producción
```

## Rutas

| Ruta | Acceso | Contenido |
| --- | --- | --- |
| `/` | público | Login demo con clave tributaria |
| `/analisis` | sesión | Avance del agente y, al terminar, el análisis de apertura |
| `/analisis/hallazgo/:id` | sesión | Mesa de trabajo de un hallazgo: origen, preguntas al agente y casos de uso |
| `/numeros` | sesión | Tablas y gráficos del Capítulo IV; admite anclas (`/numeros#base`) |
| `/admin` | rol admin | Clientes del portafolio |
| `/admin/radiografia` | rol admin | Composición del portafolio |
| `/admin/agente` | rol admin | Agente del portafolio |

## Modo demo

- El login valida el formato y el dígito verificador del RUT, pero no envía credenciales: se usa el caso embebido en `src/data/demo.json`. Cualquier RUT válido sirve (por ejemplo `12.345.678-5`).
- La sesión y el rol (`src/context/SessionProvider.tsx`) solo ordenan la navegación. **No son autenticación**: el control de acceso real debe resolverlo el backend.
- La corrida, la sesión y las conversaciones con el agente se guardan en `sessionStorage`, así que sobreviven a una recarga pero no al cierre de la pestaña.
- El agente no está conectado a un modelo: responde con guiones por hallazgo y lo dice cuando una pregunta no tiene guion. La descarga genera un CSV y el PDF usa la impresión del navegador.

## Datos de ejemplo

`src/data/demo.json` reproduce el caso del Capítulo IV (Carlos Díaz, AT 2022–2025): los 14 códigos de orígenes de renta, la base imponible, el análisis financiero, las contingencias de los Art. 53 y 97 y los totales de la radiografía patrimonial. Son **ilustrativos** (no vienen del documento) los folios, el detalle de bienes raíces por rol y los períodos del F29.

En los datos, `null` significa "no informado" y se muestra como raya (—); `0` es un valor declarado en cero.

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
- `src/lib/icred.ts` — valor presente de la capacidad de crédito y alertas del método.
- `src/context/` — sesión, corrida (polling y carga del reporte) y conversaciones por hallazgo.
- `src/data/insightPlaybooks.ts` — guiones del agente por hallazgo: origen, preguntas, simulaciones y casos de uso. Las cifras se calculan desde el reporte; el texto es fijo.
- `src/components/` — shells, gráficos SVG y piezas compartidas.
- `src/pages/` — pantallas del cliente y de administración.

## Despliegue

Es una SPA con `BrowserRouter`: el hosting debe servir `index.html` para cualquier ruta. `vercel.json` ya incluye esa regla para Vercel.
