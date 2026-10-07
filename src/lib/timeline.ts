import type { Report } from '../types'
import { formatDecimal } from './format'

export interface TimelineDay {
  date: string
  events: string[]
}

const uf = (value: number | null) => (value === null ? 'sin dato' : `${formatDecimal(value, 2)} UF`)

// Línea de tiempo armada solo con fechas que ya están en los datos del SII.
export function buildTimeline(report: Report): TimelineDay[] {
  const events: { date: string; text: string }[] = []
  const add = (date: string | null, text: string) => {
    if (date) events.push({ date: date.slice(0, 10), text })
  }

  add(report.taxpayer.activityStart, 'Inicio de actividades en el SII.')
  for (const item of report.f22Returns) add(item.filedAt, `Declaración F22 año ${item.year}.`)
  for (const item of report.activities) add(item.startDate, `Nueva actividad: ${item.label}.`)
  for (const item of report.regimes) add(item.since, `Nuevo régimen: ${item.name}.`)
  for (const item of report.stampings) add(item.since, `Nuevo timbraje: ${item.name}.`)
  for (const item of report.companies) add(item.since, `Incorporación en sociedad: ${item.name}.`)
  for (const item of report.properties) {
    add(
      item.fechaAdquisicion,
      `Compra de propiedad ${item.rol}: ${item.destino}. Enajenación de ${uf(item.enajenacionUf)}, contado de ${uf(item.pagoContadoUf)}.`,
    )
  }
  add(report.taxpayer.capturedAt, 'Captura de datos para este informe.')

  const days = new Map<string, string[]>()
  for (const event of events.toSorted((a, b) => a.text.localeCompare(b.text))) {
    days.set(event.date, [...(days.get(event.date) ?? []), event.text])
  }
  return [...days.entries()]
    .map(([date, list]) => ({ date, events: list }))
    .toSorted((a, b) => b.date.localeCompare(a.date))
}
