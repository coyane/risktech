import demo from './demo.json'
import { formatMoneyMillions, formatRate } from '../lib/format'
import type { InsightTone } from '../types'

export type PropertyDestino =
  | 'Habitacional'
  | 'Bodega'
  | 'Comercial'
  | 'Oficina'
  | 'Terreno'
  | 'Sitio eriazo'
  | 'Estacionamiento'
  | 'Industrial'

export type ClientStatus = 'activo' | 'en_revision' | 'sin_datos'

export interface PortfolioProperty {
  rol: string
  comuna: string
  destino: PropertyDestino
  avaluo: number
  contribucion: number
}

export interface PortfolioClient {
  id: string
  rut: string
  name: string
  status: ClientStatus
  lastRunAt: string
  bracket55bis: 'A' | 'B' | 'C'
  totalOrigins: number
  rfnMonthly: number
  effectiveRate: number
  mortgageLimit: number
  incomeGrowth: number
  warnings: number
  properties: PortfolioProperty[]
}

export interface PortfolioInsight {
  id: string
  dimension: string
  tone: InsightTone
  title: string
  body: string
  affected: number
  action: string
}

const caseProperties: PortfolioProperty[] = demo.report.properties.map((item) => ({
  rol: item.rol,
  comuna: item.comuna,
  destino: item.destino as PropertyDestino,
  avaluo: item.avaluo,
  contribucion: item.contribucion,
}))

