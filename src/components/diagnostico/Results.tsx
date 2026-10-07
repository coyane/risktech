import type { Calc } from '../../lib/calculos'
import { formatAmount, formatAt } from '../../lib/format'
import type { Report } from '../../types'
import { TableWrap } from '../SectionCard'

const HERO = ['total-origenes', 'tasa-efectiva', 'rfn-mensual', 'limite-hipotecario', 'credit-capacity', 'credit-capacity-uf']
const ROWS = [
  'tasa-efectiva',
  'renta-bruta',
  'renta-neta',
  'rfn-mensual',
  'bit-uta',
  'tramo-55bis',
  'limite-hipotecario',
  'credit-capacity',
  'credit-capacity-uf',
]

// Las cifras principales del año elegido, cada una con su pregunta.
export function ResultsHero({ calcs, ids = HERO }: { calcs: Calc[]; ids?: string[] }) {
  const items = ids.map((id) => calcs.find((calc) => calc.id === id)).filter((item) => item !== undefined)
  return (
    <div className="hero">
      {items.map((calc) => (
        <a key={calc.id} className="hero-item" href={`#calc-${calc.id}`}>
          <span className="hero-question">{calc.question}</span>
          <span className="hero-value">{calc.display}</span>
          <span className="hero-name">{calc.name}</span>
        </a>
      ))}
    </div>
  )
}

// La tabla "Análisis financiero" del informe de referencia, con todos los años.
export function ResultsTable({
  report,
  byYear,
  selected,
}: {
  report: Report
  byYear: Map<number, Calc[]>
  selected: number
}) {
  const years = report.years
  const first = byYear.get(years[0]) ?? []
  const cell = (year: number, id: string) => byYear.get(year)?.find((calc) => calc.id === id)?.display ?? '—'
  const className = (year: number) => (year === selected ? 'col-selected' : undefined)

  return (
    <TableWrap>
      <table className="results">
        <thead>
          <tr>
            <th>Indicador</th>
            {years.map((year) => (
              <th key={year} className={className(year)}>
                {formatAt(year)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.slice(0, 1).map((id) => (
            <ResultRow key={id} id={id} name={first.find((calc) => calc.id === id)?.name ?? id} years={years} cell={cell} className={className} />
          ))}
          <tr>
            <td>
              <a href="#base-157">Impuesto determinado</a>
            </td>
            {years.map((year) => (
              <td key={year} className={className(year)}>
                {report.igcBase.tax157[year] == null ? '—' : `$${formatAmount(report.igcBase.tax157[year])}`}
              </td>
            ))}
          </tr>
          {ROWS.slice(1).map((id) => (
            <ResultRow key={id} id={id} name={first.find((calc) => calc.id === id)?.name ?? id} years={years} cell={cell} className={className} />
          ))}
        </tbody>
      </table>
    </TableWrap>
  )
}

function ResultRow({
  id,
  name,
  years,
  cell,
  className,
}: {
  id: string
  name: string
  years: number[]
  cell: (year: number, id: string) => string
  className: (year: number) => string | undefined
}) {
  return (
    <tr>
      <td>
        <a href={`#calc-${id}`}>{name}</a>
      </td>
      {years.map((year) => (
        <td key={year} className={className(year)}>
          {cell(year, id)}
        </td>
      ))}
    </tr>
  )
}

export function YearPicker({
  years,
  selected,
  onSelect,
}: {
  years: number[]
  selected: number
  onSelect: (year: number) => void
}) {
  return (
    <div className="year-picker">
      <span className="year-picker-label">Año</span>
      <div className="chip-group" role="group" aria-label="Año de la declaración">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            className={`chip${year === selected ? ' on' : ''}`}
            aria-pressed={year === selected}
            onClick={() => onSelect(year)}
          >
            {formatAt(year)}
          </button>
        ))}
      </div>
    </div>
  )
}
