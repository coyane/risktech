import { Link, NavLink, useLocation } from 'react-router-dom'
import { isRunReady, useRun } from '../context/run'
import { useSession } from '../context/session'
import { VIEWS, resolvePlace } from '../lib/reportViews'
import { ANALYSIS_PATH, REPORT_PATH, reportAnchor } from '../lib/routes'
import { useHash } from '../lib/useHash'
import { ShellFrame } from './ShellFrame'

const titles = { [ANALYSIS_PATH]: 'Análisis', [REPORT_PATH]: 'Diagnóstico Base' }
const linkClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`

export function AppShell() {
  const { run, report } = useRun()
  const { role } = useSession()
  const { pathname } = useLocation()
  const ready = isRunReady(run) && report !== null
  const { hash } = useHash()
  const current = resolvePlace(hash).view

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
        <NavLink to={REPORT_PATH} className={linkClass}>
          Diagnóstico Base
        </NavLink>
        <NavLink to={ANALYSIS_PATH} className={linkClass}>
          Análisis con el agente
          <span className="nav-soon">Próximamente</span>
        </NavLink>
      </div>
      {pathname === REPORT_PATH && ready && (
        <div className="nav-sub nav-sections">
          <div className="nav-sub-title">En este informe</div>
          {VIEWS.map((view) => (
            <Link key={view.id} to={reportAnchor(view.id)} aria-current={view.id === current ? 'page' : undefined}>
              {view.label}
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
