import { operandsOf, type Calc } from '../../lib/calculos'
import { formatMoney } from '../../lib/format'

interface Row {
  label: string
  value: number
  kind: 'total' | 'minus' | 'plus'
}

// Cascada del dinero: del total declarado a la renta financiera neta, y de la
// renta mensual a las cuotas de referencia. Usa las mismas cifras de los cálculos.
export function MoneyWaterfall({ calcs }: { calcs: Calc[] }) {
  const get = (id: string) => calcs.find((calc) => calc.id === id)
  const total = get('total-origenes')
  const rfb = get('renta-bruta')
  const rfn = get('renta-neta')
  const monthly = get('rfn-mensual')
  const mortgage = get('limite-hipotecario')
  const auto = get('cuota-automotriz')

  const values = [total, rfb, rfn, monthly, mortgage].map((calc) => calc?.value ?? null)
  if (values.some((value) => value === null || value <= 0) || !rfb?.equation || rfb.equation.kind !== 'arith') {
    return (
      <p className="calc-note">
        La cascada se muestra cuando el total declarado y las rentas financieras son mayores que 0.
      </p>
    )
  }

  const annual: Row[] = [
    { label: total!.name, value: total!.value!, kind: 'total' },
    ...rfb.equation.terms
      .filter((term) => term.op !== null && term.operand.value !== null)
      .map((term) => ({
        label: term.operand.label,
        value: term.op === '−' ? -(term.operand.value as number) : (term.operand.value as number),
        kind: term.op === '−' ? ('minus' as const) : ('plus' as const),
      })),
    { label: rfb.name, value: rfb.value!, kind: 'total' },
    {
      label: `Factor de renta neta (× ${rfn?.equation ? (operandsOf(rfn.equation)[1]?.display ?? '') : ''})`,
      value: rfn!.value! - rfb.value!,
      kind: 'minus',
    },
    { label: rfn!.name, value: rfn!.value!, kind: 'total' },
  ]
  const perMonth: Row[] = [
    { label: monthly!.name, value: monthly!.value!, kind: 'total' },
    { label: mortgage!.name, value: mortgage!.value!, kind: 'total' },
    ...(auto?.value ? [{ label: auto.name, value: auto.value, kind: 'total' as const }] : []),
  ]

  return (
    <div className="cascade">
      <Bars title="Al año" rows={annual} />
      <Bars title="Al mes" rows={perMonth} />
    </div>
  )
}

function Bars({ title, rows }: { title: string; rows: Row[] }) {
  const max = Math.max(1, ...rows.filter((row) => row.kind === 'total').map((row) => row.value))
  const { placed } = rows.reduce<{ placed: (Row & { left: number; width: number })[]; running: number }>(
    (acc, row) => {
      if (row.kind === 'total') {
        return {
          placed: [...acc.placed, { ...row, left: 0, width: (row.value / max) * 100 }],
          running: row.value,
        }
      }
      const next = acc.running + row.value
      return {
        placed: [
          ...acc.placed,
          { ...row, left: (Math.min(acc.running, next) / max) * 100, width: (Math.abs(row.value) / max) * 100 },
        ],
        running: next,
      }
    },
    { placed: [], running: 0 },
  )

  return (
    <div className="cascade-group">
      <h3 className="map-title">{title}</h3>
      <ul className="waterfall">
        {placed.map((row) => (
          <li key={row.label} className={`waterfall-row ${row.kind}`}>
            <span className="waterfall-label">{row.label}</span>
            <span className="waterfall-track" aria-hidden="true">
              <span
                className="waterfall-bar"
                style={{
                  left: `${Math.min(Math.max(row.left, 0), 100)}%`,
                  width: `${Math.min(Math.max(row.width, 0.6), 100)}%`,
                }}
              />
            </span>
            <span className="mono waterfall-value">
              {row.kind === 'minus' ? '− ' : row.kind === 'plus' ? '+ ' : ''}
              {formatMoney(Math.abs(row.value))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
