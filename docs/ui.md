# Guía de interfaz

Cómo está construida la interfaz y cómo extenderla sin que deje de parecer un solo producto. Las reglas visuales por página están en `design-system/risktech-ceft/pages/`; aquí está lo que se necesita para trabajar en el código.

## Principios

1. **Primero la respuesta, después el respaldo.** Cifra grande con su pregunta; la operación y las fuentes, a un paso.
2. **Vistas cortas, no páginas largas.** Cada vista cabe en una o dos pantallas. Lo que es detalle se abre al lado o en una subpestaña.
3. **Todo tiene dirección.** Cada vista y cada cálculo se abre con un enlace, y el botón atrás deshace cada paso.
4. **Las mismas piezas en todas partes.** Una cifra, un bloque de cálculo o una tabla se ven igual en el informe y en el backoffice.
5. **El color no decide nada solo.** Tipos de dato y estados llevan etiqueta de texto además del color. No hay colores tipo semáforo.
6. **Lo que la persona ingresa se escribe.** Campos numéricos libres con el resultado al lado; sin deslizadores ni celdas presionables.
7. **Pantalla y PDF son dos presentaciones del mismo contenido.** El PDF imprime todas las vistas en orden.

## Mapa de la aplicación

| Ruta | Qué muestra | Página |
| --- | --- | --- |
| `/` | Conexión | `src/pages/LoginPage.tsx` |
| `/diagnostico` | Extracción y, al terminar, el Diagnóstico Base | `src/pages/DiagnosticoPage.tsx` |
| `/analisis`, `/analisis/hallazgo/:id` | Agente del cliente ("Próximamente") | `src/pages/AnalysisPage.tsx`, `InsightPage.tsx` |
| `/admin`, `/admin/radiografia`, `/admin/agente` | Backoffice | `src/pages/admin/` |

**Vistas del Diagnóstico Base.** El fragmento de la URL decide qué se ve; `src/lib/reportViews.ts` lo traduce.

| Fragmento | Vista |
| --- | --- |
| `#resumen` | Resumen |
| `#calculos`, `#calc-<id>` | Cálculos, con ese cálculo abierto |
| `#credito`, `#calc-credit-capacity` y los otros dos de crédito | Crédito |
| `#datos-<subpestaña>`, `#origenes-104`, `#base-157` | Datos del SII, en la tabla y la fila que corresponda |
| `#pendientes`, `#glosario` | Pendientes, Glosario |

Las vistas y los cálculos no llevan `id` en el HTML: así el navegador no mueve la página por su cuenta y el desplazamiento lo decide la página.

## Piezas reutilizables

| Pieza | Archivo | Para qué |
| --- | --- | --- |
| Cifras principales | `components/Figures.tsx` | Tarjetas con etiqueta, cifra y nota. Informe y backoffice |
| Cifra que abre un cálculo | `components/diagnostico/Results.tsx` (`ResultsHero`) | Cifra con su pregunta, enlazada a su explicación |
| Bloque de cálculo | `components/diagnostico/CalcBlock.tsx` | Pregunta, cifra, frase, definición, operación, estado y relaciones |
| Operación con fichas | `components/diagnostico/Equation.tsx` | Dibuja la operación; cada ficha dice si es dato del SII, parámetro o resultado |
| Bloques con explicación al lado | `components/diagnostico/CalcExplorer.tsx` | Lista de cálculos por grupo y un cálculo abierto |
| Estado | `components/diagnostico/StatusTag.tsx` | Calculado, por confirmar, por determinar |
| Tarjeta con título y tabla | `components/SectionCard.tsx` (`SectionCard`, `TableWrap`) | Toda tabla va dentro de `TableWrap` |
| Barras horizontales | `components/BarList.tsx` | Categorías sin orden, de mayor a menor |
| Columnas | `components/ColumnChart.tsx` | Escalas ordenadas, como los tramos |
| Cascada | `components/diagnostico/MoneyWaterfall.tsx` | De la renta declarada al dividendo |
| Contenido plegable | `components/Disclosure.tsx` | Detalle secundario; el PDF lo imprime desplegado |
| Aviso de fuera de fase | `components/ComingSoon.tsx` | Etiqueta y aviso "Próximamente" |
| Marco con menú lateral | `components/ShellFrame.tsx` | Lo usan `AppShell` y `AdminShell` |

Antes de crear una pieza nueva, revisa si una de estas resuelve el caso.

## De dónde sale el contenido del informe

