// En pantalla el informe se recorre por vistas; en el PDF sale completo y en este mismo orden.
// El fragmento de la URL decide qué se ve, así los enlaces del informe y del agente no cambian.

export type ViewId = 'resumen' | 'calculos' | 'credito' | 'propiedades' | 'datos' | 'pendientes' | 'glosario' | 'deudas'
export type DataTabId = 'renta' | 'mensuales' | 'contribuyente' | 'fuentes'
export type CalcGroupId = 'impuesto' | 'renta' | 'credito' | 'propiedades' | 'contingencias'

// Complementos: documentos que la persona agrega a su carpeta, sin cálculos. No cuentan como pendientes.
export const VIEWS: { id: ViewId; label: string; group: 'diagnostico' | 'informe' | 'complementos' }[] = [
  { id: 'resumen', label: 'Resumen', group: 'diagnostico' },
  { id: 'calculos', label: 'Cálculos', group: 'diagnostico' },
  { id: 'credito', label: 'Crédito', group: 'diagnostico' },
  { id: 'propiedades', label: 'Propiedades', group: 'diagnostico' },
  { id: 'datos', label: 'Datos del SII', group: 'informe' },
  { id: 'pendientes', label: 'Pendientes', group: 'informe' },
  { id: 'glosario', label: 'Glosario', group: 'informe' },
  { id: 'deudas', label: 'Informe de deudas', group: 'complementos' },
]

export const DATA_TABS: { id: DataTabId; label: string }[] = [
  { id: 'renta', label: 'Renta anual (F22)' },
  { id: 'mensuales', label: 'Declaraciones mensuales' },
  { id: 'contribuyente', label: 'Contribuyente' },
  { id: 'fuentes', label: 'Fuentes y cobertura' },
]

// Grupos de la vista Cálculos, en el orden en que dependen unos de otros.
export const CALC_GROUPS: { id: CalcGroupId; title: string; ids: string[] }[] = [
  {
    id: 'impuesto',
    title: 'Renta e impuesto',
    ids: ['total-origenes', 'total-rebajas', 'base-imponible', 'tasa-efectiva', 'bit-uta', 'tramo-55bis', 'tope-55bis', 'tramo-igc'],
  },
  {
    id: 'renta',
    title: 'Renta financiera',
    ids: ['renta-bruta', 'renta-neta', 'rfn-mensual', 'limite-hipotecario', 'cuota-automotriz'],
  },
  { id: 'credito', title: 'Crédito', ids: ['credit-capacity', 'credit-capacity-uf', 'factor-leverage'] },
  {
    id: 'propiedades',
    title: 'Propiedades',
    ids: ['prop-activos', 'prop-patrimonio', 'prop-pasivos', 'ley-20455', 'deuda-institucion', 'plazo-credito', 'leverage-institucion', 'recomendacion-20455'],
  },
  { id: 'contingencias', title: 'Contingencias', ids: ['contingencias'] },
]

export const groupOfCalc = (id: string) => CALC_GROUPS.find((group) => group.ids.includes(id))

// Secciones de la vista Propiedades a las que se puede llegar por enlace.
const PROPERTY_SECTIONS = ['propiedades', 'patrimonio', 'financiamiento', 'inmobiliario', 'datos-propiedades']

// Secciones de datos por su id; las filas llevan el id de su sección como prefijo (origenes-104).
const DATA_SECTIONS: Record<string, DataTabId> = {
  origenes: 'renta',
  rebajas: 'renta',
  base: 'renta',
  ajustes: 'renta',
  f29: 'mensuales',
  actividades: 'contribuyente',
  sociedades: 'contribuyente',
  regimenes: 'contribuyente',
  timbrajes: 'contribuyente',
  'linea-de-tiempo': 'contribuyente',
  fuentes: 'fuentes',
}

export interface Place {
  view: ViewId
  // Cálculo abierto en la vista Cálculos; null deja el grupo en su primer cálculo.
  entry: string | null
  // Grupo de la vista Cálculos.
  group: CalcGroupId
  dataTab: DataTabId
  // Elemento al que hay que llegar dentro de la vista.
  scrollTo: string | null
}

const place = (view: ViewId, extra: Partial<Place> = {}): Place => ({
  view,
  entry: null,
  group: 'impuesto',
  dataTab: 'renta',
  scrollTo: null,
  ...extra,
})

export function resolvePlace(hash: string): Place {
  const id = decodeURIComponent(hash.replace(/^#/, ''))
  if (id === 'financiero') return place('resumen', { scrollTo: id })
  if (id === 'calculos' || id === 'mapa') return place('calculos')
  if (id === 'credito') return place('credito')
  // Todo cálculo, también los de crédito y propiedades, se explica en la vista Cálculos.
  const entry = id.startsWith('calc-') ? id.slice(5) : id === 'contingencias' ? id : null
  const owner = entry ? groupOfCalc(entry) : undefined
  if (entry && owner) return place('calculos', { entry, group: owner.id })
  if (id.startsWith('grupo-')) {
    const group = CALC_GROUPS.find((item) => item.id === id.slice(6))
    if (group) return place('calculos', { group: group.id })
  }
  if (PROPERTY_SECTIONS.includes(id)) {
    const scrollTo = id === 'patrimonio' || id === 'financiamiento' || id === 'inmobiliario' ? (id === 'inmobiliario' ? 'financiamiento' : id) : null
    return place('propiedades', { scrollTo })
  }
  if (id === 'pendientes' || id === 'glosario' || id === 'deudas') return place(id)
  if (id === 'datos') return place('datos')
  if (id.startsWith('datos-')) {
    const tab = DATA_TABS.find((item) => item.id === id.slice(6))
    if (tab) return place('datos', { dataTab: tab.id })
  }
  const section = DATA_SECTIONS[id] ?? DATA_SECTIONS[id.split('-')[0]]
  if (section) return place('datos', { dataTab: section, scrollTo: id })
  return place('resumen')
}
