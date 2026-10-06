import { formatAt, formatMillions } from '../lib/format'
import type { Report } from '../types'
import { markProps, niceStep } from './chartUtils'
import { EmptyState } from './Notice'

const WIDTH = 700
const HEIGHT = 280
const LEFT = 56
const RIGHT = 690
const TOP = 30
const BASELINE = 240
const MAX_PITCH = 34
const BARS_PER_GROUP = 3

export function OriginsChart({
  report,
  onSelect,
}: {
  report: Report
  onSelect?: (payload: { year: number; label: string; value: number }) => void
}) {
  const rentals = report.incomeOrigins.find((item) => item.code === '955')
  const groups = report.financial.map((year) => ({
    year: year.year,
    bars: [
      {
        key: 'total',
        value: year.totalOrigins,
        color: 'var(--chart-grey)',
        label: 'Total orígenes',
      },
      {
        key: 'arriendo',
        value: rentals?.values[year.year] ?? 0,
        color: 'var(--chart-orange)',
        label: 'Arriendos',
      },
      {
        key: 'rfn',
        value: year.rfn,
        color: 'var(--accent)',
        label: 'Renta financiera neta',
      },
    ],
  }))

  const maxValue = Math.max(0, ...groups.flatMap((g) => g.bars.map((b) => b.value)))
  if (maxValue <= 0) return <EmptyState text="Sin datos de ingresos para graficar." />

  const step = niceStep(maxValue)
  const tickCount = Math.ceil(maxValue / step)
  const ceiling = tickCount * step
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * step)
  const y = (value: number) => BASELINE - (value / ceiling) * (BASELINE - TOP)
  const groupWidth = (RIGHT - LEFT) / groups.length
  const pitch = Math.min(MAX_PITCH, (groupWidth - 12) / BARS_PER_GROUP)
  const barWidth = pitch - 4
  const showValues = pitch >= 30

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role={onSelect ? 'group' : 'img'}
      aria-label="Orígenes de renta, arriendos y renta financiera neta por año tributario, en millones de pesos"
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
            x={48}
            y={y(tick) + 4}
            textAnchor="end"
            fontSize="12"
            fill="var(--muted)"
            fontFamily="var(--mono)"
          >
            {(tick / 1e6).toLocaleString('es-CL', { maximumFractionDigits: 1 })}
          </text>
        </g>
      ))}
      {groups.map((group, groupIndex) => {
        const startX = LEFT + groupWidth * groupIndex + (groupWidth - pitch * BARS_PER_GROUP) / 2
        return (
          <g key={group.year}>
            {group.bars.map((bar, barIndex) => {
              if (bar.value <= 0) return null
              const x = startX + barIndex * pitch
              const label = `${formatAt(group.year)} · ${bar.label}: $${formatMillions(bar.value)} MM`
              return (
                <g
                  key={bar.key}
                  {...markProps(
                    label,
                    onSelect &&
                      (() => onSelect({ year: group.year, label: bar.label, value: bar.value })),
                  )}
                >
                  <title>{label}</title>
                  <rect x={x} y={TOP} width={pitch} height={BASELINE - TOP} fill="transparent" />
                  <rect
                    x={x + 2}
                    y={y(bar.value)}
                    width={barWidth}
                    height={BASELINE - y(bar.value)}
                    rx={2}
                    fill={bar.color}
                  />
                  {showValues && (
                    <text
                      x={x + pitch / 2}
                      y={y(bar.value) - 6}
                      textAnchor="middle"
                      fontSize="12"
                      fill="var(--ink)"
                      fontFamily="var(--mono)"
                      aria-hidden="true"
                    >
                      {formatMillions(bar.value)}
                    </text>
                  )}
                </g>
              )
            })}
            <text
              x={startX + (pitch * BARS_PER_GROUP) / 2}
              y={262}
              textAnchor="middle"
              fontSize="13"
              fill="var(--ink-2)"
            >
              {formatAt(group.year)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
