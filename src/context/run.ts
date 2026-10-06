import { createContext, useContext } from 'react'
import type { Consent, Report, RunStatus } from '../types'

export interface RunError {
  message: string
  code?: string
  correlationId?: string
  retryable: boolean
}

export interface RunContextValue {
  runId: string | null
  consent: Consent | null
  run: RunStatus | null
  // Disponible desde que termina el F22 (preliminar) y definitivo al completar.
  report: Report | null
  error: RunError | null
  startRun: (id: string, consent?: Consent | null) => void
  resetRun: () => void
  cancelRun: () => void
  retry: () => void
}

export const RunContext = createContext<RunContextValue | null>(null)

export function useRun() {
  const ctx = useContext(RunContext)
  if (!ctx) throw new Error('useRun debe usarse dentro de RunProvider')
  return ctx
}

// Un análisis parcial también se muestra, con sus fuentes faltantes a la vista.
export function isRunReady(run: RunStatus | null) {
  return run?.status === 'COMPLETED' || run?.status === 'PARTIAL'
}

export function isRunStopped(run: RunStatus | null) {
  return run !== null && run.status !== 'RUNNING' && !isRunReady(run)
}
