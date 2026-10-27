# Guía de interfaz

Cómo está construida la interfaz y cómo extenderla sin que deje de parecer un solo producto. Las reglas visuales por página están en `design-system/risktech-ceft/pages/`; aquí está lo que se necesita para trabajar en el código.

## Principios

1. **Primero la respuesta, después el respaldo.** Cifra grande con su pregunta; la operación y las fuentes, a un paso y plegadas.
2. **Vistas cortas, no páginas largas.** Cada vista cabe en una o dos pantallas. Lo que es detalle se abre al lado o en una subpestaña.
3. **Todo tiene dirección.** Cada vista y cada cálculo se abre con un enlace, y el botón atrás deshace cada paso.
4. **Las mismas piezas en todas partes.** Una cifra, un bloque de cálculo o una tabla se ven igual en el informe y en el backoffice.
5. **El color no decide nada solo.** Tipos de dato (cuadrado, rombo, círculo) y estados llevan forma y texto además del color. No hay colores tipo semáforo; lo pendiente o lo financiado va rayado.
6. **Lo que la persona ingresa se escribe.** Campos numéricos libres con el resultado al lado; sin deslizadores ni celdas presionables.
7. **Pantalla y PDF son dos presentaciones del mismo contenido.** El PDF imprime todas las vistas en orden.
8. **Un gráfico solo si responde una pregunta mejor que la cifra sola.** Barras con base cero; nunca unidades ni períodos mezclados en una escala; dos partes de un total, en barra partida con texto; nada de medidores sin meta.
9. **Se habla del cálculo y de su origen, no de un método.** Ver la regla 7 de `docs/product.md`.

## Mapa de la aplicación

| Ruta | Qué muestra | Página |
| --- | --- | --- |
| `/` | Conexión | `src/pages/LoginPage.tsx` |
| `/diagnostico` | Extracción y, al terminar, el Diagnóstico Base | `src/pages/DiagnosticoPage.tsx` |
| `/analisis`, `/analisis/hallazgo/:id` | Agente del cliente ("Próximamente") | `src/pages/AnalysisPage.tsx`, `InsightPage.tsx` |
| `/admin`, `/admin/radiografia`, `/admin/agente` | Backoffice | `src/pages/admin/` |

**Marco.** `ShellFrame` dibuja el menú lateral en una tarjeta (grupos Diagnóstico, Informe y Complementos, el agente "Próximamente" al pie) y el contenido al lado. Si el menú no cabe en la altura, se desplaza dentro de su tarjeta: nada se encoge. Bajo 1024 px el menú se abre como hoja desde el botón "Menú"; en el informe, una barra inferior lleva a las cuatro vistas y "Más" abre ese menú.

**Vistas del Diagnóstico Base.** El fragmento de la URL decide qué se ve; `src/lib/reportViews.ts` lo traduce.

| Fragmento | Vista |
| --- | --- |
| `#resumen`, `#financiero` | Resumen: cifras con su variación, actividades económicas registradas, barras por año, tasa y plazo, tasa efectiva, propiedades y deuda |
| `#calculos`, `#grupo-<grupo>`, `#calc-<id>`, `#contingencias` | Cálculos: el grupo en su primer cálculo, o ese cálculo abierto. Todos los cálculos se explican aquí, también los de crédito y propiedades |
| `#credito` | Crédito: monto, campos, crédito según el plazo, leverage, automotriz y tabla de referencia |
| `#propiedades`, `#patrimonio`, `#financiamiento`, `#datos-propiedades` | Propiedades, en la lista o en la deuda por institución |
| `#datos-<subpestaña>`, `#origenes-104`, `#base-157` | Datos del SII, en la tabla y la fila que corresponda |
| `#pendientes`, `#glosario` | Pendientes, Glosario (con estados, tipos de dato y datos del informe) |
| `#deudas` | Informe de deudas (grupo Complementos): cómo sacarlo en la CMF, la carga del PDF con su verificación por código QR y, si es válido, sus páginas tal como se cargaron. Opcional; no cuenta como pendiente. En móvil, en "Más" |

Las vistas y los cálculos no llevan `id` en el HTML: así el navegador no mueve la página por su cuenta y el desplazamiento lo decide la página.

## Piezas reutilizables

