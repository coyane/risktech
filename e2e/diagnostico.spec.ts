import {
  expect,
  expectNoHorizontalScroll,
  goToView,
  hasSidebar,
  isDesktop,
  loginAsClient,
  openNavLink,
  openView,
  test,
} from './helpers.ts'

const kpi = (page: import('@playwright/test').Page, id: string) => page.locator(`[data-kpi="${id}"] .pn-kpi-value`)

test.describe('Diagnóstico Base', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClient(page)
  })

  test('abre en el Resumen con la marca, las vistas y las cifras del último año', async ({ page }) => {
    await expect(page).toHaveTitle(/Innovacred/)
    await expect(page.locator('[data-view="resumen"]')).toBeVisible()
    await expect(page.locator('[data-view="resumen"] .pn-title')).toHaveText('Resumen del AT 2025')
    await expect(kpi(page, 'credit-capacity')).toHaveText('$384.089.077')
    await expect(kpi(page, 'total-origenes')).toHaveText('$104.832.677')
    await expect(kpi(page, 'rfn-mensual')).toHaveText('$7.334.798')
    await expect(kpi(page, 'limite-hipotecario')).toHaveText('$1.833.700')
    const nav = hasSidebar(page) ? page.locator('.side') : page.locator('.tabbar')
    await expect(nav.getByRole('link', { name: 'Cálculos' })).toBeVisible()
  })

  test('ningún texto visible nombra un método, un capítulo ni la marca anterior', async ({ page }) => {
    const text = await page.locator('body').evaluate((node) => node.textContent ?? '')
    expect(text).not.toMatch(/m[ée]todo|ICRED|Cap[íi]tulo|CEFT/i)
  })

  test('la variación entre años es un dato neutro que se puede ocultar', async ({ page }) => {
    const delta = page.locator('[data-kpi="credit-capacity"] .pn-delta')
    await expect(delta).toHaveText('+11,9% vs AT 2024')
    const toggle = page.getByRole('button', { name: 'Variación entre años' })
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('[data-view="resumen"] .pn-delta')).toHaveCount(0)
    // El gráfico por año se queda.
    await expect(page.locator('.pn-bars')).toBeVisible()
  })

  test('el gráfico por año cambia de cifra y parte de cero', async ({ page }) => {
    const chart = page.locator('#financiero')
    await expect(chart.locator('.pn-bar-value')).toHaveText(['$213,0 MM', '$287,4 MM', '$343,1 MM', '$384,1 MM'])
    await chart.getByRole('button', { name: 'Dividendo' }).click()
    await expect(chart.locator('.pn-bar-value').last()).toHaveText('$1.833.700')
    await expect(chart.locator('.pn-bars figcaption')).toHaveText('Las barras parten de cero.')
  })

  test('una cifra del Resumen abre su cálculo y atrás vuelve al Resumen', async ({ page }) => {
    await page.locator('[data-kpi="limite-hipotecario"] .pn-go').click()
    await expect(openView(page)).toHaveAttribute('data-view', 'calculos')
    const panel = page.locator('.pn-panel')
    await expect(panel).toBeVisible()
    await expect(panel.locator('.pn-detail-q')).toHaveText('¿Cuánto se podría pagar de dividendo al mes?')
    await page.goBack()
    await expect(openView(page)).toHaveAttribute('data-view', 'resumen')
  })

  test('Cálculos se lee por niveles: respuesta, operación y origen', async ({ page }) => {
    await page.goto('/diagnostico#calc-tasa-efectiva')
    const panel = page.locator('.pn-panel')
    await expect(panel.locator('.pn-detail-q')).toHaveText('¿Qué porcentaje se paga de impuesto?')
    await expect(panel.locator('.pn-detail-value')).toHaveText('16,04%')
    await expect(panel.locator('.pn-plain')).toHaveText('De cada $100 de base imponible, $16,04 corresponden a impuesto.')

    // La operación y el origen parten plegados.
    const operation = panel.getByRole('button', { name: /La operación/ })
    const origin = panel.getByRole('button', { name: /Qué es y de dónde sale/ })
    await expect(operation).toHaveAttribute('aria-expanded', 'false')
    await expect(origin).toHaveAttribute('aria-expanded', 'false')
    await operation.click()
    await expect(operation).toHaveAttribute('aria-expanded', 'true')
    await expect(panel.locator('.pn-op li')).toHaveCount(3)
    await expect(panel.locator('.pn-op-result .pn-op-value')).toHaveText('16,04%')
    await origin.click()
    await expect(panel.locator('.pn-sources li').first()).toContainText('F22 · código 157 · AT 2025')

    // Lo abierto sigue abierto al pasar al siguiente cálculo.
    await panel.getByRole('link', { name: 'Cálculo siguiente' }).click()
    await expect(panel.locator('.pn-detail-q')).toHaveText('¿A cuántas UTA equivale la base imponible?')
    await expect(panel.getByRole('button', { name: /La operación/ })).toHaveAttribute('aria-expanded', 'true')
  })

  test('los grupos de Cálculos abren su primer cálculo y el índice marca el abierto', async ({ page }) => {
    await goToView(page, 'calculos')
    await page.locator('.pn-groups').getByRole('link', { name: 'Renta financiera' }).click()
    await expect(page.locator('.pn-idx')).toHaveCount(5)
    await page.locator('.pn-idx[href="#calc-rfn-mensual"]').click()
    await expect(page.locator('.pn-idx[aria-current="true"]')).toContainText('Renta financiera neta mensual')
    await expect(page.locator('.pn-panel .pn-detail-value')).toHaveText('$7.334.798')
  })

  test('en pantallas angostas el cálculo se abre como hoja y se cierra', async ({ page }) => {
    test.skip(isDesktop(page), 'Con espacio el cálculo queda siempre al lado')
    await goToView(page, 'calculos')
    const panel = page.locator('.pn-panel')
    await expect(panel).toBeHidden()
    await page.locator('.pn-idx[href="#calc-base-imponible"]').click()
    await expect(panel).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await page.locator('.pn-idx[href="#calc-base-imponible"]').click()
    await panel.getByRole('link', { name: 'Cerrar el cálculo' }).click()
    await expect(panel).toBeHidden()
  })

  test('un dato del SII lleva a su fila de origen y de ahí se vuelve al cálculo', async ({ page }) => {
    await page.goto('/diagnostico#calc-tasa-efectiva')
    const panel = page.locator('.pn-panel')
    await panel.getByRole('button', { name: /La operación/ }).click()
    await panel.locator('.pn-op a', { hasText: 'Impuesto determinado' }).click()
    await expect(openView(page)).toHaveAttribute('data-view', 'datos')
    const row = page.locator('tr:target')
    await expect(row).toBeVisible()
    await row.locator('.used-in a', { hasText: 'Tasa efectiva de tributación' }).click()
    await expect(openView(page)).toHaveAttribute('data-view', 'calculos')
    await page.goBack()
    await expect(openView(page)).toHaveAttribute('data-view', 'datos')
  })

  test('cambiar de año cambia las cifras', async ({ page }) => {
    await page.getByRole('button', { name: 'AT 2022' }).click()
    await expect(page.locator('[data-view="resumen"] .pn-title')).toHaveText('Resumen del AT 2022')
    await expect(kpi(page, 'total-origenes')).toHaveText('$52.455.880')
    await expect(page.locator('[data-kpi="credit-capacity"] .pn-delta')).toHaveText('Primer año del informe')
  })

  test('Crédito: la tasa y el plazo escritos recalculan todo el informe', async ({ page }) => {
    await goToView(page, 'credito')
    const amount = page.locator('.credit-inputs .pn-hero')
    await expect(amount).toHaveText('$384.089.077')

    await page.fill('#sim-rate', '3,75')
    await page.fill('#sim-years', '23')
    await expect(amount).toHaveText('$338.765.923')
    await expect(page.locator('.credit-inputs .pn-uf a')).toHaveText('UF 8.818')
    await expect(page.locator('.credit-inputs .pn-fields-foot')).toContainText('Tasa y plazo escritos en este informe')
    await expect(page.locator('.pn-curve-tag')).toHaveText('23 años: $338,8 MM')

    // Un valor inválido se avisa y el informe conserva el último válido.
    await page.fill('#sim-rate', 'abc')
    await expect(page.locator('#sim-rate-error')).toBeVisible()
    await expect(amount).toHaveText('$338.765.923')
    await page.fill('#sim-rate', '3,75')

    await goToView(page, 'resumen')
    await expect(kpi(page, 'credit-capacity')).toHaveText('$338.765.923')
    await expect(page.locator('#resumen-rate')).toHaveValue('3,75')
    await expect(page.locator('#resumen-years')).toHaveValue('23')

    await page.locator('[data-view="resumen"]').getByRole('button', { name: /Volver a la referencia/ }).click()
    await expect(kpi(page, 'credit-capacity')).toHaveText('$384.089.077')
    await goToView(page, 'credito')
    await expect(page.locator('#sim-rate')).toHaveValue('4,0')
  })

  test('Resumen: "Cambiar tasa y plazo" lleva a los campos y el valor en UF está por confirmar', async ({ page }) => {
    await page.getByRole('button', { name: 'Cambiar tasa y plazo' }).click()
    await expect(page.locator('#resumen-rate')).toBeFocused()
    const uf = page.locator('[data-view="resumen"] .pn-uf')
    await expect(uf).toContainText('UF 9.998')
    await expect(uf.locator('.status')).toHaveText('Por confirmar')
  })

  test('el leverage se muestra como cinco cifras, sin gráfico', async ({ page }) => {
    await goToView(page, 'credito')
    const mults = page.getByRole('list', { name: 'Factor leverage' }).locator('li')
    await expect(mults).toHaveCount(5)
    await expect(mults.first()).toContainText('UF 9.998')
  })

  test('los enlaces anteriores llevan a su lugar', async ({ page }) => {
    await page.goto('/diagnostico#calc-credit-capacity-uf')
    await expect(openView(page)).toHaveAttribute('data-view', 'calculos')
    await expect(page.locator('.pn-groups [aria-current="true"]')).toHaveText('Crédito')
    await page.goto('/diagnostico#credito')
    await expect(openView(page)).toHaveAttribute('data-view', 'credito')
    for (const old of ['datos-propiedades', 'patrimonio', 'financiamiento']) {
      await page.goto(`/diagnostico#${old}`)
      await expect(openView(page)).toHaveAttribute('data-view', 'propiedades')
    }
    await page.goto('/diagnostico#contingencias')
    await expect(page.locator('.pn-groups [aria-current="true"]')).toHaveText('Contingencias')
    await page.goto('/diagnostico#financiero')
    await expect(openView(page)).toHaveAttribute('data-view', 'resumen')
  })

  test('el contador de pendientes coincide con la lista', async ({ page }) => {
    if (!hasSidebar(page)) await page.getByRole('button', { name: 'Más' }).click()
    const scope = hasSidebar(page) ? page.locator('.side') : page.locator('.msheet')
    const count = Number(await scope.locator('.nav-count').innerText())
    await scope.locator('.nav-item[href$="#pendientes"]').click()
    await expect(page.locator('.pending-list li')).toHaveCount(count)
  })

  test('ninguna vista se desplaza a lo ancho ni muestra valores rotos', async ({ page }) => {
    const places = ['resumen', 'calculos', 'calc-renta-bruta', 'credito', 'propiedades', 'calc-deuda-institucion', 'datos-renta', 'pendientes', 'glosario']
    for (const place of places) {
      await page.goto(`/diagnostico#${place}`)
      await expect(openView(page)).toBeVisible()
      await expectNoHorizontalScroll(page, place)
    }
    const text = await page.locator('.report').evaluate((node) => node.textContent ?? '')
    expect(text).not.toMatch(/NaN|undefined|Infinity|\[object/)
  })

  test('el PDF trae todas las vistas y todos los cálculos, sin la navegación ni los campos', async ({ page }) => {
    await page.emulateMedia({ media: 'print' })
    for (const view of ['resumen', 'calculos', 'credito', 'propiedades', 'datos', 'pendientes', 'glosario']) {
      await expect(page.locator(`[data-view="${view}"]`)).toBeVisible()
    }
    await expect(page.locator('.side')).toBeHidden()
    await expect(page.locator('.tabbar')).toBeHidden()
    await expect(page.locator('.pn-calcs')).toBeHidden()
    await expect(page.locator('.pn-print-calcs .pn-detail')).toHaveCount(25)
    await expect(page.locator('.pn-print-calcs .pn-op').first()).toBeVisible()
    // La tasa y el plazo usados se imprimen; los campos no.
    await expect(page.locator('[data-view="resumen"] .pn-terms')).toHaveText('Con 4,0% anual a 30 años · Tasa y plazo de referencia')
    await expect(page.locator('#resumen-rate')).toBeHidden()
    await expect(page.locator('.pn-print-about')).toBeVisible()
    // Las actividades y el plazo de cada crédito también van en papel.
    await expect(page.locator('[data-view="resumen"] .pn-acts-list li')).toHaveCount(2)
    await expect(page.locator('#patrimonio .pn-term-text').first()).toBeVisible()
    await expect(page.locator('.pn-columns')).toBeVisible()
  })

  test('el Resumen muestra las actividades económicas registradas con su origen', async ({ page }) => {
    const card = page.locator('[data-view="resumen"] .pn-acts')
    await expect(card.getByRole('heading', { name: 'Actividades económicas registradas' })).toBeVisible()
    await expect(card).toContainText('SII · Datos del contribuyente')
    const items = card.locator('.pn-acts-list li')
    await expect(items).toHaveCount(2)
    await expect(items.first()).toContainText('681012')
    await expect(items.first()).toContainText('Compra, venta y alquiler (excepto amoblados) de inmuebles')
    await expect(items.first()).toContainText('Afecta IVA')
    await expect(items.first()).toContainText('No')
    await expect(items.first()).toContainText('Desde31-01-2025')
    await expect(items.nth(1)).toContainText('749009')
    await card.getByRole('link', { name: 'Ver las actividades en Datos del SII' }).click()
    await expect(openView(page)).toHaveAttribute('data-view', 'datos')
    const table = page.locator('#actividades table')
    await expect(table.locator('th')).toContainText(['Nombre', 'Código', 'Categoría', 'Afecta IVA', 'Desde'])
    await expect(table.locator('tbody tr').first().locator('td').nth(3)).toHaveText('No')
    await expect(table.locator('tbody tr').nth(1).locator('td').nth(3)).toHaveText('Sí')
  })

  test('el Glosario explica actividad económica y Afecta IVA', async ({ page }) => {
    await goToView(page, 'glosario')
    await expect(page.locator('.glossary dt', { hasText: 'Actividad económica' })).toBeVisible()
    await expect(page.locator('.glossary dt', { hasText: 'Afecta IVA' })).toBeVisible()
  })

  test('la sección del agente sigue visible como Próximamente', async ({ page }) => {
    if (!hasSidebar(page)) await page.getByRole('button', { name: 'Menú' }).click()
    const scope = hasSidebar(page) ? page.locator('.side') : page.locator('.msheet')
    const link = scope.locator('.nav-agent')
    await expect(link).toContainText('Análisis con el agente')
    await expect(link).toContainText('Próximamente')
    await link.click()
    await expect(page.locator('.banner-soon')).toBeVisible()
    await expect(page.locator('.insight-card').first()).toBeVisible()
    await expectNoHorizontalScroll(page, 'análisis')
    await openNavLink(page, /Resumen/)
    await expect(page.locator('[data-view="resumen"]')).toBeVisible()
  })
})

