# 0003 · Pruebas de interfaz con Playwright dentro del repositorio

Octubre de 2026

## Contexto

La interfaz se verificaba con scripts sueltos fuera del repositorio. Ningún otro agente ni persona podía repetir esa verificación, y la interfaz es lo que más va a cambiar.

## Decisión

Agregar `@playwright/test` como dependencia de desarrollo, con pruebas en `e2e/` que recorren la aplicación compilada a 1440 y 375 px. Usa el Chrome instalado en la máquina (`channel: 'chrome'`), sin descargar navegadores. Se corre con `npm run test:ui`.

## Alternativas

- Pruebas de componentes con jsdom: no ven desbordes, impresión ni navegación real.
- Seguir con scripts sueltos: no son compartibles ni repetibles.

## Consecuencias

- Toda prueba falla si la página escribe un error en la consola.
- Cada prueba de cliente pasa por la captura simulada, así que la corrida completa tarda cerca de dos minutos. Por eso `npm run verify` no la incluye y existe `npm run verify:ui`.
- Si se agrega integración continua, hay que instalar Chrome en el entorno o cambiar el canal.
