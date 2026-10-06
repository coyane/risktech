import type { KeyboardEvent } from 'react'

// Paso "redondo" (1, 2, 2.5, 5 o 10 × 10^k) para unas `target` divisiones del eje.
export function niceStep(max: number, target = 5) {
  const raw = max / target
  const pow = 10 ** Math.floor(Math.log10(raw))
  const n = raw / pow
  const factor = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return factor * pow
}

export function markProps(label: string, onActivate?: () => void) {
  if (!onActivate) return {}
  return {
    role: 'button',
    tabIndex: 0,
    className: 'chart-mark',
    'aria-label': label,
    onClick: onActivate,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      onActivate()
    },
  }
}
