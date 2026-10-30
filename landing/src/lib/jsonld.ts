import { BRAND } from './site'
import { CONFIRMED_FAQS } from '../content/faq'

/**
 * Datos estructurados de la landing. Sin nada que no esté en la página: Organization y WebSite
 * llevan solo el nombre y la URL (no hay razón social, dirección, contacto ni perfiles confirmados).
 * FAQPage repite literalmente las preguntas visibles cuya respuesta no tiene [por confirmar].
 */
export function homeJsonLd(siteUrl: string, pageUrl: string) {
  const org = `${siteUrl}#organizacion`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': org, name: BRAND, url: siteUrl },
      { '@type': 'WebSite', '@id': `${siteUrl}#sitio`, name: BRAND, url: siteUrl, inLanguage: 'es-CL', publisher: { '@id': org } },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#preguntas`,
        url: pageUrl,
        inLanguage: 'es-CL',
        mainEntity: CONFIRMED_FAQS.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }
}

/** JSON listo para ir dentro de <script type="application/ld+json">, sin poder cerrar la etiqueta. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
