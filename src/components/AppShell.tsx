import { useMemo } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useDebtReport } from '../context/debtReport'
import { isRunReady, useRun } from '../context/run'
import { useSession } from '../context/session'
import { countPending } from '../lib/calculos'
import { DEBT_TEXT } from '../lib/informeDeudas'
import { VIEWS, resolvePlace, type ViewId } from '../lib/reportViews'
import { ANALYSIS_PATH, REPORT_PATH, reportAnchor } from '../lib/routes'
import { useHash } from '../lib/useHash'
import { Icon, type IconName } from './Icon'
import { ShellFrame } from './ShellFrame'

const titles = { [ANALYSIS_PATH]: 'Análisis', [REPORT_PATH]: 'Diagnóstico Base' }
const ICONS: Record<ViewId, IconName> = {
  resumen: 'resumen',
  calculos: 'calculos',
  credito: 'credito',
  propiedades: 'propiedades',
  datos: 'datos',
  pendientes: 'pendientes',
  glosario: 'glosario',
  deudas: 'deudas',
}

export function AppShell() {
  const { run, report } = useRun()
  const { role } = useSession()
  const { pathname } = useLocation()
  const ready = isRunReady(run) && report !== null
  const { hash } = useHash()
  const onReport = pathname === REPORT_PATH
  const current = onReport ? resolvePlace(hash).view : null
  const pending = useMemo(() => (report ? countPending(report) : 0), [report])
  const debt = useDebtReport()

  const link = (view: (typeof VIEWS)[number]) => (
    <Link
      key={view.id}
      className="nav-item"
      to={reportAnchor(view.id)}
      aria-current={view.id === current ? 'page' : undefined}
    >
      <Icon name={ICONS[view.id]} />
      {view.label}
      {view.id === 'pendientes' && ready && <span className="nav-count">{pending}</span>}
    </Link>
  )

  return (
    <ShellFrame
      navLabel="Navegación principal"
      titles={titles}
      bare={onReport}
      footer={
        <>
          <strong>{report?.taxpayer.name ?? '—'}</strong>
          <span className="mono">{report?.taxpayer.rut ?? ''}</span>
        </>
      }
      agent={
        <NavLink to={ANALYSIS_PATH} className={({ isActive }) => `nav-link nav-agent${isActive ? ' active' : ''}`}>
          <span className="tag-soon">Próximamente</span>
          <strong>Análisis con el agente</strong>
          <span>Cada hallazgo se podrá abrir para ver de dónde nace, hacerle preguntas y simular escenarios.</span>
        </NavLink>
      }
      mobileBar={
        onReport && ready
          ? (openMenu) => (
              <nav className="tabbar no-print" aria-label="Vistas del informe">
                {VIEWS.filter((view) => view.group === 'diagnostico').map((view) => (
                  <Link
                    key={view.id}
                    to={reportAnchor(view.id)}
                    aria-current={view.id === current ? 'page' : undefined}
                  >
                    <Icon name={ICONS[view.id]} />
                    {view.label}
                  </Link>
                ))}
                <button type="button" onClick={openMenu}>
                  <Icon name="more" />
                  Más
                </button>
              </nav>
            )
          : undefined
      }
    >
      <div className="nav-group">
        <span className="nav-group-title">Diagnóstico</span>
        {ready ? (
          VIEWS.filter((view) => view.group === 'diagnostico').map(link)
        ) : (
          <NavLink to={REPORT_PATH} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon name="resumen" />
            Diagnóstico Base
          </NavLink>
        )}
      </div>
      {ready && (
        <div className="nav-group">
          <span className="nav-group-title">Informe</span>
          {VIEWS.filter((view) => view.group === 'informe').map(link)}
        </div>
      )}
      {ready && (
        <div className="nav-group">
          <span className="nav-group-title">{DEBT_TEXT.navGroup}</span>
          {VIEWS.filter((view) => view.group === 'complementos').map((view) => (
            <Link
              key={view.id}
              className={`nav-item nav-item-extra${debt.file && debt.phase.kind !== 'checking' ? ' is-loaded' : ''}`}
              to={reportAnchor(view.id)}
              aria-current={view.id === current ? 'page' : undefined}
            >
              <Icon name={ICONS[view.id]} />
              <span className="nav-item-text">
                {view.label}
                <span className="nav-item-meta">
                  {debt.phase.kind === 'checking' ? (
                    DEBT_TEXT.navChecking
                  ) : debt.file ? (
                    <>
                      <Icon name="check" size={13} />
                      {DEBT_TEXT.navVerified}
                    </>
                  ) : (
                    DEBT_TEXT.navOptional
                  )}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
      {role === 'admin' && (
        <div className="nav-group">
          <span className="nav-group-title">Equipo interno</span>
          <Link className="nav-item" to="/admin">
            <Icon name="datos" />
            Consola de administración
          </Link>
        </div>
      )}
    </ShellFrame>
  )
}
