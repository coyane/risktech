import demo from '../../../data/demo.json'
import type { Property, Report } from '../../../types'

// El caso del Capítulo IV (Carlos Díaz, AT 2022–2025), tal como lo usa la demo.
export const capituloIV = demo.report as unknown as Report

const byYear = <T,>(years: number[], values: T[]) =>
  Object.fromEntries(years.map((year, index) => [year, values[index]])) as Record<number, T>

const property = (partial: Partial<Property>, index: number): Property => ({
  rol: `P${index + 1}`,
  comuna: 'Comuna',
  region: 'Región',
  destino: 'Habitacional',
  direccion: null,
  avaluo: 0,
  avaluoAfecto: null,
  avaluoExento: null,
  contribucion: null,
  superficieTerreno: null,
  superficieConstruida: null,
  fechaAdquisicion: null,
  tipoActo: null,
  precioAdquisicion: null,
  pagoContado: null,
  montoFinanciado: null,
  institucion: null,
  financiamientoUf: null,
  enajenacionUf: null,
  pagoContadoUf: null,
  ley20455: false,
  usoFamiliar: false,
  ...partial,
})

export interface CaseInput {
  years: number[]
  origins: Record<string, number[]>
  deductions: Record<string, number[]>
  gastoPresunto: number[]
  base170: number[]
  tax157: number[]
  financial: {
    totalOrigins: number[]
    effectiveRate: number[]
    rfb: number[]
    rfn: number[]
    rfnMonthly: number[]
    bitUta: number[]
    bracket: string[]
    mortgageLimit: number[]
  }
  uta: number[]
  properties: Partial<Property>[]
}

// Arma un reporte completo con las reglas del método de la demo y los datos del caso.
export function makeReport(input: CaseInput): Report {
  const { years } = input
  return {
    ...capituloIV,
    years,
    incomeOrigins: capituloIV.incomeOrigins.map((item) => ({
      ...item,
      values: byYear(years, input.origins[item.code] ?? years.map(() => 0)),
    })),
    deductions: capituloIV.deductions.map((item) => ({
      ...item,
      values: byYear(years, input.deductions[item.id] ?? years.map(() => 0)),
    })),
    igcBase: {
      base170: byYear(years, input.base170),
      tax157: byYear(years, input.tax157),
      bracket55bis: byYear(years, input.financial.bracket),
    },
    financial: years.map((year, index) => ({
      year,
      totalOrigins: input.financial.totalOrigins[index],
      effectiveRate: input.financial.effectiveRate[index],
      rfb: input.financial.rfb[index],
      rfn: input.financial.rfn[index],
      rfnMonthly: input.financial.rfnMonthly[index],
      bitUta: input.financial.bitUta[index],
      mortgageLimit: input.financial.mortgageLimit[index],
    })),
    f22Returns: years.map((year) => ({
      year,
      folio: `F${year}`,
      filedAt: `${year}-04-30`,
      filingType: 'original' as const,
    })),
    properties: input.properties.map(property),
    companies: [],
    regimes: [],
    stampings: [],
    contingency: null,
    method: {
      ...capituloIV.method,
      utaByYear: byYear(years, input.uta),
      adjustments: [
        { code: '494', label: 'Gastos presuntos de honorarios', values: byYear(years, input.gastoPresunto) },
      ],
    },
  }
}

// Caso de referencia: cifras de un Informe de Apertura real de BICRED (AT 2022–2026),
// sin nombre, RUT, roles ni sociedades. El código 494 no viene en ese informe: se
// infiere como 3/7 de los honorarios (gasto presunto de 30% sobre el bruto).
const refYears = [2022, 2023, 2024, 2025, 2026]
const honorarios = [3164627, 9934760, 3783258, 1176000, 1595840]

