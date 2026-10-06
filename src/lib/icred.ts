import type { Report } from '../types'
import { formatAt } from './format'

// Valor presente de una cuota mensual: PV = PMT × (1 − (1 + i)^−n) / i.
export function presentValue(pmt: number, annualRate: number, months: number) {
  const i = annualRate / 12
  if (i === 0) return pmt * months
  return (pmt * (1 - (1 + i) ** -months)) / i
}

export interface MethodAlert {
  id: string
  title: string
  body: string
}

const joinYears = (years: number[]) => years.map(formatAt).join(', ')

// Advertencias del Capítulo IV que dependen de los códigos declarados.
export function methodAlerts(report: Report): MethodAlert[] {
  const alerts: MethodAlert[] = []
  const series = (code: string, from = report.incomeOrigins) =>
    from.find((item) => item.code === code)?.values ?? {}

  const retiros = series('104')
  const dividendos = series('105')
  const sinRetiros = report.years.filter((year) => retiros[year] === 0 && dividendos[year] === 0)
  if (sinRetiros.length > 0) {
    alerts.push({
      id: 'vpp',
      title: `Códigos 104 y 105 en cero en ${joinYears(sinRetiros)}`,
      body: 'Verifica si participa en sociedades como socio o accionista. Si es así, confirma su porcentaje y el resultado del ejercicio, y aplica VPP: son rentas que forman parte de su patrimonio económico aunque no se hayan retirado.',
    })
  }

  const honorarios = series('110')
  const presuntos = series('494', report.method.adjustments)
  const conHonorarios = report.years.filter((year) => (honorarios[year] ?? 0) > 0)
  const presunto = conHonorarios.filter((year) => (presuntos[year] ?? 0) > 0)
  const sinRegimen = conHonorarios.filter((year) => presuntos[year] == null)
  if (presunto.length > 0) {
    alerts.push({
      id: 'gasto-presunto',
      title: `Honorarios con gasto presunto en ${joinYears(presunto)}`,
      body: 'El código 110 ya viene rebajado en 30% (tope 15 UTA), por lo que el ingreso está subvaluado. Suma el código 494 al ingreso bruto y no apliques un castigo adicional.',
    })
  }
  if (sinRegimen.length > 0) {
    alerts.push({
      id: 'regimen-honorarios',
      title: `Honorarios sin régimen de gastos confirmado en ${joinYears(sinRegimen)}`,
      body: 'Antes de castigar el código 110, confirma si el contribuyente usa gasto efectivo (código 465) o presunto (código 494).',
    })
  }

  return alerts
}
