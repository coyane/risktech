import { formatAmount, formatDate, formatDecimal, formatNumber } from '../../lib/format'
import type { Report } from '../../types'
import { EmptyState } from '../Notice'
import { SectionCard, TableWrap } from '../SectionCard'

const uf = (value: number | null) => (value === null ? '—' : formatDecimal(value, 2))

// Detalle por rol, con los mismos datos que usan los cálculos de propiedades.
export function PatrimonySection({ report, as }: { report: Report; as?: 'h2' | 'h3' }) {
  const { properties } = report
  const failed = report.taxpayer.sources.some(
    (item) => item.source === 'BIENES_RAICES' && item.status === 'failed',
  )

  return (
    <SectionCard id="patrimonio" title="Propiedades por rol" note="SII · Mis Bienes" as={as}>
      {properties.length === 0 ? (
        <EmptyState
          text={
            failed
              ? 'No se pudo leer bienes raíces en esta captura. No significa que no existan propiedades.'
              : 'Sin propiedades inscritas.'
          }
        />
      ) : (
        <>
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Rol</th>
                  <th className="cell-text">Destino</th>
                  <th>Enajenación (UF)</th>
                  <th>Pago contado (UF)</th>
                  <th className="cell-text">Comuna</th>
                  <th>Compra</th>
                  <th className="cell-text">Ley 20.455</th>
                  <th className="cell-text">Uso familiar</th>
                  <th>Avalúo fiscal</th>
                  <th>Enajenación ($)</th>
                  <th>Pago contado ($)</th>
                  <th className="cell-text">Institución</th>
                  <th>Crédito (UF)</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((item) => (
                  <tr key={item.rol}>
                    <td className="mono">{item.rol}</td>
                    <td className="cell-text">{item.destino}</td>
                    <td>{uf(item.enajenacionUf)}</td>
                    <td>{uf(item.pagoContadoUf)}</td>
                    <td className="cell-text">{item.comuna}</td>
                    <td>{item.fechaAdquisicion ? formatDate(item.fechaAdquisicion) : '—'}</td>
                    <td className="cell-text">{item.ley20455 ? 'Sí' : 'No'}</td>
                    <td className="cell-text">{item.usoFamiliar ? 'Sí' : 'No'}</td>
                    <td>{formatNumber(item.avaluo)}</td>
                    <td>{formatAmount(item.precioAdquisicion)}</td>
                    <td>{formatAmount(item.pagoContado)}</td>
                    <td className="cell-text">{item.institucion ?? '—'}</td>
                    <td>{uf(item.financiamientoUf)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <p className="section-body footnote">La raya (—) indica un dato no capturado.</p>
        </>
      )}
    </SectionCard>
  )
}
