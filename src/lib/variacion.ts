import type { Calc } from './calculos'
import { formatAt, formatDecimal } from './format'

// Variación de un cálculo frente al año anterior, como dato y nunca como evaluación:
// sin flechas, sin adjetivos ni colores que juzguen. Una sola plantilla por tipo de cifra.
export const FIRST_YEAR = 'Primer año del informe'

export function yearDelta(byYear: Map<number, Calc[]>, years: number[], year: number, id: string): string | null {
  const index = years.indexOf(year)
  if (index <= 0) return index === 0 ? FIRST_YEAR : null
  const previous = years[index - 1]
  const before = byYear.get(previous)?.find((calc) => calc.id === id)?.value ?? null
  const now = byYear.get(year)?.find((calc) => calc.id === id)?.value ?? null
  if (before === null || now === null) return null
  const sign = (value: number) => (value < 0 ? '−' : '+')
  // Las tasas se comparan en puntos; los montos, en porcentaje.
  if (id === 'tasa-efectiva') {
    const points = (now - before) * 100
    return `${sign(points)}${formatDecimal(Math.abs(points), 2)} pts vs ${formatAt(previous)}`
  }
  if (before === 0) return null
  const change = (now / before - 1) * 100
  return `${sign(change)}${formatDecimal(Math.abs(change), 1)}% vs ${formatAt(previous)}`
}
