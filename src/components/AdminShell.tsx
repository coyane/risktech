import { Link, NavLink } from 'react-router-dom'
import { useRun } from '../context/run'
import { portfolioTotals } from '../data/portfolio'
import { REPORT_PATH } from '../lib/routes'
import { Icon } from './Icon'
import { ShellFrame } from './ShellFrame'

const titles = {
  '/admin': 'Propietarios',
  '/admin/radiografia': 'Radiografía',
  '/admin/agente': 'Agente portafolio',
}
const linkClass = ({ isActive }: { isActive: boolean }) => `nav-item nav-link${isActive ? ' active' : ''}`

export function AdminShell() {
  const { runId, startRun } = useRun()

  return (
    <ShellFrame
      contained
      navLabel="Administración"
      titles={titles}
      footer={
        <>
          <strong>Consola admin</strong>
          <span>Portafolio demo · {portfolioTotals.clients} clientes</span>
        </>
      }
    >
      <div className="nav-group">
        <span className="nav-group-title">Administración</span>
        <NavLink to="/admin" end className={linkClass}>
          <Icon name="datos" />
          Propietarios
        </NavLink>
        <NavLink to="/admin/radiografia" className={linkClass}>
          <Icon name="resumen" />
          Radiografía
        </NavLink>
        <NavLink to="/admin/agente" className={linkClass}>
          <Icon name="spark" />
          Agente portafolio
          <span className="nav-soon">Próximamente</span>
        </NavLink>
      </div>
      <div className="nav-group">
        <span className="nav-group-title">Vista cliente</span>
        <Link
          className="nav-item"
          to={REPORT_PATH}
          onClick={() => {
            if (!runId) startRun('demo')
          }}
        >
          <Icon name="arrow" />
          Ver caso de ejemplo
        </Link>
      </div>
    </ShellFrame>
  )
}
