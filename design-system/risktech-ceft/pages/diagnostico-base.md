# Diagnóstico Base — reglas de la página

Sobrescribe a `MASTER.md` solo en lo que aparece aquí.

## Qué es

Los datos del SII y los cálculos del método, en dos presentaciones del mismo contenido:

- **Pantalla:** un espacio interactivo por vistas. Nada de página larga: cada vista cabe en una o dos pantallas y los cálculos se abren de a uno.
- **PDF:** el documento completo, en el mismo orden, para leer o entregar a un banco.

La meta es que cualquier persona entienda cada cifra y vea de dónde sale, y que un lector técnico pueda seguir la operación hasta el código del formulario.

**No interpreta.** Sin semáforo, sin adjetivos, sin comparaciones entre años, sin texto que cambie según el caso. Entre dos personas solo cambian números, fechas y nombres propios.

## Pantalla

Cabecera fija del informe (título, persona, acciones) y una barra que queda a la vista al bajar: pestañas a la izquierda, año a la derecha.

| Vista | Contenido |
| --- | --- |
| Resumen | Seis cifras del año con su pregunta, tres cifras de propiedades, tabla de análisis financiero por año, datos del informe |
| Cálculos | Todos los cálculos como bloques agrupados, con la explicación de uno siempre abierta al lado; debajo, cascada del dinero y guía de lectura |
| Datos del SII | Subpestañas: renta anual, declaraciones mensuales, propiedades, contribuyente, fuentes y cobertura |
| Pendientes | Lista de lo que está por confirmar y por determinar, y parámetros en uso |
| Glosario | Definiciones cortas |

Reglas:

- **Un solo índice de cálculos:** los bloques. No combinar una lista lateral con un mapa en árbol, ni llevar la explicación a otra pantalla.
- **Explicación en la misma sección, siempre abierta.** Sobre 1100 px los bloques van en una columna a la izquierda y la explicación queda al lado, fija mientras se recorre la lista; parte por el primer cálculo y nunca se cierra. Bajo 1100 px no caben los dos: la explicación se desliza desde la derecha encima de los bloques al elegir uno, y se cierra con el botón, con Escape o tocando fuera.
- **Los bloques se ven presionables:** flecha a la derecha de cada fila, subrayado y flecha en color al pasar el cursor, y el bloque abierto con fondo y borde de color. El panel también lleva anterior y siguiente.
- Abrir, cambiar o cerrar un cálculo no mueve la página.
- **Todo es un enlace con dirección propia.** Una cifra del resumen abre su cálculo; una ficha de dato del SII abre la tabla y resalta la fila; "Se usa en" vuelve al cálculo. El botón atrás del navegador deshace cada paso.
- Al cambiar de vista la página solo se mueve si el contenido nuevo quedó tapado por la barra.
- El estado de un cálculo en el índice se lee en texto bajo el nombre, además del borde.

## Orden del PDF

1. Encabezado: identificación, fecha de captura, valores de referencia (UF, UTA) y avisos fijos.
2. Resultado del análisis: cifras principales y tabla por año.
3. Cómo se calcula cada resultado: índice, cascada, guía de lectura y todos los cálculos por grupo.
4. Datos obtenidos del SII: todas las tablas.
5. Pendientes del método y glosario.

## Bloque de cálculo

Siempre las mismas piezas, en este orden:

| Pieza | Regla |
| --- | --- |
| Pregunta | Título del bloque. La misma para cualquier persona y se entiende sola, sin leer el bloque anterior |
| Nombre técnico | Debajo de la pregunta, en gris |
| Estado | Etiqueta arriba a la derecha |
| Cifra | La respuesta, en el tamaño más grande del bloque |
| Frase en simple | Reexpresa la operación con sus números. Una plantilla por cálculo, verdadera para cualquier valor |
| Qué es | Definición fija |
| Cómo se calcula | Ecuación con fichas |
| Verificación | Solo si el valor del motor difiere del recalculado: frase fija con la diferencia |
| Qué falta | Solo en estados "por confirmar" y "por determinar" |
| Viene de / Se usa en | Enlaces a los cálculos relacionados |

## Fichas de datos

Tres tipos. Cada uno lleva etiqueta de texto además del color, para que se distinga en blanco y negro.

| Tipo | Etiqueta | Color | Enlace |
| --- | --- | --- | --- |
| Dato del SII | DATO DEL SII | Borde azul, fondo `--info-bg` | A su fila en las tablas del SII |
| Parámetro del método | PARÁMETRO DEL MÉTODO | Borde dorado, fondo ámbar claro | Sin enlace |
| Resultado calculado | RESULTADO CALCULADO | Borde gris oscuro, fondo `--idle-bg` | Al bloque que lo produce |
| Resultado del bloque | RESULTADO | Fondo navy, texto blanco | — |

La ficha muestra, de arriba abajo: tipo, nombre del dato, valor y fuente (formulario, código, año y folio).

## Estados

| Estado | Aspecto |
| --- | --- |
| Calculado | Fondo verde claro, ícono de verificación |
| Por confirmar | Borde dorado, ícono de reloj |
| Por determinar | Borde punteado gris, ícono de pregunta. El bloque completo usa borde punteado |

Nada se oculta por estar pendiente.

## Color

Reservado para los tres tipos de dato y los tres estados. Las barras de la cascada usan navy para los subtotales y trama para las restas y sumas. La columna del año elegido se destaca con `--info-bg` en todas las tablas.

## Interacción

- El selector de año cambia las cifras, el índice, la cascada y cada cálculo. El PDF imprime el año elegido.
- Al llegar a una fila desde una ficha, la fila se resalta (`tr:target`).

## Móvil

Bajo 720 px la ecuación se apila en vertical, con el operador centrado entre fichas. Las pestañas y los años se deslizan en una fila, y la explicación de un cálculo ocupa la pantalla completa. Sin scroll horizontal de página; las tablas anchas se desplazan dentro de su contenedor.

## PDF

- Se imprimen todas las vistas y todos los cálculos, aunque en pantalla estén ocultos; la barra de pestañas y la navegación no se imprimen.
- Escala tipográfica propia en puntos (bloque `@media print` de `src/index.css`).
- Los bloques de cálculo no son cajas: llevan una línea superior que viaja con el encabezado. Así no quedan cajas vacías al pie de página.
- No se parten: encabezado y respuesta del bloque, fichas, tramos, filas de tabla.
- Pie con nombre del documento y número de página (`@page`).
- Los fondos de fichas, barras y estados se imprimen (`print-color-adjust: exact`).
