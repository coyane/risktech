import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ContingencySection } from '../components/numbers/ContingencySection'
import { CoverageSection } from '../components/numbers/CoverageSection'
import { CreditCapacitySection } from '../components/numbers/CreditCapacitySection'
import { F29Section } from '../components/numbers/F29Section'
import { FinancialSection } from '../components/numbers/FinancialSection'
import { PatrimonySection } from '../components/numbers/PatrimonySection'
import { EmptyState, ErrorNotice, Notice } from '../components/Notice'
import { OriginsChart } from '../components/OriginsChart'
import { RateChart } from '../components/RateChart'
import { SectionCard, TableWrap } from '../components/SectionCard'
import { isRunReady, useRun } from '../context/run'
import { scrollToId } from '../lib/dom'
import { downloadText, reportToCsv } from '../lib/export'
import { formatAmount, formatAt, formatDate } from '../lib/format'

export function NumbersPage() {
  const { run, report, consent, error, retry } = useRun()
  const { hash, key } = useLocation()
  const ready = isRunReady(run) && report !== null

  // Enlaces profundos: /numeros#base lleva a la tabla, también al repetir el clic.
  useEffect(() => {
    if (ready && hash) scrollToId(hash.slice(1))
  }, [ready, hash, key])

  if (error) return <ErrorNotice error={error} onRetry={retry} />
  if (!ready || !report) {
    return (
      <Notice
        title="Los números aún no están listos"
        text="Las tablas aparecen cuando el agente termina el análisis."
      >
        <Link to="/analisis" className="btn btn-primary">
          Ver el avance
        </Link>
      </Notice>
    )
  }

  const { years, incomeOrigins, igcBase, financial } = report
  const totalsByYear = new Map(financial.map((year) => [year.year, year.totalOrigins]))

  return (
    <>
        <header className="page-head">
          <div>
            <div className="eyebrow">
              Análisis de apertura · Método ICRED, Capítulo IV · cifras en pesos
            </div>
            <h1>Números duros</h1>
          </div>
          <div className="page-actions no-print">
            <button
              type="button"
              className="btn"
              onClick={() => downloadText('analisis-apertura.csv', reportToCsv(report))}
            >
              Descargar CSV (Excel)
            </button>
            <button type="button" className="btn" onClick={() => window.print()}>
              Imprimir o guardar PDF
            </button>
          </div>
        </header>

        {run?.status === 'PARTIAL' && (
          <section className="banner banner-warn" role="status">
            <strong>Análisis parcial.</strong> {run.message} Las secciones sin datos lo indican.
          </section>
        )}

        <CoverageSection report={report} consent={consent} />

        <div className="row">
          <section className="card stack col-chart-wide">
            <div>
              <h2>Ingresos y renta financiera neta por año tributario</h2>
              <div className="card-note">
                Millones de pesos
              </div>
            </div>
            <div className="chart-legend">
              <span>
                <i className="swatch" style={{ background: 'var(--chart-grey)' }} />
                Total orígenes de renta
              </span>
              <span>
                <i className="swatch" style={{ background: 'var(--chart-orange)' }} />
                Arriendos (955)
              </span>
              <span>
                <i className="swatch" style={{ background: 'var(--accent)' }} />
                Renta financiera neta
              </span>
            </div>
            <OriginsChart report={report} />
          </section>

          <section className="card stack col-chart">
            <div>
              <h2>Tasa efectiva de impuesto</h2>
              <div className="card-note">
                Impuesto determinado (157) sobre base imponible (170)
              </div>
            </div>
            <RateChart report={report} />
          </section>
        </div>

        <SectionCard id="origenes" title="Orígenes de renta" note="F22">
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Glosa</th>
                  <th>Código</th>
                  {years.map((year) => (
                    <th key={year}>{formatAt(year)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incomeOrigins.map((origin) => (
                  <tr key={origin.code}>
                    <td>{origin.label}</td>
                    <td>{origin.code}</td>
                    {years.map((year) => (
                      <td key={year}>{formatAmount(origin.values[year])}</td>
                    ))}
                  </tr>
                ))}
                <tr className="total">
                  <td>Total orígenes de renta</td>
                  <td />
                  {years.map((year) => (
                    <td key={year}>{formatAmount(totalsByYear.get(year))}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </TableWrap>
        </SectionCard>

        <SectionCard id="base" title="Base imponible IGC" note="F22">
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Glosa</th>
                  <th>Código</th>
                  {years.map((year) => (
                    <th key={year}>{formatAt(year)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Base imponible tributaria</td>
                  <td>170</td>
                  {years.map((year) => (
                    <td key={year}>{formatAmount(igcBase.base170[year])}</td>
                  ))}
                </tr>
                <tr>
                  <td>Impuesto determinado según tabla</td>
                  <td>157</td>
                  {years.map((year) => (
                    <td key={year}>{formatAmount(igcBase.tax157[year])}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </TableWrap>
        </SectionCard>

        <FinancialSection report={report} />
        <CreditCapacitySection report={report} />
        {report.contingency && <ContingencySection contingency={report.contingency} />}

        <SectionCard id="actividades" title="Actividades económicas" note="SII">
          {report.activities.length === 0 ? (
            <EmptyState text="Sin actividades económicas registradas en esta extracción." />
          ) : (
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th>Actividad</th>
                    <th>Código</th>
                    <th>Categoría</th>
                    <th>Desde</th>
                  </tr>
                </thead>
                <tbody>
                  {report.activities.map((activity) => (
                    <tr key={activity.code}>
                      <td>{activity.label}</td>
                      <td>{activity.code}</td>
                      <td>{activity.category}</td>
                      <td>{formatDate(activity.startDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </SectionCard>

        <PatrimonySection report={report} />
        <F29Section report={report} />

        <div className="footnote">
          Los indicadores son referenciales y no constituyen una decisión tributaria ni crediticia:
          requieren revisión profesional. {report.warnings.join(' ')}
        </div>
    </>
  )
}
