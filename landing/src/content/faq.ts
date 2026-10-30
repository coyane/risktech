/**
 * Preguntas de la landing. La sección visible y el FAQPage (JSON-LD) salen de esta misma lista,
 * así el dato estructurado repite literalmente lo que se ve.
 * `pending` es el rótulo [por confirmar] que acompaña a la respuesta: esas preguntas se muestran
 * igual en la página, pero no entran al FAQPage ni a llms.txt, porque su respuesta no está cerrada.
 */
export type Faq = { q: string; a: string; pending?: string }

export const FAQS: readonly Faq[] = [
  {
    q: '¿Por qué necesitan mi clave tributaria?',
    a: 'Tus declaraciones y tus propiedades están en tu sesión de sii.cl. La clave abre esa sesión para leerlas; se usa solo durante la extracción y no se almacena.',
  },
  {
    q: '¿El informe me dice si califico para un crédito?',
    a: 'No. Calcula cifras a partir de lo que declaraste y muestra cómo se obtuvo cada una. No evalúa ni aprueba: cada institución decide con sus propias reglas.',
  },
  {
    q: '¿Por qué leen el F29 y el F50 si no entran en el resumen?',
    a: 'Para que tu informe muestre tus declaraciones mensuales junto a las anuales, en Datos del SII. Hoy ninguna cifra del resumen sale de ellos.',
    pending: '[por confirmar: cálculos que los usarán]',
  },
  {
    q: '¿Qué pasa si falta una declaración?',
    a: 'Queda como faltante en esa fuente y los cálculos que la necesitan lo dicen. No se inventa ningún dato.',
  },
  {
    q: '¿Qué UF se usa?',
    a: 'La que informa el SII para cada día. El informe muestra el valor y la fecha que usa cada cálculo.',
  },
  {
    q: '¿Cuánto demora?',
    a: 'Unos minutos. Puedes dejar la pantalla abierta y ver el avance de cada fuente.',
  },
]

/** Solo las preguntas con respuesta cerrada. */
export const CONFIRMED_FAQS = FAQS.filter((f) => !f.pending)
