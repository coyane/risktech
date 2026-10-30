import { PUBLIC_APP_URL, PUBLIC_INDEXABLE } from 'astro:env/client'

/** Nombre visible de la plataforma. */
export const BRAND = 'Innovacred'

/**
 * Interruptor de indexación. En false (por defecto) todas las páginas van en noindex,
 * robots.txt bloquea todo y el sitemap sale vacío. No se pasa a true mientras queden
 * afirmaciones "por confirmar" en la página (docs/sprint-3-rediseno-innovacred.md, S3-11).
 */
export const INDEXABLE: boolean = PUBLIC_INDEXABLE

/** Adónde lleva el botón del ingreso: la app del diagnóstico. */
export const APP_URL: string = PUBLIC_APP_URL

/** Rutas de la landing. El ingreso nunca se indexa. */
export const ROUTES = {
  home: '/',
  ingreso: '/ingresar/',
} as const

/** Páginas que pueden entrar al sitemap cuando INDEXABLE es true. */
export const INDEXABLE_PATHS: readonly string[] = [ROUTES.home]

/** URL absoluta a partir de `site` (astro.config.mjs). */
export function absolute(path: string, site: URL | undefined): string {
  if (!site) throw new Error('Falta `site` en astro.config.mjs (PUBLIC_SITE_URL).')
  return new URL(path, site).href
}
