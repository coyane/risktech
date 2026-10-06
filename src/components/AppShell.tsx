import { Link, NavLink, useLocation } from 'react-router-dom'
import { useRun } from '../context/run'
import { useSession } from '../context/session'
import { navSections } from '../lib/api'
import { ShellFrame } from './ShellFrame'

const titles = { '/analisis': 'Análisis', '/numeros': 'Números' }
const linkClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`

export function AppShell() {
  const { report } = useRun()
  const { role } = useSession()
  const { pathname } = useLocation()

  return (
    <ShellFrame
      navLabel="Navegación principal"
      mark="C"
      name="CEFT"
      titles={titles}
      footer={
        <>
          <strong>{report?.taxpayer.name ?? '—'}</strong>
          <span className="mono">{report?.taxpayer.rut ?? ''}</span>
        </>
      }
    >
      <div className="nav-links">
        <NavLink to="/analisis" className={linkClass}>
          Análisis
        </NavLink>
        <NavLink to="/numeros" className={linkClass}>
          Números
        </NavLink>
      </div>
      {pathname === '/numeros' && (
        <div className="nav-sub nav-sections">
          <div className="nav-sub-title">En esta página</div>
          {navSections.map((section) => (
            <Link key={section.id} to={`/numeros#${section.id}`}>
              {section.label}
            </Link>
          ))}
        </div>
      )}
      {role === 'admin' && (
        <div className="nav-sub">
          <div className="nav-sub-title">Equipo interno</div>
          <Link to="/admin">Consola de administración</Link>
        </div>
      )}
    </ShellFrame>
  )
}