export const casoReferencia = makeReport({
  years: refYears,
  origins: {
    '104': [10804, 42896, 64741, 110163, 150853],
    '105': [163204, 505, 0, 263, 0],
    '955': [0, 0, 4832636, 4800000, 625000],
    '155': [390634, 0, 485712, 16912, 5660328],
    '152': [1332, 6486, 70314, 172572, 130079],
    '749': [60748, 2221, 3955, 7361, 7397],
    '161': [84350679, 65317874, 69715015, 97223587, 103908580],
    '110': honorarios,
  },
  deductions: {
    'perdida-capitales': [318938, 505, 4626, 5094, 47034],
    'intereses-55bis': [1303276, 4635035, 4882348, 2987014, 4811216],
    'apv-42bis': [1678575, 0, 0, 0, 23004475],
  },
  gastoPresunto: honorarios.map((value) => Math.round((value * 3) / 7)),
  base170: [86093438, 70669202, 74068657, 100514750, 84215352],
  tax157: [14973491, 8420302, 8800334, 16348610, 10747296],
  financial: {
    totalOrigins: [88142028, 75304742, 78955631, 103506858, 112078077],
    effectiveRate: [0.1739, 0.1192, 0.1188, 0.1626, 0.1276],
    rfb: [89496970, 79556016, 75674083, 99038291, 112006936],
    rfn: [71597576, 71600414, 68106675, 79230633, 100806242],
    rfnMonthly: [5966465, 5966701, 5675556, 6602553, 8400520],
    bitUta: [117.31, 91.71, 91.72, 120.45, 97.85],
    bracket: ['B', 'B', 'B', 'B', 'B'],
    mortgageLimit: [1491616, 1491675, 1418889, 1650638, 2100130],
  },
  uta: [733884, 770592, 807528, 834504, 860658],
  properties: [
    { enajenacionUf: 5800, pagoContadoUf: 2500, ley20455: true, avaluo: 475466001, precioAdquisicion: 717611099, pagoContado: 182480240 },
    { enajenacionUf: 3050, pagoContadoUf: 610 },
    { enajenacionUf: 0, pagoContadoUf: 0, destino: 'Bodega y almacenaje' },
    { enajenacionUf: 2758, pagoContadoUf: 551.6 },
    { enajenacionUf: 0, pagoContadoUf: 0, destino: 'Estacionamiento' },
    { enajenacionUf: 13100, pagoContadoUf: 2620, ley20455: true, usoFamiliar: true },
    { enajenacionUf: 0, pagoContadoUf: 0, destino: 'Estacionamiento' },
  ],
})

// ---------- Reportes al azar para la prueba masiva ----------

// Generador con semilla: la prueba masiva es reproducible.
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomReport(seed: number): Report {
  const rnd = mulberry32(seed)
  const int = (max: number) => Math.floor(rnd() * max)
  const pick = <T,>(items: T[]) => items[int(items.length)]
  // Mezcla deliberada de ceros, montos chicos, grandes y algunos negativos.
  const amount = () => pick([0, 0, 0, int(1000), int(5_000_000), int(150_000_000), -int(2_000_000)])

  const count = 1 + int(6)
  const years = Array.from({ length: count }, (_, index) => 2027 - count + index)
  const codes = capituloIV.incomeOrigins.map((item) => item.code)
  const origins = Object.fromEntries(codes.map((code) => [code, years.map(amount)]))
  const deductionIds = capituloIV.deductions.map((item) => item.id)
  const deductions = Object.fromEntries(
    deductionIds.map((id) => [id, years.map(() => Math.abs(pick([0, 0, int(8_000_000)])))]),
  )
  const gastoPresunto = years.map((_, index) => Math.max(0, Math.round((origins['110'][index] * 3) / 7)))

  const sum = (table: Record<string, number[]>, index: number) =>
    Object.values(table).reduce((acc, values) => acc + values[index], 0)
  const total = years.map((_, index) => sum(origins, index))
  const base = years.map((_, index) => pick([total[index] - sum(deductions, index), 0, total[index]]))
  const tax = base.map((value) => (value > 0 ? Math.round(value * rnd() * 0.4) : 0))
  const uta = years.map(() => 700_000 + int(200_000))
  const rule = capituloIV.method.rfnFactorRule

  const rate = base.map((value, index) => (value === 0 ? 0 : tax[index] / value))
  // El "motor" de la prueba: mismas reglas, con la diferencia de pocos pesos que se ve en los casos reales.
  const rfb = total.map(
    (value, index) => value - origins['955'][index] - origins['152'][index] + gastoPresunto[index] + int(11),
  )
  const rfn = rfb.map((value, index) =>
    Math.round(value * (rate[index] < rule.rateThreshold ? rule.factorBelow : rule.factorFrom)),
  )
  const monthly = rfn.map((value) => Math.round(value / 12))
  const bit = base.map((value, index) => Math.round((value / uta[index]) * 100) / 100)

  return makeReport({
    years,
    origins,
    deductions,
    gastoPresunto,
    base170: base,
    tax157: tax,
    financial: {
      totalOrigins: total,
      effectiveRate: rate.map((value) => Math.round(value * 10000) / 10000),
      rfb,
      rfn,
      rfnMonthly: monthly,
      bitUta: bit,
      bracket: bit.map((value) => (value < 90 ? 'A' : value < 150 ? 'B' : 'C')),
      mortgageLimit: monthly.map((value) => Math.round(value * capituloIV.method.mortgageFactor)),
    },
    uta,
    properties: Array.from({ length: int(9) }, () => {
      const known = rnd() > 0.2
      const price = int(15_000)
      return {
        enajenacionUf: known ? price : null,
        pagoContadoUf: known ? Math.round(price * rnd() * 100) / 100 : null,
        precioAdquisicion: known ? price * 30_000 : null,
        pagoContado: known ? Math.round(price * 30_000 * rnd()) : null,
        avaluo: int(300_000_000),
        ley20455: rnd() > 0.7,
        institucion: rnd() > 0.5 ? pick(['Banco A', 'Banco B']) : null,
        financiamientoUf: rnd() > 0.5 ? int(9000) : null,
      }
    }),
  })
}
