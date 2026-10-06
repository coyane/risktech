import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, cancelRun as cancelRunRequest, getReport, getRun } from '../lib/api'
import { readSession, removeSession, writeSession } from '../lib/storage'
import type { Consent, Report, RunStatus } from '../types'
import { isRunReady, RunContext, type RunError } from './run'

const RUN_KEY = 'ceft.run.v2'
const POLL_MS = 1000

interface StoredRun {
  runId: string
  consent: Consent | null
}

export function RunProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredRun | null>(() =>
    readSession<StoredRun | null>(RUN_KEY, null),
  )
  const [run, setRun] = useState<RunStatus | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState<RunError | null>(null)
  const [attempt, setAttempt] = useState(0)
  const runId = stored?.runId ?? null
  const consent = stored?.consent ?? null

  const startRun = useCallback((id: string, nextConsent: Consent | null = null) => {
    const next = { runId: id, consent: nextConsent }
    writeSession(RUN_KEY, next)
    setStored(next)
    setRun(null)
    setReport(null)
    setError(null)
  }, [])

  const resetRun = useCallback(() => {
    removeSession(RUN_KEY)
    setStored(null)
    setRun(null)
    setReport(null)
    setError(null)
  }, [])

  const cancelRun = useCallback(() => {
    if (runId) void cancelRunRequest(runId)
  }, [runId])

  const retry = useCallback(() => {
    setError(null)
    setAttempt((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!runId) return
    let active = true
    let timer: number | undefined
    let loaded: Report | null = null

    const poll = async () => {
      try {
        const next = await getRun(runId)
        if (!active) return
        setRun(next)

        const ready = isRunReady(next)
        const f22Done = next.steps.some((step) => step.key === 'F22' && step.state === 'done')
        if (!loaded && (ready || (next.status === 'RUNNING' && f22Done))) {
          loaded = await getReport(runId)
          if (!active) return
          setReport(loaded)
        }

        if (next.status === 'RUNNING') timer = window.setTimeout(poll, POLL_MS)
      } catch (err) {
        if (!active) return
        setError(
          err instanceof ApiError
            ? {
                message: err.message,
                code: err.code,
                correlationId: err.correlationId,
                retryable: err.retryable,
              }
            : {
                message: err instanceof Error ? err.message : 'No se pudo cargar el análisis',
                retryable: true,
              },
        )
      }
    }

    void poll()
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [runId, attempt])

  const value = useMemo(
    () => ({ runId, consent, run, report, error, startRun, resetRun, cancelRun, retry }),
    [runId, consent, run, report, error, startRun, resetRun, cancelRun, retry],
  )

  return <RunContext.Provider value={value}>{children}</RunContext.Provider>
}
