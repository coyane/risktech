import type { Report } from '../types'

type Cell = string | number | null

const escape = (cell: Cell) => {
  if (cell == null) return ''
  const text = String(cell)
  return /[";\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

// CSV con separador ";" y BOM, que Excel en español abre directamente.
export function reportToCsv(report: Report) {
  const rows: Cell[][] = []
  const years = report.years
  const section = (title: string, header: Cell[], body: Cell[][]) => {
    rows.push([title], header, ...body, [])
  }

  section(
    'Orígenes de renta',
    ['Código', 'Glosa', ...years.map((year) => `AT ${year}`)],
    report.incomeOrigins.map((item) => [
      item.code,
      item.label,
      ...years.map((year) => item.values[year] ?? null),
    ]),
  )
  section(
    'Rebajas',
    ['Código', 'Glosa', ...years.map((year) => `AT ${year}`)],
    report.deductions.map((item) => [
      item.code,
      item.label,
      ...years.map((year) => item.values[year] ?? null),
    ]),
  )
  section(
    'Base imponible IGC',
    ['Código', 'Glosa', ...years.map((year) => `AT ${year}`)],
    [
      ['170', 'Base imponible tributaria', ...years.map((year) => report.igcBase.base170[year] ?? null)],
      ['157', 'Impuesto determinado', ...years.map((year) => report.igcBase.tax157[year] ?? null)],
    ],
  )
  section(
    'Análisis financiero',
    ['Indicador', ...report.financial.map((item) => `AT ${item.year}`)],
    [
      ['Tasa efectiva de tributación', ...report.financial.map((item) => item.effectiveRate)],
      ['Renta financiera bruta', ...report.financial.map((item) => item.rfb)],
      ['Renta financiera neta', ...report.financial.map((item) => item.rfn)],
      ['RFN promedio mensual', ...report.financial.map((item) => item.rfnMonthly)],
      ['BIT IGC en UTA', ...report.financial.map((item) => item.bitUta)],
      ['Tramo Art. 55 bis', ...report.financial.map((item) => report.igcBase.bracket55bis[item.year] ?? null)],
      ['Límite crédito hipotecario', ...report.financial.map((item) => item.mortgageLimit)],
    ],
  )
  section(
    'Bienes raíces',
    ['Rol', 'Comuna', 'Región', 'Destino', 'Enajenación UF', 'Pago contado UF', 'Dirección', 'Avalúo total', 'Afecto', 'Exento', 'Contribución', 'Fecha adquisición', 'Acto', 'Precio', 'Pago contado', 'Financiado', 'Institución', 'Crédito UF'],
    report.properties.map((item) => [
      item.rol,
      item.comuna,
      item.region,
      item.destino,
      item.enajenacionUf,
      item.pagoContadoUf,
      item.direccion,
      item.avaluo,
      item.avaluoAfecto,
      item.avaluoExento,
      item.contribucion,
      item.fechaAdquisicion,
      item.tipoActo,
      item.precioAdquisicion,
      item.pagoContado,
      item.montoFinanciado,
      item.institucion,
      item.financiamientoUf,
    ]),
  )
  section(
    'F29',
    ['Período', 'Tipo', 'Folio', 'Débitos', 'Créditos', 'IVA determinado', 'Remanente', 'PPM', 'Retenciones', 'Total', 'Estado', 'Presentado'],
    report.f29.map((item) => [
      item.period,
      item.filingType,
      item.folio,
      item.debit,
      item.credit,
      item.ivaDeterminado,
      item.remanente,
      item.ppm,
      item.retenciones,
      item.total,
      item.paymentStatus,
      item.filedAt,
    ]),
  )

  return '﻿' + rows.map((row) => row.map(escape).join(';')).join('\n')
}

export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
