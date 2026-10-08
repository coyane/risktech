import { expect, expectNoHorizontalScroll, isDesktop, loginAsClient, openView, test } from './helpers.ts'

test.describe('Diagnóstico Base', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClient(page)
  })

  test('abre en el resumen, con sus pestañas y las cifras del último año', async ({ page }) => {
    await expect(page.locator('.tab')).toHaveText([
      'Resumen',
      'Cálculos',
      'Crédito',
      'Datos del SII',
      /^Pendientes/,
      'Glosario',
    ])
    await expect(page.locator('.tab[aria-current]')).toHaveText('Resumen')
    await expect(openView(page).locator('.hero-item')).toHaveCount(9)
    await expect(page.locator('.hero-item[href="#calc-total-origenes"] .hero-value')).toHaveText('$104.832.677')
  })

  test('una cifra del resumen abre la explicación de su cálculo', async ({ page }) => {
    await page.click('.hero-item[href="#calc-tasa-efectiva"]')
    await expect(page.locator('.tab[aria-current]')).toHaveText('Cálculos')
    const detail = page.locator('.explorer-detail')
    await expect(detail).toBeVisible()
    await expect(detail.locator('.explorer-panel:not([hidden]) h3')).toHaveText('¿Qué porcentaje se paga de impuesto?')
    await expect(detail.locator('.explorer-panel:not([hidden]) .calc-value')).toHaveText('16,04%')
  })

  test('en Cálculos la explicación está siempre abierta y los bloques la cambian', async ({ page }) => {
    test.skip(!isDesktop(page), 'En pantallas angostas la explicación se abre al elegir un bloque')
    await page.click('.tab[href="#calculos"]')
    const open = page.locator('.explorer-detail .explorer-panel:not([hidden])')
    await expect(open.locator('h3')).toHaveText('¿Cuánto se declaró en el año?')
    await page.click('.index-row[href="#calc-renta-bruta"]')
    await expect(open.locator('h3')).toHaveText('¿Cuánto de lo declarado cuenta como ingreso personal?')
    await expect(page.locator('.index-row[aria-current]')).toContainText('Renta financiera bruta')
  })

  test('en pantallas angostas la explicación se abre sobre los bloques y se cierra', async ({ page }) => {
    test.skip(isDesktop(page), 'Con espacio la explicación queda siempre abierta')
    await page.click('.tab[href="#calculos"]')
    await expect(page.locator('.explorer-detail')).toBeHidden()
    await page.click('.index-row[href="#calc-renta-neta"]')
    await expect(page.locator('.explorer-detail')).toBeVisible()
    await page.locator('.detail-close').click()
    await expect(page.locator('.explorer-detail')).toBeHidden()
  })

  test('un dato del SII lleva a su fila de origen y de ahí se vuelve al cálculo', async ({ page }) => {
    await page.goto('/diagnostico#calc-tasa-efectiva')
    await page.locator('.explorer-detail .explorer-panel:not([hidden]) a.data-chip.kind-sii').first().click()
    await expect(page.locator('.tab[aria-current]')).toHaveText('Datos del SII')
    const row = page.locator('tr:target')
    await expect(row).toBeVisible()
    await expect(row).toBeInViewport()
    await row.locator('.used-in a', { hasText: 'Tasa efectiva de tributación' }).click()
    await expect(page.locator('.tab[aria-current]')).toHaveText('Cálculos')
    await page.goBack()
    await expect(page.locator('.tab[aria-current]')).toHaveText('Datos del SII')
  })

  test('cambiar de año cambia las cifras', async ({ page }) => {
    await page.getByRole('button', { name: 'AT 2022' }).click()
    await expect(page.locator('.hero-item[href="#calc-tasa-efectiva"] .hero-value')).toHaveText('6,93%')
    await expect(openView(page).locator('h2').first()).toContainText('AT 2022')
  })

  test('Crédito: la tasa y el plazo escritos recalculan todo el informe', async ({ page }) => {
    await page.click('.tab[href="#credito"]')
    const figures = page.locator('.credit-inputs .hero-item')
    await expect(figures.nth(1).locator('.hero-value')).toHaveText('$285.216.668')

    await page.fill('#sim-rate', '3,75')
    await page.fill('#sim-years', '23')
    await expect(figures.nth(1).locator('.hero-value')).toHaveText('$251.560.624')
    // Lo escrito se muestra tal cual, sin redondearlo.
    await expect(figures.nth(1).locator('.hero-name')).toHaveText('Con 3,75% anual a 23 años')
    await expect(page.locator('[data-view="credito"] .data-panel:not([hidden]) .calc-plain')).toContainText(
      '276 meses, con 3,75% de interés anual',
    )

    // Un valor inválido se avisa y el informe conserva el último válido.
    await page.fill('#sim-rate', 'abc')
    await expect(page.locator('#sim-rate-error')).toBeVisible()
    await expect(figures.nth(1).locator('.hero-value')).toHaveText('$251.560.624')
    await page.fill('#sim-rate', '3,75')

    await page.click('.tab[href="#resumen"]')
    await expect(page.locator('.hero-item[href="#calc-credit-capacity"] .hero-value')).toHaveText('$251.560.624')
    await expect(page.locator('#financiero .card-note')).toHaveText('Credit Capacity con 3,75% anual a 23 años')

    await page.click('.tab[href="#credito"]')
    await page.getByRole('button', { name: /Volver a la referencia/ }).click()
    await expect(figures.nth(1).locator('.hero-value')).toHaveText('$285.216.668')
  })

  test('los cálculos de crédito se abren en la pestaña Crédito', async ({ page }) => {
    await page.goto('/diagnostico#calc-credit-capacity-uf')
    await expect(page.locator('.tab[aria-current]')).toHaveText('Crédito')
    await expect(page.locator('[data-view="credito"] .subtab[aria-current]')).toHaveText('Credit Capacity en UF')
    // Enlace antiguo que usa la sección del agente.
    await page.goto('/diagnostico#credito')
    await expect(page.locator('.tab[aria-current]')).toHaveText('Crédito')
  })

  test('el contador de pendientes coincide con la lista', async ({ page }) => {
    const count = Number(await page.locator('.tab-count').innerText())
    await page.click('.tab[href="#pendientes"]')
    await expect(page.locator('.pending-list li')).toHaveCount(count)
  })

  test('ninguna vista se desplaza a lo ancho ni muestra valores rotos', async ({ page }) => {
    const places = ['resumen', 'calculos', 'calc-renta-bruta', 'credito', 'datos-renta', 'datos-propiedades', 'pendientes', 'glosario']
    for (const place of places) {
      await page.goto(`/diagnostico#${place}`)
      await expect(openView(page)).toBeVisible()
      await expectNoHorizontalScroll(page, place)
    }
    const text = await page.locator('.report').evaluate((node) => node.textContent ?? '')
    expect(text).not.toMatch(/NaN|undefined|Infinity|\[object/)
  })

  test('el PDF trae todas las vistas y no la navegación', async ({ page }) => {
    await page.emulateMedia({ media: 'print' })
    for (const view of ['resumen', 'calculos', 'credito', 'datos', 'pendientes', 'glosario']) {
      await expect(page.locator(`[data-view="${view}"]`)).toBeVisible()
    }
    await expect(page.locator('.report-bar')).toBeHidden()
    await expect(page.locator('[data-view="calculos"] .calc').first()).toBeVisible()
  })

  test('la sección del agente sigue visible como Próximamente', async ({ page }) => {
    const link = page.locator('.nav-link', { hasText: 'Análisis con el agente' })
    await expect(link).toContainText('Próximamente')
    await link.click()
    await expect(page.locator('.banner-soon')).toBeVisible()
    await expect(page.locator('.insight-card').first()).toBeVisible()
    await expectNoHorizontalScroll(page, 'análisis')
  })
})

test('una captura parcial lo dice en el informe', async ({ page }) => {
  await loginAsClient(page, '?demo=parcial')
  await expect(page.locator('.report .banner-warn')).toContainText('Captura parcial')
})
