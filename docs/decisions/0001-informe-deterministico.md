# 0001 · El informe es determinístico y sale de un registro de cálculos

Octubre de 2026

## Contexto

La primera versión del Diagnóstico Base interpretaba las cifras: semáforo con umbrales propuestos por el equipo y frases que cambiaban según el caso. Con miles de personas distintas, cualquier frase condicional puede salir mal y nadie la revisa.

## Decisión

El informe muestra solo datos del SII y cálculos explicados. Todo su contenido sale de un registro único (`src/lib/calculos.ts`): cada cálculo es una función pura con definición fija, una sola plantilla de frase, su operación, sus fuentes y un estado (calculado, por confirmar, por determinar). La interfaz recorre el registro y no redacta.

## Alternativas

- Mantener la interpretación con umbrales validados por el método: sigue dependiendo del caso.
- Generar el texto con un modelo: no es reproducible ni auditable.

## Consecuencias

- Una frase nueva se agrega al registro, nunca a un componente.
- Una prueba genera 1.000 reportes al azar y falla si alguna salida trae valores rotos o una frase fuera de su plantilla.
- La interpretación queda para el agente, que es otra sección y otra fase.
