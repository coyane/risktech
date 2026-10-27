# Innovacred: contexto de producto

Innovacred es el nombre de la plataforma (antes CEFT; el repositorio y las carpetas siguen llamándose Risktech y `risktech-ceft`). Este documento dice qué es el producto, para quién y qué reglas no se negocian. El plan de trabajo vigente está en `docs/sprint-1-v2-diagnostico-base-y-backoffice.md`; cómo construir la interfaz, en `docs/ui.md`.

## Problema

Lo que una persona tiene declarado en el SII (rentas, impuestos, propiedades) define cuánto crédito puede obtener, pero está repartido en formularios con códigos que casi nadie entiende. Hoy esa lectura la hace un especialista a mano, con el Método ICRED y su herramienta BICRED.

## Usuarios

| Usuario | Qué necesita |
| --- | --- |
| Persona natural (cliente) | Entender su situación con sus propios datos, sin saber de impuestos, y llevarle un documento a un banco |
| Banco o institución | Un informe en el que cada cifra se pueda seguir hasta el formulario y el código de origen |
| Equipo interno | Ver quiénes han entrado y cómo se compone el portafolio |
| Ricardo (dueño del método) | Que el sistema calcule como su método y deje a la vista lo que aún no está validado |

## Propuesta de valor

La persona conecta su RUT y clave tributaria, el sistema extrae sus fuentes del SII y entrega el **Diagnóstico Base**: sus cifras principales y cada cálculo explicado, con la operación a la vista y la fuente de cada dato. La meta es que algo tan ilegible como un electrocardiograma se lea como una respuesta simple, sin perder el respaldo técnico.

## Alcance

| Fase | Contenido | Estado |
| --- | --- | --- |
| 1 | Conexión con el SII, extracción, Diagnóstico Base y backoffice (Propietarios y Radiografía) | Front construido con datos de ejemplo; backend por construir |
| 1 (complemento) | Informe de deudas de la CMF: la persona lo saca por fuera y lo carga; se verifica con su código QR y, si es válido, se muestra y se imprime tal cual al final de la carpeta | Front construido con la verificación simulada; backend por construir |
| Siguiente | Agente del cliente (hallazgos y mesa de trabajo) y agente del portafolio | Front visible como "Próximamente"; sin conexión a un modelo |

Este repositorio es un prototipo de front: no tiene backend, no consulta el SII y no envía credenciales.

## Complemento: informe de deudas de la CMF

Opcional y recomendado: completa la carpeta crediticia digital (el PDF del informe). **No entra en ningún cálculo ni se interpreta**, y no cuenta como pendiente.