La interfaz no calcula ni redacta. `src/lib/calculos.ts` es el registro de cálculos: cada uno trae su pregunta, nombre, definición, frase, operación, estado y dependencias. La página recorre el registro.

Para agregar un cálculo:

1. Agrégalo al registro con su estado y una sola plantilla de frase, verdadera para cualquier valor.
2. Agrega su prueba en `src/lib/__tests__/calculos.test.ts`, con el valor de un caso de referencia.
3. Decide en qué grupo aparece (`TAX_IDS` y los grupos de `DiagnosticoPage.tsx`).
4. Actualiza el catálogo de fórmulas del sprint.

No escribas texto que dependa del caso en un componente. Si hace falta una frase nueva, va en el registro.

## Estilos

`src/index.css` solo importa los archivos de `src/styles/`, en el orden de la cascada.

| Archivos | Contenido |
| --- | --- |
| `tokens.css` | Colores, tamaños de letra y tipografías. Todo color sale de aquí |
| `base.css`, `shell.css`, `layout.css`, `controls.css`, `data.css`, `forms.css` | Base, menú, tarjetas, botones, tablas y formularios |
| `report.css`, `figures.css`, `calc.css`, `explorer.css`, `calc-visuals.css`, `report-extras.css` | Diagnóstico Base |
| `sections.css` | Secciones de datos del informe |
| `run.css`, `login.css` | Extracción y conexión |
| `insights.css`, `workspace.css`, `soon.css` | Agente y "Próximamente" |
| `responsive.css` | Ajustes bajo 1100, 900 y 720 px. Va después de todo lo anterior |
| `print.css` | El PDF. Va al final |

Reglas:

- Usa las variables de `tokens.css`; no escribas colores ni tamaños de letra sueltos en un componente.
- Un estilo nuevo va en el archivo de su área. Si necesita ajuste en móvil o en el PDF, ese ajuste va en `responsive.css` o `print.css`.
- Los números van con cifras tabulares; en tablas, en monoespaciada.
- Cada objetivo de clic mide al menos 44 px de alto.

## Medidas y comportamiento

| Ancho | Qué cambia |
| --- | --- |
| Sobre 1100 px | En Cálculos, los bloques van a la izquierda y la explicación queda siempre abierta al lado |
| Hasta 1100 px | La explicación se desliza sobre los bloques al elegir uno |
| Hasta 720 px | El menú lateral pasa arriba; las operaciones y las cifras se apilan; las columnas pasan a barras |

La página nunca se desplaza a lo ancho. Las tablas anchas lo hacen dentro de `TableWrap`.

## PDF

- Sale de la impresión del navegador; no hay un generador aparte.
- Lo que en pantalla está oculto por una pestaña se imprime igual. Si agregas un contenedor que oculta contenido con `hidden`, agrégalo a la lista de `print.css` que lo vuelve a mostrar.
- La navegación y los campos de entrada llevan la clase `no-print`.

## Cómo se trabaja un cambio de interfaz

1. **Explorar rápido.** Para decidir cómo se ve algo, itera con capturas; no hace falta especificación previa. Varias de las vistas actuales se resolvieron en tres o cuatro vueltas.
2. **Fijar la decisión.** Cuando se elige una forma, déjala en `design-system/risktech-ceft/pages/` y, si cambia el recorrido, en esta guía.
3. **Verificar antes de cerrar:**
   - `npm run verify` (tipos, lint, pruebas del registro y build).
   - `npm run test:ui` (recorrido en Chrome a 1440 y 375 px: sin errores de consola, sin desborde horizontal, PDF completo).
   - Mirar la pantalla cambiada en ambas medidas. Las pruebas no reemplazan mirar.
4. **Si el cambio agrega un recorrido,** agrega su prueba en `e2e/`.

## Descartado, para no repetirlo

| Qué se probó | Por qué se descartó |
| --- | --- |
| Informe en una sola página larga | Se hacía interminable de recorrer |
| Lista lateral más un mapa en árbol de los cálculos | Dos índices compitiendo |
| Abrir cada cálculo como pantalla aparte | Se perdía el contexto de los demás |
| Deslizadores y tabla con celdas presionables para el crédito | Incómodo con mouse |
| Semáforo y frases de evaluación | Dependen del caso; el informe no interpreta |
| Un color distinto por categoría en los gráficos | Parecía semáforo y no agregaba información |
| Inventario fila a fila de todas las propiedades en el backoffice | No decía nada del grupo |
