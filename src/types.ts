export type StepState = 'done' | 'running' | 'queued' | 'error'

export type InsightTone = 'positive' | 'neutral' | 'review'

// null = no informado por la fuente; 0 = declarado en cero. No son equivalentes.
export type Amount = number | null

export type SourceStatus = 'complete' | 'partial' | 'empty' | 'failed' | 'excluded'

export interface SourceCoverage {
  source: string
  label: string
  status: SourceStatus
  obtained: string[]
  missing: string[]
  note: string
}

export interface Taxpayer {
  rut: string
  name: string
  birthDate: string | null
  // Fecha de inicio de actividades en el SII.
  activityStart: string | null
  capturedAt: string
  sources: SourceCoverage[]
}

export interface Kpi {
  label: string
  value: string
  note: string
  // Hallazgo que explica el indicador y se abre al seleccionarlo.
  insightId?: string
}

export interface Insight {
  id: string
  dimension: string
  tone: InsightTone
  title: string
  body: string
  source: string
  anchor: string
}

export interface CodeSeries {
  code: string
  label: string
  values: Record<number, Amount>
}

export type IncomeOrigin = CodeSeries

// Rebaja a la renta declarada en el F22. No todas tienen código conocido.
export interface Deduction {
  id: string
  code: string | null
  label: string
  values: Record<number, Amount>
}

export interface Company {
  rut: string
  name: string
  // Participación en porcentaje.
  share: number
  since: string
}

export interface TaxRegime {
  code: string
  name: string
  since: string
}

export interface Stamping {
  name: string
  since: string
}

export interface IgcBase {
  base170: Record<number, Amount>
  tax157: Record<number, Amount>
  bracket55bis: Record<number, string>
}

export interface FinancialYear {
  year: number
  totalOrigins: number
  rfb: number
  rfn: number
  rfnMonthly: number
  effectiveRate: number
  bitUta: number
  mortgageLimit: number
}

export type FilingType = 'original' | 'rectificatoria'

export interface F22Return {
  year: number
  folio: string
  filedAt: string
  filingType: FilingType
}

export interface Activity {
  label: string
  code: string
  category: string
  startDate: string
}

export interface Property {
  rol: string
  comuna: string
  region: string
  destino: string
  direccion: string | null
  avaluo: number
  avaluoAfecto: Amount
  avaluoExento: Amount
  contribucion: Amount
  superficieTerreno: Amount
  superficieConstruida: Amount
  // Antecedentes de adquisición y financiamiento de "Mis Bienes" del SII.
  fechaAdquisicion: string | null
  tipoActo: string | null
  precioAdquisicion: Amount
  pagoContado: Amount
  montoFinanciado: Amount
  institucion: string | null
  financiamientoUf: Amount
  enajenacionUf: Amount
  pagoContadoUf: Amount
  // Propiedad habitacional acogida a la Ley 20.455.
  ley20455: boolean
  usoFamiliar: boolean
}

export type PaymentStatus = 'pagado' | 'pendiente' | 'sin_movimiento'

export interface F29Period {
  period: string
  filingType: FilingType
  folio: string
  debit: Amount
  credit: Amount
  ivaDeterminado: Amount
  remanente: Amount
  ppm: Amount
  retenciones: Amount
  // Código 818: vigente desde el período 2026-07; antes no aplica (null).
  liqFactura818: Amount
  total: Amount
  paymentStatus: PaymentStatus
  filedAt: string
}

export interface F50Period {
  period: string
  total: Amount
  filedAt: string
}

export interface MethodParameter {
  key: string
  label: string
  value: string
  status: 'confirmed' | 'pending'
}

export interface MethodFormula {
  indicator: string
  formula: string
  // true si depende de algún parámetro aún no validado.
  pending: boolean
}

export interface IgcBracket {
  label: string
  fromUta: number
  // null = sin tope.
  toUta: number | null
  rate: number
}

export interface UtaRange {
  label: string
  fromUta: number
  // null = sin tope.
  toUta: number | null
  // El tope pertenece a este rango ("hasta 90 UTA") y no al siguiente.
  toInclusive?: boolean
}

