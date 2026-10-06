function cleanRut(value: string) {
  return value.replace(/[^0-9kK]/g, '').toUpperCase()
}

export function isValidRut(value: string) {
  const clean = cleanRut(value)
  if (!/^\d{7,8}[\dK]$/.test(clean)) return false
  const body = clean.slice(0, -1)
  let sum = 0
  let factor = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * factor
    factor = factor === 7 ? 2 : factor + 1
  }
  const rest = 11 - (sum % 11)
  const expected = rest === 11 ? '0' : rest === 10 ? 'K' : String(rest)
  return clean.slice(-1) === expected
}

// Forma canónica del ERS: cuerpo sin puntos y dígito verificador separado.
export function splitRut(value: string) {
  const clean = cleanRut(value)
  return { rut: clean.slice(0, -1), dv: clean.slice(-1) }
}

export function formatRut(value: string) {
  const clean = cleanRut(value)
  if (clean.length < 2) return clean
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${body}-${clean.slice(-1)}`
}