| Pieza | Archivo | Para qué |
| --- | --- | --- |
| Marco con menú | `components/ShellFrame.tsx`, `AppShell.tsx`, `AdminShell.tsx` | Menú lateral en tarjeta, hoja en móvil y barra inferior del informe. Cliente y backoffice comparten marca y tokens |
| Íconos | `components/Icon.tsx` | Una sola familia de trazo; siempre decorativos |
| Cifra grande, flecha, variación, forma del dato | `components/panel/Bits.tsx` (`BigValue`, `GoLink`, `Delta`, `KindGlyph`) | La moneda atenuada; la variación como dato neutro |
| Cálculos por niveles | `components/panel/CalcLevels.tsx` (`CalcLevels`, `CalcDetail`, `OperationList`) | Índice del grupo y el cálculo abierto: respuesta; operación y origen plegados. En el PDF, `CalcDetail print` sale abierto |
| Barras por año y crédito según el plazo | `components/panel/Charts.tsx` (`YearBars`, `CreditCurve`) | Base cero, cifra en cada barra; curva con eje desde $0 y el plazo escrito marcado |
| Campos de tasa y plazo | `components/numbers/CreditCapacitySection.tsx` (`CreditFields`) y `lib/useCreditDraft.ts` | Campos controlados con la unidad adentro; el borrador vive en el informe y `idPrefix` evita ids repetidos |
| Crédito automotriz y tabla de referencia | `components/numbers/CreditCapacitySection.tsx` (`AutoCredit`, `CreditTable`) | Tasa libre; tabla de solo lectura |
| Variación entre años | `lib/variacion.ts` (`yearDelta`) | Una plantilla: "+X% vs AT año" o "+X pts vs AT año" |
| Barra partida | `components/SplitBar.tsx` | Un total en dos o más partes, con monto y porcentaje en texto; liso o rayado |
| Lista y ficha de propiedades | `components/numbers/PatrimonySection.tsx` (`PropertyList`, `PropertyRegistry`) | Tabla con encabezados (comuna y destino, compra, institución, plazo transcurrido, financiado, precio) que en móvil pasa a una ficha con rótulos; "¿Qué es cada columna?" plegable; la ficha registral completa, plegable. Los rótulos y su explicación salen de `PROPERTY_COLUMNS` |
| Actividades económicas | `pages/DiagnosticoPage.tsx` (`Activities`) y `diagnostico/SiiTables.tsx` | Tarjeta del Resumen (código, glosa, categoría, Afecta IVA, desde) y tabla de Datos del SII. Textos en `ACTIVITY_TEXT` |
| Estado | `components/diagnostico/StatusTag.tsx` | Calculado, por confirmar, por determinar |
| Tabla de cifras por año | `components/diagnostico/Results.tsx` (`ResultsTable`) | Alternativa en tabla a las barras por año, plegada |
| Tarjeta con título y tabla | `components/SectionCard.tsx` (`SectionCard`, `TableWrap`) | Toda tabla va dentro de `TableWrap` |
| Cifras, barras y columnas del backoffice | `components/Figures.tsx`, `BarList.tsx`, `ColumnChart.tsx` | Propietarios y Radiografía |
| Contenido plegable | `components/Disclosure.tsx` | Detalle secundario; el PDF lo imprime desplegado |
| Aviso de fuera de fase | `components/ComingSoon.tsx` | Etiqueta y aviso "Próximamente" |
| Informe de deudas | `components/deudas/DebtReportView.tsx`, `context/DebtReportProvider.tsx`, `lib/informeDeudas.ts`, `lib/verificacionDeudas.ts`, `lib/pdfPages.ts` | Guía de la CMF, carga con arrastrar y soltar, verificación por código QR en tres pasos (rechazo, error del servicio con "Reintentar", cancelar) y las páginas como imágenes. Contrato del backend en `docs/contrato-verificacion-informe-deudas.md`; escenarios `?demo=deuda-sin-qr`, `deuda-no-cmf`, `deuda-no-coincide`, `deuda-servicio`. El archivo vive en memoria mientras dure la sesión; pdf.js se carga solo al elegir un archivo (ver `docs/decisions/0005-pdfjs-informe-de-deudas.md`) |

Antes de crear una pieza nueva, revisa si una de estas resuelve el caso.

## De dónde sale el contenido del informe

La interfaz no calcula ni redacta. `src/lib/calculos.ts` es el registro de cálculos: cada uno trae su pregunta, nombre, definición, frase, operación, estado y dependencias. La página recorre el registro.

Los textos fijos del Informe de deudas están en `DEBT_TEXT` (`src/lib/informeDeudas.ts`), con su propia prueba de lenguaje.

Los textos fijos de la interfaz (qué significa cada estado y cada tipo de dato, la ayuda del crédito, de dónde salen la tasa y el plazo, el plazo transcurrido de cada crédito, las columnas de la lista de propiedades y las actividades) también están en el registro: `statusHelp`, `kindHelp`, `CREDIT_HELP`, `creditSource`, `PLAZO_TEXT`, `PROPERTY_COLUMNS`, `ACTIVITY_TEXT`. Una prueba verifica que ninguno nombre un método, un capítulo ni casos de referencia.

Para agregar un cálculo:

1. Agrégalo al registro con su estado y una sola plantilla de frase, verdadera para cualquier valor.
2. Agrega su prueba en `src/lib/__tests__/calculos.test.ts`, con el valor de un caso de referencia.
3. Decide en qué grupo aparece (`CALC_GROUPS` en `src/lib/reportViews.ts`).
4. Actualiza el catálogo de fórmulas del sprint.

No escribas texto que dependa del caso en un componente. Si hace falta una frase nueva, va en el registro.

## Estilos

`src/index.css` solo importa los archivos de `src/styles/`, en el orden de la cascada.

