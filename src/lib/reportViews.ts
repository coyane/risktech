// En pantalla el informe se recorre por vistas; en el PDF sale completo y en este mismo orden.
// El fragmento de la URL decide qué se ve, así los enlaces del informe y del agente no cambian.

export type ViewId = 'resumen' | 'calculos' | 'datos' | 'pendientes' | 'glosario'
export type DataTabId = 'renta' | 'mensuales' | 'propiedades' | 'contribuyente' | 'fuentes'

export const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'calculos', label: 'Cálculos' },
  { id: 'datos', label: 'Datos del SII' },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'glosario', label: 'Glosario' },
]

export const DATA_TABS: { id: DataTabId; label: string }[] = [
  { id: 'renta', label: 'Renta anual (F22)' },
  { id: 'mensuales', label: 'Declaraciones mensuales' },
  { id: 'propiedades', label: 'Propiedades' },
  { id: 'contribuyente', label: 'Contribuyente' },
  { id: 'fuentes', label: 'Fuentes y cobertura' },
]

// Secciones de datos por su id; las filas llevan el id de su sección como prefijo (origenes-104).
const DATA_SECTIONS: Record<string, DataTabId> = {
  origenes: 'renta',
  rebajas: 'renta',
  base: 'renta',
  ajustes: 'renta',
  f29: 'mensuales',
  patrimonio: 'propiedades',
  propiedades: 'propiedades',
  actividades: 'contribuyente',
  sociedades: 'contribuyente',
  regimenes: 'contribuyente',
  timbrajes: 'contribuyente',
  'linea-de-tiempo': 'contribuyente',
  fuentes: 'fuentes',
}

export interface Place {
  view: ViewId
  // Cálculo abierto en la vista Cálculos; null muestra el mapa.
  entry: string | null
  dataTab: DataTabId
  // Elemento al que hay que llegar dentro de la vista.
  scrollTo: string | null
}

const place = (view: ViewId, extra: Partial<Place> = {}): Place => ({
  view,
  entry: null,
  dataTab: 'renta',
  scrollTo: null,
  ...extra,
})

export function resolvePlace(hash: string): Place {
  const id = decodeURIComponent(hash.replace(/^#/, ''))
  if (id === 'financiero') return place('resumen', { scrollTo: id })
  if (id === 'calculos' || id === 'mapa') return place('calculos')
  if (id.startsWith('calc-')) return place('calculos', { entry: id.slice(5) })
  if (id === 'credito') return place('calculos', { entry: 'factor-leverage', scrollTo: id })
  if (id === 'contingencias') return place('calculos', { entry: 'contingencias' })
  if (id === 'inmobiliario') return place('calculos', { entry: 'asiento-apertura' })
  if (id === 'pendientes' || id === 'glosario') return place(id)
  if (id === 'datos') return place('datos')
  if (id.startsWith('datos-')) {
    const tab = DATA_TABS.find((item) => item.id === id.slice(6))
    if (tab) return place('datos', { dataTab: tab.id })
  }
  const section = DATA_SECTIONS[id] ?? DATA_SECTIONS[id.split('-')[0]]
  if (section) return place('datos', { dataTab: section, scrollTo: id })
  return place('resumen')
}
