import { glossary } from '../../data/glosario'
import type { Calc } from '../../lib/calculos'
import { formatAmount, formatAt, formatDate } from '../../lib/format'
import type { TimelineDay } from '../../lib/timeline'
import type { Report } from '../../types'
import { EmptyState } from '../Notice'
import { SectionCard, TableWrap } from '../SectionCard'

// Marca "se usa en": qué cálculos toman este dato.
function UsedIn({ calcs }: { calcs: Calc[] | undefined }) {
  if (!calcs || calcs.length === 0) return <span className="muted">—</span>
  return (
    <span className="used-in">
      {calcs.map((calc) => (
        <a key={calc.id} href={`#calc-${calc.id}`}>
          {calc.name}
        </a>
      ))}
    </span>
  )
}

function YearHead({ years, selected }: { years: number[]; selected: number }) {
  return (
    <>
      {years.map((year) => (
        <th key={year} className={year === selected ? 'col-selected' : undefined}>
          {formatAt(year)}
        </th>
      ))}
    </>
  )
}

export function RentaTables({
  report,
  usage,
  selected,
}: {
  report: Report
  usage: Map<string, Calc[]>
  selected: number
}) {
  const { years } = report
  const sel = (year: number) => (year === selected ? 'col-selected' : undefined)
  const cells = (values: Record<number, number | null>) =>
    years.map((year) => (
      <td key={year} className={sel(year)}>
        {formatAmount(values[year] ?? 0)}
      </td>
    ))
  const total = (rows: { values: Record<number, number | null> }[]) =>
    years.map((year) => (
      <td key={year} className={sel(year)}>
        {formatAmount(rows.reduce((sum, row) => sum + (row.values[year] ?? 0), 0))}
      </td>
    ))

  return (
    <>
      <SectionCard id="origenes" title="Orígenes de renta" note="Formulario 22" as="h3">
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th>Glosa</th>
                <th>Código</th>
                <YearHead years={years} selected={selected} />
                <th className="cell-text">Se usa en</th>
              </tr>
            </thead>
            <tbody>
              {report.incomeOrigins.map((item) => (
                <tr key={item.code} id={`origenes-${item.code}`}>
                  <td>{item.label}</td>
                  <td>{item.code}</td>
                  {cells(item.values)}
                  <td className="cell-text">
                    <UsedIn calcs={usage.get(`origenes:${item.code}`)} />
                  </td>
                </tr>
              ))}
              <tr className="total">
                <td>Total orígenes de renta</td>
                <td />
                {total(report.incomeOrigins)}
                <td />
              </tr>
            </tbody>
          </table>
        </TableWrap>
      </SectionCard>

      <SectionCard id="rebajas" title="Rebajas" note="Formulario 22" as="h3">
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th>Glosa</th>
                <th>Código</th>
                <YearHead years={years} selected={selected} />
                <th className="cell-text">Se usa en</th>
              </tr>
            </thead>
            <tbody>
              {report.deductions.map((item) => (
                <tr key={item.id} id={`rebajas-${item.id}`}>
                  <td>{item.label}</td>
                  <td>{item.code ?? '—'}</td>
                  {cells(item.values)}
                  <td className="cell-text">
                    <UsedIn calcs={usage.get(`rebajas:${item.id}`)} />
                  </td>
                </tr>
              ))}
              <tr className="total">
                <td>Total rebajas</td>
                <td />
                {total(report.deductions)}
                <td />
              </tr>
            </tbody>
          </table>
        </TableWrap>
      </SectionCard>

      <SectionCard id="base" title="Base imponible e impuesto" note="Formulario 22" as="h3">
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th>Glosa</th>
                <th>Código</th>
                <YearHead years={years} selected={selected} />
                <th className="cell-text">Se usa en</th>
              </tr>
            </thead>
            <tbody>
              <tr id="base-170">
                <td>Base imponible tributaria</td>
                <td>170</td>
                {years.map((year) => (
                  <td key={year} className={sel(year)}>
                    {formatAmount(report.igcBase.base170[year])}
                  </td>
                ))}
                <td className="cell-text">
                  <UsedIn calcs={usage.get('base:170')} />
                </td>
              </tr>
              <tr id="base-157">
                <td>Impuesto determinado según tabla</td>
                <td>157</td>
                {years.map((year) => (
                  <td key={year} className={sel(year)}>
                    {formatAmount(report.igcBase.tax157[year])}
                  </td>
                ))}
                <td className="cell-text">
                  <UsedIn calcs={usage.get('base:157')} />
                </td>
              </tr>
            </tbody>
          </table>
        </TableWrap>
      </SectionCard>

      <SectionCard id="ajustes" title="Otros códigos usados por el método" note="Formulario 22" as="h3">
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th>Glosa</th>
                <th>Código</th>
                <YearHead years={years} selected={selected} />
                <th className="cell-text">Se usa en</th>
              </tr>
            </thead>
            <tbody>
              {report.method.adjustments.map((item) => (
                <tr key={item.code} id={`ajustes-${item.code}`}>
                  <td>{item.label}</td>
                  <td>{item.code}</td>
                  {years.map((year) => (
                    <td key={year} className={sel(year)}>
                      {formatAmount(item.values[year])}
                    </td>
                  ))}
                  <td className="cell-text">
                    <UsedIn calcs={usage.get(`ajustes:${item.code}`)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <p className="section-body footnote">
          La raya (—) indica un código que esta captura no trae. En un Formulario 22 capturado, un
          código que no aparece equivale a cero.
        </p>
      </SectionCard>
    </>
  )
}

// Lo que el SII registra de la persona, fuera de las declaraciones de renta.
export function ContribuyenteTables({ report }: { report: Report }) {
  return (
    <>
      <SectionCard id="actividades" title="Actividades económicas" note="SII" as="h3">
        {report.activities.length === 0 ? (
          <EmptyState text="Sin actividades económicas registradas." />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>Categoría</th>
                  <th>Desde</th>
                </tr>
              </thead>
              <tbody>
                {report.activities.map((item) => (
                  <tr key={item.code}>
                    <td>{item.label}</td>
                    <td>{item.code}</td>
                    <td>{item.category}</td>
                    <td>{formatDate(item.startDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </SectionCard>

      <SectionCard id="sociedades" title="Pertenencia a sociedades" note="SII" as="h3">
        {report.companies.length === 0 ? (
          <EmptyState text="Sin participación en sociedades registrada." />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>RUT</th>
                  <th>Participación</th>
                  <th>Desde</th>
                </tr>
              </thead>
              <tbody>
                {report.companies.map((item) => (
                  <tr key={item.rut}>
                    <td>{item.name}</td>
                    <td>{item.rut}</td>
                    <td>{item.share.toLocaleString('es-CL', { maximumFractionDigits: 4 })}%</td>
                    <td>{formatDate(item.since)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </SectionCard>

      <SectionCard id="regimenes" title="Regímenes tributarios" note="SII" as="h3">
        {report.regimes.length === 0 ? (
          <EmptyState text="Sin regímenes tributarios registrados." />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>Desde</th>
                </tr>
              </thead>
              <tbody>
                {report.regimes.map((item) => (
                  <tr key={item.code}>
                    <td>{item.name}</td>
                    <td>{item.code}</td>
                    <td>{formatDate(item.since)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </SectionCard>

      <SectionCard id="timbrajes" title="Timbrajes" note="SII" as="h3">
        {report.stampings.length === 0 ? (
          <EmptyState text="Sin timbrajes registrados." />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Desde</th>
                </tr>
              </thead>
              <tbody>
                {report.stampings.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{formatDate(item.since)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </SectionCard>
    </>
  )
}

export function Timeline({ days }: { days: TimelineDay[] }) {
  return (
    <SectionCard id="linea-de-tiempo" title="Línea de tiempo" note="Más reciente primero" as="h3">
      <ol className="timeline">
        {days.map((day) => (
          <li key={day.date}>
            <time dateTime={day.date} className="mono">
              {formatDate(day.date)}
            </time>
            <ul>
              {day.events.map((event) => (
                <li key={event}>{event}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </SectionCard>
  )
}

export function ParametersTable({ report }: { report: Report }) {
  return (
    <TableWrap>
      <table>
        <thead>
          <tr>
            <th>Regla o parámetro</th>
            <th className="cell-text">Valor en uso</th>
            <th className="cell-text">Estado</th>
          </tr>
        </thead>
        <tbody>
          {report.method.parameters.map((item) => (
            <tr key={item.key}>
              <td>{item.label}</td>
              <td className="cell-text cell-wrap">{item.value}</td>
              <td className="cell-text">
                <span className={`tag ${item.status === 'pending' ? 'tag-review' : 'tag-positive'}`}>
                  {item.status === 'pending' ? 'Por confirmar' : 'Confirmado'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  )
}

export function Glossary() {
  return (
    <dl className="glossary">
      {glossary.map((item) => (
        <div key={item.term}>
          <dt>{item.term}</dt>
          <dd>{item.meaning}</dd>
        </div>
      ))}
    </dl>
  )
}
