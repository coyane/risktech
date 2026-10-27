# Plan · Pestaña Propiedades

## Diseño (skill ui-ux-pro-max)

- **Comparar instituciones:** barras horizontales ordenadas, con la etiqueta y el valor escritos (la skill: "compare categories → bar chart; direct labels; never encode category solely by color"). Se reutiliza `BarList`.
- **Parte del todo con valores exactos:** barra apilada con etiquetas directas, no torta (la skill desaconseja torta cuando importan los valores exactos y propone la barra apilada como alternativa accesible). Componente nuevo `SplitBar`.
- **Detalle a demanda:** la ficha registral sigue plegada (`Disclosure`), y los cálculos van uno a la vez con subpestañas, como en Crédito.
- Colores: los de `tokens.css`. Patrimonio en azul marino; financiado en dorado con trama, igual que las restas de la cascada. Cada parte lleva su texto.

## Cambios

| Pieza | Cambio |
| --- | --- |
| `src/lib/reportViews.ts` | Vista `propiedades`; los fragmentos de propiedades y sus cálculos llevan a ella; sale la subpestaña "Propiedades" de Datos del SII |
| `src/components/numbers/PatrimonySection.tsx` | Se separa en `PropertyTable` y `PropertyRegistry`; la tabla de financiamiento la reemplazan las barras |
| `src/components/SplitBar.tsx` | Nuevo |
| `src/components/diagnostico/CalcExplorer.tsx` | Una entrada puede listarse sin explicación propia (`node: null`): se ve en el índice y su enlace lleva a otra pestaña |
| `src/pages/DiagnosticoPage.tsx` | Sección `propiedades`; los grupos de propiedades del índice de Cálculos enlazan a ella |
| `src/styles/report-extras.css`, `responsive.css` | Estilos de la barra apilada y de la pestaña |
| `e2e/diagnostico.spec.ts` | Pruebas de CA1 a CA8 |
| `docs/ui.md`, `design-system/.../diagnostico-base.md` | Documentar la pestaña |

## Riesgos

- Duplicar contenido entre Cálculos y Propiedades: las entradas de propiedades en Cálculos no renderizan explicación (evita duplicados en el PDF).
- Enlaces del agente (`#patrimonio`): se cubren en el traductor de fragmentos y con una prueba.
