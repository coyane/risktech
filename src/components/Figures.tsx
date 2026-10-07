import type { ReactNode } from 'react'

// Cifras principales de una página, con la misma forma que las del Diagnóstico Base.
export function Figures({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="hero hero-figures" aria-label={label}>
      {children}
    </section>
  )
}

export function Figure({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="hero-item hero-static">
      <span className="hero-question">{label}</span>
      <span className="hero-value">{value}</span>
      {note && <span className="hero-name">{note}</span>}
    </div>
  )
}
