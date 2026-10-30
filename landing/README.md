# Landing de Innovacred (Astro)

Port de la landing V2 Expediente (ticket S3-11 / REM-59). Proyecto aparte de la app: tiene su propio
`package.json` y `node_modules`, y la raíz del repositorio lo excluye de `oxlint` y `vitest`.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run check` | `astro check` (tipos de `.astro` y `.ts`) |
| `npm run build` | Sitio estático en `dist/` |
| `npm run preview` | Sirve `dist/` |
| `npm test` | Compila, sirve y recorre la landing en Chrome a 1440 y 375 px |

## Variables (se leen al compilar; ver `.env.example`)

| Variable | Por defecto | Para qué |
| --- | --- | --- |
| `PUBLIC_SITE_URL` | `https://innovacred.example` (marcador) | Canonical, Open Graph, sitemap y llms.txt |
| `PUBLIC_INDEXABLE` | `false` | `false`: todo en `noindex`, `robots.txt` con `Disallow: /` y sitemap vacío. `true`: se indexa la landing; el ingreso sigue en `noindex` |
| `PUBLIC_APP_URL` | `http://localhost:5173/` | Adónde lleva "Conectar con el SII" |

No se pasa `PUBLIC_INDEXABLE` a `true` mientras queden afirmaciones `[por confirmar]` en la página.

El ingreso no envía ni guarda la clave: los campos no tienen `name`, el botón solo se habilita con
JavaScript y, al conectar, se borra la clave y se navega a `PUBLIC_APP_URL` sin parámetros.

Requiere Node 22.12 o superior (Astro 6).
