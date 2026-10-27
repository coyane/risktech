import { PLAZO_TEXT, PROPERTY_COLUMNS, statusLabel } from '../../lib/calculos'
import { formatAmount, formatDate, formatDecimal, formatNumber } from '../../lib/format'
import { formatMeses, plazoCredito } from '../../lib/patrimonio'
import type { Property, Report } from '../../types'
import { StatusTag } from '../diagnostico/StatusTag'
import { Disclosure } from '../Disclosure'
import { EmptyState } from '../Notice'

const uf = (value: number | null) => (value === null ? '—' : formatDecimal(value, 2))
const yesNo = (value: boolean | null) => (value === null ? '—' : value ? 'Sí' : 'No')
const date = (value: string | null) => (value ? formatDate(value) : '—')
const text = (value: string | null) => value ?? '—'
// Deuda de origen de una propiedad: lo que no se pagó al contado.
const debtOf = (item: Property) =>
  item.enajenacionUf === null || item.pagoContadoUf === null
    ? null
    : Math.round((item.enajenacionUf - item.pagoContadoUf) * 100) / 100
const term = (months: number | null) =>
  months === null || months === 0 ? '—' : `${months} meses (${formatDecimal(months / 12, months % 12 ? 1 : 0)} años)`

// Una fila por propiedad: dónde está, cuándo se compró, quién la financió, cuánto plazo lleva,
// cuánto se financió y el precio. En escritorio es una tabla con encabezados; en móvil, una ficha
// por propiedad con el rótulo de cada dato. El detalle por rol va en la ficha registral.
export function PropertyList({ report }: { report: Report }) {
  const { properties } = report
  const failed = report.taxpayer.sources.some(
    (item) => item.source === 'BIENES_RAICES' && item.status === 'failed',
  )

  if (properties.length === 0) {
    return (
      <EmptyState
        text={
          failed
            ? 'No se pudo leer bienes raíces en esta captura. No significa que no existan propiedades.'
            : 'Sin propiedades inscritas.'
        }
      />
    )
  }
  const label = (key: string) => PROPERTY_COLUMNS.find((column) => column.key === key)?.label ?? key
  return (
    <>
      <p className="pn-plazo-state">
        <StatusTag status={PLAZO_TEXT.status} />
        <span>
          <a href="#calc-plazo-credito">{PLAZO_TEXT.name}</a>: {PLAZO_TEXT.statusNote}
        </span>
      </p>
      <div className="pn-ptable">
        <div className="pn-prow pn-phead" aria-hidden="true">
          {PROPERTY_COLUMNS.map((column) => (
            <span key={column.key} className={`pn-pc-${column.key}`}>
              {column.label}
            </span>
          ))}
        </div>
        <ul aria-label="Propiedades inscritas">
          {properties.map((item) => {
            const debt = debtOf(item)
            const hasCredit = item.institucion !== null || (debt !== null && debt > 0)
            const plazo = hasCredit ? plazoCredito(item, report.taxpayer.capturedAt) : null
            const price = item.enajenacionUf
            const share = debt !== null && price ? Math.min(1, Math.max(0, debt / price)) : null
            return (
              <li key={item.rol} className={`pn-prow${hasCredit ? '' : ' is-cash'}`}>
                <span className="pn-pc-propiedad">
                  <Cell label={label('propiedad')} />
                  <strong>{item.comuna}</strong>
                  <span className="pn-pc-sub">{item.destino}</span>
                </span>
                <span className="pn-pc-compra">
                  <Cell label={label('compra')} />
                  {item.fechaAdquisicion ? item.fechaAdquisicion.slice(0, 4) : '—'}
                </span>
                <span className="pn-pc-institucion">
                  <Cell label={label('institucion')} />
                  {hasCredit ? (item.institucion ?? 'Institución no informada') : 'Ninguna'}
                </span>
                <span className="pn-pc-plazo">
                  <Cell label={label('plazo')} />
                  {!hasCredit ? (
                    <span className="pn-pc-sub">{PLAZO_TEXT.sinCredito}</span>
                  ) : plazo ? (
                    <span className="pn-term">
                      <span className="pn-term-text">
                        {PLAZO_TEXT.of(formatMeses(plazo.transcurridoMeses), formatMeses(plazo.pactadoMeses))}
                        <span className="sr-only"> · {statusLabel[PLAZO_TEXT.status]}</span>
                      </span>
                      <span className="pn-term-track" aria-hidden="true">
                        <i style={{ width: `${(plazo.transcurridoMeses / plazo.pactadoMeses) * 100}%` }} />
                      </span>
                      <span className="pn-pc-sub">{PLAZO_TEXT.left(formatMeses(plazo.restanteMeses))}</span>
                    </span>
                  ) : (
                    <span className="pn-pc-sub">{PLAZO_TEXT.sinPlazo}</span>
                  )}
                </span>
                <span className="pn-pc-financiado">
                  <Cell label={label('financiado')} />
                  <span className="pn-fin">
                    {share !== null && (
                      <span className="pn-fin-bar" aria-hidden="true">
                        <span className="split-solid" style={{ width: `${(1 - share) * 100}%` }} />
                        <span className="split-hatched" style={{ width: `${share * 100}%` }} />
                      </span>
                    )}
                    <span className="pn-fin-value">{debt ? `${uf(debt)} UF` : debt === 0 ? 'Todo al contado' : '—'}</span>
                  </span>
                </span>
                <span className="pn-pc-precio">
                  <Cell label={label('precio')} />
                  {uf(price)} UF
                </span>
              </li>
            )
          })}
        </ul>
      </div>
      <p className="pn-note">
        Financiado = enajenación − pago al contado: lo financiado al comprar, no la deuda vigente. La raya (—)
        indica un dato no capturado.
      </p>
      <Disclosure label="¿Qué es cada columna?" className="pn-columns-help">
        <dl className="pn-columns">
          {PROPERTY_COLUMNS.map((column) => (
            <div key={column.key}>
              <dt>{column.label}</dt>
              <dd>{column.help}</dd>
            </div>
          ))}
        </dl>
      </Disclosure>
    </>
  )
}

