import { formatAt, formatExact, formatMoneyMillions, formatNumber, formatRateExact } from '../../lib/format'
import { presentValue } from '../../lib/finanzas'

// Barras por año con base cero: la altura es proporcional al valor y cada barra lleva su cifra.
export function YearBars({
  years,
  values,
  selected,
  format,
  label,
}: {
  years: number[]
  values: (number | null)[]
  selected: number
  format: (value: number) => string
  label: string
}) {
  const max = Math.max(1, ...values.filter((value) => value !== null))
  const described = years
    .map((year, index) => `${formatAt(year)} ${values[index] === null ? 'sin dato' : format(values[index] as number)}`)
    .join(', ')
  return (
    <figure className="pn-bars" aria-label={`${label}: ${described}`}>
      <div className="pn-bars-plot" aria-hidden="true">
        {years.map((year, index) => {
          const value = values[index]
          return (
            <div key={year} className={`pn-bar${year === selected ? ' is-on' : ''}`}>
              <span className="pn-bar-value">{value === null ? '—' : format(value)}</span>
              <span className="pn-bar-fill" style={{ height: `${value === null ? 0 : (value / max) * 84}%` }} />
            </div>
          )
        })}
      </div>
      <div className="pn-bars-axis" aria-hidden="true">
        {years.map((year) => (
          <span key={year} className={year === selected ? 'is-on' : undefined}>
            {formatAt(year)}
          </span>
        ))}
      </div>
      <figcaption className="pn-note">Las barras parten de cero.</figcaption>
    </figure>
  )
}

// El crédito que paga un mismo dividendo según el plazo, a la tasa escrita.
// Responde "¿cuánto cambia el monto si el plazo es otro?". El eje vertical parte de cero.
export function CreditCurve({ dividend, rate, years }: { dividend: number; rate: number; years: number }) {
  const lastYear = Math.max(35, Math.ceil(years / 5) * 5)
  const points: [number, number][] = []
  for (let year = 1; year <= lastYear; year++) points.push([year, presentValue(dividend, rate, year * 12)])
  const top = Math.max(...points.map((point) => point[1]))
  const step = top > 4e8 ? 2e8 : top > 2e8 ? 1e8 : top > 1e8 ? 5e7 : 2e7
  const nice = Math.ceil(top / step) * step
  const height = 210
  const x = (year: number) => ((year - 1) / (lastYear - 1)) * 100
  const y = (value: number) => (1 - value / nice) * 100
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${x(point[0]).toFixed(2)} ${y(point[1]).toFixed(2)}`).join(' ')
  const current = presentValue(dividend, rate, Math.round(years * 12))
  const cx = x(Math.min(years, lastYear))
  const cy = (y(current) / 100) * height
  const grid: number[] = []
  for (let value = 0; value <= nice + 1; value += step) grid.push(value)
  const ticks = [1]
  for (let year = 5; year <= lastYear; year += 5) ticks.push(year)
  const at = (percent: number) => `calc(var(--pl) + (100% - var(--pl)) * ${percent / 100})`
  const tagShift = cx > 60 ? 'is-left' : cx < 25 ? 'is-right' : ''
  const described = ticks.map((tick) => `${tick} ${tick === 1 ? 'año' : 'años'}: ${formatMoneyMillions(presentValue(dividend, rate, tick * 12))}`).join(', ')

  return (
    <figure className="pn-curve">
      <div className="pn-curve-plot" role="img" aria-label={`Crédito según el plazo con ${formatRateExact(rate)} anual. ${described}`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {grid.map((value) => (
            <line
              key={value}
              x1="0"
              x2="100"
              y1={y(value)}
              y2={y(value)}
              className={value === 0 ? 'pn-curve-base' : 'pn-curve-grid'}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={`${path} L100 100 L0 100 Z`} className="pn-curve-area" />
          <path d={path} className="pn-curve-line" vectorEffect="non-scaling-stroke" />
          <line x1={cx} x2={cx} y1="0" y2="100" className="pn-curve-mark" vectorEffect="non-scaling-stroke" />
        </svg>
        {grid.map((value) => (
          <span key={value} className="pn-curve-y" style={{ top: `${(y(value) / 100) * height}px` }} aria-hidden="true">
            {value === 0 ? '$0' : `$${formatNumber(value / 1e6)} MM`}
          </span>
        ))}
        {ticks.map((tick, index) => (
          <span
            key={tick}
            className={`pn-curve-x${index === 0 ? ' is-first' : index === ticks.length - 1 ? ' is-last' : ''}`}
            style={{ left: at(x(tick)) }}
            aria-hidden="true"
          >
            {tick}
          </span>
        ))}
        <span className="pn-curve-dot" style={{ left: at(cx), top: `${cy}px` }} aria-hidden="true" />
        <span className={`pn-curve-tag ${tagShift}`} style={{ left: at(cx), top: `${cy}px` }} aria-hidden="true">
          {formatExact(years)} años: {formatMoneyMillions(current)}
        </span>
      </div>
      <figcaption className="pn-note">
        Plazo en años, con {formatRateExact(rate)} anual. El eje parte de cero.
      </figcaption>
    </figure>
  )
}
