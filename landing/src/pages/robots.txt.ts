import type { APIRoute } from 'astro'
import { INDEXABLE, absolute } from '../lib/site'

// Con PUBLIC_INDEXABLE en false (por defecto) se bloquea todo. Con true se permite todo:
// el ingreso no se bloquea aquí a propósito, para que los buscadores lean su noindex.
export const GET: APIRoute = ({ site }) => {
  const body = INDEXABLE
    ? `User-agent: *\nAllow: /\n\nSitemap: ${absolute('/sitemap.xml', site)}\n`
    : 'User-agent: *\nDisallow: /\n'
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