// Rótulo de cada dato de la fila: se lee siempre y se ve solo en la ficha de móvil.
function Cell({ label }: { label: string }) {
  return <span className="pn-pc-label">{label}</span>
}

// Ficha registral: todos los antecedentes de cada propiedad, plegada.
export function PropertyRegistry({ report, as }: { report: Report; as?: 'h2' | 'h3' }) {
  const { properties } = report
  const elapsed = (item: Property) => {
    const plazo = plazoCredito(item, report.taxpayer.capturedAt)
    if (!plazo) return item.plazoMeses ? '—' : PLAZO_TEXT.sinPlazo
    return `${PLAZO_TEXT.of(formatMeses(plazo.transcurridoMeses), formatMeses(plazo.pactadoMeses))} · ${statusLabel[PLAZO_TEXT.status]}`
  }
  if (properties.length === 0) return null
  const Sub = as === 'h2' ? 'h3' : 'h4'

  return (
    <Disclosure label="Ficha registral de cada propiedad">
      <div className="property-cards">
        {properties.map((item) => (
          <section key={item.rol} className="card property-card" aria-label={`Rol ${item.rol}`}>
            <Sub className="property-title">
              Rol <span className="mono">{item.rol}</span> · {item.destino} · {item.comuna}
            </Sub>
            <div className="property-groups">
              <dl>
                <dt className="property-group">Identificación</dt>
                <Row label="Dirección" value={text(item.direccion)} />
                <Row label="Región" value={item.region} />
                <Row label="Derechos" value={item.derechos === null ? '—' : `${formatDecimal(item.derechos, 0)}%`} />
                <Row label="Superficie terreno / construida" value={`${formatAmount(item.superficieTerreno)} / ${formatAmount(item.superficieConstruida)} m²`} />
                <Row label="Avalúo fiscal" value={`$${formatNumber(item.avaluo)}`} />
                <Row label="Afecto / exento" value={`$${formatAmount(item.avaluoAfecto)} / $${formatAmount(item.avaluoExento)}`} />
                <Row label="Contribución" value={item.contribucion === null ? '—' : `$${formatNumber(item.contribucion)}`} />
              </dl>
              <dl>
                <dt className="property-group">Escritura e inscripción</dt>
                <Row label="Naturaleza de la escritura" value={text(item.tipoActo)} />
                <Row label="Fecha de escritura" value={date(item.fechaAdquisicion)} />
                <Row label="Repertorio" value={text(item.repertorio)} />
                <Row label="Fojas / inscripción" value={`${text(item.fojas)} / ${text(item.inscripcion)}`} />
                <Row label="Fecha de inscripción" value={date(item.fechaInscripcion)} />
                <Row label="Adquiere dominio pleno" value={yesNo(item.dominioPleno)} />
                <Row label="Es nueva" value={yesNo(item.esNueva)} />
                <Row label="Acogida a DFL2" value={yesNo(item.dfl2)} />
              </dl>
              <dl>
                <dt className="property-group">Compra y crédito</dt>
                <Row label="Enajenación" value={`$${formatAmount(item.precioAdquisicion)} · ${uf(item.enajenacionUf)} UF`} />
                <Row label="Pago al contado" value={`$${formatAmount(item.pagoContado)} · ${uf(item.pagoContadoUf)} UF`} />
                <Row label="Deuda de origen" value={`${uf(debtOf(item))} UF`} />
                <Row label="Entidad que financió" value={text(item.institucion)} />
                <Row label="Plazo del crédito" value={term(item.plazoMeses)} />
                {item.plazoMeses ? <Row label={PLAZO_TEXT.name} value={elapsed(item)} /> : null}
                <Row label="Monto IVA" value={item.montoIva === null ? '—' : `$${formatNumber(item.montoIva)}`} />
                <Row label="Ley 20.455 / uso familiar" value={`${item.ley20455 ? 'Sí' : 'No'} / ${item.usoFamiliar ? 'Sí' : 'No'}`} />
              </dl>
            </div>
          </section>
        ))}
      </div>
    </Disclosure>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="property-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
