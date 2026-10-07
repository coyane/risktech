import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AgentPlan } from '../components/agent/AgentPlan'
import { Avatar, Message } from '../components/agent/Message'
import { ComingSoon } from '../components/ComingSoon'
import { ErrorNotice, Notice } from '../components/Notice'
import { isRunReady, useRun } from '../context/run'
import { statusLabel, useThreadActions, useThreads } from '../context/threads'
import {
  matchQuestion,
  playbooks,
  thinkingSteps,
  type Ctx,
  type Playbook,
  type Question,
} from '../data/insightPlaybooks'
import { scrollBehavior } from '../lib/dom'
import { reportAnchor } from '../lib/routes'
import type {
  FinancialYear,
  Insight,
  InsightStatus,
  InsightTone,
  Proposal,
  Report,
  ThreadMessage,
} from '../types'

const toneLabels: Record<InsightTone, string> = {
  positive: 'Positivo',
  neutral: 'Atención',
  review: 'Por validar',
}

const statusClass: Record<InsightStatus, string> = {
  nuevo: 'tag-idle',
  en_trabajo: 'tag-neutral',
  para_revision: 'tag-review',
  revisado: 'tag-positive',
}

const STEP_MS = 650
const NEXT_MS = 700
const makeId = () => `m_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function InsightPage() {
  const { insightId = '' } = useParams()
  const { run, report, error, retry } = useRun()

  if (error) return <ErrorNotice error={error} onRetry={retry} />
  if (!isRunReady(run) || !report) {
    return (
      <Notice title="El análisis aún no está listo" text="Los hallazgos aparecen cuando el agente termina.">
        <Link to="/analisis" className="btn btn-primary">
          Ver el avance
        </Link>
      </Notice>
    )
  }

  const insight = report.insights.find((item) => item.id === insightId)
  const playbook = playbooks[insightId]
  const first = report.financial[0]
  const last = report.financial.at(-1)
  if (!insight || !playbook || !first || !last) {
    return (
      <Notice title="No encontré ese hallazgo" text="Puede que pertenezca a otro análisis.">
        <Link to="/analisis" className="btn btn-primary">
          Volver al análisis
        </Link>
      </Notice>
    )
  }

  // La clave reinicia el estado local al cambiar de hallazgo.
  return (
    <Workspace
      key={insight.id}
      insight={insight}
      playbook={playbook}
      report={report}
      first={first}
      last={last}
    />
  )
}

interface Pending {
  question: Question | null
  userText: string
  steps: ReturnType<typeof thinkingSteps>
  step: number
}

const toPending = (question: Question | null, userText: string): Pending => ({
  question,
  userText,
  steps: thinkingSteps(question?.tools ?? ['Guiones del demo']),
  step: 0,
})

function Workspace({
  insight,
  playbook,
  report,
  first,
  last,
}: {
  insight: Insight
  playbook: Playbook
  report: Report
  first: FinancialYear
  last: FinancialYear
}) {
  const ctx = useMemo<Ctx>(() => ({ report, first, last }), [report, first, last])
  const { threads, status: statuses } = useThreads()
  const { append, setStatus, reset } = useThreadActions()
  const [pending, setPending] = useState<Pending | null>(null)
  const [queue, setQueue] = useState<string[]>([])
  const [input, setInput] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)

  const origin = playbook.origin(ctx)
  const messages = threads[insight.id] ?? []
  const status = statuses[insight.id] ?? 'nuevo'
  const asked = new Set(messages.map((message) => message.text))
  const suggestions = playbook.questions.filter((question) => !asked.has(question.label))
  const busy = pending !== null || queue.length > 0

  const start = (question: Question | null, userText: string) => {
    setPending(toPending(question, userText))
  }

  // Avanza el plan del agente paso a paso y, al terminar, guarda pregunta y respuesta.
  useEffect(() => {
    if (!pending) return
    const timer = window.setTimeout(() => {
      if (pending.step < pending.steps.length - 1) {
        setPending({ ...pending, step: pending.step + 1 })
        return
      }
      const at = new Date().toISOString()
      const user: ThreadMessage = { id: makeId(), role: 'user', at, text: pending.userText }
      const answer = pending.question?.answer(ctx)
      const agent: ThreadMessage = answer
        ? {
            id: makeId(),
            role: 'agent',
            at,
            plan: { title: 'Cómo lo respondí', steps: pending.steps },
            ...answer,
          }
        : {
            id: makeId(),
            role: 'agent',
            at,
            fallback: true,
            text: `Todavía no tengo una respuesta preparada para eso: en este demo aún no estoy conectado a un modelo. Sobre este hallazgo sí puedo responder: ${playbook.questions.map((item) => item.label).join(' ')}`,
          }
      append(insight.id, [user, agent])
      setPending(null)
    }, STEP_MS)
    return () => window.clearTimeout(timer)
  }, [pending, ctx, playbook, insight.id, append])

  // Reproduce un caso de uso: lanza la siguiente pregunta de la cola.
  useEffect(() => {
    if (pending || queue.length === 0) return
    const timer = window.setTimeout(() => {
      const [nextId, ...rest] = queue
      const question = playbook.questions.find((item) => item.id === nextId)
      setQueue(rest)
      if (question) setPending(toPending(question, question.label))
    }, NEXT_MS)
    return () => window.clearTimeout(timer)
  }, [pending, queue, playbook])

  // Mantiene a la vista lo último de la conversación sin mover la página.
  useEffect(() => {
    const body = bodyRef.current
    body?.scrollTo({ top: body.scrollHeight, behavior: scrollBehavior() })
  }, [messages.length, pending?.step, pending?.userText])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    start(matchQuestion(playbook, text), text)
  }

  const onProposal = (proposal: Proposal) => {
    if (busy) return
    if (proposal.action.kind === 'review') {
      setStatus(insight.id, 'para_revision')
      append(insight.id, [
        {
          id: makeId(),
          role: 'agent',
          at: new Date().toISOString(),
          text: 'Listo: dejé este hallazgo **marcado para revisión del analista**. Verá esta conversación completa como contexto.',
        },
      ])
    } else if (proposal.action.kind === 'ask') {
      const { questionId } = proposal.action
      const question = playbook.questions.find((item) => item.id === questionId)
      if (question) start(question, question.label)
    }
  }

  return (
    <>
      <ComingSoon />
      <nav className="breadcrumb" aria-label="Ruta">
        <Link to="/analisis">Análisis</Link>
        <span aria-hidden="true">›</span>
        <span>Hallazgo</span>
      </nav>

      <header className="page-head">
        <div className="page-head-text">
          <div className="insight-meta">
            <span className="insight-dimension">{insight.dimension}</span>
            <span className={`tag tag-${insight.tone}`}>{toneLabels[insight.tone]}</span>
            <span className={`tag ${statusClass[status]}`}>{statusLabel[status]}</span>
          </div>
          <h1>{insight.title}</h1>
          <p className="page-lead">{insight.body}</p>
        </div>
        <Link to={reportAnchor(insight.anchor)} className="btn">
          Ver la tabla
        </Link>
      </header>

      <div className="workspace">
        <section className="thread" aria-label="Conversación con el agente">
          <div className="thread-head">
            <Avatar role="agent" />
            <div>
              <div className="thread-title">Agente CEFT</div>
              <div className="thread-sub">
                <span className="thread-live" aria-hidden="true" />
                Trabajando este hallazgo · reglas {ctx.report.method.release}
              </div>
            </div>
          </div>

          <div className="thread-body" ref={bodyRef} role="log" aria-label="Mensajes">
            <div className="msg agent">
              <Avatar role="agent" />
              <div className="msg-content">
                <span className="sr-only">Agente: </span>
                {origin.steps.length > 0 && (
                  <AgentPlan title="Cómo llegué a este hallazgo" steps={origin.steps} defaultOpen />
                )}
                <div className="msg-bubble">
                  <p>{origin.summary}</p>
                  <p className="msg-hint">
                    Pregúntame lo que quieras sobre este hallazgo o elige una de las preguntas de
                    abajo.
                  </p>
                </div>
              </div>
            </div>

            {messages.map((message) => (
              <Message key={message.id} message={message} onProposal={onProposal} />
            ))}

            {pending && (
              <>
                <div className="msg user">
                  <Avatar role="user" />
                  <div className="msg-content">
                    <div className="msg-bubble">
                      <p>{pending.userText}</p>
                    </div>
                  </div>
                </div>
                <div className="msg agent">
                  <Avatar role="agent" />
                  <div className="msg-content">
                    <AgentPlan title="Pensando…" steps={pending.steps} active={pending.step} />
                  </div>
                </div>
              </>
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="thread-suggestions" aria-label="Preguntas sugeridas">
              {suggestions.map((question) => (
                <button
                  key={question.id}
                  type="button"
                  className="chip suggestion"
                  disabled={busy}
                  onClick={() => start(question, question.label)}
                >
                  {question.simulation && <span className="suggestion-tag">Simular</span>}
                  {question.label}
                </button>
              ))}
            </div>
          )}

          <form className="thread-input" onSubmit={onSubmit}>
            <label htmlFor="ask-insight" className="sr-only">
              Pregúntale al agente sobre este hallazgo
            </label>
            <input
              id="ask-insight"
              className="ask-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Pregúntale al agente sobre este hallazgo…"
            />
            <button type="submit" className="btn btn-dark" disabled={busy || !input.trim()}>
              Preguntar
            </button>
          </form>
        </section>

        <aside className="workspace-side">
          <section className="card stack">
            <div>
              <h2>De dónde nace</h2>
              <div className="card-note">{insight.source}</div>
            </div>
            <ul className="evidence">
              {origin.evidence.map((item) => (
                <li key={item.label}>
                  <Link to={reportAnchor(item.anchor)}>
                    <span className="evidence-source">{item.source}</span>
                    <span className="evidence-label">{item.label}</span>
                    <span className="mono evidence-value">{item.value}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {origin.formula && (
              <div className="formula">
                <span className="formula-label">Fórmula</span>
                {origin.formula}
              </div>
            )}
            {origin.pending && (
              <p className="pending-note">
                <span className="tag tag-review">Por validar</span> {origin.pending}
              </p>
            )}
          </section>

          {playbook.useCases.length > 0 && (
            <section className="card stack">
              <div>
                <h2>Casos de uso</h2>
                <div className="card-note">Reproduce una conversación de ejemplo paso a paso</div>
              </div>
              <ul className="use-cases">
                {playbook.useCases.map((useCase) => (
                  <li key={useCase.id}>
                    <button
                      type="button"
                      className="use-case"
                      disabled={busy}
                      onClick={() => setQueue(useCase.steps)}
                    >
                      <span className="use-case-persona">{useCase.persona}</span>
                      <span className="use-case-title">{useCase.title}</span>
                      <span className="use-case-steps">
                        {useCase.steps.length} pasos · Reproducir
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card stack">
            <h2>Estado del hallazgo</h2>
            <div className="side-actions">
              <button
                type="button"
                className="btn btn-sm"
                disabled={status === 'para_revision'}
                onClick={() => setStatus(insight.id, 'para_revision')}
              >
                Marcar para revisión
              </button>
              <button
                type="button"
                className="btn btn-sm"
                disabled={status === 'revisado'}
                onClick={() => setStatus(insight.id, 'revisado')}
              >
                Marcar como revisado
              </button>
              <button
                type="button"
                className="btn-link"
                disabled={busy || (messages.length === 0 && status === 'nuevo')}
                onClick={() => reset(insight.id)}
              >
                Reiniciar conversación
              </button>
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}
