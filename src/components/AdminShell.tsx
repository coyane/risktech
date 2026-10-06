import { Link, NavLink } from 'react-router-dom'
import { useRun } from '../context/run'
import { portfolioTotals } from '../data/portfolio'
import { ShellFrame } from './ShellFrame'

const titles = {
  '/admin': 'Clientes',
  '/admin/radiografia': 'Radiografía',
  '/admin/agente': 'Agente portafolio',
}
const linkClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`

export function AdminShell() {
  const { runId, startRun } = useRun()

  return (
    <ShellFrame
      navLabel="Administración"
      mark="R"
      name="Risktech"
      titles={titles}
      footer={
        <>
          <strong>Consola admin</strong>
          <span>Portafolio demo · {portfolioTotals.clients} clientes</span>
        </>
      }
    >
      <div className="nav-links">
        <div className="nav-sub-title">Administración</div>
        <NavLink to="/admin" end className={linkClass}>
          Clientes
        </NavLink>
        <NavLink to="/admin/radiografia" className={linkClass}>
          Radiografía
        </NavLink>
        <NavLink to="/admin/agente" className={linkClass}>
          Agente portafolio
        </NavLink>
      </div>
      <div className="nav-sub">
        <div className="nav-sub-title">Vista cliente</div>
        <Link
          to="/analisis"
          onClick={() => {
            if (!runId) startRun('demo')
          }}
        >
          Ver caso de ejemplo
        </Link>
      </div>
    </ShellFrame>
  )
}
