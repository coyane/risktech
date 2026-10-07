const numberFmt = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })

export const DASH = '—'

export const formatNumber = (value: number) => numberFmt.format(value)

// Un valor ausente se muestra como raya, nunca como cero.
export const formatAmount = (value: number | null | undefined) =>
  value == null ? DASH : numberFmt.format(value)

export const formatMoney = (value: number) => `$${numberFmt.format(value)}`

export const formatDecimal = (value: number, digits = 1) =>
  value.toLocaleString('es-CL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

export const formatRate = (value: number, digits = 1) => `${formatDecimal(value * 100, digits)}%`

// Un número escrito por la persona se muestra con los decimales que tiene, sin redondearlo
// a otro valor: 3,75 no puede aparecer como 3,8.
export function formatExact(value: number, minDigits = 0, maxDigits = 3) {
  let digits = minDigits
  while (digits < maxDigits && Math.abs(value - Number(value.toFixed(digits))) > 1e-9) digits += 1
  return formatDecimal(value, digits)
}

export const formatRateExact = (value: number) => `${formatExact(Math.round(value * 1e7) / 1e5, 1)}%`

export const formatMillions = (value: number) => formatDecimal(value / 1e6)

export const formatMoneyMillions = (value: number) => `$${formatMillions(value)} MM`

export const formatUf = (value: number, digits = 0) => `UF ${formatDecimal(value, digits)}`

export const formatAt = (year: number) => `AT ${year}`

export const formatDate = (iso: string) => {
  const [year, month, day] = iso.slice(0, 10).split('-')
  return `${day}-${month}-${year}`
}
