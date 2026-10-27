# Spec · Pestaña Propiedades

Octubre de 2026 · Flujo de feature mediana de `AGENTS.md`, hecho a mano en Markdown (Spec Kit no está instalado).

## Qué y para quién

Una pestaña propia del Diagnóstico Base que reúne todo lo de bienes raíces, hoy repartido entre "Cálculos" (grupos Propiedades y Análisis inmobiliario) y "Datos del SII → Propiedades". Toma como referencia la vista de propiedades de BICRED, con más profundidad y con el mismo criterio del informe: datos del SII y cálculos explicados, sin interpretación.

- **Persona:** ver cuánto costaron sus propiedades, cuánto pagó y cuánto financió, con quién, y de dónde sale cada cifra.
- **Banco:** la misma información con trazabilidad hasta "Mis Bienes" del SII.

## Requisitos

- **R1** Pestaña "Propiedades" entre "Crédito" y "Datos del SII", con dirección propia (`#propiedades`).
- **R2** Cifras principales: cantidad de propiedades (y cuántas con crédito), avalúo fiscal total, activos, patrimonio y pasivos de origen en UF.
- **R3** Cómo se pagaron: una barra que divide los activos en lo pagado al contado (patrimonio) y lo financiado (pasivos), con monto y porcentaje escritos en cada parte.
- **R4** Deuda de origen por institución: barras ordenadas de mayor a menor, con deuda en UF, parte del total y cantidad de propiedades escritas en cada fila.
- **R5** Leverage por institución: visible como "Por determinar", con lo que falta. No se muestra ningún número de leverage.
- **R6** Propiedades por destino y por comuna: conteos.
- **R7** Tabla por rol (con entidad, deuda y plazo) y ficha registral completa, como hoy.
- **R8** Cómo se calcula: los cálculos 17 a 21 y los dos puntos por determinar, uno a la vez, con la misma pieza de bloque de cálculo del resto del informe.
- **R9** Los enlaces existentes siguen funcionando: `#patrimonio`, `#datos-propiedades`, `#calc-prop-activos` y los demás cálculos de propiedades llevan a la nueva pestaña.
- **R10** En "Cálculos", los cálculos 17 a 21 siguen listados con su número, y al elegirlos llevan a la pestaña Propiedades.
- **R11** El PDF incluye la pestaña completa.

## Estados

- Sin propiedades inscritas: la pestaña lo dice; las barras y la tabla no se muestran.
- Bienes raíces no capturados (captura parcial): lo dice, y aclara que no significa que no existan propiedades.
- Dato faltante en una propiedad: raya; los totales suman solo lo informado.

## Criterios de aceptación

- **CA1** Con el caso de ejemplo, la pestaña muestra 9 propiedades, activos 35.728,07 UF, patrimonio 7.693,49 UF y pasivos 28.034,58 UF.
- **CA2** La barra de pago muestra los dos montos y sus porcentajes, que suman 100%.
- **CA3** Las barras por institución muestran 3 instituciones, ordenadas de mayor a menor deuda, y la suma de sus deudas es igual a los pasivos.
- **CA4** El leverage aparece como "Por determinar", sin cifra.
- **CA5** `#calc-deuda-institucion` abre la pestaña Propiedades con ese cálculo a la vista.
- **CA6** `#datos-propiedades` y `#patrimonio` abren la pestaña Propiedades.
- **CA7** Sin desplazamiento horizontal a 375 y 1440 px; sin errores de consola.
- **CA8** En impresión, la pestaña aparece completa.

## No objetivos

- Calcular el leverage (falta el divisor; REM-43).
- Cambiar las fórmulas 17 a 21 (pendientes de revisión de Ricardo, REM-43).
- Gráficos de torta.
