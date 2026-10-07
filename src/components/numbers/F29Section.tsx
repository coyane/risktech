import { formatAmount, formatDate } from '../../lib/format'
import type { PaymentStatus, Report } from '../../types'
import { EmptyState } from '../Notice'
import { SectionCard, TableWrap } from '../SectionCard'
import { filingLabel } from './labels'

const paymentLabel: Record<PaymentStatus, string> = {
  pagado: 'Pagado',
  pendiente: 'Pendiente',
  sin_movimiento: 'Sin movimiento',
}

const paymentClass: Record<PaymentStatus, string> = {
  pagado: 'tag-positive',
  pendiente: 'tag-review',
  sin_movimiento: 'tag-idle',
}

export function F29Section({ report, as }: { report: Report; as?: 'h2' | 'h3' | 'h4' }) {
  const f50ByPeriod = new Map(report.f50.map((item) => [item.period, item]))
  const coverage = (source: string) => report.taxpayer.sources.find((item) => item.source === source)

  return (
    <SectionCard id="f29" title="F29 y F50 · últimos 24 meses"
      as={as} note="Más reciente primero">
      {report.f29.length === 0 ? (
        <EmptyState text={coverage('F29')?.note || 'Sin períodos de F29 en esta extracción.'} />
      ) : (
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th>Período</th>
                <th className="cell-text">Tipo</th>
                <th>Débitos (538)</th>
                <th>Créditos (537)</th>
                <th>IVA determinado (89)</th>
                <th>Remanente (77)</th>
                <th>PPM (115)</th>
                <th>Retenciones (151)</th>
                <th>Liq. factura (818)</th>
                <th>Total a pagar (91)</th>
                <th>Total F50</th>
                <th className="cell-text">Estado</th>
                <th>Presentado</th>
                <th>Folio</th>
              </tr>
            </thead>
            <tbody>
              {report.f29.map((period) => (
                <tr key={period.period}>
                  <td className="mono">{period.period}</td>
                  <td className="cell-text">
                    {period.filingType === 'rectificatoria' ? (
                      <span className="tag tag-review">{filingLabel[period.filingType]}</span>
                    ) : (
                      filingLabel[period.filingType]
                    )}
                  </td>
                  <td>{formatAmount(period.debit)}</td>
                  <td>{formatAmount(period.credit)}</td>
                  <td>{formatAmount(period.ivaDeterminado)}</td>
                  <td>{formatAmount(period.remanente)}</td>
                  <td>{formatAmount(period.ppm)}</td>
                  <td>{formatAmount(period.retenciones)}</td>
                  <td>{formatAmount(period.liqFactura818)}</td>
                  <td>{formatAmount(period.total)}</td>
                  <td>{formatAmount(f50ByPeriod.get(period.period)?.total)}</td>
                  <td className="cell-text">
                    <span className={`tag ${paymentClass[period.paymentStatus]}`}>
                      {paymentLabel[period.paymentStatus]}
                    </span>
                  </td>
                  <td>{formatDate(period.filedAt)}</td>
                  <td>{period.folio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
      <p className="section-body footnote">
        La raya (—) indica un valor no informado o no aplicable; no equivale a cero. El código 818
        rige desde el período 2026-07. {coverage('F50')?.note}
      </p>
    </SectionCard>
  )
}
