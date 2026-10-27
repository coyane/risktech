# Tareas · Pestaña Propiedades

| ID | Tarea | Depende de | Evidencia |
| --- | --- | --- | --- |
| T1 | Vista y rutas: `propiedades`, fragmentos antiguos, sin subpestaña en Datos | — | Prueba CA5 y CA6 |
| T2 | `SplitBar` y barras por institución | — | Prueba CA2 y CA3 |
| T3 | Separar `PatrimonySection` | — | Tabla y ficha visibles en la pestaña |
| T4 | Sección en la página: cifras, pago, instituciones, leverage, destino y comuna, tabla, ficha, cálculos | T1, T2, T3 | Prueba CA1 y CA4 |
| T5 | Índice de Cálculos: entradas de propiedades sin explicación propia | T4 | Prueba R10 |
| T6 | Estilos, móvil e impresión | T4 | Prueba CA7 y CA8 |
| T7 | Pruebas de interfaz | T4–T6 | `npm run test:ui` |
| T8 | Documentación | T4 | `docs/ui.md` y página del sistema de diseño |
| T9 | Autorrevisión contra la spec (convergencia) | T1–T8 | Tabla requisito → evidencia en el cierre |

## Cierre: requisito → evidencia

Autorrevisión hecha al terminar (T9). Pruebas en `e2e/diagnostico.spec.ts`, describe "Propiedades", a 1440 y 375 px.

| Requisito | Evidencia | Estado |
| --- | --- | --- |
| R1, R9, CA5, CA6 | "los cálculos de propiedades se abren en esta pestaña" | Cumple |
| R2, CA1 | "reúne las cifras de bienes raíces del caso" | Cumple |
| R3, CA2 | "la barra de pago muestra los dos montos y sus porcentajes" | Cumple |
| R4, R5, CA3, CA4 | "la deuda por institución va de mayor a menor y suma los pasivos" | Cumple |
| R6 | Barras "Por destino" y "Por comuna" en la pestaña; revisado en capturas | Cumple, sin prueba propia |
| R7 | "cada propiedad muestra la entidad que la financió, por cuánto y a qué plazo" | Cumple |
| R8 | Subpestañas de cálculo; la prueba de enlaces abre "Deuda de origen por institución" | Cumple |
| R10 | Misma prueba: la fila `#calc-prop-activos` de Cálculos lleva a Propiedades | Cumple |
| R11, CA8 | "el PDF trae todas las vistas y no la navegación" | Cumple |
| CA7 | "ninguna vista se desplaza a lo ancho…" y "la pestaña no deja errores en la consola" | Cumple |
