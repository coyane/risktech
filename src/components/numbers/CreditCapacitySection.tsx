import { useState } from 'react'
import { creditSource, type Calc, type CreditChoice } from '../../lib/calculos'
import {
  formatDecimal,
  formatExact,
  formatMoney,
  formatRate,
  formatRateExact,
} from '../../lib/format'
import { presentValue } from '../../lib/finanzas'
import { MAX_RATE, MAX_YEARS, parseNumber, type CreditDraft } from '../../lib/useCreditDraft'
import type { Report } from '../../types'
import { BigValue } from '../panel/Bits'
import { SectionCard, TableWrap } from '../SectionCard'

// Los dos campos del Credit Capacity. Se escriben a mano: no hay valores únicos, dependen
// de cada institución. El borrador vive en el informe, así el Resumen y la pestaña Crédito
// muestran lo mismo; idPrefix evita ids repetidos entre las dos vistas.
// La unidad va dentro del campo (inspirado en Unit Field de arikchakma, 21st.dev, MIT;
// sin el arrastre para cambiar el valor, que equivale a un deslizador).
export function CreditFields({
  report,
  draft,
  idPrefix,
  tone = 'light',
}: {
  report: Report
  draft: CreditDraft
  idPrefix: string
  tone?: 'light' | 'dark'
}) {
  const { method } = report
  const { rateText, yearsText, rateOk, yearsOk } = draft
  const rateId = `${idPrefix}-rate`
  const yearsId = `${idPrefix}-years`

  return (
    <div className={`pn-fields pn-fields-${tone} no-print`}>
      <div className="pn-field">
        <label htmlFor={rateId}>
          Tasa de interés anual<span className="sr-only"> (%)</span>
        </label>
        <span className="pn-input" data-invalid={rateOk ? undefined : true}>
          <input
            id={rateId}
            name="tasa"
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            spellCheck={false}
            value={rateText}
            aria-invalid={rateOk ? undefined : true}
            aria-describedby={rateOk ? undefined : `${rateId}-error`}
            onChange={(event) => draft.setRate(event.target.value)}
          />
          <span aria-hidden="true">%</span>
        </span>
        {!rateOk && (
          <span id={`${rateId}-error`} className="pn-field-error" role="alert">
            Escribe una tasa entre 0 y {MAX_RATE}, por ejemplo 4,5.
          </span>
        )}
      </div>
      <div className="pn-field">
        <label htmlFor={yearsId}>Plazo</label>
        <span className="pn-input" data-invalid={yearsOk ? undefined : true}>
          <input
            id={yearsId}
            name="plazo"
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            spellCheck={false}
            value={yearsText}
            aria-invalid={yearsOk ? undefined : true}
            aria-describedby={yearsOk ? undefined : `${yearsId}-error`}
            onChange={(event) => draft.setYears(event.target.value)}
          />
          <span aria-hidden="true">años</span>
        </span>
        {!yearsOk && (
          <span id={`${yearsId}-error`} className="pn-field-error" role="alert">
            Escribe un plazo entre 1 y {MAX_YEARS} años.
          </span>
        )}
      </div>
      <p className="pn-fields-foot">
        <span>{creditSource(method, draft.credit)}</span>
        {!(draft.isReference && rateOk && yearsOk) && (
          <button type="button" className="pn-linkbtn" onClick={draft.reset}>
            Volver a la referencia ({formatRateExact(method.mortgageRate)} a {method.mortgageYears} años)
          </button>
        )}
      </p>
    </div>
  )
}

// Tabla de doble entrada, solo de consulta: el crédito que paga el dividendo de referencia
// para cada tasa y plazo del rango de referencia.
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
    <div className="pn-auto">
      <p className="pn-note">Cuota de referencia, {formatRate(method.autoFactor, 0)} de la renta neta mensual</p>
      <p className="pn-figure">
        <BigValue display={formatMoney(payment)} />
      </p>
      <div className="pn-field no-print">
        <label htmlFor="sim-auto">Tasa de interés anual, a {method.autoMonths} meses</label>
        <span className="pn-input pn-input-light" data-invalid={rateOk ? undefined : true}>
          <input
            id="sim-auto"
            name="tasa-automotriz"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Escribe una tasa…"
            value={rateText}
            aria-invalid={rateOk ? undefined : true}
            aria-describedby="sim-auto-out"
            onChange={(event) => setRateText(event.target.value)}
          />
          <span aria-hidden="true">%</span>
        </span>
      </div>
      <p id="sim-auto-out" className="pn-note" aria-live="polite">
        {!rateOk ? (
          <span className="pn-field-error">Escribe una tasa entre 0 y {MAX_RATE}.</span>
        ) : amount === null ? (
          'No hay una tasa de referencia para este crédito: escríbela para calcularlo.'
        ) : (
          <>
            Crédito que paga esa cuota: <strong>{formatMoney(Math.round(amount))}</strong>, con{' '}
            {formatExact(rate ?? 0, 1)}% anual a {method.autoMonths} meses.
          </>
        )}
      </p>
    </div>
  )
}
