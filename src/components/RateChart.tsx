import { formatAt, formatRate } from '../lib/format'
import type { Report } from '../types'
import { markProps } from './chartUtils'
import { EmptyState } from './Notice'

const WIDTH = 420
const HEIGHT = 240
const LEFT = 44
const RIGHT = 410
const BASELINE = 200
const LABEL_Y = 40
const HIT_RADIUS = 18

export function RateChart({
  report,
  onSelect,
}: {
  report: Report
  onSelect?: (payload: { year: number; rate: number }) => void
}) {
  const points = report.financial.map((year) => ({
    year: year.year,
    rate: year.effectiveRate,
  }))
  if (points.length === 0) return <EmptyState text="Sin datos de tasa efectiva para graficar." />

  const maxRate = Math.max(0.2, Math.ceil(Math.max(...points.map((p) => p.rate)) * 20) / 20)
  const ticks = Array.from({ length: Math.round(maxRate / 0.05) + 1 }, (_, i) => i * 0.05)
  const slot = (RIGHT - LEFT) / points.length
  const x = (index: number) => LEFT + slot * index + slot / 2
  const y = (rate: number) => BASELINE - (rate / maxRate) * 160
  const brackets = report.igcBase.bracket55bis
  const changeAt = points.findIndex(
    (point, index) => index > 0 && brackets[point.year] !== brackets[points[index - 1].year],
  )
  const changeX = changeAt > 0 ? (x(changeAt) + x(changeAt - 1)) / 2 : 0
  const last = points.length - 1

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role={onSelect ? 'group' : 'img'}
      aria-label="Tasa efectiva de impuesto por año tributario"
    >
      {ticks.map((tick) => (
        <g key={tick} aria-hidden="true">
          <line
            x1={LEFT}
            x2={RIGHT}
            y1={y(tick)}
            y2={y(tick)}
            stroke={tick === 0 ? 'var(--axis)' : 'var(--line-soft)'}
          />
          <text
            x={36}
            y={y(tick) + 4}
            textAnchor="end"
            fontSize="12"
            fill="var(--muted)"
            fontFamily="var(--mono)"
          >
            {Math.round(tick * 100)}%
          </text>
        </g>
      ))}
      {changeAt > 0 && (
        <g>
          <line
            x1={changeX}
            x2={changeX}
            y1={30}
            y2={BASELINE}
            stroke="var(--axis)"
            strokeDasharray="4 4"
          />
          <text x={changeX + 8} y={LABEL_Y} fontSize="13" fill="var(--muted)">
            Pasa a tramo {brackets[points[changeAt].year]}
          </text>
        </g>
      )}
      <polyline
        points={points.map((point, index) => `${x(index)},${y(point.rate)}`).join(' ')}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2.5}
      />
      {points.map((point, index) => {
        const label = `${formatAt(point.year)}: ${formatRate(point.rate)}`
        return (
          <g key={point.year}>
            <g
              {...markProps(
                label,
                onSelect && (() => onSelect({ year: point.year, rate: point.rate })),
              )}
            >
              <title>{label}</title>
              <circle cx={x(index)} cy={y(point.rate)} r={HIT_RADIUS} fill="transparent" />
              <circle
                cx={x(index)}
                cy={y(point.rate)}
                r={index === last ? 6 : 5}
                fill="var(--accent)"
              />
            </g>
            <text
              x={x(index)}
              y={y(point.rate) - 13}
              textAnchor="middle"
              fontSize="13"
              fontWeight={index === last ? 600 : 400}
              fill="var(--ink)"
              fontFamily="var(--mono)"
              aria-hidden="true"
            >
              {formatRate(point.rate)}
            </text>
            <text x={x(index)} y={224} textAnchor="middle" fontSize="13" fill="var(--ink-2)">
              {formatAt(point.year)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
