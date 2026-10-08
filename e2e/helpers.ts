import { expect, test as base, type Page } from '@playwright/test'

// Toda prueba falla si la página escribe un error en la consola o lanza una excepción.
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })
      page.on('pageerror', (error) => errors.push(error.message))
      await use(errors)
      expect(errors, 'errores de consola').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

// RUT con dígito verificador válido. La demo no envía credenciales.
const DEMO_RUT = '123456785'

// Entra como cliente y espera a que termine la captura simulada.
export async function loginAsClient(page: Page, query = '') {
  await page.goto(`/${query}`)
  await page.fill('#rut', DEMO_RUT)
  await page.fill('#clave', 'demo')
  await page.check('#consent')
  await page.click('button[type=submit]')
  await expect(page.locator('.report')).toBeVisible({ timeout: 40_000 })
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Entrar a administración (demo)' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

// La página nunca se desplaza a lo ancho; las tablas anchas lo hacen dentro de su contenedor.
export async function expectNoHorizontalScroll(page: Page, where: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, `desborde horizontal en ${where}`).toBeLessThanOrEqual(0)
}

export const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) > 1100

// La vista del informe que está a la vista.
export const openView = (page: Page) => page.locator('.view:not([hidden])')
