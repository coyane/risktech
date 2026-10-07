import type { Property } from '../types'

export interface GroupCount {
  name: string
  count: number
}

export interface BankSummary {
  bank: string
  properties: number
  debtUf: number | null
}

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

  const banks = new Map<string, BankSummary>()
  for (const property of properties) {
    if (property.institucion === null) continue
    const current = banks.get(property.institucion) ?? {
      bank: property.institucion,
      properties: 0,
      debtUf: null,
    }
    current.properties += 1
    if (property.financiamientoUf !== null) {
      current.debtUf = (current.debtUf ?? 0) + property.financiamientoUf
    }
    banks.set(property.institucion, current)
  }

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
    byBank: [...banks.values()].toSorted((a, b) => (b.debtUf ?? 0) - (a.debtUf ?? 0)),
    byComuna: countBy(properties, (item) => item.comuna),
    byDestino: countBy(properties, (item) => item.destino),
  }
}
