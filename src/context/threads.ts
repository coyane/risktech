import { createContext, useContext } from 'react'
import type { InsightStatus, ThreadMessage } from '../types'

export interface ThreadsState {
  threads: Record<string, ThreadMessage[]>
  status: Record<string, InsightStatus>
}

export interface ThreadsActions {
  append: (insightId: string, messages: ThreadMessage[]) => void
  setStatus: (insightId: string, status: InsightStatus) => void
  reset: (insightId: string) => void
  clear: () => void
}

export const ThreadsStateContext = createContext<ThreadsState | null>(null)
export const ThreadsActionsContext = createContext<ThreadsActions | null>(null)

export function useThreads() {
  const ctx = useContext(ThreadsStateContext)
  if (!ctx) throw new Error('useThreads debe usarse dentro de ThreadsProvider')
  return ctx
}

export function useThreadActions() {
  const ctx = useContext(ThreadsActionsContext)
  if (!ctx) throw new Error('useThreadActions debe usarse dentro de ThreadsProvider')
  return ctx
}

export const statusLabel: Record<InsightStatus, string> = {
  nuevo: 'Sin trabajar',
  en_trabajo: 'En trabajo',
  para_revision: 'Para revisión del analista',
  revisado: 'Revisado',
}
