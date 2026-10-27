import { useMemo, useState } from 'react'
import type { CreditChoice } from './calculos'
import { formatExact } from './format'

export const MAX_RATE = 30
export const MAX_YEARS = 50

// Acepta coma o punto decimal. null si no es un número.
export function parseNumber(text: string) {
  const clean = text.trim().replace(',', '.')
  if (clean === '') return null
  const value = Number(clean)
  return Number.isFinite(value) ? value : null
}

const rateText = (rate: number) => formatExact(Math.round(rate * 1e7) / 1e5, 1)
const rateValid = (rate: number | null) => rate !== null && rate >= 0 && rate <= MAX_RATE
const yearsValid = (years: number | null) => years !== null && years > 0 && years <= MAX_YEARS

export interface CreditDraft {
  // Lo escrito en los campos, tal cual.
  rateText: string
  yearsText: string
  rateOk: boolean
  yearsOk: boolean
  // La tasa y el plazo con que se calcula el informe: los últimos válidos.
  credit: CreditChoice
  isReference: boolean
  setRate: (text: string) => void
  setYears: (text: string) => void
  reset: () => void
}

// Tasa y plazo del Credit Capacity. Viven en el informe y no en un campo, para que el
// Resumen y la pestaña Crédito muestren lo mismo y recalculen todo el informe.
// El informe solo cambia cuando ambos valores son válidos; si no, conserva los últimos.
export function useCreditDraft(referenceRate: number, referenceYears: number): CreditDraft {
  const [texts, setTexts] = useState(() => ({ rate: rateText(referenceRate), years: String(referenceYears) }))
  const [chosen, setChosen] = useState<CreditChoice | null>(null)
  const credit = useMemo(
    () => chosen ?? { rate: referenceRate, years: referenceYears },
    [chosen, referenceRate, referenceYears],
  )

  const update = (rate: string, years: string) => {
    setTexts({ rate, years })
    const r = parseNumber(rate)
    const y = parseNumber(years)
    if (rateValid(r) && yearsValid(y)) setChosen({ rate: (r as number) / 100, years: y as number })
  }

  return {
    rateText: texts.rate,
    yearsText: texts.years,
    rateOk: rateValid(parseNumber(texts.rate)),
    yearsOk: yearsValid(parseNumber(texts.years)),
    credit,
    isReference: credit.rate === referenceRate && credit.years === referenceYears,
    setRate: (text) => update(text, texts.years),
    setYears: (text) => update(texts.rate, text),
    reset: () => {
      setTexts({ rate: rateText(referenceRate), years: String(referenceYears) })
      setChosen(null)
    },
  }
}
