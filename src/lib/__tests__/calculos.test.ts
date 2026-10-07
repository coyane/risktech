import { describe, expect, it } from 'vitest'
import type { Report } from '../../types'
import {
  buildPropertyCalcs,
  buildRealEstate,
  buildYearCalcs,
  evaluate,
  operandsOf,
  usageByCode,
  usedBy,
  type Calc,
} from '../calculos'
import { presentValue } from '../icred'
import { buildTimeline } from '../timeline'
import { capituloIV, casoReferencia, randomReport } from './fixtures/reportes'

const calcOf = (report: Report, year: number, id: string) =>
  buildYearCalcs(report, year).find((item) => item.id === id)!

describe('caso del Capítulo IV (Carlos Díaz)', () => {
  it('reproduce la tabla de análisis financiero de AT 2025', () => {
    const get = (id: string) => calcOf(capituloIV, 2025, id)
    expect(get('total-origenes').value).toBe(104_832_677)
    expect(get('base-imponible').value).toBe(99_322_241)
    expect(get('tasa-efectiva').display).toBe('16,04%')
    expect(get('renta-bruta').value).toBe(81_700_093)
    expect(get('renta-neta').value).toBe(65_360_074)
    expect(get('rfn-mensual').value).toBe(5_446_673)
    expect(get('limite-hipotecario').value).toBe(1_361_668)
    expect(get('cuota-automotriz').value).toBe(381_267)
    expect(get('tramo-55bis').display).toBe('B')
  })

  it('lo que confirmó el método queda como calculado', () => {
    const get = (id: string) => calcOf(capituloIV, 2025, id)
    for (const id of ['base-imponible', 'bit-uta', 'tramo-55bis', 'tope-55bis', 'renta-neta', 'credit-capacity', 'factor-leverage']) {
      expect(get(id).status, id).toBe('calculado')
      expect(get(id).statusNote, id).toBeNull()
    }
    for (const id of ['renta-bruta', 'tramo-igc', 'credit-capacity-uf']) {
      expect(get(id).status, id).toBe('por_confirmar')
    }
  })

  it('la rebaja máxima de intereses del Art. 55 bis sigue la fórmula del tramo', () => {
    // Bajo 90 UTA corresponde el tope completo; entre 90 y 150, 250 − 1,667 × base en UTA.
    expect(calcOf(capituloIV, 2022, 'tope-55bis').display).toBe('8,00 UTA')
    expect(calcOf(capituloIV, 2024, 'tope-55bis').display).toBe('5,70 UTA')
    expect(calcOf(capituloIV, 2025, 'tope-55bis').display).toBe('4,13 UTA')
    expect(calcOf(capituloIV, 2025, 'tope-55bis').dependsOn).toEqual(['bit-uta'])
  })

  it('en los límites del Art. 55 bis, 90 UTA es tramo A y 150 UTA es tramo C', () => {
    const uta = capituloIV.method.utaByYear[2025]
    const withBase = (utas: number): Report => ({
      ...capituloIV,
      financial: capituloIV.financial.filter((item) => item.year !== 2025),
      igcBase: { ...capituloIV.igcBase, base170: { ...capituloIV.igcBase.base170, 2025: utas * uta } },
    })
    expect(calcOf(withBase(90), 2025, 'tramo-55bis').display).toBe('A')
    expect(calcOf(withBase(90), 2025, 'tope-55bis').display).toBe('8,00 UTA')
    expect(calcOf(withBase(90.5), 2025, 'tramo-55bis').display).toBe('B')
    expect(calcOf(withBase(150), 2025, 'tramo-55bis').display).toBe('C')
    expect(calcOf(withBase(150), 2025, 'tope-55bis').display).toBe('0,00 UTA')
    // En la tabla de Global Complementario el tope de cada tramo pertenece a ese tramo.
    expect(calcOf(withBase(90), 2025, 'tramo-igc').display).toBe('Tramo 4 · 23,0%')
  })

  it('reproduce el Credit Capacity y el factor leverage del caso', () => {
    expect(calcOf(capituloIV, 2025, 'credit-capacity').value).toBe(285_216_668)
    expect(calcOf(capituloIV, 2025, 'credit-capacity-uf').display).toBe('UF 7.424')
    const leverage = calcOf(capituloIV, 2025, 'factor-leverage').equation!
    expect(leverage.kind === 'multiples' && leverage.rows.map((row) => row.result)).toEqual([
      'UF 7.424',
      'UF 14.849',
      'UF 22.273',
      'UF 29.697',
      'UF 37.121',
    ])
    const { method } = capituloIV
    expect(Math.round(presentValue(1_361_668, method.mortgageRate, method.mortgageYears * 12))).toBe(285_216_668)
  })

  it('al ajustar la tasa y el plazo se recalculan el Credit Capacity, su valor en UF y el leverage', () => {
    const calcs = buildYearCalcs(capituloIV, 2025, { rate: 0.035, years: 20 })
    const get = (id: string) => calcs.find((item) => item.id === id)!
    const expected = Math.round(presentValue(1_361_668, 0.035, 240))
    expect(get('credit-capacity').value).toBe(expected)
    expect(get('credit-capacity').plain).toContain('240 meses, con 3,5% de interés anual')
    // Una tasa con dos decimales se muestra tal como se escribió, sin redondearla.
    const exact = buildYearCalcs(capituloIV, 2025, { rate: 0.0375, years: 23 }).find((item) => item.id === 'credit-capacity')!
    expect(exact.plain).toContain('276 meses, con 3,75% de interés anual')
    expect(exact.value).toBe(Math.round(presentValue(1_361_668, 0.0375, 276)))
    expect(get('credit-capacity-uf').value).toBeCloseTo(expected / capituloIV.method.uf.value, 6)
    const sources = operandsOf(get('credit-capacity').equation!).map((operand) => operand.source)
    expect(sources).toEqual(['Calculado en este informe', 'Valor ajustado en este informe', 'Valor ajustado en este informe'])
    // Lo que no depende del crédito no cambia.
    expect(get('limite-hipotecario').value).toBe(1_361_668)
    // Con la misma tasa y plazo de la referencia, el resultado es el del Capítulo IV.
    const same = buildYearCalcs(capituloIV, 2025, { rate: 0.04, years: 30 })
    expect(same.find((item) => item.id === 'credit-capacity')!.value).toBe(285_216_668)
    expect(operandsOf(same.find((item) => item.id === 'credit-capacity')!.equation!)[1].source).toBe('Referencia del Capítulo IV')
  })

  it('las propiedades cuadran con el Bloque 2: activos, patrimonio y pasivos en UF', () => {
    const { summary, calcs } = buildPropertyCalcs(capituloIV)
    const get = (id: string) => calcs.find((item) => item.id === id)!
    expect(summary.avaluoTotal).toBe(919_808_285)
    expect(summary.enajenacionClp).toBe(1_118_305_776)
    expect(summary.pagoContadoClp).toBe(261_244_504)
    expect(get('prop-activos').value).toBe(35_728.07)
    expect(get('prop-patrimonio').value).toBe(7_693.49)
    expect(get('prop-pasivos').value).toBe(28_034.58)
  })
})

