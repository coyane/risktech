import { useState } from 'react'
import { formatAt, formatDate, formatDecimal, formatMoney, formatRate, formatUf } from '../../lib/format'
import { presentValue } from '../../lib/icred'
import type { Report } from '../../types'
import { SectionCard, TableWrap } from '../SectionCard'
import { StatTile } from '../StatTile'

const LEVERAGE_FACTORS = [1, 2, 3, 4]

function parsePositive(text: string) {
  const value = Number(text.replace(',', '.'))
  return Number.isFinite(value) && value >= 0 ? value : null
}

export function CreditCapacitySection({ report }: { report: Report }) {
  const { method } = report
  const last = report.financial.at(-1)
  const [rateText, setRateText] = useState(() => formatDecimal(method.mortgageRate * 100, 1))
  const [yearsText, setYearsText] = useState(() => String(method.mortgageYears))
  const [autoRateText, setAutoRateText] = useState('')

  if (!last) return null

  const rate = parsePositive(rateText)
  const years = parsePositive(yearsText)
  const autoRate = autoRateText.trim() === '' ? null : parsePositive(autoRateText)
  const valid = rate !== null && years !== null && years > 0
  const capacity = valid ? presentValue(last.mortgageLimit, rate / 100, Math.round(years * 12)) : null
  const autoPmt = Math.round(last.rfnMonthly * method.autoFactor)
  const autoCapacity =
    autoRate !== null ? presentValue(autoPmt, autoRate / 100, method.autoMonths) : null
  const toUf = (clp: number) => clp / method.uf.value

  return (
    <SectionCard
      id="credito"
      title="Capacidad de crédito"
      note={`Simulación sobre ${formatAt(last.year)} · UF ${formatDecimal(method.uf.value, 2)} al ${formatDate(method.uf.date)}`}
    >
      <div className="section-body stack">
        <div className="sim-inputs">
          <div className="field">
            <label htmlFor="sim-rate">Tasa anual hipotecaria (%)</label>
            <input
              id="sim-rate"
              inputMode="decimal"
              value={rateText}
              onChange={(event) => setRateText(event.target.value)}
              aria-invalid={rate === null ? true : undefined}
            />
          </div>
          <div className="field">
            <label htmlFor="sim-years">Plazo (años)</label>
            <input
              id="sim-years"
              inputMode="numeric"
              value={yearsText}
              onChange={(event) => setYearsText(event.target.value)}
              aria-invalid={years === null || years === 0 ? true : undefined}
            />
          </div>
          <div className="field">
            <label htmlFor="sim-auto">Tasa anual automotriz (%)</label>
            <input
              id="sim-auto"
              inputMode="decimal"
              placeholder="Opcional"
              value={autoRateText}
              onChange={(event) => setAutoRateText(event.target.value)}
            />
          </div>
        </div>
        {!valid && (
          <div className="field-error" role="alert">
            Ingresa una tasa y un plazo válidos para calcular la capacidad.
          </div>
        )}

        <div className="stat-grid stat-grid-3" aria-live="polite">
          <StatTile
            label="Dividendo hipotecario de referencia"
            value={formatMoney(last.mortgageLimit)}
            note={`RFN mensual × ${formatRate(method.mortgageFactor, 0)}`}
            mono
          />
          <StatTile
            label="Capacidad de endeudamiento personal"
            value={capacity === null ? '—' : formatMoney(Math.round(capacity))}
            note={capacity === null ? undefined : formatUf(toUf(capacity))}
            mono
          />
          <StatTile
            label="Cuota automotriz de referencia"
            value={formatMoney(autoPmt)}
            note={
              autoCapacity === null
                ? `RFN mensual × ${formatRate(method.autoFactor, 0)} · ${method.autoMonths} meses`
                : `Financia ${formatMoney(Math.round(autoCapacity))} a ${method.autoMonths} meses`
            }
            mono
          />
        </div>
      </div>

      {capacity !== null && (
        <>
          <h3 className="section-subtitle">Factor leverage</h3>
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Veces la capacidad personal</th>
                  <th>Deuda máxima (UF)</th>
                  <th>Deuda máxima ($)</th>
                </tr>
              </thead>
              <tbody>
                {LEVERAGE_FACTORS.map((factor) => (
                  <tr key={factor}>
                    <td>Factor {factor}</td>
                    <td>{formatDecimal(toUf(capacity * factor), 0)}</td>
                    <td>{formatDecimal(capacity * factor, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </>
      )}
      <p className="section-body footnote">
        La capacidad personal mide el pago con ingresos propios. El factor leverage es cuántas veces
        ese monto está dispuesta a financiar una institución a un inversionista inmobiliario, cuyo
        servicio de deuda proviene de los arriendos. Valores referenciales: no constituyen una
        oferta ni una aprobación de crédito.
      </p>
    </SectionCard>
  )
}