export interface Method {
  release: string
  // Códigos de orígenes de renta que no cuentan como renta financiera.
  rfbExcludedCodes: string[]
  // Códigos que se suman a la renta financiera bruta (gasto presunto de honorarios).
  rfbAddCodes: string[]
  // Factor de renta neta según la tasa efectiva del año.
  rfnFactorRule: { rateThreshold: number; factorBelow: number; factorFrom: number }
  utaByYear: Record<number, number>
  bracket55bis: UtaRange[]
  igcBrackets: IgcBracket[]
  // Rebaja máxima de intereses del Art. 55 bis: tope en UTA y fórmula del tramo intermedio.
  interest55bis: { capUta: number; fullUntilUta: number; zeroFromUta: number; constant: number; slope: number }
  leverageFactors: number[]
  // Tabla de Credit Capacity: plazos en años y rango de tasas anuales.
  creditTable: { years: number[]; rateFrom: number; rateTo: number; rateStep: number }
  uf: { value: number; date: string }
  mortgageFactor: number
  autoFactor: number
  mortgageRate: number
  mortgageYears: number
  autoMonths: number
  parameters: MethodParameter[]
  formulas: MethodFormula[]
  reference: string[]
  adjustments: CodeSeries[]
}

export interface ContingencyYear {
  year: number
  baseDeclared: number
  rentsDeclared: number
  underDeclared: number
  baseAdjusted: number
  bracket: string
  taxAdjusted: number
  taxDifference: number
  igcPaid: number
  netDebit: number
  debitUf: number
  monetaryCorrection: number
  interest: number
  fine: number
  totalDebit: number
}

export interface Contingency {
  rentsReceivedMonthly: number
  rentsShouldDeclare: number
  asOf: string
  years: ContingencyYear[]
  total: number
  proposal: string[]
}

export interface Report {
  taxpayer: Taxpayer
  years: number[]
  summary: string
  kpis: Kpi[]
  insights: Insight[]
  incomeOrigins: IncomeOrigin[]
  igcBase: IgcBase
  financial: FinancialYear[]
  deductions: Deduction[]
  f22Returns: F22Return[]
  companies: Company[]
  regimes: TaxRegime[]
  stampings: Stamping[]
  activities: Activity[]
  properties: Property[]
  f29: F29Period[]
  f50: F50Period[]
  method: Method
  contingency: Contingency | null
  recommendations: string[]
  warnings: string[]
}

export interface ScrapeStepDef {
  key: string
  title: string
  detail: string
}

export interface ScrapeStep extends ScrapeStepDef {
  state: StepState
}

export interface ScrapeLogEntry {
  t: string
  text: string
  step?: number
}

// RUNNING agrupa los estados intermedios del ERS (REQUESTED … PUBLISHED);
// el resto son sus estados terminales o controlados.
export type RunState =
  | 'RUNNING'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'BLOCKED_MFA'
  | 'BLOCKED_CAPTCHA'
  | 'AUTH_FAILED'
  | 'SOURCE_CHANGED'
  | 'QUARANTINED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED'

export interface RunStatus {
  id: string
  status: RunState
  progress: number
  steps: ScrapeStep[]
  log: { t: string; text: string }[]
  message?: string
  correlationId: string
}

export interface Consent {
  id: string
  grantedAt: string
  purpose: string
  sources: string[]
  validity: string
}

// ---------- Mesa de trabajo de un hallazgo ----------

export interface Cite {
  label: string
  // Sección de Números donde está el dato.
  anchor?: string
}

export interface PlanStep {
  id: string
  title: string
  detail?: string
  tools?: string[]
}

export type ProposalAction =
  | { kind: 'link'; to: string }
  | { kind: 'review' }
  | { kind: 'ask'; questionId: string }

export interface Proposal {
  tag: string
  text: string
  label: string
  action: ProposalAction
}

export interface ThreadTable {
  head: string[]
  rows: string[][]
}

export interface ThreadMessage {
  id: string
  role: 'agent' | 'user'
  at: string
  text: string
  // Pasos que siguió el agente para responder.
  plan?: { title: string; steps: PlanStep[] }
  cites?: Cite[]
  table?: ThreadTable
  proposal?: Proposal
  // Respuesta sin guion: el agente aún no está conectado a un modelo.
  fallback?: boolean
}

export type InsightStatus = 'nuevo' | 'en_trabajo' | 'para_revision' | 'revisado'
