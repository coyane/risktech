import { Navigate, Outlet } from 'react-router-dom'
import { useSession, type Role } from '../context/session'

export function RequireSession({ role }: { role?: Role }) {
  const session = useSession()
  if (!session.role) return <Navigate to="/" replace />
  if (role === 'admin' && session.role !== 'admin') return <Navigate to="/analisis" replace />
  return <Outlet />
}
