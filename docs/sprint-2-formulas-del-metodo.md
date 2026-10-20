# Sprint 2 — Fórmulas del método

19 de octubre de 2026 · Cristóbal Oyanedel

Una semana para dejar cada cálculo del Diagnóstico Base igual a lo que escribe el método, validado por Ricardo fórmula por fórmula, y listo para que el motor del backend lo implemente sin interpretación.

Este documento no reemplaza al sprint 1 (versión 2), que sigue siendo el plan de conexión, extracción y backoffice. Lo complementa con el catálogo exacto de fórmulas, que pasa a ser la referencia de los cálculos.

## Por qué este sprint

En la revisión del 19 de octubre, Ricardo detectó que tres fórmulas no eran las del Capítulo IV:

| Cálculo | Lo que había | De dónde salió | Lo que dice el capítulo |
| --- | --- | --- | --- |
| Total de orígenes de renta | Suma de los 14 códigos de orígenes | La tabla "Orígenes de renta" del caso | Código 158 − (código 106 + código 108) |
| Renta financiera bruta | Total − 955 − 152 + 494 | Ingeniería inversa de la tabla de BICRED | Código 158 + 494 − 106 − 108 |
| Renta financiera neta | Bruta × 0,90 o 0,80 según la tasa efectiva | Ingeniería inversa de la tabla de BICRED | Bruta × (1 − tasa efectiva) |

La causa fue de método, no de cálculo: se usaron como fuente las cifras de un caso y de BICRED, que usa aproximaciones, en vez del texto del capítulo. Ricardo lo dijo explícitamente: no se programa a partir de un caso.

Las tres ya están corregidas en el prototipo (commit `4fee799`).

## Reglas de este sprint

1. **La fuente de una fórmula es el texto del método**: el Capítulo IV o lo que Ricardo confirme por escrito o en una reunión registrada. Cada fórmula del catálogo dice de dónde sale.
2. **Los casos son ejemplos, no la referencia.** Las tablas del capítulo y de BICRED sirven para entender, no para validar. Que una cifra no coincida con BICRED no es un error.
3. **Lo que no tiene fuente escrita no se calcula como si la tuviera.** Queda "por confirmar" o "por determinar", a la vista en el informe.
4. **Las pruebas comparan contra la fórmula**, con valores de entrada conocidos, incluidos los casos donde cada término es distinto de cero.

## Alcance

| Entra | Queda fuera |
| --- | --- |
| Revisión de Ricardo de cada fórmula del catálogo | Nuevas fórmulas que no estén en el método |
| Extraer del F22 los códigos que las fórmulas necesitan (158, 106, 108, 494, 157, 170) | Contingencias de los Art. 53 y 97 |
| Implementar el catálogo en el motor del backend, con sus pruebas | Cambios de diseño del informe |
| Revisión de Ricardo de las fórmulas de bienes raíces | Datos reales de clientes en el repositorio o en el caso de ejemplo |

**Criterio de terminado**

1. Las 21 fórmulas del catálogo tienen su estado final. Al 19 de octubre faltan solo las de bienes raíces (17 a 20).
2. Cada fórmula confirmada coincide al peso, en el motor y en el prototipo, con su definición escrita, para valores de entrada conocidos.
3. Ninguna fórmula del informe se apoya en una tabla de un caso o de BICRED.
4. El caso de ejemplo usa un código 158 real, o queda rotulado como ilustrativo.

## Catálogo de fórmulas

### Convenciones

- **Códigos:** casillas del Formulario 22 del año tributario. En un F22 capturado, un código ausente vale 0. Un año sin declaración deja todos sus cálculos en "Sin declaración ese año".
- **Redondeo:** los montos en pesos se redondean al peso en cada paso. Las UF de propiedades, a 2 decimales. La tasa efectiva se usa exacta (157 ÷ 170), no redondeada.
- **División por cero:** el cálculo muestra "No se puede calcular: … es 0" y lo que depende de él queda sin valor.
- **Fuentes:** "Cap. IV p. N" es la página impresa del Capítulo IV. "Reunión 1" es la del 7 de octubre; "Reunión 2", la del 19 de octubre.
- **Revisión de Ricardo:** "Sí" = validada; "Pendiente" = falta su revisión. Al 19 de octubre están validadas todas las fórmulas salvo las de bienes raíces.

### Renta e impuesto

