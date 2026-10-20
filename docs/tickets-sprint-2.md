# Tickets del sprint 2 — Fórmulas del método

Cuatro tickets para Linear. Reemplazan la descripción de **REM-46, REM-41, REM-40 y REM-43**. Los otros tickets que se habían creado para este sprint (REM-42, REM-44, REM-45 y REM-47) se cancelan: no salieron de la revisión con Ricardo.

Orden de trabajo: **REM-46 → REM-41 → REM-40**. REM-43 corre en paralelo.

## Fuentes y evidencia común

**Fuente de las fórmulas**

| Fuente | Qué respalda |
| --- | --- |
| Capítulo IV ("Capítulo IV para Equipo Desarrollo RPQ"), página impresa 5 | GIF = C158 − (C106 + C108); GIF bruto ajustado = GIF + C494 |
| Capítulo IV, página impresa 6 | Tasa efectiva = C157 ÷ C170; RFN = renta bruta × (1 − tasa efectiva); RFN ÷ 12; factores 0,25 y 0,07 |
| Capítulo IV, página impresa 7 | Credit Capacity (valor presente) y factor leverage |
| Reunión del 7 de octubre con Ricardo | UTA de diciembre, tramos y tope del Art. 55 bis, factor leverage F1 a F5, deuda por institución |
| Reunión del 19 de octubre con Ricardo | Confirma GIF, renta bruta (regla del 494) y renta neta; elimina el factor 0,90 / 0,80; base imponible = total de orígenes − rebajas; "mensual" en el límite hipotecario |

El PDF del capítulo no está en el repositorio, que es público: se comparte por fuera.

Las tablas del caso Carlos Díaz y de BICRED son ejemplos, no referencia: BICRED usa aproximaciones. Que una cifra no coincida con ellas no es un error.

**Commits del prototipo**

