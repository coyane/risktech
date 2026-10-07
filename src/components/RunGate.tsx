import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { isRunReady, isRunStopped, useRun } from '../context/run'
import { formatAt, formatMoney } from '../lib/format'
import type { Report, RunState, RunStatus } from '../types'
import { ErrorNotice, Notice } from './Notice'
import { AgentLog, ProgressMeter, StatusLine, StepList } from './RunViews'
import { StatTile } from './StatTile'

const stoppedCopy: Partial<Record<RunState, { title: string; text: string }>> = {
  BLOCKED_CAPTCHA: {
    title: 'El SII pide una verificación adicional',
    text: 'Apareció un CAPTCHA al iniciar sesión. El sistema no evade ese control: detuvo la captura y no leyó ningún dato.',
  },
  BLOCKED_MFA: {
    title: 'El SII pide un segundo factor',
    text: 'El SII solicitó una verificación en dos pasos. El sistema no evade ese control: detuvo la captura y no leyó ningún dato.',
  },
  AUTH_FAILED: {
    title: 'El SII rechazó tus credenciales',
    text: 'Revisa tu RUT y tu clave tributaria antes de volver a intentarlo. No se reintenta automáticamente para no bloquear tu cuenta.',
  },
  SOURCE_CHANGED: {
    title: 'El portal del SII cambió',
    text: 'Una página del SII no coincide con la que el sistema conoce. La captura se detuvo para no publicar datos mal leídos.',
  },
  QUARANTINED: {
    title: 'Los datos quedaron en revisión',
    text: 'La captura terminó, pero no pasó los controles de calidad. Un analista debe revisarla antes de mostrar el diagnóstico.',
  },
  CANCELLED: {
    title: 'Cancelaste la captura',
    text: 'El sistema dejó de leer tu información en el SII. No se generó un diagnóstico.',
  },
  EXPIRED: {
    title: 'La sesión con el SII expiró',
    text: 'La captura tardó más que la sesión autorizada. Vuelve a conectar para repetirla.',
  },
  FAILED: {
    title: 'La captura no se pudo completar',
    text: 'Ocurrió un error mientras el sistema leía tu información en el SII.',
  },
}

// Muestra la extracción mientras corre y sus estados de falla; cuando el reporte
// está listo, entrega el control a la vista que lo usa.
export function RunGate({ children }: { children: (report: Report, run: RunStatus) => ReactNode }) {
  const { runId, run, report, error, retry } = useRun()

  if (!runId) {
    return (
      <Notice
        title="No hay una captura en curso"
        text="Conecta tu cuenta del SII para generar tu diagnóstico."
      >
        <Link to="/" className="btn btn-primary">
          Conectar con el SII
        </Link>
      </Notice>
    )
  }
  if (error) return <ErrorNotice error={error} onRetry={retry} />
  if (run && isRunStopped(run)) return <RunStopped run={run} />
  if (run && isRunReady(run) && report) return <>{children(report, run)}</>
  return <RunProgress run={run} report={report} />
}

function RunStopped({ run }: { run: RunStatus }) {
  const copy = stoppedCopy[run.status] ?? stoppedCopy.FAILED!
  return (
    <>
      <Notice title={copy.title} text={copy.text}>
        <Link to="/" className="btn btn-primary">
          Volver a conectar
        </Link>
      </Notice>
      {run.message && <p className="form-error notice-wide">{run.message}</p>}
      <section className="card col-step notice-wide">
        <h2>Extracción y cálculo</h2>
        <StepList steps={run.steps} />
      </section>
      <p className="mono notice-ref">
        {run.status} · {run.correlationId}
      </p>
    </>
  )
}

function RunProgress({ run, report }: { run: RunStatus | null; report: Report | null }) {
  const { cancelRun } = useRun()
  const runningIndex = run ? run.steps.findIndex((step) => step.state === 'running') : -1
  const lastYear = report?.financial.at(-1)

  return (
    <>
      <header className="page-head">
        <div className="page-head-text">
          <StatusLine done={false} text="Captura en curso" />
          <h1>Estoy leyendo tu información en el SII</h1>
          <p className="page-lead">
            Puedes dejar esta pantalla abierta. Cuando termine, verás aquí tu Diagnóstico Base.
          </p>
        </div>
        <div className="progress-box">
          <ProgressMeter
            label={run && runningIndex >= 0 ? `Paso ${runningIndex + 1} de ${run.steps.length}` : ''}
            value={run?.progress ?? 0}
          />
          <button type="button" className="btn btn-sm" onClick={cancelRun}>
            Cancelar captura
          </button>
        </div>
      </header>

      <div className="row row-start">
        <section className="card col-step">
          <h2>Extracción y cálculo</h2>
          {run ? <StepList steps={run.steps} /> : <p className="muted">Conectando…</p>}
        </section>

        <div className="col-log">
          <AgentLog title="Bitácora en vivo" entries={run?.log ?? []} />
          {lastYear && (
            <section className="card stack">
              <div className="card-title-row">
                <h2>Primeras cifras</h2>
                <div className="card-note">Preliminares, con F22</div>
              </div>
              <div className="stat-grid">
                <StatTile
                  label={`Ingresos ${formatAt(lastYear.year)}`}
                  value={formatMoney(lastYear.totalOrigins)}
                  mono
                />
                <StatTile
                  label="Ingreso disponible al mes"
                  value={formatMoney(lastYear.rfnMonthly)}
                  mono
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
