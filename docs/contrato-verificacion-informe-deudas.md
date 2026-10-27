# Contrato: verificación del informe de deudas por código QR

Para quien construya el backend. Hoy el front lo simula en `src/lib/verificacionDeudas.ts`, igual que la extracción en `src/lib/api.ts`. La vista está descrita en `design-system/risktech-ceft/pages/informe-de-deudas.md`.

## Para qué

El informe de deudas de la CMF trae un código QR. Al cargarlo, el backend lee ese código y valida con la CMF que el documento sea legítimo. **Solo un documento verificado entra a la carpeta crediticia.** Si falla por el documento, se rechaza y no se guarda; si falla el servicio, la persona puede reintentar.

## Operaciones

| Operación | Método y ruta (propuesta) | Entrada | Respuesta |
| --- | --- | --- | --- |
| Iniciar | `POST /informe-deudas/verificaciones` | `multipart/form-data` con el PDF (`archivo`) | `202` con `{ id }` |
| Consultar | `GET /informe-deudas/verificaciones/{id}` | — | `DebtCheck` |
| Cancelar | `DELETE /informe-deudas/verificaciones/{id}` | — | `204`; el archivo se descarta |

El front consulta cada 400 ms hasta un estado final. Los errores de transporte (sin respuesta, 5xx) el front los trata como `SERVICE_ERROR`.

```ts
interface DebtCheck {
  id: string
  status: 'RUNNING' | 'VERIFIED' | 'NO_QR' | 'NOT_CMF' | 'MISMATCH' | 'SERVICE_ERROR' | 'CANCELLED'
  steps: { key: 'LEER_PDF' | 'BUSCAR_QR' | 'VALIDAR_CMF'; state: 'queued' | 'running' | 'done' | 'error' }[]
  verifiedAt: string | null // ISO 8601, solo con VERIFIED
  simulated: boolean        // true mientras sea la simulación de la demo
  correlationId: string
}
```

## Pasos y estados

| Paso | Texto en la interfaz |
| --- | --- |
| `LEER_PDF` | Leyendo el PDF |
| `BUSCAR_QR` | Buscando el código QR |
| `VALIDAR_CMF` | Validando con la CMF |

| Estado final | Causa | Qué hace el front |
| --- | --- | --- |
| `VERIFIED` | El QR es de la CMF y el documento coincide | Guarda el informe, muestra el sello "Verificado con la CMF · código QR" con fecha y hora, y lo agrega a la carpeta con la línea "Verificado con el código QR del documento el dd-mm-aaaa a las hh:mm" |
| `NO_QR` | El PDF no trae un código QR legible | Rechaza: no se guarda. Explica el motivo y ofrece "Cargar otro PDF" y "Abrir el portal de la CMF" |
| `NOT_CMF` | El QR no apunta a la CMF | Igual que `NO_QR` |
| `MISMATCH` | El QR es de la CMF, pero el contenido del PDF no coincide con lo que la CMF registra | Igual que `NO_QR` |
| `SERVICE_ERROR` | El servicio propio o el de la CMF no respondió | No culpa al documento: "Reintentar" (el mismo archivo) y "Cargar otro PDF" |
| `CANCELLED` | La persona canceló | Descarta el archivo |

El paso en que falla un rechazo queda en `error`: `NO_QR` en `BUSCAR_QR`; `NOT_CMF`, `MISMATCH` y `SERVICE_ERROR` en `VALIDAR_CMF`.

## Simulación de la demo

Cualquier PDF que pase las revisiones del front (tipo, tamaño, firma `%PDF-`, que pdf.js lo pueda leer) termina en `VERIFIED` después de unos 3 segundos, con los pasos animados. La vista lo dice: "Modo demo: la verificación es simulada". En la demo el archivo no sale del navegador.

Escenarios con `?demo=<nombre>` (al entrar o en cualquier dirección de la aplicación; se recuerdan en la sesión del navegador):

| Escenario | Resultado |
| --- | --- |
| `deuda-sin-qr` | `NO_QR` |
| `deuda-no-cmf` | `NOT_CMF` |
| `deuda-no-coincide` | `MISMATCH` |
| `deuda-servicio` | `SERVICE_ERROR` la primera vez; "Reintentar" termina en `VERIFIED` |

## Por confirmar

- Qué contiene el código QR del informe (una URL, un folio, un hash) y contra qué servicio de la CMF se valida.
- Qué significa "coincide" para `MISMATCH`: si se compara un folio, el RUT, la fecha o el contenido completo.
- Si el front envía el PDF completo o solo el contenido del QR (se podría leer en el navegador), y por lo tanto dónde se guarda el archivo, con qué cifrado y por cuánto tiempo.
- Si el RUT del informe debe coincidir con el de la persona que capturó el diagnóstico (hoy no se compara).
- Límites: tamaño, tiempo máximo de la verificación y reintentos.