| N° | Cálculo | Fórmula exacta | Si falta un dato | Fuente | Revisión de Ricardo |
| --- | --- | --- | --- | --- | --- |
| 1 | Total de orígenes de renta (GIF) | `C158 − (C106 + C108)` | Sin declaración ese año | Cap. IV p. 5; Reunión 2 | Sí |
| 2 | Total de rebajas | Suma de los 9 conceptos de rebajas del F22 | Sin declaración ese año | Estructura del F22 | Sí |
| 3 | Base imponible | `(1) − (2)`, comparada con `C170` declarado. Si no coinciden, el informe muestra la diferencia | Sin declaración ese año | Reunión 1; Reunión 2 | Sí |
| 4 | Tasa efectiva de tributación | `C157 ÷ C170` | No se puede calcular si `C170 = 0` | Cap. IV p. 6 | Sí |
| 5 | Base imponible en UTA | `C170 ÷ UTA` de diciembre del mismo año de la declaración | Dato no capturado si falta la UTA | Reunión 1 | Sí |
| 6 | Tramo Art. 55 bis | A si `(5) ≤ 90`; B si `90 < (5) < 150`; C si `(5) ≥ 150` | Dato no capturado | Reunión 1 (Ley de la Renta) | Sí |
| 7 | Rebaja máxima de intereses (Art. 55 bis) | `8 UTA × p`, con `p = 100%` si `(5) ≤ 90`; `p = (250 − 1,667 × (5))%` si `90 < (5) < 150`; `p = 0%` si `(5) ≥ 150`. En pesos: × UTA del año | Dato no capturado | Reunión 1; Reunión 2 | Sí |
| 8 | Tramo de Global Complementario | Tramo de la tabla del Art. 52 del año tributario que contiene la base | Dato no capturado si no está la tabla del año | Reunión 1 | Sí. Falta cargar la tabla oficial de cada año (dato, no fórmula) |

### Renta financiera y crédito

| N° | Cálculo | Fórmula exacta | Si falta un dato | Fuente | Revisión de Ricardo |
| --- | --- | --- | --- | --- | --- |
| 9 | Renta financiera bruta (RFB, GIF bruto ajustado) | `(1) + C494`. El 494 es mayor que cero solo con gasto presunto de honorarios; con gasto efectivo vale 0 y no cambia nada | Sin declaración ese año | Cap. IV p. 5 y 6; Reunión 2 | Sí |
| 10 | Renta financiera neta (RFN) | `(9) × (1 − C157 ÷ C170)` | No se puede calcular si `C170 = 0` | Cap. IV p. 6; Reunión 2 | Sí |
| 11 | RFN mensual | `(10) ÷ 12` | Dato no capturado | Cap. IV p. 6 | Sí |
| 12 | Límite capacidad crédito hipotecario mensual (PMT) | `(11) × 0,25` | Dato no capturado | Cap. IV p. 6; Reunión 2 | Sí |
| 13 | Límite capacidad crédito automotriz mensual | `(11) × 0,07`; plazo de referencia 48 meses | Dato no capturado | Cap. IV p. 6; Reunión 2 | Sí |
| 14 | Credit Capacity | `PV = (12) × (1 − (1 + i)^−n) ÷ i`, con `i = tasa anual ÷ 12` y `n = años × 12`. Si `i = 0`, `PV = (12) × n`. Tasa y plazo los escribe la persona; parten en 4% a 30 años | Dato no capturado | Cap. IV p. 6 y 7; Reunión 1 | Sí |
| 15 | Credit Capacity en UF | `(14) ÷ UF` del SII en la fecha de referencia | Dato no capturado si falta la UF de esa fecha | Cap. IV p. 7 | Sí. Falta fijar la fecha de la UF (parámetro, no fórmula) |
| 16 | Factor leverage | `(15) × F`, para `F = 1, 2, 3, 4, 5` | Dato no capturado | Cap. IV p. 6 y 7; Reunión 1 | Sí |

Ricardo aclaró en la Reunión 2 que los factores 0,25 y 0,07 son políticas: cada institución puede usar otro porcentaje. El método los usa como referencia.

### Propiedades

| N° | Cálculo | Fórmula exacta | Si falta un dato | Fuente | Revisión de Ricardo |
| --- | --- | --- | --- | --- | --- |
| 17 | Activos | `Σ` enajenación en UF de cada propiedad | Sin propiedades inscritas, o Dato no capturado | Cap. IV p. 7 (Bloque 2) | Pendiente |
| 18 | Patrimonio | `Σ` pago al contado en UF de cada propiedad | Igual que (17) | Cap. IV p. 7 (Bloque 2) | Pendiente |
| 19 | Pasivos de origen | `(17) − (18)` | Dato no capturado | Cap. IV p. 7 (Bloque 2) | Pendiente |
| 20 | Adquisición sin las propiedades de la Ley 20.455 | `(17) − Σ` enajenación en UF de las propiedades acogidas | Dato no capturado | Informe de Apertura de BICRED | Pendiente |
| 21 | Deuda de origen por institución | Por propiedad: enajenación UF − pago al contado UF. Se suma por la entidad que financió. Parte = deuda de la institución ÷ deuda total | Dato no capturado | Reunión 1; vista de BICRED | Sí |

Las sumas de propiedades consideran solo valores informados; si ninguna propiedad trae el dato, el total queda desconocido, no en cero.

### Por determinar

