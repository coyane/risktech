// Verificación del informe de deudas de la CMF por su código QR.
// Contrato del backend (aún no existe), simulado aquí como la extracción en api.ts.
// Detalle para quien construya el backend: docs/contrato-verificacion-informe-deudas.md.
import type { StepState } from '../types'
import { readSession, writeSession } from './storage'

// Estados de un trabajo de verificación. RUNNING mientras avanza; los demás son finales.
// NO_QR, NOT_CMF y MISMATCH son del documento: se rechaza. SERVICE_ERROR no es del documento:
// se puede reintentar.
export type DebtCheckStatus = 'RUNNING' | 'VERIFIED' | 'NO_QR' | 'NOT_CMF' | 'MISMATCH' | 'SERVICE_ERROR' | 'CANCELLED'
export type DebtRejection = 'NO_QR' | 'NOT_CMF' | 'MISMATCH'

export const DEBT_CHECK_STEPS = ['LEER_PDF', 'BUSCAR_QR', 'VALIDAR_CMF'] as const
export type DebtCheckStepKey = (typeof DEBT_CHECK_STEPS)[number]

export interface DebtCheck {
  id: string
  status: DebtCheckStatus
  steps: { key: DebtCheckStepKey; state: StepState }[]
  // Fecha y hora de la verificación (ISO 8601), solo con VERIFIED.
  verifiedAt: string | null
  // true mientras la verificación es una simulación de la demo.
  simulated: boolean
  correlationId: string
}

export const isRejection = (status: DebtCheckStatus): status is DebtRejection =>
  status === 'NO_QR' || status === 'NOT_CMF' || status === 'MISMATCH'

export const isFinal = (status: DebtCheckStatus) => status !== 'RUNNING'

// ---------- Simulación de la demo ----------

// Escenarios con ?demo=<nombre>, como los de la extracción. Se recuerdan en la sesión del
// navegador porque la dirección pierde el parámetro al pasar de la conexión al informe.
export const debtDemoScenarios = ['deuda-sin-qr', 'deuda-no-cmf', 'deuda-no-coincide', 'deuda-servicio'] as const
export type DebtDemoScenario = (typeof debtDemoScenarios)[number]

const SCENARIO_KEY = 'innovacred.mock.deuda'
const STEP_MS = 1000

export const DEBT_CHECK_SIMULATED = true

function readScenario(): DebtDemoScenario | null {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get('demo')
  if (value !== null) writeSession(SCENARIO_KEY, debtDemoScenarios.find((item) => item === value) ?? null)
  return readSession<DebtDemoScenario | null>(SCENARIO_KEY, null)
}

// Lee el escenario al cargar la aplicación, cuando la dirección todavía trae ?demo=.
readScenario()

// En qué paso se detiene cada escenario y con qué estado.
const stops: Record<DebtDemoScenario, { at: number; status: DebtCheckStatus }> = {
  'deuda-sin-qr': { at: 1, status: 'NO_QR' },
  'deuda-no-cmf': { at: 2, status: 'NOT_CMF' },
  'deuda-no-coincide': { at: 2, status: 'MISMATCH' },
  'deuda-servicio': { at: 2, status: 'SERVICE_ERROR' },
}

interface MockCheck {
  startedAt: number
  stop: { at: number; status: DebtCheckStatus } | null
  cancelled: boolean
}

const checks = new Map<string, MockCheck>()
// El servicio simulado falla solo la primera vez: "Reintentar" lleva a verificado.
let serviceFailed = false

const makeId = () => `deuda_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

// POST /informe-deudas/verificaciones (multipart, con el PDF). Devuelve el trabajo.
// En la demo el archivo no sale del navegador: no se usa.
export async function verifyDebtReport(_file: File): Promise<{ id: string }> {
  const scenario = readScenario()
  let stop = scenario ? stops[scenario] : null
  if (scenario === 'deuda-servicio') {
    if (serviceFailed) stop = null
    serviceFailed = true
  }
  const id = makeId()
  checks.set(id, { startedAt: Date.now(), stop, cancelled: false })
  return { id }
}

// GET /informe-deudas/verificaciones/{id}
export async function getDebtVerification(id: string): Promise<DebtCheck> {
  const check = checks.get(id)
  const correlationId = `corr_${id.slice(-8)}`
  if (!check) throw new Error('Verificación desconocida')
  const total = DEBT_CHECK_STEPS.length
  const elapsed = Math.min(Math.floor((Date.now() - check.startedAt) / STEP_MS), total)
  const stopped = check.stop !== null && elapsed >= check.stop.at
  const done = stopped && check.stop ? check.stop.at : elapsed

  let status: DebtCheckStatus = done >= total ? 'VERIFIED' : 'RUNNING'
  if (check.cancelled && status === 'RUNNING') status = 'CANCELLED'
  else if (stopped && check.stop) status = check.stop.status

  const steps = DEBT_CHECK_STEPS.map((key, index) => {
    let state: StepState = index < done ? 'done' : index === done ? 'running' : 'queued'
    if (state === 'running' && status !== 'RUNNING') state = stopped ? 'error' : 'queued'
    return { key, state }
  })

  return {
    id,
    status,
    steps,
    verifiedAt: status === 'VERIFIED' ? new Date(check.startedAt + total * STEP_MS).toISOString() : null,
    simulated: DEBT_CHECK_SIMULATED,
    correlationId,
  }
}

// DELETE /informe-deudas/verificaciones/{id}: cancela y descarta el archivo.
export async function cancelDebtVerification(id: string): Promise<void> {
  const check = checks.get(id)
  if (check) check.cancelled = true
}
