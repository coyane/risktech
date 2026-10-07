import {
  portfolioClients,
  portfolioTotals,
  type ClientStatus,
  type PortfolioProperty,
} from '../../data/portfolio'
import { formatMoney, formatMoneyMillions, formatNumber, formatRate } from '../../lib/format'

const statusLabel: Record<ClientStatus, string> = {
  activo: 'Activo',
  en_revision: 'En revisión',
  sin_datos: 'Sin datos',
}

const statusClass: Record<ClientStatus, string> = {
  activo: 'tag-positive',
  en_revision: 'tag-review',
  sin_datos: 'tag-neutral',
}

const sortedClients = portfolioClients.toSorted((a, b) => b.totalOrigins - a.totalOrigins)
const totalOrigins = portfolioClients.reduce((sum, client) => sum + client.totalOrigins, 0)

// Región con más propiedades del propietario.
function mainRegion(properties: PortfolioProperty[]) {
  const counts = new Map<string, number>()
  for (const property of properties) {
    counts.set(property.region, (counts.get(property.region) ?? 0) + 1)
  }
  return [...counts.entries()].toSorted((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
}

export function AdminClientsPage() {
  const summary = portfolioTotals

  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">Administración · portafolio CEFT</div>
          <h1>Propietarios en la plataforma</h1>
        </div>
      </header>

      <section className="grid-auto" aria-label="Indicadores del portafolio">
        <div className="kpi">
          <div className="kpi-label">Propietarios</div>
          <div className="kpi-value">{summary.clients}</div>
          <div className="kpi-note">{summary.activos} activos</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">RFN mensual promedio</div>
          <div className="kpi-value">{formatMoneyMillions(summary.avgRfn)}</div>
          <div className="kpi-note">AT vigente</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Capacidad hipotecaria</div>
          <div className="kpi-value">{formatMoneyMillions(summary.totalMortgage)}</div>
          <div className="kpi-note">Suma límite 25% RFN</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Propiedades</div>
          <div className="kpi-value">{summary.properties}</div>
          <div className="kpi-note">Avalúo {formatMoney(summary.totalAvaluo)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Advertencias</div>
          <div className="kpi-value">{summary.warnings}</div>
          <div className="kpi-note">Requieren revisión</div>
        </div>
      </section>

      <section className="card-flush">
        <div className="card-head">
          <h2>Resumen por propietario</h2>
          <div className="card-note">Ordenado por orígenes de renta AT vigente</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Propietario</th>
                <th>Estado</th>
                <th>Tramo IGC</th>
                <th>Tramo 55 bis</th>
                <th className="cell-text">Región principal</th>
                <th>Orígenes</th>
                <th>RFN mensual</th>
                <th>Tasa efectiva</th>
                <th>Dividendo máx.</th>
                <th>Props.</th>
                <th>Alertas</th>
              </tr>
            </thead>
            <tbody>
              {sortedClients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div className="cell-title">{client.name}</div>
                    <div className="mono cell-sub">{client.rut}</div>
                  </td>
                  <td>
                    <span className={`tag ${statusClass[client.status]}`}>
                      {statusLabel[client.status]}
                    </span>
                  </td>
                  <td>{formatRate(client.igcRate)}</td>
                  <td>{client.bracket55bis}</td>
                  <td className="cell-text">{mainRegion(client.properties)}</td>
                  <td>{formatNumber(client.totalOrigins)}</td>
                  <td>{formatNumber(client.rfnMonthly)}</td>
                  <td>{formatRate(client.effectiveRate)}</td>
                  <td>{formatNumber(client.mortgageLimit)}</td>
                  <td>{client.properties.length}</td>
                  <td>
                    {client.warnings > 0 ? (
                      <span className="tag tag-review">{client.warnings}</span>
                    ) : (
                      <span className="muted">0</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="total">
                <td>Total / promedio</td>
                <td />
                <td />
                <td />
                <td />
                <td>{formatNumber(totalOrigins)}</td>
                <td>{formatNumber(Math.round(summary.avgRfn))}</td>
                <td />
                <td>{formatNumber(summary.totalMortgage)}</td>
                <td>{summary.properties}</td>
                <td>{summary.warnings}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
