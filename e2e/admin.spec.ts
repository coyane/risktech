import { expect, expectNoHorizontalScroll, loginAsAdmin, test } from './helpers.ts'

test.describe('Backoffice', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('Propietarios muestra las cifras del portafolio y una fila por cliente', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Propietarios en la plataforma')
    await expect(page.locator('.hero-figures .hero-item')).toHaveCount(5)
    // Una fila por cliente más la fila de totales.
    await expect(page.locator('table tbody tr')).toHaveCount(11)
    await expectNoHorizontalScroll(page, 'propietarios')
  })

  test('Radiografía agrupa el portafolio por tramo de Global Complementario', async ({ page }) => {
    await page.locator('.nav a', { hasText: 'Radiografía' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Radiografía general')
    const columns = page.getByRole('list', { name: 'Clientes por tramo de Global Complementario' }).locator('li')
    // Todos los tramos, también los que no tienen clientes.
    await expect(columns).toHaveCount(8)
    const total = await columns.locator('.column-value').evaluateAll((nodes) =>
      nodes.reduce((sum, node) => sum + Number.parseInt(node.textContent ?? '0', 10), 0),
    )
    expect(total).toBe(10)
    await expectNoHorizontalScroll(page, 'radiografía')
  })

  test('el agente del portafolio sigue visible como Próximamente', async ({ page }) => {
    const link = page.locator('.nav a', { hasText: 'Agente portafolio' })
    await expect(link).toContainText('Próximamente')
    await link.click()
    await expect(page.locator('.banner-soon')).toBeVisible()
  })
})
