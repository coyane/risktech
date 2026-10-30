import { expect, test, type Page } from '@playwright/test'

// Landing compilada con los valores por defecto (PUBLIC_INDEXABLE sin definir = false).
// Corre a 1440 y 375 px (proyectos de playwright.config.ts).

const PAGES = [
  { path: '/', h1: 'Tus números ya están en el SII. Aquí se entienden.' },
  { path: '/ingresar/', h1: 'Lo que se lee de tu SII, y por qué' },
]

function watchConsole(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  return errors
}

/** Desborde real: se quita el overflow-x:hidden del body, que lo escondería. */
async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    document.documentElement.style.overflowX = 'visible'
    document.body.style.overflowX = 'visible'
    return document.documentElement.scrollWidth - document.documentElement.clientWidth
  })
}

/** Recorre la página para que carguen las imágenes diferidas. */
async function scrollThrough(page: Page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < h; y += 700) await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
  await page.waitForLoadState('networkidle')
}

for (const p of PAGES) {
  test(`${p.path}: carga sin errores, sin desborde y con SEO básico`, async ({ page, baseURL }) => {
    const errors = watchConsole(page)
    const res = await page.goto(p.path, { waitUntil: 'networkidle' })
    expect(res?.status()).toBe(200)
    await scrollThrough(page)

    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CL')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toHaveText(p.h1)

    // Una sola jerarquía: ningún encabezado salta un nivel.
    const levels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((els) => els.map((e) => Number(e.tagName[1])))
    expect(levels[0]).toBe(1)
    levels.forEach((l, i) => { if (i > 0) expect(l - levels[i - 1]).toBeLessThanOrEqual(1) })

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(canonical).toMatch(/^https?:\/\//)
    expect(new URL(canonical!).pathname).toBe(p.path)
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'es_CL')
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https?:\/\/.+\.(jpg|png|webp)$/)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/)

    // Interruptor de indexación apagado por defecto: noindex en todas.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)

    // Toda imagen con dimensiones (sin saltos de diseño) y texto alternativo.
    const imgs = await page.locator('img').evaluateAll((els) => els.map((e) => ({ w: e.getAttribute('width'), h: e.getAttribute('height'), alt: e.getAttribute('alt'), ok: (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0 })))
    for (const img of imgs) {
      expect(img.w && img.h).toBeTruthy()
      expect(img.alt).toBeTruthy()
      expect(img.ok).toBe(true)
    }

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
    expect(errors, `errores de consola en ${baseURL}${p.path}`).toEqual([])
  })
}

test('la landing trae JSON-LD válido y el FAQPage repite las preguntas visibles', async ({ page }) => {
  await page.goto('/')
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(blocks.length).toBeGreaterThan(0)
  const data = blocks.map((b) => JSON.parse(b))
  const graph = data.flatMap((d) => d['@graph'] ?? [d])
  const types = graph.map((n: { '@type': string }) => n['@type'])
  expect(types).toEqual(expect.arrayContaining(['Organization', 'WebSite', 'FAQPage']))

  // Organization y WebSite: solo nombre y URL (más los identificadores del grafo).
  const org = graph.find((n: { '@type': string }) => n['@type'] === 'Organization')
  expect(Object.keys(org).sort()).toEqual(['@id', '@type', 'name', 'url'])
  expect(org.name).toBe('Innovacred')

  // Cada pregunta del FAQPage existe tal cual en la página y su respuesta no tiene "por confirmar".
  const faq = graph.find((n: { '@type': string }) => n['@type'] === 'FAQPage')
  const visible = await page.locator('.faq details').evaluateAll((els) =>
    els.map((d) => ({ q: d.querySelector('summary')?.textContent?.trim() ?? '', a: d.querySelector('.a')?.textContent?.trim() ?? '' })))
  expect(faq.mainEntity.length).toBeGreaterThan(0)
  for (const q of faq.mainEntity) {
    const match = visible.find((v) => v.q === q.name)
    expect(match, q.name).toBeTruthy()
    expect(match!.a).toBe(q.acceptedAnswer.text)
    expect(q.acceptedAnswer.text).not.toMatch(/por confirmar/i)
  }
})

test('robots.txt bloquea, el sitemap sale vacío y llms.txt no nombra el método', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toMatch(/User-agent: \*\s+Disallow: \/\s*$/)
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).toContain('<urlset')
  expect(sitemap).not.toContain('<url>')
  const llms = await (await request.get('/llms.txt')).text()
  expect(llms).toMatch(/^# Innovacred/)
  expect(llms).not.toMatch(/ICRED|Capítulo IV|método/i)
})

test('ninguna página nombra el método ni oculta lo que falta confirmar', async ({ page }) => {
  for (const path of ['/', '/ingresar/']) {
    await page.goto(path)
    const text = await page.locator('body').innerText()
    expect(text).not.toMatch(/ICRED|Capítulo IV|método/i)
    expect(await page.locator('.pc').count()).toBeGreaterThan(0)
  }
  await page.goto('/')
  await expect(page.locator('.pc', { hasText: 'razón social y contacto' })).toBeVisible()
})

test('el ingreso valida el RUT y no deja la clave en la URL ni en el almacenamiento', async ({ page }) => {
  await page.goto('/ingresar/')
  const submit = page.getByRole('button', { name: 'Conectar con el SII' })
  await expect(submit).toBeDisabled()

  await page.getByLabel('RUT').fill('12.345.678-9')
  await page.getByLabel('Clave tributaria').fill('clave-de-prueba')
  await page.getByLabel(/Autorizo a Innovacred/).check()
  await expect(submit).toBeEnabled()
  await submit.click()
  await expect(page.locator('#rut-err')).toHaveText('El RUT no es válido. Revisa el número y el dígito verificador.')
  await expect(page.getByLabel('RUT')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByLabel('RUT')).toBeFocused()

  // Los campos no tienen name: aunque el formulario se enviara, no viajaría nada.
  expect(await page.locator('#autorizacion [name]').count()).toBe(0)

  // Con un RUT válido, se borra la clave y se va a la app (PUBLIC_APP_URL), sin parámetros.
  let target = ''
  await page.route('http://localhost:5173/**', (route) => { target = route.request().url(); return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>app</title>' }) })
  await page.getByLabel('RUT').fill('12.345.678-5')
  await submit.click()
  await expect(page.getByLabel('Clave tributaria')).toHaveValue('')
  await expect(page.getByRole('status')).toContainText('no se envió tu RUT ni tu clave')
  await page.waitForURL('http://localhost:5173/')
  expect(target).toBe('http://localhost:5173/')
  expect(target).not.toMatch(/clave|rut|12345678/i)
})

test('el ingreso no guarda nada en el navegador', async ({ page }) => {
  await page.goto('/ingresar/')
  await page.getByLabel('RUT').fill('12.345.678-5')
  await page.getByLabel('Clave tributaria').fill('clave-de-prueba')
  const stored = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookie: document.cookie }))
  expect(stored).toEqual({ local: 0, session: 0, cookie: '' })
})

test('la animación del F22 se puede pausar y respeta menos movimiento', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto('/')
  const btn = page.locator('#desk-pause')
  await expect(btn).toHaveAttribute('aria-pressed', 'true')
  await expect(btn).toHaveText('Reanudar')
  await btn.click()
  await expect(btn).toHaveAttribute('aria-pressed', 'false')
  await expect(btn).toHaveText('Pausar')
  await ctx.close()
})

test('el teclado llega primero al enlace para saltar al contenido', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.locator('.skip')).toBeFocused()
  await expect(page.locator('.skip')).toBeVisible()
})
