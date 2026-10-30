/** RUT chileno: limpieza, dígito verificador (módulo 11) y formato con puntos y guion. */
export const cleanRut = (v: string): string => v.replace(/[^0-9kK]/g, '').toUpperCase()

export function isValidRut(v: string): boolean {
  const c = cleanRut(v)
  if (c.length < 2) return false
  const body = c.slice(0, -1)
  const dv = c.slice(-1)
  if (!/^\d+$/.test(body)) return false
  let s = 0
  let m = 2
  for (let i = body.length - 1; i >= 0; i--) {
    s += Number(body[i]) * m
    m = m === 7 ? 2 : m + 1
  }
  const r = 11 - (s % 11)
  const expected = r === 11 ? '0' : r === 10 ? 'K' : String(r)
  return dv === expected
}

export function formatRut(v: string): string {
  const c = cleanRut(v)
  return c.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + c.slice(-1)
}

export const rutMessage = (v: string): string =>
  !v.trim() ? 'Ingresa tu RUT.' : !isValidRut(v) ? 'El RUT no es válido. Revisa el número y el dígito verificador.' : ''