export const portfolioClients: PortfolioClient[] = [
  {
    id: 'c1',
    rut: '12.345.678-9',
    name: 'Carlos Díaz',
    status: 'activo',
    lastRunAt: '2026-10-06T11:00:00-03:00',
    bracket55bis: 'B',
    totalOrigins: 104_832_677,
    rfnMonthly: 5_446_673,
    effectiveRate: 0.16,
    mortgageLimit: 1_361_668,
    incomeGrowth: 2.0,
    warnings: 2,
    // Mismo contribuyente que el caso de ejemplo: comparte sus bienes raíces.
    properties: caseProperties,
  },
  {
    id: 'c2',
    rut: '9.876.543-2',
    name: 'María Fernanda Soto',
    status: 'activo',
    lastRunAt: '2026-10-05T16:20:00-03:00',
    bracket55bis: 'A',
    totalOrigins: 48_220_000,
    rfnMonthly: 3_120_000,
    effectiveRate: 0.072,
    mortgageLimit: 780_000,
    incomeGrowth: 1.15,
    warnings: 0,
    properties: [
      {
        rol: '8821-1',
        comuna: 'Ñuñoa',
        destino: 'Habitacional',
        avaluo: 98_000_000,
        contribucion: 890_000,
      },
    ],
  },
  {
    id: 'c3',
    rut: '15.441.220-K',
    name: 'Inmobiliaria Andes SpA',
    status: 'en_revision',
    lastRunAt: '2026-10-04T09:40:00-03:00',
    bracket55bis: 'C',
    totalOrigins: 312_500_000,
    rfnMonthly: 14_800_000,
    effectiveRate: 0.214,
    mortgageLimit: 3_700_000,
    incomeGrowth: 1.42,
    warnings: 3,
    properties: [
      {
        rol: '4401-8',
        comuna: 'Santiago',
        destino: 'Comercial',
        avaluo: 420_000_000,
        contribucion: 5_200_000,
      },
      {
        rol: '4402-1',
        comuna: 'Quilicura',
        destino: 'Bodega',
        avaluo: 210_000_000,
        contribucion: 1_850_000,
      },
      {
        rol: '4402-2',
        comuna: 'Quilicura',
        destino: 'Bodega',
        avaluo: 195_000_000,
        contribucion: 1_720_000,
      },
      {
        rol: '4410-3',
        comuna: 'Huechuraba',
        destino: 'Oficina',
        avaluo: 168_000_000,
        contribucion: 1_450_000,
      },
      {
        rol: '4411-0',
        comuna: 'Pudahuel',
        destino: 'Industrial',
        avaluo: 350_000_000,
        contribucion: 2_900_000,
      },
    ],
  },
  {
    id: 'c4',
    rut: '7.112.334-5',
    name: 'Pedro Alarcón',
    status: 'activo',
    lastRunAt: '2026-10-03T14:05:00-03:00',
    bracket55bis: 'B',
    totalOrigins: 89_400_000,
    rfnMonthly: 5_010_000,
    effectiveRate: 0.148,
    mortgageLimit: 1_252_500,
    incomeGrowth: 1.28,
    warnings: 1,
    properties: [
      {
        rol: '5510-2',
        comuna: 'La Reina',
        destino: 'Habitacional',
        avaluo: 142_000_000,
        contribucion: 1_320_000,
      },
      {
        rol: '5510-9',
        comuna: 'La Reina',
        destino: 'Estacionamiento',
        avaluo: 8_500_000,
        contribucion: 45_000,
      },
      {
        rol: '5522-4',
        comuna: 'Peñalolén',
        destino: 'Terreno',
        avaluo: 65_000_000,
        contribucion: 210_000,
      },
    ],
  },
  {
    id: 'c5',
    rut: '18.902.111-0',
    name: 'Valentina Rojas',
    status: 'sin_datos',
    lastRunAt: '2026-09-28T11:15:00-03:00',
    bracket55bis: 'A',
    totalOrigins: 32_100_000,
    rfnMonthly: 2_140_000,
    effectiveRate: 0.055,
    mortgageLimit: 535_000,
    incomeGrowth: 0.94,
    warnings: 4,
    properties: [],
  },
  {
    id: 'c6',
    rut: '11.220.887-3',
    name: 'Jorge Campos',
    status: 'activo',
    lastRunAt: '2026-10-05T08:30:00-03:00',
    bracket55bis: 'B',
    totalOrigins: 76_800_000,
    rfnMonthly: 4_620_000,
    effectiveRate: 0.132,
    mortgageLimit: 1_155_000,
    incomeGrowth: 1.51,
    warnings: 0,
    properties: [
      {
        rol: '7001-4',
        comuna: 'Vitacura',
        destino: 'Habitacional',
        avaluo: 260_000_000,
        contribucion: 3_100_000,
      },
      {
        rol: '7012-8',
        comuna: 'Lo Barnechea',
        destino: 'Habitacional',
        avaluo: 310_000_000,
        contribucion: 3_800_000,
      },
    ],
  },
  {
    id: 'c7',
    rut: '13.556.778-1',
    name: 'Comercial Pacífico Ltda.',
    status: 'activo',
    lastRunAt: '2026-10-02T17:45:00-03:00',
    bracket55bis: 'C',
    totalOrigins: 198_300_000,
    rfnMonthly: 9_400_000,
    effectiveRate: 0.189,
    mortgageLimit: 2_350_000,
    incomeGrowth: 1.18,
    warnings: 1,
    properties: [
      {
        rol: '9100-1',
        comuna: 'Maipú',
        destino: 'Comercial',
        avaluo: 125_000_000,
        contribucion: 1_100_000,
      },
      {
        rol: '9101-2',
        comuna: 'Cerrillos',
        destino: 'Bodega',
        avaluo: 88_000_000,
        contribucion: 720_000,
      },
      {
        rol: '9102-5',
        comuna: 'Estación Central',
        destino: 'Oficina',
        avaluo: 74_000_000,
        contribucion: 640_000,
      },
    ],
  },
  {
    id: 'c8',
    rut: '16.334.901-8',
    name: 'Ana Belén Muñoz',
    status: 'en_revision',
    lastRunAt: '2026-10-01T12:10:00-03:00',
    bracket55bis: 'A',
    totalOrigins: 41_750_000,
    rfnMonthly: 2_780_000,
    effectiveRate: 0.068,
    mortgageLimit: 695_000,
    incomeGrowth: 1.08,
    warnings: 2,
    properties: [
      {
        rol: '2200-7',
        comuna: 'San Miguel',
        destino: 'Habitacional',
        avaluo: 72_000_000,
        contribucion: 510_000,
      },
      {
        rol: '2211-3',
        comuna: 'La Cisterna',
        destino: 'Bodega',
        avaluo: 28_000_000,
        contribucion: 190_000,
      },
    ],
  },
  {
    id: 'c9',
    rut: '8.441.002-6',
    name: 'Ricardo Núñez',
    status: 'activo',
    lastRunAt: '2026-10-06T09:05:00-03:00',
    bracket55bis: 'C',
    totalOrigins: 455_000_000,
    rfnMonthly: 21_200_000,
    effectiveRate: 0.268,
    mortgageLimit: 5_300_000,
    incomeGrowth: 1.35,
    warnings: 1,
    properties: [
      {
        rol: '3300-1',
        comuna: 'Las Condes',
        destino: 'Habitacional',
        avaluo: 520_000_000,
        contribucion: 6_400_000,
      },
      {
        rol: '3310-4',
        comuna: 'Vitacura',
        destino: 'Oficina',
        avaluo: 290_000_000,
        contribucion: 2_800_000,
      },
      {
        rol: '3320-9',
        comuna: 'Colina',
        destino: 'Terreno',
        avaluo: 180_000_000,
        contribucion: 420_000,
      },
      {
        rol: '3330-2',
        comuna: 'Pudahuel',
        destino: 'Bodega',
        avaluo: 155_000_000,
        contribucion: 1_250_000,
      },
    ],
  },
  {
    id: 'c10',
    rut: '14.778.220-4',
    name: 'Camila Herrera',
    status: 'activo',
    lastRunAt: '2026-10-04T19:20:00-03:00',
    bracket55bis: 'B',
    totalOrigins: 67_900_000,
    rfnMonthly: 4_050_000,
    effectiveRate: 0.121,
    mortgageLimit: 1_012_500,
    incomeGrowth: 1.22,
    warnings: 0,
    properties: [
      {
        rol: '6601-5',
        comuna: 'Independencia',
        destino: 'Habitacional',
        avaluo: 81_000_000,
        contribucion: 620_000,
      },
    ],
  },
]