| Archivos | Contenido |
| --- | --- |
| `tokens.css` | Colores (familia petróleo), tamaños de letra, radios y tipografías. Todo color sale de aquí |
| `base.css`, `shell.css`, `layout.css`, `controls.css`, `data.css`, `forms.css` | Base, marco con menú, tarjetas, botones, tablas y formularios |
| `report.css`, `panel.css`, `figures.css` | Diagnóstico Base: piezas compartidas (estado, barra partida, ficha registral, pendientes, glosario) y el panel de las vistas; cifras del backoffice |
| `deudas.css` | Informe de deudas y la entrada del grupo Complementos. Como `panel.css`, trae su ajuste de móvil al final (`@media screen`) |
| `sections.css` | Secciones de datos del informe |
| `run.css`, `login.css` | Extracción y conexión |
| `insights.css`, `workspace.css`, `soon.css` | Agente y "Próximamente" |
| `responsive.css` | Ajustes de las páginas que no son el panel. Va después de todo lo anterior |
| `print.css` | El PDF. Va al final |

Reglas:

- Usa las variables de `tokens.css`; no escribas colores ni tamaños de letra sueltos en un componente.
- Un estilo nuevo va en el archivo de su área. Si necesita ajuste en móvil o en el PDF, ese ajuste va en `responsive.css` o `print.css`.
- Los números van con cifras tabulares (el `body` ya las activa). Las cifras grandes van en Bricolage Grotesque liviana (`--display`); el texto, en Instrument Sans (`--sans`). Las dos se sirven desde `@fontsource`, sin depender de internet.
- Cada objetivo de clic mide al menos 44 px de alto.

## Medidas y comportamiento

| Ancho | Qué cambia |
| --- | --- |
| Sobre 1180 px | En Cálculos, el índice del grupo a la izquierda y el cálculo abierto siempre al lado |
| Hasta 1180 px | Las tarjetas pasan a ancho completo; el cálculo se abre como hoja sobre el índice y se cierra con el botón, Escape o tocando fuera |
| Hasta 1023 px | El menú lateral pasa a un botón "Menú" (hoja) y el informe muestra una barra inferior con las cuatro vistas y "Más" |
| Hasta 720 px | Los años ocupan una fila; las cifras de Propiedades van de a dos; cada propiedad pasa a ficha con rótulos (sin crédito, solo compra y "Todo al contado"); la operación se apila |

La página nunca se desplaza a lo ancho. Las tablas anchas lo hacen dentro de `TableWrap`.

## PDF

- Sale de la impresión del navegador; no hay un generador aparte.
- Lo que en pantalla está oculto por una pestaña se imprime igual. Si agregas un contenedor que oculta contenido con `hidden`, agrégalo a la lista de `print.css` que lo vuelve a mostrar.
- La navegación y los campos de entrada llevan la clase `no-print`.
- El Informe de deudas sale al final, en hoja nueva, solo si se verificó: la línea de verificación y cada página del PDF en su propia hoja, o la línea fija "No se cargó el informe de deudas; es opcional." El botón "PDF" conserva su nombre: la carpeta es ese mismo PDF, y la vista lo explica ("se agrega al final del PDF del informe").
- Lo que solo va en papel lleva `print-only`: los datos del informe al inicio, la tasa y el plazo usados y la lista completa de cálculos con sus niveles abiertos (`CalcDetail print`), que reemplaza al índice interactivo.

## Cómo se trabaja un cambio de interfaz

En Claude Code lo hace el subagente `frontend-uiux` (ver `AGENTS.md`). Cuando imita un componente de 21st.dev, lo traduce a las piezas de esta guía y a los tokens de `src/styles/`; no se agregan Tailwind ni framer-motion.

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
| Resumen como recorrido en 5 pasos (pregunta, cifra, frase, línea técnica, frase puente y columna lateral de datos) | Sobrecargado: demasiado texto a la vez y vistas "fomes" (octubre de 2026) |
| Cálculos como bloques con fichas de dato con borde, fondo y etiqueta | "Muy sobrecargada y tosca"; se reemplazó por los niveles |
| Prototipos Boleta (suma vertical), Tablero (bento con fórmula grande) y Margen (editorial oscuro con párrafo y notas al margen) | No cumplían; el panel actual parte de Tablero |
| Medio anillo para la tasa efectiva, mini tendencias en cada cifra, columnas que mezclaban montos anuales y mensuales, cápsulas ×1 a ×5 del leverage | Gráficos que no respondían una pregunta mejor que la cifra |
| Nombrar el método, el Capítulo IV o "reglas del método" en la interfaz | La persona necesita el cálculo y su origen, no el nombre de una metodología |
| Lista lateral más un mapa en árbol de los cálculos | Dos índices compitiendo |
| Abrir cada cálculo como pantalla aparte | Se perdía el contexto de los demás |
| Deslizadores y tabla con celdas presionables para el crédito | Incómodo con mouse |
| Semáforo y frases de evaluación | Dependen del caso; el informe no interpreta |
| Un color distinto por categoría en los gráficos | Parecía semáforo y no agregaba información |
| Inventario fila a fila de todas las propiedades en el backoffice | No decía nada del grupo |
