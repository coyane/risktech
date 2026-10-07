import { BarList } from '../../components/BarList'
import { ColumnChart } from '../../components/ColumnChart'
import { Figure, Figures } from '../../components/Figures'
import { dominantBracket, portfolioTotals } from '../../data/portfolio'
import { formatMoneyMillions, formatRate } from '../../lib/format'

// Un color por unidad que se cuenta: clientes en azul, propiedades en azul marino.
// Las categorías se leen por su etiqueta, no por el color.
const CLIENT_COLOR = 'var(--accent)'
const PROPERTY_COLOR = 'var(--nav)'

const summary = portfolioTotals
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

// Los tramos son una escala ordenada: van en el orden de la tabla del impuesto.
const igcItems = summary.byIgc.map((item) => ({
  key: item.label,
  label: item.label,
  sublabel: formatRate(item.rate),
  value: item.count,
  detail: formatRate(item.count / Math.max(summary.clients, 1), 0),
}))
const igcUsed = summary.byIgc.filter((item) => item.count > 0).length

const bracketItems = summary.byBracket.map((item) => ({
  key: item.bracket,
  label: `Tramo ${item.bracket}`,
  value: item.count,
  detail: plural(item.count, 'cliente', 'clientes'),
  color: CLIENT_COLOR,
}))

const destinoByCount = summary.byDestino.toSorted((a, b) => b.count - a.count)

const destinoCountItems = destinoByCount.map((item) => ({
  key: item.destino,
  label: item.destino,
  value: item.count,
  detail: plural(item.count, 'rol', 'roles'),
  color: PROPERTY_COLOR,
}))

const avaluoItems = summary.byDestino.map((item) => ({
  key: item.destino,
  label: item.destino,
  value: item.avaluo,
  detail: `${formatMoneyMillions(item.avaluo)} · ${formatRate(item.avaluo / Math.max(summary.totalAvaluo, 1), 0)}`,
  color: PROPERTY_COLOR,
}))

const comunaItems = summary.byComuna.map((item) => ({
  key: item.comuna,
  label: item.comuna,
  value: item.count,
  detail: plural(item.count, 'rol', 'roles'),
  color: PROPERTY_COLOR,
}))

export function AdminRadiografiaPage() {
  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">Administración · composición del portafolio</div>
          <h1>Radiografía general</h1>
        </div>
      </header>

      <Figures label="Composición del portafolio">
        <Figure label="Contribuyentes" value={String(summary.clients)} note={`${summary.activos} activos`} />
        <Figure
          label="Propiedades"
          value={String(summary.properties)}
          note={`Destino más frecuente: ${destinoByCount[0]?.destino ?? '—'}`}
        />
        <Figure label="Avalúo fiscal total" value={formatMoneyMillions(summary.totalAvaluo)} note="Suma de todos los roles" />
        <Figure
          label="Tramo Art. 55 bis más frecuente"
          value={`Tramo ${dominantBracket.bracket}`}
          note={plural(dominantBracket.count, 'cliente', 'clientes')}
        />
      </Figures>

      <div className="row">
        <section className="card stack col-two-thirds">
          <div>
            <h2>Portafolio por tramo de Global Complementario</h2>
            <div className="card-note">
              Clientes en cada tramo del impuesto, del exento al más alto, y su parte del portafolio
            </div>
          </div>
          <ColumnChart
            items={igcItems}
            label="Clientes por tramo de Global Complementario"
            unit={['cliente', 'clientes']}
          />
          <p className="card-note">
            {plural(summary.clients, 'cliente', 'clientes')} en {igcUsed} de {summary.byIgc.length} tramos.
          </p>
        </section>

        <section className="card stack col-third">
          <div>
            <h2>Clientes por tramo Art. 55 bis</h2>
            <div className="card-note">Cantidad de clientes por tramo</div>
          </div>
          <BarList items={bracketItems} label="Clientes por tramo Art. 55 bis" />
        </section>
      </div>

      <div className="row">
        <section className="card stack col-third">
          <div>
            <h2>Propiedades por destino</h2>
            <div className="card-note">Cantidad de roles por tipo de propiedad</div>
          </div>
          <BarList items={destinoCountItems} label="Roles por destino" />
        </section>

        <section className="card stack col-third">
          <div>
            <h2>Avalúo por tipo de propiedad</h2>
            <div className="card-note">Millones de pesos y parte del avalúo fiscal total</div>
          </div>
          <BarList items={avaluoItems} label="Avalúo fiscal por destino" />
        </section>

        <section className="card stack col-third">
          <div>
            <h2>Comunas con más roles</h2>
            <div className="card-note">Las {comunaItems.length} comunas con más propiedades</div>
          </div>
          <BarList items={comunaItems} label="Roles por comuna" />
        </section>
      </div>
    </>
  )
}
