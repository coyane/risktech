import { BarList } from '../../components/BarList'
import { dominantBracket, portfolioClients, portfolioTotals } from '../../data/portfolio'
import { formatMoneyMillions, formatNumber, formatRate } from '../../lib/format'

const DESTINO_COLORS: Record<string, string> = {
  Habitacional: 'var(--accent)',
  Bodega: 'var(--chart-orange)',
  Comercial: 'var(--chart-teal)',
  Oficina: 'var(--chart-rose)',
  Terreno: 'var(--chart-olive)',
  'Sitio eriazo': 'var(--chart-grey)',
  Estacionamiento: 'var(--chart-sky)',
  Industrial: 'var(--chart-brown)',
}

const BRACKET_COLORS: Record<string, string> = {
  A: 'var(--good)',
  B: 'var(--accent)',
  C: 'var(--chart-orange)',
}

const summary = portfolioTotals

const allProperties = portfolioClients
  .flatMap((client) =>
    client.properties.map((property) => ({
      ...property,
      clientName: client.name,
      clientRut: client.rut,
      bracket: client.bracket55bis,
    })),
  )
  .toSorted((a, b) => b.avaluo - a.avaluo)

const bracketItems = summary.byBracket.map((item) => ({
  key: item.bracket,
  label: `Tramo ${item.bracket}`,
  value: item.count,
  detail: `${item.count} cliente${item.count === 1 ? '' : 's'}`,
  color: BRACKET_COLORS[item.bracket],
}))

const destinoColor = (destino: string) => DESTINO_COLORS[destino] ?? 'var(--chart-grey)'

const destinoCountItems = summary.byDestino
  .toSorted((a, b) => b.count - a.count)
  .map((item) => ({
    key: item.destino,
    label: item.destino,
    value: item.count,
    detail: `${item.count} rol${item.count === 1 ? '' : 'es'}`,
    color: destinoColor(item.destino),
  }))

const avaluoItems = summary.byDestino.map((item) => ({
  key: item.destino,
  label: item.destino,
  value: item.avaluo,
  detail: `${formatMoneyMillions(item.avaluo)} · ${formatRate(item.avaluo / Math.max(summary.totalAvaluo, 1), 0)}`,
  color: destinoColor(item.destino),
}))

const topDestinos = summary.byDestino
  .slice(0, 2)
  .map((item) => item.destino.toLowerCase())
  .join(' y ')

export function AdminRadiografiaPage() {
  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">Administración · composición del portafolio</div>
          <h1>Radiografía general</h1>
        </div>
      </header>

      <section className="dark-card">
        <h2 className="label-caps">Lectura rápida</h2>
        <p className="summary">
          El portafolio concentra {summary.clients} contribuyentes y {summary.properties}{' '}
          propiedades. El tramo {dominantBracket.bracket} es el más frecuente; en patrimonio
          destacan {topDestinos}, con avalúo fiscal agregado de{' '}
          {formatMoneyMillions(summary.totalAvaluo)}.
        </p>
      </section>

      <div className="row">
        <section className="card stack col-half">
          <div>
            <h2>Distribución por tramo Art. 55 bis</h2>
            <div className="card-note">Cantidad de clientes por tramo</div>
          </div>
          <BarList items={bracketItems} label="Clientes por tramo" />
        </section>

        <section className="card stack col-half">
          <div>
            <h2>Propiedades por destino</h2>
            <div className="card-note">Cantidad de roles por tipo de propiedad</div>
          </div>
          <BarList items={destinoCountItems} label="Roles por destino" />
        </section>
      </div>

      <div className="row">
        <section className="card stack col-third">
          <h2>Comunas con más roles</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Comuna</th>
                  <th>Roles</th>
                </tr>
              </thead>
              <tbody>
                {summary.byComuna.map((item) => (
                  <tr key={item.comuna}>
                    <td>{item.comuna}</td>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card stack col-two-thirds">
          <div>
            <h2>Avalúo por tipo de propiedad</h2>
            <div className="card-note">
              Millones de pesos y participación sobre el avalúo fiscal total
            </div>
          </div>
          <BarList items={avaluoItems} label="Avalúo fiscal por destino" />
        </section>
      </div>

      <section className="card-flush">
        <div className="card-head">
          <h2>Inventario de propiedades</h2>
          <div className="card-note">{allProperties.length} roles · todos los clientes</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Rol</th>
                <th>Comuna</th>
                <th>Destino</th>
                <th>Avalúo</th>
                <th>Contribución</th>
                <th>Tramo dueño</th>
              </tr>
            </thead>
            <tbody>
              {allProperties.map((property) => (
                <tr key={`${property.clientRut}-${property.rol}`}>
                  <td>
                    <div className="cell-title">{property.clientName}</div>
                    <div className="mono cell-sub">{property.clientRut}</div>
                  </td>
                  <td>{property.rol}</td>
                  <td className="cell-text">{property.comuna}</td>
                  <td>
                    <span className="tag tag-neutral">{property.destino}</span>
                  </td>
                  <td>{formatNumber(property.avaluo)}</td>
                  <td>{formatNumber(property.contribucion)}</td>
                  <td>{property.bracket}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
