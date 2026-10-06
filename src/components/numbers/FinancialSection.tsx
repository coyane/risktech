import { formatAmount, formatAt, formatDecimal, formatNumber, formatRate } from '../../lib/format'
import type { Report } from '../../types'
import { SectionCard, TableWrap } from '../SectionCard'

export function FinancialSection({ report }: { report: Report }) {
  const { financial, igcBase, method } = report
  const hasPending = method.parameters.some((item) => item.status === 'pending')

  return (
    <SectionCard
      id="financiero"
      title="Análisis financiero"
      note={`Calculado por el Método ICRED · reglas ${method.release}`}
    >
      <TableWrap>
        <table>
          <thead>
            <tr>
              <th>Indicador</th>
              {financial.map((year) => (
                <th key={year.year}>{formatAt(year.year)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tasa efectiva de tributación</td>
              {financial.map((year) => (
                <td key={year.year}>{formatRate(year.effectiveRate)}</td>
              ))}
            </tr>
            <tr>
              <td>Impuesto determinado</td>
              {financial.map((year) => (
                <td key={year.year}>{formatAmount(igcBase.tax157[year.year])}</td>
              ))}
            </tr>
            <tr>
              <td>Renta financiera bruta (RFB)</td>
              {financial.map((year) => (
                <td key={year.year}>{formatNumber(year.rfb)}</td>
              ))}
            </tr>
            <tr>
              <td>Renta financiera neta (RFN)</td>
              {financial.map((year) => (
                <td key={year.year}>{formatNumber(year.rfn)}</td>
              ))}
            </tr>
            <tr>
              <td>RFN promedio mensual</td>
              {financial.map((year) => (
                <td key={year.year}>{formatNumber(year.rfnMonthly)}</td>
              ))}
            </tr>
            <tr>
              <td>BIT IGC en UTA</td>
              {financial.map((year) => (
                <td key={year.year}>{formatDecimal(year.bitUta)}</td>
              ))}
            </tr>
            <tr>
              <td>Tramo Art. 55 bis</td>
              {financial.map((year) => (
                <td key={year.year}>{igcBase.bracket55bis[year.year] ?? '—'}</td>
              ))}
            </tr>
            <tr className="total">
              <td>Límite capacidad crédito hipotecario ({formatRate(method.mortgageFactor, 0)})</td>
              {financial.map((year) => (
                <td key={year.year}>{formatNumber(year.mortgageLimit)}</td>
              ))}
            </tr>
            <tr className="total">
              <td>Límite capacidad crédito automotriz ({formatRate(method.autoFactor, 0)})</td>
              {financial.map((year) => (
                <td key={year.year}>{formatNumber(Math.round(year.rfnMonthly * method.autoFactor))}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </TableWrap>

      {hasPending && (
        <p className="section-body banner-inline">
          <span className="tag tag-review">Por validar</span> Algunos parámetros del método siguen
          pendientes de validación; los indicadores que dependen de ellos son referenciales.
        </p>
      )}

      <details className="method">
        <summary>Cómo se calcula</summary>
        <div className="method-body">
          <h3 className="section-subtitle flush">Fórmulas</h3>
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th className="cell-text">Fórmula</th>
                  <th className="cell-text">Estado</th>
                </tr>
              </thead>
              <tbody>
                {method.formulas.map((item) => (
                  <tr key={item.indicator}>
                    <td>{item.indicator}</td>
                    <td className="cell-text cell-wrap">{item.formula}</td>
                    <td className="cell-text">
                      <span className={`tag ${item.pending ? 'tag-review' : 'tag-positive'}`}>
                        {item.pending ? 'Por validar' : 'Validada'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>

          <h3 className="section-subtitle flush">Parámetros</h3>
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Parámetro</th>
                  <th className="cell-text">Valor en uso</th>
                  <th className="cell-text">Estado</th>
                </tr>
              </thead>
              <tbody>
                {method.parameters.map((item) => (
                  <tr key={item.key}>
                    <td>{item.label}</td>
                    <td className="cell-text cell-wrap">{item.value}</td>
                    <td className="cell-text">
                      <span
                        className={`tag ${item.status === 'pending' ? 'tag-review' : 'tag-positive'}`}
                      >
                        {item.status === 'pending' ? 'Pendiente' : 'Confirmado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>

          <h3 className="section-subtitle flush">Ajustes del método (códigos F22)</h3>
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Código</th>
                  {report.years.map((year) => (
                    <th key={year}>{formatAt(year)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {method.adjustments.map((item) => (
                  <tr key={item.code}>
                    <td>{item.label}</td>
                    <td>{item.code}</td>
                    {report.years.map((year) => (
                      <td key={year}>{formatAmount(item.values[year])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <p className="footnote">La raya (—) indica un código no informado; no equivale a cero.</p>

          <h3 className="section-subtitle flush">Referencia del Capítulo IV</h3>
          <ul className="plain-list">
            {method.reference.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </details>
    </SectionCard>
  )
}
