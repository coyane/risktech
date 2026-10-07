import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ComingSoon } from '../components/ComingSoon'
import { FilterChips } from '../components/FilterChips'
import { InsightCard } from '../components/InsightCard'
import { RunGate } from '../components/RunGate'
import { statusLabel, useThreads } from '../context/threads'
import { methodAlerts } from '../lib/icred'
import { REPORT_PATH, reportAnchor } from '../lib/routes'
import type { InsightStatus, Report, RunStatus } from '../types'

const dimensions = ['Todos', 'Económico', 'Financiero', 'Crediticio', 'Tributario']

const statusClass: Record<InsightStatus, string> = {
  nuevo: 'tag-idle',
  en_trabajo: 'tag-neutral',
  para_revision: 'tag-review',
  revisado: 'tag-positive',
}

export function AnalysisPage() {
  return <RunGate>{(report, run) => <AnalysisReady report={report} run={run} />}</RunGate>
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
      <ComingSoon />
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
          <Link to={REPORT_PATH} className="btn btn-primary">
            Ver el Diagnóstico Base
          </Link>
        </div>
      </header>

      {(run.status === 'PARTIAL' || pendingSources.length > 0) && (
        <section className="banner banner-warn" role="status">
          <strong>{run.status === 'PARTIAL' ? 'Análisis parcial.' : 'Cobertura incompleta.'}</strong>{' '}
          {pendingSources.map((item) => `${item.label}: ${item.note}`).join(' ')}{' '}
          <Link to={reportAnchor('fuentes')}>Ver fuentes y cobertura</Link>
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
                    <Link to={reportAnchor(insight.anchor)} className="btn-link">
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