describe('caso de referencia (informe real, 5 años)', () => {
  const years = casoReferencia.years
  const fin = (year: number) => casoReferencia.financial.find((item) => item.year === year)!

  it('la renta financiera bruta cuadra con ±10 pesos en los 5 años', () => {
    for (const year of years) {
      const rfb = calcOf(casoReferencia, year, 'renta-bruta')
      const recomputed = evaluate(rfb.equation!.kind === 'arith' ? rfb.equation!.terms : [])!
      expect(Math.abs(Math.round(recomputed) - fin(year).rfb), String(year)).toBeLessThanOrEqual(10)
    }
  })

  it('la regla del factor (0,90 bajo 15% de tasa; 0,80 desde 15%) reproduce la renta neta', () => {
    for (const year of years) {
      const rfn = calcOf(casoReferencia, year, 'renta-neta')
      expect(rfn.check, String(year)).toBeNull()
      expect(rfn.value).toBe(fin(year).rfn)
    }
    const factorOf = (year: number) => {
      const equation = calcOf(casoReferencia, year, 'renta-neta').equation!
      return equation.kind === 'arith' ? equation.terms[1].operand.value : null
    }
    expect(years.map(factorOf)).toEqual([0.8, 0.9, 0.9, 0.8, 0.9])
  })

  it('renta mensual, límite hipotecario, tasa, BIT y tramo no difieren del informe', () => {
    for (const year of years) {
      for (const id of ['rfn-mensual', 'limite-hipotecario', 'tasa-efectiva', 'bit-uta', 'tramo-55bis']) {
        expect(calcOf(casoReferencia, year, id).check, `${id} ${year}`).toBeNull()
      }
    }
    expect(calcOf(casoReferencia, 2026, 'limite-hipotecario').value).toBe(2_100_130)
    expect(calcOf(casoReferencia, 2026, 'tasa-efectiva').display).toBe('12,76%')
    expect(calcOf(casoReferencia, 2025, 'bit-uta').display).toBe('120,45 UTA')
  })

  it('total de orígenes menos rebajas da el código 170 en 4 de 5 años', () => {
    const mismatched = years.filter((year) => calcOf(casoReferencia, year, 'base-imponible').check !== null)
    expect(mismatched).toEqual([2022])
  })

  it('propiedades, Ley 20.455 y deuda por institución reproducen el informe', () => {
    const { summary, calcs } = buildPropertyCalcs(casoReferencia)
    const get = (id: string) => calcs.find((item) => item.id === id)!
    expect(get('prop-activos').value).toBe(24_708)
    expect(get('prop-patrimonio').value).toBe(6_281.6)
    expect(get('prop-pasivos').value).toBe(18_426.4)
    expect(get('ley-20455').value).toBe(5_808)

    // Deuda de origen por institución: enajenación menos pago al contado, como en la vista de referencia.
    expect(summary.byBank.map((item) => [item.bank, item.debtUf, item.properties])).toEqual([
      ['Institución 4', 10_480, 1],
      ['Institución 1', 3_300, 1],
      ['Institución 2', 2_440, 1],
      ['Institución 3', 2_206.4, 1],
    ])
    expect(summary.byBank.map((item) => Math.round(item.share! * 1000) / 10)).toEqual([56.9, 17.9, 13.2, 12])
    const estate = buildRealEstate(summary)
    expect(estate.calcs.map((item) => item.id)).toEqual(['deuda-institucion'])
    expect(estate.calcs[0].value).toBe(get('prop-pasivos').value)
    expect(estate.pending.map((item) => item.id)).toEqual(['leverage-institucion', 'recomendacion-20455'])
  })

  it('en el caso del Capítulo IV la deuda por institución suma los pasivos de origen', () => {
    const { summary, calcs } = buildPropertyCalcs(capituloIV)
    expect(buildRealEstate(summary).calcs[0].value).toBe(calcs.find((item) => item.id === 'prop-pasivos')!.value)
  })
})

