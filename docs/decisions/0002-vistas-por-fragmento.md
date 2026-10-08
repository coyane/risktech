# 0002 · El informe se recorre por vistas que decide el fragmento de la URL

Octubre de 2026

## Contexto

El informe en una sola página larga era difícil de recorrer. A la vez, el PDF necesita el documento completo, y los enlaces internos (de una cifra a su cálculo, de un dato a su fila) ya usaban fragmentos.

## Decisión

Un solo documento en el HTML. En pantalla se muestra una vista a la vez según el fragmento (`#calculos`, `#calc-tasa-efectiva`, `#origenes-104`); `src/lib/reportViews.ts` hace la traducción. En el PDF se imprimen todas las vistas en orden.

## Alternativas

- Una ruta por vista: obliga a duplicar el contenido para imprimir o a un generador de PDF aparte.
- Estado interno sin dirección: se pierde el botón atrás y los enlaces directos.

## Consecuencias

- Las vistas y los cálculos no llevan `id`, para que el navegador no mueva la página solo; el desplazamiento lo decide `DiagnosticoPage.tsx`.
- Todo contenedor que oculte contenido con `hidden` debe volver a mostrarse en `src/styles/print.css`.
- Los enlaces antiguos de la sección del agente siguen funcionando porque el traductor los conoce.
