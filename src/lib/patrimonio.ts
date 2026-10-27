import type { Property } from '../types'

export interface GroupCount {
  name: string
  count: number
}

export interface BankSummary {
  bank: string
  properties: number
  // Deuda de origen: enajenación menos pago al contado de sus propiedades, en UF.
  debtUf: number | null
  // Parte de la deuda de origen total.
  share: number | null
}

export const NO_BANK = 'Sin institución informada'

export interface PatrimonySummary {
  count: number
  avaluoTotal: number
  contribucionTotal: number | null
  // Suma de precios de adquisición, en pesos y en UF.
  enajenacionClp: number | null
  enajenacionUf: number | null
  pagoContadoClp: number | null
  pagoContadoUf: number | null
  // Enajenación menos pago al contado. Es lo financiado al comprar, no la deuda vigente.
  pasivosUf: number | null
  ley20455Count: number
  ley20455Uf: number | null
  byBank: BankSummary[]
  byComuna: GroupCount[]
  byDestino: GroupCount[]
}

// Suma solo valores informados; si no hay ninguno, el total es desconocido.
export function sumKnown(values: (number | null)[]) {
  const known = values.filter((value) => value !== null)
  return known.length === 0 ? null : known.reduce((sum, value) => sum + value, 0)
}

const round2 = (value: number) => Math.round(value * 100) / 100

function countBy(properties: Property[], key: (property: Property) => string): GroupCount[] {
  const groups = new Map<string, number>()
  for (const property of properties) {
    const name = key(property)
    groups.set(name, (groups.get(name) ?? 0) + 1)
  }
  return [...groups.entries()]
    .map(([name, count]) => ({ name, count }))
    .toSorted((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

// Totales del patrimonio inmobiliario tal como los calcula el informe de referencia.
export function summarizeProperties(properties: Property[]): PatrimonySummary {
  const uf = (values: (number | null)[]) => {
    const total = sumKnown(values)
    return total === null ? null : round2(total)
  }
  const enajenacionUf = uf(properties.map((item) => item.enajenacionUf))
  const pagoContadoUf = uf(properties.map((item) => item.pagoContadoUf))
  const exempt = properties.filter((item) => item.ley20455)

  // La deuda de origen de una propiedad es lo que no se pagó al contado. Se agrupa por quien
  // financió la compra; lo que no tiene institución informada queda en un grupo aparte.
  const banks = new Map<string, BankSummary>()
  for (const property of properties) {
    const debt =
      property.enajenacionUf !== null && property.pagoContadoUf !== null
        ? property.enajenacionUf - property.pagoContadoUf
        : null
    if (property.institucion === null && (debt === null || debt <= 0)) continue
    const bank = property.institucion ?? NO_BANK
    const current = banks.get(bank) ?? { bank, properties: 0, debtUf: null, share: null }
    current.properties += 1
    if (debt !== null) current.debtUf = round2((current.debtUf ?? 0) + debt)
    banks.set(bank, current)
  }
  const bankDebt = sumKnown([...banks.values()].map((item) => item.debtUf))
  const byBank = [...banks.values()]
    .map((item) => ({
      ...item,
      share: item.debtUf !== null && bankDebt ? item.debtUf / bankDebt : null,
    }))
    .toSorted((a, b) => (b.debtUf ?? 0) - (a.debtUf ?? 0) || a.bank.localeCompare(b.bank))

  return {
    count: properties.length,
    avaluoTotal: properties.reduce((sum, item) => sum + item.avaluo, 0),
    contribucionTotal: sumKnown(properties.map((item) => item.contribucion)),
    enajenacionClp: sumKnown(properties.map((item) => item.precioAdquisicion)),
    enajenacionUf,
    pagoContadoClp: sumKnown(properties.map((item) => item.pagoContado)),
    pagoContadoUf,
    pasivosUf:
      enajenacionUf !== null && pagoContadoUf !== null ? round2(enajenacionUf - pagoContadoUf) : null,
    ley20455Count: exempt.length,
    ley20455Uf: uf(exempt.map((item) => item.enajenacionUf)),
    byBank,
    byComuna: countBy(properties, (item) => item.comuna),
    byDestino: countBy(properties, (item) => item.destino),
  }
}

// ---------- Plazo del crédito de cada propiedad ----------

export interface PlazoCredito {
  // Plazo pactado en la escritura, en meses.
  pactadoMeses: number
  // Meses desde la fecha de la escritura hasta la fecha de captura, sin pasar del plazo pactado.
  transcurridoMeses: number
  restanteMeses: number
}

// Meses completos entre dos fechas ISO (AAAA-MM-DD); un mes cuenta cuando se cumple el mismo día.
export function mesesEntre(desde: string, hasta: string): number {
  const [y1, m1, d1] = desde.slice(0, 10).split('-').map(Number)
  const [y2, m2, d2] = hasta.slice(0, 10).split('-').map(Number)
  return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0)
}

// El SII no informa los dividendos pagados: se cuenta el tiempo transcurrido desde la escritura,
// lo que supone pagos al día. Sin plazo o sin fecha de escritura, no se calcula.
export function plazoCredito(property: Property, capturedAt: string): PlazoCredito | null {
  const pactado = property.plazoMeses
  const desde = property.fechaAdquisicion ?? property.fechaInscripcion
  if (!pactado || pactado <= 0 || !desde) return null
  const transcurrido = Math.min(Math.max(mesesEntre(desde, capturedAt), 0), pactado)
  return { pactadoMeses: pactado, transcurridoMeses: transcurrido, restanteMeses: pactado - transcurrido }
}

// "6 años y 4 meses", "25 años", "1 mes".
export function formatMeses(meses: number): string {
  const anos = Math.floor(meses / 12)
  const resto = meses % 12
  const parte = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`
  if (anos === 0) return parte(resto, 'mes', 'meses')
  if (resto === 0) return parte(anos, 'año', 'años')
  return `${parte(anos, 'año', 'años')} y ${parte(resto, 'mes', 'meses')}`
}
