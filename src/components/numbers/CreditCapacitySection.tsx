import { useState } from 'react'
import type { Calc, CreditChoice } from '../../lib/calculos'
import {
  formatDate,
  formatDecimal,
  formatExact,
  formatMoney,
  formatRate,
  formatRateExact,
} from '../../lib/format'
import { presentValue } from '../../lib/icred'
import type { Report } from '../../types'
import { Figure, Figures } from '../Figures'
import { SectionCard, TableWrap } from '../SectionCard'

// Acepta coma o punto decimal. null si no es un número.
function parseNumber(text: string) {
  const clean = text.trim().replace(',', '.')
  if (clean === '') return null
  const value = Number(clean)
  return Number.isFinite(value) ? value : null
}

const MAX_RATE = 30
const MAX_YEARS = 50
const rateInput = (rate: number) => formatExact(Math.round(rate * 1e7) / 1e5, 1)

// La tasa y el plazo del Credit Capacity se escriben a mano. No hay valores únicos:
// dependen de cada institución, y el informe completo se recalcula con lo que se ingrese.
export function CreditInputs({
  report,
  calcs,
  credit,
  onChange,
}: {
  report: Report
  calcs: Calc[]
  credit: CreditChoice
  onChange: (credit: CreditChoice | null) => void
}) {
  const { method } = report
  const [rateText, setRateText] = useState(() => rateInput(credit.rate))
  const [yearsText, setYearsText] = useState(() => String(credit.years))
  const displayOf = (id: string) => calcs.find((calc) => calc.id === id)?.display ?? '—'

  const rate = parseNumber(rateText)
  const years = parseNumber(yearsText)
  const rateOk = rate !== null && rate >= 0 && rate <= MAX_RATE
  const yearsOk = years !== null && years > 0 && years <= MAX_YEARS
  const isReference = credit.rate === method.mortgageRate && credit.years === method.mortgageYears

  // El informe solo cambia cuando ambos valores son válidos; si no, conserva los últimos.
  const apply = (nextRate: string, nextYears: string) => {
    const r = parseNumber(nextRate)
    const y = parseNumber(nextYears)
    if (r !== null && r >= 0 && r <= MAX_RATE && y !== null && y > 0 && y <= MAX_YEARS) {
      onChange({ rate: r / 100, years: y })
    }
  }

  return (
    <div id="credito" className="card stack credit-inputs">
      <div className="sim-inputs no-print">
        <div className="field">
          <label htmlFor="sim-rate">Tasa de interés anual (%)</label>
          <input
            id="sim-rate"
            inputMode="decimal"
            autoComplete="off"
            value={rateText}
            aria-invalid={rateOk ? undefined : true}
            aria-describedby={rateOk ? undefined : 'sim-rate-error'}
            onChange={(event) => {
              setRateText(event.target.value)
              apply(event.target.value, yearsText)
            }}
          />
          {!rateOk && (
            <span id="sim-rate-error" className="field-error" role="alert">
              Escribe una tasa entre 0 y {MAX_RATE}, por ejemplo 4,5.
            </span>
          )}
        </div>
        <div className="field">
          <label htmlFor="sim-years">Plazo (años)</label>
          <input
            id="sim-years"
            inputMode="decimal"
            autoComplete="off"
            value={yearsText}
            aria-invalid={yearsOk ? undefined : true}
            aria-describedby={yearsOk ? undefined : 'sim-years-error'}
            onChange={(event) => {
              setYearsText(event.target.value)
              apply(rateText, event.target.value)
            }}
          />
          {!yearsOk && (
            <span id="sim-years-error" className="field-error" role="alert">
              Escribe un plazo entre 1 y {MAX_YEARS} años.
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn"
          disabled={isReference && rateOk && yearsOk}
          onClick={() => {
            setRateText(rateInput(method.mortgageRate))
            setYearsText(String(method.mortgageYears))
            onChange(null)
          }}
        >
          Volver a la referencia ({formatRate(method.mortgageRate, 1)} a {method.mortgageYears} años)
        </button>
      </div>

      <div aria-live="polite">
        <Figures label="Resultado con esa tasa y ese plazo">
          <Figure
            label="Dividendo de referencia"
            value={displayOf('limite-hipotecario')}
            note={`${formatRate(method.mortgageFactor, 0)} de la renta financiera neta mensual`}
          />
          <Figure
            label="Credit Capacity"
            value={displayOf('credit-capacity')}
            note={`Con ${formatRateExact(credit.rate)} anual a ${formatExact(credit.years)} años`}
          />
          <Figure
            label="Credit Capacity en UF"
            value={displayOf('credit-capacity-uf')}
            note={`UF del ${formatDate(method.uf.date)}`}
          />
        </Figures>
      </div>
    </div>
  )
}

// Tabla de doble entrada, solo de consulta: el crédito que paga el dividendo de referencia
// para cada tasa y plazo del rango del método.
export function CreditTable({
  report,
  calcs,
  credit,
}: {
  report: Report
  calcs: Calc[]
  credit: CreditChoice
}) {
  const { method } = report
  const { creditTable } = method
  const dividend = calcs.find((calc) => calc.id === 'limite-hipotecario')?.value ?? null
  if (dividend === null) return null

  // Las tasas se generan en décimas de punto para no arrastrar decimales sueltos.
  const from = Math.round(creditTable.rateFrom * 1000)
  const to = Math.round(creditTable.rateTo * 1000)
  const step = Math.max(1, Math.round(creditTable.rateStep * 1000))
  const rates = Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, index) => from + index * step)
  const current = Math.round(credit.rate * 100000) / 100

  return (
    <SectionCard
      id="credito-tabla"
      title="Tabla de referencia: Credit Capacity en UF"
      as="h3"
      note={`Dividendo de ${formatMoney(dividend)} al mes`}
    >
      <TableWrap>
        <table className="credit-table">
          <thead>
            <tr>
              <th>Tasa anual</th>
              {creditTable.years.map((term) => (
                <th key={term} className={term === credit.years ? 'col-selected' : undefined}>
                  {term} años
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rates.map((tenths) => (
              <tr key={tenths} className={tenths === current ? 'row-selected' : undefined}>
                <td>{formatRate(tenths / 1000, 1)}</td>
                {creditTable.years.map((term) => (
                  <td
                    key={term}
                    className={
                      term === credit.years
                        ? tenths === current
                          ? 'col-selected cell-selected'
                          : 'col-selected'
                        : undefined
                    }
                  >
                    {formatDecimal(presentValue(dividend, tenths / 1000, term * 12) / method.uf.value, 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <p className="section-body footnote">
        Valores referenciales: no constituyen una oferta ni una aprobación de crédito.
      </p>
    </SectionCard>
  )
}

// El crédito automotriz no tiene tasa de referencia: solo se calcula si se escribe una.
export function AutoCredit({ report, calcs }: { report: Report; calcs: Calc[] }) {
  const { method } = report
  const [rateText, setRateText] = useState('')
  const payment = calcs.find((calc) => calc.id === 'cuota-automotriz')?.value ?? null
  if (payment === null) return null

  const rate = parseNumber(rateText)
  const rateOk = rateText.trim() === '' || (rate !== null && rate >= 0 && rate <= MAX_RATE)
  const amount = rate !== null && rateOk ? presentValue(payment, rate / 100, method.autoMonths) : null

  return (
    <SectionCard id="credito-automotriz" title="Crédito automotriz" as="h3" note={`${method.autoMonths} meses`}>
      <div className="section-body stack">
        <div className="sim-inputs sim-narrow no-print">
          <div className="field">
            <label htmlFor="sim-auto">Tasa de interés anual (%)</label>
            <input
              id="sim-auto"
              inputMode="decimal"
              autoComplete="off"
              placeholder="El método no fija una tasa"
              value={rateText}
              aria-invalid={rateOk ? undefined : true}
              onChange={(event) => setRateText(event.target.value)}
            />
            {!rateOk && (
              <span className="field-error" role="alert">
                Escribe una tasa entre 0 y {MAX_RATE}.
              </span>
            )}
          </div>
        </div>
        <div aria-live="polite">
          <Figures label="Crédito automotriz">
            <Figure
              label="Cuota de referencia"
              value={formatMoney(payment)}
              note={`${formatRate(method.autoFactor, 0)} de la renta financiera neta mensual`}
            />
            <Figure
              label="Crédito que paga esa cuota"
              value={amount === null ? '—' : formatMoney(Math.round(amount))}
              note={amount === null ? 'Escribe una tasa para calcularlo' : `Con ${formatExact(rate ?? 0, 1)}% anual a ${method.autoMonths} meses`}
            />
          </Figures>
        </div>
      </div>
    </SectionCard>
  )
}
