import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FilterChips } from '../components/FilterChips'
import { InsightCard } from '../components/InsightCard'
import { ErrorNotice, Notice } from '../components/Notice'
import { AgentLog, ProgressMeter, StatusLine, StepList } from '../components/RunViews'
import { StatTile } from '../components/StatTile'
import { isRunReady, isRunStopped, useRun } from '../context/run'
import { statusLabel, useThreads } from '../context/threads'
import { formatAt, formatMoney } from '../lib/format'
import { methodAlerts } from '../lib/icred'
import type { InsightStatus, Report, RunState, RunStatus } from '../types'

const dimensions = ['Todos', 'Económico', 'Financiero', 'Crediticio', 'Tributario']

const stoppedCopy: Partial<Record<RunState, { title: string; text: string }>> = {
  BLOCKED_CAPTCHA: {
    title: 'El SII pide una verificación adicional',
    text: 'Apareció un CAPTCHA al iniciar sesión. El agente no evade ese control: detuvo la captura y no leyó ningún dato.',
  },
  BLOCKED_MFA: {
    title: 'El SII pide un segundo factor',
    text: 'El SII solicitó una verificación en dos pasos. El agente no evade ese control: detuvo la captura y no leyó ningún dato.',
  },
  AUTH_FAILED: {
    title: 'El SII rechazó tus credenciales',
    text: 'Revisa tu RUT y tu clave tributaria antes de volver a intentarlo. No se reintenta automáticamente para no bloquear tu cuenta.',
  },
  SOURCE_CHANGED: {
    title: 'El portal del SII cambió',
    text: 'Una página del SII no coincide con la que el agente conoce. La captura se detuvo para no publicar datos mal leídos.',
  },
  QUARANTINED: {
    title: 'Los datos quedaron en revisión',
    text: 'La captura terminó, pero no pasó los controles de calidad. Un analista debe revisarla antes de mostrar el análisis.',
  },
  CANCELLED: {
    title: 'Cancelaste la captura',
    text: 'El agente dejó de leer tu información en el SII. No se generó un análisis.',
  },
  EXPIRED: {
    title: 'La sesión con el SII expiró',
    text: 'La captura tardó más que la sesión autorizada. Vuelve a conectar para repetirla.',
  },
  FAILED: {
    title: 'La captura no se pudo completar',
    text: 'Ocurrió un error mientras el agente leía tu información en el SII.',
  },
}

export function AnalysisPage() {
  const { runId, run, report, error, retry } = useRun()

  if (!runId) {
    return (
      <Notice
        title="No hay un análisis en curso"
        text="Conecta tu cuenta del SII para que el agente arme tu diagnóstico."
      >
        <Link to="/" className="btn btn-primary">
          Conectar con el SII
        </Link>
      </Notice>
    )
  }
  if (error) return <ErrorNotice error={error} onRetry={retry} />
  if (run && isRunStopped(run)) return <RunStopped run={run} />

  return run && isRunReady(run) && report ? (
    <AnalysisReady report={report} run={run} />
  ) : (
    <AnalysisRunning run={run} report={report} />
  )
}