- **Fuente:** el informe de deudas del sistema financiero de la Comisión para el Mercado Financiero (CMF), en `https://conocetudeuda.cmfchile.cl/informe-deudas/` (la raíz del sitio redirige ahí). Respaldo: [ficha de ChileAtiende](https://www.chileatiende.gob.cl/fichas/2614-informe-de-deudas-del-sistema-financiero).
- **Trámite (persona natural, gratis):** entrar al portal, autenticarse con ClaveÚnica, confirmar la identidad con un código que llega al correo y descargar el PDF. Requisitos: ClaveÚnica y cédula de identidad. Contiene las deudas con entidades supervisadas por la CMF; se actualiza semanalmente, con un desfase de 10 a 20 días. Personas jurídicas: otro trámite, por Atención en línea de la CMF, con respuesta al correo en hasta 10 días hábiles.
- **En Innovacred:** la persona carga el PDF en `#deudas`. El backend lee el código QR del informe y valida con la CMF que sea legítimo (decisión del usuario, 27-10-2026). **Solo un documento verificado entra a la carpeta**; si falla por el documento (sin QR, QR que no es de la CMF o contenido que no coincide) se rechaza y no se guarda; si falla el servicio, se ofrece reintentar. Contrato: `docs/contrato-verificacion-informe-deudas.md`. En la demo la verificación es simulada y lo dice; el archivo se lee solo en el navegador y se pierde al recargar. El portal de la CMF bloquea navegadores automatizados: no se automatiza ni se evade.
- **Por confirmar:** qué contiene el código QR y contra qué servicio de la CMF se valida; qué se envía al backend (el PDF o solo el QR) y dónde y cómo se guarda (almacenamiento, cifrado, retención y consentimiento).

## Conceptos del negocio

- **Año tributario (AT):** el año en que se declara lo ganado el año anterior.
- **F22, F29, F50:** declaración anual de renta, declaración mensual de IVA y declaración mensual de otros impuestos.
- **Base imponible (código 170) e impuesto determinado (código 157):** los dos datos del F22 de los que sale la tasa efectiva.
- **Renta financiera bruta y neta:** la renta que el método considera ingreso personal, antes y después del factor de renta neta.
- **Límite hipotecario:** 25% de la renta financiera neta mensual; es el dividendo de referencia.
- **Credit Capacity:** el crédito que paga ese dividendo a una tasa y un plazo dados. No hay tasa ni plazo únicos.
- **Factor leverage:** cuántas veces el Credit Capacity está dispuesta a financiar una institución.
- **Deuda de origen:** enajenación menos pago al contado de cada propiedad. No es la deuda vigente.

Las fórmulas, su estado y su evidencia están en el sprint.

## Reglas de producto

Vienen de decisiones explícitas de Cristóbal y de Ricardo. Cambiarlas requiere que lo pidan ellos.

1. **El informe es determinístico y no interpreta.** Sin semáforo, sin adjetivos, sin texto generado. Dos personas con las mismas cifras reciben el mismo informe. Entre personas solo cambian números, fechas y nombres propios. La variación entre años se permite **como dato** ("+11,9% vs AT 2024", "+1,48 pts vs AT 2024"), en color neutro, sin flechas ni palabras que evalúen, y con un botón que la oculta; nunca como evaluación (decisión del usuario, 26-10-2026).
2. **No se inventan fórmulas.** Se implementa lo que está en los documentos del método o lo que se deduce de sus casos, y lo deducido queda como "por confirmar" hasta que Ricardo lo valide.
3. **Lo pendiente se muestra, no se oculta.** Todo cálculo lleva su estado: calculado, por confirmar o por determinar. Sale del informe solo lo que Ricardo descarta.
4. **Cada cifra se puede seguir hasta su origen:** operación completa y, por cada dato, formulario, código, año y folio.
5. **Lo que está fuera de fase queda visible** y completo, con la etiqueta "Próximamente". No se elimina ni se esconde algo que ya se mostró funcionando sin confirmarlo antes.
6. **Simple no es plano.** Lenguaje para alguien sin formación técnica, con el respaldo completo para quien sí la tiene.
7. **La interfaz habla del cálculo y de su origen, no de un método.** Ningún texto visible (pantalla, PDF ni CSV) nombra el Método ICRED, el Capítulo IV, "el método", sus reglas o casos de referencia: se dice qué es el cálculo, cómo se hace y de qué formulario, código y año sale cada dato. Los estados se explican igual: por confirmar es "falta confirmar un dato o un supuesto de este cálculo". La documentación interna sí puede nombrar el método. Hay una prueba del registro que lo verifica.
8. **Datos reales de terceros, solo anonimizados.** En el repositorio van cifras por código y año; nunca nombre, RUT, roles ni sociedades. El repositorio es público.
9. **La UF es la que informa el SII para cada día.** No se escribe a mano ni se aproxima.
10. **La clave tributaria no se guarda** en disco, logs ni respuestas.

## Restricciones

- El SII puede exigir CAPTCHA o segundo factor. No se evade: la captura se detiene y se explica.
- Las reglas del método cambian con el tiempo: viven como parámetros versionados, no en el código.
- El informe debe servir en pantalla y como PDF.

## Criterios de éxito de la fase 1

Están en el sprint, sección "Criterio de terminado". En corto: reproducir los casos de referencia, completar el recorrido con un RUT real en menos de 10 minutos y que ninguna frase del informe dependa del caso.

## No objetivos

- Recomendar productos, aprobar créditos o emitir un documento oficial.
- Análisis contable: asiento de apertura, valor depreciable, IVA y estado de resultados.
- Declaraciones juradas, RCV, DTE y balance tributario, por ahora.

## Lo que aún no se sabe

La lista vigente está en el sprint, sección "Pendientes del método para Ricardo". Lo más importante hoy: la fórmula exacta de la renta financiera bruta, el divisor del leverage por institución y la fecha de la UF del Credit Capacity.
