import demo from '../data/demo.json'
import type {
  Consent,
  Report,
  RunState,
  RunStatus,
  ScrapeLogEntry,
  ScrapeStepDef,
  StepState,
} from '../types'
import { readSession, writeSession } from './storage'

const STEP_MS = 2500
const RUNS_KEY = 'ceft.mock.runs.v2'
const scrapeSteps = demo.scrapeSteps as ScrapeStepDef[]
const scrapeLog = demo.scrapeLog as (ScrapeLogEntry & { step: number })[]
const report = demo.report as unknown as Report

// Error con la forma application/problem+json del ERS.
export class ApiError extends Error {
  code: string
  correlationId: string
  retryable: boolean

  constructor(code: string, detail: string, correlationId: string, retryable: boolean) {
    super(detail)
    this.name = 'ApiError'
    this.code = code
    this.correlationId = correlationId
    this.retryable = retryable
  }
}

// Escenarios de demo, elegidos con ?demo=<nombre> en la pantalla de login.
export const demoScenarios = ['captcha', 'mfa', 'clave', 'parcial', 'fallo', 'error'] as const
export type DemoScenario = (typeof demoScenarios)[number]

interface MockRun {
  startedAt: number
  scenario: DemoScenario | null
  cancelled: boolean
}

const runs = new Map<string, MockRun>(Object.entries(readSession<Record<string, MockRun>>(RUNS_KEY, {})))
const saveRuns = () => writeSession(RUNS_KEY, Object.fromEntries(runs))
const makeId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export interface ConsentRequest {
  rut: string
  dv: string
  purpose: string
  sources: string[]
}

export async function createConsent(request: ConsentRequest): Promise<Consent> {
  return {
    id: makeId('consent'),
    grantedAt: new Date().toISOString(),
    purpose: request.purpose,
    sources: request.sources,
    validity: 'Solo esta captura',
  }
}

export async function revokeConsent(_consentId: string): Promise<void> {}

export interface RunRequest {
  // RUT canónico del ERS: sin puntos y con el dígito verificador separado.
  rut: string
  dv: string
  password: string
  consentId: string
  sources: string[]
  idempotencyKey: string
  scenario?: DemoScenario | null
}

// Mock: la clave se descarta. El backend real debe definir cómo recibe y
// cuánto tiempo conserva la credencial antes de conectar esto.
export async function createRun(request: RunRequest): Promise<{ id: string }> {
  const id = makeId('run')
  runs.set(id, { startedAt: Date.now(), scenario: request.scenario ?? null, cancelled: false })
  saveRuns()
  return { id }
}

export async function cancelRun(runId: string): Promise<void> {
  const run = runs.get(runId)
  if (!run) return
  run.cancelled = true
  saveRuns()
}

// Paso en el que se detiene cada escenario y con qué estado.
const stops: Partial<Record<DemoScenario, { at: number; status: RunState; message: string }>> = {
  captcha: {
    at: 0,
    status: 'BLOCKED_CAPTCHA',
    message: 'El SII pidió resolver un CAPTCHA al iniciar sesión.',
  },
  mfa: {
    at: 0,
    status: 'BLOCKED_MFA',
    message: 'El SII pidió un segundo factor de autenticación.',
  },
  clave: { at: 0, status: 'AUTH_FAILED', message: 'El SII rechazó el RUT o la clave tributaria.' },
  fallo: {
    at: 2,
    status: 'FAILED',
    message: 'El SII dejó de responder mientras se leía el F29.',
  },
}

export async function getRun(runId: string): Promise<RunStatus> {
  const run = runs.get(runId)
  const correlationId = `corr_${runId.slice(-8)}`
  if (run?.scenario === 'error') {
    throw new ApiError('EXT-001', 'El servicio no respondió a tiempo.', correlationId, true)
  }

  const started = run?.startedAt ?? Date.now() - STEP_MS * scrapeSteps.length
  const elapsed = Math.min(Math.floor((Date.now() - started) / STEP_MS), scrapeSteps.length)
  const stop = run?.scenario ? stops[run.scenario] : undefined
  const stopped = stop !== undefined && elapsed >= stop.at
  const doneCount = stopped ? stop.at : elapsed
  const finished = doneCount >= scrapeSteps.length
  const partial = run?.scenario === 'parcial'

  let status: RunState = finished ? (partial ? 'PARTIAL' : 'COMPLETED') : 'RUNNING'
  let message: string | undefined
  if (run?.cancelled && !finished) {
    status = 'CANCELLED'
  } else if (stopped) {
    status = stop.status
    message = stop.message
  } else if (finished && partial) {
    message = 'No se pudo leer bienes raíces; el resto de las fuentes está completo.'
  }

  const steps = scrapeSteps.map((step, index) => {
    let state: StepState = index < doneCount ? 'done' : index === doneCount ? 'running' : 'queued'
    if (state === 'running' && status !== 'RUNNING') state = stopped ? 'error' : 'queued'
    if (partial && step.key === 'BIENES_RAICES' && index < doneCount) state = 'error'
    return { ...step, state }
  })

  return {
    id: runId,
    status,
    progress: doneCount / scrapeSteps.length,
    steps,
    log: scrapeLog
      .filter((entry) => entry.step <= doneCount)
      .map(({ t, text }) => ({ t, text })),
    message,
    correlationId,
  }
}

export async function getReport(runId?: string): Promise<Report> {
  if (!runId || runs.get(runId)?.scenario !== 'parcial') return report
  return {
    ...report,
    properties: [],
    patrimony: null,
    taxpayer: {
      ...report.taxpayer,
      sources: report.taxpayer.sources.map((item) =>
        item.source === 'BIENES_RAICES'
          ? {
              ...item,
              status: 'failed' as const,
              obtained: [],
              missing: ['Roles vigentes'],
              note: 'La consulta de bienes raíces no respondió; vuelve a capturar para completarla.',
            }
          : item,
      ),
    },
    warnings: ['Análisis parcial: falta la fuente de bienes raíces.', ...report.warnings],
  }
}

export const loginSources = demo.loginSources as { code: string; text: string }[]
export const navSections = demo.navSections as { id: string; label: string }[]
