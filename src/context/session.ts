import { createContext, useContext } from 'react'

export type Role = 'client' | 'admin'

export interface SessionValue {
  role: Role | null
  signIn: (role: Role) => void
  signOut: () => void
}

export const SessionContext = createContext<SessionValue | null>(null)

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession debe usarse dentro de SessionProvider')
  return ctx
}
