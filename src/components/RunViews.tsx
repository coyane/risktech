import type { StepState } from '../types'

const stepLabels: Record<StepState, string> = {
  done: 'Listo',
  running: 'Leyendo',
  queued: 'En cola',
  error: 'Error',
}

export function StatusLine({ done, text }: { done: boolean; text: string }) {
  return (
    <div className={`status-line${done ? ' done' : ''}`}>
      <span className={`status-dot${done ? '' : ' pulse'}`} aria-hidden="true" />
      {text}
    </div>
  )
}

export function ProgressMeter({ label, value }: { label: string; value: number }) {
  const percent = Math.round(value * 100)
  return (
    <div className="progress-box">
      <div className="mono muted progress-label">{label}</div>
      <div
        className="progress"
        role="progressbar"
        aria-label="Avance del agente"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export function StepList({
  steps,
}: {
  steps: readonly { key: string; title: string; detail: string; state: StepState }[]
}) {
  return (
    <ol className="step-list">
      {steps.map((step, index) => (
        <li className="step" key={step.key}>
          <div
            className={`step-dot ${step.state}${step.state === 'running' ? ' pulse' : ''}`}
            aria-hidden="true"
          >
            {step.state === 'done' ? '✓' : index + 1}
          </div>
          <div className="step-body">
            <div className="step-head">
              <div className="step-title">{step.title}</div>
              <div className={`step-state ${step.state}`}>{stepLabels[step.state]}</div>
            </div>
            <div className="step-detail">{step.detail}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function AgentLog({
  title,
  entries,
}: {
  title: string
  entries: readonly { t: string; text: string }[]
}) {
  return (
    <section className="dark-card">
      <h2 className="label-caps">{title}</h2>
      <div className="log" role="log" aria-label={title}>
        {entries.map((entry) => (
          <div className="log-row" key={entry.t + entry.text}>
            <div className="mono log-time">{entry.t}</div>
            <div>{entry.text}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
