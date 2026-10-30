import type { APIRoute } from 'astro'
import { CONFIRMED_FAQS } from '../content/faq'
import { BRAND, ROUTES, absolute } from '../lib/site'

// llms.txt (llmstxt.org): resumen en Markdown de lo que la landing dice, con sus mismas frases.
// Lo que en la página está "por confirmar" va en su propia sección, rotulado igual.
export const GET: APIRoute = ({ site }) => {
  const url = (p: string) => absolute(p, site)
  const body = `# ${BRAND}

> Innovacred lee tus formularios del SII y los convierte en un Diagnóstico Base que se entiende: cada cifra con su operación y su origen.

Entras con tu RUT y tu clave tributaria. Innovacred lee cinco fuentes de tu cuenta del SII y las convierte en un solo informe: cuánto declaraste, tu tasa efectiva, tu renta neta al mes y el crédito que paga esa renta. El informe es referencial y no constituye una decisión tributaria ni crediticia. Las cifras de la página son de un caso de ejemplo.

## Páginas

- [Inicio](${url(ROUTES.home)}): qué hace la primera fase, lo que obtienes, cómo funciona, qué se lee y para qué, tu clave y tus datos, y preguntas.
- [Ingresar](${url(ROUTES.ingreso)}): las fichas que se leen de tu SII, la bitácora de tu clave y la autorización que firmas.

## Qué se lee y para qué

- F22, renta anual (últimos 4 años tributarios): ingresos declarados, rebajas, base imponible (código 170) e impuesto determinado (código 157). Alimenta casi todo el resumen: ingreso declarado, tasa efectiva, renta neta al mes, dividendo y crédito.
- F29, declaración mensual (últimos 24 meses): hoy no entra en ningún cálculo del resumen; se muestra en Datos del SII.
- F50, otros impuestos (últimos 24 meses): hoy no entra en ningún cálculo del resumen; se muestra en Datos del SII.
- Bienes raíces: rol, comuna, destino, avalúo fiscal, fecha y monto de compra, pago al contado e institución que financió. Alimenta activos, patrimonio, pasivos de origen y deuda de origen por institución (la deuda con que se compró, no la de hoy).
- Actividades económicas: giros vigentes. No entran en ningún cálculo; se muestran como dato.

## Cómo funciona

1. Ingresas y autorizas: tu RUT y tu clave tributaria, las mismas de sii.cl.
2. Se leen tus fuentes, una por una. Si el SII pide CAPTCHA o segundo factor, la lectura se detiene y se explica.
3. Se arma tu Diagnóstico Base: las mismas cifras dan el mismo informe, sin semáforos ni evaluaciones.
4. Revisas cada cifra hasta su origen y descargas el informe en PDF y CSV. El informe parte con 4,0% anual a 30 años y puedes cambiar la tasa y el plazo.

## Tu clave y tus datos

- La clave se usa solo durante la extracción y no se almacena.
- Tu clave viaja cifrada y nunca se guarda: ni en disco, ni en registros, ni en nuestros servidores.
- No se evaden CAPTCHA ni segundo factor.
- No aprueba créditos ni recomienda productos, y no es un documento oficial.

## Preguntas

${CONFIRMED_FAQS.map((f) => `### ${f.q}\n\n${f.a}`).join('\n\n')}

## Por confirmar

Estas afirmaciones aparecen en la página rotuladas como [por confirmar] y no deben citarse como hechos:

- Que no presenta ni modifica declaraciones en tu nombre.
- Que no se comparten tus datos con terceros sin tu autorización.
- Cumplimiento de la Ley 19.628 y de la Ley 21.719.
- Dónde y por cuánto tiempo se guardan las declaraciones leídas.
- Cómo y dónde revocar la autorización.
- Para qué cálculos se usarán el F29 y el F50.
- Razón social, contacto y textos legales.
`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
