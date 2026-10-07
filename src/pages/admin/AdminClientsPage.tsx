import { Figure, Figures } from '../../components/Figures'
import {
  igcLabel,
  portfolioClients,
  portfolioTotals,
  type ClientStatus,
  type PortfolioProperty,
} from '../../data/portfolio'
import { formatMoneyMillions, formatNumber, formatRate } from '../../lib/format'

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

      <Figures label="Indicadores del portafolio">
        <Figure label="Propietarios" value={String(summary.clients)} note={`${summary.activos} activos`} />
        <Figure
          label="RFN mensual promedio"
          value={formatMoneyMillions(summary.avgRfn)}
          note="Año tributario vigente"
        />
        <Figure
          label="Capacidad hipotecaria"
          value={formatMoneyMillions(summary.totalMortgage)}
          note="Suma del límite de 25% de la RFN"
        />
        <Figure
          label="Propiedades"
          value={String(summary.properties)}
          note={`Avalúo fiscal ${formatMoneyMillions(summary.totalAvaluo)}`}
        />
        <Figure label="Advertencias" value={String(summary.warnings)} note="Por revisar" />
      </Figures>

      <section className="card-flush">
        <div className="card-head">
          <h2>Resumen por propietario</h2>
          <div className="card-note">Ordenado por orígenes de renta AT vigente</div>
        </div>
        <div className="table-wrap">
          <table className="table-fit">
            <thead>
              <tr>
                <th>Propietario</th>
                <th className="cell-text">Estado</th>
                <th className="cell-text">Tramo IGC</th>
                <th>Tramo 55 bis</th>
                <th className="cell-text">Región principal</th>
                <th>Orígenes de renta</th>
                <th>RFN mensual</th>
                <th>Tasa efectiva</th>
                <th>Dividendo máximo</th>
                <th>Propie&shy;dades</th>
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
                  <td className="cell-text">
                    <span className={`tag ${statusClass[client.status]}`}>
                      {statusLabel[client.status]}
                    </span>
                  </td>
                  <td className="cell-text">
                    <div className="cell-title">{igcLabel(client.igcRate)}</div>
                    <div className="mono cell-sub">{formatRate(client.igcRate)}</div>
                  </td>
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
