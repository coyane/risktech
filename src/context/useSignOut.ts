import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRun } from './run'
import { useSession } from './session'
import { useThreadActions } from './threads'

// Cierra la sesión y borra del navegador la corrida y las conversaciones.
export function useSignOut() {
  const navigate = useNavigate()
  const { signOut } = useSession()
  const { resetRun } = useRun()
  const { clear } = useThreadActions()

  return useCallback(() => {
    signOut()
    resetRun()
    clear()
    navigate('/')
  }, [signOut, resetRun, clear, navigate])
}
