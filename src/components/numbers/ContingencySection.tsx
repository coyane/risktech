import { formatAt, formatDate, formatDecimal, formatMoney, formatNumber } from '../../lib/format'
import type { Contingency, ContingencyYear } from '../../types'
import { SectionCard, TableWrap } from '../SectionCard'
import { StatTile } from '../StatTile'

const rows: { label: string; code?: string; total?: boolean; value: (y: ContingencyYear) => string }[] = [
  { label: 'Base imponible declarada', code: '170', value: (y) => formatNumber(y.baseDeclared) },
  { label: 'Arriendos declarados', code: '955', value: (y) => formatNumber(y.rentsDeclared) },
  { label: 'Arriendos no declarados', value: (y) => formatNumber(y.underDeclared) },
  { label: 'Base imponible ajustada', code: '170*', value: (y) => formatNumber(y.baseAdjusted) },
  { label: 'Tramo según tabla IGC', value: (y) => y.bracket },
  { label: 'Impuesto determinado ajustado', code: '157*', value: (y) => formatNumber(y.taxAdjusted) },
  { label: 'Diferencia de impuesto', value: (y) => formatNumber(y.taxDifference) },
  { label: 'IGC pagado', value: (y) => `(${formatNumber(y.igcPaid)})` },
  { label: 'Débito fiscal neto', value: (y) => formatNumber(y.netDebit) },
  { label: 'Deuda en UF (abril)', value: (y) => formatDecimal(y.debitUf, 2) },
  { label: 'Corrección monetaria (Art. 53)', value: (y) => formatNumber(y.monetaryCorrection) },
  { label: 'Intereses 1,5% mensual (Art. 53)', value: (y) => formatNumber(y.interest) },
  { label: 'Multa (Art. 97)', value: (y) => formatNumber(y.fine) },
  { label: 'Débito total determinado', total: true, value: (y) => formatNumber(y.totalDebit) },
]

export function ContingencySection({
  contingency,
  as,
}: {
  contingency: Contingency
  as?: 'h2' | 'h3' | 'h4'
}) {
  return (
    <SectionCard
      id="contingencias"
      title="Contingencias tributarias"
      as={as}
      note={`Art. 53 y 97 del Código Tributario · al ${formatDate(contingency.asOf)}`}
    >
      <div className="section-body stat-grid stat-grid-3">
        <StatTile
          label="Arriendos percibidos (informados)"
          value={`${formatMoney(contingency.rentsReceivedMonthly)} / mes`}
          note="Dato del cliente, no del SII"
          mono
        />
        <StatTile
          label="Debió declarar en el código 955"
          value={formatMoney(contingency.rentsShouldDeclare)}
          note="Por año tributario"
          mono
        />
        <StatTile
          label="Contingencia total estimada"
          value={formatMoney(contingency.total)}
          note={contingency.years.map((item) => formatAt(item.year)).join(' y ')}
          mono
        />
      </div>
      <TableWrap>
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Código</th>
              {contingency.years.map((item) => (
                <th key={item.year}>{formatAt(item.year)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className={row.total ? 'total' : undefined}>
                <td>{row.label}</td>
                <td>{row.code ?? ''}</td>
                {contingency.years.map((item) => (
                  <td key={item.year}>{row.value(item)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <div className="section-body stack">
        <h3 className="section-subtitle flush">Solución propuesta por el método</h3>
        <ol className="numbered-list">
          {contingency.proposal.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        <p className="footnote">
          Estimación del caso de ejemplo. No es una liquidación del SII ni asesoría tributaria: un
          especialista debe validarla antes de rectificar.
        </p>
      </div>
    </SectionCard>
  )
}
