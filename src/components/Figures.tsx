import type { ReactNode } from 'react'

// Cifras principales de una página, con la misma forma que las del Diagnóstico Base.
export function Figures({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="hero hero-figures" aria-label={label}>
      {children}
    </section>
  )
}

// Si la cifra trae unidad ("UF"), la unidad va más chica para que el número no se corte.
export function Figure({ label, value, note, unit }: { label: string; value: string; note?: string; unit?: string }) {
  return (
    <div className="hero-item hero-static">
      <span className="hero-question">{label}</span>
      <span className="hero-value">
        {value}
        {unit && <span className="hero-unit"> {unit}</span>}
      </span>
      {note && <span className="hero-name">{note}</span>}
    </div>
  )
}
