import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { readSession, removeSession, writeSession } from '../lib/storage'
import { SessionContext, type Role } from './session'

const SESSION_KEY = 'ceft.session.v1'

// Sesión de demo: solo ordena la navegación por rol. No es autenticación;
// el control de acceso real debe resolverlo el backend.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => readSession<Role | null>(SESSION_KEY, null))

  const signIn = useCallback((next: Role) => {
    writeSession(SESSION_KEY, next)
    setRole(next)
  }, [])

  const signOut = useCallback(() => {
    removeSession(SESSION_KEY)
    setRole(null)
  }, [])

  const value = useMemo(() => ({ role, signIn, signOut }), [role, signIn, signOut])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
