# 0004 · Estilos en archivos por área, con el orden de la cascada explícito

Octubre de 2026

## Contexto

Toda la hoja de estilos vivía en un archivo de más de 4.000 líneas. Era lento de leer y fácil de romper al editarlo, para personas y para agentes.

## Decisión

Dividirla en `src/styles/`, un archivo por área. `src/index.css` solo los importa, y el orden de esa lista es el orden de la cascada. `responsive.css` y `print.css` van al final.

## Alternativas

- CSS Modules o una librería de estilos: cambia cómo se escribe cada componente, sin una necesidad concreta hoy.
- Estilos junto a cada componente: los ajustes de móvil e impresión cruzan muchos componentes y quedarían repartidos.

## Consecuencias

- La división se hizo sin cambiar ninguna regla: el CSS compilado quedó idéntico byte a byte al anterior.
- Un estilo nuevo va en el archivo de su área; sus ajustes de móvil o impresión, en `responsive.css` o `print.css`.
- Si un archivo pasa de unas 400 líneas, conviene dividirlo manteniendo el orden.
