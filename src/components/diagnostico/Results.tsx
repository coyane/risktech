import type { Calc } from '../../lib/calculos'
import { formatAmount, formatAt } from '../../lib/format'
import type { Report } from '../../types'
import { TableWrap } from '../SectionCard'

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
