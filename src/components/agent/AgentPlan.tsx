import { useState } from 'react'
import type { PlanStep } from '../../types'

// Plan del agente: los pasos que sigue (o siguió) para llegar a una respuesta.
// `active` es el índice del paso en curso; null significa que ya terminó.
export function AgentPlan({
  title,
  steps,
  active = null,
  defaultOpen = false,
}: {
  title: string
  steps: PlanStep[]
  active?: number | null
  defaultOpen?: boolean
}) {
  const running = active !== null
  const [open, setOpen] = useState(defaultOpen)
  const [detail, setDetail] = useState<Record<string, boolean>>({})
  const expanded = open || running
  const done = running ? active : steps.length

  return (
    <div className="plan">
      <button
        type="button"
        className="plan-head"
        aria-expanded={expanded}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={`plan-bolt${running ? ' pulse' : ''}`} aria-hidden="true" />
        <span className="plan-title">{title}</span>
        <span className="plan-count">
          {done}/{steps.length}
        </span>
        <span className={`plan-chevron${expanded ? ' open' : ''}`} aria-hidden="true">
          ›
        </span>
      </button>

      {expanded && (
        <ol className="plan-list">
          {steps.map((step, index) => {
            const state = !running || index < active ? 'done' : index === active ? 'running' : 'pending'
            const hasDetail = Boolean(step.detail || step.tools?.length)
            const showDetail = detail[step.id] ?? (defaultOpen && !running)
            return (
              <li key={step.id} className={`plan-step ${state}`}>
                <button
                  type="button"
                  className="plan-row"
                  aria-expanded={hasDetail ? showDetail : undefined}
                  disabled={!hasDetail}
                  onClick={() => setDetail((prev) => ({ ...prev, [step.id]: !showDetail }))}
                >
                  <span className="plan-status" aria-hidden="true">
                    {state === 'done' ? '✓' : ''}
                  </span>
                  <span className="plan-step-title">{step.title}</span>
                  <span className="sr-only">
                    {state === 'done' ? ' (listo)' : state === 'running' ? ' (en curso)' : ' (pendiente)'}
                  </span>
                </button>
                {showDetail && hasDetail && (
                  <div className="plan-detail">
                    {step.detail && <p>{step.detail}</p>}
                    {step.tools && step.tools.length > 0 && (
                      <div className="plan-tools">
                        {step.tools.map((tool) => (
                          <span key={tool} className="plan-tool">
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
