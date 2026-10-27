# Sistema de diseño — Innovacred

> Las reglas de una página en `pages/<página>.md` mandan sobre este archivo.
> Los valores viven en `src/styles/tokens.css`; aquí está el porqué.

**Producto:** Innovacred (repositorio Risktech; la carpeta conserva el nombre `risktech-ceft`).
**Actualizado:** 2026-10-26, al pasar a la app el panel "V4" elegido por el usuario.
**Dirección:** producto financiero moderno: claro y confiable, con más carácter que la sobriedad anterior (que venía de un producto para abogados). Una sola cosa protagonista por vista.

## Color

Una familia petróleo y neutros fríos. El color no decide nada solo: estados y tipos de dato llevan forma y texto; lo pendiente o lo financiado va rayado.

| Rol | Token | Valor |
| --- | --- | --- |
| Lienzo | `--canvas` | `#e4e8e7` |
| Marco y tarjetas internas | `--shell` | `#f3f5f4` |
| Hoja y tarjetas blancas | `--panel` | `#ffffff` |
| Texto | `--ink` / `--ink-2` / `--muted` | `#0d1b1e` / `#3a484c` / `#5a676b` |
| Líneas | `--line` / `--line-2` | `#e2e7e6` / `#cbd4d2` |
| Borde de campos (≥ 3:1) | `--field` | `#7d8b88` |
| Petróleo, de oscuro a claro | `--p900` … `--p100` | `#0b2e33`, `#0f3d43`, `#135159`, `#1c7a73`, `#7cc9bb`, `#b9e3da`, `#e1f2ee` |
| Texto sobre petróleo | `--on-dark` / `--on-dark-2` | `#eef8f6` / `#a9cdc7` |
| Calculado | `--good` / `--good-bg` | `#1d6a46` / `#e1f1e8` |
| Por confirmar | `--warn` / `--warn-bg` / `--warn-line` | `#8a4b00` / `#fbf0dc` / `#e6c999` |
| Error de un campo | `--danger` | `#b42318` |
| Rayado (pendiente, financiado) | `--hatch` | trama a 135° |

Los nombres anteriores (`--accent`, `--nav`, `--info-bg`…) apuntan a esta familia para que el resto de la interfaz y el backoffice se vean de la misma marca.

## Tipografía

| Rol | Familia | Uso |
| --- | --- | --- |
| Cifras y títulos | Bricolage Grotesque (`--display`), 300 a 600 | Cifras grandes en 300 con la moneda atenuada; títulos de vista en 500 |
| Texto e interfaz | Instrument Sans (`--sans`), 400 a 600 | Todo lo demás, con cifras tabulares |

Las dos se instalan con `@fontsource` (el PDF y el uso sin conexión las necesitan). No hay monoespaciada: los códigos y las tablas usan Instrument Sans con cifras tabulares.

## Forma

- Radios: 10, 16, 22 y 28 px (`--radius-sm` … `--radius-xl`). Botones y segmentos en píldora.
- Marco: el menú y el contenido son tarjetas sobre el lienzo; dentro de la hoja blanca, las tarjetas van en `--shell`.
- Sombras: solo la del marco. Nada de vidrio, degradados ni brillos.
- Objetivos táctiles de 44 px como mínimo; foco visible en todo control.

## Movimiento

Con propósito y breve (0,2 a 0,7 s, curva `--ease-out`): entrada de la vista, barras que crecen, niveles que se despliegan, la hoja del cálculo en móvil. Con `prefers-reduced-motion` no hay animación.

## Gráficos

Un gráfico existe solo si responde una pregunta mejor que la cifra sola. Barras con base cero; nunca unidades ni períodos mezclados en una escala; dos partes de un total en barra partida con monto y porcentaje en texto; ningún medidor sin meta definida; series derivadas (n × base) como cifras.

## Lenguaje

Desde la perspectiva de la persona: "este es el cálculo y este es su origen". No se nombra ningún método, capítulo ni regla de terceros. Sin adjetivos que evalúen. El botón dice lo que hace.

## Antipatrones

- Semáforos y colores que juzguen; flechas verdes o rojas en la variación entre años.
- Fichas de datos con borde, fondo y etiqueta en mayúsculas (se descartaron por toscas).
- Emoji como íconos: los íconos son SVG de una sola familia (`components/Icon.tsx`).
- Deslizadores o arrastre para la tasa y el plazo.