describe('trazabilidad', () => {
  const calcs = buildYearCalcs(capituloIV, 2025)

  it('cada código usado en un cálculo queda marcado en su tabla de origen', () => {
    const usage = usageByCode(calcs)
    expect(usage.get('origenes:955')!.map((item) => item.id)).toEqual(['total-origenes', 'renta-bruta'])
    expect(usage.get('base:170')!.map((item) => item.id)).toEqual(['tasa-efectiva', 'bit-uta'])
    expect(usage.get('ajustes:494')!.map((item) => item.id)).toEqual(['renta-bruta'])
  })

  it('las dependencias apuntan a cálculos que existen y permiten recorrer la cadena', () => {
    const ids = new Set(calcs.map((item) => item.id))
    for (const calc of calcs) for (const id of calc.dependsOn) expect(ids.has(id), `${calc.id} → ${id}`).toBe(true)
    const users = usedBy(calcs)
    expect(users.get('rfn-mensual')!.map((item) => item.id)).toEqual(['limite-hipotecario', 'cuota-automotriz'])
    expect(users.get('limite-hipotecario')!.map((item) => item.id)).toEqual(['credit-capacity'])
  })

  it('la línea de tiempo sale ordenada de lo más reciente a lo más antiguo', () => {
    const dates = buildTimeline(capituloIV).map((day) => day.date)
    expect(dates).toEqual(dates.toSorted().toReversed())
    expect(dates.length).toBeGreaterThan(5)
  })
})

