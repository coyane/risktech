# Diagnóstico Base — reglas de la página

Sobrescribe a `MASTER.md` solo en lo que aparece aquí. Elegido en octubre de 2026 tras tres rondas de prototipos (ver "Descartado" en `docs/ui.md`): el panel "V4", sobre la base de Tablero.

## Qué es

Los datos del SII y los cálculos que se hacen con ellos, en dos presentaciones del mismo contenido:

- **Pantalla:** un panel por vistas. Cada vista cabe en una o dos pantallas.
- **PDF:** el documento completo, en el mismo orden, para leer o entregar a un banco.

**No interpreta.** Sin semáforo, sin adjetivos, sin texto que cambie según el caso. La variación entre años es un dato neutro ("+11,9% vs AT 2024") que se puede ocultar con el botón "Variación entre años".

**Habla del cálculo y de su origen.** No nombra un método, un capítulo ni sus reglas.

## Marco

- Menú lateral en tarjeta: grupo Diagnóstico (Resumen, Cálculos, Crédito, Propiedades), grupo Informe (Datos del SII, Pendientes con su número, Glosario) y grupo Complementos (Informe de deudas, "Opcional · Recomendado"; ver `informe-de-deudas.md`). Al pie, la tarjeta oscura del agente con "Próximamente". Si el menú no cabe en la altura, se desplaza: la tarjeta del agente nunca se recorta.
- Barra superior del informe: caso, RUT y fecha de captura; años en segmentos; descargas PDF y CSV; "Nueva captura".
- Bajo 1024 px: botón "Menú" que abre el menú como hoja y barra inferior con las cuatro vistas y "Más".

## Vistas

| Vista | Contenido |
| --- | --- |
| Resumen | Cuatro cifras (crédito que paga el dividendo, en petróleo; ingreso declarado; renta neta al mes; dividendo de referencia), cada una con su variación y una flecha a su cálculo. Bajo las cifras, a todo el ancho, las actividades económicas registradas: el código de seis dígitos en petróleo y cifra de título, la glosa y, en una línea, categoría, Afecta IVA y desde; con su origen "SII · Datos del contribuyente" y una flecha a la tabla. Barras por año con base cero y botones para cambiar la cifra, con la tabla por año plegada. Tasa y plazo con el valor en UF "por confirmar". Tasa efectiva como parte de la base imponible (barra partida con los códigos 157 y 170). Propiedades en barra partida. Deuda de origen por institución con su leverage por determinar |
| Cálculos | Grupos en segmentos (Renta e impuesto, Renta financiera, Crédito, Propiedades, Contingencias). Índice del grupo a la izquierda y el cálculo al lado, por niveles: (1) pregunta, cifra, frase en simple y lo que falta; (2) "La operación", plegada: operador, forma del dato, nombre enlazado y valor, con el total bajo una línea; (3) "Qué es y de dónde sale", plegado: definición, fuente de cada dato, viene de y se usa en. Lo abierto sigue abierto al pasar al siguiente |
| Crédito | Tarjeta petróleo con el monto, el valor en UF y los campos. El crédito según el plazo (curva con eje desde $0 y el plazo escrito marcado). Factor leverage como cinco cifras. Crédito automotriz con tasa libre. Tabla de referencia plegada |
| Propiedades | Fila de cinco cifras (propiedades, activos, patrimonio, pasivos de origen, avalúo). Cómo se pagaron (barra partida). Deuda de origen por institución, de mayor a menor. Lista de las propiedades a todo el ancho, como tabla con encabezados: comuna y destino, compra, institución, plazo transcurrido ("7 años y 3 meses de 25 años", barra fina de avance y lo que queda; el estado "Por confirmar" con su nota va sobre la lista y en cada fila para lectores de pantalla), financiado (mini barra partida: liso al contado, rayado financiado, con la cifra al lado) y precio. "¿Qué es cada columna?" plegable bajo la nota de financiado. En móvil, cada propiedad es una ficha con rótulos. Debajo, por destino, por comuna y Ley 20.455 en tres tarjetas |
| Datos del SII, Pendientes, Glosario | Como antes, dentro de la hoja. El Glosario suma cómo leer los estados, los tipos de dato y los datos del informe |

## Reglas

- **Lo que la persona ajusta se escribe.** Campos numéricos libres, con la unidad adentro; nada de deslizadores ni celdas presionables. La tasa y el plazo son los mismos en Resumen y Crédito.
- **Todo cálculo se explica en Cálculos.** Las flechas de las tarjetas y los enlaces de propiedades llevan ahí (`#calc-<id>`). El botón atrás deshace cada paso.
- **Abrir o cambiar un cálculo no mueve la página.** Sobre 1180 px el cálculo queda siempre al lado; bajo 1180 px se abre como hoja y se cierra con el botón, Escape o tocando fuera.
- **Tipos de dato:** dato del SII (cuadrado), valor de referencia (rombo), resultado calculado (círculo); siempre con su nombre en la leyenda.
- **Estados:** calculado (verde claro con visto), por confirmar (ámbar con reloj), por determinar (borde punteado). Lo pendiente nunca se oculta: un cálculo por determinar muestra "Por determinar" en vez de la cifra.

## PDF

1. Barra superior con caso y año, y los datos del informe con responsabilidad y alcance.
2. Resumen con la tasa y el plazo usados (sin los campos).
3. Todos los cálculos por grupo, con sus niveles abiertos.
4. Crédito y Propiedades, con las tablas plegables desplegadas.
5. Datos del SII, Pendientes y Glosario.
6. Informe de deudas (CMF): sus páginas tal cual, una por hoja, o la línea fija si no se cargó.

Las actividades económicas y el plazo transcurrido de cada crédito se imprimen: las actividades en el Resumen y en Datos del SII; el plazo en la lista de propiedades, en la ficha registral y como cálculo en Propiedades.

Cada vista empieza en página nueva; las tarjetas y las filas no se parten; los fondos y rayados se imprimen.
