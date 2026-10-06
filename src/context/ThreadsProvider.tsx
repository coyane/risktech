import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { readSession, writeSession } from '../lib/storage'
import type { InsightStatus, ThreadMessage } from '../types'
import { ThreadsActionsContext, ThreadsStateContext, type ThreadsState } from './threads'

const THREADS_KEY = 'ceft.threads.v1'
const EMPTY: ThreadsState = { threads: {}, status: {} }

// Una conversación con el agente por hallazgo, guardada durante la sesión.
export function ThreadsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ThreadsState>(() => readSession(THREADS_KEY, EMPTY))

  useEffect(() => {
    writeSession(THREADS_KEY, state)
  }, [state])

  const append = useCallback((insightId: string, messages: ThreadMessage[]) => {
    setState((prev) => ({
      threads: {
        ...prev.threads,
        [insightId]: [...(prev.threads[insightId] ?? []), ...messages],
      },
      status: {
        ...prev.status,
        [insightId]: prev.status[insightId] ?? 'en_trabajo',
      },
    }))
  }, [])

  const setStatus = useCallback((insightId: string, status: InsightStatus) => {
    setState((prev) => ({ ...prev, status: { ...prev.status, [insightId]: status } }))
  }, [])

  const reset = useCallback((insightId: string) => {
    setState((prev) => {
      const threads = { ...prev.threads }
      const status = { ...prev.status }
      delete threads[insightId]
      delete status[insightId]
      return { threads, status }
    })
  }, [])

  const clear = useCallback(() => setState(EMPTY), [])

  const actions = useMemo(
    () => ({ append, setStatus, reset, clear }),
    [append, setStatus, reset, clear],
  )

  return (
    <ThreadsActionsContext.Provider value={actions}>
      <ThreadsStateContext.Provider value={state}>{children}</ThreadsStateContext.Provider>
    </ThreadsActionsContext.Provider>
  )
}