describe('prueba masiva: 1.000 reportes al azar', () => {
  const BAD = /NaN|undefined|Infinity|null|\[object/
  const texts = (calc: Calc) => {
    const out = [calc.display, calc.plain, calc.check ?? '', calc.statusNote ?? '']
    if (calc.equation) {
      for (const operand of operandsOf(calc.equation)) out.push(operand.display, operand.label, operand.source)
      if (calc.equation.kind === 'arith' || calc.equation.kind === 'formula') out.push(calc.equation.result)
      if (calc.equation.kind === 'multiples') out.push(...calc.equation.rows.map((row) => row.result))
      if (calc.equation.kind === 'ranges') out.push(...calc.equation.ranges.map((row) => row.range))
      if (calc.equation.kind === 'parts') out.push(calc.equation.total, ...calc.equation.rows.map((row) => row.note))
    }
    return out
  }
  // Deja solo el texto fijo de una frase: quita cifras, signos y el propio resultado.
  const mask = (calc: Calc) =>
    (calc.display === '—' ? calc.plain : calc.plain.split(calc.display).join('@'))
      .replace(/[-−]?\$?[-−]?\d[\d.,]*%?/g, '#')
      .replace(/Tramo # · #|Exento · #|\b[ABC]\b/g, '@')

  const fixed = new Map<string, string>()
  const masks = new Map<string, Set<string>>()
  let total = 0

  it('ninguna salida contiene valores rotos y cada operación cuadra con su resultado', () => {
    for (let seed = 1; seed <= 1000; seed++) {
      const report = randomReport(seed)
      const property = buildPropertyCalcs(report)
      const estate = buildRealEstate(property.summary)
      const calcs = [
        ...report.years.flatMap((year) => buildYearCalcs(report, year)),
        ...property.calcs,
        ...estate.calcs,
      ]
      for (const calc of calcs) {
        total += 1
        for (const text of texts(calc)) expect(text, `semilla ${seed} · ${calc.id}`).not.toMatch(BAD)

        // Textos fijos: idénticos en todos los reportes.
        const signature = [calc.question, calc.name, calc.definition, calc.status, calc.statusNote].join('|')
        expect(fixed.get(calc.id) ?? signature, calc.id).toBe(signature)
        fixed.set(calc.id, signature)
        masks.set(calc.id, (masks.get(calc.id) ?? new Set()).add(mask(calc)))

        // La operación mostrada da el resultado mostrado.
        if (calc.state === 'ok' && calc.equation?.kind === 'arith' && calc.equation.terms.length > 0) {
          const recomputed = evaluate(calc.equation.terms)
          expect(Number.isFinite(recomputed), `semilla ${seed} · ${calc.id}`).toBe(true)
          if (calc.check === null && calc.value !== null) {
            expect(Math.abs((recomputed as number) - calc.value), `semilla ${seed} · ${calc.id}`).toBeLessThanOrEqual(1.01)
          }
        }
      }
      for (const item of estate.pending) {
        for (const operand of item.inputs) expect(operand.display).not.toMatch(BAD)
      }
      for (const day of buildTimeline(report)) for (const event of day.events) expect(event).not.toMatch(BAD)
    }
    expect(total).toBeGreaterThan(40_000)
  }, 30_000)

  it('cada frase "en simple" sale de un conjunto cerrado de plantillas', () => {
    // Por cálculo: su plantilla y, como máximo, las frases fijas de casos especiales.
    for (const [id, set] of masks) expect([...set].length, `${id}: ${[...set].join(' || ')}`).toBeLessThanOrEqual(4)
  })
})
