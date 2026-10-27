# 0005 · pdf.js para mostrar e imprimir el informe de deudas tal como se cargó

Octubre de 2026

## Contexto

La vista Informe de deudas (`#deudas`) recibe el PDF que la persona descarga de la CMF y debe mostrarlo tal como se cargó, sin extraer ni reinterpretar datos. Además, el informe se entrega como carpeta crediticia: ese PDF tiene que salir al final del PDF del Diagnóstico Base, que es la impresión del navegador.

Un `<iframe>` o un `<embed>` muestran el PDF en pantalla, pero no se imprimen: la impresión del navegador deja ese recuadro vacío o en una sola hoja recortada.

## Decisión

Agregar `pdfjs-dist` (Mozilla, Apache-2.0) y dibujar cada página del PDF como imagen PNG en el navegador (`src/lib/pdfPages.ts`). Las imágenes se muestran en la vista y se imprimen al final de la carpeta, una página del informe por hoja.

- Se carga de forma diferida: `pdfPages.ts` se importa con `import()` recién cuando la persona elige un archivo. El paquete inicial no cambia; pdf.js queda en su propio fragmento (unos 130 KB comprimidos) y su worker es un archivo aparte (`pdf.worker.min.mjs?url`, configurado en `GlobalWorkerOptions.workerSrc`).
- El archivo se lee en el navegador y queda en memoria (`DebtReportProvider`), sin `localStorage`. Las páginas se dibujan mientras el backend lo verifica con su código QR (simulado en la demo; ver `docs/contrato-verificacion-informe-deudas.md`) y solo se muestran si queda verificado; un rechazo las descarta.
- Las fuentes no incrustadas en el PDF usan las del sistema (opción por defecto de pdf.js en navegador). No se publican `standard_fonts`, `cmaps` ni `wasm`: no hacen falta para un informe con fuentes incrustadas y se pueden agregar si un informe real lo pide.

## Alternativas

- `<iframe>` u `<object>` con el PDF: no se imprime dentro de la carpeta.
- Unir los dos PDF en uno (por ejemplo, con pdf-lib): obligaría a generar el PDF del informe fuera de la impresión del navegador, que hoy es el único generador.
- Pedir una imagen en vez del PDF: agrega un paso fuera del trámite oficial y pierde calidad.

## Consecuencias

- Una dependencia más, mantenida por Mozilla. La vulnerabilidad de 2024 (CVE-2024-4367, ejecución de código con un PDF malicioso) se corrigió en la 4.2; en la 6.4 instalada ya no existe la opción `isEvalSupported` ni hay `new Function` en el worker (revisado en `node_modules`).
- Las páginas se ven como imágenes: el texto del informe no se puede seleccionar ni buscar en la vista. Es coherente con "tal como se cargó".
- Con el backend, el lugar donde se guarda el archivo está **por confirmar** (almacenamiento, cifrado, retención y consentimiento). Mientras tanto se pierde al recargar la página, y la vista lo dice.