| Commit | Qué contiene |
| --- | --- |
| [`4fee799`](https://github.com/coyane/risktech/commit/4fee799a77c46521a116a5de743372b9684b9965) | Las tres fórmulas corregidas (GIF, renta bruta, renta neta), el rótulo "mensual", los conceptos en cero nombrados, el código 158 en los datos y las pruebas contra las fórmulas escritas. También la tabla de propiedades con entidad, deuda y plazo |
| [`ba6f023`](https://github.com/coyane/risktech/commit/ba6f0234a2e2cb8f2098735dc9343c95f223b943) | Reglas confirmadas en la primera reunión: deuda de origen por institución, tope del Art. 55 bis, factores 1 a 5 y pestaña Crédito |
| [`cfff575`](https://github.com/coyane/risktech/commit/cfff5752e7a12b1f9ee07ab39961bc079402ed12) | Catálogo de las 21 fórmulas (`docs/sprint-2-formulas-del-metodo.md`) |

Estos commits son del prototipo de front (`coyane/risktech`). No demuestran la implementación del motor del backend: cada ticket debe registrar el repositorio y el commit del motor cuando se haga.

**Dónde se ve en el prototipo**

Entrar a `/diagnostico` con el caso de ejemplo. Cada cálculo tiene dirección propia:

| Cálculo | Dirección |
| --- | --- |
| Total de orígenes de renta | `/diagnostico#calc-total-origenes` |
| Base imponible | `/diagnostico#calc-base-imponible` |
| Tasa efectiva | `/diagnostico#calc-tasa-efectiva` |
| Renta financiera bruta | `/diagnostico#calc-renta-bruta` |
| Renta financiera neta | `/diagnostico#calc-renta-neta` |
| RFN mensual | `/diagnostico#calc-rfn-mensual` |
| Límite hipotecario mensual | `/diagnostico#calc-limite-hipotecario` |
| Códigos del F22 (incluido el 158) | `/diagnostico#datos-renta` |
| Propiedades por rol y financiamiento | `/diagnostico#datos-propiedades` |
| Activos, patrimonio, pasivos y Ley 20.455 | `/diagnostico#calc-prop-activos`, `#calc-prop-patrimonio`, `#calc-prop-pasivos`, `#calc-ley-20455` |
| Deuda por institución | `/diagnostico#calc-deuda-institucion` |

Cada cálculo muestra su operación con los códigos del F22 que usa, su folio y su estado.

**Convenciones comunes a los cuatro tickets**

- `Cnnn` es el código nnn del Formulario 22 del año tributario.
- En un F22 capturado, un código que no aparece vale **0**. Un año **sin declaración** no es un año en cero: sus cálculos muestran "Sin declaración ese año". Una **captura fallida** tampoco se convierte en ceros.
- `R(x)` = redondeo al peso en cada paso: entero más cercano, empates hacia arriba (`R(1,5) = 2`, `R(−1,5) = −1`), como `Math.round` de JavaScript. El motor debe usar la misma regla para que motor y prototipo coincidan al peso.
- La tasa efectiva se usa **exacta**, sin redondear. Solo se redondean montos.
- Si un divisor es cero, el cálculo muestra "No se puede calcular: … es 0" y todo lo que depende de él queda sin valor. Nunca `NaN`, `Infinity` ni un valor por defecto.

**Caso de prueba común**

Un solo juego de valores sintéticos, con todos los términos distintos de cero, para probar las fórmulas de punta a punta:

| Código | Qué es | Valor |
| --- | --- | --- |
| C158 | Total ingresos brutos afectos | 120.000 |
| C106 | Gastos rechazados | 10.000 |
| C108 | Rentas presuntas | 5.000 |
| C494 | Gastos presuntos de honorarios | 15.000 |
| C465 | Gastos efectivos de honorarios | 0 |
| C157 | Impuesto global complementario determinado | 20.000 |
| C170 | Base imponible | 100.000 |

---

## REM-46 · [SII-10] Extraer el código 158 del F22

**Problema**
Las fórmulas de total de orígenes y de renta financiera bruta parten del código 158. El conector lo guardaba sin usarlo y el caso de ejemplo no lo trae (en el prototipo es ilustrativo: igual a la suma de los orígenes de renta).

**Qué extraer**
De la versión compacta del Formulario 22 de cada año tributario (sii.cl → Servicios Online → Declaración de Renta → Corregir o rectificar declaración → año → Consultar → Formulario 22 → Versión compacta):

| Código | Lo usa |
| --- | --- |
| C158 | REM-41 (total de orígenes) |
| C106, C108 | REM-41 (total de orígenes) |
| C494 | REM-40 (renta financiera bruta) |
| C465 | Control de consistencia con el 494 |
| C157, C170 | REM-40 (tasa efectiva); C170 también en la base imponible |

Por cada código se guarda: año tributario, formulario, código, valor con su signo, folio y fecha de extracción.

**Reglas**
- Código ausente en un F22 capturado → 0.
- Año sin declaración o captura fallida → sin valor y con su causa. Nunca ceros.
- No reconstruir el 158 sumando otros códigos.

**Criterios de aceptación**
- [ ] Con un RUT de prueba, en un entorno privado, los siete códigos quedan guardados para cada año capturado, con folio y fecha.
- [ ] Con C106, C108 y C494 distintos de cero, los valores llegan al motor sin pérdida.
- [ ] Un código ausente queda en 0; un año sin declaración queda sin valor y lo dice.
- [ ] El C158 que usa el motor viene del F22, no del valor ilustrativo del prototipo.

**Evidencia en el prototipo**
- El código 158 en los datos del caso: [`demo.json`, línea 1187](https://github.com/coyane/risktech/blob/4fee799a77c46521a116a5de743372b9684b9965/src/data/demo.json#L1187) (ilustrativo).
- Se ve en `/diagnostico#datos-renta`, tabla "Otros códigos usados por el método", con la marca "Se usa en: Total de orígenes de renta".

**Registrar al cerrar:** repositorio y commit del conector.

---

## REM-41 · [CAL-13] Total de orígenes de renta = C158 − (C106 + C108)

**Problema**
El motor calculaba el total de orígenes sumando los 14 códigos de orígenes de renta. El método lo define como el **GIF**: los ingresos brutos afectos sin las rentas nominales, que no son flujo de dinero.

**Fórmula**

```
Total de orígenes de renta (GIF) = R( C158 − (C106 + C108) )
```

| Término | Qué es | Por qué |
| --- | --- | --- |
| C158 | Total ingresos brutos afectos | Punto de partida del método |
| C106 | Gastos rechazados | Renta nominal: no es flujo de dinero |
| C108 | Rentas presuntas | Renta nominal: no es flujo de dinero |

Fuente: Capítulo IV, página 5. Confirmado por Ricardo el 19 de octubre.

**Lo que usa este resultado**

```
Base imponible = R( Total de orígenes − Total de rebajas )
```

Se compara con el C170 declarado. Si no coinciden, el informe muestra la diferencia; **nunca reemplaza el C170**. Confirmado por Ricardo el 19 de octubre.

El total de orígenes también es el punto de partida de la renta financiera bruta (REM-40).

**Criterios de aceptación**
- [ ] Caso común: C158 = 120.000, C106 = 10.000, C108 = 5.000 → **total = 105.000**.
- [ ] Con C106 = C108 = 0, el total es igual al C158.
- [ ] Cambiar los arriendos (C955), las rentas exentas (C152) u otro código de orígenes, sin tocar C158, C106 ni C108, **no cambia** el total.
- [ ] Un año sin declaración muestra "Sin declaración ese año".
- [ ] Si total − rebajas no coincide con el C170, se conserva el C170 y se informa la diferencia.
- [ ] La operación del informe muestra los tres códigos como datos del SII, con su folio.

**Evidencia en el prototipo** (commit [`4fee799`](https://github.com/coyane/risktech/commit/4fee799a77c46521a116a5de743372b9684b9965))
- Fórmula: [`calculos.ts`, líneas 302–327](https://github.com/coyane/risktech/blob/4fee799a77c46521a116a5de743372b9684b9965/src/lib/calculos.ts#L302-L327).
- Base imponible: [`calculos.ts`, líneas 354–380](https://github.com/coyane/risktech/blob/4fee799a77c46521a116a5de743372b9684b9965/src/lib/calculos.ts#L354-L380).
- Prueba con 158, 106 y 108 distintos de cero: [`calculos.test.ts`, línea 35](https://github.com/coyane/risktech/blob/4fee799a77c46521a116a5de743372b9684b9965/src/lib/__tests__/calculos.test.ts#L35).
- En pantalla: `/diagnostico#calc-total-origenes` y `/diagnostico#calc-base-imponible`.

**Depende de:** REM-46. **Registrar al cerrar:** repositorio y commit del motor.

---

## REM-40 · [CAL-12] Renta financiera bruta y neta según el Capítulo IV

**Problema**
El motor calculaba la renta financiera bruta como total − C955 − C152 + C494, y la neta multiplicando la bruta por 0,90 o 0,80 según la tasa efectiva. Las dos reglas se dedujeron de las tablas de BICRED. Ricardo indicó el 19 de octubre que el factor 0,90 / 0,80 "no tiene ningún asidero" y que valen las fórmulas escritas.

**Fórmulas, en orden de cálculo**

| Paso | Resultado | Fórmula | Fuente |
| --- | --- | --- | --- |
| 1 | Renta financiera bruta (RFB) | `R( Total de orígenes + C494 )` | Cap. IV p. 5 y 6; reunión 19/10 |
| 2 | Tasa efectiva `t` | `C157 ÷ C170`, sin redondear | Cap. IV p. 6 |
| 3 | Renta financiera neta (RFN) | `R( RFB × (1 − t) )` | Cap. IV p. 6; reunión 19/10 |
| 4 | RFN mensual | `R( RFN ÷ 12 )` | Cap. IV p. 6 |
| 5 | Límite capacidad crédito hipotecario mensual | `R( RFN mensual × 0,25 )` | Cap. IV p. 6 |
| 6 | Límite capacidad crédito automotriz | `R( RFN mensual × 0,07 )` | Cap. IV p. 6 |

Detalle de cada término:

- **C494 (gastos presuntos de honorarios).** Es mayor que cero solo si la persona emite boletas con gasto presunto: el SII le descontó 30% de sus honorarios (tope 15 UTA) y se suma para volver al ingreso real. Con gasto efectivo (C465) vale 0 y no cambia nada. Se suma el valor registrado, una vez; no se recalcula el 30%.
- **C465 no se suma nunca.** Si C494 y C465 vienen los dos mayores que cero, es una inconsistencia de datos: se informa y no se elige un régimen automáticamente.
- **No se restan C955 ni C152.** Los arriendos y las rentas exentas no entran por separado: lo que corresponda ya está dentro del C158.
- **Los factores 0,25 y 0,07 son políticas de referencia**, como aclaró Ricardo: cada institución puede usar otro porcentaje. Viven como parámetros, no en el código.
- **Lo que depende de la RFN se recalcula desde la nueva:** Credit Capacity, Credit Capacity en UF y factor leverage. Sus fórmulas no cambian.

La página 5 del capítulo trae también `IFN = GIF bruto ajustado − C157`. **No se usa:** la fórmula validada es la de la página 6. Con el caso común las dos dan resultados distintos (100.000 y 96.000), y la prueba lo debe distinguir.

**Criterios de aceptación**
- [ ] Caso común: total de orígenes = 105.000 (REM-41) y C494 = 15.000 → **RFB = 120.000**.
- [ ] `t = 20.000 ÷ 100.000 = 0,2` → **RFN = 96.000** (no 100.000, que sería bruta − C157).
- [ ] **RFN mensual = 8.000**, **límite hipotecario mensual = 2.000**, **límite automotriz = 560**.
- [ ] Con C494 = 0 y C465 = 15.000: RFB = 105.000 y RFN = 84.000. El C465 no se suma.
- [ ] Con C494 y C465 los dos mayores que cero, se informa la inconsistencia.
- [ ] Cambiar C955 o C152 sin tocar C158, C106, C108 y C494 no cambia ni la RFB ni la RFN.
- [ ] Con C170 = 0: la tasa efectiva y todo lo que sigue (RFN, mensual, límites, Credit Capacity) muestran "No se puede calcular: la base imponible es 0". La RFB sí se calcula.
- [ ] Redondeo: con RFB = 100, C157 = 1 y C170 = 3 → RFN = 67 y RFN mensual = 6. Solo se redondean montos, no la tasa.
- [ ] Con C494 = 0, la RFB es igual al total de orígenes.
- [ ] El factor 0,90 / 0,80 y la lista de códigos que se restaban (955 y 152) ya no existen en reglas ni parámetros.
- [ ] Las pruebas comparan contra estas fórmulas, no contra las tablas de BICRED.

**Ejemplo con magnitudes reales** (Carlos Díaz, AT 2025; C158 ilustrativo = 104.832.677; C106 = C108 = C494 = 0; C157 = 15.931.231; C170 = 99.322.241)

| Resultado | Operación | Valor |
| --- | --- | --- |
| RFB | 104.832.677 + 0 | $104.832.677 |
| Tasa efectiva | 15.931.231 ÷ 99.322.241 | 16,04% |
| RFN | 104.832.677 × (1 − 0,160399) | $88.017.575 |
| RFN mensual | 88.017.575 ÷ 12 | $7.334.798 |
| Límite hipotecario mensual | 7.334.798 × 0,25 | $1.833.700 |
| Límite automotriz | 7.334.798 × 0,07 | $513.436 |
| Credit Capacity (4%, 30 años) | valor presente de 1.833.700 en 360 meses | $384.089.077 |

Con las reglas anteriores, este mismo caso daba RFN $65.360.074 y Credit Capacity $285.216.668, las cifras de la tabla del capítulo. La diferencia es esperada.

**Evidencia en el prototipo** (commit [`4fee799`](https://github.com/coyane/risktech/commit/4fee799a77c46521a116a5de743372b9684b9965))
- Renta financiera bruta: [`calculos.ts`, líneas 411–435](https://github.com/coyane/risktech/blob/4fee799a77c46521a116a5de743372b9684b9965/src/lib/calculos.ts#L411-L435).
- Renta financiera neta: [`calculos.ts`, líneas 436–465](https://github.com/coyane/risktech/blob/4fee799a77c46521a116a5de743372b9684b9965/src/lib/calculos.ts#L436-L465).
- RFN mensual y límites: [`calculos.ts`, líneas 466–531](https://github.com/coyane/risktech/blob/4fee799a77c46521a116a5de743372b9684b9965/src/lib/calculos.ts#L466-L531).
- Pruebas de las fórmulas: [`calculos.test.ts`, líneas 21–60](https://github.com/coyane/risktech/blob/4fee799a77c46521a116a5de743372b9684b9965/src/lib/__tests__/calculos.test.ts#L21-L60).
- Conceptos en cero nombrados en la operación: [`Equation.tsx`, línea 79](https://github.com/coyane/risktech/blob/4fee799a77c46521a116a5de743372b9684b9965/src/components/diagnostico/Equation.tsx#L79).
- En pantalla: `/diagnostico#calc-renta-bruta`, `#calc-renta-neta`, `#calc-rfn-mensual` y `#calc-limite-hipotecario`. El Credit Capacity, en la pestaña Crédito (`/diagnostico#credito`).

El prototipo todavía no informa la inconsistencia entre C494 y C465: ese criterio es solo para el motor.

**Depende de:** REM-41. **Registrar al cerrar:** repositorio y commit del motor.

---

## REM-43 · [CAL-15] Revisión de Ricardo de las fórmulas de bienes raíces

**Problema**
Ricardo validó todas las fórmulas del catálogo salvo las de bienes raíces. El Capítulo IV muestra los resultados de bienes raíces del caso (página 7, Bloque 2), pero no escribe las fórmulas generales. Estas salieron del Informe de Apertura de BICRED y hay que confirmarlas.

**Fórmulas a revisar**

| N° | Cálculo | Fórmula actual | Fuente actual | Estado |
| --- | --- | --- | --- | --- |
| 17 | Activos | `Σ enajenación UF` de cada propiedad | Bloque 2 del capítulo y BICRED (resultado, no fórmula) | Por revisar |
| 18 | Patrimonio | `Σ pago al contado UF` de cada propiedad | Igual que 17 | Por revisar |
| 19 | Pasivos de origen | `Activos − Patrimonio` | Igual que 17 | Por revisar |
| 20 | Adquisición sin Ley 20.455 | `Activos − Σ enajenación UF` de las propiedades acogidas | Informe de Apertura de BICRED | Por revisar |
| 21 | Deuda de origen por institución | Por propiedad `enajenación UF − pago al contado UF`; se suma por la entidad que financió; parte = deuda de la institución ÷ deuda total | Reunión del 7/10 y vista de BICRED | **Validado** |
| — | Leverage por institución y total | Deuda de la institución ÷ un número que falta definir | — | Por determinar |
| — | Recomendación sobre la Ley 20.455 | ¿Texto fijo o regla? | — | Por determinar |

Reglas que ya aplica el prototipo y que también se revisan:
- Las sumas consideran solo las propiedades con el dato informado. Si ninguna lo trae, el total queda desconocido, no en cero.
- Una propiedad con deuda y sin institución informada va en el grupo "Sin institución informada".
- Si la deuda total es 0, la parte de cada institución no se calcula.

**Ejemplo para revisar**

| Propiedad | Enajenación UF | Pago contado UF | Entidad | Ley 20.455 |
| --- | --- | --- | --- | --- |
| P1 | 5.000 | 1.000 | Banco A | Sí |
| P2 | 3.000 | 3.000 | — (sin crédito) | No |
| P3 | 2.000 | 500 | Banco B | No |

| N° | Resultado | Operación | Valor |
| --- | --- | --- | --- |
| 17 | Activos | 5.000 + 3.000 + 2.000 | 10.000 UF |
| 18 | Patrimonio | 1.000 + 3.000 + 500 | 4.500 UF |
| 19 | Pasivos de origen | 10.000 − 4.500 | 5.500 UF |
| 20 | Adquisición sin Ley 20.455 | 10.000 − 5.000 | 5.000 UF |
| 21 | Deuda Banco A | 5.000 − 1.000 | 4.000 UF (72,7%) |
| 21 | Deuda Banco B | 2.000 − 500 | 1.500 UF (27,3%) |

**Preguntas para Ricardo**
1. ¿Las fórmulas 17 a 20 son correctas como están?
2. Leverage por institución: ¿por qué número se divide la deuda de cada institución, y con la UF de qué fecha? BICRED muestra un leverage total de 8,8 para una deuda de 18.426,4 UF, sin decir cómo se calcula.
3. Recomendación sobre la Ley 20.455: ¿es un texto fijo para todos los casos o depende de una regla?

**Criterios de aceptación**
- [ ] Las fórmulas 17 a 20 quedan confirmadas, corregidas o descartadas, con la fecha y la fuente de la decisión.
- [ ] El leverage por institución tiene fórmula completa, o queda registrado que no entra en esta fase.
- [ ] La recomendación de la Ley 20.455 queda definida como texto fijo, regla o fuera de alcance.
- [ ] El catálogo (`docs/sprint-2-formulas-del-metodo.md`) y el informe muestran el estado final de cada una.

**Evidencia en el prototipo**
- Fórmulas 17 a 20: [`calculos.ts`, desde la línea 788](https://github.com/coyane/risktech/blob/4fee799a77c46521a116a5de743372b9684b9965/src/lib/calculos.ts#L788) (commit `4fee799`).
- Deuda por institución: [`patrimonio.ts`, líneas 57–102](https://github.com/coyane/risktech/blob/4fee799a77c46521a116a5de743372b9684b9965/src/lib/patrimonio.ts#L57-L102) y [`calculos.ts`, desde la línea 900](https://github.com/coyane/risktech/blob/4fee799a77c46521a116a5de743372b9684b9965/src/lib/calculos.ts#L900); se incorporó en [`ba6f023`](https://github.com/coyane/risktech/commit/ba6f0234a2e2cb8f2098735dc9343c95f223b943).
- Tabla por rol con entidad, deuda y plazo, financiamiento por institución y ficha registral: [`PatrimonySection.tsx`](https://github.com/coyane/risktech/blob/4fee799a77c46521a116a5de743372b9684b9965/src/components/numbers/PatrimonySection.tsx) (commit `4fee799`).
- En pantalla: `/diagnostico#datos-propiedades`, `/diagnostico#calc-prop-activos` y `/diagnostico#calc-deuda-institucion`.

**Responsable de la decisión:** Ricardo. **Seguimiento:** Marcos. **Auditoría:** Savka.
