import { fileURLToPath } from 'node:url'
import { expect, expectNoHorizontalScroll, goToView, hasSidebar, loginAsClient, openView, test } from './helpers.ts'

// PDF sintético de 2 páginas, sin datos reales (lo genera e2e/fixtures/generar-pdf-sintetico.mjs).
const PDF = fileURLToPath(new URL('./fixtures/informe-deudas-sintetico.pdf', import.meta.url))
const CMF_URL = 'https://conocetudeuda.cmfchile.cl/informe-deudas/'

const view = (page: import('@playwright/test').Page) => page.locator('[data-view="deudas"]')
const fileInput = (page: import('@playwright/test').Page) => view(page).locator('input[type=file]')

test.describe('Informe de deudas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClient(page)
  })

  test('es un menú aparte, opcional, con su propia dirección y sin contar como pendiente', async ({ page }) => {
    if (!hasSidebar(page)) {
      // En móvil no ocupa la barra inferior: está en "Más".
      await expect(page.locator('.tabbar a[href$="#deudas"]')).toHaveCount(0)
      await page.getByRole('button', { name: 'Más' }).click()
    }
    const scope = hasSidebar(page) ? page.locator('.side') : page.locator('.msheet')
    const group = scope.locator('.nav-group', { hasText: 'Complementos' })
    const link = group.locator('.nav-item[href$="#deudas"]')
    await expect(link).toContainText('Informe de deudas')
    await expect(link).toContainText('Opcional · Recomendado')
    await link.click()
    await expect(openView(page)).toHaveAttribute('data-view', 'deudas')
    await expect(page).toHaveURL(/#deudas$/)
    await expect(view(page).locator('.pn-head .pn-title')).toHaveText('Informe de deudas')
    await expectNoHorizontalScroll(page, 'informe de deudas')

    await goToView(page, 'pendientes')
    await expect(page.locator('.pending-list')).not.toContainText('deudas')
    await page.goto('/diagnostico#deudas')
    await expect(openView(page)).toHaveAttribute('data-view', 'deudas')
  })

  test('muestra la dirección exacta de la CMF, la abre en otra pestaña y la copia', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/diagnostico#deudas')
    const link = view(page).locator('.dr-url-link')
    await expect(link).toHaveText(CMF_URL)
    await expect(link).toHaveAttribute('href', CMF_URL)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    const open = view(page).getByRole('link', { name: /Abrir el portal de la CMF/ })
    await expect(open).toHaveAttribute('target', '_blank')
    await expect(open).toHaveAttribute('rel', 'noopener noreferrer')

    // Los pasos y lo que conviene saber del trámite.
    await expect(view(page).locator('.dr-steps li')).toHaveCount(5)
    await expect(view(page).locator('.dr-steps li').last()).toContainText('Vuelve aquí y carga el PDF')
    await expect(view(page).locator('.dr-facts')).toContainText('ClaveÚnica y cédula de identidad')
    await expect(view(page).locator('.dr-facts')).toContainText('Gratis')
    await expect(view(page).locator('.dr-facts')).toContainText('entre 10 y 20 días')
    await expect(view(page)).toContainText('persona jurídica')
    await expect(view(page)).toContainText('no se envía a ningún servidor')

    await view(page).getByRole('button', { name: 'Copiar enlace' }).click()
    await expect(view(page).locator('.dr-copy-status')).toHaveText('Enlace copiado.')
    await expect(view(page).getByRole('button', { name: 'Copiado' })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(CMF_URL)
  })

  test('rechaza un archivo que no es PDF y lo dice junto al campo', async ({ page }) => {
    await page.goto('/diagnostico#deudas')
    await fileInput(page).setInputFiles({ name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('hola') })
    const error = view(page).locator('.dr-upload #dr-error')
    await expect(error).toHaveText('Ese archivo no es un PDF. Carga el informe en PDF que descargaste de la CMF.')
    await expect(error).toHaveAttribute('role', 'alert')
    await expect(view(page).getByRole('button', { name: 'Elegir el PDF' })).toHaveAttribute('aria-describedby', 'dr-hint dr-error')

    // Un archivo con nombre .pdf que no es un PDF también se rechaza.
    await fileInput(page).setInputFiles({ name: 'falso.pdf', mimeType: 'application/pdf', buffer: Buffer.from('no soy un pdf') })
    await expect(error).toContainText('no es un PDF')
    await expect(view(page).locator('.dr-pages')).toHaveCount(0)
  })

  test('verifica el PDF con su código QR, muestra sus páginas tal cual y lo mantiene al cambiar de vista', async ({ page }) => {
    await page.goto('/diagnostico#deudas')
    await fileInput(page).setInputFiles(PDF)
    // Los tres pasos de la verificación, a la vista y con el aviso de la demo.
    const check = view(page).locator('.dr-check')
    await expect(check.getByRole('heading', { name: 'Verificando el documento' })).toBeFocused()
    await expect(check.locator('.dr-check-steps li')).toHaveText([
      /Leyendo el PDF/,
      /Buscando el código QR/,
      /Validando con la CMF/,
    ])
    await expect(check).toContainText('Modo demo: la verificación es simulada.')
    await expect(view(page).locator('.dr-pages')).toHaveCount(0)

    const pages = view(page).locator('.dr-page img')
    await expect(pages).toHaveCount(2, { timeout: 20_000 })
    await expect(pages.first()).toHaveAttribute('alt', 'Página 1 de 2 del informe de deudas')
    await expect(view(page).locator('.dr-file-name')).toHaveText('informe-deudas-sintetico.pdf')
    await expect(view(page).locator('.dr-file')).toContainText(/2 páginas · 2\sKB · cargado el \d{2}-\d{2}-\d{4} a las \d{2}:\d{2}/)
    await expect(view(page).locator('.dr-file-name')).toBeFocused()
    await expect(view(page).locator('.dr-seal')).toContainText('Verificado con la CMF · código QR')
    await expect(view(page).locator('.dr-seal')).toContainText(/el \d{2}-\d{2}-\d{4} a las \d{2}:\d{2}/)
    // Cada imagen está dibujada (no vacía).
    expect(await pages.first().evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(800)
    await expectNoHorizontalScroll(page, 'informe de deudas cargado')

    if (!hasSidebar(page)) await page.getByRole('button', { name: 'Más' }).click()
    const scope = hasSidebar(page) ? page.locator('.side') : page.locator('.msheet')
    await expect(scope.locator('.nav-item[href$="#deudas"]')).toContainText('Verificado')
    if (!hasSidebar(page)) await page.keyboard.press('Escape')

    await goToView(page, 'resumen')
    await goToView(page, 'deudas')
    await expect(view(page).locator('.dr-page img')).toHaveCount(2)

    await view(page).getByRole('button', { name: 'Quitar' }).click()
    await expect(view(page).locator('.dr-pages')).toHaveCount(0)
    await expect(view(page).getByRole('button', { name: 'Elegir el PDF' })).toBeFocused()
  })

  test('cancelar la verificación descarta el archivo', async ({ page }) => {
    await page.goto('/diagnostico#deudas')
    await fileInput(page).setInputFiles(PDF)
    await view(page).getByRole('button', { name: 'Cancelar' }).click()
    await expect(view(page).locator('.dr-check')).toHaveCount(0)
    await expect(view(page).getByRole('button', { name: 'Elegir el PDF' })).toBeFocused()
    // Pasado el tiempo de la verificación, sigue sin archivo.
    await page.waitForTimeout(4_000)
    await expect(view(page).locator('.dr-pages')).toHaveCount(0)
    await expect(view(page).locator('.dr-file')).toHaveCount(0)
  })

  test('el PDF del informe trae el informe de deudas al final, o una línea fija si no se cargó', async ({ page }) => {
    await page.emulateMedia({ media: 'print' })
    const last = page.locator('.view').last()
    await expect(last).toHaveAttribute('data-view', 'deudas')
    await expect(last.locator('.dr-print-head h2')).toHaveText('Informe de deudas (CMF)')
    await expect(last.locator('.dr-print-head')).toContainText('No se cargó el informe de deudas; es opcional.')
    // La guía y la carga no van en papel.
    await expect(last.locator('.dr-screen')).toBeHidden()

    await page.emulateMedia({ media: 'screen' })
    await page.goto('/diagnostico#deudas')
    await fileInput(page).setInputFiles(PDF)
    await expect(view(page).locator('.dr-page img')).toHaveCount(2, { timeout: 20_000 })
    await goToView(page, 'resumen')

    await page.emulateMedia({ media: 'print' })
    await expect(view(page)).toBeVisible()
    await expect(view(page).locator('.dr-print-head')).toContainText('informe-deudas-sintetico.pdf')
    await expect(view(page).locator('.dr-print-head')).toContainText('tal como se cargó')
    await expect(view(page).locator('.dr-print-verified')).toHaveText(
      /^Verificado con el código QR del documento el \d{2}-\d{2}-\d{4} a las \d{2}:\d{2} \(verificación simulada\)\.$/,
    )
    await expect(view(page).locator('.dr-print-head')).not.toContainText('no verifica')
    await expect(view(page).locator('.dr-page img')).toHaveCount(2)
    for (const img of await view(page).locator('.dr-page img').all()) await expect(img).toBeVisible()
  })
})

