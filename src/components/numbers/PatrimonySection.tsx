import { formatAmount, formatDecimal, formatMoney, formatNumber, formatUf } from '../../lib/format'
import type { Report } from '../../types'
import { BarList } from '../BarList'
import { EmptyState } from '../Notice'
import { SectionCard, TableWrap } from '../SectionCard'
import { StatTile } from '../StatTile'

function countBy(items: string[]) {
  const counts = new Map<string, number>()
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1)
  return [...counts.entries()].toSorted((a, b) => b[1] - a[1])
}

function sumKnown(values: (number | null)[]) {
  const known = values.filter((value) => value !== null)
  return known.length === 0 ? null : known.reduce((sum, value) => sum + value, 0)
}

export function PatrimonySection({ report }: { report: Report }) {
  const { properties, patrimony } = report
  const failed = report.taxpayer.sources.some(
    (item) => item.source === 'BIENES_RAICES' && item.status === 'failed',
  )
  const totalAvaluo = properties.reduce((sum, item) => sum + item.avaluo, 0)
  const totalContribucion = sumKnown(properties.map((item) => item.contribucion))

  return (
    <SectionCard id="patrimonio" title="Radiografía patrimonial" note="Bienes raíces y deuda">
      {properties.length === 0 ? (
        <EmptyState
          text={
            failed
              ? 'No se pudo leer bienes raíces en esta captura. No significa que el contribuyente no tenga propiedades.'
              : 'Sin bienes raíces en esta extracción.'
          }
        />
      ) : (
        <>
          <div className="section-body stat-grid stat-grid-3">
            <StatTile label="Propiedades" value={String(properties.length)} mono />
            <StatTile label="Avalúo fiscal total" value={formatMoney(totalAvaluo)} mono />
            <StatTile
              label="Contribuciones del año"
              value={totalContribucion === null ? '—' : formatMoney(totalContribucion)}
              mono
            />
            {patrimony && (
              <>
                <StatTile
                  label="Enajenación total"
                  value={formatMoney(patrimony.enajenacionClp)}
                  note={formatUf(patrimony.enajenacionUf, 2)}
                  mono
                />
                <StatTile
                  label="Pago contado total"
                  value={formatMoney(patrimony.pagoContadoClp)}
                  note={formatUf(patrimony.pagoContadoUf, 2)}
                  mono
                />
                <StatTile label="Monto IVA total" value={formatMoney(patrimony.ivaClp)} mono />
                <StatTile label="Activos" value={formatUf(patrimony.activosUf, 2)} mono />
                <StatTile label="Pasivos" value={formatUf(patrimony.pasivosUf, 2)} mono />
                <StatTile label="Patrimonio" value={formatUf(patrimony.patrimonioUf, 2)} mono />
              </>
            )}
          </div>

          <div className="section-body chip-rows">
            <div>
              <span className="chip-row-label">Destinos</span>
              {countBy(properties.map((item) => item.destino)).map(([name, count]) => (
                <span className="tag tag-neutral" key={name}>
                  {name} · {count}
                </span>
              ))}
            </div>
            <div>
              <span className="chip-row-label">Comunas</span>
              {countBy(properties.map((item) => item.comuna)).map(([name, count]) => (
                <span className="tag tag-idle" key={name}>
                  {name} · {count}
                </span>
              ))}
            </div>
          </div>

          {patrimony && patrimony.debts.length > 0 && (
            <div className="section-body stack">
              <h3 className="section-subtitle flush">
                Deuda total de {formatUf(patrimony.deudaTotalUf)}, con leverage de{' '}
                {formatDecimal(patrimony.leverage)}
              </h3>
              <BarList
                label="Deuda por entidad bancaria"
                items={patrimony.debts.map((item) => ({
                  key: item.bank,
                  label: item.bank,
                  value: item.debtUf,
                  detail: `${formatUf(item.debtUf)} · leverage ${formatDecimal(item.leverage)} · ${item.properties} propiedad${item.properties === 1 ? '' : 'es'}`,
                  color: 'var(--accent)',
                }))}
              />
              <p className="footnote">{patrimony.note}</p>
            </div>
          )}

          <h3 className="section-subtitle">Detalle por rol</h3>
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Rol</th>
                  <th className="cell-text">Comuna</th>
                  <th className="cell-text">Dirección</th>
                  <th className="cell-text">Destino</th>
                  <th>Terreno m²</th>
                  <th>Construido m²</th>
                  <th>Avalúo total</th>
                  <th>Afecto</th>
                  <th>Exento</th>
                  <th>Contribución</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.rol}>
                    <td className="mono">{property.rol}</td>
                    <td className="cell-text">{property.comuna}</td>
                    <td className="cell-text">{property.direccion ?? '—'}</td>
                    <td className="cell-text">{property.destino}</td>
                    <td>{formatAmount(property.superficieTerreno)}</td>
                    <td>{formatAmount(property.superficieConstruida)}</td>
                    <td>{formatNumber(property.avaluo)}</td>
                    <td>{formatAmount(property.avaluoAfecto)}</td>
                    <td>{formatAmount(property.avaluoExento)}</td>
                    <td>{formatAmount(property.contribucion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </>
      )}
    </SectionCard>
  )
}