const statusClass: Record<InsightStatus, string> = {
  nuevo: 'tag-idle',
  en_trabajo: 'tag-neutral',
  para_revision: 'tag-review',
  revisado: 'tag-positive',
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

function AnalysisRunning({ run, report }: { run: RunStatus | null; report: Report | null }) {
  const { cancelRun } = useRun()
  const runningIndex = run ? run.steps.findIndex((step) => step.state === 'running') : -1
  const lastYear = report?.financial.at(-1)

  return (
    <>
      <header className="page-head">
        <div className="page-head-text">
          <StatusLine done={false} text="Inicio del análisis" />
          <h1>Estoy leyendo tu información en el SII</h1>
          <p className="page-lead">
            Puedes dejar esta pantalla abierta. Cuando termine, cada hallazgo queda listo para
            trabajarlo con el agente.
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
                <h2>Primeros hallazgos</h2>
                <div className="card-note">Preliminares, con F22</div>
              </div>
              <div className="stat-grid">
                <StatTile
                  label={`Ingresos ${formatAt(lastYear.year)}`}
                  value={formatMoney(lastYear.totalOrigins)}
                  mono
                />
                <StatTile label="RFN mensual" value={formatMoney(lastYear.rfnMonthly)} mono />
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}

function AnalysisReady({ report, run }: { report: Report; run: RunStatus }) {
  const { threads, status } = useThreads()
  const [dimension, setDimension] = useState('Todos')

  const insights =
    dimension === 'Todos'
      ? report.insights
      : report.insights.filter((item) => item.dimension === dimension)
  const alerts = methodAlerts(report)
  const pendingSources = report.taxpayer.sources.filter(
    (item) => item.status === 'partial' || item.status === 'failed',
  )

  const capturedAt = new Date(report.taxpayer.capturedAt).toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">
            Sección de análisis · actualizado {capturedAt} · reglas {report.method.release}
          </div>
          <h1>Análisis de apertura</h1>
          <p className="page-lead">
            El agente ya leyó tu información. Abre cualquier hallazgo para ver de dónde nace,
            hacerle preguntas y simular escenarios.
          </p>
        </div>
        <div className="page-actions">
          <Link to="/" className="btn">
            Nueva captura
          </Link>
          <Link to="/numeros" className="btn btn-primary">
            Revisar los números
          </Link>
        </div>
      </header>

      {(run.status === 'PARTIAL' || pendingSources.length > 0) && (
        <section className="banner banner-warn" role="status">
          <strong>{run.status === 'PARTIAL' ? 'Análisis parcial.' : 'Cobertura incompleta.'}</strong>{' '}
          {pendingSources.map((item) => `${item.label}: ${item.note}`).join(' ')}{' '}
          <Link to="/numeros#fuentes">Ver fuentes y cobertura</Link>
        </section>
      )}

      <section className="dark-card">
        <h2 className="label-caps">Resumen del análisis</h2>
        <p className="summary">{report.summary}</p>
      </section>

      <section className="grid-auto" aria-label="Indicadores clave">
        {report.kpis.map((kpi) =>
          kpi.insightId ? (
            <Link key={kpi.label} to={`/analisis/hallazgo/${kpi.insightId}`} className="kpi kpi-button">
              <span className="kpi-label">{kpi.label}</span>
              <span className="kpi-value">{kpi.value}</span>
              <span className="kpi-note">{kpi.note}</span>
              <span className="kpi-hint">Ver de dónde sale →</span>
            </Link>
          ) : (
            <div key={kpi.label} className="kpi">
              <span className="kpi-label">{kpi.label}</span>
              <span className="kpi-value">{kpi.value}</span>
              <span className="kpi-note">{kpi.note}</span>
            </div>
          ),
        )}
      </section>

      <section className="stack">
        <div className="section-head">
          <h2>Hallazgos</h2>
          <FilterChips
            label="Filtrar por dimensión"
            options={dimensions}
            value={dimension}
            onChange={setDimension}
          />
        </div>
        {insights.length === 0 ? (
          <div className="card empty">Sin hallazgos en esta dimensión.</div>
        ) : (
          <div className="insight-grid">
            {insights.map((insight) => {
              const state = status[insight.id] ?? 'nuevo'
              const questions = (threads[insight.id] ?? []).filter((item) => item.role === 'user').length
              return (
                <InsightCard
                  key={insight.id}
                  dimension={insight.dimension}
                  tone={insight.tone}
                  title={insight.title}
                  body={insight.body}
                >
                  <div className="insight-state">
                    <span className={`tag ${statusClass[state]}`}>{statusLabel[state]}</span>
                    <span className="mono insight-source">
                      {questions > 0
                        ? `${questions} pregunta${questions === 1 ? '' : 's'}`
                        : insight.source}
                    </span>
                  </div>
                  <div className="insight-actions">
                    <Link
                      to={`/analisis/hallazgo/${insight.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      {questions > 0 ? 'Seguir trabajando' : 'Trabajar con el agente'}
                    </Link>
                    <Link to={`/numeros#${insight.anchor}`} className="btn-link">
                      Ver tabla
                    </Link>
                  </div>
                </InsightCard>
              )
            })}
          </div>
        )}
      </section>

      {(alerts.length > 0 || report.recommendations.length > 0) && (
        <div className="row">
          {alerts.length > 0 && (
            <section className="card stack col-half">
              <div>
                <h2>Alertas del método</h2>
                <div className="card-note">Reglas del Capítulo IV aplicadas a los códigos del F22</div>
              </div>
              <ul className="alert-list">
                {alerts.map((alert) => (
                  <li key={alert.id}>
                    <strong>{alert.title}</strong>
                    <p>{alert.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {report.recommendations.length > 0 && (
            <section className="card stack col-half">
              <div>
                <h2>Antes de incrementar deuda</h2>
                <div className="card-note">Diagnóstico cualitativo del método</div>
              </div>
              <ul className="check-list">
                {report.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <div className="footnote">
        Los indicadores son referenciales y no constituyen una decisión tributaria ni crediticia:
        requieren revisión profesional. {report.warnings.join(' ')}
      </div>
    </>
  )
}
