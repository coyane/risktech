import type { APIRoute } from 'astro'
import { INDEXABLE, INDEXABLE_PATHS, absolute } from '../lib/site'

// Sitemap propio en vez de @astrojs/sitemap: hay una sola página indexable y así el sitemap
// sigue el mismo interruptor que robots.txt (vacío mientras PUBLIC_INDEXABLE sea false).
export const GET: APIRoute = ({ site }) => {
  const urls = INDEXABLE ? INDEXABLE_PATHS.map((p) => `  <url><loc>${absolute(p, site)}</loc></url>`) : []
  const body = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>', ''].join('\n')
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
