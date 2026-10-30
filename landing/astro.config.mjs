// @ts-check
import { defineConfig, envField } from 'astro/config'
import { loadEnv } from 'vite'

// Landing estática de Innovacred. No hay dominio confirmado: PUBLIC_SITE_URL trae un marcador
// (.example es un dominio reservado) y se reemplaza al publicar. Ver .env.example.
const DEFAULT_SITE = 'https://innovacred.example'
const fileEnv = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_')
const site = process.env.PUBLIC_SITE_URL || fileEnv.PUBLIC_SITE_URL || DEFAULT_SITE

export default defineConfig({
  site: new URL(site).origin,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  // Las tres variables se leen al compilar. PUBLIC_INDEXABLE en false deja todo en noindex
  // y robots.txt en Disallow: no se publica nada mientras queden afirmaciones "por confirmar".
  env: {
    schema: {
      PUBLIC_SITE_URL: envField.string({ context: 'client', access: 'public', url: true, default: DEFAULT_SITE }),
      PUBLIC_INDEXABLE: envField.boolean({ context: 'client', access: 'public', default: false }),
      PUBLIC_APP_URL: envField.string({ context: 'client', access: 'public', url: true, default: 'http://localhost:5173/' }),
    },
  },
  devToolbar: { enabled: false },
})