| Punto | Lo que se tiene | Lo que falta |
| --- | --- | --- |
| Leverage por institución y total | Cálculo 21 | El número por el que se divide la deuda, y la UF de qué fecha |
| Recomendación sobre la Ley 20.455 | Cálculo 20 | Si es un texto fijo o una regla |

## Ejemplo: Carlos Díaz, AT 2025

Con el código 158 ilustrativo (igual a la suma de sus orígenes de renta, porque el capítulo no lo trae), 106 = 108 = 494 = 0, 157 = $15.931.231 y 170 = $99.322.241:

| N° | Cálculo | Operación | Resultado |
| --- | --- | --- | --- |
| 1 | Total de orígenes | 104.832.677 − (0 + 0) | $104.832.677 |
| 4 | Tasa efectiva | 15.931.231 ÷ 99.322.241 | 16,04% |
| 9 | Renta financiera bruta | 104.832.677 + 0 | $104.832.677 |
| 10 | Renta financiera neta | 104.832.677 × (1 − 0,160399) | $88.017.575 |
| 11 | RFN mensual | 88.017.575 ÷ 12 | $7.334.798 |
| 12 | Límite hipotecario mensual | 7.334.798 × 0,25 | $1.833.700 |
| 13 | Límite automotriz mensual | 7.334.798 × 0,07 | $513.436 |
| 14 | Credit Capacity (4%, 30 años) | PV de 1.833.700 en 360 meses al 4% anual | $384.089.077 |
| 15 | Credit Capacity en UF | 384.089.077 ÷ 38.416,69 | UF 9.998 |

Con las fórmulas anteriores, el Credit Capacity del caso era $285.216.668 (UF 7.424), el que muestra el capítulo. La diferencia viene sobre todo de que los arriendos ahora están dentro del ingreso, como indica el texto: son flujo de dinero.

## Pendientes

**Fórmulas por revisar con Ricardo:** solo las de bienes raíces.

| N° | Cálculo |
| --- | --- |
| 17 | Activos |
| 18 | Patrimonio |
| 19 | Pasivos de origen |
| 20 | Adquisición sin las propiedades de la Ley 20.455 |
| — | Leverage por institución y total: falta el número por el que se divide la deuda |
| — | Recomendación sobre la Ley 20.455: falta saber si es un texto fijo o una regla |

La deuda de origen por institución (21) ya está validada.

**Datos y parámetros por definir** (no cambian ninguna fórmula):

1. Código 158 real de Carlos Díaz para AT 2022 a 2025. Mientras no esté, el caso de ejemplo lo toma igual a la suma de sus orígenes de renta, rotulado como ilustrativo.
2. Fecha de la UF del Credit Capacity en UF: 31 de diciembre del año comercial o el día de la captura.
3. Tablas oficiales del Global Complementario de cada año tributario, para cargarlas.

## Plan de la semana

| Día | Qué | Quién | Entregable |
| --- | --- | --- | --- |
| 1 | Enviar este catálogo y el prototipo actualizado a Ricardo | Cristóbal | Catálogo enviado |
| 1–3 | Revisión de las fórmulas de bienes raíces | Ricardo; Savka audita en paralelo | Fórmulas 17 a 20 marcadas |
| 2 | Asegurar la extracción de 158, 106, 108, 494, 157 y 170 en el conector del F22 | Conectores | Códigos en base de datos para un RUT de prueba |
| 3–4 | Implementar en el motor las fórmulas confirmadas, con pruebas por fórmula | Motor | Pruebas pasando |
| 4 | Aplicar al prototipo las correcciones que salgan de la revisión | Front | Prototipo alineado |
| 5 | Comparar motor y prototipo con 3 a 5 RUT reales | Todos | Mismas cifras en ambos, al peso |

## Tickets para Linear

- [ ] **CAL-12** Renta financiera bruta y neta con la fórmula del Capítulo IV (en el prototipo; falta el motor)
- [ ] **CAL-13** Total de orígenes de renta = 158 − (106 + 108) en el motor
- [ ] **CAL-15** Revisión de Ricardo de las fórmulas de bienes raíces (17 a 20) y del leverage por institución
- [ ] **SII-10** Extraer el código 158 del F22 (hoy se guardaba sin usarse), junto con el 106, 108 y 494 que usa la misma fórmula

## Otros cambios incluidos en el mismo commit

Para que se entiendan al revisar el prototipo:

- **"Límite capacidad crédito hipotecario mensual":** se agregó "mensual", como pidió Ricardo.
- **Conceptos en cero:** las operaciones ya no dicen "7 conceptos en cero no se muestran", sino cuáles son.
- **Propiedades:** la tabla por rol muestra la entidad que financió, la deuda de origen y el plazo; hay un cuadro de financiamiento por institución y una ficha registral con todos los datos de la matriz de BICRED.
- **Los PDF del método no se suben al repositorio**, que es público.
