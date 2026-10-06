import type { ReactNode } from 'react'
import type { RunError } from '../context/run'

export function Notice({
  title,
  text,
  children,
}: {
  title: string
  text?: string
  children?: ReactNode
}) {
  return (
    <section className="notice">
      <h1>{title}</h1>
      {text && <p className="muted">{text}</p>}
      {children && <div className="notice-actions">{children}</div>}
    </section>
  )
}

export function ErrorNotice({ error, onRetry }: { error: RunError; onRetry: () => void }) {
  return (
    <section className="notice notice-error" role="alert">
      <h1>No pudimos cargar el análisis</h1>
      <p>{error.message}</p>
      {error.retryable ? (
        <div className="notice-actions">
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      ) : (
        <p className="muted">Este error no se resuelve reintentando. Contacta a soporte.</p>
      )}
      {(error.code || error.correlationId) && (
        <p className="mono notice-ref">
          {[error.code, error.correlationId].filter(Boolean).join(' · ')}
        </p>
      )}
    </section>
  )
}

export function EmptyState({ text }: { text: string }) {
  return <div className="empty">{text}</div>
}