// Escenarios de la demo, como los de la extracción: ?demo=<nombre> al entrar.
const REJECTIONS = [
  { scenario: 'deuda-sin-qr', reason: 'El PDF no trae el código QR del informe de la CMF.' },
  { scenario: 'deuda-no-cmf', reason: 'El código QR del PDF no corresponde a la CMF.' },
  { scenario: 'deuda-no-coincide', reason: 'El contenido del PDF no coincide con el informe que la CMF registra' },
]

for (const { scenario, reason } of REJECTIONS) {
  test(`un documento ${scenario.replace('deuda-', '')} se rechaza, con su motivo, y no se guarda`, async ({ page }) => {
    await loginAsClient(page, `?demo=${scenario}`)
    await page.goto('/diagnostico#deudas')
    await fileInput(page).setInputFiles(PDF)
    const result = view(page).locator('.dr-result.is-rejected')
    await expect(result.getByRole('heading', { name: 'El documento no se aceptó' })).toBeVisible({ timeout: 10_000 })
    await expect(result.getByRole('heading', { name: 'El documento no se aceptó' })).toBeFocused()
    await expect(result).toContainText(reason)
    await expect(result).toContainText('No se guardó ni se agregó a la carpeta')
    await expect(view(page).locator('.dr-check-steps')).toHaveCount(0)
    await expect(result.getByRole('button', { name: 'Cargar otro PDF' })).toBeVisible()
    const portal = result.getByRole('link', { name: /Abrir el portal de la CMF/ })
    await expect(portal).toHaveAttribute('href', CMF_URL)
    await expect(portal).toHaveAttribute('target', '_blank')
    // Sin páginas, sin archivo y fuera de la carpeta.
    await expect(view(page).locator('.dr-pages')).toHaveCount(0)
    await expect(view(page).locator('.dr-file')).toHaveCount(0)
    await expectNoHorizontalScroll(page, scenario)
    await page.emulateMedia({ media: 'print' })
    await expect(view(page).locator('.dr-print-head')).toContainText('No se cargó el informe de deudas; es opcional.')
  })
}

test('si el servicio de verificación no responde, se puede reintentar y termina verificado', async ({ page }) => {
  await loginAsClient(page, '?demo=deuda-servicio')
  await page.goto('/diagnostico#deudas')
  await fileInput(page).setInputFiles(PDF)
  const result = view(page).locator('.dr-result.is-service')
  await expect(result.getByRole('heading', { name: 'No se pudo verificar ahora' })).toBeVisible({ timeout: 10_000 })
  await expect(result).toContainText('No es un problema de tu documento')
  await expect(result.getByRole('button', { name: 'Cargar otro PDF' })).toBeVisible()
  await expect(view(page).locator('.dr-pages')).toHaveCount(0)
  await result.getByRole('button', { name: 'Reintentar' }).click()
  await expect(view(page).locator('.dr-check')).toBeVisible()
  await expect(view(page).locator('.dr-page img')).toHaveCount(2, { timeout: 20_000 })
  await expect(view(page).locator('.dr-seal')).toContainText('Verificado con la CMF · código QR')
})
