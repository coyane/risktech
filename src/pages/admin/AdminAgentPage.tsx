import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AskForm } from '../../components/AskForm'
import { FilterChips } from '../../components/FilterChips'
import { InsightCard } from '../../components/InsightCard'
import { AgentLog, ProgressMeter, StatusLine, StepList } from '../../components/RunViews'
import { StatTile } from '../../components/StatTile'
import {
  dominantBracket,
  portfolioClients,
  portfolioInsights,
  portfolioTotals,
} from '../../data/portfolio'
import { formatMoneyMillions } from '../../lib/format'
import type { StepState } from '../../types'

const summary = portfolioTotals
const topDestino = summary.byDestino.toSorted((a, b) => b.count - a.count)[0]
const bodegas = summary.byDestino.find((item) => item.destino === 'Bodega')?.count ?? 0
const sinDatos = portfolioClients.filter((client) => client.status === 'sin_datos').length

const stepDefs = [
  {
    key: 'INGESTA',
    title: 'Leer portafolio',
    detail: `${summary.clients} clientes y ${summary.properties} propiedades`,
  },
  { key: 'TRAMOS', title: 'Clasificar tramos', detail: 'Art. 55 bis, según BIT en UTA' },
  { key: 'PATRIMONIO', title: 'Mapear destinos', detail: 'Habitacional, bodega, comercial…' },
  { key: 'CREDITO', title: 'Agregar capacidad', detail: 'Límite hipotecario 25% RFN' },
  { key: 'HALLAZGOS', title: 'Generar hallazgos', detail: 'Insights cruzados del portafolio' },
]

const logScript = [
  { step: 0, t: '00:03', text: 'Consola admin conectada al portafolio demo' },
  {
    step: 1,
    t: '00:12',
    text: `Tramo ${dominantBracket.bracket} es el más frecuente (${dominantBracket.count} clientes)`,
  },
  { step: 2, t: '00:24', text: `Detecté ${bodegas} bodegas en el portafolio` },
  {
    step: 2,
    t: '00:31',
    text: `${summary.byDestino[0]?.destino ?? '—'} concentra el mayor avalúo fiscal`,
  },
  {
    step: 3,
    t: '00:48',
    text: `Capacidad hipotecaria agregada: ${formatMoneyMillions(summary.totalMortgage)} / mes`,
  },
  {
    step: 4,
    t: '01:05',
    text: `${sinDatos} cliente${sinDatos === 1 ? '' : 's'} sin datos completos de bienes raíces`,
  },
  { step: 5, t: '01:18', text: 'Hallazgos listos para el comité de crédito' },
]

const dimensions = [
  'Todos',
  'Económico',
  'Financiero',
  'Crediticio',
  'Tributario',
  'Patrimonial',
  'Operacional',
]

const POLL_MS = 900
const STEP_MS = 1800

export function AdminAgentPage() {
  const [startedAt] = useState(() => Date.now())
  const [now, setNow] = useState(startedAt)
  const [answer, setAnswer] = useState<string | null>(null)
  const [dimension, setDimension] = useState('Todos')

  const doneCount = Math.min(Math.floor((now - startedAt) / STEP_MS), stepDefs.length)
  const completed = doneCount >= stepDefs.length

  // El reloj se detiene al terminar para no re-renderizar la página indefinidamente.
  useEffect(() => {
    if (completed) return
    const id = window.setInterval(() => setNow(Date.now()), POLL_MS)
    return () => window.clearInterval(id)
  }, [completed])

  const steps = stepDefs.map((step, index) => ({
    ...step,
    state: (index < doneCount ? 'done' : index === doneCount ? 'running' : 'queued') as StepState,
  }))
  const log = logScript.filter((entry) => entry.step <= doneCount)
  const insights =
    dimension === 'Todos'
      ? portfolioInsights
      : portfolioInsights.filter((item) => item.dimension === dimension)

  const onAsk = () => {
    setAnswer(
      `Respuesta de ejemplo (el agente aún no está conectado a un modelo): en el portafolio hay ${summary.clients} clientes, ${summary.properties} propiedades y capacidad hipotecaria agregada de ${formatMoneyMillions(summary.totalMortgage)}. El tramo más frecuente es ${dominantBracket.bracket} y el destino con más roles es ${topDestino?.destino ?? '—'}.`,
    )
  }

  return (
    <>
      <header className="page-head">
        <div className="page-head-text">
          <StatusLine
            done={completed}
            text={completed ? 'Análisis de portafolio listo' : 'El agente está leyendo el portafolio'}
          />
          <h1>
            {completed ? 'Hallazgos transversales del portafolio' : 'Analizando a todos los clientes'}
          </h1>
          <p className="page-lead">
            Cruza tramos, capacidad de crédito y composición patrimonial para el comité.
          </p>
        </div>
        <ProgressMeter
          label={completed ? 'Completado' : `Paso ${doneCount + 1} de ${steps.length}`}
          value={doneCount / stepDefs.length}
        />
      </header>

      <div className="row row-start">
        <section className="card col-step">
          <h2>Pipeline del agente</h2>
          <StepList steps={steps} />
        </section>

        <div className="col-log">
          <AgentLog title="Bitácora del portafolio" entries={log} />
          {doneCount >= 3 && (
            <section className="card stack">
              <h2>Señales tempranas</h2>
              <div className="stat-grid">
                <StatTile
                  label="Tramo dominante"
                  value={`Tramo ${dominantBracket.bracket}`}
                  note={`${dominantBracket.count} clientes`}
                />
                <StatTile
                  label="Destino top"
                  value={topDestino?.destino ?? '—'}
                  note={`${topDestino?.count ?? 0} roles`}
                />
              </div>
              <div className="page-actions">
                <Link to="/admin" className="btn btn-outline">
                  Ver clientes
                </Link>
                <Link to="/admin/radiografia" className="btn">
                  Ver radiografía
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>

      {completed && (
        <>
          <section className="stack">
            <div className="section-head">
              <h2>Hallazgos del portafolio</h2>
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
                {insights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    dimension={insight.dimension}
                    tone={insight.tone}
                    title={insight.title}
                    body={insight.body}
                  >
                    <span className="mono insight-source">
                      {insight.affected} cliente{insight.affected === 1 ? '' : 's'}
                    </span>
                    <span className="insight-action">{insight.action}</span>
                  </InsightCard>
                ))}
              </div>
            )}
          </section>

          <AskForm
            id="ask-portfolio"
            label="Pregúntale al agente del portafolio"
            placeholder="¿Cuántas bodegas hay y quiénes las concentran?"
            onAsk={onAsk}
          >
            {answer && (
              <p className="ask-answer" role="status">
                {answer}
              </p>
            )}
          </AskForm>
        </>
      )}
    </>
  )
}
