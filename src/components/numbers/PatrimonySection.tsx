import { summarizeProperties } from '../../lib/patrimonio'
import { formatAmount, formatDate, formatDecimal, formatNumber, formatRate } from '../../lib/format'
import type { Property, Report } from '../../types'
import { Disclosure } from '../Disclosure'
import { EmptyState } from '../Notice'
import { SectionCard, TableWrap } from '../SectionCard'

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

// Las propiedades como las entrega "Mis Bienes": una fila por rol con su compra y su crédito,
// el financiamiento agrupado por institución y la ficha registral completa de cada una.
export function PatrimonySection({ report, as }: { report: Report; as?: 'h2' | 'h3' }) {
  const { properties } = report
  const failed = report.taxpayer.sources.some(
    (item) => item.source === 'BIENES_RAICES' && item.status === 'failed',
  )

  if (properties.length === 0) {
    return (
      <SectionCard id="patrimonio" title="Propiedades por rol" note="SII · Mis Bienes" as={as}>
        <EmptyState
          text={
            failed
              ? 'No se pudo leer bienes raíces en esta captura. No significa que no existan propiedades.'
              : 'Sin propiedades inscritas.'
          }
        />
      </SectionCard>
    )
  }

  const { byBank } = summarizeProperties(properties)
  const Sub = as === 'h2' ? 'h3' : 'h4'

  return (
    <>
      <SectionCard id="patrimonio" title="Propiedades por rol" note="SII · Mis Bienes" as={as}>
        <TableWrap>
          <table className="table-fit">
            <thead>
              <tr>
                <th>Rol</th>
                <th className="cell-text">Destino</th>
                <th className="cell-text">Comuna</th>
                <th>Fecha escritura</th>
                <th>Enajenación (UF)</th>
                <th>Pago contado (UF)</th>
                <th>Deuda de origen (UF)</th>
                <th className="cell-text">Entidad que financió</th>
                <th>Plazo</th>
                <th className="cell-text">Ley 20.455</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((item) => (
                <tr key={item.rol}>
                  <td>
                    <span className="mono cell-title">{item.rol}</span>
                  </td>
                  <td className="cell-text">{item.destino}</td>
                  <td className="cell-text">{item.comuna}</td>
                  <td>{date(item.fechaAdquisicion)}</td>
                  <td>{uf(item.enajenacionUf)}</td>
                  <td>{uf(item.pagoContadoUf)}</td>
                  <td>{uf(debtOf(item))}</td>
                  <td className="cell-text">{item.institucion ?? (debtOf(item) ? 'No informada' : 'Sin crédito')}</td>
                  <td>{item.plazoMeses ? `${item.plazoMeses} meses` : '—'}</td>
                  <td className="cell-text">{item.ley20455 ? 'Sí' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <p className="section-body footnote">
          Deuda de origen = enajenación − pago al contado. Es lo financiado al comprar, no la deuda
          vigente. La raya (—) indica un dato no capturado.
        </p>
      </SectionCard>

      <SectionCard id="financiamiento" title="Financiamiento por institución" note="Deuda de origen" as={as}>
        {byBank.length === 0 ? (
          <EmptyState text="Ninguna propiedad tiene crédito." />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Institución</th>
                  <th>Propiedades</th>
                  <th>Deuda de origen (UF)</th>
                  <th>Parte de la deuda</th>
                </tr>
              </thead>
              <tbody>
                {byBank.map((item) => (
                  <tr key={item.bank}>
                    <td>{item.bank}</td>
                    <td>{item.properties}</td>
                    <td>{uf(item.debtUf)}</td>
                    <td>{item.share === null ? '—' : formatRate(item.share, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </SectionCard>

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
                  <Row label="Monto IVA" value={item.montoIva === null ? '—' : `$${formatNumber(item.montoIva)}`} />
                  <Row label="Ley 20.455 / uso familiar" value={`${item.ley20455 ? 'Sí' : 'No'} / ${item.usoFamiliar ? 'Sí' : 'No'}`} />
                </dl>
              </div>
            </section>
          ))}
        </div>
      </Disclosure>
    </>
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