export function portfolioSummary(clients: PortfolioClient[] = portfolioClients) {
  const properties = clients.flatMap((c) => c.properties)
  const activos = clients.filter((c) => c.status === 'activo').length
  const totalAvaluo = properties.reduce((sum, p) => sum + p.avaluo, 0)
  const totalMortgage = clients.reduce((sum, c) => sum + c.mortgageLimit, 0)
  const avgRfn =
    clients.reduce((sum, c) => sum + c.rfnMonthly, 0) / Math.max(clients.length, 1)
  const warnings = clients.reduce((sum, c) => sum + c.warnings, 0)

  const byBracket = (['A', 'B', 'C'] as const).map((bracket) => ({
    bracket,
    count: clients.filter((c) => c.bracket55bis === bracket).length,
  }))

  const byDestinoMap = new Map<string, { count: number; avaluo: number }>()
  for (const property of properties) {
    const current = byDestinoMap.get(property.destino) ?? { count: 0, avaluo: 0 }
    current.count += 1
    current.avaluo += property.avaluo
    byDestinoMap.set(property.destino, current)
  }
  const byDestino = [...byDestinoMap.entries()]
    .map(([destino, value]) => ({ destino, ...value }))
    .sort((a, b) => b.avaluo - a.avaluo)

  const byComunaMap = new Map<string, number>()
  for (const property of properties) {
    byComunaMap.set(property.comuna, (byComunaMap.get(property.comuna) ?? 0) + 1)
  }
  const byComuna = [...byComunaMap.entries()]
    .map(([comuna, count]) => ({ comuna, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  return {
    clients: clients.length,
    activos,
    properties: properties.length,
    totalAvaluo,
    totalMortgage,
    avgRfn,
    warnings,
    byBracket,
    byDestino,
    byComuna,
  }
}

// Los datos del portafolio son estáticos: el resumen se calcula una sola vez.
export const portfolioTotals = portfolioSummary()

export const dominantBracket = portfolioTotals.byBracket.reduce((top, item) =>
  item.count > top.count ? item : top,
)

const bodegas = portfolioClients.flatMap((client) =>
  client.properties.filter((property) => property.destino === 'Bodega'),
)
const bodegaOwners = portfolioClients.filter((client) =>
  client.properties.some((property) => property.destino === 'Bodega'),
).length
const bodegaShare =
  bodegas.reduce((sum, property) => sum + property.avaluo, 0) /
  Math.max(portfolioTotals.totalAvaluo, 1)
const sinDatos = portfolioClients.filter((client) => client.status === 'sin_datos')
const dominantClients = portfolioClients.filter(
  (client) => client.bracket55bis === dominantBracket.bracket,
)
const minDominantRate = Math.min(...dominantClients.map((client) => client.effectiveRate))

// Los textos se arman con los datos para que no se desalineen de las tablas.
export const portfolioInsights: PortfolioInsight[] = [
  {
    id: 'tramo-dominante',
    dimension: 'Tributario',
    tone: 'neutral',
    title: `El ${formatRate(dominantBracket.count / portfolioTotals.clients, 0)} del portafolio está en tramo ${dominantBracket.bracket}`,
    body: `${dominantBracket.count} clientes están en tramo ${dominantBracket.bracket} del Art. 55 bis. Su tasa efectiva parte en ${formatRate(minDominantRate)}.`,
    affected: dominantBracket.count,
    action: 'Revisar escenarios de refinanciamiento',
  },
  {
    id: 'bodegas',
    dimension: 'Patrimonial',
    tone: 'positive',
    title: `Las bodegas concentran el ${formatRate(bodegaShare, 0)} del avalúo del portafolio`,
    body: `Hay ${bodegas.length} bodegas en el portafolio, repartidas entre ${bodegaOwners} clientes.`,
    affected: bodegaOwners,
    action: 'Cruzar con códigos 955 del F22',
  },
  {
    id: 'sin-datos',
    dimension: 'Operacional',
    tone: 'review',
    title: `${sinDatos.length} cliente${sinDatos.length === 1 ? '' : 's'} sin fuentes completas`,
    body: `${sinDatos.map((client) => client.name).join(', ')}: faltan bienes raíces o F29/F50. El agente recomienda repetir la captura.`,
    affected: sinDatos.length,
    action: 'Reabrir corrida SII',
  },
  {
    id: 'capacidad',
    dimension: 'Crediticio',
    tone: 'positive',
    title: `Capacidad hipotecaria agregada: ${formatMoneyMillions(portfolioTotals.totalMortgage)} mensuales`,
    body: `Suma del límite 25% de la RFN de los ${portfolioTotals.clients} clientes del portafolio. Valor referencial del método.`,
    affected: portfolioTotals.clients,
    action: 'Priorizar ofertas hipotecarias',
  },
  {
    id: 'crecimiento',
    dimension: 'Económico',
    tone: 'review',
    title: 'Dos clientes con señales por revisar',
    body: 'Valentina Rojas cayó 6% en ingresos. Inmobiliaria Andes creció 42%, pero acumula 3 advertencias y sigue en revisión.',
    affected: 2,
    action: 'Pedir validación analista',
  },
]