test('la extracción incluye los datos del contribuyente antes de bienes raíces', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toContainText('Actividades económicas registradas')
  await page.fill('#rut', '123456785')
  await page.fill('#clave', 'demo')
  await page.check('#consent')
  await page.click('button[type=submit]')
  const titles = page.locator('.step-list .step-title')
  await expect(titles.filter({ hasText: 'Datos del contribuyente' })).toBeVisible({ timeout: 20_000 })
  const order = await titles.allInnerTexts()
  expect(order.indexOf('Datos del contribuyente')).toBeGreaterThan(-1)
  expect(order.indexOf('Datos del contribuyente')).toBeLessThan(order.indexOf('Bienes raíces'))
  await expect(page.locator('.report')).toBeVisible({ timeout: 40_000 })
})

test('una captura parcial lo dice en el informe', async ({ page }) => {
  await loginAsClient(page, '?demo=parcial')
  await expect(page.locator('.report .banner-warn')).toContainText('Captura parcial')
})

test('la conexión muestra la marca nueva y no nombra un método', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.login-brand')).toHaveText(/Innovacred/)
  const text = await page.locator('body').evaluate((node) => node.textContent ?? '')
  expect(text).not.toMatch(/m[ée]todo|ICRED|CEFT/i)
})

test.describe('Propiedades', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClient(page)
    await goToView(page, 'propiedades')
  })

  test('reúne las cifras de bienes raíces del caso', async ({ page }) => {
    const stats = page.locator('[data-view="propiedades"] .pn-stat-value')
    await expect(stats).toHaveCount(5)
    await expect(stats.nth(0)).toHaveText('9')
    await expect(stats.nth(1)).toHaveText('35.728,07 UF')
    await expect(stats.nth(2)).toHaveText('7.693,49 UF')
    await expect(stats.nth(3)).toHaveText('28.034,58 UF')
  })

  test('la barra de pago muestra los dos montos y sus porcentajes', async ({ page }) => {
    const legend = page.locator('[data-view="propiedades"] .split-legend li')
    await expect(legend).toHaveCount(2)
    await expect(legend.nth(0)).toContainText('7.693,49 UF')
    await expect(legend.nth(1)).toContainText('28.034,58 UF')
    const shares = await page.locator('[data-view="propiedades"] .split-share').allInnerTexts()
    const total = shares.reduce((sum, text) => sum + Number(text.replace('%', '').replace(',', '.')), 0)
    expect(Math.round(total * 10) / 10).toBe(100)
  })

  test('la deuda por institución va de mayor a menor, suma los pasivos y deja el leverage por determinar', async ({ page }) => {
    const bars = page.locator('[data-view="propiedades"]').getByRole('list', { name: 'Deuda de origen por institución' }).locator('li')
    await expect(bars).toHaveCount(3)
    const amounts = (await bars.locator('.pn-bank-value').allInnerTexts()).map((text) =>
      Number(text.replace(' UF', '').replace(/\./g, '').replace(',', '.')),
    )
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a))
    expect(Math.round(amounts.reduce((sum, value) => sum + value, 0) * 100) / 100).toBe(28_034.58)
    await expect(bars.first().locator('.status')).toHaveText('Por determinar')
  })

  test('cada propiedad muestra quién la financió, por cuánto y a qué plazo, con su ficha registral', async ({ page }) => {
    const rows = page.getByRole('list', { name: 'Propiedades inscritas' }).locator('li')
    await expect(rows).toHaveCount(9)
    await expect(rows.first()).toContainText('Banco de Chile')
    await expect(rows.first().locator('.pn-pc-financiado')).toContainText('4.380,41 UF')
    await expect(rows.first().locator('.pn-fin-bar .split-hatched')).toHaveCount(1)
    // Sin crédito: la barra va lisa y la cifra lo dice en texto.
    await expect(rows.nth(3).locator('.pn-pc-financiado')).toContainText('Todo al contado')
    await page.getByRole('button', { name: 'Ficha registral de cada propiedad' }).click()
    await expect(page.locator('.property-card')).toHaveCount(9)
    await expect(page.locator('.property-card').first()).toContainText('Repertorio')
  })

  test('la primera propiedad con crédito muestra el plazo transcurrido, por confirmar', async ({ page }) => {
    const first = page.getByRole('list', { name: 'Propiedades inscritas' }).locator('li').first()
    await expect(first.locator('.pn-term-text')).toContainText('7 años y 3 meses de 25 años')
    await expect(first.locator('.pn-term')).toContainText('Quedan 17 años y 9 meses')
    await expect(first.locator('.pn-term-text')).toContainText('Por confirmar')
    const state = page.locator('[data-view="propiedades"] .pn-plazo-state')
    await expect(state.locator('.status')).toHaveText('Por confirmar')
    await expect(state).toContainText('El SII registra el plazo pactado, no los dividendos pagados')
    await state.getByRole('link', { name: 'Plazo transcurrido del crédito' }).click()
    await expect(openView(page)).toHaveAttribute('data-view', 'calculos')
    const panel = page.locator('.pn-panel')
    await expect(panel.locator('.pn-detail-q')).toHaveText('¿Cuánto del plazo pactado ha transcurrido en cada crédito?')
    await panel.getByRole('button', { name: /La operación/ }).click()
    await expect(panel.locator('.pn-op li').first()).toContainText('7 años y 3 meses de 25 años')
  })

  test('las columnas de la lista tienen encabezado y explicación', async ({ page }) => {
    const head = page.locator('[data-view="propiedades"] .pn-phead')
    if (isDesktop(page)) {
      await expect(head).toBeVisible()
      await expect(head.locator('span')).toHaveText(['Comuna y destino', 'Compra', 'Institución', 'Plazo transcurrido', 'Financiado', 'Precio'])
    } else {
      // En móvil cada ficha lleva el rótulo de cada dato.
      await expect(head).toBeHidden()
      const card = page.getByRole('list', { name: 'Propiedades inscritas' }).locator('li').first()
      await expect(card.locator('.pn-pc-plazo .pn-pc-label')).toBeVisible()
      await expect(card.locator('.pn-pc-plazo .pn-pc-label')).toHaveText('Plazo transcurrido')
    }
    const toggle = page.getByRole('button', { name: '¿Qué es cada columna?' })
    await toggle.click()
    await expect(page.locator('.pn-columns dt')).toHaveCount(6)
    await expect(page.locator('.pn-columns')).toContainText('lo liso es lo pagado al contado y lo rayado, lo financiado')
    await expect(page.locator('[data-view="propiedades"]')).toContainText('Financiado = enajenación − pago al contado')
    await expectNoHorizontalScroll(page, 'propiedades')
  })

  test('los cálculos de propiedades se abren en Cálculos', async ({ page }) => {
    await page.locator('[data-view="propiedades"] .pn-stat-note[href="#calc-prop-activos"]').click()
    await expect(openView(page)).toHaveAttribute('data-view', 'calculos')
    await expect(page.locator('.pn-panel .pn-detail-q')).toHaveText('¿Cuánto costaron las propiedades?')
    await page.goto('/diagnostico#calc-leverage-institucion')
    await expect(page.locator('.pn-panel .pn-pending-value')).toHaveText('Por determinar')
  })
})
