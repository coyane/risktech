import { useSignOut } from '../../context/useSignOut'
import { revokeConsent } from '../../lib/api'
import { formatAt, formatDate } from '../../lib/format'
import type { Consent, Report, SourceStatus } from '../../types'
import { SectionCard, TableWrap } from '../SectionCard'
import { filingLabel } from './labels'

const statusLabel: Record<SourceStatus, string> = {
  complete: 'Completa',
  partial: 'Parcial',
  empty: 'Sin declaraciones',
  failed: 'Falló',
  excluded: 'No incluida',
}

const statusClass: Record<SourceStatus, string> = {
  complete: 'tag-positive',
  partial: 'tag-review',
  empty: 'tag-neutral',
  failed: 'tag-danger',
  excluded: 'tag-idle',
}

export function CoverageSection({
  report,
  consent,
  as,
}: {
  report: Report
  consent: Consent | null
  as?: 'h2' | 'h3' | 'h4'
}) {
  const signOut = useSignOut()

  const onRevoke = async () => {
    if (!consent) return
    await revokeConsent(consent.id)
    signOut()
  }

  return (
    <SectionCard
      id="fuentes"
      title="Fuentes y cobertura"
      as={as}
      note={`Capturado el ${formatDate(report.taxpayer.capturedAt)}`}
    >
      <TableWrap>
        <table>
          <thead>
            <tr>
              <th>Fuente</th>
              <th className="cell-text">Estado</th>
              <th className="cell-text">Obtenido</th>
              <th className="cell-text">Faltante</th>
              <th className="cell-text">Observación</th>
            </tr>
          </thead>
          <tbody>
            {report.taxpayer.sources.map((item) => (
              <tr key={item.source}>
                <td>{item.label}</td>
                <td className="cell-text">
                  <span className={`tag ${statusClass[item.status]}`}>{statusLabel[item.status]}</span>
                </td>
                <td className="cell-text">{item.obtained.join(', ') || '—'}</td>
                <td className="cell-text">{item.missing.join(', ') || '—'}</td>
                <td className="cell-text cell-wrap">{item.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {report.f22Returns.length > 0 && (
        <>
          <h3 className="section-subtitle">Declaraciones F22 capturadas</h3>
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Año tributario</th>
                  <th>Tipo</th>
                  <th>Folio</th>
                  <th>Presentada</th>
                </tr>
              </thead>
              <tbody>
                {report.f22Returns.map((item) => (
                  <tr key={item.year}>
                    <td>{formatAt(item.year)}</td>
                    <td className="cell-text">{filingLabel[item.filingType]}</td>
                    <td>{item.folio}</td>
                    <td>{formatDate(item.filedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </>
      )}

      {consent && (
        <div className="section-body consent-box">
          <div>
            <h3 className="section-subtitle flush">Autorización vigente</h3>
            <dl className="terms-list">
              <dt>Finalidad</dt>
              <dd>{consent.purpose}</dd>
              <dt>Otorgada</dt>
              <dd>{formatDate(consent.grantedAt)}</dd>
              <dt>Vigencia</dt>
              <dd>{consent.validity}</dd>
              <dt>Identificador</dt>
              <dd className="mono">{consent.id}</dd>
            </dl>
          </div>
          <div className="consent-actions">
            <button type="button" className="btn btn-danger" onClick={onRevoke}>
              Revocar autorización
            </button>
            <div className="footnote">Cierra la sesión y borra este análisis del navegador.</div>
          </div>
        </div>
      )}
    </SectionCard>
  )
}
